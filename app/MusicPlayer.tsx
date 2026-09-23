"use client";

import Image from "next/image";
import Script from "next/script";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Track } from "./data";

// Deux sources de lecture derrière la même interface :
// - sets SoundCloud : iframe cachée pilotée par l'API Widget officielle ;
// - morceaux MP3 (Vercel Blob) : élément <audio> natif.
type SCWidget = {
  bind(event: string, cb: (e: { currentPosition?: number }) => void): void;
  unbind(event: string): void;
  load(url: string, options: Record<string, unknown>): void;
  play(): void;
  pause(): void;
  toggle(): void;
  seekTo(ms: number): void;
};

declare global {
  interface Window {
    SC?: { Widget: (el: HTMLIFrameElement) => SCWidget };
  }
}

type Tab = "sets" | "productions";

const TAB_LABELS: Record<Tab, string> = { sets: "Sets", productions: "Productions" };

const WIDGET_PARAMS = {
  hide_related: true,
  show_comments: false,
  show_user: false,
  show_reposts: false,
  show_teaser: false,
  visual: false,
  color: "#ff2d6f",
};

function widgetSrc(url: string) {
  const params = new URLSearchParams({ url, auto_play: "false" });
  for (const [k, v] of Object.entries(WIDGET_PARAMS)) params.set(k, String(v));
  return `https://w.soundcloud.com/player/?${params}`;
}

function formatTime(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

function meta(t: Track) {
  return [t.place, t.date].filter(Boolean).join(" · ");
}

// Onde stylisée, déterministe à partir du titre (identique côté serveur et client).
function waveform(seed: string, bars: number) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const rand = () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
  let prev = 0.5;
  return Array.from({ length: bars }, (_, i) => {
    const envelope = 0.55 + 0.45 * Math.sin((i / bars) * Math.PI);
    prev = prev * 0.45 + rand() * 0.55;
    return Math.round((0.18 + 0.82 * prev * envelope) * 100) / 100;
  });
}

export default function MusicPlayer({ sets, productions }: { sets: Track[]; productions: Track[] }) {
  const all = useMemo(() => [...sets, ...productions], [sets, productions]);
  const tabs = (["sets", "productions"] as Tab[]).filter((t) => (t === "sets" ? sets : productions).length > 0);
  const kindOf = useCallback((i: number): Tab => (i < sets.length ? "sets" : "productions"), [sets.length]);
  const firstSC = all.findIndex((t) => t.soundcloud);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const widgetRef = useRef<SCWidget | null>(null);
  const loadedRef = useRef(firstSC === 0 ? 0 : -1);
  const playingRef = useRef(false);
  const currentRef = useRef(0);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  const [scReady, setScReady] = useState(false);
  const [current, setCurrent] = useState(0);
  const [tab, setTab] = useState<Tab>(tabs[0] ?? "sets");
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [durations, setDurations] = useState<Record<number, number>>({});
  const [needsTap, setNeedsTap] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [playerInView, setPlayerInView] = useState(true);

  const track = all[current];
  const bars = useMemo(() => waveform(track?.title ?? "", 64), [track?.title]);
  const durationOf = (i: number) => all[i]?.duration ?? durations[i] ?? 0;
  const duration = durationOf(current);
  const progress = duration ? Math.min(1, position / (duration * 1000)) : 0;
  const canPlay = (i: number) => Boolean(all[i]?.audio) || scReady;

  const playRef = useRef<(i: number) => void>(() => {});

  const onStarted = useCallback(() => {
    playingRef.current = true;
    setPlaying(true);
    setLoading(false);
    setNeedsTap(false);
    setHasPlayed(true);
    if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
  }, []);

  const onStopped = useCallback(() => {
    playingRef.current = false;
    setPlaying(false);
  }, []);

  // Enchaîne sur le suivant de la même liste (sets ou morceaux).
  const onFinished = useCallback(() => {
    onStopped();
    const i = currentRef.current + 1;
    if (i < all.length && kindOf(i) === kindOf(currentRef.current)) playRef.current(i);
  }, [all.length, kindOf, onStopped]);

  // Chaque source n'agit sur l'état que si c'est elle qui est chargée
  // (évite qu'un "pause" SoundCloud tardif écrase la lecture d'un MP3, et inversement).
  const scActive = useCallback(() => Boolean(all[loadedRef.current]?.soundcloud), [all]);
  const audioActive = () => Boolean(all[loadedRef.current]?.audio);

  const bindEvents = useCallback(
    (w: SCWidget) => {
      for (const ev of ["play", "pause", "finish", "playProgress"]) w.unbind(ev);
      w.bind("play", () => scActive() && onStarted());
      w.bind("pause", () => scActive() && onStopped());
      w.bind("finish", () => scActive() && onFinished());
      w.bind("playProgress", (e) => scActive() && setPosition(e.currentPosition ?? 0));
    },
    [scActive, onStarted, onStopped, onFinished],
  );

  const initWidget = useCallback(() => {
    if (widgetRef.current || !iframeRef.current || !window.SC) return;
    const w = window.SC.Widget(iframeRef.current);
    widgetRef.current = w;
    w.bind("ready", () => {
      setScReady(true);
      bindEvents(w);
    });
  }, [bindEvents]);

  // Si le navigateur bloque la lecture pilotée (certains mobiles), on affiche le lecteur SoundCloud.
  const armFallback = () => {
    if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
    fallbackTimer.current = setTimeout(() => {
      if (!playingRef.current) {
        setNeedsTap(true);
        setLoading(false);
      }
    }, 4000);
  };

  const play = (i: number) => {
    const t = all[i];
    const w = widgetRef.current;
    const audio = audioRef.current;
    if (!t || !audio || (t.soundcloud && !w)) return;

    if (i === loadedRef.current) {
      if (t.audio) {
        if (audio.paused) audio.play().catch(onStopped);
        else audio.pause();
      } else {
        if (!playingRef.current) armFallback();
        w!.toggle();
      }
      return;
    }

    const prev = all[loadedRef.current];
    if (prev?.audio) audio.pause();
    if (prev?.soundcloud) w?.pause();
    if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
    setNeedsTap(false);

    loadedRef.current = i;
    currentRef.current = i;
    setCurrent(i);
    setTab(kindOf(i));
    setPosition(0);
    setLoading(true);

    if (t.audio) {
      audio.src = t.audio;
      audio.play().catch(() => {
        onStopped();
        setLoading(false);
      });
    } else if (t.soundcloud) {
      w!.load(t.soundcloud, {
        ...WIDGET_PARAMS,
        auto_play: true,
        callback: () => {
          bindEvents(w!);
          w!.play();
        },
      });
      armFallback();
    }
  };
  playRef.current = play;

  const seek = (fraction: number) => {
    if (!duration || loadedRef.current !== current) return;
    const ms = Math.max(0, Math.min(1, fraction)) * duration * 1000;
    setPosition(ms);
    if (track.audio && audioRef.current) audioRef.current.currentTime = ms / 1000;
    else widgetRef.current?.seekTo(ms);
  };


  useEffect(() => {
    initWidget();
    return () => {
      if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
    };
  }, [initWidget]);

  useEffect(() => {
    const el = playerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => setPlayerInView(entry.isIntersecting), {
      threshold: 0.15,
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Précédent / suivant restent dans la liste du morceau en cours.
  const step = (dir: 1 | -1) => {
    const kind = kindOf(current);
    const start = kind === "sets" ? 0 : sets.length;
    const size = kind === "sets" ? sets.length : productions.length;
    play(start + ((current - start + dir + size) % size));
  };

  const visible = all.map((t, i) => ({ t, i })).filter(({ i }) => kindOf(i) === tab);

  return (
    <>
      {firstSC >= 0 && (
        <Script src="https://w.soundcloud.com/player/api.js" strategy="afterInteractive" onReady={initWidget} />
      )}
      <audio
        ref={audioRef}
        preload="none"
        onPlaying={() => audioActive() && onStarted()}
        onPause={() => audioActive() && onStopped()}
        onEnded={() => audioActive() && onFinished()}
        onWaiting={() => audioActive() && setLoading(true)}
        onTimeUpdate={(e) => audioActive() && setPosition(e.currentTarget.currentTime * 1000)}
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d)) setDurations((prev) => ({ ...prev, [loadedRef.current]: d }));
        }}
      />

      {track && (
        <>
          <div ref={playerRef} className={`player ${playing ? "is-playing" : ""}`}>
            <div className="deck">
              <div className="vinyl" aria-hidden>
                <div className="vinyl-label" style={{ backgroundImage: `url(${track.artwork})` }} />
              </div>
              <div className="cover">
                <Image src={track.artwork} alt={`Pochette — ${track.title}`} fill sizes="(max-width: 640px) 70vw, 340px" />
              </div>
            </div>

            <div className="player-main">
              <p className="now">
                <Equalizer active={playing} />
                {playing ? "En lecture" : "À l’écoute"}
                <span className="now-count">{TAB_LABELS[kindOf(current)]}</span>
              </p>
              <h3 className="track-title">{track.title}</h3>
              <p className="track-meta">{meta(track)}</p>

              <div className="controls">
                <button type="button" className="ctrl" onClick={() => step(-1)} aria-label="Précédent" disabled={!canPlay(current)}>
                  <PrevIcon />
                </button>
                <button
                  type="button"
                  className={`ctrl ctrl-main ${loading ? "is-loading" : ""}`}
                  onClick={() => play(current)}
                  aria-label={playing ? "Pause" : "Lecture"}
                  disabled={!canPlay(current)}
                >
                  {playing ? <PauseIcon /> : <PlayIcon />}
                </button>
                <button type="button" className="ctrl" onClick={() => step(1)} aria-label="Suivant" disabled={!canPlay(current)}>
                  <NextIcon />
                </button>
              </div>

              <div
                className="wave"
                role="slider"
                tabIndex={0}
                aria-label="Position dans le morceau"
                aria-valuemin={0}
                aria-valuemax={Math.floor(duration)}
                aria-valuenow={Math.floor(position / 1000)}
                aria-valuetext={formatTime(position / 1000)}
                onClick={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  seek((e.clientX - r.left) / r.width);
                }}
                onKeyDown={(e) => {
                  if (!duration) return;
                  const delta = 10 / duration;
                  if (e.key === "ArrowRight") seek(progress + delta);
                  if (e.key === "ArrowLeft") seek(progress - delta);
                }}
              >
                {bars.map((v, i) => (
                  <span key={i} className={i / bars.length < progress ? "played" : ""} style={{ height: `${v * 100}%` }} />
                ))}
              </div>
              <div className="times">
                <span>{formatTime(position / 1000)}</span>
                <span>{duration ? formatTime(duration) : "--:--"}</span>
              </div>

              {firstSC >= 0 && (
                <div className={`sc-embed ${needsTap ? "visible" : ""}`}>
                  {needsTap && <p>Ton navigateur bloque la lecture automatique : lance le son depuis le lecteur ci-dessous.</p>}
                  <iframe
                    ref={iframeRef}
                    src={widgetSrc(all[firstSC].soundcloud!)}
                    title="Lecteur SoundCloud"
                    allow="autoplay"
                  />
                </div>
              )}
            </div>
          </div>

          {tabs.length > 1 && (
            <div className="tabs" role="tablist" aria-label="Type de sons">
              {tabs.map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={tab === t}
                  className={`tab ${tab === t ? "active" : ""}`}
                  onClick={() => setTab(t)}
                >
                  {TAB_LABELS[t]}
                  <span className="tab-count">{(t === "sets" ? sets : productions).length}</span>
                </button>
              ))}
            </div>
          )}

          <ol className={`tracklist ${tabs.length > 1 ? "with-tabs" : ""}`}>
            {visible.map(({ t, i }, n) => {
              const active = i === current;
              const d = durationOf(i);
              return (
                <li key={t.soundcloud ?? t.audio}>
                  <button
                    type="button"
                    className={`track-row ${active ? "active" : ""}`}
                    onClick={() => play(i)}
                    disabled={!canPlay(i)}
                    aria-label={`${active && playing ? "Pause" : "Écouter"} ${t.title}`}
                  >
                    <span className="track-num">
                      {active && playing ? <Equalizer active /> : String(n + 1).padStart(2, "0")}
                    </span>
                    <span className="track-thumb">
                      <Image src={t.artwork} alt="" fill sizes="56px" />
                      <span className="track-thumb-icon">{active && playing ? <PauseIcon /> : <PlayIcon />}</span>
                    </span>
                    <span className="track-info">
                      <span className="track-row-title">{t.title}</span>
                      <span className="track-row-meta">{meta(t)}</span>
                    </span>
                    <span className="track-duration">{d ? formatTime(d) : ""}</span>
                  </button>
                </li>
              );
            })}
          </ol>

          <div className={`mini-bar ${hasPlayed && !playerInView ? "show" : ""}`} aria-hidden={!hasPlayed || playerInView}>
            <div className="mini-progress" style={{ transform: `scaleX(${progress})` }} />
            <div className="mini-thumb">
              <Image src={track.artwork} alt="" fill sizes="44px" />
            </div>
            <a href="#musique" className="mini-info">
              <span className="track-row-title">{track.title}</span>
              <span className="track-row-meta">{track.place ?? track.date}</span>
            </a>
            <button type="button" className="ctrl" onClick={() => step(-1)} aria-label="Précédent">
              <PrevIcon />
            </button>
            <button type="button" className="ctrl ctrl-main" onClick={() => play(current)} aria-label={playing ? "Pause" : "Lecture"}>
              {playing ? <PauseIcon /> : <PlayIcon />}
            </button>
            <button type="button" className="ctrl" onClick={() => step(1)} aria-label="Suivant">
              <NextIcon />
            </button>
          </div>
        </>
      )}

    </>
  );
}

function Equalizer({ active }: { active: boolean }) {
  return (
    <span className={`eq ${active ? "active" : ""}`} aria-hidden>
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden fill="currentColor">
      <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden fill="currentColor">
      <rect x="5.5" y="4" width="4.5" height="16" rx="1" />
      <rect x="14" y="4" width="4.5" height="16" rx="1" />
    </svg>
  );
}

function PrevIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden fill="currentColor">
      <rect x="4" y="5" width="2.5" height="14" rx="1" />
      <path d="M20 5.8v12.4a.8.8 0 0 1-1.2.7L8.6 12.7a.8.8 0 0 1 0-1.4l10.2-6.2a.8.8 0 0 1 1.2.7z" />
    </svg>
  );
}

function NextIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden fill="currentColor">
      <rect x="17.5" y="5" width="2.5" height="14" rx="1" />
      <path d="M4 5.8v12.4a.8.8 0 0 0 1.2.7l10.2-6.2a.8.8 0 0 0 0-1.4L5.2 5.1A.8.8 0 0 0 4 5.8z" />
    </svg>
  );
}

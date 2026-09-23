"use client";

import Image from "next/image";
import Script from "next/script";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Track } from "./data";

// Lecture via le widget officiel SoundCloud (iframe cachée pilotée par l'API Widget),
// ce qui permet un design 100 % custom sans héberger les fichiers audio.
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

export default function MusicPlayer({ tracks }: { tracks: Track[] }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const widgetRef = useRef<SCWidget | null>(null);
  const loadedRef = useRef(0);
  const playingRef = useRef(false);
  const currentRef = useRef(0);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  const [ready, setReady] = useState(false);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [needsTap, setNeedsTap] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [playerInView, setPlayerInView] = useState(true);

  const track = tracks[current];
  const bars = useMemo(() => waveform(track.title, 64), [track.title]);
  const progress = Math.min(1, position / (track.duration * 1000));

  const playRef = useRef<(i: number) => void>(() => {});

  const bindEvents = useCallback((w: SCWidget) => {
    for (const ev of ["play", "pause", "finish", "playProgress"]) w.unbind(ev);
    w.bind("play", () => {
      playingRef.current = true;
      setPlaying(true);
      setLoading(false);
      setNeedsTap(false);
      setHasPlayed(true);
      if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
    });
    w.bind("pause", () => {
      playingRef.current = false;
      setPlaying(false);
    });
    w.bind("finish", () => {
      playingRef.current = false;
      setPlaying(false);
      if (currentRef.current < tracks.length - 1) playRef.current(currentRef.current + 1);
    });
    w.bind("playProgress", (e) => setPosition(e.currentPosition ?? 0));
  }, [tracks.length]);

  const initWidget = useCallback(() => {
    if (widgetRef.current || !iframeRef.current || !window.SC) return;
    const w = window.SC.Widget(iframeRef.current);
    widgetRef.current = w;
    w.bind("ready", () => {
      setReady(true);
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
    const w = widgetRef.current;
    if (!w) return;
    if (i === loadedRef.current) {
      if (!playingRef.current) armFallback();
      w.toggle();
      return;
    }
    loadedRef.current = i;
    currentRef.current = i;
    setCurrent(i);
    setPosition(0);
    setLoading(true);
    w.load(tracks[i].soundcloud, {
      ...WIDGET_PARAMS,
      auto_play: true,
      callback: () => {
        bindEvents(w);
        w.play();
      },
    });
    armFallback();
  };
  playRef.current = play;

  const seek = (fraction: number) => {
    const ms = Math.max(0, Math.min(1, fraction)) * track.duration * 1000;
    setPosition(ms);
    widgetRef.current?.seekTo(ms);
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

  const prev = () => play((current - 1 + tracks.length) % tracks.length);
  const next = () => play((current + 1) % tracks.length);

  return (
    <>
      <Script src="https://w.soundcloud.com/player/api.js" strategy="afterInteractive" onReady={initWidget} />

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
            <span className="now-count">
              {String(current + 1).padStart(2, "0")} / {String(tracks.length).padStart(2, "0")}
            </span>
          </p>
          <h3 className="track-title">{track.title}</h3>
          <p className="track-meta">
            {track.place} · {track.date}
          </p>

          <div className="controls">
            <button type="button" className="ctrl" onClick={prev} aria-label="Morceau précédent" disabled={!ready}>
              <PrevIcon />
            </button>
            <button
              type="button"
              className={`ctrl ctrl-main ${loading ? "is-loading" : ""}`}
              onClick={() => play(current)}
              aria-label={playing ? "Pause" : "Lecture"}
              disabled={!ready}
            >
              {playing ? <PauseIcon /> : <PlayIcon />}
            </button>
            <button type="button" className="ctrl" onClick={next} aria-label="Morceau suivant" disabled={!ready}>
              <NextIcon />
            </button>
          </div>

          <div
            className="wave"
            role="slider"
            tabIndex={0}
            aria-label="Position dans le morceau"
            aria-valuemin={0}
            aria-valuemax={track.duration}
            aria-valuenow={Math.floor(position / 1000)}
            aria-valuetext={formatTime(position / 1000)}
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              seek((e.clientX - r.left) / r.width);
            }}
            onKeyDown={(e) => {
              const step = 10 / track.duration;
              if (e.key === "ArrowRight") seek(progress + step);
              if (e.key === "ArrowLeft") seek(progress - step);
            }}
          >
            {bars.map((v, i) => (
              <span
                key={i}
                className={i / bars.length < progress ? "played" : ""}
                style={{ height: `${v * 100}%` }}
              />
            ))}
          </div>
          <div className="times">
            <span>{formatTime(position / 1000)}</span>
            <span>{formatTime(track.duration)}</span>
          </div>

          <div className={`sc-embed ${needsTap ? "visible" : ""}`}>
            {needsTap && <p>Ton navigateur bloque la lecture automatique : lance le son depuis le lecteur ci-dessous.</p>}
            <iframe
              ref={iframeRef}
              src={widgetSrc(tracks[0].soundcloud)}
              title="Lecteur SoundCloud"
              allow="autoplay"
              loading="eager"
            />
          </div>
        </div>
      </div>

      <ol className="tracklist">
        {tracks.map((t, i) => {
          const active = i === current;
          return (
            <li key={t.soundcloud}>
              <button
                type="button"
                className={`track-row ${active ? "active" : ""}`}
                onClick={() => play(i)}
                disabled={!ready}
                aria-label={`${active && playing ? "Pause" : "Écouter"} ${t.title}`}
              >
                <span className="track-num">
                  {active && playing ? <Equalizer active /> : String(i + 1).padStart(2, "0")}
                </span>
                <span className="track-thumb">
                  <Image src={t.artwork} alt="" fill sizes="56px" />
                  <span className="track-thumb-icon">{active && playing ? <PauseIcon /> : <PlayIcon />}</span>
                </span>
                <span className="track-info">
                  <span className="track-row-title">{t.title}</span>
                  <span className="track-row-meta">
                    {t.place} · {t.date}
                  </span>
                </span>
                <span className="track-duration">{formatTime(t.duration)}</span>
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
          <span className="track-row-meta">{track.place}</span>
        </a>
        <button type="button" className="ctrl" onClick={prev} aria-label="Morceau précédent">
          <PrevIcon />
        </button>
        <button type="button" className="ctrl ctrl-main" onClick={() => play(current)} aria-label={playing ? "Pause" : "Lecture"}>
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button type="button" className="ctrl" onClick={next} aria-label="Morceau suivant">
          <NextIcon />
        </button>
      </div>
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

import Image from "next/image";
import MusicPlayer from "./MusicPlayer";
import { bio, contact, influences, mainGenres, otherGenres, shows, tracks } from "./data";

const nav = [
  { href: "#bio", label: "Bio" },
  { href: "#musique", label: "Musique" },
  { href: "#style", label: "Style" },
  { href: "#shows", label: "Shows" },
  { href: "#contact", label: "Booking" },
];

function SectionHeader({ title, index }: { title: string; index: string }) {
  return (
    <header className="section-header">
      <h2>{title}</h2>
      <span className="section-index">{index}</span>
    </header>
  );
}

export default function Home() {
  return (
    <>
      <nav className="topbar">
        <a href="#top" className="topbar-logo">
          Kespo
        </a>
        <ul>
          {nav.map((item) => (
            <li key={item.href}>
              <a href={item.href}>{item.label}</a>
            </li>
          ))}
        </ul>
      </nav>

      <main>
        <section id="top" className="hero">
          <div className="hero-media">
            <Image
              src="/kespo-glass-club.jpg"
              alt="Kespo aux platines au Glass Club, Cannes"
              fill
              priority
              sizes="(min-width: 900px) 70vw, 100vw"
              className="hero-img"
            />
          </div>
          <div className="hero-overlay" />
          <div className="hero-content">
            <p className="eyebrow">
              <span className="dot" /> Press Kit 2026
            </p>
            <h1 className="glow">Kespo</h1>
            <p className="tagline">
              <span className="line" /> DJ — House · Tech House · Acid
            </p>
            <div className="hero-actions">
              <a href="#contact" className="btn btn-primary">
                Booking
              </a>
              <a href="#musique" className="btn">
                Écouter
              </a>
            </div>
          </div>
        </section>

        <section id="bio" className="section">
          <SectionHeader title="About Kespo" index="01 — Bio" />
          <figure className="photo-frame">
            <Image
              src="/kespo-loupika-lyon.jpg"
              alt="Kespo en live au Loupika, Lyon"
              width={1800}
              height={686}
              sizes="(max-width: 1000px) 100vw, 1000px"
            />
            <figcaption>Live — Loupika, Lyon</figcaption>
          </figure>
          <div className="bio">
            {bio.map((p) => (
              <p key={p.slice(0, 20)}>{p}</p>
            ))}
          </div>
        </section>

        <section id="musique" className="section">
          <SectionHeader title="Listen" index="02 — Musique" />
          <MusicPlayer tracks={tracks} />
          <a href={contact.soundcloud} target="_blank" rel="noopener noreferrer" className="more-link">
            Tous les sets sur SoundCloud →
          </a>
        </section>

        <section id="style" className="section">
          <SectionHeader title="Sound Identity" index="03 — Style" />
          <h3 className="label">Genres</h3>
          <ul className="tags">
            {mainGenres.map((g) => (
              <li key={g} className="tag tag-filled">
                {g}
              </li>
            ))}
            {otherGenres.map((g) => (
              <li key={g} className="tag">
                {g}
              </li>
            ))}
          </ul>
          <h3 className="label">Influences</h3>
          <ul className="list two-cols">
            {influences.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </section>

        <section id="shows" className="section">
          <SectionHeader title="Behind the Decks" index="04 — Shows" />
          <h3 className="label">Past &amp; Upcoming</h3>
          <ul className="list two-cols shows">
            {shows.map((s) => (
              <li key={s.venue}>
                <span>{s.venue}</span>
                <span className="city">{s.city}</span>
              </li>
            ))}
          </ul>
        </section>

        <section id="contact" className="section">
          <SectionHeader title="Booking & Contact" index="05 — Contact" />
          <h3 className="label">Direct</h3>
          <ul className="list contact-list">
            <li>
              <a href={contact.phoneHref}>
                <PhoneIcon /> {contact.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${contact.email}?subject=Booking%20Kespo`}>
                <MailIcon /> {contact.email}
              </a>
            </li>
          </ul>
          <h3 className="label">Socials</h3>
          <ul className="list contact-list">
            <li>
              <a href={contact.instagram} target="_blank" rel="noopener noreferrer">
                <InstagramIcon /> Instagram — {contact.handle}
              </a>
            </li>
            <li>
              <a href={contact.soundcloud} target="_blank" rel="noopener noreferrer">
                <SoundCloudIcon /> SoundCloud — {contact.handle}
              </a>
            </li>
          </ul>
          <a href="/kespo-press-kit-2026.pdf" download className="btn btn-primary presskit-btn">
            Télécharger le press kit (PDF)
          </a>
        </section>
      </main>

      <footer className="footer">
        <p className="footer-logo glow">Kespo</p>
        <div className="footer-bar">
          <span>DJ — House / Tech House / Acid</span>
          <span className="spaced">Press Kit — 2026</span>
        </div>
      </footer>
    </>
  );
}

const iconProps = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function PhoneIcon() {
  return (
    <svg {...iconProps}>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg {...iconProps}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg {...iconProps}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

function SoundCloudIcon() {
  return (
    <svg {...iconProps}>
      <path d="M2 14v3M5 11v6M8 9v8M11 7v10" />
      <path d="M14 7.5a5 5 0 0 1 5 4.5 3 3 0 0 1 0 5h-5z" />
    </svg>
  );
}

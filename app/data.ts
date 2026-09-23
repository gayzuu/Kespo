export const contact = {
  phone: "+33 6 74 58 10 34",
  phoneHref: "tel:+33674581034",
  email: "djkespo@gmail.com",
  instagram: "https://www.instagram.com/xkespo/",
  soundcloud: "https://soundcloud.com/xkespo",
  handle: "@xkespo",
};

export const bio = [
  "Kespo est un DJ et Producteur du sud de la France, connu pour son mélange éclectique de house, jazz house et techno mélodique. Il a débuté dans le milieu des raves et des Free Party, d’abord attiré par la trance progressive.",
  "Son style a pris un tournant après avoir découvert la culture de l’after au Bar-Live à Montpellier, où il a développé un goût pour la minimal, ce qui l’a amené à jouer régulièrement au Pingo After.",
  "La rencontre avec d’anciens membres du collectif St Germain est un moment clé qui l’oriente vers des sonorités house et jazz. Depuis, il a participé à des événements dans plusieurs endroits d’Europe tout en continuant à jouer à travers la France, apportant un mélange doux de beats profonds et mélodiques à ses sets.",
];

export type Track = {
  title: string;
  /** Lieu du set, ou sous-titre (ex. "Original Mix") pour un morceau */
  place?: string;
  date: string;
  /** Durée en secondes (optionnelle pour un MP3 : lue automatiquement) */
  duration?: number;
  /** Pochette carrée */
  artwork: string;
} & (
  | { /** Lien public SoundCloud */ soundcloud: string; audio?: never }
  | { /** URL du fichier audio (Vercel Blob) */ audio: string; soundcloud?: never }
);

// Sets : hébergés sur Vercel Blob (`audio`) ou SoundCloud (`soundcloud`), dans l'ordre d'affichage.
// Pochette SoundCloud : remplacer "-large" par "-t500x500" dans l'URL.
const blob = "https://jubhmivctmup1alc.public.blob.vercel-storage.com/music";

export const sets: Track[] = [
  {
    title: "Afro Tech",
    place: "Glass, Cannes",
    date: "2025",
    duration: 5547,
    audio: `${blob}/kespo-afro-tech-glass.m4a`,
    artwork: `${blob}/gon6.jpg`,
  },
  {
    title: "Sunny House",
    place: "Annex Beach, Cannes",
    date: "Février 2024",
    duration: 2124,
    soundcloud: "https://soundcloud.com/xkespo/label-france-contest",
    artwork: "https://i1.sndcdn.com/artworks-WVO2HuBwGwcbUsck-YygplQ-t500x500.jpg",
  },
  {
    title: "Live Set — House",
    place: "Loop",
    date: "Mai 2023",
    duration: 3904,
    soundcloud: "https://soundcloud.com/xkespo/house-mix-zodiak-brussels",
    artwork: "https://i1.sndcdn.com/artworks-LmI9gAdDEq7GCEZ6-57jdKQ-t500x500.jpg",
  },
  {
    title: "House Groove",
    place: "Son des Guitares, Cannes",
    date: "Avril 2023",
    duration: 3317,
    soundcloud: "https://soundcloud.com/xkespo/house-sdg",
    artwork: "https://i1.sndcdn.com/artworks-tBBG47N2C6UWKL4E-W8nMeg-t500x500.jpg",
  },
];

// Productions : fichiers audio hébergés sur Vercel Blob (`npm run upload -- fichier.mp3` donne l'URL).
// Exemple :
// {
//   title: "Nom du morceau",
//   place: "Original Mix",
//   date: "2026",
//   audio: "https://xxxx.public.blob.vercel-storage.com/music/nom-du-morceau.mp3",
//   artwork: "https://xxxx.public.blob.vercel-storage.com/music/nom-du-morceau.jpg",
// },
export const productions: Track[] = [
  {
    title: "AcidZoo",
    date: "2026",
    audio: `${blob}/kespo-acidzoo.m4a`,
    artwork: `${blob}/kespo-acidzoo.jpg`,
  },
];

export const mainGenres = ["Tech House", "House", "Minimal"];
export const otherGenres = ["Disco House", "House Jazz", "Acid", "Deep House", "Lounge"];

export const influences = [
  "St Germain",
  "Kolter",
  "Fabe",
  "Anotr",
  "Djibouti",
  "Bellaire",
  "Funk Cartel",
];

export const shows = [
  { venue: "Nubel", city: "Madrid" },
  { venue: "Annex Beach", city: "Cannes" },
  { venue: "Son des Guitares", city: "Cannes" },
  { venue: "Glass", city: "Cannes" },
  { venue: "Perlone", city: "Nice" },
  { venue: "Festival Temps d’un Été", city: "Nice" },
  { venue: "Carlton Hotel & Beach", city: "Cannes" },
  { venue: "Plages Électro", city: "Cannes" },
  { venue: "Maat Club", city: "Nice" },
  { venue: "Halles de la Villette", city: "Paris" },
  { venue: "Radisson Blu", city: "Bangkok" },
  { venue: "Loupika", city: "Lyon" },
  { venue: "Zodiak", city: "Bruxelles" },
  { venue: "GreenFest", city: "Avignon" },
  { venue: "Pingo After", city: "Avignon" },
  { venue: "Villa Rouge", city: "Montpellier" },
  { venue: "Nuits Sonores", city: "Lyon" },
  { venue: "L’Antre", city: "Nice" },
];

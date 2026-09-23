# Kespo — site DJ

Site vitrine de Kespo (DJ House · Tech House · Acid), en Next.js (App Router).

## Développement

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:3000.

## Modifier le contenu

Tout le texte (bio, sons, genres, influences, dates, contacts) est dans `app/data.ts`.
Les photos et le press kit PDF sont dans `public/`.

## Déploiement

Importer le repo sur Vercel : le framework Next.js est détecté automatiquement, aucune configuration nécessaire.

## Ajouter un son

Deux sources, un seul player (onglets « Sets » et « Morceaux » dans la section Musique).

**Sets → SoundCloud**
1. Publier le set sur SoundCloud (en public).
2. Ajouter une entrée en haut de `sets` dans `app/data.ts` (titre, lieu, date, durée en secondes, lien SoundCloud, pochette).

**Morceaux → Vercel Blob**
1. Une seule fois : sur Vercel, onglet Storage du projet → Create → Blob, puis le relier au projet.
   Récupérer le token en local : `npx vercel link` puis `npx vercel env pull .env.local`.
2. Envoyer le MP3 et sa pochette (JPG carré, ~1000×1000) :
   `npm run upload -- ~/Musique/mon-morceau.mp3 ~/Musique/mon-morceau.jpg`
3. Ajouter une entrée en haut de `productions` dans `app/data.ts` avec les deux URL affichées (`audio` et `artwork`).
   La durée est lue automatiquement.

L'onglet « Morceaux » apparaît dès qu'il y a au moins un morceau.

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

Les sons sont hébergés sur SoundCloud et lus via un player custom (API Widget SoundCloud).
1. Publier le son sur SoundCloud (en public).
2. Ajouter une entrée en haut de `tracks` dans `app/data.ts` : titre, lieu, date, durée en secondes, lien SoundCloud et pochette.

// Envoie un fichier (MP3, pochette…) sur Vercel Blob et affiche son URL publique.
// Usage : npm run upload -- chemin/vers/mon-morceau.mp3 [chemin/vers/pochette.jpg …]
// Nécessite BLOB_READ_WRITE_TOKEN dans .env.local (récupérable avec `npx vercel env pull`).
import { readFile } from "node:fs/promises";
import { basename, extname } from "node:path";
import { put } from "@vercel/blob";

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("Usage : npm run upload -- fichier.mp3 [pochette.jpg …]");
  process.exit(1);
}
if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error("BLOB_READ_WRITE_TOKEN manquant : lance `npx vercel env pull` après avoir relié le Blob store au projet.");
  process.exit(1);
}

const slug = (name) =>
  name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-|-$/g, "");

for (const file of files) {
  const ext = extname(file);
  const name = `music/${slug(basename(file, ext))}${ext.toLowerCase()}`;
  const blob = await put(name, await readFile(file), { access: "public", addRandomSuffix: false, allowOverwrite: true });
  console.log(`${basename(file)} → ${blob.url}`);
}

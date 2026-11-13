#!/usr/bin/env node
// Rewrites the studio list on /learning-studios/ from access-practice-lab/src/studio-app.js, the one list of the
// Learning Studios app's pages. The list sits between the markers below; everything else on the page is authored.
// `node tools/sync-learning-studios.mjs` writes it; tools/studio-app-listing.test.mjs fails when the page drifts.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { STUDIO_APP_PAGES } from "../access-practice-lab/src/studio-app.js";

export const PAGE = new URL("../learning-studios/index.html", import.meta.url);
const MARKED = /<!-- studio-app-list -->[\s\S]*?<!-- \/studio-app-list -->/;
const esc = (text) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const bare = (title) => title.replace(/ · (Learning Studios|Estudios de aprendizaje)$/, "");

const GROUPS = [
  { sections: ["practice", "play"], en: "Studios and games", es: "Estudios y juegos" },
  {
    sections: ["teach", "family"],
    en: "For teachers and families",
    es: "Para docentes y familias",
  },
];

export function renderList() {
  const groups = GROUPS.map((group) => {
    const items = STUDIO_APP_PAGES.filter((page) => group.sections.includes(page.section))
      .map(
        (page) =>
          `          <li><a href="${page.path}">${esc(bare(page.title[0]))}</a> <span class="es" lang="es">· ${esc(bare(page.title[1]))}</span><br />${esc(page.text[0])}</li>`,
      )
      .join("\n");
    return `        <h3>${esc(group.en)} <span class="es" lang="es">· ${esc(group.es)}</span></h3>\n        <ul class="all">\n${items}\n        </ul>`;
  }).join("\n");
  return `<!-- studio-app-list -->\n${groups}\n        <!-- /studio-app-list -->`;
}

export function withList(html) {
  if (!MARKED.test(html))
    throw new Error("learning-studios/index.html: studio-app-list markers not found");
  return html.replace(MARKED, () => renderList());
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const html = readFileSync(PAGE, "utf8");
  const next = withList(html);
  if (next !== html) writeFileSync(PAGE, next);
  console.log(
    next === html ? "learning-studios: list already current" : "learning-studios: list updated",
  );
}

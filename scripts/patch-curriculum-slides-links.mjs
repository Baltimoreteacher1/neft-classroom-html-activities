/**
 * Patch hand-maintained curriculum/index.html so Google Slides pills point at
 * reference-matched /lessons/{id}/slides.html (with optional Drive legacy copy).
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const curriculumPath = join(root, "curriculum", "index.html");
const urlsPath = join(root, "data", "google-slides-urls.json");

let googleSlidesUrls = {};
if (existsSync(urlsPath)) {
  googleSlidesUrls = JSON.parse(readFileSync(urlsPath, "utf8"));
  delete googleSlidesUrls._note;
}

let html = readFileSync(curriculumPath, "utf8");
let primaryPatched = 0;
let legacyAdded = 0;

html = html.replace(
  /(<div class="res-row">([\s\S]*?))<a class="res" href="https:\/\/docs\.google\.com\/presentation\/[^"]+">Google Slides<\/a\s*>/g,
  (match, prefix, rowContent) => {
    const idMatch = rowContent.match(/\/lessons\/([0-9]+-[0-9]+(?:-flagship)?)\//);
    if (!idMatch) return match;

    const lessonId = idMatch[1];
    const slidesHref = `/lessons/${lessonId}/slides.html`;
    const legacyUrl = googleSlidesUrls[lessonId];
    primaryPatched += 1;

    let replacement =
      `${prefix}<a class="res" href="${slidesHref}">Google Slides</a>`;

    if (legacyUrl && !rowContent.includes(legacyUrl)) {
      legacyAdded += 1;
      replacement += `<a class="res teacher-only" href="${legacyUrl}" target="_blank" rel="noopener">↗ Google Drive copy (legacy)</a>`;
    }

    return replacement;
  }
);

writeFileSync(curriculumPath, html);
console.log(
  `Patched curriculum/index.html — ${primaryPatched} Google Slides links, ${legacyAdded} legacy copies added.`
);

#!/usr/bin/env node
/** Student-safe Reveal Math index, generated from the publisher TOC and live resource manifest. */
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { withCurriculumShell } from "../tools/lib/curriculum-shell.mjs";
import {
  loadCurriculumManifest,
  loadDataJson,
  REPO_ROOT,
} from "../tools/lib/curriculum-source.mjs";
import { writeGenerated } from "./lib/preserve-injected.mjs";

const CONFIG = {
  route: "/curriculum/extra-help/",
  resources: [
    ["studentHelp", "Step-by-step help"],
    ["lesson", "Open lesson"],
    ["guidedNotes", "Guided notes"],
    ["worksheet", "Practice"],
    ["readiness", "Get ready"],
  ],
};
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );

export function renderExtraHelp(
  manifest = loadCurriculumManifest(),
  toc = loadDataJson("reveal-toc-2025.json"),
) {
  const byId = new Map(manifest.lessons.map((lesson) => [lesson.id, lesson]));
  for (const unit of toc.units) {
    for (const lesson of unit.lessons) {
      if (!byId.has(lesson.n)) throw new Error(`Extra Help: missing book lesson ${lesson.n}`);
    }
  }
  const units = toc.units
    .map((unit) => {
      const book = new Map(unit.lessons.map((lesson) => [lesson.n, lesson]));
      const lessons = manifest.lessons
        .filter((lesson) => lesson.unit === unit.unit && !lesson.flagship)
        .sort((a, b) => a.lesson - b.lesson);
      const cards = lessons
        .map((lesson) => {
          const original = book.get(lesson.id);
          const title = original?.title || lesson.title;
          const links = CONFIG.resources
            .flatMap(([key, label]) => {
              const resource = lesson.resources[key];
              if (!resource?.exists || !resource.applicable) return [];
              if (!resource.path.startsWith("/") || !existsSync(join(REPO_ROOT, resource.file))) {
                throw new Error(`Extra Help: missing or invalid resource ${lesson.id}/${key}`);
              }
              return [
                `<a href="${esc(resource.path)}">${label}<span class="eh-sr"> for lesson ${esc(lesson.id.replace("-", "."))}</span></a>`,
              ];
            })
            .join("\n");
          if (!links) throw new Error(`Extra Help: no resources for ${lesson.id}`);
          const alias =
            original && title.toLowerCase() !== lesson.title.toLowerCase()
              ? `<p class="eh-alias">On EduWonderLab: ${esc(lesson.title)}</p>`
              : "";
          return `<li class="eh-lesson" id="lesson-${esc(lesson.id)}" data-lesson data-search="${esc(`${lesson.id} ${lesson.id.replace("-", ".")} ${title} ${lesson.title} ${lesson.titleEs || ""} ${lesson.standard} ${original?.standards?.join(" ") || ""} ${lesson.objective} ${unit.title}`.toLowerCase())}">
<p class="eh-number">Lesson ${esc(lesson.id.replace("-", "."))}${original ? "" : " <span>Additional practice</span>"}</p>
<h3>${esc(title)}</h3>${alias}
<p class="eh-target">${esc(lesson.objective)}</p>
<div class="eh-links">${links}</div></li>`;
        })
        .join("\n");
      return `<section class="eh-unit" id="unit-${unit.unit}" data-unit="${unit.unit}">
<h2>Unit ${unit.unit}: ${esc(unit.title)}</h2>
<p class="eh-unit-count">${unit.lessons.length} book lessons${lessons.length > unit.lessons.length ? ` and ${lessons.length - unit.lessons.length} additional practice lessons` : ""}</p>
<ul class="eh-lessons" role="list">${cards}</ul></section>`;
    })
    .join("\n");
  const total = manifest.lessons.filter((lesson) => !lesson.flagship).length;
  return withCurriculumShell(
    `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Extra Help — Reveal Math Unit &amp; Lesson Index | EduWonderLab</title>
<meta name="description" content="Find extra help for every Grade 6 Reveal Math unit and lesson: step-by-step help, guided notes, practice, and readiness.">
<link rel="canonical" href="https://eduwonderlab.com${CONFIG.route}">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/curriculum-extra-help.css">
<script src="/assets/curriculum-extra-help.js" defer></script>
</head><body class="extra-help">
<main id="extra-help-content" class="eh-wrap" tabindex="-1">
<header class="eh-header"><a class="eh-back" href="/curriculum/">Back to curriculum</a>
<h1>Extra Help</h1><p class="eh-lede">Find your Reveal Math unit and lesson. Start with step-by-step help, review the notes, then try the practice.</p>
<p class="eh-source">All 10 units, in Reveal Math book order. Book lesson names appear first; additional EduWonderLab practice is labeled.</p></header>
<form class="eh-filters" role="search" hidden>
<div><label for="help-search">Search lessons</label><input id="help-search" type="search" placeholder="Try ratios, 3.2, or fractions" aria-describedby="help-search-hint"><p id="help-search-hint">Search by lesson number, topic, or standard.</p></div>
<div><label for="help-unit">Unit</label><select id="help-unit"><option value="">All units</option>${toc.units.map((unit) => `<option value="${unit.unit}">Unit ${unit.unit}: ${esc(unit.title)}</option>`).join("")}</select></div>
<button type="reset">Clear filters</button></form>
<nav class="eh-jumps" aria-label="Jump to a unit">${toc.units.map((unit) => `<a href="#unit-${unit.unit}">Unit ${unit.unit}</a>`).join("")}</nav>
<p id="help-count" role="status">${total} lessons across 10 units.</p>
<p id="help-empty" hidden>No lessons match. Try a topic such as ratios, choose another unit, or clear the filters.</p>
<noscript><p>Browse the complete index below, or use the unit links to jump to your lesson.</p></noscript>
${units}
<footer class="eh-footer"><p>Lesson names and order: Reveal Math Grade 6, Volumes 1–2, table of contents. Help and practice resources: EduWonderLab.</p><a href="/curriculum/">Back to curriculum</a></footer>
</main></body></html>`,
    "help",
  );
}

export function generateExtraHelp() {
  const dir = join(REPO_ROOT, "curriculum/extra-help");
  mkdirSync(dir, { recursive: true });
  writeGenerated(join(dir, "index.html"), renderExtraHelp());
  console.log("Generated Extra Help: complete Reveal Math unit and lesson index.");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) generateExtraHelp();

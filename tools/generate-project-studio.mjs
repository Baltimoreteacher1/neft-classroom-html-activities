#!/usr/bin/env node
/** Generate launch surfaces from the mission catalogue; keep legacy routes and state intact. */
import fs from "node:fs";
import { PROJECTS, studioURL, UNIT_NAMES } from "../curriculum/projects/studio/projects.mjs";
import { writeGenerated } from "../scripts/lib/preserve-injected.mjs";
import { withCurriculumShell } from "./lib/curriculum-shell.mjs";

const esc = (s) =>
  String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
const head = `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unit Projects — Project Studio | EduWonderLab</title><meta name="description" content="30 Grade 6 design missions: choose, build, test, revise and explain. Accessible supports, local saving and printable reports."><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/assets/fonts/hub-curriculum.css"><link rel="stylesheet" href="/curriculum/projects/studio/studio.css?v=20261028"><script type="module" src="/curriculum/projects/studio/studio.js?v=20261028"></script>`;
const cards = PROJECTS.map(
  (p) =>
    `<article class="mission-card"><div class="number">${p.unit ? `Unit ${p.unit} · ` : ""}${esc(UNIT_NAMES[p.unit])}</div><div class="inside"><h2>${esc(p.title)}</h2><p>${esc(p.question)}</p><p><strong>You’ll make:</strong> ${esc(p.product)}</p><a class="button" href="${studioURL(p.id)}">Open ${esc(p.title)}</a>${p.classic ? `<details><summary>Earlier work and companion tools</summary><a href="${p.classic}">${esc(p.title)} companion workspace</a></details>` : ""}</div></article>`,
).join("\n");
function galleryShell(file, html) {
  return file.startsWith("curriculum/")
    ? withCurriculumShell(html.replace(/<header class="site-header">[\s\S]*?<\/header>/, ""), "")
    : html;
}
for (const path of ["curriculum/projects/index.html", "math/projects/index.html"])
  writeGenerated(
    path,
    galleryShell(
      path,
      `<!doctype html>\n<html lang="en"><head>${head}</head><body><a class="skip" href="#main">Skip to projects</a><header class="site-header"><a class="brand" href="/curriculum/">EduWonderLab <span>Project Studio</span></a><nav aria-label="Site"><a href="/curriculum/units/">Lessons</a><a href="/math/projects/portfolio/">Earlier portfolio</a></nav></header><main id="main"><p class="eyebrow">Grade 6 · All 10 units + Pre-Unit</p><h1>Make something.<br>Make the math matter.</h1><p>Choose a mission, build a model, test the math and revise your design. Every student can use supports and keep the same essential goals.</p><p>30 missions · 2–3 class periods · local saving · printable reports</p><noscript><p>Studio interactions need JavaScript. The companion workspace links below remain available.</p></noscript><div class="catalog-grid">${cards}</div></main><footer class="site-footer">Classroom data and prices are simulated. No account, outside research or purchase required. <a href="/curriculum/">Back to curriculum</a></footer></body></html>\n`,
    ),
  );
const css = "/curriculum/projects/studio/entry.css?v=20261007";
const groups = new Map();
for (const p of PROJECTS.filter((p) => p.classic)) {
  const match = p.classic.match(/^(\/math\/[^/]+\/projects\/)/);
  if (match) {
    if (!groups.has(match[1])) groups.set(match[1], []);
    groups.get(match[1]).push(p);
  }
}
function inject(file, block, where = "main") {
  let html = fs.readFileSync(file, "utf8");
  html = html.replace(
    /\n?<!-- project-studio-entry:begin -->[\s\S]*?<!-- project-studio-entry:end -->\n?/g,
    "",
  );
  if (!html.includes(css))
    html = html.replace("</head>", `<link rel="stylesheet" href="${css}">\n</head>`);
  const content = `\n<!-- project-studio-entry:begin -->${block}<!-- project-studio-entry:end -->\n`;
  if (where === "main" && /<main\b[^>]*>/.test(html))
    html = html.replace(/<main\b[^>]*>/, (m) => m + content);
  else if (where === "heading" && /<h1\b[^>]*>[\s\S]*?<\/h1>/.test(html))
    html = html.replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/, (m) => m + content);
  else html = html.replace(/<body\b[^>]*>/, (m) => m + content);
  fs.writeFileSync(file, html);
}
function coursePlacement(root, projects) {
  if (root === "/math/pre-unit/projects/") return 0;
  if (root === "/math/statistics/projects/") return 2;
  const match = root.match(/\/unit-(\d+)\/projects\/$/);
  const legacyUnit = match ? Number(match[1]) : null;
  // These folders predate the current course map. Keep their URLs and companion
  // work, while surfacing them under the current unit their content supports.
  if (legacyUnit === 1) return 6;
  if (legacyUnit === 10) return 5;
  return projects[0]?.unit ?? legacyUnit ?? 0;
}

function alignLegacyFolderLabels(folderUnit, currentUnit) {
  if (folderUnit === currentUnit || ![1, 10].includes(folderUnit)) return;
  const oldLabel = `Unit ${folderUnit}`;
  const newLabel = `Unit ${currentUnit}`;
  const oldUpper = oldLabel.toUpperCase();
  const newUpper = newLabel.toUpperCase();
  const folder = `math/unit-${folderUnit}/projects`;
  for (const name of fs.readdirSync(folder, { recursive: true })) {
    const file = `${folder}/${name}`;
    if (!fs.statSync(file).isFile() || !/\.(html|json)$/i.test(file)) continue;
    const original = fs.readFileSync(file, "utf8");
    const updated = original
      .replaceAll(oldLabel, newLabel)
      .replaceAll(oldUpper, newUpper)
      .replaceAll(`data-unit="${folderUnit}"`, `data-unit="${currentUnit}"`);
    if (updated !== original) fs.writeFileSync(file, updated);
  }
}

for (const [root, companionProjects] of groups) {
  const currentUnit = coursePlacement(root, companionProjects);
  const legacyMatch = root.match(/\/unit-(\d+)\/projects\/$/);
  const legacyUnit = legacyMatch ? Number(legacyMatch[1]) : null;
  if (legacyUnit !== null && legacyUnit !== currentUnit)
    alignLegacyFolderLabels(legacyUnit, currentUnit);
  const currentProjects = PROJECTS.filter((p) => p.unit === currentUnit);
  const placement = currentUnit === 0
    ? `Pre-Unit · ${UNIT_NAMES[currentUnit]}`
    : `Unit ${currentUnit} · ${UNIT_NAMES[currentUnit]}`;
  const isLegacyAlias = legacyUnit !== null && legacyUnit !== currentUnit;
  const aliasNote = isLegacyAlias
    ? `<p class="studio-entry-note"><strong>Current course placement:</strong> ${esc(placement)}. The old folder URL is preserved for saved links.${currentUnit > 0 ? ` <a href="/math/unit-${currentUnit}/projects/">Open the current Unit ${currentUnit} project hub.</a>` : ""}${legacyUnit === 1 ? ` For current Unit 1 missions, open <a href="/curriculum/projects/studio/?unit=1">Math Is Discovery in Project Studio</a>.` : ""}</p>`
    : "";
  const block = `<section class="studio-entry studio-entry-hub" aria-label="Current ${esc(placement)} project missions"><p class="studio-entry-kicker">Project Studio · ${esc(placement)}</p><h2>Choose a mission. Make the math matter.</h2><p>Build a model, check your math, revise a design and publish your defense. Every mission includes math checks, bilingual language supports and a printable report. Teacher mode includes the standards crosswalk and rubric.</p><div class="studio-entry-links">${currentProjects.map((p) => `<a href="${studioURL(p.id)}">${esc(p.title)} →</a>`).join("")}</div>${aliasNote}<p class="studio-entry-note">Earlier project pages remain available below as companion activities.</p></section>`;
  inject(`.${root}index.html`, block);
}
for (const p of PROJECTS.filter((p) => p.classic))
  inject(
    `.${p.classic}index.html`,
    `<p class="studio-entry studio-entry-inline"><a href="${studioURL(p.id)}">Open current mission: ${esc(p.title)} →</a><span>Current course placement: ${p.unit === 0 ? "Pre-Unit" : `Unit ${p.unit}`} · ${esc(UNIT_NAMES[p.unit])}. This earlier companion workspace remains below.</span></p>`,
    "heading",
  );
let units = fs.readFileSync("curriculum/units/index.html", "utf8");
units = units.replace(
  /\n?<!-- studio-unit-link:\d+ -->[\s\S]*?<!-- \/studio-unit-link -->\n?/g,
  "",
);
units = units.replace(
  /\s*<a class="res" href="\/curriculum\/projects\/studio\/\?unit=\d+">Project Studio · Unit \d+(?: synthesis)? missions<\/a>/g,
  "",
);
for (let unit = 1; unit <= 10; unit++) {
  const start = units.indexOf(`<details class="unit" id="unit-${unit}"`);
  if (start < 0) throw new Error("Missing unit " + unit);
  const bodyStart = units.indexOf('<div class="unit-body">', start);
  const nextUnit = unit < 10
    ? units.indexOf(`<details class="unit" id="unit-${unit + 1}"`, start)
    : -1;
  const searchEnd = nextUnit < 0 ? units.length : nextUnit;
  const candidateEndLabel = units.indexOf('<span class="unit-res-label">End of Unit</span>', bodyStart);
  const endLabel = candidateEndLabel >= 0 && candidateEndLabel < searchEnd ? candidateEndLabel : -1;
  const rowStart = endLabel < 0 ? -1 : units.indexOf('<div class="res-row">', endLabel);
  const rowIsInsideUnit = rowStart >= 0 && rowStart < searchEnd;
  const position = rowIsInsideUnit
    ? rowStart + '<div class="res-row">'.length
    : units.lastIndexOf("\n", units.lastIndexOf('</details>', searchEnd)) + 1;
  if (position < bodyStart) throw new Error(`Could not place the Project Studio link for Unit ${unit}`);
  const missionWord = PROJECTS.filter((p) => p.unit === unit).length === 1 ? "mission" : "missions";
  const label = `Project Studio · Unit ${unit}${unit === 10 ? " synthesis" : ""} ${missionWord}`;
  const link = rowIsInsideUnit
    ? `\n<!-- studio-unit-link:${unit} --><a class="res" href="/curriculum/projects/studio/?unit=${unit}">${label}</a><!-- /studio-unit-link -->`
    : `<!-- studio-unit-link:${unit} --><div class="unit-res"><span class="unit-res-label">End-of-Unit Project</span><div class="res-row"><a class="res" href="/curriculum/projects/studio/?unit=${unit}">${label}</a></div></div><!-- /studio-unit-link -->\n`;
  units = units.slice(0, position) + link + units.slice(position);
}
fs.writeFileSync("curriculum/units/index.html", units);
console.log(
  `Generated two galleries, ${groups.size} project hubs, ${PROJECTS.filter((p) => p.classic).length} companion entries and 10 current-unit launch links.`,
);

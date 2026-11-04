#!/usr/bin/env node
/** Generate launch surfaces from the mission catalogue; keep legacy routes and state intact. */
import fs from "node:fs";
import { PROJECTS, studioURL, UNIT_NAMES } from "../curriculum/projects/studio/projects.mjs";
import { writeGenerated } from "../scripts/lib/preserve-injected.mjs";
import { withCurriculumShell } from "./lib/curriculum-shell.mjs";
import { galleryPage } from "./lib/projects-gallery.mjs";

const esc = (s) =>
  String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
/** The two galleries are built from data/project-registry.json (tools/lib/projects-gallery.mjs); nothing is typed here. */
for (const path of ["curriculum/projects/index.html", "math/projects/index.html"]) {
  const html = galleryPage(path);
  writeGenerated(path, path.startsWith("curriculum/") ? withCurriculumShell(html, "") : html);
}
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
  const placement =
    currentUnit === 0
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
console.log(
  `Generated two galleries, ${groups.size} project hubs, ${PROJECTS.filter((p) => p.classic).length} companion entries.`,
);

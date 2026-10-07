#!/usr/bin/env node
/** Generate launch surfaces from the mission catalogue; keep legacy routes and state intact. */
import fs from "node:fs";
import { PROJECTS, studioURL, UNIT_NAMES } from "../curriculum/projects/studio/projects.mjs";
import { writeGenerated } from "../scripts/lib/preserve-injected.mjs";
import { withCurriculumShell } from "./lib/curriculum-shell.mjs";

const esc = (s) =>
  String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
const head = `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unit Projects — Project Studio | EduWonderLab</title><meta name="description" content="30 Grade 6 design missions: choose, build, test, revise and explain. Accessible supports, local saving and printable reports."><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/assets/fonts/hub-curriculum.css"><link rel="stylesheet" href="/curriculum/projects/studio/studio.css?v=20261007"><script type="module" src="/curriculum/projects/studio/studio.js?v=20261007"></script>`;
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
for (const [root, projects] of groups)
  inject(
    `.${root}index.html`,
    `<section class="studio-entry studio-entry-hub" aria-label="Start a redesigned project"><p class="studio-entry-kicker">Project Studio · New student workspace</p><h2>Choose a mission. Make the math matter.</h2><p>Build a model, check your math, revise a design and publish your defense. Hints, read-aloud, language supports and print options are available to everyone.</p><div class="studio-entry-links">${projects.map((p) => `<a href="${studioURL(p.id)}">${esc(p.title)} →</a>`).join("")}</div><p class="studio-entry-note">The companion activities below still open earlier saved work.</p></section>`,
  );
for (const p of PROJECTS.filter((p) => p.classic))
  inject(
    `.${p.classic}index.html`,
    `<p class="studio-entry studio-entry-inline"><a href="${studioURL(p.id)}">Open the redesigned ${esc(p.title)} Project Studio →</a><span>Or continue your saved companion work below.</span></p>`,
    "heading",
  );
let units = fs.readFileSync("curriculum/units/index.html", "utf8");
units = units.replace(
  /\n?<!-- studio-unit-link:\d+ -->[\s\S]*?<!-- \/studio-unit-link -->\n?/g,
  "",
);
for (let unit = 1; unit <= 10; unit++) {
  const start = units.indexOf(`<details class="unit" id="unit-${unit}"`);
  if (start < 0) throw new Error("Missing unit " + unit);
  const position =
    units.indexOf('<div class="unit-body">', start) + '<div class="unit-body">'.length;
  const link = `\n<!-- studio-unit-link:${unit} --><div class="unit-res"><span class="unit-res-label">Apply the unit · Project Studio</span><div class="res-row"><a class="res" href="/curriculum/projects/studio/?unit=${unit}">Project Studio · Choose, build, test &amp; revise</a></div></div><!-- /studio-unit-link -->\n`;
  units = units.slice(0, position) + link + units.slice(position);
}
fs.writeFileSync("curriculum/units/index.html", units);
console.log(
  `Generated two galleries, ${groups.size} project hubs, ${PROJECTS.filter((p) => p.classic).length} companion entries and 10 current-unit launch links.`,
);

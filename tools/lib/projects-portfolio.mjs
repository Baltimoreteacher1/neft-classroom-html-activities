/**
 * projects-portfolio.mjs — builds /math/projects/portfolio/ from data/project-registry.json plus
 * the Studio mission data. Nothing the page prints about a project or a count is typed here:
 * titles, units, launch URLs and every number come from the registry; evidence prompts, input
 * labels and the self-review wording come from curriculum/projects/studio/; the three reflection
 * prompts are read out of shared/projects/projects-complete.js (the layer that asks them).
 *
 * The cards are real HTML before any script runs (every project and its launch links). The
 * module scripts only add what the student's own device holds: status, saved artifacts, the
 * certificate. Behaviour: math/projects/portfolio/portfolio.mjs (+ store.mjs, certificate.mjs).
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SELF_CHECK_ITEMS } from "../../curriculum/projects/studio/completion.mjs";
import { FAMILY, fieldsFor } from "../../curriculum/projects/studio/math.mjs";
import { PROJECTS } from "../../curriculum/projects/studio/projects.mjs";
import { loadRegistry, registryCounts } from "./project-registry.mjs";
import { TYPE_LABELS, UNIT_FALLBACK, unitLabel, unitShort } from "./projects-gallery.mjs";
import { ROOT } from "./projects-inventory.mjs";

const esc = (s) =>
  String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const json = (data) =>
  JSON.stringify(data).replaceAll("<", "\\u003c").replaceAll("\u2028", "\\u2028");
const stamp = (file) =>
  createHash("sha1")
    .update(readFileSync(join(ROOT, file)))
    .digest("hex")
    .slice(0, 10);

/** The three exit-reflection prompts, as the legacy page layer asks them (id r1..r3). */
export function reflectionPrompts() {
  const src = readFileSync(join(ROOT, "shared/projects/projects-complete.js"), "utf8");
  const out = [...src.matchAll(/id:\s*"(r\d)",\s*en:\s*"([^"]+)"/g)].map((m) => ({
    id: m[1],
    prompt: m[2],
  }));
  if (out.length !== 3) throw new Error("projects-complete.js: expected three reflection prompts");
  return out;
}

const letterOf = (project) => {
  const m = project.launchUrl.match(/\/version-([a-z])\/$/);
  if (m) return `Version ${m[1].toUpperCase()}`;
  return project.id === "world-architect" ? "Expedition" : null;
};

/** What the page and its scripts know about each project, in registry order. */
export function buildPortfolioData(reg = loadRegistry()) {
  const missions = new Map(PROJECTS.map((p) => [p.id, p]));
  const projects = reg.projects.map((r) => {
    const m = missions.get(r.id);
    return {
      id: r.id,
      title: r.title,
      unit: r.unit,
      type: r.classification,
      typeLabel: TYPE_LABELS[r.classification],
      letter: letterOf(r),
      launch: r.launchUrl,
      studio: r.studioUrl,
      page: r.launchUrl !== r.studioUrl,
      studioKey: r.saveResume.studioKey,
      pageKeys: r.saveResume.legacyPageKeys,
      rubricRows: r.rubric.rows,
      prompts: m.evidence,
      fields: fieldsFor(m).map((f) => ({ key: f.key, label: f.label })),
      codes: [...new Set([...FAMILY[r.family].standards, ...r.standards.pageCodes])].sort(),
    };
  });
  const units = [...new Set(projects.map((p) => p.unit))]
    .sort((a, b) => a - b)
    .map((n) => ({ unit: n, key: `unit-${n}`, label: unitLabel(n), short: unitShort(n) }));
  return {
    projects,
    units,
    selfCheck: SELF_CHECK_ITEMS,
    reflections: reflectionPrompts(),
    counts: { ...registryCounts(reg), units: units.length },
  };
}

function card(p) {
  const links = [
    p.page
      ? `<a class="pf-btn" href="${esc(p.launch)}" data-role="page">Open project page<span class="pf-sr"> for ${esc(p.title)}</span></a>`
      : "",
    `<a class="pf-btn" href="${esc(p.studio)}" data-role="studio">Open in Studio<span class="pf-sr"> for ${esc(p.title)}</span></a>`,
  ].join("");
  const chips = [p.letter, p.typeLabel]
    .filter(Boolean)
    .map((c) => `<span class="pf-chip">${esc(c)}</span>`)
    .join("");
  return `<li class="pf-card" data-id="${esc(p.id)}" data-launch="${esc(p.launch)}" data-status="unknown"><article aria-labelledby="pt-${esc(p.id)}"><div class="pf-card-head"><h3 id="pt-${esc(p.id)}">${esc(p.title)}</h3><p class="pf-chips">${chips}</p></div><p class="pf-status" data-role="status" hidden></p><div class="pf-artifact" data-role="artifact" hidden></div><p class="pf-links">${links}</p></article></li>`;
}

function unitSection(u, projects) {
  const mine = projects.filter((p) => p.unit === u.unit);
  const accent = `style="--pf-unit:var(--unit-${u.unit},${UNIT_FALLBACK[u.unit]})"`;
  return `<li class="pf-unit" data-unit="${u.unit}" id="${u.key}" ${accent}><section aria-labelledby="h-${u.key}"><div class="pf-unit-head"><h2 id="h-${u.key}">${esc(u.label)}</h2><p class="pf-unit-meta" data-role="unit-meta">${mine.length} project${mine.length === 1 ? "" : "s"}</p><button type="button" class="pf-btn pf-cert-btn" data-cert="${u.key}" hidden>Certificate<span class="pf-sr"> for ${esc(u.short)}</span></button></div><ul class="pf-cards">${mine.map(card).join("")}</ul></section></li>`;
}

const FOOT = `Everything on this page is read from this device. Nothing is sent, shared or graded. <a href="/curriculum/projects/">Browse all projects</a>`;

/** Full HTML for /math/projects/portfolio/ (injected layers are re-spliced by writeGenerated). */
export function portfolioPage() {
  const data = buildPortfolioData();
  const { projects, units, counts } = data;
  const css = `/math/projects/portfolio/portfolio.css?v=${stamp("math/projects/portfolio/portfolio.css")}`;
  const js = `/math/projects/portfolio/portfolio.mjs?v=${stamp("math/projects/portfolio/portfolio.mjs")}`;
  const span = `${units.some((u) => u.unit === 0) ? "Pre-Unit and " : ""}Units ${units.filter((u) => u.unit > 0)[0].unit}–${units.at(-1).unit}`;
  const sentence = `${counts.portfolioProjects} projects in ${counts.units} units`;
  const head = `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>My Project Portfolio | Grade 6 Math | Neft Teacher</title><meta name="description" content="Your saved and finished work across all ${counts.portfolioProjects} Grade 6 math projects in ${counts.units} units. See what you chose, wrote and checked, pick up where you stopped, and print a certificate for a finished project."><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/assets/fonts/hub-curriculum.css"><link rel="stylesheet" href="${css}"><script type="module" src="${js}"></script>`;
  const header = `<a class="pf-skip" href="#main">Skip to the portfolio</a><header class="site-header pf-sitebar"><a class="brand" href="/curriculum/">EduWonderLab <span>Project Studio</span></a><nav aria-label="Site"><a href="/math/projects/">All projects</a><a href="/curriculum/projects/studio/">Project Studio</a></nav></header>`;
  const stats = `<dl class="pf-stats" aria-label="Portfolio summary"><div><dt>Projects finished</dt><dd><span id="stat-complete">–</span> of <span id="stat-total">${counts.portfolioProjects}</span></dd></div><div><dt>In progress</dt><dd id="stat-progress">–</dd></div><div><dt>Units with a finished project</dt><dd><span id="stat-units">–</span> of <span id="stat-unit-total">${counts.units}</span></dd></div><div id="stat-stars-wrap" hidden><dt>Stars on classic pages</dt><dd id="stat-stars">0</dd></div></dl>`;
  const main = `<main id="main" class="pf"><header class="pf-hero"><p class="pf-eyebrow">Grade 6 · ${esc(span)}</p><h1>My Project Portfolio</h1><p class="pf-lede" id="pf-sentence">${esc(sentence)}. Your saved work, what you decided, what you wrote and what you finished, kept on this device.</p>${stats}<p class="pf-noscript"><noscript>Turn on JavaScript to see the work saved on this device. Every project below still opens.</noscript></p><div class="pf-tools"><div class="pf-name"><label for="student-name">Your name (printed on your certificates)</label><input id="student-name" type="text" autocomplete="name" maxlength="80" placeholder="Type your name"></div><button type="button" class="pf-btn pf-primary" id="pf-print" hidden>Print my portfolio</button></div></header><section class="pf-empty" id="empty-state" aria-labelledby="pf-empty-h" hidden><h2 id="pf-empty-h">Nothing finished yet, and that is normal.</h2><p>This page fills in by itself. Nothing to set up, nothing to submit.</p><ol><li>Pick a project from the <a href="/math/projects/">Projects gallery</a>.</li><li>Work through the steps. Your work saves as you go, so you can stop and come back.</li><li>Finish the last step: in Project Studio press <strong>Mark this mission complete</strong>; on a classic project page, build your report.</li><li>Come back here to see it and print your certificate.</li></ol></section><ol class="pf-units" id="unit-list">${units.map((u) => unitSection(u, projects)).join("")}</ol><div class="pf-live" id="pf-live" role="status" aria-live="polite"></div></main>`;
  const dialog = `<dialog id="cert-modal" class="pf-cert-dialog" aria-labelledby="cert-title"><div class="pf-cert-wrap"><div id="cert-content"></div><div class="pf-cert-actions"><button type="button" class="pf-btn pf-primary" id="cert-print">Print certificate</button><button type="button" class="pf-btn" id="cert-close">Close</button></div></div></dialog>`;
  const nav = `<nav class="pf-nav" aria-label="More projects"><a href="/curriculum/projects/">Curriculum projects</a><a href="/math/projects/">Projects gallery</a><a href="/curriculum/projects/studio/">Project Studio</a><a href="/curriculum/">Curriculum hub</a></nav>`;
  return `<!doctype html>\n<html lang="en"><head>${head}</head><body class="pf-body">${header}${main}${dialog}${nav}<footer class="pf-footer">${FOOT}</footer><script id="pf-data" type="application/json">${json(data)}</script><script src="/assets/math-workbench-launcher.js" defer></script><script src="/assets/formula-popup.js" defer></script></body></html>\n`;
}

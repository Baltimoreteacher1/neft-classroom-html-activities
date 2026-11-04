/**
 * projects-gallery.mjs — builds the Projects gallery (/curriculum/projects/ and /math/projects/)
 * from data/project-registry.json plus the Studio mission catalogue.
 *
 * Nothing the page prints about a project is typed here: title, unit, family, classification,
 * launch URLs and every count come from the registry; the challenge text, evidence prompts,
 * deliverable, vocabulary and rubric come from curriculum/projects/studio/ (projects.mjs,
 * math.mjs, rubric.mjs); the classic-page rubric rows are read out of each legacy page.
 * Only the topic names (one per family) and the picture for each family are authored in this
 * repo's tooling (see projects-gallery-art.mjs).
 *
 * Search semantics (the browser gate recomputes them independently): a project matches a query
 * when every whitespace-separated token appears in the lower-cased text of its title, role,
 * question, product, context choices, family label, topic, unit label, type label, standard
 * codes and key terms (English and Spanish).
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { FAMILY } from "../../curriculum/projects/studio/math.mjs";
import { PROJECTS, UNIT_NAMES } from "../../curriculum/projects/studio/projects.mjs";
import { STUDIO_RUBRIC } from "../../curriculum/projects/studio/rubric.mjs";
import { loadRegistry, registryCounts } from "./project-registry.mjs";
import { ART_FAMILIES, artFigure, artSprite } from "./projects-gallery-art.mjs";
import { ROOT } from "./projects-inventory.mjs";

/** One short topic name per Studio family. */
export const TOPICS = {
  division: "Division and remainders",
  statistics: "Data and statistics",
  ratio: "Ratios and rates",
  percent: "Percents",
  area: "Area and composite figures",
  expressions: "Expressions and exponents",
  coordinates: "Integers and coordinates",
  equations: "Equations and inequalities",
  relationships: "Two-variable relationships",
  solids: "Surface area and volume",
  discovery: "Patterns and reasoning",
  synthesis: "Connecting the strands",
};
export const TYPE_LABELS = {
  flagship: "Flagship",
  version: "Version",
  stretch: "Stretch",
  companion: "Companion",
};
/** Pre-Unit has no `--unit-N` token (those run 1..10); it takes a neutral ink. */
export const UNIT_FALLBACK = {
  0: "#44566a",
  1: "#316f62",
  2: "#2f6fa3",
  3: "#b5562b",
  4: "#B3402A",
  5: "#2f8a8a",
  6: "#a8792a",
  7: "#3f6db5",
  8: "#a34a6b",
  9: "#557a2f",
  10: "#5b6470",
};
export const unitShort = (n) => (n === 0 ? "Pre-Unit" : `Unit ${n}`);
export const unitLabel = (n) => (n === 0 ? UNIT_NAMES[0] : `Unit ${n} · ${UNIT_NAMES[n]}`);

const esc = (s) =>
  String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const decode = (s) =>
  s
    .replaceAll("&nbsp;", " ")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&amp;", "&");
const plain = (html) =>
  decode(html.replace(/<[^>]+>/g, ""))
    .replace(/\s+/g, " ")
    .trim();

/** One table cell -> { en, es } (the pages mark both languages with .en-text/.es-text spans). */
function bilingualCell(html) {
  const pick = (cls) =>
    html.match(new RegExp(`<span[^>]*class="[^"]*${cls}[^"]*"[^>]*>([\\s\\S]*?)</span\\s*>`, "i"));
  const en = pick("en-text");
  const es = pick("es-text");
  return { en: plain(en ? en[1] : html), es: es ? plain(es[1]) : null };
}

/** The rubric table of a classic page: skill + the Expert / Proficient / Developing descriptors. */
export function pageRubric(file) {
  if (!file) return null;
  const html = readFileSync(join(ROOT, file), "utf8");
  const table = html.match(/<table\b[^>]*class="[^"]*\brubric\b[^"]*"[^>]*>([\s\S]*?)<\/table>/i);
  if (!table) return null;
  const rows = [];
  for (const row of table[1].match(/<tr\b[\s\S]*?<\/tr>/gi) || []) {
    const cells = (row.match(/<td\b[^>]*>([\s\S]*?)<\/td>/gi) || []).map((c) =>
      bilingualCell(c.replace(/^<td\b[^>]*>|<\/td>$/gi, "")),
    );
    if (cells.length === 4) rows.push({ skill: cells[0], levels: cells.slice(1) });
  }
  return rows.length ? rows : null;
}

const letterOf = (project) => {
  const m = project.launchUrl.match(/\/version-([a-z])\/$/);
  if (m) return m[1].toUpperCase();
  return project.id === "world-architect" ? "Expedition" : null;
};

/** Everything the page knows about each project, in registry order. */
export function buildGalleryData(reg = loadRegistry()) {
  const missions = new Map(PROJECTS.map((p) => [p.id, p]));
  const regById = new Map(reg.projects.map((p) => [p.id, p]));
  const projects = reg.projects.map((r) => {
    const m = missions.get(r.id);
    const fam = FAMILY[r.family];
    const hub = reg.hubs.find((h) => h.projects.includes(r.id));
    const codes = [...new Set([...fam.standards, ...r.standards.pageCodes])].sort();
    return {
      id: r.id,
      title: r.title,
      unit: r.unit,
      unitLabel: unitLabel(r.unit),
      type: r.classification,
      typeLabel: TYPE_LABELS[r.classification],
      family: r.family,
      familyLabel: fam.label,
      topic: TOPICS[r.family],
      letter: letterOf(r),
      role: m.role,
      question: m.question,
      product: m.product,
      choices: m.choices,
      evidence: m.evidence,
      twist: m.twist,
      mathChecks: r.requirements.mathChecks,
      codes,
      ccss: m.crosswalk.ccss,
      smp: m.crosswalk.smp,
      terms: fam.vocab.map(([en, es]) => ({ en, es })),
      pageRubric: pageRubric(r.files.page),
      urls: { studio: r.studioUrl, launch: r.launchUrl, classic: r.hubUrl ? r.launchUrl : null },
      versions: hub
        ? hub.projects.map((id) => {
            const s = regById.get(id);
            return { id, label: letterOf(s) || s.title, title: s.title, url: s.launchUrl };
          })
        : [],
      keys: { studio: r.saveResume.studioKey },
    };
  });
  for (const p of projects)
    p.search = [
      p.title,
      p.role,
      p.question,
      p.product,
      ...p.choices,
      p.familyLabel,
      p.topic,
      p.unitLabel,
      p.typeLabel,
      ...p.codes,
      ...p.terms.flatMap((t) => [t.en, t.es]),
    ]
      .join(" ")
      .toLowerCase();
  return {
    projects,
    rubric: STUDIO_RUBRIC,
    typeNotes: reg.classifications,
    counts: registryCounts(reg),
  };
}

const stamp = (file) =>
  createHash("sha1")
    .update(readFileSync(join(ROOT, file)))
    .digest("hex")
    .slice(0, 10);
const countBy = (items, key) => {
  const out = new Map();
  for (const item of items) for (const k of [].concat(item[key])) out.set(k, (out.get(k) || 0) + 1);
  return out;
};
const options = (entries) =>
  entries
    .map(([value, label, n]) => `<option value="${esc(value)}">${esc(label)} (${n})</option>`)
    .join("");

function card(p) {
  const accent = `style="--pg-unit:var(--unit-${p.unit},${UNIT_FALLBACK[p.unit]});--art-accent:var(--pg-unit)"`;
  const letter = p.letter
    ? `<span class="pg-chip pg-chip-ver">${p.letter.length === 1 ? `Version ${p.letter}` : esc(p.letter)}</span>`
    : "";
  const versions = p.versions.length
    ? `<p class="pg-versions"><span class="pg-label" id="v-${p.id}">Versions</span><span class="pg-version-list" role="group" aria-labelledby="v-${p.id}">${p.versions
        .map((v) => {
          const name = v.label.length === 1 ? `Version ${v.label}` : v.label;
          return v.id === p.id
            ? `<span class="pg-ver-this">${esc(v.label)}<span class="pg-sr"> (this project)</span></span>`
            : `<a class="pg-ver" href="${esc(v.url)}" aria-label="${esc(name)}: ${esc(v.title)}">${esc(v.label)}</a>`;
        })
        .join("")}</span></p>`
    : `<p class="pg-versions"><span class="pg-label">Versions</span><span class="pg-note">Studio mission only</span></p>`;
  const classic = p.urls.classic
    ? `<a class="pg-btn" href="${esc(p.urls.classic)}" data-role="classic">Classic page<span class="pg-sr"> for ${esc(p.title)}</span></a>`
    : "";
  const continueClassic = p.urls.classic
    ? `<a class="pg-btn pg-continue" href="${esc(p.urls.classic)}" data-role="continue-classic" hidden>Continue classic page<span class="pg-sr"> for ${esc(p.title)}</span></a>`
    : "";
  return `<li class="pg-card" data-id="${p.id}" data-unit="${p.unit}" data-type="${p.type}" data-topic="${p.family}" data-standards="${esc(p.codes.join(" "))}" data-search="${esc(p.search)}" ${accent}><article aria-labelledby="t-${p.id}"><div class="pg-art">${artFigure(p.family, "pg-svg", p.id)}</div><div class="pg-body"><p class="pg-meta"><span class="pg-chip pg-chip-unit">${esc(p.unitLabel)}</span><span class="pg-chip">${esc(p.typeLabel)}</span>${letter}</p><h3 id="t-${p.id}">${esc(p.title)}</h3><p class="pg-question">${esc(p.question)}</p><p class="pg-saved" hidden></p><dl class="pg-facts"><div><dt>Math skills</dt><dd>${esc(p.familyLabel)}. Key words: ${p.terms.map((t) => `${esc(t.en)} (<span lang="es">${esc(t.es)}</span>)`).join(", ")}.</dd></div><div><dt>Standards</dt><dd>${esc(p.codes.join(" · "))}</dd></div><div><dt>You will make</dt><dd>${esc(p.product)}</dd></div></dl>${versions}<div class="pg-actions"><a class="pg-btn pg-continue" href="${esc(p.urls.studio)}" data-role="continue-studio" hidden>Continue in Studio<span class="pg-sr">: ${esc(p.title)}</span></a>${continueClassic}<a class="pg-btn pg-primary" href="${esc(p.urls.studio)}" data-role="studio">Open in Studio<span class="pg-sr">: ${esc(p.title)}</span></a>${classic}<button class="pg-btn pg-details" type="button" data-id="${p.id}" aria-haspopup="dialog">Details<span class="pg-sr"> for ${esc(p.title)}</span></button></div></div></article></li>`;
}

const json = (data) =>
  JSON.stringify(data).replaceAll("<", "\\u003c").replaceAll("\u2028", "\\u2028");

/** The `main` content shared by both gallery routes, plus the sprite, dialog and data. */
function content(data) {
  const { projects, counts } = data;
  const units = [...new Set(projects.map((p) => p.unit))].sort((a, b) => a - b);
  const unitCounts = countBy(projects, "unit");
  const typeCounts = countBy(projects, "type");
  const topicCounts = countBy(projects, "family");
  const codeCounts = countBy(
    projects.map((p) => ({ code: p.codes })),
    "code",
  );
  const span = `${units.includes(0) ? "Pre-Unit and " : ""}Units ${units.filter((u) => u > 0)[0]}–${units.at(-1)}`;
  const typeKeys = Object.keys(TYPE_LABELS).filter((k) => typeCounts.has(k));
  const legend = typeKeys
    .map((k) => `<dt>${TYPE_LABELS[k]}</dt><dd>${esc(data.typeNotes[k])}</dd>`)
    .join("");
  return `${artSprite()}<main id="main" class="pg"><header class="pg-hero"><p class="pg-eyebrow">Grade 6 · ${esc(span)}</p><h1>Make something.<br>Make the math matter.</h1><p class="pg-lede">Choose a project, see what you will make and which math it needs, then open it in Studio or in its classic version. Every student can use supports and keeps the same essential goals.</p><p class="pg-stats"><strong>${counts.missions}</strong> projects · <strong>${counts.projectSets}</strong> project sets · <strong>${counts.versionPages}</strong> classic pages · local saving · printable reports</p><details class="pg-legend"><summary>What do Flagship, Version, Stretch and Companion mean?</summary><dl>${legend}</dl></details></header><section class="pg-tools" id="pg-tools" aria-labelledby="pg-find" hidden><h2 id="pg-find" class="pg-sr">Find a project</h2><form role="search" class="pg-form" id="pg-form" autocomplete="off"><label class="pg-field pg-field-wide" for="pg-search">Search<input id="pg-search" type="search" placeholder="Try robots, ratio, 6.AT.1…" spellcheck="false"></label><label class="pg-field" for="pg-unit">Course unit<select id="pg-unit"><option value="">All units (${projects.length})</option>${options(units.map((u) => [String(u), unitLabel(u), unitCounts.get(u)]))}</select></label><label class="pg-field" for="pg-topic">Topic<select id="pg-topic"><option value="">All topics (${projects.length})</option>${options(ART_FAMILIES.filter((f) => topicCounts.has(f)).map((f) => [f, TOPICS[f], topicCounts.get(f)]))}</select></label><label class="pg-field" for="pg-standard">Standard<select id="pg-standard"><option value="">All standards</option>${options([...codeCounts.keys()].sort().map((c) => [c, c, codeCounts.get(c)]))}</select></label><label class="pg-field" for="pg-type">Project type<select id="pg-type"><option value="">All types (${projects.length})</option>${options(typeKeys.map((k) => [k, TYPE_LABELS[k], typeCounts.get(k)]))}</select></label><button class="pg-btn" type="button" id="pg-reset">Clear filters</button></form><p id="pg-status" class="pg-status" role="status" aria-live="polite" data-total="${projects.length}">Showing ${projects.length} of ${projects.length} projects</p><p id="pg-resume" class="pg-resume" hidden></p></section><section aria-labelledby="pg-list"><h2 id="pg-list" class="pg-sr">Projects</h2><ul class="pg-grid" id="pg-grid">${projects.map(card).join("\n")}</ul><div id="pg-empty" class="pg-empty" hidden><p><strong>No project matches those filters.</strong></p><button class="pg-btn" type="button" id="pg-empty-reset">Clear filters</button></div></section></main><dialog id="pg-dialog" class="pg-dialog" aria-labelledby="pg-d-title"><div class="pg-d-inner" id="pg-d-inner"><button class="pg-btn pg-d-close" type="button" id="pg-d-close">Close<span class="pg-sr"> project details</span></button><div class="pg-d-head"><div class="pg-d-art" id="pg-d-art"></div><div class="pg-d-title"><p class="pg-meta" id="pg-d-meta"></p><h2 id="pg-d-title" tabindex="-1"></h2></div></div><div id="pg-d-body"></div><div class="pg-actions" id="pg-d-actions"></div></div></dialog><script type="application/json" id="pg-data">${json({ projects: projects.map(({ search, ...p }) => p), rubric: data.rubric })}</script>`;
}

const FOOT = `Classroom data and prices are simulated. No account, outside research or purchase required. <a href="/curriculum/">Back to curriculum</a>`;

/** Full HTML for one gallery route. `shell` wraps the curriculum route in the shared nav. */
export function galleryPage(route) {
  const data = buildGalleryData();
  const css = `/curriculum/projects/gallery.css?v=${stamp("curriculum/projects/gallery.css")}`;
  const js = `/curriculum/projects/gallery.js?v=${stamp("curriculum/projects/gallery.js")}`;
  const isCurriculum = route === "curriculum/projects/index.html";
  const head = `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unit Projects — Project Studio | EduWonderLab</title><meta name="description" content="${data.counts.missions} Grade 6 design projects: choose, build, test, revise and explain. Accessible supports, local saving and printable reports."><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/assets/fonts/hub-curriculum.css"><link rel="stylesheet" href="${css}"><script src="${js}" defer></script>`;
  const mathHeader = `<a class="pg-skip" href="#main">Skip to projects</a><header class="site-header pg-sitebar"><a class="brand" href="/curriculum/">EduWonderLab <span>Project Studio</span></a><nav aria-label="Site"><a href="/curriculum/units/">Lessons</a><a href="/math/projects/portfolio/">Earlier portfolio</a></nav></header>`;
  return `<!doctype html>\n<html lang="en"><head>${head}</head><body${isCurriculum ? "" : ' class="pg-math"'}>${isCurriculum ? "" : mathHeader}${content(data)}<footer class="pg-footer">${FOOT}</footer></body></html>\n`;
}

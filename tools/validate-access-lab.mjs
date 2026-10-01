#!/usr/bin/env node
/**
 * Gate for the ACCESS Practice Lab content contract (access-practice-lab/CONTENT.md).
 *
 * Holds the defects that shipped in the pre-2026-10 lab and that no render
 * probe can see:
 *   - answer choices whose picture label revealed the answer ("✓ polite request")
 *   - Listening items whose heard text was printed on screen (a reading test)
 *   - items telling students to "look at the picture" with no picture
 *   - answer keys pointing at ids that do not exist
 * plus schema, id uniqueness, Spanish glosses, Road references, picture-file
 * hygiene, and index freshness.
 *
 * Detectors self-test against known-bad fixtures BEFORE sweeping, so a detector
 * that stops firing fails loudly instead of reporting clean content.
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  allActivities,
  BANDS,
  buildIndex,
  CONTENT_DIR,
  CORE_DOMAINS,
  ITEM_TYPES,
  LAB_DIR,
  LEVEL_KEYS,
  loadBand,
  loadOptional,
  loadTests,
} from "./lib/access-lab-content.mjs";

// ── detectors (pure) ──────────────────────────────────────────────────────────
const GIVEAWAY = /[A-Za-z0-9✓✔✗✘]|[❌🚫✅]|⚠/u;
export function badVisual(visual) {
  return typeof visual === "string" && visual.trim() !== "" && GIVEAWAY.test(visual);
}

// Instructions that send a student to a visual. Phrase-based on purpose: "picture
// in your mind", "a reader can picture", and "Picture day" are not instructions.
const PICTURE_WORDS =
  /\b(?:look at|in|on|use|study|see) (?:the|this|these|each|both|two) (?:\w+ ){0,2}(?:picture|pictures|photo|photos|image|images|illustration|illustrations|diagram|scene)\b|\b(?:the|this|these) (?:\w+ ){0,2}(?:picture|pictures|photo|photos|illustration|diagram)s? (?:shows?|below|above)\b|\bpictures? of\b|\blook at (?:the|this|these) (?:two )?(?:animals|shapes|lunch tray|tray)\b/i;
const WHICH_PICTURE = /\bwhich picture\b/i;
const CHART_WORDS = /\b(?:the|this|these|two|each) (?:\w+ ){0,2}(?:chart|charts|graph|graphs|pictograph)\b/i;
const TABLE_WORDS = /\b(?:the|this) (?:data )?table\b(?! of contents)/i;
const asList = (x) => (Array.isArray(x) ? x : x ? [x] : []);
function instructionText(a) {
  return [a.directions, a.prompt, ...asList(a.passage)].filter(Boolean).join(" ");
}
export function missingVisual(a) {
  const t = instructionText(a);
  const out = [];
  const hasPicture = Boolean(a.picture);
  const hasChart = asList(a.chart).length > 0;
  if (a.type !== "worksheet" && PICTURE_WORDS.test(t) && !hasPicture && !hasChart) out.push("picture");
  if (WHICH_PICTURE.test(t) && !(a.options || []).every((o) => o.picture || o.visual)) out.push("picture for every answer choice");
  if (CHART_WORDS.test(t) && !hasChart && !hasPicture && !a.table) out.push("chart");
  if (TABLE_WORDS.test(t) && !a.table && !hasPicture) out.push("table");
  return out;
}

const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
/** The heard script leaks if a long run of it is printed in the visible prompt/directions. */
export function scriptLeaks(a) {
  if (!a.script) return false;
  const script = norm(Array.isArray(a.script) ? a.script.join(" ") : a.script);
  const shown = norm([a.prompt, a.directions].join(" "));
  const words = script.split(" ");
  if (words.length < 8) return shown.includes(script) && script.length > 20;
  for (let i = 0; i + 8 <= words.length; i += 4)
    if (shown.includes(words.slice(i, i + 8).join(" "))) return true;
  return false;
}

/** Answer-key integrity for one item. Returns a list of problems. */
export function keyProblems(a) {
  const p = [];
  const opt = new Set((a.options || []).map((o) => o.id));
  switch (a.type) {
    case "multipleChoice":
      if ((a.options || []).length < 2) p.push("needs ≥ 2 options");
      if (!opt.has(a.answer)) p.push(`answer "${a.answer}" is not an option id`);
      break;
    case "multiSelect":
      if (!Array.isArray(a.answers) || a.answers.length < 1) p.push("needs answers[]");
      else for (const x of a.answers) if (!opt.has(x)) p.push(`answers has unknown id "${x}"`);
      break;
    case "sort": {
      const cats = new Set((a.categories || []).map((c) => (typeof c === "string" ? c : c.id)));
      if (!cats.size) p.push("needs categories[]");
      for (const it of a.items || []) if (!cats.has(it.answer)) p.push(`item ${it.id} answer "${it.answer}" is not a category`);
      break;
    }
    case "order": {
      const ids = (a.items || []).map((i) => i.id);
      const ans = a.answer || [];
      if (ids.length < 2) p.push("needs ≥ 2 items");
      if (ans.length !== ids.length || ans.some((x) => !ids.includes(x))) p.push("answer must list every item id once");
      break;
    }
    case "cloze": {
      const blanks = (a.segments || []).filter((s) => s.blank).map((s) => s.blank);
      if (!blanks.length) p.push("needs at least one blank");
      for (const b of blanks) if (!(b.options || []).includes(b.answer)) p.push(`blank ${b.id} answer not among its options`);
      break;
    }
    case "hotText": {
      const ids = new Set((a.sentences || []).map((s) => s.id));
      if (!(a.answers || []).length) p.push("needs answers[]");
      for (const x of a.answers || []) if (!ids.has(x)) p.push(`answers has unknown sentence "${x}"`);
      break;
    }
    case "worksheet":
      if (!(a.sheet || []).length) p.push("needs sheet[]");
      break;
    case "constructed":
      break;
    default:
      p.push(`unknown type "${a.type}"`);
  }
  return p;
}

// ── self-test ─────────────────────────────────────────────────────────────────
function selfTest() {
  const fail = (m) => {
    console.error(`validate:access-lab SELF-TEST FAILED — ${m}`);
    process.exit(2);
  };
  if (!badVisual("✓ polite request")) fail("giveaway label not detected");
  if (!badVisual("✗ not polite")) fail("✗ label not detected");
  if (!badVisual("lightning")) fail("word visual not detected");
  if (badVisual("🌩️")) fail("plain emoji flagged");
  if (!missingVisual({ directions: "Look at the picture. Describe it." }).includes("picture"))
    fail("missing picture not detected");
  if (missingVisual({ directions: "Look at the picture.", picture: { src: "x" } }).length) fail("present picture flagged");
  if (!missingVisual({ prompt: "Use the bar graph to answer." }).includes("chart")) fail("missing chart not detected");
  if (missingVisual({ prompt: "Look at the text and answer." }).length) fail("'look at the text' flagged as picture");
  const leon =
    "Leon grew up watching his mother cook in their small kitchen. He learned to cook by helping her every single day.";
  if (!scriptLeaks({ script: leon, prompt: `Listen. ${leon} How did Leon learn?` })) fail("script leak not detected");
  if (scriptLeaks({ script: leon, prompt: "How did Leon first learn to cook?" })) fail("clean prompt flagged as leak");
  if (!keyProblems({ type: "multipleChoice", options: [{ id: "a" }, { id: "b" }], answer: "c" }).length)
    fail("bad MC key not detected");
  if (keyProblems({ type: "multipleChoice", options: [{ id: "a" }, { id: "b" }], answer: "b" }).length)
    fail("good MC key flagged");
  if (!keyProblems({ type: "order", items: [{ id: "x" }, { id: "y" }], answer: ["x"] }).length)
    fail("incomplete order key not detected");
}

// ── sweep ─────────────────────────────────────────────────────────────────────
const errors = [];
const warnings = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);

function checkPicture(where, pic) {
  if (!pic) return;
  if (!pic.src || !pic.alt) return err(where, "picture needs src and alt");
  const file = join(LAB_DIR, pic.src);
  if (!existsSync(file)) return err(where, `picture file missing: ${pic.src}`);
  const svg = readFileSync(file, "utf8");
  if (/<script/i.test(svg)) err(where, `${pic.src} contains <script>`);
  if (/(?:xlink:)?href\s*=\s*["'](?:https?:)?\/\//i.test(svg)) err(where, `${pic.src} references an external URL`);
  if (!/<title[\s>]/i.test(svg)) err(where, `${pic.src} has no <title>`);
  if (statSync(file).size > 24 * 1024) err(where, `${pic.src} is over 24 KB`);
}

function checkChart(where, chart) {
  if (!chart) return;
  if (!["bar", "pictograph"].includes(chart.kind)) err(where, `chart.kind must be bar|pictograph`);
  if (!Array.isArray(chart.data) || chart.data.length < 2) err(where, "chart needs ≥ 2 data points");
  for (const d of chart.data || [])
    if (typeof d.label !== "string" || typeof d.value !== "number") err(where, "chart data needs {label, value:number}");
}

function checkTable(where, table) {
  if (!table) return;
  if (!Array.isArray(table.headers) || !Array.isArray(table.rows)) return err(where, "table needs headers[] and rows[]");
  for (const r of table.rows) if (r.length !== table.headers.length) err(where, "table row width ≠ header width");
}

function checkItem(where, a, { domain, isTest }) {
  if (!ITEM_TYPES.includes(a.type)) err(where, `unknown type "${a.type}"`);
  for (const p of keyProblems(a)) err(where, p);
  for (const o of a.options || []) if (badVisual(o.visual)) err(where, `option ${o.id} visual reveals or labels: "${o.visual}"`);
  for (const m of missingVisual(a)) err(where, `text asks students to use a ${m}, but none is attached`);
  for (const pic of asList(a.picture)) checkPicture(where, pic);
  for (const c of asList(a.chart)) checkChart(where, c);
  for (const o of a.options || []) checkPicture(`${where}/option ${o.id}`, o.picture);
  checkTable(where, a.table);
  if ((domain === "Listening" || a.listening) && a.type !== "worksheet") {
    if (!a.script && a.type !== "sort") err(where, "Listening item has no `script` (the heard text)");
    if (a.passage) err(where, "Listening item prints a `passage` — move the heard text to `script`");
    if (scriptLeaks(a)) err(where, "the heard `script` is printed in the prompt/directions");
  }
  if (!isTest && a.type !== "worksheet" && !a.prompt) err(where, "missing prompt");
}

function checkActivity(where, a, domain, band) {
  for (const f of ["id", "title", "skill", "time", "type", "directions"])
    if (!a[f]) err(where, `missing ${f}`);
  if (band === "3-5" && !String(a.id).startsWith("g35-")) err(where, "grades 3–5 ids must start with g35-");
  if (!/^[a-z0-9][a-z0-9-]*$/.test(a.id || "")) err(where, `id "${a.id}" is not kebab-case`);
  if (band === "3-5") {
    // Full contract for new content; legacy 6–8 content predates it and is held to keys/integrity only.
    for (const f of ["correct", "hint", "support", "extension", "teacher"]) if (!a[f]) err(where, `missing ${f}`);
    if ((a.vocabulary || []).length < 2) err(where, "needs ≥ 2 vocabulary entries");
    if (!(a.frames || []).length) err(where, "needs ≥ 1 sentence frame");
  }
  for (const v of a.vocabulary || []) if (!Array.isArray(v) || v.length < 3 || !v[2]) err(where, `vocabulary "${v?.[0]}" lacks a Spanish gloss`);
  checkItem(where, a, { domain, isTest: false });
}

selfTest();

const seen = new Map();
const idOwner = (id, where) => {
  if (seen.has(id)) err(where, `duplicate id "${id}" (also ${seen.get(id)})`);
  else seen.set(id, where);
};

const bandIds = Object.fromEntries(BANDS.map((b) => [b, new Set()]));
for (const band of BANDS) {
  for (const { domain, data } of loadBand(band)) {
    const where0 = `g${band}/${domain}`;
    if (data.band !== band) err(where0, `band field "${data.band}" ≠ folder ${band}`);
    if (data.domain !== domain) err(where0, `domain field "${data.domain}" ≠ file name`);
    for (const [lk, L] of Object.entries(data.levels || {})) {
      if (domain !== "Model-Test" && !LEVEL_KEYS.includes(lk)) err(where0, `unknown level key "${lk}"`);
      const ids = new Set((L.activities || []).map((a) => a.id));
      for (const c of L.categories || [])
        for (const id of c.activityIds || []) if (!ids.has(id)) err(`${where0}/${lk}`, `category ${c.id} lists unknown id ${id}`);
      for (const a of L.activities || []) {
        const where = `${where0}/${lk}/${a.id}`;
        idOwner(a.id, where);
        bandIds[band].add(a.id);
        checkActivity(where, a, domain, band);
      }
    }
  }
}
// Grades 3–5 must cover every core domain at every level.
const g35 = new Map(loadBand("3-5").map((d) => [d.domain, d.data]));
if (g35.size) {
  for (const d of CORE_DOMAINS)
    for (const lk of LEVEL_KEYS) {
      const n = g35.get(d)?.levels?.[lk]?.activities?.length || 0;
      if (n < 8) err(`g3-5/${d}/${lk}`, `only ${n} activities (need ≥ 8)`);
    }
}

for (const { file, data: t } of loadTests()) {
  const where0 = `tests/${t.id}`;
  if (!file.endsWith(`${t.id}.json`)) err(where0, "file name must equal test id");
  if (!BANDS.includes(t.band)) err(where0, `band "${t.band}" unknown`);
  if (!["full", "domain", "mini"].includes(t.kind)) err(where0, `kind "${t.kind}" unknown`);
  idOwner(`test:${t.id}`, where0);
  for (const s of t.sections || [])
    for (const it of s.items || []) {
      const where = `${where0}/${it.id}`;
      idOwner(`test-item:${t.id}:${it.id}`, where);
      checkItem(where, it, { domain: s.domain, isTest: true });
    }
}

const road = loadOptional("road.json");
if (road) {
  for (const [band, plan] of Object.entries(road)) {
    if (!BANDS.includes(band)) {
      err("road.json", `unknown band ${band}`);
      continue;
    }
    if ((plan.weeks || []).length !== 12) err(`road.json/${band}`, `has ${(plan.weeks || []).length} weeks (need 12)`);
    for (const w of plan.weeks || []) {
      for (const id of w.activities || []) if (!bandIds[band].has(id)) err(`road.json/${band}/week ${w.n}`, `unknown activity ${id}`);
      if (!w.family?.en || !w.family?.es) err(`road.json/${band}/week ${w.n}`, "family prompt needs en + es");
    }
  }
}

const index = JSON.stringify(buildIndex(), null, 1);
let committed = "";
try {
  committed = JSON.stringify(JSON.parse(readFileSync(join(CONTENT_DIR, "index.json"), "utf8")), null, 1);
} catch {}
if (index !== committed) err("content/index.json", "stale — run `node tools/access-lab-index.mjs`");

const total = allActivities().length;
const tests = loadTests().length;
for (const w of warnings) console.warn(`WARN ${w}`);
if (errors.length) {
  for (const e of errors.slice(0, 200)) console.error(`FAIL ${e}`);
  if (errors.length > 200) console.error(`… ${errors.length - 200} more`);
  console.error(`validate:access-lab — ${errors.length} problem(s) across ${total} activities and ${tests} tests.`);
  process.exit(1);
}
console.log(`validate:access-lab — PASS · ${total} activities · ${tests} tests · bands ${Object.keys(buildIndex().bands).join(", ")}`);

#!/usr/bin/env node
/**
 * Build the plain-language Find index for /curriculum/find/.
 *
 * Every document is read from an existing registry; nothing is typed again here:
 *   data/catalog.json                     every navigable page (title, path, category, audience, unit, lesson)
 *   data/curriculum-manifest.json         lesson titles, objectives and standards
 *   data/ccss-standards.json              standard -> topic, short label, unit (and 2010 oldId codes)
 *   data/curriculum-download-manifest.json printable PDF / Word files per lesson
 *   curriculum/all-resources/tools.json   descriptions of /curriculum/<tool>/ pages
 *   <page>/index.html                     each page's own <meta name="description">
 *
 * Output: data/curriculum-find-index.json (compact keys; see FIELDS below).
 *
 *   node scripts/generate-curriculum-find-index.mjs           write
 *   node scripts/generate-curriculum-find-index.mjs --check   fail when the committed index is stale
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => JSON.parse(readFileSync(join(root, p), "utf8"));
const outPath = join(root, "data/curriculum-find-index.json");

const catalog = read("data/catalog.json");
const manifest = read("data/curriculum-manifest.json");
const registry = read("data/ccss-standards.json").standards;
const downloads = read("data/curriculum-download-manifest.json");
const tools = read("curriculum/all-resources/tools.json").tools;

// FIELDS  t title · p path · k kind · a audience letters (s student, f family, t teacher) · u unit · l lesson id
//         s standard (current code) · d description · f formats (pdf, docx) · es Spanish available · v level
//         (support | challenge) · alt second file link (Word when the main link is a PDF)

/* ---------- standards ------------------------------------------------- */

// "6.EE.A.3" and "6.RP.3d" are 2010 codes; the registry keeps them as oldId. "6.AT.B.7" drops its cluster letter.
const byOld = new Map();
for (const [code, s] of Object.entries(registry)) {
  if (s.oldId)
    for (const old of String(s.oldId).split(/[\s,]+/)) byOld.set(old.toUpperCase(), code);
}
function currentStandard(raw) {
  if (!raw) return null;
  const code = String(raw).trim();
  if (registry[code]) return code;
  const noCluster = code.replace(/^(\d|MPP)\.([A-Z]{1,3})\.[A-D]\./i, "$1.$2.");
  if (registry[noCluster]) return noCluster;
  return byOld.get(noCluster.toUpperCase()) || byOld.get(code.toUpperCase()) || null;
}
const CODE_IN_TEXT =
  /\b(?:[56]\.(?:AT|NOS|GR|DS|RP|EE|NS|G|SP|NF|NBT|MD|OA)\.[A-D]?\.?\d+[a-d]?|MPP\.\d)\b/i;

/* ---------- lessons --------------------------------------------------- */

const en = (v) => (v && typeof v === "object" ? v.en || "" : v || "");
const lessonById = new Map(manifest.lessons.map((l) => [String(l.id), l]));
const LESSON_IN_PATH = [
  /^\/lessons\/(\d{1,2}-\d{1,2})(?:[-/]|$)/,
  /^\/math\/(?:studio|lesson-path|practice-studio)\/(\d{1,2}-\d{1,2})\//,
  /^\/math\/unit-\d+\/(\d{1,2}-\d{1,2})-/,
];
function lessonOf(entry) {
  if (entry.lesson && lessonById.has(String(entry.lesson))) return String(entry.lesson);
  for (const re of LESSON_IN_PATH) {
    const m = entry.path.match(re);
    if (m && lessonById.has(m[1])) return m[1];
  }
  return null;
}
const unitOf = (entry, lesson) =>
  entry.unit ??
  (lesson
    ? Number(lesson.split("-")[0])
    : Number(entry.path.match(/^\/math\/unit-(\d+)\//)?.[1]) || null);

/* ---------- descriptions ---------------------------------------------- */

const toolText = new Map(tools.map((t) => [t.url, t.description]));
const decode = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
function metaDescription(path) {
  if (!path.startsWith("/") || path.includes("?")) return "";
  const file = path.endsWith("/") ? join(root, path, "index.html") : join(root, path);
  if (!file.endsWith(".html") || !existsSync(file)) return "";
  const head = readFileSync(file, "utf8").slice(0, 12000);
  const m =
    head.match(/<meta\s+name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
    head.match(/<meta\s+content=["']([^"']+)["'][^>]*name=["']description["']/i);
  return m ? decode(m[1]).replace(/\s+/g, " ").trim() : "";
}
const clip = (s, n = 170) => (s.length > n ? `${s.slice(0, n - 1).replace(/\s+\S*$/, "")}…` : s);

/* ---------- kinds ------------------------------------------------------ */

const LEADING_PICTOGRAPHS = /^[\p{Extended_Pictographic}️‍\s]+/u;
function kindOf(entry) {
  const p = entry.path;
  const title = entry.title.toLowerCase();
  if (p.startsWith("/curriculum/learning-labs/")) return "lab";
  if (/vocab|word wall|glossary/.test(title) || p.startsWith("/vocab-hub/")) return "vocabulary";
  switch (entry.category) {
    case "Lesson":
      return "lesson";
    case "Apply · Part 2":
    case "Practice":
      return "practice";
    case "Small Group":
      return "small-group";
    case "Catch-Up":
    case "On-Ramp":
      return "catch-up";
    case "Readiness":
      return "readiness";
    case "Homework":
      return "family";
    case "Project":
      return "project";
    case "Enrichment":
      return "enrichment";
    case "Review":
    case "Study Guide":
      return "review";
    case "Reading":
      return "reading";
    case "Game":
      return "game";
    case "Unit Hub":
    case "Hub":
      return "hub";
    case "Activity":
      return entry.audience === "family" ? "family" : "activity";
    default:
      if (p.startsWith("/math/practice-studio/")) return "practice";
      if (/\bgame|arcade\b/.test(title)) return "game";
      return "tool";
  }
}
function levelOf(entry, kind) {
  const hay = `${entry.title} ${entry.variant || ""} ${entry.path}`.toLowerCase();
  if (kind === "catch-up" || /extra support|group ?1|catchup|catch-up|on-ramp/.test(hay))
    return "support";
  if (kind === "enrichment" || /challenge|challenging|enrichment/.test(hay)) return "challenge";
  return null;
}
const AUDIENCE = { student: "s", family: "f", teacher: "t" };

/* ---------- pages ------------------------------------------------------ */

const docs = [];
const seen = new Set();
for (const entry of catalog.entries) {
  if (!entry.path || seen.has(entry.path) || entry.path.startsWith("/api/")) continue;
  seen.add(entry.path);
  const l = lessonOf(entry);
  const lesson = l ? lessonById.get(l) : null;
  const kind = kindOf(entry);
  const s =
    currentStandard(entry.standard) ||
    currentStandard(entry.title.match(CODE_IN_TEXT)?.[0]) ||
    currentStandard(entry.path.replace(/-/g, ".").match(CODE_IN_TEXT)?.[0]) ||
    (lesson ? currentStandard(lesson.standard) : null);
  const description =
    toolText.get(entry.path) ||
    metaDescription(entry.path) ||
    (lesson ? lesson.objective || en(lesson.bigIdea) : "");
  const doc = {
    t: entry.title.replace(LEADING_PICTOGRAPHS, "").trim(),
    p: entry.path,
    k: kind,
    a: AUDIENCE[entry.audience] || "s",
    u: unitOf(entry, l),
    l,
    s,
    d: clip(description),
  };
  const v = levelOf(entry, kind);
  if (v) doc.v = v;
  if (/\/family\/?$|\/homework\.html$/.test(entry.path) && !doc.a.includes("f")) doc.a += "f";
  docs.push(doc);
}

/* ---------- printable files ------------------------------------------- */

// "Notes PDF", "Homework (Word)", "Homework DOCX (Spanish)" are one printable in two formats or languages.
const FORMAT_SUFFIX = /\s*(?:[(·-]\s*)?\b(PDF|DOCX|Word|Spanish|Español)\)?\s*$/i;
const PRINT_GROUPS = new Set(["print", "worksheets", "homework", "notes", "assessments"]);
const typeById = new Map(downloads.types.map((t) => [t.id, t]));
const printDocs = new Map();
for (const unit of downloads.units) {
  for (const lesson of unit.lessons || []) {
    const man = lessonById.get(String(lesson.id).replace(/-(group[12]|catchup|flagship)$/, ""));
    for (const r of lesson.resources || []) {
      const type = typeById.get(r.type);
      if (!type || !PRINT_GROUPS.has(type.group) || r.delivery !== "file" || !r.file) continue;
      const ext = r.file.split(".").pop().toLowerCase();
      if (ext !== "pdf" && ext !== "docx") continue;
      const label = (r.label || type.label).replace(LEADING_PICTOGRAPHS, "");
      // The Reveal session sheets are ~14 Word files per lesson; one entry per lesson names them together.
      const base =
        r.type === "reveal-document"
          ? "Reveal practice forms, warm-up and guided steps"
          : label
              .replace(FORMAT_SUFFIX, "")
              .replace(FORMAT_SUFFIX, "")
              .replace(/^Set ([AB])$/, "Worksheet, Set $1");
      const key = `${lesson.id}|${base}`;
      const spanish = /-es\b|spanish|español/i.test(`${r.type} ${label}`);
      let doc = printDocs.get(key);
      if (!doc) {
        const title = typeof lesson.title === "object" ? lesson.title.en : lesson.title;
        doc = {
          t: `${title || lesson.label} — ${base}`,
          p: r.url,
          k:
            type.group === "homework"
              ? "family"
              : type.group === "assessments"
                ? "review"
                : "printable",
          a: type.group === "homework" ? "sf" : r.teacherOnly ? "t" : "st",
          u: unit.unit,
          l: man ? String(man.id) : null,
          s: currentStandard(lesson.standard) || (man ? currentStandard(man.standard) : null),
          d: clip(lesson.objective || (man ? man.objective : "") || ""),
          f: [],
          pr: 1,
        };
        if (/level 0|most support/i.test(base)) doc.v = "support";
        if (lesson.kind === "small-group" || lesson.kind === "catchup") {
          doc.v = /group ?1|extra support|catch/i.test(`${lesson.level} ${lesson.kind}`)
            ? "support"
            : null;
          if (!doc.v) delete doc.v;
        }
        printDocs.set(key, doc);
      }
      if (!doc.f.includes(ext)) doc.f.push(ext);
      if (spanish) doc.es = 1;
      else if (ext === "pdf" && !doc.p.endsWith(".pdf")) {
        doc.alt = doc.p;
        doc.p = r.url;
      } else if (doc.p !== r.url && !doc.alt) doc.alt = r.url;
    }
  }
}
for (const doc of printDocs.values()) if (!seen.has(doc.p)) docs.push(doc);

/* ---------- write ------------------------------------------------------ */

for (const d of docs) for (const k of Object.keys(d)) if (d[k] == null || d[k] === "") delete d[k];

const standards = {};
for (const [code, s] of Object.entries(registry)) standards[code] = [s.topic, s.shortLabel, s.unit];
const units = {};
for (const u of downloads.units) units[u.unit] = u.name;

const out = {
  note: "GENERATED by scripts/generate-curriculum-find-index.mjs — do not hand-edit. Sources: data/catalog.json, data/curriculum-manifest.json, data/ccss-standards.json, data/curriculum-download-manifest.json, curriculum/all-resources/tools.json, page meta descriptions.",
  schemaVersion: 1,
  count: docs.length,
  standards,
  units,
  docs,
};
const body = `${JSON.stringify(out)}\n`;
if (process.argv.includes("--check")) {
  const current = existsSync(outPath) ? readFileSync(outPath, "utf8") : "";
  if (current !== body) {
    console.error(
      "✗ data/curriculum-find-index.json is stale — run: npm run generate-curriculum-find-index",
    );
    process.exit(1);
  }
  console.log(`✓ data/curriculum-find-index.json is current (${docs.length} documents)`);
  process.exit(0);
}
writeFileSync(outPath, body);
const withS = docs.filter((d) => d.s).length;
const withD = docs.filter((d) => d.d).length;
console.log(
  `✓ ${docs.length} documents (${printDocs.size} printable sets) · ${withS} with a standard · ${withD} with a description → data/curriculum-find-index.json (${Math.round(JSON.stringify(out).length / 1024)} KB)`,
);

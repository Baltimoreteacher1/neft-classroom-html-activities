// F0 data-to-UI coverage. For every populated field path in the unit documents (162 units + their lesson documents)
// it answers, from the SOURCE tree and the real API handlers:
//   populated  number of units (lesson documents for lessons[]) where the field has a value
//   client     a browser module (bcpss-teachers/**, shared/class-platform/**, shared/bcpss-*) reads the field
//   rendered   ...and that module emits markup (innerHTML / template literal), or a registered routine block renders it
//   exported   a print/Word/PDF module in the export pipeline reads the field
//
// "Reads" is a STATIC, NAME-BASED heuristic (comments stripped, whole-word match; nested paths need parent and leaf in
// the same file, depth-2 paths need the leaf plus an alias of the block root). It over- and under-reports, so every
// verdict that matters is confirmed by hand (docs/feature-inventory.md lists the sample). G-13 uses it as a floor, and
// REGISTERED blocks (shared/bcpss-routines) are additionally proven by running the renderer (G-61..G-63).
//
// CLI: node tools/audit/data-ui-coverage.mjs [--md out.md] [--json out.json]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

/** Authored top-level blocks of the unit API that carry teaching content (not ids or list-row metadata). */
export const BLOCKS = [
  "connections",
  "studio",
  "esol_pack",
  "family",
  "family_card",
  "writing",
  "reading",
  "activities",
  "cross_subject_transfers",
  "module",
  "provenance",
];

// Client modules: where a teacher or student actually sees a field. Data files and tests are not readers.
const CLIENT_DIRS = ["bcpss-teachers", "shared/class-platform", "family/bcpss"];
const CLIENT_FILE = (rel) =>
  !/\.test\./.test(rel) &&
  !/(bcpss-teachers\/routines|shared\/bcpss-routines)\//.test(rel) &&
  !rel.includes("/studio/data/") &&
  !rel.includes("/node_modules/") &&
  /\.(js|html)$/.test(rel);
// Export pipeline: print HTML, Word, the unit packet and the family guide.
const EXPORT_DIR = "functions/_lib/bcpss";
const EXPORT_FILE = (rel) =>
  /(print|docx|studio-doc|unit-packet|lesson-doc|family-guide|esol-packet)/.test(
    path.basename(rel),
  ) && !/\.test\./.test(rel);

// Names a block root goes by in code. `conn` is how the hub reads connections[0].
const ROOT_ALIAS = {
  connections: /\b(connections|connection|conn|blueprint)\b/,
  esol_pack: /\b(esol_pack|esolPack)\b/,
  lessons: /\b(lessons?|lesson)\b/,
  // How other modules hold the same object: the Writing Lab keeps it as wl.w, the family guide as `guide`.
  writing: /\b(writing|w)\b/,
  family: /\b(family|guide)\b/,
  reading: /\b(reading|passage)\b/,
  activities: /activit/,
};

// The export pipeline calls the ESOL pack `pack` (esol-packet-html.js); screen code never does.
const EXPORT_ALIAS = { ...ROOT_ALIAS, esol_pack: /\b(esol_pack|esolPack|pack)\b/ };

export function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:"'`\\])\/\/[^\n]*/gm, "$1");
}

function* walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name !== "node_modules" && e.name !== "dist") yield* walk(p);
    } else yield p;
  }
}

/** [{ file, text }] of comment-stripped sources under `dirs` that pass `keep(relPath)`. */
export function loadSources(dirs, keep, root = ROOT) {
  const out = [];
  for (const d of dirs)
    for (const f of walk(path.join(root, d))) {
      const rel = path.relative(root, f);
      if (keep(rel)) out.push({ file: rel, text: stripComments(fs.readFileSync(f, "utf8")) });
    }
  return out;
}

export const loadClient = (root = ROOT) => [
  ...loadSources(CLIENT_DIRS, CLIENT_FILE, root),
  ...loadSources(["shared"], (r) => /shared\/bcpss-[^/]*\.js$/.test(r) && CLIENT_FILE(r), root),
];
// bcpss-teachers/routines/ and shared/bcpss-routines/ are NOT readers here: they are the registry, proven by G-61..G-63.
export const loadExport = (root = ROOT) => loadSources([EXPORT_DIR], EXPORT_FILE, root);

const EMITS_MARKUP =
  /innerHTML|insertAdjacentHTML|<\/[a-z][a-z0-9]*>|createElement|textContent|appendChild|\.append\(|\bh\(|\bel\(/;

const segments = (p) => p.split(/[.[\]]+/).filter(Boolean);
const word = (w) => new RegExp(`(^|[^A-Za-z0-9_$])${w}([^A-Za-z0-9_$]|$)`);
// A field READ looks like a property or key: .leaf, ?.leaf, ["leaf"], { leaf }, leaf: (not the same word in prose or markup).
const prop = (w) => new RegExp(`(?:[.[{,"'\`]|\\?\\.)\\s*${w}(?![A-Za-z0-9_$])`);

/** Does `text` read field `p`? depth-2 paths need the leaf plus a root alias; deeper paths need parent and leaf. */
export function readsPath(text, p, aliases = ROOT_ALIAS) {
  const seg = segments(p);
  const leaf = seg[seg.length - 1];
  if (!prop(leaf).test(text)) return false;
  if (seg.length === 1) return true;
  if (seg.length === 2) {
    const alias = aliases[seg[0]] || word(seg[0]);
    return alias.test(text);
  }
  return word(seg[seg.length - 2]).test(text);
}

// ---- populated paths ------------------------------------------------------------------------------------
const empty = (v) =>
  v == null ||
  v === "" ||
  (Array.isArray(v) && v.length === 0) ||
  (typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0);

function collect(v, p, seen, depth, maxDepth) {
  if (empty(v)) return;
  seen.add(p);
  if (depth >= maxDepth) return;
  if (Array.isArray(v)) {
    for (const item of v)
      if (item && typeof item === "object") collect(item, `${p}[]`, seen, depth + 1, maxDepth);
  } else if (typeof v === "object")
    for (const [k, x] of Object.entries(v)) collect(x, `${p}.${k}`, seen, depth + 1, maxDepth);
}

/** Map<path, populated unit count>. `maxDepth` counts object/array hops below the block root. */
export function populatedPaths(data, maxDepth = 4) {
  const counts = new Map();
  const bump = (seen) => {
    for (const p of seen) counts.set(p, (counts.get(p) || 0) + 1);
  };
  for (const unit of data.units) {
    const seen = new Set();
    for (const b of BLOCKS) collect(unit[b], b, seen, 0, maxDepth);
    bump(seen);
  }
  for (const doc of data.lessons) {
    const seen = new Set();
    for (const l of doc.lessons || []) collect(l, "lessons[]", seen, 0, maxDepth);
    bump(seen);
  }
  return counts;
}

/** Block-level paths G-13 holds to the floor: root.field and root[].field (depth 2), where the root itself is a container. */
export const isBlockPath = (p) =>
  segments(p).length === 2 && !p.endsWith("[]") && p !== "lessons[]";

// ---- the matrix -----------------------------------------------------------------------------------------
/**
 * @param {{units:any[], lessons:any[]}} data
 * @param {{client?:{file:string,text:string}[], exported?:{file:string,text:string}[], registered?:Map<string,string>}} [sources]
 *   registered: path -> block id for blocks rendered by shared/bcpss-routines (proven by G-61..G-63, not by name).
 */
export function buildMatrix(data, { client, exported, registered = new Map() } = {}) {
  const cl = client || loadClient();
  const ex = exported || loadExport();
  const counts = populatedPaths(data);
  const rows = [];
  for (const [p, populated] of [...counts.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const readers = cl.filter((s) => readsPath(s.text, p));
    const renderers = readers.filter((s) => EMITS_MARKUP.test(s.text));
    let reg = null;
    for (const [rp, id] of registered)
      if (p === rp || p.startsWith(`${rp}.`) || p.startsWith(`${rp}[]`)) reg = id;
    rows.push({
      path: p,
      depth: segments(p).length,
      populated,
      client: readers.length > 0 || Boolean(reg),
      rendered: renderers.length > 0 || Boolean(reg),
      exported: ex.some((s) => readsPath(s.text, p, EXPORT_ALIAS)),
      registered: reg,
      readers: renderers.slice(0, 3).map((s) => s.file),
    });
  }
  return rows;
}

/** Fields the hub treats as identity/bookkeeping everywhere; reported but never the headline. */
export const GENERIC = new Set(["id", "unit_id", "order", "n", "version", "kind", "type", "count"]);

export function matrixMarkdown(rows, units) {
  const yn = (b) => (b ? "Y" : "N");
  let md = `# Data-to-UI coverage matrix\n\nGenerated by \`tools/audit/data-ui-coverage.mjs\` against ${units} unit documents. Columns: units where the field is populated; read by a client module; rendered (reader emits markup, or a registered routine block renders it); exported (print/Word/PDF). Static name-based heuristic: every N is a candidate to confirm by hand.\n\n`;
  const blocks = [...BLOCKS, "lessons[]"];
  for (const b of blocks) {
    const r = rows.filter(
      (x) => x.path === b || x.path.startsWith(`${b}.`) || x.path.startsWith(`${b}[]`),
    );
    if (!r.length) continue;
    md += `## ${b}\n\n| field | units | client | rendered | exported |\n|---|---:|:-:|:-:|:-:|\n`;
    for (const x of r)
      md += `| ${x.path}${x.registered ? ` (${x.registered})` : ""} | ${x.populated} | ${yn(x.client)} | ${yn(x.rendered)} | ${yn(x.exported)} |\n`;
    md += "\n";
  }
  return md;
}

async function main() {
  const arg = (n) => (process.argv.includes(n) ? process.argv[process.argv.indexOf(n) + 1] : null);
  const { loadDataset } = await import("../language-page/dataset.mjs");
  const { registeredPaths } = await import("../../shared/bcpss-routines/index.js");
  // The API handlers log one JSON line per request; keep the report readable.
  const log = console.log;
  console.log = () => {};
  const data = await loadDataset();
  console.log = log;
  const rows = buildMatrix(data, { registered: registeredPaths() });
  const blocks = rows.filter((r) => isBlockPath(r.path));
  const missing = blocks.filter((r) => !r.rendered);
  if (arg("--json"))
    fs.writeFileSync(arg("--json"), JSON.stringify({ units: data.units.length, rows }, null, 2));
  if (arg("--md")) fs.writeFileSync(arg("--md"), matrixMarkdown(rows, data.units.length));
  console.log(
    `units ${data.units.length}; field paths ${rows.length}; block paths ${blocks.length}; not rendered ${missing.length}; not exported ${blocks.filter((r) => !r.exported).length}`,
  );
  for (const r of missing)
    console.log(
      `  not rendered: ${r.path} (${r.populated} units)${r.exported ? " [exported]" : ""}`,
    );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await main();

// Pocket Reference + Check Yourself data: the builder and the validators (shared by the test and, if wanted, a build gate).
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEwl } from "./ewl-vm.mjs";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
export const rel = (p) => join(ROOT, p);
export const readJson = (p) => JSON.parse(readFileSync(rel(p), "utf8"));
export const MANIFEST = readJson("data/curriculum-launch-manifest.json");
export const REF_PATH = "data/ewl/pocket-reference.json";
export const CHECK_PATH = "data/ewl/check-yourself.json";
export const EWL_CORE = [
  "rational.js",
  "state-store.js",
  "reasoning.js",
  "ui.js",
  "cockpit-core.js",
  "reference-core.js",
  "reference-icons.js",
];

/* ------------------------------------------------------------------ Pocket Reference data */
export const taught = MANIFEST.lessons.filter((l) => l.unit >= 1 && l.unit <= 9);
const vocabLessons = taught.filter((l) => l.unit >= 2); // Unit 1 is a launch unit with no math vocabulary of its own
const configCache = {};
const vocabOf = (id) => {
  if (!(id in configCache)) {
    const p = `lessons/${id}/config.json`;
    configCache[id] = existsSync(rel(p))
      ? (readJson(p).vocabulary || []).filter((v) => v.role !== "concept")
      : [];
  }
  return configCache[id];
};
export const norm = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const PRESET_BY_LESSON = {};
const setPreset = (preset, ids) => ids.forEach((i) => (PRESET_BY_LESSON[i] = preset));
setPreset("statistics", ["2-1", "2-2", "2-3", "2-4", "2-5", "2-8", "2-9", "2-10"]);
setPreset("decimals", ["2-6", "2-7", "2-11", "2-12"]);
setPreset("ratio-tables", ["3-1", "3-3", "3-4", "3-5", "3-9"]);
setPreset("unit-rates", ["3-2", "3-6", "3-7", "3-8", "3-10"]);
setPreset(
  "percent",
  [1, 2, 3, 4, 5].map((n) => `4-${n}`),
);
setPreset(
  "area",
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => `5-${n}`),
);
setPreset("fraction-division", ["6-1", "6-2", "6-9", "6-10", "6-11"]);
setPreset("expressions", ["6-3", "6-4", "6-5", "6-6", "6-8", "6-14", "6-15"]);
setPreset("factors", ["6-7", "6-12", "6-13"]);
setPreset("integers", ["7-1", "7-2", "7-3", "7-4"]);
setPreset("coordinate-plane", ["7-5", "7-6", "7-7", "7-8", "7-9"]);
setPreset("equations", ["8-1", "8-2", "8-3", "8-7"]);
setPreset("inequalities", ["8-4", "8-5", "8-6"]);
setPreset("unit9-variables", ["9-1", "9-2", "9-3", "9-4"]);
const GENERIC_BY_PRESET = {
  statistics: "g-stats",
  decimals: "g-number",
  integers: "g-number",
  factors: "g-number",
  "fraction-division": "g-number",
  "ratio-tables": "g-ratio",
  "unit-rates": "g-ratio",
  percent: "g-ratio",
  area: "g-geometry",
  expressions: "g-algebra",
  equations: "g-algebra",
  inequalities: "g-algebra",
  "unit9-variables": "g-algebra",
  "coordinate-plane": "g-plane",
};
// first match wins; a term with no hand-drawn picture gets its strand's clean generic icon
const ICON_RULES = [
  [/unit rate|^rate$|per unit|unit price|double number line|^per$|rates and/, "unit-rate"],
  [/ratio|proportion|scale factor/, "ratio"],
  [/percent|per hundred|discount|decimal grid/, "percent"],
  [/fraction|numerator|denominator|reciprocal|mixed number|keep, change/, "fraction"],
  [/^mean$|average|balance point|target (mean|total)|mean absolute|deviation/, "mean"],
  [/median|halfway|middle half|measure of center/, "median"],
  [/histogram|frequency|interval|peak|skewed/, "histogram"],
  [/box plot|quartile|whisker|five-number|^range/, "boxplot"],
  [
    /dot plot|data set|data distribution|cluster|^gap$|outlier|statistical question|variability|spread/,
    "dotplot",
  ],
  [/triangle/, "triangle"],
  [/trapezoid|^base [12]/, "trapezoid"],
  [/parallelogram|rhombus|slanted side/, "parallelogram"],
  [/prism|volume|cubic|unit cube|^net$|surface area|lateral|pyramid/, "prism"],
  [/coordinate|ordered pair|quadrant|origin|x-axis|y-axis|^axis|reflection/, "coordinate"],
  [/absolute|magnitude|opposite/, "absolute"],
  [/integer|negative number|positive number|^number line|rational number/, "integer"],
  [
    /inequality|inequalities|at least|at most|no more than|solution set|boundary|open circle|closed circle/,
    "inequality",
  ],
  [/exponent|^power|squared|cubed|repeated multiplication|expanded form/, "exponent"],
  [/equation|equal sign|^balance|isolate|property of equality|true statement/, "balance"],
  [/variable|algebraic expression|coefficient|like terms|unknown|^input|^output/, "variable"],
  [/factor tree|prime|composite|^factor|^multiple|gcf|lcm|common multiple/, "factor-tree"],
];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const slug = (s) =>
  norm(s)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 46);

export function buildReference() {
  const byTerm = new Map();
  for (const l of vocabLessons) {
    for (const v of vocabOf(l.id)) {
      const key = norm(v.term);
      if (!byTerm.has(key)) byTerm.set(key, { first: l.id, v, lessons: [] });
      const rec = byTerm.get(key);
      if (!rec.lessons.includes(l.id)) rec.lessons.push(l.id);
    }
  }
  const used = new Set();
  const entries = [...byTerm.values()]
    .sort((a, b) => norm(a.v.term).localeCompare(norm(b.v.term)))
    .map(({ first, v, lessons }) => {
      let id = slug(v.term) || "term";
      for (let n = 2; used.has(id); n++) id = `${slug(v.term)}-${n}`.slice(-48);
      used.add(id);
      const preset = PRESET_BY_LESSON[first];
      const key = norm(v.term);
      const icon = (ICON_RULES.find(([re]) => re.test(key)) || [])[1] || GENERIC_BY_PRESET[preset];
      const ex = v.examples || [];
      const e = {
        id,
        term: v.term,
        termEs: v.termEs,
        definition: v.definition,
        definitionEs: v.definitionEs,
        example: v.example || ex.find((x) => x.isExample)?.text,
        nonExample: ex.find((x) => !x.isExample)?.text,
        visual: v.visual,
        frame: {
          en: `${cap(v.term)} means ___. One example is ___.`,
          es: `${cap(v.termEs)} significa ___. Un ejemplo es ___.`,
        },
        lessons: lessons.sort(
          (a, b) => a.split("-")[0] - b.split("-")[0] || a.split("-")[1] - b.split("-")[1],
        ),
        icon,
        sandbox: { preset },
        source: { lesson: first, term: v.term },
      };
      for (const k of Object.keys(e)) if (e[k] === undefined) delete e[k];
      return e;
    });
  return {
    v: 1,
    note: "Built by `node tools/ewl-cockpit.test.mjs --write` from lessons/<id>/config.json vocabulary (Units 2-9). Do not hand-edit: change the lesson and rebuild.",
    entries,
  };
}

export function workbenchPresets() {
  const html = readFileSync(rel("curriculum/math-workbench/index.html"), "utf8");
  const a = html.indexOf("const PRESETS = {");
  const b = html.indexOf("const mwbTypeProbe", a);
  assert.ok(a > 0 && b > a, "could not find the Math Workbench PRESETS block");
  return [...html.slice(a, b).matchAll(/^ {8}"?([a-z0-9-]+)"?: \{$/gm)].map((m) => m[1]);
}

/** @param {{ewl?: any}} [o] */
export function referenceContext(o = {}) {
  const ewl = o.ewl || loadEwl({ only: EWL_CORE }).EWL;
  return {
    ewl,
    lessonIds: taught.map((l) => l.id),
    lookup: vocabOf,
    iconKeys: ewl.Reference.iconKeys(),
    presets: workbenchPresets(),
  };
}
export function validateReference(data, ctx = referenceContext()) {
  const p = ctx.ewl.Reference.validate(data, ctx);
  const hand = new Set(
    data.entries.map((e) => e.icon).filter((k) => ctx.ewl.Reference.ICONS[k]?.hand),
  );
  if (hand.size < 12) p.push(`only ${hand.size} hand-drawn pictures are used (need 12)`);
  return p;
}

const genOf = (data) => {
  const found = new Set();
  (function walk(o) {
    if (Array.isArray(o)) o.forEach(walk);
    else if (o && typeof o === "object") {
      if (o.k === "gen") found.add(o.g);
      Object.values(o).forEach(walk);
    }
  })(data?.fresh);
  return [...found];
};
/** The check-yourself config must agree with the disk: studio files, generator files, levels. */
export function validateCheckConfig(cfg, registryByFile) {
  const p = [];
  if (cfg.v !== 1 || !Array.isArray(cfg.levels) || cfg.levels.length !== 3)
    p.push("levels must be three numbers");
  const onDisk = taught
    .map((l) => l.id)
    .filter((id) => existsSync(rel(`data/practice-studio/${id}.json`)));
  if (JSON.stringify([...cfg.studio].sort()) !== JSON.stringify([...onDisk].sort()))
    p.push("studio list differs from data/practice-studio");
  for (const [g, f] of Object.entries(cfg.genFiles))
    if (!(registryByFile[f] || []).includes(g))
      p.push(`generator ${g} is not registered by studio-gen/${f}.js`);
  for (const id of cfg.studio)
    for (const g of genOf(readJson(`data/practice-studio/${id}.json`)))
      if (!cfg.genFiles[g]) p.push(`lesson ${id} uses ${g}, which has no file`);
  return p;
}

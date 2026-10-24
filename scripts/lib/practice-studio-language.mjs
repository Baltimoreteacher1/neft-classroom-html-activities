// The language layer's build-time half (assets/studio/language*.js reads what this writes into each page's studio data).
//
//   data/practice-studio/language-layer.json    { v, extraTerms, lessons: { "<id>": { cog, pic, frL } } }
//   languageFor(id, ld, built, ctx)             -> { wb, cog, pic, frL } for one lesson, embedded as `lang` in #studio-data
//
// The WORD BANK is derived, never hand-listed: the lesson's own glossary first (unchanged), then every math term its problems
// actually use -- the stems of the authored items plus a fixed sample of what each generator and activity makes -- up to MAX_BANK.
// Definitions are the plain EN/ES ones in data/family-plain-definitions.json; Spanish term names come from the lesson vocabulary.
// A term is a math term when it is a glossary term, a family-plain-definition key of at most three words that is not on the
// NOT_TERMS list, or an `extraTerms` entry of the layer file. Nothing here knows any mathematics beyond that list.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { listLessonDirs, loadLessonConfig, REPO_ROOT } from "../../tools/lib/curriculum-source.mjs";
import { loadStudio } from "../../tools/lib/studio-vm.mjs";

export const LAYER_FILE = "data/practice-studio/language-layer.json";
export const MAX_BANK = 24;
/** Seeds sampled per generator and level when collecting the stems a student will meet. */
const SEEDS = [7, 53, 211, 733, 1597, 3187];
/** Words a plain definition may not use (idioms the studios avoid); a term whose definition has one stays out of the bank. */
export const BANNED_IDIOMS = [/\bline up\b/i, /\bwork out\b/i, /\bfigure out\b/i, /\bchef\b/i];
/** Family-plain keys that are lesson titles, habits of mind or ordinary words rather than terms a stem needs explained. */
export const NOT_TERMS = new Set(
  `add subtract multiply divide solve combine community doer of math math biography math story persevere profession puzzle rhythm gear
   ingenuity inventory strength strategy tool predictability repetition relationship part portion order organize argument confidence
   critique conjecture generalization magnitude peak predict understand ratios represent representation interpret justify problem
   solving growth variation pattern unit model term gap whole less than greater than at least most no more than per`.split(
    /\s+/,
  ),
);
for (const w of [
  "doer of math",
  "math biography",
  "math story",
  "pattern unit",
  "problem solving",
  "the whole",
  "less than",
  "greater than",
  "at least",
  "at most",
  "no more than",
  "at least / at most",
])
  NOT_TERMS.add(w);

const readJson = (rel) => JSON.parse(readFileSync(join(REPO_ROOT, rel), "utf8"));
export const loadLayer = () =>
  existsSync(join(REPO_ROOT, LAYER_FILE))
    ? readJson(LAYER_FILE)
    : { v: 1, extraTerms: {}, lessons: {} };

/** Lower-cased English term -> Spanish term, from every lesson's vocabulary and studio glossary (the commonest wording wins). */
function spanishNames() {
  const counts = new Map();
  const bump = (t, e) => {
    const k = String(t || "")
      .trim()
      .toLowerCase();
    const v = String(e || "")
      .trim()
      .toLowerCase();
    if (!k || !v) return;
    const m = counts.get(k) || new Map();
    m.set(v, (m.get(v) || 0) + 1);
    counts.set(k, m);
  };
  for (const id of listLessonDirs({ filter: /^\d+-\d+$/ })) {
    try {
      for (const v of loadLessonConfig(id).vocabulary || []) bump(v.term, v.termEs);
    } catch {
      /* a lesson without a readable config adds no names */
    }
    const f = `data/practice-studio/${id}.json`;
    if (existsSync(join(REPO_ROOT, f)))
      for (const g of readJson(f).glossary || []) bump(g.t, g.tEs);
  }
  return new Map([...counts].map(([k, m]) => [k, [...m].sort((a, b) => b[1] - a[1])[0][0]]));
}

/** @type {{plain: Record<string, any>, es: Map<string, string>}|null} */
let cache = null;
function sources() {
  if (!cache)
    cache = { plain: readJson("data/family-plain-definitions.json").terms, es: spanishNames() };
  return cache;
}

/** Every term definition we can offer: lowercase English term -> { t, tEs, d, dEs }. The lesson glossary overrides the plain list. */
export function termTable(/** @type {any[]} */ glossary, /** @type {any} */ layer) {
  const { plain, es } = sources();
  /** @type {Map<string, any>} */
  const table = new Map();
  for (const [key, def] of Object.entries(plain)) {
    const k = key.toLowerCase();
    if (NOT_TERMS.has(k) || k.split(/\s+/).length > 3 || /[/(]/.test(k)) continue;
    const tEs = layer.extraTerms?.[k]?.tEs || es.get(k);
    if (!tEs || !def.en || !def.es) continue;
    if (BANNED_IDIOMS.some((re) => re.test(def.en) || re.test(def.es))) continue;
    table.set(k, { t: key, tEs, d: def.en, dEs: def.es });
  }
  for (const [k, x] of Object.entries(layer.extraTerms || {}))
    if (x.d && x.dEs && x.tEs) table.set(k.toLowerCase(), { t: k, tEs: x.tEs, d: x.d, dEs: x.dEs });
  for (const g of glossary || [])
    table.set(String(g.t).toLowerCase(), { t: g.t, tEs: g.tEs, d: g.d, dEs: g.dEs });
  return table;
}

/** @type {any} */
let studio = null;
const vm = () => (studio ||= loadStudio({ gen: true, act: true, viz: true }));

/**
 * The problem text a lesson's studios can show, as { en, es, id } pairs: authored stems plus a fixed sample of every generator and
 * activity. `es` is "" when the item has none. The first field of each item that holds text (q, p) and its situation (ctx) are listed.
 */
export function stemPairs(/** @type {{sections: Record<string, any[]>}} */ built) {
  const ctx = vm();
  const seen = new Set();
  /** @type {{en: string, es: string, id: string}[]} */
  const out = [];
  const add = (/** @type {any} */ x, /** @type {string} */ id) => {
    for (const [f, fEs] of [
      ["q", "qEs"],
      ["p", "pEs"],
      ["ctx", "ctxEs"],
      ["prompt", "promptEs"],
    ]) {
      const en = x?.[f];
      if (typeof en === "string" && en && !seen.has(en)) {
        seen.add(en);
        out.push({ en, es: typeof x[fEs] === "string" ? x[fEs] : "", id });
      }
    }
  };
  const done = new Set();
  for (const mode of ["practice", "challenge"])
    for (const sec of built.sections[mode])
      for (const spec of [...sec.items, ...(sec.pool || [])]) {
        if (spec.k === "gen" || spec.k === "act") {
          for (const level of [Math.max(1, spec.level - 1), spec.level]) {
            const sig = `${spec.k}|${spec.g || spec.kind}|${level}|${spec.shape || ""}|${JSON.stringify(spec.p || null)}`;
            if (done.has(sig)) continue;
            done.add(sig);
            for (const seed of SEEDS) {
              try {
                add(
                  spec.k === "gen"
                    ? ctx.StudioGen.make(spec.g, level, seed, spec.shape)
                    : ctx.StudioAct.make(spec.kind, level, seed, spec.p),
                  `${spec.g || spec.kind}@${level}`,
                );
              } catch {
                /* a seed a generator rejects simply adds no stem */
              }
            }
          }
        } else add(spec, String(spec.id || spec.k));
      }
  return out;
}
export const stemsOf = (/** @type {any} */ built) => stemPairs(built).map((x) => x.en);

/** How many of `stems` use each term (lower-cased key). Plurals count. */
export function termCounts(/** @type {string[]} */ stems, /** @type {Map<string, any>} */ table) {
  const counts = new Map();
  const text = stems.join("\n").toLowerCase();
  const esc = (/** @type {string} */ s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  for (const k of table.keys()) {
    const re = new RegExp(`(?<![\\p{L}\\p{N}])${esc(k)}(?:es|s)?(?![\\p{L}\\p{N}])`, "gu");
    const n = (text.match(re) || []).length;
    if (n) counts.set(k, n);
  }
  return counts;
}

/**
 * The lesson's `lang` block. `wb` keeps the glossary entries first and exactly as authored, then the most-used terms its problems
 * contain, to MAX_BANK entries. Returns the coverage figures the test reports.
 */
export function languageFor(
  /** @type {string} */ id,
  /** @type {any} */ ld,
  /** @type {any} */ built,
  /** @type {any} */ layer = loadLayer(),
) {
  const table = termTable(ld.glossary, layer);
  const stems = stemsOf(built);
  const counts = termCounts(stems, table);
  const own = (ld.glossary || []).map((/** @type {any} */ g) => String(g.t).toLowerCase());
  const used = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([k]) => k);
  // a term inside a longer term that is also used ("prism" in "rectangular prism") rides along with the longer one
  const keep = used.filter(
    (k) =>
      !own.includes(k) &&
      !used.some((o) => o !== k && o.includes(k) && counts.get(o) >= counts.get(k)),
  );
  const wb = [...own, ...keep].slice(0, MAX_BANK).map((k) => {
    const x = table.get(k);
    return { t: x.t, tEs: x.tEs, d: x.d, dEs: x.dEs };
  });
  const row = layer.lessons?.[id] || {};
  const stem = (/** @type {string} */ w) => w.toLowerCase().replace(/(es|s)$/, "");
  const inBank = new Set(wb.map((g) => g.t.toLowerCase()));
  const pic = Object.fromEntries(
    Object.entries(row.pic || {}).map(([k, v]) => [k.toLowerCase(), v]),
  );
  return {
    lang: { wb, cog: row.cog || [], pic, frL: row.frL || {} },
    coverage: {
      used: used.length,
      covered: used.filter((k) => inBank.has(k) || wb.some((g) => stem(g.t) === stem(k))).length,
      missing: used.filter((k) => !inBank.has(k) && !wb.some((g) => stem(g.t) === stem(k))),
    },
    stems,
  };
}

// strategy-gallery.js — "Sample solutions": one problem, solved three ways.
//
// After a student has written their own explanation they can open a gallery of
// solutions grouped by STRATEGY, with three comparison questions: What is the
// same? Which is quicker? When would the other one be better? The point is to
// see that strategies are choices, not that there is a right one to copy.
//
// PRIVACY, which is why this is not "how your classmates solved it":
//   - Every solution here is authored (strategy-gallery-samples.js) and labelled
//     "Sample solutions". No student's work is shown, so there is no name, no
//     section and nothing to approve.
//   - The gallery reads nothing from a server and writes nothing anywhere: no
//     fetch, no storage, no telemetry.
//   - The one public read of real student work, GET /api/progress/exemplars, is
//     NOT used. It is activity-scoped, returns first name + last initial and
//     raw free text, and its teacher approval covers the project-page showcase
//     only. See the report that shipped with this file for what making real
//     classmate exemplars safe would take.
//
// The gallery is optional and never gates anything. A domain with no authored
// samples shows nothing.

import { getPreferredLang } from "./i18n.js";
import { resolveStrategyDomain } from "./small-group-strategies.js";
import { SAMPLE_PROBLEMS } from "./strategy-gallery-samples.js";

/**
 * The three strategy groups. The ids are the categories small-group-strategies.js
 * already uses for its "Try another way" cards, so the two features speak one
 * vocabulary (a test pins that).
 */
export const STRATEGY_GROUPS = Object.freeze([
  { id: "visual", icon: "▧", en: "Draw or model it", es: "Dibújalo o modélalo" },
  { id: "calculate", icon: "✏️", en: "Write and calculate", es: "Escribe y calcula" },
  { id: "verbal", icon: "🗣️", en: "Explain it in words", es: "Explícalo con palabras" },
]);

const OTHER_GROUP = Object.freeze({
  id: "other",
  icon: "💡",
  en: "Another approach",
  es: "Otro enfoque",
});

export const COMPARE_PROMPTS = Object.freeze([
  { en: "What is the same?", es: "¿Qué es igual?" },
  { en: "Which is quicker?", es: "¿Cuál es más rápida?" },
  { en: "When would the other one be better?", es: "¿Cuándo sería mejor la otra?" },
]);

// ── Classifier ────────────────────────────────────────────────────────────────
// Deterministic and evidence-based: each strategy scores the phrases that name
// what the writer did. A drawn model is named by its tool, a calculation by its
// operations, an explanation by saying so. No evidence, no group: the solution
// goes under "Another approach" rather than being forced into one.

const OPERATION = /\d\s*(?:[×*÷/+=−-]|x(?=\s*\d))\s*\d/g;
const VISUAL_CUES = [
  /\bdr(?:ew|aw|awn|awing)\b/,
  /\bsketch/,
  /\btable\b/,
  /\bnumber line\b/,
  /\btape diagram\b/,
  /\bdiagram\b/,
  /\bbar model\b/,
  /\bbalance scale\b/,
  /\bgraph/,
  /\bpicture\b/,
  /\bmodel/,
];
const CALCULATE_WORDS = [
  /\bequation\b/,
  /\bformula\b/,
  /\bmultipl/,
  /\bdivid/,
  /\bsubtract/,
  /\binverse\b/,
  /\bcalculat/,
  /\bcomput/,
];
/** @type {[RegExp, number][]} */
const VERBAL_CUES = [
  [/\bexplain(?:ed)?\b/, 3],
  [/\bin words\b/, 3],
  [/\btalk(?:ed)?\b/, 2],
  [/\btimes as (?:many|much)\b/, 2],
  [/\bbecause\b/, 1],
];

/**
 * @param {string} text  one written solution
 * @returns {"visual"|"calculate"|"verbal"|null}  null when the text names no strategy
 */
export function classifyStrategy(text) {
  const lower = String(text || "").toLowerCase();
  const visual = VISUAL_CUES.filter((cue) => cue.test(lower)).length * 3;
  const operations = Math.min(3, (lower.match(OPERATION) || []).length) * 2;
  const calculate = operations + CALCULATE_WORDS.filter((cue) => cue.test(lower)).length;
  const verbal = VERBAL_CUES.reduce(
    (sum, [cue, weight]) => sum + (cue.test(lower) ? weight : 0),
    0,
  );
  const best = Math.max(visual, calculate, verbal);
  if (best === 0) return null;
  // Ties resolve in the order the groups are taught: model, then calculation, then words.
  if (visual === best) return "visual";
  if (calculate === best) return "calculate";
  return "verbal";
}

/**
 * Group solutions by strategy, in teaching order, dropping empty groups.
 * @param {{en: string, es?: string}[]} solutions
 */
export function groupByStrategy(solutions) {
  const buckets = new Map();
  for (const solution of solutions) {
    const id = classifyStrategy(solution.en) || OTHER_GROUP.id;
    if (!buckets.has(id)) buckets.set(id, []);
    buckets.get(id).push(solution);
  }
  return [...STRATEGY_GROUPS, OTHER_GROUP]
    .filter((group) => buckets.has(group.id))
    .map((group) => ({ ...group, solutions: buckets.get(group.id) }));
}

// ── Choosing a sample ────────────────────────────────────────────────────────

const numbersOf = (text) => new Set(String(text || "").match(/\d+(?:\.\d+)?/g) || []);

function itemNumbers(item) {
  const own = [item?.stem, item?.prompt, item?.title, item?.answer, item?.correctAnswer];
  return numbersOf(own.filter((part) => part != null).join(" "));
}

const hashKey = (key) =>
  [...String(key || "lesson")].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0);

/**
 * The sample problem to show for this lesson and item, or null. A sample that
 * shares two or more numbers with the student's own item is skipped, so the
 * gallery is never a place to read the answer to the problem just done. The
 * starting sample varies by lesson, deterministically.
 */
export function pickSample(config = {}, item = {}) {
  const pool = SAMPLE_PROBLEMS[resolveStrategyDomain(config, item)];
  if (!pool?.length) return null;
  const avoid = itemNumbers(item);
  const start = hashKey(config.lessonId || config.title) % pool.length;
  for (let offset = 0; offset < pool.length; offset += 1) {
    const sample = pool[(start + offset) % pool.length];
    const shared = [...numbersOf(sample.problem.en)].filter((n) => avoid.has(n)).length;
    if (shared < 2) return sample;
  }
  return null;
}

// ── Rendering ────────────────────────────────────────────────────────────────

const COPY = {
  open: { en: "See sample solutions", es: "Ver soluciones de ejemplo" },
  badge: { en: "Sample solutions", es: "Soluciones de ejemplo" },
  note: {
    en: "Written examples, not your classmates' work. There is no right one to copy.",
    es: "Ejemplos escritos, no el trabajo de tus compañeros. No hay una correcta que copiar.",
  },
  problem: {
    en: "A different problem, solved three ways",
    es: "Otro problema, resuelto de tres maneras",
  },
  compare: { en: "Compare the ways", es: "Compara las maneras" },
  talk: {
    en: "Talk it over with a partner, or write one sentence.",
    es: "Coméntalo con un compañero o escribe una oración.",
  },
};

const STYLE_ID = "sgal-styles";
const CSS = `
.sgal{--sgal-ink:var(--sg-deep,var(--navy,#12355b));--sgal-soft:var(--sg-soft,var(--teal-light,#eaf0f7));--sgal-muted:var(--sg-muted,var(--muted,#475569));--sgal-line:var(--sg-line,var(--line,#cbd5e1));margin:16px 0;border:2px solid var(--sgal-line);border-radius:14px;background:var(--card,#fff);color:var(--text,#0f172a)}
.sgal>summary{display:flex;flex-direction:column;justify-content:center;min-height:44px;padding:8px 16px;font-weight:700;color:var(--sgal-ink);cursor:pointer}
.sgal>summary:focus-visible{outline:3px solid var(--sgal-ink);outline-offset:2px;border-radius:12px}
.sgal>summary .sgal-es{margin:0;font-weight:500}
.sgal-body{display:grid;gap:12px;padding:4px 16px 16px}
.sgal-badge{margin:0;display:inline-block;justify-self:start;padding:3px 12px;border-radius:999px;background:var(--sgal-ink);color:var(--card,#fff);font-size:.75rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
.sgal-body p{margin:0;line-height:1.5}
.sgal-problem{padding:10px 12px;border-left:4px solid var(--sgal-ink);border-radius:0 8px 8px 0;background:var(--sgal-soft)}
.sgal-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr));gap:12px}
.sgal-card{min-width:0;padding:12px;border:1.5px solid var(--sgal-line);border-radius:12px}
.sgal-card h4{margin:0 0 6px;font-size:1rem;color:var(--sgal-ink)}
.sgal-es{display:block;margin-top:6px;font-size:.9em;font-style:italic;color:var(--sgal-muted)}
.sgal-compare{padding:12px;border-radius:12px;background:var(--sgal-soft)}
.sgal-compare h4{margin:0 0 6px;color:var(--sgal-ink)}
.sgal-compare ol{margin:0 0 6px;padding-left:1.3rem}
.sgal-compare li{margin:4px 0}
:root[data-theme="dark"] .sgal{--sgal-ink:#c7d7ee;--sgal-soft:#1c2740;--sgal-muted:#b6c2d6;--sgal-line:#3a4a6b}
`;

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS;
  (document.head || document.documentElement).append(style);
}

function node(tag, cls, content) {
  const created = document.createElement(tag);
  if (cls) created.className = cls;
  if (content != null) created.textContent = content;
  return created;
}

/** A line in the student's language, with the other language under it. */
function pairInto(parent, pair, lang) {
  const lead = lang === "es" ? "es" : "en";
  const sub = lead === "es" ? "en" : "es";
  parent.append(document.createTextNode(pair[lead]));
  if (pair[sub]) {
    const second = node("span", "sgal-es", pair[sub]);
    second.lang = sub;
    parent.append(second);
  }
}

/**
 * Mount the optional gallery into `host`. Returns the <details> element, or null
 * when this lesson has no authored samples (nothing is mounted).
 *
 * @param {HTMLElement} host
 * @param {{config?: object, item?: object, language?: string}} [options]
 */
export function mountStrategyGallery(host, { config = {}, item = {}, language } = {}) {
  const sample = host ? pickSample(config, item) : null;
  if (!sample) return null;
  ensureStyles();
  const lang = (language || getPreferredLang()) === "es" ? "es" : "en";

  const root = node("details", "sgal");
  root.dataset.strategyGallery = "";
  root.dataset.sample = sample.id;
  const summary = node("summary");
  pairInto(summary, COPY.open, lang);
  root.append(summary);

  const body = node("div", "sgal-body");
  body.append(node("p", "sgal-badge", COPY.badge[lang]));
  const note = node("p");
  pairInto(note, COPY.note, lang);
  body.append(note);

  const problem = node("p", "sgal-problem");
  const label = node("b", "", `${COPY.problem[lang]}: `);
  problem.append(label, document.createTextNode(sample.problem[lang]));
  body.append(problem);

  const cards = node("div", "sgal-cards");
  for (const group of groupByStrategy(sample.solutions)) {
    for (const solution of group.solutions) {
      const card = node("section", "sgal-card");
      card.dataset.strategy = group.id;
      card.append(node("h4", "", `${group.icon} ${group[lang]}`));
      const text = node("p");
      pairInto(text, solution, lang);
      card.append(text);
      cards.append(card);
    }
  }
  body.append(cards);

  const compare = node("section", "sgal-compare");
  compare.append(node("h4", "", COPY.compare[lang]));
  const list = node("ol");
  for (const prompt of COMPARE_PROMPTS) {
    const li = node("li");
    pairInto(li, prompt, lang);
    list.append(li);
  }
  compare.append(list, node("p", "", COPY.talk[lang]));
  body.append(compare);

  root.append(body);
  host.append(root);
  return root;
}

export default mountStrategyGallery;

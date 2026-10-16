/**
 * "Then vs. now" bridge card for the grown-up panel of a family homework page.
 *
 * A grown-up who learned a skill one way and sees the class method in the
 * child's work often decides one of them is wrong. The card answers that
 * before it is asked: how you may have learned it, how we do it in class, and
 * why both give the same answer. Authored per lesson in the sidecar
 * (`data/family-homework-notes/<id>.json`, key `bridge`); the class line must
 * be the lesson's own method, so nothing here is generated from a template.
 *
 * Which units must carry a card is ONE list, BRIDGE_UNITS. Extending the card
 * to another unit is: add the unit number here, author the sidecars, run
 * tools/homework-bridge-card.test.mjs (spec: docs/specs/family-homework-bridge-card.md).
 */

export const BRIDGE_UNITS = ["4", "6"];

export const BRIDGE_ROWS = [
  {
    key: "before",
    icon: "🕰️",
    labelEn: "How you may have learned it",
    labelEs: "Cómo pudiste haberlo aprendido",
  },
  {
    key: "class",
    icon: "🏫",
    labelEn: "How we do it in class",
    labelEs: "Cómo lo hacemos en clase",
  },
  { key: "why", icon: "🤝", labelEn: "Why both work", labelEs: "Por qué ambos funcionan" },
];

/** Word limits keep the card readable at the kitchen table (grade 6 and below). */
export const BRIDGE_LIMITS = { minWords: 6, maxWordsEn: 45, maxWordsEs: 55 };

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

/** The unit number a homework id belongs to ("6-3-part2" -> "6"). */
export const bridgeUnit = (id) => String(id).split("-")[0];

/** True when this homework page must carry a bridge card. */
export const bridgeRequired = (id) => BRIDGE_UNITS.includes(bridgeUnit(id));

const pairOk = (x) =>
  x && typeof x.en === "string" && x.en.trim() && typeof x.es === "string" && x.es.trim();

/** The bridge when all three rows are bilingual; otherwise null (render nothing). */
export function bridgeOf(notes) {
  const b = notes?.bridge;
  return b && BRIDGE_ROWS.every((r) => pairOk(b[r.key])) ? b : null;
}

/** Text a screen reader or Listen button speaks, in one language. */
export function bridgeSpeech(bridge, lang) {
  const es = lang === "es";
  return BRIDGE_ROWS.map(
    (r) => `${es ? r.labelEs : r.labelEn}. ${es ? bridge[r.key].es : bridge[r.key].en}`,
  ).join(" ");
}

/**
 * The card, as markup. `listen` is the escaped handler call for the Listen
 * button (the page's own speak function), passed in so this module stays
 * free of page code.
 */
export function renderBridgeCard(bridge, listen) {
  if (!bridge) return "";
  const rows = BRIDGE_ROWS.map(
    (r) => `
          <li class="bridge-row bridge-${r.key}">
            <span class="bridge-icon" aria-hidden="true">${r.icon}</span>
            <div>
              <strong class="bridge-label"><span class="lang-en">${esc(r.labelEn)}</span><span class="lang-es" lang="es">${esc(r.labelEs)}</span></strong>
              <p class="lang-en">${esc(bridge[r.key].en)}</p>
              <p class="lang-es" lang="es">${esc(bridge[r.key].es)}</p>
            </div>
          </li>`,
  ).join("");
  return `
        <details class="bridge-card" data-bridge-card>
          <summary><span aria-hidden="true">🌉</span> <span class="lang-en">Then vs. now: why class math may look different</span><span class="lang-es" lang="es">Antes y ahora: por qué las matemáticas de clase pueden verse distintas</span></summary>
          <ol class="bridge-rows">${rows}
          </ol>
          <button type="button" class="btn-read-aloud bridge-listen" onclick="${listen}" aria-label="Listen to this card" data-aria-en="Listen to this card" data-aria-es="Escuchar esta tarjeta">🔊 <span class="lang-en">Listen</span><span class="lang-es" lang="es">Escuchar</span></button>
        </details>`;
}

export const BRIDGE_CSS = `
.bridge-card { margin-top: 10px; border-top: 1.5px dashed #c9d8ea; padding-top: 8px; }
.bridge-card > summary { cursor: pointer; min-height: 44px; display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 14.5px; color: var(--navy); }
.bridge-card > summary:focus-visible { outline: 3px solid var(--teal-ink); outline-offset: 2px; border-radius: 6px; }
.bridge-rows { list-style: none; margin: 6px 0 0; padding: 0; display: grid; gap: 10px; }
.bridge-row { display: flex; gap: 10px; align-items: flex-start; padding: 10px 12px; border-radius: 10px; background: #fff; border: 1px solid #d7e2ed; }
.bridge-row.bridge-class { border-color: var(--teal); background: #f1fbf9; }
.bridge-icon { font-size: 22px; line-height: 1.2; }
.bridge-label { display: block; font-size: 13px; letter-spacing: .02em; text-transform: uppercase; color: var(--teal-ink); }
.bridge-row p { margin: 3px 0 0; font-size: 15.5px; line-height: 1.5; }
.bridge-listen { margin-top: 10px; }
@media print { .bridge-card:not([open]) > *:not(summary) { display: none; } }
`;

/* ───────────────────────── validation (used by the test) ───────────────────────── */

const ES_WORDS = /\b(de|la|el|los|las|que|en|se|y|un|una|por|con|para|es|son|lo|del)\b/i;
const VAGUE = /^\s*(start|show it|solve)\b/i;
const TIMER = /\b(timer|countdown|stopwatch|beat the clock|race the clock)\b/i;
/* "todo" is a Spanish word and "método" must not trip it, so only the capitalised marker counts. */
const PLACEHOLDER = /\b(?:TBD|tbd|lorem|placeholder|xxx)\b|\bTODO\b/;
/** Numerals the card may use without finding them in the lesson (counting words, "per 100"). */
const FREE_NUMBERS = new Set(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "100"]);

const words = (s) => String(s).trim().split(/\s+/).filter(Boolean).length;
const numerals = (s) => String(s).match(/\d[\d,]*(?:\.\d+)?/g) || [];
const norm = (n) => n.replace(/,/g, "");

/**
 * Problems with one sidecar's bridge, [] when sound.
 * `lessonText` is every string the lesson itself states (sidecar + config), so
 * a number on the card must be one the lesson already teaches with.
 */
export function bridgeProblems(id, bridge, lessonText = "") {
  const out = [];
  const at = (m) => out.push(`${id}: bridge ${m}`);
  if (!bridge || typeof bridge !== "object") return [`${id}: bridge is missing`];
  const known = new Set(numerals(lessonText).map(norm));
  for (const row of BRIDGE_ROWS) {
    const pair = bridge[row.key];
    if (!pairOk(pair)) {
      at(`${row.key} needs non-empty en and es`);
      continue;
    }
    for (const lang of ["en", "es"]) {
      const text = pair[lang];
      const n = words(text);
      const max = lang === "en" ? BRIDGE_LIMITS.maxWordsEn : BRIDGE_LIMITS.maxWordsEs;
      if (n < BRIDGE_LIMITS.minWords || n > max)
        at(`${row.key}.${lang} is ${n} words (allowed ${BRIDGE_LIMITS.minWords}-${max})`);
      if (VAGUE.test(text)) at(`${row.key}.${lang} opens with a vague step word`);
      if (TIMER.test(text)) at(`${row.key}.${lang} uses timer language`);
      if (PLACEHOLDER.test(text)) at(`${row.key}.${lang} is a placeholder`);
      for (const num of numerals(text).map(norm)) {
        if (!FREE_NUMBERS.has(num) && !known.has(num))
          at(`${row.key}.${lang} uses ${num}, which the lesson never states`);
      }
    }
    if (pair.es.trim() === pair.en.trim()) at(`${row.key}.es is the English copied over`);
    else if (!ES_WORDS.test(pair.es)) at(`${row.key}.es does not read as Spanish`);
  }
  return out;
}

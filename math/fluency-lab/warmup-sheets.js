// Untimed lesson warm-ups tied to a Reveal unit: Pair Compare (partners solve matching problems with different
// numbers, then compare their thinking) and Mix and Match (cut-out cards: problems and answers). Pure builders
// that return printable HTML in English or Spanish; the answer key is always its own last page. No clock, no score.
import { ALL_SKILLS, generateProblem, seededRandom } from "./problem-bank.js";
import { questionEs } from "./question-es.js";
import { escapeHtml as esc } from "./school-tools.js";
import { problemText } from "./writing-prompts.js";

export const WARMUP_FORMATS = Object.freeze(["pair", "match"]);
const PAIR_ROWS = 4;
const MATCH_CARDS = 8;

const COPY = {
  en: {
    pair: "Pair Compare",
    match: "Mix and Match",
    unit: "Unit {n}",
    a: "Partner A",
    b: "Partner B",
    pairSteps: [
      "Each partner solves their own problem. Take the time you need.",
      "Swap papers. Explain your steps to your partner, then listen to theirs.",
      "Compare: what is the same? What is different? Write one thing you noticed.",
    ],
    noticed: "We noticed:",
    matchSteps: [
      "Cut out the problem cards and the answer cards.",
      "Match each problem to its answer. Talk about how you know.",
      "Check each match with your partner. Fix any you want to change.",
    ],
    key: "Answer key (teacher copy)",
    name: "Names",
    card: "Problem {n}",
    answerCard: "Answer {letter}",
  },
  es: {
    pair: "Comparar en pareja",
    match: "Mezcla y empareja",
    unit: "Unidad {n}",
    a: "Compañero A",
    b: "Compañero B",
    pairSteps: [
      "Cada compañero resuelve su propio problema. Tómense el tiempo que necesiten.",
      "Intercambien los papeles. Expliquen sus pasos a su compañero y escuchen los de él o ella.",
      "Comparen: ¿qué es igual? ¿Qué es diferente? Escriban algo que notaron.",
    ],
    noticed: "Notamos:",
    matchSteps: [
      "Recorten las tarjetas de problemas y las tarjetas de respuestas.",
      "Emparejen cada problema con su respuesta. Conversen sobre cómo lo saben.",
      "Revisen cada pareja con su compañero. Cambien las que quieran corregir.",
    ],
    key: "Clave de respuestas (copia del maestro)",
    name: "Nombres",
    card: "Problema {n}",
    answerCard: "Respuesta {letter}",
  },
};
const fill = (text, vars) => text.replace(/\{(\w+)\}/g, (_, name) => vars[name]);
const LETTERS = "ABCDEFGHIJKL";

const answerOf = (item) => `${item.displayAnswer ?? item.answers?.[0] ?? ""}${item.unit ? ` ${item.unit}` : ""}`;

// `count` distinct typed-answer problems from the unit's skills, rotating through the skills; same seed, same set.
export function warmupProblems(unit, count, seed = 1) {
  const rng = seededRandom(seed * 7919 + unit.unit);
  const skills = unit.keys
    .map((key) => ALL_SKILLS.find((skill) => `${skill.grade}:${skill.id}` === key))
    .filter(Boolean);
  const items = [];
  const seen = new Set();
  for (let guard = 0; items.length < count && guard < count * 40; guard += 1) {
    const skill = skills[guard % skills.length];
    const item = generateProblem(skill, rng);
    if (item.choices || seen.has(item.question) || !item.answers?.length) continue;
    seen.add(item.question);
    items.push({ item, skill });
  }
  return items;
}

const text = (item, lang) => problemText(lang === "es" ? { ...item, question: questionEs(item) || item.question } : item);

function pairPage(unit, seed, lang) {
  const c = COPY[lang];
  const rows = warmupProblems(unit, PAIR_ROWS * 2, seed);
  const pairs = Array.from({ length: PAIR_ROWS }, (_, i) => [rows[i * 2], rows[i * 2 + 1]]).filter(([a, b]) => a && b);
  const cell = (entry, who, n) => `<td><b>${esc(who)}</b><p>${esc(n)}. ${esc(text(entry.item, lang))}</p></td>`;
  const key = pairs.map(([a, b], i) => `<li>${i + 1}. A: ${esc(answerOf(a.item))} · B: ${esc(answerOf(b.item))}</li>`).join("");
  return `<article class="fl-warmup" lang="${lang}"><header><p>${esc(fill(c.unit, { n: unit.unit }))} · ${esc(lang === "es" ? unit.es : unit.en)}</p><h1>${esc(c.pair)}</h1><div><span>${esc(c.name)}: ______________ / ______________</span></div></header>
    <ol class="fl-warmup-steps">${c.pairSteps.map((step) => `<li>${esc(step)}</li>`).join("")}</ol>
    <table class="fl-warmup-pairs"><tbody>${pairs.map(([a, b], i) => `<tr>${cell(a, c.a, i + 1)}${cell(b, c.b, i + 1)}</tr>`).join("")}</tbody></table>
    <p class="fl-warmup-noticed">${esc(c.noticed)} ______________________________________________</p>
    <section class="fl-warmup-key"><h2>${esc(c.key)}</h2><ul>${key}</ul></section></article>`;
}

// The answer cards are shuffled by the seed so the order never matches the problems.
function matchPage(unit, seed, lang) {
  const c = COPY[lang];
  const picks = warmupProblems(unit, MATCH_CARDS, seed);
  const order = picks.map((_, i) => i);
  const rng = seededRandom(seed * 104729 + 3);
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const problemCards = picks.map((entry, i) => `<div class="fl-warmup-card"><b>${esc(fill(c.card, { n: i + 1 }))}</b><p>${esc(text(entry.item, lang))}</p></div>`).join("");
  const answerCards = order.map((index, slot) => `<div class="fl-warmup-card"><b>${esc(fill(c.answerCard, { letter: LETTERS[slot] }))}</b><p>${esc(answerOf(picks[index].item))}</p></div>`).join("");
  const key = order.map((index, slot) => `<li>${index + 1} → ${LETTERS[slot]}</li>`).join("");
  const steps = `<ol class="fl-warmup-steps">${c.matchSteps.map((step) => `<li>${esc(step)}</li>`).join("")}</ol>`;
  const head = `<header><p>${esc(fill(c.unit, { n: unit.unit }))} · ${esc(lang === "es" ? unit.es : unit.en)}</p><h1>${esc(c.match)}</h1></header>`;
  return `<article class="fl-warmup" lang="${lang}">${head}${steps}<div class="fl-warmup-cards">${problemCards}</div></article>
    <article class="fl-warmup" lang="${lang}"><div class="fl-warmup-cards">${answerCards}</div>
    <section class="fl-warmup-key"><h2>${esc(c.key)}</h2><ul class="fl-warmup-keylist">${key}</ul></section></article>`;
}

export function warmupHtml({ unit, format = "pair", lang = "en", seed = 1 }) {
  const langs = lang === "both" ? ["en", "es"] : [lang === "es" ? "es" : "en"];
  const build = format === "match" ? matchPage : pairPage;
  return langs.map((code) => build(unit, seed, code)).join("");
}

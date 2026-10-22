/**
 * Family word problems: authored stems, asks and hints (data/family-word-problems/<lesson>.json)
 * plus answers computed here from the numbers each problem declares. An answer is never
 * authored, so a stem and its answer cannot drift apart; tools/family-word-problems.test.mjs
 * re-derives the arithmetic independently and checks the stems carry the same numbers.
 */
import { FAMILY_LETTER_CSS, FAMILY_PAPER } from "./family-paper-css.mjs";

export const LANGS = ["en", "es"];

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Trim to at most two decimals; throws when a quantity is not exact to the cent. */
export function num(n) {
  const cents = n * 100;
  if (Math.abs(cents - Math.round(cents)) > 1e-9)
    throw new Error(`${n} is not exact to two decimals`);
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0$/, "");
}

/** A quantity with its unit: dollars prefix, anything else follows in the reader's language. */
export function amount(n, unit, lang) {
  if (unit === "$") return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
  return `${num(n)} ${unit[lang]}`;
}

const decimal = (percent) => (percent / 100).toFixed(2);

/** Part of a whole, exact: percent and whole are integers in the data. */
export function partOf(percent, whole) {
  const part = (percent * whole) / 100;
  num(part);
  return part;
}

const T = {
  en: {
    toDecimal: (p) => `Change the percent to a decimal: ${p}% = ${decimal(p)}.`,
    multiply: (p, w, part) => `Multiply: ${decimal(p)} × ${w} = ${part}.`,
    answer: (a) => `Answer: ${a}.`,
    savings: (p, w, s) => `Savings: ${decimal(p)} × ${w} = ${s}.`,
    pays: (w, s, pay) => `Sale price: ${w} − ${s} = ${pay}.`,
    saveAndPay: (s, pay) => `You save ${s} and pay ${pay}.`,
    optionOff: (name, p, w, s) => `${name} takes off ${decimal(p)} × ${w} = ${s}.`,
    optionPays: (name, w, s, pay) => `${name} costs ${w} − ${s} = ${pay}.`,
    moreOff: (name) => `${name} takes more off.`,
    sameOff: (s) => `Both discounts take off ${s}.`,
    lessCost: (name) => `${name} costs less after the discount.`,
  },
  es: {
    toDecimal: (p) => `Cambia el porcentaje a decimal: ${p}% = ${decimal(p)}.`,
    multiply: (p, w, part) => `Multiplica: ${decimal(p)} × ${w} = ${part}.`,
    answer: (a) => `Respuesta: ${a}.`,
    savings: (p, w, s) => `Ahorro: ${decimal(p)} × ${w} = ${s}.`,
    pays: (w, s, pay) => `Precio de oferta: ${w} − ${s} = ${pay}.`,
    saveAndPay: (s, pay) => `Ahorras ${s} y pagas ${pay}.`,
    optionOff: (name, p, w, s) => `${name} quita ${decimal(p)} × ${w} = ${s}.`,
    optionPays: (name, w, s, pay) => `${name} cuesta ${w} − ${s} = ${pay}.`,
    moreOff: (name) => `${name} quita más.`,
    sameOff: (s) => `Los dos descuentos quitan ${s}.`,
    lessCost: (name) => `${name} cuesta menos después del descuento.`,
  },
};

/** Worked answer for one problem in one language: an array of lines, the last is the answer. */
export function solve(problem, lang) {
  const t = T[lang];
  const unit = problem.unit;
  const a = (n) => amount(n, unit, lang);
  if (problem.kind === "percent-of") {
    const part = partOf(problem.percent, problem.whole);
    return [
      t.toDecimal(problem.percent),
      t.multiply(
        problem.percent,
        unit === "$" ? a(problem.whole) : num(problem.whole),
        unit === "$" ? a(part) : num(part),
      ),
      t.answer(a(part)),
    ];
  }
  if (problem.kind === "discount") {
    const saved = partOf(problem.percent, problem.price);
    const pay = problem.price - saved;
    return [
      t.toDecimal(problem.percent),
      t.savings(problem.percent, a(problem.price), a(saved)),
      t.pays(a(problem.price), a(saved), a(pay)),
      t.saveAndPay(a(saved), a(pay)),
    ];
  }
  if (problem.kind === "deal") {
    const rows = problem.options.map((o) => {
      const saved = partOf(o.percent, o.price);
      return {
        name: o.name[lang],
        percent: o.percent,
        price: o.price,
        saved,
        pay: o.price - saved,
      };
    });
    const [x, y] = rows;
    if (x.pay === y.pay)
      throw new Error(`${problem.id}: final prices tie, the question would be ambiguous`);
    const cheaper = x.pay < y.pay ? x : y;
    const offLine =
      x.saved === y.saved ? t.sameOff(a(x.saved)) : t.moreOff((x.saved > y.saved ? x : y).name);
    return [
      ...rows.map((r) => t.optionOff(r.name, r.percent, a(r.price), a(r.saved))),
      offLine,
      ...rows.map((r) => t.optionPays(r.name, a(r.price), a(r.saved), a(r.pay))),
      t.lessCost(cheaper.name),
    ];
  }
  throw new Error(`${problem.id}: unknown kind ${problem.kind}`);
}

const bi = (pair, tag = "p", cls = "") =>
  `<${tag}${cls ? ` class="${cls}"` : ""}>${esc(pair.en)}</${tag}>\n<${tag} class="es-text${cls ? ` ${cls}` : ""}" lang="es">${esc(pair.es)}</${tag}>`;

function problemHtml(problem, number) {
  const lines = (lang) => solve(problem, lang).map((l) => `<li>${esc(l)}</li>`);
  return `<li class="wp" id="${esc(problem.id)}">
  <p class="wp-number" aria-hidden="true">${number}</p>
  <div class="wp-body">
    ${bi(problem.stem, "p", "wp-stem")}
    <div class="callout callout--note wp-ask">
      <p><strong>Ask your student:</strong> ${esc(problem.ask.en)}</p>
      <p class="es-text" lang="es"><strong>Pregunta a tu estudiante:</strong> ${esc(problem.ask.es)}</p>
    </div>
    <details class="wp-hint">
      <summary>Hint <span class="es">· Pista</span></summary>
      ${bi(problem.hint)}
    </details>
    <div class="wp-work" aria-label="Space to show your thinking"></div>
    <details class="wp-answer">
      <summary>Check the answer <span class="es">· Comprueba la respuesta</span></summary>
      <ol>${lines("en").join("")}</ol>
      <ol class="es-text" lang="es">${lines("es").join("")}</ol>
    </details>
  </div>
</li>`;
}

// Word-problem rules only; paper, hero, icons and callouts come from the shared letter CSS.
const WORD_PROBLEM_CSS = `
main { max-width: 760px; margin: 0 auto; }
.wp-tools { display: flex; flex-wrap: wrap; gap: 8px 18px; align-items: center; margin: 18px 0 0; font-size: 17px; }
.wp-tools button { font: inherit; font-weight: 600; color: #fff; background: var(--fp-unit-ink); border: 0; border-radius: 8px; padding: 10px 18px; min-height: 44px; cursor: pointer; }
.wp-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 22px; }
.wp { display: grid; grid-template-columns: 44px minmax(0, 1fr); gap: 0 16px; break-inside: avoid; }
.wp-number { margin: 0; width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; background: var(--fp-unit-ink); color: #fff; font: 700 20px var(--fp-sans); }
.wp-stem { font-size: 21px; color: var(--fp-ink); margin: 6px 0 0; }
.wp-body > * + * { margin-top: 12px; }
.wp-body p { margin-bottom: 0; }
.wp-ask { font-size: 18px; padding: 12px 16px; }
.wp-ask p { margin: 0; }
.wp details { font-size: 18px; }
.wp summary { cursor: pointer; font-weight: 600; color: var(--fp-unit-ink); min-height: 32px; }
.wp summary .es { font-weight: 500; color: var(--fp-muted); }
.wp details > p, .wp details > ol { margin: 8px 0 0; }
.wp details ol { padding-left: 22px; }
.wp details ol.es-text { padding: 8px 12px 8px 34px; margin-top: 10px; }
.wp-work { height: 96px; border: 1px dashed var(--fp-rule); border-radius: 8px; background:
  repeating-linear-gradient(to bottom, transparent 0 31px, var(--fp-rule) 31px 32px); }
.wp-intro .es-text { margin-top: 10px; }
@media (max-width: 560px) { .wp { grid-template-columns: 1fr; } .wp-number { width: 36px; height: 36px; font-size: 17px; } }
@media print {
  .wp-tools, .wp-hint, .skip-print { display: none !important; }
  .wp-work { height: 120px; }
  .wp-answer { display: none; }
  body { font-size: 16px; }
}
`;

/** One complete page for a lesson's word-problem set. */
export function wordProblemsPage(data, lessonConfig) {
  const unit = Number.parseInt(data.lessonId, 10);
  let n = 0;
  const groups = data.groups
    .map(
      (g) => `<section class="section-${esc(g.icon)}">
  <h2>${esc(g.title.en)} <span class="es" lang="es">${esc(g.title.es)}</span></h2>
  ${bi(g.blurb)}
  <ol class="wp-list">
${g.problems.map((p) => problemHtml(p, ++n)).join("\n")}
  </ol>
</section>`,
    )
    .join("\n");
  const standard = lessonConfig.standard
    ? `<span class="std">Standard ${esc(lessonConfig.standard)}</span>`
    : "";
  return `<!doctype html>
<html lang="en" data-unit="${unit}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>${esc(data.title.en)} · Family Math Studio</title>
<!-- generated:family-word-problems lesson=${esc(data.lessonId)} — regenerate: npm run generate-word-problems -->
<link rel="stylesheet" href="/assets/fonts/fraunces-hanken-grotesk-e8a3b5.css" />
<style>*{box-sizing:border-box}body{margin:0;line-height:1.6}${FAMILY_PAPER}${FAMILY_LETTER_CSS}${WORD_PROBLEM_CSS}</style>
</head>
<body>
<div class="wrap">
<main id="main">
<header class="hero-header">
  <p class="eyebrow">Family Math Studio · Lesson ${esc(data.lessonId)} <span class="es" lang="es">Estudio familiar · Lección ${esc(data.lessonId)}</span></p>
  <h1>${esc(data.title.en)}</h1>
  <p class="es-text" lang="es">${esc(data.title.es)}</p>
  ${standard}
  <p class="wp-tools"><button type="button" onclick="window.print()">Print this page · Imprimir</button>
  <a href="/lessons/${esc(data.lessonId)}/family/">Lesson ${esc(data.lessonId)} family guide · Guía para familias</a>
  <a href="/lessons/${esc(data.lessonId)}/homework.html">Lesson ${esc(data.lessonId)} homework · Tarea</a></p>
</header>
<section class="section-learning wp-intro">
  <h2>Before you start <span class="es" lang="es">Antes de empezar</span></h2>
  <p class="callout callout--key"><strong>${esc(data.keyIdea.en)}</strong><span class="es-text" lang="es">${esc(data.keyIdea.es)}</span></p>
  ${bi(data.intro)}
</section>
${groups}
</main>
<footer>Neft Teacher · Grade 6 Math · Optional and ungraded · Opcional y sin calificación</footer>
</div>
</body>
</html>
`;
}

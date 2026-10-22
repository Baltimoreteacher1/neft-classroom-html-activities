/**
 * Family word problems: authored stems, asks and hints (data/family-word-problems/<lesson>.json)
 * plus answers computed here from the numbers each problem declares. An answer is never
 * authored, so a stem and its answer cannot drift apart; tools/family-word-problems.test.mjs
 * re-derives the arithmetic independently and checks the stems carry the same numbers.
 */

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

/** One sentence in both languages, in the markup the homework pages use for language mode. */
const both = (pair) =>
  `<span class="lang-en">${esc(pair.en)}</span><span class="lang-es" lang="es">${esc(pair.es)}</span>`;

const KIND_LABEL = {
  "percent-of": { en: "Find the part", es: "Halla la parte" },
  discount: { en: "Discount", es: "Descuento" },
  deal: { en: "Compare deals", es: "Compara ofertas" },
};

function problemHtml(problem, number) {
  const en = solve(problem, "en");
  const es = solve(problem, "es");
  const id = esc(problem.id);
  const lines = en.map((line, i) => `<li>${both({ en: line, es: es[i] })}</li>`).join("");
  return `<section class="problem-section card wp-problem" id="${id}">
  <div class="problem-header-row">
    <div class="problem-number-badge hw-inline">${both({ en: "Problem", es: "Problema" })} ${number}</div>
    <div class="problem-type-badge">${both(KIND_LABEL[problem.kind])}</div>
  </div>
  <div class="problem-body">
    <p class="problem-stem">${both(problem.stem)}</p>
    <div class="family-problem-tip">
      <p class="wp-tip-label hw-inline"><span aria-hidden="true">👪</span> <strong>${both({ en: "Ask your student", es: "Pregunta a tu estudiante" })}</strong></p>
      <p>${both(problem.ask)}</p>
    </div>
    <details class="problem-coach-ladder wp-hint">
      <summary><span>🪜 ${both({ en: "Hint", es: "Pista" })}</span></summary>
      <p>${both(problem.hint)}</p>
    </details>
    <div class="hw-work">
      <label class="hw-work-label hw-inline" for="work_${id}">${both({ en: "📝 Show your work", es: "📝 Muestra tu trabajo" })}</label>
      <textarea id="work_${id}" name="work_${id}" class="custom-textarea hw-work-input" rows="4" placeholder="Step 1...  Step 2...  Step 3..."></textarea>
    </div>
  </div>
  <details class="hw-answer-key">
    <summary>
      <span class="hw-answer-key-icon" aria-hidden="true">🔑</span>
      ${both({ en: "Show the answer", es: "Ver la respuesta" })}
    </summary>
    <div class="hw-answer-key-body">
      <p class="hw-answer-key-try">${both({ en: "Not tried yet? Close this and give it one try first. A wrong first try still helps.", es: "¿Todavía no lo intentaron? Ciérrenla y hagan un intento primero. Un primer intento incorrecto también ayuda." })}</p>
      <ul class="hw-answer-key-lines">${lines}</ul>
    </div>
  </details>
</section>`;
}

const LANGUAGE_SELECTOR = `<div class="lang-selector-card">
  <span class="lang-selector-title">Language / Idioma</span>
  <div class="lang-selector-buttons" role="group" aria-label="Language Mode Selector" data-aria-en="Language Mode Selector" data-aria-es="Seleccionar idioma">
    <button type="button" class="lang-toggle-btn active" data-lang-mode="bilingual" aria-pressed="true">🇺🇸🇪🇸 <span class="lang-btn-long">Bilingual / Bilingüe</span><span class="lang-btn-short">EN + ES</span></button>
    <button type="button" class="lang-toggle-btn" data-lang-mode="en" aria-pressed="false">🇺🇸 <span>English</span></button>
    <button type="button" class="lang-toggle-btn" data-lang-mode="es" aria-pressed="false">🇪🇸 <span>Español</span></button>
  </div>
</div>`;

// Same storage key and body classes as the homework page, so a family that picked
// Spanish there finds Spanish here. Both scripts fail toward showing English.
const LANGUAGE_BOOT = `(function () {
  var mode = 'bilingual';
  try {
    var asked = new URLSearchParams(location.search).get('lang');
    var saved = localStorage.getItem('hw_lang_mode');
    var ok = function (m) { return m === 'en' || m === 'es' || m === 'bilingual'; };
    if (ok(asked)) mode = asked;
    else if (ok(saved)) mode = saved;
    else {
      var langs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''];
      for (var i = 0; i < langs.length; i++) if (String(langs[i]).toLowerCase().indexOf('es') === 0) { mode = 'es'; break; }
    }
  } catch (e) {}
  document.body.classList.add('lang-mode-' + mode);
  document.documentElement.lang = mode === 'es' ? 'es' : 'en';
})();`;

const LANGUAGE_TOGGLE = `(function () {
  var buttons = document.querySelectorAll('.lang-toggle-btn');
  function show(mode) {
    document.body.classList.remove('lang-mode-bilingual', 'lang-mode-en', 'lang-mode-es');
    document.body.classList.add('lang-mode-' + mode);
    document.documentElement.lang = mode === 'es' ? 'es' : 'en';
    document.querySelectorAll('[data-aria-en]').forEach(function (el) {
      el.setAttribute('aria-label', mode === 'es' ? el.dataset.ariaEs : el.dataset.ariaEn);
    });
    buttons.forEach(function (b) {
      var on = b.getAttribute('data-lang-mode') === mode;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  buttons.forEach(function (b) {
    b.addEventListener('click', function () {
      var mode = b.getAttribute('data-lang-mode');
      try { localStorage.setItem('hw_lang_mode', mode); } catch (e) {}
      show(mode);
    });
  });
  show(document.body.className.match(/lang-mode-(bilingual|en|es)/)[1]);
})();`;

// Only what the homework stylesheet has no rule for: the group headings, the hint body,
// the link row and the print sheet. Cards, hero, badges and answer keys are the homework's own.
const WORD_PROBLEM_CSS = `
.wp-group { margin: 28px 0 0; }
.wp-group > h2 { margin: 0; font: 700 26px/1.25 var(--fp-serif); color: var(--fp-ink); }
.wp-group > h2 .lang-es { display: block; font: 500 18px var(--fp-sans); color: var(--fp-muted); margin-top: 2px; }
.wp-group > p { margin: 6px 0 14px; color: var(--fp-ink-soft); }
.wp-problem { margin-top: 16px; break-inside: avoid; }
.wp-tip-label, .family-problem-tip p { margin: 0; }
.wp-tip-label { margin-bottom: 4px !important; }
.wp-hint p { margin: 10px 0 0; padding: 0 4px 10px; }
.wp-problem .hw-work { margin-top: 14px; }
.wp-tip-label .lang-en, .wp-tip-label .lang-es { margin-left: 4px; }
.wp-links { display: flex; flex-wrap: wrap; gap: 10px 22px; align-items: center; margin: 28px 0 0; }
.wp-links a { color: var(--fp-unit-ink); font-weight: 700; }
.wp-links button { font: inherit; font-weight: 700; color: #fff; background: var(--fp-unit-ink); border: 0; border-radius: 12px; padding: 10px 18px; min-height: 44px; cursor: pointer; }
@media print {
  .hw-hero-controls, .wp-links, .wp-hint, .hw-answer-key { display: none !important; }
  .wp-problem .hw-work-input { min-height: 120px; }
}
`;

/** One complete page for a lesson's word-problem set, dressed as the lesson's homework page. */
export function wordProblemsPage(data, chrome) {
  const unit = Number.parseInt(data.lessonId, 10);
  const id = esc(data.lessonId);
  const total = data.groups.reduce((sum, g) => sum + g.problems.length, 0);
  let n = 0;
  const groups = data.groups
    .map(
      (g) => `<section class="wp-group" aria-label="${esc(g.title.en)}">
  <h2>${both(g.title)}</h2>
  <p>${both(g.blurb)}</p>
${g.problems.map((p) => problemHtml(p, ++n)).join("\n")}
</section>`,
    )
    .join("\n");
  return `<!doctype html>
<html lang="en" data-unit="${unit}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>${esc(data.title.en)} · Family Math Studio</title>
<!-- generated:family-word-problems lesson=${id} — regenerate: npm run generate-word-problems -->
${chrome.fonts}
<link rel="stylesheet" href="${chrome.base}">
<style>
${chrome.theme}
</style>
<link rel="stylesheet" href="${chrome.layer}">
<style>${WORD_PROBLEM_CSS}</style>
</head>
<body data-family-style="${esc(chrome.bodyStyle)}">
<script>
${LANGUAGE_BOOT}
</script>
<div class="container" role="main">
  <header class="hw-hero" aria-label="Family Math Studio">
    <div class="hw-hero-glow" aria-hidden="true"></div>
    <div class="hw-hero-body">
      <div class="hw-hero-controls">
        ${LANGUAGE_SELECTOR}
      </div>
      ${chrome.kicker}
      <div class="hw-hero-head">
        <span class="hw-hero-emoji" aria-hidden="true">🕹️</span>
        <div class="hw-hero-titles">
          <h1><span class="lang-en">Family Math Studio</span><span class="lang-es" lang="es">Estudio familiar de matemáticas</span></h1>
          <p class="hw-hero-subtitle">${both({ en: "Optional & Ungraded Home Exploration", es: "Exploración opcional en casa, sin calificación" })}</p>
        </div>
      </div>
      <p class="hw-hero-lesson">
        <span class="hw-hero-lesson-title">${both(data.title)}</span>
        <span class="hw-hero-lesson-meta">${both({ en: `Lesson ${data.lessonId} · Extra practice`, es: `Lección ${data.lessonId} · Práctica adicional` })}</span>
      </p>
      <p class="hw-hero-bigidea" aria-label="Big idea">
        <span class="hw-hero-bigidea-label hw-inline">${both({ en: "Big idea", es: "Idea principal" })}</span>
        ${both(data.keyIdea)}
      </p>
      <ul class="hw-tonight hw-inline" aria-label="At a glance">
        <li><span aria-hidden="true">✏️</span> ${both({ en: "Pencil and paper", es: "Lápiz y papel" })}</li>
        <li><span aria-hidden="true">🎯</span> <strong>${total}</strong> ${both({ en: "word problems", es: "problemas verbales" })}</li>
      </ul>
    </div>
  </header>
  <section class="card wp-intro">
    <p>${both(data.intro)}</p>
  </section>
${groups}
  <p class="wp-links">
    <button type="button" onclick="window.print()">${both({ en: "Print this page", es: "Imprimir esta página" })}</button>
    <a href="/lessons/${id}/homework.html">${both({ en: `Lesson ${data.lessonId} homework`, es: `Tarea de la lección ${data.lessonId}` })}</a>
    <a href="/lessons/${id}/family/">${both({ en: `Lesson ${data.lessonId} family guide`, es: `Guía para familias de la lección ${data.lessonId}` })}</a>
  </p>
</div>
<script>
${LANGUAGE_TOGGLE}
</script>
</body>
</html>
`;
}

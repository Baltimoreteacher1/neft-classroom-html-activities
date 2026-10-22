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

// The homework's tab bar, minus its lesson state: one stop shows at a time, the family's last
// stop is remembered per lesson, and #<stop id> opens a stop directly.
const tabScript = (lessonId) => `(function () {
  var KEY = 'wp_tab_${lessonId}';
  var tabs = [].slice.call(document.querySelectorAll('.homework-tab-btn'));
  var panels = [].slice.call(document.querySelectorAll('[data-tab-panel]'));
  var fill = document.getElementById('hw_tab_track_fill');
  var ids = tabs.map(function (t) { return t.dataset.tab; });
  function show(id, scroll) {
    if (ids.indexOf(id) < 0) id = ids[0];
    tabs.forEach(function (t, i) {
      var on = t.dataset.tab === id;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      if (on) {
        t.setAttribute('aria-current', 'step');
        if (fill) fill.style.width = ((i + 1) / tabs.length) * 100 + '%';
      } else t.removeAttribute('aria-current');
    });
    panels.forEach(function (p) { p.hidden = p.dataset.tabPanel !== id; });
    try { localStorage.setItem(KEY, id); } catch (e) {}
    var bar = document.querySelector('.homework-tab-chrome');
    if (scroll && bar) bar.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
  tabs.forEach(function (t) {
    t.addEventListener('click', function () { show(t.dataset.tab, false); });
    t.addEventListener('keydown', function (e) {
      var i = ids.indexOf(t.dataset.tab);
      var j = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? ids.length - 1 : -1;
      if (j < 0 || j >= ids.length) return;
      e.preventDefault();
      show(ids[j], false);
      tabs[j].focus();
    });
  });
  [].slice.call(document.querySelectorAll('[data-next]')).forEach(function (b) {
    b.addEventListener('click', function () { show(b.dataset.next, true); });
  });
  var start = location.hash.slice(1);
  if (ids.indexOf(start) < 0) { try { start = localStorage.getItem(KEY); } catch (e) { start = null; } }
  show(start, false);
})();`;

// Only what the homework stylesheet has no rule for: the group headings, the hint body,
// the link row and the print sheet. Cards, hero, badges and answer keys are the homework's own.
const WORD_PROBLEM_CSS = `
.wp-blurb { margin: 6px 0 14px; color: var(--fp-ink-soft); }
.wp-problem { margin-top: 16px; break-inside: avoid; }
.wp-tip-label, .family-problem-tip p { margin: 0; }
.wp-tip-label { margin-bottom: 4px !important; }
.wp-hint p { margin: 10px 0 0; padding: 0 4px 10px; }
.wp-problem .hw-work { margin-top: 14px; }
.wp-tip-label .lang-en, .wp-tip-label .lang-es { margin-left: 4px; }
.wp-links { display: flex; flex-wrap: wrap; gap: 10px 22px; align-items: center; margin: 22px 0 0; }
.wp-links a { color: var(--fp-unit-ink); font-weight: 700; }
.wp-links button .lang-en, .wp-links button .lang-es { color: inherit; }
.wp-links button { font: inherit; font-weight: 700; color: #fff; background: var(--fp-unit-ink); border: 0; border-radius: 12px; padding: 10px 18px; min-height: 44px; cursor: pointer; }
@media print {
  .hw-hero-controls, .homework-tab-chrome, .tab-flow-nav, .wp-links, .wp-hint, .hw-answer-key { display: none !important; }
  [data-tab-panel][hidden] { display: block !important; }
  .wp-problem .hw-work-input { min-height: 120px; }
}
`;

/** One complete page for a lesson's word-problem set, dressed as the lesson's homework page. */
export function wordProblemsPage(data, chrome) {
  const unit = Number.parseInt(data.lessonId, 10);
  const id = esc(data.lessonId);
  const total = data.groups.reduce((sum, g) => sum + g.problems.length, 0);
  let n = 0;
  const stops = [
    { id: "learn", label: { en: "Learn", es: "Aprender" }, emoji: "📖" },
    ...data.groups.map((g) => ({ id: g.id, label: g.tab, emoji: g.emoji })),
    { id: "done", label: { en: "Done", es: "Listo" }, emoji: "🎉" },
  ];
  const tabButtons = stops
    .map((t, i) => {
      const of = {
        en: `${t.label.en} — stop ${i + 1} of ${stops.length}`,
        es: `${t.label.es} — parada ${i + 1} de ${stops.length}`,
      };
      return `<button type="button" role="tab" id="wp_tab_${esc(t.id)}" class="homework-tab-btn${i === 0 ? " is-active" : ""}" aria-selected="${i === 0}" aria-controls="wp_panel_${esc(t.id)}" aria-label="${esc(of.en)}" data-aria-en="${esc(of.en)}" data-aria-es="${esc(of.es)}" data-tab="${esc(t.id)}" data-stop="${i + 1}">
  <span class="tab-step" aria-hidden="true">${i + 1}</span>
  <span class="tab-icon" aria-hidden="true">${t.emoji}</span>
  <span class="tab-label"><span class="tab-en">${esc(t.label.en)}</span><span class="tab-es" lang="es">${esc(t.label.es)}</span></span>
  <span class="tab-done" aria-hidden="true">✓</span>
</button>`;
    })
    .join("\n");
  const next = (to) => `<div class="tab-flow-nav">
  <button type="button" class="btn btn-primary flow-next-btn" data-next="${esc(to)}"><span class="lang-en">Continue ➔</span><span class="lang-es" lang="es">Continuar ➔</span></button>
</div>`;
  const panel = (stop, body) =>
    `<div class="tab-panel-inner" data-tab-panel="${esc(stop.id)}" id="wp_panel_${esc(stop.id)}" role="tabpanel" aria-labelledby="wp_tab_${esc(stop.id)}"${stop.id === "learn" ? "" : " hidden"}>
  <h2 class="section-title">${stop.emoji} ${both(stop.title ?? stop.label)}</h2>
${body}
</div>`;
  const panels = stops.map((stop, i) => {
    if (stop.id === "learn")
      return panel(
        stop,
        `  <section class="card wp-intro"><p>${both(data.intro)}</p></section>\n  ${next(stops[i + 1].id)}`,
      );
    if (stop.id === "done")
      return panel(
        { ...stop, title: { en: "Finished for today", es: "Terminaste por hoy" } },
        `  <section class="hw-teach">
    <h3>${both({ en: "Teach it to someone", es: "Enséñaselo a alguien" })}</h3>
    <ol class="hw-teach-steps">
      <li>${both({ en: "Pick one problem you solved.", es: "Elige un problema que resolviste." })}</li>
      <li>${both({ en: "Explain it out loud. Use any language first.", es: "Explícalo en voz alta. Usa primero el idioma que prefieras." })}</li>
      <li>${both({ en: "Your partner asks: “How do you know?” Answer with: “I got ___ because ___. I checked by ___.”", es: "Tu acompañante pregunta: “¿Cómo lo sabes?” Responde: “Obtuve ___ porque ___. Comprobé usando ___.”" })}</li>
    </ol>
  </section>
  <p class="wp-links">
    <button type="button" onclick="window.print()">${both({ en: "Print this page", es: "Imprimir esta página" })}</button>
    <a href="/lessons/${id}/homework.html">${both({ en: `Lesson ${data.lessonId} homework`, es: `Tarea de la lección ${data.lessonId}` })}</a>
    <a href="/lessons/${id}/family/">${both({ en: `Lesson ${data.lessonId} family guide`, es: `Guía para familias de la lección ${data.lessonId}` })}</a>
  </p>`,
      );
    const g = data.groups.find((q) => q.id === stop.id);
    return panel(
      { ...stop, title: g.title },
      `  <p class="wp-blurb">${both(g.blurb)}</p>\n${g.problems.map((p) => problemHtml(p, ++n)).join("\n")}\n  ${next(stops[i + 1].id)}`,
    );
  });
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
  <div class="homework-tabs-shell" data-tab-count="${stops.length}">
    <div class="homework-tab-chrome">
      <nav class="homework-tab-bar" role="tablist" aria-label="Today's path" data-aria-en="Today's path" data-aria-es="Ruta de hoy">
${tabButtons}
      </nav>
      <div class="homework-tab-track" aria-hidden="true"><span class="homework-tab-track-fill" id="hw_tab_track_fill"></span></div>
    </div>
    <div class="homework-tab-panels" id="hw_tab_panels">
${panels.join("\n")}
    </div>
  </div>
</div>
<script>
${LANGUAGE_TOGGLE}
${tabScript(data.lessonId)}
</script>
</body>
</html>
`;
}

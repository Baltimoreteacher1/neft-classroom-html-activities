/**
 * The /families/ landing page, rendered from data (no I/O).
 *
 * scripts/generate-family-pages.mjs builds the lesson records and calls
 * `renderLanding`. Everything a parent reads here is a pair: English and
 * Spanish, never anything else (data/product-decisions.json
 * family-surfaces-english-spanish-only). The page is mobile-first and every
 * unit starts COLLAPSED, so the first screen is a promise, the weekly hub and
 * ten cards instead of eighty-four lessons (it was 32,655px tall at 390px).
 *
 * Interaction lives in /assets/family-landing.js. Without it the page still
 * works: units open natively, both languages print, the filters stay hidden.
 */

import { SESSIONS } from "./homework-session-flow.mjs";

/** Where "This week" goes: the weekly hub, one school night at a time. */
export const WEEK_HUB_HREF = "/curriculum/family-connections/";

/** The language-neutral text every filter and search box folds to. */
export function fold(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase();
}

const esc = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** One piece of text in both languages. CSS shows the language the family chose. */
const bi = (en, es) =>
  `<span class="en">${esc(en)}</span><span class="es" lang="es">${esc(es)}</span>`;

/** Plain topic names for the topic filter, keyed by the generator's topic string. */
export const TOPIC_LABELS = {
  "Ratios, rates, and percents": {
    en: "Ratios, rates and percents",
    es: "Razones, tasas y porcentajes",
  },
  Geometry: { en: "Shapes, area and volume", es: "Figuras, área y volumen" },
  "Expressions and equations": { en: "Expressions and equations", es: "Expresiones y ecuaciones" },
  "Statistics and data": { en: "Data and statistics", es: "Datos y estadística" },
  "Integers and coordinate plane": {
    en: "Negative numbers and graphs",
    es: "Números negativos y gráficas",
  },
  "Number system": {
    en: "Fractions, decimals and factors",
    es: "Fracciones, decimales y factores",
  },
  "Grade 6 math": { en: "Math habits and thinking", es: "Hábitos y razonamiento matemático" },
};

const UI = {
  title: { en: "Family Math Studio", es: "Estudio familiar de matemáticas" },
  eyebrow: { en: "Family Math Support", es: "Apoyo familiar de matemáticas" },
  weekLabel: { en: "This week", es: "Esta semana" },
  weekText: {
    en: "See this week's math homework, one school night at a time.",
    es: "Vea la tarea de matemáticas de esta semana, noche por noche.",
  },
  weekGo: { en: "Open this week", es: "Abrir esta semana" },
  search: { en: "Search lessons", es: "Buscar lecciones" },
  searchHint: { en: "Try area, ratios or 8-6", es: "Pruebe área, razones u 8-6" },
  unit: { en: "Unit", es: "Unidad" },
  allUnits: { en: "All units", es: "Todas las unidades" },
  topic: { en: "Topic", es: "Tema" },
  allTopics: { en: "All topics", es: "Todos los temas" },
  pick: { en: "Choose a unit", es: "Elija una unidad" },
  empty: {
    en: "No lessons match. Try a shorter word, or choose all units and topics.",
    es: "No hay lecciones que coincidan. Pruebe una palabra más corta o elija todas las unidades y temas.",
  },
  lesson: { en: "Lesson", es: "Lección" },
  count: { en: (n) => `${n} lessons`, es: (n) => `${n} lecciones` },
  studio: { en: "Family Math Studio", es: "Estudio familiar de matemáticas" },
  guide: { en: "Family guide", es: "Guía para la familia" },
  words: { en: "Key words", es: "Palabras clave" },
  langGroup: { en: "Language / Idioma", es: "Idioma / Language" },
  home: { en: "Mr. Neft's Grade 6 Math", es: "Matemáticas de 6.º grado del Sr. Neft" },
};

const ui = (key) => bi(UI[key].en, UI[key].es);

function unitCard(unit, rows, openUnit) {
  const n = rows.length;
  // The number sits in <b data-n> so the filter can update it in place.
  const count = (lang) => UI.count[lang](n).replace(String(n), `<b data-n>${n}</b>`);
  const words = unit.keywords
    .map(
      (k) =>
        `<li><span class="kw-en">${esc(k.en)}</span><span class="kw-es" lang="es">${esc(k.es)}</span></li>`,
    )
    .join("");
  return `<details class="unit" data-unit-section="${unit.unit}"${openUnit ? " open" : ""}>
      <summary>
        <span class="unit-kicker">${bi(`${UI.unit.en} ${unit.unit}`, `${UI.unit.es} ${unit.unit}`)}</span>
        <h3 class="unit-name">${bi(unit.nameEn, unit.nameEs)}</h3>
        <span class="unit-learn">${bi(unit.learnEn, unit.learnEs)}</span>
        <ul class="unit-words" aria-label="${esc(UI.words.en)} / ${esc(UI.words.es)}">${words}</ul>
        <span class="unit-count"><span class="en">${count("en")}</span><span class="es" lang="es">${count("es")}</span></span>
      </summary>
      <ul class="lesson-list">
${rows.join("\n")}
      </ul>
    </details>`;
}

function lessonRow(lesson) {
  const search = fold(
    [
      lesson.lessonId,
      lesson.title,
      lesson.titleEs,
      lesson.standard,
      lesson.objective,
      lesson.unitName,
      lesson.unitNameEs,
      TOPIC_LABELS[lesson.topic]?.en,
      TOPIC_LABELS[lesson.topic]?.es,
      ...lesson.vocabulary.flatMap((w) => [w.term, w.termEs]),
    ].join(" "),
  );
  const sessions = lesson.studio.part2Href
    ? `<span class="studio-cap">${ui("studio")}</span>
          <span class="studio-sessions">
            <a class="btn primary" data-lang-link href="${esc(lesson.studio.href)}">${bi(SESSIONS[1].en, SESSIONS[1].es)}</a>
            <a class="btn primary" data-lang-link href="${esc(lesson.studio.part2Href)}">${bi(SESSIONS[2].en, SESSIONS[2].es)}</a>
          </span>`
    : `<a class="btn primary" data-lang-link href="${esc(lesson.studio.href)}">${ui("studio")}</a>`;
  return `        <li class="lesson-row" data-lesson-card data-unit="${lesson.unit}" data-topic="${esc(lesson.topic)}" data-search="${esc(search)}">
          <span class="lesson-id">${bi(`${UI.lesson.en} ${lesson.lessonId}`, `${UI.lesson.es} ${lesson.lessonId}`)}</span>
          <span class="lesson-title">${bi(lesson.title, lesson.titleEs)}</span>
          <span class="lesson-actions">
          ${sessions}
          <a class="btn quiet" href="/families/lessons/${esc(lesson.lessonId)}/">${ui("guide")}</a>
          </span>
        </li>`;
}

const CSS = `
:root{--ink:#16232b;--muted:#4a5b66;--line:#d6dee5;--paper:#fffaf0;--card:#fff;--navy:#12343b;--teal:#0f766e;--teal-deep:#0b5e57;--teal-soft:#e3f4f1;--amber:#8a4b08;--amber-soft:#fff1d6;--focus:#1d4ed8}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--paper);color:var(--ink);font:18px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
html[data-lang="en"] .es,html[data-lang="es"] .en{display:none!important}
html:not([data-lang]) .es::before{content:" / "}
a{color:inherit}
a:focus-visible,button:focus-visible,summary:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid var(--focus);outline-offset:2px}
.langbar{position:sticky;top:0;z-index:5;background:var(--navy);padding:8px 12px;display:flex;gap:8px;align-items:center;justify-content:center}
.langbar[hidden]{display:none}
.langbar button{flex:1 1 0;max-width:220px;min-height:52px;border:2px solid #fff;border-radius:12px;background:transparent;color:#fff;font:inherit;font-weight:800;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.1}
.langbar button .code{font-size:1.25rem;letter-spacing:.04em}
.langbar button .name{font-size:.8rem;font-weight:600;opacity:.9}
.langbar button[aria-pressed="true"]{background:#fff;color:var(--navy)}
main{max-width:760px;margin:0 auto;padding:20px 16px 56px}
.hero{display:grid;gap:10px;margin-bottom:18px}
.eyebrow{margin:0;color:var(--teal-deep);font-weight:800;text-transform:uppercase;letter-spacing:.06em;font-size:.82rem}
h1{margin:0;font-size:clamp(2rem,9vw,3rem);line-height:1.05;color:var(--navy)}
.promise{margin:0;font-size:1.15rem;color:var(--muted);max-width:34em}
.week{display:grid;gap:4px;padding:16px 18px;border-radius:16px;background:var(--navy);color:#fff;text-decoration:none;margin:0 0 22px;border:2px solid var(--navy)}
.week-label{font-size:.82rem;text-transform:uppercase;letter-spacing:.08em;font-weight:800;color:#bfe9e3}
.week-text{font-size:1.2rem;font-weight:700;line-height:1.3}
.week-go{justify-self:start;margin-top:8px;background:#fff;color:var(--navy);font-weight:800;border-radius:10px;padding:10px 16px;min-height:44px;display:inline-flex;align-items:center}
.controls{display:grid;gap:12px;margin:0 0 18px;padding:14px;background:var(--card);border:1px solid var(--line);border-radius:14px}
.controls[hidden]{display:none}
.controls label{display:grid;gap:4px;font-weight:700;font-size:.92rem;color:var(--muted)}
.controls .pair{display:grid;gap:12px}
.controls input,.controls select{width:100%;min-height:48px;border:2px solid var(--line);border-radius:10px;padding:8px 12px;font:inherit;background:#fff;color:var(--ink)}
h2.pick{margin:0 0 10px;font-size:1.15rem;color:var(--navy)}
.unit{background:var(--card);border:1px solid var(--line);border-radius:16px;margin:0 0 12px;overflow:hidden}
.unit[hidden],.lesson-row[hidden],.empty[hidden]{display:none}
.unit summary{display:grid;gap:6px;padding:16px 44px 16px 16px;cursor:pointer;list-style:none;position:relative;min-height:48px}
.unit summary::-webkit-details-marker{display:none}
.unit summary::after{content:"";position:absolute;right:18px;top:24px;width:10px;height:10px;border-right:3px solid var(--teal-deep);border-bottom:3px solid var(--teal-deep);transform:rotate(45deg);transition:transform .15s}
.unit[open] summary::after{transform:rotate(-135deg);top:28px}
.unit[open] summary{border-bottom:1px solid var(--line);background:var(--teal-soft)}
.unit-kicker{font-size:.8rem;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:var(--teal-deep)}
.unit-name{margin:0;font-size:1.3rem;line-height:1.2;color:var(--navy)}
.unit-learn{color:var(--ink);font-size:1rem}
.unit-words{display:flex;flex-wrap:wrap;gap:6px;list-style:none;margin:2px 0 0;padding:0}
.unit-words li{background:var(--amber-soft);border-radius:999px;padding:3px 10px;font-size:.88rem;line-height:1.3}
.unit-words .kw-en{font-weight:800;color:var(--amber)}
.unit-words .kw-es{color:var(--muted)}
.unit-words .kw-es::before{content:" · "}
.unit-count{font-size:.85rem;color:var(--muted);font-weight:700}
.lesson-list{list-style:none;margin:0;padding:0}
.lesson-row{display:grid;gap:6px;padding:14px 16px;border-top:1px solid var(--line)}
.lesson-row:first-child{border-top:0}
.lesson-id{font-size:.8rem;color:var(--muted);font-weight:700}
.lesson-title{font-size:1.1rem;font-weight:800;line-height:1.25;color:var(--navy)}
.lesson-actions{display:grid;gap:8px;margin-top:4px}
.studio-cap{font-size:.82rem;font-weight:800;color:var(--teal-deep);text-transform:uppercase;letter-spacing:.05em}
.studio-sessions{display:grid;gap:8px;grid-template-columns:1fr 1fr}
.studio-sessions .btn{font-size:.95rem}
.btn{display:flex;align-items:center;justify-content:center;text-align:center;min-height:48px;padding:10px 14px;border-radius:12px;font-weight:800;text-decoration:none;line-height:1.2}
.btn.primary{background:var(--teal);color:#fff}
.btn.primary:hover{background:var(--teal-deep)}
.btn.quiet{border:2px solid var(--line);background:#fff;color:var(--navy)}
.btn.quiet:hover{border-color:var(--teal)}
.empty{padding:18px;border:2px dashed var(--line);border-radius:12px;color:var(--muted);background:#fff}
.foot{margin-top:28px;font-size:.85rem;color:var(--muted)}
@media (min-width:640px){
  main{padding:32px 20px 72px}
  .lesson-actions{grid-template-columns:minmax(0,2fr) minmax(0,1fr);align-items:end}
  .studio-cap{grid-column:1/-1}
  .lesson-actions .studio-sessions{grid-column:1}
  .controls{grid-template-columns:2fr 1fr 1fr;align-items:end}
  .controls .pair{display:contents}
}
@media (max-width:339px){.studio-sessions{grid-template-columns:1fr}}
@media (prefers-reduced-motion:reduce){.unit summary::after{transition:none}}
`;

/**
 * @param {object} args
 * @param {object[]} args.lessons  records from buildLessonRecords()
 * @param {object[]} args.units    [{ unit, nameEn, nameEs, learnEn, learnEs, keywords }]
 * @param {{en:string,es:string}} args.promise
 */
export function renderLanding({ lessons, units, promise }) {
  const topics = [...new Set(lessons.map((l) => l.topic))].sort();
  const unitCards = units
    .map((unit) =>
      unitCard(unit, lessons.filter((l) => l.unit === unit.unit).map(lessonRow), false),
    )
    .join("\n    ");
  const unitOptions = units
    .map(
      (u) =>
        `<option value="${u.unit}" data-en="${esc(`${UI.unit.en} ${u.unit}: ${u.nameEn}`)}" data-es="${esc(`${UI.unit.es} ${u.unit}: ${u.nameEs}`)}">${esc(`${UI.unit.en} ${u.unit}: ${u.nameEn}`)}</option>`,
    )
    .join("\n          ");
  const topicOptions = topics
    .map((t) => {
      const label = TOPIC_LABELS[t] ?? { en: t, es: t };
      return `<option value="${esc(t)}" data-en="${esc(label.en)}" data-es="${esc(label.es)}">${esc(label.en)}</option>`;
    })
    .join("\n          ");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(UI.title.en)} · ${esc(UI.eyebrow.en)}</title>
  <meta name="description" content="${esc(promise.en)} / ${esc(promise.es)}">
  <script src="/assets/family-landing.js"></script>
  <style>${CSS}</style>
</head>
<body>
  <div class="langbar" role="group" aria-label="${esc(UI.langGroup.en)}" data-langbar hidden>
    <button type="button" data-set-lang="en" lang="en" aria-pressed="true"><span class="code">EN</span><span class="name">English</span></button>
    <button type="button" data-set-lang="es" lang="es" aria-pressed="false"><span class="code">ES</span><span class="name">Español</span></button>
  </div>
  <main id="main">
    <section class="hero" aria-labelledby="page-title">
      <p class="eyebrow">${ui("eyebrow")}</p>
      <h1 id="page-title">${ui("title")}</h1>
      <p class="promise" data-promise>${bi(promise.en, promise.es)}</p>
    </section>

    <a class="week" data-week-link data-lang-link href="${WEEK_HUB_HREF}">
      <span class="week-label">${ui("weekLabel")}</span>
      <span class="week-text">${ui("weekText")}</span>
      <span class="week-go">${ui("weekGo")}</span>
    </a>

    <section class="controls" aria-label="${esc(UI.search.en)} / ${esc(UI.search.es)}" data-controls hidden>
      <label for="family-search">${ui("search")}
        <input id="family-search" type="search" autocomplete="off" data-placeholder-en="${esc(UI.searchHint.en)}" data-placeholder-es="${esc(UI.searchHint.es)}" placeholder="${esc(UI.searchHint.en)}">
      </label>
      <span class="pair">
      <label for="unit-filter">${ui("unit")}
        <select id="unit-filter">
          <option value="all" data-en="${esc(UI.allUnits.en)}" data-es="${esc(UI.allUnits.es)}">${esc(UI.allUnits.en)}</option>
          ${unitOptions}
        </select>
      </label>
      <label for="topic-filter">${ui("topic")}
        <select id="topic-filter">
          <option value="all" data-en="${esc(UI.allTopics.en)}" data-es="${esc(UI.allTopics.es)}">${esc(UI.allTopics.en)}</option>
          ${topicOptions}
        </select>
      </label>
      </span>
    </section>

    <h2 class="pick">${ui("pick")}</h2>
    <p id="empty-message" class="empty" role="status" hidden>${ui("empty")}</p>
    ${unitCards}
  </main>
</body>
</html>
`;
}

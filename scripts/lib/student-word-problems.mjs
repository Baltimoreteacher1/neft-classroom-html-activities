/**
 * Student word-problems page (lessons/<id>/word-problems/index.html): the same problems as the
 * family page (data/family-word-problems/<id>.json), answered in the browser, plus a "how to
 * solve" tab. Answers and worked steps come from answerFor()/solve() in family-word-problems.mjs,
 * so the family page, this page and the tests all share one calculation.
 * Authored text that only this page needs lives in data/student-word-problems/<id>.json.
 */
import { amount, answerFor, esc, solve } from "./family-word-problems.mjs";
import { STUDENT_CSS, STUDENT_JS } from "./student-word-problems-client.mjs";
import { clientProblem, M, text } from "./word-problems-check.mjs";

const UI = {
  fill: { en: "Fill in every box first.", es: "Llena todas las casillas primero." },
  correct: { en: "Correct! Here is how it works:", es: "¡Correcto! Así funciona:" },
  next: {
    en: "Correct. Now answer the next question.",
    es: "Correcto. Ahora responde la siguiente pregunta.",
  },
  reset: "↻ Reset",
  resetSure: "Click again to reset",
};

const pair = (p) => `<span>${esc(p.en)}</span><span class="es-text" lang="es">${esc(p.es)}</span>`;
function fieldsHtml(problem) {
  const input = (id, label, prefix, suffix) => `<div class="wp-field">
      <label for="in-${esc(problem.id)}-${id}">${pair(label)}</label>
      <div class="wp-field-row">${prefix}<input id="in-${esc(problem.id)}-${id}" class="num-input" type="text" inputmode="decimal" autocomplete="off">${suffix}</div>
    </div>`;
  const unit = problem.unit;
  const prefix = unit === "$" ? "<span>$</span>" : "";
  const suffix = unit === "$" ? "" : pair(unit);
  if (problem.kind === "percent-of")
    return `<div class="wp-fields">${input("0", text("answer"), prefix, suffix)}</div>`;
  return `<div class="wp-fields">${input("0", text("youSave"), prefix, suffix)}${input("1", text("salePrice"), prefix, suffix)}</div>`;
}

function questionsHtml(problem) {
  const ans = answerFor(problem);
  const names = ans.rows.map((r) => r.name);
  const ask = (q, prompt, choices) => `<div class="wp-question">
      <p>${esc(prompt.en)}</p><p class="es-text" lang="es">${esc(prompt.es)}</p>
      <div class="choice-stack">${choices.map((c, i) => `<button type="button" class="choice-btn" data-q="${q}" data-i="${i}">${pair(c)}</button>`).join("")}</div>
    </div>`;
  return ask(0, text("whichMore"), [...names, text("same")]) + ask(1, text("whichCheaper"), names);
}

function cardHtml(problem, number) {
  const label = (key) =>
    `<span>${esc(M.en[key])}</span><span class="es-text" lang="es">${esc(M.es[key])}</span>`;
  return `<article class="stage-card wp-card" id="wp-${esc(problem.id)}" data-id="${esc(problem.id)}">
  <div class="wp-card-head">
    <div><h3>${esc(M.en.problem)} ${number}</h3><div class="es-text" lang="es">${esc(M.es.problem)} ${number}</div></div>
    <button type="button" class="speak-btn">🔊 ${esc(M.en.read)}</button>
  </div>
  <p class="wp-stem">${esc(problem.stem.en)}</p>
  <p class="es-text wp-stem-es" lang="es">${esc(problem.stem.es)}</p>
  <p class="wp-think"><strong>${esc(M.en.askYourself)}</strong> ${esc(problem.ask.en)}</p>
  <p class="wp-think es-text" lang="es"><strong>${esc(M.es.askYourself)}</strong> ${esc(problem.ask.es)}</p>
  ${problem.kind === "deal" ? questionsHtml(problem) : fieldsHtml(problem)}
  <div class="wp-actions">
    ${problem.kind === "deal" ? "" : `<button type="button" class="btn btn-primary check-btn">${label("check")}</button>`}
    <button type="button" class="btn hint-btn" hidden>${label("hint")}</button>
    <button type="button" class="btn steps-btn" hidden>${label("steps")}</button>
  </div>
  <div class="wp-hint-text" hidden>${esc(problem.hint.en)}<div class="es-text" lang="es">${esc(problem.hint.es)}</div></div>
  <div class="wp-steps-box" hidden></div>
  <div class="feedback-box" role="status" aria-live="polite"></div>
</article>`;
}

const strip = (title, blurb, pill) => `<div class="topic-strip">
        <div>
          <h2>${esc(title.en)}</h2>
          <p>${esc(blurb.en)}</p>
          <div class="es-text" lang="es"><strong>${esc(title.es)}.</strong> ${esc(blurb.es)}</div>
        </div>
        <div class="key-rule-pill">${esc(pill.en)}<span class="es-text" lang="es">${esc(pill.es)}</span></div>
      </div>`;

/** The worked example: the five steps applied to one discount problem, every number computed. */
function exampleHtml(student) {
  const ex = student.example;
  const ans = answerFor(ex);
  const lines = (lang) => solve(ex, lang);
  const a = (lang, n) => amount(n, ex.unit, lang);
  const whole = {
    en: `The whole is ${a("en", ex.price)}.`,
    es: `El total es ${a("es", ex.price)}.`,
  };
  const check = {
    en: `${a("en", ans.pay)} is less than ${a("en", ex.price)}, so the sale price makes sense. ${a("en", ans.saved)} is ${ex.percent}% of ${a("en", ex.price)}.`,
    es: `${a("es", ans.pay)} es menos que ${a("es", ex.price)}, así que el precio de oferta tiene sentido. ${a("es", ans.saved)} es el ${ex.percent}% de ${a("es", ex.price)}.`,
  };
  const body = [
    ex.stem,
    whole,
    { en: lines("en")[0], es: lines("es")[0] },
    { en: lines("en").slice(1).join(" "), es: lines("es").slice(1).join(" ") },
    check,
  ];
  const items = student.plan.steps
    .map(
      (s, i) =>
        `<li><strong>${esc(s.name.en)}.</strong> ${esc(body[i].en)}<div class="es-text" lang="es"><strong>${esc(s.name.es)}.</strong> ${esc(body[i].es)}</div></li>`,
    )
    .join("\n        ");
  return `<section class="stage-card example-card" aria-label="${esc(M.en.example)}">
      <h3>${esc(M.en.example)}</h3><div class="es-text" lang="es">${esc(M.es.example)}</div>
      <ol class="example-steps">
        ${items}
      </ol>
    </section>`;
}

/** One complete student page for a lesson's word problems. */
export function studentPage(student, family, lessonConfig) {
  const id = student.lessonId;
  const unit = Number.parseInt(id, 10);
  const groups = family.groups;
  const problems = groups.flatMap((g) => g.problems);
  const total = problems.length;
  let n = 0;
  const tabDefs = [
    { id: "plan", ...student.plan.tab },
    ...groups.map((g) => ({
      id: g.id,
      name: student.tabs[g.id].name,
      desc: {
        en: `${student.tabs[g.id].desc.en} (${g.problems.length})`,
        es: `${student.tabs[g.id].desc.es} (${g.problems.length})`,
      },
    })),
  ];
  const tabBtns = tabDefs
    .map(
      (
        t,
        i,
      ) => `<button type="button" class="tab-btn" role="tab" id="tab-${esc(t.id)}" aria-selected="${i === 0}" aria-controls="panel-${esc(t.id)}" tabindex="${i === 0 ? 0 : -1}" data-tab="${esc(t.id)}">
        <span class="tab-badge" id="badge-${esc(t.id)}">${i + 1}</span>
        <span class="tab-text">
          <span class="tab-name">${esc(t.name.en)}</span>
          <span class="tab-desc">${esc(t.desc.en)}</span>
        </span>
      </button>`,
    )
    .join("\n      ");
  const first = groups[0];
  const planPanel = `<section id="panel-plan" class="tab-panel active" role="tabpanel" aria-labelledby="tab-plan">
      ${strip(student.plan.title, student.plan.blurb, student.plan.rule)}
      <ol class="plan-list">
${student.plan.steps.map((s) => `        <li class="plan-step"><div><h3>${esc(s.name.en)}</h3><p>${esc(s.text.en)}</p><p class="es-text" lang="es"><strong>${esc(s.name.es)}.</strong> ${esc(s.text.es)}</p></div></li>`).join("\n")}
      </ol>
      ${exampleHtml(student)}
      <p class="wp-go"><button type="button" class="btn btn-go" data-goto="${esc(first.id)}">${esc(M.en.start)} ${esc(student.tabs[first.id].name.en)} ➔<span class="es-text" lang="es">${esc(M.es.start)} ${esc(student.tabs[first.id].name.es)} ➔</span></button></p>
    </section>`;
  const groupPanels = groups
    .map(
      (
        g,
      ) => `<section id="panel-${esc(g.id)}" class="tab-panel" role="tabpanel" aria-labelledby="tab-${esc(g.id)}">
      ${strip(g.title, g.blurb, student.tabs[g.id].pill)}
${g.problems.map((p) => cardHtml(p, ++n)).join("\n")}
    </section>`,
    )
    .join("\n    ");
  const data = {
    key: `neft_u4_${id.replace("-", "")}_wp_v1`,
    ui: UI,
    tabs: Object.fromEntries(groups.map((g) => [g.id, g.problems.map((p) => p.id)])),
    problems: problems.map(clientProblem),
  };
  const dataJson = JSON.stringify(data).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="en" data-unit="${unit}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(lessonConfig.title)} · Word Problems (Grade 6)</title>
  <meta name="description" content="Interactive Grade 6 word problems for lesson ${esc(id)}: a five-step plan for percent word problems, then problems about a percent of a number, discounts and sale prices, and comparing deals.">
  <!-- generated:student-word-problems lesson=${esc(id)} — regenerate: npm run generate-word-problems -->
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%231B2C3F'/%3E%3Ctext x='50%25' y='54%25' dominant-baseline='middle' text-anchor='middle' font-family='Georgia,serif' font-weight='bold' font-size='26' fill='%231FA6A2'%3E%25%E2%96%B6%3C/text%3E%3C/svg%3E">
  <link rel="stylesheet" href="/assets/u4-studio.css">
  <link rel="stylesheet" href="/assets/studio-comfort.css">
  <script src="/assets/studio-comfort.js" defer></script>
  <style>${STUDENT_CSS}</style>
</head>
<body>

  <header class="app-header">
    <div class="header-wrap">
      <div class="brand">
        <div class="brand-icon" aria-hidden="true">%?</div>
        <div>
          <h1 class="brand-title">${esc(lessonConfig.title)}</h1>
          <div class="brand-sub">Grade 6 Math · Unit ${unit} Word Problems (${esc(lessonConfig.standard)}) · Lesson ${esc(id)}</div>
        </div>
      </div>
      <div class="header-actions">
        <div class="score-pill" aria-live="polite"><span>Solved: <span id="solved-count">0 / ${total}</span></span></div>
        <button type="button" class="top-btn" id="toggle-es-btn" aria-pressed="false">&#127760; Espa&ntilde;ol</button>
        <button type="button" class="top-btn" id="print-btn">&#128424; Print</button>
        <button type="button" class="top-btn" id="reset-all-btn" title="Clear saved answers and start fresh">${esc(UI.reset)}</button>
      </div>
    </div>
  </header>

  <nav class="tab-bar" aria-label="Word problem sections">
    <div class="tab-list" role="tablist">
      ${tabBtns}
    </div>
  </nav>

  <main class="main-container">
    <p class="wp-target"><span aria-hidden="true">🎯</span><span><span class="t-en">${esc(student.target.en)}</span><span class="t-es" lang="es">${esc(student.target.es)}</span></span></p>
    ${planPanel}
    ${groupPanels}
  </main>

  <footer class="app-footer">
    <div class="footer-wrap">
      <div>Grade 6 Math · Unit ${unit} Percents · <strong>Lesson ${esc(id)} Word Problems</strong></div>
      <div>Aligned to standard <strong>${esc(lessonConfig.standard)}</strong> · ${esc(lessonConfig.title)}</div>
    </div>
  </footer>

  <script type="application/json" id="wp-data">${dataJson}</script>
  <script>${STUDENT_JS}</script>
</body>
</html>
`;
}

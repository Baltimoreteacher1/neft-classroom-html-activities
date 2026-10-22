/**
 * The family word-problems page (lessons/<id>/family/word-problems/index.html), dressed as the
 * lesson's homework page: a student and a grown-up work the problems as a team, type answers and
 * get checked, see a picture, ask the Grown-up corner's question, earn stars and a certificate.
 * Problems, hints and coaching text are authored in data/family-word-problems/<id>.json; every
 * answer comes from answerFor()/solve() in family-word-problems.mjs, so nothing is typed twice.
 */
import { amount, answerFor, esc, solve } from "./family-word-problems.mjs";
import {
  FAMILY_CSS,
  FAMILY_JS,
  LANGUAGE_BOOT,
  LANGUAGE_SELECTOR,
} from "./family-word-problems-client.mjs";
import { clientProblem, text } from "./word-problems-check.mjs";

/** One sentence in both languages, in the markup the homework pages use for language mode. */
const both = (pair) =>
  `<span class="lang-en">${esc(pair.en)}</span><span class="lang-es" lang="es">${esc(pair.es)}</span>`;

const KIND_LABEL = {
  "percent-of": { en: "Find the part", es: "Halla la parte" },
  discount: { en: "Discount", es: "Descuento" },
  deal: { en: "Compare deals", es: "Compara ofertas" },
};

const T = {
  askYourStudent: { en: "Ask your student:", es: "Pregunta a tu estudiante:" },
  listenFor: { en: "Listen for:", es: "Escuchen si:" },
  stems: { en: "Sentence starters:", es: "Frases para empezar:" },
  corner: { en: "Grown-up corner", es: "Rincón del adulto" },
  picture: { en: "Show a picture", es: "Ver un dibujo" },
  work: { en: "📝 Show your work", es: "📝 Muestra tu trabajo" },
  key: { en: "Grown-up: show the answer", es: "Adulto: ver la respuesta" },
  keyTry: {
    en: "Not tried yet? Close this and give it one try first. A wrong first try still helps.",
    es: "¿Todavía no lo intentaron? Ciérrenla y hagan un intento primero. Un primer intento incorrecto también ayuda.",
  },
  percent: { en: "Percent", es: "Porcentaje" },
  whole: { en: "Whole", es: "Total" },
  continue: { en: "Continue ➔", es: "Continuar ➔" },
};

/** What the page script shows after a right answer or a first-try right answer. */
const UI = {
  fill: { en: "Fill in every box first.", es: "Llena todas las casillas primero." },
  correct: {
    en: "Nice work, team! Here is how it works:",
    es: "¡Buen trabajo, equipo! Así funciona:",
  },
  firstTry: {
    en: "First try! Great teamwork. Here is how it works:",
    es: "¡A la primera! Gran trabajo en equipo. Así funciona:",
  },
  next: {
    en: "Correct. Now answer the next question.",
    es: "Correcto. Ahora responde la siguiente pregunta.",
  },
  reset: "↻ Start over · Empezar de nuevo",
  resetSure: "Click again to erase your progress · Haz clic otra vez para borrar",
};

const label = (key) => both(text(key));

/** A shaded bar: `percent` of the whole, with ticks every 10%. */
const bar = (percent) =>
  `<div class="wp-bar" role="img" aria-label="${percent}%"><span class="wp-bar-fill" style="width:${percent}%"></span></div>`;

/** The picture for one problem: the whole as a bar with the percent shaded. Never shows the answer. */
function pictureHtml(problem) {
  const a = (lang, n) => amount(n, problem.unit, lang);
  const line = (cls, en, es) => `<p class="${cls}">${both({ en, es })}</p>`;
  if (problem.kind === "percent-of")
    return (
      line(
        "wp-pic-label",
        `The whole is ${a("en", problem.whole)}.`,
        `El total es ${a("es", problem.whole)}.`,
      ) +
      bar(problem.percent) +
      line(
        "wp-pic-note",
        `The shaded part is ${problem.percent}% of the whole.`,
        `La parte sombreada es el ${problem.percent}% del total.`,
      )
    );
  if (problem.kind === "discount")
    return (
      line(
        "wp-pic-label",
        `The price is ${a("en", problem.price)}.`,
        `El precio es ${a("es", problem.price)}.`,
      ) +
      bar(problem.percent) +
      line(
        "wp-pic-note",
        `The shaded part is the ${problem.percent}% discount. You pay the other ${100 - problem.percent}%.`,
        `La parte sombreada es el descuento del ${problem.percent}%. Pagas el otro ${100 - problem.percent}%.`,
      )
    );
  return problem.options
    .map(
      (o) =>
        line(
          "wp-pic-label",
          `${o.name.en}: ${a("en", o.price)}, ${o.percent}% off.`,
          `${o.name.es}: ${a("es", o.price)}, ${o.percent}% de descuento.`,
        ) + bar(o.percent),
    )
    .join("");
}

function fieldsHtml(problem) {
  const id = esc(problem.id);
  const input = (n, key) => `<div class="wp-field">
      <label class="hw-inline" for="in-${id}-${n}">${label(key)}</label>
      <div class="wp-field-row">${problem.unit === "$" ? "<span>$</span>" : ""}<input id="in-${id}-${n}" class="num-input" type="text" inputmode="decimal" autocomplete="off">${problem.unit === "$" ? "" : `<span class="hw-inline">${both(problem.unit)}</span>`}</div>
    </div>`;
  const keys = problem.kind === "percent-of" ? ["answer"] : ["youSave", "salePrice"];
  return `<div class="wp-fields">${keys.map((k, n) => input(n, k)).join("")}</div>`;
}

function questionsHtml(problem) {
  const names = answerFor(problem).rows.map((r) => r.name);
  const ask = (q, key, choices) => `<div class="wp-question">
      <p>${label(key)}</p>
      <div class="choice-stack">${choices.map((c, i) => `<button type="button" class="choice-btn" data-q="${q}" data-i="${i}">${both(c)}</button>`).join("")}</div>
    </div>`;
  return ask(0, "whichMore", [...names, text("same")]) + ask(1, "whichCheaper", names);
}

function coachHtml(problem, coach) {
  const c = coach[problem.kind];
  return `<details class="wp-corner">
      <summary>👪 ${both(T.corner)}</summary>
      <div>
        <p><strong>${both(T.askYourStudent)}</strong> ${both(problem.ask)}</p>
        <p><strong>${both(T.listenFor)}</strong> ${both(c.listenFor)}</p>
        <p><strong>${both(T.stems)}</strong></p>
        <ul>${c.stems.map((s) => `<li>${both(s)}</li>`).join("")}</ul>
      </div>
    </details>`;
}

function answerKeyHtml(problem) {
  const en = solve(problem, "en");
  const es = solve(problem, "es");
  return `<details class="hw-answer-key">
    <summary><span class="hw-answer-key-icon" aria-hidden="true">🔑</span> ${both(T.key)}</summary>
    <div class="hw-answer-key-body">
      <p class="hw-answer-key-try">${both(T.keyTry)}</p>
      <ul class="hw-answer-key-lines">${en.map((line, i) => `<li>${both({ en: line, es: es[i] })}</li>`).join("")}</ul>
    </div>
  </details>`;
}

function cardHtml(problem, number, coach) {
  const id = esc(problem.id);
  return `<section class="problem-section card wp-card wp-problem" id="${id}" data-id="${id}">
  <div class="problem-header-row">
    <div class="problem-number-badge hw-inline"><span class="wp-emoji" aria-hidden="true">${problem.emoji}</span> ${both({ en: "Problem", es: "Problema" })} ${number}</div>
    <button type="button" class="btn btn-sm btn-outline-secondary speak-btn">🔊 ${both({ en: "Listen", es: "Escuchar" })}</button>
    <div class="problem-type-badge">${both(KIND_LABEL[problem.kind])}</div>
  </div>
  <div class="problem-body">
    <p class="problem-stem"><span class="lang-en wp-stem">${esc(problem.stem.en)}</span><span class="lang-es wp-stem-es" lang="es">${esc(problem.stem.es)}</span></p>
    ${problem.kind === "deal" ? questionsHtml(problem) : fieldsHtml(problem)}
    <div class="wp-actions">
      ${problem.kind === "deal" ? "" : `<button type="button" class="btn btn-primary check-btn">✓ ${label("check")}</button>`}
      <button type="button" class="btn btn-outline-secondary hint-btn" hidden>🪜 ${label("hint")}</button>
      <button type="button" class="btn btn-outline-secondary steps-btn" hidden>${label("steps")}</button>
    </div>
    <div class="feedback-box" role="status" aria-live="polite"></div>
    <div class="wp-hint-text" hidden>${both(problem.hint)}</div>
    <div class="wp-steps-box" hidden></div>
    <details class="wp-picture"><summary>🖼️ ${both(T.picture)}</summary><div>${pictureHtml(problem)}</div></details>
    <div class="hw-work">
      <label class="hw-work-label hw-inline" for="work_${id}">${both(T.work)}</label>
      <textarea id="work_${id}" name="work_${id}" class="custom-textarea hw-work-input" rows="3" placeholder="Step 1...  Step 2...  Step 3..."></textarea>
    </div>
    ${coachHtml(problem, coach)}
  </div>
  ${answerKeyHtml(problem)}
</section>`;
}

const teamHtml = (data) => `<section class="card wp-team-card">
    <h3>${both(data.team.title)}</h3>
    <p>${both(data.team.intro)}</p>
    <ul class="wp-team">${data.team.roles
      .map(
        (r) =>
          `<li><span class="wp-role-emoji" aria-hidden="true">${r.emoji}</span><h3>${both(r.title)}</h3><p>${both(r.text)}</p></li>`,
      )
      .join("")}</ul>
  </section>`;

const explorerHtml = (data) => `<section class="card wp-explorer">
    <h3>📊 ${both(data.explorer.title)}</h3>
    <p>${both(data.explorer.text)}</p>
    <div class="wp-explorer-controls">
      <div><label class="hw-inline" for="wp-bar-percent">${both(T.percent)}</label><div class="wp-range-row"><input type="range" id="wp-bar-percent" min="5" max="100" step="5" value="25"><strong id="wp-bar-pct">25%</strong></div></div>
      <div><label class="hw-inline" for="wp-bar-whole">${both(T.whole)}</label><input type="number" id="wp-bar-whole" value="80" min="0" step="any" inputmode="decimal"></div>
    </div>
    <div class="wp-cells" id="wp-cells" aria-hidden="true"></div>
    <div class="wp-bar-out" id="wp-bar-out" role="status" aria-live="polite"></div>
  </section>`;

const doneHtml = (
  data,
  id,
) => `<p id="wp-cert-locked" class="wp-celebrate-msg" style="background:var(--fp-note);border-color:#d9a400;color:var(--fp-note-ink)">${both(data.celebrate.locked)}</p>
  <p id="wp-cert-done" class="wp-celebrate-msg" hidden>${both(data.celebrate.done)}</p>
  <p class="hw-inline">⭐ ${both({ en: "Solved on the first try:", es: "Resueltos a la primera:" })} <strong id="wp-first">0</strong></p>
  <div class="wp-cert-wrap">
    <section class="wp-cert locked" id="wp-cert" aria-label="Certificate">
      <div class="wp-cert-star" aria-hidden="true">🏆</div>
      <h3>${both({ en: "Family Math Team Certificate", es: "Certificado del equipo familiar de matemáticas" })}</h3>
      <p>${both({ en: "Awarded to", es: "Se otorga a" })}</p>
      <input id="wp-name" type="text" maxlength="60" placeholder="Name · Nombre" aria-label="Name · Nombre">
      <p>${both({ en: `for solving the Lesson ${id} word problems together with their family.`, es: `por resolver juntos en familia los problemas verbales de la lección ${id}.` })}</p>
      <p id="wp-cert-date"></p>
    </section>
    <p><button type="button" class="btn btn-primary" id="wp-print-cert" disabled>🖨️ ${both({ en: "Print certificate", es: "Imprimir certificado" })}</button></p>
  </div>
  <section class="hw-teach">
    <h3>${both({ en: "Teach it to someone", es: "Enséñaselo a alguien" })}</h3>
    <ol class="hw-teach-steps">
      <li>${both({ en: "Pick one problem you solved.", es: "Elige un problema que resolviste." })}</li>
      <li>${both({ en: "Explain it out loud. Use any language first.", es: "Explícalo en voz alta. Usa primero el idioma que prefieras." })}</li>
      <li>${both({ en: "Your partner asks: “How do you know?” Answer with: “I got ___ because ___. I checked by ___.”", es: "Tu acompañante pregunta: “¿Cómo lo sabes?” Responde: “Obtuve ___ porque ___. Comprobé usando ___.”" })}</li>
    </ol>
  </section>
  <section class="card wp-hunt">
    <h3>🔎 ${both(data.hunt.title)}</h3>
    <p>${both(data.hunt.text)}</p>
  </section>
  <p class="wp-links">
    <button type="button" class="btn btn-primary" onclick="window.print()">${both({ en: "Print this page", es: "Imprimir esta página" })}</button>
    <a href="/lessons/${id}/homework.html">${both({ en: `Lesson ${id} homework`, es: `Tarea de la lección ${id}` })}</a>
    <a href="/lessons/${id}/family/">${both({ en: `Lesson ${id} family guide`, es: `Guía para familias de la lección ${id}` })}</a>
    <button type="button" class="btn btn-sm btn-outline-secondary" id="wp-reset">${esc(UI.reset)}</button>
  </p>`;

/** One complete page for a lesson's word-problem set, dressed as the lesson's homework page. */
export function wordProblemsPage(data, chrome) {
  const unit = Number.parseInt(data.lessonId, 10);
  const id = esc(data.lessonId);
  const problems = data.groups.flatMap((g) => g.problems);
  const total = problems.length;
  let n = 0;
  const stops = [
    { id: "learn", label: { en: "Learn", es: "Aprender" }, emoji: "📖" },
    ...data.groups.map((g) => ({ id: g.id, label: g.tab, emoji: g.emoji, title: g.title })),
    {
      id: "done",
      label: { en: "Done", es: "Listo" },
      emoji: "🎉",
      title: { en: "Finished for today", es: "Terminaste por hoy" },
    },
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
  <button type="button" class="btn btn-primary flow-next-btn" data-next="${esc(to)}">${both(T.continue)}</button>
</div>`;
  const panel = (stop, heading, body) =>
    `<div class="tab-panel-inner" data-tab-panel="${esc(stop.id)}" id="wp_panel_${esc(stop.id)}" role="tabpanel" aria-labelledby="wp_tab_${esc(stop.id)}"${stop.id === "learn" ? "" : " hidden"}>
  <h2 class="section-title">${stop.emoji} ${both(heading)}</h2>
${body}
</div>`;
  const panels = stops.map((stop, i) => {
    if (stop.id === "learn")
      return panel(
        stop,
        stop.label,
        `  <section class="card wp-intro"><p>${both(data.intro)}</p></section>\n  ${teamHtml(data)}\n  ${explorerHtml(data)}\n  ${next(stops[i + 1].id)}`,
      );
    if (stop.id === "done") return panel(stop, stop.title, doneHtml(data, id));
    const g = data.groups.find((q) => q.id === stop.id);
    return panel(
      stop,
      g.title,
      `  <p class="wp-blurb">${both(g.blurb)}</p>\n${g.problems.map((p) => cardHtml(p, ++n, data.coach)).join("\n")}\n  ${next(stops[i + 1].id)}`,
    );
  });
  const clientData = {
    key: `neft_fam_${data.lessonId.replace("-", "")}_wp_v1`,
    ui: UI,
    tabs: Object.fromEntries(data.groups.map((g) => [g.id, g.problems.map((p) => p.id)])),
    problems: problems.map(clientProblem),
  };
  const dataJson = JSON.stringify(clientData).replace(/</g, "\\u003c");
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
<style>${FAMILY_CSS}</style>
</head>
<body data-family-style="${esc(chrome.bodyStyle)}">
<script>
${LANGUAGE_BOOT}
</script>
<div id="wp-confetti" aria-hidden="true"></div>
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
      <p class="hw-hero-lead">${both({ en: "Team up: one student and one grown-up. No grades. Any language.", es: "Trabajen en equipo: un estudiante y un adulto. Sin calificaciones. En cualquier idioma." })}</p>
      <ul class="hw-tonight hw-inline" aria-label="At a glance">
        <li><span aria-hidden="true">✏️</span> ${both({ en: "Pencil and paper", es: "Lápiz y papel" })}</li>
        <li><span aria-hidden="true">🎯</span> <strong>${total}</strong> ${both({ en: "word problems", es: "problemas verbales" })}</li>
        <li class="wp-stars"><span aria-hidden="true">⭐</span> <strong id="wp-stars">0</strong> / ${total} ${both({ en: "solved", es: "resueltos" })}</li>
      </ul>
      <div class="wp-meter" aria-hidden="true"><span id="wp-meter-fill"></span></div>
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
<script type="application/json" id="wp-data">${dataJson}</script>
<script>
${FAMILY_JS}
</script>
</body>
</html>
`;
}

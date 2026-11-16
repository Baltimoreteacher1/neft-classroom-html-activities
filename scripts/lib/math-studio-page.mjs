// Markup for Math Studio: the lesson page (/math/studio/<id>/), the finder (/math/studio/), and the five-stage bar that
// the Practice and Challenge studios and the Learning Labs carry so they read as stages of one product.
import { withCurriculumShell } from "../../tools/lib/curriculum-shell.mjs";

export const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
/** English always; Spanish beside it, shown by the language switch. */
const bi = (en, es) =>
  `<span class="t-en">${esc(en)}</span>${es ? `<span class="t-es" lang="es">${esc(es)}</span>` : ""}`;
const json = (o) => JSON.stringify(o).replace(/</g, "\\u003c");

export const STAGE_INFO = [
  ["explore", "Explore", "Explora", "Change the model and test an idea"],
  ["understand", "Understand", "Comprende", "See why the mathematics works"],
  ["practice", "Practice", "Practica", "Regular and Challenge practice"],
  ["apply", "Apply", "Aplica", "Use the idea in a new situation"],
  ["reflect", "Reflect", "Reflexiona", "Show what you know on your own"],
];

/** The compact five-stage bar. `current` is a stage key; on the studio page the runtime keeps aria-current in step. */
export function stageBar(id, current, { inPage = false, label = "" } = {}) {
  const base = `/math/studio/${id}/`;
  return `<nav class="ms-stagebar" aria-label="Learning Lab stages for lesson ${esc(id)}" data-ms-lesson="${esc(id)}"><a class="ms-stagebar__home" href="${base}">Learning Lab <span>${esc(label || `Lesson ${id}`)}</span></a><ol>${STAGE_INFO.map(
    ([key, en, es], i) =>
      `<li><a href="${inPage ? `#${key}` : `${base}#${key}`}" data-stage-link="${key}"${key === current ? ' aria-current="step"' : ""}><span class="ms-step" aria-hidden="true">${i + 1}</span>${bi(en, es)}</a></li>`,
  ).join("")}</ol></nav>`;
}

/** The bar for a Learning Lab, which serves several lessons: one Math Studio link per lesson. */
export function labBar(lab) {
  return `<nav class="ms-stagebar ms-stagebar--lab" aria-label="Use this lab in Learning Lab (Practice HTML)"><a class="ms-stagebar__home" href="/math/studio/">Learning Lab (Practice HTML)</a><p>This model is the Explore stage for ${lab.lessons
    .map((l) => `<a href="/math/studio/${esc(l)}/#explore">Lesson ${esc(l)}</a>`)
    .join(" and ")}. Open a lesson to explore, practice, apply and reflect in one place.</p></nav>`;
}

const steps = (s) =>
  s
    ? `<article class="ms-worked"><h4>${esc(s.title)}</h4><ol>${s.lines.map((l, i) => `<li>${bi(l, s.linesEs?.[i])}</li>`).join("")}</ol></article>`
    : "";

/** Key ideas are written as "Title. Formula: ... 1. ... 2. ..." — show the numbered points as a list when they are there. */
function keyIdea(text, textEs) {
  if (!text) return "";
  const parts = text.split(/\s(?=\d+\.\s)/);
  const head = parts.shift();
  return `<aside class="ms-keyidea" aria-label="Key idea"><h3>${bi("Key idea", "Idea clave")}</h3><p>${esc(head)}</p>${parts.length ? `<ol>${parts.map((p) => `<li>${esc(p.replace(/^\d+\.\s/, ""))}</li>`).join("")}</ol>` : ""}${textEs ? `<p class="t-es" lang="es">${esc(textEs)}</p>` : ""}</aside>`;
}

function understand(L) {
  const u = L.understand;
  const vocab = u.vocabulary?.length
    ? `<details class="ms-support" open><summary>${bi("Words to use", "Palabras para usar")}</summary><ul class="ms-vocab">${u.vocabulary
        .map(
          (v) =>
            `<li>${v.image ? `<img src="${esc(v.image)}" alt="" width="72" height="72" loading="lazy">` : ""}<div><strong>${bi(v.term, v.termEs)}</strong><p>${bi(v.definition, v.definitionEs)}</p>${v.example ? `<p class="ms-muted">${esc(v.example)}</p>` : ""}</div></li>`,
        )
        .join("")}</ul></details>`
    : "";
  return `<div class="ms-understand">
    <div class="ms-col">
      <h3>${bi(u.heading || "The big idea", u.headingEs)}</h3>
      ${u.intro ? `<p class="ms-lead">${bi(u.intro, u.introEs)}</p>` : ""}
      ${u.picture ? `<figure class="ms-picture"><img src="${esc(u.picture.src)}" alt="${esc(u.picture.alt || "")}" loading="lazy"><figcaption>${bi(u.picture.context || "", u.picture.contextEs)}</figcaption></figure>` : ""}
      <div class="ms-cra" role="group" aria-label="Worked examples">${steps(u.iDo)}${steps(u.weDo)}${steps(u.youDo)}</div>
      <p><button type="button" class="ms-btn ms-btn--quiet" data-goto="explore">${bi("See it in the model", "Míralo en el modelo")}</button></p>
    </div>
    <div class="ms-col ms-col--side">
      ${keyIdea(u.keyIdea, u.keyIdeaEs)}
      ${u.mistake ? `<aside class="ms-mistake"><h3>${bi("Watch out", "Cuidado")}</h3><p>${esc(u.mistake)}</p></aside>` : ""}
      ${vocab}
      ${u.frame ? `<details class="ms-support"><summary>${bi("Sentence frame", "Marco de oración")}</summary><p class="ms-frame">${bi(u.frame, u.frameEs)}</p></details>` : ""}
    </div>
  </div>`;
}

function apply(L) {
  const a = L.apply;
  const task = (key, title, titleEs, body, extra = "") =>
    `<article class="ms-task" data-apply="${key}"><h3>${bi(title, titleEs)}</h3>${body}<label class="ms-label" for="ms-apply-${key}">${bi("My work and reasoning", "Mi trabajo y razonamiento")}</label><textarea id="ms-apply-${key}" rows="5" data-apply-input="${key}"></textarea>${extra}<div class="ms-row"><button type="button" class="ms-btn ms-btn--quiet" data-compare="${key}">${bi("Compare with a sample", "Comparar con un ejemplo")}</button></div><div class="ms-compare" data-compare-out="${key}" hidden></div></article>`;
  const parts = [];
  if (a.wordProblem)
    parts.push(
      task(
        "word",
        a.wordProblem.title || "Apply it",
        "",
        `${a.wordProblem.image ? `<img class="ms-task__img" src="${esc(a.wordProblem.image)}" alt="${esc(a.wordProblem.imageAlt || "")}" loading="lazy">` : ""}<p>${esc(a.wordProblem.text)}</p>`,
      ),
    );
  if (a.scenario)
    parts.push(
      task(
        "scenario",
        "Real-world connection",
        "Conexión con el mundo real",
        `<p>${bi(a.scenario.text, a.scenario.textEs)}</p>${a.scenario.prompt ? `<p class="ms-frame">${bi(a.scenario.prompt, a.scenario.promptEs)}</p>` : ""}`,
      ),
    );
  parts.push(task("create", `Create: ${L.lab.title}`, "Crea", `<p>${esc(L.lab.create)}</p>`));
  if (a.reasoning)
    parts.push(
      task(
        "reasoning",
        "Reasoning challenge",
        "Reto de razonamiento",
        `<p>${bi(a.reasoning.prompt, a.reasoning.promptEs)}</p>`,
      ),
    );
  const optional = a.optional?.length
    ? `<aside class="ms-optional"><h3>${bi("Optional: projects and stories", "Opcional: proyectos e historias")}</h3><p class="ms-muted">${bi("For extra exploration. These do not count as evidence of mastery.", "Para explorar más. No cuentan como evidencia de dominio.")}</p><ul>${a.optional.map((o) => `<li><a href="${esc(o.href)}">${esc(o.label)}</a></li>`).join("")}</ul></aside>`
    : "";
  return `<div class="ms-apply">${parts.join("")}</div>${optional}`;
}

const stageHead = (i, key, en, es, lead, leadEs) =>
  `<header class="ms-stagehead"><p class="ms-eyebrow">${bi(`Stage ${i} of 5`, `Etapa ${i} de 5`)}</p><h2 id="h-${key}" tabindex="-1">${bi(en, es)}</h2><p>${bi(lead, leadEs)}</p></header>`;

export function lessonPage(L, stamp) {
  const css = `/assets/math-studio/studio.css?v=${stamp}`;
  const data = { ...L, resources: undefined };
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Learning Lab (Practice HTML) · ${esc(L.id)} ${esc(L.title)} | EduWonderLab</title>
<meta name="description" content="${esc(`Learning Lab (Practice HTML) for Grade 6 lesson ${L.id}: explore, understand, practice, apply and reflect. ${L.objective || ""}`)}">
<link rel="icon" href="/assets/favicon.svg">
<link rel="canonical" href="https://eduwonderlab.com/math/studio/${esc(L.id)}/">
<link rel="stylesheet" href="/curriculum/learning-labs/shared/lab.css?v=${stamp}">
<link rel="stylesheet" href="/assets/math-studio/stage-bar.css?v=${stamp}">
<link rel="stylesheet" href="${css}">
</head>
<body class="ms" data-lesson="${esc(L.id)}">
<header class="ms-hero">
  <div class="ms-wrap">
    <nav class="ms-crumbs" aria-label="Breadcrumb"><a href="/curriculum/units/">Lessons</a><a href="/lessons/${esc(L.id)}/">Lesson ${esc(L.id)}</a><span aria-current="page">Learning Lab</span></nav>
    <div class="ms-hero__row">
      <div>
        <p class="ms-eyebrow">Learning Lab (Practice HTML) · Unit ${esc(L.unit)} · Lesson ${esc(L.id)}${L.standard ? ` · ${esc(L.standard)}` : ""}</p>
        <h1>${esc(L.title)}</h1>
        ${L.objective ? `<p class="ms-objective">${esc(L.objective)}</p>` : ""}
      </div>
      <div class="ms-hero__tools">
        <button type="button" class="ms-btn ms-btn--quiet" id="ms-lang" aria-pressed="false">Español</button>
        <p class="ms-saved" id="ms-saved" role="status">Your work saves on this device.</p>
      </div>
    </div>
    <div class="ms-entry">
      <a class="ms-btn" href="#explore" data-goto="explore" id="ms-start">Start the Learning Lab</a>
      <span class="ms-entry__or">or go straight to practice:</span>
      <a class="ms-btn ms-btn--quiet" href="#practice" data-goto="practice" data-level="regular">Regular</a>
      <a class="ms-btn ms-btn--quiet" href="#practice" data-goto="practice" data-level="challenge">Challenge</a>
    </div>
  </div>
</header>
${stageBar(L.id, "explore", { inPage: true, label: `Lesson ${L.id}` })}
<main id="ms-main" class="ms-wrap">
  <div class="ms-resume" id="ms-resume" hidden></div>
  <section class="ms-stage" id="explore" data-stage="explore" aria-labelledby="h-explore">
    ${stageHead(1, "explore", "Explore", "Explora", `Use the ${L.lab.title} model. Predict first, then change the quantities and watch what stays the same.`, "Usa el modelo. Primero predice; luego cambia las cantidades y observa qué se mantiene igual.")}
    <div class="ms-handoff" id="ms-handoff" hidden></div>
    <div class="ms-explore">
      <div class="ms-explore__model"><div id="ms-model" class="ms-model"><p class="ms-muted">Loading the model…</p></div><p class="ms-guide" id="ms-guide"></p></div>
      <div class="ms-explore__side">
        <label class="ms-label" for="ms-prediction">${bi("1. My prediction", "1. Mi predicción")}</label>
        <p class="ms-question">${esc(L.lab.investigate?.[0] || "")}</p>
        <textarea id="ms-prediction" rows="3"></textarea>
        <h3 class="ms-label">${bi("2. Investigate", "2. Investiga")}</h3>
        <ol class="ms-investigate">${(L.lab.investigate || [])
          .slice(1)
          .map((q) => `<li>${esc(q)}</li>`)
          .join("")}</ol>
        <label class="ms-label" for="ms-notes">${bi("3. What I noticed", "3. Lo que noté")}</label>
        <textarea id="ms-notes" rows="3"></textarea>
        <div class="ms-test" id="ms-test"><h3>${bi("4. Test it without the model", "4. Pruébalo sin el modelo")}</h3><p class="ms-muted">${bi("Turn the model's current settings into a question, then try a new one on your own.", "Convierte la configuración del modelo en una pregunta y luego intenta una nueva por tu cuenta.")}</p><button type="button" class="ms-btn" id="ms-make-question">${bi("Make a question from my model", "Crear una pregunta con mi modelo")}</button><div id="ms-test-out"></div></div>
      </div>
    </div>
    <p class="ms-more"><a href="${esc(L.lab.href)}">Open the full ${esc(L.lab.title)} lab</a>${L.lab.lessons.length > 1 ? ` <span class="ms-muted">(shared by lessons ${L.lab.lessons.map(esc).join(" and ")})</span>` : ""}</p>
  </section>
  <section class="ms-stage" id="understand" data-stage="understand" aria-labelledby="h-understand">
    ${stageHead(2, "understand", "Understand", "Comprende", "Read the idea, follow the worked examples, and connect the picture to the numbers.", "Lee la idea, sigue los ejemplos resueltos y conecta el dibujo con los números.")}
    ${understand(L)}
  </section>
  <section class="ms-stage" id="practice" data-stage="practice" aria-labelledby="h-practice">
    ${stageHead(3, "practice", "Practice", "Practica", "Choose Regular or Challenge. Hints come one step at a time; you get a new question after a worked example.", "Elige Regular o Reto. Las pistas llegan paso a paso; después de un ejemplo resuelto recibes una pregunta nueva.")}
    <div class="ms-levels" role="tablist" aria-label="Practice level">
      <button type="button" role="tab" id="tab-regular" aria-controls="ms-runner" aria-selected="true" data-level="regular"><strong>${bi("Regular", "Regular")}</strong><span>${bi("Core lesson questions", "Preguntas centrales")}</span></button>
      <button type="button" role="tab" id="tab-challenge" aria-controls="ms-runner" aria-selected="false" data-level="challenge"><strong>${bi("Challenge", "Reto")}</strong><span>${bi("Reasoning, transfer and error analysis", "Razonamiento, transferencia y análisis de errores")}</span></button>
    </div>
    <div id="ms-runner" class="ms-runner" role="tabpanel" aria-labelledby="tab-regular"><p class="ms-muted">Loading practice…</p></div>
    <aside class="ms-full">
      <h3>${bi("Full practice studios", "Estudios de práctica completos")}</h3>
      <p class="ms-muted">${bi("Five sections of practice with hands-on activities, fresh problems and your saved progress.", "Cinco secciones de práctica con actividades, problemas nuevos y tu progreso guardado.")}</p>
      <div class="ms-row"><a class="ms-btn ms-btn--quiet" href="${esc(L.practice.urls.regular)}">Open Regular Practice Studio</a><a class="ms-btn ms-btn--quiet" href="${esc(L.practice.urls.challenge)}">Open Challenge Practice Studio</a></div>
    </aside>
  </section>
  <section class="ms-stage" id="apply" data-stage="apply" aria-labelledby="h-apply">
    ${stageHead(4, "apply", "Apply", "Aplica", "Use the idea in a real situation. Write your reasoning, then compare it with a sample.", "Usa la idea en una situación real. Escribe tu razonamiento y compáralo con un ejemplo.")}
    ${apply(L)}
  </section>
  <section class="ms-stage" id="reflect" data-stage="reflect" aria-labelledby="h-reflect">
    ${stageHead(5, "reflect", "Reflect", "Reflexiona", "Answer on your own. Your first try counts as independent evidence; you can still revise.", "Responde por tu cuenta. Tu primer intento cuenta como evidencia independiente; todavía puedes revisar.")}
    <div id="ms-reflect"><p class="ms-muted">Loading…</p></div>
    <div id="ms-evidence" class="ms-evidence"></div>
  </section>
  <details class="ms-teacher">
    <summary>Teacher resources for lesson ${esc(L.id)}</summary>
    <ul>${L.resources.map((r) => `<li><a href="${esc(r.href)}">${esc(r.label)}</a></li>`).join("")}</ul>
  </details>
</main>
<script type="application/json" id="ms-data">${json(data)}</script>
<script type="module" src="/assets/math-studio/studio.mjs?v=${stamp}"></script>
</body>
</html>
`;
  return withCurriculumShell(html, "units");
}

export function finderPage(lessons, stamp) {
  const units = [...new Set(lessons.map((l) => l.unit))];
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Learning Lab (Practice HTML) | EduWonderLab</title>
<meta name="description" content="Learning Lab (Practice HTML): one connected place to explore, understand, practice, apply and reflect for every Grade 6 lesson.">
<link rel="icon" href="/assets/favicon.svg">
<link rel="canonical" href="https://eduwonderlab.com/math/studio/">
<link rel="stylesheet" href="/assets/math-studio/studio.css?v=${stamp}">
</head>
<body class="ms ms--finder">
<header class="ms-hero"><div class="ms-wrap"><p class="ms-eyebrow">Grade 6 mathematics</p><h1>Learning Lab <span class="ms-h1-sub">(Practice HTML)</span></h1><p class="ms-objective">Explore a model, understand the idea, practice at your level, apply it, and show what you know. One lesson, one place.</p></div></header>
<main id="ms-main" class="ms-wrap">
${units
  .map(
    (u) =>
      `<section class="ms-unit" aria-labelledby="u-${u}"><h2 id="u-${u}">Unit ${u}</h2><ul class="ms-cards">${lessons
        .filter((l) => l.unit === u)
        .map(
          (l) =>
            `<li><a class="ms-card" href="/math/studio/${esc(l.id)}/" data-ms-card="${esc(l.id)}"><span class="ms-card__id">${esc(l.id)}</span><strong>${esc(l.title)}</strong><span class="ms-muted">${esc(l.lab.title)}</span><span class="ms-card__status" data-ms-status></span></a></li>`,
        )
        .join("")}</ul></section>`,
  )
  .join("\n")}
</main>
<script type="module" src="/assets/math-studio/finder.mjs?v=${stamp}"></script>
</body>
</html>
`;
  return withCurriculumShell(html, "units");
}

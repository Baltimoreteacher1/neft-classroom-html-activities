// Markup for Math Studio: the lesson page (/math/studio/<id>/), the finder (/math/studio/), and the five-stage bar that
// the Practice and Challenge studios and the Learning Labs carry so they read as stages of one product.
import { buildVocabMatcher, isConceptEntry } from "../../engine/core/vocab-match.js";
import { withCurriculumShell } from "../../tools/lib/curriculum-shell.mjs";

export const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
/** English always; Spanish beside it, shown by the language switch. */
const bi = (en, es) =>
  `<span class="t-en">${esc(en)}</span>${es && es !== en ? `<span class="t-es" lang="es">${esc(es)}</span>` : ""}`;
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

/** A worked example the runtime reveals one step at a time; "Your turn" ends with the student's own answer. */
const steps = (s, turn = false) =>
  s
    ? `<article class="ms-worked" data-walk><h4>${esc(s.title)}</h4><ol>${s.lines.map((l, i) => `<li>${bi(l, s.linesEs?.[i])}</li>`).join("")}</ol><div class="ms-row ms-walk"><button type="button" class="ms-btn" data-walk-next>${bi("Show the next step", "Mostrar el siguiente paso")}</button><button type="button" class="ms-btn ms-btn--link" data-walk-all>${bi("Show all steps", "Mostrar todos los pasos")}</button></div>${turn ? `<label class="ms-label" for="ms-yourturn">${bi("My answer and what it means", "Mi respuesta y lo que significa")}</label><textarea id="ms-yourturn" rows="3"></textarea>` : ""}</article>`
    : "";

/** Key ideas are written as "Title. Formula: ... 1. ... 2. ..." — show the numbered points as a list when they are there. */
function keyIdea(text, textEs) {
  if (!text) return "";
  const parts = text.split(/\s(?=\d+\.\s)/);
  const head = parts.shift();
  return `<aside class="ms-keyidea" aria-label="Key idea"><h3>${bi("Key idea", "Idea clave")}</h3><p>${esc(head)}</p>${parts.length ? `<ol>${parts.map((p) => `<li>${esc(p.replace(/^\d+\.\s/, ""))}</li>`).join("")}</ol>` : ""}${textEs ? `<p class="t-es" lang="es">${esc(textEs)}</p>` : ""}</aside>`;
}

/** The Explore prompts: the lesson's own when it has its own model, else the lab's. */
const investigate = (L) => L.explore?.investigate || L.lab.investigate || [];

/** The first vocabulary entry is usually the lesson topic ("Display Data with Histograms"): Explore states it as the
 * idea, then lists the words. A one-word or lower-case first entry ("Integer", "vertex") is a word like the rest. */
function lessonWords(L) {
  const [first, ...rest] = L.understand.vocabulary || [];
  if (!first) return { topic: null, list: [] };
  const isTopic = /^[A-Z]/.test(first.term) && first.term.trim().split(/\s+/).length >= 2;
  return isTopic ? { topic: first, list: rest } : { topic: null, list: [first, ...rest] };
}

/** The word check in Understand: two "which word means…?" questions from the lesson's own words, three choices each. */
function wordQuiz(L) {
  const { list } = lessonWords(L);
  const words = list.filter((v) => v.definition);
  if (words.length < 3) return [];
  return words.slice(0, 2).map((v, i) => {
    const others = words.filter((w) => w !== v).slice(i, i + 2);
    const choices = [v, ...others];
    // Rotate so the right answer is not always first.
    const shift = (i + 1) % choices.length;
    const order = [...choices.slice(shift), ...choices.slice(0, shift)];
    return {
      id: `words-${i}`,
      kind: "mc",
      prompt: `Which word means: “${v.definition}”`,
      promptEs: v.definitionEs ? `¿Qué palabra significa: «${v.definitionEs}»?` : undefined,
      choices: order.map((w) => w.term),
      choicesEs: order.every((w) => w.termEs) ? order.map((w) => w.termEs) : undefined,
      correct: order.indexOf(v),
      hints: [
        "Look back at the word cards above.",
        `Find the card whose meaning talks about: ${v.definition.split(/[.;]/)[0].toLowerCase()}.`,
      ],
      explanation: `${v.term}: ${v.definition}`,
      explanationEs: v.termEs && v.definitionEs ? `${v.termEs}: ${v.definitionEs}` : undefined,
    };
  });
}

/**
 * The underlined-word pop-ups (the site's vocabulary pattern, as on the homework pages and graphic novels): the
 * lesson's own words, without concept statements, matched with the shared index from engine/core/vocab-match.js.
 * The page carries the words and the prebuilt pattern; assets/math-studio/vocab.mjs underlines and opens them.
 */
function vocabLinks(L) {
  const words = (L.understand.vocabulary || []).filter((v) => !isConceptEntry(v));
  const m = buildVocabMatcher(words);
  return m ? { words, regexSource: m.regexSource, lookup: m.lookup } : null;
}

/** Words to know, shown first: Explore gets the first four, Understand all of them. */
function wordCards(list, { flip = false } = {}) {
  const meaning = (v) =>
    `<p>${bi(v.definition, v.definitionEs)}</p>${v.example ? `<p class="ms-muted">${esc(v.example)}</p>` : ""}`;
  // Understand: each card is a button; the student says what the word means, then taps to open the word's card
  // (picture, English and Spanish), the same card the underlined words open.
  if (flip)
    return `<ul class="ms-words ms-words--flip">${list
      .map(
        (v, i) =>
          `<li><button type="button" class="ms-flip" data-word="${i}" aria-haspopup="dialog"><strong>${bi(v.term, v.termEs)}</strong><span class="ms-flip__hint">${bi("Tap to see the picture and meaning", "Toca para ver la imagen y el significado")}</span></button></li>`,
      )
      .join("")}</ul>`;
  return `<ul class="ms-words">${list
    .map(
      (v) =>
        `<li>${v.image ? `<img src="${esc(v.image)}" alt="" width="56" height="56" loading="lazy">` : ""}<div><strong>${bi(v.term, v.termEs)}</strong>${meaning(v)}</div></li>`,
    )
    .join("")}</ul>`;
}
/** The start of Explore: what the student will do, in three steps, and the words they need. The model loads only after
 * "Start exploring", so the first screen is short. */
function exploreStart(L) {
  const parts = L.explore?.kind === "expression-parts";
  const plan = parts
    ? [
        [
          "Meet the four parts of an expression, one at a time.",
          "Conoce las cuatro partes de una expresión, una a la vez.",
        ],
        ["Tap to name each part.", "Toca para nombrar cada parte."],
        ["Build your own expression and evaluate it.", "Construye tu propia expresión y evalúala."],
      ]
    : [
        ["Read the words below.", "Lee las palabras de abajo."],
        [
          "Open the model and change one number at a time.",
          "Abre el modelo y cambia un número a la vez.",
        ],
        [
          "Answer the questions beside the model, one at a time.",
          "Responde las preguntas junto al modelo, una a la vez.",
        ],
      ];
  const { topic, list } = parts ? { topic: null, list: [] } : lessonWords(L);
  return `<section class="ms-start" id="ms-gate" aria-labelledby="ms-start-h">
      <h3 id="ms-start-h">${bi("Start here", "Empieza aquí")}</h3>
      ${topic ? `<p class="ms-start__topic"><strong>${bi(topic.term, topic.termEs)}:</strong> ${bi(topic.definition, topic.definitionEs)}</p>` : ""}
      <ol class="ms-start__plan" data-gate-only>${plan.map(([en, es]) => `<li>${bi(en, es)}</li>`).join("")}</ol>
      ${list.length ? `<h4>${bi("Words to know", "Palabras clave")}</h4>${wordCards(list.slice(0, 4))}` : ""}
      <p data-gate-only><button type="button" class="ms-btn" id="ms-begin">${bi("Start exploring", "Empezar a explorar")}</button></p>
    </section>`;
}

/** A static, labelled picture of the lesson's own expression (a·v ± b) for Understand. */
function partsFigure(x) {
  const tok = (part, text) =>
    `<button type="button" class="ms-tok ms-tok--${part}" data-fig-part="${part}">${esc(text)}</button>`;
  const op = x.op === "-" ? "−" : "+";
  const term = (inner) =>
    `<span class="ms-term">${inner}<span class="ms-term__brace" aria-hidden="true"></span><span class="ms-term__label">${bi("term", "término")}</span></span>`;
  const vt = `${x.a === 1 ? "" : x.a}${x.variable}`;
  const item = (part, en, es) =>
    `<li class="ms-legend--${part}" data-fig-legend="${part}" hidden>${bi(en, es)}</li>`;
  return `<figure class="ms-partsfig" data-partsfig><figcaption><strong>${bi("Parts of an expression: tap each coloured part", "Partes de una expresión: toca cada parte de color")}</strong></figcaption><div class="ms-expr" role="group" aria-label="${esc(`${vt} ${op} ${x.b}`)}">${term(`${x.a === 1 ? "" : tok("coefficient", x.a)}${tok("variable", x.variable)}`)}<span class="ms-op" aria-hidden="true">${op}</span>${term(tok("constant", x.b))}</div><ul class="ms-legend" aria-live="polite">${item("coefficient", `Coefficient: ${x.a} — the number multiplied by the variable`, `Coeficiente: ${x.a} — el número que multiplica a la variable`)}${item("variable", `Variable: ${x.variable} — a letter for a number that can change`, `Variable: ${x.variable} — una letra para un número que puede cambiar`)}${item("constant", `Constant: ${x.b} — a number with no variable; it stays the same`, `Constante: ${x.b} — un número sin variable; no cambia`)}<li class="ms-legend--term" data-fig-legend="term" hidden>${bi(`Terms: 2 — the parts joined by + or −: ${vt} and ${x.b}`, `Términos: 2 — las partes unidas por + o −: ${vt} y ${x.b}`)}</li></ul></figure>`;
}

/**
 * Understand, built one step at a time from simple to harder: (the parts, 6-5) → words → a word check → the idea →
 * Watch me → Let's do one together → Your turn → an easier then a harder check question → the key idea.
 * Each step opens when the one before it is done (studio.mjs); the runtime fills the word check and the questions.
 */
function understand(L) {
  const u = L.understand;
  const list = u.vocabulary || [];
  const cont = (en = "Continue", es = "Continuar") =>
    `<p class="ms-ustep__next"><button type="button" class="ms-btn" data-ucontinue>${bi(en, es)}</button></p>`;
  const step = (key, en, es, body, next = cont()) => ({ key, en, es, body, next });
  const steps_ = [
    L.explore?.kind === "expression-parts" &&
      step(
        "parts",
        "The parts of an expression",
        "Las partes de una expresión",
        partsFigure(L.explore),
      ),
    list.length &&
      step(
        "words",
        "Words to know",
        "Palabras clave",
        `<p class="ms-muted">${bi("Say what each word means, then tap the card to check.", "Di qué significa cada palabra y luego toca la tarjeta para comprobar.")}</p>${wordCards(list, { flip: true })}<p class="ms-flip__score" aria-live="polite"></p>`,
      ),
    wordQuiz(L).length &&
      step(
        "wordcheck",
        "Check the words",
        "Comprueba las palabras",
        `<div data-ucheck="words"></div>`,
        cont(),
      ),
    step(
      "idea",
      u.heading || "The big idea",
      u.headingEs || "La idea principal",
      `${u.intro ? `<p class="ms-lead">${bi(u.intro, u.introEs)}</p>` : ""}${u.picture ? `<figure class="ms-picture"><img src="${esc(u.picture.src)}" alt="${esc(u.picture.alt || "")}" loading="lazy"><figcaption>${bi(u.picture.context || "", u.picture.contextEs)}</figcaption></figure>` : ""}`,
    ),
    u.iDo && step("ido", "Watch me", "Mírame", steps(u.iDo)),
    u.weDo &&
      step(
        "wedo",
        "Let’s do one together",
        "Hagamos uno juntos",
        `<p class="ms-muted">${bi("Before each step, say what you think comes next. Then show it.", "Antes de cada paso, di qué crees que sigue. Luego muéstralo.")}</p>${steps(u.weDo)}`,
      ),
    u.youDo && step("youdo", "Your turn", "Tu turno", steps(u.youDo, true)),
    L.practice.regular.length &&
      step(
        "check1",
        "Check yourself: a first question",
        "Compruébalo: una primera pregunta",
        `<div data-ucheck="0"></div>`,
      ),
    L.practice.regular.length > 1 &&
      step(
        "check2",
        "Check yourself: a harder question",
        "Compruébalo: una pregunta más difícil",
        `<div data-ucheck="1"></div>`,
      ),
    step(
      "summary",
      "Put it together",
      "Júntalo todo",
      `${keyIdea(u.keyIdea, u.keyIdeaEs)}${u.mistake ? `<details class="ms-support"><summary>${bi("Watch out for a common mistake", "Cuidado con un error común")}</summary><p>${esc(u.mistake)}</p></details>` : ""}${u.frame ? `<details class="ms-support"><summary>${bi("Sentence frame", "Marco de oración")}</summary><p class="ms-frame">${bi(u.frame, u.frameEs)}</p></details>` : ""}`,
      `<p class="ms-row"><button type="button" class="ms-btn" data-goto="practice">${bi("Go to Practice", "Ir a Practica")}</button><button type="button" class="ms-btn ms-btn--quiet" data-goto="explore">${bi("See it in the model", "Míralo en el modelo")}</button></p>`,
    ),
  ].filter(Boolean);
  return `<div class="ms-understand">
    <div class="ms-uprogress"><span class="ms-uprogress__text" aria-live="polite"></span><span class="ms-uprogress__bar" aria-hidden="true"><span></span></span></div>
    ${steps_
      .map(
        (st, i) =>
          `<section class="ms-ustep" data-ustep="${i}" data-ukey="${st.key}"${i ? " hidden" : ""} aria-labelledby="ms-u-${st.key}"><h3 id="ms-u-${st.key}" tabindex="-1"><span class="ms-ustep__n" aria-hidden="true">${i + 1}</span><span class="sr-only">${bi(`Step ${i + 1} of ${steps_.length}:`, `Paso ${i + 1} de ${steps_.length}:`)} </span>${bi(st.en, st.es)}</h3>${st.body}${st.next}</section>`,
      )
      .join("")}
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
  if (a.reasoning)
    parts.push(
      task(
        "reasoning",
        "Reasoning challenge",
        "Reto de razonamiento",
        `<p>${bi(a.reasoning.prompt, a.reasoning.promptEs)}</p>`,
      ),
    );
  // Simple to harder: a word problem, a real situation, a reasoning challenge, then an open Create task.
  parts.push(task("create", `Create: ${L.lab.title}`, "Crea", `<p>${esc(L.lab.create)}</p>`));
  const optional = a.optional?.length
    ? `<aside class="ms-optional"><h3>${bi("Optional: projects and stories", "Opcional: proyectos e historias")}</h3><p class="ms-muted">${bi("For extra exploration. These do not count as evidence of mastery.", "Para explorar más. No cuentan como evidencia de dominio.")}</p><ul>${a.optional.map((o) => `<li><a href="${esc(o.href)}">${esc(o.label)}</a></li>`).join("")}</ul></aside>`
    : "";
  return `<div class="ms-apply">${parts.join("")}</div>${optional}`;
}

const stageHead = (i, key, en, es, lead, leadEs) =>
  `<header class="ms-stagehead"><p class="ms-eyebrow">${bi(`Stage ${i} of 5`, `Etapa ${i} de 5`)}</p><h2 id="h-${key}" tabindex="-1">${bi(en, es)}</h2><p>${bi(lead, leadEs)}</p></header>`;

export function lessonPage(L, stamp) {
  const css = `/assets/math-studio/studio.css?v=${stamp}`;

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
    <div class="ms-hero__row">
      <div>
        <p class="ms-eyebrow">Learning Lab (Practice HTML) · Unit ${esc(L.unit)} · Lesson ${esc(L.id)}${L.standard ? ` · ${esc(L.standard)}` : ""}</p>
        <h1>${esc(L.title)}</h1>
        ${L.objective ? `<p class="ms-objective">${esc(L.objective)}</p>` : ""}
      </div>
      <div class="ms-hero__tools">
        <button type="button" class="ms-btn ms-btn--quiet" id="ms-lang" aria-pressed="false">Español</button>
        <p class="ms-saved" id="ms-saved" role="status">${bi("Your work saves on this device.", "Tu trabajo se guarda en este dispositivo.")}</p>
      </div>
    </div>
    <div class="ms-entry">
      <a class="ms-btn" href="#explore" data-goto="explore" id="ms-start">${bi("Start the Learning Lab", "Empezar el Learning Lab")}</a>
      <span class="ms-entry__or">${bi("or go straight to practice:", "o ve directo a practicar:")}</span>
      <a class="ms-btn ms-btn--quiet" href="#practice" data-goto="practice" data-level="regular">${bi("Regular", "")}</a>
      <a class="ms-btn ms-btn--quiet" href="#practice" data-goto="practice" data-level="challenge">${bi("Challenge", "Reto")}</a>
    </div>
  </div>
</header>
${stageBar(L.id, "explore", { inPage: true, label: `Lesson ${L.id}` })}
<main id="ms-main" class="ms-wrap">
  <div class="ms-resume" id="ms-resume" hidden></div>
  <section class="ms-stage" id="explore" data-stage="explore" aria-labelledby="h-explore">
    ${L.explore ? stageHead(1, "explore", "Explore", "Explora", L.explore.title, L.explore.titleEs || "") : stageHead(1, "explore", "Explore", "Explora", L.lab.title, "")}
    <div class="ms-handoff" id="ms-handoff" hidden></div>
    ${exploreStart(L)}
    <div class="ms-explore" id="ms-explore-body" hidden>
      <div class="ms-explore__model"><div id="ms-model" class="ms-model"><p class="ms-muted">Loading the model…</p></div><p class="ms-guide" id="ms-guide"></p></div>
      <div class="ms-explore__side">
        <h3 class="ms-label">${bi("1. Try this", "1. Prueba esto")}</h3>
        <div class="ms-try" id="ms-try">
          <ol class="ms-investigate">${investigate(L)
            .map((q, i) => `<li${i ? " hidden" : ""}>${esc(q)}</li>`)
            .join("")}</ol>
          ${investigate(L).length > 1 ? `<div class="ms-try__nav"><button type="button" class="ms-btn ms-btn--quiet" data-try="-1">${bi("Back", "Atrás")}</button><span class="ms-try__count" aria-live="polite"></span><button type="button" class="ms-btn" data-try="1">${bi("Next question", "Siguiente pregunta")}</button></div>` : ""}
        </div>
        <label class="ms-label" for="ms-notes">${bi("2. What I noticed", "2. Lo que noté")}</label>
        <textarea id="ms-notes" rows="3"></textarea>
        <div class="ms-test" id="ms-test"><h3>${bi("3. Check yourself", "3. Compruébalo")}</h3><p class="ms-muted">${bi("Answer a question about your model, then one new problem without it.", "Responde una pregunta sobre tu modelo y luego un problema nuevo sin él.")}</p><button type="button" class="ms-btn" id="ms-make-question">${bi("Make a question from my model", "Crear una pregunta con mi modelo")}</button><div id="ms-test-out"></div></div>
      </div>
    </div>
    ${L.explore ? "" : `<p class="ms-more" data-after-gate hidden><a href="${esc(L.lab.href)}">${bi(`Open the full ${L.lab.title} lab`, `Abrir el laboratorio completo: ${L.lab.title}`)}</a>${L.lab.lessons.length > 1 ? ` <span class="ms-muted">(shared by lessons ${L.lab.lessons.map(esc).join(" and ")})</span>` : ""}</p>`}
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
      <div class="ms-row"><a class="ms-btn ms-btn--quiet" href="${esc(L.practice.urls.regular)}">${bi("Open Regular Practice Studio", "Abrir el estudio de práctica Regular")}</a><a class="ms-btn ms-btn--quiet" href="${esc(L.practice.urls.challenge)}">${bi("Open Challenge Practice Studio", "Abrir el estudio de práctica de Reto")}</a></div>
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
</main>
<script type="application/json" id="ms-data">${json({ ...L, understand: { ...L.understand, wordQuiz: wordQuiz(L) }, vocabLinks: vocabLinks(L) })}</script>
<script type="module" src="/assets/math-studio/studio.mjs?v=${stamp}"></script>
</body>
</html>
`;
  return withCurriculumShell(html, "units", { nav: false });
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

// Shared building blocks for the Speaking Studio, Writing Studio, Missions and Error Detective.
// feedbackHTML() is also used by the activity shell (views/activity.js) and downloadText() by Passport,
// so their names, signatures and class hooks stay stable.
import { CRITERIA, DISCLAIMER, PRACTICE_BANDS } from "./lang/rubrics.js";
import { bridgesFor, partLabel, wordParts } from "./lang/scaffolds.js";
import { makeI18n } from "./i18n.js";
import { esc, html, icon, raw } from "./util.js";

// Interface language for the shared builders. The lead calls setStudioI18n(i18n) from main.js before every
// render; builders with an options object (or a trailing parameter) also accept `i18n` to override it.
let I = makeI18n("en");
export const setStudioI18n = (i18n) => {
  I = i18n || makeI18n("en");
};

const IGN = raw("data-nsr-ignore");

/** The learner's own text with evidence spans marked. Spans: [{start,end}] over `text`. */
export function highlightHTML(text, spans = [], cls = "hl") {
  const ok = spans
    .filter((s) => s.end > s.start && s.start >= 0 && s.end <= text.length)
    .sort((a, b) => a.start - b.start);
  let out = "";
  let at = 0;
  for (const s of ok) {
    if (s.start < at) continue;
    out +=
      esc(text.slice(at, s.start)) +
      `<mark class="${cls}">${esc(text.slice(s.start, s.end))}</mark>`;
    at = s.end;
  }
  return raw(out + esc(text.slice(at)));
}

// ── disclosures that remember whether the learner opened them across re-renders ──────────────
const touched = new Map(); // id → open?
/** A <details> that stays open or closed across re-renders once the learner has toggled it. */
export function disclosure(id, summary, body, { open = false, cls = "", attrs = "" } = {}) {
  const isOpen = touched.has(id) ? touched.get(id) : open;
  return html`<details
    class="studio-disc ${cls}"
    data-d="${id}"
    ${attrs ? raw(attrs) : ""}
    ${isOpen ? raw("open") : ""}
  >
    <summary>${summary}</summary>
    <div class="disc-body">${body}</div>
  </details>`;
}
export function trackDisclosures(root) {
  for (const d of root.querySelectorAll("details[data-d]"))
    d.addEventListener("toggle", () => touched.set(d.dataset.d, d.open));
}

// ── help setting (stage) ─────────────────────────────────────────────────────────────────────
export const STAGES = [
  {
    id: "guided",
    label: "With frames and words",
    help: "Sentence frames, a word bank and a model are open.",
    ico: "bulb",
  },
  {
    id: "supported",
    label: "With a word bank",
    help: "Only the word bank is available.",
    ico: "words",
  },
  {
    id: "independent",
    label: "On my own",
    help: "No supports. Feedback comes after you finish.",
    ico: "user",
  },
];
const STAGE_ES = {
  guided: {
    label: "Con marcos y palabras",
    help: "Los marcos de oraciones, el banco de palabras y un modelo están abiertos.",
  },
  supported: { label: "Con banco de palabras", help: "Solo está disponible el banco de palabras." },
  independent: {
    label: "Por mi cuenta",
    help: "Sin apoyos. Los comentarios llegan cuando termines.",
  },
};
/** Name of a help setting as markup-safe text. */
export const stageName = (stage, i18n = I) =>
  stage === "guided"
    ? i18n.T("frames and words", "marcos y palabras")
    : stage === "supported"
      ? i18n.T("word bank", "banco de palabras")
      : i18n.T("on my own", "por mi cuenta");

export function stagePickerHTML(stage, suggestion, name = "stage", i18n = I) {
  const { T } = i18n;
  return html`<fieldset class="stage-picker">
    <legend>${T("How much help do you want?", "¿Cuánta ayuda quieres?")}</legend>
    <div class="stage-options">
      ${STAGES.map((s) => html`<label class="stage-opt ${stage === s.id ? "is-on" : ""}"><input type="radio" name="${name}" value="${s.id}" data-stage ${stage === s.id ? raw("checked") : ""} ${IGN} /><span class="stage-ico">${icon(s.ico)}</span><strong>${T(s.label, STAGE_ES[s.id].label)}</strong><span class="stage-help">${T(s.help, STAGE_ES[s.id].help)}</span></label>`)}
    </div>
    ${
      suggestion
        ? html`<p class="fine stage-why">
            ${icon("info")}<span
              >${T("Suggested:", "Sugerido:")} <strong>${(() => {
                const st = STAGES.find((x) => x.id === suggestion.stage);
                return st ? T(st.label, STAGE_ES[st.id].label) : "";
              })()}</strong> —
              ${suggestion.reason}</span
            >
          </p>`
        : ""
    }
    <p class="fine">
      ${T('Working "on my own" shows what you can do independently. Your teacher sees which kind of help you used.', "Trabajar «por mi cuenta» muestra lo que puedes hacer sin ayuda. Tu docente ve qué tipo de ayuda usaste.")}
    </p>
  </fieldset>`;
}

/** Shown once an attempt has started: the help setting is fixed for the attempt. */
export function stageLockedHTML(stage, newLabel, i18n = I) {
  return html`<p class="stage-locked">
    ${icon("lock")}<span>${i18n.T("Help setting for this attempt:", "Ayuda para este intento:")} <strong>${stageName(stage, i18n)}</strong>.</span
    ><button type="button" class="ghost small" data-new-attempt>${newLabel ?? i18n.T("Start a new attempt", "Empezar un intento nuevo")}</button>
  </p>`;
}

/** Names the kind of practice so unofficial work is never mistaken for assessment. */
export function purposeBadgeHTML(stage, i18n = I) {
  const { T } = i18n;
  return stage === "independent"
    ? html`<p class="purpose-badge is-independent">
        <span class="mode-pill">${icon("user")} ${T("Independent practice", "Práctica independiente")}</span>
        <span class="fine"
          >${T("No supports open. Feedback comes after you submit. Classroom practice — not an ACCESS score.", "Sin apoyos abiertos. Los comentarios llegan después de que envíes. Práctica de clase, no un puntaje de ACCESS.")}</span
        >
      </p>`
    : html`<p class="purpose-badge">
        <span class="mode-pill">${icon("bulb")} ${T("Instructional practice", "Práctica guiada")}</span>
        <span class="fine"
          >${T("Supports are open and recorded as supports. Classroom practice — not an ACCESS score.", "Los apoyos están abiertos y se anotan como apoyos. Práctica de clase, no un puntaje de ACCESS.")}</span
        >
      </p>`;
}

/** Numbered progress rail. steps: [{label, done}], current is the first step not done (or `current`). */
export function stepperHTML(
  steps,
  { label, current = steps.findIndex((s) => !s.done), i18n = I } = {},
) {
  return html`<ol class="studio-steps" aria-label="${label ?? i18n.S("Steps", "Pasos")}">
    ${steps.map((s, i) => html`<li class="${i === current ? "is-current" : s.done ? "is-done" : ""}" ${i === current ? raw('aria-current="step"') : ""}><span class="step-n">${s.done && i !== current ? icon("check") : i + 1}</span><span class="step-l">${s.label}${s.done && i !== current ? html`<span class="visually-hidden"> ${i18n.T("(done)", "(hecho)")}</span>` : ""}</span></li>`)}
  </ol>`;
}

// ── feedback ─────────────────────────────────────────────────────────────────────────────────
/** Strengths + next moves from analyzeResponse(), with the learner's own words highlighted. */
export function feedbackHTML(analysis, text, { patternHref = null, i18n = I } = {}) {
  const { T, S } = i18n;
  const spansFor = (list) =>
    list.flatMap((s) => (s.spans || []).filter((x) => typeof x.start === "number"));
  return html`<div class="coach-card panel" role="status">
    <div class="coach-head">
      <span class="coach-ico">${icon("sparkle")}</span>
      <div>
        <h3>${T(`What your ${analysis.words}-word response shows`, `Lo que muestra tu respuesta de ${analysis.words} palabras`)}</h3>
        <p class="fine">${T("Language Coach notes from the words on the page, made on this device.", "Notas del Language Coach sobre las palabras de la página, hechas en este dispositivo.")}</p>
      </div>
    </div>
    <div class="coach-block is-strengths">
      <h4>${icon("check")} ${T("What is working", "Lo que va bien")}</h4>
      ${
        analysis.strengths.length
          ? html`<ul class="coach-strengths">
              ${analysis.strengths.map((s) => html`<li><span class="dim-chip">${s.dimension}</span> ${s.text}</li>`)}
            </ul>`
          : html`<p>${T("Write a little more and we can show you what you are doing well.", "Escribe un poco más y te mostraremos lo que haces bien.")}</p>`
      }
      ${text ? html`<p class="evidence-text" aria-label="${S("Your response with evidence marked", "Tu respuesta con la evidencia marcada")}">${highlightHTML(text, spansFor(analysis.strengths))}</p>` : ""}
    </div>
    <div class="coach-block">
      <h4>${icon("flag")} ${T("Your next moves", "Tus próximos pasos")}</h4>
      ${
        analysis.nextMoves.length
          ? html`<ol class="coach-moves">
              ${analysis.nextMoves.map(
                (m) =>
                  html`<li>
                    <p class="move-title">
                      <span class="dim-chip">${m.dimension}</span> <strong>${m.title}</strong>
                    </p>
                    <p class="fine">${m.why}</p>
                    <p class="move-ask">${m.ask}</p>
                    ${m.frame ? html`<p class="frame">${T("Try:", "Prueba:")} <em>${m.frame}</em></p>` : ""}${m.suggestions?.length ? html`<p class="fine">${T("Maybe:", "Quizás:")} ${m.suggestions.join(", ")}</p>` : ""}${m.patternId && patternHref ? html`<a class="btn small" href="${patternHref(m.patternId)}">${T("Practice this pattern", "Practicar este patrón")}${icon("arrow-right")}</a>` : ""}
                  </li>`,
              )}
            </ol>`
          : html`<p>
              ${T("Nothing stands out as a next move. Reread your response aloud and keep the best parts.", "Nada destaca como próximo paso. Vuelve a leer tu respuesta en voz alta y conserva las mejores partes.")}
            </p>`
      }
    </div>
    <p class="fine coach-note">
      ${T("These notes describe what is on the page. They do not judge whether your ideas are correct, and they are not a score.", "Estas notas describen lo que hay en la página. No juzgan si tus ideas son correctas y no son un puntaje.")}
    </p>
  </div>`;
}

const BAND_ES = { early: "Inicial", building: "En desarrollo", strong: "Sólido" };
const DISCLAIMER_ES =
  "Las bandas de práctica te ayudan a ver tu próximo paso. No son niveles de dominio de WIDA ni puntajes de ACCESS. Los exámenes oficiales de ACCESS de Hablar y Escribir los califican evaluadores capacitados con las rúbricas actuales de WIDA.";
const ORGANIZE_Q = "¿Qué tan bien organicé, conecté y desarrollé mis ideas?";
const WORDS_Q = "¿Qué tan precisas fueron mis palabras para este tema?";
// Spanish for the practice-rubric descriptors in lang/rubrics.js, keyed by criterion id (ids are stable).
const RUBRIC_ES = {
  lc: {
    name: "Organizar y desarrollar ideas",
    question: { speaking: ORGANIZE_Q, writing: ORGANIZE_Q },
    student: {
      early: "Usé palabras, frases u oraciones cortas. Mis ideas están casi todas separadas.",
      building:
        "Conecté algunas ideas con palabras como y, pero, porque, luego. Di algunos detalles.",
      strong:
        "Mis ideas están en un orden claro. Usé oraciones variadas y palabras que las unen, y desarrollé mis ideas con detalles o evidencia.",
    },
    lookFor: [
      "Orden y enfoque en toda la respuesta",
      "Variedad de oraciones (simples, compuestas, complejas)",
      "Palabras de enlace con distintas funciones (causa, contraste, secuencia)",
      "Desarrollo: detalle, ejemplo o evidencia para cada idea principal",
    ],
  },
  vu: {
    name: "Elegir palabras precisas",
    question: { speaking: WORDS_Q, writing: WORDS_Q },
    student: {
      early: "Usé palabras de todos los días y algunas palabras de la tarea.",
      building:
        "Usé algunas palabras del tema y traté de usar palabras más exactas que las de todos los días.",
      strong:
        "Usé palabras y frases precisas del tema, incluso palabras de la fuente, y las elegí para que encajaran con lo que quería decir.",
    },
    lookFor: [
      "Palabras del tema (nivel 3) y académicas generales (nivel 2) usadas con exactitud",
      "Precisión: palabras específicas en lugar de cosa, algo, bueno o malo",
      "Formas de palabras (sustantivo, verbo, adjetivo) y partes de palabras",
      "Frases y combinaciones que suenan naturales para el tema",
    ],
  },
  lctl: {
    name: "Construir oraciones claras",
    question: {
      speaking: "¿Qué tan claro fue mi inglés para quien me escuchó?",
      writing: "¿Qué tan clara fue mi escritura para quien la leyó?",
    },
    student: {
      early:
        "Quien escucha o lee puede entender mi idea principal, pero a veces los errores dificultan seguirla.",
      building:
        "Casi todo lo que escribí o dije es claro. Todavía se me escapan algunos patrones (por ejemplo, las terminaciones de los verbos o las palabras pequeñas).",
      strong:
        "Mi lenguaje es claro casi siempre. Hay pocos errores y no estorban mi significado.",
    },
    lookFor: [
      "Si los errores afectan el significado o solo el pulido",
      "Patrones que se repiten (formas verbales, plurales, artículos, preposiciones)",
      "Límites de oraciones y puntuación (al escribir) o fluidez y autocorrección (al hablar)",
      "Control cuando la oración es más compleja, no solo cuando es simple",
    ],
  },
};

/** Self-review (student) or conference review (teacher) against the three practice criteria. */
export function rubricHTML(
  review,
  { who = "student", modality = "writing", prefix = "rub", i18n = I } = {},
) {
  const { T, S } = i18n;
  return html`<fieldset class="rubric">
    <legend>${who === "teacher" ? T("Teacher review", "Revisión docente") : T("Review my work", "Revisar mi trabajo")}</legend>
    <p class="fine rubric-disclaimer">${icon("info")}<span>${T(DISCLAIMER, DISCLAIMER_ES)}</span></p>
    ${CRITERIA.map(
      (c) =>
        html`<div class="rubric-row">
          <h4>${T(c.name, RUBRIC_ES[c.id]?.name)} <span class="dim-chip">${c.dimension}</span></h4>
          <p class="fine">${T(c.question[modality], RUBRIC_ES[c.id]?.question[modality])}</p>
          <div class="rubric-options" role="radiogroup" aria-label="${S(c.name, RUBRIC_ES[c.id]?.name)}">
            ${PRACTICE_BANDS.map((b) => html`<label class="rubric-opt ${review?.[c.id] === b.id ? "is-on" : ""}"><input type="radio" name="${prefix}-${c.id}" value="${b.id}" data-rubric="${c.id}" ${review?.[c.id] === b.id ? raw("checked") : ""} ${IGN} /><strong>${T(b.label, BAND_ES[b.id])}</strong><span>${T(c.student[b.id], RUBRIC_ES[c.id]?.student[b.id])}</span></label>`)}
          </div>
          ${
            who === "teacher"
              ? html`<details class="fine">
                  <summary>${T("Look for", "Qué observar")}</summary>
                  <ul>
                    ${c.teacher.lookFor.map((x, n) => html`<li>${T(x, RUBRIC_ES[c.id]?.lookFor[n])}</li>`)}
                  </ul>
                </details>`
              : ""
          }
        </div>`,
    )}
    <label class="field"
      ><span>${who === "teacher" ? T("Comment for the student", "Comentario para el estudiante") : T("One thing I will do next", "Algo que haré después")}</span
      ><textarea rows="2" data-rubric-note ${IGN}>${review?.note || ""}</textarea>
    </label>
  </fieldset>`;
}

export const dimChip = (d) => html`<span class="dim-chip">${d}</span>`;

// ── supports ─────────────────────────────────────────────────────────────────────────────────
export function vocabListHTML(vocab = []) {
  return vocab.length
    ? html`<ul class="vocab-list">
        ${vocab.map((v) => html`<li><strong>${v.term}</strong><span class="vocab-def">${v.def}</span><span class="vocab-es" lang="es">${v.es}</span></li>`)}
      </ul>`
    : "";
}

/** Home-language and word-part bridges for a task's words. Shown only with supports. */
export function bridgeContent(task, i18n = I) {
  const { T } = i18n;
  const words = [
    ...(task.stages?.supported?.bank || []),
    ...(task.vocab || []).map((v) => v.term),
    ...(task.sourceTerms || []),
  ];
  const { cognates, warnings } = bridgesFor([words.join(" "), task.prompt || ""]);
  const parts = wordParts(words);
  if (!cognates.length && !warnings.length && !parts.length) return null;
  return html`${
    cognates.length
      ? html`<h4>${T("Words that look alike in Spanish", "Palabras que se parecen en español")}</h4>
          <ul class="bridge-list">
            ${cognates.map((c) => html`<li><strong>${c.en}</strong> ↔ <span lang="es">${c.es}</span><span class="fine">${c.note}</span></li>`)}
          </ul>`
      : ""
  }
  ${
    warnings.length
      ? html`<h4>${T("Careful — false friends", "Cuidado: falsos amigos")}</h4>
          <ul class="bridge-list">
            ${warnings.map((f) => html`<li><strong>${f.en}</strong> ≠ <span lang="es">${f.esFalse}</span><span class="fine">${f.warning}</span></li>`)}
          </ul>`
      : ""
  }
  ${
    parts.length
      ? html`<h4>${T("Word parts", "Partes de palabras")}</h4>
          <ul class="bridge-list">
            ${parts.map((w) => html`<li><strong>${w.word}</strong> = ${w.parts.map(partLabel).join(" + ")}</li>`)}
          </ul>`
      : ""
  }`;
}
export function bridgesHTML(task, i18n = I) {
  const body = bridgeContent(task, i18n);
  return body
    ? disclosure("bridges", html`${icon("language")} ${i18n.T("Word bridges (Spanish and word parts)", "Puentes de palabras (español y partes de palabras)")}`, body, {
        cls: "word-bridges",
      })
    : "";
}

/**
 * All the supports for a task in one calm panel: frames and words open, the rest tucked away.
 * Never called for "on my own"; the callers render nothing at all in that case.
 */
export function supportsPanelHTML(
  task,
  stage,
  { modelBody = "", modelId = "model", title, i18n = I } = {},
) {
  const { T, S } = i18n;
  const g = task.stages.guided;
  const heading = title ?? T("Supports", "Apoyos");
  return html`<section class="panel supports-panel" aria-label="${title ?? S("Supports", "Apoyos")}">
    <h3>${icon("bulb")} ${heading}</h3>
    ${
      stage === "guided"
        ? disclosure(
            "frames",
            T("Sentence frames", "Marcos de oraciones"),
            html`<ul class="frames inline">
              ${g.frames.map((f) => html`<li>${f}</li>`)}
            </ul>`,
            { open: true },
          )
        : ""
    }
    ${disclosure(
      "bank",
      T("Word bank", "Banco de palabras"),
      html`<ul class="wordbank">
        ${task.stages.supported.bank.map((w) => html`<li>${w}</li>`)}
      </ul>`,
      { open: true },
    )}
    ${task.vocab?.length ? disclosure("vocab", html`${icon("language")} ${T("Word meanings and Spanish", "Significados y español")}`, vocabListHTML(task.vocab)) : ""}
    ${bridgesHTML(task, i18n)}
    ${
      stage === "guided"
        ? html`<details class="studio-disc" data-model data-d="${modelId}">
            <summary>${icon("star")} ${modelBody.summary}</summary>
            <div class="disc-body">
              <p class="fine">${T("Opening the model is saved as extra support.", "Abrir el modelo se guarda como apoyo extra.")}</p>
              ${modelBody.body}
            </div>
          </details>`
        : ""
    }
  </section>`;
}

// ── sources, charts, tables ──────────────────────────────────────────────────────────────────
export function chartHTML(chart) {
  const max = Math.max(...chart.data.map((d) => d.value), 1);
  return html`<figure class="mini-chart">
    <figcaption>${chart.title}</figcaption>
    ${chart.data.map(
      (d) =>
        html`<div class="bar-row">
          <span class="bar-label">${d.label}</span
          ><span
            class="bar"
            aria-hidden="true"
            style="width:${d.value ? Math.max(4, (d.value / max) * 100) : 0}%"
          ></span
          ><span class="bar-val"
            >${d.value}<span class="visually-hidden"> ${chart.unit || ""}</span
            >${chart.kind === "pictograph" && chart.icon ? html` ${chart.icon}` : ""}</span
          >
        </div>`,
    )}
  </figure>`;
}
export function tableHTML(t) {
  return html`<div class="lab-table-wrap" tabindex="0" role="region" aria-label="${t.caption}">
    <table class="data-table">
      <caption>
        ${t.caption}
      </caption>
      <thead>
        <tr>
          ${t.headers.map((h) => html`<th scope="col">${h}</th>`)}
        </tr>
      </thead>
      <tbody>
        ${t.rows.map(
          (r) =>
            html`<tr>
              ${r.map((c, i) => (i === 0 ? html`<th scope="row">${c}</th>` : html`<td>${c}</td>`))}
            </tr>`,
        )}
      </tbody>
    </table>
  </div>`;
}

const SRC_ICON = {
  chart: "growth",
  table: "list",
  passage: "reading",
  text: "reading",
  audio: "listening",
};
/** A source (passage / table / chart) shown to the learner. Audio is played, not printed. */
export function sourceHTML(src, { id = "", i18n = I } = {}) {
  const head = html`<h3 class="source-title">
    ${icon(SRC_ICON[src.kind] || "reading")} ${src.title}
  </h3>`;
  if (src.kind === "chart")
    return html`<section class="source">${head}${chartHTML(src.chart)}</section>`;
  if (src.kind === "table")
    return html`<section class="source">${head}${tableHTML(src.table)}</section>`;
  if (src.kind === "passage" || src.kind === "text")
    return html`<section class="source">
      ${head}
      <div class="source-text">${(src.text || []).map((p) => html`<p>${p}</p>`)}</div>
    </section>`;
  if (src.kind === "audio")
    return html`<section class="source">
      ${head}
      <div class="listen-player">
        <button type="button" class="listen-btn" data-play-source="${id}">
          <span class="listen-icon" aria-hidden="true">${icon("play")}</span
          ><span class="listen-label">${i18n.T("Listen", "Escuchar")}</span></button
        ><button type="button" class="ghost" data-stop-audio>${icon("stop")} ${i18n.T("Stop", "Detener")}</button>
      </div>
    </section>`;
  return "";
}

// ── chooser pages (Speaking and Writing task lists) ─────────────────────────────────────────

/** Hero shared by the Speaking, Writing, Missions and Detective landing pages (room.css .room-hero). */
export function chooserHeroHTML({ domain = "", eyebrow, title, lead, art, loop = [], cta = "", artAlt = "", i18n = I }) {
  return html`<section class="room-hero studio-hero ${domain}">
    <div class="room-hero-copy">
      <p class="eyebrow">${eyebrow}</p>
      <h1 tabindex="-1">${title}</h1>
      <p class="lead">${lead}</p>
      ${loop.length ? html`<ol class="studio-loop" aria-label="${i18n.S("How a task works", "Cómo funciona una tarea")}">${loop.map((l, i) => html`<li><span class="step-n">${i + 1}</span>${l}</li>`)}</ol>` : ""}
      ${cta}
    </div>
    <div class="room-hero-art"><img src="${art}" width="480" height="360" alt="${artAlt}" decoding="async" /></div>
  </section>`;
}

const helpLevels = ({ T }) => [T("Frames", "Marcos"), T("Word bank", "Banco de palabras"), T("On my own", "Por mi cuenta")];
/** One task as a card: domain tile, type, one-sentence description, key language use and the help settings offered. */
export function taskCardHTML({ href, title, ico, kind, time, desc = "", meta = [], why = "", i18n = I }) {
  return html`<a class="card task-card" href="${href}">
    <span class="task-top"><span class="task-ico">${icon(ico)}</span><span class="task-kind">${kind}</span><span class="task-time">${icon("clock")} ${time}</span></span>
    <strong class="task-title">${title}</strong>
    ${desc ? html`<span class="task-desc">${desc}</span>` : ""}
    ${why ? html`<span class="task-why">${icon("sparkle")}<span>${why}</span></span>` : ""}
    <span class="task-foot"><span class="task-meta">${meta.map((m) => html`<span class="tag">${m}</span>`)}</span>
    <span class="task-levels"><span class="visually-hidden">${i18n.T("Help settings:", "Opciones de ayuda:")} </span>${helpLevels(i18n).map((l) => html`<span>${l}</span>`)}</span></span>
  </a>`;
}

/** In-page jump links for a long chooser. */
export const jumpNavHTML = (items, label) => html`<nav class="studio-jump no-print" aria-label="${label}">${items.map(([id, text]) => html`<a class="chip" href="#${id}">${text}</a>`)}</nav>`;

export function downloadText(name, text, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

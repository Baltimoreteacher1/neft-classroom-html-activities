// The markup of the feedback loop panel (Language Intelligence Engine). ui.js decides the stage and handles events;
// this file only draws. Rules it keeps: strength first and ONE next step; the learner's own words are shown with the
// quoted evidence marked inside them; response, revision and new task are always shown apart with how each was done
// (on my own / with supports / after feedback); no score, level, timer or percent; English and Spanish.
import { BASE, esc, html, raw } from "../util.js";
import { compareWork } from "./engine.js";
import { effectiveFeedback } from "./review.js";

const STEPS = [
  ["practice", ["Feedback", "Comentarios"]],
  ["revision", ["Revise", "Revisar"]],
  ["transfer", ["New task", "Tarea nueva"]],
  ["review", ["Share", "Compartir"]],
];
const ORDER = ["response", "feedback", "practice", "revision", "transfer", "review", "done"];
const act = (name, loop, extra = "") =>
  raw(`data-intel="${name}" data-intel-loop="${esc(loop.id)}"${extra}`);
const usedAny = (s) => Object.values(s || {}).some(Boolean);

/** The learner's text with each quote marked where it first occurs (later, overlapping quotes are left plain). */
export function markedText(text, marks) {
  const src = String(text || "");
  const spans = [];
  for (const m of marks) {
    const at = m.quote ? src.indexOf(m.quote) : -1;
    if (at >= 0) spans.push({ start: at, end: at + m.quote.length, ...m });
  }
  spans.sort((a, b) => a.start - b.start || b.end - a.end);
  let out = "";
  let at = 0;
  for (const s of spans) {
    if (s.start < at) continue;
    out += `${esc(src.slice(at, s.start))}<mark class="intel-mark ${s.cls}"><span class="intel-sr">${esc(s.label)}: </span>${esc(src.slice(s.start, s.end))}</mark>`;
    at = s.end;
  }
  return raw(out + esc(src.slice(at)));
}

function stepper(I, stage) {
  const here = Math.max(ORDER.indexOf(stage), 2);
  return html`<ol
    class="intel-steps"
    aria-label="${I.S("Steps of this feedback loop", "Pasos de este ciclo de comentarios")}"
  >
    ${STEPS.map(([id, name]) => {
      const i = ORDER.indexOf(id);
      const state = stage === "done" || i < here ? "is-done" : i === here ? "is-now" : "";
      return html`<li
        class="intel-step ${state}"
        ${raw(i === here && stage !== "done" ? 'aria-current="step"' : "")}
      >
        ${I.T(...name)}
      </li>`;
    })}
  </ol>`;
}

const DIM_NAMES = {
  discourse: ["Whole response", "Toda la respuesta"],
  sentence: ["Sentences", "Oraciones"],
  word: ["Words and phrases", "Palabras y frases"],
};

function noticedHTML(I, fb) {
  const groups = Object.keys(DIM_NAMES).filter((d) => fb.dimensions?.[d]?.length);
  if (!groups.length) return "";
  return html`<details class="intel-more">
    <summary>${I.T("More that is in your words", "Más de lo que hay en tus palabras")}</summary>
    ${groups.map(
      (d) =>
        html`<h5 class="intel-dim">${I.T(...DIM_NAMES[d])}</h5>
          <ul class="intel-obs">
            ${fb.dimensions[d].map((o) => html`<li><q lang="en" class="intel-q">${o.quote}</q> ${I.T(...o.text)}</li>`)}
          </ul>`,
    )}
  </details>`;
}

function teacherHTML(I, loop) {
  const t = loop.stages.review?.teacher;
  if (!t) return "";
  const head = {
    accept: [
      "Your teacher agrees with this next step.",
      "Tu maestro o maestra está de acuerdo con este siguiente paso.",
    ],
    replace: [
      "Your teacher gave you a different next step.",
      "Tu maestro o maestra te dio otro siguiente paso.",
    ],
    again: [
      "Your teacher asks you to try this task again.",
      "Tu maestro o maestra te pide que intentes esta tarea otra vez.",
    ],
    comment: ["A comment from your teacher.", "Un comentario de tu maestro o maestra."],
  }[t.decision] || ["A comment from your teacher.", "Un comentario de tu maestro o maestra."];
  return html`<div class="intel-teacher" data-intel-teacher="${t.decision}">
    <h4>${I.T("From your teacher", "De tu maestro o maestra")}</h4>
    <p>${I.T(...head)}</p>
    ${t.comment ? html`<blockquote class="intel-quote">${t.comment}</blockquote>` : ""}
    ${t.next ? html`<p><a class="btn small" href="${BASE}${t.next}">${I.T("Open the activity your teacher chose", "Abrir la actividad que eligió tu maestro o maestra")}</a></p>` : ""}
    ${t.decision === "again" ? html`<p><button type="button" class="btn small btn-primary" ${act("again", loop)}>${I.T("Try this task again", "Intentar esta tarea otra vez")}</button></p>` : ""}
  </div>`;
}

/** The feedback card: strength first, one next step, the evidence marked in the learner's own words, why it helps. */
export function feedbackCardHTML(I, loop, live, { full = true } = {}) {
  const fb = loop.stages.feedback.feedback;
  const text = loop.stages.response.text;
  const eff = effectiveFeedback(loop);
  const fromTeacher = eff.source === "teacher";
  const marks = [
    { quote: fb.strength.quote, cls: "is-strength", label: I.S("What you did", "Lo que hiciste") },
    {
      quote: fromTeacher ? "" : fb.nextStep.quote,
      cls: "is-next",
      label: I.S("Look here", "Mira aquí"),
    },
  ];
  const ai = loop.panel?.ai || "";
  return html`<section class="intel-card intel-fb" aria-labelledby="intelFbH-${loop.id}">
    <h3 id="intelFbH-${loop.id}" tabindex="-1">
      ${I.T("Feedback on your words", "Comentarios sobre tus palabras")}
    </h3>
    ${fb.uncertainty.level !== "none" ? html`<p class="intel-note" data-intel-uncertainty="${fb.uncertainty.level}">${I.T(...fb.uncertainty.note)}</p>` : ""}
    ${
      text
        ? html`<p class="intel-label">${I.T("Your words", "Tus palabras")}</p>
            <p class="intel-own" lang="en">${markedText(text, marks)}</p>`
        : ""
    }
    <div class="intel-strength">
      <h4>${I.T("What you did", "Lo que hiciste")}</h4>
      <p>${I.T(...fb.strength.text)}</p>
    </div>
    <div class="intel-next ${fromTeacher ? "is-teacher" : ""}" data-intel-next="${eff.source}">
      <h4>
        ${fromTeacher ? I.T("Your next step, from your teacher", "Tu siguiente paso, de tu maestro o maestra") : I.T("One next step", "Un siguiente paso")}
      </h4>
      <p>${fromTeacher ? eff.nextStep[0] : I.T(...fb.nextStep.text)}</p>
      ${fromTeacher ? "" : html`<p class="intel-why"><strong>${I.T("Why this helps:", "Por qué ayuda:")}</strong> ${I.T(...fb.explanation)}</p>`}
    </div>
    ${
      fb.scaffold && !fromTeacher
        ? html`<details class="intel-more">
            <summary>${I.T("Show help for this step", "Mostrar ayuda para este paso")}</summary>
            <p lang="en" class="intel-frame">${I.S(...fb.scaffold.text)}</p>
          </details>`
        : ""
    }
    ${full ? noticedHTML(I, fb) : ""}
    ${
      full && text
        ? html`<div class="intel-ai">
            ${
              ai === "used"
                ? html`<p class="fine" role="status">
                    ${I.T("A second look by an AI helper chose which next step to show. The words are still the lab's own.", "Una segunda mirada de un ayudante de IA eligió qué siguiente paso mostrar. Las palabras siguen siendo del laboratorio.")}
                  </p>`
                : ai === "unavailable"
                  ? html`<p class="fine" role="status">
                      ${I.T("The second look is not available right now. Your feedback above stands.", "La segunda mirada no está disponible ahora. Tus comentarios de arriba siguen valiendo.")}
                    </p>`
                  : html`<button
                        type="button"
                        class="btn small ghost"
                        ${act("ai", loop)}
                        ${raw(live.busy === `ai:${loop.id}` ? "disabled" : "")}
                      >
                        ${live.busy === `ai:${loop.id}` ? I.T("Looking…", "Mirando…") : I.T("Ask for a second look (AI)", "Pedir una segunda mirada (IA)")}
                      </button>
                      <p class="fine">
                        ${I.T("Optional. Your words are sent to an AI helper only when you press this. It can only pick one of the lab's own next steps.", "Opcional. Tus palabras se envían a un ayudante de IA solo si presionas esto. Solo puede elegir uno de los siguientes pasos del laboratorio.")}
                      </p>`
            }
          </div>`
        : ""
    }
    ${teacherHTML(I, loop)}
  </section>`;
}

/** A text box with optional dictation. Typing always works. */
export function boxHTML(I, loop, field, { value, label, rows = 4, live, allowSpeech }) {
  const id = `intel-${field}-${loop.id}`;
  const on = live.dict?.field === field && live.dict?.loopId === loop.id;
  return html`<label class="intel-label" for="${id}">${label}</label>
    <textarea
      id="${id}"
      class="intel-box"
      rows="${rows}"
      lang="en"
      spellcheck="true"
      data-intel-field="${field}"
      data-intel-loop="${loop.id}"
    >
${value}</textarea>
    ${
      allowSpeech
        ? html`<p class="intel-dictate">
            <button
              type="button"
              class="btn small ghost"
              aria-pressed="${on ? "true" : "false"}"
              ${act("dictate", loop, ` data-intel-for="${field}"`)}
            >
              ${on ? I.T("Stop speaking", "Dejar de hablar") : I.T("Say it instead", "Decirlo en voz alta")}
            </button>
            <span class="fine"
              >${on ? I.T("Listening. Your words appear in the box; fix anything it heard wrong.", "Escuchando. Tus palabras aparecen en el cuadro; corrige lo que haya oído mal.") : I.T("You can speak or type.", "Puedes hablar o escribir.")}</span
            >
          </p>`
        : ""
    }`;
}

export function practiceHTML(I, loop, practice, live, opts) {
  const note = loop.panel?.practiceNote;
  return html`<section class="intel-card intel-practice" aria-labelledby="intelPrH-${loop.id}">
    <h3 id="intelPrH-${loop.id}">${I.T("Try it once", "Pruébalo una vez")}</h3>
    <p>${I.T(...practice.prompt)}</p>
    ${practice.kind === "move" ? html`<p class="intel-frame">${I.T(...loop.stages.feedback.feedback.nextStep.text)}</p>` : ""}
    ${
      practice.given.length
        ? html`<ul class="intel-given" lang="en">
            ${practice.given.map((s) => html`<li>${markedText(s, [{ quote: practice.target, cls: "is-next", label: I.S("Look here", "Mira aquí") }])}</li>`)}
          </ul>`
        : ""
    }
    ${boxHTML(I, loop, "practice", { value: loop.panel?.drafts?.practice || "", label: I.T("Your sentence", "Tu oración"), rows: 2, live, allowSpeech: opts.allowSpeech })}
    ${note ? html`<p class="feedback is-hint intel-pnote" role="status">${I.T(...note)}</p>` : ""}
    <p class="row-actions">
      <button type="button" class="btn btn-primary" ${act("practice-check", loop)}>
        ${I.T("Check my sentence", "Revisar mi oración")}
      </button>
      <button type="button" class="btn ghost" ${act("practice-skip", loop)}>
        ${I.T("Skip to my revision", "Pasar a mi revisión")}
      </button>
    </p>
    <p class="fine">
      ${I.T("This is practice. It is not counted as work on your own.", "Esto es práctica. No cuenta como trabajo por tu cuenta.")}
    </p>
  </section>`;
}

export function revisionHTML(I, loop, live, opts) {
  const fb = loop.stages.feedback.feedback;
  const eff = effectiveFeedback(loop);
  const draft = loop.panel?.drafts?.revision ?? loop.stages.response.text;
  return html`<section class="intel-card intel-revise" aria-labelledby="intelRvH-${loop.id}">
    <h3 id="intelRvH-${loop.id}" tabindex="-1">
      ${I.T("Revise your response", "Revisa tu respuesta")}
    </h3>
    <p>${eff.source === "teacher" ? eff.nextStep[0] : I.T(...fb.revisionPrompt)}</p>
    ${loop.stages.practice?.done ? html`<p class="fine">${I.T("You practiced the move. Now use it in your own response.", "Practicaste el recurso. Ahora úsalo en tu propia respuesta.")}</p>` : ""}
    ${boxHTML(I, loop, "revision", { value: draft, label: I.T("Your revision (it starts with your own words)", "Tu revisión (empieza con tus propias palabras)"), rows: 6, live, allowSpeech: opts.allowSpeech })}
    ${live.note?.loopId === loop.id ? html`<p class="feedback is-hint" role="status">${I.T(...live.note.text)}</p>` : ""}
    <p class="row-actions">
      <button type="button" class="btn btn-primary" ${act("revise-save", loop)}>
        ${I.T("Save my revision", "Guardar mi revisión")}
      </button>
    </p>
    <p class="fine">
      ${I.T("A revision after feedback is counted as work with support.", "Una revisión después de los comentarios cuenta como trabajo con apoyo.")}
    </p>
  </section>`;
}

export function changesHTML(I, loop) {
  const s = loop.stages;
  const c = compareWork(s.response.text, s.revision.text, {
    keyUse: loop.task.keyUse,
    source: s.response.source,
  });
  return html`<section class="intel-card intel-changes" aria-labelledby="intelChH-${loop.id}">
    <h3 id="intelChH-${loop.id}" tabindex="-1">
      ${I.T("What changed in your revision", "Qué cambió en tu revisión")}
    </h3>
    ${
      c.changes.length
        ? html`<ul class="intel-obs" data-intel-changes="${c.changes.length}">
            ${c.changes.map(
              (ch) =>
                html`<li>
                  ${I.T(...ch.text)}
                  ${ch.beforeQuote ? html`<span class="intel-was">${I.T("Before:", "Antes:")} <q lang="en" class="intel-q">${ch.beforeQuote}</q></span>` : ""}
                  ${ch.afterQuote ? html`<span class="intel-now">${I.T("Now:", "Ahora:")} <q lang="en" class="intel-q">${ch.afterQuote}</q></span>` : ""}
                </li>`,
            )}
          </ul>`
        : html`<p data-intel-changes="0">
            ${I.T("The checker did not find a change it can name. Read both versions aloud: you are the best judge of which is clearer.", "El revisor no encontró un cambio que pueda nombrar. Lee las dos versiones en voz alta: tú juzgas mejor cuál es más clara.")}
          </p>`
    }
    ${
      c.kept.length
        ? html`<ul class="intel-obs intel-kept">
            ${c.kept.map((k) => html`<li>${I.T(...k.text)} <q lang="en" class="intel-q">${k.quote}</q></li>`)}
          </ul>`
        : ""
    }
    ${c.caution ? html`<p class="intel-note">${I.T(...c.caution)}</p>` : ""}
    <p class="row-actions">
      <button type="button" class="btn btn-primary" ${act("changes-next", loop)}>
        ${I.T("Go to my new task", "Ir a mi tarea nueva")}
      </button>
    </p>
  </section>`;
}

export function transferHTML(I, loop, live, opts) {
  const fb = loop.stages.feedback.feedback;
  const help = loop.panel?.help || {};
  return html`<section class="intel-card intel-transfer" aria-labelledby="intelTrH-${loop.id}">
    <h3 id="intelTrH-${loop.id}" tabindex="-1">
      ${I.T("A new task, on your own", "Una tarea nueva, por tu cuenta")}
    </h3>
    <p>
      ${I.T("Use what you just practiced in a new situation. All help is closed. If you open help, this task is saved as done with support, and that is fine.", "Usa lo que acabas de practicar en una situación nueva. Toda la ayuda está cerrada. Si abres ayuda, esta tarea se guarda como hecha con apoyo, y está bien.")}
    </p>
    <p class="intel-prompt" data-intel-prompt>${I.T(...fb.transfer.prompt)}</p>
    ${boxHTML(I, loop, "transfer", { value: loop.panel?.drafts?.transfer || "", label: I.T("Your response", "Tu respuesta"), rows: 5, live, allowSpeech: opts.allowSpeech })}
    ${
      help.frame
        ? html`<div class="intel-help" data-intel-help="open">
            <p class="fine">
              ${I.T("Help is open, so this task will be saved as done with support.", "La ayuda está abierta, así que esta tarea se guardará como hecha con apoyo.")}
            </p>
            <p>
              <strong>${I.T("Your next step was:", "Tu siguiente paso era:")}</strong>
              ${I.T(...fb.nextStep.text)}
            </p>
            ${fb.scaffold ? html`<p lang="en" class="intel-frame">${I.S(...fb.scaffold.text)}</p>` : ""}
          </div>`
        : html`<p>
            <button type="button" class="btn small ghost" ${act("help", loop)}>
              ${I.T("Open help (saves this task as supported)", "Abrir ayuda (guarda esta tarea como con apoyo)")}
            </button>
          </p>`
    }
    ${live.note?.loopId === loop.id ? html`<p class="feedback is-hint" role="status">${I.T(...live.note.text)}</p>` : ""}
    <p class="row-actions">
      <button type="button" class="btn btn-primary" ${act("transfer-save", loop)}>
        ${I.T("Save my new task", "Guardar mi tarea nueva")}
      </button>
    </p>
  </section>`;
}

const HOW = {
  own: ["On my own", "Por mi cuenta"],
  supported: ["With supports", "Con apoyos"],
  revised: ["After feedback (with support)", "Después de los comentarios (con apoyo)"],
};

/** Response, revision and new task as three separate records. Never merged, never one result. */
export function recordsHTML(I, loop) {
  const s = loop.stages;
  const row = (id, name, how, body, extra = "") =>
    body
      ? html`<article class="intel-record" data-intel-record="${id}">
          <h4>
            ${I.T(...name)}
            <span class="intel-how" data-intel-how="${how}">${I.T(...HOW[how])}</span>
          </h4>
          ${extra}
          <p class="intel-own" lang="en">${body}</p>
        </article>`
      : "";
  return html`<div class="intel-records">
    ${row("response", ["First response", "Primera respuesta"], usedAny(s.response?.supports) ? "supported" : "own", s.response?.text, s.response?.source === "transcript" ? html`<p class="fine">${I.T("Speech turned into words; it may contain recognition errors.", "Voz convertida en palabras; puede tener errores de reconocimiento.")}</p>` : "")}
    ${row("revision", ["Revision", "Revisión"], "revised", s.revision?.text)}
    ${row("transfer", ["New task", "Tarea nueva"], s.transfer?.independent ? "own" : "supported", s.transfer?.text, s.transfer ? html`<p class="intel-prompt">${s.transfer.prompt}</p>` : "")}
  </div>`;
}

const SHARE_ERRORS = {
  "no-class": [
    "This device has not joined a class.",
    "Este dispositivo no se ha unido a una clase.",
  ],
  empty: ["There is nothing to send yet.", "Todavía no hay nada que enviar."],
  offline: [
    "It could not be sent. Check the connection and try again. Your work is saved on this device.",
    "No se pudo enviar. Revisa la conexión e inténtalo otra vez. Tu trabajo está guardado en este dispositivo.",
  ],
  "too-many-samples": [
    "Your teacher's list already holds the most pieces it can take from you. Your work is saved on this device.",
    "La lista de tu maestro o maestra ya tiene la cantidad máxima de trabajos tuyos. Tu trabajo está guardado en este dispositivo.",
  ],
};

export function reviewHTML(I, loop, live, joined) {
  const err = live.share?.loopId === loop.id && !live.share.ok ? live.share.reason : "";
  return html`<section class="intel-card intel-share" aria-labelledby="intelShH-${loop.id}">
    <h3 id="intelShH-${loop.id}" tabindex="-1">
      ${I.T("Share with my teacher", "Compartir con mi maestro o maestra")}
    </h3>
    ${recordsHTML(I, loop)}
    ${
      joined
        ? html`<p>
            ${I.T("Your teacher will see your first response, the feedback you got, your revision and your new task, each one labelled. Nothing is sent unless you press the button.", "Tu maestro o maestra verá tu primera respuesta, los comentarios que recibiste, tu revisión y tu tarea nueva, cada una con su etiqueta. No se envía nada si no presionas el botón.")}
          </p>`
        : html`<p data-intel-noclass>
            ${I.T("This device has not joined a class, so there is no teacher to send this to. To join, open My class and type the class code your teacher gave you. Your work stays saved on this device either way.", "Este dispositivo no se ha unido a una clase, así que no hay a quién enviarlo. Para unirte, abre Mi clase y escribe el código que te dio tu maestro o maestra. Tu trabajo queda guardado en este dispositivo de todos modos.")}
            <a href="${BASE}/class">${I.T("Open My class", "Abrir Mi clase")}</a>
          </p>`
    }
    ${err ? html`<p class="feedback is-hint" role="status" data-intel-share-error="${err}">${I.T(...(SHARE_ERRORS[err] || SHARE_ERRORS.offline))}</p>` : ""}
    <p class="row-actions">
      ${joined ? html`<button type="button" class="btn btn-primary" ${act("share", loop)} ${raw(live.busy === `share:${loop.id}` ? "disabled" : "")}>${live.busy === `share:${loop.id}` ? I.T("Sending…", "Enviando…") : I.T("Share with my teacher", "Compartir con mi maestro o maestra")}</button>` : ""}
      <button type="button" class="btn ${joined ? "ghost" : "btn-primary"}" ${act("finish", loop)}>
        ${I.T("Finish without sharing", "Terminar sin compartir")}
      </button>
    </p>
  </section>`;
}

export function doneHTML(I, loop, live, joined) {
  const rv = loop.stages.review || {};
  const fb = loop.stages.feedback.feedback;
  const eff = effectiveFeedback(loop);
  return html`<section class="intel-card intel-done" aria-labelledby="intelDnH-${loop.id}">
    <h3 id="intelDnH-${loop.id}" tabindex="-1">
      ${I.T("Your work on this task", "Tu trabajo en esta tarea")}
    </h3>
    <p class="intel-next" data-intel-next="${eff.source}">
      <strong
        >${eff.source === "teacher" ? I.T("Next step from your teacher:", "Siguiente paso de tu maestro o maestra:") : I.T("The next step you worked on:", "El siguiente paso en el que trabajaste:")}</strong
      >
      ${eff.source === "teacher" ? eff.nextStep[0] : I.T(...fb.nextStep.text)}
    </p>
    ${recordsHTML(I, loop)}
    <p class="intel-shared" role="status" data-intel-shared="${rv.shared ? "yes" : "no"}">
      ${rv.shared ? I.T("Shared with your teacher. Their feedback will appear here and in My class.", "Compartido con tu maestro o maestra. Sus comentarios aparecerán aquí y en Mi clase.") : I.T("Saved on this device. Not shared.", "Guardado en este dispositivo. No se compartió.")}
    </p>
    ${teacherHTML(I, loop)}
    <p class="row-actions">
      ${rv.shared && joined ? html`<button type="button" class="btn small ghost" ${act("sync", loop)} ${raw(live.busy === `sync:${loop.id}` ? "disabled" : "")}>${I.T("Check for my teacher's feedback", "Buscar los comentarios de mi maestro o maestra")}</button>` : ""}
      ${fb.transfer.route ? html`<a class="btn small" href="${BASE}${fb.transfer.route}">${I.T("Keep practicing this", "Seguir practicando esto")}</a>` : ""}
      <button type="button" class="btn small btn-primary" ${act("done", loop)}>
        ${I.T("Done", "Listo")}
      </button>
    </p>
  </section>`;
}

export function responseHTML(I, loop, live, opts) {
  return html`<section class="intel-card intel-response" aria-labelledby="intelRsH-${loop.id}">
    <h3 id="intelRsH-${loop.id}" tabindex="-1">${I.T("Your response", "Tu respuesta")}</h3>
    ${loop.attempt > 1 ? html`<p class="fine">${I.T("This is a new try. Your earlier work is kept as it was.", "Este es un intento nuevo. Tu trabajo anterior se conserva como estaba.")}</p>` : ""}
    ${loop.task.prompt ? html`<p class="intel-prompt">${loop.task.prompt}</p>` : ""}
    ${boxHTML(I, loop, "response", { value: loop.panel?.drafts?.response || "", label: I.T("Say or write your response", "Di o escribe tu respuesta"), rows: 5, live, allowSpeech: opts.allowSpeech })}
    ${live.note?.loopId === loop.id ? html`<p class="feedback is-hint" role="status">${I.T(...live.note.text)}</p>` : ""}
    <p class="row-actions">
      <button type="button" class="btn btn-primary" ${act("respond", loop)}>
        ${I.T("Get feedback", "Recibir comentarios")}
      </button>
    </p>
  </section>`;
}

export function shellHTML(I, loop, stage, body, opts) {
  return html`<div
    class="intel-panel ${opts.compact ? "is-compact" : ""}"
    data-intel-panel="${loop.id}"
    data-intel-stage="${stage}"
  >
    <header class="intel-head">
      <h2 class="intel-title">${I.T("Language coach", "Entrenador de lenguaje")}</h2>
      ${loop.task.title ? html`<p class="intel-task">${loop.task.title}</p>` : ""}
      ${stepper(I, stage)}
    </header>
    ${body}
    <p class="fine intel-foot">
      ${I.T("Practice feedback from this lab's rules. It is not a score, a level or an ACCESS result.", "Comentarios de práctica según las reglas de este laboratorio. No es un puntaje, un nivel ni un resultado de ACCESS.")}
    </p>
  </div>`;
}

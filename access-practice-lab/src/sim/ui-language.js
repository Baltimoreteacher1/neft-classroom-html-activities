// Living Language Simulation Engine: the panels where the learner produces language (spoken explanation, written
// recommendation, revision, independent transfer), the feedback card, the story outcome and the end of the mission.
// Rules kept here: supports are the learner's choice ("on my own" shows no bank and no frames); opening one records
// the work as supported and says so; a revision is always shown as supported; the transfer task offers no help at
// all; speech turned into words is labelled as such and typing is always available; feedback is the shared engine's
// (what the learner did, one next step) and an outcome is a story consequence, never a grade.
import { KLU_REFERENCE } from "../lang/klu.js";
import { canRecord, isRecording, takesFor } from "../recorder.js";
import { DICTATION_NOTE, canDictate } from "../stt.js";
import { BASE, html, raw, wordCount } from "../util.js";
import { inClass } from "./evidence.js";
import { DEFAULT_MIN_WORDS, helpAllowed } from "./runtime.js";
import { evidenceOf, reachedAct, taskOf } from "./schema.js";
import { S, T, evidenceCard, noteOf, openQuestions, panelHead } from "./ui-panels.js";
import { recKey } from "./ui-state.js";

const TITLES = {
  speak: ["Explain it out loud", "Explícalo en voz alta"],
  write: ["Write your recommendation", "Escribe tu recomendación"],
  revise: ["Revise your writing", "Revisa tu escrito"],
  transfer: ["A new problem, on your own", "Un problema nuevo, sin ayuda"],
};
const DEFAULT_FRAMES = {
  Explain: [
    ["First, ___. Then, ___.", "Primero, ___. Después, ___."],
    ["This happened because ___.", "Esto pasó porque ___."],
    ["The evidence shows ___.", "La evidencia muestra ___."],
  ],
  Argue: [
    ["I think ___ because ___.", "Pienso que ___ porque ___."],
    ["One piece of evidence is ___.", "Una evidencia es ___."],
    ["Some people think ___. However, ___.", "Algunas personas piensan que ___. Sin embargo, ___."],
  ],
  Inform: [
    ["___ is ___.", "___ es ___."],
    ["For example, ___.", "Por ejemplo, ___."],
    ["In addition, ___.", "Además, ___."],
  ],
  Narrate: [
    ["First, ___. Next, ___.", "Primero, ___. Luego, ___."],
    ["After that, ___.", "Después de eso, ___."],
    ["In the end, ___.", "Al final, ___."],
  ],
};
export const framesOf = (task) =>
  task.frames || DEFAULT_FRAMES[task.keyUse] || DEFAULT_FRAMES.Explain;
export const bankOf = (task, band) =>
  task.bank || KLU_REFERENCE[task.keyUse]?.bands?.[band === "3-5" ? "3-5" : "6-8"]?.signals || [];

const HOW = {
  own: ["on my own", "sin ayuda"],
  supported: ["with supports", "con apoyos"],
  revision: [
    "a revision after feedback (counted as supported)",
    "una revisión después de los comentarios (cuenta como con apoyo)",
  ],
  transfer: ["on my own, with help closed", "sin ayuda, con los apoyos cerrados"],
};
export const howOf = (task, result) =>
  HOW[
    task.type === "revise"
      ? "revision"
      : task.type === "transfer"
        ? "transfer"
        : result.supported
          ? "supported"
          : "own"
  ];

/** The shared engine's feedback: what the learner did, one next step, why, and a small scaffold. */
export function feedbackCard(I, fb) {
  if (!fb)
    return html`<p class="sim-note">
      ${I.T("Feedback could not be loaded on this device. Read your work again and add one piece of evidence.", "No se pudieron cargar los comentarios en este dispositivo. Lee tu trabajo otra vez y agrega una evidencia.")}
    </p>`;
  const quote = (q) => (q ? html` <q class="sim-quote">${q}</q>` : "");
  return html`<section class="sim-fb" aria-label="${I.S("Feedback", "Comentarios")}">
    <h3 class="sim-sub">${I.T("Feedback", "Comentarios")}</h3>
    <p>
      <strong>${I.T("What you did:", "Lo que hiciste:")}</strong>
      ${T(I, fb.strength.text)}${quote(fb.strength.quote)}
    </p>
    <p>
      <strong>${I.T("One next step:", "Un siguiente paso:")}</strong>
      ${T(I, fb.nextStep.text)}${quote(fb.nextStep.quote)}
    </p>
    <p>${T(I, fb.explanation)}</p>
    ${fb.scaffold ? html`<p class="sim-scaffold"><strong>${I.T("Try:", "Prueba:")}</strong> ${T(I, fb.scaffold.text)}</p>` : ""}
    ${fb.uncertainty?.level && fb.uncertainty.level !== "none" ? html`<p class="sim-note">${T(I, fb.uncertainty.note)}</p>` : ""}
  </section>`;
}

function helpBlock(I, def, state, task, band) {
  const help = state.help[task.id] || {};
  if (task.type === "transfer")
    return html`<p class="sim-note sim-own">
      ${I.T("Help is closed for this task: no word bank and no sentence frames. Show what you can do on your own.", "Los apoyos están cerrados en esta tarea: sin banco de palabras y sin marcos de oraciones. Muestra lo que puedes hacer sin ayuda.")}
    </p>`;
  const used = help.bank || help.frames || help.words;
  return html`<fieldset class="sim-set sim-help">
    <legend>${I.T("How do you want to work?", "¿Cómo quieres trabajar?")}</legend>
    <p class="sim-own">
      ${
        used
          ? I.T(
              "You opened help, so this work is recorded as done with supports.",
              "Abriste un apoyo, así que este trabajo queda registrado como hecho con apoyos.",
            )
          : helpAllowed(def, "bank") || helpAllowed(def, "frames")
          ? I.T("You are working on your own. You can open help if you want it; the work is then recorded as done with supports.", "Estás trabajando sin ayuda. Puedes abrir un apoyo si lo quieres; el trabajo queda registrado como hecho con apoyos.")
          : I.T("You are working on your own.", "Estás trabajando sin ayuda.")
      }
    </p>
    <div class="sim-row">
      ${[
        ["bank", I.T("Word bank", "Banco de palabras")],
        ["frames", I.T("Sentence frames", "Marcos de oraciones")],
      ]
        .filter(([kind]) => helpAllowed(def, kind))
        .map(
          ([kind, label]) =>
            html`<button type="button" class="btn small" data-sim-help="${kind}" aria-pressed="${Boolean(help[kind])}">${label}</button>`,
        )}
    </div>
    ${
      help.bank
        ? html`<ul class="sim-bank" lang="en">
            ${bankOf(task, band).map((w) => html`<li>${w}</li>`)}
          </ul>`
        : ""
    }
    ${
      help.frames
        ? html`<ul class="sim-frames">
            ${framesOf(task).map((f) => html`<li>${T(I, f)}</li>`)}
          </ul>`
        : ""
    }
  </fieldset>`;
}

const notebook = (I, def, state) => {
  const held = Object.keys(state.evidence).map((id) => evidenceOf(def, id));
  return html`<details class="sim-fold">
    <summary>
      ${I.T(`My evidence notebook (${held.length})`, `Mi cuaderno de evidencia (${held.length})`)}
    </summary>
    <div class="sim-pair">${held.map((e) => evidenceCard(I, e))}</div>
  </details>`;
};

/** A speak, write, revise or transfer task: before it is sent, and what was sent afterwards. */
export function languagePanel(I, def, state, ui, band) {
  const task = taskOf(def, ui.panel.id);
  const result = state.tasks[task.id];
  const head = panelHead(I, T(I, TITLES[task.type]), `${task.keyUse} · ${task.domain}`);
  const first = task.of ? state.tasks[task.of] : null;
  const fb = (id) => ui.feedback[id] ?? null;
  if (result?.done)
    return html`${head}
      <p class="sim-prompt">${T(I, task.prompt)}</p>
      <figure class="sim-work">
        <figcaption>
          ${I.T("Your words", "Tus palabras")} ·
          ${T(I, howOf(task, result))}${result.source === "transcript" ? html` · ${I.T("speech turned into words", "voz convertida en palabras")}` : ""}
        </figcaption>
        <blockquote lang="en">${result.text}</blockquote>
      </figure>
      ${task.type === "speak" || task.type === "write" ? feedbackCard(I, fb(task.id)) : ""}
      ${
        task.type === "revise" && first
          ? html`<details class="sim-fold">
              <summary>${I.T("Your first version", "Tu primera versión")}</summary>
              <blockquote lang="en">${first.text}</blockquote>
            </details>`
          : ""
      }
      ${
        state.complete
          ? html`<button type="button" class="btn btn-primary" data-sim-finish>
              ${I.T("Finish the mission", "Terminar la misión")}
            </button>`
          : state.outcome && (task.type === "speak" || task.type === "write")
            ? html`<button type="button" class="btn btn-primary" data-sim-outcome>
                ${I.T("See what happened next", "Ver lo que pasó después")}
              </button>`
            : ""
      }`;
  const min = task.minWords || DEFAULT_MIN_WORDS;
  const key = recKey(def, task.id);
  const draft = ui.drafts[task.id] ?? (task.type === "revise" ? first?.text || "" : "");
  const speak = task.type === "speak";
  const takes = speak ? takesFor(key) : [];
  return html`${head}
    <p class="sim-prompt">${T(I, task.prompt)}</p>
    ${task.type === "revise" ? feedbackCard(I, fb(task.of)) : ""}
    ${helpBlock(I, def, state, task, band)}
    ${task.type === "transfer" ? "" : notebook(I, def, state)}
    ${
      speak
        ? html`<div class="sim-rec">
            <div class="sim-row">
              ${
                canRecord()
                  ? html`<button
                      type="button"
                      class="btn"
                      data-sim-rec="${task.id}"
                      aria-pressed="${isRecording(key)}"
                    >
                      ${isRecording(key) ? I.T("Stop recording", "Detener la grabación") : I.T("Record my voice", "Grabar mi voz")}
                    </button>`
                  : ""
              }
              ${
                canDictate()
                  ? html`<button
                      type="button"
                      class="btn"
                      data-sim-dict="${task.id}"
                      aria-pressed="${ui.dict?.key === task.id}"
                    >
                      ${ui.dict?.key === task.id ? I.T("Stop listening", "Dejar de escuchar") : I.T("Speak and turn it into words", "Hablar y convertirlo en palabras")}
                    </button>`
                  : ""
              }
            </div>
            ${takes.length ? html`<audio class="sim-audio" controls src="${takes[takes.length - 1].url}"></audio>` : ""}
            <p class="sim-note">
              ${T(I, DICTATION_NOTE[ui.dict?.session?.mode || (canDictate() ? "standard" : "none")])}
              ${I.T("Recordings stay on this device.", "Las grabaciones se quedan en este dispositivo.")}
            </p>
          </div>`
        : ""
    }
    <label class="field" for="simText">
      ${speak ? I.T("Say it, then type or fix the words you said", "Dilo y luego escribe o corrige las palabras que dijiste") : I.T("Write here", "Escribe aquí")}
    </label>
    <textarea
      id="simText"
      class="sim-text"
      rows="6"
      maxlength="2000"
      lang="en"
      data-sim-text="${task.id}"
    >
${draft}</textarea>
    <p class="sim-note" id="simCount">
      ${I.T(`Use at least ${min} words. You have ${wordCount(draft)}.`, `Usa al menos ${min} palabras. Llevas ${wordCount(draft)}.`)}
    </p>
    ${noteOf(I, ui)}
    <button
      type="button"
      class="btn btn-primary"
      data-sim-submit="${task.id}"
      ${ui.busy ? raw('aria-disabled="true"') : ""}
    >
      ${task.type === "revise" ? I.T("Send my revision", "Enviar mi revisión") : speak ? I.T("Give my explanation", "Dar mi explicación") : I.T("Send it", "Enviar")}
    </button>`;
}

export function outcomePanel(I, def, state) {
  const o = def.outcomes.find((x) => x.id === state.outcome);
  return html`${panelHead(I, T(I, o.title), I.T("What happened next", "Lo que pasó después"))}
    <p class="sim-outcome">${T(I, o.text)}</p>
    <p class="sim-note">
      ${I.T("This is how the story went because of the evidence you collected, the conflict you settled and the decision you made. It is not a grade.", "Así siguió la historia por la evidencia que reuniste, el conflicto que aclaraste y la decisión que tomaste. No es una calificación.")}
    </p>
    ${
      state.complete
        ? ""
        : html`<button type="button" class="btn btn-primary" data-sim-continue>
            ${I.T("Continue to the last act", "Continuar al último acto")}
          </button>`
    }`;
}

export function completePanel(I, def, state, ui, reportHref) {
  const o = def.outcomes.find((x) => x.id === state.outcome);
  const shared = ui.shared;
  return html`${panelHead(I, I.T("Mission complete", "Misión terminada"), T(I, def.title))}
    ${o ? html`<p><strong>${I.T("How the story went:", "Cómo siguió la historia:")}</strong> ${T(I, o.title)}</p>` : ""}
    <p>
      ${I.T("You explored, questioned, compared, decided, explained out loud, wrote, revised and solved a new problem on your own.", "Exploraste, preguntaste, comparaste, decidiste, explicaste en voz alta, escribiste, revisaste y resolviste un problema nuevo sin ayuda.")}
    </p>
    <div class="sim-row">
      ${reportHref ? html`<a class="btn btn-primary" href="${reportHref}">${I.T("See my evidence report", "Ver mi informe de evidencia")}</a>` : ""}
      ${
        ui.preview
          ? ""
          : inClass()
            ? html`<button
                type="button"
                class="btn"
                data-sim-share
                ${ui.busy || shared?.ok ? raw('aria-disabled="true"') : ""}
              >
                ${I.T("Share with my teacher", "Compartir con mi docente")}
              </button>`
            : html`<a class="btn" href="${BASE}/class"
                >${I.T("Join a class to share it", "Únete a una clase para compartirlo")}</a
              >`
      }
      <button type="button" class="btn" data-sim-outcome>
        ${I.T("Read the ending again", "Leer el final otra vez")}
      </button>
    </div>
    ${
      shared
        ? html`<p class="feedback ${shared.ok ? "is-right" : "is-hint"}" role="status">
            ${
              shared.ok
                ? I.T(
                    "Sent to your teacher's review list.",
                    "Enviado a la lista de revisión de tu docente.",
                  )
                : I.T(
                    "It could not be sent right now. Your work is still saved on this device.",
                    "No se pudo enviar ahora. Tu trabajo sigue guardado en este dispositivo.",
                  )
            }
          </p>`
        : ""
    }`;
}

/** The panel when nothing is open: where the learner is in the story and what is still worth doing. */
export function guidePanel(I, def, state) {
  const reached = reachedAct(def, state);
  const act = def.acts[Math.min(reached, def.acts.length - 1)];
  const open = openQuestions(def, state);
  return html`<header class="sim-panel-head">
      <div>
        <p class="sim-kicker">${I.T("Mission notes", "Notas de la misión")}</p>
        <h2 id="simPanelH" tabindex="-1">
          ${state.complete ? I.T("Mission complete", "Misión terminada") : T(I, act.title)}
        </h2>
      </div>
    </header>
    <p>
      ${state.complete ? I.T("You can still walk around the city and read your journal.", "Todavía puedes recorrer la ciudad y leer tu diario.") : T(I, act.goal)}
    </p>
    ${
      open.length
        ? html`<ul class="sim-list">
            ${open.slice(0, 3).map((q) => html`<li>${T(I, q)}</li>`)}
          </ul>`
        : ""
    }
    <p class="sim-note">
      ${I.T("Choose something in the picture, or use the list under it. Your progress is saved on this device.", "Elige algo en la imagen o usa la lista que está debajo. Tu avance se guarda en este dispositivo.")}
    </p>`;
}

export { S };

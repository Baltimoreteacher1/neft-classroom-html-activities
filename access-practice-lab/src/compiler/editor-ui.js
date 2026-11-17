// Experience Builder: the visual editor's markup. One function per section (scenes, people, evidence, tasks,
// supports and feedback, endings, check). Every control carries the editor operation it performs
// (data-xb-op + data-xb-arg, applied by src/compiler/editor-ops.js on `change`), so this file holds no logic.
// Rules it keeps: text that came from the instructor's source is labelled "from your text" or "not from your text"
// from the validator's trace, and the compiler-built misreading is marked for the instructor to check.
import { KEY_LANGUAGE_USES } from "../lang/klu.js";
import { ART_IDS, LOOKS } from "../sim/art.js";
import { html } from "../util.js";
import { SUPPORTS, USE_ES } from "./editor-inputs.js";

export const SECTIONS = [
  ["scenes", "Scenes", "Escenas"],
  ["people", "People", "Personas"],
  ["evidence", "Evidence", "Evidencia"],
  ["tasks", "Tasks", "Tareas"],
  ["supports", "Supports and feedback", "Apoyos y comentarios"],
  ["endings", "Endings", "Finales"],
  ["check", "Check", "Revisión"],
];
const KIND = {
  document: ["Document", "Documento"],
  data: ["Data card", "Tarjeta de datos"],
  object: ["Object to examine", "Objeto para examinar"],
  audio: ["Recorded message", "Mensaje grabado"],
  testimony: ["Testimony (a character gives it)", "Testimonio (lo da un personaje)"],
};
const TASK = {
  compare: ["Compare evidence", "Comparar evidencia"],
  decide: ["Decide", "Decidir"],
  speak: ["Spoken explanation", "Explicación oral"],
  write: ["Written recommendation", "Recomendación escrita"],
  revise: ["Revise", "Revisar"],
  transfer: ["Independent transfer", "Transferencia independiente"],
};
const ART = {
  square: ["Town square", "Plaza"],
  lab: ["Lab", "Laboratorio"],
  newsroom: ["Newsroom", "Sala de redacción"],
  comms: ["Communications room", "Sala de comunicaciones"],
  ops: ["Operations room", "Sala de operaciones"],
  site: ["Outdoor site", "Lugar al aire libre"],
  records: ["Records room", "Sala de registros"],
  interview: ["Interview room", "Sala de entrevistas"],
  report: ["Report desk", "Mesa del informe"],
};

const uid = (op, arg) =>
  `xb-${op}-${Object.values(arg).join("-")}`.replace(/[^a-zA-Z0-9_-]+/g, "_");
const opt = (value, label, current) =>
  html`<option value="${value}" ${String(value) === String(current) ? "selected" : ""}>
    ${label}
  </option>`;

/** One labelled control bound to an editor operation. */
function control(I, { op, arg, label, value, kind = "text", options = [], rows = 2 }) {
  const id = uid(op, arg);
  const a = JSON.stringify(arg);
  const input =
    kind === "area"
      ? html`<textarea
          data-xb-id="${id}"
          id="${id}"
          rows="${rows}"
          data-xb-op="${op}"
          data-xb-arg="${a}"
        >
${value}</textarea>`
      : kind === "select"
        ? html`<select data-xb-id="${id}" id="${id}" data-xb-op="${op}" data-xb-arg="${a}">
            ${options.map(([v, l]) => opt(v, l, value))}
          </select>`
        : kind === "check"
          ? html`<input
              data-xb-id="${id}"
              id="${id}"
              type="checkbox"
              data-xb-op="${op}"
              data-xb-arg="${a}"
              ${value ? "checked" : ""}
            />`
          : html`<input
              data-xb-id="${id}"
              id="${id}"
              type="${kind === "number" ? "number" : "text"}"
              ${kind === "number" ? 'min="0" max="200"' : ""}
              data-xb-op="${op}"
              data-xb-arg="${a}"
              value="${value}"
            />`;
  return kind === "check"
    ? html`<label class="xb-check" for="${id}">${input} ${label}</label>`
    : html`<label class="field" for="${id}">${label}${input}</label>`;
}
/** English and Spanish controls for one [en, es] pair. */
const pair = (I, { op, arg, label, value, kind = "text", rows = 2 }) =>
  html`<div class="xb-pair">
    ${control(I, { op, arg: { ...arg, lang: "en" }, label: I.S(`${label[0]} (English)`, `${label[1]} (inglés)`), value: value?.[0] ?? "", kind, rows })}
    ${control(I, { op, arg: { ...arg, lang: "es" }, label: I.S(`${label[0]} (Spanish)`, `${label[1]} (español)`), value: value?.[1] ?? "", kind, rows })}
  </div>`;
const act = (I, name, arg, label, cls = "btn small ghost") =>
  html`<button
    type="button"
    class="${cls}"
    data-xb-act="${name}"
    data-xb-arg="${JSON.stringify(arg)}"
  >
    ${label}
  </button>`;

function traceBadge(I, report, key) {
  const t = report?.trace?.[key];
  if (!t) return "";
  return t.ok
    ? html`<span class="xb-badge is-ok">${I.T("From your text", "De su texto")}</span>`
    : html`<span class="xb-badge is-warn"
        >${I.T("Not from your text", "No viene de su texto")}</span
      >`;
}
const opensText = (I, def, h) => {
  const [k, id] = Object.entries(h.opens)[0];
  const find = (list) => (def[list] || []).find((x) => x.id === id);
  if (k === "evidence")
    return I.S(
      `Opens evidence: ${find("evidence")?.title[0]}`,
      `Abre evidencia: ${find("evidence")?.title[1]}`,
    );
  if (k === "character")
    return I.S(
      `Opens a talk with ${find("characters")?.name}`,
      `Abre una conversación con ${find("characters")?.name}`,
    );
  if (k === "task")
    return I.S(
      `Opens the task: ${TASK[find("tasks")?.type]?.[0]}`,
      `Abre la tarea: ${TASK[find("tasks")?.type]?.[1]}`,
    );
  return I.S(`Door to: ${find("scenes")?.title[0]}`, `Puerta a: ${find("scenes")?.title[1]}`);
};

function scenesHTML(I, def) {
  const targets = [
    ...def.evidence
      .filter((e) => e.kind !== "testimony")
      .map((e) => [`evidence:${e.id}`, I.S(`Evidence: ${e.title[0]}`, `Evidencia: ${e.title[1]}`)]),
    ...def.characters.map((c) => [
      `character:${c.id}`,
      I.S(`Person: ${c.name}`, `Persona: ${c.name}`),
    ]),
    ...def.tasks.map((t) => [
      `task:${t.id}`,
      I.S(`Task: ${TASK[t.type][0]}`, `Tarea: ${TASK[t.type][1]}`),
    ]),
    ...def.scenes.map((s) => [
      `scene:${s.id}`,
      I.S(`Door to: ${s.title[0]}`, `Puerta a: ${s.title[1]}`),
    ]),
  ];
  return html`<ol class="xb-list" data-xb-scenes>
      ${def.scenes.map(
        (s, i) =>
          html`<li class="xb-card" data-xb-scene="${s.id}">
            <div class="xb-card-head">
              <h3>
                ${I.S(`Scene ${i + 1}`, `Escena ${i + 1}`)}:
                <span data-xb-scene-title>${I.S(...s.title)}</span
                >${def.start === s.id ? html` <span class="xb-badge">${I.T("Start", "Inicio")}</span>` : ""}
              </h3>
              <div class="row-actions">
                ${i > 0 ? act(I, "op", { type: "scene.move", id: s.id, dir: -1 }, I.S(`Move scene ${i + 1} up`, `Subir la escena ${i + 1}`)) : ""}
                ${i < def.scenes.length - 1 ? act(I, "op", { type: "scene.move", id: s.id, dir: 1 }, I.S(`Move scene ${i + 1} down`, `Bajar la escena ${i + 1}`)) : ""}
                ${def.scenes.length > 1 ? act(I, "op", { type: "scene.remove", id: s.id }, I.S(`Remove scene ${i + 1}`, `Quitar la escena ${i + 1}`)) : ""}
              </div>
            </div>
            ${pair(I, { op: "scene.set", arg: { id: s.id, field: "title" }, label: ["Name", "Nombre"], value: s.title })}
            ${pair(I, { op: "scene.set", arg: { id: s.id, field: "description" }, label: ["What learners see", "Lo que ven los estudiantes"], value: s.description, kind: "area" })}
            ${control(I, { op: "scene.set", arg: { id: s.id, field: "art" }, label: I.S("Picture", "Imagen"), value: s.art, kind: "select", options: ART_IDS.map((a) => [a, I.S(...(ART[a] || [a, a]))]) })}
            <details class="xb-more">
              <summary>
                ${I.S(`Spots in this scene (${s.hotspots.length})`, `Puntos de esta escena (${s.hotspots.length})`)}
              </summary>
              <ul class="xb-sublist">
                ${s.hotspots.map(
                  (h) =>
                    html`<li>
                      <p class="fine">${opensText(I, def, h)}</p>
                      ${pair(I, { op: "hotspot.set", arg: { scene: s.id, id: h.id, field: "label" }, label: ["Button label", "Texto del botón"], value: h.label })}
                      ${act(I, "op", { type: "hotspot.remove", scene: s.id, id: h.id }, I.S("Remove this spot", "Quitar este punto"))}
                    </li>`,
                )}
              </ul>
              <div class="xb-add">
                <label class="field" for="xbAddSpot-${s.id}"
                  >${I.T("Add a spot that opens", "Agregar un punto que abre")}
                  <select id="xbAddSpot-${s.id}" data-xb-spot="${s.id}">
                    ${targets.filter(([v]) => v !== `scene:${s.id}`).map(([v, l]) => opt(v, l, ""))}
                  </select></label
                >
                ${act(I, "add-spot", { scene: s.id }, I.S("Add spot", "Agregar punto"), "btn small")}
              </div>
            </details>
          </li>`,
      )}
    </ol>
    <div class="row-actions">
      ${act(I, "op", { type: "scene.add" }, I.S("Add a scene", "Agregar una escena"), "btn small")}
    </div>`;
}

function peopleHTML(I, def, report, ui) {
  return html`${def.characters.map(
    (c) =>
      html`<article class="xb-card" data-xb-character="${c.id}">
        <h3>${c.name}</h3>
        ${(def.compiled?.invented || []).some((x) => x.value === c.name) ? html`<p class="fine">${I.T("This name was chosen by the builder; your text names no such person. Change it if you like.", "Este nombre lo eligió el creador; su texto no nombra a esa persona. Cámbielo si quiere.")}</p>` : ""}
        <div class="xb-grid">
          ${control(I, { op: "character.set", arg: { id: c.id, field: "name" }, label: I.S("Name", "Nombre"), value: c.name })}
          ${control(I, { op: "character.set", arg: { id: c.id, field: "look" }, label: I.S("Portrait", "Retrato"), value: c.look, kind: "select", options: Object.keys(LOOKS).map((l) => [l, l]) })}
        </div>
        ${pair(I, { op: "character.set", arg: { id: c.id, field: "role" }, label: ["Role", "Papel"], value: c.role })}
        ${pair(I, { op: "character.set", arg: { id: c.id, field: "style" }, label: ["How they speak", "Cómo habla"], value: c.style })}
        ${pair(I, { op: "character.set", arg: { id: c.id, field: "greeting" }, label: ["Greeting", "Saludo"], value: c.greeting })}
        ${pair(I, { op: "character.set", arg: { id: c.id, field: "fallback" }, label: ["When asked about something else", "Cuando le preguntan otra cosa"], value: c.fallback })}
        <h4>
          ${I.T("What this person knows (only facts from your text)", "Lo que sabe esta persona (solo datos de su texto)")}
        </h4>
        <ul class="xb-sublist">
          ${c.topics.map(
            (t, n) =>
              html`<li data-xb-topic="${t.id}">
                <p class="xb-row">
                  <strong>${I.S(`Topic ${n + 1}`, `Tema ${n + 1}`)}</strong>
                  ${traceBadge(I, report, `answer:${c.id}:${t.id}`)}
                </p>
                ${pair(I, { op: "topic.set", arg: { character: c.id, id: t.id, field: "ask" }, label: ["Suggested question", "Pregunta sugerida"], value: t.ask })}
                ${pair(I, { op: "topic.set", arg: { character: c.id, id: t.id, field: "answer" }, label: ["Answer", "Respuesta"], value: t.answer, kind: "area" })}
                ${control(I, { op: "topic.set", arg: { character: c.id, id: t.id, field: "keywords" }, label: I.S("Words that lead to this answer (comma separated)", "Palabras que llevan a esta respuesta (separadas por comas)"), value: t.keywords.join(", ") })}
                <details class="xb-more">
                  <summary>
                    ${I.T("Clarification question", "Pregunta de aclaración")}
                    ${t.clarify ? traceBadge(I, report, `clarify:${c.id}:${t.id}`) : ""}
                  </summary>
                  ${pair(I, { op: "topic.set", arg: { character: c.id, id: t.id, field: "clarify.ask" }, label: ["Follow-up question", "Pregunta de seguimiento"], value: t.clarify?.ask })}
                  ${pair(I, { op: "topic.set", arg: { character: c.id, id: t.id, field: "clarify.answer" }, label: ["Follow-up answer", "Respuesta de seguimiento"], value: t.clarify?.answer, kind: "area" })}
                </details>
                ${c.topics.length > 1 ? act(I, "op", { type: "topic.remove", character: c.id, id: t.id }, I.S(`Remove topic ${n + 1}`, `Quitar el tema ${n + 1}`)) : ""}
              </li>`,
          )}
        </ul>
        <div class="row-actions">
          ${act(I, "op", { type: "topic.add", character: c.id }, I.S("Add a topic", "Agregar un tema"), "btn small")}
        </div>
        <div class="xb-dialogue">
          <label class="field" for="xbAsk-${c.id}"
            >${I.S(`Try a question for ${c.name}`, `Pruebe una pregunta para ${c.name}`)}
            <input
              id="xbAsk-${c.id}"
              type="text"
              maxlength="240"
              data-xb-ask="${c.id}"
              value="${ui.dialogue?.character === c.id ? ui.dialogue.question : ""}"
          /></label>
          ${act(I, "ask", { character: c.id }, I.S("See the answer", "Ver la respuesta"), "btn small")}
          ${
            ui.dialogue?.character === c.id
              ? html`<p class="xb-reply" role="status" data-xb-reply>
                  <strong
                    >${ui.dialogue.topic ? I.S(`Answers with topic: "${ui.dialogue.ask[0]}"`, `Responde con el tema: "${ui.dialogue.ask[1]}"`) : I.S("No topic matches, so the person stays in role:", "Ningún tema coincide; la persona se mantiene en su papel:")}</strong
                  ><br />${I.S(...ui.dialogue.line)}
                </p>`
              : ""
          }
        </div>
      </article>`,
  )}`;
}

function evidenceHTML(I, def, report) {
  const link = (e, x) =>
    (e.supports || []).includes(x.id)
      ? "supports"
      : (e.contradicts || []).includes(x.id)
        ? "contradicts"
        : "none";
  return html`${def.evidence.map(
      (e) =>
        html`<article class="xb-card" data-xb-evidence="${e.id}">
          <p class="xb-row">
            <strong>${I.S(...e.title)}</strong> ${traceBadge(I, report, `evidence:${e.id}`)}
          </p>
          <div class="xb-grid">
            ${control(I, { op: "evidence.set", arg: { id: e.id, field: "kind" }, label: I.S("Kind", "Tipo"), value: e.kind, kind: "select", options: Object.entries(KIND).map(([k, v]) => [k, I.S(...v)]) })}
            ${control(I, {
              op: "evidence.set",
              arg: { id: e.id, field: "strength" },
              label: I.S("How strong it is", "Qué tan fuerte es"),
              value: e.strength || "weak",
              kind: "select",
              options: [
                ["strong", I.S("Strong (measured or checked)", "Fuerte (medida o comprobada)")],
                [
                  "weak",
                  I.S("Weak (an impression or one opinion)", "Débil (una impresión o una opinión)"),
                ],
              ],
            })}
          </div>
          ${pair(I, { op: "evidence.set", arg: { id: e.id, field: "title" }, label: ["Title", "Título"], value: e.title })}
          ${pair(I, { op: "evidence.set", arg: { id: e.id, field: "body" }, label: [e.kind === "audio" ? "What the message says (also the transcript)" : "What it says", e.kind === "audio" ? "Lo que dice el mensaje (también la transcripción)" : "Lo que dice"], value: e.body, kind: "area", rows: 3 })}
          ${def.explanations.map((x) =>
            control(I, {
              op: "evidence.set",
              arg: { id: e.id, field: "link", ex: x.id },
              label: I.S(
                `For the explanation "${x.label[0]}"`,
                `Para la explicación "${x.label[1]}"`,
              ),
              value: `${link(e, x)}:${x.id}`,
              kind: "select",
              options: [
                [`supports:${x.id}`, I.S("supports it", "la apoya")],
                [`contradicts:${x.id}`, I.S("contradicts it", "la contradice")],
                [`none:${x.id}`, I.S("says nothing about it", "no dice nada sobre ella")],
              ],
            }),
          )}
          ${act(I, "op", { type: "evidence.remove", id: e.id }, I.S(`Remove "${e.title[0]}"`, `Quitar "${e.title[1]}"`))}
        </article>`,
    )}
    <div class="xb-add">
      <label class="field" for="xbAddEv"
        >${I.T("Add evidence", "Agregar evidencia")}
        <select id="xbAddEv" data-xb-new-evidence>
          ${["document", "data", "object", "audio"].map((k) => opt(k, I.S(...KIND[k]), "document"))}
        </select></label
      >
      ${act(I, "add-evidence", {}, I.S("Add evidence", "Agregar evidencia"), "btn small")}
    </div>`;
}

function tasksHTML(I, def) {
  return html`${def.tasks.map(
    (t) =>
      html`<article class="xb-card" data-xb-task="${t.id}">
        <h3>${I.S(...TASK[t.type])}</h3>
        ${pair(I, { op: "task.set", arg: { id: t.id, field: "prompt" }, label: ["Prompt", "Consigna"], value: t.prompt, kind: "area" })}
        ${t.minWords != null ? control(I, { op: "task.set", arg: { id: t.id, field: "minWords" }, label: I.S("Fewest words accepted", "Mínimo de palabras"), value: t.minWords, kind: "number" }) : ""}
        ${
          t.type === "decide"
            ? html`<h4>${I.T("The competing explanations", "Las explicaciones en competencia")}</h4>
                ${t.options.map((o) => {
                  const check = def.explanations.find((x) => x.id === o.explanation)?.check;
                  return html`<div class="xb-option">
                    ${check ? html`<p class="xb-badge is-warn">${I.T("Check this: the builder made this plausible misreading from your text. Your evidence should contradict it.", "Revise esto: el creador armó esta lectura equivocada pero creíble a partir de su texto. Su evidencia debe contradecirla.")}</p>` : html`<p class="xb-badge is-ok">${I.T("Your text's explanation", "La explicación de su texto")}</p>`}
                    ${pair(I, { op: "option.set", arg: { task: t.id, id: o.id }, label: ["Option", "Opción"], value: o.label, kind: "area" })}
                  </div>`;
                })}`
            : ""
        }
        ${t.type === "transfer" ? html`<p class="fine">${I.T("Learners do this one with every support closed, so it shows what they can do on their own.", "Los estudiantes hacen esta tarea con todos los apoyos cerrados; muestra lo que pueden hacer por su cuenta.")}</p>` : ""}
        ${t.type === "revise" ? html`<p class="fine">${I.T("A revision comes after feedback, so it is always recorded as supported.", "Una revisión viene después de los comentarios; siempre se registra como apoyada.")}</p>` : ""}
      </article>`,
  )}`;
}

function supportsHTML(I, def) {
  const supports = def.supports || def.compiled?.supports || {};
  const words = (type) => def.tasks.find((t) => t.type === type)?.minWords ?? 0;
  return html`<article class="xb-card">
      <h3>${I.T("About this experience", "Sobre esta experiencia")}</h3>
      ${pair(I, { op: "meta.set", arg: { field: "title" }, label: ["Title", "Título"], value: def.title })}
      ${pair(I, { op: "meta.set", arg: { field: "summary" }, label: ["Summary", "Resumen"], value: def.summary, kind: "area" })}
      ${pair(I, { op: "meta.set", arg: { field: "language" }, label: ["Language objective", "Objetivo de lenguaje"], value: def.objectives.language, kind: "area" })}
      ${pair(I, { op: "meta.set", arg: { field: "content" }, label: ["Content objective", "Objetivo de contenido"], value: def.objectives.content, kind: "area" })}
    </article>
    <article class="xb-card">
      <h3>${I.T("Supports learners may open", "Apoyos que los estudiantes pueden abrir")}</h3>
      <div class="xb-checks">
        ${SUPPORTS.map(([k, en, es]) => control(I, { op: "supports.set", arg: { key: k }, label: I.T(en, es), value: supports[k] !== false, kind: "check" }))}
      </div>
      <p class="fine">
        ${I.T("Work done with a support open is recorded as supported, never as independent.", "El trabajo hecho con un apoyo abierto se registra como apoyado, nunca como independiente.")}
      </p>
    </article>
    <article class="xb-card">
      <h3>${I.T("Feedback", "Comentarios")}</h3>
      <p class="fine">
        ${I.T("After a learner speaks or writes, the lab's feedback loop names one thing they did and one next step for the Key Language Use you choose here. It never gives a score.", "Después de que un estudiante habla o escribe, el ciclo de comentarios del laboratorio nombra algo que hizo y un siguiente paso para el Uso Clave del Lenguaje que usted elija aquí. Nunca da un puntaje.")}
      </p>
      <div class="xb-grid">
        ${control(I, { op: "feedback.set", arg: { field: "keyUse" }, label: I.S("Key Language Use to coach", "Uso Clave del Lenguaje que se orienta"), value: def.keyUses[0], kind: "select", options: KEY_LANGUAGE_USES.map((u) => [u, I.S(u, USE_ES[u])]) })}
        ${control(I, { op: "feedback.set", arg: { field: "speak" }, label: I.S("Fewest words when speaking", "Mínimo de palabras al hablar"), value: words("speak"), kind: "number" })}
        ${control(I, { op: "feedback.set", arg: { field: "write" }, label: I.S("Fewest words when writing", "Mínimo de palabras al escribir"), value: words("write"), kind: "number" })}
      </div>
    </article>`;
}

function endingsHTML(I, report) {
  return html`<p class="fine">
      ${I.T("Each ending is a story consequence of what the learner chose and cited. The builder plays the experience with scripted learners to see which endings can be reached.", "Cada final es una consecuencia de lo que el estudiante eligió y citó. El creador juega la experiencia con estudiantes de prueba para ver a qué finales se puede llegar.")}
    </p>
    <ul class="xb-list" data-xb-endings>
      ${(report?.branches || []).map(
        (b) =>
          html`<li class="xb-card" data-xb-ending="${b.id}">
            <h3>${I.S(...b.title)}</h3>
            <p>
              ${b.fallback ? I.T("Shown when no other ending applies.", "Se muestra cuando no corresponde ningún otro final.") : I.S(`When the learner ${b.when[0]}.`, `Cuando el estudiante ${b.when[1]}.`)}
            </p>
            <p>
              ${b.reachable ? html`<span class="xb-badge is-ok">${I.S(`A scripted learner reaches it (${b.steps} steps)`, `Un estudiante de prueba llega (${b.steps} pasos)`)}</span>` : b.fallback ? html`<span class="xb-badge">${I.T("Safety ending: no scripted path needed it", "Final de respaldo: ningún camino de prueba lo necesitó")}</span>` : html`<span class="xb-badge is-warn">${I.T("No scripted path reached it", "Ningún camino de prueba llegó")}</span>`}
            </p>
          </li>`,
      )}
    </ul>`;
}

function findings(I, items, tone, title) {
  if (!items.length) return "";
  return html`<section class="xb-findings is-${tone}">
    <h3>${title} (${items.length})</h3>
    <ul>
      ${items.map((f) => html`<li data-xb-finding="${f.code}">${I.S(...f.text)}</li>`)}
    </ul>
  </section>`;
}
export function checkHTML(I, report) {
  const s = report?.stats || {};
  return html`${
      report?.ok
        ? html`<p class="xb-status is-ok" role="status">
            ${I.T("Ready: this experience is valid and a learner can finish it.", "Lista: esta experiencia es válida y un estudiante puede terminarla.")}
          </p>`
        : html`<p class="xb-status is-bad" role="status">
            ${I.T("Not ready to publish yet. Fix what is listed under “Must fix”.", "Todavía no está lista para publicar. Corrija lo que aparece en “Hay que corregir”.")}
          </p>`
    }
    ${findings(I, report?.errors || [], "bad", I.S("Must fix", "Hay que corregir"))}
    ${findings(I, report?.warnings || [], "warn", I.S("Your call", "Usted decide"))}
    <p class="fine">
      ${I.S(
        `${s.scenes} scenes · ${s.characters} people · ${s.evidence} pieces of evidence · listening ${s.listen ? "yes" : "no"} · reading ${s.read ? "yes" : "no"} · ${(s.standards || []).length ? `tagged ${s.standards.join(", ")}` : "no standard tag"}`,
        `${s.scenes} escenas · ${s.characters} personas · ${s.evidence} evidencias · escuchar ${s.listen ? "sí" : "no"} · leer ${s.read ? "sí" : "no"} · ${(s.standards || []).length ? `etiquetas ${s.standards.join(", ")}` : "sin etiqueta de estándar"}`,
      )}
    </p>`;
}

/** The body of one editor section. */
export function sectionHTML(I, section, ui) {
  const { def } = ui.entry;
  const report = ui.report;
  if (section === "people") return peopleHTML(I, def, report, ui);
  if (section === "evidence") return evidenceHTML(I, def, report);
  if (section === "tasks") return tasksHTML(I, def);
  if (section === "supports") return supportsHTML(I, def);
  if (section === "endings") return endingsHTML(I, report);
  if (section === "check") return checkHTML(I, report);
  return scenesHTML(I, def);
}

// The optional family conversation of a pathway: three talk prompts tied to the objective, in English and Spanish,
// printable. Shown in the pathway runner (where the family can tick the prompts they used) and on the Family hub for
// the pathway a child is on. Any language at home counts; nothing here is graded, timed or sent anywhere.
import { html, icon } from "../util.js";
import { objectiveById } from "./graph.js";
import { loadRuns, resumeRun } from "./progress.js";

/** The three prompts, each shown in English and Spanish whatever the page language (families read either). */
const promptsHTML = (objective, tick) =>
  html`<ol class="pw-talk-list">
    ${objective.talk.map(
      (p, i) =>
        html`<li class="pw-talk-item">
          ${tick ? html`<label class="pw-talk-tick"><input type="checkbox" data-pw-talk="${i}" ${tick.used.includes(i) ? "checked" : ""} /> <span class="visually-hidden">${tick.label} ${i + 1}</span></label>` : ""}
          <span class="pw-talk-pair"><span lang="en">${p[0]}</span><span lang="es" class="pw-talk-es">${p[1]}</span></span>
        </li>`,
    )}
  </ol>`;

/**
 * The card. `tick` = { used: number[], done: {t} | null } turns on the "we used this one" boxes (runner only).
 * @param {object} I i18n   @param {object} objective   @param {{tick?:object, href?:string}} [opts]
 */
export function familyCardHTML(I, objective, { tick = null, href = "" } = {}) {
  return html`<section class="pw-talk" aria-labelledby="pwTalkH">
    <p class="eyebrow">${icon("families")} ${I.T("Optional · with my family", "Opcional · con mi familia")}</p>
    <h3 id="pwTalkH">${I.T("Talk about it at home", "Conversen en casa")}</h3>
    <p class="pw-talk-goal">
      <span lang="en">The goal: ${objective.student[0]} Use any language you speak at home.</span>
      <span lang="es" class="pw-talk-es">La meta: ${objective.student[1]} Usen cualquier idioma que hablen en casa.</span>
    </p>
    ${promptsHTML(objective, tick ? { used: tick.used, label: I.S("We used prompt", "Usamos la pregunta") } : null)}
    <p class="row-actions pw-noprint">
      ${tick
        ? html`<button type="button" class="btn" data-pw-talk-save>${tick.done ? I.T("Update: we talked about it", "Actualizar: conversamos") : I.T("We talked about it", "Conversamos sobre esto")}</button>`
        : ""}
      ${href ? html`<a class="btn" href="${href}">${I.T("Open my child’s pathway", "Abrir la ruta de mi hijo o hija")}</a>` : ""}
      <button type="button" class="btn ghost" data-print>${I.T("Print this card", "Imprimir esta tarjeta")}</button>
    </p>
    ${tick?.done ? html`<p class="pw-note is-ok" role="status">${I.T(`Saved: you talked about it on ${String(tick.done.t).slice(0, 10)}.`, `Guardado: conversaron el ${String(tick.done.t).slice(0, 10)}.`)}</p>` : ""}
    ${tick ? html`<p class="fine pw-noprint" id="pwTalkNote" role="status"></p>` : ""}
  </section>`;
}

/** Family hub: the conversation card for the pathway the child is on ("" when there is none). */
export function familyHubCardHTML(I, read) {
  const run = resumeRun(loadRuns(read));
  const objective = run && objectiveById(run.objective);
  if (!objective || !run.stages?.some((s) => s.kind === "family")) return "";
  return html`<section class="panel pw-family-hub">
    <p class="fine">${I.T(`Your child is on the pathway “${run.title?.[0] || objective.title[0]}”.`, `Su hijo o hija está en la ruta “${run.title?.[1] || objective.title[1]}”.`)}</p>
    ${familyCardHTML(I, objective, { href: run.back || "" })}
  </section>`;
}

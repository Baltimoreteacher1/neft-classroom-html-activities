// Language Quest UI helpers shared by every item renderer: the on-screen (unsaved) state, bilingual shorthands, the
// support ladder panel, the writing checklist and the character coach. Saved state lives in state.js; this module only
// holds what is on screen right now and resets when the mission changes.
import { html, icon, raw } from "../util.js";
import { RUNGS, RUNG_COPY, rungIndex } from "./engine.js";
import { portraitSVG } from "./art.js";

/** Transient: text being typed, the open object, a pending message. Never saved, reset on a new mission. */
export const ui = { mission: "", coach: null, text: {}, pick: {}, fb: {}, anim: "", ready: {} };
export function syncUi(missionId) {
  if (ui.mission === missionId) return;
  Object.assign(ui, { mission: missionId, coach: null, text: {}, pick: {}, fb: {}, anim: "", ready: {} });
}
export const resetUi = () => syncUi("");

export const bi = (I, p) => (p ? I.T(p.en, p.es) : "");
export const bs = (I, p) => (p ? I.S(p.en, p.es) : "");
export const calm = () => typeof document !== "undefined" && (document.documentElement.dataset.comfortMotion === "calm" || globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

/** Character lines are one source of truth, so every character behaves the same way in every mission. */
export const coachLine = (env, kind) => env.character.lines[kind];
export function say(env, kind, extra = null) {
  ui.coach = { kind, extra, mood: kind === "recognize" ? "cheer" : kind === "hint" || kind === "revise" ? "think" : kind === "elaborate" ? "ask" : "happy" };
}
export function coachHTML(env) {
  const { I, character } = env;
  const c = ui.coach || { kind: "intro", mood: "happy" };
  const line = character.lines[c.kind] || character.lines.intro;
  return html`<aside class="q-coach" aria-label="${I.S(`${character.name}, ${character.role.en}`, `${character.name}, ${character.role.es}`)}">
    <div class="q-coach-face q-pop-in">${raw(portraitSVG(character, c.mood, { w: 84 }))}</div>
    <div class="q-coach-body">
      <p class="q-coach-name"><strong>${character.name}</strong> <span class="fine">${bi(I, character.role)}</span></p>
      <p class="q-coach-say" role="status" aria-live="polite">${bi(I, line)}${c.extra ? html` <span class="q-coach-extra">${c.extra}</span>` : ""}</p>
    </div>
  </aside>`;
}

/** What a rung puts on screen for a writing or speaking item. The full-support rung shows the model AND the frame. */
export function rungText(item, rung) {
  const l = item.ladder || {};
  if (rung === "model") return [l.model, l.frame].filter(Boolean);
  if (rung === "frame") return [l.frame].filter(Boolean);
  if (rung === "partial") return [l.partial].filter(Boolean);
  if (rung === "cue") return [l.cue].filter(Boolean);
  return [];
}
export function rungPickerHTML(env) {
  const { I, run } = env;
  return html`<div class="q-rungs" role="radiogroup" aria-label="${I.S("How much support do you want?", "¿Cuánto apoyo quieres?")}">
    ${RUNGS.map((r, i) => html`<button type="button" class="q-rung ${run.rung === r ? "is-on" : ""}" role="radio" aria-checked="${String(run.rung === r)}" data-q-act="rung" data-rung="${r}"><span class="q-rung-n" aria-hidden="true">${i + 1}</span>${bi(I, RUNG_COPY[r])}</button>`)}
  </div>`;
}
export function supportHTML(env, item) {
  const { I, run } = env;
  const lines = rungText(item, run.rung);
  return html`<details class="q-support" ${run.rung !== "independent" ? html`open` : ""}>
    <summary>${icon("bulb")} ${I.T("Support", "Apoyo")} <span class="fine">· ${bi(I, RUNG_COPY[run.rung])}</span></summary>
    ${rungPickerHTML(env)}
    ${lines.length ? html`<div class="q-support-lines">${lines.map((t) => html`<p class="q-frame">${t}</p>`)}</div>` : html`<p class="fine">${I.T("You chose to work on your own. You can open more support at any time. It will be noted as extra support.", "Elegiste trabajar por tu cuenta. Puedes abrir más apoyo cuando quieras. Se anotará como apoyo adicional.")}</p>`}
    <button type="button" class="btn small" data-q-act="more-help" ${rungIndex(run.rung) === 0 ? "disabled" : ""}>${I.T("Ask for more help", "Pedir más ayuda")}</button>
  </details>`;
}

/** A writing checklist. Unmet lexical checks can be marked as met by the learner: the check may have missed a valid wording. */
export function checklistHTML(I, results, override = []) {
  if (!results) return "";
  return html`<ul class="q-checks" aria-label="${I.S("Checklist", "Lista de control")}">
    ${results.map((r) => html`<li class="q-check ${r.met ? "is-met" : "is-open"}">
      <span class="q-check-mark" aria-hidden="true">${r.met ? icon("check") : html`<span class="q-open-dot"></span>`}</span>
      <span class="q-check-text"><span class="visually-hidden">${r.met ? I.S("Done: ", "Hecho: ") : I.S("Not yet: ", "Aún no: ")}</span>${r.label}${r.required ? "" : html` <span class="fine">(${I.T("bonus", "extra")})</span>`}
        ${r.met && r.found?.length && !r.selfDeclared ? html`<small class="q-found">${I.T("I found:", "Encontré:")} ${r.found.slice(0, 3).join(", ")}</small>` : ""}
        ${r.selfDeclared ? html`<small class="q-found">${I.T("You marked this as done.", "Marcaste esto como hecho.")}</small>` : ""}
        ${!r.met && r.hint ? html`<small class="q-found">${r.hint}</small>` : ""}
        ${!r.met || r.selfDeclared ? html`<label class="q-self"><input type="checkbox" data-q-act="override" data-check="${r.id}" ${override.includes(r.id) ? html`checked` : ""} /> ${I.T("My writing does this. The checker may have missed it.", "Mi texto hace esto. Puede que el verificador no lo haya visto.")}</label>` : ""}</span>
    </li>`)}
  </ul>
  <p class="fine q-check-note">${I.T("This checklist looks for words and shape. It cannot judge your ideas.", "Esta lista busca palabras y forma. No puede juzgar tus ideas.")}</p>`;
}

/** The card every item sits in. */
export function itemShell(env, item, body, done, { title = "", kindLabel = "" } = {}) {
  const { I } = env;
  return html`<section class="q-item card ${done ? "is-done" : ""}" data-q-item="${item.id}" aria-labelledby="qi-${item.id}">
    <header class="q-item-head">
      <h3 id="qi-${item.id}">${title || kindLabel}</h3>
      <span class="q-item-state ${done ? "is-done" : ""}">${done ? html`${icon("check")} ${I.T("Done", "Hecho")}` : I.T("To do", "Por hacer")}</span>
    </header>
    <p class="q-prompt">${item.prompt}</p>
    ${body}
    <div class="q-item-tools"><button type="button" class="ghost small" data-q-act="hint">${icon("bulb")} ${I.T("Hint", "Pista")}</button></div>
  </section>`;
}

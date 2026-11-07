// Keyboarding warm-ups (/voice/keys/<set>): type academic sentence frames exactly, for the typed ACCESS Writing test
// (grades 4-8). Accuracy only: no clock, no speed, no words per minute.
import { KEY_FRAMES } from "../content/voice-lab.js";
import { checkTyping } from "../lang/keyboarding.js";
import { announce, html, icon, raw } from "../util.js";
import { loadVoice, markDone, saveVoice, voiceCrumbs } from "./voice-common.js";

const IGN = raw("data-nsr-ignore");
const drafts = new Map(); // `${set}:${i}` → typed text (this tab)
const checked = new Map(); // `${set}:${i}` → result of the last check
export const findKeySet = (id) => KEY_FRAMES.find((s) => s.id === id) || null;

function resultHTML(frame, r, I) {
  if (!r) return "";
  if (r.exact) return html`<p class="feedback is-right" role="status">${icon("check")} ${I.T("Exactly right, including capitals and punctuation.", "Exacto, incluidas las mayúsculas y la puntuación.")}</p>`;
  const where = r.firstDiff >= 0 ? frame.slice(Math.max(0, r.firstDiff - 8), r.firstDiff + 8) : "";
  return html`<div class="feedback is-wrong" role="status">
    <p>${I.T(`${r.right} of ${r.total} characters match.`, `${r.right} de ${r.total} caracteres coinciden.`)} ${where ? html`${I.T("Look near:", "Revisa cerca de:")} <code lang="en">${where}</code>` : ""}</p>
    <p class="fine">${I.T("Check capitals, spaces and the end mark, then check again.", "Revisa las mayúsculas, los espacios y el signo final, y vuelve a revisar.")}</p>
  </div>`;
}

export function keysHTML(ctx, I, id) {
  const set = findKeySet(id);
  if (!set) return null;
  const done = loadVoice().keys?.[id] || [];
  const title = I.T(`Keyboarding: ${set.title}`, `Teclado: ${set.titleEs}`);
  return {
    title: I.S(`Keyboarding: ${set.title}`, `Teclado: ${set.titleEs}`),
    html: html`${voiceCrumbs(I, ctx.band, title)}
      <article class="activity voice-page d-writing">
        <header class="act-head">
          <p class="act-context">${icon("writing")} ${I.T("Keyboarding warm-up · grades 4-8", "Calentamiento de teclado · grados 4 a 8")}</p>
          <h1 tabindex="-1">${title}</h1>
          <p class="lead">${I.T("ACCESS Writing is typed from grade 4. Type each frame exactly as it is written. Take your time: only accuracy counts here, never speed.", "La prueba de escritura de ACCESS se escribe en computadora desde 4.º grado. Escribe cada marco exactamente como está. Tómate tu tiempo: aquí solo cuenta la exactitud, nunca la velocidad.")}</p>
          <p class="fine">${I.T(`${done.length} of ${set.frames.length} frames typed exactly on this device.`, `${done.length} de ${set.frames.length} marcos escritos con exactitud en este dispositivo.`)}</p>
        </header>
        <ol class="voice-steps">
          ${set.frames.map((frame, i) => {
            const k = `${id}:${i}`;
            return html`<li class="panel voice-step ${done.includes(i) ? "is-done" : ""}">
              <p class="kb-target" lang="en" id="kb-t-${i}">${frame}</p>
              <label class="field"><span>${I.T(`Type frame ${i + 1}`, `Escribe el marco ${i + 1}`)}</span>
                <input type="text" class="kb-input" data-kb-type="${i}" aria-describedby="kb-t-${i}" autocomplete="off" autocapitalize="off" spellcheck="false" value="${drafts.get(k) || ""}" ${IGN} />
              </label>
              <div class="row-actions"><button type="button" class="btn" data-kb-check="${i}">${icon("check")} ${I.T("Check my typing", "Revisar lo que escribí")}</button></div>
              ${resultHTML(frame, checked.get(k), I)}
            </li>`;
          })}
        </ol>
      </article>`,
  };
}

export function keysInput(e, _ctx, _I, id) {
  const t = e.target;
  if (t.matches("[data-kb-type]")) drafts.set(`${id}:${t.dataset.kbType}`, t.value);
}

function check(ctx, I, set, i) {
  const k = `${set.id}:${i}`;
  const r = checkTyping(set.frames[i], drafts.get(k) || "");
  checked.set(k, r);
  if (r.exact) {
    const state = loadVoice();
    markDone(state, "keys", set.id, i);
    saveVoice(state);
  }
  announce(r.exact ? I.S("Exactly right.", "Exacto.") : I.S(`${r.right} of ${r.total} characters match.`, `${r.right} de ${r.total} caracteres coinciden.`));
  ctx.rerender();
}

export function keysClick(e, ctx, I, id) {
  const set = findKeySet(id);
  const b = e.target.closest("[data-kb-check]");
  if (!set || !b) return false;
  check(ctx, I, set, Number(b.dataset.kbCheck));
  return true;
}

/** Enter in a frame checks it. */
export function keysKey(e, ctx, I, id) {
  const set = findKeySet(id);
  if (!set || e.key !== "Enter" || !e.target.matches?.("[data-kb-type]")) return;
  e.preventDefault();
  check(ctx, I, set, Number(e.target.dataset.kbType));
}

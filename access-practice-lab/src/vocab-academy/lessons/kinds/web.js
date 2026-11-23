// Lesson D: build a word web. The center is a unit word; the branches show what the unit data says (similar, opposite,
// family) and the learner adds words of their own. Nothing is graded: it is thinking made visible, and it is saved.
import { html, toHtml } from "../../../util.js";

const BRANCH = [
  ["syn", "Similar words", "Palabras parecidas"],
  ["ant", "Opposite words", "Palabras opuestas"],
  ["fam", "Word family", "Familia de palabras"],
];
const given = (w, k) => (k === "syn" ? w.syn || [] : k === "ant" ? w.ant || [] : (w.family || []).map((f) => f.w));

function wordWeb(S, step, d, wordId) {
  const { I } = S;
  const w = S.word(wordId);
  const mine = d.mine?.[wordId] || {};
  return html`<section class="val-web" data-val-web="${wordId}" aria-labelledby="val-web-${wordId.replace(/\W/g, "-")}">
    <h3 id="val-web-${wordId.replace(/\W/g, "-")}" lang="en">${w.hw}</h3>
    <p lang="en" class="val-note">${w.def}</p>
    <div class="val-web-branches">
      ${BRANCH.map(([k, en, es]) => {
        const list = given(w, k);
        const own = mine[k] || [];
        return html`<div class="val-web-branch"><h4>${I.T(en, es)}</h4>
          ${list.length ? html`<ul lang="en">${list.map((x) => html`<li>${x}</li>`)}</ul>` : html`<p class="val-note">${I.T("The lesson lists none. Add one if you know one.", "La lección no lista ninguna. Agrega una si conoces alguna.")}</p>`}
          <ul class="val-web-own" lang="en" aria-label="${I.S("Your words", "Tus palabras")}">${own.map((x, i) => html`<li>${x} <button type="button" class="btn val-btn-ghost" data-val-web-remove="${wordId}|${k}|${i}" aria-label="${I.S("Remove", "Quitar")} ${x}">×</button></li>`)}</ul>
          <label class="val-field"><span>${I.T("Add your own", "Agrega la tuya")}</span>
            <span class="val-inline"><input type="text" data-val-web-input="${wordId}|${k}" maxlength="40" autocomplete="off" />
            <button type="button" class="btn val-btn" data-val-web-add="${wordId}|${k}">${I.T("Add", "Agregar")}</button></span></label></div>`;
      })}
    </div></section>`;
}

export function htmlOf(S, step) {
  const d = S.stepData(step.id);
  return html`<div class="val-webs"><p class="val-note">${S.I.T("Add at least one word of your own to each web. Your words stay on this device.", "Agrega al menos una palabra tuya a cada red. Tus palabras se quedan en este dispositivo.")}</p>
    ${step.wordIds.map((id) => wordWeb(S, step, d, id))}
    <p class="val-note" data-val-web-status role="status" aria-live="polite"></p></div>`;
}

export function mount(S, step, el) {
  const d = S.stepData(step.id);
  d.mine ||= {};
  const done = () => step.wordIds.every((id) => Object.values(d.mine[id] || {}).some((l) => l.length));
  const repaint = (focusSel) => {
    el.innerHTML = toHtml(htmlOf(S, step));
    if (focusSel) el.querySelector(focusSel)?.focus();
    if (done()) S.markDone(step.id);
  };
  S.on(el, "click", (e) => {
    const add = e.target.closest("[data-val-web-add]");
    const rm = e.target.closest("[data-val-web-remove]");
    if (add) {
      const [id, k] = add.dataset.valWebAdd.split("|");
      const input = el.querySelector(`[data-val-web-input="${id}|${k}"]`);
      const text = input.value.trim().replace(/\s+/g, " ");
      if (!text) {
        el.querySelector("[data-val-web-status]").textContent = S.I.S("Type a word first.", "Escribe una palabra primero.");
        input.focus();
        return;
      }
      ((d.mine[id] ||= {})[k] ||= []).push(text.slice(0, 40));
      S.save();
      repaint(`[data-val-web-input="${id}|${k}"]`);
    } else if (rm) {
      const [id, k, i] = rm.dataset.valWebRemove.split("|");
      d.mine[id][k].splice(Number(i), 1);
      S.save();
      repaint(`[data-val-web-input="${id}|${k}"]`);
    }
  });
  S.on(el, "keydown", (e) => {
    if (e.key === "Enter" && e.target.matches?.("[data-val-web-input]")) {
      e.preventDefault();
      el.querySelector(`[data-val-web-add="${e.target.dataset.valWebInput}"]`)?.click();
    }
  });
}

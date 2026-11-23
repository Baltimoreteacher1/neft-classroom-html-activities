// Lesson D: sort words into the authored meaning groups. Every word has radio buttons for the groups, so the sort works
// by keyboard, touch and screen reader with no dragging. A first check is practice; a second miss shows where the word goes.
import { html, toHtml } from "../../../util.js";
import { sayButton } from "../ui.js";

const rowState = (d, id) => (d.results || {})[id];

function rowHTML(S, step, wordId, d) {
  const { I } = S;
  const word = S.word(wordId);
  const r = rowState(d, wordId);
  const settled = r && (r.ok || r.revealed);
  const pick = d.picks?.[wordId];
  const group = step.groups.findIndex((g) => g.ids.includes(wordId));
  return html`<li class="val-sort-row ${settled ? (r.ok ? "is-right" : "is-reveal") : ""}" data-val-row="${wordId}">
    <fieldset class="val-choices" ${settled ? "disabled" : ""}>
      <legend><span class="val-q-word" lang="en">${word.hw}</span> <span class="val-pos">${word.pos}</span>
        ${S.sup.audio || S.early ? sayButton(I, word.hw, I.T("Hear it", "Escúchala")) : ""}</legend>
      <p class="val-note" lang="en">${word.def}</p>
      ${step.groups.map((g, gi) => html`<label class="val-choice ${settled && gi === group ? "is-right" : r && !r.ok && !r.revealed && pick === gi ? "is-wrong" : ""}"><input type="radio" name="val-sort-${wordId}" value="${gi}" ${pick === gi ? "checked" : ""} ${settled ? "disabled" : ""} /><span class="val-choice-text">${g.label}</span>
        ${settled && gi === group ? html`<span class="val-mark" aria-hidden="true">✓</span><span class="val-sr"> ${I.T("correct group", "grupo correcto")}</span>` : ""}</label>`)}
    </fieldset>
    ${r && !r.ok && !r.revealed ? html`<p class="val-feedback is-wrong" role="status"><span aria-hidden="true">↺</span> ${I.T("Not yet. Think about what this word means, then pick again.", "Todavía no. Piensa en qué significa esta palabra y elige otra vez.")}</p>` : ""}
    ${r?.revealed ? html`<p class="val-feedback is-reveal" role="status">${I.T("Here is how it works:", "Así funciona:")} <span lang="en">${word.hw}</span> ${I.T("goes with", "va con")} <strong>${step.groups[group].label}</strong>. <span lang="en">${word.def}</span></p>` : ""}
  </li>`;
}

export function htmlOf(S, step) {
  const { I } = S;
  const d = S.stepData(step.id);
  const ids = step.wordIds.filter((id, i, a) => a.indexOf(id) === i && S.word(id));
  return html`<div class="val-sort">
    <p class="val-note">${I.T("Pick the group each word belongs in. You can change your pick before you check.", "Elige el grupo donde va cada palabra. Puedes cambiar tu elección antes de comprobar.")}</p>
    <ol class="val-sort-list">${ids.map((id) => rowHTML(S, step, id, d))}</ol>
    <p class="val-actions"><button type="button" class="btn btn-primary val-btn" data-val-sort-check>${I.T("Check my sort", "Comprobar mi clasificación")}</button>
      <span class="val-note" data-val-sort-status role="status" aria-live="polite"></span></p>
  </div>`;
}

export function mount(S, step, el) {
  const d = S.stepData(step.id);
  d.picks ||= {};
  d.results ||= {};
  const ids = step.wordIds.filter((id, i, a) => a.indexOf(id) === i && S.word(id));
  const status = (msg) => {
    const n = el.querySelector("[data-val-sort-status]");
    if (n) n.textContent = msg;
  };
  const repaint = () => {
    const keep = document.activeElement?.dataset?.valSortCheck !== undefined;
    el.innerHTML = toHtml(htmlOf(S, step));
    if (keep) el.querySelector("[data-val-sort-check]")?.focus();
  };
  S.on(el, "change", (e) => {
    const r = e.target;
    if (!r.matches?.('input[type="radio"]')) return;
    const id = r.name.replace("val-sort-", "");
    d.picks[id] = Number(r.value);
    S.save();
  });
  S.on(el, "click", (e) => {
    if (!e.target.closest("[data-val-sort-check]")) return;
    // Read the picks from the DOM so a pick made just before the click is never lost.
    el.querySelectorAll('input[type="radio"]:checked').forEach((r) => {
      d.picks[r.name.replace("val-sort-", "")] = Number(r.value);
    });
    const open = ids.filter((id) => !(d.results[id]?.ok || d.results[id]?.revealed));
    const unpicked = open.filter((id) => d.picks[id] === undefined);
    if (unpicked.length) {
      status(S.I.S(`Pick a group for ${unpicked.length} more word${unpicked.length === 1 ? "" : "s"} first.`, `Elige un grupo para ${unpicked.length} palabra(s) más primero.`));
      return;
    }
    for (const id of open) {
      const gi = step.groups.findIndex((g) => g.ids.includes(id));
      const ok = d.picks[id] === gi;
      const prev = d.results[id] || { tries: 0 };
      if (!prev.tries) S.evidence({ wordId: id, dim: "mean", ok, type: "lesson-d" });
      const tries = prev.tries + 1;
      d.results[id] = { ok, tries, revealed: !ok && tries >= 2 };
    }
    const settled = ids.filter((id) => d.results[id]?.ok || d.results[id]?.revealed).length;
    if (settled === ids.length) S.markDone(step.id);
    S.persist();
    repaint();
    status(settled === ids.length ? S.I.S("Sort finished. Nice work.", "Clasificación terminada. Buen trabajo.") : S.I.S(`${settled} of ${ids.length} words placed. Try the others again.`, `${settled} de ${ids.length} palabras colocadas. Intenta otra vez con las demás.`));
  });
}

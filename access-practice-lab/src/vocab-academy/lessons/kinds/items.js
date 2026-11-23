// Steps that run a list of choice items one at a time (lessons B, C, D, F). Resumes where the learner stopped.
import { html } from "../../../util.js";
import { mountItems } from "../item-ui.js";
import { passageHTML, isEarly } from "../ui.js";

export function htmlOf(S, step) {
  const { I } = S;
  const d = S.stepData(step.id);
  return html`<div class="val-items-step">
    ${step.passage && S.unit.passage?.paras?.length ? html`<details class="val-passage-ref" ${isEarly(S.unit) ? "" : "open"}><summary>${I.T("Show the passage", "Mostrar la lectura")}: ${S.unit.passage.title}</summary><div class="val-passage">${passageHTML(S.unit, { tappable: false })}</div></details>` : ""}
    ${step.adaptive ? html`<p class="val-note">${I.T("These questions come from the words that need the most practice. A few older words are mixed in to keep them fresh.", "Estas preguntas vienen de las palabras que más práctica necesitan. Se mezclan algunas palabras anteriores para mantenerlas frescas.")}</p>` : ""}
    <div data-val-runner></div>
  </div>`;
}

export function mount(S, step, el) {
  const d = S.stepData(step.id);
  const run = mountItems(el.querySelector("[data-val-runner]"), {
    items: step.items,
    I: S.I,
    audio: S.sup.audio || S.early,
    saved: d.results || {},
    startAt: d.idx || 0,
    onResult: (item, r) => {
      if (!item.wordId) return;
      S.evidence({ wordId: item.wordId, dim: item.dim, ok: r.ok, type: item.review ? "review" : `lesson-${S.letter}`, unitId: item.unitId });
    },
    onResolved: (item, r) => {
      d.results = { ...(d.results || {}), [item.id]: { ok: r.ok, tries: r.tries, revealed: Boolean(r.revealed) } };
      d.idx = step.items.findIndex((x) => x.id === item.id) + 1;
      S.save();
    },
    onDone: () => S.markDone(step.id),
  });
  S.cleanups.push(() => run.destroy());
}

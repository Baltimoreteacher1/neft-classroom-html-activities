// Exercise E (section f) reader step — mounts the shared interactive reader (reading/player.js) in lesson mode, keeping
// saved marks, notes and read-along state in progress.reading[<passageId>] and recording lesson completion cleanly.
import { html } from "../../../util.js";
import { vaHref } from "../../data.js";
import { normalizeReading, readingId, readingLabel } from "../../reading/ids.js";
import { cleanReadingState } from "../../reading/marks.js";
import { mountReader } from "../../reading/player.js";
import { sayButton } from "../ui.js";

export function htmlOf(S) {
  const { I, unit } = S;
  const p = unit.passage;
  if (!p?.paras?.length) {
    return html`<div class="val-reader">
      <p class="val-note">${I.T("This lesson does not have a reading passage yet.", "Esta lección todavía no tiene una lectura.")}</p>
    </div>`;
  }
  return html`<div class="val-reader" data-val-reader-host></div>`;
}

export function mount(S, step, el) {
  const host = el.querySelector("[data-val-reader-host]");
  if (!host || !S.unit.passage?.paras?.length) return;
  const id = readingId(S.grade, S.unit.n, "passage");
  const reading = normalizeReading(S.unit.passage, { unit: S.unit, kind: "passage" });
  const state = cleanReadingState(S.progress.reading?.[id]);
  const player = mountReader(host, {
    reading,
    words: S.unit.words || [],
    I: S.I,
    sup: S.sup,
    band: S.band,
    early: S.early,
    state,
    label: readingLabel("passage"),
    lessonMode: true,
    lessonDone: S.isDone(step.id),
    fullHref: vaHref("read", id),
    onChange: (next) => {
      S.progress.reading ||= {};
      S.progress.reading[id] = cleanReadingState(next);
      S.save();
    },
    onRecord: (plan) => {
      for (const item of plan || []) {
        S.deps.model.recordResult(S.progress, item.wordId, {
          dim: item.dim,
          correct: item.correct,
          heavy: Boolean(S.sup?.readAloud),
        });
      }
      S.save();
    },
    onLessonDone: () => {
      S.markDone(step.id);
      S.announce(S.I.S("Saved. You can go on to the questions.", "Guardado. Puedes pasar a las preguntas."));
    },
  });
  S.cleanups.push(() => player?.destroy?.());
}

export { sayButton };

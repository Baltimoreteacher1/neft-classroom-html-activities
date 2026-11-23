// vocab-quest screens around the items: quest map, stage intro, stage end and the debrief. DOM only.
import { h } from "../../core/dom.js";
import { reflectionBlock } from "../engine-core.js";
import { btn } from "../e4-kit.js";
import { spanishOf } from "./quest-item.js";

const head = (text) => h("h2", { class: "st-vq-h", "data-focus": "" }, text);

/** The quest map: progress is words shown per stage, never points. */
export function mapScreen({
  activity,
  session,
  summaries,
  dueCount,
  resuming,
  onStart,
  onResume,
  onRestart,
}) {
  const h2 = head(activity.title);
  const next = session.stages.findIndex((_, i) => !session.isDone(i));
  const items = session.stages.map((s, i) => {
    const done = session.isDone(i);
    const state = done ? "Done" : i === next ? "Open" : "Locked";
    const sum = summaries[i];
    const words = s.entryIds?.length ?? session.allEntryIds().length;
    return h(
      "li",
      {
        class: "st-vq-stage",
        "data-state": state.toLowerCase(),
        "aria-current": i === next ? "step" : null,
      },
      h("h3", {}, `${i + 1}. ${s.title}`),
      h(
        "p",
        { class: "st-vq-stagestate" },
        h("strong", {}, state),
        sum
          ? ` ${sum.demonstrated} of ${sum.total} shown without moving on.`
          : ` ${words} ${words === 1 ? "word" : "words"}.`,
      ),
      h("p", { class: "st-note" }, s.intro),
    );
  });
  const el = h(
    "section",
    { class: "st-vq-card st-vq-map", "aria-label": "Quest map" },
    h2,
    h("p", {}, activity.intro),
    dueCount > 0
      ? h(
          "p",
          { class: "st-note", role: "status" },
          `${dueCount} ${dueCount === 1 ? "word is" : "words are"} due from earlier practice on this device. They come back in the last stage.`,
        )
      : null,
    h("ol", { class: "st-vq-stages" }, items),
    h(
      "p",
      { class: "st-note" },
      "Each stage opens when you have shown you know its words. There is no timer, no points and no ranking. Hints are always there.",
    ),
    h(
      "div",
      { class: "st-e4-actions" },
      resuming
        ? btn("Continue my quest", "primary", onResume)
        : btn(next === 0 ? "Start the quest" : "Open the next stage", "primary", () =>
            onStart(next),
          ),
      resuming ? btn("Start over", "st-btn-quiet", onRestart) : null,
    ),
  );
  return { el, focus: () => h2.focus() };
}

export function stageIntro({ stage, entries, ctx, onStart, onBack }) {
  const h2 = head(stage.title);
  const el = h(
    "section",
    { class: "st-vq-card", "aria-label": stage.title },
    h2,
    h("p", {}, stage.intro),
    entries.length
      ? h(
          "ul",
          { class: "st-wordbank st-vq-words", "aria-label": "Words in this stage" },
          entries.map((e) =>
            h(
              "li",
              {},
              h(
                "button",
                {
                  type: "button",
                  class: "st-chip",
                  onclick: () => ctx.speak(e.word),
                  "aria-label": `Hear ${e.word}`,
                },
                e.word,
              ),
            ),
          ),
        )
      : null,
    h(
      "div",
      { class: "st-e4-actions" },
      btn("Start this stage", "primary", onStart),
      btn("Back to the map", "st-btn-quiet", onBack),
    ),
  );
  return { el, focus: () => h2.focus() };
}

export function stageEnd({ stage, end, entriesById, onContinue, onReplay }) {
  const { res, canReplay } = end;
  const h2 = head(`${stage.title}: done`);
  const missed = res.retry
    .map((id) => entriesById.get(String(id).split(".").pop())?.word)
    .filter(Boolean);
  const line = res.passed
    ? `You showed ${res.demonstrated} of ${res.total} without moving on. The next stage is open.`
    : canReplay
      ? `You showed ${res.demonstrated} of ${res.total}. Try the ${res.retry.length} you have not shown yet once more before moving on.`
      : `You showed ${res.demonstrated} of ${res.total}. The next stage is open, and these words will come back at the end.`;
  const el = h(
    "section",
    { class: "st-vq-card", "aria-label": "Stage finished" },
    h2,
    h("p", {}, line),
    missed.length
      ? h("p", { class: "st-note" }, `Still growing: ${[...new Set(missed)].join(", ")}.`)
      : null,
    h(
      "div",
      { class: "st-e4-actions" },
      canReplay
        ? btn(`Practice ${res.retry.length} again`, "primary", onReplay)
        : btn("Continue", "primary", onContinue),
      canReplay ? null : null,
    ),
  );
  return { el, focus: () => h2.focus() };
}

/** Debrief: every word is "secure" (all items clean) or "needs more practice", with what was used. */
export function debrief({ activity, ctx, words, entriesById, onFinish }) {
  const h2 = head("Your words");
  const block = reflectionBlock(ctx, activity.reflection);
  const rows = words.map((w) => {
    const e = entriesById.get(w.entryId);
    const es = spanishOf(e);
    const esEl = h(
      "span",
      { class: "st-vq-es", lang: "es", hidden: true },
      es ? ` ${es.word}: ${es.def}` : "",
    );
    const used = [
      w.hints ? `${w.hints} ${w.hints === 1 ? "hint" : "hints"}` : null,
      w.tries > 1 ? `${w.tries} tries` : null,
    ]
      .filter(Boolean)
      .join(", ");
    return h(
      "li",
      { class: "st-vq-word", "data-state": w.secure ? "secure" : "practice" },
      h("strong", {}, e.word),
      h("span", { class: "st-vq-tag" }, w.secure ? "Secure" : "Needs more practice"),
      used ? h("span", { class: "st-note" }, ` Used: ${used}.`) : null,
      es
        ? btn(
            "Spanish",
            "",
            function () {
              esEl.hidden = !esEl.hidden;
              this.setAttribute("aria-pressed", String(!esEl.hidden));
            },
            { "aria-pressed": "false", "aria-label": `Show ${e.word} in Spanish` },
          )
        : null,
      esEl,
    );
  });
  const el = h(
    "section",
    { class: "st-vq-card st-vq-debrief", "aria-label": "Debrief" },
    h2,
    h(
      "p",
      {},
      "Secure means every question on that word was answered the first time without a hint. Needs more practice is a next step, not a grade.",
    ),
    h("ul", { class: "st-vq-wordlist" }, rows),
    block.el,
    h(
      "div",
      { class: "st-e4-actions" },
      btn("Save and finish", "primary", () => onFinish(block.value())),
    ),
  );
  return { el, focus: () => h2.focus() };
}

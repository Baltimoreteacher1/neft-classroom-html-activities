// One vocab-quest item: optional "meet the word" card, then the question, hint ladder, misconception feedback,
// worked model after the third miss, and "Move on". Hints never state the word; checking is done by quest-logic.
import { h } from "../../core/dom.js";
import { btn, visualEl } from "../e4-kit.js";
import { checkItem } from "./quest-logic.js";
import { missFeedback } from "./quest-feedback.js";
import { choiceControl, partsControl, typeControl, writeControl } from "./quest-controls.js";

const CHOICE_KINDS = ["picture-word", "meaning", "cloze", "sentence-choice"];

/** Verified Spanish only: an unverified or incomplete entry never renders. */
export const spanishOf = (e) => (e?.es?.verified === true && e.es.word && e.es.def ? e.es : null);

export function studyCard(entry, ctx, { onContinue, label }) {
  const es = spanishOf(entry);
  const head = h("h2", { class: "st-vq-h", "data-focus": "" }, `Meet the word: ${entry.word}`);
  const esBox = h(
    "p",
    { class: "st-vq-es", hidden: true },
    es ? h("span", { lang: "es" }, `${es.word}: ${es.def}`) : "",
  );
  const el = h(
    "section",
    { class: "st-vq-card st-vq-study", "aria-label": `Meet the word ${entry.word}` },
    head,
    h(
      "p",
      { class: "st-vq-wordline" },
      h("strong", {}, entry.word),
      ` (${entry.pos}) `,
      h("span", { class: "st-note" }, entry.pron),
    ),
    h("p", {}, entry.def),
    h("p", {}, h("strong", {}, "In a sentence: "), entry.context),
    entry.everyday ? h("p", {}, h("strong", {}, "In everyday life: "), entry.everyday) : null,
    entry.nonExample ? h("p", {}, h("strong", {}, "Not this: "), entry.nonExample) : null,
    esBox,
    h(
      "div",
      { class: "st-e4-actions" },
      btn("Hear the word", "", () => ctx.speak(entry.word), {
        "aria-label": `Hear the word ${entry.word}`,
      }),
      btn("Hear the sentence", "", () => ctx.speak(entry.context)),
      es
        ? btn(
            "Show in Spanish",
            "",
            function () {
              esBox.hidden = !esBox.hidden;
              this.setAttribute("aria-pressed", String(!esBox.hidden));
            },
            { "aria-pressed": "false" },
          )
        : null,
      btn(label, "primary", onContinue),
    ),
  );
  return { el, focus: () => head.focus() };
}

/**
 * renderItem({item, entry, entries, ctx, tier, restore, onSettled(record, movedOn), onNext, onChange(loopState)})
 * -> {el, focus}
 */
export function renderItem(o) {
  const { item, entry, entries, ctx, tier } = o;
  const loop = ctx.loop(
    { id: item.id, hints: item.hints, model: item.model, right: item.why, misconceptions: [] },
    { maxTries: 3 },
  );
  if (o.restore) Object.assign(loop.state, o.restore);
  const fb = ctx.feedback();
  const head = h("h2", { class: "st-vq-h", "data-focus": "" }, item.prompt);
  let control;
  if (CHOICE_KINDS.includes(item.kind)) control = choiceControl({ item, ctx, entries, tier });
  else if (item.kind === "type-word")
    control = typeControl({ item, tier, hintsUsed: () => loop.state.hints });
  else if (item.kind === "word-parts") control = partsControl({ item, ctx });
  else control = writeControl({ item, ctx, tier });

  let settled = false;
  const sentence = item.sentence ? h("p", { class: "st-vq-sentence" }, item.sentence) : null;
  const def = item.definition
    ? h("p", { class: "st-vq-def" }, h("strong", {}, "Meaning: "), item.definition)
    : null;
  const vis = item.visual ? visualEl(item.visual) : null;
  const check = btn("Check", "primary", onCheck);
  const hint = btn("Hint", "", onHint);
  const next = btn("Next", "primary", () => o.onNext?.());
  const moveOn = btn("Move on", "st-btn-quiet", () => {
    settle(true);
    o.onNext?.();
  });
  next.hidden = moveOn.hidden = true;
  check.disabled = !control.ready();
  control.onReady((r) => {
    if (!settled) check.disabled = !r;
  });
  if (loop.state.tries >= 3 && !loop.state.ok) moveOn.hidden = false;

  const settle = (movedOn) => {
    if (settled) return;
    settled = true;
    o.onSettled({ ...loop.record(), movedOn: !!movedOn }, !!movedOn);
  };
  function lockAfter() {
    check.hidden = hint.hidden = true;
    control.lock(true);
  }
  function onHint() {
    const t = loop.nextHint();
    if (t) {
      fb.show("hint", t);
      ctx.announce(`Hint. ${t}`);
    }
    control.refreshBank?.();
    o.onChange?.({ ...loop.state });
  }
  function onCheck() {
    const resp = control.resp();
    const chk = checkItem(item, resp);
    if (!chk.complete) {
      fb.show("hint", chk.message);
      ctx.announce(chk.message);
      return;
    }
    if (chk.ok) {
      const r = loop.submit({ ok: true });
      fb.show("right", r.text);
      ctx.announce(`Correct. ${r.text}`);
      lockAfter();
      next.hidden = false;
      moveOn.hidden = true;
      o.onChange?.({ ...loop.state });
      settle(false);
      next.focus();
      return;
    }
    const miss = missFeedback(item, resp, chk, entries);
    const r = loop.submit({ ok: false, pick: resp, tag: miss.tag });
    const text = r.kind === "model" ? `${miss.text} ${miss.model || r.text}` : miss.text;
    fb.show(r.kind === "model" ? "model" : "retry", text);
    ctx.announce(text);
    control.wrong?.(typeof resp === "number" ? resp : undefined);
    if (r.kind === "model") moveOn.hidden = false;
    o.onChange?.({ ...loop.state });
  }

  const form = h("form", {
    class: "st-vq-form",
    onsubmit: (e) => (e.preventDefault(), !check.disabled && !check.hidden && onCheck()),
  });
  form.append(control.el, fb.el, h("div", { class: "st-e4-actions" }, check, hint, moveOn, next));
  const card = h(
    "section",
    { class: "st-vq-card", "aria-label": "Question" },
    head,
    vis,
    sentence,
    def,
    form,
  );
  return { el: card, focus: () => head.focus(), loop };
}

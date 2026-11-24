// exit_check — 2-3 multiple-choice items, then a can-do self-rating (with help / by myself / and I can teach it).
// The rating is stored on this device only (localStorage via storeSet, key bcpss-lesson:<id>:rating).
import { storeGet, storeSet } from "../studio-core.js";
import { h } from "./_kit.js";
import { choiceStage, slBtn, startKind } from "./_audio.js";

export const RATINGS = [
  { id: "with_help", label: "With help" },
  { id: "by_myself", label: "By myself" },
  { id: "can_teach", label: "And I can teach it" },
];

/** Where the rating lives: the lesson id if the shell gives one, else the unit, else a fixed fallback. */
export const ratingKey = (ctx) =>
  `bcpss-lesson:${ctx.lessonId || ctx.lesson?.id || ctx.activity?.lesson_id || ctx.unitId || ctx.unit?.id || "lesson"}:rating`;

export default function mount(root, ctx) {
  const kit = startKind(root, ctx, "exit_check");
  const { items, can_do: canDo } = ctx.payload;
  let pos = 0;
  let missed = 0;
  const stage = h("div", { class: "sl-stage" });
  const dots = kit.dots(items.length + 1, "Progress");
  root.append(h("div", { class: "sg-topbar" }, dots.el), stage);

  function ask() {
    const it = items[pos];
    items.forEach((_, k) => dots.set(k, k < pos ? "ok" : k === pos ? "now" : ""));
    dots.label(`Question ${pos + 1} of ${items.length}`);
    const prompt = h("h3", { class: "sl-prompt", tabindex: "-1", "data-focus": "", text: it.q });
    const choice = choiceStage(kit, {
      options: it.options,
      answer: it.answer,
      why: it.why,
      label: it.q,
      retry: "Not this one yet. Read the question again, then try another choice.",
      nextLabel: "Next",
      onNext: ({ wrong }) => {
        if (wrong) missed++;
        pos++;
        if (pos < items.length) ask();
        else rate();
      },
    });
    stage.replaceChildren(h("p", { class: "sl-count", text: `Question ${pos + 1} of ${items.length}` }), prompt, choice.el);
    prompt.focus({ preventScroll: true });
  }

  function rate() {
    items.forEach((_, k) => dots.set(k, "ok"));
    dots.set(items.length, "now");
    dots.label("Last step: how sure do you feel?");
    const key = ratingKey(ctx);
    let chosen = storeGet(key)?.rating || null;
    const fb = kit.feedback("Pick the one that is true for you today. There is no wrong answer.");
    const prompt = h("h3", { class: "sl-prompt", id: "slCanDo", tabindex: "-1", "data-focus": "", text: canDo });
    const finish = slBtn("Finish", { primary: true, key: "finish", disabled: true });
    const buttons = RATINGS.map((r) => {
      const b = slBtn(r.label, { key: r.id, cls: "sl-rating", pressed: chosen === r.id });
      b.addEventListener("click", () => {
        chosen = r.id;
        storeSet(key, { rating: r.id, can_do: canDo, at: new Date().toISOString().slice(0, 10) });
        for (const [k, other] of buttons.entries()) other.setAttribute("aria-pressed", String(RATINGS[k].id === chosen));
        finish.disabled = false;
        fb.set(`Saved on this device: ${r.label.toLowerCase()}. You can change it before you finish.`, "ok");
      });
      return b;
    });
    finish.disabled = !chosen;
    finish.addEventListener("click", () => {
      const label = RATINGS.find((r) => r.id === chosen)?.label.toLowerCase();
      kit.finish(missed, items.length, `${items.length - missed} of ${items.length} right on the first try. You can do it ${label}.`);
    });
    stage.replaceChildren(
      h("p", { class: "sl-count", text: "How sure do you feel?" }),
      prompt,
      h("div", { class: "sl-ratings", role: "group", "aria-labelledby": "slCanDo" }, ...buttons),
      fb.el,
      h("p", { class: "sl-note", text: "Your answer stays on this device. It is not sent anywhere." }),
      h("div", { class: "sg-actions" }, finish),
    );
    prompt.focus({ preventScroll: true });
  }

  ask();
  return () => kit.destroy();
}

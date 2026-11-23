// The step-by-step flow used by interactive activities, quick checks, worksheets (digital version) and the
// plain list version of every game: content, then one question at a time, then the finish screen.

import { renderBlocks } from "./blocks.js";
import { mountQuestion } from "./question.js";
import { h } from "./util.js";

const REFERENCE = new Set(["passage", "vocab", "image", "table", "math", "audio"]);

/** Split blocks into steps: the content before a question travels with it. */
export function buildSteps(activity) {
  const steps = [];
  let content = [];
  for (const b of activity.blocks) {
    if (b.type === "note") continue;
    if (b.type === "question") {
      steps.push({ content, question: b });
      content = [];
    } else content.push(b);
  }
  if (content.length || !steps.length) steps.push({ content, question: null });
  return steps;
}

export function mountFlow(stage, ctx, { start = 0, onFinish } = {}) {
  const steps = buildSteps(ctx.activity);
  const total = steps.filter((s) => s.question).length;
  const bar = h("progress", { class: "sp-progress", max: String(Math.max(total, 1)), value: "0", "aria-label": ctx.t("progressLabel") });
  const barText = h("span", { class: "sp-progress-text" });
  const host = h("div", { class: "sp-step" });
  const nav = h("div", { class: "sp-editnav" });
  stage.replaceChildren(h("div", { class: "sp-flow" }, h("div", { class: "sp-progress-row" }, bar, barText), host, ctx.editMode ? nav : null));
  let at = -1;
  let destroyed = false;

  const doneCount = () => steps.filter((s) => s.question && ctx.session.isDone(s.question)).length;
  const paintProgress = () => {
    bar.value = doneCount();
    barText.textContent = ctx.t("doneOf", { n: doneCount(), total });
  };

  function show(i, focus = true) {
    if (destroyed) return;
    at = Math.min(Math.max(i, 0), steps.length - 1);
    const step = steps[at];
    host.replaceChildren();
    if (at > 0) {
      const refs = steps
        .slice(0, at)
        .flatMap((s) => s.content)
        .filter((b) => REFERENCE.has(b.type) && !step.content.includes(b))
        .slice(-4);
      if (refs.length && step.question)
        host.append(h("details", { class: "sp-ref" }, h("summary", null, ctx.t("lookBack")), renderBlocks(refs, ctx)));
    }
    if (step.content.length) host.append(h("div", { class: "sp-content" }, renderBlocks(step.content, ctx)));
    const last = at === steps.length - 1;
    const advance = () => (last ? onFinish?.() : show(at + 1));
    let q = null;
    if (step.question) {
      q = mountQuestion(host, step.question, ctx, {
        index: steps.slice(0, at + 1).filter((s) => s.question).length - 1,
        total,
        last,
        onDone: paintProgress,
        onNext: advance,
      });
    } else {
      const btn = h("button", { type: "button", class: "sp-btn sp-btn-primary" }, ctx.msg(last ? "finish" : "next"));
      btn.addEventListener("click", advance);
      host.append(h("div", { class: "sp-next-row" }, btn));
    }
    paintNav();
    paintProgress();
    ctx.state.step = at;
    if (focus) (q ? q.focus() : ctx.focus(host.querySelector("button")));
    if (focus) host.scrollIntoView?.({ block: "start", behavior: "auto" });
  }

  function paintNav() {
    if (!ctx.editMode) return;
    const back = h("button", { type: "button", class: "sp-btn sp-btn-quiet", disabled: at === 0 }, ctx.msg("back"));
    const next = h("button", { type: "button", class: "sp-btn sp-btn-quiet", disabled: at === steps.length - 1 }, ctx.msg("next"));
    back.addEventListener("click", () => show(at - 1));
    next.addEventListener("click", () => show(at + 1));
    nav.replaceChildren(back, h("span", { class: "sp-progress-text" }, `${at + 1} / ${steps.length}`), next);
  }

  show(start, false);

  return {
    /** Show the step holding this block id and focus the block. */
    goto(blockId) {
      const i = steps.findIndex((s) => s.question?.id === blockId || s.content.some((b) => b.id === blockId));
      if (i < 0) return false;
      if (i !== at) show(i, false);
      const node = [...stage.querySelectorAll("[data-block-id]")].find((n) => n.dataset.blockId === blockId);
      node?.scrollIntoView?.({ block: "center", behavior: "auto" });
      node?.focus?.({ preventScroll: true });
      return true;
    },
    destroy() {
      destroyed = true;
    },
  };
}

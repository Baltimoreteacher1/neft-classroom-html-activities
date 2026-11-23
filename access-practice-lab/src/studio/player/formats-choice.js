// choice, multi and error: pick from options with real radios/checkboxes (native keyboard behavior).

import { clearMarks, mark } from "./marks.js";
import { h, nid, rt, seeded, shuffled } from "./util.js";

const LETTERS = "ABCDEFGH";

function group({ ctx, legend, options, type, order }) {
  const name = nid("grp");
  const set = h("fieldset", { class: "sp-options" }, h("legend", { class: "sp-sr" }, legend));
  const inputs = new Map();
  order.forEach((o, i) => {
    const input = h("input", { type, name, value: o.id, class: "sp-check" });
    const label = h(
      "label",
      { class: "sp-option" },
      input,
      h("span", { class: "sp-letter", "aria-hidden": "true" }, LETTERS[i] || String(i + 1)),
      rt("span", "sp-opt-text", o.text),
    );
    inputs.set(o.id, input);
    set.append(label);
  });
  return { set, inputs, ctx };
}

const picked = (g) => [...g.inputs].filter(([, i]) => i.checked).map(([id]) => id);
const lockGroup = (g, on) => {
  for (const i of g.inputs.values()) i.disabled = on;
};
const labelOf = (g, id) => g.inputs.get(id)?.closest("label");

export function buildChoice(q, ctx) {
  const order = ctx.options.shuffle ? shuffled(q.options, seeded(q.id)) : q.options;
  const g = group({ ctx, legend: ctx.t("chooseOne"), options: q.options, type: "radio", order });
  return {
    el: g.set,
    get: () => picked(g)[0] || "",
    lock: (on) => lockGroup(g, on),
    focus: () => g.set.querySelector("input")?.focus(),
    mark(result) {
      clearMarks(g.set);
      const id = picked(g)[0];
      if (!id) return;
      if (result.status === "correct") mark(labelOf(g, id), "right", ctx);
      else if (result.status === "incorrect") mark(labelOf(g, id), "wrong", ctx);
    },
  };
}

export function buildMulti(q, ctx) {
  const order = ctx.options.shuffle ? shuffled(q.options, seeded(q.id)) : q.options;
  const g = group({ ctx, legend: ctx.t("chooseAll"), options: q.options, type: "checkbox", order });
  const note = h("p", { class: "sp-note-small" }, ctx.t("chooseAllNote", { n: q.answers.length }));
  return {
    el: h("div", null, g.set, note),
    get: () => picked(g),
    lock: (on) => lockGroup(g, on),
    focus: () => g.set.querySelector("input")?.focus(),
    mark(result) {
      clearMarks(g.set);
      if (result.status === "correct") for (const id of picked(g)) mark(labelOf(g, id), "right", ctx);
    },
  };
}

export function buildError(q, ctx) {
  const stepOrder = q.steps;
  const steps = group({ ctx, legend: ctx.t("errorStepLegend"), options: q.steps, type: "radio", order: stepOrder });
  const fixOrder = ctx.options.shuffle ? shuffled(q.fixOptions, seeded(q.id)) : q.fixOptions;
  const fixes = group({ ctx, legend: ctx.t("errorFixLegend"), options: q.fixOptions, type: "radio", order: fixOrder });
  steps.set.querySelectorAll(".sp-letter").forEach((n, i) => {
    n.classList.add("sp-letter-line");
    n.textContent = String(i + 1);
  });
  const el = h(
    "div",
    { class: "sp-error" },
    h("p", { class: "sp-subhead" }, ctx.t("errorStepHead")),
    steps.set,
    h("p", { class: "sp-subhead" }, ctx.t("errorFixHead")),
    fixes.set,
  );
  return {
    el,
    get: () => ({ step: picked(steps)[0] || "", fix: picked(fixes)[0] || "" }),
    lock(on) {
      lockGroup(steps, on);
      lockGroup(fixes, on);
    },
    focus: () => steps.set.querySelector("input")?.focus(),
    mark(result) {
      clearMarks(el);
      const step = picked(steps)[0];
      const fix = picked(fixes)[0];
      if (result.status === "correct") {
        mark(labelOf(steps, step), "right", ctx);
        mark(labelOf(fixes, fix), "right", ctx);
      } else if (result.part === "step" && step) mark(labelOf(steps, step), "wrong", ctx);
      else if (result.status === "partial" && step) mark(labelOf(steps, step), "right", ctx);
      else if (result.part === "fix" && fix) mark(labelOf(fixes, fix), "wrong", ctx);
    },
  };
}

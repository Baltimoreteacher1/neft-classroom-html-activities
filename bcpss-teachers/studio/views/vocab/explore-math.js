// Math template: change a quantity, watch the visual spec re-render, match the language to the representation.
import { announce, h } from "../../core/dom.js";
import { bindSpec, deriveMath, deriveExamples, evalExpr, fillTemplate } from "./explore-model.js";
import { choiceTask, exampleSort, feedbackLine, panel, useWord } from "./explore-common.js";
import { visualFigure, visualSvg } from "./visual.js";
import { uid } from "./ui.js";

const truthy = (expr, vars) => {
  try {
    return !!evalExpr(expr, vars);
  } catch {
    return false;
  }
};

function control(v, vars, onChange) {
  const id = uid("rng");
  const out = h("output", { class: "st-v-out", for: id }, String(vars[v.id]));
  const input = h("input", { id, type: "range", min: String(v.min), max: String(v.max), step: String(v.step || 1), value: String(vars[v.id]), "aria-valuetext": `${v.label}: ${vars[v.id]}${v.unit ? ` ${v.unit}` : ""}` });
  const set = (n) => {
    const x = Math.min(v.max, Math.max(v.min, n));
    input.value = String(x);
    vars[v.id] = Number(x);
    out.textContent = String(vars[v.id]);
    input.setAttribute("aria-valuetext", `${v.label}: ${vars[v.id]}${v.unit ? ` ${v.unit}` : ""}`);
    onChange();
  };
  input.addEventListener("input", () => set(Number(input.value)));
  const step = v.step || 1;
  return h(
    "div",
    { class: "st-v-control" },
    h("label", { for: id, class: "st-v-label" }, v.label, " ", out, v.unit ? ` ${v.unit}` : ""),
    h("div", { class: "st-v-stepperrow" }, h("button", { class: "st-v-btn st-v-sq", type: "button", "aria-label": `Decrease ${v.label}`, onclick: () => set(vars[v.id] - step) }, "-"), input, h("button", { class: "st-v-btn st-v-sq", type: "button", "aria-label": `Increase ${v.label}`, onclick: () => set(vars[v.id] + step) }, "+")),
  );
}

export function mountMath(host, { collection, entry: e }) {
  const m = deriveMath(e);
  const examples = deriveExamples(e);
  const panels = [];
  if (!m?.vars?.length || !m.spec) {
    // No quantity to vary: still a real interaction with the representation and the word.
    if (e.visual) panels.push(panel("Look at the representation", `Describe what the picture shows about ${e.word}.`, visualFigure(e.visual, { cls: "st-v-fig-large" })));
    if (examples.length) panels.push(panel(`Does it fit ${e.word}?`, "Decide whether each example fits the word.", exampleSort({ word: e.word, items: examples })));
    panels.push(panel("Use the word", "Say it, then write it.", useWord(e)));
    return host.replaceChildren(...panels);
  }
  const vars = Object.fromEntries(m.vars.map((v) => [v.id, v.start ?? v.min]));
  const art = h("div", { class: "st-v-fig-art st-v-fig-large", role: "group", "aria-label": "Picture that changes with the controls" });
  const readout = h("p", { class: "st-v-readout", role: "status", "aria-live": "polite", "aria-atomic": "true" });
  const altNote = h("p", { class: "st-v-alt-live" });
  const matchHost = h("div", {});
  const repsHost = h("div", {});

  const specNow = (override = {}) => bindSpec(m.spec, m.binds, { ...vars, ...Object.fromEntries(Object.entries(override).map(([k, ex]) => [k, evalExpr(ex, vars)])) });
  const drawMatch = () => {
    matchHost.replaceChildren();
    if (!m.match) return;
    const choices = m.match.options.map((o) => ({ text: fillTemplate(o.text, vars), ok: truthy(o.ok, vars), feedback: "That statement does not match the picture. Check the numbers in the picture." }));
    if (!choices.some((c) => c.ok)) return;
    const list = choices.slice(0, 4);
    matchHost.append(choiceTask({ prompt: m.match.prompt || "Choose the statement that matches the picture.", choices: list, explanation: "The words and the picture show the same quantities." }));
  };
  const drawReps = () => {
    repsHost.replaceChildren();
    if (!m.reps || !m.sentence) return;
    const fb = feedbackLine();
    const row = h("div", { class: "st-v-reps", role: "group", "aria-label": "Pictures to choose from" });
    for (const r of m.reps) {
      const spec = specNow(r.set || {});
      const b = h("button", { class: "st-v-rep", type: "button", "aria-label": `${r.label}: ${spec.alt}` }, h("span", { class: "st-v-rep-art", html: visualSvg(spec), "aria-hidden": "true" }), h("span", { class: "st-v-rep-label" }, r.label));
      b.addEventListener("click", () => {
        if (truthy(r.ok, vars)) {
          b.dataset.state = "right";
          fb.show("right", "That picture shows the sentence.");
          announce("Correct.");
        } else {
          b.dataset.state = "wrong";
          fb.show("retry", "Compare the numbers in the sentence with the numbers in this picture.");
        }
      });
      row.append(b);
    }
    repsHost.append(h("div", { class: "st-v-task" }, h("p", { class: "st-v-prompt" }, "Which picture matches this sentence?"), h("p", { class: "st-v-quote" }, fillTemplate(m.sentence, vars)), row, fb.el));
  };
  const redraw = () => {
    const spec = specNow();
    art.innerHTML = visualSvg(spec);
    readout.textContent = fillTemplate(m.readout || "", vars);
    altNote.textContent = spec.alt;
    drawMatch();
    drawReps();
  };

  const reset = h("button", { class: "st-v-btn st-v-quiet", type: "button", onclick: () => { for (const v of m.vars) vars[v.id] = v.start ?? v.min; panelControls.replaceChildren(...m.vars.map((v) => control(v, vars, redraw)), reset); redraw(); } }, "Reset");
  const panelControls = h("div", { class: "st-v-controls" }, ...m.vars.map((v) => control(v, vars, redraw)), reset);
  panels.push(panel("Change it, see it", `Change the quantity and watch the picture of ${e.word} change with it.`, h("div", { class: "st-v-split" }, h("div", {}, art, altNote), h("div", {}, panelControls, readout))));

  if (m.target) {
    const fb = feedbackLine();
    const check = h("button", { class: "st-v-btn st-v-primary", type: "button" }, "Check my picture");
    check.addEventListener("click", () => (truthy(m.target.ok, vars) ? fb.show("right", m.target.explain || "Your picture meets the goal.") : fb.show("retry", m.target.hint || "Change the quantities and check again.")));
    panels.push(panel("Build it", "Make the picture match the goal.", h("div", { class: "st-v-task" }, h("p", { class: "st-v-prompt" }, m.target.prompt), h("p", {}, check), fb.el)));
  }
  panels.push(panel("Match the language to the picture", "Words and pictures have to say the same thing.", matchHost, repsHost));
  if (examples.length) panels.push(panel(`Does it fit ${e.word}?`, "Decide whether each example fits the word.", exampleSort({ word: e.word, items: examples })));
  panels.push(panel("Use the word", "Say it, then write it.", useWord(e)));
  host.replaceChildren(...panels);
  void collection;
  redraw();
}

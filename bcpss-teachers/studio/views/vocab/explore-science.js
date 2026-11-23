// Science template: labelled process steps, put-the-stages-in-order, cause and effect, does-it-fit examples.
import { h } from "../../core/dom.js";
import { deriveCauseEffect, deriveExamples, deriveSteps } from "./explore-model.js";
import { choiceTask, exampleSort, orderTask, panel, stepper, useWord } from "./explore-common.js";
import { visualFigure } from "./visual.js";
import { speakButton } from "./ui.js";
import { shuffle } from "../../core/dom.js";

function processPanel(e, steps) {
  const view = stepper({
    steps,
    label: "Process step",
    renderStep: (s, i, n) =>
      h(
        "div",
        { class: "st-v-stepcard" },
        h("p", { class: "st-v-stepcount" }, `Step ${i + 1} of ${n}`),
        h("h4", { class: "st-v-steptitle" }, s.label, " ", speakButton(`${s.label}. ${s.detail || ""}`, { label: `Hear step ${i + 1}: ${s.label}` })),
        s.detail ? h("p", { class: "st-v-stepdetail" }, s.detail) : null,
        s.visual ? visualFigure(s.visual, { cls: "st-v-fig-step", showAlt: false }) : null,
      ),
  });
  return panel("See the process", `Step through how ${e.word} works. Each step has a label and a picture.`, h("div", { class: "st-v-split" }, e.visual ? visualFigure(e.visual, { cls: "st-v-fig-large" }) : null, view));
}

function causePanel(e, pairs, collection) {
  const kids = pairs.map((p, i) => {
    const wrongPool = pairs.filter((_, k) => k !== i).map((q) => q.effect);
    const wrong = shuffle(wrongPool, `ce-${e.id}-${i}`).slice(0, 2);
    const extra = p.distractors || [];
    const choices = shuffle([{ text: p.effect, ok: true }, ...[...extra, ...wrong].slice(0, 2).map((text) => ({ text, ok: false, feedback: "That is a different effect. Reread the cause." }))], `cc-${e.id}-${i}`);
    return choiceTask({ prompt: `Cause: ${p.cause} What happens because of this?`, choices, explanation: p.because || p.effect });
  });
  void collection;
  return panel("Cause and effect", "Choose what happens because of each cause.", ...kids);
}

export function mountScience(host, { collection, entry: e }) {
  const steps = deriveSteps(e);
  const pairs = deriveCauseEffect(e);
  const examples = deriveExamples(e);
  const panels = [];
  if (steps.length >= 2) {
    panels.push(processPanel(e, steps));
    panels.push(panel("Put the stages in order", `Tap the stages of ${e.word} in the order they happen.`, orderTask({ prompt: "Which comes first? Then which comes next?", items: steps, seed: `ord-${e.id}` })));
  } else if (e.visual) {
    panels.push(panel("Look closely", `What do you notice? Use the picture to explain ${e.word}.`, visualFigure(e.visual, { cls: "st-v-fig-large", showAlt: false })));
  }
  if (pairs.length >= 2) panels.push(causePanel(e, pairs, collection));
  else if (pairs.length === 1) panels.push(panel("Cause and effect", "Choose what happens.", choiceTask({ prompt: `Cause: ${pairs[0].cause} What happens because of this?`, choices: [{ text: pairs[0].effect, ok: true }, { text: `Nothing changes about ${e.word}.`, ok: false, feedback: "The cause makes a difference. Read it again." }], explanation: pairs[0].because || pairs[0].effect })));
  if (examples.length) panels.push(panel(`Does it fit ${e.word}?`, "Decide whether each example fits the word.", exampleSort({ word: e.word, items: examples })));
  panels.push(panel("Use the word", "Say a sentence, then write it.", useWord(e)));
  host.replaceChildren(...panels);
}

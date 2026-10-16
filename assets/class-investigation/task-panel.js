// Our Class Investigation — one small question the student answers themselves.
//
// The rule every tool here follows: the STUDENT enters the number or makes the
// choice, the page only checks it. A wrong answer gets a hint ladder, never the
// worked solution:
//   try 1   a method hint (what to do)
//   try 2   one concrete step (where to look), still not the answer
//   try 3+  a kind nudge toward a classmate or the teacher
// Nothing typed here is stored or sent. It is practice, not a record.

import { announce, h } from "./dom.js";
import { tr } from "./i18n.js";
import { hintStage } from "./unit-tasks.js";

/**
 * @typedef {object} Task
 * @property {string} id
 * @property {string} question
 * @property {{ key: string, label: string, step?: number }[]} [inputs]  numbers the student types
 * @property {{ value: string, label: string }[]} [choices]  radio choices instead of numbers
 * @property {(answer: Record<string, number> | string) => { code: string }} check
 * @property {(code: string, stage: number) => { key: string, vars?: object, kind: "ok"|"close"|"hint" } | null} say
 * @property {() => void} [onCorrect]
 */

/** @param {Task} task @param {"en"|"es"} lang */
export function taskPanel(task, lang) {
  let tries = 0;
  const feedback = h("div", { class: "ci-feedback", role: "status", "aria-live": "polite" });
  const qid = `ci-q-${task.id}`;
  const controls = [];
  const readers = [];

  if (task.choices) {
    const group = h(
      "fieldset",
      { class: "ci-field" },
      h("legend", { id: qid, text: task.question }),
    );
    for (const c of task.choices) {
      const input = h("input", {
        type: "radio",
        name: qid,
        value: c.value,
        id: `${qid}-${c.value}`,
      });
      group.append(
        h(
          "label",
          { class: "ci-choice", for: `${qid}-${c.value}` },
          input,
          h("span", { text: c.label }),
        ),
      );
    }
    controls.push(group);
    readers.push(() => group.querySelector("input:checked")?.value ?? null);
  } else {
    controls.push(h("p", { class: "ci-question", id: qid, text: task.question }));
    const row = h("div", { class: "ci-inputrow" });
    for (const inp of task.inputs ?? []) {
      const id = `${qid}-${inp.key}`;
      const input = h("input", {
        type: "number",
        id,
        inputmode: "decimal",
        step: inp.step ?? "any",
        autocomplete: "off",
        "aria-label": inp.label,
      });
      row.append(h("label", { class: "ci-inline-label", for: id, text: inp.label }), input);
      readers.push(() => (input.value === "" ? null : input.valueAsNumber));
    }
    controls.push(row);
  }

  const button = h("button", { type: "button", class: "ci-btn", text: tr("checkBtn", lang) });
  button.addEventListener("click", () => {
    const raw = readers.map((read) => read());
    if (raw.some((v) => v === null || Number.isNaN(v))) {
      announce(feedback, tr("typeFirst", lang));
      feedback.dataset.kind = "hint";
      return;
    }
    let answer;
    if (task.choices) answer = raw[0];
    else answer = Object.fromEntries((task.inputs ?? []).map((inp, i) => [inp.key, raw[i]]));
    const result = task.check(answer);
    if (result.code === "correct") {
      feedback.dataset.kind = "ok";
      announce(feedback, tr("correct", lang));
      task.onCorrect?.();
      return;
    }
    if (result.code === "close") {
      // A close call is a fair reading, not a miss: accept it and say why.
      const note = task.say("close", 0);
      feedback.dataset.kind = "close";
      announce(feedback, note ? tr(note.key, lang, note.vars) : tr("correct", lang));
      task.onCorrect?.();
      return;
    }
    tries++;
    const said = task.say(result.code, hintStage(tries));
    const text = said ? tr(said.key, lang, said.vars) : tr("tryAgain", lang);
    feedback.dataset.kind = said?.kind ?? "hint";
    announce(
      feedback,
      tries >= 3 && said?.kind !== "close" ? `${text} ${tr("stuck", lang)}` : text,
    );
  });

  return h("div", { class: "ci-task" }, controls, h("div", { class: "ci-row" }, button), feedback);
}

// Interaction building blocks shared by every explorer template: feedback line, choice question, tap-in-order task, stepper.
import { announce, h, shuffle } from "../../core/dom.js";
import { canSpeak, speak } from "../../core/speech.js";
import { speakButton, uid } from "./ui.js";

export function feedbackLine() {
  const el = h("p", { class: "st-v-fb", role: "status", "aria-live": "polite", hidden: true });
  return {
    el,
    show(kind, text) {
      el.hidden = false;
      el.dataset.kind = kind;
      el.textContent = "";
      el.append(h("strong", {}, kind === "right" ? "Yes. " : kind === "retry" ? "Not yet. " : ""), text);
    },
    clear() {
      el.hidden = true;
      el.textContent = "";
    },
  };
}

export function panel(title, intro, ...kids) {
  const id = uid("xp");
  return h("section", { class: "st-v-xpanel", "aria-labelledby": id }, h("h3", { class: "st-v-xtitle", id }, title), intro ? h("p", { class: "st-v-help" }, intro) : null, ...kids);
}

/**
 * One question, several answers. choices: [{ text, ok, feedback? }]. A wrong answer is marked and stays unavailable;
 * the right one reveals `explanation`. `onSolved()` fires once.
 */
export function choiceTask({ prompt, choices, explanation = "", onSolved }) {
  const pid = uid("q");
  const fb = feedbackLine();
  let solved = false;
  const list = h("div", { class: "st-v-choices", role: "group", "aria-labelledby": pid });
  const buttons = choices.map((c) => {
    const b = h("button", { class: "st-v-choice", type: "button" }, c.text);
    b.addEventListener("click", () => {
      if (solved) return;
      if (c.ok) {
        solved = true;
        b.dataset.state = "right";
        b.append(h("span", { class: "st-v-mark" }, " Correct"));
        for (const o of buttons) if (o !== b) o.disabled = true;
        fb.show("right", explanation || "That fits.");
        announce(`Correct. ${explanation}`);
        onSolved?.();
      } else {
        b.dataset.state = "wrong";
        b.disabled = true;
        b.append(h("span", { class: "st-v-mark" }, " Not this one"));
        fb.show("retry", c.feedback || "Look at the picture and the meaning again, then choose another answer.");
      }
    });
    return b;
  });
  list.append(...buttons);
  return h("div", { class: "st-v-task" }, h("p", { class: "st-v-prompt", id: pid }, prompt), list, fb.el);
}

/** Tap the items in the right order. items: [{ label, detail? }] given in the correct order. */
export function orderTask({ prompt, items, seed = "order", onDone }) {
  const pid = uid("o");
  const fb = feedbackLine();
  let placed = [];
  let misses = 0;
  const order = (() => {
    let s = shuffle(items.map((_, i) => i), seed);
    if (s.every((v, i) => v === i) && items.length > 1) s = [...s.slice(1), s[0]];
    return s;
  })();
  const pool = h("div", { class: "st-v-choices st-v-pool", role: "group", "aria-labelledby": pid });
  const slots = h("ol", { class: "st-v-slots", "aria-label": "Your order" });
  const reset = h("button", { class: "st-v-btn st-v-quiet", type: "button" }, "Start over");

  const paint = () => {
    pool.replaceChildren(
      ...order
        .filter((i) => !placed.includes(i))
        .map((i) => {
          const b = h("button", { class: "st-v-choice", type: "button", "data-i": String(i) }, items[i].label);
          b.addEventListener("click", () => tap(i, b));
          return b;
        }),
    );
    slots.replaceChildren(...items.map((_, n) => h("li", { class: "st-v-slot", "data-filled": String(n < placed.length) }, n < placed.length ? h("span", {}, items[placed[n]].label) : h("span", { class: "st-v-slot-empty" }, `Step ${n + 1}`))));
  };
  function tap(i, btn) {
    const n = placed.length;
    if (i === n) {
      placed.push(i);
      misses = 0;
      const last = placed.length === items.length;
      fb.show("right", last ? `All ${items.length} are in order. ${items.map((s) => s.label).join(", then ")}.` : `Step ${n + 1} is ${items[i].label}.${items[i].detail ? ` ${items[i].detail}` : ""}`);
      paint();
      if (last) {
        announce("All steps are in order.");
        onDone?.();
      } else pool.querySelector("button")?.focus();
    } else {
      misses += 1;
      fb.show("retry", misses >= 2 && n > 0 ? `Think about what happens right after ${items[n - 1].label}.` : `${btn.textContent} does not come as step ${n + 1}. Which step comes ${n === 0 ? "first" : `after ${items[n - 1].label}`}?`);
      btn.focus();
    }
  }
  reset.addEventListener("click", () => {
    placed = [];
    misses = 0;
    fb.clear();
    paint();
    pool.querySelector("button")?.focus();
  });
  paint();
  return h("div", { class: "st-v-task" }, h("p", { class: "st-v-prompt", id: pid }, prompt), pool, slots, fb.el, h("p", {}, reset));
}

/** Previous / next through steps. renderStep(step, i, n) returns a node; the step list is also clickable. */
export function stepper({ steps, renderStep, label = "Step" }) {
  let i = 0;
  const body = h("div", { class: "st-v-stepbody", "aria-live": "polite" });
  const list = h("ol", { class: "st-v-steplist" });
  const prev = h("button", { class: "st-v-btn", type: "button" }, "Previous step");
  const next = h("button", { class: "st-v-btn st-v-primary", type: "button" }, "Next step");
  const paint = () => {
    body.replaceChildren(renderStep(steps[i], i, steps.length));
    prev.disabled = i === 0;
    next.disabled = i === steps.length - 1;
    list.replaceChildren(...steps.map((s, k) => h("li", {}, h("button", { class: "st-v-stepbtn", type: "button", "aria-current": k === i ? "step" : null, onclick: () => ((i = k), paint()) }, h("span", { class: "st-v-stepnum" }, String(k + 1)), s.label))));
  };
  prev.addEventListener("click", () => ((i = Math.max(0, i - 1)), paint()));
  next.addEventListener("click", () => ((i = Math.min(steps.length - 1, i + 1)), paint()));
  paint();
  return h("div", { class: "st-v-stepper", "aria-label": `${label}s` }, list, body, h("p", { class: "st-v-row" }, prev, next));
}

/** Does each example fit the word? One card per example with a Fits / Does not fit pair. */
export function exampleSort({ word, items }) {
  const wrap = h("div", { class: "st-v-sort" });
  let done = 0;
  const summary = h("p", { class: "st-v-fb", role: "status", "aria-live": "polite", hidden: true });
  for (const it of items) {
    const fb = feedbackLine();
    const yes = h("button", { class: "st-v-choice", type: "button" }, `Fits "${word}"`);
    const no = h("button", { class: "st-v-choice", type: "button" }, `Does not fit "${word}"`);
    const settle = (said) => {
      const ok = said === it.is;
      (said ? yes : no).dataset.state = ok ? "right" : "wrong";
      (said ? yes : no).append(h("span", { class: "st-v-mark" }, ok ? " Correct" : " Not this one"));
      if (ok) {
        yes.disabled = no.disabled = true;
        fb.show("right", it.why);
        done += 1;
        if (done === items.length) {
          summary.hidden = false;
          summary.textContent = `You sorted all ${items.length} examples.`;
        }
      } else {
        (said ? yes : no).disabled = true;
        fb.show("retry", "Read it again and think about the meaning of the word.");
      }
    };
    yes.addEventListener("click", () => settle(true));
    no.addEventListener("click", () => settle(false));
    wrap.append(h("div", { class: "st-v-sortitem" }, h("p", { class: "st-v-quote" }, it.text), h("div", { class: "st-v-choices st-v-choices-row", role: "group", "aria-label": `Does this fit ${word}?` }, yes, no), fb.el));
  }
  wrap.append(summary);
  return wrap;
}

/** Say it, then write it: the academic sentence as a frame, a box, and read-aloud of what the student wrote. */
export function useWord(e) {
  const id = uid("uw");
  const ta = h("textarea", { id, class: "st-v-textarea", rows: "3", maxlength: "400", placeholder: e.practice?.speakWrite ? "Write your sentence here" : "" });
  const note = h("p", { class: "st-v-fb", role: "status", "aria-live": "polite", hidden: true });
  const check = () => {
    const used = new RegExp(`\\b${e.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i").test(ta.value);
    note.hidden = !ta.value.trim();
    note.dataset.kind = used ? "right" : "retry";
    note.textContent = used ? `You used the word "${e.word}".` : `Try to use the word "${e.word}" in your sentence.`;
  };
  ta.addEventListener("input", check);
  const say = h("button", { class: "st-v-btn", type: "button", onclick: async () => (canSpeak() ? speak(ta.value || e.academicSentence, { rate: 0.9 }) : announce("Audio is not available in this browser.")) }, "Read my sentence aloud");
  return h(
    "div",
    { class: "st-v-task" },
    h("p", { class: "st-v-quote" }, e.academicSentence, " ", speakButton(e.academicSentence, { label: `Hear the model sentence for ${e.word}`, rate: 0.85 })),
    h("label", { for: id, class: "st-v-label" }, e.practice?.speakWrite || `Say a sentence with ${e.word}, then write it.`),
    ta,
    h("p", { class: "st-v-row" }, say),
    note,
  );
}

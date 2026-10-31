// The shared game feedback helper and the per-game phase mapping (Fluency Lab 4.0, screens workstream).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><body><div id='host'></div></body>", {
  pretendToBeVisual: true,
});
for (const key of ["window", "document"])
  Object.defineProperty(globalThis, key, {
    value: dom.window[key === "window" ? "window" : key],
    configurable: true,
    writable: true,
  });

const { GAME_PHASES, feedbackAction, feedbackNoteHtml, gameFeedbackView, mountFeedback, phaseFor } =
  await import("../math/fluency-lab/feedback-host.js");
const { GAMES } = await import("../math/fluency-lab/games.js");
const { PUZZLE_WORLDS } = await import("../math/fluency-lab/puzzle-worlds.js");
const { FEEDBACK_PHASES } = await import("../math/fluency-lab/feedback-machine.js");

// 1. Every Game Room game maps to a phase table, and every phase is one the shared machine knows.
const worldIds = new Set(PUZZLE_WORLDS.map((world) => world.id));
const tableFor = (id) => GAME_PHASES[id] || (worldIds.has(id) ? GAME_PHASES.puzzleworld : null);
for (const game of GAMES) {
  const table = tableFor(game.id);
  assert.ok(table, `${game.id} has a feedback phase table`);
  assert.equal(table.right, "correct", `${game.id}: a first-try right answer is independent`);
  assert.equal(table.miss, "retry", `${game.id}: a first miss is a retry, never a revealed answer`);
  if (table["right-after-miss"])
    assert.equal(
      table["right-after-miss"],
      "assisted",
      `${game.id}: right after a miss is supported work`,
    );
  for (const phase of Object.values(table))
    assert.ok(FEEDBACK_PHASES.includes(phase), `${game.id}: ${phase} is a known phase`);
}
assert.ok(GAME_PHASES.trail, "trail rounds have a phase table");
assert.equal(phaseFor("sort", "miss"), "retry");
assert.throws(() => phaseFor("sort", "nonsense"), /No feedback phase/);

// 2. The view: a first miss keeps the learner's answer and never states the right one.
const miss = gameFeedbackView("retry", { submitted: "999", expected: "42" });
assert.equal(miss.heading, "Not quite. Let's work through it.");
assert.deepEqual(
  miss.lines.map((line) => line.value),
  ["999"],
  "a retry shows only the learner's answer",
);
assert.deepEqual(
  miss.actions.map((a) => a.id),
  ["try-again"],
  "no hint or worked example unless the game has one",
);
const withHelp = gameFeedbackView("retry", {
  submitted: "9",
  hintAvailable: true,
  stepsAvailable: true,
});
assert.deepEqual(
  withHelp.actions.map((a) => a.id),
  ["try-again", "hint", "worked"],
);
const right = gameFeedbackView("correct", { expected: "42", next: "Next round" });
assert.equal(right.heading, "Correct!");
assert.equal(right.lines.at(-1).value, "42");
assert.deepEqual(
  right.actions,
  [{ id: "next", label: "Next round" }],
  "a settled result waits for Next",
);
assert.equal(
  gameFeedbackView("retry", { next: "Next" }).actions.some((a) => a.id === "next"),
  false,
  "a miss never offers Next",
);
assert.equal(
  gameFeedbackView("assisted", { expected: "7" }).badge.includes("help"),
  true,
  "supported work is labelled",
);

// 3. Markup for redrawing games: the game's own note stays in .gm-note, inside the panel.
const plain = feedbackNoteHtml("Pick a tile.", null);
assert.equal(plain, '<p class="gm-note">Pick a tile.</p>');
const html = feedbackNoteHtml("Not that bin.", { phase: "retry", ctx: { submitted: "<b>x</b>" } });
const doc = new JSDOM(html).window.document;
assert.equal(doc.querySelector("[data-fb-host]").dataset.phase, "retry");
assert.equal(doc.querySelector(".gm-note").textContent, "Not that bin.");
assert.equal(doc.querySelector("[data-fb-title]").textContent, "Not quite. Let's work through it.");
assert.equal(
  doc.querySelector(".fb-answers dd").textContent,
  "<b>x</b>",
  "an answer a learner typed is text, never markup",
);
assert.equal(doc.querySelectorAll("b").length, 0);
assert.equal(doc.querySelector("[data-feedback-action='try-again']").textContent, "Try again");
const nextButton = new JSDOM(
  feedbackNoteHtml("Match!", { phase: "correct", ctx: { next: "See results" } }),
).window.document.querySelector("[data-feedback-action='next']");
assert.ok(
  nextButton.hasAttribute("data-gm-next"),
  "the Next button keeps the game's own next hook",
);

// 4. The mounted panel wraps an existing message element and keeps its attributes.
const host = document.querySelector("#host");
host.innerHTML = '<p data-feedback role="status" aria-live="polite" data-state="">x</p>';
const copy = host.querySelector("[data-feedback]");
const actions = [];
const panel = mountFeedback(copy, { onAction: (id) => actions.push(id) });
assert.ok(panel.el.hidden, "the panel starts hidden");
panel.show("retry", { submitted: "3/4", hintAvailable: true }, "Adjust the model and try again.");
assert.equal(panel.el.hidden, false);
assert.equal(panel.el.dataset.phase, "retry");
assert.equal(copy.textContent, "Adjust the model and try again.");
assert.equal(copy.closest("[data-fb-host]"), panel.el, "the message element sits inside the panel");
assert.equal(copy.hasAttribute("role"), false, "one announcement, not two live regions");
panel.el.querySelector("[data-feedback-action='hint']").click();
assert.deepEqual(actions, ["hint"]);
const again = mountFeedback(copy);
assert.equal(again.el, panel.el, "mounting twice reuses the panel");
panel.show("correct", { expected: "3/4", next: "Next" }, "Equivalent.");
assert.equal(panel.el.querySelector("[data-fb-title]").textContent, "Correct!");
assert.equal(
  panel.el.querySelector(".fb-icon svg") !== null,
  true,
  "the result has an icon, not only a colour",
);
panel.clear();
assert.equal(panel.el.hidden, true);
assert.equal(
  feedbackAction({ target: { closest: () => ({ dataset: { feedbackAction: "next" } }) } }),
  "next",
);

// 5. House rules for the new files: no emoji, no violet.
const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
const violet = /#(?:5b21b6|7c3aed|8b5cf6|6d28d9|a78bfa|4f46e5|6366f1)/i;
for (const file of ["feedback-host.js", "ds4-screens.css"]) {
  const text = readFileSync(new URL(`../math/fluency-lab/${file}`, import.meta.url), "utf8");
  assert.equal(emoji.test(text), false, `${file} has no emoji`);
  assert.equal(violet.test(text), false, `${file} has no violet`);
}

console.log(
  `fluency-screens: ${GAMES.length} games map to feedback phases; the panel keeps answers as text, hides the answer on a first miss and waits for Next`,
);
process.exit(0);

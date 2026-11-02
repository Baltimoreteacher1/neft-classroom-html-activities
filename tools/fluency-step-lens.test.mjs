// The step lens: numbers and moves in a worked explanation are highlighted chips that say where they came from, light
// up everywhere they appear, and never change the text, hide an input or show a step the surface had not opened.
// It also proves the move names behind "Predict the next move": the right move is always among the three choices
// and the button carries a move NAME, never a digit. Swept over every generated problem of all 96 skills.
// Run: node tools/fluency-step-lens.test.mjs
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><body></body>", {
  url: "https://example.test/",
  pretendToBeVisual: true,
});
for (const [key, value] of Object.entries({
  window: dom.window,
  document: dom.window.document,
  localStorage: dom.window.localStorage,
  MutationObserver: dom.window.MutationObserver,
  CustomEvent: dom.window.CustomEvent,
  requestAnimationFrame: dom.window.requestAnimationFrame.bind(dom.window),
}))
  Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });

const { tokenize, provenance, sync, initStepLens } = await import(
  "../math/fluency-lab/step-lens.js"
);
const { moveOf, moveChoices, nextMoveOf, VERBS } = await import(
  "../math/fluency-lab/step-moves.js"
);
const { stepsBlock } = await import("../math/fluency-lab/trail-pictures.js");
const { ALL_SKILLS, generateProblem, seededRandom } = await import(
  "../math/fluency-lab/problem-bank.js"
);
const { ES } = await import("../math/fluency-lab/i18n-es.js");
const { ES_MODELS } = await import("../math/fluency-lab/i18n-es-models.js");

initStepLens();

let checks = 0;
const ok = (condition, message) => {
  checks += 1;
  assert.ok(condition, message);
};
const eq = (actual, expected, message) => {
  checks += 1;
  assert.deepEqual(actual, expected, message);
};

// --- tokenize -----------------------------------------------------------------------------------------------
const kinds = (text) => tokenize(text).map((piece) => `${piece.type}:${piece.text}`);
eq(
  kinds("Split 89 into 80 + 9."),
  [
    "act:Split",
    "text: ",
    "num:89",
    "text: into ",
    "num:80",
    "text: ",
    "op:+",
    "text: ",
    "num:9",
    "text:.",
  ],
  "split step",
);
eq(
  kinds("30 × 17 = 510").filter((k) => k.startsWith("op")),
  ["op:×", "op:="],
  "operators in a number sentence",
);
eq(
  kinds("1,344 + 2").filter((k) => k.startsWith("num")),
  ["num:1,344", "num:2"],
  "a thousands comma stays in one number",
);
eq(
  kinds("Factors of 48: 1, 2, 3, 4").filter((k) => k.startsWith("num")),
  ["num:48"],
  "a list of facts is not a list of quantities",
);
eq(
  kinds("2^3 = 8").filter((k) => k.startsWith("num")),
  ["num:2", "num:8"],
  "an exponent digit is not a quantity",
);
eq(
  kinds("Then add the parts.").filter((k) => k.startsWith("act")),
  ["act:add"],
  "a verb after 'then' is a move",
);
eq(
  kinds("Do not forget to add.").filter((k) => k.startsWith("act")),
  [],
  "a verb mid-sentence is not",
);
for (const text of [
  "Split 89 into 80 + 9.",
  "4,200 ÷ 7 = 600",
  "Factors of 48: 1, 2, 3, 4",
  "2^3 = 8 and -3 - 4",
])
  eq(
    tokenize(text)
      .map((piece) => piece.text)
      .join(""),
    text,
    `tokenize keeps every character: ${text}`,
  );

// --- provenance ---------------------------------------------------------------------------------------------
const LINES = ["Split 89 into 80 + 9.", "80 × 98 = 7840", "9 × 98 = 882", "7840 + 882 = 8722"];
const PROBLEM = new Set(["89", "98"]);
eq(provenance("98", 1, PROBLEM, LINES), { kind: "problem" }, "a number in the problem");
eq(provenance("80", 1, PROBLEM, LINES), { kind: "step", step: 1 }, "a number an earlier step made");
eq(
  provenance("7840", 3, PROBLEM, LINES),
  { kind: "step", step: 2 },
  "a number from two steps back",
);
eq(provenance("7840", 1, PROBLEM, LINES), { kind: "new" }, "a number this step makes");
eq(
  provenance("882", 2, PROBLEM, LINES),
  { kind: "new" },
  "a number made in the step itself, not earlier",
);

// --- moves --------------------------------------------------------------------------------------------------
eq(moveOf("Split 89 into 80 + 9."), "Split", "opening verb is the move");
eq(moveOf("30 × 17 = 510"), "Multiply", "a bare number sentence names its operation");
eq(moveOf("Add the two parts: 510 + 153 = 663"), "Add", "the verb beats the operator");
eq(moveOf("Factors of 48: 1, 2, 3"), "", "a list names no move");
eq(nextMoveOf(LINES, 1), "Multiply", "next move of the step a button would open");
eq(nextMoveOf(LINES, 4), "", "no next move past the last step");
eq(nextMoveOf(LINES, 2, 2), "", "no next move past the cap");
for (const move of ["Split", "Add", "Multiply"]) {
  for (const seed of [1, 2, 3, 4, 9]) {
    const choices = moveChoices(move, seed);
    ok(
      choices.length === 3 && new Set(choices).size === 3 && choices.includes(move),
      `three distinct choices with ${move}`,
    );
    eq(choices, moveChoices(move, seed), "choices are stable for a seed");
  }
}
ok(
  new Set([1, 2, 3, 4, 5, 6].map((seed) => moveChoices("Add", seed).indexOf("Add"))).size > 1,
  "the right move is not always in one position",
);

// --- decorating a real step list ----------------------------------------------------------------------------
const PICTURE = `<div class="tp-live" data-live="area"><p class="tp-prompt">89 = 80 + 9.</p><div class="tp-area"><div class="tp-part"><b>80</b> <small>98</small></div></div></div>`;
function mount(steps, shown, cap = steps.length) {
  document.body.innerHTML = `<div class="learn-simple"><div class="tr-example"><p class="tr-example-fact">89 × 98 = ?</p>${PICTURE}</div>
    <div class="tr-guide"><div data-learn-steps data-total-steps="${steps.length}">${stepsBlock(steps, shown, { id: `lens-${Math.random()}`, cap })}</div></div></div>`;
  return document.querySelector("[data-learn-steps]");
}
const textOf = (node) => node.textContent;
{
  const host = mount(LINES, 3);
  const before = textOf(host.querySelector(".tr-steps"));
  sync();
  eq(textOf(host.querySelector(".tr-steps")), before, "decorating never changes the steps' text");
  const chips = [...host.querySelectorAll(".lens-n")];
  ok(chips.length >= 6, "numbers became chips");
  eq(
    chips.filter((c) => c.dataset.v === "98").map((c) => c.dataset.src),
    ["problem", "problem"],
    "98 reads as from the problem in steps 2 and 3",
  );
  ok(host.querySelectorAll(".lens-op").length >= 3, "moves became chips");
  ok(
    document.querySelector(".tr-example-fact .lens-given"),
    "the problem's own numbers are chips too",
  );
  ok(document.querySelector(".lens-kit"), "the kit sits beside the steps");
  ok(
    !document.querySelector("[data-learn-steps] .lens-kit"),
    "the kit lives outside the re-rendered step host",
  );
  eq([...document.querySelectorAll(".lens-dot")].length, 3, "one path dot per open step");
  ok(!host.textContent.includes("8722"), "a step the surface has not opened is not in the page");
  // Idempotent: a second pass touches nothing.
  const watcher = new MutationObserver(() => {});
  watcher.observe(document.body, { childList: true, subtree: true, characterData: true });
  sync();
  eq(watcher.takeRecords().length, 0, "a second pass changes nothing");
  watcher.disconnect();

  // Tapping a made number lights it in the problem, the picture and the steps, and names where it came from.
  const eighty = host.querySelector('li:nth-child(2) .lens-n[data-v="80"]');
  eighty.click();
  const lit = [...document.querySelectorAll(".lens-point")];
  ok(
    lit.some((n) => n.closest(".tp-live")),
    "the picture's 80 lights",
  );
  ok(
    lit.some((n) => n.closest("li")),
    "the steps' 80s light",
  );
  ok(
    document.querySelector("[data-lens-note]").textContent.includes("step 1"),
    "the note names step 1",
  );
  ok(
    document.querySelector("[data-lens-go]:not(.lens-dot)"),
    "the note offers a jump to the step that made it",
  );
  eighty.click();
  eq(document.querySelectorAll(".lens-point").length, 0, "tapping again lets go");
  host.querySelector('.lens-op[data-op="×"]').click();
  ok(
    /multiply/i.test(document.querySelector("[data-lens-note]").textContent),
    "a move says what it means",
  );

  // Modes dim by attribute only; the text is untouched.
  document.querySelector('[data-lens-mode="moves"]').click();
  eq(host.dataset.lensView, "moves", "Moves mode");
  eq(
    document.querySelector('[data-lens-mode="moves"]').getAttribute("aria-pressed"),
    "true",
    "pressed state",
  );
  document.querySelector('[data-lens-mode="all"]').click();

  // The path dot taps the step like a learner does.
  let tapped = -1;
  host.querySelectorAll(".tr-steps > li").forEach((li, i) =>
    li.addEventListener("click", () => {
      tapped = i;
    }),
  );
  document.querySelector('.lens-dot[data-lens-go="0"]').click();
  eq(tapped, 0, "a path dot taps its step");
}

// --- "Your turn" rows keep their input; the move name on the button carries no digits -------------------------
{
  const host = mount(
    [
      "Split 39 into 30 + 9.",
      "30 × 17 = 510",
      "9 × 17 = 153",
      "Add the two parts: 510 + 153 = 663",
    ],
    2,
  );
  sync();
  ok(host.querySelector("input.tr-fill"), "the Your turn input survives");
  ok(!host.querySelector("input.tr-fill").closest(".lens-n"), "no chip wraps an input");
  const next = host.querySelector(".tr-step-next");
  ok(
    next?.dataset.nextMove && !/\d/.test(next.dataset.nextMove),
    `Next step carries a move name: ${next?.dataset.nextMove}`,
  );
  ok(
    !host.textContent.includes("663") && !host.textContent.includes("510"),
    "no hidden result reaches the page text",
  );
}

// --- sweep: every skill, several seeded problems --------------------------------------------------------------
{
  let problems = 0;
  let steps = 0;
  const seen = new Set();
  for (const skill of ALL_SKILLS) {
    for (let seed = 1; seed <= 6; seed += 1) {
      const item = generateProblem(skill, seededRandom(seed * 7919 + skill.id.length));
      const lines = item.steps || [];
      if (!lines.length) continue;
      problems += 1;
      const host = mount(lines, lines.length);
      const before = textOf(host.querySelector(".tr-steps"));
      sync();
      assert.equal(
        textOf(host.querySelector(".tr-steps")),
        before,
        `${skill.id}: text changed by the lens`,
      );
      for (const [i, line] of lines.entries()) {
        steps += 1;
        eq(
          tokenize(line)
            .map((piece) => piece.text)
            .join(""),
          line,
          `${skill.id}: tokenize loses text in step ${i + 1}`,
        );
        const move = nextMoveOf(lines, i);
        if (!move) continue;
        seen.add(move);
        ok(!/\d/.test(move), `${skill.id}: a move name has a digit: ${move}`);
        ok(moveChoices(move, i + 1).includes(move), `${skill.id}: the right move is a choice`);
      }
      ok(
        [...host.querySelectorAll(".lens-n")].every(
          (chip) => chip.dataset.v && chip.getAttribute("aria-label"),
        ),
        `${skill.id}: every number chip is labelled`,
      );
    }
  }
  ok(problems >= 400, `the sweep covered ${problems} problems`);
  const ALL_ES = { ...ES, ...ES_MODELS };
  for (const move of [...seen, ...VERBS].filter((m) => m !== "Check" || seen.has(m)))
    ok(ALL_ES[move] !== undefined, `Spanish for the move "${move}"`);
  console.log(
    `swept ${problems} problems, ${steps} steps, ${seen.size} distinct moves: ${[...seen].sort().join(", ")}`,
  );
}

console.log(`fluency-step-lens: ${checks} checks passed`);

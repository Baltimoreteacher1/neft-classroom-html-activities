import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import {
  renderLearnModules,
  renderPrintFooter,
  renderProblemAsk,
  renderTopBar,
  v3Of,
} from "../scripts/lib/homework-v3-learn.mjs";
import { V3_LEARN_CSS, V3_LEARN_JS } from "../scripts/lib/homework-v3-learn-assets.mjs";

const bi = (en, es) => ({ en, es });
const v3 = (extra = {}) => ({
  version: 1,
  kind: "mindset",
  classModel: { name: bi("the stepping stone", "el peldaño") },
  model: { kind: "none", data: {} },
  transfer: null,
  glitch: {
    scenario: bi("S", "S"),
    steps: [
      { ...bi("a", "a"), isGlitch: false },
      { ...bi("b", "b"), isGlitch: true },
      { ...bi("c", "c"), isGlitch: false },
    ],
    fix: bi("fix", "arreglo"),
    frame: bi("f", "f"),
  },
  spiral: [
    {
      from: "1-1",
      q: bi("Q?", "¿Q?"),
      options: ["1", "2", "3"],
      correctIdx: 1,
      exp: bi("because", "porque"),
    },
  ],
  kitchenTable: bi("Talk at the table.", "Hablen en la mesa."),
  ...extra,
});
const cfg = (id, notes) => ({
  lessonId: id,
  familyNotes: { stuckTips: { say: [bi("What is the part?", "¿Cuál es la parte?")] }, ...notes },
});

test("a lesson with no v3 block fails the build; there is no unit-level fallback", () => {
  assert.throws(() => v3Of({ familyNotes: {} }, "4-5"), /no "v3" block/);
  assert.throws(
    () => renderLearnModules({ lessonId: "4-5", familyNotes: {} }, "4-5"),
    /no "v3" block/,
  );
});

test("Learn modules come from the lesson's own v3 block; the glitch shows on Part 2 only", () => {
  const base = renderLearnModules(cfg("10-4", { v3: v3() }), "10-4");
  const part2 = renderLearnModules(cfg("10-4-part2", { v3: v3() }), "10-4-part2");
  assert.match(base, /id="hw_kitchen_table_prompt"/);
  assert.match(base, /Talk at the table\./);
  assert.doesNotMatch(base, /id="hw_spot_the_glitch"/);
  assert.match(part2, /id="hw_spot_the_glitch"/);
  assert.doesNotMatch(base + part2, /smoothie|berries|Jordan|Ratio Tape|onclick=/);
});

test("the top bar has no dev-style progress readout and no inline handlers", () => {
  const bar = renderTopBar();
  assert.match(bar, /data-persona-btn="student"/);
  assert.match(bar, /data-persona-btn="copilot"/);
  assert.doesNotMatch(bar, /Completed:|Accuracy:|Streak:|onclick=/);
});

test("the per-problem ask renders only when the problem authored one; the print footer uses this lesson's questions", () => {
  assert.equal(renderProblemAsk({}, 0, null), "");
  assert.match(
    renderProblemAsk({ coach: "Which is bigger?", coachEs: "¿Cuál es mayor?" }, 2, null),
    /Which is bigger\?/,
  );
  const footer = renderPrintFooter(cfg("10-4", { v3: v3() }), "10-4");
  assert.match(footer, /What is the part\?/);
  assert.match(footer, /Talk at the table\./);
});

test("answer checks work in a browser: a wrong pick nudges and reveals nothing, the right pick settles and explains", () => {
  const html = `<body><section class="hw-subcard" id="s"><div class="hw-glitch-steps"><button class="hw-glitch-step-btn" data-is-glitch="0">a</button><button class="hw-glitch-step-btn" data-is-glitch="1">b</button></div>
    <p class="hw-v3-nudge" hidden>try</p><div class="hw-glitch-feedback" hidden>fix</div></section>
    <div class="hw-spiral-item"><button class="hw-spiral-opt-btn" data-correct="0">1</button><button class="hw-spiral-opt-btn" data-correct="1">2</button><p class="hw-v3-nudge" hidden>t</p><p class="hw-spiral-exp" hidden>why</p></div>
    <div data-persona-btn="student" aria-pressed="true"></div><button data-persona-btn="copilot" aria-pressed="false"></button><button id="hw_theme_toggle_btn"></button><script>window.LESSON_ID="t";${V3_LEARN_JS}</script></body>`;
  const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.test/" });
  const d = dom.window.document;
  const [a, b] = d.querySelectorAll(".hw-glitch-step-btn");
  a.click();
  assert.equal(
    d.querySelector(".hw-glitch-feedback").hidden,
    true,
    "a wrong step must not reveal the fix",
  );
  assert.equal(d.querySelector(".hw-v3-nudge").hidden, false);
  assert(a.classList.contains("is-try-again"));
  b.click();
  assert.equal(d.querySelector(".hw-glitch-feedback").hidden, false);
  assert(b.classList.contains("is-correct"));
  const [, right] = d.querySelectorAll(".hw-spiral-opt-btn");
  right.click();
  assert.equal(d.querySelector(".hw-spiral-exp").hidden, false);
  d.querySelector('button[data-persona-btn="copilot"]').click();
  assert.equal(d.body.getAttribute("data-persona-mode"), "copilot");
  d.getElementById("hw_theme_toggle_btn").click();
  assert.equal(d.documentElement.getAttribute("data-theme"), "dark");
});

test("styles: print footer on paper only, reduced motion respected, no red or shake", () => {
  assert.match(V3_LEARN_CSS, /@media print/);
  assert.match(V3_LEARN_CSS, /hw-print-socratic-footer/);
  assert.match(V3_LEARN_CSS, /prefers-reduced-motion: no-preference/);
  assert.doesNotMatch(V3_LEARN_CSS, /shake|#f00|#ff0000|red\b/i);
});

test("a worked example that belongs to another lesson is never offered as a hint", async () => {
  const { workedExampleFor } = await import("../scripts/lib/homework-worked-example.mjs");
  const conceptIntro = {
    iDo: {
      title: "Watch me estimate the peas",
      lines: ["There are 120 peas in 4 pods.", "So 30 per pod."],
    },
  };
  const peas = {
    launch: { conceptIntro },
    familyNotes: {
      bigIdea: { en: "Find 2/3 of 60 pods." },
      conceptSteps: [],
      tryTogether: {},
      bridge: {},
    },
  };
  assert.equal(
    workedExampleFor(peas),
    null,
    "1-1's example on a 2/3-of-60 lesson is another lesson's",
  );
  const own = {
    launch: { conceptIntro },
    familyNotes: { bigIdea: { en: "120 peas in 4 pods is 30 a pod." } },
  };
  assert.ok(workedExampleFor(own), "an example that shares its numbers with the lesson stays");
});

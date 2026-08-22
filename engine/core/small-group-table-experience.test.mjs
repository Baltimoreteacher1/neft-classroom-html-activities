// small-group-table-experience.test.mjs — the teacher-at-the-table layer:
// per-item teacher lens, the every-third-solve table check, and the generated
// "Fix our table's thinking" debugging items. Runs the REAL modules via the
// engine hooks (tools/lib/engine-hooks.mjs) under jsdom.
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import "../../tools/lib/register-engine-hooks.mjs";

const { JSDOM } = await import("jsdom");
const dom = new JSDOM("<!doctype html><html><body><div id=\"app\"></div></body></html>", {
  url: "https://example.test/lessons/2-1-group1/",
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.location = dom.window.location;
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.CustomEvent = dom.window.CustomEvent;
globalThis.MutationObserver = dom.window.MutationObserver;
globalThis.getComputedStyle = dom.window.getComputedStyle;
globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 0);
globalThis.localStorage = dom.window.localStorage;
globalThis.sessionStorage = dom.window.sessionStorage;

const { teacherLens, tableCheck } = await import("./small-group-practice.js");

// ── teacher lens ──────────────────────────────────────────────────────────
{
  const lens = teacherLens({
    type: "multiple-choice",
    choices: ["4", "6", "8", "10"],
    correctIndex: 2,
    choiceFeedback: [
      "Did you count both rows?",
      "",
      "Correct — nothing shows for this one.",
      "That doubles the answer — where did the extra factor come from?",
    ],
    hints: ["Start by naming the number of equal groups."],
  });
  assert.ok(lens, "lens renders when probes and hints exist");
  const rows = [...lens.querySelectorAll(".sg-lens-row")];
  // Probes exclude the correct index and keep at most two, longest first.
  const text = lens.textContent;
  assert.ok(text.includes("That doubles the answer"), "richest distractor probe present");
  assert.ok(text.includes("Did you count both rows?"), "second probe present");
  assert.ok(!text.includes("nothing shows for this one"), "correct-choice feedback excluded");
  assert.ok(text.includes("Start by naming the number of equal groups."), "nudge from hints[0]");
  assert.ok(rows.length === 3, `2 probes + 1 nudge, got ${rows.length}`);

  assert.equal(teacherLens({ type: "open-response", stem: "Explain." }), null,
    "no authored fuel → no lens (absence is a pass)");

  const eaLens = teacherLens({ type: "error-analysis", errorStep: 2, workedExample: [] });
  assert.ok(eaLens.textContent.includes("step 2"), "error-analysis lens names the step");
}

// ── table check ───────────────────────────────────────────────────────────
{
  // English lane (default): English only.
  const englishOnly = tableCheck(3);
  assert.ok(englishOnly.textContent.includes("Table check"), "English copy present");
  assert.ok(!englishOnly.textContent.includes("Chequeo de mesa"),
    "Spanish stays off until the student turns the lane on");
  // Spanish lane on: bilingual, matching every other student-facing SG string.
  localStorage.setItem("nt-lang", "es");
  const check = tableCheck(6);
  assert.ok(check.textContent.includes("Table check"), "English still leads");
  assert.ok(check.textContent.includes("Chequeo de mesa"), "Spanish copy present");
  assert.ok(check.textContent.includes("#6"), "names the problem number");
  const done = check.querySelector(".sg-tablecheck-done");
  done.onclick();
  assert.ok(check.classList.contains("sg-tablecheck-ok"), "dismiss settles the card");
  assert.ok(done.disabled, "dismiss is one-shot");
}

// ── styles actually inside the injected template (backtick-truncation guard) ─
{
  const uiSource = readFileSync(new URL("./small-group-ui.js", import.meta.url), "utf8");
  for (const marker of [".sg-lens{", "body.sg-is-teacher .sg-lens{display:block}", ".sg-tablecheck{", ".sg-tablecheck-ok"])
    assert.ok(uiSource.includes(marker), `style marker missing: ${marker}`);
}

// ── generated debugging items: every variant, fully bilingual ─────────────
{
  const TITLE = "Fix our table's thinking";
  const TIERS = ["approaching", "onLevel", "extending", "optional"];
  let carrying = 0;
  for (const id of readdirSync(new URL("../../lessons", import.meta.url))) {
    if (!/^\d+-\d+-(group\d|catchup)$/.test(id)) continue;
    const config = JSON.parse(
      readFileSync(new URL(`../../lessons/${id}/config.json`, import.meta.url), "utf8"),
    );
    const found = TIERS.flatMap((tier) => config.practice?.[tier] || []).filter(
      (item) => item.title === TITLE,
    );
    assert.ok(found.length <= 1, `${id}: at most one debugging item`);
    if (!found.length) continue;
    carrying += 1;
    const item = found[0];
    assert.equal(item.type, "error-analysis");
    assert.equal(item.errorStep, 1, `${id}: the classmate's answer is the error step (0-based)`);
    assert.equal(item.workedExample.length, 2);
    for (const step of item.workedExample) {
      assert.ok(step.work && step.workEs && step.label && step.labelEs, `${id}: bilingual steps`);
    }
    assert.ok(item.correctWork.startsWith("The correct answer is "), `${id}: names the fix`);
    assert.ok(item.correctWorkEs.startsWith("La respuesta correcta es "), `${id}: bilingual fix`);
    if (item.hints) assert.ok(Array.isArray(item.hintsEs), `${id}: hints are all-or-nothing bilingual`);
  }
  assert.ok(carrying >= 200, `debugging items cover the fleet (${carrying}/204)`);
}

console.log("table experience: lens, check, styles, and 204 debugging items verified.");

// ── the step guide shows every authored step ──────────────────────────────
//
// The cap was four. The worked explanation for "What is 14.6 + 3.85?" is six
// steps — line up, hundredths, tenths, ones, tens, answer — so a student who
// pressed "Break it into steps" got four and never saw 18.45. Nineteen of the
// twenty-seven truncated explanations were hiding the result that way.
{
  const { explanationSteps } = await import("./small-group-practice.js");

  const sixStep = {
    explanation:
      "Line up decimals: 14.60 + 3.85. Hundredths: 0 + 5 = 5. " +
      "Tenths: 6 + 8 = 14, write 4 carry 1. Ones: 4 + 3 + 1 = 8. " +
      "Tens: 1. Answer: 18.45.",
  };
  const steps = explanationSteps(sixStep);
  assert.equal(steps.length, 6, `a six-sentence explanation yields six steps, got ${steps.length}`);
  assert.ok(
    steps[steps.length - 1].includes("18.45"),
    "the final step still carries the answer — truncating it was the bug",
  );

  // Still bounded: the cap exists so a runaway explanation cannot become a wall.
  const many = { explanation: Array.from({ length: 12 }, (_, i) => `Step ${i + 1} here.`).join(" ") };
  assert.equal(explanationSteps(many).length, 6, "the guide is still capped");

  assert.deepEqual(explanationSteps({ explanation: "" }), [], "no explanation, no steps");
  assert.deepEqual(explanationSteps({}), [], "a missing explanation is not an error");
}

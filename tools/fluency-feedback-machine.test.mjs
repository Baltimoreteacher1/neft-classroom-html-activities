import assert from "node:assert/strict";

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: { getItem: () => null, setItem() {}, removeItem() {} },
});
Object.defineProperty(globalThis, "window", { configurable: true, value: globalThis });
const { FEEDBACK_PHASES, feedbackView, nextPhase } = await import(
  "../math/fluency-lab/feedback-machine.js"
);

let checks = 0;
const check = (condition, message) => {
  assert.ok(condition, message);
  checks++;
};
const run = (events, start = "idle") =>
  events.reduce((phase, [event, options]) => nextPhase(phase, event, options).phase, start);

check(run([["right"]]) === "correct", "first-try independent success is 'correct'");
check(
  run([["right", { independent: false }]]) === "assisted",
  "success after a hint is 'assisted', never 'correct'",
);
check(run([["wrong"], ["right"]]) === "assisted", "a right second try is assisted");
check(run([["wrong"], ["wrong"]]) === "revealed", "two misses reveal the solution");
check(
  run([["wrong"], ["wrong-again"], ["wrong-again"]]) === "retry",
  "a supported problem keeps the retry state across misses",
);
check(run([["wrong-final"]]) === "revealed", "a single-attempt mode reveals on the first miss");
check(run([["wrong-final"], ["revise-right"]]) === "revised", "a fixed answer is 'revised'");
check(
  run([["wrong-final"], ["revise-wrong"]]) === "revealed",
  "a wrong fix stays open for another try",
);
check(run([["wrong"], ["empty"]]) === "retry", "an empty submit does not leave the retry state");
check(run([["empty"], ["right"]]) === "correct", "an empty submit is not an attempt");

// Duplicate submissions: terminal phases refuse every submit event.
for (const terminal of ["correct", "assisted", "revised"])
  for (const event of ["right", "wrong", "wrong-final", "empty"])
    check(nextPhase(terminal, event).accepted === false, `${terminal} ignores a second '${event}'`);
check(nextPhase("revealed", "right").accepted === false, "a revealed problem cannot be re-scored");
check(nextPhase("correct", "reset").phase === "idle", "reset starts the next problem");

// Views: never colour alone, answer preserved, controls on a miss, no solution during a checkup.
const ctx = { submitted: "12", expected: "15" };
const right = feedbackView("correct", ctx);
check(
  right.heading === "Correct!" && right.icon.includes("<svg") && right.lines.at(-1).value === "15",
  "correct: heading, icon, highlighted answer",
);
check(
  right.announcement.includes("Correct!") && right.announcement.includes("15"),
  "correct is announced with its answer",
);
const assisted = feedbackView("assisted", ctx);
check(
  assisted.badge !== right.badge && /help/.test(assisted.badge),
  "independent and hinted success are told apart in words",
);
const miss = feedbackView("retry", ctx);
check(miss.heading === "Not quite. Let's work through it.", "miss heading matches the spec");
check(
  miss.lines.length === 1 && miss.lines[0].value === "12" && miss.lines[0].label === "Your answer",
  "the learner's answer is kept",
);
check(!miss.lines.some((line) => line.value === "15"), "a first miss does not state the answer");
check(
  miss.actions.map((action) => action.id).join() === "try-again,hint,worked",
  "miss offers try again, hint and worked example",
);
check(
  feedbackView("retry", { ...ctx, hintAvailable: false }).actions.every(
    (action) => action.id !== "hint",
  ),
  "a used hint is not offered again",
);
check(
  feedbackView("retry", { ...ctx, stepsAvailable: false }).actions.every(
    (action) => action.id !== "worked",
  ),
  "no worked example button when there are no steps",
);
check(
  feedbackView("revealed", { ...ctx, reveal: false }).lines.every((line) => line.value !== "15"),
  "a checkup never shows the answer",
);
check(
  feedbackView("empty").tone === "neutral" && feedbackView("nonsense") === null,
  "empty is neutral and unknown phases have no view",
);
const tones = new Set(
  FEEDBACK_PHASES.map((phase) => feedbackView(phase, ctx)?.icon).filter(Boolean),
);
check(tones.size === 3, "check, think and info are three different shapes, not three colours");

console.log(`fluency-feedback-machine: ${checks} checks passed`);

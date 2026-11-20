import assert from "node:assert/strict";
import test from "node:test";
import {
  newQuestionLimits,
  rehearsalPlan,
  validateTaskPack,
} from "../access-practice-lab/src/speaking/task-packs.js";

const pack = (overrides = {}) => ({
  schema: "lp-speak-pack/1",
  id: "explain-a-change",
  title: { en: "Explain a change", es: "Explicar un cambio" },
  band: "3-5",
  stage: "B",
  klu: "Explain",
  settings: { rehearsal: false },
  questions: [
    {
      id: "q1",
      prompt: { text: { en: "What changed?", es: "¿Qué cambió?" } },
      response: "audio",
      limits: { ...newQuestionLimits(), reviewSec: 8, respondSec: 30, minRespondSec: 5 },
    },
  ],
  ...overrides,
});

test("X1 task-pack schema accepts bilingual packs with safe defaults", () => {
  const result = validateTaskPack(pack());
  assert.equal(result.ok, true, result.errors.join(" "));
  assert.equal(result.value.settings.release, "manual");
  assert.equal(result.value.settings.late, "accept-flag");
  assert.equal(result.value.questions[0].limits.attempts, 1);
});

test("X2 rejects zero review, invalid minimum response, and unsupported response types", () => {
  const result = validateTaskPack(
    pack({
      questions: [
        {
          ...pack().questions[0],
          response: "choice",
          limits: { ...newQuestionLimits(), reviewSec: 0, respondSec: 3, minRespondSec: 2 },
        },
      ],
    }),
  );
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("reviewSec")));
  assert.ok(result.errors.some((e) => e.includes("minRespondSec requires")));
});

test("X2 rehearsal is opt-in and only creates configured phases", () => {
  const q = pack().questions[0];
  assert.deepEqual(rehearsalPlan(q, { rehearsal: false }), { enabled: false, phases: [] });
  const enabled = rehearsalPlan(q, { rehearsal: true });
  assert.equal(enabled.enabled, true);
  assert.deepEqual(
    enabled.phases.map((p) => [p.id, p.seconds]),
    [
      ["review", 8],
      ["respond", 30],
    ],
  );
  assert.deepEqual(enabled.phases[1].countdown, [3, 2, 1]);
});

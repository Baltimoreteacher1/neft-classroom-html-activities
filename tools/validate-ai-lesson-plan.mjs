import assert from "node:assert/strict";

import {
  buildLessonPrompt,
  extractStructuredPlan,
  lessonPlanSchema,
  validateLessonRequest,
} from "../functions/api/ai/lesson-plan.js";
import { buildWorkersLesson } from "../functions/_lib/workers-lesson.js";

const validRequest = {
  sourceText:
    "--- Slide 1 ---\nUnit Rate\nObjective: Students will find unit rates.\nStandard: 6.RP.A.2",
  sourceName: "unit-rate.pptx",
  fields: {
    date: "2026-06-22",
    grade: "6",
    course: "Mathematics",
    unit: "Ratios and Rates",
    focus: "Find unit rates",
    standards: "6.RP.A.2",
    length: "50 minutes",
    skill: "Mixed / typical",
    wida: "Level 2 (Emerging)",
  },
};

assert.equal(validateLessonRequest(validRequest).ok, true);
assert.equal(
  validateLessonRequest({ ...validRequest, sourceText: "" }).ok,
  false,
);
assert.equal(
  validateLessonRequest({
    ...validRequest,
    sourceText: "x".repeat(60_001),
  }).ok,
  false,
);

const prompt = buildLessonPrompt(validRequest);
assert.match(prompt, /2026-06-22/);
assert.match(prompt, /Slide 1/);
assert.doesNotMatch(prompt, /studentName|sped|private notes/i);

assert.equal(lessonPlanSchema.type, "object");
assert.equal(lessonPlanSchema.additionalProperties, false);
assert.ok(lessonPlanSchema.required.includes("header"));
assert.ok(lessonPlanSchema.required.includes("exit"));

const plan = { header: { title: "Unit Rate" }, exit: { items: [] } };
assert.deepEqual(extractStructuredPlan({ output_text: JSON.stringify(plan) }), plan);
assert.throws(
  () => extractStructuredPlan({ output_text: "not json" }),
  /valid lesson plan JSON/i,
);

let workersRequest;
let workersModel;
const workersResult = await buildWorkersLesson(
  {
    run: async (modelName, request) => {
      workersModel = modelName;
      workersRequest = request;
      return { response: plan };
    },
  },
  prompt,
  lessonPlanSchema,
);
assert.deepEqual(workersResult.plan, plan);
assert.equal(workersModel, "@cf/meta/llama-3.1-8b-instruct-fast");
assert.equal(workersRequest.response_format.type, "json_schema");
assert.equal(workersRequest.response_format.json_schema, lessonPlanSchema);
assert.equal(workersRequest.max_tokens, 8_500);
assert.equal(workersRequest.temperature, 0.2);

console.log("AI lesson-plan contract validation passed.");

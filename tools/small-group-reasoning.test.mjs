#!/usr/bin/env node
// Contract test for /api/reasoning/review — the reasoning reader.
//
// This is the one new surface where a model writes text a 12-year-old will read
// mid-lesson, so the tests are about what it must REFUSE to do. The answer-leak
// guard is the important one: the whole feature is worthless if the coaching
// hands over the answer, and a model asked to help a struggling student will try.

import assert from "node:assert/strict";

const { onRequest } = await import("../functions/api/reasoning/[[path]].js");

let checks = 0;

async function review(body, env = {}) {
  const request = new Request("https://example.test/api/reasoning/review", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
  const response = await onRequest({ request, env, params: { path: ["review"] } });
  return { status: response.status, data: await response.json() };
}

// A stub Workers AI binding, so the route's real parsing and guard logic run.
const aiReturning = (text) => ({
  AI: {
    async run() {
      return { response: text };
    },
  },
});

// ------------------------------------------------------------------ validation
{
  checks += 1;
  const noResponse = await review({ prompt: "Explain." });
  assert.equal(noResponse.status, 400, "no written response → 400");
}
{
  checks += 1;
  const noPrompt = await review({ response: "I multiplied both numbers together." });
  assert.equal(noPrompt.status, 400, "no prompt → 400, the model must not guess the task");
}
{
  checks += 1;
  const health = await onRequest({
    request: new Request("https://example.test/api/reasoning/health"),
    env: {},
    params: { path: ["health"] },
  });
  const data = await health.json();
  assert.equal(data.live, false, "health reports not-live with no AI configured");
}
{
  checks += 1;
  const unconfigured = await review({
    prompt: "Explain how you know.",
    response: "I lined up the decimals and then I added them carefully.",
  });
  assert.equal(unconfigured.status, 503, "no model available → 503 so the studio degrades quietly");
}

// -------------------------------------------- too short is answered locally
{
  checks += 1;
  const short = await review(
    { prompt: "Explain how you know.", response: "because yes" },
    aiReturning("{}"),
  );
  assert.equal(short.data.source, "local", "a two-word entry never costs a model call");
  assert.match(short.data.question, /\?$/, "still ends with a question");
  assert.ok(short.data.gap, "and names what is missing");
}

// ------------------------------------------------------- normal coaching path
{
  checks += 1;
  const good = await review(
    {
      prompt: "Explain how you know 3.4 × 2.6 = 8.84.",
      response:
        "I multiplied 34 by 26 and got 884. Then I put the decimal point in because there were decimals in the problem.",
      answerShown: "8.84",
    },
    aiReturning(
      JSON.stringify({
        strengths: "You separated the multiplying from the placing of the point.",
        gap: "You did not say how many places to move the point or why.",
        question: "How do the decimal places in each factor decide where the point goes?",
      }),
    ),
  );
  assert.equal(good.data.ok, true);
  assert.equal(good.data.source, "workers-ai");
  assert.match(good.data.question, /\?$/);
  assert.ok(good.data.strengths.length > 0);
}

// ------------------------------------------------- THE ANSWER-LEAK GUARD
{
  checks += 1;
  const leaked = await review(
    {
      prompt: "Explain how you know 3.4 × 2.6 = 8.84.",
      response: "I multiplied 34 by 26 and then I guessed where the point went.",
      answerShown: "8.84",
    },
    aiReturning(
      JSON.stringify({
        strengths: "Good start.",
        gap: "The answer is 8.84 because there are two decimal places.",
        question: "Can you see why it is 8.84?",
      }),
    ),
  );
  assert.equal(leaked.data.filtered, true, "coaching containing the answer is SUPPRESSED");
  assert.ok(
    !JSON.stringify(leaked.data).includes("8.84"),
    "no part of the response may contain the answer",
  );
  assert.match(leaked.data.question, /\?$/, "a safe fallback question is served instead");
}
{
  // The guard must not fire on a number that merely contains the answer's digits.
  checks += 1;
  const fine = await review(
    {
      prompt: "Explain how you know.",
      response: "I multiplied the whole numbers first and then placed the point.",
      answerShown: "8.84",
    },
    aiReturning(
      JSON.stringify({
        strengths: "",
        gap: "You did not say how you counted the places.",
        question: "You wrote 88.84 earlier — how many places should there be?",
      }),
    ),
  );
  assert.ok(!fine.data.filtered, "88.84 is not 8.84 — the guard must not over-trigger");
}

// ------------------------------------------------------ malformed model output
{
  checks += 1;
  const junk = await review(
    { prompt: "Explain how you know.", response: "I did the thing with the numbers and it worked." },
    aiReturning("I think you did great!"),
  );
  assert.equal(junk.status, 502, "unparseable model output → 502, never a raw model string");
}
{
  checks += 1;
  const fenced = await review(
    { prompt: "Explain how you know.", response: "I lined up the points and added them up." },
    aiReturning('```json\n{"strengths":"","gap":"","question":"Why does that work?"}\n```'),
  );
  assert.equal(fenced.data.ok, true, "a fenced JSON reply is still accepted");
  assert.equal(fenced.data.question, "Why does that work?");
}
{
  checks += 1;
  const noQuestion = await review(
    { prompt: "Explain how you know.", response: "I lined up the points and added them up." },
    aiReturning('{"strengths":"Nice.","gap":"Something.","question":""}'),
  );
  assert.equal(noQuestion.status, 502, "a reply with no question is not usable coaching");
}

// ------------------------------------------------ the misconception is forwarded
{
  checks += 1;
  const withMisconception = await review(
    {
      prompt: "Explain how you know.",
      response: "I added the top numbers and I added the bottom numbers too.",
      misconception: "Added the denominators",
    },
    aiReturning('{"strengths":"","gap":"Thirds and fifths cannot become eighths.","question":"What does the bottom number tell you?"}'),
  );
  assert.equal(
    withMisconception.data.usedMisconception,
    "Added the denominators",
    "the deterministic detector's finding is echoed so the studio can show what was aimed at",
  );
}

console.log(`reasoning reader: ${checks} checks passed.`);

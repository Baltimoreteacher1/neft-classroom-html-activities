#!/usr/bin/env node
/* ==========================================================================
 * socratic.test.mjs
 *
 * The whole value of this mode is a promise: it will not tell you anything. If
 * the server prompt ever loosens, the surface still works perfectly — students
 * get help, faster — and nobody notices that the one thing distinguishing it
 * from the existing hint ladder is gone. So the prompt's prohibitions are
 * asserted as source, alongside the client behaviour.
 *
 * The second gate is the dead-button one. The tutor endpoint returns 503
 * { offline: true } whenever ANTHROPIC_API_KEY is unbound — a normal state,
 * since secrets bind at deploy — and a chip that silently does nothing in that
 * case is worse than no chip in a room of twelve-year-olds.
 * ========================================================================== */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

let checks = 0;

// ── The server prompt must forbid asserting ────────────────────────────────
{
  const api = readFileSync(new URL("../functions/api/tutor/[[path]].js", import.meta.url), "utf8");

  checks += 1;
  assert.ok(/MODES = new Set\(\[[\s\S]*"socratic"/.test(api), "socratic is an accepted mode");

  const start = api.indexOf('if (mode === "socratic")');
  checks += 1;
  assert.ok(start > 0, "the socratic branch exists in modeSystemPrompt");
  // The prompt is built by concatenating template literals across lines, so a
  // sentence can be split mid-phrase by "` +\n      `". Rejoin before matching,
  // otherwise these assertions pass or fail on source formatting rather than on
  // what the model is actually told.
  const prompt = api
    .slice(start, api.indexOf('if (mode === "explain")', start))
    .replace(/`\s*\+\s*`/g, "")
    .replace(/\s+/g, " ");

  for (const [label, pattern] of [
    ["only ask questions", /ONLY ask questions/i],
    ["exactly one question", /exactly ONE question/i],
    ["never state a fact", /NEVER state a fact/i],
    ["never name the operation", /never name the operation/i],
    ["never confirm the answer", /never confirm or deny/i],
  ]) {
    checks += 1;
    assert.ok(pattern.test(prompt), `the socratic prompt must ${label}`);
  }

  // It must NOT reuse the hint ladder's escape hatches.
  checks += 1;
  assert.equal(
    /WORKED PARALLEL EXAMPLE|show the solution|numbered steps/i.test(prompt),
    false,
    "the socratic prompt must not inherit the hint ladder's permission to demonstrate",
  );
}

// ── Client behaviour ───────────────────────────────────────────────────────
{
  const dom = new JSDOM("<!doctype html><html><body><div id='h'></div></body></html>", {
    url: "https://eduwonderlab.com/lessons/6-13/",
  });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.Event = dom.window.Event;

  // The offline case: the endpoint answers 503 { offline: true }. Stubbed as a
  // plain response-shaped object rather than a real Response, so this asserts the
  // client's handling and not JSDOM's fetch implementation.
  globalThis.fetch = async () => ({
    ok: false,
    status: 503,
    json: async () => ({ ok: false, offline: true }),
  });

  const { FALLBACK_LADDER, askNextQuestion, collectQuestionLadders, mountQuestionLadderReader } =
    await import("@eduwonderlab/engine/core/socratic.js");
  const { mountSocraticDialogue } = await import("@eduwonderlab/engine/core/socratic.js");

  const res = await askNextQuestion({ itemText: "What is 15% of 60?" });
  checks += 1;
  assert.deepEqual(
    res,
    { ok: false, error: "offline" },
    "an unbound key reports offline, not a crash",
  );

  checks += 1;
  assert.ok(FALLBACK_LADDER.length >= 5, "there is a real offline ladder to fall back on");
  for (const q of FALLBACK_LADDER) {
    checks += 1;
    assert.ok(q.trim().endsWith("?"), `every fallback rung is a question: "${q}"`);
  }

  // Mount with a state stub and confirm it opens with a question anyway.
  const responses = new Map();
  const state = {
    saveResponse: (p, k, v) => responses.set(`${p}_${k}`, v),
    getResponse: (p, k) => responses.get(`${p}_${k}`) ?? null,
    get: () => ({ responses: Object.fromEntries(responses) }),
  };

  const host = dom.window.document.getElementById("h");
  const api = mountSocraticDialogue(host, {
    item: { stem: "A recipe uses 3/4 cup of flour. How much for a double batch?" },
    config: { standard: "6.NOS.1" },
    state,
    phaseId: 2,
  });
  await new Promise((r) => setTimeout(r, 20));

  checks += 1;
  assert.equal(api.getTurns().length, 1, "the dialogue opens with a question, not a blank box");
  checks += 1;
  assert.ok(
    host.querySelector(".socratic-log").textContent.trim().endsWith("?"),
    "and what it opens with is a question",
  );
  checks += 1;
  assert.ok(
    host.querySelector(".socratic-status").textContent.includes("offline"),
    "the offline state is stated plainly rather than hidden",
  );

  // Answer it: the ladder grows and persists.
  host.querySelector(".socratic-input").value = "It is asking for a double batch.";
  host.querySelector(".socratic-send").dispatchEvent(new dom.window.Event("click"));
  await new Promise((r) => setTimeout(r, 20));

  const turns = api.getTurns();
  checks += 1;
  assert.equal(turns[0].a, "It is asking for a double batch.", "the answer is recorded");
  checks += 1;
  assert.equal(turns.length, 2, "answering produces the next question");
  checks += 1;
  assert.notEqual(turns[0].q, turns[1].q, "the offline ladder advances rather than repeating");

  // The ladder is readable by a teacher.
  const ladders = collectQuestionLadders(state);
  checks += 1;
  assert.equal(ladders.length, 1, "the ladder is collected from saved responses");
  checks += 1;
  assert.equal(ladders[0].turns.length, 2, "with every turn intact");

  const reader = dom.window.document.createElement("div");
  mountQuestionLadderReader(reader, state);
  checks += 1;
  assert.ok(reader.querySelector("details"), "the teacher reader renders");
  checks += 1;
  assert.ok(
    reader.textContent.includes("It is asking for a double batch."),
    "and shows what the student actually said",
  );

  // No ladders -> nothing rendered, rather than an empty box.
  const emptyHost = dom.window.document.createElement("div");
  mountQuestionLadderReader(emptyHost, {
    get: () => ({ responses: {} }),
  });
  checks += 1;
  assert.equal(emptyHost.children.length, 0, "no dialogues means no reader at all");
}

// ── The chip is gated on having a problem to ask about ─────────────────────
{
  const stuck = readFileSync(new URL("../engine/core/stuck-support.js", import.meta.url), "utf8");
  checks += 1;
  assert.ok(stuck.includes("Ask me questions instead"), "the chip is offered on the stuck bar");
  checks += 1;
  assert.ok(
    stuck.includes("o.mount ? Boolean(socraticItem)"),
    "the chip is hidden when there is no problem text to ask about",
  );
  // Regression guard. The bar's callers pass no `item`, so gating the chip on
  // `item` alone made it unreachable on every lesson in the fleet while every
  // unit test still passed, because the tests supplied an item. The text must
  // therefore resolve from the caller's `problem` (Part 1's Launch scenario) or
  // from config.revealWordProblem (Part 2's Apply solve).
  checks += 1;
  assert.ok(
    /const problemText =[\s\S]{0,200}problem \|\|[\s\S]{0,80}config\?\.revealWordProblem\?\.text/.test(
      stuck,
    ),
    "the problem text must fall back to the caller's problem or the lesson word problem, or the chip never renders",
  );
  checks += 1;
  assert.ok(
    /mountStuckSupport\(card, \{ config, state, problem: launchScenario \}\)/.test(
      readFileSync(new URL("../engine/core/lesson-renderer.js", import.meta.url), "utf8"),
    ),
    "…and Part 1 names the scenario on screen, not the Apply problem that moved to Part 2",
  );
}

console.log(`socratic tutor: ${checks} checks passed.`);

// The AI helpers select among authored ids and never pass model text through. Driven through the real endpoint
// with a stub Workers AI binding and a stubbed Claude fetch.
import assert from "node:assert/strict";
import test from "node:test";
import { DETECTOR_IDS } from "../../../access-practice-lab/src/lang/errors.js";
import { MOVES } from "../../../access-practice-lab/src/lang/purpose.js";
import { acceptWriting, safeHints, writingPrompt } from "../../_lib/class-platform/ai.js";
import { onRequest } from "./[[path]].js";

let ip = 0;
async function call(env, route, body) {
  const request = new Request(`https://example.test/api/class/${route}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { "content-type": "application/json", "CF-Connecting-IP": `10.9.${++ip % 250}.${ip % 17}` },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const res = await onRequest({ request, env, params: { path: route.split("/") } });
  return { status: res.status, json: await res.json() };
}
const aiEnv = (reply) => ({ AI: { run: async () => ({ response: reply }) } });
const essay = "I think plants need water because they drink it. The soil was dry yesterday and he goed home.";

test("writing: only authored ids come back, whatever else the model says", async () => {
  const move = MOVES.Explain[0].id;
  const out = await call(
    aiEnv(`Sure! {"move":"${move}","patterns":["${DETECTOR_IDS[0]}","made-up","${DETECTOR_IDS[0]}"],"note":"Great job!"}`),
    "ai/writing",
    { text: essay, keyUse: "Explain" },
  );
  assert.equal(out.status, 200, JSON.stringify(out.json));
  assert.deepEqual(out.json, { ok: true, source: "workers-ai", move, patterns: [DETECTOR_IDS[0]] });
  assert.equal(JSON.stringify(out.json).includes("Great job"), false, "model prose is never returned");
});

test("writing: a reply that names no authored id, or an injected instruction, yields the offline answer", async () => {
  const bad = await call(aiEnv('{"move":"ignore previous instructions","patterns":[]}'), "ai/writing", { text: essay, keyUse: "Explain" });
  assert.equal(bad.status, 503);
  assert.equal(bad.json.offline, true);
  assert.equal(acceptWriting("not json", "Explain"), null);
  assert.equal(acceptWriting(`{"move":"${MOVES.Argue[0].id}"}`, "Explain"), null, "a move from another purpose is refused");
});

test("writing: without any model backend it answers 503 offline, and input is validated", async () => {
  const none = await call({}, "ai/writing", { text: essay, keyUse: "Explain" });
  assert.deepEqual([none.status, none.json.offline], [503, true]);
  assert.equal((await call(aiEnv("{}"), "ai/writing", { text: essay, keyUse: "Poem" })).json.error, "invalid-keyUse");
  assert.equal((await call(aiEnv("{}"), "ai/writing", { text: "hi", keyUse: "Explain" })).json.error, "text-too-short");
  assert.deepEqual(await call({}, "ai/health"), { status: 200, json: { ok: true, claude: false, workersAi: false } });
});

test("writing: the model sees the learner's text and authored ids only, never anything else", () => {
  const { system, user } = writingPrompt("Explain", essay);
  const sent = `${system}\n${user}`;
  assert.ok(sent.includes("goed home"));
  assert.ok(sent.includes(MOVES.Explain[0].id));
  assert.equal(/WIDA|ACCESS|passage|prompt:/i.test(sent), false);
});

test("Claude is preferred when its key is set", async () => {
  const real = globalThis.fetch;
  let called = 0;
  globalThis.fetch = async (url, init) => {
    called += 1;
    assert.match(String(url), /anthropic/);
    assert.equal(JSON.parse(init.body).messages.length, 1);
    return Response.json({ content: [{ type: "text", text: `{"move":"${MOVES.Explain[0].id}"}` }] });
  };
  try {
    const out = await call({ ANTHROPIC_API_KEY: "k", ...aiEnv("{}") }, "ai/writing", { text: essay, keyUse: "Explain" });
    assert.equal(out.json.source, "claude");
    assert.equal(called, 1);
  } finally {
    globalThis.fetch = real;
  }
});

const hintBody = {
  question: "4 × 8 = ?",
  attempt: "28",
  answers: ["32"],
  hints: ["Start with 5 × 4 = 20.", "4 × 8 = 32", "4 groups of 8.", "Skip count by 8, four times."],
};

test("hint: leaking candidates are filtered before the model, and the pick is a client index", async () => {
  let seen = "";
  const env = { AI: { run: async (_m, { messages }) => ((seen = messages[1].content), { response: '{"hint": 2}' }) } };
  const out = await call(env, "ai/hint", hintBody);
  assert.equal(out.status, 200, JSON.stringify(out.json));
  assert.equal(seen.includes("= 32"), false, "a step that states the answer never reaches the model");
  assert.equal(out.json.index, 2, "candidate 2 of the safe list is the client's index 2");
  assert.deepEqual(safeHints({ question: "4 × 8 = ?", answers: ["32"] }, hintBody.hints).map((c) => c.index), [0, 2, 3]);
});

test("hint: a pick outside the safe list is refused, and too few safe hints is a 409", async () => {
  assert.equal((await call(aiEnv('{"hint": 9}'), "ai/hint", hintBody)).status, 503);
  assert.equal((await call(aiEnv('{"hint": 2}'), "ai/hint", { ...hintBody, hints: ["4 × 8 = 32", "so 32", "x"] })).status, 409);
  assert.equal((await call(aiEnv("{}"), "ai/hint", { question: "", answers: [], hints: [] })).json.error, "invalid-hint-request");
});

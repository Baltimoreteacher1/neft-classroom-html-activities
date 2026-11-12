// Question-log insights for Mr. Neft: teacher-key gate, the model sees only the anonymous top questions, every
// number it returns is checked against that list, and anything unusable falls back to the plain frequency list.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const guard = await import("../functions/api/language-guide/guard.js");
const { onRequest, readInsights } = await import("../functions/api/language-guide/insights.js");

function fakeKV() {
  const rows = new Map();
  return {
    async put(key, value, opts = {}) {
      rows.set(key, { value, opts });
    },
    async get(key) {
      return rows.get(key)?.value ?? null;
    },
    async list({ prefix = "" } = {}) {
      const keys = [...rows]
        .filter(([k]) => k.startsWith(prefix))
        .map(([name, r]) => ({ name, metadata: r.opts.metadata }));
      return { keys, list_complete: true };
    },
  };
}

const QUESTIONS = [
  ["Do I need an account?", 3],
  ["Where is student work saved?", 2],
  ["Can my child use this at home?", 2],
  ["Does it work in Spanish?", 1],
  ["How long is the Speaking activity?", 1],
  ["Can Maria use it? Call 410-555-0123", 1],
];

async function seededEnv(extra = {}) {
  const kv = fakeKV();
  const env = { PLAN_DOCS: kv, TEACHER_KEY: "k-123", ...extra };
  for (const [question, times] of QUESTIONS)
    for (let i = 0; i < times; i++)
      await guard.logQuestion(env, {
        question,
        page: "start",
        grades: "4-5",
        lang: "en",
        answered: true,
      });
  return env;
}

let ipCounter = 0;
const get = (env, headers = { "x-teacher-key": "k-123" }, query = "?days=30") =>
  onRequest({
    request: new Request(`https://x.test/api/language-guide/insights${query}`, {
      headers: { ...headers, "CF-Connecting-IP": `198.51.100.${++ipCounter}` }, // each call is a new person
    }),
    env,
  });

const withFetch = async (reply, run) => {
  const real = globalThis.fetch;
  const bodies = [];
  globalThis.fetch = async (_url, init) => {
    bodies.push(JSON.parse(init.body));
    return reply();
  };
  try {
    return await run(bodies);
  } finally {
    globalThis.fetch = real;
  }
};
const gemini = (text) => () =>
  new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }));

test("insights need the teacher key and a bound log", async () => {
  const env = await seededEnv();
  assert.equal((await get(env, {})).status, 401);
  assert.equal((await get(env, { "x-teacher-key": "nope" })).status, 401);
  assert.equal(
    (await get(env, { "x-teacher-key": "k-123" }, "?key=k-123")).status,
    200,
    "key header is enough",
  );
  assert.equal((await get({ TEACHER_KEY: "k-123" })).status, 503, "no PLAN_DOCS");
  assert.equal(
    (await get(env, {}, "?days=7&key=k-123")).status,
    401,
    "a query-string key is not accepted",
  );
});

test("the model sees only the stripped top questions and its numbers are checked", async () => {
  const env = await seededEnv({ GEMINI_API_KEY: "g" });
  const reply = JSON.stringify({
    themes: [
      { label: "Accounts and saving", questions: [1, 2, 99, 1] },
      { label: "Home use", questions: [3, 2] },
      { label: "Ignored", questions: [] },
    ],
    gaps: [
      { question: 4, why: "Needs a Spanish-specific answer." },
      { question: 4, why: "duplicate" },
      { question: 42, why: "not in the list" },
      { question: 5, why: "" },
    ],
  });
  const out = await withFetch(
    gemini(`Here you go:\n\`\`\`json\n${reply}\n\`\`\``),
    async (bodies) => {
      const res = await get(env);
      assert.equal(res.status, 200);
      const sent = JSON.stringify(bodies[0]);
      assert.ok(
        !sent.includes("Maria") && !sent.includes("410-555"),
        "names and phones never reach the model",
      );
      assert.match(sent, /\[name\]/);
      return res.json();
    },
  );
  assert.equal(out.source, "gemini");
  assert.equal(out.total, 10);
  const n = (i) => out.top[i - 1];
  assert.deepEqual(
    out.themes.map((t) => [t.label, t.count, t.questions.map((q) => q.question)]),
    [
      ["Accounts and saving", n(1).count + n(2).count, [n(1).question, n(2).question]],
      ["Home use", n(3).count, [n(3).question]],
    ],
    "unknown and repeated numbers are dropped; a question joins one theme only",
  );
  assert.deepEqual(out.gaps, [
    {
      question: out.top[3].question,
      count: out.top[3].count,
      why: "Needs a Spanish-specific answer.",
    },
  ]);
  assert.equal(out.top.length, 6, "the plain frequency list is always included");
});

test("too few questions, no model, a failing model or junk all return the plain list", async () => {
  const thin = fakeKV();
  const tenv = { PLAN_DOCS: thin, TEACHER_KEY: "k-123", GEMINI_API_KEY: "g" };
  await guard.logQuestion(tenv, {
    question: "Just one",
    page: "tour",
    grades: "",
    lang: "en",
    answered: true,
  });
  await withFetch(
    () => assert.fail("the model is not called for a thin log"),
    async () => assert.equal((await (await get(tenv)).json()).source, null),
  );

  const plain = async (env, reply) => {
    const body = await withFetch(reply, async () => (await get(env)).json());
    assert.equal(body.ok, true);
    assert.equal(body.source, null);
    assert.deepEqual([body.themes, body.gaps], [[], []]);
    assert.equal(body.top.length, 6);
  };
  await plain(await seededEnv(), () => assert.fail("no backend is bound"));
  const keyed = await seededEnv({ GEMINI_API_KEY: "g" });
  await plain(keyed, () => new Response("{}", { status: 500 }));
  await plain(keyed, gemini("no json here"));
  await plain(keyed, gemini('{"themes":[{"label":"x","questions":[77]}],"gaps":[]}'));
});

test("readInsights clips text and caps counts", () => {
  const top = Array.from({ length: 12 }, (_, i) => ({ question: `q${i + 1}`, count: 1 }));
  const out = readInsights(
    JSON.stringify({
      themes: Array.from({ length: 9 }, (_, i) => ({
        label: `L${i}${"x".repeat(100)}`,
        questions: [i + 1],
      })),
      gaps: Array.from({ length: 9 }, (_, i) => ({ question: i + 1, why: "w".repeat(400) })),
    }),
    top,
  );
  assert.equal(out.themes.length, 6);
  assert.equal(out.gaps.length, 5);
  assert.ok(out.themes.every((t) => t.label.length <= 60));
  assert.ok(out.gaps.every((g) => g.why.length <= 160));
});

test("the host serves the insights route and students' pages never call it", () => {
  const host = readFileSync(new URL("../functions/_lib/language-page.js", import.meta.url), "utf8");
  assert.match(host, /"\/api\/language-guide\/insights"/);
  const guideUi = readFileSync(
    new URL("../access-practice-lab/src/intro/guide.js", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(guideUi, /language-guide\/insights/);
});

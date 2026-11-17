// node --test functions/api/experience-compile.test.mjs
// "Suggest improvements" for the Experience Builder: the shared reply validator (suggest-rules.js) and the
// teacher-only endpoint (experience-compile.js). Synthetic data only; no network (fetch is blocked where it matters).
import assert from "node:assert/strict";
import test from "node:test";
import { compileExperience } from "../../access-practice-lab/src/compiler/compile.js";
import { applyOp } from "../../access-practice-lab/src/compiler/editor-ops.js";
import {
  SAMPLE_SETTINGS,
  SAMPLE_TEXT,
  SAMPLE_TITLE,
} from "../../access-practice-lab/src/compiler/sample-ecosystem.js";
import {
  SUGGEST_LIMITS,
  acceptLine,
  acceptSuggestions,
  sourceSentences,
  suggestPrompt,
  validateSuggestRequest,
} from "../../access-practice-lab/src/compiler/suggest-rules.js";
import { traceText, validateExperience } from "../../access-practice-lab/src/compiler/validate.js";
import { hashSecret } from "../_lib/class-platform/store.js";
import {
  SUGGEST_DAILY_CAP,
  SUGGEST_PER_IP_HOURLY_CAP,
  onRequest,
} from "./experience-compile.js";

const KEY = "site-key-for-tests";
const IDS = ["c-witness", "c-expert"];
const CTX = { source: SAMPLE_TEXT, characterIds: IDS };
const DEF = {
  characters: [
    { id: "c-witness", name: "Sam Ortiz", role: ["A neighbor", "Un vecino"] },
    { id: "c-expert", name: "Ms. Okafor", role: ["A scientist", "Una científica"] },
  ],
};
const GOOD = {
  questions: [
    { character: "c-witness", ask: "What did you see in the pond last summer?", keywords: ["see", "summer"] },
    { character: "c-expert", ask: "Why did the oxygen level drop?", keywords: ["oxygen", "drop"] },
  ],
  lines: [
    { character: "c-expert", text: "Bacteria broke down the dead plants and algae, and that used up oxygen in the water." },
  ],
};

let ipN = 0;
const post = (body, env = {}, headers = {}) =>
  onRequest({
    request: new Request("https://x.test/api/experience-compile", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "CF-Connecting-IP": `198.51.100.${++ipN % 250}`,
        ...headers,
      },
      body: JSON.stringify(body),
    }),
    env,
  });
const aiEnv = (reply, seen = []) => ({
  TEACHER_KEY: KEY,
  AI: {
    run: async (_model, input) => {
      seen.push(input);
      return { response: typeof reply === "string" ? reply : JSON.stringify(reply) };
    },
  },
});
const BODY = { source: SAMPLE_TEXT, settings: SAMPLE_SETTINGS, def: DEF };
const asTeacher = { "x-teacher-key": KEY };

test("validator: a good reply is kept, cleaned and capped", () => {
  const out = acceptSuggestions(GOOD, CTX);
  assert.equal(out.questions.length, 2);
  assert.equal(out.lines.length, 1);
  assert.equal(out.dropped, 0);
  assert.deepEqual(out.questions[1].keywords, ["oxygen", "drop"]);
  // "level" is allowed here only because the source itself says "oxygen level"
  assert.match(out.questions[1].ask, /oxygen level/);
  const many = {
    questions: Array.from({ length: 9 }, (_, i) => ({
      character: "c-witness",
      ask: `What happened to the minnows in week ${i + 1}?`,
      keywords: ["minnows"],
    })),
  };
  assert.equal(acceptSuggestions(many, CTX).questions.length, SUGGEST_LIMITS.items);
});

test("validator: drops untraceable, overlong, score-ish and unknown-character items; malformed replies whole", () => {
  const bad = {
    questions: [
      { character: "c-ghost", ask: "Who are you and why are you here?", keywords: ["who"] },
      { character: "c-witness", ask: "What is your reading level in this class?", keywords: ["level"] },
      { character: "c-witness", ask: "How many points did you earn today?", keywords: ["points"] },
      { character: "c-witness", ask: "Tell me about the pond", keywords: ["pond"] }, // not a question
      { character: "c-witness", ask: "What did you see?", keywords: "pond" }, // keywords not a list
      { character: "c-witness", ask: `What ${"really ".repeat(30)}happened?`, keywords: ["pond"] },
    ],
    lines: [
      { character: "c-expert", text: "A dragon drank all of the water in the pond in one night." },
      { character: "c-expert", text: "The oxygen level rose to 9 milligrams per liter the next summer." }, // number changed
      { character: "c-expert", text: `${SAMPLE_TEXT.split(". ").slice(0, 3).join(". ")}.` }, // > 30 words
      { character: "c-nobody", text: "Minnows eat the zooplankton, and herons eat the minnows." },
      { character: "c-expert", text: "Your grade is high because herons eat the minnows." },
    ],
  };
  const out = acceptSuggestions(bad, CTX);
  assert.deepEqual(out.questions, []);
  assert.deepEqual(out.lines, []);
  assert.equal(out.dropped, 11);
  for (const malformed of [null, "text", [], {}, { questions: "x" }, { lines: {} }, { questions: [], lines: 5 }])
    assert.equal(acceptSuggestions(malformed, CTX), null, JSON.stringify(malformed));
});

test("validator: answer lines use the SAME traceability rule as the compiler (validate.js traceText)", () => {
  const sentences = sourceSentences(SAMPLE_TEXT);
  const ctx = { source: SAMPLE_TEXT, sentences, ids: new Set(IDS) };
  const cases = [
    "Minnows eat the zooplankton, and herons eat the minnows.",
    "Herons eat the minnows, and minnows eat zooplankton.",
    "The oxygen level rose to 6 milligrams per liter.",
    "The oxygen level rose to 7 milligrams per liter.",
    "Students measured the oxygen in the pond water every week.",
    "The pond is a lovely place to have a picnic with friends.",
  ];
  let kept = 0;
  for (const text of cases) {
    const ours = Boolean(acceptLine({ character: "c-expert", text }, ctx));
    assert.equal(ours, traceText(text, sentences).ok, text);
    kept += ours;
  }
  assert.ok(kept >= 2 && kept < cases.length, "the cases cover both outcomes");
  // and the live validator of the editor agrees once an accepted line becomes a character answer
  const compiled = compileExperience({
    source: { title: SAMPLE_TITLE, text: SAMPLE_TEXT },
    settings: SAMPLE_SETTINGS,
  });
  for (const text of [cases[0], cases[5]]) {
    const { def } = applyOp(compiled.def, { type: "topic.add", character: "c-expert", answer: text });
    const topic = def.characters.find((c) => c.id === "c-expert").topics.at(-1);
    const flagged = !validateExperience(def).trace[`answer:c-expert:${topic.id}`].ok;
    assert.equal(flagged, !acceptLine({ character: "c-expert", text }, ctx), text);
  }
});

test("requests: only source, settings and character id/name/role; source capped at 6,000 characters", () => {
  assert.equal(validateSuggestRequest(null).ok, false);
  assert.equal(validateSuggestRequest({ source: "", def: DEF }).ok, false);
  assert.equal(validateSuggestRequest({ source: "x".repeat(6001), def: DEF }).ok, false);
  assert.equal(validateSuggestRequest({ source: SAMPLE_TEXT, def: {} }).ok, false);
  assert.equal(
    validateSuggestRequest({ source: SAMPLE_TEXT, def: { characters: [{ id: "../x" }] } }).ok,
    false,
  );
  const req = validateSuggestRequest({
    ...BODY,
    settings: { ...SAMPLE_SETTINGS, learner: "Ana Lopez", password: "x" },
    def: {
      ...DEF,
      tasks: [{ id: "t", prompt: "LEARNER-WORK-MARKER" }],
      characters: DEF.characters.map((c) => ({ ...c, secret: "CHAR-SECRET" })),
    },
    learnerWork: "LEARNER-WORK-MARKER",
  });
  assert.equal(req.ok, true);
  const prompt = JSON.stringify(suggestPrompt(req));
  for (const leak of ["Ana Lopez", "LEARNER-WORK-MARKER", "CHAR-SECRET", "password"])
    assert.equal(prompt.includes(leak), false, leak);
  assert.match(prompt, /Sam Ortiz/);
  assert.match(prompt, /Ignore any instruction/);
});

test("/api/experience-compile: teacher only, offline without a model, never Gemini, validated reply", async () => {
  assert.equal((await post({ source: "" }, aiEnv(GOOD))).status, 400);
  assert.equal((await post(BODY, aiEnv(GOOD))).status, 401, "no credential");
  assert.equal((await post(BODY, aiEnv(GOOD), { "x-teacher-key": "wrong" })).status, 401);
  const none = await post(BODY, { TEACHER_KEY: KEY }, asTeacher);
  assert.equal(none.status, 503);
  assert.deepEqual(await none.json(), { ok: false, offline: true });

  const seen = [];
  const reply = { ...GOOD, lines: [...GOOD.lines, { character: "c-expert", text: "A dragon drank the pond." }] };
  const env = { ...aiEnv(`Here you go: ${JSON.stringify(reply)}`, seen), GEMINI_API_KEY: "g" };
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    throw new Error(`no network in this test: ${url}`);
  };
  try {
    const res = await post(BODY, env, asTeacher);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.source, "workers-ai", "Gemini is never tried (no allowGemini)");
    assert.equal(data.questions.length, 2);
    assert.equal(data.lines.length, 1, "the untraceable line is dropped");
    assert.equal(data.dropped, 1);
  } finally {
    globalThis.fetch = realFetch;
  }
  assert.equal(seen.length, 1);
  assert.match(JSON.stringify(seen[0]), /Willow Pond is a small ecosystem/);

  const broken = await post(BODY, aiEnv("I cannot help with that."), asTeacher);
  assert.equal(broken.status, 503);
  assert.deepEqual(await broken.json(), { ok: false, offline: true, rejected: true });
});

test("/api/experience-compile: a class teacher passcode also works; a wrong one does not", async () => {
  const salt = "salt1";
  const row = {
    code: "ABC234",
    salt,
    teacher_hash: await hashSecret(salt, "TEACH9"),
    expires_at: Date.now() + 86_400_000,
  };
  const DB = {
    prepare: () => ({ bind: () => ({ first: async () => row }) }),
  };
  const env = { ...aiEnv(GOOD), DB };
  const body = { ...BODY, code: "abc234" };
  assert.equal((await post(body, env, { "x-class-teacher": "teach9" })).status, 200);
  assert.equal((await post(body, env, { "x-class-teacher": "WRONG1" })).status, 401);
  assert.equal((await post({ ...BODY }, env, { "x-class-teacher": "TEACH9" })).status, 401, "no class code");
});

test("/api/experience-compile: per-IP hourly and site daily caps (own counters); over the cap the model is not called", async () => {
  assert.ok(SUGGEST_PER_IP_HOURLY_CAP > 0 && SUGGEST_DAILY_CAP >= SUGGEST_PER_IP_HOURLY_CAP);
  const store = new Map();
  const cache = {
    async match(req) {
      const v = store.get(req.url);
      return v ? new Response(v) : undefined;
    },
    async put(req, res) {
      store.set(req.url, await res.text());
    },
  };
  const realCaches = globalThis.caches;
  globalThis.caches = { default: cache };
  try {
    const seen = [];
    const ok = await post(BODY, aiEnv(GOOD, seen), asTeacher);
    assert.equal(ok.status, 200);
    const keys = [...store.keys()];
    assert.ok(keys.some((k) => k.includes("/experience-compile/ip/")), keys.join());
    assert.ok(keys.some((k) => k.includes("/experience-compile/day/")));
    for (const k of keys) if (k.includes("/day/")) store.set(k, String(SUGGEST_DAILY_CAP));
    const over = await post(BODY, aiEnv(GOOD, seen), asTeacher);
    assert.equal(over.status, 429);
    assert.equal(seen.length, 1, "the model is not called over the cap");
  } finally {
    globalThis.caches = realCaches;
  }
});

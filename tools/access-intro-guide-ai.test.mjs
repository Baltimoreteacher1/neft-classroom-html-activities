// Mr. Neft's AI guide, the parts around the model: grade-correct help answers (the button names each grade's own
// activities show), the per-IP hourly and site-wide daily caps (a fake Workers Cache API), the anonymous question
// log (a fake KV namespace: only the stripped record, 90 days), the teacher-key read-back, and the stripping of
// names, email addresses and phone numbers.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const { FAQ } = await import("../access-practice-lab/src/intro/site-guide-more.js");
const { faqAnswer, guideContext, quickAnswer } = await import(
  "../access-practice-lab/src/intro/guide-knowledge.js"
);
const { tourActivity } = await import("../access-practice-lab/src/intro/tour-bands.js");
const guard = await import("../functions/api/language-guide/guard.js");
const { onRequest: postGuide } = await import("../functions/api/language-guide.js");
const { onRequest: getQuestions } = await import("../functions/api/language-guide/questions.js");

/** A Workers Cache API stand-in: match/put keyed by URL, honouring nothing but presence. */
function fakeCache() {
  const store = new Map();
  return {
    store,
    async match(req) {
      const hit = store.get(typeof req === "string" ? req : req.url);
      return hit ? new Response(hit) : undefined;
    },
    async put(req, res) {
      assert.match(res.headers.get("Cache-Control") || "", /max-age=\d+/);
      store.set(typeof req === "string" ? req : req.url, await res.text());
    },
  };
}

/** A KV namespace stand-in with put options, prefix list and metadata. */
function fakeKV() {
  const rows = new Map();
  return {
    rows,
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

const post = (body, env = {}, ip = "198.51.100.7", waitUntil) =>
  postGuide({
    request: new Request("https://x.test/api/language-guide", {
      method: "POST",
      headers: { "content-type": "application/json", "CF-Connecting-IP": ip },
      body: JSON.stringify(body),
    }),
    env,
    waitUntil,
  });

const MODEL = { AI: { run: async () => ({ response: "No account is needed to practice." }) } };

test("help answers that name buttons use the chosen grade's own button names", () => {
  const norecord = FAQ.find((f) => f.id === "norecord");
  assert.ok(norecord.byPick, "the no-recording answer has grade variants");
  for (const pick of ["K", "1", "2-3"]) {
    const en = faqAnswer("norecord", "en", pick);
    assert.match(en, /“I said my answer\.”/, pick);
    assert.doesNotMatch(en, /no recording/, pick);
    assert.ok(
      en.includes(tourActivity(pick, "speaking").title),
      `${pick} names its speaking activity`,
    );
    assert.match(faqAnswer("norecord", "es", pick), /Dije mi respuesta/, pick);
  }
  assert.match(faqAnswer("norecord", "en", "4-5"), /“I said it out loud\.”/);
  assert.match(faqAnswer("norecord", "en", "6-8"), /The Busy Hallway.*“I said it out loud\.”/);
  assert.match(faqAnswer("norecord", "en", "6-8"), /I said it out loud \(no recording\)/);
  // No grade: the general answer, which now names all three buttons.
  assert.equal(faqAnswer("norecord", "en"), norecord.a.en);
  assert.equal(faqAnswer("norecord", "en", "9-12"), norecord.a.en, "an unknown pick falls back");
  // The question button and the AI context use the same grade wording.
  assert.equal(quickAnswer("norecord", null, "en", "K"), faqAnswer("norecord", "en", "K"));
  assert.equal(
    quickAnswer("norecord", tourActivity("2-3", "speaking"), "en"),
    faqAnswer("norecord", "en", "2-3"),
    "the activity on screen implies its grade",
  );
  assert.ok(guideContext({ pick: "1" }).includes(faqAnswer("norecord", "en", "1")));
  assert.ok(!guideContext({ pick: "1" }).includes("I said it out loud (no recording)"));
  // Every grade variant is bilingual and Spanish is not a copy.
  for (const f of FAQ)
    for (const [pick, v] of Object.entries(f.byPick || {})) {
      assert.ok(v.en && v.es && v.en !== v.es, `${f.id} ${pick}`);
      assert.doesNotMatch(
        v.es,
        /\busted(es)? (puede|tiene)\b|\btú\b/i,
        `${f.id} ${pick} uses ustedes`,
      );
    }
});

test("names, email addresses and phone numbers are stripped from a question", () => {
  const s = guard.stripPersonal;
  assert.equal(s("Can Maria use this at home?"), "Can [name] use this at home?");
  assert.equal(s("my son is named carlos, is it ok?"), "my son is named [name], is it ok?");
  assert.equal(s("Mi hija se llama Ana López"), "Mi hija se llama [name]");
  assert.equal(s("email me at jo.ann+x@school.org please"), "email me at [email] please");
  assert.equal(s("call 410-555-0123 or (443) 555 0199"), "call [phone] or [phone]");
  // Site words, sentence starts and acronyms stay.
  assert.equal(
    s("Does The Busy Hallway work in Spanish? Is WIDA used?"),
    "Does The Busy Hallway work in Spanish? Is WIDA used?",
  );
  assert.equal(s("How long is grade 2-3 Speaking?"), "How long is grade 2-3 Speaking?");
});

test("the question log stores only the anonymous record, for 90 days", async () => {
  const kv = fakeKV();
  const now = new Date("2026-11-11T15:04:05.000Z");
  assert.equal(
    await guard.logQuestion(
      { PLAN_DOCS: kv },
      {
        question: "Can Maria record at home? Call 410-555-0123",
        page: "family",
        step: "Speaking",
        grades: "K",
        lang: "es",
        answered: true,
        ip: "203.0.113.9",
        history: [{ q: "x", a: "y" }],
      },
      now,
    ),
    true,
  );
  assert.equal(kv.rows.size, 1);
  const [[key, row]] = kv.rows;
  assert.match(key, /^lp-guide-q:2026-11-11:[0-9a-f]{16}$/);
  assert.equal(row.opts.expirationTtl, 90 * 24 * 60 * 60);
  const rec = JSON.parse(row.value);
  assert.deepEqual(Object.keys(rec).sort(), [
    "answered",
    "at",
    "grades",
    "lang",
    "page",
    "question",
    "step",
  ]);
  assert.equal(rec.question, "Can [name] record at home? Call [phone]");
  assert.equal(rec.at, now.toISOString());
  assert.deepEqual(row.opts.metadata, rec);
  // No binding: nothing stored, nothing thrown.
  assert.equal(await guard.logQuestion({}, { question: "hi" }), false);
});

test("POST logs each typed question (answered or not) through waitUntil", async () => {
  const kv = fakeKV();
  const waits = [];
  const res = await post(
    { question: "Do I need an account?", grades: "4-5", page: "start" },
    { ...MODEL, PLAN_DOCS: kv },
    "198.51.100.20",
    (p) => waits.push(p),
  );
  assert.equal(res.status, 200);
  await Promise.all(waits);
  const off = await post({ question: "Where is work saved?" }, { PLAN_DOCS: kv }, "198.51.100.21");
  assert.equal(off.status, 503);
  const recs = [...kv.rows.values()].map((r) => JSON.parse(r.value));
  assert.deepEqual(
    recs.map((r) => [r.question, r.answered, r.grades, r.page]),
    [
      ["Do I need an account?", true, "4-5", "start"],
      ["Where is work saved?", false, "", "tour"],
    ],
  );
});

test("caps: per-IP hourly and site-wide daily, kept in the Cache API, answer 429 limited", async () => {
  const cache = fakeCache();
  const now = new Date("2026-11-11T10:30:00Z");
  const req = (ip) => new Request("https://x.test/", { headers: { "CF-Connecting-IP": ip } });
  for (let i = 0; i < guard.PER_IP_HOURLY_CAP; i++)
    assert.equal(
      await guard.overCap(req("203.0.113.1"), { cache, now }),
      false,
      `question ${i + 1}`,
    );
  assert.equal(await guard.overCap(req("203.0.113.1"), { cache, now }), true, "one more is over");
  assert.equal(
    await guard.overCap(req("203.0.113.2"), { cache, now }),
    false,
    "another person is not",
  );
  const nextHour = new Date("2026-11-11T11:00:01Z");
  assert.equal(
    await guard.overCap(req("203.0.113.1"), { cache, now: nextHour }),
    false,
    "a new hour",
  );
  for (const k of cache.store.keys()) {
    assert.match(k, /^https:\/\/lp-guide\.internal\//);
    assert.doesNotMatch(k, /203\.0\.113/, "the IP is hashed before it is a key");
  }
  // The daily cap: preload the day's counter.
  cache.store.set("https://lp-guide.internal/day/2026-11-11", String(guard.GLOBAL_DAILY_CAP));
  assert.equal(await guard.overCap(req("203.0.113.3"), { cache, now }), true);
  // No Cache API, or a broken one: not capped.
  assert.equal(await guard.overCap(req("203.0.113.3"), { cache: undefined, now }), false);
  const broken = { match: async () => Promise.reject(new Error("x")), put: async () => {} };
  assert.equal(await guard.overCap(req("203.0.113.3"), { cache: broken, now }), false);

  // Through the endpoint: a capped request never reaches the model and is not logged.
  const saved = globalThis.caches;
  const today = new Date().toISOString().slice(0, 10);
  const endpointCache = fakeCache();
  endpointCache.store.set(`https://lp-guide.internal/day/${today}`, String(guard.GLOBAL_DAILY_CAP));
  globalThis.caches = { default: endpointCache };
  try {
    let called = false;
    const kv = fakeKV();
    const res = await post(
      { question: "Do I need an account?" },
      { AI: { run: async () => ((called = true), { response: "x" }) }, PLAN_DOCS: kv },
      "198.51.100.30",
    );
    assert.equal(res.status, 429);
    assert.deepEqual(await res.json(), { ok: false, limited: true });
    assert.equal(called, false);
    assert.equal(kv.rows.size, 0);
  } finally {
    if (saved === undefined) delete globalThis.caches;
    else globalThis.caches = saved;
  }
});

test("GET /api/language-guide/questions is teacher-key gated and summarizes the log", async () => {
  const kv = fakeKV();
  const now = new Date();
  const env = { PLAN_DOCS: kv, TEACHER_KEY: "k-123" };
  for (const [q, answered] of [
    ["Do I need an account?", true],
    ["do I need an account", false],
    ["Where is work saved?", true],
  ])
    await guard.logQuestion(
      env,
      { question: q, page: "tour", grades: "K", lang: "en", answered },
      now,
    );
  const get = (headers = {}, query = "?days=7", e = env) =>
    getQuestions({
      request: new Request(`https://x.test/api/language-guide/questions${query}`, { headers }),
      env: e,
    });
  assert.equal((await get()).status, 401, "no key");
  assert.equal((await get({ "x-teacher-key": "wrong" })).status, 401, "wrong key");
  assert.equal(
    (await get({ "x-teacher-key": "" }, "?days=7", { PLAN_DOCS: kv })).status,
    401,
    "no TEACHER_KEY configured",
  );
  assert.equal(
    (await get({}, "?days=7&key=k-123")).status,
    401,
    "a query-string key is not accepted",
  );
  const res = await get({ "x-teacher-key": "k-123" });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.total, 3);
  assert.equal(data.answered, 2);
  assert.equal(data.unanswered, 1);
  assert.equal(data.days, 7);
  assert.deepEqual(data.byGrades, { K: 3 });
  assert.equal(data.top[0].count, 2, "the same question in other words counts once");
  assert.equal(data.top[0].unanswered, 1);
  assert.equal((await (await get({ "x-teacher-key": "k-123" }, "?days=999")).json()).days, 90);
  const noKv = await get({ "x-teacher-key": "k-123" }, "", { TEACHER_KEY: "k-123" });
  assert.equal(noKv.status, 503);
  const posted = await getQuestions({
    request: new Request("https://x.test/api/language-guide/questions", { method: "POST" }),
    env,
  });
  assert.equal(posted.status, 405);
});

test("the guide says on screen that typed questions are kept, and the host serves the log route", () => {
  const src = readFileSync(
    new URL("../access-practice-lab/src/intro/guide.js", import.meta.url),
    "utf8",
  );
  assert.match(src, /kept without names or contact details for 90 days/);
  assert.match(src, /durante 90 días/);
  const host = readFileSync(new URL("../functions/_lib/language-page.js", import.meta.url), "utf8");
  assert.match(host, /"\/api\/language-guide\/questions"/);
});

// Book Studio writing coach: request validation, reply post-validation (no copies, no rewrites, no scores), the
// built-in offline tips, and /api/book-coach driven through the real handler with a stubbed model.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rules = await import("../access-practice-lab/src/book/coach-rules.js");
const { onRequest, coachPrompt } = await import("../functions/api/book-coach.js");
const guard = await import("../functions/api/language-guide/guard.js");
const { validateSettings } = await import("../shared/class-platform/contract.js");

const { validateRequest, acceptReply, offlineCoach, copiedRun, OFFLINE_ACTIONS } = rules;
const TEXT =
  "Yesterday my little brother and I walked to the big park near our house. It was a good day. We played soccer and ate sandwiches under a tree.";

let ipN = 0;
const post = (body, env = {}) =>
  onRequest({
    request: new Request("https://x.test/api/book-coach", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "CF-Connecting-IP": `203.0.113.${++ipN % 250}`,
      },
      body: JSON.stringify(body),
    }),
    env,
  });
const aiEnv = (reply, seen = []) => ({
  AI: {
    run: async (_model, input) => {
      seen.push(input);
      return { response: typeof reply === "string" ? reply : JSON.stringify(reply) };
    },
  },
});

test("requests: every action validated, size-capped, and stripped to its own fields", () => {
  assert.equal(validateRequest({ action: "write-my-book", payload: {} }).error, "invalid-action");
  assert.equal(validateRequest({ action: "clarity" }).error, "invalid-payload");
  assert.equal(
    validateRequest({ action: "clarity", payload: { text: "x ".repeat(1001) + "y" } }).error,
    "too-long",
  );
  assert.equal(
    validateRequest({ action: "expand", payload: { sentence: "Hi there" } }).error,
    "sentence-too-short",
  );
  assert.equal(
    validateRequest({
      action: "translate",
      payload: { phrase: "one two three four five six seven" },
    }).error,
    "phrase-length",
  );
  assert.equal(
    validateRequest({ action: "genre", payload: { text: TEXT, purpose: "Poem" } }).error,
    "invalid-purpose",
  );
  assert.equal(
    validateRequest({ action: "picture", payload: { kind: "video" } }).error,
    "invalid-kind",
  );
  assert.equal(
    validateRequest({ action: "organize", payload: { pages: [{ heading: "x" }] } }).error,
    "invalid-pages",
  );
  const ok = validateRequest({
    action: "clarity",
    lang: "es",
    payload: {
      text: TEXT,
      purpose: "Narrate",
      name: "Ana Lopez",
      studentId: "s1",
      media: "blob:abc",
    },
  });
  assert.equal(ok.ok, true);
  assert.equal(ok.lang, "es");
  assert.deepEqual(
    Object.keys(ok.payload).sort(),
    ["purpose", "text"],
    "names, ids and media are never passed on",
  );
  const pic = validateRequest({
    action: "picture",
    payload: { kind: "art", name: "girl <img src=x>", prompt: "Draw" },
  });
  assert.equal(pic.payload.name, "girl img srcx");
});

test("copiedRun: 8 consecutive words from the learner are a copy, 7 are not", () => {
  assert.equal(copiedRun("so my little brother and I walked to the big park", TEXT), true);
  assert.equal(copiedRun("Did my little brother and I walked to it?", TEXT), false);
  assert.equal(copiedRun("anything", "short text"), false);
});

test("replies: questions must be questions, short, not copies; one bad item rejects the whole reply", () => {
  const p = validateRequest({
    action: "expand",
    payload: { sentence: "We played soccer and ate sandwiches under a tree." },
  }).payload;
  const good = acceptReply(
    "expand",
    { questions: ["Who else played with you?", "Where was the tree?"] },
    p,
  );
  assert.deepEqual(good, { questions: ["Who else played with you?", "Where was the tree?"] });
  // a rewritten sentence (no question), a copy of the sentence, a long item, a score, too few
  assert.equal(
    acceptReply(
      "expand",
      { questions: ["We played soccer with my friends under a big tree.", "Why?"] },
      p,
    ),
    null,
  );
  assert.equal(
    acceptReply(
      "expand",
      { questions: ["Why did we played soccer and ate sandwiches under a tree?", "When?"] },
      p,
    ),
    null,
  );
  assert.equal(
    acceptReply("expand", { questions: [`${"very ".repeat(30)}long?`, "When?"] }, p),
    null,
  );
  assert.equal(
    acceptReply("expand", { questions: ["What score would you give it out of 10?", "When?"] }, p),
    null,
  );
  assert.equal(acceptReply("expand", { questions: ["When?"] }, p), null);
  assert.equal(acceptReply("expand", null, p), null);
});

test("replies: vocabulary words must replace a word the learner used; meanings are short", () => {
  const p = validateRequest({ action: "vocabulary", payload: { text: TEXT } }).payload;
  const out = acceptReply(
    "vocabulary",
    {
      words: [
        { for: "big", word: "enormous", means: "very, very big" },
        { for: "good", word: "wonderful", means: "very pleasant" },
      ],
    },
    p,
  );
  assert.equal(out.words.length, 2);
  assert.equal(
    acceptReply(
      "vocabulary",
      {
        words: [
          { for: "huge", word: "giant", means: "big" },
          { for: "good", word: "great", means: "very nice" },
        ],
      },
      p,
    ),
    null,
    "a word the learner never wrote",
  );
  assert.equal(
    acceptReply(
      "vocabulary",
      {
        words: [
          { for: "big", word: "We walked to the enormous park near our house today", means: "x" },
          { for: "good", word: "great", means: "nice" },
        ],
      },
      p,
    ),
    null,
    "a sentence is not a word",
  );
});

test("replies: clarity quotes the learner's own short words, puts strengths first, and never scores", () => {
  const p = validateRequest({
    action: "clarity",
    payload: { text: TEXT, purpose: "Narrate" },
  }).payload;
  const reply = {
    observations: [
      { kind: "try", quote: "It was a good day", note: "A reader wonders what made it good." },
      { kind: "strength", quote: "Yesterday", note: "You tell the reader when it happened." },
    ],
    next: "Add one detail that shows how the day felt.",
  };
  const out = acceptReply("clarity", reply, p);
  assert.equal(out.observations[0].kind, "strength", "strengths first");
  assert.equal(
    acceptReply(
      "clarity",
      { ...reply, observations: [{ kind: "try", quote: "It was a good day", note: "Say more." }] },
      p,
    ),
    null,
    "needs a strength",
  );
  assert.equal(
    acceptReply(
      "clarity",
      { ...reply, observations: [{ kind: "strength", quote: "I love dragons", note: "Nice." }] },
      p,
    ),
    null,
    "a quote must be the learner's",
  );
  assert.equal(
    acceptReply("clarity", { ...reply, next: "Level 3 writing. 80%." }, p),
    null,
    "no score",
  );
  assert.equal(
    acceptReply(
      "clarity",
      {
        ...reply,
        observations: [
          { kind: "strength", quote: "my little brother and I walked to the big", note: "x" },
        ],
      },
      p,
    ),
    null,
    "quotes stay under 8 words",
  );
});

test("offline tips: deterministic, bilingual, and never quote long runs of the learner", () => {
  for (const action of OFFLINE_ACTIONS) {
    const payload = {
      brainstorm: {
        title: "My Big Day",
        prompt: "Tell about a day you remember.",
        purpose: "Narrate",
      },
      organize: {
        pages: [
          { n: 1, heading: "My Big Day" },
          { n: 2, heading: "The end" },
          { n: 3, heading: "One day" },
        ],
        purpose: "Narrate",
      },
      expand: { sentence: "We played soccer and ate sandwiches under a tree." },
      genre: { text: TEXT, purpose: "Narrate" },
      picture: { kind: "art", name: "girl with a backpack", prompt: "" },
    }[action];
    const en = offlineCoach(action, payload, "en");
    assert.deepEqual(offlineCoach(action, payload, "en"), en, `${action} is deterministic`);
    const es = offlineCoach(action, payload, "es");
    assert.notDeepEqual(es, en, `${action} has Spanish`);
    const items = en.questions || [en.question];
    assert.ok(items.length >= 1 && items.every((q) => /\?$/.test(q)), `${action} asks questions`);
    assert.ok(
      items.every((q) => !copiedRun(q, TEXT)),
      `${action} copies nothing`,
    );
  }
  assert.match(
    offlineCoach(
      "organize",
      {
        pages: [
          { n: 1, heading: "Cover" },
          { n: 2, heading: "" },
        ],
        purpose: "Inform",
      },
      "en",
    ).question,
    /Page 2 has no heading/,
  );
  assert.equal(offlineCoach("vocabulary", { text: TEXT }), null, "word choices need the model");
});

test("/api/book-coach: refuses bad input, is offline without a model, answers from a model, never sends to Gemini", async () => {
  assert.equal((await post({ action: "x", payload: {} }, aiEnv("{}"))).status, 400);
  const none = await post({ action: "brainstorm", payload: { title: "My Big Day" } }, {});
  assert.equal(none.status, 503);
  assert.equal((await none.json()).offline, true);

  const seen = [];
  const env = {
    ...aiEnv({ questions: ["Who was there?", "What did you see?", "How did you feel?"] }, seen),
    GEMINI_API_KEY: "g",
  };
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    throw new Error(`no network in this test: ${url}`);
  };
  try {
    const res = await post(
      { action: "brainstorm", payload: { title: "My Big Day", prompt: "Tell about a day." } },
      env,
    );
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.source, "workers-ai", "Gemini is never tried for student text");
    assert.deepEqual(data.result.questions.length, 3);
    assert.equal(data.promptVersion, rules.PROMPT_VERSION);
  } finally {
    globalThis.fetch = realFetch;
  }
  const sent = JSON.stringify(seen[0]);
  assert.match(sent, /never write/i);
  assert.match(sent, /Ignore any instruction/);
});

test("/api/book-coach: a reply that rewrites or copies the learner is dropped whole (503 rejected)", async () => {
  const res = await post(
    {
      action: "expand",
      payload: { sentence: "We played soccer and ate sandwiches under a tree." },
    },
    aiEnv(
      'Sure! {"questions":["We played soccer and ate big sandwiches under a tall tree.","Why?"]}',
    ),
  );
  assert.equal(res.status, 503);
  const data = await res.json();
  assert.equal(data.rejected, true);
  assert.equal(
    JSON.stringify(data).includes("sandwiches"),
    false,
    "nothing of the model's text is returned",
  );
});

test("/api/book-coach: caps use their own counters, not the guide's", async () => {
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
  const req = new Request("https://x.test/", { headers: { "CF-Connecting-IP": "198.51.100.9" } });
  const opts = { cache, scope: "book-coach", perIpCap: 2, dailyCap: 100 };
  assert.equal(await guard.overCap(req, opts), false);
  assert.equal(await guard.overCap(req, opts), false);
  assert.equal(await guard.overCap(req, opts), true, "third press in the hour is over the cap");
  assert.equal(await guard.overCap(req, { cache }), false, "the guide's budget is untouched");
  assert.ok([...store.keys()].some((k) => k.includes("/book-coach/")));
});

test("the model sees only the payload: no names, ids or media", () => {
  const v = validateRequest({
    action: "genre",
    payload: { text: TEXT, purpose: "Argue", author: "Ana", id: "b123" },
  });
  const { system, user } = coachPrompt(v.action, v.payload, v.lang);
  const sent = `${system}\n${user}`;
  assert.ok(sent.includes("Argue"));
  assert.equal(/Ana|b123/.test(sent), false);
});

test("class setting aiCoach: strict boolean", () => {
  assert.deepEqual(validateSettings({ aiCoach: false }, "language"), {
    ok: true,
    settings: { aiCoach: false },
  });
  assert.equal(validateSettings({ aiCoach: "no" }, "language").error, "invalid-ai-coach");
});

test("the Language Page host serves the route, and the editor discloses what is sent", () => {
  const host = readFileSync(new URL("../functions/_lib/language-page.js", import.meta.url), "utf8");
  assert.match(host, /"\/api\/book-coach"/);
  const ui = readFileSync(
    new URL("../access-practice-lab/src/book/editor-coach.js", import.meta.url),
    "utf8",
  );
  assert.match(ui, /Off until you turn it on/);
  assert.match(ui, /\/api\/book-coach/);
  assert.doesNotMatch(ui, /allowGemini/);
});

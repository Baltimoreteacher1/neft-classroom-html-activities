// reasoning-check.test.mjs — the shared opt-in "Check my reasoning" control.
//
// The control sits under a 12-year-old's own writing and talks to a paid model,
// so the tests are about what it must NOT do: send anything unasked, send an
// identifier, block the student, exceed the server's caps, or hold a student to
// a message they cannot act on. Each case drives the real module in jsdom with a
// stubbed fetch.

import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const { JSDOM } = await import("jsdom");
const dom = new JSDOM('<!doctype html><html lang="en"><body></body></html>', {
  url: "https://eduwonderlab.com/lessons/1-1/",
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;
globalThis.localStorage = dom.window.localStorage;

const HERE = dirname(fileURLToPath(import.meta.url));
const { LIMITS, buildReviewBody, mountReasoningCheck, normalizeLang, requestReviewBody } =
  await import("./reasoning-check.js");
const { setPreferredLang } = await import("./i18n.js");

const GOOD = { ok: true, strengths: "You named the ratio.", gap: "", question: "Why does it scale?" };
const ALLOWED_KEYS = new Set([
  "prompt",
  "response",
  "language",
  "standard",
  "answerShown",
  "misconception",
  "level",
]);

function reply(status, data) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
}

/** A fetch stub that records every request body and answers with `respond()`. */
function stubFetch(respond = () => reply(200, GOOD)) {
  const calls = [];
  const impl = async (url, init) => {
    calls.push({ url, init, body: JSON.parse(init.body) });
    return respond(calls.length);
  };
  return { calls, impl };
}

function setup(value = "I multiplied both quantities by 4 so the ratio stays the same.", options = {}) {
  document.body.innerHTML = "<div id='host'><textarea></textarea></div>";
  const textarea = document.querySelector("textarea");
  textarea.value = value;
  const root = mountReasoningCheck(textarea, options);
  document.getElementById("host").append(root);
  return {
    textarea,
    root,
    button: root.querySelector("button"),
    status: root.querySelector(".rc-status"),
    out: root.querySelector(".rc-out"),
  };
}

const settle = async () => {
  for (let i = 0; i < 8; i += 1) await new Promise((r) => setTimeout(r, 0));
};

/** Move the clock forward so the per-press cooldown does not mask what a test is about. */
function withClock(fn) {
  const real = Date.now;
  let offset = 0;
  Date.now = () => real() + offset;
  return fn(() => {
    offset += 60_000;
  }).finally(() => {
    Date.now = real;
  });
}

test("opt-in: mounting and typing send nothing; the press sends one request", async () => {
  const net = stubFetch();
  const { textarea, button } = setup("", { fetchImpl: net.impl });
  textarea.value = "I think it works because the parts stay in proportion.";
  textarea.dispatchEvent(new window.Event("input", { bubbles: true }));
  await settle();
  assert.equal(net.calls.length, 0, "nothing is sent until the student asks");
  button.click();
  await settle();
  assert.equal(net.calls.length, 1);
  assert.equal(net.calls[0].url, "/api/reasoning/review");
  assert.equal(net.calls[0].init.credentials, "omit", "no cookies ride along");
});

test("request body: only the fields the API reads, no identifier of any kind", async () => {
  const net = stubFetch();
  const { button } = setup(undefined, {
    fetchImpl: net.impl,
    prompt: "Why does the ratio stay the same?",
    standard: "6.AT.1",
    answerShown: "8",
    misconception: () => "Added instead of multiplied",
    level: 2,
    language: "en",
  });
  button.click();
  await settle();
  const body = net.calls[0].body;
  assert.deepEqual(
    Object.keys(body).filter((key) => !ALLOWED_KEYS.has(key)),
    [],
    "no name, section, id or storage key is ever sent",
  );
  assert.equal(body.answerShown, "8", "the answer goes up so the server can refuse to echo it");
  assert.equal(body.misconception, "Added instead of multiplied");
  assert.equal(body.level, 2);
});

test("lengths are clipped to the server's caps, and the caps match the server source", () => {
  const body = buildReviewBody({
    response: "r".repeat(5000),
    prompt: "p".repeat(5000),
    standard: "s".repeat(500),
    misconception: "m".repeat(500),
    answerShown: "a".repeat(500),
    level: 3,
    language: "en",
  });
  assert.equal(body.response.length, LIMITS.response);
  assert.equal(body.prompt.length, LIMITS.prompt);
  assert.equal(body.standard.length, LIMITS.standard);
  assert.equal(body.misconception.length, LIMITS.misconception);
  assert.ok(JSON.stringify(body).length < 8000, "well inside the server's body cap");

  const server = readFileSync(join(HERE, "../../functions/api/reasoning/[[path]].js"), "utf8");
  const cap = (name) => Number(new RegExp(`const ${name} = (\\d+)`).exec(server)?.[1]);
  assert.equal(LIMITS.response, cap("MAX_RESPONSE"), "client response cap == server cap");
  assert.equal(LIMITS.prompt, cap("MAX_PROMPT"), "client prompt cap == server cap");
  assert.match(server, /standard: String\(body\?\.standard \?\? ""\)\.slice\(0, 40\)/);
  assert.match(server, /misconception: String\(body\?\.misconception \?\? ""\)\.slice\(0, 120\)/);
});

test("language: the student's saved choice picks the reply language; Spanish copy shows", async () => {
  setPreferredLang("es");
  const net = stubFetch();
  const { button, out } = setup(undefined, { fetchImpl: net.impl });
  assert.match(button.textContent, /Revisa mi razonamiento/, "Spanish leads for a Spanish student");
  assert.match(button.textContent, /Check my reasoning/, "English stays as the subline");
  button.click();
  await settle();
  assert.equal(net.calls[0].body.language, "es", "the API is asked to reply in Spanish");
  assert.match(out.textContent, /Esto es una guía, no una nota/);

  setPreferredLang("en");
  const net2 = stubFetch();
  const second = setup(undefined, { fetchImpl: net2.impl });
  assert.match(second.button.textContent, /^Check my reasoning/);
  second.button.click();
  await settle();
  assert.equal(net2.calls[0].body.language, "en");
  assert.equal(normalizeLang("es-MX"), "es");
  assert.equal(normalizeLang("fr"), "en");
});

test("result: one gap, one question, labelled as coaching and not a grade", async () => {
  const net = stubFetch(() =>
    reply(200, { ok: true, strengths: "You scaled both.", gap: "You did not say why.", question: "Why both?" }),
  );
  const { button, out, status } = setup(undefined, { fetchImpl: net.impl });
  button.click();
  await settle();
  assert.match(out.textContent, /You scaled both\./);
  assert.match(out.textContent, /You did not say why\./);
  assert.match(out.textContent, /Why both\?/);
  assert.match(out.textContent, /coaching, not a grade/);
  assert.doesNotMatch(out.innerHTML, /<script|onerror/i);
  assert.equal(status.textContent, "");
  assert.match(button.textContent, /Check again/);
});

test("model text is rendered as text, never as markup", async () => {
  const net = stubFetch(() =>
    reply(200, { ok: true, strengths: "", gap: "", question: "<img src=x onerror=alert(1)> why?" }),
  );
  const { button, out } = setup(undefined, { fetchImpl: net.impl });
  button.click();
  await settle();
  assert.equal(out.querySelector("img"), null);
  assert.match(out.textContent, /<img src=x/);
});

test("empty writing: no request, a plain prompt to write first", async () => {
  const net = stubFetch();
  const { button, status } = setup("   ", { fetchImpl: net.impl });
  button.click();
  await settle();
  assert.equal(net.calls.length, 0);
  assert.match(status.textContent, /Write a sentence or two/);
});

test("never blocks: an unavailable service leaves the student free and the writing intact", async () => {
  for (const respond of [() => reply(503, { ok: false }), () => reply(502, { ok: false }), () => new Response("nope", { status: 500 })]) {
    const net = stubFetch(respond);
    const { textarea, button, status, out, root } = setup(undefined, { fetchImpl: net.impl });
    const before = textarea.value;
    button.click();
    await settle();
    assert.match(status.textContent, /not available right now/);
    assert.match(status.textContent, /Keep going/);
    assert.equal(textarea.value, before, "the student's writing is untouched");
    assert.equal(textarea.disabled, false);
    assert.equal(textarea.readOnly, false);
    assert.equal(button.disabled, false, "the button is never hard-disabled");
    assert.equal(button.getAttribute("aria-disabled"), "false");
    assert.equal(out.textContent, "", "no half-result is shown");
    assert.notEqual(root.dataset.state, "reading");
  }
});

test("a network failure while offline is a friendly sentence, not an error", async () => {
  const net = stubFetch(() => {
    throw new TypeError("Failed to fetch");
  });
  const { button, status } = setup(undefined, { fetchImpl: net.impl });
  button.click();
  await settle();
  assert.match(status.textContent, /offline/i);

  Object.defineProperty(globalThis, "navigator", { value: { onLine: false }, configurable: true });
  try {
    const offlineNet = stubFetch();
    const offline = setup(undefined, { fetchImpl: offlineNet.impl });
    offline.button.click();
    await settle();
    assert.equal(offlineNet.calls.length, 0, "no request is attempted offline");
    assert.match(offline.status.textContent, /offline/i);
  } finally {
    Object.defineProperty(globalThis, "navigator", { value: { onLine: true }, configurable: true });
  }
});

test("a slow service is abandoned after the timeout instead of hanging the student", async () => {
  const hang = (_url, init) =>
    new Promise((_resolve, reject) => init.signal.addEventListener("abort", () => reject(new Error("aborted"))));
  const result = await requestReviewBody({ prompt: "p", response: "r" }, { fetchImpl: hang, timeoutMs: 20 });
  assert.deepEqual(result, { ok: false, reason: "timeout" });
});

test("rate limits: 429 shows a wait message, and presses inside the cooldown send nothing", async () => {
  const net = stubFetch(() => reply(429, { ok: false, error: "rate-limited" }));
  const { button, status } = setup(undefined, { fetchImpl: net.impl });
  button.click();
  await settle();
  assert.match(status.textContent, /A lot of students are asking/);
  button.click();
  button.click();
  await settle();
  assert.equal(net.calls.length, 1, "no hammering the server after a 429");
});

test("a press while one is in flight is ignored, even once the cooldown has passed", async () => {
  await withClock(async (advance) => {
    let release;
    const gate = new Promise((resolve) => {
      release = resolve;
    });
    const calls = [];
    const slow = async (_url, init) => {
      calls.push(init);
      await gate;
      return reply(200, GOOD);
    };
    const { button, root } = setup(undefined, { fetchImpl: slow });
    button.click();
    await settle();
    assert.equal(root.dataset.state, "reading");
    assert.equal(button.getAttribute("aria-busy"), "true");
    advance();
    button.click();
    button.click();
    release();
    await settle();
    assert.equal(calls.length, 1);
  });
});

test("a short cooldown separates presses, and each box has a ceiling on checks", async () => {
  await withClock(async (advance) => {
    const net = stubFetch();
    const { button, status } = setup(undefined, { fetchImpl: net.impl });
    button.click();
    await settle();
    button.click();
    await settle();
    assert.equal(net.calls.length, 1, "an immediate second press is held back by the cooldown");
    for (let i = 0; i < LIMITS.maxChecksPerBox + 2; i += 1) {
      advance();
      button.click();
      await settle();
    }
    assert.equal(net.calls.length, LIMITS.maxChecksPerBox, "the per-box ceiling holds");
    assert.match(status.textContent, /used the checks for this box/);
  });
});

test("mounting twice on one box returns the same control", () => {
  document.body.innerHTML = "<textarea></textarea>";
  const textarea = document.querySelector("textarea");
  assert.equal(mountReasoningCheck(textarea), mountReasoningCheck(textarea));
});

test("accessibility: live regions, described button, 44px target, visible focus rule", () => {
  const { root, button } = setup();
  assert.equal(root.querySelector(".rc-status").getAttribute("aria-live"), "polite");
  assert.equal(root.querySelector(".rc-out").getAttribute("aria-live"), "polite");
  const hint = document.getElementById(button.getAttribute("aria-describedby"));
  assert.match(hint.textContent, /not saved and not graded/);
  const css = document.getElementById("rc-styles").textContent;
  assert.match(css, /\.rc-btn\{[^}]*min-height:44px/);
  assert.match(css, /\.rc-btn:focus-visible\{outline:3px/);
  assert.match(css, /prefers-reduced-motion:reduce/);
});

test("one client: only reasoning-check.js talks to /api/reasoning, and the studio uses it", () => {
  const offenders = readdirSync(HERE)
    .filter((name) => name.endsWith(".js"))
    .filter((name) => readFileSync(join(HERE, name), "utf8").includes("/api/reasoning/review"));
  assert.deepEqual(offenders, ["reasoning-check.js"]);
  assert.match(
    readFileSync(join(HERE, "small-group-practice.js"), "utf8"),
    /import \{ mountReasoningCheck \} from "\.\/reasoning-check\.js"/,
  );
});

test("every engine writing surface mounts the shared control", async () => {
  const sources = {
    "../components/twr-writing.js": /mountReasoningCheck\(ta, reasoning\)/,
    "./go-deeper.js": /mountReasoningCheck\(one\.area/,
    "./peer-exchange.js": /mountReasoningCheck\(textarea/,
  };
  for (const [file, pattern] of Object.entries(sources)) {
    assert.match(readFileSync(join(HERE, file), "utf8"), pattern, `${file} mounts the control`);
  }
});

test("whole-class Write About the Math: every writing box gets the control, and Save still works", async () => {
  document.body.innerHTML = "<div id='app'></div>";
  const { renderTwrWriting } = await import("../components/twr-writing.js");
  const saved = [];
  let submitted = null;
  renderTwrWriting(
    document.getElementById("app"),
    {
      title: "Equivalent ratios",
      contentObjective: "I can use ratio tables to find equivalent ratios",
      tryAnotherWay: { domain: "ratio" },
      connect: { promptQuestion: "How do you know the ratios are equivalent?" },
    },
    {
      getResponse: () => "",
      saveResponse: (key, value) => saved.push([key, value]),
      onSubmit: (written, total) => {
        submitted = [written, total];
      },
    },
  );
  const boxes = document.querySelectorAll("textarea.twr-textarea");
  const controls = document.querySelectorAll("[data-reasoning-check]");
  assert.equal(boxes.length, 3, "Start, Build and Explain boxes");
  assert.equal(controls.length, boxes.length, "one opt-in control per box");

  boxes[2].value = "Both quantities are multiplied by the same number.";
  boxes[2].dispatchEvent(new window.Event("input", { bubbles: true }));
  [...document.querySelectorAll("button")].find((b) => b.textContent === "Save My Writing").click();
  assert.deepEqual(submitted, [1, 3], "saving is unchanged by the control");
  await settle();
  assert.ok(document.querySelector("[data-strategy-gallery]"), "sample solutions are offered after saving");
});

test("Go Deeper: the control sits under the work and the skeptic box, and progress is unchanged", async () => {
  document.body.innerHTML = "<div id='app'></div>";
  const { createGoDeeper } = await import("./go-deeper.js");
  const lab = createGoDeeper({
    config: {
      lessonId: "t-1",
      practice: { onLevel: [{ type: "open-response", prompt: "A tank holds 40 liters. How many liters is 25% of it?" }] },
    },
    lessonId: "t-1",
  });
  document.getElementById("app").append(lab);
  assert.equal(lab.querySelectorAll("[data-reasoning-check]").length, 2);
  const [first, second] = lab.querySelectorAll("textarea");
  assert.equal(first.nextElementSibling.hasAttribute("data-reasoning-check"), true);
  assert.equal(second.nextElementSibling.hasAttribute("data-reasoning-check"), true);
  const lock = [...lab.querySelectorAll(".ntgd-btn")].find((b) => /Lock it in/.test(b.textContent));
  first.value = "I found a quarter of forty by halving twice.";
  first.dispatchEvent(new window.Event("input", { bubbles: true }));
  assert.equal(lock.disabled, false, "the existing gate still reads only the student's writing");
});

test("contract with the real handler: the client's body is accepted, answered in Spanish, and answer-safe", async () => {
  const { onRequest } = await import("../../functions/api/reasoning/[[path]].js");
  const sentToModel = [];
  const realFetch = globalThis.fetch;
  let modelReply = { strengths: "", gap: "", question: "¿Cómo sabes que la razón se mantiene?" };
  globalThis.fetch = async (_url, init) => {
    sentToModel.push(JSON.parse(init.body));
    return new Response(JSON.stringify({ content: [{ type: "text", text: JSON.stringify(modelReply) }] }));
  };
  try {
    const call = async (answerShown) => {
      const body = buildReviewBody({
        prompt: "A recipe uses 3 cups of oats for every 2 cups of milk. How much milk for 12 cups of oats?",
        response: "I multiplied 3 by 4 to get 12, so I multiplied 2 by 4 as well.",
        answerShown,
        level: 1,
        language: "es",
      });
      const request = new Request("https://eduwonderlab.com/api/reasoning/review", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "https://eduwonderlab.com", "CF-Connecting-IP": "198.51.100.7" },
        body: JSON.stringify(body),
      });
      const response = await onRequest({ request, env: { ANTHROPIC_API_KEY: "k" }, params: { path: ["review"] } });
      return { status: response.status, data: await response.json() };
    };
    const ok = await call("8");
    assert.equal(ok.status, 200);
    assert.equal(ok.data.question, modelReply.question);
    assert.match(sentToModel[0].system, /Write every JSON VALUE in Spanish/);
    assert.match(sentToModel[0].system, /very short sentences/, "level 1 reaches the model");

    modelReply = { strengths: "", gap: "", question: "¿Por qué 8 es la respuesta?" };
    const leaked = await call("8");
    assert.equal(leaked.data.filtered, true, "coaching that states the answer is replaced, in Spanish");
    assert.match(leaked.data.question, /oración/);
    // The client's own parser against the handler's real response.
    const viaHandler = async (_url, init) =>
      onRequest({
        request: new Request("https://eduwonderlab.com/api/reasoning/review", {
          method: "POST",
          headers: { origin: "https://eduwonderlab.com", "CF-Connecting-IP": "198.51.100.8" },
          body: init.body,
        }),
        env: { ANTHROPIC_API_KEY: "k" },
        params: { path: ["review"] },
      });
    modelReply = { strengths: "", gap: "", question: "¿Cómo sabes que la razón se mantiene?" };
    const result = await requestReviewBody(
      buildReviewBody({ prompt: "p", response: "I multiplied 3 by 4 and so on", language: "es" }),
      { fetchImpl: viaHandler },
    );
    assert.equal(result.ok, true, "the client parses what the real handler returns");
  } finally {
    globalThis.fetch = realFetch;
  }
});

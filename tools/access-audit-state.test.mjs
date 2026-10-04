import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { JSDOM } from "jsdom";
import {
  exportCode,
  loadRecord,
  loadTestRecord,
  PREFIX,
  practiceDays,
} from "../access-practice-lab/src/store.js";
import { storage, toHtml } from "../access-practice-lab/src/util.js";

const dom = new JSDOM(
  '<main id="app"></main><div id="labLive"></div><p id="labStorageWarning" hidden></p>',
  { url: "https://lab.test/access-practice-lab/" },
);
for (const key of ["window", "document", "localStorage", "location", "history"])
  globalThis[key] = dom.window[key];
window.scrollTo = () => {};
let delayedPath = "";
let releaseFetch;
globalThis.fetch = async (url) => {
  if (String(url).endsWith(delayedPath) && delayedPath)
    await new Promise((resolve) => {
      releaseFetch = resolve;
    });
  return {
    ok: true,
    json: async () =>
      JSON.parse(
        await readFile(new URL(`../${String(url).replace(/^\//, "")}`, import.meta.url), "utf8"),
      ),
  };
};
const activity = await import("../access-practice-lab/src/views/activity.js");
const tests = await import("../access-practice-lab/src/views/test.js");
let active = activity;
const ctx = {
  band: "3-5",
  prefs: {},
  route: {},
  rerender: () => draw(),
  navigate(path) {
    history.replaceState({}, "", path);
    return draw();
  },
};
const settle = async () => {
  await new Promise((r) => setTimeout(r, 0));
  await new Promise((r) => setTimeout(r, 0));
};
async function draw() {
  const output = await active.render(ctx);
  document.querySelector("#app").innerHTML = toHtml(output.html);
  active.mount?.(document.querySelector("#app"));
}
async function go(domain, id) {
  active = activity;
  ctx.band = "3-5";
  ctx.route = { view: "activity", domain, level: "A", id };
  await draw();
}
function input(selector, value) {
  const target = document.querySelector(selector);
  assert.ok(target, selector);
  target.value = value;
  active.onInput({ target });
}
async function reviewTest() {
  while (document.querySelector("[data-next]")) await click("[data-next]");
  await click("[data-review]");
}
async function click(selector) {
  const target = document.querySelector(selector);
  assert.ok(target, selector);
  active.onClick({ target }, ctx);
  await settle();
}

test("late activity fetch cannot redirect subsequent edits into an older route", async () => {
  localStorage.clear();
  active = activity;
  delayedPath = "/g6-8/Reading.json";
  ctx.band = "6-8";
  ctx.route = { view: "activity", domain: "Reading", level: "A", id: "read-main-idea" };
  const stale = activity.render(ctx);
  await settle();
  assert.equal(typeof releaseFetch, "function");
  await go("Writing", "g35-w-a-park-scene");
  releaseFetch();
  delayedPath = "";
  assert.equal(toHtml((await stale).html), "");
  input("[data-note]", "The girl is swinging.");
  assert.equal(
    loadRecord("3-5", "Writing", "A").notes["g35-w-a-park-scene"],
    "The girl is swinging.",
  );
  assert.deepEqual(loadRecord("6-8", "Reading", "A").notes, {});
});

test("unmount invalidates pending activity rendering and ignores old-page inputs", async () => {
  delayedPath = "/g6-8/Listening.json";
  ctx.band = "6-8";
  ctx.route = { view: "activity", domain: "Listening", level: "A", id: "exit-ticket" };
  const pending = activity.render(ctx);
  await settle();
  activity.unmount();
  input("[data-note]", "Should not overwrite the previous draft.");
  releaseFetch();
  delayedPath = "";
  assert.equal(toHtml((await pending).html), "");
  assert.equal(
    loadRecord("3-5", "Writing", "A").notes["g35-w-a-park-scene"],
    "The girl is swinging.",
  );
});

test("blocked storage preserves draft through rerender and portable export with visible warning", async () => {
  const realStorage = globalThis.localStorage;
  const key = `${PREFIX}:g3-5:Writing:A`;
  globalThis.localStorage = {
    getItem() {
      throw Error("blocked");
    },
    setItem() {
      throw Error("blocked");
    },
    removeItem() {
      throw Error("blocked");
    },
  };
  try {
    await go("Writing", "g35-w-a-park-scene");
    input("[data-note]", "A boy kicks a red ball.");
    await draw();
    assert.equal(document.querySelector("[data-note]").value.trim(), "A boy kicks a red ball.");
    assert.equal(document.querySelector("#labStorageWarning").hidden, false);
    assert.ok(storage.isVolatile);
    const code = exportCode();
    const decoded = JSON.parse(
      Buffer.from(code.slice("ACCESS1.".length), "base64").toString("utf8"),
    );
    assert.equal(
      JSON.parse(decoded.data[key]).notes["g35-w-a-park-scene"],
      "A boy kicks a red ball.",
    );
  } finally {
    globalThis.localStorage = realStorage;
    storage.remove(key);
  }
  assert.equal(document.querySelector("#labStorageWarning").hidden, true);
});

test("undoing a worksheet completion removes the evidence and practice day", async () => {
  localStorage.clear();
  await go("Writing", "g35-w-a-ws-weekend");
  await click("[data-mark-done]");
  assert.equal(practiceDays().length, 1);
  await click("[data-mark-done]");
  const record = loadRecord("3-5", "Writing", "A");
  assert.deepEqual(record.complete, []);
  assert.equal(record.results["g35-w-a-ws-weekend"], undefined);
  assert.deepEqual(practiceDays(), []);
});

test("speaking test planning notes do not earn spoken completion or a practice streak", async () => {
  localStorage.clear();
  active = tests;
  tests.invalidate();
  ctx.route = { view: "test", testId: "g35-speaking-mini" };
  await draw();
  await click("[data-start]");
  input("[data-test-note]", "Planning words only; no speaking yet.");
  await reviewTest();
  await click("[data-submit]");
  let record = loadTestRecord("g35-speaking-mini");
  assert.equal(record.results.meaningful, false);
  assert.equal(record.results.sections[0].openDone, 0);
  assert.deepEqual(practiceDays(), []);
  tests.invalidate();
  record.phase = "intro";
  delete record.results;
  record.oralPractice = { "g35-sm-1": true };
  localStorage.setItem(`${PREFIX}:test:g35-speaking-mini`, JSON.stringify(record));
  await draw();
  await click("[data-start]");
  await reviewTest();
  await click("[data-submit]");
  record = loadTestRecord("g35-speaking-mini");
  assert.equal(record.results.sections[0].openDone, 1);
  assert.equal(record.results.meaningful, true);
  assert.equal(practiceDays().length, 1);
});

test("editing an unfinished checked draft hides feedback about the previous text", async () => {
  localStorage.clear();
  await go("Writing", "g35-w-a-park-scene");
  input("[data-note]", "I see a park.");
  await click("[data-check-writing]");
  assert.ok(document.querySelector(".feedback"));
  input("[data-note]", "A girl swings by the tree.");
  assert.ok(!document.querySelector(".feedback") || document.querySelector(".feedback").hidden);
  await draw();
  assert.equal(document.querySelector(".feedback"), null);
});

test("a detached help drawer cannot mark the newly opened activity as supported", async () => {
  localStorage.clear();
  await go("Writing", "g35-w-a-park-scene");
  const oldHelp = document.querySelector(".helpers");
  assert.ok(oldHelp);
  await go("Speaking", "g35-s-a-playground");
  oldHelp.open = true;
  oldHelp.dispatchEvent(new window.Event("toggle"));
  await settle();
  assert.equal(loadRecord("3-5", "Speaking", "A").supportUsed?.["g35-s-a-playground"], undefined);
});

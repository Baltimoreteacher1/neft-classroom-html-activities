import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { JSDOM } from "jsdom";
import { purposeOf, wordBank } from "../access-practice-lab/src/learning.js";
import { activityStatus } from "../access-practice-lab/src/practice-plan.js";
import { loadRecord, PREFIX, practiceDays } from "../access-practice-lab/src/store.js";
import { toHtml } from "../access-practice-lab/src/util.js";

const dom = new JSDOM('<main id="app"></main><div id="labLive"></div>', {
  url: "https://lab.test/access-practice-lab/",
});
for (const key of ["window", "document", "localStorage", "location", "history"])
  globalThis[key] = dom.window[key];
globalThis.fetch = async (url) => ({
  ok: true,
  json: async () =>
    JSON.parse(
      await readFile(new URL(`../${String(url).replace(/^\//, "")}`, import.meta.url), "utf8"),
    ),
});
const view = await import("../access-practice-lab/src/views/activity.js");
const ctx = {
  band: "3-5",
  prefs: {},
  route: {},
  rerender: async () => draw(),
  navigate(path) {
    history.replaceState({}, "", path);
    return draw();
  },
};
async function draw() {
  document.querySelector("#app").innerHTML = toHtml((await view.render(ctx)).html);
  view.mount(document.querySelector("#app"));
}
async function go(domain, id, search = "") {
  ctx.route = { view: "activity", domain, level: "A", id };
  history.replaceState({}, "", `/access-practice-lab/${domain}/A/${id}${search}`);
  await draw();
}
async function click(selector) {
  const target = document.querySelector(selector);
  assert.ok(target, selector);
  view.onClick({ target }, ctx);
  await new Promise((resolve) => setTimeout(resolve, 0));
}
function input(selector, value) {
  const target = document.querySelector(selector);
  target.value = value;
  view.onInput({ target });
}
const writing = "g35-w-a-park-scene";

test("empty writing is validation only: no results, progress, models, or streak", async () => {
  localStorage.clear();
  await go("Writing", writing);
  await click("[data-check-writing]");
  const record = loadRecord("3-5", "Writing", "A");
  assert.deepEqual(record.results, {});
  assert.equal(activityStatus(record, writing), "new");
  assert.deepEqual(practiceDays(), []);
  assert.equal(document.querySelector(".ladder"), null);
  assert.match(document.querySelector("[role=alert]").textContent, /Write a word/);
});

test("writing retains original draft, requires reflection, and records revision without grading meaning", async () => {
  await go("Writing", writing);
  input("[data-note]", "I see a park.");
  await click("[data-check-writing]");
  let record = loadRecord("3-5", "Writing", "A");
  assert.equal(record.drafts[writing].first, "I see a park.");
  assert.deepEqual(record.complete, []);
  assert.equal(record.results[writing].score, undefined);
  await click("[data-finish-writing]");
  assert.deepEqual(loadRecord("3-5", "Writing", "A").complete, []);
  input("[data-note]", "I see a park. The girl is swinging.");
  input("[data-reflection]", "I added what the girl is doing.");
  await click("[data-finish-writing]");
  record = loadRecord("3-5", "Writing", "A");
  assert.ok(record.complete.includes(writing));
  assert.equal(record.results[writing].evidence, "revised");
  assert.equal(record.drafts[writing].first, "I see a park.");
  input("[data-note]", "");
  assert.ok(!loadRecord("3-5", "Writing", "A").complete.includes(writing));
});

test("independent practice withholds hints, frames and model answers", async () => {
  await go("Writing", writing, "?mode=independent");
  assert.equal(document.querySelector(".helpers"), null);
  assert.equal(document.querySelector(".wordbank"), null);
  input("[data-note]", "I see a park.");
  await click("[data-check-writing]");
  assert.equal(document.querySelector(".ladder"), null);
});

test("blank speaking save creates no evidence", async () => {
  localStorage.clear();
  await go("Speaking", "g35-s-a-recess");
  await click("[data-save-speaking]");
  assert.deepEqual(loadRecord("3-5", "Speaking", "A").results, {});
  assert.deepEqual(practiceDays(), []);
});

test("vocabulary deduplication preserves meaningful forms and whole phrases", () => {
  assert.deepEqual(
    wordBank({ wordBank: ["park", "Park", "is kicking"], vocabulary: [["park"], ["kick"]] }),
    ["park", "is kicking", "kick"],
  );
  assert.equal(purposeOf({ skill: "Describe a picture" }), "inform");
  assert.equal(purposeOf({ skill: "Narrate a story" }), "narrate");
});

test("legacy empty results do not count as attempts or practice days", () => {
  localStorage.clear();
  localStorage.setItem(
    `${PREFIX}:g3-5:Writing:A`,
    JSON.stringify({ results: { empty: { words: 0, date: new Date().toISOString() } } }),
  );
  localStorage.setItem(
    `${PREFIX}:g3-5:Speaking:A`,
    JSON.stringify({ results: { empty: { practiced: false, date: new Date().toISOString() } } }),
  );
  assert.equal(activityStatus(loadRecord("3-5", "Writing", "A"), "empty"), "new");
  assert.deepEqual(practiceDays(), []);
});

test("editing a saved correct choice removes its stamp before rechecking", async () => {
  localStorage.clear();
  const { loadDomain } = await import("../access-practice-lab/src/content.js");
  const item = (await loadDomain("3-5", "Reading")).levels.A.activities.find(
    (a) => a.type === "multipleChoice",
  );
  assert.ok(item);
  localStorage.setItem(
    `${PREFIX}:g3-5:Reading:A`,
    JSON.stringify({
      answers: { [item.id]: item.answer },
      complete: [item.id],
      results: { [item.id]: { ok: true, evidence: "independent" } },
    }),
  );
  await go("Reading", item.id);
  const wrong = item.options.find((o) => o.id !== item.answer).id;
  const target = document.querySelector(`[data-ans-choice][value="${wrong}"]`);
  view.onChange({ target }, ctx);
  await new Promise((r) => setTimeout(r, 0));
  assert.deepEqual(loadRecord("3-5", "Reading", "A").complete, []);
  assert.equal(document.querySelector(".done-badge"), null);
  await click("[data-check]");
  assert.equal(loadRecord("3-5", "Reading", "A").results[item.id].ok, false);
  assert.deepEqual(loadRecord("3-5", "Reading", "A").complete, []);
});

test("fresh independent attempt resets selected answers and help while retaining history", async () => {
  const { loadDomain } = await import("../access-practice-lab/src/content.js");
  const item = (await loadDomain("3-5", "Reading")).levels.A.activities.find(
    (a) => a.type === "multipleChoice",
  );
  await click("[data-fresh-attempt]");
  let record = loadRecord("3-5", "Reading", "A");
  assert.equal(record.answers[item.id], null);
  assert.equal(record.attempts[item.id], 0);
  assert.equal(record.supportUsed[item.id], false);
  assert.equal(record.attemptHistory[item.id].length, 1);
  assert.equal(record.attemptHistory[item.id][0].result.ok, false);
  assert.equal(document.querySelector("[data-mode]:checked").value, "independent");
  assert.equal(document.querySelector(".strategy"), null);
  view.onChange(
    { target: document.querySelector(`[data-ans-choice][value="${item.answer}"]`) },
    ctx,
  );
  await new Promise((r) => setTimeout(r, 0));
  await click("[data-check]");
  record = loadRecord("3-5", "Reading", "A");
  assert.equal(record.results[item.id].evidence, "independent");
  assert.ok(record.complete.includes(item.id));
  assert.equal(record.attemptHistory[item.id][0].result.ok, false);
});

test("changing a reflection or speaking checklist revokes completion until reviewed again", async () => {
  localStorage.clear();
  await go("Writing", writing);
  input("[data-note]", "The girl is swinging in the park.");
  await click("[data-check-writing]");
  input("[data-reflection]", "I checked the detail.");
  await click("[data-finish-writing]");
  assert.ok(loadRecord("3-5", "Writing", "A").complete.includes(writing));
  input("[data-reflection]", "");
  assert.deepEqual(loadRecord("3-5", "Writing", "A").complete, []);
  assert.equal(document.querySelector(".done-badge"), null);
  const speaking = "g35-s-a-playground";
  localStorage.setItem(
    `${PREFIX}:g3-5:Speaking:A`,
    JSON.stringify({
      complete: [speaking],
      practiced: { [speaking]: true },
      selfChecks: { [speaking]: { clear: true, details: true } },
      results: { [speaking]: { evidence: "speaking", meaningful: true } },
    }),
  );
  await go("Speaking", speaking);
  const target = document.querySelector("[data-selfcheck]");
  target.checked = false;
  view.onChange({ target }, ctx);
  await new Promise((r) => setTimeout(r, 0));
  assert.deepEqual(loadRecord("3-5", "Speaking", "A").complete, []);
  assert.equal(document.querySelector(".done-badge"), null);
});

test("portfolio shows escaped revisions and history from the selected band only", async () => {
  const passport = await import("../access-practice-lab/src/views/passport.js");
  localStorage.clear();
  localStorage.setItem(
    `${PREFIX}:g3-5:Writing:A`,
    JSON.stringify({
      notes: { [writing]: '<script>alert("example")</script> My revised words.' },
      drafts: { [writing]: { first: "First words." } },
      reflections: { [writing]: "I added a detail." },
      results: { [writing]: { evidence: "revised", date: "2026-10-04" } },
      attemptHistory: { [writing]: [{ date: "2026-10-03", result: { evidence: "supported" } }] },
    }),
  );
  history.replaceState({}, "", "/access-practice-lab/passport?portfolio=1");
  const markup = toHtml((await passport.render(ctx)).html);
  const page = new JSDOM(markup).window.document;
  assert.match(page.body.textContent, /First words/);
  assert.match(page.body.textContent, /My revised words/);
  assert.match(page.body.textContent, /I added a detail/);
  assert.match(page.body.textContent, /Correct after help or a retry/);
  assert.equal(page.querySelector("script"), null);
  assert.ok(page.querySelector("[data-print]"));
  assert.doesNotMatch(
    toHtml((await passport.render({ ...ctx, band: "6-8" })).html),
    /My revised words/,
  );
});

// #/formative driven in jsdom against a stubbed /api: the alias grid, ONE tap per student (28 aliases = 28
// interactions), live distribution, dominant misconception, tallies, separate self scores, a failed save that is
// kept and retried, CSV downloads, and the route registration. Reads the real unit data through the real loader.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";
import { loadUnit } from "../functions/_lib/formative/request.js";

const dom = new JSDOM("<!doctype html><main id=root></main>", {
  url: "https://test.local/bcpss-teachers/studio/",
});
for (const k of ["window", "document", "localStorage", "sessionStorage", "Node", "Blob"])
  Object.defineProperty(globalThis, k, {
    value: dom.window[k],
    configurable: true,
    writable: true,
  });

const UNIT = "g6-ela-u1";
const CODE = "AAAAAA";
const students = Array.from({ length: 28 }, (_, i) => ({
  studentId: `s${(i + 1).toString(16).padStart(10, "0")}`,
  alias: `Star ${i + 1}`,
}));
const unit = await loadUnit({}, UNIT);
let calls;
let scoreStatus;
let serverScores;
let serverErrors;
globalThis.fetch = async (url, init = {}) => {
  const u = new URL(String(url), "https://test.local");
  const body = init.body ? JSON.parse(init.body) : null;
  calls.push({ path: u.pathname, body, headers: init.headers });
  const reply = (status, data) => new Response(JSON.stringify(data), { status });
  if (u.pathname === "/api/class/roster")
    return reply(200, { ok: true, students: students.map((s) => ({ ...s, docs: {} })) });
  if (u.pathname === "/api/formative/summary")
    return reply(200, {
      ok: true,
      ticket: unit.ticket,
      catalog: unit.catalog,
      reteach: unit.reteach,
      scores: serverScores,
      errors: serverErrors,
      weeks: [],
    });
  if (u.pathname === "/api/formative/score")
    return scoreStatus === 200
      ? reply(200, { ok: true, saved: body.scores.length })
      : reply(scoreStatus, { ok: false });
  if (u.pathname === "/api/formative/errors") return reply(200, { ok: true });
  return reply(404, {});
};
const shell = {
  catalog: { seedUnits: async () => [{ id: UNIT, unit_number: 1, unit_title: "Resilience" }] },
};
const tick = (ms = 20) => new Promise((r) => setTimeout(r, ms));
const { render } = await import("../bcpss-teachers/studio/views/formative/index.js");
const { parseHash, VIEW_FOR, VIEW_TITLES } = await import(
  "../bcpss-teachers/studio/core/router.js"
);

let lastStop;
async function open({ saved = true } = {}) {
  await lastStop?.(); // leaving a board flushes its pending taps; let that finish before the next test counts calls
  await tick();
  calls = [];
  scoreStatus = 200;
  serverScores = [];
  serverErrors = [];
  localStorage.clear();
  if (saved)
    localStorage.setItem(
      "accessPracticeLabClass:v1:teacher-classes",
      JSON.stringify([{ code: CODE, passcode: "ABCD2345", title: "Period 2" }]),
    );
  const root = document.getElementById("root");
  lastStop = await render({ root, params: { grade: "6", subject: "ela", unit: UNIT }, shell });
  await tick();
  return { root };
}
const submit = async (root, fields = {}) => {
  for (const [id, v] of Object.entries(fields)) root.querySelector(`#${id}`).value = v;
  root
    .querySelector("form")
    .dispatchEvent(new dom.window.Event("submit", { cancelable: true, bubbles: true }));
  await tick(50);
};
const rowBtn = (root, i, level) =>
  root.querySelectorAll(".st-fm-row")[i].querySelector(`[data-level="${level}"]`);
const barText = (root) => [...root.querySelectorAll(".st-fm-dist-n")].map((n) => n.textContent);

test("route: #/formative loads views/formative/index with a title", () => {
  assert.equal(VIEW_FOR.formative, "formative/index");
  assert.ok(VIEW_TITLES["formative/index"]);
  assert.equal(parseHash("#/formative").view, "formative/index");
});

test("picker: saved classes are offered; with none, code and passcode are asked for and sent only as headers", async () => {
  let { root } = await open();
  assert.ok(root.querySelector("#st-fm-class"));
  ({ root } = await open({ saved: false }));
  assert.ok(root.querySelector("#st-fm-code") && root.querySelector("#st-fm-pass"));
  assert.equal(root.querySelector("#st-fm-pass").type, "password");
  await submit(root, {
    "st-fm-unit": UNIT,
    "st-fm-code": CODE.toLowerCase(),
    "st-fm-pass": "abcd2345",
  });
  const call = calls.find((c) => c.path === "/api/formative/summary");
  assert.equal(call.headers["x-class-teacher"], "ABCD2345");
  assert.equal(root.querySelectorAll(".st-fm-row").length, 28);
  assert.equal(
    localStorage.getItem("accessPracticeLabClass:v1:teacher-classes"),
    null,
    "the typed passcode is not stored",
  );
});

test("scoring 28 aliases takes 28 interactions (one tap each), shows the live distribution and saves in one batch", async () => {
  const { root } = await open();
  await submit(root, { "st-fm-unit": UNIT });
  assert.equal(root.querySelectorAll(".st-fm-row").length, 28);
  assert.deepEqual(
    [...root.querySelectorAll(".st-fm-alias")].map((n) => n.textContent),
    students.map((s) => s.alias),
    "aliases only",
  );
  const levels = ["emerging", "developing", "proficient"];
  let interactions = 0;
  students.forEach((_, i) => {
    rowBtn(root, i, levels[i % 3]).click();
    interactions += 1;
  });
  assert.equal(interactions, 28);
  assert.deepEqual(barText(root), ["10 students (36%)", "9 students (32%)", "9 students (32%)"]);
  assert.match(root.querySelector(".st-fm-live").textContent, /28 of 28 scored/);
  assert.equal(root.querySelectorAll(".st-fm-row [aria-pressed=true]").length, 28);
  assert.equal(
    calls.filter((c) => c.path === "/api/formative/score").length,
    0,
    "taps are batched, not one request each",
  );
  await tick(450);
  const saves = calls.filter((c) => c.path === "/api/formative/score");
  assert.equal(saves.length, 1);
  assert.equal(saves[0].body.scores.length, 28);
  assert.equal(saves[0].body.ticketId, `${UNIT}:exit`);
  assert.match(root.textContent, /Saved 28 scores/);
});

test("tapping the same level again clears it; keys 1-3 score the focused row and move on", async () => {
  const { root } = await open();
  await submit(root, { "st-fm-unit": UNIT });
  rowBtn(root, 0, "emerging").click();
  assert.equal(rowBtn(root, 0, "emerging").getAttribute("aria-pressed"), "true");
  rowBtn(root, 0, "emerging").click();
  assert.equal(rowBtn(root, 0, "emerging").getAttribute("aria-pressed"), "false");
  const first = rowBtn(root, 1, "emerging");
  first.focus();
  first.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "2", bubbles: true }));
  assert.equal(rowBtn(root, 1, "developing").getAttribute("aria-pressed"), "true");
  assert.equal(
    document.activeElement,
    rowBtn(root, 2, "emerging"),
    "focus moves to the next alias",
  );
  await tick(450);
  const sent = calls.filter((c) => c.path === "/api/formative/score").flatMap((c) => c.body.scores);
  assert.deepEqual(
    sent.map((s) => String(s.level)).sort(),
    ["developing", "null"],
    "the clear is sent as null",
  );
});

test("dominant misconception: the unit's own, then a tallied one; all proficient needs no reteach", async () => {
  const { root } = await open();
  await submit(root, { "st-fm-unit": UNIT });
  assert.match(root.querySelector(".st-fm-live").textContent, /Score a few aliases/);
  rowBtn(root, 0, "emerging").click();
  rowBtn(root, 1, "developing").click();
  const card = root.querySelector(".st-fm-dominant");
  assert.ok(card.textContent.includes(unit.catalog[0].label));
  assert.match(card.textContent, /Follow-up activity:/);
  assert.match(card.textContent, /2 students scored emerging or developing/);
  const doctor = unit.catalog.find((e) => e.id.startsWith("doctor:"));
  const plus = root.querySelector(`button[aria-label="Add one: ${doctor.label}"]`);
  plus.click();
  plus.click();
  await tick();
  assert.ok(
    root.querySelector(".st-fm-dominant").textContent.includes(doctor.label),
    "two tallies beat the default",
  );
  assert.match(root.querySelector(".st-fm-dominant").textContent, /Tallied 2 times/);
  const bumps = calls.filter((c) => c.path === "/api/formative/errors");
  assert.equal(bumps.length, 2);
  assert.deepEqual(bumps[0].body.errors, [{ type: doctor.id, count: 1 }]);
  assert.ok(root.querySelector(".st-fm-table"), "top error table appears");
  rowBtn(root, 0, "proficient").click();
  rowBtn(root, 1, "proficient").click();
  assert.match(root.querySelector(".st-fm-live").textContent, /No reteach needed/);
});

test("self-scores are shown apart from the teacher's, with how often they match", async () => {
  await lastStop?.();
  await tick();
  calls = [];
  scoreStatus = 200;
  serverErrors = [];
  serverScores = [
    { studentId: students[0].studentId, level: "proficient", by: "teacher" },
    { studentId: students[0].studentId, level: "proficient", by: "self" },
    { studentId: students[1].studentId, level: "emerging", by: "teacher" },
    { studentId: students[1].studentId, level: "developing", by: "self" },
  ];
  localStorage.setItem(
    "accessPracticeLabClass:v1:teacher-classes",
    JSON.stringify([{ code: CODE, passcode: "ABCD2345", title: "P2" }]),
  );
  const root = document.getElementById("root");
  lastStop = await render({ root, params: { grade: "6", subject: "ela", unit: UNIT }, shell });
  await tick();
  await submit(root, { "st-fm-unit": UNIT });
  const text = root.querySelector(".st-fm-live").textContent;
  assert.match(text, /Class distribution \(your scores\)/);
  assert.match(text, /Student self-scores \(separate from yours\)/);
  assert.match(text, /match for 1 of 2 students/);
  assert.equal(
    rowBtn(root, 1, "emerging").getAttribute("aria-pressed"),
    "true",
    "the grid shows the teacher's score, not the self score",
  );
});

test("a failed save keeps the taps and says so; the next save retries them", async () => {
  const { root } = await open();
  await submit(root, { "st-fm-unit": UNIT });
  scoreStatus = 500;
  rowBtn(root, 3, "developing").click();
  await tick(450);
  assert.match(root.textContent, /did not save/);
  assert.equal(
    rowBtn(root, 3, "developing").getAttribute("aria-pressed"),
    "true",
    "the tap is still shown",
  );
  scoreStatus = 200;
  [...root.querySelectorAll("button")].find((b) => b.textContent === "Save now").click();
  await tick();
  const saves = calls.filter((c) => c.path === "/api/formative/score");
  assert.equal(saves.length, 2);
  assert.deepEqual(saves[1].body.scores, [
    { studentId: students[3].studentId, level: "developing" },
  ]);
  scoreStatus = 0;
});

test("CSV downloads carry aliases, levels and the not-a-score note, and run no formulas", async () => {
  const { root } = await open();
  await submit(root, { "st-fm-unit": UNIT });
  const files = [];
  const blobs = [];
  dom.window.URL.createObjectURL = (blob) => (blobs.push(blob), `blob:test/${blobs.length}`);
  dom.window.URL.revokeObjectURL = () => {};
  globalThis.URL.createObjectURL = dom.window.URL.createObjectURL;
  globalThis.URL.revokeObjectURL = () => {};
  dom.window.HTMLAnchorElement.prototype.click = function () {
    files.push(this.getAttribute("download"));
  };
  rowBtn(root, 0, "proficient").click();
  const doctor = unit.catalog.find((e) => e.id.startsWith("doctor:"));
  root.querySelector(`button[aria-label="Add one: ${doctor.label}"]`).click();
  await tick(450);
  const press = (label) =>
    [...root.querySelectorAll("button")].find((b) => b.textContent === label).click();
  press("Download scores (CSV)");
  press("Download error trend (CSV)");
  assert.deepEqual(files, [
    `exit-ticket-${UNIT}-scores.csv`,
    `exit-ticket-${UNIT}-error-trend.csv`,
  ]);
  const [scores, trend] = await Promise.all(blobs.map((b) => b.text()));
  assert.match(scores, /unit,ticket,alias,scored_by,level\r\n/);
  assert.match(scores, new RegExp(`${UNIT},${UNIT}:exit,Star 1,teacher,proficient`));
  assert.match(scores, /not official, not a score, not a placement tool/);
  assert.match(trend, new RegExp(`${UNIT},${doctor.id},`));
  assert.doesNotMatch(
    scores + trend,
    /\bs[0-9a-f]{10}\b/,
    "no opaque ids leave the page, only aliases",
  );
  assert.equal(
    calls.some((c) => !c.path.startsWith("/api/")),
    false,
    "nothing is sent anywhere but the class API",
  );
});

test("a failed roster or summary shows an alert instead of an empty grid", async () => {
  const { root } = await open();
  const real = globalThis.fetch;
  globalThis.fetch = async () => new Response("{}", { status: 401 });
  await submit(root, { "st-fm-unit": UNIT });
  assert.ok(root.querySelector(".st-error[role=alert]"));
  assert.equal(root.querySelectorAll(".st-fm-row").length, 0);
  globalThis.fetch = real;
});

test("css: tap targets are at least 44px and the palette stays navy, teal, amber, coral, neutral", () => {
  const css = readFileSync(
    new URL("../bcpss-teachers/studio/views/formative/formative.css", import.meta.url),
    "utf8",
  );
  assert.match(css, /\.st-fm-tap, \.st-fm-step \{\s*min-width: 2\.75rem; min-height: 2\.75rem/);
  assert.doesNotMatch(
    css,
    /purple|violet|indigo|lavender|#[0-9a-f]{3,8}\b/i,
    "colour comes from design tokens only",
  );
});

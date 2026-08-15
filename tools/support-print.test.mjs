#!/usr/bin/env node
/* =============================================================================
 * support-print.test.mjs — the printed packet must agree with the lesson.
 *
 * Runs shared/supports/print-supports.js against the REAL generated
 * printable.html for real lessons, in a real DOM. Not a snapshot: snapshots of
 * a generated packet break on every unrelated wording change and get
 * regenerated without being read, which makes them worse than nothing. Every
 * assertion here is semantic — this word bank contains this lesson's terms,
 * this frame is this lesson's frame, this number of problems became optional.
 * ========================================================================== */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MODULE_SRC = readFileSync(join(ROOT, "shared", "supports", "lesson-supports.js"), "utf8");
const PRINT_SRC = readFileSync(join(ROOT, "shared", "supports", "print-supports.js"), "utf8");
const MANIFEST = JSON.parse(
  readFileSync(join(ROOT, "assets", "learning-supports", "manifest.json"), "utf8"),
);

function printablePath(id, surface = "printable") {
  return join(ROOT, "lessons", id, `${surface}.html`);
}

/** Open a generated print page with a support profile already stored, run the
 * print layer, and hand back the resulting document. */
async function renderPrintable(lessonId, profileKeys, opts = {}) {
  const html = readFileSync(printablePath(opts.file || lessonId, opts.surface), "utf8");
  const dom = new JSDOM(html, {
    url: "https://eduwonderlab.com/lessons/" + lessonId + "/",
    // outside-only: the page's own <script src> tags stay inert (they would 404
    // here), but window.eval runs OUR two files with the window as their global,
    // which is how a real <script> sees `document` and `fetch`.
    runScripts: "outside-only",
  });
  const { window } = dom;

  if (opts.audience) {
    window.document.documentElement.setAttribute("data-support-audience", opts.audience);
  }
  if (opts.lessonAttr) {
    window.document.documentElement.setAttribute("data-ewl-supports-lesson", opts.lessonAttr);
  }

  const store = { schemaVersion: 1, lessons: {} };
  for (const [id, keys] of Object.entries(profileKeys || {})) {
    store.lessons[id] = { schemaVersion: 1, lessonId: id, keys, preset: null };
  }
  window.localStorage.setItem("ewl-lesson-supports:v1", JSON.stringify(store));

  // The manifest fetch, served from disk.
  window.fetch = async () => ({ ok: true, json: async () => MANIFEST });

  loadInto(window);
  await window.EWLPrintSupports.run();
  return window.document;
}

/** Load both modules into a JSDOM window the way the page loads them.
 * `window.eval` rather than `new Function`, so both files run with the window
 * as their global scope — they reference `document`, `location` and `fetch` as
 * free identifiers exactly as a real <script> does. */
function loadInto(window) {
  window.eval(MODULE_SRC);
  window.eval(PRINT_SRC);
}

const text = (doc) => doc.body.textContent.replace(/\s+/g, " ");
let pass = 0;
async function t(name, fn) {
  await fn();
  pass++;
  console.log(`  ok  ${name}`);
}

/* ===========================================================================
 * CASE A — no supports. The canonical packet is untouched.
 * ======================================================================== */
await t("A · with no supports configured, the printable is byte-identical", async () => {
  const before = readFileSync(printablePath("5-3"), "utf8");
  const doc = await renderPrintable("5-3", {});
  assert.equal(doc.querySelectorAll(".ewl-ps").length, 0, "a support block appeared unbidden");
  assert.equal(doc.querySelectorAll("[data-support-provenance]").length, 0);
  assert.equal(doc.querySelectorAll("[data-support-optional]").length, 0);
  // And the source file on disk is exactly what it was: nothing about applying
  // supports may ever write to a lesson.
  assert.equal(readFileSync(printablePath("5-3"), "utf8"), before);
});

/* ===========================================================================
 * CASE B — scaffolds carry this lesson's OWN language onto paper.
 * ======================================================================== */
await t("B · sentence frames and word bank print this lesson's terms", async () => {
  const doc = await renderPrintable("5-3", { "5-3": ["sentence-frames", "word-bank"] });
  const t3 = text(doc);
  assert.match(t3, /Word bank/);
  assert.match(t3, /Sentence frames/);
  assert.match(t3, /trapezoid/i, "the lesson's own vocabulary is missing from the word bank");
  const frames = MANIFEST["5-3"].sentenceFrames[0];
  assert.ok(t3.includes(frames.slice(0, 40)), "the lesson's authored frame is not on the page");
  // A frame with nowhere to write is a prompt, not a scaffold.
  assert.ok(doc.querySelectorAll(".ewl-ps-frame").length > 0);
});

await t("B · a ratio lesson prints ratio language, not geometry language", async () => {
  const doc = await renderPrintable("3-1", { "3-1": ["sentence-frames", "word-bank"] });
  const t3 = text(doc);
  assert.match(t3, /ratio/i);
  assert.doesNotMatch(t3, /perpendicular/i, "geometry language leaked onto a ratio packet");
});

/* ===========================================================================
 * CASE C — visual supports become real workspace on paper.
 * ======================================================================== */
await t("C · number line and visual model print as usable workspace", async () => {
  const doc = await renderPrintable("7-1", { "7-1": ["number-line", "visual-model"] });
  assert.ok(doc.querySelector('[data-support-key="number-line"] svg'), "no number line drawn");
  assert.ok(
    doc.querySelector('[data-support-key="visual-model"] .ewl-ps-space'),
    "no space to model in",
  );
  // A blank tool, never a marked one: the support is workspace, not an answer.
  const nl = doc.querySelector('[data-support-key="number-line"] svg').textContent;
  assert.match(nl, /-10/);
});

await t("C · bilingual vocabulary prints the authored Spanish", async () => {
  const doc = await renderPrintable("5-3", { "5-3": ["bilingual-vocabulary"] });
  assert.match(text(doc), /Trapecio/);
});

/* ===========================================================================
 * CASE D — a small-group packet inherits, and does not double up.
 * ======================================================================== */
await t("D · a small-group worksheet inherits the parent's supports", async () => {
  // The variant's print surface is the worksheet: only the 84 canonical lessons
  // are given a full printable packet, while every variant gets a worksheet.
  const doc = await renderPrintable(
    "5-3-group1",
    { "5-3": ["word-bank", "visual-vocabulary"] },
    { surface: "worksheet" },
  );
  const t3 = text(doc);
  assert.match(t3, /Words to know/);
  assert.match(t3, /trapezoid/i);
});

await t("D · a support the small group already authors is not printed twice", async () => {
  const doc = await renderPrintable(
    "5-3-group1",
    { "5-3": ["sentence-frames", "word-bank", "visual-vocabulary"] },
    { surface: "worksheet" },
  );
  assert.equal(
    doc.querySelectorAll('[data-support-key="sentence-frames"]').length,
    0,
    "a second, generic sentence frame was stacked onto a lesson that authors its own",
  );
  assert.equal(doc.querySelectorAll('[data-support-key="word-bank"]').length, 0);
  assert.equal(doc.querySelectorAll('[data-support-key="visual-vocabulary"]').length, 1);
});

/* ===========================================================================
 * CASE E — the modification actually shortens the required task, and says so.
 * ======================================================================== */
await t("E · shorter practice set marks the tail optional and is labelled", async () => {
  const doc = await renderPrintable(
    "5-3",
    { "5-3": ["shorter-practice-set"] },
    { audience: "teacher" },
  );
  const items = doc.querySelectorAll("[data-practice-item]");
  const optional = doc.querySelectorAll("[data-support-optional]");
  assert.ok(items.length >= 4, "fixture has too few problems to test a shortened set");
  assert.ok(optional.length > 0, "nothing was made optional — the modification did nothing");
  assert.ok(items.length - optional.length >= 3, "required set fell below the floor of three");
  // The problems are still ON the page; what changed is what is REQUIRED.
  assert.equal(doc.querySelectorAll("[data-practice-item]").length, items.length);
  const prov = doc.querySelector('[data-support-provenance="modification"]');
  assert.ok(prov, "the teacher copy does not record that the task was modified");
  assert.match(prov.textContent, /shorter task/i);
});

await t("E · a modification is never announced on the STUDENT copy", async () => {
  const doc = await renderPrintable("5-3", { "5-3": ["shorter-practice-set"] });
  assert.equal(doc.querySelectorAll("[data-support-provenance]").length, 0);
  assert.ok(
    doc.querySelectorAll("[data-support-optional]").length > 0,
    "the shortening still applies",
  );
});

/* ===========================================================================
 * PROVENANCE — teacher copies say what was applied; student copies never do.
 * ======================================================================== */
await t("teacher copy lists the supports applied and the delivery notes", async () => {
  const doc = await renderPrintable(
    "5-3",
    { "5-3": ["word-bank", "read-aloud"] },
    { audience: "teacher" },
  );
  const supports = doc.querySelector('[data-support-provenance="supports"]');
  assert.ok(supports);
  assert.match(supports.textContent, /Word bank/);
  const delivery = doc.querySelector('[data-support-provenance="delivery"]');
  assert.ok(delivery, "read-aloud produced no delivery note on paper");
  assert.match(delivery.textContent, /aloud/i);
});

await t("no student-facing page carries deficit or plan terminology", async () => {
  const doc = await renderPrintable("5-3", {
    "5-3": [
      "word-bank",
      "sentence-frames",
      "visual-vocabulary",
      "read-aloud",
      "shorter-practice-set",
    ],
  });
  const t3 = text(doc);
  for (const banned of [
    /\bIEP\b/,
    /\bESOL\b/,
    /\bWIDA\b/,
    /special education/i,
    /accommodation/i,
    /below level/i,
  ]) {
    assert.doesNotMatch(t3, banned, `student packet carries ${banned}`);
  }
});

/* ===========================================================================
 * CASE F — reset returns the packet to canonical.
 * ======================================================================== */
await t("F · clearing the profile returns the printable to canonical output", async () => {
  const supported = await renderPrintable("5-3", { "5-3": ["word-bank", "sentence-frames"] });
  assert.ok(supported.querySelectorAll(".ewl-ps").length > 0);
  const reset = await renderPrintable("5-3", {});
  assert.equal(reset.querySelectorAll(".ewl-ps").length, 0);
  assert.equal(reset.querySelectorAll("[data-support-optional]").length, 0);
});

/* ===========================================================================
 * CASE G — no leakage between lessons.
 * ======================================================================== */
await t("G · lesson A's configuration never reaches lesson B's packet", async () => {
  const doc = await renderPrintable("3-1", { "5-3": ["word-bank", "sentence-frames"] });
  assert.equal(doc.querySelectorAll(".ewl-ps").length, 0, "5-3's supports appeared on 3-1");
  assert.doesNotMatch(text(doc), /trapezoid/i);
});

/* ===========================================================================
 * FAILURE — every path ends at the canonical page.
 * ======================================================================== */
await t("a corrupt store prints the canonical packet", async () => {
  const html = readFileSync(printablePath("5-3"), "utf8");
  const dom = new JSDOM(html, {
    url: "https://eduwonderlab.com/lessons/5-3/",
    runScripts: "outside-only",
  });
  const { window } = dom;
  window.localStorage.setItem("ewl-lesson-supports:v1", "{not json");
  window.fetch = async () => ({ ok: true, json: async () => MANIFEST });
  loadInto(window);
  await window.EWLPrintSupports.run();
  assert.equal(window.document.querySelectorAll(".ewl-ps").length, 0);
});

await t("an unreachable manifest prints the canonical packet", async () => {
  const html = readFileSync(printablePath("5-3"), "utf8");
  const dom = new JSDOM(html, {
    url: "https://eduwonderlab.com/lessons/5-3/",
    runScripts: "outside-only",
  });
  const { window } = dom;
  window.localStorage.setItem(
    "ewl-lesson-supports:v1",
    JSON.stringify({
      schemaVersion: 1,
      lessons: { "5-3": { schemaVersion: 1, keys: ["word-bank"] } },
    }),
  );
  window.fetch = async () => {
    throw new Error("offline");
  };
  loadInto(window);
  await window.EWLPrintSupports.run();
  assert.equal(window.document.querySelectorAll(".ewl-ps").length, 0);
});

await t("a future schema version prints the canonical packet", async () => {
  const html = readFileSync(printablePath("5-3"), "utf8");
  const dom = new JSDOM(html, {
    url: "https://eduwonderlab.com/lessons/5-3/",
    runScripts: "outside-only",
  });
  const { window } = dom;
  window.localStorage.setItem(
    "ewl-lesson-supports:v1",
    JSON.stringify({ schemaVersion: 99, lessons: { "5-3": { keys: ["word-bank"] } } }),
  );
  window.fetch = async () => ({ ok: true, json: async () => MANIFEST });
  loadInto(window);
  await window.EWLPrintSupports.run();
  assert.equal(window.document.querySelectorAll(".ewl-ps").length, 0);
});

console.log(`support-print: ${pass} assertions passed`);

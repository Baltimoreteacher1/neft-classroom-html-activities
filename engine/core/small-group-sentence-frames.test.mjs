#!/usr/bin/env node
/**
 * small-group-sentence-frames.test.mjs — sentence frames reach the student, in
 * both languages, and cannot silently stop reaching them again.
 *
 * THE DEFECT THIS PINS
 *
 * 209 `sentenceStems` blocks are authored across 44 lesson configs. Nothing in
 * engine/, assets/ or shared/ read the field, so not one of them was ever shown
 * to a student — in English or in Spanish. The content-preservation baseline
 * fingerprints them, which made it worse: they were protected content that no
 * one could see. A struggling writer got an empty box while the scaffold written
 * for that exact task sat unused in the config.
 *
 * It was found from the other end. `tools/esol-lane-coverage.test.mjs` failed on
 * a newly authored `sentenceStemsEs`, reporting "authored Spanish that no
 * renderer can display". Chasing that down showed the English half had the same
 * problem, and that the fleet already had a bilingual stem convention —
 * `{ en, es }`, used by `talk.stems` — so `sentenceStemsEs` was a third
 * localization architecture and the right shape was the existing one.
 *
 * WHAT MUST STAY TRUE
 *   - a stem authored as a plain string renders (English-only lessons keep working)
 *   - a stem authored as { en, es } renders English in the English lane
 *   - the same stem renders English AND Spanish, with lang="es", in the Spanish lane
 *   - the frames are semantically tied to the textarea (aria-describedby)
 *   - an item with no stems renders no frames block and no dangling aria reference
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><body></body>", { url: "https://eduwonderlab.com/" });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.localStorage = dom.window.localStorage;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.speechSynthesis = undefined;

const { framesRow, frameHtml } = await import("./small-group-ui.js");

const setLang = (lang) => dom.window.localStorage.setItem("nt-lang", lang);

let passed = 0;
const failures = [];
const check = (name, fn) => {
  try {
    fn();
    passed++;
  } catch (e) {
    failures.push(`${name}: ${e.message}`);
  }
};

// --- plain strings: the shape most of the fleet authors ----------------------
check("a plain-string stem renders", () => {
  setLang("en");
  const row = framesRow(["I used math when I ___ ."]);
  assert.ok(row, "no frames row produced");
  assert.equal(row.querySelectorAll(".sg-frame").length, 1);
  assert.match(row.textContent, /I used math when I ___ \./);
});

check("plain-string stems are unaffected by the Spanish lane", () => {
  setLang("es");
  const row = framesRow(["I used math when I ___ ."]);
  assert.match(row.textContent, /I used math when I ___ \./);
  assert.equal(row.querySelectorAll('[lang="es"]').length, 0, "invented Spanish that was not authored");
});

// --- { en, es }: the fleet's existing bilingual shape ------------------------
check("an { en, es } stem shows English only in the English lane", () => {
  setLang("en");
  const row = framesRow([{ en: "The ratios are equivalent because ___ .", es: "Las razones son equivalentes porque ___ ." }]);
  assert.match(row.textContent, /The ratios are equivalent because/);
  assert.doesNotMatch(row.textContent, /Las razones/, "showed Spanish to an English-lane student");
});

check("an { en, es } stem shows both, tagged lang=es, in the Spanish lane", () => {
  setLang("es");
  const row = framesRow([{ en: "The ratios are equivalent because ___ .", es: "Las razones son equivalentes porque ___ ." }]);
  assert.match(row.textContent, /The ratios are equivalent because/);
  assert.match(row.textContent, /Las razones son equivalentes porque/);
  const es = row.querySelector('[lang="es"]');
  assert.ok(es, 'Spanish is not marked lang="es" — screen readers and TTS keep the English voice');
  assert.match(es.textContent, /Las razones/);
});

check("a stem with no Spanish falls back to English, never to a blank", () => {
  setLang("es");
  const row = framesRow([{ en: "First I ___ , then I ___ ." }]);
  assert.match(row.textContent, /First I ___ , then I ___ \./);
  assert.equal(row.querySelectorAll('[lang="es"]').length, 0);
});

// --- degenerate input --------------------------------------------------------
check("no stems produces no row at all", () => {
  setLang("en");
  assert.equal(framesRow([]), null);
  assert.equal(framesRow(undefined), null);
  assert.equal(framesRow(null), null);
});

check("empty and malformed stems are dropped, not rendered blank", () => {
  setLang("en");
  assert.equal(framesRow([""]), null, "an empty string produced a frame chip");
  assert.equal(framesRow([{ es: "solo español" }]), null, "rendered a stem with no English");
  const row = framesRow(["real one", "", null]);
  assert.equal(row.querySelectorAll(".sg-frame").length, 1);
});

check("stem text is escaped, never injected as markup", () => {
  setLang("en");
  const row = framesRow(['I chose <b>4</b> & ___ .']);
  assert.equal(row.querySelectorAll("b").length, 0, "authored markup was executed");
  assert.match(row.textContent, /I chose <b>4<\/b> & ___ \./);
});

// --- the practice card wires the frames to the response box ------------------
check("the open-response card labels the frames and ties them to the textarea", () => {
  const src = readFileSync(new URL("./small-group-practice.js", import.meta.url), "utf8");
  assert.match(
    src,
    /framesRow\(item\.sentenceStems, item\.sentenceStemsEs\)/,
    "the practice renderer stopped reading sentenceStems / its Spanish parallel",
  );
  assert.match(src, /aria-describedby/, "the frames are no longer announced with the response box");
});

// --- one implementation, not two --------------------------------------------
check("engagement and practice share one frame renderer", () => {
  const engagement = readFileSync(new URL("./small-group-engagement.js", import.meta.url), "utf8");
  assert.match(engagement, /framesRow/, "engagement re-inlined its own frame markup");
  assert.doesNotMatch(
    engagement,
    /typeof stem === "object" && stem\.es/,
    "the { en, es } shape is being decoded in two places again",
  );
});

console.log("small-group sentence frames");
console.log(`  checks passed: ${passed}`);
if (failures.length) {
  console.log(`\nFAIL — ${failures.length} problem(s):`);
  for (const f of failures) console.log("  ✗ " + f);
  process.exit(1);
}
console.log("RESULT: PASS ✅");

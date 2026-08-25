// lesson-renderer.import.test.mjs — the engine's core renderer is importable
// and its pure logic is unit-testable OUTSIDE Vite.
//
// Until 2026-08-20 `engine/core/lesson-renderer.js` could not be imported from
// `npm test` at all: its import graph reaches app.js, whose `@engine/styles`
// CSS imports only Vite could resolve. That meant ZERO unit coverage on the
// core renderer — every renderer bug was catchable only end-to-end (see the
// renderLearnItExtras dead-code and blank-renderer incidents). The hooks in
// tools/lib/engine-hooks.mjs close the gap; this test pins the door open.
//
// If this test starts failing with ERR_MODULE_NOT_FOUND, someone added an
// import the hooks cannot resolve — extend the hooks, do not delete the test.
import assert from "node:assert/strict";
import "../../tools/lib/register-engine-hooks.mjs";

// A minimal DOM before the engine loads: several engine modules feature-detect
// `document` at import time; jsdom makes that detection honest instead of
// silently skipped.
const { JSDOM } = await import("jsdom");
const dom = new JSDOM("<!doctype html><html><body><div id=\"app\"></div></body></html>", {
  url: "https://example.test/lessons/1-1/",
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.location = dom.window.location;
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.CustomEvent = dom.window.CustomEvent;
globalThis.MutationObserver = dom.window.MutationObserver;
globalThis.getComputedStyle = dom.window.getComputedStyle;
globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 0);
globalThis.localStorage = dom.window.localStorage;
globalThis.sessionStorage = dom.window.sessionStorage;

const renderer = await import("./lesson-renderer.js");

// 1. The renderer module loads and exports its public surface.
for (const fn of [
  "bootLesson",
  "renderComponent",
  "resolveContentObjective",
  "resolveLanguageObjective",
  "linkifyObjectiveTerms",
]) {
  assert.equal(typeof renderer[fn], "function", `${fn} must be exported`);
}

// 2. Pure logic is actually exercisable: objective resolution reads a config
//    without any DOM rendering.
const objective = renderer.resolveContentObjective({
  contentObjective: "I can test the renderer's pure logic.",
});
assert.equal(objective, "I can test the renderer's pure logic.");

// 3. And the real 1-1 config resolves a non-empty objective — the test runs
//    against production data, not a toy fixture.
const { readFileSync } = await import("node:fs");
const config = JSON.parse(readFileSync(new URL("../../lessons/1-1/config.json", import.meta.url), "utf8"));
assert.ok(renderer.resolveContentObjective(config).length > 10, "1-1 contentObjective resolves");

console.log("lesson-renderer imports cleanly outside Vite; pure logic unit-testable.");

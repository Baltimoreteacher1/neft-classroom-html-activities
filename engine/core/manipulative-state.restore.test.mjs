// A saved manipulative must actually come back.
//
// `restoreState` used to return `true` whenever the snapshot merely HAD fields,
// without checking that any of them landed on a control. Manipulatives mount
// through a dynamic import, so on the caller's first attempt the host is still
// empty: the loop matched nothing, `true` said "restored", and the retry ladder
// that exists precisely for the async mount was never scheduled. The student's
// factor tree / long division / step work was read out of storage and dropped.
//
// So the contract under test is narrow and behavioural: restoring into an empty
// host must report FAILURE, and restoring once the controls exist must report
// success and write the values.

import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><body></body>");
globalThis.document = dom.window.document;
globalThis.window = dom.window;
globalThis.Event = dom.window.Event;

const { captureState, restoreState } = await import("./manipulative-state.js");

const hostWith = (html) => {
  const host = document.createElement("div");
  host.className = "interactive-visual";
  host.dataset.visual = "factor-tree";
  host.innerHTML = html;
  document.body.append(host);
  return host;
};

test("restoring into a host that has not mounted yet reports failure", () => {
  const empty = hostWith(""); // the dynamic import has not resolved
  const snapshot = { fields: { f0: "97531", f1: "" } };
  assert.equal(
    restoreState(empty, snapshot),
    false,
    "an empty host applied nothing, so it must not claim success",
  );
});

test("restoring once the controls exist writes the values and reports success", () => {
  const mounted = hostWith('<input type="text"><input type="text">');
  const snapshot = { fields: { f0: "97531", f1: "42" } };
  assert.equal(restoreState(mounted, snapshot), true);
  const [a, b] = mounted.querySelectorAll("input");
  assert.equal(a.value, "97531");
  assert.equal(b.value, "42");
});

test("a snapshot whose keys match nothing on the host is not a success", () => {
  const mounted = hostWith('<input name="somethingElse" type="text">');
  assert.equal(restoreState(mounted, { fields: { f0: "97531" } }), false);
});

test("capture then restore round-trips through a remount", () => {
  const first = hostWith('<input type="text"><input type="text">');
  const inputs = first.querySelectorAll("input");
  inputs[0].value = "12";
  inputs[1].value = "7";
  const snapshot = captureState(first);
  assert.ok(snapshot?.fields, "something was captured");

  // The lesson re-renders: same kind, fresh DOM, no values.
  const remounted = hostWith('<input type="text"><input type="text">');
  assert.equal(restoreState(remounted, snapshot), true);
  const back = remounted.querySelectorAll("input");
  assert.equal(back[0].value, "12");
  assert.equal(back[1].value, "7");
});

test("restoring fires input/change so the component recomputes", () => {
  const mounted = hostWith('<input type="text">');
  const seen = [];
  mounted.querySelector("input").addEventListener("input", () => seen.push("input"));
  mounted.querySelector("input").addEventListener("change", () => seen.push("change"));
  restoreState(mounted, { fields: { f0: "5" } });
  assert.deepEqual(seen, ["input", "change"]);
});

test("a published-state-only snapshot still counts as restored", () => {
  const mounted = hostWith("<span>canvas-ish</span>");
  assert.equal(restoreState(mounted, { fields: { __published: '{"angle":30}' } }), true);
  assert.equal(mounted.getAttribute("data-iv-state"), '{"angle":30}');
});

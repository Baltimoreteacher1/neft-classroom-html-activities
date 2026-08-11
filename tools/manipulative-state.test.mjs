#!/usr/bin/env node
/* ==========================================================================
 * manipulative-state.test.mjs
 *
 * The failure this guards is the quiet one: persistence that appears to work
 * (state is written, no errors) but restores into the wrong manipulative,
 * because the key was derived from DOM order and the phase re-rendered with an
 * extra visual in front. A student would find their tape diagram's numbers
 * inside a number line. Nothing throws; the lesson just lies.
 *
 * It also pins the re-entrancy guard. restoreState() dispatches real input
 * events so components recompute — if those events were saved back as fresh
 * edits, every restore would rewrite the snapshot it just read, and any later
 * change to the debounce would decide whether that loop terminates.
 * ========================================================================== */

import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
  url: "https://eduwonderlab.com/lessons/6-13/",
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Event = dom.window.Event;
globalThis.HTMLElement = dom.window.HTMLElement;

const { attachManipulativePersistence, captureState, manipulativeKey, restoreState } = await import(
  "../engine/core/manipulative-state.js"
);

let checks = 0;

/** Minimal stand-in for the lesson state store's response API. */
function makeState() {
  const responses = new Map();
  return {
    saveResponse: (phaseId, key, value) => responses.set(`${phaseId}_${key}`, value),
    getResponse: (phaseId, key) => responses.get(`${phaseId}_${key}`) ?? null,
    _dump: () => Object.fromEntries(responses),
  };
}

function makeHost(kind, html) {
  const host = dom.window.document.createElement("div");
  host.className = "interactive-visual";
  host.dataset.visual = kind;
  host.innerHTML = html;
  return host;
}

// ── Keying ─────────────────────────────────────────────────────────────────
{
  const a = makeHost("tape-diagram", "");
  const b = makeHost("number-line", "");
  checks += 1;
  assert.equal(manipulativeKey(a, 0), "manip_tape-diagram_0", "the key names the kind");
  checks += 1;
  assert.notEqual(
    manipulativeKey(a, 0),
    manipulativeKey(b, 0),
    "two different kinds at the same position never share a key",
  );
  checks += 1;
  assert.notEqual(
    manipulativeKey(a, 0),
    manipulativeKey(a, 1),
    "two of the same kind keep separate work",
  );
}

// ── Capture / restore round trip ───────────────────────────────────────────
{
  const host = makeHost(
    "ratio-table-builder",
    `<input name="a" value="3" /><input name="b" value="12" />
     <select name="op"><option value="x">x</option><option value="y">y</option></select>
     <input type="checkbox" name="lock" />`,
  );
  dom.window.document.getElementById("root").append(host);

  host.querySelector('[name="a"]').value = "7";
  host.querySelector('[name="op"]').value = "y";
  host.querySelector('[name="lock"]').checked = true;

  const snap = captureState(host);
  checks += 1;
  assert.deepEqual(
    snap.fields,
    { a: "7", b: "12", op: "y", lock: "1" },
    "every control is captured by name",
  );

  // Reset, then restore.
  host.querySelector('[name="a"]').value = "";
  host.querySelector('[name="op"]').value = "x";
  host.querySelector('[name="lock"]').checked = false;

  let inputEvents = 0;
  host.addEventListener("input", () => {
    inputEvents += 1;
  });

  checks += 1;
  assert.equal(restoreState(host, snap), true, "restore reports success");
  checks += 1;
  assert.equal(host.querySelector('[name="a"]').value, "7", "text value restored");
  checks += 1;
  assert.equal(host.querySelector('[name="op"]').value, "y", "select restored");
  checks += 1;
  assert.equal(host.querySelector('[name="lock"]').checked, true, "checkbox restored");
  checks += 1;
  assert.ok(
    inputEvents >= 4,
    "restore dispatches real input events so components recompute their display",
  );
  checks += 1;
  assert.equal(
    host.dataset.ivRestoring,
    undefined,
    "the re-entrancy flag is cleared after restoring",
  );
}

// ── The handle contract wins when a component publishes one ────────────────
{
  const host = makeHost("solid-3d", '<input name="a" value="1" />');
  host.__ivHandle = {
    getState: () => ({ angle: 42 }),
    setState(v) {
      host.dataset.applied = String(v.angle);
    },
  };
  const snap = captureState(host);
  checks += 1;
  assert.deepEqual(snap, { own: { angle: 42 } }, "a component's own state beats the DOM scan");
  checks += 1;
  assert.equal(restoreState(host, snap), true, "the handle path restores");
  checks += 1;
  assert.equal(host.dataset.applied, "42", "setState received the snapshot");

  // A throwing setState must not break the lesson.
  host.__ivHandle.setState = () => {
    throw new Error("boom");
  };
  checks += 1;
  assert.equal(restoreState(host, snap), false, "a component that throws on restore reports false");
}

// ── Nothing to capture stays null, not an empty save ───────────────────────
{
  const host = makeHost("dot-plot", "<svg></svg>");
  checks += 1;
  assert.equal(captureState(host), null, "a static figure with no controls saves nothing");
}

// ── Wiring: save on interaction, restore on remount, no feedback loop ───────
{
  const state = makeState();
  const root = dom.window.document.createElement("div");
  const host = makeHost("percent-builder", '<input name="pct" value="10" />');
  root.append(host);

  const wired = attachManipulativePersistence(root, { state, phaseId: 1 });
  checks += 1;
  assert.equal(wired, 1, "one host wired");
  checks += 1;
  assert.equal(
    attachManipulativePersistence(root, { state, phaseId: 1 }),
    0,
    "wiring is idempotent — a re-render does not double-bind",
  );

  host.querySelector('[name="pct"]').value = "35";
  host.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 600));

  checks += 1;
  assert.deepEqual(
    state.getResponse(1, "manip_percent-builder_0"),
    { fields: { pct: "35" } },
    "an edit is saved under the kind-scoped key",
  );

  // Re-render the phase: a NEW host of the same kind must pick the work back up.
  const root2 = dom.window.document.createElement("div");
  const host2 = makeHost("percent-builder", '<input name="pct" value="10" />');
  root2.append(host2);
  attachManipulativePersistence(root2, { state, phaseId: 1 });
  await new Promise((r) => setTimeout(r, 300));
  checks += 1;
  assert.equal(
    host2.querySelector('[name="pct"]').value,
    "35",
    "a re-rendered phase restores what the student built",
  );

  // The restore's synthetic events must not be recorded as new edits.
  const before = JSON.stringify(state._dump());
  await new Promise((r) => setTimeout(r, 600));
  checks += 1;
  assert.equal(
    JSON.stringify(state._dump()),
    before,
    "restoring does not write itself back — no save/restore loop",
  );
}

// ── Without a state store, nothing is wired at all ─────────────────────────
{
  const root = dom.window.document.createElement("div");
  root.append(makeHost("tape-diagram", '<input name="a" value="1" />'));
  checks += 1;
  assert.equal(
    attachManipulativePersistence(root, {}),
    0,
    "callers with no lesson state (tools mode, small groups, homework) are untouched",
  );
}

console.log(`manipulative persistence: ${checks} checks passed.`);

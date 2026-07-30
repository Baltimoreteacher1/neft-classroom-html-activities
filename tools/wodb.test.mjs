#!/usr/bin/env node
// Structural gate for the Which One Doesn't Belong library.
//
// A WODB set is only a WODB set if every quadrant is defensible. A set with
// three real reasons and one empty string still renders, still looks fine, and
// quietly teaches the opposite of what the routine is for: the student who
// picked the unreasoned quadrant is told, in effect, that they chose wrong.
// That failure is invisible in the browser, so it is asserted here.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const library = JSON.parse(readFileSync(resolve(ROOT, "data/wodb-sets.json"), "utf8"));
const standards = JSON.parse(readFileSync(resolve(ROOT, "data/ccss-standards.json"), "utf8"));

const sets = library.sets;
assert.ok(sets && typeof sets === "object", "wodb-sets.json must expose a `sets` object");

let checks = 0;
const ids = Object.keys(sets);
assert.ok(ids.length > 0, "the library is empty");

for (const id of ids) {
  const set = sets[id];

  checks += 1;
  assert.ok(standards.standards[id], `${id} is not a standard in data/ccss-standards.json`);

  checks += 1;
  assert.equal(set.items?.length, 4, `${id} must have exactly 4 items`);

  checks += 1;
  assert.equal(set.reasons?.length, 4, `${id} must have exactly 4 reasons — one per item`);

  for (let i = 0; i < 4; i++) {
    checks += 1;
    assert.ok(typeof set.items[i] === "string" && set.items[i].trim(), `${id} item ${i} is empty`);
    checks += 1;
    assert.ok(
      typeof set.reasons[i] === "string" && set.reasons[i].trim().length > 10,
      `${id} reason ${i} is empty or too short — every quadrant needs a real argument`,
    );
  }

  // Duplicated reasons mean two quadrants share an argument, which makes at
  // least one of them undefendable on its own terms.
  checks += 1;
  assert.equal(
    new Set(set.reasons.map((r) => r.trim().toLowerCase())).size,
    4,
    `${id} repeats a reason — each quadrant needs its own`,
  );

  checks += 1;
  assert.equal(new Set(set.items.map((v) => String(v).trim())).size, 4, `${id} repeats an item`);

  checks += 1;
  assert.ok(set.prompt && set.prompt.trim(), `${id} needs a prompt`);

  checks += 1;
  assert.ok(
    set.teacherNote && set.teacherNote.trim().length > 20,
    `${id} needs a facilitation note — the routine fails without a teacher move`,
  );
}

// Every standard actually taught should eventually have a set. This reports
// rather than fails, so adding a lesson for a new standard is not a red build.
const taught = new Set();
for (const file of readFileSync(resolve(ROOT, "docs/standards/scope-and-sequence.md"), "utf8")
  .split("\n")
  .flatMap((line) => line.match(/6\.(?:AT|NOS|GR|DS)\.\d+[a-z]?/g) || [])) {
  taught.add(file);
}
const missing = [...taught].filter((s) => !sets[s]).sort();
if (missing.length) {
  console.log(`wodb: ${missing.length} taught standard(s) have no set yet: ${missing.join(", ")}`);
}

// ── Rendered behaviour ─────────────────────────────────────────────────────
// The invariants below are the ones that make this a WODB rather than a quiz:
// nothing is markable, the published reasons stay hidden until the student has
// committed to their own, and the completion signal can only ever be `true`.

const { JSDOM } = await import("jsdom");
const dom = new JSDOM('<!doctype html><html lang="en"><body><div id="host"></div></body></html>', {
  url: "https://eduwonderlab.com/lessons/1-1/",
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;

const { renderWhichOneDoesntBelong } = await import(
  "../engine/components/which-one-doesnt-belong.js"
);

const host = dom.window.document.getElementById("host");
const sample = sets["6.NOS.8"];
const completions = [];
const api = renderWhichOneDoesntBelong(host, {
  prompt: sample.prompt,
  items: sample.items,
  reasons: sample.reasons,
  onComplete: (ok) => completions.push(ok),
});

checks += 1;
assert.equal(host.querySelectorAll(".wodb-cell").length, 4, "four quadrants render");

checks += 1;
assert.ok(host.querySelector(".wodb-because").hidden, "the reason box is hidden before a pick");

checks += 1;
assert.ok(host.querySelector(".wodb-reveal").hidden, "published reasons are hidden before a pick");

// Pick quadrant C.
host.querySelectorAll(".wodb-cell")[2].dispatchEvent(new dom.window.Event("click"));

checks += 1;
assert.equal(api.getPicked(), 2, "the pick is recorded");

checks += 1;
assert.equal(host.querySelector(".wodb-because").hidden, false, "picking opens the reason box");

checks += 1;
assert.ok(
  host.querySelector(".wodb-reveal").hidden,
  "picking alone must NOT reveal the other reasons — the student writes first",
);

checks += 1;
assert.equal(completions.length, 0, "no completion is reported before the reveal");

// Write a reason, then reveal.
const textarea = host.querySelector(".wodb-because textarea");
textarea.value = "It is the only one that is negative.";
host.querySelector(".wodb-because .btn").dispatchEvent(new dom.window.Event("click"));

checks += 1;
assert.equal(host.querySelector(".wodb-reveal").hidden, false, "reveal shows the reasons");

checks += 1;
assert.equal(
  host.querySelectorAll(".wodb-reveal-list li").length,
  4,
  "all four reasons are published, not just the chosen one",
);

checks += 1;
assert.equal(
  host.querySelectorAll(".wodb-reveal-list li.is-mine").length,
  1,
  "the student's own quadrant is marked, without being marked right or wrong",
);

checks += 1;
assert.ok(
  host.querySelector(".wodb-mine").textContent.includes("only one that is negative"),
  "the student's own reason survives the reveal",
);

checks += 1;
assert.deepEqual(completions, [true], "completion is reported exactly once, and always as true");

checks += 1;
assert.equal(
  host.querySelector(".wodb-reveal").innerHTML.includes("is-correct"),
  false,
  "no quadrant is ever marked correct",
);

// A malformed set must not blank the phase it sits in.
const host2 = dom.window.document.createElement("div");
checks += 1;
assert.equal(
  renderWhichOneDoesntBelong(host2, { prompt: "Broken", items: ["only", "two"] }),
  null,
  "a set without four items returns null instead of throwing",
);
checks += 1;
assert.ok(host2.textContent.includes("Broken"), "the malformed case still renders something");

console.log(`wodb library: ${ids.length} sets, ${checks} checks passed.`);

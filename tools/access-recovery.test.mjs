import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import {
  exportCode,
  importCode,
  importProgressData,
  loadRecord,
  PREFIX,
  saveRecord,
} from "../access-practice-lab/src/store.js";
import { registerSaveResume } from "../access-practice-lab/src/sync.js";

const dom = new JSDOM('<p id="labLive"></p>', { url: "https://lab.test/" });
for (const key of ["window", "document", "localStorage"]) globalThis[key] = dom.window[key];
const key = `${PREFIX}:Writing:A`;
const backup = (data) =>
  `ACCESS1.${Buffer.from(JSON.stringify({ v: 1, data })).toString("base64")}`;

test("old backups cannot replace current drafts or restore stale completion; missing activities return intact", () => {
  localStorage.clear();
  saveRecord("6-8", "Writing", "A", {
    notes: { x: "My current revision" },
    complete: [],
    results: { x: { evidence: "draft", meaningful: false } },
    drafts: { x: { first: "First words" } },
    reflections: { x: "Added evidence" },
  });
  importCode(
    backup({
      [key]: JSON.stringify({
        notes: { x: "Old draft", y: "Saved on another device" },
        complete: ["x", "y"],
        results: { x: { evidence: "writing" }, y: { evidence: "writing" } },
        selected: { x: "legacy-answer" },
        selfChecks: { x: { clear: true } },
      }),
    }),
  );
  const record = loadRecord("6-8", "Writing", "A");
  assert.equal(record.notes.x, "My current revision");
  assert.equal(record.notes.y, "Saved on another device");
  assert.deepEqual(record.complete, ["y"]);
  assert.equal(record.results.x.evidence, "draft");
  assert.equal(record.drafts.x.first, "First words");
  assert.equal(record.reflections.x, "Added evidence");
  assert.equal(record.selected.x, undefined);
  assert.equal(record.selfChecks.x, undefined);
  const code = exportCode();
  importCode(code);
  assert.equal(exportCode(), code);
});

test("fresh device restores Unicode writing, both grade bands and legacy answers", () => {
  localStorage.clear();
  const data = {
    [key]: JSON.stringify({ selected: { x: 0 }, notes: { x: "café 🌱" }, complete: ["x"] }),
    [`${PREFIX}:g3-5:Reading:B`]: JSON.stringify({ answers: { y: ["a", "b"] } }),
  };
  assert.equal(importCode(backup(data)), 2);
  assert.equal(loadRecord("6-8", "Writing", "A").notes.x, "café 🌱");
  assert.deepEqual(loadRecord("3-5", "Reading", "B").answers.y, ["a", "b"]);
});

test("existing settings and running test attempts survive imports", () => {
  localStorage.clear();
  const data = {
    [`${PREFIX}:prefs`]: '{"band":"3-5"}',
    [`${PREFIX}:test:demo`]: '{"remaining":30}',
    [`${PREFIX}:studentName`]: "Demo",
  };
  importProgressData(data);
  importProgressData({
    [`${PREFIX}:prefs`]: '{"band":"6-8"}',
    [`${PREFIX}:test:demo`]: '{"remaining":900}',
    [`${PREFIX}:studentName`]: "Other",
  });
  for (const [k, v] of Object.entries(data)) assert.equal(localStorage.getItem(k), v);
});

test("malformed backups are rejected before any writes and unrelated keys are ignored", () => {
  localStorage.clear();
  assert.throws(
    () =>
      importCode(
        backup({ [`${PREFIX}:studentName`]: "Should not load", [key]: '{"complete":"wrong"}' }),
      ),
    /invalid activity/,
  );
  assert.equal(localStorage.length, 0);
  for (const data of [null, [], { [key]: "null" }, { [key]: '{"answers":[]}' }])
    assert.throws(() => importCode(backup(data)));
  assert.throws(() => importCode("invalid"), /progress code/);
  assert.equal(importProgressData({ foreign: "untouched", [`${PREFIX}:unexpected`]: "bad" }), 0);
  assert.equal(localStorage.length, 0);
});

test("site Save/Resume uses the same conflict policy", () => {
  localStorage.clear();
  saveRecord("6-8", "Writing", "A", { notes: { x: "Keep this" } });
  let restore,
    refreshed = 0;
  window.NeftSaveResume = {
    registerStateProvider() {},
    registerStateRestorer(fn) {
      restore = fn;
    },
  };
  registerSaveResume(() => refreshed++);
  restore({
    accessLab: 1,
    data: { [key]: JSON.stringify({ notes: { x: "Old", y: "Add this" } }) },
  });
  assert.equal(loadRecord("6-8", "Writing", "A").notes.x, "Keep this");
  assert.equal(loadRecord("6-8", "Writing", "A").notes.y, "Add this");
  assert.equal(refreshed, 1);
  restore({ accessLab: 1, data: null });
  assert.equal(refreshed, 1);
});

test("loading legacy records drops contradicted stamps and keeps valid older completion", () => {
  localStorage.clear();
  localStorage.setItem(
    key,
    JSON.stringify({
      complete: ["wrong", "draft", "legacy"],
      results: { wrong: { ok: false }, draft: { meaningful: false } },
    }),
  );
  assert.deepEqual(loadRecord("6-8", "Writing", "A").complete, ["legacy"]);
});

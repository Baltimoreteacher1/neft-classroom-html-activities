// Jump in sets (src/quick-start.js) and the Your task steps (src/task-steps.js): pure rules, checked on real content.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { jumpLevel, pickSet, SET_SIZE, setHref } from "../access-practice-lab/src/quick-start.js";
import { taskSteps } from "../access-practice-lab/src/task-steps.js";

const LAB = new URL("../access-practice-lab/", import.meta.url);
const index = JSON.parse(readFileSync(new URL("content/index.json", LAB), "utf8"));
const rowsFor = (band) => {
  const rows = [];
  for (const [domain, d] of Object.entries(index.bands[band].domains))
    for (const [level, L] of Object.entries(d.levels))
      for (const [id, title, type, skill, minutes] of L.activities)
        rows.push({ band, domain, level, id, title, type, skill, minutes });
  return rows;
};

test("a skill set is that skill only, unfinished work first, never a printable worksheet", () => {
  const rows = rowsFor("6-8").filter((r) => r.level === "B");
  const done = new Set(
    rows
      .filter((r) => r.domain === "Reading")
      .slice(0, 2)
      .map((r) => r.id),
  );
  const set = pickSet(rows, (r) => done.has(r.id), { domain: "Reading" });
  assert.equal(set.length, SET_SIZE);
  assert.ok(set.every((r) => r.domain === "Reading" && r.type !== "worksheet"));
  assert.ok(
    set.every((r) => !done.has(r.id)),
    "finished work waits until fresh work runs out",
  );
});

test("a mixed set takes turns across the four skills", () => {
  const rows = rowsFor("3-5").filter((r) => r.level === "A");
  const set = pickSet(rows, () => false);
  assert.deepEqual(
    new Set(set.slice(0, 4).map((r) => r.domain)),
    new Set(["Listening", "Reading", "Speaking", "Writing"]),
  );
});

test("when everything is finished, a set still offers practice again", () => {
  const rows = rowsFor("1").filter((r) => r.level === "A");
  assert.ok(pickSet(rows, () => true, { domain: "Listening" }).length > 0);
});

test("support choice: saved plan level wins when the band ships it; early bands start at A, others at B", () => {
  assert.equal(jumpLevel({ practicePlan: { level: "C" } }, "6-8", ["A", "B", "C"]), "C");
  assert.equal(jumpLevel({ practicePlan: { level: "C" } }, "K", ["A"]), "A");
  assert.equal(jumpLevel({}, "1", ["A", "B"]), "A");
  assert.equal(jumpLevel({}, "3-5", ["A", "B", "C"]), "B");
});

test("a set link is a plain playlist URL that works without script", () => {
  const url = new URL(
    setHref("6-8", [{ id: "a-1" }, { id: "b-2" }], "Quick practice · Reading"),
    "https://x.test",
  );
  assert.equal(url.pathname, "/access-practice-lab/play");
  assert.equal(url.searchParams.get("ids"), "a-1,b-2");
  assert.equal(url.searchParams.get("grades"), "6-8");
});

test("every activity gets 2-3 task steps, both languages, short for K–3", () => {
  let n = 0;
  for (const band of ["gK", "g1", "g2-3", "g3-5", "g6-8"]) {
    const contentBand = band.slice(1);
    for (const f of readdirSync(new URL(`content/${band}/`, LAB)).filter((x) =>
      x.endsWith(".json"),
    )) {
      const d = JSON.parse(readFileSync(new URL(`content/${band}/${f}`, LAB), "utf8"));
      for (const L of Object.values(d.levels || {}))
        for (const a of L.activities || []) {
          const steps = taskSteps(a, d.domain, contentBand);
          assert.ok(steps.length >= 2 && steps.length <= 3, a.id);
          for (const [en, es] of steps) {
            assert.ok(en && es && en !== es, `${a.id}: both languages`);
            if (["K", "1", "2-3"].includes(contentBand))
              assert.ok(en.split(/\s+/).length <= 6, `${a.id}: "${en}" is short for K–3`);
          }
          n++;
        }
    }
  }
  assert.ok(n > 800, `swept ${n} activities`);
});

test("a multi-select step names how many answers to choose", () => {
  const [, step] = taskSteps({ type: "multiSelect", answers: ["a", "c"] }, "Reading", "6-8");
  assert.match(step[0], /Choose 2 answers/);
});

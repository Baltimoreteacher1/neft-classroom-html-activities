#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  assignmentLink,
  KINDS,
  MAX_ITEMS,
  selectItems,
  validateSpec,
} from "../access-practice-lab/src/acc/adapt/assign.js";

const index = JSON.parse(
  readFileSync(new URL("../access-practice-lab/content/bank/index.json", import.meta.url), "utf8"),
);
const bank = index.sets.flatMap((s) =>
  s.items.map((i) => ({ ...i, setId: s.id, grade: s.grade, domain: s.domain })),
);
const base = { kind: "domain", grade: "3-5", domain: "Reading", count: 8 };

test("every assignment type validates only with what it needs", () => {
  for (const k of Object.keys(KINDS)) {
    const bare = validateSpec({ kind: k, count: 5 });
    assert.equal(bare.ok, KINDS[k].needs.length === 0, `${k} bare`);
  }
  assert.equal(validateSpec({ kind: "domain", domain: "Reading", count: 0 }).ok, false);
  assert.equal(validateSpec({ kind: "domain", domain: "Reading", count: MAX_ITEMS + 1 }).ok, false);
  assert.equal(validateSpec({ kind: "nope" }).ok, false);
});

test("selection honors every filter, is deterministic, spreads across sets and skips productive tasks unless asked", () => {
  const picks = selectItems(bank, base);
  assert.equal(picks.length, 8);
  const byKey = new Map(bank.map((i) => [`${i.setId}:${i.id}`, i]));
  for (const p of picks) {
    const i = byKey.get(`${p.setId}:${p.itemId}`);
    assert.equal(i.domain, "Reading");
    assert.equal(i.grade, "3-5");
  }
  assert.ok(new Set(picks.map((p) => p.setId)).size >= 4, "spread over at least four sets");
  assert.deepEqual(selectItems(bank, base), picks);
  const speak = selectItems(bank, { ...base, domain: "Speaking" });
  assert.equal(speak.length, 0, "speaking items are excluded unless productive tasks are included");
  assert.ok(selectItems(bank, { ...base, domain: "Speaking", includeProductive: true }).length > 0);
  const ctx = selectItems(bank, { kind: "context", grade: "6-8", context: "Science", count: 10 });
  assert.ok(ctx.every((p) => byKey.get(`${p.setId}:${p.itemId}`).context === "Science"));
  const fn = index.sets.flatMap((s) => s.items).find((i) => i.functions?.length).functions[0];
  const t = selectItems(bank, { kind: "targeted", fn, count: 6 });
  assert.ok(t.length && t.every((p) => byKey.get(`${p.setId}:${p.itemId}`).functions.includes(fn)));
  const sim = selectItems(bank, { kind: "simulation", setId: "b35-read-01" });
  assert.equal(sim.length, index.sets.find((s) => s.id === "b35-read-01").items.length);
});

test("links open the right mode and carry only ids", () => {
  const picks = selectItems(bank, base);
  const link = assignmentLink("/access-practice-lab", base, picks);
  assert.match(
    link,
    /^\/access-practice-lab\/assess\/custom\?mode=formative&title=Practice%20assignment&ids=/,
  );
  assert.equal(link.split("ids=")[1].split(",").length, 8);
  assert.match(
    assignmentLink("/x", { kind: "simulation", setId: "b35-read-01" }, []),
    /\/assess\/b35-read-01\?mode=summative$/,
  );
  assert.match(assignmentLink("/x", { kind: "supported", title: "A&B" }, picks), /title=A%26B/);
});

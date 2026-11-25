// ACCESS Practice Lab 2.0: readiness checklist and item bank health (floors, reviewed vs draft, analytics flags).
import assert from "node:assert/strict";
import { test } from "node:test";
import { bankHealth, DEFAULT_FLOORS, publishableItems } from "../shared/access-lab2/bank-health.js";
import { DOMAINS } from "../shared/access-lab2/constants.js";
import { DEMO_ITEMS } from "../shared/access-lab2/demo-items.js";
import { findMissingDisclaimers } from "../shared/access-lab2/disclaimer.js";
import {
  READINESS_CHECKLIST,
  READINESS_IDS,
  validateReadiness,
} from "../shared/access-lab2/readiness.js";
import { clone, reviewedDemo } from "./access-lab2-helpers.mjs";

test("readiness checklist covers the skills a computer practice test needs, in kid language", () => {
  assert.deepEqual(validateReadiness(), []);
  for (const id of [
    "headset-mic-check",
    "volume-check",
    "practice-select",
    "practice-drag",
    "practice-order",
    "practice-record",
    "keyboard-writing",
    "glossary-tool",
    "calming-routine",
    "test-day-expectations",
  ])
    assert.ok(READINESS_IDS.includes(id), id);
  assert.ok(
    READINESS_CHECKLIST.find((r) => r.id === "practice-record").kidText.includes(
      "stays on this device",
    ),
  );
});

test("negative control: the readiness validator flags manipulatives, platform mimicry, thin steps and duplicates", () => {
  const base = clone(READINESS_CHECKLIST[0]);
  const bad = (patch) => validateReadiness([{ ...base, ...patch }]);
  assert.ok(
    bad({ kidText: "Move the counters into the box." }).some((e) => /manipulative/.test(e)),
  );
  assert.ok(
    bad({ kidText: "This looks exactly like the real ACCESS test." }).some((e) => /mimic/.test(e)),
  );
  assert.ok(bad({ steps: ["One.", "Two."] }).some((e) => /three steps/.test(e)));
  assert.ok(bad({ minutes: 45 }).some((e) => /minutes/.test(e)));
  assert.ok(validateReadiness([base, base]).some((e) => /duplicate/.test(e)));
});

test("an all-draft bank publishes nothing and reports every gap", () => {
  const h = bankHealth({ items: DEMO_ITEMS, gradeBands: ["3-5"] });
  assert.equal(h.totals.reviewed, 0);
  assert.equal(h.totals.draft, 36);
  assert.equal(h.publishBlocked, true);
  assert.equal(h.gaps.length, 4 * 3 + 4 * 4);
  assert.deepEqual(publishableItems(DEMO_ITEMS, h), []);
  assert.deepEqual(findMissingDisclaimers(h), []);
});

test("floors: nothing below a floor publishes; a domain with a thin Key Language Use stays blocked", () => {
  const items = reviewedDemo();
  const h = bankHealth({ items, gradeBands: ["3-5"] });
  const listening = h.publish.find((p) => p.domain === "Listening");
  assert.equal(listening.publishable, false, "Listening has only one reviewed Argue item");
  assert.ok(
    h.gaps.some(
      (g) =>
        g.scope === "klu" &&
        g.domain === "Listening" &&
        g.klu === "Argue" &&
        g.have === 1 &&
        g.need === DEFAULT_FLOORS.klu,
    ),
  );
  for (const d of DOMAINS.filter((x) => x !== "Listening"))
    assert.equal(h.publish.find((p) => p.domain === d).publishable, true, d);
  const ok = publishableItems(items, h);
  assert.equal(ok.length, 27);
  assert.ok(ok.every((i) => i.domain !== "Listening"));
  const relaxed = bankHealth({ items, gradeBands: ["3-5"], floors: { cell: 3, klu: 1 } });
  assert.equal(relaxed.publishBlocked, false);
  assert.equal(publishableItems(items, relaxed).length, 36);
});

test("negative control: dropping an item below a floor blocks the whole cell and its items", () => {
  const items = reviewedDemo().filter((i) => i.id !== "demo-r-early-1");
  const h = bankHealth({ items, gradeBands: ["3-5"], floors: { cell: 3, klu: 1 } });
  assert.equal(h.publish.find((p) => p.domain === "Reading").publishable, false);
  assert.ok(
    h.gaps.some(
      (g) => g.scope === "band" && g.domain === "Reading" && g.band === "early" && g.have === 2,
    ),
  );
  assert.ok(publishableItems(items, h).every((i) => i.domain !== "Reading"));
});

test("analytics hook: a hold flag keeps a reviewed item out of the count and out of publishing", () => {
  const items = reviewedDemo();
  const flags = [
    { itemId: "demo-r-early-1", flag: "ambiguous", count: 7 },
    { itemId: "demo-r-early-2", flag: "too-easy", count: 12 },
  ];
  const h = bankHealth({ items, gradeBands: ["3-5"], floors: { cell: 3, klu: 1 }, flags });
  assert.equal(h.totals.held, 1, "only the hold flag holds");
  assert.equal(h.itemFlags.find((f) => f.itemId === "demo-r-early-2").holds, false);
  assert.equal(h.publish.find((p) => p.domain === "Reading").publishable, false);
  assert.ok(!publishableItems(items, h).some((i) => i.id === "demo-r-early-1"));
});

test("negative control: bad flags and invalid items are refused or reported, never counted", () => {
  assert.throws(
    () => bankHealth({ items: DEMO_ITEMS, flags: [{ itemId: "x", flag: "spicy", count: 1 }] }),
    /flags\[0\]/,
  );
  assert.throws(
    () => bankHealth({ items: DEMO_ITEMS, flags: [{ itemId: "x", flag: "ambiguous", count: 0 }] }),
    /flags\[0\]/,
  );
  const items = reviewedDemo();
  items[0].task.prompt = "";
  const h = bankHealth({ items, gradeBands: ["3-5"] });
  assert.equal(h.totals.invalid, 1);
  assert.equal(h.invalid[0].id, items[0].id);
  assert.equal(h.totals.items, 35);
});

test("other review states are counted separately and never reach students", () => {
  const items = reviewedDemo().map((it, i) =>
    i % 5 === 0 ? { ...it, reviewState: "in_review", reviewers: [] } : it,
  );
  const h = bankHealth({ items, gradeBands: ["3-5"], floors: { cell: 1, klu: 1 } });
  assert.ok(h.totals.other > 0);
  assert.ok(publishableItems(items, h).every((i) => i.reviewState === "reviewed"));
});

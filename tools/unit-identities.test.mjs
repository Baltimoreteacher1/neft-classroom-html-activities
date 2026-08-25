#!/usr/bin/env node
/**
 * data/curriculum-unit-identities.json must be keyed by the CURRENT unit number.
 *
 * It was not, until 2026-08-13. Its keys were the pre-renumber numbering, so its
 * "9" was "Integer Outpost" and its "10" was "Volume Vault" — which put a
 * statistics chart on Equations & Inequalities and a fraction pie on Statistics
 * wherever the file was read. Nothing failed, because every consumer treated the
 * key as trustworthy.
 *
 * The unit names on curriculum/units/index.html are the authority here. This
 * test asserts each identity record belongs to the unit it is filed under, by
 * checking that the record's own words overlap that unit's current name or the
 * titles of the lessons it actually contains — so re-introducing the legacy
 * numbering fails immediately.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
let failures = 0;
const test = (name, fn) => {
  try {
    fn();
    console.log(`   ✓ ${name}`);
  } catch (error) {
    failures++;
    console.error(`   ✗ ${name}\n     ${error.message}`);
  }
};

console.log("curriculum unit identities");

const identities = JSON.parse(
  readFileSync(resolve(ROOT, "data/curriculum-unit-identities.json"), "utf8"),
);
const curriculum = JSON.parse(readFileSync(resolve(ROOT, "data/curriculum-manifest.json"), "utf8"));
const { document } = new JSDOM(readFileSync(resolve(ROOT, "curriculum/units/index.html"), "utf8"))
  .window;

/** Current unit number -> unit name, straight off the units page. */
const unitName = new Map();
for (const card of document.querySelectorAll("details.unit")) {
  const n = Number(card.querySelector(".unit-num")?.textContent.match(/\d+/)?.[0]);
  const name = card.querySelector(".unit-name")?.textContent.trim();
  if (Number.isFinite(n) && name) unitName.set(n, name);
}

/** Everything a unit says about itself: its name plus its lesson titles. */
const unitVocabulary = new Map();
for (const [n, name] of unitName) unitVocabulary.set(n, [name]);
for (const lesson of curriculum.lessons) {
  unitVocabulary.get(lesson.unit)?.push(lesson.title || "");
}

const words = (text) =>
  new Set(
    String(text || "")
      .toLowerCase()
      .replace(/[^a-z\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .map((w) => w.replace(/(ie)?s$/, (m) => (m === "ies" ? "y" : ""))),
  );

test("the units page still yields 10 current unit names", () => {
  assert.equal(unitName.size, 10);
  assert.equal(unitName.get(2), "Statistics");
  assert.equal(unitName.get(7), "Integers & the Coordinate Plane");
});

test("there is exactly one identity record per current unit", () => {
  assert.deepEqual(
    Object.keys(identities.units)
      .map(Number)
      .sort((a, b) => a - b),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  );
});

test("every record carries the fields its consumers read", () => {
  for (const [n, record] of Object.entries(identities.units)) {
    for (const field of ["icon", "title", "mission", "skills", "finalChallenge", "accent"]) {
      assert.ok(record[field], `unit ${n} is missing "${field}"`);
    }
    assert.ok(Array.isArray(record.skills) && record.skills.length >= 3, `unit ${n} skills`);
    assert.match(record.accent, /^#[0-9a-f]{6}$/i, `unit ${n} accent must be a hex colour`);
  }
});

test("every icon is distinct, so no two units read as the same unit", () => {
  const icons = Object.values(identities.units).map((r) => r.icon);
  assert.equal(new Set(icons).size, icons.length, `duplicate icon among ${icons.join(" ")}`);
});

test("each identity describes the unit it is filed under", () => {
  for (const [key, record] of Object.entries(identities.units)) {
    const n = Number(key);
    const own = words(`${record.title} ${record.mission} ${record.skills.join(" ")}`);
    const mine = words(unitVocabulary.get(n).join(" "));
    const overlap = [...own].filter((w) => mine.has(w));
    assert.ok(
      overlap.length >= 2,
      `unit ${n} ("${record.title}") shares almost nothing with Unit ${n} — ` +
        `${unitName.get(n)}, which teaches: ${unitVocabulary.get(n).slice(1, 4).join("; ")}. ` +
        `If this file was re-keyed to the pre-renumber numbering, revert that.`,
    );
  }
});

/**
 * The four the renumber broke, named outright. Each asserts a word the unit's
 * CURRENT topic requires, so a record that drifts back to its legacy unit fails.
 */
const PINNED = [
  { unit: 2, topic: "Statistics", mustMention: /data|statistic/i },
  { unit: 5, topic: "Volume & Surface Area", mustMention: /volume|surface/i },
  { unit: 7, topic: "Integers & Coordinate Plane", mustMention: /integer|coordinate/i },
  { unit: 8, topic: "Equations & Inequalities", mustMention: /equation|inequalit/i },
];

for (const pin of PINNED) {
  test(`Unit ${pin.unit} visually represents ${pin.topic}`, () => {
    const record = identities.units[String(pin.unit)];
    const blob = `${record.title} ${record.mission} ${record.skills.join(" ")}`;
    assert.match(
      blob,
      pin.mustMention,
      `Unit ${pin.unit} is "${record.title}" (${record.icon}), which does not mention ${pin.topic}. ` +
        `Before the 2026-08-13 re-key this slot held the pre-renumber unit's identity.`,
    );
  });
}

test("no record still sits on its pre-renumber unit", () => {
  // The exact wrong pairings this file shipped with, spelled out so the mistake
  // cannot be reintroduced quietly.
  const LEGACY = {
    1: "Number Lab",
    2: "Fraction Foundry",
    4: "Rate & Percent Studio",
    7: "Equation Quest",
    8: "Data Detectives",
    9: "Integer Outpost",
    10: "Volume Vault",
  };
  for (const [unit, wrongTitle] of Object.entries(LEGACY)) {
    assert.notEqual(
      identities.units[unit].title,
      wrongTitle,
      `Unit ${unit} is back to "${wrongTitle}", its PRE-renumber identity`,
    );
  }
});

test("the file says which numbering it uses", () => {
  assert.match(identities._note, /current/i);
  assert.match(identities._note, /pre-renumber|re-keyed/i);
});

if (failures) {
  console.error(`\nFAIL: ${failures} test${failures === 1 ? "" : "s"}`);
  process.exit(1);
}

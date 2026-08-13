#!/usr/bin/env node
/**
 * Renumbering regressions: these placements look wrong and are right.
 *
 * Lessons were renumbered to the publisher's Reveal TOC on 2026-08-10, but the
 * unit-level ASSETS kept their pre-renumber filenames. Every case below is a
 * resource whose path says one unit and whose CONTENT belongs to another. The
 * units page shows them under the unit that currently owns them.
 *
 * This file exists because that has already been "corrected" back to the legacy
 * numbers once, by an automated pass that trusted the path. It moved 29 correct
 * placements and emptied Unit 10. If one of these assertions fails, the fix is
 * almost certainly to revert whatever moved the resource — not to update the
 * expectation here.
 *
 * The order of authority is documented in scripts/lib/download-taxonomy.mjs.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { CANONICAL_UNIT } from "../scripts/lib/download-taxonomy.mjs";

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

console.log("unit placement after the TOC renumber");

/* Which unit card currently lists each unit-level resource. */
const { document } = new JSDOM(readFileSync(resolve(ROOT, "curriculum/units/index.html"), "utf8"))
  .window;
const displayedUnit = new Map();
for (const card of document.querySelectorAll("details.unit")) {
  const unit = Number(card.querySelector(".unit-num")?.textContent.match(/\d+/)?.[0]);
  for (const a of card.querySelectorAll(":scope > .unit-body > .unit-res a.res")) {
    const href = a.getAttribute("href");
    if (href?.startsWith("/") && !displayedUnit.has(href)) displayedUnit.set(href, unit);
  }
}

/**
 * href → the unit that owns it today, the number its path still carries, and
 * how we know. `evidence` is a phrase the resource states about itself, so the
 * claim is checkable against the file rather than asserted here.
 */
const PINNED = [
  {
    href: "/pre-test/unit9-review.html",
    unit: 7,
    legacyNumber: 9,
    evidence: "Integers and Coordinate Plane",
    authority: "title",
  },
  {
    href: "/pre-test/unit7-review.html",
    unit: 8,
    legacyNumber: 7,
    evidence: "Equations and Inequalities",
    authority: "title",
  },
  {
    href: "/pre-test/unit8-review.html",
    unit: 2,
    legacyNumber: 8,
    evidence: "Statistics",
    authority: "title",
  },
  {
    href: "/math/unit-10/projects/",
    unit: 5,
    legacyNumber: 10,
    evidence: "Volume &amp; Surface Area in Action",
    authority: "explicit",
  },
  {
    href: "/math/unit-1/projects/",
    unit: 6,
    legacyNumber: 1,
    evidence: "Number Sense in Action",
    authority: "explicit",
  },
];

for (const pin of PINNED) {
  test(`${pin.href} is Unit ${pin.unit}, not Unit ${pin.legacyNumber} from its path`, () => {
    assert.equal(
      displayedUnit.get(pin.href),
      pin.unit,
      `the units page lists it under Unit ${displayedUnit.get(pin.href)}. The "unit${pin.legacyNumber}" ` +
        `in its path is pre-renumber and is NOT a reason to move it.`,
    );
  });

  test(`${pin.href} still says "${pin.evidence}" about itself`, () => {
    // Read the file the href resolves to, so the pin rests on the resource, not
    // on this test's memory of it.
    const rel = pin.href.replace(/^\/+/, "").replace(/\/$/, "");
    const html = readFileSync(
      resolve(ROOT, rel.endsWith(".html") ? rel : `${rel}/index.html`),
      "utf8",
    );
    assert.ok(
      html.includes(pin.evidence),
      `expected the page to contain "${pin.evidence}". If the resource genuinely changed topic, ` +
        `its unit may need to change too — check before editing this expectation.`,
    );
  });
}

test("the path number disagrees with the current unit in every pinned case", () => {
  // If one of these ever agrees, the asset was renamed and the pin is stale
  // rather than protective.
  for (const pin of PINNED) {
    assert.notEqual(
      pin.legacyNumber,
      pin.unit,
      `${pin.href} no longer needs pinning — its path number now matches its unit`,
    );
  }
});

test("the two resources no title can place carry an explicit assignment", () => {
  for (const pin of PINNED.filter((p) => p.authority === "explicit")) {
    const canonical = CANONICAL_UNIT.get(pin.href);
    assert.ok(canonical, `${pin.href} must have a CANONICAL_UNIT entry`);
    assert.equal(canonical.unit, pin.unit);
    assert.ok(
      canonical.because && canonical.because.length > 40,
      `${pin.href}'s assignment must record why`,
    );
  }
});

test("Number Sense in Action is assigned to Unit 6 on instructional grounds", () => {
  const canonical = CANONICAL_UNIT.get("/math/unit-1/projects/");
  assert.equal(canonical.unit, 6);
  assert.match(canonical.because, /prime-factorization|fraction-division/i);
  // The rationale must not rest on the path number, which is exactly what is
  // untrustworthy here.
  assert.match(canonical.because, /not authoritative|pre-renumber/i);
});

test("no explicit assignment is a teacher-facing string", () => {
  // CANONICAL_UNIT is build-time metadata. If one of its rationales ever showed
  // up in the shipped inventory, teachers would be reading our bookkeeping.
  const manifest = readFileSync(resolve(ROOT, "data/curriculum-download-manifest.json"), "utf8");
  for (const canonical of CANONICAL_UNIT.values()) {
    assert.ok(
      !manifest.includes(canonical.because),
      "a CANONICAL_UNIT rationale leaked into the generated download manifest",
    );
  }
});

if (failures) {
  console.error(`\nFAIL: ${failures} test${failures === 1 ? "" : "s"}`);
  process.exit(1);
}

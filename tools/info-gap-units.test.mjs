// The information-gap check must keep the unit: "36 feet" is not "36 inches" and "30 square units" is not
// "30 cubic units". The old check stripped square/cubic/cm/feet/... before comparing, so 39 of 810 needs in the 162
// unit payloads accepted a wrong unit as correct (found 2026-11-25 by the Language Page verification pass).
import assert from "node:assert/strict";
import test from "node:test";
import { sameAnswer } from "../bcpss-teachers/language-studio/studio-core.js";
import { loadDataset } from "./language-page/dataset.mjs";

// The previous comparison, kept only as the negative control: it must accept the wrong unit.
const OLD_STRIP =
  /square|cubic|centimeters?|centimetres?|cm|inches|inch|feet|foot|ft|meters?|units?/g;
const oldNorm = (t) =>
  String(t ?? "")
    .toLowerCase()
    .replace(/×/g, "x")
    .replace(OLD_STRIP, "")
    .replace(/[^a-z0-9.]+/g, "");
const oldSame = (a, b) =>
  oldNorm(String(a).replace(/\bby\b/gi, "x")) === oldNorm(String(b).replace(/\bby\b/gi, "x"));

test("same answers are accepted", () => {
  for (const [typed, truth] of [
    ["36 inches", "36 inches"],
    ["36 INCHES.", "36 inches"],
    ["0.35 meters", "0.35 meter"],
    ["35 cm", "35 centimeters"],
    ["14 square ft", "14 square feet"],
    ["6 feet by 3 feet", "6 feet by 3 feet"],
    ["6 feet x 3 feet", "6 feet by 3 feet"],
    ["30π cubic units", "30π cubic units"],
    ["36", "36 inches"], // a bare number is still the number
    ["square", "square"],
  ])
    assert.ok(sameAnswer(typed, truth), `${typed} should equal ${truth}`);
});

test("a wrong unit is never accepted", () => {
  for (const [typed, truth] of [
    ["36 feet", "36 inches"],
    ["200 meters", "200 centimeters"],
    ["14 cubic feet", "14 square feet"],
    ["30 square units", "30 cubic units"],
    ["62 cubic cm", "62 square cm"],
    ["6 meters by 3 feet", "6 feet by 3 feet"],
    ["cubic", "square"],
    ["37 inches", "36 inches"],
  ])
    assert.ok(!sameAnswer(typed, truth), `${typed} must not equal ${truth}`);
  // control: the old comparison really did accept these, so this test can fail
  assert.ok(oldSame("36 feet", "36 inches"));
  assert.ok(oldSame("30 square units", "30 cubic units"));
});

test("every information-gap fact in the 162 units: accepted as written, rejected with another unit", async () => {
  const { units } = await loadDataset();
  const SWAPS = [
    [/\bsquare\b/, "cubic"],
    [/\bcubic\b/, "square"],
    [/\bfeet\b/, "meters"],
    [/\binches\b/, "feet"],
    [/\bcentimeters\b/, "meters"],
  ];
  let needs = 0;
  let swapped = 0;
  for (const u of units)
    for (const a of u.studio.activities.filter((x) => x.kind === "info_gap")) {
      const { a: sa, b: sb } = a.payload;
      for (const [side, other] of [
        [sa, sb],
        [sb, sa],
      ])
        for (const need of side.needs) {
          needs++;
          const truth = other.has.find((f) => f.k === need)?.v;
          assert.notEqual(truth, undefined, `${u.unit.id}: "${need}" has no partner fact`);
          assert.ok(sameAnswer(truth, truth), `${u.unit.id}: "${need}" rejects its own answer`);
          for (const [re, to] of SWAPS)
            if (re.test(truth)) {
              swapped++;
              assert.ok(
                !sameAnswer(truth.replace(re, to), truth),
                `${u.unit.id}: "${need}" accepts a wrong unit: ${truth.replace(re, to)}`,
              );
            }
        }
    }
  assert.ok(needs >= 800 && swapped >= 30, `swept ${needs} needs, ${swapped} unit swaps`);
});

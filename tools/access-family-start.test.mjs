// Family Hub (/family-start): grade first, then a 5-minute activity and the main choices. The Family Tour is ONE
// choice among them, never the only door. Every link carries the chosen grade, and the FAQ is bilingual.
import assert from "node:assert/strict";
import test from "node:test";
import { GRADE_PICKS } from "../access-practice-lab/src/grade-bands.js";
import { FAMILY_FAQ } from "../access-practice-lab/src/intro/family-help.js";
import {
  DEFAULT_QUICK_MINUTES,
  FAMILY_TIPS,
  familyChoices,
  quickMinutes,
} from "../access-practice-lab/src/intro/family-start.js";

const MAIN = ["quick", "skills", "together", "understand", "help"];
const bilingual = (pair) => Array.isArray(pair) && pair[0] && pair[1] && pair[0] !== pair[1];

test("every grade gets the five main choices in order, plus the tour and Family Corner, each carrying that grade", () => {
  for (const { id } of GRADE_PICKS) {
    for (const tourHost of [true, false]) {
      const choices = familyChoices(id, { tourHost });
      assert.deepEqual(
        choices.slice(0, 5).map((c) => c.id),
        MAIN,
        "the 5-minute activity leads, then the main choices",
      );
      const tour = choices.find((c) => c.id === "tour");
      assert.ok(tour, "the Family Tour stays available");
      assert.ok(
        choices.find((c) => c.id === "corner"),
        "Family Corner stays available",
      );
      assert.ok(choices.length > 1, "the tour is never the only door");
      assert.match(tour.href, tourHost ? /\/family-tour\// : /\/practice-together/);
      for (const c of choices) {
        assert.ok(c.href.endsWith(`?grades=${id}`), `${c.id} carries ${id}`);
        assert.ok(c.name[0] && c.name[1] && c.detail[0] && c.detail[1], `${c.id} bilingual`);
        for (const l of c.links || []) {
          assert.ok(l.href.endsWith(`?grades=${id}`), `${c.id}/${l.id} carries ${id}`);
          assert.ok(l.name[0] && l.name[1], `${c.id}/${l.id} bilingual`);
        }
      }
      const skills = choices.find((c) => c.id === "skills");
      assert.deepEqual(
        skills.links.map((l) => l.id).sort(),
        ["listening", "reading", "speaking", "writing"],
        "four skill rooms",
      );
    }
  }
});

test("grades K-3 read together in their own Story Time, older grades in the Reading Room", () => {
  const read = (pick) =>
    familyChoices(pick, { tourHost: false })
      .find((c) => c.id === "together")
      .links.find((l) => l.id === "read").href;
  for (const pick of ["K", "1", "2-3"]) assert.match(read(pick), /\/early\?/);
  for (const pick of ["4-5", "6-8"]) assert.match(read(pick), /\/reading-room\?/);
});

test("quick start defaults to 5 minutes and follows the family planner's saved length", () => {
  assert.equal(DEFAULT_QUICK_MINUTES, 5);
  assert.equal(quickMinutes({}), 5);
  assert.equal(quickMinutes({ family: { minutes: 10 } }), 10);
  assert.equal(quickMinutes({ family: { minutes: 15 } }), 15);
  assert.equal(quickMinutes({ family: { minutes: 7 } }), 5, "an unknown length falls back to 5");
});

test("guidance lines and the family FAQ are bilingual, and the FAQ never presents practice as a score", () => {
  for (const tip of Object.values(FAMILY_TIPS)) assert.ok(bilingual(tip));
  const ids = FAMILY_FAQ.map((f) => f.id);
  assert.deepEqual(ids, ["start", "account", "save", "microphone", "phone", "choose", "meaning"]);
  for (const f of FAMILY_FAQ) {
    assert.ok(bilingual(f.q), `${f.id} question`);
    for (const p of f.a) assert.ok(bilingual(p), `${f.id} answer`);
    for (const [route, label] of f.links || []) {
      assert.match(route, /^[a-z][a-z/-]*$/, `${f.id} link is a lab route`);
      assert.ok(bilingual(label));
    }
  }
  const meaning = FAMILY_FAQ.find((f) => f.id === "meaning")
    .a.map((p) => p[0])
    .join(" ");
  assert.match(meaning, /not a test score/);
  assert.doesNotMatch(FAMILY_FAQ.flatMap((f) => f.a.flat()).join(" "), /WIDA|proficien|level \d/i);
});

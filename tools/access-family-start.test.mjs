// Family start (/family-start): grade first, then the Family Tour as ONE choice beside short activities.
import assert from "node:assert/strict";
import test from "node:test";
import { familyChoices } from "../access-practice-lab/src/intro/family-start.js";
import { GRADE_PICKS } from "../access-practice-lab/src/grade-bands.js";

test("every grade gets the tour plus other activities, each carrying that grade", () => {
  for (const { id } of GRADE_PICKS) {
    for (const tourHost of [true, false]) {
      const choices = familyChoices(id, { tourHost });
      assert.equal(choices[0].id, "tour", "the tour leads");
      assert.ok(choices.length >= 4, "the tour is never the only door");
      for (const c of choices) assert.ok(c.href.endsWith(`?grades=${id}`), `${c.id} carries ${id}`);
      for (const c of choices)
        assert.ok(c.name[0] && c.name[1] && c.detail[0] && c.detail[1], `${c.id} bilingual`);
      assert.match(choices[0].href, tourHost ? /\/family-tour\// : /\/practice-together/);
    }
  }
});

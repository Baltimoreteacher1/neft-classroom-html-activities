// Regression: every seed unit resolves a Key Language Use from its blueprint; lesson drafts use it (not "Explain").
import assert from "node:assert/strict";
import { test } from "node:test";
import { BCPSS_UNITS, UNIT_CONNECTIONS } from "../data/bcpss-curriculum-seed.mjs";
import { kluOfConnection } from "../functions/_lib/bcpss/klu.js";
import { loadLessons } from "../functions/_lib/bcpss/lessons.js";

const KLUS = new Set(["Narrate", "Inform", "Explain", "Argue"]);

test("every seed connection resolves a KLU, and it agrees with its exit ticket", () => {
  assert.equal(UNIT_CONNECTIONS.length, 162);
  const tally = {};
  for (const c of UNIT_CONNECTIONS) {
    const klu = kluOfConnection(c);
    assert.ok(KLUS.has(klu), `${c.unit_id}: ${klu}`);
    assert.equal(
      klu,
      c.language_exit_ticket_json.wida_klu,
      `${c.unit_id} blueprint vs exit ticket`,
    );
    tally[klu] = (tally[klu] || 0) + 1;
  }
  assert.deepEqual(tally, { Narrate: 18, Inform: 44, Explain: 54, Argue: 46 });
});

test("negative control: a connection with no blueprint and no field resolves to null, not a silent default", () => {
  assert.equal(kluOfConnection({ unit_id: "x", blueprint_id: "nope" }), null);
  assert.equal(kluOfConnection({ wida_klu: "Argue", blueprint_id: "nope" }), "Argue");
});

test("generated lesson drafts carry the unit's KLU (hand-authored sets choose their own per lesson)", async () => {
  const wrong = [];
  let generated = 0;
  for (const u of BCPSS_UNITS) {
    const want = kluOfConnection(UNIT_CONNECTIONS.find((c) => c.unit_id === u.id));
    const set = await loadLessons(u.id);
    if (set.source === "authored") continue;
    generated++;
    for (const l of set.lessons)
      if (l.language_objective.klu !== want)
        wrong.push(`${l.id}:${l.language_objective.klu}!=${want}`);
  }
  assert.equal(generated, 159);
  assert.deepEqual(wrong.slice(0, 5), [], `${wrong.length} lessons carry the wrong KLU`);
});

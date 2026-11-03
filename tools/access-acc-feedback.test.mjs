#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  FEEDBACK_NOTICE,
  observeWriting,
} from "../access-practice-lab/src/acc/feedback/writing-feedback.js";

const item = (fns, min = 20) => ({ constructed: { minWords: min }, meta: { functions: fns } });
const data = "The table shows 12 plants in the sun and 5 plants in the shade after 10 days.";

test("observations count what is in the text and say what they cannot do", () => {
  const r = observeWriting(
    "The plants in the sun grew more because they got light. In the shade there were 5 plants.",
    item(["Explain cause and effect"]),
    data,
  );
  assert.equal(r.kind, "rule-based");
  assert.match(r.notice, /does not judge meaning and it is not a score/);
  assert.equal(r.notice, FEEDBACK_NOTICE);
  assert.match(r.observations[0], /18 words in 2 sentences/);
  assert.ok(r.observations.some((o) => /Linking words you used: because/.test(o)));
  assert.ok(r.observations.some((o) => /1 number from the data: 5/.test(o)));
  assert.equal(
    r.nextMoves.some((m) => /cause/.test(m)),
    false,
    "a cause word is present, so no cause move is suggested",
  );
});

test("next moves follow the task's language function and only appear when the feature is absent", () => {
  assert.ok(
    observeWriting("Plants grow.", item(["Explain cause and effect"], 5), data).nextMoves.some(
      (m) => /because, so, as a result/.test(m),
    ),
  );
  assert.ok(
    observeWriting("Plants grow.", item(["Compare or contrast"], 5), "").nextMoves.some((m) =>
      /alike or different/.test(m),
    ),
  );
  assert.ok(
    observeWriting("The plants grow.", item(["Make and support a claim"], 5), "").nextMoves.some(
      (m) => /State your claim/.test(m),
    ),
  );
  assert.ok(
    observeWriting(
      "I think plants need light.",
      item(["Make and support a claim"], 5),
      "",
    ).nextMoves.some((m) => /evidence/.test(m)),
  );
  assert.ok(
    !observeWriting(
      "I think plants need light because the table shows 12.",
      item(["Make and support a claim"], 5),
      data,
    ).nextMoves.some((m) => /evidence|claim/.test(m)),
  );
  assert.ok(
    observeWriting("We went.", item(["Sequence events or retell"], 5), "").nextMoves.some((m) =>
      /order/.test(m),
    ),
  );
  assert.ok(
    observeWriting("The sun is hot.", item(["Interpret data"], 3), data).nextMoves.some((m) =>
      /number from the data/.test(m),
    ),
  );
  assert.ok(
    observeWriting("Short.", item(["Describe"], 25), "").nextMoves.some((m) =>
      /1 of at least 25/.test(m),
    ),
  );
});

test("copying from the source is noticed by counting runs of six matching words, not by judging quality", () => {
  const src =
    "Wetlands act as natural filters because thick plants slow the moving water so soil sinks.";
  const r = observeWriting(
    "Wetlands act as natural filters because thick plants slow the moving water.",
    item(["Present factual information"], 5),
    src,
  );
  assert.ok(r.counts.copiedRuns >= 1);
  assert.match(r.observations.join(" "), /match the source word for word/);
});

test("no observation or move claims a score, a level, or an analysis of meaning", () => {
  const r = observeWriting(
    "Plants need light because it helps them grow.",
    item(["Explain cause and effect", "Make and support a claim"]),
    data,
  );
  for (const line of [...r.observations, ...r.nextMoves])
    assert.ok(
      !/\b(score|level|proficien|great job|good job|correct meaning|well written)\b/i.test(line),
      line,
    );
});

test("both rubrics are complete: four ratings, descriptors per rating, an honest provenance and the unscored dimensions named", () => {
  for (const id of ["speaking-practice", "writing-practice"]) {
    const r = JSON.parse(
      readFileSync(
        new URL(`../access-practice-lab/content/rubrics/${id}.json`, import.meta.url),
        "utf8",
      ),
    );
    assert.equal(r.id, id);
    assert.equal(r.ratings.length, 4);
    assert.ok(r.dimensions.length >= 7);
    for (const d of r.dimensions) {
      assert.equal(d.descriptors.length, 4, `${id}/${d.id}`);
      assert.ok(d.label && d.look);
      assert.ok(new Set(d.descriptors).size === 4, `${id}/${d.id} descriptors must differ`);
    }
    assert.match(r.provenance, /NOT a WIDA rubric/);
    assert.ok(
      !/\b(entering|emerging|expanding|bridging|reaching)\b/i.test(JSON.stringify(r)),
      "no WIDA proficiency-level names",
    );
  }
  const sp = JSON.parse(
    readFileSync(
      new URL("../access-practice-lab/content/rubrics/speaking-practice.json", import.meta.url),
      "utf8",
    ),
  );
  assert.deepEqual(sp.notScored, [
    "Pronunciation",
    "Speaking speed and pauses",
    "Grammar accuracy",
  ]);
  assert.match(sp.notScoredNote, /never infers them from how long or how loud/);
});

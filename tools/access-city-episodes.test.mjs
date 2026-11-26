import assert from "node:assert/strict";
import { test } from "node:test";
import { CLINIC_EPISODE } from "../access-practice-lab/src/content/city-clinic-episode.js";
import { LEVELS } from "../access-practice-lab/src/content/city-market-episode.js";
import { NEWSROOM_EPISODE } from "../access-practice-lab/src/content/city-newsroom-episode.js";

for (const ep of [CLINIC_EPISODE, NEWSROOM_EPISODE]) {
  test(`episode ${ep.id} has complete bilingual structure and valid answers`, () => {
    assert.ok(ep.title.en && ep.title.es);
    assert.ok(ep.spots.length >= 6);
    for (const s of ep.spots) {
      assert.ok(s.label.en && s.label.es);
      assert.ok(s.sign.head.en && s.sign.head.es);
      assert.ok(s.word.en && s.word.es && s.word.def.en && s.word.def.es);
    }
    for (const lv of LEVELS) {
      for (const q of [ep.listenQ[lv], ep.readQ[lv]]) {
        assert.ok(q.ask.en && q.ask.es);
        assert.ok(
          q.opts.some((o) => o.id === q.answer),
          `${ep.id} ${lv} answer exists`,
        );
        for (const o of q.opts) {
          assert.ok(o.en && o.es && o.why.en && o.why.es);
        }
      }
      assert.ok(ep.speak[lv].task.en && ep.speak[lv].model.en);
      assert.ok(ep.write[lv].task.en && ep.write[lv].minWords >= 4);
    }
    const req = ep.task.items.filter((i) => i.required);
    const bad = ep.task.items.filter((i) => !i.required);
    assert.equal(req.length, 3);
    assert.ok(bad.length >= 2);
  });
}

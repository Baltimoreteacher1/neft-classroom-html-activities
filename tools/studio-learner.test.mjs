/* Learner model: seals rise on evidence, never fall, ignore plain authored items, survive a corrupt store. Pure, no DOM. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/** A fresh model over a fake store; `stored` seeds localStorage. */
function load(stored) {
  const store = new Map(stored === undefined ? [] : [["neft_studio_learner_v1", stored]]);
  const emitted = [];
  const ctx = {
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
    },
    StudioBus: { on() {}, emit: (type, d) => emitted.push([type, d]) },
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(readFileSync("assets/studio/learner.js", "utf8"), ctx);
  return { L: ctx.StudioLearner, store, emitted };
}
const answer = (o = {}) => ({
  lesson: "6-3",
  kind: "gen",
  gen: "pow-eval",
  genLevel: 2,
  skill: "Evaluate powers",
  ok: true,
  tries: 1,
  hints: 0,
  ...o,
});

// a skill is a generator, a hands-on activity or a lab; plain authored items are not skills
{
  const { L } = load();
  assert.equal(L.record(answer()).key, "gen:pow-eval");
  assert.equal(
    L.record(answer({ gen: null, kind: "act", skill: "Fold a net" })).key,
    "act:fold-a-net",
  );
  assert.equal(
    L.record(answer({ gen: null, kind: "lab", skill: "Ratio Railway" })).key,
    "lab:ratio-railway",
  );
  assert.equal(
    L.record(answer({ gen: null, skill: null, kind: "mc" })).key,
    null,
    "plain multiple choice is not a skill",
  );
}

// seals: Bronze at 3 seen, Silver at 5 with ema >= 0.7 and a clean answer at level 2, Gold at 8 with ema >= 0.85, level 3, streak 3
{
  const { L, emitted } = load();
  const seals = [];
  for (let i = 0; i < 12; i++) {
    const r = L.record(answer({ genLevel: i < 5 ? 2 : 3 }));
    seals.push(L.sealOf(L.get("gen:pow-eval")));
    if (r.rose) assert.ok(emitted.at(-1)[0] === "seal" && emitted.at(-1)[1].seal === r.rose);
  }
  assert.deepEqual(seals.slice(0, 3), [0, 0, 1], "Bronze on the third answer");
  assert.equal(seals[4], 2, "Silver on the fifth clean answer");
  assert.equal(seals[11], 3, "Gold after sustained clean work at level 3");
  assert.deepEqual(
    JSON.parse(JSON.stringify(emitted.map((e) => e[1].seal))),
    [1, 2, 3],
    "each seal announced once, in order",
  );
}

// help is not failure but it is not evidence of mastery: helped answers alone never pass Bronze to Silver
{
  const { L } = load();
  for (let i = 0; i < 10; i++) L.record(answer({ tries: 2 }));
  const r = L.get("gen:pow-eval");
  assert.equal(r.helped, 10);
  assert.equal(r.clean, 0);
  assert.equal(L.sealOf(r), 1, "ten helped answers earn Bronze and stop");
  for (let i = 0; i < 4; i++) L.record(answer({ hints: 1 }));
  assert.equal(L.sealOf(L.get("gen:pow-eval")), 1, "hints count as help");
}

// sticky: a run of misses and helped answers never takes a seal back
{
  const { L } = load();
  for (let i = 0; i < 12; i++) L.record(answer({ genLevel: 3 }));
  assert.equal(L.sealOf(L.get("gen:pow-eval")), 3);
  for (let i = 0; i < 20; i++) L.record(answer({ tries: 3, hints: 2 }));
  for (let i = 0; i < 5; i++) L.record(answer({ ok: false, tag: "exponent-as-factor" }));
  assert.equal(L.sealOf(L.get("gen:pow-eval")), 3, "a seal is never taken back");
  assert.equal(
    L.get("gen:pow-eval").traps["exponent-as-factor"],
    5,
    "misses are counted under their trap",
  );
  assert.equal(L.get("gen:pow-eval").streak, 0, "a streak ends quietly");
}

// a miss alone is not an attempt; a fresh-numbers repair that is clean is counted as repaired, a worked-example try is not
{
  const { L } = load();
  L.record(answer({ ok: false, tag: "t" }));
  assert.equal(L.get("gen:pow-eval").seen, 0);
  L.record(answer({ redeem: true, itemId: "rp_x_1" }));
  assert.equal(L.get("gen:pow-eval").repaired, 1);
  L.record(answer({ redeem: true, tries: 2, itemId: "rp_x_2" }));
  assert.equal(L.get("gen:pow-eval").repaired, 1, "a repair that needed help is not a repair");
  L.record(answer({ redeem: true, itemId: "ex_x_1" }));
  assert.equal(
    L.get("gen:pow-eval").repaired,
    1,
    "practice after a worked example is not a repair",
  );
}

// confidence: how often each level of sureness was right on the first try
{
  const { L } = load();
  L.record(answer({ conf: 3 }));
  L.record(answer({ conf: 3, tries: 2 }));
  L.record(answer({ conf: 1 }));
  assert.deepEqual(JSON.parse(JSON.stringify(L.confidence()[3])), { n: 2, ok: 1 });
  assert.deepEqual(JSON.parse(JSON.stringify(L.confidence()[1])), { n: 1, ok: 1 });
}

// persistence, and a corrupt or foreign store only means a fresh start
{
  const a = load();
  for (let i = 0; i < 3; i++) a.L.record(answer());
  const b = load(a.store.get("neft_studio_learner_v1"));
  assert.equal(b.L.sealOf(b.L.get("gen:pow-eval")), 1, "reloads from the store");
  for (const bad of ["{not json", '{"v":9}', "null", '"x"', '{"v":1,"skills":7}']) {
    const c = load(bad);
    assert.equal(Object.keys(c.L.all()).length, 0, `ignores ${bad}`);
    c.L.record(answer());
    assert.equal(c.L.get("gen:pow-eval").seen, 1);
  }
}

// per-lesson view, newest first
{
  const { L } = load();
  L.record(answer({ lesson: "6-3" }));
  L.record(answer({ lesson: "6-4", gen: "other", skill: "Other" }));
  assert.deepEqual(JSON.parse(JSON.stringify(L.forLesson("6-4").map((s) => s.key))), ["gen:other"]);
  assert.equal(L.forLesson("9-9").length, 0);
}

// Trap Book: a miss spots a trap, three clean answers on items that offered it tame it (once, sticky), tier two confirms one
{
  const { L, emitted } = load();
  const miss = (o = {}) =>
    answer({ ok: false, tag: "pct-as-whole", gen: null, skill: null, kind: "mc", ...o });
  const clean = (o = {}) =>
    answer({ gen: null, skill: null, kind: "mc", traps: ["pct-as-whole", "other-trap"], ...o });
  clean(); // never missed: nothing to dodge
  L.record(clean());
  assert.equal(L.trap("pct-as-whole"), null, "a trap never missed is not in the book");
  L.record(miss());
  assert.equal(L.trap("pct-as-whole").n, 1);
  L.record(clean());
  L.record(clean({ tries: 2 })); // a helped answer is not a dodge
  L.record(clean());
  assert.equal(L.trap("pct-as-whole").dodged, 2);
  assert.equal(L.trap("pct-as-whole").tamed, false);
  L.record(clean());
  assert.equal(L.trap("pct-as-whole").tamed, true, "three dodges in a row tame it");
  assert.equal(emitted.filter((e) => e[0] === "trap").length, 1, "announced once");
  L.record(clean());
  assert.equal(emitted.filter((e) => e[0] === "trap").length, 1, "and not again");
  L.record(miss());
  assert.equal(L.trap("pct-as-whole").tamed, true, "tamed is sticky");
  assert.equal(L.trap("pct-as-whole").since, 0, "but the run restarts after a miss");
  assert.equal(L.trap("pct-as-whole").lessons["6-3"], 2, "counted per lesson");
  L.confirm("other-trap", "6-3");
  assert.equal(L.trap("other-trap").confirmed, 1, "a confirmed trap enters the book");
  assert.equal(Object.keys(L.traps()).length, 2);
}

// nothing timed: the model keeps no clocks of its own beyond the day of last use
{
  const src = readFileSync("assets/studio/learner.js", "utf8");
  assert.ok(
    !/setTimeout|setInterval|performance\.now|Date\.now/.test(src),
    "no timers or stopwatches",
  );
}
console.log(
  "studio-learner: skills, seals (earned, announced, sticky), repairs, confidence and the store all hold.",
);

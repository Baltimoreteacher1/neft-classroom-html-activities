#!/usr/bin/env node
/**
 * Gate G-30 (core): the "My Week" planner over ALL 162 units x 3 band mixes x 3 block lengths (45/60/90) x days 1/3/5.
 * For every plan: each day within its cap, every candidate planned or dropped WITH a true reason, dependencies respected,
 * identical output for a fixed seed. An independent checker (shared/planner/check.js) does the judging.
 * Negative controls run FIRST and must fire: a planner that overfills a day, one that drops silently, one that breaks
 * dependency order, and a good plan that must pass. If a control stops firing the gate exits 3.
 * Reports measured teacher workload (median planned minutes per day) and planner compute time.
 * Exit 0 pass, 1 findings, 3 broken gate. Run: node tools/planner-core.test.mjs
 */
import assert from "node:assert/strict";
import { BCPSS_UNITS } from "../data/bcpss-curriculum-seed.mjs";
import { loadWeekInputs } from "../functions/_lib/bcpss/week-plan.js";
import { pickDates } from "../shared/planner/calendar.js";
import { allocateMinutes } from "../shared/planner/candidates.js";
import { checkPlan } from "../shared/planner/check.js";
import { BLOCK_MINUTES } from "../shared/planner/constants.js";
import { parseSearch } from "../shared/planner/params.js";
import { planWeek, priceCandidates } from "../shared/planner/solve.js";

const MIXES = {
  early: { "1_2": 16, "3_4": 6, "5_6": 2 },
  mid: { "1_2": 4, "3_4": 16, "5_6": 4 },
  late: { "1_2": 2, "3_4": 6, "5_6": 16 },
};
const DAY_COUNTS = [1, 3, 5];
const mk = (unit, mix, block, days, seed = 0) => ({
  unit,
  bands: MIXES[mix],
  block,
  days,
  seed,
  start: null,
  cal: false,
});
const codes = (findings) => [...new Set(findings.map((f) => f.code))].sort();
const stable = (v) => JSON.stringify(v);

// ---- known-bad planners (negative controls) -------------------------------------------------------------------
const slim = (it) => ({
  id: it.id,
  source: it.source,
  title: it.title,
  domain: it.domain,
  minutes: it.minutes,
  standards: it.standards,
  dependsOn: it.dependsOn,
});
/** Ignores the cap: pours every candidate into the days in order. */
function overfillPlanner(candidates, params) {
  const items = priceCandidates(candidates, params);
  const per = Math.ceil(items.length / params.days);
  const days = Array.from({ length: params.days }, (_, i) => {
    const list = items.slice(i * per, (i + 1) * per).map(slim);
    return {
      day: i + 1,
      date: null,
      cap: params.block,
      minutes: list.reduce((n, it) => n + it.minutes, 0),
      items: list,
    };
  });
  return { params, days, dropped: [] };
}
/** Real plan, but the dropped list is thrown away. */
const silentDropPlanner = (candidates, params) => ({
  ...planWeek(candidates, params),
  dropped: [],
});
/** Real plan with the days reversed, so dependencies come after what needs them. */
function backwardsPlanner(candidates, params) {
  const plan = planWeek(candidates, params);
  return {
    ...plan,
    days: [...plan.days]
      .reverse()
      .map((d, i) => ({ ...d, day: i + 1, items: [...d.items].reverse() })),
  };
}
/** Real plan whose drop reasons are all "low_priority" (lies about too_long / needs_dropped). */
const liarPlanner = (candidates, params) => {
  const plan = planWeek(candidates, params);
  return { ...plan, dropped: plan.dropped.map((d) => ({ ...d, code: "low_priority" })) };
};

async function main() {
  const inputs = new Map();
  for (const u of BCPSS_UNITS) inputs.set(u.id, await loadWeekInputs({}, u.id));
  assert.equal(inputs.size, 162, "162 units in the seed");
  const probe = inputs.get("g6-math-u1");

  // -- controls ----------------------------------------------------------------------------------------------
  const probeParams = mk("g6-math-u1", "mid", 45, 3);
  const good = checkPlan(planWeek(probe.candidates, probeParams), probe.candidates);
  if (good.length) return fail3(`known-good plan was flagged: ${codes(good)}`);
  const controls = [
    ["overfill", overfillPlanner, "DAY_OVER_CAP"],
    ["silent drop", silentDropPlanner, "UNACCOUNTED"],
    ["backwards", backwardsPlanner, "DEP_ORDER"],
    ["lying reasons", liarPlanner, "DROP_REASON"],
  ];
  for (const [name, planner, expect] of controls) {
    let found = [];
    for (const block of BLOCK_MINUTES) {
      const p = mk("g6-math-u1", "early", block, 5);
      found = found.concat(checkPlan(planner(probe.candidates, p), probe.candidates));
    }
    if (!codes(found).includes(expect))
      return fail3(`negative control "${name}" did not raise ${expect} (got ${codes(found)})`);
  }
  console.log(
    "controls ok: known-good passes; overfill, silent drop, backwards, lying reasons all flagged",
  );

  // -- unit-level properties ---------------------------------------------------------------------------------
  assert.deepEqual(
    allocateMinutes(25, ["a", "b", "c"], { a: 4, b: 4, c: 4 }),
    [9, 8, 8],
    "largest remainder, earlier first",
  );
  assert.equal(allocateMinutes(20, ["x"], { x: 1 })[0], 20);
  assert.equal(parseSearch("unit=g6-math-u1&block=50").ok, false, "block must be 45/60/90");
  assert.equal(parseSearch("unit=g6-math-u1&days=6").ok, false, "days 1-5");
  assert.equal(parseSearch("unit=g6-math-u1&b12=0&b34=0&b56=0").ok, false, "empty mix refused");
  assert.equal(parseSearch("unit=../x").ok, false, "unit id shape");
  assert.equal(parseSearch("unit=g6-math-u1&cal=1").ok, false, "cal needs start");
  assert.equal(parseSearch("unit=g6-math-u1&start=2026-02-30").ok, false, "real dates only");
  assert.equal(
    pickDates(null, "2026-11-27", 3).join(),
    "2026-11-27,2026-11-30,2026-12-01",
    "weekdays skip the weekend",
  );
  const synthetic = [
    {
      id: "a",
      source: "lesson",
      title: "A",
      domain: "Lesson",
      baseMinutes: 50,
      arc: 0,
      standards: [],
      newStandards: 0,
      domainRank: 0,
      dependsOn: null,
      order: 0,
    },
    {
      id: "b",
      source: "lesson",
      title: "B",
      domain: "Lesson",
      baseMinutes: 20,
      arc: 0.5,
      standards: [],
      newStandards: 0,
      domainRank: 0,
      dependsOn: "a",
      order: 1,
    },
    {
      id: "c",
      source: "pack",
      title: "C",
      domain: "Reading",
      baseMinutes: 20,
      arc: 1,
      standards: [],
      newStandards: 0,
      domainRank: 0,
      dependsOn: null,
      order: 2,
    },
  ];
  const tiny = planWeek(synthetic, mk("x-1", "mid", 45, 1));
  assert.deepEqual(
    tiny.dropped.map((d) => [d.id, d.code]),
    [
      ["a", "too_long"],
      ["b", "needs_dropped"],
    ],
    "too long, then its dependent",
  );
  assert.deepEqual(checkPlan(tiny, synthetic), [], "tiny plan checks clean");

  // -- the sweep ---------------------------------------------------------------------------------------------
  const findings = [];
  const dayMinutes = [];
  const byBlock = new Map(BLOCK_MINUTES.map((b) => [b, []]));
  const times = [];
  let plans = 0;
  let emptyDays = 0;
  let droppedTotal = 0;
  let keptTotal = 0;
  for (const u of BCPSS_UNITS) {
    const { candidates, unit } = inputs.get(u.id);
    for (const mix of Object.keys(MIXES)) {
      for (const block of BLOCK_MINUTES) {
        for (const days of DAY_COUNTS) {
          const params = mk(u.id, mix, block, days);
          const t0 = performance.now();
          const plan = planWeek(candidates, params, { unit });
          times.push(performance.now() - t0);
          plans += 1;
          for (const f of checkPlan(plan, candidates))
            findings.push({ unit: u.id, mix, block, days, ...f });
          if (stable(plan) !== stable(planWeek(candidates, params, { unit }))) {
            findings.push({ unit: u.id, mix, block, days, code: "NONDETERMINISTIC" });
          }
          for (const d of plan.days) {
            dayMinutes.push(d.minutes);
            byBlock.get(block).push(d.minutes);
            if (!d.items.length) emptyDays += 1;
          }
          droppedTotal += plan.dropped.length;
          keptTotal += plan.days.reduce((n, d) => n + d.items.length, 0);
        }
      }
    }
  }
  // A non-zero seed changes tie-breaks only: still valid, and still identical on a re-run.
  for (const u of BCPSS_UNITS.slice(0, 40)) {
    const { candidates, unit } = inputs.get(u.id);
    const params = mk(u.id, "mid", 60, 5, 424242);
    const a = planWeek(candidates, params, { unit });
    if (stable(a) !== stable(planWeek(candidates, params, { unit })))
      findings.push({ unit: u.id, code: "NONDETERMINISTIC_SEED" });
    for (const f of checkPlan(a, candidates)) findings.push({ unit: u.id, seed: 424242, ...f });
  }
  if (findings.length) {
    console.error(`FAIL planner-core: ${findings.length} finding(s). First 10:`);
    for (const f of findings.slice(0, 10)) console.error(`  ${stable(f)}`);
    return 1;
  }
  if (plans !== 162 * 3 * 3 * DAY_COUNTS.length)
    return fail3(`swept ${plans} plans, expected ${162 * 9 * DAY_COUNTS.length}`);
  if (emptyDays > 0)
    return fail3(`${emptyDays} plan days came out empty; the planner is not packing`);

  const sorted = [...dayMinutes].sort((a, b) => a - b);
  const q = (arr, p) => arr[Math.min(arr.length - 1, Math.floor(arr.length * p))];
  const ts = [...times].sort((a, b) => a - b);
  console.log(
    `PASS planner-core: ${plans} plans (162 units x 3 mixes x 3 blocks x days ${DAY_COUNTS.join("/")}), 0 findings`,
  );
  console.log(
    `workload: median ${q(sorted, 0.5)} planned min/day (p10 ${q(sorted, 0.1)}, p90 ${q(sorted, 0.9)}); kept ${keptTotal} items, dropped ${droppedTotal} items across the sweep`,
  );
  for (const [block, list] of byBlock) {
    const s = [...list].sort((a, b) => a - b);
    console.log(
      `  block ${block}: median ${q(s, 0.5)} min/day, ${Math.round((100 * q(s, 0.5)) / block)}% of the block`,
    );
  }
  console.log(
    `compute: median ${q(ts, 0.5).toFixed(2)} ms/plan, p95 ${q(ts, 0.95).toFixed(2)} ms, max ${ts.at(-1).toFixed(2)} ms`,
  );
  return 0;
}

function fail3(msg) {
  console.error(`BROKEN GATE planner-core: ${msg}`);
  return 3;
}

main().then(
  (code) => process.exit(code),
  (err) => {
    if (err?.name === "AssertionError") {
      console.error(`FAIL planner-core: ${err.message}`);
      process.exit(1);
    }
    console.error("BROKEN GATE planner-core:", err);
    process.exit(3);
  },
);

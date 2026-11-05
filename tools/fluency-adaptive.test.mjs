// Adaptive engine: five tiers, per-answer ability, continuous diagnostic, prerequisite rescue, spaced review.
// Learner profiles run through thousands of answers; expected values are computed here, not by the engine.
import assert from "node:assert/strict";

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: { getItem: () => null, setItem() {}, removeItem() {} },
});
Object.defineProperty(globalThis, "window", { configurable: true, value: globalThis });
const { chooseTier, nextTier, tierEvidence, tierToLevel, levelToTier, tierOf, START_TIER } =
  await import("../math/fluency-lab/difficulty-levels.js");
const { abilityEstimate, updateAbility, emptyAbility } = await import(
  "../math/fluency-lab/ability.js"
);
const { adaptiveItem } = await import("../math/fluency-lab/adaptive-item.js");
const {
  DAY,
  ALL_SKILLS,
  dailyPlan,
  emptyTutor,
  evidence,
  findSkill,
  recordAnswer,
  sanitizeTutor,
  skillKey,
} = await import("../math/fluency-lab/tutor-engine.js").then(async (m) => ({
  ...m,
  ALL_SKILLS: (await import("../math/fluency-lab/problem-bank.js")).ALL_SKILLS,
}));
const { masteryScore, masteryState } = await import("../math/fluency-lab/mastery-model.js");
const { checkupAdvice, diagnosticProfile, nextSteps, prerequisiteGaps } = await import(
  "../math/fluency-lab/diagnostic-engine.js"
);
const rescue = await import("../math/fluency-lab/rescue.js");
const { rescueBlock, RESCUE_LIMITS, sanitizeRescues } = await import(
  "../math/fluency-lab/rescue-history.js"
);
const { setLang, t } = await import("../math/fluency-lab/i18n.js");
const { ES_LAB4_ADAPTIVE } = await import("../math/fluency-lab/i18n-es-lab4-adaptive.js");

let checks = 0;
const ok = (condition, message) => {
  checks += 1;
  assert.ok(condition, message);
};
const eq = (actual, expected, message) => {
  checks += 1;
  assert.deepEqual(actual, expected, message);
};
const mulberry = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
  return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
};
const skill = findSkill("4:division");
const T0 = new Date(2026, 8, 1, 9).getTime();

// ---- learner profiles -------------------------------------------------------------------------------------
// correct(tier): chance of a right answer on the first try; hint: chance the learner opens a hint before answering.
const PROFILES = {
  strong: { correct: [0, 0.99, 0.98, 0.96, 0.9, 0.82], hint: 0 },
  slipProne: { correct: [0, 0.92, 0.92, 0.92, 0.92, 0.92], hint: 0 },
  gap: { correct: [0, 0.85, 0.6, 0.3, 0.15, 0.05], hint: 0 },
  guesser: { correct: [0, 0.05, 0.05, 0.05, 0.05, 0.05], hint: 0 },
  hintDependent: { correct: [0, 0.9, 0.9, 0.9, 0.9, 0.9], hint: 0.85 },
};

// Mirrors the app: tier 1 is always supported work; a hint before the first answer is never independent.
function play(profile, count, { tutor = emptyTutor(), start = T0, seed = 1, key = skill } = {}) {
  const rng = mulberry(seed);
  let now = start;
  const tiers = [];
  for (let i = 0; i < count; i += 1) {
    const record = tutor.records[skillKey(key)];
    const tier = nextTier(record, now);
    const hinted = rng() < profile.hint;
    const independent = tier >= 2 && !hinted;
    const p = hinted ? 0.9 : profile.correct[tier];
    recordAnswer(tutor, key, { correct: rng() < p, independent, tier, sig: `${seed}-${i}` }, now);
    tiers.push(tier);
    now += 4 * 60000 + (i % 20 === 19 ? DAY : 0);
  }
  return { tutor, tiers, end: now };
}
const reversals = (tiers) => {
  const moves = tiers
    .map((tier, i) => [i, Math.sign(tier - (tiers[i - 1] ?? tier))])
    .filter(([, move]) => move);
  let quick = 0;
  let total = 0;
  for (let i = 1; i < moves.length; i += 1)
    if (moves[i][1] !== moves[i - 1][1]) {
      total += 1;
      if (moves[i][0] - moves[i - 1][0] < 3) quick += 1;
    }
  return { total, quick, moves: moves.length };
};
const mean = (list) => list.reduce((a, b) => a + b, 0) / list.length;

// ---- tiers ------------------------------------------------------------------------------------------------
eq(
  [1, 2, 3, 4, 5].map(tierToLevel),
  [0, 0, 1, 2, 2],
  "tiers 1-2 use level 0, 3 level 1, 4-5 level 2",
);
eq([0, 1, 2].map(levelToTier), [1, 3, 4], "old level entries map onto tiers");
eq(chooseTier({ entries: [] }).tier, START_TIER, "a new skill starts at tier 1");
ok(
  tierOf({ level: 1 }) === 3 && tierOf({ level: 1, tier: 5 }) === 5,
  "an entry's tier wins over its level",
);

for (const [name, profile] of Object.entries(PROFILES)) {
  const sim = play(profile, 3000, { seed: name.length });
  const swing = reversals(sim.tiers);
  ok(
    sim.tiers.every((tier) => tier >= 1 && tier <= 5),
    `${name}: tiers stay in range`,
  );
  ok(
    sim.tiers.every((tier, i) => i === 0 || Math.abs(tier - sim.tiers[i - 1]) <= 1),
    `${name}: never more than one tier per answer`,
  );
  ok(
    swing.quick === 0,
    `${name}: no tier whiplash (a reversal within 3 answers): ${JSON.stringify(swing)}`,
  );
  sim.profileName = name;
  PROFILES[name].sim = sim;
}
const avg = (name) => mean(PROFILES[name].sim.tiers);
if (process.env.ADAPTIVE_DEBUG)
  for (const name of Object.keys(PROFILES))
    console.log(name, avg(name).toFixed(2), JSON.stringify(reversals(PROFILES[name].sim.tiers)));
ok(
  PROFILES.strong.sim.tiers.slice(0, 60).some((tier) => tier >= 4),
  "strong learner reaches multi-step reasoning quickly",
);
ok(avg("strong") >= 4, `strong learner lives at tier 4+ (mean ${avg("strong").toFixed(2)})`);
ok(
  avg("slipProne") >= 3.5 && avg("slipProne") <= 5,
  `slip-prone learner is not thrown to the floor (mean ${avg("slipProne").toFixed(2)})`,
);
ok(
  reversals(PROFILES.slipProne.sim.tiers).total / 3000 < 0.03,
  `slip-prone learner: few direction reversals (${JSON.stringify(reversals(PROFILES.slipProne.sim.tiers))})`,
);
ok(
  avg("gap") < avg("slipProne") && avg("gap") <= 3,
  `prerequisite-gap learner settles low (mean ${avg("gap").toFixed(2)})`,
);
ok(avg("guesser") <= 1.6, `guesser stays at the floor (mean ${avg("guesser").toFixed(2)})`);
ok(
  avg("hintDependent") <= 2.6,
  `hint-dependent learner is not pushed up (mean ${avg("hintDependent").toFixed(2)})`,
);
ok(
  reversals(PROFILES.hintDependent.sim.tiers).total / 3000 < 0.05,
  "hint-dependent learner does not oscillate",
);

// Mastery cannot be gamed by hints, guessing or repeating one problem.
{
  const hintTutor = PROFILES.hintDependent.sim.tutor;
  ok(
    !["proficient", "mastered"].includes(
      masteryState(hintTutor.records[skillKey(skill)], PROFILES.hintDependent.sim.end),
    ),
    "3000 answers with hints never read as proficient",
  );
  ok(
    !evidence(hintTutor, skill, PROFILES.hintDependent.sim.end).secure,
    "hint-dependent work is not independently secure",
  );
  const guessTutor = PROFILES.guesser.sim.tutor;
  ok(
    masteryScore(guessTutor.records[skillKey(skill)], PROFILES.guesser.sim.end) < 40,
    "guessing does not build a mastery score",
  );
  const repeat = emptyTutor();
  for (let i = 0; i < 500; i += 1)
    recordAnswer(
      repeat,
      skill,
      { correct: true, independent: true, tier: 3, sig: "same-problem" },
      T0 + i * 1000,
    );
  ok(
    !["proficient", "mastered"].includes(
      masteryState(repeat.records[skillKey(skill)], T0 + 600000),
    ),
    "one problem repeated 500 times is one piece of evidence",
  );
  const level0 = emptyTutor();
  for (let i = 0; i < 40; i += 1)
    recordAnswer(
      level0,
      skill,
      { correct: true, independent: true, tier: 1, sig: `e${i}` },
      T0 + i * DAY,
    );
  ok(
    masteryScore(level0.records[skillKey(skill)], T0 + 40 * DAY) <= 50,
    "easy picture-first work alone stays below proficient",
  );
}

// Returning after 30 days: restart a tier lower, then earn it back; one answer later the break no longer applies.
{
  const sim = play(PROFILES.strong, 60, { seed: 7 });
  const record = sim.tutor.records[skillKey(skill)];
  const last = tierOf(record.recent.at(-1));
  ok(last >= 4, "setup: the strong learner had reached tier 4+");
  const back = chooseTier(tierEvidence(record, sim.end + 30 * DAY));
  eq([back.tier, back.reason], [last - 1, "returning"], "30 days away: one tier lower");
  eq(
    chooseTier(tierEvidence(record, sim.end + 90 * DAY)).tier,
    Math.max(1, last - 2),
    "90 days away: two tiers lower",
  );
  eq(
    chooseTier(tierEvidence(record, sim.end + 3 * DAY)).reason === "returning",
    false,
    "3 days away is not a break",
  );
  const resumed = play(PROFILES.strong, 30, {
    tutor: sim.tutor,
    start: sim.end + 30 * DAY,
    seed: 8,
  });
  ok(
    resumed.tiers[0] === last - 1 && resumed.tiers.slice(0, 40).every((tier) => tier >= last - 1),
    "after a break the learner restarts lower and does not fall further",
  );
}

// Items: every skill gets a valid item at every tier, carrying tier and level.
{
  const rng = mulberry(5);
  for (const entry of ALL_SKILLS.filter((candidate) => candidate.grade >= 1))
    for (let tier = 1; tier <= 5; tier += 1) {
      const item = adaptiveItem(entry, rng, tier);
      ok(
        item.tier === tier &&
          item.level === tierToLevel(tier) &&
          item.question &&
          item.answers.length,
        `${skillKey(entry)} tier ${tier} yields an item`,
      );
    }
}

// ---- ability estimate -------------------------------------------------------------------------------------
{
  let worst = 0;
  const means = {};
  for (const p of [0.3, 0.6, 0.9]) {
    const errors = [];
    for (let seed = 1; seed <= 20; seed += 1) {
      const rng = mulberry(seed * 31);
      let ability = emptyAbility();
      for (let i = 0; i < 100; i += 1)
        ability = updateAbility(
          ability,
          { correct: rng() < p, independent: true, tier: 3 },
          T0 + i * 60000,
        );
      errors.push(abilityEstimate(ability, T0 + 100 * 60000).p - p);
    }
    means[p] = mean(errors);
    worst = Math.max(worst, ...errors.map(Math.abs));
  }
  ok(worst < 0.22, `ability estimate converges to the true rate (worst error ${worst.toFixed(3)})`);
  ok(
    Object.values(means).every((bias) => Math.abs(bias) < 0.06),
    `ability estimate is unbiased (${JSON.stringify(means)})`,
  );
  let helped = emptyAbility();
  for (let i = 0; i < 200; i += 1)
    helped = updateAbility(helped, { correct: true, independent: false, tier: 3 }, T0 + i * 60000);
  ok(
    abilityEstimate(helped, T0 + 200 * 60000).p < 0.5,
    "right answers with help never read as independent ability",
  );
  let rest = emptyAbility();
  for (let i = 0; i < 40; i += 1)
    rest = updateAbility(rest, { correct: true, independent: true, tier: 3 }, T0 + i * 60000);
  const sharp = abilityEstimate(rest, T0 + 40 * 60000);
  const later = abilityEstimate(rest, T0 + 400 * DAY);
  ok(later.weight < sharp.weight / 4 && later.p < sharp.p, "a long rest widens the estimate");
  ok(
    abilityEstimate(null).p === null && abilityEstimate(emptyAbility()).p === null,
    "no answers means no estimate",
  );
}

// ---- diagnostic: observed vs inferred, coverage, recommendations ----------------------------------------------
const grade4 = ALL_SKILLS.filter((entry) => entry.grade === 4);
function practise(tutor, entry, answers, start) {
  answers.forEach(([correct, independent], i) =>
    recordAnswer(
      tutor,
      entry,
      { correct, independent, tier: 3, sig: `${skillKey(entry)}-${start}-${i}` },
      start + i * 60000,
    ),
  );
}
{
  const now = T0 + 10 * DAY;
  const tutor = emptyTutor();
  const division = findSkill("4:division");
  // 7 independent tries: 3 right, plus 2 hinted ones that must not be counted as independent.
  practise(
    tutor,
    division,
    [
      [true, true],
      [false, true],
      [false, true],
      [true, true],
      [false, true],
      [false, true],
      [true, true],
      [true, false],
      [true, false],
    ],
    T0,
  );
  const lastAt = T0 + 8 * 60000;
  const steps = nextSteps(tutor, 4, now, 5);
  const step = steps.find(
    (entry) => entry.evidence.goal === "4:division" || entry.skill === division,
  );
  ok(step, "a struggling skill produces a recommendation");
  eq(
    [step.evidence.independent, step.evidence.correct, step.evidence.lastAt],
    [7, 3, lastAt],
    "evidence cites the real independent counts and last date",
  );
  ok(
    step.evidence.summary.includes("3 of 7") &&
      step.evidence.summary.includes(new Date(lastAt).getDate().toString()),
    "the summary text states the counts and the date",
  );
  ok(
    typeof step.reason === "string" &&
      step.reason.length > 20 &&
      !/undefined|NaN|\{/.test(step.reason),
    "reason is plain language",
  );
  const gaps = prerequisiteGaps(tutor, division, now);
  eq(
    gaps.map((gap) => [gap.key, gap.kind]),
    [["3:division-facts", "inferred"]],
    "an unobserved prerequisite is inferred, never observed",
  );
  ok(gaps[0].estimate === null, "an inferred gap carries no invented estimate");
  practise(
    tutor,
    findSkill("3:division-facts"),
    [
      [false, true],
      [false, true],
      [true, true],
      [false, true],
    ],
    T0 + DAY,
  );
  const observedGap = prerequisiteGaps(tutor, division, now)[0];
  eq(
    [observedGap.kind, observedGap.independent, observedGap.correct],
    ["observed", 4, 1],
    "once the prerequisite is practiced its gap is observed with its counts",
  );
  const profile = diagnosticProfile(tutor, 4, now);
  ok(
    profile.observed.every((entry) => entry.kind === "observed" && Number.isFinite(entry.estimate)),
    "observed entries are observed and carry estimates",
  );
  ok(
    profile.inferred.every(
      (entry) => entry.kind === "inferred" && entry.estimate === null && entry.basis.length,
    ),
    "inferred entries say so, cite their basis and carry no estimate",
  );
  ok(
    !profile.inferred.some((entry) => profile.observed.some((seen) => seen.key === entry.key)),
    "no skill is both observed and inferred",
  );
  // A secure skill implies its same-grade foundations, labelled inferred.
  const secured = emptyTutor();
  practise(
    secured,
    findSkill("4:multiply-2digit"),
    Array.from({ length: 12 }, () => [true, true]),
    T0,
  );
  const implied = diagnosticProfile(secured, 4, T0 + DAY).inferred;
  ok(
    implied.every((entry) => entry.status === "likely-secure"),
    "foundations of a secure skill are likely-secure (inferred)",
  );
  const strand = diagnosticProfile(secured, 4, T0 + DAY).strands;
  ok(
    strand.length === 1 && strand[0].kind === "observed" && strand[0].estimate > 0.8,
    "strand estimates come from observed skills only",
  );
}
{
  const now = T0 + 10 * DAY;
  const fresh = emptyTutor();
  const first = checkupAdvice(fresh, 4, now);
  ok(
    first.offer && first.evidence.covered === 0 && first.reason.includes(String(grade4.length)),
    "no evidence yet: a checkup is offered, with the count",
  );
  const covered = emptyTutor();
  for (const entry of grade4)
    practise(
      covered,
      entry,
      Array.from({ length: 4 }, () => [true, true]),
      now - 3 * DAY,
    );
  const skipped = checkupAdvice(covered, 4, now);
  ok(
    !skipped.offer &&
      skipped.evidence.covered === grade4.length &&
      skipped.reason.includes(`${grade4.length} of ${grade4.length}`),
    "recent practice covers the grade: no checkup, and it says why with counts",
  );
  const partial = emptyTutor();
  for (const entry of grade4.slice(0, 3))
    practise(
      partial,
      entry,
      Array.from({ length: 4 }, () => [true, true]),
      now - DAY,
    );
  const part = checkupAdvice(partial, 4, now);
  ok(
    part.offer && part.evidence.covered === 3 && part.evidence.skip.length === 3,
    "partial coverage still offers a checkup and cites what is covered",
  );
  const took = emptyTutor();
  took.diagnostics[4] = { at: now - 2 * DAY, results: {}, foundations: {} };
  const recent = checkupAdvice(took, 4, now);
  ok(
    !recent.offer &&
      recent.evidence.lastCheckupAt === now - 2 * DAY &&
      recent.reason.includes("2026"),
    "a checkup from this fortnight is not repeated, and the date is cited",
  );
}

// ---- spaced review ----------------------------------------------------------------------------------------
{
  const tutor = emptyTutor();
  const [a, b, c, d] = grade4.slice(0, 4);
  const ladder = { 1: 1, 3: 2, 7: 3, 14: 4, 30: 5 };
  for (const [entry, interval] of [
    [a, 1],
    [b, 3],
    [c, 7],
    [d, 14],
  ]) {
    practise(tutor, entry, [[true, true]], T0);
    tutor.records[skillKey(entry)].interval = interval;
    tutor.records[skillKey(entry)].dueAt = T0 + interval * DAY;
  }
  const status = evidence(tutor, c, T0 + 8 * DAY);
  eq(
    [status.reviewDueAt, status.reviewStep],
    [T0 + 7 * DAY, ladder[7]],
    "evidence exposes reviewDueAt and the ladder step",
  );
  eq(evidence(tutor, grade4[10], T0).reviewStep, 0, "a skill not on the ladder is step 0");
  const now = T0 + 20 * DAY;
  const plan = dailyPlan(tutor, 4, now);
  const keys = plan.map((entry) => entry.key);
  ok(
    [a, b, c, d].every((entry) => keys.includes(skillKey(entry))),
    "daily practice includes every due review",
  );
  ok(
    plan.filter((entry) => entry.reviewDueAt).every((entry) => entry.reviewStep >= 1),
    "due entries say which step of the ladder they are",
  );
  const due = nextSteps(tutor, 4, now, 10).filter((step) => step.evidence.reviewDueAt);
  ok(
    due.length >= 3 &&
      due.every(
        (step) => step.reason.includes("step") && step.evidence.summary.includes("review due"),
      ),
    "recommendations cite the review ladder and the due date",
  );
}

// ---- adaptive WonderMix ----------------------------------------------------------------------------
{
  const fresh = emptyTutor();
  const first = dailyPlan(fresh, 3, T0);
  eq(first.length, 10, "WonderMix keeps the simple ten-problem student session");
  eq(
    first.map((entry) => entry.category),
    dailyPlan(fresh, 3, T0).map((entry) => entry.category),
    "same evidence and day produce a stable mix",
  );
  eq(
    first.filter((entry) => entry.category === "target").length,
    7,
    "fresh learners get focused target practice without fabricated retrieval evidence",
  );
  eq(
    first.filter((entry) => entry.category === "retrieval").length,
    0,
    "retrieval is omitted until the learner has something previously practiced",
  );
  eq(
    first.filter((entry) =>
      ["transfer", "stretch", "independent", "explore"].includes(entry.category),
    ).length,
    3,
    "the session includes contextual transfer, prerequisite-ready exploration, and an independent application",
  );
  const firstTransfer = first.find((entry) => entry.category === "transfer");
  ok(firstTransfer.transfer, "the transfer item is explicitly marked for contextual generation");
  eq(firstTransfer.key, first[0].key, "transfer keeps the focus skill and changes its context");
  ok(
    firstTransfer.independent && firstTransfer.tier === 3,
    "transfer is an independent grade-level check",
  );
  ok(
    firstTransfer.generated?.story,
    "the transfer task is a prepared contextual problem, not a renamed question",
  );
  ok(
    first
      .filter((entry) => entry.category === "target")
      .slice(2)
      .every((entry) => entry.tier === 3),
    "later target questions fade support and request grade-level independent work",
  );

  const learner = emptyTutor();
  learner.diagnostics[3] = { at: T0, results: { "3:area": false } };
  for (const [index, sig] of ["base-miss-a", "base-miss-b"].entries())
    recordAnswer(
      learner,
      findSkill("3:mul-0-5"),
      { correct: false, independent: true, level: 1, sig },
      T0 + index * 1000,
    );
  const adaptive = dailyPlan(learner, 3, T0 + DAY);
  eq(
    adaptive.filter((entry) => entry.category === "target").length,
    4,
    "a detected foundation need trims repeated target items and uses unsupported transfer time for the focus skill",
  );
  const repairs = adaptive.filter((entry) => entry.category === "repair");
  eq(repairs.length, 3, "a probable prerequisite gap allocates three targeted repair problems");
  ok(
    repairs.every((entry) => entry.key === "3:mul-0-5"),
    "repair problems target the evidenced multiplication prerequisite",
  );
  ok(
    adaptive.filter((entry) => entry.category === "retrieval").length === 2,
    "retrieval stays in the mix during prerequisite repair",
  );
  ok(repairs.at(-1).independent, "the final repair problem fades support for independent evidence");
  ok(
    adaptive.filter((entry) => entry.category === "retrieval").every((entry) => entry.independent),
    "retrieval checks begin independently",
  );

  const crossGrade = emptyTutor();
  crossGrade.diagnostics[4] = { at: T0, results: { "4:multiply-1digit": false } };
  crossGrade.diagnostics[3] = { at: T0, results: { "3:mul-6-9": false } };
  const crossGradePlan = dailyPlan(crossGrade, 4, T0 + DAY);
  ok(
    crossGradePlan.some((entry) => entry.category === "repair" && entry.key === "3:mul-6-9"),
    "a prerequisite gap in an earlier grade automatically enters the learner's mix",
  );
  ok(
    crossGradePlan
      .filter((entry) => entry.category === "repair")
      .every((entry) => entry.unlocks === "4:multiply-1digit"),
    "a learner can see the grade-level skill the prerequisite repair supports",
  );

  const noStoryTransfer = dailyPlan(emptyTutor(), 0, T0);
  eq(noStoryTransfer.length, 10, "a grade without a valid story variant still gets ten tasks");
  ok(
    noStoryTransfer.every((entry) => entry.category !== "transfer"),
    "the plan does not label an unchanged problem as transfer",
  );
}

// ---- saves --------------------------------------------------------------------------------------------------
{
  const old = {
    version: 2,
    mistakes: [],
    diagnostics: {},
    sessions: [],
    records: {
      "4:division": {
        recent: [
          { correct: true, independent: true, at: T0, level: 1 },
          { correct: false, independent: true, at: T0 + 1, level: 0 },
        ],
        independentTotal: 2,
        supportedTotal: 0,
        interval: 1,
        dueAt: T0 + DAY,
      },
    },
  };
  const loaded = sanitizeTutor(old);
  eq(
    loaded.records["4:division"].recent.map((entry) => entry.tier),
    [undefined, undefined],
    "old entries load without a tier",
  );
  eq(loaded.rescues, [], "old saves load with an empty rescue log");
  ok(
    !("ability" in loaded.records["4:division"]),
    "an old save is not given a made-up stored ability",
  );
  ok(
    Number.isFinite(diagnosticProfile(loaded, 4, T0 + DAY).observed[0].estimate),
    "...but its estimate is replayed from its answers",
  );
  eq(
    nextTier(loaded.records["4:division"], T0 + 2),
    nextTier(old.records["4:division"], T0 + 2),
    "tier choice reads old entries through their level",
  );
  const grown = PROFILES.slipProne.sim.tutor;
  grown.rescues = [{ goal: "4:division", prereq: "3:division-facts", at: T0, outcome: "verified" }];
  const again = sanitizeTutor(JSON.parse(JSON.stringify(grown)));
  eq(again, sanitizeTutor(again), "a new save round-trips exactly");
  eq(
    [
      again.records["4:division"].ability,
      again.records["4:division"].recent.map((entry) => entry.tier),
    ],
    [
      grown.records["4:division"].ability,
      grown.records["4:division"].recent.map((entry) => entry.tier),
    ],
    "stored tier and ability survive the round trip",
  );
  ok(
    again.records["4:division"].recent.every((entry) => entry.tier >= 1 && entry.tier <= 5),
    "stored entries keep their tier",
  );
  const dirty = sanitizeTutor({
    ...old,
    records: {
      "4:division": {
        ...old.records["4:division"],
        ability: { a: NaN, b: 4, n: 3 },
        recent: [
          { correct: true, independent: true, at: T0, level: 1, tier: 9 },
          { correct: true, independent: false, at: T0 + 1, level: 1, tier: 2 },
        ],
      },
    },
    rescues: [
      { goal: "nope", prereq: "3:division-facts", at: 1, outcome: "verified" },
      { goal: "4:division", prereq: "3:division-facts", at: 5, outcome: "weird" },
      { goal: "4:division", prereq: "3:division-facts", at: 5, outcome: "left" },
    ],
  });
  eq(
    dirty.records["4:division"].recent.map((entry) => entry.tier),
    [undefined, 2],
    "an out-of-range tier is dropped, a valid one kept",
  );
  ok(!("ability" in dirty.records["4:division"]), "a corrupt ability is dropped");
  eq(dirty.rescues.length, 1, "only well-formed rescue entries survive");
  eq(sanitizeRescues("not a list"), [], "a non-list rescue log is empty");
}

// ---- rescue: choosing the prerequisite ----------------------------------------------------------------------
const missRun = (tutor, key, count, start, { independent = true } = {}) => {
  for (let i = 0; i < count; i += 1)
    recordAnswer(
      tutor,
      findSkill(key),
      { correct: false, independent, tier: 3, sig: `m${key}${start}${i}` },
      start + i * 60000,
    );
};
const addMistake = (tutor, key, category, at) =>
  tutor.mistakes.unshift({ id: `${at}`, key, question: `q${at}`, category, at, resolvedAt: null });
{
  const now = T0 + 5 * DAY;
  const pick = (tutor, goal, category = null) =>
    rescue.pickPrerequisite(tutor, findSkill(goal), { category, now })?.prereq &&
    skillKey(rescue.pickPrerequisite(tutor, findSkill(goal), { category, now }).prereq);
  const blank = emptyTutor();
  eq(
    pick(blank, "5:fraction-add"),
    "4:fraction-equiv",
    "fraction addition rests on equivalent fractions",
  );
  eq(pick(blank, "6:ratios", "addedFactors"), "3:mul-0-5", "ratios rest on multiplication facts");
  eq(
    pick(blank, "8:slope"),
    "7:integer-add",
    "with no evidence the first authored prerequisite is chosen",
  );
  eq(
    pick(blank, "8:slope", "swappedCoordinates"),
    "7:integer-add",
    "a coordinate slip points at the integer/coordinate prerequisite",
  );
  const weak = emptyTutor();
  practise(
    weak,
    findSkill("6:unit-rates"),
    [
      [false, true],
      [false, true],
      [true, true],
      [false, true],
    ],
    T0,
  );
  eq(
    pick(weak, "8:slope"),
    "6:unit-rates",
    "an observed-weak prerequisite beats an unobserved one",
  );
  const strongPre = emptyTutor();
  practise(
    strongPre,
    findSkill("4:fraction-equiv"),
    Array.from({ length: 8 }, () => [true, true]),
    T0,
  );
  eq(
    rescue.pickPrerequisite(strongPre, findSkill("5:fraction-add"), { now }),
    null,
    "a secure prerequisite is not a rescue target",
  );
  eq(
    rescue.pickPrerequisite(blank, findSkill("1:add-20"), { now }) &&
      skillKey(rescue.pickPrerequisite(blank, findSkill("1:add-20"), { now }).prereq),
    "1:make-10",
    "a skill with one authored foundation picks it",
  );
}

// ---- rescue: trigger ----------------------------------------------------------------------------------------
{
  const now = T0 + 5 * DAY;
  const goal = findSkill("5:fraction-add");
  const one = emptyTutor();
  missRun(one, "5:fraction-add", 1, now - 60000);
  eq(rescue.planRescue(one, goal, { now }), null, "one miss is not a pattern");
  const supported = emptyTutor();
  missRun(supported, "5:fraction-add", 3, now - 600000, { independent: false });
  eq(
    rescue.planRescue(supported, goal, { now }),
    null,
    "misses with full support are handled by the existing foundation boost, not a rescue",
  );
  const stuck = emptyTutor();
  missRun(stuck, "5:fraction-add", 2, now - 600000);
  const plan = rescue.planRescue(stuck, goal, { now });
  ok(
    plan && plan.goal === "5:fraction-add" && plan.prereq === "4:fraction-equiv",
    "two independent misses plan a rescue of the foundation",
  );
  const slips = emptyTutor();
  practise(
    slips,
    goal,
    Array.from({ length: 40 }, () => [true, true]),
    now - 3 * DAY,
  );
  recordAnswer(slips, goal, { correct: false, independent: true, tier: 3, sig: "x1" }, now - 2000);
  recordAnswer(slips, goal, { correct: false, independent: true, tier: 3, sig: "x2" }, now - 1000);
  eq(
    rescue.planRescue(slips, goal, { now }),
    null,
    "a learner who is usually right is slipping, not stuck",
  );
  addMistake(slips, "5:fraction-add", "addedDenominators", now - 5000);
  addMistake(slips, "5:fraction-add", "addedDenominators", now - 4000);
  ok(
    rescue.planRescue(slips, goal, { now })?.category === "addedDenominators",
    "a repeated misconception triggers even for a strong learner",
  );
  const rightNow = emptyTutor();
  missRun(rightNow, "5:fraction-add", 2, now - 600000);
  recordAnswer(
    rightNow,
    goal,
    { correct: true, independent: true, tier: 3, sig: "ok" },
    now - 1000,
  );
  eq(rescue.planRescue(rightNow, goal, { now }), null, "no rescue offer after a right answer");
}

// ---- rescue: the state machine ------------------------------------------------------------------------------
const PLAN = { goal: "5:fraction-add", prereq: "4:fraction-equiv", category: null };
const drive = (events) =>
  events.reduce((state, event) => rescue.rescueStep(state, event), rescue.startRescue(PLAN, T0));
{
  const happy = drive([
    { type: "accept" },
    { type: "lessonDone" },
    ...Array(3).fill({ type: "answer", correct: true, independent: false }),
    { type: "answer", correct: true, independent: true },
  ]);
  eq(
    [happy.phase, happy.outcome, happy.scaffold],
    ["return", "verified", null],
    "right independent check: verified, back to the goal",
  );
  const wrongCheck = drive([
    { type: "accept" },
    { type: "lessonDone" },
    ...Array(3).fill({ type: "answer", correct: false, independent: false }),
    { type: "answer", correct: false, independent: true },
  ]);
  eq(
    [wrongCheck.phase, wrongCheck.outcome, wrongCheck.scaffold],
    ["return", "not-yet", { key: "5:fraction-add", left: 3 }],
    "a missed check returns to the goal with scaffolds, not a loop",
  );
  const hinted = drive([
    { type: "accept" },
    { type: "lessonDone" },
    ...Array(3).fill({ type: "answer", correct: true, independent: false }),
    { type: "answer", correct: true, independent: false },
  ]);
  eq(hinted.outcome, "not-yet", "a right answer after a hint is not an independent verification");
  eq(drive([{ type: "decline" }]).outcome, "declined", "an offer can be declined");
  for (const phase of [
    [],
    [{ type: "accept" }],
    [{ type: "accept" }, { type: "lessonDone" }],
    [
      { type: "accept" },
      { type: "lessonDone" },
      ...Array(3).fill({ type: "answer", correct: true }),
    ],
  ]) {
    const left = drive([...phase, { type: "leave" }]);
    eq(
      [left.phase, left.outcome, left.goal],
      ["return", "left", PLAN.goal],
      "leaving from any phase returns to the goal",
    );
  }
  const rng = mulberry(11);
  const kinds = ["accept", "decline", "lessonDone", "answer", "leave", "bogus"];
  let longest = 0;
  for (let run = 0; run < 3000; run += 1) {
    let state = rescue.startRescue(PLAN, T0);
    let steps = 0;
    while (state.phase !== "return" && steps < 200) {
      const event = {
        type: kinds[Math.floor(rng() * kinds.length)],
        correct: rng() < 0.5,
        independent: rng() < 0.5,
      };
      const next = rescue.rescueStep(state, event);
      ok(
        next.goal === PLAN.goal && next.prereq === PLAN.prereq,
        "the goal never changes mid-rescue",
      );
      state = next;
      steps += 1;
    }
    longest = Math.max(longest, steps);
    ok(state.phase === "return", "every event stream ends at return");
    ok(state === rescue.rescueStep(state, { type: "accept" }), "return is terminal");
    ok(
      state.outcome !== "verified" || state.repairAnswered === 3,
      "verified only after the three repair problems",
    );
  }
  ok(longest < 200, `random streams finish (longest ${longest} events)`);
  const queue = rescue.rescueQueue(happy);
  eq(
    queue.map((entry) => entry.rescue),
    ["repair", "repair", "repair", "verify"],
    "three repair problems then one check",
  );
  ok(
    queue.every((entry) => entry.key === PLAN.prereq) &&
      queue.slice(0, 3).every((entry) => entry.tier <= 2 && entry.forceGuided) &&
      queue[3].independent === true &&
      queue[3].tier === 3,
    "repair is guided at tiers 1-2; the check is independent at grade level",
  );
  ok(
    /Fraction|fraction|equivalent/i.test(rescue.returnMessage(happy)) &&
      rescue.returnMessage(happy).includes(findSkill(PLAN.goal).title),
    "the return message names both skills",
  );
  const session = { rescueScaffold: { key: PLAN.goal, left: 3 } };
  eq(
    [1, 2, 3, 4, 5].map(() => rescue.consumeScaffold(session, PLAN.goal)),
    [true, true, true, false, false],
    "scaffolds last exactly three problems",
  );
  eq(
    rescue.consumeScaffold(session, "4:division"),
    false,
    "scaffolds apply only to the goal skill",
  );
}

// ---- rescue: caps and no endless remediation ------------------------------------------------------------------
{
  const goal = findSkill("6:unit-rates");
  const tutor = emptyTutor();
  let now = T0;
  const log = [];
  for (let day = 0; day < 240; day += 1) {
    now = T0 + day * DAY + 9 * 3600000;
    let sessionRescues = 0;
    for (let miss = 0; miss < 12; miss += 1) {
      recordAnswer(
        tutor,
        goal,
        { correct: false, independent: true, tier: 3, sig: `d${day}m${miss}` },
        now + miss * 60000,
      );
      const plan = rescue.planRescue(tutor, goal, {
        now: now + miss * 60000,
        sessionCount: sessionRescues,
      });
      if (!plan) continue;
      const state = drive0(plan, now + miss * 60000, false);
      rescue.recordRescue(tutor, state);
      sessionRescues += 1;
      log.push({ day, plan, state });
    }
  }
  function drive0(plan, at, pass) {
    return [
      { type: "accept" },
      { type: "lessonDone" },
      ...Array(3).fill({ type: "answer", correct: false, independent: false }),
      { type: "answer", correct: pass, independent: pass },
    ].reduce((state, event) => rescue.rescueStep(state, event), rescue.startRescue(plan, at));
  }
  const perDay = Object.groupBy(log, (entry) => entry.day);
  ok(
    Object.values(perDay).every((list) => list.length <= RESCUE_LIMITS.perSkillPerDay),
    "at most one rescue per skill per day, however many misses",
  );
  ok(log.length > 3, `rescues do happen for a stuck learner (${log.length})`);
  ok(
    log.every((entry) => entry.state.phase === "return" && entry.state.goal === "6:unit-rates"),
    "every rescue ends back at the goal",
  );
  const pairs = Object.groupBy(log, (entry) => `${entry.plan.goal}>${entry.plan.prereq}`);
  for (const list of Object.values(pairs))
    for (const anchor of list) {
      const within = list.filter(
        (entry) => entry.day >= anchor.day && entry.day < anchor.day + RESCUE_LIMITS.failedPairDays,
      ).length;
      ok(
        within <= RESCUE_LIMITS.failedPairLimit,
        "an unverified skill/prerequisite pair is offered at most twice per fortnight",
      );
    }
  ok(
    log.length <= 240 / 3,
    `remediation is bounded over 240 days of constant failure (${log.length} rescues)`,
  );
  ok(
    sanitizeTutor(JSON.parse(JSON.stringify(tutor))).rescues.length ===
      Math.min(log.length, RESCUE_LIMITS.keep),
    "the rescue log is stored and capped",
  );
  // session cap, day cap
  const history = [
    { goal: "7:equations", prereq: "6:one-step", at: T0, outcome: "left" },
    { goal: "8:slope", prereq: "7:integer-add", at: T0, outcome: "left" },
    { goal: "6:ratios", prereq: "3:mul-0-5", at: T0, outcome: "left" },
  ];
  eq(
    rescueBlock(history, "5:fraction-add", "4:fraction-equiv", T0 + 3600000, 0),
    "day-cap",
    "three rescues in a day is the limit",
  );
  eq(
    rescueBlock([], "5:fraction-add", "4:fraction-equiv", T0, RESCUE_LIMITS.perSession),
    "session-cap",
    "the session cap holds",
  );
  eq(
    rescueBlock(
      [{ goal: "5:fraction-add", prereq: "4:fraction-equiv", at: T0, outcome: "declined" }],
      "5:fraction-add",
      "4:fraction-equiv",
      T0 + 3600000,
      0,
    ),
    "skill-today",
    "a declined offer uses the day's one try",
  );
  eq(
    rescueBlock(
      [{ goal: "5:fraction-add", prereq: "4:fraction-equiv", at: T0, outcome: "declined" }],
      "5:fraction-add",
      "4:fraction-equiv",
      T0 + DAY,
      0,
    ),
    null,
    "the next day it can be offered again",
  );
}

// ---- rescue: a chain of gaps walks down, then back up ---------------------------------------------------------
{
  // 6:unit-rates -> 4:division -> 3:division-facts (authored edges). The learner lacks all three.
  const tutor = emptyTutor();
  const goal = findSkill("6:unit-rates");
  const picks = [];
  const outcomes = [false, true, true];
  outcomes.forEach((pass, index) => {
    const now = T0 + index * DAY + 9 * 3600000;
    missRun(tutor, "6:unit-rates", 3, now);
    const plan = rescue.planRescue(tutor, goal, { now: now + 4 * 60000 });
    picks.push(plan?.prereq);
    const state = [
      { type: "accept" },
      { type: "lessonDone" },
      ...Array(3).fill({ type: "answer", correct: true, independent: false }),
      { type: "answer", correct: pass, independent: pass },
    ].reduce((s, e) => rescue.rescueStep(s, e), rescue.startRescue(plan, now));
    rescue.recordRescue(tutor, state);
  });
  eq(
    picks,
    ["4:division", "3:division-facts", "4:division"],
    "failed prerequisite goes one deeper; once that verifies, the climb resumes",
  );
}

// ---- Spanish ------------------------------------------------------------------------------------------------
{
  setLang("es", { persist: false });
  const placeholders = (text) =>
    [...text.matchAll(/\{(\w+)\}/g)]
      .map((match) => match[1])
      .sort()
      .join();
  for (const [english, spanish] of Object.entries(ES_LAB4_ADAPTIVE))
    ok(placeholders(english) === placeholders(spanish), `Spanish placeholders match: ${english}`);
  ok(t("Show it on your own") !== "Show it on your own", "rescue strings have Spanish");
  ok(
    rescue.returnMessage({ outcome: "verified", goal: PLAN.goal, prereq: PLAN.prereq }) !==
      rescue.returnMessage({ outcome: "left", goal: PLAN.goal, prereq: PLAN.prereq }),
    "the return message is built in Spanish",
  );
  setLang("en", { persist: false });
}

console.log(`Fluency adaptive: ${checks} checks passed.`);

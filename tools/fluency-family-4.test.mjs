// Fluency Lab 4.0 family workstream: achievement rules, report numbers, Spanish coverage and certificate content, all from
// fixtures. Expectations are recomputed here from the raw saved entries, not by calling the code under test a second time.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import "./lib/fl4-stubs.mjs";
import {
  DAY,
  daysAgo,
  entry,
  fakeApi,
  fakeLog,
  fixtureRewards,
  fixtureTutor,
  localDate,
  NOW,
} from "./lib/fl4-family-fixtures.mjs";

const root = new URL("../math/fluency-lab/", import.meta.url);
const A = await import("../math/fluency-lab/achievements-4.js");
const R = await import("../math/fluency-lab/reports-family.js");
const V = await import("../math/fluency-lab/reports-family-render.js");
const C = await import("../math/fluency-lab/certificate.js");
const I = await import("../math/fluency-lab/i18n.js");
const { ES_LAB4_FAMILY } = await import("../math/fluency-lab/i18n-es-lab4-family.js");
const { ALL_SKILLS } = await import("../math/fluency-lab/problem-bank.js");

let checks = 0;
const ok = (value, message) => {
  assert.ok(value, message);
  checks += 1;
};
const eq = (a, b, message) => {
  assert.deepEqual(a, b, message);
  checks += 1;
};
const emptyTutor = () => ({ version: 2, records: {}, mistakes: [], diagnostics: {}, sessions: [] });
const earned = (tutor, extra = {}) =>
  A.earnedAchievements(tutor, { stations: {} }, fixtureRewards(), extra.api ? fakeLog : null, {
    now: NOW,
    ...extra,
  });
const ids = (result) => result.badges.map((badge) => badge.id).sort();

// ---- mastery badges: only independent, distinct, spaced evidence --------------------------------------------------------
const base = earned(fixtureTutor(), { api: fakeApi });
const masteryIds = ids(base).filter((id) => id.startsWith("mastery:"));
eq(
  masteryIds,
  ["mastery:3:mul-0-5", "mastery:3:mul-6-9", "mastery:6:ratios"],
  "mastery badges follow the independent evidence only",
);
eq(
  base.badges.find((b) => b.id === "mastery:3:mul-0-5").level,
  2,
  "ten distinct independent answers on ten days is mastered",
);
eq(
  base.badges.find((b) => b.id === "mastery:3:mul-6-9").level,
  1,
  "one miss and six days is proficient, not mastered",
);
ok(
  !ids(base).includes("mastery:3:division-facts"),
  "twelve right answers that all had a hint earn no badge",
);
ok(
  !ids(base).includes("mastery:4:division"),
  "the same problem answered twenty times earns no badge",
);
ok(!ids(base).includes("mastery:3:mul-10-12"), "a developing skill earns no badge");

// Differential checks: change only the property the rule is about and the badge must appear.
const independentVariant = fixtureTutor();
for (const e of independentVariant.records["3:division-facts"].recent) e.independent = true;
ok(
  ids(earned(independentVariant)).includes("mastery:3:division-facts"),
  "the same answers made independently do earn the badge",
);
const distinctVariant = fixtureTutor();
distinctVariant.records["4:division"].recent.forEach((e, i) => {
  e.sig = `d${i}`;
});
ok(
  ids(earned(distinctVariant)).includes("mastery:4:division"),
  "twenty different problems do earn the badge",
);
// Piling on hints or repeats changes nothing.
const padded = fixtureTutor();
padded.records["3:mul-10-12"].recent.push(
  ...Array.from({ length: 15 }, (_, i) => entry(0, { independent: false, sig: `p${i}` })),
);
padded.records["3:mul-6-9"].recent.push(
  ...Array.from({ length: 15 }, () => entry(0, { sig: "g" })),
);
eq(
  ids(earned(padded)).filter((id) => id.startsWith("mastery:")),
  masteryIds,
  "hints and repeats never add a badge",
);
eq(
  earned(padded, { api: fakeApi }).badges.find((b) => b.id === "mastery:3:mul-6-9").level,
  1,
  "repeats never raise a level",
);
eq(
  ids(
    A.earnedAchievements(
      emptyTutor(),
      { stations: {} },
      { days: [], bestStreak: 0, goal: 3 },
      null,
      { now: NOW },
    ),
  ),
  [],
  "no evidence, no recognition",
);

// ---- strand milestones, recomputed from the skill list --------------------------------------------------------------------
const proficientKeys = new Set(masteryIds.map((id) => id.slice("mastery:".length)));
for (const milestone of base.milestones) {
  const [grade, ...name] = milestone.id.slice("strand:".length).split(":");
  const skills = ALL_SKILLS.filter((s) => String(s.grade) === grade && s.strand === name.join(":"));
  const have = skills.filter((s) => proficientKeys.has(`${s.grade}:${s.id}`)).length;
  const level =
    have === skills.length ? 3 : have * 2 >= skills.length && have > 0 ? 2 : have > 0 ? 1 : 0;
  eq(
    [milestone.total, milestone.proficient, milestone.level],
    [skills.length, have, level],
    `strand ${milestone.id}`,
  );
}
eq(
  base.milestones.find((m) => m.id === "strand:3:Multiplication").level,
  2,
  "two of three multiplication skills is halfway",
);

// ---- misconceptions corrected: two fresh right answers resolved the entry -------------------------------------------------
const rawCorrected = new Set(
  fixtureTutor()
    .mistakes.filter((m) => m.resolvedAt && m.category)
    .map((m) => `${m.key}|${m.category}`),
);
eq(
  base.corrected.map((c) => `${c.key}|${c.category}`),
  [...rawCorrected],
  "only repaired, recognised slips count",
);
eq(
  ids(base).filter((id) => id.startsWith("corrected:")),
  ["corrected:3:mul-0-5:addedFactors"],
);
const doubled = fixtureTutor();
doubled.mistakes.push({ ...doubled.mistakes[0], id: "dup", resolvedAt: daysAgo(2) });
eq(earned(doubled).corrected.length, 1, "the same idea in the same skill counts once");
eq(
  earned(fixtureTutor(), { api: { correctedMisconceptions: () => [] } }).corrected.length,
  0,
  "the teacher API list wins when present",
);

// ---- retention: independent correct answers a week or more apart, proficient or better now ----------------------------------
const retainedFromRaw = [];
for (const [key, record] of Object.entries(fixtureTutor().records)) {
  if (!proficientKeys.has(key)) continue;
  const right = record.recent.filter((e) => e.independent && e.correct && e.level >= 1);
  const span = Math.max(...right.map((e) => e.at)) - Math.min(...right.map((e) => e.at));
  if (new Set(right.map((e) => localDate(e.at))).size >= 2 && span >= 7 * DAY)
    retainedFromRaw.push({ key, daysHeld: Math.floor(span / DAY) });
}
eq(base.retained, retainedFromRaw, "retained skills recomputed from the raw entries");
eq(retainedFromRaw, [{ key: "3:mul-0-5", daysHeld: 29 }]);
eq(
  ids(base).filter((id) => id.startsWith("retained:")),
  ["retained:3:mul-0-5"],
);
eq(
  earned(fixtureTutor(), { api: { retainedSkills: () => [] } }).retained.length,
  0,
  "the teacher API list wins when present",
);

// ---- demonstrated growth ----------------------------------------------------------------------------------------------------
eq(
  ids(base).filter((id) => id.startsWith("growth:")),
  ["growth:3:mul-6-9", "growth:6:ratios"],
  "log growth plus a checkup miss that is now proficient",
);
const growthEvent = base.growth.find((g) => g.key === "3:mul-6-9");
eq([growthEvent.from, growthEvent.to, growthEvent.delta], ["learning", "proficient", 87 - 22]);
eq(
  ids(earned(fixtureTutor())).filter((id) => id.startsWith("growth:")),
  ["growth:6:ratios"],
  "without the log only the checkup start can prove growth",
);
const small = {
  growthFor: () => ({
    start: { score: 60, state: "developing", at: 1 },
    now: { score: 68, state: "developing", at: 2 },
    history: [],
    delta: 8,
  }),
};
eq(
  ids(earned(fixtureTutor(), { api: small })).filter((id) => id.startsWith("growth:3:mul")),
  [],
  "a small change in the same state is not celebrated",
);

// ---- challenges, rhythm and streaks (no loss framing) -------------------------------------------------------------------------
const byId = Object.fromEntries(base.challenges.map((c) => [c.id, c]));
eq(
  byId.proficient.tiers.map((x) => x.earned),
  [true, false, false],
);
eq(byId.explored.value, 4, "skills with three distinct independent answers");
eq(byId.days.value, 16, "days with a distinct independent answer, repeats removed");
eq(
  byId.days.tiers.map((x) => x.earned),
  [true, true, false],
);
eq([byId.corrected.value, byId.retained.value], [1, 1]);
const dayList = (...ago) => new Set(ago.map((n) => localDate(daysAgo(n))));
eq(A.runs(dayList(0, 1, 2, 5, 6), NOW), { current: 3, best: 3 });
eq(
  A.runs(dayList(1, 2, 3, 7, 8, 9, 10, 11), NOW),
  { current: 3, best: 5 },
  "an evening visit keeps yesterday's run",
);
eq(A.runs(dayList(4, 5, 6, 7), NOW), { current: 0, best: 4 }, "a gap never erases the best run");
const withGap = A.earnedAchievements(
  fixtureTutor(),
  { stations: {} },
  { ...fixtureRewards(), days: [] },
  null,
  { now: NOW + 30 * DAY, api: fakeApi },
);
ok(withGap.streak.best >= 4, "the best run survives a break");
// Earned stays earned: what was saved comes back even when the evidence has faded.
const stored = A.keepEarned(null, base).store;
const empty = A.earnedAchievements(
  emptyTutor(),
  { stations: {} },
  { days: [], bestStreak: 0, goal: 3 },
  null,
  { now: NOW + 90 * DAY },
);
const faded = A.keepEarned(stored, empty);
eq(ids(faded.data), ids(base), "every saved recognition survives a long break");
eq(
  faded.data.milestones.find((m) => m.id === "strand:3:Multiplication").level,
  2,
  "a milestone level is kept",
);
ok(faded.data.challenges.find((c) => c.id === "days").tiers[1].earned, "a challenge tier is kept");
const lowered = A.keepEarned(stored, {
  ...empty,
  badges: [
    {
      id: "mastery:3:mul-0-5",
      kind: "mastery",
      key: "3:mul-0-5",
      level: 1,
      state: "proficient",
      score: 75,
    },
  ],
});
eq(
  lowered.data.badges.find((b) => b.id === "mastery:3:mul-0-5").level,
  2,
  "a level never goes down",
);
eq(
  Object.keys(
    A.sanitizeEarned({
      badges: {
        x: { id: "x", kind: "mastery" },
        "mastery:nope:1": { id: "mastery:nope:1", kind: "mastery", key: "nope:1" },
        "goal:3:area": { id: "goal:3:area", kind: "goal", key: "3:area" },
      },
    }).badges,
  ),
  ["goal:3:area"],
  "saved badges are validated",
);
eq(A.weekCount(dayList(0, 1, 2, 9), NOW), 2, "Monday-to-Sunday week");

// ---- goals ----------------------------------------------------------------------------------------------------------------------
let goals = A.addGoal({ goals: [] }, "3:mul-10-12", fixtureTutor(), NOW);
eq([goals.goals[0].startState, goals.goals[0].startScore], ["developing", 54]);
goals = A.addGoal(goals, "3:mul-10-12", fixtureTutor(), NOW);
eq(goals.goals.length, 1, "no duplicate goal");
goals = A.addGoal(
  A.addGoal(A.addGoal(goals, "3:round", fixtureTutor(), NOW), "3:area", fixtureTutor(), NOW),
  "3:perimeter",
  fixtureTutor(),
  NOW,
);
eq(goals.goals.length, A.maxGoals(), "at most three goals");
eq(A.removeGoal(goals, "3:round").goals.length, 2);
eq(
  A.sanitizeGoals({
    goals: [
      { key: "nope", startState: "new" },
      { key: "3:area", startState: "bogus" },
    ],
  }).goals,
  [],
  "bad goals are dropped",
);
const reached = earned(fixtureTutor(), {
  goals: A.addGoal({ goals: [] }, "3:mul-6-9", emptyTutor(), NOW),
});
ok(ids(reached).includes("goal:3:mul-6-9"), "a goal on a proficient skill is reached");
eq(reached.goals[0].gained, 87, "gain since the goal was set (started at 0)");

// ---- Spanish: every string in the family files, and every achievement/certificate text --------------------------------------------
const sources = [
  "achievements-4.js",
  "achievements-4-view.js",
  "reports-family.js",
  "reports-family-render.js",
  "family-pages-4.js",
  "certificate.js",
].map((f) => readFileSync(new URL(f, root), "utf8"));
for (const name of readdirSync(new URL("family/", root)).filter((f) =>
  ["page4.js", "achievements.js", "report.js"].includes(f),
))
  sources.push(readFileSync(new URL(`family/${name}`, root), "utf8"));
const used = new Set();
for (const source of sources)
  for (const m of source.matchAll(/\bt\("((?:[^"\\]|\\.)*)"/g))
    used.add(m[1].replaceAll('\\"', '"'));
const holes = (text) =>
  [...text.matchAll(/\{(\w+)\}/g)]
    .map((m) => m[1])
    .sort()
    .join();
const { ES } = await import("../math/fluency-lab/i18n-es.js");
for (const key of used) {
  ok(ES[key] !== undefined, `Spanish for "${key}"`);
  eq(holes(ES[key]), holes(key), `placeholders in "${key}"`);
}
for (const key of Object.keys(ES_LAB4_FAMILY))
  ok(used.has(key) || ES[key] !== undefined, `family Spanish entry: ${key}`);
ok(used.size > 100, "the scan found the strings");
I.setLang("es", { persist: false });
for (const badge of base.badges) {
  const words = A.achievementText(badge);
  ok(words.title && words.detail, `text for ${badge.id}`);
}
const mastered = base.badges.find((b) => b.id === "mastery:3:mul-0-5");
ok(/Dominada/.test(A.achievementText(mastered).detail), "Spanish detail for a mastery badge");
ok(
  !/\b(usted|ustedes)\b/i.test(JSON.stringify(base.badges.map(A.achievementText))),
  "learner lines never use the adult register",
);
// Adult lines use ustedes forms (Pregunten, Celebren, su estudiante) and never the tú imperative.
for (const key of [
  "Ask: “Show me how you solved one. What did you do first?”",
  "Celebrate effort and fixing mistakes, not speed. All practice is optional.",
  "This report starts after your learner practices a few skills on their own.",
]) {
  ok(/\b(Pregunten|Celebren|su estudiante)\b/.test(ES[key]), `adult register: ${key}`);
  ok(
    !/\b(tú|tu|tus|ti|eres|puedes|Pregunta|Celebra)\b/.test(ES[key].replace(/«[^»]*»/g, "")),
    `no tú in adult line: ${key}`,
  );
}
I.setLang("en", { persist: false });

// ---- report numbers recomputed from the raw entries -----------------------------------------------------------------------------
const report = R.buildReport({
  tutor: fixtureTutor(),
  rewards: fixtureRewards(),
  log: fakeLog,
  api: fakeApi,
  journal: { total: 5, wordsUsed: 12 },
  grade: 3,
  name: "  Sam ",
  now: NOW,
});
const grade3 = Object.entries(fixtureTutor().records).filter(([key]) => key.startsWith("3:"));
const independentAll = grade3.flatMap(([, r]) => r.recent.filter((e) => e.independent));
eq(report.totals.independent, independentAll.length, "independent checks");
eq(report.totals.correct, independentAll.filter((e) => e.correct).length, "independent correct");
eq(
  report.totals.supported,
  grade3.flatMap(([, r]) => r.recent.filter((e) => !e.independent)).length,
  "supported checks",
);
eq(report.totals.accuracy, Math.round((report.totals.correct / report.totals.independent) * 100));
eq(report.totals.skills, grade3.length, "only grade 3 skills");
eq(
  report.totals.states,
  { learning: 1, developing: 1, proficient: 1, mastered: 1 },
  "state counts",
);
eq(report.name, "Sam", "typed name is trimmed");
eq(R.buildReport({ tutor: fixtureTutor(), grade: 3, now: NOW }).name, "", "no name unless typed");
eq(
  report.growth.map((g) => [g.key, g.kind, g.fromScore, g.toScore, g.delta]),
  [["3:mul-6-9", "snapshot", 22, 87, 65]],
);
eq(report.started.find((s) => s.key === "3:mul-6-9").start.kind, "snapshot");
eq(
  report.started.find((s) => s.key === "3:mul-0-5").start,
  { kind: "early", right: 4, total: 4, at: daysAgo(30), history: [], delta: null },
  "first four independent checks",
);
eq(report.retained, [{ key: "3:mul-0-5", title: "Multiplication facts ×0–5", daysHeld: 29 }]);
eq(
  report.corrected.map((c) => c.category),
  ["addedFactors"],
);
ok(
  report.next.length <= 3 && report.next.every((n) => n.state !== "mastered"),
  "next skills are not mastered ones",
);
eq(
  report.next.find((n) => n.key === "3:mul-6-9")?.reason,
  "Revisit a tricky idea",
  "an open slip points to its skill",
);
eq(report.evidence, {
  practiceDays: 4,
  strategies: 0,
  explanations: 5,
  mathWords: 12,
  sessions: 0,
});
const grade6 = R.buildReport({
  tutor: fixtureTutor(),
  rewards: fixtureRewards(),
  grade: 6,
  now: NOW,
});
eq(
  grade6.growth.map((g) => [g.key, g.kind, g.from, g.to]),
  [["6:ratios", "checkup", "learning", "proficient"]],
  "checkup growth without the log",
);
eq(R.primaryGrade(fixtureTutor()), 3, "the grade with most evidence");

// ---- report markup -----------------------------------------------------------------------------------------------------------------
for (const audience of ["student", "family"]) {
  const html = V.reportHtml(report, audience);
  ok(
    html.includes("Observed") && html.includes("Inferred"),
    `${audience}: observed and inferred are labelled in words`,
  );
  ok(html.includes("Sam"), `${audience}: typed name printed`);
  ok(
    !/grade level|placement|on track|below grade|above grade/i.test(
      html.replace("It is never a grade level or a prediction.", ""),
    ),
    `${audience}: no grade-level or placement claims`,
  );
  ok(!/\p{Extended_Pictographic}/u.test(html), `${audience}: no emoji`);
  ok(
    /<svg[^>]*role="img"[^>]*aria-label="[^"]*score went from 22 to 87 over 3 checkpoints/.test(
      html,
    ),
    `${audience}: sparkline has a text alternative`,
  );
  ok(!/undefined|NaN|null/.test(html), `${audience}: no stray undefined, NaN or null`);
}
ok(
  V.reportHtml(report, "family").includes("How to help at home") &&
    !V.reportHtml(report, "student").includes("How to help at home"),
  "family report carries the helping section",
);
ok(!V.reportHtml({ ...report, name: "" }, "student").includes("Sam"), "no name when none is typed");
ok(
  V.reportHtml({ ...report, name: "<img src=x onerror=alert(1)>" }, "student").includes("&lt;img"),
  "names are escaped",
);
ok(
  V.reportHtml(R.buildReport({ tutor: emptyTutor(), now: NOW }), "family").includes("rp-blank"),
  "an empty report explains itself",
);
const doc = V.reportDocument(report, "family");
ok(
  doc.startsWith("<!doctype html>") && doc.includes("@page{size:Letter") && doc.includes("<style>"),
  "a saved report is a standalone Letter document",
);
ok(
  !/\bhttps?:\/\//.test(doc.replaceAll('xmlns="http://www.w3.org/2000/svg"', "")),
  "a saved report makes no network reference",
);

// ---- certificate ---------------------------------------------------------------------------------------------------------------------
const cert = C.certificateData(mastered, { name: "Sam", now: NOW });
eq([cert.to, cert.title], ["Sam", "Multiplication facts ×0–5"]);
ok(/2026/.test(cert.date), "certificate carries the date earned");
eq(
  C.certificateData(mastered, { now: NOW }).to,
  "A Math Fluency Lab learner",
  "no name unless typed",
);
const certHtml = C.achievementCertificateHtml(mastered, { name: "Sam", now: NOW });
ok(
  certHtml.includes("Certificate of Achievement") &&
    certHtml.includes("Sam") &&
    certHtml.includes("<svg") &&
    certHtml.includes("signature"),
  "certificate markup",
);
ok(!/grade level|placement/i.test(certHtml), "certificate makes no grade-level claim");
ok(
  C.achievementCertificateHtml(mastered, { name: '"><script>' }).includes(
    "&quot;&gt;&lt;script&gt;",
  ),
  "certificate names are escaped",
);

console.log(`fluency-family-4: ${checks} checks passed`);

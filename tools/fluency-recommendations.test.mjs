// Simulated learners through the dashboard recommendation engine. Every number a `why` sentence cites is recounted
// here from the raw stored answers (not from the engine's own counters) and must be one the fixture really contains.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: { getItem: () => null, setItem() {}, removeItem() {} },
});
Object.defineProperty(globalThis, "window", { configurable: true, value: globalThis });
const lab = new URL("../math/fluency-lab/", import.meta.url);
const { emptyTutor, findSkill, recordAnswer, skillKey } = await import(
  new URL("tutor-engine.js", lab)
);
const { masteryScore, masteryState } = await import(new URL("mastery-model.js", lab));
const engine = await import(new URL("recommendation-engine.js", lab));
const { setLang } = await import(new URL("i18n.js", lab));
const { ES } = await import(new URL("i18n-es.js", lab));
const { ES_LAB4_DASHBOARD } = await import(new URL("i18n-es-lab4-journey.js", lab));
const { recommend, continueTarget, upcomingReviews, MASTERY_RULE, SECTION_IDS } = engine;

const NOW = new Date(2026, 9, 14, 15, 0).getTime(); // Wednesday 14 October 2026, local time
const GRADE = 4;
const at = (daysAgo, hour = 10) => new Date(2026, 9, 14 - daysAgo, hour).getTime();
const dayKey = (time) => new Date(time).toDateString();
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const repeat = (n, row) => Array.from({ length: n }, () => row);
// Rows are [daysAgo, correct, independent, level]; they go through the real recordAnswer, oldest first.
function learner(spec = {}) {
  const tutor = emptyTutor();
  for (const [id, rows] of Object.entries(spec.records || {}))
    for (const [daysAgo, correct, independent, level = 1] of rows)
      recordAnswer(
        tutor,
        findSkill(`${GRADE}:${id}`) || findSkill(id),
        { correct, independent, level },
        at(daysAgo),
      );
  for (const key of spec.lessons || []) {
    tutor.records[key] = { ...(tutor.records[key] || { recent: [] }), lessonCompleted: true };
  }
  for (const mistake of spec.mistakes || [])
    tutor.mistakes.push({
      id: String(tutor.mistakes.length),
      question: "q",
      at: at(2),
      resolvedAt: null,
      category: null,
      ...mistake,
    });
  if (spec.diagnostics) tutor.diagnostics = spec.diagnostics;
  return tutor;
}

// 1. New learner: nothing started.
const brandNew = learner();
// 2. Mid-grade: one close to mastery, two building, one supported-only, one lesson explored.
const midGrade = learner({
  records: {
    "place-million": [
      [9, true, true],
      [9, true, true],
      [8, true, true],
      [8, true, true],
      [6, false, true],
      [6, true, true],
      [3, true, true],
      [2, true, true],
      [1, true, true],
    ],
    "add-large": [
      [5, true, true],
      [4, false, true],
      [3, true, true],
      [2, false, true],
      [1, true, true],
    ],
    "subtract-large": [
      [1, true, false, 0],
      [0, true, false, 0],
    ],
    "round-large": repeat(5, [0, true, true]),
  },
  lessons: ["4:division"],
});
// 3. A gap: low accuracy plus open mistakes on division (prerequisite untouched); a checkup miss on fraction-compare.
const gapLearner = learner({
  records: {
    division: [
      [6, false, true],
      [5, false, true],
      [4, true, true],
      [3, false, true],
      [2, false, true],
    ],
  },
  mistakes: [
    { key: "4:division", category: "addedInsteadOfDividing" },
    { key: "4:division", category: "addedInsteadOfDividing" },
    { key: "4:division", category: "multipliedInsteadOfDividing" },
  ],
  diagnostics: { 4: { at: at(7), results: { "4:fraction-compare": false }, foundations: {} } },
});
// 4. Returned after 30+ days: three skills practised well, then nothing for 35 days.
const strong = (daysAgo) => [
  [daysAgo + 2, true, true],
  [daysAgo + 2, true, true],
  [daysAgo + 1, true, true],
  [daysAgo + 1, true, true],
  [daysAgo, true, true],
  [daysAgo, true, true],
  [daysAgo, true, true],
  [daysAgo, true, true],
];
const returning = learner({
  records: {
    "place-million": strong(35),
    "round-large": strong(36),
    "add-large": strong(37),
    factors: [
      [38, true, true],
      [38, false, true],
    ],
  },
});
// 5. Mastered strand: fractions solved at the stretch level on four days; place value solved at level 1 only.
const masteredStrand = learner({
  records: {
    "fraction-equiv": [
      [5, true, true, 2],
      [5, true, true, 2],
      [4, true, true, 2],
      [4, true, true, 2],
      [3, true, true, 2],
      [3, true, true, 2],
      [2, true, true, 2],
      [1, true, true, 2],
    ],
    "fraction-compare": [
      [5, true, true, 2],
      [5, true, true, 2],
      [4, true, true, 2],
      [4, true, true, 2],
      [3, true, true, 2],
      [3, true, true, 2],
      [2, true, true, 2],
      [1, true, true, 2],
    ],
    "place-million": [
      [5, true, true],
      [5, true, true],
      [4, true, true],
      [4, true, true],
      [3, true, true],
      [3, true, true],
      [2, true, true],
      [1, true, true],
    ],
  },
});

const LEARNERS = { brandNew, midGrade, gapLearner, returning, masteredStrand };
const sectionOf = (sections, id) => sections.find((section) => section.id === id).items;
const idsOf = (sections, id) => sectionOf(sections, id).map((entry) => entry.skill.id);

// ---- the mastery rule the sentences quote is the one the model enforces ----
const modelSource = readFileSync(new URL("mastery-model.js", lab), "utf8");
assert.match(
  modelSource,
  new RegExp(
    `score >= ${MASTERY_RULE.score} && parts.count >= ${MASTERY_RULE.checks} && parts.days >= ${MASTERY_RULE.days}`,
  ),
  "MASTERY_RULE matches masteryState",
);
assert.match(modelSource, new RegExp(`score >= ${MASTERY_RULE.proficient}\\) return "proficient"`));
{
  const eight = (days) => ({
    recent: Array.from({ length: 8 }, (_, i) => ({
      correct: true,
      independent: true,
      level: 1,
      at: at(days[i % days.length]),
    })),
  });
  assert.equal(masteryState(eight([2, 1]), NOW), "mastered", "8 checks on 2 days is mastered");
  assert.notEqual(masteryState(eight([1]), NOW), "mastered", "one day is not enough");
  assert.notEqual(
    masteryState({ recent: eight([2, 1]).recent.slice(1) }, NOW),
    "mastered",
    "7 checks is not enough",
  );
}

// ---- fixture sanity: the states the scenarios rely on ----
const state = (tutor, id) => masteryState(tutor.records[`${GRADE}:${id}`] || {}, NOW);
assert.equal(state(brandNew, "place-million"), "new");
assert.equal(state(midGrade, "place-million"), "proficient");
assert.ok(["learning", "developing"].includes(state(midGrade, "add-large")));
assert.ok(["learning", "developing"].includes(state(midGrade, "subtract-large")));
assert.equal(state(masteredStrand, "fraction-equiv"), "mastered");
assert.equal(state(masteredStrand, "place-million"), "mastered");

// ---- scenarios ----
{
  const sections = recommend(brandNew, GRADE, NOW);
  assert.deepEqual(
    sections.map((s) => s.id),
    SECTION_IDS,
    "six sections in the documented order",
  );
  assert.deepEqual(
    sections.map((s) => s.title),
    ["Learn Next", "Fix a Gap", "Keep Practicing", "Review", "Challenge", "Ready to Master"],
  );
  for (const id of SECTION_IDS.filter((id) => id !== "learnNext"))
    assert.equal(sectionOf(sections, id).length, 0, `a new learner has nothing in ${id}`);
  assert.deepEqual(
    idsOf(sections, "learnNext"),
    ["place-million", "round-large", "add-large"],
    "new learner: first three skills in grade order",
  );
  assert.equal(continueTarget(sections).skill.id, "place-million");
  assert.equal(continueTarget(sections).action.mode, "visual");
}
// A learner who chose "I'm not sure yet" gets a neutral next step, not a gap label.
{
  const uncertain = learner({
    diagnostics: { 4: { at: NOW, results: {}, foundations: {}, unsure: ["4:division"] } },
  });
  assert.ok(!idsOf(recommend(uncertain, GRADE, NOW), "fixAGap").includes("division"));
}
{
  const sections = recommend(midGrade, GRADE, NOW);
  assert.deepEqual(
    idsOf(sections, "readyToMaster"),
    ["place-million", "round-large"],
    "highest score first",
  );
  assert.match(
    sectionOf(sections, "readyToMaster")[1].why,
    /Mastery also needs 3 more checks and 1 more day of success\./,
  );
  assert.deepEqual(
    new Set(idsOf(sections, "keepPracticing")),
    new Set(["add-large", "subtract-large"]),
  );
  assert.equal(
    idsOf(sections, "learnNext")[0],
    "division",
    "a skill whose lesson was explored comes first",
  );
  const ready = sectionOf(sections, "readyToMaster");
  assert.match(
    ready[0].why,
    /Your mastery score is 89 out of 100, and mastery starts at 90\. Keep solving/,
  );
  const supported = sectionOf(sections, "keepPracticing").find(
    (entry) => entry.skill.id === "subtract-large",
  );
  assert.match(supported.why, /with help 2 times/);
  assert.equal(supported.action.label, "Try it on your own");
  assert.equal(continueTarget(sections).section, "keepPracticing");
}
{
  const sections = recommend(gapLearner, GRADE, NOW);
  const gap = sectionOf(sections, "fixAGap");
  assert.deepEqual(
    gap.map((entry) => entry.skill.id),
    ["division", "fraction-compare"],
    "open mistakes outrank a checkup miss",
  );
  const [division, compare] = gap;
  assert.match(division.why, /3 mistakes are still open/);
  assert.match(division.why, /You solved 1 of 5 on your own, last/);
  assert.match(
    division.why,
    /The slip I see most: Added instead of dividing\./,
    "the most common open category is named",
  );
  assert.equal(division.evidence.slip.count, 2);
  assert.equal(
    division.evidence.basis,
    "mixed",
    "a guessed prerequisite makes the advice mixed, and says so",
  );
  assert.match(division.why, /This part is a guess from how skills connect/);
  assert.equal(division.alt.key, "3:division-facts", "gap leads to its probable prerequisite");
  assert.equal(compare.evidence.basis, "mixed");
  assert.match(compare.why, /starting-point check/);
  assert.equal(
    continueTarget(sections).skill.id,
    "division",
    "gaps come first in Continue learning",
  );
}
{
  const sections = recommend(returning, GRADE, NOW);
  assert.equal(
    sectionOf(sections, "review").length,
    3,
    "returning after 30 days: reviews fill the section (capped at 3)",
  );
  const dues = sectionOf(sections, "review").map((entry) => entry.evidence.dates.due);
  assert.deepEqual(
    dues,
    [...dues].sort((a, b) => a - b),
    "the longest-waiting review comes first",
  );
  for (const entry of sectionOf(sections, "review")) {
    assert.match(entry.why, /days ago/);
    assert.match(entry.why, /Your review was due \d+ days ago\./);
    assert.ok(entry.evidence.dates.due < NOW);
  }
  assert.equal(continueTarget(sections).section, "review");
  assert.equal(
    upcomingReviews(returning, GRADE, NOW).length,
    0,
    "nothing is upcoming when everything is already due",
  );
}
{
  const sections = recommend(masteredStrand, GRADE, NOW);
  const challenge = sectionOf(sections, "challenge");
  assert.ok(challenge.length >= 1 && challenge.length <= 2);
  assert.ok(
    challenge.some(
      (entry) => entry.skill.grade === GRADE + 1 && entry.evidence.basis === "inferred",
    ),
    "a mastered strand points at next-grade skills, labelled as inferred",
  );
  const stretch = challenge.find((entry) => entry.skill.id === "place-million");
  assert.ok(stretch, "a mastered skill with no stretch success is offered the stretch level");
  assert.match(stretch.why, /not solved a stretch-level problem yet/);
  assert.equal(
    challenge.some((entry) => entry.skill.id === "fraction-equiv"),
    false,
    "stretch-level success removes the stretch prompt",
  );
  assert.equal(sectionOf(sections, "review").length, 0, "nothing is due yet");
}

// ---- upcoming reviews are real, ordered and not yet due ----
{
  const upcoming = upcomingReviews(masteredStrand, GRADE, NOW, 30);
  assert.ok(upcoming.length >= 1);
  for (const [i, row] of upcoming.entries()) {
    assert.ok(row.dueAt > NOW);
    if (i) assert.ok(upcoming[i - 1].dueAt <= row.dueAt);
  }
}

// ---- no skill is the primary subject of two sections; caps hold; same input, same output ----
const CAPS = {
  learnNext: 3,
  fixAGap: 3,
  keepPracticing: 3,
  review: 3,
  challenge: 2,
  readyToMaster: 3,
};
for (const [name, tutor] of Object.entries(LEARNERS)) {
  const sections = recommend(tutor, GRADE, NOW);
  const keys = sections.flatMap((section) => section.items.map((entry) => skillKey(entry.skill)));
  assert.equal(new Set(keys).size, keys.length, `${name}: no skill appears in two sections`);
  for (const section of sections)
    assert.ok(
      section.items.length <= CAPS[section.id],
      `${name}: ${section.id} stays under its cap`,
    );
  const again = recommend(JSON.parse(JSON.stringify(tutor)), GRADE, NOW);
  assert.deepEqual(
    JSON.parse(JSON.stringify(again)),
    JSON.parse(JSON.stringify(sections)),
    `${name}: deterministic`,
  );
  for (const section of sections)
    for (const entry of section.items) {
      assert.ok(
        ["observed", "inferred", "mixed"].includes(entry.evidence.basis),
        `${name}: every entry says where its advice comes from`,
      );
      assert.ok(entry.action.key && entry.action.mode && entry.action.label);
      assert.ok(findSkill(entry.action.key), "the action opens a real skill");
    }
}
// Every grade is covered without throwing.
for (let grade = 0; grade <= 8; grade += 1) {
  const sections = recommend(midGrade, grade, NOW);
  assert.equal(sections.length, 6);
}

// ---- every number in a `why` is one the fixture really contains ----
function truth(tutor, key, grade) {
  const recent = tutor.records[key]?.recent || [];
  const solid = recent.filter((entry) => entry.independent && entry.level >= 1);
  const wins = solid.filter((entry) => entry.correct);
  const winDays = new Set(wins.map((entry) => dayKey(entry.at)));
  const score = masteryScore(tutor.records[key] || {}, NOW);
  const nums = new Set([
    solid.length,
    wins.length,
    recent.filter((entry) => !entry.independent).length,
    recent.length,
    winDays.size,
    grade,
    score,
  ]);
  nums.add(tutor.mistakes.filter((m) => m.key === key && !m.resolvedAt).length);
  const byCat = {};
  for (const m of tutor.mistakes)
    if (m.key === key && !m.resolvedAt && m.category)
      byCat[m.category] = (byCat[m.category] || 0) + 1;
  for (const n of Object.values(byCat)) nums.add(n);
  const ago = (time) =>
    Math.round(
      (new Date(NOW).setHours(0, 0, 0, 0) - new Date(time).setHours(0, 0, 0, 0)) / 86400000,
    );
  if (wins.length) nums.add(ago(Math.max(...wins.map((entry) => entry.at))));
  const due = tutor.records[key]?.dueAt;
  if (due) nums.add(ago(due));
  nums.add(Math.max(0, 8 - recent.length)).add(Math.max(0, 2 - winDays.size));
  return nums;
}
const RULE_NUMBERS = [100, MASTERY_RULE.score, MASTERY_RULE.checks, MASTERY_RULE.days]; // 100 is the score scale
let sentences = 0;
for (const [name, tutor] of Object.entries(LEARNERS)) {
  for (const section of recommend(tutor, GRADE, NOW))
    for (const entry of section.items) {
      const allowed = truth(tutor, skillKey(entry.skill), entry.skill.grade);
      RULE_NUMBERS.forEach((n) => allowed.add(n));
      if (entry.evidence.prerequisite)
        for (const n of truth(
          tutor,
          entry.evidence.prerequisite.key,
          findSkill(entry.evidence.prerequisite.key).grade,
        ))
          allowed.add(n);
      const cited = (entry.why.match(/\d+/g) || []).map(Number);
      for (const n of cited)
        assert.ok(
          allowed.has(n),
          `${name}/${skillKey(entry.skill)}: "${entry.why}" cites ${n}, which the fixture does not contain`,
        );
      // The counts the entry reports equal the raw recount.
      const recent = tutor.records[skillKey(entry.skill)]?.recent || [];
      const solid = recent.filter((answer) => answer.independent && answer.level >= 1);
      assert.equal(
        entry.evidence.counts.independent,
        solid.length,
        `${name}/${entry.skill.id}: independent count`,
      );
      assert.equal(
        entry.evidence.counts.successes,
        solid.filter((answer) => answer.correct).length,
        `${name}/${entry.skill.id}: success count`,
      );
      if (entry.evidence.dates.lastSuccess)
        assert.ok(
          solid.some((answer) => answer.correct && answer.at === entry.evidence.dates.lastSuccess),
          "lastSuccess is a real answer time",
        );
      // A named weekday really is the weekday of the date it describes.
      const weekdayHit = entry.why.match(/last on (\w+)/);
      if (weekdayHit)
        assert.equal(weekdayHit[1], DAYS[new Date(entry.evidence.dates.lastSuccess).getDay()]);
      sentences += 1;
    }
}
assert.ok(sentences >= 18, `exercised ${sentences} sentences`);

// ---- Spanish: every t() literal in the dashboard files has an entry with the same placeholders, and none are spare ----
// app.js hosts one dashboard string ("your practice set") that is passed to the mount.
const files = [
  "recommendation-engine.js",
  "skill-card.js",
  "journey-4.js",
  "skill-map.js",
  "progress-summary.js",
];
const literals = new Set();
for (const file of files) {
  const source = readFileSync(new URL(file, lab), "utf8");
  for (const match of source.matchAll(/\bt\(\s*(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)')/g))
    literals.add((match[1] ?? match[2]).replace(/\\(["'])/g, "$1"));
  for (const match of source.matchAll(/\bt\(\s*`((?:[^`\\]|\\.)*)`/g))
    if (!match[1].includes("${")) literals.add(match[1]);
}
// Static grade hub tabs are translated through data-i18n in lab.html.
const page = readFileSync(new URL("lab.html", lab), "utf8");
const hubTabs = page.match(/<nav id="grade-hub-tabs"[\s\S]*?<\/nav>/)?.[0] || "";
for (const match of hubTabs.matchAll(/<span data-i18n>([^<]+)</g)) literals.add(match[1].trim());
const holes = (text) =>
  [...text.matchAll(/\{(\w+)\}/g)]
    .map((m) => m[1])
    .sort()
    .join();
for (const text of literals) {
  assert.ok(ES[text] !== undefined, `No Spanish for: ${text}`);
  assert.equal(holes(ES[text]), holes(text), `Placeholders differ for: ${text}`);
}
const appLiterals = new Set(
  [...readFileSync(new URL("app.js", lab), "utf8").matchAll(/\bt\(\s*"((?:[^"\\]|\\.)*)"/g)].map(
    (m) => m[1],
  ),
);
for (const key of Object.keys(ES_LAB4_DASHBOARD))
  assert.ok(
    literals.has(key) || appLiterals.has(key),
    `Unused Spanish entry in the dashboard table: ${key}`,
  );

// In Spanish the generated sentences contain no English template text.
setLang("es", { persist: false });
for (const [name, tutor] of Object.entries(LEARNERS)) {
  const spanish = recommend(tutor, GRADE, NOW);
  setLang("en", { persist: false });
  const english = recommend(tutor, GRADE, NOW);
  setLang("es", { persist: false });
  for (const [i, section] of spanish.entries()) {
    assert.notEqual(section.title, english[i].title, `${name}: ${section.id} title is translated`);
    for (const [j, entry] of section.items.entries()) {
      assert.notEqual(
        entry.why,
        english[i].items[j].why,
        `${name}/${entry.skill.id}: why is translated`,
      );
      assert.doesNotMatch(
        entry.why,
        /\b(You|your|You've|solved|Mastery|review|practice)\b|\{\w+\}/,
        `${name}/${entry.skill.id}: no English left in "${entry.why}"`,
      );
      assert.equal(
        entry.why.match(/\d+/g)?.join(),
        english[i].items[j].why.match(/\d+/g)?.join(),
        "Spanish cites the same numbers",
      );
    }
  }
}
setLang("en", { persist: false });

console.log(
  `fluency-recommendations: ${Object.keys(LEARNERS).length} simulated learners, ${sentences} sentences checked, ${literals.size} strings in Spanish`,
);

// Pins the second round of Fluency Lab open items: the three formerly unused generators, Maryland 2025 codes,
// one mastery picture (trail and game answers count as skill evidence), per-tab learners, the class snapshot
// for every grade, no name prompt, and tab semantics.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const html = readFileSync(new URL("../math/fluency-lab/index.html", import.meta.url), "utf8");
const dom = new JSDOM(html, {
  url: "https://example.test/math/fluency-lab/?grade=3",
  pretendToBeVisual: true,
});
const win = dom.window;
win.HTMLElement.prototype.scrollIntoView = () => {};
win.print = () => {};
for (const [key, value] of Object.entries({
  window: win,
  document: win.document,
  location: win.location,
  history: win.history,
  localStorage: win.localStorage,
  sessionStorage: win.sessionStorage,
  CustomEvent: win.CustomEvent,
}))
  Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });

const { ALL_SKILLS, generateProblem, getSkill, seededRandom } = await import(
  "../math/fluency-lab/problem-bank.js"
);
const { skillForItem } = await import("../math/fluency-lab/tutor-engine.js");
const { TRAILS, loadTrail, makeProblem, recordFact } = await import(
  "../math/fluency-lab/fact-trail.js"
);
const { factsReport, parseFactsReport, summarizeReports, snapshotHtml } = await import(
  "../math/fluency-lab/class-snapshot.js"
);
const { profiles, selectProfile } = await import("../math/fluency-lab/school-tools.js");
const { stepLeaks } = await import("../math/fluency-lab/step-leak.js");

const sample = (skill, n = 300, seed = 3) => {
  const rng = seededRandom(seed);
  return Array.from({ length: n }, () => generateProblem(skill, rng));
};

// 1. Coordinates, unit conversions and measures of center are practised inside the skills that teach them, with
// their own steps (not the host skill's) and no step that states the answer before the last.
for (const [grade, id, part] of [
  [6, "integers", /^Which quadrant contains/],
  [6, "unit-rates", /^\d+ \w+ = how many \w+\?$/],
  [7, "probability", /^Find the (mean|median|range):/],
]) {
  const skill = getSkill(grade, id);
  const items = sample(skill);
  const parts = items.filter((item) => part.test(item.question));
  assert.ok(parts.length > 40 && parts.length < 200, `${grade}:${id} mixes in ${parts.length}/300`);
  for (const item of parts) {
    assert.ok(
      !skill.learn.steps.includes(item.steps[0]),
      `${id} uses its own steps: ${item.steps[0]}`,
    );
    assert.ok(
      item.steps.slice(0, -1).every((step) => !stepLeaks(step, item)),
      `no early answer: ${item.question} | ${item.steps.join(" / ")}`,
    );
  }
}
const median = sample(getSkill(7, "probability"), 300).find((item) =>
  item.question.startsWith("Find the median"),
);
assert.match(median.steps[0], /^Put the values in order/, "a median starts by ordering the values");

// 2. Grade 6 shows the 2025 Maryland codes and keeps the former CCSS code beside it.
for (const skill of ALL_SKILLS.filter((s) => s.grade === 6)) {
  assert.match(skill.standard, /^6\.(AT|NOS|GR|DS)\.\d+$/, `${skill.id}: ${skill.standard}`);
  assert.match(skill.formerStandard, /^6\.(RP|EE|NS|G|SP)\./, `${skill.id} keeps its former code`);
}
assert.equal(getSkill(6, "unit-rates").standard, "6.AT.2");
assert.equal(getSkill(6, "integers").standard, "6.NOS.8");
assert.ok(ALL_SKILLS.filter((s) => s.grade !== 6).every((s) => !s.formerStandard));

// 3. A trail or game answer belongs to the skill that practises it.
const as = (question, answer, generator) => ({ question, answers: [String(answer)], generator });
const skillOf = (grade, item) => skillForItem(grade, item)?.id ?? null;
assert.equal(skillOf(3, as("7 × 8 = ?", 56, "factPool")), "mul-6-9");
assert.equal(skillOf(3, as("4 × 7 = ?", 28, "factPool")), "mul-0-5");
assert.equal(skillOf(3, as("56 ÷ 7 = ?", 8, "factPool")), "division-facts");
assert.equal(skillOf(7, as("−6 × 4 = ?", -24, "integerOp")), "integer-mul");
assert.equal(skillOf(7, as("−6 + 4 = ?", -2, "integerOp")), "integer-add");
assert.equal(
  skillOf(6, as("2.5 + 1.25 = ?", 3.75, "decimalOp")),
  null,
  "no Grade 6 skill adds decimals",
);
const unmapped = new Set();
for (const [grade, trail] of Object.entries(TRAILS))
  for (const entry of trail.stations)
    for (let i = 0; i < 20; i += 1)
      if (!skillForItem(Number(grade), makeProblem(Number(grade), entry, seededRandom(i))))
        unmapped.add(`${grade}:${entry.id}`);
// Whole-number long division (Grade 6) and the Grade 8 integer review have no skill of their own to credit.
for (const key of unmapped)
  assert.match(key, /^6:(div-1|div-2|dec-add|mix)$|^8:int-review$/, `unmapped ${key}`);

// 4. Every grade gets a class picture: skills come with the facts, and older reports still read.
const tutor = { version: 2, records: {}, mistakes: [] };
const at = Date.now();
tutor.records["6:gcf"] = {
  recent: [1, 2, 3].map((i) => ({ correct: i === 3, independent: true, level: 1, at })),
};
tutor.records["6:ratios"] = { recent: [{ correct: true, independent: true, level: 1, at }] };
const report = factsReport(6, tutor);
assert.deepEqual(report.skills.map((entry) => `${entry.key}=${entry.status}`).sort(), [
  "skill:6:gcf=stuck",
  "skill:6:ratios=growing",
]);
const parsed = parseFactsReport(JSON.parse(JSON.stringify(report)));
assert.equal(parsed.skills.length, 2);
assert.deepEqual(
  parseFactsReport({ ...report, skills: undefined }).skills,
  [],
  "a report from before still reads",
);
assert.equal(
  parseFactsReport({ ...report, skills: [{ key: "skill:6:<b>", status: "stuck" }] }).skills.length,
  0,
);
const summary = summarizeReports([parsed, parsed]);
assert.equal(summary.skills[0].key, "skill:6:gcf");
assert.equal(summary.skills[0].stuck, 2);
assert.match(snapshotHtml(summary), /Grade 6: Greatest common factor/);

// 5. The learner belongs to the tab: another tab switching learners does not move this one.
const tabA = win.sessionStorage;
selectProfile(1);
const tabB = new Map();
globalThis.sessionStorage = {
  getItem: (k) => tabB.get(k) ?? null,
  setItem: (k, v) => tabB.set(k, String(v)),
  removeItem: (k) => tabB.delete(k),
};
selectProfile(2);
assert.equal(profiles().active, 2, "tab B uses its learner");
globalThis.sessionStorage = tabA;
assert.equal(profiles().active, 1, "tab A keeps its learner");
selectProfile(0);

// 6. The page boots; trail answers reach the tutor record of the matching skill.
await import("../math/fluency-lab/app.js");
const trail = loadTrail();
recordFact(trail, as("7 × 8 = ?", 56, "factPool"), true);
recordFact(trail, as("7 × 8 = ?", 56, "factPool"), false);
const saved = JSON.parse(win.localStorage.getItem("ewl-fluency-tutor-v2"));
assert.deepEqual(
  saved.records["3:mul-6-9"].recent.map((entry) => [entry.correct, entry.independent]),
  [
    [true, true],
    [false, true],
  ],
);

// 7. No name prompt, and each tab list is one Tab stop that names its panel.
assert.match(html, /window\.NeftSaveResumeConfig = \{ autoStart: false \}/);
const gradeTabs = [...win.document.querySelectorAll("#grade-tabs [role=tab]")];
assert.equal(gradeTabs.filter((tab) => tab.tabIndex === 0).length, 1);
assert.ok(gradeTabs.every((tab) => tab.getAttribute("aria-controls") === "library-view"));

win.close();
console.log("fluency open items 2: ok");

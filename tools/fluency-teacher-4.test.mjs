// Teacher tools 4.0: assignment codec and targets, the growth log, class analysis, grouping and exports.
// Expected values are recomputed here from the raw fixture answers, not by calling the code under test.
import assert from "node:assert/strict";

import {
  ALL_SKILLS,
  answers,
  clearStore,
  DAY,
  emptyTutor,
  keyOf,
  NOW,
  tutorWith,
} from "./lib/teacher-4-fixtures.mjs";

const lab = "../math/fluency-lab/";
const { findSkill } = await import(`${lab}tutor-engine.js`);
const codec = await import(`${lab}assignment-codec.js`);
const {
  assignmentDifficultyLevel,
  decodeAssignment,
  encodeAssignment,
  validateAssignment,
  assignmentUrl,
  assignmentTierRange,
} = await import(`${lab}school-tools.js`);
const targets = await import(`${lab}assignment-targets.js`);
const list = await import(`${lab}assignment-store.js`);
const growth = await import(`${lab}growth-log.js`);
const play = await import(`${lab}play-backup.js`);

let passed = 0;
const check = (name, fn) => {
  try {
    fn();
  } catch (error) {
    error.message = `[${name}] ${error.message}`;
    throw error;
  }
  passed += 1;
};

// ---------- assignments: codec, old links, short codes ----------
check("old links decode unchanged and carry no new fields", () => {
  const old = "ewl1|6|10|a|a||6:ratios|";
  const decoded = decodeAssignment(old);
  assert.deepEqual(decoded, {
    version: 1,
    grade: 6,
    keys: ["6:ratios"],
    count: 10,
    mode: "adaptive",
    challenge: "adaptive",
    label: "Class practice",
  });
  const encoded = encodeAssignment(decoded);
  assert.equal(
    encoded.split("|").length,
    8,
    "a plain assignment still encodes to the original eight fields",
  );
  const legacyJson = btoa(
    JSON.stringify({
      version: 1,
      grade: 6,
      keys: ["6:ratios"],
      count: 10,
      mode: "adaptive",
      challenge: "adaptive",
      label: "Old",
    }),
  );
  assert.equal(decodeAssignment(legacyJson).label, "Old");
});

const sample = {
  version: 1,
  grade: 6,
  keys: ["6:ratios", "6:unit-rates"].filter((key) => findSkill(key)),
  count: 15,
  mode: "guided",
  challenge: "building",
  lang: "es",
  label: "Razones | Día 2",
  tiers: [2, 4],
  target: { score: 80, days: 2 },
  due: "2026-11-20",
};
check("extended assignments round trip through links and ignore bad extension values", () => {
  assert.ok(sample.keys.length >= 1);
  const token = encodeAssignment(sample);
  assert.equal(token.split("|").length, 9);
  assert.deepEqual(decodeAssignment(token), validateAssignment(sample));
  assert.deepEqual(decodeAssignment(token).tiers, [2, 4]);
  const bad = validateAssignment({
    ...sample,
    tiers: [4, 2],
    target: { score: 20, days: 2 },
    due: "2026-02-31",
  });
  assert.equal("tiers" in bad || "target" in bad || "due" in bad, false);
  assert.deepEqual(assignmentTierRange({ challenge: "grade-stretch" }), [3, 5]);
  assert.deepEqual(assignmentTierRange(sample), [2, 4]);
  assert.match(assignmentUrl(sample), /#assignment=ewl1\|6\|15\|g\|b\|es\|/);
});

check("short class codes round trip, reject typos, and fit every grade", () => {
  const code = codec.encodeShortCode(sample);
  assert.match(code, /^FL4-[0-9A-Z]{4}(-[0-9A-Z]{1,4})+$/);
  const expected = { ...validateAssignment(sample), label: "Class practice" };
  assert.deepEqual(decodeAssignment(code), expected);
  assert.deepEqual(
    decodeAssignment(code.toLowerCase().replaceAll("-", " ")),
    expected,
    "case, spaces and dashes are forgiving",
  );
  const chars = code.split("");
  const at = chars.findIndex((char, index) => index > 4 && char !== "-");
  chars[at] = chars[at] === "0" ? "1" : "0";
  assert.equal(decodeAssignment(chars.join("")), null, "one mistyped character fails the checksum");
  assert.equal(
    codec.encodeShortCode({ ...sample, game: "match" }),
    null,
    "a game cannot ride in a code",
  );
  for (let grade = 0; grade <= 8; grade += 1) {
    const keys = ALL_SKILLS.filter((skill) => skill.grade === grade).map(
      (skill) => `${grade}:${skill.id}`,
    );
    const prints = new Set(keys.map(codec.skillFingerprint));
    assert.equal(prints.size, keys.length, `grade ${grade}: skill fingerprints are unique`);
    const each = codec.encodeShortCode({
      version: 1,
      grade,
      keys: keys.slice(0, 10),
      count: 10,
      mode: "adaptive",
      challenge: "adaptive",
    });
    assert.deepEqual(decodeAssignment(each).keys, keys.slice(0, 10));
  }
});

check("a tier range limits the stored difficulty level; no range changes nothing", () => {
  for (const level of [0, 1, 2]) {
    assert.equal(assignmentDifficultyLevel("adaptive", level), level);
    assert.equal(assignmentDifficultyLevel("building", level, null), Math.min(1, level));
    assert.equal(
      assignmentDifficultyLevel("adaptive", level, [1, 2]),
      0,
      "tiers 1-2 stay concrete",
    );
    assert.equal(
      assignmentDifficultyLevel("adaptive", level, [3, 3]),
      1,
      "tier 3 only is grade level",
    );
    assert.equal(
      assignmentDifficultyLevel("adaptive", level, [4, 5]),
      2,
      "tiers 4-5 are the stretch level",
    );
    assert.equal(
      assignmentDifficultyLevel("adaptive", level, [1, 5]),
      level,
      "the full range leaves the adaptive level alone",
    );
  }
});

// ---------- targets and deadlines ----------
check("deadline and target evaluation", () => {
  assert.deepEqual(targets.dueStatus("2026-10-15", NOW).state, "today");
  assert.equal(targets.dueStatus("2026-10-14", NOW).state, "overdue");
  assert.equal(targets.dueStatus("2026-10-18", NOW).daysLeft, 3);
  assert.equal(targets.dueStatus(undefined, NOW).state, "none");
  const key = "6:ratios";
  const strong = tutorWith({ [key]: answers("cccccccccc", { gap: DAY, start: NOW - 9 * DAY }) });
  const oneDay = tutorWith({
    [key]: answers("cccccccccc", { gap: 60_000, start: NOW - 3_600_000 }),
  });
  const assignment = validateAssignment({
    version: 1,
    grade: 6,
    keys: [key],
    count: 10,
    target: { score: 80, days: 2 },
    due: "2026-10-10",
  });
  const met = targets.learnerStatus(assignment, strong, { now: NOW });
  assert.equal(met.status, "met", "a met target stays met after the deadline");
  assert.equal(met.rows[0].days, 10);
  const sameDay = targets.learnerStatus(assignment, oneDay, { now: NOW });
  assert.equal(sameDay.rows[0].days, 1, "ten answers in one sitting are one independent day");
  assert.equal(sameDay.status, "overdue", "target not met and deadline passed");
  const early = targets.learnerStatus({ ...assignment, due: "2026-10-30" }, oneDay, { now: NOW });
  assert.equal(early.status, "in-progress");
  assert.equal(
    targets.learnerStatus(assignment, emptyTutor(), { now: NOW - 9 * DAY }).status,
    "not-started",
  );
  const since = targets.learnerStatus({ ...assignment, due: undefined }, strong, {
    now: NOW,
    since: NOW - 2 * DAY,
  }).rows[0];
  assert.equal(since.days, 3, "only days since the assignment was made count");
  const unscored = targets.learnerStatus({ ...assignment, target: undefined }, strong, {
    now: NOW,
  });
  assert.notEqual(unscored.status, "met", "without a target nothing is claimed as met");
  const klass = targets.classStatus(
    assignment,
    [
      { id: "a", label: "A", tutor: strong },
      { id: "b", label: "B", tutor: oneDay },
      { id: "c", label: "C", tutor: emptyTutor() },
    ],
    { now: NOW },
  );
  assert.deepEqual(klass.counts, { met: 1, "in-progress": 0, "not-started": 0, overdue: 2 });
});

check("assignment list: create, edit, duplicate, retire, cap and sanitize", () => {
  let items = list.addAssignment([], sample, 1000);
  items = list.addAssignment(items, { ...sample, label: "Second" }, 1000);
  assert.equal(
    new Set(items.map((item) => item.id)).size,
    2,
    "ids stay unique within one millisecond",
  );
  const id = items.at(-1).id;
  items = list.updateAssignment(items, id, { ...sample, label: "Edited" }, 2000);
  assert.equal(items.find((item) => item.id === id).assignment.label, "Edited");
  items = list.duplicateAssignment(items, id, 3000);
  assert.equal(items[0].assignment.label, "Edited (copy)");
  items = list.setRetired(items, id, true, 4000);
  assert.equal(items.find((item) => item.id === id).retired, true);
  assert.throws(
    () => list.addAssignment(items, { version: 1, grade: 6, keys: [] }),
    /at least one skill/,
  );
  assert.equal(
    list.removeAssignment(items, id).some((item) => item.id === id),
    false,
  );
  list.saveAssignments(items);
  assert.equal(list.loadAssignments().length, items.length);
  const junk = list.cleanAssignmentList([
    { id: "x", assignment: { version: 9 } },
    { id: "../..", assignment: sample },
    null,
  ]);
  assert.equal(junk.length, 0, "entries without a valid assignment or id are dropped");
  let many = [];
  for (let n = 0; n < 70; n += 1) many = list.addAssignment(many, sample, n + 1);
  assert.equal(many.length, list.MAX_ASSIGNMENTS);
});

// ---------- growth log ----------
check("growth log: one snapshot per skill per day, sanitize, caps", () => {
  const key = keyOf("add-20");
  const tutor = tutorWith({ [key]: answers("cwcc", { start: NOW - 3_600_000, gap: 60_000 }) });
  let log = growth.recordSnapshot(tutor, NOW, growth.emptyGrowthLog());
  assert.equal(log.snapshots.length, 1);
  assert.deepEqual(Object.keys(log.snapshots[0]).sort(), [
    "at",
    "independent",
    "key",
    "ladderStep",
    "score",
    "state",
  ]);
  log = growth.recordSnapshot(tutor, NOW + 1000, log);
  assert.equal(log.snapshots.length, 1, "a second visit the same day replaces the day's snapshot");
  assert.equal(log.snapshots[0].at, NOW + 1000);
  log = growth.recordSnapshot(tutor, NOW + DAY, log);
  assert.equal(
    log.snapshots.length,
    1,
    "a skill not practised today and already logged adds nothing",
  );
  tutor.records[key].lastAt = NOW + DAY;
  log = growth.recordSnapshot(tutor, NOW + DAY, log);
  assert.equal(log.snapshots.length, 2);
  const g = growth.growthFor(log, key);
  assert.equal(g.history.length, 2);
  assert.equal(g.delta, g.now.score - g.start.score);
  assert.deepEqual(growth.growthFor(log, "1:nope"), {
    start: null,
    now: null,
    history: [],
    delta: 0,
    points: 0,
  });

  const dirty = growth.sanitizeGrowthLog({
    version: 1,
    snapshots: [
      { key, at: NOW, score: 140, state: "mastered", independent: 500, ladderStep: 9 },
      { key: "9:nope", at: NOW, score: 5, state: "new", independent: 0, ladderStep: 0 },
      { key, at: NOW + 1, score: 50, state: "bogus", independent: 0, ladderStep: 0 },
      { key, at: "x", score: 50, state: "new" },
      null,
      "text",
    ],
  });
  assert.deepEqual(dirty.snapshots, [
    { key, at: NOW, score: 100, state: "mastered", independent: 99, ladderStep: 4 },
  ]);
  assert.deepEqual(growth.sanitizeGrowthLog({ version: 2 }), growth.emptyGrowthLog());
  assert.deepEqual(growth.sanitizeGrowthLog("x"), growth.emptyGrowthLog());

  const states = ["new", "learning", "developing", "proficient", "mastered"];
  const longRun = {
    version: 1,
    snapshots: Array.from({ length: 200 }, (_, day) => ({
      key,
      at: NOW - (199 - day) * DAY,
      score: day % 100,
      state: states[day % 5],
      independent: 1,
      ladderStep: 0,
    })),
  };
  const capped = growth.sanitizeGrowthLog(longRun);
  assert.equal(capped.snapshots.length, 120, "120 days per skill");
  assert.equal(capped.snapshots.at(-1).at, NOW, "the newest entry is kept");
  const skills = ALL_SKILLS.slice(0, 96);
  const wide = {
    version: 1,
    snapshots: skills.flatMap((skill, index) =>
      Array.from({ length: 6 }, (_, day) => ({
        key: `${skill.grade}:${skill.id}`,
        at: NOW - (5 - day) * DAY - index,
        score: 50,
        state: "developing",
        independent: 1,
        ladderStep: 0,
      })),
    ),
  };
  const total = growth.sanitizeGrowthLog(wide);
  assert.equal(total.snapshots.length, 400, "400 entries in all");
  const firsts = new Set(
    wide.snapshots.filter((_, index) => index % 6 === 0).map((entry) => `${entry.key}|${entry.at}`),
  );
  const kept = new Set(total.snapshots.map((entry) => `${entry.key}|${entry.at}`));
  assert.ok(
    [...firsts].every((first) => kept.has(first)),
    "each skill keeps its starting snapshot",
  );
  assert.ok(
    total.snapshots.every((entry, index, all) => index === 0 || all[index - 1].at <= entry.at),
    "sorted by time",
  );
});

check("retained skills and corrected patterns", () => {
  const key = keyOf("add-20");
  const solid = answers("cccccccccc", { start: NOW - 20 * DAY, gap: 2 * DAY });
  const tutor = tutorWith({ [key]: solid }, [
    {
      id: "1",
      key,
      question: "7 + 5 = ?",
      category: "subtractInsteadOfAdding",
      at: NOW - 9 * DAY,
      resolvedAt: NOW - 5 * DAY,
    },
    {
      id: "2",
      key,
      question: "8 + 3 = ?",
      category: "omittedAddend",
      at: NOW - 2 * DAY,
      resolvedAt: null,
    },
    {
      id: "3",
      key,
      question: "9 + 1 = ?",
      category: null,
      at: NOW - 2 * DAY,
      resolvedAt: NOW - DAY,
    },
  ]);
  const snap = (daysAgo, state) => ({
    key,
    at: NOW - daysAgo * DAY,
    score: 90,
    state,
    independent: 8,
    ladderStep: 2,
  });
  const heldLog = {
    version: 1,
    snapshots: [
      snap(19, "developing"),
      snap(18, "proficient"),
      snap(10, "mastered"),
      snap(0, "mastered"),
    ],
  };
  const kept = growth.retainedSkills(heldLog, tutor, NOW);
  assert.deepEqual(
    kept.map((item) => item.key),
    [key],
  );
  // Held since day -18; the last independent success was day -2 (answers every 2 days from day -20): 16 days.
  assert.equal(kept[0].daysHeld, 16);
  const droppedLog = {
    version: 1,
    snapshots: [snap(19, "proficient"), snap(10, "developing"), snap(0, "mastered")],
  };
  assert.equal(
    growth.retainedSkills(droppedLog, tutor, NOW).length,
    0,
    "a dip below proficient breaks the run",
  );
  const recentLog = { version: 1, snapshots: [snap(9, "proficient"), snap(0, "mastered")] };
  assert.equal(
    growth.retainedSkills(recentLog, tutor, NOW).length,
    0,
    "under 14 days is not retained",
  );
  assert.deepEqual(growth.correctedMisconceptions(tutor), [
    { key, category: "subtractInsteadOfAdding", resolvedAt: NOW - 5 * DAY },
  ]);
});

check("growth log travels in the JSON backup and is sanitized on restore", () => {
  clearStore();
  const key = keyOf("add-20");
  const tutor = tutorWith({ [key]: answers("ccc", { start: NOW - 3_600_000, gap: 60_000 }) });
  growth.recordGrowth(tutor, NOW);
  const exported = play.exportPlay();
  assert.equal(exported.growth.snapshots.length, 1);
  const wire = JSON.parse(
    JSON.stringify({
      play: {
        ...exported,
        growth: {
          version: 1,
          snapshots: [...exported.growth.snapshots, { key: "nope", at: 1, score: 1, state: "new" }],
        },
      },
    }),
  );
  const clean = play.cleanPlay(wire.play);
  assert.equal(clean.growth.snapshots.length, 1, "unknown skills are dropped on restore");
  clearStore();
  play.importPlay(clean);
  assert.equal(growth.loadGrowthLog().snapshots.length, 1);
  assert.equal(
    play.cleanPlay({ trail: {}, rewards: {} }).growth,
    null,
    "an old backup has no growth log and leaves the learner's alone",
  );
});

console.log(`fluency teacher 4.0 (assignments, targets, growth log): ${passed} checks passed`);

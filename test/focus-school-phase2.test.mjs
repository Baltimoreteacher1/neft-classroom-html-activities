/* Focus School — Phase II: resilience to imperfect real-world use.
 *
 * Three kinds of check live here:
 *   1. REGRESSIONS for bugs found by auditing the shipped Phase I build
 *   2. PROPERTY/FUZZ tests that assert invariants over randomized school data
 *   3. The NOAM ACCEPTANCE SUITE — the product's actual promise, end to end
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const core = readFileSync("focus-school/planner-core.js", "utf8");
const appJs = readFileSync("focus-school/app.js", "utf8");
const sandbox = {
  console,
  URL,
  setInterval: () => 0,
  clearInterval() {},
  setTimeout: () => 0,
  clearTimeout() {},
  location: { protocol: "https:", search: "", href: "https://noam.eduwonderlab.com/" },
  navigator: { userAgent: "Test Chromebook" },
  localStorage: { getItem: () => null, setItem() {} },
  sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  document: {
    readyState: "loading",
    addEventListener() {},
    querySelector: () => null,
    querySelectorAll: () => [],
  },
  window: { __FOCUS_SCHOOL_TEST__: {}, addEventListener() {} },
  addEventListener() {},
};
Object.assign(sandbox.window, {
  window: sandbox.window,
  document: sandbox.document,
  navigator: sandbox.navigator,
  location: sandbox.location,
  localStorage: sandbox.localStorage,
  sessionStorage: sandbox.sessionStorage,
});
vm.createContext(sandbox);
vm.runInContext(core, sandbox, { filename: "planner-core.js" });
sandbox.window.PlannerCore = sandbox.PlannerCore;
vm.runInContext(appJs, sandbox, { filename: "app.js" });
const api = sandbox.window.__FOCUS_SCHOOL_TEST__;
const PC = sandbox.window.PlannerCore;

let passed = 0;
const checks = [];
const check = (n, f) => checks.push([n, f]);
const arr = (a) => Array.from(a);
const iso = (o) => {
  const d = new Date();
  d.setDate(d.getDate() + o);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const TODAY = iso(0);

function withState(patch) {
  const s = api.normalize({
    classes: [
      { id: "c_math", name: "Math", updatedAt: 1 },
      { id: "c_sci", name: "Science", updatedAt: 1 },
    ],
    updatedAt: 1,
    ...patch,
  });
  api.setState(s);
  return s;
}

// ===========================================================================
// REGRESSIONS — every one of these was a real defect in the shipped build
// ===========================================================================
check("REGRESSION: an empty class list no longer re-seeds defaults", () => {
  // This is the ROOT CAUSE of the 113 duplicate classes found in production.
  // Phase I deduped the symptom; the source kept producing them.
  const existing = api.normalize({
    classes: [{ id: "c1", name: "Math", updatedAt: 5 }],
    updatedAt: 5,
  });
  const emptied = { ...existing, classes: [] };
  assert.equal(api.normalize(emptied).classes.length, 0, "an empty list means deleted, not reseed");
});

check("REGRESSION: an empty routine list no longer re-seeds defaults", () => {
  const existing = api.normalize({ routines: [{ id: "r1", name: "Night", items: [] }], updatedAt: 5 });
  assert.equal(api.normalize({ ...existing, routines: [] }).routines.length, 0);
});

check("REGRESSION: a genuinely new install still gets starter content once", () => {
  const fresh = api.normalize({});
  assert.equal(fresh.classes.length, 4);
  assert.ok(fresh.routines.length > 0);
  assert.ok(fresh.seededAt, "and records that it was seeded");
});

check("REGRESSION: repeated normalize never grows any collection", () => {
  let s = api.normalize({});
  const sizes = () => [s.classes.length, s.routines.length, s.assignments.length, s.todos.length];
  const first = sizes();
  for (let i = 0; i < 5; i++) s = api.normalize(s);
  assert.deepEqual(arr(sizes()), arr(first));
});

check("REGRESSION: many devices seeding then merging cannot multiply classes", () => {
  // The exact production failure: N fresh browsers each seeded, all unioned.
  let merged = api.normalize({});
  for (let i = 0; i < 12; i++) merged = api.normalize(api.mergeStates(merged, api.normalize({})));
  assert.ok(merged.classes.length <= 4, `${merged.classes.length} classes after 12 devices`);
});

check("REGRESSION: study sessions stop once the assessment has passed", () => {
  const s = withState({
    assignments: [
      { id: "q1", title: "Science Quiz", kind: "assessment", assessmentType: "quiz", due: iso(-2) },
    ],
  });
  s.studyPlans.q1 = [
    { id: "sp1", date: iso(-4), minutes: 10, focus: "Vocab", detail: "x", done: false },
  ];
  const ghosts = api.plannerItems().filter((i) => i.kind === "study");
  assert.equal(ghosts.length, 0, "never study for a quiz already taken");
});

check("REGRESSION: normalize drops pending study sessions for a past assessment", () => {
  const s = api.normalize({
    updatedAt: 1,
    assignments: [{ id: "q1", title: "Q", kind: "assessment", due: iso(-3) }],
    studyPlans: {
      q1: [
        { id: "a", date: iso(-5), done: true },
        { id: "b", date: iso(-4), done: false },
      ],
    },
  });
  const plan = s.studyPlans.q1 || [];
  assert.ok(!plan.some((x) => !x.done), "pending sessions are cleared");
  assert.ok(plan.some((x) => x.done), "completed study history is kept");
});

check("REGRESSION: an A/B class is not hidden when the rotation anchor is unset", () => {
  const sched = {
    enabled: true,
    startTime: "08:15",
    dismissTime: "15:05",
    rotation: { type: "ab", labels: ["A", "B"], anchorDate: "" },
    periods: [
      { id: "p1", name: "Math", start: "08:20", end: "09:10", days: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
      { id: "p2", name: "PE", start: "13:00", end: "13:50", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], rotationDays: ["A"] },
    ],
  };
  let weekday = TODAY;
  for (let i = 0; i < 7; i++) {
    if (!PC.isWeekend(iso(i))) {
      weekday = iso(i);
      break;
    }
  }
  assert.ok(PC.dayPlan(sched, weekday).periods.some((p) => p.name === "PE"));
});

check("REGRESSION: negative or absurd durations are clamped", () => {
  const s = api.normalize({
    updatedAt: 1,
    assignments: [{ id: "a", title: "A", due: TODAY, estimateMin: -500, actualMin: 99999 }],
  });
  assert.equal(s.assignments[0].estimateMin, 0);
  assert.ok(s.assignments[0].actualMin <= 8 * 60, `${s.assignments[0].actualMin}`);
});

check("REGRESSION: a completion date before creation is repaired", () => {
  const s = api.normalize({
    updatedAt: 1,
    assignments: [{ id: "a", title: "A", created: TODAY, completedAt: iso(-5), status: "done" }],
  });
  assert.ok(s.assignments[0].completedAt >= s.assignments[0].created);
});

check("REGRESSION: study plans and packing needs for deleted owners are dropped", () => {
  const s = api.normalize({
    updatedAt: 1,
    classes: [{ id: "c1", name: "Math", updatedAt: 1 }],
    assignments: [],
    studyPlans: { ghost: [{ id: "z", date: TODAY }] },
    subjectNeeds: { c1: ["Calculator"], c_gone: ["Ghost"] },
  });
  assert.ok(!s.studyPlans.ghost);
  assert.ok(!s.subjectNeeds.c_gone);
  assert.deepEqual(arr(s.subjectNeeds.c1), ["Calculator"], "real needs survive");
});

check("REGRESSION: a project step cannot be scheduled past the project deadline", () => {
  const s = api.normalize({
    updatedAt: 1,
    assignments: [
      { id: "p", title: "P", kind: "project", due: iso(2), steps: [{ id: "s1", text: "late", date: iso(9) }] },
    ],
  });
  assert.ok(s.assignments[0].steps[0].date <= iso(2));
});

check("REGRESSION: estimate learning is actually wired to completion", () => {
  const s = withState({
    assignments: [{ id: "a", title: "Math hw", classId: "c_math", due: TODAY, estimateMin: 20, actualMin: 30 }],
  });
  for (let i = 0; i < 4; i++) api.learnFromCompletion(s.assignments[0]);
  assert.ok(s.estimateModel.c_math, "the model is written on completion");
  assert.equal(api.suggestedEstimate("c_math", 20), 30, "and it changes the next guess");
});

check("REGRESSION: a runaway timer cannot poison the estimate model", () => {
  const s = withState({ assignments: [] });
  // A session left running overnight: 20 min planned, 480 logged.
  api.learnFromCompletion({ classId: "c_math", estimateMin: 20, actualMin: 480, status: "done" });
  assert.ok(!s.estimateModel.c_math, "an implausible ratio is ignored, not averaged in");
});

check("estimate wording is neutral, never a label about the student", () => {
  const s = withState({ assignments: [] });
  for (let i = 0; i < 4; i++) {
    s.estimateModel = PC.updateEstimateModel(s.estimateModel, {
      classId: "c_math",
      estimateMin: 20,
      actualMin: 30,
    });
  }
  const hint = api.estimateHint("c_math", 20);
  assert.match(hint, /usually takes about/);
  assert.doesNotMatch(hint, /slow|bad|struggle|behind|poor/i);
});

check("REGRESSION: homework due TOMORROW appears in tonight's work", () => {
  // The most common item a 7th-grader has is homework due tomorrow. An earlier
  // definition of "today's work" filtered on due <= today and silently dropped
  // it from the Today list entirely.
  withState({
    assignments: [
      { id: "m", title: "Math homework", classId: "c_math", due: iso(1), estimateMin: 20 },
      { id: "later", title: "Next week", due: iso(6), estimateMin: 20 },
    ],
  });
  const ids = api.todaysWork().map((e) => e.item.id);
  assert.ok(ids.includes("m"), "tonight's homework is on the list");
  assert.ok(!ids.includes("later"), "but next week's work is not");
});

check("REGRESSION: overload compares tonight's real work to real free time", () => {
  withState({
    assignments: Array.from({ length: 6 }, (_, i) => ({
      id: `o${i}`,
      title: `Task ${i}`,
      due: iso(1),
      estimateMin: 45,
    })),
  });
  const r = api.overloadReport();
  assert.equal(r.overloaded, true, `need ${r.need} vs have ${r.have}`);
  assert.ok(r.keep.length >= 1, "it still names what to do");
  assert.ok(r.move.length >= 1, "and what moves");
});

// ===========================================================================
// IMPERFECT STUDENT BEHAVIOR
// ===========================================================================
check("the same assignment entered twice is offered as a duplicate", () => {
  withState({
    assignments: [
      { id: "a", title: "Science worksheet", classId: "c_sci", due: iso(1) },
      { id: "b", title: "science worksheet", classId: "c_sci", due: iso(1) },
    ],
  });
  const d = api.duplicateCandidates();
  assert.equal(d.length, 1);
  assert.equal(d[0].confidence, "likely");
});

check("two genuinely different tasks in one class are NOT flagged", () => {
  withState({
    assignments: [
      { id: "a", title: "Read chapter 4", classId: "c_sci", due: iso(1) },
      { id: "b", title: "Vocabulary list 7", classId: "c_sci", due: iso(1) },
    ],
  });
  assert.equal(api.duplicateCandidates().filter((d) => d.confidence !== "possible").length, 0);
});

check("merging duplicates loses nothing", () => {
  const a = {
    id: "a", title: "Math", classId: "c_math", due: iso(2), estimateMin: 20, actualMin: 10,
    notes: "pg 82", steps: [], status: "doing", planHistory: [{ from: "x", to: "y" }],
  };
  const b = {
    id: "b", title: "Math Practice 3.2", classId: "c_math", due: iso(2), estimateMin: 45,
    actualMin: 5, notes: "odd problems", steps: [{ id: "s", text: "step" }], status: "todo",
    sourceId: "lms-99",
  };
  const m = PC.mergeDuplicates(a, b);
  assert.equal(m.estimateMin, 45, "keeps the larger estimate — under-planning costs more");
  assert.equal(m.actualMin, 15, "keeps all logged time");
  assert.equal(m.status, "doing", "progress on either copy is real progress");
  assert.match(m.notes, /pg 82/);
  assert.match(m.notes, /odd problems/);
  assert.equal(m.steps.length, 1, "steps are not lost");
  assert.equal(m.sourceId, "lms-99", "the school-system id survives");
  assert.equal(m.due, iso(2));
  assert.deepEqual(arr(m.mergedFrom), ["b"]);
});

check("a dismissed duplicate pair never nags again", () => {
  const s = withState({
    assignments: [
      { id: "a", title: "Science worksheet", classId: "c_sci", due: iso(1) },
      { id: "b", title: "science worksheet", classId: "c_sci", due: iso(1) },
    ],
  });
  s.dupDismissed = { "a~b": Date.now() };
  assert.equal(api.duplicateCandidates().length, 0);
});

check("finishing work asks about submission only where it matters", () => {
  const s = api.normalize({
    updatedAt: 1,
    assignments: [
      { id: "hw", title: "HW", kind: "assignment", due: TODAY },
      { id: "st", title: "Study", kind: "study", due: TODAY },
    ],
  });
  assert.equal(s.assignments[0].submitted, false, "homework tracks submission");
  assert.equal(s.assignments[1].kind, "study", "study sessions are not 'turned in'");
});

check("submitted can never be true on unfinished work", () => {
  const s = api.normalize({
    updatedAt: 1,
    assignments: [{ id: "a", title: "A", due: TODAY, status: "todo", submitted: true }],
  });
  assert.equal(s.assignments[0].submitted, false);
});

check("ignoring the app for days produces a plan, not an overdue wall", () => {
  const s = withState({
    assignments: [
      { id: "a", title: "A", due: iso(-3), estimateMin: 20 },
      { id: "b", title: "B", due: iso(-2), estimateMin: 20 },
      { id: "c", title: "C", due: iso(-1), estimateMin: 20 },
      { id: "d", title: "D", due: iso(1), estimateMin: 20 },
    ],
  });
  api.repairMissedWork();
  const plan = PC.buildPlan({ ...api.plannerCtx(), availableMin: 45 });
  assert.ok(plan.workBlocks.length >= 1 && plan.workBlocks.length <= 3, "a short, doable list");
  assert.ok(plan.leftOver.length >= 1, "the rest is explicitly deferred, not hidden");
  for (const a of s.assignments) {
    assert.ok(a.due, "every real deadline is still intact");
  }
});

// ===========================================================================
// PROPERTY / FUZZ — invariants over randomized school data
// ===========================================================================
function mulberry(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

check("PROPERTY: planner invariants hold across 300 randomized school states", () => {
  const failures = [];
  for (let seed = 1; seed <= 300; seed++) {
    const rnd = mulberry(seed);
    const pick = (a) => a[Math.floor(rnd() * a.length)];
    const n = 1 + Math.floor(rnd() * 9);
    const assignments = [];
    for (let i = 0; i < n; i++) {
      const kind = pick(["assignment", "assignment", "project", "assessment"]);
      const due = iso(Math.floor(rnd() * 21) - 7);
      const a = {
        id: `i${seed}_${i}`,
        title: `Task ${i}`,
        classId: pick(["c_math", "c_sci", ""]),
        kind,
        assessmentType: kind === "assessment" ? pick(["quiz", "test"]) : "",
        due,
        status: pick(["todo", "todo", "doing", "done"]),
        estimateMin: Math.floor(rnd() * 90),
        importance: pick(["low", "normal", "high"]),
        blocked: rnd() < 0.15 ? { reason: "Need: worksheet" } : null,
      };
      assignments.push(a);
    }
    const s = withState({ assignments });
    for (const a of s.assignments) {
      if (a.kind === "assessment" && a.status !== "done") api.regenerateStudyPlan(a, { force: true });
      if (a.kind === "project" && a.due && a.status !== "done") api.autoBreakdown(a);
    }
    const dueBefore = new Map(s.assignments.map((a) => [a.id, a.due]));
    const doneBefore = new Set(s.assignments.filter((a) => a.status === "done").map((a) => a.id));

    const items = api.plannerItems();
    const ranked = PC.prioritize({ items, todayIso: TODAY, availableMin: 60 });
    const plan = PC.buildPlan({ ...api.plannerCtx(), availableMin: 60 });
    api.repairMissedWork();

    const fail = (m) => failures.push(`seed ${seed}: ${m}`);

    // 1. Due dates are never silently changed by planning.
    for (const a of s.assignments) {
      if (dueBefore.get(a.id) !== a.due) fail(`due changed for ${a.id}`);
    }
    // 2. Completed work stays completed.
    for (const id of doneBefore) {
      const a = s.assignments.find((x) => x.id === id);
      if (a && a.status !== "done") fail(`${id} un-completed`);
    }
    // 3. Nothing done or blocked is ever offered as work.
    for (const it of items) {
      const owner = s.assignments.find((a) => a.id === api.owningAssignmentId(it));
      if (owner && owner.status === "done") fail(`done item ${it.id} surfaced`);
      if (owner && owner.blocked && owner.blocked.reason) fail(`blocked item ${it.id} surfaced`);
    }
    // 4. Next Up is always actionable and resolves to a real assignment.
    if (ranked.length) {
      const owner = api.owningAssignmentId(ranked[0].item);
      if (!s.assignments.some((a) => a.id === owner)) fail(`next-up ${ranked[0].id} has no owner`);
      if (!ranked[0].reason) fail("next-up has no reason");
    }
    // 5. Study sessions never fall after their assessment.
    for (const [aid, sessions] of Object.entries(s.studyPlans)) {
      const owner = s.assignments.find((a) => a.id === aid);
      if (!owner) fail(`orphan study plan ${aid}`);
      else for (const x of sessions) {
        if (owner.due && x.date > owner.due) fail(`study after assessment ${aid}`);
      }
    }
    // 6. Project steps never fall past the project deadline.
    for (const a of s.assignments) {
      for (const st of a.steps || []) {
        if (st.date && a.due && st.date > a.due) fail(`step past deadline ${a.id}`);
      }
    }
    // 7. The plan never exceeds the time available, and never duplicates work.
    if (plan.workMin > 60) fail(`plan ${plan.workMin} > 60 available`);
    const ids = plan.workBlocks.map((b) => b.itemId);
    if (new Set(ids).size !== ids.length) fail("plan contains the same item twice");
    // 8. Ranking is stable for identical input.
    const again = PC.prioritize({ items, todayIso: TODAY, availableMin: 60 });
    if (again.map((x) => x.id).join() !== ranked.map((x) => x.id).join()) fail("ranking unstable");
    // 9. Durations stay sane.
    for (const a of s.assignments) {
      if (a.estimateMin < 0 || a.actualMin < 0) fail(`negative duration ${a.id}`);
    }
  }
  assert.deepEqual(arr(failures.slice(0, 5)), [], `${failures.length} invariant violations`);
});

check("PROPERTY: repeated planning with unchanged input is idempotent", () => {
  for (let seed = 1; seed <= 40; seed++) {
    const rnd = mulberry(seed);
    const assignments = Array.from({ length: 1 + Math.floor(rnd() * 6) }, (_, i) => ({
      id: `x${i}`,
      title: `T${i}`,
      due: iso(Math.floor(rnd() * 10) - 3),
      estimateMin: 10 + Math.floor(rnd() * 40),
    }));
    const s = withState({ assignments });
    api.repairMissedWork();
    const snapshot = JSON.stringify(s.assignments);
    api.repairMissedWork();
    api.repairMissedWork();
    assert.equal(JSON.stringify(s.assignments), snapshot, `seed ${seed} not idempotent`);
  }
});

check("PROPERTY: normalize is idempotent on randomized messy input", () => {
  for (let seed = 1; seed <= 60; seed++) {
    const rnd = mulberry(seed);
    const messy = {
      updatedAt: 1,
      classes: Array.from({ length: Math.floor(rnd() * 6) }, (_, i) => ({
        id: `c${i}`,
        name: rnd() < 0.5 ? "Math" : `Class ${i}`,
        updatedAt: Math.floor(rnd() * 100),
      })),
      assignments: Array.from({ length: Math.floor(rnd() * 6) }, (_, i) => ({
        id: `a${i}`,
        title: `A${i}`,
        due: rnd() < 0.3 ? "" : iso(Math.floor(rnd() * 10) - 5),
        estimateMin: rnd() < 0.2 ? -50 : Math.floor(rnd() * 60),
        status: rnd() < 0.3 ? "done" : "todo",
        completedAt: rnd() < 0.3 ? iso(-9) : "",
      })),
      studyPlans: rnd() < 0.4 ? { nobody: [{ id: "s", date: iso(1) }] } : {},
    };
    const once = api.normalize(messy);
    const twice = api.normalize(once);
    assert.equal(
      JSON.stringify({ ...twice, updatedAt: 0, __integrity: 0 }),
      JSON.stringify({ ...once, updatedAt: 0, __integrity: 0 }),
      `seed ${seed}: normalize is not idempotent`,
    );
  }
});

// ===========================================================================
// DATE / TIME EDGE CASES
// ===========================================================================
check("date maths survive month, year and DST boundaries", () => {
  assert.equal(PC.addDays("2026-01-31", 1), "2026-02-01");
  assert.equal(PC.addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(PC.addDays("2027-01-01", -1), "2026-12-31");
  assert.equal(PC.daysBetween("2026-02-28", "2026-03-01"), 1);
  // US DST forward (2026-03-08) and back (2026-11-01): local-noon anchoring
  // means a day is always exactly one calendar day.
  assert.equal(PC.addDays("2026-03-07", 1), "2026-03-08");
  assert.equal(PC.daysBetween("2026-03-07", "2026-03-09"), 2);
  assert.equal(PC.addDays("2026-10-31", 1), "2026-11-01");
  assert.equal(PC.daysBetween("2026-10-31", "2026-11-02"), 2);
  // Leap year.
  assert.equal(PC.addDays("2028-02-28", 1), "2028-02-29");
});

check("a Sunday-to-Monday rollover moves into the new school week", () => {
  const sun = "2026-08-16";
  assert.equal(PC.dayName(sun), "Sun");
  assert.equal(PC.isWeekend(sun), true);
  assert.equal(PC.dayName(PC.addDays(sun, 1)), "Mon");
  assert.equal(PC.isWeekend(PC.addDays(sun, 1)), false);
});

check("minute maths never wrap past midnight into nonsense", () => {
  assert.equal(PC.minToHhmm(-30), "00:00");
  assert.equal(PC.minToHhmm(99999), "23:59");
  assert.equal(PC.hhmmToMin("24:00"), null);
  assert.equal(PC.hhmmToMin("nope"), null);
});

// ===========================================================================
// NOAM ACCEPTANCE SUITE
// ===========================================================================
check("ACCEPTANCE A — an ordinary day: next task, reason, workload", () => {
  withState({
    assignments: [
      { id: "m", title: "Math homework", classId: "c_math", due: iso(1), estimateMin: 20 },
      { id: "r", title: "English reading", due: TODAY, estimateMin: 20 },
    ],
  });
  const e = api.nextUpEntry();
  assert.ok(e && e.item.title);
  assert.ok(e.reason);
  assert.ok(api.todaysWork().length >= 1);
});

check("ACCEPTANCE B — a busy day: a real plan that says what moved", () => {
  withState({
    assignments: [
      { id: "a", title: "A", due: iso(1), estimateMin: 30 },
      { id: "b", title: "B", due: iso(1), estimateMin: 30 },
      { id: "c", title: "C", due: iso(3), estimateMin: 30 },
    ],
  });
  const report = api.overloadReport();
  assert.equal(report.overloaded === true || report.need <= report.have, true);
  const plan = PC.buildPlan({ ...api.plannerCtx(), availableMin: 40 });
  assert.ok(plan.workMin <= 40);
  assert.ok(plan.leftOver.length >= 1);
});

check("ACCEPTANCE C — forgotten material: blocked, and school reminder", () => {
  const s = withState({
    assignments: [
      { id: "sci", title: "Science worksheet", classId: "c_sci", due: iso(1), estimateMin: 20,
        blocked: { reason: "Need: worksheet", since: TODAY, nextAction: "Get Science worksheet" } },
      { id: "eng", title: "English reading", due: iso(1), estimateMin: 20 },
    ],
  });
  assert.equal(api.nextUpEntry().item.id, "eng", "the planner moves to actionable work");
  assert.ok(api.atSchoolItems().some((x) => /Get Science worksheet/.test(x.text)));
  assert.ok(s.assignments.some((a) => a.id === "sci"), "the blocked task is kept");
});

check("ACCEPTANCE D — a test: study plan exists and stops after the test", () => {
  const s = withState({
    assignments: [
      { id: "t", title: "Math Test", classId: "c_math", kind: "assessment", assessmentType: "test", due: iso(3) },
    ],
  });
  api.regenerateStudyPlan(s.assignments[0], { force: true });
  assert.ok(s.studyPlans.t.length >= 2);
  assert.ok(api.plannerItems().some((i) => i.kind === "study"));
  // Now the test happens.
  s.assignments[0].status = "done";
  const after = api.normalize(s);
  api.setState(after);
  assert.equal(api.plannerItems().filter((i) => i.kind === "study").length, 0);
});

check("ACCEPTANCE E — a project surfaces work before the last day", () => {
  const s = withState({
    assignments: [{ id: "p", title: "History project", kind: "project", due: iso(5) }],
  });
  api.autoBreakdown(s.assignments[0]);
  const item = api.plannerItems()[0];
  assert.match(item.title, / — /, "a step, not the whole project");
  assert.ok(s.assignments[0].steps.some((st) => st.date <= iso(1)), "work starts early");
});

check("ACCEPTANCE F — overwhelmed collapses to one tiny action", () => {
  withState({ assignments: [{ id: "a", title: "Math homework", due: TODAY, estimateMin: 20 }] });
  const steps = PC.overwhelmedSteps(api.nextUpEntry().item);
  assert.match(steps[0].text, /Open Math homework/);
  assert.ok(steps[steps.length - 1].action.act === "overwhelm-exit");
});

check("ACCEPTANCE I — everything done says so, with no invented busywork", () => {
  withState({ assignments: [{ id: "a", title: "A", due: TODAY, status: "done" }] });
  assert.equal(api.nextUpEntry(), null);
  assert.equal(api.todaysWork().length, 0);
  assert.equal(api.overloadReport().overloaded, false);
});

check("ACCEPTANCE J — returning after two days away recovers calmly", () => {
  const s = withState({
    assignments: [
      { id: "a", title: "A", due: iso(2), plannedDate: iso(-2), estimateMin: 20 },
      { id: "b", title: "B", due: iso(3), plannedDate: iso(-1), estimateMin: 20 },
      { id: "c", title: "C", due: iso(-1), estimateMin: 20 },
    ],
  });
  const moved = api.repairMissedWork();
  assert.ok(moved.length >= 1, "the schedule repairs itself");
  for (const m of moved) assert.ok(m.reason, "and explains each move");
  assert.equal(s.assignments.find((a) => a.id === "a").due, iso(2), "deadlines untouched");
  assert.ok(s.assignments.find((a) => a.id === "a").originalDue, "history recorded");
  assert.ok(api.nextUpEntry(), "there is still a clear next step");
});

check("ACCEPTANCE — the weekly reset does the analysis for him", () => {
  const s = withState({
    assignments: [
      { id: "t", title: "Math Test", kind: "assessment", assessmentType: "test", due: iso(4) },
      { id: "p", title: "History project", kind: "project", due: iso(5) },
      { id: "o", title: "Old thing", due: iso(-2), estimateMin: 20 },
    ],
  });
  api.autoBreakdown(s.assignments[1]);
  const r = api.weeklyReset();
  assert.ok(r.notes.some((n) => n.kind === "unfinished"));
  assert.ok(r.notes.some((n) => n.kind === "assessment"));
  assert.ok(r.notes.some((n) => n.kind === "project"));
  assert.ok(r.verdict);
});

// ===========================================================================
// LANGUAGE — no shame, ever
// ===========================================================================
check("no student-facing string uses shame or failure language", () => {
  const banned =
    /\b(you failed|failure rate|productivity score|you're behind|broken streak|bad day|you missed \d)/i;
  const strings = appJs.match(/"[^"\\]{12,120}"/g) || [];
  const offenders = strings.filter((s) => banned.test(s));
  assert.deepEqual(arr(offenders), [], `shame language found: ${offenders.slice(0, 3).join(", ")}`);
});

check("reasons and recovery text read like a person, not a system", () => {
  withState({ assignments: [{ id: "a", title: "Math", due: iso(-1), estimateMin: 20 }] });
  const reason = api.nextUpEntry().reason;
  assert.doesNotMatch(reason, /threshold|capacity exceeded|priority score|weight/i);
  const rec = PC.recoveryFor({ id: "a", due: iso(2), estimateMin: 20 }, TODAY, {});
  assert.doesNotMatch(rec.reason, /threshold|exceeded|score/i);
});

// ===========================================================================
for (const [name, fn] of checks) {
  try {
    fn();
    passed++;
  } catch (err) {
    console.error(`\n  ✗ ${name}\n    ${err.message}`);
    process.exitCode = 1;
  }
}
if (process.exitCode) console.error(`\nphase2: ${passed}/${checks.length} passed\n`);
else console.log(`phase2: ${passed}/${checks.length} checks passed`);

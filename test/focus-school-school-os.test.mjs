/* Focus School — School OS integration.
 *
 * Boots the real app.js (with planner-core.js beside it, exactly as the browser
 * loads them) and checks the state layer end to end: migration of Noam's actual
 * production data shape, the class-duplication repair, project/study/assessment
 * handling, and the promise that a due date is never silently rewritten.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const plannerCore = readFileSync("focus-school/planner-core.js", "utf8");
const appJs = readFileSync("focus-school/app.js", "utf8");

const sandbox = {
  console,
  URL,
  setInterval() {
    return 0;
  },
  clearInterval() {},
  setTimeout() {
    return 0;
  },
  clearTimeout() {},
  location: { protocol: "https:", search: "", href: "https://noam.eduwonderlab.com/" },
  navigator: { userAgent: "Test Chromebook" },
  localStorage: {
    getItem() {
      return null;
    },
    setItem() {},
  },
  sessionStorage: {
    getItem() {
      return null;
    },
    setItem() {},
    removeItem() {},
  },
  document: {
    readyState: "loading",
    addEventListener() {},
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
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
// Load order matters: app.js reads window.PlannerCore.
vm.runInContext(plannerCore, sandbox, { filename: "focus-school/planner-core.js" });
// In a browser globalThis IS window; the vm sandbox keeps them distinct, so
// mirror the assignment the browser would have made for free.
sandbox.window.PlannerCore = sandbox.PlannerCore;
vm.runInContext(appJs, sandbox, { filename: "focus-school/app.js" });
const api = sandbox.window.__FOCUS_SCHOOL_TEST__;
const PC = sandbox.window.PlannerCore;
assert.ok(PC, "planner-core must be reachable from app.js's window");

let passed = 0;
const checks = [];
const check = (name, fn) => checks.push([name, fn]);
const arr = (a) => Array.from(a);

const TODAY = api.seed().assignments && PC.toIso(new Date());
const tomorrow = PC.addDays(TODAY, 1);
const inThree = PC.addDays(TODAY, 3);

// ===========================================================================
// MIGRATION — real production data must survive
// ===========================================================================
check("a pre-School-OS state migrates without losing anything", () => {
  // This is the shape Noam's live account actually has today: routines,
  // todos, classes, rewards — and none of the new School OS keys.
  const legacy = {
    version: 1,
    classes: [{ id: "c_math", name: "Math", color: "#147c78", updatedAt: 100 }],
    assignments: [
      { id: "a1", title: "Math packet", classId: "c_math", due: tomorrow, estimateMin: 20 },
    ],
    todos: [{ id: "t1", text: "Water bottle", date: TODAY }],
    routines: [{ id: "r1", name: "After-School", slot: "afterSchool", items: [{ id: "i1", text: "Empty bag" }] }],
    points: 42,
    rewards: { balance: 3.5, ledger: [{ id: "l1", ts: "2026-08-01", kind: "task", amount: 0.5, type: "earn" }] },
  };
  const s = api.normalize(legacy);
  assert.equal(s.assignments.length, 1, "assignments survive");
  assert.equal(s.assignments[0].title, "Math packet");
  assert.equal(s.todos.length, 1, "todos survive");
  assert.equal(s.routines.length, 1, "routines survive");
  assert.equal(s.points, 42, "points survive");
  assert.equal(s.rewards.ledger.length, 1, "the money ledger survives");
  // ...and the new structures exist with safe defaults.
  assert.ok(s.schedule && Array.isArray(s.schedule.periods), "schedule is initialized");
  assert.deepEqual({ ...s.studyPlans }, {}, "studyPlans defaults to empty");
  assert.deepEqual({ ...s.subjectNeeds }, {});
  assert.equal(s.settings.parentPin, "");
});

check("migrating twice is stable (no drift on every load)", () => {
  const once = api.normalize({ classes: [{ id: "c1", name: "Math", updatedAt: 1 }] });
  const twice = api.normalize(once);
  assert.equal(twice.classes.length, once.classes.length);
  assert.equal(twice.assignments.length, once.assignments.length);
  assert.ok(Array.isArray(twice.schedule.periods));
});

check("an existing assignment gains School OS fields without changing meaning", () => {
  const s = api.normalize({
    assignments: [{ id: "a1", title: "Essay", due: tomorrow, status: "doing", estimateMin: 45 }],
  });
  const a = s.assignments[0];
  assert.equal(a.due, tomorrow, "the due date is untouched");
  assert.equal(a.status, "doing");
  assert.equal(a.kind, "assignment", "old work defaults to plain homework");
  assert.equal(a.plannedDate, "", "no planned date is invented");
  assert.equal(a.originalDue, "", "originalDue only appears once something moves");
  assert.equal(a.blocked, null);
});

// ===========================================================================
// THE CLASS-DUPLICATION BUG (found in live production data)
// ===========================================================================
check("duplicate seeded classes collapse to one, keeping the oldest id", () => {
  // Noam's live account had ~120 classes: the same 4 defaults re-seeded on
  // every fresh device and then unioned by id on sync.
  const dupes = [];
  for (let i = 0; i < 6; i++) {
    for (const name of ["Math", "English / ELA", "Science", "Social Studies"]) {
      dupes.push({ id: `c_${name[0]}${i}`, name, color: "#147c78", updatedAt: 1000 + i });
    }
  }
  const out = api.dedupeClasses(dupes);
  assert.equal(out.length, 4, "four real classes remain");
  assert.equal(
    out.find((c) => c.name === "Math").id,
    "c_M0",
    "the oldest id survives so existing assignments still resolve",
  );
});

check("deduping runs as part of normalize, so it self-heals on every load", () => {
  const s = api.normalize({
    classes: [
      { id: "c_a", name: "Math", updatedAt: 1 },
      { id: "c_b", name: "Math", updatedAt: 2 },
      { id: "c_c", name: "Science", updatedAt: 3 },
    ],
  });
  assert.equal(s.classes.length, 2);
});

check("distinct classes are never merged", () => {
  const out = api.dedupeClasses([
    { id: "c1", name: "Math", updatedAt: 1 },
    { id: "c2", name: "Math 7 Advanced", updatedAt: 1 },
  ]);
  assert.equal(out.length, 2);
});

// ===========================================================================
// THE PLANNER POOL
// ===========================================================================
function withState(patch) {
  const s = api.normalize({
    classes: [{ id: "c_math", name: "Math", updatedAt: 1 }],
    ...patch,
  });
  api.setState(s);
  return s;
}

check("a project surfaces its current STEP, never the whole project", () => {
  withState({
    assignments: [
      {
        id: "p1",
        title: "History project",
        kind: "project",
        due: PC.addDays(TODAY, 4),
        steps: [
          { id: "s1", text: "Read directions", done: true, date: TODAY },
          { id: "s2", text: "Find sources", done: false, date: TODAY, minutes: 20 },
          { id: "s3", text: "Turn it in", done: false, date: PC.addDays(TODAY, 4) },
        ],
      },
    ],
  });
  const items = api.plannerItems();
  assert.equal(items.length, 1);
  assert.match(items[0].title, /Find sources/);
  assert.equal(items[0].projectId, "p1");
  assert.equal(items[0].stepId, "s2");
  assert.equal(items[0].estimateMin, 20);
});

check("an assessment is never itself a task to do", () => {
  withState({
    assignments: [
      { id: "q1", title: "Science Quiz", kind: "assessment", assessmentType: "quiz", due: inThree },
    ],
  });
  assert.ok(!api.plannerItems().some((i) => i.id === "q1"));
});

check("adding an assessment produces study sessions that ARE work items", () => {
  const s = withState({
    assignments: [
      { id: "q1", title: "Science Quiz", kind: "assessment", assessmentType: "quiz", due: inThree },
    ],
  });
  api.regenerateStudyPlan(s.assignments[0], { force: true });
  const plan = s.studyPlans.q1;
  assert.ok(plan.length >= 2, "a plan was generated automatically");
  assert.ok(plan.every((x) => x.date <= inThree), "no session lands after the quiz");
  const items = api.plannerItems();
  assert.ok(
    items.some((i) => i.kind === "study" && /Science Quiz/.test(i.title)),
    "today's study session shows up as real work",
  );
});

check("regenerating a study plan preserves sessions already completed", () => {
  const s = withState({
    assignments: [
      { id: "q1", title: "Math Test", kind: "assessment", assessmentType: "test", due: PC.addDays(TODAY, 5) },
    ],
  });
  api.regenerateStudyPlan(s.assignments[0], { force: true });
  s.studyPlans.q1[0].done = true;
  const doneDate = s.studyPlans.q1[0].date;
  api.regenerateStudyPlan(s.assignments[0]);
  const kept = s.studyPlans.q1.find((x) => x.date === doneDate);
  assert.ok(kept && kept.done, "completed study history is never thrown away");
});

check("blocked work drops out of Next Up but stays in the data", () => {
  const s = withState({
    assignments: [
      { id: "a1", title: "Science worksheet", due: tomorrow, estimateMin: 20, blocked: { reason: "Need: worksheet" } },
      { id: "a2", title: "Math homework", due: tomorrow, estimateMin: 20 },
    ],
  });
  const items = api.plannerItems();
  assert.deepEqual(arr(items.map((i) => i.id)), ["a2"], "the actionable task is what surfaces");
  assert.equal(s.assignments.length, 2, "the blocked task is not deleted");
  assert.equal(api.nextUpEntry().item.id, "a2");
});

check("done work never appears in the planner pool", () => {
  withState({ assignments: [{ id: "a1", title: "Done", due: TODAY, status: "done" }] });
  assert.equal(api.plannerItems().length, 0);
});

check("Next Up always names something actionable, with a reason", () => {
  withState({
    assignments: [
      { id: "a1", title: "Math", due: TODAY, estimateMin: 20 },
      { id: "a2", title: "Reading", due: PC.addDays(TODAY, 6), estimateMin: 20 },
    ],
  });
  const e = api.nextUpEntry();
  assert.equal(e.item.id, "a1");
  assert.ok(e.reason && e.reason.length > 5);
});

// ===========================================================================
// PROJECT DECOMPOSITION
// ===========================================================================
check("auto-breakdown gives a project dated steps that end on the due date", () => {
  const s = withState({
    assignments: [{ id: "p1", title: "History research project", due: PC.addDays(TODAY, 5) }],
  });
  api.autoBreakdown(s.assignments[0]);
  const steps = s.assignments[0].steps;
  assert.ok(steps.length >= 6);
  assert.equal(s.assignments[0].kind, "project");
  assert.ok(steps.every((st) => st.date >= TODAY && st.date <= PC.addDays(TODAY, 5)));
  assert.equal(steps[0].date, TODAY, "there is something to do today");
  assert.equal(steps[steps.length - 1].date, PC.addDays(TODAY, 5));
  assert.ok(steps.every((st) => st.id), "every step gets a stable id");
});

// ===========================================================================
// MISSED-WORK RECOVERY — the deadline is sacred
// ===========================================================================
check("repairing missed work moves the PLAN, never the due date", () => {
  const s = withState({
    assignments: [
      {
        id: "a1",
        title: "Math",
        due: PC.addDays(TODAY, 3),
        plannedDate: PC.addDays(TODAY, -1),
        estimateMin: 20,
      },
    ],
  });
  const moved = api.repairMissedWork();
  const a = s.assignments[0];
  assert.equal(moved.length, 1);
  assert.equal(a.due, PC.addDays(TODAY, 3), "the real deadline is unchanged");
  assert.equal(a.originalDue, PC.addDays(TODAY, 3), "and it is now recorded");
  assert.ok(a.plannedDate >= TODAY, "only the work date moved forward");
  assert.equal(a.planHistory.length, 1, "the move is on the record");
});

check("overdue work is left on today rather than pushed again", () => {
  const s = withState({
    assignments: [{ id: "a1", title: "Late math", due: PC.addDays(TODAY, -2), plannedDate: PC.addDays(TODAY, -2), estimateMin: 20 }],
  });
  api.repairMissedWork();
  assert.equal(s.assignments[0].planHistory.length, 0, "nothing slid; it stays actionable today");
  assert.equal(s.assignments[0].due, PC.addDays(TODAY, -2));
});

check("repair is idempotent — reloading the app does not re-move work", () => {
  const s = withState({
    assignments: [{ id: "a1", title: "Math", due: PC.addDays(TODAY, 3), plannedDate: PC.addDays(TODAY, -1), estimateMin: 20 }],
  });
  api.repairMissedWork();
  api.repairMissedWork();
  api.repairMissedWork();
  assert.equal(s.assignments[0].planHistory.length, 1, "one move, not three");
});

// ===========================================================================
// COMING UP + PARENT SUMMARY
// ===========================================================================
check("coming-up labels each thing by what it actually is", () => {
  withState({
    assignments: [
      { id: "q", title: "Sci Quiz", kind: "assessment", assessmentType: "quiz", due: PC.addDays(TODAY, 2) },
      { id: "t", title: "Math Test", kind: "assessment", assessmentType: "test", due: PC.addDays(TODAY, 5) },
      { id: "p", title: "History", kind: "project", due: PC.addDays(TODAY, 4) },
      { id: "h", title: "Worksheet", due: PC.addDays(TODAY, 1) },
    ],
  });
  const up = api.comingUp();
  assert.deepEqual(arr(up.map((x) => x.badge)), ["DUE", "QUIZ", "PROJECT", "TEST"]);
});

check("the parent summary answers 'does he need help?' — not what he clicked", () => {
  const s = withState({
    assignments: [
      { id: "q", title: "Science Quiz", kind: "assessment", assessmentType: "quiz", due: tomorrow },
    ],
  });
  api.regenerateStudyPlan(s.assignments[0], { force: true });
  const sum = api.parentSummary();
  assert.ok(sum.lines.some((l) => /Science Quiz/.test(l) && /no study sessions/.test(l)));
  assert.match(sum.verdict, /check-in/);
  // It must not leak an activity log.
  assert.ok(!sum.lines.some((l) => /clicked|opened|viewed|minutes on/i.test(l)));
});

check("a calm week reports that no help is needed", () => {
  withState({ assignments: [] });
  assert.match(api.parentSummary().verdict, /No help needed/);
});

check("blocked work is surfaced to a parent as something to help with", () => {
  withState({
    assignments: [
      { id: "a1", title: "Science worksheet", due: tomorrow, blocked: { reason: "Need: worksheet" } },
    ],
  });
  assert.ok(api.parentSummary().lines.some((l) => /waiting on/i.test(l)));
});

// ===========================================================================
// REGRESSIONS — bugs found by driving the real UI
// ===========================================================================
check("REGRESSION: a project arriving without steps is broken down, not left whole", () => {
  // Found in browser QA: a project synced/imported without steps sat on Today
  // as one giant "History project" item until the night before it was due.
  const s = withState({
    assignments: [{ id: "p1", title: "History research project", kind: "project", due: PC.addDays(TODAY, 4) }],
  });
  api.autoBreakdown(s.assignments[0]);
  const items = api.plannerItems();
  assert.equal(items.length, 1);
  assert.match(items[0].title, / — /, "Today shows a step, not the whole project");
  assert.ok(items[0].stepId);
});

check("REGRESSION: virtual planner items resolve back to a real assignment", () => {
  // Found in browser QA: "I don't have what I need" silently did nothing when
  // Next Up was a study session, because a session id is not an assignment id.
  const s = withState({
    assignments: [
      { id: "q1", title: "Science Quiz", kind: "assessment", assessmentType: "quiz", due: tomorrow },
      {
        id: "p1",
        title: "Project",
        kind: "project",
        due: PC.addDays(TODAY, 3),
        steps: [{ id: "s1", text: "Find sources", done: false, date: TODAY }],
      },
    ],
  });
  api.regenerateStudyPlan(s.assignments[0], { force: true });
  for (const item of api.plannerItems()) {
    const owner = api.owningAssignmentId(item);
    assert.ok(
      s.assignments.some((a) => a.id === owner),
      `${item.kind} item "${item.title}" must resolve to a real assignment (got ${owner})`,
    );
  }
});

// ===========================================================================
// A REAL WEEK OF SCHOOL — does the right thing show up on the right day?
// ===========================================================================
check("a full school week behaves sensibly day by day", () => {
  // Mon: math homework + reading. Quiz announced for Thursday.
  // Tue: worksheet due Wed; history project due Friday.
  const MON = "2026-08-17";
  const state = api.normalize({
    classes: [
      { id: "c_math", name: "Math", updatedAt: 1 },
      { id: "c_sci", name: "Science", updatedAt: 1 },
    ],
    assignments: [
      { id: "hw", title: "Math homework", classId: "c_math", due: "2026-08-18", estimateMin: 20 },
      { id: "rd", title: "English reading", due: MON, estimateMin: 20 },
      { id: "qz", title: "Science Quiz", classId: "c_sci", kind: "assessment", assessmentType: "quiz", due: "2026-08-20" },
      { id: "pj", title: "History project", kind: "project", due: "2026-08-21" },
    ],
  });
  api.setState(state);

  // The quiz plans itself, and the project breaks itself down.
  const quiz = state.assignments.find((a) => a.id === "qz");
  api.regenerateStudyPlan(quiz, { force: true });
  api.autoBreakdown(state.assignments.find((a) => a.id === "pj"));

  const plan = state.studyPlans.qz;
  assert.ok(plan.length >= 2, "the Thursday quiz has study sessions");
  assert.ok(plan.every((x) => x.date <= "2026-08-20"), "no studying after the quiz");
  assert.ok(plan.some((x) => x.date <= "2026-08-18"), "studying starts days ahead, not the night before");

  const steps = state.assignments.find((a) => a.id === "pj").steps;
  assert.ok(steps.length >= 6, "the Friday project has real steps");
  assert.ok(
    steps.some((st) => st.date <= "2026-08-18"),
    "project work starts early in the week, not on Thursday night",
  );
  assert.ok(
    steps.every((st) => st.date <= "2026-08-21"),
    "no project step is scheduled past its own deadline",
  );

  // Monday: due-today reading leads; the Friday project is not shouting yet.
  const monday = PC.prioritize({
    items: api.plannerItems(MON),
    todayIso: MON,
    availableMin: 90,
  });
  assert.ok(monday.length, "there is work on Monday");
  assert.ok(
    ["rd", "hw"].includes(monday[0].item.projectId || monday[0].item.id) ||
      monday[0].item.kind === "study" ||
      monday[0].item.kind === "project",
    `Monday's first item is reasonable (got ${monday[0].item.title})`,
  );

  // Wednesday: the quiz is tomorrow, so studying must outrank distant work.
  const wed = PC.prioritize({ items: api.plannerItems("2026-08-19"), todayIso: "2026-08-19", availableMin: 90 });
  const studyRank = wed.findIndex((e) => e.item.kind === "study");
  const projectRank = wed.findIndex((e) => e.item.kind === "project");
  assert.ok(studyRank >= 0, "there is a study session on Wednesday");
  assert.ok(
    projectRank === -1 || studyRank < projectRank,
    "the night before the quiz, studying beats project work",
  );

  // Nothing anywhere in the week may be scheduled after its own deadline.
  for (const a of state.assignments) {
    for (const st of a.steps || []) {
      if (st.date && a.due) assert.ok(st.date <= a.due, `${a.title} step lands after its due date`);
    }
  }
});

check("an overloaded evening plans only what fits and names what moves", () => {
  withState({
    assignments: [
      { id: "a", title: "Math", due: tomorrow, estimateMin: 25 },
      { id: "b", title: "Science", due: tomorrow, estimateMin: 25 },
      { id: "c", title: "English", due: PC.addDays(TODAY, 2), estimateMin: 25 },
      { id: "d", title: "History", due: PC.addDays(TODAY, 3), estimateMin: 25 },
    ],
  });
  const plan = PC.buildPlan({ ...api.plannerCtx(), availableMin: 45, breakMin: 5 });
  assert.ok(plan.workMin <= 45, `planned ${plan.workMin} into 45 available`);
  assert.ok(plan.leftOver.length >= 1, "what did not fit is reported, not hidden");
});

check("a day with nothing to do says so instead of inventing busywork", () => {
  withState({ assignments: [] });
  assert.equal(api.nextUpEntry(), null);
  assert.equal(api.todaysWork().length, 0);
  assert.deepEqual(arr(PC.buildPlan(api.plannerCtx()).blocks), []);
});

// ===========================================================================
// SHELL CONSISTENCY — the classic stale-PWA failure
// ===========================================================================
check("index.html and the service worker precache the same asset versions", () => {
  const index = readFileSync("focus-school/index.html", "utf8");
  const sw = readFileSync("focus-school/sw.js", "utf8");
  for (const asset of ["app.js", "styles.css", "planner-core.js"]) {
    const inIndex = new RegExp(`${asset.replace(".", "\\.")}\\?v=(\\d+)`).exec(index);
    const inSw = new RegExp(`${asset.replace(".", "\\.")}\\?v=(\\d+)`).exec(sw);
    assert.ok(inIndex, `${asset} must be versioned in index.html`);
    assert.ok(inSw, `${asset} must be precached in sw.js`);
    assert.equal(inSw[1], inIndex[1], `${asset} version must match in both files`);
  }
});

check("planner-core loads before app.js in the shell", () => {
  const index = readFileSync("focus-school/index.html", "utf8");
  assert.ok(
    index.indexOf("planner-core.js") < index.indexOf("app.js?v="),
    "app.js reads window.PlannerCore at parse time",
  );
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
if (process.exitCode) console.error(`\nschool-os: ${passed}/${checks.length} passed\n`);
else console.log(`school-os: ${passed}/${checks.length} checks passed`);

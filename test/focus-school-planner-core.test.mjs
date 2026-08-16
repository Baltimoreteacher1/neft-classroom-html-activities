/* Focus School — planner core.
 *
 * These are behavior tests for the school-planning brain, not render tests:
 * each one asks "would Noam be told the right thing in this situation?".
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const src = readFileSync("focus-school/planner-core.js", "utf8");
const sandbox = { module: { exports: {} }, console };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(src, sandbox, { filename: "planner-core.js" });
const P = sandbox.PlannerCore;
assert.ok(P, "PlannerCore should be exposed on the global");
assert.equal(sandbox.module.exports, P, "and also exported for node consumers");

let passed = 0;
const checks = [];
function check(name, fn) {
  checks.push([name, fn]);
}

// --- Monday 2026-08-17 is the reference "today" for every dated test. -------
const MON = "2026-08-17";
const TUE = "2026-08-18";
const WED = "2026-08-19";
const THU = "2026-08-20";
const FRI = "2026-08-21";
const SAT = "2026-08-22";

const CLASSES = [
  { id: "c_math", name: "Math" },
  { id: "c_sci", name: "Science" },
  { id: "c_ela", name: "English / ELA" },
  { id: "c_pe", name: "PE" },
];

const SCHEDULE = {
  enabled: true,
  startTime: "08:15",
  dismissTime: "15:05",
  rotation: { type: "ab", labels: ["A", "B"], anchorDate: MON, anchorIndex: 0 },
  periods: [
    { id: "p1", name: "Math", classId: "c_math", start: "08:20", end: "09:10", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], room: "212" },
    { id: "p2", name: "Science", classId: "c_sci", start: "09:15", end: "10:05", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], room: "118" },
    { id: "p3", name: "Lunch", start: "11:00", end: "11:30", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], kind: "lunch" },
    { id: "p4", name: "English", classId: "c_ela", start: "12:00", end: "12:50", days: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
    // PE only meets on A days — the rotation is what makes it a real schedule.
    { id: "p5", name: "PE", classId: "c_pe", start: "13:00", end: "13:50", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], rotationDays: ["A"] },
  ],
  exceptions: [
    { date: THU, type: "early-dismissal", label: "Early dismissal", dismissTime: "12:30" },
    { date: FRI, type: "no-school", label: "Teacher workday" },
  ],
  activities: [{ id: "a1", name: "Baseball practice", days: ["Tue"], start: "16:00", end: "17:30", place: "Field 2" }],
};

const task = (o) => ({
  id: o.id,
  title: o.title,
  classId: o.classId || "",
  kind: o.kind || "assignment",
  assessmentType: o.assessmentType || "",
  due: o.due || "",
  plannedDate: o.plannedDate || "",
  status: o.status || "todo",
  importance: o.importance || "normal",
  estimateMin: o.estimateMin || 0,
  steps: o.steps || [],
});

// ===========================================================================
// SCHOOL SCHEDULE
// ===========================================================================
check("normal school day resolves its periods in order", () => {
  const plan = P.dayPlan(SCHEDULE, MON);
  assert.equal(plan.school, true);
  assert.deepEqual([...plan.periods.map((p) => p.name)], ["Math", "Science", "Lunch", "English", "PE"]);
  assert.equal(plan.startMin, P.hhmmToMin("08:20"));
  assert.equal(plan.dismissMin, P.hhmmToMin("15:05"));
});

check("classPeriods excludes lunch so packing/NEXT never says 'bring Lunch'", () => {
  assert.ok(!P.dayPlan(SCHEDULE, MON).classPeriods.some((p) => p.kind === "lunch"));
});

check("rotating day: PE meets on A days and is absent on B days", () => {
  assert.equal(P.rotationDayFor(SCHEDULE, MON), "A");
  assert.equal(P.rotationDayFor(SCHEDULE, TUE), "B");
  assert.ok(P.dayPlan(SCHEDULE, MON).periods.some((p) => p.name === "PE"));
  assert.ok(!P.dayPlan(SCHEDULE, TUE).periods.some((p) => p.name === "PE"));
});

check("rotation skips no-school days instead of burning a letter on them", () => {
  // Fri = no school, Sat/Sun = weekend. Wed=A, Thu=B, next school day Mon=A.
  assert.equal(P.rotationDayFor(SCHEDULE, WED), "A");
  assert.equal(P.rotationDayFor(SCHEDULE, THU), "B");
  assert.equal(P.rotationDayFor(SCHEDULE, "2026-08-24"), "A");
});

check("weekend is not a school day and reports no periods", () => {
  const plan = P.dayPlan(SCHEDULE, SAT);
  assert.equal(plan.school, false);
  assert.equal(plan.periods.length, 0);
  assert.equal(plan.label, "Weekend");
});

check("no-school exception wins over the weekday timetable", () => {
  const plan = P.dayPlan(SCHEDULE, FRI);
  assert.equal(plan.school, false);
  assert.equal(plan.label, "Teacher workday");
  assert.equal(plan.periods.length, 0);
});

check("early dismissal shortens the day and is flagged", () => {
  const plan = P.dayPlan(SCHEDULE, THU);
  assert.equal(plan.school, true);
  assert.equal(plan.earlyDismissal, true);
  assert.equal(plan.dismissMin, P.hhmmToMin("12:30"));
});

check("NOW/NEXT during the school day names the current and next class", () => {
  const r = P.nowNext(SCHEDULE, MON, P.hhmmToMin("09:20"));
  assert.equal(r.now.name, "Science");
  assert.equal(r.next.name, "Lunch");
  assert.equal(r.minsToNext, 100);
  assert.equal(r.inSchool, true);
});

check("between classes there is no NOW but there is still a NEXT", () => {
  const r = P.nowNext(SCHEDULE, MON, P.hhmmToMin("09:12"));
  assert.equal(r.now, null);
  assert.equal(r.next.name, "Science");
  assert.equal(r.minsToNext, 3);
});

check("after dismissal the app is in after-school mode, not school mode", () => {
  const r = P.nowNext(SCHEDULE, MON, P.hhmmToMin("16:00"));
  assert.equal(r.inSchool, false);
  assert.equal(r.afterSchool, true);
  assert.equal(r.next, null);
});

check("available minutes start at dismissal, not at the moment he checks", () => {
  // Asking at 10am on a school day: work time starts at 3:05pm, not now.
  const mins = P.availableMinutes(SCHEDULE, MON, P.hhmmToMin("10:00"), { bedtime: "21:00" });
  assert.equal(mins, 150, "capped at the humane after-school ceiling");
});

check("a scheduled activity is carved out of the available work time", () => {
  // Tuesday: dismiss 15:05, baseball 16:00-17:30 -> only 15:05-16:00 before it.
  const mins = P.availableMinutes(SCHEDULE, TUE, P.hhmmToMin("15:10"), { bedtime: "21:00" });
  assert.equal(mins, 50);
});

// ===========================================================================
// PRIORITY ENGINE
// ===========================================================================
check("overdue work outranks everything else", () => {
  const items = [
    task({ id: "a", title: "Math packet", due: "2026-08-14", estimateMin: 20 }),
    task({ id: "b", title: "Read ch 4", due: MON, estimateMin: 20 }),
    task({ id: "c", title: "Poster", due: FRI, estimateMin: 20 }),
  ];
  const r = P.prioritize({ items, todayIso: MON, availableMin: 60 });
  assert.equal(r[0].id, "a");
  assert.match(r[0].reason, /days late/);
});

check("due today beats due tomorrow beats later — and each says why", () => {
  const items = [
    task({ id: "later", title: "Later", due: THU, estimateMin: 20 }),
    task({ id: "tmrw", title: "Tomorrow", due: TUE, estimateMin: 20 }),
    task({ id: "today", title: "Today", due: MON, estimateMin: 20 }),
  ];
  const r = P.prioritize({ items, todayIso: MON, availableMin: 60 });
  assert.deepEqual([...r.map((x) => x.id)], ["today", "tmrw", "later"]);
  assert.equal(r[0].reason, "Next because it is due today.");
  assert.equal(r[1].reason, "Next because it is due tomorrow.");
});

check("an assessment never appears as a task to 'do' — only its study work does", () => {
  const items = [
    task({ id: "quiz", title: "Science Quiz", kind: "assessment", assessmentType: "quiz", due: WED }),
    task({ id: "hw", title: "Math homework", due: TUE, estimateMin: 20 }),
  ];
  const r = P.prioritize({ items, todayIso: MON, availableMin: 60 });
  assert.deepEqual([...r.map((x) => x.id)], ["hw"]);
});

check("a study session for Wednesday's quiz explains itself by the quiz", () => {
  const study = task({ id: "s1", title: "Study: vocabulary", kind: "study", due: MON, estimateMin: 10 });
  const r = P.prioritize({ items: [study], todayIso: MON, availableMin: 60 });
  assert.equal(r[0].reason, "Next because it is due today.");
});

check("already-started work is pulled forward with an honest reason", () => {
  const items = [
    task({ id: "fresh", title: "Fresh", due: TUE, estimateMin: 20 }),
    task({ id: "started", title: "Started", due: TUE, estimateMin: 20, status: "doing" }),
  ];
  const r = P.prioritize({ items, todayIso: MON, availableMin: 60 });
  assert.equal(r[0].id, "started");
  assert.equal(r[0].reason, "Next because you already started.");
});

check("a started far-future task still cannot outrank today's homework", () => {
  const items = [
    task({ id: "today", title: "Due today", due: MON, estimateMin: 20 }),
    task({ id: "far", title: "Far off", due: "2026-09-15", estimateMin: 20, status: "doing" }),
  ];
  assert.equal(P.prioritize({ items, todayIso: MON, availableMin: 60 })[0].id, "today");
});

check("a task that does not fit the time left loses to one that does", () => {
  const items = [
    task({ id: "big", title: "Big", due: TUE, estimateMin: 90 }),
    task({ id: "small", title: "Small", due: TUE, estimateMin: 15 }),
  ];
  assert.equal(P.prioritize({ items, todayIso: MON, availableMin: 20 })[0].id, "small");
});

check("today's project step is treated as real work, not a distant project", () => {
  const items = [
    task({ id: "hw", title: "Homework", due: WED, estimateMin: 20 }),
    task({ id: "step", title: "Project: find sources", kind: "project", due: FRI, plannedDate: MON, estimateMin: 20 }),
  ];
  assert.equal(P.prioritize({ items, todayIso: MON, availableMin: 60 })[0].id, "step");
});

check("ordering is deterministic for identical items (id breaks the final tie)", () => {
  const items = [
    task({ id: "zzz", title: "Same", due: TUE, estimateMin: 20 }),
    task({ id: "aaa", title: "Same", due: TUE, estimateMin: 20 }),
  ];
  const once = P.prioritize({ items, todayIso: MON, availableMin: 60 }).map((x) => x.id);
  const twice = P.prioritize({ items: items.slice().reverse(), todayIso: MON, availableMin: 60 }).map((x) => x.id);
  assert.deepEqual([...once], ["aaa", "zzz"]);
  assert.deepEqual([...once], [...twice], "input order must not change the result");
});

check("completed work never appears in the ranking", () => {
  const items = [task({ id: "done", title: "Done", due: MON, status: "done" })];
  assert.equal(P.prioritize({ items, todayIso: MON, availableMin: 60 }).length, 0);
});

check("nothing due returns no next-up rather than throwing", () => {
  assert.equal(P.nextUp({ items: [], todayIso: MON, availableMin: 60 }), null);
});

// ===========================================================================
// ASSESSMENTS / STUDY PLANS
// ===========================================================================
check("a quiz three days out gets a spaced plan ending in a light review", () => {
  const quiz = task({ id: "q", title: "Science Quiz", kind: "assessment", assessmentType: "quiz", due: THU });
  const plan = P.buildStudyPlan(quiz, MON);
  assert.equal(plan.length, 3);
  assert.deepEqual([...plan.map((s) => s.date)], [MON, TUE, WED]);
  assert.equal(plan[plan.length - 1].focus, "Quick review", "last session before the quiz is a review");
  assert.ok(plan.every((s) => s.date <= quiz.due));
});

check("a test gets more sessions than a quiz over the same window", () => {
  const due = "2026-08-27";
  const quiz = P.buildStudyPlan(task({ id: "q", kind: "assessment", assessmentType: "quiz", due }), MON);
  const test = P.buildStudyPlan(task({ id: "t", kind: "assessment", assessmentType: "test", due }), MON);
  assert.ok(test.length > quiz.length, `${test.length} > ${quiz.length}`);
});

check("a test entered late compresses instead of inventing days", () => {
  const test = task({ id: "t", title: "Math Test", kind: "assessment", assessmentType: "test", due: TUE });
  const plan = P.buildStudyPlan(test, MON);
  assert.equal(plan.length, 1, "only one day actually exists");
  assert.deepEqual([...plan.map((s) => s.date)], [MON]);
  assert.ok(plan[0].minutes > 10, "a compressed plan asks for more time in that one session");
});

check("a same-day assessment still offers one session, never an empty plan", () => {
  const plan = P.buildStudyPlan(task({ id: "t", kind: "assessment", assessmentType: "quiz", due: MON }), MON);
  assert.equal(plan.length, 1);
  assert.equal(plan[0].date, MON);
});

check("a past assessment produces no study plan", () => {
  assert.deepEqual([...P.buildStudyPlan(task({ id: "t", kind: "assessment", due: "2026-08-10" }), MON)], []);
});

check("study progress reports completion toward the assessment", () => {
  const plan = P.buildStudyPlan(task({ id: "q", kind: "assessment", assessmentType: "quiz", due: THU }), MON);
  plan[0].done = true;
  const pr = P.studyProgress(plan);
  assert.equal(pr.done, 1);
  assert.equal(pr.total, 3);
  assert.equal(pr.pct, 33);
});

// ===========================================================================
// PROJECTS
// ===========================================================================
check("break-it-down produces real, ordered steps for the kind of project", () => {
  const steps = P.defaultProjectSteps("History research project");
  assert.ok(steps.length >= 6);
  assert.match(steps[0], /directions/i);
  assert.match(steps[steps.length - 1], /turn it in/i);
  assert.match(P.defaultProjectSteps("Persuasive essay")[0], /directions/i);
  assert.equal(P.projectKindFor("Build a bridge model"), "build");
  assert.equal(P.projectKindFor("Class presentation on Rome"), "presentation");
});

check("project steps are spread across the days before the deadline", () => {
  const steps = P.scheduleProjectSteps(P.defaultProjectSteps("History project"), MON, FRI);
  assert.ok(steps.every((s) => s.date >= MON && s.date <= FRI));
  assert.equal(steps[0].date, MON, "something starts today");
  assert.equal(steps[steps.length - 1].date, FRI, "turn-in lands on the due date");
  const distinct = new Set(steps.map((s) => s.date));
  assert.ok(distinct.size >= 3, "the work is genuinely spread, not dumped on one day");
});

check("a project due today or already late collapses onto today", () => {
  const steps = P.scheduleProjectSteps(["a", "b", "c"], MON, MON);
  assert.ok(steps.every((s) => s.date === MON));
});

check("the surfaced project step is the first unfinished one that is due", () => {
  const project = {
    id: "p",
    steps: [
      { id: "s1", text: "Read directions", done: true, date: MON },
      { id: "s2", text: "Find sources", done: false, date: MON },
      { id: "s3", text: "Outline", done: false, date: WED },
    ],
  };
  assert.equal(P.currentProjectStep(project, MON).id, "s2");
  assert.equal(P.currentProjectStep(project, TUE).id, "s2", "an overdue step stays surfaced");
});

check("a fully finished project surfaces no step", () => {
  assert.equal(P.currentProjectStep({ steps: [{ id: "s1", done: true }] }, MON), null);
});

// ===========================================================================
// START MY PLAN
// ===========================================================================
check("the plan sequences real work with breaks and a total", () => {
  const items = [
    task({ id: "m", title: "Math homework", due: TUE, estimateMin: 20 }),
    task({ id: "s", title: "Science review", due: WED, estimateMin: 15 }),
    task({ id: "e", title: "English reading", due: WED, estimateMin: 20 }),
  ];
  const plan = P.buildPlan({ items, todayIso: MON, availableMin: 120, breakMin: 5, defaultFocusMin: 15 });
  assert.equal(plan.workBlocks.length, 3);
  assert.equal(plan.workBlocks[0].title, "Math homework");
  assert.equal(plan.workMin, 55);
  assert.ok(plan.blocks.some((b) => b.kind === "break"));
  assert.ok(plan.workBlocks.every((b) => b.reason), "every block explains itself");
});

check("a plan never ends on a break", () => {
  const items = [task({ id: "m", title: "Math", due: TUE, estimateMin: 20 })];
  const plan = P.buildPlan({ items, todayIso: MON, availableMin: 120, breakMin: 5 });
  assert.equal(plan.blocks[plan.blocks.length - 1].kind, "work");
});

check("a long task is chunked into a block plus a stated remainder", () => {
  const items = [task({ id: "big", title: "Big essay", due: TUE, estimateMin: 90 })];
  const plan = P.buildPlan({ items, todayIso: MON, availableMin: 120, maxBlockMin: 30 });
  assert.equal(plan.workBlocks[0].minutes, 30);
  assert.equal(plan.workBlocks[0].partial, true);
  assert.equal(plan.workBlocks[0].remainingMin, 60);
});

check("a short window plans only what actually fits and says what is left over", () => {
  const items = [
    task({ id: "a", title: "A", due: MON, estimateMin: 20 }),
    task({ id: "b", title: "B", due: THU, estimateMin: 20 }),
    task({ id: "c", title: "C", due: THU, estimateMin: 20 }),
  ];
  const plan = P.buildPlan({ items, todayIso: MON, availableMin: 25, breakMin: 5 });
  assert.equal(plan.workBlocks.length, 1);
  assert.equal(plan.leftOver.length, 2);
});

check("with clock times the plan reports when he will finish", () => {
  const items = [task({ id: "a", title: "A", due: MON, estimateMin: 20 })];
  const plan = P.buildPlan({ items, todayIso: MON, availableMin: 60, startMin: P.hhmmToMin("15:30") });
  assert.equal(plan.workBlocks[0].startMin, P.hhmmToMin("15:30"));
  assert.equal(plan.finishByMin, P.hhmmToMin("15:50"));
});

check("no open work produces an empty plan, not a crash", () => {
  const plan = P.buildPlan({ items: [], todayIso: MON, availableMin: 60 });
  assert.deepEqual([...plan.blocks], []);
  assert.equal(plan.totalMin, 0);
});

// ===========================================================================
// MISSED-WORK RECOVERY
// ===========================================================================
check("work due today cannot be pushed — it recommends finishing now", () => {
  const r = P.recoveryFor(task({ id: "a", title: "A", due: MON, estimateMin: 15 }), MON, {});
  assert.equal(r.action, "finish-now");
  assert.match(r.reason, /due today/);
});

check("late work recommends finishing rather than sliding again", () => {
  const r = P.recoveryFor(task({ id: "a", title: "A", due: "2026-08-14" }), MON, {});
  assert.equal(r.action, "finish-now");
});

check("work due later moves to tomorrow by default", () => {
  const r = P.recoveryFor(task({ id: "a", title: "A", due: THU, estimateMin: 20 }), MON, { tomorrowLoadMin: 20 });
  assert.equal(r.action, "move");
  assert.equal(r.planTo, TUE);
});

check("a already-loaded tomorrow pushes the work further out instead of dogpiling", () => {
  const r = P.recoveryFor(task({ id: "a", title: "A", due: THU, estimateMin: 30 }), MON, {
    tomorrowLoadMin: 100,
    dailyCapacityMin: 90,
  });
  assert.equal(r.planTo, WED);
  assert.match(r.reason, /already about/);
});

check("rescheduling preserves the real due date and records the move", () => {
  const item = task({ id: "a", title: "A", due: THU, plannedDate: MON, estimateMin: 20 });
  const moved = P.applyRecovery(item, { action: "move", planTo: TUE }, MON);
  assert.equal(moved.due, THU, "the deadline is never silently rewritten");
  assert.equal(moved.originalDue, THU);
  assert.equal(moved.plannedDate, TUE, "only the planned work date moves");
  assert.equal(moved.planHistory.length, 1);
  assert.deepEqual(
    { from: moved.planHistory[0].from, to: moved.planHistory[0].to },
    { from: MON, to: TUE },
  );
});

check("repeated moves keep the FIRST original due date", () => {
  let item = task({ id: "a", title: "A", due: THU, estimateMin: 20 });
  item = P.applyRecovery(item, { action: "move", planTo: TUE }, MON);
  item = P.applyRecovery(item, { action: "move", planTo: WED }, TUE);
  assert.equal(item.originalDue, THU);
  assert.equal(item.planHistory.length, 2);
});

check("day load counts planned work, not due work", () => {
  const items = [
    task({ id: "a", title: "A", due: FRI, plannedDate: TUE, estimateMin: 30 }),
    task({ id: "b", title: "B", due: TUE, estimateMin: 20 }),
    task({ id: "c", title: "C", due: TUE, estimateMin: 20, status: "done" }),
  ];
  assert.equal(P.loadForDay(items, TUE), 50);
});

// ===========================================================================
// NATURAL-LANGUAGE ENTRY
// ===========================================================================
check("'science quiz friday chapters 3-4' becomes a dated quiz with detail", () => {
  const r = P.parseEntry("science quiz friday chapters 3-4", { todayIso: MON, classes: CLASSES });
  assert.equal(r.kind, "assessment");
  assert.equal(r.assessmentType, "quiz");
  assert.equal(r.due, FRI);
  assert.equal(r.classId, "c_sci");
  assert.equal(r.detail, "chapters 3–4");
  assert.equal(r.confidence, "high");
});

check("'math worksheet 1-20 tomorrow 30 min' becomes a timed assignment", () => {
  const r = P.parseEntry("math worksheet 1-20 tomorrow 30 min", { todayIso: MON, classes: CLASSES });
  assert.equal(r.kind, "assignment");
  assert.equal(r.due, TUE);
  assert.equal(r.estimateMin, 30);
  assert.equal(r.classId, "c_math");
  assert.match(r.title, /Worksheet/);
});

check("hours are understood as well as minutes", () => {
  assert.equal(P.parseEntry("essay 2 hrs tomorrow", { todayIso: MON, classes: CLASSES }).estimateMin, 120);
});

check("'today' and 'tonight' both mean today", () => {
  assert.equal(P.parseEntry("read ch 2 tonight", { todayIso: MON, classes: CLASSES }).due, MON);
  assert.equal(P.parseEntry("read ch 2 today", { todayIso: MON, classes: CLASSES }).due, MON);
});

check("a weekday already passed this week means the NEXT one", () => {
  // Said on Monday, "monday" means a week out — never today by accident.
  assert.equal(P.parseEntry("math test monday", { todayIso: MON, classes: CLASSES }).due, "2026-08-24");
  assert.equal(P.parseEntry("math test next friday", { todayIso: MON, classes: CLASSES }).due, "2026-08-28");
});

check("a numeric date is understood", () => {
  assert.equal(P.parseEntry("history project 9/4", { todayIso: MON, classes: CLASSES }).due, "2026-09-04");
});

check("projects are recognized and given a realistic default estimate", () => {
  const r = P.parseEntry("history project friday", { todayIso: MON, classes: CLASSES });
  assert.equal(r.kind, "project");
  assert.equal(r.estimateMin, 45);
});

check("ambiguous text is flagged low-confidence so the UI must confirm it", () => {
  const r = P.parseEntry("finish that thing", { todayIso: MON, classes: CLASSES });
  assert.equal(r.confidence, "low");
  assert.equal(r.due, "");
  assert.ok(r.title, "but it still produces something editable rather than nothing");
});

check("empty input parses to nothing", () => {
  assert.equal(P.parseEntry("   ", { todayIso: MON, classes: CLASSES }), null);
});

// ===========================================================================
// PACK FOR TOMORROW
// ===========================================================================
check("the pack list is derived from tomorrow's actual classes and due work", () => {
  const items = [
    task({ id: "sci", title: "Science worksheet", classId: "c_sci", due: TUE }),
    task({ id: "far", title: "Not tomorrow", classId: "c_math", due: THU }),
  ];
  const list = P.packList({ schedule: SCHEDULE, items, classes: CLASSES, dateIso: TUE, subjectNeeds: { c_pe: ["PE clothes"] } });
  assert.equal(list.school, true);
  assert.deepEqual([...list.classNames], ["Math", "Science", "English / ELA"]);
  assert.ok(list.bring.includes("Chromebook"));
  assert.ok(list.bring.includes("Science: Science worksheet"));
  assert.ok(!list.bring.some((b) => /Not tomorrow/.test(b)), "work due later is not packed");
  assert.ok(!list.bring.includes("PE clothes"), "PE does not meet on a B day");
});

check("PE day pulls its configured gear into the list", () => {
  const list = P.packList({ schedule: SCHEDULE, items: [], classes: CLASSES, dateIso: WED, subjectNeeds: { c_pe: ["PE clothes"] } });
  assert.equal(P.rotationDayFor(SCHEDULE, WED), "A");
  assert.ok(list.bring.includes("PE clothes"));
});

check("a project due tomorrow raises a loud alert, not just a line item", () => {
  const items = [task({ id: "p", title: "Science project", classId: "c_sci", kind: "project", due: TUE })];
  const list = P.packList({ schedule: SCHEDULE, items, classes: CLASSES, dateIso: TUE });
  assert.ok(list.alerts.some((a) => /Science project is due tomorrow/.test(a)));
});

check("an after-school activity shows up as an alert on its day", () => {
  const list = P.packList({ schedule: SCHEDULE, items: [], classes: CLASSES, dateIso: TUE });
  assert.ok(list.alerts.some((a) => /Baseball practice/.test(a)));
});

check("no school tomorrow says so instead of listing an empty bag", () => {
  const list = P.packList({ schedule: SCHEDULE, items: [], classes: CLASSES, dateIso: FRI });
  assert.equal(list.school, false);
  assert.equal(list.label, "Teacher workday");
  assert.deepEqual([...list.classNames], []);
});

// ===========================================================================
// SUPPORT FLOWS
// ===========================================================================
check("every 'I'm stuck' reason offers concrete steps and one action", () => {
  assert.equal(P.STUCK_OPTIONS.length, 6);
  for (const o of P.STUCK_OPTIONS) {
    assert.ok(o.steps.length >= 3, `${o.id} needs real steps`);
    assert.ok(o.action && o.action.act, `${o.id} needs an action`);
    assert.ok(o.title);
  }
});

check("'I don't have what I need' captures the gap instead of pretending", () => {
  const o = P.STUCK_OPTIONS.find((x) => x.id === "missing");
  assert.equal(o.action.act, "capture-missing");
  assert.ok(!/work for/i.test(o.steps.join(" ")), "it must not tell him to just start anyway");
});

check("overwhelmed mode is a chain of single tiny actions with an exit", () => {
  const steps = P.overwhelmedSteps({ title: "Math homework" });
  assert.ok(steps.length >= 3);
  assert.match(steps[0].text, /Open Math homework/);
  assert.ok(steps[steps.length - 1].action.act === "overwhelm-exit", "there is always a way out");
});

// ===========================================================================
// ESTIMATE LEARNING
// ===========================================================================
check("estimates only shift after enough real samples", () => {
  let model = {};
  assert.equal(P.suggestEstimate(model, "c_math", 20), 20);
  for (let i = 0; i < 4; i++) {
    model = P.updateEstimateModel(model, { classId: "c_math", estimateMin: 20, actualMin: 30 });
  }
  assert.equal(P.suggestEstimate(model, "c_math", 20), 30, "math consistently takes 1.5x as long");
  assert.equal(P.suggestEstimate(model, "c_ela", 20), 20, "other classes are unaffected");
});

check("the estimate model is bounded so one wild session cannot distort it", () => {
  let model = {};
  for (let i = 0; i < 5; i++) {
    model = P.updateEstimateModel(model, { classId: "c_math", estimateMin: 5, actualMin: 600 });
  }
  assert.ok(model.c_math.ratio <= 3);
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
if (process.exitCode) {
  console.error(`\nplanner-core: ${passed}/${checks.length} passed\n`);
} else {
  console.log(`planner-core: ${passed}/${checks.length} checks passed`);
}

/* Focus School — real user-flow QA.
 *
 * Drives the app the way Noam actually would: after school, on a Wednesday,
 * with homework, a quiz coming, a project, and something forgotten at school.
 * Asserts what he SEES, not that a component rendered.
 *
 *   node tools/focus-school-qa.mjs [baseUrl]
 */
import { chromium } from "playwright";

const BASE = process.argv[2] || "http://localhost:8791/";
const results = [];
const errors = [];
let failed = 0;

function ok(name, cond, detail = "") {
  results.push([cond ? "PASS" : "FAIL", name, detail]);
  if (!cond) failed++;
}

const iso = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// A realistic mid-week state: overdue math, reading due today, a quiz in two
// days, and a project due Friday.
const SEED = {
  version: 1,
  settings: { studentName: "Noam", sync: { enabled: false, code: "" }, welcomeDismissed: true },
  classes: [
    { id: "c_math", name: "Math", color: "#147c78", updatedAt: 1 },
    { id: "c_sci", name: "Science", color: "#2a8f5c", updatedAt: 1 },
    { id: "c_ela", name: "English / ELA", color: "#c0473a", updatedAt: 1 },
  ],
  assignments: [
    { id: "a_math", title: "Math homework", classId: "c_math", due: iso(1), estimateMin: 20 },
    { id: "a_read", title: "English reading", classId: "c_ela", due: iso(0), estimateMin: 20 },
    {
      id: "a_quiz",
      title: "Science Quiz",
      classId: "c_sci",
      kind: "assessment",
      assessmentType: "quiz",
      due: iso(2),
    },
    {
      id: "a_proj",
      title: "History research project",
      kind: "project",
      due: iso(4),
      estimateMin: 60,
    },
  ],
  schedule: {
    enabled: true,
    startTime: "08:15",
    dismissTime: "15:05",
    periods: [
      {
        id: "p1",
        name: "Math",
        classId: "c_math",
        start: "08:20",
        end: "09:10",
        days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
        room: "212",
      },
      {
        id: "p2",
        name: "Science",
        classId: "c_sci",
        start: "09:15",
        end: "10:05",
        days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      },
      {
        id: "p3",
        name: "Lunch",
        start: "11:00",
        end: "11:30",
        days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
        kind: "lunch",
      },
      {
        id: "p4",
        name: "PE",
        classId: "c_pe",
        start: "13:00",
        end: "13:50",
        days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      },
    ],
    exceptions: [],
    activities: [],
  },
  subjectNeeds: { c_pe: ["PE clothes"] },
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
page.on("console", (m) => {
  if (m.type() === "error" && !/favicon|api\/|Failed to load resource/.test(m.text())) {
    errors.push(m.text());
  }
});
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
await page.addInitScript((seed) => {
  localStorage.setItem("focus-school:state", JSON.stringify(seed));
  // Opt into the app's own test hook so QA can read real state, not the DOM.
  window.__FOCUS_SCHOOL_TEST__ = {};
}, SEED);

// --- Boot -----------------------------------------------------------------
await page.goto(BASE, { waitUntil: "domcontentloaded" });
await page.waitForSelector(".nextup, #hero .now-task", { timeout: 15000 });

ok("PlannerCore is loaded in the page", await page.evaluate(() => !!window.PlannerCore));

// --- Scenario A: what should I do next? -----------------------------------
const heroText = await page.locator("#hero").innerText();
ok(
  "hero names a specific next task",
  /English reading|Math homework|Study Science/i.test(heroText),
  heroText.split("\n")[2] || "",
);
ok("hero explains WHY it is next", /Next because|due|quiz/i.test(heroText));
ok(
  "hero offers a single obvious Start",
  (await page.locator('#hero [data-act="start-item"]').count()) === 1,
);

const mainText = await page.locator("#main").innerText();
ok("Today shows NEXT UP", /NEXT UP/.test(mainText));
ok(
  "Today shows how much work is left",
  /left/.test(mainText),
  (mainText.match(/[\d]+ min left/) || [""])[0],
);
ok("Today shows Coming up", /Coming up/.test(mainText));
ok("Today shows Tomorrow", /Tomorrow/.test(mainText));

// The quiz must be labelled a quiz, and the project a project.
ok("the quiz is badged QUIZ, not a plain task", /QUIZ/.test(mainText));
ok("the project is badged PROJECT", /PROJECT/.test(mainText));

// --- The project must be surfaced as a STEP, not a blob -------------------
ok(
  "the project appears as a small step for today, not one giant item",
  /History research project — /.test(mainText),
  (mainText.match(/History research project — [^\n]*/) || [""])[0],
);

// --- The quiz auto-generated a study plan --------------------------------
const studyPlan = await page.evaluate(() => {
  const s = window.__FOCUS_SCHOOL_TEST__.getState();
  return s.studyPlans.a_quiz || [];
});
ok(
  "adding a quiz automatically produced a study plan",
  studyPlan.length >= 2,
  `${studyPlan.length} sessions`,
);
ok(
  "no study session is scheduled after the quiz",
  studyPlan.every((s) => s.date <= iso(2)),
);

// --- Scenario: Start My Plan ---------------------------------------------
await page.click('[data-act="start-plan"]');
await page.waitForSelector(".plan-list", { timeout: 5000 });
const planText = await page.locator("#modalBody").innerText();
ok("Start My Plan builds a sequence with a total", /About \d+ min|About \d+ hr/.test(planText));
ok("each plan step says why it's there", (await page.locator(".plan-list li small").count()) > 0);
await page.click('[data-act="close-modal"]');

// --- Scenario: task -> Start -> focus session ----------------------------
await page.click('#hero [data-act="start-item"]');
await page.waitForSelector("#focusOverlay.open", { timeout: 5000 });
ok("Start goes straight into a focus session (no timer setup screen)", true);
const focusTitle = await page.locator("#fTitle").innerText();
ok("the focus session is bound to the actual task", focusTitle.length > 0, focusTitle);
await page.click('[data-act="focus-stop"]');
await page.waitForTimeout(300);

// --- Scenario: completing work advances Next Up --------------------------
const before = await page.locator("#hero .now-title").innerText();
// Complete by id: checking re-renders the list, so a positional locator would
// race the rebuild. `force` steps past the floating Workbench pill, which can
// overlap a row at some scroll positions.
const topId = await page
  .locator(".today-list input[data-check='planner-item']")
  .first()
  .getAttribute("data-id");
// .click(), not .check(): a completed item leaves the Today list entirely, so
// asserting a final "checked" state would assert the wrong behavior. No
// `force` — Playwright must scroll it into view and retry past the floating
// Math Workbench pill, exactly as a real tap would.
await page.locator(`.today-list input[data-id="${topId}"]`).click();
await page.waitForTimeout(600);
const completed = await page.evaluate(
  (id) =>
    (window.__FOCUS_SCHOOL_TEST__.getState().assignments.find((a) => a.id === id) || {}).status,
  topId,
);
ok("checking an item marks it done in state", completed === "done", String(completed));
ok(
  "the completed item leaves the Today list",
  (await page.locator(`.today-list input[data-id="${topId}"]`).count()) === 0,
);
const after = await page.locator("#hero .now-title").innerText();
ok("finishing the top item advances Next Up", before !== after, `${before} -> ${after}`);

// --- Scenario F: I'm overwhelmed -----------------------------------------
await page.click('[data-act="im-overwhelmed"]');
await page.waitForSelector(".overwhelm", { timeout: 5000 });
const owText = await page.locator("#main").innerText();
ok("overwhelmed mode shows exactly one action", (await page.locator(".ow-step").count()) === 1);
ok("overwhelmed mode hides the backlog", !/Coming up|Tomorrow/.test(owText));
ok(
  "overwhelmed mode always offers a way out",
  (await page.locator('[data-act="overwhelm-exit"]').count()) === 1,
);
await page.click('[data-act="overwhelm-exit"]');
await page.waitForSelector(".nextup, #hero .now-task", { timeout: 5000 });

// --- Scenario: I'm stuck --------------------------------------------------
await page.click('#hero [data-act="im-stuck"]');
await page.waitForSelector(".stuck-list", { timeout: 5000 });
ok("I'm stuck offers real reasons", (await page.locator(".stuck-opt").count()) === 6);
await page.click('[data-act="stuck-pick"][data-arg="start"]');
await page.waitForSelector(".stuck-steps", { timeout: 5000 });
const stuckText = await page.locator("#modalBody").innerText();
ok(
  "'I don't know how to start' gives 3 concrete steps + an action",
  /five minutes/i.test(stuckText),
);
await page.click('[data-act="close-modal"]');

// --- Scenario C: forgot something at school ------------------------------
await page.click('#hero [data-act="im-stuck"]');
await page.waitForSelector(".stuck-list");
await page.click('[data-act="stuck-pick"][data-arg="missing"]');
await page.waitForSelector(".stuck-steps");
await page.click('[data-act="stuck-do"]');
await page.waitForSelector("#blkWhat", { timeout: 5000 });
await page.fill("#blkWhat", "Science worksheet");
await page.click('[data-act="block-save"]');
await page.waitForTimeout(600);
const blockedState = await page.evaluate(() => {
  const s = window.__FOCUS_SCHOOL_TEST__.getState();
  return {
    blocked: s.assignments.filter((a) => a.blocked).map((a) => a.title),
    reminders: s.reminders.map((r) => r.text),
  };
});
ok(
  "the blocked task is recorded, not deleted",
  blockedState.blocked.length === 1,
  blockedState.blocked.join(),
);
ok(
  "a school-context reminder is created for tomorrow",
  blockedState.reminders.some((t) => /At school: get Science worksheet/.test(t)),
  blockedState.reminders.join(),
);
const afterBlock = await page.locator("#main").innerText();
ok(
  "blocked work is shown as 'waiting', not as overdue failure",
  /Waiting on something/.test(afterBlock),
);
ok(
  "Next Up moved on to something actionable",
  !/Waiting/.test(await page.locator("#hero .now-title").innerText()),
);

// --- Scenario H: pack for tomorrow ---------------------------------------
const strayModal = await page.evaluate(() =>
  document.getElementById("modalBack").classList.contains("open")
    ? document.getElementById("modalTitle").textContent
    : "",
);
ok("no modal is left hanging open after setting a task aside", !strayModal, strayModal);
if (strayModal) await page.click('[data-act="close-modal"]');
await page.click('[data-act="pack-tomorrow"]');
await page.waitForSelector(".pack-list, #modalBody", { timeout: 5000 });
const packText = await page.locator("#modalBody").innerText();
ok(
  "packing lists tomorrow's actual classes",
  /Math|Science|PE/.test(packText),
  packText.split("\n")[0],
);
ok("packing includes the always-bring basics", /Chromebook/.test(packText));
ok("packing does not list Lunch as a class", !/^Lunch/m.test(packText));
await page.click('[data-act="close-modal"]');

// --- Natural-language quick entry ----------------------------------------
await page.click('[data-act="quick-entry"]');
await page.waitForSelector("#qeInput", { timeout: 5000 });
await page.fill("#qeInput", "math worksheet 1-20 tomorrow 30 min");
await page.waitForTimeout(300);
const preview = await page.locator("#qePreview").innerText();
ok(
  "quick entry previews the parse before saving",
  /Math/.test(preview) && /30 min/.test(preview),
  preview.replace(/\n/g, " | "),
);
ok("quick entry resolved 'tomorrow' to a real date", /Tomorrow/.test(preview));
await page.click('[data-act="quick-entry-save"]');
await page.waitForTimeout(600);
const added = await page.evaluate(() =>
  window.__FOCUS_SCHOOL_TEST__.getState().assignments.some((a) => /Worksheet/i.test(a.title)),
);
ok("quick entry actually created the assignment", added);

// Low-confidence input must ask rather than invent.
await page.click('[data-act="quick-entry"]');
await page.waitForSelector("#qeInput");
await page.fill("#qeInput", "finish that thing");
await page.waitForTimeout(300);
const vague = await page.locator("#qePreview").innerText();
ok(
  "vague input is flagged instead of inventing a due date",
  /Not sure|No due date/.test(vague),
  vague.replace(/\n/g, " | "),
);
await page.click('[data-act="close-modal"]');

// --- School view ----------------------------------------------------------
await page.click('[data-act="nav"][data-arg="school"]');
await page.waitForTimeout(500);
const schoolText = await page.locator("#main").innerText();
// On a weekend the honest answer is "no school", not an empty timetable.
const isWeekend = [0, 6].includes(new Date().getDay());
ok(
  isWeekend
    ? "School view says there's no school today rather than showing an empty day"
    : "School view lists today's periods with times",
  isWeekend
    ? /No school|Weekend/i.test(schoolText)
    : /Math/.test(schoolText) && /:\d\d/.test(schoolText),
  schoolText.split("\n").slice(0, 2).join(" / "),
);
ok("School view shows the next two weeks", /Next two weeks/.test(schoolText));

// --- Study view -----------------------------------------------------------
await page.click('[data-act="nav"][data-arg="study"]');
await page.waitForTimeout(500);
const studyText = await page.locator("#main").innerText();
ok("Study view shows the assessment and its plan", /Science Quiz/.test(studyText));
ok("Study view shows progress toward being ready", /study sessions done/.test(studyText));
ok(
  "Study view offers to start today's study",
  (await page.locator('[data-act="start-study"]').count()) >= 1,
);

// --- Persistence ----------------------------------------------------------
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForSelector(".nextup, #hero .now-task", { timeout: 15000 });
const persisted = await page.evaluate(() => {
  const s = window.__FOCUS_SCHOOL_TEST__.getState();
  return {
    worksheet: s.assignments.some((a) => /Worksheet/i.test(a.title)),
    blocked: s.assignments.some((a) => a.blocked),
    studyPlan: (s.studyPlans.a_quiz || []).length,
    dueUnchanged: (s.assignments.find((a) => a.id === "a_math") || {}).due,
  };
});
ok(
  "a reload preserves everything he did",
  persisted.worksheet && persisted.blocked && persisted.studyPlan >= 2,
);
ok(
  "due dates are never rewritten by the planner",
  persisted.dueUnchanged === iso(1),
  persisted.dueUnchanged,
);

// --- Accessibility: keyboard path ----------------------------------------
await page.keyboard.press("Tab");
const focusable = await page.evaluate(() => {
  const el = document.activeElement;
  return el ? el.tagName + ":" + (el.className || el.textContent || "").slice(0, 30) : "none";
});
ok("tabbing reaches a real control", focusable !== "none" && focusable !== "BODY:", focusable);
const a11y = await page.evaluate(() => {
  const bad = [];
  for (const el of document.querySelectorAll("button")) {
    const label = (el.textContent || "").trim() || el.getAttribute("aria-label");
    if (!label) bad.push(el.outerHTML.slice(0, 70));
  }
  for (const el of document.querySelectorAll("input[type=checkbox]")) {
    const labelled =
      el.getAttribute("aria-label") ||
      el.closest("label") ||
      (el.id && document.querySelector(`label[for="${el.id}"]`));
    if (!labelled) bad.push(el.outerHTML.slice(0, 70));
  }
  return bad;
});
ok(
  "every button and checkbox has an accessible name",
  a11y.length === 0,
  a11y.slice(0, 3).join(" | "),
);

// --- Responsive -----------------------------------------------------------
for (const [name, width, height] of [
  ["phone", 390, 844],
  ["tablet", 820, 1180],
  ["chromebook", 1366, 768],
]) {
  await page.setViewportSize({ width, height });
  await page.waitForTimeout(400);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  ok(`${name} (${width}px): no horizontal scrolling`, overflow <= 1, `overflow ${overflow}px`);
  const nextVisible = await page.locator("#hero .now-title, .nextup h2").first().isVisible();
  ok(`${name} (${width}px): Next Up stays visible`, nextVisible);
}

// --- Console cleanliness --------------------------------------------------
ok(
  "no uncaught page errors during the whole flow",
  errors.length === 0,
  errors.slice(0, 3).join(" | "),
);

await browser.close();

for (const [status, name, detail] of results) {
  console.log(`${status === "PASS" ? "  ✓" : "  ✗"} ${name}${detail ? `  — ${detail}` : ""}`);
}
console.log(`\nfocus-school QA: ${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);

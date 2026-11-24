// BCPSS unit work as class assignments: every assignable item for every unit becomes an assignment the REAL class
// validator (shared/class-platform/contract.js validateSettings) accepts, the page a student opens maps back to that
// assignment, the save helper honors the duplicate rule and the class cap, and the teacher shelf never offers an
// answer key to students.
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";
import {
  activityItem,
  assignmentFor,
  baseId,
  bcpssUnitOf,
  googleClassroomUrl,
  LEVELS,
  lessonItem,
  printableItem,
  studioItem,
  toClassAssignment,
  writingItem,
} from "../shared/class-platform/bcpss-assignments.js";
import { validateSettings } from "../shared/class-platform/contract.js";
import {
  MAX_ASSIGNMENTS,
  saveAllToClass,
  saveToClass,
} from "../shared/class-platform/teacher-classes.js";

const UNITS = readdirSync(new URL("../db/seeds/bcpss/v2/units/", import.meta.url))
  .filter((f) => f.endsWith(".mjs"))
  .map((f) => f.replace(/\.mjs$/, ""));

const itemsFor = (unit, level) => [
  studioItem(unit, { level }),
  writingItem(unit, { level }),
  activityItem(unit, 12, { title: "Word Sort", level }),
  lessonItem(`${unit}-l08`, { title: "Meet the words", level }),
  printableItem(unit, "activity-12", (level || "l3_4").slice(1), { title: "Activity 12" }),
  printableItem(unit, "writing", "3_4"),
];

test("there are 162 BCPSS units to cover", () => {
  assert.equal(UNITS.length, 162);
});

test("every item of every unit passes the real class validator", () => {
  for (const unit of UNITS)
    for (const level of ["", ...LEVELS]) {
      const assignments = itemsFor(unit, level).map((i) =>
        toClassAssignment(i, { due: "2026-12-01", availableFrom: "2026-11-30" }),
      );
      const res = validateSettings({ assignments }, "language");
      assert.ok(res.ok, `${unit} ${level}: ${res.error}`);
      assert.equal(res.settings.assignments.length, assignments.length);
      for (const [i, a] of res.settings.assignments.entries()) {
        assert.equal(a.path, assignments[i].path, `${unit}: path survives validation untouched`);
        assert.equal(a.title, assignments[i].title.slice(0, 80));
      }
    }
});

test("titles name the unit and stay within 80 characters", () => {
  const item = activityItem("g6-ela-u1", 3, { title: "x".repeat(200) });
  assert.ok(item.title.length <= 80);
  assert.ok(item.title.startsWith("Gr 6 ELA U1 · "));
  assert.equal(studioItem("gk-math-u2").title, "K Math U2 · Language Studio");
});

test("bad input fails fast instead of making a broken assignment", () => {
  assert.throws(() => studioItem("g9-ela-u1"));
  assert.throws(() => activityItem("g6-ela-u1", 0));
  assert.throws(() => lessonItem("g6-ela-u1"));
  assert.throws(() => printableItem("g6-ela-u1", "../x", "3_4"));
  assert.throws(() => printableItem("g6-ela-u1", "book", "9_9"));
});

test("a page a student opens maps back to the assignment, at any level", () => {
  for (const unit of ["g6-ela-u1", "gk-math-u2", "g8-ss-u4"])
    for (const level of ["", "l1_2", "l5_6"]) {
      for (const item of itemsFor(unit, level).slice(0, 4)) {
        const url = new URL(item.path, "https://x.test");
        const found = assignmentFor([toClassAssignment(item)], url.pathname, url.search);
        assert.equal(found?.id, item.id, `${item.id} opens as itself`);
        const other = new URL(item.path.replace(/level=l\d_\d/, "level=l5_6"), "https://x.test");
        assert.equal(
          assignmentFor([toClassAssignment(item)], other.pathname, other.search)?.id,
          item.id,
        );
      }
    }
});

test("an activity is covered by the whole-studio assignment, and the specific one wins", () => {
  const whole = toClassAssignment(studioItem("g6-ela-u1"));
  const one = toClassAssignment(activityItem("g6-ela-u1", 3, { title: "Cloze" }));
  const at = (a) =>
    assignmentFor(a, "/bcpss-teachers/language-studio/", "?unit=g6-ela-u1&a=3&level=l3_4")?.id;
  assert.equal(at([whole]), whole.id);
  assert.equal(at([whole, one]), one.id);
  assert.equal(
    assignmentFor([one], "/bcpss-teachers/language-studio/", "?unit=g6-ela-u1&a=4")?.id,
    undefined,
  );
  assert.equal(
    assignmentFor([whole], "/bcpss-teachers/language-studio/", "?unit=g7-ela-u1")?.id,
    undefined,
  );
});

test("other pages and malformed links match nothing", () => {
  const all = [
    toClassAssignment(studioItem("g6-ela-u1")),
    toClassAssignment(writingItem("g6-ela-u1")),
  ];
  assert.equal(assignmentFor(all, "/access-practice-lab/", "?unit=g6-ela-u1"), null);
  assert.equal(assignmentFor(all, "/bcpss-teachers/language-studio/", "?unit=../../etc"), null);
  assert.equal(assignmentFor(all, "/bcpss-teachers/language-studio/", ""), null);
  assert.equal(baseId("sa:g6-ela-u1:3:l3_4"), "sa:g6-ela-u1:3");
});

test("the class list names the unit for BCPSS links and nothing else", () => {
  assert.equal(bcpssUnitOf(studioItem("g6-ela-u1").path), "g6-ela-u1");
  assert.equal(bcpssUnitOf(printableItem("g3-sci-u2", "book", "3_4").path), "g3-sci-u2");
  assert.equal(bcpssUnitOf("/access-practice-lab/Reading/A/x?unit=g6-ela-u1"), "");
});

test("Google Classroom link carries the student link and title", () => {
  const item = studioItem("g6-ela-u1");
  const url = new URL(googleClassroomUrl(item, "https://thelanguagepage.com"));
  assert.equal(url.origin, "https://classroom.google.com");
  assert.equal(url.searchParams.get("url"), `https://thelanguagepage.com${item.path}`);
  assert.equal(url.searchParams.get("title"), item.title);
});

function fakeClient(list, { rosterOk = true, settingsOk = true, httpStatus = 200 } = {}) {
  const calls = { settings: [] };
  return {
    calls,
    make: () => ({
      roster: async () =>
        rosterOk ? { ok: true, settings: { assignments: list } } : { ok: false, httpStatus },
      settings: async (body) => {
        calls.settings.push(body);
        return settingsOk ? { ok: true } : { ok: false, error: "boom" };
      },
    }),
  };
}

const cls = { code: "ABC234", passcode: "p" };
const sample = (n) =>
  Array.from({ length: n }, (_, i) =>
    toClassAssignment(activityItem("g6-ela-u1", i + 1, { title: `A${i + 1}` })),
  );

test("saveAllToClass writes once, skips duplicates and reports them", async () => {
  const kept = sample(2);
  const c = fakeClient([kept[0]]);
  const res = await saveAllToClass(cls, [...kept, kept[1]], undefined, c.make);
  assert.deepEqual(res, { ok: true, added: 1, already: 2, skipped: 0 });
  assert.equal(c.calls.settings.length, 1);
  assert.equal(c.calls.settings[0].assignments.length, 2);
});

test("saveAllToClass respects the class cap and says what did not fit", async () => {
  const full = sample(MAX_ASSIGNMENTS - 1);
  const c = fakeClient(full);
  const more = [...sample(MAX_ASSIGNMENTS + 2)].slice(MAX_ASSIGNMENTS - 1);
  const res = await saveAllToClass(cls, more, undefined, c.make);
  assert.equal(res.added, 1);
  assert.equal(res.skipped, more.length - 1);
  const none = await saveAllToClass(
    cls,
    sample(MAX_ASSIGNMENTS + 1).slice(MAX_ASSIGNMENTS),
    undefined,
    fakeClient(sample(MAX_ASSIGNMENTS)).make,
  );
  assert.deepEqual(none, { ok: false, reason: "full" });
});

test("saveAllToClass maps failures to reasons and writes nothing", async () => {
  assert.deepEqual(
    await saveAllToClass(
      cls,
      sample(1),
      undefined,
      fakeClient([], { rosterOk: false, httpStatus: 401 }).make,
    ),
    { ok: false, reason: "passcode" },
  );
  assert.deepEqual(
    await saveAllToClass(cls, sample(1), undefined, fakeClient([], { settingsOk: false }).make),
    { ok: false, reason: "boom" },
  );
  const noop = fakeClient(sample(1));
  assert.equal((await saveToClass(cls, sample(1)[0], undefined, noop.make)).already, true);
  assert.equal(noop.calls.settings.length, 0);
});

test("the unit shelf offers Assign on student work and never on answer keys or the planning page", async () => {
  const dom = new JSDOM("<!doctype html><div id=p></div>");
  globalThis.document = dom.window.document;
  globalThis.fetch = async () => Response.json({ lessons: [] });
  const { renderStudioTab } = await import("../bcpss-teachers/studio-tab.js");
  const panel = document.getElementById("p");
  const activities = [
    { title: "Word Sort", mission: "Sort", domain: "Vocabulary", minutes: 8, grouping: "solo" },
    { title: "Cloze", mission: "Fill", domain: "Reading", minutes: 6, grouping: "pairs" },
  ];
  renderStudioTab(panel, {
    detail: {
      unit: { id: "g6-ela-u1" },
      studio: { activities },
      writing: { title: "T", prompt: { l3_4: "p" } },
    },
    wida: "3_4",
  });
  const assignable = [...panel.querySelectorAll("[data-assign]")].map(
    (b) => b.dataset.kind + (b.dataset.part ? `:${b.dataset.part}` : ""),
  );
  assert.ok(assignable.includes("su") && assignable.includes("wl"));
  assert.equal(assignable.filter((k) => k === "sa").length, 2);
  assert.ok(assignable.includes("pr:book") && assignable.includes("pr:writing"));
  for (const teacherOnly of ["pr:key", "pr:packet", "pr:writing-key"])
    assert.ok(!assignable.includes(teacherOnly), teacherOnly);
  const hrefs = [...panel.querySelectorAll("a")].map((a) => a.getAttribute("href"));
  assert.ok(
    hrefs.some((h) => h.includes("part=book") && h.includes("format=html")),
    "printables open as a web page",
  );
  assert.ok(panel.querySelectorAll("[data-pick]").length === 2);
});

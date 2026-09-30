import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { createDefaultSnapshot } from "./model.js";
import { publicHomeworkWeeks, weeksForSection, defaultHomeworkWeek, snapshotForWeek } from "./homework-weeks.js";
import { publicationChecks, renderPublicationChecks, homeworkLinkErrors } from "./publication-checks.js";
import { renderHomeworkHub } from "./homework-hub.js";

const now = new Date("2026-09-30T16:00:00Z");
const lessons = [{ id: "3-2", title: "Unit rates", homeworkPath: "/lessons/3-2/homework.html" }];
function snapshot(start, id = "3-2") {
  const value = createDefaultSnapshot();
  value.publishedAt = "2026-09-28T14:00:00Z";
  value.sections[0].week.startDate = start;
  if (id) Object.assign(value.sections[0].week.days[0], { status: "lesson", lessonId: id });
  return value;
}
function withDom(action) {
  const dom = new JSDOM('<div id="root"></div>');
  const previous = globalThis.document;
  globalThis.document = dom.window.document;
  try { action(document.getElementById("root")); }
  finally { globalThis.document = previous; dom.window.close(); }
}

test("publishing a future week retains current homework and chooses nearest future only when needed", () => {
  const next = snapshot("2026-10-05");
  const current = snapshot("2026-09-28");
  const weeks = weeksForSection(publicHomeworkWeeks(next, [current, snapshot("2026-09-21")]), "all-families");
  const record = defaultHomeworkWeek(weeks, now);
  assert.equal(record.week.startDate, "2026-09-28");
  assert.equal(defaultHomeworkWeek(weeks, new Date("2026-10-05T16:00:00Z")).week.startDate, "2026-10-05");
  assert.equal(defaultHomeworkWeek(weeks, new Date("2026-09-14T16:00:00Z")).week.startDate, "2026-09-21");
  assert.equal(defaultHomeworkWeek(weeks, new Date("2026-11-01T16:00:00Z")), null);
  withDom((root) => {
    renderHomeworkHub(root, snapshotForWeek(next, record), lessons, "all-families", "en", { now });
    assert.match(root.textContent, /Sep 28 – Oct 2/);
    assert.ok(root.querySelector('a[href*="/lessons/3-2/homework"]'));
  });
});

test("archive deduplicates a week using its newest publication and returns only allowlisted fields", () => {
  const current = snapshot("2026-09-28");
  current.studentRecords = [{ name: "private" }];
  current.sections[0].week.privateNote = "do not expose";
  current.sections[0].week.days[0].privateAnswer = "do not expose";
  current.integrations.teacherToken = "do not expose";
  current.homeworkOverrides["3-2"] = { title: "Latest title", directions: "not part of the archive", answerKey: "private" };
  const old = snapshot("2026-09-28");
  old.homeworkOverrides["3-2"] = { title: "Old title" };
  const weeks = publicHomeworkWeeks(current, [old, snapshot("2026-09-21"), createDefaultSnapshot()]);
  assert.equal(weeks.length, 2);
  assert.equal(weeks[0].homeworkOverrides["3-2"].title, "Latest title");
  assert.doesNotMatch(JSON.stringify(weeks), /private|teacherToken|answerKey|studentRecords|directions/);
});

test("removed and currently hidden classes never enter public archives", () => {
  const current = snapshot("2026-09-28");
  const old = snapshot("2026-09-21");
  old.sections.push({ ...structuredClone(old.sections[0]), id: "removed" });
  current.sections[0].visible = false;
  assert.deepEqual(publicHomeworkWeeks(current, [old]), []);
});

test("previous assignments open with archive notice, their original due dates, and Spanish links", () => {
  const old = snapshot("2026-09-21");
  old.sections[0].week.days[0].dueDate = "2026-09-22";
  withDom((root) => {
    renderHomeworkHub(root, old, lessons, "all-families", "es", { now, archive: true });
    assert.match(root.textContent, /Tareas anteriores/);
    assert.match(root.textContent, /Última actualización/);
    assert.match(root.textContent, /Entrega: 22 sept/);
    assert.equal(root.querySelector(".homework-card a").getAttribute("href"), "/lessons/3-2/homework.html?route=quick&lang=es");
    assert.equal(root.querySelector(".today-badge"), null);
  });
});

test("dated no-homework weeks and pending days stay distinct in both languages", () => {
  const current = snapshot("2026-09-28", "");
  current.sections[0].week.days[0].status = "no-class";
  withDom((root) => {
    renderHomeworkHub(root, current, lessons, "all-families", "en", { now });
    const cards = root.querySelectorAll(".homework-card");
    assert.equal(cards.length, 5);
    assert.match(cards[0].textContent, /No homework assigned/);
    assert.match(cards[1].textContent, /Not posted yet/);
    current.sections[0].week.days.forEach((day) => { day.status = "no-class"; });
    renderHomeworkHub(root, current, lessons, "all-families", "es", { now });
    assert.match(root.textContent, /No hay tareas asignadas esta semana/);
    assert.equal(root.querySelectorAll(".homework-card").length, 5);
  });
});

test("checks cover every visible class, missing plans, past dates, hidden links and impossible due dates", () => {
  const current = snapshot("2026-09-28");
  current.sections.push({ ...structuredClone(current.sections[0]), id: "602", label: "602", week: createDefaultSnapshot().sections[0].week });
  current.sections.push({ ...structuredClone(current.sections[0]), id: "hidden", visible: false });
  let checks = publicationChecks(current, lessons, now);
  assert.equal(checks.length, 2);
  assert.match(checks[1].warnings.join(" "), /No dated plan/);
  assert.match(checks[0].warnings.join(" "), /Tuesday/);
  current.sections[0].week.startDate = "2026-09-29";
  current.sections[0].week.days[0].dueDate = "2026-09-25";
  current.homeworkOverrides["3-2"] = { visible: false };
  checks = publicationChecks(current, lessons, now);
  assert.match(checks[0].errors.join(" "), /Monday/);
  assert.match(checks[0].errors.join(" "), /no available family homework/);
  assert.match(checks[0].errors.join(" "), /cannot precede/);
  current.sections[0].week.startDate = "2026-09-21";
  assert.match(publicationChecks(current, lessons, now)[0].warnings.join(" "), /dates have passed/);
  withDom((root) => {
    renderPublicationChecks(root, checks);
    assert.match(root.textContent, /602/);
    assert.match(root.textContent, /Fix:/);
  });
});

test("an assignment missing from the manifest cannot pass preview checks", () => {
  assert.match(publicationChecks(snapshot("2026-09-28", "9-9"), lessons, now)[0].errors.join(" "), /no available family homework/);
});

test("publication checks actual assigned pages once per unique link and blocks failed requests", async () => {
  const current = snapshot("2026-09-28");
  Object.assign(current.sections[0].week.days[1], { status: "lesson", lessonId: "3-2" });
  const requests = [];
  const failures = await homeworkLinkErrors(current, lessons, async (path, options) => {
    requests.push([path, options.method]);
    return { ok: false };
  });
  assert.deepEqual(requests, [["/lessons/3-2/homework.html", "HEAD"]]);
  assert.equal(failures.length, 2);
  assert.match(failures[0].message, /could not be opened/);
  assert.deepEqual(await homeworkLinkErrors(current, lessons, async () => ({ ok: true })), []);
  assert.equal((await homeworkLinkErrors(current, lessons, async () => { throw new Error("offline"); })).length, 2);
});

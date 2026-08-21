import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import * as familyModel from "./model.js";
import { COPY_KEYS, translationsEs } from "./copy-defaults.js";
import {
  buildCanvasAnnouncement,
  buildCanvasExport,
  buildCanvasModuleLinks,
  createDefaultSnapshot,
  mergeHomework,
  normalizeLessons,
  safeExternalUrl,
} from "./model.js";

const manifest = JSON.parse(
  await readFile(new URL("../../../data/curriculum-manifest.json", import.meta.url), "utf8"),
);
const lessons = normalizeLessons(manifest.lessons);

assert.ok(COPY_KEYS.includes("browsePractice"));
assert.ok(COPY_KEYS.includes("weekPracticeTitle"));
assert.ok(COPY_KEYS.includes("weekPracticeHint"));
assert.match(translationsEs.weekPracticeTitle, /lecciones de esta semana/i);
assert.ok(COPY_KEYS.includes("askTitle"));
assert.equal(COPY_KEYS.includes("findHomework"), false);
assert.match(translationsEs.homeworkTitle, /Práctica familiar opcional/i);
assert.match(translationsEs.homeworkIntro, /aparte de la tarea regular/i);

assert.equal(lessons.length, 84, "every curriculum lesson should be available");
assert.equal(lessons[0].id, "1-1");
assert.equal(lessons.at(-1).id, "10-6");

const snapshot = createDefaultSnapshot();
assert.equal(snapshot.sections.length, 1);
assert.equal(snapshot.sections[0].isDefault, true);
assert.equal(snapshot.sections[0].week.days.length, 5);
assert.equal(
  typeof familyModel.weekHasMeaningfulContent,
  "function",
  "family and teacher views need one canonical meaningful-week rule",
);
assert.equal(familyModel.weekHasMeaningfulContent(snapshot.sections[0]), false);
const meaningfulWeek = structuredClone(snapshot.sections[0]);
meaningfulWeek.week.days[0] = {
  day: "Monday",
  status: "review",
  lessonId: "",
  note: "Review together.",
};
assert.equal(familyModel.weekHasMeaningfulContent(meaningfulWeek), true);

const lessonWithArcade = lessons.find((item) => item.id === "6-13");
assert.equal(lessonWithArcade.arcadePath, "/math/unit-1/games/unit1-factor-frenzy.html");
assert.match(lessonWithArcade.arcadeTitle, /Factor Frenzy/i);
assert.equal(lessons.find((item) => item.id === "1-1").arcadePath, "");

const future = {
  id: "12-9",
  unit: 12,
  lesson: 9,
  title: "Future Lesson",
  objective: "I can test future lesson discovery.",
  resources: { homework: { exists: true, path: "/lessons/12-9/homework.html" } },
};
const merged = mergeHomework([...manifest.lessons, future], {
  "6-13": { title: "Factor Trees at Home", directions: "Explain one branch at a time." },
});
assert.equal(merged.length, 85, "future manifest lessons should appear without migration");
assert.equal(merged.find((item) => item.id === "6-13").title, "Factor Trees at Home");
assert.equal(merged.at(-1).id, "12-9");
assert.equal(mergeHomework([future], { "12-9": { visible: false } }).length, 0);

assert.equal(safeExternalUrl("https://www.classdojo.com/ul/p/addKid"), true);
assert.equal(safeExternalUrl("javascript:alert(1)"), false);
assert.equal(safeExternalUrl("http://example.com"), false);
assert.equal(typeof familyModel.parseCanvasCourseUrl, "function", "Canvas course URLs need a canonical parser");
assert.deepEqual(familyModel.parseCanvasCourseUrl("https://school.instructure.com/courses/2468/modules?view=1"), {
  courseId: "2468",
  courseUrl: "https://school.instructure.com/courses/2468/",
  host: "school.instructure.com",
  announcementsUrl: "https://school.instructure.com/courses/2468/announcements",
  modulesUrl: "https://school.instructure.com/courses/2468/modules",
});
assert.equal(familyModel.parseCanvasCourseUrl("https://school.instructure.com/dashboard"), null);
assert.equal(familyModel.parseCanvasCourseUrl("javascript:alert(1)"), null);

snapshot.sections[0].week.label = "September 8-12";
snapshot.sections[0].week.days[0] = { day: "Monday", status: "lesson", lessonId: "6-13", note: "Bring notes." };
const announcement = buildCanvasAnnouncement(snapshot, lessons, snapshot.sections[0].id);
assert.match(announcement.text, /September 8-12/);
assert.match(announcement.text, /Lesson 6-13/);
assert.match(announcement.text, /Optional family practice:/);
assert.match(announcement.text, /separate from regular homework/i);
assert.match(announcement.html, /<h2>/);
assert.match(announcement.html, />Optional family practice<\/a>/);
assert.doesNotMatch(announcement.html, /<script/i);

const moduleLinks = buildCanvasModuleLinks(snapshot, lessons, snapshot.sections[0].id);
assert.deepEqual(moduleLinks[0], {
  day: "Monday",
  lessonId: "6-13",
  title: "Lesson 6-13 · Prime Factorization",
  lessonUrl: "https://eduwonderlab.com/lessons/6-13/",
  homeworkUrl: "https://eduwonderlab.com/lessons/6-13/homework.html",
});

// Optional family practice must mirror the posted week, not the whole library.
snapshot.sections[0].week.days[1] = {
  day: "Tuesday",
  status: "lesson",
  lessonId: "6-13",
  note: "Same lesson, second day.",
};
snapshot.sections[0].week.days[2] = {
  day: "Wednesday",
  status: "lesson",
  lessonId: "1-1",
  note: "",
};
snapshot.sections[0].week.days[3] = { day: "Thursday", status: "assessment", lessonId: "", note: "" };
const posted = familyModel.weekHomework(snapshot, lessons, {}, snapshot.sections[0].id);
assert.deepEqual(
  posted.map((item) => item.id),
  ["6-13", "1-1"],
  "posted practice follows calendar order and dedupes a lesson taught twice",
);
assert.deepEqual(posted[0].days, ["Monday", "Tuesday"]);
assert.deepEqual(posted[1].days, ["Wednesday"]);
assert.ok(posted[0].directions, "posted practice carries the merged teacher directions");
assert.ok(
  posted.length < mergeHomework(lessons, {}).length,
  "posted practice must be a subset of the browse-all library",
);
const hidden = familyModel.weekHomework(snapshot, lessons, { "1-1": { visible: false } }, snapshot.sections[0].id);
assert.deepEqual(
  hidden.map((item) => item.id),
  ["6-13"],
  "a lesson the teacher hid stays hidden even when it is on the calendar",
);
assert.deepEqual(
  familyModel.weekHomework(createDefaultSnapshot(), lessons, {}, "all-families"),
  [],
  "an unposted week shows no week-synced practice",
);

const canvasExport = buildCanvasExport(snapshot, lessons, snapshot.sections[0].id);
assert.equal(canvasExport.schemaVersion, 1);
assert.equal(canvasExport.platform, "canvas-ready");
assert.equal(canvasExport.sections[0].id, "all-families");
assert.equal("canvasAccessToken" in canvasExport, false);

const syncBundle = familyModel.buildCanvasSyncBundle(snapshot, lessons, snapshot.sections[0].id);
assert.equal(syncBundle.title, "September 8-12 — All Families");
assert.match(syncBundle.text, /ANNOUNCEMENT/);
assert.match(syncBundle.text, /MODULE LINKS/);
assert.match(syncBundle.text, /Optional family practice/);

snapshot.publishedAt = "2026-07-16T12:00:00.000Z";
const canvasRss = familyModel.buildCanvasRss(snapshot, snapshot.sections[0].id);
assert.match(canvasRss, /<rss version="2\.0"/);
assert.match(canvasRss, /Family Connections — September 8-12/);
assert.match(canvasRss, /Optional family practice/);
assert.match(canvasRss, /https:\/\/eduwonderlab\.com\/curriculum\/family-connections\//);
assert.match(canvasRss, /canvas-feed\?section=all-families&amp;v=1/);
assert.doesNotMatch(canvasRss, /<script/i);

console.log("Family publication model tests passed.");

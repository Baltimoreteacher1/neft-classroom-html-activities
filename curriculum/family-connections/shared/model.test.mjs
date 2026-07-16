import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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

assert.equal(lessons.length, 74, "every curriculum lesson should be available");
assert.equal(lessons[0].id, "1-1");
assert.equal(lessons.at(-1).id, "10-5");

const snapshot = createDefaultSnapshot();
assert.equal(snapshot.sections.length, 1);
assert.equal(snapshot.sections[0].isDefault, true);
assert.equal(snapshot.sections[0].week.days.length, 5);

const future = {
  id: "12-9",
  unit: 12,
  lesson: 9,
  title: "Future Lesson",
  objective: "I can test future lesson discovery.",
  resources: { homework: { exists: true, path: "/lessons/12-9/homework.html" } },
};
const merged = mergeHomework([...manifest.lessons, future], {
  "1-1": { title: "Factor Trees at Home", directions: "Explain one branch at a time." },
});
assert.equal(merged.length, 75, "future manifest lessons should appear without migration");
assert.equal(merged.find((item) => item.id === "1-1").title, "Factor Trees at Home");
assert.equal(merged.at(-1).id, "12-9");
assert.equal(mergeHomework([future], { "12-9": { visible: false } }).length, 0);

assert.equal(safeExternalUrl("https://www.classdojo.com/ul/p/addKid"), true);
assert.equal(safeExternalUrl("javascript:alert(1)"), false);
assert.equal(safeExternalUrl("http://example.com"), false);

snapshot.sections[0].week.label = "September 8-12";
snapshot.sections[0].week.days[0] = { day: "Monday", status: "lesson", lessonId: "1-1", note: "Bring notes." };
const announcement = buildCanvasAnnouncement(snapshot, lessons, snapshot.sections[0].id);
assert.match(announcement.text, /September 8-12/);
assert.match(announcement.text, /Lesson 1-1/);
assert.match(announcement.text, /Optional family practice:/);
assert.match(announcement.html, /<h2>/);
assert.match(announcement.html, />Optional family practice<\/a>/);
assert.doesNotMatch(announcement.html, /<script/i);

const moduleLinks = buildCanvasModuleLinks(snapshot, lessons, snapshot.sections[0].id);
assert.deepEqual(moduleLinks[0], {
  day: "Monday",
  lessonId: "1-1",
  title: "Lesson 1-1 · Prime Factorization",
  lessonUrl: "https://eduwonderlab.com/lessons/1-1/",
  homeworkUrl: "https://eduwonderlab.com/lessons/1-1/homework.html",
});

const canvasExport = buildCanvasExport(snapshot, lessons, snapshot.sections[0].id);
assert.equal(canvasExport.schemaVersion, 1);
assert.equal(canvasExport.platform, "canvas-ready");
assert.equal(canvasExport.sections[0].id, "all-families");
assert.equal("canvasAccessToken" in canvasExport, false);

console.log("Family publication model tests passed.");

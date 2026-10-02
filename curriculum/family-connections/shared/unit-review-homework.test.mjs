// An end-of-unit family homework page (the Unit 3 Test Review) must be
// assignable in the homework publisher exactly like a lesson's homework, and
// reach families as a working link. The lesson-id contract used to be copied
// into five files; this test drives the real manifest through every one of
// them so a copy that drifts back to `\d-\d` fails here, not in a classroom.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
import { normalizeSnapshot } from "../../../functions/api/family-connections/domain.js";
import { assignedHomework, renderHomeworkHub } from "./homework-hub.js";
import {
  buildCanvasModuleLinks,
  createDefaultSnapshot,
  HOMEWORK_ID_PATTERN,
  HOMEWORK_PATH_PATTERN,
  homeworkLabel,
  normalizeLessons,
  weekHomework,
} from "./model.js";
import { publicationChecks } from "./publication-checks.js";

const manifest = JSON.parse(
  await readFile(new URL("../../../data/curriculum-manifest.json", import.meta.url), "utf8"),
);
const input = [...manifest.lessons, ...manifest.familyHomework];
const lessons = normalizeLessons(input);

// 1. The generator discovered the page from its own <meta>, and nothing else.
const review = lessons.find((item) => item.id === "3-test-review");
assert.ok(review, "the Unit 3 Test Review is discoverable from the manifest");
assert.equal(review.kind, "unit-review");
assert.equal(review.unit, 3);
assert.equal(review.homeworkPath, "/curriculum/unit-3-test-review/");
assert.equal(review.lessonPath, "/curriculum/unit-3-test-review/");
assert.equal(review.title, "Unit 3 Test Review");
assert.match(review.titleEs, /Unidad 3/);
assert.equal(lessons.filter((item) => item.kind === "lesson").length, 84, "no lesson was lost");

// 2. It sorts after every Unit 3 lesson, so the publisher lists it last in the unit.
const unit3 = lessons.filter((item) => item.unit === 3).map((item) => item.id);
assert.equal(unit3.at(-1), "3-test-review");
assert.equal(unit3.indexOf("3-10"), unit3.length - 2);

// 3. Labels are family words, in both languages.
assert.equal(homeworkLabel(review), "Unit 3 Review");
assert.equal(homeworkLabel(review, "es"), "Repaso de la Unidad 3");
assert.equal(homeworkLabel({ id: "3-2" }), "Lesson 3-2");
assert.equal(homeworkLabel({ id: "3-2" }, "es"), "Lección 3-2");

// 4. The contract: lesson ids and review ids pass; anything else is refused.
for (const ok of ["3-2", "10-12", "3-2-flagship", "3-test-review", "7-review"])
  assert.ok(HOMEWORK_ID_PATTERN.test(ok), ok);
for (const bad of ["3-Test-Review", "test-review", "3-", "3-test--review", "../x", "3-test review"])
  assert.equal(HOMEWORK_ID_PATTERN.test(bad), false, bad);
assert.ok(HOMEWORK_PATH_PATTERN.test("/curriculum/unit-3-test-review/"));
assert.ok(HOMEWORK_PATH_PATTERN.test("/lessons/3-2/homework.html"));
assert.equal(HOMEWORK_PATH_PATTERN.test("/curriculum/unit-3-test-review/index.html"), false);
assert.equal(HOMEWORK_PATH_PATTERN.test("https://evil.example/"), false);

// 5. A published week that assigns it reaches the family page as a real link.
const snapshot = createDefaultSnapshot();
const section = snapshot.sections[0];
section.week.startDate = "2026-10-05";
section.week.days[2] = { day: "Wednesday", status: "lesson", lessonId: "3-test-review", note: "", noteEs: "" };
snapshot.publishedAt = "2026-10-05T12:00:00.000Z";
assert.deepEqual(assignedHomework(snapshot, input, "all-families").map((item) => item.id), ["3-test-review"]);
assert.deepEqual(weekHomework(snapshot, input, {}, "all-families").map((item) => item.days), [["Wednesday"]]);

const dom = new JSDOM("<div id='root'></div>");
globalThis.document = dom.window.document;
const root = dom.window.document.getElementById("root");
const now = new Date("2026-10-07T15:00:00Z");
renderHomeworkHub(root, snapshot, input, "all-families", "en", { now });
const card = [...root.querySelectorAll(".homework-card")].find((item) => item.querySelector("h4"));
assert.equal(card.querySelector("h4").textContent, "Unit 3 Test Review");
assert.match(card.querySelector(".eyebrow").textContent, /^Unit 3 Review ·/);
assert.equal(
  card.querySelector("a.button").getAttribute("href"),
  "/curriculum/unit-3-test-review/?route=core&lang=en&section=all-families",
);
renderHomeworkHub(root, snapshot, input, "all-families", "es", { now });
const cardEs = [...root.querySelectorAll(".homework-card")].find((item) => item.querySelector("h4"));
assert.equal(cardEs.querySelector("h4").textContent, "Repaso para el examen de la Unidad 3");
assert.match(cardEs.querySelector(".eyebrow").textContent, /^Repaso de la Unidad 3 ·/);
delete globalThis.document;

// 6. The pre-publish checks accept it, and still refuse an unknown id.
const [check] = publicationChecks(snapshot, input, now);
assert.deepEqual(check.errors, []);
const broken = structuredClone(snapshot);
broken.sections[0].week.days[2].lessonId = "3-no-such-review";
const [brokenCheck] = publicationChecks(broken, input, now);
assert.match(brokenCheck.errors.join("\n"), /Wednesday: Unit 3 Review has no available family homework link/);

// 7. The API keeps the assignment when it normalizes the draft.
const normalized = normalizeSnapshot(structuredClone(snapshot));
assert.equal(normalized.sections[0].week.days[2].lessonId, "3-test-review");
assert.throws(
  () => normalizeSnapshot({ ...structuredClone(snapshot), sections: [{ ...section, week: { ...section.week, days: [{ day: "Monday", status: "lesson", lessonId: "3-Test-Review" }] } }] }),
  /Monday needs a valid lesson number/,
);

// 8. Canvas export names it the way families will see it.
const [link] = buildCanvasModuleLinks(snapshot, input, "all-families");
assert.equal(link.title, "Unit 3 Review · Unit 3 Test Review");
assert.equal(link.homeworkUrl, "https://eduwonderlab.com/curriculum/unit-3-test-review/");
assert.equal(link.lessonUrl, link.homeworkUrl);

console.log("unit-review homework: the Unit 3 Test Review is assignable, linkable, checkable, and exportable.");

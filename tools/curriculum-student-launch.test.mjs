#!/usr/bin/env node
// Regression: carrying supports in the fragment erased the final-check #reflect anchor.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const html = read("curriculum/student-launch/index.html");
const source = read("assets/curriculum-student-launch.js");
const allLessons = JSON.parse(read("data/curriculum-launch-manifest.json")).lessons;
const lessons = allLessons.slice(0, 2);

async function boot(query, options = {}) {
  const dom = new JSDOM(html, {
    url: `https://eduwonderlab.com/curriculum/student-launch/${query}`,
    runScripts: "outside-only",
    pretendToBeVisual: true,
  });
  dom.window.fetch = async () => ({
    ok: true,
    json: async () => ({ lessons: options.lessons || lessons }),
  });
  if (options.storage)
    Object.defineProperty(dom.window, "localStorage", { value: options.storage });
  dom.window.scrollTo = () => {};
  dom.window.eval(source);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(dom.window.document.getElementById("lesson-view").hidden, false);
  return dom;
}

function links(window) {
  const all = [...window.document.querySelectorAll("#resource-links a")];
  return {
    start: new URL(window.document.getElementById("start-lesson").href),
    lesson: new URL(all.find((a) => a.textContent.startsWith("Must do")).href),
    check: new URL(all.find((a) => a.textContent.startsWith("Show what you know")).href),
  };
}

const withSupports = await boot(
  "?playlist=1-1,1-2&supports=tts,calculator,%3Cscript%3E,read-aloud&student=0",
);
for (const lessonId of ["1-1", "1-2"]) {
  const urls = links(withSupports.window);
  for (const url of Object.values(urls)) {
    assert.equal(url.origin, "https://eduwonderlab.com");
    assert.equal(url.pathname, `/lessons/${lessonId}/`);
    assert.equal(url.searchParams.get("student"), "1");
    assert.equal(url.searchParams.get("supports"), "tts,calculator,read-aloud");
  }
  assert.equal(urls.check.hash, "#reflect", "final check must retain its section anchor");
  assert.equal(urls.start.hash, "");
  if (lessonId === "1-1") withSupports.window.document.getElementById("next-lesson").click();
}
withSupports.window.close();

for (const query of ["?lesson=1-1", "?lesson=1-1&supports=%3Cscript%3E,javascript:alert(1)"]) {
  const dom = await boot(query);
  const urls = links(dom.window);
  assert.equal(urls.check.hash, "#reflect");
  for (const url of Object.values(urls)) {
    assert.equal(url.searchParams.get("student"), "1");
    assert.equal(url.searchParams.has("supports"), false);
  }
  dom.window.close();
}

const resourceKeys = [
  "worksheetLevel0",
  "worksheet",
  "worksheet2",
  "mstarWorksheet",
  "readiness",
  "learningLab",
];
const complete = await boot("?lesson=3-2&supports=tts,calculator", { lessons: allLessons });
for (const key of resourceKeys) {
  const anchor = complete.window.document.querySelector(`[data-resource="${key}"]`);
  assert.ok(anchor, `${key} is reachable from the copied student link`);
  const url = new URL(anchor.href);
  assert.equal(url.searchParams.get("student"), "1");
  assert.equal(url.searchParams.get("supports"), "tts,calculator");
  if (key !== "readiness")
    assert.ok(anchor.closest("details"), `${key} belongs to optional resources`);
}
for (const anchor of complete.window.document.querySelectorAll("#resource-links a")) {
  assert.equal(
    new URL(anchor.href).searchParams.get("student"),
    "1",
    "all student resources retain student mode",
  );
}
assert.equal(complete.window.document.querySelector("#resource-links details").open, false);
complete.window.close();

const unavailable = structuredClone(allLessons.find((lesson) => !lesson.resources.readiness));
assert.ok(unavailable);
const absent = await boot(`?lesson=${unavailable.id}`, { lessons: [unavailable] });
assert.equal(absent.window.document.querySelector('[data-resource="readiness"]'), null);
absent.window.close();

for (const path of [
  "javascript:alert(1)",
  "https://example.com/",
  "//example.com/",
  "/teacher-tools/",
  "/lessons/1-1/teacher-notes/",
  "/lessons/1-2/worksheet.html",
]) {
  const invalid = structuredClone(lessons[0]);
  invalid.resources.worksheet = path;
  invalid.resources.learningLab = path;
  const dom = await boot("?lesson=1-1", { lessons: [invalid] });
  assert.equal(dom.window.document.querySelector('[data-resource="worksheet"]'), null);
  assert.equal(dom.window.document.querySelector('[data-resource="learningLab"]'), null);
  dom.window.close();
}

const failedStorage = await boot("?playlist=1-1,1-2", {
  storage: {
    getItem: () => null,
    setItem: () => {
      throw new Error("QuotaExceededError");
    },
  },
});
const doc = failedStorage.window.document;
const checkbox = doc.querySelector('[data-progress="lesson"]');
checkbox.checked = true;
checkbox.dispatchEvent(new failedStorage.window.Event("change"));
const saveStatus = () =>
  (doc.getElementById("checklist-status") || doc.getElementById("launch-status")).textContent;
assert.match(saveStatus(), /temporary/);
assert.doesNotMatch(saveStatus(), /saved on this device/i);
doc.getElementById("next-lesson").click();
assert.equal(doc.querySelector('[data-progress="lesson"]').checked, false);
doc.getElementById("previous-lesson").click();
assert.equal(
  doc.querySelector('[data-progress="lesson"]').checked,
  true,
  "temporary checklist survives playlist movement",
);
assert.match(saveStatus(), /temporary/);
failedStorage.window.close();

const goodStorage = new Map();
const saved = await boot("?lesson=1-1", {
  storage: {
    getItem: (key) => goodStorage.get(key) || null,
    setItem: (key, value) => goodStorage.set(key, value),
  },
});
const savedBox = saved.window.document.querySelector('[data-progress="lesson"]');
savedBox.checked = true;
savedBox.dispatchEvent(new saved.window.Event("change"));
assert.equal(JSON.parse(goodStorage.get("curriculumStudentLaunch:1-1")).lesson, true);
assert.match(
  (
    saved.window.document.getElementById("checklist-status") ||
    saved.window.document.getElementById("launch-status")
  ).textContent,
  /saved on this device/,
);
saved.window.close();
console.log(
  "✓ student launcher: anchors, supports, safe resources, optional practice, readiness/labs, playlist, and honest checklist persistence",
);

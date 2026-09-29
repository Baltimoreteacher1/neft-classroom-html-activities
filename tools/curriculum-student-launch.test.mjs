#!/usr/bin/env node
// Regression: carrying supports in the fragment erased the final-check #reflect anchor.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const html = read("curriculum/student-launch/index.html");
const source = read("assets/curriculum-student-launch.js");
const lessons = JSON.parse(read("data/curriculum-launch-manifest.json")).lessons.slice(0, 2);

async function boot(query) {
  const dom = new JSDOM(html, {
    url: `https://eduwonderlab.com/curriculum/student-launch/${query}`,
    runScripts: "outside-only",
    pretendToBeVisual: true,
  });
  dom.window.fetch = async () => ({ ok: true, json: async () => ({ lessons }) });
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
console.log(
  "✓ curriculum student launcher: final-check anchor, safe supports, student mode, and playlist transitions",
);

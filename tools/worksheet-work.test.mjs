import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { JSDOM } from "jsdom";
import { lessonPath, listLessonDirs, REPO_ROOT } from "./lib/curriculum-source.mjs";

const js = readFileSync(join(REPO_ROOT, "assets/worksheet-work.js"), "utf8");
let tested = 0,
  questions = 0;
for (const id of [
  "1-1",
  "2-1",
  "3-1",
  "4-1",
  "5-1",
  "6-1",
  "7-1",
  "8-1",
  "9-1",
  "10-1",
  "4-1-part2",
  "4-1-group1",
]) {
  const dom = new JSDOM(readFileSync(lessonPath(id, "worksheet.html"), "utf8"), {
    runScripts: "outside-only",
  });
  const { document } = dom.window;
  dom.window.eval(js);
  const cards = [...document.querySelectorAll(".ws-problem-card")];
  assert.ok(cards.length, id);
  assert.equal(document.querySelectorAll("[data-worksheet-work]").length, 1, id);
  for (const card of cards) {
    assert.equal(card.querySelectorAll("textarea").length, 1, id);
    assert.ok(card.querySelector("textarea").labels.length, id);
  }
  const ids = [...document.querySelectorAll("textarea, .ws-digital-choice input")].map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length, "distinct field IDs");
  const example = document.querySelector(".ws-block-example");
  if (example?.querySelector(".ws-example-reveal")) {
    assert.ok(example.querySelectorAll(".ws-screen-concealed").length);
    example.querySelector("button").click();
    assert.match(example.querySelector("[role=status]").textContent, /1 of/);
  }
  const first = document.querySelector("textarea");
  first.value = "3/5 = 0.6 = 60%. The same whole is divided into equal parts.";
  dom.window.eval(js);
  assert.equal(document.querySelectorAll("[data-worksheet-work]").length, 1);
  assert.match(first.value, /same whole/);
  const repeat = new JSDOM(readFileSync(lessonPath(id, "worksheet.html"), "utf8"), {
    runScripts: "outside-only",
  });
  repeat.window.eval(js);
  assert.deepEqual(
    [...repeat.window.document.querySelectorAll("textarea")].map((e) => e.id),
    [...document.querySelectorAll("textarea")].map((e) => e.id),
    "stable resume IDs",
  );
  repeat.window.close();
  questions += cards.length;
  tested++;
  dom.window.close();
}
const teacher = new JSDOM(
  '<html data-support-audience="teacher"><main class="ws-page"></main></html>',
  { runScripts: "outside-only" },
);
teacher.window.eval(js);
assert.equal(teacher.window.document.querySelector("[data-worksheet-work]"), null);
teacher.window.close();
let routed = 0;
for (const id of listLessonDirs()) {
  try {
    const html = readFileSync(lessonPath(id, "worksheet.html"), "utf8");
    if (html.includes('class="ws-page')) {
      assert.ok(html.includes("/shared/supports/print-supports.js"), id);
      routed++;
    }
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
}
assert.ok(routed >= 370);
console.log(
  `Worksheet reasoning: ${tested} actual lesson/variant DOMs, ${questions} problem cards; ${routed} existing worksheet routes wired; stable IDs, progressive examples, teacher exclusion.`,
);

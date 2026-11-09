import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const window = {};
vm.runInNewContext(readFileSync(new URL("./stories.js", import.meta.url), "utf8"), { window });
const stories = window.MYSTERY_STORIES;
const access = window.ACCESS_STUDIO_TASKS;
assert.equal(stories.length, 10, "exactly six elementary stories and four connected chapters");
assert.equal(stories.filter((s) => s.band === "3-5").length, 6);
assert.equal(stories.filter((s) => s.band === "6-8").length, 4);
assert.equal(new Set(stories.map((s) => s.id)).size, stories.length, "unique story IDs");
const required = new Set([
  "clue",
  "sort",
  "notebook",
  "dialogue",
  "timeline",
  "connect",
  "listening",
  "speaking",
  "writing",
  "branch",
]);
const seen = new Set();
const characters = new Set([
  "Maya",
  "Leo",
  "Zara",
  "Noor",
  "Eli",
  "Ms. Bell",
  "Coach Rivera",
  "Mr. Chen",
  "Ms. Green",
  "Riley",
  "Ms. Ortiz",
  "Vale",
  "Imani",
  "Ren",
  "Ellis",
]);
for (const story of stories) {
  assert.ok(
    story.title && story.objective && story.teacher && story.vocabulary.length >= 3,
    `${story.id}: story metadata`,
  );
  if (story.band === "3-5")
    assert.equal(story.scenes.length, 6, `${story.id}: six complete elementary scenes`);
  else
    assert.ok(
      story.scenes.length >= 4 && story.scenes.length <= 6,
      `${story.id}: four to six chapter scenes`,
    );
  for (const [i, scene] of story.scenes.entries()) {
    assert.ok(
      scene.title && scene.text.length > 70 && scene.art,
      `${story.id}/${i}: substantive scene and illustration key`,
    );
    assert.ok(scene.dialogue.length >= 3, `${story.id}/${i}: dialogue`);
    for (const [speaker, line] of scene.dialogue) {
      assert.ok(characters.has(speaker), `${story.id}/${i}: known speaker ${speaker}`);
      assert.ok(line.length > 8, `${story.id}/${i}: complete dialogue line`);
    }
    const a = scene.activity;
    assert.ok(
      a.type && a.domain && a.prompt && a.evidence,
      `${story.id}/${i}: activity domain, prompt, and observable evidence`,
    );
    seen.add(a.type);
    if (a.options && a.answer !== undefined)
      assert.ok(
        a.answer >= 0 && a.answer < a.options.length,
        `${story.id}/${i}: valid answer reference`,
      );
    if (a.items)
      assert.deepEqual(
        [...a.order].sort(),
        [...a.items.keys()].sort(),
        `${story.id}/${i}: valid timeline permutation`,
      );
    if (a.type === "writing" || a.type === "speaking")
      assert.ok(a.criteria?.length >= 2, `${story.id}/${i}: transparent production criteria`);
    if (a.type === "branch")
      assert.ok(
        a.options.length >= 2 && a.options.every((o) => o.result),
        `${story.id}/${i}: branch transitions and consequence`,
      );
  }
}
assert.deepEqual(
  [...required].filter((x) => !seen.has(x)),
  [],
  "all ten reusable interaction types are used",
);
assert.deepEqual(
  [...["Narrate", "Inform", "Explain", "Argue"]].filter(
    (x) => !stories.some((s) => s.keyUse === x),
  ),
  [],
  "all four WIDA Key Language Uses are represented",
);
for (const cluster of ["2-3", "4-5", "6-8"]) {
  for (const domain of ["listening", "speaking", "reading", "writing"]) {
    assert.ok(
      access[cluster]?.[domain]?.title && access[cluster]?.[domain]?.prompt,
      `${cluster}: ${domain} original practice`,
    );
    assert.ok(
      access[cluster]?.[domain]?.alternate?.title && access[cluster]?.[domain]?.alternate?.prompt,
      `${cluster}: second ${domain} original practice`,
    );
  }
}
const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");
assert.match(html, /id="reader"/);
assert.match(html, /id="pathway"/);
assert.match(html, /id="teacher"/);
assert.match(html, /official WIDA assessment, ACCESS test, score/);
assert.doesNotMatch(html, /student name|account required/i);
const engine = readFileSync(new URL("./engine.js", import.meta.url), "utf8");
for (const feature of [
  "localStorage",
  "MediaRecorder",
  "getUserMedia",
  "SpeechSynthesisUtterance",
  "finishCase",
  "completeScene",
  "renderAccessStudio",
])
  assert.ok(engine.includes(feature), `engine includes ${feature}`);
console.log(
  `PASS: ${stories.length} stories, ${stories.reduce((n, s) => n + s.scenes.length, 0)} scenes, ${seen.size} interaction types, 24 ACCESS practice tasks, four Key Language Uses, and route/privacy contracts.`,
);

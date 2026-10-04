#!/usr/bin/env node
/**
 * The lesson status strip renders ONCE per lesson, never per resource row.
 *
 * curriculum-audit-badges.js used to append the full strip (status, Level 1
 * Support, standard, time, Digital + print, Family Page, Teacher Notes) to
 * EVERY .lesson-outline-item on /curriculum/units/. All rows of a lesson share
 * the same lesson-level facts, so a lesson with ten resources showed ~70
 * identical chips, each row's link squeezed into a narrow column beside them.
 * Nothing caught it: every chip was individually correct, and the gates ask
 * whether the page rendered, not whether it repeated itself.
 *
 * This drives the SHIPPED script in jsdom with a fake manifest and pins:
 *   1. zero strips inside resource rows; exactly one `.audit-badges--lesson`
 *      per rendered lesson, placed under the lesson title;
 *   2. the on-screen strip carries status + support + time only (the chips
 *      that restate links already in the list stay on the print strip);
 *   3. rows still carry data-audit-status, which the Lesson status filter reads;
 *   4. when the card switches lesson, the strip is replaced, not duplicated;
 *   5. no visible badge is set below the 13px type floor.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const source = readFileSync(
  new URL("../assets/curriculum-audit-badges.js", import.meta.url),
  "utf8",
);

const manifest = {
  lessons: [
    {
      id: "1-1",
      standard: "MPP.3",
      timeEstimate: "~45 min",
      status: { missingResources: ["teacherNotes"] },
      supports: { esol: true },
      resources: {
        lesson: { exists: true, path: "/lessons/1-1/" },
        guidedNotes: { exists: true, path: "/lessons/1-1/notes.html" },
        familyPage: { exists: true, path: "/lessons/1-1/family/" },
      },
    },
    {
      id: "1-2",
      standard: "5.NF.B.4",
      timeEstimate: "~45 min",
      status: {},
      supports: {},
      resources: { lesson: { exists: true, path: "/lessons/1-2/" } },
    },
  ],
};

function rows(id) {
  return `<li class="lesson-outline-group"><span class="lesson-outline-group-title">Learn</span>
    <ul class="lesson-outline-list">
      <li class="lesson-outline-item"><a href="/lessons/${id}/">Interactive Lesson</a></li>
      <li class="lesson-outline-item"><a href="/lessons/${id}/notes.html">Guided Notes</a></li>
      <li class="lesson-outline-item"><a href="/lessons/${id}/homework.html">Homework</a></li>
    </ul></li>`;
}

const markup = `<!doctype html><html><body class="teacher-mode">
  <div class="controls"></div>
  <div id="interactive-hub">
    <div class="unit-card">
      <h3 class="units-lesson-heading">Lesson 1.1 · Math is Mine</h3>
      <div class="lesson-info">
        <div class="lesson-outline"><ul class="lesson-outline-list">${rows("1-1")}</ul></div>
      </div>
    </div>
    <div class="search-result-item">
      <span class="search-result-unit">Unit 1</span>
      <h3 class="search-result-header">Lesson 1.2 · Math is Exploring and Thinking</h3>
      <ul class="lesson-outline-list">${rows("1-2")}</ul>
    </div>
  </div>
</body></html>`;

const dom = new JSDOM(markup, {
  runScripts: "outside-only",
  url: "https://example.test/curriculum/units/",
});
const { window } = dom;
const { document } = window;
window.NTJsonCache = { json: () => Promise.resolve(manifest) };
window.requestAnimationFrame = (fn) => window.setTimeout(fn, 0);
window.eval(source);

const settle = () => new Promise((resolve) => setTimeout(resolve, 40));
await settle();

let failures = 0;
function check(name, fn) {
  try {
    fn();
    console.log(`   ✓ ${name}`);
  } catch (error) {
    failures++;
    console.error(`   ✗ ${name}\n     ${error.message}`);
  }
}

console.log("curriculum audit badges — one strip per lesson");

check("no status strip inside any resource row", () => {
  assert.equal(document.querySelectorAll(".lesson-outline-item [data-audit-strip]").length, 0);
});

check("exactly one lesson strip per rendered lesson, under its title", () => {
  const card = document.querySelector(".unit-card");
  const strips = card.querySelectorAll(".audit-badges--lesson");
  assert.equal(strips.length, 1);
  assert.equal(strips[0].previousElementSibling?.className, "units-lesson-heading");
  const result = document.querySelector(".search-result-item");
  const resultStrips = result.querySelectorAll(".audit-badges--lesson");
  assert.equal(resultStrips.length, 1);
  assert.equal(resultStrips[0].previousElementSibling?.className, "search-result-header");
});

check(
  "the on-screen strip says status, support level and time — nothing the list already says",
  () => {
    const text = document.querySelector(".unit-card .audit-badges--lesson").textContent;
    assert.match(text, /Missing Resource/);
    assert.match(text, /Level 1 Support/);
    assert.match(text, /~45 min/);
    assert.doesNotMatch(text, /MPP\.3|Family Page|Teacher Notes|Digital \+ print/);
    assert.match(
      document.querySelector(".search-result-item .audit-badges--lesson").textContent,
      /Ready/,
    );
  },
);

check("strips are teacher-only; rows keep data-audit-status for the filter", () => {
  for (const strip of document.querySelectorAll(".audit-badges--lesson"))
    assert.ok(strip.classList.contains("hub-teacher-only"));
  const items = document.querySelectorAll(".unit-card .lesson-outline-item");
  assert.equal(items.length, 3);
  for (const item of items) assert.equal(item.getAttribute("data-audit-status"), "problem");
  for (const item of document.querySelectorAll(".search-result-item .lesson-outline-item"))
    assert.equal(item.getAttribute("data-audit-status"), "ready");
});

// The units page re-renders the outline when a different lesson is chosen.
const card = document.querySelector(".unit-card");
card.querySelector(".units-lesson-heading").textContent =
  "Lesson 1.2 · Math is Exploring and Thinking";
card.querySelector(".lesson-outline > .lesson-outline-list").innerHTML = rows("1-2");
await settle();

check("switching the card's lesson replaces the strip instead of stacking a second one", () => {
  const strips = card.querySelectorAll(".audit-badges--lesson");
  assert.equal(strips.length, 1);
  assert.match(strips[0].textContent, /Ready/);
  assert.doesNotMatch(strips[0].textContent, /Missing Resource/);
  assert.equal(card.querySelectorAll(".lesson-outline-item [data-audit-strip]").length, 0);
});

check("no badge is set below the 13px type floor", () => {
  assert.doesNotMatch(source, /\.audit-badge\{[^}]*font-size:1[0-2](?:\.\d+)?px/);
});

if (failures) {
  console.error(`\n✗ curriculum audit badges: ${failures} failure(s)`);
  process.exit(1);
}
console.log("   ✓ 6 checks");

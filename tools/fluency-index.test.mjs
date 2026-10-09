import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";

const html = readFileSync(`${REPO_ROOT}/curriculum/fluency/index.html`, "utf8");
const doc = new JSDOM(html).window.document;

// 1. Shared curriculum shell navigation
const navLinks = [...doc.querySelectorAll(".ewl-course-links > li > a")];
assert.equal(navLinks.length, 8, "Top course navigation has exactly 8 destinations");
const labels = navLinks.map((a) => a.textContent.trim());
const helpIndex = labels.indexOf("Extra Help");
const fluencyIndex = labels.indexOf("Fluency");
assert.ok(helpIndex !== -1, "Extra Help link exists");
assert.ok(fluencyIndex !== -1, "Fluency link exists");
assert.equal(fluencyIndex, helpIndex + 1, "Fluency button is directly adjacent to Extra Help");

const activeLink = doc.querySelector('.ewl-course-links [aria-current="page"]');
assert.ok(activeLink, "An active page link exists in navigation");
assert.equal(activeLink.textContent.trim(), "Fluency", "Fluency is marked aria-current=page");
assert.equal(activeLink.getAttribute("href"), "/curriculum/fluency/");

// 2. Head elements and asset links
assert.ok(
  doc.querySelector('link[href="/assets/curriculum-fluency-index.css"]'),
  "Fluency index stylesheet linked",
);
assert.ok(
  doc.querySelector('script[src="/assets/curriculum-fluency-index.js"]'),
  "Fluency index controller script linked",
);
assert.ok(
  existsSync(`${REPO_ROOT}/assets/curriculum-fluency-index.css`),
  "Fluency CSS file exists on disk",
);
assert.ok(
  existsSync(`${REPO_ROOT}/assets/curriculum-fluency-index.js`),
  "Fluency JS file exists on disk",
);

// 3. Tabbar and View panels
const tabLessons = doc.getElementById("tab-lessons");
const tabStudio = doc.getElementById("tab-studio");
assert.ok(tabLessons, "#tab-lessons exists");
assert.ok(tabStudio, "#tab-studio exists");
assert.equal(tabLessons.getAttribute("aria-controls"), "view-lessons");
assert.equal(tabStudio.getAttribute("aria-controls"), "view-studio");
assert.equal(doc.getElementById("view-lessons") !== null, true, "#view-lessons panel exists");
assert.equal(doc.getElementById("view-studio") !== null, true, "#view-studio panel exists");

// 4. Hero and Toolbar controls
assert.ok(doc.querySelector(".fluency-hero"), "Hero banner present");
assert.ok(doc.getElementById("fluencySearchInput"), "Search input present");
assert.ok(doc.getElementById("fluencyUnitSelect"), "Unit select dropdown present");
assert.ok(doc.getElementById("fluencyOriginSelect"), "Origin select dropdown present");
const domainPills = [...doc.querySelectorAll(".domain-pill")].map((b) =>
  b.getAttribute("data-domain"),
);
assert.deepEqual(domainPills, ["all", "6.RP", "6.NS", "6.EE", "6.G", "6.SP"]);

// 5. Units and Lessons Coverage (Units 1-9, 78 Lessons; Unit 10 is not taught)
const units = [...doc.querySelectorAll(".unit-block")];
assert.equal(units.length, 9, "Expected 9 units (Units 1 through 9)");
const unitNumbers = units.map((u) => u.getAttribute("data-unit"));
assert.deepEqual(unitNumbers, ["1", "2", "3", "4", "5", "6", "7", "8", "9"]);

const lessonCards = [...doc.querySelectorAll(".fluency-lesson-card")];
assert.equal(
  lessonCards.length,
  78,
  "Expected all 78 taught Reveal Math lessons to be present in index",
);

for (const card of lessonCards) {
  const id = card.getAttribute("data-id");
  assert.ok(id, "Lesson card has data-id attribute");
  assert.ok(card.querySelector(".lesson-badge-id"), `Lesson ${id}: ID badge exists`);
  assert.ok(card.querySelector("h3"), `Lesson ${id}: Title exists`);
  assert.ok(card.querySelector(".standard-badge"), `Lesson ${id}: Standard badge exists`);

  const skills = card.querySelectorAll(".skill-item");
  assert.equal(skills.length, 4, `Lesson ${id}: Expected 4 prerequisite foundation skills`);

  const prompt = card.querySelector(".qc-card-prompt");
  assert.ok(
    prompt && prompt.textContent.trim().length > 5,
    `Lesson ${id}: Quick check prompt exists`,
  );

  const studioLink = card.querySelector('a[href*="#view=studio"]');
  assert.ok(studioLink, `Lesson ${id}: Studio link exists`);
  assert.match(studioLink.getAttribute("href"), new RegExp(`lesson=${id}`));

  const lessonPageLink = card.querySelector(`a[href="/lessons/${id}/"]`);
  assert.ok(lessonPageLink, `Lesson ${id}: Lesson page link exists`);

  const drawer = card.querySelector(`#practice-drawer-${id}`);
  assert.ok(drawer, `Lesson ${id}: Practice drawer exists`);
  const practiceCards = drawer.querySelectorAll(".practice-mini-card");
  assert.equal(practiceCards.length, 4, `Lesson ${id}: Exactly 4 worked practice tasks in drawer`);
}

// 6. Security and public isolation
assert.equal(
  html.includes("/curriculum/fluency/teacher/printables/unit-2-teacher-keys.pdf"),
  false,
  "No teacher keys leaked",
);
assert.equal(html.includes("class tallies"), false, "No teacher dashboard leaked");

console.log(
  "Fluency Index test: 78 lessons across Units 1–9, navigation placement, toolbar filters, studio routing, and public safety PASS.",
);

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("./", import.meta.url);
const html = await readFile(new URL("index.html", root), "utf8");

for (const expected of [
  "<!doctype html>",
  '<html lang="en">',
  'class="skip-link"',
  '<strong>6th-Grade Math</strong>',
  'id="family-week"',
  'class="family-quick-nav"',
  'href="#family-week"',
  'href="#homework-library"',
  'href="#family-support"',
  'href="#family-scheduler"',
  'id="section-select"',
  'id="week-grid"',
  'id="homework-search"',
  'id="unit-filter"',
  'id="homework-grid"',
  'id="clear-homework-filters"',
  'id="all-homework-panel"',
  'id="week-practice"',
  'id="week-practice-grid"',
  'data-i18n="weekPracticeTitle"',
  'data-i18n="weekPracticeHint"',
  'id="read-week"',
  'id="language-toggle"',
  'id="contrast-toggle"',
  'id="text-size-toggle"',
  'id="teacher-access"',
  'id="classdojo-link"',
  'id="scheduler-classdojo-link"',
  'data-classdojo-link',
  'id="canvas-link"',
  'id="family-status"',
  'id="family-support"',
  'id="family-scheduler"',
  'id="meeting-slots"',
  'id="meeting-request-form"',
  'id="meeting-student-first-name"',
  'id="meeting-consent"',
  'id="meeting-confirmation"',
  'id="add-meeting-calendar"',
  'data-scheduler-key="bookedTitle"',
  'data-scheduler-key="title"',
  'class="compact-intro"',
  'href="/curriculum/ai-hub/#parents"',
  'href="./family.css"',
  'href="./family-polish.css"',
  'href="./family-scheduler.css"',
  'href="./family-foundation.css"',
  'src="./family-app.js"',
  'src="./family-scheduler.js"',
]) {
  assert.ok(html.toLowerCase().includes(expected.toLowerCase()), `Missing public contract: ${expected}`);
}

assert.match(html, /equivalent school option/i);
assert.match(html, /family participation is never graded/i);
assert.match(html, /booked immediately/i);
assert.match(html, /student.+first name only/i);
assert.match(html, /optional family practice/i);
assert.match(html, /separate from (?:your student's )?regular homework/i);
assert.ok(
  html.indexOf('href="#homework-library"') < html.indexOf('href="#family-scheduler"'),
  "Optional practice should appear before Meet in the quick navigation",
);
assert.ok(
  html.indexOf('id="homework-library"') < html.indexOf('id="family-scheduler"'),
  "Optional family practice should appear above Meet with Mr. Neft",
);
assert.ok(
  html.indexOf('id="family-scheduler"') < html.indexOf('id="scheduler-classdojo-link"') &&
    html.indexOf('id="scheduler-classdojo-link"') < html.indexOf('id="meeting-slots"'),
  "The ClassDojo link should be easy to find inside the meeting section",
);
assert.match(
  html,
  /id="teacher-access"[^>]+href="\/curriculum\/family-connections\/teacher\/"[^>]*>[^<]*<span[^>]*>[^<]*<\/span>\s*Teacher sign in/i,
  "Family Mode should link to the password-protected teacher page",
);
assert.doesNotMatch(html, /answer[ -]?key/i);
assert.doesNotMatch(html, /id="message-studio"/i);
assert.doesNotMatch(
  html,
  /href=["']\/curriculum\/?["']/i,
  "Family Mode must not link families back to the protected curriculum hub",
);
assert.doesNotMatch(html, /editor\.js|edit-toggle|contenteditable/i);
assert.doesNotMatch(html, /name=".*(?:token|password|secret)/i);
assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com/i);

const css = (
  await Promise.all(
    ["family-foundation.css", "family.css", "family-polish.css"].map((path) =>
      readFile(new URL(path, root), "utf8"),
    ),
  )
).join("\n");
assert.match(css, /min-width:\s*0/);
assert.match(css, /overflow-wrap:\s*anywhere/);
assert.match(css, /@media\s*\(max-width:\s*40rem\)/);
assert.match(css, /prefers-reduced-motion/);
// A printed week has to say where the practice lives.
assert.doesNotMatch(
  css,
  /@media print\s*\{[^}]*\.homework-section,/,
  "printing must keep this week's practice, not hide the whole section",
);
assert.match(css, /\.homework-actions a\[href\^="\/"\]::after/);
assert.match(css, /\.homework-library-panel,/);
assert.match(css, /:focus-visible/);

const app = await readFile(new URL("family-app.js", root), "utf8");
const scheduler = await readFile(new URL("family-scheduler.js", root), "utf8");
const renderer = await readFile(new URL("shared/render.js", root), "utf8");
assert.match(app, /curriculum-manifest\.json/);
assert.match(app, /api\/family-connections\/published/);
assert.match(app + renderer, /mergeHomework/);
assert.match(renderer, /homework-details-disclosure/);
assert.match(renderer, /week-empty-state/);
assert.match(renderer, /today-badge/);
assert.match(renderer, /Learning focus/);
assert.match(renderer, /Start optional practice/);
assert.match(renderer, /Open family help/);
assert.match(renderer, /Play lesson arcade/);
assert.match(renderer, /weekHomework/);
assert.match(renderer, /renderWeekPractice/);
assert.match(renderer, /Practice together/);
assert.match(renderer, /Práctica juntos/);
assert.match(renderer, /absolutePublicUrl/);
// Every family-visible string has to answer to the language toggle.
assert.match(renderer, /dayNote\(entry, lang\)/);
assert.match(renderer, /weekNote\(section\.week, lang\)/);
assert.match(app, /weekNote\(section\.week, lang\)/);
assert.match(app, /familyWeekSpeech\(state\.snapshot, state\.lessons, state\.sectionId, es \? "es" : "en"\)/);
// Day statuses must read from the bilingual label table, not inline English.
assert.match(renderer, /review: t\.statusReview/);
assert.match(renderer, /assessment: t\.statusAssessment/);
assert.match(renderer, /"no-class": t\.statusNoClass/);
assert.match(renderer, /statusReview: "Repaso y práctica"/);
assert.match(app, /renderWeekPractice/);
assert.match(app, /posted this week/);
assert.ok(
  html.indexOf('id="week-practice"') < html.indexOf('id="all-homework-panel"'),
  "This week's practice should sit above the browse-all library",
);
assert.match(renderer, /arcadePath/);
assert.match(app, /isConfiguredDestination/);
assert.match(app, /querySelectorAll\(["']\[data-classdojo-link\]["']\)/);
assert.match(app, /cache:\s*["']no-store["']/);
assert.match(app, /document\.visibilityState/);
assert.match(app, /setInterval/);
assert.match(app, /Family page updated/);
assert.match(app, /family-language-change/);
assert.match(scheduler, /family-language-change[\s\S]{0,160}loadSlots/);
assert.match(scheduler, /formatMeetingSlot/);
assert.match(scheduler, /meeting-slot-date/);
assert.match(scheduler, /meeting-slot-time/);
assert.match(scheduler, /dataset\.schedulerEn\s*=\s*["']Book["']/);
assert.match(app, /matching lessons/);
assert.match(app, /lessons available/);
assert.doesNotMatch(app + renderer, /family homework|homework library/i);
assert.match(app, /speechSynthesis/);
assert.doesNotMatch(app, /localStorage.*(?:student|family|message)/i);

const teacherTools = await readFile(new URL("../../teacher-tools/index.html", root), "utf8");
assert.ok(
  (teacherTools.match(/href="\/curriculum\/family-connections\/teacher\/"/g) ?? []).length >= 2,
  "teacher hub entry points should open protected Teacher Mode",
);
const curriculumHub = await readFile(new URL("../index.html", root), "utf8");
assert.match(curriculumHub, /class="tt-link tt-card family-mode-card"[^>]+href="\/curriculum\/family-connections\/"/i);
assert.match(curriculumHub, /class="tt-link tt-card teacher-mode-card"[^>]+href="\/curriculum\/family-connections\/teacher\/"/i);
assert.match(curriculumHub, /Public family page/i);
assert.match(curriculumHub, /Sign-in protected publisher/i);
const routes = JSON.parse(await readFile(new URL("../../data/routes.json", root), "utf8"));
assert.ok(routes.routes.some((route) => route.id === "family-connections" && route.audience === "family"));
assert.ok(routes.routes.some((route) => route.id === "family-connections-publisher" && route.path.endsWith("/teacher/")));
const legacyFamily = await readFile(new URL("family/index.html", root), "utf8");
assert.match(legacyFamily, /url=\/curriculum\/family-connections\//i);
assert.match(legacyFamily, /rel="canonical" href="https:\/\/eduwonderlab\.com\/curriculum\/family-connections\/"/i);

console.log("Family Mode static contracts passed.");

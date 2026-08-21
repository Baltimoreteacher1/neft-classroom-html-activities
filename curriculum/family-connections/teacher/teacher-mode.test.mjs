import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("./", import.meta.url);
const html = await readFile(new URL("index.html", root), "utf8");
for (const expected of [
  'id="meeting-scheduler-tools"',
  'id="teacher-slot-form"',
  'id="teacher-meeting-dashboard"',
  'id="teacher-invitation-form"',
  'src="./scheduler-admin.js"',
  'href="./scheduler-admin.css"',
  'id="canvas-access-token"',
  'id="test-canvas-connection"',
  'id="sync-canvas-announcement"',
  'id="sync-canvas-availability"',
  'id="forget-canvas-token"',
  'src="./canvas-direct.js"',
]) assert.ok(html.includes(expected), `Missing teacher scheduler contract: ${expected}`);

// The weekly note ships in both languages or it is not honest bilingual copy.
for (const expected of [
  'id="week-note-es"',
  'id="week-note-build"',
  'id="week-note-status"',
  'lang="es"',
]) assert.ok(html.includes(expected), `Missing bilingual note contract: ${expected}`);

// The calendar picker and the family activity report.
for (const expected of [
  'id="pacing-calendar"',
  'id="family-response-key"',
  'id="family-response-days"',
  'id="family-response-load"',
  'id="family-response-report"',
  'type="password"',
]) assert.ok(html.includes(expected), `Missing family reporting contract: ${expected}`);
const calendar = await readFile(new URL("pacing-calendar.js", root), "utf8");
assert.match(calendar, /pacingMonthGrid/);
assert.match(calendar, /aria-current/);
const familyResponse = await readFile(new URL("family-response.js", root), "utf8");
assert.match(familyResponse, /neft\.teacher\.key/);
assert.match(familyResponse, /x-teacher-key/);
assert.match(familyResponse, /api\/signal\/practice/);
assert.match(familyResponse, /api\/progress\/family-signoff/);

// Fill-from-the-plan: the publisher must not become a second pacing schedule.
for (const expected of [
  'id="pacing-fill"',
  'id="pacing-week"',
  'id="pacing-fill-apply"',
  'id="pacing-fill-status"',
]) assert.ok(html.includes(expected), `Missing pacing fill contract: ${expected}`);
const teacherApp = await readFile(new URL("teacher-app.js", root), "utf8");
assert.match(teacherApp, /buildWeekFromPacing/);
assert.match(teacherApp, /pacing-baseline-2026-27\.json/);
assert.match(teacherApp, /api\/pacing\/state/);
assert.match(teacherApp, /window\.confirm/, "filling must not silently discard a planned week");
assert.match(teacherApp, /buildFamilyWeekNote/);
assert.match(teacherApp, /renderPacingCalendar/);
assert.match(teacherApp, /loadFamilyResponse/);
assert.match(teacherApp, /family-week-notes\.json/);
const weekNoteModule = (await readFile(new URL("../shared/family-week-note.js", root), "utf8"))
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");
assert.doesNotMatch(
  weekNoteModule,
  /translate|es:\s*\w+\.en\b/i,
  "Spanish must be curated, never derived from the English lane",
);
const pacingWeek = (await readFile(new URL("../shared/pacing-week.js", root), "utf8"))
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");
assert.doesNotMatch(
  pacingWeek,
  /plan\.note|overlay\.note|source\.note/,
  "the planner's private working notes must never reach a family draft",
);

for (const expected of [
  'id="section-manager"',
  'id="new-section-name"',
  'for="new-section-name"',
  'src="./section-manager.js"',
]) assert.ok(html.includes(expected), `Missing section manager contract: ${expected}`);

for (const expected of [
  'id="availability-rule-form"',
  'name="weekdays"',
  'name="activeStartDate"',
  'name="activeEndDate"',
  'name="startTime"',
  'name="endTime"',
  'name="bufferMinutes"',
  'id="availability-rules"',
  'id="refresh-generated-slots"',
  'id="meeting-upcoming"',
  'id="meeting-open"',
  'id="meeting-history"',
]) assert.ok(html.includes(expected), `Missing scheduling secretary contract: ${expected}`);

for (const contract of [
  "<!doctype html>",
  'class="skip-link"',
  'id="publish-status"',
  'id="save-draft"',
  'id="preview-draft"',
  'id="publish-draft"',
  'id="teacher-navigation"',
  'id="section-editor"',
  'id="week-label"',
  'id="week-start"',
  'id="week-note"',
  'id="weekday-editors"',
  'id="homework-editor"',
  'id="homework-editor-search"',
  'id="announcement-editor"',
  'id="resource-editor"',
  'id="classdojo-url"',
  'id="canvas-url"',
  'id="canvas-sync-status"',
  'id="prepare-canvas-update"',
  'id="copy-canvas-feed"',
  'id="canvas-feed-url"',
  'id="copy-canvas-announcement"',
  'id="copy-canvas-modules"',
  'id="download-canvas-json"',
  'id="open-canvas"',
  'id="open-canvas-announcements"',
  'id="open-canvas-modules"',
  'id="family-preview"',
  'id="publication-history"',
  'id="homework-tools"',
  'id="updates-tools"',
  'id="wording-tools"',
  'id="copy-lang"',
  'id="copy-editor"',
  'id="sharing-tools"',
  'class="teacher-edit-column"',
  'class="teacher-preview-column"',
  'src="./teacher-app.js"',
]) {
  assert.ok(html.toLowerCase().includes(contract.toLowerCase()), `Missing Teacher Mode contract: ${contract}`);
}

assert.match(html, /Draft → Preview → Publish/);
assert.match(html, /sign-in protected/i);
assert.match(html, />Edit Family Connections</i);
assert.match(html, /href="\/curriculum\/"[^>]*>[^<]*Curriculum Hub/i);
assert.match(html, /href="\/curriculum\/family-connections\/"[^>]*>[^<]*View live family page/i);
assert.match(html, /separate from regular homework/i);
assert.match(html, /families cannot edit/i);
assert.match(html, /<meta name="robots" content="noindex,nofollow"\s*\/>/i);
assert.doesNotMatch(html, /name=".*(?:token|password|secret)/i);
assert.doesNotMatch(html, /canvasAccessToken/);
assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com/i);

const app = await readFile(new URL("teacher-app.js", root), "utf8");
const schedulerAdmin = await readFile(new URL("scheduler-admin.js", root), "utf8");
const editors = await readFile(new URL("editors.js", root), "utf8");
const apiClient = await readFile(new URL("../shared/api-client.js", root), "utf8");
assert.match(app + apiClient, /family-connections/);
assert.match(apiClient, /call\("draft"/);
assert.match(apiClient, /call\("publish"/);
assert.match(app, /buildCanvasAnnouncement/);
assert.match(app, /buildCanvasModuleLinks/);
assert.match(app, /buildCanvasExport/);
assert.match(app, /buildCanvasSyncBundle/);
assert.match(app, /parseCanvasCourseUrl/);
assert.match(app, /canvas-feed/);
assert.match(app, /searchParams\.set\("v", "1"\)/);
assert.match(app, /beforeunload/);
assert.match(app, /revision-conflict/);
assert.match(schedulerAdmin, /downloadCalendarEvent/);
assert.match(schedulerAdmin, /Add to calendar/);
assert.match(app, /\["week-label", "weekLabel"\]/, "week label must not overwrite the class label");
assert.match(app, /renderPreview\(false\)/, "initialization must not move the teacher away from the first editor");
assert.match(editors, /weekHasMeaningfulContent/);
assert.match(editors, /preview-empty-week/);
assert.match(editors, /preview-summary/);

const css = await readFile(new URL("teacher.css", root), "utf8");
assert.match(css, /min-width:\s*0/);
assert.match(css, /overflow-wrap:\s*anywhere/);
assert.match(css, /@media\s*\(max-width:/);
assert.match(css, /:focus-visible/);
assert.match(
  css,
  /\.section-actions\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s,
  "section controls must keep the Editing section label readable",
);

console.log("Teacher Mode static contracts passed.");

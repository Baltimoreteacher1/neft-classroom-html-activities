import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("./", import.meta.url);
const html = await readFile(new URL("index.html", root), "utf8");

for (const contract of [
  "<!doctype html>",
  'class="skip-link"',
  'id="publish-status"',
  'id="save-draft"',
  'id="preview-draft"',
  'id="publish-draft"',
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
  'id="copy-canvas-announcement"',
  'id="copy-canvas-modules"',
  'id="download-canvas-json"',
  'id="open-canvas"',
  'id="family-preview"',
  'id="publication-history"',
  'id="homework-tools"',
  'id="updates-tools"',
  'id="sharing-tools"',
  'class="teacher-edit-column"',
  'class="teacher-preview-column"',
  'src="./teacher-app.js"',
]) {
  assert.ok(html.toLowerCase().includes(contract.toLowerCase()), `Missing Teacher Mode contract: ${contract}`);
}

assert.match(html, /Draft → Preview → Publish/);
assert.match(html, /sign-in protected/i);
assert.match(html, /separate from regular homework/i);
assert.match(html, /<meta name="robots" content="noindex,nofollow"\s*\/>/i);
assert.doesNotMatch(html, /name=".*(?:token|password|secret)/i);
assert.doesNotMatch(html, /canvasAccessToken/);
assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com/i);

const app = await readFile(new URL("teacher-app.js", root), "utf8");
const apiClient = await readFile(new URL("../shared/api-client.js", root), "utf8");
assert.match(app + apiClient, /family-connections/);
assert.match(apiClient, /call\("draft"/);
assert.match(apiClient, /call\("publish"/);
assert.match(app, /buildCanvasAnnouncement/);
assert.match(app, /buildCanvasModuleLinks/);
assert.match(app, /buildCanvasExport/);
assert.match(app, /beforeunload/);
assert.match(app, /revision-conflict/);
assert.match(app, /\["week-label", "weekLabel"\]/, "week label must not overwrite the class label");
assert.match(app, /renderPreview\(false\)/, "initialization must not move the teacher away from the first editor");

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

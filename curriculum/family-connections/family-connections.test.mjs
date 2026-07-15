import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("./", import.meta.url);
const html = await readFile(new URL("index.html", root), "utf8");

for (const expected of [
  "<!doctype html>",
  '<html lang="en">',
  'class="skip-link"',
  'id="family-week"',
  'id="section-select"',
  'id="week-grid"',
  'id="homework-search"',
  'id="unit-filter"',
  'id="homework-grid"',
  'id="read-week"',
  'id="language-toggle"',
  'id="contrast-toggle"',
  'id="text-size-toggle"',
  'id="classdojo-link"',
  'id="canvas-link"',
  'id="family-status"',
  'href="/curriculum/ai-hub/#parents"',
  'href="/curriculum/family-connections/teacher/"',
  'href="./family.css"',
  'src="./family-app.js"',
]) {
  assert.ok(html.toLowerCase().includes(expected.toLowerCase()), `Missing public contract: ${expected}`);
}

assert.match(html, /equivalent school option/i);
assert.match(html, /family participation is never graded/i);
assert.doesNotMatch(html, /answer[ -]?key/i);
assert.doesNotMatch(html, /id="message-studio"/i);
assert.doesNotMatch(html, /name=".*(?:token|password|secret)/i);

const css = await readFile(new URL("family.css", root), "utf8");
assert.match(css, /min-width:\s*0/);
assert.match(css, /overflow-wrap:\s*anywhere/);
assert.match(css, /@media\s*\(max-width:\s*40rem\)/);
assert.match(css, /prefers-reduced-motion/);
assert.match(css, /:focus-visible/);

const app = await readFile(new URL("family-app.js", root), "utf8");
const renderer = await readFile(new URL("shared/render.js", root), "utf8");
assert.match(app, /curriculum-manifest\.json/);
assert.match(app, /api\/family-connections\/published/);
assert.match(app + renderer, /mergeHomework/);
assert.match(app, /speechSynthesis/);
assert.doesNotMatch(app, /localStorage.*(?:student|family|message)/i);

const teacherTools = await readFile(new URL("../../teacher-tools/index.html", root), "utf8");
assert.ok(
  (teacherTools.match(/href="\/curriculum\/family-connections\/teacher\/"/g) ?? []).length >= 2,
  "teacher hub entry points should open protected Teacher Mode",
);
const routes = JSON.parse(await readFile(new URL("../../data/routes.json", root), "utf8"));
assert.ok(routes.routes.some((route) => route.id === "family-connections" && route.audience === "family"));
assert.ok(routes.routes.some((route) => route.id === "family-connections-publisher" && route.path.endsWith("/teacher/")));
const legacyFamily = await readFile(new URL("family/index.html", root), "utf8");
assert.match(legacyFamily, /url=\/curriculum\/family-connections\//i);
assert.match(legacyFamily, /rel="canonical" href="https:\/\/eduwonderlab\.com\/curriculum\/family-connections\/"/i);

console.log("Family Mode static contracts passed.");

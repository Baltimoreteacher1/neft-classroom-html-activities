import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { JSDOM } from "jsdom";
import { isTeacherSurface } from "../functions/_lib/teacher-surface.js";
import { renderExtraHelp } from "../scripts/generate-extra-help.mjs";
import { loadCurriculumManifest, loadDataJson, REPO_ROOT } from "./lib/curriculum-source.mjs";

const toc = loadDataJson("reveal-toc-2025.json");
const manifest = loadCurriculumManifest();
const html = readFileSync(join(REPO_ROOT, "curriculum/extra-help/index.html"), "utf8");
const escape = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
assert.equal((html.match(/data-lesson /g) || []).length, manifest.total);
assert.equal((html.match(/class="eh-unit"/g) || []).length, toc.units.length);
assert.equal(
  (html.match(/Additional practice<\/span>/g) || []).length,
  manifest.total - toc.units.reduce((sum, unit) => sum + unit.lessons.length, 0),
);
for (const unit of toc.units) {
  let previous = -1;
  for (const lesson of unit.lessons) {
    const pos = html.indexOf(`id="lesson-${lesson.n}"`);
    assert.ok(pos > previous, `Book order preserved: ${lesson.n}`);
    previous = pos;
    const card = html.slice(pos, html.indexOf("</li>", pos));
    assert.ok(card.includes(`<h3>${escape(lesson.title)}</h3>`), `Publisher title: ${lesson.n}`);
    assert.ok(card.includes(`/lessons/${lesson.n}/student-help/`), `Help: ${lesson.n}`);
    assert.ok(card.includes(`/lessons/${lesson.n}/notes.html`), `Notes: ${lesson.n}`);
    assert.ok(card.includes(`/lessons/${lesson.n}/worksheet.html`), `Practice: ${lesson.n}`);
  }
}
const localLinks = [...html.matchAll(/(?:href|src)="(\/[^"#]+)"/g)].map((match) => match[1]);
for (const href of localLinks) {
  const file = href.endsWith("/") ? `${href}index.html` : href;
  assert.ok(
    existsSync(join(REPO_ROOT, file)) || existsSync(join(REPO_ROOT, "public", file)),
    `Resource exists: ${href}`,
  );
  assert.ok(!isTeacherSurface(href), `Resource accessible to students: ${href}`);
}
assert.ok(
  !/teacher-notes|answer-key|teacher\/|editable-slides/.test(html),
  "Index stays student safe",
);
assert.ok(
  /class="eh-filters" role="search" hidden/.test(html),
  "No inert search controls without JS",
);
assert.ok(html.includes("<noscript>"), "No-JS browsing available");
const hub = readFileSync(join(REPO_ROOT, "curriculum/index.html"), "utf8");
assert.match(
  hub,
  /class="hub-extra-help-shortcut" href="\/curriculum\/extra-help\/">Extra Help<\/a>/,
);
assert.ok(
  hub.indexOf("hub-extra-help-shortcut") < hub.indexOf('id="main-content"'),
  "Shortcut at top",
);
const broken = structuredClone(manifest);
broken.lessons = broken.lessons.filter((lesson) => lesson.id !== "3-2");
assert.throws(() => renderExtraHelp(broken, toc), /missing book lesson 3-2/);
const missingResource = structuredClone(manifest);
missingResource.lessons[0].resources.studentHelp.file = "missing-help.html";
assert.throws(() => renderExtraHelp(missingResource, toc), /missing or invalid resource/);
assert.equal(
  renderExtraHelp(manifest, toc),
  renderExtraHelp(manifest, toc),
  "Deterministic rendering",
);

const dom = new JSDOM(html, {
  runScripts: "outside-only",
  url: "https://eduwonderlab.com/curriculum/extra-help/",
});
const { document, Event } = dom.window;
dom.window.eval(readFileSync(join(REPO_ROOT, "assets/curriculum-extra-help.js"), "utf8"));
const search = document.getElementById("help-search");
const unitSelect = document.getElementById("help-unit");
const visible = () =>
  [...document.querySelectorAll("[data-lesson]")].filter((node) => !node.hidden);
assert.equal(document.querySelector(".eh-filters").hidden, false);
for (const query of ["3.2", "3-2", "ratios", "razones", "6.RP"]) {
  search.value = query;
  search.dispatchEvent(new Event("input"));
  assert.ok(visible().length > 0, `Search matches: ${query}`);
}
search.value = "unmatchable-lesson";
search.dispatchEvent(new Event("input"));
assert.equal(visible().length, 0);
assert.equal(document.getElementById("help-empty").hidden, false);
document.querySelector('.eh-jumps a[href="#unit-3"]').click();
assert.equal(visible().length, manifest.total, "Unit jump clears conflicting search");
unitSelect.value = "6";
unitSelect.dispatchEvent(new Event("change"));
assert.equal(visible().length, manifest.lessons.filter((lesson) => lesson.unit === 6).length);
assert.ok(visible().every((node) => node.closest(".eh-unit").dataset.unit === "6"));
document.querySelector(".eh-filters").reset();
await new Promise((resolve) => setTimeout(resolve, 20));
assert.equal(visible().length, manifest.total, "Clear filters restores every lesson");
dom.window.close();
console.log(
  `Extra Help PASS: ${manifest.total} lessons, ${toc.units.length} units, ${localLinks.length} existing local links, source fidelity and failure recovery.`,
);

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
// Cognate strip: English and Spanish only, each card paired and pictured.
{
  const doc = new JSDOM(html).window.document;
  assert.match(doc.querySelector("h1").textContent, /Strategy Boosters & Concept Unlocks/);
  assert.match(doc.querySelector("h1").textContent, /Impulsores de Estrategia/);
  assert.ok(
    !/remediation|struggl|deficit/i.test(doc.querySelector("main").textContent),
    "No deficit wording",
  );
  const cards = [...doc.querySelectorAll(".eh-cog")];
  assert.ok(cards.length >= 8, "Cognate strip has 8+ cards");
  for (const card of cards) {
    assert.ok(card.querySelector('svg[aria-hidden="true"]'), "Each cognate has a picture");
    assert.ok(card.querySelector('[lang="en"]')?.textContent.trim(), "English word");
    assert.ok(card.querySelector('[lang="es"]')?.textContent.trim(), "Spanish word");
    const buttons = [...card.querySelectorAll(".eh-say")];
    assert.deepEqual(buttons.map((b) => b.dataset.lang).sort(), ["en-US", "es-ES"]);
    assert.ok(
      buttons.every((b) => b.hidden),
      "Speak buttons start hidden",
    );
  }
  const langsUsed = [
    ...new Set([...doc.querySelectorAll("[lang]")].map((n) => n.getAttribute("lang"))),
  ];
  assert.ok(
    langsUsed.every((l) => l === "en" || l === "es"),
    `Only en/es on the page: ${langsUsed}`,
  );
  for (const word of ["Ratio", "Coordinate", "Inequality", "Surface area"])
    assert.ok(
      cards.some((c) => c.querySelector('[lang="en"]').textContent === word),
      `Cognate: ${word}`,
    );
}
const hub = readFileSync(join(REPO_ROOT, "curriculum/index.html"), "utf8");
const hubDocument = new JSDOM(hub).window.document;
const helpLink = hubDocument.querySelector('.ewl-course-nav a[href="/curriculum/extra-help/"]');
assert.ok(helpLink, "Extra Help is in the top navigation");
assert.equal(helpLink.closest("li").previousElementSibling.textContent, "Homework");
assert.equal(
  hubDocument.querySelectorAll('.hub-shortcuts a[href="/curriculum/extra-help/"]').length,
  0,
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
// Speech: works when available (English and Spanish voices), invisible when not.
{
  const script = readFileSync(join(REPO_ROOT, "assets/curriculum-extra-help.js"), "utf8");
  const open = () =>
    new JSDOM(html, {
      runScripts: "outside-only",
      url: "https://eduwonderlab.com/curriculum/extra-help/",
    });
  const spoken = [];
  const withSpeech = open();
  withSpeech.window.SpeechSynthesisUtterance = function (text) {
    this.text = text;
  };
  withSpeech.window.speechSynthesis = { cancel() {}, speak: (u) => spoken.push([u.text, u.lang]) };
  withSpeech.window.eval(script);
  const buttons = [...withSpeech.window.document.querySelectorAll(".eh-say")];
  assert.ok(
    buttons.every((b) => !b.hidden),
    "Speak buttons appear when speech exists",
  );
  buttons.find((b) => b.dataset.say === "Razón").click();
  buttons.find((b) => b.dataset.say === "Ratio").click();
  assert.deepEqual(spoken, [
    ["Razón", "es-ES"],
    ["Ratio", "en-US"],
  ]);
  withSpeech.window.close();
  const quiet = open();
  quiet.window.eval(script);
  assert.ok(
    [...quiet.window.document.querySelectorAll(".eh-say")].every((b) => b.hidden),
    "No speech, no dead buttons",
  );
  quiet.window.close();
}
console.log(
  `Extra Help PASS: ${manifest.total} lessons, ${toc.units.length} units, ${localLinks.length} existing local links, source fidelity and failure recovery.`,
);

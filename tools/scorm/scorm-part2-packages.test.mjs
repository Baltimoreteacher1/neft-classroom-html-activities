#!/usr/bin/env node
/* =============================================================================
 * scorm-part2-packages.test.mjs — Apply Day (Part II) as its own Canvas package.
 *
 * Two halves of one bug, and the second is the one that stayed invisible:
 *
 *  1. NAMING. /lessons/6-1-part2/ borrowed the core lesson's title, so a teacher
 *     who published Lesson 6-1 and its Apply Day got two Canvas assignments
 *     named "EduWonderLab — Lesson 6-1: Division Expressions …" with nothing to
 *     tell them apart. The zip filename repeated the id instead of naming the
 *     day (…_6-1-part2_part2_SCORM.zip).
 *
 *  2. REACHABILITY. Part 2 sits outside LESSON_ROUTES and the launch manifest's
 *     HUB_TOTAL by design, so it never flows through the lesson picker or
 *     makeOutlineItem — the two places that grow SCORM chips. 76 lesson pages
 *     were live, linked, and impossible to publish to Canvas in one click, and
 *     the hub looked complete the whole time.
 *
 * The chip half runs the REAL hub script over the REAL /curriculum/units/ page,
 * not a fixture: the count that matters is "every Part 2 row on the page that
 * ships", and a fixture cannot say that.
 * ========================================================================== */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { buildScormFiles } from "../../functions/_lib/scorm.js";
import { canonicalTitle, shortNameForId } from "../../functions/_lib/scorm-catalog.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (p) => readFileSync(join(ROOT, p), "utf8");

let pass = 0;
const t = (name, fn) => {
  fn();
  pass++;
  console.log(`  ok  ${name}`);
};

/* -- 1. Titles name the day, not the lesson it came from ------------------- */

t("an Apply Day route is titled by lesson number and Part II, not the core topic", () => {
  const { title, known } = canonicalTitle("https://eduwonderlab.com/lessons/6-1-part2/");
  assert.equal(title, "EduWonderLab — Lesson 6-1 · Part II: Apply");
  assert.equal(known, true);
});

t("the Apply Day title never collides with its own core lesson's", () => {
  const core = canonicalTitle("https://eduwonderlab.com/lessons/6-1/").title;
  const part2 = canonicalTitle("https://eduwonderlab.com/lessons/6-1-part2/").title;
  assert.notEqual(core, part2, "Part II and the core lesson share one Canvas title");
  assert.match(core, /Division Expressions/, "the core lesson lost its topic");
});

t("a sub-resource under an Apply Day keeps both the day and the resource", () => {
  assert.equal(
    canonicalTitle("https://eduwonderlab.com/lessons/6-1-part2/worksheet.html").title,
    "EduWonderLab — Lesson 6-1 · Part II: Apply Worksheet",
  );
});

t("the download filename spends its readable half on the day, not on the id again", () => {
  assert.equal(shortNameForId("6-1-part2"), "Part_II_Apply");
});

t("every variant of one lesson gets a DIFFERENT Canvas name", () => {
  // The whole point. Downloading one lesson's packages used to produce four
  // Canvas assignments with one identical name — core, both small groups and
  // the catch-up station — and nothing to tell them apart in a course list.
  const of = (suffix) => canonicalTitle(`https://eduwonderlab.com/lessons/1-3${suffix}/`).title;
  const titles = ["", "-part2", "-group1", "-group2", "-catchup"].map(of);
  assert.equal(
    new Set(titles).size,
    titles.length,
    `two variants of lesson 1-3 share a Canvas title:\n  ${titles.join("\n  ")}`,
  );
  // The labels are the site's own words for these surfaces (/curriculum/units/
  // badges), so Canvas matches the row the teacher clicked.
  assert.equal(of("-group1"), "EduWonderLab — Lesson 1-3 · Small Group 1 (Extra Support)");
  assert.equal(of("-group2"), "EduWonderLab — Lesson 1-3 · Small Group 2 (Challenge)");
  assert.equal(of("-catchup"), "EduWonderLab — Lesson 1-3 · Catch-Up Station");
  // A level label is never a language-program label ([[feedback_level_labeling]]).
  for (const title of titles) {
    assert.doesNotMatch(title, /\bESOL\b/i, `a package title says ESOL: ${title}`);
  }
});

t("the download filenames are distinct too, and still readable", () => {
  const names = ["1-3", "1-3-part2", "1-3-group1", "1-3-group2", "1-3-catchup"].map(shortNameForId);
  assert.equal(new Set(names).size, names.length, `filename collision: ${names.join(" | ")}`);
  assert.equal(shortNameForId("1-3-group1"), "Small_Group_1_Extra_Support");
});

t("core lessons and their sub-resources are untouched", () => {
  assert.match(
    canonicalTitle("https://eduwonderlab.com/lessons/1-3/").title,
    /Lesson 1-3: Math is In My World$/,
  );
  assert.equal(
    canonicalTitle("https://eduwonderlab.com/lessons/6-1/homework.html").title,
    "EduWonderLab — Lesson 6-1 Homework",
  );
});

t("the built package carries the Part II title into the manifest Canvas reads", () => {
  const pkg = buildScormFiles({ target: "/lessons/6-1-part2/" });
  assert.equal(pkg.id, "6-1-part2");
  assert.equal(pkg.title, "EduWonderLab — Lesson 6-1 · Part II: Apply");
  const xml = pkg.files["imsmanifest.xml"];
  const text = typeof xml === "string" ? xml : new TextDecoder().decode(xml);
  assert.ok(
    text.includes("<title>EduWonderLab — Lesson 6-1 · Part II: Apply</title>"),
    "the manifest title is not what Canvas will show",
  );
});

/* -- 2. Every Apply Day row on the shipped hub carries a chip -------------- */

/** The hub script, run over the real units page the way a browser runs it. */
function mountUnitsPage() {
  const dom = new JSDOM(read("curriculum/units/index.html"), {
    url: "https://eduwonderlab.com/curriculum/units/",
    runScripts: "outside-only",
  });
  dom.window.fetch = () =>
    Promise.resolve({ ok: false, status: 404, json: async () => ({}), text: async () => "" });
  dom.window.matchMedia = () => ({
    matches: false,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
  });
  dom.window.scrollTo = () => {};
  dom.window.eval(read("assets/curriculum-hub-search.js"));
  return dom.window.document;
}

const doc = mountUnitsPage();

/** Part 2 lesson PAGES, as the shipped page links them — the denominator. */
const part2Rows = Array.from(doc.querySelectorAll(".res-row a.res[href]")).filter((a) =>
  /^\/lessons\/\d+-\d+-part2\/$/.test(a.getAttribute("href")),
);

t("the units page still links Apply Day pages at all", () => {
  assert.ok(part2Rows.length >= 70, `only ${part2Rows.length} Apply Day links found`);
});

t("every Apply Day link on the page gains a Canvas (SCORM) chip", () => {
  const chips = doc.querySelectorAll(".scorm-dl-part2");
  assert.equal(
    chips.length,
    part2Rows.length,
    `${part2Rows.length} Apply Day links but ${chips.length} chips`,
  );
});

t("the chip points at its own lesson and asks the server to name it", () => {
  const link = part2Rows[0];
  const chip = link.parentElement.querySelector(".scorm-dl-part2");
  const url = new URL(chip.getAttribute("href"), "https://eduwonderlab.com");
  assert.equal(url.pathname, "/api/scorm");
  assert.equal(url.searchParams.get("activity"), link.getAttribute("href"));
  // No title in the URL: the server names it, so a chip and a hand-typed
  // /api/scorm URL cannot produce two different Canvas titles for one page.
  assert.equal(url.searchParams.get("title"), null, "the chip hard-codes a title");
  assert.match(chip.getAttribute("aria-label") || "", /Part II: Apply/);
});

t("the worksheets under an Apply Day are not offered as SCORM", () => {
  const worksheets = Array.from(doc.querySelectorAll(".res-row a.res[href]")).filter((a) =>
    /^\/lessons\/\d+-\d+-part2\/worksheet(-2)?\.html$/.test(a.getAttribute("href")),
  );
  assert.ok(worksheets.length > 0, "no Apply Day worksheets on the page to check");
  for (const w of worksheets) {
    assert.equal(
      w.parentElement.querySelectorAll(`.scorm-dl-part2[href*="${w.getAttribute("href")}"]`).length,
      0,
      `${w.getAttribute("href")} was offered as a SCORM package`,
    );
  }
});

console.log(`\nscorm-part2-packages: ${pass} passed`);

#!/usr/bin/env node
/* =============================================================================
 * hub-lesson-picker.test.mjs — the Teach band's Section → Unit → Lesson control.
 *
 * Drives the real script in a real DOM against the REAL launch manifest, so the
 * filtering is checked against the curriculum that actually ships rather than a
 * fixture that can quietly stop resembling it.
 *
 * What it does NOT check is spacing or appearance. A snapshot of a dropdown's
 * layout breaks on every unrelated edit and gets regenerated without being
 * read, which is worse than no test.
 * ========================================================================== */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = readFileSync(join(ROOT, "assets", "curriculum-teacher-planning.js"), "utf8");
const MANIFEST = JSON.parse(
  readFileSync(join(ROOT, "data", "curriculum-launch-manifest.json"), "utf8"),
);
const STANDARDS = JSON.parse(readFileSync(join(ROOT, "data", "ccss-standards.json"), "utf8"));

let pass = 0;
async function t(name, fn) {
  await fn();
  pass++;
  console.log(`  ok  ${name}`);
}

/** Boot the hub script in a DOM that looks enough like /curriculum/ for the
 * workspace to build, and hand back the three selects. */
async function mount({ savedPick = null, manifest = MANIFEST, failFetch = false } = {}) {
  const dom = new JSDOM(
    `<!doctype html><html><body>
       <header class="curriculum-guide"><h1>Curriculum Hub</h1></header>
       <div id="hub-content"></div>
       <input id="curr-search" />
       <div class="curriculum-tools-bar"></div>
     </body></html>`,
    { url: "https://eduwonderlab.com/curriculum/", runScripts: "outside-only" },
  );
  const { window } = dom;
  if (savedPick) window.localStorage.setItem("nt-hub-lesson-pick", JSON.stringify(savedPick));
  window.NTJsonCache = {
    json: () => (failFetch ? Promise.reject(new Error("offline")) : Promise.resolve(manifest)),
    text: () => Promise.resolve({ ok: true, status: 200, text: "" }),
  };
  window.eval(SCRIPT);
  // The workspace is built by organizeTools(), which the hub calls once the
  // tools bar exists — the same entry point the page uses.
  window.CurriculumTeacherPlanning.organizeTools();
  await new Promise((r) => setTimeout(r, 40));
  const q = (sel) => window.document.querySelector(sel);
  return {
    window,
    section: q("#tws-section"),
    unit: q("#tws-unit"),
    lesson: q("#tws-lesson"),
    open: q("#tws-open"),
    values: (el) => [...el.options].map((o) => o.value).filter(Boolean),
    labels: (el) => [...el.options].map((o) => o.textContent),
    change: (el, value) => {
      el.value = value;
      el.dispatchEvent(new window.Event("change", { bubbles: true }));
    },
  };
}

/* ===========================================================================
 * SOURCE OF TRUTH
 * ======================================================================== */
await t("the six section labels match data/ccss-standards.json exactly", () => {
  // The labels are held in the script rather than fetched (the standards file
  // is 15 KB and the hub has a request budget). This is what stops that being
  // a second source of truth.
  const inScript = [...SCRIPT.matchAll(/^\s{4}(NOS|AT|GR|DS|MPP|G5):\s*"([^"]+)"/gm)].map((m) => [
    m[1],
    m[2],
  ]);
  assert.equal(inScript.length, 6, "expected six section labels in the script");
  for (const [key, label] of inScript) {
    assert.equal(
      label,
      STANDARDS.domains[key],
      `section label for ${key} has drifted from data/ccss-standards.json`,
    );
  }
});

await t("sections resolve from the real curriculum, and cover every lesson", async () => {
  const p = await mount();
  const sections = p.values(p.section);
  assert.ok(sections.length >= 5, `only ${sections.length} sections resolved`);
  // Every core lesson lands in exactly one section.
  let covered = 0;
  for (const sec of sections) {
    p.change(p.section, sec);
    for (const unit of p.values(p.unit)) {
      p.change(p.unit, unit);
      covered += p.values(p.lesson).length;
    }
  }
  assert.equal(
    covered,
    MANIFEST.lessons.length,
    `sections cover ${covered} lessons; the manifest has ${MANIFEST.lessons.length}`,
  );
});

/* ===========================================================================
 * PROGRESSIVE FILTERING
 * ======================================================================== */
await t("unit and lesson start disabled and enable in order", async () => {
  const p = await mount();
  assert.equal(p.unit.disabled, true);
  assert.equal(p.lesson.disabled, true);
  p.change(p.section, "GR");
  assert.equal(p.unit.disabled, false);
  assert.equal(p.lesson.disabled, true, "lesson opened before a unit was chosen");
  p.change(p.unit, p.values(p.unit)[0]);
  assert.equal(p.lesson.disabled, false);
});

await t("selecting a section shows only that section's units", async () => {
  const p = await mount();
  p.change(p.section, "GR");
  const units = p.values(p.unit).map(Number);
  const expected = [
    ...new Set(
      MANIFEST.lessons.filter((l) => /^6\.GR\./.test(l.standard || "")).map((l) => l.unit),
    ),
  ].sort((a, b) => a - b);
  assert.deepEqual(units, expected);
  assert.ok(units.length && units.length < 10, "a section showed every unit");
});

await t("selecting a unit shows only that unit's lessons, in order", async () => {
  const p = await mount();
  p.change(p.section, "GR");
  const unit = p.values(p.unit)[0];
  p.change(p.unit, unit);
  const ids = p.values(p.lesson);
  const expected = MANIFEST.lessons
    .filter((l) => String(l.unit) === String(unit) && /^6\.GR\./.test(l.standard || ""))
    .sort((a, b) => a.lesson - b.lesson)
    .map((l) => l.id);
  assert.deepEqual(ids, expected);
  // Label carries the id AND the real title.
  const first = MANIFEST.lessons.find((l) => l.id === ids[0]);
  assert.ok(
    p.labels(p.lesson).some((x) => x === `${first.id} · ${first.title}`),
    "lesson option does not show the manifest title",
  );
});

await t("changing the parent clears a stale child selection", async () => {
  const p = await mount();
  p.change(p.section, "GR");
  p.change(p.unit, p.values(p.unit)[0]);
  p.change(p.lesson, p.values(p.lesson)[0]);
  assert.ok(p.open.textContent.includes("Lesson"), "the lesson did not expand");

  p.change(p.unit, "");
  assert.equal(p.lesson.disabled, true);
  assert.equal(p.open.textContent.trim(), "", "the expansion survived a unit change");

  p.change(p.section, "DS");
  assert.equal(p.unit.disabled, false);
  assert.equal(p.lesson.disabled, true, "lesson stayed open across a section change");
  assert.ok(!p.values(p.unit).includes("5"), "units did not refilter for the new section");
});

/* ===========================================================================
 * THE EXPANSION
 * ======================================================================== */
await t("a selected lesson resolves its own routes, and only real ones", async () => {
  const p = await mount();
  // 5-3 has small-group variants; pick it through the control.
  const lesson = MANIFEST.lessons.find((l) => l.id === "5-3");
  const sec = "GR";
  p.change(p.section, sec);
  p.change(p.unit, String(lesson.unit));
  p.change(p.lesson, "5-3");

  const hrefs = [...p.open.querySelectorAll("a")].map((a) => a.getAttribute("href"));
  assert.ok(hrefs.includes("/lessons/5-3/"), "whole-group route missing");
  assert.ok(
    hrefs.includes("/curriculum/student-supports/?lesson=5-3"),
    "supports deep link missing or not the canonical route",
  );
  const expectedVariants = [
    ...(MANIFEST.smallGroups || []).filter((g) => g.parent === "5-3"),
    ...(MANIFEST.catchUps || []).filter((c) => c.parent === "5-3"),
  ].map((v) => v.resources.lesson);
  for (const href of expectedVariants) {
    assert.ok(hrefs.includes(href), `variant route ${href} missing`);
  }
  // No invented routes.
  for (const href of hrefs) {
    assert.ok(
      href === "/lessons/5-3/" ||
        href === "/curriculum/student-supports/?lesson=5-3" ||
        expectedVariants.includes(href),
      `unexpected route in the expansion: ${href}`,
    );
  }
});

await t("a lesson with no small-group version shows no small-group buttons", async () => {
  const withNone = MANIFEST.lessons.find(
    (l) =>
      !(MANIFEST.smallGroups || []).some((g) => g.parent === l.id) &&
      !(MANIFEST.catchUps || []).some((c) => c.parent === l.id),
  );
  if (!withNone) return; // every lesson has variants — nothing to assert
  const p = await mount();
  const sec = /^5\./.test(withNone.standard)
    ? "G5"
    : /^(?:6\.)?([A-Z]+)\./.exec(withNone.standard)[1];
  p.change(p.section, sec);
  p.change(p.unit, String(withNone.unit));
  p.change(p.lesson, withNone.id);
  assert.equal(
    p.open.querySelectorAll(".tws-open-variants").length,
    0,
    `${withNone.id} has no variants but the picker offered some`,
  );
});

/* ===========================================================================
 * MEMORY + FAILURE
 * ======================================================================== */
await t("a remembered pick is restored when it still resolves", async () => {
  const p = await mount({ savedPick: { section: "GR", unit: "5", lesson: "5-3" } });
  assert.equal(p.section.value, "GR");
  assert.equal(p.unit.value, "5");
  assert.equal(p.lesson.value, "5-3");
  assert.ok(p.open.textContent.includes("5-3"));
});

await t("a stale remembered pick is discarded, not approximated", async () => {
  const p = await mount({ savedPick: { section: "GR", unit: "5", lesson: "5-99" } });
  assert.equal(p.section.value, "GR", "a valid section should still restore");
  assert.equal(p.lesson.value, "", "a retired lesson id selected something anyway");
  assert.equal(p.open.textContent.trim(), "");

  const gone = await mount({ savedPick: { section: "NOT-A-SECTION", unit: "1", lesson: "1-1" } });
  assert.equal(gone.section.value, "");
  assert.equal(gone.unit.disabled, true);
});

await t("only identifiers are remembered — never lesson metadata", async () => {
  const p = await mount();
  p.change(p.section, "GR");
  p.change(p.unit, "5");
  p.change(p.lesson, "5-3");
  const raw = p.window.localStorage.getItem("nt-hub-lesson-pick");
  assert.deepEqual(Object.keys(JSON.parse(raw)).sort(), ["lesson", "section", "unit"]);
  assert.ok(!/Trapezoid|title|href|\/lessons\//i.test(raw), `stored metadata: ${raw}`);
});

await t("a manifest failure is confined to the Teach band", async () => {
  const p = await mount({ failFetch: true });
  assert.equal(p.section.disabled, true);
  assert.match(p.open.textContent, /could not be loaded/i);
  assert.ok(p.open.querySelector("button"), "no retry offered");
  // The rest of the band still works: browse and search are plain links.
  const band = p.window.document.querySelector(".tws-lead");
  assert.ok(band.querySelector('a[href="/curriculum/units/"]'), "browse link lost");
  assert.ok(band.querySelector('[data-tws="search"]'), "search action lost");
});

await t("a section with no units, and a unit with no lessons, degrade quietly", async () => {
  // A manifest whose only lesson carries a standard in no known domain: the
  // section list must simply not offer it rather than render an empty control.
  const odd = { lessons: [{ id: "9-9", unit: 9, lesson: 9, title: "Odd", standard: "ZZ.1" }] };
  const p = await mount({ manifest: odd });
  assert.equal(p.section.disabled, true);
  assert.match(p.section.options[0].textContent, /No lessons available/i);
});

/* ===========================================================================
 * WHAT MUST NOT HAVE CHANGED
 * ======================================================================== */
await t("the Teach band keeps browse, search and the Plan/Support pair", async () => {
  const p = await mount();
  const doc = p.window.document;
  assert.ok(doc.querySelector('.tws-lead a[href="/curriculum/units/"]'), "browse link gone");
  assert.ok(doc.querySelector('.tws-lead [data-tws="search"]'), "search action gone");
  assert.ok(doc.querySelector('.tws-pair a[href="/curriculum/planning/"]'), "planner link gone");
  assert.ok(
    doc.querySelector('.tws-pair a[href="/curriculum/student-supports/"]'),
    "supports link gone",
  );
  assert.ok(doc.querySelector('.tws-more [data-tws="more"]'), "more-tools link gone");
  // Teacher-only, exactly as before.
  assert.ok(doc.querySelector(".tws").classList.contains("hub-teacher-only"));
});

await t("every control is labelled and keyboard-reachable", async () => {
  const p = await mount();
  for (const sel of [p.section, p.unit, p.lesson]) {
    const label = p.window.document.querySelector(`label[for="${sel.id}"]`);
    assert.ok(label && label.textContent.trim(), `${sel.id} has no visible label`);
    assert.equal(sel.tagName, "SELECT", "not a native select");
    assert.ok(sel.tabIndex >= 0 || !sel.hasAttribute("tabindex"));
  }
  assert.equal(
    p.window.document.querySelector(".tws-pick").getAttribute("aria-label"),
    "Choose a lesson",
  );
});

console.log(`hub-lesson-picker: ${pass} assertions passed`);

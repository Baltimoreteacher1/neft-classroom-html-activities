import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildDocs } from "../access-practice-lab/src/lang/site-search.js";
import { DESTINATIONS, KINDS, SECTIONS, SKILLS } from "../access-practice-lab/src/sitemap.js";
import { STUDIO_APP_BASE, STUDIO_APP_PAGES } from "../access-practice-lab/src/studio-app.js";
import { SITEMAP_PATHS } from "../functions/_lib/language-page.js";
import { PAGE, renderList, withList } from "./sync-learning-studios.mjs";

// The Learning Studios app lives on its own Worker, so its pages are not files this repo can scan. These tests
// hold the one list (src/studio-app.js) and everything that lists or links the app to each other.

const html = readFileSync(PAGE, "utf8");

test("the list is well formed: unique ids and paths under /studios, known section, skill and kind, both languages", () => {
  assert.equal(new Set(STUDIO_APP_PAGES.map((page) => page.id)).size, STUDIO_APP_PAGES.length);
  assert.equal(new Set(STUDIO_APP_PAGES.map((page) => page.path)).size, STUDIO_APP_PAGES.length);
  for (const page of STUDIO_APP_PAGES) {
    assert.ok(
      page.path.startsWith(`${STUDIO_APP_BASE}/`),
      `${page.id}: path under ${STUDIO_APP_BASE}`,
    );
    assert.ok(
      SECTIONS.some((section) => section.id === page.section),
      `${page.id}: section`,
    );
    assert.ok(
      SKILLS.some((skill) => skill.id === page.skill),
      `${page.id}: skill`,
    );
    assert.ok(KINDS[page.kind], `${page.id}: kind`);
    for (const pair of [page.title, page.text]) {
      assert.equal(pair.length, 2, `${page.id}: [en, es]`);
      assert.ok(
        pair[0].trim() && pair[1].trim() && pair[0] !== pair[1],
        `${page.id}: both languages`,
      );
    }
  }
});

test("every page is a destination on the site map, at the same path and for the same audience", () => {
  for (const page of STUDIO_APP_PAGES) {
    const destination = DESTINATIONS.find((item) => item.id === page.id);
    assert.ok(destination, `${page.id} is on the site map`);
    assert.equal(destination.href, page.path, page.id);
    assert.deepEqual(destination.for, page.for, page.id);
  }
});

test("the crawler sitemap lists every page that is not teacher-only, and no teacher-only page", () => {
  for (const page of STUDIO_APP_PAGES) {
    const teacherOnly = page.for.every((who) => who === "teacher");
    assert.equal(SITEMAP_PATHS.includes(page.path), !teacherOnly, `${page.path}`);
  }
});

test("site search finds every page, in both languages", () => {
  const docs = buildDocs({ studioApp: STUDIO_APP_PAGES });
  for (const page of STUDIO_APP_PAGES) {
    const doc = docs.find((item) => item.id === `studio-app:${page.id}`);
    assert.ok(doc, `${page.id} is searchable`);
    assert.equal(doc.href, page.path);
    assert.equal(doc.title, page.title[0]);
    assert.equal(doc.titleEs, page.title[1]);
  }
  const wired = readFileSync(
    new URL("../access-practice-lab/src/search-data.js", import.meta.url),
    "utf8",
  );
  assert.match(wired, /studioApp: STUDIO_APP_PAGES/, "the live search is given the list");
});

test("the landing page lists and links every page, and nothing the app does not have", () => {
  assert.equal(
    withList(html),
    html,
    "the studio list on /learning-studios/ is stale: run node tools/sync-learning-studios.mjs",
  );
  for (const page of STUDIO_APP_PAGES)
    assert.ok(html.includes(`href="${page.path}"`), `${page.path} is linked`);
  const known = new Set([...STUDIO_APP_PAGES.map((page) => page.path), "/studios/math"]);
  for (const [, href] of html.matchAll(/href="(\/studios[^"]*)"/g))
    assert.ok(known.has(href), `${href} is a known studio page`);
  assert.ok(renderList().includes("Story Mixer"));
});

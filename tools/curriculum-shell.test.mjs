import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { readingSupportPages, shellPages, withCurriculumShell } from "./lib/curriculum-shell.mjs";
import { loadCurriculumManifest, REPO_ROOT } from "./lib/curriculum-source.mjs";

for (const [file, active] of shellPages) {
  const html = readFileSync(`${REPO_ROOT}/${file}`, "utf8");
  assert.equal(
    withCurriculumShell(html, active, { readingSupports: readingSupportPages.has(file) }),
    html,
    `${file}: shared shell is deterministic`,
  );
  const doc = new JSDOM(html).window.document;
  assert.equal(doc.querySelectorAll("nav.ewl-course-nav").length, 1);
  assert.equal(doc.querySelectorAll(".ewl-course-links > li > a").length, 8);
  const links = [...doc.querySelectorAll(".ewl-course-links > li > a")];
  // The phone "More" disclosure repeats the overflow destinations, in order,
  // with the same targets — it may not drift from the primary list.
  const more = [...doc.querySelectorAll(".ewl-course-more > ul > li > a")];
  assert.ok(doc.querySelector(".ewl-course-more > summary"), `${file}: More menu has a summary`);
  assert.deepEqual(
    more.map((a) => a.getAttribute("href")),
    links.slice(links.length - more.length).map((a) => a.getAttribute("href")),
    `${file}: More menu mirrors the overflow destinations`,
  );
  assert.ok(more.length >= 4, `${file}: More menu carries the overflow destinations`);
  const labels = links.map((a) => a.textContent.trim());
  const helpIndex = labels.indexOf("Extra Help");
  const fluencyIndex = labels.indexOf("Fluency");
  assert.ok(helpIndex !== -1, `${file}: Extra Help navigation link exists`);
  assert.ok(fluencyIndex !== -1, `${file}: Fluency navigation link exists`);
  assert.equal(fluencyIndex, helpIndex + 1, `${file}: Fluency button is adjacent to Extra Help`);
  const fluencyLink = doc.querySelector('.ewl-course-nav a[href="/curriculum/fluency/"]');
  assert.ok(fluencyLink, `${file}: Fluency button points to /curriculum/fluency/`);
  assert.equal(
    doc.querySelectorAll('.ewl-course-links [aria-current="page"]').length,
    active ? 1 : 0,
  );
  if (active === "fluency") {
    assert.equal(
      fluencyLink.getAttribute("aria-current"),
      "page",
      `${file}: Fluency marked active`,
    );
  }
  assert.ok(doc.querySelector("main[id]"), `${file}: skip target exists`);
  assert.equal(
    doc.querySelectorAll("#udlFloatingLauncher").length,
    readingSupportPages.has(file) ? 1 : 0,
    `${file}: reading supports live in the bar only where the page provides them`,
  );
}
const manifest = loadCurriculumManifest();
const sequence = JSON.parse(readFileSync(`${REPO_ROOT}/assets/curriculum-lesson-sequence.json`));
assert.deepEqual(
  sequence,
  manifest.lessons.map(({ id, unit, title }) => ({ id, unit, title })),
);
const home = new JSDOM(readFileSync(`${REPO_ROOT}/curriculum/index.html`, "utf8")).window.document;
assert.equal(home.querySelectorAll(".course-unit-list li").length, manifest.units.length);
const lessonTotal = [...home.querySelectorAll(".course-unit-count")].reduce(
  (sum, el) => sum + parseInt(el.textContent),
  0,
);
assert.equal(lessonTotal, manifest.lessons.length);
// Everything the sync tool writes (shell, course overview in teaching order,
// lesson sequence, hub pacing days) must match a fresh run.
const fresh = spawnSync(process.execPath, ["tools/sync-curriculum-shell.mjs", "--check"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert.equal(fresh.status, 0, `sync-curriculum-shell --check: ${fresh.stderr}`);
const order = [...home.querySelectorAll(".course-unit-list > li")].map((li) => li.dataset.unit);
assert.equal(order.at(-1), "10", "a unit not scheduled this year is listed last");
assert.notDeepEqual(
  order,
  [...order].sort((a, b) => a - b),
  "units follow teaching order, not number",
);
console.log(
  "Curriculum shell: shared navigation, skip targets, idempotency, course counts, and all lesson sequence entries PASS.",
);

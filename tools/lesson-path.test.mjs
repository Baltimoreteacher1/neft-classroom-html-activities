// Lesson Path pages (/math/lesson-path/<id>/): one page per Unit 2-9 core lesson that organizes four activities,
// merges the practice choices into three levels, and only links to files that exist.
//   node tools/lesson-path.test.mjs
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { JSDOM } from "jsdom";
import { outputs, studioLessonIds } from "../scripts/generate-lesson-paths.mjs";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";

const files = outputs();
const units = readFileSync(join(REPO_ROOT, "curriculum/units/index.html"), "utf8");
const ids = studioLessonIds();
assert.equal(
  ids.length,
  72,
  "all 72 Units 2-9 core lessons have a Practice Studio (67 generated + 5 hand-built in Unit 4)",
);
assert.equal(files.size, 72, "one path page per studio lesson");
let links = 0;
for (const [rel, html] of files) {
  const id = rel.split("/")[2];
  assert.ok(
    Number(id.split("-")[0]) >= 2 && Number(id.split("-")[0]) <= 9,
    `${id}: Units 2-9 only`,
  );
  const disk = existsSync(join(REPO_ROOT, rel)) ? readFileSync(join(REPO_ROOT, rel), "utf8") : null;
  assert.ok(disk === html, `${rel} is stale; run: node scripts/generate-lesson-paths.mjs`);
  assert.ok(
    units.includes(`href="/math/lesson-path/${id}/"`),
    `${id}: the lessons page links to its path`,
  );
  const doc = new JSDOM(html).window.document;
  assert.equal(doc.querySelectorAll("h1").length, 1, `${id}: one h1`);
  assert.equal(doc.querySelectorAll(".lp-step").length, 4, `${id}: four activities`);
  assert.equal(doc.querySelectorAll('.lp-levels [role="tab"]').length, 3, `${id}: three levels`);
  for (const lvl of ["support", "core", "challenge"]) {
    const panel = doc.getElementById(`lp-level-${lvl}`);
    assert.ok(panel?.querySelector("a.lp-primary"), `${id}: ${lvl} has a primary action`);
  }
  assert.ok(
    doc.querySelector('a[href="/lessons/' + id + '/?student=1"]'),
    `${id}: the interactive lesson is linked`,
  );
  for (const a of doc.querySelectorAll(".lp-page a[href]")) {
    const href = a.getAttribute("href");
    if (/^\/curriculum\/(math-canvas|reality-lab)\//.test(href)) continue; // pages built by the same release; checked by their own tests
    const p = href.split(/[?#]/)[0].replace(/^\//, "");
    assert.ok(
      existsSync(join(REPO_ROOT, p)) &&
        (!p.endsWith("/") || existsSync(join(REPO_ROOT, p, "index.html"))),
      `${id}: dead link ${href}`,
    );
    links++;
  }
  assert.ok(
    !/timer|countdown/i.test(doc.querySelector(".lp-page").textContent),
    `${id}: no timer language`,
  );
}
console.log(`lesson-path: ${files.size} pages current, ${links} links resolve on disk.`);

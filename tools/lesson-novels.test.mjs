// Each lesson's Axiom City graphic novel is linked from that lesson's own row in /curriculum/units/.
//
// Source of truth is `graphicNovel` in lessons/<id>/config.json; tools/sync-lesson-novels.mjs splices the links in. The
// risks are a stale page after a config edit, a link spliced into a NEIGHBOURING lesson's row (a lesson id that is a prefix
// of another, or a mis-anchored regex), a link to an episode file that is not there, and a splice that is not idempotent.
// This re-reads each source independently of the generator's own output.

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CORE_ID_RE,
  listLessonDirs,
  loadLessonConfig,
  REPO_ROOT,
} from "./lib/curriculum-source.mjs";
import { lessonNovels, spliceNovels } from "./sync-lesson-novels.mjs";

const page = readFileSync(join(REPO_ROOT, "curriculum/units/index.html"), "utf8");

assert.ok(
  spliceNovels(page) === page,
  "curriculum/units/index.html is stale: run node tools/sync-lesson-novels.mjs",
);
assert.ok(spliceNovels(spliceNovels(page)) === page, "splice is not idempotent");

const declared = listLessonDirs({ filter: CORE_ID_RE }).filter(
  (id) => loadLessonConfig(id).graphicNovel,
);
assert.ok(
  declared.length >= 60,
  `expected at least 60 lessons with a graphic novel, found ${declared.length}`,
);
assert.deepEqual(
  lessonNovels().map((n) => n.id),
  declared,
  "the generator must cover exactly the lessons that declare a novel",
);

/** The text of one lesson row: from its data-search attribute to the next lesson row. */
function row(id) {
  const start = page.indexOf(`data-search="${id} `);
  assert.ok(start >= 0, `no hub row for lesson ${id}`);
  const next = page.indexOf('data-search="', start + 1);
  return page.slice(start, next < 0 ? undefined : next);
}

const markers = [...page.matchAll(/<!-- lesson-novel:([\w-]+) -->/g)].map((m) => m[1]);
assert.deepEqual(
  markers.sort(),
  [...declared].sort(),
  "one link per declaring lesson, none elsewhere",
);

for (const id of declared) {
  const { href, menuTitle } = loadLessonConfig(id).graphicNovel;
  assert.ok(existsSync(join(REPO_ROOT, href.replace(/^\//, ""))), `${id}: ${href} is not on disk`);
  const text = row(id);
  assert.equal(
    text.split(`<!-- lesson-novel:${id} -->`).length - 1,
    1,
    `${id}: novel link must be in its own row once`,
  );
  assert.ok(text.includes(`href="${href}"`), `${id}: row must link ${href}`);
  assert.ok(text.includes(menuTitle.replace(/&/g, "&amp;")), `${id}: row must name "${menuTitle}"`);
  assert.ok(
    text.includes(`href="/lessons/${id}/"`),
    `${id}: row must keep its Interactive Lesson link`,
  );
}

// Negative control: a hub row with no Interactive Lesson link must fail loudly, not be skipped.
assert.throws(
  () => spliceNovels("<div></div>", [{ id: "9-9", href: "/x.html", title: "X" }]),
  /No "Interactive Lesson" link for lesson 9-9/,
);

console.log(`lesson novels: ${declared.length} lessons linked from their own hub rows`);

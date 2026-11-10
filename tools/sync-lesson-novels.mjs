#!/usr/bin/env node
/**
 * Put each lesson's Axiom City graphic novel on that lesson's row in /curriculum/units/.
 *
 * Source of truth: `graphicNovel` in lessons/<id>/config.json ({ href, title, menuTitle, standard, desc }).
 * Output: one `<!-- lesson-novel:<id> -->` link spliced in front of the lesson's "Interactive Lesson" link, the same
 * slot the hand-written Unit 2 "Lesson Novel" links use. Nothing is composed here and the student lesson page is
 * untouched (graphic novels stay out of the student view; Joel assigns them from the hub).
 *
 *   node tools/sync-lesson-novels.mjs          write curriculum/units/index.html
 *   node tools/sync-lesson-novels.mjs --check  exit 1 if the page is stale, or an episode file or hub row is missing
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  CORE_ID_RE,
  listLessonDirs,
  loadLessonConfig,
  REPO_ROOT,
} from "./lib/curriculum-source.mjs";

const UNITS_PAGE = join(REPO_ROOT, "curriculum/units/index.html");
const SLOT_INDENT = " ".repeat(16);
const MARKER = new RegExp(
  `<!-- lesson-novel:[\\w-]+ -->[\\s\\S]*?<!-- /lesson-novel -->\\n${SLOT_INDENT}`,
  "g",
);
const esc = (/** @type {string} */ s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** @returns {{id: string, href: string, title: string}[]} one entry per core lesson that declares a novel */
export function lessonNovels() {
  const out = [];
  for (const id of listLessonDirs({ filter: CORE_ID_RE })) {
    const gn = loadLessonConfig(id).graphicNovel;
    if (!gn) continue;
    for (const key of ["href", "title", "menuTitle"])
      if (!gn[key]) throw new Error(`lessons/${id}/config.json graphicNovel.${key} is required`);
    if (!existsSync(join(REPO_ROOT, gn.href.replace(/^\//, ""))))
      throw new Error(`lessons/${id}: graphicNovel.href points at a missing file: ${gn.href}`);
    out.push({ id, href: gn.href, title: gn.menuTitle });
  }
  return out;
}

const link = (/** @type {{id: string, href: string, title: string}} */ n) =>
  `<!-- lesson-novel:${n.id} --><a class="res" href="${n.href}">📖 Graphic Novel: ${esc(n.title)} <span class="res-sub">Axiom City</span></a><!-- /lesson-novel -->\n${SLOT_INDENT}`;

export function spliceNovels(/** @type {string} */ html, novels = lessonNovels()) {
  let out = html.replace(MARKER, "");
  for (const n of novels) {
    const anchor = new RegExp(`(<a\\b[^>]*href="/lessons/${n.id}/"[^>]*>\\s*Interactive Lesson)`);
    if (!anchor.test(out))
      throw new Error(`No "Interactive Lesson" link for lesson ${n.id} in the hub`);
    out = out.replace(anchor, (m) => `${link(n)}${m}`);
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const current = readFileSync(UNITS_PAGE, "utf8");
  const next = spliceNovels(current);
  const count = lessonNovels().length;
  if (process.argv.includes("--check")) {
    if (next !== current) {
      console.error(
        "curriculum/units/index.html is stale: run `node tools/sync-lesson-novels.mjs`",
      );
      process.exit(1);
    }
    console.log(`lesson novel links current (${count} lessons)`);
  } else {
    writeFileSync(UNITS_PAGE, next);
    console.log(`Wrote ${count} lesson novel links into curriculum/units/index.html`);
  }
}

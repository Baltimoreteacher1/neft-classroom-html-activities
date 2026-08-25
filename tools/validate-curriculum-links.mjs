#!/usr/bin/env node
/**
 * Curriculum link-mapping gate — catches links that resolve but point at the
 * WRONG content (the class of drift audit:links can't see: a game filed under
 * the wrong unit, a lesson listed in the wrong unit block, a search-index doc
 * that no longer joins to the manifest).
 *
 * Invariants:
 *  1. Every /lessons/<id>/ link inside a hub unit block belongs to that unit
 *     per data/curriculum-manifest.json.
 *  2. Every manifest arcade path linked on the hub sits inside its own unit's
 *     block, and the file exists on disk.
 *  3. Every manifest lesson with status !== "hidden" appears somewhere on the
 *     hub, and its lessonPath exists on disk.
 *  4. The search index's declared documentCount matches the manifest's
 *     non-hidden lesson count within tolerance (bonus docs may add, never drop).
 *
 * Run: npm run validate:curriculum-links
 * Wired into `npm run validate`, so a hub unit-block that points at the wrong
 * lesson fails the pre-push gate rather than waiting for a teacher to notice.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(resolve(ROOT, rel), "utf8");
const readJson = (rel) => JSON.parse(read(rel));

const failures = [];
const check = (ok, msg) => {
  if (!ok) failures.push(msg);
};

/* The unit blocks this gate carves up moved to their own page when the hub
   stopped hosting the units browser; the check itself is unchanged, it just
   reads them where they now live. */
const hub = read("curriculum/units/index.html");
const manifest = readJson("data/curriculum-manifest.json");

// --- carve the hub into unit blocks, keyed by the "Unit N" label inside each ---
const blocks = [];
{
  const starts = [];
  const re = /<details class="unit"[^>]*>/g;
  let m;
  while ((m = re.exec(hub))) starts.push(m.index);
  for (let i = 0; i < starts.length; i++) {
    const body = hub.slice(starts[i], starts[i + 1] ?? hub.length);
    const num = body.match(/class="unit-num">\s*Unit\s+(\d+)/);
    check(!!num, `unit block #${i + 1} has no "Unit N" label`);
    if (num) blocks.push({ unit: Number(num[1]), body });
  }
  check(blocks.length >= 10, `expected >=10 unit blocks, found ${blocks.length}`);
}

const unitOfHubLesson = new Map(); // lesson id -> hub unit number
for (const { unit, body } of blocks) {
  for (const m of body.matchAll(/href="\/lessons\/([a-z0-9-]+)\/"/gi)) {
    unitOfHubLesson.set(m[1].toLowerCase(), unit);
  }
}

const lessons = manifest.lessons || [];
const lessonById = new Map(lessons.map((l) => [String(l.id).toLowerCase(), l]));

// 1. hub lesson links belong to the unit block they sit in
for (const [id, hubUnit] of unitOfHubLesson) {
  // group/variant slugs like 1-2-group1 map to their base lesson
  const base = lessonById.get(id) || lessonById.get(id.replace(/-group\d+$/, ""));
  if (!base) continue; // audit:links already guarantees the file exists
  check(
    base.unit === hubUnit,
    `hub lists lesson ${id} under Unit ${hubUnit}, manifest says Unit ${base.unit}`,
  );
}

// 2. arcade paths: right unit block + file on disk
for (const l of lessons) {
  const p = l.arcade?.path;
  if (!p) continue;
  check(
    existsSync(resolve(ROOT, p.replace(/^\//, ""))),
    `arcade file missing: ${p} (lesson ${l.id})`,
  );
  const home = blocks.find((b) => b.body.includes(`href="${p}"`));
  if (home) {
    check(
      home.unit === l.unit,
      `arcade ${p} (lesson ${l.id}, Unit ${l.unit}) is linked under Unit ${home.unit}`,
    );
  }
}

// 3. every visible manifest lesson is on the hub and exists on disk
for (const l of lessons) {
  if (l.status === "hidden") continue;
  const id = String(l.id).toLowerCase();
  check(unitOfHubLesson.has(id), `manifest lesson ${l.id} (Unit ${l.unit}) has no hub link`);
  const rel = String(l.lessonPath || `/lessons/${l.id}/`).replace(/^\//, "");
  check(
    existsSync(resolve(ROOT, rel, "index.html")) || existsSync(resolve(ROOT, rel)),
    `lessonPath missing on disk: ${l.lessonPath} (lesson ${l.id})`,
  );
}

// 3b. hub whole-group row labels still name the manifest title and standard
{
  const heads = [
    ...hub.matchAll(
      /Lesson (\d+-\d+)\s*·\s*([\s\S]*?)<span class="badge badge-std">\s*([^<]+?)\s*<\/span>/g,
    ),
  ];
  check(heads.length >= 80, `expected ~84 whole-group hub labels, found ${heads.length}`);
  for (const m of heads) {
    const id = m[1];
    const title = m[2].replace(/\s+/g, " ").trim();
    const standard = m[3].trim();
    const lesson = lessonById.get(id);
    if (!lesson) {
      check(false, `hub labels Lesson ${id} but it is not in the manifest`);
      continue;
    }
    check(
      title === lesson.title,
      `hub labels Lesson ${id} as "${title}", manifest title is "${lesson.title}"`,
    );
    check(
      standard === lesson.standard,
      `hub labels Lesson ${id} as ${standard}, manifest standard is ${lesson.standard}`,
    );
  }
}

// 4. search index joins to manifest (ID-join drift guard)
{
  const idx = readJson("data/curriculum-search-index.json");
  const visible = lessons.filter((l) => l.status !== "hidden").length;
  check(
    typeof idx.documentCount === "number" && idx.documentCount >= visible,
    `search index documentCount ${idx.documentCount} < visible manifest lessons ${visible} — regenerate index`,
  );
}

if (failures.length) {
  console.error(`✗ curriculum-links: ${failures.length} problem(s)`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(
  `✓ curriculum-links: ${unitOfHubLesson.size} hub lesson links, ${lessons.length} manifest lessons, ${blocks.length} unit blocks — mapping consistent`,
);

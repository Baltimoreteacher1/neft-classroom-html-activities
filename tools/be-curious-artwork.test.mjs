#!/usr/bin/env node
/**
 * Every core lesson's Be Curious slide must actually show its own artwork.
 *
 * Three gaps shipped silently before 2026-08-11, and none of them broke a
 * build, a lint, or a page load:
 *
 *   1. `noticeAndWonder.image` was never read by the slide generator. 64
 *      lessons authored artwork, every reference resolved on disk, and not one
 *      picture reached a slide — the Be Curious slide only ever drew the
 *      generic grid SVG from `launch.visual`.
 *   2. Two schemas exist for the notice/wonder stems. Only `launch.*Prompts`
 *      was read, so the 18 lessons authored as `noticeAndWonder.*Starters`
 *      (all of Unit 1, all of Unit 10, 4-3, 7-7, 9-1..9-4) rendered a Be
 *      Curious slide with no stems at all.
 *   3. 64 images had no alt text and fell back to a generic string, which
 *      tells a screen-reader user nothing about the one routine that is
 *      entirely about looking at a picture.
 *
 * A per-file check cannot see any of this: each config was individually valid
 * and each slides.html was individually well-formed. Only the JOIN between
 * them shows the gap, which is what this test asserts.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const lessonsDir = resolve(root, "lessons");

/** Core lessons only — group / catch-up variants cite their parent's assets. */
const isCore = (slug) => /^\d+-\d+$/.test(slug);

/**
 * Rendered text of a page, for comparing against config strings.
 *
 * Order matters and is the whole point: strip tags FIRST, then unescape. The
 * reverse turns `x + 5 &lt; 11</p>` into `x + 5 < 11</p>` and swallows the rest
 * of the sentence as a fake tag, which invents content bugs that do not exist.
 * Entities also mean a raw substring match fails on any apostrophe, since
 * `'at least 18'` is written `&#039;at least 18&#039;`.
 */
function readable(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#0?39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ");
}

const failures = [];
let checked = 0;

for (const slug of readdirSync(lessonsDir).filter(isCore).sort()) {
  const cfgPath = resolve(lessonsDir, slug, "config.json");
  const slidesPath = resolve(lessonsDir, slug, "slides.html");
  if (!existsSync(cfgPath) || !existsSync(slidesPath)) continue;

  const cfg = JSON.parse(readFileSync(cfgPath, "utf8"));
  const nw = cfg.noticeAndWonder;
  if (!nw) continue;
  checked += 1;

  const slides = readFileSync(slidesPath, "utf8");
  const fail = (msg) => failures.push(`${slug}: ${msg}`);

  if (!nw.image) {
    fail("noticeAndWonder.image is missing — the slide falls back to a blank grid");
  } else {
    if (!existsSync(resolve(root, nw.image.replace(/^\//, "")))) {
      fail(`image ${nw.image} does not exist on disk`);
    }
    if (!slides.includes(basename(nw.image))) {
      fail(`image ${basename(nw.image)} never reaches slides.html`);
    }
  }

  if (!nw.imageAlt || nw.imageAlt.trim().length < 15) {
    fail("imageAlt is missing or too short to describe the picture");
  }

  // The stems must survive whichever schema the lesson was authored in.
  const stems =
    cfg.launch?.noticePrompts?.length > 0 ? cfg.launch.noticePrompts : nw.noticeStarters || [];
  if (stems.length === 0) {
    fail("no notice stems in either schema");
  } else {
    const first = String(stems[0]).replace(/\s+/g, " ").trim().slice(0, 30);
    if (first && !readable(slides).includes(first)) {
      fail(`notice stem "${first}" never reaches slides.html`);
    }
  }
}

// A probe that silently stops probing reports a perfectly clean curriculum.
if (checked < 80) {
  failures.push(`only ${checked} lessons examined — expected at least 80; the sweep is broken`);
}

if (failures.length > 0) {
  console.error(`\n✗ Be Curious artwork: ${failures.length} failure(s)`);
  for (const f of failures) console.error(`   ${f}`);
  console.error("\n  Fix the config, then re-run: node scripts/generate-slides.mjs");
  process.exit(1);
}

console.log(
  `✓ Be Curious artwork: ${checked} lessons — image, alt text and stems all reach the slide`,
);

#!/usr/bin/env node
/**
 * Curriculum Hub lock — guards the hand-maintained curriculum/index.html against
 * the recurring "clobber" incidents (a generator or a bad deploy replacing the
 * hub with a stub / a different app / a stripped baseline).
 *
 * It asserts several INDEPENDENT semantic invariants. A clobbered or stripped
 * hub will fail at least one, so this can't be fooled by a single missing piece.
 * Wired into `npm run validate`, so the pre-push QA loop blocks any push that
 * would ship a broken hub.
 *
 * If you intentionally change the hub in a way that trips an invariant (e.g.,
 * remove the mailbox card), update the matching threshold/landmark below.
 */
import { readFileSync, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const HUB = resolve(ROOT, "curriculum/index.html");

const MIN_BYTES = 150000; // hub is ~286KB; a clobber/stub is far smaller
const MIN_UNITS = 10; // all 10 math units must be present
const MIN_LESSON_LINKS = 200; // ~925 today; a floor well clear of real edits

const failures = [];
function check(ok, msg) {
  if (!ok) failures.push(msg);
}

if (!existsSync(HUB)) {
  console.error("✗ curriculum hub missing: curriculum/index.html");
  process.exit(1);
}

const html = readFileSync(HUB, "utf8");
const bytes = statSync(HUB).size;
const units = (html.match(/class="unit"/g) || []).length;
const lessonLinks = (html.match(/\/lessons\//g) || []).length;

check(bytes >= MIN_BYTES, `hub too small: ${bytes} bytes (< ${MIN_BYTES}) — possible clobber/stub`);
check(/Curriculum Hub/.test(html), 'missing the "Curriculum Hub" title');
check(units >= MIN_UNITS, `only ${units} unit sections (expected >= ${MIN_UNITS})`);
check(lessonLinks >= MIN_LESSON_LINKS, `only ${lessonLinks} /lessons/ links (expected >= ${MIN_LESSON_LINKS})`);
check(/id="curr-search"/.test(html), "missing the lesson search control (#curr-search)");
check(/mailbox-feature/.test(html), "missing the Student Digital Mailbox featured card");

if (failures.length) {
  console.error("✗ Curriculum Hub lock FAILED — the hub looks clobbered/stripped:");
  failures.forEach((f) => console.error("   • " + f));
  console.error(
    "\nIf this change is intentional, update tools/validate-curriculum-hub.mjs.\n" +
      "Otherwise restore the hub (good baseline: tag stable-baseline-2026-06-04)."
  );
  process.exit(1);
}

console.log(
  `✓ Curriculum Hub lock passed (${bytes} bytes · ${units} units · ${lessonLinks} lesson links).`
);

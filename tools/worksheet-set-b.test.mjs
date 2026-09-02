/* =============================================================================
 * worksheet-set-b.test.mjs — the second practice sheet must be a second sheet.
 * -----------------------------------------------------------------------------
 * Set B (`worksheet-2.html`) exists so a teacher has a fresh form for re-teach,
 * homework or a retake. Three ways it silently stops being that, each pinned
 * here because each still builds, still validates and still prints:
 *
 *   1. It re-prints a problem Set A already carries — the sheet looks full and
 *      the class has seen every item.
 *   2. It goes empty or near-empty for some lessons — the link is live, the page
 *      is a header.
 *   3. A normalized item loses its answer index, so the key marks A for every
 *      question. connect.check stores the answer at `answer`; warm-ups and exit
 *      tickets store it at `correctIndex`; renderMC reads `correctIndex` alone.
 *
 * A group lesson's Set B must also stay out of the small-group Practice Set's
 * pools (warm-up, Connect, explore, turn-and-talk, vocabulary, exit ticket).
 * Both packets build either way, and the duplication only shows up at the table.
 * ========================================================================== */
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  coreReserve,
  itemFingerprint,
  kindOf,
  partTwoSetAPool,
  printable,
  setBPages,
} from "../scripts/lib/worksheet-set-b.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LESSONS = join(ROOT, "lessons");

const dirs = readdirSync(LESSONS, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(LESSONS, d.name, "worksheet.html")))
  .map((d) => d.name)
  .sort();

assert.ok(dirs.length > 200, `expected the worksheet fleet, found ${dirs.length} lessons`);

/** What Set A prints, mirroring buildWorksheet's own pool selection exactly. */
function setAPool(cfg) {
  const kind = kindOf(cfg.lessonId, cfg);
  const app = printable(cfg.practice?.approaching);
  const on = printable(cfg.practice?.onLevel);
  const ext = printable(cfg.practice?.extending);
  if (kind === "group1") return (app.length ? app : on).slice(0, 6);
  if (kind === "group2") return (ext.length ? ext : on).slice(0, 6);
  if (kind === "catchup") return (app.length ? app : on).slice(0, 5);
  if (kind === "partTwo") return partTwoSetAPool(cfg);
  return [...app, ...on, ...ext];
}

const fingerprint = itemFingerprint;

const failures = [];
let thinnest = { id: null, n: Infinity };
let totalItems = 0;

for (const id of dirs) {
  const cfg = JSON.parse(readFileSync(join(LESSONS, id, "config.json"), "utf8"));
  const pages = setBPages(cfg);

  // 2. Every lesson with a Set A sheet gets a Set B sheet with real problems.
  if (!pages.length) {
    failures.push(`${id}: no Set B pages at all`);
    continue;
  }
  const items = pages.flatMap((p) => p.pool);
  totalItems += items.length;
  if (items.length < 3) failures.push(`${id}: Set B has only ${items.length} problem(s)`);
  if (items.length < thinnest.n) thinnest = { id, n: items.length };

  // 1. No item is on both sheets.
  const setA = new Set(setAPool(cfg).map(fingerprint));
  for (const item of items) {
    if (setA.has(fingerprint(item))) {
      failures.push(
        `${id}: Set B re-prints a Set A problem — ${String(item.stem || "").slice(0, 60)}`,
      );
      break;
    }
  }

  // …and no item is on Set B twice.
  const seen = new Set();
  for (const item of items) {
    const f = fingerprint(item);
    if (seen.has(f)) {
      failures.push(
        `${id}: Set B prints the same problem twice — ${String(item.stem || "").slice(0, 60)}`,
      );
      break;
    }
    seen.add(f);
  }

  // 3. Any item with choices names which one is right, in range.
  for (const item of items) {
    if (!Array.isArray(item.choices) || !item.choices.length) continue;
    if (!Number.isInteger(item.correctIndex)) {
      failures.push(`${id}: a Set B choice item has no correctIndex — the key would mark A`);
      break;
    }
    if (item.correctIndex < 0 || item.correctIndex >= item.choices.length) {
      failures.push(`${id}: a Set B correctIndex (${item.correctIndex}) is outside its choices`);
      break;
    }
  }

  // A small-group Set B stays inside the practice pools — Apply Day is exempt:
  // it has no small-group Practice Set packet to collide with, and its review
  // warm-up is its own spiral content.
  const k = kindOf(id, cfg);
  if (k !== "core" && k !== "partTwo" && items.some((p) => p.origin && p.origin !== "practice")) {
    failures.push(`${id}: a small-group Set B took an item from the Practice Set's pools`);
  }
}

/* --- The connect.check normalizer, on the shape that breaks it ------------- */
{
  const reserve = coreReserve({
    lessonId: "test-1",
    connect: { check: { stem: "6 ÷ 1/3 = ?", choices: ["2", "18", "6", "3"], answer: 1 } },
  });
  assert.equal(reserve.length, 1, "a Connect check should reach the Set B reserve");
  assert.equal(
    reserve[0].correctIndex,
    1,
    "connect.check stores its answer at `answer`; it must be normalized to correctIndex or the key marks A",
  );
}
{
  // A Connect check is written to be ASKED after the scenario is read aloud, so
  // it refers back to it. Lifted onto paper without it, the question has no
  // subject: "If each section were 1/2 yard instead, how many sections?"
  const reserve = coreReserve({
    lessonId: "test-3",
    connect: {
      scenario: "A detective has 6 yards of tape and marks off 1/3-yard sections.",
      check: [{ stem: "If each section were 1/2 yard instead, how many sections?" }],
    },
  });
  assert.equal(reserve.length, 1);
  assert.ok(
    reserve[0].stem.startsWith("A detective has 6 yards of tape"),
    "a Connect check must carry its scenario onto the printed stem, or the question has no subject",
  );
  assert.ok(reserve[0].stem.includes("If each section were 1/2 yard instead"));
}
{
  // …and it is not repeated when the stem already states it.
  const scenario = "A detective has 6 yards of tape.";
  const reserve = coreReserve({
    lessonId: "test-4",
    connect: { scenario, check: [{ stem: `${scenario} How many 1/3-yard sections fit?` }] },
  });
  assert.equal(
    reserve[0].stem,
    `${scenario} How many 1/3-yard sections fit?`,
    "a stem that already opens with the scenario must not be given it twice",
  );
}
{
  // explore.cards are sort tokens, not questions — they must not become problems.
  const reserve = coreReserve({
    lessonId: "test-5",
    explore: { cards: [{ text: "Deciding if you have enough time to walk", correct: 0 }] },
  });
  assert.equal(
    reserve.length,
    0,
    "a drag-sort card is not a problem and must not be printed as one",
  );
}
{
  // An item whose key cannot be resolved is dropped, not printed keyless.
  const reserve = coreReserve({
    lessonId: "test-2",
    warmup: { questions: [{ stem: "What is 2 + 2?", choices: ["3", "4"] }] },
  });
  assert.equal(
    reserve.length,
    0,
    "a choice item with no answer index must be dropped, not printed",
  );
}

/* --- The rendered sheets carry what the selector chose --------------------- */
{
  const sample = dirs.slice(0, 40);
  for (const id of sample) {
    const file = join(LESSONS, id, "worksheet-2.html");
    if (!existsSync(file)) {
      failures.push(
        `${id}: worksheet-2.html is missing — run node scripts/generate-worksheets.mjs`,
      );
      continue;
    }
    const html = readFileSync(file, "utf8");
    const cards = (html.match(/class="ws-problem-card"/g) || []).length;
    const cfg = JSON.parse(readFileSync(join(LESSONS, id, "config.json"), "utf8"));
    const expected = setBPages(cfg).flatMap((p) => p.pool).length;
    if (cards !== expected) {
      failures.push(
        `${id}: worksheet-2.html renders ${cards} problems, the selector chose ${expected}`,
      );
    }
  }
}

if (failures.length) {
  console.error(`worksheet-set-b FAILED (${failures.length}):`);
  for (const f of failures.slice(0, 25)) console.error(`  ✗ ${f}`);
  if (failures.length > 25) console.error(`  … ${failures.length - 25} more`);
  process.exit(1);
}

console.log(
  `✓ worksheet-set-b: ${dirs.length} lessons each print a second sheet ` +
    `(${totalItems} problems, none re-printed from Set A, every choice item keyed; ` +
    `thinnest is ${thinnest.id} at ${thinnest.n}).`,
);

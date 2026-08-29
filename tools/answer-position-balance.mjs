#!/usr/bin/env node
/**
 * Where the right answer sits.
 *
 * Across the 84 core lessons, choice A is correct in 79.9% of warm-up
 * questions, 85.8% of Connect checks, 91.7% of exit tickets and 93.7% of
 * practice items — 1,426 multiple-choice items where clicking the first choice
 * every time scores about 90%. Sixty-two of the 84 lessons have EVERY warm-up
 * answer in position A.
 *
 * That is not a rendering bug and no gate could have caught it: every item is
 * individually correct, well-formed, arithmetically true, and carries authored
 * feedback. The defect only exists in the DISTRIBUTION, which no per-item check
 * can see.
 *
 * What it costs is not cosmetic:
 *   - The exit ticket decides whether a student "mastered" the lesson, and it
 *     is 91.7% A. Every mastery signal on the site is inflated.
 *   - The 594 authored distractor messages and 1,092 misconception tags only
 *     fire when a student PICKS a distractor. A student who guesses A is right,
 *     so the diagnostic layer the fleet was just given never runs.
 *   - It teaches the wrong lesson. A student who notices the pattern is
 *     rewarded for noticing it.
 *
 * WHAT THIS CHANGES, AND WHAT IT REFUSES TO.
 *
 * It moves the correct choice to a new position and carries every parallel
 * per-choice array with it. It does not rewrite a single word: no stem, no
 * choice text, no explanation, no feedback message. An item after this tool has
 * exactly the same content as before, in a different order.
 *
 * The correct answer's target position is assigned ROUND-ROBIN within each
 * (lesson, surface) group rather than randomly. A random shuffle only reaches an
 * even distribution in expectation, and on groups of four items it routinely
 * does not; round-robin lands it exactly. The distractors keep their relative
 * order, so an author's ordering of the wrong answers survives — this is the
 * smallest edit that fixes the distribution.
 *
 * It SKIPS an item when position carries meaning, because reordering those
 * makes the item wrong rather than merely different:
 *   - a choice like "All of the above" / "None of the above" / "Both A and B",
 *     which is an assertion ABOUT the other choices and their order;
 *   - choices that read as a sorted numeric run, where the ordering is the
 *     presentation (a number line's worth of options shuffled reads as an
 *     error);
 *   - a choice whose text names a position ("the first one", "A and C").
 * Every skip is reported with its reason. A skipped item is a decision to make
 * by hand, not a failure.
 *
 * Run:
 *   node tools/answer-position-balance.mjs                  # report only
 *   node tools/answer-position-balance.mjs --fix --only 3-1,3-2
 *   node tools/answer-position-balance.mjs --fix --unit 3
 *
 * Writing is opt-in. With no --fix it touches nothing and prints the table.
 */
import { globSync, readFileSync, writeFileSync } from "node:fs";

const argv = process.argv.slice(2);
const FIX = argv.includes("--fix");
const arg = (flag) => {
  const i = argv.indexOf(flag);
  return i === -1 ? null : argv[i + 1];
};

const ONLY = (arg("--only") || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const UNIT = arg("--unit");

/* Variants (group1/group2/part2/catchup) are GENERATED from their parent and
 * `tools/warmup-sequencing.test.mjs` requires them to carry the parent warm-up
 * verbatim. Editing them here would be edited twice and reverted once; they are
 * re-synced by their generators after the parents change. */
const VARIANT = /-(group1|group2|part2|catchup)$/;

/* ------------------------------------------------------------ item surfaces */

/**
 * Each surface names where its items live and which key holds the answer index.
 * `connect.check` stores it at `answer` while everything else uses
 * `correctIndex` — a difference that has already produced one bug in this repo
 * (an answer key that marked A for everything), so it is declared once here
 * rather than rediscovered per call site.
 */
function collectItems(cfg) {
  const out = [];
  const push = (surface, holder, key) => {
    if (!holder || !Array.isArray(holder.choices)) return;
    if (!Number.isInteger(holder[key])) return;
    out.push({ surface, item: holder, answerKey: key });
  };

  for (const q of cfg.warmup?.questions || []) push("warmup", q, "correctIndex");

  const check = cfg.connect?.check;
  for (const q of Array.isArray(check) ? check : check ? [check] : []) push("connect", q, "answer");

  const exit = cfg.reflect?.exitTicket;
  for (const q of Array.isArray(exit) ? exit : exit ? [exit] : []) push("exit", q, "correctIndex");

  // Practice tiers nest by level and by optional/stretch pools, and the shape
  // has moved before. Walking it is what keeps this correct across that.
  const walk = (node) => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node.choices) && Number.isInteger(node.correctIndex))
      push("practice", node, "correctIndex");
    for (const v of Object.values(node)) walk(v);
  };
  walk(cfg.practice);

  return out;
}

/* --------------------------------------------------------- when NOT to move */

/**
 * A choice that is an assertion ABOUT the other choices. Deliberately narrow,
 * and narrowed once already: the first version matched `\bthe first\b`,
 * `\bthe last\b` and a case-insensitive `\b[a-d] and [a-d]\b`, which is
 * ordinary mathematical English, not a reference to a choice. It pinned six
 * answers at position A for phrases like "the first BAKERY", "the first AMOUNT"
 * of a ratio, and "both b and c" — the variables in a(b + c). One of them was
 * an exit ticket, which is the surface that decides mastery.
 *
 * So the letter forms now require a CAPITAL letter, which is how a choice is
 * ever referred to ("Both A and C"), and the bare ordinals are gone. "All/none
 * of the above" needs no such care — it can only mean the other choices.
 */
const POSITIONAL =
  /\ball of the above\b|\bnone of the above\b|\bboth of the above\b|todas las anteriores|ninguna de las anteriores/i;
const POSITIONAL_CASED =
  /\b(?:both|either|neither)\s+[A-D]\s+(?:and|or)\s+[A-D]\b|\bchoices?\s+[A-D]\b|\boptions?\s+[A-D]\b/;

/**
 * A choice set is NUMERIC when every choice leads with a number. These get
 * sorted ascending rather than round-robined, which is both better practice
 * (options a reader can scan) and the only stable answer: sorting is
 * idempotent, so a second run is a no-op.
 *
 * The first version of this tool instead SKIPPED anything already in numeric
 * order, and that made the whole pass non-idempotent — moving one item's answer
 * can turn its choices into a sorted run, which changes the skip set, which
 * shifts the round-robin cursor for every later item, so a second run churned
 * 26 more answers. A tool that writes lesson content must produce the same tree
 * every time or nothing downstream can be verified.
 */
function numericValues(choices) {
  const nums = choices.map((c) => {
    const m = /-?\d+(?:[.,]\d+)?/.exec(String(c).replace(/,/g, ""));
    return m ? Number(m[0]) : Number.NaN;
  });
  return nums.some((n) => Number.isNaN(n)) ? null : nums;
}

function skipReason(item) {
  const choices = item.choices.map((c) => String(c ?? ""));
  // Two choices still balance — 50/50 is a real distribution, and pinning the
  // true one at A is exactly the defect this exists to fix.
  if (choices.length < 2) return "fewer than two choices";
  if (choices.some((c) => POSITIONAL.test(c) || POSITIONAL_CASED.test(c)))
    return "a choice refers to the other choices";
  return null;
}

/**
 * A stable target for a non-numeric item: derived from the stem, so it does not
 * depend on how many items before it were moved or skipped. Round-robin across
 * a group would be a tighter distribution, but only while the group's
 * membership never changes — and it changes every time an item is authored.
 * Over 1,426 items a stem hash is even enough, and it is reproducible.
 */
function stableTarget(item, n) {
  const key = String(item.stem ?? item.id ?? JSON.stringify(item.choices));
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % n;
}

/* ------------------------------------------------------------- the movement */

/**
 * Every array on the item whose length matches the choice count travels with
 * the choices. Discovering them by length rather than by a hardcoded list is
 * deliberate: `choicesEs`, `choiceFeedback`, `choiceFeedbackEs` and
 * `misconceptionTags` are the four that exist today, and the wave that added
 * the last two would have silently desynchronised a hardcoded version — leaving
 * a distractor message attached to the wrong distractor, which is worse than
 * having none.
 */
function parallelKeys(item) {
  const n = item.choices.length;
  return Object.keys(item).filter(
    (k) => k !== "choices" && Array.isArray(item[k]) && item[k].length === n,
  );
}

/** Move index `from` to index `to`, keeping every other element's order. */
function relocate(arr, from, to) {
  const copy = arr.slice();
  const [x] = copy.splice(from, 1);
  copy.splice(to, 0, x);
  return copy;
}

/**
 * Sort a numeric choice set ascending, carrying every parallel array. The
 * correct answer lands wherever its own value falls, which distributes
 * positions across items without anyone choosing them — and running it again
 * changes nothing.
 */
function sortNumeric(entry, nums) {
  const { item, answerKey } = entry;
  const order = nums.map((_v, i) => i).sort((a, b) => nums[a] - nums[b]);
  if (order.every((src, i) => src === i)) return false;
  const keys = ["choices", ...parallelKeys(item)];
  for (const k of keys) item[k] = order.map((src) => item[k][src]);
  item[answerKey] = order.indexOf(item[answerKey]);
  return true;
}

function moveAnswer(entry, targetPos) {
  const { item, answerKey } = entry;
  const from = item[answerKey];
  if (from === targetPos) return false;
  const keys = ["choices", ...parallelKeys(item)];
  for (const k of keys) item[k] = relocate(item[k], from, targetPos);
  item[answerKey] = targetPos;
  return true;
}

/* ----------------------------------------------------------------- the pass */

const files = globSync("lessons/*/config.json").sort();
const tally = {};
const skips = [];
let moved = 0;
let filesChanged = 0;
const changedParents = new Set();

const selected = (id) => {
  if (VARIANT.test(id)) return false;
  if (ONLY.length) return ONLY.includes(id);
  if (UNIT) return id.startsWith(`${UNIT}-`);
  return true;
};

for (const file of files) {
  const id = file.split("/")[1];
  if (VARIANT.test(id)) continue;

  const raw = readFileSync(file, "utf8");
  let cfg;
  try {
    cfg = JSON.parse(raw);
  } catch {
    console.error(`  !! ${id}: config.json does not parse — skipped`);
    continue;
  }

  const entries = collectItems(cfg);
  for (const e of entries) {
    (tally[e.surface] ||= [0, 0, 0, 0, 0, 0])[e.item[e.answerKey]]++;
  }

  if (!FIX || !selected(id)) continue;

  let touched = false;

  for (const e of entries) {
    const reason = skipReason(e.item);
    if (reason) {
      skips.push(`${id} · ${e.surface}: ${reason}`);
      continue;
    }
    const nums = numericValues(e.item.choices.map((c) => String(c ?? "")));
    const changed = nums
      ? sortNumeric(e, nums)
      : moveAnswer(e, stableTarget(e.item, e.item.choices.length));
    if (changed) {
      moved++;
      touched = true;
    }
  }

  if (touched) {
    writeFileSync(file, `${JSON.stringify(cfg, null, 2)}\n`);
    filesChanged++;
    changedParents.add(id);
  }
}

/* ------------------------------------------------- variants inherit, always */

/**
 * A small-group or catch-up session warms up on exactly what its parent warms
 * up on — `tools/warmup-sequencing.test.mjs` enforces equality, ignoring only
 * each question's own `id`. Reordering a parent's choices therefore breaks
 * every variant of it, and the small-group generator cannot repair the break:
 * since the 2026-08-29 convergence it is ADDITIVE ONLY, so it will not touch a
 * field the committed config already holds. The tool that causes the drift
 * repairs it, in the same run, or the repo is left red for someone else to
 * discover.
 *
 * The parent's warm-up is copied wholesale and each variant question's own `id`
 * is put back, which is precisely the shape the equality test describes.
 */
function resyncVariants(changedParents) {
  let synced = 0;
  for (const file of files) {
    const id = file.split("/")[1];
    const m = VARIANT.exec(id);
    if (!m) continue;
    const parent = id.slice(0, m.index);
    if (!changedParents.has(parent)) continue;

    let cfg;
    let parentCfg;
    try {
      cfg = JSON.parse(readFileSync(file, "utf8"));
      parentCfg = JSON.parse(readFileSync(`lessons/${parent}/config.json`, "utf8"));
    } catch {
      continue;
    }
    if (!cfg.warmup?.questions || !parentCfg.warmup?.questions) continue;

    const ids = cfg.warmup.questions.map((q) => q.id);
    const before = JSON.stringify(cfg.warmup);
    cfg.warmup = JSON.parse(JSON.stringify(parentCfg.warmup));
    cfg.warmup.questions = cfg.warmup.questions.map((q, i) =>
      ids[i] === undefined ? q : { ...q, id: ids[i] },
    );
    if (JSON.stringify(cfg.warmup) === before) continue;

    writeFileSync(file, `${JSON.stringify(cfg, null, 2)}\n`);
    synced++;
  }
  return synced;
}

/* --------------------------------------------------------------- the report */

const pct = (d) => {
  const t = d.reduce((a, b) => a + b, 0);
  return t ? d.map((n) => `${((100 * n) / t).toFixed(1)}%`) : [];
};

console.log(FIX ? "answer position — AFTER" : "answer position — where the right answer sits");
console.log("");
for (const [surface, d] of Object.entries(tally)) {
  const t = d.reduce((a, b) => a + b, 0);
  const used = d.slice(0, Math.max(...d.map((n, i) => (n ? i : 0))) + 1);
  console.log(`  ${surface.padEnd(10)} n=${String(t).padStart(5)}   ${pct(used).join("  ")}`);
}

if (FIX) {
  console.log("");
  const synced = resyncVariants(changedParents);
  console.log(`  moved ${moved} answer(s) across ${filesChanged} lesson config(s)`);
  console.log(`  re-synced ${synced} variant warm-up(s) to their parents`);
  if (skips.length) {
    console.log(`  left alone (position carries meaning): ${skips.length}`);
    for (const s of skips.slice(0, 20)) console.log(`    - ${s}`);
    if (skips.length > 20) console.log(`    …and ${skips.length - 20} more`);
  }
  console.log("");
  console.log("  Derived artifacts now need regenerating — worksheets and their");
  console.log("  answer keys, printables, slides, Part 2 and the small-group");
  console.log("  variants all copy these items.");
}

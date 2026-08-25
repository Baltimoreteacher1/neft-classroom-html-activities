// Authors per-choice `misconceptionTags` on multiple-choice lesson items from
// operand-free numeric relations that can be verified exactly — the only honest
// way to tag the prose word problems whose stems the runtime expression scanner
// (engine/core/misconceptions.js scanExpression) cannot parse. Authored tags are
// ground truth to detectMisconception(), so a wrong tag would mislabel a
// student's thinking; this tool therefore refuses every ambiguous case rather
// than guess, exactly as the detector itself does.
//
// Rules (both use the sparse vocabulary AUTHORED_TAGS already maps):
//   place-value  wrong choice equals the correct value × 10^k (k = ±1..3) and
//                the item is genuinely decimal (correct value is non-integer,
//                or the stem/choices carry a decimal point or money amount).
//   sign-error   wrong choice equals the exact negation of a nonzero correct
//                value.
// A choice matching BOTH rules (impossible for k≠0 unless correct=0, which is
// excluded) or matching a rule twice keeps NO tag. Existing misconceptionTags
// arrays are never touched — hand-authored judgement outranks derivation.
//
// Idempotent and additive: re-running produces no further changes. Writes the
// same 2-space JSON the generators emit. `--dry-run` reports without writing.
// Base lesson configs are the source of truth; generated variants hold verbatim
// clones of the same items, so both are tagged with the same deterministic rule
// and a generator re-run converges on the identical result.

import { globSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { deriveOperandTags } from "./lib/operand-misconception-tagger.mjs";

const DRY = process.argv.includes("--dry-run");

/** Tolerant numeric parse mirroring the checker's spirit: $, commas, spaces,
 *  trailing units stripped; simple fractions evaluated. Null when unsure. */
export function parseQuantity(text) {
  const raw = String(text ?? "").trim();
  if (!raw) return null;
  const cleaned = raw.replace(/[$,\s]/g, "").replace(/[a-zA-Z°²³]+$/u, "");
  const frac = cleaned.match(/^(-?\d+)\/(\d+)$/);
  if (frac && Number(frac[2]) !== 0) return Number(frac[1]) / Number(frac[2]);
  if (!/^-?\d*\.?\d+$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

/** Exact ×10^k comparison without float drift: compare digit strings. */
function powerOfTenApart(wrong, correct) {
  if (wrong === null || correct === null || correct === 0 || wrong === 0) return false;
  if (Math.sign(wrong) !== Math.sign(correct)) return false;
  for (const k of [-3, -2, -1, 1, 2, 3]) {
    // Scale both to integers via string math to dodge 0.1×10 !== 1 drift.
    const scaled = Number((correct * 10 ** k).toPrecision(12));
    if (Math.abs(scaled - wrong) < 1e-9 * Math.max(1, Math.abs(wrong))) return true;
  }
  return false;
}

function isDecimalContext(item, correct) {
  if (!Number.isInteger(correct)) return true;
  const text = [item.stem, ...(item.choices || [])].join(" ");
  return /\$|\d\.\d/.test(text);
}

/** Returns the tags array to author, or null when nothing qualifies. */
export function deriveTags(item) {
  if (!Array.isArray(item.choices) || item.misconceptionTags) return null;
  const correctIndex = Number.isInteger(item.correctIndex) ? item.correctIndex : null;
  if (correctIndex === null || correctIndex < 0 || correctIndex >= item.choices.length) return null;
  const correct = parseQuantity(item.choices[correctIndex]);
  if (correct === null) return null;
  const tags = item.choices.map((choice, index) => {
    if (index === correctIndex) return null;
    const wrong = parseQuantity(choice);
    if (wrong === null || wrong === correct) return null;
    const place = powerOfTenApart(wrong, correct) && isDecimalContext(item, correct);
    // One direction only: sign-dropped's student text says the negative sign
    // "went missing", which is only true when the correct value is negative and
    // the student chose its positive twin. An absolute-value item (correct 9,
    // wrong −9) is the student ADDING a sign — a different error the taxonomy
    // has no name for, so it stays untagged.
    const sign = correct < 0 && wrong === -correct;
    if (place && !sign) return "place-value";
    if (sign && !place) return "sign-error";
    return null;
  });
  return tags.some(Boolean) ? tags : null;
}

function selfTest() {
  const taco = {
    stem: "3 taco baskets at $4.25 each?",
    choices: ["$12.75", "$12.15", "$1.275", "$127.50"],
    correctIndex: 0,
  };
  const derived = deriveTags(taco);
  const want = JSON.stringify([null, null, "place-value", "place-value"]);
  if (JSON.stringify(derived) !== want)
    throw new Error(`selftest place-value: got ${JSON.stringify(derived)}`);
  const signed = { stem: "-8 + 3 = ?", choices: ["-5", "5", "-11"], correctIndex: 0 };
  const signTags = deriveTags(signed);
  if (JSON.stringify(signTags) !== JSON.stringify([null, "sign-error", null]))
    throw new Error(`selftest sign-error: got ${JSON.stringify(signTags)}`);
  // Absolute value / opposite shapes (correct positive, wrong negative) are the
  // student ADDING a sign — must stay untagged.
  if (deriveTags({ stem: "|-9| = ?", choices: ["9", "-9"], correctIndex: 0 }) !== null)
    throw new Error("selftest: tagged sign-error in the wrong direction");
  // Whole-number, no decimal context → never a place-value tag.
  if (deriveTags({ stem: "6 × 7?", choices: ["42", "420"], correctIndex: 0 }) !== null)
    throw new Error("selftest: tagged a non-decimal item");
  // Existing tags are never touched.
  if (deriveTags({ ...taco, misconceptionTags: [null, null, null, null] }) !== null)
    throw new Error("selftest: overwrote authored tags");
  // Prose answers that don't parse stay untagged.
  if (deriveTags({ stem: "?", choices: ["the mean", "the median"], correctIndex: 0 }) !== null)
    throw new Error("selftest: tagged unparseable choices");
}

function walk(node, visit) {
  if (Array.isArray(node)) for (const child of node) walk(child, visit);
  else if (node && typeof node === "object") {
    visit(node);
    for (const value of Object.values(node)) walk(value, visit);
  }
}

/* The exact ×10^k / negation rules above only reach items whose distractors are
   magnitude or sign twins. Most of this curriculum is prose word problems, and
   for those the operand reconstruction in tools/lib/operand-misconception-tagger.mjs
   is the honest path — it recovers the problem's arithmetic model from the
   stem's own numbers and refuses every ambiguous reading.
   The two families are merged PER CHOICE, not per item: an item whose ×10
   distractor is a place-value error can also have an "added instead of
   multiplied" distractor beside it, and letting the exact family claim the whole
   array would leave that second distractor silent. */
const untagged = (node) => ({ ...node, misconceptionTags: undefined });

function merge(exact, operand) {
  return exact.map((tag, index) => tag || operand[index] || null);
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export function tagsFor(node) {
  const existing = node.misconceptionTags;
  const exact = deriveTags(node.misconceptionTags ? untagged(node) : node);
  const operand = deriveOperandTags(untagged(node));

  if (!existing) {
    if (exact && operand) return merge(exact, operand);
    return exact || operand;
  }
  /* Already tagged. Filling a null is only safe when the whole array is this
     tool's own machine output — a null a human authored is a deliberate refusal
     to name the error, and derivation must not talk over it. */
  if (!Array.isArray(existing) || !exact || !same(exact, existing) || !operand) return null;
  const merged = merge(existing, operand);
  return same(merged, existing) ? null : merged;
}

function main() {
  selfTest();
  const files = globSync("lessons/*/config.json").sort();
  let itemsTagged = 0;
  let filesChanged = 0;
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    const config = JSON.parse(source);
    let changed = 0;
    walk(config, (node) => {
      const tags = tagsFor(node);
      if (tags) {
        node.misconceptionTags = tags;
        changed++;
      }
    });
    if (!changed) continue;
    itemsTagged += changed;
    filesChanged++;
    if (!DRY) writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`);
  }
  console.log(
    `${DRY ? "[dry-run] " : ""}misconception tags: ${itemsTagged} item(s) across ${filesChanged} config(s)`,
  );
}

/* Importing this module (the tests do) must never rewrite 288 lesson configs as
   a side effect — run only when invoked as the entry point. */
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) main();

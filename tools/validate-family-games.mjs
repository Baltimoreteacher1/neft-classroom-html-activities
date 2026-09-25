#!/usr/bin/env node
/**
 * validate:family-games — the Family Arcade may not play mathematics the family
 * has not been taught yet.
 *
 * The arcade's own lead promises "four quick games about TONIGHT'S math", and
 * the games are looked up from a bank shared by every lesson with the same key.
 * That is fine while a key covers one idea and wrong the moment it covers a
 * strand: `ratios` served 14 lessons across SIX standards and two units, so
 * lesson 3-1 "Understand Ratios" — night one, where the whole skill is writing
 * a comparison in the order it is named — shipped families a memory pair for
 * "1/2 as a percent -> 50%" (Unit 4), a unit-rate pair, an equivalent-ratio
 * sorting game and a better-buy dilemma. Three of its four games were content
 * from lessons still weeks away, and every existing gate passed it: the bank
 * existed, the key resolved, the JSON parsed, the games rendered and played.
 * They all ask "does this game WORK?"; none asked "does it BELONG?".
 *
 * Reaching BACK is fine — a game may use anything already taught. Reaching
 * FORWARD is not. That asymmetry is the whole check.
 *
 * Two invariants, both decidable from data already on disk:
 *
 *  1. RESOLUTION — every lesson resolves to a bank that exists in all four
 *     games, and no lesson silently lands on `fallback` when its own strand has
 *     a bank. A key present in one bank and missing from another is how three
 *     games get the strand's content and the fourth gets generic filler.
 *
 *  2. REACH — a bank declares the standards it serves (SERVES below). A lesson
 *     may only be handed a bank whose standards are at or BEFORE its own
 *     position in the district teaching sequence. A bank serving a standard the
 *     lesson has not reached is a forward reach and fails.
 *
 * Self-tests its detectors against known-bad fixtures BEFORE sweeping, because
 * a detector that has quietly stopped firing and a clean fleet print the same
 * line.
 */

import { existsSync } from "node:fs";

import { detectVisualTopic } from "../scripts/homework-alignment.mjs";
import { FAMILY_GAME_BANKS, familyGameKey } from "../scripts/homework-guided-notes.mjs";
import { lessonPath, listLessonDirs, tryLoadLessonConfig } from "./lib/curriculum-source.mjs";

/**
 * Which standards each refined bank is authored for. Only the keys that were
 * SPLIT need an entry: an unsplit topic is a single idea by construction, and
 * inventing a standard list for it would be asserting something nobody decided.
 */
const SERVES = {
  "ratios-understand": ["6.AT.1"],
  "ratios-rate": ["6.AT.2"],
  ratios: ["6.AT.3"],
  percent: ["6.AT.4"],
};

/**
 * The split is at STRAND level, and the trailing letter of a standard is not a
 * position in it. 6.AT.3a (tables) and 6.AT.3c (measurement conversion) are two
 * faces of one idea — scaling both parts of a ratio by the same factor — and the
 * equivalent-ratio bank is authored for that idea, not for one sub-letter. An
 * earlier version of this gate sequenced the letters and reported 14 findings
 * against lessons whose bank is exactly right, which is the failure mode a gate
 * has to avoid most: being confidently wrong about correct content.
 */
const strandOf = (std) => String(std).replace(/^(6\.AT\.\d+).*$/, "$1");

/**
 * Teaching order, read as a sequence rather than as a sort — the district
 * teaches Unit 3 (6.AT.1-3) before Unit 4 (6.AT.4). Positions, not names.
 */
const SEQUENCE = ["6.AT.1", "6.AT.2", "6.AT.3", "6.AT.4"];
const posOf = (std) => SEQUENCE.indexOf(strandOf(std));

const GAME_NAMES = ["pairs", "tf", "sort", "wyr"];

/** A lesson is served correctly when its bank reaches no further than it does. */
export function reachFailures(lessonStd, bankKey) {
  const serves = SERVES[bankKey];
  if (!serves) return []; // unsplit topic — one idea, nothing to compare
  const here = posOf(lessonStd);
  if (here < 0) return []; // standard outside the split strand; not this gate's business
  return serves
    .filter((s) => posOf(s) > here)
    .map(
      (s) => `bank "${bankKey}" is authored for ${s}, which lesson ${lessonStd} has not reached`,
    );
}

/** A key must be present in all four banks or in none of them. */
export function resolutionFailures(banks, key) {
  const present = GAME_NAMES.filter((g) => Object.hasOwn(banks[g], key));
  if (present.length === 0 || present.length === GAME_NAMES.length) return [];
  const missing = GAME_NAMES.filter((g) => !present.includes(g));
  return [`key "${key}" exists in ${present.join(", ")} but is missing from ${missing.join(", ")}`];
}

function selfTest() {
  const fails = [];
  const eq = (label, actual, expected) => {
    if (actual !== expected) fails.push(`${label}: expected ${expected}, got ${actual}`);
  };

  // The exact defect that shipped: 3-1 (6.AT.1) handed the equivalent-ratio bank.
  eq("shipped 3-1 defect is caught", reachFailures("6.AT.1", "ratios").length > 0, true);
  // ...and the percent bank, which is a whole unit ahead.
  eq("forward reach into Unit 4 is caught", reachFailures("6.AT.1", "percent").length > 0, true);
  // Its own bank is fine.
  eq("correct bank passes", reachFailures("6.AT.1", "ratios-understand").length, 0);
  // Reaching BACK is explicitly allowed — 3-9 revisiting rates is good teaching.
  eq("backward reach is allowed", reachFailures("6.AT.3", "ratios-rate").length, 0);
  // A sub-letter is not a position: 6.AT.3a and 6.AT.3c both belong to the
  // equivalent-ratio bank, and sequencing the letters used to fail all six.
  eq("sub-letter lessons keep their own bank", reachFailures("6.AT.3a", "ratios").length, 0);
  eq("6.AT.3c keeps its own bank", reachFailures("6.AT.3c", "ratios").length, 0);
  eq("3a still may not reach percent", reachFailures("6.AT.3a", "percent").length > 0, true);
  // Unsplit topics are out of scope, not silently passed as "fine".
  eq("unsplit topic is skipped", reachFailures("6.GR.1", "area").length, 0);
  // A standard outside the strand is not judged.
  eq("foreign standard is skipped", reachFailures("6.DS.1", "ratios").length, 0);

  // Resolution: a key in three banks and not the fourth.
  const partial = { pairs: { k: 1 }, tf: { k: 1 }, sort: { k: 1 }, wyr: {} };
  eq("half-present key is caught", resolutionFailures(partial, "k").length > 0, true);
  const whole = { pairs: { k: 1 }, tf: { k: 1 }, sort: { k: 1 }, wyr: { k: 1 } };
  eq("fully present key passes", resolutionFailures(whole, "k").length, 0);
  eq("absent key passes", resolutionFailures(whole, "nope").length, 0);

  return fails;
}

/** Every lesson that actually ships a homework page — those are the only ones
    with an arcade to get wrong. Read through tools/lib/curriculum-source.mjs,
    which tools/curriculum-source-ratchet.test.mjs requires of new readers. */
function lessons() {
  const out = [];
  for (const id of listLessonDirs()) {
    if (!existsSync(lessonPath(id, "homework.html"))) continue;
    const config = tryLoadLessonConfig(id);
    if (config) out.push({ id, config });
  }
  return out;
}

function main() {
  const selfFails = selfTest();
  if (selfFails.length) {
    console.error("FAIL validate:family-games — the detectors are broken:");
    for (const f of selfFails) console.error(`  ${f}`);
    process.exit(1);
  }

  const banks = FAMILY_GAME_BANKS;
  const failures = [];

  for (const key of new Set(GAME_NAMES.flatMap((g) => Object.keys(banks[g])))) {
    failures.push(...resolutionFailures(banks, key));
  }

  const all = lessons();
  if (all.length === 0) {
    console.error("FAIL validate:family-games — swept zero lessons, so it verified nothing.");
    process.exit(1);
  }

  let checked = 0;
  for (const { id, config } of all) {
    const key = familyGameKey(config);
    const topic = detectVisualTopic(config);
    const resolved = GAME_NAMES.every((g) => Object.hasOwn(banks[g], key)) ? key : topic;
    for (const msg of reachFailures(config.standard, resolved)) {
      failures.push(`${id} (${config.standard}, "${config.title}"): ${msg}`);
    }
    if (SERVES[resolved]) checked++;
  }

  if (failures.length) {
    console.error(`FAIL validate:family-games — ${failures.length} finding(s):`);
    for (const f of failures) console.error(`  ${f}`);
    console.error("\nFix: author a bank for the lesson's own standard in");
    console.error("scripts/homework-guided-notes.mjs and map it in FAMILY_GAME_STANDARD_KEYS.");
    process.exit(1);
  }

  console.log(
    `PASS validate:family-games — ${all.length} lessons resolve to a bank; ` +
      `${checked} of them are in the split ratio/percent strand and reach no further than their own standard.`,
  );
}

main();

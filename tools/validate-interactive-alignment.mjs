#!/usr/bin/env node
/**
 * validate:interactive-alignment — the right tool for the right mathematics.
 *
 * THE DEFECT THIS EXISTS FOR. Lesson 1-4, "Math is Explaining and Sharing"
 * (5.MD.C.5), shipped a trapezoid AREA explorer labelled "Garden footprint: the
 * 6 ft bed and the 4 ft bed share a 2 ft width". The lesson's entire content is
 * defending a cereal-box packaging recommendation with VOLUME — and its own
 * practice item offers "240 square inches" as a tagged distractor precisely to
 * correct the square-versus-cubic confusion. A tool drilling a square-unit area
 * formula was sitting on the misconception the lesson exists to fix.
 *
 * Every gate in the repo passed it. The kind was in the REGISTRY, it had a
 * tool-catalog entry, it had its required fields, it rendered, it was reachable
 * from the tools drawer. Each gate asked "does this tool WORK?"; none asked
 * "does this tool belong?".
 *
 * WHERE IT CAME FROM — the part that matters more than the lesson. It was not an
 * authoring slip. tools/lesson-tool-coverage.test.mjs requires every lesson to
 * expose a tool in Explore AND in Practice, fleet-wide, and commit a0dab02d4
 * ("give every new lesson a distinct explore AND practice tool") satisfied that
 * quota for twenty lessons at once. Lesson 1-4's practice is sorting argument
 * types; it has no second manipulative to give, so one was invented. A coverage
 * quota with no alignment requirement does not produce missing tools. It
 * produces irrelevant ones, and it produces them silently.
 *
 * WHAT IS AUTOMATED AND WHAT IS NOT. Software cannot judge pedagogy from a
 * component name, and this gate does not pretend to. It checks three things that
 * ARE decidable, and hands everything else to a written human decision in
 * data/interactive-alignment-review.json:
 *
 *   TOPIC     the tool's mathematics against the standard's own `topic`, read
 *             from data/ccss-standards.json rather than inferred from the code
 *   NUMBERS   a tool whose every configured quantity is absent from its lesson
 *             is drawing a different problem
 *   CONTEXT   a label naming a scenario the lesson never mentions is a label
 *             copied from another lesson
 *
 * A flag is EVIDENCE, never a verdict: two of the three findings in the first
 * full run were correct tools with an unusual configuration, and they are
 * recorded as reviewed rather than "fixed". The ratchet is that a flagged
 * element must have a written decision. The build reports how many are awaiting
 * one, and the target is zero.
 *
 * The review file is held to the same standard as the tree: an entry whose flag
 * has disappeared must be removed, so the file cannot accumulate stale
 * absolutions for tools nobody has looked at in a year.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  extractElements,
  labelContextMisses,
  lessonNumbers,
  lessonText,
  loadStandardTopics,
  readFleet,
  SECTION_ORDER,
  TOOL_TOPICS,
  toolNumbers,
  toolsModeSlots,
  topicAgrees,
  VISUAL_KEYS,
  withoutInteractives,
} from "./lib/interactive-alignment.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const fail = (m) => failures.push(m);

/* ── Self-test: the detectors must still fire on the defect that caused this ─
 *
 * The real 1-4 configuration, verbatim as it shipped. If a future widening of
 * the topic table or the stop-word list makes this pass, the gate has stopped
 * doing the one job it was written for, and it says so here rather than
 * reporting a clean curriculum. */
const standardTopics = loadStandardTopics(ROOT);

const SHIPPED_DEFECT = {
  kind: "area-morph",
  figure: "trapezoid",
  b: 6,
  a: 4,
  h: 2,
  unit: "ft",
  label: "Garden footprint: the 6 ft bed and the 4 ft bed share a 2 ft width",
};

if (topicAgrees("area-morph", "5.MD.C.5", standardTopics)) {
  fail(
    "self-test: a plane-area tool on a volume standard is no longer flagged — the topic check has stopped firing",
  );
}
if (!topicAgrees("bar-chart", "5.MD.C.5", standardTopics)) {
  fail("self-test: the corrected 1-4 tool is now flagged — the topic table is too narrow");
}
{
  const lesson = JSON.parse(readFileSync(join(ROOT, "lessons/1-4/config.json"), "utf8"));
  const misses = labelContextMisses(SHIPPED_DEFECT, lessonText(withoutInteractives(lesson)));
  if (!misses.includes("footprint")) {
    fail(
      "self-test: the foreign-context label is no longer flagged — the label check has stopped firing",
    );
  }
  // …and the inverse. The first version of this module compared a tool's numbers
  // against a lesson set computed by walking the config that CONTAINS the tool,
  // so every tool matched itself and the fleet looked perfect.
  const bare = withoutInteractives(lesson);
  if (JSON.stringify(bare).includes("Garden footprint")) {
    fail("self-test: withoutInteractives() is not stripping tools — every tool will match itself");
  }
}
{
  // A label whose words the lesson DOES use must not be flagged.
  const clean = labelContextMisses(
    { label: "Cereal box volume" },
    "a large cereal box holds 240 cubic inches of volume",
  );
  if (clean.length) fail(`self-test: the label check false-fired on lesson vocabulary: ${clean}`);
}

/* ── The module's view of the tool slots must match the shipped collector ──── */

const slots = toolsModeSlots(ROOT);
if (slots.sections.join(",") !== SECTION_ORDER.join(",")) {
  fail(
    `the collector reads sections [${slots.sections}] but this audit reads [${SECTION_ORDER}] — tools students see are going unaudited`,
  );
}
if (slots.visualKeys.join(",") !== VISUAL_KEYS.join(",")) {
  fail(
    `the collector reads keys [${slots.visualKeys}] but this audit reads [${VISUAL_KEYS}] — tools students see are going unaudited`,
  );
}

/* ── Sweep ─────────────────────────────────────────────────────────────────── */

const fleet = readFleet(ROOT);
if (fleet.length === 0) fail("no lessons were read — the sweep found nothing to audit");

const flagged = [];
let elementCount = 0;
const kinds = new Set();

for (const lesson of fleet) {
  const bare = withoutInteractives(lesson.config);
  const numbers = lessonNumbers(bare);
  const text = lessonText(bare);
  for (const element of extractElements(lesson.config)) {
    elementCount++;
    kinds.add(element.key);
    const flags = [];

    if (!topicAgrees(element.key, lesson.config.standard, standardTopics)) {
      const topic = standardTopics.get(String(lesson.config.standard || "").toUpperCase());
      flags.push(
        `topic: ${element.key} serves ${TOOL_TOPICS[element.key]?.join("/")}, lesson is ${topic}`,
      );
    }

    const configured = toolNumbers(element.config);
    if (configured.size && [...configured.values()].every((v) => !numbers.has(v))) {
      flags.push(
        `numbers: none of ${JSON.stringify(Object.fromEntries(configured))} appear in the lesson`,
      );
    }

    const misses = labelContextMisses(element.config, text);
    if (misses.length)
      flags.push(`context: label says "${misses.join('", "')}", the lesson does not`);

    if (flags.length) {
      flagged.push({ lessonId: lesson.id, slot: element.slot, key: element.key, flags });
    }
  }
}

/* ── The review ratchet ────────────────────────────────────────────────────── */

const review = JSON.parse(
  readFileSync(join(ROOT, "data/interactive-alignment-review.json"), "utf8"),
);
const VALID = new Set(Object.keys(review.classifications || {}));
const entryKey = (e) => `${e.lessonId}|${e.slot}|${e.key}`;

const reviewed = new Map();
for (const entry of review.reviewed || []) {
  if (!VALID.has(entry.classification)) {
    fail(`review entry ${entryKey(entry)} has unknown classification "${entry.classification}"`);
  }
  if (!entry.reason || entry.reason.length < 40) {
    // A one-word reason is how an audit gets gamed: everything marked approved,
    // nothing actually read.
    fail(`review entry ${entryKey(entry)} has no substantive reason`);
  }
  if (reviewed.has(entryKey(entry)) && entry.status !== "resolved") {
    fail(`review entry ${entryKey(entry)} appears twice`);
  }
  if (entry.status !== "resolved") reviewed.set(entryKey(entry), entry);
}

/**
 * A variant inherits its parent's decision, but only when the parent SAYS so.
 *
 * 1-4's trapezoid was copied verbatim into 1-4-group1 and 1-4-group2, so every
 * defect and every correct tool arrives in triplicate. Writing the same reason
 * three times would be noise, and reviewing only the parent would be an
 * assumption — a small-group variant may legitimately need a different
 * representation from the whole-group lesson, which is the case this repo's
 * differentiation depends on. So inheritance is explicit: `appliesToVariants:
 * true` on the parent entry is a human saying "and its variants", and a variant
 * that authors a DIFFERENT tool in that slot gets no free pass, because the
 * lookup is keyed on slot AND kind.
 */
const inherited = new Map();
for (const [key, entry] of reviewed) {
  if (entry.appliesToVariants !== true) continue;
  for (const lesson of fleet) {
    if (lesson.parent !== entry.lessonId) continue;
    const variantKey = `${lesson.id}|${entry.slot}|${entry.key}`;
    if (!reviewed.has(variantKey)) inherited.set(variantKey, entry);
  }
  void key;
}

const decided = (f) => reviewed.has(entryKey(f)) || inherited.has(entryKey(f));
const awaiting = flagged.filter((f) => !decided(f));
for (const item of awaiting) {
  fail(
    `${item.lessonId} ${item.slot} (${item.key}) is flagged and has no reviewed decision:\n       ${item.flags.join("\n       ")}`,
  );
}

// Stale absolutions. An entry for something no detector flags any more — because
// it was fixed, or because the tool was removed — must go, or the file becomes a
// list of blessings nobody can re-derive.
const flaggedKeys = new Set(flagged.map(entryKey));
const lessonIds = new Set(fleet.map((l) => l.id));
for (const [key, entry] of reviewed) {
  if (flaggedKeys.has(key)) continue;
  if (!lessonIds.has(entry.lessonId)) {
    fail(`review entry ${key} names a lesson that no longer exists`);
    continue;
  }
  // Entries a human wrote for an UNflagged element are allowed and valuable —
  // that is a deliberate examination, not a stale absolution. Only entries whose
  // stated purpose was to excuse a detector flag are checked here.
  if (Array.isArray(entry.detectorFlags) && entry.detectorFlags.length) {
    fail(
      `review entry ${key} excuses detector flags that no longer fire — the tool was fixed or changed, so remove the entry`,
    );
  }
}

/* ── Report ────────────────────────────────────────────────────────────────── */

const canonical = fleet.filter((l) => l.canonical).length;
const variants = fleet.length - canonical;

if (failures.length) {
  console.error("✗ validate:interactive-alignment");
  for (const f of failures) console.error(`   - ${f}`);
  console.error(`\n   interactive mappings awaiting review: ${awaiting.length}`);
  process.exit(1);
}

console.log(
  `✓ interactive alignment holds — ${elementCount} elements across ${canonical} canonical lessons ` +
    `and ${variants} variants, ${kinds.size} kinds, ${flagged.length} flagged and ${reviewed.size} reviewed.\n` +
    `   interactive mappings awaiting review: ${awaiting.length}\n` +
    `   Note: unflagged elements are not individually human-reviewed. The three detectors ` +
    `(topic / numbers / context) are structural evidence, not a pedagogy judgement.`,
);

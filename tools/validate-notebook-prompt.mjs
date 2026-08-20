#!/usr/bin/env node
/**
 * validate-notebook-prompt.mjs — the notebook prompt may never invent a claim,
 * and may never land on a manipulative.
 *
 * WHAT THIS GATE IS FOR. The notebook prompt is derived, not authored: it tells
 * a student to do THIS problem on paper, labelled with the problem number. Two
 * ways that goes wrong, and both are silent:
 *
 *  1. IT LANDS ON A MANIPULATIVE. For a net-folder or a coordinate grid the
 *     SCREEN is the work surface. "Do #4 in your notebook" over an algebra-tiles
 *     task is not a small infelicity — it instructs the student to abandon the
 *     tool the lesson is teaching with. Exclusion is keyed off the item's own
 *     `type`, so this gate's job is to prove the keying still holds across every
 *     item on disk rather than on the handful in a unit test.
 *
 *  2. IT ASSERTS A NUMBER THE ITEM DOES NOT HAVE. A step count is a claim about
 *     the mathematics. Error-analysis items carry `workedExample`, a real array,
 *     so "about 4 steps" is a fact. Multiple-choice items carry no step array,
 *     and counting sentences in `explanation` to produce a number would be
 *     invention. This gate asserts every number a prompt prints is either the
 *     problem number it was given or a genuinely counted array length.
 *
 * COVERAGE IS REPORTED, NEVER REQUIRED — and that is the whole point rather
 * than a caveat. The copy-panel system REQUIRED a panel on every checkpoint, so
 * lessons with nothing quotable had to be given something and the only available
 * something was invention: 39 of 84 box-2 rules ended up stating another
 * lesson's mathematics. **Full coverage was the shape the invented content
 * took.** So this file prints the number and refuses to have an opinion about
 * how high it should be — except that 100% is reported as a WARNING, because a
 * prompt on every single item would mean the exclusions had stopped working.
 *
 * Self-tests its detectors before sweeping. A gate that has stopped firing
 * reports a perfectly clean curriculum, which is what every gate said on the day
 * the copy panels shipped.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  derivedStepCount,
  NOTEBOOK_PROMPT_TYPES,
  notebookPromptFor,
  SCREEN_IS_THE_WORK_SURFACE,
} from "../engine/core/notebook-prompt.js";
import { assertNonEmpty } from "./lib/non-empty.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const fail = (m) => failures.push(m);

/* ── Self-test the detectors ───────────────────────────────────────────────── */

const selfTests = [
  ["a manipulative gets no prompt", () => notebookPromptFor({ type: "net-folder" }, 1) === null],
  ["multiple-choice gets a prompt", () => !!notebookPromptFor({ type: "multiple-choice" }, 1)],
  [
    "prose never becomes a step count",
    () =>
      notebookPromptFor({ type: "multiple-choice", explanation: "One. Two. Three." }, 1).steps ===
      null,
  ],
  [
    "a real array does become a step count",
    () => derivedStepCount({ workedExample: [{}, {}, {}] }) === 3,
  ],
  [
    "an unknown type defaults to silence",
    () => notebookPromptFor({ type: "brand-new-kind" }, 1) === null,
  ],
];

for (const [name, fn] of selfTests) {
  let ok = false;
  try {
    ok = fn();
  } catch (e) {
    fail(`self-test threw — ${name}: ${String(e).slice(0, 120)}`);
  }
  if (!ok) fail(`DETECTOR REGRESSED — ${name}`);
}
if (failures.length) {
  console.error("✗ validate:notebook-prompt — detector self-tests failed, findings are unreliable");
  for (const m of failures) console.error(`   - ${m}`);
  process.exit(1);
}

/* ── Sweep every core lesson ───────────────────────────────────────────────── */

const LESSONS = join(ROOT, "lessons");
const dirs = readdirSync(LESSONS).filter(
  (d) => existsSync(join(LESSONS, d, "config.json")) && !/-group\d|-catchup/.test(d),
);
assertNonEmpty(
  "core lesson configs",
  dirs,
  "Expected lessons/<id>/config.json for the 84 core lessons.",
);

const TIERS = ["approaching", "onLevel", "extending", "optional"];
let items = 0;
let prompted = 0;
let withSteps = 0;
const byType = {};

for (const d of dirs) {
  let cfg;
  try {
    cfg = JSON.parse(readFileSync(join(LESSONS, d, "config.json"), "utf8"));
  } catch (e) {
    fail(`${d}/config.json did not parse (${String(e).slice(0, 80)})`);
    continue;
  }
  for (const tier of TIERS) {
    const list = cfg.practice?.[tier];
    if (!Array.isArray(list)) continue;
    list.forEach((item, i) => {
      items++;
      const number = i + 1;
      const p = notebookPromptFor(item, number);
      if (!p) return;
      prompted++;
      byType[item.type] = (byType[item.type] || 0) + 1;

      const where = `${d} ${tier}#${number} (${item.type})`;

      // 1. Never on a manipulative.
      if (SCREEN_IS_THE_WORK_SURFACE.has(item.type)) {
        fail(
          `${where}: a manipulative received a notebook prompt — the screen is the work surface`,
        );
      }
      if (!NOTEBOOK_PROMPT_TYPES.has(item.type)) {
        fail(`${where}: an untargeted type received a prompt`);
      }

      // 2. Every number printed must be the problem number or a counted length.
      const counted = derivedStepCount(item);
      if (p.steps != null) {
        withSteps++;
        if (p.steps !== counted) {
          fail(`${where}: prompt claims ${p.steps} steps but the item counts ${counted}`);
        }
      }
      const allowed = new Set([String(number)]);
      if (p.steps != null) allowed.add(String(p.steps));
      for (const lane of [p.en, p.es]) {
        for (const n of lane.match(/\d+/g) || []) {
          if (!allowed.has(n)) {
            fail(
              `${where}: prompt prints "${n}", which is neither the problem number nor a counted step total — "${lane}"`,
            );
          }
        }
      }

      // 3. Spanish parity: an instruction that exists in English exists in Spanish.
      if (!p.es || !p.es.trim()) fail(`${where}: prompt has no Spanish lane`);
      if (p.es === p.en) fail(`${where}: the Spanish lane is the English string`);
    });
  }
}

assertNonEmpty("practice items swept", [items], "No practice items were read at all.", 1);

if (failures.length) {
  console.error("✗ validate:notebook-prompt");
  for (const m of failures.slice(0, 30)) console.error(`   - ${m}`);
  if (failures.length > 30) console.error(`   … and ${failures.length - 30} more`);
  process.exit(1);
}

const pct = items ? (100 * prompted) / items : 0;
console.log(
  `✓ notebook prompts hold — ${prompted} of ${items} core practice item(s) prompted ` +
    `(${pct.toFixed(1)}%), ${withSteps} with a counted step total, 0 on a manipulative.`,
);
console.log(`   by type: ${JSON.stringify(byType)}`);
console.log(
  "   Coverage is REPORTED, not required. Absence is a pass: an item that derives no prompt " +
    "is correct, not a gap to fill. Requiring a field everywhere is what produced 39 lessons of " +
    "invented copy-panel content.",
);
if (pct >= 100) {
  console.log(
    "   WARNING: 100% coverage means the exclusions have stopped firing — every manipulative " +
      "should be silent. Investigate before celebrating.",
  );
}

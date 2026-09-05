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
  lessonModelFrom,
  modelParts,
  NOTEBOOK_PROMPT_TYPES,
  notebookPromptFor,
  SCREEN_IS_THE_WORK_SURFACE,
} from "@eduwonderlab/engine/core/notebook-prompt.js";
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
      notebookPromptFor({ type: "multiple-choice", explanation: "One. Two. Three." }, 1)
        .stepCount === null,
  ],
  [
    "the model is quoted whole, never clipped",
    () =>
      lessonModelFrom({
        launch: {
          conceptIntro: { keyIdea: "X. Formula: Total ÷ Group Size = Number of Groups. 1. a" },
        },
      }) === "Total ÷ Group Size = Number of Groups",
  ],
  [
    "a Formula: label with no operator is not a model",
    () =>
      lessonModelFrom({ launch: { conceptIntro: { keyIdea: "Formula: think about units" } } }) ===
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
let modelled = 0;
const byType = {};

for (const d of dirs) {
  let cfg;
  try {
    cfg = JSON.parse(readFileSync(join(LESSONS, d, "config.json"), "utf8"));
  } catch (e) {
    fail(`${d}/config.json did not parse (${String(e).slice(0, 80)})`);
    continue;
  }
  const model = lessonModelFrom(cfg);
  for (const tier of TIERS) {
    const list = cfg.practice?.[tier];
    if (!Array.isArray(list)) continue;
    list.forEach((item, i) => {
      items++;
      const number = i + 1;
      const p = notebookPromptFor(item, number, model);
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
      if (p.stepCount != null) {
        withSteps++;
        if (p.stepCount !== counted) {
          fail(`${where}: setup claims ${p.stepCount} steps but the item counts ${counted}`);
        }
      }
      // The MODEL is exempt from the number rule: it is a verbatim quote of the
      // lesson's own formula, which legitimately contains its own numerals
      // ("IQR = Q3 - Q1"). It is checked separately, below, for being a quote.
      const allowed = new Set([String(number)]);
      if (p.stepCount != null) allowed.add(String(p.stepCount));
      const lanes = [p.head, p.headEs, ...p.steps.flatMap((st) => [st.en, st.es])];
      for (const lane of lanes) {
        for (const n of lane.match(/\d+/g) || []) {
          if (!allowed.has(n)) {
            fail(
              `${where}: setup prints "${n}", which is neither the problem number nor a counted step total — "${lane}"`,
            );
          }
        }
      }

      // 3. The model must be a VERBATIM substring of the lesson's own key idea.
      //    This is the check that keeps rule 2 honest: a composed or reworded
      //    formula would not appear in the source it claims to quote.
      if (p.model) {
        modelled++;
        const keyIdea = cfg.launch?.conceptIntro?.keyIdea || "";
        if (!keyIdea.includes(p.model)) {
          fail(`${where}: model "${p.model}" is not a verbatim quote of this lesson's keyIdea`);
        }
        // Each RENDERED part must be a quote too. The card shows one box per
        // formula, so the whole string being quotable is not enough — a split
        // that composed a new string would render mathematics no lesson wrote.
        const parts = modelParts(p.model);
        if (!parts.length) fail(`${where}: model "${p.model}" split to nothing`);
        for (const part of parts) {
          if (!keyIdea.includes(part)) {
            fail(`${where}: rendered model part "${part}" is not a verbatim quote of the keyIdea`);
          }
          if (part.includes("|")) {
            fail(`${where}: rendered model part still contains the separator — "${part}"`);
          }
        }
      }

      // 4. Spanish parity: an instruction that exists in English exists in
      //    Spanish. The model is deliberately excluded — no lesson authors
      //    keyIdeaEs, and translating a formula here would invent vocabulary.
      if (!p.headEs?.trim()) fail(`${where}: head has no Spanish lane`);
      for (const st of p.steps) {
        if (!st.es?.trim()) fail(`${where}: a step has no Spanish lane`);
        if (st.es === st.en) fail(`${where}: a step's Spanish lane is the English string`);
      }
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

/* ── Small group must NOT receive a setup block ────────────────────────────── */

/* Small group already tells students to use their notebook TWICE — every item
 * carries `.sg-notebook-cue` and the section carries `soloDir`. A setup block
 * was added here on 2026-08-20 and removed the same day, because it made a
 * third instruction per problem (measured live: 7 of 7 independent items and
 * 4 of 4 "more practice" items already had the cue).
 *
 * This asserts the absence, so re-adding it is a deliberate act rather than an
 * accident: `guided-fill` is every one of the small-group practice items, and
 * none of them may derive a setup. */
const sgDirs = readdirSync(LESSONS).filter(
  (d) => /-group\d$/.test(d) && existsSync(join(LESSONS, d, "config.json")),
);
assertNonEmpty("small-group configs", sgDirs, "Expected lessons/<id>-groupN/config.json.");

let sgSilent = 0;
for (const d of sgDirs) {
  let cfg;
  try {
    cfg = JSON.parse(readFileSync(join(LESSONS, d, "config.json"), "utf8"));
  } catch {
    continue;
  }
  for (const item of cfg.parallelPractice || []) {
    if (notebookPromptFor(item, 1, lessonModelFrom(cfg)) !== null) {
      fail(
        `${d}: a ${item.type} item derived a notebook setup — small group already shows ` +
          "`.sg-notebook-cue` and `soloDir`, so this would be a third instruction per problem",
      );
    } else {
      sgSilent++;
    }
  }
}

const pct = items ? (100 * prompted) / items : 0;
console.log(
  `✓ notebook prompts hold — ${prompted} of ${items} core practice item(s) prompted ` +
    `(${pct.toFixed(1)}%), ${modelled} carrying the lesson's own quoted formula, ` +
    `${withSteps} with a counted step total, 0 on a manipulative.`,
);
console.log(`   by type: ${JSON.stringify(byType)}`);
console.log(
  `   small group: ${sgSilent} item(s) correctly derive NO setup — that surface already shows ` +
    "its own notebook cue, and the compare line rides on that cue instead.",
);
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

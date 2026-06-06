#!/usr/bin/env node
/**
 * Guarantee every lesson config has substantive practice across tiers.
 *
 * Ensures per lesson:
 *   - ≥3 approaching (Level 1)
 *   - ≥3 onLevel (core)
 *   - ≥1 extending or optional stretch item
 *   - Mix of interactive types (MC, drag-sort, fill/matching where possible)
 *
 * Run: node scripts/ensure-practice-problems.mjs
 * Idempotent — only appends missing items; never removes authored content.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const lessonsDir = join(root, "lessons");
const LESSON_DIR_RE = /^(\d+)-(\d+)(-flagship)?$/;

const TIERS = ["approaching", "onLevel", "extending", "optional"];
const MIN = { approaching: 3, onLevel: 3, extending: 1, optional: 1 };

function keyIdea(config) {
  return (
    config.launch?.conceptIntro?.keyIdea ||
    config.conceptIntro?.keyIdea ||
    config.contentObjective?.replace(/^I can\s+/i, "") ||
    config.title ||
    "today's math idea"
  );
}

function vocabTerms(config, n = 4) {
  return (config.vocabulary || []).slice(0, n).map((v) => v.term).filter(Boolean);
}

function themeNoun(config) {
  const theme = (config.theme || "real world").replace(/-/g, " ");
  return theme;
}

function hasType(tier, type) {
  return tier.some((p) => p?.type === type);
}

function stemExists(allProblems, stem) {
  const norm = String(stem || "").trim().toLowerCase();
  return allProblems.some((p) => {
    const s = p.stem || p.instructions || p.label || p.title || "";
    return String(s).trim().toLowerCase() === norm;
  });
}

function makeMc(config, stem, choices, correctIndex, explanation) {
  return {
    type: "multiple-choice",
    stem,
    choices,
    correctIndex,
    explanation,
  };
}

function makeDragSort(config, instructions, items, categories) {
  return {
    type: "drag-sort",
    instructions,
    items,
    categories,
  };
}

function makeMatching(config, stem, pairs) {
  return {
    type: "matching",
    stem,
    pairs,
  };
}

function makeStretchError(config, tierName) {
  const idea = keyIdea(config);
  const title = config.title || "this lesson";
  return {
    type: "error-analysis",
    title: `${tierName} — Spot the Common Mistake`,
    workedExample: [
      { label: "Read", work: `A student is working on ${title}.` },
      { label: "Attempt", work: idea ? `They ignored the rule: ${idea}` : "They skipped a key step." },
      { label: "Check", work: "The answer does not match the math rule from class." },
    ],
    errorStep: 1,
    correctWork: idea ? `Follow the key idea: ${idea}` : "Re-read the problem and apply each step carefully.",
    hints: [
      "Which step breaks the rule you learned today?",
      idea ? `Remember: ${idea}` : "Check your work against today's objective.",
    ],
  };
}

/** Lesson-specific generators keyed by unit (and flagship overrides). */
function generatorsFor(config) {
  const unit = Number(config.unit);
  const idea = keyIdea(config);
  const terms = vocabTerms(config);
  const theme = themeNoun(config);
  const title = config.title || "this lesson";

  if (unit === 8 && /statistical|6\.SP\.1/i.test(`${config.standard} ${title}`)) {
    return {
      approaching: () => [
        makeMc(
          config,
          `Which question is a statistical question about ${theme}?`,
          [
            `How many hours of sleep did each student on the team get last night?`,
            `How many players are on a basketball team?`,
            `What sport uses a round ball?`,
            `How many quarters are in one game?`,
          ],
          0,
          "Statistical questions expect different answers from different people or cases.",
        ),
        makeDragSort(
          config,
          "Sort each scouting question into Statistical or Not Statistical.",
          [
            { text: `How many points does each player score per game?`, category: "statistical" },
            { text: `How many timeouts does each team get per half?`, category: "not" },
            { text: `How far can each athlete throw the ball?`, category: "statistical" },
            { text: `What is the length of the court in feet?`, category: "not" },
          ],
          [
            { id: "statistical", label: "Statistical" },
            { id: "not", label: "Not Statistical" },
          ],
        ),
        makeMatching(config, "Match each question to its type.", [
          { left: "How tall is each player on the roster?", right: "Statistical" },
          { left: "What color are the team jerseys?", right: "Not Statistical" },
          { left: "How many laps does each runner complete?", right: "Statistical" },
          { left: "How many innings are in a baseball game?", right: "Not Statistical" },
        ]),
      ],
      onLevel: () => [
        makeMc(
          config,
          `Why is "${`How many minutes does each athlete practice per week?`}" a statistical question?`,
          [
            "Because different athletes practice different amounts of time",
            "Because it mentions minutes",
            "Because it is about sports",
            "Because every athlete practices the same amount",
          ],
          0,
          "A statistical question anticipates variability in the data collected.",
        ),
        makeMc(
          config,
          "A reporter asks, \"How many goals did the team score in total?\" Why is this NOT the best statistical question for comparing players?",
          [
            "It gives one total number and hides variability among players",
            "It uses the word goals",
            "It is about soccer",
            "It has too many words",
          ],
          0,
          "Per-player data shows variability; one total hides individual differences.",
        ),
      ],
      optional: () => [
        makeMc(
          config,
          "Which rewrite turns a non-statistical question into a statistical one?",
          [
            '"How many books did each student read this month?" (was: "How many books are in the library?")',
            '"How many days are in March?" (was: "How many days are in a week?")',
            '"What is the school mascot?" (was: "What color is the gym?")',
            '"How many players are on the field?" (was: "How many teams are in the league?")',
          ],
          0,
          'Adding "each student" creates variability — different students read different numbers of books.',
        ),
      ],
    };
  }

  if (unit === 8 && /distribution|shape|6\.SP\.2/i.test(`${config.standard} ${title}`)) {
    return {
      approaching: () => [
        makeMc(
          config,
          "Bar heights left to right: 8, 5, 3, 1. What is the shape?",
          ["Skewed right", "Symmetric", "Skewed left", "Uniform"],
          0,
          "Tall bars on the left with a tail stretching right is skewed right.",
        ),
        makeMatching(config, "Match each description to its distribution shape.", [
          { left: "Equal data on both sides of the center", right: "Symmetric" },
          { left: "Peak on the left, tail to the right", right: "Skewed Right" },
          { left: "Peak on the right, tail to the left", right: "Skewed Left" },
          { left: "Values bunched tightly together", right: "Cluster" },
        ]),
      ],
      onLevel: () => [
        makeMc(
          config,
          "Most values cluster at 40–60 with a few at 90–100. What shape and best center?",
          ["Skewed right; use median", "Symmetric; use mean", "Skewed left; use median", "Uniform; use mean"],
          0,
          "High outliers on the right create a right skew; median resists the pull of extremes.",
        ),
      ],
    };
  }

  // Generic fallback from lesson metadata
  const term = terms[0] || "vocabulary";
  return {
    approaching: () => [
      makeMc(
        config,
        `Which step best applies today's key idea about ${title.toLowerCase()}?`,
        [
          `Check the work against: ${idea}`,
          "Skip straight to the answer without reading",
          "Ignore the units in the problem",
          "Use a rule from a different lesson",
        ],
        0,
        `Today's key idea: ${idea}`,
      ),
      makeMc(
        config,
        `Which statement uses the vocabulary word "${term}" correctly?`,
        [
          `${term} is used the way we defined it in class today`,
          `${term} means the opposite of what we learned`,
          `${term} is only a label with no math meaning`,
          `${term} replaces every number in the problem`,
        ],
        0,
        `Remember: ${(config.vocabulary?.[0]?.definition) || term}`,
      ),
    ],
    onLevel: () => [
      makeMc(
        config,
        `A ${theme} problem asks you to explain your reasoning. What should you include?`,
        [
          "The math steps and vocabulary from today's lesson",
          "Only the final number with no explanation",
          "A story unrelated to the problem",
          "Definitions from a different unit",
        ],
        0,
        "Strong answers connect steps to the standard and use lesson vocabulary.",
      ),
    ],
    optional: () => [
      makeMc(
        config,
        `Stretch: How would you check whether your answer to a ${title.toLowerCase()} problem is reasonable?`,
        [
          `Compare it to the key idea: ${idea}`,
          "Assume the first answer is always correct",
          "Change the problem to an easier one",
          "Skip checking and submit immediately",
        ],
        0,
        "Reasonableness checks tie back to the key idea and the given information.",
      ),
    ],
  };
}

function ensureTier(config, tierName, items, allProblems, stats) {
  if (!Array.isArray(items)) items = [];
  const min = MIN[tierName] ?? 1;
  const need = Math.max(0, min - items.length);
  if (need === 0 && (tierName !== "extending" || items.length > 0)) {
    return items;
  }

  const gens = generatorsFor(config);
  const pool =
    (gens[tierName === "extending" ? "optional" : tierName]?.() || gens.approaching?.() || []);

  for (const candidate of pool) {
    if (items.length >= min) break;
    const stem = candidate.stem || candidate.instructions || candidate.label || candidate.title;
    if (stemExists([...allProblems, ...items], stem)) continue;
    items.push(candidate);
    stats.added++;
    stats.byTier[tierName] = (stats.byTier[tierName] || 0) + 1;
  }

  while (items.length < min) {
    const filler = makeStretchError(config, tierName);
    if (!stemExists([...allProblems, ...items], filler.title)) {
      items.push(filler);
      stats.added++;
      stats.byTier[tierName] = (stats.byTier[tierName] || 0) + 1;
    } else break;
  }

  return items;
}

const lessonIds = readdirSync(lessonsDir)
  .filter((d) => LESSON_DIR_RE.test(d) && existsSync(join(lessonsDir, d, "config.json")))
  .sort();

const stats = {
  lessons: lessonIds.length,
  missingBefore: 0,
  fixedLessons: 0,
  added: 0,
  byTier: {},
  rendererIssues: 0,
};

const report = [];

for (const id of lessonIds) {
  const path = join(lessonsDir, id, "config.json");
  const config = JSON.parse(readFileSync(path, "utf8"));
  let changed = false;

  if (!config.practice) config.practice = {};

  const before = {};
  for (const t of TIERS) {
    before[t] = Array.isArray(config.practice[t]) ? config.practice[t].length : 0;
    if (before[t] < (MIN[t] ?? 0)) stats.missingBefore++;
  }

  const allProblems = TIERS.flatMap((t) => config.practice[t] || []);

  // Flag matching items missing pairs (renderer used to auto-skip these)
  for (const p of allProblems) {
    if (p.type === "matching" && (!Array.isArray(p.pairs) || p.pairs.length === 0)) {
      stats.rendererIssues++;
    }
  }

  const lessonStats = { added: 0, byTier: {} };
  for (const tierName of ["approaching", "onLevel", "extending"]) {
    const updated = ensureTier(
      config,
      tierName,
      config.practice[tierName] || [],
      allProblems,
      lessonStats,
    );
    if (JSON.stringify(updated) !== JSON.stringify(config.practice[tierName] || [])) {
      config.practice[tierName] = updated;
      changed = true;
    }
  }

  if (!Array.isArray(config.practice.optional) || config.practice.optional.length < MIN.optional) {
    const updated = ensureTier(
      config,
      "optional",
      config.practice.optional || [],
      TIERS.flatMap((t) => config.practice[t] || []),
      lessonStats,
    );
    if (JSON.stringify(updated) !== JSON.stringify(config.practice.optional || [])) {
      config.practice.optional = updated;
      changed = true;
    }
  }

  if (lessonStats.added > 0) {
    stats.fixedLessons++;
    stats.added += lessonStats.added;
    for (const [k, v] of Object.entries(lessonStats.byTier)) {
      stats.byTier[k] = (stats.byTier[k] || 0) + v;
    }
    report.push(`${id}: +${lessonStats.added} (${config.title})`);
  }

  if (changed) {
    writeFileSync(path, JSON.stringify(config, null, 2) + "\n", "utf8");
  }
}

console.log("Practice ensure report");
console.log("====================");
console.log(`Lessons scanned: ${stats.lessons}`);
console.log(`Tier slots below minimum (before): ${stats.missingBefore}`);
console.log(`Lessons updated: ${stats.fixedLessons}`);
console.log(`Problems added: ${stats.added}`);
console.log(`Matching items missing pairs: ${stats.rendererIssues}`);
if (report.length) {
  console.log("\nUpdated lessons:");
  report.forEach((line) => console.log(`  ${line}`));
} else {
  console.log("\nAll lessons already meet practice minimums.");
}
console.log("\nBy tier:", stats.byTier);

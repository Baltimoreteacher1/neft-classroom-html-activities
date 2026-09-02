#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { MATH_CHECKS } from "../engine/core/small-group-math-check.js";
import { FACILITATION_BY_LESSON } from "../functions/teacher-small-group/_facilitation-data.js";
import { authoredBank } from "./lib/small-group-authored-banks.mjs";
import { assertSweptEnough } from "./lib/sweep-guard.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BASE_RE = /^\d+-\d+$/;
const REQUIRED = ["launch", "explore", "practice", "connect", "reflect"];

// Editorial copy gate (LESSON_PRODUCT_FACTORY.md:110-111 — "no AI filler").
// Unambiguous AI-puffery only: words that never carry concrete classroom
// meaning here, so a hit is real filler, not a false positive. Deliberately
// EXCLUDES "unlock" — in these mission/game configs it is always concrete
// ("unlock the door", "Division unlocks a multiplication equation").
const BANNED_COPY = [
  "delve",
  "robust",
  "seamless",
  "game-changing",
  "game changer",
  "leverage",
  "utilize",
  "tapestry",
  "elevate your",
  "dive into",
  "in today's fast-paced",
  "furthermore",
  "moreover",
];
const BANNED_RE = new RegExp(
  "\\b(" + BANNED_COPY.map((w) => w.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")).join("|") + ")\\b",
  "i",
);

function fail(message) {
  throw new Error(`small-groups: ${message}`);
}

// Scan the student-facing string values of a config for banned filler words.
function assertCopyQuality(config, id) {
  const scan = (value) => {
    if (typeof value === "string") {
      const m = value.match(BANNED_RE);
      if (m)
        fail(
          `${id} student copy uses flagged AI-filler word "${m[1]}" (see LESSON_PRODUCT_FACTORY.md). Rewrite in plain teacher voice.`,
        );
    } else if (Array.isArray(value)) {
      value.forEach(scan);
    } else if (value && typeof value === "object") {
      for (const [key, child] of Object.entries(value)) {
        // Skip non-prose identifiers/paths.
        if (["href", "standard", "lessonId", "variant", "theme", "kind", "type"].includes(key))
          continue;
        scan(child);
      }
    }
  };
  scan(config);
}

function count(text, needle) {
  return text.split(needle).length - 1;
}

function assertPair(parent, pair) {
  const groups = pair.map((row) => row.group).sort((a, b) => a - b);
  if (pair.length !== 2 || groups[0] !== 1 || groups[1] !== 2)
    fail(`${parent} must have exactly Group 1 and Group 2`);

  for (const group of [1, 2]) {
    const row = pair.find((candidate) => candidate.group === group);
    if (row.id !== `${parent}-group${group}`)
      fail(`${parent} Group ${group} has unexpected id ${row.id}`);
  }
}

function matchingDetailsEnd(html, start) {
  const tagRe = /<details\b[^>]*>|<\/details>/g;
  tagRe.lastIndex = start;
  let depth = 0;
  let match;
  while ((match = tagRe.exec(html))) {
    if (match[0].startsWith("<details")) depth++;
    else if (--depth === 0) return tagRe.lastIndex;
  }
  fail(`unclosed curriculum dropdown at byte ${start}`);
}

function lessonBlock(html, lessonId) {
  const href = `href="/lessons/${lessonId}/"`;
  let at = -1;
  while ((at = html.indexOf(href, at + 1)) !== -1) {
    const start = html.lastIndexOf("<details", at);
    if (start === -1) continue;
    const openEnd = html.indexOf(">", start);
    const classes =
      html
        .slice(start, openEnd + 1)
        .match(/class="([^"]*)"/)?.[1]
        ?.split(/\s+/) || [];
    if (!classes.includes("lesson")) continue;
    const end = matchingDetailsEnd(html, start);
    if (at < end) return { start, end, at, classes };
  }
  fail(`${lessonId} curriculum dropdown is missing`);
}

function assertCurriculumOrder(html, parent, pair) {
  const group1 = pair.find((row) => row.group === 1);
  const group2 = pair.find((row) => row.group === 2);
  const group1Href = `href="/lessons/${group1.id}/"`;
  const group2Href = `href="/lessons/${group2.id}/"`;
  const parentBlock = lessonBlock(html, parent);
  const group1Block = lessonBlock(html, group1.id);
  const group2Block = lessonBlock(html, group2.id);
  if (count(html, group1Href) !== 1 || count(html, group2Href) !== 1)
    fail(`${parent} small-group links must each appear once`);
  if (!(parentBlock.start < group1Block.start && group1Block.start < group2Block.start))
    fail(`${parent} must appear in parent, Group 1, Group 2 order`);
  if (html.indexOf("<details", parentBlock.end) !== group1Block.start)
    fail(`${parent} Group 1 must sit directly below its parent lesson`);
  if (html.indexOf("<details", group1Block.end) !== group2Block.start)
    fail(`${parent} Group 2 must sit directly below Group 1`);

  const dotted = parent.replace("-", ".");
  const firstSummary = html.slice(group1Block.start, group1Block.at);
  const secondSummary = html.slice(group2Block.start, group2Block.at);
  if (!firstSummary.includes(`${dotted} Small Group: Group 1`))
    fail(`${group1.id} heading must start with ${dotted}`);
  if (!secondSummary.includes(`${dotted} Small Group: Group 2`))
    fail(`${group2.id} heading must start with ${dotted}`);
}

function assertConfig(root, parent, row) {
  const lessonDir = join(root, "lessons", row.id);
  const page = join(lessonDir, "index.html");
  const configPath = join(lessonDir, "config.json");
  if (!existsSync(page) || !existsSync(configPath)) fail(`${row.id} page/config is missing`);

  const config = JSON.parse(readFileSync(configPath, "utf8"));
  const dotted = parent.replace("-", ".");
  if (config.lessonId !== row.id) fail(`${row.id} config lessonId does not match`);
  if (config.variant !== `group${row.group}`)
    fail(`${row.id} variant does not match Group ${row.group}`);
  if (row.group === 2 && !MATH_CHECKS[parent])
    fail(`${row.id} is missing its topic-specific math check`);
  if (!String(config.title || "").startsWith(`${dotted} Small Group`))
    fail(`${row.id} title must begin with ${dotted} Small Group`);
  if (config.smallGroup || JSON.stringify(config).includes('"listenFor"'))
    fail(`${row.id} public config contains facilitation data`);
  if (FACILITATION_BY_LESSON[row.id]?.group !== row.group)
    fail(`${row.id} protected facilitation metadata does not match`);
  for (const key of REQUIRED) if (!config[key]) fail(`${row.id} missing required ${key} section`);
  if (!config.noticeAndWonder?.context) fail(`${row.id} missing lesson-specific mission context`);
  if (!Array.isArray(config.turnAndTalk) || config.turnAndTalk.length === 0)
    fail(`${row.id} missing lesson-specific math talk`);
  if (!Array.isArray(config.vocabulary) || config.vocabulary.length < 2)
    fail(`${row.id} needs at least two vocabulary entries`);
  assertCopyQuality(config, row.id);
  const practiceCount = ["approaching", "onLevel", "extending", "optional"].reduce(
    (total, tier) => total + (config.practice?.[tier]?.length || 0),
    0,
  );
  if (practiceCount < 3) fail(`${row.id} needs at least three practice items`);
  // The 12 is a truncation detector for the GENERATED families, which all emit
  // twelve. A lesson with an authored bank declares its own length, and a
  // teacher-led group is better served by six tasks worth discussing than by
  // twelve worth finishing — so assert against the authored length instead of
  // relaxing the check.
  // The 12 is a truncation detector for the GENERATED guided-fill families, which
  // all emit twelve. A lesson whose practice was authored against its own
  // objective has NO generated family — its tasks are reasoning items living in
  // the practice tiers, and parallelPractice is a guided-fill slot. Assert the
  // absence rather than relaxing the count, so a truncated run is still caught
  // everywhere else and an authored lesson cannot quietly regain a drill bank.
  const parallel = config.parallelPractice || [];
  if (authoredBank(parent, row.group)) {
    if (parallel.length)
      fail(
        `${row.id} has an authored practice set, so it should carry no parallel-practice bank (has ${parallel.length})`,
      );
  } else if (parallel.length !== 12) {
    fail(`${row.id} needs exactly 12 parallel-practice problems (has ${parallel.length})`);
  }
  const parentConfig = JSON.parse(
    readFileSync(join(root, "lessons", parent, "config.json"), "utf8"),
  );
  const parentStems = new Set(
    ["approaching", "onLevel", "extending", "optional"].flatMap((tier) =>
      (parentConfig.practice?.[tier] || []).map(
        (item) => item.stem || item.title || item.instructions || item.prompt,
      ),
    ),
  );
  const ids = new Set();
  const stems = new Set();
  for (const item of parallel) {
    if (!item.id || ids.has(item.id)) fail(`${row.id} parallel-practice IDs must be unique`);
    ids.add(item.id);
    if (stems.has(item.stem)) fail(`${row.id} repeats a parallel-practice stem`);
    stems.add(item.stem);
    if (parentStems.has(item.stem)) fail(`${row.id} repeats a parent-lesson problem`);
    if (item.answer == null || !item.visual?.kind || item.steps?.length < 2)
      fail(`${row.id}/${item.id} needs an answer, visual, and guided steps`);
  }
}

export function validateSmallGroups({ html, rows, root = ROOT }) {
  if (!Array.isArray(rows) || rows.length === 0) fail("small-group row manifest is empty");
  const byParent = new Map();
  for (const row of rows) {
    if (!byParent.has(row.afterLesson)) byParent.set(row.afterLesson, []);
    byParent.get(row.afterLesson).push(row);
  }

  /* A lesson is a directory that HOLDS a lesson, not merely a directory whose
   * name looks like one.
   *
   * Renumbering moves content with `git mv`, and git does not track
   * directories, so the source directory survives on disk in every checkout
   * that already had it — empty, untracked, ignored by nothing. The 2026-08-10
   * publisher renumber left four that way (4-6 → 3-10, 4-7 → 3-8, plus 7-10 and
   * 7-11), and because this gate counted directories it read them as four
   * lessons with no small-group variants and failed:
   *
   *   small-groups: manifest covers 84 parents but 88 base lessons exist
   *
   * Nothing was missing. The gate was counting residue, and it failed only in
   * the checkouts that happened to predate the move — green in CI, red on the
   * machine doing the work, which is the worst possible place for a gate to
   * disagree with itself. Requiring config.json makes the count mean what its
   * error message already claims it means. A real lesson still has one, so a
   * real lesson with no rows still fails here. */
  const baseLessons = readdirSync(join(root, "lessons"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && BASE_RE.test(entry.name))
    .filter((entry) => existsSync(join(root, "lessons", entry.name, "config.json")))
    .map((entry) => entry.name)
    .sort();
  if (byParent.size !== baseLessons.length)
    fail(`manifest covers ${byParent.size} parents but ${baseLessons.length} base lessons exist`);

  for (const parent of baseLessons) {
    const pair = byParent.get(parent) || [];
    assertPair(parent, pair);
    assertCurriculumOrder(html, parent, pair);
    for (const row of pair) assertConfig(root, parent, row);
  }

  return { parents: byParent.size, variants: rows.length };
}

function main() {
  const html = readFileSync(join(ROOT, "curriculum", "units", "index.html"), "utf8");
  const rows = JSON.parse(readFileSync(join(ROOT, "tools", "small-group-rows.json"), "utf8"));
  const result = validateSmallGroups({ html, rows });
  // The checks below judge the rows that were found. Nothing judged whether any
  // were: small-group-rows.json is GENERATED, so a regeneration that produced an
  // empty array would have printed "✓ Small-group lessons: 0 parents, 0 variants,
  // hierarchy and content valid" and exited 0.
  assertSweptEnough(
    "validate:small-groups",
    result.variants,
    "Discovery for validate:small-groups returned far fewer variants than this gate's pinned floor — tools/small-group-rows.json is generated; check it was rebuilt, not emptied.",
  );
  console.log(
    `✓ Small-group lessons: ${result.parents} parents, ${result.variants} variants, hierarchy and content valid`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { FACILITATION_BY_LESSON } from "../functions/teacher-small-group/_facilitation-data.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BASE_RE = /^\d+-\d+$/;
const REQUIRED = ["launch", "explore", "practice", "connect", "reflect"];

function fail(message) {
  throw new Error(`small-groups: ${message}`);
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
  const practiceCount = ["approaching", "onLevel", "extending", "optional"].reduce(
    (total, tier) => total + (config.practice?.[tier]?.length || 0),
    0,
  );
  if (practiceCount < 3) fail(`${row.id} needs at least three practice items`);
}

export function validateSmallGroups({ html, rows, root = ROOT }) {
  if (!Array.isArray(rows) || rows.length === 0) fail("small-group row manifest is empty");
  const byParent = new Map();
  for (const row of rows) {
    if (!byParent.has(row.afterLesson)) byParent.set(row.afterLesson, []);
    byParent.get(row.afterLesson).push(row);
  }

  const baseLessons = readdirSync(join(root, "lessons"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && BASE_RE.test(entry.name))
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
  const html = readFileSync(join(ROOT, "curriculum", "index.html"), "utf8");
  const rows = JSON.parse(readFileSync(join(ROOT, "tools", "small-group-rows.json"), "utf8"));
  const result = validateSmallGroups({ html, rows });
  console.log(
    `✓ Small-group lessons: ${result.parents} parents, ${result.variants} variants, hierarchy and content valid`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

// Spanish coverage: every learner-facing string the Fluency Lab passes through t(), plus the trail data it
// shows (stop names, ideas, focus lines, tips, stickers, ranks), has a Spanish entry with the same placeholders.
import { readdirSync, readFileSync } from "node:fs";

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: { getItem: () => null, setItem() {}, removeItem() {} },
});
Object.defineProperty(globalThis, "window", { configurable: true, value: globalThis });
const dir = new URL("../math/fluency-lab/", import.meta.url);
const { ES: ES_BASE } = await import("../math/fluency-lab/i18n-es.js");
const { ES_MODELS } = await import("../math/fluency-lab/i18n-es-models.js");
const { ES_WORLDS } = await import("../math/fluency-lab/i18n-es-worlds.js");
const ES = { ...ES_BASE, ...ES_MODELS, ...ES_WORLDS };
const { setLang, t } = await import("../math/fluency-lab/i18n.js");
const { TRAILS, BANDS } = await import("../math/fluency-lab/fact-trail.js");
const { STRATEGIES, TIPS } = await import("../math/fluency-lab/strategies.js");
const { RANKS, STICKERS } = await import("../math/fluency-lab/rewards.js");
const { GAMES_BY_ID_NAME } = await import("../math/fluency-lab/game-names.js");
const { SCENES } = await import("../math/fluency-lab/scenes.js");
const { PUZZLE_WORLDS, worldLevel } = await import("../math/fluency-lab/puzzle-worlds.js");
const { ITEMS } = await import("../math/fluency-lab/buddy-items.js");
const { LEVELS, FUNCTIONS } = await import("../math/fluency-lab/language-frames.js");
const { MOVE_FN, MOVE_LABELS, STAT_LABELS } = await import("../math/fluency-lab/language-card.js");

const { ALL_SKILLS } = await import("../math/fluency-lab/problem-bank.js");
const { kidLearnFor } = await import("../math/fluency-lab/kid-learn.js");

const failures = [];
const keys = new Set();
// The young-learner "big idea" and "watch out" lines pass through t() on the Learn page.
for (const skill of ALL_SKILLS)
  if (kidLearnFor(skill, skill.grade)) {
    keys.add(skill.learn.rule);
    keys.add(skill.learn.watch);
  }
for (const file of readdirSync(dir).filter((f) => f.endsWith(".js") && !f.startsWith("i18n-es"))) {
  const source = readFileSync(new URL(file, dir), "utf8");
  for (const match of source.matchAll(/\bt\((?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)')/g))
    keys.add((match[1] ?? match[2]).replace(/\\["']/g, (escaped) => escaped.slice(1)));
  for (const match of source.matchAll(/\bt\(`((?:[^`\\]|\\.)*)`/g))
    if (!match[1].includes("${")) keys.add(match[1]);
  if (file === "family-page.js")
    for (const match of source.matchAll(/(?:add|mul): "((?:[^"\\]|\\.)*)"/g)) keys.add(match[1]);
  for (const match of source.matchAll(/(?:name|blurb): "((?:[^"\\]|\\.)*)"/g))
    if (file === "games.js") keys.add(match[1]);
}
for (const match of readFileSync(new URL("index.html", dir), "utf8").matchAll(
  /data-i18n[^>]*>([^<]+)</g,
))
  keys.add(match[1].trim());
for (const grade of Object.values(TRAILS)) {
  keys.add(grade.focus);
  for (const stop of grade.stations) {
    keys.add(stop.name);
    keys.add(stop.idea);
  }
}
for (const band of Object.values(BANDS))
  for (const [name, value] of Object.entries(band)) {
    if (typeof value === "string" && name !== "keypad") keys.add(value);
    if (Array.isArray(value)) for (const word of value) keys.add(word);
  }
for (const strategy of Object.values(STRATEGIES)) keys.add(strategy.label);
for (const list of Object.values(TIPS))
  for (const tip of list) {
    keys.add(tip.title);
    keys.add(tip.tip);
  }
for (const rank of RANKS) keys.add(rank.name);
for (const sticker of STICKERS) {
  keys.add(sticker.name);
  keys.add(sticker.hint);
}
for (const name of Object.values(GAMES_BY_ID_NAME)) keys.add(name);
for (const match of readFileSync(new URL("puzzle-worlds.js", dir), "utf8").matchAll(
  /hint: "([^"]+)"/g,
))
  keys.add(match[1]);
for (const world of PUZZLE_WORLDS) {
  keys.add(world.name);
  keys.add(world.blurb);
  for (let grade = 0; grade <= 8; grade += 1)
    for (let round = 0; round < 5; round += 1) {
      const level = worldLevel(world.id, grade, round);
      if (level?.label) keys.add(level.label);
      for (const choice of level?.choices || []) if (Number.isNaN(Number(choice))) keys.add(choice);
      for (const unit of [level?.model?.unitA, level?.model?.unitB]) if (unit) keys.add(unit);
    }
}
for (const scene of Object.values(SCENES)) keys.add(scene.title);
for (let n = 1; n <= 8; n += 1) keys.add(`Grade ${n} skills`);
keys.add("Trail stops");
// These labels/prompts are selected from data at runtime rather than passed as
// string literals directly to t(), so include them in the coverage inventory.
for (const key of [
  "Number Quest",
  "Array Architect",
  "Number Garden",
  "Grade {n} · {name}",
  "Find the two tens around {target}. Compare how far the target is from each one.",
  "Your marker is at {point}. Move it closer to {target}, then compare the distances.",
  "Your marker is at {point}. Move it to {target} to plant the seeds.",
  "Equation Factory",
  "Ratio City",
  "left",
  "right",
  "There is a gap or overlap. Compare the total length with the target.",
  "The pans are not equal yet. Make the same change to both sides.",
  "The city quantities changed by different factors. Keep the ratio constant.",
  "That route does not return to the stated output. Check the inverse steps.",
  "Multiply a three-digit number by a one-digit number",
  "Use place value to multiply a three-digit number by a one-digit number.",
  "Addition facts: sums of 10 or less",
  "Add two numbers whose sum is 10 or less.",
])
  keys.add(key);
for (const item of ITEMS) {
  keys.add(item.name);
  keys.add(item.hint);
}
for (const word of ["Blue", "Green", "Pink", "Orange", "Purple", "Teal", "Hat", "Face", "Back"])
  keys.add(word);
keys.add("Everything on my trail");
for (const level of LEVELS) {
  keys.add(level.name);
  keys.add(level.blurb);
}
for (const fn of FUNCTIONS) keys.add(fn.en);
for (const label of [
  ...Object.values(MOVE_FN),
  ...Object.values(MOVE_LABELS),
  ...STAT_LABELS.map(([, label]) => label),
])
  keys.add(label);
keys.add("Grade");

const holes = (text) =>
  [...text.matchAll(/\{(\w+)\}/g)]
    .map((m) => m[1])
    .sort()
    .join();
for (const key of keys) {
  if (ES[key] === undefined) failures.push(`No Spanish for: ${key}`);
  else if (holes(ES[key]) !== holes(key)) failures.push(`Placeholders differ for: ${key}`);
}
for (const key of Object.keys(ES))
  if (!keys.has(key)) failures.push(`Unused Spanish entry (remove or wire it): ${key}`);

setLang("es");
if (t("Game Room") !== "Sala de juegos") failures.push("Spanish lookup failed.");
if (t("{n} of {m} found", { n: 2, m: 4 }) !== "2 de 4 encontradas")
  failures.push("Placeholders are not filled in Spanish.");
if (t("Not in the dictionary {n}", { n: 3 }) !== "Not in the dictionary 3")
  failures.push("Unknown text should stay English.");
setLang("en");
if (t("Game Room") !== "Game Room") failures.push("English lookup failed.");

if (failures.length) {
  console.error(failures.slice(0, 40).join("\n"));
  console.error(`fluency-i18n: ${failures.length} problem(s)`);
  process.exit(1);
}
console.log(
  `fluency-i18n: ${keys.size} learner-facing strings all have Spanish with matching placeholders`,
);

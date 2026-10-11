// Spanish coverage: every learner-facing string the Fluency Lab passes through t(), plus the trail data it
// shows (stop names, ideas, focus lines, tips, stickers, ranks), has a Spanish entry with the same placeholders.
import { readdirSync, readFileSync } from "node:fs";

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: { getItem: () => null, setItem() {}, removeItem() {} },
});
Object.defineProperty(globalThis, "window", { configurable: true, value: globalThis });
const dir = new URL("../math/fluency-lab/", import.meta.url);
const { ES } = await import("../math/fluency-lab/i18n-es.js");
const { setLang, t } = await import("../math/fluency-lab/i18n.js");
const { TRAILS, BANDS } = await import("../math/fluency-lab/fact-trail.js");
const { STRATEGIES, TIPS } = await import("../math/fluency-lab/strategies.js");
const { RANKS, STICKERS } = await import("../math/fluency-lab/rewards.js");
const { GAMES_BY_ID_NAME } = await import("../math/fluency-lab/game-names.js");
const { SCENES } = await import("../math/fluency-lab/scenes.js");

const failures = [];
const keys = new Set();
for (const file of readdirSync(dir).filter((f) => f.endsWith(".js") && f !== "i18n-es.js")) {
  const source = readFileSync(new URL(file, dir), "utf8");
  for (const match of source.matchAll(/\bt\("((?:[^"\\]|\\.)*)"/g))
    keys.add(match[1].replace(/\\"/g, '"'));
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
for (const scene of Object.values(SCENES)) keys.add(scene.title);
for (let n = 1; n <= 8; n += 1) keys.add(`Grade ${n} skills`);
keys.add("Trail stops");
keys.add("Everything on my trail");
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

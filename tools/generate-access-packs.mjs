import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { SURVIVAL_TOPICS } from "../access-practice-lab/src/packs/survival-vocabulary.js";

const outDir = resolve("access-practice-lab/content/packs");
const pictureDir = resolve("access-practice-lab/pictures/packs");
const slug = (s) =>
  (s.toLowerCase() === "teacher" ? "educator" : s)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const esc = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
const check = process.argv.includes("--check");
const items = SURVIVAL_TOPICS.map((topic) => ({
  id: topic.id,
  title: { en: topic.title[0], es: topic.title[1] },
  words: topic.words.map(([en, es, emoji]) => ({
    id: `${topic.id}-${slug(en)}`,
    en,
    es,
    picture: `/access-practice-lab/pictures/packs/${topic.id}-${slug(en)}.svg`,
    emoji,
  })),
}));
const wordCount = items.reduce((n, topic) => n + topic.words.length, 0);
if (items.length !== 12 || items.some((topic) => topic.words.length !== 12) || wordCount !== 144)
  throw new Error(
    `Survival vocabulary must have 12 topics × 12 words; found ${items.length} topics and ${wordCount} words.`,
  );

const pack = {
  schema: "lp-survival-pack/1",
  reviewStatus: "automated-checks-only",
  id: "survival-vocabulary",
  title: { en: "Survival vocabulary", es: "Vocabulario esencial" },
  topics: items,
  outputs: ["flashcards-6-up", "word-wall", "labels-en-es", "matching-game", "bingo"],
};
const json = `${JSON.stringify(pack, null, 2)}\n`;
const picture = (topic, word) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" role="img" aria-label="${esc(word.en)} / ${esc(word.es)}"><title>${esc(word.en)} · ${esc(word.es)}</title><rect x="4" y="4" width="232" height="172" rx="22" fill="#fffdf7" stroke="#315c55" stroke-width="6"/><circle cx="120" cy="76" r="54" fill="${topic.color}" opacity=".14"/><text x="120" y="101" text-anchor="middle" font-size="68" font-family="sans-serif">${esc(word.emoji)}</text><text x="120" y="151" text-anchor="middle" font-size="18" font-family="sans-serif" fill="#18231f">${esc(word.en)}</text></svg>\n`;
await mkdir(outDir, { recursive: true });
await mkdir(pictureDir, { recursive: true });
const mismatches = [];
const expectedFiles = [];
for (let ti = 0; ti < items.length; ti++) {
  const topic = items[ti];
  for (const word of topic.words) {
    const name = `${topic.id}-${slug(word.en)}.svg`;
    const target = resolve(pictureDir, name);
    const svg = picture(SURVIVAL_TOPICS[ti], word);
    expectedFiles.push(name);
    if (Buffer.byteLength(svg) > 24 * 1024)
      throw new Error(`${name} exceeds the 24 KB picture limit.`);
    if (check) {
      if ((await readFile(target, "utf8").catch(() => "")) !== svg) mismatches.push(name);
    } else await writeFile(target, svg);
  }
}
const jsonPath = resolve(outDir, "survival-vocabulary.json");
if (check) {
  if ((await readFile(jsonPath, "utf8").catch(() => "")) !== json)
    mismatches.push("content/packs/survival-vocabulary.json");
  for (const file of expectedFiles) {
    const size = await stat(resolve(pictureDir, file))
      .then((s) => s.size)
      .catch(() => Infinity);
    if (size > 24 * 1024) mismatches.push(`${file} exceeds 24 KB`);
  }
  if (mismatches.length) {
    console.error(`Generated pack is stale or invalid: ${mismatches.slice(0, 8).join(", ")}`);
    process.exitCode = 1;
  } else console.log(`Checked 12 topics, 144 words, and ${expectedFiles.length} SVG pictures.`);
} else {
  await writeFile(jsonPath, json);
  console.log(`Generated 12 topics, 144 words, and ${expectedFiles.length} SVG pictures.`);
}

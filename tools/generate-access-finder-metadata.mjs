import { readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve("access-practice-lab/content");
const entries = {};
const functionVerbs = new Set(
  "acknowledge add address analyze answer apply argue build check choose cite classify combine communicate compare connect construct copy decode defend deliver describe determine develop differentiate disagree distinguish draw evaluate explain express follow give identify infer inform integrate interpret justify label listen list locate maintain make match name narrate notice order organize paraphrase plan predict prepare present produce propose provide qualify read recognize recount reject report resolve respond restate retell revise segment select separate sequence show solve state summarize synthesize take tell track understand use write".split(
    " ",
  ),
);
function functionVerb(raw) {
  const word = String(raw).trim().toLowerCase();
  if (functionVerbs.has(word)) return word;
  const candidates = [
    word.endsWith("ing") ? word.slice(0, -3) : "",
    word.endsWith("ing") ? `${word.slice(0, -3)}e` : "",
    word.endsWith("ing") && /([b-df-hj-np-tv-z])\1$/.test(word.slice(0, -3))
      ? word.slice(0, -4)
      : "",
    word.endsWith("ies") ? `${word.slice(0, -3)}y` : "",
    word.endsWith("es") ? word.slice(0, -2) : "",
    word.endsWith("s") ? word.slice(0, -1) : "",
    word.endsWith("ed") ? word.slice(0, -2) : "",
    word.endsWith("ed") ? `${word.slice(0, -2)}e` : "",
  ];
  return candidates.find((candidate) => functionVerbs.has(candidate)) || "";
}
const allowed = new Set([
  "worksheet",
  "game",
  "flashcards",
  "word-wall",
  "poster",
  "label",
  "planner",
  "checklist",
  "letter",
  "organizer",
  "assessment",
  "lesson-pack",
]);
const dirs = (await readdir(root, { withFileTypes: true })).filter(
  (d) => d.isDirectory() && /^g(?:K|\d|\d-\d)/.test(d.name),
);
for (const dir of dirs) {
  for (const domain of ["Listening", "Speaking", "Reading", "Writing"]) {
    let content;
    try {
      content = JSON.parse(await readFile(resolve(root, dir.name, `${domain}.json`), "utf8"));
    } catch {
      continue;
    }
    for (const [stage, group] of Object.entries(content.levels || {})) {
      for (const activity of group.activities || []) {
        const wida = Array.isArray(activity.wida) ? activity.wida : [];
        const functions = new Set();
        for (const phrase of wida) {
          const first = String(phrase)
            .trim()
            .match(/^[\p{L}]+/u)?.[0];
          const action = first ? functionVerb(first) : "";
          if (action) functions.add(action);
        }
        const metadata = {
          stage: /^[ABC]$/.test(stage) ? stage : null,
          fn: [...functions],
          lang: activity.directionsEs || activity.promptEs ? "bilingual" : "en",
          tech: activity.teacher?.noTech ? "none" : "screen",
        };
        const type = String(activity.type || "").toLowerCase();
        if (allowed.has(type)) metadata.type = type;
        if (activity.editable === true) metadata.edit = "yes";
        entries[activity.id] = metadata;
      }
    }
  }
}
const out = {
  schema: "lp-finder-metadata/1",
  sources: ["content/g*/{Listening,Speaking,Reading,Writing}.json"],
  activities: entries,
};
const target = resolve(root, "finder-metadata.json");
const generated = `${JSON.stringify(out, null, 2)}\n`;
if (process.argv.includes("--check")) {
  const current = await readFile(target, "utf8").catch(() => "");
  if (current !== generated) {
    console.error("finder-metadata.json is stale; run npm run generate:access-finder-metadata");
    process.exitCode = 1;
  } else console.log(`Checked ${Object.keys(entries).length} activity metadata records.`);
} else {
  await writeFile(target, generated);
  console.log(`Wrote ${Object.keys(entries).length} activity metadata records.`);
}

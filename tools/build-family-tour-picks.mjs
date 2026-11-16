// Builds access-practice-lab/family-tour/picks.json: the real speaking and writing activities the Family Tour can
// demonstrate and recommend. Every row is read from access-practice-lab/content (the one source of truth) so the
// tour never keeps a second copy of an activity; the Spanish "what your child practices" line is the only authored
// text (SKILL_ES, in tools/lib/family-tour-skill-es.mjs). Run: node tools/build-family-tour-picks.mjs [--check]
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SKILL_ES } from "./lib/family-tour-skill-es.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LAB = join(ROOT, "access-practice-lab");
const OUT = join(LAB, "family-tour", "picks.json");
const BANDS = [
  { band: "3-5", dir: "g3-5" },
  { band: "6-8", dir: "g6-8" },
];
const DOMAINS = ["Speaking", "Writing"];
const LEVELS = ["A", "B", "C"];
const PER_LEVEL = 5;

const minutesOf = (time) => {
  const nums = String(time || "").match(/\d+/g);
  return nums ? Math.max(...nums.map(Number)) : 0;
};

/** "tobogán: juego alto…" or "spanish: luz del sol" -> the Spanish word or phrase alone. */
const spanishWord = (gloss) =>
  String(gloss || "")
    .replace(/^(spanish|español):\s*/i, "")
    .split(/[:;]/)[0]
    .trim();

/** One activity, cut down to what the tour shows. Returns null when the activity cannot carry a family demo. */
function toPick(a, band, domain, level) {
  const minutes = minutesOf(a.time);
  const vocab = (a.vocabulary || []).filter((v) => Array.isArray(v) && v[0]);
  const sample = a.models?.A || (a.support || "").replace(/^Model:\s*/i, "");
  if (a.type !== "constructed" || !minutes || !a.prompt || (a.frames || []).length < 2 || !sample) return null;
  if (!SKILL_ES[a.id]) return null;
  return {
    id: a.id,
    band,
    domain,
    level,
    title: a.title,
    skill: a.skill,
    skillEs: SKILL_ES[a.id],
    minutes,
    directions: a.directions || "",
    prompt: a.prompt,
    picture: a.picture || null,
    frames: a.frames,
    words: (a.wordBank || vocab.map((v) => v[0])).slice(0, 10),
    vocab: vocab.slice(0, 3).map(([word, meaning, es]) => ({ word, meaning, es: spanishWord(es) })),
    models: a.models ? { A: a.models.A, B: a.models.B, C: a.models.C } : { A: sample },
    sayFor: a.sayFor || a.writeFor || [],
    hint: a.hint || "",
    extension: a.extension || "",
  };
}

export function buildPicks() {
  const picks = [];
  for (const { band, dir } of BANDS) {
    for (const domain of DOMAINS) {
      const set = JSON.parse(readFileSync(join(LAB, "content", dir, `${domain}.json`), "utf8"));
      for (const level of LEVELS) {
        const rows = set.levels[level].activities
          .map((a) => toPick(a, band, domain, level))
          .filter(Boolean)
          .sort((x, y) => Number(Boolean(y.picture)) - Number(Boolean(x.picture)) || x.minutes - y.minutes || x.id.localeCompare(y.id));
        picks.push(...rows.slice(0, PER_LEVEL));
      }
    }
  }
  return picks;
}

// One activity per line keeps the file diffable.
export const picksJson = () =>
  `{"schema":1,"picks":[\n${buildPicks().map((p) => JSON.stringify(p)).join(",\n")}\n]}\n`;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const next = picksJson();
  if (process.argv.includes("--check")) {
    let current = "";
    try {
      current = readFileSync(OUT, "utf8");
    } catch {}
    if (current !== next) {
      console.error("family-tour/picks.json is stale: run node tools/build-family-tour-picks.mjs");
      process.exit(1);
    }
    console.log("family-tour/picks.json is current");
  } else {
    writeFileSync(OUT, next);
    console.log(`wrote ${OUT} (${buildPicks().length} activities)`);
  }
}

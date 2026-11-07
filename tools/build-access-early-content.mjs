#!/usr/bin/env node
// Builds the K–3 band content files (access-practice-lab/content/g<band>/<Domain>.json) from the authored
// specs in tools/access-early-content/<band>.mjs. The specs hold what an author writes for each activity (the
// directions and question in English and Spanish, the heard script or passage, the picture choices, the model
// student, the paper-writing frame); this builder adds the contract fields every activity carries (CONTENT.md):
// time, support, extension, the teacher block, and the domain file around them.
//
//   node tools/build-access-early-content.mjs           write the files
//   node tools/build-access-early-content.mjs --check   fail when a written file differs from the specs
//
// Run `node tools/access-lab-index.mjs` afterwards (content/index.json).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { BAND_INFO } from "../access-practice-lab/src/bands.js";
import { CONTENT_DIR } from "./lib/access-lab-content.mjs";

// Each band's specs live in the first pass (k.mjs ...) and the publisher content pass (k-2.mjs ...); the builder
// merges their activities per domain and takes level goals from whichever file defines them.
const SPEC_BANDS = {
  K: ["./access-early-content/k.mjs", "./access-early-content/k-2.mjs"],
  1: ["./access-early-content/g1.mjs", "./access-early-content/g1-2.mjs"],
  "2-3": ["./access-early-content/g23.mjs", "./access-early-content/g23-2.mjs"],
};

/** The merged specs of one band: { domains: { <Domain>: { description, goals, activities } } }. */
export async function loadBandSpecs(band) {
  const out = { domains: {} };
  for (const path of SPEC_BANDS[band]) {
    const url = new URL(path, import.meta.url);
    if (!existsSync(url)) continue;
    const part = (await import(url)).default;
    for (const [domain, def] of Object.entries(part.domains)) {
      const into = (out.domains[domain] ||= { goals: {}, activities: [] });
      into.description ||= def.description;
      Object.assign(into.goals, def.goals || {});
      into.activities.push(...def.activities);
    }
  }
  return out;
}

const DOMAIN_META = {
  Listening: { color: "#075568", icon: "Listen" },
  Reading: { color: "#2e4a94", icon: "Read" },
  Speaking: { color: "#8a3a5c", icon: "Speak" },
  Writing: { color: "#9a4a26", icon: "Write" },
};
const TIERS = {
  A: { name: "Starting support", range: "Classroom support choice; not a WIDA proficiency level" },
  B: { name: "Growing", range: "Classroom support choice; not a WIDA proficiency level" },
  C: { name: "Expanding", range: "Classroom support choice; not a WIDA proficiency level" },
};

// What a teacher does with each kind of task. Written once per domain, then made specific with the task's skill.
const TEACHER = {
  Listening: (s) => ({
    use: `Whole group or a listening center with headphones. The player reads the directions and the story aloud; ${s.toLowerCase()}.`,
    function: s,
    lower:
      "Play the story twice. Point to each picture choice as the player names it. Accept a pointed answer.",
    onLevel:
      "Play once, let the child choose, then ask them to say the answer in a short sentence.",
    challenge: "After the answer, ask a why or what-next question about the story.",
    noTech:
      "Read the script aloud from the teacher packet and hold up picture cards for the choices.",
    prompt: "What did you hear that helped you choose?",
  }),
  Reading: (s) => ({
    use: `Small group or partners. The child taps each sentence to hear it, then chooses a picture; ${s.toLowerCase()}.`,
    function: s,
    lower: "Read each sentence aloud together while pointing to each word.",
    onLevel: "The child reads first, taps only the words they need, then answers.",
    challenge: "Ask the child to find and read the sentence that proves the answer.",
    noTech: "Write the sentences on chart paper and draw the choices on cards.",
    prompt: "Which sentence helped you? Read it to me.",
  }),
  Speaking: (s) => ({
    use: `One-on-one or partners. The child hears a model student, then answers in their own words and records; ${s.toLowerCase()}.`,
    function: s,
    lower: "Accept single words and pointing. Repeat the child's words back in a full sentence.",
    onLevel: "Use the sentence starter, then add one more detail.",
    challenge: "Ask for a reason with because, or a sequence with first, next, last.",
    noTech: "Show the picture on paper, say the model answer, and let the child answer aloud.",
    prompt: "Tell me more. What else do you see?",
  }),
  Writing: (s) => ({
    use: `Paper and pencil. Print the page; the child draws or writes, then reads it to a grown-up; ${s.toLowerCase()}.`,
    function: s,
    lower: "The child dictates and the adult writes; the child traces or copies one word.",
    onLevel: "The child writes with the sentence starter and word bank.",
    challenge: "Add a second sentence that tells why or what happened next.",
    noTech: "This task is already on paper. Read the prompt aloud and point to the word bank.",
    prompt: "Read your sentence to me. Which word bank word did you use?",
  }),
};
const SUPPORT = {
  Listening:
    "Tap 'Hear it again' as many times as you want. Tap the speaker on a picture to hear its name.",
  Reading: "Tap a sentence to hear it. Read it with your finger under each word.",
  Speaking: "Hear the model student first. Then use the sentence starter.",
  Writing: "Use the sentence starter and the word bank. You can draw first, then write.",
};
const EXTENSION = {
  Listening: "Tell a grown-up one more thing that happened in the story.",
  Reading: "Read the sentences again to a grown-up or a stuffed animal.",
  Speaking: "Say your answer again with one new detail.",
  Writing: "Add a picture and one more sentence.",
};

const stableHash = (s) => [...String(s)].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);

const pair = (p, where) => {
  if (!Array.isArray(p) || p.length !== 2 || !p[0] || !p[1])
    throw new Error(`${where}: needs [english, spanish]`);
  return p;
};

/** One spec -> one activity object (CONTENT.md contract + the early-band fields). */
export function expand(band, domain, spec) {
  const where = `${band}/${domain}/${spec.id}`;
  const [directions, directionsEs] = pair(spec.dir, `${where} dir`);
  const [prompt, promptEs] = pair(spec.q, `${where} q`);
  const a = {
    id: spec.id,
    title: spec.title,
    skill: spec.skill,
    time: spec.time || (domain === "Writing" ? "10 min" : "4 min"),
    type:
      spec.type ||
      (domain === "Speaking" || domain === "Writing" ? "constructed" : "multipleChoice"),
    directions,
    directionsEs,
    prompt,
    promptEs,
  };
  if (spec.scene) a.scene = spec.scene;
  if (spec.script) a.script = spec.script;
  if (spec.passage) {
    a.passageTitle = spec.passageTitle || spec.title;
    a.passage = spec.passage;
  }
  if (spec.options) {
    a.options = spec.options.map(([id, text, pic]) =>
      pic.startsWith("scene:") ? { id, text, scene: pic.slice(6) } : { id, text, visual: pic },
    );
    if (a.type === "multiSelect") a.answers = spec.answer;
    else {
      a.answer = spec.answer;
      // Authors list the answer wherever it reads naturally; the right answer's position comes from a stable hash
      // of the id so it is spread evenly over the bank (validate-access-quality.mjs checks the spread).
      const key = a.options.find((o) => o.id === a.answer);
      const rest = a.options.filter((o) => o !== key);
      rest.splice(stableHash(a.id) % a.options.length, 0, key);
      a.options = rest;
    }
  }
  if (spec.items) {
    a.type = "order";
    a.items = spec.items.map(([id, text, pic]) =>
      pic.startsWith("scene:") ? { id, text, scene: pic.slice(6) } : { id, text, visual: pic },
    );
    a.answer = spec.answer;
  }
  if (domain === "Speaking") {
    a.taskLevel = spec.taskLevel;
    a.modelStudent = { name: spec.model[0], text: spec.model[1] };
    a.models = spec.models || { A: spec.model[1] };
    a.sayFor = spec.sayFor;
    a.responseLabel = "What I said";
    a.successCriteria = spec.sayFor;
  }
  if (domain === "Writing") {
    a.wordBank = spec.bank;
    a.writeFor = spec.writeFor;
    a.responseLabel = "My writing";
    a.responsePlaceholder = spec.frame;
    a.paperLines = spec.lines;
    a.successCriteria = spec.writeFor;
  }
  a.vocabulary = spec.vocab;
  a.frames = [spec.frame];
  a.correct = spec.correct;
  a.hint = spec.hint || SUPPORT[domain];
  a.support = SUPPORT[domain];
  a.extension = spec.extension || EXTENSION[domain];
  a.wida = spec.wida;
  a.teacher = { ...TEACHER[domain](spec.skill), ...(spec.teacher || {}) };
  for (const k of Object.keys(a)) if (a[k] === undefined) delete a[k];
  return a;
}

export function buildBand(band, specs) {
  const out = {};
  for (const [domain, def] of Object.entries(specs.domains)) {
    const levels = {};
    for (const lk of ["A", "B", "C"]) {
      const list = def.activities.filter((s) => s.level === lk);
      if (!list.length) continue;
      levels[lk] = {
        tier: TIERS[lk],
        studentGoal: def.goals[lk][0],
        info: { headline: def.goals[lk][0], summary: def.goals[lk][1], canDo: [def.goals[lk][0]] },
        activities: list.map((s) => expand(band, domain, s)),
      };
    }
    out[domain] = { band, domain, ...DOMAIN_META[domain], description: def.description, levels };
  }
  return out;
}

/** Built K–3 files that differ from what the specs produce now (paths relative to content/). */
export async function staleEarlyFiles() {
  const out = [];
  for (const band of Object.keys(SPEC_BANDS)) {
    const specs = await loadBandSpecs(band);
    for (const [domain, data] of Object.entries(buildBand(band, specs))) {
      const file = join(CONTENT_DIR, `g${band}`, `${domain}.json`);
      const now = existsSync(file) ? readFileSync(file, "utf8") : "";
      if (now !== `${JSON.stringify(data, null, 1)}\n`) out.push(`g${band}/${domain}.json`);
    }
  }
  return out;
}

async function main() {
  const check = process.argv.includes("--check");
  let stale = 0;
  for (const band of Object.keys(SPEC_BANDS)) {
    if (!BAND_INFO[band]) throw new Error(`unknown band ${band}`);
    const specs = await loadBandSpecs(band);
    const dir = join(CONTENT_DIR, `g${band}`);
    for (const [domain, data] of Object.entries(buildBand(band, specs))) {
      const file = join(dir, `${domain}.json`);
      const text = `${JSON.stringify(data, null, 1)}\n`;
      const now = existsSync(file) ? readFileSync(file, "utf8") : "";
      if (now === text) continue;
      if (check) {
        console.error(`STALE ${file} — run node tools/build-access-early-content.mjs`);
        stale++;
        continue;
      }
      mkdirSync(dir, { recursive: true });
      writeFileSync(file, text);
      console.log(`wrote ${file}`);
    }
  }
  if (stale) process.exit(1);
  console.log(`build-access-early-content: ${check ? "current" : "done"}`);
}
if (import.meta.url === `file://${process.argv[1]}`) await main();

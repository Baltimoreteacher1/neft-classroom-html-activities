#!/usr/bin/env node
// Grades 4-5 depth pass: builds the added Grades 3-5 activities from the authored specs in
// tools/access-early-content/g45-<domain>.mjs and merges them into access-practice-lab/content/g3-5/<Domain>.json.
//
// The hand-authored 3-5 activities are never touched. Every spec id becomes `g35-<spec id>`; the builder replaces
// an activity with that id when it exists and appends it otherwise, so the run is idempotent. Each level also gets
// strands (categories whose id ends in `-g45`) listing the added activities; those strands are rebuilt every run.
// A spec holds what an author writes (directions, question, heard script or passage, options with the right answer
// listed first, model answers); this builder adds the contract fields every activity carries (CONTENT.md): time,
// support, extension, the teacher block, success criteria and model notes.
//
//   node tools/build-access-g45-content.mjs           write the files
//   node tools/build-access-g45-content.mjs --check   fail when a written file differs from the specs
//
// The Spanish skill goal and directions of every added activity come from g45-es.mjs and are written into
// content/es-guide.json.
//
// Run `node tools/access-lab-index.mjs` afterwards (content/index.json, alignment index, glossary).
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CONTENT_DIR } from "./lib/access-lab-content.mjs";

const DOMAINS = ["Listening", "Reading", "Speaking", "Writing"];
const PREFIX = "g35-";
export const STRAND_SUFFIX = "-g45";

const STRAND_DESC = {
  Listening:
    "More listening for grades 4-5: longer talks, key details, and what the speaker means.",
  Reading: "More reading for grades 4-5: longer texts, evidence, and how ideas connect.",
  Speaking: "More speaking for grades 4-5: explain, compare, and give reasons in your own words.",
  Writing: "More writing for grades 4-5: paragraphs with details, transitions, and a clear close.",
};
const TIME = {
  Listening: { A: "4 min", B: "5 min", C: "6 min" },
  Reading: { A: "6 min", B: "8 min", C: "10 min" },
  Speaking: { A: "5 min", B: "7 min", C: "8 min" },
  Writing: { A: "8 min", B: "10 min", C: "12 min" },
};
const SUPPORT = {
  Listening:
    "Play it again. Listen for one clue at a time, then check your answer against what you heard.",
  Reading: "Read the text one part at a time. Point to the words that help you answer.",
  Speaking: "Use the sentence starters. Say it once to yourself, then record your own words.",
  Writing: "Use the sentence starters and the word bank. Plan first, then write, then check.",
};
const EXTENSION = {
  Listening: "Tell a partner one more detail you heard and why it matters.",
  Reading: "Find one more sentence that supports your answer and read it aloud.",
  Speaking: "Say your answer again with one more detail or one more reason.",
  Writing: "Add one more sentence with a detail, a reason, or a transition word.",
};
const TEACHER = {
  Listening: (s) => ({
    use: `Whole group, partners, or a listening center. Read the script aloud or use the audio; ${s.toLowerCase()}.`,
    function: s,
    lower: "Read the script twice, slowly. Pause after each sentence and ask what was just said.",
    onLevel: "Read once at a natural pace. Students answer, then say the clue they heard.",
    challenge: "Ask students to explain why each wrong choice does not match what they heard.",
    noTech: "Read the script aloud from the teacher page. Students answer on paper.",
    prompt: "What words in the script told you the answer?",
  }),
  Reading: (s) => ({
    use: `Independent reading, partners, or a small group. ${s}.`,
    function: s,
    lower: "Read the text aloud together. Underline the words that answer the question.",
    onLevel: "Students read on their own, answer, and point to the proof in the text.",
    challenge: "Ask students to write one more question the text can answer.",
    noTech: "Print the text and the question; students mark the text with a pencil.",
    prompt: "Which words or sentence in the text prove your answer?",
  }),
  Speaking: (s) => ({
    use: `Partners or one-on-one with a recording. Plan with the starters, then record; ${s.toLowerCase()}.`,
    function: s,
    lower: "Accept short sentences. Model the first starter, then let the student continue.",
    onLevel: "Students plan with the starters and speak in connected sentences.",
    challenge: "Ask for a reason with because and a comparison with but or however.",
    noTech: "Students tell a partner, and the partner uses the checklist to give one kind comment.",
    prompt: "Tell me more. What is one more detail or reason you can add?",
  }),
  Writing: (s) => ({
    use: `Independent writing or a writing workshop. Plan with the starters, write, then check; ${s.toLowerCase()}.`,
    function: s,
    lower: "Write the first sentence together, then let the student finish with the word bank.",
    onLevel: "Students write a short paragraph with the starters, then reread and revise once.",
    challenge:
      "Ask students to add a transition and one more detail, then explain why they added it.",
    noTech: "Print the prompt and the word bank; students write on lined paper.",
    prompt: "Read your writing aloud. Which sentence has your best detail?",
  }),
};

const stableHash = (s) => [...String(s)].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
const rotate = (list, k) => list.map((_, i) => list[(i + k) % list.length]);
const letter = (i) => "abcdefgh"[i];
const bad = (id, msg) => {
  throw new Error(`g45 spec ${id}: ${msg}`);
};

/** "text|emoji" -> { text, visual? }. */
const option = (raw, id) => {
  const [text, visual] = String(raw).split("|");
  if (!text) bad(id, "empty option");
  return visual ? { text, visual } : { text };
};

/** Options for one item, correct ones first in the spec; the right answer's position comes from a stable hash of the id. */
function buildOptions(id, spec, multi) {
  const opts = spec.opts.map((o) => option(o, id));
  const nRight = multi ? spec.ans : 1;
  const tagged = opts.map((o, i) => ({ ...o, right: i < nRight }));
  const shown = rotate(tagged, stableHash(id) % tagged.length);
  const options = shown.map((o, i) => {
    const { right, ...rest } = o;
    return { id: letter(i), ...rest };
  });
  const ids = shown.flatMap((o, i) => (o.right ? [letter(i)] : []));
  return { options, ids };
}

const firstSentence = (text) =>
  (String(text).match(/^.*?[.!?](?=\s|$)/)?.[0] || String(text)).trim();

function expandItem(spec, domain) {
  const id = `${PREFIX}${spec.id}`;
  const where = id;
  for (const f of [
    "level",
    "title",
    "skill",
    "dir",
    "q",
    "vocab",
    "frames",
    "correct",
    "hint",
    "wida",
  ])
    if (!spec[f]) bad(where, `missing ${f}`);
  const a = {
    id,
    title: spec.title,
    skill: spec.skill,
    time: spec.time || TIME[domain][spec.level],
    type:
      spec.type ||
      (domain === "Speaking" || domain === "Writing" ? "constructed" : "multipleChoice"),
    directions: spec.dir,
    prompt: spec.q,
  };
  if (spec.script) a.script = spec.script;
  if (spec.passage || spec.passageTitle) a.passageTitle = spec.passageTitle || spec.title;
  if (spec.passage) a.passage = spec.passage;
  if (spec.table) a.table = spec.table;
  if (spec.chart) a.chart = spec.chart;
  if (spec.picture) a.picture = spec.picture;
  if (a.type === "multipleChoice" || a.type === "multiSelect") {
    const { options, ids } = buildOptions(id, spec, a.type === "multiSelect");
    a.options = options;
    if (a.type === "multiSelect") a.answers = ids;
    else a.answer = ids[0];
  } else if (a.type === "order") {
    const n = spec.items.length;
    const keyed = spec.items.map((t, i) => ({ id: `s${i + 1}`, text: t }));
    a.items = rotate(keyed, 1 + (stableHash(id) % (n - 1)));
    a.answer = keyed.map((k) => k.id);
  } else if (a.type === "cloze") {
    let b = 0;
    a.segments = spec.cloze.map((seg) => {
      if (typeof seg === "string") return { text: seg };
      const [blankAnswer, ...wrong] = seg;
      b += 1;
      const opts = [blankAnswer, ...wrong];
      return {
        blank: {
          id: `b${b}`,
          options: rotate(opts, stableHash(`${id}${b}`) % opts.length),
          answer: blankAnswer,
        },
      };
    });
  } else if (a.type === "sort") {
    a.categories = spec.cats;
    a.items = rotate(
      spec.sortItems.map(([text, ci], i) => ({ id: `s${i + 1}`, text, answer: spec.cats[ci] })),
      stableHash(id) % spec.sortItems.length,
    );
  } else if (a.type === "hotText") {
    a.sentences = spec.sentences.map((text, i) => ({ id: `s${i + 1}`, text }));
    a.answers = spec.answerIdx.map((i) => `s${i + 1}`);
  } else if (a.type !== "constructed") bad(where, `unsupported type ${a.type}`);
  if (domain === "Listening") a.listenFor = spec.focus || bad(where, "missing focus");
  if (domain === "Reading") a.readFor = spec.focus || bad(where, "missing focus");
  if (domain === "Speaking") a.sayFor = spec.focus || bad(where, "missing focus");
  if (domain === "Writing") a.writeFor = spec.focus || bad(where, "missing focus");
  if (a.type === "constructed") {
    if (!spec.models?.A || !spec.models?.B || !spec.models?.C) bad(where, "needs models A, B, C");
    a.responseLabel = spec.label || (domain === "Speaking" ? "Planning notes" : "Your writing");
    a.responsePlaceholder = spec.frames[0];
    a.models = spec.models;
    a.successCriteria = [
      `Address the task: ${spec.q}`,
      ...spec.focus.slice(0, 2).map((f) => `Include ${f}.`),
    ];
    if (a.successCriteria.length < 3)
      a.successCriteria.push("Reread your answer and fix anything unclear.");
    a.modelNotes = Object.fromEntries(
      Object.entries(spec.models).map(([k, v]) => [
        k,
        `Notice this specific detail: “${firstSentence(v)}” Compare it with the task checklist. Borrow the useful language move, not the whole answer; a clear short answer can meet the goal.`,
      ]),
    );
  }
  if (spec.bank || domain === "Writing") a.wordBank = spec.bank || bad(where, "missing bank");
  a.vocabulary = spec.vocab;
  a.frames = spec.frames;
  a.correct = spec.correct;
  a.hint = spec.hint;
  a.support = spec.support || SUPPORT[domain];
  a.extension = spec.extension || EXTENSION[domain];
  a.wida = spec.wida;
  a.teacher = { ...TEACHER[domain](spec.skill), ...(spec.teacher || {}) };
  return a;
}

async function loadSpecs(domain) {
  const url = new URL(`./access-early-content/g45-${domain.toLowerCase()}.mjs`, import.meta.url);
  return existsSync(url) ? (await import(url)).default : [];
}

/** Merge the specs of one domain into its parsed file. Returns the new data. */
export function mergeDomain(data, domain, specs) {
  const out = structuredClone(data);
  const ids = new Set(specs.map((s) => `${PREFIX}${s.id}`));
  for (const lk of ["A", "B", "C"]) {
    const level = out.levels[lk];
    const mine = specs.filter((s) => s.level === lk);
    level.activities = level.activities.filter((a) => !ids.has(a.id));
    level.categories = (level.categories || []).filter((c) => !c.id.endsWith(STRAND_SUFFIX));
    const built = mine.map((s) => expandItem(s, domain));
    level.activities.push(...built);
    const strands = new Map();
    for (const s of mine) {
      const key = s.strand || "More practice";
      if (!strands.has(key)) strands.set(key, []);
      strands.get(key).push(`${PREFIX}${s.id}`);
    }
    let n = 0;
    for (const [title, activityIds] of strands) {
      n += 1;
      level.categories.push({
        id: `${domain[0].toLowerCase()}35-${lk.toLowerCase()}-${n}${STRAND_SUFFIX}`,
        title,
        desc: STRAND_DESC[domain],
        activityIds,
      });
    }
  }
  return out;
}

const fileOf = (domain) => join(CONTENT_DIR, "g3-5", `${domain}.json`);
const GUIDE_FILE = join(CONTENT_DIR, "es-guide.json");

/** Put the Spanish goal and directions of every spec into the guide (keys stay sorted, as the file keeps them). */
export function mergeGuide(guide, specs, es) {
  const activities = { ...guide.activities };
  for (const s of specs) {
    const pair = es[s.id];
    if (!pair?.[0] || !pair?.[1]) bad(`${PREFIX}${s.id}`, "missing Spanish in g45-es.mjs");
    activities[`${PREFIX}${s.id}`] = { skill: pair[0], directions: pair[1] };
  }
  const sorted = Object.fromEntries(
    Object.entries(activities).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
  );
  return { ...guide, activities: sorted };
}

async function allSpecs() {
  const out = [];
  for (const d of DOMAINS) out.push(...(await loadSpecs(d)));
  return out;
}
const loadEs = async () =>
  (await import(new URL("./access-early-content/g45-es.mjs", import.meta.url))).default;
const guideText = (data) => JSON.stringify(data, null, 1);
function indentOf(text) {
  for (const ind of [1, 2])
    if (`${JSON.stringify(JSON.parse(text), null, ind)}\n` === text) return ind;
  return 1;
}

/** Built 3-5 files that differ from what the specs produce now (paths relative to content/). */
export async function staleG45Files() {
  const out = [];
  for (const domain of DOMAINS) {
    const specs = await loadSpecs(domain);
    if (!specs.length) continue;
    const text = readFileSync(fileOf(domain), "utf8");
    const next = `${JSON.stringify(mergeDomain(JSON.parse(text), domain, specs), null, indentOf(text))}\n`;
    if (next !== text) out.push(`g3-5/${domain}.json`);
  }
  const guide = readFileSync(GUIDE_FILE, "utf8");
  const nextGuide = guideText(mergeGuide(JSON.parse(guide), await allSpecs(), await loadEs()));
  if (nextGuide !== guide) out.push("es-guide.json");
  return out;
}

async function main() {
  const check = process.argv.includes("--check");
  let stale = 0;
  for (const domain of DOMAINS) {
    const specs = await loadSpecs(domain);
    if (!specs.length) continue;
    const text = readFileSync(fileOf(domain), "utf8");
    const next = `${JSON.stringify(mergeDomain(JSON.parse(text), domain, specs), null, indentOf(text))}\n`;
    if (next === text) continue;
    if (check) {
      console.error(`STALE ${fileOf(domain)} — run node tools/build-access-g45-content.mjs`);
      stale++;
    } else {
      writeFileSync(fileOf(domain), next);
      console.log(`wrote ${fileOf(domain)}`);
    }
  }
  const guide = readFileSync(GUIDE_FILE, "utf8");
  const nextGuide = guideText(mergeGuide(JSON.parse(guide), await allSpecs(), await loadEs()));
  if (nextGuide !== guide) {
    if (check) {
      console.error(`STALE ${GUIDE_FILE} — run node tools/build-access-g45-content.mjs`);
      stale++;
    } else {
      writeFileSync(GUIDE_FILE, nextGuide);
      console.log(`wrote ${GUIDE_FILE}`);
    }
  }
  if (stale) process.exit(1);
  console.log(`build-access-g45-content: ${check ? "current" : "done"}`);
}
if (import.meta.url === `file://${process.argv[1]}`) await main();

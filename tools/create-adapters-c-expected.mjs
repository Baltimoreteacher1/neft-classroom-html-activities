// Independent expectations for the Language Page lab adapters (studio tasks, TWR, talk table, warm-up, subject
// reading, teach-back, word parts, Word Lab, phonics, worlds, scenarios, Voice Lab, language builders, Sentence Lab):
// how many sources each family lists and how many questions each source must yield, computed from the raw files
// without the adapters. Spread into EXPECTED / LISTED by tools/studio-customize-adapters-helpers.mjs.
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const LAB = join(ROOT, "access-practice-lab");
const json = (rel) => JSON.parse(readFileSync(join(LAB, rel), "utf8"));
const mod = (rel) => import(join(LAB, "src", rel));
const sets6 = (n) => (n >= 2 ? Math.ceil(n / 6) : 0);
const len = (v) => (Array.isArray(v) ? v.length : 0);

const studioTasks = () => [
  ...json("content/studio/speaking.json").tasks,
  ...json("content/studio/writing.json").tasks,
];
const twrSets = () =>
  readdirSync(join(LAB, "content/twr")).flatMap((b) =>
    readdirSync(join(LAB, "content/twr", b)).flatMap((f) => json(`content/twr/${b}/${f}`).sets),
  );
const warmTier = (tier) =>
  json(`content/warmup-${["K-1", "2-3"].includes(tier) ? "early" : "upper"}.json`).tiers[
    tier
  ].filter((w) => w.w && w.def);

function reachableTurns(scene) {
  const seen = new Set();
  const stack = [scene.start];
  let turns = 0;
  while (stack.length) {
    const id = stack.pop();
    if (!id || seen.has(id) || !scene.nodes[id]) continue;
    seen.add(id);
    const n = scene.nodes[id];
    if (len(n.choices)) turns++;
    for (const c of n.choices || []) stack.push(c.next);
  }
  return turns;
}

const distinct = (a) => len(a) >= 2 && new Set(a).size === a.length;

export const EXPECTED_C = {
  "studio-task": async (ref) => {
    const x = studioTasks().find((t) => t.id === ref);
    return len(x.stimulus?.check) + sets6(len(x.vocab)) + 1;
  },
  twr: async (ref) => {
    const s = twrSets().find((x) => x.id === ref);
    return s.items.length + (s.write?.prompt ? 1 : 0);
  },
  "talk-table": async (ref) => {
    const [, band, use] = /^(.+)-(narrate|inform|explain|argue)$/.exec(ref);
    return json("content/talk-table.json").bands[band][use[0].toUpperCase() + use.slice(1)].length;
  },
  warmup: async (ref) => {
    const [, tier, n] = /^(.+)-(\d+)$/.exec(ref);
    const set = warmTier(tier).slice((n - 1) * 10, n * 10);
    return sets6(set.length) + set.filter((w) => w.clip && w.q && w.a && len(w.x)).length;
  },
  "subject-reading": async (ref) => {
    const r = (await mod("subject-reading/content.js")).READINGS.find((x) => x.id === ref);
    return sets6(len(r.vocabulary)) + 1;
  },
  "teach-back": async (ref) => {
    const c = (await mod("teachback/concepts.js")).CONCEPTS.find((x) => x.id === ref);
    return sets6(len(c.terms)) + len(c.points) + 1;
  },
  "word-parts": async (ref) => {
    const n = (await mod("content/vocabulary-items.js")).VOCABULARY_ITEMS[ref].length;
    return sets6(n) + n;
  },
  wordlab: async (ref) => {
    const words = (await mod("content/wordlab-words.js")).WORDS.filter((w) => w.w && w.d);
    const [, key, n] = /^(.+)-(\d+)$/.exec(ref);
    const group = words.filter((w) => (w.b === "both" ? "all-all" : `${w.b}-${w.s}`) === key);
    const set = group.slice((n - 1) * 12, n * 12);
    const uses = (w) =>
      new RegExp(`\\b${w.w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(w.x || "");
    return sets6(set.length) + set.filter(uses).length;
  },
  phonics: async (ref) => {
    const l = (await mod("sor/sequence.js")).READING_LESSONS.find((x) => x.id === ref);
    return (
      (distinct(l.build?.units) ? 1 : 0) +
      (distinct(l.read?.choices) && l.read.choices.includes(l.read.word) ? 1 : 0) +
      (l.sort?.a && l.sort?.b ? 1 : 0) +
      (l.spell?.word ? 1 : 0) +
      (l.passage && l.question ? 1 : 0) +
      (l.dictation?.sentence ? 1 : 0)
    );
  },
  "world-missions": async (ref) => {
    const [, world, band] = /^(.+)-(\d-\d)$/.exec(ref);
    const ms = (await mod("content/world-missions.js")).WORLD_MISSIONS[world].bands[band];
    return ms.length + ms.filter((m) => m.independent).length;
  },
  scenarios: async (ref) =>
    reachableTurns((await mod("content/scenarios.js")).SCENES.find((s) => s.id === ref)) + 1,
  "voice-lab": async (ref) => {
    const v = await mod("content/voice-lab.js");
    const [, kind, id] = /^(retell|ladder|sounds)-(.+)$/.exec(ref);
    if (kind === "retell") {
      const r = v.RETELLS.find((x) => x.id === id);
      return sets6(len(r.vocab)) + len(r.check) + 1;
    }
    if (kind === "ladder") return v.LADDERS.find((x) => x.id === id).steps.length;
    return sets6(v.SOUND_SETS.find((x) => x.id === id).pairs.length * 2);
  },
  "scaffold-items": async (ref) => {
    const { ALL_ITEMS } = await mod("content/scaffold-items.js");
    const items = ALL_ITEMS.filter((x) => `${x.tool}-${x.band}` === ref);
    return (
      items.length +
      items.filter(
        (x) =>
          x.tool === "evidence-builder" &&
          len(x.connectors) >= 2 &&
          x.connectors.includes(x.answer?.connector),
      ).length
    );
  },
  "craft-sentences": async (ref) => {
    const M = await mod("content/craft-sentences.js");
    const m = /^(3-5|6-8)-l(\d)$/.exec(ref);
    const tasks = m
      ? M.TASKS.filter((x) => x.band === m[1] && x.lv === Number(m[2]))
      : M.BOSSES.find((b) => b.id === ref).steps;
    return tasks.filter((x) => x.kind !== "s").length;
  },
};

export const LISTED_C = {
  "studio-task": 56,
  twr: 132,
  "talk-table": 20,
  warmup: 24,
  "subject-reading": 5,
  "teach-back": 24,
  "word-parts": 2,
  wordlab: 68,
  phonics: 58,
  "world-missions": 8,
  scenarios: 27,
  "voice-lab": 18,
  "scaffold-items": 6,
  "craft-sentences": 18,
};

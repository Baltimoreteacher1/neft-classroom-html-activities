// Independent expectations for the Language Page practice adapters (lab-activity, access-prep, grammar-packs and the
// studio families): how many items each source lists and how many questions each draft must hold, counted straight
// from the raw source data without the adapters. Merged into LISTED / EXPECTED in studio-customize-adapters-helpers.mjs.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const LAB = join(ROOT, "access-practice-lab");
const json = (rel) => JSON.parse(readFileSync(join(LAB, rel), "utf8"));
const src = (rel) => import(join(LAB, "src", rel));

const PREP = [
  "notes",
  "data-talk",
  "raters-eye",
  "word-meanings",
  "text-structures",
  "task-words",
  "daily-drill",
  "extempore-speak",
];
const hasBlank = (parts) => (parts || []).some((p) => p && typeof p === "object");
const prepSet = (skill, id) =>
  Object.values(json(`content/prep/${skill}.json`))
    .flat()
    .find((s) => s.id === id);
const PREP_COUNT = {
  "daily-drill": (s) =>
    1 + [s.listenBuild, s.cloze, s.forge].filter((x) => hasBlank(x?.parts)).length,
  "data-talk": (s) => s.questions.length + (hasBlank(s.build?.parts) ? 1 : 0) + 1,
  "extempore-speak": (s) => 1 + [s.turn1, s.turn2].filter((x) => hasBlank(x?.parts)).length + 1,
  notes: (s) => 2 + s.questions.length + 1,
  "raters-eye": (s) => 2 + (hasBlank(s.upgrade?.parts) ? 1 : 0),
  "task-words": (s) => 3 * s.prompts.length,
  "text-structures": (s) =>
    s.passages.reduce((n, p) => n + 1 + (p.organizer?.parts?.length ? 1 : 0), 0),
  "word-meanings": (s) => 1 + s.questions.length + 1,
};

const labIndexRows = () => {
  const idx = json("content/index.json");
  return Object.values(idx.bands).flatMap((b) =>
    Object.values(b.domains).flatMap((d) => Object.values(d.levels).flatMap((L) => L.activities)),
  );
};

export async function listedA() {
  const { CASES } = await src("claimcheck/cases.js");
  const { TOPICS } = await src("content/craft-arena.js");
  const { MISSIONS } = await src("content/city.js");
  const { SCENARIOS } = await src("content/communication.js");
  const { EXHIBITIONS } = await src("content/exhibition.js");
  const { WORLDS } = await src("adventures/worlds/index.js");
  const conv = await src("views/conversation.js");
  const boards = json("content/choice-boards.json").bands;
  return {
    "lab-activity": labIndexRows().length,
    "access-prep": PREP.reduce(
      (n, k) => n + Object.values(json(`content/prep/${k}.json`)).flat().length,
      0,
    ),
    "grammar-packs": json("content/grammar/packs.json").packs.length,
    "claim-check": CASES.length,
    "argument-arena": TOPICS.length,
    "choice-boards": Object.values(boards).reduce((n, b) => n + Object.keys(b).length, 0),
    "language-city": MISSIONS.length,
    communication: SCENARIOS.length,
    exhibition: Object.keys(EXHIBITIONS).length,
    adventures: WORLDS.reduce(
      (n, w) => n + w.missions.reduce((k, m) => k + Object.keys(m.bands).length, 0),
      0,
    ),
    "error-detective": Object.keys(json("content/detective/patterns.json").patterns).length,
    "conversation-sim": conv.SCENARIOS.length,
    "construction-lab": 1,
    "dialogue-studio": 1,
    "sentence-architect": 1,
  };
}

export const EXPECTED_A = {
  "lab-activity": async () => 1,
  "access-prep": async (ref) => {
    const [skill, id] = ref.split("/");
    return PREP_COUNT[skill](prepSet(skill, id));
  },
  "grammar-packs": async (ref) => {
    const p = json("content/grammar/packs.json").packs.find((x) => String(x.n) === ref);
    return p.diagnostic.length + p.practice.length;
  },
  "claim-check": async () => 5,
  "argument-arena": async () => 4,
  "choice-boards": async (ref) => {
    const m = /^(K|1|2-3|3-5|6-8)-(\w+)$/.exec(ref);
    const klu = m[2][0].toUpperCase() + m[2].slice(1);
    return json("content/choice-boards.json").bands[m[1]][klu].squares.length;
  },
  "language-city": async (ref) => {
    const [place, id] = ref.split("/");
    const { MISSIONS } = await src("content/city.js");
    return MISSIONS.find((m) => m.place === place && m.id === id).steps.length;
  },
  communication: async () => 4,
  exhibition: async (ref) => {
    const { EXHIBITIONS } = await src("content/exhibition.js");
    const tk = EXHIBITIONS[ref].tasks;
    return (
      tk.listen.questions.length +
      tk.read.questions.length +
      1 +
      (tk.write.prompt ? 1 : 0) +
      (tk.write.transfer ? 1 : 0)
    );
  },
  adventures: async (ref) => {
    const [w, m, band] = ref.split("/");
    const { WORLDS } = await src("adventures/worlds/index.js");
    const scenes = WORLDS.find((x) => x.id === w).missions.find((x) => x.id === m).bands[band];
    return scenes.filter((s) => ["clues", "choice", "order", "respond"].includes(s.kind)).length;
  },
  "error-detective": async (ref) => {
    const p = json("content/detective/patterns.json").patterns[ref];
    return p.practice.length + p.transfer.length;
  },
  "conversation-sim": async (ref) => {
    const { SCENARIOS } = await src("views/conversation.js");
    return SCENARIOS.find((s) => s.id === ref).turns.length + 1;
  },
  "construction-lab": async () => {
    const k = await src("views/construction.js");
    return k.EXPANSION_CHALLENGES.length + k.REGISTER_TRANSFORMS.length;
  },
  "dialogue-studio": async () => {
    const d = await src("platform/data/externalIntegrationsData.js");
    return d.DIALOGUE_ITEMS.length + d.CLOZE_STORIES.length + d.WARMUP_PROMPTS.length;
  },
  "sentence-architect": async () =>
    (await src("platform/data/platformData.js")).ARCHITECT_KERNELS.length,
};

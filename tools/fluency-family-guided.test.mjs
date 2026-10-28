// The guided family session's logic and data: what it chooses, what it teaches, what it saves, and that nothing it shows can
// hand over an answer. The browser half is tools/verify-fluency-family-session.mjs (npm run validate:fluency-family-session).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { applyAttempt } from "../math/fluency-lab/family/fm2/adapt.js";
import { STRAND_KEYS } from "../math/fluency-lab/family/fm2/coach.js";
import { G, PARENT, STEP_IDS } from "../math/fluency-lab/family/fm2/guided/guided-copy.js";
import {
  accuracy,
  buildExplain,
  buildLearn,
  createGuidedStore,
  DUEL_ID,
  EXPLAIN_OPTIONS,
  FLOW,
  learnFromBank,
  nextPlan,
  pickTonight,
  ROUNDS,
  sanitizeGuided,
} from "../math/fluency-lab/family/fm2/guided/guided-core.js";
import { loadAll } from "../math/fluency-lab/family/fm2/registry.js";
import { emptyState } from "../math/fluency-lab/family/fm2/store.js";
import { evaluateExpression, parseAnswerValue } from "../scripts/lib/rational.mjs";
import { buildFiles } from "./generate-guided-skill-index.mjs";

const games = await loadAll();
const gameById = new Map(games.map((game) => [game.id, game]));
const DIR = new URL("../math/fluency-lab/family/fm2/guided/", import.meta.url);

// ---- the flow is the one in the brief -------------------------------------------------------------------------------------
assert.deepEqual(FLOW, ["choose", "learn", "try", "play", "explain", "celebrate", "continue"]);
assert.deepEqual(STEP_IDS, FLOW);
for (const id of FLOW)
  assert.ok(G.steps[id]?.en && G.steps[id]?.es, `step name in both languages: ${id}`);

// ---- generated data is current, and the profile count matches the school tools ------------------------------------------
for (const [name, text] of await buildFiles())
  assert.equal(
    readFileSync(new URL(name, DIR), "utf8"),
    text,
    `${name} is current (run node tools/generate-guided-skill-index.mjs)`,
  );
const profileNames = /PROFILE_NAMES = \[([^\]]*)\]/
  .exec(readFileSync(new URL("../math/fluency-lab/school-tools.js", import.meta.url), "utf8"))[1]
  .split(",").length;
assert.equal(
  readFileSync(new URL("guided-ui.js", DIR), "utf8").match(/const PROFILES = (\d+)/)[1],
  String(profileNames),
  "guided PROFILES equals PROFILE_NAMES.length",
);

// ---- every copy line is a pair; no formal "usted"; grown-up lines carry no digits ------------------------------------------
const pairs = [];
const walk = (value, path) => {
  if (value && typeof value.en === "string") pairs.push([path, value]);
  else if (value && typeof value === "object")
    for (const [key, inner] of Object.entries(value)) walk(inner, `${path}.${key}`);
};
walk(G, "G");
walk(PARENT, "PARENT");
assert.ok(pairs.length > 90, `copy pairs found: ${pairs.length}`);
for (const [path, pair] of pairs) {
  assert.ok(pair.en.trim() && pair.es.trim(), `${path} has English and Spanish`);
  if (!/^G\.(brand|steps\.)/.test(path))
    assert.notEqual(pair.en, pair.es, `${path}: Spanish is not a copy of English`);
  assert.ok(
    !/\busted\b/i.test(pair.es),
    `${path}: ustedes for adults, tu for the child, never singular usted`,
  );
}
for (const key of STRAND_KEYS) {
  const lines = PARENT[key];
  assert.ok(lines, `parent say/avoid for strand ${key}`);
  for (const lang of ["en", "es"])
    for (const field of ["say", "avoid"])
      assert.ok(!/\d/.test(lines[field][lang]), `${key}.${field}.${lang} has no digits`);
}
for (const key of ["parentNoMath", "sayLabel", "avoidLabel", "askLabel", "calmNote"])
  assert.ok(!/\d/.test(G[key].en + G[key].es));
// Celebrate and Continue stay calm: no timers, no streaks, no rankings.
const calm =
  /\b(countdown|timer|streak|leaderboard|ranking|racha|clasificaci[oó]n)\b|time left|tiempo restante/i;
for (const [path, pair] of pairs)
  assert.ok(!calm.test(pair.en) && !calm.test(pair.es), `${path} is calm`);

// ---- the learn bank: both languages, no answer of its own round, and its arithmetic is true ------------------------------
const leaks = (text, answer) => {
  const needle = String(answer).trim().toLowerCase();
  if (!needle) return false;
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // The answer as its own token: not inside a longer number, a decimal, a thousands group or a fraction.
  return new RegExp(`(?<![\\p{L}\\p{N}.,/])${escaped}(?![\\p{L}\\p{N}/])(?![.,]\\d)`, "u").test(
    text.toLowerCase(),
  );
};
let cards = 0;
let equations = 0;
const NUM = String.raw`[−-]?\d[\d,]*(?:\.\d+)?`;
const EQUATION = new RegExp(
  String.raw`(?<![−\-\d.,])(${NUM}(?:\s*[+\-−×÷*]\s*${NUM})+)\s*=\s*(${NUM})(?![\d/])(?!\s*[+\-−×÷*/?])`,
  "g",
);
for (const game of games) {
  const bank = JSON.parse(readFileSync(new URL(`learn-bank/${game.id}.json`, DIR), "utf8"));
  assert.deepEqual(
    Object.keys(bank).sort(),
    game.skills.map((s) => s.id).sort(),
    `${game.id}: a card for every skill`,
  );
  for (const skill of game.skills) {
    const [low, high] = skill.grades;
    for (const [band, grade, level] of [
      ["lo", low, 1],
      ["hi", high, 2],
    ]) {
      if (band === "hi" && high === low) {
        assert.equal(
          bank[skill.id].hi,
          undefined,
          `${game.id}/${skill.id}: no second card for a one-grade skill`,
        );
        continue;
      }
      const card = bank[skill.id][band];
      const fresh = buildLearn({ game, skill, grade, level, seed: 7 });
      assert.deepEqual(
        card,
        { idea: fresh.idea, example: fresh.example },
        `${game.id}/${skill.id}/${band} matches the game`,
      );
      const answer = game.answerText(fresh.round);
      for (const lang of ["en", "es"]) {
        assert.ok(
          card.idea[lang].length > 15 && card.example[lang].length > 15,
          `${game.id}/${skill.id}/${band}/${lang} is written`,
        );
        assert.ok(
          !leaks(card.idea[lang], answer) && !leaks(card.example[lang], answer),
          `${game.id}/${skill.id}/${band}/${lang} does not state the answer "${answer}"`,
        );
        for (const m of card.example[lang].matchAll(EQUATION)) {
          const exact = evaluateExpression(m[1]);
          const stated = parseAnswerValue(m[2]);
          if (exact === null || stated === null) continue;
          equations += 1;
          assert.ok(
            exact.eq(stated),
            `${game.id}/${skill.id}/${band}/${lang}: "${m[0]}" is not true`,
          );
        }
      }
      cards += 1;
    }
  }
}
assert.ok(
  cards > 250 && equations > 100,
  `bank sweep is not empty (${cards} cards, ${equations} equations)`,
);

// ---- choosing tonight -----------------------------------------------------------------------------------------------
const index = (grade) =>
  games
    .map((g) => ({
      ...g,
      skills: g.skills.filter((s) => s.grades[0] <= grade && grade <= s.grades[1]),
    }))
    .filter((g) => g.skills.length);
for (let grade = 0; grade <= 8; grade += 1) {
  for (const minutes of [5, 10]) {
    const plan = pickTonight({ grade, games: index(grade), state: null, minutes, seed: 3 });
    assert.ok(plan, `grade ${grade} has a plan`);
    const tg = gameById.get(plan.target.gameId);
    const skill = tg.skills.find((s) => s.id === plan.target.skillId);
    assert.ok(skill.grades[0] <= grade && grade <= skill.grades[1], "target covers the grade");
    assert.notEqual(plan.play.gameId, plan.target.gameId, "Play is a different game");
    assert.notEqual(plan.play.gameId, DUEL_ID, "a solo session never needs a second player");
    assert.notEqual(plan.target.gameId, DUEL_ID);
    assert.deepEqual(plan.rounds, ROUNDS[minutes]);
    assert.ok(plan.minutes === minutes && plan.rounds.try + plan.rounds.play <= 8);
  }
}
const pinned = pickTonight({
  grade: 4,
  games: index(4),
  pinned: { gameId: "number-builder", skillId: "g4-discs", level: 2 },
  seed: 1,
});
assert.deepEqual([pinned.target.gameId, pinned.target.skillId], ["number-builder", "g4-discs"]);
const wrongGrade = pickTonight({
  grade: 1,
  games: index(1),
  pinned: { gameId: "number-builder", skillId: "g4-discs", level: 1 },
  seed: 1,
});
assert.ok(
  !(wrongGrade.target.gameId === "number-builder" && wrongGrade.target.skillId === "g4-discs"),
  "a pinned skill that does not cover the grade is ignored",
);
assert.equal(pickTonight({ grade: 4, games: [], seed: 1 }), null);

// What happened shapes the next pick: a weak skill is offered again, a strong one moves on.
const weak = emptyState();
let record;
for (let i = 0; i < 6; i += 1)
  record = applyAttempt(record, { correct: false, hints: 2, level: 1 }, Date.now() - 86400000 * 3);
weak.skills["number-builder:g4-discs"] = record;
const afterWeak = pickTonight({ grade: 4, games: index(4), state: weak, seed: 1 });
assert.deepEqual(
  [afterWeak.target.gameId, afterWeak.target.skillId],
  ["number-builder", "g4-discs"],
  "a struggling skill comes back",
);

// ---- Continue ---------------------------------------------------------------------------------------------------------
const active = (tryRes, explain = "model") => ({
  grade: 4,
  target: { gameId: "number-builder", skillId: "g4-discs", level: 2 },
  tryRes,
  explain,
});
assert.equal(accuracy({ correct: 3, rounds: 4 }), 0.75);
assert.equal(accuracy(null), 0);
const again = nextPlan({ active: active({ correct: 4, rounds: 4 }, "unsure"), games: index(4) });
assert.deepEqual(
  [again.kind, again.skillId, again.level],
  ["again", "g4-discs", 1],
  "unsure repeats the skill, gentler",
);
assert.equal(
  nextPlan({ active: active({ correct: 1, rounds: 4 }), games: index(4) }).kind,
  "again",
);
assert.equal(nextPlan({ active: active({ correct: 3, rounds: 4 }), games: index(4) }).kind, "keep");
const next = nextPlan({ active: active({ correct: 4, rounds: 4 }), games: index(4) });
assert.equal(next.kind, "next");
assert.ok(
  !(next.gameId === "number-builder" && next.skillId === "g4-discs"),
  "next is a different skill",
);
assert.equal(
  nextPlan({
    active: {
      ...active({ correct: 4, rounds: 4 }),
      target: { gameId: "number-builder", skillId: "g4-discs", level: 3 },
    },
    games: [],
  }).level,
  3,
  "level never passes 3",
);

// ---- Explain ------------------------------------------------------------------------------------------------------------
const nb = gameById.get("number-builder");
const skill = nb.skills.find((s) => s.id === "g4-discs");
const explain = buildExplain({ game: nb, skill, grade: 4, seed: 9, idea: { en: "x", es: "x" } });
assert.deepEqual(explain.options, EXPLAIN_OPTIONS);
for (const id of EXPLAIN_OPTIONS) assert.ok(G.helped[id].en && G.helped[id].es);
assert.ok(explain.ask.en && explain.ask.es && !/\d/.test(explain.ask.en));
const learn = learnFromBank({
  card: JSON.parse(readFileSync(new URL("learn-bank/number-builder.json", DIR), "utf8"))[
    "g4-discs"
  ],
  gameId: "number-builder",
  skill,
  grade: 4,
});
for (const field of ["idea", "example", "ask", "say", "avoid", "lookFor", "ifStuck"])
  assert.ok(learn[field]?.en && learn[field]?.es, `learn.${field} has both languages`);

// ---- the local record -----------------------------------------------------------------------------------------------------
assert.deepEqual(sanitizeGuided(null), sanitizeGuided("garbage"));
assert.equal(
  sanitizeGuided({
    v: 1,
    active: { step: "learn", id: "1", target: { gameId: "Bad Id", skillId: "x" }, play: {} },
  }).active,
  null,
  "a damaged active session is dropped",
);
const shared = new Map();
const disk = { getItem: (k) => shared.get(k) ?? null, setItem: (k, v) => shared.set(k, v) };
let clock = 1000;
const open = (profile = 0, warn = () => {}) =>
  createGuidedStore({ profile, storage: disk, onUnavailable: warn, now: () => (clock += 1) });
const plan = pickTonight({ grade: 4, games: index(4), seed: 5 });
const store = open();
const begun = store.begin(plan);
assert.equal(begun.step, "learn");
store.update({ step: "try" });
store.update({ tryRes: { correct: 3, rounds: 4, hints: 1 }, step: "play", playStarted: true });
const reopened = open();
assert.equal(reopened.state.active.step, "play", "a reload resumes the same step");
assert.deepEqual(reopened.state.active.tryRes, { correct: 3, rounds: 4, hints: 1 });
assert.equal(open(1).state.active, null, "another learner has their own record");
reopened.update({
  explain: "check",
  playRes: { correct: 2, rounds: 2, hints: 0 },
  step: "celebrate",
});
const line = reopened.finish({ gameId: "math-match", skillId: "g4-equiv", level: 1, kind: "next" });
assert.deepEqual([line.correct, line.total, line.explain], [3, 4, "check"]);
assert.equal(reopened.finish(null), null, "a session is recorded once");
assert.equal(reopened.state.history.length, 1);
assert.deepEqual(
  Object.keys(reopened.state.history[0]).sort(),
  ["at", "correct", "explain", "gameId", "grade", "skillId", "total"],
  "history holds only what the report shows",
);
assert.ok(
  !/streak|score|rank|leader|timer/i.test(JSON.stringify(reopened.state)),
  "no streak, score, ranking or timer is stored",
);
for (let i = 0; i < 40; i += 1) {
  const s = open();
  s.begin(plan);
  s.finish(null);
}
assert.ok(open().state.history.length <= 30, "history is capped");

// Storage that throws, and storage that cannot even be named, both warn exactly once and still work.
let warned = 0;
const broken = createGuidedStore({
  storage: {
    getItem: () => {
      throw new Error("blocked");
    },
    setItem: () => {
      throw new Error("full");
    },
  },
  onUnavailable: () => (warned += 1),
});
broken.begin(plan);
broken.update({ step: "try" });
assert.equal(warned, 1, "one calm warning");
assert.equal(broken.state.active.step, "try", "the session keeps working in memory");
let warnedNone = 0;
const none = createGuidedStore({ onUnavailable: () => (warnedNone += 1) });
none.begin(plan);
assert.equal(warnedNone, 1, "no localStorage in this runtime counts as unavailable");

console.log(
  `Guided family session logic: ${cards} learn cards, ${equations} worked equations recomputed, ${pairs.length} copy pairs, resume and storage fallbacks checked.`,
);

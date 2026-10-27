// The family coach: role alternation, rotating questions, the bilingual bank, kind language, and the promise that no
// text can hand a caregiver a number. @fm2 FM-027 FM-028 FM-020 FM-065
import assert from "node:assert/strict";
import {
  coachingCard,
  explain,
  GAME_TIPS,
  GENERIC_ASKS,
  gameTip,
  STRAND_BANK,
  STRAND_KEYS,
  strandKey,
  turn,
  turnRole,
} from "../../math/fluency-lab/family/fm2/coach.js";
import { missingLanguages } from "../../math/fluency-lab/family/fm2/lang.js";
import { FAKE_GAMES } from "./fixtures/fake-games.mjs";

let checks = 0;
const ok = (c, m) => {
  assert.ok(c, m);
  checks += 1;
};
const GAME_IDS = [
  "number-builder",
  "math-match",
  "fraction-kitchen",
  "math-market",
  "array-architect",
  "number-line-quest",
  "pattern-detective",
  "ratio-recipe-lab",
  "math-puzzle-studio",
  "family-math-duel",
];
const TWELVE = [
  "counting-place-value",
  "addition-subtraction",
  "multiplication-division",
  "fractions",
  "decimals",
  "ratios-percents",
  "patterns-algebra",
  "geometry-measure",
  "money",
  "number-line",
  "equations",
  "data",
];

// Words that judge, hurry or belittle. Letters-only boundaries so "mal" does not match inside another word.
const BANNED = [
  "wrong",
  "incorrect",
  "bad",
  "dumb",
  "stupid",
  "silly",
  "lazy",
  "easy",
  "obvious",
  "obviously",
  "simple",
  "just",
  "hurry",
  "fail",
  "failed",
  "slow",
  "careless",
  "should know",
  "mistake",
  "incorrecto",
  "incorrecta",
  "mal",
  "mala",
  "malo",
  "tonto",
  "tonta",
  "torpe",
  "fácil",
  "obvio",
  "obviamente",
  "simplemente",
  "apúrate",
  "rápido",
  "lento",
  "descuidado",
  "equivocado",
  "error",
];
const hasWord = (text, word) => new RegExp(`(?<![\\p{L}])${word}(?![\\p{L}])`, "iu").test(text);
const kind = (text) => !BANNED.some((w) => hasWord(text, w));
const YES_NO_EN =
  /^(is|are|am|do|does|did|can|could|will|would|should|have|has|had|was|were|may|might)\b/i;
const YES_NO_ES =
  /^¿(es|está|están|son|puedes|puede|podrías|tienes|tiene|hay|has|ha|hace|haces|quieres|sabes|crees|te gusta|lo|la|ya|fue)(?![\p{L}])/iu;
const OPEN_EN =
  /^(how|why|what|which|where|when|who|tell|show|explain|describe|make|find|name|say|pick|write|draw)\b/i;
const OPEN_ES =
  /^¿?(cómo|por qué|qué|cuál|cuáles|cuánto|cuántos|cuántas|dónde|cuándo|quién|en qué|de qué|a qué|entre cuáles|y si)(?![\p{L}])|^(cuéntame|muéstrame|explícame|dime|describe|inventa|busca|nombra|escribe|dibuja)(?![\p{L}])/iu;

// ---- the bank is complete and bilingual ------------------------------------------------------------------------------
ok(
  STRAND_KEYS.length >= 12 && TWELVE.every((k) => STRAND_KEYS.includes(k)),
  "the twelve strands are present",
);
const everyText = [];
for (const key of TWELVE) {
  const bank = STRAND_BANK[key];
  ok(
    bank && bank.ask.length >= 3 && bank.lookFor && bank.ifStuck && bank.extend,
    `${key}: three questions, listen-for, if-stuck, extension`,
  );
  ok(
    missingLanguages(bank, key).length === 0,
    `${key}: bilingual (${missingLanguages(bank, key)})`,
  );
  for (const ask of bank.ask) {
    ok(!YES_NO_EN.test(ask.en) && OPEN_EN.test(ask.en), `${key}: "${ask.en}" is an open question`);
    ok(!YES_NO_ES.test(ask.es) && OPEN_ES.test(ask.es), `${key}: "${ask.es}" is an open question`);
    ok(/\?$/.test(ask.en) || /\.$/.test(ask.en), "punctuated");
  }
  ok(
    /^Listen for/.test(bank.lookFor.en) && /^Escucha/.test(bank.lookFor.es),
    `${key}: listen-for starts as guidance`,
  );
  everyText.push(
    ...bank.ask.flatMap((a) => [a.en, a.es]),
    bank.lookFor.en,
    bank.lookFor.es,
    bank.ifStuck.en,
    bank.ifStuck.es,
    bank.extend.en,
    bank.extend.es,
  );
  ok(new Set(bank.ask.map((a) => a.en)).size === bank.ask.length, `${key}: questions differ`);
}
ok(
  GENERIC_ASKS.length >= 8 && missingLanguages(GENERIC_ASKS, "generic").length === 0,
  "generic question bank",
);
for (const ask of GENERIC_ASKS)
  ok(!YES_NO_EN.test(ask.en) && !YES_NO_ES.test(ask.es), `generic "${ask.en}" is open`);
everyText.push(...GENERIC_ASKS.flatMap((a) => [a.en, a.es]));
ok(
  GAME_IDS.every((id) => GAME_TIPS[id] && missingLanguages(GAME_TIPS[id], id).length === 0),
  "one bilingual tip per game",
);
ok(new Set(GAME_IDS.map((id) => GAME_TIPS[id].en)).size === 10, "ten different tips");
everyText.push(...GAME_IDS.flatMap((id) => [GAME_TIPS[id].en, GAME_TIPS[id].es]));
ok(
  gameTip("nope").en.length > 10 &&
    gameTip("__proto__").en.length > 10 &&
    gameTip("constructor").es.length > 10,
  "unknown games and prototype names get the default tip",
);
for (const text of everyText) {
  ok(kind(text), `no judgmental word in: ${text}`);
  ok(!/\d/.test(text), `the coach never prints a digit: ${text}`);
  ok(text.length >= 12 && text.length <= 330, `reasonable length: ${text}`);
  ok(
    !/\b(the answer is|equals)\b|la respuesta es|es igual a/i.test(text),
    `never states an answer: ${text}`,
  );
}
ok(
  new Set(everyText.filter((_, i) => i % 2 === 0)).size > 60,
  "a deep bank of distinct English texts",
);

// ---- strand classification ---------------------------------------------------------------------------------------------
const SAMPLES = [
  ["Place value", "counting-place-value"],
  ["Counting", "counting-place-value"],
  ["Addition and subtraction", "addition-subtraction"],
  ["Subtraction within 20", "addition-subtraction"],
  ["Multiplication and division", "multiplication-division"],
  ["Arrays and area models", "multiplication-division"],
  ["Fractions", "fractions"],
  ["Equivalent fractions", "fractions"],
  ["Decimals", "decimals"],
  ["Tenths and hundredths", "decimals"],
  ["Ratios and percents", "ratios-percents"],
  ["Unit rates", "ratios-percents"],
  ["Patterns and algebra", "patterns-algebra"],
  ["Growing patterns", "patterns-algebra"],
  ["Geometry and measurement", "geometry-measure"],
  ["Area and perimeter", "geometry-measure"],
  ["Telling time", "geometry-measure"],
  ["Money", "money"],
  ["Coins and change", "money"],
  ["Number line", "number-line"],
  ["Integers", "number-line"],
  ["Equations", "equations"],
  ["Solve for the variable", "equations"],
  ["Data", "data"],
  ["Graphs and statistics", "data"],
  ["Probability", "data"],
];
for (const [name, expected] of SAMPLES) {
  ok(
    strandKey(name) === expected && strandKey({ en: name, es: "x" }) === expected,
    `"${name}" -> ${expected} (got ${strandKey(name)})`,
  );
}
ok(
  strandKey("", "add-within-20", "math-match") === "addition-subtraction" &&
    strandKey("", "", "math-market") === "money" &&
    strandKey(null, null, null) === "addition-subtraction",
  "falls back to the skill id, the game id, then a safe default",
);
ok(
  TWELVE.every((k) => STRAND_KEYS.includes(strandKey(STRAND_BANK[k] ? k.replaceAll("-", " ") : k))),
  "every key name maps to a known strand",
);
for (const game of FAKE_GAMES)
  for (const skill of game.skills)
    ok(STRAND_KEYS.includes(strandKey(skill.strand, skill.id, game.id)), `${skill.id} classifies`);

// ---- turns: learner solves / caregiver asks why, then swap; the duel has both playing -----------------------------------
for (const game of FAKE_GAMES) {
  const skill = game.skills[3];
  const seenAsk = new Set();
  for (let index = 0; index < 12; index += 1) {
    const t = turn({ index, game, skill, grade: 3, lang: index % 2 ? "es" : "en" });
    ok(
      t.role === (index % 2 === 0 ? "learner" : "caregiver") && t.role === turnRole(index),
      `${game.id} #${index}: roles alternate starting with the learner`,
    );
    ok(
      missingLanguages(t.prompt, "prompt").length === 0 &&
        t.prompt.en !== t.prompt.es &&
        kind(t.prompt.en) &&
        kind(t.prompt.es) &&
        !/\d/.test(t.prompt.en + t.prompt.es),
      `${game.id} #${index}: clean bilingual prompt`,
    );
    if (game.id === "family-math-duel") {
      ok(
        /Both of you play/.test(t.prompt.en) && /Los dos juegan/.test(t.prompt.es),
        "duel: both people play every round",
      );
      ok(
        !/solve this round and think out loud/.test(t.prompt.en),
        "duel: no single-solver wording",
      );
    } else if (t.role === "learner")
      ok(
        /^Learner: solve/.test(t.prompt.en) &&
          /Caregiver:/.test(t.prompt.en) &&
          /^Estudiante: resuelve/.test(t.prompt.es),
        "learner solves, caregiver asks why",
      );
    else
      ok(
        /^Caregiver: solve/.test(t.prompt.en) &&
          /Learner: you are the coach/.test(t.prompt.en) &&
          /^Familiar: resuelve/.test(t.prompt.es),
        "caregiver solves, learner coaches",
      );
    const ask = t.prompt.en.match(/"(.+)"$/)?.[1];
    ok(
      ask && STRAND_BANK[strandKey(skill.strand, skill.id, game.id)].ask.some((a) => a.en === ask),
      `${game.id} #${index}: the question comes from the strand's bank`,
    );
    seenAsk.add(ask);
  }
  ok(seenAsk.size === 3, `${game.id}: questions rotate through all three over six turns`);
  const again = turn({ index: 5, game, skill, grade: 3 });
  ok(
    JSON.stringify(again) === JSON.stringify(turn({ index: 5, game, skill, grade: 3 })),
    "deterministic",
  );
}
ok(
  turn({ index: -3 }).role === "learner" &&
    turn({ index: "x" }).role === "learner" &&
    turn({ index: 2.7 }).role === "learner" &&
    turn({ index: 3.2 }).role === "caregiver" &&
    turn().role === "learner",
  "odd indexes are sanitized",
);
ok(
  turn({ index: 0, game: null, skill: null }).prompt.en.length > 20,
  "turn works with no game or skill",
);

// ---- explain: a talk prompt that cannot contain the answer -----------------------------------------------------------------
{
  const game = FAKE_GAMES[0];
  const skill = game.skills[2];
  const secret = {
    prompt: { en: "What is 4217 + 5983?", es: "¿Cuánto es 4217 + 5983?" },
    answer: 10200,
    a: 4217,
    b: 5983,
    solution: "ten thousand two hundred",
  };
  const seen = new Set();
  for (let i = 0; i < 60; i += 1) {
    const round = {
      ...secret,
      prompt: { en: `What is ${i} + ${i + 1}?`, es: `¿Cuánto es ${i} + ${i + 1}?` },
      answer: i * 2 + 1,
    };
    const out = explain({ game, skill, grade: 3, lang: "en", round });
    ok(
      missingLanguages(out, "explain").length === 0 && kind(out.en) && kind(out.es),
      `explain #${i} is bilingual and kind`,
    );
    ok(
      !/\d/.test(out.en + out.es) && !out.en.includes(String(round.answer)),
      `explain #${i} leaks no number`,
    );
    ok(
      JSON.stringify(out) === JSON.stringify(explain({ game, skill, grade: 3, lang: "es", round })),
      "same round, same prompt in either language",
    );
    seen.add(out.en);
  }
  ok(seen.size >= 5, `explain rotates through many prompts (${seen.size})`);
  const circular = { prompt: {} };
  circular.prompt.self = circular;
  ok(
    explain({ game, skill, round: circular }).en.length > 5 &&
      explain().en.length > 5 &&
      explain({ round: null }).es.length > 5,
    "explain survives circular and missing rounds",
  );
}

// ---- coaching cards ---------------------------------------------------------------------------------------------------------
{
  let cards = 0;
  for (const game of FAKE_GAMES) {
    for (const skill of game.skills) {
      for (const grade of [0, 2, 3, 6, 8]) {
        const card = coachingCard({
          gameId: game.id,
          skillId: skill.id,
          strand: skill.strand,
          grade,
        });
        const key = strandKey(skill.strand, skill.id, game.id);
        ok(
          JSON.stringify(Object.keys(card)) ===
            JSON.stringify(["ask", "lookFor", "ifStuck", "extend"]),
          "card has exactly ask, lookFor, ifStuck, extend",
        );
        ok(
          missingLanguages(card, "card").length === 0 &&
            !/\d/.test(JSON.stringify(card)) &&
            kind(JSON.stringify(card).replace(/[{}":,]/g, " ")),
          "bilingual, number-free, kind",
        );
        ok(
          STRAND_BANK[key].ask.some((a) => a.en === card.ask.en),
          "ask comes from the strand",
        );
        ok(
          card.lookFor.en === STRAND_BANK[key].lookFor.en &&
            card.extend.es === STRAND_BANK[key].extend.es,
          "listen-for and extension come from the strand",
        );
        ok(
          card.ifStuck.en.startsWith(STRAND_BANK[key].ifStuck.en),
          "if-stuck starts from the strand",
        );
        if (grade <= 2)
          ok(
            card.ifStuck.en.length > STRAND_BANK[key].ifStuck.en.length &&
              /objects, fingers or a drawing/.test(card.ifStuck.en) &&
              /dedos/.test(card.ifStuck.es),
            "young learners get a concrete-materials reminder",
          );
        else
          ok(
            card.ifStuck.en === STRAND_BANK[key].ifStuck.en,
            "older learners get the strand text as is",
          );
        ok(
          JSON.stringify(card) ===
            JSON.stringify(
              coachingCard({ gameId: game.id, skillId: skill.id, strand: skill.strand, grade }),
            ),
          "deterministic",
        );
        cards += 1;
      }
    }
  }
  const asks = new Set(
    ["a", "b", "c", "d", "e", "f", "g", "h"].map(
      (id) => coachingCard({ skillId: `fraction-${id}`, strand: "Fractions", grade: 4 }).ask.en,
    ),
  );
  ok(asks.size >= 2, "the question rotates across skills of one strand");
  const bare = coachingCard();
  ok(
    bare.ask.en && bare.lookFor.es && bare.ifStuck.en && bare.extend.en,
    "card works with no input",
  );
  ok(cards === FAKE_GAMES.reduce((n, g) => n + g.skills.length, 0) * 5, `${cards} cards`);
}

console.log(`PASS coach: ${checks} checks`);

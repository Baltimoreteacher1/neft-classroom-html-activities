// The family home explains each skill with an authored sentence and files it under an authored topic. Every real
// skill must have both, in both languages, and the two corrections that started this (matching addition described
// with ratios, clocks described with shapes) are pinned. @fm2 FM-028 FM-035
import assert from "node:assert/strict";
import {
  coachingCard,
  STRAND_BANK,
  STRAND_KEYS,
  withoutListenLead,
} from "../../math/fluency-lab/family/fm2/coach.js";
import { loadAll } from "../../math/fluency-lab/family/fm2/registry.js";
import { skillExplanation } from "../../math/fluency-lab/family/fm2/skill-link.js";
import {
  noteFor,
  noteKey,
  SKILL_NOTES,
  SKILL_TOPICS,
  topicFor,
  topicOfSkill,
} from "../../math/fluency-lab/family/fm2/skill-notes.js";

let checks = 0;
const ok = (c, m) => {
  assert.ok(c, m);
  checks += 1;
};

const games = await loadAll();
const real = new Set();
const TOPICS = new Set([...STRAND_KEYS, "binomial-area"]);

for (const game of games) {
  for (const skill of game.skills) {
    const key = noteKey(game.id, skill.id);
    real.add(key);
    const note = SKILL_NOTES[key];
    ok(note, `${key} has an authored note`);
    for (const lang of ["en", "es"]) {
      const text = note[lang];
      ok(
        typeof text === "string" && text.trim().length >= 15 && text.length <= 220,
        `${key} ${lang} note is a sentence of sensible length`,
      );
      ok(/[.)]["»]?$/.test(text), `${key} ${lang} note ends like a sentence`);
      ok(text !== skill.title[lang], `${key} ${lang} note says more than the title`);
      ok(skillExplanation(skill, lang, game.id) === text, `${key} ${lang} is what the page shows`);
    }
    ok(note.en !== note.es, `${key} Spanish is not the English copied over`);
    ok(
      !/work through the prompt|explain how you know/i.test(note.en),
      `${key} is not the old generic fallback`,
    );
    // The old keyword guesser read "operations" as "ratio". A note may talk about ratios, percents or rates only when
    // the skill itself does.
    const own = `${skill.id} ${skill.title.en} ${skill.standard}`.toLowerCase();
    for (const term of ["ratio", "percent", "proportion", "unit rate"]) {
      if (new RegExp(`\\b${term}`, "i").test(note.en))
        ok(
          own.includes(term.split(" ")[0]) ||
            /constant|k\b|slope|origin|tip|tax|discount/.test(own),
          `${key} mentions "${term}" without being about it`,
        );
    }
    const topic = topicFor(game.id, skill.id);
    ok(TOPICS.has(topic), `${key} has a known topic (${topic})`);
    ok(Object.hasOwn(STRAND_BANK, topic), `${key} topic has a coaching bank`);
    ok(topicOfSkill(game, skill) === topic, `${key} topicOfSkill uses the authored topic`);
  }
}
ok(real.size === 209, `209 skills across the ten games (found ${real.size})`);
for (const key of Object.keys(SKILL_NOTES)) ok(real.has(key), `${key} is a real skill`);
for (const key of Object.keys(SKILL_TOPICS))
  ok(real.has(key), `${key} topic belongs to a real skill`);

// The two reported mismatches
const matchAdd = SKILL_NOTES["math-match:g1-add"];
ok(
  /addition/i.test(matchAdd.en) && !/ratio|percent|rate/i.test(matchAdd.en),
  "matching addition is described as addition",
);
ok(
  /addici[oó]n|suma/i.test(matchAdd.es) && !/raz[oó]n|porcentaje/i.test(matchAdd.es),
  "matching addition is described as addition in Spanish",
);
const matchTime = SKILL_NOTES["math-match:g1-time"];
ok(
  /clock/i.test(matchTime.en) &&
    /time/i.test(matchTime.en) &&
    !/shape|dimension|measur/i.test(matchTime.en),
  "matching time is about clocks and time",
);
ok(
  /reloj/i.test(matchTime.es) &&
    /hora/i.test(matchTime.es) &&
    !/figura|dimension/i.test(matchTime.es),
  "matching time is about clocks in Spanish",
);
ok(
  topicFor("math-match", "g1-time") === "geometry-measure" &&
    topicFor("math-match", "g1-add") === "addition-subtraction",
  "those two skills are filed under measuring and adding",
);

// Skill ids that several games share resolve by game, and are refused without one rather than guessed
ok(
  SKILL_NOTES["number-builder:k-count"].en !== SKILL_NOTES["array-architect:k-count"].en,
  "k-count differs by game",
);
ok(
  noteFor("", "k-count") === null &&
    noteFor("", "g8-expand") === SKILL_NOTES["array-architect:g8-expand"],
  "an ambiguous id needs its game; a unique one does not",
);

// Coaching: the card follows the authored topic, and its "look for" row never says "Listen for" twice
const clocks = coachingCard({
  gameId: "math-match",
  skillId: "g1-time",
  strand: games.find((g) => g.id === "math-match").skills.find((s) => s.id === "g1-time").strand,
  grade: 1,
  topic: "geometry-measure",
});
ok(
  STRAND_BANK["geometry-measure"].ask.includes(clocks.ask),
  "an explicit topic selects that coaching bank",
);
const keywordCard = coachingCard({
  gameId: "math-match",
  skillId: "g1-time",
  strand: { en: "Measurement and data" },
  grade: 1,
});
ok(
  STRAND_BANK.data.ask.includes(keywordCard.ask),
  "without a topic the keyword match still files this skill under data (why the topic exists)",
);
for (const [key, bank] of Object.entries(STRAND_BANK)) {
  const bare = withoutListenLead(bank.lookFor);
  ok(
    !/^listen for/i.test(bare.en) && !/^escucha si/i.test(bare.es),
    `${key} look-for has no duplicated lead`,
  );
  ok(
    bare.en.length > 20 && bare.es.length > 20 && bare.en.length < bank.lookFor.en.length,
    `${key} look-for keeps its content`,
  );
}
console.log(`fm2 skill notes: ${checks} checks passed.`);

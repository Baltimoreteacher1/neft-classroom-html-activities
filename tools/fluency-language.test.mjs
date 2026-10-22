// Fluency Lab language layer: word bank, sentence frames, Spanish stems, journal, honest language score, backup.
// Run: node tools/fluency-language.test.mjs
import assert from "node:assert/strict";

const store = new Map();
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
  },
});
Object.defineProperty(globalThis, "window", {
  configurable: true,
  value: { dispatchEvent() {}, addEventListener() {} },
});
globalThis.CustomEvent = class {};

const lab = "../math/fluency-lab/";
const { ALL_SKILLS, generateProblem, seededRandom } = await import(`${lab}problem-bank.js`);
const terms = await import(`${lab}language-terms.js`);
const frames = await import(`${lab}language-frames.js`);
const journal = await import(`${lab}language-journal.js`);
const settings = await import(`${lab}language-settings.js`);
const spanish = await import(`${lab}question-es.js`);
const { storyFor } = await import(`${lab}story-problems.js`);
const card = await import(`${lab}language-card.js`);
const play = await import(`${lab}play-backup.js`);
const i18n = await import(`${lab}i18n.js`);
const { ES } = await import(`${lab}i18n-es.js`);

let checks = 0;
const ok = (condition, message) => {
  checks += 1;
  assert.ok(condition, message);
};

// 1. Every one of the 80 skills has a family and focus words that exist.
const skillIdsInBank = new Set(terms.skillIds());
for (const skill of ALL_SKILLS) {
  ok(skillIdsInBank.has(skill.id), `skill ${skill.id} has no language profile`);
  const profile = terms.languageProfile(skill);
  ok(terms.FAMILIES.includes(profile.family), `${skill.id}: unknown family ${profile.family}`);
  ok(profile.terms.length >= 3 && profile.terms.every(Boolean), `${skill.id}: needs 3+ real words`);
}
for (const id of skillIdsInBank)
  ok(
    ALL_SKILLS.some((skill) => skill.id === id),
    `bank names a skill that is not in the lab: ${id}`,
  );

// 2. Word bank quality: both languages, no digits (a definition can never echo an answer), every word used.
const usedTerms = new Set();
for (const id of skillIdsInBank)
  for (const term of terms.languageProfile({ id }).terms) usedTerms.add(term.id);
for (const term of terms.allTerms()) {
  ok(term.en && term.es && term.defEn && term.defEs, `${term.id}: missing text`);
  ok(term.defEn !== term.defEs, `${term.id}: Spanish meaning is a copy`);
  ok(!/\d/.test(term.defEn + term.defEs), `${term.id}: a meaning contains a digit`);
  ok(
    term.defEn.split(" ").length <= 20 && term.defEs.split(" ").length <= 24,
    `${term.id}: meaning too long`,
  );
  ok(usedTerms.has(term.id), `${term.id}: no skill uses this word`);
}
for (const family of terms.FAMILIES) {
  ok(
    terms.doneMoves(family).length >= 4 && terms.checkMoves(family).length >= 3,
    `${family}: too few phrases`,
  );
  for (const move of [...terms.doneMoves(family), ...terms.checkMoves(family)])
    ok(move.en && move.es && !/\d/.test(move.en + move.es), `${family}: bad phrase`);
}
ok(
  terms.languageProfile({ grade: 3, name: "Equivalent fractions" }).family === "fraction",
  "trail focus resolves by name",
);
ok(terms.languageProfile({ grade: 3, name: "zzz" }).terms.length === 3, "unknown focus falls back");
ok(
  terms.termsInText("The Denominador is bottom and I Estimated").sort().join() ===
    "denominator,estimate",
  "terms found in both languages",
);

// 3. Frames: three levels plus prompts, both languages, same blanks, no digits, no unfilled gaps in prompts.
for (const level of [1, 2, 3]) {
  for (const fn of frames.functionsFor(level)) {
    const list = frames.framesFor(level, fn.id);
    ok(list.length >= 1 || fn.id === "compare", `level ${level} ${fn.id}: no frame`);
    for (const frame of list) {
      ok(
        frames.blanks(frame.en) === frames.blanks(frame.es) && frames.blanks(frame.en) >= 1,
        `level ${level} ${fn.id}: blank count differs`,
      );
      ok(!/\d/.test(frame.en + frame.es), "a frame contains a digit");
    }
  }
}
ok(
  frames.framesFor(1, "compare").length === 0 &&
    !frames.functionsFor(1).some((fn) => fn.id === "compare"),
  "level 1 has no compare",
);
for (const fn of frames.FUNCTIONS)
  ok(frames.promptFor(fn.id).es && frames.promptFor(fn.id).en, `${fn.id}: no prompt`);
ok(frames.startingFunction({ correct: false }) === "fix", "a miss opens on fix it");
ok(
  new Set([0, 1, 2, 3].map((count) => frames.startingFunction({ correct: true, count }))).size ===
    4,
  "hits rotate through four moves",
);
ok(frames.connectors().length >= 8, "joining words");

// 4. Spanish stems: every wordy generated stem translates, keeps its numbers, and leaves no English behind.
const digits = (text) => (String(text).match(/\d+/g) || []).sort().join(",");
const ENGLISH = /\b(the|and|of|is|what|find|how|many|which|with|for|does|have|round|volume)\b/i;
let wordy = 0;
for (const skill of ALL_SKILLS) {
  for (let seed = 1; seed <= 120; seed += 1) {
    let item;
    try {
      item = generateProblem(skill, seededRandom(seed * 7919 + skill.id.length));
    } catch {
      continue;
    }
    const es = spanish.questionEs(item);
    if (spanish.isWordy(item.question)) {
      wordy += 1;
      ok(es, `no Spanish for: ${item.question} (${skill.id})`);
      ok(digits(es) === digits(item.question), `numbers changed: ${item.question} -> ${es}`);
      ok(!/\b1 (horas|minutos|pies|yardas|metros|gramos)\b/.test(es), `singular needed: ${es}`);
      ok(!ENGLISH.test(es), `English left in: ${es}`);
    } else {
      ok(es === null, `a bare expression should have no Spanish: ${item.question}`);
    }
    const labels = spanish.choicesEs(item);
    if (labels) ok(labels.length === item.choices.length, "choice count");
  }
}
ok(wordy > 2000, `expected many wordy stems, saw ${wordy}`);

// 5. Story problems carry matching Spanish, and are still deterministic.
for (const op of ["+", "−", "×", "÷"]) {
  for (let seed = 1; seed <= 30; seed += 1) {
    const a = op === "÷" ? 12 * (seed + 1) : 4 + seed;
    const b = op === "÷" ? 12 : 3 + (seed % 7);
    const answer = op === "+" ? a + b : op === "−" ? a - b : op === "×" ? a * b : a / b;
    const base = {
      kind: "number",
      question: `${a} ${op} ${b} = ?`,
      answers: [String(answer)],
      steps: ["x"],
    };
    const story = storyFor(base, seededRandom(seed));
    if (!story) continue;
    ok(
      digits(story.questionEs.replaceAll(",", "")) === digits(story.question.replaceAll(",", "")),
      `story numbers: ${story.questionEs}`,
    );
    ok(!ENGLISH.test(story.questionEs) && story.clueEs, `story Spanish: ${story.questionEs}`);
    ok(storyFor(base, seededRandom(seed)).question === story.question, "story is deterministic");
  }
}

// 6. Journal: reading the writing, cleaning it, and an honest score.
const idea = journal.analyze(
  "First I used the denominator, then I checked because the parts match.",
);
ok(
  idea.moves.term &&
    idea.moves.reason &&
    idea.moves.sequence &&
    idea.moves.check &&
    idea.count === 4,
  "four moves found",
);
const spanishIdea = journal.analyze("Primero usé el denominador porque las partes son iguales.");
ok(
  spanishIdea.moves.term && spanishIdea.moves.reason && spanishIdea.moves.sequence,
  "Spanish writing is read too",
);
ok(journal.analyze("I see ___ and ___").unfilled, "blanks are noticed");
ok(
  journal.analyze("").count === 0 && journal.analyze("hmm").count === 0,
  "nothing in, nothing found",
);
ok(journal.languageEvidence([], 0) === null, "no evidence, no score");
ok(
  journal.languageEvidence([], 3) > 0 && journal.languageEvidence([], 3) < 20,
  "lookups alone give a small score",
);
const strong = {
  text: "First I used the denominator because both parts match, then I checked.",
  at: 1,
};
ok(
  journal.languageEvidence([strong, strong], 0) >
    journal.languageEvidence([{ text: "I did it today", at: 1 }], 0),
  "richer writing scores higher",
);
ok(journal.languageEvidence(Array(40).fill(strong), 99) <= 100, "score is capped");
const dirty = journal.cleanJournal([
  {
    text: "x".repeat(900) + " denominator",
    id: "bad id!",
    fn: "nope",
    level: 9,
    grade: 12,
    day: "yesterday",
  },
  { text: "I see ___ here" },
  null,
  "string",
  {
    text: "ok then fine",
    skill: "6:ratios",
    grade: 6,
    day: "2026-10-22",
    fn: "check",
    level: 3,
    at: 5,
  },
]);
ok(dirty.length === 2, "blank-filled and junk entries dropped");
ok(
  dirty[0].text.length === 400 &&
    dirty[0].fn === "explain" &&
    dirty[0].level === 2 &&
    dirty[0].grade === 0 &&
    dirty[0].day === "",
  "hostile fields reset",
);
ok(
  journal.cleanJournal(Array(300).fill({ text: "three good words" })).length ===
    journal.MAX_ENTRIES,
  "journal is capped",
);

// 7. Storage per learner slot, levels, and the backup round trip.
settings.setLanguageProfile(0);
ok(settings.getLevel() === 2, "default level is Building");
ok(settings.setLevel(4) === 4 && settings.getLevel() === 4, "level saves");
ok(settings.setLevel(99) === 2, "bad level falls back");
settings.setLanguageProfile(1);
ok(settings.getLevel() === 2, "each learner slot has its own level");
const saved = journal.addEntry({
  text: "I used a number line because it shows the order",
  skill: "1:time",
  grade: 1,
  fn: "explain",
  level: 2,
  day: "2026-10-22",
});
ok(saved && journal.loadJournal().length === 1, "entry saved for slot 1");
ok(
  journal.addEntry({ text: "too short" }) === null &&
    journal.addEntry({ text: "I see ___ and more" }) === null,
  "short or blank entries refused",
);
settings.setLanguageProfile(0);
ok(journal.loadJournal().length === 0, "slot 0 does not see slot 1's writing");
settings.setLanguageProfile(1);
const exported = play.exportPlay();
ok(
  exported.language.journal.length === 1 && exported.language.level === 2,
  "backup carries the journal",
);
const roundTrip = play.cleanPlay(JSON.parse(JSON.stringify(exported)));
ok(roundTrip.language.journal.length === 1, "journal survives cleaning");
const hostile = play.cleanPlay({
  trail: {},
  rewards: {},
  language: {
    journal: [{ text: "<script>alert(1)</script> fine words here", id: "../x" }],
    level: "x",
  },
});
ok(
  hostile.language.level === 2 && !hostile.language.journal[0].id.includes("/"),
  "hostile backup is cleaned",
);
store.clear();
play.importPlay(roundTrip);
ok(
  journal.loadJournal().length === 1 && settings.getLevel() === 2,
  "import restores journal and level",
);
journal.removeEntry(journal.loadJournal()[0].id);
ok(journal.loadJournal().length === 0, "entry removed");

// 8. Screens: levels change what is shown; everything is escaped; Spanish page shows Spanish frames.
const skill = ALL_SKILLS.find((entry) => entry.id === "ratios");
const html = (level, extra = {}) => {
  settings.setLevel(level);
  return card.explainCardHtml({
    skill,
    skillKey: "6:ratios",
    grade: 6,
    correct: true,
    count: 1,
    day: "2026-10-22",
    ...extra,
  });
};
const level1 = html(1);
const level4 = html(4);
ok(
  level1.includes('data-lang-level="1"') && level1.includes('aria-pressed="true"'),
  "level buttons render",
);
ok(
  !level1.includes("lang-join") && html(2).includes("lang-join"),
  "joining words start at Building",
);
ok(
  level4.includes("lang-prompt") &&
    level4.includes("lang-starters") &&
    !level1.includes("lang-prompt"),
  "On my own asks a question; starters on request",
);
ok(
  /data-lang-fn="fix"\s+aria-pressed="true"/.test(
    card.explainCardHtml({ skill, correct: false, day: "d" }),
  ),
  "a miss opens on fix it",
);
ok(
  html(1, { count: 2 }).includes(" open>") && !html(1, { count: 1 }).includes(" open>"),
  "level 1 is invited on every second hit",
);
ok(!html(4, { count: 2 }).includes(" open>"), "On my own is never opened for the learner");
ok(
  !card.explainCardHtml({ skill, correct: false, count: 2 }).includes(" open>"),
  "a miss never opens the card",
);
const strip = card.wordStripHtml(skill);
ok(
  strip.includes("unit rate") === false && strip.includes("ratio") && strip.includes("razón"),
  "ratios words are shown in both languages",
);
const peek = card.spanishPeekHtml({ question: "Find the GCF of 12 and 18." });
ok(
  peek.includes("máximo común divisor") && card.spanishPeekHtml({ question: "12 + 5 = ?" }) === "",
  "peek only when there are words",
);
ok(
  card
    .explainCardHtml({ skill: { name: "<img src=x onerror=alert(1)>" }, correct: true })
    .includes("<img") === false,
  "no raw markup from skill names",
);
i18n.setLang("es");
settings.setLevel(2);
const es = card.explainCardHtml({ skill, correct: true, count: 0 });
ok(es.includes("Primero ___") && es.includes("Yo ___ porque"), "Spanish page shows Spanish frames");
ok(es.includes("Di cómo lo sabes"), "Spanish card title");
i18n.setLang("en");
ok(card.journalHtml().includes("Nothing saved yet"), "empty journal says so");
ok(card.languageScore() === null, "score is null with no evidence");

// 9. Every word on the new screens has Spanish.
const shown = [
  ...frames.LEVELS.flatMap((l) => [l.name, l.blurb]),
  ...frames.FUNCTIONS.map((f) => f.en),
  ...Object.values(card.MOVE_LABELS),
  ...Object.values(card.MOVE_FN),
  ...card.STAT_LABELS.map(([, label]) => label),
];
for (const key of shown) ok(ES[key], `no Spanish for: ${key}`);

console.log(`fluency-language: ${checks} checks passed`);

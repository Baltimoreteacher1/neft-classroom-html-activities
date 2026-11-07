// Fluency Lab 4.0 mini-lessons: for all 96 skills the data model has Learn It, Watch It, Try It and Explain It in
// order, every worked example and practice answer is recomputed by an independent solver, no hint or early step
// states an answer, every learner-facing string has Spanish, and the visuals table covers every skill.
// Run: node tools/fluency-mini-lessons.test.mjs

import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { TOTAL_SKILLS } from "./lib/fluency-skill-count.mjs";

const store = new Map();
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  },
});
Object.defineProperty(globalThis, "window", {
  configurable: true,
  value: { dispatchEvent() {}, addEventListener() {} },
});
globalThis.CustomEvent = class {};

const lab = new URL("../math/fluency-lab/", import.meta.url);
const mod = (path) => import(new URL(path, lab));
const { ALL_SKILLS, validateAnswer } = await mod("problem-bank.js");
const { buildMiniLesson, STEP_IDS, skillKeyOf } = await mod("lesson-4/build.js");
const { SKILL_VISUALS, visualsFor } = await mod("lesson-4/skill-visuals.js");
const { GRAPHIC_KINDS, ANIMATION_KINDS } = await mod("graphics/registry.js");
const { TRY_COUNT, hintLadder, supportFor } = await mod("lesson-4/practice.js");
const { stepLeaks, peekCap, leakCap } = await mod("step-leak.js");
const { allTerms } = await mod("language-terms.js");
const { solve, sameValue } = await import("./lib/mini-lesson-solver.mjs");
const { sanitizeResume } = await mod("lesson-4/resume.js");
const { ES_LAB4_LESSONS } = await mod("i18n-es-lab4-lessons.js");
const { ES: ES_BASE } = await mod("i18n-es.js");
const { analyze } = await mod("language-journal.js");

let checks = 0;
const ok = (condition, message) => {
  checks += 1;
  assert.ok(condition, message);
};

// 1. Four steps in order, at every support level, for all 96 skills.
ok(ALL_SKILLS.length === TOTAL_SKILLS, `${TOTAL_SKILLS} skills (found ${ALL_SKILLS.length})`);
const lessons = [];
for (const skill of ALL_SKILLS)
  for (const level of [1, 2, 3, 4]) {
    const lesson = buildMiniLesson(skill, { supportLevel: level, lang: level % 2 ? "en" : "es" });
    const where = `${skillKeyOf(skill)} L${level}`;
    ok(
      lesson.steps.map((step) => step.id).join() === STEP_IDS.join(),
      `${where} has Learn, Watch, Try, Explain in order`,
    );
    ok(lesson.supportLevel === level, `${where} keeps its support level`);
    lessons.push({ skill, level, lesson });
  }
// The same seed rebuilds the same lesson (resume depends on it).
{
  const skill = ALL_SKILLS[50];
  const a = buildMiniLesson(skill, { supportLevel: 2, seed: 99 });
  const b = buildMiniLesson(skill, { supportLevel: 2, seed: 99 });
  ok(
    a.steps[2].problems.map((p) => p.question).join() ===
      b.steps[2].problems.map((p) => p.question).join(),
    "a seed rebuilds the same problems",
  );
  const c = buildMiniLesson(skill, { supportLevel: 2, seed: 100 });
  ok(
    a.steps[2].problems.map((p) => p.question).join() !==
      c.steps[2].problems.map((p) => p.question).join(),
    "another seed gives fresh problems",
  );
}

// 2. Worked examples and Try-It problems: answers recomputed independently; hints and early steps never state them.
const stepArithmetic =
  /(?<![+−×÷] |[\d,./])(\d[\d,]*) ([+−×÷]) (\d[\d,]*) = (\d[\d,]*)(?![\d/]|\s*[+−×÷\d./])/g;
const asNumber = (text) => Number(String(text).replaceAll(",", ""));
let solved = 0;
let unsolved = 0;
function checkItem(item, where) {
  const found = solve(item.question);
  if (found !== null && found !== undefined) {
    solved += 1;
    ok(
      item.answers.some((answer) => sameValue(found, answer)),
      `${where} "${item.question}" answer ${item.answers} disagrees with the independent solver`,
    );
  } else unsolved += 1;
  for (const step of item.steps)
    for (const [, a, op, b, c] of step.matchAll(stepArithmetic)) {
      const [x, y, z] = [asNumber(a), asNumber(b), asNumber(c)];
      const want = op === "+" ? x + y : op === "−" ? x - y : op === "×" ? x * y : x / y;
      ok(want === z, `${where} step arithmetic ${a} ${op} ${b} = ${c}`);
    }
  ok(
    validateAnswer(item.displayAnswer, item) ||
      item.answers.some((answer) => validateAnswer(answer, item)),
    `${where} accepts its own answer`,
  );
  ok(!validateAnswer("zzz-not-an-answer", item), `${where} rejects nonsense`);
  if (item.choices)
    ok(
      item.choices.some((choice) => item.answers.includes(String(choice))),
      `${where} choices include the answer`,
    );
}
let exampleLeaks = 0;
for (const { skill, level, lesson } of lessons) {
  const where = `${skillKeyOf(skill)} L${level}`;
  const example = lesson.steps[0].example;
  checkItem(example, `${where} worked example`);
  ok(example.steps.length >= 2, `${where} worked example has steps`);
  ok(example.safeSteps === peekCap(example.item), `${where} example peek cap is the leak rule's`);
  // A division split ("6 × 90 = 540") is shown whole in a worked example; only a step that holds the answer counts.
  if (leakCap(example.item) < example.steps.length - 1) exampleLeaks += 1;
  const problems = lesson.steps[2].problems;
  ok(
    problems.length === TRY_COUNT,
    `${where} has ${TRY_COUNT} Try-It problems (got ${problems.length})`,
  );
  ok(
    new Set(problems.map((p) => p.question)).size === TRY_COUNT,
    `${where} Try-It problems are different`,
  );
  ok(
    !problems.some((p) => p.question === example.question),
    `${where} Try-It does not repeat the worked example`,
  );
  for (const problem of problems) {
    const at = `${where} try ${problem.index + 1} "${problem.question}"`;
    checkItem(problem, at);
    ok(problem.hints.length >= 1, `${at} has a hint`);
    for (const hint of problem.hints) {
      ok(!stepLeaks(hint.en, problem.item), `${at} hint states the answer: ${hint.en}`);
      const numeric =
        /^-?\d+(\.\d+)?$/.test(problem.displayAnswer) &&
        !new RegExp(`(?<![\\d.])${problem.displayAnswer}(?!\\d|\\.\\d)`).test(problem.question);
      ok(
        !(
          numeric &&
          new RegExp(`(?<![\\d.,])${problem.displayAnswer}(?!\\d|\\.\\d)`).test(
            hint.en.replaceAll(",", ""),
          )
        ),
        `${at} hint shows the number ${problem.displayAnswer}: ${hint.en}`,
      );
    }
    for (const step of problem.steps.slice(0, problem.safeSteps))
      ok(!stepLeaks(step, problem.item), `${at} early step states the answer: ${step}`);
    ok(problem.safeSteps === peekCap(problem.item), `${at} safe steps follow peekCap`);
    ok(
      problem.hints.length === hintLadder(problem.item, skill).length,
      `${at} ladder is rebuilt the same`,
    );
  }
}
ok(
  solved > unsolved * 8,
  `the independent solver covers most questions (${solved} solved, ${unsolved} not covered)`,
);
ok(exampleLeaks === 0, `${exampleLeaks} worked examples state the answer before their last step`);

// 3. Words: meanings hold no digits; Spanish is present and different; K-3 Learn It text passes the jargon rules.
for (const term of allTerms()) {
  ok(
    !/\d/.test(term.defEn) && !/\d/.test(term.defEs),
    `word card "${term.id}" meaning has a digit`,
  );
  ok(term.es && term.defEs, `word card "${term.id}" has Spanish`);
}
const TECHNICAL =
  /\b(addends?|digits?|regroup\w*|quotient|interval|cardinality|benchmark|decompos\w*|partial|numerator|denominator|cross-multipl\w*|greatest place|place value)\b/i;
const sentenceWords = (sentence) =>
  sentence
    .replace(/\d+(?:,\s?\d+)*/g, "n")
    .replace(/[:+−×÷=]+/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
for (const { skill, lesson } of lessons.filter((entry) => entry.level === 2)) {
  const [learn] = lesson.steps;
  const where = skillKeyOf(skill);
  ok(
    learn.idea.en && learn.idea.es && learn.idea.es !== learn.idea.en,
    `${where} idea has English and Spanish`,
  );
  ok(learn.watch.en && learn.watch.es, `${where} watch-out has English and Spanish`);
  ok(learn.words.length >= 1, `${where} has word cards`);
  ok(learn.visual && typeof learn.visual.reason === "string", `${where} has a visuals row`);
  if (skill.grade > 3) continue;
  const text = [learn.idea.en, learn.watch.en, ...learn.example.steps];
  for (const line of text) {
    ok(!TECHNICAL.test(line), `${where} Learn It uses a vocabulary word: ${line}`);
    for (const sentence of line.split(/(?<=[.?!])\s+/))
      ok(sentenceWords(sentence) <= 16, `${where} Learn It sentence too long: ${sentence}`);
  }
  ok(learn.words.length <= 3, `${where} young learners get at most three word cards`);
}

// 4. skill-visuals covers every skill with valid registry kinds and a reason; animations only where listed.
ok(
  Object.keys(SKILL_VISUALS).length === ALL_SKILLS.length,
  "the visuals table has one row per skill",
);
for (const skill of ALL_SKILLS) {
  const row = SKILL_VISUALS[skillKeyOf(skill)];
  ok(row, `${skillKeyOf(skill)} has a visuals row`);
  ok(row.reason && row.reason.length >= 12, `${skillKeyOf(skill)} documents why`);
  ok(
    row.graphic === null || GRAPHIC_KINDS.includes(row.graphic),
    `${skillKeyOf(skill)} graphic "${row.graphic}" is a registry kind`,
  );
  ok(
    row.animation === null || ANIMATION_KINDS.includes(row.animation),
    `${skillKeyOf(skill)} animation "${row.animation}" is a registry kind`,
  );
  ok(visualsFor(skill) === row, `${skillKeyOf(skill)} lookup matches`);
}
for (const kind of ANIMATION_KINDS)
  ok(
    Object.values(SKILL_VISUALS).some((row) => row.animation === kind),
    `animation "${kind}" is used by a skill`,
  );
ok(
  Object.values(SKILL_VISUALS).some((row) => row.graphic === null),
  "a skill may say none, with a reason",
);

// 5. Support fades: Try It, Explain It.
ok(
  supportFor(1).frame &&
    !supportFor(2).frame &&
    supportFor(1).picture === "open" &&
    supportFor(4).picture === "none" &&
    supportFor(4).hints === "after-miss",
  "Try-It support fades from level 1 to 4",
);
const fractionAdd = ALL_SKILLS.find((skill) => skill.id === "fraction-add");
const frameCount = (level) => buildMiniLesson(fractionAdd, { supportLevel: level }).steps[3].model;
const blanksIn = (text) => (text.match(/___/g) || []).length;
const explain = [1, 2, 3, 4].map(frameCount);
ok(
  blanksIn(explain[0].byFunction.explain.frames[0].en) <
    blanksIn(explain[1].byFunction.explain.frames[0].en) + 3,
  "Starter frame is a short sentence",
);
ok(
  explain[0].byFunction.explain.frames[0].en.length <
    explain[2].byFunction.explain.frames[0].en.length,
  "frames get longer, then open, as support fades",
);
ok(
  explain[0].byFunction.explain.framesOpen &&
    explain[2].byFunction.explain.framesOpen &&
    !explain[3].byFunction.explain.framesOpen,
  "level 4 hides the starters until asked",
);
ok(explain[0].did.length > 0 && explain[3].did.length === 0, "what-I-did chips fade at level 4");
ok(
  explain[0].connectors.length === 0 && explain[1].connectors.length > 0,
  "joining words start at level 2",
);
ok(
  explain[0].checklist.length === 2 && explain[1].checklist.length === 4,
  "the checklist shows two ideas at Starter, four after",
);
ok(
  buildMiniLesson(fractionAdd, { supportLevel: 2, missed: true }).steps[3].model.start === "fix",
  "after a miss Explain It opens on fix it",
);
for (const { skill, level, lesson } of lessons) {
  const model = lesson.steps[3].model;
  const where = `${skillKeyOf(skill)} L${level}`;
  ok(model.words.length >= 2, `${where} has a word bank`);
  for (const [id, entry] of Object.entries(model.byFunction)) {
    ok(entry.prompt.en && entry.prompt.es, `${where} ${id} prompt has both languages`);
    for (const frame of entry.frames) {
      ok(!/\d/.test(frame.en + frame.es), `${where} frame holds a digit: ${frame.en}`);
      ok(
        frame.en.includes("___") && frame.es.includes("___"),
        `${where} frame has a blank in both languages`,
      );
    }
  }
}
// The checklist is never a grade: it only reports which ideas are present.
const read = analyze(
  "First I made the bottoms the same because the pieces must match. I can check by drawing it.",
);
ok(
  read.moves.sequence && read.moves.reason && read.moves.check,
  "the checklist reads first-then, because and check",
);
ok(!("score" in read) && !("grade" in read), "the checklist carries no score");

// 6. Resume storage is bounded and backward compatible.
ok(
  sanitizeResume(null) === null &&
    sanitizeResume("x") === null &&
    sanitizeResume({ step: "nope" }) === null,
  "bad resume data is ignored",
);
const good = sanitizeResume({
  step: "try",
  seed: 12,
  tried: [true, false, null, true, true],
  at: 5,
  writing: "es",
  extra: "x",
});
ok(
  good.step === "try" &&
    good.seed === 12 &&
    good.tried.length === TRY_COUNT &&
    good.writing === "es" &&
    !("extra" in good),
  "resume keeps only known fields",
);

// 7. Every learner-facing t() string in the mini-lesson files has Spanish with matching placeholders.
const keys = new Set();
const scan = (url) => {
  const source = readFileSync(url, "utf8");
  for (const m of source.matchAll(/\bt\((?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)')/g))
    keys.add((m[1] ?? m[2]).replace(/\\(["'])/g, "$1"));
};
for (const file of readdirSync(lab).filter((f) => /^mini-lesson.*\.js$/.test(f)))
  scan(new URL(file, lab));
for (const file of readdirSync(new URL("lesson-4/", lab)).filter((f) => f.endsWith(".js")))
  scan(new URL(`lesson-4/${file}`, lab));
const holes = (text) =>
  [...text.matchAll(/\{(\w+)\}/g)]
    .map((m) => m[1])
    .sort()
    .join();
ok(keys.size > 40, `found the mini-lesson strings (${keys.size})`);
for (const key of keys) {
  ok(ES_BASE[key] !== undefined, `No Spanish for: ${key}`);
  ok(holes(ES_BASE[key]) === holes(key), `Placeholders differ for: ${key}`);
}
for (const key of Object.keys(ES_LAB4_LESSONS)) ok(keys.has(key), `Unused Spanish entry: ${key}`);

console.log(
  `fluency-mini-lessons: ${checks} checks passed (${lessons.length} lessons, ${solved} questions solved independently, ${unsolved} not covered by the solver)`,
);

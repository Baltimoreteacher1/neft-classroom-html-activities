// Every family homework page carries lesson-specific corner content and six basic practice items.
//   node tools/validate-family-homework-content.mjs [lessonId ...]   (no ids = every page except Unit 10)
import {
  notesIds,
  readNotes,
  validateAll,
  validateSidecar,
} from "./lib/family-homework-content.mjs";

// REASON: a "why" line must add a reason, not restate the stem and the correct choice. A caregiver reading the answer
// key learns nothing from "n is more than 10 matches n > 10." After the words already in the stem and the correct
// choice are removed, the line needs two or more new content words, or a connector or a calculation.
const STOP = new Set(
  "a an the is are was were be been of to in on at it its this that these those and or for with as by you your we our can will do does from has have had than there their they them he she his her what who how when where why also one two".split(
    " ",
  ),
);
const CONNECTOR =
  /\b(because|since|so|means|which|but|not|only|each|every|same|then|if|when|per)\b|[+=×÷−/]|\s-\s/i;
const contentWords = (s) =>
  (
    String(s)
      .toLowerCase()
      .match(/[a-z0-9]+/g) || []
  ).filter((w) => !STOP.has(w));
/** The formulaic tail "So the answer is: <choice>." only repeats the choice; it must not count as a reason. */
const withoutAnswerTail = (s) => String(s).replace(/\s*So the answer is:.*$/i, "");

/** @returns {boolean} true when the explanation only restates the stem and the correct choice. */
export function restatesAnswer(item) {
  const text = withoutAnswerTail(item.explanation);
  const known = new Set([
    ...contentWords(item.stem),
    ...contentWords(item.choices[item.correctIndex]),
  ]);
  const fresh = new Set(contentWords(text).filter((w) => !known.has(w)));
  return fresh.size <= 1 && !CONNECTOR.test(text);
}

function selfTests() {
  const item = (stem, right, explanation) => ({
    stem,
    choices: [right, "x"],
    correctIndex: 0,
    explanation,
  });
  const bad = [
    item("Which words match n > 10?", "n is more than 10", "n is more than 10 matches n > 10."),
    item("What undoes subtracting 4?", "Adding 4", "Adding 4 undoes subtracting 4."),
    item(
      "What is the peak?",
      "The tallest bar",
      "The tallest bar is called the peak. So the answer is: The tallest bar.",
    ),
  ];
  const good = [
    item(
      "Which words match n > 10?",
      "n is more than 10",
      "The symbol > means greater than, with no equal line, so n is more than 10 and cannot be 10 itself.",
    ),
    item(
      "What undoes subtracting 4?",
      "Adding 4",
      "Adding 4 undoes subtracting 4: 10 − 4 = 6, and 6 + 4 = 10.",
    ),
    item(
      "What is the volume of a box?",
      "60 cubic inches",
      "Length times width times height gives the space inside.",
    ),
  ];
  bad.forEach((b, i) => {
    if (!restatesAnswer(b)) throw new Error(`REASON self-test: bad fixture ${i} was not flagged`);
  });
  good.forEach((g, i) => {
    if (restatesAnswer(g)) throw new Error(`REASON self-test: good fixture ${i} was flagged`);
  });
}
selfTests();

function reasonProblems(ids) {
  const out = [];
  for (const id of ids) {
    (readNotes(id).basicPractice || []).forEach((it, i) => {
      if (it?.explanation && restatesAnswer(it))
        out.push(
          `${id}: basicPractice[${i}] REASON: explanation only restates the answer, add why: "${it.explanation}"`,
        );
    });
  }
  return out;
}

const want = process.argv.slice(2);
let problems;
if (want.length) problems = want.flatMap((id) => validateSidecar(id, readNotes(id)));
else problems = validateAll();
problems.push(...reasonProblems(want.length ? want : notesIds()));
if (problems.length) {
  for (const m of problems) console.error(m);
  console.error(
    `\n${problems.length} problem(s) across ${want.length || notesIds().length} homework page(s).`,
  );
  process.exit(1);
}
console.log(
  `family homework content: ${want.length || notesIds().length} page(s) have lesson-specific corner content and six basic practice items.`,
);

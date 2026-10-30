// The prompt a writing task opens with: a freshly generated problem from the chosen skill plus the task wording for
// the chosen organizer. A "classmate's answer" is either the correct answer or a plausible slip, so the learner has
// to decide; the prompt never says which.
import { ALL_SKILLS, generateProblem } from "./problem-bank.js";
import { questionEs } from "./question-es.js";

const NAMES = ["Maya", "Omar", "Lena", "Diego", "Amina", "Theo"];
const NUMBER = /^-?\d[\d,]*(?:\.\d+)?$/;
const FRACTION = /^(-?\d+)\/(\d+)$/;

// A near miss that a real learner might write. Returns "" when the answer has a shape this cannot alter safely.
export function slipOf(answer) {
  const text = String(answer ?? "").trim();
  if (NUMBER.test(text)) {
    const plain = text.replaceAll(",", "");
    if (plain.includes(".")) {
      const [whole, tail] = plain.split(".");
      const last = Number(tail.slice(-1));
      return `${whole}.${tail.slice(0, -1)}${last >= 5 ? last - 1 : last + 1}`;
    }
    const value = Number(plain);
    const step = Math.abs(value) >= 20 ? 10 : 1;
    const slip = value + step;
    return text.includes(",") ? slip.toLocaleString("en-US") : String(slip);
  }
  const fraction = FRACTION.exec(text);
  if (fraction) return `${Number(fraction[1]) + 1}/${fraction[2]}`;
  return "";
}

const showAnswer = (item) => String(item.displayAnswer ?? item.answers?.[0] ?? "");

// "24 × 46 = ?" reads as the bare expression; a word problem is shown whole.
export function problemText(item) {
  const bare = /^([^A-Za-z]+?)\s*=\s*\?$/.exec(item.question);
  return bare ? bare[1].trim() : item.question;
}

const classmate = (organizer, item, seed) => {
  const name = NAMES[seed % NAMES.length];
  const correct = showAnswer(item);
  const slip = slipOf(correct);
  // Find-and-fix always shows a slip; claim-evidence-reasoning alternates so the learner must decide.
  const useSlip = organizer === "fix" || seed % 2 === 0;
  const shown = useSlip && slip ? slip : correct;
  return { name, shown, wrong: shown !== correct };
};

// Returns { item, problem, claim, task } where task is { en, es } and claim is null unless the organizer shows one.
export function buildPrompt(skill, organizer, tasks, seed = 0, rng = Math.random) {
  const item = generateProblem(skill, rng);
  const claim =
    organizer === "cer" || organizer === "fix" ? classmate(organizer, item, seed) : null;
  const task = { ...tasks };
  if (claim && organizer === "fix" && !claim.wrong) {
    // No safe slip for this answer shape: ask for a likely mistake instead of showing one.
    task.en =
      "A classmate made a mistake solving this problem. Solve it, name a mistake someone might make, fix it, and give advice.";
    task.es =
      "Un compañero cometió un error al resolver este problema. Resuélvelo, nombra un error que alguien podría cometer, corrígelo y da un consejo.";
  }
  return { problem: problemText(item), spanish: questionEs(item) || "", claim, task };
}

export const claimLine = (claim, lang) =>
  claim
    ? lang === "es"
      ? `${claim.name} dice que la respuesta es ${claim.shown}.`
      : `${claim.name} says the answer is ${claim.shown}.`
    : "";

export const skillsForGrade = (grade) =>
  ALL_SKILLS.filter((skill) => skill.grade === Number(grade));
// Accepts "grade:id" (what the page stores) or a bare skill id.
export const skillById = (key) => {
  const [grade, id] = String(key).includes(":") ? String(key).split(":") : ["", String(key)];
  return ALL_SKILLS.find((skill) => skill.id === id && (!grade || skill.grade === Number(grade))) || null;
};

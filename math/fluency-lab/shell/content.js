// The explanation engine's content layer. Every skill is described in ONE shape, whatever its source:
//   concept      — what we are trying to understand (one or two sentences)
//   example      — a generated problem with the skill's real numbers, explained by synchronized frames
//                  (picture + notation + words change together; studio engines draw 102 of 128 skills)
//   guided       — a short guided attempt, one question at a time (createLesson steps, every skill)
//   misconception — the likely mistake, named in words a student understands
//   try          — the interactive investigation: an authored living model, the engine's Build, or null
// Authored entries (authored/*.js) override any field for one skill; everything else comes from the data
// the full lab already validates (problem-bank, kid-learn, lesson-content, studio engines).
import { generateProblem, seededRandom } from "../problem-bank.js";
import { createLesson } from "../lesson-content.js";
import { kidLearnFor } from "../kid-learn.js";
import { framesOf, hasBuild, lessonFor, repsOf } from "../studio/engines.js";
import { leakCap } from "../step-leak.js";
import { AUTHORED } from "./authored/index.js";
import { TITLES_ES } from "./titles-es.js";

const L = (en, es) => ({ en, es: es ?? en });

// A worked example must be fully explained, so it is drawn from a fixed seed: the same skill always opens
// on the same example, and practice problems (unseeded) never repeat it by design.
function exampleFor(skill) {
  for (let seed = 11; seed < 40; seed += 1) {
    const item = generateProblem(skill, seededRandom(seed * 7919));
    const lesson = lessonFor(item);
    if (lesson?.modeled) return { item, lesson };
  }
  const item = generateProblem(skill, seededRandom(11 * 7919));
  return { item, lesson: lessonFor(item) };
}

export function teach(skill) {
  const authored = AUTHORED[`${skill.grade}:${skill.id}`] || {};
  const kid = kidLearnFor(skill, skill.grade);
  const { item, lesson } = exampleFor(skill);
  const frames = lesson
    ? framesOf(lesson, lesson.spec.reps?.[0] === undefined ? "main" : lesson.spec.reps[0])
    : [];
  const predicts = lesson?.modeled ? lesson.engine.predicts?.(lesson.spec) || [] : [];
  const guide = createLesson(skill);
  return {
    title: authored.title || L(skill.title, TITLES_ES[skill.title]),
    concept: authored.concept || kid?.idea || L(skill.learn?.rule || guide.idea),
    misconception: authored.misconception || kid?.watch || L(skill.learn?.watch || ""),
    example: { item, lesson, frames, predicts, modeled: Boolean(lesson?.modeled) },
    guided: authored.guided || guide.steps || [],
    authoredGuided: Boolean(authored.guided),
    guideModel: guide.model || null,
    exampleLine: skill.learn?.example || "",
    // The investigation: an authored living model first, then the engine's own Build, else none.
    living: authored.living || null,
    build: !authored.living && lesson?.modeled && hasBuild(lesson) ? lesson : null,
    reasons: authored.reasons || null,
    misconceptions: authored.misconceptions || [],
    transfer: authored.transfer || null,
    another: authored.another || null,
  };
}

// The help ladder for ONE practice problem: a strategic hint, then the visual explanation (frames up to the
// point that would state the answer), then a guided partial example. Each rung is skill- and number-aware.
// Stricter than the full lab's leakCap: a counting list that ends on the answer ("Count on 3: 9, 10, 11") or a
// frame that prints the result is not shown before the student answers.
const plainNum = (text) =>
  String(text ?? "")
    .replaceAll(",", "")
    .replaceAll("−", "-");
export function revealsAnswer(text, item) {
  const question = plainNum(item.question);
  return (item.answers || []).some((answer) => {
    const a = plainNum(answer).trim();
    if (!/^-?\d+(\.\d+)?$/.test(a)) return false;
    const re = new RegExp(`(^|[^\\d.])${a.replace(".", "\\.")}(?![\\d]|\\.\\d)`);
    if (re.test(question)) return false;
    return Math.abs(Number(a)) >= 10
      ? re.test(plainNum(text))
      : new RegExp(`=\\s*${a.replace(".", "\\.")}(?![\\d]|\\.\\d)`).test(plainNum(text));
  });
}
const pickEn = (v) => (v && typeof v === "object" ? `${v.en} ${v.es || ""}` : v || "");

export function helpLadder(skill, item) {
  const lesson = lessonFor(item);
  const cap = leakCap(item);
  const safeSteps = (item.steps || [])
    .slice(0, Math.max(0, Math.min(cap, (item.steps || []).length - 1)))
    .filter((step) => !revealsAnswer(step, item));
  const frames = lesson?.modeled ? framesOf(lesson, lesson.spec.reps?.[0] || "main") : [];
  // Engines place their first Predict point just before the reveal, so frames stop there; without one, the
  // last frame (always the result) is dropped. shell-content.test.mjs proves no rung prints the answer.
  const firstPredict = lesson?.modeled ? lesson.engine.predicts?.(lesson.spec)?.[0]?.at : undefined;
  const visual = frames.slice(
    0,
    Number.isInteger(firstPredict) && firstPredict > 0 ? firstPredict : frames.length - 1,
  );
  const shown = visual.filter((f) => !revealsAnswer(`${f.eq || ""} ${pickEn(f.cap)}`, item));
  return [
    item.hint && !revealsAnswer(item.hint, item) ? { kind: "hint", text: item.hint } : null,
    shown.length ? { kind: "visual", frames: shown } : null,
    safeSteps.length ? { kind: "steps", steps: safeSteps } : null,
  ].filter(Boolean);
}

// "Another way" — a second road into THIS problem, offered beside help, never instead of it. In order:
//   1. the same problem in the engine's other representation (a ratio as a table, then as a double number line);
//   2. an authored alternative for the skill (`another: { text: {en,es} }` in authored/*.js);
//   3. the fully worked example of a similar problem (the See step's example), when it is not this problem.
// Frames from (1) stop before the result exactly as the visual rung does, and every frame is leak-checked.
export function anotherWay(item, content) {
  const lesson = lessonFor(item);
  const reps = lesson?.modeled ? repsOf(lesson) : [];
  if (reps.length > 1) {
    const frames = framesOf(lesson, reps[1]);
    const shown = frames
      .slice(0, frames.length - 1)
      .filter((f) => !revealsAnswer(`${f.eq || ""} ${pickEn(f.cap)}`, item));
    if (shown.length) return { kind: "frames", frames: shown, rep: reps[1] };
  }
  if (content.another?.text && !revealsAnswer(pickEn(content.another.text), item))
    return { kind: "text", text: content.another.text };
  const ex = content.example;
  const safe = ex.frames.every((f) => !revealsAnswer(`${f.eq || ""} ${pickEn(f.cap)}`, item));
  if (ex.frames.length && ex.item.question !== item.question && safe)
    return { kind: "example", question: ex.item, frames: ex.frames };
  return null;
}

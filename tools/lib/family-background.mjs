// Background knowledge for the family homework page (data/family-background/<lesson>.json): one or two essential
// skills a family needs before tonight's lesson, each with a reason, short steps, a worked example and one quick
// check. Pure checks, used by tools/family-background.test.mjs and by the generator (it refuses a bad file).
import { renderModel } from "../../assets/design/family/art/math-models.mjs";
import { evaluateExpression, parseAnswerValue } from "../../scripts/lib/rational.mjs";

const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
const str = (v) => typeof v === "string" && v.trim().length > 0;
const words = (s) => String(s).trim().split(/\s+/).filter(Boolean).length;
const bi = (v) => isObj(v) && str(v.en) && str(v.es);
const LIMITS = { name: 9, why: 26, step: 20, example: 26, q: 22, feedback: 24 };
const SPANISH_BANNED = [/\busted(es)?\b/i, /\bvosotros\b/i, /\bvuestr[oa]s?\b/i, /\d %/];
const TIMER =
  /\b(timer|timed|minutes? left|seconds? left|hurry|beat the clock|race the clock|cronómetro|contrarreloj|apúrate)\b/i;

function checkText(v, label, limit, add) {
  if (!bi(v)) return add(`${label} needs en + es`);
  if (v.en.trim() === v.es.trim()) add(`${label}: Spanish is a copy of the English`);
  if (words(v.en) > limit) add(`${label}: English is ${words(v.en)} words (max ${limit})`);
  if (words(v.es) > limit + 6) add(`${label}: Spanish is ${words(v.es)} words (max ${limit + 6})`);
  for (const re of SPANISH_BANNED)
    if (re.test(v.es)) add(`${label}: Spanish uses ${re} (see es-style-guide)`);
  if (TIMER.test(v.en) || TIMER.test(v.es)) add(`${label}: timer language`);
  if (/<|>/.test(v.en + v.es)) add(`${label}: no markup in text`);
}

/** Errors for one background file; [] when it is good. */
export function checkBackground(data, id) {
  const errors = [];
  const add = (m) => errors.push(`${id}: ${m}`);
  if (!isObj(data)) return [`${id}: not an object`];
  if (data.lesson !== id) add(`lesson is "${data.lesson}", file is ${id}`);
  const skills = data.skills;
  if (!Array.isArray(skills) || skills.length < 1 || skills.length > 2) {
    add("needs 1 or 2 skills");
    return errors;
  }
  // Every lesson carries at least one picture: a skill's `model` draws its own example with the family model
  // library (assets/design/family/art/math-models.mjs), which throws on a bad shape, so a model that renders is valid.
  if (!skills.some((s) => isObj(s.model))) add("needs a model (picture) on at least one skill");
  skills.forEach((s, i) => {
    const p = `skills[${i}]`;
    if (s.model !== undefined) {
      if (!isObj(s.model) || !bi(s.model.alt)) add(`${p}.model needs kind, data and alt (en + es)`);
      else if (s.model.kind === "none")
        add(`${p}.model: kind "none" draws nothing; leave the model out instead`);
      else
        for (const lang of ["en", "es"]) {
          try {
            if (!renderModel(s.model, { lang })) add(`${p}.model (${lang}) drew nothing`);
          } catch (e) {
            add(`${p}.model (${lang}): ${e.message}`);
          }
        }
    }
    checkText(s.name, `${p}.name`, LIMITS.name, add);
    checkText(s.why, `${p}.why`, LIMITS.why, add);
    checkText(s.example, `${p}.example`, LIMITS.example, add);
    if (!Array.isArray(s.steps) || s.steps.length < 2 || s.steps.length > 3)
      add(`${p}.steps needs 2 or 3 steps`);
    else s.steps.forEach((st, j) => checkText(st, `${p}.steps[${j}]`, LIMITS.step, add));
    const c = s.check;
    if (!isObj(c)) return add(`${p}.check missing`);
    checkText(c.q, `${p}.check.q`, LIMITS.q, add);
    if (!Array.isArray(c.options) || c.options.length !== 3 || !c.options.every(str))
      return add(`${p}.check.options needs 3 strings`);
    if (new Set(c.options.map((o) => o.trim())).size !== 3) add(`${p}.check.options repeat`);
    if (!Number.isInteger(c.correctIdx) || c.correctIdx < 0 || c.correctIdx > 2)
      add(`${p}.check.correctIdx must be 0-2`);
    if (!Array.isArray(c.feedback) || c.feedback.length !== 3)
      add(`${p}.check.feedback needs 3 entries`);
    else
      c.feedback.forEach((f, j) => checkText(f, `${p}.check.feedback[${j}]`, LIMITS.feedback, add));
    // The answer is recomputed, never trusted: calc.expr must equal calc.value, the correct option must show
    // that value, and no wrong option may show it too.
    if (!isObj(c.calc)) return add(`${p}.check.calc missing`);
    const exact = evaluateExpression(String(c.calc.expr ?? ""));
    const want = parseAnswerValue(String(c.calc.value ?? ""));
    if (!exact) return add(`${p}.check.calc.expr "${c.calc.expr}" is not arithmetic`);
    if (!want) return add(`${p}.check.calc.value "${c.calc.value}" is not a number`);
    if (!exact.eq(want)) return add(`${p}.check: ${c.calc.expr} is not ${c.calc.value}`);
    const shows = (o) => {
      const v = parseAnswerValue(
        String(o)
          .replace(/[^\d\s./-]/g, " ")
          .trim(),
      );
      return v ? v.eq(want) : false;
    };
    const hits = c.options.map(shows);
    if (Number.isInteger(c.correctIdx) && !hits[c.correctIdx])
      add(
        `${p}.check: option ${c.correctIdx} "${c.options[c.correctIdx]}" does not show ${c.calc.value}`,
      );
    if (hits.filter(Boolean).length > 1)
      add(`${p}.check: a wrong option also shows ${c.calc.value}`);
  });
  return errors;
}

/** The lesson a homework page belongs to: 6-10-part2 -> 6-10; unit pages (6-practice) have none. */
export const baseLessonOf = (pageId) => {
  const m = String(pageId).match(/^(\d+-\d+)(?:-part\d+)?$/);
  return m ? m[1] : "";
};

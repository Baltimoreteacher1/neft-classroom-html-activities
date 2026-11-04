/**
 * Feedback engine v2. Pure and deterministic: no DOM, no network, no randomness.
 *
 * `matches` in math.mjs stays the single judge of correctness (saved state and progress use it too).
 * This module only decides what to SAY about an answer that does not match: it names the specific
 * slip when the number is a known wrong-answer pattern, otherwise it substitutes the student's own
 * number back into the problem and reports which constraint breaks, with the real numbers.
 * Messages never state the answer. Everything the Studio cannot judge is listed as teacher-judged.
 */
import { matches, model, number } from "./math.mjs";
import { fmt, near } from "./feedback-util.mjs";
import { spec as division } from "./feedback-division.mjs";
import { spec as statistics } from "./feedback-statistics.mjs";
import { spec as ratio } from "./feedback-ratio.mjs";
import { spec as percent } from "./feedback-percent.mjs";
import { spec as expressions } from "./feedback-expressions.mjs";
import * as area from "./feedback-area.mjs";
import * as coordinates from "./feedback-coordinates.mjs";
import * as equations from "./feedback-equations.mjs";
import * as relationships from "./feedback-relationships.mjs";
import * as solids from "./feedback-solids.mjs";
import * as discovery from "./feedback-discovery.mjs";
import * as synthesis from "./feedback-synthesis.mjs";

/** Families added in stage 3C keep their spec, teacher-judged list and confirmed facts together in one module. */
const MODULES = { area, coordinates, equations, relationships, solids, discovery, synthesis };
const SPECS = { division, statistics, ratio, percent, expressions, ...Object.fromEntries(Object.entries(MODULES).map(([k, m]) => [k, m.spec])) };
export const V2_FAMILIES = Object.keys(SPECS);
export const hasV2 = (project) => V2_FAMILIES.includes(project.family);

const NUMBER_HELP =
  "Enter a whole number, a decimal, a fraction such as 3/4, or a mixed number such as 2 1/2.";

export function checkSpec(project, design) {
  const m = model(project, design);
  if (m.errors.length || !hasV2(project)) return null;
  return SPECS[project.family](project, m.values);
}

/** @returns {{status: "correct"|"incorrect"|"invalid", code: string, message: string, next: string, basis: "computed"}} */
export function diagnose(project, design, checkId, raw) {
  const m = model(project, design);
  const q = m.checks.find((item) => item.id === checkId);
  const result = (status, code, message, next = "") => ({ status, code, message, next, basis: "computed" });
  if (!q) return result("invalid", "no-such-check", "This check is not part of the current design.", "Return to Build and fix the design inputs.");
  const text = String(raw ?? "").trim();
  if (!text) return result("invalid", "empty", "There is no answer in the box yet.", NUMBER_HELP);
  const s = number(text);
  if (!Number.isFinite(s)) {
    const symbols = /[$%]/.test(text) || /[a-z]/i.test(text);
    return result(
      "invalid",
      symbols ? "units-in-box" : "not-a-number",
      symbols ? "The answer box takes numbers only. Leave out $, %, and unit words." : "That is not a number the Studio can read.",
      NUMBER_HELP,
    );
  }
  if (matches(text, q.answer)) return result("correct", "match", q.reason);
  const entry = hasV2(project) ? checkSpec(project, design)?.[checkId] : null;
  if (!entry) return result("incorrect", "generic", q.hint);
  for (const t of entry.traps) {
    if (t.values.some((value) => near(s, value)) && !near(s, q.answer)) return result("incorrect", t.code, `You entered ${fmt(s)}. ${t.say(s)}`, entry.next);
  }
  return result("incorrect", "constraint", entry.verify(s), entry.next);
}

/** One sentence the student sees after a miss: the specific issue, then the next action. */
export const feedbackText = (d) => [d.message, d.next].filter(Boolean).join(" ");

/** Work the Studio cannot judge. Shown as teacher-judged; no score is ever produced for these. */
export const JUDGED = {
  division: [
    "Whether rounding up for seats and down for purchases fits the situation you chose",
    "How clearly the seating diagram labels full groups and the leftover",
    "The budget defense and the cut list you wrote",
  ],
  statistics: [
    "Which measure of center fits your question, and why",
    "Whether your claim stays inside what a small sample can show",
    "The limitation you name and the design of your data display",
  ],
  ratio: [
    "Whether your recommendation is reasonable for the situation",
    "How well your table, number line or tape diagram explains the scaling",
    "The assumption you name about quality, units or season length",
  ],
  percent: [
    "Whether the offer you defend is a sensible choice for the customer",
    "How clearly your receipt and percent model are labeled",
    "The explanation of why the tax base is the discounted price",
  ],
  expressions: [
    "Whether your explanation of why the expressions are equivalent is convincing",
    "The test cases you chose and what they show",
    "How you explain which terms change when the setup value changes",
  ],
  ...Object.fromEntries(Object.entries(MODULES).map(([k, m]) => [k, m.judged])),
};

/**
 * Facts the Studio computed from numbers the student has already matched. Each fact appears only
 * once the checks it depends on match, so it confirms work instead of replacing it.
 */
export function verifiedFacts(project, design, checked) {
  const m = model(project, design);
  if (m.errors.length || !hasV2(project)) return [];
  const ok = (...ids) => ids.every((id) => checked[id] === true);
  const v = m.values;
  const out = [];
  const byId = Object.fromEntries(m.checks.map((q) => [q.id, q.answer]));
  const unit = (n) => Number(n.toFixed(2)).toString();
  if (project.family === "percent") {
    if (ok("budget")) {
      const left = byId.budget;
      out.push(left >= 0 ? `The receipt fits the budget with $${unit(left)} to spare.` : `The receipt is over the budget by $${unit(-left)}.`);
    }
  } else if (project.family === "ratio") {
    if (ok("rate-a", "rate-b")) {
      const sport = project.id === "unit-3-b";
      const ra = byId["rate-a"], rb = byId["rate-b"];
      const unitWord = sport ? "points per game" : "dollars per unit";
      out.push(ra === rb ? `Both rates are ${unit(ra)} ${unitWord}, so the rates alone do not separate them.` : `${sport ? "Player" : "Offer"} ${ra < rb ? "A" : "B"} has the lower rate; ${sport ? "Player" : "Offer"} ${ra < rb ? "B" : "A"} has the higher rate. Which is better depends on your goal.`);
    }
    if (ok("scale-a", "scale-b")) out.push(`The scaled ratio ${byId["scale-a"]} : ${byId["scale-b"]} keeps the same factor ${v.c} on both parts.`);
  } else if (project.family === "statistics") {
    if (ok("mean", "median")) {
      const gap = byId.mean - byId.median;
      out.push(Math.abs(gap) < 0.005 ? "Mean and median are equal here, so the middle and the average agree." : gap > 0 ? "The mean is above the median, so a few high values pull the average up." : "The mean is below the median, so a few low values pull the average down.");
    }
    if (ok("range", "iqr")) out.push(byId.iqr < byId.range ? "The IQR is smaller than the range, so the middle half of the data is more tightly packed than the whole set." : "The IQR equals the range, so the data are spread evenly from end to end.");
  } else if (project.family === "division") {
    if (ok("groups", "remainder")) out.push(byId.remainder === 0 ? "The seating divides evenly, so no group is partly filled." : "The last group is only partly filled, so the plan has spare room.");
    if (ok("packs", "money")) out.push(byId.money === 0 ? "The budget is spent exactly." : "Some budget stays unspent because packs are sold whole.");
  } else if (project.family === "expressions") {
    if (ok("coefficient", "constant")) {
      const sample = [2, 3, 4, 5, 7, 9].filter((x) => x !== v.c && x !== v.c + 1).slice(0, 2);
      const same = sample.every((x) => v.a * (x + v.b) + v.d ** 2 === byId.coefficient * x + byId.constant);
      out.push(same ? `The expanded rule ${byId.coefficient}x + ${byId.constant} matches the original at x = ${sample.join(" and x = ")}.` : "The expanded rule does not match the original at the test inputs.");
    }
  } else if (MODULES[project.family]) out.push(...MODULES[project.family].facts(project, byId, v, ok));
  return out;
}

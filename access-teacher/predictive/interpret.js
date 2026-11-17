// Plain-language interpretation of reported results: level names, relative domain strengths, comparable
// changes with their measurement context, language-development starting points and the next action. Every
// sentence describes what the REPORTED scores suggest; classroom evidence is what confirms it.
import { recordsOf } from "./records.js";
import {
  ASSESSMENTS,
  DOMAINS,
  LEVEL_WORDS,
  levelComparable,
  scaleComparable,
  whyNotComparable,
} from "./rules.js";

export const LEVEL_NAMES = Object.freeze([
  "",
  "Entering",
  "Emerging",
  "Developing",
  "Expanding",
  "Bridging",
  "Reaching",
]);
export const levelName = (lv) =>
  lv == null ? "" : LEVEL_NAMES[Math.min(6, Math.max(1, Math.floor(lv)))];

/**
 * Relative profile of one record. A gap counts as "clear" only when scale scores with measurement error
 * are on file and the difference exceeds 1.96 x the combined error; with levels alone, gaps under 1.0 are
 * described as possibly within measurement error.
 */
export function domainProfile(record) {
  const rows = DOMAINS.map((d) => ({ domain: d, ...record.domains[d] })).filter(
    (r) => r.level != null || r.scale != null,
  );
  if (rows.length < 2)
    return {
      rows,
      strength: null,
      need: null,
      gap: null,
      clear: false,
      text: "Fewer than two domains are on file, so there is no profile to compare.",
    };
  const byLevel = rows.filter((r) => r.level != null);
  if (byLevel.length < 2)
    return {
      rows,
      strength: null,
      need: null,
      gap: null,
      clear: false,
      text: "Domain levels are needed to describe relative strengths.",
    };
  const sorted = [...byLevel].sort((a, b) => b.level - a.level);
  const strength = sorted[0];
  const need = sorted.at(-1);
  const gap = Math.round((strength.level - need.level) * 10) / 10;
  let clear = false;
  let basis = "levels";
  if (strength.scale != null && need.scale != null && strength.sem != null && need.sem != null) {
    basis = "scale";
    clear = Math.abs(strength.scale - need.scale) > 1.96 * Math.hypot(strength.sem, need.sem);
  }
  let text;
  if (gap === 0)
    text =
      "The four domains are reported at the same level. No domain stands out on this assessment.";
  else if (basis === "scale")
    text = clear
      ? `${strength.domain} is a relative strength and ${need.domain} a relative need on this assessment; the scale-score gap is larger than the reported measurement error.`
      : `${strength.domain} is reported higher than ${need.domain}, but the scale-score gap is within the reported measurement error. Gather classroom evidence before treating it as a real difference.`;
  else
    text =
      gap >= 1
        ? `${strength.domain} is a relative strength within this profile (${gap.toFixed(1)} levels above ${need.domain}). ${need.domain} may benefit from targeted practice and more instructional evidence.`
        : `${strength.domain} is reported slightly higher than ${need.domain} (${gap.toFixed(1)} levels). A gap this small may reflect measurement error; confirm with classroom evidence.`;
  return { rows, strength: strength.domain, need: need.domain, gap, clear, basis, text };
}

/**
 * Changes between comparable records of the same family, oldest first. Each step says whether levels and/or
 * scale scores may be compared, and why not when they may not.
 */
export function comparableSteps(student) {
  const recs = recordsOf(student);
  const steps = [];
  for (let i = 1; i < recs.length; i++) {
    const b = recs[i];
    const a = [...recs.slice(0, i)]
      .reverse()
      .find(
        (r) =>
          ASSESSMENTS[r.assessmentType].kind === ASSESSMENTS[b.assessmentType].kind &&
          r.assessmentType.startsWith("KINDER") === b.assessmentType.startsWith("KINDER"),
      );
    if (!a) continue;
    const lvOk = levelComparable(a, b);
    const scOk = scaleComparable(a, b);
    const rows = [...DOMAINS, "Overall"].map((k) => {
      const A = k === "Overall" ? a.composites.Overall : a.domains[k];
      const B = k === "Overall" ? b.composites.Overall : b.domains[k];
      const levelChange =
        lvOk && A.level != null && B.level != null
          ? Math.round((B.level - A.level) * 10) / 10
          : null;
      const scaleChange = scOk && A.scale != null && B.scale != null ? B.scale - A.scale : null;
      const se = A.sem != null && B.sem != null ? Math.hypot(A.sem, B.sem) : null;
      return {
        key: k,
        from: A,
        to: B,
        levelChange,
        scaleChange,
        beyondError: scaleChange != null && se != null ? Math.abs(scaleChange) > 1.96 * se : null,
        se,
      };
    });
    steps.push({
      from: a,
      to: b,
      levelsComparable: lvOk,
      scalesComparable: scOk,
      why: lvOk && scOk ? null : whyNotComparable(a, b, lvOk ? "scale" : "level"),
      rows,
    });
  }
  return steps;
}

/** Starting points by level band, informed by WIDA's proficiency level descriptors. Not a prescription. */
const GUIDANCE = [
  {
    upTo: 2.5,
    functions: "name, sort, follow and answer yes/no or choice questions",
    discourse: "single words, phrases and short patterned sentences",
    sentence: 'sentence frames with a word bank ("I see ___." "This is a ___ because ___.")',
    vocabulary: "everyday and topic words with pictures, gestures and the home language",
    speaking: "picture talk with a frame, then repeat with a partner",
    writing: "label a picture and complete one or two frames",
  },
  {
    upTo: 3.5,
    functions: "describe, sequence, compare and give a reason",
    discourse: "short connected sentences joined with and, but, because, first, then",
    sentence: 'frames that combine two ideas ("___ is different from ___ because ___.")',
    vocabulary: "general academic words (compare, evidence, describe) used in context",
    speaking: "explain a process in three steps with linking words",
    writing: "a short paragraph from a model with a sentence starter for each step",
  },
  {
    upTo: 5,
    functions: "explain, summarize, justify with evidence and argue a claim",
    discourse: "paragraphs with a clear main idea, details and transitions",
    sentence: "complex sentences (although, as a result, which) with optional frames",
    vocabulary: "precise academic and content-specific words, word families and nominalizations",
    speaking: "an extended explanation with evidence, then a revised second attempt",
    writing: "an evidence paragraph: claim, two pieces of evidence, explanation",
  },
  {
    upTo: 6.01,
    functions: "evaluate, synthesize and argue with counterclaims",
    discourse: "extended texts with cohesion across paragraphs and register control",
    sentence: "varied, precise sentences chosen for the audience and purpose",
    vocabulary: "nuance, connotation and discipline-specific precision",
    speaking: "a structured presentation or debate turn with rebuttal",
    writing: "a multi-paragraph argument or report with revision for precision",
  },
];
export function guidanceFor(level) {
  if (level == null) return null;
  return GUIDANCE.find((g) => level < g.upTo) || GUIDANCE.at(-1);
}

/** One suggested next action for a student's latest record. */
export function nextAction(student, record, profile) {
  if (!record)
    return "Enter or import this student's most recent ACCESS or MODEL results to begin.";
  if (!record.sourceVerified)
    return "Check this result against the original score report and mark it verified.";
  if (profile?.need)
    return `Plan a short ${profile.need.toLowerCase()} task this week and compare it with the score profile (Instructional Planner).`;
  return "Collect a speaking and a writing sample to add classroom evidence beside the scores.";
}

/** Class-level summary over each student's latest annual record, grouped so incompatible versions never mix. */
export function classSummary(students) {
  const groups = new Map();
  let missing = 0;
  let multi = 0;
  for (const st of students) {
    const recs = recordsOf(st);
    if (!recs.length) {
      missing++;
      continue;
    }
    const annual = recs.filter((r) => ASSESSMENTS[r.assessmentType].kind === "annual");
    if (annual.length >= 2 && levelComparable(annual.at(-1), annual.at(-2))) multi++;
    const latest = annual.at(-1) || recs.at(-1);
    const key = `${latest.assessmentType}|${latest.academicYear}|${latest.levelVersion}`;
    if (!groups.has(key))
      groups.set(key, {
        type: latest.assessmentType,
        year: latest.academicYear,
        levelVersion: latest.levelVersion,
        words: LEVEL_WORDS[latest.levelVersion],
        records: [],
      });
    groups.get(key).records.push({ student: st, record: latest });
  }
  return {
    groups: [...groups.values()].sort((a, b) => b.records.length - a.records.length),
    missing,
    multi,
    total: students.length,
  };
}

/** Median and quartiles (robust summary) of a list of numbers. */
export function quartiles(xs) {
  const a = xs.filter((x) => Number.isFinite(x)).sort((p, q) => p - q);
  if (!a.length) return null;
  const at = (p) => {
    const i = (a.length - 1) * p;
    const lo = Math.floor(i);
    return a[lo] + (a[Math.ceil(i)] - a[lo]) * (i - lo);
  };
  return { n: a.length, min: a[0], q1: at(0.25), median: at(0.5), q3: at(0.75), max: a.at(-1) };
}

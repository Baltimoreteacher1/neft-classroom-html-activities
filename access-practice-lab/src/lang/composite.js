// The Practice Composite — the only composite the lab computes, and only from practice tests.
//
// Why a composite at all: ACCESS reports an Overall score, and learners and families ask where they stand.
// Why this one is safe: it uses WIDA's published Overall weighting (WIDA TR-2019-3: 15% Listening, 15%
// Speaking, 35% Reading, 35% Writing); it never fills in a missing domain; it needs enough items; it shows
// its parts and its method; and it is never converted to a WIDA scale score, proficiency level, or exit
// prediction (ACCESS scale scores come from vertically scaled IRT and trained raters; practice points cannot
// be mapped onto them). Pure functions — no DOM, no storage.
import { CRITERIA } from "./rubrics.js";

export const WEIGHTS = { Listening: 0.15, Speaking: 0.15, Reading: 0.35, Writing: 0.35 };
export const DOMAINS = Object.keys(WEIGHTS);
/** Fewest auto-scored items a domain needs before it counts toward a composite. */
export const MIN_ITEMS = 6;
/** Below this many items a domain still counts but the report says the sample is small. */
export const SMALL_SAMPLE = 12;
/** Practice-rubric bands as points per criterion (early 1, building 2, strong 3). */
export const BAND_POINTS = { early: 1, building: 2, strong: 3 };
export const RATERS = ["me", "teacher"];

export const METHOD =
  "Listening and Reading are the percent of questions you got right. Speaking and Writing are your practice-rubric ratings: " +
  "each of the three criteria is early (1), building (2) or strong (3), averaged, then out of 3. " +
  "The overall number weights the four skills the way ACCESS does: Listening 15%, Speaking 15%, Reading 35%, Writing 35%. " +
  "If a skill is missing or has too few questions, nothing is filled in for it.";
export const LIMITS =
  "Practice points are not a WIDA ACCESS scale score, proficiency level, or placement, and they do not predict one. " +
  "ACCESS scores come from a different scale and, for Speaking and Writing, trained raters. Speaking and Writing ratings are coarser than percent correct, " +
  "and a self-rating is a different kind of evidence from a teacher rating.";

const rubricPoints = (rating) => {
  const bands = CRITERIA.map((c) => BAND_POINTS[rating?.[c.id]]);
  if (bands.some((b) => !b)) return null;
  return (bands.reduce((a, b) => a + b, 0) / bands.length / 3) * 100;
};

/** Merge every section of one domain into a single { correct, total, open, openDone }. */
function pool(sections, domain) {
  const rows = (sections || []).filter((s) => s.domain === domain);
  return rows.reduce(
    (m, s) => ({
      correct: m.correct + (s.correct || 0),
      total: m.total + (s.total || 0),
      attempted: m.attempted + (s.attempted ?? s.total ?? 0),
      open: m.open + (s.open || 0),
      openDone: m.openDone + (s.openDone || 0),
      present: true,
    }),
    { correct: 0, total: 0, attempted: 0, open: 0, openDone: 0, present: false },
  );
}

/**
 * One domain's practice measure.
 * status: "ok" (counts) | "thin" (too few questions) | "unrated" (open response awaiting a rating) | "absent".
 */
export function domainMeasure(domain, sections, ratings = {}) {
  const p = pool(sections, domain);
  const w = WEIGHTS[domain];
  if (!p.present)
    return {
      domain,
      weight: w,
      status: "absent",
      value: null,
      why: `This test has no ${domain} section.`,
    };
  if (domain === "Listening" || domain === "Reading") {
    if (p.attempted < MIN_ITEMS)
      return {
        domain,
        weight: w,
        status: "thin",
        value: null,
        n: p.attempted,
        why: `${p.attempted} answered of ${p.total}; at least ${MIN_ITEMS} answered questions are needed.`,
      };
    return {
      domain,
      weight: w,
      status: "ok",
      kind: "percent",
      value: (p.correct / p.total) * 100,
      n: p.total,
      small: p.total < SMALL_SAMPLE,
      why: `${p.correct} of ${p.total} right`,
    };
  }
  const rating = ratings?.[domain];
  const v = rubricPoints(rating);
  if (p.openDone === 0)
    return {
      domain,
      weight: w,
      status: "unrated",
      value: null,
      why: `No ${domain.toLowerCase()} response finished.`,
    };
  if (v == null)
    return {
      domain,
      weight: w,
      status: "unrated",
      value: null,
      why: `Rate your ${domain.toLowerCase()} below.`,
    };
  return {
    domain,
    weight: w,
    status: "ok",
    kind: "rubric",
    value: v,
    n: CRITERIA.length,
    by: rating.by === "teacher" ? "teacher" : "me",
    why: `${rating.by === "teacher" ? "Teacher" : "Self"} rating`,
  };
}

const r0 = (x) => Math.round(x);

/**
 * Composite report for one practice test.
 *  - comprehension: Listening + Reading only (both machine-scored), weighted 15:35 as in the overall.
 *  - overall: all four skills, or withheld with the reason. Never reweighted around a missing skill.
 */
export function practiceComposite(sections, ratings = {}) {
  const measures = DOMAINS.map((d) => domainMeasure(d, sections, ratings)).filter(
    (m) => m.status !== "absent",
  );
  const by = Object.fromEntries(measures.map((m) => [m.domain, m]));
  const ok = (d) => by[d]?.status === "ok";
  const comprehension =
    ok("Listening") && ok("Reading")
      ? {
          value: r0(
            (by.Listening.value * WEIGHTS.Listening + by.Reading.value * WEIGHTS.Reading) /
              (WEIGHTS.Listening + WEIGHTS.Reading),
          ),
          small: Boolean(by.Listening.small || by.Reading.small),
        }
      : null;
  const missing = DOMAINS.filter((d) => !ok(d));
  const overall =
    missing.length === 0
      ? {
          value: r0(DOMAINS.reduce((s, d) => s + by[d].value * WEIGHTS[d], 0)),
          small: DOMAINS.some((d) => by[d].small),
          raters: [...new Set(["Speaking", "Writing"].map((d) => by[d].by))],
        }
      : null;
  return {
    measures,
    comprehension,
    overall,
    withheld: overall
      ? null
      : `Practice overall needs all four skills: ${missing.map((d) => `${d} (${by[d]?.why || "not in this test"})`).join("; ")}.`,
  };
}

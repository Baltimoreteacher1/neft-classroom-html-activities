// Skill profile: turns evidence rows into coarse per-domain bands, Key Language Use strengths and a short
// "what to practice next" list. Teacher-side data. The student view is friendly text with no band, level or
// program words. There is no number anywhere in a profile or a student view.
import { allStrings, assertAlias, BANDS, DOMAINS, KLUS, STUDENT_LABEL_RE } from "./constants.js";
import { withDisclaimer } from "./disclaimer.js";

export const MIN_EVIDENCE = 3; // answered items needed in a domain before it gets a band
export const BAND_CUTS = Object.freeze({ building: 0.45, strong: 0.75 });
const STRENGTH_AT = 0.75;
const NEXT_BELOW = 0.6;

export const KLU_FRIENDLY = Object.freeze({
  Narrate: "telling stories",
  Inform: "sharing facts",
  Explain: "explaining how or why",
  Argue: "giving reasons for an opinion",
});
export const DOMAIN_FRIENDLY = Object.freeze({
  Listening: "listening",
  Reading: "reading",
  Speaking: "speaking",
  Writing: "writing",
});

const weighted = (rows) => {
  const w = rows.reduce((sum, r) => sum + r.weight, 0);
  return w === 0 ? null : rows.reduce((sum, r) => sum + r.s * r.weight, 0) / w;
};

/** Coarse band for one domain's answered rows, or null when there is not enough evidence yet. */
export function bandFromEvidence(rows) {
  const answered = rows.filter((r) => r.answered);
  if (answered.length < MIN_EVIDENCE) return null;
  const avg = weighted(answered);
  if (avg < BAND_CUTS.building) return BANDS[0];
  return avg < BAND_CUTS.strong ? BANDS[1] : BANDS[2];
}

function kluStats(rows) {
  const out = {};
  for (const klu of KLUS) {
    const mine = rows.filter((r) => r.answered && r.klu.includes(klu));
    out[klu] = { evidence: mine.length, average: mine.length ? weighted(mine) : null };
  }
  return out;
}

/** Domains ordered weakest first (unknown bands sort in the middle); the Road plan and the summary read this order. */
export function domainPriority(profile) {
  const rank = (d) => {
    const band = profile.domains[d].band;
    return band === null ? 1 : BANDS.indexOf(band);
  };
  return [...DOMAINS].sort((a, b) => rank(a) - rank(b) || DOMAINS.indexOf(a) - DOMAINS.indexOf(b));
}

function practiceNext(domainRows, perDomain) {
  const out = [];
  for (const domain of DOMAINS) {
    const { band } = perDomain[domain];
    const answered = domainRows[domain].filter((r) => r.answered);
    if (band === "strong") continue;
    const stats = kluStats(domainRows[domain]);
    const target = [...KLUS].sort((a, b) => (stats[a].average ?? -1) - (stats[b].average ?? -1))[0];
    const lowRows = answered.filter((r) => r.klu.includes(target) && r.s < NEXT_BELOW);
    const exercises = [
      ...new Set((lowRows.length ? lowRows : answered).flatMap((r) => r.exercises)),
    ].slice(0, 3);
    out.push({
      domain,
      klu: target,
      exercises: exercises.length ? exercises : [`${domain.toLowerCase()}.${target.toLowerCase()}`],
      note: band === null ? "needs-more-practice" : "keep-building",
    });
  }
  return out;
}

/** Builds the teacher-side skill profile for one alias from evidence rows (see scoring.js). */
export function buildProfile({ alias, gradeBand, rows, source }) {
  assertAlias(alias);
  const domainRows = Object.fromEntries(
    DOMAINS.map((d) => [d, rows.filter((r) => r.domain === d)]),
  );
  const domains = {};
  for (const d of DOMAINS) {
    const stats = kluStats(domainRows[d]);
    domains[d] = {
      band: bandFromEvidence(domainRows[d]),
      evidence: domainRows[d].filter((r) => r.answered).length,
      strengths: KLUS.filter((k) => stats[k].evidence >= 2 && stats[k].average >= STRENGTH_AT),
    };
  }
  return withDisclaimer({
    kind: "skill-profile",
    alias,
    gradeBand,
    source,
    teacherOnly: true,
    domains,
    klu: kluStats(rows),
    practiceNext: practiceNext(domainRows, domains),
  });
}

const cap = (text) => `${text[0].toUpperCase()}${text.slice(1)}`;

/** Friendly strengths and next steps for the student. No band, level, program or score words; never a number. */
export function studentView(profile) {
  const strengths = [];
  for (const d of DOMAINS) {
    const { strengths: ks, band } = profile.domains[d];
    if (ks.length)
      strengths.push(`You did well at ${DOMAIN_FRIENDLY[d]} when ${KLU_FRIENDLY[ks[0]]}.`);
    else if (band === "strong")
      strengths.push(`${cap(DOMAIN_FRIENDLY[d])} is a real strength for you.`);
  }
  const next = profile.practiceNext
    .slice(0, 3)
    .map((n) => `Next, practice ${DOMAIN_FRIENDLY[n.domain]}: ${KLU_FRIENDLY[n.klu]}.`);
  return withDisclaimer({
    kind: "student-view",
    alias: profile.alias,
    headline: "Here is what you showed and what to try next.",
    strengths: strengths.length ? strengths : ["You tried every part. That is a great start."],
    nextSteps: next.length
      ? next
      : ["Keep reading, speaking, listening and writing a little every day."],
  });
}

/** Throws if a student view shows a label word or a number. Used by tests and by the wiring layer. */
export function assertStudentSafe(view) {
  for (const text of allStrings({ h: view.headline, s: view.strengths, n: view.nextSteps })) {
    if (STUDENT_LABEL_RE.test(text)) throw new Error(`student view shows a label word: "${text}"`);
    if (/\d/.test(text)) throw new Error(`student view shows a number: "${text}"`);
  }
  return view;
}

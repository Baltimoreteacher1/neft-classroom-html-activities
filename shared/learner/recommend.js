/**
 * Activity recommendation: score = need x fit x freshness x variety, top 3 with a plain-language reason.
 *  need       mean (1 - mastery) over the nodes the activity exercises, weighted up when its unit is coming up soon
 *  fit        band match x success-probability closeness to the 65-85% target band
 *  freshness  0.05 if the same activity ran in the last 3 days, else 1
 *  variety    0.4 if the last two practiced activities were in this domain (a third in a row), else 1
 * Every recommendation exposes `why.text` (student-safe: no digits, no level or band words) and `why.terms`
 * (the numbers, shown to teachers). Ties break through the injected rng, else by id, so a seed reproduces results.
 */
import { DAY_MS, DEFAULTS } from "./constants.js";
import { emptyNode, estimate, priorForNode, successProbability } from "./estimate.js";

const WEEK_MS = 7 * DAY_MS;
const DOMAIN_WORD = {
  Listening: "listening",
  Speaking: "speaking",
  Reading: "reading",
  Writing: "writing",
  Vocabulary: "new words",
  Game: "word games",
};
const BAND_ORDER = ["1_2", "3_4", "5_6"];

const nodeMastery = (learner, id, now, hooks) =>
  estimate(learner.nodes[id] || emptyNode(priorForNode(id, learner.level)), now, hooks).mean;

export function calendarWeight(unitId, pacing = {}) {
  if (!(unitId in pacing)) return 1;
  return 1 + 0.5 * Math.min(1, Math.max(0, 1 - pacing[unitId] / 28));
}

export function fitTerm(mastery, difficulty, band, targetBand) {
  const p = successProbability(mastery, difficulty);
  const [lo, hi] = DEFAULTS.targetSuccess;
  const dist = p < lo ? lo - p : p > hi ? p - hi : 0;
  const success = Math.max(0.1, 1 - dist / 0.35);
  const gap = Math.abs(BAND_ORDER.indexOf(band) - BAND_ORDER.indexOf(targetBand));
  return { fit: success * [1, 0.85, 0.6][Math.min(gap, 2)], p };
}

function weekCounts(history, now) {
  const counts = Object.fromEntries(Object.keys(DOMAIN_WORD).map((d) => [d, 0]));
  for (const h of history) if (now - h.ts <= WEEK_MS && h.domain in counts) counts[h.domain]++;
  return counts;
}

function reasonText(c, terms, counts, lastDomain) {
  const out = [];
  const values = Object.values(counts);
  if (counts[c.domain] === Math.min(...values) && counts[c.domain] < Math.max(...values)) {
    out.push(`You practiced ${DOMAIN_WORD[c.domain]} less this week.`);
  }
  if (terms.need >= 0.5) out.push("This skill is still growing, so more practice will help.");
  if (terms.calendar > 1.05) out.push("It gets you ready for a unit coming up soon.");
  if (terms.fit >= 0.9) out.push("The challenge should feel just right.");
  if (terms.variety === 1 && lastDomain && lastDomain !== c.domain) {
    out.push("It mixes things up from what you just did.");
  }
  if (terms.freshness < 1) out.push("You did this one recently, so it is a review.");
  return out.length ? out.join(" ") : "This is a good next step.";
}

/** Scores every candidate; returns all of them best first. */
export function scoreActivities(candidates, learner, history, now, { pacing, rng, hooks } = {}) {
  const counts = weekCounts(history, now);
  const recent = [...history].sort((a, b) => a.ts - b.ts).slice(-DEFAULTS.maxConsecutiveDomain);
  const lastDomain = recent.length ? recent[recent.length - 1].domain : null;
  const streak =
    recent.length === DEFAULTS.maxConsecutiveDomain &&
    recent.every((h) => h.domain === recent[0].domain);
  const scored = candidates.map((c) => {
    const masteries = c.exercises.map((id) => nodeMastery(learner, id, now, hooks));
    const mastery = masteries.reduce((s, m) => s + m, 0) / masteries.length;
    const calendar = calendarWeight(c.unitId, pacing);
    const need = Math.max(0.05, (1 - mastery) * calendar);
    const { fit, p } = fitTerm(mastery, c.difficulty ?? 0.5, c.band, learner.targetBand);
    const freshness = history.some(
      (h) => h.activityId === c.id && now - h.ts < DEFAULTS.freshnessDays * DAY_MS,
    )
      ? 0.05
      : 1;
    const variety = streak && recent[0].domain === c.domain ? 0.4 : 1;
    const terms = { need, fit, freshness, variety, calendar, successProbability: p, mastery };
    return {
      id: c.id,
      candidate: c,
      score: need * fit * freshness * variety,
      why: { text: reasonText(c, terms, counts, lastDomain), terms },
      tie: rng ? rng() : 0,
    };
  });
  return scored.sort((a, b) => b.score - a.score || a.tie - b.tie || a.id.localeCompare(b.id));
}

/** Top recommendations (default 3). */
export function recommend(candidates, learner, history, now, opts = {}) {
  return scoreActivities(candidates, learner, history, now, opts).slice(
    0,
    opts.topN ?? DEFAULTS.topN,
  );
}

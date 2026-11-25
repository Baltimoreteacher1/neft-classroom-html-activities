// Scores one answered item into an evidence row. Objective items are scored by key; speaking and writing are
// self-check (student) or rubric (teacher) and count as weaker evidence than a key. Nothing here makes a number
// a student or family sees.
import { BAND_RANK } from "./constants.js";

export const SELF_WEIGHT = 0.5; // self-ratings count half as much as a keyed answer
const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));

function keyedCorrect(item, response) {
  const { mode } = item.response;
  const key = item.scoring.key;
  if (mode === "select") return response === key;
  if (mode === "multi") return Array.isArray(response) && sameSet(response, key);
  if (mode === "order")
    return (
      Array.isArray(response) &&
      response.length === key.length &&
      response.every((v, i) => v === key[i])
    );
  if (mode === "drag")
    return Boolean(response) && Object.keys(key).every((id) => response[id] === key[id]);
  return false;
}

/**
 * @param item a valid item
 * @param answer null (not answered) | { response } (key) | { checks: {id: boolean} } (selfcheck) | { ratings: {id: 0..3} } (rubric)
 * @returns {{ itemId, domain, klu, band, scoring, answered, correct, s, weight, exercises }}
 *   s is a 0..1 success measure used only inside the profile; it is never shown.
 */
export function scoreItem(item, answer) {
  const row = {
    itemId: item.id,
    domain: item.domain,
    klu: item.kluTags,
    band: item.band,
    scoring: item.scoring.type,
    answered: false,
    correct: null,
    s: null,
    weight: 0,
    exercises: item.exercises,
  };
  if (answer === null || answer === undefined) return row;
  const bandWeight = BAND_RANK[item.band] + 1;
  if (item.scoring.type === "key") {
    if (!("response" in answer) || answer.response === null || answer.response === undefined)
      return row;
    row.answered = true;
    row.correct = keyedCorrect(item, answer.response);
    row.s = row.correct ? 1 : 0;
    row.weight = bandWeight;
    return row;
  }
  const criteria = item.scoring.rubric;
  if (item.scoring.type === "selfcheck") {
    const checks = answer.checks ?? {};
    if (!criteria.some((c) => c.id in checks)) return row;
    row.answered = true;
    row.s = criteria.filter((c) => checks[c.id] === true).length / criteria.length;
  } else {
    const ratings = answer.ratings ?? {};
    if (!criteria.some((c) => c.id in ratings)) return row;
    for (const c of criteria) {
      const r = ratings[c.id] ?? 0;
      if (!Number.isInteger(r) || r < 0 || r > 3)
        throw new Error(`rating for "${c.id}" must be an integer 0 to 3`);
    }
    row.answered = true;
    row.s = criteria.reduce((sum, c) => sum + (ratings[c.id] ?? 0), 0) / (3 * criteria.length);
  }
  row.weight = bandWeight * SELF_WEIGHT;
  return row;
}

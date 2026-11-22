// Word Round: a short, untimed round over one band's Word Builder items, one attempt per word, in a fixed order for the day.
// (This file kept its name so offline precache lists and import maps stay valid; it replaced the 60-second Word Sprint,
// whose clock, best score and "time is up" screen put pressure on a vocabulary task.) Pure state logic only; the Word Builder
// view draws it. Results are practice counts on this device, not a proficiency or fluency score, and there is no best score.
export const ROUND_SIZE = 6;

const clampCount = (value) => (Number.isInteger(value) && value > 0 ? value : 0);

function hash(text) {
  let h = 2166136261;
  for (const ch of String(text)) h = Math.imul(h ^ ch.codePointAt(0), 16777619) >>> 0;
  return h;
}

/** A round of up to ROUND_SIZE words. The order is a hash of the id and the day, so nothing in it is random and nothing is timed. */
export function startRound(items, now) {
  const day = Math.floor(now / 86400000);
  const order = items
    .map((item) => item.id)
    .sort((a, b) => hash(`${a}:${day}`) - hash(`${b}:${day}`) || a.localeCompare(b))
    .slice(0, ROUND_SIZE);
  return { startedAt: now, order, index: 0, answered: 0, correct: 0, checked: false };
}

export function roundStatus(round) {
  if (!round) return "none";
  return clampCount(round.index) >= round.order.length ? "done" : "running";
}

export const roundWordId = (round) => round.order[round.index];

export function recordRoundAnswer(round, correct) {
  return {
    ...round,
    answered: clampCount(round.answered) + 1,
    correct: clampCount(round.correct) + (correct ? 1 : 0),
    checked: true,
  };
}

export function advanceRound(round) {
  return { ...round, index: clampCount(round.index) + 1, checked: false };
}

/** Ends a round and drops it, along with any old Word Sprint clock still saved on this device. Returns the next saved band state. */
export function closeRound(bandState) {
  const { round, sprint, sprintBest, ...rest } = bandState;
  return rest;
}

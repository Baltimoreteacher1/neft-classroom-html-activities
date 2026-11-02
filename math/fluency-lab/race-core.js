// Math Race rules (inspired by Funbrain's MathCar Racing), untimed. The learner's car moves one segment for each right
// answer. The rival moves on a fixed plan per race: after every problem, whether it was right or not. No clock runs, so
// a learner who answers carefully can always win (a problem answered wrong costs only a turn).
export const TRACK = 6;
// Problems the rival needs to finish each race. A bigger number is a gentler race.
export const PACES = [10, 8];
export const CALM_PACES = [10];

// Where the rival is after `turn` problems have been settled.
export const rivalAt = (turn, pace, track = TRACK) =>
  Math.min(track, Math.floor((turn * track) / pace));

// How many problems the learner may fail and still win. The learner moves first on a turn, so a tie is a win.
export const missesAllowed = (pace, track = TRACK) => pace - track;

// "you" when the learner has reached the line, "rival" when only the rival has, otherwise null.
export function winner(me, rival, track = TRACK) {
  if (me >= track) return "you";
  return rival >= track ? "rival" : null;
}

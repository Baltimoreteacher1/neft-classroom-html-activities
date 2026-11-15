// All calculations use whole seconds; the available rates divide 3,600 exactly.
export const RATES = [10, 15, 20, 30];
export const SCENARIOS = [
  { name: 'Same distance', context: 'Both teams travel 10 miles. Compare their speeds when the distance is the same.', routes: [10], distances: [10, 10], defaults: [10, 20], deadline: null },
  { name: 'Different routes', context: 'Choose a 10-mile or 15-mile route for each plan. A faster speed does not always mean an earlier arrival.', routes: [10, 15], distances: [10, 15], defaults: [10, 20], deadline: null },
  { name: 'Medicine delivery', context: 'The clinic needs medicine in 45 minutes. Choose routes and speeds that meet the deadline.', routes: [10, 15], distances: [10, 15], defaults: [10, 20], deadline: 45 },
];

export function journey(distance, rate) {
  if (!Number.isInteger(distance) || distance < 1 || !RATES.includes(rate)) throw new RangeError('Choose a listed distance and speed.');
  return { distance, rate, seconds: distance * 3600 / rate };
}

export function compare(a, b) {
  return a.seconds === b.seconds ? 'tie' : a.seconds < b.seconds ? 'a' : 'b';
}

export function progressAt(journeyResult, seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) throw new RangeError('Time must be nonnegative.');
  return Math.min(1, seconds / journeyResult.seconds);
}

export function minutes(seconds) {
  const whole = Math.floor(seconds / 60), rest = seconds % 60;
  return rest ? `${whole} min ${rest} sec` : `${whole} min`;
}

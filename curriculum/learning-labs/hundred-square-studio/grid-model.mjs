export const SCENARIOS = [
  { title: 'Critical services', prompt: 'Give the clinic at least one half of the supply, the school at least one quarter, and the park some power. Use all 100 units without exceeding supply.' },
  { title: 'Repair a shortage', prompt: 'Demand starts at 105 units. Keep the clinic at least 40, the school at least 35 and the park at least 20. Revise demand to use exactly 100 units.' },
  { title: 'A new relationship', prompt: 'Allocate 40 units to the clinic. Give the school twice as many units as the park, and use all 100 units.' },
];

export function allocate(clinic, school, park) {
  if (![clinic, school, park].every((n) => Number.isInteger(n) && n >= 0 && n <= 100 && n % 5 === 0)) throw new RangeError('Use whole allocations from 0 to 100 in steps of 5.');
  const total = clinic + school + park;
  return { clinic, school, park, total, surplus: Math.max(0, 100 - total), shortage: Math.max(0, total - 100) };
}

export function feedback(index, a) {
  if (a.shortage) return `Demand exceeds supply by ${a.shortage} units. Reduce at least one allocation.`;
  if (a.surplus) return `${a.surplus} units remain unallocated. Use the full supply for this challenge.`;
  if (index === 0) return a.clinic < 50 ? 'The clinic needs at least 50 units, or one half.' : a.school < 25 ? 'The school needs at least 25 units, or one quarter.' : a.park === 0 ? 'The park needs some power too.' : 'This allocation meets all three conditions.';
  if (index === 1) return a.clinic < 40 || a.school < 35 || a.park < 20 ? 'The total fits, but at least one minimum is not met. Compare each allocation with its minimum.' : 'The shortage is resolved and all three minimums are met.';
  if (index === 2) return a.clinic !== 40 ? 'Set the clinic to exactly 40 units.' : a.school !== 2 * a.park ? 'Compare school with twice the park allocation.' : 'The clinic gets 40 and the school gets twice the park allocation.';
  throw new RangeError('Choose a listed situation.');
}

export function fraction(n) {
  let a = n, b = 100;
  while (b) [a, b] = [b, a % b];
  return `${n / a}/${100 / a}`;
}

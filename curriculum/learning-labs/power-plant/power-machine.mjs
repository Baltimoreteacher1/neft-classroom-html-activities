/** Positive whole-number powers used by the Lesson 6.3–6.4 machine. */
export function power(base, exponent) {
  if (!Number.isInteger(base) || base < 2 || base > 5 || !Number.isInteger(exponent) || exponent < 1 || exponent > 4) throw new RangeError('Choose a base from 2 to 5 and an exponent from 1 to 4.');
  const steps = [1];
  for (let i = 0; i < exponent; i++) steps.push(steps[i] * base);
  return { value: steps.at(-1), steps, expanded: Array(exponent).fill(base).join(' × ') };
}

export const SITUATIONS = [
  { title: 'Grouping changes the order', prompt: 'Compare 2(x + 3) + 2² with 2x + 3 + 2² when x is 4. Predict the first machine’s output before running it.' },
  { title: 'Repair the distribution', prompt: 'Machine B forgot to distribute the 2 to the 3. Change its added amount so its rule is equivalent to Machine A for every value of x.' },
  { title: 'One match is not enough', prompt: 'At x = 4, both machines have the same output. Change x to 2 and use the result to investigate whether the rules are equivalent.' },
];

export function evaluate(p) {
  if (!['grouped', 'ungrouped'].includes(p.grouping) || !Number.isInteger(p.a) || p.a < 2 || p.a > 4 || !Number.isInteger(p.b) || p.b < 1 || p.b > 4 || !Number.isInteger(p.base) || p.base < 2 || p.base > 3 || !Number.isInteger(p.exponent) || p.exponent < 1 || p.exponent > 3 || !Number.isInteger(p.x) || p.x < 1 || p.x > 6 || !Number.isInteger(p.multiplier) || p.multiplier < 0 || p.multiplier > 5 || !Number.isInteger(p.bonus) || p.bonus < 0 || p.bonus > 20) throw new RangeError('Choose values from the listed controls.');
  const power = p.base ** p.exponent;
  const aBonus = p.grouping === 'grouped' ? p.a * p.b : p.b;
  const first = p.a * p.x + aBonus + power, second = p.multiplier * p.x + p.bonus + power;
  const equivalent = p.a === p.multiplier && aBonus === p.bonus;
  const anotherX = p.x === 1 ? 2 : 1;
  const otherA = p.a * anotherX + aBonus + power, otherB = p.multiplier * anotherX + p.bonus + power;
  return { power, aBonus, first, second, equivalent, anotherX, otherA, otherB };
}

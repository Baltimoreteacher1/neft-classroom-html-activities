// Small helpers shared by the strand generators (strands-78.js and later bands): seeded picks, gcd, number text.
export const randInt = (min, max, rng) => Math.floor(rng() * (max - min + 1)) + min;
export const pick = (list, rng) => list[randInt(0, list.length - 1, rng)];
export function shuffle(list, rng) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = randInt(0, i, rng);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
export const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
export const sum = (values) => values.reduce((a, b) => a + b, 0);
// 141.3 -> "141.3"; -2 -> "−2" (the lab's own minus sign)
export const fmtNum = (n) => String(Number(Number(n).toFixed(4))).replace("-", "−");

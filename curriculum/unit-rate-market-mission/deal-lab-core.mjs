/* Unit Rate Market Mission · Deal Lab core. DOM-free.
 * Money is integer cents. A unit price is an EXACT fraction of cents per item ({n, d} BigInt,
 * from the Project Studio's exact.mjs), so a comparison never depends on floating point.
 * Seeded randomness (mulberry32) makes every generated item reproducible from its seed. */
import { cmp, frac, parse } from "../projects/studio/exact.mjs";

export function rng(seed) {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
export const pick = (r, list) => list[Math.floor(r() * list.length)];
export function shuffle(r, list) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/* Deal rules. A rule changes what one PURCHASE is: "buy 2 get 1 free" means 3 packs for the
 * price of 2; "N% off" keeps the pack and multiplies its price by (100 - N)/100. */
export const RULES = [
  { id: "none", label: "No deal" },
  { id: "b2g1", label: "Buy 2, get 1 free" },
  { id: "off10", label: "10% off" },
  { id: "off20", label: "20% off" },
  { id: "off25", label: "25% off" },
  { id: "off50", label: "50% off" },
];
export const ruleLabel = (id) => (RULES.find((x) => x.id === id) || RULES[0]).label;

/** One purchase under the deal's rule: { packs, qty (items), cost (exact cents) }. */
export function purchase(deal) {
  const q = BigInt(deal.qty);
  const c = BigInt(deal.cents);
  if (deal.rule === "b2g1") return { packs: 3, qty: 3n * q, cost: frac(2n * c) };
  const off = /^off(\d+)$/.exec(deal.rule || "");
  if (off) return { packs: 1, qty: q, cost: frac(c * (100n - BigInt(off[1])), 100n) };
  return { packs: 1, qty: q, cost: frac(c) };
}
/** Exact cents per ONE item (or one unit of measure). */
export function unitPrice(deal) {
  const p = purchase(deal);
  return frac(p.cost.n, p.cost.d * p.qty);
}
/** "A" when A has the lower unit price, "B" when B does, "tie" when they are equal. */
export function bestBuy(a, b) {
  const c = cmp(unitPrice(a), unitPrice(b));
  return c < 0 ? "A" : c > 0 ? "B" : "tie";
}

/* ---------- money text ---------- */
export const terminates = (x) => {
  let d = x.d;
  while (d % 2n === 0n) d /= 2n;
  while (d % 5n === 0n) d /= 5n;
  return d === 1n;
};
export const fmtCents = (cents) => {
  const n = Number(cents);
  return `$${Math.floor(n / 100)}.${String(n % 100).padStart(2, "0")}`;
};
/** Dollars text for an exact cents fraction. Terminating values print exactly (up to 4 places);
 * a repeating value prints rounded to the cent with "about", so it is never shown as exact. */
export function fmtExact(x) {
  // x cents = x/100 dollars; print with at least 2 decimals, trailing zeros beyond 2 dropped.
  let places = 2;
  while (places < 6 && (x.n * 10n ** BigInt(places)) % (x.d * 100n) !== 0n) places++;
  if (terminates(x) && (x.n * 10n ** BigInt(places)) % (x.d * 100n) === 0n) {
    const scaled = (x.n * 10n ** BigInt(places)) / (x.d * 100n);
    const s = scaled.toString().padStart(places + 1, "0");
    return { text: `$${s.slice(0, -places)}.${s.slice(-places)}`, exact: true };
  }
  const cents = (x.n * 2n + x.d) / (2n * x.d); // round half up to the cent
  return { text: `about ${fmtCents(cents)}`, exact: false };
}

/** Student money text -> exact cents, or { error }. Accepts $5.40, 5.40, .45, 45¢, 45 cents, 3/4. */
export function parseMoney(raw) {
  let s = String(raw ?? "")
    .trim()
    .replace(/,/g, "");
  if (!s) return { error: "empty" };
  let inCents = false;
  const c = /^(.*?)\s*(¢|c|cents?)$/i.exec(s);
  if (c) {
    s = c[1];
    inCents = true;
  }
  s = s.replace(/^\$\s*/, "");
  const v = parse(s);
  if (!v) return { error: "notNumber" };
  if (v.n <= 0n) return { error: "notPositive" };
  return { cents: inCents ? v : frac(v.n * 100n, v.d) };
}
/** A price a store could print: a whole number of cents from $0.01 to $999.99. */
export function parsePrice(raw) {
  const m = parseMoney(raw);
  if (m.error) return m;
  if (m.cents.d !== 1n) return { error: "partCent" };
  if (m.cents.n > 99999n) return { error: "tooBig" };
  return { cents: Number(m.cents.n) };
}
/** A package size: a whole number of items from 1 to 200. */
export function parseCount(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return { error: "empty" };
  if (!/^\d+$/.test(s)) return { error: "notWhole" };
  const n = Number(s);
  if (n < 1) return { error: "notPositive" };
  if (n > 200) return { error: "tooBig" };
  return { count: n };
}
export const INPUT_ERRORS = {
  empty: "Type a number first.",
  notNumber: "Type a number like 0.45 or $0.45.",
  notPositive: "A price or size must be more than 0.",
  partCent: "Stores price in whole cents. Use at most 2 decimal places, like $3.25.",
  tooBig: "Keep it to a size of 200 or less and a price under $1,000.",
  notWhole: "A package holds a whole number of items. Type a whole number, like 12.",
};

// Integer-cent money helpers shared by the generators, the checker and the register. Money is whole cents or an exact
// rational; nothing here uses floating point. Rounding rule everywhere: to the nearest cent, half a cent rounds UP.
// @fm2 FM-050 FM-054 FM-057
import { frac, fromDecimal, mul, toDecimalString } from "../../rational.js";

export const DENOMS = [1, 5, 10, 25, 100, 500, 1000, 2000];
export const COINS = [1, 5, 10, 25];

export const money = (cents) => `$${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
export const cent = (cents) => `${cents}¢`;
export const sum = (items) => items.reduce((total, value) => total + value, 0);

// floor((2·num + den) / 2·den): the nearest whole number to num/den, ties up. num >= 0, den > 0, both integers.
export const roundHalfUp = (num, den) => Math.floor((2 * num + den) / (2 * den));
export const roundTo = (value, step) => step * roundHalfUp(value, step);

// The fewest pieces from `pool` that make `target` (dynamic programming, so it does not assume greedy works).
export function fewestPieces(target, pool) {
  const best = Array(target + 1).fill(Infinity);
  const last = Array(target + 1).fill(0);
  best[0] = 0;
  for (let amount = 1; amount <= target; amount += 1) {
    for (const piece of pool) {
      if (piece <= amount && best[amount - piece] + 1 < best[amount]) {
        best[amount] = best[amount - piece] + 1;
        last[amount] = piece;
      }
    }
  }
  if (!Number.isFinite(best[target])) return null;
  const pieces = [];
  for (let amount = target; amount > 0; amount -= last[amount]) pieces.push(last[amount]);
  return pieces.sort((a, b) => b - a);
}

// Learner-typed text -> exact rational in the field's unit ("$" dollars, "c" cents, "%" percent, "#" plain), or null.
// Accepts $, ¢, %, spaces, thousands commas and a decimal comma ("1,25"). A $ sign always means dollars and a ¢ sign
// always means cents, whatever the field unit, so "$0.35" and "35¢" both work in a cents field.
export function parseTyped(text, unit) {
  let raw = String(text ?? "").replace(/\s+/g, "");
  const hasDollar = raw.includes("$");
  const hasCent = /¢|c$/i.test(raw);
  raw = raw.replace(/[$¢%]/g, "").replace(/c$/i, "");
  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(raw)) raw = raw.replaceAll(",", "");
  else if (/^\d+,\d{1,2}$/.test(raw)) raw = raw.replace(",", ".");
  if (!/^\d*\.?\d+$|^\d+\.$/.test(raw)) return null;
  const base = fromDecimal(raw.endsWith(".") ? raw.slice(0, -1) : raw);
  if (!base) return null;
  if (unit === "$") return hasCent && !hasDollar ? mul(base, frac(1, 100)) : base;
  if (unit === "c") return hasDollar ? mul(base, frac(100)) : base;
  return base;
}

// A rational as the text a learner would type for it (used by solve()).
export function typedText(value, unit) {
  if (unit === "$") {
    const cents = (value.n * 100) / value.d;
    return Number.isInteger(cents) ? money(cents).slice(1) : (toDecimalString(value) ?? "");
  }
  return toDecimalString(value) ?? `${value.n}/${value.d}`;
}


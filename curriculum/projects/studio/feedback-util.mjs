/** Shared helpers for the per-family feedback specs. Pure; no DOM. */
import { format } from "./math.mjs";
export const TOL = 0.011;
export const near = (x, y) => Number.isFinite(x) && Number.isFinite(y) && Math.abs(x - y) <= TOL;
export const fmt = format;
export const usd = (n) => {
  const r = Math.round(Math.abs(n) * 100) / 100;
  const text = Number.isInteger(r) ? String(r) : r.toFixed(2);
  return `${n < 0 ? "-" : ""}$${text}`;
};
/** A named wrong-answer pattern: when the student's number equals `values`, `say(s)` names the slip. */
export const trap = (code, values, say) => ({ code, values: [].concat(values), say });
export const isWhole = (n) => Math.abs(n - Math.round(n)) < 1e-9;

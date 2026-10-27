// The game's mathematics: skills, round dispatch, scoring (`check`), the model solution (`solve`) and answer text.
// Pure and DOM-free. Every comparison is exact (integer cents or rationals). @fm2 FM-017 FM-019 FM-050 FM-060
import { eq, frac, mul } from "../../rational.js";
import { feedbackText } from "./copy.js";
import { fewestPieces, money, parseTyped, sum, typedText } from "./money.js";
import * as a from "./rounds-a.js";
import * as b from "./rounds-b.js";

// id -> [min grade, max grade, standard, generator]
export const SKILL_TABLE = {
  "penny-count": [0, 0, "K.CC.B.5", a.pennyCount],
  "costs-more": [0, 1, "K.CC.C.7", a.costsMore],
  "count-pnd": [1, 1, "1.NBT.B.2", a.countPnd],
  "dollars-cents": [2, 2, "2.MD.C.8", a.dollarsCents],
  "make-change": [2, 3, "2.MD.C.8", a.makeChange],
  "exact-pay": [3, 3, "3.NBT.A.2", a.exactPay],
  "round-prices": [3, 3, "3.NBT.A.1", a.roundPrices],
  "fill-budget": [3, 4, "4.MD.A.2", a.fillBudget],
  "multi-step-money": [4, 4, "4.OA.A.3", a.multiStepMoney],
  "decimal-ops": [5, 5, "5.NBT.B.7", b.decimalOps],
  "better-buy": [5, 6, "6.RP.A.3b", b.betterBuy],
  "rate-table": [6, 6, "6.RP.A.3a", b.rateTable],
  "percent-off": [6, 7, "6.RP.A.3c", b.percentOff],
  "tax-tip": [7, 7, "7.RP.A.3", b.taxTip],
  "percent-change": [7, 7, "7.RP.A.3", b.percentChange],
  "simple-interest": [7, 7, "7.RP.A.3", b.simpleInterest],
  "compare-plans": [8, 8, "8.F.B.4", b.comparePlans],
  "break-even": [8, 8, "8.EE.C.7", b.breakEven],
  "slope-unit-cost": [8, 8, "8.EE.B.5", b.slopeUnitCost],
};

export function makeRound(skillId, level, rng, grade) {
  const entry = SKILL_TABLE[skillId];
  if (!entry) throw new RangeError(`Unknown skill ${skillId}`);
  const [low, high, , generate] = entry;
  const lvl = Math.min(3, Math.max(1, level));
  return generate(lvl, rng, Math.min(high, Math.max(low, grade)));
}

const good = (kind) => ({
  correct: true,
  feedback: {
    enter: { en: "That is the number the register needs.", es: "Ese es el número que necesita la caja." },
    tray: { en: "The tray matches exactly.", es: "La bandeja coincide exactamente." },
    cart: { en: "That cart fits the plan.", es: "Ese carrito cumple con el plan." },
    pick: { en: "Good eye.", es: "Buen ojo." },
  }[kind === "pickEnter" ? "enter" : kind],
});
const miss = (mistake, round) => ({ correct: false, mistake, feedback: feedbackText(mistake, round.skillId) });

// Compare typed field values with the exact answers; returns null when all match, else the most specific mistake.
function fieldMistake(round, values) {
  const typed = {};
  for (const field of round.fields) {
    typed[field.key] = parseTyped(values?.[field.key], field.unit);
    if (!typed[field.key]) return "not-a-number";
  }
  const wrongKeys = round.fields.filter((f) => !eq(typed[f.key], round.expect[f.key]));
  if (!wrongKeys.length) return null;
  for (const wrong of round.wrongs) {
    if (Object.entries(wrong.values).every(([key, value]) => typed[key] && eq(typed[key], value))) return wrong.mistake;
  }
  for (const f of wrongKeys) {
    const want = round.expect[f.key];
    if (!want.n) continue;
    if (eq(typed[f.key], mul(want, frac(100))) || eq(typed[f.key], mul(want, frac(1, 100)))) return "unit-slip";
    if (eq(typed[f.key], mul(want, frac(10))) || eq(typed[f.key], mul(want, frac(1, 10)))) return "decimal-slip";
  }
  return "recheck";
}

export function pieces(round) {
  return fewestPieces(round.target, round.pool);
}

export function cartTotal(round, cart) {
  return sum([...new Set(cart)].map((i) => round.scene.tags[i].cents));
}

// One cart that satisfies the budget, found by trying every subset (at most 2^8). Used by solve() and the tier-3 hint.
export function solveCart(round) {
  const prices = round.scene.tags.map((t) => t.cents);
  for (let mask = 1; mask < 1 << prices.length; mask += 1) {
    const cart = prices.map((_, i) => i).filter((i) => mask & (1 << i));
    const total = sum(cart.map((i) => prices[i]));
    if (total <= round.budget && total >= round.min) return cart;
  }
  return null;
}

export function check(round, response) {
  const r = response || {};
  if (round.kind === "pick") return r.pick === round.answer ? good("pick") : miss(round.pickMistake, round);
  if (round.kind === "pickEnter") {
    if (r.pick !== round.answer) return miss(round.pickMistake, round);
    const mistake = fieldMistake(round, r.values);
    return mistake ? miss(mistake, round) : good("pickEnter");
  }
  if (round.kind === "enter") {
    const mistake = fieldMistake(round, r.values);
    return mistake ? miss(mistake, round) : good("enter");
  }
  if (round.kind === "tray") {
    const tray = Array.isArray(r.tray) ? r.tray : [];
    if (tray.some((piece) => !round.pool.includes(piece))) return miss("recheck", round);
    const total = sum(tray);
    if (total === round.target) return round.fewest && tray.length > round.min ? miss("not-fewest", round) : good("tray");
    const named = Object.entries(round.trayWrongs).find(([, value]) => value === total);
    if (named) return miss(named[0], round);
    return miss(total < round.target ? "short" : "over", round);
  }
  const cart = Array.isArray(r.cart) ? r.cart.filter((i) => Number.isInteger(i) && round.scene.tags[i]) : [];
  if (!cart.length) return miss("empty-cart", round);
  const total = cartTotal(round, cart);
  if (total > round.budget) return miss("over-budget", round);
  return total < round.min ? miss("under-target", round) : good("cart");
}

export function solve(round) {
  if (round.kind === "pick") return { pick: round.answer };
  if (round.kind === "tray") return { tray: pieces(round) };
  if (round.kind === "cart") return { cart: solveCart(round) };
  const values = Object.fromEntries(round.fields.map((f) => [f.key, typedText(round.expect[f.key], f.unit)]));
  return round.kind === "pickEnter" ? { pick: round.answer, values } : { values };
}

const show = (value, unit) =>
  unit === "$" ? money(Math.round((value.n * 100) / value.d)) : unit === "c" ? `${value.n}¢` : unit === "%" ? `${typedText(value, "%")}%` : typedText(value, "#");

export function answerText(round) {
  if (round.kind === "pick") return round.scene.tags[round.answer].name.en;
  if (round.kind === "tray") return money(round.target);
  if (round.kind === "cart") return money(cartTotal(round, solveCart(round)));
  const text = round.fields.map((f) => show(round.expect[f.key], f.unit)).join(" / ");
  return round.kind === "pickEnter" ? `${"AB"[round.answer]}: ${text}` : text;
}

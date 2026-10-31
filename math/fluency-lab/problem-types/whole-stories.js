// Story scenarios for whole-number addition and subtraction. One table feeds three types (real-world,
// equation, multi-step): the same story gives a typed answer, or "which equation fits", or two steps.
import { bi, fmt, int, pick } from "./kit.js";
import { drawPair } from "./whole-core.js";
import { Q } from "./rational.js";

const NAMES = ["Mia", "Jamal", "Sofía", "Wei", "Amara", "Diego", "Priya", "Noah"];
const THINGS = [
  { en: "books", es: "libros", g: "m" },
  { en: "stickers", es: "calcomanías", g: "f" },
  { en: "marbles", es: "canicas", g: "f" },
  { en: "pencils", es: "lápices", g: "m" },
  { en: "cards", es: "tarjetas", g: "f" },
  { en: "shells", es: "conchas", g: "f" },
];
const howMany = (n) => (n.g === "f" ? "Cuántas" : "Cuántos");
const E = (lhs, rhs, text) => ({ lhs, rhs, text });

const draw = (rng, spec, op, want = "any") => drawPair(rng, spec, op, want);
const guards = (list, answer) => list.filter((w) => w.v.n >= 0 && w.v.n !== answer);

// Each scenario returns { en, es, answer, expr?, solve?, wrong, steps, key, others } for the spec and op.
export const SCENARIOS = {
  join3(rng, spec) {
    for (let i = 0; i < 300; i += 1) {
      const [a, b] = draw(rng, spec, "add");
      const c = int(rng, spec.lo, spec.hi);
      if (a + b + c > spec.top) continue;
      const [who, n] = [pick(rng, NAMES), pick(rng, THINGS)];
      const total = a + b + c;
      return {
        en: `${who} has ${fmt(a)} ${n.en}, then gets ${fmt(b)} more, then gets ${fmt(c)} more. How many ${n.en} does ${who} have now?`,
        es: `${who} tiene ${fmt(a)} ${n.es}, luego recibe ${fmt(b)} más y después recibe ${fmt(c)} más. ¿${howMany(n)} ${n.es} tiene ${who} ahora?`,
        answer: total,
        thing: n,
        check: { kind: "expr", expr: `${a}+${b}+${c}`, role: "answer" },
        wrong: guards([{ v: Q(a + b), why: "left out the last amount" }, { v: Q(a + b - c), why: "subtracted the last amount" }, { v: Q(total + 1), why: "counted one too many" }], total),
        steps: [`All three amounts are put together, so add them.`, `Add the first two: ${fmt(a)} + ${fmt(b)}. Then add ${fmt(c)}.`, `${fmt(a)} + ${fmt(b)} + ${fmt(c)} = ${fmt(total)}.`],
        eq: { key: E(`${a}+${b}+${c}`, "x", `${fmt(a)} + ${fmt(b)} + ${fmt(c)} = □`), others: [{ ...E(`${a}+${b}-${c}`, "x", `${fmt(a)} + ${fmt(b)} − ${fmt(c)} = □`), why: "subtracts the last amount" }, { ...E(`${a}+${b}`, "x", `${fmt(a)} + ${fmt(b)} = □`), why: "leaves out an amount" }, { ...E(`${a}+x`, `${b}+${c}`, `${fmt(a)} + □ = ${fmt(b)} + ${fmt(c)}`), why: "treats the story as a balance" }] },
      };
    }
    throw new Error("join3");
  },
  change(rng, spec, want = "any") {
    const [a, b] = draw(rng, spec, "add", want);
    const c = a + b;
    const [who, n] = [pick(rng, NAMES), pick(rng, THINGS)];
    return {
      en: `${who} has ${fmt(a)} ${n.en}. ${who} gets some more and now has ${fmt(c)}. How many ${n.en} did ${who} get?`,
      es: `${who} tiene ${fmt(a)} ${n.es}. ${who} recibe más y ahora tiene ${fmt(c)}. ¿${howMany(n)} ${n.es} recibió ${who}?`,
      answer: b,
      thing: n,
      check: { kind: "solve", var: "x", lhs: `${a}+x`, rhs: String(c), role: "answer" },
      wrong: guards([{ v: Q(c), why: "gave the total instead of the part that was added" }, { v: Q(a + c), why: "added the two numbers in the story" }, { v: Q(b + 1), why: "counted one too few" }], b),
      steps: [`The story gives the start (${fmt(a)}) and the end (${fmt(c)}). The amount that was added is missing.`, `Find how far it is from ${fmt(a)} up to ${fmt(c)}.`, `${fmt(a)} + ${fmt(b)} = ${fmt(c)}, so ${who} got ${fmt(b)}.`],
      eq: { key: E(`${a}+x`, String(c), `${fmt(a)} + □ = ${fmt(c)}`), others: [{ ...E(`${a}-x`, String(c), `${fmt(a)} − □ = ${fmt(c)}`), why: "subtracts, although the amount grew" }, { ...E(`${a}+${c}`, "x", `${fmt(a)} + ${fmt(c)} = □`), why: "adds the two numbers in the story" }, { ...E(`${c}+x`, String(a), `${fmt(c)} + □ = ${fmt(a)}`), why: "swaps the start and the end" }] },
    };
  },
  start(rng, spec, op) {
    const [a, b] = draw(rng, spec, op, "any");
    const c = op === "add" ? a + b : a - b;
    const [who, n] = [pick(rng, NAMES), pick(rng, THINGS)];
    return {
      en: op === "add" ? `${who} had some ${n.en}. Then ${who} got ${fmt(b)} more and now has ${fmt(c)}. How many ${n.en} did ${who} have at first?` : `${who} had some ${n.en}, gave away ${fmt(b)}, and has ${fmt(c)} left. How many ${n.en} did ${who} have at first?`,
      es: op === "add" ? `${who} tenía ${n.es}. Luego recibió ${fmt(b)} más y ahora tiene ${fmt(c)}. ¿${howMany(n)} ${n.es} tenía ${who} al principio?` : `${who} tenía ${n.es}, regaló ${fmt(b)} y le quedan ${fmt(c)}. ¿${howMany(n)} ${n.es} tenía ${who} al principio?`,
      answer: a,
      thing: n,
      check: { kind: "solve", var: "x", lhs: op === "add" ? `x+${b}` : `x-${b}`, rhs: String(c), role: "answer" },
      wrong: guards([{ v: Q(op === "add" ? c + b : c - b), why: "did the same operation again instead of undoing it" }, { v: Q(b), why: "gave the amount that changed" }, { v: Q(a + 1), why: "counted one too many" }], a),
      steps: [`The story gives what changed (${fmt(b)}) and what is left at the end (${fmt(c)}). The start is missing.`, `Undo the change: ${op === "add" ? "take away" : "put back"} ${fmt(b)} ${op === "add" ? "from" : "onto"} ${fmt(c)}.`, `${op === "add" ? `${fmt(c)} − ${fmt(b)}` : `${fmt(c)} + ${fmt(b)}`} = ${fmt(a)}.`],
      eq: { key: E(op === "add" ? `x+${b}` : `x-${b}`, String(c), `□ ${op === "add" ? "+" : "−"} ${fmt(b)} = ${fmt(c)}`), others: [{ ...E(op === "add" ? `x-${b}` : `x+${b}`, String(c), `□ ${op === "add" ? "−" : "+"} ${fmt(b)} = ${fmt(c)}`), why: "uses the opposite operation" }, { ...E(`${c}${op === "add" ? "+" : "-"}${b}`, "x", `${fmt(c)} ${op === "add" ? "+" : "−"} ${fmt(b)} = □`), why: "does the story's operation on the ending number" }, { ...E(`${b}-x`, String(c), `${fmt(b)} − □ = ${fmt(c)}`), why: "puts the numbers in the wrong places" }] },
    };
  },
  total2(rng, spec) {
    for (let i = 0; i < 300; i += 1) {
      const a = int(rng, spec.lo, spec.hi);
      const b = int(rng, spec.lo, spec.hi);
      const total = 2 * a + b;
      if (total > spec.top) continue;
      const [w1, w2] = [pick(rng, NAMES), pick(rng, NAMES)];
      if (w1 === w2) continue;
      const n = pick(rng, THINGS);
      return {
        en: `${w1} has ${fmt(a)} ${n.en}. ${w2} has ${fmt(b)} more ${n.en} than ${w1}. How many ${n.en} do they have in all?`,
        es: `${w1} tiene ${fmt(a)} ${n.es}. ${w2} tiene ${fmt(b)} ${n.es} más que ${w1}. ¿${howMany(n)} ${n.es} tienen en total?`,
        answer: total,
        thing: n,
        check: { kind: "expr", expr: `${a}+(${a}+${b})`, role: "answer" },
        wrong: guards([{ v: Q(a + b), why: "found only the second person's amount" }, { v: Q(2 * a), why: "ignored the extra amount" }, { v: Q(a + b + b), why: "added the extra amount twice" }], total),
        steps: [`First find how many ${w2} has: ${fmt(a)} plus ${fmt(b)} more.`, `Then add what ${w1} has to what ${w2} has.`, `${fmt(a)} + (${fmt(a)} + ${fmt(b)}) = ${fmt(total)}.`],
        eq: { key: E(`${a}+(${a}+${b})`, "x", `${fmt(a)} + (${fmt(a)} + ${fmt(b)}) = □`), others: [{ ...E(`${a}+${b}`, "x", `${fmt(a)} + ${fmt(b)} = □`), why: "finds only the second person's amount" }, { ...E(`${a}+${a}+${b}+${b}`, "x", `${fmt(a)} + ${fmt(a)} + ${fmt(b)} + ${fmt(b)} = □`), why: "adds the extra amount twice" }, { ...E(`${a}-${b}`, "x", `${fmt(a)} − ${fmt(b)} = □`), why: "subtracts because of the word more" }] },
      };
    }
    throw new Error("total2");
  },
  compare(rng, spec) {
    const [a, b] = draw(rng, spec, "sub");
    const c = a - b;
    const w1 = pick(rng, NAMES);
    const who2 = NAMES[(NAMES.indexOf(w1) + 1 + int(rng, 0, NAMES.length - 2)) % NAMES.length];
    const n = pick(rng, THINGS);
    return {
      en: `${w1} has ${fmt(a)} ${n.en}. ${who2} has ${fmt(b)} ${n.en}. How many more ${n.en} does ${w1} have than ${who2}?`,
      es: `${w1} tiene ${fmt(a)} ${n.es}. ${who2} tiene ${fmt(b)} ${n.es}. ¿${howMany(n)} ${n.es} más tiene ${w1} que ${who2}?`,
      answer: c,
      thing: n,
      check: { kind: "expr", expr: `${a}-${b}`, role: "answer" },
      wrong: guards([{ v: Q(a + b), why: "added instead of finding the difference" }, { v: Q(a), why: "gave the larger amount" }, { v: Q(c + 1), why: "counted one too few" }], c),
      steps: [`To find how many more, compare the two amounts: find the difference.`, `Subtract the smaller amount from the larger: ${fmt(a)} − ${fmt(b)}.`, `${fmt(a)} − ${fmt(b)} = ${fmt(c)}.`],
      eq: { key: E(`${a}-${b}`, "x", `${fmt(a)} − ${fmt(b)} = □`), others: [{ ...E(`${a}+${b}`, "x", `${fmt(a)} + ${fmt(b)} = □`), why: "adds the amounts" }, { ...E(`${b}-${a}`, "x", `${fmt(b)} − ${fmt(a)} = □`), why: "subtracts the larger from the smaller" }, { ...E(`${a}+x`, String(b), `${fmt(a)} + □ = ${fmt(b)}`), why: "treats the smaller amount as the total" }] },
    };
  },
  take(rng, spec) {
    const [a, b] = draw(rng, spec, "sub");
    const c = a - b;
    const unit = pick(rng, [["cm", "cm", "ribbon", "cinta"], ["m", "m", "rope", "cuerda"]]);
    return {
      en: `A ${unit[2]} is ${fmt(a)} ${unit[0]} long. ${fmt(b)} ${unit[0]} are cut off. How long is the ${unit[2]} now?`,
      es: `Una ${unit[3]} mide ${fmt(a)} ${unit[1]} de largo. Se cortan ${fmt(b)} ${unit[1]}. ¿Cuánto mide ahora?`,
      answer: c,
      thing: { en: unit[0], es: unit[1] },
      check: { kind: "expr", expr: `${a}-${b}`, role: "answer" },
      wrong: guards([{ v: Q(a + b), why: "added the piece that was cut off" }, { v: Q(b), why: "gave the piece that was cut off" }, { v: Q(c - 1), why: "counted one too many" }], c),
      steps: [`Cutting a piece off makes the length shorter, so take the cut piece away.`, `Start with the whole length: ${fmt(a)} ${unit[0]} − ${fmt(b)} ${unit[0]}.`, `${fmt(a)} − ${fmt(b)} = ${fmt(c)}.`],
      eq: { key: E(`${a}-${b}`, "x", `${fmt(a)} − ${fmt(b)} = □`), others: [{ ...E(`${a}+${b}`, "x", `${fmt(a)} + ${fmt(b)} = □`), why: "adds the cut piece" }, { ...E(`${b}-${a}`, "x", `${fmt(b)} − ${fmt(a)} = □`), why: "subtracts the whole from the piece" }, { ...E(`x-${a}`, String(b), `□ − ${fmt(a)} = ${fmt(b)}`), why: "treats the whole length as the unknown" }] },
    };
  },
  save(rng, spec) {
    for (let i = 0; i < 300; i += 1) {
      const [a, b] = draw(rng, spec, "sub");
      const c = int(rng, spec.lo, Math.min(spec.hi, a - b - 1));
      if (c < 1 || a - b - c < 1) continue;
      const answer = a - b - c;
      const who = pick(rng, NAMES);
      return {
        en: `A toy costs ${fmt(a)} cents. ${who} has ${fmt(b)} cents. ${who}'s friend gives ${who} ${fmt(c)} more cents. How many more cents does ${who} still need?`,
        es: `Un juguete cuesta ${fmt(a)} centavos. ${who} tiene ${fmt(b)} centavos. Su amigo le da ${fmt(c)} centavos más. ¿Cuántos centavos más necesita todavía ${who}?`,
        answer,
        thing: { en: "cents", es: "centavos" },
        check: { kind: "expr", expr: `${a}-${b}-${c}`, role: "answer" },
        wrong: guards([{ v: Q(a - b), why: "forgot the money from the friend" }, { v: Q(a - b + c), why: "added the friend's money to what is still needed" }, { v: Q(a - c), why: "ignored what was already saved" }], answer),
        steps: [`${who} has ${fmt(b)} cents and then ${fmt(c)} cents more, so the money keeps going up.`, `The amount still needed is the price minus all the money ${who} has.`, `${fmt(a)} − ${fmt(b)} − ${fmt(c)} = ${fmt(answer)}.`],
        eq: { key: E(`${a}-${b}-${c}`, "x", `${fmt(a)} − ${fmt(b)} − ${fmt(c)} = □`), others: [{ ...E(`${a}-${b}`, "x", `${fmt(a)} − ${fmt(b)} = □`), why: "leaves out the friend's money" }, { ...E(`${a}-${b}+${c}`, "x", `${fmt(a)} − ${fmt(b)} + ${fmt(c)} = □`), why: "adds the friend's money to the amount needed" }, { ...E(`${b}+${c}-${a}`, "x", `${fmt(b)} + ${fmt(c)} − ${fmt(a)} = □`), why: "subtracts the price from the money" }] },
      };
    }
    throw new Error("save");
  },
};

export const FOR_LEVEL = {
  add: { 2: ["join3"], 3: ["change"], 4: ["start"], 5: ["total2"] },
  sub: { 2: ["compare"], 3: ["take"], 4: ["start"], 5: ["save"] },
};
export const scenarioFor = (rng, spec, op, level) => {
  const name = pick(rng, FOR_LEVEL[op][level]);
  return SCENARIOS[name](rng, spec, name === "start" ? op : "any");
};

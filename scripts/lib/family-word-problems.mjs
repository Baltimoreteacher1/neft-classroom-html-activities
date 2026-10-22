/**
 * Family word problems: authored stems, asks and hints (data/family-word-problems/<lesson>.json)
 * plus answers computed here from the numbers each problem declares. An answer is never
 * authored, so a stem and its answer cannot drift apart; tools/family-word-problems.test.mjs
 * re-derives the arithmetic independently and checks the stems carry the same numbers.
 */

export const LANGS = ["en", "es"];

export const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Trim to at most two decimals; throws when a quantity is not exact to the cent. */
export function num(n) {
  const cents = n * 100;
  if (Math.abs(cents - Math.round(cents)) > 1e-9)
    throw new Error(`${n} is not exact to two decimals`);
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0$/, "");
}

/** A quantity with its unit: dollars prefix, anything else follows in the reader's language. */
export function amount(n, unit, lang) {
  if (unit === "$") return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
  return `${num(n)} ${unit[lang]}`;
}

const decimal = (percent) => (percent / 100).toFixed(2);

/** Part of a whole, exact: percent and whole are integers in the data. */
export function partOf(percent, whole) {
  const part = (percent * whole) / 100;
  num(part);
  return part;
}

const T = {
  en: {
    toDecimal: (p) => `Change the percent to a decimal: ${p}% = ${decimal(p)}.`,
    multiply: (p, w, part) => `Multiply: ${decimal(p)} × ${w} = ${part}.`,
    answer: (a) => `Answer: ${a}.`,
    savings: (p, w, s) => `Savings: ${decimal(p)} × ${w} = ${s}.`,
    pays: (w, s, pay) => `Sale price: ${w} − ${s} = ${pay}.`,
    saveAndPay: (s, pay) => `You save ${s} and pay ${pay}.`,
    optionOff: (name, p, w, s) => `${name} takes off ${decimal(p)} × ${w} = ${s}.`,
    optionPays: (name, w, s, pay) => `${name} costs ${w} − ${s} = ${pay}.`,
    moreOff: (name) => `${name} takes more off.`,
    sameOff: (s) => `Both discounts take off ${s}.`,
    lessCost: (name) => `${name} costs less after the discount.`,
  },
  es: {
    toDecimal: (p) => `Cambia el porcentaje a decimal: ${p}% = ${decimal(p)}.`,
    multiply: (p, w, part) => `Multiplica: ${decimal(p)} × ${w} = ${part}.`,
    answer: (a) => `Respuesta: ${a}.`,
    savings: (p, w, s) => `Ahorro: ${decimal(p)} × ${w} = ${s}.`,
    pays: (w, s, pay) => `Precio de oferta: ${w} − ${s} = ${pay}.`,
    saveAndPay: (s, pay) => `Ahorras ${s} y pagas ${pay}.`,
    optionOff: (name, p, w, s) => `${name} quita ${decimal(p)} × ${w} = ${s}.`,
    optionPays: (name, w, s, pay) => `${name} cuesta ${w} − ${s} = ${pay}.`,
    moreOff: (name) => `${name} quita más.`,
    sameOff: (s) => `Los dos descuentos quitan ${s}.`,
    lessCost: (name) => `${name} cuesta menos después del descuento.`,
  },
};

/**
 * What a problem's answer is made of, computed once from the numbers it declares. The worked
 * steps below and the student page both read this, so neither can disagree with the other.
 */
export function answerFor(problem) {
  if (problem.kind === "percent-of") {
    return { kind: problem.kind, part: partOf(problem.percent, problem.whole) };
  }
  if (problem.kind === "discount") {
    const saved = partOf(problem.percent, problem.price);
    return { kind: problem.kind, saved, pay: problem.price - saved };
  }
  if (problem.kind === "deal") {
    const rows = problem.options.map((o) => {
      const saved = partOf(o.percent, o.price);
      return { name: o.name, percent: o.percent, price: o.price, saved, pay: o.price - saved };
    });
    const [x, y] = rows;
    if (x.pay === y.pay)
      throw new Error(`${problem.id}: final prices tie, the question would be ambiguous`);
    return {
      kind: problem.kind,
      rows,
      moreOff: x.saved === y.saved ? null : x.saved > y.saved ? 0 : 1,
      cheaper: x.pay < y.pay ? 0 : 1,
    };
  }
  throw new Error(`${problem.id}: unknown kind ${problem.kind}`);
}

/** Worked answer for one problem in one language: an array of lines, the last is the answer. */
export function solve(problem, lang) {
  const t = T[lang];
  const unit = problem.unit;
  const a = (n) => amount(n, unit, lang);
  const ans = answerFor(problem);
  if (ans.kind === "percent-of") {
    return [
      t.toDecimal(problem.percent),
      t.multiply(
        problem.percent,
        unit === "$" ? a(problem.whole) : num(problem.whole),
        unit === "$" ? a(ans.part) : num(ans.part),
      ),
      t.answer(a(ans.part)),
    ];
  }
  if (ans.kind === "discount") {
    return [
      t.toDecimal(problem.percent),
      t.savings(problem.percent, a(problem.price), a(ans.saved)),
      t.pays(a(problem.price), a(ans.saved), a(ans.pay)),
      t.saveAndPay(a(ans.saved), a(ans.pay)),
    ];
  }
  const rows = ans.rows.map((r) => ({ ...r, name: r.name[lang] }));
  const offLine =
    ans.moreOff === null ? t.sameOff(a(rows[0].saved)) : t.moreOff(rows[ans.moreOff].name);
  return [
    ...rows.map((r) => t.optionOff(r.name, r.percent, a(r.price), a(r.saved))),
    offLine,
    ...rows.map((r) => t.optionPays(r.name, a(r.price), a(r.saved), a(r.pay))),
    t.lessCost(rows[ans.cheaper].name),
  ];
}

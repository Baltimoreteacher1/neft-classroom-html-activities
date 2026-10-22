/**
 * What both word-problem pages (student and family) check an answer against: the feedback messages
 * in English and Spanish, and each problem's expected answers, mix-up messages and worked steps,
 * all computed from the numbers the problem declares (never typed in by hand).
 */
import { amount, answerFor, solve } from "./family-word-problems.mjs";

export const M = {
  en: {
    percentIs: (p, w) =>
      `${p} is the percent itself. The question asks for ${p}% of ${w}: change the percent to a decimal, then multiply.`,
    leftOver: (x, p) =>
      `${x} is what is left after taking away the ${p}%. The question asks for the ${p}% part itself.`,
    percentGeneric: (p) => `Not yet. Change ${p}% to a decimal, then multiply it by the whole.`,
    isSalePrice: (x) =>
      `${x} is the sale price. “How much do you save?” asks for the amount taken off: percent × price.`,
    isSavings: (x) =>
      `${x} is the amount you save. The sale price is what you pay: subtract the savings from the price.`,
    isOriginal: (x) =>
      `${x} is the price before the discount. Subtract the savings to get the sale price.`,
    saveGeneric: (p) =>
      `Not yet. Savings = ${p}% × the price. Change ${p}% to a decimal, then multiply.`,
    payGeneric: "Not yet. Find the savings first, then subtract it from the price.",
    moreOffGeneric:
      "Find each discount first (percent × price for each one), then compare the two amounts.",
    cheaperGeneric: "Subtract each discount from its own price, then compare the two sale prices.",
    biggerPercent:
      "A bigger percent is not always a lower price. Subtract each discount from its own price, then compare.",
    same: "They take off the same amount",
    whichMore: "Which discount takes off more?",
    whichCheaper: "Which one costs less after the discount?",
    problem: "Problem",
    askYourself: "Ask yourself:",
    answer: "Answer",
    youSave: "You save",
    salePrice: "Sale price",
    check: "Check answer",
    hint: "Hint",
    steps: "Show the worked steps",
    read: "Read Aloud",
    start: "Start with",
    example: "Worked example",
  },
  es: {
    percentIs: (p, w) =>
      `${p} es el porcentaje mismo. La pregunta pide el ${p}% de ${w}: cambia el porcentaje a decimal y luego multiplica.`,
    leftOver: (x, p) =>
      `${x} es lo que queda después de quitar el ${p}%. La pregunta pide la parte del ${p}%.`,
    percentGeneric: (p) => `Todavía no. Cambia ${p}% a decimal y multiplícalo por el total.`,
    isSalePrice: (x) =>
      `${x} es el precio de oferta. “¿Cuánto ahorras?” pide la cantidad que se quita: porcentaje × precio.`,
    isSavings: (x) =>
      `${x} es lo que ahorras. El precio de oferta es lo que pagas: resta el ahorro del precio.`,
    isOriginal: (x) =>
      `${x} es el precio antes del descuento. Resta el ahorro para hallar el precio de oferta.`,
    saveGeneric: (p) =>
      `Todavía no. Ahorro = ${p}% × el precio. Cambia ${p}% a decimal y multiplica.`,
    payGeneric: "Todavía no. Halla primero el ahorro y luego réstalo del precio.",
    moreOffGeneric:
      "Halla primero cada descuento (porcentaje × precio de cada una) y luego compara las dos cantidades.",
    cheaperGeneric:
      "Resta cada descuento de su propio precio y luego compara los dos precios de oferta.",
    biggerPercent:
      "Un porcentaje mayor no siempre da un precio menor. Resta cada descuento de su propio precio y luego compara.",
    same: "Quitan la misma cantidad",
    whichMore: "¿Cuál descuento quita más?",
    whichCheaper: "¿Cuál cuesta menos después del descuento?",
    problem: "Problema",
    askYourself: "Pregúntate:",
    answer: "Respuesta",
    youSave: "Ahorras",
    salePrice: "Precio de oferta",
    check: "Comprobar respuesta",
    hint: "Pista",
    steps: "Ver los pasos resueltos",
    read: "Leer en voz alta",
    start: "Empieza con",
    example: "Ejemplo resuelto",
  },
};

const both = (fn) => ({ en: fn("en"), es: fn("es") });
export const text = (key) => ({ en: M.en[key], es: M.es[key] });

/** Everything the page script needs to check one problem, computed from its numbers. */
export function clientProblem(problem) {
  const ans = answerFor(problem);
  const steps = { en: solve(problem, "en"), es: solve(problem, "es") };
  const a = (lang, n) => amount(n, problem.unit, lang);
  const wrongValues = (list) =>
    list.map(([value, msgFor]) => ({ value, msg: both((lang) => msgFor(M[lang], lang)) }));
  if (ans.kind === "percent-of") {
    const others = [
      [problem.percent, (m, l) => m.percentIs(problem.percent, a(l, problem.whole))],
      [
        problem.whole - ans.part,
        (m, l) => m.leftOver(a(l, problem.whole - ans.part), problem.percent),
      ],
    ].filter(([v]) => v !== ans.part);
    return {
      id: problem.id,
      fields: [
        {
          answer: ans.part,
          generic: both((l) => M[l].percentGeneric(problem.percent)),
          wrong: wrongValues(others),
        },
      ],
      steps,
    };
  }
  if (ans.kind === "discount") {
    return {
      id: problem.id,
      fields: [
        {
          answer: ans.saved,
          generic: both((l) => M[l].saveGeneric(problem.percent)),
          wrong: wrongValues([[ans.pay, (m, l) => m.isSalePrice(a(l, ans.pay))]]),
        },
        {
          answer: ans.pay,
          generic: text("payGeneric"),
          wrong: wrongValues([
            [ans.saved, (m, l) => m.isSavings(a(l, ans.saved))],
            [problem.price, (m, l) => m.isOriginal(a(l, problem.price))],
          ]),
        },
      ],
      steps,
    };
  }
  const biggerPercent = ans.rows[0].percent > ans.rows[1].percent ? 0 : 1;
  const sameIndex = ans.rows.length;
  return {
    id: problem.id,
    questions: [
      {
        correct: ans.moreOff === null ? sameIndex : ans.moreOff,
        wrong: [...ans.rows, null].map(() => text("moreOffGeneric")),
      },
      {
        correct: ans.cheaper,
        wrong: ans.rows.map((_, i) =>
          text(i === biggerPercent && i !== ans.cheaper ? "biggerPercent" : "cheaperGeneric"),
        ),
      },
    ],
    steps,
  };
}

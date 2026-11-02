import { bi, int, pick } from "./kit.js";
import { Q, eq } from "./rational.js";

const SPECS = {
  "2:coins": { kind: "coins" },
  "2:interpret-data": { kind: "display" },
  "7:probability": { kind: "probability" },
  "8:association": { kind: "association" },
};

const wrongInts = (answer) =>
  [answer + 1, Math.max(0, answer - 1), answer + 2]
    .filter((n, i, all) => n !== answer && all.indexOf(n) === i)
    .slice(0, 3)
    .map((v, i) => ({ v: Q(v), why: ["counted one outcome too many", "counted one outcome too few", "used the wrong operation"][i] }));

function explanationChoice({ en, es, expr, answer, correct, distractors, rule }) {
  return {
    q: bi(en, es),
    form: "choice",
    answer: correct.en,
    answerEs: correct.es,
    options: distractors.map((d) => ({ text: d.en, es: d.es, why: d.why })),
    check: { kind: "expr", expr, role: "answer", map: { [String(answer)]: correct.en } },
    hint: rule,
    explanation: correct.en,
    steps: ["Identify the quantities in the question.", "Choose the relationship that matches those quantities.", correct.en],
  };
}

function coins(ctx) {
  const { rng, level, type } = ctx;
  const values = [25, 10, 5, 1];
  const names = ["25-cent coins", "10-cent coins", "5-cent coins", "1-cent coins"];
  const namesEs = ["monedas de 25 centavos", "monedas de 10 centavos", "monedas de 5 centavos", "monedas de 1 centavo"];
  const counts = values.map((_, i) => (i === 0 ? int(rng, 1, 3) : int(rng, 0, level + 1)));
  if (!counts.some((n, i) => i > 0 && n > 0)) counts[1] = 1;
  const answer = counts.reduce((sum, n, i) => sum + n * values[i], 0);
  const expr = counts.map((n, i) => `${n}*${values[i]}`).join("+");
  const itemsEn = counts.map((n, i) => n && `${n} ${names[i]}`).filter(Boolean);
  const itemsEs = counts.map((n, i) => n && `${n} ${namesEs[i]}`).filter(Boolean);
  const storyEn = `A student has ${itemsEn.join(", ")}. What is the total value in cents?`;
  const storyEs = `Un estudiante tiene ${itemsEs.join(", ")}. ¿Cuál es el valor total en centavos?`;
  if (type === "explain") {
    const correct = { en: "Multiply each coin count by its value, then add the amounts.", es: "Multiplicar la cantidad de cada moneda por su valor y luego sumar las cantidades." };
    return explanationChoice({
      en: `Which method finds the value of ${itemsEn.join(", ")} in cents?`,
      es: `¿Qué método encuentra el valor de ${itemsEs.join(", ")} en centavos?`,
      expr,
      answer,
      correct,
      distractors: [
        { en: "Add the number of coins and use that as the cents value.", es: "Sumar la cantidad de monedas y usarla como el valor en centavos.", why: "counts coins instead of valuing them" },
        { en: "Multiply the coin values but do not use the counts.", es: "Multiplicar los valores de las monedas sin usar las cantidades.", why: "ignores how many coins there are" },
      ],
      rule: correct.en,
    });
  }
  return {
    q: bi(storyEn, storyEs),
    form: "int",
    answer: Q(answer),
    unit: "cents",
    units: ["cents", "cent", "¢"],
    bare: expr,
    check: { kind: "expr", expr, role: "answer" },
    wrong: wrongInts(answer),
    hint: "Multiply each coin count by its value in cents, then add.",
    explanation: `The coins have a total value of ${answer} cents.`,
    steps: ["List each coin and its value in cents.", "Multiply each value by its coin count, then add.", `${expr} = ${answer} cents.`],
  };
}

function probability(ctx) {
  const { rng, level, type } = ctx;
  const total = int(rng, Math.max(8, level + 8), 20 + level);
  const favorable = int(rng, 2, total - 2);
  const answer = Q(favorable, total);
  const expr = `${favorable}/${total}`;
  const en = `A bag has ${favorable} red tiles out of ${total} tiles. What is the probability of choosing a red tile?`;
  const es = `Una bolsa tiene ${favorable} fichas rojas de ${total} fichas. ¿Cuál es la probabilidad de elegir una ficha roja?`;
  if (type === "explain") {
    const correct = { en: "Divide the favorable outcomes by the total outcomes.", es: "Dividir los resultados favorables entre el total de resultados." };
    return explanationChoice({
      en: `Which method finds the probability of choosing red from ${favorable} red tiles out of ${total}?`,
      es: `¿Qué método encuentra la probabilidad de elegir rojo entre ${favorable} fichas rojas de ${total}?`,
      expr,
      answer: answer.d === 1 ? String(answer.n) : `${answer.n}/${answer.d}`,
      correct,
      distractors: [
        { en: "Divide the total outcomes by the favorable outcomes.", es: "Dividir el total de resultados entre los resultados favorables.", why: "reverses the probability ratio" },
        { en: "Subtract favorable outcomes from total outcomes.", es: "Restar los resultados favorables del total de resultados.", why: "finds the number of non-red tiles, not a probability" },
      ],
      rule: correct.en,
    });
  }
  const candidates = [Q(total - favorable, total), Q(1, total), Q(favorable, total - 1)];
  const wrong = candidates
    .filter((candidate, index, all) => !eq(candidate, answer) && all.findIndex((item) => eq(item, candidate)) === index)
    .map((v, i) => ({ v, why: ["counted the non-red tiles", "used one favorable tile", "used the wrong total count"][i] }));
  return {
    q: bi(en, es),
    form: "fraction",
    answer,
    bare: expr,
    simplest: true,
    check: { kind: "expr", expr, role: "answer" },
    wrong,
    hint: "Write favorable outcomes over all possible outcomes, then simplify.",
    explanation: `${favorable} favorable outcomes out of ${total} total outcomes gives ${favorable}/${total}.`,
    steps: ["Count the favorable outcomes.", "Count all possible outcomes.", `The probability is ${favorable}/${total}, simplified.`],
  };
}

function association(ctx) {
  const { rng, type } = ctx;
  const patterns = [
    { label: "positive", values: [1, 2, 3, 4, 5] },
    { label: "negative", values: [5, 4, 3, 2, 1] },
    { label: "none", values: [4, 1, 3, 5, 2] },
  ];
  const pattern = pick(rng, patterns);
  const scale = int(rng, 1, 5);
  const offset = int(rng, 2, 20);
  const xs = [1, 2, 3, 4, 5];
  const ys = pattern.values.map((value) => offset + scale * value);
  const labels = { positive: "positive", negative: "negative", none: "none" };
  const labelsEs = { positive: "positiva", negative: "negativa", none: "ninguna" };
  const answer = labels[pattern.label];
  const check = { kind: "assoc", xs, ys, role: "answer" };
  const en = type === "explain"
    ? `As x increases from ${xs.join(", ")}, y has values ${ys.join(", ")}. What does the pattern show?`
    : `The x-values are ${xs.join(", ")} and the matching y-values are ${ys.join(", ")}. What association do they show?`;
  const es = type === "explain"
    ? `A medida que x aumenta de ${xs.join(", ")}, y toma los valores ${ys.join(", ")}. ¿Qué muestra el patrón?`
    : `Los valores de x son ${xs.join(", ")} y los valores correspondientes de y son ${ys.join(", ")}. ¿Qué asociación muestran?`;
  const options = Object.keys(labels).filter((key) => key !== pattern.label).map((key) => ({
    text: labels[key],
    es: labelsEs[key],
    why: key === "none" ? "describes no consistent trend" : "states the opposite direction of the trend",
  }));
  return {
    q: bi(en, es),
    form: "choice",
    answer,
    answerEs: labelsEs[pattern.label],
    options,
    check,
    hint: "Compare how y changes as the x-values increase.",
    explanation: pattern.label === "none" ? "The values do not move consistently up or down." : `As x increases, y shows a ${pattern.label} association.`,
    steps: ["Read the paired values in order.", "Check whether y generally rises, falls, or has no direction.", `The association is ${pattern.label}.`],
  };
}

function display(ctx) {
  const { rng, level } = ctx;
  const labels = ["Group A", "Group B", "Group C", "Group D"];
  const labelsEs = ["Grupo A", "Grupo B", "Grupo C", "Grupo D"];
  const high = int(rng, 8, 20 + level * 2);
  const values = labels.map(() => int(rng, 1, high - 1));
  const winner = int(rng, 0, labels.length - 1);
  values[winner] = high;
  const tableEn = labels.map((label, i) => `${label}: ${values[i]}`).join(", ");
  const tableEs = labelsEs.map((label, i) => `${label}: ${values[i]}`).join(", ");
  const questionEn = `A data display shows ${tableEn}. Which group has the greatest value?`;
  const questionEs = `Una tabla de datos muestra ${tableEs}. ¿Qué grupo tiene el valor más alto?`;
  return {
    q: bi(questionEn, questionEs),
    form: "choice",
    answer: labels[winner],
    answerEs: labelsEs[winner],
    options: labels.map((label, i) => i).filter((i) => i !== winner).map((i) => ({
      text: labels[i],
      es: labelsEs[i],
      why: "chooses a group with a smaller value",
    })),
    check: { kind: "argmax", values, labels, role: "answer" },
    hint: "Compare the values in the display and locate the greatest one.",
    explanation: `${labels[winner]} has the greatest value, ${high}.`,
    steps: ["Read each group's value.", "Compare the values to find the greatest.", `${labels[winner]} has the greatest value.`],
  };
}

function build(ctx) {
  if (ctx.spec.kind === "coins") return coins(ctx);
  if (ctx.spec.kind === "display") return display(ctx);
  if (ctx.spec.kind === "probability") return probability(ctx);
  return association(ctx);
}

export const family = {
  id: "data",
  skills: SPECS,
  types: {
    compute: build,
    "real-world": build,
    "word-problem": build,
    explain: build,
  },
  range: {},
  supports: {},
};

// One family for the strand skills (strands-*.js): compute, real-world, explain (a tip that fits the problem) and
// the shared error-analysis. A strand generator already returns a bilingual stem, an answer and leak-safe steps; this
// family turns it into a 4.0 draft. A number or fraction answer is typed; an expression, an inequality or an ordered
// list is a four-way choice, because those answers have many equal spellings. Each draft names an independent check
// (tools/lib/pt-checks-strands.mjs), which re-solves the stem text or re-tests equivalence without this code.
import { ES_KID } from "../kid-learn.js";
import { getGrade } from "../problem-bank.js";
import { STRANDS } from "../strands-index.js";
import { STRAND_SKILLS, strandKey } from "../strand-skills.js";
import { readNumber } from "./equivalence.js";
import { bi, shuffle } from "./kit.js";
import { Q } from "./rational.js";

// skill -> one sentence of real context (no digits) that can open the stem; `es` must avoid English words.
const WORLD = {
  "6:order-rational": [
    "A weather club records temperatures and elevations.",
    "Un club del clima anota temperaturas y elevaciones.",
  ],
  "6:percent-whole": [
    "A store sale sign gives a discount as a percent.",
    "Un cartel de oferta da el descuento como un porcentaje.",
  ],
  "6:equivalent-expressions": [
    "A class writes a rule for a pattern two ways.",
    "Una clase escribe una regla de un patrón de dos maneras.",
  ],
  "6:write-inequalities": [
    "A school sign states a rule that a number must meet.",
    "Un letrero de la escuela da una regla que un número debe cumplir.",
  ],
  "6:data-displays": [
    "A class collects data and displays it.",
    "Una clase reúne datos y los muestra en una gráfica.",
  ],
  "6:center-spread": [
    "A class collects data about the books students read.",
    "Una clase reúne datos sobre los libros que leen los estudiantes.",
  ],
  "6:surface-area-nets": [
    "A shop wraps boxes and needs to know how much paper to cut.",
    "Una tienda envuelve cajas y necesita saber cuánto papel cortar.",
  ],
  "6:volume-fractional": [
    "A baker packs boxes and needs to know how much each holds.",
    "Un panadero llena cajas y necesita saber cuánto cabe en cada una.",
  ],
};
export const STRAND_WORLD = WORLD;

for (const d of STRAND_SKILLS) if (d.world) WORLD[strandKey(d)] = d.world;
const SPECS = Object.fromEntries(Object.keys(WORLD).map((key) => [key, {}]));

const unique = (list, key) =>
  list.filter((d, i) => d.text !== key && list.findIndex((o) => o.text === d.text) === i);

// ---- plausible wrong answers ------------------------------------------------------------------------------------
function wrongNumbers(answer) {
  const out = [
    { v: Q(answer.n + answer.d, answer.d), why: "was one too high" },
    answer.n > answer.d
      ? { v: Q(answer.n - answer.d, answer.d), why: "was one too low" }
      : { v: Q(answer.n + 2 * answer.d, answer.d), why: "was two too high" },
    { v: Q(answer.n * 2, answer.d), why: "doubled the result" },
  ];
  return out.filter((w) => !(w.v.n * answer.d === answer.n * w.v.d));
}

const tokenValue = (t) => {
  const r = readNumber(t.replace("−", "-"));
  return r.q ? r.q.n / r.q.d : Number.NaN;
};

// distractors for the choice-form skills: [{ text, why }]
const DISTRACTORS = {
  orderRational(item) {
    const tokens = item.question
      .replace(/^Order from least to greatest: /, "")
      .replace(/\.$/, "")
      .split(", ");
    const key = item.displayAnswer;
    const order = key.split(", ");
    const byAbs = [...tokens].sort((a, b) => Math.abs(tokenValue(a)) - Math.abs(tokenValue(b)));
    const swapped = [...order];
    [swapped[0], swapped[1]] = [swapped[1], swapped[0]];
    const swappedEnd = [...order];
    [swappedEnd[2], swappedEnd[3]] = [swappedEnd[3], swappedEnd[2]];
    return unique(
      [
        { text: [...order].reverse().join(", "), why: "ordered from greatest to least" },
        { text: byAbs.join(", "), why: "ignored the signs and ordered by distance from zero" },
        { text: swapped.join(", "), why: "put the two least numbers in the wrong order" },
        { text: swappedEnd.join(", "), why: "put the two greatest numbers in the wrong order" },
      ],
      key,
    );
  },
  equivalentExpression(item) {
    const q = item.question;
    let m;
    if ((m = q.match(/write (\d+)\(x \+ (\d+)\) without/))) {
      const [a, b] = [Number(m[1]), Number(m[2])];
      return [
        { text: `${a}x + ${b}`, why: "multiplied only the first term" },
        { text: `${a + b}x`, why: "added the numbers instead of multiplying" },
        { text: `${a}x + ${a + b}`, why: "added to the second term instead of multiplying it" },
      ];
    }
    if ((m = q.match(/terms: (\d+)x \+ (\d+) \+ (\d+)x/))) {
      const [a, b, c] = [Number(m[1]), Number(m[2]), Number(m[3])];
      return [
        { text: `${a * c}x + ${b}`, why: "multiplied the coefficients" },
        { text: `${a + b + c}x`, why: "added the number into the x terms" },
        { text: `${a + c}x`, why: "dropped the number term" },
      ];
    }
    if ((m = q.match(/^Factor (\d+)x \+ (\d+) using/))) {
      const [a, b] = [Number(m[1]), Number(m[2])];
      const g = [2, 3, 4, 5, 6, 7, 8, 9].reverse().find((d) => a % d === 0 && b % d === 0) || 1;
      const p = a / g === 1 ? "" : a / g;
      return [
        { text: `${g}(${p}x + ${b})`, why: "divided only the first term" },
        { text: `${g + 1}(${p}x + ${b / g})`, why: "used a number that is not a common factor" },
        {
          text: `${a / g}(${g}x + ${b / g})`,
          why: "wrote the wrong factor outside the parentheses",
        },
      ];
    }
    if ((m = q.match(/^Write (\d+)\(x \+ (\d+)\) \+ (\d+)x/))) {
      const [a, b, c] = [Number(m[1]), Number(m[2]), Number(m[3])];
      return [
        { text: `${a + c}x + ${b}`, why: "did not multiply the second term" },
        { text: `${a * c}x + ${a * b}`, why: "multiplied the x coefficients" },
        { text: `${a + c}x + ${a + b}`, why: "added to the second term instead of multiplying it" },
      ];
    }
    return [];
  },
  likeTerms(item) {
    const m = item.question.match(/: (\d+)x \+ (\d+) ([+−]) (\d+)x ([+−]) (\d+)\.$/);
    if (!m) return [];
    const [a, b, c, d] = [Number(m[1]), Number(m[2]), Number(m[4]), Number(m[6])];
    const minus = m[3] === "−";
    const [x, k] = minus ? [a - c, b - d] : [a + c, b + d];
    const same = (u, v) => u.replace("−", "-") === v.replace("−", "-");
    const show = (cx, kk) => `${cx === 1 ? "" : String(cx).replace("-", "−")}x ${kk < 0 ? "−" : "+"} ${Math.abs(kk)}`;
    return [
      { text: show(a + c + (minus ? 0 : 1), k), why: "one coefficient is off by one" },
      { text: show(x, minus ? b + d : Math.abs(k) + 1), why: "combined the plain numbers with the wrong sign" },
      { text: `${String(x + k).replace("-", "−")}x`, why: "added the plain number into the x-terms" },
      { text: show(minus ? a + c : a - c, k), why: "used the wrong sign when combining the x-terms" },
    ].filter((o) => o.text !== show(x, k) && !same(o.text, item.displayAnswer));
  },
  sciOps(item) {
    return item.choices.filter((c) => c !== item.displayAnswer).map((text) => ({ text, why: "an error with the exponent or the number in front" }));
  },
  compareFunctions(item) {
    const key = item.displayAnswer;
    const out = [];
    if (key !== "A") out.push({ text: "A", why: "compared the y-intercepts instead of the rates of change" });
    if (key !== "B") out.push({ text: "B", why: "compared the y-intercepts instead of the rates of change" });
    if (key !== "The rates are equal") out.push({ text: "The rates are equal", es: "Las razones de cambio son iguales", why: "decided the rates match without finding both" });
    return out;
  },
  writeInequality(item) {
    const key = item.displayAnswer;
    const [v, op, n] = key.split(" ");
    const flip = { "≥": "≤", "≤": "≥", ">": "<", "<": ">" };
    const toggle = { "≥": ">", ">": "≥", "≤": "<", "<": "≤" };
    return [
      { text: `${v} ${toggle[op]} ${n}`, why: "got the boundary wrong: whether it is included" },
      { text: `${v} ${flip[op]} ${n}`, why: "pointed the symbol the wrong way" },
      {
        text: `${v} ${flip[toggle[op]]} ${n}`,
        why: "got both the direction and the boundary wrong",
      },
    ];
  },
};

function formOf(item) {
  const text = item.displayAnswer;
  if (item.kind === "fraction")
    return /^\d+ \d+\/\d+$/.test(text) ? "mixed" : text.includes("/") ? "fraction" : "int";
  if (item.kind === "text" && /^\d+ \d+\/\d+$/.test(item.displayAnswer)) return "mixed";
  if (item.kind === "text" && /^\d+\/\d+$/.test(item.displayAnswer)) return "fraction";
  if (item.kind === "text" && /^\(-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?\)$/.test(item.displayAnswer)) return "point";
  if (item.kind !== "number") return "choice";
  return text.includes(".") ? "decimal" : "int";
}

// the plain stem every check re-solves, and the draft for it
function draftFor(ctx, world) {
  const { rng, level, skill } = ctx;
  const key = `${skill.grade}:${skill.id}`;
  const make = STRANDS[skill.generator];
  if (!make) throw new Error(`no strand generator ${skill.generator}`);
  const item = make({ ...skill.config, scaffolded: level <= 2 }, rng);
  if (!item.questionEs) throw new Error("strand item has no Spanish");
  const [worldEn, worldEs] = world ? WORLD[key] : ["", ""];
  const q = bi(
    `${worldEn ? `${worldEn} ` : ""}${item.question}`,
    `${worldEs ? `${worldEs} ` : ""}${item.questionEs}`,
  );
  const form = formOf(item);
  const steps = item.steps.length >= 2 ? item.steps : [item.hint, ...item.steps];
  const base = { q, hint: item.hint, steps, bare: undefined };
  if (form === "choice") {
    const options = DISTRACTORS[skill.generator]?.(item) || [];
    if (options.length < 2) throw new Error("no distractors");
    const chosen = shuffle(rng, options).slice(0, 3);
    const check =
      skill.generator === "equivalentExpression"
        ? { kind: "equivalent", a: item.work.start, b: item.displayAnswer, role: "answer" }
        : { kind: "stem", stem: item.question, role: "answer" };
    return { ...base, form: "choice", answer: item.displayAnswer, answerEs: item.displayAnswer, options: chosen.map((o) => ({ ...o, es: o.es || o.text })), check };
  }
  if (form === "point") {
    const [px, py] = item.displayAnswer.slice(1, -1).split(",").map((v) => readNumber(v.trim()).q);
    return {
      ...base,
      form: "point",
      answer: [px, py],
      check: { kind: "stem", stem: item.question, role: "answer" },
      wrong: [
        { v: [py, px], why: "swapped the x- and y-coordinates" },
        { v: [Q(-px.n, px.d), Q(-py.n, py.d)], why: "changed both signs" },
        { v: [Q(px.n + px.d, px.d), py], why: "was one off in the x-coordinate" },
      ].filter((w) => !(w.v[0].n * px.d === px.n * w.v[0].d && w.v[1].n * py.d === py.n * w.v[1].d)),
    };
  }
  const answer = readNumber(item.displayAnswer.replace("−", "-")).q;
  if (!answer) throw new Error(`unreadable answer ${item.displayAnswer}`);
  const draft = {
    ...base,
    form,
    answer,
    check: { kind: "stem", stem: item.question, role: "answer" },
    wrong: wrongNumbers(answer),
  };
  if (item.kind === "text") draft.accept = [form];
  if (item.unit) {
    draft.unit = item.unit;
    draft.units = [item.unit];
  }
  return draft;
}

const compute = (ctx) => draftFor(ctx, false);
const realWorld = (ctx) => draftFor(ctx, true);

// explain: which reminder fits this problem? The key is this skill's own watch-out line; the others belong to
// other skills of the grade.
const digitsOf = (text) => (String(text || "").match(/\d+/g) || []).join(",");
const sameDigits = (en, es) => Boolean(es) && digitsOf(en) === digitsOf(es);

function explain(ctx) {
  const { rng, skill } = ctx;
  const mine = skill.learn.watch;
  const others = getGrade(skill.grade)
    .skills.filter((s) => s.id !== skill.id && s.learn.watch !== mine && sameDigits(s.learn.watch, ES_KID[s.learn.watch]))
    .map((s) => s.learn.watch);
  if (!ES_KID[mine] || others.length < 2) throw new Error("no reminders to compare");
  const chosen = shuffle(rng, others).slice(0, 2);
  const make = STRANDS[skill.generator];
  const item = make({ ...skill.config, scaffolded: ctx.level <= 2 }, rng);
  return {
    q: bi(
      `${item.question} Which reminder helps most with this problem?`,
      `${item.questionEs} ¿Qué recordatorio ayuda más con este problema?`,
    ),
    form: "choice",
    answer: mine,
    answerEs: ES_KID[mine],
    options: chosen.map((text) => ({
      text,
      es: ES_KID[text],
      why: "a reminder for a different skill",
    })),
    check: { kind: "stem", stem: item.question },
    hint: skill.learn.rule,
    steps: [
      "Read what the problem asks you to do.",
      "Pick the reminder that is about this kind of problem.",
      mine,
    ],
    explanation: mine,
  };
}

export const family = {
  id: "strands",
  skills: SPECS,
  types: { compute, "real-world": realWorld, explain },
  range: { "real-world": [1, 5], explain: [1, 5] },
};

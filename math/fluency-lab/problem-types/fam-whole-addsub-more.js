// Whole-number addition and subtraction, continued: word problems (story-problems.js), richer real-world
// stories, "which equation fits", multi-step stories and explanations. Types plug into fam-whole-addsub.js.
import { storyFor } from "../story-problems.js";
import { bi, fmt, int, pick } from "./kit.js";
import { Q } from "./rational.js";
import { carries, drawPair, expr, result, stem, stepsFor } from "./whole-core.js";
import { scenarioFor } from "./whole-stories.js";

const opFor = (rng, spec) => pick(rng, spec.ops);

function wordProblem({ rng, level, spec }) {
  const op = opFor(rng, spec);
  const [a, b] = drawPair(rng, spec, op, ["none", "one", "any"][level - 1]);
  const c = result(op, a, b);
  const base = { kind: "number", question: stem(a, op, b), answers: [String(c)], steps: stepsFor(op, a, b, c) };
  const story = storyFor(base, rng);
  if (!story) throw new Error("no story for these numbers");
  return {
    q: bi(story.question, story.questionEs),
    form: "int",
    answer: Q(c),
    bare: story.expr,
    check: [{ kind: "expr", expr: expr(a, op, b), role: "answer" }],
    wrong: [
      { v: Q(op === "add" ? Math.abs(a - b) : a + b), why: op === "add" ? "subtracted instead of adding" : "added instead of subtracting" },
      { v: Q(c + 1), why: "counted one too many" },
      { v: Q(Math.max(0, c - 1)), why: "counted one too few" },
    ],
    steps: story.steps,
  };
}

const scenarioDraft = (type) => ({ rng, level, spec }) => {
  const op = opFor(rng, spec);
  const s = scenarioFor(rng, spec, op, level);
  const units = [s.thing.en, s.thing.es];
  if (type === "real-world")
    return { q: bi(s.en, s.es), form: "int", answer: Q(s.answer), units, check: [s.check], wrong: s.wrong, steps: s.steps };
  const { key, others } = s.eq;
  const asCheck = (e, role) => ({ kind: "solve", var: "x", lhs: e.lhs, rhs: e.rhs, role });
  return {
    q: bi(`${s.en} Which equation can you use to solve the problem?`, `${s.es} ¿Qué ecuación puedes usar para resolver el problema?`),
    form: "choice",
    answer: key.text,
    options: others.map((o) => ({ text: o.text, why: o.why })),
    meta: { value: String(s.answer) },
    check: [asCheck(key, "key"), ...others.map((o) => asCheck(o, "distractor"))],
    steps: ["Decide what the story says: is an amount joined, taken away, compared, or missing?", "Pick the equation whose numbers and operation match what happens in the story.", `The equation is ${key.text}.`],
  };
};

// Two or three connected steps in one story.
function multiStep({ rng, level, spec }) {
  const names = ["Mia", "Jamal", "Sofía", "Wei", "Amara", "Diego"];
  const who = pick(rng, names);
  const mixed = spec.ops.includes("add");
  for (let i = 0; i < 300; i += 1) {
    const [a, b] = drawPair(rng, spec, mixed ? "add" : "sub", "any");
    const c = int(rng, spec.lo, spec.hi);
    const d = int(rng, spec.lo, spec.hi);
    if (mixed) {
      const x = a + b;
      if (c >= x) continue;
      if (level <= 3) {
        const r = x - c;
        return build(`${who} has ${fmt(a)} stickers and gets ${fmt(b)} more. Then ${who} gives ${fmt(c)} stickers to a friend. How many stickers does ${who} have now?`, `${who} tiene ${fmt(a)} calcomanías y recibe ${fmt(b)} más. Luego ${who} le da ${fmt(c)} calcomanías a un amigo. ¿Cuántas calcomanías tiene ${who} ahora?`, r, `(${a}+${b})-${c}`, [{ v: Q(x), why: "stopped before giving stickers away" }, { v: Q(x + c), why: "added the stickers given away" }, { v: Q(a - c), why: "ignored the stickers that were gained" }], [`Do the story in order. First ${who} gains stickers: ${fmt(a)} + ${fmt(b)}.`, `Then ${who} gives some away, so take ${fmt(c)} from that number.`, `${fmt(a)} + ${fmt(b)} − ${fmt(c)} = ${fmt(r)}.`]);
      }
      const r = level === 4 ? x - c + d : x - c - d;
      if (r < 1 || x - c + d > spec.top || (level === 5 && x - c - d < 1)) continue;
      const text = level === 4 ? [`${who} has ${fmt(a)} marbles and wins ${fmt(b)}. ${who} loses ${fmt(c)}, then wins ${fmt(d)} more. How many marbles does ${who} have now?`, `${who} tiene ${fmt(a)} canicas y gana ${fmt(b)}. ${who} pierde ${fmt(c)} y luego gana ${fmt(d)} más. ¿Cuántas canicas tiene ${who} ahora?`] : [`${who} has ${fmt(a)} marbles and wins ${fmt(b)}. ${who} loses ${fmt(c)}, then loses ${fmt(d)} more. How many marbles does ${who} have now?`, `${who} tiene ${fmt(a)} canicas y gana ${fmt(b)}. ${who} pierde ${fmt(c)} y luego pierde ${fmt(d)} más. ¿Cuántas canicas tiene ${who} ahora?`];
      return build(text[0], text[1], r, level === 4 ? `${a}+${b}-${c}+${d}` : `${a}+${b}-${c}-${d}`, [{ v: Q(x - c), why: "stopped after two steps" }, { v: Q(level === 4 ? x - c - d : x - c + d), why: "used the wrong direction for the last step" }, { v: Q(x + c + d), why: "added every amount" }], [`Follow the story one event at a time, in order.`, `Wins add. Losses subtract. Keep a running total: ${fmt(a)}, then ${fmt(x)}, then ${fmt(x - c)}.`, `The final total is ${fmt(r)}.`]);
    }
    const x = a - b;
    if (x < 2 || c >= x) continue;
    const r = x - c;
    if (level === 5 && (r < 2 || d >= r)) continue;
    const answer = level === 5 ? r - d : r;
    return build(
      level <= 3 ? `A jar holds ${fmt(a)} beads. ${who} takes out ${fmt(b)}, then takes out ${fmt(c)} more. How many beads are left?` : `A jar holds ${fmt(a)} beads. ${who} takes out ${fmt(b)}, then ${fmt(c)} more, ${level === 5 ? `then ${fmt(d)} more` : "and the rest are shared"}. How many beads are left in the jar?`,
      level <= 3 ? `Un frasco tiene ${fmt(a)} cuentas. ${who} saca ${fmt(b)} y luego saca ${fmt(c)} más. ¿Cuántas cuentas quedan?` : `Un frasco tiene ${fmt(a)} cuentas. ${who} saca ${fmt(b)}, luego ${fmt(c)} más${level === 5 ? `, luego ${fmt(d)} más` : " y el resto se reparte"}. ¿Cuántas cuentas quedan en el frasco?`,
      level === 5 ? answer : r,
      level === 5 ? `${a}-${b}-${c}-${d}` : `${a}-${b}-${c}`,
      [{ v: Q(x), why: "stopped after the first removal" }, { v: Q(level === 5 ? r : x + c), why: level === 5 ? "stopped before the last removal" : "added the second removal" }, { v: Q(a - c), why: "ignored the first removal" }],
      [`Each time beads come out, subtract. Do the removals in order.`, `After the first removal there are ${fmt(x)} left. Then take out ${fmt(c)} more.`, `The number left is ${fmt(level === 5 ? answer : r)}.`],
    );
  }
  throw new Error("multi-step numbers");
}
const build = (en, es, answer, expression, wrong, steps) => ({
  q: bi(en, es),
  form: "int",
  answer: Q(answer),
  check: [{ kind: "expr", expr: expression, role: "answer" }],
  wrong: wrong.filter((w) => w.v.n >= 0 && w.v.n !== answer),
  steps,
});

// ---------- explain: choose the best mathematical explanation ----------
const claim = (expression, value) => ({ kind: "expr", expr: expression, value: String(value) });
function choice(en, es, key, others, facts, steps) {
  return {
    q: bi(en, es),
    form: "choice",
    answer: key.en,
    answerEs: key.es,
    options: others.map((o) => ({ text: o.en, es: o.es, why: o.why })),
    check: facts,
    steps,
  };
}

const EXPLAIN = {
  makeTen(rng, spec) {
    for (let i = 0; i < 200; i += 1) {
      const [a, b] = drawPair(rng, spec, "add", "any");
      if (a >= 10 || b > 10 || a + b <= 10) continue;
      const [need, rest, c] = [10 - a, b - (10 - a), a + b];
      return choice(
        `Mia solved ${a} + ${b} by making a ten first. Which explanation shows why her way works?`,
        `Mia resolvió ${a} + ${b} formando una decena primero. ¿Qué explicación muestra por qué funciona su manera?`,
        { en: `${a} needs ${need} more to make 10. Split ${b} into ${need} and ${rest}. Then 10 + ${rest} = ${c}.`, es: `${a} necesita ${need} más para formar 10. Separa ${b} en ${need} y ${rest}. Luego 10 + ${rest} = ${c}.` },
        [
          { en: `Write ${a} next to ${b} to get ${a}${b}.`, es: `Escribe ${a} junto a ${b} para formar ${a}${b}.`, why: "joins the digits instead of adding" },
          { en: `Take ${need} away from ${a} to make 10, then add ${b}.`, es: `Quita ${need} de ${a} para formar 10 y luego suma ${b}.`, why: "takes the amount from the wrong number" },
          { en: `Add ${need} more to ${b} to make 10, then add ${a}.`, es: `Suma ${need} más a ${b} para formar 10 y luego suma ${a}.`, why: "adds extra instead of moving part of a number" },
        ],
        [claim(`${a}+${need}`, 10), claim(`${need}+${rest}`, b), claim(`10+${rest}`, c)],
        ["Look for the number that is close to 10.", "A ten is easier to add. Move just enough from the other number to make it.", `${a} + ${b} = 10 + ${rest}.`],
      );
    }
    throw new Error("makeTen");
  },
  countOn(rng, spec) {
    const [a, b] = drawPair(rng, spec, "add", "none");
    const c = a + b;
    return choice(
      `Which explanation shows how to count on to solve ${a} + ${b}?`,
      `¿Qué explicación muestra cómo contar hacia adelante para resolver ${a} + ${b}?`,
      { en: `Start at ${a}. Count on ${b} more numbers. You stop at ${c}.`, es: `Empieza en ${a}. Cuenta ${b} números más. Te detienes en ${c}.` },
      [
        { en: `Start at ${a} and count ${a} as the first of the ${b} numbers. You stop at ${c - 1}.`, es: `Empieza en ${a} y cuenta ${a} como el primero de los ${b} números. Te detienes en ${c - 1}.`, why: "counts the starting number as a count (off by one)" },
        { en: `Start at ${b}. Count back ${a} numbers.`, es: `Empieza en ${b}. Cuenta hacia atrás ${a} números.`, why: "counts back, which subtracts" },
        { en: `Start at ${a}. Count on ${b + 1} numbers. You stop at ${c + 1}.`, es: `Empieza en ${a}. Cuenta ${b + 1} números. Te detienes en ${c + 1}.`, why: "counts one extra number" },
      ],
      [claim(`${a}+${b}`, c), claim(`${a}+${b}-1`, c - 1), claim(`${a}+${b}+1`, c + 1)],
      [`Start at the first number: ${a}.`, `Say one number for each of the ${b} that are added.`, `${a} + ${b} = ${c}.`],
    );
  },
  carry(rng, spec) {
    const [a, b] = drawPair(rng, spec, "add", "one", (p, q) => (p % 10) + (q % 10) >= 10 && carries(p, q) >= 1);
    if ((a % 10) + (b % 10) < 10) throw new Error("no ones carry");
    const [x, y] = [a % 10, b % 10];
    const s = x + y;
    return choice(
      `Why do we regroup when we add ${fmt(a)} + ${fmt(b)}?`,
      `¿Por qué reagrupamos cuando sumamos ${fmt(a)} + ${fmt(b)}?`,
      { en: `The ones make ${x} + ${y} = ${s}, which is 1 ten and ${s - 10} ones. The ten moves to the tens place.`, es: `Las unidades suman ${x} + ${y} = ${s}, que es 1 decena y ${s - 10} unidades. La decena pasa al lugar de las decenas.` },
      [
        { en: `The ones make ${s}. Write ${s} in the ones place.`, es: `Las unidades suman ${s}. Escribe ${s} en el lugar de las unidades.`, why: "puts two digits in one place" },
        { en: `Carry 1 to the ones place so the ones become ${s + 1}.`, es: `Lleva 1 al lugar de las unidades para que las unidades sean ${s + 1}.`, why: "carries to the wrong place" },
        { en: `We regroup only when the whole sum is more than 100.`, es: `Solo reagrupamos cuando toda la suma pasa de 100.`, why: "uses a wrong rule for regrouping" },
      ],
      [claim(`${x}+${y}`, s), claim(`${s}-10`, s - 10)],
      ["Add the ones place first.", "A place can hold only one digit, from 0 to 9.", `${x} + ${y} = ${s}: a ten moves left.`],
    );
  },
  compensate(rng, spec) {
    for (let i = 0; i < 200; i += 1) {
      const [a, b] = drawPair(rng, spec, "add", "any");
      const k = int(rng, 1, Math.min(9, b - 1));
      if (k < 1) continue;
      return choice(
        `Which explanation shows why ${fmt(a)} + ${fmt(b)} = ${fmt(a + k)} + ${fmt(b - k)}?`,
        `¿Qué explicación muestra por qué ${fmt(a)} + ${fmt(b)} = ${fmt(a + k)} + ${fmt(b - k)}?`,
        { en: `Moving ${k} from ${fmt(b)} to ${fmt(a)} changes the parts but not the total.`, es: `Pasar ${k} de ${fmt(b)} a ${fmt(a)} cambia las partes pero no el total.` },
        [
          { en: `Adding ${k} to both numbers keeps the total the same.`, es: `Sumar ${k} a los dos números mantiene el mismo total.`, why: "adds the amount twice, so the total grows" },
          { en: `Taking ${k} away from both numbers keeps the total the same.`, es: `Quitar ${k} a los dos números mantiene el mismo total.`, why: "removes the amount twice, so the total shrinks" },
          { en: `The sums match because ${fmt(a)} and ${fmt(a + k)} are close to each other.`, es: `Las sumas son iguales porque ${fmt(a)} y ${fmt(a + k)} están cerca.`, why: "gives a reason that does not use the amount moved" },
        ],
        [claim(`${a}+${b}`, a + b), claim(`${a + k}+${b - k}`, a + b), claim(`(${a}+${k})+(${b}+${k})`, a + b + 2 * k)],
        ["Compare the two sums part by part.", "One part goes up and the other goes down by the same amount.", "The total is unchanged."],
      );
    }
    throw new Error("compensate");
  },
  commute(rng, spec) {
    const [a, b] = drawPair(rng, spec, "add", "any");
    return choice(
      `Which statement explains why ${fmt(a)} + ${fmt(b)} = ${fmt(b)} + ${fmt(a)}?`,
      `¿Qué enunciado explica por qué ${fmt(a)} + ${fmt(b)} = ${fmt(b)} + ${fmt(a)}?`,
      { en: `Adding puts the same two groups together, and the order does not change how many there are.`, es: `Sumar junta los mismos dos grupos, y el orden no cambia cuántos hay.` },
      [
        { en: `Subtraction works the same way, so order never matters.`, es: `La resta funciona igual, así que el orden nunca importa.`, why: "wrongly says order never matters for subtraction" },
        { en: `Both sums are equal only because ${fmt(a)} is bigger than ${fmt(b)}.`, es: `Las dos sumas son iguales solo porque ${fmt(a)} es mayor que ${fmt(b)}.`, why: "uses a reason that depends on which number is bigger" },
        { en: `Both sums are equal because they end in the same digit.`, es: `Las dos sumas son iguales porque terminan en el mismo dígito.`, why: "gives a result of the equality, not a reason" },
      ],
      [claim(`${a}+${b}`, a + b), claim(`${b}+${a}`, a + b)],
      ["Picture two groups of objects.", "Joining group one to group two gives the same count as joining group two to group one.", "Order does not change a sum."],
    );
  },
  countBack(rng, spec) {
    const [a, b] = drawPair(rng, spec, "sub", "none");
    const c = a - b;
    return choice(
      `Which explanation shows how to count back to solve ${a} − ${b}?`,
      `¿Qué explicación muestra cómo contar hacia atrás para resolver ${a} − ${b}?`,
      { en: `Start at ${a}. Count back ${b} numbers. You stop at ${c}.`, es: `Empieza en ${a}. Cuenta hacia atrás ${b} números. Te detienes en ${c}.` },
      [
        { en: `Start at ${a} and count ${a} as the first of the ${b} numbers. You stop at ${c + 1}.`, es: `Empieza en ${a} y cuenta ${a} como el primero de los ${b} números. Te detienes en ${c + 1}.`, why: "counts the starting number as a count (off by one)" },
        { en: `Start at ${a}. Count on ${b} numbers. You stop at ${a + b}.`, es: `Empieza en ${a}. Cuenta ${b} números hacia adelante. Te detienes en ${a + b}.`, why: "counts on, which adds" },
        { en: `Start at ${b}. Count back ${a} numbers.`, es: `Empieza en ${b}. Cuenta hacia atrás ${a} números.`, why: "swaps the two numbers" },
      ],
      [claim(`${a}-${b}`, c), claim(`${a}-${b}+1`, c + 1), claim(`${a}+${b}`, a + b)],
      [`Start at the whole: ${a}.`, `Say one number back for each of the ${b} that are taken away.`, `${a} − ${b} = ${c}.`],
    );
  },
  check(rng, spec) {
    const [a, b] = drawPair(rng, spec, "sub", "any");
    const c = a - b;
    return choice(
      `Why can you check ${fmt(a)} − ${fmt(b)} = ${fmt(c)} by adding ${fmt(c)} + ${fmt(b)}?`,
      `¿Por qué puedes comprobar ${fmt(a)} − ${fmt(b)} = ${fmt(c)} sumando ${fmt(c)} + ${fmt(b)}?`,
      { en: `Subtraction undoes addition. Putting the ${fmt(b)} back onto what was left should make ${fmt(a)} again.`, es: `La resta deshace la suma. Si devuelves los ${fmt(b)} a lo que quedó, debes volver a tener ${fmt(a)}.` },
      [
        { en: `Adding is easier than subtracting, so it always gives the same number as the subtraction.`, es: `Sumar es más fácil que restar, así que siempre da el mismo número que la resta.`, why: "says the sum equals the difference" },
        { en: `Both ${fmt(c)} and ${fmt(b)} are smaller than ${fmt(a)}, so they can be added.`, es: `${fmt(c)} y ${fmt(b)} son menores que ${fmt(a)}, así que se pueden sumar.`, why: "gives a reason that has nothing to do with undoing" },
        { en: `The minus sign turns into a plus sign, so ${fmt(c)} + ${fmt(b)} makes ${fmt(c)}.`, es: `El signo menos se vuelve signo más, así que ${fmt(c)} + ${fmt(b)} da ${fmt(c)}.`, why: "treats the sign as changing the answer" },
      ],
      [claim(`${c}+${b}`, a), claim(`${a}-${b}`, c)],
      ["Subtraction and addition are opposites.", "If you take a part away and then put it back, you return to the start.", `${c} + ${b} = ${a}.`],
    );
  },
  borrow(rng, spec) {
    const [a, b] = drawPair(rng, spec, "sub", "one", (p, q) => (p % 10) < (q % 10) && p >= 20);
    const [x, y] = [a % 10, b % 10];
    if (!(x < y)) throw new Error("no borrow");
    return choice(
      `Why do we regroup 1 ten when we subtract ${fmt(a)} − ${fmt(b)}?`,
      `¿Por qué reagrupamos 1 decena cuando restamos ${fmt(a)} − ${fmt(b)}?`,
      { en: `There are only ${x} ones, and ${y} ones are taken away. Trade 1 ten for 10 ones, so ${x} ones become ${x + 10} ones.`, es: `Solo hay ${x} unidades y se quitan ${y}. Cambia 1 decena por 10 unidades, así que ${x} unidades se vuelven ${x + 10} unidades.` },
      [
        { en: `${x} is smaller than ${y}, so subtract ${x} from ${y} instead.`, es: `${x} es menor que ${y}, así que resta ${x} de ${y}.`, why: "subtracts the smaller digit from the larger" },
        { en: `Start with the tens place, because it is the biggest place.`, es: `Empieza por el lugar de las decenas, porque es el lugar más grande.`, why: "gives a reason that does not fix the ones" },
        { en: `Add 10 to the ones, and leave the tens the same.`, es: `Suma 10 a las unidades y deja las decenas igual.`, why: "adds ten without taking it from the tens" },
      ],
      [claim(`${x}+10`, x + 10), claim(`${x}-${y}`, x - y)],
      ["Look at the ones place first.", "You cannot take more ones than there are, so a ten must be broken into ones.", `${x} ones become ${x + 10} ones, and the tens go down by 1.`],
    );
  },
  sameDiff(rng, spec) {
    const [a, b] = drawPair(rng, spec, "sub", "any");
    const k = int(rng, 1, 9);
    return choice(
      `Why does ${fmt(a)} − ${fmt(b)} = ${fmt(a + k)} − ${fmt(b + k)}?`,
      `¿Por qué ${fmt(a)} − ${fmt(b)} = ${fmt(a + k)} − ${fmt(b + k)}?`,
      { en: `Adding the same ${k} to both numbers keeps the distance between them the same, so the difference does not change.`, es: `Sumar el mismo ${k} a los dos números mantiene igual la distancia entre ellos, así que la diferencia no cambia.` },
      [
        { en: `Adding ${k} to both numbers makes the difference ${k} bigger.`, es: `Sumar ${k} a los dos números hace la diferencia ${k} más grande.`, why: "thinks the difference grows when both numbers grow" },
        { en: `Adding ${k} to ${fmt(a)} and taking ${k} from ${fmt(b)} keeps the difference the same.`, es: `Sumar ${k} a ${fmt(a)} y quitar ${k} a ${fmt(b)} mantiene la misma diferencia.`, why: "moves the numbers in opposite directions, which changes the difference" },
        { en: `The differences match because both numbers get larger.`, es: `Las diferencias son iguales porque los dos números se hacen más grandes.`, why: "gives a reason that does not name the equal change" },
      ],
      [claim(`${a}-${b}`, a - b), claim(`${a + k}-${b + k}`, a - b), claim(`${a + k}-${b}`, a - b + k)],
      ["Compare how far apart the numbers are.", "Both numbers move up by the same amount, so the gap stays the same.", "The gap is the difference."],
    );
  },
};

const PLAN = {
  add: (spec, level) => {
    const small = spec.top <= 20;
    return { 1: small ? ["makeTen", "countOn"] : ["carry", "compensate"], 2: small ? ["makeTen", "countOn"] : ["carry", "compensate"], 3: small ? ["makeTen", "countOn"] : ["carry"], 4: ["compensate"], 5: ["commute"] }[level];
  },
  sub: (spec, level) => {
    const small = spec.top <= 20;
    return { 1: small ? ["countBack"] : ["check"], 2: small ? ["countBack"] : ["check"], 3: ["check"], 4: ["borrow", "check"], 5: ["sameDiff"] }[level];
  },
};

function explain({ rng, level, spec }) {
  const op = opFor(rng, spec);
  let lastError = null;
  for (const name of PLAN[op](spec, level)) {
    try {
      return EXPLAIN[name](rng, spec);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

export const EXTRA_TYPES = {
  "word-problem": wordProblem,
  "real-world": scenarioDraft("real-world"),
  equation: scenarioDraft("equation"),
  "multi-step": multiStep,
  explain,
};

// Hints. Tier 0 nudges the first probe, tier 1 names a strategy, tier 2 works a PARALLEL example with other numbers,
// and tier 3 (the Show me button) states the whole solution. Tiers 0-2 never state the rule or the faraway answer:
// each example is rebuilt with different numbers until neither the answer nor the rule appears in it.
// @fm2 FM-062 FM-059
import { L } from "../../lang.js";
import { UI } from "./copy.js";
import { quantity } from "./copy-prompts.js";
import { answerString, specText } from "./rules.js";

const two = (en, es) => ({ en, es });

const KIND = (round) =>
  round.form === "cycle"
    ? "cycle"
    : round.form === "two"
      ? "two"
      : round.form === "typed"
        ? "typed"
        : round.form === "seq"
          ? "seq"
          : "machine";

const TIER0 = {
  cycle: two(
    "Reveal the cells next to the ones you can already see, and say the shapes out loud in order.",
    "Descubre las casillas que siguen a las que ya ves y di las figuras en voz alta, en orden.",
  ),
  seq: two(
    "Ask for the first terms of the pattern, one after another, and write each one in your clue table.",
    "Pide los primeros términos del patrón, uno tras otro, y anota cada uno en tu tabla de pistas.",
  ),
  machine: two(
    "Probe a small input first, then a different one. Write what comes out in your clue table.",
    "Prueba primero una entrada pequeña y luego otra distinta. Anota lo que sale en tu tabla de pistas.",
  ),
  typed: two(
    "Probe a few inputs in a row, like the first three, and write what comes out in your clue table.",
    "Prueba unas cuantas entradas seguidas, como las tres primeras, y anota lo que sale en tu tabla de pistas.",
  ),
  two: two(
    "Probe both machines at the same input, then at the next input, and compare what each one gives.",
    "Prueba las dos máquinas con la misma entrada y luego con la siguiente, y compara lo que da cada una.",
  ),
};

const TIER1 = {
  cycle: two(
    "Look for a group of shapes that starts over again and again. That group is the core. Keep revealing cells until you see it come back.",
    "Busca un grupo de figuras que empieza de nuevo una y otra vez. Ese grupo es el núcleo. Sigue descubriendo casillas hasta verlo volver.",
  ),
  seq: two(
    "Compare each term with the one before it. Is the same number added every time, or is the term multiplied? Ask for one more term to check your idea.",
    "Compara cada término con el anterior. ¿Se suma siempre el mismo número o se multiplica el término? Pide un término más para comprobar tu idea.",
  ),
  machine: two(
    "See how the output changes when the input goes up by one. If it jumps by the same amount each time, that amount tells you what the input is multiplied by. Then see what is left over.",
    "Mira cómo cambia la salida cuando la entrada sube una unidad. Si salta la misma cantidad cada vez, esa cantidad te dice por cuánto se multiplica la entrada. Luego mira qué sobra.",
  ),
  typed: two(
    "Subtract to find how the outputs change from one input to the next. If the changes are equal, the function is linear. If they grow, look at how they grow.",
    "Resta para ver cómo cambian las salidas de una entrada a la siguiente. Si los cambios son iguales, la función es lineal. Si crecen, mira cómo crecen.",
  ),
  two: two(
    "For each machine, find where it starts and how much it grows each step. Then compare a B term with the A term at the same step.",
    "En cada máquina, halla dónde empieza y cuánto crece en cada paso. Luego compara un término B con el término A del mismo paso.",
  ),
};

// Does the text state the answer as a standalone number or word?
export function leaks(text, answer) {
  const a = String(answer).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^0-9A-Za-z])${a}($|[^0-9A-Za-z])`, "i").test(text);
}
const squash = (text) => text.replace(/[\s×*]/g, "");

function leakInfo(round) {
  const answers = [answerString(round)];
  const rules = round.machines.map((m) => squash(specText(m.spec, round.vars)));
  return { answers, rules };
}

// Build an example with parameter offset k until it names neither the answer nor the hidden rule.
function guarded(round, build) {
  const { answers, rules } = leakInfo(round);
  const names = round.form === "cycle" ? [answers[0], L(UI.symbols[answers[0]], "es")] : answers;
  for (let k = 0; k < 60; k += 1) {
    const out = build(k);
    const texts = [out.en, out.es];
    const bad = texts.some(
      (t) =>
        names.some((n) => leaks(t, n)) || rules.some((r) => r.length > 2 && squash(t).includes(r)),
    );
    if (!bad) return out;
  }
  return build(61);
}

const seedOf = (round) =>
  round.machines.reduce(
    (n, m) => n + JSON.stringify(m.spec).length + (m.spec.a?.[0] || 0) + (m.spec.c?.[0] || 0),
    round.far,
  );

function machineExample(round, k) {
  const s = seedOf(round);
  const a = 2 + ((s + k) % 6);
  const b = 1 + ((s * 3 + k * 5) % 6);
  const p = 2 + ((s + k * 2) % 3);
  const v = round.vars;
  return two(
    `Example machine: when the input is ${p} the output is ${p * a + b}, and when the input is ${p + 1} the output is ${(p + 1) * a + b}. The output goes up by ${a} when the input goes up by one, so the machine multiplies by ${a}. Check: ${p} × ${a} = ${p * a}, and ${p * a + b} is ${b} more, so that machine's rule is ${a} × ${v} + ${b}.`,
    `Máquina de ejemplo: cuando la entrada es ${p} la salida es ${p * a + b}, y cuando la entrada es ${p + 1} la salida es ${(p + 1) * a + b}. La salida sube ${a} cuando la entrada sube una unidad, así que la máquina multiplica por ${a}. Comprueba: ${p} × ${a} = ${p * a}, y ${p * a + b} es ${b} más, así que la regla de esa máquina es ${a} × ${v} + ${b}.`,
  );
}

function seqExample(round, k) {
  const s = seedOf(round);
  const start = 2 + ((s + k) % 7);
  const d = 2 + ((s * 2 + k) % 6);
  const r = 2 + ((s + k * 3) % 3);
  const m = 5 + ((s + k * 2) % 5);
  const add = two(
    `Adding example: the terms ${start}, ${start + d}, ${start + 2 * d} go up by ${d} each time, so the pattern starts at ${start} and adds ${d} every step. After ${m} steps it reaches ${start} + ${m} × ${d} = ${start + m * d}.`,
    `Ejemplo que suma: los términos ${start}, ${start + d}, ${start + 2 * d} suben ${d} cada vez, así que el patrón empieza en ${start} y suma ${d} en cada paso. Después de ${m} pasos llega a ${start} + ${m} × ${d} = ${start + m * d}.`,
  );
  const mul = two(
    `Multiplying example: the terms ${start}, ${start * r}, ${start * r * r} are multiplied by ${r} each time. Four steps after the start it reaches ${start} × ${r} × ${r} × ${r} × ${r} = ${start * r ** 4}.`,
    `Ejemplo que multiplica: los términos ${start}, ${start * r}, ${start * r * r} se multiplican por ${r} cada vez. Cuatro pasos después del inicio llega a ${start} × ${r} × ${r} × ${r} × ${r} = ${start * r ** 4}.`,
  );
  if (round.say.op === "add") return add;
  if (round.say.op === "mul") return mul;
  return two(`${add.en} ${mul.en}`, `${add.es} ${mul.es}`);
}

function typedExample(round, k) {
  const s = seedOf(round);
  const a = 1 + ((s + k) % 5);
  const d = 2 + ((s + k * 2) % 4);
  const c = ((s + k * 3) % 5) + 1;
  const u = 2 + ((s + k) % 4);
  return two(
    `Example: outputs ${a}, ${a + d}, ${a + 2 * d} change by ${d} every time, so that function is linear. Outputs ${c}, ${c + u}, ${c + 4 * u}, ${c + 9 * u} change by ${u}, ${3 * u}, ${5 * u}: the changes keep growing, so that function is not linear.`,
    `Ejemplo: las salidas ${a}, ${a + d}, ${a + 2 * d} cambian ${d} cada vez, así que esa función es lineal. Las salidas ${c}, ${c + u}, ${c + 4 * u}, ${c + 9 * u} cambian ${u}, ${3 * u}, ${5 * u}: los cambios siguen creciendo, así que esa función no es lineal.`,
  );
}

function twoExample(round, k) {
  const s = seedOf(round);
  const d = 2 + ((s + k) % 4);
  const m = 2 + ((s + k * 2) % 4);
  return two(
    `Example: machine X goes 0, ${d}, ${2 * d}, ${3 * d} and machine Y goes 0, ${m * d}, ${2 * m * d}, ${3 * m * d}. X adds ${d} each step and Y adds ${m * d}. At every step the Y term is ${m} times the X term.`,
    `Ejemplo: la máquina X da 0, ${d}, ${2 * d}, ${3 * d} y la máquina Y da 0, ${m * d}, ${2 * m * d}, ${3 * m * d}. X suma ${d} en cada paso e Y suma ${m * d}. En cada paso el término Y es ${m} veces el término X.`,
  );
}

const CYCLE_EXAMPLE = two(
  "Example with letters: A B B A B B A B B A B B. The group A B B repeats, so the core is A B B and it has 3 cells. To find cell 12, count by threes: 3, 6, 9, 12. Cell 12 ends a group, so it is the last letter of the core.",
  "Ejemplo con letras: A B B A B B A B B A B B. El grupo A B B se repite, así que el núcleo es A B B y tiene 3 casillas. Para hallar la casilla 12, cuenta de tres en tres: 3, 6, 9, 12. La casilla 12 termina un grupo, así que es la última letra del núcleo.",
);

const EXAMPLES = { machine: machineExample, seq: seqExample, typed: typedExample, two: twoExample };

const classNote = (round, lang) => {
  const cls = round.cls;
  if (!cls) return "";
  const es = lang === "es";
  const notes = {
    parity: {
      even: ["All the terms are even.", "Todos los términos son pares."],
      odd: ["All the terms are odd.", "Todos los términos son impares."],
      alt: [
        "The terms switch between even and odd.",
        "Los términos alternan entre pares e impares.",
      ],
    },
    prop: {
      yes: ["The relationship is proportional.", "La relación es proporcional."],
      no: ["The relationship is not proportional.", "La relación no es proporcional."],
    },
    linear: {
      lin: ["The function is linear.", "La función es lineal."],
      non: ["The function is nonlinear.", "La función no es lineal."],
    },
    dep: {
      out: [
        `The dependent variable is “${quantity(round, "out", lang)}”.`,
        `La variable dependiente es «${quantity(round, "out", lang)}».`,
      ],
    },
  };
  const pick =
    cls.id === "times"
      ? [
          `Each B term is ${cls.answer} times the A term at the same step.`,
          `Cada término B es ${cls.answer} veces el término A del mismo paso.`,
        ]
      : notes[cls.id]?.[cls.answer];
  return pick ? ` ${pick[es ? 1 : 0]}` : "";
};

function solution(round) {
  const answer = answerString(round);
  if (round.form === "cycle") {
    const core = round.machines[0].spec.core;
    const en = core.map((id) => L(UI.symbols[id], "en")).join(", ");
    const es = core.map((id) => L(UI.symbols[id], "es")).join(", ");
    return two(
      `The core is: ${en}. It repeats over and over, so cell ${round.far} is the ${L(UI.symbols[answer], "en")}.`,
      `El núcleo es: ${es}. Se repite una y otra vez, así que la casilla ${round.far} es ${L(UI.symbols[answer], "es") === "estrella" ? "la" : "el"} ${L(UI.symbols[answer], "es")}.`,
    );
  }
  const texts = round.machines.map((m) => specText(m.spec, round.vars));
  const rule = round.form === "two" ? `A: ${texts[0]}. B: ${texts[1]}.` : `${texts[0]}.`;
  const at = {
    en: `At ${round.far}, ${round.form === "two" ? "machine B gives" : "the output is"} ${answer}.`,
    es: `En ${round.far}, ${round.form === "two" ? "la máquina B da" : "la salida es"} ${answer}.`,
  };
  return two(
    `The rule is ${round.form === "two" ? "" : "output = "}${rule}${classNote(round, "en")} ${at.en}`,
    `La regla es ${round.form === "two" ? "" : "salida = "}${rule}${classNote(round, "es")} ${at.es}`,
  );
}

export function hint(round, tier) {
  if (tier >= 3) return solution(round);
  const kind = KIND(round);
  if (tier === 0) return TIER0[kind];
  if (tier === 1) return TIER1[kind];
  if (kind === "cycle") return CYCLE_EXAMPLE;
  return guarded(round, (k) => EXAMPLES[kind](round, k));
}

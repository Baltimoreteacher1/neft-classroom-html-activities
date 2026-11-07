// Kindergarten to Grade 2 strands: hidden parts of a number (K), shapes and solids, equal shares, doubles (Grade 1),
// arrays, telling time to five minutes, mental +-10 and +-100 (Grade 2). Same contract as strands-6.js. The audio-first
// pre-reader mode is a separate piece of work (wt-fl-k2).
import { problem } from "./problem-item.js";
import { pick, randInt } from "./strand-kit.js";

const SHAPES = [
  ["triangle", "triángulo", 3],
  ["square", "cuadrado", 4],
  ["rectangle", "rectángulo", 4],
  ["pentagon", "pentágono", 5],
  ["hexagon", "hexágono", 6],
  ["octagon", "octágono", 8],
  ["trapezoid", "trapecio", 4],
];
const SOLIDS = [
  ["cube", "cubo", "an", 6, 12, 8],
  ["rectangular prism", "prisma rectangular", "a", 6, 12, 8],
];

export const STRANDS_K2 = {
  // K.OA.A.3: a total, the part you can see, how many are hiding.
  hiddenParts(config, rng) {
    const total = randInt(config.scaffolded ? 3 : 5, config.scaffolded ? 6 : 10, rng);
    const shown = randInt(1, total - 1, rng);
    const things = pick([["counters", "fichas"], ["stickers", "calcomanías"], ["marbles", "canicas"]], rng);
    return problem(
      `There are ${total} ${things[0]} in all. ${shown} are showing. How many are hiding?`,
      total - shown,
      {
        questionEs: `Hay ${total} ${things[1]} en total. Se ven ${shown}. ¿Cuántas están escondidas?`,
        hint: "The part you see and the part hiding make the whole.",
        steps: [`The whole is ${total}. You can see ${shown}.`, "Think: what do you add to the part you see to make the whole?", `${total - shown} are hiding.`],
      },
    );
  },

  // 1.G.A.1: sides and corners of flat shapes; faces, edges and corners of solids.
  shapeFacts(config, rng) {
    if (!config.scaffolded && rng() < 0.35) {
      const [en, es, art, faces, edges, corners] = pick(SOLIDS, rng);
      const [ask, askEs, answer] = pick(
        [
          ["flat faces", "caras planas", faces],
          ["edges", "aristas", edges],
          ["corners", "esquinas", corners],
        ],
        rng,
      );
      return problem(`How many ${ask} does ${art} ${en} have?`, answer, {
        questionEs: `¿Cuántas ${askEs} tiene un ${es}?`,
        hint: "Picture the solid or hold one. Count each kind of part one time.",
        steps: ["Picture the solid and touch each part as you count.", "Count each one only one time.", `${answer}`],
      });
    }
    const [en, es, sides] = pick(SHAPES, rng);
    const corners = rng() < 0.5;
    return problem(`How many ${corners ? "corners" : "sides"} does ${en === "octagon" ? "an" : "a"} ${en} have?`, sides, {
      questionEs: `¿Cuántos ${corners ? "vértices" : "lados"} tiene un ${es}?`,
      hint: "Trace the shape with your finger and count.",
      steps: [`Think of a ${en} and trace its edge.`, `Count each ${corners ? "corner" : "side"} one time.`, `${sides}`],
    });
  },

  // 1.G.A.3: equal shares make a whole; how many shares are left, or how long the whole is.
  equalShares(config, rng) {
    const form = config.scaffolded ? "left" : pick(["left", "whole"], rng);
    if (form === "left") {
      const d = pick([2, 3, 4, 5, 6, 8], rng);
      const eaten = randInt(1, d - 1, rng);
      return problem(`A pizza is cut into ${d} equal shares. ${eaten} ${eaten === 1 ? "share is" : "shares are"} eaten. How many shares are left?`, d - eaten, {
        questionEs: `Una pizza se corta en ${d} partes iguales. Se comen ${eaten}. ¿Cuántas partes quedan?`,
        hint: "All the equal shares together make the whole pizza.",
        steps: [`The whole pizza is ${d} equal shares.`, `Take away the ${eaten} that were eaten.`, `${d - eaten} shares are left.`],
      });
    }
    const d = pick([2, 3, 4], rng);
    const each = randInt(2, 6, rng);
    return problem(`A rope is cut into ${d} equal pieces. Each piece is ${each} inches long. How long was the whole rope?`, d * each, {
      unit: "inches",
      questionEs: `Una cuerda se corta en ${d} pedazos iguales. Cada pedazo mide ${each} pulgadas. ¿Cuánto medía la cuerda completa?`,
      hint: "The whole rope is all the equal pieces put back together.",
      steps: [`There are ${d} equal pieces.`, `Put ${d} pieces of ${each} inches together.`, `${d} × ${each} = ${d * each}`],
    });
  },

  // 1.OA.C.6 / 2.OA.B.2: doubles and near doubles.
  doublesNear(config, rng) {
    const a = randInt(2, 9, rng);
    const form = pick(["double", "near", "near"], rng);
    if (form === "double")
      return problem(`What is ${a} + ${a}?`, 2 * a, {
        questionEs: `¿Cuánto es ${a} + ${a}?`,
        hint: "A double adds the same number twice.",
        steps: [`${a} + ${a} means two groups of ${a}.`, "Think of a double you know.", `${2 * a}`],
      });
    return problem(`What is ${a} + ${a + 1}? Use a double to help.`, 2 * a + 1, {
      questionEs: `¿Cuánto es ${a} + ${a + 1}? Usa un doble para ayudarte.`,
      hint: "Find the double that is close, then change it by one.",
      steps: [`${a} + ${a + 1} is a near double.`, `Start with the double ${a} + ${a}, then add 1 more.`, `${2 * a + 1}`],
    });
  },

  // 2.OA.C.4: arrays: rows and columns, equal rows.
  arrays(config, rng) {
    const [r, c] = [randInt(2, 5, rng), randInt(2, 5, rng)];
    if (!config.scaffolded && rng() < 0.4)
      return problem(`${r * c} dots are in ${r} equal rows. How many dots are in each row?`, c, {
        questionEs: `Hay ${r * c} puntos en ${r} filas iguales. ¿Cuántos puntos hay en cada fila?`,
        hint: "Share the dots equally into the rows.",
        steps: [`${r * c} dots are shared equally into ${r} rows.`, `Think: ${r} times what number makes ${r * c}?`, `${c} dots in each row`],
      });
    return problem(`An array has ${r} rows with ${c} dots in each row. How many dots are there in all?`, r * c, {
      questionEs: `Una matriz tiene ${r} filas con ${c} puntos en cada fila. ¿Cuántos puntos hay en total?`,
      hint: "Add the same number again for each row.",
      steps: [`Each of the ${r} rows has ${c} dots.`, `Add ${c} once for every row: ${Array(r).fill(c).join(" + ")}.`, `${r * c} dots`],
    });
  },

  // 2.MD.C.7: tell and write time to five minutes: the minute hand and time that passes.
  timeFive(config, rng) {
    if (rng() < 0.5) {
      const k = randInt(1, 12, rng);
      return problem(`The minute hand points to the ${k}. How many minutes after the hour is that?`, 5 * k, {
        unit: "minutes",
        questionEs: `El minutero señala el ${k}. ¿Cuántos minutos después de la hora son?`,
        hint: "Count by fives for each number on the clock.",
        steps: ["Each number on the clock is 5 minutes.", `Count by fives to the ${k}.`, `${5 * k} minutes`],
      });
    }
    const start = randInt(0, 8, rng) * 5;
    const end = randInt(start / 5 + 1, 11, rng) * 5;
    const hour = randInt(1, 11, rng);
    const clock = (m) => `${hour}:${String(m).padStart(2, "0")}`;
    return problem(`How many minutes pass from ${clock(start)} to ${clock(end)}?`, end - start, {
      unit: "minutes",
      questionEs: `¿Cuántos minutos pasan de ${clock(start)} a ${clock(end)}?`,
      hint: "Count on by fives from the start time to the end time.",
      steps: ["Both times are in the same hour.", "Find how far the minutes moved forward.", `${end} − ${start} = ${end - start}`],
    });
  },

  // 2.NBT.B.8: mentally add or subtract 10 or 100 from a number to 900.
  mentalTens(config, rng) {
    const step = config.scaffolded || rng() < 0.5 ? 10 : 100;
    const more = rng() < 0.5;
    const n = step === 10 ? randInt(config.scaffolded ? 20 : 15, 890, rng) : randInt(110, 890, rng);
    const result = more ? n + step : n - step;
    return problem(`What is ${step} ${more ? "more" : "less"} than ${n}?`, result, {
      questionEs: `¿Cuánto es ${step} ${more ? "más" : "menos"} que ${n}?`,
      hint: step === 10 ? "Only the tens digit changes by one." : "Only the hundreds digit changes by one.",
      steps: [`Look at the ${step === 10 ? "tens" : "hundreds"} place in ${n}.`, `${more ? "Add" : "Take away"} one ${step === 10 ? "ten" : "hundred"}. The other places stay the same.`, `${result}`],
    });
  },
};

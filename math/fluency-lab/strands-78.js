// Grade 7 and Grade 8 strands: combining like terms, circumference, angle facts, sampling (Grade 7); scientific
// notation operations, volume of cylinders, cones and spheres, translations/rotations/dilations, and comparing
// two functions (Grade 8). Same contract as strands-6.js: each generator returns a problem-bank item with `questionEs`,
// a hint, and steps that never state the answer before the last one. Multiple-choice answers carry `choices`.
import { problem } from "./problem-item.js";
import { fmtNum, gcd, pick, randInt, shuffle } from "./strand-kit.js";

const SUP = {
  0: "⁰",
  1: "¹",
  2: "²",
  3: "³",
  4: "⁴",
  5: "⁵",
  6: "⁶",
  7: "⁷",
  8: "⁸",
  9: "⁹",
  "-": "⁻",
};
export const power10 = (n) => `10${String(n).replace(/./g, (c) => SUP[c])}`;
const sci = (coefficient, exponent) => `${fmtNum(coefficient)} × ${power10(exponent)}`;
const term = (c, v = "x") =>
  c === 1 ? v : c === -1 ? `−${v}` : `${String(c).replace("-", "−")}${v}`;
const signed = (n) => (n < 0 ? `− ${-n}` : `+ ${n}`);
const expression = (a, b) => (b === 0 ? term(a) : `${term(a)} ${signed(b)}`);

export const STRANDS_78 = {
  // 7.EE.A.1: add and subtract linear expressions by combining like terms.
  likeTerms(config, rng) {
    const [a, c] = [randInt(2, 9, rng), randInt(1, 8, rng)];
    const [b, d] = [randInt(1, 9, rng), randInt(1, 9, rng)];
    const sub = !config.scaffolded && rng() < 0.5;
    const start = sub
      ? `${term(a)} + ${b} − ${term(c)} − ${d}`
      : `${term(a)} + ${b} + ${term(c)} + ${d}`;
    const [x, k] = sub ? [a - c, b - d] : [a + c, b + d];
    if (x === 0) return STRANDS_78.likeTerms(config, rng);
    const answer = expression(x, k);
    return problem(`Simplify the expression: ${start}.`, answer, {
      kind: "expression",
      questionEs: `Simplifica la expresión: ${start}.`,
      hint: "Group the x-terms together and the plain numbers together. Watch the signs.",
      steps: [
        `The x-terms are ${term(a)} and ${sub ? `−${term(c)}` : `+${term(c)}`}. The numbers are ${b} and ${sub ? `−${d}` : `+${d}`}.`,
        "Combine the x-terms. Then combine the numbers.",
        answer,
      ],
      work: { mode: "expression", start, variable: "x" },
    });
  },

  // 7.G.B.4: circumference from a radius or diameter, or the diameter from a circumference. Uses 3.14 for pi.
  circumference(config, rng) {
    const r = randInt(2, config.scaffolded ? 8 : 15, rng);
    const form = config.scaffolded ? "forward" : pick(["forward", "diameter", "radius"], rng);
    if (form === "forward") {
      const useRadius = rng() < 0.5;
      const given = useRadius ? r : r * 2;
      const answer = fmtNum(Number((2 * 3.14 * r).toFixed(2)));
      const word = useRadius ? "radius" : "diameter";
      return problem(
        `A circle has a ${word} of ${given} cm. Use 3.14 for π. What is its circumference?`,
        answer,
        {
          unit: "centimeters",
          questionEs: `Un círculo tiene ${useRadius ? "un radio" : "un diámetro"} de ${given} cm. Usa 3.14 para π. ¿Cuál es su circunferencia?`,
          hint: useRadius ? "Circumference = 2 × π × radius." : "Circumference = π × diameter.",
          steps: useRadius
            ? [
                "The circumference is C = 2 × π × r.",
                `Replace π with 3.14 and r with ${r}.`,
                `2 × 3.14 × ${r} = ${answer}`,
              ]
            : [
                "The circumference is C = π × d.",
                `Replace π with 3.14 and d with ${given}.`,
                `3.14 × ${given} = ${answer}`,
              ],
        },
      );
    }
    const circumference = fmtNum(Number((2 * 3.14 * r).toFixed(2)));
    const asRadius = form === "radius";
    return problem(
      `The circumference of a circle is ${circumference} cm. Use 3.14 for π. What is its ${asRadius ? "radius" : "diameter"}?`,
      asRadius ? r : r * 2,
      {
        unit: "centimeters",
        questionEs: `La circunferencia de un círculo es ${circumference} cm. Usa 3.14 para π. ¿Cuál es su ${asRadius ? "radio" : "diámetro"}?`,
        hint: asRadius
          ? "Circumference = 2 × π × radius. Undo the multiplication."
          : "Circumference = π × diameter. Divide by π.",
        steps: asRadius
          ? [
              "The circumference is C = 2 × π × r.",
              `Divide ${circumference} by 2 × 3.14.`,
              `${circumference} ÷ 6.28 = ${r}`,
            ]
          : [
              "The circumference is C = π × d.",
              `Divide ${circumference} by 3.14.`,
              `${circumference} ÷ 3.14 = ${r * 2}`,
            ],
      },
    );
  },

  // 7.G.B.5: angle facts. A triangle's angles total 180, angles on a line total 180, vertical angles are equal.
  angleFacts(config, rng) {
    const form = config.scaffolded
      ? pick(["line", "triangle"], rng)
      : pick(["line", "triangle", "vertical", "algebra"], rng);
    if (form === "triangle") {
      const [a, b] = [randInt(30, 80, rng), randInt(30, 80, rng)];
      return problem(
        `Two angles of a triangle measure ${a}° and ${b}°. What is the third angle?`,
        180 - a - b,
        {
          unit: "degrees",
          questionEs: `Dos ángulos de un triángulo miden ${a}° y ${b}°. ¿Cuánto mide el tercer ángulo?`,
          hint: "The three angles of a triangle add up to a fixed total.",
          steps: [
            "The angles of a triangle total 180°.",
            `Add the two angles you know: ${a} + ${b} = ${a + b}.`,
            `180 − ${a + b} = ${180 - a - b}`,
          ],
        },
      );
    }
    if (form === "line") {
      const a = randInt(20, 160, rng);
      return problem(
        `Two angles sit side by side on a straight line. One measures ${a}°. What does the other measure?`,
        180 - a,
        {
          unit: "degrees",
          questionEs: `Dos ángulos están uno junto al otro sobre una línea recta. Uno mide ${a}°. ¿Cuánto mide el otro?`,
          hint: "A straight line is a half turn.",
          steps: [
            "Angles on a straight line total 180°.",
            "Subtract the angle you know from the half turn.",
            `180 − ${a} = ${180 - a}`,
          ],
        },
      );
    }
    if (form === "vertical") {
      const a = randInt(25, 155, rng);
      const side = rng() < 0.5;
      return problem(
        side
          ? `Two lines cross. One angle measures ${a}°. What does the angle directly across from it measure?`
          : `Two lines cross. One angle measures ${a}°. What does an angle next to it measure?`,
        side ? a : 180 - a,
        {
          unit: "degrees",
          questionEs: side
            ? `Dos rectas se cruzan. Un ángulo mide ${a}°. ¿Cuánto mide el ángulo opuesto por el vértice?`
            : `Dos rectas se cruzan. Un ángulo mide ${a}°. ¿Cuánto mide un ángulo que está a su lado?`,
          hint: side
            ? "Angles directly across from each other are related in a simple way."
            : "An angle next to it and the first angle make a straight line.",
          steps: side
            ? [
                "Angles directly across from each other are vertical angles.",
                "Vertical angles have the same measure.",
                `${a}°`,
              ]
            : [
                "An angle next to it and the first angle make a straight line.",
                "Angles on a straight line total 180°.",
                `180 − ${a} = ${180 - a}`,
              ],
        },
      );
    }
    const m = pick([2, 3, 6, 9], rng);
    const parts = m + 3;
    const x = 180 / parts;
    return problem(`The angles of a triangle measure x°, ${m}x° and 2x°. What is x?`, x, {
      unit: "degrees",
      questionEs: `Los ángulos de un triángulo miden x°, ${m}x° y 2x°. ¿Cuánto vale x?`,
      hint: "Write an equation: the three angles add to the total for a triangle. Then solve it.",
      steps: [
        `The angles of a triangle total 180°, so x + ${m}x + 2x = 180.`,
        `Combine like terms: ${parts}x = 180.`,
        `180 ÷ ${parts} = ${x}`,
      ],
    });
  },

  // 7.SP.A.2: use a random sample to predict a whole population.
  sampling(config, rng) {
    const subjects = [
      [
        "students",
        "prefer pizza for lunch",
        "prefieren pizza para el almuerzo",
        "students",
        "estudiantes",
      ],
      ["students", "walk to school", "caminan a la escuela", "students", "estudiantes"],
      ["shoppers", "pay with a card", "pagan con tarjeta", "shoppers", "compradores"],
    ];
    const [, en, es, whoEn, whoEs] = pick(subjects, rng);
    const sample = pick([20, 25, 40, 50], rng);
    const yes = randInt(2, sample - 3, rng);
    const g = gcd(yes, sample);
    const pop =
      (sample / g) *
      randInt(config.scaffolded ? 4 : 5, config.scaffolded ? 12 : 30, rng) *
      (config.scaffolded ? 1 : 2);
    const answer = (pop * yes) / sample;
    return problem(
      `A random sample of ${sample} ${whoEn} found that ${yes} ${en}. About how many of ${pop} ${whoEn} would you predict ${en}?`,
      answer,
      {
        questionEs: `En una muestra aleatoria de ${sample} ${whoEs}, ${yes} ${es}. Aproximadamente, ¿cuántos de ${pop} ${whoEs} predices que ${es}?`,
        hint: "A random sample is a small copy of the whole group, so the same fraction should apply to the whole.",
        steps: [
          `In the sample, ${yes} out of ${sample} ${en}.`,
          `Use the same fraction for the whole group: ${yes}/${sample} of ${pop}.`,
          `${pop} × ${yes} ÷ ${sample} = ${answer}`,
        ],
      },
    );
  },

  // 8.EE.A.4: operations with numbers in scientific notation (multiple choice: the answer is a written number).
  sciOps(config, rng) {
    const op = config.scaffolded
      ? pick(["mul", "add"], rng)
      : pick(["mul", "div", "add", "mul"], rng);
    const [m, n] = [randInt(2, 8, rng), randInt(2, 7, rng)];
    let [a, b] = [randInt(2, 9, rng), randInt(2, 9, rng)];
    let stem;
    let stemEs;
    let result;
    if (op === "add") {
      [a, b] = [randInt(1, 4, rng), randInt(1, 4, rng)];
      stem = `(${sci(a, m)}) + (${sci(b, m)})`;
      result = [a + b, m];
    } else if (op === "div") {
      const q = randInt(2, 3, rng);
      const e = randInt(1, 5, rng);
      b = randInt(1, 3, rng);
      stem = `(${sci(q * b, m + e)}) ÷ (${sci(b, m)})`;
      result = [q, e];
    } else {
      stem = `(${sci(a, m)}) × (${sci(b, n)})`;
      result = a * b >= 10 ? [(a * b) / 10, m + n + 1] : [a * b, m + n];
    }
    if (result[0] >= 10) result = [result[0] / 10, result[1] + 1];
    stemEs = stem;
    const verb = { mul: "product", div: "quotient", add: "sum" }[op];
    const verbEs = { mul: "el producto", div: "el cociente", add: "la suma" }[op];
    const answer = sci(result[0], result[1]);
    const choices = distinctChoices(
      [
        answer,
        sci(result[0], result[1] + 1),
        sci(result[0], Math.max(1, result[1] - 1)),
        op === "mul"
          ? `${fmtNum(a * b)} × ${power10(m * n)}`
          : op === "add"
            ? sci(a + b, m * 2)
            : sci(result[0], m - n),
      ],
      rng,
    );
    return problem(`Write the ${verb} in scientific notation: ${stem}`, answer, {
      kind: "choice",
      choices,
      questionEs: `Escribe ${verbEs} en notación científica: ${stemEs}`,
      hint:
        op === "mul"
          ? "Multiply the numbers in front. Add the exponents of 10. Then check the number in front is at least 1 and less than 10."
          : op === "div"
            ? "Divide the numbers in front. Subtract the exponents of 10."
            : "The powers of 10 match, so add the numbers in front and keep the power of 10.",
      steps:
        op === "mul"
          ? [
              "Multiply the numbers in front, and add the exponents.",
              "If the number in front is 10 or more, move the decimal point and change the exponent.",
              answer,
            ]
          : op === "div"
            ? [
                "Divide the numbers in front, and subtract the exponents.",
                "Check that the number in front is at least 1 and less than 10.",
                answer,
              ]
            : ["Both numbers use the same power of 10.", "Add the numbers in front.", answer],
    });
  },

  // 8.G.C.9: volume of a cylinder, a cone or a sphere, with 3.14 for pi.
  volumeRound(config, rng) {
    const shape = config.scaffolded ? "cylinder" : pick(["cylinder", "cone", "sphere"], rng);
    if (shape === "cylinder") {
      const [r, h] = [randInt(2, 6, rng), randInt(2, 10, rng)];
      const answer = fmtNum(Number((3.14 * r * r * h).toFixed(2)));
      return problem(
        `A cylinder has a radius of ${r} cm and a height of ${h} cm. Use 3.14 for π. What is its volume?`,
        answer,
        {
          unit: "cubic centimeters",
          questionEs: `Un cilindro tiene un radio de ${r} cm y una altura de ${h} cm. Usa 3.14 para π. ¿Cuál es su volumen?`,
          hint: "Volume = area of the circular base × height.",
          steps: [
            `The base is a circle: 3.14 × ${r} × ${r} = ${fmtNum(Number((3.14 * r * r).toFixed(2)))}.`,
            `Multiply the base area by the height ${h}.`,
            `${fmtNum(Number((3.14 * r * r).toFixed(2)))} × ${h} = ${answer}`,
          ],
        },
      );
    }
    if (shape === "cone") {
      const r = randInt(2, 6, rng);
      const h = 3 * randInt(1, 4, rng);
      const answer = fmtNum(Number(((3.14 * r * r * h) / 3).toFixed(2)));
      return problem(
        `A cone has a radius of ${r} cm and a height of ${h} cm. Use 3.14 for π. What is its volume?`,
        answer,
        {
          unit: "cubic centimeters",
          questionEs: `Un cono tiene un radio de ${r} cm y una altura de ${h} cm. Usa 3.14 para π. ¿Cuál es su volumen?`,
          hint: "A cone holds one third of the cylinder with the same base and height.",
          steps: [
            `The matching cylinder has volume 3.14 × ${r} × ${r} × ${h} = ${fmtNum(Number((3.14 * r * r * h).toFixed(2)))}.`,
            "A cone is one third of that cylinder.",
            `${fmtNum(Number((3.14 * r * r * h).toFixed(2)))} ÷ 3 = ${answer}`,
          ],
        },
      );
    }
    const r = pick([3, 6], rng);
    const answer = fmtNum(Number(((4 / 3) * 3.14 * r ** 3).toFixed(2)));
    return problem(
      `A sphere has a radius of ${r} cm. Use 3.14 for π. What is its volume?`,
      answer,
      {
        unit: "cubic centimeters",
        questionEs: `Una esfera tiene un radio de ${r} cm. Usa 3.14 para π. ¿Cuál es su volumen?`,
        hint: "The volume of a sphere is four thirds times π times the radius cubed.",
        steps: [
          `Cube the radius: ${r} × ${r} × ${r} = ${r ** 3}.`,
          `Multiply by 4/3: ${r ** 3} × 4 ÷ 3 = ${(r ** 3 * 4) / 3}.`,
          `${(r ** 3 * 4) / 3} × 3.14 = ${answer}`,
        ],
      },
    );
  },

  // 8.G.A.3: translations, rotations about the origin and dilations of a point (typed point answer).
  transformPoint(config, rng) {
    const [x, y] = [randInt(-8, 8, rng) || 3, randInt(-8, 8, rng) || -2];
    const kinds = config.scaffolded
      ? ["translate"]
      : ["translate", "rotate90", "rotate180", "dilate"];
    const kind = pick(kinds, rng);
    const fix = (v) => (v === 0 ? 0 : v);
    let to;
    let en;
    let es;
    let hint;
    let steps;
    if (kind === "translate") {
      const [dx, dy] = [randInt(-6, 6, rng) || 2, randInt(-6, 6, rng) || -3];
      to = [x + dx, y + dy];
      const mv = (n, pos, neg) => (n > 0 ? `${n} ${pos}` : `${-n} ${neg}`);
      en = `Translate (${x}, ${y}) ${mv(dx, "right", "left")} and ${mv(dy, "up", "down")}.`;
      es = `Traslada (${x}, ${y}) ${mv(dx, "a la derecha", "a la izquierda")} y ${mv(dy, "hacia arriba", "hacia abajo")}.`;
      hint = "Right and left change x. Up and down change y.";
      steps = [
        `Move x by ${dx} (${dx > 0 ? "right" : "left"}): ${x} ${dx > 0 ? "+" : "−"} ${Math.abs(dx)}.`,
        `Move y by ${dy} (${dy > 0 ? "up" : "down"}): ${y} ${dy > 0 ? "+" : "−"} ${Math.abs(dy)}.`,
        `(${to[0]}, ${to[1]})`,
      ];
    } else if (kind === "rotate90") {
      to = [fix(-y), x];
      en = `Rotate (${x}, ${y}) 90° counterclockwise about the origin.`;
      es = `Rota (${x}, ${y}) 90° en sentido contrario a las agujas del reloj alrededor del origen.`;
      hint =
        "A quarter turn counterclockwise swaps the coordinates, then changes the sign of the new first coordinate.";
      steps = [
        `Swap the coordinates: (${y}, ${x}).`,
        "Change the sign of the first coordinate.",
        `(${to[0]}, ${to[1]})`,
      ];
    } else if (kind === "rotate180") {
      to = [fix(-x), fix(-y)];
      en = `Rotate (${x}, ${y}) 180° about the origin.`;
      es = `Rota (${x}, ${y}) 180° alrededor del origen.`;
      hint = "A half turn sends each coordinate to its opposite.";
      steps = [
        "A half turn about the origin changes both signs.",
        `The opposite of ${x} and the opposite of ${y}.`,
        `(${to[0]}, ${to[1]})`,
      ];
    } else {
      const k = pick([2, 3, 0.5], rng);
      const [px, py] =
        k < 1 ? [2 * randInt(-4, 4, rng) || 4, 2 * randInt(-4, 4, rng) || -2] : [x, y];
      to = [px * k, py * k];
      en = `Dilate (${px}, ${py}) by a scale factor of ${k} from the origin.`;
      es = `Dilata (${px}, ${py}) con un factor de escala de ${k} desde el origen.`;
      hint = "A dilation from the origin multiplies both coordinates by the scale factor.";
      steps = [
        `Multiply the x-coordinate by ${k}.`,
        `Multiply the y-coordinate by ${k}.`,
        `(${to[0]}, ${to[1]})`,
      ];
    }
    const text = `(${to[0]},${to[1]})`;
    return problem(en, text, {
      kind: "text",
      displayAnswer: `(${to[0]}, ${to[1]})`,
      questionEs: es,
      hint,
      steps,
    });
  },

  // 8.F.A.2: compare the rates of change of two functions given in different forms.
  compareFunctions(config, rng) {
    const [m1, b1] = [randInt(1, 6, rng), randInt(0, 8, rng)];
    let m2 = randInt(1, 6, rng);
    if (m2 === m1) m2 += 1;
    const b2 = randInt(0, 8, rng);
    const x = randInt(2, 5, rng);
    const forms = [
      [
        `Function B is a line through (0, ${b2}) and (${x}, ${b2 + m2 * x}).`,
        `La función B es una recta que pasa por (0, ${b2}) y (${x}, ${b2 + m2 * x}).`,
      ],
      [
        `Function B has a rate of change of ${m2} and a y-intercept of ${b2}.`,
        `La función B tiene una razón de cambio de ${m2} y una intersección con el eje y de ${b2}.`,
      ],
      [`Function B is y = ${term(m2)} + ${b2}.`, `La función B es y = ${term(m2)} + ${b2}.`],
    ];
    const [formEn, formEs] = config.scaffolded ? forms[1] : pick(forms, rng);
    const answer = m1 > m2 ? "A" : "B";
    const label = (v) => v;
    return problem(
      `Function A is y = ${term(m1)} + ${b1}. ${formEn} Which function has the greater rate of change?`,
      label(answer),
      {
        kind: "choice",
        choices: ["A", "B"],
        questionEs: `La función A es y = ${term(m1)} + ${b1}. ${formEs} ¿Cuál función tiene la mayor razón de cambio?`,
        hint: "The rate of change is the slope. Find it for each function, then compare.",
        steps: [
          `Function A: the rate of change is the number multiplying x, which is ${m1}.`,
          `Function B: find its rate of change (slope) from what is given.`,
          `Compare ${m1} with ${m2}: ${m1 === m2 ? "they match" : m1 > m2 ? `${m1} is greater` : `${m2} is greater`}.`,
          label(answer),
        ],
      },
    );
  },
};

function distinctChoices(list, rng) {
  const out = [...new Set(list)];
  const [coefficient] = out[0].split(" × ");
  const used = new Set(out.map((c) => c.split(" × ")[1]));
  for (let e = 2; out.length < 4; e += 1) if (!used.has(power10(e))) out.push(`${coefficient} × ${power10(e)}`);
  return shuffle(out.slice(0, 4), rng);
}

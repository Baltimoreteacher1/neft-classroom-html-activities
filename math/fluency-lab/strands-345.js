// Grade 3-5 strands: fractions on a number line, scaled bar graphs (Grade 3); line plots with fractions, converting
// mixed numbers, angle measure (Grade 4); the coordinate plane and order of operations (Grade 5). The Grade 4
// x11-12 set reuses the `fact` generator. Same contract as strands-6.js: bilingual stem, hint, leak-safe steps.
import { problem } from "./problem-item.js";
import { gcd, pick, randInt, sum } from "./strand-kit.js";

const mixed = (n, d) => `${Math.floor(n / d)} ${n % d}/${d}`;

export const STRANDS_345 = {
  // 3.NF.A.2: name the fraction at a mark on a 0-to-1 number line, or find the mark for a fraction.
  fractionLine(config, rng) {
    const d = pick(config.scaffolded ? [2, 3, 4, 5, 6, 8] : [2, 3, 4, 5, 6, 8], rng);
    const n = randInt(1, d - 1, rng);
    if (!config.scaffolded && rng() < 0.4) {
      return problem(
        `A number line from 0 to 1 is cut into ${d} equal parts. At which mark is the point ${n}/${d}? Count from 0.`,
        n,
        {
          questionEs: `Una recta numérica de 0 a 1 está dividida en ${d} partes iguales. ¿En qué marca está el punto ${n}/${d}? Cuenta desde 0.`,
          hint: "The top number tells how many equal parts to count from 0.",
          steps: [
            `Each equal part is one ${d === 2 ? "half" : d === 3 ? "third" : d === 4 ? "fourth" : d === 6 ? "sixth" : "eighth"}.`,
            "The top number of the fraction says how many parts to count from 0.",
            `Mark ${n}`,
          ],
        },
      );
    }
    return problem(
      `A number line from 0 to 1 is cut into ${d} equal parts. Point P is at mark ${n}, counting from 0. What fraction does P show?`,
      `${n}/${d}`,
      {
        kind: "fraction",
        questionEs: `Una recta numérica de 0 a 1 está dividida en ${d} partes iguales. El punto P está en la marca ${n}, contando desde 0. ¿Qué fracción muestra P?`,
        hint: "The bottom number is how many equal parts the line is cut into. The top number is how many parts from 0.",
        steps: [
          `The line is cut into ${d} equal parts, so the bottom number (denominator) is ${d}.`,
          `P is ${n} parts from 0, so the top number (numerator) is ${n}.`,
          `${n}/${d}`,
        ],
      },
    );
  },

  // 3.MD.B.3: read a scaled bar graph (each square stands for more than one).
  scaledGraph(config, rng) {
    const s = pick(config.scaffolded ? [2, 5] : [2, 5, 10], rng);
    const things = pick([["books", "libros"], ["stickers", "calcomanías"], ["pencils", "lápices"]], rng);
    const [a, b] = [randInt(2, 9, rng), randInt(2, 9, rng)];
    if (!config.scaffolded && rng() < 0.5 && a !== b) {
      const [hi, lo] = a > b ? [a, b] : [b, a];
      return problem(
        `In a scaled bar graph, each square stands for ${s} ${things[0]}. Class A's bar has ${hi} squares and Class B's bar has ${lo} squares. How many more ${things[0]} does Class A have?`,
        (hi - lo) * s,
        {
          questionEs: `En una gráfica de barras con escala, cada cuadro representa ${s} ${things[1]}. La barra de la Clase A tiene ${hi} cuadros y la de la Clase B tiene ${lo} cuadros. ¿Cuántos ${things[1]} más tiene la Clase A?`,
          hint: "Find how many squares more, then use the scale.",
          steps: [`Class A has ${hi - lo} squares more than Class B.`, `Each square stands for ${s} ${things[0]}.`, `${hi - lo} × ${s} = ${(hi - lo) * s}`],
        },
      );
    }
    return problem(
      `In a scaled bar graph, each square stands for ${s} ${things[0]}. The bar for Class A has ${a} squares. How many ${things[0]} is that?`,
      a * s,
      {
        questionEs: `En una gráfica de barras con escala, cada cuadro representa ${s} ${things[1]}. La barra de la Clase A tiene ${a} cuadros. ¿Cuántos ${things[1]} son?`,
        hint: "Each square is worth more than 1. Skip count by the scale, or multiply.",
        steps: [`Each square stands for ${s} ${things[0]}.`, `Count the squares: ${a}.`, `${a} × ${s} = ${a * s}`],
      },
    );
  },

  // 4.MD.B.4: line plot of lengths in fourths of an inch.
  linePlot(config, rng) {
    const counts = [randInt(1, 5, rng), randInt(1, 5, rng), randInt(1, 5, rng)];
    const plot = `1/4 inch: ${counts[0]} dots. 1/2 inch: ${counts[1]} dots. 3/4 inch: ${counts[2]} dots.`;
    const plotEs = `1/4 de pulgada: ${counts[0]} puntos. 1/2 pulgada: ${counts[1]} puntos. 3/4 de pulgada: ${counts[2]} puntos.`;
    const form = config.scaffolded ? pick(["total", "longer"], rng) : pick(["total", "longer", "range"], rng);
    if (form === "total")
      return problem(`A line plot shows the lengths of leaves. ${plot} How many leaves were measured?`, sum(counts), {
        questionEs: `Una gráfica de puntos muestra las longitudes de unas hojas. ${plotEs} ¿Cuántas hojas se midieron?`,
        hint: "Every dot is one leaf.",
        steps: ["Each dot on the line plot is one leaf.", `Add the dots: ${counts.join(" + ")}.`, `${sum(counts)} leaves`],
      });
    if (form === "longer")
      return problem(`A line plot shows the lengths of leaves. ${plot} How many leaves are longer than 1/4 inch?`, counts[1] + counts[2], {
        questionEs: `Una gráfica de puntos muestra las longitudes de unas hojas. ${plotEs} ¿Cuántas hojas miden más de 1/4 de pulgada?`,
        hint: "Count only the dots to the right of 1/4.",
        steps: ["Leaves longer than 1/4 inch are the dots to the right of 1/4.", `Add those dots: ${counts[1]} + ${counts[2]}.`, `${counts[1] + counts[2]} leaves`],
      });
    return problem(`A line plot shows the lengths of leaves. ${plot} How many inches longer is the longest leaf than the shortest leaf?`, "1/2", {
      kind: "fraction",
      unit: "inches",
      questionEs: `Una gráfica de puntos muestra las longitudes de unas hojas. ${plotEs} ¿Cuántas pulgadas más larga es la hoja más larga que la más corta?`,
      hint: "Subtract the shortest length from the longest length. Both are fourths.",
      steps: ["The longest leaf is 3/4 inch and the shortest is 1/4 inch.", "Subtract the fourths: 3 fourths − 1 fourth.", "2 fourths, which simplifies to a half"],
    });
  },

  // 4.NF.B.3: convert between a mixed number and an improper fraction (typed exactly as asked).
  mixedNumber(config, rng) {
    const d = pick([2, 3, 4, 5, 6, 8], rng);
    const whole = randInt(1, config.scaffolded ? 3 : 7, rng);
    let r = randInt(1, d - 1, rng);
    while (gcd(r, d) !== 1) r = randInt(1, d - 1, rng);
    const n = whole * d + r;
    if (rng() < 0.5)
      return problem(`Write ${n}/${d} as a mixed number.`, mixed(n, d), {
        kind: "text",
        questionEs: `Escribe ${n}/${d} como número mixto.`,
        hint: "Divide the top number by the bottom number. The quotient is the whole number and the remainder is the new top number.",
        steps: [`Divide ${n} by ${d}: how many whole groups of ${d} fit?`, `The leftover parts become the fraction over ${d}.`, mixed(n, d)],
      });
    return problem(`Write ${mixed(n, d)} as an improper fraction.`, `${n}/${d}`, {
      kind: "text",
      questionEs: `Escribe ${mixed(n, d)} como fracción impropia.`,
      hint: "Multiply the whole number by the bottom number, then add the top number.",
      steps: [`Each whole is ${d}/${d}, so ${whole} wholes is ${whole} × ${d} parts.`, `Add the ${r} extra parts to the parts from the wholes.`, `${n}/${d}`],
    });
  },

  // 4.MD.C.5-7: angle measure: a fraction of a circle, adding adjacent angles, finding a missing part.
  angleMeasure(config, rng) {
    const form = config.scaffolded ? pick(["add", "right"], rng) : pick(["circle", "add", "right", "straight"], rng);
    if (form === "circle") {
      const d = pick([4, 6, 8, 10, 12], rng);
      return problem(`An angle turns through 1/${d} of a full circle. A full circle is 360°. How many degrees is the angle?`, 360 / d, {
        unit: "degrees",
        questionEs: `Un ángulo gira 1/${d} de un círculo completo. Un círculo completo mide 360°. ¿Cuántos grados mide el ángulo?`,
        hint: "Share the 360 degrees of the circle into equal parts.",
        steps: [`The circle is cut into ${d} equal angles.`, `Divide 360° by ${d}.`, `360 ÷ ${d} = ${360 / d}`],
      });
    }
    if (form === "add") {
      const [a, b] = [randInt(15, 80, rng), randInt(15, 80, rng)];
      return problem(`Two angles are placed side by side with no gap. They measure ${a}° and ${b}°. What is the measure of the combined angle?`, a + b, {
        unit: "degrees",
        questionEs: `Dos ángulos se colocan lado a lado sin espacio. Miden ${a}° y ${b}°. ¿Cuánto mide el ángulo combinado?`,
        hint: "Angle measures add when the angles are joined without overlap.",
        steps: ["Joined angles add their measures.", `Add ${a} and ${b}.`, `${a} + ${b} = ${a + b}`],
      });
    }
    const total = form === "right" ? 90 : 180;
    const a = randInt(15, total - 15, rng);
    return problem(
      `${form === "right" ? "A right angle (90°) is split into two angles." : "A straight angle (180°) is split into two angles."} One angle measures ${a}°. What does the other measure?`,
      total - a,
      {
        unit: "degrees",
        questionEs: `${form === "right" ? "Un ángulo recto (90°) se divide en dos ángulos." : "Un ángulo llano (180°) se divide en dos ángulos."} Un ángulo mide ${a}°. ¿Cuánto mide el otro?`,
        hint: "The two parts must add up to the whole angle.",
        steps: [`The two angles add up to ${total}°.`, `Subtract the angle you know from ${total}.`, `${total} − ${a} = ${total - a}`],
      },
    );
  },

  // 5.G.A.1-2: the first quadrant: name a point from moves, find the distance on a line, apply a move.
  coordPlane(config, rng) {
    const form = config.scaffolded ? "name" : pick(["name", "name", "distance", "move"], rng);
    if (form === "name") {
      const [a, b] = [randInt(1, 9, rng), randInt(1, 9, rng)];
      return problem(`Start at the origin (0, 0). Move ${a} units right and ${b} units up. What ordered pair names the point?`, `(${a},${b})`, {
        kind: "text",
        displayAnswer: `(${a}, ${b})`,
        questionEs: `Empieza en el origen (0, 0). Muévete ${a} unidades a la derecha y ${b} unidades hacia arriba. ¿Qué par ordenado nombra el punto?`,
        hint: "The first number is how far right. The second number is how far up.",
        steps: ["Right and left change the x-coordinate, which is written first.", "Up and down change the y-coordinate, which is written second.", `(${a}, ${b})`],
      });
    }
    if (form === "distance") {
      const y = randInt(1, 9, rng);
      const [x1, x2] = [randInt(1, 4, rng), randInt(5, 9, rng)];
      return problem(`Two points are on the same horizontal line: (${x1}, ${y}) and (${x2}, ${y}). How many units apart are they?`, x2 - x1, {
        unit: "units",
        questionEs: `Dos puntos están en la misma recta horizontal: (${x1}, ${y}) y (${x2}, ${y}). ¿A cuántas unidades están uno del otro?`,
        hint: "The y-coordinates match, so only the x-coordinates differ. Subtract them.",
        steps: ["Only the x-coordinates are different.", `Subtract the smaller x-coordinate from the larger one: ${x2} − ${x1}.`, `${x2 - x1} units`],
      });
    }
    const [x, y, a, b] = [randInt(1, 6, rng), randInt(1, 6, rng), randInt(1, 3, rng), randInt(1, 3, rng)];
    return problem(`A point is at (${x}, ${y}). It moves ${a} units right and ${b} units up. What are its new coordinates?`, `(${x + a},${y + b})`, {
      kind: "text",
      displayAnswer: `(${x + a}, ${y + b})`,
      questionEs: `Un punto está en (${x}, ${y}). Se mueve ${a} unidades a la derecha y ${b} unidades hacia arriba. ¿Cuáles son sus nuevas coordenadas?`,
      hint: "Moving right adds to x. Moving up adds to y.",
      steps: [`Move right ${a}: add ${a} to the x-coordinate.`, `Move up ${b}: add ${b} to the y-coordinate.`, `(${x + a}, ${y + b})`],
    });
  },

  // 5.OA.A.1: evaluate expressions with parentheses.
  orderOps5(config, rng) {
    const [a, b, c, d] = [randInt(2, 9, rng), randInt(2, 9, rng), randInt(2, 6, rng), randInt(1, 5, rng)];
    const forms = config.scaffolded
      ? [
          [`${a} + ${b} × ${c}`, a + b * c, [`Multiply first: ${b} × ${c} = ${b * c}.`, `Then add ${a}.`]],
          [`(${a} + ${b}) × ${c}`, (a + b) * c, [`Parentheses first: ${a} + ${b} = ${a + b}.`, `Then multiply by ${c}.`]],
        ]
      : [
          [`${a} + ${b} × (${c + d} − ${d})`, a + b * c, [`Parentheses first: ${c + d} − ${d} = ${c}.`, `Multiply next: ${b} × ${c} = ${b * c}.`, `Then add ${a}.`]],
          [`(${a} + ${b}) × ${c} − ${d}`, (a + b) * c - d, [`Parentheses first: ${a} + ${b} = ${a + b}.`, `Multiply next: ${a + b} × ${c} = ${(a + b) * c}.`, `Then subtract ${d}.`]],
          [`${a * c + d} − ${a} × ${c}`, d, [`Multiply before you subtract: ${a} × ${c} = ${a * c}.`, `Then subtract from ${a * c + d}.`]],
        ];
    const [expr, value, steps] = pick(forms, rng);
    return problem(`Evaluate: ${expr}.`, value, {
      questionEs: `Evalúa: ${expr}.`,
      hint: "Parentheses first. Then multiply and divide from left to right. Then add and subtract from left to right.",
      steps: [...steps, `${value}`],
    });
  },
};

// Game families 6-10: Equation Balance, Graph Explorer, Geometry Builder, Data Detective, Math Strategy Tournament.
import { ALL_SKILLS, generateProblem, seededRandom } from "../problem-bank.js";
import { bi, seeded } from "./engine-core.js";
import {
  build,
  choice,
  numeric,
  registerFamily,
  shuffle,
} from "./game-engine.js";
import { buildGraph } from "./knowledge-graph.js";
import { getModel } from "./models.js";
import {
  R,
  Rational,
  mean,
  median,
  parseRational,
  quartiles,
} from "./rational.js";

const T = (en, es = en) => bi(en, es);
const sgn = (n) => (n < 0 ? `− ${Math.abs(n)}` : `+ ${n}`);

// ============================================================ 6. Equation Balance (Grades 6-8)
const eqSkill = (g) =>
  g <= 6 ? "6:one-step" : g === 7 ? "7:equations" : "8:linear-equations";
registerFamily({
  id: "equationBalance",
  title: T("Equation Balance", "Balanza de ecuaciones"),
  blurb: T(
    "Keep the scale level while you solve: do the same thing to both sides.",
    "Mantén la balanza nivelada mientras resuelves: haz lo mismo en ambos lados.",
  ),
  grades: [6, 7, 8],
  startLevel: () => 0,
  make(rng, { grade, level }) {
    const type = rng.pick(["scale", "rule", "solve"]);
    const x = rng.int(2, 9);
    const a = level === 0 ? 1 : rng.int(2, 5);
    const b = level === 1 ? (a === 1 ? rng.int(1, 9) : 0) : rng.int(1, 9);
    const d = a * x + b;
    const eqText = `${a === 1 ? "" : a}x${b ? ` + ${b}` : ""} = ${d}`;
    if (a === 1 && b === 0) return this.make(rng, { grade, level });
    if (type === "scale") {
      const steps = [];
      if (b) steps.push({ type: "addConst", value: -b });
      if (a !== 1) steps.push({ type: "div", value: a });
      return build({
        id: `eb:scale:${a}:${b}:${d}`,
        concept: "balance-solve",
        skill: eqSkill(grade),
        level,
        model: "balanceScale",
        params: { a, b, c: 0, d },
        prompt: T(
          `Solve ${eqText} on the scale. Always do the same to both sides.`,
          `Resuelve ${eqText} en la balanza. Siempre haz lo mismo en ambos lados.`,
        ),
        goal: (e) => e.derive().facts.solved,
        solution: steps,
        hints: [
          T(
            "Undo the operations in the opposite order.",
            "Deshaz las operaciones en el orden contrario.",
          ),
          T(
            b ? `First undo the ${b}.` : `Divide both sides by ${a}.`,
            b ? `Primero deshaz el ${b}.` : `Divide ambos lados entre ${a}.`,
          ),
          T(
            "Use the suggested move, then check the new equation.",
            "Usa el movimiento sugerido y mira la nueva ecuación.",
          ),
        ],
        repr: { model: "balanceScale", params: { a, b, c: 0, d } },
        explanation: T(`x = ${x}.`, `x = ${x}.`),
      });
    }
    if (type === "rule") {
      const k = rng.int(2, 6);
      return choice(rng, {
        id: `eb:rule:${eqText}:${k}`,
        concept: "equality",
        skill: eqSkill(grade),
        level,
        prompt: T(
          `${eqText}. Which move keeps the scale balanced?`,
          `${eqText}. ¿Qué movimiento mantiene la balanza equilibrada?`,
        ),
        options: [
          {
            text: T(`Add ${k} to both sides`, `Sumar ${k} a ambos lados`),
            ok: true,
          },
          {
            text: T(
              `Add ${k} to the left side only`,
              `Sumar ${k} solo al lado izquierdo`,
            ),
            ok: false,
            why: T(
              "Changing only one side tips the scale. The equation is no longer true.",
              "Cambiar solo un lado inclina la balanza. La ecuación ya no es verdadera.",
            ),
          },
          {
            text: T(
              `Subtract ${k} from the right side only`,
              `Restar ${k} solo del lado derecho`,
            ),
            ok: false,
            why: T(
              "Changing only one side tips the scale.",
              "Cambiar solo un lado inclina la balanza.",
            ),
          },
        ],
        hints: [
          T(
            "A balanced scale needs the same change on each pan.",
            "Una balanza equilibrada necesita el mismo cambio en cada platillo.",
          ),
          T(
            "Equal things stay equal if you do the same thing to both.",
            "Cosas iguales siguen siendo iguales si haces lo mismo a ambas.",
          ),
          T(
            "Which choice touches both sides?",
            "¿Qué opción toca ambos lados?",
          ),
        ],
        repr: { model: "balanceScale", params: { a, b, c: 0, d } },
        explanation: T(
          "Do the same thing to both sides.",
          "Haz lo mismo en ambos lados.",
        ),
      });
    }
    const skipped = b ? R(d, a) : null;
    return numeric({
      id: `eb:solve:${a}:${b}:${d}`,
      concept: "balance-solve",
      skill: eqSkill(grade),
      level,
      prompt: T(`${eqText}. What is x?`, `${eqText}. ¿Cuánto vale x?`),
      answer: R(x),
      distractors:
        skipped && !skipped.eq(R(x))
          ? [
              {
                value: skipped.toString(),
                why: T(
                  "That skips the first step. Undo the addition before you divide.",
                  "Eso se salta el primer paso. Deshaz la suma antes de dividir.",
                ),
              },
            ]
          : [],
      hints: [
        T(
          "Undo the operations in the opposite order.",
          "Deshaz las operaciones en el orden contrario.",
        ),
        T(
          b
            ? `Subtract ${b} from both sides first.`
            : `Divide both sides by ${a}.`,
          b
            ? `Primero resta ${b} de ambos lados.`
            : `Divide ambos lados entre ${a}.`,
        ),
        T(
          "Check by putting your x back in the equation.",
          "Comprueba poniendo tu x en la ecuación.",
        ),
      ],
      repr: { model: "balanceScale", params: { a, b, c: 0, d } },
      explanation: T(
        `x = ${x}. Check: ${a} × ${x}${b ? ` + ${b}` : ""} = ${d}.`,
        `x = ${x}. Comprobación: ${a} × ${x}${b ? ` + ${b}` : ""} = ${d}.`,
      ),
    });
  },
});

// ============================================================ 7. Graph Explorer (Grades 5-8)
registerFamily({
  id: "graphExplorer",
  title: T("Graph Explorer", "Explorador de gráficas"),
  blurb: T(
    "Plot points, match graphs to tables and discover function rules.",
    "Marca puntos, relaciona gráficas con tablas y descubre reglas de funciones.",
  ),
  grades: [5, 6, 7, 8],
  startLevel: () => 0,
  make(rng, { grade, level }) {
    const types =
      grade === 5
        ? ["plot"]
        : grade === 6
          ? ["plot", "machine"]
          : grade === 7
            ? ["plot", "machine", "table"]
            : ["plot", "machine", "table", "slope"];
    const type = types[rng.int(0, types.length - 1)];
    if (type === "plot") {
      const lo = grade === 5 ? 1 : level === 0 ? 1 : -8;
      const x = rng.int(lo, 9);
      const y = rng.int(lo, 9);
      if (x === 0 && y === 0) return this.make(rng, { grade, level });
      return build({
        id: `ge:plot:${x}:${y}`,
        concept: "plot-point",
        skill: grade >= 6 ? "6:integers" : null,
        level,
        model: "coordinatePlane",
        params: { quadrants: lo < 0 ? 4 : 1, points: [] },
        prompt: T(
          `Plot the point (${x}, ${y}): go ${Math.abs(x)} ${x >= 0 ? "right" : "left"}, then ${Math.abs(y)} ${y >= 0 ? "up" : "down"}.`,
          `Marca el punto (${x}, ${y}): ve ${Math.abs(x)} ${x >= 0 ? "a la derecha" : "a la izquierda"} y luego ${Math.abs(y)} ${y >= 0 ? "hacia arriba" : "hacia abajo"}.`,
        ),
        goal: (e) => e.state.points.some(([px, py]) => px === x && py === y),
        solution: [{ type: "goto", x, y }, { type: "place" }],
        hints: [
          T(
            "The first number is across (x), the second is up or down (y).",
            "El primer número es horizontal (x), el segundo es vertical (y).",
          ),
          T("Start at the origin (0, 0).", "Empieza en el origen (0, 0)."),
          T(
            "Move the cursor, then press Plot a point here.",
            "Mueve el cursor y presiona Marcar un punto aquí.",
          ),
        ],
        explanation: T(
          `(${x}, ${y}) is ${Math.abs(x)} ${x >= 0 ? "right" : "left"} and ${Math.abs(y)} ${y >= 0 ? "up" : "down"} from the origin.`,
          `(${x}, ${y}) está ${Math.abs(x)} ${x >= 0 ? "a la derecha" : "a la izquierda"} y ${Math.abs(y)} ${y >= 0 ? "arriba" : "abajo"} del origen.`,
        ),
      });
    }
    if (type === "machine") {
      const m = rng.int(2, level === 2 ? 6 : 4);
      const b = rng.int(0, level === 0 ? 0 : 5);
      const t = rng.int(7, 12);
      return numeric({
        id: `ge:machine:${m}:${b}:${t}`,
        concept: "function-rule",
        skill: "6:evaluate",
        level,
        tool: { model: "functionMachine", params: { m, b, hidden: true } },
        prompt: T(
          `A machine has a hidden rule. Feed it numbers to discover the rule, then tell what it outputs for ${t}.`,
          `Una máquina tiene una regla oculta. Introduce números para descubrirla y di qué sale con ${t}.`,
        ),
        answer: R(m * t + b),
        distractors: [
          {
            value: String(m + t + b),
            why: T(
              "That adds. Look at how the outputs grow when the input goes up by 1.",
              "Eso suma. Mira cómo crecen las salidas cuando la entrada sube 1.",
            ),
          },
        ],
        hints: [
          T(
            "Try 0 and 1 and compare the outputs.",
            "Prueba 0 y 1 y compara las salidas.",
          ),
          T(
            "The change in output for each 1 step is the multiplier.",
            "El cambio de salida por cada paso de 1 es el multiplicador.",
          ),
          T(
            "What is the output at 0? That is added at the end.",
            "¿Cuál es la salida en 0? Eso se suma al final.",
          ),
        ],
        explanation: T(
          `output = ${m} × input${b ? ` + ${b}` : ""} = ${m * t + b}.`,
          `salida = ${m} × entrada${b ? ` + ${b}` : ""} = ${m * t + b}.`,
        ),
      });
    }
    if (type === "table") {
      const m = rng.pick([2, 3, 4, 5]);
      const b = grade >= 8 && rng.int(0, 1) ? rng.int(1, 5) : 0;
      const rows = [1, 2, 3]
        .map((x) => `x = ${x}, y = ${m * x + b}`)
        .join("; ");
      const eq = (mm, bb) => `y = ${mm}x${bb ? ` + ${bb}` : ""}`;
      const options = [
        { text: T(eq(m, b)), ok: true },
        {
          text: T(eq(m + 1, b)),
          ok: false,
          why: T(
            "Try x = 1 in this equation: it does not give the table's y.",
            "Prueba x = 1 en esta ecuación: no da la y de la tabla.",
          ),
        },
        {
          text: T(b ? eq(m, 0) : eq(m, 1)),
          ok: false,
          why: T(
            "Check a row of the table against this equation.",
            "Comprueba una fila de la tabla con esta ecuación.",
          ),
        },
      ];
      return choice(rng, {
        id: `ge:table:${m}:${b}`,
        concept: "table-equation",
        skill: grade >= 8 ? "8:functions" : "7:proportions",
        level,
        prompt: T(
          `Which equation matches the table? ${rows}.`,
          `¿Qué ecuación coincide con la tabla? ${rows}.`,
        ),
        options,
        hints: [
          T(
            "See how y changes when x goes up by 1.",
            "Mira cómo cambia y cuando x sube 1.",
          ),
          T(
            "That change is the number in front of x.",
            "Ese cambio es el número delante de x.",
          ),
          T("Test x = 1 in each equation.", "Prueba x = 1 en cada ecuación."),
        ],
        repr: { model: "linearGraph", params: { m, b, x: 1 } },
        explanation: T(
          `${eq(m, b)} works for every row.`,
          `${eq(m, b)} funciona en todas las filas.`,
        ),
      });
    }
    // slope
    const x1 = rng.int(-4, 2);
    const dx = rng.int(1, 4);
    const y1 = rng.int(-5, 5);
    const dy = rng.int(-6, 6);
    if (dy === 0) return this.make(rng, { grade, level });
    const slope = R(dy, dx);
    return numeric({
      id: `ge:slope:${x1}:${y1}:${dx}:${dy}`,
      concept: "slope",
      skill: "8:slope",
      level,
      simplified: true,
      prompt: T(
        `Find the slope through (${x1}, ${y1}) and (${x1 + dx}, ${y1 + dy}).`,
        `Halla la pendiente por (${x1}, ${y1}) y (${x1 + dx}, ${y1 + dy}).`,
      ),
      answer: slope,
      distractors: [
        {
          value: R(dx, dy).toString(),
          why: T(
            "That is run over rise. Slope is rise over run.",
            "Eso es avance sobre elevación. La pendiente es elevación sobre avance.",
          ),
        },
      ],
      hints: [
        T("Slope is rise over run.", "La pendiente es elevación sobre avance."),
        T(
          "Rise is the change in y; run is the change in x.",
          "La elevación es el cambio en y; el avance es el cambio en x.",
        ),
        T(
          "Subtract in the same order for both.",
          "Resta en el mismo orden en ambos.",
        ),
      ],
      repr: {
        model: "linearGraph",
        params: { m: slope.toString(), b: 0, x: 1 },
      },
      explanation: T(`${dy} ÷ ${dx} = ${slope}.`, `${dy} ÷ ${dx} = ${slope}.`),
    });
  },
});

// ============================================================ 8. Geometry Builder (Grades 3-8)
registerFamily({
  id: "geometryBuilder",
  title: T("Geometry Builder", "Constructor de geometría"),
  blurb: T(
    "Build shapes to match perimeter, area, angles and volume.",
    "Construye figuras que cumplan perímetro, área, ángulos y volumen.",
  ),
  grades: [3, 4, 5, 6, 7, 8],
  startLevel: () => 0,
  make(rng, { grade, level }) {
    const pool =
      grade <= 4
        ? ["rect", "words", "decomp"]
        : grade === 5
          ? ["rect", "volume", "decomp"]
          : grade === 6
            ? ["rect", "volume", "triangle", "decomp"]
            : ["volume", "triangle", "angle", "decomp"];
    const type = pool[rng.int(0, pool.length - 1)];
    if (type === "rect") {
      const w = rng.int(2, level === 2 ? 11 : 8);
      const h = rng.int(2, level === 2 ? 9 : 6);
      if (w === h && level === 0) return this.make(rng, { grade, level });
      const A = w * h;
      const P = 2 * (w + h);
      return build({
        id: `gb:rect:${A}:${P}`,
        concept: "area-perimeter",
        skill: "3:area",
        level,
        model: "areaPerimeter",
        params: { w: 1, h: 1 },
        prompt: T(
          `Build a rectangle with area ${A} and perimeter ${P}.`,
          `Construye un rectángulo con área ${A} y perímetro ${P}.`,
        ),
        goal: (e) =>
          e.state.w * e.state.h === A && 2 * (e.state.w + e.state.h) === P,
        solution: [
          { type: "setW", value: w },
          { type: "setH", value: h },
        ],
        hints: [
          T(
            "Area is width times height; perimeter is the distance around.",
            "El área es ancho por alto; el perímetro es la distancia alrededor.",
          ),
          T(
            `Half the perimeter is ${P / 2}: the width plus the height.`,
            `La mitad del perímetro es ${P / 2}: el ancho más el alto.`,
          ),
          T(
            `Find two numbers that add to ${P / 2} and multiply to ${A}.`,
            `Halla dos números que sumen ${P / 2} y multipliquen ${A}.`,
          ),
        ],
        repr: { model: "areaPerimeter", params: { w, h } },
        explanation: T(
          `${w} × ${h} = ${A} and 2 × (${w} + ${h}) = ${P}.`,
          `${w} × ${h} = ${A} y 2 × (${w} + ${h}) = ${P}.`,
        ),
      });
    }
    if (type === "words") {
      return choice(rng, {
        id: `gb:words:${rng.int(1, 999)}`,
        concept: "area-vs-perimeter",
        skill: "3:perimeter",
        level,
        prompt: T(
          "Which measures the distance around a shape?",
          "¿Qué mide la distancia alrededor de una figura?",
        ),
        options: [
          { text: T("Perimeter", "Perímetro"), ok: true },
          {
            text: T("Area", "Área"),
            ok: false,
            why: T(
              "Area counts the squares inside.",
              "El área cuenta los cuadrados de adentro.",
            ),
          },
          {
            text: T("Volume", "Volumen"),
            ok: false,
            why: T(
              "Volume is for solids: it counts cubes.",
              "El volumen es para sólidos: cuenta cubos.",
            ),
          },
        ],
        hints: [
          T(
            "Think of walking around the edge.",
            "Piensa en caminar por el borde.",
          ),
          T(
            "Perimeter has the word 'meter' (measure) around.",
            "Perímetro es la medida alrededor.",
          ),
          T(
            "Area is inside; perimeter is around.",
            "El área es adentro; el perímetro es alrededor.",
          ),
        ],
        repr: { model: "areaPerimeter", params: { w: 4, h: 3 } },
        explanation: T(
          "Perimeter is the distance around.",
          "El perímetro es la distancia alrededor.",
        ),
      });
    }
    if (type === "volume") {
      const l = rng.int(2, 5);
      const w = rng.int(2, 4);
      const h = rng.int(2, 4);
      const V = l * w * h;
      return build({
        id: `gb:volume:${V}:${l}`,
        concept: "volume",
        skill: "5:volume",
        level,
        model: "prismVolume",
        params: { l: 1, w: 1, h: 1, unit: 1 },
        prompt: T(
          `Build a prism with volume ${V} cubic units. Any size that works is fine.`,
          `Construye un prisma con volumen ${V} unidades cúbicas. Sirve cualquier tamaño que funcione.`,
        ),
        goal: (e) => e.state.l * e.state.w * e.state.h === V,
        solution: [
          { type: "setL", value: l },
          { type: "setW", value: w },
          { type: "setH", value: h },
        ],
        hints: [
          T(
            "Volume is length × width × height.",
            "El volumen es largo × ancho × alto.",
          ),
          T(`Find three factors of ${V}.`, `Halla tres factores de ${V}.`),
          T(`Try ${l} × ${w} × ${h}.`, `Prueba ${l} × ${w} × ${h}.`),
        ],
        repr: { model: "prismVolume", params: { l, w, h, unit: 1 } },
        explanation: T(
          `${l} × ${w} × ${h} = ${V}.`,
          `${l} × ${w} × ${h} = ${V}.`,
        ),
      });
    }
    if (type === "triangle") {
      const b = rng.int(3, 12);
      const h = rng.pick([2, 4, 6, 8]);
      return numeric({
        id: `gb:tri:${b}:${h}`,
        concept: "triangle-area",
        skill: "6:triangle-area",
        level,
        prompt: T(
          `A triangle has base ${b} and height ${h}. What is its area?`,
          `Un triángulo tiene base ${b} y altura ${h}. ¿Cuál es su área?`,
        ),
        answer: R(b * h, 2),
        distractors: [
          {
            value: String(b * h),
            why: T(
              "That is a parallelogram. A triangle is half of it.",
              "Eso es un paralelogramo. Un triángulo es la mitad.",
            ),
          },
        ],
        hints: [
          T(
            "Two triangles make a parallelogram.",
            "Dos triángulos forman un paralelogramo.",
          ),
          T(
            "Area of a triangle = ½ × base × height.",
            "Área de un triángulo = ½ × base × altura.",
          ),
          T(
            `${b} × ${h} first, then half.`,
            `Primero ${b} × ${h} y luego la mitad.`,
          ),
        ],
        repr: { model: "triangleArea", params: { b, h, slant: 2 } },
        explanation: T(
          `½ × ${b} × ${h} = ${R(b * h, 2)}.`,
          `½ × ${b} × ${h} = ${R(b * h, 2)}.`,
        ),
      });
    }
    if (type === "angle") {
      const deg = rng.pick([30, 45, 60, 75, 110, 120, 135, 150, 210]);
      return build({
        id: `gb:angle:${deg}`,
        concept: "angle-measure",
        skill: grade >= 8 ? "8:angle-relations" : null,
        level,
        model: "angleTool",
        params: { deg: 90 },
        prompt: T(`Make a ${deg}° angle.`, `Haz un ángulo de ${deg}°.`),
        goal: (e) => e.state.deg === deg,
        solution: [{ type: "set", value: deg }],
        hints: [
          T(
            "A right angle is 90°; a straight angle is 180°.",
            "Un ángulo recto mide 90°; uno llano mide 180°.",
          ),
          T(
            `${deg} is ${deg < 90 ? "less" : "more"} than 90°.`,
            `${deg} es ${deg < 90 ? "menor" : "mayor"} que 90°.`,
          ),
          T(
            "Open or close the angle in steps and watch the number.",
            "Abre o cierra el ángulo por pasos y mira el número.",
          ),
        ],
        explanation: T(
          `The angle is ${deg < 90 ? "acute" : deg === 90 ? "right" : deg < 180 ? "obtuse" : "reflex"}.`,
          `El ángulo es ${deg < 90 ? "agudo" : deg === 90 ? "recto" : deg < 180 ? "obtuso" : "cóncavo"}.`,
        ),
      });
    }
    // decomp
    const W = rng.int(6, 10);
    const H = rng.int(5, 8);
    const nw = rng.int(2, W - 3);
    const nh = rng.int(2, H - 2);
    return numeric({
      id: `gb:decomp:${W}:${H}:${nw}:${nh}`,
      concept: "composite-area",
      skill: "3:area",
      level,
      tool: { model: "areaDecomp", params: { W, H, nw, nh } },
      prompt: T(
        `An L-shaped figure is a ${W} by ${H} rectangle with a ${nw} by ${nh} corner removed. What is its area?`,
        `Una figura en L es un rectángulo de ${W} por ${H} al que se le quitó una esquina de ${nw} por ${nh}. ¿Cuál es su área?`,
      ),
      answer: R(W * H - nw * nh),
      distractors: [
        {
          value: String(W * H),
          why: T(
            "That is the whole rectangle. Take away the corner that was removed.",
            "Eso es todo el rectángulo. Quita la esquina que se recortó.",
          ),
        },
      ],
      hints: [
        T(
          "Split the L into two rectangles, or subtract the corner.",
          "Parte la L en dos rectángulos o resta la esquina.",
        ),
        T(
          "Find each rectangle's area and add.",
          "Halla el área de cada rectángulo y suma.",
        ),
        T(
          `Big rectangle ${W * H}, corner ${nw * nh}.`,
          `Rectángulo grande ${W * H}, esquina ${nw * nh}.`,
        ),
      ],
      explanation: T(
        `${W * H} − ${nw * nh} = ${W * H - nw * nh}.`,
        `${W * H} − ${nw * nh} = ${W * H - nw * nh}.`,
      ),
    });
  },
});

// ============================================================ 9. Data Detective (Grades 6-8)
registerFamily({
  id: "dataDetective",
  title: T("Data Detective", "Detective de datos"),
  blurb: T(
    "Read dot plots, box plots and scatter plots to solve evidence-based puzzles.",
    "Lee diagramas de puntos, de caja y de dispersión para resolver acertijos con evidencia.",
  ),
  grades: [6, 7, 8],
  startLevel: () => 0,
  make(rng, { grade, level }) {
    const type = rng.pick(
      grade >= 8
        ? ["meanBuild", "iqr", "median", "scatter"]
        : ["meanBuild", "iqr", "median", "mean"],
    );
    const dataset = (n, lo = 2, hi = 18) =>
      Array.from({ length: n }, () => rng.int(lo, hi)).sort((a, b) => a - b);
    if (type === "meanBuild") {
      for (let tries = 0; tries < 200; tries += 1) {
        const n = rng.int(4, 6);
        const data = dataset(n);
        const S = data.reduce((a, b) => a + b, 0);
        const T0 = rng.int(4, 14);
        const v = T0 * (n + 1) - S;
        if (v < 0 || v > 20 || R(S, n).eq(R(T0))) continue;
        return build({
          id: `dd:meanbuild:${data.join(",")}:${T0}`,
          concept: "mean-balance",
          skill: null,
          level,
          model: "dotPlot",
          params: { min: 0, max: 20, data },
          prompt: T(
            `Add one dot so the mean of the data becomes ${T0}.`,
            `Agrega un punto para que la media de los datos sea ${T0}.`,
          ),
          goal: (e) => e.derive().facts.mean.eq(R(T0)),
          solution: [{ type: "add", value: v }],
          hints: [
            T(
              "The mean is the total divided by how many values.",
              "La media es el total dividido entre la cantidad de valores.",
            ),
            T(
              `With one more dot you need a total of ${T0} × ${n + 1}.`,
              `Con un punto más necesitas un total de ${T0} × ${n + 1}.`,
            ),
            T(
              "Subtract the current total to find the missing value.",
              "Resta el total actual para hallar el valor que falta.",
            ),
          ],
          repr: { model: "dotPlot", params: { min: 0, max: 20, data } },
          explanation: T(
            `${T0} × ${n + 1} − ${S} = ${v}.`,
            `${T0} × ${n + 1} − ${S} = ${v}.`,
          ),
        });
      }
    }
    if (type === "iqr") {
      const data = dataset(rng.pick([7, 8, 9, 11]), 3, 30);
      const q = quartiles(data);
      const iqr = q.q3.sub(q.q1);
      return numeric({
        id: `dd:iqr:${data.join(",")}`,
        concept: "iqr",
        skill: null,
        level,
        tool: { model: "boxPlot", params: { min: 0, max: 30, data } },
        prompt: T(
          `Data: ${data.join(", ")}. What is the interquartile range (Q3 − Q1)?`,
          `Datos: ${data.join(", ")}. ¿Cuál es el rango intercuartil (Q3 − Q1)?`,
        ),
        answer: iqr,
        distractors: [
          {
            value: String(data.at(-1) - data[0]),
            why: T(
              "That is the range (largest − smallest). The IQR uses the quartiles.",
              "Ese es el rango (mayor − menor). El rango intercuartil usa los cuartiles.",
            ),
          },
        ],
        hints: [
          T(
            "Find the median, then the median of each half.",
            "Halla la mediana y luego la mediana de cada mitad.",
          ),
          T(
            "Q1 is the median of the lower half, Q3 of the upper half.",
            "Q1 es la mediana de la mitad inferior y Q3 de la superior.",
          ),
          T("Subtract Q1 from Q3.", "Resta Q1 de Q3."),
        ],
        explanation: T(
          `Q1 = ${q.q1}, Q3 = ${q.q3}, IQR = ${iqr}.`,
          `Q1 = ${q.q1}, Q3 = ${q.q3}, RIC = ${iqr}.`,
        ),
      });
    }
    if (type === "median") {
      const n = rng.pick([5, 6, 7, 8]);
      const data = dataset(n, 2, 25);
      const med = median(data);
      const shuffled = shuffle(rng, data);
      return numeric({
        id: `dd:median:${shuffled.join(",")}`,
        concept: "median",
        skill: null,
        level,
        tool: { model: "dotPlot", params: { min: 0, max: 30, data } },
        prompt: T(
          `Find the median of ${shuffled.join(", ")}.`,
          `Halla la mediana de ${shuffled.join(", ")}.`,
        ),
        answer: med,
        distractors:
          n % 2 && shuffled[(n - 1) / 2] !== data[(n - 1) / 2]
            ? [
                {
                  value: String(shuffled[(n - 1) / 2]),
                  why: T(
                    "That is the middle of the list as written. Put the numbers in order first.",
                    "Ese es el del medio de la lista tal como está escrita. Primero ordena los números.",
                  ),
                },
              ]
            : [],
        hints: [
          T(
            "Order the numbers from least to greatest.",
            "Ordena los números de menor a mayor.",
          ),
          T(
            "The median is the middle value.",
            "La mediana es el valor del medio.",
          ),
          T(
            "With two middle values, take the number halfway between them.",
            "Con dos valores en el medio, toma el número que está a la mitad entre ellos.",
          ),
        ],
        explanation: T(
          `Ordered: ${data.join(", ")}. Median ${med}.`,
          `Ordenados: ${data.join(", ")}. Mediana ${med}.`,
        ),
      });
    }
    if (type === "mean") {
      const n = rng.int(4, 6);
      const m = rng.int(4, 14);
      const data = [];
      let rest = m * n;
      for (let i = 0; i < n - 1; i += 1) {
        const v = rng.int(Math.max(1, m - 4), m + 4);
        data.push(v);
        rest -= v;
      }
      if (rest < 1) return this.make(rng, { grade, level });
      data.push(rest);
      data.sort((a, b) => a - b);
      return numeric({
        id: `dd:mean:${data.join(",")}`,
        concept: "mean",
        skill: null,
        level,
        tool: { model: "dotPlot", params: { min: 0, max: 30, data } },
        prompt: T(
          `What is the mean of ${data.join(", ")}?`,
          `¿Cuál es la media de ${data.join(", ")}?`,
        ),
        answer: mean(data),
        distractors: [
          {
            value: median(data).toString(),
            why: T(
              "That is the median. The mean shares the total equally.",
              "Esa es la mediana. La media reparte el total por igual.",
            ),
          },
        ].filter((d) => !median(data).eq(mean(data))),
        hints: [
          T("Add all the values.", "Suma todos los valores."),
          T(
            "Divide the total by how many values there are.",
            "Divide el total entre cuántos valores hay.",
          ),
          T(
            "The mean is the fair share.",
            "La media es el reparto equitativo.",
          ),
        ],
        explanation: T(
          `${data.reduce((a, b) => a + b, 0)} ÷ ${n} = ${mean(data)}.`,
          `${data.reduce((a, b) => a + b, 0)} ÷ ${n} = ${mean(data)}.`,
        ),
      });
    }
    // scatter association (grade 8)
    const kind = rng.pick(["positive", "negative", "none"]);
    const pts = Array.from({ length: 8 }, (_, i) => {
      const x = i + 1;
      const noise = rng.int(-1, 1);
      const y =
        kind === "positive"
          ? Math.max(0, Math.min(10, x + noise))
          : kind === "negative"
            ? Math.max(0, Math.min(10, 9 - x + noise))
            : 5 + (i % 2 ? 1 : -1) * rng.int(0, 1);
      return [x, y];
    });
    const n = R(pts.length);
    const sx = pts.reduce((a, [x]) => a.add(x), R(0));
    const sy = pts.reduce((a, [, y]) => a.add(y), R(0));
    const sxy = pts.reduce((a, [x, y]) => a.add(R(x).mul(y)), R(0));
    const sxx = pts.reduce((a, [x]) => a.add(R(x).mul(x)), R(0));
    const slope = n
      .mul(sxy)
      .sub(sx.mul(sy))
      .div(n.mul(sxx).sub(sx.mul(sx)));
    const actual = slope.gt(R(1, 4))
      ? "positive"
      : slope.lt(R(-1, 4))
        ? "negative"
        : "none";
    if (actual !== kind) return this.make(rng, { grade, level });
    return choice(rng, {
      id: `dd:scatter:${pts.map((p) => p.join("_")).join(",")}`,
      concept: "association",
      skill: "8:association",
      level,
      tool: { model: "scatterPlot", params: { points: pts } },
      prompt: T(
        `Points: ${pts.map((p) => `(${p[0]}, ${p[1]})`).join(" ")}. What does the scatter plot show?`,
        `Puntos: ${pts.map((p) => `(${p[0]}, ${p[1]})`).join(" ")}. ¿Qué muestra el diagrama de dispersión?`,
      ),
      options: [
        {
          text: T("A positive association", "Una asociación positiva"),
          ok: kind === "positive",
          why:
            kind !== "positive"
              ? T(
                  "Check whether y goes up as x goes up.",
                  "Comprueba si y sube cuando x sube.",
                )
              : undefined,
        },
        {
          text: T("A negative association", "Una asociación negativa"),
          ok: kind === "negative",
          why:
            kind !== "negative"
              ? T(
                  "Check whether y goes down as x goes up.",
                  "Comprueba si y baja cuando x sube.",
                )
              : undefined,
        },
        {
          text: T("No clear association", "Ninguna asociación clara"),
          ok: kind === "none",
          why:
            kind !== "none"
              ? T(
                  "The points follow a clear direction.",
                  "Los puntos siguen una dirección clara.",
                )
              : undefined,
        },
      ],
      hints: [
        T(
          "Look at what y does as x increases.",
          "Mira qué hace y cuando x aumenta.",
        ),
        T(
          "Show the line of best fit in the plot.",
          "Muestra la recta de mejor ajuste en el diagrama.",
        ),
        T(
          "A rising line means positive; falling means negative.",
          "Una recta ascendente es positiva; descendente es negativa.",
        ),
      ],
      explanation: T(
        `The fitted slope is ${slope.toDecimal(2)}: ${kind}.`,
        `La pendiente ajustada es ${slope.toDecimal(2)}: ${kind}.`,
      ),
    });
  },
});

// ============================================================ 10. Math Strategy Tournament (Grades 1-8)
const GRADE_SKILLS = (grade) => {
  const nodes = buildGraph().nodes;
  return ALL_SKILLS.filter(
    (s) => s.grade === grade && nodes.get(`${s.grade}:${s.id}`)?.models.length,
  );
};
registerFamily({
  id: "strategyTournament",
  title: T("Math Strategy Tournament", "Torneo de estrategias"),
  blurb: T(
    "Choose the best model for each problem, solve it, and explain. Thinking counts, not speed.",
    "Elige el mejor modelo para cada problema, resuélvelo y explica. Cuenta pensar, no la velocidad.",
  ),
  grades: [1, 2, 3, 4, 5, 6, 7, 8],
  startLevel: () => 1,
  make(rng, { grade, level, round, variant = 0, concept = null, seed = 1 }) {
    const pool = GRADE_SKILLS(grade);
    // Both halves of a round (choose a model, then solve) use the same problem, chosen only from the round number.
    const pair = round >> 1;
    for (let attempt = variant * 7; attempt < variant * 7 + 50; attempt += 1) {
      const pr = seeded(5003 * (pair + 1) + 131 * grade + attempt * 17 + seed * 7919);
      const wanted = concept && concept.startsWith("strategy:") ? pool.find((s) => `${s.grade}:${s.id}` === concept.slice(9)) : null;
      const skill = wanted || pool[pr.int(0, pool.length - 1)];
      const problem = generateProblem(
        skill,
        seededRandom(pair * 977 + grade * 31 + attempt * 13 + 1 + seed * 101),
        Math.min(2, level),
      );
      const answer = parseRational(String(problem.answers[0]));
      if (!answer || problem.kind === "choice") continue;
      const key = `${skill.grade}:${skill.id}`;
      const modelIds = buildGraph().nodes.get(key).models;
      const good = modelIds[0];
      const others = shuffle(
        pr,
        [
          "numberLine",
          "array",
          "fractionBar",
          "baseTen",
          "balanceScale",
          "tapeRatio",
          "areaPerimeter",
          "dotPlot",
        ].filter((m) => !modelIds.includes(m)),
      ).slice(0, 2);
      if (round % 2 === 0) {
        const options = [good, ...others].map((id) => ({
          text: getModel(id).title,
          ok: id === good,
          why:
            id === good
              ? undefined
              : T(
                  "That model shows a different idea. Which model shows the quantities in this problem?",
                  "Ese modelo muestra otra idea. ¿Qué modelo muestra las cantidades de este problema?",
                ),
        }));
        return choice(rng, {
          id: `st:model:${key}:${pair}:${problem.question}`,
          concept: `strategy:${key}`,
          skill: null,
          level,
          prompt: T(
            `Problem: ${problem.question}. Which model would help you think about it?`,
            `Problema: ${problem.question}. ¿Qué modelo te ayudaría a pensarlo?`,
          ),
          options,
          hints: [
            T(
              "Which quantities does the problem talk about?",
              "¿De qué cantidades habla el problema?",
            ),
            T(
              "Pick the model that shows those quantities.",
              "Elige el modelo que muestra esas cantidades.",
            ),
            T(
              "Several models can work; pick the one that fits best.",
              "Pueden servir varios modelos; elige el que mejor encaje.",
            ),
          ],
          repr: {
            model: good,
            params: getModel(good).generate(seeded(7), grade),
          },
          explanation: T(
            `${getModel(good).title.en} shows the idea of ${skill.title.toLowerCase()}.`,
            `${getModel(good).title.es} muestra la idea de ${skill.title.toLowerCase()}.`,
          ),
        });
      }
      return numeric({
        id: `st:solve:${key}:${pair}:${problem.question}`,
        concept: `strategy:${key}`,
        skill: key,
        level,
        simplified: problem.kind === "fraction",
        prompt: T(problem.question),
        answer,
        hints: [
          T(
            problem.hint || "Use the model you chose.",
            problem.hint || "Usa el modelo que elegiste.",
          ),
          T(
            "Draw or build the model and check each step.",
            "Dibuja o construye el modelo y comprueba cada paso.",
          ),
          T(
            problem.steps?.[0] || "Start with the first step.",
            problem.steps?.[0] || "Empieza con el primer paso.",
          ),
        ],
        repr: {
          model: good,
          params: getModel(good).generate(seeded(7), grade),
        },
        explanation: T(
          problem.explanation || `The answer is ${problem.answers[0]}.`,
        ),
      });
    }
    throw new Error("No solvable problem found for the tournament");
  },
});

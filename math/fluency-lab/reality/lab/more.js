// Build the Answer and Reverse Math experiences beyond the flagships. Validity always comes from the constructed
// object's own properties (an exact value, a solution, a constant ratio), never from one stored answer.
import { L, R, explain, frame, hint, idea, task, transfer, w, done, notYet } from "./authoring.js";

const T = (en, es) => L(en, es);
const distinctDens = (cases, value) => new Set(cases.filter((c) => c.value.eq(value)).map((c) => c.den));

const quick = (spec) => ({
  steps: [...spec.goals.map((g) => task(g.id, g.goal, g.check, g.hints || [], g.params ? { params: g.params } : {})), spec.explain, spec.transfer],
  ...spec,
});

// ---- two different fractions equivalent to 3/4 (Reverse Math + Build the Answer) --------------------------------------------
export const reverseFractions = quick({
  id: "reverse-fractions",
  saves: true,
  innovation: "reverse",
  tags: ["build"],
  title: T("Reverse Math: fractions equal to 3/4", "Matemática al revés: fracciones iguales a 3/4"),
  blurb: T("Construct different fractions that all equal 3/4, then find a big one.", "Construye fracciones diferentes que sean todas iguales a 3/4 y encuentra una grande."),
  model: "fraction",
  params: { den: 1 },
  grades: [3, 4, 5],
  skills: [],
  goals: [
    {
      id: "two",
      goal: T("Build two different fractions that are equal to 3/4. Press Save after each one.", "Construye dos fracciones diferentes que sean iguales a 3/4. Pulsa Guardar después de cada una."),
      check: (s, d) => (distinctDens(d.cases, R(3, 4)).size >= 2 ? done(T("Two different fractions, both worth 3/4.", "Dos fracciones diferentes, ambas valen 3/4.")) : notYet(T(`${distinctDens(d.cases, R(3, 4)).size} of 2 saved. Now showing ${d.num}/${d.den}, which equals ${d.decimal ?? "?"}.`, `${distinctDens(d.cases, R(3, 4)).size} de 2 guardadas. Ahora se muestra ${d.num}/${d.den}, que es igual a ${d.decimal ?? "?"}.`))),
      hints: [hint("Cut the whole into 4, shade 3, then cut every part in 2.", "Corta el entero en 4, sombrea 3 y luego corta cada parte en 2.")],
    },
    {
      id: "big",
      goal: T("Now save one that uses more than 10 equal parts.", "Ahora guarda una que use más de 10 partes iguales."),
      check: (s, d) => (d.cases.some((c) => c.value.eq(R(3, 4)) && c.den > 10) ? done(T("A big one: the value is still 3/4.", "Una grande: el valor sigue siendo 3/4.")) : notYet(T("You need an equal fraction with more than 10 parts.", "Necesitas una fracción igual con más de 10 partes."))),
      hints: [hint("12 parts with 9 shaded, or 16 parts with 12 shaded.", "12 partes con 9 sombreadas, o 16 partes con 12 sombreadas.")],
    },
  ],
  explain: explain(
    "why",
    T("How do you know your fractions are all equal to 3/4?", "¿Cómo sabes que tus fracciones son todas iguales a 3/4?"),
    [frame(T("They are equal because the top and the bottom were both multiplied by the", "Son iguales porque el numerador y el denominador se multiplicaron por el"), [w("same number", "mismo número", true), w("same number added", "mismo número sumado"), w("different numbers", "números diferentes")])],
    [idea("same", ["same", "equal", "igual", "mismo"]), idea("mult", ["multipl", "times", "×", "veces"]), idea("top", ["top", "bottom", "numerator", "denominator", "numerador", "denominador", "arriba", "abajo"])],
    { need: 2 },
  ),
  transfer: transfer("new", (rng) => {
    const [a, b] = rng.pick([[2, 3], [3, 5], [1, 2], [5, 6], [2, 5]]);
    return {
      kind: "build",
      prompt: T(`Save two different fractions that equal ${a}/${b}.`, `Guarda dos fracciones diferentes que sean iguales a ${a}/${b}.`),
      params: { den: 1 },
      check: (s, d) => distinctDens(d.cases, R(a, b)).size >= 2,
      hints: [hint(`Start with ${b} equal parts and shade ${a}.`, `Empieza con ${b} partes iguales y sombrea ${a}.`)],
    };
  }),
});

// ---- Build the Answer: decimals as fractional models ------------------------------------------------------------------------------
export const buildDecimalFraction = quick({
  id: "build-decimal-fraction",
  saves: true,
  innovation: "build",
  title: T("Build the answer: show 0.6 as a fraction", "Construye la respuesta: muestra 0.6 como fracción"),
  blurb: T("Shade a bar to show a decimal, then build a different fraction for the same decimal.", "Sombrea una barra para mostrar un decimal y construye otra fracción para el mismo decimal."),
  model: "fraction",
  params: { den: 1 },
  grades: [4, 5],
  skills: ["5:decimal-place"],
  goals: [
    {
      id: "first",
      goal: T("Shade a bar to show 0.6. Check the decimal under the bar. Save your fraction.", "Sombrea una barra para mostrar 0.6. Mira el decimal debajo de la barra. Guarda tu fracción."),
      check: (s, d) => (d.cases.some((c) => c.value.eq(R(3, 5))) ? done(T("Your bar shows 0.6.", "Tu barra muestra 0.6.")) : notYet(T(`Your bar shows ${d.decimal ?? "?"}. Aim for 0.6.`, `Tu barra muestra ${d.decimal ?? "?"}. Busca 0.6.`))),
      hints: [hint("0.6 means 6 tenths: 10 equal parts, 6 shaded.", "0.6 significa 6 décimos: 10 partes iguales, 6 sombreadas.")],
    },
    {
      id: "second",
      goal: T("Build a different fraction that also shows 0.6 and save it.", "Construye otra fracción distinta que también muestre 0.6 y guárdala."),
      check: (s, d) => (distinctDens(d.cases, R(3, 5)).size >= 2 ? done(T("Two fractions, one decimal: 0.6.", "Dos fracciones, un decimal: 0.6.")) : notYet(T("Use a different number of equal parts.", "Usa un número distinto de partes iguales."))),
      hints: [hint("5 parts with 3 shaded also works.", "5 partes con 3 sombreadas también sirve.")],
    },
  ],
  explain: explain(
    "why",
    T("Why can two different fractions show the same decimal?", "¿Por qué dos fracciones diferentes pueden mostrar el mismo decimal?"),
    [frame(T("They name the same", "Nombran la misma"), [w("amount of the whole", "cantidad del entero", true), w("number of parts", "cantidad de partes"), w("denominator", "denominador")])],
    [idea("same", ["same", "equal", "igual", "misma"]), idea("amount", ["amount", "part of the whole", "value", "cantidad", "valor", "parte del entero"])],
    { need: 2 },
  ),
  transfer: transfer("new", (rng) => {
    const dec = rng.pick([["0.5", R(1, 2)], ["0.25", R(1, 4)], ["0.75", R(3, 4)], ["0.4", R(2, 5)], ["0.8", R(4, 5)], ["0.125", R(1, 8)]]);
    return {
      kind: "build",
      prompt: T(`Shade a bar to show ${dec[0]}.`, `Sombrea una barra para mostrar ${dec[0]}.`),
      params: { den: 1 },
      check: (s, d) => d.value.eq(dec[1]),
      hints: [hint("Say the decimal as a fraction of 10 or 100 first.", "Primero di el decimal como fracción de 10 o 100.")],
    };
  }),
});

// ---- Build the Answer: a number that meets place-value clues -------------------------------------------------------------------
export const buildPlaceNumber = quick({
  id: "build-place-number",
  innovation: "build",
  title: T("Build the answer: a number from clues", "Construye la respuesta: un número con pistas"),
  blurb: T("Build any number that fits the place-value clues, then build another.", "Construye cualquier número que cumpla las pistas de valor posicional y luego otro."),
  model: "place",
  params: { set: "whole", rows: ["T"] },
  grades: [2, 3],
  skills: ["2:place-1000"],
  goals: [
    {
      id: "clues",
      goal: T("Build a number with 3 hundreds, more than 4 tens and fewer than 5 ones. No place may hold 10 or more.", "Construye un número con 3 centenas, más de 4 decenas y menos de 5 unidades. Ningún lugar puede tener 10 o más."),
      check: (s, d) => (d.counts && d.regrouped && d.counts.hundreds === 3 && d.counts.tens > 4 && d.counts.ones < 5 ? done(T(`${d.totalText} fits every clue.`, `${d.totalText} cumple todas las pistas.`)) : notYet(T(`You have ${d.totalText}. Check the clues.`, `Tienes ${d.totalText}. Revisa las pistas.`))),
      hints: [hint("Put 3 hundreds on the mat first.", "Pon primero 3 centenas en el tablero.")],
    },
    {
      id: "another",
      goal: T("Build a different number that fits the same clues.", "Construye un número diferente que cumpla las mismas pistas."),
      check: (s, d, session) => (d.counts && d.regrouped && d.counts.hundreds === 3 && d.counts.tens > 4 && d.counts.ones < 5 && String(d.total) !== "3" ? done(T("Another number that fits.", "Otro número que cumple.")) : notYet(T("Change the tens or the ones.", "Cambia las decenas o las unidades."))),
      hints: [hint("Try 5 tens and 2 ones, or 7 tens and 0 ones.", "Prueba 5 decenas y 2 unidades, o 7 decenas y 0 unidades.")],
    },
  ],
  explain: explain(
    "why",
    T("Why did the clues allow more than one number?", "¿Por qué las pistas permitían más de un número?"),
    [frame(T("The clues only say how many tens and ones are", "Las pistas solo dicen cuántas decenas y unidades son"), [w("allowed", "permitidas", true), w("exact", "exactas"), w("missing", "faltantes")])],
    [idea("many", ["many", "more than one", "several", "different", "varios", "muchos", "más de uno", "diferentes"]), idea("clue", ["clue", "more than", "fewer", "pista", "más de", "menos"])],
    { need: 1 },
  ),
  transfer: transfer("new", (rng) => {
    const h = rng.int(1, 8);
    const t = rng.int(1, 5);
    return {
      kind: "build",
      prompt: T(`Build a number with ${h} hundreds, more than ${t} tens, and an even number of ones. No place may hold 10 or more.`, `Construye un número con ${h} centenas, más de ${t} decenas y una cantidad par de unidades. Ningún lugar puede tener 10 o más.`),
      params: { set: "whole", rows: ["T"] },
      check: (s, d) => Boolean(d.counts && d.regrouped && d.counts.hundreds === h && d.counts.tens > t && d.counts.ones % 2 === 0),
      hints: [hint("0 is an even number of ones.", "0 es una cantidad par de unidades.")],
    };
  }),
});

// ---- Build the Answer: design a coordinate graph --------------------------------------------------------------------------------
const lineIs = (d, m, b) => !d.vertical && d.slope.eq(m) && d.intercept.eq(b);
export const buildGraph = quick({
  id: "build-graph",
  innovation: "build",
  title: T("Build the answer: design a line", "Construye la respuesta: diseña una recta"),
  blurb: T("Move two points to make a line that meets conditions on slope and where it crosses the axis.", "Mueve dos puntos para hacer una recta que cumpla condiciones de pendiente y de dónde cruza el eje."),
  model: "graph",
  params: { p1: [0, 0], p2: [1, 2] },
  grades: [7, 8],
  skills: ["8:slope", "8:functions"],
  goals: [
    {
      id: "slope",
      goal: T("Make a line with slope −1 that crosses the y-axis at 2.", "Haz una recta con pendiente −1 que cruce el eje y en 2."),
      check: (s, d) => (lineIs(d, R(-1), R(2)) ? done(T(`${d.equation}: slope −1 and it crosses at 2.`, `${d.equation}: pendiente −1 y cruza en 2.`)) : notYet(T(`Your line is ${d.equation}.`, `Tu recta es ${d.equation}.`))),
      hints: [hint("Start at (0, 2). Go right 1 and down 1.", "Empieza en (0, 2). Ve 1 a la derecha y 1 hacia abajo.")],
    },
    {
      id: "origin",
      goal: T("Now make a proportional line (it passes through the origin) with slope 3.", "Ahora haz una recta proporcional (pasa por el origen) con pendiente 3."),
      check: (s, d) => (lineIs(d, R(3), R(0)) ? done(T("y = 3x passes through (0, 0).", "y = 3x pasa por (0, 0).")) : notYet(T(`Your line is ${d.equation}.`, `Tu recta es ${d.equation}.`))),
      hints: [hint("A proportional line has no added number: y = mx.", "Una recta proporcional no tiene número sumado: y = mx.")],
    },
  ],
  explain: explain(
    "why",
    T("How does the slope show up when you move a point?", "¿Cómo se ve la pendiente cuando mueves un punto?"),
    [frame(T("The slope is the change in y divided by the change in", "La pendiente es el cambio en y dividido entre el cambio en"), [w("x", "x", true), w("y", "y"), w("the origin", "el origen")])],
    [idea("rise", ["rise", "up", "down", "change in y", "sube", "baja", "cambio en y"]), idea("run", ["run", "right", "across", "change in x", "derecha", "cambio en x"])],
    { need: 1 },
  ),
  transfer: transfer("new", (rng) => {
    const m = rng.pick([R(2), R(-2), R(1), R(3), R(-3)]);
    const b = rng.int(-3, 3);
    return {
      kind: "build",
      prompt: T(`Make a line with slope ${m.toString().replace("-", "−")} and y-intercept ${String(b).replace("-", "−")}.`, `Haz una recta con pendiente ${m.toString().replace("-", "−")} y ordenada al origen ${String(b).replace("-", "−")}.`),
      params: { p1: [0, 0], p2: [1, 2] },
      check: (s, d) => lineIs(d, m, R(b)),
      hints: [hint("Put one point on the y-axis at the intercept.", "Pon un punto en el eje y, en la ordenada al origen.")],
    };
  }),
});

// ---- Reverse Math: an equation whose solution is x = 7 -------------------------------------------------------------------------------
const solutionIs = (e, n) => e.solution && String(e.solution) === String(n);
export const reverseEquation = quick({
  id: "reverse-equation",
  innovation: "reverse",
  tags: ["build"],
  title: T("Reverse Math: an equation with x = 7", "Matemática al revés: una ecuación con x = 7"),
  blurb: T("Invent equations whose solution is x = 7. The engine solves each one exactly.", "Inventa ecuaciones cuya solución sea x = 7. El motor resuelve cada una con exactitud."),
  model: "builder",
  params: { kind: "equation" },
  grades: [6, 7, 8],
  skills: [],
  goals: [
    {
      id: "one",
      goal: T("Build an equation with x = 7 as its solution. Use x and at least two operations.", "Construye una ecuación con x = 7 como solución. Usa x y al menos dos operaciones."),
      check: (s, d) => (d.entries.some((e) => solutionIs(e, 7) && e.ops >= 2) ? done(T("The engine solved it: x = 7.", "El motor la resolvió: x = 7.")) : notYet(d.entries.length ? T(`Your last equation has x = ${d.entries.at(-1).solution ? String(d.entries.at(-1).solution) : d.entries.at(-1).kind === "all" ? "every number" : "no solution"}.`, `Tu última ecuación tiene x = ${d.entries.at(-1).solution ? String(d.entries.at(-1).solution) : d.entries.at(-1).kind === "all" ? "cualquier número" : "ninguna solución"}.`) : T("Type an equation, like 2x + 1 = 15.", "Escribe una ecuación, como 2x + 1 = 15."))),
      hints: [hint("Work backwards: start with x = 7 and do the same thing to both sides.", "Trabaja al revés: empieza con x = 7 y haz lo mismo en ambos lados."), hint("Try 2x + 1 = 15.", "Prueba 2x + 1 = 15.")],
    },
    {
      id: "three",
      goal: T("Build three different equations that all have x = 7.", "Construye tres ecuaciones diferentes que tengan x = 7."),
      check: (s, d) => {
        const n = d.entries.filter((e) => solutionIs(e, 7) && e.ops >= 2).length;
        return n >= 3 ? done(T("Three equations, one solution.", "Tres ecuaciones, una solución.")) : notYet(T(`${n} of 3 valid equations.`, `${n} de 3 ecuaciones válidas.`));
      },
      hints: [hint("Put x on both sides, like 3x − 5 = x + 9.", "Pon x en ambos lados, como 3x − 5 = x + 9.")],
    },
  ],
  explain: explain(
    "why",
    T("How did you make an equation with the solution you wanted?", "¿Cómo hiciste una ecuación con la solución que querías?"),
    [frame(T("I started with x = 7 and did the same operation to", "Empecé con x = 7 e hice la misma operación en"), [w("both sides", "ambos lados", true), w("one side", "un lado"), w("neither side", "ningún lado")])],
    [idea("both", ["both", "each side", "same", "ambos", "cada lado", "mismo"]), idea("back", ["backward", "back", "start", "undo", "al revés", "empecé", "deshacer"])],
    { need: 1 },
  ),
  transfer: transfer("new", (rng) => {
    const x = rng.int(3, 12);
    return {
      kind: "build",
      prompt: T(`Build an equation with x = ${x} as its solution, using at least two operations.`, `Construye una ecuación con x = ${x} como solución, usando al menos dos operaciones.`),
      params: { kind: "equation" },
      check: (s, d) => d.entries.some((e) => solutionIs(e, x) && e.ops >= 2),
      hints: [hint(`Start with x = ${x} and do the same thing to both sides.`, `Empieza con x = ${x} y haz lo mismo en ambos lados.`)],
    };
  }),
});

// ---- Reverse Math: a ratio table with constant of proportionality 4 ----------------------------------------------------------------------
export const reverseRatioTable = quick({
  id: "reverse-ratio-table",
  innovation: "reverse",
  tags: ["build"],
  title: T("Reverse Math: a ratio table with constant 4", "Matemática al revés: una tabla de razones con constante 4"),
  blurb: T("Fill in a table so y ÷ x is always 4. The engine checks every row.", "Completa una tabla para que y ÷ x siempre sea 4. El motor revisa cada fila."),
  model: "ratiotable",
  params: {},
  grades: [6, 7],
  skills: [],
  goals: [
    {
      id: "four",
      goal: T("Fill in the y column so every row has y ÷ x = 4. Use at least 3 rows.", "Completa la columna y para que cada fila tenga y ÷ x = 4. Usa al menos 3 filas."),
      check: (s, d) => (d.constant && d.constant.eq(R(4)) && d.filled >= 3 && d.distinctX >= 3 ? done(T("Every row has the same ratio: 4.", "Todas las filas tienen la misma razón: 4.")) : notYet(d.filled && !d.constant ? T("The rows do not all have the same y ÷ x yet.", "Las filas aún no tienen todas el mismo y ÷ x.") : T(`${d.filled} complete rows. Fill at least 3.`, `${d.filled} filas completas. Llena al menos 3.`))),
      hints: [hint("For x = 1, y is 4. What is y when x is 2?", "Para x = 1, y es 4. ¿Cuánto es y cuando x es 2?")],
    },
    {
      id: "half",
      goal: T("Add a row with x = 2.5 that keeps the constant 4.", "Agrega una fila con x = 2.5 que conserve la constante 4."),
      check: (s, d) => (d.constant && d.constant.eq(R(4)) && d.rows.some((r) => r.x && r.y && r.x.eq(R(5, 2)) && r.y.eq(R(10))) ? done(T("2.5 and 10: still 4.", "2.5 y 10: sigue siendo 4.")) : notYet(T("Add a row, type 2.5 for x, and the y that keeps the ratio.", "Agrega una fila, escribe 2.5 para x y la y que conserva la razón."))),
      hints: [hint("y = 4 × 2.5.", "y = 4 × 2.5.")],
    },
  ],
  explain: explain(
    "why",
    T("How do you find y when you know x?", "¿Cómo hallas y cuando conoces x?"),
    [frame(T("To find y, I", "Para hallar y,"), [w("multiply x by 4", "multiplico x por 4", true), w("add 4 to x", "sumo 4 a x"), w("divide x by 4", "divido x entre 4")])],
    [idea("mult", ["multipl", "times", "×", "veces"]), idea("four", ["4", "four", "cuatro", "constant", "constante"])],
    { need: 2 },
  ),
  transfer: transfer("new", (rng) => {
    const k = rng.pick([R(2), R(3), R(5), R(3, 2), R(6)]);
    return {
      kind: "build",
      prompt: T(`Fill a ratio table so every row has y ÷ x = ${k}. Use at least 3 rows.`, `Completa una tabla de razones para que cada fila tenga y ÷ x = ${k}. Usa al menos 3 filas.`),
      params: {},
      check: (s, d) => Boolean(d.constant && d.constant.eq(k) && d.filled >= 3 && d.distinctX >= 3),
      hints: [hint(`y is ${k} times x.`, `y es ${k} veces x.`)],
    };
  }),
});

export const MORE = [reverseFractions, buildDecimalFraction, buildPlaceNumber, buildGraph, reverseEquation, reverseRatioTable];

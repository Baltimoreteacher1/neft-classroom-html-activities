// "Show Me Why" 2.0 (Enterprise 8): predict, build, watch, manipulate, explain, then try a parallel problem alone.
// Every lesson drives a real MathVisualEngine model, so the animation is the model's own moves (never decoration), and
// a learner's build is checked against the model's exact state. A step that needed a hint is recorded as supported.
import { MathVisualEngine, bi, getModel, seeded } from "./engine-core.js";
import "./models.js";
import { equivalent } from "./rational.js";

const F = (en, es) => bi(en, es);

// Each lesson: the model it uses, the story in five beats, and a try-it-yourself generator.
// `predict.choices[i].ok` marks the right choice; `build.check(engine)` is true when the learner has built the idea;
// `watch.actions` are applied one at a time to a fresh engine; `try.ask(engine)` returns the question and exact answer.
export const LESSONS = {
  tenFrame: () => ({
    title: F("Make ten", "Formar diez"),
    model: "tenFrame",
    grades: [1],
    params: { frames: 1, start: 7 },
    predict: {
      q: F(
        "The frame has 7 counters. How many more make 10?",
        "El cuadro tiene 7 fichas. ¿Cuántas más forman 10?",
      ),
      choices: [
        { t: F("2", "2") },
        { t: F("3", "3"), ok: true },
        { t: F("4", "4") },
      ],
      why: F(
        "Count the empty spaces: there are 3, and 7 + 3 = 10.",
        "Cuenta los espacios vacíos: hay 3, y 7 + 3 = 10.",
      ),
    },
    build: {
      goal: F(
        "Add counters until the frame is full.",
        "Agrega fichas hasta llenar el cuadro.",
      ),
      check: (e) => e.state.filled === 10,
      hint: F(
        "Press 'Add a counter' until there are no empty spaces.",
        "Presiona 'Poner una ficha' hasta que no queden espacios vacíos.",
      ),
    },
    watch: {
      actions: [{ type: "add" }, { type: "add" }, { type: "add" }],
      captions: [
        F(
          "7 + 1 = 8. Two spaces are still empty.",
          "7 + 1 = 8. Todavía quedan dos espacios vacíos.",
        ),
        F(
          "8 + 1 = 9. One space is empty.",
          "8 + 1 = 9. Queda un espacio vacío.",
        ),
        F(
          "9 + 1 = 10. The frame is full, so 7 + 3 = 10.",
          "9 + 1 = 10. El cuadro está lleno, así que 7 + 3 = 10.",
        ),
      ],
    },
    explain: {
      prompt: F(
        "Say how you know 7 and 3 make 10.",
        "Explica cómo sabes que 7 y 3 forman 10.",
      ),
      frames: [
        F(
          "I started with ___ counters and added ___ more to make 10.",
          "Empecé con ___ fichas y agregué ___ más para formar 10.",
        ),
        F(
          "The empty spaces show how many more I need.",
          "Los espacios vacíos muestran cuántas más necesito.",
        ),
      ],
    },
    try: {
      gen: (rng) => ({ frames: 1, start: rng.int(3, 8) }),
      ask: (e) => ({
        prompt: F(
          `The frame has ${e.state.filled} counters. How many more make 10?`,
          `El cuadro tiene ${e.state.filled} fichas. ¿Cuántas más forman 10?`,
        ),
        answer: String(10 - e.state.filled),
      }),
    },
  }),

  baseTen: () => ({
    title: F(
      "Trade ten ones for a ten",
      "Cambiar diez unidades por una decena",
    ),
    model: "baseTen",
    grades: [2],
    params: { value: 0, raw: { h: 0, t: 0, o: 13 } },
    predict: {
      q: F(
        "You have 13 ones. If you trade 10 of them for a ten, what do you have?",
        "Tienes 13 unidades. Si cambias 10 por una decena, ¿qué tienes?",
      ),
      choices: [
        { t: F("1 ten and 3 ones", "1 decena y 3 unidades"), ok: true },
        { t: F("3 tens and 1 one", "3 decenas y 1 unidad") },
        { t: F("13 tens", "13 decenas") },
      ],
      why: F(
        "Ten ones make one ten, so 13 ones are 1 ten and 3 ones. The amount is still 13.",
        "Diez unidades forman una decena, así que 13 unidades son 1 decena y 3 unidades. La cantidad sigue siendo 13.",
      ),
    },
    build: {
      goal: F("Trade 10 ones for a ten.", "Cambia 10 unidades por una decena."),
      check: (e) => e.state.t === 1 && e.state.o === 3,
      hint: F(
        "Press 'Trade 10 ones for a ten'. Watch the value stay at 13.",
        "Presiona 'Cambiar 10 unidades por una decena'. Mira que el valor sigue en 13.",
      ),
    },
    watch: {
      actions: [{ type: "tradeTen" }, { type: "breakTen" }],
      captions: [
        F(
          "Ten ones snap together into one ten. 13 is now 10 + 3.",
          "Diez unidades se juntan en una decena. Ahora 13 es 10 + 3.",
        ),
        F(
          "Break the ten apart and you have 13 ones again. Same amount, different groups.",
          "Separa la decena y vuelves a tener 13 unidades. La misma cantidad en grupos distintos.",
        ),
      ],
    },
    explain: {
      prompt: F(
        "Explain why the number stays the same when you trade.",
        "Explica por qué el número no cambia cuando haces el cambio.",
      ),
      frames: [
        F(
          "The value stays ___ because 10 ones equal 1 ___.",
          "El valor sigue siendo ___ porque 10 unidades son 1 ___.",
        ),
        F(
          "I traded ___ for ___ and nothing was added or taken away.",
          "Cambié ___ por ___ y no se agregó ni se quitó nada.",
        ),
      ],
    },
    try: {
      gen: (rng) => ({ value: 0, raw: { h: 0, t: 0, o: rng.int(11, 19) } }),
      ask: (e) => ({
        prompt: F(
          `You have ${e.state.o} ones. After you trade 10 ones for a ten, how many ones are left?`,
          `Tienes ${e.state.o} unidades. Después de cambiar 10 unidades por una decena, ¿cuántas unidades quedan?`,
        ),
        answer: String(e.state.o - 10),
      }),
    },
  }),

  array: () => ({
    title: F("Why 3 × 4 = 4 × 3", "Por qué 3 × 4 = 4 × 3"),
    model: "array",
    grades: [3],
    params: { rows: 3, cols: 4 },
    predict: {
      q: F(
        "If you turn a 3-by-4 array on its side, how many are there?",
        "Si giras una matriz de 3 por 4, ¿cuántos hay?",
      ),
      choices: [
        { t: F("The same: 12", "Los mismos: 12"), ok: true },
        { t: F("More than 12", "Más de 12") },
        { t: F("Fewer than 12", "Menos de 12") },
      ],
      why: F(
        "Turning moves the counters but does not add or remove any, so 3 × 4 and 4 × 3 are both 12.",
        "Girar mueve las fichas pero no agrega ni quita, así que 3 × 4 y 4 × 3 son ambos 12.",
      ),
    },
    build: {
      goal: F(
        "Turn the array so it has 4 rows of 3.",
        "Gira la matriz para que tenga 4 filas de 3.",
      ),
      check: (e) => e.state.rows === 4 && e.state.cols === 3,
      hint: F("Press 'Turn the array'.", "Presiona 'Girar la matriz'."),
    },
    watch: {
      actions: [{ type: "swap" }, { type: "swap" }],
      captions: [
        F(
          "Turned: 4 rows of 3 is still 12.",
          "Girada: 4 filas de 3 sigue siendo 12.",
        ),
        F("Turned back: 3 rows of 4 is 12.", "De vuelta: 3 filas de 4 son 12."),
      ],
    },
    explain: {
      prompt: F(
        "Explain why the order of the factors does not change the product.",
        "Explica por qué el orden de los factores no cambia el producto.",
      ),
      frames: [
        F(
          "When I turn the array, the same ___ are in a different ___.",
          "Cuando giro la matriz, las mismas ___ están en otro ___.",
        ),
        F(
          "___ × ___ and ___ × ___ both make ___.",
          "___ × ___ y ___ × ___ ambos dan ___.",
        ),
      ],
    },
    try: {
      gen: (rng) => ({ rows: rng.int(3, 8), cols: rng.int(3, 8) }),
      ask: (e) => ({
        prompt: F(
          `An array has ${e.state.rows} rows of ${e.state.cols}. How many in all?`,
          `Una matriz tiene ${e.state.rows} filas de ${e.state.cols}. ¿Cuántos hay en total?`,
        ),
        answer: String(e.state.rows * e.state.cols),
      }),
    },
  }),

  areaMultiply: () => ({
    title: F("Break a factor apart", "Separar un factor"),
    model: "areaMultiply",
    grades: [4],
    params: { a: 23, b: 6, unsplit: true },
    predict: {
      q: F(
        "To find 23 × 6, you can find 20 × 6 and 3 × 6. What do you do next?",
        "Para hallar 23 × 6 puedes hallar 20 × 6 y 3 × 6. ¿Qué haces después?",
      ),
      choices: [
        { t: F("Add the two products", "Sumar los dos productos"), ok: true },
        { t: F("Multiply the two products", "Multiplicar los dos productos") },
        { t: F("Subtract them", "Restarlos") },
      ],
      why: F(
        "23 is 20 + 3, so 23 × 6 = 20 × 6 + 3 × 6 = 120 + 18 = 138. The two rectangles make one big one.",
        "23 es 20 + 3, así que 23 × 6 = 20 × 6 + 3 × 6 = 120 + 18 = 138. Los dos rectángulos forman uno grande.",
      ),
    },
    build: {
      goal: F("Split 23 into 20 and 3.", "Parte 23 en 20 y 3."),
      check: (e) => e.state.splitA === 20,
      hint: F(
        "Move the first split right until the left piece is 20.",
        "Mueve la primera partición a la derecha hasta que la pieza izquierda sea 20.",
      ),
    },
    watch: {
      actions: [
        { type: "splitA", value: 10 },
        { type: "splitA", value: 20 },
      ],
      captions: [
        F(
          "Split as 10 + 13: still 138 in all.",
          "Partido como 10 + 13: sigue habiendo 138 en total.",
        ),
        F(
          "Split as 20 + 3: 120 + 18 = 138. Any split gives the same total.",
          "Partido como 20 + 3: 120 + 18 = 138. Cualquier partición da el mismo total.",
        ),
      ],
    },
    explain: {
      prompt: F(
        "Explain why the parts add to the whole product.",
        "Explica por qué las partes suman el producto completo.",
      ),
      frames: [
        F(
          "The rectangle is cut into ___ parts and their areas add to ___.",
          "El rectángulo se corta en ___ partes y sus áreas suman ___.",
        ),
        F(
          "I split ___ into ___ and ___, so I multiply each part by ___.",
          "Partí ___ en ___ y ___, así que multiplico cada parte por ___.",
        ),
      ],
    },
    try: {
      gen: (rng) => ({ a: rng.int(12, 39), b: rng.int(3, 9) }),
      ask: (e) => ({
        prompt: F(
          `What is ${e.params.a} × ${e.params.b}?`,
          `¿Cuánto es ${e.params.a} × ${e.params.b}?`,
        ),
        answer: String(e.params.a * e.params.b),
      }),
    },
  }),

  fractionBar: () => ({
    title: F("Same amount, more pieces", "La misma cantidad, más partes"),
    model: "fractionBar",
    grades: [4],
    params: { n: 1, d: 2 },
    predict: {
      q: F(
        "Cut every half into 3 equal pieces. Which fraction names the same amount?",
        "Corta cada mitad en 3 partes iguales. ¿Qué fracción nombra la misma cantidad?",
      ),
      choices: [
        { t: F("3/6", "3/6"), ok: true },
        { t: F("1/6", "1/6") },
        { t: F("2/5", "2/5") },
      ],
      why: F(
        "Cutting each part into 3 makes 3 times as many parts and 3 times as many shaded: 1/2 = 3/6.",
        "Cortar cada parte en 3 da el triple de partes y el triple de partes sombreadas: 1/2 = 3/6.",
      ),
    },
    build: {
      goal: F(
        "Cut every part into 3 and see the new fraction.",
        "Corta cada parte en 3 y mira la nueva fracción.",
      ),
      check: (e) => e.state.d === 6 && e.state.n === 3,
      hint: F(
        "Press 'Cut every part in 3 (× 3)'.",
        "Presiona 'Cortar cada parte en 3 (× 3)'.",
      ),
    },
    watch: {
      actions: [{ type: "refine", by: 3 }, { type: "simplify" }],
      captions: [
        F(
          "× 3 on the top and the bottom: 1/2 becomes 3/6. The shaded length did not change.",
          "× 3 arriba y abajo: 1/2 se vuelve 3/6. La longitud sombreada no cambió.",
        ),
        F(
          "Group the pieces back by 3: 3/6 is 1/2 again.",
          "Agrupa las partes de 3 en 3: 3/6 vuelve a ser 1/2.",
        ),
      ],
    },
    explain: {
      prompt: F(
        "Explain why 1/2 and 3/6 are the same amount.",
        "Explica por qué 1/2 y 3/6 son la misma cantidad.",
      ),
      frames: [
        F(
          "I cut each part into ___ pieces, so the top and bottom both got ___ times bigger.",
          "Corté cada parte en ___ pedazos, así que el numerador y el denominador se multiplicaron por ___.",
        ),
        F(
          "The shaded part is the same length, so the fractions are equal.",
          "La parte sombreada tiene la misma longitud, así que las fracciones son iguales.",
        ),
      ],
    },
    try: {
      gen: (rng) => {
        const d = rng.pick([2, 3, 4, 5]);
        return { n: rng.int(1, d - 1), d };
      },
      ask: (e) => ({
        prompt: F(
          `${e.state.n}/${e.state.d} = ?/${e.state.d * 4}. What is the missing numerator?`,
          `${e.state.n}/${e.state.d} = ?/${e.state.d * 4}. ¿Cuál es el numerador que falta?`,
        ),
        answer: String(e.state.n * 4),
      }),
    },
  }),

  fractionOps: () => ({
    title: F("Make the pieces match", "Hacer que las partes coincidan"),
    model: "fractionOps",
    grades: [5],
    params: { a: [1, 3], b: [1, 4], op: "+" },
    predict: {
      q: F("Is 1/3 + 1/4 equal to 2/7?", "¿1/3 + 1/4 es igual a 2/7?"),
      choices: [
        {
          t: F(
            "Yes, add the tops and the bottoms",
            "Sí, sumo numeradores y denominadores",
          ),
        },
        {
          t: F(
            "No, the pieces are different sizes",
            "No, las partes son de tamaños distintos",
          ),
          ok: true,
        },
        { t: F("Yes, because 2/7 is close", "Sí, porque 2/7 se parece") },
      ],
      why: F(
        "Thirds and fourths are different sizes, so you cannot count them together. First cut both into twelfths.",
        "Los tercios y los cuartos son de tamaños distintos, así que no se pueden contar juntos. Primero córtalos en doceavos.",
      ),
    },
    build: {
      goal: F("Cut both bars into 12ths.", "Corta ambas barras en doceavos."),
      check: (e) => e.state.den === 12,
      hint: F("Press 'Use 12ths'.", "Presiona 'Usar 12avos'."),
    },
    watch: {
      actions: [{ type: "commonDen", value: 12 }],
      captions: [
        F(
          "In twelfths: 4/12 + 3/12 = 7/12. The pieces match, so you can count them.",
          "En doceavos: 4/12 + 3/12 = 7/12. Las partes coinciden, así que se pueden contar.",
        ),
      ],
    },
    explain: {
      prompt: F(
        "Explain why you need the same size pieces before adding.",
        "Explica por qué necesitas partes del mismo tamaño antes de sumar.",
      ),
      frames: [
        F(
          "I cut both fractions into ___ths so the pieces are the same size.",
          "Corté ambas fracciones en ___avos para que las partes sean del mismo tamaño.",
        ),
        F(
          "Then I add the ___ and keep the ___.",
          "Luego sumo los ___ y conservo el ___.",
        ),
      ],
    },
    try: {
      gen: (rng) => ({ a: [1, 2], b: [rng.int(1, 2), 5], op: "+" }),
      ask: (e) => ({
        prompt: F(
          `What is 1/2 + ${e.params.b[0]}/5? (a fraction)`,
          `¿Cuánto es 1/2 + ${e.params.b[0]}/5? (una fracción)`,
        ),
        answer: e.derive().facts.result.toString(),
      }),
    },
  }),

  tapeRatio: () => ({
    title: F("Ratios as copies", "Razones como copias"),
    model: "tapeRatio",
    grades: [6],
    params: { a: 2, b: 3, k: 1, names: ["red tiles", "blue tiles"], short: ["red", "blue"] },
    predict: {
      q: F(
        "The ratio is 2 red to 3 blue. If you make 4 copies, how many blue tiles are there?",
        "La razón es 2 rojas por cada 3 azules. Si haces 4 copias, ¿cuántas fichas azules hay?",
      ),
      choices: [
        { t: F("7", "7") },
        { t: F("12", "12"), ok: true },
        { t: F("9", "9") },
      ],
      why: F(
        "Each copy has 3 blue, so 4 copies have 4 × 3 = 12. Adding 2 to both would not keep the ratio.",
        "Cada copia tiene 3 azules, así que 4 copias tienen 4 × 3 = 12. Sumar 2 a ambas no mantiene la razón.",
      ),
    },
    build: {
      goal: F("Make 4 copies of the ratio.", "Haz 4 copias de la razón."),
      check: (e) => e.state.k === 4,
      hint: F(
        "Press 'Add another copy' three times.",
        "Presiona 'Agregar otra copia' tres veces.",
      ),
    },
    watch: {
      actions: [
        { type: "scale", value: 2 },
        { type: "scale", value: 3 },
        { type: "scale", value: 4 },
      ],
      captions: [
        F(
          "2 copies: 4 red to 6 blue. The table, tape and number line all agree.",
          "2 copias: 4 rojas por cada 6 azules. La tabla, la cinta y la recta coinciden.",
        ),
        F(
          "3 copies: 6 to 9. Every copy adds 2 red and 3 blue.",
          "3 copias: 6 y 9. Cada copia agrega 2 rojas y 3 azules.",
        ),
        F(
          "4 copies: 8 to 12. The ratio is still 2:3.",
          "4 copias: 8 y 12. La razón sigue siendo 2:3.",
        ),
      ],
    },
    explain: {
      prompt: F(
        "Explain why 2:3 and 8:12 are the same ratio.",
        "Explica por qué 2:3 y 8:12 son la misma razón.",
      ),
      frames: [
        F(
          "Both numbers were multiplied by ___, so the ratio stays the same.",
          "Ambos números se multiplicaron por ___, así que la razón no cambia.",
        ),
        F(
          "For every ___ red there are ___ blue.",
          "Por cada ___ roja hay ___ azules.",
        ),
      ],
    },
    try: {
      gen: (rng) => ({
        a: rng.pick([2, 3, 4]),
        b: rng.pick([5, 6, 7]),
        k: 1,
        names: ["cups of juice", "cups of water"],
        short: ["juice", "water"],
      }),
      ask: (e) => ({
        prompt: F(
          `The ratio is ${e.state.a} juice to ${e.state.b} water. With 5 copies, how many cups of water?`,
          `La razón es ${e.state.a} de jugo por cada ${e.state.b} de agua. Con 5 copias, ¿cuántas tazas de agua?`,
        ),
        answer: String(e.state.b * 5),
      }),
    },
  }),

  balanceScale: () => ({
    title: F("Do the same to both sides", "Hacer lo mismo en ambos lados"),
    model: "balanceScale",
    grades: [6, 7],
    params: { a: 3, b: 2, c: 0, d: 14 },
    predict: {
      q: F(
        "3x + 2 = 14. If you subtract 2 from both sides, what is left?",
        "3x + 2 = 14. Si restas 2 de ambos lados, ¿qué queda?",
      ),
      choices: [
        { t: F("3x = 12", "3x = 12"), ok: true },
        { t: F("3x = 16", "3x = 16") },
        { t: F("x = 12", "x = 12") },
      ],
      why: F(
        "Subtracting 2 from both sides keeps the scale balanced: 14 − 2 = 12, so 3x = 12.",
        "Restar 2 de ambos lados mantiene la balanza equilibrada: 14 − 2 = 12, así que 3x = 12.",
      ),
    },
    build: {
      goal: F(
        "Solve the equation. Always do the same thing to both sides.",
        "Resuelve la ecuación. Siempre haz lo mismo en ambos lados.",
      ),
      check: (e) => e.derive().facts.solved,
      hint: F(
        "Use the suggested move, then divide both sides by the number in front of x.",
        "Usa el movimiento sugerido y luego divide ambos lados entre el número delante de x.",
      ),
    },
    watch: {
      actions: [
        { type: "addConst", value: -2 },
        { type: "div", value: 3 },
      ],
      captions: [
        F(
          "Subtract 2 from both sides: 3x = 12. The scale is still level.",
          "Resta 2 de ambos lados: 3x = 12. La balanza sigue nivelada.",
        ),
        F(
          "Divide both sides by 3: x = 4. Check: 3 × 4 + 2 = 14.",
          "Divide ambos lados entre 3: x = 4. Comprueba: 3 × 4 + 2 = 14.",
        ),
      ],
    },
    explain: {
      prompt: F(
        "Explain why you must change both sides.",
        "Explica por qué debes cambiar ambos lados.",
      ),
      frames: [
        F(
          "If I change only one side, the scale is not ___ any more.",
          "Si cambio solo un lado, la balanza ya no está ___.",
        ),
        F(
          "I undo ___ with the opposite operation on both sides.",
          "Deshago ___ con la operación opuesta en ambos lados.",
        ),
      ],
    },
    try: {
      gen: (rng) => {
        const x = rng.int(2, 9);
        const a = rng.int(2, 5);
        const b = rng.int(1, 9);
        return { a, b, c: 0, d: a * x + b };
      },
      ask: (e) => ({
        prompt: F(
          `${e.params.a}x + ${e.params.b} = ${e.params.d}. What is x?`,
          `${e.params.a}x + ${e.params.b} = ${e.params.d}. ¿Cuánto es x?`,
        ),
        answer: String((e.params.d - e.params.b) / e.params.a),
      }),
    },
  }),

  integerChips: () => ({
    title: F("Zero pairs", "Pares cero"),
    model: "integerChips",
    grades: [6, 7],
    params: { a: 3, expr: { a: 3, b: -2, op: "-" } },
    predict: {
      q: F(
        "You have 3 positive chips and want to take away 2 negative chips. There are none to take. What can you add first?",
        "Tienes 3 fichas positivas y quieres quitar 2 negativas. No hay ninguna. ¿Qué puedes agregar primero?",
      ),
      choices: [
        {
          t: F(
            "2 zero pairs (+1 and −1 together)",
            "2 pares cero (+1 y −1 juntos)",
          ),
          ok: true,
        },
        { t: F("2 more positive chips", "2 fichas positivas más") },
        { t: F("Nothing; it cannot be done", "Nada; no se puede") },
      ],
      why: F(
        "A zero pair adds 0, so the value stays 3. Then you can take away the 2 negatives and 3 − (−2) = 5.",
        "Un par cero suma 0, así que el valor sigue siendo 3. Luego puedes quitar las 2 negativas y 3 − (−2) = 5.",
      ),
    },
    build: {
      goal: F(
        "Add two zero pairs, then take away two negative chips.",
        "Agrega dos pares cero y luego quita dos fichas negativas.",
      ),
      check: (e) => e.state.pos - e.state.neg === 5,
      hint: F(
        "Press 'Add a zero pair' twice, then 'Take away a − chip' twice.",
        "Presiona 'Agregar un par cero' dos veces y luego 'Quitar una ficha −' dos veces.",
      ),
    },
    watch: {
      actions: [
        { type: "addZero" },
        { type: "addZero" },
        { type: "remove", sign: "-" },
        { type: "remove", sign: "-" },
      ],
      captions: [
        F(
          "Add a zero pair: the value is still 3.",
          "Agrega un par cero: el valor sigue siendo 3.",
        ),
        F("Another zero pair: still 3.", "Otro par cero: sigue siendo 3."),
        F(
          "Take away one −1: the value goes up by 1, to 4.",
          "Quita un −1: el valor sube 1, a 4.",
        ),
        F(
          "Take away another −1: 5. So 3 − (−2) = 5.",
          "Quita otro −1: 5. Así que 3 − (−2) = 5.",
        ),
      ],
    },
    explain: {
      prompt: F(
        "Explain why subtracting a negative makes the number bigger.",
        "Explica por qué restar un negativo hace mayor al número.",
      ),
      frames: [
        F(
          "Taking away a negative chip leaves ___ positive chips, so the value goes ___.",
          "Quitar una ficha negativa deja ___ fichas positivas, así que el valor ___.",
        ),
        F(
          "Subtracting −2 is the same as adding ___.",
          "Restar −2 es lo mismo que sumar ___.",
        ),
      ],
    },
    try: {
      gen: (rng) => ({
        a: rng.int(1, 5),
        expr: { a: rng.int(1, 5), b: -rng.int(1, 4), op: "-" },
      }),
      ask: (e) => ({
        prompt: F(
          `${e.params.expr.a} − (${e.params.expr.b}) = ?`,
          `${e.params.expr.a} − (${e.params.expr.b}) = ?`,
        ),
        answer: String(e.params.expr.a - e.params.expr.b),
      }),
    },
  }),

  linearGraph: () => ({
    title: F(
      "Slope is the rate of change",
      "La pendiente es la tasa de cambio",
    ),
    model: "linearGraph",
    grades: [7, 8],
    params: { m: 2, b: 1, x: 1 },
    predict: {
      q: F(
        "On y = 2x + 1, each time x goes up by 1, what happens to y?",
        "En y = 2x + 1, cada vez que x aumenta 1, ¿qué le pasa a y?",
      ),
      choices: [
        { t: F("It goes up by 2", "Aumenta 2"), ok: true },
        { t: F("It goes up by 1", "Aumenta 1") },
        { t: F("It goes up by 3", "Aumenta 3") },
      ],
      why: F(
        "The slope is 2: for each 1 across, the line rises 2. That is the 2 in front of x.",
        "La pendiente es 2: por cada 1 a la derecha, la recta sube 2. Es el 2 delante de x.",
      ),
    },
    build: {
      goal: F(
        "Move the point to x = 4 and read its y.",
        "Mueve el punto a x = 4 y lee su y.",
      ),
      check: (e) => e.state.x === "4",
      hint: F(
        "Press 'Move the point right 1' three times.",
        "Presiona 'Mover el punto 1 a la derecha' tres veces.",
      ),
    },
    watch: {
      actions: [
        { type: "step", by: 1 },
        { type: "step", by: 1 },
        { type: "step", by: 1 },
      ],
      captions: [
        F("x = 2, y = 5. The point rose 2.", "x = 2, y = 5. El punto subió 2."),
        F(
          "x = 3, y = 7. Up 2 again.",
          "x = 3, y = 7. Otra vez 2 hacia arriba.",
        ),
        F(
          "x = 4, y = 9. A steady rate of change makes a straight line.",
          "x = 4, y = 9. Una tasa de cambio constante forma una recta.",
        ),
      ],
    },
    explain: {
      prompt: F(
        "Explain what the slope tells you.",
        "Explica qué te dice la pendiente.",
      ),
      frames: [
        F(
          "For each 1 step right, the line goes up ___.",
          "Por cada paso de 1 a la derecha, la recta sube ___.",
        ),
        F(
          "The table and the graph agree because ___.",
          "La tabla y la gráfica coinciden porque ___.",
        ),
      ],
    },
    try: {
      gen: (rng) => ({ m: rng.int(2, 4), b: rng.int(0, 4), x: rng.int(1, 3) }),
      ask: (e) => ({
        prompt: F(
          `y = ${e.params.m}x + ${e.params.b}. What is y when x = ${e.params.x}?`,
          `y = ${e.params.m}x + ${e.params.b}. ¿Cuánto vale y cuando x = ${e.params.x}?`,
        ),
        answer: String(e.params.m * e.params.x + e.params.b),
      }),
    },
  }),

  dotPlot: () => ({
    title: F(
      "The mean is the balance point",
      "La media es el punto de equilibrio",
    ),
    model: "dotPlot",
    grades: [6],
    params: { min: 0, max: 10, data: [2, 4, 6] },
    predict: {
      q: F(
        "The data are 2, 4 and 6. Where would the dots balance on a seesaw?",
        "Los datos son 2, 4 y 6. ¿Dónde se equilibrarían los puntos en un balancín?",
      ),
      choices: [
        { t: F("At 4", "En 4"), ok: true },
        { t: F("At 6", "En 6") },
        { t: F("At 2", "En 2") },
      ],
      why: F(
        "The distances to 4 are 2 below, 0 and 2 above: they cancel. (2 + 4 + 6) ÷ 3 = 4.",
        "Las distancias a 4 son 2 abajo, 0 y 2 arriba: se cancelan. (2 + 4 + 6) ÷ 3 = 4.",
      ),
    },
    build: {
      goal: F(
        "Add a dot at 8 and see where the balance point moves.",
        "Agrega un punto en 8 y mira dónde se mueve el punto de equilibrio.",
      ),
      check: (e) => e.state.data.includes(8),
      hint: F(
        "Press the control that adds a dot at 8.",
        "Presiona el control que agrega un punto en 8.",
      ),
    },
    watch: {
      actions: [{ type: "add", value: 8 }],
      captions: [
        F(
          "(2 + 4 + 6 + 8) ÷ 4 = 5. The new dot is far to the right, so the balance point moved right.",
          "(2 + 4 + 6 + 8) ÷ 4 = 5. El nuevo punto está lejos a la derecha, así que el equilibrio se movió a la derecha.",
        ),
      ],
    },
    explain: {
      prompt: F(
        "Explain what the mean tells you about the data.",
        "Explica qué te dice la media sobre los datos.",
      ),
      frames: [
        F(
          "If everyone shared equally, each would get ___.",
          "Si todos compartieran por igual, a cada uno le tocaría ___.",
        ),
        F(
          "The distances below the mean and above the mean ___.",
          "Las distancias debajo y encima de la media ___.",
        ),
      ],
    },
    try: {
      gen: (rng) => {
        const m = rng.int(3, 8);
        return { min: 0, max: 12, data: [m - 2, m, m + 2, m] };
      },
      ask: (e) => ({
        prompt: F(
          `The data are ${e.state.data.join(", ")}. What is the mean?`,
          `Los datos son ${e.state.data.join(", ")}. ¿Cuál es la media?`,
        ),
        answer: e.derive().facts.mean.toString(),
      }),
    },
  }),

  triangleArea: () => ({
    title: F(
      "A triangle is half a parallelogram",
      "Un triángulo es medio paralelogramo",
    ),
    model: "triangleArea",
    grades: [6],
    params: { b: 6, h: 4, slant: 2 },
    predict: {
      q: F(
        "A parallelogram has base 6 and height 4. What is the area of the triangle inside it with the same base and height?",
        "Un paralelogramo tiene base 6 y altura 4. ¿Cuál es el área del triángulo que tiene la misma base y altura?",
      ),
      choices: [
        { t: F("12", "12"), ok: true },
        { t: F("24", "24") },
        { t: F("10", "10") },
      ],
      why: F(
        "The parallelogram is 6 × 4 = 24. Two copies of the triangle fill it, so one triangle is 24 ÷ 2 = 12.",
        "El paralelogramo mide 6 × 4 = 24. Dos copias del triángulo lo llenan, así que un triángulo mide 24 ÷ 2 = 12.",
      ),
    },
    build: {
      goal: F(
        "Slide the top corner to the right. Does the area change?",
        "Desliza el vértice superior hacia la derecha. ¿Cambia el área?",
      ),
      check: (e) => e.state.slant >= 3,
      hint: F(
        "Press 'Slide the top corner right'.",
        "Presiona 'Deslizar el vértice a la derecha'.",
      ),
    },
    watch: {
      actions: [
        { type: "slant", value: 3 },
        { type: "slant", value: 4 },
      ],
      captions: [
        F(
          "The top corner moved, but the height is still 4, so the area is still 12.",
          "El vértice se movió, pero la altura sigue siendo 4, así que el área sigue siendo 12.",
        ),
        F(
          "Same base, same height, same area: 12.",
          "Misma base, misma altura, misma área: 12.",
        ),
      ],
    },
    explain: {
      prompt: F(
        "Explain why the area formula for a triangle has a ½.",
        "Explica por qué la fórmula del área del triángulo tiene ½.",
      ),
      frames: [
        F(
          "Two of the same triangle make a ___, with area base × height.",
          "Dos triángulos iguales forman un ___, con área base × altura.",
        ),
        F(
          "One triangle is ___ of that, so A = ½ × b × h.",
          "Un triángulo es ___ de eso, así que A = ½ × b × h.",
        ),
      ],
    },
    try: {
      gen: (rng) => ({
        b: rng.int(4, 10),
        h: rng.pick([2, 4, 6, 8]),
        slant: rng.int(-2, 3),
      }),
      ask: (e) => ({
        prompt: F(
          `A triangle has base ${e.state.b} and height ${e.state.h}. What is its area?`,
          `Un triángulo tiene base ${e.state.b} y altura ${e.state.h}. ¿Cuál es su área?`,
        ),
        answer: e.derive().facts.triangle.toString(),
      }),
    },
  }),
};

// The moves that complete each lesson's build step (used by tests and by the "show me how" hint of last resort).
export const BUILD_SOLUTIONS = {
  tenFrame: [{ type: "add" }, { type: "add" }, { type: "add" }],
  baseTen: [{ type: "tradeTen" }],
  array: [{ type: "swap" }],
  areaMultiply: [{ type: "splitA", value: 20 }],
  fractionBar: [{ type: "refine", by: 3 }],
  fractionOps: [{ type: "commonDen", value: 12 }],
  tapeRatio: [{ type: "scale", value: 4 }],
  balanceScale: [{ type: "addConst", value: -2 }, { type: "div", value: 3 }],
  integerChips: [{ type: "addZero" }, { type: "addZero" }, { type: "remove", sign: "-" }, { type: "remove", sign: "-" }],
  linearGraph: [{ type: "step", by: 1 }, { type: "step", by: 1 }, { type: "step", by: 1 }],
  dotPlot: [{ type: "add", value: 8 }],
  triangleArea: [{ type: "slant", value: 3 }],
};

// Which skill in the library each lesson's parallel problem gives evidence for. A lesson with no honest match records nothing.
export const LESSON_SKILL = {
  tenFrame: "1:make-10",
  baseTen: "2:place-1000",
  array: "3:mul-0-5",
  areaMultiply: "4:multiply-2digit",
  fractionBar: "4:fraction-equiv",
  fractionOps: "5:fraction-add",
  tapeRatio: "6:ratios",
  balanceScale: "6:one-step",
  integerChips: "7:integer-add",
  linearGraph: "8:slope",
  triangleArea: "6:triangle-area",
};

export const lessonIds = () => Object.keys(LESSONS);
export const lessonsForGrade = (grade) =>
  lessonIds().filter((id) => LESSONS[id]().grades.includes(Number(grade)));

const KINDS = ["predict", "build", "watch", "explain", "try"];

export class ShowMeWhy {
  constructor(lessonId, { seed = 1, reducedMotion = false } = {}) {
    if (!LESSONS[lessonId]) throw new Error(`Unknown lesson ${lessonId}`);
    this.id = lessonId;
    this.def = LESSONS[lessonId]();
    this.seed = seed;
    this.rng = seeded(seed * 2654435761);
    this.reducedMotion = Boolean(reducedMotion);
    this.index = 0;
    this.kinds = KINDS;
    this.engine = this.freshEngine(this.def.params);
    this.watchFrame = 0;
    this.record = {
      predict: null,
      build: { done: false, hints: 0, moves: 0 },
      explain: null,
      try: null,
      watched: false,
    };
    // Choices are shuffled by seed so the right answer is not always in the same place.
    const order = this.def.predict.choices.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i -= 1) {
      const j = this.rng.int(0, i);
      [order[i], order[j]] = [order[j], order[i]];
    }
    this.choiceOrder = order;
    this.tryEngine = null;
    this.tryQuestion = null;
  }

  freshEngine(params, mode = "guided") {
    return new MathVisualEngine(this.def.model, params, { mode });
  }

  get kind() {
    return this.kinds[this.index];
  }
  get done() {
    return this.index >= this.kinds.length;
  }
  get step() {
    return this.def[this.kind];
  }

  predictChoices() {
    return this.choiceOrder.map((i) => ({
      index: i,
      text: this.def.predict.choices[i].t,
    }));
  }

  answerPredict(index) {
    const choice = this.def.predict.choices[index];
    if (!choice) return { ok: false };
    const ok = Boolean(choice.ok);
    // The right reason is shown after the guess whether or not it was right: the prediction is never graded.
    this.record.predict = { choice: index, ok };
    return { ok, why: this.def.predict.why };
  }

  move(action) {
    const result = this.engine.dispatch(action);
    this.record.build.moves += 1;
    return result;
  }

  checkBuild() {
    const ok = Boolean(this.def.build.check(this.engine));
    if (ok) this.record.build.done = true;
    return { ok, hint: ok ? null : this.def.build.hint };
  }

  buildHint() {
    this.record.build.hints += 1;
    return this.def.build.hint;
  }

  watchTo(frame) {
    const total = this.def.watch.actions.length;
    this.watchFrame = Math.max(0, Math.min(total, frame));
    const e = this.freshEngine(this.def.params);
    for (let i = 0; i < this.watchFrame; i += 1)
      e.dispatch(this.def.watch.actions[i]);
    this.engine = e;
    if (this.watchFrame === total) this.record.watched = true;
    return {
      frame: this.watchFrame,
      total,
      caption: this.watchFrame
        ? this.def.watch.captions[this.watchFrame - 1]
        : null,
    };
  }
  // Autoplay is never started for a learner who asked for reduced motion; the controls step by hand.
  get canAutoplay() {
    return !this.reducedMotion;
  }

  submitExplain(text, frameIndex = null) {
    const words = String(text || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    const filled = frameIndex !== null && !/___/.test(String(text));
    const ok = words.length >= 4 && (frameIndex === null || filled);
    if (ok) this.record.explain = { words: words.length, frame: frameIndex };
    return {
      ok,
      feedback: ok
        ? null
        : F(
            "Write at least a short sentence, and fill in every blank if you used a frame.",
            "Escribe al menos una oración corta y completa todos los espacios si usaste un marco.",
          ),
    };
  }

  startTry() {
    // A parallel problem: same idea, different numbers, and the learner works with no hints on the answer.
    const params = this.def.try.gen(seeded(this.seed * 7919 + 13));
    this.tryEngine = this.freshEngine(params, "independent");
    this.tryQuestion = this.def.try.ask(this.tryEngine);
    this.record.try = { correct: null, attempts: 0, hints: 0 };
    return this.tryQuestion;
  }

  answerTry(value) {
    if (!this.tryQuestion) this.startTry();
    this.record.try.attempts += 1;
    const ok = equivalent(value, this.tryQuestion.answer);
    if (ok && this.record.try.correct === null) this.record.try.correct = true;
    return {
      ok,
      feedback: ok
        ? null
        : F(
            "Not quite. Use the model to check your thinking, then try again.",
            "Todavía no. Usa el modelo para comprobar tu razonamiento y vuelve a intentar.",
          ),
    };
  }
  tryHint() {
    this.record.try.hints += 1;
    return F(
      "Look at the picture and the numbers. Which quantity are you finding?",
      "Mira la imagen y los números. ¿Qué cantidad estás buscando?",
    );
  }

  canAdvance() {
    switch (this.kind) {
      case "predict":
        return this.record.predict !== null;
      case "build":
        return this.record.build.done;
      case "watch":
        return this.record.watched;
      case "explain":
        return this.record.explain !== null;
      case "try":
        return this.record.try?.correct === true;
      default:
        return false;
    }
  }

  next() {
    if (!this.canAdvance()) return false;
    this.index += 1;
    if (this.kind === "build") this.engine = this.freshEngine(this.def.params);
    if (this.kind === "watch") this.watchTo(0);
    if (this.kind === "try") this.startTry();
    return true;
  }

  // What the evidence engine may record. Only the parallel problem done alone, with no hint and on the first try, is independent.
  evidence() {
    const t = this.record.try;
    const independent = Boolean(
      t && t.correct && t.attempts === 1 && t.hints === 0,
    );
    return {
      lesson: this.id,
      seed: this.seed,
      predicted: this.record.predict?.ok ?? null,
      builtWithHints: this.record.build.hints,
      explained: Boolean(this.record.explain),
      tried: t
        ? { correct: t.correct === true, attempts: t.attempts, hints: t.hints }
        : null,
      independent,
      supported: Boolean(t && t.correct && !independent),
      complete: this.done,
    };
  }
}

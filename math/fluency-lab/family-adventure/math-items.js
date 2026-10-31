/* The Stop 2 challenge for each grade: one real model, two parallel versions (the second is the "try a fresh one"),
 * wrong answers that each name a real misconception, and a reason the child must pick as well as an answer.
 * `calc()` recomputes the correct answer from the numbers so tools can prove the stated answer is right. */
import { p } from "./core.js";

const miss = (en, es) => p(en, es);
const gcd = (a, b) => (b ? gcd(b, a % b) : a);

const money = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(2));

export const ITEMS = {
  1: {
    model: "tenFrame",
    skill: p("Make ten", "Formar diez"),
    watch: p(
      "Some children add 10 to the counters they see instead of counting the empty boxes.",
      "Algunos niños suman 10 a las fichas que ven en lugar de contar las casillas vacías.",
    ),
    vocab: [
      [p("ten-frame", "marco de diez"), p("a box of 10 spaces", "un marco de 10 casillas en 2 filas")],
      [p("make ten", "formar diez"), p("add on until you reach 10", "sumar hasta llegar a 10")],
    ],
    variants: [1, 2].map((_, i) => {
      const have = i ? 6 : 7;
      return {
        props: { initial: { count: 0 } },
        build: {
          prompt: p(
            `Tap the boxes to put ${have} counters in the ten-frame.`,
            `Toca las casillas para poner ${have} fichas en el marco de diez.`,
          ),
          ok: (s) => s.count === have,
        },
        q: p(
          `The ten-frame has ${have} counters. How many more make 10?`,
          `El marco de diez tiene ${have} fichas. ¿Cuántas más se necesitan para llegar a 10?`,
        ),
        calc: () => 10 - have,
        answer: String(10 - have),
        choices: [
          [String(10 - have), null],
          [
            String(have + 10),
            miss(
              `${have} + 10 adds a whole new ten. The frame already holds 10, so the answer is inside it.`,
              `${have} + 10 suma otra decena entera. El cuadro ya tiene 10, así que la respuesta está dentro de él.`,
            ),
          ],
          [
            String(have),
            miss(
              `${have} is how many counters are already there. Count the empty boxes instead.`,
              `${have} es cuántas fichas ya hay. Cuenta las casillas vacías.`,
            ),
          ],
          [
            String(10 - have + 1),
            miss(
              `Close. Touch each empty box once as you count; ${10 - have + 1} is one too many.`,
              `Casi. Toca cada casilla vacía una sola vez al contar; ${10 - have + 1} es uno de más.`,
            ),
          ],
        ],
        reasons: [
          [
            p(
              `The empty boxes are what is missing. There are ${10 - have}, so ${have} + ${10 - have} = 10.`,
              `Las casillas vacías son lo que falta. Hay ${10 - have}, así que ${have} + ${10 - have} = 10.`,
            ),
            null,
          ],
          [
            p(
              `Add ${have} and 10, because the frame holds 10.`,
              `Sumar ${have} y 10, porque el cuadro tiene 10.`,
            ),
            miss(
              "The frame is the whole 10. It is the total, not something to add on.",
              "El cuadro es el 10 completo. Es el total, no algo que se suma.",
            ),
          ],
          [
            p("Count all the boxes. There are 10.", "Contar todas las casillas. Hay 10."),
            miss(
              "All the boxes make 10, but the question asks only about the empty ones.",
              "Todas las casillas suman 10, pero la pregunta es solo por las vacías.",
            ),
          ],
        ],
        hints: [
          p(
            "Look at the empty boxes in the ten-frame.",
            "Mira las casillas vacías del marco de diez.",
          ),
          p(
            "Touch each empty box and count them one at a time.",
            "Toca cada casilla vacía y cuéntalas una por una.",
          ),
          p(
            `${have} counters + ? empty boxes = 10 boxes. Point at each empty box and say the numbers out loud: the last number you say is the answer.`,
            `${have} fichas + ? casillas vacías = 10 casillas. Señala cada casilla vacía y di los números en voz alta: el último número que digas es la respuesta.`,
          ),
        ],
        worked: p(
          `${have} counters fill ${have} boxes. 10 − ${have} = ${10 - have} boxes are empty, so ${have} + ${10 - have} = 10.`,
          `${have} fichas llenan ${have} casillas. 10 − ${have} = ${10 - have} casillas vacías, así que ${have} + ${10 - have} = 10.`,
        ),
        equation: `${have} + ${10 - have} = 10`,
      };
    }),
  },

  2: {
    model: "numberLine",
    skill: p("Add tens on a number line", "Sumar decenas en la recta numérica"),
    watch: p(
      "Some children add the 3 in “3 tens” to the ones place instead of adding 30.",
      "Algunos niños suman el 3 de «3 decenas» a las unidades en lugar de sumar 30.",
    ),
    vocab: [
      [
        p("number line", "recta numérica"),
        p("a line that shows numbers in order", "una línea que muestra los números en orden"),
      ],
      [p("ten", "decena"), p("a group of 10", "un grupo de 10")],
    ],
    variants: [
      { start: 47, tens: 3, wrong: [50, 17, 67] },
      { start: 62, tens: 2, wrong: [64, 42, 72] },
    ].map(({ start, tens, wrong }) => {
      const end = start + tens * 10;
      const path = Array.from({ length: tens + 1 }, (_, k) => start + k * 10);
      return {
        props: { min: 40, max: 100, start, hops: [10, 1] },
        build: {
          prompt: p(
            `Start at ${start}. Make one hop of +10 and see where you land.`,
            `Empieza en ${start}. Da un salto de +10 y mira dónde caes.`,
          ),
          ok: (s) => s.at === start + 10 && s.path.length === 2,
        },
        q: p(
          `Start at ${start} and hop ${tens} tens. Where do you land?`,
          `Empieza en ${start} y da ${tens} saltos de decenas. ¿Dónde llegas?`,
        ),
        calc: () => start + tens * 10,
        answer: String(end),
        choices: [
          [String(end), null],
          [
            String(wrong[0]),
            miss(
              `${wrong[0]} comes from adding ${wrong[0] - start} ones. A hop of ten moves 10, so ${tens} hops move ${tens * 10}.`,
              `${wrong[0]} sale de sumar ${wrong[0] - start} unidades. Un salto de diez avanza 10, así que ${tens} saltos avanzan ${tens * 10}.`,
            ),
          ],
          [
            String(wrong[1]),
            miss(
              `${wrong[1]} is smaller than ${start}. Adding moves to the right, so the number gets bigger.`,
              `${wrong[1]} es menor que ${start}. Sumar mueve hacia la derecha, así que el número crece.`,
            ),
          ],
          [
            String(wrong[2]),
            miss(
              `That is only ${tens - 1} ${tens - 1 === 1 ? "hop" : "hops"} of ten. The question asks for ${tens}.`,
              `Eso son solo ${tens - 1} ${tens - 1 === 1 ? "salto" : "saltos"} de diez. La pregunta pide ${tens}.`,
            ),
          ],
        ],
        reasons: [
          [
            p(
              `Each hop of 10 adds 1 ten and the ${start % 10} ones stay the same: ${path.join(", ")}.`,
              `Cada salto de 10 suma 1 decena y las ${start % 10} unidades no cambian: ${path.join(", ")}.`,
            ),
            null,
          ],
          [
            p(
              `Add ${tens} to the ones: ${start % 10} + ${tens}.`,
              `Sumar ${tens} a las unidades: ${start % 10} + ${tens}.`,
            ),
            miss(
              `${tens} tens is ${tens * 10}, not ${tens}. The ones digit does not change when you add tens.`,
              `${tens} decenas es ${tens * 10}, no ${tens}. El dígito de las unidades no cambia al sumar decenas.`,
            ),
          ],
          [
            p(`Hop ${tens} times by 1.`, `Dar ${tens} saltos de 1.`),
            miss(
              `A hop of 1 moves only 1 space, so ${tens} of them reach just ${start + tens}.`,
              `Un salto de 1 avanza solo 1 espacio, así que ${tens} saltos llegan solo a ${start + tens}.`,
            ),
          ],
        ],
        hints: [
          p(
            "Look at the numbers under the line. Which way do the hops of ten go?",
            "Mira los números debajo de la recta. ¿Hacia dónde van los saltos de diez?",
          ),
          p(
            `Each hop of ten lands ten spaces to the right. Make the first hop and read where you land.`,
            `Cada salto de diez cae diez lugares a la derecha. Da el primer salto y lee dónde caes.`,
          ),
          p(
            `Keep hopping by ten, one hop at a time, and say each number out loud. Stop when you have made ${tens} hops.`,
            `Sigue saltando de diez en diez, un salto a la vez, y di cada número en voz alta. Para cuando hayas dado ${tens} saltos.`,
          ),
        ],
        worked: p(
          `${tens} tens = ${tens * 10}. ${start} + ${tens * 10} = ${end}.`,
          `${tens} decenas = ${tens * 10}. ${start} + ${tens * 10} = ${end}.`,
        ),
        equation: `${start} + ${tens * 10} = ${end}`,
      };
    }),
  },

  3: {
    model: "fractionBars",
    skill: p("Compare fractions", "Comparar fracciones"),
    watch: p(
      "Many children think a bigger bottom number means a bigger fraction.",
      "Muchos niños creen que un número de abajo más grande significa una fracción más grande.",
    ),
    vocab: [
      [p("fraction", "fracción"), p("part of a whole", "parte de un entero")],
      [
        p("equal parts", "partes iguales"),
        p("pieces that are the same size", "pedazos del mismo tamaño"),
      ],
      [
        p("numerator / denominator", "numerador / denominador"),
        p("top number / bottom number", "número de arriba / número de abajo"),
      ],
    ],
    variants: [
      { a: [1, 3], b: [1, 4], same: "unit" },
      { a: [2, 3], b: [2, 5], same: "top" },
    ].map(({ a, b }) => {
      const big = `${a[0]}/${a[1]}`;
      const small = `${b[0]}/${b[1]}`;
      const tops = a[0];
      return {
        props: {
          initial: {
            bars: [
              { n: 0, d: a[1] },
              { n: 0, d: b[1] },
            ],
          },
          fixedDen: true,
        },
        build: {
          prompt: p(
            `Shade ${big} on bar A and ${small} on bar B.`,
            `Sombrea ${big} en la barra A y ${small} en la barra B.`,
          ),
          ok: (s) => s.bars[0].n === a[0] && s.bars[1].n === b[0],
        },
        q: p(`Which is greater: ${big} or ${small}?`, `¿Cuál es mayor: ${big} o ${small}?`),
        calc: () => (a[0] * b[1] > b[0] * a[1] ? big : small),
        answer: big,
        choices: [
          [big, null],
          [
            small,
            miss(
              `${b[1]} is greater than ${a[1]}, but the bottom number tells how many equal parts the whole is cut into. More parts means smaller parts.`,
              `${b[1]} es mayor que ${a[1]}, pero el número de abajo dice en cuántas partes iguales se corta el entero. Más partes significa partes más pequeñas.`,
            ),
          ],
          [
            p("They are equal", "Son iguales"),
            miss(
              "Compare the shaded lengths on the bars. They are not the same.",
              "Compara las longitudes sombreadas de las barras. No son iguales.",
            ),
          ],
        ],
        reasons: [
          [
            p(
              `${tops === 1 ? "Cutting" : `Both shade ${tops} parts, but cutting`} a whole into ${a[1]} parts makes bigger parts than cutting it into ${b[1]}, so ${big} covers more of the bar.`,
              `${tops === 1 ? "Cortar" : `Las dos sombrean ${tops} partes, pero cortar`} un entero en ${a[1]} partes da partes más grandes que cortarlo en ${b[1]}, así que ${big} cubre más de la barra.`,
            ),
            null,
          ],
          [
            p(
              `${b[1]} is greater than ${a[1]}, so ${small} is greater.`,
              `${b[1]} es mayor que ${a[1]}, así que ${small} es mayor.`,
            ),
            miss(
              "That compares the bottom numbers as if they were whole numbers. Look at the size of the pieces instead.",
              "Eso compara los números de abajo como si fueran enteros. Mira mejor el tamaño de los pedazos.",
            ),
          ],
          [
            p(
              `Both have ${tops} ${tops === 1 ? "part" : "parts"} shaded, so they are the same.`,
              `Las dos tienen ${tops} ${tops === 1 ? "parte sombreada" : "partes sombreadas"}, así que son iguales.`,
            ),
            miss(
              "Same number of parts, but the parts are different sizes because the wholes are cut differently.",
              "Igual cantidad de partes, pero de distinto tamaño porque los enteros se cortan de manera diferente.",
            ),
          ],
        ],
        hints: [
          p(
            "Look at the two shaded pieces. Which one is longer?",
            "Mira los dos pedazos sombreados. ¿Cuál es más largo?",
          ),
          p(
            `Both bars are the same whole. Bar A is cut into ${a[1]} parts and bar B into ${b[1]}. Which parts are bigger?`,
            `Las dos barras son el mismo entero. La barra A está cortada en ${a[1]} partes y la B en ${b[1]}. ¿Qué partes son más grandes?`,
          ),
          p(
            "The more equal parts a whole is cut into, the smaller each part. Compare one part from each bar.",
            "Cuantas más partes iguales tiene un entero, más pequeña es cada parte. Compara una parte de cada barra.",
          ),
        ],
        worked: p(
          `The wholes are the same size, but the pieces are not. ${a[1]} parts make bigger pieces than ${b[1]} parts, so ${big} > ${small}.`,
          `Los enteros son iguales, pero los pedazos no. ${a[1]} partes dan pedazos más grandes que ${b[1]} partes, así que ${big} > ${small}.`,
        ),
        equation: `${big} > ${small}`,
      };
    }),
  },

  4: {
    model: "areaModel",
    skill: p("Multiply with an area model", "Multiplicar con un modelo de área"),
    watch: p(
      "Some children treat the 2 in 23 as 2 ones and forget it means 20.",
      "Algunos niños tratan el 2 de 23 como 2 unidades y olvidan que vale 20.",
    ),
    vocab: [
      [
        p("area model", "modelo de área"),
        p("a rectangle that shows multiplying", "un rectángulo que muestra la multiplicación"),
      ],
      [
        p("partial products", "productos parciales"),
        p("small answers you add together", "respuestas pequeñas que se suman"),
      ],
    ],
    variants: [
      { a: 23, b: 4, wrong: [20, 83, 96] },
      { a: 34, b: 3, wrong: [21, 94, 105] },
    ].map(({ a, b, wrong }) => {
      const tens = Math.floor(a / 10) * 10;
      const ones = a - tens;
      const total = a * b;
      return {
        props: { a, b },
        build: {
          prompt: p(
            `Press the button to break ${a} into ${tens} + ${ones}.`,
            `Presiona el botón para descomponer ${a} en ${tens} + ${ones}.`,
          ),
          ok: (s) => s.split === true,
        },
        q: p(`What is ${b} × ${a}?`, `¿Cuánto es ${b} × ${a}?`),
        calc: () => b * a,
        answer: String(total),
        choices: [
          [String(total), null],
          [
            String(wrong[0]),
            miss(
              `${b} × ${tens / 10} + ${b} × ${ones} = ${wrong[0]} treats the ${tens / 10} as ${tens / 10} ones. It is ${tens}, so ${b} × ${tens} = ${b * tens}.`,
              `${b} × ${tens / 10} + ${b} × ${ones} = ${wrong[0]} trata el ${tens / 10} como ${tens / 10} unidades. Vale ${tens}, así que ${b} × ${tens} = ${b * tens}.`,
            ),
          ],
          [
            String(wrong[1]),
            miss(
              `You multiplied the ${tens} but only added the ${ones}. The ${ones} ones are also ${b} times: ${b} × ${ones} = ${b * ones}.`,
              `Multiplicaste el ${tens} pero solo sumaste el ${ones}. Las ${ones} unidades también se repiten ${b} veces: ${b} × ${ones} = ${b * ones}.`,
            ),
          ],
          [
            String(wrong[2]),
            miss(
              `The ones part is one group of ${b} too big. Check ${b} × ${ones} again.`,
              `La parte de las unidades tiene un grupo de ${b} de más. Revisa otra vez ${b} × ${ones}.`,
            ),
          ],
        ],
        reasons: [
          [
            p(
              `Break ${a} into ${tens} + ${ones}: ${b} × ${tens} = ${b * tens} and ${b} × ${ones} = ${b * ones}, and ${b * tens} + ${b * ones} = ${total}.`,
              `Separa ${a} en ${tens} + ${ones}: ${b} × ${tens} = ${b * tens} y ${b} × ${ones} = ${b * ones}, y ${b * tens} + ${b * ones} = ${total}.`,
            ),
            null,
          ],
          [
            p(
              `${b} × ${tens / 10} = ${b * (tens / 10)} and ${b} × ${ones} = ${b * ones}, so add ${b * (tens / 10)} + ${b * ones}.`,
              `${b} × ${tens / 10} = ${b * (tens / 10)} y ${b} × ${ones} = ${b * ones}, así que suma ${b * (tens / 10)} + ${b * ones}.`,
            ),
            miss(
              `The ${tens / 10} in ${a} stands for ${tens}, not ${tens / 10}. Its rectangle is much bigger.`,
              `El ${tens / 10} de ${a} representa ${tens}, no ${tens / 10}. Su rectángulo es mucho más grande.`,
            ),
          ],
          [
            p(
              `${b} × ${tens} = ${b * tens}, then add the ${ones}.`,
              `${b} × ${tens} = ${b * tens}, y luego sumar el ${ones}.`,
            ),
            miss(
              `Both rectangles count. The small one is ${b} rows of ${ones}, which is ${b * ones}, not ${ones}.`,
              `Los dos rectángulos cuentan. El pequeño es ${b} filas de ${ones}, que son ${b * ones}, no ${ones}.`,
            ),
          ],
        ],
        hints: [
          p(
            "Look at the two rectangles. Each one is its own multiplication.",
            "Mira los dos rectángulos. Cada uno es su propia multiplicación.",
          ),
          p(
            `Find the area of the big rectangle (${b} × ${tens}) and the small one (${b} × ${ones}).`,
            `Halla el área del rectángulo grande (${b} × ${tens}) y del pequeño (${b} × ${ones}).`,
          ),
          p(
            `${b} × ${tens} = ${b * tens}. ${b} × ${ones} = ${b * ones}. Now add the two areas.`,
            `${b} × ${tens} = ${b * tens}. ${b} × ${ones} = ${b * ones}. Ahora suma las dos áreas.`,
          ),
        ],
        worked: p(
          `${b} × ${a} = ${b} × ${tens} + ${b} × ${ones} = ${b * tens} + ${b * ones} = ${total}.`,
          `${b} × ${a} = ${b} × ${tens} + ${b} × ${ones} = ${b * tens} + ${b * ones} = ${total}.`,
        ),
        equation: `${b} × ${a} = ${total}`,
      };
    }),
  },

  5: {
    model: "baseTen",
    skill: p("Compare decimals", "Comparar decimales"),
    watch: p(
      "Many children think the decimal with more digits is bigger.",
      "Muchos niños creen que el decimal con más dígitos es mayor.",
    ),
    vocab: [
      [
        p("tenths / hundredths", "décimas / centésimas"),
        p("one of 10 / one of 100 equal parts", "una de 10 / una de 100 partes iguales"),
      ],
      [
        p("decimal", "decimal"),
        p("a number with a point, like 0.5", "un número con punto, como 0.5"),
      ],
    ],
    variants: [
      { big: [5, 0], small: [4, 5] },
      { big: [3, 0], small: [2, 7] },
    ].map(({ big, small }) => {
      const B = `0.${big[0]}`;
      const S = `0.${small[0]}${small[1]}`;
      const bigHundredths = big[0] * 10;
      const smallHundredths = small[0] * 10 + small[1];
      return {
        props: { initial: { h: 0, t: 0, o: 0, decimal: true }, lockMode: true },
        build: {
          prompt: p(
            `Show ${S}: ${small[0]} rods and ${small[1]} units.`,
            `Muestra ${S}: ${small[0]} barras y ${small[1]} cubitos.`,
          ),
          ok: (s) => s.t === small[0] && s.o === small[1] && s.h === 0,
        },
        q: p(`Which is greater: ${B} or ${S}?`, `¿Cuál es mayor: ${B} o ${S}?`),
        calc: () => (bigHundredths > smallHundredths ? B : S),
        answer: B,
        choices: [
          [B, null],
          [
            S,
            miss(
              `${S.slice(2)} is bigger than ${B.slice(2)} as a whole number, but these are decimals. ${B} is ${big[0]} tenths, which is ${bigHundredths} hundredths, and ${bigHundredths} is more than ${smallHundredths}.`,
              `${S.slice(2)} es mayor que ${B.slice(2)} como número entero, pero estos son decimales. ${B} es ${big[0]} décimas, o sea ${bigHundredths} centésimas, y ${bigHundredths} es más que ${smallHundredths}.`,
            ),
          ],
          [
            p("They are equal", "Son iguales"),
            miss(
              `${B} is ${big[0]} rods. ${S} is ${small[0]} rods and ${small[1]} units. They are not the same amount.`,
              `${B} son ${big[0]} barras. ${S} son ${small[0]} barras y ${small[1]} cubitos. No es la misma cantidad.`,
            ),
          ],
        ],
        reasons: [
          [
            p(
              `${B} is ${big[0]} tenths = ${bigHundredths} hundredths. ${S} is ${smallHundredths} hundredths. ${bigHundredths} is more.`,
              `${B} son ${big[0]} décimas = ${bigHundredths} centésimas. ${S} son ${smallHundredths} centésimas. ${bigHundredths} es más.`,
            ),
            null,
          ],
          [
            p(
              `${S} has more digits, so it is greater.`,
              `${S} tiene más dígitos, así que es mayor.`,
            ),
            miss(
              "More digits do not make a decimal bigger. Compare place by place, starting with tenths.",
              "Más dígitos no hacen más grande a un decimal. Compara lugar por lugar, empezando por las décimas.",
            ),
          ],
          [
            p(
              `${B} and ${S} look about the same, so they are equal.`,
              `${B} y ${S} se ven casi iguales, así que son iguales.`,
            ),
            miss(
              "Looking alike is not the same as being equal. Compare the tenths place first.",
              "Verse parecidos no es lo mismo que ser iguales. Compara primero el lugar de las décimas.",
            ),
          ],
        ],
        hints: [
          p(
            "Compare the tenths first. How many rods does each number have?",
            "Compara primero las décimas. ¿Cuántas barras tiene cada número?",
          ),
          p(
            `${B} has ${big[0]} rods. ${S} has ${small[0]} rods and ${small[1]} units. Which has more rods?`,
            `${B} tiene ${big[0]} barras. ${S} tiene ${small[0]} barras y ${small[1]} cubitos. ¿Cuál tiene más barras?`,
          ),
          p(
            `Trade the rods for units: ${big[0]} rods = ${bigHundredths} units. Compare ${bigHundredths} units with ${smallHundredths} units.`,
            `Cambia las barras por cubitos: ${big[0]} barras = ${bigHundredths} cubitos. Compara ${bigHundredths} cubitos con ${smallHundredths} cubitos.`,
          ),
        ],
        worked: p(
          `${B} = ${bigHundredths} hundredths and ${S} = ${smallHundredths} hundredths. ${bigHundredths} > ${smallHundredths}, so ${B} > ${S}.`,
          `${B} = ${bigHundredths} centésimas y ${S} = ${smallHundredths} centésimas. ${bigHundredths} > ${smallHundredths}, así que ${B} > ${S}.`,
        ),
        equation: `${B} > ${S}`,
      };
    }),
  },

  6: {
    model: "ratioModel",
    skill: p("Equivalent ratios", "Razones equivalentes"),
    watch: p(
      "Many children add the same amount to both parts instead of making equal batches.",
      "Muchos niños suman la misma cantidad a las dos partes en lugar de formar tandas iguales.",
    ),
    vocab: [
      [p("ratio", "razón"), p("a comparison of two amounts", "una comparación de dos cantidades")],
      [
        p("for every", "por cada"),
        p("each batch has the same amounts", "cada tanda tiene las mismas cantidades"),
      ],
    ],
    variants: [
      {
        a: 2,
        b: 3,
        n: 4,
        nameA: p("juice (cups)", "jugo (tazas)"),
        nameB: p("sparkling water (cups)", "agua con gas (tazas)"),
        unitA: p("cups of juice", "tazas de jugo"),
        unitB: p("cups of sparkling water", "tazas de agua con gas"),
        wrong: [11, 18, 9],
      },
      {
        a: 3,
        b: 5,
        n: 4,
        nameA: p("red beads", "cuentas rojas"),
        nameB: p("blue beads", "cuentas azules"),
        unitA: p("red beads", "cuentas rojas"),
        unitB: p("blue beads", "cuentas azules"),
        wrong: [18, 15, 17],
      },
    ].map(({ a, b, n, nameA, nameB, unitA, unitB, wrong }, i) => {
      const bTotal = b * n;
      const aTotal = a * n;
      const wrongAdd = a + (bTotal - b);
      return {
        props: { a, b, nameA, nameB, max: 6, unitRow: false },
        build: {
          prompt: p(`Use + to make ${n} batches.`, `Usa + para hacer ${n} tandas.`),
          ok: (s) => s.n === n,
        },
        q:
          i === 0
            ? p(
                `A drink mix uses 2 cups of juice for every 3 cups of sparkling water. How many cups of juice go with 12 cups of sparkling water?`,
                `Una mezcla usa 2 tazas de jugo por cada 3 tazas de agua con gas. ¿Cuántas tazas de jugo van con 12 tazas de agua con gas?`,
              )
            : p(
                `A bracelet uses 3 red beads for every 5 blue beads. How many red beads go with 20 blue beads?`,
                `Una pulsera usa 3 cuentas rojas por cada 5 cuentas azules. ¿Cuántas cuentas rojas van con 20 cuentas azules?`,
              ),
        calc: () => (bTotal / b) * a,
        answer: String(aTotal),
        choices: [
          [String(aTotal), null],
          [
            String(wrongAdd),
            miss(
              `${wrongAdd} comes from adding the same amount to both parts (${bTotal} − ${b} = ${bTotal - b}, so ${a} + ${bTotal - b}). Ratios grow by equal batches, not by adding the same number.`,
              `${wrongAdd} sale de sumar la misma cantidad a las dos partes (${bTotal} − ${b} = ${bTotal - b}, así que ${a} + ${bTotal - b}). Las razones crecen con tandas iguales, no sumando el mismo número.`,
            ),
          ],
          [
            String(wrong[1]),
            i === 0
              ? miss(
                  "That flips the ratio. There is less juice than water in every batch, so the answer must be smaller than 12.",
                  "Eso invierte la razón. En cada tanda hay menos jugo que agua, así que la respuesta debe ser menor que 12.",
                )
              : miss(
                  `${wrong[1]} is ${bTotal} − ${b}. That is how much the blue beads grew, not how many red beads match.`,
                  `${wrong[1]} es ${bTotal} − ${b}. Eso es cuánto crecieron las cuentas azules, no cuántas rojas corresponden.`,
                ),
          ],
        ],
        reasons: [
          [
            p(
              `${bTotal} ${unitB.en} is ${n} batches of ${b}. Each batch has ${a} ${unitA.en}, so ${n} × ${a} = ${aTotal}.`,
              `${bTotal} ${unitB.es} son ${n} tandas de ${b}. Cada tanda tiene ${a} ${unitA.es}, así que ${n} × ${a} = ${aTotal}.`,
            ),
            null,
          ],
          [
            p(
              `The amount of ${unitB.en} grew by ${bTotal - b}, so the amount of ${unitA.en} grows by ${bTotal - b} too.`,
              `La cantidad de ${unitB.es} aumentó ${bTotal - b}, así que la cantidad de ${unitA.es} también aumenta ${bTotal - b}.`,
            ),
            miss(
              "Adding the same amount breaks the ratio. Each batch must keep the same amounts.",
              "Sumar la misma cantidad rompe la razón. Cada tanda debe conservar las mismas cantidades.",
            ),
          ],
          [
            p("Swap the numbers and multiply.", "Cambiar los números de lugar y multiplicar."),
            miss(
              "Swapping the parts describes a different ratio. Keep each amount with its own item.",
              "Cambiar las partes describe otra razón. Mantén cada cantidad con su propio objeto.",
            ),
          ],
        ],
        hints: [
          p(
            "Look at one batch on the tape. How many of each?",
            "Mira una tanda en la cinta. ¿Cuántos hay de cada uno?",
          ),
          p(
            `How many batches of ${b} fit in ${bTotal}?`,
            `¿Cuántas tandas de ${b} caben en ${bTotal}?`,
          ),
          p(
            `${bTotal} ÷ ${b} = ${n} batches. Each batch has ${a} of the first item. ${n} × ${a} = ?`,
            `${bTotal} ÷ ${b} = ${n} tandas. Cada tanda tiene ${a} del primer objeto. ${n} × ${a} = ?`,
          ),
        ],
        worked: p(
          `${bTotal} ÷ ${b} = ${n} batches, and ${n} × ${a} = ${aTotal}.`,
          `${bTotal} ÷ ${b} = ${n} tandas, y ${n} × ${a} = ${aTotal}.`,
        ),
        equation: `${a}:${b} = ${aTotal}:${bTotal}`,
      };
    }),
  },

  7: {
    model: "ratioModel",
    skill: p("Unit rate", "Tasa unitaria"),
    watch: p(
      "Many students add to find a cost instead of using the cost of 1.",
      "Muchos estudiantes suman para hallar un costo en lugar de usar el costo de 1.",
    ),
    vocab: [
      [
        p("unit rate", "tasa unitaria"),
        p("the amount for exactly 1", "la cantidad para exactamente 1"),
      ],
      [
        p("proportional", "proporcional"),
        p("always grows by the same rate", "las dos cantidades mantienen siempre la misma razón"),
      ],
    ],
    variants: [
      {
        a: 4,
        b: 6,
        want: 10,
        nameA: p("pens", "bolígrafos"),
        nameB: p("dollars", "dólares"),
        noun: p("pens", "bolígrafos"),
        wrong: [12, 60],
      },
      {
        a: 3,
        b: 9,
        want: 8,
        nameA: p("gallons", "galones"),
        nameB: p("dollars", "dólares"),
        noun: p("gallons of gas", "galones de gasolina"),
        wrong: [14, 72],
      },
    ].map(({ a, b, want, nameA, nameB, noun, wrong }) => {
      const rate = b / a;
      const total = rate * want;
      return {
        props: { a, b, nameA, nameB, max: 3, unitRow: true },
        build: {
          prompt: p(
            `Press “Find the amount for 1” to see the cost of 1.`,
            `Presiona «Hallar la cantidad para 1» para ver el costo de 1.`,
          ),
          ok: (s) => s.unit === true,
        },
        q: p(
          `${a} ${noun.en} cost $${b}. At the same rate, how much do ${want} ${noun.en} cost?`,
          `${a} ${noun.es} cuestan $${b}. Con la misma tasa, ¿cuánto cuestan ${want} ${noun.es}?`,
        ),
        calc: () => (b / a) * want,
        answer: `$${total}`,
        choices: [
          [`$${total}`, null],
          [
            `$${wrong[0]}`,
            miss(
              `$${wrong[0]} adds the extra ${want - a} ${noun.en} to the cost as if each cost $1. Find the cost of 1 first: $${b} ÷ ${a} = $${money(rate)}.`,
              `$${wrong[0]} suma los ${want - a} extra al costo como si cada uno costara $1. Primero halla el costo de 1: $${b} ÷ ${a} = $${money(rate)}.`,
            ),
          ],
          [
            `$${wrong[1]}`,
            miss(
              `${want} × $${b} multiplies the price of ${a} by ${want}. The $${b} is for ${a}, not for 1.`,
              `${want} × $${b} multiplica el precio de ${a} por ${want}. Los $${b} son por ${a}, no por 1.`,
            ),
          ],
        ],
        reasons: [
          [
            p(
              `1 costs $${b} ÷ ${a} = $${money(rate)}, so ${want} cost ${want} × $${money(rate)} = $${total}.`,
              `1 cuesta $${b} ÷ ${a} = $${money(rate)}, así que ${want} cuestan ${want} × $${money(rate)} = $${total}.`,
            ),
            null,
          ],
          [
            p(
              `${want} is ${want - a} more than ${a}, so add $${want - a} to $${b}.`,
              `${want} es ${want - a} más que ${a}, así que se suman $${want - a} a $${b}.`,
            ),
            miss(
              "Each extra item costs the unit rate, not $1. Adding the count to the cost mixes two different units.",
              "Cada objeto extra cuesta la tasa unitaria, no $1. Sumar la cantidad al costo mezcla dos unidades distintas.",
            ),
          ],
          [
            p(`Multiply ${want} by $${b}.`, `Multiplicar ${want} por $${b}.`),
            miss(
              `$${b} pays for ${a}. Multiplying by ${want} would price ${want} sets of ${a}.`,
              `$${b} pagan ${a}. Multiplicar por ${want} da el precio de ${want} grupos de ${a}.`,
            ),
          ],
        ],
        hints: [
          p(
            "Find what 1 costs. The table can show it.",
            "Halla cuánto cuesta 1. La tabla puede mostrarlo.",
          ),
          p(
            `Split the cost evenly: $${b} ÷ ${a}.`,
            `Reparte el costo en partes iguales: $${b} ÷ ${a}.`,
          ),
          p(
            `1 costs $${money(rate)}. Now find ${want} of them: ${want} × $${money(rate)}.`,
            `1 cuesta $${money(rate)}. Ahora halla ${want}: ${want} × $${money(rate)}.`,
          ),
        ],
        worked: p(
          `$${b} ÷ ${a} = $${money(rate)} for 1. ${want} × $${money(rate)} = $${total}.`,
          `$${b} ÷ ${a} = $${money(rate)} por 1. ${want} × $${money(rate)} = $${total}.`,
        ),
        equation: `${want} × ${rate} = ${total}`,
      };
    }),
  },

  8: {
    model: "slopeGraph",
    skill: p("Slope as a rate", "La pendiente como tasa"),
    watch: p(
      "Some students subtract the coordinates, or flip rise and run.",
      "Algunos estudiantes restan las coordenadas, o invierten la subida y el avance.",
    ),
    vocab: [
      [
        p("slope", "pendiente"),
        p("how steep a line is: rise ÷ run", "qué tan inclinada es una recta: subida ÷ avance"),
      ],
      [p("rise / run", "subida / avance"), p("up and over", "hacia arriba y hacia el lado")],
    ],
    variants: [
      { x: 4, y: 6 },
      { x: 5, y: 2 },
    ].map(({ x, y }) => {
      const g = gcd(x, y);
      const flip = `${x / g}/${y / g}`;
      const right = `${y / g}/${x / g}`;
      const sub = String(Math.abs(y - x));
      const hi = Math.max(x, y);
      const lo = Math.min(x, y);
      return {
        props: { x, y, maxX: 8, maxY: 10 },
        build: {
          prompt: p(
            `Move the run to ${x} to see the slope triangle reach the point (${x}, ${y}).`,
            `Mueve el avance a ${x} para que el triángulo llegue al punto (${x}, ${y}).`,
          ),
          ok: (s) => s.run === x,
        },
        q: p(
          `A line passes through (0, 0) and (${x}, ${y}). What is its slope?`,
          `Una recta pasa por (0, 0) y (${x}, ${y}). ¿Cuál es su pendiente?`,
        ),
        calc: () => `${y / g}/${x / g}`,
        answer: right,
        choices: [
          [right, null],
          [
            flip,
            miss(
              `${flip} is run ÷ rise. Slope is rise over run: how far up for each step right.`,
              `${flip} es avance ÷ subida. La pendiente es subida entre avance: cuánto sube por cada paso a la derecha.`,
            ),
          ],
          [
            sub,
            miss(
              `${hi} − ${lo} = ${sub} compares the numbers by subtracting. Slope compares by dividing: rise ÷ run.`,
              `${hi} − ${lo} = ${sub} compara los números restando. La pendiente compara dividiendo: subida ÷ avance.`,
            ),
          ],
        ],
        reasons: [
          [
            p(
              `Rise ÷ run = ${y} ÷ ${x} = ${right}. That is how far up the line goes for 1 step right.`,
              `Subida ÷ avance = ${y} ÷ ${x} = ${right}. Eso es cuánto sube la recta por 1 paso a la derecha.`,
            ),
            null,
          ],
          [
            p(`Run ÷ rise = ${x} ÷ ${y}.`, `Avance ÷ subida = ${x} ÷ ${y}.`),
            miss(
              "Slope puts the up-and-down change on top. Run goes on the bottom.",
              "En la pendiente, el cambio hacia arriba va arriba. El avance va abajo.",
            ),
          ],
          [
            p(`Subtract: ${y} − ${x}.`, `Restar: ${y} − ${x}.`),
            miss(
              "Slope is a rate, a comparison by dividing, not a difference.",
              "La pendiente es una tasa, una comparación con división, no una diferencia.",
            ),
          ],
        ],
        hints: [
          p(
            "Look at the dashed triangle. One side is the run, the other is the rise.",
            "Mira el triángulo de línea discontinua. Un lado es el avance y el otro es la subida.",
          ),
          p(
            "Slope = rise ÷ run. Read the rise and the run from the graph.",
            "Pendiente = subida ÷ avance. Lee la subida y el avance en la gráfica.",
          ),
          p(
            `The run is ${x} and the rise is ${y}. Divide: ${y} ÷ ${x}.`,
            `El avance es ${x} y la subida es ${y}. Divide: ${y} ÷ ${x}.`,
          ),
        ],
        worked: p(
          `Slope = rise ÷ run = ${y} ÷ ${x} = ${right}.`,
          `Pendiente = subida ÷ avance = ${y} ÷ ${x} = ${right}.`,
        ),
        equation: `${y} ÷ ${x} = ${right}`,
      };
    }),
  },
};

/** The first version of a grade's challenge, used by tools. */
export const itemFor = (grade, variant = 0) => ITEMS[grade]?.variants[variant];

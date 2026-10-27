// Tier 2 hints: worked PARALLEL examples with other numbers; hints.js picks the first one that does not leak the answer.
// @fm2 FM-032 FM-062 FM-020
import { factorPairs, gcd, lcm } from "./measure.js";
import { H } from "./hints-text.js";

const pairsText = (area) =>
  factorPairs(area)
    .map(([a, b]) => `${a} × ${b}`)
    .join(", ");

// Tier 2: worked parallel examples with other numbers. Each returns candidates; the first one that does not leak wins.
export const TIER2 = {
  dims: () =>
    [
      [2, 5],
      [3, 4],
      [2, 3],
      [4, 2],
      [3, 5],
      [5, 2],
      [4, 3],
    ].map(([p, q]) =>
      H(
        `Example: for ${p} rows with ${q} in each row, set Rows to ${p} and Columns to ${q}. The readout shows ${p} rows and ${q} columns.`,
        `Ejemplo: para ${p} filas con ${q} en cada fila, fija Filas en ${p} y Columnas en ${q}. El resumen muestra ${p} filas y ${q} columnas.`,
      ),
    ),
  repeat: () =>
    [
      [2, 3],
      [3, 4],
      [4, 2],
      [2, 5],
      [3, 3],
      [5, 2],
    ].map(([p, q]) =>
      H(
        `Example: ${Array(p).fill(q).join(" + ")} has ${p} numbers that are each ${q}, so build ${p} rows with ${q} in each row.`,
        `Ejemplo: ${Array(p).fill(q).join(" + ")} tiene ${p} números que valen ${q}, así que construye ${p} filas con ${q} en cada fila.`,
      ),
    ),
  skip: () =>
    [
      [3, 2],
      [4, 3],
      [3, 5],
      [2, 4],
      [4, 2],
    ].map(([p, q]) =>
      H(
        `Example: counting by ${q}s ${Array.from({ length: p }, (_, i) => q * (i + 1)).join(", ")} has ${p} counts, so build ${p} rows with ${q} in each row.`,
        `Ejemplo: contar de ${q} en ${q}, ${Array.from({ length: p }, (_, i) => q * (i + 1)).join(", ")}, tiene ${p} conteos, así que construye ${p} filas con ${q} en cada fila.`,
      ),
    ),
  areaOnly: () =>
    [
      [2, 5],
      [2, 4],
      [3, 4],
      [2, 3],
      [3, 5],
      [2, 6],
      [4, 5],
    ]
      .map(([p, q]) =>
        H(
          `Example: for ${p * q}, try ${p} rows. ${p * q} shared into ${p} equal rows gives ${q} in each row, so ${p} rows works with ${q} in each row.`,
          `Ejemplo: para ${p * q}, prueba ${p} filas. ${p * q} repartido en ${p} filas iguales da ${q} en cada fila, así que ${p} filas sirve con ${q} en cada fila.`,
        ),
      ),
  areaRows: () =>
    [
      [3, 4],
      [2, 5],
      [4, 3],
      [2, 6],
      [5, 2],
      [3, 5],
      [2, 7],
    ].map(([p, q]) =>
      H(
        `Example: ${p * q} counters in ${p} equal rows. ${p * q} ÷ ${p} gives ${q} in each row, so build ${p} rows of ${q}.`,
        `Ejemplo: ${p * q} fichas en ${p} filas iguales. ${p * q} ÷ ${p} da ${q} en cada fila, así que construye ${p} filas de ${q}.`,
      ),
    ),
  perim: () =>
    [
      [10, 2, 3],
      [12, 2, 4],
      [14, 3, 4],
      [16, 3, 5],
      [18, 4, 5],
      [20, 4, 6],
      [8, 1, 3],
    ].map(([P, p, q]) =>
      H(
        `Example: for a perimeter of ${P}, half is ${P / 2}. Choose ${p} rows and ${q} columns because ${p} + ${q} = ${P / 2}. Check: ${p} + ${q} + ${p} + ${q} = ${P}.`,
        `Ejemplo: para un perímetro de ${P}, la mitad es ${P / 2}. Elige ${p} filas y ${q} columnas porque ${p} + ${q} = ${P / 2}. Comprueba: ${p} + ${q} + ${p} + ${q} = ${P}.`,
      ),
    ),
  perimSide: () =>
    [
      [14, 3, 4],
      [12, 2, 4],
      [16, 3, 5],
      [18, 4, 5],
      [20, 4, 6],
      [10, 1, 4],
    ].map(([P, s, o]) =>
      H(
        `Example: perimeter ${P} with one side ${s}. Half of ${P} is ${P / 2}, and ${P / 2} − ${s} = ${o}, so the sides are ${s} and ${o}.`,
        `Ejemplo: perímetro ${P} con un lado de ${s}. La mitad de ${P} es ${P / 2}, y ${P / 2} − ${s} = ${o}, así que los lados miden ${s} y ${o}.`,
      ),
    ),
  areaSide: () =>
    [
      [12, 3, 4],
      [20, 4, 5],
      [18, 3, 6],
      [16, 2, 8],
      [30, 5, 6],
      [14, 2, 7],
    ].map(([A, s, o]) =>
      H(
        `Example: area ${A} with one side ${s}. ${A} ÷ ${s} = ${o}, so the other side is ${o}.`,
        `Ejemplo: área ${A} con un lado de ${s}. ${A} ÷ ${s} = ${o}, así que el otro lado mide ${o}.`,
      ),
    ),
  areaPerim: () =>
    [
      [12, 3, 4],
      [20, 4, 5],
      [18, 3, 6],
      [16, 2, 8],
      [30, 5, 6],
      [24, 4, 6],
    ].map(([A, p, q]) =>
      H(
        `Example: area ${A} and perimeter ${2 * (p + q)}. Half of ${2 * (p + q)} is ${p + q}. ${p} × ${q} = ${A} and ${p} + ${q} = ${p + q}, so ${p} by ${q} works.`,
        `Ejemplo: área ${A} y perímetro ${2 * (p + q)}. La mitad de ${2 * (p + q)} es ${p + q}. ${p} × ${q} = ${A} y ${p} + ${q} = ${p + q}, así que ${p} por ${q} sirve.`,
      ),
    ),
  maxArea: () =>
    [12, 10, 14, 8, 16, 18].map((P) => {
      const h = P / 2;
      const lines = Array.from(
        { length: Math.floor(h / 2) },
        (_, i) => `${i + 1} by ${h - i - 1} has area ${(i + 1) * (h - i - 1)}`,
      ).join("; ");
      const lineEs = Array.from(
        { length: Math.floor(h / 2) },
        (_, i) => `${i + 1} por ${h - i - 1} tiene área ${(i + 1) * (h - i - 1)}`,
      ).join("; ");
      return H(
        `Example: with perimeter ${P}, ${lines}. The sides closest together give the most area.`,
        `Ejemplo: con perímetro ${P}, ${lineEs}. Los lados más parecidos dan la mayor área.`,
      );
    }),
  count: () =>
    [6, 8, 9, 5, 12, 4].map((n) =>
      H(
        `Example: to place ${n} counters, tap ${n} squares. After the last tap the readout says ${n} placed.`,
        `Ejemplo: para colocar ${n} fichas, toca ${n} cuadros. Después del último toque el resumen dice ${n} puestas.`,
      ),
    ),
  pairs: () =>
    [7, 6, 9, 5, 8].map((n) =>
      H(
        `Example: ${n} counters make ${Math.floor(n / 2)} pairs with ${n % 2} left over. A number with one left over is odd, and a number with none left over is even.`,
        `Ejemplo: ${n} fichas forman ${Math.floor(n / 2)} parejas con ${n % 2} sobrante(s). Un número con un sobrante es impar y un número sin sobrantes es par.`,
      ),
    ),
  target: () =>
    [
      [2, 3],
      [3, 4],
      [2, 5],
      [4, 4],
      [3, 5],
      [2, 7],
    ].map(([p, q]) =>
      H(
        `Example: a rectangle of ${p} rows with ${q} squares in each row needs ${p * q} tiles, so its area is ${p * q} square units.`,
        `Ejemplo: un rectángulo de ${p} filas con ${q} cuadros en cada fila necesita ${p * q} baldosas, así que su área es de ${p * q} unidades cuadradas.`,
      ),
    ),
  decompose: () => [
    H(
      "Example: an L-shape can be cut along its inside corner into two rectangles. Find the area of each rectangle and add the two areas.",
      "Ejemplo: una figura en L se puede cortar por su esquina interior en dos rectángulos. Halla el área de cada rectángulo y suma las dos áreas.",
    ),
  ],
  factors: () =>
    [12, 18, 20, 16, 30, 28, 14, 24]
      .map((A) =>
        H(
          `Example: for ${A} the pairs are ${pairsText(A)}. Try each number of rows from 1 up and stop when the rows pass the columns.`,
          `Ejemplo: para ${A} los pares son ${pairsText(A)}. Prueba cada cantidad de filas desde 1 y detente cuando las filas pasen a las columnas.`,
        ),
      ),
  commute: () =>
    [
      [2, 5],
      [3, 4],
      [2, 6],
      [3, 5],
      [4, 6],
    ].map(([p, q]) =>
      H(
        `Example: ${p} × ${q} turns into ${q} × ${p}. Both arrays have the same number of squares.`,
        `Ejemplo: ${p} × ${q} se convierte en ${q} × ${p}. Las dos matrices tienen la misma cantidad de cuadros.`,
      ),
    ),
  turns: () =>
    [
      [12, [2, 6], [3, 4]],
      [16, [2, 8], [4, 4]],
      [18, [2, 9], [3, 6]],
      [20, [2, 10], [4, 5]],
    ].map(([A, a, b]) =>
      H(
        `Example: for ${A} the pairs with sides of at least 2 are ${a[0]} × ${a[1]} and ${b[0]} × ${b[1]}. Each one turned is another array, unless both sides are equal.`,
        `Ejemplo: para ${A} los pares con lados de al menos 2 son ${a[0]} × ${a[1]} y ${b[0]} × ${b[1]}. Cada uno girado es otra matriz, salvo que los dos lados sean iguales.`,
      ),
    ),
  given: () =>
    [
      [3, 10, 4],
      [2, 20, 5],
      [4, 10, 6],
      [5, 30, 2],
      [6, 20, 3],
    ].map(([a, p, q]) =>
      H(
        `Example: ${a} × ${p + q} with ${p + q} split as ${p} + ${q}. ${a} × ${p} = ${a * p} and ${a} × ${q} = ${a * q}. Then ${a * p} + ${a * q} = ${a * (p + q)}.`,
        `Ejemplo: ${a} × ${p + q} con ${p + q} dividido en ${p} + ${q}. ${a} × ${p} = ${a * p} y ${a} × ${q} = ${a * q}. Luego ${a * p} + ${a * q} = ${a * (p + q)}.`,
      ),
    ),
  place: () =>
    [
      [3, 2, 4],
      [5, 1, 6],
      [4, 3, 2],
      [2, 4, 7],
      [6, 2, 3],
    ].map(([a, t, o]) =>
      H(
        `Example: ${a} × ${t * 10 + o}. Split ${t * 10 + o} as ${t * 10} + ${o}. ${a} × ${t * 10} = ${a * t * 10}, ${a} × ${o} = ${a * o}, and the total is ${a * (t * 10 + o)}.`,
        `Ejemplo: ${a} × ${t * 10 + o}. Divide ${t * 10 + o} en ${t * 10} + ${o}. ${a} × ${t * 10} = ${a * t * 10}, ${a} × ${o} = ${a * o} y el total es ${a * (t * 10 + o)}.`,
      ),
    ),
  free: () =>
    [
      [3, 2, 4],
      [5, 1, 6],
      [4, 3, 2],
      [2, 4, 7],
    ].map(([a, t, o]) =>
      H(
        `Example: ${a} × ${t * 10 + o} can be split as ${t * 10} + ${o}. Because ${t * 10} is a multiple of ten, ${a} × ${t * 10} = ${a * t * 10} is easy, and ${a} × ${o} = ${a * o}.`,
        `Ejemplo: ${a} × ${t * 10 + o} se puede dividir en ${t * 10} + ${o}. Como ${t * 10} es múltiplo de diez, ${a} × ${t * 10} = ${a * t * 10} es fácil, y ${a} × ${o} = ${a * o}.`,
      ),
    ),
  decimal: () =>
    [
      [4, 2, 5],
      [3, 1, 2],
      [5, 3, 4],
      [2, 4, 8],
    ].map(([a, w, d]) =>
      H(
        `Example: ${a} × ${w}.${d}. ${a} × ${w} = ${a * w} and ${a} × 0.${d} = ${(a * d) / 10}. Add: ${a * w} + ${(a * d) / 10} = ${a * w + (a * d) / 10}.`,
        `Ejemplo: ${a} × ${w}.${d}. ${a} × ${w} = ${a * w} y ${a} × 0.${d} = ${(a * d) / 10}. Suma: ${a * w} + ${(a * d) / 10} = ${a * w + (a * d) / 10}.`,
      ),
    ),
  twoDigit: () =>
    [
      [12, 13],
      [14, 21],
      [11, 15],
      [13, 12],
    ].map(([a, b]) =>
      H(
        `Example: ${a} × ${b} = (10 + ${a - 10}) × (10 + ${b - 10}). The four regions are 100, ${10 * (b - 10)}, ${10 * (a - 10)} and ${(a - 10) * (b - 10)}, and they add to ${a * b}.`,
        `Ejemplo: ${a} × ${b} = (10 + ${a - 10}) × (10 + ${b - 10}). Las cuatro regiones son 100, ${10 * (b - 10)}, ${10 * (a - 10)} y ${(a - 10) * (b - 10)}, y suman ${a * b}.`,
      ),
    ),
  polyOne: () =>
    [
      [2, 5],
      [3, 4],
      [4, 1],
      [5, 2],
    ].map(([a, b]) =>
      H(
        `Example: ${a}(x + ${b}) has the regions ${a}x and ${a * b}, so it is ${a}x + ${a * b}.`,
        `Ejemplo: ${a}(x + ${b}) tiene las regiones ${a}x y ${a * b}, así que es ${a}x + ${a * b}.`,
      ),
    ),
  polyTwo: () =>
    [
      [2, 3],
      [1, 4],
      [3, 2],
      [2, 6],
    ].map(([a, b]) =>
      H(
        `Example: (x + ${a})(x + ${b}) has the regions x², ${b}x, ${a}x and ${a * b}. Combine ${b}x + ${a}x = ${a + b}x to get x² + ${a + b}x + ${a * b}.`,
        `Ejemplo: (x + ${a})(x + ${b}) tiene las regiones x², ${b}x, ${a}x y ${a * b}. Junta ${b}x + ${a}x = ${a + b}x para obtener x² + ${a + b}x + ${a * b}.`,
      ),
    ),
  prismBuild: () =>
    [
      [2, 3, 4],
      [3, 3, 2],
      [2, 5, 3],
      [4, 2, 5],
    ].map(([r, c, l]) =>
      H(
        `Example: a layer of ${r} by ${c} has ${r * c} cubes. ${l} layers make ${l} × ${r * c} = ${l * r * c} cubes.`,
        `Ejemplo: una capa de ${r} por ${c} tiene ${r * c} cubos. ${l} capas hacen ${l} × ${r * c} = ${l * r * c} cubos.`,
      ),
    ),
  prismLayers: () =>
    [
      [24, 3],
      [30, 5],
      [36, 4],
      [20, 2],
    ].map(([V, l]) =>
      H(
        `Example: ${V} cubes in ${l} layers is ${V} ÷ ${l} = ${V / l} cubes in one layer, so build a base with ${V / l} squares.`,
        `Ejemplo: ${V} cubos en ${l} capas son ${V} ÷ ${l} = ${V / l} cubos en una capa, así que construye una base con ${V / l} cuadros.`,
      ),
    ),
  prismAny: () =>
    [
      [24, 2],
      [30, 3],
      [36, 3],
      [20, 5],
    ].map(([V, l]) =>
      H(
        `Example: for ${V}, try ${l} layers. ${V} ÷ ${l} = ${V / l} cubes in a layer, and a base with ${V / l} squares can be built in more than one way.`,
        `Ejemplo: para ${V}, prueba ${l} capas. ${V} ÷ ${l} = ${V / l} cubos en una capa, y una base con ${V / l} cuadros se puede armar de más de una manera.`,
      ),
    ),
  scale: () =>
    [
      [2, 3, 2],
      [2, 3, 3],
      [3, 5, 3],
      [2, 5, 3],
      [2, 3, 5],
      [2, 2, 3],
      [3, 1, 4],
      [2, 4, 5],
    ].map(([r, c, k]) =>
      H(
        `Example: a ${r} by ${c} rectangle scaled by ${k} becomes ${r * k} by ${c * k}. The areas are ${r * c} and ${r * c * k * k}, which is ${k * k} times as large.`,
        `Ejemplo: un rectángulo de ${r} por ${c} escalado por ${k} pasa a ser de ${r * k} por ${c * k}. Las áreas son ${r * c} y ${r * c * k * k}, que es ${k * k} veces más grande.`,
      ),
    ),
  gcf: () =>
    [
      [12, 8],
      [10, 15],
      [9, 6],
      [20, 8],
      [14, 21],
      [16, 24],
    ].map(([a, b]) => {
      const fa = factorPairs(a)
        .flat()
        .sort((x, y) => x - y)
        .join(", ");
      const fb = factorPairs(b)
        .flat()
        .sort((x, y) => x - y)
        .join(", ");
      return H(
        `Example: a floor ${a} by ${b}. Sizes that fit ${a}: ${fa}. Sizes that fit ${b}: ${fb}. The largest size in both lists is ${gcd(a, b)}.`,
        `Ejemplo: un piso de ${a} por ${b}. Tamaños que caben en ${a}: ${fa}. Tamaños que caben en ${b}: ${fb}. El mayor tamaño de las dos listas es ${gcd(a, b)}.`,
      );
    }),
  lcm: () =>
    [
      [2, 3],
      [3, 4],
      [2, 5],
      [4, 6],
      [3, 5],
      [2, 7],
    ].map(([a, b]) => {
      const m = (n) => [1, 2, 3, 4].map((i) => n * i).join(", ");
      return H(
        `Example: tiles ${a} by ${b}. Multiples of ${a}: ${m(a)}. Multiples of ${b}: ${m(b)}. The first one in both lists is ${lcm(a, b)}.`,
        `Ejemplo: baldosas de ${a} por ${b}. Múltiplos de ${a}: ${m(a)}. Múltiplos de ${b}: ${m(b)}. El primero que está en las dos listas es ${lcm(a, b)}.`,
      );
    }),
  tiles: (round) =>
    round.task.target[2] > 1
      ? [
          [2, 1, 3],
          [2, 3, 1],
          [3, 2, 1],
        ].map(([lead, p, q]) =>
          H(
            `Example: ${lead}x² + ${lead * q + p}x + ${p * q} has ${lead} x²-tiles, so one side starts with ${lead}x and the other with x. The sides are (${lead}x + ${p})(x + ${q}).`,
            `Ejemplo: ${lead}x² + ${lead * q + p}x + ${p * q} tiene ${lead} fichas de x², así que un lado empieza con ${lead}x y el otro con x. Los lados son (${lead}x + ${p})(x + ${q}).`,
          ),
        )
      : [
          [2, 3],
          [1, 4],
          [2, 5],
          [3, 4],
          [1, 6],
        ].map(([p, q]) =>
          H(
            `Example: x² + ${p + q}x + ${p * q} has ${p * q} ones. ${p} × ${q} = ${p * q} and ${p} + ${q} = ${p + q}, so the sides are (x + ${p}) and (x + ${q}).`,
            `Ejemplo: x² + ${p + q}x + ${p * q} tiene ${p * q} fichas de 1. ${p} × ${q} = ${p * q} y ${p} + ${q} = ${p + q}, así que los lados son (x + ${p}) y (x + ${q}).`,
          ),
        ),
};


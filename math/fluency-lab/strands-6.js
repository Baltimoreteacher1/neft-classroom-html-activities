// Grade 6 strands the original eleven skills left out: statistics (center and spread, data displays), equivalent
// expressions, writing inequalities, ordering rational numbers, percent of a whole, surface area from nets and
// volume with fractional edges. (Multi-digit division reuses the `fact` generator.) Each generator returns a normal
// problem-bank item with its Spanish stem (`questionEs`), a hint, and steps that never state the answer before the
// last one (step-leak.js; generateProblem redraws a coincidence). Built-answer versions live in response-items.js.
import { fiveNumber } from "./response-check.js";
import { problem } from "./problem-item.js";

const randInt = (min, max, rng) => Math.floor(rng() * (max - min + 1)) + min;
const pick = (list, rng) => list[randInt(0, list.length - 1, rng)];
const shuffle = (list, rng) => {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = randInt(0, i, rng);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const num = (n) => String(Number(n.toFixed(4))).replace("-", "−");
const list = (values) => values.map(num).join(", ");
const sum = (values) => values.reduce((a, b) => a + b, 0);

// ---- statistics -------------------------------------------------------------------------------------------------
function meanData(rng, small) {
  const n = small ? 4 : randInt(4, 6, rng);
  const mean = randInt(small ? 3 : 5, small ? 9 : 20, rng);
  const devs = Array.from({ length: n - 1 }, () => randInt(-4, 4, rng));
  devs.push(-sum(devs));
  if (devs.some((d) => mean + d < 0) || new Set(devs).size < 2) return meanData(rng, small);
  return {
    values: shuffle(
      devs.map((d) => mean + d),
      rng,
    ),
    mean,
  };
}

const STAT = {
  mean(rng, small) {
    const { values, mean } = meanData(rng, small);
    const total = sum(values);
    return problem(`Find the mean of the data: ${list(values)}.`, mean, {
      questionEs: `Halla la media de los datos: ${list(values)}.`,
      hint: "Add all the values, then share the total equally among the values.",
      steps: [
        `Add the values: ${values.map(num).join(" + ")} = ${total}.`,
        `There are ${values.length} values. Divide the total by ${values.length}.`,
        `${total} ÷ ${values.length} = ${mean}`,
      ],
    });
  },
  median(rng, small) {
    const n = small ? 5 : pick([5, 7, 6, 8], rng);
    const values = Array.from({ length: n }, () => randInt(1, small ? 12 : 30, rng));
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(n / 2);
    const median = n % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    return problem(`Find the median of the data: ${list(values)}.`, num(median).replace("−", "-"), {
      questionEs: `Halla la mediana de los datos: ${list(values)}.`,
      hint: "Put the values in order first. The median is in the middle.",
      steps: [
        `In order: ${list(sorted)}`,
        n % 2
          ? `There are ${n} values, so the median is value number ${mid + 1}.`
          : `There are ${n} values, so the median is halfway between values ${mid} and ${mid + 1}.`,
        `The median is ${num(median)}.`,
      ],
    });
  },
  mad(rng, small) {
    const mean = randInt(4, 15, rng);
    const pairs = small ? 2 : pick([2, 3], rng);
    const devs = Array.from({ length: pairs }, () => randInt(1, 5, rng)).flatMap((d) => [d, -d]);
    // the average distance must be a terminating decimal (6 values: the distances sum to a multiple of 3)
    if (devs.length % 3 === 0 && sum(devs.map(Math.abs)) % 3) return STAT.mad(rng, small);
    const values = shuffle(
      devs.map((d) => mean + d),
      rng,
    );
    const distances = values.map((v) => Math.abs(v - mean));
    const mad = sum(distances) / values.length;
    return problem(
      `Find the mean absolute deviation (MAD) of the data: ${list(values)}.`,
      num(mad).replace("−", "-"),
      {
        questionEs: `Halla la desviación media absoluta (DMA) de los datos: ${list(values)}.`,
        hint: "Find the mean. Then find how far each value is from the mean, and average those distances.",
        steps: [
          `The mean is ${sum(values)} ÷ ${values.length} = ${mean}.`,
          `Distances from the mean: ${list(distances)}`,
          `Add the distances: ${sum(distances)}. Divide by ${values.length}.`,
          `MAD = ${num(mad)}`,
        ],
      },
    );
  },
  iqr(rng, small) {
    const n = small ? 7 : pick([7, 8, 9, 11], rng);
    const values = Array.from({ length: n }, () => randInt(1, 40, rng));
    const sorted = [...values].sort((a, b) => a - b);
    const [, q1, , q3] = fiveNumber(values);
    const half = Math.floor(n / 2);
    return problem(
      `Find the interquartile range (IQR) of the data: ${list(values)}.`,
      num(q3 - q1).replace("−", "-"),
      {
        questionEs: `Halla el rango intercuartil (RIC) de los datos: ${list(values)}.`,
        hint: "Order the data. Q1 is the middle of the lower half and Q3 is the middle of the upper half. IQR = Q3 − Q1.",
        steps: [
          `In order: ${list(sorted)}`,
          `Lower half: ${list(sorted.slice(0, half))}. Q1 = ${num(q1)}.`,
          `Upper half: ${list(sorted.slice(n - half))}. Q3 = ${num(q3)}.`,
          `IQR = ${num(q3)} − ${num(q1)} = ${num(q3 - q1)}`,
        ],
      },
    );
  },
};

export const STRANDS_6 = {
  centerSpread(config, rng) {
    const measures = config.scaffolded ? ["mean", "median"] : ["mean", "median", "mad", "iqr"];
    return STAT[pick(measures, rng)](rng, Boolean(config.scaffolded));
  },

  // Reading data displays: how many values fall in a histogram bin, or how many observations a frequency table holds.
  dataDisplays(config, rng) {
    if (rng() < 0.5) {
      const width = pick([5, 10], rng);
      const values = Array.from({ length: randInt(8, 12, rng) }, () =>
        randInt(0, width * 4 - 1, rng),
      ).sort((a, b) => a - b);
      const filled = [0, 1, 2, 3].filter((k) => values.some((v) => v >= k * width && v < (k + 1) * width));
      const bin = pick(filled, rng);
      const [lo, hi] = [bin * width, bin * width + width - 1];
      const count = values.filter((v) => v >= lo && v <= hi).length;
      return problem(
        `A histogram groups the data ${list(values)} in intervals of ${width}. How many values are in the interval ${lo}–${hi}?`,
        count,
        {
          questionEs: `Un histograma agrupa los datos ${list(values)} en intervalos de ${width}. ¿Cuántos valores hay en el intervalo ${lo}–${hi}?`,
          hint: "A bar of a histogram counts every value from the start of the interval to its end, including both ends.",
          steps: [
            `The interval ${lo}–${hi} starts at ${lo} and ends at ${hi}.`,
            "Go through the data and mark each value that is in the interval.",
            `${count} values are in the interval.`,
          ],
        },
      );
    }
    const labels = pick(
      [
        ["1 pet", "2 pets", "3 pets", "4 pets"],
        ["1 book", "2 books", "3 books", "4 books"],
      ],
      rng,
    );
    const counts = labels.map(() => randInt(1, 9, rng));
    const total = sum(counts);
    const pets = labels[0].includes("pet");
    const table = labels.map((label, i) => `${label}: ${counts[i]}`).join("; ");
    const tableEs = labels
      .map(
        (label, i) =>
          `${label.replace("pets", "mascotas").replace("pet", "mascota").replace("books", "libros").replace("book", "libro")}: ${counts[i]}`,
      )
      .join("; ");
    return problem(
      `A frequency table shows how many ${pets ? "pets" : "books"} students have. ${table}. How many students were asked?`,
      total,
      {
        questionEs: `Una tabla de frecuencias muestra cuántos ${pets ? "mascotas" : "libros"} tienen unos estudiantes. ${tableEs}. ¿A cuántos estudiantes se les preguntó?`,
        hint: "Each count in the table is a number of students. The number of observations is the total of the counts.",
        steps: [
          "Each row tells how many students gave that answer.",
          `Add the counts: ${counts.join(" + ")}.`,
          `${total} students were asked.`,
        ],
      },
    );
  },

  // Equivalent expressions: distribute, combine like terms, or factor out the greatest common factor.
  equivalentExpression(config, rng) {
    const form = config.scaffolded
      ? pick(["distribute", "combine"], rng)
      : pick(["distribute", "combine", "factor", "distributeCombine"], rng);
    const [a, b, c] = [randInt(2, 9, rng), randInt(1, 9, rng), randInt(2, 9, rng)];
    const work = (start, mode = "expression") => ({ mode, start, variable: "x" });
    if (form === "distribute") {
      const start = `${a}(x + ${b})`;
      return problem(
        `Use the distributive property to write ${start} without parentheses.`,
        `${a}x + ${a * b}`,
        {
          kind: "expression",
          questionEs: `Usa la propiedad distributiva para escribir ${start} sin paréntesis.`,
          hint: "Multiply the number outside the parentheses by each term inside.",
          steps: [
            `${a} multiplies x, and ${a} multiplies ${b}.`,
            `${a} × x = ${a}x`,
            `${a}x + ${a * b}`,
          ],
          work: work(start),
        },
      );
    }
    if (form === "combine") {
      const start = `${a}x + ${b} + ${c}x`;
      return problem(`Combine like terms: ${start}.`, `${a + c}x + ${b}`, {
        kind: "expression",
        questionEs: `Combina los términos semejantes: ${start}.`,
        hint: "Like terms have the same variable part. Add their coefficients.",
        steps: [
          `The x-terms are ${a}x and ${c}x. The number term is ${b}.`,
          "Add the coefficients of the x-terms.",
          `${a + c}x + ${b}`,
        ],
        work: work(start),
      });
    }
    if (form === "factor") {
      const g = pick([2, 3, 4, 5, 6], rng);
      let [p, q] = [randInt(1, 7, rng), randInt(1, 7, rng)];
      while (gcd(p, q) !== 1) q += 1;
      const start = `${g * p}x + ${g * q}`;
      return problem(
        `Factor ${start} using the greatest common factor.`,
        `${g}(${p === 1 ? "" : p}x + ${q})`,
        {
          kind: "expression",
          questionEs: `Factoriza ${start} usando el máximo común divisor.`,
          hint: "Find the greatest number that divides both terms. Write it outside the parentheses.",
          steps: [
            `Factors that ${g * p} and ${g * q} share: find the greatest one.`,
            `Divide each term by that factor to see what stays inside the parentheses.`,
            `${g}(${p === 1 ? "" : p}x + ${q})`,
          ],
          work: { ...work(start), factored: g },
        },
      );
    }
    const start = `${a}(x + ${b}) + ${c}x`;
    return problem(
      `Write ${start} as an equivalent expression with like terms combined.`,
      `${a + c}x + ${a * b}`,
      {
        kind: "expression",
        questionEs: `Escribe ${start} como una expresión equivalente con los términos semejantes combinados.`,
        hint: "Distribute first, then combine the x-terms.",
        steps: [
          `Distribute: ${a}x + ${a * b} + ${c}x.`,
          "Combine the x-terms.",
          `${a + c}x + ${a * b}`,
        ],
        work: work(start),
      },
    );
  },

  // Write an inequality from a situation (x > c, x < c, x ≥ c, x ≤ c).
  writeInequality(config, rng) {
    const contexts = [
      [
        "Riders must be at least {n} inches tall. Write an inequality for a rider's height h.",
        "Los pasajeros deben medir por lo menos {n} pulgadas. Escribe una desigualdad para la estatura h de un pasajero.",
        "h",
        ">=",
      ],
      [
        "A bag can hold at most {n} pounds. Write an inequality for the weight w the bag can hold.",
        "Una bolsa puede cargar como máximo {n} libras. Escribe una desigualdad para el peso w que puede cargar la bolsa.",
        "w",
        "<=",
      ],
      [
        "The temperature stayed above {n} degrees. Write an inequality for the temperature t.",
        "La temperatura se mantuvo por encima de {n} grados. Escribe una desigualdad para la temperatura t.",
        "t",
        ">",
      ],
      [
        "Each team has fewer than {n} players. Write an inequality for the number of players p.",
        "Cada equipo tiene menos de {n} jugadores. Escribe una desigualdad para el número de jugadores p.",
        "p",
        "<",
      ],
      [
        "You need more than {n} points to win. Write an inequality for a winning score s.",
        "Necesitas más de {n} puntos para ganar. Escribe una desigualdad para un puntaje ganador s.",
        "s",
        ">",
      ],
      [
        "A movie ticket costs no more than {n} dollars. Write an inequality for the price c.",
        "Un boleto de cine cuesta no más de {n} dólares. Escribe una desigualdad para el precio c.",
        "c",
        "<=",
      ],
    ];
    const [en, es, v, op] = pick(contexts, rng);
    const n = randInt(config.scaffolded ? 5 : 10, config.scaffolded ? 20 : 60, rng);
    const symbol = { ">=": "≥", "<=": "≤", ">": ">", "<": "<" }[op];
    const phrase = {
      ">=": "at least / no less than",
      "<=": "at most / no more than",
      ">": "more than / above",
      "<": "less than / fewer than",
    }[op];
    return problem(en.replace("{n}", n), `${v} ${symbol} ${n}`, {
      kind: "inequality",
      questionEs: es.replace("{n}", n),
      hint: "Find the boundary number. Then decide: is the boundary allowed, and are the values above it or below it?",
      steps: [`The boundary number is ${n}.`, `The words mean "${phrase}".`, `${v} ${symbol} ${n}`],
      inequality: { variable: v, op, value: n },
    });
  },

  // Order rational numbers (fractions, decimals, negatives) from least to greatest.
  orderRational(config, rng) {
    const pool = config.scaffolded
      ? [
          [-3, "−3"],
          [-1, "−1"],
          [0.5, "0.5"],
          [2, "2"],
          [-2, "−2"],
          [1.5, "1.5"],
          [3, "3"],
        ]
      : [
          [-2.5, "−2.5"],
          [-3 / 4, "−3/4"],
          [0.5, "1/2"],
          [0.75, "0.75"],
          [-1, "−1"],
          [1.25, "1 1/4"],
          [-0.2, "−0.2"],
          [-1 / 3, "−1/3"],
          [2 / 3, "2/3"],
          [-1.5, "−1 1/2"],
          [0.1, "0.1"],
          [-4, "−4"],
        ];
    const chosen = shuffle(pool, rng).slice(0, 4);
    const sorted = [...chosen].sort((x, y) => x[0] - y[0]);
    const answer = sorted.map(([, text]) => text).join(", ");
    return problem(
      `Order from least to greatest: ${chosen.map(([, text]) => text).join(", ")}.`,
      answer,
      {
        kind: "order",
        questionEs: `Ordena de menor a mayor: ${chosen.map(([, text]) => text).join(", ")}.`,
        hint: "Negative numbers are less than zero. The farther a negative number is from zero, the less it is.",
        steps: [
          "Sort the numbers into negatives and positives.",
          "For the negatives, the one farthest from zero is least.",
          "For the positives, the one closest to zero is least.",
          answer,
        ],
        order: sorted.map(([value]) => value),
      },
    );
  },

  // Percent of a whole: find the whole from a part and its percent.
  percentWhole(config, rng) {
    const percent = pick(config.scaffolded ? [10, 25, 50] : [10, 20, 25, 40, 50, 75, 5], rng);
    const g = gcd(percent, 100);
    const whole = (100 / g) * randInt(2, config.scaffolded ? 6 : 12, rng);
    const part = (whole * percent) / 100;
    return problem(`${part} is ${percent}% of what number?`, whole, {
      questionEs: `¿${part} es el ${percent}% de qué número?`,
      hint: "The part is a percent of the whole. Find the amount for one easy group of percent, then scale up to the whole.",
      steps: [
        `${percent}% of the whole is ${part}.`,
        `${percent}% = ${percent / g}/${100 / g}, so ${part} is ${percent / g} of ${100 / g} equal parts of the whole.`,
        `One part is ${part} ÷ ${percent / g} = ${part / (percent / g)}. The whole has ${100 / g} parts.`,
        `${part / (percent / g)} × ${100 / g} = ${whole}`,
      ],
    });
  },

  // Surface area from the net of a rectangular prism (three pairs of faces) or a square pyramid.
  surfaceAreaNet(config, rng) {
    if (!config.scaffolded && rng() < 0.3) {
      const s = randInt(2, 10, rng);
      // A right square pyramid's slant height runs from the midpoint of a base
      // edge to the apex, so it cannot be shorter than half the base side.
      const h = randInt(Math.max(2, Math.ceil(s / 2)), 10, rng);
      const total = s * s + 4 * ((s * h) / 2);
      return problem(
        `The net of a square pyramid has a square base with side ${s} cm and four triangles, each with base ${s} cm and height ${h} cm. What is the surface area?`,
        total,
        {
          unit: "square centimeters",
          questionEs: `La red de una pirámide cuadrada tiene una base cuadrada de ${s} cm de lado y cuatro triángulos, cada uno con base de ${s} cm y altura de ${h} cm. ¿Cuál es el área total?`,
          hint: "Find the area of every face in the net, then add them.",
          steps: [
            `Square base: ${s} × ${s} = ${s * s}.`,
            `Each triangle: ${s} × ${h} ÷ 2 = ${(s * h) / 2}. There are 4 triangles.`,
            `Add the base and the four triangles.`,
            `${total} square centimeters`,
          ],
        },
      );
    }
    const [l, w, h] = [
      randInt(2, config.scaffolded ? 6 : 12, rng),
      randInt(2, config.scaffolded ? 6 : 10, rng),
      randInt(2, config.scaffolded ? 6 : 10, rng),
    ];
    const faces = [l * w, l * h, w * h];
    const total = 2 * sum(faces);
    return problem(
      `Use the net of a rectangular prism that is ${l} in long, ${w} in wide and ${h} in tall. What is the surface area?`,
      total,
      {
        unit: "square inches",
        questionEs: `Usa la red de un prisma rectangular de ${l} pulg de largo, ${w} pulg de ancho y ${h} pulg de alto. ¿Cuál es el área total?`,
        hint: "A rectangular prism has six faces in three matching pairs. Find one face of each pair, then double.",
        steps: [
          `Top and bottom: ${l} × ${w} = ${faces[0]} each.`,
          `Front and back: ${l} × ${h} = ${faces[1]} each.`,
          `Left and right: ${w} × ${h} = ${faces[2]} each.`,
          `2 × (${faces.join(" + ")}) = ${total}`,
        ],
      },
    );
  },

  // Volume of a rectangular prism with fractional edge lengths (V = l × w × h = B × h).
  volumeFractional(config, rng) {
    const pies = (k) => (k === 2 ? "pie" : "pies");
    const halves = (k) =>
      k % 2 ? `${Math.floor(k / 2) ? `${Math.floor(k / 2)} ` : ""}1/2` : String(k / 2);
    const [a, b, c] = [
      randInt(1, config.scaffolded ? 4 : 9, rng) * 2 + 1,
      randInt(1, config.scaffolded ? 3 : 6, rng) * 2,
      randInt(1, config.scaffolded ? 4 : 7, rng),
    ];
    // lengths in halves: a/2 (odd -> mixed), b/2 (whole), c/2
    const [l, w, h] = [a / 2, b / 2, c / 2];
    const volume = l * w * h;
    const eighths = a * b * c; // volume = eighths / 8
    const g = gcd(eighths, 8);
    const improper = `${eighths / g}/${8 / g}`;
    const whole = Math.floor(volume);
    const rest = eighths - whole * 8;
    const mixed = rest
      ? `${whole ? `${whole} ` : ""}${rest / gcd(rest, 8)}/${8 / gcd(rest, 8)}`
      : String(volume);
    const answers = [...new Set([rest ? mixed : String(volume), improper, String(volume)])];
    return problem(
      `A rectangular prism is ${halves(a)} ft long, ${halves(b)} ft wide and ${halves(c)} ft tall. What is its volume?`,
      answers,
      {
        kind: "fraction",
        unit: "cubic feet",
        displayAnswer: rest ? mixed : String(volume),
        questionEs: `Un prisma rectangular mide ${halves(a)} ${pies(a)} de largo, ${halves(b)} ${pies(b)} de ancho y ${halves(c)} ${pies(c)} de alto. ¿Cuál es su volumen?`,
        hint: "Volume = length × width × height. Write each mixed number as a fraction first.",
        steps: [
          `Write each length in halves: ${a}/2, ${b}/2 and ${c}/2.`,
          `Multiply the numerators: ${a} × ${b} × ${c} = ${eighths}. Multiply the denominators: 2 × 2 × 2 = 8.`,
          `${eighths}/8 cubic feet. Simplify.`,
          `${rest ? mixed : volume} cubic feet`,
        ],
      },
    );
  },
};

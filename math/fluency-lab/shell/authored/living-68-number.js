// Living models for the number system, chance and scientific notation (Grades 6–8). Each render() computes the
// picture, the table and the equation from one state.
import { L, fmt, gcd, livingModel, svg, table, text } from "./kit-68.js";

const Q1 = "var(--q1)";
const Q2 = "var(--q2)";
const Q3 = "var(--q3)";
const sgn = (n) => (n < 0 ? `−${Math.abs(n)}` : String(n));
const paren = (n) => (n < 0 ? `(${sgn(n)})` : String(n));

// Rational numbers in quarters on a number line from −2 to 2, with their absolute values. The comparison is
// read from position, and the absolute values are shown so the reversal for negatives is visible.
const quarter = (q) => {
  const n = q / 4;
  if (Number.isInteger(n)) return sgn(n);
  const g = gcd(Math.abs(q), 4);
  const w = Math.trunc(Math.abs(q) / 4);
  const f = `${(Math.abs(q) % 4) / g}/${4 / g}`;
  return `${q < 0 ? "−" : ""}${w ? `${w} ` : ""}${f}`;
};
export const orderModel = livingModel({
  label: L("Move the two numbers", "Mueve los dos números"),
  sliders: [
    {
      id: "a",
      label: L("Point A", "Punto A"),
      min: -8,
      max: 8,
      step: 1,
      value: -4,
      show: quarter,
    },
    {
      id: "b",
      label: L("Point B", "Punto B"),
      min: -8,
      max: 8,
      step: 1,
      value: -3,
      show: quarter,
    },
  ],
  render(s, T) {
    const X = (q) => 15 + (q + 8) * 18.75;
    const ticks = [];
    for (let q = -8; q <= 8; q += 1)
      ticks.push(
        `<line x1="${X(q)}" y1="${q % 4 ? 55 : 50}" x2="${X(q)}" y2="${q % 4 ? 65 : 70}" class="lm-tick"/>${q % 4 ? "" : text(X(q), 88, quarter(q))}`,
      );
    const rel = s.a < s.b ? "<" : s.a > s.b ? ">" : "=";
    const pic = svg(
      330,
      100,
      T(
        L(
          `Number line from −2 to 2: A at ${quarter(s.a)}, B at ${quarter(s.b)}.`,
          `Recta numérica de −2 a 2: A en ${quarter(s.a)}, B en ${quarter(s.b)}.`,
        ),
      ),
      `<line x1="5" y1="60" x2="325" y2="60" class="lm-axis"/>${ticks.join("")}
       <circle cx="${X(s.a)}" cy="60" r="8" fill="${Q1}"/>${text(X(s.a), 34, "A", `fill="${Q1}"`)}
       <circle cx="${X(s.b)}" cy="60" r="8" fill="${Q2}" fill-opacity=".85"/>${text(X(s.b), 22, "B", `fill="${Q2}"`)}`,
    );
    const tab = table(
      T(L("Value and distance from 0", "Valor y distancia al 0")),
      [
        [
          "",
          T(L("Value", "Valor")),
          T(L("Decimal", "Decimal")),
          T(L("Absolute value", "Valor absoluto")),
        ],
        ["A", quarter(s.a), fmt(s.a / 4), quarter(Math.abs(s.a))],
        ["B", quarter(s.b), fmt(s.b / 4), quarter(Math.abs(s.b))],
      ],
    );
    const bothNeg = s.a < 0 && s.b < 0 && s.a !== s.b;
    const note = bothNeg
      ? T(
          L(
            " Both are negative: the one with the GREATER absolute value is the LESSER number.",
            " Los dos son negativos: el de MAYOR valor absoluto es el número MENOR.",
          ),
        )
      : "";
    return {
      svg: pic,
      table: tab,
      eq: `${quarter(s.a)} ${rel} ${quarter(s.b)}. ${T(L(rel === "=" ? "Same point." : `${rel === "<" ? "A" : "B"} is farther left, so it is less.`, rel === "=" ? "El mismo punto." : `${rel === "<" ? "A" : "B"} está más a la izquierda, así que es menor.`))}${note}`,
    };
  },
});

// Integer addition and subtraction with chips and a directed number line from one state (a, op, b).
// Subtraction removes chips; when there are not enough, zero pairs are added first — the picture shows them.
export const integerModel = livingModel({
  label: L("Change the problem", "Cambia el problema"),
  toggles: [
    {
      id: "op",
      label: L("Operation", "Operación"),
      value: "-",
      options: [
        { value: "+", label: L("Add", "Sumar") },
        { value: "-", label: L("Subtract", "Restar") },
      ],
    },
  ],
  sliders: [
    {
      id: "a",
      label: L("Start with", "Empieza con"),
      min: -6,
      max: 6,
      step: 1,
      value: 3,
      show: sgn,
    },
    {
      id: "b",
      label: L("Second number", "Segundo número"),
      min: -6,
      max: 6,
      step: 1,
      value: -4,
      show: sgn,
    },
  ],
  render(s, T) {
    const result = s.op === "+" ? s.a + s.b : s.a - s.b;
    // Chips: start with |a| chips of a's sign. Adding b puts |b| chips of b's sign. Subtracting b removes |b|
    // chips of b's sign, first adding zero pairs if there are not enough of that sign.
    const pos = [];
    const neg = [];
    const put = (n, tag) => {
      for (let i = 0; i < Math.abs(n); i += 1) (n > 0 ? pos : neg).push(tag);
    };
    put(s.a, "start");
    let zeroPairs = 0;
    if (s.op === "+") put(s.b, "added");
    else if (s.b !== 0) {
      const have = s.b > 0 ? pos.length : neg.length;
      zeroPairs = Math.max(0, Math.abs(s.b) - have);
      for (let i = 0; i < zeroPairs; i += 1) {
        pos.push("pair");
        neg.push("pair");
      }
      const from = s.b > 0 ? pos : neg;
      for (let i = 0; i < Math.abs(s.b); i += 1)
        from[from.length - 1 - i] += " gone";
    }
    const gap = Math.min(28, 300 / Math.max(pos.length, neg.length, 1));
    const cr = Math.min(12, gap / 2 - 1);
    const chip = (tag, i, row, plus) => {
      const gone = tag.includes("gone");
      const x = 15 + cr + i * gap;
      const y = row;
      return `<circle cx="${x}" cy="${y}" r="${cr}" fill="${plus ? Q1 : "var(--wrong)"}" fill-opacity="${gone ? 0.18 : 0.85}" stroke="${tag.startsWith("pair") ? Q3 : "none"}" stroke-width="2"/>${text(x, y + 5, plus ? "+" : "−", `fill="#fff"`)}${gone ? `<line x1="${x - cr}" y1="${y - cr}" x2="${x + cr}" y2="${y + cr}" stroke="var(--ink-2)" stroke-width="2"/>` : ""}`;
    };
    const X = (v) => 165 + v * 12.5;
    const mid = s.a;
    const ticks = [];
    for (let v = -12; v <= 12; v += 2)
      ticks.push(
        `<line x1="${X(v)}" y1="${v % 4 ? 126 : 122}" x2="${X(v)}" y2="${v % 4 ? 132 : 136}" class="lm-tick"/>${v % 4 ? "" : text(X(v), 154, sgn(v), 'font-size="12"')}`,
      );
    const arrow = (from, to, y, color) =>
      `<line x1="${X(from)}" y1="${y}" x2="${X(to)}" y2="${y}" stroke="${color}" stroke-width="3"/><path d="M${X(to)} ${y} l${to >= from ? -7 : 7} -5 v10 z" fill="${color}"/>`;
    const pic = svg(
      330,
      160,
      T(
        L(
          `Chips: ${pos.length} positive and ${neg.length} negative${zeroPairs ? `, including ${zeroPairs} added zero pair(s)` : ""}. Number line: start at ${sgn(s.a)}, end at ${sgn(result)}.`,
          `Fichas: ${pos.length} positivas y ${neg.length} negativas${zeroPairs ? `, incluidos ${zeroPairs} par(es) cero agregados` : ""}. Recta numérica: empieza en ${sgn(s.a)} y termina en ${sgn(result)}.`,
        ),
      ),
      `${pos.map((t, i) => chip(t, i, 20, true)).join("")}${neg.map((t, i) => chip(t, i, 52, false)).join("")}
       <line x1="5" y1="129" x2="325" y2="129" class="lm-axis"/>${ticks.join("")}
       ${s.a ? arrow(0, s.a, 92, Q1) : ""}${arrow(mid, result, 108, Q2)}`,
    );
    const rewrite = s.op === "-" ? ` = ${sgn(s.a)} + ${paren(-s.b)}` : "";
    const why =
      s.op === "-" && s.b < 0
        ? T(
            L(
              " Taking away negatives leaves more: subtracting a negative moves RIGHT.",
              " Quitar negativos deja más: restar un negativo mueve a la DERECHA.",
            ),
          )
        : zeroPairs
          ? T(
              L(
                ` ${zeroPairs} zero pair(s) were added so there were enough chips to take away; each is worth 0.`,
                ` Se agregaron ${zeroPairs} par(es) cero para tener suficientes fichas que quitar; cada uno vale 0.`,
              ),
            )
          : "";
    return {
      svg: pic,
      eq: `${sgn(s.a)} ${s.op === "+" ? "+" : "−"} ${paren(s.b)}${rewrite} = ${sgn(result)}.${why}`,
    };
  },
});

// Signed fractions on a number line: n1/d1 ± n2/d2 with the common denominator drawn as tick marks.
const DENS = [2, 3, 4, 6];
const PARTS = {
  2: { en: "halves", es: "medios" },
  3: { en: "thirds", es: "tercios" },
  4: { en: "fourths", es: "cuartos" },
  6: { en: "sixths", es: "sextos" },
  12: { en: "twelfths", es: "doceavos" },
};
const lcm = (a, b) => (a * b) / gcd(a, b);
const frac = (n, d) => {
  if (n === 0) return "0";
  const g = gcd(Math.abs(n), d);
  const [p, q] = [n / g, d / g];
  return q === 1 ? sgn(p) : `${p < 0 ? "−" : ""}${Math.abs(p)}/${q}`;
};
export const signedFractionModel = livingModel({
  label: L("Change the fractions", "Cambia las fracciones"),
  toggles: [
    {
      id: "op",
      label: L("Operation", "Operación"),
      value: "+",
      options: [
        { value: "+", label: L("Add", "Sumar") },
        { value: "-", label: L("Subtract", "Restar") },
      ],
    },
  ],
  sliders: [
    {
      id: "n1",
      label: L("First numerator", "Primer numerador"),
      min: -6,
      max: 6,
      step: 1,
      value: -3,
      show: sgn,
    },
    {
      id: "d1",
      label: L("First denominator", "Primer denominador"),
      min: 0,
      max: 3,
      step: 1,
      value: 2,
      show: (v) => String(DENS[v]),
    },
    {
      id: "n2",
      label: L("Second numerator", "Segundo numerador"),
      min: -6,
      max: 6,
      step: 1,
      value: 1,
      show: sgn,
    },
    {
      id: "d2",
      label: L("Second denominator", "Segundo denominador"),
      min: 0,
      max: 3,
      step: 1,
      value: 0,
      show: (v) => String(DENS[v]),
    },
  ],
  render(s, T) {
    const [d1, d2] = [DENS[s.d1], DENS[s.d2]];
    const D = lcm(d1, d2);
    const [m1, m2] = [(s.n1 * D) / d1, (s.n2 * D) / d2];
    const sum = s.op === "+" ? m1 + m2 : m1 - m2;
    const X = (num) => 165 + (num / D) * 50;
    const ticks = [];
    for (let k = -3 * D; k <= 3 * D; k += 1)
      ticks.push(
        `<line x1="${X(k)}" y1="${k % D ? 74 : 68}" x2="${X(k)}" y2="${k % D ? 82 : 88}" class="lm-tick" stroke-width="${k % D ? 1 : 2}"/>${k % D ? "" : text(X(k), 104, sgn(k / D))}`,
      );
    const step = s.op === "+" ? m2 : -m2;
    const arrow = (from, to, y, color) =>
      `<line x1="${X(from)}" y1="${y}" x2="${X(to)}" y2="${y}" stroke="${color}" stroke-width="4"/><path d="M${X(to)} ${y} l${to >= from ? -10 : 10} -7 v14 z" fill="${color}"/>`;
    const pic = svg(
      330,
      112,
      T(
        L(
          `Number line from −3 to 3 marked in ${PARTS[D].en}: start at ${frac(s.n1, d1)}, move ${frac(step, D)}, end at ${frac(sum, D)}.`,
          `Recta numérica de −3 a 3 marcada en ${PARTS[D].es}: empieza en ${frac(s.n1, d1)}, muévete ${frac(step, D)} y termina en ${frac(sum, D)}.`,
        ),
      ),
      `<line x1="5" y1="78" x2="325" y2="78" class="lm-axis"/>${ticks.join("")}${m1 ? arrow(0, m1, 40, Q1) + text((X(0) + X(m1)) / 2, 30, frac(s.n1, d1), `fill="${Q1}" font-size="12"`) : ""}${step ? arrow(m1, sum, 60, Q2) : ""}`,
    );
    // Stacked fractions; a negative fraction carries its sign in front, and a negative addend sits in parentheses.
    const F = (n, d) => (n < 0 ? `−[[${-n}/${d}]]` : `[[${n}/${d}]]`);
    const P = (n, d) => (n < 0 ? `(${F(n, d)})` : F(n, d));
    const op = s.op === "+" ? "+" : "−";
    const steps = [`${F(s.n1, d1)} ${op} ${P(s.n2, d2)}`];
    if (d1 !== D || d2 !== D) steps.push(`${F(m1, D)} ${op} ${P(m2, D)}`);
    steps.push(F(sum, D));
    const simple = frac(sum, D);
    const simpleMath = simple.includes("/") ? (simple.startsWith("−") ? `−[[${simple.slice(1)}]]` : `[[${simple}]]`) : simple;
    if (simpleMath !== steps.at(-1)) steps.push(simpleMath);
    return {
      svg: pic,
      eq: `${steps.join(" = ")}. ${T(L(`Both fractions are written in ${PARTS[D].en} so the pieces are the same size.`, `Las dos fracciones se escriben en ${PARTS[D].es} para que las partes tengan el mismo tamaño.`))}`,
    };
  },
});

// Random sample → population: the sample fraction is drawn as a bar and scaled to the population size.
export const samplingModel = livingModel({
  label: L("Change the survey", "Cambia la encuesta"),
  sliders: [
    {
      id: "n",
      label: L("Sample size", "Tamaño de la muestra"),
      min: 10,
      max: 50,
      step: 10,
      value: 20,
    },
    {
      id: "k",
      label: L("Said yes in the sample", "Dijeron que sí en la muestra"),
      min: 0,
      max: 50,
      step: 1,
      value: 6,
    },
    {
      id: "N",
      label: L("Population size", "Tamaño de la población"),
      min: 100,
      max: 1000,
      step: 100,
      value: 500,
    },
  ],
  render(s, T) {
    s.k = Math.min(s.k, s.n);
    const k = s.k;
    const pred = (k * s.N) / s.n;
    const bar = (y, total, part, label, color) =>
      `<rect x="10" y="${y}" width="200" height="28" fill="none" stroke="var(--ink-2)" stroke-width="1.5"/><rect x="10" y="${y}" width="${(200 * part) / total}" height="28" fill="${color}" fill-opacity=".45"/>${text(220, y + 20, `${fmt(part)} of ${total}`, `text-anchor="start" fill="${color}"`)}${text(10, y - 8, label, 'text-anchor="start" font-size="12" fill="var(--ink-2)"')}`;
    const pic = svg(
      330,
      118,
      T(
        L(
          `Sample: ${k} of ${s.n}. Population: about ${fmt(pred)} of ${s.N}, the same fraction.`,
          `Muestra: ${k} de ${s.n}. Población: unos ${fmt(pred)} de ${s.N}, la misma fracción.`,
        ),
      ),
      `${bar(26, s.n, k, T(L("Sample", "Muestra")), Q1)}${bar(84, s.N, pred, T(L("Population (prediction)", "Población (predicción)")), Q2)}`,
    );
    const tab = table(T(L("Same fraction", "La misma fracción")), [
      ["", T(L("Yes", "Sí")), T(L("Total", "Total"))],
      [T(L("Sample", "Muestra")), String(k), String(s.n)],
      [T(L("Population", "Población")), fmt(pred), String(s.N)],
    ]);
    return {
      svg: pic,
      table: tab,
      eq: `[[${k}/${s.n}]] = [[?/${s.N}]], so ? = [[${k}/${s.n}]] × ${s.N} = ${fmt(pred)}`,
    };
  },
});

// Scientific notation product: coefficients multiply, exponents add, then the result is normalized.
const SUPS = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const sup = (n) =>
  `${n < 0 ? "⁻" : ""}${String(Math.abs(n)).replace(/\d/g, (d) => SUPS[d])}`;
export const scientificModel = livingModel({
  label: L("Change the numbers", "Cambia los números"),
  sliders: [
    {
      id: "c1",
      label: L("First coefficient", "Primer coeficiente"),
      min: 1,
      max: 9,
      step: 1,
      value: 4,
    },
    {
      id: "e1",
      label: L("First exponent", "Primer exponente"),
      min: 1,
      max: 9,
      step: 1,
      value: 5,
    },
    {
      id: "c2",
      label: L("Second coefficient", "Segundo coeficiente"),
      min: 1,
      max: 9,
      step: 1,
      value: 5,
    },
    {
      id: "e2",
      label: L("Second exponent", "Segundo exponente"),
      min: 1,
      max: 9,
      step: 1,
      value: 3,
    },
  ],
  render(s, T) {
    const c = s.c1 * s.c2;
    const e = s.e1 + s.e2;
    const norm = c >= 10;
    const nc = norm ? c / 10 : c;
    const ne = norm ? e + 1 : e;
    // One block per factor of ten, grouped by where it came from: the first power, the second power, and (when
    // the coefficient reaches 10) the one moved over from the coefficient.
    const bw = Math.min(24, 300 / ne);
    const groups = [
      { n: s.e1, color: Q1, label: `10${sup(s.e1)}` },
      { n: s.e2, color: Q2, label: `10${sup(s.e2)}` },
      ...(norm ? [{ n: 1, color: Q3, label: "+1" }] : []),
    ];
    const blocks = [];
    let i = 0;
    for (const g of groups) {
      const x0 = 15 + i * bw;
      for (let k = 0; k < g.n; k += 1, i += 1)
        blocks.push(`<rect x="${(15 + i * bw).toFixed(1)}" y="34" width="${(bw - 3).toFixed(1)}" height="30" rx="3" fill="${g.color}" fill-opacity=".8"/>`);
      blocks.push(`<path d="M${x0} 70 v6 h${g.n * bw - 3} v-6" fill="none" stroke="${g.color}" stroke-width="2"/>${text(x0 + (g.n * bw - 3) / 2, 96, g.label, `fill="${g.color}" font-size="12"`)}`);
    }
    const pic = svg(
      330,
      104,
      T(
        L(
          `${s.e1} factors of ten from the first number, ${s.e2} from the second${norm ? ", and 1 more from normalizing" : ""}: ${ne} in all.`,
          `${s.e1} factores de diez del primer número, ${s.e2} del segundo${norm ? " y 1 más al normalizar" : ""}: ${ne} en total.`,
        ),
      ),
      `${text(15, 22, T(L(`${ne} factors of 10`, `${ne} factores de 10`)), 'text-anchor="start" font-size="12" fill="var(--ink-2)"')}${blocks.join("")}`,
    );
    return {
      svg: pic,
      eq: `(${s.c1} × 10${sup(s.e1)}) × (${s.c2} × 10${sup(s.e2)}) = ${c} × 10${sup(e)}${norm ? ` = ${fmt(nc)} × 10${sup(ne)}` : ""}. ${T(
        norm
          ? L(
              `${c} is not less than 10, so one factor of 10 moves into the power.`,
              `${c} no es menor que 10, así que un factor de 10 pasa a la potencia.`,
            )
          : L(
              `Exponents add: ${s.e1} + ${s.e2} = ${e}.`,
              `Los exponentes se suman: ${s.e1} + ${s.e2} = ${e}.`,
            ),
      )}`,
    };
  },
});

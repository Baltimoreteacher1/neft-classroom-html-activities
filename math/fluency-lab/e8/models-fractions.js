// Fractions, decimals and percents: fraction bar, fraction circle, fraction wall, fraction addition and
// subtraction on common-denominator bars, decimal grid, decimal product grid, and percent bar.
import { Rational, R } from "./rational.js";
import {
  ModelError,
  bi,
  circle,
  clamp,
  esc,
  intIn,
  line,
  rect,
  registerModel,
  svg,
  text,
} from "./engine-core.js";

const INK = "#17324d";
const TEAL = "#1fa6a2";
const AMBER = "#f2c15b";
const BLUE = "#5b7fc7";

const lcm = (a, b) => (a / gcdInt(a, b)) * b;
const gcdInt = (a, b) => (b ? gcdInt(b, a % b) : Math.abs(a));
const fr = (n, d) => new Rational(n, d);

// ---------------------------------------------------------------- fraction bar and circle (equivalent fractions)
const fractionReduce = (s, a) => {
  switch (a.type) {
    case "setDen":
      return {
        ...s,
        d: intIn(a.value, 1, 24, bi("The denominator", "El denominador")),
        n: Math.min(s.n, a.value),
        n0: Math.min(s.n, a.value),
        d0: a.value,
      };
    case "setNum":
      return {
        ...s,
        n: intIn(a.value, 0, s.d, bi("The numerator", "El numerador")),
        n0: a.value,
        d0: s.d,
      };
    case "toggle": {
      const i = intIn(a.index, 0, s.d - 1, bi("That part", "Esa parte"));
      const n = i < s.n ? i : i + 1;
      return { ...s, n, n0: n, d0: s.d };
    }
    case "refine": {
      const k = intIn(a.by, 2, 12, bi("The multiplier", "El multiplicador"));
      if (s.d * k > 48)
        throw new ModelError(
          bi(
            "That makes too many tiny parts to see. Try a smaller number.",
            "Eso hace demasiadas partes diminutas. Prueba con un número menor.",
          ),
        );
      return { ...s, n: s.n * k, d: s.d * k };
    }
    case "simplify": {
      const g = gcdInt(s.n, s.d);
      const k = a.by ?? g;
      if (k < 2 || s.n % k !== 0 || s.d % k !== 0)
        throw new ModelError(
          bi(
            `${s.n}/${s.d} cannot be grouped by ${k}. Both numbers must divide evenly.`,
            `${s.n}/${s.d} no se puede agrupar de ${k} en ${k}. Ambos números deben dividirse exactamente.`,
          ),
        );
      return { ...s, n: s.n / k, d: s.d / k };
    }
    default:
      throw new ModelError("Unknown move");
  }
};
const fractionDerive = (s) => {
  const v = fr(s.n, s.d);
  const same = !(s.n === s.n0 && s.d === s.d0);
  const base = fr(s.n0, s.d0);
  return {
    facts: { value: v, n: s.n, d: s.d, equivalentToStart: base.eq(v) },
    equation: same ? `${s.n0}/${s.d0} = ${s.n}/${s.d}` : `${s.n}/${s.d}`,
    verbal: bi(
      `${s.n} of ${s.d} equal parts are shaded. That is ${v.toString() === `${s.n}/${s.d}` ? "" : `${v} in simplest form, `}${v.toDecimal(3).replace(/\.?0+$/, "")} as a decimal and ${v.mul(100).toDecimal(1).replace(/\.0$/, "")}%.`,
      `${s.n} de ${s.d} partes iguales están sombreadas. Eso es ${v.toString() === `${s.n}/${s.d}` ? "" : `${v} en su forma más simple, `}${v.toDecimal(3).replace(/\.?0+$/, "")} como decimal y ${v.mul(100).toDecimal(1).replace(/\.0$/, "")}%.`,
    ),
    numeric: {
      headers: ["fraction", "decimal", "percent"],
      rows: [[`${s.n}/${s.d}`, v.toDecimal(3), `${v.mul(100).toDecimal(1)}%`]],
    },
  };
};
const fractionVerify = (self, s, p) => {
  const problems = [];
  const drawn = (self.render(s, p).match(/class="cell on"/g) || []).length;
  const all = (self.render(s, p).match(/class="cell (on|off)"/g) || []).length;
  if (drawn !== s.n) problems.push(`shaded ${drawn}, numerator ${s.n}`);
  if (all !== s.d) problems.push(`drew ${all} parts, denominator ${s.d}`);
  if (!fr(s.n, s.d).eq(fr(s.n0, s.d0)) && (s.n !== s.n0 || s.d !== s.d0) && !(s.n0 === undefined))
    // A manual setNum/setDen resets the start fraction, so equivalence only has to hold after refine/simplify.
    problems.push("fraction is no longer equivalent to the one you started with");
  return problems;
};
const fractionControls = (s) => [
  {
    id: "n+",
    label: bi("Shade one more part", "Sombrear una parte más"),
    action: { type: "setNum", value: s.n + 1 },
    disabled: s.n >= s.d,
  },
  {
    id: "n-",
    label: bi("Shade one less part", "Sombrear una parte menos"),
    action: { type: "setNum", value: s.n - 1 },
    disabled: s.n <= 0,
  },
  {
    id: "d+",
    label: bi("Cut into more parts", "Cortar en más partes"),
    action: { type: "setDen", value: s.d + 1 },
    disabled: s.d >= 24,
  },
  {
    id: "d-",
    label: bi("Cut into fewer parts", "Cortar en menos partes"),
    action: { type: "setDen", value: s.d - 1 },
    disabled: s.d <= 1,
  },
  {
    id: "x2",
    label: bi("Cut every part in 2 (× 2)", "Cortar cada parte en 2 (× 2)"),
    action: { type: "refine", by: 2 },
    disabled: s.d * 2 > 48,
  },
  {
    id: "x3",
    label: bi("Cut every part in 3 (× 3)", "Cortar cada parte en 3 (× 3)"),
    action: { type: "refine", by: 3 },
    disabled: s.d * 3 > 48,
  },
  {
    id: "simp",
    label: bi("Group parts (simplify)", "Agrupar partes (simplificar)"),
    action: { type: "simplify" },
    disabled: gcdInt(s.n, s.d) < 2,
  },
];
const fractionInit = (p) => ({ n: p.n, d: p.d, n0: p.n, d0: p.d });
const fractionGen = (rng, g) => {
  const d = g <= 3 ? rng.pick([2, 3, 4, 6, 8]) : rng.pick([3, 4, 5, 6, 8, 10, 12]);
  return { d, n: rng.int(1, d - 1) };
};

registerModel({
  id: "fractionBar",
  title: bi("Fraction bar", "Barra de fracciones"),
  grades: [3, 4, 5, 6],
  domain: "fractions",
  init: fractionInit,
  reduce: (s, a) => fractionReduce(s, a),
  derive: fractionDerive,
  render(s) {
    const W = 400;
    const w = W / s.d;
    let inner = "";
    for (let i = 0; i < s.d; i += 1)
      inner += rect(
        10 + i * w,
        10,
        w,
        56,
        `class="cell ${i < s.n ? "on" : "off"}" data-i="${i}" fill="${i < s.n ? TEAL : "#fff"}" stroke="${INK}" stroke-width="2"`,
      );
    inner += text(
      210,
      100,
      `${s.n}/${s.d}`,
      `text-anchor="middle" font-size="26" font-weight="800" fill="${INK}"`,
    );
    return svg(420, 116, inner, `Fraction bar: ${s.n} of ${s.d} parts shaded`);
  },
  pointer: (s, p, hit) => (hit.dataset.i !== undefined ? { type: "toggle", index: Number(hit.dataset.i) } : null),
  keys: (s) => ({ ArrowUp: { type: "setNum", value: s.n + 1 }, ArrowRight: { type: "setNum", value: s.n + 1 }, ArrowDown: { type: "setNum", value: s.n - 1 }, ArrowLeft: { type: "setNum", value: s.n - 1 } }),
  controls: fractionControls,
  describe: (s) =>
    bi(
      `A bar cut into ${s.d} equal parts with ${s.n} shaded.`,
      `Una barra cortada en ${s.d} partes iguales con ${s.n} sombreadas.`,
    ),
  verify(s, p) {
    return fractionVerify(this, s, p);
  },
  generate: fractionGen,
});

registerModel({
  id: "fractionCircle",
  title: bi("Fraction circle", "Círculo de fracciones"),
  grades: [3, 4, 5],
  domain: "fractions",
  init: fractionInit,
  reduce: (s, a) => fractionReduce(s, a),
  derive: fractionDerive,
  render(s) {
    const cx = 90;
    const cy = 90;
    const r = 76;
    let inner = "";
    for (let i = 0; i < s.d; i += 1) {
      const a0 = (i / s.d) * Math.PI * 2 - Math.PI / 2;
      const a1 = ((i + 1) / s.d) * Math.PI * 2 - Math.PI / 2;
      const large = a1 - a0 > Math.PI ? 1 : 0;
      const path =
        s.d === 1
          ? `M${cx} ${cy - r}A${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r}Z`
          : `M${cx} ${cy}L${(cx + r * Math.cos(a0)).toFixed(2)} ${(cy + r * Math.sin(a0)).toFixed(2)}A${r} ${r} 0 ${large} 1 ${(cx + r * Math.cos(a1)).toFixed(2)} ${(cy + r * Math.sin(a1)).toFixed(2)}Z`;
      inner += `<path class="cell ${i < s.n ? "on" : "off"}" data-i="${i}" d="${path}" fill="${i < s.n ? AMBER : "#fff"}" stroke="${INK}" stroke-width="2"/>`;
    }
    inner += text(190, 98, `${s.n}/${s.d}`, `font-size="30" font-weight="800" fill="${INK}"`);
    return svg(300, 180, inner, `Fraction circle: ${s.n} of ${s.d} parts shaded`);
  },
  pointer: (s, p, hit) => (hit.dataset.i !== undefined ? { type: "toggle", index: Number(hit.dataset.i) } : null),
  keys: (s) => ({ ArrowUp: { type: "setNum", value: s.n + 1 }, ArrowRight: { type: "setNum", value: s.n + 1 }, ArrowDown: { type: "setNum", value: s.n - 1 }, ArrowLeft: { type: "setNum", value: s.n - 1 } }),
  controls: fractionControls,
  describe: (s) =>
    bi(
      `A circle cut into ${s.d} equal slices with ${s.n} shaded.`,
      `Un círculo cortado en ${s.d} porciones iguales con ${s.n} sombreadas.`,
    ),
  verify(s, p) {
    return fractionVerify(this, s, p);
  },
  generate: fractionGen,
});

// ---------------------------------------------------------------- fraction wall (equivalence across rows)
const WALL_ROWS = [1, 2, 3, 4, 5, 6, 8, 10, 12];
registerModel({
  id: "fractionWall",
  title: bi("Fraction wall", "Muro de fracciones"),
  grades: [3, 4, 5],
  domain: "fractions",
  init: (p) => ({ n: p.n, d: p.d }),
  reduce(s, a) {
    if (a.type === "pick") {
      const d = intIn(a.d, 1, 12, bi("The denominator", "El denominador"));
      if (!WALL_ROWS.includes(d))
        throw new ModelError(bi("That row is not on the wall.", "Esa fila no está en el muro."));
      return { d, n: intIn(a.n, 0, d, bi("The numerator", "El numerador")) };
    }
    throw new ModelError("Unknown move");
  },
  derive(s) {
    const v = fr(s.n, s.d);
    const equivalents = WALL_ROWS.filter((r) => (s.n * r) % s.d === 0).map((r) => ({
      n: (s.n * r) / s.d,
      d: r,
    }));
    return {
      facts: { value: v, equivalents },
      equation: equivalents.map((e) => `${e.n}/${e.d}`).join(" = "),
      verbal: bi(
        `${equivalents.length} rows of the wall show the same length as ${s.n}/${s.d}.`,
        `${equivalents.length} filas del muro muestran la misma longitud que ${s.n}/${s.d}.`,
      ),
      numeric: {
        headers: ["fraction", "same length"],
        rows: equivalents.map((e) => [`${e.n}/${e.d}`, "yes"]),
      },
    };
  },
  render(s) {
    const W = 420;
    let inner = "";
    WALL_ROWS.forEach((r, row) => {
      const w = W / r;
      const lit = (s.n * r) % s.d === 0 ? (s.n * r) / s.d : -1;
      for (let i = 0; i < r; i += 1) {
        const on = lit >= 0 && i < lit;
        inner += rect(
          10 + i * w,
          8 + row * 26,
          w,
          24,
          `class="seg ${on ? "on" : "off"}" data-row="${r}" fill="${on ? TEAL : "#fff"}" stroke="${INK}" stroke-width="1.5"`,
        );
      }
      inner += text(W + 16, 25 + row * 26, `1/${r}`, `font-size="11" fill="${INK}"`);
    });
    return svg(470, 16 + WALL_ROWS.length * 26, inner, `Fraction wall highlighting ${s.n}/${s.d}`);
  },
  controls: (s) =>
    WALL_ROWS.slice(1).map((d) => ({
      id: `pick-${d}`,
      label: bi(`Show 1/${d}`, `Mostrar 1/${d}`),
      action: { type: "pick", n: 1, d },
    })),
  describe: (s) =>
    bi(
      `A fraction wall with ${s.n}/${s.d} highlighted in every row where it fits.`,
      `Un muro de fracciones con ${s.n}/${s.d} resaltado en cada fila donde cabe.`,
    ),
  verify(s) {
    const problems = [];
    const html = this.render(s);
    const v = fr(s.n, s.d);
    for (const r of WALL_ROWS) {
      const on = (html.match(new RegExp(`class="seg on" data-row="${r}"`, "g")) || []).length;
      if (on && !fr(on, r).eq(v))
        problems.push(`row 1/${r} highlights ${on}/${r}, which is not ${v}`);
    }
    return problems;
  },
  generate: (rng) => ({ n: 1, d: rng.pick([2, 3, 4, 5]) }),
});

// ---------------------------------------------------------------- fraction addition / subtraction
registerModel({
  id: "fractionOps",
  title: bi("Add and subtract fractions", "Sumar y restar fracciones"),
  grades: [4, 5, 6, 7],
  domain: "fractions",
  init: (p) => ({ den: 0 }),
  reduce(s, a, p) {
    if (a.type === "commonDen") {
      const den = intIn(a.value, 1, 120, bi("The common denominator", "El denominador común"));
      if (den % p.a[1] !== 0 || den % p.b[1] !== 0)
        throw new ModelError(
          bi(
            `${den} is not a multiple of both ${p.a[1]} and ${p.b[1]}, so the parts would not match.`,
            `${den} no es múltiplo de ${p.a[1]} y de ${p.b[1]}, así que las partes no coincidirían.`,
          ),
        );
      return { den };
    }
    if (a.type === "clear") return { den: 0 };
    throw new ModelError("Unknown move");
  },
  derive(s, p) {
    const A = fr(p.a[0], p.a[1]);
    const B = fr(p.b[0], p.b[1]);
    const result = p.op === "-" ? A.sub(B) : A.add(B);
    const sign = p.op === "-" ? "−" : "+";
    const head = `${p.a[0]}/${p.a[1]} ${sign} ${p.b[0]}/${p.b[1]}`;
    if (!s.den)
      return {
        facts: { result, converted: false },
        equation: head,
        verbal: bi(
          "Choose a common denominator so both fractions are cut into the same size parts.",
          "Elige un denominador común para que ambas fracciones tengan partes del mismo tamaño.",
        ),
        numeric: null,
      };
    const na = (p.a[0] * s.den) / p.a[1];
    const nb = (p.b[0] * s.den) / p.b[1];
    const nr = p.op === "-" ? na - nb : na + nb;
    const lcd = lcm(p.a[1], p.b[1]);
    return {
      facts: { result, converted: true, den: s.den, minimal: s.den === lcd },
      equation: `${head} = ${na}/${s.den} ${sign} ${nb}/${s.den} = ${nr}/${s.den}${result.toString() !== `${nr}/${s.den}` ? ` = ${result}` : ""}`,
      verbal: bi(
        `With ${s.den}ths, ${na} ${p.op === "-" ? "take away" : "plus"} ${nb} is ${nr}, so the answer is ${result}.`,
        `Con ${s.den}avos, ${na} ${p.op === "-" ? "menos" : "más"} ${nb} es ${nr}, así que la respuesta es ${result}.`,
      ),
      numeric: {
        headers: ["fraction", `in ${s.den}ths`],
        rows: [
          [`${p.a[0]}/${p.a[1]}`, `${na}/${s.den}`],
          [`${p.b[0]}/${p.b[1]}`, `${nb}/${s.den}`],
          ["answer", `${nr}/${s.den}`],
        ],
      },
    };
  },
  render(s, p) {
    const den = s.den || lcm(p.a[1], p.b[1]);
    const W = 360;
    const bar = (n, d, y, fill, label) => {
      let inner = "";
      const parts = s.den ? den : d;
      const filled = s.den ? (n * den) / d : n;
      const w = W / parts;
      for (let i = 0; i < parts; i += 1)
        inner += rect(
          10 + i * w,
          y,
          w,
          34,
          `class="cell ${i < filled ? "on" : "off"}" data-bar="${label}" fill="${i < filled ? fill : "#fff"}" stroke="${INK}" stroke-width="1.6"`,
        );
      return inner + text(386, y + 22, label, `font-size="13" font-weight="800" fill="${INK}"`);
    };
    const A = fr(p.a[0], p.a[1]);
    const B = fr(p.b[0], p.b[1]);
    const result = p.op === "-" ? A.sub(B) : A.add(B);
    let inner = bar(p.a[0], p.a[1], 8, TEAL, "A") + bar(p.b[0], p.b[1], 52, AMBER, "B");
    if (s.den) {
      const total = Number(result.mul(den).floor());
      const w = W / den;
      // One row per whole: a sum above 1 continues on a second row so every shaded part can be counted.
      const rows = Math.max(1, Math.ceil(total / den));
      for (let r = 0; r < rows; r += 1)
        for (let i = 0; i < den; i += 1) {
          const on = r * den + i < total;
          inner += rect(
            10 + i * w,
            100 + r * 40,
            w,
            34,
            `class="cell ${on ? "on" : "off"}" data-bar="R" fill="${on ? BLUE : "#fff"}" stroke="${INK}" stroke-width="1.6"`,
          );
        }
      inner += text(
        386,
        122,
        "A" + (p.op === "-" ? "−" : "+") + "B",
        `font-size="12" font-weight="800" fill="${INK}"`,
      );
    }
    return svg(
      430,
      s.den ? 150 + (Math.max(1, Math.ceil(Number(result.mul(den).floor()) / den)) - 1) * 40 : 100,
      inner,
      `Fraction bars for ${p.a[0]}/${p.a[1]} ${p.op} ${p.b[0]}/${p.b[1]}`,
    );
  },
  controls: (s, p) => {
    const lcd = lcm(p.a[1], p.b[1]);
    return [
      {
        id: "lcd",
        label: bi(`Use ${lcd}ths`, `Usar ${lcd}avos`),
        action: { type: "commonDen", value: lcd },
      },
      {
        id: "twice",
        label: bi(`Use ${lcd * 2}ths`, `Usar ${lcd * 2}avos`),
        action: { type: "commonDen", value: lcd * 2 },
      },
      {
        id: "prod",
        label: bi(`Try ${p.a[1] + p.b[1]}ths`, `Probar ${p.a[1] + p.b[1]}avos`),
        action: { type: "commonDen", value: p.a[1] + p.b[1] },
      },
      {
        id: "clear",
        label: bi("Start over", "Empezar de nuevo"),
        action: { type: "clear" },
        disabled: !s.den,
      },
    ];
  },
  describe: (s, p) =>
    bi(
      `Bars for ${p.a[0]}/${p.a[1]} and ${p.b[0]}/${p.b[1]}${s.den ? `, both cut into ${s.den}ths` : ""}.`,
      `Barras para ${p.a[0]}/${p.a[1]} y ${p.b[0]}/${p.b[1]}${s.den ? `, ambas cortadas en ${s.den}avos` : ""}.`,
    ),
  verify(s, p) {
    const A = fr(p.a[0], p.a[1]);
    const B = fr(p.b[0], p.b[1]);
    const result = p.op === "-" ? A.sub(B) : A.add(B);
    const problems = [];
    if (s.den) {
      const html = this.render(s, p);
      const on = (label) =>
        (html.match(new RegExp(`class="cell on" data-bar="${label}"`, "g")) || []).length;
      if (!fr(on("A"), s.den).eq(A)) problems.push("bar A does not show its fraction");
      if (!fr(on("B"), s.den).eq(B)) problems.push("bar B does not show its fraction");
      if (!fr(on("R"), s.den).eq(result)) problems.push("answer bar does not show the answer");
    }
    return problems;
  },
  generate(rng, g) {
    const pairs =
      g <= 4
        ? [
            [2, 4],
            [3, 6],
            [4, 8],
            [5, 10],
          ]
        : [
            [2, 3],
            [3, 4],
            [4, 6],
            [3, 5],
            [6, 8],
            [4, 5],
          ];
    const [d1, d2] = rng.pick(pairs);
    const a = [rng.int(1, d1 - 1), d1];
    const b = [rng.int(1, d2 - 1), d2];
    const op = rng.pick(["+", "-"]);
    if (op === "-" && fr(a[0], a[1]).lt(fr(b[0], b[1]))) return { a: b, b: a, op };
    return { a, b, op };
  },
});

// ---------------------------------------------------------------- decimal grid (tenths and hundredths, sums)
registerModel({
  id: "decimalGrid",
  title: bi("Decimal grid", "Cuadrícula decimal"),
  grades: [4, 5, 6],
  domain: "fractions",
  init: (p) => ({ k1: p.k1 ?? 0, k2: p.k2 ?? 0 }),
  reduce(s, a, p) {
    if (a.type === "set1")
      return {
        ...s,
        k1: intIn(a.value, 0, 100 - s.k2, bi("The first amount", "La primera cantidad")),
      };
    if (a.type === "set2") {
      if (!p.two)
        throw new ModelError(
          bi("This grid shows one decimal.", "Esta cuadrícula muestra un solo decimal."),
        );
      return {
        ...s,
        k2: intIn(a.value, 0, 100 - s.k1, bi("The second amount", "La segunda cantidad")),
      };
    }
    throw new ModelError("Unknown move");
  },
  derive(s, p) {
    const total = s.k1 + s.k2;
    const dec = (k) => fr(k, 100).toDecimal(2);
    return {
      facts: { k1: s.k1, k2: s.k2, total, value: fr(total, 100) },
      equation: p.two
        ? `${dec(s.k1)} + ${dec(s.k2)} = ${dec(total)}`
        : `${total}/100 = ${dec(total)} = ${total}%`,
      verbal: bi(
        p.two
          ? `${s.k1} squares and ${s.k2} squares together cover ${total} of the 100 squares, which is ${dec(total)}.`
          : `${total} of the 100 squares are shaded: ${dec(total)}.`,
        p.two
          ? `${s.k1} cuadros y ${s.k2} cuadros cubren ${total} de los 100 cuadros, es decir ${dec(total)}.`
          : `${total} de los 100 cuadros están sombreados: ${dec(total)}.`,
      ),
      numeric: {
        headers: ["fraction", "decimal", "percent"],
        rows: [[`${total}/100`, dec(total), `${total}%`]],
      },
    };
  },
  render(s) {
    let inner = "";
    for (let i = 0; i < 100; i += 1) {
      const row = Math.floor(i / 10);
      const col = i % 10;
      // Fill by columns of ten, left to right, so tenths read as whole columns.
      const index = col * 10 + row;
      const kind = index < s.k1 ? "a" : index < s.k1 + s.k2 ? "b" : "off";
      inner += rect(
        8 + col * 20,
        8 + row * 20,
        19,
        19,
        `class="cell ${kind === "off" ? "off" : "on"}" data-kind="${kind}" fill="${kind === "a" ? TEAL : kind === "b" ? AMBER : "#fff"}" stroke="${INK}" stroke-width="1"`,
      );
    }
    return svg(216, 216, inner, `Decimal grid with ${s.k1 + s.k2} of 100 squares shaded`);
  },
  controls: (s, p) => [
    {
      id: "t+",
      label: bi("Shade one more tenth", "Sombrear una décima más"),
      action: { type: "set1", value: s.k1 + 10 },
      disabled: s.k1 + s.k2 + 10 > 100,
    },
    {
      id: "h+",
      label: bi("Shade one more hundredth", "Sombrear una centésima más"),
      action: { type: "set1", value: s.k1 + 1 },
      disabled: s.k1 + s.k2 + 1 > 100,
    },
    {
      id: "h-",
      label: bi("Shade one less hundredth", "Sombrear una centésima menos"),
      action: { type: "set1", value: s.k1 - 1 },
      disabled: s.k1 <= 0,
    },
    ...(p.two
      ? [
          {
            id: "2t+",
            label: bi("Second amount: one more tenth", "Segunda cantidad: una décima más"),
            action: { type: "set2", value: s.k2 + 10 },
            disabled: s.k1 + s.k2 + 10 > 100,
          },
          {
            id: "2h+",
            label: bi("Second amount: one more hundredth", "Segunda cantidad: una centésima más"),
            action: { type: "set2", value: s.k2 + 1 },
            disabled: s.k1 + s.k2 + 1 > 100,
          },
        ]
      : []),
  ],
  describe: (s) =>
    bi(
      `A 10 by 10 grid with ${s.k1 + s.k2} squares shaded, worth ${fr(s.k1 + s.k2, 100).toDecimal(2)}.`,
      `Una cuadrícula de 10 por 10 con ${s.k1 + s.k2} cuadros sombreados, que valen ${fr(s.k1 + s.k2, 100).toDecimal(2)}.`,
    ),
  verify(s) {
    const html = this.render(s);
    const a = (html.match(/data-kind="a"/g) || []).length;
    const b = (html.match(/data-kind="b"/g) || []).length;
    return a === s.k1 && b === s.k2 ? [] : [`grid shows ${a}+${b}, state has ${s.k1}+${s.k2}`];
  },
  generate: (rng, g) => ({
    two: g >= 5,
    k1: rng.int(1, 5) * 10 + (g >= 5 ? rng.int(0, 9) : 0),
    k2: g >= 5 ? rng.int(10, 40) : 0,
  }),
});

// ---------------------------------------------------------------- decimal product (area overlap)
registerModel({
  id: "decimalProduct",
  title: bi("Decimal multiplication grid", "Cuadrícula para multiplicar decimales"),
  grades: [5, 6],
  domain: "fractions",
  init: (p) => ({ r: p.r, c: p.c }),
  reduce(s, a) {
    if (a.type === "r")
      return {
        ...s,
        r: intIn(a.value, 0, 10, bi("The first factor in tenths", "El primer factor en décimas")),
      };
    if (a.type === "c")
      return {
        ...s,
        c: intIn(a.value, 0, 10, bi("The second factor in tenths", "El segundo factor en décimas")),
      };
    throw new ModelError("Unknown move");
  },
  derive(s) {
    const prod = fr(s.r * s.c, 100);
    return {
      facts: { product: prod, squares: s.r * s.c },
      equation: `${fr(s.r, 10).toDecimal(1)} × ${fr(s.c, 10).toDecimal(1)} = ${prod.toDecimal(2)}`,
      verbal: bi(
        `${s.r} tenths of a column of tenths: the overlap covers ${s.r * s.c} of 100 squares, so the product is ${prod.toDecimal(2)}.`,
        `${s.r} décimas de ${s.c} décimas: la superposición cubre ${s.r * s.c} de 100 cuadros, así que el producto es ${prod.toDecimal(2)}.`,
      ),
      numeric: {
        headers: ["tenths × tenths", "hundredths"],
        rows: [[`${s.r} × ${s.c}`, s.r * s.c]],
      },
    };
  },
  render(s) {
    let inner = "";
    for (let row = 0; row < 10; row += 1)
      for (let col = 0; col < 10; col += 1) {
        const inR = row < s.r;
        const inC = col < s.c;
        const kind = inR && inC ? "both" : inR || inC ? "one" : "off";
        inner += rect(
          8 + col * 20,
          8 + row * 20,
          19,
          19,
          `class="cell ${kind === "both" ? "on" : "off"}" data-kind="${kind}" fill="${kind === "both" ? "#e9835f" : kind === "one" ? "#cfe9e7" : "#fff"}" stroke="${INK}" stroke-width="1"`,
        );
      }
    return svg(
      216,
      216,
      inner,
      `Overlap grid: ${s.r} tenths by ${s.c} tenths covers ${s.r * s.c} of 100`,
    );
  },
  controls: (s) => [
    {
      id: "r+",
      label: bi("First factor + 0.1", "Primer factor + 0,1"),
      action: { type: "r", value: s.r + 1 },
      disabled: s.r >= 10,
    },
    {
      id: "r-",
      label: bi("First factor − 0.1", "Primer factor − 0,1"),
      action: { type: "r", value: s.r - 1 },
      disabled: s.r <= 0,
    },
    {
      id: "c+",
      label: bi("Second factor + 0.1", "Segundo factor + 0,1"),
      action: { type: "c", value: s.c + 1 },
      disabled: s.c >= 10,
    },
    {
      id: "c-",
      label: bi("Second factor − 0.1", "Segundo factor − 0,1"),
      action: { type: "c", value: s.c - 1 },
      disabled: s.c <= 0,
    },
  ],
  describe: (s) =>
    bi(
      `A 10 by 10 grid. ${s.r} tenths down and ${s.c} tenths across overlap in ${s.r * s.c} squares.`,
      `Una cuadrícula de 10 por 10. ${s.r} décimas hacia abajo y ${s.c} décimas a lo ancho se superponen en ${s.r * s.c} cuadros.`,
    ),
  verify(s) {
    const both = (this.render(s).match(/data-kind="both"/g) || []).length;
    return both === s.r * s.c ? [] : [`overlap drew ${both}, product has ${s.r * s.c}`];
  },
  generate: (rng) => ({ r: rng.int(2, 9), c: rng.int(2, 9) }),
});

// ---------------------------------------------------------------- percent bar
registerModel({
  id: "percentBar",
  title: bi("Percent bar", "Barra de porcentaje"),
  grades: [6, 7],
  domain: "ratio",
  init: (p) => ({ pct: p.pct }),
  reduce(s, a) {
    if (a.type === "set") {
      const v = Rational.of(a.value);
      if (v.lt(0) || v.gt(300))
        throw new ModelError(
          bi("Choose a percent from 0 to 300.", "Elige un porcentaje de 0 a 300."),
        );
      return { pct: v.toString() };
    }
    if (a.type === "step") {
      const next = Rational.of(s.pct).add(a.by);
      if (next.lt(0) || next.gt(300))
        throw new ModelError(
          bi("Choose a percent from 0 to 300.", "Elige un porcentaje de 0 a 300."),
        );
      return { pct: next.toString() };
    }
    throw new ModelError("Unknown move");
  },
  derive(s, p) {
    const pct = Rational.of(s.pct);
    const whole = Rational.of(p.whole);
    const part = whole.mul(pct).div(100);
    return {
      facts: { pct, whole, part },
      equation: `${pct}% of ${whole} = ${pct}/100 × ${whole} = ${part}`,
      verbal: bi(
        `${pct}% of ${whole} is ${part}. The whole ${whole} is 100%.`,
        `${pct}% de ${whole} es ${part}. El total ${whole} es 100%.`,
      ),
      numeric: {
        headers: ["percent", "amount"],
        rows: [
          [`${pct}%`, part.toString()],
          ["100%", whole.toString()],
        ],
      },
    };
  },
  render(s, p) {
    const pct = Rational.of(s.pct);
    const whole = Rational.of(p.whole);
    const part = whole.mul(pct).div(100);
    const W = 400;
    const frac = Math.min(3, pct.div(100).toNumber());
    const scale = W / Math.max(1, frac);
    let inner =
      rect(10, 20, W, 40, `fill="#fff" stroke="${INK}" stroke-width="2"`) +
      rect(10, 20, Math.min(W, (W * frac) / Math.max(1, frac)), 40, `fill="none"`);
    inner =
      rect(10, 20, W, 40, `class="whole" fill="#fff" stroke="${INK}" stroke-width="2"`) +
      rect(
        10,
        20,
        (frac / Math.max(1, frac)) * W,
        40,
        `class="part" data-pct="${pct}" fill="${TEAL}" stroke="${INK}" stroke-width="2"`,
      );
    for (let t = 0; t <= 10; t += 1)
      inner += line(
        10 + (t / 10) * (W / Math.max(1, frac)) * Math.min(1, 1),
        60,
        10 + (t / 10) * (W / Math.max(1, frac)),
        68,
        `stroke="${INK}"`,
      );
    inner +=
      text(10, 14, "0%", `font-size="12" fill="${INK}"`) +
      text(
        10 + W / Math.max(1, frac),
        14,
        "100%",
        `text-anchor="middle" font-size="12" fill="${INK}"`,
      ) +
      text(
        10 + W / 2,
        92,
        `${part}`,
        `text-anchor="middle" font-size="22" font-weight="800" fill="${INK}"`,
      );
    return svg(430, 110, inner, `Percent bar showing ${pct}% of ${whole}`);
  },
  controls: (s) => [
    { id: "p+10", label: bi("+ 10%", "+ 10%"), action: { type: "step", by: 10 } },
    { id: "p-10", label: bi("− 10%", "− 10%"), action: { type: "step", by: -10 } },
    { id: "p+1", label: bi("+ 1%", "+ 1%"), action: { type: "step", by: 1 } },
    { id: "p-1", label: bi("− 1%", "− 1%"), action: { type: "step", by: -1 } },
    { id: "p50", label: bi("Set 50%", "Poner 50%"), action: { type: "set", value: 50 } },
    { id: "p25", label: bi("Set 25%", "Poner 25%"), action: { type: "set", value: 25 } },
  ],
  describe: (s, p) =>
    bi(
      `A bar for ${p.whole}, with ${s.pct}% marked.`,
      `Una barra para ${p.whole}, con ${s.pct}% marcado.`,
    ),
  verify(s, p) {
    const m = /data-pct="([^"]+)"/.exec(this.render(s, p));
    const pct = Rational.of(s.pct);
    const part = Rational.of(p.whole).mul(pct).div(100);
    const problems = [];
    if (!m || !Rational.of(m[1]).eq(pct)) problems.push("bar does not show the chosen percent");
    // Independent route to the same amount: scale 1% then multiply.
    if (!Rational.of(p.whole).div(100).mul(pct).eq(part))
      problems.push("two routes to the part disagree");
    return problems;
  },
  generate: (rng, g) => ({
    whole: rng.pick([20, 40, 60, 80, 120, 150, 200, 250]),
    pct: rng.pick([10, 20, 25, 30, 40, 50, 75, g >= 7 ? 125 : 60]),
  }),
});

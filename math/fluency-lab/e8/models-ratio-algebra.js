// Ratios, rates, algebra and functions: tape diagram with double number line and ratio table (linked), linear graph with
// table and equation (linked), function machine, balance scale for equations, algebra tiles, integer chips.
import { Rational, R } from "./rational.js";
import {
  ModelError,
  bi,
  circle,
  clamp,
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
const CORAL = "#d8613c";
const BLUE = "#1d5fa8";
const gcdInt = (a, b) => (b ? gcdInt(b, a % b) : Math.abs(a));

// Readable algebra text for a coefficient and a variable: 3x, x, −x, (1/2)x.
const coef = (c, v = "x") => {
  const r = Rational.of(c);
  if (r.isZero()) return "";
  const body = r.abs().eq(1) ? v : r.isInteger() ? `${r.abs()}${v}` : `(${r.abs()})${v}`;
  return r.sign() < 0 ? `−${body}` : body;
};
const joinTerms = (terms) => {
  const parts = terms.filter(Boolean);
  if (!parts.length) return "0";
  return parts
    .map((t, i) => (i === 0 ? t : t.startsWith("−") ? ` − ${t.slice(1)}` : ` + ${t}`))
    .join("");
};
const konst = (c) => {
  const r = Rational.of(c);
  return r.isZero() ? "" : r.sign() < 0 ? `−${r.abs()}` : `${r}`;
};
const linearText = (a, b, v = "x") => joinTerms([coef(a, v), konst(b)]);

// ---------------------------------------------------------------- tape diagram + double number line + ratio table
registerModel({
  id: "tapeRatio",
  title: bi(
    "Tape diagram, double number line and ratio table",
    "Diagrama de cinta, doble recta numérica y tabla de razones",
  ),
  grades: [6, 7],
  variants: ["tape", "doubleLine"],
  domain: "ratio",
  init: (p) => ({ a: p.a, b: p.b, k: p.k ?? 1 }),
  reduce(s, a) {
    if (a.type === "scale")
      return { ...s, k: intIn(a.value, 1, 12, bi("The number of copies", "El número de copias")) };
    if (a.type === "setBase") {
      const na = intIn(a.a, 1, 12, bi("The first quantity", "La primera cantidad"));
      const nb = intIn(a.b, 1, 12, bi("The second quantity", "La segunda cantidad"));
      return { a: na, b: nb, k: s.k };
    }
    throw new ModelError("Unknown move");
  },
  derive(s, p) {
    const A = s.a * s.k;
    const B = s.b * s.k;
    const unit = R(s.b, s.a);
    const names = p.names || ["first", "second"];
    return {
      facts: { ratio: R(s.a, s.b), A, B, unitRate: unit, k: s.k },
      equation: `${s.a}:${s.b} = ${A}:${B}    (${s.b} ÷ ${s.a} = ${unit} ${names[1]} for each 1 ${names[0]})`,
      verbal: bi(
        `${s.k === 1 ? `The ratio is ${s.a} ${names[0]} to ${s.b} ${names[1]}.` : `${s.k} copies of ${s.a} ${names[0]} to ${s.b} ${names[1]} make ${A} to ${B}. The ratio stays ${s.a}:${s.b}.`} Unit rate: ${unit} ${names[1]} for each 1 of ${names[0]}.`,
        `${s.k === 1 ? `La razón es ${s.a} ${names[0]} por ${s.b} ${names[1]}.` : `${s.k} copias de ${s.a} ${names[0]} por ${s.b} ${names[1]} forman ${A} a ${B}. La razón sigue siendo ${s.a}:${s.b}.`} Tasa unitaria: ${unit} ${names[1]} por cada 1 de ${names[0]}.`,
      ),
      numeric: {
        headers: [names[0], names[1]],
        rows: Array.from({ length: s.k }, (_, i) => [s.a * (i + 1), s.b * (i + 1)]),
      },
    };
  },
  render(s, p, variant = "tape") {
    const names = p.names || ["first", "second"];
    if (variant === "doubleLine") {
      const W = 380;
      const total = s.k;
      const X = (j) => 30 + (j / total) * W;
      let inner =
        line(30, 40, 410, 40, `stroke="${INK}" stroke-width="3"`) +
        line(30, 110, 410, 110, `stroke="${INK}" stroke-width="3"`);
      for (let j = 0; j <= total; j += 1) {
        inner +=
          line(
            X(j),
            32,
            X(j),
            48,
            `class="tick" data-top="${s.a * j}" data-bottom="${s.b * j}" stroke="${INK}" stroke-width="2"`,
          ) + line(X(j), 102, X(j), 118, `stroke="${INK}" stroke-width="2"`);
        inner +=
          text(
            X(j),
            26,
            s.a * j,
            `text-anchor="middle" font-size="13" font-weight="700" fill="${INK}"`,
          ) +
          text(
            X(j),
            138,
            s.b * j,
            `text-anchor="middle" font-size="13" font-weight="700" fill="${INK}"`,
          );
        inner += line(
          X(j),
          50,
          X(j),
          100,
          `stroke="${TEAL}" stroke-width="1.5" stroke-dasharray="4 4"`,
        );
      }
      inner +=
        text(8, 44, (p.short || names.map((n) => n.split(" ")[0]))[0], `font-size="10" fill="${INK}"`) +
        text(8, 114, (p.short || names.map((n) => n.split(" ")[0]))[1], `font-size="10" fill="${INK}"`);
      return svg(
        430,
        150,
        inner,
        `Double number line: ${names[0]} ${s.a * s.k}, ${names[1]} ${s.b * s.k}`,
      );
    }
    const unit = 380 / (Math.max(s.a, s.b) * s.k);
    let inner = "";
    for (let j = 0; j < s.k; j += 1) {
      inner +=
        rect(
          20 + j * s.a * unit,
          14,
          s.a * unit,
          38,
          `class="seg" data-row="A" fill="${TEAL}" stroke="${INK}" stroke-width="2"`,
        ) +
        text(
          20 + (j + 0.5) * s.a * unit,
          39,
          s.a,
          `text-anchor="middle" font-size="14" font-weight="800" fill="#fff"`,
        );
      inner +=
        rect(
          20 + j * s.b * unit,
          62,
          s.b * unit,
          38,
          `class="seg" data-row="B" fill="${AMBER}" stroke="${INK}" stroke-width="2"`,
        ) +
        text(
          20 + (j + 0.5) * s.b * unit,
          87,
          s.b,
          `text-anchor="middle" font-size="14" font-weight="800" fill="${INK}"`,
        );
    }
    inner +=
      text(20, 118, `${names[0]}: ${s.a * s.k}`, `font-size="12" font-weight="700" fill="${INK}"`) +
      text(20, 134, `${names[1]}: ${s.b * s.k}`, `font-size="12" font-weight="700" fill="${INK}"`);
    return svg(430, 144, inner, `Tape diagram: ${s.k} copies of ${s.a} and ${s.b}`);
  },
  controls: (s) => [
    {
      id: "k+",
      label: bi("Add another copy of the ratio", "Agregar otra copia de la razón"),
      action: { type: "scale", value: s.k + 1 },
      disabled: s.k >= 12,
    },
    {
      id: "k-",
      label: bi("Take a copy away", "Quitar una copia"),
      action: { type: "scale", value: s.k - 1 },
      disabled: s.k <= 1,
    },
  ],
  describe: (s, p) =>
    bi(
      `A tape diagram with ${s.k} copies of the ratio ${s.a}:${s.b}, totals ${s.a * s.k} and ${s.b * s.k}.`,
      `Un diagrama de cinta con ${s.k} copias de la razón ${s.a}:${s.b}, totales ${s.a * s.k} y ${s.b * s.k}.`,
    ),
  verify(s, p) {
    const problems = [];
    const tape = this.render(s, p, "tape");
    const line2 = this.render(s, p, "doubleLine");
    const segA = (tape.match(/data-row="A"/g) || []).length;
    const segB = (tape.match(/data-row="B"/g) || []).length;
    if (segA !== s.k || segB !== s.k)
      problems.push(`tape has ${segA}/${segB} segments for ${s.k} copies`);
    const ticks = [...line2.matchAll(/data-top="(\d+)" data-bottom="(\d+)"/g)].map((m) => [
      Number(m[1]),
      Number(m[2]),
    ]);
    if (ticks.length !== s.k + 1) problems.push("double number line has the wrong number of ticks");
    const base = R(s.a, s.b);
    // Every pair the learner can read off any representation must be equivalent to the base ratio.
    for (const [x, y] of ticks.slice(1))
      if (!R(x, y).eq(base)) problems.push(`tick ${x}:${y} is not ${s.a}:${s.b}`);
    for (const row of this.derive(s, p).numeric.rows)
      if (!R(row[0], row[1]).eq(base))
        problems.push(`table row ${row.join(":")} is not ${s.a}:${s.b}`);
    return problems;
  },
  generate: (rng, g) => ({
    a: rng.pick([2, 3, 4, 5]),
    b: rng.pick([3, 5, 6, 7]),
    k: 1,
    ...rng.pick([
      { names: ["cups of flour", "cups of sugar"], short: ["flour", "sugar"] },
      { names: ["red tiles", "blue tiles"], short: ["red", "blue"] },
      { names: ["miles", "minutes"], short: ["miles", "min"] },
    ]),
  }),
});

// ---------------------------------------------------------------- linear graph, table and equation
export const PLANE = { size: 440, unit: 20, origin: 220, lo: -10, hi: 10 };
export const PX = (x) => PLANE.origin + Rational.of(x).toNumber() * PLANE.unit;
export const PY = (y) => PLANE.origin - Rational.of(y).toNumber() * PLANE.unit;
export function planeGrid() {
  let inner = "";
  for (let i = PLANE.lo; i <= PLANE.hi; i += 1) {
    const major = i % 5 === 0;
    inner +=
      line(
        PX(i),
        0,
        PX(i),
        PLANE.size,
        `stroke="${major ? "#9fb6c4" : "#e1e8ee"}" stroke-width="${major ? 1.2 : 1}"`,
      ) +
      line(
        0,
        PY(i),
        PLANE.size,
        PY(i),
        `stroke="${major ? "#9fb6c4" : "#e1e8ee"}" stroke-width="${major ? 1.2 : 1}"`,
      );
  }
  inner +=
    line(PX(0), 0, PX(0), PLANE.size, `stroke="${INK}" stroke-width="2"`) +
    line(0, PY(0), PLANE.size, PY(0), `stroke="${INK}" stroke-width="2"`);
  for (const t of [-10, -5, 5, 10])
    inner +=
      text(PX(t), PY(0) + 14, t, `text-anchor="middle" font-size="11" fill="${INK}"`) +
      text(PX(0) - 5, PY(t) + 4, t, `text-anchor="end" font-size="11" fill="${INK}"`);
  return inner;
}
export const inWindow = (v) => Rational.of(v).gte(PLANE.lo) && Rational.of(v).lte(PLANE.hi);
registerModel({
  id: "linearGraph",
  title: bi("Linear graph, table and equation", "Gráfica lineal, tabla y ecuación"),
  grades: [6, 7, 8],
  domain: "algebra",
  init: (p) => ({
    m: Rational.of(p.m).toString(),
    b: Rational.of(p.b ?? 0).toString(),
    x: Rational.of(p.x ?? 1).toString(),
  }),
  reduce(s, a) {
    const m = Rational.of(s.m);
    const b = Rational.of(s.b);
    const x = Rational.of(s.x);
    const check = (nm, nb, nx) => {
      const y = nm.mul(nx).add(nb);
      if (!inWindow(nx) || !inWindow(y))
        throw new ModelError(
          bi(
            "That point would be off the graph. Try a value that keeps the point on the grid.",
            "Ese punto quedaría fuera de la gráfica. Prueba un valor que lo deje en la cuadrícula.",
          ),
        );
      return { m: nm.toString(), b: nb.toString(), x: nx.toString() };
    };
    if (a.type === "step") return check(m, b, x.add(a.by));
    if (a.type === "setX") return check(m, b, Rational.of(a.value));
    if (a.type === "setM") {
      const nm = Rational.of(a.value);
      if (nm.abs().gt(10))
        throw new ModelError(
          bi("Keep the slope between −10 and 10.", "Mantén la pendiente entre −10 y 10."),
        );
      return check(nm, b, x);
    }
    if (a.type === "setB") {
      const nb = Rational.of(a.value);
      if (nb.abs().gt(10))
        throw new ModelError(
          bi(
            "Keep the y-intercept between −10 and 10.",
            "Mantén la intersección con y entre −10 y 10.",
          ),
        );
      return check(m, nb, x);
    }
    throw new ModelError("Unknown move");
  },
  derive(s) {
    const m = Rational.of(s.m);
    const b = Rational.of(s.b);
    const x = Rational.of(s.x);
    const y = m.mul(x).add(b);
    const rows = [];
    for (let i = -3; i <= 3; i += 1) {
      const xi = x.add(i).floor();
      const xr = R(xi);
      const yi = m.mul(xr).add(b);
      if (inWindow(xr) && inWindow(yi)) rows.push([xr.toString(), yi.toString()]);
    }
    const proportional = b.isZero();
    return {
      facts: { point: [x, y], slope: m, intercept: b, proportional },
      equation: `y = ${linearText(m, b)}    →    y = ${m.isInteger() ? `${m}(${x})` : `(${m})(${x})`}${b.isZero() ? "" : b.sign() < 0 ? ` − ${b.abs()}` : ` + ${b}`} = ${y}`,
      verbal: bi(
        `When x is ${x}, y is ${y}. Each time x goes up by 1, y ${m.sign() >= 0 ? "goes up" : "goes down"} by ${m.abs()}.${proportional ? ` The line passes through (0, 0), so y is proportional to x with constant ${m}.` : ` The line crosses the y-axis at ${b}.`}`,
        `Cuando x es ${x}, y es ${y}. Cada vez que x aumenta 1, y ${m.sign() >= 0 ? "aumenta" : "disminuye"} ${m.abs()}.${proportional ? ` La recta pasa por (0, 0), así que y es proporcional a x con constante ${m}.` : ` La recta cruza el eje y en ${b}.`}`,
      ),
      numeric: { headers: ["x", "y"], rows },
    };
  },
  render(s) {
    const m = Rational.of(s.m);
    const b = Rational.of(s.b);
    const x = Rational.of(s.x);
    const y = m.mul(x).add(b);
    let inner = planeGrid();
    // The line is drawn between its exact endpoints at x = -10 and x = 10, clipped to the window.
    let x0 = R(PLANE.lo);
    let x1 = R(PLANE.hi);
    if (!m.isZero()) {
      const xAtLo = R(PLANE.lo).sub(b).div(m);
      const xAtHi = R(PLANE.hi).sub(b).div(m);
      const [xa, xb] = xAtLo.lt(xAtHi) ? [xAtLo, xAtHi] : [xAtHi, xAtLo];
      if (xa.gt(x0)) x0 = xa;
      if (xb.lt(x1)) x1 = xb;
    }
    const y0 = m.mul(x0).add(b);
    const y1 = m.mul(x1).add(b);
    inner += line(
      PX(x0),
      PY(y0),
      PX(x1),
      PY(y1),
      `class="graph-line" stroke="${BLUE}" stroke-width="3.5" stroke-linecap="round"`,
    );
    const runEnd = x.add(1);
    const riseEnd = y.add(m);
    if (inWindow(runEnd) && inWindow(riseEnd))
      inner += `<path class="slope-triangle" d="M${PX(x)} ${PY(y)}H${PX(runEnd)}V${PY(riseEnd)}" fill="none" stroke="${CORAL}" stroke-width="2.5" stroke-dasharray="5 4"/>`;
    inner += circle(
      PX(x),
      PY(y),
      7,
      `class="point" data-x="${x}" data-y="${y}" fill="${AMBER}" stroke="${INK}" stroke-width="2.5"`,
    );
    return svg(
      PLANE.size,
      PLANE.size,
      inner,
      `Graph of y = ${linearText(m, b)} with the point (${x}, ${y})`,
    );
  },
  pointer: (s, p, hit) => ({ type: "setX", value: Math.round((hit.x - PLANE.origin) / PLANE.unit) }),
  keys: () => ({ ArrowRight: { type: "step", by: 1 }, ArrowLeft: { type: "step", by: -1 } }),
  controls: (s) => [
    {
      id: "x+",
      label: bi("Move the point right 1", "Mover el punto 1 a la derecha"),
      action: { type: "step", by: 1 },
    },
    {
      id: "x-",
      label: bi("Move the point left 1", "Mover el punto 1 a la izquierda"),
      action: { type: "step", by: -1 },
    },
    {
      id: "m+",
      label: bi("Slope + 1", "Pendiente + 1"),
      action: { type: "setM", value: Rational.of(s.m).add(1).toString() },
    },
    {
      id: "m-",
      label: bi("Slope − 1", "Pendiente − 1"),
      action: { type: "setM", value: Rational.of(s.m).sub(1).toString() },
    },
    {
      id: "b+",
      label: bi("Intercept + 1", "Intersección + 1"),
      action: { type: "setB", value: Rational.of(s.b).add(1).toString() },
    },
    {
      id: "b-",
      label: bi("Intercept − 1", "Intersección − 1"),
      action: { type: "setB", value: Rational.of(s.b).sub(1).toString() },
    },
  ],
  describe(s) {
    const m = Rational.of(s.m);
    const b = Rational.of(s.b);
    const x = Rational.of(s.x);
    return bi(
      `A coordinate plane from −10 to 10 on both axes. The line y = ${linearText(m, b)} passes through the point (${x}, ${m.mul(x).add(b)}).`,
      `Un plano de coordenadas de −10 a 10 en ambos ejes. La recta y = ${linearText(m, b)} pasa por el punto (${x}, ${m.mul(x).add(b)}).`,
    );
  },
  verify(s) {
    const m = Rational.of(s.m);
    const b = Rational.of(s.b);
    const html = this.render(s);
    const problems = [];
    // Map the drawn point back from screen pixels to coordinates and confirm it is on the exact line.
    const cx = Number(
      /class="point"[^>]*/.exec(html) &&
        /cx="([^"]+)"/.exec(html.slice(html.indexOf('class="point"') - 80))?.[1],
    );
    const cy = Number(/cy="([^"]+)"/.exec(html.slice(html.indexOf('class="point"') - 80))?.[1]);
    const gx = (cx - PLANE.origin) / PLANE.unit;
    const gy = (PLANE.origin - cy) / PLANE.unit;
    if (
      Math.abs(gx - Rational.of(s.x).toNumber()) > 0.01 ||
      Math.abs(gy - m.mul(s.x).add(b).toNumber()) > 0.01
    )
      problems.push("the plotted point is not where the table says");
    const lineMatch = /class="graph-line"/.exec(html);
    if (!lineMatch) problems.push("no line drawn");
    const attr = (name) =>
      Number(
        new RegExp(`${name}="([^"]+)"`).exec(
          html.slice(html.indexOf('class="graph-line"') - 120),
        )?.[1],
      );
    for (const [px, py] of [
      [attr("x1"), attr("y1")],
      [attr("x2"), attr("y2")],
    ]) {
      const lx = (px - PLANE.origin) / PLANE.unit;
      const ly = (PLANE.origin - py) / PLANE.unit;
      if (Math.abs(ly - (m.toNumber() * lx + b.toNumber())) > 0.02)
        problems.push("the drawn line does not match its equation");
    }
    return problems;
  },
  generate: (rng, g) =>
    g === 6
      ? { m: rng.int(2, 5), b: 0, x: rng.int(1, 3) }
      : g === 7
        ? { m: rng.pick(["1/2", "3/2", 2, 3, "2/3"]), b: 0, x: rng.int(1, 4) }
        : { m: rng.pick([-2, -1, 1, 2, 3, "1/2", "-1/2"]), b: rng.int(-4, 5), x: rng.int(-2, 3) },
});

// ---------------------------------------------------------------- function machine
registerModel({
  id: "functionMachine",
  title: bi("Function machine", "Máquina de funciones"),
  grades: [5, 6, 7, 8],
  domain: "algebra",
  init: () => ({ inputs: [], revealed: false }),
  reduce(s, a) {
    if (a.type === "feed") {
      const x = Rational.of(a.value);
      if (x.abs().gt(100))
        throw new ModelError(
          bi("Use an input from −100 to 100.", "Usa una entrada de −100 a 100."),
        );
      if (s.inputs.length >= 12)
        throw new ModelError(
          bi(
            "The table is full. Start over or reveal the rule.",
            "La tabla está llena. Empieza de nuevo o revela la regla.",
          ),
        );
      return { ...s, inputs: [...s.inputs, x.toString()] };
    }
    if (a.type === "reveal") return { ...s, revealed: true };
    if (a.type === "clear") return { ...s, inputs: [] };
    throw new ModelError("Unknown move");
  },
  derive(s, p) {
    const m = Rational.of(p.m);
    const b = Rational.of(p.b ?? 0);
    const rows = s.inputs.map((x) => [x, m.mul(x).add(b).toString()]);
    return {
      facts: { rows, rule: [m, b] },
      equation: p.hidden && !s.revealed ? "output = ?" : `output = ${linearText(m, b, "input")}`,
      verbal: bi(
        p.hidden && !s.revealed
          ? `Feed in numbers and look for the pattern in the outputs. ${rows.length} tried so far.`
          : `The machine multiplies by ${m}${b.isZero() ? "" : ` and then ${b.sign() < 0 ? "subtracts" : "adds"} ${b.abs()}`}.`,
        p.hidden && !s.revealed
          ? `Introduce números y busca el patrón en las salidas. Llevas ${rows.length}.`
          : `La máquina multiplica por ${m}${b.isZero() ? "" : ` y luego ${b.sign() < 0 ? "resta" : "suma"} ${b.abs()}`}.`,
      ),
      numeric: { headers: ["input", "output"], rows },
    };
  },
  render(s, p) {
    const m = Rational.of(p.m);
    const b = Rational.of(p.b ?? 0);
    const last = s.inputs.at(-1);
    let inner =
      rect(130, 20, 160, 100, `fill="#f4fbfa" stroke="${INK}" stroke-width="3" rx="12"`) +
      text(
        210,
        78,
        p.hidden && !s.revealed ? "?" : linearText(m, b, "x"),
        `text-anchor="middle" font-size="24" font-weight="800" fill="${INK}"`,
      );
    inner += `<path d="M30 70H128M292 70H390" stroke="${INK}" stroke-width="3" marker-end="url(#a)"/>`;
    if (last !== undefined)
      inner +=
        text(
          78,
          62,
          last,
          `class="in" text-anchor="middle" font-size="22" font-weight="800" fill="${CORAL}"`,
        ) +
        text(
          340,
          62,
          m.mul(last).add(b),
          `class="out" text-anchor="middle" font-size="22" font-weight="800" fill="${BLUE}"`,
        );
    return svg(420, 140, inner, "Function machine");
  },
  controls: (s, p) => [
    ...[0, 1, 2, 3, 5, 10].map((v) => ({
      id: `in-${v}`,
      label: bi(`Feed in ${v}`, `Introducir ${v}`),
      action: { type: "feed", value: v },
    })),
    ...(p.hidden
      ? [
          {
            id: "reveal",
            label: bi("Reveal the rule", "Revelar la regla"),
            action: { type: "reveal" },
            disabled: s.revealed,
          },
        ]
      : []),
    {
      id: "clear",
      label: bi("Clear the table", "Borrar la tabla"),
      action: { type: "clear" },
      disabled: !s.inputs.length,
    },
  ],
  describe: (s, p) =>
    bi(
      `A function machine. ${s.inputs.length} inputs have been tried.`,
      `Una máquina de funciones. Se han probado ${s.inputs.length} entradas.`,
    ),
  verify(s, p) {
    const m = Rational.of(p.m);
    const b = Rational.of(p.b ?? 0);
    const problems = [];
    for (const [x, y] of this.derive(s, p).numeric.rows)
      if (!Rational.of(y).eq(m.mul(x).add(b))) problems.push(`${x} → ${y} breaks the rule`);
    return problems;
  },
  generate: (rng, g) => ({ m: rng.int(2, 6), b: rng.int(0, g >= 6 ? 8 : 4), hidden: true }),
});

// ---------------------------------------------------------------- balance scale for equations
const bal = (s) => ({
  A: Rational.of(s.A),
  B: Rational.of(s.B),
  C: Rational.of(s.C),
  D: Rational.of(s.D),
});
const pack = (o) => ({
  A: o.A.toString(),
  B: o.B.toString(),
  C: o.C.toString(),
  D: o.D.toString(),
});
const solutionOf = (p) => R(p.d - p.b, p.a - (p.c ?? 0));
registerModel({
  id: "balanceScale",
  title: bi("Balance scale for equations", "Balanza para ecuaciones"),
  grades: [6, 7, 8],
  domain: "algebra",
  init: (p) => ({ A: String(p.a), B: String(p.b), C: String(p.c ?? 0), D: String(p.d), log: [] }),
  reduce(s, a, p) {
    const v = a.value === undefined ? null : Rational.of(a.value);
    const q = bal(s);
    const record = (o, text) => ({ ...pack(o), log: [...s.log, text] });
    const big = (o) => Object.values(o).some((n) => n.abs().gt(100000));
    let next;
    switch (a.type) {
      case "addConst":
        next = { ...q, B: q.B.add(v), D: q.D.add(v) };
        return record(
          next,
          `${v.sign() >= 0 ? "Add" : "Subtract"} ${v.abs()} ${v.sign() >= 0 ? "to" : "from"} both sides`,
        );
      case "addX":
        next = { ...q, A: q.A.add(v), C: q.C.add(v) };
        return record(
          next,
          `${v.sign() >= 0 ? "Add" : "Subtract"} ${coef(v.abs())} ${v.sign() >= 0 ? "to" : "from"} both sides`,
        );
      case "mul":
        if (v.isZero())
          throw new ModelError(
            bi(
              "Multiplying both sides by 0 would erase the equation.",
              "Multiplicar ambos lados por 0 borraría la ecuación.",
            ),
          );
        next = { A: q.A.mul(v), B: q.B.mul(v), C: q.C.mul(v), D: q.D.mul(v) };
        if (big(next))
          throw new ModelError(
            bi(
              "Those numbers are getting too large to show.",
              "Esos números son demasiado grandes para mostrarlos.",
            ),
          );
        return record(next, `Multiply both sides by ${v}`);
      case "div":
        if (v.isZero())
          throw new ModelError(
            bi("You cannot divide both sides by 0.", "No puedes dividir ambos lados entre 0."),
          );
        next = { A: q.A.div(v), B: q.B.div(v), C: q.C.div(v), D: q.D.div(v) };
        return record(next, `Divide both sides by ${v}`);
      case "undo":
        if (!s.log.length)
          throw new ModelError(bi("There is nothing to undo.", "No hay nada que deshacer."));
        return s;
      default:
        throw new ModelError("Unknown move");
    }
  },
  derive(s, p) {
    const q = bal(s);
    const x0 = solutionOf(p);
    const solved = q.A.eq(1) && q.B.isZero() && q.C.isZero();
    let hint;
    if (!q.C.isZero())
      hint = bi(
        `Subtract ${coef(q.C)} from both sides to gather the x terms.`,
        `Resta ${coef(q.C)} de ambos lados para juntar los términos con x.`,
      );
    else if (!q.B.isZero())
      hint = bi(
        `Undo ${konst(q.B)} by ${q.B.sign() > 0 ? "subtracting" : "adding"} ${q.B.abs()} on both sides.`,
        `Deshaz ${konst(q.B)} ${q.B.sign() > 0 ? "restando" : "sumando"} ${q.B.abs()} en ambos lados.`,
      );
    else if (!q.A.eq(1) && !q.A.isZero())
      hint = bi(
        `Divide both sides by ${q.A} to find one x.`,
        `Divide ambos lados entre ${q.A} para encontrar una x.`,
      );
    else hint = bi("The equation is solved.", "La ecuación está resuelta.");
    const eq = `${linearText(q.A, q.B)} = ${q.C.isZero() ? konst(q.D) || "0" : linearText(q.C, q.D)}`;
    return {
      facts: { solved, solution: x0, equal: q.A.mul(x0).add(q.B).eq(q.C.mul(x0).add(q.D)) },
      equation: solved
        ? `x = ${q.D}    (check: ${linearText(R(p.a), R(p.b)).replace(/x/g, `(${x0})`)} = ${R(p.a).mul(x0).add(p.b)} and ${R(p.d)})`
        : eq,
      verbal: bi(
        solved
          ? `x = ${q.D}. Both sides of the original equation equal ${R(p.a).mul(x0).add(p.b)} when x is ${x0}.`
          : `The scale stays balanced because you did the same thing to both sides. Next idea: ${hint.en}`,
        solved
          ? `x = ${q.D}. Ambos lados de la ecuación original valen ${R(p.a).mul(x0).add(p.b)} cuando x es ${x0}.`
          : `La balanza sigue equilibrada porque hiciste lo mismo en ambos lados. Siguiente idea: ${hint.es}`,
      ),
      numeric: {
        headers: ["step", "equation"],
        rows: [
          ["start", `${linearText(R(p.a), R(p.b))} = ${p.c ? linearText(R(p.c), R(p.d)) : p.d}`],
          ...s.log.map((entry, i) => [entry, "→"]),
        ],
      },
      steps: { hint },
    };
  },
  render(s) {
    const q = bal(s);
    const pan = (a, b, cx) => {
      let inner = "";
      const xs = Math.min(8, Math.round(Math.abs(a.toNumber())));
      const us = Math.min(10, Math.round(Math.abs(b.toNumber())));
      for (let i = 0; i < xs; i += 1)
        inner +=
          rect(
            cx - 60 + (i % 4) * 30,
            90 - Math.floor(i / 4) * 30,
            26,
            26,
            `class="tile x" fill="${a.sign() < 0 ? "#f6c9bd" : "#cfe9e7"}" stroke="${INK}" stroke-width="2" rx="4"`,
          ) +
          text(
            cx - 47 + (i % 4) * 30,
            108 - Math.floor(i / 4) * 30,
            "x",
            `text-anchor="middle" font-size="14" font-weight="800" fill="${INK}"`,
          );
      for (let i = 0; i < us; i += 1)
        inner += rect(
          cx - 60 + (i % 5) * 20,
          126 + Math.floor(i / 5) * 18,
          16,
          16,
          `class="tile u" fill="${b.sign() < 0 ? "#f6c9bd" : AMBER}" stroke="${INK}" stroke-width="1.5" rx="3"`,
        );
      return inner;
    };
    let inner = `<path d="M30 70H390" stroke="${INK}" stroke-width="5"/><path d="M210 70V176M180 176H240" stroke="${INK}" stroke-width="5"/>${rect(30, 150, 150, 8, `fill="${INK}"`)}${rect(240, 150, 150, 8, `fill="${INK}"`)}`;
    inner += pan(q.A, q.B, 105) + pan(q.C, q.D, 315);
    inner +=
      text(
        105,
        26,
        linearText(q.A, q.B),
        `text-anchor="middle" font-size="16" font-weight="800" fill="${INK}"`,
      ) +
      text(
        315,
        26,
        q.C.isZero() ? konst(q.D) || "0" : linearText(q.C, q.D),
        `text-anchor="middle" font-size="16" font-weight="800" fill="${INK}"`,
      );
    return svg(
      420,
      190,
      inner,
      `Balance scale: ${linearText(q.A, q.B)} equals ${q.C.isZero() ? konst(q.D) || "0" : linearText(q.C, q.D)}`,
    );
  },
  controls: (s, p) => {
    const q = bal(s);
    const out = [];
    if (!q.C.isZero())
      out.push({
        id: "subCx",
        label: bi(`Subtract ${coef(q.C)} from both sides`, `Restar ${coef(q.C)} de ambos lados`),
        action: { type: "addX", value: q.C.neg().toString() },
      });
    if (!q.B.isZero())
      out.push({
        id: "undoB",
        label: bi(
          `${q.B.sign() > 0 ? "Subtract" : "Add"} ${q.B.abs()} on both sides`,
          `${q.B.sign() > 0 ? "Restar" : "Sumar"} ${q.B.abs()} en ambos lados`,
        ),
        action: { type: "addConst", value: q.B.neg().toString() },
      });
    if (!q.A.eq(1) && !q.A.isZero())
      out.push({
        id: "divA",
        label: bi(`Divide both sides by ${q.A}`, `Dividir ambos lados entre ${q.A}`),
        action: { type: "div", value: q.A.toString() },
      });
    out.push(
      {
        id: "add1",
        label: bi("Add 1 to both sides", "Sumar 1 a ambos lados"),
        action: { type: "addConst", value: 1 },
      },
      {
        id: "mul2",
        label: bi("Multiply both sides by 2", "Multiplicar ambos lados por 2"),
        action: { type: "mul", value: 2 },
      },
    );
    return out;
  },
  describe(s) {
    const q = bal(s);
    return bi(
      `A balance scale. Left pan: ${linearText(q.A, q.B)}. Right pan: ${q.C.isZero() ? konst(q.D) || "0" : linearText(q.C, q.D)}. The scale is level.`,
      `Una balanza. Plato izquierdo: ${linearText(q.A, q.B)}. Plato derecho: ${q.C.isZero() ? konst(q.D) || "0" : linearText(q.C, q.D)}. La balanza está equilibrada.`,
    );
  },
  verify(s, p) {
    const q = bal(s);
    const x0 = solutionOf(p);
    const problems = [];
    // Equality is preserved: the original solution must still make both sides equal after every operation.
    if (!q.A.mul(x0).add(q.B).eq(q.C.mul(x0).add(q.D)))
      problems.push("an operation changed the solution");
    const html = this.render(s, p);
    const xTiles = (html.match(/class="tile x"/g) || []).length;
    const expected =
      Math.min(8, Math.round(Math.abs(q.A.toNumber()))) +
      Math.min(8, Math.round(Math.abs(q.C.toNumber())));
    if (xTiles !== expected) problems.push("x tiles drawn do not match the coefficients");
    return problems;
  },
  generate(rng, g) {
    const x = rng.int(1, 9);
    const a = rng.int(2, g >= 8 ? 7 : 5);
    const b = rng.int(1, 9);
    const hasC = g >= 8 && rng.int(0, 1) === 1;
    const c = hasC ? rng.int(1, a - 1) : 0;
    return { a, b, c, d: (a - c) * x + b };
  },
});

// ---------------------------------------------------------------- algebra tiles (combine like terms)
registerModel({
  id: "algebraTiles",
  title: bi("Algebra tiles", "Fichas de álgebra"),
  grades: [6, 7, 8],
  domain: "algebra",
  init: (p) => ({ xp: p.xp ?? 0, xn: p.xn ?? 0, op: p.op ?? 0, on: p.on ?? 0 }),
  reduce(s, a) {
    const key = { x: "xp", "-x": "xn", 1: "op", "-1": "on" }[a.kind];
    if (a.type === "add") {
      if (!key) throw new ModelError("Unknown tile");
      if (s[key] >= 12)
        throw new ModelError(
          bi(
            "That is the most tiles of this kind that fit.",
            "Es el máximo de fichas de este tipo.",
          ),
        );
      return { ...s, [key]: s[key] + 1 };
    }
    if (a.type === "remove") {
      if (!key || s[key] <= 0)
        throw new ModelError(
          bi(
            "There is no tile of that kind to remove.",
            "No hay una ficha de ese tipo para quitar.",
          ),
        );
      return { ...s, [key]: s[key] - 1 };
    }
    if (a.type === "zero") {
      const [pos, neg] = a.which === "x" ? ["xp", "xn"] : ["op", "on"];
      if (s[pos] < 1 || s[neg] < 1)
        throw new ModelError(
          bi(
            "A zero pair needs one positive and one negative tile of the same kind.",
            "Un par cero necesita una ficha positiva y una negativa del mismo tipo.",
          ),
        );
      return { ...s, [pos]: s[pos] - 1, [neg]: s[neg] - 1 };
    }
    throw new ModelError("Unknown move");
  },
  derive(s, p) {
    const c = s.xp - s.xn;
    const k = s.op - s.on;
    const raw = joinTerms([
      s.xp ? coef(s.xp) : "",
      s.xn ? coef(-s.xn) : "",
      s.op ? konst(s.op) : "",
      s.on ? konst(-s.on) : "",
    ]);
    const simple = linearText(R(c), R(k));
    const at = R(p.at ?? 2);
    return {
      facts: { coefficient: c, constant: k, value: R(c).mul(at).add(k) },
      equation: raw === simple ? simple : `${raw} = ${simple}`,
      verbal: bi(
        `Zero pairs cancel. The tiles are the same as ${simple}. When x is ${at}, the value is ${R(c).mul(at).add(k)}.`,
        `Los pares cero se cancelan. Las fichas equivalen a ${simple}. Cuando x es ${at}, el valor es ${R(c).mul(at).add(k)}.`,
      ),
      numeric: {
        headers: ["x", simple],
        rows: [0, 1, 2, 3, 4].map((x) => [x, R(c).mul(x).add(k).toString()]),
      },
    };
  },
  render(s) {
    let inner = "";
    const row = (n, y, cls, fill, label, w, h) => {
      for (let i = 0; i < n; i += 1)
        inner +=
          rect(
            10 + i * (w + 6),
            y,
            w,
            h,
            `class="tile ${cls}" fill="${fill}" stroke="${INK}" stroke-width="2" rx="4"`,
          ) +
          text(
            10 + i * (w + 6) + w / 2,
            y + h / 2 + 5,
            label,
            `text-anchor="middle" font-size="14" font-weight="800" fill="${INK}"`,
          );
    };
    row(s.xp, 8, "xp", "#cfe9e7", "x", 48, 28);
    row(s.xn, 44, "xn", "#f6c9bd", "−x", 48, 28);
    row(s.op, 80, "op", AMBER, "1", 24, 24);
    row(s.on, 112, "on", "#f6c9bd", "−1", 24, 24);
    return svg(
      420,
      144,
      inner,
      `Algebra tiles: ${s.xp} x, ${s.xn} negative x, ${s.op} ones, ${s.on} negative ones`,
    );
  },
  controls: (s) => [
    {
      id: "+x",
      label: bi("Add an x tile", "Agregar una ficha x"),
      action: { type: "add", kind: "x" },
    },
    {
      id: "-x",
      label: bi("Add a −x tile", "Agregar una ficha −x"),
      action: { type: "add", kind: "-x" },
    },
    {
      id: "+1",
      label: bi("Add a 1 tile", "Agregar una ficha 1"),
      action: { type: "add", kind: "1" },
    },
    {
      id: "-1",
      label: bi("Add a −1 tile", "Agregar una ficha −1"),
      action: { type: "add", kind: "-1" },
    },
    {
      id: "zx",
      label: bi("Remove an x zero pair", "Quitar un par cero de x"),
      action: { type: "zero", which: "x" },
      disabled: s.xp < 1 || s.xn < 1,
    },
    {
      id: "z1",
      label: bi("Remove a 1 zero pair", "Quitar un par cero de 1"),
      action: { type: "zero", which: "1" },
      disabled: s.op < 1 || s.on < 1,
    },
  ],
  describe: (s) =>
    bi(
      `${s.xp} x tiles, ${s.xn} negative x tiles, ${s.op} one tiles and ${s.on} negative one tiles.`,
      `${s.xp} fichas x, ${s.xn} fichas x negativas, ${s.op} fichas 1 y ${s.on} fichas 1 negativas.`,
    ),
  verify(s, p) {
    const problems = [];
    const html = this.render(s);
    for (const k of ["xp", "xn", "op", "on"])
      if ((html.match(new RegExp(`class="tile ${k}"`, "g")) || []).length !== s[k])
        problems.push(`tile count for ${k} is off`);
    // Combining like terms must not change the value for any x.
    for (const x of [-3, 0, 1, 4])
      if ((s.xp - s.xn) * x + (s.op - s.on) !== s.xp * x - s.xn * x + s.op - s.on)
        problems.push("simplified expression disagrees");
    return problems;
  },
  generate: (rng) => ({
    xp: rng.int(2, 5),
    xn: rng.int(0, 2),
    op: rng.int(1, 5),
    on: rng.int(0, 3),
    at: rng.int(1, 5),
  }),
});

// ---------------------------------------------------------------- integer chips
registerModel({
  id: "integerChips",
  title: bi("Integer chips", "Fichas de enteros"),
  grades: [6, 7],
  domain: "number",
  init: (p) => ({ pos: Math.max(0, p.a ?? 0), neg: Math.max(0, -(p.a ?? 0)) }),
  reduce(s, a) {
    if (a.type === "add") {
      const key = a.sign === "+" ? "pos" : "neg";
      if (s[key] >= 15)
        throw new ModelError(
          bi("That is the most chips of one kind that fit.", "Es el máximo de fichas de un tipo."),
        );
      return { ...s, [key]: s[key] + 1 };
    }
    if (a.type === "remove") {
      const key = a.sign === "+" ? "pos" : "neg";
      if (s[key] < 1)
        throw new ModelError(
          bi(
            `There is no ${a.sign === "+" ? "positive" : "negative"} chip to take away. Add zero pairs first.`,
            `No hay una ficha ${a.sign === "+" ? "positiva" : "negativa"} para quitar. Agrega pares cero primero.`,
          ),
        );
      return { ...s, [key]: s[key] - 1 };
    }
    if (a.type === "addZero") {
      if (s.pos >= 15 || s.neg >= 15)
        throw new ModelError(bi("That is the most chips that fit.", "Es el máximo de fichas."));
      return { pos: s.pos + 1, neg: s.neg + 1 };
    }
    if (a.type === "removeZero") {
      if (s.pos < 1 || s.neg < 1)
        throw new ModelError(
          bi(
            "A zero pair needs a positive and a negative chip.",
            "Un par cero necesita una ficha positiva y una negativa.",
          ),
        );
      return { pos: s.pos - 1, neg: s.neg - 1 };
    }
    throw new ModelError("Unknown move");
  },
  derive(s, p) {
    const net = s.pos - s.neg;
    const target = p.expr ? (p.expr.op === "-" ? p.expr.a - p.expr.b : p.expr.a + p.expr.b) : null;
    return {
      facts: { pos: s.pos, neg: s.neg, net, target },
      equation: p.expr
        ? `${p.expr.a} ${p.expr.op === "-" ? "−" : "+"} ${p.expr.b < 0 ? `(${p.expr.b})` : p.expr.b} = ${target}    (chips now show ${net})`
        : `${s.pos} − ${s.neg} = ${net}`,
      verbal: bi(
        `${s.pos} positive and ${s.neg} negative chips. Each positive-negative pair is zero, so the value is ${net}.`,
        `${s.pos} fichas positivas y ${s.neg} negativas. Cada par positivo-negativo es cero, así que el valor es ${net}.`,
      ),
      numeric: { headers: ["positive", "negative", "net"], rows: [[s.pos, s.neg, net]] },
    };
  },
  render(s) {
    let inner = "";
    for (let i = 0; i < s.pos; i += 1)
      inner +=
        circle(
          22 + (i % 8) * 36,
          24 + Math.floor(i / 8) * 40,
          15,
          `class="chip pos" fill="${AMBER}" stroke="${INK}" stroke-width="2"`,
        ) +
        text(
          22 + (i % 8) * 36,
          31 + Math.floor(i / 8) * 40,
          "+",
          `text-anchor="middle" font-size="20" font-weight="800" fill="${INK}"`,
        );
    const base = 24 + Math.ceil(Math.max(1, s.pos) / 8) * 40 + 10;
    for (let i = 0; i < s.neg; i += 1)
      inner +=
        rect(
          7 + (i % 8) * 36,
          base - 15 + Math.floor(i / 8) * 40,
          30,
          30,
          `class="chip neg" fill="#f6c9bd" stroke="${INK}" stroke-width="2" rx="5"`,
        ) +
        text(
          22 + (i % 8) * 36,
          base + 7 + Math.floor(i / 8) * 40,
          "−",
          `text-anchor="middle" font-size="22" font-weight="800" fill="${INK}"`,
        );
    return svg(
      310,
      base + Math.ceil(Math.max(1, s.neg) / 8) * 40,
      inner,
      `${s.pos} positive chips and ${s.neg} negative chips, value ${s.pos - s.neg}`,
    );
  },
  controls: (s) => [
    {
      id: "+",
      label: bi("Add a + chip", "Agregar una ficha +"),
      action: { type: "add", sign: "+" },
    },
    {
      id: "-",
      label: bi("Add a − chip", "Agregar una ficha −"),
      action: { type: "add", sign: "-" },
    },
    { id: "z+", label: bi("Add a zero pair", "Agregar un par cero"), action: { type: "addZero" } },
    {
      id: "z-",
      label: bi("Remove a zero pair", "Quitar un par cero"),
      action: { type: "removeZero" },
      disabled: s.pos < 1 || s.neg < 1,
    },
    {
      id: "r+",
      label: bi("Take away a + chip", "Quitar una ficha +"),
      action: { type: "remove", sign: "+" },
      disabled: s.pos < 1,
    },
    {
      id: "r-",
      label: bi("Take away a − chip", "Quitar una ficha −"),
      action: { type: "remove", sign: "-" },
      disabled: s.neg < 1,
    },
  ],
  describe: (s) =>
    bi(
      `${s.pos} positive chips and ${s.neg} negative chips, worth ${s.pos - s.neg}.`,
      `${s.pos} fichas positivas y ${s.neg} fichas negativas, que valen ${s.pos - s.neg}.`,
    ),
  verify(s) {
    const html = this.render(s);
    const pos = (html.match(/class="chip pos"/g) || []).length;
    const neg = (html.match(/class="chip neg"/g) || []).length;
    return pos === s.pos && neg === s.neg ? [] : [`drew ${pos}/${neg}, state ${s.pos}/${s.neg}`];
  },
  generate: (rng) => ({
    a: rng.int(-6, 6),
    expr: { a: rng.int(-6, 6), b: rng.int(-6, 6), op: rng.pick(["+", "-"]) },
  }),
});

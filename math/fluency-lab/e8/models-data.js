// Statistics models: dot plot with mean/median balance, histogram, box plot, and scatter plot with an exact line of best fit.
import { Rational, R, mean, median, modes, quartiles } from "./rational.js";
import {
  ModelError,
  bi,
  circle,
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

const sorted = (data) => data.map(Rational.of).sort((a, b) => a.cmp(b));
const fmt = (r) =>
  r.isInteger() ? `${r}` : `${r.toDecimal(2).replace(/0+$/, "").replace(/\.$/, "")}`;

// ---------------------------------------------------------------- dot plot, mean as balance point, median, mode, range
const dataReduce = (s, a, p) => {
  const lo = p.min ?? 0;
  const hi = p.max ?? 20;
  if (a.type === "add") {
    const v = intIn(a.value, lo, hi, bi("That value", "Ese valor"));
    if (s.data.length >= 30)
      throw new ModelError(
        bi("That is the most data values that fit.", "Es el máximo de datos que caben."),
      );
    return { data: [...s.data, v].sort((x, y) => x - y) };
  }
  if (a.type === "remove") {
    const i = s.data.indexOf(a.value);
    if (i < 0)
      throw new ModelError(
        bi("There is no data value like that to remove.", "No hay un dato así para quitar."),
      );
    return { data: s.data.filter((_, j) => j !== i) };
  }
  if (a.type === "move") {
    const i = s.data.indexOf(a.from);
    if (i < 0)
      throw new ModelError(
        bi("There is no data value like that to move.", "No hay un dato así para mover."),
      );
    const to = intIn(a.to, lo, hi, bi("That value", "Ese valor"));
    const next = [...s.data];
    next[i] = to;
    return { data: next.sort((x, y) => x - y) };
  }
  throw new ModelError("Unknown move");
};
const needData = (s) => {
  if (!s.data.length)
    return bi("Add some data to see the statistics.", "Agrega datos para ver las estadísticas.");
  return null;
};

registerModel({
  id: "dotPlot",
  title: bi("Dot plot with mean and median", "Diagrama de puntos con media y mediana"),
  grades: [3, 5, 6, 7],
  domain: "data",
  init: (p) => ({ data: [...(p.data || [])].sort((a, b) => a - b) }),
  reduce: dataReduce,
  derive(s) {
    const empty = needData(s);
    if (empty)
      return {
        facts: { n: 0 },
        equation: "",
        verbal: empty,
        numeric: { headers: ["value", "count"], rows: [] },
      };
    const m = mean(s.data);
    const med = median(s.data);
    const md = modes(s.data);
    const total = s.data.reduce((x, y) => x + y, 0);
    const counts = new Map();
    for (const v of s.data) counts.set(v, (counts.get(v) || 0) + 1);
    return {
      facts: {
        n: s.data.length,
        mean: m,
        median: med,
        modes: md,
        range: R(s.data.at(-1) - s.data[0]),
        sum: R(total),
      },
      equation: `mean = ${total} ÷ ${s.data.length} = ${fmt(m)}    median = ${fmt(med)}    range = ${s.data.at(-1)} − ${s.data[0]} = ${s.data.at(-1) - s.data[0]}`,
      verbal: bi(
        `${s.data.length} values. If you shared the total ${total} equally you would get ${fmt(m)} each; that is the mean, the balance point. The median ${fmt(med)} is the middle value.${md.length ? ` Most common: ${md.map(fmt).join(", ")}.` : " No value repeats."}`,
        `${s.data.length} valores. Si repartieras el total ${total} en partes iguales tocarían ${fmt(m)} a cada uno; esa es la media, el punto de equilibrio. La mediana ${fmt(med)} es el valor del medio.${md.length ? ` Más frecuente: ${md.map(fmt).join(", ")}.` : " Ningún valor se repite."}`,
      ),
      numeric: { headers: ["value", "count"], rows: [...counts].map(([v, c]) => [v, c]) },
    };
  },
  render(s, p) {
    const lo = p.min ?? 0;
    const hi = p.max ?? 20;
    const X = (v) => 30 + ((Number(v) - lo) / (hi - lo)) * 440;
    let inner = line(30, 150, 470, 150, `stroke="${INK}" stroke-width="3"`);
    for (let v = lo; v <= hi; v += 1)
      inner +=
        line(X(v), 150, X(v), 158, `stroke="${INK}" stroke-width="1.5"`) +
        (v % Math.max(1, Math.round((hi - lo) / 10)) === 0
          ? text(X(v), 174, v, `text-anchor="middle" font-size="12" fill="${INK}"`)
          : "");
    const stack = new Map();
    for (const v of s.data) {
      const k = stack.get(v) || 0;
      stack.set(v, k + 1);
      inner += circle(
        X(v),
        138 - k * 18,
        7,
        `class="dot" data-value="${v}" fill="${TEAL}" stroke="${INK}" stroke-width="1.5"`,
      );
    }
    if (s.data.length) {
      const m = mean(s.data).toNumber();
      inner += `<path class="fulcrum" data-mean="${mean(s.data)}" d="M${X(m)} 154 l-9 16 h18z" fill="${CORAL}" stroke="${INK}" stroke-width="1.5"/>`;
    }
    return svg(500, 184, inner, `Dot plot with ${s.data.length} values`);
  },
  pointer: (s, p, hit) => ({ type: "add", value: Math.round((p.min ?? 0) + ((hit.x - 30) / 440) * ((p.max ?? 20) - (p.min ?? 0))) }),
  controls: (s, p) => {
    const lo = p.min ?? 0;
    const hi = p.max ?? 20;
    const mid = Math.round((lo + hi) / 2);
    return [
      {
        id: "add-lo",
        label: bi(
          `Add a dot at ${lo + Math.round((hi - lo) / 4)}`,
          `Agregar un punto en ${lo + Math.round((hi - lo) / 4)}`,
        ),
        action: { type: "add", value: lo + Math.round((hi - lo) / 4) },
      },
      {
        id: "add-mid",
        label: bi(`Add a dot at ${mid}`, `Agregar un punto en ${mid}`),
        action: { type: "add", value: mid },
      },
      {
        id: "add-hi",
        label: bi(
          `Add a dot at ${hi - Math.round((hi - lo) / 4)}`,
          `Agregar un punto en ${hi - Math.round((hi - lo) / 4)}`,
        ),
        action: { type: "add", value: hi - Math.round((hi - lo) / 4) },
      },
      {
        id: "rm-last",
        label: bi("Remove the largest dot", "Quitar el punto más grande"),
        action: { type: "remove", value: s.data.at(-1) },
        disabled: !s.data.length,
      },
    ];
  },
  describe: (s) =>
    bi(
      `A dot plot with ${s.data.length} dots${s.data.length ? `, values ${s.data.join(", ")}` : ""}.`,
      `Un diagrama de puntos con ${s.data.length} puntos${s.data.length ? `, valores ${s.data.join(", ")}` : ""}.`,
    ),
  verify(s, p) {
    const problems = [];
    const html = this.render(s, p);
    const dots = (html.match(/class="dot"/g) || []).length;
    if (dots !== s.data.length) problems.push(`drew ${dots} dots for ${s.data.length} values`);
    if (s.data.length) {
      // The mean is the balance point: the signed distances to it cancel exactly.
      const m = mean(s.data);
      const dev = s.data.reduce((acc, v) => acc.add(R(v).sub(m)), R(0));
      if (!dev.isZero()) problems.push("deviations from the mean do not cancel");
      const med = median(s.data);
      const below = s.data.filter((v) => R(v).lt(med)).length;
      const above = s.data.filter((v) => R(v).gt(med)).length;
      if (below > s.data.length / 2 || above > s.data.length / 2)
        problems.push("median does not split the data");
    }
    return problems;
  },
  generate: (rng, g) => ({
    min: 0,
    max: g <= 3 ? 10 : 20,
    data: Array.from({ length: rng.int(7, 11) }, () => rng.int(1, g <= 3 ? 9 : 18)),
  }),
});

// ---------------------------------------------------------------- histogram
const bins = (data, lo, width, count) => {
  const out = Array.from({ length: count }, (_, i) => ({
    from: lo + i * width,
    to: lo + (i + 1) * width,
    n: 0,
  }));
  for (const v of data) {
    const i = Math.min(count - 1, Math.floor((v - lo) / width));
    if (i >= 0) out[i].n += 1;
  }
  return out;
};
registerModel({
  id: "histogram",
  title: bi("Histogram", "Histograma"),
  grades: [6, 7, 8],
  domain: "data",
  init: (p) => ({ data: [...(p.data || [])].sort((a, b) => a - b), width: p.width }),
  reduce(s, a, p) {
    if (a.type === "width")
      return { ...s, width: intIn(a.value, 1, 10, bi("The bin width", "El ancho del intervalo")) };
    return { ...dataReduce(s, a, p), width: s.width };
  },
  derive(s, p) {
    const lo = p.min ?? 0;
    const count = Math.ceil(((p.max ?? 20) - lo + 1) / s.width);
    const b = bins(s.data, lo, s.width, count);
    return {
      facts: { bins: b, n: s.data.length },
      equation: b.map((x) => `${x.from}–${x.to - 1}: ${x.n}`).join("   "),
      verbal: bi(
        `${s.data.length} values sorted into bins ${s.width} wide. Every value is counted exactly once. The tallest bar is ${Math.max(0, ...b.map((x) => x.n))}.`,
        `${s.data.length} valores en intervalos de ${s.width} de ancho. Cada valor se cuenta exactamente una vez. La barra más alta es ${Math.max(0, ...b.map((x) => x.n))}.`,
      ),
      numeric: {
        headers: ["interval", "frequency"],
        rows: b.map((x) => [`${x.from}–${x.to - 1}`, x.n]),
      },
    };
  },
  render(s, p) {
    const lo = p.min ?? 0;
    const count = Math.ceil(((p.max ?? 20) - lo + 1) / s.width);
    const b = bins(s.data, lo, s.width, count);
    const top = Math.max(4, ...b.map((x) => x.n));
    const bw = 420 / count;
    let inner =
      line(40, 140, 470, 140, `stroke="${INK}" stroke-width="2.5"`) +
      line(40, 20, 40, 140, `stroke="${INK}" stroke-width="2.5"`);
    b.forEach((x, i) => {
      const h = (x.n / top) * 110;
      inner +=
        rect(
          46 + i * bw,
          140 - h,
          bw - 4,
          h,
          `class="bar" data-count="${x.n}" fill="${TEAL}" stroke="${INK}" stroke-width="1.5"`,
        ) +
        text(
          46 + i * bw + (bw - 4) / 2,
          156,
          `${x.from}`,
          `text-anchor="middle" font-size="11" fill="${INK}"`,
        );
      if (x.n)
        inner += text(
          46 + i * bw + (bw - 4) / 2,
          136 - h,
          x.n,
          `text-anchor="middle" font-size="12" font-weight="800" fill="${INK}"`,
        );
    });
    return svg(500, 172, inner, `Histogram of ${s.data.length} values in bins ${s.width} wide`);
  },
  controls: (s) => [
    {
      id: "w+",
      label: bi("Wider bins", "Intervalos más anchos"),
      action: { type: "width", value: s.width + 1 },
      disabled: s.width >= 10,
    },
    {
      id: "w-",
      label: bi("Narrower bins", "Intervalos más angostos"),
      action: { type: "width", value: s.width - 1 },
      disabled: s.width <= 1,
    },
  ],
  describe: (s) =>
    bi(
      `A histogram of ${s.data.length} values with bins ${s.width} wide.`,
      `Un histograma de ${s.data.length} valores con intervalos de ${s.width} de ancho.`,
    ),
  verify(s, p) {
    const counts = [...this.render(s, p).matchAll(/data-count="(\d+)"/g)].map((m) => Number(m[1]));
    return counts.reduce((x, y) => x + y, 0) === s.data.length
      ? []
      : ["bars do not add to the number of values"];
  },
  generate: (rng) => ({
    min: 0,
    max: 29,
    width: 5,
    data: Array.from({ length: rng.int(14, 22) }, () => rng.int(0, 29)),
  }),
});

// ---------------------------------------------------------------- box plot
registerModel({
  id: "boxPlot",
  title: bi("Box plot", "Diagrama de caja"),
  grades: [6, 7, 8],
  domain: "data",
  init: (p) => ({ data: [...(p.data || [])].sort((a, b) => a - b) }),
  reduce: dataReduce,
  derive(s) {
    const empty = needData(s);
    if (empty || s.data.length < 4)
      return {
        facts: { n: s.data.length },
        equation: "",
        verbal: bi(
          "A box plot needs at least 4 values.",
          "Un diagrama de caja necesita al menos 4 valores.",
        ),
        numeric: { headers: ["statistic", "value"], rows: [] },
      };
    const q = quartiles(s.data);
    const iqr = q.q3.sub(q.q1);
    return {
      facts: { ...q, iqr, n: s.data.length },
      equation: `min ${fmt(q.min)}   Q1 ${fmt(q.q1)}   median ${fmt(q.median)}   Q3 ${fmt(q.q3)}   max ${fmt(q.max)}   IQR = ${fmt(q.q3)} − ${fmt(q.q1)} = ${fmt(iqr)}`,
      verbal: bi(
        `The box holds the middle half of the data, from ${fmt(q.q1)} to ${fmt(q.q3)}. The line inside is the median, ${fmt(q.median)}. The whiskers reach the smallest and largest values.`,
        `La caja contiene la mitad central de los datos, de ${fmt(q.q1)} a ${fmt(q.q3)}. La línea de adentro es la mediana, ${fmt(q.median)}. Los bigotes llegan al valor menor y al mayor.`,
      ),
      numeric: {
        headers: ["statistic", "value"],
        rows: [
          ["minimum", fmt(q.min)],
          ["Q1", fmt(q.q1)],
          ["median", fmt(q.median)],
          ["Q3", fmt(q.q3)],
          ["maximum", fmt(q.max)],
          ["IQR", fmt(iqr)],
        ],
      },
    };
  },
  render(s, p) {
    const lo = p.min ?? 0;
    const hi = p.max ?? 20;
    const X = (v) => 30 + ((v - lo) / (hi - lo)) * 440;
    let inner = line(30, 120, 470, 120, `stroke="${INK}" stroke-width="2.5"`);
    for (let v = lo; v <= hi; v += Math.max(1, Math.round((hi - lo) / 10)))
      inner +=
        line(X(v), 120, X(v), 128, `stroke="${INK}"`) +
        text(X(v), 144, v, `text-anchor="middle" font-size="12" fill="${INK}"`);
    if (s.data.length >= 4) {
      const q = quartiles(s.data);
      const n = (r) => r.toNumber();
      inner +=
        line(X(n(q.min)), 60, X(n(q.q1)), 60, `class="whisker" stroke="${INK}" stroke-width="3"`) +
        line(X(n(q.q3)), 60, X(n(q.max)), 60, `class="whisker" stroke="${INK}" stroke-width="3"`);
      inner +=
        rect(
          X(n(q.q1)),
          36,
          X(n(q.q3)) - X(n(q.q1)),
          48,
          `class="box" data-q1="${q.q1}" data-q3="${q.q3}" fill="#cfe9e7" stroke="${INK}" stroke-width="3"`,
        ) +
        line(
          X(n(q.median)),
          36,
          X(n(q.median)),
          84,
          `class="median" data-median="${q.median}" stroke="${CORAL}" stroke-width="4"`,
        );
    }
    return svg(500, 156, inner, `Box plot of ${s.data.length} values`);
  },
  controls: (s, p) => [
    {
      id: "add",
      label: bi(
        `Add a value (${Math.round(((p.max ?? 20) + (p.min ?? 0)) / 2)})`,
        `Agregar un valor (${Math.round(((p.max ?? 20) + (p.min ?? 0)) / 2)})`,
      ),
      action: { type: "add", value: Math.round(((p.max ?? 20) + (p.min ?? 0)) / 2) },
    },
    {
      id: "add-hi",
      label: bi(`Add a high value (${p.max ?? 20})`, `Agregar un valor alto (${p.max ?? 20})`),
      action: { type: "add", value: p.max ?? 20 },
    },
    {
      id: "rm",
      label: bi("Remove the largest value", "Quitar el valor más grande"),
      action: { type: "remove", value: s.data.at(-1) },
      disabled: !s.data.length,
    },
  ],
  describe: (s) =>
    bi(
      `A box plot of ${s.data.length} values.`,
      `Un diagrama de caja de ${s.data.length} valores.`,
    ),
  verify(s) {
    if (s.data.length < 4) return [];
    const q = quartiles(s.data);
    const problems = [];
    if (!(q.min.lte(q.q1) && q.q1.lte(q.median) && q.median.lte(q.q3) && q.q3.lte(q.max)))
      problems.push("five-number summary is out of order");
    const sortedData = sorted(s.data);
    const atOrBelow = (x) => sortedData.filter((v) => v.lte(x)).length;
    if (atOrBelow(q.median) < s.data.length / 2)
      problems.push("median has fewer than half the data at or below it");
    if (atOrBelow(q.q1) < Math.floor(s.data.length / 4))
      problems.push("Q1 has fewer than a quarter of the data at or below it");
    const m = /class="median" data-median="([^"]+)"/.exec(this.render(s, { min: 0, max: 20 }));
    if (!m || !Rational.of(m[1]).eq(q.median))
      problems.push("the median line is not at the median");
    return problems;
  },
  generate: (rng) => ({
    min: 0,
    max: 30,
    data: Array.from({ length: rng.int(9, 15) }, () => rng.int(2, 28)),
  }),
});

// ---------------------------------------------------------------- scatter plot with exact least-squares line
const fit = (pts) => {
  const n = R(pts.length);
  const sx = pts.reduce((a, [x]) => a.add(x), R(0));
  const sy = pts.reduce((a, [, y]) => a.add(y), R(0));
  const sxy = pts.reduce((a, [x, y]) => a.add(R(x).mul(y)), R(0));
  const sxx = pts.reduce((a, [x]) => a.add(R(x).mul(x)), R(0));
  const den = n.mul(sxx).sub(sx.mul(sx));
  if (den.isZero()) return null;
  const m = n.mul(sxy).sub(sx.mul(sy)).div(den);
  const b = sy.sub(m.mul(sx)).div(n);
  return { m, b };
};
registerModel({
  id: "scatterPlot",
  title: bi("Scatter plot and line of best fit", "Diagrama de dispersión y recta de mejor ajuste"),
  grades: [8],
  domain: "data",
  init: (p) => ({ points: (p.points || []).map(([x, y]) => [x, y]), showLine: false }),
  reduce(s, a) {
    if (a.type === "add") {
      const x = intIn(a.x, 0, 10, bi("x", "x"));
      const y = intIn(a.y, 0, 10, bi("y", "y"));
      if (s.points.length >= 20)
        throw new ModelError(bi("That is the most points that fit.", "Es el máximo de puntos."));
      return { ...s, points: [...s.points, [x, y]] };
    }
    if (a.type === "removeLast") {
      if (!s.points.length)
        throw new ModelError(bi("There are no points to remove.", "No hay puntos que quitar."));
      return { ...s, points: s.points.slice(0, -1) };
    }
    if (a.type === "toggleLine") return { ...s, showLine: !s.showLine };
    throw new ModelError("Unknown move");
  },
  derive(s) {
    const f = s.points.length >= 3 ? fit(s.points) : null;
    if (!f)
      return {
        facts: { n: s.points.length },
        equation: "",
        verbal: bi(
          "Plot at least 3 points with different x values to fit a line.",
          "Marca al menos 3 puntos con valores de x distintos para ajustar una recta.",
        ),
        numeric: { headers: ["x", "y"], rows: s.points.map(([x, y]) => [x, y]) },
      };
    const trend = f.m.sign() > 0 ? "positive" : f.m.sign() < 0 ? "negative" : "no";
    return {
      facts: { ...f, trend, n: s.points.length },
      equation: `y ≈ ${fmt(f.m)}x ${f.b.sign() < 0 ? "−" : "+"} ${fmt(f.b.abs())}`,
      verbal: bi(
        `The points show a ${trend} association. The line of best fit rises ${fmt(f.m)} for each 1 across. An association is not proof that one thing causes the other.`,
        `Los puntos muestran una asociación ${{ positive: "positiva", negative: "negativa", no: "nula" }[trend]}. La recta de mejor ajuste cambia ${fmt(f.m)} por cada 1 a la derecha. Una asociación no prueba que una cosa cause la otra.`,
      ),
      numeric: {
        headers: ["x", "y", "line", "residual"],
        rows: s.points.map(([x, y]) => [
          x,
          y,
          fmt(f.m.mul(x).add(f.b)),
          fmt(R(y).sub(f.m.mul(x).add(f.b))),
        ]),
      },
    };
  },
  render(s) {
    const X = (v) => 40 + v * 40;
    const Y = (v) => 240 - v * 22;
    let inner =
      line(40, 240, 440, 240, `stroke="${INK}" stroke-width="2.5"`) +
      line(40, 20, 40, 240, `stroke="${INK}" stroke-width="2.5"`);
    for (let v = 0; v <= 10; v += 2)
      inner +=
        text(X(v), 258, v, `text-anchor="middle" font-size="12" fill="${INK}"`) +
        text(30, Y(v) + 4, v, `text-anchor="end" font-size="12" fill="${INK}"`);
    for (const [x, y] of s.points)
      inner += circle(
        X(x),
        Y(y),
        6,
        `class="point" data-x="${x}" data-y="${y}" fill="${AMBER}" stroke="${INK}" stroke-width="2"`,
      );
    const f = s.points.length >= 3 ? fit(s.points) : null;
    if (f && s.showLine) {
      const ys = [0, 10].map((x) => f.m.mul(x).add(f.b).toNumber());
      inner += line(
        X(0),
        Y(ys[0]),
        X(10),
        Y(ys[1]),
        `class="fit" stroke="${BLUE}" stroke-width="3"`,
      );
    }
    return svg(470, 272, inner, `Scatter plot with ${s.points.length} points`);
  },
  controls: (s) => [
    {
      id: "line",
      label: bi(
        s.showLine ? "Hide the line of best fit" : "Show the line of best fit",
        s.showLine ? "Ocultar la recta de mejor ajuste" : "Mostrar la recta de mejor ajuste",
      ),
      action: { type: "toggleLine" },
    },
    {
      id: "undo",
      label: bi("Remove the last point", "Quitar el último punto"),
      action: { type: "removeLast" },
      disabled: !s.points.length,
    },
  ],
  describe: (s) =>
    bi(
      `A scatter plot with ${s.points.length} points.`,
      `Un diagrama de dispersión con ${s.points.length} puntos.`,
    ),
  verify(s) {
    const problems = [];
    const drawn = (this.render(s).match(/class="point"/g) || []).length;
    if (drawn !== s.points.length) problems.push("drew the wrong number of points");
    const f = s.points.length >= 3 ? fit(s.points) : null;
    if (f) {
      // Least squares has residuals that sum to exactly zero, and they are uncorrelated with x.
      const residuals = s.points.map(([x, y]) => R(y).sub(f.m.mul(x).add(f.b)));
      if (!residuals.reduce((a, r) => a.add(r), R(0)).isZero())
        problems.push("residuals do not sum to zero");
      if (!residuals.reduce((a, r, i) => a.add(r.mul(s.points[i][0])), R(0)).isZero())
        problems.push("residuals are correlated with x");
    }
    return problems;
  },
  generate(rng) {
    const m = rng.pick([1, 2, -1, 0.5]);
    const pts = [];
    for (let x = 1; x <= 8; x += 1)
      pts.push([
        x,
        Math.max(0, Math.min(10, Math.round(m * x + (m < 0 ? 9 : 1) + rng.int(-1, 1)))),
      ]);
    return { points: pts };
  },
});

// Accessible SVG charts. Each chart has role="img", a title and a written summary, and the views always
// pair it with a data table. Forecast marks and uncertainty bands are drawn ONLY when the caller passes
// validated numbers.
import { SCALE_RESET_YEAR } from "../../access-practice-lab/src/lang/dna.js";
import { s } from "./dom.js";

const W = 640;
const H = 300;
const M = { l: 44, r: 16, t: 16, b: 46 };
const yOf = (lv) => M.t + ((6 - lv) / 5) * (H - M.t - M.b);

function frame(title, summary) {
  return s(
    "svg",
    {
      viewBox: `0 0 ${W} ${H}`,
      role: "img",
      class: "pi-chart",
      "aria-label": `${title}. ${summary}`,
      preserveAspectRatio: "xMidYMid meet",
    },
    s("title", {}, title),
    s("desc", {}, summary),
  );
}

function levelAxis(svg) {
  for (let lv = 1; lv <= 6; lv++) {
    svg.append(s("line", { x1: M.l, x2: W - M.r, y1: yOf(lv), y2: yOf(lv), class: "pi-grid" }));
    svg.append(
      s("text", { x: M.l - 8, y: yOf(lv) + 4, class: "pi-axis", "text-anchor": "end" }, `${lv}.0`),
    );
  }
}

/**
 * Longitudinal chart for one series. `years` are the x categories (oldest first). `points` [{year, level}];
 * `forecast` { year, expected, lo, hi } only when validated; `target` a level; `markers` [{year, count}].
 */
export function growthChart({
  title,
  years,
  points,
  forecast = null,
  target = null,
  markers = [],
  color = "#0b6e69",
}) {
  const n = Math.max(years.length, 1);
  const step = (W - M.l - M.r) / n;
  const xOf = (y) => M.l + step * (years.indexOf(y) + 0.5);
  const summary = [
    points.length
      ? `Reported levels: ${points.map((p) => `${p.year} ${p.level.toFixed(1)}`).join(", ")}.`
      : "No reported levels.",
    forecast
      ? `Validated forecast for ${forecast.year}: ${forecast.expected.toFixed(1)}, 80% interval ${forecast.lo.toFixed(1)} to ${forecast.hi.toFixed(1)}.`
      : "No forecast is drawn.",
    target != null ? `Teacher target ${target.toFixed(1)}.` : "",
  ].join(" ");
  const svg = frame(title, summary);
  levelAxis(svg);
  years.forEach((y) =>
    svg.append(
      s("text", { x: xOf(y), y: H - M.b + 18, class: "pi-axis", "text-anchor": "middle" }, y),
    ),
  );
  const ri = years.indexOf(SCALE_RESET_YEAR);
  if (ri > 0) {
    const x = M.l + step * ri;
    svg.append(s("line", { x1: x, x2: x, y1: M.t, y2: H - M.b, class: "pi-reset" }));
    svg.append(
      s("text", { x: x + 4, y: M.t + 12, class: "pi-axis pi-reset-label" }, "Scale reset"),
    );
  }
  if (target != null) {
    svg.append(
      s("line", { x1: M.l, x2: W - M.r, y1: yOf(target), y2: yOf(target), class: "pi-target" }),
    );
    svg.append(
      s(
        "text",
        { x: W - M.r - 4, y: yOf(target) - 6, class: "pi-axis", "text-anchor": "end" },
        `Target ${target.toFixed(1)}`,
      ),
    );
  }
  if (points.length) {
    const first = points[0];
    svg.append(
      s("line", {
        x1: M.l,
        x2: W - M.r,
        y1: yOf(first.level),
        y2: yOf(first.level),
        class: "pi-baseline",
      }),
    );
  }
  if (forecast) {
    const x = xOf(forecast.year);
    svg.append(
      s("rect", {
        x: x - 14,
        width: 28,
        y: yOf(forecast.hi),
        height: Math.max(2, yOf(forecast.lo) - yOf(forecast.hi)),
        class: "pi-band",
      }),
    );
    const last = points.at(-1);
    if (last)
      svg.append(
        s("line", {
          x1: xOf(last.year),
          y1: yOf(last.level),
          x2: x,
          y2: yOf(forecast.expected),
          class: "pi-forecast-line",
        }),
      );
    svg.append(s("circle", { cx: x, cy: yOf(forecast.expected), r: 6, class: "pi-forecast-dot" }));
  }
  // A new subpath starts at the scale reset and wherever the cut-score version changes: never one line across eras.
  const path = points
    .map((p, i) => {
      const prev = points[i - 1];
      const brk = !prev || (prev.year < SCALE_RESET_YEAR) !== (p.year < SCALE_RESET_YEAR) || (prev.lv && p.lv && prev.lv !== p.lv);
      return `${brk ? "M" : "L"}${xOf(p.year)},${yOf(p.level)}`;
    })
    .join(" ");
  if (points.length > 1)
    svg.append(s("path", { d: path, fill: "none", stroke: color, "stroke-width": 3 }));
  points.forEach((p) =>
    svg.append(s("circle", { cx: xOf(p.year), cy: yOf(p.level), r: 5, fill: color })),
  );
  for (const m of markers) {
    if (!years.includes(m.year)) continue;
    const x = xOf(m.year);
    svg.append(
      s("rect", {
        x: x - 6,
        y: H - M.b - 14,
        width: 12,
        height: 12,
        class: "pi-marker",
        transform: `rotate(45 ${x} ${H - M.b - 8})`,
      }),
    );
    svg.append(
      s("text", { x, y: H - 8, class: "pi-axis", "text-anchor": "middle" }, `${m.count} practice`),
    );
  }
  return svg;
}

/** Horizontal bars: [{ label, value, note }], value domain [0, max]. */
export function barChart({ title, bars, max = null, format = (v) => String(v) }) {
  const top = max ?? Math.max(1, ...bars.map((b) => b.value));
  const rowH = 34;
  const h = M.t + bars.length * rowH + 10;
  const left = 170;
  const svg = s(
    "svg",
    {
      viewBox: `0 0 ${W} ${h}`,
      role: "img",
      class: "pi-chart",
      "aria-label": `${title}. ${bars.map((b) => `${b.label}: ${format(b.value)}`).join("; ")}.`,
    },
    s("title", {}, title),
  );
  bars.forEach((b, i) => {
    const y = M.t + i * rowH;
    const w = Math.max(0, ((W - left - 70) * b.value) / top);
    svg.append(
      s("text", { x: left - 8, y: y + 19, class: "pi-axis", "text-anchor": "end" }, b.label),
    );
    svg.append(
      s("rect", {
        x: left,
        y: y + 4,
        width: w,
        height: 22,
        rx: 4,
        class: b.kind === "scenario" ? "pi-bar-alt" : "pi-bar",
      }),
    );
    svg.append(s("text", { x: left + w + 6, y: y + 19, class: "pi-axis" }, format(b.value)));
  });
  return svg;
}

/** Calibration: predicted vs observed proportions per bin, with the diagonal. rows [{predicted, observed, n}] */
export function calibrationChart({ title, rows }) {
  const size = 300;
  const p = 40;
  const sc = (v) => p + v * (size - 2 * p);
  const svg = s(
    "svg",
    {
      viewBox: `0 0 ${size} ${size}`,
      role: "img",
      class: "pi-chart pi-chart-sq",
      "aria-label": `${title}. ${rows.map((r) => `predicted ${Math.round(r.predicted * 100)}%, observed ${Math.round(r.observed * 100)}% (n ${r.n})`).join("; ")}.`,
    },
    s("title", {}, title),
  );
  svg.append(
    s("line", { x1: sc(0), y1: size - sc(0), x2: sc(1), y2: size - sc(1), class: "pi-grid" }),
  );
  svg.append(
    s(
      "text",
      { x: size / 2, y: size - 8, class: "pi-axis", "text-anchor": "middle" },
      "Predicted probability",
    ),
  );
  svg.append(
    s(
      "text",
      {
        x: 12,
        y: size / 2,
        class: "pi-axis",
        "text-anchor": "middle",
        transform: `rotate(-90 12 ${size / 2})`,
      },
      "Observed share",
    ),
  );
  for (const r of rows)
    svg.append(
      s("circle", {
        cx: sc(r.predicted),
        cy: size - sc(r.observed),
        r: Math.min(10, 3 + Math.sqrt(r.n) / 4),
        class: "pi-cal-dot",
      }),
    );
  return svg;
}

/**
 * Horizontal profile chart for one record. `rows` [{ label, value, status }]; `measure` "level" (1-6 axis)
 * or "scale" (axis from the values). Values are printed on each bar, so nothing relies on colour.
 */
export function profileChart({ title, rows, measure = "level", colors = {} }) {
  const shown = rows.filter((r) => r.value != null);
  const lo = measure === "level" ? 1 : Math.floor((Math.min(...shown.map((r) => r.value), 600) - 40) / 50) * 50;
  const hi = measure === "level" ? 6 : Math.ceil((Math.max(...shown.map((r) => r.value), 100) + 20) / 50) * 50;
  const PW = 640;
  const rowH = 40;
  const PH = 30 + rows.length * rowH;
  const L = 120;
  const R = 70;
  const xOf = (v) => L + ((v - lo) / (hi - lo || 1)) * (PW - L - R);
  const summary = rows
    .map((r) => `${r.label} ${r.value == null ? (r.status === "not-assessed" ? "not assessed" : "missing") : measure === "level" ? r.value.toFixed(1) : r.value}`)
    .join(", ");
  const svg = s(
    "svg",
    { viewBox: `0 0 ${PW} ${PH}`, role: "img", class: "pi-chart pi-profile", "aria-label": `${title}. ${summary}.`, preserveAspectRatio: "xMidYMid meet" },
    s("title", {}, title),
    s("desc", {}, summary),
  );
  const ticks = measure === "level" ? [1, 2, 3, 4, 5, 6] : Array.from({ length: (hi - lo) / 50 + 1 }, (_, i) => lo + i * 50);
  for (const t of ticks) {
    svg.append(s("line", { x1: xOf(t), x2: xOf(t), y1: 8, y2: PH - 18, class: "pi-grid" }));
    svg.append(s("text", { x: xOf(t), y: PH - 4, class: "pi-axis", "text-anchor": "middle" }, measure === "level" ? `${t}.0` : String(t)));
  }
  rows.forEach((r, i) => {
    const y = 12 + i * rowH;
    svg.append(s("text", { x: L - 8, y: y + 18, class: "pi-axis pi-axis-strong", "text-anchor": "end" }, r.label));
    if (r.value == null) {
      svg.append(s("text", { x: L + 4, y: y + 18, class: "pi-axis" }, r.status === "not-assessed" ? "Not assessed" : "Missing"));
      return;
    }
    const pattern = r.status === "calculated" ? "4 3" : null;
    svg.append(
      s("rect", {
        x: L,
        y: y + 4,
        width: Math.max(2, xOf(r.value) - L),
        height: 22,
        rx: 4,
        style: `fill:${r.status === "calculated" ? "none" : colors[r.key] || "#0b6e69"};stroke:${colors[r.key] || "#0b6e69"}`,
        "stroke-width": 2,
        "stroke-dasharray": pattern,
      }),
    );
    if (r.sem != null && measure === "scale")
      svg.append(s("line", { x1: xOf(r.value - 1.96 * r.sem), x2: xOf(r.value + 1.96 * r.sem), y1: y + 15, y2: y + 15, class: "pi-err" }));
    svg.append(s("text", { x: xOf(r.value) + 6, y: y + 20, class: "pi-axis pi-axis-strong" }, measure === "level" ? r.value.toFixed(1) : `${r.value}${r.status === "calculated" ? " (calc.)" : ""}`));
  });
  return svg;
}

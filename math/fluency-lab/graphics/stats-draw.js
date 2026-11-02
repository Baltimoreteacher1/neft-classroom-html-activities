// Drawing for the stats display: dot plot, histogram, bar graph and box plot, plus the markers for the statistics
// the learner turns on. Pure: state and width in, SVG parts and column hit areas out.
import { s, t } from "./b-core.js";
import { show, toNumber } from "./b-rational.js";
import * as M from "./stats-math.js";
import { MINUS, val } from "./stats-text.js";

const L = 40;
const R = 16;
const TOP = 26;
const PLOT_H = 200;
const ROW = 34;
const text = (attrs, body) => s("text", { ...attrs, text: body });
const niceMax = (n) => [5, 10, 15, 20, 25, 30].find((m) => m >= n + 1) || 30;

export function layout(state, width) {
  const n = M.columnCount(state);
  const colW = (width - L - R) / n;
  const cnt = M.counts(state);
  const isBars = state.kind === "histogram" || state.kind === "bar";
  const yMax = niceMax(Math.max(0, ...cnt));
  const dot = Math.min(colW * 0.86, 24, (PLOT_H - 8) / Math.max(1, ...cnt));
  return {
    n,
    colW,
    cnt,
    isBars,
    yMax,
    unitH: PLOT_H / yMax,
    dot,
    baseline: TOP + PLOT_H,
    plotH: PLOT_H,
    L,
    top: TOP,
  };
}

const xOfValue = (state, lay, v) => {
  const w = toNumber(M.colWidth(state));
  const k = (toNumber(v) - toNumber(state.min)) / w;
  return L + (state.kind === "histogram" ? k : k + 0.5) * lay.colW;
};

function axisLabels(parts, state, lay) {
  const y = lay.baseline + 18;
  if (state.kind === "bar") {
    state.cats.forEach((c, i) => {
      const words = c.label.split(" ");
      const lines =
        words.length > 1 && lay.colW < 80
          ? [
              words.slice(0, Math.ceil(words.length / 2)).join(" "),
              words.slice(Math.ceil(words.length / 2)).join(" "),
            ]
          : [c.label];
      lines.forEach((line, k) =>
        parts.push(
          text(
            {
              class: "gb-ticklabel",
              x: L + (i + 0.5) * lay.colW,
              y: y + k * 14,
              "text-anchor": "middle",
            },
            line,
          ),
        ),
      );
    });
    return;
  }
  const every = Math.max(1, Math.ceil(32 / lay.colW));
  const count = state.kind === "histogram" ? lay.n + 1 : lay.n;
  for (let i = 0; i < count; i += every) {
    const v = M.columnValue(state, i);
    const x = state.kind === "histogram" ? L + i * lay.colW : L + (i + 0.5) * lay.colW;
    parts.push(
      s("line", { class: "gb-tick", x1: x, x2: x, y1: lay.baseline, y2: lay.baseline + 6 }),
    );
    parts.push(
      text({ class: "gb-ticklabel", x, y, "text-anchor": "middle" }, show(v).replace("-", MINUS)),
    );
  }
}

function drawBars(parts, state, lay) {
  for (let g = 0; g <= lay.yMax; g += lay.yMax / 5) {
    const y = lay.baseline - g * lay.unitH;
    parts.push(s("line", { class: "gb-gridline", x1: L, x2: L + lay.n * lay.colW, y1: y, y2: y }));
    parts.push(
      text({ class: "gb-ticklabel", x: L - 8, y: y + 4, "text-anchor": "end" }, String(g)),
    );
  }
  const gap = state.kind === "bar" ? 12 : 2;
  lay.cnt.forEach((c, i) => {
    const x = L + i * lay.colW + gap / 2;
    const h = c * lay.unitH;
    parts.push(
      s("rect", {
        class: `gb-bar${i === state.selected ? " is-selected" : ""}`,
        x,
        y: lay.baseline - h,
        width: lay.colW - gap,
        height: h,
      }),
    );
    if (c > 0)
      parts.push(
        text(
          {
            class: "gb-ptcoord",
            x: x + (lay.colW - gap) / 2,
            y: lay.baseline - h - 6,
            "text-anchor": "middle",
          },
          String(c),
        ),
      );
  });
  parts.push(
    s("line", {
      class: "gb-axis",
      x1: L,
      x2: L + lay.n * lay.colW,
      y1: lay.baseline,
      y2: lay.baseline,
    }),
  );
}

function drawDots(parts, state, lay) {
  parts.push(
    s("line", {
      class: "gb-axis",
      x1: L,
      x2: L + lay.n * lay.colW,
      y1: lay.baseline,
      y2: lay.baseline,
    }),
  );
  lay.cnt.forEach((c, i) => {
    const cx = L + (i + 0.5) * lay.colW;
    for (let j = 0; j < c; j += 1)
      parts.push(
        s("circle", {
          class: `gb-dot gb-dot--data${i === state.selected ? " is-selected" : ""}`,
          cx,
          cy: lay.baseline - (j + 0.5) * lay.dot - 1,
          r: Math.max(2.5, lay.dot / 2 - 1.5),
        }),
      );
  });
}

function marker(parts, x, y, kind, label) {
  if (kind === "tri")
    parts.push(
      s("polygon", { class: "gb-mean", points: `${x},${y} ${x - 8},${y + 14} ${x + 8},${y + 14}` }),
    );
  else
    parts.push(
      s("rect", {
        class: "gb-median",
        x: x - 6,
        y: y + 1,
        width: 12,
        height: 12,
        transform: `rotate(45 ${x} ${y + 7})`,
      }),
    );
  parts.push(text({ class: "gb-edgelabel", x: x + 14, y: y + 12 }, label));
}

// Statistic markers under the axis. Returns the height used.
function drawMarkers(parts, state, lay, sm, names, showStats) {
  let y = lay.baseline + (state.kind === "bar" ? 0 : 38);
  if (state.kind === "bar" || !sm.n) return y;
  const x = (v) => xOfValue(state, lay, v);
  if (showStats && names.includes("mode") && sm.modes.length) {
    for (const m of sm.modes) {
      const c = M.columnOf(state, m);
      parts.push(
        s("rect", {
          class: "gb-modering",
          x: L + c * lay.colW + 1,
          y: lay.baseline - lay.cnt[c] * (lay.isBars ? lay.unitH : lay.dot) - 4,
          width: lay.colW - 2,
          height: lay.cnt[c] * (lay.isBars ? lay.unitH : lay.dot) + 6,
          rx: 4,
        }),
      );
    }
  }
  if (state.kind === "box") {
    const q1 = sm.q1 ?? sm.min;
    const q3 = sm.q3 ?? sm.max;
    const by = y + 6;
    parts.push(
      s("line", { class: "gb-whisker", x1: x(sm.min), x2: x(q1), y1: by + 14, y2: by + 14 }),
    );
    parts.push(
      s("line", { class: "gb-whisker", x1: x(q3), x2: x(sm.max), y1: by + 14, y2: by + 14 }),
    );
    for (const v of [sm.min, sm.max])
      parts.push(s("line", { class: "gb-whisker", x1: x(v), x2: x(v), y1: by + 4, y2: by + 24 }));
    parts.push(
      s("rect", {
        class: "gb-box",
        x: x(q1),
        y: by,
        width: Math.max(1, x(q3) - x(q1)),
        height: 28,
        rx: 3,
      }),
    );
    parts.push(
      s("line", { class: "gb-boxmedian", x1: x(sm.median), x2: x(sm.median), y1: by, y2: by + 28 }),
    );
    const rowLabels = (items, rowY) => {
      let lastX = -99;
      for (const [v, tag] of items) {
        const px = x(v);
        if (px - lastX < 30) continue;
        lastX = px;
        parts.push(text({ class: "gb-ticklabel", x: px, y: rowY, "text-anchor": "middle" }, tag ? `${tag} ${val(v)}` : val(v)));
      }
    };
    rowLabels([[sm.min, ""], [sm.max, ""]], by + 46);
    rowLabels([[q1, "Q1"], [sm.median, t("med")], [q3, "Q3"]], by + 62);
    y = by + 72;
  }
  if (showStats && names.includes("mean")) {
    marker(parts, x(sm.mean), y, "tri", t("mean {v}", { v: val(sm.mean) }));
    y += ROW - 8;
  }
  if (showStats && names.includes("median") && state.kind !== "box") {
    marker(parts, x(sm.median), y, "dia", t("median {v}", { v: val(sm.median) }));
    y += ROW - 8;
  }
  const bracket = (a, b, cls, label) => {
    parts.push(s("line", { class: cls, x1: x(a), x2: x(b), y1: y + 8, y2: y + 8 }));
    parts.push(s("line", { class: cls, x1: x(a), x2: x(a), y1: y + 2, y2: y + 14 }));
    parts.push(s("line", { class: cls, x1: x(b), x2: x(b), y1: y + 2, y2: y + 14 }));
    parts.push(
      text(
        { class: "gb-edgelabel", x: (x(a) + x(b)) / 2, y: y + 28, "text-anchor": "middle" },
        label,
      ),
    );
    y += ROW + 6;
  };
  if (showStats && names.includes("range"))
    bracket(sm.min, sm.max, "gb-bracket", t("range {v}", { v: val(sm.range) }));
  if (showStats && names.includes("iqr") && sm.iqr)
    bracket(sm.q1, sm.q3, "gb-bracket gb-bracket--iqr", t("IQR {v}", { v: val(sm.iqr) }));
  return y;
}

export function draw(state, width, sm, { showStats }) {
  const lay = layout(state, width);
  const parts = [];
  if (!lay.isBars) {
    const hx = L + state.selected * lay.colW;
    parts.push(
      s("rect", {
        class: "gb-colsel",
        x: hx,
        y: TOP - 6,
        width: lay.colW,
        height: PLOT_H + 6,
        rx: 4,
      }),
    );
  }
  if (lay.isBars) drawBars(parts, state, lay);
  else drawDots(parts, state, lay);
  axisLabels(parts, state, lay);
  const end = drawMarkers(parts, state, lay, sm, state.stats, showStats);
  lay.height = Math.round(Math.max(end, lay.baseline + (state.kind === "bar" ? 36 : 44)) + 12);
  const handles = Array.from({ length: lay.n }, (_, c) => ({
    id: `c${c}`,
    index: c,
    x: L + c * lay.colW,
    y: TOP - 6,
    w: lay.colW,
    h: PLOT_H + 6,
    count: lay.cnt[c],
  }));
  return { parts, handles, lay };
}

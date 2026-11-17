// Visual kit for the redesigned studio: overall-level gauge, sparkline, class heatmap, stacked level
// distribution, weekly activity columns and the student level ladder. Every chart is an SVG with role="img",
// a title and a written summary; numbers are printed on the marks, so nothing depends on colour alone.
import { s } from "./dom.js";

export const DOMAIN_COLORS = Object.freeze({
  Listening: "#0f766e",
  Speaking: "#c2410c",
  Reading: "#1d4ed8",
  Writing: "#15803d",
  Overall: "#1e293b",
});
/** Six level bands, light to dark (blue-teal, no violet); text colour chosen for contrast. */
export const BAND_FILL = ["#e0f2f1", "#b2dfdb", "#80cbc4", "#26a69a", "#00897b", "#00695c"];
export const BAND_INK = ["#0f3d3a", "#0f3d3a", "#0f3d3a", "#ffffff", "#ffffff", "#ffffff"];
const band = (lv) => Math.min(5, Math.max(0, Math.floor(lv) - 1));

function svg(w, hgt, title, summary, cls) {
  return s(
    "svg",
    {
      viewBox: `0 0 ${w} ${hgt}`,
      role: "img",
      class: `pi-chart ${cls || ""}`,
      "aria-label": `${title}. ${summary}`,
      preserveAspectRatio: "xMidYMid meet",
    },
    s("title", {}, title),
    s("desc", {}, summary),
  );
}

/** Semicircle gauge for a level from 1.0 to 6.0. */
export function gauge({ level, label = "Overall", name = "" }) {
  const W = 220;
  const H = 130;
  const cx = 110;
  const cy = 112;
  const r = 86;
  const pt = (t) => [cx - r * Math.cos(Math.PI * t), cy - r * Math.sin(Math.PI * t)];
  const arc = (t0, t1) => {
    const [x0, y0] = pt(t0);
    const [x1, y1] = pt(t1);
    return `M${x0},${y0} A${r},${r} 0 0 1 ${x1},${y1}`;
  };
  const el = svg(
    W,
    H,
    `${label} level`,
    level == null ? "Not reported." : `${level.toFixed(1)} ${name} on a 1 to 6 scale.`,
    "pi-gauge",
  );
  el.append(s("path", { d: arc(0, 1), class: "pi-gauge-track" }));
  if (level != null)
    el.append(s("path", { d: arc(0, Math.max(0.01, (level - 1) / 5)), class: "pi-gauge-fill" }));
  el.append(
    s(
      "text",
      { x: cx, y: cy - 22, "text-anchor": "middle", class: "pi-gauge-num" },
      level == null ? "—" : level.toFixed(1),
    ),
  );
  el.append(
    s(
      "text",
      { x: cx, y: cy - 2, "text-anchor": "middle", class: "pi-gauge-name" },
      level == null ? "Not reported" : name,
    ),
  );
  el.append(s("text", { x: cx - r, y: cy + 16, "text-anchor": "middle", class: "pi-axis" }, "1"));
  el.append(s("text", { x: cx + r, y: cy + 16, "text-anchor": "middle", class: "pi-axis" }, "6"));
  return el;
}

/** Tiny trend line over comparable values; breaks where `points[i].gap` is true. */
export function sparkline({ points, color = "#1e293b", label = "Trend" }) {
  const W = 120;
  const H = 36;
  const vals = points.map((p) => p.value).filter((v) => v != null);
  const el = svg(
    W,
    H,
    label,
    points.map((p) => `${p.label} ${p.value == null ? "none" : p.value.toFixed(1)}`).join(", "),
    "pi-spark",
  );
  if (vals.length < 2) return el;
  const lo = Math.min(...vals) - 0.3;
  const hi = Math.max(...vals) + 0.3;
  const x = (i) => 6 + (i / Math.max(1, points.length - 1)) * (W - 12);
  const y = (v) => H - 6 - ((v - lo) / (hi - lo || 1)) * (H - 12);
  let d = "";
  points.forEach((p, i) => {
    if (p.value == null) return;
    d += `${!d || p.gap ? "M" : "L"}${x(i)},${y(p.value)} `;
  });
  el.append(
    s("path", {
      d,
      fill: "none",
      style: `stroke:${color}`,
      "stroke-width": 2.5,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    }),
  );
  const last = points.findLastIndex((p) => p.value != null);
  el.append(
    s("circle", { cx: x(last), cy: y(points[last].value), r: 3.5, style: `fill:${color}` }),
  );
  return el;
}

/** Students x scores heatmap of levels. rows [{ name, cells: [{ key, level }] }], keys [..]. */
export function heatmap({ title, keys, rows }) {
  const cw = 78;
  const rh = 34;
  const left = 150;
  const W = left + keys.length * cw + 8;
  const H = 34 + rows.length * rh;
  const el = svg(
    W,
    H,
    title,
    `${rows.length} students by ${keys.join(", ")}. Each cell shows the reported level.`,
    "pi-heat",
  );
  keys.forEach((k, j) =>
    el.append(
      s(
        "text",
        {
          x: left + j * cw + cw / 2,
          y: 20,
          "text-anchor": "middle",
          class: "pi-axis pi-axis-strong",
        },
        k,
      ),
    ),
  );
  rows.forEach((r, i) => {
    const y = 30 + i * rh;
    el.append(
      s(
        "text",
        { x: left - 10, y: y + rh / 2 + 4, "text-anchor": "end", class: "pi-axis" },
        r.name.length > 20 ? `${r.name.slice(0, 19)}…` : r.name,
      ),
    );
    r.cells.forEach((c, j) => {
      const x = left + j * cw;
      if (c.level == null) {
        el.append(
          s("rect", {
            x: x + 2,
            y: y + 2,
            width: cw - 4,
            height: rh - 4,
            rx: 6,
            class: "pi-heat-empty",
          }),
        );
        el.append(
          s(
            "text",
            { x: x + cw / 2, y: y + rh / 2 + 4, "text-anchor": "middle", class: "pi-axis" },
            "—",
          ),
        );
        return;
      }
      const b = band(c.level);
      el.append(
        s("rect", {
          x: x + 2,
          y: y + 2,
          width: cw - 4,
          height: rh - 4,
          rx: 6,
          style: `fill:${BAND_FILL[b]}`,
        }),
      );
      el.append(
        s(
          "text",
          {
            x: x + cw / 2,
            y: y + rh / 2 + 5,
            "text-anchor": "middle",
            class: "pi-heat-num",
            style: `fill:${BAND_INK[b]}`,
          },
          c.level.toFixed(1),
        ),
      );
    });
  });
  return el;
}

/** One horizontal stacked bar per key: counts of students in each level band (1-6). */
export function stackedLevels({ title, rows }) {
  const left = 100;
  const W = 640;
  const rh = 40;
  const H = 40 + rows.length * rh;
  const el = svg(
    W,
    H,
    title,
    rows
      .map((r) => `${r.key}: ${r.counts.map((c, i) => `level ${i + 1} ${c}`).join(", ")}`)
      .join("; "),
    "pi-stack-chart",
  );
  rows.forEach((r, i) => {
    const y = 8 + i * rh;
    const total = r.counts.reduce((a, b) => a + b, 0) || 1;
    el.append(
      s(
        "text",
        { x: left - 10, y: y + 20, "text-anchor": "end", class: "pi-axis pi-axis-strong" },
        r.key,
      ),
    );
    let x = left;
    r.counts.forEach((c, b) => {
      if (!c) return;
      const w = ((W - left - 8) * c) / total;
      el.append(
        s("rect", {
          x,
          y: y + 3,
          width: Math.max(1, w - 2),
          height: 26,
          rx: 5,
          style: `fill:${BAND_FILL[b]}`,
        }),
      );
      if (w > 22)
        el.append(
          s(
            "text",
            {
              x: x + w / 2 - 1,
              y: y + 21,
              "text-anchor": "middle",
              class: "pi-heat-num",
              style: `fill:${BAND_INK[b]}`,
            },
            String(c),
          ),
        );
      x += w;
    });
  });
  const ly = H - 12;
  ["1", "2", "3", "4", "5", "6"].forEach((l, b) => {
    const lx = left + b * 70;
    el.append(
      s("rect", {
        x: lx,
        y: ly - 10,
        width: 14,
        height: 14,
        rx: 3,
        style: `fill:${BAND_FILL[b]}`,
        class: "pi-legend-swatch",
      }),
    );
    el.append(s("text", { x: lx + 20, y: ly + 2, class: "pi-axis" }, `Level ${l}`));
  });
  return el;
}

/** Weekly columns stacked by domain. weeks [{ label, byDomain: { Listening: n … } }]. */
export function activityColumns({ title, weeks, domains }) {
  const W = 640;
  const H = 230;
  const left = 34;
  const bottom = 40;
  const max = Math.max(
    1,
    ...weeks.map((w) => domains.reduce((a, d) => a + (w.byDomain[d] || 0), 0)),
  );
  const cw = (W - left - 10) / Math.max(1, weeks.length);
  const yv = (v) => H - bottom - (v / max) * (H - bottom - 14);
  const el = svg(
    W,
    H,
    title,
    weeks
      .map((w) => `${w.label}: ${domains.reduce((a, d) => a + (w.byDomain[d] || 0), 0)}`)
      .join(", "),
    "pi-cols",
  );
  for (let t = 0; t <= max; t += Math.max(1, Math.ceil(max / 4))) {
    el.append(s("line", { x1: left, x2: W - 6, y1: yv(t), y2: yv(t), class: "pi-grid" }));
    el.append(
      s("text", { x: left - 6, y: yv(t) + 4, "text-anchor": "end", class: "pi-axis" }, String(t)),
    );
  }
  weeks.forEach((w, i) => {
    let acc = 0;
    const x = left + i * cw + cw * 0.18;
    for (const d of domains) {
      const v = w.byDomain[d] || 0;
      if (!v) continue;
      el.append(
        s("rect", {
          x,
          y: yv(acc + v),
          width: cw * 0.64,
          height: Math.max(1, yv(acc) - yv(acc + v) - 1),
          rx: 3,
          style: `fill:${DOMAIN_COLORS[d]}`,
        }),
      );
      acc += v;
    }
    if (weeks.length <= 8 || i % 2 === 0)
      el.append(
        s(
          "text",
          { x: x + cw * 0.32, y: H - bottom + 16, "text-anchor": "middle", class: "pi-axis" },
          w.label,
        ),
      );
  });
  domains.forEach((d, i) => {
    const lx = left + i * 110;
    el.append(
      s("rect", {
        x: lx,
        y: H - 14,
        width: 12,
        height: 12,
        rx: 3,
        style: `fill:${DOMAIN_COLORS[d]}`,
      }),
    );
    el.append(s("text", { x: lx + 18, y: H - 4, class: "pi-axis" }, d));
  });
  return el;
}

/** Horizontal paired bars: supported vs independent share per domain, with accuracy printed. */
export function independenceBars({ title, rows }) {
  const left = 100;
  const W = 640;
  const rh = 44;
  const H = 30 + rows.length * rh;
  const el = svg(
    W,
    H,
    title,
    rows.map((r) => `${r.domain}: ${Math.round(r.independentShare * 100)}% independent`).join("; "),
    "pi-indep",
  );
  rows.forEach((r, i) => {
    const y = 4 + i * rh;
    const full = W - left - 120;
    const wi = full * r.independentShare;
    el.append(
      s(
        "text",
        { x: left - 10, y: y + 22, "text-anchor": "end", class: "pi-axis pi-axis-strong" },
        r.domain,
      ),
    );
    el.append(
      s("rect", { x: left, y: y + 6, width: full, height: 24, rx: 6, class: "pi-indep-track" }),
    );
    el.append(
      s("rect", {
        x: left,
        y: y + 6,
        width: Math.max(2, wi),
        height: 24,
        rx: 6,
        style: `fill:${DOMAIN_COLORS[r.domain]}`,
      }),
    );
    el.append(
      s(
        "text",
        { x: left + full + 10, y: y + 22, class: "pi-axis pi-axis-strong" },
        `${Math.round(r.independentShare * 100)}% on own`,
      ),
    );
  });
  return el;
}

/** Range chart: one row per student, a bar from lo to hi on the 1-6 level scale, a dot at the current level. */
export function rangeRows({ title, rows }) {
  const left = 130;
  const W = 640;
  const rh = 30;
  const H = 40 + rows.length * rh;
  const x = (v) => left + ((v - 1) / 5) * (W - left - 20);
  const el = svg(W, H, title, rows.map((r) => `${r.name}: now ${r.now == null ? "none" : r.now.toFixed(1)}${r.lo != null ? `, likely ${r.lo.toFixed(1)} to ${r.hi.toFixed(1)}` : ", no estimate"}`).join("; "), "pi-ranges");
  for (let v = 1; v <= 6; v++) {
    el.append(s("line", { x1: x(v), x2: x(v), y1: 6, y2: H - 22, class: "pi-grid" }));
    el.append(s("text", { x: x(v), y: H - 6, "text-anchor": "middle", class: "pi-axis" }, `${v}.0`));
  }
  rows.forEach((r, i) => {
    const y = 14 + i * rh;
    el.append(s("text", { x: left - 10, y: y + 5, "text-anchor": "end", class: "pi-axis" }, r.name));
    if (r.lo != null) el.append(s("rect", { x: x(r.lo), y: y - 7, width: Math.max(4, x(r.hi) - x(r.lo)), height: 14, rx: 7, class: r.kind === "concordance" ? "pi-range-alt" : "pi-range-fill" }));
    if (r.now != null) el.append(s("circle", { cx: x(r.now), cy: y, r: 5, class: "pi-range-now" }));
  });
  return el;
}

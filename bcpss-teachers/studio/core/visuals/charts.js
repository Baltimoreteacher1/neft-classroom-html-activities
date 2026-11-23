// `timeline`, `bars`, `venn`, `map`: the remaining data kinds. All text is escaped through textEl; all numbers are
// validated. Every mark has a visible label or value, so colour is never the only signal.
import {
  VisualError,
  arrow,
  arrowHead,
  fitText,
  num,
  r1,
  seriesOf,
  textEl,
  textWidth,
} from "./pal.js";
import { iconAt } from "./shapes.js";

const fmt = (v) => String(Math.round(v * 1e6) / 1e6);

export function drawTimeline(spec, { c, w, h }) {
  if (!Array.isArray(spec.events) || !spec.events.length)
    throw new VisualError("timeline: events must be a non-empty array");
  const ats = spec.events.map((e) => num(e.at, "timeline: event at"));
  const [s0, s1] = Array.isArray(spec.span)
    ? [num(spec.span[0], "timeline: span start"), num(spec.span[1], "timeline: span end")]
    : [Math.min(...ats), Math.max(...ats)];
  if (!(s1 > s0)) throw new VisualError("timeline: span end must exceed start");
  const x0 = 46;
  const x1 = w - 46;
  const X = (v) => x0 + ((v - s0) / (s1 - s0)) * (x1 - x0);
  const ay = h / 2;
  const ink = c.paint("ink");
  const surface = c.paint("surface");
  let out = `<line x1="${r1(x0 - 14)}" y1="${r1(ay)}" x2="${r1(x1 + 14)}" y2="${r1(ay)}" stroke="${ink}" stroke-width="3.5" stroke-linecap="round"/>`;
  out += arrowHead(x1 + 18, ay, 0, 12, ink);
  const order = spec.events.map((e, i) => i).sort((a, b) => ats[a] - ats[b]);
  order.forEach((idx, rank) => {
    const e = spec.events[idx];
    const x = X(ats[idx]);
    if (ats[idx] < s0 - 1e-9 || ats[idx] > s1 + 1e-9)
      throw new VisualError(`timeline: event at ${ats[idx]} is outside the span`);
    const up = rank % 2 === 0;
    const reach = 50 + (Math.floor(rank / 2) % 2) * 34;
    const ty = up ? ay - reach : ay + reach;
    out += `<line x1="${r1(x)}" y1="${r1(ay)}" x2="${r1(x)}" y2="${r1(ty + (up ? 12 : -12))}" stroke="${ink}" stroke-width="2"/>`;
    out += `<circle cx="${r1(x)}" cy="${r1(ay)}" r="8" fill="${c.paint("teal")}" stroke="${ink}" stroke-width="2.5"/>`;
    const room = Math.min(x - 8, w - x - 8) * 2;
    const f = fitText(String(e.label), Math.min(150, Math.max(70, room)), {
      size: 15,
      min: 11,
      maxLines: 2,
      weight: 700,
    });
    const lines = e.detail
      ? [
          ...f.lines,
          ...fitText(String(e.detail), Math.min(150, Math.max(70, room)), {
            size: 13,
            min: 10,
            maxLines: 2,
          }).lines,
        ]
      : f.lines;
    const px = Math.min(w - 8, Math.max(8, x));
    const bold = f.lines.length;
    lines.forEach((ln, k) => {
      const dy = (k - (lines.length - 1) / 2) * 17;
      out += textEl(px, ty + dy, ln, {
        size: k < bold ? f.size : 13,
        fill: ink,
        weight: k < bold ? 700 : 400,
        halo: surface,
        anchor: x < 60 ? "start" : x > w - 60 ? "end" : "middle",
      });
    });
  });
  out += textEl(x0, ay + 22, fmt(s0), { size: 13, fill: ink, weight: 700 });
  out += textEl(x1, ay + 22, fmt(s1), { size: 13, fill: ink, weight: 700 });
  return out;
}

export function drawBars(spec, { c, w, h }) {
  if (!Array.isArray(spec.data) || !spec.data.length)
    throw new VisualError("bars: data must be a non-empty array");
  const vals = spec.data.map((d) => num(d.value, "bars: value"));
  if (vals.some((v) => v < 0)) throw new VisualError("bars: values must not be negative");
  const ink = c.paint("ink");
  const surface = c.paint("surface");
  const series = seriesOf(spec);
  const unit = spec.unit ? ` ${spec.unit}` : "";
  if (spec.icon) {
    const per = num(spec.per, "bars: per", 1);
    if (!(per > 0)) throw new VisualError("bars: per must be positive");
    const n = spec.data.length;
    const labelW = Math.min(
      150,
      Math.max(...spec.data.map((d) => textWidth(String(d.label), 15, 700))) + 12,
    );
    const rowH = Math.min(56, (h - 40) / n);
    const maxIcons = Math.max(...vals.map((v) => Math.ceil(v / per)));
    const size = Math.min(rowH - 8, (w - labelW - 90) / maxIcons);
    let out = "";
    spec.data.forEach((d, i) => {
      const y = 16 + i * rowH + rowH / 2;
      out += textEl(12, y, String(d.label), { size: 15, fill: ink, weight: 700, anchor: "start" });
      const full = Math.floor(vals[i] / per + 1e-9);
      for (let k = 0; k < full; k++)
        out += iconAt(spec.icon, labelW + 14 + k * (size + 3), y - size / 2, size);
      const rest = vals[i] / per - full;
      if (rest > 1e-9)
        out += iconAt(spec.icon, labelW + 14 + full * (size + 3), y - size / 4, size / 2);
      out += textEl(labelW + 20 + Math.ceil(vals[i] / per) * (size + 3), y, fmt(vals[i]) + unit, {
        size: 15,
        fill: ink,
        weight: 700,
        anchor: "start",
      });
    });
    const key = `Each picture = ${fmt(per)}${unit}`;
    return out + textEl(w - 12, h - 12, key, { size: 13, fill: ink, anchor: "end" });
  }
  const L = spec.yLabel ? 64 : 46;
  const B = (spec.xLabel ? 58 : 40) + 4;
  const T = 24;
  const R = 16;
  const top = Math.max(...vals) || 1;
  const step = (() => {
    const raw = top / 5;
    const p = 10 ** Math.floor(Math.log10(raw));
    return [1, 2, 5, 10].map((m) => m * p).find((s) => s >= raw);
  })();
  const ymax = Math.ceil(top / step) * step;
  const py0 = h - B;
  const Y = (v) => py0 - (v / ymax) * (py0 - T);
  let out = "";
  for (let v = 0; v <= ymax + 1e-9; v += step) {
    out += `<line x1="${L}" y1="${r1(Y(v))}" x2="${w - R}" y2="${r1(Y(v))}" stroke="${c.paint("line")}" stroke-width="1"/>`;
    out += textEl(L - 8, Y(v), fmt(v), { size: 13, fill: ink, anchor: "end" });
  }
  const slot = (w - R - L) / spec.data.length;
  const bw = Math.min(70, slot * 0.64);
  spec.data.forEach((d, i) => {
    const cx = L + slot * (i + 0.5);
    const col = d.color || series[0];
    out += `<rect x="${r1(cx - bw / 2)}" y="${r1(Y(vals[i]))}" width="${r1(bw)}" height="${r1(py0 - Y(vals[i]))}" fill="${c.paint(col)}" stroke="${ink}" stroke-width="2"/>`;
    out += textEl(cx, Y(vals[i]) - 11, fmt(vals[i]), {
      size: 14,
      fill: ink,
      weight: 700,
      halo: surface,
    });
    const f = fitText(String(d.label), slot - 6, { size: 14, min: 10, maxLines: 2, weight: 700 });
    out += textEl(cx, py0 + 18, f.lines, { size: f.size, fill: ink, weight: 700 });
  });
  out += `<path d="M${L} ${T - 6}V${py0}H${w - R}" fill="none" stroke="${ink}" stroke-width="2.5"/>`;
  if (spec.xLabel)
    out += textEl((L + w - R) / 2, h - 12, String(spec.xLabel), {
      size: 15,
      fill: ink,
      weight: 700,
    });
  if (spec.yLabel)
    out += `<g transform="translate(16 ${r1((py0 + T) / 2)}) rotate(-90)">${textEl(0, 0, String(spec.yLabel) + (spec.unit ? ` (${spec.unit})` : ""), { size: 15, fill: ink, weight: 700 })}</g>`;
  return out;
}

export function drawVenn(spec, { c, w, h }) {
  const sets = spec.sets;
  if (!Array.isArray(sets) || sets.length < 2 || sets.length > 3)
    throw new VisualError("venn: sets needs 2 or 3 sets");
  const ink = c.paint("ink");
  const series = seriesOf(spec);
  const three = sets.length === 3;
  const r = three ? Math.min(h * 0.26, w * 0.2) : Math.min(h * 0.4, w * 0.27);
  const cy = three ? h * 0.38 : h * 0.54;
  const centers = three
    ? [
        [w / 2 - r * 0.62, cy],
        [w / 2 + r * 0.62, cy],
        [w / 2, cy + r * 1.05],
      ]
    : [
        [w / 2 - r * 0.62, cy],
        [w / 2 + r * 0.62, cy],
      ];
  let out = "";
  sets.forEach((s, i) => {
    out += `<circle cx="${r1(centers[i][0])}" cy="${r1(centers[i][1])}" r="${r1(r)}" fill="${c.paint(series[i])}" fill-opacity="0.28" stroke="${ink}" stroke-width="3"${i === 1 ? ' stroke-dasharray="10 5"' : ""}/>`;
  });
  const list = (items, x, y, maxW) => {
    const arr = (items || []).map(String);
    const size = arr.length > 5 ? 12 : 14;
    return arr
      .map((t, k) =>
        textEl(
          x,
          y + (k - (arr.length - 1) / 2) * (size + 5),
          fitText(t, maxW, { size, min: 10, maxLines: 1 }).lines,
          { size, fill: ink },
        ),
      )
      .join("");
  };
  const label = (i, x, y) =>
    textEl(x, y, String(sets[i].label), { size: 16, fill: ink, weight: 700, anchor: "middle" });
  if (three) {
    out +=
      label(0, centers[0][0] - r * 0.5, centers[0][1] - r - 12) +
      label(1, centers[1][0] + r * 0.5, centers[1][1] - r - 12) +
      label(2, centers[2][0], centers[2][1] + r + 16);
    out +=
      list(sets[0].items, centers[0][0] - r * 0.45, cy - r * 0.12, r * 0.7) +
      list(sets[1].items, centers[1][0] + r * 0.45, cy - r * 0.12, r * 0.7) +
      list(sets[2].items, centers[2][0], centers[2][1] + r * 0.45, r * 0.9);
    out += list(spec.overlap, w / 2, cy + r * 0.4, r * 0.6);
  } else {
    out +=
      label(0, centers[0][0] - r * 0.3, cy - r - 12) +
      label(1, centers[1][0] + r * 0.3, cy - r - 12);
    out +=
      list(sets[0].items, centers[0][0] - r * 0.5, cy, r * 0.78) +
      list(sets[1].items, centers[1][0] + r * 0.5, cy, r * 0.78) +
      list(spec.overlap, w / 2, cy, r * 0.62);
  }
  return out;
}

const numsOf = (d) => (d.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);

function regionBox(rg) {
  if (rg.rect) {
    const [x, y, rw, rh] = rg.rect.map((v) => num(v, "map: rect"));
    return { x, y, w: rw, h: rh };
  }
  const n = numsOf(rg.d);
  const xs = n.filter((_, i) => i % 2 === 0);
  const ys = n.filter((_, i) => i % 2 === 1);
  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    w: Math.max(...xs) - Math.min(...xs),
    h: Math.max(...ys) - Math.min(...ys),
  };
}

export function drawMap(spec, { c, w, h }) {
  if (!Array.isArray(spec.regions) || !spec.regions.length)
    throw new VisualError("map: regions must be a non-empty array");
  const ink = c.paint("ink");
  const surface = c.paint("surface");
  const tints = ["sage-soft", "copper-soft", "brand-soft", "teal-soft", "sky"];
  const centers = new Map();
  let out = "";
  spec.regions.forEach((rg, i) => {
    if (!rg.rect && typeof rg.d !== "string")
      throw new VisualError("map: each region needs rect:[x,y,w,h] or d");
    const b = regionBox(rg);
    const cx = rg.lx ?? b.x + b.w / 2;
    const cy = rg.ly ?? b.y + b.h / 2;
    centers.set(rg.id, [cx, cy]);
    const fill = c.paint(rg.fill || tints[i % tints.length]);
    out += rg.rect
      ? `<rect x="${r1(b.x)}" y="${r1(b.y)}" width="${r1(b.w)}" height="${r1(b.h)}" rx="6" fill="${fill}" stroke="${ink}" stroke-width="2.5"/>`
      : `<path d="${(() => {
          if (!/^[MmLlHhVvCcSsQqTtAaZz0-9eE.,\s+-]+$/.test(rg.d))
            throw new VisualError("map: invalid region path");
          return rg.d;
        })()}" fill="${fill}" stroke="${ink}" stroke-width="2.5" stroke-linejoin="round"/>`;
  });
  for (const rt of spec.routes || []) {
    const pts = rt.points
      ? rt.points.map(([x, y]) => [num(x, "map: route x"), num(y, "map: route y")])
      : [centers.get(rt.from), centers.get(rt.to)];
    if (pts.some((p) => !p))
      throw new VisualError("map: a route needs points or valid from/to region ids");
    out += `<polyline points="${pts.map((p) => `${r1(p[0])},${r1(p[1])}`).join(" ")}" fill="none" stroke="${c.paint("coral")}" stroke-width="4" stroke-dasharray="10 6" stroke-linecap="round" stroke-linejoin="round"/>`;
    const e = pts[pts.length - 1];
    const p = pts[pts.length - 2];
    out += arrowHead(e[0], e[1], Math.atan2(e[1] - p[1], e[0] - p[0]), 12, c.paint("coral"));
    if (rt.label != null)
      out += textEl((pts[0][0] + e[0]) / 2, (pts[0][1] + e[1]) / 2 - 14, String(rt.label), {
        size: 14,
        fill: ink,
        weight: 700,
        halo: surface,
      });
  }
  spec.regions.forEach((rg) => {
    if (rg.label == null) return;
    const [cx, cy] = centers.get(rg.id) || [0, 0];
    const f = fitText(String(rg.label), 130, { size: 16, min: 11, maxLines: 2, weight: 700 });
    out += textEl(cx, cy, f.lines, { size: f.size, fill: ink, weight: 700, halo: surface });
  });
  if (spec.compass) {
    const cx = w - 34;
    const cy = 44;
    out +=
      arrow(cx, cy + 18, cx, cy - 14, { stroke: ink, sw: 3, head: 11 }) +
      textEl(cx, cy - 26, "N", { size: 16, fill: ink, weight: 700 });
  }
  return out;
}

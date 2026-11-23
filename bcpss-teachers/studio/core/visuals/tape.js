// `tape`: tape / bar model. parts:[{label,units,color?,unknown?}] with optional total, or rows:[{label,parts,total?}]
// for a ratio double tape (all rows share one unit width so equal units line up).
import { VisualError, box, fitText, num, r1, seriesOf, textEl, textWidth } from "./pal.js";

function rowsOf(spec) {
  if (Array.isArray(spec.rows) && spec.rows.length) return spec.rows.map((r) => ({ ...r }));
  if (Array.isArray(spec.parts) && spec.parts.length)
    return [{ label: spec.rowLabel, parts: spec.parts, total: spec.total }];
  throw new VisualError("tape: needs parts:[...] or rows:[{label, parts}]");
}

export function drawTape(spec, { c, w, h }) {
  const rows = rowsOf(spec);
  if (spec.rows && spec.total != null && rows[0].total == null) rows[0].total = spec.total;
  const series = seriesOf(spec);
  const sums = rows.map((r) => {
    if (!Array.isArray(r.parts) || !r.parts.length)
      throw new VisualError("tape: every row needs parts");
    return r.parts.reduce((s, p) => s + num(p.units, "tape: part units", 1), 0);
  });
  if (sums.some((s) => s <= 0)) throw new VisualError("tape: part units must add to more than 0");
  const maxUnits = Math.max(...sums);
  const labelW = rows.some((r) => r.label)
    ? Math.min(150, Math.max(...rows.map((r) => textWidth(r.label || "", 15, 700))) + 14)
    : 0;
  const padX = 18;
  const x0 = padX + labelW;
  const x1 = w - padX;
  const unitW = (x1 - x0) / maxUnits;
  const anyTotal = rows.some((r) => r.total != null);
  const topPad = anyTotal ? 44 : 16;
  const gap = anyTotal && rows.length > 1 ? 48 : 20;
  const rowH = Math.max(
    34,
    Math.min(64, (h - topPad - 16 - gap * (rows.length - 1)) / rows.length),
  );
  const used = rowH * rows.length + gap * (rows.length - 1);
  let y = topPad + Math.max(0, (h - topPad - 16 - used) / 2);
  const ink = c.paint("ink");
  const rowColors = rows.length > 1 && rows.every((r) => !r.parts.some((p) => p.color));
  let out = "";
  rows.forEach((row, ri) => {
    const rowMid = y + rowH / 2;
    if (row.label) {
      const f = fitText(String(row.label), labelW - 12, {
        size: 15,
        min: 11,
        maxLines: 2,
        weight: 700,
      });
      out += textEl(padX, rowMid, f.lines, {
        size: f.size,
        fill: ink,
        anchor: "start",
        weight: 700,
      });
    }
    let x = x0;
    row.parts.forEach((p, pi) => {
      const units = num(p.units, "tape: part units", 1);
      const pw = units * unitW;
      const colorName =
        p.color || (rowColors ? series[ri % series.length] : series[pi % series.length]);
      const unknown = !!p.unknown;
      out += box(x, y, pw, rowH, {
        fill: unknown ? c.paint("surface") : c.paint(colorName),
        stroke: ink,
        sw: 2,
        rx: 4,
        dash: unknown ? "6 4" : undefined,
      });
      const label = p.label != null && p.label !== "" ? String(p.label) : unknown ? "?" : "";
      if (label) {
        const f = fitText(label, pw - 8, { size: 18, min: 10, maxLines: 2, weight: 700 });
        out += textEl(x + pw / 2, rowMid, f.lines, {
          size: f.size,
          fill: unknown ? ink : c.on(colorName),
          weight: 700,
        });
      }
      x += pw;
    });
    if (row.total != null) {
      const bx0 = x0 + 1;
      const bx1 = x0 + sums[ri] * unitW - 1;
      const by = y - 8;
      out += `<path d="M${r1(bx0)} ${r1(by)}v-8h${r1(bx1 - bx0)}v8" fill="none" stroke="${ink}" stroke-width="2.5" stroke-linejoin="round"/>`;
      out += textEl((bx0 + bx1) / 2, by - 22, String(row.total), {
        size: 17,
        fill: ink,
        weight: 700,
      });
    }
    y += rowH + gap;
  });
  return out;
}

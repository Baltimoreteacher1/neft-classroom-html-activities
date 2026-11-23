// `table`: head, rows, highlight:[[r,c]]. Highlighted cells get a tint, a heavy border and bold type (not colour alone).
import { VisualError, fitText, r1, textEl, textWidth } from "./pal.js";

export function drawTable(spec, { c, w, h }) {
  if (!Array.isArray(spec.head) || !spec.head.length)
    throw new VisualError("table: head must be a non-empty array");
  if (!Array.isArray(spec.rows)) throw new VisualError("table: rows must be an array");
  const cols = spec.head.length;
  for (const r of spec.rows)
    if (!Array.isArray(r) || r.length !== cols)
      throw new VisualError(`table: every row needs ${cols} cells`);
  const hl = new Set((spec.highlight || []).map(([r, k]) => `${r},${k}`));
  const all = [spec.head, ...spec.rows].map((r) => r.map((v) => String(v ?? "")));
  const padX = 14;
  const x0 = 12;
  const total = w - x0 * 2;
  const want = Array.from(
    { length: cols },
    (_, k) => Math.max(...all.map((r) => textWidth(r[k], 16, k === 0 ? 700 : 400))) + padX * 2,
  );
  const sum = want.reduce((a, b) => a + b, 0);
  const widths = want.map((v) => Math.max(60, (v / sum) * total));
  const scale = total / widths.reduce((a, b) => a + b, 0);
  const cw = widths.map((v) => v * scale);
  const nrows = all.length;
  const rowH = Math.min(54, (h - 24) / nrows);
  const y0 = Math.max(12, (h - rowH * nrows) / 2);
  const ink = c.paint("ink");
  const line = c.paint("line");
  const teal = c.paint("teal");
  let out = "";
  all.forEach((row, ri) => {
    let x = x0;
    row.forEach((cell, ci) => {
      const head = ri === 0;
      const hot = !head && hl.has(`${ri - 1},${ci}`);
      const fill = head
        ? c.paint("navy")
        : hot
          ? c.paint("teal-soft")
          : c.paint(ri % 2 ? "surface" : "paper");
      const y = y0 + ri * rowH;
      out += `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(cw[ci])}" height="${r1(rowH)}" fill="${fill}" stroke="${line}" stroke-width="1.5"/>`;
      if (hot)
        out += `<rect x="${r1(x + 2)}" y="${r1(y + 2)}" width="${r1(cw[ci] - 4)}" height="${r1(rowH - 4)}" fill="none" stroke="${teal}" stroke-width="3.5"/>`;
      const weight = head || hot || ci === 0 ? 700 : 400;
      const f = fitText(cell, cw[ci] - padX, {
        size: 17,
        min: 10,
        maxLines: Math.max(1, Math.floor(rowH / 20)),
        weight,
      });
      out += textEl(x + cw[ci] / 2, y + rowH / 2, f.lines, {
        size: f.size,
        fill: head ? c.on("navy") : ink,
        weight,
      });
      x += cw[ci];
    });
  });
  return out;
}

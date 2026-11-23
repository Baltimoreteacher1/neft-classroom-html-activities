// `numberline`: min,max,step, marks:[{at,label?,style?}], arcs:[{from,to,label}], openEnds.
// mark styles: tick (default), point (filled dot), open (open dot), flag (tall highlighted tick).
// Shape and label carry the meaning, never colour alone.
import { VisualError, arrowHead, num, r1, textEl } from "./pal.js";

const fmt = (v) => String(Math.round(v * 1e6) / 1e6);

export function drawNumberline(spec, { c, w, h }) {
  const min = num(spec.min, "numberline: min");
  const max = num(spec.max, "numberline: max");
  const step = num(spec.step, "numberline: step", 1);
  if (!(max > min)) throw new VisualError("numberline: max must be greater than min");
  if (!(step > 0) || (max - min) / step > 120)
    throw new VisualError("numberline: step must be positive and give at most 120 ticks");
  const marks = Array.isArray(spec.marks) ? spec.marks : [];
  const arcs = Array.isArray(spec.arcs) ? spec.arcs : [];
  const padX = spec.openEnds ? 40 : 34;
  const x0 = padX;
  const x1 = w - padX;
  const X = (v) => x0 + ((v - min) / (max - min)) * (x1 - x0);
  const ay = arcs.length ? h * 0.62 : h * 0.5;
  const ink = c.paint("ink");
  const teal = c.paint("teal");
  const coral = c.paint("coral");
  const surface = c.paint("surface");
  let out = `<line x1="${r1(spec.openEnds ? x0 - 22 : x0)}" y1="${r1(ay)}" x2="${r1(spec.openEnds ? x1 + 22 : x1)}" y2="${r1(ay)}" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`;
  if (spec.openEnds)
    out += arrowHead(x0 - 26, ay, Math.PI, 12, ink) + arrowHead(x1 + 26, ay, 0, 12, ink);
  const autoLabels = !marks.some((m) => m.label != null);
  const n = Math.round((max - min) / step);
  for (let i = 0; i <= n; i++) {
    const v = min + i * step;
    const x = X(v);
    out += `<line x1="${r1(x)}" y1="${r1(ay - 9)}" x2="${r1(x)}" y2="${r1(ay + 9)}" stroke="${ink}" stroke-width="2"/>`;
    if (autoLabels) out += textEl(x, ay + 26, fmt(v), { size: 15, fill: ink });
  }
  for (const m of marks) {
    const at = num(m.at, "numberline: mark at");
    if (at < min - 1e-9 || at > max + 1e-9)
      throw new VisualError(`numberline: mark at ${at} is outside ${min} to ${max}`);
    const x = X(at);
    const style = m.style || "tick";
    const lab = m.label != null ? String(m.label) : null;
    if (style === "point" || style === "open") {
      out += `<circle cx="${r1(x)}" cy="${r1(ay)}" r="9" fill="${style === "open" ? surface : teal}" stroke="${ink}" stroke-width="3"/>`;
      if (lab) out += textEl(x, ay + 34, lab, { size: 16, fill: ink, weight: 700, halo: surface });
    } else if (style === "flag") {
      out += `<line x1="${r1(x)}" y1="${r1(ay - 22)}" x2="${r1(x)}" y2="${r1(ay + 14)}" stroke="${coral}" stroke-width="4" stroke-linecap="round"/>`;
      out += `<polygon points="${r1(x)},${r1(ay - 22)} ${r1(x + 14)},${r1(ay - 16)} ${r1(x)},${r1(ay - 10)}" fill="${coral}"/>`;
      if (lab) out += textEl(x, ay + 30, lab, { size: 16, fill: ink, weight: 700 });
    } else if (lab) out += textEl(x, ay + 26, lab, { size: 15, fill: ink });
  }
  for (const a of arcs) {
    const xa = X(num(a.from, "numberline: arc from"));
    const xb = X(num(a.to, "numberline: arc to"));
    const mid = (xa + xb) / 2;
    const lift = Math.min(ay - 36, 28 + Math.abs(xb - xa) * 0.22);
    const sy = ay - 12;
    const path = `M${r1(xa)} ${r1(sy)}Q${r1(mid)} ${r1(sy - lift * 2)} ${r1(xb)} ${r1(sy)}`;
    out += `<path d="${path}" fill="none" stroke="${coral}" stroke-width="3" stroke-linecap="round"/>`;
    out += arrowHead(xb, sy, Math.atan2(lift * 2, xb - mid), 11, coral);
    if (a.label != null)
      out += textEl(mid, sy - lift - 14, String(a.label), {
        size: 16,
        fill: ink,
        weight: 700,
        halo: surface,
      });
  }
  return out;
}

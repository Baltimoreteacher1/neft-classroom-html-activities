// `labeled`: a base visual with leader-line callouts. labels:[{text,x,y,tx,ty,hidden?}]: (x,y) is the point on the
// picture, (tx,ty) the centre of the text. A hidden label draws the leader, the anchor dot and an empty numbered
// answer box, and never writes its text into the markup (label-the-diagram engines place the answer themselves).
import { VisualError, box, fitText, num, r1, textEl, textWidth } from "./pal.js";

export function drawLabeled(spec, ctx, drawBase) {
  if (!spec.base || typeof spec.base !== "object")
    throw new VisualError("labeled: base must be a visual spec");
  if (!Array.isArray(spec.labels)) throw new VisualError("labeled: labels must be an array");
  const { c, w, h } = ctx;
  const ink = c.paint("ink");
  const surface = c.paint("surface");
  let lines = "";
  let boxes = "";
  spec.labels.forEach((l, i) => {
    const x = num(l.x, "labeled: label x");
    const y = num(l.y, "labeled: label y");
    const tx = num(l.tx, "labeled: label tx", x);
    const ty = num(l.ty, "labeled: label ty", y);
    const hidden = !!l.hidden;
    if (!hidden && (l.text == null || l.text === ""))
      throw new VisualError("labeled: a visible label needs text");
    const text = hidden ? "" : String(l.text);
    const f = hidden ? null : fitText(text, 150, { size: 15, min: 11, maxLines: 2, weight: 700 });
    const bw = hidden ? 54 : Math.max(...f.lines.map((s) => textWidth(s, f.size, 700))) + 18;
    const bh = hidden ? 30 : f.lines.length * f.size * 1.2 + 12;
    const bx = Math.min(w - bw - 4, Math.max(4, tx - bw / 2));
    const by = Math.min(h - bh - 4, Math.max(4, ty - bh / 2));
    // leader ends on the nearest edge of the text box
    const ex = Math.min(bx + bw, Math.max(bx, x));
    const ey = Math.min(by + bh, Math.max(by, y));
    lines += `<line x1="${r1(x)}" y1="${r1(y)}" x2="${r1(ex)}" y2="${r1(ey)}" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/>`;
    lines += `<circle cx="${r1(x)}" cy="${r1(y)}" r="5.5" fill="${ink}" stroke="${surface}" stroke-width="2"/>`;
    boxes += box(bx, by, bw, bh, {
      fill: surface,
      stroke: ink,
      sw: 2,
      rx: 7,
      dash: hidden ? "5 4" : undefined,
    });
    boxes += hidden
      ? textEl(bx + bw / 2, by + bh / 2, String(i + 1), { size: 16, fill: ink, weight: 700 })
      : textEl(bx + bw / 2, by + bh / 2, f.lines, { size: f.size, fill: ink, weight: 700 });
  });
  return drawBase(spec.base, ctx) + lines + boxes;
}

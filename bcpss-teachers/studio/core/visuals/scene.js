// `scene`: a background (sky, room, field, water, plain) with icons placed at items:[{icon,x,y,s,label?}]
// (x,y is the icon's top-left, s its size). An item with a `t` field is drawn as a shapes primitive instead.
import { VisualError, num, r1, textEl, textWidth } from "./pal.js";
import { drawItem, iconAt } from "./shapes.js";

const BGS = ["sky", "room", "field", "water", "plain"];

/** Bottom band with rounded bottom corners (no clipPath, so no ids). */
const band = (y, w, h, r, fill) =>
  `<path d="M0 ${r1(y)}H${w}V${r1(h - r)}a${r} ${r} 0 0 1-${r} ${r}H${r}a${r} ${r} 0 0 1-${r}-${r}Z" fill="${fill}"/>`;

function background(bg, c, w, h) {
  const r = 14;
  const base = (fill) => `<rect width="${w}" height="${h}" rx="${r}" fill="${fill}"/>`;
  const frame = `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="${r}" fill="none" stroke="${c.paint("line")}" stroke-width="2"/>`;
  const col = c.tok;
  if (bg === "sky") return base(col("sky")) + frame;
  if (bg === "plain") return base(c.paint("surface")) + frame;
  if (bg === "room")
    return (
      base(col("brand-soft")) +
      band(h * 0.72, w, h, r, col("copper-soft")) +
      `<line x1="0" y1="${r1(h * 0.72)}" x2="${w}" y2="${r1(h * 0.72)}" stroke="${col("ink-2")}" stroke-width="3"/>` +
      frame
    );
  if (bg === "field")
    return (
      base(col("sky")) +
      `<ellipse cx="${r1(w * 0.3)}" cy="${r1(h * 0.78)}" rx="${r1(w * 0.55)}" ry="${r1(h * 0.22)}" fill="${col("sage-soft")}"/>` +
      band(h * 0.8, w, h, r, col("sage-soft")) +
      `<path d="M0 ${r1(h * 0.8)}H${w}" stroke="${col("sage")}" stroke-width="3"/>` +
      frame
    );
  // water
  const wy = h * 0.55;
  const wave = Array.from({ length: Math.ceil(w / 40) }, (_, i) => `q10-9 20 0t20 0`).join("");
  return (
    base(col("sky")) +
    band(wy, w, h, r, col("teal-soft")) +
    `<path d="M0 ${r1(wy)}${wave}" fill="none" stroke="${col("teal")}" stroke-width="3"/>` +
    frame
  );
}

export function drawScene(spec, { c, w, h }) {
  const bg = spec.bg || "plain";
  if (!BGS.includes(bg)) throw new VisualError(`scene: bg must be one of ${BGS.join(", ")}`);
  if (!Array.isArray(spec.items)) throw new VisualError("scene: items must be an array");
  let out = background(bg, c, w, h);
  const ink = c.paint("ink");
  for (const it of spec.items) {
    if (it.t) {
      out += drawItem(it, c);
      continue;
    }
    if (!it.icon) throw new VisualError("scene: each item needs an icon (or a shapes type t)");
    const x = num(it.x, "scene: item x");
    const y = num(it.y, "scene: item y");
    const s = num(it.s, "scene: item s", 64);
    out += iconAt(it.icon, x, y, s, { color: it.color });
    if (it.label != null) {
      const label = String(it.label);
      const tw = textWidth(label, 15, 700) + 16;
      const cx = x + s / 2;
      const ly = Math.min(y + s + 14, h - 14);
      out += `<rect x="${r1(cx - tw / 2)}" y="${r1(ly - 12)}" width="${r1(tw)}" height="24" rx="12" fill="${c.paint("surface")}" stroke="${ink}" stroke-width="1.5"/>`;
      out += textEl(cx, ly, label, { size: 15, fill: ink, weight: 700 });
    }
  }
  return out;
}

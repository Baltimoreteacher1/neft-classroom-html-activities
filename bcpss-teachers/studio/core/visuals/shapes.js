// `shapes` primitives (rect, circle, ellipse, line, poly, path, text, icon) plus icon placement shared by scene,
// cycle, flow and icon visuals. Every attribute is validated; nothing from a spec is written unescaped.
import { iconBody } from "../icons.js";
import { VisualError, num, r1, textEl } from "./pal.js";

const PATH_D = /^[MmLlHhVvCcSsQqTtAaZz0-9eE.,\s+-]+$/;
const POINTS = /^[0-9eE.,\s+-]+$/;
const CAPS = new Set(["butt", "round", "square"]);

/** An icon drawn in a size x size square with its top-left at (x, y). */
export function iconAt(name, x, y, size, opts = {}) {
  const s = size / 64;
  return `<g transform="translate(${r1(x)} ${r1(y)}) scale(${Math.round(s * 1000) / 1000})">${iconBody(name, opts)}</g>`;
}

function stroke(it, c) {
  if (it.stroke == null) return "";
  const color = c.paint(it.stroke, "ink");
  if (color === "none") return "";
  const sw = num(it.sw ?? it.strokeWidth, "shapes: sw", 2);
  const cap = CAPS.has(it.cap) ? ` stroke-linecap="${it.cap}"` : "";
  let dash = "";
  if (it.dash) {
    const d = Array.isArray(it.dash) ? it.dash.map((v) => num(v, "shapes: dash")).join(" ") : typeof it.dash === "number" ? String(num(it.dash, "shapes: dash")) : String(it.dash);
    if (!/^[0-9.]+(?:[ ,]+[0-9.]+)*$/.test(d)) throw new VisualError(`shapes: dash must be numbers, got ${JSON.stringify(it.dash)}`);
    dash = ` stroke-dasharray="${d}"`;
  }
  return ` stroke="${color}" stroke-width="${r1(sw)}" stroke-linejoin="round"${cap}${dash}`;
}

const fillOf = (it, c, def = "none") => ` fill="${c.paint(it.fill, def)}"`;
const opacity = (it) =>
  it.opacity == null
    ? ""
    : ` opacity="${r1(Math.min(1, Math.max(0, num(it.opacity, "shapes: opacity"))))}"`;

/** Draw one primitive item. Throws VisualError for an unknown type or a bad attribute. */
export function drawItem(it, c) {
  if (!it || typeof it !== "object") throw new VisualError("shapes: each item must be an object");
  const n = (k) => num(it[k], `shapes ${it.t}: ${k}`);
  switch (it.t) {
    case "rect":
      return `<rect x="${r1(n("x"))}" y="${r1(n("y"))}" width="${r1(n("w"))}" height="${r1(n("h"))}"${it.rx != null ? ` rx="${r1(n("rx"))}"` : ""}${fillOf(it, c)}${stroke(it, c)}${opacity(it)}/>`;
    case "circle":
      return `<circle cx="${r1(n("cx"))}" cy="${r1(n("cy"))}" r="${r1(n("r"))}"${fillOf(it, c)}${stroke(it, c)}${opacity(it)}/>`;
    case "ellipse":
      return `<ellipse cx="${r1(n("cx"))}" cy="${r1(n("cy"))}" rx="${r1(n("rx"))}" ry="${r1(n("ry"))}"${fillOf(it, c)}${stroke(it, c)}${opacity(it)}/>`;
    case "line": {
      return `<line x1="${r1(n("x1"))}" y1="${r1(n("y1"))}" x2="${r1(n("x2"))}" y2="${r1(n("y2"))}"${stroke({ stroke: "ink", ...it }, c)}${opacity(it)}/>`;
    }
    case "poly": {
      let pts = it.points;
      if (Array.isArray(pts))
        pts = pts.map((p) => `${r1(num(p[0], "poly x"))},${r1(num(p[1], "poly y"))}`).join(" ");
      if (typeof pts !== "string" || !POINTS.test(pts))
        throw new VisualError("shapes poly: points must be [[x,y],...] or an 'x,y x,y' string");
      return `<polygon points="${pts}"${fillOf(it, c)}${stroke(it, c)}${opacity(it)}/>`;
    }
    case "path": {
      if (typeof it.d !== "string" || !PATH_D.test(it.d))
        throw new VisualError("shapes path: d must be a valid SVG path string");
      return `<path d="${it.d}"${fillOf(it, c)}${stroke(it, c)}${opacity(it)}/>`;
    }
    case "text": {
      if (it.text == null) throw new VisualError("shapes text: text is required");
      const size = num(it.size, "shapes text: size", 18);
      const lines = String(it.text).split("\n");
      return textEl(n("x"), n("y"), lines, {
        size,
        fill: c.paint(it.fill, "ink"),
        anchor: ["start", "middle", "end"].includes(it.anchor) ? it.anchor : "middle",
        weight: it.weight === 700 || it.weight === 600 || it.weight === "bold" ? 700 : 400,
        italic: !!it.italic,
      });
    }
    case "icon": {
      const size = num(it.s ?? it.size, "shapes icon: s", 48);
      return iconAt(it.name, n("x"), n("y"), size, { color: it.color });
    }
    default:
      throw new VisualError(
        `shapes: unknown item type ${JSON.stringify(it.t)} (rect, circle, ellipse, line, poly, path, text, icon)`,
      );
  }
}

export function drawShapes(spec, ctx) {
  if (!Array.isArray(spec.items)) throw new VisualError("shapes: items must be an array");
  return spec.items.map((it) => drawItem(it, ctx.c)).join("");
}

// Drawing helpers for the content-special packs. Every function returns items for a `shapes` visual spec
// (core/visuals.js). All attribute naming lives in the P object below so a change to the visual kit is a one-place fix.
// Not a data module: the validator and manifest builder read only data/{lessons,vocab,activities,wida,projects}.

const P = {
  rect: (x, y, w, h, fill, o = {}) => ({ t: "rect", x, y, w, h, fill, ...o }),
  circle: (cx, cy, r, fill, o = {}) => ({ t: "circle", cx, cy, r, fill, ...o }),
  ellipse: (cx, cy, rx, ry, fill, o = {}) => ({ t: "ellipse", cx, cy, rx, ry, fill, ...o }),
  line: (x1, y1, x2, y2, stroke, sw = 4, o = {}) => ({
    t: "line",
    x1,
    y1,
    x2,
    y2,
    stroke,
    sw,
    ...o,
  }),
  poly: (points, fill, o = {}) => ({ t: "poly", points, fill, ...o }),
  path: (d, fill, o = {}) => ({ t: "path", d, fill, ...o }),
  text: (x, y, text, o = {}) => ({
    t: "text",
    x,
    y,
    text,
    size: 18,
    fill: "ink",
    anchor: "middle",
    ...o,
  }),
};

export const { rect, circle, ellipse, line, poly, path, text } = P;

/** Stroke-only version of a primitive. */
export const outline = (item, stroke = "ink", sw = 3) => ({ ...item, fill: "none", stroke, sw });

/** A friendly round face. mood: "smile" | "grin" | "calm" | "wow". */
export function face(cx, cy, r, { mood = "smile", skin = "#e8b98a", ink = "ink" } = {}) {
  const eye = r * 0.3;
  const ey = cy - r * 0.15;
  const mouths = {
    smile: path(
      `M ${cx - r * 0.45} ${cy + r * 0.25} Q ${cx} ${cy + r * 0.7} ${cx + r * 0.45} ${cy + r * 0.25}`,
      "none",
      { stroke: ink, sw: 3 },
    ),
    grin: path(
      `M ${cx - r * 0.5} ${cy + r * 0.2} Q ${cx} ${cy + r * 0.85} ${cx + r * 0.5} ${cy + r * 0.2} Z`,
      "#ffffff",
      { stroke: ink, sw: 3 },
    ),
    calm: line(cx - r * 0.3, cy + r * 0.4, cx + r * 0.3, cy + r * 0.4, ink, 3),
    wow: ellipse(cx, cy + r * 0.45, r * 0.16, r * 0.2, "#ffffff", { stroke: ink, sw: 3 }),
  };
  return [
    circle(cx, cy, r, skin, { stroke: ink, sw: 3 }),
    circle(cx - eye, ey, r * 0.08, ink),
    circle(cx + eye, ey, r * 0.08, ink),
    mouths[mood],
  ];
}

/** A simple standing person: head, body, arms. pose: "wave" | "point" | "rest". */
export function person(
  cx,
  base,
  { s = 1, shirt = "teal", skin = "#e8b98a", hair = "#3b2a1f", pose = "rest", mood = "smile" } = {},
) {
  const head = 22 * s;
  const bodyTop = base - 78 * s;
  const items = [
    rect(cx - 20 * s, bodyTop, 40 * s, 52 * s, shirt, { rx: 10 * s }),
    rect(cx - 16 * s, base - 28 * s, 12 * s, 28 * s, "navy", { rx: 4 * s }),
    rect(cx + 4 * s, base - 28 * s, 12 * s, 28 * s, "navy", { rx: 4 * s }),
    circle(cx, bodyTop - head + 4 * s, head + 2 * s, hair),
    ...face(cx, bodyTop - head + 8 * s, head, { mood, skin }),
  ];
  const arm = (x1, y1, x2, y2) => line(x1, y1, x2, y2, skin, 8 * s, { cap: "round" });
  items.push(arm(cx - 20 * s, bodyTop + 10 * s, cx - 34 * s, bodyTop + 40 * s));
  if (pose === "wave")
    items.push(arm(cx + 20 * s, bodyTop + 10 * s, cx + 40 * s, bodyTop - 14 * s));
  else if (pose === "point")
    items.push(arm(cx + 20 * s, bodyTop + 14 * s, cx + 4 * s, bodyTop + 24 * s));
  else items.push(arm(cx + 20 * s, bodyTop + 10 * s, cx + 34 * s, bodyTop + 40 * s));
  return items;
}

/** Speech bubble with a tail pointing down-left (side "l") or down-right ("r"). Text lines are centred. */
export function bubble(
  x,
  y,
  w,
  h,
  lines,
  { side = "l", fill = "paper", size = 17, ink = "ink" } = {},
) {
  const tx = side === "l" ? x + 24 : x + w - 24;
  const out = [
    rect(x, y, w, h, fill, { rx: 14, stroke: ink, sw: 3 }),
    poly(
      `${tx - 10},${y + h - 1} ${tx + 10},${y + h - 1} ${tx + (side === "l" ? -8 : 8)},${y + h + 18}`,
      fill,
      { stroke: ink, sw: 3 },
    ),
    rect(tx - 8, y + h - 5, 16, 8, fill),
  ];
  const lh = size + 5;
  const top = y + h / 2 - ((lines.length - 1) * lh) / 2 + size * 0.33;
  lines.forEach((l, i) => out.push(text(x + w / 2, top + i * lh, l, { size, fill: ink })));
  return out;
}

/** A name tag: coloured header with a printed greeting and a hand-written name line. */
export function nameTag(x, y, w, h, head, name, { color = "coral", size = 20 } = {}) {
  return [
    rect(x, y, w, h, "paper", { rx: 12, stroke: "ink", sw: 3 }),
    rect(x, y, w, h * 0.38, color, { rx: 12 }),
    rect(x, y + h * 0.22, w, h * 0.16, color),
    text(x + w / 2, y + h * 0.27, head, { size: size * 0.8, fill: "#ffffff", weight: "bold" }),
    text(x + w / 2, y + h * 0.7, name, { size, fill: "ink", weight: "bold" }),
    line(x + w * 0.15, y + h * 0.82, x + w * 0.85, y + h * 0.82, "line", 2),
  ];
}

export const heart = (cx, cy, s, fill = "coral") =>
  path(
    `M ${cx} ${cy + s * 0.9} C ${cx - s * 1.6} ${cy - s * 0.1} ${cx - s * 0.7} ${cy - s * 1.1} ${cx} ${cy - s * 0.35} C ${cx + s * 0.7} ${cy - s * 1.1} ${cx + s * 1.6} ${cy - s * 0.1} ${cx} ${cy + s * 0.9} Z`,
    fill,
    { stroke: "ink", sw: 3 },
  );

export const star = (cx, cy, r, fill = "ochre") => {
  const pts = [];
  for (let i = 0; i < 10; i += 1) {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`);
  }
  return poly(pts.join(" "), fill, { stroke: "ink", sw: 2 });
};

/** Compose a spec. */
export const spec = (
  alt,
  items,
  { w = 480, h = 320, bg = "paper", longDesc, border = false } = {},
) => ({
  kind: "shapes",
  alt,
  ...(longDesc ? { longDesc } : {}),
  w,
  h,
  items: [
    rect(0, 0, w, h, bg),
    ...(border ? [outline(rect(2, 2, w - 4, h - 4, "none", { rx: 10 }), "line", 3)] : []),
    ...items.flat(),
  ],
});

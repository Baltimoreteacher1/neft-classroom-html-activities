// Shared drawing helpers for the K–3 picture scenes (src/early/scenes.js). Built on the site illustration kit
// (./kit.js) and always drawn inside noDefs(): a page can show several scenes at once (picture choices, print
// pages, data: URLs), so the art carries no ids, gradients or filters. Pure strings, no DOM.
//
// Style: editorial picture-book, no outlines. Every object has a lit side and a shade side, a soft contact
// shadow, and big simple shapes so the youngest learners can name it at phone size.

import {
  P,
  circle,
  contact,
  ellipse,
  g,
  light,
  line,
  mix,
  path,
  person,
  poly,
  rect,
  rng,
  rrect,
  shade,
  stroke,
  tr,
  tuft,
} from "./kit.js";

export const W = 640;
export const H = 400;

/* ------------------------------------------------------------------ backdrops */

const SKY = {
  day: ["#a8d3ea", "#c9e5f1", "#eaf4ef"],
  rain: ["#8f9cab", "#a9b5bf", "#c6ced4"],
  snow: ["#b3c3d1", "#cdd8e0", "#e6ecf0"],
  night: ["#0e2141", "#173259", "#244572"],
};
/** Sky with a pale band near the horizon (flat layers, no gradient ids). */
export function skyFill(kind = "day", horizon = 300) {
  const [a, b, c] = SKY[kind] || SKY.day;
  return (
    rect(0, 0, W, horizon + 40, a) +
    rect(0, horizon * 0.42, W, horizon, b, 'opacity=".75"') +
    ellipse(W / 2, horizon, W * 0.8, horizon * 0.32, c, 'opacity=".8"')
  );
}

/** A warm sun with a soft halo. */
export const sunDisc = (x = 560, y = 70, r = 34) =>
  circle(x, y, r * 1.5, "#fff4c9", 'opacity=".35"') +
  circle(x, y, r, "#f4c54a") +
  circle(x - r * 0.28, y - r * 0.3, r * 0.42, "#fde39a", 'opacity=".8"');

/** Rolling far hills from y, hazed toward the sky. */
export function farHills(y, color = P.grass, haze = "#dbeee4") {
  return (
    path(
      `M0 ${y} Q120 ${y - 34} 250 ${y - 8} T520 ${y - 14} T${W} ${y - 4} V${y + 60} H0Z`,
      mix(color, haze, 0.62),
    ) +
    path(
      `M0 ${y + 10} Q160 ${y - 14} 330 ${y + 6} T${W} ${y} V${y + 60} H0Z`,
      mix(color, haze, 0.4),
    )
  );
}

/** Ground from y to the bottom: a lit near-horizon band, a darker foreground and a few tufts. */
export function lawn(y, { color = P.grass, tufts = 7, seed = 3, blades = true } = {}) {
  const R = rng(seed);
  let s =
    rect(0, y, W, H - y, color) +
    rect(0, y, W, 10, light(color, 0.25), 'opacity=".8"') +
    rect(0, y + (H - y) * 0.62, W, H, shade(color, 0.1), 'opacity=".55"');
  if (blades)
    for (let i = 0; i < tufts; i++)
      s += tuft(20 + R() * 600, y + 26 + R() * (H - y - 30), 1 + R() * 0.5, shade(color, 0.22));
  return s;
}

/** Garden soil seen from the side, with furrow rows. */
export function soil(y) {
  let s =
    rect(0, y, W, H - y, P.soil) +
    rect(0, y, W, 8, light(P.soil, 0.22)) +
    rect(0, y + (H - y) * 0.55, W, H, P.soilDark, 'opacity=".55"');
  const R = rng(11);
  for (let i = 0; i < 26; i++)
    s += ellipse(
      R() * W,
      y + 16 + R() * (H - y - 20),
      3 + R() * 3,
      1.6,
      P.soilDark,
      'opacity=".5"',
    );
  return s;
}

/** Snow ground with soft drifts. */
export const snowGround = (y) =>
  rect(0, y, W, H - y, "#f4f8fb") +
  path(`M0 ${y + 4} Q160 ${y - 12} 330 ${y + 2} T${W} ${y - 4} V${y + 30} H0Z`, "#ffffff") +
  rect(0, y + (H - y) * 0.6, W, H, "#dfe8ef", 'opacity=".7"');

/** Inside a room: a warm wall, a skirting board and a wood floor from y. */
export function room(y = 320, { wall = "#f3e7d3", floor = P.floor } = {}) {
  let s =
    rect(0, 0, W, H, wall) +
    rect(0, y - 70, W, 70, shade(wall, 0.06), 'opacity=".6"') +
    rect(0, y - 8, W, 8, light(P.wood, 0.3));
  s += rect(0, y, W, H - y, floor) + rect(0, y, W, 6, shade(floor, 0.18), 'opacity=".5"');
  let d = "";
  for (let i = 1; i < 4; i++) d += `M0 ${y + i * i * 7 + 6}H${W}`;
  return s + stroke(d, shade(floor, 0.22), 1.4, 'opacity=".45"');
}

/** Window in a wall with a sky view (day | night | sun). */
export function windowPane(x, y, w, h, view = "day") {
  const [a, b] = view === "night" ? ["#13284a", "#24456f"] : ["#a8d3ea", "#e3f1f2"];
  let s =
    rect(x - 8, y - 8, w + 16, h + 16, "#fbf6ec") +
    rect(x, y, w, h, a) +
    rect(x, y + h * 0.55, w, h * 0.45, b, 'opacity=".8"');
  if (view === "sun")
    s +=
      circle(x + w * 0.62, y + h * 0.4, Math.min(w, h) * 0.2, "#f4c54a") +
      circle(x + w * 0.62, y + h * 0.4, Math.min(w, h) * 0.32, "#fff1bf", 'opacity=".4"');
  s += path(
    `M${x} ${y + h} L${x + w * 0.4} ${y} L${x + w * 0.55} ${y} L${x + w * 0.15} ${y + h}Z`,
    "#ffffff",
    'opacity=".18"',
  );
  s +=
    rect(x + w / 2 - 3, y, 6, h, "#fbf6ec") +
    rect(x - 14, y + h + 6, w + 28, 9, shade("#fbf6ec", 0.12));
  return s;
}

/** A table standing on the floor at y (top surface at y - h). */
export function table(x, y, w, h = 92, { color = P.wood } = {}) {
  return (
    contact(x + w / 2, y, w * 0.52, 7, 0.16) +
    rect(x + 14, y - h, 11, h, shade(color, 0.28)) +
    rect(x + w - 25, y - h, 11, h, shade(color, 0.28)) +
    rrect(x - 4, y - h - 6, w + 8, 14, 4, color) +
    rect(x - 4, y - h - 6, w + 8, 4, light(color, 0.25), 'rx="2"') +
    rect(x, y - h + 8, w, 4, shade(color, 0.3), 'opacity=".5"')
  );
}

/* ------------------------------------------------------------------ people */

/** A kit person, minus the ground shadow when lifted off the ground. */
export const kidAt = (x, y, h, look) => person(x, y, h, { age: "child", ...look });
export const adultAt = (x, y, h, look) => person(x, y, h, { age: "adult", ...look });
export const noShadow = (svg) => svg.replace(/^<ellipse[^>]*\/>/, "");

/**
 * Face overlay for a figure drawn with mouth "none": position of the head centre in scene units.
 * Mirrors the kit's child/adult proportions so a custom mouth lands on the face.
 */
export function faceAt(x, y, h, { age = "child", facing = 1 } = {}) {
  const hr = age === "child" ? 13 : 10.2;
  const s = h / 100;
  const hy = y + (-100 + hr) * s;
  const fx = x + facing * hr * 0.28 * s;
  return { fx, hy, r: hr * s, s, facing };
}
/** A wide happy smile (open). */
export function bigSmile(f) {
  const { fx, hy, r } = f;
  const my = hy + r * 0.42;
  return (
    path(`M${fx - r * 0.3} ${my} Q${fx} ${my + r * 0.5} ${fx + r * 0.3} ${my}Z`, "#7a2f2a") +
    path(
      `M${fx - r * 0.16} ${my + r * 0.2} Q${fx} ${my + r * 0.34} ${fx + r * 0.16} ${my + r * 0.2}Z`,
      P.coralLight,
    )
  );
}
/** A sad face: downturned mouth, worried brows and a tear. */
export function sadFace(f, skin) {
  const { fx, hy, r, facing } = f;
  const my = hy + r * 0.6;
  const ink = shade(skin, 0.55);
  return (
    stroke(`M${fx - r * 0.22} ${my} Q${fx} ${my - r * 0.24} ${fx + r * 0.22} ${my}`, ink, r * 0.12) +
    stroke(
      `M${fx - facing * r * 0.42} ${hy - r * 0.22} l${facing * r * 0.24} ${-r * 0.1}M${fx + facing * r * 0.48} ${hy - r * 0.22} l${-facing * r * 0.24} ${-r * 0.1}`,
      ink,
      r * 0.07,
    ) +
    path(
      `M${fx - facing * r * 0.34} ${hy + r * 0.24} q${r * 0.08} ${r * 0.2} 0 ${r * 0.28} q${-r * 0.08} ${-r * 0.08} 0 ${-r * 0.28}Z`,
      "#6fb6e0",
    )
  );
}

/* ------------------------------------------------------------------ things held in a hand (figure units) */

export const HELD = {
  can: (pour = false) =>
    g(
      rrect(-4, -8, 24, 18, 5, "#3f86b8") +
        rect(-4, 4, 24, 6, shade("#3f86b8", 0.2), 'rx="3"') +
        stroke("M0 -8 Q8 -20 16 -8", shade("#3f86b8", 0.15), 3) +
        stroke("M18 -2 L32 -14", "#3f86b8", 4) +
        ellipse(33, -15, 4, 3, shade("#3f86b8", 0.2)) +
        (pour
          ? stroke(
              "M36 -12 q8 10 8 40M34 -10 q4 14 2 42M38 -15 q14 6 16 36",
              "#7cc3e6",
              1.8,
              'opacity=".9" stroke-dasharray="4 4"',
            )
          : ""),
    ),
  shovel: () =>
    g(
      stroke("M-2 -16 L12 52", P.woodDark, 3.4) +
        rrect(-8, -20, 12, 5, 2, P.woodDark) +
        path("M6 50 L20 46 L24 64 Q18 72 12 68Z", "#9aa6b2") +
        path("M15 48 L20 46 L24 64 Q21 68 18 69Z", shade("#9aa6b2", 0.25)),
    ),
  basket: (fruit = P.red) =>
    g(
      stroke("M-10 2 Q0 -14 10 2", P.woodDark, 2.4) +
        (fruit
          ? circle(-5, 4, 5.5, fruit) +
            circle(5, 3, 5.5, fruit) +
            circle(0, 1, 5, shade(fruit, 0.1)) +
            circle(-6.5, 2.4, 1.4, "#fff", 'opacity=".6"')
          : "") +
        path("M-14 4 H14 L10 20 H-10Z", P.wood) +
        path("M2 4 H14 L10 20 H2Z", shade(P.wood, 0.18)) +
        stroke("M-12 10 H12M-11 15 H11", shade(P.wood, 0.3), 1, 'opacity=".6"'),
    ),
  book: (c = P.coral) =>
    g(
      rrect(-3, -12, 18, 22, 2, c) +
        rect(-3, -12, 4, 22, shade(c, 0.3)) +
        rect(13, -11, 2, 20, "#fbf6ec"),
    ),
  ball: (c = P.orange) =>
    g(
      circle(6, -2, 9, c) +
        path("M6 -11 A9 9 0 0 1 6 7 A6 9 0 0 0 6 -11Z", shade(c, 0.2)) +
        circle(3, -5, 2.6, "#fff", 'opacity=".5"'),
    ),
  letter: () =>
    g(
      rect(-2, -8, 18, 12, "#ffffff", 'rx="1.5"') +
        path(
          "M-2 -8 L7 -1 L16 -8",
          "none",
          `stroke="${shade("#ffffff", 0.3)}" stroke-width="1.2"`,
        ) +
        rect(11, -7, 4, 4, P.coral),
    ),
  plate: () => g(ellipse(8, -2, 14, 4, "#ffffff") + ellipse(8, -1, 9, 2.4, shade("#ffffff", 0.1))),
  umbrella: (c = P.red) =>
    g(
      stroke("M0 0 L-10 -44", P.ink, 2.2) +
        stroke("M0 0 q1 5 -4 6", P.ink, 2.2) +
        path(
          "M-58 -40 Q-52 -86 -12 -88 Q28 -86 34 -40 q-8 -6 -15.5 0 q-8 -6 -15.5 0 q-8 -6 -15.5 0 q-8 -6 -15.5 0 q-8 -6 -15.5 0 q-8 -6 -15.5 0Z",
          c,
        ) +
        path(
          "M-12 -88 Q28 -86 34 -40 q-8 -6 -15.5 0 q-8 -6 -15.5 0 Q2 -60 -12 -88Z",
          shade(c, 0.2),
        ) +
        path(
          "M-44 -52 Q-38 -76 -18 -82",
          "none",
          `stroke="${light(c, 0.4)}" stroke-width="2.4" opacity=".7"`,
        ),
    ),
  sign: () => g(stroke("M0 6 L0 -34", "#7d8790", 3) + stopSign(0, -50, 17)),
  spoon: () => g(stroke("M0 0 L10 -26", "#9aa6b2", 2.4) + ellipse(11, -28, 3.4, 5, "#9aa6b2")),
};

/* ------------------------------------------------------------------ props */

/** A red octagon stop sign (no lettering: a white bar keeps it readable without words). */
export function stopSign(x, y, r) {
  const pts = (rr) =>
    Array.from({ length: 8 }, (_, i) => [
      x + Math.cos(((i + 0.5) * Math.PI) / 4) * rr,
      y + Math.sin(((i + 0.5) * Math.PI) / 4) * rr,
    ]);
  return (
    poly(pts(r), "#ffffff") +
    poly(pts(r * 0.86), P.red) +
    rrect(x - r * 0.55, y - r * 0.14, r * 1.1, r * 0.28, r * 0.1, "#ffffff")
  );
}

/** A leaf from (0,0) along +x, length len, then rotated by a degrees and moved to (x, y). */
export function leaf(x, y, len, a, col = P.leaf) {
  const w = len * 0.36;
  return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a})">${path(`M0 0 Q${len * 0.45} ${-w} ${len} 0 Q${len * 0.45} ${w} 0 0Z`, col)}${path(`M0 0 Q${len * 0.45} ${w} ${len} 0Z`, shade(col, 0.18))}</g>`;
}

/** A tomato. */
export const tomato = (x, y, r = 10) =>
  circle(x, y, r, P.red) +
  path(
    `M${x + r * 0.1} ${y - r} A${r} ${r} 0 0 1 ${x + r * 0.1} ${y + r} A${r * 0.7} ${r} 0 0 0 ${x + r * 0.1} ${y - r}Z`,
    shade(P.red, 0.18),
  ) +
  circle(x - r * 0.38, y - r * 0.35, r * 0.24, "#ffffff", 'opacity=".55"') +
  poly(
    [
      [x - r * 0.45, y - r * 0.85],
      [x, y - r * 1.15],
      [x + r * 0.45, y - r * 0.85],
      [x, y - r * 0.7],
    ],
    P.leafDark,
  );

/** An apple: red body, shade side, highlight, stem and leaf. */
export function apple(x, y, r = 20, col = P.red) {
  return (
    path(
      `M${x} ${y - r * 0.72} C${x - r * 0.5} ${y - r * 1.1} ${x - r * 1.1} ${y - r * 0.7} ${x - r * 1.02} ${y} C${x - r * 0.95} ${y + r * 0.75} ${x - r * 0.35} ${y + r * 1.05} ${x} ${y + r * 0.86} C${x + r * 0.35} ${y + r * 1.05} ${x + r * 0.95} ${y + r * 0.75} ${x + r * 1.02} ${y} C${x + r * 1.1} ${y - r * 0.7} ${x + r * 0.5} ${y - r * 1.1} ${x} ${y - r * 0.72}Z`,
      col,
    ) +
    path(
      `M${x + r * 0.2} ${y - r * 0.8} C${x + r * 0.6} ${y - r * 0.9} ${x + r * 1.08} ${y - r * 0.6} ${x + r * 1.02} ${y} C${x + r * 0.95} ${y + r * 0.75} ${x + r * 0.35} ${y + r * 1.05} ${x + r * 0.1} ${y + r * 0.9} C${x + r * 0.6} ${y + r * 0.4} ${x + r * 0.6} ${y - r * 0.3} ${x + r * 0.2} ${y - r * 0.8}Z`,
      shade(col, 0.2),
    ) +
    ellipse(x - r * 0.45, y - r * 0.25, r * 0.2, r * 0.32, "#ffffff", 'opacity=".45"') +
    stroke(
      `M${x} ${y - r * 0.68} q${r * 0.05} ${-r * 0.3} ${r * 0.2} ${-r * 0.45}`,
      P.barkDark,
      Math.max(1.6, r * 0.12),
    ) +
    leaf(x + r * 0.12, y - r * 0.95, r * 0.6, -28, P.leafLight)
  );
}

/** A bunch of bananas. */
export function bananas(x, y, s = 1) {
  let b = "";
  for (const [dx, dy, a] of [
    [-8, 2, -14],
    [0, 0, 0],
    [8, 3, 14],
  ]) {
    const body =
      path("M-20 -2 Q0 22 22 -6 Q24 -9 20 -9 Q0 10 -18 -8Z", "#f2c335") +
      path("M-19 -5 Q0 16 21 -8 Q0 22 -20 -2Z", "#d9a520") +
      rect(19, -12, 5, 5, "#6b4f2a", 'rx="1.5"');
    b += `<g transform="translate(${dx} ${dy}) rotate(${a})">${body}</g>`;
  }
  return tr(x, y, b, s);
}

/** A cookie with chocolate chips. */
export const cookie = (x, y, r = 16) =>
  circle(x, y + 2, r, shade("#c58c4b", 0.2)) +
  circle(x, y, r, "#d49a57") +
  circle(x - r * 0.3, y - r * 0.3, r * 0.45, "#e2b06f", 'opacity=".7"') +
  circle(x - r * 0.35, y + r * 0.1, r * 0.13, "#5a3420") +
  circle(x + r * 0.3, y - r * 0.25, r * 0.13, "#5a3420") +
  circle(x + r * 0.2, y + r * 0.4, r * 0.12, "#5a3420");

/** A white plate seen at a low angle. */
export const plate = (x, y, rx, ry = rx * 0.22) =>
  ellipse(x, y + 3, rx + 2, ry + 2, "#1c2f4a", 'opacity=".12"') +
  ellipse(x, y, rx, ry, "#ffffff") +
  ellipse(x, y + ry * 0.12, rx * 0.72, ry * 0.62, "#eef1f3");

/** Woven basket (front view) with its rim at y; returns the shape only. */
export function basketFront(x, y, w, h) {
  const k = w * 0.12;
  let b =
    contact(x + w / 2, y + h, w * 0.5, 7, 0.2) +
    path(`M${x} ${y} H${x + w} L${x + w - k} ${y + h} H${x + k}Z`, P.wood) +
    path(
      `M${x + w * 0.6} ${y} H${x + w} L${x + w - k} ${y + h} H${x + w * 0.62 - k * 0.4}Z`,
      shade(P.wood, 0.16),
    );
  let d = "";
  for (let i = 1; i < 4; i++) d += `M${x + (k * i) / 4} ${y + (h * i) / 4}H${x + w - (k * i) / 4}`;
  b +=
    stroke(d, shade(P.wood, 0.32), 2, 'opacity=".55"') +
    rrect(x - 6, y - 5, w + 12, 10, 5, light(P.wood, 0.15));
  return b;
}

/** A plant at growth stage 0 seed, 1 sprout, 2 leaves, 3 flower, 4 tomatoes; s scales it. */
export function plant(x, y, stage, s = 1) {
  if (stage === 0)
    return tr(
      x,
      y,
      ellipse(0, 2, 16, 5, P.soilDark, 'opacity=".7"') +
        ellipse(0, -3, 7, 5, "#a06a35") +
        ellipse(-2, -5, 2.6, 1.6, "#d9a66b"),
      s,
    );
  const h = [0, 26, 56, 80, 92][stage];
  let b =
    ellipse(0, 1, 16, 4, P.soilDark, 'opacity=".55"') +
    stroke(`M0 0 Q3 ${-h * 0.5} 0 ${-h}`, P.leafDark, 4.5);
  if (stage === 1) b += leaf(0, -h, 15, -150, P.leafLight) + leaf(0, -h, 15, -30, P.leaf);
  else {
    b +=
      leaf(1, -h * 0.45, 24, -160, P.leafLight) +
      leaf(1, -h * 0.62, 24, -20, P.leaf) +
      leaf(1, -h * 0.82, 18, -150, P.leaf);
    if (stage === 2) b += leaf(0, -h, 15, -110, P.leafLight) + leaf(0, -h, 15, -70, P.leaf);
  }
  if (stage === 3) {
    for (let i = 0; i < 8; i++)
      b += `<g transform="rotate(${i * 45} 0 ${-h})">${ellipse(0, -h - 11, 5.4, 9.5, i % 2 ? "#f2c335" : "#f6d35c")}</g>`;
    b += circle(0, -h, 6.5, "#8a5326") + circle(-1.6, -h - 1.6, 2.2, "#b07a3c");
  }
  if (stage === 4) b += tomato(-11, -h + 14, 10) + tomato(12, -h + 28, 10) + tomato(9, -h + 4, 8);
  return tr(x, y, b, s);
}

/** Raised garden bed: front face from y to y + h. */
export function bed(x, y, w, h = 36) {
  return (
    contact(x + w / 2, y + h, w * 0.52, 6, 0.2) +
    rect(x + 4, y - 6, w - 8, 10, P.soilDark) +
    rect(x, y, w, h, P.wood) +
    rect(x, y, w, 6, light(P.wood, 0.25)) +
    rect(x, y + h - 7, w, 7, shade(P.wood, 0.22)) +
    rect(x + w * 0.5 - 1, y, 2, h, shade(P.wood, 0.25), 'opacity=".6"')
  );
}

/** Rain streaks over the whole scene. */
export function rainfall(n = 46, seed = 5) {
  const R = rng(seed);
  let d = "";
  for (let i = 0; i < n; i++) {
    const x = R() * (W + 40);
    const y = R() * 320;
    d += `M${x.toFixed(0)} ${y.toFixed(0)}l-7 22`;
  }
  return stroke(d, "#eaf3f9", 2.4, 'opacity=".8"');
}

/** Falling snowflakes. */
export function snowfall(n = 34, seed = 8) {
  const R = rng(seed);
  let s = "";
  for (let i = 0; i < n; i++)
    s += circle(
      R() * W,
      R() * 330,
      2.5 + R() * 3.5,
      "#ffffff",
      `opacity="${(0.65 + R() * 0.35).toFixed(2)}"`,
    );
  return s;
}

/** Twinkling stars across the top of a night sky. */
export function starfield(n = 26, seed = 4, bottom = 240) {
  const R = rng(seed);
  let s = "";
  for (let i = 0; i < n; i++) {
    const x = R() * W;
    const y = 12 + R() * bottom;
    const r = 1.6 + R() * 2.4;
    s +=
      i % 4
        ? circle(x, y, r, "#fff4cf", `opacity="${(0.55 + R() * 0.45).toFixed(2)}"`)
        : path(
            `M${x} ${y - r * 2.6} L${x + r * 0.7} ${y - r * 0.7} L${x + r * 2.6} ${y} L${x + r * 0.7} ${y + r * 0.7} L${x} ${y + r * 2.6} L${x - r * 0.7} ${y + r * 0.7} L${x - r * 2.6} ${y} L${x - r * 0.7} ${y - r * 0.7}Z`,
            "#fff4cf",
          );
  }
  return s;
}

/** Wind swooshes (genuine line detail). */
export const wind = (x, y, s = 1) =>
  tr(
    x,
    y,
    stroke("M0 0 q40 -14 80 0 q20 8 30 -6M20 26 q36 -12 72 0", "#ffffff", 4.5, 'opacity=".8"'),
    s,
  );

/** Bare-limbed winter tree with snow on its branches. */
export function snowyTree(x, y, s = 1) {
  const b =
    contact(0, 0, 44, 8, 0.16) +
    path("M-9 0 C-7 -40 -8 -80 -3 -110 L4 -110 C8 -80 7 -40 10 0Z", P.bark) +
    path("M3 -110 C6 -80 7 -40 10 0 L4 0 C3 -40 2 -80 0 -110Z", P.barkDark, 'opacity=".6"') +
    stroke(
      "M-2 -60 Q-30 -80 -48 -112M0 -84 Q30 -100 46 -134M-1 -104 Q-12 -130 -8 -160M-28 -82 Q-44 -88 -60 -84M26 -98 Q44 -96 58 -104",
      P.bark,
      6,
    ) +
    stroke("M-48 -112 q-6 -4 -12 -2M46 -134 q4 -6 2 -14M-8 -160 q4 -6 10 -8", P.bark, 3.5) +
    ellipse(-38, -102, 14, 4.5, "#ffffff") +
    ellipse(36, -122, 14, 4.5, "#ffffff") +
    ellipse(-6, -150, 9, 4, "#ffffff") +
    ellipse(-50, -86, 10, 3.5, "#ffffff") +
    ellipse(50, -102, 10, 3.5, "#ffffff");
  return tr(x, y, b, s);
}

/** Light picket fence (one path per layer, so it stays small). */
export function picket(x0, x1, y, h = 40, color = "#f4efe6") {
  let d = "";
  for (let x = x0; x <= x1; x += 26) d += `M${x} ${y}V${y - h + 7}l8 -7l8 7V${y}Z`;
  return rect(x0, y - h * 0.7, x1 - x0, 6, shade(color, 0.14)) + rect(x0, y - h * 0.3, x1 - x0, 6, shade(color, 0.14)) + path(d, color);
}

/** Library shelf unit with big, countable book spines. */
export function shelf(x, y, w = 170, h = 250, seed = 3) {
  const R = rng(seed);
  const cols = [P.coral, P.teal, P.gold, P.navy, P.blue, P.green, "#e9e2d0", P.orange];
  let b = contact(x + w / 2, y, w * 0.55, 6, 0.18) + rect(x, y - h, w, h, P.woodDark) + rect(x + 8, y - h + 8, w - 16, h - 16, shade(P.woodDark, 0.35));
  const rows = 3;
  const rh = (h - 16) / rows;
  for (let r = 0; r < rows; r++) {
    const base = y - h + 8 + rh * (r + 1);
    let bx = x + 12;
    while (bx < x + w - 26) {
      const bw = 14 + Math.floor(R() * 6);
      const bh = rh * (0.62 + R() * 0.26);
      const c = cols[Math.floor(R() * cols.length)];
      b += rect(bx, base - bh - 6, bw - 2, bh, c) + rect(bx + bw - 6, base - bh - 6, 4, bh, shade(c, 0.2));
      bx += bw;
    }
    b += rect(x + 4, base - 6, w - 8, 8, P.woodDark);
  }
  return b;
}

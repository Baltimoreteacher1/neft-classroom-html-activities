// Illustrator E helpers: props and figures the shared kit lacks, in the kit's art direction
// (no outlines, lit/shade sides, soft contact shadows). Every function returns an SVG string.
import {
  circle,
  clipRect,
  contact,
  ellipse,
  g,
  HAIR,
  haze,
  light,
  line,
  mix,
  P,
  path,
  person,
  poly,
  rect,
  rgrad,
  rng,
  rrect,
  SKIN,
  shade,
  stroke,
  text,
  tr,
  vgrad,
} from "../../../access-practice-lab/src/art/kit.js";

const f = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
const flipX = (x, y, s, facing, body) =>
  `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s * facing)} ${f(s)})">${body}</g>`;

/* ------------------------------------------------------------------ people */

/**
 * One person whose upper body uses `upper` pose and legs use `lower` pose, hips resting at hipY.
 * Lets a seated figure read, point or hug. o = kit person options (pose is ignored).
 */
export function poseMix(x, hipY, h, o, upper = "read", lower = "sit") {
  const child = (o.age || "child") === "child";
  const hipFrac = child ? 0.44 : 0.48;
  const legs = person(x, hipY, h, { ...o, pose: lower });
  const top = person(x, hipY + hipFrac * h, h, { ...o, pose: upper });
  const topNoShadow = top.replace(/^<ellipse[^>]*\/>/, "");
  return (
    clipRect(x - h, hipY - 2, h * 2, h * 1.2, 0, legs) +
    clipRect(x - h, hipY - h * 1.2, h * 2, h * 1.2 + 3, 0, topNoShadow)
  );
}

/** A child sitting cross-legged on the floor (hips at floorY), arms in `upper` pose. */
export function floorSitter(x, floorY, h, o, upper = "read") {
  const child = (o.age || "child") === "child";
  const hipFrac = child ? 0.44 : 0.48;
  const hipY = floorY - h * 0.06;
  const top = person(x, hipY + hipFrac * h, h, { ...o, pose: upper }).replace(
    /^<ellipse[^>]*\/>/,
    "",
  );
  const pants = o.skirt ? o.bottom : o.bottom || P.navy;
  const s = h / 100;
  const shoe = o.shoes || "#2b2f36";
  const legs =
    contact(x, floorY + 1, 30 * s, 5 * s, 0.22) +
    path(
      `M${f(x - 2 * s)} ${f(hipY - 4 * s)} Q${f(x - 26 * s)} ${f(hipY - 4 * s)} ${f(x - 30 * s)} ${f(floorY - 3 * s)} Q${f(x - 10 * s)} ${f(floorY + 2 * s)} ${f(x + 18 * s)} ${f(floorY - 2 * s)} L${f(x + 14 * s)} ${f(hipY - 2 * s)}Z`,
      shade(pants, 0.12),
    ) +
    path(
      `M${f(x + 2 * s)} ${f(hipY - 4 * s)} Q${f(x + 26 * s)} ${f(hipY - 4 * s)} ${f(x + 30 * s)} ${f(floorY - 3 * s)} Q${f(x + 10 * s)} ${f(floorY + 2 * s)} ${f(x - 18 * s)} ${f(floorY - 2 * s)} L${f(x - 14 * s)} ${f(hipY - 2 * s)}Z`,
      pants,
    ) +
    ellipse(x - 20 * s, floorY - 2.5 * s, 6.5 * s, 3.4 * s, shade(shoe, 0.1)) +
    ellipse(x + 20 * s, floorY - 2.5 * s, 6.5 * s, 3.4 * s, shoe);
  return clipRect(x - h, hipY - h * 1.2, h * 2, h * 1.2 + 2 * s, 0, top) + legs;
}

/**
 * A seated student seen from behind (facing away from the viewer, toward the board).
 * (x, y) = seat height at the spine; h = the figure's full standing height.
 */
export function seatedBack(
  x,
  y,
  h,
  { skin = SKIN[2], hair = HAIR[0], hairStyle = "short", top = P.blue, lean = 0 } = {},
) {
  const s = h / 100;
  const hr = 10.6;
  const hy = -50 - lean;
  const sy = -36;
  let b = "";
  // torso (back view), slightly wider at the shoulders
  b += path(
    `M-15 ${sy + 2} Q-16 ${sy - 4} -9 ${sy - 5} L9 ${sy - 5} Q16 ${sy - 4} 15 ${sy + 2} L13 0 L-13 0Z`,
    top,
  );
  b += path(
    `M3 ${sy - 5} L9 ${sy - 5} Q16 ${sy - 4} 15 ${sy + 2} L13 0 L4 0Z`,
    shade(top, 0.16),
    'opacity=".7"',
  );
  b += path(
    `M-15 ${sy + 2} Q-18 ${sy + 10} -17 ${sy + 18} L-12 ${sy + 18} L-11 ${sy + 2}Z`,
    shade(top, 0.08),
  );
  b += path(
    `M15 ${sy + 2} Q18 ${sy + 10} 17 ${sy + 18} L12 ${sy + 18} L11 ${sy + 2}Z`,
    shade(top, 0.2),
  );
  // neck + ears
  b += rect(-3.4, hy + hr - 3, 6.8, 8, shade(skin, 0.2));
  b +=
    circle(-hr * 0.98, hy + 1.5, 2.4, shade(skin, 0.12)) +
    circle(hr * 0.98, hy + 1.5, 2.4, shade(skin, 0.22));
  // head: hair covers the back of the head
  const hairS = shade(hair, 0.18);
  if (hairStyle === "hijab") {
    b += path(
      `M${-hr * 1.25} ${hy} Q${-hr * 1.4} ${hy + hr * 2.1} 0 ${hy + hr * 2.3} Q${hr * 1.4} ${hy + hr * 2.1} ${hr * 1.25} ${hy} A${hr * 1.25} ${hr * 1.25} 0 0 0 ${-hr * 1.25} ${hy}Z`,
      hair,
    );
    b += path(
      `M2 ${hy - hr * 1.2} A${hr * 1.25} ${hr * 1.25} 0 0 1 ${hr * 1.25} ${hy} Q${hr * 1.4} ${hy + hr * 2.1} 2 ${hy + hr * 2.3}Z`,
      hairS,
      'opacity=".55"',
    );
  } else {
    b += circle(0, hy, hr, skin);
    if (hairStyle === "long" || hairStyle === "braid") {
      b += path(
        `M${-hr * 1.05} ${hy} A${hr * 1.05} ${hr * 1.08} 0 0 1 ${hr * 1.05} ${hy} Q${hr * 1.15} ${hy + hr * 1.7} ${hr * 0.7} ${hy + hr * 2.1} L${-hr * 0.7} ${hy + hr * 2.1} Q${-hr * 1.15} ${hy + hr * 1.7} ${-hr * 1.05} ${hy}Z`,
        hair,
      );
    } else if (hairStyle === "curly") {
      for (const [cx, cy] of [
        [-0.6, -0.6],
        [0.1, -0.85],
        [0.7, -0.5],
        [-0.9, 0.05],
        [0.95, 0.1],
        [-0.5, 0.35],
        [0.45, 0.4],
        [0, 0],
      ])
        b += circle(cx * hr, hy + cy * hr, hr * 0.5, hair);
    } else if (hairStyle === "bun" || hairStyle === "puffs") {
      b += path(
        `M${-hr * 1.03} ${hy + hr * 0.3} A${hr * 1.03} ${hr * 1.08} 0 0 1 ${hr * 1.03} ${hy + hr * 0.3} Q0 ${hy + hr * 0.9} ${-hr * 1.03} ${hy + hr * 0.3}Z`,
        hair,
      );
      if (hairStyle === "bun") b += circle(0, hy - hr * 0.55, hr * 0.5, hair);
      else
        b +=
          circle(-hr * 1.0, hy - hr * 0.45, hr * 0.52, hair) +
          circle(hr * 1.0, hy - hr * 0.45, hr * 0.52, hair);
    } else {
      // short
      b += path(
        `M${-hr * 1.04} ${hy + hr * 0.25} A${hr * 1.04} ${hr * 1.08} 0 0 1 ${hr * 1.04} ${hy + hr * 0.25} Q${hr * 0.9} ${hy + hr * 0.8} 0 ${hy + hr * 0.78} Q${-hr * 0.9} ${hy + hr * 0.8} ${-hr * 1.04} ${hy + hr * 0.25}Z`,
        hair,
      );
    }
    b += path(
      `M${hr * 0.15} ${hy - hr * 1.05} A${hr * 1.05} ${hr * 1.08} 0 0 1 ${hr * 1.05} ${hy + hr * 0.3} L${hr * 0.6} ${hy + hr * 0.5}Z`,
      hairS,
      'opacity=".5"',
    );
    b += path(
      `M${-hr * 0.6} ${hy - hr * 0.6} Q${-hr * 0.2} ${hy - hr * 0.95} ${hr * 0.3} ${hy - hr * 0.85}`,
      "none",
      `stroke="${light(hair, 0.4)}" stroke-width="1.3" opacity=".5"`,
    );
  }
  return tr(x, y, b, s);
}

/* ------------------------------------------------------------------ animals */

/** A dog sitting upright, 3/4 view, facing right by default. s=1 ≈ 80 units tall. */
export function sitDog(
  x,
  y,
  s = 1,
  { color = "#a8703f", facing = 1, collar = P.coral, mouth = "smile" } = {},
) {
  const d = shade(color, 0.22);
  const dd = shade(color, 0.36);
  const l = light(color, 0.2);
  let b = contact(0, 0, 36, 6.5, 0.22);
  b += stroke("M-26 -4 Q-46 -4 -50 -22", d, 7); // tail resting behind
  b += ellipse(-14, -22, 22, 22, d); // far haunch
  b += path("M-30 -6 Q-34 -36 -8 -50 Q6 -60 18 -62 L30 -46 Q28 -20 22 0 L-24 0Z", color); // body
  b += path("M14 -60 Q30 -54 30 -40 Q29 -30 27 -24 L16 -30 Q18 -44 14 -60Z", l, 'opacity=".5"'); // lit chest
  b +=
    ellipse(-16, -18, 19, 18, color) +
    path("M-34 -16 Q-30 -36 -14 -36 Q-26 -26 -26 -6Z", d, 'opacity=".45"'); // near haunch
  b += ellipse(-8, -3, 12, 4.2, shade(color, 0.05)) + ellipse(-4, -4, 6, 2, l, 'opacity=".6"'); // hind paw
  b += path("M4 -36 L3 -2 h8 L13 -36Z", dd) + ellipse(7, -1.5, 6.5, 3.2, dd); // far front leg
  b += path("M18 -38 L18 -2 h9 L28 -38Z", color) + ellipse(23, -1.5, 7.5, 3.4, l); // near front leg
  // head
  b += path("M12 -74 Q2 -66 4 -52 Q8 -46 12 -50 Q12 -62 16 -70Z", dd); // far ear
  b += circle(24, -76, 16, color);
  b += path("M30 -90 A16 16 0 0 1 40 -72 L30 -70Z", d, 'opacity=".35"');
  b += ellipse(37, -70, 11, 8, l); // muzzle
  b += ellipse(46, -73, 3.6, 2.8, P.ink) + circle(45, -74, 1, "#ffffff", 'opacity=".6"');
  b += circle(29, -80, 2.3, P.ink) + circle(29.7, -80.7, 0.7, "#ffffff");
  b +=
    mouth === "open"
      ? path("M35 -65 Q40 -60 45 -65 Q42 -62 38 -63Z", "#7a2f2a") +
        ellipse(40, -61, 2.6, 2, P.coralLight)
      : stroke("M36 -65 Q40 -62 44 -66", dd, 1.6);
  b += path("M12 -86 Q2 -84 6 -64 Q10 -56 16 -62 Q18 -74 20 -84Z", d); // near ear (floppy)
  if (collar)
    b +=
      path("M10 -58 Q22 -52 32 -58 L32 -54 Q22 -48 10 -54Z", collar) +
      circle(22, -50, 2.4, P.goldLight);
  return flipX(x, y, s, facing, b);
}

/** A cat sitting upright, 3/4 view, facing right by default. s=1 ≈ 70 units tall. */
export function sitCat(x, y, s = 1, { color = "#e8954a", facing = 1 } = {}) {
  const d = shade(color, 0.24);
  const l = light(color, 0.3);
  let b = contact(0, 0, 26, 5, 0.22);
  b += path("M-16 -2 Q-40 -2 -40 -20 Q-40 -34 -30 -36 Q-34 -28 -32 -20 Q-30 -8 -12 -8Z", d); // tail curled round
  b += path("M-20 0 Q-26 -30 -6 -44 Q4 -50 12 -48 Q22 -34 18 0Z", color); // body pear
  b += path("M6 -46 Q20 -36 18 0 L8 0 Q12 -24 6 -46Z", l, 'opacity=".55"'); // lit chest
  b += path("M-20 0 Q-24 -18 -14 -28 Q-10 -12 -4 0Z", d, 'opacity=".5"');
  b += stroke(
    "M-14 -34 Q-8 -30 -2 -34M-18 -24 Q-10 -20 -4 -24M-20 -14 Q-12 -10 -6 -14",
    d,
    2.6,
    'opacity=".65"',
  ); // stripes
  b += path("M4 -30 L3 -2 h7 L11 -30Z", d) + path("M11 -30 L11 -2 h7 L18 -30Z", color);
  b += ellipse(7, -1.5, 5, 2.4, d) + ellipse(15, -1.5, 5.4, 2.6, l);
  // head
  b += circle(8, -58, 14, color);
  b +=
    poly(
      [
        [-4, -64],
        [-3, -82],
        [8, -70],
      ],
      color,
    ) +
    poly(
      [
        [-1, -67],
        [-1, -77],
        [5, -70],
      ],
      P.coralLight,
      'opacity=".7"',
    );
  b +=
    poly(
      [
        [12, -70],
        [24, -80],
        [22, -62],
      ],
      color,
    ) +
    poly(
      [
        [14, -69],
        [22, -76],
        [21, -65],
      ],
      P.coralLight,
      'opacity=".7"',
    );
  b += path(
    "M8 -72 L8 -66M3 -71 L4 -66M13 -71 L12 -66",
    "none",
    `stroke="${d}" stroke-width="1.8"`,
  );
  b += ellipse(14, -53, 8, 6, l);
  b +=
    ellipse(6, -59, 2.2, 2.8, P.ink) +
    ellipse(17, -59, 2.2, 2.8, P.ink) +
    circle(6.6, -60, 0.7, "#ffffff") +
    circle(17.6, -60, 0.7, "#ffffff");
  b += path("M11 -54 l2.6 2.4 l2.6 -2.4Z", P.coral);
  b += stroke("M13.6 -51.5 Q11 -49 9 -50M13.6 -51.5 Q16 -49 18 -50", shade(color, 0.5), 1);
  b += stroke("M20 -53 h11M20 -51 l10 3M6 -53 h-9", "#ffffff", 0.9, 'opacity=".75"');
  return flipX(x, y, s, facing, b);
}

/* ------------------------------------------------------------------ rooms */

/** Back wall + floor for an interior; floorY is where they meet. */
export function room(w, h, floorY, { wall = P.wall, floor = "floor", base = "#e7d5b8" } = {}) {
  const floorC = {
    floor: ["#e2c294", "#d4b183", "#c49f70"],
    tile: ["#e3e1da", "#d6d3ca", "#c3bfb4"],
    carpet: ["#9fb8c4", "#8aa7b5", "#7896a5"],
  }[floor];
  let s = rect(
    0,
    0,
    w,
    floorY,
    vgrad([
      [0, mix(wall, "#ffffff", 0.18)],
      [1, shade(wall, 0.04)],
    ]),
  );
  s += rect(
    0,
    floorY,
    w,
    h - floorY,
    vgrad([
      [0, floorC[0]],
      [0.5, floorC[1]],
      [1, floorC[2]],
    ]),
  );
  if (floor === "floor") {
    let d = "";
    for (let i = 1; i < 6; i++) d += `M0 ${f(floorY + (h - floorY) * (i / 6) ** 1.3)}H${w}`;
    s += stroke(d, "#a9804f", 1.1, 'opacity=".28"');
  }
  if (floor === "tile") {
    let d = "";
    for (let i = 1; i < 5; i++) d += `M0 ${f(floorY + (h - floorY) * (i / 5) ** 1.4)}H${w}`;
    for (let i = -6; i <= 16; i++)
      d += `M${f(w / 2 + (i - 5) * 60)} ${floorY}L${f(w / 2 + (i - 5) * 150)} ${h}`;
    s += stroke(d, "#a6a296", 1, 'opacity=".35"');
  }
  s += rect(0, floorY - 8, w, 9, base) + rect(0, floorY, w, 2, shade(base, 0.25), 'opacity=".5"');
  return s;
}

/** Soft window light falling across a wall/floor. */
export const lightShaft = (pts, o = 0.18) => poly(pts, "#fff3d6", `opacity="${o}"`);

/** Wall clock with ticks; hands at h:m. */
export function wallClock(x, y, r = 18, { hr = 10, min = 10 } = {}) {
  let b =
    circle(x + 1.5, y + 2, r + 3, "#1c2f4a", 'opacity=".14"') +
    circle(x, y, r + 3, P.navy) +
    circle(x, y, r, "#fffdf7") +
    path(
      `M${x} ${y - r} A${r} ${r} 0 0 1 ${x} ${y + r} A${r * 0.8} ${r} 0 0 0 ${x} ${y - r}Z`,
      "#e7e2d6",
      'opacity=".55"',
    );
  let d = "";
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const r0 = i % 3 ? r * 0.82 : r * 0.72;
    d += `M${f(x + Math.sin(a) * r0)} ${f(y - Math.cos(a) * r0)}L${f(x + Math.sin(a) * r * 0.9)} ${f(y - Math.cos(a) * r * 0.9)}`;
  }
  b += stroke(d, P.ink, r * 0.07);
  const ha = (((hr % 12) + min / 60) / 12) * Math.PI * 2;
  const ma = (min / 60) * Math.PI * 2;
  b +=
    line(x, y, x + Math.sin(ha) * r * 0.48, y - Math.cos(ha) * r * 0.48, P.ink, r * 0.12) +
    line(x, y, x + Math.sin(ma) * r * 0.72, y - Math.cos(ma) * r * 0.72, P.ink, r * 0.08) +
    circle(x, y, r * 0.09, P.coral);
  return g(b);
}

/** A whiteboard with a lesson sketched on it (lines, a circle) — no readable words. */
export function whiteboard(x, y, w, h, { marks = true } = {}) {
  let b = rect(x - 2, y + 4, w + 12, h + 12, "#1c2f4a", 'opacity=".12"');
  b += rect(x - 6, y - 6, w + 12, h + 12, "#a9b2bb") + rect(x - 6, y + h, w + 12, 6, "#8d97a1");
  b += rect(
    x,
    y,
    w,
    h,
    vgrad([
      [0, "#ffffff"],
      [1, "#eef2f4"],
    ]),
  );
  b += poly(
    [
      [x + w * 0.55, y],
      [x + w * 0.7, y],
      [x + w * 0.45, y + h],
      [x + w * 0.3, y + h],
    ],
    "#ffffff",
    'opacity=".6"',
  );
  b += rrect(x + 12, y + h + 6, w - 24, 5, 2, "#7f8994");
  b +=
    rrect(x + w * 0.2, y + h + 2, 14, 4, 2, P.blue) +
    rrect(x + w * 0.2 + 18, y + h + 2, 14, 4, 2, P.coral);
  if (marks) {
    b += stroke(
      `M${x + w * 0.08} ${y + h * 0.26} q${w * 0.05} -${h * 0.12} ${w * 0.1} 0 t${w * 0.1} 0 t${w * 0.1} 0`,
      P.blue,
      3.2,
    );
    b +=
      line(x + w * 0.08, y + h * 0.5, x + w * 0.5, y + h * 0.5, P.blue, 3) +
      line(x + w * 0.08, y + h * 0.68, x + w * 0.38, y + h * 0.68, P.coral, 3);
    b += circle(
      x + w * 0.74,
      y + h * 0.46,
      h * 0.2,
      "none",
      `stroke="${P.teal}" stroke-width="3.4"`,
    );
    b += line(x + w * 0.74, y + h * 0.46, x + w * 0.74 + h * 0.2, y + h * 0.46, P.teal, 2);
  }
  return g(b);
}

/** Interior door, closed, with a small window. */
export function door(
  x,
  y,
  w = 70,
  h = 150,
  { color = P.teal, frame = "#e8dcc6", glass = true } = {},
) {
  let b =
    rect(x - 7, y - h - 7, w + 14, h + 7, frame) +
    rect(x + w, y - h - 7, 7, h + 7, shade(frame, 0.12));
  b +=
    rect(x, y - h, w, h, color) +
    rect(x + w * 0.62, y - h, w * 0.38, h, shade(color, 0.1), 'opacity=".7"');
  if (glass)
    b +=
      rect(x + w * 0.22, y - h + 18, w * 0.56, h * 0.28, "#cfe4ec") +
      poly(
        [
          [x + w * 0.3, y - h + 18 + h * 0.28],
          [x + w * 0.5, y - h + 18],
          [x + w * 0.6, y - h + 18],
          [x + w * 0.4, y - h + 18 + h * 0.28],
        ],
        "#ffffff",
        'opacity=".45"',
      );
  b +=
    rrect(x + w * 0.8, y - h * 0.48, 6, 14, 3, P.goldLight) +
    rect(x + w * 0.8, y - h * 0.48 + 6, 2, 2, shade(P.gold, 0.3));
  return g(b);
}

/** A desk seen from behind/front at eye level from the back of the room; top at y - h. */
export function schoolDesk(x, y, w = 100, h = 48, { color = P.woodLight, depth = 10 } = {}) {
  let b = contact(x + w / 2, y, w * 0.55, 5, 0.18);
  b += rect(x + 6, y - h, 5, h, "#6c7681") + rect(x + w - 11, y - h, 5, h, "#5d6772");
  b +=
    rect(x + 12, y - h + depth - 2, 4, h - depth, "#7d8792", 'opacity=".8"') +
    rect(x + w - 16, y - h + depth - 2, 4, h - depth, "#7d8792", 'opacity=".8"');
  b += poly(
    [
      [x + 6, y - h - depth],
      [x + w - 6, y - h - depth],
      [x + w, y - h],
      [x, y - h],
    ],
    light(color, 0.15),
  );
  b +=
    rect(x, y - h, w, 6, shade(color, 0.12)) +
    rect(x, y - h + 6, w, 2, shade(color, 0.35), 'opacity=".5"');
  return g(b);
}

/** A school chair seen from behind (its back toward the viewer); seat at y - 40. */
export function chairBack(x, y, { color = P.teal, w = 40 } = {}) {
  let b = contact(x, y, w * 0.5, 4, 0.18);
  b +=
    rect(x - w / 2 + 3, y - 40, 4, 40, "#5d6772") + rect(x + w / 2 - 7, y - 40, 4, 40, "#4e5761");
  b += rect(x - 2, y - 58, 4, 18, "#5d6772");
  b += rrect(x - w / 2, y - 44, w, 7, 3, shade(color, 0.15));
  b +=
    rrect(x - w / 2 + 2, y - 82, w - 4, 26, 6, color) +
    rrect(x - w / 2 + 5, y - 79, w - 10, 6, 3, light(color, 0.25), 'opacity=".7"') +
    rrect(x + 4, y - 82, w / 2 - 6, 26, 6, shade(color, 0.12), 'opacity=".6"');
  return g(b);
}

/** Tall bookshelf with spines; leaning books and a plant on top. */
export function shelf(
  x,
  y,
  w = 120,
  h = 170,
  { seed = 9, color = P.woodDark, shelves = 4, top = true } = {},
) {
  const R = rng(seed);
  let b = contact(x + w / 2, y, w * 0.55, 5, 0.18);
  b += rect(x, y - h, w, h, color) + rect(x + w - 8, y - h, 8, h, shade(color, 0.2));
  b += rect(x + 6, y - h + 6, w - 14, h - 12, shade(color, 0.32));
  const sh = (h - 12) / shelves;
  const cols = [
    P.coral,
    P.teal,
    P.gold,
    P.navy,
    P.blue,
    P.purple,
    P.green,
    "#e9e2d0",
    P.orange,
    "#7d9aa8",
  ];
  for (let i = 0; i < shelves; i++) {
    const sy = y - h + 6 + sh * (i + 1) - 4;
    let bx = x + 8;
    while (bx < x + w - 18) {
      const bw = 6 + R() * 6;
      const bh = sh * (0.6 + R() * 0.28);
      const c = cols[Math.floor(R() * cols.length)];
      if (R() < 0.08 && bx < x + w - 34) {
        b += `<g transform="rotate(14 ${f(bx)} ${f(sy)})">${rect(bx, sy - bh, bw, bh, c)}</g>`;
        bx += bw + 6;
        continue;
      }
      b +=
        rect(bx, sy - bh, bw - 1, bh, c) +
        rect(bx + 1, sy - bh + 4, bw - 3, 2, light(c, 0.45), 'opacity=".7"') +
        rect(bx + bw - 3, sy - bh, 2, bh, shade(c, 0.2), 'opacity=".6"');
      bx += bw;
    }
    b +=
      rect(x + 4, sy, w - 10, 5, light(color, 0.12)) +
      rect(x + 4, sy + 5, w - 10, 2, shade(color, 0.4), 'opacity=".5"');
  }
  b += rect(x - 3, y - h - 5, w + 6, 7, light(color, 0.1));
  if (top) b += plantPot(x + w - 22, y - h - 5, 0.55);
  return g(b);
}

/** A small potted plant (pot base at x,y). */
export function plantPot(
  x,
  y,
  s = 1,
  { pot = "#c8704f", leaf = P.leaf, soil = true, sprout = false } = {},
) {
  let b = contact(0, 0, 26, 4, 0.2);
  b +=
    path("M-22 -38 L22 -38 L16 0 L-16 0Z", pot) +
    path("M4 -38 L22 -38 L16 0 L6 0Z", shade(pot, 0.18), 'opacity=".7"');
  b +=
    rrect(-25, -44, 50, 10, 3, light(pot, 0.12)) +
    rect(4, -44, 21, 10, shade(pot, 0.12), 'opacity=".6"');
  if (soil) b += ellipse(0, -44, 21, 4, P.soilDark);
  if (sprout) {
    b += stroke("M0 -44 Q-2 -64 2 -84", P.leafDark, 3.2);
    const lf = (x0, y0, dx, dy, c) =>
      path(
        `M${x0} ${y0} Q${x0 + dx * 0.4} ${y0 + dy - 8} ${x0 + dx} ${y0 + dy} Q${x0 + dx * 0.6} ${y0 + dy + 8} ${x0} ${y0}Z`,
        c,
      );
    b +=
      lf(0, -56, -24, -10, shade(leaf, 0.12)) +
      lf(1, -64, 26, -12, leaf) +
      lf(1, -76, -20, -14, leaf) +
      lf(2, -82, 16, -16, light(leaf, 0.15)) +
      lf(0, -50, 20, -2, shade(leaf, 0.2));
  } else {
    for (const [a, l, c] of [
      [-40, 34, shade(leaf, 0.15)],
      [-15, 40, leaf],
      [15, 38, leaf],
      [42, 30, shade(leaf, 0.1)],
      [0, 30, light(leaf, 0.18)],
    ]) {
      const r = (a * Math.PI) / 180;
      const ex = Math.sin(r) * l;
      const ey = -44 - Math.cos(r) * l;
      b += path(
        `M0 -44 Q${f(ex * 0.2 - 8)} ${f((ey - 44) / 2)} ${f(ex)} ${f(ey)} Q${f(ex * 0.8 + 8)} ${f((ey - 44) / 2 + 4)} 0 -44Z`,
        c,
      );
    }
  }
  return tr(x, y, b, s);
}

/** An open book held upright toward the viewer (centre x,y). */
export function openBook(x, y, w = 34, { cover = P.blue, tilt = 0 } = {}) {
  const h = w * 0.62;
  let b = path(
    `M0 ${h * 0.12} L${-w / 2 - 2} ${-2} L${-w / 2 - 2} ${h + 2} L0 ${h + 4} L${w / 2 + 2} ${h + 2} L${w / 2 + 2} -2Z`,
    cover,
  );
  b += path(
    `M0 ${h * 0.12} Q${-w * 0.25} ${-h * 0.08} ${-w / 2} 0 L${-w / 2} ${h} Q${-w * 0.25} ${h * 0.92} 0 ${h + 2}Z`,
    "#fbf7ee",
  );
  b += path(
    `M0 ${h * 0.12} Q${w * 0.25} ${-h * 0.08} ${w / 2} 0 L${w / 2} ${h} Q${w * 0.25} ${h * 0.92} 0 ${h + 2}Z`,
    "#efe8d8",
  );
  let d = "";
  for (let i = 0; i < 4; i++) {
    const yy = h * (0.25 + i * 0.17);
    d += `M${-w * 0.42} ${f(yy)}h${f(w * 0.3)}M${w * 0.1} ${f(yy)}h${f(w * 0.3)}`;
  }
  b += stroke(d, "#a8b3bf", 1.2, 'opacity=".8"');
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${tilt})">${b}</g>`;
}

/* ------------------------------------------------------------------ outdoor props */

/** Small potted school-street / park light post etc. not needed; a park lamp. */
export function lamp(x, y, h = 120) {
  return g(
    contact(x, y, 10, 3, 0.2) +
      rect(x - 2.5, y - h, 5, h, "#3e4a5c") +
      rrect(x - 6, y - 6, 12, 6, 2, "#3e4a5c") +
      path(
        `M${x - 9} ${y - h} L${x + 9} ${y - h} L${x + 6} ${y - h - 16} L${x - 6} ${y - h - 16}Z`,
        "#fff2c4",
      ) +
      rect(x - 10, y - h - 20, 20, 5, "#3e4a5c"),
  );
}

export { text };

/** Sad mouth (a downturned arc) drawn over a kit person() face drawn with mouth: "flat". Same x, y, h, age, facing, skin. */
export function frown(x, y, h, { age = "child", facing = 1, skin = SKIN[2] } = {}) {
  const s = h / 100;
  const hr = (age === "child" ? 13 : 10.2) * s;
  const hy = y - (100 - (age === "child" ? 13 : 10.2)) * s;
  const fx = x + facing * hr * 0.28;
  const my = hy + hr * 0.5;
  return (
    ellipse(fx + facing * hr * 0.02, my + hr * 0.04, hr * 0.26, hr * 0.12, skin) +
    stroke(
      `M${f(fx - hr * 0.19)} ${f(my + hr * 0.14)} Q${f(fx + facing * hr * 0.02)} ${f(my - hr * 0.08)} ${f(fx + hr * 0.23)} ${f(my + hr * 0.14)}`,
      shade(skin, 0.55),
      hr * 0.09,
    )
  );
}

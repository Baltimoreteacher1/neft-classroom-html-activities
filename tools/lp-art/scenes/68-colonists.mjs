import {
  circle,
  cloud,
  contact,
  ellipse,
  g,
  ground,
  HAIR,
  haze,
  hills,
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
  sky,
  stroke,
  sun,
  tr,
  tree,
  tuft,
  vgrad,
} from "../../../access-practice-lab/src/art/kit.js";

// Colonial settlement, early 1600s (Jamestown style): a small timber-framed house with a thatched roof
// and a wooden chimney; a woman in a linen coif and apron cooks in an iron pot over an open fire; a fenced
// garden of corn and squash grows nearby; a man carries firewood; behind them a pair of oxen and the
// log palisade wall of the fort. Plain, period-plausible clothing; no caricature.

const palisade = (x0, x1, y, h = 58) => {
  let b = rect(x0, y - 6, x1 - x0, 8, haze("#6b5236", 0.25));
  for (let x = x0; x < x1; x += 9) {
    const hh = h - ((x * 7) % 9);
    const c = haze(x % 18 ? "#8a6a46" : "#76583a", 0.22);
    b +=
      path(`M${x} ${y} V${y - hh} L${x + 4.5} ${y - hh - 8} L${x + 9} ${y - hh} V${y}Z`, c) +
      rect(x + 6.5, y - hh, 2.5, hh, shade(c, 0.2), 'opacity=".6"');
  }
  return b;
};

const house = (x, y) => {
  const wall = "#d9c8a4";
  const timber = "#6b4a30";
  let b = contact(x + 90, y, 110, 8, 0.22);
  b +=
    rect(x, y - 78, 180, 78, wall) +
    rect(x + 130, y - 78, 50, 78, shade(wall, 0.12), 'opacity=".7"');
  // timber frame
  b += stroke(
    `M${x} ${y - 76}H${x + 180}M${x} ${y - 40}H${x + 180}M${x + 2} ${y}V${y - 78}M${x + 60} ${y}V${y - 78}M${x + 120} ${y}V${y - 78}M${x + 178} ${y}V${y - 78}M${x + 2} ${y - 40}L${x + 30} ${y - 76}M${x + 178} ${y - 40}L${x + 150} ${y - 76}`,
    timber,
    5,
  );
  // thatched roof
  b += path(
    `M${x - 14} ${y - 74} L${x + 50} ${y - 150} L${x + 130} ${y - 150} L${x + 194} ${y - 74}Z`,
    "#c9a25a",
  );
  b += path(
    `M${x + 120} ${y - 150} L${x + 130} ${y - 150} L${x + 194} ${y - 74} L${x + 150} ${y - 74}Z`,
    shade("#c9a25a", 0.18),
    'opacity=".8"',
  );
  let d = "";
  for (let i = 0; i < 16; i++) d += `M${x - 6 + i * 12.5} ${y - 76}l${8 - i * 0.6} -12`;
  b +=
    stroke(d, shade("#c9a25a", 0.3), 1.6, 'opacity=".6"') +
    rect(x - 14, y - 78, 208, 6, shade("#c9a25a", 0.25));
  // wooden chimney daubed with clay
  b +=
    rect(x + 140, y - 176, 24, 60, "#8a6a48") +
    stroke(
      `M${x + 140} ${y - 166}h24M${x + 140} ${y - 152}h24M${x + 140} ${y - 138}h24`,
      "#6b4a30",
      2,
    ) +
    rect(x + 136, y - 182, 32, 8, "#7a5a3c");
  b += stroke(
    `M${x + 152} ${y - 186} q-10 -14 2 -26 q10 -12 -2 -26`,
    "#ece6dc",
    6,
    'opacity=".55"',
  );
  // door + shuttered window
  b +=
    rect(x + 72, y - 56, 34, 56, "#5a3b26") +
    rect(x + 72, y - 56, 34, 4, "#7a5236") +
    circle(x + 100, y - 28, 2, "#2a1d17");
  b +=
    rect(x + 22, y - 66, 26, 22, "#3b2c20") +
    rect(x + 10, y - 66, 12, 22, "#7a5236") +
    rect(x + 48, y - 66, 12, 22, "#7a5236");
  b += rect(x + 136, y - 66, 26, 22, "#3b2c20");
  return b;
};

const ox = (x, y, s, { color = "#8a5a34", facing = 1 } = {}) => {
  const d = shade(color, 0.25);
  let b = contact(0, 0, 60, 8, 0.2);
  b += stroke("M-40 -30 L-44 0M-22 -26 L-24 0M30 -28 L32 0M44 -28 L48 0", d, 9);
  b += path(
    "M-58 -50 Q-60 -78 -30 -80 L36 -82 Q56 -82 58 -60 Q58 -30 40 -26 L-44 -24 Q-58 -26 -58 -50Z",
    color,
  );
  b += path("M-50 -30 Q0 -20 50 -30 L44 -24 L-44 -22Z", d, 'opacity=".6"');
  b += path("M20 -82 Q30 -92 44 -84Z", color);
  b += stroke("M-58 -62 Q-70 -56 -68 -36", d, 4) + ellipse(-68, -34, 3, 5, "#3a2a1c");
  b += stroke("M-40 -30 L-40 0M-22 -26 L-20 0M30 -28 L28 0M44 -28 L44 0", color, 9);
  // head + horns
  b +=
    path("M52 -74 L76 -66 Q84 -50 76 -40 L64 -38 Q54 -50 52 -74Z", color) +
    ellipse(76, -42, 8, 6, light(color, 0.25));
  b += stroke("M58 -74 Q52 -90 42 -92M64 -74 Q72 -90 82 -90", "#efe4cc", 4);
  b += circle(64, -60, 2.2, "#2a1d17");
  return `<g transform="translate(${x} ${y}) scale(${s * facing} ${s})">${b}</g>`;
};

const yoke = (x, y, s) =>
  tr(
    x,
    y,
    rrect(-8, -84, 20, 8, 3, "#6b4a30") + stroke("M-4 -76 v14M8 -76 v14", "#4a3322", 2.5),
    s,
  );

const fire = (x, y) =>
  tr(
    x,
    y,
    contact(0, 2, 34, 6, 0.25) +
      // tripod and pot
      stroke("M-30 4 L0 -70 L30 4M0 -70 L6 8", "#4a3322", 4) +
      stroke("M0 -70 V-50", "#2a2a2a", 2) +
      path("M-20 -50 h40 q2 26 -20 30 q-22 -4 -20 -30Z", "#2f3337") +
      ellipse(0, -50, 20, 5, "#454a50") +
      ellipse(0, -51, 15, 3, "#b98457") +
      // logs + flames
      stroke("M-24 2 L20 -6M-18 -6 L24 2", "#6b4a30", 7) +
      path(
        "M-14 -2 Q-18 -18 -6 -28 Q-6 -16 0 -14 Q2 -30 10 -36 Q8 -20 16 -14 Q20 -4 12 0Z",
        P.orange,
      ) +
      path("M-6 -2 Q-8 -12 0 -18 Q2 -10 6 -10 Q10 -4 6 0Z", P.yellow) +
      circle(
        0,
        -14,
        26,
        rgrad([
          [0, "#ffd27a", 0.35],
          [1, "#ffd27a", 0],
        ]),
      ),
  );

const garden = (x, y, w, h) => {
  let b = path(`M${x} ${y} L${x + w} ${y} L${x + w + 16} ${y + h} L${x - 16} ${y + h}Z`, "#7a5636");
  for (let i = 1; i < 4; i++)
    b += stroke(`M${x - 4 * i} ${y + (h / 4) * i}H${x + w + 4 * i}`, "#5e4029", 3, 'opacity=".6"');
  // corn stalks in the back row, squash in front
  for (let i = 0; i < 6; i++) {
    const cx = x + 10 + i * ((w - 20) / 5);
    b +=
      stroke(`M${cx} ${y + 6} V${y - 46}`, P.leafDark, 3) +
      path(`M${cx} ${y - 16} q-16 -6 -20 4 q10 -2 20 -4Z`, P.leaf) +
      path(`M${cx} ${y - 30} q16 -6 20 4 q-10 -2 -20 -4Z`, P.leafLight) +
      rrect(cx + 1, y - 40, 5, 12, 2.5, P.goldLight);
  }
  for (let i = 0; i < 5; i++) {
    const cx = x - 4 + i * ((w + 8) / 4);
    b +=
      ellipse(cx, y + h * 0.62, 12, 7, P.leaf) +
      ellipse(cx + 6, y + h * 0.7, 7, 5.5, P.orange) +
      ellipse(cx + 4, y + h * 0.68, 2.5, 1.5, "#fff3d6", 'opacity=".6"');
  }
  // wattle fence on the front edge
  let f = "";
  for (let i = 0; i <= 10; i++) f += `M${x - 16 + i * ((w + 32) / 10)} ${y + h + 4}V${y + h - 18}`;
  b +=
    stroke(f, "#6b4a30", 3) +
    stroke(
      `M${x - 16} ${y + h - 6}H${x + w + 16}M${x - 16} ${y + h - 13}H${x + w + 16}`,
      "#8a6a48",
      3,
    );
  return b;
};

// period headwear drawn over the kit figure's head (adult, facing right): head centre and radius from person()
const head = (x, y, h) => ({ hx: x, hy: y - (100 - 10.2) * (h / 100), r: 10.2 * (h / 100) });
const coif = (x, y, h, facing = 1) => {
  const { hx, hy, r } = head(x, y, h);
  return `<g transform="translate(${hx} ${hy}) scale(${facing} 1)">${path(`M${-r * 1.12} ${r * 0.35} Q${-r * 1.25} ${-r * 1.15} 0 ${-r * 1.18} Q${r * 1.0} ${-r * 1.15} ${r * 0.95} ${-r * 0.25} Q${r * 0.4} ${-r * 0.5} ${-r * 0.2} ${-r * 0.35} Q${-r * 0.55} ${r * 0.4} ${-r * 0.7} ${r * 0.9} Z`, "#f7f3ea")}${path(`M${-r * 1.12} ${r * 0.35} Q${-r * 1.0} ${r * 1.0} ${-r * 0.6} ${r * 1.0} L${-r * 0.7} ${r * 0.9}Z`, "#e3dccd")}</g>`;
};
const hat = (x, y, h, facing = 1, c = "#3b3026") => {
  const { hx, hy, r } = head(x, y, h);
  return `<g transform="translate(${hx} ${hy}) scale(${facing} 1)">${ellipse(0, -r * 0.55, r * 1.75, r * 0.32, shade(c, 0.1))}${path(`M${-r * 0.9} ${-r * 0.55} Q${-r * 0.95} ${-r * 1.7} 0 ${-r * 1.75} Q${r * 0.95} ${-r * 1.7} ${r * 0.9} ${-r * 0.55}Z`, c)}${rect(-r * 0.92, -r * 0.82, r * 1.84, r * 0.22, "#6b4a30")}</g>`;
};
// a long period skirt over the kit legs (adult), waist to ankle
const longSkirt = (x, y, h, c) => {
  const s = h / 100;
  return (
    path(
      `M${x - 11 * s} ${y - 52 * s} L${x + 11 * s} ${y - 52 * s} L${x + 22 * s} ${y - 2 * s} Q${x} ${y + 2 * s} ${x - 22 * s} ${y - 2 * s}Z`,
      c,
    ) +
    path(
      `M${x + 2 * s} ${y - 52 * s} L${x + 11 * s} ${y - 52 * s} L${x + 22 * s} ${y - 2 * s} L${x + 8 * s} ${y}Z`,
      shade(c, 0.18),
      'opacity=".7"',
    ) +
    path(
      `M${x - 7 * s} ${y - 50 * s} L${x + 8 * s} ${y - 50 * s} L${x + 13 * s} ${y - 6 * s} L${x - 12 * s} ${y - 6 * s}Z`,
      "#efe8da",
    )
  );
};

const firewood = () =>
  stroke("M-6 -4 L44 -10M-4 4 L46 -2M-2 -12 L42 -18", "#7a5236", 7) +
  stroke("M-6 -4 L44 -10M-4 4 L46 -2M-2 -12 L42 -18", "#a57a50", 2.5, 'opacity=".6"') +
  circle(44, -10, 3.4, "#d9b98f") +
  circle(46, -2, 3.4, "#d9b98f") +
  circle(42, -18, 3.4, "#d9b98f");

export default {
  file: "68-colonists.svg",
  w: 640,
  h: 400,
  title:
    "Colonists in the 1600s. A woman cooks over a fire outside a small wooden house. A garden grows nearby and a man carries firewood. Behind them, a man leads two oxen beside a wooden fort wall.",
  draw: () => {
    const W = { x: 116, y: 356, h: 158 };
    const M = { x: 432, y: 374, h: 160 };
    return (
      sky(640, 240, "morning") +
      cloud(470, 52, 0.7) +
      cloud(130, 40, 0.5) +
      hills(640, 214, { seed: 8, amp: 16, color: "#6f9e5a" }) +
      [30, 64, 590, 622]
        .map((x, i) =>
          tree(x, 220, 0.55 + (i % 2) * 0.1, { kind: "pine", tone: haze("#2f6b4f", 0.4) }),
        )
        .join("") +
      ground(640, 212, 188, "grass") +
      palisade(300, 640, 238) +
      // fort corner bulwark
      palisade(270, 312, 242, 66) +
      house(46, 290) +
      // oxen pair under a yoke, in the middle distance
      ox(562, 290, 0.66, { color: "#9a6a40", facing: -1 }) +
      ox(578, 298, 0.7, { color: "#7a4e2e", facing: -1 }) +
      yoke(528, 298, 0.7) +
      person(482, 300, 104, {
        pose: "point",
        age: "adult",
        skin: SKIN[2],
        hair: HAIR[1],
        hairStyle: "short",
        top: "#7a6a52",
        bottom: "#4a3f34",
        facing: 1,
      }) +
      hat(482, 300, 104, 1, "#4a3c2e") +
      garden(236, 300, 96, 30) +
      fire(198, 358) +
      // woman cooking: linen coif, bodice, apron, long skirt; stirring the pot with a long wooden spoon
      person(W.x, W.y, W.h, {
        pose: "hold",
        age: "adult",
        skin: SKIN[0],
        hair: HAIR[2],
        hairStyle: "short",
        top: "#6e3b46",
        bottom: "#3e4a5c",
        facing: 1,
      }) +
      longSkirt(W.x, W.y, W.h, "#3e4a5c") +
      coif(W.x, W.y, W.h) +
      stroke("M170 266 L200 306", "#a57a50", 4) +
      // man carrying firewood: hat, doublet, breeches
      person(M.x, M.y, M.h, {
        pose: "carry",
        age: "adult",
        skin: SKIN[1],
        hair: HAIR[1],
        hairStyle: "short",
        top: "#5f6b4e",
        bottom: "#4a3f34",
        facing: -1,
        beard: HAIR[1],
        item: tr(-10, -6, firewood()),
      }) +
      hat(M.x, M.y, M.h, -1) +
      tuft(24, 392, 1.2) +
      tuft(614, 396) +
      tuft(400, 392, 0.9)
    );
  },
};

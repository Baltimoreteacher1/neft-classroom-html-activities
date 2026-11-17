// Book Studio characters (200x300 full body), drawn with the illustration kit in flat no-defs mode so every copy is
// id-free. People use kit person() so they share the site's one family of faces; the wheelchair, robot and the three
// animals are drawn here in the same lit-side / shade-side style. Only src/book/art.js imports this file.

import {
  P,
  SKIN,
  HAIR,
  person,
  shade,
  light,
  mix,
  contact,
  circle,
  ellipse,
  path,
  rect,
  rrect,
  stroke,
  line,
} from "./kit.js";

const GROUND = 286;
const svgTall = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300"><g stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;

/* Hand-held items, drawn in the figure's own 100-unit space (they scale with the person). */
const BOOK =
  rrect(-9, -12, 19, 15, 1.5, P.coral) +
  rect(-9, -12, 3, 15, shade(P.coral, 0.3)) +
  rect(-5, 1.5, 14, 1.4, P.ivory);
const FLASK =
  path("M-2.5 -24h5v7l7 13q1.5 3.5-2 3.5h-15q-3.5 0-2-3.5l7-13z", "#eef6f4", 'opacity=".92"') +
  path("M-5.6 -10.5h11.2l3.4 6.5q1.5 3.5-2 3.5h-14q-3.5 0-2-3.5z", P.grass) +
  circle(-1.5, -6, 1.3, light(P.grass, 0.5)) +
  circle(1.8, -14, 1, light(P.grass, 0.3)) +
  rect(-3.2, -26, 6.4, 3, "#b9c2c8") +
  line(-1, -21, -1, -14, "#ffffff", 0.9, 'opacity=".8"');
const MIC =
  rrect(-1.8, -20, 3.6, 14, 1.4, "#2b3440") +
  rrect(-3.4, -16, 6.8, 5, 1, P.coral) +
  circle(0, -24, 5, "#9aa6b1") +
  path("M0 -29a5 5 0 0 1 5 5h-5z", shade("#9aa6b1", 0.25), 'opacity=".7"') +
  circle(-1.6, -25.6, 1.3, "#ffffff", 'opacity=".55"');
const MAGNIFIER =
  line(0, 0, 4, 9, P.woodDark, 2.6) +
  circle(-3.5, -9, 8.2, P.gold) +
  circle(-3.5, -9, 6.3, "#cfe8ee") +
  path("M-8 -11q1.5-3.5 5-4", "none", 'stroke="#ffffff" stroke-width="1.4" opacity=".9"');

/* Hats and goggles drawn over the finished figure, in frame space (head centre hx, hy, radius hr). */
const head = (h, adult = false, x = 100, y = GROUND) => {
  const s = h / 100;
  const hr = (adult ? 10.2 : 13) * s;
  return { hx: x, hy: y - (100 - (adult ? 10.2 : 13)) * s, hr, s, x, y, adult };
};
const hardHat = ({ hx, hy, hr }) =>
  path(
    `M${hx - hr * 1.02} ${hy - hr * 0.25} A${hr * 1.02} ${hr * 1.05} 0 0 1 ${hx + hr * 1.02} ${hy - hr * 0.25}Z`,
    P.gold,
  ) +
  path(
    `M${hx + hr * 0.15} ${hy - hr * 1.25} A${hr * 1.02} ${hr * 1.05} 0 0 1 ${hx + hr * 1.02} ${hy - hr * 0.25}H${hx + hr * 0.4}Z`,
    shade(P.gold, 0.18),
    'opacity=".8"',
  ) +
  rrect(hx - hr * 0.16, hy - hr * 1.3, hr * 0.32, hr * 1.05, hr * 0.14, light(P.gold, 0.25)) +
  rrect(hx - hr * 1.3, hy - hr * 0.34, hr * 2.6, hr * 0.26, hr * 0.12, shade(P.gold, 0.12)) +
  circle(hx - hr * 0.55, hy - hr * 0.75, hr * 0.12, P.coral);
const fedora = ({ hx, hy, hr }) =>
  ellipse(hx, hy - hr * 0.42, hr * 1.55, hr * 0.26, shade(P.woodDark, 0.05)) +
  path(
    `M${hx - hr * 0.86} ${hy - hr * 0.45} Q${hx - hr * 0.9} ${hy - hr * 1.5} ${hx - hr * 0.1} ${hy - hr * 1.42} Q${hx} ${hy - hr * 1.25} ${hx + hr * 0.1} ${hy - hr * 1.42} Q${hx + hr * 0.9} ${hy - hr * 1.5} ${hx + hr * 0.86} ${hy - hr * 0.45}Z`,
    "#8a5a36",
  ) +
  path(
    `M${hx + hr * 0.1} ${hy - hr * 1.42} Q${hx + hr * 0.9} ${hy - hr * 1.5} ${hx + hr * 0.86} ${hy - hr * 0.45}H${hx + hr * 0.3}Z`,
    shade("#8a5a36", 0.2),
    'opacity=".8"',
  ) +
  rect(hx - hr * 0.88, hy - hr * 0.72, hr * 1.76, hr * 0.24, P.ink);
const goggles = ({ hx, hy, hr }) =>
  rrect(hx - hr * 0.95, hy - hr * 0.72, hr * 1.9, hr * 0.2, hr * 0.1, P.teal) +
  rrect(hx - hr * 0.62, hy - hr * 0.86, hr * 0.62, hr * 0.46, hr * 0.2, "#9fd8d3") +
  rrect(hx + hr * 0.06, hy - hr * 0.86, hr * 0.62, hr * 0.46, hr * 0.2, "#9fd8d3") +
  path(
    `M${hx - hr * 0.5} ${hy - hr * 0.62}l${hr * 0.18} ${-hr * 0.14}M${hx + hr * 0.18} ${hy - hr * 0.62}l${hr * 0.18} ${-hr * 0.14}`,
    "none",
    `stroke="#ffffff" stroke-width="${hr * 0.07}" opacity=".85"`,
  );

/** Shirt stripes across the chest (Leo). */
const stripes = ({ x, y, s, adult }) => {
  const top = y - (adult ? 63 : 64) * s;
  return rect(x - 13 * s, top + 9 * s, 21 * s, 2.4 * s, P.ivory, 'opacity=".9"') + rect(x - 13 * s, top + 14.5 * s, 21 * s, 2.4 * s, P.ivory, 'opacity=".9"');
};
/** A skirt or dress to the shin, drawn behind the figure; the legs share its colour so only the feet show. */
const longSkirt = ({ x, y, s, adult }, c) => {
  const top = y + (adult ? -54 : -50) * s;
  const bot = y - 2.5 * s;
  const w0 = (adult ? 11 : 10) * s;
  const w1 = w0 * 1.9;
  return path(`M${x - w0} ${top}L${x - w1} ${bot}Q${x} ${bot + 4 * s} ${x + w1} ${bot}L${x + w0} ${top}Z`, c) + path(`M${x + w0 * 0.2} ${top}L${x + w1 * 0.3} ${bot + 1.5 * s}Q${x + w1 * 0.8} ${bot + 0.8 * s} ${x + w1} ${bot}L${x + w0} ${top}Z`, shade(c, 0.16), 'opacity=".75"');
};

/** Kit person standing in the 200x300 frame. */
const stand = (h, o, { x = 100, extra, long } = {}) => {
  const at = head(h, o.age && o.age !== "child", x);
  return svgTall((long ? longSkirt(at, long) : "") + person(x, GROUND, h, long ? { ...o, skirt: false, bottom: long } : o) + (extra ? extra(at) : ""));
};

/* Wheelchair (side view, facing right) with the rider seated on it. */
function wheelchairRider() {
  const h = 246;
  const s = h / 100;
  const seatX = 92;
  const seatY = 196;
  const tube = "#2c8c86";
  let b = contact(100, GROUND, 78, 8, 0.22);
  // back post, push handle, seat frame and footrest
  b += stroke(`M${seatX - 30} ${seatY + 8} L${seatX - 36} ${seatY - 92} q-2 -8 -12 -8`, tube, 6);
  b += rrect(seatX - 40, seatY - 86, 16, 86, 6, shade(P.navy, 0.05));
  b += stroke(
    `M${seatX - 34} ${seatY + 10} H${seatX + 46} L${seatX + 66} ${seatY + 74} h12`,
    tube,
    5,
  );
  b += circle(seatX + 70, GROUND - 9, 9, "#3a4350") + circle(seatX + 70, GROUND - 9, 3, "#c9d1d6");
  b += rrect(seatX - 38, seatY - 4, 86, 12, 5, P.navy);
  // rider (kit person seated; (x, y) is the seat)
  b += person(seatX, seatY, h, {
    pose: "sit",
    skin: SKIN[4],
    hair: HAIR[6],
    hairStyle: "short",
    top: P.gold,
    bottom: P.navy,
    shoes: P.coral,
    sleeve: "short",
  });
  // near wheel: tyre, rim, spokes, hand ring, hub
  const wx = seatX - 14;
  const wy = GROUND - 54;
  b += circle(wx, wy, 50, "none", `stroke="#3a4350" stroke-width="8"`);
  b += circle(wx, wy, 45, "none", `stroke="#c9d1d6" stroke-width="2.5"`);
  b += circle(wx, wy, 39, "none", `stroke="${tube}" stroke-width="2"`);
  let sp = "";
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    sp += `M${wx} ${wy}l${(Math.cos(a) * 44).toFixed(1)} ${(Math.sin(a) * 44).toFixed(1)}`;
  }
  b += stroke(sp, "#c9d1d6", 1.4, 'opacity=".8"');
  b += path(
    `M${wx - 44} ${wy - 18}a48 48 0 0 1 30 -28`,
    "none",
    'stroke="#ffffff" stroke-width="2" opacity=".45"',
  );
  b += circle(wx, wy, 7, tube) + circle(wx - 2, wy - 2, 2.4, light(tube, 0.5));
  return svgTall(b);
}

function robot() {
  const body = "#2fa39b";
  const steel = "#b8c2c9";
  let b = contact(100, GROUND, 52, 9, 0.22);
  b +=
    rrect(80, 214, 17, 56, 7, shade(steel, 0.1)) +
    rrect(103, 214, 17, 56, 7, steel) +
    rect(112, 214, 8, 56, shade(steel, 0.12), 'opacity=".7"');
  b += rrect(70, 264, 30, 20, 8, P.navy) + rrect(100, 264, 30, 20, 8, light(P.navy, 0.1));
  b += stroke("M66 144q-20 22-14 54", shade(steel, 0.1), 11) + circle(52, 200, 10, P.gold);
  b +=
    stroke("M134 142q24-6 30-38", steel, 11) +
    circle(166, 100, 10, P.gold) +
    circle(163, 97, 3.2, light(P.gold, 0.5));
  b += rrect(88, 110, 24, 16, 4, shade(steel, 0.15));
  b +=
    rrect(60, 122, 80, 98, 20, body) +
    path("M114 122h6q20 0 20 20v58q0 20-20 20h-6z", shade(body, 0.18)) +
    rrect(66, 126, 30, 6, 3, light(body, 0.3), 'opacity=".7"');
  b += rrect(77, 144, 46, 36, 9, P.ivory) + rect(112, 148, 10, 28, shade(P.ivory, 0.08));
  b +=
    circle(90, 162, 5.5, P.coral) +
    circle(110, 162, 5.5, P.gold) +
    rrect(84, 194, 32, 6, 3, shade(body, 0.3));
  b +=
    line(100, 40, 100, 22, steel, 3.2) +
    circle(100, 18, 7.5, P.gold) +
    circle(98, 16, 2.4, light(P.gold, 0.6));
  b += rrect(54, 58, 14, 30, 6, shade(steel, 0.12)) + rrect(132, 58, 14, 30, 6, steel);
  b +=
    rrect(62, 36, 76, 74, 22, P.ivory) +
    path("M118 36q20 0 20 22v30q0 22-20 22z", shade(P.ivory, 0.1));
  b +=
    rrect(72, 50, 56, 44, 13, P.navy) + rrect(76, 54, 22, 6, 3, light(P.navy, 0.2), 'opacity=".7"');
  b +=
    ellipse(89, 70, 5.5, 6.5, "#8fe8e0") +
    ellipse(111, 70, 5.5, 6.5, "#8fe8e0") +
    stroke("M91 81q9 7 18 0", "#8fe8e0", 3);
  return svgTall(b);
}

function cat() {
  const c = "#e39a45";
  const d = shade(c, 0.24);
  let b = contact(100, GROUND, 58, 9, 0.22);
  b +=
    stroke("M134 274q48 2 42-40q-4-24-24-18", d, 13) +
    stroke("M134 272q44 0 39-38q-3-20-20-16", c, 9);
  b +=
    path("M58 284q-10-76 42-108q52 32 42 108z", c) +
    path("M110 184q42 30 32 100h-30q8-58-2-100z", d, 'opacity=".75"');
  b += path("M80 284q-2-44 20-60q22 16 20 60z", "#fbf1e2");
  b += stroke("M64 238q10 2 14-6M136 238q-10 2-14-6M62 258q10 0 14-6", d, 4.5);
  b += ellipse(80, 284, 15, 7, light(c, 0.1)) + ellipse(120, 284, 15, 7, c);
  b +=
    path("M64 128l-2-46l34 24z", c) +
    path("M136 128l2-46l-34 24z", d) +
    path("M70 112l-2-18l13 10z", "#f2a99a") +
    path("M130 112l2-18l-13 10z", "#e8938a");
  b +=
    ellipse(100, 144, 45, 40, c) +
    path("M108 105q38 6 37 40q-1 30-34 38q22-30-3-78z", d, 'opacity=".55"');
  b += ellipse(86, 124, 16, 9, light(c, 0.3), 'opacity=".6"');
  b += stroke("M86 106q4 10 0 18M100 104v18M114 106q-4 10 0 18", d, 4.5);
  b += ellipse(100, 166, 22, 15, "#fbf1e2");
  b +=
    ellipse(85, 146, 5, 6, P.ink) +
    ellipse(115, 146, 5, 6, P.ink) +
    circle(86.6, 144, 1.8, "#ffffff") +
    circle(116.6, 144, 1.8, "#ffffff");
  b +=
    path("M95 157h10l-5 5z", "#d0706a") +
    stroke("M100 162q-4 6-9 4M100 162q4 6 9 4", shade(c, 0.5), 1.8);
  b += stroke(
    "M76 160l-22-4M76 166l-20 4M124 160l22-4M124 166l20 4",
    "#ffffff",
    1.4,
    'opacity=".85"',
  );
  b +=
    ellipse(75, 160, 6, 3.5, P.coralLight, 'opacity=".45"') +
    ellipse(125, 160, 6, 3.5, P.coralLight, 'opacity=".45"');
  return svgTall(b);
}

function dog() {
  const c = "#c98d55";
  const ear = "#8f5a32";
  let b = contact(100, GROUND, 60, 9, 0.22);
  b += stroke("M138 254q32-4 34-38", shade(c, 0.15), 11);
  b +=
    path("M56 284q-6-82 44-102q50 20 44 102z", c) +
    path("M112 186q38 22 32 98h-28q6-60-4-98z", shade(c, 0.2), 'opacity=".8"');
  b += path("M80 284q-2-46 20-60q22 14 20 60z", "#fbf1e2");
  b +=
    rrect(74, 262, 22, 24, 10, light(c, 0.08)) +
    rrect(104, 262, 22, 24, 10, c) +
    stroke("M80 280v4M86 280v4M110 280v4M116 280v4", shade(c, 0.3), 1.6);
  b +=
    stroke("M74 186q26 12 52 0", P.coral, 7) +
    circle(100, 197, 6.5, P.gold) +
    circle(98.5, 195.5, 2, light(P.gold, 0.6));
  b +=
    ellipse(100, 138, 43, 40, c) +
    path("M108 99q36 8 35 40q-1 30-32 38q20-32-3-78z", shade(c, 0.2), 'opacity=".55"');
  b += ellipse(86, 114, 15, 9, light(c, 0.3), 'opacity=".6"');
  b +=
    path("M64 108q-26 6-19 52q4 14 19 4q6-24 6-48z", ear) +
    path("M136 108q26 6 19 52q-4 14-19 4q-6-24-6-48z", shade(ear, 0.15));
  b +=
    ellipse(100, 160, 23, 18, "#fbf1e2") +
    path("M110 146q14 6 13 16q-2 12-14 15q8-14 1-31z", shade("#fbf1e2", 0.08));
  b += ellipse(100, 151, 8.5, 6.5, P.ink) + ellipse(97.5, 149, 2.5, 1.5, "#ffffff", 'opacity=".7"');
  b += stroke("M100 157v6M92 165q8 6 16 0", P.ink, 2.2);
  b +=
    ellipse(85, 133, 5, 6, P.ink) +
    ellipse(115, 133, 5, 6, P.ink) +
    circle(86.6, 131, 1.8, "#ffffff") +
    circle(116.6, 131, 1.8, "#ffffff");
  b +=
    ellipse(78, 149, 6, 3.5, P.coralLight, 'opacity=".45"') +
    ellipse(122, 149, 6, 3.5, P.coralLight, 'opacity=".45"');
  return svgTall(b);
}

function owl() {
  const c = P.teal;
  const wing = shade(c, 0.32);
  let b = "";
  b +=
    stroke("M18 264H182", P.bark, 12) +
    stroke("M18 260H182", light(P.bark, 0.18), 3, 'opacity=".7"') +
    path("M150 264q12-16 26-12q-8 10-26 12z", P.leaf) +
    path("M40 266q-10 14-24 12q8-12 24-12z", P.leafDark);
  b +=
    ellipse(100, 188, 58, 76, c) +
    path("M112 114q46 18 46 74q0 58-46 74q26-70 0-148z", shade(c, 0.18), 'opacity=".8"');
  b += path("M68 198q0-48 32-48t32 48q0 54-32 62q-32-8-32-62z", "#f6eedd");
  b += stroke(
    "M84 186q4 6 8 0q4 6 8 0q4 6 8 0q4 6 8 0M80 206q5 6 10 0q5 6 10 0q5 6 10 0q5 6 10 0M84 226q4 6 8 0q4 6 8 0q4 6 8 0q4 6 8 0",
    mix(c, "#f6eedd", 0.45),
    2.2,
  );
  b +=
    path("M44 168q-10 40 10 78q10-30 6-72z", wing) +
    path("M156 168q10 40-10 78q-10-30-6-72z", shade(wing, 0.1));
  b += path("M50 112l2-34l24 20z", c) + path("M150 112l-2-34l-24 20z", shade(c, 0.15));
  b += ellipse(86, 134, 22, 12, light(c, 0.22), 'opacity=".6"');
  b += circle(78, 126, 20, "#fbf6ec") + circle(122, 126, 20, "#f1e8d6");
  b +=
    circle(80, 128, 8, P.ink) +
    circle(120, 128, 8, P.ink) +
    circle(82.5, 125, 2.6, "#ffffff") +
    circle(122.5, 125, 2.6, "#ffffff");
  b += path("M93 138h14l-7 12z", P.gold) + path("M100 138h7l-7 12z", shade(P.gold, 0.2));
  b += stroke("M86 266v-9M93 266v-9M107 266v-9M114 266v-9", P.gold, 4.5);
  return svgTall(b);
}

/** The 16 characters, in the order and with the keys the Book Studio library has always used. */
export const bookPeople = () => [
  ["char-maya", "Maya", "Maya", stand(250, { skin: SKIN[3], hair: HAIR[0], hairStyle: "curly", top: P.coral, bottom: P.teal, shoes: P.gold, pose: "wave", mouth: "open" }, { x: 96 })],
  ["char-leo", "Leo", "Leo", stand(250, { skin: SKIN[0], hair: HAIR[2], hairStyle: "short", top: "#2fa39b", bottom: P.navy, shoes: P.coral, glasses: true }, { extra: stripes })],
  ["char-amara", "Amara", "Amara", stand(250, { skin: SKIN[2], hair: "#a8443a", hairStyle: "hijab", top: "#7fb48a", bottom: "#7fb48a", shoes: P.woodDark, skirt: true, pose: "hold", item: BOOK }, { x: 88, long: "#7fb48a" })],
  ["char-sam", "Sam", "Sam", wheelchairRider()],
  ["char-kai", "Kai", "Kai", stand(242, { skin: SKIN[1], hair: HAIR[1], hairStyle: "short", top: P.navy, bottom: P.wood, shoes: P.ivory, pose: "point", mouth: "open" }, { x: 78, extra: hardHat })],
  ["char-abuela", "Grandma", "Abuela", stand(250, { age: "elder", skin: SKIN[1], hair: HAIR[5], hairStyle: "bun", top: "#3fa79a", coat: P.coral, bottom: P.teal, shoes: P.woodDark, skirt: true, glasses: true }, { long: P.teal })],
  ["char-dad", "Dad", "Papá", stand(250, { age: "adult", skin: SKIN[4], hair: HAIR[6], hairStyle: "short", top: P.teal, bottom: P.navy, shoes: "#3a2418", beard: true, pose: "wave" }, { x: 94 })],
  ["char-mom", "Mom", "Mamá", stand(258, { age: "adult", skin: SKIN[0], hair: HAIR[2], hairStyle: "long", top: P.coral, bottom: P.gold, skirt: true, shoes: P.navy }, { long: P.gold })],
  ["char-teacher", "Teacher", "Maestra", stand(256, { age: "adult", skin: SKIN[1], hair: HAIR[0], hairStyle: "long", top: P.ivory, coat: "#2fa39b", bottom: P.navy, shoes: P.woodDark, pose: "read", item: BOOK }, { x: 84 })],
  ["char-robot", "Robot guide", "Robot guía", robot()],
  ["char-scientist", "Scientist", "Científica", stand(254, { age: "adult", skin: SKIN[3], hair: HAIR[0], hairStyle: "curly", top: "#3fa79a", coat: "#f4f1ea", bottom: P.navy, shoes: P.teal, pose: "hold", item: FLASK }, { x: 86, extra: goggles })],
  ["char-reporter", "Reporter", "Reportera", stand(256, { age: "adult", skin: SKIN[0], hair: HAIR[1], hairStyle: "braid", top: P.ivory, coat: P.navy, bottom: "#3e4a5c", shoes: P.coral, pose: "think", item: MIC, mouth: "open" }, { x: 94 })],
  ["char-detective", "Detective", "Detective", stand(248, { age: "adult", skin: SKIN[4], hair: HAIR[0], hairStyle: "short", top: P.ivory, coat: "#c79a5b", bottom: P.navy, shoes: "#3a2418", pose: "point", item: MAGNIFIER }, { x: 76, extra: fedora })],
  ["char-cat", "Cat", "Gato", cat()],
  ["char-dog", "Dog", "Perro", dog()],
  ["char-owl", "Owl", "Búho", owl()],
];

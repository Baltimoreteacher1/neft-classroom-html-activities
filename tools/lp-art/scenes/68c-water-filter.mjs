import { P, rect, rrect, circle, ellipse, path, stroke, vgrad, def, arrow, rng, g, shade, light, contact } from "../../../access-practice-lab/src/art/kit.js";

// Homemade water filter, top to bottom: muddy water poured in -> gravel -> sand -> black charcoal -> cotton pad ->
// clear water dripping into a glass. A cut plastic bottle stands upside down in a ring stand. No labels (students
// name the layers); a side arrow shows the water moving down.
const X = 320;
const top = 96;
const bodyW = 176;
const neckW = 40;
const shoulderY = 246;
const neckY = 292;
const mouthY = 316;
const L = X - bodyW / 2;
const R = X + bodyW / 2;
const inner = `M${L} ${top} H${R} V${shoulderY} C${R} ${neckY - 20} ${X + neckW / 2} ${neckY - 16} ${X + neckW / 2} ${neckY} V${mouthY} H${X - neckW / 2} V${neckY} C${X - neckW / 2} ${neckY - 16} ${L} ${neckY - 20} ${L} ${shoulderY}Z`;
const bands = { water: [118, 150], gravel: [150, 192], sand: [192, 228], charcoal: [228, 262], cotton: [262, 304] };

const JUG = "M-34 -26 h56 l10 -6 l-4 12 l2 40 q0 10 -10 10 h-44 q-10 0 -10 -10Z";
const jugT = "translate(172 62) rotate(34)";
const jugClip = def((i) => `<clipPath id="${i}"><path transform="${jugT}" d="${JUG}"/></clipPath>`, "cp");
const pitcher = () =>
  `<path transform="${jugT}" d="${JUG}" fill="#e9f4f7" opacity=".95"/>` +
  `<g clip-path="url(#${jugClip})">${rect(110, 58, 130, 70, vgrad([[0, "#9c6b3c"], [1, "#7d522b"]]))}</g>` +
  `<path transform="${jugT}" d="M-34 -12 q-18 2 -14 24" fill="none" stroke="#c9d6dc" stroke-width="5" stroke-linecap="round"/>` +
  `<path transform="${jugT}" d="M-28 -20 v34" fill="none" stroke="#ffffff" stroke-width="3" opacity=".6" stroke-linecap="round"/>`;

const clip = def((i) => `<clipPath id="${i}"><path d="${inner}"/></clipPath>`, "cp");

const gravel = () => {
  const r = rng(31);
  let s = rect(L, bands.gravel[0], bodyW, 42, "#8f969c");
  for (let row = 0; row < 4; row++)
    for (let i = 0; i < 11; i++) {
      const x = L + 6 + i * 16 + (row % 2) * 8 + (r() - 0.5) * 4;
      const y = bands.gravel[0] + 6 + row * 10 + (r() - 0.5) * 3;
      const c = ["#b7bdc2", "#a1a8ae", "#c8ccd0", "#959ca3"][Math.floor(r() * 4)];
      s += ellipse(x, y, 7 + r() * 2, 5 + r() * 1.5, c) + ellipse(x - 2, y - 2, 3, 1.6, "#ffffff", 'opacity=".45"');
    }
  return s;
};
const sand = () => {
  const r = rng(8);
  let s = rect(L, bands.sand[0], bodyW, 36, vgrad([[0, "#ecd29a"], [1, "#d9b874"]]));
  for (let i = 0; i < 90; i++) s += circle(L + r() * bodyW, bands.sand[0] + 3 + r() * 30, 1.1, r() < 0.5 ? "#c49a52" : "#f6e5bd");
  return s;
};
const charcoal = () => {
  const r = rng(17);
  let s = rect(L, bands.charcoal[0], bodyW, 34, "#2a2d31");
  for (let i = 0; i < 26; i++) {
    const x = L + 4 + r() * (bodyW - 8);
    const y = bands.charcoal[0] + 5 + r() * 24;
    s += rect(x, y, 8 + r() * 6, 5 + r() * 4, r() < 0.5 ? "#3c4046" : "#1d1f22", `transform="rotate(${Math.round(r() * 60 - 30)} ${x} ${y})"`);
  }
  return s;
};
const cotton = () => {
  let s = rect(L, bands.cotton[0], bodyW, 44, "#f4f6f8");
  for (const [x, y, rr] of [[-26, 270, 9], [-8, 268, 10], [12, 270, 9], [28, 274, 7], [-16, 284, 8], [6, 286, 9], [-2, 298, 7], [12, 300, 6], [-12, 300, 6]]) s += circle(X + x, y, rr, "#ffffff") + circle(X + x + 2, y + 3, rr * 0.6, "#e3e8ec");
  return s;
};

export default {
  file: "68c-water-filter.svg",
  w: 640,
  h: 400,
  title:
    "A diagram of a cut plastic bottle turned upside down as a water filter. Muddy brown water is poured in at the top. It passes down through a layer of gravel, then a layer of sand, then a layer of black charcoal, then a cotton pad, and clear water drips into a glass at the bottom.",
  draw: () =>
    rect(0, 0, 640, 400, vgrad([[0, "#d7ebf3"], [1, "#eaf3f6"]])) +
    rect(0, 372, 640, 28, vgrad([[0, "#e6c99a"], [1, "#d1ad74"]])) +
    rect(0, 372, 640, 3, "#f1dcb4") +
    // ring stand: base, pole, clamp
    contact(470, 372, 70, 6, 0.18) +
    rrect(420, 362, 110, 10, 3, "#5d6772") +
    rect(482, 60, 8, 304, "#7b8794") +
    rect(482, 60, 3, 304, "#a3adb7") +
    rect(R + 8, 196, 482 - R - 8, 8, "#7b8794") +
    // muddy water in the pitcher, pouring (liquid surface stays level while the jug tips)
    pitcher() +
    stroke(`M217 55 C236 60 248 86 252 ${bands.water[0] + 4}`, "#8a5a30", 6) +
    // bottle: contents clipped to the inside, then the clear plastic
    `<g clip-path="url(#${clip})">${rect(L, top, bodyW, bands.water[0] - top, "#eef6f9")}${rect(L, bands.water[0], bodyW, 32, vgrad([[0, "#a5763f"], [1, "#7d522b"]]))}${stroke(`M${L} ${bands.water[0] + 1}h${bodyW}`, "#c19866", 3)}${gravel()}${sand()}${charcoal()}${cotton()}${rect(X - neckW / 2, 304, neckW, 12, "#dff0f6")}</g>` +
    path(inner, "none", `stroke="#a9c3cf" stroke-width="4" stroke-linejoin="round"`) +
    rect(L + 8, top + 6, 8, shoulderY - top - 12, "#ffffff", 'opacity=".4"') +
    rect(L - 3, top - 4, bodyW + 6, 6, "#c7dbe3") +
    rrect(R - 2, 190, 12, 20, 3, "#5d6772") +
    // clear drops into the glass
    path(`M${X} 320 q-6 9 0 13 q6 -4 0 -13Z`, P.water) +
    path(`M${X} 337 q-5 8 0 11 q5 -3 0 -11Z`, P.water) +
    contact(X, 372, 44, 5, 0.18) +
    path(`M${X - 40} 326 H${X + 40} L${X + 34} 372 H${X - 34}Z`, "#eef6f9", 'opacity=".9"') +
    path(`M${X - 37} 348 H${X + 37} L${X + 34} 372 H${X - 34}Z`, vgrad([[0, "#bfe6f3"], [1, "#8fd0e6"]])) +
    ellipse(X, 348, 37, 2.5, "#e3f5fb") +
    rect(X - 34, 330, 5, 38, "#ffffff", 'opacity=".7"') +
    // flow direction
    arrow(`M${L - 40} 128 V${neckY + 10}`, P.teal, 6),
};

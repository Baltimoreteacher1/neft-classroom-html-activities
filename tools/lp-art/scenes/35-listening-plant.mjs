import { P, sky, sun, cloud, hills, rect, path, stroke, ellipse, circle, g, tr, vgrad, shade, light, rng, haze } from "../kit.mjs";

const f = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
const SURFACE = 252;

function soil() {
  const R = rng(11);
  let s = rect(0, SURFACE, 640, 400 - SURFACE, vgrad([[0, "#a2714b"], [0.25, P.soil], [1, "#5e3c25"]]));
  // soil layers and pebbles
  s += path(`M0 ${SURFACE + 70} Q160 ${SURFACE + 60} 320 ${SURFACE + 74} T640 ${SURFACE + 66}V400H0Z`, "#6b452b", 'opacity=".45"');
  for (let i = 0; i < 26; i++) {
    const x = R() * 640;
    const y = SURFACE + 18 + R() * 128;
    if (Math.abs(x - 320) < 90 && y < 380) continue;
    const r = 2 + R() * 4;
    s += ellipse(x, y, r * 1.4, r, R() < 0.5 ? "#b58a63" : "#4e331f", 'opacity=".7"');
  }
  // grass lip along the surface
  s += rect(0, SURFACE - 6, 640, 10, P.grass);
  let d = "";
  for (let x = 2; x < 640; x += 5 + R() * 9) {
    const h = 5 + R() * 9;
    d += `M${f(x)} ${SURFACE + 3}q${f(-1 - R() * 2)} ${f(-h * 0.6)} ${f(-2 - R() * 3)} ${f(-h)}`;
  }
  s += stroke(d, P.grassDark, 2) + stroke(d.replace(/M([\d.]+)/g, (m, x) => `M${f(+x + 2.5)}`), P.grassLight, 1.6, 'opacity=".8"');
  s += rect(0, SURFACE + 4, 640, 3, "#5e3c25", 'opacity=".35"');
  return s;
}

function roots() {
  const c = "#f0dcb4";
  const main = "M320 256 C318 290 324 318 316 352";
  const side =
    "M319 272 C300 284 282 292 262 314M262 314 C254 322 250 334 246 346" +
    "M321 278 C342 290 360 298 380 322M380 322 C386 332 392 340 394 352" +
    "M318 300 C306 316 296 330 292 356M322 304 C334 320 344 334 350 360" +
    "M300 290 C290 292 278 290 266 294M342 292 C354 292 366 290 378 296" +
    "M316 330 C310 344 302 352 296 372M318 336 C326 350 332 362 340 376" +
    "M270 306 C262 304 254 306 246 304M374 316 C384 312 394 314 402 312";
  return stroke(main, c, 5) + stroke(side, c, 2.6) + stroke("M316 352 C314 362 318 372 314 384", c, 2);
}

function leaf(x, y, len, ang, c = P.leaf) {
  const body = path(`M0 0 Q${len * 0.45} ${-len * 0.32} ${len} 0 Q${len * 0.45} ${len * 0.28} 0 0Z`, c) + path(`M0 0 Q${len * 0.45} ${len * 0.28} ${len} 0 Q${len * 0.5} ${len * 0.08} 0 0Z`, shade(c, 0.18)) + stroke(`M2 0 Q${len * 0.5} -2 ${len - 4} 0`, light(c, 0.35), 1.6);
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${ang})">${body}</g>`;
}

function flowerHead(x, y) {
  let s = "";
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * 360;
    const r = (a * Math.PI) / 180;
    const px = x + Math.cos(r) * 26;
    const py = y + Math.sin(r) * 26;
    s += `<ellipse cx="${f(px)}" cy="${f(py)}" rx="20" ry="10" fill="${i % 2 ? P.yellow : "#f6d24e"}" transform="rotate(${f(a)} ${f(px)} ${f(py)})"/>`;
  }
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * 360 + 15;
    const r = (a * Math.PI) / 180;
    if (Math.sin(r) < 0.2) continue;
    const px = x + Math.cos(r) * 24;
    const py = y + Math.sin(r) * 24;
    s += `<ellipse cx="${f(px)}" cy="${f(py)}" rx="14" ry="6" fill="${shade(P.yellow, 0.14)}" opacity=".55" transform="rotate(${f(a)} ${f(px)} ${f(py)})"/>`;
  }
  s += circle(x, y, 18, "#c76b2e") + circle(x - 4, y - 4, 9, "#e08a3e", 'opacity=".8"');
  for (let i = 0; i < 8; i++) s += circle(x + Math.cos(i) * 10, y + Math.sin(i) * 10, 1.6, "#8a4720");
  return s;
}

export default {
  file: "35-listening-plant.svg",
  w: 640,
  h: 400,
  title: "A plant growing in the soil, with roots under the ground, a green stem, leaves, and a yellow flower on top.",
  draw: () =>
    sky(640, SURFACE) +
    sun(560, 68, 26) +
    cloud(130, 70, 0.8) +
    cloud(420, 46, 0.55) +
    hills(640, SURFACE - 8, { seed: 5, amp: 30 }) +
    soil() +
    ellipse(320, SURFACE + 1, 40, 6, "#5e3c25", 'opacity=".35"') +
    `<g transform="translate(320 252) scale(1.5 1.05) translate(-320 -252)">${roots()}</g>` +
    `<g transform="translate(320 254) scale(1.2) translate(-320 -254)">` +
    stroke("M320 256 C318 210 324 170 320 126", P.leafDark, 9) +
    stroke("M322 250 C320 210 325 170 322 130", P.leaf, 4, 'opacity=".8"') +
    leaf(318, 214, 82, 200) +
    leaf(322, 190, 92, -18, P.leafLight) +
    leaf(318, 158, 62, 196, P.leafLight) +
    leaf(322, 168, 56, -30) +
    flowerHead(320, 110) +
    "</g>",
};

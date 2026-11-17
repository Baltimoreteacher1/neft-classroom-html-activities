import { P, panels, tree, sun, cloud, tr, rect, circle, ellipse, path, stroke, vgrad, rng, shade, light, haze, contact, flower, tuft } from "../kit.mjs";

// The same maple tree in four seasons, left to right: spring (light green leaves, pink flowers),
// summer (full dark green leaves, hot sun), fall (orange and red leaves falling), winter (bare branches, snow).
const TX = 0.5;
const S = 0.86;
const canopyDots = (cx, base, n, colors, r, seed) => {
  const R = rng(seed);
  let b = "";
  for (let i = 0; i < n; i++) {
    const a = R() * Math.PI * 2;
    const rr = Math.sqrt(R()) * 62;
    const x = cx + Math.cos(a) * rr * S;
    const y = base + (-122 + Math.sin(a) * rr * 0.72) * S;
    b += circle(x, y, r, colors[i % colors.length]);
  }
  return b;
};
const blossom = (x, y, c) => {
  let b = "";
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    b += circle(x + Math.cos(a) * 2.6, y + Math.sin(a) * 2.6, 2.4, c);
  }
  return b + circle(x, y, 1.3, "#fff3c4");
};
// Bare maple: recursive branching, tapered limbs, a line of snow resting on the upper side of each limb.
const bareMaple = (x, y, s) => {
  const R = rng(17);
  let bark = "";
  let snow = "";
  const grow = (x0, y0, ang, len, w, depth) => {
    const r = (ang * Math.PI) / 180;
    const x1 = x0 + Math.sin(r) * len;
    const y1 = y0 - Math.cos(r) * len;
    const mx = (x0 + x1) / 2 + Math.cos(r) * len * 0.08;
    const my = (y0 + y1) / 2 + Math.sin(r) * len * 0.08;
    bark += stroke(`M${x0.toFixed(1)} ${y0.toFixed(1)}Q${mx.toFixed(1)} ${my.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`, depth === 0 ? P.bark : P.barkDark, w);
    if (depth > 0 && Math.abs(ang) > 12) snow += stroke(`M${x0.toFixed(1)} ${(y0 - w * 0.45).toFixed(1)}Q${mx.toFixed(1)} ${(my - w * 0.45).toFixed(1)} ${x1.toFixed(1)} ${(y1 - w * 0.4).toFixed(1)}`, "#ffffff", Math.max(1.4, w * 0.4));
    if (depth >= 4) return;
    const n = depth === 0 ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const spread = n === 3 ? [-26, 2, 26][i] : [-20, 18][i];
      grow(x1, y1, ang * 0.75 + spread + (R() - 0.5) * 10, len * (0.62 + R() * 0.1), w * 0.62, depth + 1);
    }
  };
  grow(0, 0, 0, 80, 15, 0);
  return tr(x, y, contact(0, 2, 40, 7, 0.16) + bark + snow, s);
};
const leaf = (x, y, a, c) => `<g transform="translate(${x} ${y}) rotate(${a})">${path("M0 -6 Q6 -2 0 6 Q-6 -2 0 -6Z", c)}</g>`;

const scene = (season, w, h) => {
  const cx = w * TX;
  const gy = h - 70;
  const skies = {
    spring: ["#bfe3f0", "#e3f3ee"],
    summer: ["#7fc0e4", "#cde9f3"],
    fall: ["#f3d6a8", "#fbeedb"],
    winter: ["#c9d6e3", "#eef2f6"],
  }[season];
  let b = rect(0, 0, w, h, vgrad([[0, skies[0]], [1, skies[1]]]));
  if (season === "summer") b += sun(w - 34, 58, 22);
  if (season === "spring") b += cloud(w - 40, 64, 0.42);
  if (season === "fall") b += cloud(w - 44, 70, 0.4, { tone: "#fff7ec" });
  const groundC = { spring: [P.grassLight, "#8fc070"], summer: [P.grass, P.grassDark], fall: ["#d9b26a", "#b98f4c"], winter: ["#ffffff", "#e3ebf2"] }[season];
  b += path(`M0 ${gy + 6} Q${w / 2} ${gy - 12} ${w} ${gy + 6} V${h} H0Z`, vgrad([[0, groundC[0]], [1, groundC[1]]]));
  if (season === "spring") {
    b += tree(cx, gy, S, { seed: 5, tone: "#9fd17a" });
    const R = rng(11);
    for (let i = 0; i < 30; i++) {
      const a = R() * Math.PI * 2;
      const rr = 14 + Math.sqrt(R()) * 52;
      b += blossom(cx + Math.cos(a) * rr * S, gy + (-122 + Math.sin(a) * rr * 0.72) * S, i % 3 ? "#f29bbb" : "#f7bfd3");
    }
    b += flower(22, h - 30, 0.9, { color: "#f29bbb" }) + flower(w - 26, h - 22, 0.8, { color: P.gold, center: P.coral }) + tuft(w * 0.3, h - 18, 0.9);
  }
  if (season === "summer") {
    b += tree(cx, gy, S * 1.04, { seed: 5, tone: "#2f7a43" }) + canopyDots(cx, gy, 10, ["#3f8f52"], 9, 4);
    b += ellipse(cx + 20, gy + 6, 50, 9, "#1c2f4a", 'opacity=".22"') + tuft(24, h - 22) + tuft(w - 30, h - 30, 1.1);
  }
  if (season === "fall") {
    b += tree(cx, gy, S, { seed: 5, tone: "#e58a32" }) + canopyDots(cx, gy, 22, ["#c8452f", "#d95a2b", "#b83a2c"], 6.5, 9);
    const R = rng(21);
    for (let i = 0; i < 9; i++) b += leaf(12 + R() * (w - 24), 70 + R() * (gy - 60), R() * 360, ["#e58a32", "#c8452f", P.gold][i % 3]);
    for (let i = 0; i < 12; i++) b += leaf(10 + R() * (w - 20), gy + 10 + R() * 70, R() * 360, ["#e58a32", "#c8452f", "#d97a2b"][i % 3]);
  }
  if (season === "winter") {
    b += bareMaple(cx, gy, S);
    const R = rng(31);
    for (let i = 0; i < 26; i++) b += circle(8 + R() * (w - 16), 40 + R() * (gy - 20), 1.6 + R() * 1.8, "#ffffff", 'opacity=".95"');
    b += ellipse(30, h - 40, 30, 8, "#dfe8f0") + ellipse(w - 30, h - 54, 26, 7, "#dfe8f0");
  }
  return b;
};

export default {
  file: "35t-seasons-tree.svg",
  w: 640,
  h: 400,
  title:
    "The same maple tree in four seasons, from left to right. In spring, it has light green leaves and pink flowers. In summer, it is full of dark green leaves under a hot sun. In fall, its leaves are orange and red and falling to the ground. In winter, its branches are bare and snow covers the ground.",
  draw: () => panels(640, 400, 4, (i, x, y, w, h) => tr(x, y, scene(["spring", "summer", "fall", "winter"][i], w, h)), { numbered: false }),
};

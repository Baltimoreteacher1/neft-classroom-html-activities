import { begin, card, bars, check, sparkle, floorShadow, rot, grad, path, poly, rect, rrect, circle, ellipse, line, vgrad, blur, P, light, shade, mix, DOM, INK } from "../lib/g.mjs";
import { sky, sun, cloud, hills, tree, clipRect, haze, ground, road } from "../../../access-practice-lab/src/art/kit.js";

// Future City: a green skyline (wind turbines, solar roofs, park) and a planning card with data for the council.
function turbine(x, y, h, o = 1) {
  const c = haze("#ffffff", 0.0);
  let s = path(`M${x - 3} ${y} L${x - 1.4} ${y - h} H${x + 1.4} L${x + 3} ${y}Z`, "#f3f6f9");
  const hub = [x, y - h];
  [-90, 30, 150].forEach((a) => {
    const r = (a * Math.PI) / 180;
    const ex = hub[0] + Math.cos(r) * h * 0.46;
    const ey = hub[1] + Math.sin(r) * h * 0.46;
    const nx = -Math.sin(r) * 4;
    const ny = Math.cos(r) * 4;
    s += path(`M${hub[0]} ${hub[1]} L${(hub[0] + Math.cos(r) * h * 0.12 + nx).toFixed(1)} ${(hub[1] + Math.sin(r) * h * 0.12 + ny).toFixed(1)} L${ex.toFixed(1)} ${ey.toFixed(1)}Z`, "#ffffff");
  });
  s += circle(hub[0], hub[1], 3.4, "#d5dde5");
  return `<g opacity="${o}">${s}</g>`;
}
function solar(x, y, w) {
  let s = poly([[x, y], [x + w, y], [x + w - 6, y - 12], [x + 6, y - 12]], "#2d4f7a");
  for (let i = 1; i < 4; i++) s += line(x + (w / 4) * i, y, x + 6 + ((w - 12) / 4) * i, y - 12, "#7fa3c9", 1);
  s += line(x + 3, y - 6, x + w - 3, y - 6, "#7fa3c9", 1);
  return s;
}
// Building block sharing one window gradient (keeps the file small).
function block(x, y, w, h, color, cols, rows, win) {
  let s = blur(rect(x + 6, y - h + 6, w, h, INK), 5, 0.16);
  s += rect(x, y - h, w, h, color) + rect(x + w * 0.72, y - h, w * 0.28, h, shade(color, 0.12), 'opacity=".6"') + rect(x - 4, y - h - 8, w + 8, 10, shade(color, 0.3));
  const ww = Math.min(22, (w - 16) / cols - 10);
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const wx = x + ((c + 0.5) * w) / cols - ww / 2;
      const wy = y - h + 16 + r * 28;
      if (wy + 18 > y - 10) continue;
      s += rect(wx - 2, wy - 2, ww + 4, 22, P.ivory) + rect(wx, wy, ww, 18, win);
    }
  return s;
}
function planCard() {
  let s = card(392, 64, 214, 236, 16, "#ffffff", { sd: 9, o: 0.24, dy: 10 });
  s += rrect(410, 82, 90, 9, 4.5, DOM.writing) + rrect(410, 98, 140, 6, 3, "#d3dae3");
  s += rrect(410, 116, 178, 86, 10, "#f5f1e8");
  s += line(424, 188, 574, 188, "#d6dce4", 2);
  [[432, 30, "#9fb7c9"], [466, 46, "#9fb7c9"], [500, 58, P.teal], [534, 70, P.teal]].forEach(([x, h, c]) => (s += rrect(x, 188 - h, 24, h, 4, vgrad([[0, light(c, 0.15)], [1, c]]))));
  [[0, P.teal], [1, P.gold], [2, P.coral]].forEach(([i, c]) => {
    const y = 222 + i * 26;
    s += check(424, y, 9, c, { shadow: false, ring: false }) + bars(442, y - 4, 130, [i === 1 ? 0.8 : 1], { h: 7, color: "#d3dae3" });
  });
  return s;
}

export default {
  file: "ds/reality-city.svg",
  w: 640,
  h: 360,
  title: "Future City — Civic Planning and Sustainability Studio",
  grain: false,
  draw: () =>
    begin() +
    clipRect(0, 0, 640, 360, 20,
      sky(640, 270, "morning") +
      sun(96, 70, 22) +
      cloud(250, 60, 0.6) +
      turbine(300, 214, 104, 0.85) + turbine(346, 222, 80, 0.75) + turbine(46, 220, 90, 0.75) +
      hills(640, 236, { seed: 5, amp: 20 }) +
      ((win) =>
        block(150, 250, 64, 168, haze("#5f86a8", 0.3), 2, 6, win) +
        block(222, 250, 56, 120, haze(P.teal, 0.25), 2, 4, win) +
        block(70, 250, 70, 104, haze("#c99a6e", 0.2), 2, 3, win))(vgrad([[0, "#cfe9f2"], [1, "#8fc0d6"]])) +
      solar(78, 140, 56) + solar(226, 124, 48) +
      tree(300, 256, 0.34, { tone: "#6aa275" }) + tree(48, 256, 0.3, { kind: "round", tone: "#5f9a6e" }) +
      ground(640, 250, 110, "grass") +
      road(640, 300, 34, { curb: true }) +
      tree(126, 290, 0.42, { tone: "#5f9a6e", seed: 3 }) + tree(338, 292, 0.36, { kind: "bush", tone: "#6aa275" }) +
      planCard() +
      sparkle(624 - 18, 46, 8, P.gold) + sparkle(372, 52, 6, P.coral)),
};

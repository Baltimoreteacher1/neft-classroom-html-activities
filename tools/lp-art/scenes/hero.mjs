import { begin, blob, bubble, wave, sparkle, floorShadow, pencil, bars, grad, rot, path, rect, rrect, circle, ellipse, line, poly, vgrad, rgrad, blur, P, light, shade, mix, DOM, INK } from "../lib/g.mjs";

// A raised, extruded tile (soft-3D app-icon style) centred on (x, y).
function tile(x, y, s, c, body, a) {
  const h = s / 2;
  return rot(x, y, a,
    blur(rrect(x - h + 8, y - h + 22, s, s, 34, INK), 14, 0.28) +
      rrect(x - h, y - h + 12, s, s, 34, shade(c, 0.32)) +
      rrect(x - h, y - h, s, s, 34, vgrad([[0, light(c, 0.2)], [1, shade(c, 0.06)]])) +
      rrect(x - h + 10, y - h + 6, s - 20, 6, 3, "#ffffff", 'opacity=".18"') +
      body);
}
const headphones = (x, y, c) =>
  path(`M${x - 46} ${y + 10} V${y - 2} A46 46 0 0 1 ${x + 46} ${y - 2} V${y + 10}`, "none", `stroke="#ffffff" stroke-width="11" stroke-linecap="round"`) +
  rrect(x - 58, y - 4, 30, 50, 13, "#ffffff") + rrect(x + 28, y - 4, 30, 50, 13, "#ffffff") +
  rrect(x - 51, y + 4, 16, 34, 8, light(c, 0.35)) + rrect(x + 35, y + 4, 16, 34, 8, light(c, 0.35));
const book = (x, y, c) =>
  path(`M${x} ${y - 30} C${x - 22} ${y - 42} ${x - 50} ${y - 42} ${x - 64} ${y - 34} V${y + 34} C${x - 50} ${y + 26} ${x - 22} ${y + 26} ${x} ${y + 38}Z`, "#fbf6ec") +
  path(`M${x} ${y - 30} C${x + 22} ${y - 42} ${x + 50} ${y - 42} ${x + 64} ${y - 34} V${y + 34} C${x + 50} ${y + 26} ${x + 22} ${y + 26} ${x} ${y + 38}Z`, "#ffffff") +
  rect(x - 1.5, y - 30, 3, 68, "#d9cfbf") +
  bars(x - 54, y - 22, 42, [1, 0.85, 1, 0.7, 0.9], { gap: 11, h: 4, color: light(c, 0.55) }) +
  rrect(x + 12, y - 24, 42, 30, 4, light(c, 0.7)) + poly([[x + 14, y + 4], [x + 28, y - 12], [x + 40, y + 4]], light(c, 0.3)) + circle(x + 44, y - 14, 4.5, P.gold) +
  bars(x + 12, y + 12, 42, [1, 0.7], { gap: 10, h: 4, color: light(c, 0.55) });
const mic = (x, y, c) =>
  rrect(x - 20, y - 52, 40, 70, 20, "#ffffff") + rrect(x - 11, y - 40, 22, 4, 2, light(c, 0.5)) + rrect(x - 11, y - 30, 22, 4, 2, light(c, 0.5)) + rrect(x - 11, y - 20, 22, 4, 2, light(c, 0.5)) +
  path(`M${x - 34} ${y - 4} A34 34 0 0 0 ${x + 34} ${y - 4}`, "none", `stroke="#ffffff" stroke-width="8" stroke-linecap="round"`) +
  rect(x - 4, y + 30, 8, 18, "#ffffff") + rrect(x - 24, y + 46, 48, 8, 4, "#ffffff");
const paper = (x, y, c) =>
  rot(x, y, -6, rrect(x - 40, y - 52, 76, 100, 8, "#ffffff") + bars(x - 28, y - 36, 52, [1, 0.8, 1, 0.6, 0.9, 0.5], { gap: 13, h: 4.5, color: light(c, 0.45) })) +
  pencil(x + 6, y + 44, 108, -52, { body: P.navy, w: 14 });

export default {
  file: "ds/hero.svg",
  w: 720,
  h: 600,
  title: "Four tiles representing listening, reading, speaking and writing, linked by a speech bubble with a sound wave",
  grain: false,
  draw: () =>
    begin() +
    blob(362, 312, 300, 258, "#e4ebf7", { tilt: -10 }) +
    circle(362, 300, 210, rgrad([[0, "#ffffff", 0.7], [1, "#ffffff", 0]])) +
    floorShadow(362, 548, 230, 16, 0.14) +
    tile(240, 180, 190, DOM.listening, headphones(240, 172, DOM.listening), -5) +
    tile(484, 170, 190, DOM.reading, book(484, 172, DOM.reading), 4) +
    tile(236, 428, 190, DOM.speaking, mic(236, 432, DOM.speaking), 3) +
    tile(482, 420, 190, DOM.writing, paper(472, 420, DOM.writing), -4) +
    bubble(284, 256, 156, 80, "#ffffff", { tail: "bc", r: 24 }) +
    wave(362, 296, 112, 46, P.navy, 15) +
    sparkle(84, 300, 14, P.gold) + sparkle(640, 96, 11, P.coral) + sparkle(654, 470, 10, P.navy) + sparkle(110, 92, 8, "#7f9fd6") +
    circle(668, 300, 7, P.gold) + circle(84, 520, 6, P.coral) + circle(360, 46, 6, P.teal) + circle(610, 566, 5, "#7f9fd6"),
};

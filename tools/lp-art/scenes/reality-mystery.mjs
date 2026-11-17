import { begin, card, bars, bubble, wave, sparkle, magnifier, floorShadow, rot, grad, path, poly, rect, rrect, circle, ellipse, line, vgrad, blur, P, light, shade, mix, DOM, INK } from "../lib/g.mjs";
import { clipRect, ground, wallWindow } from "../kit.mjs";

// Mystery Academy: a school hallway clue board (pinned notes joined by string), lockers, a green notebook
// on a shelf, a witness interview (speech bubble with a sound wave) and a magnifying glass.
function lockers(x, y, n) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const lx = x + i * 46;
    s += rect(lx, y, 44, 190, vgrad([[0, light(DOM.listening, 0.42)], [1, light(DOM.listening, 0.22)]]));
    s += rect(lx + 38, y, 6, 190, shade(light(DOM.listening, 0.3), 0.15), 'opacity=".6"');
    for (let k = 0; k < 4; k++) s += rrect(lx + 10, y + 14 + k * 6, 22, 2.5, 1.2, shade(light(DOM.listening, 0.3), 0.25));
    s += rrect(lx + 30, y + 90, 4, 16, 2, "#d5dde5");
  }
  return s;
}
function pin(x, y, c) {
  return circle(x + 1, y + 2, 4.5, INK, 'opacity=".2"') + circle(x, y, 4.5, c) + circle(x - 1.4, y - 1.4, 1.5, "#ffffff", 'opacity=".7"');
}
function board() {
  let s = blur(rrect(196, 52, 258, 168, 10, INK), 8, 0.24);
  s += rrect(190, 44, 258, 168, 10, "#a8754c") + rrect(198, 52, 242, 152, 6, vgrad([[0, "#d9a873"], [1, "#c99460"]]));
  // pinned clue cards
  const notes = [[214, 66, 64, 46, "#fffaf0", -4], [306, 62, 54, 60, "#ffffff", 3], [380, 70, 48, 40, "#fde9a8", -3], [226, 138, 70, 46, "#ffffff", 2], [338, 136, 78, 52, "#e6f2ee", -2]];
  // string between pins
  s += path("M246 70 L333 66 L404 74 M333 66 L261 142 L377 140 L404 74", "none", `stroke="${P.coral}" stroke-width="1.8" opacity=".9"`);
  notes.forEach(([x, y, w, h, c, a], i) => {
    s += rot(x + w / 2, y + h / 2, a, rect(x + 2, y + 3, w, h, INK, 'opacity=".14"') + rect(x, y, w, h, c) + bars(x + 8, y + 12 + (i === 1 ? 22 : 0), w - 16, [1, 0.7, 0.85].slice(0, i === 1 ? 2 : 3), { gap: 9, h: 3.5, color: "#c3ccd6" }) +
      (i === 1 ? rect(x + 8, y + 8, w - 16, 18, light(DOM.listening, 0.6)) + circle(x + w / 2, y + 15, 5, DOM.listening) : ""));
  });
  [[246, 70, P.coral], [333, 66, P.gold], [404, 74, P.teal], [261, 142, P.gold], [377, 140, P.coral]].forEach(([x, y, c]) => (s += pin(x, y, c)));
  return s;
}
function shelf() {
  let s = rect(476, 168, 130, 8, P.woodDark) + rect(476, 176, 130, 4, shade(P.woodDark, 0.25));
  // books + green notebook
  s += rect(490, 120, 14, 48, DOM.reading) + rect(506, 126, 12, 42, P.gold) + rect(520, 116, 16, 52, P.coral);
  s += rot(560, 150, -14, rrect(544, 124, 30, 42, 3, vgrad([[0, light(P.green, 0.15)], [1, shade(P.green, 0.1)]])) + rect(548, 124, 3, 42, shade(P.green, 0.3)) + rrect(554, 134, 14, 6, 2, "#ffffff", 'opacity=".75"'));
  return s;
}

export default {
  file: "ds/reality-mystery.svg",
  w: 640,
  h: 360,
  title: "Mystery Academy — School Investigation Scene",
  grain: false,
  draw: () =>
    begin() +
    clipRect(0, 0, 640, 360, 20,
      rect(0, 0, 640, 360, vgrad([[0, "#f6efe2"], [1, "#ecdfc8"]])) +
      rect(0, 226, 640, 10, "#d9c7a8") +
      ground(640, 236, 124, "tile") +
      lockers(18, 46, 3) +
      floorShadow(88, 238, 80, 6, 0.18) +
      board() +
      wallWindow(492, 40, 100, 60, { view: "day" }) +
      shelf() +
      bubble(470, 216, 136, 64, "#ffffff", { tail: "bl" }) + wave(538, 248, 92, 30, DOM.listening, 13) +
      magnifier(210, 286, 34, { deg: 140 }) +
      sparkle(160, 28, 7, P.gold) + sparkle(620 - 16, 314, 6, P.coral)),
};

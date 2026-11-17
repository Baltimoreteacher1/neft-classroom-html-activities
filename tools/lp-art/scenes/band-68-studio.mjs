import { begin, wash, blob, card, bars, check, sparkle, pencil, floorShadow, rot, path, poly, rect, rrect, circle, line, vgrad, blur, P, light, shade, DOM, INK } from "../lib/g.mjs";

// Grades 6-8 studio desk: an evidence chart, two sources compared side by side, a seminar notebook.
function chartCard() {
  let s = card(30, 36, 150, 112, 12, "#ffffff");
  s += rrect(44, 50, 70, 7, 3.5, P.navy);
  s += line(48, 132, 166, 132, "#d6dce4", 2);
  [[56, 38, P.teal], [82, 58, P.coral], [108, 74, DOM.reading], [134, 46, P.gold]].forEach(([x, h, c]) => (s += rrect(x, 132 - h, 18, h, 4, vgrad([[0, light(c, 0.15)], [1, c]]))));
  s += path("M60 104 L90 84 L116 70 L144 88", "none", `stroke="${P.navy}" stroke-width="2.2" stroke-dasharray="2 4" stroke-linecap="round"`);
  return s;
}
function source(x, y, c, a) {
  return rot(x + 60, y + 34, a,
    card(x, y, 120, 68, 10, "#ffffff") + rrect(x + 6, y + 12, 5, 44, 2.5, c) +
      circle(x + 26, y + 22, 9, light(c, 0.75)) + circle(x + 26, y + 22, 4.5, c) +
      bars(x + 42, y + 16, 64, [1, 0.6], { gap: 10, h: 5, color: "#d0d7e0" }) + bars(x + 18, y + 44, 88, [1, 0.75], { gap: 9, h: 4, color: "#e1e6ec" }));
}
function notebook() {
  let s = blur(rrect(66, 168, 196, 86, 8, INK), 7, 0.22);
  s += rrect(58, 160, 200, 88, 8, vgrad([[0, "#2c5a8a"], [1, P.navy]]));
  s += rrect(62, 156, 94, 86, 6, "#fffaf0") + rrect(160, 156, 94, 86, 6, "#ffffff");
  s += bars(72, 172, 74, [1, 0.9, 1, 0.7, 0.85], { gap: 12, h: 3, color: "#c7d3e3" }) + bars(170, 172, 74, [1, 0.6, 0.9, 1, 0.5], { gap: 12, h: 3, color: "#c7d3e3" });
  s += rrect(170, 167, 52, 9, 3, light(P.gold, 0.55), 'opacity=".9"');
  for (let i = 0; i < 7; i++) s += circle(158, 166 + i * 11, 3.2, "#9aa7b4");
  return s;
}

export default {
  file: "ds/band-68-studio.svg",
  w: 360,
  h: 270,
  title: "Grades 6 to 8 Academic Language Studio with evidence chart, source comparison, and seminar notebook",
  grain: false,
  draw: () =>
    begin() +
    wash(360, 270, "#fbf7ee", "#efe5d2", { r: 22, glow: "#ffffff", gy: 0.35 }) +
    blob(190, 140, 170, 116, "#efe3c9", { tilt: 6 }) +
    chartCard() +
    source(200, 30, P.teal, 3) +
    source(214, 96, P.coral, -3) +
    path("M262 102 v-4", "none") +
    notebook() +
    pencil(266, 238, 112, -38, { body: P.teal, w: 12 }) +
    sparkle(192, 22, 6, P.gold) + sparkle(30, 180, 6, P.coral) + circle(334, 132, 3.5, P.teal),
};

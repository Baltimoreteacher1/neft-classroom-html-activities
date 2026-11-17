import {
  bars,
  begin,
  blur,
  bubble,
  circle,
  DOM,
  dots,
  floorShadow,
  grad,
  INK,
  light,
  line,
  P,
  path,
  rect,
  rrect,
  shade,
  sparkle,
  stage,
  vgrad,
  wave,
} from "../lib/g.mjs";

const D = DOM.speaking;
function mic(x, y) {
  let s = floorShadow(x, y + 2, 34, 5, 0.26);
  s += rrect(x - 26, y - 6, 52, 8, 4, "#9aa7b4") + rect(x - 3, y - 98, 6, 92, "#b5c1ce");
  s += path(
    `M${x - 22} ${y - 118} A22 22 0 0 0 ${x + 22} ${y - 118}`,
    "none",
    `stroke="#b5c1ce" stroke-width="5" stroke-linecap="round"`,
  );
  s += rrect(
    x - 15,
    y - 168,
    30,
    58,
    15,
    vgrad([
      [0, light(D, 0.25)],
      [1, shade(D, 0.1)],
    ]),
  );
  for (let i = 0; i < 4; i++) s += rrect(x - 8, y - 156 + i * 9, 16, 3, 1.5, light(D, 0.55));
  s += rrect(x - 10, y - 164, 5, 22, 2.5, "#ffffff", 'opacity=".3"');
  return s;
}
function flag(x, y) {
  return (
    floorShadow(x + 2, y + 2, 10, 3, 0.25) +
    line(x, y, x, y - 50, P.navy, 3.2) +
    path(
      `M${x + 1} ${y - 50} C${x + 14} ${y - 56} ${x + 22} ${y - 42} ${x + 36} ${y - 48} V${y - 28} C${x + 22} ${y - 22} ${x + 14} ${y - 36} ${x + 1} ${y - 30}Z`,
      vgrad([
        [0, light(P.gold, 0.15)],
        [1, P.gold],
      ]),
    )
  );
}

export default {
  file: "worlds/conversation-quest.svg",
  w: 640,
  h: 360,
  title: "Conversation Quest",
  draw: () =>
    begin() +
    stage(D) +
    bubble(70, 64, 220, 108, D, { tail: "bl", r: 22 }) +
    bars(98, 92, 164, [1, 0.8, 0.55], { gap: 18, h: 9, color: "#ffffff" }) +
    bubble(236, 150, 210, 100, "#ffffff", { tail: "br", r: 22 }) +
    wave(341, 200, 150, 50, D, 17) +
    mic(512, 300) +
    path(
      "M60 334 C130 318 190 344 260 330 C330 316 380 340 430 328",
      "none",
      `stroke="#ffffff" stroke-width="4" stroke-dasharray="1 12" stroke-linecap="round" opacity=".85"`,
    ) +
    circle(60, 334, 7, P.gold) +
    circle(260, 330, 7, "#ffffff") +
    flag(432, 330) +
    dots(D),
};

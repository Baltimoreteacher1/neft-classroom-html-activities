import {
  bars,
  begin,
  blob,
  card,
  check,
  circle,
  DOM,
  floorShadow,
  grad,
  light,
  P,
  path,
  rect,
  rot,
  rrect,
  shade,
  sparkle,
  vgrad,
} from "../lib/g.mjs";

// Passport stamp: inked ring + filled disc + tick, slightly rotated like a real stamp.
const stamp = (x, y, c, a) =>
  rot(
    x,
    y,
    a,
    circle(
      x,
      y,
      27,
      "none",
      `stroke="${c}" stroke-width="2.4" stroke-dasharray="3 3" opacity=".7"`,
    ) + check(x, y, 21, c, { shadow: false, ring: false }),
  );

export default {
  file: "ds/progress-passport.svg",
  w: 360,
  h: 270,
  title: "A practice passport with four stamps",
  grain: false,
  draw: () =>
    begin() +
    blob(180, 138, 124, 112, "#dfe7f6", { tilt: 8 }) +
    floorShadow(186, 246, 92, 9, 0.2) +
    rot(
      180,
      140,
      -6,
      // cover peeking behind
      card(100, 40, 168, 200, 16, P.navy, { flat: true, edge: false }) +
        rrect(
          100,
          40,
          168,
          200,
          16,
          vgrad([
            [0, "#2c5a8a"],
            [1, P.navy],
          ]),
        ) +
        rrect(
          108,
          48,
          152,
          184,
          12,
          "none",
          `stroke="${P.goldLight}" stroke-width="1.5" opacity=".5"`,
        ) +
        // open page
        card(92, 32, 168, 200, 14, "#fffaf0", { sd: 4, o: 0.2, dy: 4 }) +
        rrect(92, 32, 14, 200, 7, shade("#fffaf0", 0.06)) +
        bars(118, 50, 120, [0.7, 0.45], { gap: 13, h: 6, color: "#cfd6e0" }) +
        stamp(144, 112, DOM.listening, -10) +
        stamp(210, 110, DOM.reading, 8) +
        stamp(146, 180, DOM.speaking, 6) +
        stamp(212, 180, DOM.writing, -8),
    ) +
    sparkle(286, 70, 9, P.gold) +
    sparkle(64, 196, 8, P.navy) +
    circle(74, 96, 4.5, P.gold) +
    circle(300, 196, 4.5, P.coral) +
    sparkle(312, 132, 5, "#7f9fd6"),
};

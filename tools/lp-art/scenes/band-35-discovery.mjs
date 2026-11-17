import { begin, wash, blob, card, bars, check, bubble, wave, sparkle, magnifier, floorShadow, rot, path, poly, rect, rrect, circle, line, vgrad, P, light, shade, DOM } from "../lib/g.mjs";
import { person, SKIN, HAIR, tuft } from "../../../access-practice-lab/src/art/kit.js";

// Grades 3-5: two children with story cards, a speaking bubble and a nature field map.
function storyCard() {
  let s = card(24, 30, 140, 92, 12, "#ffffff");
  s += rrect(34, 40, 52, 38, 6, vgrad([[0, "#cfe7f1"], [1, "#e9f4ee"]])) + path("M34 72 Q50 58 62 66 Q72 56 86 64 V78 H34Z", "#8cc07a") + circle(76, 50, 5, P.gold);
  s += bars(94, 44, 60, [1, 0.7, 0.85], { gap: 10, h: 4.5, color: "#ccd4de" });
  // sequence chips 1 -> 2 -> check
  s += rrect(34, 90, 28, 22, 6, light(P.gold, 0.7)) + rrect(76, 90, 28, 22, 6, light(P.coral, 0.75));
  s += path("M48 101 h0", "none") + line(62, 101, 76, 101, "#b8c2cd", 2) + line(104, 101, 118, 101, "#b8c2cd", 2);
  s += `<text x="48" y="106" font-family="'Atkinson Hyperlegible', Arial, sans-serif" font-size="13" font-weight="700" fill="${P.ink}" text-anchor="middle">1</text>`;
  s += `<text x="90" y="106" font-family="'Atkinson Hyperlegible', Arial, sans-serif" font-size="13" font-weight="700" fill="${P.ink}" text-anchor="middle">2</text>`;
  s += check(131, 101, 11, P.teal, { shadow: false, ring: false });
  return s;
}
function fieldMap() {
  let s = card(216, 140, 124, 76, 10, "#fbf3e0");
  s += path("M222 196 Q252 176 280 186 Q308 196 334 178 V208 H222Z", "#cfe3c2");
  s += path("M226 156 C250 150 262 170 290 160 C310 152 322 164 334 158", "none", `stroke="#a9d3e4" stroke-width="5" stroke-linecap="round"`);
  s += path("M234 200 C254 186 274 194 292 176 C302 166 312 166 318 160", "none", `stroke="${P.navy}" stroke-width="2.2" stroke-dasharray="1 5" stroke-linecap="round"`);
  s += path("M318 160 c0 -10 -14 -10 -14 0 c0 6 7 12 7 12 c0 0 7 -6 7 -12Z", P.coral, 'transform="translate(7 -10)"') + circle(318, 150, 2.4, "#ffffff");
  s += poly([[238, 182], [244, 170], [250, 182]], P.leaf) + poly([[248, 184], [254, 172], [260, 184]], P.leafDark);
  return s;
}

export default {
  file: "ds/band-35-discovery.svg",
  w: 360,
  h: 270,
  title: "Grades 3 to 5 Visual Language Discovery scene with story cards, speaking bubble, and nature field map",
  grain: false,
  draw: () =>
    begin() +
    wash(360, 270, "#fffaf0", "#f7ecd6", { r: 22, glow: "#ffffff", gy: 0.3 }) +
    path("M0 214 Q90 196 180 206 Q270 216 360 200 V248 Q360 270 338 270 H22 Q0 270 0 248Z", vgrad([[0, "#cfe3c2"], [1, "#b7d6a6"]])) +
    storyCard() +
    bubble(206, 22, 128, 66, "#fde6df", { tail: "bl" }) + wave(270, 54, 84, 30, P.coral, 13) +
    fieldMap() +
    person(116, 252, 118, { pose: "reach", skin: SKIN[3], hair: HAIR[0], hairStyle: "puffs", top: P.teal, bottom: P.navy, sleeve: "short", facing: -1, mouth: "smile" }) +
    person(180, 254, 112, { pose: "point", skin: SKIN[1], hair: HAIR[2], hairStyle: "short", top: P.coral, bottom: "#3e4a5c", facing: 1, mouth: "open" }) +
    magnifier(52, 206, 15, { deg: 50 }) +
    tuft(24, 262) + tuft(342, 258, 0.9) +
    sparkle(184, 30, 6, P.gold) + circle(344, 112, 3.5, P.teal),
};

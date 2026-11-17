import { begin, card, bars, pencil, sparkle, floorShadow, rot, path, poly, rect, rrect, circle, line, vgrad, blur, P, light, shade, mix, DOM, INK } from "../lib/g.mjs";
import { stage, dots } from "../lib/g.mjs";

const D = DOM.writing;
function book() {
  let s = blur(path("M140 290 C220 270 280 280 324 300 C368 280 428 270 508 290 V302 H140Z", INK), 8, 0.3);
  // cover edge
  s += path("M130 292 C210 272 280 278 324 302 C368 278 438 272 518 292 L514 304 C440 286 370 292 324 312 C278 292 208 286 134 304Z", shade(D, 0.05));
  // left page (picture) and right page (writing)
  s += path("M146 112 C210 96 276 100 320 126 V296 C276 272 210 268 146 284Z", vgrad([[0, "#fffaf0"], [1, "#f1e6d2"]]));
  s += path("M328 126 C372 100 438 96 502 112 V284 C438 268 372 272 328 296Z", vgrad([[0, "#ffffff"], [1, "#f4ede0"]]));
  s += path("M316 124 C320 124 328 124 332 124 V298 H316Z", "#e2d6c2", 'opacity=".7"');
  // picture on the left page
  s += rot(232, 168, -4, rrect(176, 132, 116, 78, 6, vgrad([[0, "#cfe7f1"], [1, "#fde9c8"]])) + circle(268, 150, 9, P.gold) + path("M176 196 Q206 168 230 184 Q252 164 292 186 V210 H176Z", "#8cc07a") + path("M176 210 V200 Q220 190 292 204 V210Z", "#6aa275"));
  s += rot(232, 240, -4, bars(178, 226, 110, [1, 0.8, 0.9], { gap: 12, h: 4.5, color: "#d8cbb6" }));
  s += rot(414, 200, 4, bars(352, 140, 124, [0.6, 1, 0.9, 1, 0.75, 1, 0.85, 0.5], { gap: 16, h: 4.5, color: "#cfd6e0" }) + rrect(352, 136, 74, 10, 3, light(P.gold, 0.55), 'opacity=".9"'));
  // ribbon bookmark
  s += path("M452 102 h18 v58 l-9 -8 l-9 8Z", vgrad([[0, P.coral], [1, shade(P.coral, 0.15)]]));
  return s;
}

export default {
  file: "worlds/storyworks.svg",
  w: 640,
  h: 360,
  title: "StoryWorks",
  draw: () =>
    begin() + stage(D) +
    rot(92, 112, -6, card(46, 70, 96, 72, 10, "#ffffff") + bars(60, 88, 68, [1, 0.7, 0.85], { gap: 12, h: 5, color: "#d3dae3" }) + circle(130, 80, 6, D)) +
    book() +
    pencil(500, 296, 190, -58, { body: P.gold }) +
    dots(D),
};

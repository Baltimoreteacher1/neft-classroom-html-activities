import { P, SKIN, HAIR, panels, rect, rrect, path, stroke, text, board, clock, wallWindow, g, vgrad, shade, light, person, PROPS, tr } from "../../../access-practice-lab/src/art/kit.js";
import { joints, helmet, hydrant, stethoscope, clipboard, vestStripes } from "../lib/d.mjs";

// Three helpers side by side (left to right): firefighter with a hose by a red hydrant; nurse with a
// stethoscope and clipboard; teacher holding a book and pointing at the chalkboard.
const AH = 214;

const wall = (x, y, w, h, top, bottom) => rect(x, y, w, h, vgrad([[0, top], [1, bottom]]));

const fire = (x, y, w, h) => {
  const gy = y + h - 40;
  const o = { pose: "hold", age: "adult", skin: SKIN[3], hair: HAIR[0], hairStyle: "short", top: "#c9a24a", coat: "#c9a24a", bottom: "#b08a3a", shoes: "#2b2f36", mouth: "smile" };
  const fx = x + 78;
  const J = joints(fx, gy, AH, o);
  const [hx, hy] = J.hand;
  const [bx, by] = J.backHand;
  let bricks = "";
  for (let r = 0; r < 14; r++) { bricks += `M${x} ${y + r * 16}h${w}`; for (let c = 0; c < 8; c++) bricks += `M${x + c * 30 + (r % 2) * 15} ${y + r * 16}v16`; }
  let s = wall(x, y, w, gy - y, "#d9a08a", "#c98a74") + stroke(bricks, "#b9735e", 1.2, 'opacity=".5"');
  s += rect(x, gy - 6, w, h, vgrad([[0, "#cfccc4"], [1, "#a19e96"]]));
  s += hydrant(x + 30, gy + 6, 1.4);
  // hose: hydrant outlet -> along the ground -> up into both hands -> nozzle forward
  s += stroke(`M${x + 46} ${gy - 28} C${x + 70} ${gy - 28} ${x + 56} ${gy - 1} ${x + 90} ${gy - 1} C${x + 160} ${gy - 1} ${x + 150} ${by + 50} ${bx} ${by}`, "#8a4434", 9);
  s += person(fx, gy, AH, o) + vestStripes(J.chest, J.s * 1.05) + helmet(J.head, J.headR, 1);
  s += stroke(`M${bx} ${by} L${hx + 4} ${hy - 1}`, "#8a4434", 9) + `<g transform="translate(${hx.toFixed(1)} ${hy.toFixed(1)}) rotate(-34)">${rrect(2, -6, 22, 12, 3, "#3c4652")}${rect(22, -7, 6, 14, "#9aa3ad")}</g>`;
  return s;
};

const nurse = (x, y, w, h) => {
  const gy = y + h - 40;
  const o = { pose: "hold", age: "adult", skin: SKIN[0], hair: HAIR[1], hairStyle: "bun", top: "#5fb3b0", bottom: "#4a9c99", sleeve: "short", item: clipboard(1.1), mouth: "smile" };
  const nx = x + 88;
  const J = joints(nx, gy, AH, o);
  let s = wall(x, y, w, gy - y, "#e6f1f2", "#d3e6e8") + rect(x, gy - 70, w, 6, "#b9d3d6");
  s += rrect(x + 118, y + 64, 52, 52, 10, "#ffffff") + path(`M${x + 144} ${y + 104} l-14 -14 a8 8 0 0 1 14 -10 a8 8 0 0 1 14 10Z`, P.coral);
  s += rect(x, gy - 6, w, h, vgrad([[0, "#e9e4da"], [1, "#c8c1b3"]])) + stroke(`M${x} ${gy + 20}H${x + w}`, "#b9b1a2", 1);
  s += person(nx, gy, AH, o) + stethoscope(J.neck, J.s);
  return s;
};

const teacher = (x, y, w, h) => {
  const gy = y + h - 40;
  const o = { pose: "point", age: "adult", skin: SKIN[4], hair: HAIR[0], hairStyle: "curly", top: P.coral, bottom: P.navy, mouth: "open" };
  const tx = x + 52;
  const J = joints(tx, gy, AH, o);
  const [bx, by] = J.backHand;
  const marks = text(x + 112, y + 104, "A B C", { size: 22, fill: "#f4f1e6", weight: 700 }) + text(x + 112, y + 138, "1 2 3", { size: 22, fill: "#f4f1e6", weight: 700 });
  let s = wall(x, y, w, gy - y, "#f4e7cf", "#ecdcc2");
  s += board(x + 66, y + 66, 120, 98, { kind: "chalk", marks });
  s += rect(x, gy - 6, w, h, vgrad([[0, "#e6c9a0"], [1, "#c7a274"]]));
  s += person(tx, gy, AH, o);
  s += tr(bx + 4, by - 6, `<g transform="rotate(-8)">${rrect(-14, -18, 28, 34, 2, P.blue)}${rect(-14, -18, 5, 34, shade(P.blue, 0.3))}${rect(10, -16, 3, 30, "#f4f1e6")}</g>`);
  return s;
};

export default {
  file: "35t-helpers.svg",
  w: 640,
  h: 400,
  title: "Three community helpers side by side. On the left, a firefighter in a helmet holds a hose next to a red fire hydrant. In the middle, a nurse wears a stethoscope and holds a clipboard. On the right, a teacher holds a book and points to a chalkboard.",
  draw: () => panels(640, 400, 3, (i, x, y, w, h) => [fire, nurse, teacher][i](x, y, w, h), { numbered: false }),
};

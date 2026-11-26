// Drawings for the Communication Consequence Engine: the robot's grid (path rounds and ordered pairs), the
// warehouse shelf (ordinal words) and the character portrait for talk rounds. End states are drawn directly (no
// animation), every mark carries a text label, and each SVG has a text alternative that states the consequence.
import { portraitSVG } from "../sim/art.js";
import { esc } from "../util.js";

const CELL = 52;
const PAD = 34;

const robotMark = (cx, cy) =>
  `<g class="cq-robot" transform="translate(${cx} ${cy})"><rect x="-15" y="-15" width="30" height="26" rx="6"/><circle class="cq-eye" cx="-6" cy="-3" r="3.2"/><circle class="cq-eye" cx="6" cy="-3" r="3.2"/><rect class="cq-wheel" x="-13" y="11" width="9" height="6" rx="2"/><rect class="cq-wheel" x="4" y="11" width="9" height="6" rx="2"/></g>`;

/** Coordinate grid with the robot where the words left it. `scene` comes from the engine (or the round at rest). */
export function gridSVG(round, scene, I) {
  const { w, h } = round.grid;
  const W = PAD * 2 + CELL * (w - 1);
  const H = PAD * 2 + CELL * (h - 1);
  const px = (x) => PAD + x * CELL;
  const py = (y) => H - PAD - y * CELL;
  let lines = "";
  for (let x = 0; x < w; x += 1)
    lines += `<line class="cq-line" x1="${px(x)}" y1="${py(0)}" x2="${px(x)}" y2="${py(h - 1)}"/><text class="cq-tick" x="${px(x)}" y="${H - 10}">${x}</text>`;
  for (let y = 0; y < h; y += 1)
    lines += `<line class="cq-line" x1="${px(0)}" y1="${py(y)}" x2="${px(w - 1)}" y2="${py(y)}"/><text class="cq-tick" x="12" y="${py(y) + 5}">${y}</text>`;
  const items = (round.items || [])
    .map((it) => {
      const goal = it.at[0] === round.target[0] && it.at[1] === round.target[1];
      const label = I.S(it.label[0], it.label[1]);
      return `<g class="cq-item${goal ? " is-goal" : ""}"><rect x="${px(it.at[0]) - 13}" y="${py(it.at[1]) - 13}" width="26" height="26" rx="${goal ? 13 : 4}"/><text class="cq-item-label" x="${px(it.at[0])}" y="${py(it.at[1]) - 18}">${esc(goal ? `★ ${label}` : label)}</text></g>`;
    })
    .join("");
  const path = scene?.path || [round.start];
  const pts = path.map(([x, y]) => `${px(x)},${py(y)}`).join(" ");
  const end = scene?.end || round.start;
  const trail =
    path.length > 1
      ? `<polyline class="cq-path" points="${pts}"/>${path.map(([x, y]) => `<circle class="cq-step" cx="${px(x)}" cy="${py(y)}" r="4"/>`).join("")}`
      : "";
  const goal = round.items.find(
    (it) => it.at[0] === round.target[0] && it.at[1] === round.target[1],
  );
  const alt = I.S(
    `Grid. The robot is at (${end[0]}, ${end[1]}). The ${goal.label[0]} is at (${round.target[0]}, ${round.target[1]}).`,
    `Cuadrícula. El robot está en (${end[0]}, ${end[1]}). ${goal.label[1]}: en (${round.target[0]}, ${round.target[1]}).`,
  );
  return `<svg class="cq-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(alt)}" focusable="false">${lines}${items}${trail}${robotMark(px(end[0]), py(end[1]))}</svg>`;
}

/** The warehouse shelf: boxes in rows, the goal marked with a star, the picked box outlined and labelled. */
export function shelfSVG(round, scene, I) {
  const { w, h } = round.grid;
  const BW = 92;
  const BH = 62;
  const W = 16 + w * (BW + 10);
  const H = 16 + h * (BH + 26);
  const picked = scene?.picked;
  let boxes = "";
  for (const it of round.items) {
    const [c, r] = it.at;
    const x = 12 + (c - 1) * (BW + 10);
    const y = 12 + (r - 1) * (BH + 26);
    const goal = c === round.target[0] && r === round.target[1];
    const isPicked = picked && picked[0] === c && picked[1] === r;
    const label = I.S(it.label[0], it.label[1]);
    boxes += `<g class="cq-box${goal ? " is-goal" : ""}${isPicked ? " is-picked" : ""}"><rect x="${x}" y="${y}" width="${BW}" height="${BH}" rx="6"/><text class="cq-box-label" x="${x + BW / 2}" y="${y + BH / 2 + 5}">${esc(goal ? `★ ${label}` : label)}</text>${isPicked ? `<text class="cq-box-tag" x="${x + BW / 2}" y="${y + BH + 17}">${esc(I.S("picked", "elegida"))}</text>` : ""}</g>`;
  }
  let shelves = "";
  for (let r = 1; r <= h; r += 1) {
    const y = 12 + (r - 1) * (BH + 26) + BH + 2;
    shelves += `<rect class="cq-shelf" x="4" y="${y}" width="${W - 8}" height="5" rx="2"/>`;
  }
  const pickedItem =
    picked && round.items.find((it) => it.at[0] === picked[0] && it.at[1] === picked[1]);
  const alt = pickedItem
    ? I.S(
        `Shelves. The robot picked the box of ${pickedItem.label[0]}.`,
        `Estantes. El robot eligió la caja de ${pickedItem.label[1]}.`,
      )
    : I.S(
        "Shelves with twelve boxes in three rows. The robot has not picked a box.",
        "Estantes con doce cajas en tres filas. El robot no ha elegido ninguna caja.",
      );
  return `<svg class="cq-svg cq-shelf-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(alt)}" focusable="false">${shelves}${boxes}</svg>`;
}

export const robotSceneSVG = (round, scene, I) =>
  round.kind === "pick" ? shelfSVG(round, scene, I) : gridSVG(round, scene, I);

export const characterPortrait = (scenario, mood) =>
  portraitSVG(scenario.character.look || "expert", mood || "neutral", 84);

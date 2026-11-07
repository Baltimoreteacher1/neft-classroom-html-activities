// Pictures for How Many Are Hiding?: counters, the leaf cover, the pet and the garden. Drawn in plain SVG so they work
// in every theme. Every zone has a fixed size, so the board never shows how many counters are under the leaf.
import { COLS, gridPoints } from "./hiding-core.js";

export const PITCH = 38;
export const ZONE_W = COLS * PITCH;
export const ZONE_H = 4 * PITCH; // room for 20 counters; the same for every round

const COLORS = { circle: "#d6455d", oval: "#8a5a2b", diamond: "#2f7fc1" };

function counter(shape, x, y, extra = "") {
  const fill = `fill="${COLORS[shape]}" stroke="#13233a" stroke-width="2"`;
  if (shape === "oval") return `<ellipse cx="${x}" cy="${y}" rx="11" ry="15" ${fill} ${extra}/>`;
  if (shape === "diamond")
    return `<polygon points="${x},${y - 16} ${x + 14},${y} ${x},${y + 16} ${x - 14},${y}" ${fill} ${extra}/>`;
  return `<circle cx="${x}" cy="${y}" r="14" ${fill} ${extra}/>`;
}

const frame = (inner, label, height = ZONE_H) =>
  `<svg class="hd-zone" viewBox="0 0 ${ZONE_W} ${height}" role="img" aria-label="${label}" focusable="false">${inner}</svg>`;

// The counters you can see.
export const shownZone = (count, shape, label) =>
  frame(
    gridPoints(count, PITCH)
      .map(({ x, y }) => counter(shape, x, y))
      .join(""),
    label,
  );

// The leaf over the hidden counters. After the round is solved the leaf lifts and the hidden counters appear.
export function hiddenZone({ count, shape, solved, leafLabel, revealLabel }) {
  if (solved)
    return frame(
      gridPoints(count, PITCH)
        .map(({ x, y }) => counter(shape, x, y))
        .join(""),
      revealLabel,
    );
  const leaf = `<path class="hd-leaf" d="M12 ${ZONE_H - 14} C0 40 60 4 ${ZONE_W - 10} 14 C${ZONE_W - 2} 80 ${ZONE_W - 50} ${ZONE_H - 6} 12 ${ZONE_H - 14}Z" fill="#3f9d5c" stroke="#13233a" stroke-width="3"/><path d="M26 ${ZONE_H - 24} C70 90 110 50 ${ZONE_W - 24} 26" fill="none" stroke="#bfe6c8" stroke-width="3" stroke-linecap="round"/><text x="${ZONE_W / 2}" y="${ZONE_H / 2 + 20}" text-anchor="middle" font-size="64" font-weight="700" fill="#fff" stroke="#13233a" stroke-width="2" paint-order="stroke">?</text>`;
  return frame(leaf, leafLabel);
}

// The learner's own picture of their setting: dashed counters, numbered as a count-on when they ask for help.
export function guessTray(count, shown, shape, countOn, label) {
  const rows = Math.max(1, Math.ceil(count / COLS));
  const dots = gridPoints(count, PITCH)
    .map(({ x, y }, i) => {
      const mark = counter(shape, x, y, 'fill-opacity=".18" stroke-dasharray="5 4"').replace(
        /fill="[^"]+"/,
        'fill="#ffffff"',
      );
      return (
        mark +
        (countOn
          ? `<text x="${x}" y="${y + 6}" text-anchor="middle" font-size="17" font-weight="700" fill="#13233a">${shown + i + 1}</text>`
          : "")
      );
    })
    .join("");
  return frame(dots, label, rows * PITCH);
}

// The pet, a round bunny. `joy` raises the arms for the win screen.
export const pet = (joy = false) =>
  `<svg class="hd-pet" viewBox="0 0 90 100" aria-hidden="true" focusable="false"><ellipse cx="32" cy="22" rx="8" ry="20" fill="#f4e9dc" stroke="#13233a" stroke-width="3"/><ellipse cx="58" cy="22" rx="8" ry="20" fill="#f4e9dc" stroke="#13233a" stroke-width="3"/><ellipse cx="32" cy="24" rx="3.5" ry="13" fill="#f2a6b4"/><ellipse cx="58" cy="24" rx="3.5" ry="13" fill="#f2a6b4"/><circle cx="45" cy="60" r="32" fill="#f4e9dc" stroke="#13233a" stroke-width="3"/><circle cx="34" cy="55" r="4" fill="#13233a"/><circle cx="56" cy="55" r="4" fill="#13233a"/><ellipse cx="45" cy="66" rx="5" ry="3.5" fill="#f2a6b4" stroke="#13233a" stroke-width="2"/><path d="M36 73 Q45 ${joy ? 84 : 79} 54 73" fill="none" stroke="#13233a" stroke-width="3" stroke-linecap="round"/>${joy ? '<path d="M8 40 L22 56 M82 40 L68 56" stroke="#13233a" stroke-width="5" stroke-linecap="round"/>' : ""}</svg>`;

// One flower per garden stage: grown (petals) or still a seed in the soil.
export function flower(grown, index) {
  const petals = ["#e8576f", "#f3b61f", "#6a5acd", "#2f9fc1"][index % 4];
  const bloom = grown
    ? `<path d="M30 48 V20" stroke="#2f8a4f" stroke-width="4" stroke-linecap="round"/><path d="M30 38 C18 36 16 28 22 26 C28 26 30 32 30 38Z" fill="#3f9d5c"/>${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="30" cy="9" rx="6" ry="9" fill="${petals}" stroke="#13233a" stroke-width="1.5" transform="rotate(${a} 30 18)"/>`).join("")}<circle cx="30" cy="18" r="5" fill="#f3b61f" stroke="#13233a" stroke-width="1.5"/>`
    : '<ellipse cx="30" cy="44" rx="5" ry="3.5" fill="#8a5a2b" stroke="#13233a" stroke-width="1.5"/>';
  return `<svg class="hd-flower${grown ? " grown" : ""}" viewBox="0 0 60 60" aria-hidden="true" focusable="false">${bloom}<path d="M6 52 Q30 44 54 52 V58 H6Z" fill="#8a5a2b" stroke="#13233a" stroke-width="2"/></svg>`;
}

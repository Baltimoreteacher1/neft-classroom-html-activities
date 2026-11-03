// Soccer Stadium illustration. World units are metres, origin at the centre of the pitch, so a bigger field really is
// bigger on screen while the camera (viewBox) eases out to keep everything in view. Original vector art, no images.
import { s } from "../graphics/graphics-a-ui.js";
import { CELL_METERS, capacityOf } from "./stadium-math.js";

const C = {
  grass: "#2f7d4f",
  grass2: "#3a8f5d",
  line: "#f4f8f4",
  stand: "#244a6d",
  standEdge: "#17324d",
  seat: "#a8c4de",
  sold: "#f2c15b",
  ghost: "#17324d",
  cell: "#ffffff",
  ink: "#17324d",
  teal: "#1fa6a2",
};
const BLOCK_W = 14;
const BLOCK_D = 9;
const GAP = 2;
const GAP_GROUPS = 4;
const WALK = 6; // the walkway between the touchline and the stands; labels sit in it
const MAX_DOTS = 240;

// Where each seating section sits: half along the top touchline, half along the bottom.
export function sectionBlocks(state, arrangement) {
  if (arrangement === "groups") {
    // Equal groups as an array: up to four groups per row, rows stacked.
    const cols = Math.min(state.sections, 4);
    const rows = Math.ceil(state.sections / cols);
    return Array.from({ length: state.sections }, (_, i) => {
      const inRow = Math.min(cols, state.sections - Math.floor(i / cols) * cols);
      const rowWidth = inRow * BLOCK_W + (inRow - 1) * GAP_GROUPS;
      return {
        x: -rowWidth / 2 + (i % cols) * (BLOCK_W + GAP_GROUPS),
        y: -(rows * BLOCK_D + (rows - 1) * GAP_GROUPS) / 2 + Math.floor(i / cols) * (BLOCK_D + GAP_GROUPS),
        w: BLOCK_W,
        d: BLOCK_D,
      };
    });
  }
  const top = Math.ceil(state.sections / 2);
  const bottom = state.sections - top;
  const row = (count, y) => {
    const total = count * BLOCK_W + Math.max(0, count - 1) * GAP;
    return Array.from({ length: count }, (_, i) => ({
      x: -total / 2 + i * (BLOCK_W + GAP),
      y,
      w: BLOCK_W,
      d: BLOCK_D,
    }));
  };
  return [...row(top, -state.width / 2 - WALK - BLOCK_D), ...row(bottom, state.width / 2 + WALK)];
}

// The camera: a viewBox that holds the pitch, the stands and the labels.
export function frameFor(state, { ghost, arrangement } = {}) {
  const blocks = sectionBlocks(state, arrangement);
  const groups = arrangement === "groups";
  const halfL = groups ? 0 : Math.max(state.length, ghost ? ghost.length : 0) / 2;
  const halfW = groups ? 0 : Math.max(state.width, ghost ? ghost.width : 0) / 2;
  const minX = Math.min(-halfL, ...blocks.map((b) => b.x));
  const maxX = Math.max(halfL, ...blocks.map((b) => b.x + b.w));
  const top = Math.min(-halfW, ...blocks.map((b) => b.y));
  const bottom = Math.max(halfW, ...blocks.map((b) => b.y + b.d));
  const padX = Math.max(5, (maxX - minX) * 0.06);
  const padY = Math.max(4, (bottom - top) * 0.1);
  // Keep a 16:10 stage so the picture never jumps shape between steps.
  const ratio = 1.6;
  const width = Math.max(maxX - minX + padX * 2, (bottom - top + padY * 2) * ratio);
  const height = width / ratio;
  const cx = (minX + maxX) / 2;
  const cy = (top + bottom) / 2;
  return { x: cx - width / 2, y: cy - height / 2, w: width, h: height };
}

function pitch(g, state, opts) {
  const L = state.length;
  const W = state.width;
  const x0 = -L / 2;
  const y0 = -W / 2;
  g.append(s("rect", { x: x0, y: y0, width: L, height: W, fill: C.grass, rx: 0.8 }));
  const stripes = Math.max(2, Math.round(L / CELL_METERS / 2) * 2);
  for (let i = 0; i < stripes; i += 2)
    g.append(
      s("rect", {
        x: x0 + (i * L) / stripes,
        y: y0,
        width: L / stripes,
        height: W,
        fill: C.grass2,
      }),
    );
  const sw = Math.max(0.25, Math.min(L, W) / 90);
  const line = { fill: "none", stroke: C.line, "stroke-width": sw };
  g.append(s("rect", { x: x0, y: y0, width: L, height: W, ...line }));
  g.append(s("line", { x1: 0, y1: y0, x2: 0, y2: y0 + W, ...line }));
  g.append(s("circle", { cx: 0, cy: 0, r: Math.min(9.15, W / 4), ...line }));
  const boxW = Math.min(40.3, W * 0.62);
  const boxD = Math.min(16.5, L * 0.17);
  const goalW = Math.min(18.3, W * 0.34);
  const goalD = Math.min(5.5, L * 0.06);
  for (const side of [-1, 1]) {
    const edge = side * (L / 2);
    g.append(
      s("rect", {
        x: side < 0 ? edge : edge - boxD,
        y: -boxW / 2,
        width: boxD,
        height: boxW,
        ...line,
      }),
    );
    g.append(
      s("rect", {
        x: side < 0 ? edge : edge - goalD,
        y: -goalW / 2,
        width: goalD,
        height: goalW,
        ...line,
      }),
    );
    g.append(
      s("rect", {
        x: side < 0 ? edge - 1.6 : edge,
        y: -Math.min(3.66, W * 0.07),
        width: 1.6,
        height: Math.min(7.32, W * 0.14),
        fill: C.line,
        opacity: 0.9,
        rx: 0.3,
      }),
    );
  }
  if (opts.grid) gridOverlay(g, state, opts);
}

// A 5 m by 5 m grid: each square is 25 m². Whole squares are shaded so area can be counted.
function gridOverlay(g, state, opts) {
  const L = state.length;
  const W = state.width;
  const across = Math.floor(L / CELL_METERS);
  const down = Math.floor(W / CELL_METERS);
  const wire = Math.max(0.12, Math.min(L, W) / 160);
  for (let i = 0; i <= across; i += 1)
    g.append(
      s("line", {
        x1: -L / 2 + i * CELL_METERS,
        y1: -W / 2,
        x2: -L / 2 + i * CELL_METERS,
        y2: -W / 2 + down * CELL_METERS,
        stroke: C.cell,
        "stroke-width": wire,
        opacity: 0.55,
      }),
    );
  for (let j = 0; j <= down; j += 1)
    g.append(
      s("line", {
        x1: -L / 2,
        y1: -W / 2 + j * CELL_METERS,
        x2: -L / 2 + across * CELL_METERS,
        y2: -W / 2 + j * CELL_METERS,
        stroke: C.cell,
        "stroke-width": wire,
        opacity: 0.55,
      }),
    );
  g.append(
    s("rect", {
      x: -L / 2,
      y: -W / 2,
      width: across * CELL_METERS,
      height: down * CELL_METERS,
      fill: C.cell,
      opacity: 0.1,
    }),
  );
  if (opts.tiles) {
    const { kx, ky } = opts.tiles;
    for (let i = 0; i < kx; i += 1)
      for (let j = 0; j < ky; j += 1) {
        const tw = L / kx;
        const th = W / ky;
        g.append(
          s("rect", {
            x: -L / 2 + i * tw,
            y: -W / 2 + j * th,
            width: tw,
            height: th,
            fill: "none",
            stroke: C.sold,
            "stroke-width": Math.max(0.35, Math.min(L, W) / 70),
            "stroke-dasharray": "2 1.5",
          }),
        );
      }
  }
}

function seatBlock(g, block, seats, soldHere, label) {
  g.append(
    s("rect", {
      x: block.x,
      y: block.y,
      width: block.w,
      height: block.d,
      rx: 1,
      fill: C.stand,
      stroke: C.standEdge,
      "stroke-width": 0.35,
    }),
  );
  if (label) {
    const badge = s("text", { x: block.x + 0.9, y: block.y - 0.9, "font-size": 2.4, "font-weight": 700, fill: C.ink });
    badge.textContent = label;
    g.append(badge);
  }
  if (seats <= 0) return;
  const cols = Math.max(1, Math.ceil(Math.sqrt((seats * block.w) / block.d)));
  const rows = Math.ceil(seats / cols);
  const pad = 1;
  const stepX = (block.w - pad * 2) / cols;
  const stepY = (block.d - pad * 2) / rows;
  const r = Math.max(0.12, Math.min(stepX, stepY) * 0.38);
  for (let i = 0; i < seats; i += 1) {
    const cx = block.x + pad + stepX * ((i % cols) + 0.5);
    const cy = block.y + pad + stepY * (Math.floor(i / cols) + 0.5);
    g.append(s("circle", { cx, cy, r, fill: i < soldHere ? C.sold : C.seat }));
  }
}

// Large stands use one filled bar per section instead of hundreds of dots, so a Chromebook stays smooth.
function seatBar(g, block, seats, soldHere) {
  g.append(
    s("rect", {
      x: block.x,
      y: block.y,
      width: block.w,
      height: block.d,
      rx: 1,
      fill: C.stand,
      stroke: C.standEdge,
      "stroke-width": 0.35,
    }),
  );
  g.append(
    s("rect", {
      x: block.x + 1,
      y: block.y + 1,
      width: block.w - 2,
      height: block.d - 2,
      rx: 0.6,
      fill: C.seat,
      opacity: 0.85,
    }),
  );
  g.append(
    s("rect", {
      x: block.x + 1,
      y: block.y + 1,
      width: block.w - 2,
      height: block.d - 2,
      rx: 0.6,
      fill: "url(#rl-seat-dots)",
    }),
  );
  if (seats > 0 && soldHere > 0)
    g.append(
      s("rect", {
        x: block.x + 1,
        y: block.y + 1,
        width: ((block.w - 2) * soldHere) / seats,
        height: block.d - 2,
        rx: 0.6,
        fill: C.sold,
      }),
    );
}

function dimension(g, x1, y1, x2, y2, label, size, vertical) {
  const style = { stroke: C.ink, "stroke-width": size * 0.07 };
  g.append(s("line", { x1, y1, x2, y2, ...style }));
  for (const [x, y] of [
    [x1, y1],
    [x2, y2],
  ])
    g.append(s("circle", { cx: x, cy: y, r: size * 0.16, fill: C.ink }));
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const t = s("text", {
    x: mx,
    y: my,
    "text-anchor": "middle",
    "dominant-baseline": "central",
    "font-size": size,
    "font-weight": 700,
    fill: C.ink,
    "paint-order": "stroke",
    stroke: "#fff",
    "stroke-width": size * 0.35,
    transform: vertical ? `rotate(-90 ${mx} ${my})` : null,
  });
  t.textContent = label;
  g.append(t);
}

// Draw the whole scene into `svg`. opts: { grid, ghost, tiles, fill, handle, labels:{length,width} }.
export function drawStadium(svg, state, opts = {}) {
  const frame = frameFor(state, opts);
  svg.replaceChildren();
  const unit = frame.w / 40;
  const defs = s("defs");
  defs.append(
    s(
      "pattern",
      { id: "rl-seat-dots", width: 1.6, height: 1.6, patternUnits: "userSpaceOnUse" },
      s("circle", { cx: 0.8, cy: 0.8, r: 0.38, fill: C.stand, opacity: 0.55 }),
    ),
  );
  svg.append(defs);
  svg.append(
    s("rect", {
      x: frame.x - 200,
      y: frame.y - 200,
      width: frame.w + 400,
      height: frame.h + 400,
      fill: "#e9f1f6",
    }),
  );
  const world = s("g", { "data-layer": "world" });
  svg.append(world);
  const blocks = sectionBlocks(state, opts.arrangement);
  const per = state.seatsPerSection;
  const dots = capacityOf(state) <= MAX_DOTS;
  blocks.forEach((block, i) => {
    const soldHere = Math.max(0, Math.min(per, state.sold - i * per));
    (dots ? seatBlock : seatBar)(world, block, per, opts.fill ? soldHere : 0, opts.arrangement === "groups" ? String(i + 1) : null);
  });
  if (opts.arrangement !== "groups") pitch(world, state, opts);
  if (opts.ghost) {
    world.append(
      s("rect", {
        x: -opts.ghost.length / 2,
        y: -opts.ghost.width / 2,
        width: opts.ghost.length,
        height: opts.ghost.width,
        fill: "none",
        stroke: C.ghost,
        "stroke-width": unit * 0.18,
        "stroke-dasharray": `${unit * 0.6} ${unit * 0.4}`,
      }),
    );
  }
  if (opts.labels) {
    dimension(
      world,
      -state.length / 2,
      -state.width / 2 - unit * 0.9,
      state.length / 2,
      -state.width / 2 - unit * 0.9,
      opts.labels.length,
      unit * 0.9,
      false,
    );
    dimension(
      world,
      state.length / 2 + unit * 0.9,
      -state.width / 2,
      state.length / 2 + unit * 0.9,
      state.width / 2,
      opts.labels.width,
      unit * 0.9,
      true,
    );
  }
  if (opts.handle)
    world.append(
      s("circle", {
        cx: state.length / 2,
        cy: state.width / 2,
        r: unit * 0.55,
        fill: C.teal,
        stroke: "#fff",
        "stroke-width": unit * 0.15,
        "data-handle": "corner",
        style: "cursor:nwse-resize;touch-action:none",
      }),
    );
  // Scale bar: 10 m.
  const bx = frame.x + unit * 1.2;
  const by = frame.y + frame.h - unit * 1.6;
  if (opts.arrangement !== "groups") {
    world.append(s("rect", { x: bx, y: by, width: 10, height: unit * 0.35, fill: C.ink }));
    const label = s("text", {
      x: bx + 5,
      y: by - unit * 0.35,
      "text-anchor": "middle",
      "font-size": unit * 0.75,
      fill: C.ink,
      "font-weight": 600,
    });
    label.textContent = opts.scaleLabel || "10 m";
    world.append(label);
  }
  svg.setAttribute("viewBox", `${frame.x} ${frame.y} ${frame.w} ${frame.h}`);
  return frame;
}

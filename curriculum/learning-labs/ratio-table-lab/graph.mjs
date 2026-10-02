// Coordinate-plane rendering for the ratio table lab.
// One SVG builder serves the static graphs (Learn, Compare, Practice) and the
// interactive plotting board (Graph station, Practice "plot" items).

const W = 420;
const H = 360;
const L = 66;
const R = 20;
const T = 18;
const B = 60;

export function scaleFor({ xMax, yMax }) {
  const plotW = W - L - R;
  const plotH = H - T - B;
  return {
    px: (x) => L + (x * plotW) / xMax,
    py: (y) => T + plotH - (y * plotH) / yMax,
  };
}

function clipLine(rate, xMax, yMax) {
  const endX = rate * xMax > yMax ? yMax / rate : xMax;
  return [endX, rate * endX];
}

/**
 * @param {object} o
 * @param {string} o.id           svg id (needed for interactive boards)
 * @param {number} o.xMax         last x tick
 * @param {number} o.xStep        x tick spacing (default 1)
 * @param {number} o.yMax         last y tick
 * @param {number} o.yStep        y tick spacing
 * @param {Array}  o.points       [{x, y, cls, label}]
 * @param {Array}  o.lines        [{rate} | {from:[x,y], to:[x,y]}, cls]
 * @param {object} o.cursor       {x, y} keyboard cursor, interactive only
 * @param {object} o.guide        {x, y} dashed reading guide from both axes
 * @param {boolean} o.interactive adds a clickable lattice + keyboard focus
 */
export function coordGraph({
  id = "",
  xMax = 6,
  yMax = 36,
  yStep = 6,
  xStep = 1,
  xLabel = "Bags (x)",
  yLabel = "Soccer balls (y)",
  points = [],
  lines = [],
  cursor = null,
  guide = null,
  interactive = false,
  label = "Coordinate plane",
  cls = "",
}) {
  const { px, py } = scaleFor({ xMax, yMax });
  const parts = [];
  for (let x = 0; x <= xMax; x += xStep) {
    parts.push(
      `<path class="grid" d="M${px(x)} ${py(yMax)}V${py(0)}"/><text x="${px(x)}" y="${py(0) + 24}" text-anchor="middle">${x}</text>`,
    );
  }
  for (let y = 0; y <= yMax; y += yStep) {
    parts.push(
      `<path class="grid" d="M${px(0)} ${py(y)}H${px(xMax)}"/><text x="${px(0) - 10}" y="${py(y) + 6}" text-anchor="end">${y}</text>`,
    );
  }
  parts.push(
    `<path class="axis" d="M${px(0)} ${py(yMax) - 8}V${py(0)}H${px(xMax) + 10}"/>`,
    `<text class="axis-label" x="${(px(0) + px(xMax)) / 2}" y="${H - 8}" text-anchor="middle">${xLabel}</text>`,
    `<text class="axis-label" transform="translate(16 ${(py(0) + py(yMax)) / 2}) rotate(-90)" text-anchor="middle">${yLabel}</text>`,
  );

  for (const line of lines) {
    const [x1, y1] = line.from ?? [0, 0];
    const [x2, y2] = line.to ?? clipLine(line.rate, xMax, yMax);
    parts.push(
      `<path class="ratio-line ${line.cls ?? ""}" d="M${px(x1)} ${py(y1)}L${px(x2)} ${py(y2)}"/>`,
    );
  }

  if (guide) {
    parts.push(
      `<path class="guide" d="M${px(guide.x)} ${py(0)}V${py(guide.y)}H${px(0)}"/>`,
    );
  }

  if (interactive) {
    for (let x = 0; x <= xMax; x += xStep) {
      for (let y = 0; y <= yMax; y += yStep) {
        parts.push(
          `<circle class="hit" cx="${px(x)}" cy="${py(y)}" r="13" data-action="plot" data-x="${x}" data-y="${y}"/>`,
        );
      }
    }
  }

  for (const p of points) {
    parts.push(
      `<circle class="pt ${p.cls ?? ""}" cx="${px(p.x)}" cy="${py(p.y)}" r="${p.cls === "origin" ? 6 : 8}"/>`,
    );
    if (p.label) {
      const anchor = p.x > xMax * 0.7 ? "end" : "start";
      const dx = anchor === "end" ? -12 : 12;
      parts.push(
        `<text class="pt-label" x="${px(p.x) + dx}" y="${py(p.y) - 10}" text-anchor="${anchor}">${p.label}</text>`,
      );
    }
  }

  if (interactive && cursor) {
    parts.push(
      `<circle class="cursor" cx="${px(cursor.x)}" cy="${py(cursor.y)}" r="12"/>`,
    );
  }

  const focus = interactive
    ? ` id="${id}" tabindex="0" role="application" aria-roledescription="plotting grid" aria-describedby="${id}-help"`
    : ` role="img"${id ? ` id="${id}"` : ""}`;
  return `<svg class="graph ${interactive ? "plot-board" : ""} ${cls}" viewBox="0 0 ${W} ${H}"${focus} aria-label="${label}">${parts.join("")}</svg>`;
}

/** Arrow-key movement across the lattice. Returns the new cursor or null. */
export function moveCursor(cursor, key, { xMax, yMax, yStep, xStep = 1 }) {
  const next = { ...cursor };
  if (key === "ArrowRight") next.x = Math.min(xMax, next.x + xStep);
  else if (key === "ArrowLeft") next.x = Math.max(0, next.x - xStep);
  else if (key === "ArrowUp") next.y = Math.min(yMax, next.y + yStep);
  else if (key === "ArrowDown") next.y = Math.max(0, next.y - yStep);
  else if (key === "Home") Object.assign(next, { x: 0, y: 0 });
  else return null;
  return next;
}

export const PLOT_HELP =
  "Click a grid point, or focus the grid and use the arrow keys to move the ring. Press Enter or Space to plot.";

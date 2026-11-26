/**
 * Floor-plan designer for the area missions (Dream Room Designer, Room Makeover Budget). Pure; no DOM.
 *
 * The room is the mission's own composite figure: a length-a by width-b rectangle with a right-triangle
 * nook against its right wall (legs c along the floor line and d up the wall), so the two regions never
 * overlap and share one wall segment. The design numbers stay the single source of truth; this module
 * only adds a furniture layout (stored under `workbench.layout`) and judges it against the mission's
 * stated constraint, "avoid overlap and keep a clear path":
 *   - every item lies inside the walls,
 *   - no two items overlap,
 *   - a 1 m wide walker can reach every item from the door.
 * None of these checks prints the floor's area, so the Test stage still owns those answers.
 */

export const GRID = 0.5;
export const MAX_ITEMS = 16;
const EPS = 1e-9;
/** The door is a 1 m gap in the bottom wall, 0.5 m from the left corner (the rectangle is at least 2 m long). */
export const DOOR = { x0: 0.5, x1: 1.5 };

export const CATALOG = {
  shelf: { w: 2, h: 0.5, en: "Bookshelf", es: "Librero" },
  chair: { w: 1, h: 1, en: "Armchair", es: "Sillón" },
  sofa: { w: 2, h: 1, en: "Sofa", es: "Sofá" },
  table: { w: 1.5, h: 1, en: "Table", es: "Mesa" },
  bench: { w: 2, h: 0.5, en: "Work bench", es: "Banco de trabajo" },
  storage: { w: null, h: null, en: "Storage box (your design)", es: "Caja de almacenaje (tu diseño)" },
};
export const TYPES = Object.keys(CATALOG);

const snap = (n) => Math.round(n / GRID) * GRID;
const finite = (n) => typeof n === "number" && Number.isFinite(n);

/** The room numbers the designer needs, from the Studio's model values (null when the design is invalid). */
export function roomOf(values) {
  if (!values) return null;
  const { a, b, c, d, f, g } = values;
  if (![a, b, c, d, f, g].every((n) => finite(n) && n > 0)) return null;
  return { a, b, c, d, f, g };
}

/** Width and height an item occupies, honoring rotation. The storage box uses the design's own f × g. */
export function sizeOf(item, room) {
  const spec = CATALOG[item.type];
  const w = item.type === "storage" ? room.f : spec.w;
  const h = item.type === "storage" ? room.g : spec.h;
  return item.rot ? { w: h, h: w } : { w, h };
}

export const footprint = (item, room) => {
  const { w, h } = sizeOf(item, room);
  return { x0: item.x, y0: item.y, x1: item.x + w, y1: item.y + h };
};

/** Is an axis-aligned box entirely on the floor (rectangle ∪ nook)? Exact for any real dimensions. */
export function boxOnFloor(box, room) {
  const { a, b, c, d } = room;
  if (box.x0 < -EPS || box.y0 < -EPS) return false;
  if (box.x0 < a - EPS && box.y1 > b + EPS) return false; // left part must stay under the top wall
  if (box.x1 <= a + EPS) return true;
  // The part right of the shared wall must sit inside the nook: x ≥ a, y ≥ 0, (x − a)/c + y/d ≤ 1.
  // The nook is closed downward and leftward, so testing the top-right corner is sufficient.
  return (box.x1 - a) / c + box.y1 / d <= 1 + EPS;
}

const overlaps = (p, q) => p.x0 < q.x1 - EPS && q.x0 < p.x1 - EPS && p.y0 < q.y1 - EPS && q.y0 < p.y1 - EPS;

/** Validate a stored layout. Malformed entries are dropped; nothing here throws. */
export function cleanLayout(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  const seen = new Set();
  for (const item of raw.slice(0, MAX_ITEMS)) {
    if (!item || !TYPES.includes(item.type) || typeof item.id !== "string" || !/^i\d{1,3}$/.test(item.id)) continue;
    if (seen.has(item.id) || !finite(item.x) || !finite(item.y)) continue;
    const x = snap(item.x), y = snap(item.y);
    if (Math.abs(x) > 40 || Math.abs(y) > 40) continue;
    seen.add(item.id);
    out.push({ id: item.id, type: item.type, x, y, rot: item.rot ? 1 : 0 });
  }
  return out;
}

/** Bounding box of the room in meters. */
const bounds = (room) => ({ w: room.a + room.c, h: Math.max(room.b, room.d) });

/**
 * Grid of 0.5 m cells. A cell is walkable when it lies wholly on the floor and no item covers any of it.
 * The walker is 1 m wide (2 × 2 cells) and starts in the doorway.
 */
function walkGrid(layout, room) {
  const { w, h } = bounds(room);
  const cols = Math.ceil(w / GRID - EPS), rows = Math.ceil(h / GRID - EPS);
  const boxes = layout.map((it) => footprint(it, room));
  const free = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, cIx) => {
      const cell = { x0: cIx * GRID, y0: r * GRID, x1: (cIx + 1) * GRID, y1: (r + 1) * GRID };
      return boxOnFloor(cell, room) && !boxes.some((bx) => overlaps(bx, cell));
    }),
  );
  const fits = (r, cIx) => r >= 0 && cIx >= 0 && r + 1 < rows && cIx + 1 < cols && free[r][cIx] && free[r][cIx + 1] && free[r + 1][cIx] && free[r + 1][cIx + 1];
  const startCol = Math.round(DOOR.x0 / GRID);
  const seen = Array.from({ length: rows }, () => Array(cols).fill(false));
  const reach = Array.from({ length: rows }, () => Array(cols).fill(false));
  const queue = [];
  if (fits(0, startCol)) {
    seen[0][startCol] = true;
    queue.push([0, startCol]);
  }
  while (queue.length) {
    const [r, cIx] = queue.shift();
    reach[r][cIx] = reach[r][cIx + 1] = reach[r + 1][cIx] = reach[r + 1][cIx + 1] = true;
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = r + dr, nc = cIx + dc;
      if (fits(nr, nc) && !seen[nr][nc]) {
        seen[nr][nc] = true;
        queue.push([nr, nc]);
      }
    }
  }
  return { cols, rows, reach, doorOpen: fits(0, startCol) };
}

/**
 * Judge a layout. Returns per-item verdicts plus the three constraint results and the furniture
 * footprint (a sum of the items' own rectangles, which reveals nothing about the room's area).
 */
export function evaluate(layout, room) {
  const boxes = layout.map((it) => footprint(it, room));
  const grid = walkGrid(layout, room);
  const items = layout.map((it, i) => {
    const box = boxes[i];
    const inside = boxOnFloor(box, room);
    const hits = layout.filter((other, j) => j !== i && overlaps(box, boxes[j])).map((o) => o.id);
    // Reachable when a reached cell touches the item's edge (the cells just outside each side).
    let reachable = false;
    const c0 = Math.floor(box.x0 / GRID + EPS), c1 = Math.ceil(box.x1 / GRID - EPS) - 1;
    const r0 = Math.floor(box.y0 / GRID + EPS), r1 = Math.ceil(box.y1 / GRID - EPS) - 1;
    const at = (r, cIx) => r >= 0 && cIx >= 0 && r < grid.rows && cIx < grid.cols && grid.reach[r][cIx];
    for (let cIx = c0; cIx <= c1 && !reachable; cIx++) reachable = at(r0 - 1, cIx) || at(r1 + 1, cIx);
    for (let r = r0; r <= r1 && !reachable; r++) reachable = at(r, c0 - 1) || at(r, c1 + 1);
    return { id: it.id, inside, overlaps: hits, reachable: inside && reachable };
  });
  const area = layout.reduce((sum, it) => {
    const { w, h } = sizeOf(it, room);
    return sum + w * h;
  }, 0);
  return {
    items,
    inside: items.every((v) => v.inside),
    noOverlap: items.every((v) => !v.overlaps.length),
    path: grid.doorOpen && items.every((v) => v.reachable),
    doorOpen: grid.doorOpen,
    footprint: area,
    reach: grid.reach,
    count: layout.length,
  };
}

const nextId = (layout) => `i${layout.reduce((top, it) => Math.max(top, Number(it.id.slice(1))), 0) + 1}`;

/** Add an item at the first free spot (scanning from the back wall), or report why it cannot fit. */
export function addItem(layout, type, room) {
  if (!TYPES.includes(type)) return { error: "unknown" };
  if (layout.length >= MAX_ITEMS) return { error: "full" };
  const id = nextId(layout);
  const { w, h } = bounds(room);
  let fallback = null;
  for (const rot of [0, 1]) {
    const probe = { id, type, x: 0, y: 0, rot };
    const size = sizeOf(probe, room);
    for (let y = snap(h - size.h); y >= 0; y -= GRID)
      for (let x = 0; x <= w - size.w + EPS; x += GRID) {
        const item = { ...probe, x, y: snap(y) };
        const box = footprint(item, room);
        const blocked = !boxOnFloor(box, room) || layout.some((o) => overlaps(box, footprint(o, room)));
        if (blocked || overlapsDoorway(box)) continue;
        const next = [...layout, item];
        // Prefer a spot that keeps every item reachable; otherwise use the first spot that fits.
        if (evaluate(next, room).path) return { layout: next, item };
        fallback ||= { layout: next, item };
      }
  }
  return fallback || { error: "no-room" };
}
/** Items may not be auto-placed in the 1 m square just inside the door. Students may still drag them there. */
const overlapsDoorway = (box) => overlaps(box, { x0: DOOR.x0, y0: 0, x1: DOOR.x1, y1: 1 });

export const moveItem = (layout, id, x, y) => layout.map((it) => (it.id === id ? { ...it, x: snap(x), y: snap(y) } : it));
export const nudgeItem = (layout, id, dx, dy) => layout.map((it) => (it.id === id ? { ...it, x: snap(it.x + dx), y: snap(it.y + dy) } : it));
export const rotateItem = (layout, id) => layout.map((it) => (it.id === id ? { ...it, rot: it.rot ? 0 : 1 } : it));
export const removeItem = (layout, id) => layout.filter((it) => it.id !== id);

export const nameOf = (item, lang = "en") => CATALOG[item.type][lang === "es" ? "es" : "en"];

/** Plain-text lines for the downloadable defense report. */
export function layoutReport(layout, room, fmt = String) {
  if (!room || !layout.length) return [];
  const verdict = evaluate(layout, room);
  const yes = (v) => (v ? "yes" : "NO");
  return [
    "FLOOR PLAN LAYOUT",
    ...layout.map((it) => {
      const { w, h } = sizeOf(it, room);
      const v = verdict.items.find((x) => x.id === it.id);
      const notes = [!v.inside && "outside the walls", v.overlaps.length && "overlaps another item", v.inside && !v.reachable && "no clear path"].filter(Boolean);
      return `- ${nameOf(it)} ${fmt(w)} m × ${fmt(h)} m, ${fmt(it.x)} m from the left wall and ${fmt(it.y)} m from the door wall${notes.length ? ` (${notes.join("; ")})` : ""}`;
    }),
    `Furniture footprint: ${fmt(verdict.footprint)} m²`,
    `Every item inside the walls: ${yes(verdict.inside)} · No overlaps: ${yes(verdict.noOverlap)} · 1 m clear path from the door to every item: ${yes(verdict.path)}`,
    "",
  ];
}

// NetFold Engineer — 3D geometry for folding nets. Pure functions, no DOM.
//
// A net is a set of flat polygon faces in the z = 0 plane, joined into a tree
// by hinges (shared edges). Folding turns every child face about its hinge by
// an angle, on top of its parent's own fold, so the solid is built from the
// net's real topology, never from a label: an invalid net folds into faces
// that collide or leave a gap, because that is what its hinges do.

/** 4×4 matrices, row-major, acting on column vectors [x, y, z, 1]. */
export const I = () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

export function mul(a, b) {
  const o = new Array(16).fill(0);
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++)
      for (let k = 0; k < 4; k++) o[r * 4 + c] += a[r * 4 + k] * b[k * 4 + c];
  return o;
}

export function apply(m, p) {
  return [
    m[0] * p[0] + m[1] * p[1] + m[2] * p[2] + m[3],
    m[4] * p[0] + m[5] * p[1] + m[6] * p[2] + m[7],
    m[8] * p[0] + m[9] * p[1] + m[10] * p[2] + m[11],
  ];
}

const translate = (x, y, z) => [1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z, 0, 0, 0, 1];

/** Rotation by `angle` about the axis through p in unit direction u (Rodrigues). */
export function rotateAbout(p, u, angle) {
  const [x, y, z] = u;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const t = 1 - c;
  const r = [
    t * x * x + c,
    t * x * y - s * z,
    t * x * z + s * y,
    0,
    t * x * y + s * z,
    t * y * y + c,
    t * y * z - s * x,
    0,
    t * x * z - s * y,
    t * y * z + s * x,
    t * z * z + c,
    0,
    0,
    0,
    0,
    1,
  ];
  return mul(translate(p[0], p[1], p[2]), mul(r, translate(-p[0], -p[1], -p[2])));
}

export const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const norm = (a) => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

/**
 * Fold a net. `faces`: [{ id, pts: [[x, y], ...], parent, hinge: [i, j], angle }]
 * where hinge names two vertex indices of THIS face that lie on the parent's
 * edge and `angle` is the full fold for that hinge. `k` (0..1) scales every
 * angle, so k = 0 is the flat net and k = 1 the folded solid.
 * Returns the faces with 3D points, in the same order.
 */
export function fold(faces, k) {
  const byId = new Map(faces.map((f) => [f.id, f]));
  const memo = new Map();
  const matrixOf = (f) => {
    if (memo.has(f.id)) return memo.get(f.id);
    let m = I();
    if (f.parent !== null && f.parent !== undefined) {
      const parent = byId.get(f.parent);
      const a = [...f.pts[f.hinge[0]], 0];
      const b = [...f.pts[f.hinge[1]], 0];
      const u = norm(sub3(b, a));
      m = mul(matrixOf(parent), rotateAbout(a, u, f.angle * k));
    }
    memo.set(f.id, m);
    return m;
  };
  return faces.map((f) => ({ ...f, p3: f.pts.map((p) => apply(matrixOf(f), [p[0], p[1], 0])) }));
}

const centroid = (pts) =>
  pts.reduce(
    (s, p) => [s[0] + p[0] / pts.length, s[1] + p[1] / pts.length, s[2] + p[2] / pts.length],
    [0, 0, 0],
  );
const key = (v) => v.map((x) => Math.round(x * 100) / 100).join(",");

/**
 * Does a folded net close into a solid? Every face must end in a different
 * place (no two faces stacked) and the faces' edges must pair up exactly
 * (every edge shared by two faces: no gap).
 */
export function closes(folded) {
  const centres = new Set(folded.map((f) => key(centroid(f.p3))));
  if (centres.size !== folded.length) return { ok: false, why: "overlap" };
  const edges = new Map();
  for (const f of folded)
    for (let i = 0; i < f.p3.length; i++) {
      const a = key(f.p3[i]);
      const b = key(f.p3[(i + 1) % f.p3.length]);
      const e = a < b ? `${a}|${b}` : `${b}|${a}`;
      edges.set(e, (edges.get(e) || 0) + 1);
    }
  for (const n of edges.values()) if (n !== 2) return { ok: false, why: "gap" };
  return { ok: true };
}

/**
 * Build a net of unit squares from grid cells [[c, r], ...]: the first cell is
 * the root; every other cell hinges to an earlier neighbour. Squares fold up
 * by 90°. Coordinates are in units of `size`.
 */
export function squareNet(cells, size = 1) {
  const index = new Map(cells.map(([c, r], i) => [`${c},${r}`, i]));
  const faces = cells.map(([c, r], i) => {
    const x = c * size;
    const y = r * size;
    return {
      id: i,
      pts: [
        [x, y],
        [x + size, y],
        [x + size, y + size],
        [x, y + size],
      ],
      parent: null,
      hinge: null,
      angle: 0,
    };
  });
  // The hinge tree is breadth-first from the first cell, whatever order the cells are listed in.
  const seen = new Set([0]);
  const queue = [0];
  const SIDES = [
    [-1, 0, [3, 0]], // the neighbour on my left: I hinge on my left edge
    [1, 0, [1, 2]],
    [0, -1, [0, 1]],
    [0, 1, [2, 3]],
  ];
  while (queue.length) {
    const i = queue.shift();
    const [c, r] = cells[i];
    for (const [dc, dr] of SIDES) {
      const j = index.get(`${c + dc},${r + dr}`);
      if (j === undefined || seen.has(j)) continue;
      seen.add(j);
      queue.push(j);
      // Cell j hinges on the edge it shares with i: the side of j that faces i.
      const back = SIDES.find(([bc, br]) => bc === -dc && br === -dr);
      faces[j].parent = i;
      faces[j].hinge = back[2];
      faces[j].angle = -Math.PI / 2;
    }
  }
  return faces;
}

/** Surface area and volume of a rectangular prism. */
export const prismSA = (l, w, h) => 2 * (l * w + l * h + w * h);
export const prismV = (l, w, h) => l * w * h;
/** Square pyramid: base edge b, slant height s (NOT the vertical height). */
export const pyramidSA = (b, s) => b * b + 4 * ((b * s) / 2);

/** Project a 3D point for the screen: yaw then pitch, simple perspective. */
export function project(p, view) {
  const [x0, y0, z0] = sub3(p, view.center);
  const cy = Math.cos(view.yaw);
  const sy = Math.sin(view.yaw);
  const x1 = x0 * cy - y0 * sy;
  const y1 = x0 * sy + y0 * cy;
  const cp = Math.cos(view.pitch);
  const sp = Math.sin(view.pitch);
  // Pitched so the viewer looks DOWN on the solid: the top face shows.
  const y2 = y1 * cp + z0 * sp;
  const z2 = -y1 * sp + z0 * cp;
  const f = view.dist / (view.dist - y2);
  return { x: view.ox + x1 * view.scale * f, y: view.oy - z2 * view.scale * f, depth: y2 };
}

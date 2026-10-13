/* Math Workbench — pure math helpers shared by the new board tools.
 * No DOM, no globals except the UMD export, so tools/wb-*.test.mjs can load
 * this file directly. Nothing here states an answer to a student's problem:
 * these are parsing, formatting and model-geometry helpers only. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.WBMath = api;
})(typeof window !== "undefined" ? window : globalThis, () => {
  "use strict";

  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

  function gcd(a, b) {
    a = Math.abs(Math.round(a));
    b = Math.abs(Math.round(b));
    while (b) [a, b] = [b, a % b];
    return a;
  }
  const lcm = (a, b) => (a && b ? Math.abs(Math.round(a) * Math.round(b)) / gcd(a, b) : 0);

  /** Parse "3", "1.5", "3/2", "1 1/2", "-2/3" into {n, d} (d > 0), or null. */
  function parseFraction(text) {
    const s = String(text == null ? "" : text)
      .trim()
      .replace(/[−–]/g, "-");
    if (!s) return null;
    let m = /^(-?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/.exec(s);
    if (m) {
      const whole = Number(m[2]);
      const d = Number(m[4]);
      if (!d) return null;
      const n = whole * d + Number(m[3]);
      return reduce(m[1] ? -n : n, d);
    }
    m = /^(-?\d+)\s*\/\s*(\d+)$/.exec(s);
    if (m) return Number(m[2]) ? reduce(Number(m[1]), Number(m[2])) : null;
    m = /^(-?)(\d*)\.?(\d*)$/.exec(s);
    if (m && (m[2] || m[3])) {
      const places = m[3].length;
      if (places > 6) return null;
      const d = 10 ** places;
      const n = Number(m[2] || "0") * d + Number(m[3] || "0");
      return reduce(m[1] ? -n : n, d);
    }
    return null;
  }
  function reduce(n, d) {
    const g = gcd(n, d) || 1;
    return { n: n / g, d: d / g };
  }
  const toNumber = (f) => (f ? f.n / f.d : NaN);
  function fracText(f) {
    if (!f) return "";
    return f.d === 1 ? String(f.n) : `${f.n}/${f.d}`;
  }
  /** Divide two fractions exactly (used to size model grids, never to answer). */
  const fracMul = (a, b) => reduce(a.n * b.n, a.d * b.d);
  const fracAdd = (a, b) => reduce(a.n * b.d + b.n * a.d, a.d * b.d);
  const fracSub = (a, b) => reduce(a.n * b.d - b.n * a.d, a.d * b.d);
  const fracDiv = (a, b) => (b.n ? reduce(a.n * b.d, a.d * b.n) : null);
  const fracCmp = (a, b) => a.n * b.d - b.n * a.d;

  /** Parse "2/3" or "0.5" slope text for y = mx. */
  function parseRate(text) {
    const f = parseFraction(text);
    return f ? toNumber(f) : NaN;
  }

  function isPrime(n) {
    n = Math.round(n);
    if (n < 2) return false;
    for (let f = 2; f * f <= n; f++) if (n % f === 0) return false;
    return true;
  }

  /** Quadrant (1-4) or axis label for a point. */
  function quadrant(x, y) {
    if (x === 0 && y === 0) return "origin";
    if (x === 0) return "y-axis";
    if (y === 0) return "x-axis";
    if (x > 0) return y > 0 ? "Quadrant I" : "Quadrant IV";
    return y > 0 ? "Quadrant II" : "Quadrant III";
  }

  /** Mean and mean absolute deviation of a {value: count} map or array. */
  function stats(data) {
    const vals = [];
    if (Array.isArray(data)) vals.push(...data.filter(Number.isFinite));
    else
      for (const [k, c] of Object.entries(data || {})) {
        const v = Number(k);
        if (Number.isFinite(v)) for (let i = 0; i < (Number(c) || 0); i++) vals.push(v);
      }
    if (!vals.length) return { n: 0, mean: NaN, mad: NaN, vals };
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const mad = vals.reduce((a, b) => a + Math.abs(b - mean), 0) / vals.length;
    return { n: vals.length, mean, mad, vals };
  }

  /* ---------------- Balance model (never solves) ---------------- */
  /** Equation text for a balance: pans are {x, one} block counts. */
  function balanceText(b) {
    const side = (p) => {
      const parts = [];
      if (p.x) parts.push(p.x === 1 ? "x" : `${p.x}x`);
      if (p.one || !parts.length) parts.push(String(p.one || 0));
      return parts.join(" + ");
    };
    return `${side(b.left)} = ${side(b.right)}`;
  }
  /** Apply the SAME operation to both pans, so equality is preserved. */
  function balanceOp(b, op) {
    const L = { ...b.left };
    const R = { ...b.right };
    const both = (fn) => {
      fn(L);
      fn(R);
    };
    if (op === "add1") both((p) => (p.one += 1));
    else if (op === "addx") both((p) => (p.x += 1));
    else if (op === "sub1") {
      if (L.one < 1 || R.one < 1) return null;
      both((p) => (p.one -= 1));
    } else if (op === "subx") {
      if (L.x < 1 || R.x < 1) return null;
      both((p) => (p.x -= 1));
    } else if (op === "half") {
      if (L.x % 2 || L.one % 2 || R.x % 2 || R.one % 2) return null;
      both((p) => {
        p.x /= 2;
        p.one /= 2;
      });
    } else if (op === "double") {
      if (L.x > 8 || R.x > 8 || L.one > 40 || R.one > 40) return null;
      both((p) => {
        p.x *= 2;
        p.one *= 2;
      });
    } else return null;
    return { left: L, right: R };
  }
  /** Which way the pans tip when x is TESTED at a student-chosen value. */
  function balanceTilt(b, xValue) {
    if (!Number.isFinite(xValue)) return "level";
    const l = b.left.x * xValue + b.left.one;
    const r = b.right.x * xValue + b.right.one;
    return Math.abs(l - r) < 1e-9 ? "level" : l > r ? "left" : "right";
  }

  /* ---------------- Factor tree ---------------- */
  function leafValues(node, out = []) {
    if (!node) return out;
    if (!node.kids || !node.kids.length) out.push(node.v);
    else node.kids.forEach((k) => leafValues(k, out));
    return out;
  }
  function checkSplit(node) {
    if (!node.kids || node.kids.length !== 2) return "open";
    const [a, b] = node.kids.map((k) => Number(k.v));
    if (!Number.isInteger(a) || !Number.isInteger(b) || a < 2 || b < 2) return "bad";
    return a * b === node.v ? "ok" : "bad";
  }

  /* ---------------- Unit conversion reference ---------------- */
  const CONVERSIONS = {
    length: {
      label: "Length",
      units: [
        { from: "1 foot", to: "12 inches", ratio: [1, 12], system: "customary" },
        { from: "1 yard", to: "3 feet", ratio: [1, 3], system: "customary" },
        { from: "1 mile", to: "5,280 feet", ratio: [1, 5280], system: "customary" },
        { from: "1 meter", to: "100 centimeters", ratio: [1, 100], system: "metric" },
        { from: "1 centimeter", to: "10 millimeters", ratio: [1, 10], system: "metric" },
        { from: "1 kilometer", to: "1,000 meters", ratio: [1, 1000], system: "metric" },
      ],
    },
    weight: {
      label: "Weight and mass",
      units: [
        { from: "1 pound", to: "16 ounces", ratio: [1, 16], system: "customary" },
        { from: "1 ton", to: "2,000 pounds", ratio: [1, 2000], system: "customary" },
        { from: "1 kilogram", to: "1,000 grams", ratio: [1, 1000], system: "metric" },
        { from: "1 gram", to: "1,000 milligrams", ratio: [1, 1000], system: "metric" },
      ],
    },
    capacity: {
      label: "Capacity",
      units: [
        { from: "1 cup", to: "8 fluid ounces", ratio: [1, 8], system: "customary" },
        { from: "1 pint", to: "2 cups", ratio: [1, 2], system: "customary" },
        { from: "1 quart", to: "2 pints", ratio: [1, 2], system: "customary" },
        { from: "1 gallon", to: "4 quarts", ratio: [1, 4], system: "customary" },
        { from: "1 liter", to: "1,000 milliliters", ratio: [1, 1000], system: "metric" },
      ],
    },
    time: {
      label: "Time",
      units: [
        { from: "1 minute", to: "60 seconds", ratio: [1, 60], system: "time" },
        { from: "1 hour", to: "60 minutes", ratio: [1, 60], system: "time" },
        { from: "1 day", to: "24 hours", ratio: [1, 24], system: "time" },
        { from: "1 week", to: "7 days", ratio: [1, 7], system: "time" },
      ],
    },
  };

  /* ---------------- Composite figures (rectilinear) ---------------- */
  /**
   * Parts of an L, T or U shape, in unit squares with the origin at the top-left.
   * mode "add": the rectangles that make the shape. mode "cut" (or "sub"): the
   * outer rectangle plus the rectangle(s) taken away. Only dimensions are
   * returned, never areas.
   */
  function compositeParts(shape, mode, d) {
    const W = d.w;
    const H = d.h;
    const cw = d.cw;
    const ch = d.ch;
    const out = { W, H, parts: [], outline: [] };
    if (shape === "L") {
      out.outline = [[0, 0], [W - cw, 0], [W - cw, ch], [W, ch], [W, H], [0, H]];
      if (mode === "vertical") out.parts = [{ x: 0, y: 0, w: W - cw, h: H }, { x: W - cw, y: ch, w: cw, h: H - ch }];
      else if (mode === "horizontal") out.parts = [{ x: 0, y: 0, w: W - cw, h: ch }, { x: 0, y: ch, w: W, h: H - ch }];
      else out.parts = [{ x: 0, y: 0, w: W, h: H }, { x: W - cw, y: 0, w: cw, h: ch, cut: true }];
    } else if (shape === "T") {
      const sx = (W - cw) / 2;
      out.outline = [[0, 0], [W, 0], [W, ch], [sx + cw, ch], [sx + cw, H], [sx, H], [sx, ch], [0, ch]];
      if (mode === "cut")
        out.parts = [{ x: 0, y: 0, w: W, h: H }, { x: 0, y: ch, w: sx, h: H - ch, cut: true }, { x: sx + cw, y: ch, w: sx, h: H - ch, cut: true }];
      else out.parts = [{ x: 0, y: 0, w: W, h: ch }, { x: sx, y: ch, w: cw, h: H - ch }];
    } else {
      const sx = (W - cw) / 2;
      out.outline = [[0, 0], [sx, 0], [sx, H - ch], [sx + cw, H - ch], [sx + cw, 0], [W, 0], [W, H], [0, H]];
      if (mode === "cut") out.parts = [{ x: 0, y: 0, w: W, h: H }, { x: sx, y: 0, w: cw, h: H - ch, cut: true }];
      else out.parts = [{ x: 0, y: H - ch, w: W, h: ch }, { x: 0, y: 0, w: sx, h: H - ch }, { x: sx + cw, y: 0, w: sx, h: H - ch }];
    }
    return out;
  }

  /** Unit cubes of a given edge along each side of a box. ok = edges fit evenly. */
  function prismCubes(l, w, hh, edge) {
    const n = (x) => fracDiv(x, edge);
    const parts = [l, w, hh].map(n);
    const ok = parts.every((p) => p && p.d === 1 && p.n >= 1);
    return { ok, nl: ok ? parts[0].n : 0, nw: ok ? parts[1].n : 0, nh: ok ? parts[2].n : 0 };
  }

  /* ---------------- Ink geometry (point eraser, straightedge) ---------------- */
  /**
   * Remove the part of a stroke within radius r of point p. Returns the pieces
   * that remain (new stroke objects; the original is never mutated, because
   * undo history shares stroke objects). Returns null when p touches nothing.
   */
  function splitStroke(stroke, p, r) {
    const reach = r + (stroke.size || 2);
    const hit = (q) => Math.hypot(q.x - p.x, q.y - p.y) < reach;
    if (!stroke.pts.some(hit)) return null;
    const pieces = [];
    let cur = [];
    for (const q of stroke.pts) {
      if (hit(q)) {
        if (cur.length) pieces.push(cur);
        cur = [];
      } else cur.push(q);
    }
    if (cur.length) pieces.push(cur);
    return pieces
      .filter((pts) => pts.length >= 2)
      .map((pts) => ({ ...stroke, pts: pts.map((q) => ({ ...q })) }));
  }

  /** Project (x, y) onto the infinite line through a and b; also returns the distance. */
  function projectOnLine(x, y, a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len2 = dx * dx + dy * dy || 1;
    const k = ((x - a.x) * dx + (y - a.y) * dy) / len2;
    const px = a.x + k * dx;
    const py = a.y + k * dy;
    return { x: px, y: py, dist: Math.hypot(x - px, y - py) };
  }

  /* ---------------- Nets: faces, hinges and 3-D folding ---------------- */
  const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm3 = (a) => {
    const l = Math.hypot(a[0], a[1], a[2]) || 1;
    return [a[0] / l, a[1] / l, a[2] / l];
  };
  /** Rodrigues rotation of point p about the axis through a with unit direction u. */
  function rotateAbout(p, a, u, ang) {
    const v = sub3(p, a);
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    const r = add3(add3(mul3(v, c), mul3(cross3(u, v), s)), mul3(u, dot3(u, v) * (1 - c)));
    return add3(r, a);
  }

  /**
   * Net definitions. Each face: pts (2-D, flat net), parent index (-1 = base),
   * the hinge as two 2-D points shared with the parent, and fold, how far (in
   * radians) the face turns about that hinge when fully folded. label is a
   * dimension name only, never an area.
   */
  function netFaces(shape, dims) {
    const l = dims.l || 4;
    const w = dims.w || 3;
    const h = dims.h || 2;
    const R = (x, y, ww, hh) => [
      [x, y],
      [x + ww, y],
      [x + ww, y + hh],
      [x, y + hh],
    ];
    const Q = Math.PI / 2;
    if (shape === "cube" || shape === "rectprism") {
      const L = shape === "cube" ? w : l;
      const W = w;
      const H = shape === "cube" ? w : h;
      return [
        { pts: R(0, 0, L, W), parent: -1, label: `${L} × ${W}` },
        { pts: R(0, -H, L, H), parent: 0, hinge: [[0, 0], [L, 0]], fold: Q, label: `${L} × ${H}` },
        { pts: R(L, 0, H, W), parent: 0, hinge: [[L, 0], [L, W]], fold: Q, label: `${H} × ${W}` },
        { pts: R(0, W, L, H), parent: 0, hinge: [[0, W], [L, W]], fold: Q, label: `${L} × ${H}` },
        { pts: R(-H, 0, H, W), parent: 0, hinge: [[0, 0], [0, W]], fold: Q, label: `${H} × ${W}` },
        { pts: R(0, W + H, L, W), parent: 3, hinge: [[0, W + H], [L, W + H]], fold: Q, label: `${L} × ${W}` },
      ];
    }
    if (shape === "sqpyramid") {
      const b = w;
      const slant = Math.hypot(h, b / 2);
      const fold = Math.PI - Math.atan2(h, b / 2);
      return [
        { pts: R(0, 0, b, b), parent: -1, label: `${b} × ${b}` },
        { pts: [[0, 0], [b, 0], [b / 2, -slant]], parent: 0, hinge: [[0, 0], [b, 0]], fold, label: `base ${b}` },
        { pts: [[b, 0], [b, b], [b + slant, b / 2]], parent: 0, hinge: [[b, 0], [b, b]], fold, label: `base ${b}` },
        { pts: [[b, b], [0, b], [b / 2, b + slant]], parent: 0, hinge: [[0, b], [b, b]], fold, label: `base ${b}` },
        { pts: [[0, b], [0, 0], [-slant, b / 2]], parent: 0, hinge: [[0, 0], [0, b]], fold, label: `base ${b}` },
      ];
    }
    // triangular prism: right-triangle base with legs w and h, length l
    const hyp = Math.hypot(w, h);
    const nx = h / hyp;
    const ny = w / hyp;
    return [
      { pts: [[0, 0], [w, 0], [0, h]], parent: -1, label: `${w}, ${h}` },
      { pts: R(0, -l, w, l), parent: 0, hinge: [[0, 0], [w, 0]], fold: Q, label: `${w} × ${l}` },
      { pts: R(-l, 0, l, h), parent: 0, hinge: [[0, 0], [0, h]], fold: Q, label: `${h} × ${l}` },
      {
        pts: [[w, 0], [0, h], [l * nx, h + l * ny], [w + l * nx, l * ny]],
        parent: 0,
        hinge: [[w, 0], [0, h]],
        fold: Q,
        label: `${Math.round(hyp * 10) / 10} × ${l}`,
      },
      { pts: [[0, -l], [w, -l], [0, -l - h]], parent: 1, hinge: [[0, -l], [w, -l]], fold: Q, label: `${w}, ${h}` },
    ];
  }

  /** Direction (+1/-1) that lifts a face toward +z when it turns about its hinge. */
  function foldSign(face) {
    const [p, q] = face.hinge;
    const a = [p[0], p[1], 0];
    const u = norm3([q[0] - p[0], q[1] - p[1], 0]);
    const cx = face.pts.reduce((s, k) => s + k[0], 0) / face.pts.length;
    const cy = face.pts.reduce((s, k) => s + k[1], 0) / face.pts.length;
    return rotateAbout([cx, cy, 0], a, u, 0.3)[2] > 0 ? 1 : -1;
  }

  /**
   * Fold a net at amount t (0 flat, 1 folded). A face's final vertices are its
   * flat points turned about its own hinge, then about each ancestor's hinge in
   * turn (all hinges measured in the flat net), so the base stays at z = 0.
   */
  function foldNet(faces, t) {
    return faces.map((face, i) => {
      let pts = face.pts.map(([x, y]) => [x, y, 0]);
      for (let k = i; k > 0; k = faces[k].parent) {
        const f = faces[k];
        const a = [f.hinge[0][0], f.hinge[0][1], 0];
        const u = norm3([f.hinge[1][0] - f.hinge[0][0], f.hinge[1][1] - f.hinge[0][1], 0]);
        const ang = foldSign(f) * f.fold * t;
        pts = pts.map((p) => rotateAbout(p, a, u, ang));
      }
      return pts;
    });
  }

  /** Orthographic view: tilt 0 is flat top-down, 1 is a three-quarter view. */
  function viewPoint(p, tilt) {
    const yaw = (-35 * Math.PI / 180) * tilt;
    const pitch = (-50 * Math.PI / 180) * tilt;
    const x1 = p[0] * Math.cos(yaw) + p[2] * Math.sin(yaw);
    const z1 = -p[0] * Math.sin(yaw) + p[2] * Math.cos(yaw);
    const y2 = p[1] * Math.cos(pitch) - z1 * Math.sin(pitch);
    const z2 = p[1] * Math.sin(pitch) + z1 * Math.cos(pitch);
    return [x1, y2, z2];
  }

  return {
    clamp,
    gcd,
    lcm,
    parseFraction,
    parseRate,
    toNumber,
    fracText,
    fracMul,
    fracAdd,
    fracSub,
    fracDiv,
    fracCmp,
    isPrime,
    quadrant,
    stats,
    balanceText,
    balanceOp,
    balanceTilt,
    leafValues,
    checkSplit,
    CONVERSIONS,
    netFaces,
    foldNet,
    viewPoint,
    compositeParts,
    prismCubes,
    splitStroke,
    projectOnLine,
  };
});

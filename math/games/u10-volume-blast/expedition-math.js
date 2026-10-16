/* Orbital Builders — pure mathematics for the Volume Blast expedition (no Phaser).
 *
 * Problem generators, exact fraction arithmetic, answer judges, misconception
 * classifiers and the net-folding model live here so they can be stress-tested in
 * Node. The builders (expedition-missions.js, expedition-build.js,
 * expedition-hull.js) only draw and animate what these functions decide.
 *
 *   loader   count the unit cubes that fill a cargo bay        V = l × w × h
 *   module   choose module dimensions that hold a manifest     V = l × w × h, V = B × h
 *   packer   fractional edges packed with ½- or ⅓-unit cubes   V = l × w × h, V = B × h
 *   net      place missing hull plates so the net folds shut   nets of prisms
 *   hull     order hull plating = surface area                 prisms and square pyramids
 */
(function (root) {
  "use strict";
  const L = (en, es) => ({ en, es });

  /* ── Exact fractions ──────────────────────────────────────────────────── */
  const gcd = (a, b) => {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y) [x, y] = [y, x % y];
    return x || 1;
  };
  function fr(n, d = 1) {
    if (d < 0) return fr(-n, -d);
    const g = gcd(n, d);
    return { n: n / g, d: d / g };
  }
  const fmul = (a, b) => fr(a.n * b.n, a.d * b.d);
  const fadd = (a, b) => fr(a.n * b.d + b.n * a.d, a.d * b.d);
  const feq = (a, b) => a.n * b.d === b.n * a.d;
  const fval = (a) => a.n / a.d;
  const fwhole = (a) => Math.floor(a.n / a.d);
  const fpart = (a) => fr(a.n - fwhole(a) * a.d, a.d);
  const prod = (list) => list.reduce((p, x) => fmul(p, x), fr(1));
  const GLYPH = {
    "1/2": "½",
    "1/3": "⅓",
    "2/3": "⅔",
    "1/4": "¼",
    "3/4": "¾",
    "1/8": "⅛",
    "3/8": "⅜",
    "5/8": "⅝",
    "7/8": "⅞",
    "1/6": "⅙",
    "5/6": "⅚",
    "1/9": "⅑",
  };
  /** 5/2 → "2½", 22/9 → "2 4/9", 3 → "3". */
  function ffmt(a) {
    const f = fr(a.n, a.d);
    const w = fwhole(f);
    const r = f.n - w * f.d;
    if (!r) return String(w);
    const g = GLYPH[r + "/" + f.d];
    if (!w) return g || r + "/" + f.d;
    return g ? w + g : w + " " + r + "/" + f.d;
  }
  /** Parse the three entry fields (whole, numerator, denominator). null = not finished. */
  function parseEntry(e) {
    const w = e.w === "" ? null : Number(e.w);
    const n = e.n === "" ? null : Number(e.n);
    const d = e.d === "" ? null : Number(e.d);
    if (w == null && n == null && d == null) return null;
    if ((n == null) !== (d == null)) return null;
    if (d === 0) return null;
    if (n == null) return fr(w);
    return fadd(fr(w || 0), fr(n, d));
  }
  /** The entry fields that type a given fraction (used by demos and tests). */
  function toEntry(a) {
    const w = fwhole(a);
    const p = fpart(a);
    return {
      w: w ? String(w) : p.n ? "" : "0",
      n: p.n ? String(p.n) : "",
      d: p.n ? String(p.d) : "",
    };
  }

  /* ── loader: count the cubes that fill a bay ─────────────────────────── */
  function loaderTraps(p) {
    const { l, w, h } = p;
    return [
      ["addDims", l + w + h],
      ["oneLayer", l * w],
      ["visibleOnly", p.shown],
      ["areaNotVolume", 2 * (l * w + l * h + w * h)],
      ["areaNotVolume", l * w + l * h + w * h],
    ];
  }
  function genLoader(rng, tier) {
    for (;;) {
      const l = tier >= 2 ? rng.int(3, 6) : rng.int(2, 4);
      const w = tier >= 2 ? rng.int(2, 5) : rng.int(2, 4);
      const h = tier >= 2 ? rng.int(2, 5) : rng.int(2, 3);
      // shown = the guide crates drawn: the floor layer (tier 1) or one floor row (tier 2)
      // plus a corner stack — counting only these is the "visible cubes" error.
      const p = { l, w, h, V: l * w * h, shown: (tier >= 2 ? l : l * w) + h - 1 };
      if (!loaderTraps(p).some(([, v]) => v === p.V)) return p;
    }
  }
  function classifyLoader(p, n) {
    if (n === p.V) return null;
    const hit = loaderTraps(p).find(([, v]) => v === n);
    return hit ? hit[0] : "miscount";
  }

  /* ── module: choose dimensions (dims) or the number of layers (base) ─── */
  const MOD_MAX = 8;
  function genModule(rng, tier, variant) {
    if (variant === "base") {
      for (;;) {
        const l = rng.int(2, tier >= 2 ? 6 : 5);
        const w = rng.int(2, 4);
        const h = rng.int(2, tier >= 2 ? 7 : 5);
        const p = { variant, l, w, h, B: l * w, V: l * w * h };
        // Keep the classic traps away from the true height so each one is diagnosable.
        if (p.V - p.B === h || p.V - l - w === h) continue;
        return p;
      }
    }
    for (;;) {
      const a = rng.int(2, tier >= 2 ? 5 : 4);
      const b = rng.int(2, 4);
      const c = rng.int(1, tier >= 2 ? 4 : 3);
      const V = a * b * c;
      if (V < 12) continue;
      const lim = {
        maxL: Math.min(MOD_MAX - 2, a + rng.int(0, 1)),
        maxW: Math.min(MOD_MAX - 2, b + rng.int(0, 1)),
        maxH: Math.min(MOD_MAX - 2, c + rng.int(0, 1)),
      };
      return { variant: "dims", V, sol: { l: a, w: b, h: c }, ...lim };
    }
  }
  const fits = (p, b) => b.l <= p.maxL && b.w <= p.maxW && b.h <= p.maxH;
  function classifyModule(p, b) {
    const V = b.l * b.w * b.h;
    if (p.variant === "base") {
      const h = b.h;
      if (h * p.B === p.V) return null;
      if (h === p.V - p.B) return "subtractBase";
      if (h * p.l === p.V || h * p.w === p.V) return "oneEdge";
      if (p.l + p.w + h === p.V) return "addDims";
      return "miscount";
    }
    if (V === p.V && fits(p, b)) return null;
    if (V === p.V) return "noFit";
    if (b.l + b.w + b.h === p.V) return "addDims";
    if (2 * (b.l * b.w + b.l * b.h + b.w * b.h) === p.V) return "areaNotVolume";
    if (b.h > 1 && b.l * b.w === p.V) return "oneLayer";
    return "miscount";
  }

  /* ── packer: fractional edges, small cubes ───────────────────────────── */
  function packerTraps(p) {
    const e = p.edges;
    const k3 = p.k * p.k * p.k;
    const N = fmul(p.V, fr(k3));
    const wholes = e.map(fwhole);
    const parts = e.map(fpart).filter((x) => x.n);
    const list = [
      ["addDims", p.variant === "base" ? fadd(p.B, e[2]) : e.reduce(fadd, fr(0))],
      ["countSmall", N],
      ["smallCube", fmul(N, fr(1, p.k))],
      ["smallCube", fmul(N, fr(3, p.k))],
      ["splitMixed", fadd(fr(wholes.reduce((a, b) => a * b, 1)), prod(parts))],
      ["roundedEdges", fr(wholes.reduce((a, b) => a * b, 1))],
      ["roundedEdges", fr(e.map((x) => Math.ceil(fval(x))).reduce((a, b) => a * b, 1))],
    ];
    return list;
  }
  function genPacker(rng, tier, variant) {
    const k = variant === "third" ? 3 : 2;
    for (;;) {
      let edges;
      if (variant === "third") {
        const m = rng.int(1, 2);
        const t = fr(3 * m + rng.int(1, 2), 3);
        edges = rng.shuffle([t, fr(rng.int(1, 2)), fr(rng.int(2, 3))]);
      } else if (variant === "base") {
        // Base: one whole edge, one half edge; height a mixed number.
        const l = fr(rng.int(2, 4));
        const w = fr(2 * rng.int(1, 2) + 1, 2);
        const h = fr(2 * rng.int(1, 2) + 1, 2);
        edges = [l, w, h];
      } else {
        const half = fr(2 * rng.int(1, tier >= 2 ? 3 : 2) + 1, 2);
        edges = [half, fr(rng.int(1, 3)), fr(rng.int(2, 3))];
        edges = [...rng.shuffle(edges.slice(0, 2)), edges[2]];
        if (rng.int(0, 1)) edges = [edges[2], edges[1], edges[0]];
      }
      const V = prod(edges);
      const B = fmul(edges[0], edges[1]);
      const p = { variant: variant || "half", k, edges, V, B };
      p.N = fval(V) * k * k * k;
      if (p.N > 420 || p.N < 12) continue;
      if (packerTraps(p).some(([, v]) => feq(v, V))) continue;
      return p;
    }
  }
  function classifyPacker(p, v) {
    if (feq(v, p.V)) return null;
    const hit = packerTraps(p).find(([, x]) => feq(x, v));
    return hit ? hit[0] : fval(v) < fval(p.V) ? "packShort" : "packOver";
  }

  /* ── net: a box net modelled as rectangles on a unit grid ─────────────── */
  const V3 = {
    neg: (v) => v.map((x) => (x === 0 ? 0 : -x)),
    eq: (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2],
    key: (v) => v.join(","),
  };
  /** The six sides of the hull, keyed by outward normal. */
  const SIDES = {
    "0,0,-1": { id: "bottom", name: L("Bottom", "Abajo"), phrase: L("bottom", "de abajo"), color: 0x7aa7ff },
    "0,0,1": { id: "top", name: L("Top", "Arriba"), phrase: L("top", "de arriba"), color: 0xffd76a },
    "1,0,0": { id: "right", name: L("Right", "Derecha"), phrase: L("right", "derecho"), color: 0x7be0a8 },
    "-1,0,0": { id: "left", name: L("Left", "Izquierda"), phrase: L("left", "izquierdo"), color: 0xff9f6b },
    "0,1,0": { id: "front", name: L("Front", "Frente"), phrase: L("front", "del frente"), color: 0xd59cff },
    "0,-1,0": { id: "back", name: L("Back", "Atrás"), phrase: L("back", "de atrás"), color: 0x6fe3e8 },
  };
  function roll(s, dir) {
    if (dir === "+x") return { n: s.ex, ex: V3.neg(s.n), ey: s.ey };
    if (dir === "-x") return { n: V3.neg(s.ex), ex: s.n, ey: s.ey };
    if (dir === "+y") return { n: s.ey, ex: s.ex, ey: V3.neg(s.n) };
    return { n: V3.neg(s.ey), ex: s.ex, ey: s.n };
  }
  const ROOT = { n: [0, 0, -1], ex: [1, 0, 0], ey: [0, 1, 0] };
  function dimOf(dims, v) {
    return [dims.a, dims.b, dims.c][v.findIndex((x) => x !== 0)];
  }
  const overlapArea = (f, g) =>
    Math.max(0, Math.min(f.x + f.w, g.x + g.w) - Math.max(f.x, g.x)) *
    Math.max(0, Math.min(f.y + f.h, g.y + g.h) - Math.max(f.y, g.y));
  /** How g touches f: '+x' | '-x' | '+y' | '-y' (full hinge), 'partial', or null. */
  function hinge(f, g) {
    const rangeY = Math.min(f.y + f.h, g.y + g.h) - Math.max(f.y, g.y);
    const rangeX = Math.min(f.x + f.w, g.x + g.w) - Math.max(f.x, g.x);
    if (g.x === f.x + f.w && rangeY > 0) return g.y === f.y && g.h === f.h ? "+x" : "partial";
    if (g.x + g.w === f.x && rangeY > 0) return g.y === f.y && g.h === f.h ? "-x" : "partial";
    if (g.y === f.y + f.h && rangeX > 0) return g.x === f.x && g.w === f.w ? "+y" : "partial";
    if (g.y + g.h === f.y && rangeX > 0) return g.x === f.x && g.w === f.w ? "-y" : "partial";
    return null;
  }
  /** Fold the net. faces[0] is the bottom (a × b). Returns which side each plate lands on. */
  function foldNet(dims, faces) {
    const n = faces.length;
    const overlap = new Set();
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++)
        if (overlapArea(faces[i], faces[j]) > 0) {
          overlap.add(i);
          overlap.add(j);
        }
    const st = faces.map(() => null);
    const badTouch = new Set();
    st[0] = ROOT;
    const queue = [0];
    while (queue.length) {
      const i = queue.shift();
      for (let j = 0; j < n; j++) {
        if (st[j] || (overlap.has(j) && j !== 0)) continue;
        const dir = hinge(faces[i], faces[j]);
        if (!dir) continue;
        if (dir === "partial") {
          badTouch.add(j);
          continue;
        }
        const s = roll(st[i], dir);
        const g = faces[j];
        const okSize = dir[1] === "x" ? g.w === dimOf(dims, s.ex) : g.h === dimOf(dims, s.ey);
        if (!okSize) {
          badTouch.add(j);
          continue;
        }
        st[j] = s;
        queue.push(j);
      }
    }
    const res = { overlap: [], size: [], detached: [], double: [], side: [], open: [] };
    const seen = {};
    faces.forEach((_, j) => {
      if (st[j]) {
        const k = V3.key(st[j].n);
        res.side[j] = k;
        (seen[k] ||= []).push(j);
      } else if (overlap.has(j)) res.overlap.push(j);
      else if (badTouch.has(j)) res.size.push(j);
      else res.detached.push(j);
    });
    Object.values(seen).forEach((list) => {
      if (list.length > 1) res.double.push(...list);
    });
    res.open = Object.keys(SIDES).filter((k) => !seen[k]);
    res.ok =
      n === 6 &&
      !res.overlap.length &&
      !res.size.length &&
      !res.detached.length &&
      !res.double.length;
    return res;
  }
  function classifyNet(res, plates) {
    if (res.ok) return null;
    const has = (list) => plates.some((i) => list.includes(i));
    if (has(res.overlap)) return "netOverlap";
    if (has(res.detached)) return "netDetached";
    if (has(res.size)) return "netSize";
    return "netDouble";
  }
  /** Random edge-unfolding of an a × b × c box; one or two leaf plates removed. */
  function genNet(rng, tier) {
    const dims =
      tier >= 2
        ? (() => {
            for (;;) {
              const d = { a: rng.int(1, 3), b: rng.int(1, 3), c: rng.int(1, 3) };
              if (!(d.a === d.b && d.b === d.c) && d.a + d.b + d.c <= 7) return d;
            }
          })()
        : { a: 1, b: 1, c: 1 };
    for (let attempt = 0; attempt < 200; attempt++) {
      // Random spanning tree of the six sides, grown from the bottom.
      const keys = Object.keys(SIDES).map((k) => k.split(",").map(Number));
      const inTree = [keys[0]];
      const parent = {};
      while (inTree.length < 6) {
        const options = [];
        inTree.forEach((a) =>
          keys.forEach((b) => {
            if (inTree.some((x) => V3.eq(x, b))) return;
            const dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
            if (dot === 0) options.push([a, b]);
          }),
        );
        const [a, b] = rng.pick(options);
        parent[V3.key(b)] = a;
        inTree.push(b);
      }
      // Lay the faces out by rolling from the bottom.
      const faces = [{ x: 0, y: 0, w: dims.a, h: dims.b, s: ROOT, key: V3.key(ROOT.n) }];
      const pending = inTree.slice(1);
      while (pending.length) {
        const idx = pending.findIndex((b) =>
          faces.some((f) => f.key === V3.key(parent[V3.key(b)])),
        );
        const b = pending.splice(idx, 1)[0];
        const P = faces.find((f) => f.key === V3.key(parent[V3.key(b)]));
        const dir = V3.eq(b, P.s.ex)
          ? "+x"
          : V3.eq(b, V3.neg(P.s.ex))
            ? "-x"
            : V3.eq(b, P.s.ey)
              ? "+y"
              : "-y";
        const s = roll(P.s, dir);
        const f = { s, key: V3.key(s.n) };
        if (dir === "+x") Object.assign(f, { x: P.x + P.w, y: P.y, w: dimOf(dims, s.ex), h: P.h });
        if (dir === "-x") {
          f.w = dimOf(dims, s.ex);
          Object.assign(f, { x: P.x - f.w, y: P.y, h: P.h });
        }
        if (dir === "+y") Object.assign(f, { x: P.x, y: P.y + P.h, w: P.w, h: dimOf(dims, s.ey) });
        if (dir === "-y") {
          f.h = dimOf(dims, s.ey);
          Object.assign(f, { x: P.x, y: P.y - f.h, w: P.w });
        }
        faces.push(f);
      }
      let clash = false;
      for (let i = 0; i < 6; i++)
        for (let j = i + 1; j < 6; j++) if (overlapArea(faces[i], faces[j]) > 0) clash = true;
      if (clash) continue;
      const minX = Math.min(...faces.map((f) => f.x));
      const minY = Math.min(...faces.map((f) => f.y));
      faces.forEach((f) => {
        f.x += 1 - minX;
        f.y += 1 - minY;
      });
      const cols = Math.max(...faces.map((f) => f.x + f.w)) + 1;
      const rows = Math.max(...faces.map((f) => f.y + f.h)) + 1;
      if (cols > 16 || rows > 11) continue;
      // Leaves (sides that are nobody's parent) can be removed without splitting the net.
      const parentKeys = new Set(Object.values(parent).map(V3.key));
      const leaves = faces.map((f, i) => i).filter((i) => i > 0 && !parentKeys.has(faces[i].key));
      const removeCount = tier >= 3 ? 2 : 1;
      if (leaves.length < removeCount) continue;
      const removed = rng.shuffle(leaves).slice(0, removeCount);
      const given = faces
        .filter((_, i) => !removed.includes(i))
        .map(({ x, y, w, h }) => ({ x, y, w, h }));
      const missing = removed.map((i) => {
        const { x, y, w, h, key } = faces[i];
        return { x, y, w, h, key };
      });
      return { dims, cols, rows, given, missing };
    }
    throw new Error("genNet: no net found");
  }

  /* ── hull: surface area of prisms and square pyramids ─────────────────── */
  const PYR = [
    [6, 4, 5],
    [8, 3, 5],
    [12, 8, 10],
    [16, 6, 10],
    [10, 12, 13],
    [18, 12, 15],
    [24, 9, 15],
    [16, 15, 17],
  ];
  function hullTraps(p) {
    if (p.variant === "pyramid") {
      const { s, ht, sl } = p;
      const list = [
        ["forgotBase", 2 * s * sl],
        ["noHalf", s * s + 4 * s * sl],
        ["usedHeight", s * s + 2 * s * ht],
        ["faceCount", s * s + s * sl],
        ["faceCount", 2 * s * s + 2 * s * sl],
        ["addDims", s + sl],
      ];
      if ((s * s * ht) % 3 === 0) list.push(["volumeNotArea", (s * s * ht) / 3]);
      return list;
    }
    const { l, w, h } = p;
    return [
      ["volumeNotArea", l * w * h],
      ["halfFaces", l * w + l * h + w * h],
      ["faceCount", 2 * (l * h + w * h)],
      ["faceCount", 2 * (l * w + l * h)],
      ["faceCount", 2 * (l * w + w * h)],
      ["faceCount", l * w + 2 * (l * h + w * h)],
      ["addDims", l + w + h],
    ];
  }
  function genHull(rng, tier, variant) {
    for (;;) {
      let p;
      if (variant === "pyramid") {
        const [s, ht, sl] = rng.pick(tier >= 3 ? PYR : PYR.slice(0, 5));
        p = { variant, s, ht, sl, SA: s * s + 2 * s * sl };
        p.faces = [
          { kind: "sq", a: s, area: s * s },
          ...[0, 1, 2, 3].map(() => ({ kind: "tri", a: s, b: sl, area: (s * sl) / 2 })),
        ];
      } else {
        const l = rng.int(tier >= 2 ? 3 : 2, tier >= 2 ? 9 : 6);
        const w = rng.int(2, tier >= 2 ? 6 : 4);
        const h = rng.int(2, tier >= 2 ? 7 : 5);
        if (l === w || w === h || l === h) continue;
        p = { variant: "prism", l, w, h, SA: 2 * (l * w + l * h + w * h) };
        p.faces = [
          { kind: "rect", a: l, b: w, area: l * w, side: "top" },
          { kind: "rect", a: l, b: h, area: l * h, side: "front" },
          { kind: "rect", a: w, b: h, area: w * h, side: "right" },
          { kind: "rect", a: l, b: h, area: l * h, side: "back" },
          { kind: "rect", a: w, b: h, area: w * h, side: "left" },
          { kind: "rect", a: l, b: w, area: l * w, side: "bottom" },
        ];
      }
      if (p.SA > 9999) continue;
      if (hullTraps(p).some(([, v]) => v === p.SA)) continue;
      return p;
    }
  }
  function classifyHull(p, n) {
    if (n === p.SA) return null;
    const hit = hullTraps(p).find(([, v]) => v === n);
    return hit ? hit[0] : n < p.SA ? "plateShort" : "plateOver";
  }

  root.VB_MATH = {
    L,
    gcd,
    fr,
    fmul,
    fadd,
    feq,
    fval,
    fwhole,
    fpart,
    ffmt,
    parseEntry,
    toEntry,
    genLoader,
    loaderTraps,
    classifyLoader,
    genModule,
    classifyModule,
    fits,
    MOD_MAX,
    genPacker,
    packerTraps,
    classifyPacker,
    SIDES,
    foldNet,
    classifyNet,
    genNet,
    hinge,
    genHull,
    hullTraps,
    classifyHull,
  };
})(typeof window !== "undefined" ? window : globalThis);

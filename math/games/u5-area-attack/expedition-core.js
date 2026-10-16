/* Terrace Architects — pure mathematics for the Area Attack expedition.
 *
 * Problem generators, answer judges and misconception classifiers for every
 * mission builder. No Phaser and no DOM here, so the same functions run in the
 * browser and in a Node check script. Shapes live in grid units with y pointing
 * UP (0 = the ground line); the builders turn them into pixels.
 *
 *   gen.<type>(rng, tier, variant)  -> problem p (numbers + polygons + labels)
 *   judge.<type>(p, input)          -> {ok} | {ok:false, tag, ...detail}
 *   answer.<type>(p)                -> the input that solves p (demo + tests)
 */
(function () {
  "use strict";
  const L = (en, es) => ({ en, es });
  const round2 = (x) => Math.round(x * 100) / 100;
  const round1 = (x) => Math.round(x * 10) / 10;
  const eq = (a, b) => a != null && b != null && Math.abs(round2(a) - round2(b)) < 1e-6;
  /** Pythagorean (run, rise, slant) triples: slanted sides with whole-number lengths. */
  const TRIPLES = [
    [3, 4, 5],
    [4, 3, 5],
    [6, 8, 10],
    [8, 6, 10],
  ];

  /* ── Geometry ──────────────────────────────────────────────────────────── */
  function polyArea(pts) {
    let s = 0;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      s += a.x * b.y - b.x * a.y;
    }
    return Math.abs(s) / 2;
  }
  /** The part of a polygon at or below the line y = level (Sutherland–Hodgman, one edge). */
  function clipBelow(pts, level) {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      const ain = a.y <= level;
      const bin = b.y <= level;
      if (ain) out.push(a);
      if (ain !== bin) {
        const k = (level - a.y) / (b.y - a.y);
        out.push({ x: a.x + (b.x - a.x) * k, y: level });
      }
    }
    return out;
  }
  /** Fill line so that `fraction` of the polygon's area lies below it (paving rises from the ground). */
  function fillLevel(pts, fraction) {
    const ys = pts.map((p) => p.y);
    let lo = Math.min(...ys);
    let hi = Math.max(...ys);
    if (fraction >= 1) return hi;
    if (fraction <= 0) return lo;
    const target = polyArea(pts) * fraction;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (polyArea(clipBelow(pts, mid)) < target) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  }
  const P = (x, y) => ({ x, y });
  const rect = (x0, y0, x1, y1) => [P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1)];
  function bounds(pts) {
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    return {
      x0: Math.min(...xs),
      x1: Math.max(...xs),
      y0: Math.min(...ys),
      y1: Math.max(...ys),
    };
  }
  /** First candidate whose value matches v (order = priority). */
  function classify(v, candidates, fallback) {
    const hit = candidates.find(([value]) => eq(value, v));
    return hit ? hit[1] : fallback;
  }

  /* ── frame: shear a parallelogram / rhombus plot into a rectangle ──────── */
  const FRAME_COLS = 20;
  function genFrame(r, tier, variant) {
    const pool = tier >= 2 ? TRIPLES : TRIPLES.slice(0, 2);
    const [off, h, s] = r.pick(pool);
    let b = s;
    if (variant !== "rhombus") {
      do b = r.int(tier >= 2 ? 5 : 4, tier >= 2 ? 10 : 9);
      while (b === s || b === h || b + off > FRAME_COLS - 2);
    }
    // Lean right only when the frame (anchored past the cut) still fits the grid.
    const lean = 2 * off + b <= FRAME_COLS ? r.pick([1, -1]) : -1;
    // Leaning right: (0,0) (b,0) (b+off,h) (off,h). Mirrored when it leans left.
    const mx = (x) => (lean > 0 ? x : b + off - x);
    const pts = [P(0, 0), P(b, 0), P(b + off, h), P(off, h)].map((p) => P(mx(p.x), p.y));
    // The cut: the triangle at the leaning end, and where it slides to.
    const cut = [P(0, 0), P(off, h), P(off, 0)].map((p) => P(mx(p.x), p.y));
    const slid = cut.map((p) => P(p.x + lean * b, p.y));
    const rest = [P(mx(off), 0), pts[1], pts[2], pts[3]];
    const frameX = lean > 0 ? off : 0;
    return {
      rest,
      kind: variant === "rhombus" ? "rhombus" : "para",
      b,
      h,
      s,
      off,
      lean,
      pts,
      cut,
      slid,
      frameX,
      area: b * h,
      // Grid sized to this plot: room for a too-wide (corner-to-corner) or too-tall (slant) frame.
      cols: frameX + b + off + 2,
      rows: s + 2,
      maxW: b + off + 2,
      maxH: s + 2,
    };
  }
  function judgeFrame(p, inp) {
    const { w, h } = inp;
    if (w === p.b && h === p.h) return { ok: true };
    if (h === p.s && h !== p.h) return { ok: false, tag: "slantHeight" };
    if (w === p.b + p.off) return { ok: false, tag: "fullWidth" };
    if (w === p.h && h === p.b) return { ok: false, tag: "swapped" };
    return {
      ok: false,
      tag: "frameOff",
      wide: Math.sign(w - p.b),
      tall: Math.sign(h - p.h),
    };
  }

  /* ── tiles: order exactly enough paving tiles for a triangle or trapezoid bed ─ */
  function genTiles(r, tier, variant) {
    if (variant === "trap") return genTrap(r);
    let p;
    if (tier <= 1) {
      // Right triangle; every side is a whole number.
      const [b, h, s] = r.pick([...TRIPLES, [12, 5, 13], [12, 9, 15]]);
      const flip = r.pick([false, true]);
      const pts = flip ? [P(0, 0), P(b, 0), P(b, h)] : [P(0, 0), P(b, 0), P(0, h)];
      p = {
        shape: "tri",
        b,
        h,
        s,
        perimeter: b + h + s,
        pts,
        heightLine: flip ? [P(b, 0), P(b, h)] : [P(0, 0), P(0, h)],
        heightIsSide: true,
        slantEdge: flip ? [P(0, 0), P(b, h)] : [P(b, 0), P(0, h)],
      };
    } else if (r.next() < 0.5) {
      // Apex over the base: the left side is slanted, the height is inside.
      let px;
      let h;
      let s;
      let b;
      do {
        [px, h, s] = r.pick(TRIPLES);
        b = px + r.int(2, 6);
      } while ((b * h) % 2 !== 0);
      p = {
        shape: "tri",
        b,
        h,
        s,
        perimeter: null,
        pts: [P(0, 0), P(b, 0), P(px, h)],
        heightLine: [P(px, 0), P(px, h)],
        slantEdge: [P(0, 0), P(px, h)],
      };
    } else {
      // Obtuse: the apex sits past the base, so the height falls OUTSIDE the bed.
      let q;
      let h;
      let s;
      let b;
      do {
        [q, h, s] = r.pick(TRIPLES);
        b = r.int(3, 8);
      } while ((b * h) % 2 !== 0);
      p = {
        shape: "tri",
        b,
        h,
        s,
        perimeter: null,
        pts: [P(0, 0), P(b, 0), P(b + q, h)],
        heightLine: [P(b + q, 0), P(b + q, h)],
        baseExtension: [P(b, 0), P(b + q, 0)],
        slantEdge: [P(b, 0), P(b + q, h)],
      };
    }
    p.area = (p.b * p.h) / 2;
    // Two copies make a parallelogram: rotate the bed half a turn about the middle of its right side.
    const [A, B, C] = p.pts;
    p.twin = [P(B.x + C.x - A.x, B.y + C.y - A.y), C, B];
    p.double = p.b * p.h;
    return p;
  }
  function genTrap(r) {
    let p;
    if (r.next() < 0.5) {
      // Isosceles: two equal slanted legs.
      const [off, h, s] = r.pick(TRIPLES.slice(0, 2));
      const b1 = r.int(2, 7);
      const b2 = b1 + 2 * off;
      p = {
        shape: "trap",
        b1,
        b2,
        h,
        s,
        perimeter: b1 + b2 + 2 * s,
        pts: [P(0, 0), P(b2, 0), P(off + b1, h), P(off, h)],
        heightLine: [P(off, 0), P(off, h)],
        slantEdge: [P(off + b1, h), P(b2, 0)],
      };
    } else {
      // Right trapezoid: one leg is the height, the other is slanted.
      let off;
      let h;
      let s;
      let b1;
      do {
        [off, h, s] = r.pick(TRIPLES);
        b1 = r.int(2, off > 4 ? 5 : 7);
      } while (((2 * b1 + off) * h) % 2 !== 0);
      const b2 = b1 + off;
      const top = r.pick([false, true]); // true = the long base is on top
      const fy = (y) => (top ? h - y : y);
      p = {
        shape: "trap",
        b1,
        b2,
        h,
        s,
        perimeter: b1 + b2 + h + s,
        pts: [P(0, 0), P(b2, 0), P(b1, h), P(0, h)].map((q) => P(q.x, fy(q.y))),
        heightLine: [P(0, 0), P(0, h)],
        heightIsSide: true,
        slantEdge: [P(b1, fy(h)), P(b2, fy(0))],
      };
    }
    p.area = ((p.b1 + p.b2) * p.h) / 2;
    p.double = (p.b1 + p.b2) * p.h;
    // Half-turn copy about the midpoint of the slanted leg completes a parallelogram.
    const [m1, m2] = p.slantEdge;
    p.twin = p.pts.map((q) => P(m1.x + m2.x - q.x, m1.y + m2.y - q.y));
    return p;
  }
  function tileCandidates(p) {
    if (p.shape === "tri")
      return [
        [p.b * p.h, "noHalf"],
        [(p.b * p.s) / 2, "slantHeight"],
        [p.b * p.s, "slantHeight"],
        [p.perimeter, "perimeter"],
        [p.b + p.h, "addLengths"],
      ];
    return [
      [(p.b1 + p.b2) * p.h, "noHalf"],
      [(p.b1 * p.h) / 2, "oneBase"],
      [(p.b2 * p.h) / 2, "oneBase"],
      [p.b1 * p.h, "oneBase"],
      [p.b2 * p.h, "oneBase"],
      [((p.b1 + p.b2) * p.s) / 2, "slantHeight"],
      [(p.b1 + p.b2) * p.s, "slantHeight"],
      [p.perimeter, "perimeter"],
      [p.b1 + p.b2 + p.h, "addLengths"],
    ];
  }
  function judgeTiles(p, v) {
    if (v == null || Number.isNaN(v)) return { ok: false, incomplete: true };
    if (eq(v, p.area)) return { ok: true };
    return {
      ok: false,
      tag: classify(v, tileCandidates(p), v > p.area ? "tooMany" : "tooFew"),
      over: v > p.area,
    };
  }

  /* ── courtyard: decompose a composite courtyard into pieces ───────────── */
  function genCourtyard(r, tier) {
    if (tier <= 1) {
      const W = r.int(6, 11);
      const H = r.int(5, 8);
      const cw = r.int(2, W - 3);
      const ch = r.int(2, H - 2);
      const outline = [P(0, 0), P(W, 0), P(W, H - ch), P(W - cw, H - ch), P(W - cw, H), P(0, H)];
      const cuts = {
        across: {
          line: [P(0, H - ch), P(W - cw, H - ch)],
          pieces: [
            piece(rect(0, 0, W, H - ch), W * (H - ch), "+", [[W * H, "wholeRect"]]),
            piece(rect(0, H - ch, W - cw, H), (W - cw) * ch, "+", [
              [(W - cw) * H, "overlap"],
              [W * H, "wholeRect"],
              [(W - cw) * (H - ch), "missingLength"],
            ]),
          ],
        },
        down: {
          line: [P(W - cw, 0), P(W - cw, H - ch)],
          pieces: [
            piece(rect(0, 0, W - cw, H), (W - cw) * H, "+", [[W * H, "wholeRect"]]),
            piece(rect(W - cw, 0, W, H - ch), cw * (H - ch), "+", [
              [W * (H - ch), "overlap"],
              [W * H, "wholeRect"],
              [(W - cw) * (H - ch), "missingLength"],
            ]),
          ],
        },
      };
      return {
        kind: "ell",
        W,
        H,
        cw,
        ch,
        outline,
        cuts,
        needsCut: true,
        area: W * H - cw * ch,
        perimeter: 2 * (W + H),
        labels: [
          { a: P(0, 0), b: P(W, 0), v: W },
          { a: P(0, H), b: P(0, 0), v: H },
          { a: P(W - cw, H), b: P(0, H), v: W - cw },
          { a: P(W, 0), b: P(W, H - ch), v: H - ch },
        ],
      };
    }
    if (tier === 2) {
      // A gable courtyard: a rectangle with a triangular garden on top.
      let W;
      let T;
      do {
        W = r.int(4, 10);
        T = r.int(2, 4);
      } while ((W * T) % 2 !== 0);
      const R = r.int(2, 5);
      const H = R + T;
      const px = r.int(1, W - 1);
      return {
        kind: "gable",
        W,
        R,
        T,
        H,
        outline: [P(0, 0), P(W, 0), P(W, R), P(px, H), P(0, R)],
        cuts: {
          fixed: {
            line: [P(0, R), P(W, R)],
            pieces: [
              piece(rect(0, 0, W, R), W * R, "+", [[W * H, "overlap"]]),
              piece([P(0, R), P(W, R), P(px, H)], (W * T) / 2, "+", [
                [W * T, "noHalf"],
                [(W * H) / 2, "overlap"],
                [W * H, "overlap"],
              ]),
            ],
          },
        },
        area: W * R + (W * T) / 2,
        perimeter: null,
        labels: [
          { a: P(0, 0), b: P(W, 0), v: W },
          { a: P(0, R), b: P(0, 0), v: R },
        ],
        dimLine: { x: W + 1.2, y0: 0, y1: H, v: H },
        apexDash: [P(px, R), P(px, H)],
      };
    }
    // Tier 3: a lawn with a triangular flower bed cut out of one corner (subtract it).
    let W;
    let H;
    let a;
    let c;
    do {
      W = r.int(7, 11);
      H = r.int(5, 8);
      a = r.int(2, W - 3);
      c = r.int(2, H - 2);
    } while ((a * c) % 2 !== 0);
    return {
      kind: "corner",
      W,
      H,
      a,
      c,
      needsSign: true,
      outline: [P(0, 0), P(W, 0), P(W, H - c), P(W - a, H), P(0, H)],
      hole: [P(W - a, H), P(W, H), P(W, H - c)],
      cuts: {
        fixed: {
          line: null,
          pieces: [
            piece(rect(0, 0, W, H), W * H, "+", [[2 * (W + H), "perimeter"]]),
            piece([P(W - a, H), P(W, H), P(W, H - c)], (a * c) / 2, "−", [
              [a * c, "noHalf"],
              [(W * H) / 2, "missingLength"],
              [((W - a) * (H - c)) / 2, "missingLength"],
            ]),
          ],
        },
      },
      area: W * H - (a * c) / 2,
      perimeter: null,
      labels: [
        { a: P(0, 0), b: P(W, 0), v: W },
        { a: P(0, H), b: P(0, 0), v: H },
        { a: P(W - a, H), b: P(0, H), v: W - a },
        { a: P(W, 0), b: P(W, H - c), v: H - c },
      ],
    };
  }
  function piece(pts, area, op, wrongs) {
    return { pts, area, op, wrongs };
  }
  /** inp = {cut, vals:[n|null], ops:['+'|'−'|null]} */
  function judgeCourtyard(p, inp) {
    const cut = p.needsCut ? inp.cut : "fixed";
    if (!cut || !p.cuts[cut]) return { ok: false, incomplete: true, need: "cut" };
    const pieces = p.cuts[cut].pieces;
    if (pieces.some((_, i) => inp.vals[i] == null)) return { ok: false, incomplete: true, need: "vals" };
    if (p.needsSign && !inp.ops[1]) return { ok: false, incomplete: true, need: "sign" };
    for (let i = 0; i < pieces.length; i++) {
      const pc = pieces[i];
      const v = inp.vals[i];
      if (!eq(v, pc.area)) {
        const total = inp.vals.reduce((s, x) => s + x, 0);
        let tag = classify(v, pc.wrongs, v > pc.area ? "pieceOver" : "pieceUnder");
        if (p.perimeter && eq(total, p.perimeter)) tag = "perimeter";
        return { ok: false, tag, piece: i, over: v > pc.area };
      }
    }
    if (p.needsSign && inp.ops[1] !== "−") return { ok: false, tag: "addedHole", piece: 1 };
    return { ok: true };
  }
  function courtyardTotal(p, inp) {
    const cut = p.needsCut ? inp.cut : "fixed";
    if (!cut) return null;
    const pieces = p.cuts[cut].pieces;
    let t = 0;
    for (let i = 0; i < pieces.length; i++) {
      if (inp.vals[i] == null) return null;
      const op = p.needsSign && i === 1 ? inp.ops[1] : "+";
      if (!op) return null;
      t += op === "−" ? -inp.vals[i] : inp.vals[i];
    }
    return round2(t);
  }

  /* ── pavilion: a regular polygon floor tiled from congruent triangles ──── */
  function genPavilion(r, tier) {
    const n = tier <= 1 ? 6 : tier === 2 ? r.pick([5, 8]) : r.pick([5, 6, 8]);
    const s = r.pick([4, 6, 8, 10]);
    const a = round1(s / (2 * Math.tan(Math.PI / n)));
    const rad = round1(s / (2 * Math.sin(Math.PI / n)));
    const wedge = round2((s * a) / 2);
    return {
      n,
      s,
      a,
      r: rad,
      wedge,
      area: round2(n * wedge),
      totalOnly: tier >= 3,
    };
  }
  /** inp = {count, wedge} (tiers 1–2) or {total} (tier 3). */
  function judgePavilion(p, inp) {
    const { n, s, a } = p;
    const rr = p.r;
    if (p.totalOnly) {
      if (inp.total == null) return { ok: false, incomplete: true };
      if (eq(inp.total, p.area)) return { ok: true };
      return {
        ok: false,
        tag: classify(
          inp.total,
          [
            [n * s * a, "noHalf"],
            [(n * s * rr) / 2, "radius"],
            [n * s * rr, "radius"],
            [n * s, "perimeter"],
            [p.wedge, "oneWedge"],
          ],
          inp.total > p.area ? "tooMany" : "tooFew",
        ),
        over: inp.total > p.area,
      };
    }
    if (inp.wedge == null) return { ok: false, incomplete: true };
    if (!eq(inp.wedge, p.wedge))
      return {
        ok: false,
        tag: classify(
          inp.wedge,
          [
            [s * a, "noHalf"],
            [(s * rr) / 2, "radius"],
            [s * rr, "radius"],
            [s + a, "addLengths"],
          ],
          inp.wedge > p.wedge ? "wedgeOver" : "wedgeUnder",
        ),
        over: inp.wedge > p.wedge,
      };
    if (inp.count !== n) return { ok: false, tag: "wedgeCount", over: inp.count > n };
    return { ok: true };
  }

  /* ── edging: a rectangular bed with a fixed edging length and planting area ─ */
  const EDGE_MAXW = 12;
  const EDGE_MAXL = 18;
  function genEdging(r) {
    let w;
    let l;
    do {
      w = r.int(2, 6);
      l = r.int(w + 1, 11);
    } while (2 * (w + l) === w * l);
    return { w, l, P: 2 * (w + l), A: w * l, maxW: EDGE_MAXW, maxL: EDGE_MAXL };
  }
  function judgeEdging(p, inp) {
    const per = 2 * (inp.w + inp.l);
    const area = inp.w * inp.l;
    if (per === p.P && area === p.A) return { ok: true };
    if (area === p.P || per === p.A) return { ok: false, tag: "perimeterArea", per, area };
    if (inp.w + inp.l === p.P) return { ok: false, tag: "halfEdging", per, area };
    if (per === p.P) return { ok: false, tag: "areaOff", per, area };
    if (area === p.A) return { ok: false, tag: "edgingOff", per, area };
    return { ok: false, tag: "bedOff", per, area };
  }

  /* ── answers (used by the board demos and the Node check) ─────────────── */
  const answer = {
    frame: (p) => ({ w: p.b, h: p.h }),
    tiles: (p) => p.area,
    courtyard: (p) => {
      const cut = p.needsCut ? "across" : "fixed";
      return {
        cut,
        vals: p.cuts[cut].pieces.map((x) => x.area),
        ops: [null, p.needsSign ? "−" : null],
      };
    },
    pavilion: (p) => (p.totalOnly ? { total: p.area } : { count: p.n, wedge: p.wedge }),
    edging: (p) => ({ w: p.w, l: p.l }),
  };

  /** Parse a typed entry ("12", "8.5", "") into a number or null. */
  function parseEntry(text) {
    if (text === "" || text === "." || text == null) return null;
    const v = Number(text);
    return Number.isFinite(v) ? v : null;
  }
  /** Shared typing rule: digits, one decimal point, at most `max` characters. */
  function typeInto(text, key, max = 5, decimals = false) {
    if (key === "Backspace") return text.slice(0, -1);
    if (/^[0-9]$/.test(key) && text.length < max) return (text + key).replace(/^0+(?=\d)/, "");
    if (key === "." && decimals && !text.includes(".") && text.length < max)
      return (text || "0") + ".";
    return text;
  }
  /** Display numbers the way the board writes them (5.2, 12, 93.6). */
  const fmt = (x) => String(round2(x));

  window.AA_MISSIONS = Object.assign(window.AA_MISSIONS || {}, {
    L,
    eq,
    fmt,
    round2,
    parseEntry,
    typeInto,
    geom: { polyArea, clipBelow, fillLevel, bounds, rect, P },
    gen: {
      frame: genFrame,
      tiles: genTiles,
      courtyard: genCourtyard,
      pavilion: genPavilion,
      edging: genEdging,
    },
    judge: {
      frame: judgeFrame,
      tiles: judgeTiles,
      courtyard: judgeCourtyard,
      pavilion: judgePavilion,
      edging: judgeEdging,
    },
    courtyardTotal,
    tileCandidates,
    answer,
    TRIPLES,
  });
})();

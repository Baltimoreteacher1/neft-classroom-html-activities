/**
 * Practice Studio figures (window.StudioViz), part 2: coordinate planes and solid/plane geometry.
 *
 * Registers coord, shape and prism on window.StudioViz using the kit from assets/studio-viz.js (either file may load
 * first). Contract: docs/specs/practice-studio-v2.md section 3.
 *
 *   coord  {xmin,xmax,ymin,ymax, points:[{x,y,l?}], segments?:[[i,j]], polygon?:[i...], line?:{m,b}, grid?:false,
 *           xlabel?, ylabel?}  four quadrants, axis arrows, light grid; the range widens to hold every point
 *   shape  {s, dims, labels?, unit?}  s: para tri trap rect rhombus hex lshape (long names such as "parallelogram"
 *          also work). The height is always drawn dashed and perpendicular with a right-angle mark. ONLY the dims
 *          present are printed (a number, or a string such as "?" or "h"); a dim left out is never labelled.
 *          dims   para b h side | tri b h s1 s2 apex(0..1) | trap b1 b2 h side | rect l w (or side) |
 *                 rhombus side h (or d1 d2) | hex side a n(3..12) | lshape l w l1 w1 l2 w2
 *          lshape l = bottom, w = left, l1 = top, w2 = inner vertical, l2 = inner horizontal, w1 = lower right
 *   prism  {l,w,h, unit?, labels?, cubes?, net?}  oblique box, unit-cube grid on the faces, or the unfolded net
 *          {tri:{b,h,s?}, len, unit?, labels?, net?}  a triangular prism: end triangle, length, or the folding net
 *   pyramid {n:3|4, base, slant, vh?, unit?, labels?, cube?, net?}  slant height dashed (not the vertical height); cube puts the
 *          pyramid on a cube; net draws the faces flat
 */
(() => {
  const W = /** @type {any} */ (window);
  const V = (W.StudioViz = W.StudioViz || {});
  const boot = () => {
    const { fmt, req, opt, clamp, list, plural, dim, tw, T, L, Rc, Ci, Pg, arrow, square, MULT } =
      V.kit;
    const { register } = V;

    /* ---- coord: four-quadrant coordinate plane ------------------------------------------------- */
    const hits = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
    /** How many 3px steps along segment g = [x1,y1,x2,y2] fall inside box r. */
    const segHits = (g, r) => {
      const len = Math.hypot(g[2] - g[0], g[3] - g[1]);
      let k = 0;
      for (let i = 0; i <= len; i += 3) {
        const t = len ? i / len : 0;
        const x = g[0] + (g[2] - g[0]) * t;
        const y = g[1] + (g[3] - g[1]) * t;
        if (x > r.x0 && x < r.x1 && y > r.y0 && y < r.y1) k++;
      }
      return k;
    };
    /** Clip y = m x + b to the box (Liang-Barsky): [x1, y1, x2, y2] in data units, or null when it misses. */
    const clipLine = (m, b, xa, xb, ya, yb) => {
      const y1 = m * xa + b;
      const dx = xb - xa;
      const dy = m * xb + b - y1;
      let t0 = 0;
      let t1 = 1;
      for (const [p, q] of [
        [-dx, 0],
        [dx, xb - xa],
        [-dy, y1 - ya],
        [dy, yb - y1],
      ]) {
        if (Math.abs(p) < 1e-12) {
          if (q < 0) return null;
          continue;
        }
        if (p < 0) t0 = Math.max(t0, q / p);
        else t1 = Math.min(t1, q / p);
      }
      return t0 > t1 ? null : [xa + t0 * dx, y1 + t0 * dy, xa + t1 * dx, y1 + t1 * dy];
    };
    const SPOTS = [
      [1, -1, "start"],
      [-1, -1, "end"],
      [1, 1, "start"],
      [-1, 1, "end"],
      [0, -1, "middle"],
      [0, 1, "middle"],
      [1, 0, "start"],
      [-1, 0, "end"],
    ];
    register("coord", (s) => {
      const pts = (Array.isArray(s.points) ? s.points : []).map((p) => ({
        x: req(p?.x, "coord point.x"),
        y: req(p?.y, "coord point.y"),
        l: p?.l == null ? "" : String(p.l),
      }));
      let xmin = opt(s.xmin, -10);
      let xmax = opt(s.xmax, 10);
      let ymin = opt(s.ymin, -10);
      let ymax = opt(s.ymax, 10);
      for (const p of pts) {
        xmin = Math.min(xmin, Math.floor(p.x));
        xmax = Math.max(xmax, Math.ceil(p.x));
        ymin = Math.min(ymin, Math.floor(p.y));
        ymax = Math.max(ymax, Math.ceil(p.y));
      }
      if (!(xmax > xmin) || !(ymax > ymin))
        throw new RangeError("coord: max must be greater than min");
      const idx = (a) => {
        if (!Number.isInteger(a) || a < 0 || a >= pts.length)
          throw new RangeError("coord: point index out of range");
        return a;
      };
      const segs = (Array.isArray(s.segments) ? s.segments : []).map((g) => [
        idx(g?.[0]),
        idx(g?.[1]),
      ]);
      const poly = Array.isArray(s.polygon) ? s.polygon.map(idx) : [];
      const dx = xmax - xmin;
      const dy = ymax - ymin;
      // equal units on both axes unless the ranges are far apart (a ratio graph), then each axis fills its frame
      const square1 = dx / dy >= 0.5 && dx / dy <= 2;
      const ux = square1 ? Math.min(360 / dx, 360 / dy, 42) : Math.min(360 / dx, 60);
      const uy = square1 ? ux : Math.min(300 / dy, 60);
      const pw = dx * ux;
      const ph = dy * uy;
      const xl = s.xlabel == null ? "x" : String(s.xlabel);
      const yl = s.ylabel == null ? "y" : String(s.ylabel);
      const longX = xl.length > 2;
      const longY = yl.length > 2;
      const stride = (u, px) => MULT.find((m) => m * u >= px) || 1000;
      const gx = stride(ux, 26);
      const gy = stride(uy, 22);
      const ml = 14 + Math.max(tw(fmt(ymin), 13), tw(fmt(ymax), 13)) + (longY ? 24 : 0);
      const mt = longY ? 30 : 34;
      const X = (v) => ml + (v - xmin) * ux;
      const Y = (v) => mt + (ymax - v) * uy;
      const ax = X(clamp(0, xmin, xmax));
      const ay = Y(clamp(0, ymin, ymax));
      const W0 = ml + pw + (longX ? 30 : 34);
      const H0 = mt + ph + 38 + (longX ? 24 : 0);
      const fixed = (v) => Math.round(v * 1e6) / 1e6;
      const steps = (lo, hi, st) => {
        const out = [];
        for (let v = Math.ceil(lo / st - 1e-9) * st; v <= hi + 1e-9; v += st) out.push(fixed(v));
        return out;
      };
      let body = "";
      if (s.grid !== false) {
        for (const v of steps(xmin, xmax, ux >= 14 ? 1 : gx))
          body += L(X(v), mt, X(v), mt + ph, "sg");
        for (const v of steps(ymin, ymax, uy >= 14 ? 1 : gy))
          body += L(ml, Y(v), ml + pw, Y(v), "sg");
      }
      body += Rc(ml, mt, pw, ph, "fn sg");
      body += L(xmin < 0 ? ml - 12 : ml, ay, ml + pw + 12, ay, "ax");
      body += L(ax, ymin < 0 ? mt + ph + 12 : mt + ph, ax, mt - 12, "ax");
      body += arrow(ml + pw + 18, ay, 0) + arrow(ax, mt - 18, -Math.PI / 2);
      if (xmin < 0) body += arrow(ml - 18, ay, Math.PI);
      if (ymin < 0) body += arrow(ax, mt + ph + 18, Math.PI / 2);
      const origin = xmin <= 0 && xmax >= 0 && ymin <= 0 && ymax >= 0;
      for (const t of steps(xmin, xmax, gx)) {
        if (origin && t === 0) continue;
        body += L(X(t), ay - 3.5, X(t), ay + 3.5, "tk");
        body += T(X(t), ay + 19, fmt(t), { a: "middle", z: 13, c: "hl" });
      }
      for (const t of steps(ymin, ymax, gy)) {
        if (origin && t === 0) continue;
        body += L(ax - 3.5, Y(t), ax + 3.5, Y(t), "tk");
        body += T(ax - 9, Y(t), fmt(t), { a: "end", z: 13, m: 1, c: "hl" });
      }
      if (origin) body += T(ax - 8, ay + 18, "0", { a: "end", z: 13, c: "hl" });
      if (longX) body += T(ml + pw / 2, mt + ph + 56, xl, { a: "middle", z: 15, c: "bd" });
      else body += T(ml + pw + 30, ay + 5, xl, { z: 16, c: "bd" });
      if (longY) body += T(14, mt + ph / 2, yl, { a: "middle", z: 15, c: "bd", r: -90 });
      else body += T(ax, mt - 26, yl, { a: "middle", z: 16, c: "bd" });

      const px = (i) => [X(pts[i].x), Y(pts[i].y)];
      const lines = [];
      if (poly.length > 2) {
        body += Pg(poly.map(px), "fy sb");
        poly.forEach((p, i) => lines.push([...px(p), ...px(poly[(i + 1) % poly.length])]));
      }
      for (const [a, b] of segs) {
        body += L(...px(a), ...px(b), "sb");
        lines.push([...px(a), ...px(b)]);
      }
      const ln = s.line && typeof s.line === "object" ? s.line : null;
      const cut =
        ln &&
        clipLine(req(ln.m, "coord line.m"), req(ln.b, "coord line.b"), xmin, xmax, ymin, ymax);
      if (cut) {
        const [x1, y1, x2, y2] = [X(cut[0]), Y(cut[1]), X(cut[2]), Y(cut[3])];
        const ang = Math.atan2(y2 - y1, x2 - x1);
        body +=
          L(x1, y1, x2, y2, "sb") +
          arrow(x2, y2, ang, 10, "fb") +
          arrow(x1, y1, ang + Math.PI, 10, "fb");
        lines.push([x1, y1, x2, y2]);
      }
      for (const p of pts) body += Ci(X(p.x), Y(p.y), 6.5, "fb sw");
      // each label takes the free spot (around its point) that crosses the fewest lines, points and labels
      const placed = [];
      const dotBoxes = pts.map((o) => ({
        x0: X(o.x) - 8,
        x1: X(o.x) + 8,
        y0: Y(o.y) - 8,
        y1: Y(o.y) + 8,
      }));
      const axisH = { x0: ml - 12, x1: ml + pw + 12, y0: ay - 2, y1: ay + 2 };
      const axisV = { x0: ax - 2, x1: ax + 2, y0: mt - 12, y1: mt + ph + 12 };
      for (const p of pts) {
        if (!p.l) continue;
        const wd = tw(p.l, 15, true);
        let best = null;
        for (const [sx, sy, a] of SPOTS) {
          const tx = X(p.x) + sx * 10;
          const ty = Y(p.y) + sy * 10 + (sy > 0 ? 13 : sy < 0 ? -4 : 5);
          const x0 = tx - (a === "end" ? wd : a === "middle" ? wd / 2 : 0);
          const box = { x0, x1: x0 + wd, y0: ty - 13, y1: ty + 3 };
          let pen = box.x0 < 2 || box.x1 > W0 - 2 || box.y0 < 2 || box.y1 > H0 - 2 ? 20 : 0;
          for (const q of [...placed, ...dotBoxes]) if (hits(box, q)) pen += 10;
          if (hits(box, axisH)) pen += 4;
          if (hits(box, axisV)) pen += 4;
          for (const g of lines) pen += Math.min(3, segHits(g, box)) * 2;
          if (!best || pen < best.pen) best = { pen, tx, ty, a, box };
        }
        if (best) {
          placed.push(best.box);
          body += T(best.tx, best.ty, p.l, { a: best.a, z: 15, c: "bd hl" });
        }
      }
      const title = `Coordinate plane, x from ${fmt(xmin)} to ${fmt(xmax)} and y from ${fmt(ymin)} to ${fmt(ymax)}`;
      const named = pts.filter((p) => p.l).map((p) => p.l);
      const name = (i) => pts[i].l || `point ${i + 1}`;
      const more = [];
      if (poly.length > 2) more.push(`a polygon joining ${list(poly.map(name))}`);
      if (segs.length) more.push(plural(segs.length, "line segment"));
      if (ln && cut)
        more.push(`the line y = ${fmt(ln.m)}x ${ln.b < 0 ? "−" : "+"} ${fmt(Math.abs(ln.b))}`);
      const where = pts.map((p, i) => `${name(i)} at (${fmt(p.x)}, ${fmt(p.y)})`);
      const alt = `${title}.${where.length ? ` ${where.join("; ")}.` : ""}${more.length ? ` It also shows ${list(more)}.` : ""}`;
      return {
        w: W0,
        h: H0,
        body,
        title: named.length ? `${title}, with points ${list(named)}` : title,
        alt,
      };
    });

    /* ---- shape: plane figures with the height drawn dashed and perpendicular -------------------- */
    const U = 150; // natural height of a drawn shape in px; the renderer scales it to fit
    const ratio = (a, b, d, lo, hi) => (a?.v != null && b?.v > 0 ? clamp(a.v / b.v, lo, hi) : d);
    /** Flat coordinates in, [[x, y], ...] out (keeps the shape tables below on one line each). */
    const P2 = (...c) => Array.from({ length: c.length / 2 }, (_, i) => [c[2 * i], c[2 * i + 1]]);
    /** A right-angle mark at (x, y) opening along unit directions (sx, 0) and (0, sy). */
    const corner = (x, y, sx, sy) => P2(x, y, sx, 0, 0, sy);
    /** A label: the dimension, where it hangs (shape space), a px nudge, text anchor and its spoken name. */
    const lb = (d, x, y, dx, dy, a, name) => ({ d, x, y, dx, dy, a, name });
    const ALIAS = {
      parallelogram: "para",
      triangle: "tri",
      trapezoid: "trap",
      rectangle: "rect",
      square: "rect",
      hexagon: "hex",
      polygon: "hex",
      l: "lshape",
      "l-shape": "lshape",
      composite: "lshape",
    };
    const NAMES = {
      para: "Parallelogram",
      tri: "Triangle",
      trap: "Trapezoid",
      rect: "Rectangle",
      rhombus: "Rhombus",
      hex: "Regular polygon",
      lshape: "L-shaped figure",
    };
    const WORDS = { base: "b", height: "h" };
    const normDims = (d) => {
      const o = {};
      for (const [k, v] of Object.entries(d && typeof d === "object" ? d : {}))
        o[WORDS[k] || k] = v;
      return o;
    };
    const SHAPES = {
      para(d) {
        const [b, h, sd] = [dim(d.b), dim(d.h), dim(d.side)];
        const B = ratio(b, h, 1.7, 0.3, 6) * U;
        let o = 0.34 * B;
        if (sd?.v != null && h?.v > 0 && sd.v > h.v)
          o = (Math.sqrt(sd.v ** 2 - h.v ** 2) / h.v) * U;
        o = clamp(o, 0.14 * B, 0.8 * B);
        return {
          w: B + o,
          h: U,
          poly: P2(o, 0, B + o, 0, B, U, 0, U),
          ht: P2(o, 0, o, U),
          ra: [corner(o, U, 1, -1)],
          lab: [
            lb(b, B / 2, U, 0, 24, "middle", "base"),
            lb(h, o, U / 2, 9, 5, "start", "height"),
            lb(sd, B + o / 2, U / 2, 12, 5, "start", "slanted side"),
          ],
        };
      },
      tri(d) {
        const [b, h] = [dim(d.b), dim(d.h)];
        const B = ratio(b, h, 1.5, 0.2, 5) * U;
        const ap = clamp(opt(d.apex, 0.36), 0, 1);
        const ax = ap * B;
        const right = ap === 0 || ap === 1; // a right triangle: the height is one of its sides
        return {
          w: B,
          h: U,
          poly: P2(ax, 0, B, U, 0, U),
          ht: right ? null : P2(ax, 0, ax, U),
          ra: [
            right
              ? corner(ap * B, U, ap === 0 ? 1 : -1, -1)
              : corner(ax, U, ax < B / 2 ? 1 : -1, -1),
          ],
          lab: [
            lb(b, B / 2, U, 0, 24, "middle", "base"),
            lb(h, ax, U / 2, ap === 1 ? -10 : 9, 5, ap === 1 ? "end" : "start", "height"),
            lb(dim(d.s1), ax / 2, U / 2, -9, -2, "end", "left side"),
            lb(dim(d.s2), (ax + B) / 2, U / 2, 9, -2, "start", "right side"),
          ],
        };
      },
      trap(d) {
        const [b1, b2, h, sd] = [dim(d.b1), dim(d.b2), dim(d.h), dim(d.side)];
        const swap = b1?.v != null && b2?.v != null && b1.v > b2.v; // the longer base sits at the bottom
        const [top, bot] = swap ? [b2, b1] : [b1, b2];
        const r = top?.v != null && bot?.v > 0 ? clamp(top.v / bot.v, 0.2, 0.92) : 0.56;
        const B = (bot?.v != null && h?.v > 0 ? clamp(bot.v / h.v, 0.9, 8) : 1.9) * U;
        const t = B * r;
        const o = (B - t) / 2;
        return {
          w: B,
          h: U,
          poly: P2(o, 0, o + t, 0, B, U, 0, U),
          ht: P2(o, 0, o, U),
          ra: [corner(o, U, 1, -1)],
          hash: sd ? [P2(0, U, o, 0), P2(B, U, o + t, 0)] : [],
          lab: [
            lb(top, o + t / 2, 0, 0, -11, "middle", "top base"),
            lb(bot, B / 2, U, 0, 24, "middle", "bottom base"),
            lb(h, o, U / 2, 9, 5, "start", "height"),
            lb(sd, o / 2, U / 2, -10, 5, "end", "leg"),
          ],
        };
      },
      rect(d) {
        const sq = dim(d.side);
        const l = dim(d.l ?? d.base) || sq;
        const w = dim(d.w ?? d.height) || sq;
        const square1 = !!sq && !d.l && !d.w; // one side given: a square
        const B = (square1 ? 1 : ratio(l, w, 1.6, 0.25, 6)) * U;
        return {
          w: B,
          h: U,
          poly: P2(0, 0, B, 0, B, U, 0, U),
          ra: [corner(0, 0, 1, 1), corner(B, 0, -1, 1), corner(B, U, -1, -1), corner(0, U, 1, -1)],
          hash: square1 ? [P2(0, 0, B, 0), P2(B, 0, B, U), P2(B, U, 0, U), P2(0, U, 0, 0)] : [],
          lab: [
            lb(l, B / 2, U, 0, 24, "middle", square1 ? "side" : "length"),
            lb(square1 ? null : w, 0, U / 2, -10, 5, "end", "width"),
          ],
        };
      },
      rhombus(d) {
        const [sd, h, d1, d2] = [dim(d.side), dim(d.h), dim(d.d1), dim(d.d2)];
        if (d1 || d2) {
          const w = ratio(d1, d2, 1.2, 0.6, 1.9) * U;
          const m = U / 2;
          return {
            w,
            h: U,
            poly: P2(w / 2, 0, w, m, w / 2, U, 0, m),
            extra: [P2(0, m, w, m), P2(w / 2, 0, w / 2, U)],
            xcls: "sd",
            ra: [corner(w / 2, m, 1, -1)],
            hash: [P2(w / 2, 0, w, m), P2(w, m, w / 2, U), P2(w / 2, U, 0, m), P2(0, m, w / 2, 0)],
            lab: [
              lb(d1, w * 0.76, m, 0, -9, "middle", "horizontal diagonal"),
              lb(d2, w / 2, m + U * 0.26, 9, 5, "start", "vertical diagonal"),
              lb(sd, w * 0.75, m / 2, 12, -4, "start", "side"),
            ],
          };
        }
        // drawn to the given numbers: the dashed height is h/side of the slanted side, never a fixed look
        const fit = sd?.v > 0 && h?.v > 0 && h.v < sd.v ? h.v / sd.v : 0.78;
        const B = 1.15 * U;
        const H = clamp(fit, 0.12, 0.96) * B;
        const o = Math.sqrt(B * B - H * H);
        return {
          w: B + o,
          h: H,
          poly: P2(o, 0, B + o, 0, B, H, 0, H),
          ht: P2(o, 0, o, H),
          ra: [corner(o, H, 1, -1)],
          hash: [P2(o, 0, B + o, 0), P2(B + o, 0, B, H), P2(B, H, 0, H), P2(0, H, o, 0)],
          lab: [
            lb(sd, B / 2, H, 0, 24, "middle", "side"),
            lb(h, o, H / 2, 9, 5, "start", "height"),
          ],
        };
      },
      hex(d) {
        const k = clamp(Math.round(opt(d.n, 6)), 3, 12);
        const R = 82;
        const raw = Array.from({ length: k }, (_, i) => {
          const a = Math.PI / 2 + Math.PI / k + (2 * Math.PI * i) / k; // a flat side sits at the bottom
          return [R * Math.cos(a), R * Math.sin(a)];
        });
        const [x0, y0] = [Math.min(...raw.map((p) => p[0])), Math.min(...raw.map((p) => p[1]))];
        const pts = raw.map((p) => [p[0] - x0, p[1] - y0]);
        const c = [-x0, -y0];
        const ap = R * Math.cos(Math.PI / k);
        return {
          w: Math.max(...pts.map((p) => p[0])),
          h: Math.max(...pts.map((p) => p[1])),
          poly: pts,
          extra: pts.map((p) => [c, p]),
          ht: [c, [c[0], c[1] + ap]],
          ra: [corner(c[0], c[1] + ap, 1, -1)],
          hash: pts.map((p, i) => [p, pts[(i + 1) % k]]),
          dot: c,
          lab: [
            lb(dim(d.a ?? d.apothem), c[0], c[1] + ap / 2, 9, 4, "start", "apothem"),
            lb(dim(d.side), c[0], c[1] + ap, 0, 24, "middle", "side"),
          ],
        };
      },
      lshape(d) {
        const [Ld, Wd, l1, l2, w1, w2] = ["l", "w", "l1", "l2", "w1", "w2"].map((k) => dim(d[k]));
        const B = ratio(Ld, Wd, 1.4, 0.7, 2.4) * U;
        let fl = 0.55;
        if (Ld?.v > 0 && l1?.v != null) fl = l1.v / Ld.v;
        else if (Ld?.v > 0 && l2?.v != null) fl = 1 - l2.v / Ld.v;
        let fw = 0.45;
        if (Wd?.v > 0 && w2?.v != null) fw = w2.v / Wd.v;
        else if (Wd?.v > 0 && w1?.v != null) fw = 1 - w1.v / Wd.v;
        const a = B * clamp(fl, 0.2, 0.8);
        const c = U * clamp(fw, 0.2, 0.8);
        return {
          w: B,
          h: U,
          poly: P2(0, 0, a, 0, a, c, B, c, B, U, 0, U),
          ra: [
            corner(0, 0, 1, 1),
            corner(a, 0, -1, 1),
            corner(B, c, -1, 1),
            corner(B, U, -1, -1),
            corner(0, U, 1, -1),
          ],
          lab: [
            lb(Ld, B / 2, U, 0, 24, "middle", "bottom edge"),
            lb(Wd, 0, U / 2, -10, 5, "end", "left edge"),
            lb(l1, a / 2, 0, 0, -11, "middle", "top edge"),
            lb(w2, a, c / 2, 10, 5, "start", "inner vertical edge"),
            lb(l2, (a + B) / 2, c, 0, -10, "middle", "inner horizontal edge"),
            lb(w1, B, (c + U) / 2, 10, 5, "start", "lower right edge"),
          ],
        };
      },
    };
    /** A short perpendicular tick on the middle of edge a-b: the mark for "these sides are equal". */
    const tick = (a, b) => {
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const nx = (-(b[1] - a[1]) / len) * 5;
      const ny = ((b[0] - a[0]) / len) * 5;
      const mx = (a[0] + b[0]) / 2;
      const my = (a[1] + b[1]) / 2;
      return L(mx - nx, my - ny, mx + nx, my + ny, "si");
    };
    /** "12 cm" for a number with a unit, the bare text for a symbol such as "?". */
    const say = (dm, unit) => (dm.v != null && unit ? `${dm.t} ${unit}` : dm.t);
    register("shape", (s) => {
      const key = String(s.s).toLowerCase();
      const kind = ALIAS[key] || key;
      const build = SHAPES[kind];
      if (!build) throw new RangeError(`shape: unknown s "${s.s}"`);
      const dims = normDims(s.dims);
      const g = build(dims);
      const unit = s.unit ? String(s.unit) : "";
      const sc = Math.min(1.25, 330 / g.w, 176 / g.h);
      const ox = (480 - g.w * sc) / 2;
      const oy = 40 + (176 - g.h * sc) / 2;
      const P = (p) => [ox + p[0] * sc, oy + p[1] * sc];
      let body = Pg(g.poly.map(P), "ft sb");
      for (const [a, b] of g.extra || []) body += L(...P(a), ...P(b), g.xcls || "sx");
      for (const [a, b] of g.hash || []) body += tick(P(a), P(b));
      if (g.ht) body += L(...P(g.ht[0]), ...P(g.ht[1]), "sd");
      if (s.ghost === "rect" && kind === "tri") {
        // the b x h rectangle the triangle is half of
        for (const [a, b] of [
          [
            [0, 0],
            [g.w, 0],
          ],
          [
            [g.w, 0],
            [g.w, U],
          ],
          [
            [0, 0],
            [0, U],
          ],
        ])
          body += L(...P(a), ...P(b), "sd");
      }
      if (s.cuts && kind === "trap") {
        // the two perpendiculars that cut the trapezoid into a rectangle and two triangles
        const [tl, tr] = g.poly;
        body += L(...P(tr), ...P([tr[0], U]), "sd");
        g.ra = [...(g.ra || []), corner(tr[0], U, -1, -1)];
        const run = Math.abs((dim(dims.b1)?.v ?? NaN) - (dim(dims.b2)?.v ?? NaN)) / 2;
        if (Number.isFinite(run) && run > 0 && tl[0] > 0)
          g.lab = [
            ...g.lab,
            lb(dim(Math.round(run * 100) / 100), tl[0] / 2, U, 0, 24, "middle", "triangle base"),
          ];
      }
      if (g.dot) body += Ci(...P(g.dot), 3.5, "fi");
      const rs = kind === "rect" || kind === "lshape" ? 8 : 9;
      for (const [v, u1, u2] of g.ra || []) body += square(P(v), u1, u2, rs);
      const printed = [];
      for (const q of s.labels === false ? [] : g.lab) {
        if (!q.d) continue;
        const [qx, qy] = P([q.x, q.y]);
        body += T(qx + q.dx, qy + q.dy, say(q.d, unit), { a: q.a, z: 16, c: "bd hl" });
        printed.push(`${q.name} ${say(q.d, unit)}`);
      }
      const what =
        NAMES[kind] + (kind === "hex" && dims.n ? ` with ${Math.round(opt(dims.n, 6))} sides` : "");
      const note = g.ht ? " The height is the dashed line at a right angle to the base." : "";
      const bare = s.labels === false ? ", no measurements shown" : "";
      const title = printed.length
        ? `${what} with ${list(printed)}.${note}`
        : `${what}${bare}.${note}`;
      return { w: 480, h: 260, body, title, alt: title };
    });

    /* ---- prism: rectangular box, oblique view, unit-cube grid, or the unfolded net -------------- */
    /** Fractions along an edge of length v where unit-cube lines fall (none if there would be too many). */
    const cuts = (v) =>
      v > 24
        ? []
        : Array.from({ length: Math.max(0, Math.ceil(v - 1e-9) - 1) }, (_, i) => (i + 1) / v);
    // the two views take (edge values, relative edge lengths, grid?, the l w h dims) and return the drawing
    // plus the labels as [dimension, x, y, anchor, name]
    const obliqueView = ([lv, wv, hv], [rl, rw, rh], grid, [dl, dw, dh]) => {
      const S = Math.min(300 / (rl + 0.383 * rw), 150 / (rh + 0.321 * rw), 200);
      const [Lp, Hp] = [rl * S, rh * S];
      const [ex, ey] = [0.383 * rw * S, 0.321 * rw * S]; // the depth edge runs up and right, at half length
      const ox = (480 - (Lp + ex)) / 2;
      const oy = 42 + (158 - (Hp + ey)) / 2;
      const p = (x, y) => [ox + x, oy + y];
      let body = Pg([p(0, ey), p(Lp, ey), p(Lp + ex, 0), p(ex, 0)], "fw sb");
      body += Pg([p(Lp, ey), p(Lp + ex, 0), p(Lp + ex, Hp), p(Lp, ey + Hp)], "fa sb");
      body += Pg([p(0, ey), p(Lp, ey), p(Lp, ey + Hp), p(0, ey + Hp)], "ft sb");
      const g = (x1, y1, x2, y2) => L(...p(x1, y1), ...p(x2, y2), "sx");
      if (grid) {
        for (const t of cuts(lv))
          body += g(t * Lp, ey, t * Lp, ey + Hp) + g(t * Lp, ey, t * Lp + ex, 0);
        for (const t of cuts(hv)) {
          body += g(0, ey + t * Hp, Lp, ey + t * Hp) + g(Lp, ey + t * Hp, Lp + ex, t * Hp);
        }
        for (const t of cuts(wv)) {
          body += g(t * ex, ey - t * ey, Lp + t * ex, ey - t * ey);
          body += g(Lp + t * ex, ey - t * ey, Lp + t * ex, ey - t * ey + Hp);
        }
      } else {
        // the three edges meeting at the hidden back corner
        const hid = (x1, y1, x2, y2) => L(...p(x1, y1), ...p(x2, y2), "sh");
        body += hid(0, ey + Hp, ex, Hp) + hid(ex, Hp, ex, 0) + hid(ex, Hp, Lp + ex, Hp);
      }
      const marks = [
        [dl, ox + Lp / 2, oy + ey + Hp + 24, "middle", "length"],
        [dh, ox - 10, oy + ey + Hp / 2 + 5, "end", "height"],
        [dw, ox + Lp + ex / 2 + 11, oy + ey + Hp - ey / 2 + 7, "start", "width"],
      ];
      return { body, marks };
    };
    const netView = ([lv, wv, hv], [rl, rw, rh], grid, [dl, dw, dh]) => {
      const S = Math.min(380 / (2 * rw + 2 * rl), 210 / (rh + 2 * rw), 120);
      const [Lp, Wp, Hp] = [rl * S, rw * S, rh * S];
      const ox = (480 - (2 * Wp + 2 * Lp)) / 2;
      const oy = 38 + (214 - (Hp + 2 * Wp)) / 2;
      // top, left, front, right, back, bottom as [x, y, width, height, fill, cubes across, cubes down]
      const faces = [
        [Wp, 0, Lp, Wp, "fw", lv, wv],
        [0, Wp, Wp, Hp, "fa", wv, hv],
        [Wp, Wp, Lp, Hp, "ft", lv, hv],
        [Wp + Lp, Wp, Wp, Hp, "fa", wv, hv],
        [2 * Wp + Lp, Wp, Lp, Hp, "ft", lv, hv],
        [Wp, Wp + Hp, Lp, Wp, "fw", lv, wv],
      ];
      let body = "";
      for (const [x, y, w, h, fill, across, down] of faces) {
        body += Rc(ox + x, oy + y, w, h, `${fill} sb`);
        if (!grid) continue;
        for (const t of cuts(across))
          body += L(ox + x + t * w, oy + y, ox + x + t * w, oy + y + h, "sx");
        for (const t of cuts(down))
          body += L(ox + x, oy + y + t * h, ox + x + w, oy + y + t * h, "sx");
      }
      const marks = [
        [dl, ox + Wp + Lp / 2, oy - 10, "middle", "length"],
        [dw, ox + Wp - 10, oy + Wp / 2 + 5, "end", "width"],
        [dh, ox - 10, oy + Wp + Hp / 2 + 5, "end", "height"],
      ];
      return { body, marks };
    };
    /* ---- triangular prism: oblique solid, or the net that folds into it ------------------------- */
    const triPrism = (s) => {
      const t = s.tri || {};
      const [db, dh, ds, dl] = [dim(t.b), dim(t.h), dim(t.s), dim(s.len)];
      const unit = s.unit ? String(s.unit) : "";
      const bv = db?.v > 0 ? db.v : 6;
      const hv = dh?.v > 0 ? dh.v : 4;
      const lv = dl?.v > 0 ? dl.v : 8;
      const sv = ds?.v > 0 ? ds.v : Math.hypot(bv / 2, hv);
      const printed = [];
      let body = "";
      const label = (dm, x, y, a, name, extra = "") => {
        if (s.labels === false || !dm) return "";
        printed.push(`${name} ${say(dm, unit)}`);
        return T(x, y, `${extra}${say(dm, unit)}`, { a, z: 15, c: "bd hl" });
      };
      if (s.net) {
        const S = Math.min(370 / (2 * sv + bv), 190 / (lv + 2 * hv), 40);
        const [Sp, Bp, Lp, Hp] = [sv * S, bv * S, lv * S, hv * S];
        const ox = (480 - (2 * Sp + Bp)) / 2;
        const oy = 36 + (200 - (Lp + 2 * Hp)) / 2;
        const top = oy + Hp;
        body +=
          Rc(ox, top, Sp, Lp, "fw sb") +
          Rc(ox + Sp, top, Bp, Lp, "ft sb") +
          Rc(ox + Sp + Bp, top, Sp, Lp, "fw sb");
        const mid = ox + Sp + Bp / 2;
        body += Pg(
          [
            [ox + Sp, top],
            [ox + Sp + Bp, top],
            [mid, oy],
          ],
          "fa sb",
        );
        body += Pg(
          [
            [ox + Sp, top + Lp],
            [ox + Sp + Bp, top + Lp],
            [mid, top + Lp + Hp],
          ],
          "fa sb",
        );
        body += L(mid, oy, mid, top, "sd") + square([mid, top], [-1, 0], [0, -1], 8);
        body += label(dh, mid + 6, oy + Hp / 2 + 5, "start", "triangle height");
        body += label(db, mid, top + Lp / 2 + 5, "middle", "base rectangle width");
        body += label(ds, ox + Sp / 2, top + Lp / 2 + 5, "middle", "side rectangle width");
        body += label(dl, ox - 8, top + Lp / 2 + 5, "end", "length");
      } else {
        const top = Math.max(bv, hv, lv);
        const [rb, rh, rl] = [
          clamp(bv / top, 0.1, 1),
          clamp(hv / top, 0.1, 1),
          clamp(lv / top, 0.1, 1),
        ];
        const S = Math.min(300 / (rb + 0.383 * rl), 150 / (rh + 0.321 * rl), 200);
        const [Bp, Hp] = [rb * S, rh * S];
        const [ex, ey] = [0.383 * rl * S, 0.321 * rl * S];
        const ox = (480 - (Bp + ex)) / 2;
        const oy = 42 + (158 - (Hp + ey)) / 2;
        const p = (x, y) => [ox + x, oy + y];
        const [A, B, C] = [p(0, ey + Hp), p(Bp, ey + Hp), p(Bp / 2, ey)];
        const [A2, B2, C2] = [p(ex, Hp), p(Bp + ex, Hp), p(Bp / 2 + ex, 0)];
        const leftSeen = -hv * 0.383 + (bv / 2) * 0.321 > 0; // the left slanted face faces the viewer only for wide, low ends
        body += Pg([B, C, C2, B2], "fa sb");
        if (leftSeen) body += Pg([A, C, C2, A2], "fw sb");
        body += Pg([A, B, C], "ft sb");
        body += L(...A2, ...B2, "sh");
        if (!leftSeen) body += L(...A, ...A2, "sh") + L(...A2, ...C2, "sh");
        const M = [(A[0] + B[0]) / 2, A[1]];
        body += L(...C, ...M, "sd") + square(M, [-1, 0], [0, -1], 8);
        body += tick(A, C) + tick(C, B);
        body += label(db, M[0], M[1] + 24, "middle", "end triangle base");
        body += label(dh, M[0] + 6, (C[1] + M[1]) / 2 + 5, "start", "end triangle height");
        body += label(ds, (A[0] + C[0]) / 2 - 16, (A[1] + C[1]) / 2 - 2, "end", "equal sides");
        body += label(dl, (B[0] + B2[0]) / 2 + 12, (B[1] + B2[1]) / 2 + 8, "start", "length");
      }
      const kind = s.net
        ? "Net of a triangular prism (three rectangles in a row, a triangle above and below the middle one)"
        : "Triangular prism";
      const bare = s.labels === false ? ", no measurements shown" : "";
      const note = s.net
        ? ""
        : " The height is the dashed line at a right angle to the end triangle's base.";
      const title = `${kind}${printed.length ? ` with ${list(printed)}` : bare}.${note}`;
      return { w: 480, h: 264, body, title, alt: title };
    };

    /* ---- pyramid: oblique solid (slant height marked), a cube under it, or the net -------------- */
    const pyramid = (s) => {
      const n = Number(s.n) === 3 ? 3 : 4;
      const [db, dsl, dvh] = [dim(s.base), dim(s.slant), dim(s.vh)];
      const unit = s.unit ? String(s.unit) : "";
      const bv = db?.v > 0 ? db.v : 6;
      const sl = dsl?.v > 0 ? dsl.v : bv;
      const printed = [];
      let body = "";
      const name = n === 3 ? "triangular pyramid" : "square pyramid";
      const label = (dm, x, y, a, what, pre = "") => {
        if (s.labels === false || !dm) return "";
        printed.push(`${what} ${say(dm, unit)}`);
        return T(x, y, `${pre}${say(dm, unit)}`, { a, z: 15, c: "bd hl" });
      };
      if (s.net && Array.isArray(s.sides) && s.sides.length === 3) {
        // a triangular base with the given side lengths, a lateral face on each edge, all with the same slant height
        const [ea, eb, ec] = s.sides.map((v) => (Number(v) > 0 ? Number(v) : 1));
        const px = (eb * eb + ec * ec - ea * ea) / (2 * ec);
        const py = Math.sqrt(Math.max(0.01, eb * eb - px * px));
        const V0 = [0, 0],
          V1 = [ec, 0],
          V2 = [px, -py];
        const ctr = [(V0[0] + V1[0] + V2[0]) / 3, (V0[1] + V1[1] + V2[1]) / 3];
        const tips = [
          [V0, V1],
          [V1, V2],
          [V2, V0],
        ].map(([u, v]) => {
          const mx = (u[0] + v[0]) / 2,
            my = (u[1] + v[1]) / 2;
          const len = Math.hypot(v[0] - u[0], v[1] - u[1]);
          let nx = (v[1] - u[1]) / len,
            ny = -(v[0] - u[0]) / len;
          if ((mx - ctr[0]) * nx + (my - ctr[1]) * ny < 0) [nx, ny] = [-nx, -ny];
          return { u, v, m: [mx, my], tip: [mx + nx * sl, my + ny * sl], n: [nx, ny] };
        });
        const pts = [V0, V1, V2, ...tips.map((q) => q.tip)];
        const [x0, x1] = [Math.min(...pts.map((q) => q[0])), Math.max(...pts.map((q) => q[0]))];
        const [y0, y1] = [Math.min(...pts.map((q) => q[1])), Math.max(...pts.map((q) => q[1]))];
        const S = Math.min(400 / (x1 - x0), 205 / (y1 - y0), 36);
        const q = (pt) => [
          (480 - (x1 - x0) * S) / 2 + (pt[0] - x0) * S,
          40 + (210 - (y1 - y0) * S) / 2 + (pt[1] - y0) * S,
        ];
        body += Pg([q(V0), q(V1), q(V2)], "fw sb");
        for (const t of tips) body += Pg([q(t.u), q(t.v), q(t.tip)], "ft sb");
        const f = tips[0];
        body += L(...q(f.m), ...q(f.tip), "sd") + square(q(f.m), [1, 0], [f.n[0], f.n[1]], 7);
        const names = ["base edge", "base edge", "base edge"];
        tips.forEach((t, i) => {
          const o = q([t.m[0] - t.n[0] * 0.0, t.m[1]]);
          const inside = q([t.m[0] - t.n[0] * 0.35, t.m[1] - t.n[1] * 0.35]);
          body += label(dim(s.sides[i]), inside[0], inside[1] + 4, "middle", names[i]);
          void o;
        });
        body += label(
          dsl,
          q(f.tip)[0] + 8,
          (q(f.m)[1] + q(f.tip)[1]) / 2,
          "start",
          "slant height",
          "slant ",
        );
      } else if (s.net) {
        const baseH = n === 3 ? bv * 0.866 : bv;
        const span = n === 3 ? Math.max(bv + 2 * sl * 0.5, baseH + 2 * sl) : bv + 2 * sl;
        const S = Math.min(
          300 / (n === 3 ? bv + sl : bv + 2 * sl),
          215 / (n === 3 ? baseH + 2 * sl : span),
          36,
        );
        const cx = 240;
        const cy = 40 + 107;
        const q = (x, y) => [cx + x * S, cy + y * S];
        if (n === 4) {
          const h2 = bv / 2;
          body += Rc(...q(-h2, -h2), bv * S, bv * S, "fw sb");
          for (const [a, b, c] of [
            [
              [-h2, -h2],
              [h2, -h2],
              [0, -h2 - sl],
            ],
            [
              [h2, -h2],
              [h2, h2],
              [h2 + sl, 0],
            ],
            [
              [h2, h2],
              [-h2, h2],
              [0, h2 + sl],
            ],
            [
              [-h2, h2],
              [-h2, -h2],
              [-h2 - sl, 0],
            ],
          ])
            body += Pg([q(...a), q(...b), q(...c)], "ft sb");
          body += L(...q(0, -h2), ...q(0, -h2 - sl), "sd") + square(q(0, -h2), [1, 0], [0, -1], 8);
          body += label(db, cx, cy + 5, "middle", "base edge");
          body += label(dsl, cx + 6, cy - (h2 + sl / 2) * S + 5, "start", "slant height", "slant ");
        } else {
          const h = baseH;
          const a = [-bv / 2, h / 3],
            b = [bv / 2, h / 3],
            c = [0, (-2 * h) / 3];
          body += Pg([q(...a), q(...b), q(...c)], "fw sb");
          const out = (u, v) => {
            const mx = (u[0] + v[0]) / 2,
              my = (u[1] + v[1]) / 2;
            const dx = v[0] - u[0],
              dy = v[1] - u[1];
            const len = Math.hypot(dx, dy);
            let nx = dy / len,
              ny = -dx / len;
            if (mx * nx + (my - 0) * ny < 0) [nx, ny] = [-nx, -ny];
            return [
              [mx, my],
              [mx + nx * sl, my + ny * sl],
            ];
          };
          for (const [u, v] of [
            [a, b],
            [b, c],
            [c, a],
          ]) {
            const [m, tip] = out(u, v);
            body += Pg([q(...u), q(...v), q(...tip)], "ft sb");
            void m;
          }
          const [m0, t0] = out(a, b);
          body += L(...q(...m0), ...q(...t0), "sd");
          body += label(db, cx, cy + 4, "middle", "base edge");
          body += label(dsl, cx + 8, cy + (h / 3 + sl / 2) * S, "start", "slant height", "slant ");
        }
      } else {
        const hr = Math.sqrt(Math.max(0.01, sl * sl - (bv * (n === 3 ? 0.289 : 0.5)) ** 2));
        const cube = !!s.cube;
        const depth = n === 3 ? 1.3 : 1;
        const S = Math.min(
          300 / (bv + 0.383 * bv * depth),
          (150 - (cube ? 0 : 0)) / (hr + 0.321 * bv * depth + (cube ? bv : 0)),
          40,
        );
        const [Bp, Hp] = [bv * S, hr * S];
        const [ex, ey] = [0.383 * bv * depth * S, 0.321 * bv * depth * S];
        const Cp = cube ? bv * S : 0;
        const ox = (480 - (Bp + ex)) / 2;
        const oy = 40 + (172 - (Hp + ey + Cp)) / 2 + Math.max(0, Hp - ey / 2) * 0;
        const topPad = Math.max(0, Hp - ey / 2);
        const p = (x, y) => [ox + x, oy + topPad + y];
        const base =
          n === 3
            ? [
                [0, ey],
                [Bp, ey],
                [Bp / 2 + ex, 0],
              ]
            : [
                [0, ey],
                [Bp, ey],
                [Bp + ex, 0],
                [ex, 0],
              ];
        const cen = [
          base.reduce((t, v) => t + v[0], 0) / base.length,
          base.reduce((t, v) => t + v[1], 0) / base.length,
        ];
        const apex = [cen[0], cen[1] - Hp];
        if (cube) {
          body += Pg(
            [
              p(...base[0]),
              p(...base[1]),
              p(base[1][0], base[1][1] + Cp),
              p(base[0][0], base[0][1] + Cp),
            ],
            "ft sb",
          );
          body += Pg(
            [
              p(...base[1]),
              p(...base[2]),
              p(base[2][0], base[2][1] + Cp),
              p(base[1][0], base[1][1] + Cp),
            ],
            "fa sb",
          );
          if (n === 4)
            body += Pg(
              base.map((v) => p(...v)),
              "fw sb",
            );
        }
        // lateral faces: a face is seen when its projected winding matches the front face's
        const faces = base.map((v, i) => [v, base[(i + 1) % base.length], apex]);
        const area = ([a, b, c]) => (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]);
        const front = Math.sign(area(faces[0]));
        const seen = faces.map((f) => Math.sign(area(f)) === front);
        faces.forEach((f, i) => {
          if (seen[i])
            body += Pg(
              f.map((v) => p(...v)),
              i === 0 ? "ft sb" : "fa sb",
            );
        });
        const hiddenCorners = base.filter(
          (_, i) => !seen[i] && !seen[(i + base.length - 1) % base.length],
        );
        for (const v of hiddenCorners) body += L(...p(...v), ...p(...apex), "sh");
        const M = [(base[0][0] + base[1][0]) / 2, base[0][1]];
        const dx = apex[0] - M[0],
          dy = apex[1] - M[1];
        const len = Math.hypot(dx, dy) || 1;
        body +=
          L(...p(...M), ...p(...apex), "sd") + square(p(...M), [1, 0], [dx / len, dy / len], 8);
        if (dvh && dvh.v != null) {
          body += L(...p(...cen), ...p(...apex), "sx");
          body += label(
            dvh,
            p(...cen)[0] - 8,
            (p(...cen)[1] + p(...apex)[1]) / 2,
            "end",
            "vertical height",
            "height ",
          );
        }
        body += label(db, p(...M)[0], p(...M)[1] + (cube ? Cp : 0) + 24, "middle", "base edge");
        body += label(
          dsl,
          (p(...M)[0] + p(...apex)[0]) / 2 + 10,
          (p(...M)[1] + p(...apex)[1]) / 2 + 6,
          "start",
          "slant height",
          "slant ",
        );
      }
      const kind = s.net
        ? `Net of a ${name}`
        : `${s.cube ? "Cube with a " : ""}${name[0].toUpperCase()}${name.slice(1)}`;
      const bare = s.labels === false ? ", no measurements shown" : "";
      const note = s.net
        ? ""
        : " The slant height is the dashed line from the apex to the middle of a base edge, along a face.";
      const title = `${kind}${printed.length ? ` with ${list(printed)}` : bare}.${note}`;
      return { w: 480, h: 264, body, title, alt: title };
    };
    register("pyramid", pyramid);

    register("prism", (s) => {
      if (s.tri) return triPrism(s);
      const dms = [dim(s.l), dim(s.w), dim(s.h)];
      const unit = s.unit ? String(s.unit) : "";
      const val = dms.map((q) => (q?.v > 0 ? q.v : 3));
      const top = Math.max(...val);
      const rel = val.map((v) => clamp(v / top, 0.28, 1));
      const grid = !!s.cubes;
      const view = (s.net ? netView : obliqueView)(val, rel, grid, dms);
      let body = view.body;
      const printed = [];
      for (const [dm, x, y, a, name] of s.labels === false ? [] : view.marks) {
        if (!dm) continue;
        body += T(x, y, say(dm, unit), { a, z: 16, c: "bd hl" });
        printed.push(`${name} ${say(dm, unit)}`);
      }
      const kind = s.net
        ? "Net of a rectangular prism (six rectangles unfolded flat)"
        : "Rectangular prism";
      const bare = s.labels === false ? ", no measurements shown" : "";
      const cubes = grid ? ", with a unit-cube grid on each face" : "";
      const title = `${kind}${printed.length ? ` with ${list(printed)}` : bare}${cubes}.`;
      return { w: 480, h: 264, body, title, alt: title };
    });
  };
  if (V.kit) boot();
  else (V.pending = V.pending || []).push(boot);
})();

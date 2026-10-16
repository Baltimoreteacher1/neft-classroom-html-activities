/* Atlas Rover — pure mathematics for the Coordinate Quest expedition.
 *
 * No Phaser here: problem generators, answer judges and misconception classifiers only,
 * so they can be tested in Node (window.CQ_MATH). The builders in expedition-missions.js
 * and expedition-grid.js draw the world around these numbers.
 *
 * Every generator takes the engine's seeded rng ({int, pick, shuffle, next}) and a tier.
 * Every judge returns {ok:true} or {ok:false, tag, ...details}. Tags match def.misconceptions.
 */
(function () {
  "use strict";
  const L = (en, es) => ({ en, es });
  const MINUS = "−";

  /* ── Number display ─────────────────────────────────────────────────── */
  /** Decimal display with a true minus sign: −3.5, 2.25, 0. */
  function num(v) {
    if (v === 0) return "0";
    return (v < 0 ? MINUS : "") + String(Math.abs(v));
  }
  /** Fraction display for quarters and halves: −3½, ¾, 2¼. */
  function frac(v) {
    const a = Math.abs(v);
    const w = Math.floor(a + 1e-9);
    const q = Math.round((a - w) * 4);
    const tail = ["", "¼", "½", "¾"][q];
    if (!w && !tail) return "0";
    return (v < 0 ? MINUS : "") + (w ? String(w) : "") + tail;
  }
  /** Show a value in the chosen style ("dec" or "frac"). Integers look the same either way. */
  const show = (v, style) => (style === "frac" ? frac(v) : num(v));
  const pair = (x, y) => `(${num(x)}, ${num(y)})`;
  const same = (a, b) => Math.abs(a - b) < 1e-9;

  /** Parse what the student typed: "", "-", "." → null; "−4.5" → -4.5. */
  function parse(text) {
    const s = String(text).replace(MINUS, "-");
    if (!/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return null;
    return Number(s);
  }
  /** Apply one key to a typed field. Keeps it to a sign, 2 digits, a point and 2 decimals. */
  function typeInto(text, key) {
    if (key === "Backspace") return text.slice(0, -1);
    if (key === "-" || key === MINUS) return text.startsWith("-") ? text.slice(1) : "-" + text;
    const body = text.replace("-", "");
    if (key === ".") return body.includes(".") || body.length >= 2 ? text : text + ".";
    if (!/^[0-9]$/.test(key)) return text;
    const [whole, dec] = body.split(".");
    if (dec === undefined && whole.length >= 2) return text;
    if (dec !== undefined && dec.length >= 2) return text;
    const next = text + key;
    return next.replace(/^(-?)0+(?=\d)/, "$1");
  }
  const display = (text) => String(text).replace("-", MINUS);

  /* ── Chapter 1: elevations on a vertical number line ───────────────────── */
  /**
   * probe/opp — words → a signed elevation (flag A), then its opposite (flag B).
   * tier 1: integers 2..8 on a −9..9 line. tier 2: halves (decimal or fraction) on −6..6.
   */
  function genOpp(rng, tier) {
    const rational = tier >= 2;
    const R = rational ? 6 : 9;
    const step = rational ? 0.5 : 1;
    const mag = rational ? rng.int(1, 5) + 0.5 : rng.int(2, 8);
    const v = rng.pick([-1, 1]) * mag;
    const style = rational ? rng.pick(["dec", "frac"]) : "dec";
    const place = rng.pick(["ridge", "canyon"]);
    return { kind: "opp", v, R, step, style, place };
  }
  function judgeOpp(p, a, b) {
    const t = p.v;
    if (same(a, t) && same(b, -t)) return { ok: true };
    if (!same(a, t)) {
      if (same(a, -t)) return { ok: false, tag: "signWords", flag: "A" };
      if (t < 0 && !Number.isInteger(t) && same(a, t + 1))
        return { ok: false, tag: "halfDirection", flag: "A" };
      return { ok: false, tag: "misread", flag: "A" };
    }
    if (same(b, t)) return { ok: false, tag: "sameNotOpposite", flag: "B" };
    if (-t < 0 && !Number.isInteger(t) && same(b, -t + 1))
      return { ok: false, tag: "halfDirection", flag: "B" };
    return { ok: false, tag: "notOpposite", flag: "B" };
  }

  /**
   * probe/abs — two winch cables from the datum: one up to a ridge tip, one down to a vent.
   * The cable length is the distance from 0: the absolute value. Halves at tier ≥ 2.
   */
  function genAbs(rng, tier) {
    const half = tier >= 2;
    let up;
    let down;
    do {
      up = rng.int(1, 5) + (half && rng.next() < 0.5 ? 0.5 : 0);
      down = rng.int(1, 5) + (half ? 0.5 : 0);
    } while (same(up, down));
    const style = half ? rng.pick(["dec", "frac"]) : "dec";
    return { kind: "abs", ridge: up, vent: -down, R: 6, style };
  }
  /** One cable: entered length vs the site's elevation. */
  function judgeCable(elev, len) {
    if (same(len, Math.abs(elev))) return { ok: true };
    if (len < 0) return { ok: false, tag: "negativeDistance" };
    if (same(len, 0)) return { ok: false, tag: "notDistance" };
    return { ok: false, tag: "notDistance", short: len < Math.abs(elev) };
  }
  function judgeAbs(p, ridgeLen, ventLen) {
    if (same(ridgeLen, Math.abs(p.vent)) && same(ventLen, Math.abs(p.ridge)))
      return { ok: false, tag: "swapSites", cable: 0 };
    const r = judgeCable(p.ridge, ridgeLen);
    if (!r.ok) return { ...r, cable: 0 };
    const v = judgeCable(p.vent, ventLen);
    if (!v.ok) return { ...v, cable: 1 };
    return { ok: true };
  }

  /**
   * descent — order survey stakes from lowest to highest elevation.
   * tier 1: five integers −9..9 with at least three negatives.
   * tier 2: five rationals in quarters (decimal or fraction display), at least three negatives.
   */
  function genOrder(rng, tier) {
    const n = 5;
    let vals;
    do {
      const set = new Set();
      while (set.size < n) {
        let v;
        if (tier >= 2) v = rng.int(-24, 24) / 4;
        else v = rng.int(-9, 9);
        if (v !== 0 || rng.next() < 0.3) set.add(v);
      }
      vals = [...set];
    } while (
      vals.filter((v) => v < 0).length < 3 ||
      vals.filter((v) => v > 0).length < 1 ||
      (tier >= 2 && vals.filter((v) => !Number.isInteger(v)).length < 3)
    );
    const stakes = vals.map((v, i) => ({
      v,
      style: tier >= 2 ? (i % 2 ? "frac" : "dec") : "dec",
    }));
    let start;
    do start = rng.shuffle(stakes);
    while (isAscending(start.map((s) => s.v)));
    return { kind: "order", stakes: start };
  }
  const isAscending = (vals) => vals.every((v, i) => i === 0 || vals[i - 1] < v);
  function judgeOrder(vals) {
    if (isAscending(vals)) return { ok: true };
    if (vals.every((v, i) => i === 0 || vals[i - 1] > v)) return { ok: false, tag: "reversed" };
    const absUp = vals.every((v, i) => i === 0 || Math.abs(vals[i - 1]) < Math.abs(v));
    const i = vals.findIndex((v, k) => k < vals.length - 1 && v > vals[k + 1]);
    if (absUp) return { ok: false, tag: "absOrder", at: i };
    const a = vals[i];
    const b = vals[i + 1];
    if (a < 0 && b < 0) return { ok: false, tag: "negBigger", at: i };
    return { ok: false, tag: "outOfOrder", at: i };
  }

  /* ── Chapters 2–3: the coordinate plane ───────────────────────────────── */
  const QUAD = [null, [1, 1], [-1, 1], [-1, -1], [1, -1]];
  /** A point in quadrant q with |x| ≠ |y| (so a swap or a sign slip always lands elsewhere). */
  function pointIn(rng, q, R, half) {
    let x;
    let y;
    const coord = () => rng.int(1, half ? R - 1 : R) + (half && rng.next() < 0.6 ? 0.5 : 0);
    do {
      x = coord() * QUAD[q][0];
      y = coord() * QUAD[q][1];
    } while (
      same(Math.abs(x), Math.abs(y)) ||
      (half && Number.isInteger(x) && Number.isInteger(y))
    );
    return { x, y };
  }
  /**
   * nav — the rover drives exactly where the ordered pairs say.
   *   plot   pairs are given; place a beacon at each (tier 3: halves)
   *   read   beacons are on the map; type each pair into the rover's program
   *   mirror a path is given; place its reflection across the named axis
   */
  function genNav(rng, tier, variant) {
    const R = 6;
    const half = tier >= 3 && variant !== "mirror";
    const step = half ? 0.5 : 1;
    if (variant === "mirror") {
      const k = tier >= 3 ? 3 : 2;
      const axis = rng.pick(["x", "y"]);
      const quads = rng.shuffle([1, 2, 3, 4]).slice(0, k);
      const src = quads.map((q) => pointIn(rng, q, R, false));
      const targets = src.map((p) => (axis === "x" ? { x: p.x, y: -p.y } : { x: -p.x, y: p.y }));
      return { kind: "nav", variant, R, step, axis, src, targets };
    }
    const k = variant === "read" ? 2 : 3;
    const quads = rng.shuffle([2, 3, 4]).slice(0, k - 1);
    quads.push(rng.pick([1, 2, 3, 4].filter((q) => !quads.includes(q))));
    const targets = rng.shuffle(quads).map((q) => pointIn(rng, q, R, half));
    return { kind: "nav", variant, R, step, targets };
  }
  /** Judge one placed/typed point. src = the original point for a reflection. */
  function judgePoint(t, s, opts = {}) {
    if (same(s.x, t.x) && same(s.y, t.y)) return { ok: true };
    const src = opts.src;
    if (src) {
      if (same(s.x, src.x) && same(s.y, src.y)) return { ok: false, tag: "notMoved" };
      if (same(s.x, -src.x) && same(s.y, -src.y)) return { ok: false, tag: "bothSigns" };
      const other = opts.axis === "x" ? { x: -src.x, y: src.y } : { x: src.x, y: -src.y };
      if (same(s.x, other.x) && same(s.y, other.y)) return { ok: false, tag: "wrongAxis" };
    }
    if (same(s.x, t.y) && same(s.y, t.x)) return { ok: false, tag: "swapXY" };
    if (same(s.x, -t.x) && same(s.y, t.y)) return { ok: false, tag: "signX" };
    if (same(s.x, t.x) && same(s.y, -t.y)) return { ok: false, tag: "signY" };
    if (same(s.x, -t.x) && same(s.y, -t.y)) return { ok: false, tag: "bothSigns" };
    if (Math.abs(s.x - t.x) + Math.abs(s.y - t.y) <= (opts.step || 1) + 1e-9)
      return { ok: false, tag: "offByOne" };
    return { ok: false, tag: "misplot" };
  }
  /** Judge a whole route: first wrong point decides. pts are the student's points. */
  function judgeRoute(p, pts) {
    for (let i = 0; i < p.targets.length; i++) {
      const r = judgePoint(p.targets[i], pts[i], {
        src: p.src && p.src[i],
        axis: p.axis,
        step: p.step,
      });
      if (!r.ok) return { ...r, at: i };
    }
    return { ok: true };
  }

  /**
   * survey — battery charge for each leg = the distance between two points that share
   * a coordinate. Same side of an axis: subtract; opposite sides: add the distances to 0.
   *   legs   a 2-leg route, one leg crosses an axis and one does not (tier 1: neither crosses)
   *   relay  a rectangle of relay towers: type the missing corner D, then two side lengths
   */
  function genSurvey(rng, tier, variant) {
    const R = 6;
    const nz = (lo, hi) => {
      let v;
      do v = rng.int(lo, hi);
      while (v === 0);
      return v;
    };
    if (variant === "relay") {
      let x1;
      let x2;
      let y1;
      let y2;
      do {
        x1 = nz(-R, -1);
        x2 = nz(1, R);
        y1 = nz(-R, R);
        y2 = nz(-R, R);
      } while (
        y2 - y1 < 3 ||
        x2 - x1 < 3 ||
        same(Math.abs(x1), Math.abs(x2)) ||
        same(Math.abs(y1), Math.abs(y2)) ||
        same(Math.abs(x1), Math.abs(y1)) ||
        (tier >= 2 && y1 * y2 > 0)
      );
      // A top-left, B top-right, C bottom-right, D bottom-left (missing).
      const A = { x: x1, y: y2 };
      const B = { x: x2, y: y2 };
      const C = { x: x2, y: y1 };
      const D = { x: x1, y: y1 };
      return {
        kind: "survey",
        variant,
        R,
        A,
        B,
        C,
        D,
        width: x2 - x1,
        height: y2 - y1,
        legs: [
          { from: A, to: B, axis: "x" },
          { from: B, to: C, axis: "y" },
        ],
      };
    }
    // legs: start point, then 2 legs alternating direction.
    for (;;) {
      const crossPlan = tier >= 2 ? rng.shuffle([true, false]) : [false, false];
      const start = { x: nz(-R + 1, R - 1), y: nz(-R + 1, R - 1) };
      const firstAxis = rng.pick(["x", "y"]);
      const pts = [start];
      const legs = [];
      let ok = true;
      crossPlan.forEach((cross, i) => {
        const axis = i % 2 === 0 ? firstAxis : firstAxis === "x" ? "y" : "x";
        const from = pts[pts.length - 1];
        const a = from[axis];
        const options = [];
        for (let b = -R; b <= R; b++) {
          if (b === 0 || b === a) continue;
          if (cross !== a * b < 0) continue;
          if (Math.abs(a - b) < 2) continue;
          if (same(Math.abs(a), Math.abs(b))) continue;
          options.push(b);
        }
        if (!options.length) {
          ok = false;
          return;
        }
        const b = rng.pick(options);
        const to = { ...from, [axis]: b };
        pts.push(to);
        legs.push({ from, to, axis });
      });
      const key = (p) => p.x + "," + p.y;
      if (ok && new Set(pts.map(key)).size === pts.length)
        return { kind: "survey", variant: "legs", R, pts, legs };
    }
  }
  const legInfo = (leg) => {
    const a = leg.from[leg.axis];
    const b = leg.to[leg.axis];
    return { a, b, d: Math.abs(a - b), cross: a * b < 0 };
  };
  function judgeLeg(leg, val) {
    const { a, b, d, cross } = legInfo(leg);
    if (same(val, d)) return { ok: true };
    if (val < 0) return { ok: false, tag: "negativeDistance" };
    if (cross && same(val, Math.abs(Math.abs(a) - Math.abs(b))))
      return { ok: false, tag: "absDiff" };
    if (!cross && same(val, Math.abs(a) + Math.abs(b))) return { ok: false, tag: "addAbs" };
    if (same(val, d + 1)) return { ok: false, tag: "countPoints" };
    if (same(val, Math.abs(a)) || same(val, Math.abs(b)))
      return { ok: false, tag: "oneCoordinate" };
    return { ok: false, tag: "distance", short: val < d };
  }
  /** vals: legs → [charge per leg]; relay → [Dx, Dy, width, height]. */
  function judgeSurvey(p, vals) {
    let k = 0;
    if (p.variant === "relay") {
      const r = judgePoint(p.D, { x: vals[0], y: vals[1] });
      if (!r.ok)
        return {
          ...r,
          tag: r.tag === "misplot" || r.tag === "offByOne" ? "notRectangle" : r.tag,
          part: "vertex",
        };
      k = 2;
    }
    for (let i = 0; i < p.legs.length; i++) {
      const r = judgeLeg(p.legs[i], vals[k + i]);
      if (!r.ok) return { ...r, part: "leg", at: i };
    }
    return { ok: true };
  }

  window.CQ_MATH = {
    L,
    MINUS,
    num,
    frac,
    show,
    pair,
    same,
    parse,
    typeInto,
    display,
    genOpp,
    judgeOpp,
    genAbs,
    judgeAbs,
    judgeCable,
    genOrder,
    judgeOrder,
    isAscending,
    genNav,
    judgePoint,
    judgeRoute,
    genSurvey,
    judgeSurvey,
    judgeLeg,
    legInfo,
  };
})();

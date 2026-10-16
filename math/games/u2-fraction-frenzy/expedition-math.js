/* Reef Rescue — pure mathematics for the Fraction Frenzy expedition.
 *
 * No Phaser, no DOM: exact rational arithmetic, the seeded problem generators for
 * every builder, and the misconception classifier. The builders (expedition-missions.js,
 * expedition-flow.js) draw what these numbers do; a Node check can load this file alone.
 *
 *   frames   whole/mixed ÷ fraction — how many coral frames fit along a reef wall
 *   beds     fraction/mixed ÷ whole — share kelp feed equally among nursery beds
 *   scoops   mixed ÷ fraction — pour nutrient scoops (and part of one) into a tank
 *   rescue   two-step problem — find the amount first, then divide it
 */
(function (root) {
  "use strict";

  /* ── Exact fractions {n, d}, always reduced, d > 0 ─────────────────────── */
  const gcd = (a, b) => {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) [a, b] = [b, a % b];
    return a || 1;
  };
  const lcm = (a, b) => (a / gcd(a, b)) * b;
  function F(n, d = 1) {
    if (d === 0) throw new Error("zero denominator");
    if (d < 0) {
      n = -n;
      d = -d;
    }
    const g = gcd(n, d);
    return { n: n / g, d: d / g };
  }
  const add = (a, b) => F(a.n * b.d + b.n * a.d, a.d * b.d);
  const sub = (a, b) => F(a.n * b.d - b.n * a.d, a.d * b.d);
  const mul = (a, b) => F(a.n * b.n, a.d * b.d);
  const div = (a, b) => F(a.n * b.d, a.d * b.n);
  const eq = (a, b) => !!a && !!b && a.n * b.d === b.n * a.d;
  const cmp = (a, b) => a.n * b.d - b.n * a.d;
  const val = (a) => a.n / a.d;
  const isInt = (a) => a.d === 1;
  const floor = (a) => Math.floor(a.n / a.d);
  const ceil = (a) => Math.ceil(a.n / a.d);
  const fracPart = (a) => sub(a, F(floor(a)));
  const mixed = (w, n, d) => F(w * d + n, d);
  /** "5", "3/4", "2 1/2" (mixed form). */
  function fmt(a) {
    if (a.d === 1) return String(a.n);
    const w = Math.floor(a.n / a.d);
    const r = a.n - w * a.d;
    return w ? `${w} ${r}/${a.d}` : `${r}/${a.d}`;
  }
  /** Improper form: "7/2", "5". */
  const fmtImp = (a) => (a.d === 1 ? String(a.n) : `${a.n}/${a.d}`);
  const isMixed = (a) => a.d !== 1 && a.n > a.d;

  /* ── Misconception candidates ──────────────────────────────────────────── */
  /** Wrong quotients students build for x ÷ y (y a fraction or mixed number). */
  function divCandidates(x, y) {
    const q = div(x, y);
    const list = [
      { tag: "multiply", v: mul(x, y) },
      { tag: "inverted", v: div(y, x) },
      { tag: "invertBoth", v: F(x.d * y.d, x.n * y.n) },
    ];
    if (isMixed(x)) {
      const xw = F(floor(x));
      const xf = fracPart(x);
      if (isMixed(y))
        list.push({ tag: "mixedSplit", v: add(div(xw, F(floor(y))), div(xf, fracPart(y))) });
      else list.push({ tag: "mixedSplit", v: add(div(xw, y), xf) });
      list.push({ tag: "mixedSplit", v: div(xw, y) }); // divided only the whole part
    }
    if (!isInt(q)) {
      const w = floor(q);
      list.push({ tag: "remainderUnit", v: add(F(w), sub(x, mul(F(w), y))) });
      list.push({ tag: "remainderDropped", v: F(w) });
    }
    return { q, list };
  }
  /** Wrong shares for F ÷ n (n a whole number of beds). */
  function shareCandidates(f, n) {
    const N = F(n);
    const list = [
      { tag: "multiply", v: mul(f, N) },
      { tag: "inverted", v: div(N, f) },
      { tag: "noDivide", v: f },
    ];
    if (isMixed(f)) {
      const fw = F(floor(f));
      const ff = fracPart(f);
      list.push({ tag: "mixedSplit", v: add(div(fw, N), ff) });
      list.push({ tag: "mixedSplit", v: add(fw, div(ff, N)) });
    }
    return { q: div(f, N), list };
  }
  /** First matching tag, or null. */
  function classify(list, v) {
    const hit = list.find((c) => eq(c.v, v));
    return hit ? hit.tag : null;
  }
  /** Every candidate differs from the answer and from each other (clean diagnosis). */
  function distinct(q, list) {
    for (let i = 0; i < list.length; i++) {
      if (list[i].v.n <= 0 || eq(list[i].v, q)) return false;
      for (let j = 0; j < i; j++) if (eq(list[i].v, list[j].v)) return false;
    }
    return true;
  }
  const properOver = (b) => {
    const out = [];
    for (let a = 1; a < b; a++) if (gcd(a, b) === 1) out.push(a);
    return out;
  };

  /* ── Mixed-number entry (whole, numerator, denominator boxes) ──────────── */
  /** Entry strings → {v} | {empty} | {bad:'den'|'part'}. Whole 0..99, n/d 0..99. */
  function readEntry(w, n, d) {
    if (w === "" && n === "" && d === "") return { empty: true };
    if ((n === "") !== (d === "")) return { bad: "part" };
    const W = w === "" ? 0 : Number(w);
    if (n === "") return { v: F(W) };
    if (Number(d) === 0) return { bad: "den" };
    return { v: mixed(W, Number(n), Number(d)) };
  }
  /** Can the 2-digit entry show this value (as mixed or improper)? */
  const entryReach = (v) => v.n >= 0 && floor(v) <= 99 && v.d <= 99;
  /** Entry strings that type exactly this value in mixed form. */
  function entryFor(v) {
    const w = floor(v);
    const r = sub(v, F(w));
    return r.n === 0
      ? { w: String(w), n: "", d: "" }
      : { w: w ? String(w) : "", n: String(r.n), d: String(r.d) };
  }

  /* ── frames: how many a/b-m coral frames fit along a D-m reef wall ─────── */
  function genFrames(r, tier) {
    for (let guard = 0; guard < 4000; guard++) {
      let x;
      let y;
      if (tier <= 1) {
        // Whole ÷ fraction, whole quotient. Unit fractions most of the time (lesson 6-1).
        const b = r.pick([2, 3, 4, 5, 6, 8]);
        const a = r.next() < 0.65 ? 1 : r.pick(properOver(b));
        x = F(a * r.int(1, 4));
        y = F(a, b);
      } else if (tier === 2) {
        // Whole ÷ non-unit fraction with a leftover (lesson 6-9).
        const b = r.pick([3, 4, 5, 6, 8]);
        const a = r.pick(properOver(b).filter((k) => k > 1));
        if (!a) continue;
        x = F(r.int(2, 8));
        y = F(a, b);
      } else {
        // Mixed ÷ fraction or mixed number (lesson 6-10).
        const b = r.pick([2, 3, 4, 6, 8]);
        const a = r.int(1, 2 * b - 1);
        if (a === b) continue;
        const db = r.pick([2, 3, 4, 8].filter((k) => b % k === 0 || k === b));
        if (!db) continue;
        x = F(r.int(db + 1, db * 7), db);
        y = F(a, b);
        if (!isMixed(x)) continue;
      }
      const { q, list } = divCandidates(x, y);
      if (val(x) > 8 || val(q) < 2 || val(q) > 12) continue;
      if (tier <= 1 && !isInt(q)) continue;
      if (tier === 2 && isInt(q)) continue;
      if (lcm(x.d, y.d) * Math.ceil(val(x)) > 72) continue; // ticks stay ≥ 9 px apart
      if (!distinct(q, list) || !list.every((c) => entryReach(c.v))) continue;
      return { x, y, q, list, tick: lcm(x.d, y.d) };
    }
    throw new Error("genFrames: no problem");
  }

  /* ── beds: share F kg of kelp feed equally among n nursery beds ────────── */
  const DIAL_MAX = 60;
  function genBeds(r, tier) {
    for (let guard = 0; guard < 4000; guard++) {
      let f;
      const n = r.int(2, tier >= 2 ? 6 : 4);
      if (tier <= 1) {
        const b = r.int(2, 6);
        f = F(r.pick(properOver(b)), b);
      } else if (tier === 2) {
        if (r.next() < 0.35) f = F(r.int(1, n - 1));
        else {
          const b = r.int(3, 8);
          f = F(r.int(2, b - 1), b);
        }
      } else {
        const b = r.pick([2, 3, 4, 5]);
        f = mixed(r.int(1, 3), r.pick(properOver(b)), b);
      }
      const { q, list } = shareCandidates(f, n);
      if (f.d === 1 && f.n === 1) continue;
      if (q.n > DIAL_MAX || q.d > (tier >= 3 ? 40 : 30)) continue;
      if (val(f) * 4 > 15 && tier < 3) continue;
      if (!distinct(q, list)) continue;
      if (!list.every((c) => c.v.n <= DIAL_MAX && c.v.d <= DIAL_MAX)) continue;
      return { f, n, q, list, piece: f.d };
    }
    throw new Error("genBeds: no problem");
  }

  /* ── scoops: pour s-cup scoops (and part of one) into a C-cup tank ────── */
  const SCOOP_MAX = 12;
  function genScoops(r, tier) {
    for (let guard = 0; guard < 4000; guard++) {
      let s;
      let c;
      if (tier <= 1) {
        const b = r.int(2, 4);
        s = F(1, b);
        c = F(r.int(b + 1, b * 4), b);
      } else if (tier === 2) {
        const b = r.pick([3, 4, 5, 6, 8]);
        const a = r.pick(properOver(b).filter((k) => k > 1));
        if (!a) continue;
        s = F(a, b);
        c = F(a * r.int(2, 9), b);
      } else {
        const b = r.pick([2, 3, 4, 6]);
        const a = r.pick([...properOver(b).filter((k) => k > 1), b + 1, b + Math.floor(b / 2)]);
        if (!a || a === b || a > 2 * b) continue;
        s = F(a, b);
        c = F(r.int(b + 1, b * 9), b);
      }
      if (!isMixed(c)) continue;
      const q = div(c, s);
      const { list } = divCandidates(c, s);
      list.push({ tag: "roundedUp", v: F(ceil(q)) });
      const a = s.n; // a scoop holds a pieces of 1/s.d cup
      if (val(q) < 2 || floor(q) > (tier <= 2 ? 10 : 9) || val(c) > 9) continue;
      if (tier <= 2 && !isInt(q)) continue;
      if (tier >= 3 && isInt(q)) continue;
      if ((q.n * a) % q.d !== 0) continue; // last scoop = whole pieces
      if (!distinct(q, isInt(q) ? list.filter((x) => x.tag !== "roundedUp") : list)) continue;
      return {
        c,
        s,
        q,
        list: isInt(q) ? list.filter((x) => x.tag !== "roundedUp") : list,
        pieces: a,
      };
    }
    throw new Error("genScoops: no problem");
  }
  /** Scoops built (whole w, k pieces of a) → value in scoops. */
  const scoopValue = (w, k, a) => F(w * a + k, a);
  /** Can the pour controls reach v? */
  const scoopReach = (v, a) => (v.n * a) % v.d === 0 && v.n >= 0 && floor(v) <= SCOOP_MAX;

  /* ── rescue: a two-step reef problem (find the amount, then divide) ────── */
  function genRescue(r, tier) {
    for (let guard = 0; guard < 6000; guard++) {
      const kind = r.pick(["trench", "ledges"]);
      const b = r.pick([2, 3, 4, 6, 8]);
      const a = tier >= 3 ? r.int(1, 2 * b - 1) : r.pick(properOver(b));
      if (a === b) continue;
      const m = F(a, b);
      let first; // the true first-step amount
      let total;
      let part;
      let wrongFirst;
      let skipped;
      if (kind === "trench") {
        total = tier >= 3 ? F(r.int(9, 20), 2) : F(r.int(4, 10));
        const pb = r.pick([2, 4, b].filter((k) => k <= 8));
        part = F(r.int(1, pb * 3), pb);
        if (cmp(part, total) >= 0 || isInt(part)) continue;
        first = sub(total, part);
        wrongFirst = add(total, part);
        skipped = div(total, m);
      } else {
        const pa = r.pick([2, 4, b].filter((k) => k <= 8));
        total = F(r.int(pa + 1, pa * 5), pa); // ledge A
        part = F(r.int(2, 4 * b), b); // ledge B
        if (!isMixed(total) || isInt(part)) continue;
        first = add(total, part);
        wrongFirst = cmp(total, part) > 0 ? sub(total, part) : sub(part, total);
        skipped = div(total, m);
      }
      if (val(first) > 10 || val(first) < 1) continue;
      const { q, list } = divCandidates(first, m);
      if (val(q) < 2 || val(q) > 12) continue;
      if (tier <= 2 && !isInt(q)) continue;
      if (eq(skipped, q) || list.some((c) => eq(c.v, skipped))) continue;
      list.push({ tag: "skippedStep", v: skipped });
      if (!distinct(q, list) || !list.every((c) => entryReach(c.v))) continue;
      if (eq(wrongFirst, first) || wrongFirst.n <= 0) continue;
      if (Math.max(val(total) + (kind === "ledges" ? val(part) : 0), val(first)) > 10) continue;
      return {
        kind,
        total,
        part,
        m,
        first,
        wrongFirst,
        q,
        list,
        tick: lcm(lcm(total.d, part.d), m.d),
      };
    }
    throw new Error("genRescue: no problem");
  }

  root.FF_MATH = {
    F,
    add,
    sub,
    mul,
    div,
    eq,
    cmp,
    val,
    isInt,
    isMixed,
    floor,
    ceil,
    fracPart,
    mixed,
    fmt,
    fmtImp,
    gcd,
    lcm,
    divCandidates,
    shareCandidates,
    classify,
    readEntry,
    entryReach,
    entryFor,
    genFrames,
    genBeds,
    genScoops,
    genRescue,
    scoopValue,
    scoopReach,
    DIAL_MAX,
    SCOOP_MAX,
  };
})(typeof window !== "undefined" ? window : globalThis);

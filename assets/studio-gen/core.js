/**
 * Practice Studio generator core (window.StudioGen).
 *
 * A generator is a small function that, given a seeded random stream and a level (1-4), returns ONE
 * studio item whose answer is COMPUTED, never typed. The studios call StudioGen.make(id, level, seed) so a
 * student can press "New numbers" and get a fresh problem on the same skill, and the same seed always
 * returns the same problem (progress saves a seed, not a question).
 *
 * Contract (docs/specs/practice-studio-v2.md):
 *   StudioGen.register(id, { title, titleEs, levels: 4, make(rng, level) -> item, check(item) -> true | string })
 *   item.meta carries the raw numbers; check() recomputes the answer from meta by a DIFFERENT route than
 *   make() used, and tools/studio-gen.test.mjs fails any generator whose check disagrees.
 *
 * Loaded as a plain <script> in the browser and through node:vm in tests, so it touches only `window`.
 */
(() => {
  const W = /** @type {any} */ (window);
  const G = (W.StudioGen = W.StudioGen || {});
  G.registry = G.registry || {};

  /* ---- seeded random stream ------------------------------------------------------------------- */
  function hashSeed(/** @type {string} */ s) {
    let h = 1779033703 ^ s.length;
    for (let i = 0; i < s.length; i++) {
      h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return () => {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      return (h ^= h >>> 16) >>> 0;
    };
  }
  /** mulberry32 over a string seed. */
  G.rng = (/** @type {string|number} */ seed) => {
    let a = hashSeed(String(seed))();
    const next = () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    return {
      next,
      /** integer in [lo, hi], inclusive */
      int: (/** @type {number} */ lo, /** @type {number} */ hi) =>
        lo + Math.floor(next() * (hi - lo + 1)),
      pick: (/** @type {any[]} */ arr) => arr[Math.floor(next() * arr.length)],
      chance: (/** @type {number} */ p) => next() < p,
      shuffle(/** @type {any[]} */ arr) {
        const out = arr.slice();
        for (let i = out.length - 1; i > 0; i--) {
          const j = Math.floor(next() * (i + 1));
          [out[i], out[j]] = [out[j], out[i]];
        }
        return out;
      },
      /** n distinct integers from [lo, hi] */
      distinct(/** @type {number} */ n, /** @type {number} */ lo, /** @type {number} */ hi) {
        const pool = [];
        for (let v = lo; v <= hi; v++) pool.push(v);
        return this.shuffle(pool).slice(0, n);
      },
    };
  };

  /* ---- number helpers every generator shares -------------------------------------------------- */
  /** Strip float noise: fmt(0.1+0.2) === "0.3". Never returns "-0". */
  G.fmt = (/** @type {number} */ n, /** @type {number} */ dp = 6) => {
    const r = Math.round(n * 10 ** dp) / 10 ** dp;
    return String(Object.is(r, -0) ? 0 : r);
  };
  /** Format with thousands separators for display ("12,500"); answers stay plain. */
  G.commas = (/** @type {number} */ n) => G.fmt(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  G.gcd = (/** @type {number} */ a, /** @type {number} */ b) => (b ? G.gcd(b, a % b) : Math.abs(a));
  G.lcm = (/** @type {number} */ a, /** @type {number} */ b) => Math.abs(a * b) / G.gcd(a, b);
  /** "3/4" in lowest terms; whole numbers print bare. */
  G.frac = (/** @type {number} */ n, /** @type {number} */ d) => {
    const g = G.gcd(n, d) || 1;
    const nn = n / g,
      dd = d / g;
    return dd === 1 ? String(nn) : `${nn}/${dd}`;
  };
  /** "2 1/3" for improper n/d. */
  G.mixed = (/** @type {number} */ n, /** @type {number} */ d) => {
    const g = G.gcd(n, d) || 1;
    const nn = n / g,
      dd = d / g;
    if (dd === 1) return String(nn);
    const w = Math.floor(nn / dd);
    return w ? `${w} ${nn - w * dd}/${dd}` : `${nn}/${dd}`;
  };
  /** Numeric value of "3", "-2.5", "3/4", "2 1/3". NaN if not a number. */
  G.value = (/** @type {string|number} */ raw) => {
    const t = String(raw)
      .trim()
      .replace(/[$,%\s]+$/g, "")
      .replace(/^\$/, "")
      .replace(/,/g, "")
      .replace(/−/g, "-");
    let m = t.match(/^(-?)(\d+)\s+(\d+)\/(\d+)$/);
    if (m) return (m[1] ? -1 : 1) * (Number(m[2]) + Number(m[3]) / Number(m[4]));
    m = t.match(/^(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/);
    if (m && Number(m[2])) return Number(m[1]) / Number(m[2]);
    return /^-?(\d+\.?\d*|\.\d+)$/.test(t) ? Number(t) : Number.NaN;
  };

  /* ---- item builders -------------------------------------------------------------------------- */
  /**
   * Multiple choice with a computed right answer and named wrong answers.
   *   right  { v: "12", }                                  the correct choice text
   *   wrong  [{ v: "8", f: "why this is wrong", fEs? }]    candidate distractors, best first; duplicates of
   *                                                        the right answer or each other are dropped
   *   choices  total shown (default 4)
   */
  G.mc = (/** @type {any} */ rng, /** @type {any} */ o) => {
    const rightText = String(o.right.v ?? o.right);
    const seen = new Set([rightText.trim().toLowerCase()]);
    const picks = [];
    for (const w of o.wrong || []) {
      const t = String(w.v).trim().toLowerCase();
      if (!t || seen.has(t)) continue;
      seen.add(t);
      picks.push(w);
      if (picks.length === (o.choices || 4) - 1) break;
    }
    if (picks.length < 1) throw new Error(`mc: no distinct wrong answers for "${o.q}"`);
    const all = rng.shuffle([{ v: rightText, ok: true }, ...picks]);
    const item = {
      k: "mc",
      q: o.q,
      qEs: o.qEs,
      c: all.map((x) => String(x.v)),
      a: all.findIndex((x) => x.ok),
      f: all.map((x) =>
        x.ok ? "" : x.f || "Check each step against the question, then try another choice.",
      ),
      fEs: all.some((x) => x.fEs) ? all.map((x) => x.fEs || "") : undefined,
      x: o.x || "",
      xEs: o.xEs,
      h: o.h,
      hEs: o.hEs,
      viz: o.viz,
      meta: o.meta,
    };
    return item;
  };

  /**
   * Typed-answer item. The right value is compared by value ("1/2" = 0.5), so formatting never costs a point.
   *   a      the right answer as a string ("12", "3/4", "-5")
   *   unit   shown after the box ("cm²")
   *   fw     [{ v: "8", f: "why that value is wrong", fEs? }] specific feedback for common wrong values
   *   tol    absolute tolerance (default 0.005)
   */
  G.num = (/** @type {any} */ o) => ({
    k: "num",
    q: o.q,
    qEs: o.qEs,
    a: String(o.a),
    unit: o.unit,
    tol: o.tol,
    fw: o.fw,
    x: o.x || "",
    xEs: o.xEs,
    h: o.h,
    hEs: o.hEs,
    viz: o.viz,
    meta: o.meta,
  });

  /* ---- registry ------------------------------------------------------------------------------- */
  G.register = (/** @type {string} */ id, /** @type {any} */ def) => {
    if (G.registry[id]) throw new Error(`StudioGen: duplicate generator ${id}`);
    if (typeof def.make !== "function" || typeof def.check !== "function")
      throw new Error(`StudioGen: ${id} needs make() and check()`);
    G.registry[id] = { levels: 4, ...def, id };
  };
  G.has = (/** @type {string} */ id) => !!G.registry[id];
  G.ids = () => Object.keys(G.registry).sort();

  /** One fresh problem: same (id, level, seed) -> same problem. */
  G.make = (
    /** @type {string} */ id,
    /** @type {number} */ level,
    /** @type {number|string} */ seed,
  ) => {
    const def = G.registry[id];
    if (!def) throw new Error(`StudioGen: unknown generator "${id}"`);
    const lv = Math.max(1, Math.min(def.levels, Number(level) || 1));
    const rng = G.rng(`${id}|${lv}|${seed}`);
    const item = def.make(rng, lv);
    item.k = item.k || (item.c ? "mc" : "num");
    item.gen = { id, level: lv, seed };
    return item;
  };
  /** Independent recomputation; true when the item's key agrees. */
  G.verify = (/** @type {any} */ item) => G.registry[item.gen.id].check(item);
})();

/**
 * Practice Studio generators for the algebraic-expression lessons (window.StudioGen).
 *
 *   evalExpression   lesson 6-5    evaluate, write-then-evaluate, work backward
 *   equivalentExpr   lesson 6-6    equivalent forms, odd one out, test values and counterexamples
 *   combineLikeTerms lesson 6-8    like terms, constants and subtraction, distribute then combine
 *   distribute       lesson 6-14   expand, area-model language, factor out a GCF, spot the bad distribution
 *   simplifyExpr     lesson 6-15   distribute and combine, simplest form, which expression simplifies to this
 *
 * Contract: docs/specs/practice-studio-v2.md section 4 and assets/studio-gen/core.js. Every item carries q/qEs, a worked
 * explanation x/xEs, a hint ladder h/hEs (the last hint never states the answer), a meta object and an independent
 * check(). Wrong answers are NAMED misconceptions: a multiple-choice item gets tag[] (and cEs[] when a choice has words)
 * aligned with c[]; a typed item lists its common wrong values in fw[] (each with tag and fEs). No feedback line prints
 * the right answer.
 *
 * Notation: products are written 3n, 4(x + 3), n² (never n*2); × only between numbers; ÷; true minus −.
 *
 * Two independent routes. make() builds each problem FORWARD from a term model (coefficient, letter, power): it knows the
 * key because it constructed it. check() never reads that model. It re-reads the DISPLAYED strings with a small
 * expression reader (tokenizer + recursive descent, implicit multiplication, superscripts) and compares values at many
 * test points, so a rendering slip, a wrong distractor that is secretly equivalent, or a corrupted key is caught.
 * The same reader writes the worked steps (a = b = c chains) and the "replace the letter" hints.
 */
(() => {
  const W = /** @type {any} */ (window);
  const G = W.StudioGen;
  if (!G || !G.register)
    throw new Error("studio-gen/algebra.js needs studio-gen/core.js loaded first");

  /* ---- shared vocabulary ------------------------------------------------------------------------------------- */
  // No l or o (they read as 1 and 0), no c (reads as "constant"), no e.
  const LETTERS = ["x", "n", "m", "y", "a", "p", "k", "t", "s", "w", "b", "d", "h", "r"];
  const NAMES = [
    "Maya",
    "Leo",
    "Noor",
    "Dev",
    "Ana",
    "Kai",
    "Zoe",
    "Omar",
    "Lena",
    "Jin",
    "Sam",
    "Rosa",
  ];
  const SUP = /** @type {Record<number, string>} */ ({ 2: "²", 3: "³" });
  const N = (/** @type {number} */ n) => G.fmt(n);
  const wsum = (/** @type {any[]} */ arr, /** @type {(t:any)=>number} */ f) =>
    arr.reduce((s, t) => s + f(t), 0);
  /** weighted choice: pickBy(rng, [["a", 3], ["b", 1]]) */
  const pickBy = (/** @type {any} */ rng, /** @type {[any, number][]} */ table) => {
    const total = wsum(table, (r) => r[1]);
    let r = rng.next() * total;
    for (const [k, w] of table) {
      r -= w;
      if (r < 0) return k;
    }
    return table[table.length - 1][0];
  };
  /** the first n items of a shuffled copy, as distinct letters not in `not` */
  const letters = (
    /** @type {any} */ rng,
    /** @type {number} */ n,
    /** @type {string[]} */ not = [],
  ) => rng.shuffle(LETTERS.filter((l) => !not.includes(l))).slice(0, n);

  /* ---- the term model: used by make() only -------------------------------------------------------------------- */
  // A term is c * v^p; a constant has v = "" and p = 0.
  const T = (/** @type {number} */ c, v = "x", p = 1) => ({ c, v, p });
  const K = (/** @type {number} */ c) => ({ c, v: "", p: 0 });
  const mono = (/** @type {any} */ t) => (t.v ? t.v + (t.p > 1 ? SUP[t.p] : "") : "");
  const tkey = (/** @type {any} */ t) => t.v + t.p;
  const scaleT = (/** @type {number} */ k, /** @type {any} */ t) => ({ ...t, c: k * t.c });

  /** "3x + 5", "x² − 4", "−x + 2"; zero terms vanish; the first term carries a bare minus */
  function show(/** @type {any[]} */ ts) {
    const live = ts.filter((t) => t.c !== 0);
    if (!live.length) return "0";
    return live
      .map((t, i) => {
        const a = Math.abs(t.c);
        const m = mono(t);
        const body = m ? (a === 1 ? "" : N(a)) + m : N(a);
        return i === 0 ? (t.c < 0 ? "−" : "") + body : (t.c < 0 ? " − " : " + ") + body;
      })
      .join("");
  }
  /** combine like terms: higher powers first, constants last */
  function tidy(/** @type {any[]} */ ts) {
    const m = new Map();
    for (const t of ts) {
      const e = m.get(tkey(t));
      if (e) e.c += t.c;
      else m.set(tkey(t), { ...t });
    }
    return [...m.values()]
      .filter((t) => t.c !== 0)
      .sort((a, b) => b.p - a.p || a.v.localeCompare(b.v));
  }

  /** An expression with groups: parts = [{ts}, {k, ts}, ...]; a part with k means k(ts). */
  const showParts = (/** @type {any[]} */ parts) =>
    parts
      .map((p, i) => {
        const s = p.k == null ? show(p.ts) : `${N(p.k)}(${show(p.ts)})`;
        if (i === 0) return s;
        return s.startsWith("−") ? ` − ${s.slice(1)}` : ` + ${s}`;
      })
      .join("");

  /**
   * Distribute k over ts, correctly ("ok") or with a named slip:
   *   first   only the first term is multiplied          last    only the last term is multiplied
   *   added   k is ADDED to the later terms              nosign  the minus signs inside are lost
   */
  function expandGroup(
    /** @type {number} */ k,
    /** @type {any[]} */ ts,
    /** @type {string} */ mode,
  ) {
    return ts.map((t, i) => {
      if (mode === "first") return i === 0 ? scaleT(k, t) : t;
      if (mode === "last") return i === ts.length - 1 ? scaleT(k, t) : t;
      if (mode === "nosign") return scaleT(k, { ...t, c: Math.abs(t.c) });
      if (mode === "added") return i === 0 ? scaleT(k, t) : { ...t, c: t.c + (t.c < 0 ? -k : k) };
      return scaleT(k, t);
    });
  }
  const expandParts = (/** @type {any[]} */ parts, mode = "ok") =>
    parts.flatMap((p) => (p.k == null ? p.ts : expandGroup(p.k, p.ts, mode)));

  /**
   * Combine a (single-letter) term list, correctly ("ok") or with a named slip:
   *   unlike  constants swept into the letter terms     expo    the power goes up instead of the coefficient
   *   mult    coefficients multiplied                   sign    every subtraction treated as addition
   *   lone    a bare letter counted as zero             concat  two coefficients written side by side
   */
  function combineBy(/** @type {any[]} */ ts, /** @type {string} */ mode) {
    const V = ts.filter((t) => t.v);
    const C = ts.filter((t) => !t.v);
    if (mode === "ok" || !V.length) return tidy(ts);
    const v = V[0].v;
    const vs = wsum(V, (t) => t.c);
    const cs = wsum(C, (t) => t.c);
    if (mode === "unlike") return [T(vs + cs, v)];
    if (mode === "expo") return [T(vs, v, 2), K(cs)];
    if (mode === "mult")
      return [
        T(
          V.reduce((s, t) => s * Math.abs(t.c), 1),
          v,
        ),
        K(cs),
      ];
    if (mode === "sign")
      return [
        T(
          wsum(V, (t) => Math.abs(t.c)),
          v,
        ),
        K(wsum(C, (t) => Math.abs(t.c))),
      ];
    if (mode === "lone")
      return [
        T(
          wsum(
            V.filter((t) => Math.abs(t.c) !== 1),
            (t) => t.c,
          ),
          v,
        ),
        K(cs),
      ];
    if (mode === "concat" && V.length === 2)
      return [T(Number(V.map((t) => Math.abs(t.c)).join("")), v), K(cs)];
    return tidy(ts);
  }
  /** [expand slip, combine slip, tag]: every named way to get a simplification wrong, most common first */
  const SLIPS = [
    ["ok", "unlike", "combined-unlike-terms"],
    ["first", "ok", "distributed-to-first-term-only"],
    ["ok", "expo", "exponent-added"],
    ["last", "ok", "distributed-to-last-term-only"],
    ["added", "ok", "added-instead-of-multiplied"],
    ["nosign", "ok", "sign-dropped"],
    ["ok", "sign", "sign-error"],
    ["ok", "mult", "multiplied-coefficients"],
    ["ok", "lone", "forgot-lone-variable"],
    ["ok", "concat", "concatenated"],
  ];
  /** wrong simplifications of an expression written as parts: [{v, tag}] (callers filter the ones that happen to be right) */
  const slipsOf = (/** @type {any[]} */ parts, /** @type {string[]|undefined} */ only) =>
    SLIPS.filter(([, , tag]) => !only || only.includes(tag)).map(([e, c, tag]) => ({
      v: show(combineBy(expandParts(parts, e), c)),
      tag,
    }));

  /* ---- the expression reader: used by check() and by the worked steps --------------------------------------- */
  function lex(/** @type {string} */ src) {
    const out = [];
    const re = /\s*(?:(\d+(?:\.\d+)?)|([a-z])|([()+×·÷²³−-]))/y;
    let pos = 0;
    while (pos < src.length) {
      re.lastIndex = pos;
      const m = re.exec(src);
      if (!m) {
        if (/^\s*$/.test(src.slice(pos))) break;
        throw new Error(`cannot read "${src.slice(pos)}"`);
      }
      pos = re.lastIndex;
      if (m[1] !== undefined) out.push({ k: "n", v: Number(m[1]) });
      else if (m[2]) out.push({ k: "v", v: m[2] });
      else if (m[3] === "²" || m[3] === "³") out.push({ k: "^", v: m[3] === "²" ? 2 : 3 });
      else out.push({ k: m[3] === "-" ? "−" : m[3] === "·" ? "×" : m[3], v: 0 });
    }
    return out;
  }
  /** AST: {t:"n",v} {t:"v",n} {t:"neg",e} {t:"p",e} {t:"pow",e,k} {t:"b",op,l,r,imp?} */
  function parse(/** @type {string} */ src) {
    const toks = lex(src);
    let i = 0;
    const peek = () => toks[i];
    const startsAtom = (/** @type {any} */ t) => t && (t.k === "n" || t.k === "v" || t.k === "(");
    function atom() {
      const t = toks[i++];
      if (!t) throw new Error(`unexpected end of "${src}"`);
      if (t.k === "n") return { t: "n", v: t.v };
      if (t.k === "v") return { t: "v", n: t.v };
      if (t.k === "(") {
        const e = expr();
        if (!toks[i] || toks[i++].k !== ")") throw new Error(`missing ) in "${src}"`);
        return { t: "p", e };
      }
      throw new Error(`unexpected ${t.k} in "${src}"`);
    }
    function pow() {
      let a = atom();
      while (peek() && peek().k === "^") a = { t: "pow", e: a, k: toks[i++].v };
      return a;
    }
    function term() {
      let l = pow();
      for (;;) {
        const t = peek();
        if (t && (t.k === "×" || t.k === "÷")) {
          i++;
          l = { t: "b", op: t.k, l, r: pow() };
        } else if (startsAtom(t)) l = { t: "b", op: "×", l, r: pow(), imp: true };
        else return l;
      }
    }
    function expr() {
      let l = peek() && peek().k === "−" ? (i++, { t: "neg", e: term() }) : term();
      while (peek() && (peek().k === "+" || peek().k === "−")) {
        const op = toks[i++].k;
        l = { t: "b", op, l, r: term() };
      }
      return l;
    }
    const e = expr();
    if (i < toks.length) throw new Error(`unexpected "${toks[i].k}" in "${src}"`);
    return e;
  }
  function ev(/** @type {any} */ n, /** @type {Record<string, number>} */ env) {
    switch (n.t) {
      case "n":
        return n.v;
      case "v":
        if (!(n.n in env)) throw new Error(`no value for ${n.n}`);
        return env[n.n];
      case "neg":
        return -ev(n.e, env);
      case "p":
        return ev(n.e, env);
      case "pow":
        return ev(n.e, env) ** n.k;
      default: {
        const a = ev(n.l, env);
        const b = ev(n.r, env);
        return n.op === "+" ? a + b : n.op === "−" ? a - b : n.op === "×" ? a * b : a / b;
      }
    }
  }
  const val = (/** @type {string} */ src, /** @type {Record<string, number>} */ env = {}) =>
    ev(parse(src), env);
  const varsOf = (/** @type {string} */ src) => [...new Set(src.match(/[a-z]/g) || [])];
  const PTS = [-3, -1, 0, 1, 2, 4, 7];
  /** equal at every test point (7 values per letter): a complete test for these small polynomials */
  function same(/** @type {string} */ a, /** @type {string} */ b) {
    const A = parse(a);
    const B = parse(b);
    const vs = [...new Set([...varsOf(a), ...varsOf(b)])];
    const rec = (/** @type {number} */ i, /** @type {Record<string, number>} */ env) => {
      if (i === vs.length) {
        const x = ev(A, env);
        const y = ev(B, env);
        return Math.abs(x - y) <= 1e-9 * Math.max(1, Math.abs(x), Math.abs(y));
      }
      return PTS.every((p) => rec(i + 1, { ...env, [vs[i]]: p }));
    };
    return rec(0, {});
  }
  /** "L = R" is true for every value of its letters */
  const identity = (/** @type {string} */ eq) => {
    const [l, r] = eq.split(" = ");
    return same(l, r);
  };

  /* ---- worked steps: 3 × 5 + 4 = 15 + 4 = 19 ----------------------------------------------------------------- */
  const isNum = (/** @type {any} */ n) => n.t === "n";
  const kids = (/** @type {any} */ n) => (n.t === "b" ? [n.l, n.r] : n.e ? [n.e] : []);
  const anyNode = (/** @type {any} */ n, /** @type {(n:any)=>boolean} */ hit) =>
    hit(n) || kids(n).some((c) => anyNode(c, hit));
  /** replace the first matching node on each branch */
  function walk(
    /** @type {any} */ n,
    /** @type {(n:any)=>boolean} */ hit,
    /** @type {(n:any)=>any} */ fn,
  ) {
    if (hit(n)) return fn(n);
    if (n.t === "b") return { ...n, l: walk(n.l, hit, fn), r: walk(n.r, hit, fn) };
    if (n.e) return { ...n, e: walk(n.e, hit, fn) };
    return n;
  }
  const subVars = (/** @type {any} */ n, /** @type {Record<string, number>} */ env) =>
    walk(
      n,
      (x) => x.t === "v",
      (x) => ({ t: "n", v: env[x.n] }),
    );
  /** drop parentheses around a bare number */
  const unwrap = (/** @type {any} */ n) =>
    walk(
      n,
      (x) => x.t === "p" && isNum(x.e),
      (x) => x.e,
    );
  const hasParen = (/** @type {any} */ n) => anyNode(n, (x) => x.t === "p");
  /** one phase of the order of operations on a tree with no parentheses */
  function phase(/** @type {any} */ n) {
    if (isNum(n)) return n;
    const powHit = (/** @type {any} */ x) => x.t === "pow" && isNum(x.e);
    if (anyNode(n, powHit)) return walk(n, powHit, (x) => ({ t: "n", v: x.e.v ** x.k }));
    const mdHit = (/** @type {any} */ x) =>
      x.t === "b" && (x.op === "×" || x.op === "÷") && isNum(x.l) && isNum(x.r);
    if (anyNode(n, mdHit))
      return walk(n, mdHit, (x) => ({ t: "n", v: x.op === "×" ? x.l.v * x.r.v : x.l.v / x.r.v }));
    return { t: "n", v: ev(n, {}) };
  }
  /** reduce the innermost parenthesis groups by one phase; with none left, reduce the whole expression */
  function step(/** @type {any} */ n) {
    const inner = (/** @type {any} */ x) => {
      if (x.t === "p") return { t: "p", e: hasParen(x.e) ? inner(x.e) : phase(x.e) };
      if (x.t === "b")
        return { ...x, l: hasParen(x.l) ? inner(x.l) : x.l, r: hasParen(x.r) ? inner(x.r) : x.r };
      return x.e ? { ...x, e: hasParen(x.e) ? inner(x.e) : x.e } : x;
    };
    return unwrap(hasParen(n) ? inner(n) : phase(n));
  }
  function str(/** @type {any} */ n) {
    switch (n.t) {
      case "n":
        return N(n.v);
      case "v":
        return n.n;
      case "neg":
        return `−${str(n.e)}`;
      case "p":
        return `(${str(n.e)})`;
      case "pow":
        return str(n.e) + SUP[n.k];
      default:
        return n.op === "×" && n.imp && n.r.t === "p"
          ? str(n.l) + str(n.r)
          : `${str(n.l)} ${n.op} ${str(n.r)}`;
    }
  }
  /** ["3 × 5 + 4", "15 + 4", "19"] */
  function chain(/** @type {string} */ src, /** @type {Record<string, number>} */ env) {
    let n = unwrap(subVars(parse(src), env));
    const out = [str(n)];
    for (let g = 0; !isNum(n) && g < 12; g++) {
      n = step(n);
      out.push(str(n));
    }
    return out;
  }
  const chainText = (/** @type {string} */ src, /** @type {Record<string, number>} */ env) =>
    chain(src, env).join(" = ");
  /** which part of the order of operations comes first for this expression and these values */
  function firstPhase(/** @type {string} */ src, /** @type {Record<string, number>} */ env) {
    const n = unwrap(subVars(parse(src), env));
    if (hasParen(n)) return "paren";
    if (anyNode(n, (x) => x.t === "pow")) return "pow";
    if (anyNode(n, (x) => x.t === "b" && (x.op === "×" || x.op === "÷"))) return "mul";
    return "add";
  }
  const lastOf = (/** @type {string} */ src, /** @type {Record<string, number>} */ env) => {
    const c = chain(src, env);
    return c[c.length - 1];
  };
  /** "x = 2: 2(2 + 3) = 2 × 5 = 10" */
  const testLine = (/** @type {string} */ src, /** @type {string} */ v, /** @type {number} */ t) =>
    chainText(src, { [v]: t });

  /* ---- item builders ------------------------------------------------------------------------------------------ */
  const bare = (/** @type {number|string} */ s) => String(s).trim().toLowerCase();
  /** does the text contain this number as a standalone number? */
  const hasNumber = (/** @type {string} */ text, /** @type {string} */ a) =>
    new RegExp(`(?<![\\d.])${a.replace(/[.]/g, "\\.")}(?![\\d])`).test(String(text || ""));
  const joinEs = (/** @type {any[]} */ pairs) => ({
    en: pairs.map((p) => p[0]),
    es: pairs.map((p) => p[1]),
  });

  /**
   * Multiple choice where the choices are expressions or short sentences.
   *   q, x      [en, es]            h   [[en, es], ...]
   *   key       {v, vEs?}           wrong  [{v, vEs?, tag, f:[en, es]}]  candidates; the filters below keep the good ones
   *   ok(text)  a candidate wrong is kept only when this is true (default: any)
   *   apart(a, b)  two kept wrongs must differ by this test (default: different text)
   * Returns null when fewer than three wrongs survive, so the caller draws again.
   */
  function mcx(/** @type {any} */ rng, /** @type {any} */ o) {
    const ok = o.ok || (() => true);
    const apart =
      o.apart || ((/** @type {string} */ a, /** @type {string} */ b) => bare(a) !== bare(b));
    const kept = /** @type {any[]} */ ([]);
    for (const w of rng.shuffle(o.wrong)) {
      if (!w.v || w.v === "0" || bare(w.v) === bare(o.key.v) || !ok(w.v)) continue;
      if (kept.some((k) => !apart(k.v, w.v))) continue;
      kept.push(w);
    }
    if (kept.length < 3) return null;
    const h = joinEs(o.h);
    if (hasLeak(o.q[0], o.key.v) || h.en.some((t) => hasLeak(t, o.key.v))) return null;
    const item = G.mc(rng, {
      q: o.q[0],
      qEs: o.q[1],
      right: { v: o.key.v },
      wrong: kept.map((w) => ({ v: w.v, f: w.f[0], fEs: w.f[1] })),
      x: o.x[0],
      xEs: o.x[1],
      h: h.en,
      hEs: h.es,
      meta: o.meta,
    });
    const info = new Map(kept.map((w) => [bare(w.v), w]));
    item.tag = item.c.map((c, i) => (i === item.a ? "" : info.get(bare(c)).tag));
    if (o.key.vEs || kept.some((w) => w.vEs))
      item.cEs = item.c.map((c, i) => (i === item.a ? o.key.vEs || c : info.get(bare(c)).vEs || c));
    return item;
  }
  /** a sentence that contains the key text word for word gives the answer away */
  const hasLeak = (/** @type {string} */ text, /** @type {string} */ keyText) =>
    String(keyText).length > 1 && String(text).includes(String(keyText));

  /**
   * Typed answer. wrong: [{v:number, tag, f:[en, es]}] common wrong values; the right value, negatives and repeats are
   * dropped. Returns null when the stem, a hint or a kept feedback line would print the answer as a bare number.
   */
  function numx(/** @type {any} */ o) {
    const a = N(o.ans);
    const h = joinEs(o.h);
    if (hasNumber(o.q[0], a) || hasNumber(o.q[1], a) || h.en.some((t) => hasNumber(t, a)))
      return null;
    const seen = new Set([a]);
    const fw = [];
    for (const w of o.wrong) {
      const v = N(w.v);
      if (!Number.isFinite(w.v) || w.v < 0 || seen.has(v) || hasNumber(w.f[0], a)) continue;
      seen.add(v);
      fw.push({ v, f: w.f[0], fEs: w.f[1], tag: w.tag });
    }
    return G.num({
      q: o.q[0],
      qEs: o.q[1],
      a,
      unit: o.unit,
      fw,
      x: o.x[0],
      xEs: o.x[1],
      h: h.en,
      hEs: h.es,
      meta: o.meta,
    });
  }
  /** draw until build() returns an item; a seed can never loop forever */
  function until(/** @type {string} */ id, /** @type {() => any} */ build) {
    for (let i = 0; i < 80; i++) {
      const it = build();
      if (it) return it;
    }
    throw new Error(`${id}: could not build an item`);
  }

  /* ---- one feedback line per named misconception (reused by every generator) ----------------------------------- */
  /** @type {Record<string, [string, string]>} */
  const MIS = {
    // combining like terms
    "combined-unlike-terms": [
      "A plain number and a letter term are not like terms, so they cannot be added into one term. Combine only terms with the same letter and power.",
      "Un número solo y un término con letra no son términos semejantes, así que no se pueden sumar en un solo término. Combina solo los términos con la misma letra y la misma potencia.",
    ],
    "exponent-added": [
      "When you combine like terms you add the coefficients and the letter stays as it is. The power does not change.",
      "Al combinar términos semejantes se suman los coeficientes y la letra se queda igual. La potencia no cambia.",
    ],
    "multiplied-coefficients": [
      "Like terms are added, not multiplied. Adding counts how many of the letter there are in all.",
      "Los términos semejantes se suman, no se multiplican. Sumar cuenta cuántas de esa letra hay en total.",
    ],
    concatenated: [
      "The two coefficients were written side by side. Add them to count how many of the letter there are in all.",
      "Los dos coeficientes se escribieron uno al lado del otro. Súmalos para contar cuántas de esa letra hay en total.",
    ],
    "sign-error": [
      "A subtraction sign was treated like addition. Each sign belongs to the term right after it.",
      "Un signo de resta se trató como suma. Cada signo pertenece al término que le sigue.",
    ],
    "forgot-lone-variable": [
      "A letter with no number in front, like x, still counts. It is 1x.",
      "Una letra sin número delante, como x, también cuenta. Es 1x.",
    ],
    "dropped-variable": [
      "The letter was lost from one part. Every term that has the letter keeps it.",
      "Se perdió la letra en una parte. Cada término que tiene la letra la conserva.",
    ],
    "ignored-exponent": [
      "x and x² are different, because the power is different. Like terms need the same letter AND the same power.",
      "x y x² son distintos porque la potencia es distinta. Los términos semejantes necesitan la misma letra Y la misma potencia.",
    ],
    "matched-coefficient": [
      "The numbers match, but like terms need the same LETTER. A different letter is a different kind of term.",
      "Los números coinciden, pero los términos semejantes necesitan la misma LETRA. Otra letra es otra clase de término.",
    ],
    "matched-constant": [
      "A plain number has no letter, so it is not a like term of a letter term.",
      "Un número solo no tiene letra, así que no es semejante a un término con letra.",
    ],
    "stopped-early": [
      "This is equivalent, but it can still be made shorter. It has like terms that are not combined yet.",
      "Es equivalente, pero todavía se puede acortar. Tiene términos semejantes que aún no se combinan.",
    ],
    "parentheses-left": [
      "This is equivalent, but it still has parentheses. Distribute first, then combine like terms.",
      "Es equivalente, pero todavía tiene paréntesis. Primero distribuye y luego combina los términos semejantes.",
    ],
    "constants-uncombined": [
      "This is equivalent, but the plain numbers can still be added together.",
      "Es equivalente, pero los números solos todavía se pueden sumar.",
    ],
    "variables-uncombined": [
      "This is equivalent, but the terms with the letter can still be combined.",
      "Es equivalente, pero los términos con la letra todavía se pueden combinar.",
    ],
    // distributing
    "distributed-to-first-term-only": [
      "The number outside the parentheses multiplied only the first term. It has to multiply every term inside.",
      "El número de afuera multiplicó solo el primer término. Tiene que multiplicar todos los términos de adentro.",
    ],
    "distributed-to-last-term-only": [
      "The number outside the parentheses multiplied only the last term. It has to multiply every term inside.",
      "El número de afuera multiplicó solo el último término. Tiene que multiplicar todos los términos de adentro.",
    ],
    "added-instead-of-multiplied": [
      "The number outside was ADDED to a term inside. Distributing means multiplying every term inside by it.",
      "El número de afuera se SUMÓ a un término de adentro. Distribuir significa multiplicar cada término de adentro por él.",
    ],
    "added-outside-factor": [
      "The outside number was added to the number inside and the letter was kept. The outside number multiplies; it is not added.",
      "El número de afuera se sumó al número de adentro y se conservó la letra. El número de afuera multiplica; no se suma.",
    ],
    "sign-dropped": [
      "The minus sign inside the parentheses was lost. After you multiply, the subtraction is still there.",
      "Se perdió el signo de resta dentro del paréntesis. Después de multiplicar, la resta sigue ahí.",
    ],
    "factored-first-term-only": [
      "Only the first term was divided by the common factor. Divide every term, then check by multiplying back.",
      "Solo se dividió el primer término entre el factor común. Divide todos los términos y comprueba multiplicando de nuevo.",
    ],
    "factored-last-term-only": [
      "Only the last term was divided by the common factor. Divide every term, then check by multiplying back.",
      "Solo se dividió el último término entre el factor común. Divide todos los términos y comprueba multiplicando de nuevo.",
    ],
    "dropped-the-factor": [
      "The common factor was divided out but never written in front. Factoring keeps it outside the parentheses.",
      "El factor común se dividió pero nunca se escribió afuera. Al factorizar, se conserva afuera del paréntesis.",
    ],
    "divided-by-wrong-number": [
      "A term was divided by a different number than the common factor. Use the same factor on every term.",
      "Un término se dividió entre un número distinto del factor común. Usa el mismo factor en todos los términos.",
    ],
    // evaluating
    "concatenated-coefficient": [
      "A number next to a letter means multiply, not 'write the digits side by side'. For example, 4n is 4 × n.",
      "Un número junto a una letra significa multiplicar, no 'escribir los dígitos juntos'. Por ejemplo, 4n es 4 × n.",
    ],
    "treated-as-addition": [
      "Some numbers were added when they should be multiplied. A number next to a letter or a parenthesis means multiply.",
      "Se sumaron números que se debían multiplicar. Un número junto a una letra o a un paréntesis significa multiplicar.",
    ],
    "used-wrong-operation": [
      "A different operation was used from the one in the expression. Check each sign: +, −, ×, ÷.",
      "Se usó una operación distinta de la que tiene la expresión. Revisa cada signo: +, −, ×, ÷.",
    ],
    "exponent-as-multiplication": [
      "A power like 5² means 5 × 5, the number times itself. It does not mean 5 × 2.",
      "Una potencia como 5² significa 5 × 5, el número por sí mismo. No significa 5 × 2.",
    ],
    "forgot-the-power": [
      "The power was skipped. The little 2 means the number is multiplied by itself first.",
      "Se omitió la potencia. El 2 pequeño significa que primero el número se multiplica por sí mismo.",
    ],
    "added-before-multiplying": [
      "Addition was done before multiplication. With no parentheses, multiply (and divide) first.",
      "Se sumó antes de multiplicar. Sin paréntesis, primero se multiplica (y se divide).",
    ],
    "ignored-parentheses": [
      "The parentheses were not respected. What is inside the parentheses is worked out first, and the number outside multiplies the whole result.",
      "No se respetaron los paréntesis. Lo que está dentro del paréntesis se calcula primero y el número de afuera multiplica todo el resultado.",
    ],
    "subtracted-first": [
      "Subtraction was done before multiplication. Multiply first, then subtract.",
      "Se restó antes de multiplicar. Primero multiplica y luego resta.",
    ],
    "grouped-too-much": [
      "Too much was put inside one group. Only do something first when the expression has parentheses around it.",
      "Se metió demasiado en un solo grupo. Solo se hace algo primero cuando la expresión tiene paréntesis.",
    ],
    "reversed-subtraction": [
      "The subtraction is written backwards. The words tell you which number to start with and which number to take away.",
      "La resta está escrita al revés. Las palabras te dicen con qué número empezar y qué número quitar.",
    ],
    "reversed-division": [
      "The division is backwards. Divide the number named first by the number named second.",
      "La división está al revés. Divide el número que se nombra primero entre el que se nombra después.",
    ],
    "swapped-values": [
      "The values of the two letters were switched. Check which number belongs to which letter.",
      "Se cambiaron los valores de las dos letras. Revisa qué número le toca a cada letra.",
    ],
    "squared-each-term": [
      "A sum in parentheses with a power is squared as a whole. The power is not shared out to each term.",
      "Una suma entre paréntesis con una potencia se eleva completa. La potencia no se reparte a cada término.",
    ],
    "squared-the-coefficient": [
      "The power belongs only to the letter right before it. The number in front is not squared unless it is inside the parentheses.",
      "La potencia es solo de la letra que está justo antes. El número de adelante no se eleva a menos que esté dentro del paréntesis.",
    ],
    "flat-fee-multiplied": [
      "A one-time amount was multiplied by the letter. Only the amount that repeats for each one is multiplied.",
      "Una cantidad única se multiplicó por la letra. Solo se multiplica la cantidad que se repite por cada uno.",
    ],
    "added-all-numbers": [
      "All the numbers were added with the letter. The amount for each one has to be multiplied by the letter.",
      "Todos los números se sumaron con la letra. La cantidad por cada uno se tiene que multiplicar por la letra.",
    ],
    "swapped-numbers": [
      "The numbers are on the wrong parts. Match each number to what it describes.",
      "Los números están en las partes equivocadas. Une cada número con lo que describe.",
    ],
    "variable-not-multiplied": [
      "The amount for each one has to be multiplied by the number of ones. Here the letter was only added or subtracted.",
      "La cantidad por cada uno se tiene que multiplicar por el número de unidades. Aquí la letra solo se sumó o se restó.",
    ],
    "undid-one-step": [
      "That undoes only one step. Keep working backward until the letter is alone.",
      "Eso deshace solo un paso. Sigue hacia atrás hasta que la letra quede sola.",
    ],
    "wrong-inverse": [
      "A step was undone with the wrong operation. Undo + with −, − with +, × with ÷ and ÷ with ×.",
      "Un paso se deshizo con la operación equivocada. Deshaz + con −, − con +, × con ÷ y ÷ con ×.",
    ],
    "forgot-square-root": [
      "That is the value of the power, not the number that was squared. Ask: what number times itself gives it?",
      "Ese es el valor de la potencia, no el número que se elevó. Pregunta: ¿qué número por sí mismo da ese valor?",
    ],
    "confused-coefficient-constant": [
      "The coefficient is the number multiplied by the letter. The constant is the number that stands alone.",
      "El coeficiente es el número que multiplica a la letra. La constante es el número que está solo.",
    ],
    "confused-variable-number": [
      "The variable is the letter, the symbol that stands for a number that can change.",
      "La variable es la letra, el símbolo que representa un número que puede cambiar.",
    ],
    "named-whole-term": [
      "That is a whole term, the number and the letter together. The coefficient is only the number.",
      "Eso es un término completo, el número y la letra juntos. El coeficiente es solo el número.",
    ],
    // equivalence
    "swapped-attachment": [
      "The letter moved to the other number. Reordering the terms keeps each number with its own letter.",
      "La letra pasó al otro número. Al reordenar los términos, cada número se queda con su propia letra.",
    ],
    "repeated-add-as-exponent": [
      "Adding a letter to itself is not the same as raising it to a power. x + x + x counts 3 of x; x³ means x × x × x.",
      "Sumar una letra consigo misma no es lo mismo que elevarla a una potencia. x + x + x cuenta 3 de x; x³ significa x × x × x.",
    ],
    "missed-reorder": [
      "This one IS equivalent to the original: only the order of the terms changed, and order does not matter in addition.",
      "Esta SÍ es equivalente a la original: solo cambió el orden de los términos, y el orden no importa al sumar.",
    ],
    "missed-distribution": [
      "This one IS equivalent to the original: the number outside was multiplied by every term inside, which keeps the value the same.",
      "Esta SÍ es equivalente a la original: el número de afuera multiplicó cada término de adentro, y eso conserva el valor.",
    ],
    "missed-combining": [
      "This one IS equivalent to the original: combining or splitting like terms correctly keeps the value the same.",
      "Esta SÍ es equivalente a la original: combinar o separar bien los términos semejantes conserva el valor.",
    ],
    "one-test-value": [
      "One matching test value does not prove that two expressions are equivalent. A different value might not match.",
      "Un solo valor de prueba que coincide no demuestra que dos expresiones sean equivalentes. Otro valor podría no coincidir.",
    ],
    "judged-by-appearance": [
      "Looking different is not a test. Equivalent expressions often look different. Use a test value.",
      "Verse distintas no es una prueba. Las expresiones equivalentes muchas veces se ven distintas. Usa un valor de prueba.",
    ],
    "needs-many-tests": [
      "One test value that gives different results is enough to show two expressions are not equivalent. That value is a counterexample.",
      "Un solo valor de prueba que da resultados distintos basta para mostrar que dos expresiones no son equivalentes. Ese valor es un contraejemplo.",
    ],
    "tested-wrong-values": [
      "Check this pair: for at least one of these values the two expressions give different results, so the tests would not both match.",
      "Revisa este par: con al menos uno de estos valores las dos expresiones dan resultados distintos, así que las pruebas no coincidirían las dos.",
    ],
    "missing-parentheses": [
      "'The sum of' and 'the difference of' need parentheses, so the multiplication applies to the whole sum or difference.",
      "'La suma de' y 'la diferencia de' necesitan paréntesis para que la multiplicación se aplique a toda la suma o diferencia.",
    ],
    "order-of-operations": [
      "The operations were done in a different order from the order of operations: powers first, then multiply or divide, then add or subtract.",
      "Las operaciones se hicieron en un orden distinto al orden de las operaciones: primero las potencias, luego multiplicar o dividir y luego sumar o restar.",
    ],
  };
  /** the feedback pair for a tag */
  const fb = (/** @type {string} */ tag) => {
    if (!MIS[tag]) throw new Error(`algebra: no feedback written for "${tag}"`);
    return MIS[tag];
  };

  /* ================================================================================================================
   * evalExpression (lesson 6-5): evaluate, write then evaluate, work backward, find the mistake
   * ============================================================================================================== */
  const near = (/** @type {number} */ a, /** @type {number} */ b) =>
    Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
  /** ["n = 5 and m = 3", "n = 5 y m = 3"] */
  const withVals = (/** @type {Record<string, number>} */ env) => {
    const eq = Object.keys(env).map((v) => `${v} = ${env[v]}`);
    return [eq.join(" and "), eq.join(" y ")];
  };
  const evalStem = (
    /** @type {any} */ rng,
    /** @type {string} */ e,
    /** @type {Record<string, number>} */ env,
  ) => {
    const [en, es] = withVals(env);
    return rng.pick([
      [`Evaluate ${e} when ${en}.`, `Evalúa ${e} cuando ${es}.`],
      [`What is the value of ${e} when ${en}?`, `¿Cuál es el valor de ${e} cuando ${es}?`],
      [`Find the value of ${e} if ${en}.`, `Halla el valor de ${e} si ${es}.`],
    ]);
  };
  const evalWork = (
    /** @type {string} */ src,
    /** @type {Record<string, number>} */ env,
    /** @type {number} */ ans,
  ) => {
    const vs = Object.keys(env);
    const c = chainText(src, env);
    return [
      `Replace ${vs.map((v) => `${v} with ${env[v]}`).join(" and ")}, then follow the order of operations: ${c}. The value is ${N(ans)}.`,
      `Reemplaza ${vs.map((v) => `${v} por ${env[v]}`).join(" y ")} y sigue el orden de las operaciones: ${c}. El valor es ${N(ans)}.`,
    ];
  };
  const PHASE_HINT = {
    paren: [
      "Do the work inside the parentheses first.",
      "Haz primero lo que está dentro del paréntesis.",
    ],
    pow: [
      "Do the power first. A power like 4² means 4 × 4, not 4 × 2.",
      "Haz primero la potencia. Una potencia como 4² significa 4 × 4, no 4 × 2.",
    ],
    mul: [
      "Multiply (or divide) before you add or subtract.",
      "Multiplica (o divide) antes de sumar o restar.",
    ],
    add: ["Work from left to right.", "Trabaja de izquierda a derecha."],
  };
  const evalHints = (/** @type {string} */ src, /** @type {Record<string, number>} */ env) => [
    /(\d|[a-z)])[a-z(]/.test(src)
      ? [
          "A number next to a letter means multiply. Replace each letter with its number.",
          "Un número junto a una letra significa multiplicar. Reemplaza cada letra con su número.",
        ]
      : ["Replace each letter with its number.", "Reemplaza cada letra con su número."],
    [
      `Write it with the numbers in place: ${chain(src, env)[0]}.`,
      `Escríbela con los números en su lugar: ${chain(src, env)[0]}.`,
    ],
    /** @type {any} */ (PHASE_HINT)[firstPhase(src, env)],
  ];
  const wrongVals = (/** @type {any[]} */ list) => list.map(([v, tag]) => ({ v, tag, f: fb(tag) }));

  /**
   * Symbolic forms. gen(rng) -> { expr, env, ans, wrong: [[value, tag], ...] }; ans comes from plain arithmetic here,
   * check() reads the displayed expr instead.
   */
  const EVAL_FORMS = [
    // level 1: one step
    {
      lv: 1,
      w: 5,
      gen(/** @type {any} */ rng) {
        const [v] = letters(rng, 1);
        const a = rng.int(2, 9);
        const n = rng.int(2, 9);
        return {
          expr: `${a}${v}`,
          env: { [v]: n },
          ans: a * n,
          wrong: [
            [Number(`${a}${n}`), "concatenated-coefficient"],
            [a + n, "treated-as-addition"],
          ],
        };
      },
    },
    {
      lv: 1,
      w: 2,
      gen(/** @type {any} */ rng) {
        const [v] = letters(rng, 1);
        const a = rng.int(2, 12);
        const n = rng.int(2, 12);
        return {
          expr: rng.chance(0.5) ? `${v} + ${a}` : `${a} + ${v}`,
          env: { [v]: n },
          ans: n + a,
          wrong: [
            [n * a, "used-wrong-operation"],
            [Math.abs(n - a), "used-wrong-operation"],
          ],
        };
      },
    },
    {
      lv: 1,
      w: 2,
      gen(/** @type {any} */ rng) {
        const [v] = letters(rng, 1);
        const a = rng.int(2, 9);
        const n = a + rng.int(2, 9);
        return {
          expr: `${v} − ${a}`,
          env: { [v]: n },
          ans: n - a,
          wrong: [
            [n + a, "used-wrong-operation"],
            [n * a, "used-wrong-operation"],
          ],
        };
      },
    },
    {
      lv: 1,
      w: 2,
      gen(/** @type {any} */ rng) {
        const [v] = letters(rng, 1);
        const a = rng.int(2, 9);
        const q = rng.int(2, 9);
        return {
          expr: `${v} ÷ ${a}`,
          env: { [v]: a * q },
          ans: q,
          wrong: [
            [a * q * a, "used-wrong-operation"],
            [a * q - a, "used-wrong-operation"],
          ],
        };
      },
    },
    // level 2: two steps, one power
    {
      lv: 2,
      w: 24,
      gen(/** @type {any} */ rng) {
        const [v] = letters(rng, 1);
        const a = rng.int(2, 9);
        const n = rng.int(2, 12);
        const b = rng.int(1, 20);
        return {
          expr: `${a}${v} + ${b}`,
          env: { [v]: n },
          ans: a * n + b,
          wrong: [
            [Number(`${a}${n}`) + b, "concatenated-coefficient"],
            [a + n + b, "treated-as-addition"],
            [a * (n + b), "added-before-multiplying"],
          ],
        };
      },
    },
    {
      lv: 2,
      w: 14,
      gen(/** @type {any} */ rng) {
        const [v] = letters(rng, 1);
        const a = rng.int(2, 9);
        const n = rng.int(3, 12);
        const b = rng.int(1, Math.min(20, a * n - 1));
        return {
          expr: `${a}${v} − ${b}`,
          env: { [v]: n },
          ans: a * n - b,
          wrong: [
            [Number(`${a}${n}`) - b, "concatenated-coefficient"],
            [a + n - b, "treated-as-addition"],
            [a * (n - b), "subtracted-first"],
          ],
        };
      },
    },
    {
      lv: 2,
      w: 10,
      gen(/** @type {any} */ rng) {
        const [v] = letters(rng, 1);
        const a = rng.int(2, 9);
        const n = rng.int(2, 9);
        const r = rng.int(1, 20);
        const b = a * n + r;
        return {
          expr: `${b} − ${a}${v}`,
          env: { [v]: n },
          ans: r,
          wrong: [
            [(b - a) * n, "subtracted-first"],
            [b - a - n, "treated-as-addition"],
            [b + a * n, "used-wrong-operation"],
          ],
        };
      },
    },
    {
      lv: 2,
      w: 16,
      gen(/** @type {any} */ rng) {
        const [v] = letters(rng, 1);
        const a = rng.int(2, 9);
        const n = rng.int(2, 9);
        const b = rng.int(1, 9);
        return {
          expr: `${a}(${v} + ${b})`,
          env: { [v]: n },
          ans: a * (n + b),
          wrong: [
            [a * n + b, "ignored-parentheses"],
            [a + n + b, "treated-as-addition"],
            [a * n * b, "used-wrong-operation"],
          ],
        };
      },
    },
    {
      lv: 2,
      w: 8,
      gen(/** @type {any} */ rng) {
        const [v] = letters(rng, 1);
        const a = rng.int(2, 6);
        const q = rng.int(2, 9);
        const b = rng.int(1, 12);
        return {
          expr: `${v} ÷ ${a} + ${b}`,
          env: { [v]: a * q },
          ans: q + b,
          wrong: [
            [(a * q) / (a + b), "grouped-too-much"],
            [a * q * a + b, "used-wrong-operation"],
          ],
        };
      },
    },
    {
      lv: 2,
      w: 8,
      gen(/** @type {any} */ rng) {
        const [v] = letters(rng, 1);
        const n = rng.int(2, 12);
        return {
          expr: `${v}²`,
          env: { [v]: n },
          ans: n * n,
          wrong: [
            [2 * n, "exponent-as-multiplication"],
            [n, "forgot-the-power"],
          ],
        };
      },
    },
    {
      lv: 2,
      w: 14,
      gen(/** @type {any} */ rng) {
        const [v] = letters(rng, 1);
        const n = rng.int(2, 10);
        const b = rng.int(1, 15);
        return {
          expr: `${v}² + ${b}`,
          env: { [v]: n },
          ans: n * n + b,
          wrong: [
            [2 * n + b, "exponent-as-multiplication"],
            [(n + b) ** 2, "order-of-operations"],
            [n + b, "forgot-the-power"],
          ],
        };
      },
    },
    // level 3: powers with a coefficient or a group; two letters
    {
      lv: 3,
      w: 3,
      gen(/** @type {any} */ rng) {
        const [v] = letters(rng, 1);
        const a = rng.int(2, 5);
        const n = rng.int(2, 7);
        const b = rng.int(1, Math.min(15, a * n * n - 1));
        return {
          expr: `${a}${v}² − ${b}`,
          env: { [v]: n },
          ans: a * n * n - b,
          wrong: [
            [(a * n) ** 2 - b, "squared-the-coefficient"],
            [a * n * 2 - b, "exponent-as-multiplication"],
            [a * (n * n - b), "order-of-operations"],
          ],
        };
      },
    },
    {
      lv: 3,
      w: 3,
      gen(/** @type {any} */ rng) {
        const [v] = letters(rng, 1);
        const a = rng.int(2, 5);
        const n = rng.int(2, 7);
        const b = rng.int(2, 15);
        return {
          expr: `${b} + ${a}${v}²`,
          env: { [v]: n },
          ans: b + a * n * n,
          wrong: [
            [b + (a * n) ** 2, "squared-the-coefficient"],
            [b + a * n * 2, "exponent-as-multiplication"],
            [(b + a) * n * n, "order-of-operations"],
          ],
        };
      },
    },
    {
      lv: 3,
      w: 3,
      gen(/** @type {any} */ rng) {
        const [v] = letters(rng, 1);
        const a = rng.int(1, 6);
        const n = rng.int(2, 7);
        return {
          expr: `(${v} + ${a})²`,
          env: { [v]: n },
          ans: (n + a) ** 2,
          wrong: [
            [n * n + a * a, "squared-each-term"],
            [2 * (n + a), "exponent-as-multiplication"],
            [n * n + a, "ignored-parentheses"],
          ],
        };
      },
    },
    {
      lv: 3,
      w: 2,
      gen(/** @type {any} */ rng) {
        const [v] = letters(rng, 1);
        const a = rng.int(2, 5);
        const n = rng.int(2, 8);
        return {
          expr: `(${a}${v})²`,
          env: { [v]: n },
          ans: (a * n) ** 2,
          wrong: [
            [a * n * n, "ignored-parentheses"],
            [2 * a * n, "exponent-as-multiplication"],
          ],
        };
      },
    },
    {
      lv: 3,
      w: 4,
      gen(/** @type {any} */ rng) {
        const [x, y] = letters(rng, 2);
        const a = rng.int(2, 9);
        const b = rng.int(2, 9);
        const nx = rng.int(1, 9);
        const ny = rng.int(1, 9);
        return {
          expr: `${a}${x} + ${b}${y}`,
          env: { [x]: nx, [y]: ny },
          ans: a * nx + b * ny,
          wrong: [
            [a * ny + b * nx, "swapped-values"],
            [Number(`${a}${nx}`) + b * ny, "concatenated-coefficient"],
            [a + nx + b + ny, "treated-as-addition"],
          ],
        };
      },
    },
    {
      lv: 3,
      w: 3,
      gen(/** @type {any} */ rng) {
        const [x, y] = letters(rng, 2);
        const a = rng.int(3, 9);
        const b = rng.int(2, 6);
        const nx = rng.int(3, 9);
        const ny = rng.int(1, 5);
        return {
          expr: `${a}${x} − ${b}${y}`,
          env: { [x]: nx, [y]: ny },
          ans: a * nx - b * ny,
          wrong: [
            [a * ny - b * nx, "swapped-values"],
            [a * nx + b * ny, "used-wrong-operation"],
            [(a - b) * nx * ny, "subtracted-first"],
          ],
        };
      },
    },
    {
      lv: 3,
      w: 3,
      gen(/** @type {any} */ rng) {
        const [x, y] = letters(rng, 2);
        const a = rng.int(2, 8);
        const nx = rng.int(1, 9);
        const ny = rng.int(1, 9);
        return {
          expr: `${a}(${x} + ${y})`,
          env: { [x]: nx, [y]: ny },
          ans: a * (nx + ny),
          wrong: [
            [a * nx + ny, "ignored-parentheses"],
            [a + nx + ny, "treated-as-addition"],
          ],
        };
      },
    },
    {
      lv: 3,
      w: 2,
      gen(/** @type {any} */ rng) {
        const [x, y] = letters(rng, 2);
        const a = rng.int(2, 6);
        const nx = rng.int(2, 6);
        const ny = rng.int(2, 7);
        return {
          expr: `${a}${x}${y}`,
          env: { [x]: nx, [y]: ny },
          ans: a * nx * ny,
          wrong: [
            [a + nx + ny, "treated-as-addition"],
            [a * nx + ny, "treated-as-addition"],
            [Number(`${a}${nx}${ny}`), "concatenated-coefficient"],
          ],
        };
      },
    },
    // level 4: two letters with powers
    {
      lv: 4,
      w: 3,
      gen(/** @type {any} */ rng) {
        const [x, y] = letters(rng, 2);
        const b = rng.int(2, 9);
        const nx = rng.int(2, 8);
        const ny = rng.int(2, 8);
        return {
          expr: `${x}² + ${b}${y}`,
          env: { [x]: nx, [y]: ny },
          ans: nx * nx + b * ny,
          wrong: [
            [2 * nx + b * ny, "exponent-as-multiplication"],
            [nx * nx + b + ny, "treated-as-addition"],
            [(nx * nx + b) * ny, "order-of-operations"],
          ],
        };
      },
    },
    {
      lv: 4,
      w: 3,
      gen(/** @type {any} */ rng) {
        const [x, y] = letters(rng, 2);
        const a = rng.int(2, 5);
        const nx = rng.int(2, 7);
        const ny = rng.int(1, a * nx * nx - 1);
        return {
          expr: `${a}${x}² − ${y}`,
          env: { [x]: nx, [y]: Math.min(ny, 30) },
          ans: a * nx * nx - Math.min(ny, 30),
          wrong: [
            [(a * nx) ** 2 - Math.min(ny, 30), "squared-the-coefficient"],
            [2 * a * nx - Math.min(ny, 30), "exponent-as-multiplication"],
            [a * nx * nx + Math.min(ny, 30), "used-wrong-operation"],
          ],
        };
      },
    },
    {
      lv: 4,
      w: 3,
      gen(/** @type {any} */ rng) {
        const [x, y] = letters(rng, 2);
        const nx = rng.int(1, 6);
        const ny = rng.int(1, 6);
        return {
          expr: `(${x} + ${y})²`,
          env: { [x]: nx, [y]: ny },
          ans: (nx + ny) ** 2,
          wrong: [
            [nx * nx + ny * ny, "squared-each-term"],
            [2 * (nx + ny), "exponent-as-multiplication"],
            [nx * nx + ny, "ignored-parentheses"],
            [nx + ny * ny, "ignored-parentheses"],
          ],
        };
      },
    },
    {
      lv: 4,
      w: 2,
      gen(/** @type {any} */ rng) {
        const [x, y] = letters(rng, 2);
        const a = rng.int(2, 6);
        const b = rng.int(1, 12);
        const nx = rng.int(2, 7);
        const ny = rng.int(2, 7);
        return {
          expr: `${a}${x}${y} + ${b}`,
          env: { [x]: nx, [y]: ny },
          ans: a * nx * ny + b,
          wrong: [
            [a + nx + ny + b, "treated-as-addition"],
            [a * nx + ny + b, "treated-as-addition"],
            [a * nx * (ny + b), "added-before-multiplying"],
          ],
        };
      },
    },
    {
      lv: 4,
      w: 2,
      gen(/** @type {any} */ rng) {
        const [x, y] = letters(rng, 2);
        const nx = rng.int(2, 8);
        const ny = rng.int(2, 8);
        return {
          expr: `${x}² + ${y}²`,
          env: { [x]: nx, [y]: ny },
          ans: nx * nx + ny * ny,
          wrong: [
            [2 * nx + 2 * ny, "exponent-as-multiplication"],
            [(nx + ny) ** 2, "order-of-operations"],
            [nx + ny, "forgot-the-power"],
          ],
        };
      },
    },
  ];

  /** a plain evaluation item from the symbolic table */
  function kindSymbolic(/** @type {any} */ rng, /** @type {number} */ level) {
    const forms = EVAL_FORMS.filter((f) => f.lv === level);
    const f = pickBy(
      rng,
      forms.map((x) => [x, x.w]),
    );
    const r = f.gen(rng);
    return numx({
      q: evalStem(rng, r.expr, r.env),
      ans: r.ans,
      wrong: wrongVals(r.wrong),
      x: evalWork(r.expr, r.env, r.ans),
      h: evalHints(r.expr, r.env),
      meta: { kind: "eval", expr: r.expr, env: r.env, inStem: true },
    });
  }

  /** level 1 recognition: which line shows the substitution? */
  function kindSubst(/** @type {any} */ rng) {
    const [v] = letters(rng, 1);
    const a = rng.int(2, 9);
    const n = rng.int(2, 9);
    const b = rng.int(1, 9);
    const expr = `${a}${v} + ${b}`;
    const env = { [v]: n };
    const key = `${a} × ${n} + ${b}`;
    const kv = a * n + b;
    return mcx(rng, {
      q: [
        `Which shows the result of replacing ${v} with ${n} in ${expr}?`,
        `¿Cuál muestra el resultado de reemplazar ${v} por ${n} en ${expr}?`,
      ],
      key: { v: key },
      wrong: [
        { v: `${a}${n} + ${b}`, tag: "concatenated-coefficient" },
        { v: `${a} + ${n} + ${b}`, tag: "treated-as-addition" },
        { v: `${a} × (${n} + ${b})`, tag: "added-before-multiplying" },
        { v: `${b} × ${n} + ${a}`, tag: "swapped-numbers" },
      ].map((w) => ({ ...w, f: fb(w.tag) })),
      ok: (t) => !near(val(t), kv),
      x: [
        `Replace ${v} with ${n} and keep the multiplication sign that was hiding between ${a} and ${v}: ${key}. The ${b} stays where it was.`,
        `Reemplaza ${v} por ${n} y conserva el signo de multiplicación que estaba escondido entre ${a} y ${v}: ${key}. El ${b} se queda donde estaba.`,
      ],
      h: [
        [
          "Replacing a letter means writing its number in the same place.",
          "Reemplazar una letra significa escribir su número en el mismo lugar.",
        ],
        [
          `A number next to a letter means multiply. Which sign is hiding between ${a} and ${v}?`,
          `Un número junto a una letra significa multiplicar. ¿Qué signo está escondido entre ${a} y ${v}?`,
        ],
        [
          `Only the letter changes. Everything else in ${expr} stays the same.`,
          `Solo cambia la letra. Todo lo demás en ${expr} se queda igual.`,
        ],
      ],
      meta: { kind: "subst", expr, env },
    });
  }

  const WHOLE_TERM = /** @type {Record<string, [string, string]>} */ ({
    coefficient: [
      "That is a whole term, the number and the letter together. The coefficient is only the number.",
      "Eso es un término completo, el número y la letra juntos. El coeficiente es solo el número.",
    ],
    constant: [
      "That term has a letter in it. The constant is the number that stands alone.",
      "Ese término tiene una letra. La constante es el número que está solo.",
    ],
    variable: [
      "That is a whole term, a number and a letter together. The variable is only the letter.",
      "Eso es un término completo, un número y una letra juntos. La variable es solo la letra.",
    ],
  });
  /** level 1 recognition: name the coefficient, the constant or the variable */
  function kindAnatomy(/** @type {any} */ rng) {
    const [v] = letters(rng, 1);
    const a = rng.int(2, 9);
    const b = rng.int(2, 9);
    if (a === b) return null;
    const expr = rng.chance(0.5) ? `${a}${v} + ${b}` : `${b} + ${a}${v}`;
    const part = rng.pick(["coefficient", "constant", "variable"]);
    const P = /** @type {any} */ ({
      coefficient: {
        key: `${a}`,
        es: "el coeficiente",
        wrong: [
          [`${b}`, "confused-coefficient-constant"],
          [v, "confused-variable-number"],
          [`${a}${v}`, "named-whole-term"],
        ],
      },
      constant: {
        key: `${b}`,
        es: "la constante",
        wrong: [
          [`${a}`, "confused-coefficient-constant"],
          [v, "confused-variable-number"],
          [`${a}${v}`, "named-whole-term"],
        ],
      },
      variable: {
        key: v,
        es: "la variable",
        wrong: [
          [`${a}`, "confused-variable-number"],
          [`${b}`, "confused-variable-number"],
          [`${a}${v}`, "named-whole-term"],
        ],
      },
    })[part];
    return mcx(rng, {
      q: [`In ${expr}, what is the ${part}?`, `En ${expr}, ¿cuál es ${P.es}?`],
      key: { v: P.key },
      wrong: P.wrong.map(([t, tag]) => ({
        v: t,
        tag,
        f: tag === "named-whole-term" ? WHOLE_TERM[part] : fb(tag),
      })),
      x: [
        `In ${expr}, the coefficient is ${a} (the number that multiplies the letter), the constant is ${b} (the number that stands alone) and the variable is ${v} (the letter).`,
        `En ${expr}, el coeficiente es ${a} (el número que multiplica a la letra), la constante es ${b} (el número que está solo) y la variable es ${v} (la letra).`,
      ],
      h: [
        [
          "The coefficient multiplies a letter. The constant stands alone. The variable is the letter.",
          "El coeficiente multiplica a una letra. La constante está sola. La variable es la letra.",
        ],
        [
          `Find the part of ${expr} that has a letter, and the part that does not.`,
          `Busca la parte de ${expr} que tiene una letra y la parte que no la tiene.`,
        ],
        [
          "Read the word in the question again and match it to one piece.",
          "Vuelve a leer la palabra de la pregunta y relaciónala con una sola pieza.",
        ],
      ],
      meta: { kind: "anatomy", expr, part, a, b, v },
    });
  }

  /* ---- word situations: one scenario feeds a typed "write, then evaluate" item or a "which expression" item ---- */
  const RATE = [
    {
      v: "t",
      a: [5, 15],
      b: [2, 8],
      n: [2, 9],
      s: (/** @type {number} */ a, /** @type {number} */ b) => [
        `A concert ticket costs $${a}. The website adds one $${b} service fee to the whole order.`,
        `Un boleto de concierto cuesta $${a}. El sitio web agrega una sola cuota de servicio de $${b} a todo el pedido.`,
      ],
      let: ["the number of tickets", "el número de boletos"],
      ask: ["the total cost in dollars", "el costo total en dólares"],
    },
    {
      v: "m",
      a: [2, 5],
      b: [3, 8],
      n: [3, 12],
      s: (/** @type {number} */ a, /** @type {number} */ b) => [
        `A taxi ride costs $${b} to start, plus $${a} for each mile.`,
        `Un viaje en taxi cuesta $${b} para empezar, más $${a} por cada milla.`,
      ],
      let: ["the number of miles", "el número de millas"],
      ask: ["the total cost in dollars", "el costo total en dólares"],
    },
    {
      v: "m",
      a: [10, 25],
      b: [10, 40],
      n: [2, 9],
      s: (/** @type {number} */ a, /** @type {number} */ b) => [
        `A gym charges $${a} each month plus a one-time $${b} sign-up fee.`,
        `Un gimnasio cobra $${a} cada mes más una cuota de inscripción única de $${b}.`,
      ],
      let: ["the number of months", "el número de meses"],
      ask: ["the total cost in dollars", "el costo total en dólares"],
    },
    {
      v: "p",
      a: [8, 14],
      b: [2, 5],
      n: [2, 9],
      s: (/** @type {number} */ a, /** @type {number} */ b) => [
        `Each pizza costs $${a}. Delivery is a flat $${b} for the whole order.`,
        `Cada pizza cuesta $${a}. La entrega cuesta $${b} fijos por todo el pedido.`,
      ],
      let: ["the number of pizzas", "el número de pizzas"],
      ask: ["the total cost in dollars", "el costo total en dólares"],
    },
    {
      v: "k",
      a: [2, 5],
      b: [3, 7],
      n: [4, 15],
      s: (/** @type {number} */ a, /** @type {number} */ b) => [
        `Photo prints cost $${a} each. Shipping is a flat $${b}.`,
        `Cada foto impresa cuesta $${a}. El envío cuesta $${b} fijos.`,
      ],
      let: ["the number of prints", "el número de fotos impresas"],
      ask: ["the total cost in dollars", "el costo total en dólares"],
    },
    {
      v: "h",
      a: [15, 45],
      b: [20, 50],
      n: [2, 8],
      s: (/** @type {number} */ a, /** @type {number} */ b) => [
        `A bus company charges $${a} for each hour plus a $${b} driver fee.`,
        `Una empresa de autobuses cobra $${a} por cada hora más $${b} por el conductor.`,
      ],
      let: ["the number of hours", "el número de horas"],
      ask: ["the total cost in dollars", "el costo total en dólares"],
    },
    {
      v: "d",
      a: [6, 15],
      b: [5, 20],
      n: [3, 10],
      s: (/** @type {number} */ a, /** @type {number} */ b) => [
        `Kai earns $${a} for each dog he walks, plus a $${b} bonus for the week.`,
        `Kai gana $${a} por cada perro que pasea, más una bonificación de $${b} por la semana.`,
      ],
      let: ["the number of dogs", "el número de perros"],
      ask: ["Kai's pay in dollars", "el pago de Kai en dólares"],
    },
  ];
  const LEFT = [
    {
      v: "s",
      a: [2, 6],
      n: [2, 8],
      r: [1, 15],
      s: (/** @type {number} */ a, /** @type {number} */ b) => [
        `Lena has a $${b} gift card. Each snack she buys costs $${a}.`,
        `Lena tiene una tarjeta de regalo de $${b}. Cada bocadillo que compra cuesta $${a}.`,
      ],
      let: ["the number of snacks she buys", "el número de bocadillos que compra"],
      ask: ["the dollars left on the card", "los dólares que quedan en la tarjeta"],
    },
    {
      v: "d",
      a: [8, 25],
      n: [2, 9],
      r: [5, 40],
      s: (/** @type {number} */ a, /** @type {number} */ b) => [
        `A book has ${b} pages. Omar reads ${a} pages each day.`,
        `Un libro tiene ${b} páginas. Omar lee ${a} páginas cada día.`,
      ],
      let: ["the number of days Omar reads", "el número de días que Omar lee"],
      ask: ["the number of pages left to read", "el número de páginas que quedan por leer"],
    },
    {
      v: "h",
      a: [3, 9],
      n: [2, 10],
      r: [5, 30],
      s: (/** @type {number} */ a, /** @type {number} */ b) => [
        `A water tank holds ${b} liters. It leaks ${a} liters every hour.`,
        `Un tanque de agua tiene ${b} litros. Pierde ${a} litros cada hora.`,
      ],
      let: ["the number of hours", "el número de horas"],
      ask: ["the liters left in the tank", "los litros que quedan en el tanque"],
    },
    {
      v: "w",
      a: [4, 12],
      n: [2, 8],
      r: [5, 30],
      s: (/** @type {number} */ a, /** @type {number} */ b) => [
        `Dev has $${b} saved. He spends $${a} each week on lunch.`,
        `Dev tiene $${b} ahorrados. Gasta $${a} cada semana en el almuerzo.`,
      ],
      let: ["the number of weeks", "el número de semanas"],
      ask: ["the dollars Dev has left", "los dólares que le quedan a Dev"],
    },
    {
      v: "s",
      a: [2, 5],
      n: [3, 12],
      r: [2, 20],
      s: (/** @type {number} */ a, /** @type {number} */ b) => [
        `A teacher has ${b} stickers. She gives ${a} stickers to each student in a group.`,
        `Una maestra tiene ${b} calcomanías. Le da ${a} calcomanías a cada estudiante de un grupo.`,
      ],
      let: ["the number of students in the group", "el número de estudiantes del grupo"],
      ask: ["the stickers the teacher has left", "las calcomanías que le quedan a la maestra"],
    },
    {
      v: "h",
      a: [5, 15],
      n: [2, 5],
      r: [5, 25],
      s: (/** @type {number} */ a, /** @type {number} */ b) => [
        `A tablet battery starts at ${b}%. It loses ${a}% every hour of video.`,
        `La batería de una tableta empieza en ${b}%. Pierde ${a}% por cada hora de video.`,
      ],
      let: ["the number of hours of video", "el número de horas de video"],
      ask: ["the battery percent left", "el porcentaje de batería que queda"],
    },
  ];
  const TWO = [
    {
      x: "a",
      y: "c",
      a: [6, 14],
      b: [3, 8],
      s: (/** @type {number} */ a, /** @type {number} */ b) => [
        `Adult tickets cost $${a} and child tickets cost $${b}. Let a be the number of adult tickets and c the number of child tickets.`,
        `Los boletos de adulto cuestan $${a} y los de niño cuestan $${b}. Sea a el número de boletos de adulto y c el número de boletos de niño.`,
      ],
      ask: ["the total cost in dollars", "el costo total en dólares"],
    },
    {
      x: "p",
      y: "n",
      a: [1, 3],
      b: [2, 5],
      s: (/** @type {number} */ a, /** @type {number} */ b) => [
        `A pencil costs $${a} and a notebook costs $${b}. Let p be the number of pencils and n the number of notebooks.`,
        `Un lápiz cuesta $${a} y un cuaderno cuesta $${b}. Sea p el número de lápices y n el número de cuadernos.`,
      ],
      ask: ["the total cost in dollars", "el costo total en dólares"],
    },
    {
      x: "a",
      y: "p",
      a: [3, 7],
      b: [4, 9],
      s: (/** @type {number} */ a, /** @type {number} */ b) => [
        `Apples cost $${a} per bag and pears cost $${b} per bag. Let a be the number of bags of apples and p the number of bags of pears.`,
        `Las manzanas cuestan $${a} por bolsa y las peras cuestan $${b} por bolsa. Sea a el número de bolsas de manzanas y p el número de bolsas de peras.`,
      ],
      ask: ["the total cost in dollars", "el costo total en dólares"],
    },
    {
      x: "s",
      y: "m",
      a: [3, 5],
      b: [5, 8],
      s: (/** @type {number} */ a, /** @type {number} */ b) => [
        `A small smoothie costs $${a} and a medium smoothie costs $${b}. Let s be the number of small smoothies and m the number of medium smoothies sold.`,
        `Un licuado pequeño cuesta $${a} y un licuado mediano cuesta $${b}. Sea s el número de licuados pequeños y m el número de licuados medianos vendidos.`,
      ],
      ask: ["the money collected in dollars", "el dinero recaudado en dólares"],
    },
    {
      x: "b",
      y: "n",
      a: [8, 15],
      b: [20, 35],
      s: (/** @type {number} */ a, /** @type {number} */ b) => [
        `A bracelet uses ${a} beads and a necklace uses ${b} beads. Let b be the number of bracelets and n the number of necklaces.`,
        `Una pulsera usa ${a} cuentas y un collar usa ${b} cuentas. Sea b el número de pulseras y n el número de collares.`,
      ],
      ask: ["the total number of beads", "el número total de cuentas"],
    },
    {
      x: "s",
      y: "c",
      a: [5, 12],
      b: [2, 4],
      s: (/** @type {number} */ a, /** @type {number} */ b) => [
        `In a game, a star is worth ${a} points and a coin is worth ${b} points. Let s be the number of stars and c the number of coins collected.`,
        `En un juego, una estrella vale ${a} puntos y una moneda vale ${b} puntos. Sea s el número de estrellas y c el número de monedas recogidas.`,
      ],
      ask: ["the total points", "el total de puntos"],
    },
  ];
  const times = (/** @type {number} */ a) =>
    a === 2 ? ["twice", "el doble de"] : [`${a} times`, `${a} veces`];
  /** phrase translations: each draws its own numbers, and lists named wrong expressions */
  const PHRASES = [
    {
      form: "p1",
      gen: (/** @type {any} */ rng) => ({
        a: rng.int(2, 6),
        b: rng.int(2, 9),
        n: rng.int(2, 9),
      }),
      en: (/** @type {any} */ p) => `${p.b} more than ${times(p.a)[0]} a number ${p.v}`,
      es: (/** @type {any} */ p) => `${p.b} más que ${times(p.a)[1]} un número ${p.v}`,
      key: (/** @type {any} */ p) => `${p.a}${p.v} + ${p.b}`,
      wrong: (/** @type {any} */ p) => [
        [`${p.a}(${p.v} + ${p.b})`, "added-before-multiplying"],
        [`${p.b}${p.v} + ${p.a}`, "swapped-numbers"],
        [`${p.a}${p.v} − ${p.b}`, "used-wrong-operation"],
        [`${p.a + p.b}${p.v}`, "combined-unlike-terms"],
      ],
    },
    {
      form: "p2",
      gen: (/** @type {any} */ rng) => {
        const a = rng.int(2, 6);
        const n = rng.int(3, 9);
        return { a, n, b: rng.int(1, Math.min(12, a * n - 1)) };
      },
      en: (/** @type {any} */ p) => `${p.b} less than ${times(p.a)[0]} a number ${p.v}`,
      es: (/** @type {any} */ p) => `${p.b} menos que ${times(p.a)[1]} un número ${p.v}`,
      key: (/** @type {any} */ p) => `${p.a}${p.v} − ${p.b}`,
      wrong: (/** @type {any} */ p) => [
        [`${p.b} − ${p.a}${p.v}`, "reversed-subtraction"],
        [`${p.a}${p.v} + ${p.b}`, "used-wrong-operation"],
        [`${p.a}(${p.v} − ${p.b})`, "grouped-too-much"],
        [`(${p.a} − ${p.b})${p.v}`, "subtracted-first"],
      ],
    },
    {
      form: "p3",
      gen: (/** @type {any} */ rng) => ({
        a: rng.int(2, 6),
        b: rng.int(1, 9),
        n: rng.int(2, 9),
      }),
      en: (/** @type {any} */ p) => `${times(p.a)[0]} the sum of a number ${p.v} and ${p.b}`,
      es: (/** @type {any} */ p) => `${times(p.a)[1]} la suma de un número ${p.v} y ${p.b}`,
      key: (/** @type {any} */ p) => `${p.a}(${p.v} + ${p.b})`,
      wrong: (/** @type {any} */ p) => [
        [`${p.a}${p.v} + ${p.b}`, "missing-parentheses"],
        [`${p.a} + ${p.v} + ${p.b}`, "treated-as-addition"],
        [`(${p.a} + ${p.b})${p.v}`, "added-outside-factor"],
      ],
    },
    {
      form: "p4",
      gen: (/** @type {any} */ rng) => {
        const b = rng.int(1, 6);
        return { a: rng.int(2, 6), b, n: b + rng.int(1, 7) };
      },
      en: (/** @type {any} */ p) => `${times(p.a)[0]} the difference of a number ${p.v} and ${p.b}`,
      es: (/** @type {any} */ p) => `${times(p.a)[1]} la diferencia de un número ${p.v} y ${p.b}`,
      key: (/** @type {any} */ p) => `${p.a}(${p.v} − ${p.b})`,
      wrong: (/** @type {any} */ p) => [
        [`${p.a}${p.v} − ${p.b}`, "missing-parentheses"],
        [`${p.a}(${p.b} − ${p.v})`, "reversed-subtraction"],
        [`${p.a}(${p.v} + ${p.b})`, "used-wrong-operation"],
      ],
    },
    {
      form: "p5",
      gen: (/** @type {any} */ rng) => {
        const a = rng.int(2, 6);
        return { a, b: rng.int(1, 9), n: a * rng.int(2, 8) };
      },
      en: (/** @type {any} */ p) => `a number ${p.v} divided by ${p.a}, plus ${p.b}`,
      es: (/** @type {any} */ p) => `un número ${p.v} dividido entre ${p.a}, más ${p.b}`,
      key: (/** @type {any} */ p) => `${p.v} ÷ ${p.a} + ${p.b}`,
      wrong: (/** @type {any} */ p) => [
        [`${p.v} ÷ (${p.a} + ${p.b})`, "grouped-too-much"],
        [`${p.a} ÷ ${p.v} + ${p.b}`, "reversed-division"],
        [`${p.a}${p.v} + ${p.b}`, "used-wrong-operation"],
      ],
    },
    {
      form: "p6",
      gen: (/** @type {any} */ rng) => ({ b: rng.int(1, 12), n: rng.int(2, 9) }),
      en: (/** @type {any} */ p) => `the square of a number ${p.v}, plus ${p.b}`,
      es: (/** @type {any} */ p) => `el cuadrado de un número ${p.v}, más ${p.b}`,
      key: (/** @type {any} */ p) => `${p.v}² + ${p.b}`,
      wrong: (/** @type {any} */ p) => [
        [`2${p.v} + ${p.b}`, "exponent-as-multiplication"],
        [`(${p.v} + ${p.b})²`, "grouped-too-much"],
        [`${p.v}² − ${p.b}`, "used-wrong-operation"],
      ],
    },
  ];
  /** what each scenario means, as plain arithmetic: check() compares the displayed expression against this */
  const CLOSED = /** @type {Record<string, (p: any, e: Record<string, number>) => number>} */ ({
    rate: (p, e) => p.a * e[p.v] + p.b,
    left: (p, e) => p.b - p.a * e[p.v],
    p1: (p, e) => p.a * e[p.v] + p.b,
    p2: (p, e) => p.a * e[p.v] - p.b,
    p3: (p, e) => p.a * (e[p.v] + p.b),
    p4: (p, e) => p.a * (e[p.v] - p.b),
    p5: (p, e) => e[p.v] / p.a + p.b,
    p6: (p, e) => e[p.v] ** 2 + p.b,
    two: (p, e) => p.a * e[p.x] + p.b * e[p.y],
  });
  const range = (/** @type {any} */ rng, /** @type {number[]} */ r) => rng.int(r[0], r[1]);

  function scenario(/** @type {any} */ rng) {
    const kind = pickBy(rng, [
      ["rate", 28],
      ["left", 17],
      ["phrase", 35],
      ["two", 20],
    ]);
    if (kind === "rate") {
      const c = rng.pick(RATE);
      const a = range(rng, c.a);
      const b = range(rng, c.b);
      const n = range(rng, c.n);
      const v = c.v;
      const [s0, s1] = c.s(a, b);
      return {
        form: "rate",
        p: { a, b, v },
        env: { [v]: n },
        key: `${a}${v} + ${b}`,
        wrong: [
          [`${b}${v} + ${a}`, "swapped-numbers"],
          [`${a}${v} + ${b}${v}`, "flat-fee-multiplied"],
          [`${a} + ${b} + ${v}`, "added-all-numbers"],
          [`${a + b}${v}`, "combined-unlike-terms"],
          [`${a}(${v} + ${b})`, "added-before-multiplying"],
        ],
        numQ: [
          `${s0} Let ${v} be ${c.let[0]}. Write an expression for ${c.ask[0]}, then find its value when ${v} = ${n}.`,
          `${s1} Sea ${v} ${c.let[1]}. Escribe una expresión para ${c.ask[1]} y luego halla su valor cuando ${v} = ${n}.`,
        ],
        mcQ: [
          `${s0} Let ${v} be ${c.let[0]}. Which expression gives ${c.ask[0]}?`,
          `${s1} Sea ${v} ${c.let[1]}. ¿Qué expresión da ${c.ask[1]}?`,
        ],
        why: [
          `${a} is the amount for each one, so it is multiplied by ${v}. ${b} happens only once, so it is added.`,
          `${a} es la cantidad por cada uno, así que se multiplica por ${v}. ${b} ocurre una sola vez, así que se suma.`,
        ],
      };
    }
    if (kind === "left") {
      const c = rng.pick(LEFT);
      const a = range(rng, c.a);
      const n = range(rng, c.n);
      const v = c.v;
      const b = Math.min(a * n + range(rng, c.r), c.ask[0].includes("battery") ? 100 : 999);
      if (b <= a * n) return null;
      const [s0, s1] = c.s(a, b);
      return {
        form: "left",
        p: { a, b, v },
        env: { [v]: n },
        key: `${b} − ${a}${v}`,
        wrong: [
          [`${a}${v} − ${b}`, "reversed-subtraction"],
          [`(${b} − ${a})${v}`, "subtracted-first"],
          [`${b} + ${a}${v}`, "used-wrong-operation"],
          [`${b}${v} − ${a}`, "swapped-numbers"],
          [`${b} − ${a} − ${v}`, "variable-not-multiplied"],
        ],
        numQ: [
          `${s0} Let ${v} be ${c.let[0]}. Write an expression for ${c.ask[0]}, then find its value when ${v} = ${n}.`,
          `${s1} Sea ${v} ${c.let[1]}. Escribe una expresión para ${c.ask[1]} y luego halla su valor cuando ${v} = ${n}.`,
        ],
        mcQ: [
          `${s0} Let ${v} be ${c.let[0]}. Which expression gives ${c.ask[0]}?`,
          `${s1} Sea ${v} ${c.let[1]}. ¿Qué expresión da ${c.ask[1]}?`,
        ],
        why: [
          `Start with ${b} and take away ${a} for each one, so ${a} is multiplied by ${v} and then subtracted from ${b}.`,
          `Se empieza con ${b} y se quitan ${a} por cada uno, así que ${a} se multiplica por ${v} y luego se resta de ${b}.`,
        ],
      };
    }
    if (kind === "phrase") {
      const f = rng.pick(PHRASES);
      const [v] = letters(rng, 1);
      const p = { ...f.gen(rng), v };
      const phrase = [f.en(p), f.es(p)];
      return {
        form: f.form,
        p,
        env: { [v]: p.n },
        key: f.key(p),
        wrong: f.wrong(p),
        numQ: [
          `Write an expression for “${phrase[0]}”. Then find its value when ${v} = ${p.n}.`,
          `Escribe una expresión para “${phrase[1]}”. Luego halla su valor cuando ${v} = ${p.n}.`,
        ],
        mcQ: [`Which expression means “${phrase[0]}”?`, `¿Qué expresión significa “${phrase[1]}”?`],
        why: [
          `The words “${phrase[0]}” give the order of the operations.`,
          `Las palabras “${phrase[1]}” dan el orden de las operaciones.`,
        ],
      };
    }
    const c = rng.pick(TWO);
    const a = range(rng, c.a);
    const b = range(rng, c.b);
    if (a === b) return null;
    const nx = rng.int(2, 8);
    const ny = rng.int(2, 8);
    if (nx === ny) return null;
    const [s0, s1] = c.s(a, b);
    return {
      form: "two",
      p: { a, b, x: c.x, y: c.y },
      env: { [c.x]: nx, [c.y]: ny },
      key: `${a}${c.x} + ${b}${c.y}`,
      wrong: [
        [`${b}${c.x} + ${a}${c.y}`, "swapped-numbers"],
        [`${a + b}${c.x}${c.y}`, "combined-unlike-terms"],
        [`${a} + ${b} + ${c.x} + ${c.y}`, "added-all-numbers"],
        [`${a}${c.x} + ${b}`, "variable-not-multiplied"],
      ],
      numQ: [
        `${s0} Write an expression for ${c.ask[0]}, then find its value when ${c.x} = ${nx} and ${c.y} = ${ny}.`,
        `${s1} Escribe una expresión para ${c.ask[1]} y luego halla su valor cuando ${c.x} = ${nx} y ${c.y} = ${ny}.`,
      ],
      mcQ: [`${s0} Which expression gives ${c.ask[0]}?`, `${s1} ¿Qué expresión da ${c.ask[1]}?`],
      why: [
        `${a} is the amount for each ${c.x} and ${b} is the amount for each ${c.y}, so each is multiplied by its own letter and the two amounts are added.`,
        `${a} es la cantidad por cada ${c.x} y ${b} es la cantidad por cada ${c.y}, así que cada una se multiplica por su propia letra y las dos cantidades se suman.`,
      ],
    };
  }
  const scenarioHints = (/** @type {any} */ s, /** @type {boolean} */ evaluate) => {
    const [en, es] = withVals(s.env);
    const family = s.form.startsWith("p") ? "phrase" : s.form === "two" ? "two" : "story";
    const first = {
      phrase: [
        "Circle the key words (more than, less than, times, sum, difference) and decide the order.",
        "Encierra las palabras clave (más que, menos que, veces, suma, diferencia) y decide el orden.",
      ],
      two: [
        "Find the amount for one of each kind of item.",
        "Busca la cantidad para uno de cada tipo de artículo.",
      ],
      story: [
        "Decide which amount repeats for each one and which amount happens only once.",
        "Decide qué cantidad se repite por cada uno y cuál ocurre una sola vez.",
      ],
    }[family];
    const second = {
      phrase: [
        "Each phrase has two operations. Decide which comes first in the words. Use parentheses when a sum or a difference is multiplied.",
        "Cada frase tiene dos operaciones. Decide cuál va primero en las palabras. Usa paréntesis cuando se multiplica una suma o una diferencia.",
      ],
      two: [
        "Multiply each amount by its own letter, then put the two products together.",
        "Multiplica cada cantidad por su propia letra y luego junta los dos productos.",
      ],
      story: [
        "The amount that repeats is multiplied by the letter. The amount that happens once is added or subtracted.",
        "La cantidad que se repite se multiplica por la letra. La cantidad que ocurre una sola vez se suma o se resta.",
      ],
    }[family];
    return [
      first,
      second,
      evaluate
        ? [
            `Write the expression, replace the letters using ${en}, and follow the order of operations.`,
            `Escribe la expresión, reemplaza las letras con ${es} y sigue el orden de las operaciones.`,
          ]
        : [
            "Test a choice: put in a small number for the letter and check it against the situation.",
            "Prueba una opción: pon un número pequeño en lugar de la letra y compáralo con la situación.",
          ],
    ];
  };

  function kindScenarioNum(/** @type {any} */ rng) {
    const s = scenario(rng);
    if (!s) return null;
    const ans = CLOSED[s.form](s.p, s.env);
    const [en, es] = withVals(s.env);
    const c = chainText(s.key, s.env);
    return numx({
      q: s.numQ,
      ans,
      wrong: wrongVals(s.wrong.map(([e, tag]) => [val(e, s.env), tag])),
      x: [
        `${s.why[0]} The expression is ${s.key}. With ${en}: ${c}. The value is ${N(ans)}.`,
        `${s.why[1]} La expresión es ${s.key}. Con ${es}: ${c}. El valor es ${N(ans)}.`,
      ],
      h: scenarioHints(s, true),
      meta: {
        kind: "story",
        form: s.form,
        p: s.p,
        expr: s.key,
        env: s.env,
        inStem: false,
      },
    });
  }
  function kindScenarioMc(/** @type {any} */ rng) {
    const s = scenario(rng);
    if (!s) return null;
    return mcx(rng, {
      q: s.mcQ,
      key: { v: s.key },
      wrong: s.wrong.map(([e, tag]) => ({ v: e, tag, f: fb(tag) })),
      ok: (t) => !same(t, s.key),
      apart: (a, b) => !same(a, b),
      x: [`${s.why[0]} The expression is ${s.key}.`, `${s.why[1]} La expresión es ${s.key}.`],
      h: scenarioHints(s, false),
      meta: { kind: "write", form: s.form, p: s.p },
    });
  }

  /* ---- level 4: work backward ------------------------------------------------------------------------------- */
  const REV = [
    {
      w: 3,
      gen(/** @type {any} */ rng, /** @type {string} */ v) {
        const a = rng.int(2, 9);
        const n = rng.int(2, 12);
        const b = rng.int(1, 20);
        const T = a * n + b;
        return {
          expr: `${a}${v} + ${b}`,
          n,
          T,
          wrong: [
            [T - b, "undid-one-step"],
            [(T + b) / a, "wrong-inverse"],
            [T / a, "undid-one-step"],
          ],
          h2: [
            `The last operation in ${a}${v} + ${b} is + ${b}. Undo it: subtract ${b} from ${T}.`,
            `La última operación en ${a}${v} + ${b} es + ${b}. Deshazla: resta ${b} de ${T}.`,
          ],
          h3: [
            `Now ${a} times the letter equals what is left. What number times ${a} gives it?`,
            `Ahora ${a} por la letra es igual a lo que queda. ¿Qué número por ${a} da ese resultado?`,
          ],
          work: [
            `Work backward: ${T} − ${b} = ${T - b}, then ${T - b} ÷ ${a} = ${n}.`,
            `Trabaja hacia atrás: ${T} − ${b} = ${T - b}, luego ${T - b} ÷ ${a} = ${n}.`,
          ],
        };
      },
    },
    {
      w: 2,
      gen(/** @type {any} */ rng, /** @type {string} */ v) {
        const a = rng.int(2, 9);
        const n = rng.int(3, 12);
        const b = rng.int(1, Math.min(20, a * n - 2));
        const T = a * n - b;
        return {
          expr: `${a}${v} − ${b}`,
          n,
          T,
          wrong: [
            [T + b, "undid-one-step"],
            [(T - b) / a, "wrong-inverse"],
          ],
          h2: [
            `The last operation in ${a}${v} − ${b} is − ${b}. Undo it: add ${b} to ${T}.`,
            `La última operación en ${a}${v} − ${b} es − ${b}. Deshazla: suma ${b} a ${T}.`,
          ],
          h3: [
            `Now ${a} times the letter equals what you have. What number times ${a} gives it?`,
            `Ahora ${a} por la letra es igual a lo que tienes. ¿Qué número por ${a} da ese resultado?`,
          ],
          work: [
            `Work backward: ${T} + ${b} = ${T + b}, then ${T + b} ÷ ${a} = ${n}.`,
            `Trabaja hacia atrás: ${T} + ${b} = ${T + b}, luego ${T + b} ÷ ${a} = ${n}.`,
          ],
        };
      },
    },
    {
      w: 2,
      gen(/** @type {any} */ rng, /** @type {string} */ v) {
        const a = rng.int(2, 9);
        const n = rng.int(2, 9);
        const T = rng.int(1, 20);
        const b = a * n + T;
        return {
          expr: `${b} − ${a}${v}`,
          n,
          T,
          wrong: [
            [b - T, "undid-one-step"],
            [(b + T) / a, "wrong-inverse"],
            [T / a, "undid-one-step"],
          ],
          h2: [
            `In ${b} − ${a}${v}, the ${a}${v} is what gets taken away from ${b}. How much was taken away to leave ${T}?`,
            `En ${b} − ${a}${v}, el ${a}${v} es lo que se le quita a ${b}. ¿Cuánto se quitó para que queden ${T}?`,
          ],
          h3: [
            `Now ${a} times the letter equals the amount taken away. What number times ${a} gives it?`,
            `Ahora ${a} por la letra es igual a la cantidad que se quitó. ¿Qué número por ${a} da ese resultado?`,
          ],
          work: [
            `Work backward: ${b} − ${T} = ${b - T}, then ${b - T} ÷ ${a} = ${n}.`,
            `Trabaja hacia atrás: ${b} − ${T} = ${b - T}, luego ${b - T} ÷ ${a} = ${n}.`,
          ],
        };
      },
    },
    {
      w: 3,
      gen(/** @type {any} */ rng, /** @type {string} */ v) {
        const a = rng.int(2, 9);
        const n = rng.int(2, 12);
        const b = rng.int(1, 9);
        const T = a * (n + b);
        return {
          expr: `${a}(${v} + ${b})`,
          n,
          T,
          wrong: [
            [T / a, "undid-one-step"],
            [T - b, "order-of-operations"],
            [T / a + b, "wrong-inverse"],
          ],
          h2: [
            `${a}(${v} + ${b}) means ${a} times the whole sum. Undo the multiplying first: divide ${T} by ${a}.`,
            `${a}(${v} + ${b}) significa ${a} por toda la suma. Deshaz primero la multiplicación: divide ${T} entre ${a}.`,
          ],
          h3: [
            `Now you know what ${v} + ${b} equals. What number plus ${b} gives it?`,
            `Ahora sabes cuánto vale ${v} + ${b}. ¿Qué número más ${b} da ese resultado?`,
          ],
          work: [
            `Work backward: ${T} ÷ ${a} = ${T / a}, then ${T / a} − ${b} = ${n}.`,
            `Trabaja hacia atrás: ${T} ÷ ${a} = ${T / a}, luego ${T / a} − ${b} = ${n}.`,
          ],
        };
      },
    },
    {
      w: 2,
      gen(/** @type {any} */ rng, /** @type {string} */ v) {
        const n = rng.int(2, 11);
        const b = rng.int(1, 20);
        const T = n * n + b;
        return {
          expr: `${v}² + ${b}`,
          n,
          T,
          whole: true,
          wrong: [
            [T - b, "forgot-square-root"],
            [(T - b) / 2, "exponent-as-multiplication"],
          ],
          h2: [
            `Undo the + ${b} first: subtract ${b} from ${T}. That leaves the value of ${v}².`,
            `Deshaz primero el + ${b}: resta ${b} de ${T}. Eso deja el valor de ${v}².`,
          ],
          h3: [
            `${v}² means ${v} × ${v}. Which whole number times itself gives what is left?`,
            `${v}² significa ${v} × ${v}. ¿Qué número entero por sí mismo da lo que queda?`,
          ],
          work: [
            `Work backward: ${T} − ${b} = ${T - b}, and ${n} × ${n} = ${T - b}, so ${v} = ${n}.`,
            `Trabaja hacia atrás: ${T} − ${b} = ${T - b}, y ${n} × ${n} = ${T - b}, así que ${v} = ${n}.`,
          ],
        };
      },
    },
    {
      w: 2,
      gen(/** @type {any} */ rng, /** @type {string} */ v) {
        const a = rng.int(2, 6);
        const q = rng.int(2, 9);
        const b = rng.int(1, 12);
        const T = q + b;
        return {
          expr: `${v} ÷ ${a} + ${b}`,
          n: a * q,
          T,
          wrong: [
            [(T - b) / a, "wrong-inverse"],
            [T - b, "undid-one-step"],
            [T * a, "wrong-inverse"],
          ],
          h2: [
            `The last operation in ${v} ÷ ${a} + ${b} is + ${b}. Undo it: subtract ${b} from ${T}.`,
            `La última operación en ${v} ÷ ${a} + ${b} es + ${b}. Deshazla: resta ${b} de ${T}.`,
          ],
          h3: [
            `Now ${v} ÷ ${a} equals what is left. Which number divided by ${a} gives it?`,
            `Ahora ${v} ÷ ${a} es igual a lo que queda. ¿Qué número dividido entre ${a} da ese resultado?`,
          ],
          work: [
            `Work backward: ${T} − ${b} = ${T - b}, then ${T - b} × ${a} = ${a * q}.`,
            `Trabaja hacia atrás: ${T} − ${b} = ${T - b}, luego ${T - b} × ${a} = ${a * q}.`,
          ],
        };
      },
    },
  ];
  function kindReverse(/** @type {any} */ rng) {
    const [v] = letters(rng, 1);
    const f = pickBy(
      rng,
      REV.map((x) => [x, x.w]),
    );
    const r = f.gen(rng, v);
    const whole = r.whole
      ? [` ${v} is a whole number greater than 0.`, ` ${v} es un número entero mayor que 0.`]
      : ["", ""];
    const q = rng.chance(0.5)
      ? [
          `Find the value of ${v} that makes ${r.expr} equal to ${r.T}.${whole[0]}`,
          `Halla el valor de ${v} que hace que ${r.expr} sea igual a ${r.T}.${whole[1]}`,
        ]
      : [
          `The value of ${r.expr} is ${r.T}.${whole[0]} What is the value of ${v}?`,
          `El valor de ${r.expr} es ${r.T}.${whole[1]} ¿Cuál es el valor de ${v}?`,
        ];
    const env = { [v]: r.n };
    return numx({
      q,
      ans: r.n,
      wrong: wrongVals(r.wrong),
      x: [
        `${r.work[0]} Check: ${v} = ${r.n} gives ${chainText(r.expr, env)}.`,
        `${r.work[1]} Comprueba: con ${v} = ${r.n} se obtiene ${chainText(r.expr, env)}.`,
      ],
      h: [
        [
          "Try a value for the letter, or work backward from the result. Undo the last operation first.",
          "Prueba un valor para la letra, o trabaja hacia atrás desde el resultado. Deshaz primero la última operación.",
        ],
        r.h2,
        r.h3,
      ],
      meta: { kind: "rev", expr: r.expr, v, target: r.T, whole: !!r.whole },
    });
  }

  /* ---- level 4: find the mistake ---------------------------------------------------------------------------- */
  const MISTAKES = [
    {
      gen(/** @type {any} */ rng, /** @type {string} */ v) {
        const a = rng.int(2, 5);
        const b = rng.int(1, 9);
        const n = rng.int(2, 6);
        return {
          expr: `${a}${v}² + ${b}`,
          n,
          ans: a * n * n + b,
          list: [
            {
              tag: "squared-the-coefficient",
              t: [
                `{N} squared ${a}${v} as a whole, not just ${v}.`,
                `{N} elevó ${a}${v} completo al cuadrado, no solo ${v}.`,
              ],
              e: `(${a} × ${n})² + ${b}`,
            },
            {
              tag: "exponent-as-multiplication",
              t: [
                `{N} multiplied ${v} by 2 instead of squaring it.`,
                `{N} multiplicó ${v} por 2 en lugar de elevarla al cuadrado.`,
              ],
              e: `${a} × ${n} × 2 + ${b}`,
            },
            {
              tag: "order-of-operations",
              t: [
                `{N} added ${b} before multiplying by ${a}.`,
                `{N} sumó ${b} antes de multiplicar por ${a}.`,
              ],
              e: `${a} × (${n}² + ${b})`,
            },
            {
              tag: "forgot-the-power",
              t: [
                `{N} forgot the power and used ${v} by itself.`,
                `{N} olvidó la potencia y usó ${v} sola.`,
              ],
              e: `${a} × ${n} + ${b}`,
            },
          ],
        };
      },
    },
    {
      gen(/** @type {any} */ rng, /** @type {string} */ v) {
        const a = rng.int(2, 6);
        const b = rng.int(2, 8);
        const c = rng.int(1, 12);
        const n = rng.int(2, 9);
        return {
          expr: `${a}(${v} + ${b}) + ${c}`,
          n,
          ans: a * (n + b) + c,
          list: [
            {
              tag: "ignored-parentheses",
              t: [
                `{N} multiplied ${a} by ${v} but not by ${b}.`,
                `{N} multiplicó ${a} por ${v} pero no por ${b}.`,
              ],
              e: `${a} × ${n} + ${b} + ${c}`,
            },
            {
              tag: "added-before-multiplying",
              t: [
                `{N} added ${c} inside the parentheses before multiplying.`,
                `{N} sumó ${c} dentro del paréntesis antes de multiplicar.`,
              ],
              e: `${a} × (${n} + ${b} + ${c})`,
            },
            {
              tag: "treated-as-addition",
              t: [
                `{N} added ${a} instead of multiplying by ${a}.`,
                `{N} sumó ${a} en lugar de multiplicar por ${a}.`,
              ],
              e: `${a} + ${n} + ${b} + ${c}`,
            },
            {
              tag: "distributed-to-last-term-only",
              t: [
                `{N} multiplied ${a} by ${b} but not by ${v}.`,
                `{N} multiplicó ${a} por ${b} pero no por ${v}.`,
              ],
              e: `${a} × ${b} + ${n} + ${c}`,
            },
          ],
        };
      },
    },
    {
      gen(/** @type {any} */ rng, /** @type {string} */ v) {
        const a = rng.int(2, 6);
        const n = rng.int(2, 7);
        return {
          expr: `(${v} + ${a})²`,
          n,
          ans: (n + a) ** 2,
          list: [
            {
              tag: "squared-each-term",
              t: [
                `{N} squared ${v} and ${a} separately, then added.`,
                `{N} elevó ${v} y ${a} al cuadrado por separado y luego sumó.`,
              ],
              e: `${n}² + ${a}²`,
            },
            {
              tag: "exponent-as-multiplication",
              t: [
                "{N} multiplied the sum by 2 instead of squaring it.",
                "{N} multiplicó la suma por 2 en lugar de elevarla al cuadrado.",
              ],
              e: `2 × (${n} + ${a})`,
            },
            {
              tag: "ignored-parentheses",
              t: [
                `{N} squared only ${v}, then added ${a}.`,
                `{N} elevó al cuadrado solo ${v} y luego sumó ${a}.`,
              ],
              e: `${n}² + ${a}`,
            },
            {
              tag: "ignored-parentheses",
              t: [
                `{N} squared only ${a}, then added ${v}.`,
                `{N} elevó al cuadrado solo ${a} y luego sumó ${v}.`,
              ],
              e: `${n} + ${a}²`,
            },
          ],
        };
      },
    },
    {
      gen(/** @type {any} */ rng, /** @type {string} */ v) {
        const a = rng.int(2, 9);
        const n = rng.int(2, 9);
        const r = rng.int(2, 20);
        const b = a * n + r;
        return {
          expr: `${b} − ${a}${v}`,
          n,
          ans: r,
          list: [
            {
              tag: "subtracted-first",
              t: [
                `{N} did ${b} − ${a} first, then multiplied by ${v}.`,
                `{N} hizo primero ${b} − ${a} y luego multiplicó por ${v}.`,
              ],
              e: `(${b} − ${a}) × ${n}`,
            },
            {
              tag: "treated-as-addition",
              t: [`{N} treated ${a}${v} as ${a} + ${v}.`, `{N} trató ${a}${v} como ${a} + ${v}.`],
              e: `${b} − (${a} + ${n})`,
            },
            {
              tag: "swapped-numbers",
              t: [
                `{N} multiplied ${b} by ${v} instead of ${a} by ${v}.`,
                `{N} multiplicó ${b} por ${v} en lugar de ${a} por ${v}.`,
              ],
              e: `${b} × ${n} − ${a}`,
            },
            {
              tag: "used-wrong-operation",
              t: [
                `{N} added ${a}${v} instead of subtracting it.`,
                `{N} sumó ${a}${v} en lugar de restarlo.`,
              ],
              e: `${b} + ${a} × ${n}`,
            },
          ],
        };
      },
    },
  ];
  function kindMistake(/** @type {any} */ rng) {
    const [v] = letters(rng, 1);
    const r = rng.pick(MISTAKES).gen(rng, v);
    const name = rng.pick(NAMES);
    const env = { [v]: r.n };
    const vals = r.list.map((m) => val(m.e));
    if (new Set(vals).size < 4 || vals.some((x) => near(x, r.ans) || x < 0 || !Number.isInteger(x)))
      return null;
    const pick = rng.int(0, 3);
    const W = vals[pick];
    const sayEn = (/** @type {any} */ m) => m.t[0].replace("{N}", name);
    const sayEs = (/** @type {any} */ m) => m.t[1].replace("{N}", name);
    return mcx(rng, {
      q: [
        `${name} evaluated ${r.expr} when ${v} = ${r.n} and got ${W}. Which mistake did ${name} make?`,
        `${name} evaluó ${r.expr} cuando ${v} = ${r.n} y obtuvo ${W}. ¿Qué error cometió ${name}?`,
      ],
      key: { v: sayEn(r.list[pick]), vEs: sayEs(r.list[pick]) },
      wrong: r.list
        .map((m, i) => ({ m, i }))
        .filter(({ i }) => i !== pick)
        .map(({ m, i }) => ({
          v: sayEn(m),
          vEs: sayEs(m),
          tag: m.tag,
          f: [
            `That mistake would give ${vals[i]}, not ${W}. Work the expression yourself and see where ${W} comes from.`,
            `Ese error daría ${vals[i]}, no ${W}. Resuelve la expresión tú mismo y mira de dónde sale ${W}.`,
          ],
        })),
      x: [
        `The correct work is ${chainText(r.expr, env)}, so the value is ${r.ans}. ${name}'s ${W} comes from ${chainText(r.list[pick].e, {})}: ${sayEn(r.list[pick])}`,
        `El trabajo correcto es ${chainText(r.expr, env)}, así que el valor es ${r.ans}. El ${W} de ${name} sale de ${chainText(r.list[pick].e, {})}: ${sayEs(r.list[pick])}`,
      ],
      h: [
        [
          "Work out the expression yourself, one step at a time.",
          "Resuelve la expresión tú mismo, un paso a la vez.",
        ],
        [
          `Replace ${v} with ${r.n}: ${chain(r.expr, env)[0]}.`,
          `Reemplaza ${v} por ${r.n}: ${chain(r.expr, env)[0]}.`,
        ],
        [
          `Which step would give ${W} instead of your answer?`,
          `¿Qué paso daría ${W} en lugar de tu respuesta?`,
        ],
      ],
      meta: {
        kind: "mistake",
        expr: r.expr,
        env,
        wrongValue: W,
        works: r.list.map((m, i) => ({ e: m.e, t: sayEn(m), key: i === pick })),
      },
    });
  }

  function checkEval(/** @type {any} */ item) {
    const m = item.meta;
    switch (m.kind) {
      case "eval": {
        const v = val(m.expr, m.env);
        if (!near(v, G.value(item.a)))
          return `${m.expr} at ${JSON.stringify(m.env)} is ${v}, key says ${item.a}`;
        if (!item.q.includes(m.expr) || !item.qEs.includes(m.expr))
          return "the stem does not show the expression";
        for (const w of item.fw || [])
          if (near(G.value(w.v), v)) return `fw value ${w.v} equals the key`;
        return true;
      }
      case "story": {
        const v = val(m.expr, m.env);
        const c = CLOSED[m.form](m.p, m.env);
        if (!near(v, c))
          return `the expression ${m.expr} is worth ${v}, the situation is worth ${c}`;
        if (!near(v, G.value(item.a))) return `expression value ${v}, key says ${item.a}`;
        for (const w of item.fw || [])
          if (near(G.value(w.v), v)) return `fw value ${w.v} equals the key`;
        return true;
      }
      case "write": {
        const chosen = item.c[item.a];
        const vs = Object.keys(m.p).filter((k) => k === "x" || k === "y" || k === m.p.v);
        const letters2 = m.form === "two" ? [m.p.x, m.p.y] : [m.p.v];
        for (const t of [1, 2, 3, 5, 8]) {
          const env = Object.fromEntries(letters2.map((l, i) => [l, t + i * 2]));
          if (!near(val(chosen, env), CLOSED[m.form](m.p, env)))
            return `${chosen} does not match the situation at ${JSON.stringify(env)} (${vs.length})`;
        }
        for (const [i, c] of item.c.entries())
          if (i !== item.a && same(c, chosen)) return `choice ${c} is equivalent to the key`;
        return true;
      }
      case "rev": {
        const n = G.value(item.a);
        if (!near(val(m.expr, { [m.v]: n }), m.target))
          return `${m.expr} at ${m.v} = ${item.a} is not ${m.target}`;
        if (n < 1 || !Number.isInteger(n)) return "the answer must be a positive whole number";
        for (const w of item.fw || [])
          if (near(val(m.expr, { [m.v]: G.value(w.v) }), m.target))
            return `fw value ${w.v} also works`;
        if (!item.q.includes(m.expr) || !item.q.includes(String(m.target)))
          return "the stem is missing the expression or target";
        return true;
      }
      case "subst": {
        const want = chain(m.expr, m.env)[0];
        if (item.c[item.a] !== want) return `the substitution is ${want}`;
        const kv = val(want);
        for (const [i, c] of item.c.entries())
          if (i !== item.a && near(val(c), kv)) return `choice ${c} has the same value as the key`;
        return true;
      }
      case "anatomy": {
        const want = { coefficient: `${m.a}`, constant: `${m.b}`, variable: m.v }[
          /** @type {"coefficient"|"constant"|"variable"} */ (m.part)
        ];
        if (item.c[item.a] !== want) return `the ${m.part} of ${m.expr} is ${want}`;
        const tokens = m.expr.split(" + ");
        const withLetter = tokens.find((/** @type {string} */ t) => /[a-z]/.test(t));
        const plain = tokens.find((/** @type {string} */ t) => !/[a-z]/.test(t));
        const reread = {
          coefficient: withLetter.replace(/[a-z]/, ""),
          constant: plain,
          variable: withLetter.replace(/\d/g, ""),
        }[/** @type {"coefficient"|"constant"|"variable"} */ (m.part)];
        return reread === want ? true : `re-reading ${m.expr} gives ${reread}, key says ${want}`;
      }
      case "mistake": {
        const real = val(m.expr, m.env);
        const hits = m.works.filter((/** @type {any} */ w) => near(val(w.e), m.wrongValue));
        if (hits.length !== 1) return `${hits.length} mistakes give ${m.wrongValue}`;
        if (near(real, m.wrongValue)) return "the student's answer is the correct value";
        if (item.c[item.a] !== hits[0].t)
          return "the key is not the mistake that gives the student's number";
        for (const w of m.works)
          if (!near(val(w.e), m.wrongValue) && item.c[item.a] === w.t)
            return "key matches a different mistake";
        return true;
      }
      default:
        return `unknown kind ${m.kind}`;
    }
  }

  G.register("evalExpression", {
    title: "Evaluate algebraic expressions",
    titleEs: "Evaluar expresiones algebraicas",
    levels: 4,
    make(/** @type {any} */ rng, /** @type {number} */ level) {
      const table = /** @type {Record<number, [Function, number][]>} */ ({
        1: [
          [kindSymbolic, 5],
          [kindSubst, 2.5],
          [kindAnatomy, 2.5],
        ],
        2: [[kindSymbolic, 10]],
        3: [
          [kindScenarioNum, 4.2],
          [kindScenarioMc, 2.3],
          [kindSymbolic, 3.5],
        ],
        4: [
          [kindReverse, 4],
          [kindMistake, 3],
          [kindSymbolic, 3],
        ],
      })[level];
      return until("evalExpression", () => pickBy(rng, table)(rng, level));
    },
    check: checkEval,
  });

  /* ================================================================================================================
   * equivalentExpr (lesson 6-6): equivalent forms, true for every value, odd one out, counterexamples
   * ============================================================================================================== */
  /**
   * One valid rewrite of an expression in the letter v, plus the named ways to get it wrong.
   * Each returns { orig, key, wrong: [[text, tag]], rule: [en, es], hint: [en, es], n }.
   */
  const REWRITES = /** @type {Record<string, (rng: any, v: string) => any>} */ ({
    combine2(rng, v) {
      const a = rng.int(2, 9);
      const b = rng.int(2, 9);
      return {
        orig: `${a}${v} + ${b}${v}`,
        key: `${a + b}${v}`,
        wrong: [
          [`${a + b}${v}²`, "exponent-added"],
          [`${a * b}${v}`, "multiplied-coefficients"],
          [`${a}${b}${v}`, "concatenated"],
          [`${a + b}`, "dropped-variable"],
        ],
        rule: [
          `${a}${v} is ${a} of ${v} and ${b}${v} is ${b} more of ${v}. Together that is ${a + b} of ${v}.`,
          `${a}${v} es ${a} de ${v} y ${b}${v} es ${b} más de ${v}. Juntos son ${a + b} de ${v}.`,
        ],
        hint: [
          `Add the coefficients of the like terms. How many ${v}'s are there in all?`,
          `Suma los coeficientes de los términos semejantes. ¿Cuántas ${v} hay en total?`,
        ],
        n: { a, b },
      };
    },
    dist(rng, v) {
      const a = rng.int(2, 9);
      const b = rng.int(1, 9);
      return {
        orig: `${a}(${v} + ${b})`,
        key: `${a}${v} + ${a * b}`,
        wrong: [
          [`${a}${v} + ${b}`, "distributed-to-first-term-only"],
          [`${v} + ${a * b}`, "distributed-to-last-term-only"],
          [`${a + b}${v}`, "added-outside-factor"],
          [`${a}${v} + ${a + b}`, "added-instead-of-multiplied"],
        ],
        rule: [
          `The ${a} outside the parentheses multiplies every term inside: ${a} × ${v} and ${a} × ${b}.`,
          `El ${a} de afuera del paréntesis multiplica cada término de adentro: ${a} × ${v} y ${a} × ${b}.`,
        ],
        hint: [
          `Multiply ${a} by each term inside the parentheses, one at a time.`,
          `Multiplica ${a} por cada término dentro del paréntesis, uno por uno.`,
        ],
        n: { a, b },
      };
    },
    commute(rng, v) {
      const a = rng.int(2, 9);
      const b = rng.int(1, 12);
      return {
        orig: `${b} + ${a}${v}`,
        key: `${a}${v} + ${b}`,
        wrong: [
          [`${b}${v} + ${a}`, "swapped-attachment"],
          [`${a + b}${v}`, "combined-unlike-terms"],
          [`${a}${v} − ${b}`, "used-wrong-operation"],
          [`${a * b}${v}`, "multiplied-coefficients"],
        ],
        rule: [
          "Adding in a different order gives the same total (the commutative property). Each number keeps its own letter.",
          "Sumar en otro orden da el mismo total (propiedad conmutativa). Cada número conserva su propia letra.",
        ],
        hint: [
          "The terms may trade places, but each term keeps its own number and its own letter.",
          "Los términos pueden cambiar de lugar, pero cada término conserva su propio número y su propia letra.",
        ],
        n: { a, b },
      };
    },
    repeat(rng, v) {
      const k = rng.int(2, 3);
      return {
        orig: Array(k).fill(v).join(" + "),
        key: `${k}${v}`,
        wrong: [
          [`${v}${SUP[k]}`, "repeated-add-as-exponent"],
          [`${v} + ${k}`, "treated-as-addition"],
          [`${k}`, "dropped-variable"],
          [`${k}${v}²`, "exponent-added"],
        ],
        rule: [
          `Adding ${v} to itself ${k} times counts ${k} of ${v}, which is written ${k}${v}.`,
          `Sumar ${v} consigo misma ${k} veces cuenta ${k} de ${v}, y se escribe ${k}${v}.`,
        ],
        hint: [`Count how many ${v}'s are being added.`, `Cuenta cuántas ${v} se están sumando.`],
        n: { k },
      };
    },
    split(rng, v) {
      const k = rng.int(4, 12);
      const p = rng.int(1, k - 2);
      const q = k - p;
      return {
        orig: `${k}${v}`,
        key: `${p === 1 ? "" : p}${v} + ${q === 1 ? "" : q}${v}`,
        wrong: [
          [`${p === 1 ? "" : p}${v} + ${q}`, "dropped-variable"],
          [`${p * q}${v}²`, "multiplied-coefficients"],
          [`${v} + ${k}`, "treated-as-addition"],
          [`${p + 1}${v} + ${q}${v}`, "combined-unlike-terms"],
        ],
        rule: [
          `${k}${v} is ${k} of ${v}, and ${p} of ${v} plus ${q} of ${v} is also ${k} of ${v}.`,
          `${k}${v} es ${k} de ${v}, y ${p} de ${v} más ${q} de ${v} también es ${k} de ${v}.`,
        ],
        hint: [
          `Which two parts add up to ${k}? Each part keeps the letter.`,
          `¿Qué dos partes suman ${k}? Cada parte conserva la letra.`,
        ],
        n: { k },
      };
    },
    // level 2
    combineConst(rng, v) {
      const p = rng.int(1, 8);
      const r = rng.int(1, 8);
      const q = rng.int(1, 12);
      const ts = rng.shuffle([T(p, v), K(q), T(r, v)]);
      const all = tidy(ts);
      const bad = (/** @type {string} */ m) => show(combineBy(ts, m));
      return {
        orig: show(ts),
        key: show(all),
        wrong: [
          [bad("unlike"), "combined-unlike-terms"],
          [bad("expo"), "exponent-added"],
          [bad("mult"), "multiplied-coefficients"],
          [bad("concat"), "concatenated"],
        ],
        rule: [
          `Like terms have the same letter, so combine the ${v}-terms (${p} + ${r} = ${p + r}) and keep the plain number ${q} separate.`,
          `Los términos semejantes tienen la misma letra: combina los términos con ${v} (${p} + ${r} = ${p + r}) y deja el número solo ${q} aparte.`,
        ],
        hint: [
          `Only terms with the same letter can be combined. Which terms have ${v}?`,
          `Solo se pueden combinar los términos con la misma letra. ¿Cuáles términos tienen ${v}?`,
        ],
        n: { p, r, q },
      };
    },
    combineSub(rng, v) {
      const r = rng.int(1, 6);
      const p = r + rng.int(1, 6);
      const q = rng.int(1, 12);
      const ts = [T(p, v), T(-r, v), K(q)];
      const order = rng.pick([
        [0, 1, 2],
        [0, 2, 1],
        [2, 0, 1],
      ]);
      const shown = order.map((i) => ts[i]);
      const bad = (/** @type {string} */ m) => show(combineBy(shown, m));
      return {
        orig: show(shown),
        key: show(tidy(ts)),
        wrong: [
          [bad("sign"), "sign-error"],
          [bad("unlike"), "combined-unlike-terms"],
          [bad("expo"), "exponent-added"],
          [bad("mult"), "multiplied-coefficients"],
        ],
        rule: [
          `The ${v}-terms combine by subtracting the one being taken away (${p} − ${r} = ${p - r}). The plain number ${q} stays separate.`,
          `Los términos con ${v} se combinan restando el que se quita (${p} − ${r} = ${p - r}). El número solo ${q} se queda aparte.`,
        ],
        hint: [
          `Keep each minus sign with the term after it. Which terms have ${v}, and are they added or subtracted?`,
          `Deja cada signo menos con el término que le sigue. ¿Cuáles términos tienen ${v} y se suman o se restan?`,
        ],
        n: { p, r, q },
      };
    },
    distSub(rng, v) {
      const a = rng.int(2, 9);
      const b = rng.int(1, 9);
      const parts = [{ k: a, ts: [T(1, v), K(-b)] }];
      return {
        orig: `${a}(${v} − ${b})`,
        key: `${a}${v} − ${a * b}`,
        wrong: slipsOf(parts, [
          "distributed-to-first-term-only",
          "distributed-to-last-term-only",
          "sign-dropped",
          "added-instead-of-multiplied",
        ]).map((s) => [s.v, s.tag]),
        rule: [
          `The ${a} outside multiplies BOTH terms, and the minus sign stays: ${a} × ${v} − ${a} × ${b}.`,
          `El ${a} de afuera multiplica LOS DOS términos, y el signo menos se queda: ${a} × ${v} − ${a} × ${b}.`,
        ],
        hint: [
          `Multiply ${a} by the ${v} and by the ${b}. What happens to the minus sign?`,
          `Multiplica ${a} por ${v} y por ${b}. ¿Qué pasa con el signo menos?`,
        ],
        n: { a, b },
      };
    },
    distCoeff(rng, v) {
      const a = rng.int(2, 6);
      const b = rng.int(2, 5);
      const c = rng.int(1, 9);
      const parts = [{ k: a, ts: [T(b, v), K(c)] }];
      return {
        orig: `${a}(${b}${v} + ${c})`,
        key: `${a * b}${v} + ${a * c}`,
        wrong: [
          ...slipsOf(parts, [
            "distributed-to-first-term-only",
            "distributed-to-last-term-only",
            "added-instead-of-multiplied",
          ]).map((s) => [s.v, s.tag]),
          [`${a + b}${v} + ${a * c}`, "added-instead-of-multiplied"],
        ],
        rule: [
          `The ${a} multiplies each term: ${a} × ${b}${v} = ${a * b}${v} and ${a} × ${c} = ${a * c}.`,
          `El ${a} multiplica cada término: ${a} × ${b}${v} = ${a * b}${v} y ${a} × ${c} = ${a * c}.`,
        ],
        hint: [
          `Multiply ${a} by ${b}${v}, then ${a} by ${c}. The number and the letter in ${b}${v} are multiplied together.`,
          `Multiplica ${a} por ${b}${v} y luego ${a} por ${c}. El número y la letra en ${b}${v} se multiplican entre sí.`,
        ],
        n: { a, b, c },
      };
    },
    factor(rng, v) {
      const g = rng.int(2, 9);
      const q = rng.int(2, 9);
      return {
        orig: `${g}${v} + ${g * q}`,
        key: `${g}(${v} + ${q})`,
        wrong: [
          [`${g}(${v} + ${g * q})`, "factored-first-term-only"],
          [`${q}(${v} + ${g})`, "swapped-numbers"],
          [`${g + q}${v}`, "combined-unlike-terms"],
          [`${g}(${v} − ${q})`, "used-wrong-operation"],
        ],
        rule: [
          `Both terms have ${g} as a factor. Write ${g} outside and put what is left inside: ${g}(${v} + ${q}). Multiplying back gives the original.`,
          `Los dos términos tienen ${g} como factor. Escribe ${g} afuera y pon lo que queda adentro: ${g}(${v} + ${q}). Al multiplicar de nuevo se obtiene la original.`,
        ],
        hint: [
          `Find a number that divides both ${g}${v} and ${g * q}, then divide each term by it.`,
          `Busca un número que divida a ${g}${v} y a ${g * q}, y divide cada término entre él.`,
        ],
        n: { g, q },
      };
    },
  });
  const REWRITE_LEVELS = /** @type {Record<number, [string, number][]>} */ ({
    1: [
      ["combine2", 25],
      ["dist", 25],
      ["commute", 15],
      ["repeat", 15],
      ["split", 20],
    ],
    2: [
      ["combineConst", 22],
      ["combineSub", 18],
      ["distSub", 20],
      ["distCoeff", 20],
      ["factor", 20],
    ],
  });
  const equivQ = (/** @type {any} */ rng, /** @type {string} */ orig) =>
    rng.chance(0.4)
      ? (() => {
          const n = rng.pick(NAMES);
          return [
            `${n} wants another way to write ${orig}. Which expression is equivalent?`,
            `${n} quiere otra forma de escribir ${orig}. ¿Cuál expresión es equivalente?`,
          ];
        })()
      : [`Which expression is equivalent to ${orig}?`, `¿Cuál expresión es equivalente a ${orig}?`];
  const TEST_HINTS = [
    [
      "Equivalent expressions have the same value for every number you put in for the letter.",
      "Las expresiones equivalentes tienen el mismo valor con cualquier número que pongas en lugar de la letra.",
    ],
    (/** @type {string} */ v) => [
      `Try a test value, such as ${v} = 2, in the original expression and in each choice.`,
      `Prueba un valor, como ${v} = 2, en la expresión original y en cada opción.`,
    ],
  ];
  /** a test value where the two sides differ, or null */
  const diffAt = (/** @type {string} */ l, /** @type {string} */ r, /** @type {string} */ v) => {
    for (const t of [2, 3, 4, 5, 1, 6]) if (!near(val(l, { [v]: t }), val(r, { [v]: t }))) return t;
    return null;
  };

  function kindEquiv(/** @type {any} */ rng, /** @type {number} */ level) {
    const [v] = letters(rng, 1);
    const r = REWRITES[pickBy(rng, REWRITE_LEVELS[level])](rng, v);
    const t = rng.int(2, 5);
    return mcx(rng, {
      q: equivQ(rng, r.orig),
      key: { v: r.key },
      wrong: r.wrong.map(([tx, tag]) => ({ v: tx, tag, f: fb(tag) })),
      ok: (tx) => !same(tx, r.orig),
      apart: (a, b) => !same(a, b),
      x: [
        `${r.rule[0]} So ${r.orig} = ${r.key}. Check ${v} = ${t}: ${testLine(r.orig, v, t)} and ${testLine(r.key, v, t)}.`,
        `${r.rule[1]} Entonces ${r.orig} = ${r.key}. Comprueba con ${v} = ${t}: ${testLine(r.orig, v, t)} y ${testLine(r.key, v, t)}.`,
      ],
      h: [TEST_HINTS[0], /** @type {any} */ (TEST_HINTS[1])(v), r.hint],
      meta: { kind: "equiv", orig: r.orig, v },
    });
  }

  /** level 2-3: which equation is true for every value of the letter? */
  function kindEqTrue(/** @type {any} */ rng, /** @type {number} */ level) {
    const [v] = letters(rng, 1);
    const ids =
      level === 2
        ? ["combine2", "dist", "commute", "repeat", "split"]
        : ["combineConst", "combineSub", "distSub", "distCoeff", "factor", "dist", "combine2"];
    const rs = rng
      .shuffle(ids)
      .slice(0, 4)
      .map((id) => REWRITES[id](rng, v));
    const eq = (/** @type {string} */ l, /** @type {string} */ r) => `${l} = ${r}`;
    const key = eq(rs[0].orig, rs[0].key);
    const wrong = rs.slice(1).map((r) => {
      const [tx, tag] = rng.pick(r.wrong);
      const t = diffAt(r.orig, tx, v) ?? 2;
      return {
        v: eq(r.orig, tx),
        tag,
        f: [
          `${fb(tag)[0]} For example, ${v} = ${t}: the left side is ${lastOf(r.orig, { [v]: t })} and the right side is ${lastOf(tx, { [v]: t })}.`,
          `${fb(tag)[1]} Por ejemplo, con ${v} = ${t}: el lado izquierdo es ${lastOf(r.orig, { [v]: t })} y el derecho es ${lastOf(tx, { [v]: t })}.`,
        ],
      };
    });
    const t0 = rng.int(2, 5);
    return mcx(rng, {
      q: rng.chance(0.5)
        ? [
            `Which equation is true for every value of ${v}?`,
            `¿Qué ecuación es verdadera para todos los valores de ${v}?`,
          ]
        : [
            `Which equation is always true, no matter what number ${v} is?`,
            `¿Qué ecuación siempre es verdadera, sea cual sea el número que representa ${v}?`,
          ],
      key: { v: key },
      wrong,
      ok: (tx) => !identity(tx),
      x: [
        `${key} is true for every value of ${v}. ${rs[0].rule[0]} Check ${v} = ${t0}: ${testLine(rs[0].orig, v, t0)} and ${testLine(rs[0].key, v, t0)}.`,
        `${key} es verdadera para todos los valores de ${v}. ${rs[0].rule[1]} Comprueba con ${v} = ${t0}: ${testLine(rs[0].orig, v, t0)} y ${testLine(rs[0].key, v, t0)}.`,
      ],
      h: [
        [
          "An equation is true for every value only if both sides always give the same result.",
          "Una ecuación es verdadera para todos los valores solo si los dos lados siempre dan el mismo resultado.",
        ],
        /** @type {any} */ (TEST_HINTS[1])(v),
        [
          "One test can fool you. Test each equation with two different numbers, such as 2 and 3.",
          "Una sola prueba puede engañarte. Prueba cada ecuación con dos números distintos, como 2 y 3.",
        ],
      ],
      meta: { kind: "eq", v },
    });
  }

  /** level 2: substitute the same test value in two equivalent expressions */
  function kindTestBoth(/** @type {any} */ rng) {
    const [v] = letters(rng, 1);
    const id = pickBy(rng, [
      ["dist", 4],
      ["combine2", 3],
      ["commute", 2],
    ]);
    const r = REWRITES[id](rng, v);
    const t = rng.int(2, 6);
    const ans = val(r.orig, { [v]: t });
    const { a, b } = r.n;
    const wrong =
      id === "dist"
        ? [
            [a * t + b, "ignored-parentheses"],
            [a + t + b, "treated-as-addition"],
            [Number(`${a}${t}`) + a * b, "concatenated-coefficient"],
          ]
        : id === "combine2"
          ? [
              [Number(`${a}${t}`) + Number(`${b}${t}`), "concatenated-coefficient"],
              [a + t + b + t, "treated-as-addition"],
              [a + b + t, "treated-as-addition"],
            ]
          : [
              [Number(`${a}${t}`) + b, "concatenated-coefficient"],
              [a + t + b, "treated-as-addition"],
              [b * a * t, "used-wrong-operation"],
            ];
    return numx({
      q: [
        `The expressions ${r.orig} and ${r.key} are equivalent. Test ${v} = ${t}. What value do both give?`,
        `Las expresiones ${r.orig} y ${r.key} son equivalentes. Prueba con ${v} = ${t}. ¿Qué valor dan las dos?`,
      ],
      ans,
      wrong: wrongVals(wrong),
      x: [
        `Check ${v} = ${t}: ${testLine(r.orig, v, t)} and ${testLine(r.key, v, t)}. Both give ${ans}. Equivalent expressions give the same value for every test number.`,
        `Comprueba con ${v} = ${t}: ${testLine(r.orig, v, t)} y ${testLine(r.key, v, t)}. Las dos dan ${ans}. Las expresiones equivalentes dan el mismo valor con cualquier número de prueba.`,
      ],
      h: [
        [
          "Replace the letter with the test value, one expression at a time.",
          "Reemplaza la letra con el valor de prueba, una expresión a la vez.",
        ],
        [
          `Write the first expression with the number in place: ${chain(r.orig, { [v]: t })[0]}.`,
          `Escribe la primera expresión con el número en su lugar: ${chain(r.orig, { [v]: t })[0]}.`,
        ],
        /** @type {any} */ (PHASE_HINT)[firstPhase(r.orig, { [v]: t })],
      ],
      meta: { kind: "testBoth", A: r.orig, B: r.key, v, t },
    });
  }

  /* ---- level 3: spot the expression that is NOT equivalent -------------------------------------------------- */
  const ODD_BASES = [
    (/** @type {any} */ rng, /** @type {string} */ v) => [
      { k: rng.int(2, 5), ts: [T(1, v), K(rng.int(1, 6))] },
      { ts: [T(rng.int(1, 5), v)] },
    ],
    (/** @type {any} */ rng, /** @type {string} */ v) => [
      {
        ts: [T(rng.int(1, 6), v), K(rng.int(1, 9)), T(rng.int(1, 6), v), K(rng.int(1, 9))],
      },
    ],
    (/** @type {any} */ rng, /** @type {string} */ v) => {
      const a = rng.int(2, 5);
      const b = rng.int(1, 5);
      return [{ k: a, ts: [T(1, v), K(-b)] }, { ts: [K(a * b + rng.int(1, 9))] }];
    },
    (/** @type {any} */ rng, /** @type {string} */ v) => [
      { k: rng.int(2, 4), ts: [T(rng.int(2, 4), v), K(rng.int(1, 6))] },
      { ts: [K(rng.int(1, 8))] },
    ],
  ];
  /** every valid rewrite of an expression written as parts, labelled by what it shows */
  function equivalentsOf(/** @type {any[]} */ parts) {
    const ex = expandParts(parts);
    const simp = tidy(ex);
    const V = ex.filter((t) => t.v);
    const C = ex.filter((t) => !t.v);
    return [
      [show(simp), "missed-combining"],
      [show(ex), "missed-distribution"],
      [showParts([...parts].reverse()), "missed-reorder"],
      [show([...simp].reverse()), "missed-reorder"],
      [show([...tidy(V), ...C]), "missed-combining"],
      [show([...V, ...tidy(C)]), "missed-combining"],
    ];
  }
  function kindOdd(/** @type {any} */ rng) {
    const [v] = letters(rng, 1);
    const parts = rng.pick(ODD_BASES)(rng, v);
    const orig = showParts(parts);
    const t = rng.int(2, 4);
    const odds = slipsOf(parts).filter(
      (s) => !s.v.startsWith("−") && s.v !== "0" && !same(s.v, orig),
    );
    if (!odds.length) return null;
    const odd = rng.pick(odds);
    const eqs = equivalentsOf(parts).filter(
      ([tx]) => tx !== orig && !tx.startsWith("−") && same(tx, orig),
    );
    return mcx(rng, {
      q: [
        `Three of these expressions are equivalent to ${orig}. Which one is NOT equivalent?`,
        `Tres de estas expresiones son equivalentes a ${orig}. ¿Cuál NO es equivalente?`,
      ],
      key: { v: odd.v },
      wrong: eqs.map(([tx, tag]) => ({
        v: tx,
        tag,
        f: [
          `${fb(tag)[0]} Check ${v} = ${t}: ${testLine(orig, v, t)} and ${testLine(tx, v, t)}.`,
          `${fb(tag)[1]} Comprueba con ${v} = ${t}: ${testLine(orig, v, t)} y ${testLine(tx, v, t)}.`,
        ],
      })),
      ok: (tx) => same(tx, orig),
      x: [
        `${odd.v} is not equivalent. ${fb(odd.tag)[0]} Check ${v} = ${t}: ${orig} gives ${lastOf(orig, { [v]: t })}, but ${odd.v} gives ${lastOf(odd.v, { [v]: t })}.`,
        `${odd.v} no es equivalente. ${fb(odd.tag)[1]} Comprueba con ${v} = ${t}: ${orig} da ${lastOf(orig, { [v]: t })}, pero ${odd.v} da ${lastOf(odd.v, { [v]: t })}.`,
      ],
      h: [
        [
          "Three choices are just the original written another way. One has a mistake in it.",
          "Tres opciones son la expresión original escrita de otra manera. Una tiene un error.",
        ],
        /** @type {any} */ (TEST_HINTS[1])(v),
        [
          "Look at how each choice could be built from the original: reordered, distributed, or combined.",
          "Mira cómo se pudo formar cada opción a partir de la original: reordenada, distribuida o combinada.",
        ],
      ],
      meta: { kind: "odd", orig, v },
    });
  }

  /* ---- level 4: counterexamples ------------------------------------------------------------------------------ */
  /** the four pieces of reasoning offered about a pair that agrees at x0 only */
  const proofTexts = (
    /** @type {string} */ A,
    /** @type {string} */ B,
    /** @type {string} */ v,
    /** @type {number} */ x0,
    /** @type {number} */ x1,
  ) => {
    const V = val(A, { [v]: x0 });
    const A1 = val(A, { [v]: x1 });
    const B1 = val(B, { [v]: x1 });
    return {
      proof: [
        `Try ${v} = ${x0}: both are ${V}. Try ${v} = ${x1}: ${A1} and ${B1}. The values are different, so they are not equivalent.`,
        `Prueba ${v} = ${x0}: las dos dan ${V}. Prueba ${v} = ${x1}: ${A1} y ${B1}. Los valores son distintos, así que no son equivalentes.`,
      ],
      lucky: [
        `Try ${v} = ${x0}: both are ${V}. The values match, so they are equivalent.`,
        `Prueba ${v} = ${x0}: las dos dan ${V}. Los valores coinciden, así que son equivalentes.`,
      ],
      looks: [
        "They look different, so they are not equivalent. No test is needed.",
        "Se ven distintas, así que no son equivalentes. No hace falta probar.",
      ],
      many: [
        `Try ${v} = ${x1}: ${A1} and ${B1}. One test is not enough to decide.`,
        `Prueba ${v} = ${x1}: ${A1} y ${B1}. Una sola prueba no basta para decidir.`,
      ],
    };
  };
  function kindStmt(/** @type {any} */ rng) {
    const [v] = letters(rng, 1);
    const x0 = rng.int(1, 6);
    const p = rng.int(1, 6);
    const r = rng.int(1, 6);
    if (p === r) return null;
    const q = rng.int(0, 9);
    const s = q + (p - r) * x0;
    if (s < 0 || s > 30) return null;
    const A =
      q > 0 && q % p === 0 && p > 1 && rng.chance(0.5)
        ? `${p}(${v} + ${q / p})`
        : show([T(p, v), K(q)]);
    const B = show([T(r, v), K(s)]);
    if (A === B) return null;
    const x1 = rng.pick([1, 2, 3, 4, 5, 6, 7, 8].filter((n) => n !== x0));
    const tx = proofTexts(A, B, v, x0, x1);
    const name = rng.pick(NAMES);
    return mcx(rng, {
      q: [
        `${name} says ${A} and ${B} are not equivalent. Which reasoning proves ${name} is right?`,
        `${name} dice que ${A} y ${B} no son equivalentes. ¿Qué razonamiento demuestra que ${name} tiene razón?`,
      ],
      key: { v: tx.proof[0], vEs: tx.proof[1] },
      wrong: [
        {
          v: tx.lucky[0],
          vEs: tx.lucky[1],
          tag: "one-test-value",
          f: fb("one-test-value"),
        },
        {
          v: tx.looks[0],
          vEs: tx.looks[1],
          tag: "judged-by-appearance",
          f: fb("judged-by-appearance"),
        },
        {
          v: tx.many[0],
          vEs: tx.many[1],
          tag: "needs-many-tests",
          f: fb("needs-many-tests"),
        },
      ],
      x: [
        `Both expressions give ${val(A, { [v]: x0 })} when ${v} = ${x0}, but when ${v} = ${x1} they give ${val(A, { [v]: x1 })} and ${val(B, { [v]: x1 })}. One test value with different results shows they are not equivalent. A match at one value proves nothing.`,
        `Las dos expresiones dan ${val(A, { [v]: x0 })} cuando ${v} = ${x0}, pero cuando ${v} = ${x1} dan ${val(A, { [v]: x1 })} y ${val(B, { [v]: x1 })}. Un solo valor de prueba con resultados distintos muestra que no son equivalentes. Una coincidencia en un valor no demuestra nada.`,
      ],
      h: [
        [
          "To show two expressions are NOT equivalent, you need a value where their results are different.",
          "Para mostrar que dos expresiones NO son equivalentes, necesitas un valor donde sus resultados sean distintos.",
        ],
        [
          "A test where both results match does not prove anything by itself.",
          "Una prueba donde los dos resultados coinciden no demuestra nada por sí sola.",
        ],
        [
          "Check the arithmetic in each choice, then ask: does the conclusion follow from the numbers?",
          "Revisa la aritmética de cada opción y pregunta: ¿la conclusión se sigue de los números?",
        ],
      ],
      meta: {
        kind: "stmt",
        A,
        B,
        v,
        x0,
        x1,
        texts: {
          proof: tx.proof[0],
          lucky: tx.lucky[0],
          looks: tx.looks[0],
          many: tx.many[0],
        },
      },
    });
  }

  /** v² and kv match at 0 and k only: which two test values fooled the student? */
  function kindPair(/** @type {any} */ rng) {
    const [v] = letters(rng, 1);
    const k = rng.int(2, 7);
    const name = rng.pick(NAMES);
    const others = [1, 2, 3, 4, 5, 6, 7, 8].filter((n) => n !== k);
    const pairs = [
      [rng.pick(others), k],
      [0, rng.pick(others)],
      rng.shuffle(others).slice(0, 2),
    ].map((pr) => [...pr].sort((a, b) => a - b));
    const text = (/** @type {number[]} */ pr, /** @type {string} */ join) =>
      `${v} = ${pr[0]} ${join} ${v} = ${pr[1]}`;
    const wrong = pairs.map((pr) => {
      const u = pr.find((n) => n !== 0 && n !== k) ?? pr[0];
      return {
        v: text(pr, "and"),
        vEs: text(pr, "y"),
        tag: "tested-wrong-values",
        f: [
          `Try ${v} = ${u}: ${v}² gives ${u * u} but ${k}${v} gives ${k * u}. They do not match, so ${name} could not have seen a match at ${u}.`,
          `Prueba con ${v} = ${u}: ${v}² da ${u * u} pero ${k}${v} da ${k * u}. No coinciden, así que ${name} no pudo ver una coincidencia con ${u}.`,
        ],
      };
    });
    const e = `${v}² and ${k}${v}`;
    return mcx(rng, {
      q: [
        `${name} says ${v}² and ${k}${v} are equivalent. ${name} tested two values of ${v} and the expressions matched both times. Which two values did ${name} test?`,
        `${name} dice que ${v}² y ${k}${v} son equivalentes. ${name} probó dos valores de ${v} y las expresiones coincidieron las dos veces. ¿Qué dos valores probó ${name}?`,
      ],
      key: { v: text([0, k], "and"), vEs: text([0, k], "y") },
      wrong,
      x: [
        `${v}² means ${v} × ${v}, and ${k}${v} means ${k} × ${v}. They match only when ${v} = 0 or ${v} = ${k}. Two matching tests are still not a proof: ${v} = 1 gives 1 and ${k}, so ${e} are not equivalent.`,
        `${v}² significa ${v} × ${v}, y ${k}${v} significa ${k} × ${v}. Solo coinciden cuando ${v} = 0 o ${v} = ${k}. Dos pruebas que coinciden tampoco son una demostración: con ${v} = 1 se obtiene 1 y ${k}, así que ${v}² y ${k}${v} no son equivalentes.`,
      ],
      h: [
        [
          "Equivalent expressions match for EVERY value. These two match only for some values.",
          "Las expresiones equivalentes coinciden para TODOS los valores. Estas dos solo coinciden para algunos.",
        ],
        [
          `Test each value in both expressions. Remember ${v}² means ${v} × ${v}.`,
          `Prueba cada valor en las dos expresiones. Recuerda que ${v}² significa ${v} × ${v}.`,
        ],
        [
          `For which values is ${v} × ${v} equal to ${k} × ${v}?`,
          `¿Para qué valores ${v} × ${v} es igual a ${k} × ${v}?`,
        ],
      ],
      meta: { kind: "pair", v, k },
    });
  }

  function checkEquiv(/** @type {any} */ item) {
    const m = item.meta;
    const chosen = item.c ? item.c[item.a] : null;
    const others = item.c
      ? item.c.filter((/** @type {string} */ _c, /** @type {number} */ i) => i !== item.a)
      : [];
    switch (m.kind) {
      case "equiv": {
        const u = (/** @type {string} */ c) => (m.named ? c.split(": ")[1] : c);
        if (!same(u(chosen), m.orig)) return `${chosen} is not equivalent to ${m.orig}`;
        if (!m.noStem && !m.named && (!item.q.includes(m.orig) || !item.qEs.includes(m.orig)))
          return "the stem does not show the expression";
        for (const o of others)
          if (same(u(o), m.orig)) return `distractor ${o} is secretly equivalent to ${m.orig}`;
        return true;
      }
      case "odd": {
        if (same(chosen, m.orig)) return `${chosen} is equivalent, so it cannot be the odd one`;
        for (const o of others)
          if (!same(o, m.orig))
            return `${o} is not equivalent to ${m.orig}, so two choices are odd`;
        return new Set(item.c).size === 4 ? true : "duplicate choices";
      }
      case "eq": {
        if (!identity(chosen)) return `${chosen} is not true for every ${m.v}`;
        for (const o of others) if (identity(o)) return `distractor ${o} is true for every ${m.v}`;
        return true;
      }
      case "testBoth": {
        const env = { [m.v]: m.t };
        const a = val(m.A, env);
        if (!near(a, val(m.B, env)) || !same(m.A, m.B))
          return "the two expressions are not equivalent";
        if (!near(a, G.value(item.a))) return `both expressions give ${a}, key says ${item.a}`;
        for (const w of item.fw || [])
          if (near(G.value(w.v), a)) return `fw value ${w.v} equals the key`;
        return true;
      }
      case "stmt": {
        const x0v = val(m.A, { [m.v]: m.x0 });
        if (!near(x0v, val(m.B, { [m.v]: m.x0 })))
          return "the expressions do not agree at the lucky value";
        if (near(val(m.A, { [m.v]: m.x1 }), val(m.B, { [m.v]: m.x1 })))
          return "the second value does not separate them";
        if (same(m.A, m.B)) return "the expressions are equivalent";
        const want = proofTexts(m.A, m.B, m.v, m.x0, m.x1);
        if (chosen !== want.proof[0]) return "the key is not the valid proof";
        for (const o of others) if (o === want.proof[0]) return "the valid proof appears twice";
        const known = [want.lucky[0], want.looks[0], want.many[0]];
        for (const o of others) if (!known.includes(o)) return `unexpected distractor "${o}"`;
        return true;
      }
      case "pair": {
        const agree = (/** @type {string} */ c) => {
          const nums = (c.match(/= (\d+)/g) || []).map((/** @type {string} */ s) =>
            Number(s.slice(2)),
          );
          return (
            nums.length === 2 &&
            nums.every((n) => near(val(`${m.v}²`, { [m.v]: n }), val(`${m.k}${m.v}`, { [m.v]: n })))
          );
        };
        if (!agree(chosen)) return "the chosen pair does not match both times";
        for (const o of others) if (agree(o)) return `distractor "${o}" also matches both times`;
        return true;
      }
      default:
        return `unknown kind ${m.kind}`;
    }
  }

  G.register("equivalentExpr", {
    title: "Equivalent expressions",
    titleEs: "Expresiones equivalentes",
    levels: 4,
    make(/** @type {any} */ rng, /** @type {number} */ level) {
      const table = /** @type {Record<number, [Function, number][]>} */ ({
        1: [[kindEquiv, 1]],
        2: [
          [kindEquiv, 5],
          [kindEqTrue, 2],
          [kindTestBoth, 3],
        ],
        3: [
          [kindOdd, 7],
          [kindEqTrue, 3],
        ],
        4: [
          [kindStmt, 6.5],
          [kindPair, 3.5],
        ],
      })[level];
      return until("equivalentExpr", () => pickBy(rng, table)(rng, level));
    },
    check: checkEquiv,
  });

  /* ================================================================================================================
   * shared by combineLikeTerms (6-8), distribute (6-14) and simplifyExpr (6-15)
   * ============================================================================================================== */
  Object.assign(MIS, {
    "common-factor-not-greatest": [
      "That is a common factor, but it is not the greatest one. A bigger number also divides every term.",
      "Ese es un factor común, pero no es el mayor. Un número más grande también divide todos los términos.",
    ],
    "lcm-instead-of-gcf": [
      "That is a multiple of the terms, not a factor of them. A common factor has to divide every term evenly.",
      "Ese es un múltiplo de los términos, no un factor. Un factor común tiene que dividir exactamente todos los términos.",
    ],
    "not-a-common-factor": [
      "That number divides one term but not the other. A common factor has to divide every term.",
      "Ese número divide un término pero no el otro. Un factor común tiene que dividir todos los términos.",
    ],
    "doubted-correct-equation": [
      "This equation IS correct: multiplying back gives the same value for every number. Look for the one that breaks the rule.",
      "Esta ecuación SÍ es correcta: al multiplicar de nuevo se obtiene el mismo valor con cualquier número. Busca la que rompe la regla.",
    ],
    "subtracted-instead-of-divided": [
      "The common factor was subtracted from the terms. Finding the other side of a rectangle means dividing the area by the known side.",
      "El factor común se restó de los términos. Para hallar el otro lado de un rectángulo se divide el área entre el lado conocido.",
    ],
  });
  /** equal parts as a sentence about an expression written as parts: distribute (if there is a group), then combine */
  function simpWork(/** @type {any[]} */ parts, /** @type {string} */ key) {
    const orig = showParts(parts);
    const ex = show(expandParts(parts));
    const grp = parts.some((p) => p.k != null);
    return grp
      ? [
          `Distribute first: ${orig} = ${ex}. Then combine the like terms: ${key}.`,
          `Primero distribuye: ${orig} = ${ex}. Luego combina los términos semejantes: ${key}.`,
        ]
      : [
          `Combine the like terms: ${orig} = ${key}. Keep each minus sign with its term.`,
          `Combina los términos semejantes: ${orig} = ${key}. Deja cada signo menos con su término.`,
        ];
  }
  /** a term list with positive total on each side: n numbers up to hi, the last one subtracted when it fits */
  const signedNums = (
    /** @type {any} */ rng,
    /** @type {number} */ n,
    /** @type {number} */ hi,
    /** @type {boolean} */ neg,
  ) => {
    const a = Array.from({ length: n }, () => rng.int(1, hi));
    const s = wsum(a.slice(0, -1), (c) => c);
    if (neg && n >= 2 && s >= 2) a[n - 1] = -rng.int(1, Math.min(hi, s - 1));
    return a;
  };
  const PARTS = /** @type {Record<string, (rng: any, v: string) => any[]>} */ ({
    a: (rng, v) => [
      { k: rng.int(2, 6), ts: [T(1, v), K(rng.int(1, 8))] },
      { ts: [K(rng.int(1, 12))] },
    ],
    b: (rng, v) => [
      { k: rng.int(2, 6), ts: [T(1, v), K(rng.int(1, 8))] },
      { ts: [T(rng.int(1, 6), v)] },
    ],
    c: (rng, v) => [
      { ts: [T(rng.int(1, 6), v)] },
      { k: rng.int(2, 6), ts: [T(1, v), K(rng.int(1, 8))] },
      { ts: [K(rng.int(1, 12))] },
    ],
    d: (rng, v) => [
      { k: rng.int(2, 5), ts: [T(1, v), K(rng.int(1, 6))] },
      { k: rng.int(2, 5), ts: [T(1, v), K(rng.int(1, 6))] },
    ],
    e: (rng, v) => {
      const c = rng.int(1, 4);
      return [{ k: c + rng.int(1, 4), ts: [T(1, v), K(rng.int(1, 8))] }, { ts: [T(-c, v)] }];
    },
    f: (rng, v) => [
      { k: rng.int(2, 4), ts: [T(rng.int(2, 4), v), K(rng.int(1, 6))] },
      { ts: [T(rng.int(1, 6), v)] },
    ],
    g: (rng, v) => {
      const k = rng.int(2, 5);
      const b = rng.int(1, 5);
      return [
        { ts: [T(rng.int(1, 6), v)] },
        { k, ts: [T(1, v), K(-b)] },
        { ts: [K(k * b + rng.int(1, 8))] },
      ];
    },
  });
  /** no negative coefficient and no negative leftover number: Grade 6 integers only */
  const plausible = (/** @type {any[]} */ parts) => tidy(expandParts(parts)).every((t) => t.c > 0);
  const simpHints = (/** @type {string} */ v) => [
    [
      "Like terms have the same letter and the same power. Plain numbers are like terms of each other.",
      "Los términos semejantes tienen la misma letra y la misma potencia. Los números solos son semejantes entre sí.",
    ],
    [
      `Group the ${v}-terms together and the plain numbers together. Keep each minus sign with its term.`,
      `Agrupa los términos con ${v} y agrupa los números solos. Deja cada signo menos con su término.`,
    ],
  ];
  /** a "simplify" multiple choice; wrongs come from the named slips */
  function simpItem(
    /** @type {any} */ rng,
    /** @type {any[]} */ parts,
    /** @type {string} */ v,
    /** @type {string} */ verb,
  ) {
    if (!plausible(parts)) return null;
    const orig = showParts(parts);
    const key = show(tidy(expandParts(parts)));
    if (key === orig) return null;
    const grp = parts.some((p) => p.k != null);
    const t = rng.int(2, 5);
    const stem = {
      simplify: [`Simplify ${orig}.`, `Simplifica ${orig}.`],
      combine: [
        `Combine the like terms in ${orig}.`,
        `Combina los términos semejantes en ${orig}.`,
      ],
    }[verb];
    const w = simpWork(parts, key);
    return mcx(rng, {
      q: stem,
      key: { v: key },
      wrong: slipsOf(parts).map((s) => ({ v: s.v, tag: s.tag, f: fb(s.tag) })),
      ok: (tx) => !same(tx, orig) && !tx.startsWith("−"),
      apart: (a, b) => !same(a, b),
      x: [
        `${w[0]} Check ${v} = ${t}: ${testLine(orig, v, t)} and ${testLine(key, v, t)}.`,
        `${w[1]} Comprueba con ${v} = ${t}: ${testLine(orig, v, t)} y ${testLine(key, v, t)}.`,
      ],
      h: [
        ...simpHints(v),
        grp
          ? [
              "Start by multiplying the number outside the parentheses by every term inside.",
              "Empieza multiplicando el número de afuera del paréntesis por cada término de adentro.",
            ]
          : [
              "Add or subtract the coefficients of the like terms. The letter stays the same.",
              "Suma o resta los coeficientes de los términos semejantes. La letra no cambia.",
            ],
      ],
      meta: { kind: "equiv", orig, v, key },
    });
  }

  /* ================================================================================================================
   * combineLikeTerms (lesson 6-8)
   * ============================================================================================================== */
  /** level 1: which term is a like term of c·v? */
  function kindLike(/** @type {any} */ rng) {
    const [v, u] = letters(rng, 2);
    const c = rng.int(2, 9);
    const d = rng.int(2, 9);
    if (c === d) return null;
    const target = `${c}${v}`;
    return mcx(rng, {
      q: [`Which term is a like term of ${target}?`, `¿Cuál término es semejante a ${target}?`],
      key: { v: `${d}${v}` },
      wrong: [
        {
          v: `${c}${u}`,
          tag: "matched-coefficient",
          f: fb("matched-coefficient"),
        },
        { v: `${d}`, tag: "matched-constant", f: fb("matched-constant") },
        { v: `${d}${v}²`, tag: "ignored-exponent", f: fb("ignored-exponent") },
      ],
      x: [
        `${d}${v} has the same letter and the same power as ${target}, so they are like terms and can be combined: ${c}${v} + ${d}${v} = ${c + d}${v}.`,
        `${d}${v} tiene la misma letra y la misma potencia que ${target}, así que son términos semejantes y se pueden combinar: ${c}${v} + ${d}${v} = ${c + d}${v}.`,
      ],
      h: [
        [
          "Like terms have the same letter AND the same power.",
          "Los términos semejantes tienen la misma letra Y la misma potencia.",
        ],
        [
          `Look at the letter part of ${target}. Which choice has exactly that letter part?`,
          `Mira la parte con letra de ${target}. ¿Cuál opción tiene exactamente esa parte con letra?`,
        ],
        [
          "The number in front does not have to match. Only the letter part has to match.",
          "El número de adelante no tiene que coincidir. Solo la parte con letra tiene que coincidir.",
        ],
      ],
      meta: { kind: "like", target, v },
    });
  }
  function kindCombine(/** @type {any} */ rng, /** @type {number} */ level) {
    const [v] = letters(rng, 1);
    if (level === 1) {
      const a = rng.int(2, 9);
      const b = rng.int(1, 9);
      const sub = rng.chance(0.3) && a > b;
      return simpItem(rng, [{ ts: [T(a, v), T(sub ? -b : b, v)] }], v, "combine");
    }
    if (level === 4)
      return simpItem(rng, PARTS[rng.pick(["a", "a", "b", "c"])](rng, v), v, "simplify");
    const hard = level === 3;
    const vc = signedNums(rng, hard ? 3 : 2, 6, rng.chance(0.6));
    const cc = signedNums(rng, hard ? 2 : 1, 9, hard && rng.chance(0.5));
    if (hard && rng.chance(0.6)) vc[0] = 1;
    const ts = rng.shuffle([...vc.map((c) => T(c, v)), ...cc.map((c) => K(c))]);
    const i = ts.findIndex((t) => t.c > 0);
    [ts[0], ts[i]] = [ts[i], ts[0]];
    return simpItem(rng, [{ ts }], v, "combine");
  }
  function checkLike(/** @type {any} */ item) {
    const m = item.meta;
    const mono2 = (/** @type {string} */ s) => s.replace(/^\d+/, "");
    if (mono2(item.c[item.a]) !== mono2(m.target))
      return `${item.c[item.a]} is not a like term of ${m.target}`;
    for (const [i, c] of item.c.entries())
      if (i !== item.a && mono2(c) === mono2(m.target)) return `${c} is also a like term`;
    return true;
  }
  G.register("combineLikeTerms", {
    title: "Combine like terms",
    titleEs: "Combinar términos semejantes",
    levels: 4,
    make(/** @type {any} */ rng, /** @type {number} */ level) {
      return until("combineLikeTerms", () =>
        level === 1 && rng.chance(0.4) ? kindLike(rng) : kindCombine(rng, level),
      );
    },
    check: (/** @type {any} */ item) =>
      item.meta.kind === "like" ? checkLike(item) : checkEquiv(item),
  });

  /* ================================================================================================================
   * distribute (lesson 6-14)
   * ============================================================================================================== */
  const AREA = [
    {
      a: ["A banner", "Un letrero"],
      the: ["the banner", "el letrero"],
      u: ["feet", "pies"],
    },
    {
      a: ["A poster", "Un cartel"],
      the: ["the poster", "el cartel"],
      u: ["inches", "pulgadas"],
    },
    {
      a: ["A rug", "Una alfombra"],
      the: ["the rug", "la alfombra"],
      u: ["feet", "pies"],
    },
    {
      a: ["A window", "Una ventana"],
      the: ["the window", "la ventana"],
      u: ["feet", "pies"],
    },
    {
      a: ["A garden bed", "Un jardín"],
      the: ["the garden bed", "el jardín"],
      u: ["meters", "metros"],
    },
    {
      a: ["A mural", "Un mural"],
      the: ["the mural", "el mural"],
      u: ["meters", "metros"],
    },
    {
      a: ["A stage", "Un escenario"],
      the: ["the stage", "el escenario"],
      u: ["meters", "metros"],
    },
  ];
  const expandQ = (/** @type {any} */ rng, /** @type {string} */ orig) =>
    rng.pick([
      [`Expand ${orig}.`, `Expande ${orig}.`],
      [
        `Use the distributive property to expand ${orig}.`,
        `Usa la propiedad distributiva para expandir ${orig}.`,
      ],
    ]);
  /** level 1: expand a(b + c) with numbers */
  function kindDistNumber(/** @type {any} */ rng) {
    const a = rng.int(2, 9);
    const b = rng.int(2, 9);
    const c = rng.int(2, 9);
    const orig = `${a}(${b} + ${c})`;
    const key = `${a} × ${b} + ${a} × ${c}`;
    return mcx(rng, {
      q: expandQ(rng, orig),
      key: { v: key },
      wrong: [
        {
          v: `${a} × ${b} + ${c}`,
          tag: "distributed-to-first-term-only",
          f: fb("distributed-to-first-term-only"),
        },
        {
          v: `${b} + ${a} × ${c}`,
          tag: "distributed-to-last-term-only",
          f: fb("distributed-to-last-term-only"),
        },
        {
          v: `${a} × ${b} × ${c}`,
          tag: "used-wrong-operation",
          f: fb("used-wrong-operation"),
        },
        {
          v: `${a} + ${b} × ${c}`,
          tag: "order-of-operations",
          f: fb("order-of-operations"),
        },
      ],
      ok: (tx) => !near(val(tx), a * (b + c)),
      x: [
        `The ${a} multiplies each number inside: ${key}. Both ways give ${a * (b + c)}: ${chainText(orig, {})} and ${chainText(key, {})}.`,
        `El ${a} multiplica cada número de adentro: ${key}. De las dos maneras se obtiene ${a * (b + c)}: ${chainText(orig, {})} y ${chainText(key, {})}.`,
      ],
      h: [
        [
          "The distributive property: a(b + c) = a × b + a × c.",
          "La propiedad distributiva: a(b + c) = a × b + a × c.",
        ],
        [
          `Multiply ${a} by the first number inside, then by the second number inside.`,
          `Multiplica ${a} por el primer número de adentro y luego por el segundo.`,
        ],
        [
          "Both products are added. Write them in order.",
          "Los dos productos se suman. Escríbelos en orden.",
        ],
      ],
      meta: { kind: "num-expand", orig, a, b, c },
    });
  }
  /** level 1-2: the area model, a rectangle split into two */
  function kindArea(/** @type {any} */ rng) {
    const [v] = letters(rng, 1);
    const r = REWRITES.dist(rng, v);
    const c = rng.pick(AREA);
    const { a, b } = r.n;
    return mcx(rng, {
      q: [
        `${c.a[0]} is ${a} ${c.u[0]} tall and (${v} + ${b}) ${c.u[0]} wide. Split the width into ${v} and ${b} to make two smaller rectangles. Which expression gives the total area of ${c.the[0]}?`,
        `${c.a[1]} mide ${a} ${c.u[1]} de alto y (${v} + ${b}) ${c.u[1]} de ancho. Divide el ancho en ${v} y ${b} para formar dos rectángulos más pequeños. ¿Qué expresión da el área total de ${c.the[1]}?`,
      ],
      key: { v: r.key },
      wrong: r.wrong.map(([tx, tag]) => ({ v: tx, tag, f: fb(tag) })),
      ok: (tx) => !same(tx, r.orig),
      apart: (x, y) => !same(x, y),
      x: [
        `The two small rectangles have areas ${a} × ${v} = ${a}${v} and ${a} × ${b} = ${a * b}. The total area is ${r.key}, which equals ${r.orig}.`,
        `Los dos rectángulos pequeños tienen áreas ${a} × ${v} = ${a}${v} y ${a} × ${b} = ${a * b}. El área total es ${r.key}, que es igual a ${r.orig}.`,
      ],
      h: [
        [
          "Area of a rectangle = height × width. Each small rectangle has the same height.",
          "Área de un rectángulo = alto × ancho. Cada rectángulo pequeño tiene el mismo alto.",
        ],
        [
          `Find the area of the rectangle with width ${v}, then the area of the rectangle with width ${b}.`,
          `Halla el área del rectángulo de ancho ${v} y luego el del rectángulo de ancho ${b}.`,
        ],
        ["Add the two areas to get the total.", "Suma las dos áreas para obtener el total."],
      ],
      meta: { kind: "equiv", orig: r.orig, v, noStem: true },
    });
  }
  /** level 2: mental math, 7 × 48 = 7(50 − 2) */
  function kindMental(/** @type {any} */ rng) {
    const a = rng.int(3, 9);
    const base = rng.pick([20, 30, 40, 50, 60, 70, 80, 90, 100, 200]);
    const d = rng.int(1, 4);
    const minus = rng.chance(0.5);
    const n = minus ? base - d : base + d;
    const e = `${a}(${base} ${minus ? "−" : "+"} ${d})`;
    const sg = minus ? -1 : 1;
    return numx({
      q: [
        `${n} = ${base} ${minus ? "−" : "+"} ${d}, so ${a} × ${n} = ${e}. Use the distributive property to find ${a} × ${n}.`,
        `${n} = ${base} ${minus ? "−" : "+"} ${d}, así que ${a} × ${n} = ${e}. Usa la propiedad distributiva para hallar ${a} × ${n}.`,
      ],
      ans: a * n,
      wrong: wrongVals([
        [a * base + sg * d, "distributed-to-first-term-only"],
        [a * base - sg * a * d, minus ? "sign-dropped" : "used-wrong-operation"],
        [base + sg * a * d, "distributed-to-last-term-only"],
      ]),
      x: [
        `${a}(${base} ${minus ? "−" : "+"} ${d}) = ${a} × ${base} ${minus ? "−" : "+"} ${a} × ${d} = ${a * base} ${minus ? "−" : "+"} ${a * d} = ${a * n}.`,
        `${a}(${base} ${minus ? "−" : "+"} ${d}) = ${a} × ${base} ${minus ? "−" : "+"} ${a} × ${d} = ${a * base} ${minus ? "−" : "+"} ${a * d} = ${a * n}.`,
      ],
      h: [
        [
          "Multiply the outside number by each number inside the parentheses.",
          "Multiplica el número de afuera por cada número dentro del paréntesis.",
        ],
        [
          `First find ${a} × ${base}, then ${a} × ${d}.`,
          `Primero halla ${a} × ${base} y luego ${a} × ${d}.`,
        ],
        [
          `Then ${minus ? "subtract" : "add"} the two products. Keep the sign that is inside the parentheses.`,
          `Luego ${minus ? "resta" : "suma"} los dos productos. Conserva el signo que está dentro del paréntesis.`,
        ],
      ],
      meta: { kind: "mental", a, n, expr: `${a} × ${n}` },
    });
  }
  /** level 3: factor out the greatest common factor */
  function kindFactor(/** @type {any} */ rng) {
    const [v, u] = letters(rng, 2);
    const two = rng.chance(0.3);
    const g = rng.int(2, 9);
    const p = rng.int(1, 5);
    const q = rng.int(2, 7);
    if (G.gcd(p, q) !== 1) return null;
    const w = two ? u : "";
    const orig = `${g * p === 1 ? "" : g * p}${v} + ${g * q}${w}`;
    const inner = (/** @type {number} */ x, /** @type {number} */ y) =>
      `${x === 1 ? "" : x}${v} + ${y}${w}`;
    const key = `${g}(${inner(p, q)})`;
    return mcx(rng, {
      q: [
        `Factor ${orig} using the greatest common factor. Which expression is equivalent?`,
        `Factoriza ${orig} usando el máximo factor común. ¿Cuál expresión es equivalente?`,
      ],
      key: { v: key },
      wrong: [
        {
          v: `${g}(${inner(p, g * q)})`,
          tag: "factored-first-term-only",
          f: fb("factored-first-term-only"),
        },
        {
          v: `${g}(${inner(g * p, q)})`,
          tag: "factored-last-term-only",
          f: fb("factored-last-term-only"),
        },
        {
          v: inner(p, q),
          tag: "dropped-the-factor",
          f: fb("dropped-the-factor"),
        },
        {
          v: `${q}(${inner(p, g)})`,
          tag: "divided-by-wrong-number",
          f: fb("divided-by-wrong-number"),
        },
      ],
      ok: (tx) => !same(tx, orig),
      apart: (a, b) => !same(a, b),
      x: [
        `${g} divides ${g * p}${v} and ${g * q}, and no bigger number divides both. ${orig} = ${key}. Multiply back to check: ${g} × ${p === 1 ? "" : p}${v} and ${g} × ${q}.`,
        `${g} divide a ${g * p}${v} y a ${g * q}, y ningún número mayor divide a los dos. ${orig} = ${key}. Multiplica de nuevo para comprobar: ${g} × ${p === 1 ? "" : p}${v} y ${g} × ${q}.`,
      ],
      h: [
        [
          "Find the greatest number that divides every term, then write it outside the parentheses.",
          "Busca el mayor número que divide todos los términos y escríbelo afuera del paréntesis.",
        ],
        [
          "Divide each term by that number. The results go inside the parentheses.",
          "Divide cada término entre ese número. Los resultados van dentro del paréntesis.",
        ],
        [
          "Check: multiply the outside number by each term inside. Do you get the original?",
          "Comprueba: multiplica el número de afuera por cada término de adentro. ¿Obtienes la original?",
        ],
      ],
      meta: { kind: "factor", orig, g, two },
    });
  }
  function kindGcf(/** @type {any} */ rng) {
    const [v] = letters(rng, 1);
    const g = rng.int(3, 9);
    const p = rng.int(2, 5);
    const q = rng.int(2, 7);
    if (G.gcd(p, q) !== 1) return null;
    const A = g * p;
    const B = g * q;
    const small = [2, 3, 5].filter((d) => g % d === 0 && d < g);
    const orig = `${A}${v} + ${B}`;
    return numx({
      q: [
        `Factor ${orig} using the greatest common factor. What number goes outside the parentheses?`,
        `Factoriza ${orig} usando el máximo factor común. ¿Qué número va afuera del paréntesis?`,
      ],
      ans: g,
      wrong: [
        ...small.map((d) => [d, "common-factor-not-greatest"]),
        [A, "not-a-common-factor"],
        [B, "not-a-common-factor"],
        [G.lcm(A, B), "lcm-instead-of-gcf"],
      ].map(([val2, tag]) => ({
        v: val2,
        tag,
        f: fb(/** @type {string} */ (tag)),
      })),
      x: [
        `The factors of ${A} and ${B} that they share are checked from largest down: ${g} divides ${A} (${A} ÷ ${g} = ${p}) and ${B} (${B} ÷ ${g} = ${q}), and no bigger number does. So ${orig} = ${g}(${p}${v} + ${q}).`,
        `Los factores que comparten ${A} y ${B}, de mayor a menor: ${g} divide a ${A} (${A} ÷ ${g} = ${p}) y a ${B} (${B} ÷ ${g} = ${q}), y ningún número mayor lo hace. Entonces ${orig} = ${g}(${p}${v} + ${q}).`,
      ],
      h: [
        [
          "The greatest common factor is the biggest number that divides every term evenly.",
          "El máximo factor común es el mayor número que divide exactamente todos los términos.",
        ],
        [
          `Only the numbers matter here: find the GCF of ${A} and ${B}.`,
          `Aquí solo importan los números: halla el máximo factor común de ${A} y ${B}.`,
        ],
        [
          "List the factors of each number and pick the biggest one they share.",
          "Escribe los factores de cada número y elige el mayor que comparten.",
        ],
      ],
      meta: { kind: "gcf", A, B },
    });
  }
  /** level 4: spot the incorrect distribution */
  function kindBadEquation(/** @type {any} */ rng) {
    const [v] = letters(rng, 1);
    const rs = ["dist", "distSub", "distCoeff", "factor"].map((id) => REWRITES[id](rng, v));
    const i = rng.int(0, 3);
    const eqs = rs.map((r, j) => {
      if (j !== i)
        return {
          v: `${r.orig} = ${r.key}`,
          tag: "doubted-correct-equation",
          f: fb("doubted-correct-equation"),
        };
      const [tx, tag] = rng.pick(r.wrong);
      const t = diffAt(r.orig, tx, v) ?? 2;
      return {
        v: `${r.orig} = ${tx}`,
        tag,
        f: [
          `${fb(tag)[0]} For example, ${v} = ${t}: ${lastOf(r.orig, { [v]: t })} and ${lastOf(tx, { [v]: t })}.`,
          `${fb(tag)[1]} Por ejemplo, con ${v} = ${t}: ${lastOf(r.orig, { [v]: t })} y ${lastOf(tx, { [v]: t })}.`,
        ],
      };
    });
    const bad = eqs[i];
    if (identity(bad.v)) return null;
    const r = rs[i];
    const t = diffAt(r.orig, bad.v.split(" = ")[1], v) ?? 2;
    return mcx(rng, {
      q: [
        "Which equation is NOT correct? One of these distributions or factorings has a mistake.",
        "¿Cuál ecuación NO es correcta? Una de estas distribuciones o factorizaciones tiene un error.",
      ],
      key: { v: bad.v },
      wrong: eqs
        .filter((_, j) => j !== i)
        .map((e) => ({ ...e, f: fb("doubted-correct-equation") })),
      ok: (tx) => identity(tx),
      x: [
        `${bad.v} is not correct. ${bad.f[0]}`.replace(
          / For example.*$/,
          ` For ${v} = ${t} the left side is ${lastOf(r.orig, { [v]: t })} and the right side is ${lastOf(bad.v.split(" = ")[1], { [v]: t })}.`,
        ),
        `${bad.v} no es correcta. ${bad.f[1]}`.replace(
          / Por ejemplo.*$/,
          ` Con ${v} = ${t} el lado izquierdo es ${lastOf(r.orig, { [v]: t })} y el derecho es ${lastOf(bad.v.split(" = ")[1], { [v]: t })}.`,
        ),
      ],
      h: [
        [
          "To check a distribution or factoring, multiply back or try a test number on both sides.",
          "Para comprobar una distribución o una factorización, multiplica de nuevo o prueba un número en los dos lados.",
        ],
        /** @type {any} */ (TEST_HINTS[1])(v),
        [
          "In a correct distribution the outside number multiplies EVERY term inside, and every sign stays.",
          "En una distribución correcta, el número de afuera multiplica TODOS los términos de adentro y cada signo se conserva.",
        ],
      ],
      meta: { kind: "eqodd", v },
    });
  }
  const DESC = /** @type {Record<string, [string, string]>} */ ({
    "distributed-to-first-term-only": [
      "{N} multiplied only the first term inside the parentheses.",
      "{N} multiplicó solo el primer término dentro del paréntesis.",
    ],
    "distributed-to-last-term-only": [
      "{N} multiplied only the last term inside the parentheses.",
      "{N} multiplicó solo el último término dentro del paréntesis.",
    ],
    "added-outside-factor": [
      "{N} added the two numbers and kept the letter.",
      "{N} sumó los dos números y conservó la letra.",
    ],
    "added-instead-of-multiplied": [
      "{N} added the outside number to the last term instead of multiplying.",
      "{N} sumó el número de afuera al último término en lugar de multiplicar.",
    ],
  });
  /** level 4: what mistake produced this wrong distribution? */
  function kindWhatMistake(/** @type {any} */ rng) {
    const [v] = letters(rng, 1);
    const r = REWRITES.dist(rng, v);
    const name = rng.pick(NAMES);
    const works = r.wrong.map(([tx, tag]) => ({ tx, tag }));
    const pick = rng.int(0, 3);
    const mine = works[pick];
    if (new Set(works.map((w) => w.tx)).size < 4) return null;
    const say = (/** @type {number} */ k, w2 /** @type {any} */) =>
      DESC[w2.tag][k].replace("{N}", name);
    return mcx(rng, {
      q: [
        `${name} wrote ${r.orig} = ${mine.tx}. What mistake did ${name} make?`,
        `${name} escribió ${r.orig} = ${mine.tx}. ¿Qué error cometió ${name}?`,
      ],
      key: { v: say(0, mine), vEs: say(1, mine) },
      wrong: works
        .filter((_, j) => j !== pick)
        .map((w) => ({
          v: say(0, w),
          vEs: say(1, w),
          tag: w.tag,
          f: [
            `That mistake would give ${w.tx}, not ${mine.tx}. Multiply ${r.orig} yourself and compare.`,
            `Ese error daría ${w.tx}, no ${mine.tx}. Multiplica ${r.orig} tú mismo y compara.`,
          ],
        })),
      x: [
        `${fb(mine.tag)[0]} The correct result is ${r.key}.`,
        `${fb(mine.tag)[1]} El resultado correcto es ${r.key}.`,
      ],
      h: [
        [
          `Expand ${r.orig} yourself, one term at a time.`,
          `Expande ${r.orig} tú mismo, un término a la vez.`,
        ],
        [
          `Compare your answer with ${name}'s. Which term is different?`,
          `Compara tu respuesta con la de ${name}. ¿Cuál término es distinto?`,
        ],
        [
          "Ask what was done to that term: left alone, added to, or multiplied?",
          "Pregunta qué se le hizo a ese término: ¿se dejó igual, se le sumó algo o se multiplicó?",
        ],
      ],
      meta: {
        kind: "mistakeD",
        orig: r.orig,
        v,
        result: mine.tx,
        works: works.map((w) => ({
          tx: w.tx,
          t: say(0, w),
          key: w.tx === mine.tx,
        })),
      },
    });
  }
  /** level 4 reverse area: area and one side are known, find the other side */
  function kindMissingSide(/** @type {any} */ rng) {
    const [v] = letters(rng, 1);
    const g = rng.int(2, 9);
    const p = rng.int(1, 5);
    const q = rng.int(1, 9);
    const c = rng.pick(AREA);
    const area = `${g * p === 1 ? "" : g * p}${v} + ${g * q}`;
    const inner = (/** @type {number} */ x, /** @type {number} */ y) =>
      `${x === 1 ? "" : x}${v} + ${y}`;
    return mcx(rng, {
      q: [
        `${c.a[0]} has an area of (${area}) square ${c.u[0]} and a height of ${g} ${c.u[0]}. What is the width of ${c.the[0]}?`,
        `${c.a[1]} tiene un área de (${area}) ${c.u[1]} cuadrados y una altura de ${g} ${c.u[1]}. ¿Cuál es el ancho de ${c.the[1]}?`,
      ],
      key: { v: inner(p, q) },
      wrong: [
        {
          v: inner(p, g * q),
          tag: "factored-first-term-only",
          f: fb("factored-first-term-only"),
        },
        {
          v: inner(g * p, q),
          tag: "factored-last-term-only",
          f: fb("factored-last-term-only"),
        },
        {
          v: `${Math.max(g * p - g, 1) === 1 ? "" : Math.max(g * p - g, 1)}${v} + ${g * q - g > 0 ? g * q - g : 1}`,
          tag: "subtracted-instead-of-divided",
          f: fb("subtracted-instead-of-divided"),
        },
        {
          v: inner(p + g, q),
          tag: "added-outside-factor",
          f: fb("added-outside-factor"),
        },
      ],
      ok: (tx) => !same(`${g}(${tx})`, area),
      apart: (a, b) => !same(a, b),
      x: [
        `Area = height × width, so width = area ÷ height. Divide every term by ${g}: (${area}) ÷ ${g} = ${inner(p, q)}. Check: ${g}(${inner(p, q)}) = ${area}.`,
        `Área = alto × ancho, así que ancho = área ÷ alto. Divide cada término entre ${g}: (${area}) ÷ ${g} = ${inner(p, q)}. Comprueba: ${g}(${inner(p, q)}) = ${area}.`,
      ],
      h: [
        [
          "Area = height × width. If you know the area and the height, divide to find the width.",
          "Área = alto × ancho. Si conoces el área y el alto, divide para hallar el ancho.",
        ],
        [
          `Divide EVERY term of the area by ${g}.`,
          `Divide TODOS los términos del área entre ${g}.`,
        ],
        [
          `Check your width: ${g} times the width should give the area.`,
          `Comprueba tu ancho: ${g} por el ancho debe dar el área.`,
        ],
      ],
      meta: { kind: "dim", area, g },
    });
  }
  function checkDistribute(/** @type {any} */ item) {
    const m = item.meta;
    switch (m.kind) {
      case "num-expand": {
        const want = m.a * (m.b + m.c);
        if (!near(val(item.c[item.a]), want)) return "the expansion does not equal the product";
        if (item.c[item.a] !== `${m.a} × ${m.b} + ${m.a} × ${m.c}`)
          return "the key is not the expansion";
        for (const [i, c] of item.c.entries())
          if (i !== item.a && near(val(c), want)) return `${c} has the same value`;
        return true;
      }
      case "mental": {
        if (!near(val(m.expr), G.value(item.a))) return `${m.expr} is ${val(m.expr)}`;
        for (const w of item.fw || [])
          if (near(G.value(w.v), G.value(item.a))) return `fw ${w.v} equals the key`;
        return true;
      }
      case "factor": {
        const c = item.c[item.a];
        if (!same(c, m.orig)) return `${c} is not equivalent to ${m.orig}`;
        const all = (m.orig.match(/\d+/g) || []).map(Number);
        if (Number(c.split("(")[0]) !== all.reduce((x, y) => G.gcd(x, y)))
          return "the outside number is not the GCF of the terms";
        const inside = (c.slice(c.indexOf("(")).match(/\d+/g) || []).map(Number);
        if (inside.length > 1 && G.gcd(inside[0], inside[1]) !== 1)
          return "the factoring is not complete";
        for (const [i, o] of item.c.entries())
          if (i !== item.a && same(o, m.orig)) return `${o} is also equivalent`;
        return true;
      }
      case "gcf": {
        const g = G.gcd(m.A, m.B);
        if (g !== G.value(item.a)) return `gcd(${m.A}, ${m.B}) is ${g}`;
        for (const w of item.fw || []) if (G.value(w.v) === g) return `fw ${w.v} equals the key`;
        return true;
      }
      case "eqodd": {
        if (identity(item.c[item.a])) return "the key equation is correct";
        for (const [i, o] of item.c.entries())
          if (i !== item.a && !identity(o)) return `${o} is also incorrect`;
        return true;
      }
      case "mistakeD": {
        const hits = m.works.filter((/** @type {any} */ w) => w.tx === m.result);
        if (hits.length !== 1) return "the result matches more than one mistake";
        if (same(m.result, m.orig)) return "the result is not wrong";
        return item.c[item.a] === hits[0].t ? true : "the key is not the matching mistake";
      }
      case "dim": {
        if (!same(`${m.g}(${item.c[item.a]})`, m.area)) return `${m.g} × width is not the area`;
        for (const [i, o] of item.c.entries())
          if (i !== item.a && same(`${m.g}(${o})`, m.area)) return `${o} also works`;
        return true;
      }
      default:
        return checkEquiv(item);
    }
  }
  G.register("distribute", {
    title: "The distributive property",
    titleEs: "La propiedad distributiva",
    levels: 4,
    make(/** @type {any} */ rng, /** @type {number} */ level) {
      const eq = (/** @type {string} */ id) => (/** @type {any} */ r) => {
        const [v] = letters(r, 1);
        const w = REWRITES[id](r, v);
        return mcx(r, {
          q: expandQ(r, w.orig),
          key: { v: w.key },
          wrong: w.wrong.map(([tx, tag]) => ({ v: tx, tag, f: fb(tag) })),
          ok: (tx) => !same(tx, w.orig),
          apart: (a, b) => !same(a, b),
          x: [
            `${w.rule[0]} So ${w.orig} = ${w.key}.`,
            `${w.rule[1]} Entonces ${w.orig} = ${w.key}.`,
          ],
          h: [
            [
              "The distributive property: a(b + c) = ab + ac.",
              "La propiedad distributiva: a(b + c) = ab + ac.",
            ],
            w.hint,
            [
              "Write the products in order and check each sign.",
              "Escribe los productos en orden y revisa cada signo.",
            ],
          ],
          meta: { kind: "equiv", orig: w.orig, v },
        });
      };
      const table = /** @type {Record<number, [Function, number][]>} */ ({
        1: [
          [eq("dist"), 5],
          [kindDistNumber, 3],
          [kindArea, 2],
        ],
        2: [
          [eq("distSub"), 3],
          [eq("distCoeff"), 3],
          [kindMental, 2.5],
          [kindArea, 1.5],
        ],
        3: [
          [kindFactor, 5],
          [kindGcf, 3],
          [eq("distCoeff"), 1],
        ],
        4: [
          [kindBadEquation, 4.5],
          [kindWhatMistake, 3.5],
          [kindMissingSide, 2],
        ],
      })[level];
      return until("distribute", () => pickBy(rng, table)(rng));
    },
    check: checkDistribute,
  });

  /* ================================================================================================================
   * simplifyExpr (lesson 6-15)
   * ============================================================================================================== */
  /** is s written in simplest form? no parentheses and no two terms with the same letter part (a different reading of the text) */
  const isSimplest = (/** @type {string} */ s) => {
    if (s.includes("(")) return false;
    const seen = new Set();
    for (const piece of s.split(/ [+−] /)) {
      const letterPart = piece.replace(/^\d+(\.\d+)?/, "");
      if (seen.has(letterPart)) return false;
      seen.add(letterPart);
    }
    return true;
  };
  /** level 1: what is the first step? */
  const stepTexts = (
    /** @type {number} */ k,
    /** @type {number} */ b,
    /** @type {number} */ c,
    /** @type {string} */ v,
  ) => ({
    key: [`Multiply ${k} by ${v} and by ${b}.`, `Multiplica ${k} por ${v} y por ${b}.`],
    add: [`Add ${k} and ${c}.`, `Suma ${k} y ${c}.`],
    unlike: [`Add ${b} and ${c}${v}.`, `Suma ${b} y ${c}${v}.`],
    inside: [`Multiply ${k} by ${c}${v}.`, `Multiplica ${k} por ${c}${v}.`],
  });
  function kindFirstStep(/** @type {any} */ rng) {
    const [v] = letters(rng, 1);
    const k = rng.int(2, 6);
    const b = rng.int(2, 8);
    const c = rng.int(2, 6);
    if (new Set([k, b, c]).size < 3) return null;
    const orig = `${k}(${v} + ${b}) + ${c}${v}`;
    const t = stepTexts(k, b, c, v);
    return mcx(rng, {
      q: [
        `What is the first step in simplifying ${orig}?`,
        `¿Cuál es el primer paso para simplificar ${orig}?`,
      ],
      key: { v: t.key[0], vEs: t.key[1] },
      wrong: [
        {
          v: t.add[0],
          vEs: t.add[1],
          tag: "added-before-multiplying",
          f: fb("added-before-multiplying"),
        },
        {
          v: t.unlike[0],
          vEs: t.unlike[1],
          tag: "combined-unlike-terms",
          f: fb("combined-unlike-terms"),
        },
        {
          v: t.inside[0],
          vEs: t.inside[1],
          tag: "ignored-parentheses",
          f: fb("ignored-parentheses"),
        },
      ],
      x: [
        `The parentheses hide two terms, so distribute first: ${k}(${v} + ${b}) = ${k}${v} + ${k * b}. Only then can you combine the like terms: ${show(tidy(expandParts([{ k, ts: [T(1, v), K(b)] }, { ts: [T(c, v)] }])))}.`,
        `El paréntesis esconde dos términos, así que primero distribuye: ${k}(${v} + ${b}) = ${k}${v} + ${k * b}. Solo después puedes combinar los términos semejantes: ${show(tidy(expandParts([{ k, ts: [T(1, v), K(b)] }, { ts: [T(c, v)] }])))}.`,
      ],
      h: [
        simpHints(v)[0],
        [
          "Look for a number touching a parenthesis. It multiplies everything inside.",
          "Busca un número pegado a un paréntesis. Multiplica todo lo de adentro.",
        ],
        [
          "Like terms can only be combined once the parentheses are gone.",
          "Los términos semejantes solo se combinan cuando ya no hay paréntesis.",
        ],
      ],
      meta: {
        kind: "step",
        k,
        b,
        c,
        v,
        texts: { key: t.key[0], others: [t.add[0], t.unlike[0], t.inside[0]] },
      },
    });
  }
  /** level 4: all four are equivalent, only one is in simplest form */
  function kindSimplest(/** @type {any} */ rng) {
    const [v] = letters(rng, 1);
    const parts = PARTS[rng.pick(["b", "c", "d", "f"])](rng, v);
    if (!plausible(parts)) return null;
    const orig = showParts(parts);
    const ex = expandParts(parts);
    const key = show(tidy(ex));
    const V = ex.filter((t) => t.v);
    const C = ex.filter((t) => !t.v);
    const cands = [
      [show(ex), "stopped-early"],
      [showParts([...parts].reverse()), "parentheses-left"],
      [show([...tidy(V), ...C]), "constants-uncombined"],
      [show([...V, ...tidy(C)]), "variables-uncombined"],
    ].filter(([tx]) => tx !== orig && same(tx, orig) && !isSimplest(tx));
    const t = rng.int(2, 4);
    return mcx(rng, {
      q: [
        `All of these expressions are equivalent to ${orig}. Which one is in simplest form?`,
        `Todas estas expresiones son equivalentes a ${orig}. ¿Cuál está en su forma más simple?`,
      ],
      key: { v: key },
      wrong: cands.map(([tx, tag]) => ({ v: tx, tag, f: fb(tag) })),
      ok: (tx) => same(tx, orig),
      x: [
        `${key} has no parentheses and no like terms left to combine. ${simpWork(parts, key)[0]}`,
        `${key} no tiene paréntesis ni términos semejantes por combinar. ${simpWork(parts, key)[1]}`,
      ],
      h: [
        [
          "Simplest form means no parentheses and no like terms that can still be combined.",
          "La forma más simple significa sin paréntesis y sin términos semejantes que aún se puedan combinar.",
        ],
        [
          `All four give the same value (try ${v} = ${t}). Look at how each one is written instead.`,
          `Las cuatro dan el mismo valor (prueba con ${v} = ${t}). Mira mejor cómo está escrita cada una.`,
        ],
        [
          "Check each choice for parentheses first, then for letter terms or plain numbers that can still be combined.",
          "Revisa en cada opción primero si hay paréntesis y luego si quedan términos con letra o números solos por combinar.",
        ],
      ],
      meta: { kind: "simplest", orig, v },
    });
  }
  /** level 4: which expression simplifies to this? Each wrong choice would give it IF a named slip were made */
  function kindWhichSimplifies(/** @type {any} */ rng) {
    const [v] = letters(rng, 1);
    const k = rng.int(2, 6);
    const b = rng.int(1, 8);
    const c = rng.int(1, 6);
    const d = rng.int(0, 9);
    const build = (
      /** @type {number} */ bb,
      /** @type {number} */ cc,
      /** @type {number} */ dd,
    ) => [{ k, ts: [T(1, v), K(bb)] }, { ts: [T(cc, v), K(dd)] }];
    const P = build(b, c, d);
    const S = show(tidy(expandParts(P)));
    const key = showParts(P);
    const wrong = [];
    for (const [mode, tag] of [
      ["first", "distributed-to-first-term-only"],
      ["last", "distributed-to-last-term-only"],
      ["added", "added-instead-of-multiplied"],
    ]) {
      const hits = [];
      for (let bb = 1; bb <= 30; bb++)
        for (let cc = 1; cc <= 12; cc++)
          for (let dd = 0; dd <= 30; dd++) {
            const Q = build(bb, cc, dd);
            if (show(tidy(expandParts(Q, mode))) === S && !same(showParts(Q), S))
              hits.push(showParts(Q));
          }
      if (hits.length) wrong.push({ v: rng.pick(hits), tag, f: fb(tag) });
    }
    return mcx(rng, {
      q: [`Which expression simplifies to ${S}?`, `¿Cuál expresión se simplifica a ${S}?`],
      key: { v: key },
      wrong,
      ok: (tx) => !same(tx, S),
      apart: (a, b2) => !same(a, b2),
      x: [
        `${simpWork(P, S)[0]} So ${key} simplifies to ${S}.`,
        `${simpWork(P, S)[1]} Entonces ${key} se simplifica a ${S}.`,
      ],
      h: [
        [
          "Simplify each choice and see which one gives the target. Distribute first, then combine.",
          "Simplifica cada opción y mira cuál da el resultado. Primero distribuye y luego combina.",
        ],
        [
          "The number outside the parentheses must multiply every term inside. Watch the plain numbers.",
          "El número de afuera del paréntesis debe multiplicar todos los términos de adentro. Fíjate en los números solos.",
        ],
        [
          "Start with the plain numbers: which choice ends with the right plain number after distributing?",
          "Empieza por los números solos: ¿qué opción termina con el número solo correcto después de distribuir?",
        ],
      ],
      meta: { kind: "equiv", orig: S, v, noStem: true },
    });
  }
  /** level 4: who simplified correctly? */
  function kindWho(/** @type {any} */ rng) {
    const [v] = letters(rng, 1);
    const parts = PARTS[rng.pick(["b", "c", "f", "d"])](rng, v);
    if (!plausible(parts)) return null;
    const orig = showParts(parts);
    const key = show(tidy(expandParts(parts)));
    const names = rng.shuffle(NAMES).slice(0, 4);
    const sl = slipsOf(parts).filter(
      (s) => !same(s.v, orig) && !s.v.startsWith("−") && s.v !== "0",
    );
    const seen = new Set([key]);
    const wrong = [];
    for (const s of rng.shuffle(sl))
      if (!seen.has(s.v) && wrong.length < 3) seen.add(s.v), wrong.push(s);
    if (wrong.length < 3) return null;
    const t = rng.int(2, 4);
    return mcx(rng, {
      q: [
        `Four students simplified ${orig}. Who is correct?`,
        `Cuatro estudiantes simplificaron ${orig}. ¿Quién tiene la respuesta correcta?`,
      ],
      key: { v: `${names[0]}: ${key}` },
      wrong: wrong.map((s, i) => ({
        v: `${names[i + 1]}: ${s.v}`,
        tag: s.tag,
        f: [
          `${fb(s.tag)[0]} Check ${v} = ${t}: ${lastOf(orig, { [v]: t })} for the original, but ${lastOf(s.v, { [v]: t })} for ${names[i + 1]}'s answer.`,
          `${fb(s.tag)[1]} Comprueba con ${v} = ${t}: ${lastOf(orig, { [v]: t })} para la original, pero ${lastOf(s.v, { [v]: t })} para la respuesta de ${names[i + 1]}.`,
        ],
      })),
      ok: (tx) => !same(tx.split(": ")[1], orig),
      apart: (a, b) => !same(a.split(": ")[1], b.split(": ")[1]),
      x: [
        `${names[0]} is correct. ${simpWork(parts, key)[0]}`,
        `${names[0]} tiene razón. ${simpWork(parts, key)[1]}`,
      ],
      h: [
        ...simpHints(v),
        [
          "Simplify it yourself first, then compare with each student.",
          "Simplifícala tú primero y luego compara con cada estudiante.",
        ],
      ],
      meta: { kind: "equiv", orig, v, named: true },
    });
  }
  function checkSimplify(/** @type {any} */ item) {
    const m = item.meta;
    if (m.kind === "step") {
      const t = stepTexts(m.k, m.b, m.c, m.v);
      if (item.c[item.a] !== t.key[0]) return "the key is not the distributing step";
      return item.c.every(
        (/** @type {string} */ c, /** @type {number} */ i) =>
          i === item.a || [t.add[0], t.unlike[0], t.inside[0]].includes(c),
      )
        ? true
        : "unexpected distractor";
    }
    if (m.kind === "simplest") {
      const key = item.c[item.a];
      if (!same(key, m.orig) || !isSimplest(key))
        return `${key} is not an equivalent simplest form`;
      for (const [i, o] of item.c.entries()) {
        if (i === item.a) continue;
        if (!same(o, m.orig)) return `${o} is not equivalent to ${m.orig}`;
        if (isSimplest(o)) return `${o} is also in simplest form`;
      }
      return true;
    }
    return checkEquiv(item);
  }
  G.register("simplifyExpr", {
    title: "Simplify expressions",
    titleEs: "Simplificar expresiones",
    levels: 4,
    make(/** @type {any} */ rng, /** @type {number} */ level) {
      const simp = (/** @type {string[]} */ ids) => (/** @type {any} */ r) => {
        const [v] = letters(r, 1);
        return simpItem(r, PARTS[r.pick(ids)](r, v), v, "simplify");
      };
      const table = /** @type {Record<number, [Function, number][]>} */ ({
        1: [
          [kindFirstStep, 3.5],
          [simp(["a"]), 6.5],
        ],
        2: [[simp(["b", "c", "a"]), 10]],
        3: [[simp(["d", "e", "f", "g"]), 10]],
        4: [
          [kindSimplest, 4],
          [kindWhichSimplifies, 3.5],
          [kindWho, 2.5],
        ],
      })[level];
      return until("simplifyExpr", () => pickBy(rng, table)(rng));
    },
    check: checkSimplify,
  });
})();

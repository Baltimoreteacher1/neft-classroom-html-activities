/* Switchyard Odyssey — pure mathematics for the Expression Express expedition.
 *
 * No Phaser here: expression parsing, the three "misconception evaluators", the problem
 * generators and the judges/classifiers every builder uses. Loaded before the builders as
 * window.EE_MATH, and testable in Node with a tiny `window` shim.
 *
 *   evaluate(src, x, flags)   normal order of operations; flags.powTimes (3² read as 3 × 2),
 *                             flags.digits (3x with x = 4 read as 34)
 *   evaluateLTR(src, x)       strict left-to-right, exponents applied to the running total
 *   tower*                    the switch tower: a flat list of cars that collapse step by step
 *   gen.*                     seeded generators (rng = {int, pick, shuffle, next})
 *   judge.*                   {ok} | {ok:false, tag, ...details}
 */
(function (root) {
  "use strict";
  const MINUS = "−";
  const SUP = { 2: "²", 3: "³" };

  /* ── Tokenizer + evaluators ─────────────────────────────────────────── */
  function tokenize(src) {
    const s = String(src).replace(/\s+/g, "");
    const raw = [];
    let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (/[0-9]/.test(c)) {
        let j = i;
        while (j < s.length && /[0-9.]/.test(s[j])) j++;
        raw.push({ t: "num", v: Number(s.slice(i, j)) });
        i = j;
      } else if (c === "x") {
        raw.push({ t: "x" });
        i++;
      } else if (c === "²" || c === "³") {
        raw.push({ t: "pow", e: c === "²" ? 2 : 3 });
        i++;
      } else if ("+-−×*÷/".includes(c)) {
        const o = c === "-" ? MINUS : c === "*" ? "×" : c === "/" ? "÷" : c;
        raw.push({ t: "op", o });
        i++;
      } else if (c === "(" || c === ")") {
        raw.push({ t: c });
        i++;
      } else throw new Error("EE_MATH: bad character " + c + " in " + src);
    }
    const out = [];
    raw.forEach((tk) => {
      const prev = out[out.length - 1];
      const endsValue = prev && /^(num|x|\)|pow)$/.test(prev.t);
      const startsValue = /^(num|x|\()$/.test(tk.t);
      if (endsValue && startsValue) out.push({ t: "op", o: "·", implicit: true });
      out.push(tk);
    });
    return out;
  }
  const apply = (o, a, b) => (o === "+" ? a + b : o === MINUS ? a - b : o === "÷" ? a / b : a * b);

  function evaluate(src, x, flags = {}) {
    const tk = Array.isArray(src) ? src : tokenize(src);
    let i = 0;
    const peek = () => tk[i];
    function primary() {
      const t = tk[i++];
      if (!t) throw new Error("EE_MATH: unexpected end");
      if (t.t === "num") return { v: t.v, lit: "num", raw: t.v };
      if (t.t === "x") return { v: x, lit: "x" };
      if (t.t === "(") {
        const inner = expr();
        if (!tk[i] || tk[i].t !== ")") throw new Error("EE_MATH: missing )");
        i++;
        return { v: inner.v, first: inner.first };
      }
      throw new Error("EE_MATH: unexpected " + t.t);
    }
    function factor() {
      let p = primary();
      while (peek() && peek().t === "pow") {
        const e = tk[i++].e;
        p = { v: flags.powTimes ? p.v * e : p.v ** e };
      }
      return p;
    }
    function term() {
      let left = factor();
      while (peek() && peek().t === "op" && "×÷·".includes(peek().o)) {
        const o = tk[i++].o;
        const right = factor();
        if (o === "·" && flags.digits && left.lit === "num" && right.lit === "x")
          left = { v: Number(String(left.raw) + String(x)) };
        else if (o === "·" && flags.firstOnly && right.first != null)
          left = { v: left.v * right.first + (right.v - right.first) };
        else left = { v: apply(o, left.v, right.v) };
      }
      return left;
    }
    /** {v, first}: first = value of the leading term (used by flags.firstOnly). */
    function expr() {
      const first = term().v;
      let v = first;
      let terms = 1;
      while (peek() && peek().t === "op" && (peek().o === "+" || peek().o === MINUS)) {
        const o = tk[i++].o;
        v = apply(o, v, term().v);
        terms++;
      }
      return { v, first: terms > 1 ? first : null };
    }
    const v = expr().v;
    if (i !== tk.length) throw new Error("EE_MATH: trailing tokens in expression");
    return v;
  }

  /** Strict left to right: every operation (and every exponent) acts on the running total. */
  function evaluateLTR(src, x, flags = {}) {
    const tk = Array.isArray(src) ? src : tokenize(src);
    let i = 0;
    function operand() {
      const t = tk[i++];
      if (t.t === "num") return t.v;
      if (t.t === "x") return x;
      if (t.t === "(") {
        const v = seq();
        i++;
        return v;
      }
      throw new Error("EE_MATH: unexpected " + t.t);
    }
    function seq() {
      let v = operand();
      while (i < tk.length && tk[i].t !== ")") {
        const t = tk[i++];
        if (t.t === "pow") v = flags.powTimes ? v * t.e : v ** t.e;
        else v = apply(t.o, v, operand());
      }
      return v;
    }
    return seq();
  }

  /** Values a student reaches through each named misconception (only those that differ). */
  function misconceptionValues(src, x) {
    const right = evaluate(src, x);
    const out = {};
    const add = (tag, fn) => {
      let v;
      try {
        v = fn();
      } catch (_e) {
        return;
      }
      if (Number.isFinite(v) && v !== right && !Object.values(out).includes(v)) out[tag] = v;
    };
    add("leftToRight", () => evaluateLTR(src, x));
    add("powerTimes", () => evaluate(src, x, { powTimes: true }));
    add("digits", () => evaluate(src, x, { digits: true }));
    add("firstOnly", () => evaluate(src, x, { firstOnly: true }));
    return out;
  }
  function classifyValue(src, x, typed) {
    const alts = misconceptionValues(src, x);
    return Object.keys(alts).find((k) => alts[k] === typed) || null;
  }

  /** Display: "3x + 2", true minus, × between numbers. */
  function fmtNum(n) {
    return n < 0 ? MINUS + Math.abs(n) : String(n);
  }

  /* ── Switch tower: a flat row of cars that collapse one operation at a time ─ */
  // item = {t:'n', v} | {t:'p', b, e} | {t:'o', o} | {t:'('} | {t:')'}
  function towerItems(src) {
    const out = [];
    tokenize(src).forEach((tk) => {
      if (tk.t === "num") out.push({ t: "n", v: tk.v });
      else if (tk.t === "pow") {
        const base = out.pop();
        out.push({ t: "p", b: base.v, e: tk.e });
      } else if (tk.t === "op") out.push({ t: "o", o: tk.o });
      else out.push({ t: tk.t });
    });
    return out;
  }
  const itemLabel = (it) =>
    it.t === "n" ? fmtNum(it.v) : it.t === "p" ? it.b + SUP[it.e] : it.t === "o" ? it.o : it.t;
  const towerText = (items) =>
    items.map(itemLabel).join(" ").replace(/\( /g, "(").replace(/ \)/g, ")");
  function towerFireable(items, i) {
    const it = items[i];
    if (!it) return false;
    if (it.t === "p") return true;
    return it.t === "o" && items[i - 1]?.t === "n" && items[i + 1]?.t === "n";
  }
  /** Is firing item i allowed by the order of operations right now? */
  function towerLegal(items, i) {
    if (!towerFireable(items, i)) return false;
    const it = items[i];
    if (it.t === "p") return true;
    const before = items[i - 2];
    const after = items[i + 2];
    const isOp = (x, set) => x && x.t === "o" && set.includes(x.o);
    if (it.o === "×" || it.o === "÷") return !isOp(before, ["÷"]);
    // + and −: no × or ÷ may be bound to either neighbour, and nothing subtracted to the left.
    return !isOp(before, ["×", "÷", MINUS]) && !isOp(after, ["×", "÷"]);
  }
  function towerTruth(items, i) {
    const it = items[i];
    if (it.t === "p") return it.b ** it.e;
    return apply(it.o, items[i - 1].v, items[i + 1].v);
  }
  function towerFire(items, i, value) {
    let next;
    if (items[i].t === "p")
      next = [...items.slice(0, i), { t: "n", v: value }, ...items.slice(i + 1)];
    else next = [...items.slice(0, i - 1), { t: "n", v: value }, ...items.slice(i + 2)];
    // ( n ) collapses to n.
    let changed = true;
    while (changed) {
      changed = false;
      for (let k = 0; k + 2 < next.length; k++) {
        if (next[k].t === "(" && next[k + 1].t === "n" && next[k + 2].t === ")") {
          next = [...next.slice(0, k), next[k + 1], ...next.slice(k + 3)];
          changed = true;
          break;
        }
      }
    }
    return next;
  }
  /** The worked order: exponents first, then the leftmost legal ×/÷, then leftmost legal +/−. */
  function towerNextStep(items) {
    const legal = items.map((_, i) => i).filter((i) => towerLegal(items, i));
    const rank = (i) => (items[i].t === "p" ? 0 : "×÷".includes(items[i].o) ? 1 : 2);
    legal.sort((a, b) => rank(a) - rank(b) || a - b);
    return legal.length ? legal[0] : -1;
  }
  function towerSolve(items) {
    const steps = [];
    let cur = items;
    while (cur.length > 1) {
      const i = towerNextStep(cur);
      if (i < 0) return null;
      const v = towerTruth(cur, i);
      steps.push({ i, v, label: stepLabel(cur, i), before: cur });
      cur = towerFire(cur, i, v);
    }
    return { steps, value: cur[0].v };
  }
  function stepLabel(items, i) {
    const it = items[i];
    if (it.t === "p") return it.b + SUP[it.e];
    return fmtNum(items[i - 1].v) + " " + it.o + " " + fmtNum(items[i + 1].v);
  }
  /** steps = [{legal, pow?:{b,e}, typed, truth}] in the order the student fired them. */
  function judgeTower(problem, steps, finalValue) {
    if (finalValue === problem.value) return { ok: true };
    const k = steps.findIndex((s) => !s.legal);
    if (k >= 0) return { ok: false, tag: "leftToRight", step: k };
    const p = steps.findIndex((s) => s.pow && s.typed === s.pow.b * s.pow.e);
    if (p >= 0) return { ok: false, tag: "powerTimes", step: p };
    const a = steps.findIndex((s) => s.typed !== s.truth);
    return { ok: false, tag: "arith", step: Math.max(0, a) };
  }

  /* ── Pattern filler: "A + B × C²" with letter ranges ───────────────────── */
  function fill(pattern, ranges, rng) {
    const vals = {};
    Object.keys(ranges).forEach((k) => {
      vals[k] = rng.int(ranges[k][0], ranges[k][1]);
    });
    return { text: pattern.replace(/[A-F]/g, (k) => vals[k]), vals };
  }
  const isNat = (v) => Number.isInteger(v) && v >= 0;

  /* ── Generators ─────────────────────────────────────────────────────── */
  const TOWER = {
    1: [
      ["A + B × C", { A: [2, 20], B: [2, 9], C: [2, 9] }],
      ["A − B × C", { A: [20, 60], B: [2, 6], C: [2, 6] }],
      ["A + B²", { A: [2, 20], B: [3, 9] }],
      ["B² − A", { A: [2, 20], B: [5, 9] }],
    ],
    2: [
      ["A + B × C²", { A: [2, 15], B: [2, 5], C: [3, 6] }],
      ["A × B² − C", { A: [2, 5], B: [3, 6], C: [2, 20] }],
      ["A² + B × C", { A: [3, 9], B: [2, 9], C: [2, 9] }],
      ["B³ − A × C", { A: [2, 5], B: [3, 4], C: [2, 5] }],
    ],
    3: [
      ["(A + B) × C − D²", { A: [2, 9], B: [2, 9], C: [2, 6], D: [3, 5] }],
      ["A² − (B + C) × D", { A: [7, 12], B: [1, 5], C: [1, 5], D: [2, 4] }],
      ["A × (B + C) + D²", { A: [2, 6], B: [2, 8], C: [2, 8], D: [3, 6] }],
      ["A² ÷ B + C × D", { A: [4, 10], B: [2, 5], C: [2, 6], D: [2, 6] }],
      ["A³ + (B − C) × D", { A: [2, 4], B: [6, 12], C: [1, 5], D: [2, 5] }],
    ],
  };
  function genTower(rng, tier) {
    const list = TOWER[Math.min(3, Math.max(1, tier))];
    for (let tries = 0; tries < 400; tries++) {
      const [pat, ranges] = rng.pick(list);
      const { text } = fill(pat, ranges, rng);
      const items = towerItems(text);
      const sol = towerSolve(items);
      if (!sol || !sol.steps.every((s) => isNat(s.v))) continue;
      if (sol.value < 1 || sol.value > 300) continue;
      const ltr = evaluateLTR(text, 0);
      const hasOrderTrap = /[+−]/.test(text) && /[×÷²³]/.test(text);
      if (hasOrderTrap && ltr === sol.value) continue;
      const powT = evaluate(text, 0, { powTimes: true });
      if (/[²³]/.test(text) && powT === sol.value) continue;
      return { text, items, value: sol.value, steps: sol.steps, ltr, powT };
    }
    const text = "5 + 3 × 4";
    const items = towerItems(text);
    const sol = towerSolve(items);
    return { text, items, value: sol.value, steps: sol.steps, ltr: 32, powT: 17 };
  }

  const CARGO = {
    1: [
      ["Ax + B", { A: [2, 9], B: [1, 9] }],
      ["Ax − B", { A: [3, 9], B: [1, 5] }],
      ["B + Ax", { A: [2, 9], B: [2, 9] }],
      ["Ax", { A: [2, 9] }],
    ],
    2: [
      ["x² + B", { B: [1, 9] }],
      ["Ax²", { A: [2, 4] }],
      ["A(x + B)", { A: [2, 6], B: [1, 6] }],
      ["B + Ax", { A: [2, 9], B: [2, 9] }],
      ["x³", {}],
    ],
    3: [
      ["Ax² − B", { A: [2, 4], B: [1, 9] }],
      ["A(x − B) + C", { A: [2, 5], B: [1, 2], C: [1, 9] }],
      ["B + Ax²", { A: [2, 3], B: [2, 9] }],
      ["x² + Ax", { A: [2, 6] }],
      ["(x + A)²", { A: [1, 4] }],
    ],
  };
  function genCargo(rng, tier) {
    const t = Math.min(3, Math.max(1, tier));
    const nCars = t === 1 ? 2 : 3;
    for (let tries = 0; tries < 400; tries++) {
      const x = t === 1 ? rng.int(2, 6) : rng.int(2, t === 3 ? 5 : 6);
      const templates = rng.shuffle(CARGO[t]).slice(0, nCars);
      const cars = templates.map(([pat, ranges]) => {
        const { text } = fill(pat, ranges, rng);
        return { text, value: evaluate(text, x), alts: misconceptionValues(text, x) };
      });
      if (!cars.every((c) => isNat(c.value) && c.value >= 1 && c.value <= 400)) continue;
      // Every car must be able to show at least one misconception distinctly.
      if (!cars.every((c) => Object.keys(c.alts).length)) continue;
      return { x, cars };
    }
    return {
      x: 4,
      cars: ["3x + 2", "x² + 1"].map((text) => ({
        text,
        value: evaluate(text, 4),
        alts: misconceptionValues(text, 4),
      })),
    };
  }
  function judgeCargo(problem, typed) {
    for (let i = 0; i < problem.cars.length; i++) {
      const car = problem.cars[i];
      if (typed[i] === car.value) continue;
      const tag = classifyValue(car.text, problem.x, typed[i]) || "arith";
      return { ok: false, tag, car: i, over: typed[i] > car.value };
    }
    return { ok: true };
  }

  /* ── Couplers: equivalent trains. form lin = [p]x ± [q]; fac1 = [g](x ± [q]); fac = [g]([p]x ± [q]) */
  function formValue(form, e, sign, x) {
    const s = sign === MINUS ? -1 : 1;
    if (form === "lin") return e[0] * x + s * e[1];
    if (form === "fac1") return e[0] * (x + s * e[1]);
    return e[0] * (e[1] * x + s * e[2]);
  }
  function formText(form, e, sign) {
    const b = (v) => (v == null || v === "" ? "▢" : String(v));
    if (form === "lin") return `${b(e[0])}x ${sign} ${b(e[1])}`;
    if (form === "fac1") return `${b(e[0])}(x ${sign} ${b(e[1])})`;
    return `${b(e[0])}(${b(e[1])}x ${sign} ${b(e[2])})`;
  }
  function gcd(a, b) {
    return b ? gcd(b, a % b) : Math.abs(a);
  }
  const WORDS = ["crates", "coal", "seats"];
  function genCouple(rng, variant, tier) {
    for (let tries = 0; tries < 400; tries++) {
      if (variant === "expand") {
        const a = rng.int(2, 6);
        if (tier >= 2) {
          const c = rng.int(2, 4);
          const sign = rng.pick(["+", MINUS]);
          const b = rng.int(1, 6);
          if (a * c === a * b || b === c) continue;
          return {
            variant,
            source: `${a}(${c}x ${sign} ${b})`,
            form: "lin",
            sign,
            answer: [a * c, a * b],
            params: { a, b, c },
            xs: sign === MINUS ? [b, b + 1, b + 4] : [1, 2, 5],
          };
        }
        const b = rng.int(1, 9);
        if (a === b) continue;
        return {
          variant,
          source: `${a}(x + ${b})`,
          form: "lin",
          sign: "+",
          answer: [a, a * b],
          params: { a, b },
          xs: [1, 2, 5],
        };
      }
      if (variant === "factor") {
        const g = rng.int(2, 6);
        const p = rng.int(1, 5);
        const q = rng.int(1, 7);
        if (gcd(p, q) !== 1 || p === q) continue;
        return {
          variant,
          source: `${g * p}x + ${g * q}`,
          form: "fac",
          sign: "+",
          answer: [g, p, q],
          params: { g, p, q, A: g * p, B: g * q },
          xs: [1, 2, 5],
        };
      }
      // words: an expression written from a route description.
      if (tier >= 2) {
        const g = rng.int(2, 5);
        const q = rng.int(2, 6);
        if (g === q) continue;
        return {
          variant,
          story: "trains",
          form: "fac1",
          sign: "+",
          answer: [g, q],
          params: { g, q },
          source: `${g}(x + ${q})`,
          xs: [1, 2, 5],
        };
      }
      const story = rng.pick(WORDS);
      const p = rng.int(3, 9);
      const q = rng.int(2, story === "coal" ? p - 1 : 9);
      if (p === q) continue;
      const sign = story === "coal" ? MINUS : "+";
      return {
        variant,
        story,
        form: "lin",
        sign,
        answer: [p, q],
        params: { p, q },
        source: `${p}x ${sign} ${q}`,
        xs: [1, 2, 5],
      };
    }
    return {
      variant: "expand",
      source: "2(x + 3)",
      form: "lin",
      sign: "+",
      answer: [2, 6],
      params: { a: 2, b: 3 },
      xs: [1, 2, 5],
    };
  }
  const sourceValue = (pb, x) => formValue(pb.form, pb.answer, pb.sign, x);
  function judgeCouple(pb, e, sign) {
    const same = pb.xs.every((x) => formValue(pb.form, e, sign, x) === sourceValue(pb, x));
    const g1 = pb.form === "fac" && e[0] < 2;
    if (same && !g1) return { ok: true };
    if (g1 && same) return { ok: false, tag: "trivialFactor" };
    const A = pb.answer;
    const P = pb.params;
    const eq = (arr) => arr.every((v, i) => v === e[i]);
    if (pb.variant === "expand") {
      const sA = pb.sign;
      if (sign !== sA && eq(A)) return { ok: false, tag: "sign" };
      const firstOnly =
        P.c != null
          ? [
              [P.a * P.c, P.b],
              [P.c, P.a * P.b],
            ]
          : [
              [P.a, P.b],
              [1, P.a * P.b],
            ];
      if (firstOnly.some(eq)) return { ok: false, tag: "firstOnly" };
      if (e[1] === P.a + P.b || (P.c != null && e[0] === P.a + P.c))
        return { ok: false, tag: "addInstead" };
    } else if (pb.variant === "factor") {
      if (e[0] > 1 && (e[2] === P.B || e[1] === P.A)) return { ok: false, tag: "firstOnly" };
      if (e[0] > 1 && (e[2] === P.B - e[0] || e[1] === P.A - e[0]))
        return { ok: false, tag: "subtractInstead" };
    } else {
      if (sign !== pb.sign && eq(A)) return { ok: false, tag: "sign" };
      if (eq([A[1], A[0]])) return { ok: false, tag: "swapped" };
      if (pb.form === "lin" && e[0] === 1 && e[1] === A[0] + A[1])
        return { ok: false, tag: "addInstead" };
      if (pb.form === "fac1" && e[0] === A[0] && e[1] === A[0] * A[1])
        return { ok: false, tag: "doubleCount" };
    }
    // Which test run failed first, and was the student's train heavier or lighter there?
    const x = pb.xs.find((v) => formValue(pb.form, e, sign, v) !== sourceValue(pb, v));
    return {
      ok: false,
      tag: "notEquivalent",
      x,
      over: formValue(pb.form, e, sign, x) > sourceValue(pb, x),
    };
  }

  /* ── Merge: combine like terms into a short train ─────────────────────── */
  // term = {k:'x2'|'x'|'c', n (≥1), neg?:bool}; grouped = {k:'group', a, b, inner:'x+b'}
  function termText(t, first) {
    const coef = t.k === "c" ? String(t.n) : t.n === 1 ? "" : String(t.n);
    const body = coef + (t.k === "x2" ? "x²" : t.k === "x" ? "x" : "");
    if (t.k === "group") return (first ? "" : "+ ") + `${t.a}(x + ${t.b})`;
    if (first) return (t.neg ? MINUS : "") + body;
    return (t.neg ? MINUS + " " : "+ ") + body;
  }
  function genMerge(rng, tier) {
    for (let tries = 0; tries < 400; tries++) {
      const terms = [];
      let kinds;
      if (tier >= 3) {
        const a = rng.int(2, 5);
        const b = rng.int(1, 6);
        const c = rng.int(1, 6);
        const d = rng.int(1, 9);
        if (a * b === b + d || a === b) continue;
        const group = { k: "group", a, b };
        const rest = rng.shuffle([
          { k: "x", n: c },
          { k: "c", n: d },
        ]);
        const all = [group, ...rest];
        return {
          tier,
          kinds: ["x", "c"],
          terms: all,
          answer: [a + c, a * b + d],
          params: { a, b, c, d },
          text: all.map((t, i) => termText(t, i === 0)).join(" "),
        };
      }
      if (tier === 2) {
        kinds = ["x2", "x", "c"];
        const s1 = rng.int(1, 4);
        const s2 = rng.int(1, 3);
        const a1 = rng.int(3, 8);
        const a2 = rng.int(1, a1 - 1);
        const c1 = rng.int(4, 9);
        const c2 = rng.int(1, 3);
        terms.push(
          { k: "x2", n: s1 },
          { k: "x2", n: s2 },
          { k: "x", n: a1 },
          { k: "x", n: a2, neg: true },
          { k: "c", n: c1 },
          { k: "c", n: c2 },
        );
      } else {
        kinds = ["x", "c"];
        const a1 = rng.int(2, 6);
        const a2 = rng.int(2, 5);
        terms.push(
          { k: "x", n: a1 },
          { k: "x", n: 1 },
          { k: "x", n: a2 },
          { k: "c", n: rng.int(2, 9) },
          { k: "c", n: rng.int(1, 9) },
        );
      }
      let order = rng.shuffle(terms);
      // A subtracted term never leads the train.
      if (order[0].neg) order = [...order.slice(1), order[0]];
      const sum = (k, abs) =>
        order.filter((t) => t.k === k).reduce((s, t) => s + (t.neg && !abs ? -t.n : t.n), 0);
      const answer = kinds.map((k) => sum(k));
      if (answer.some((v) => v < 1)) continue;
      const absAnswer = kinds.map((k) => sum(k, true));
      // Keep every misconception's number distinct so the feedback names the right one.
      const ix = kinds.indexOf("x");
      const ic = kinds.indexOf("c");
      const i2 = kinds.indexOf("x2");
      const wrongs = [answer[ix] + answer[ic], answer[ix] - 1, answer[ix] + 1];
      if (i2 >= 0) wrongs.push(answer[ix] + answer[i2]);
      if (absAnswer[ix] !== answer[ix] && wrongs.includes(absAnswer[ix])) continue;
      return {
        tier,
        kinds,
        terms: order,
        answer,
        absAnswer,
        text: order.map((t, i) => termText(t, i === 0)).join(" "),
      };
    }
    return genMerge({ int: (a) => a, pick: (a) => a[0], shuffle: (a) => a, next: () => 0 }, 1);
  }
  function judgeMerge(pb, e) {
    const A = pb.answer;
    if (A.every((v, i) => v === e[i])) return { ok: true };
    const ix = pb.kinds.indexOf("x");
    const ic = pb.kinds.indexOf("c");
    const i2 = pb.kinds.indexOf("x2");
    const total = A.reduce((s, v) => s + v, 0);
    // Unlike terms pushed together: an x² car merged into x, or x merged with numbers.
    if (i2 >= 0 && e[ix] === A[ix] + A[i2] && e[i2] !== A[i2])
      return { ok: false, tag: "unlikePower" };
    if (i2 >= 0 && e[i2] === A[ix] + A[i2] && e[ix] !== A[ix])
      return { ok: false, tag: "unlikePower" };
    if (e[ix] === A[ix] + A[ic] || e[ic] === A[ix] + A[ic]) return { ok: false, tag: "unlike" };
    if (e.length > 1 && e.reduce((s, v) => s + v, 0) === total && e.some((v) => v === 0))
      return { ok: false, tag: "unlike" };
    if (pb.tier >= 3 && e[ic] === pb.params.b + pb.params.d) return { ok: false, tag: "firstOnly" };
    if (pb.absAnswer && pb.absAnswer.some((v, i) => v !== A[i] && e[i] === v))
      return { ok: false, tag: "sign" };
    const lone = pb.terms.find((t) => t.k === "x" && t.n === 1);
    if (lone && e[ix] === A[ix] + (lone.neg ? 1 : -1)) return { ok: false, tag: "loneX" };
    const bad = e.findIndex((v, i) => v !== A[i]);
    return { ok: false, tag: "count", car: bad, over: e[bad] > A[bad] };
  }

  root.EE_MATH = {
    MINUS,
    SUP,
    tokenize,
    evaluate,
    evaluateLTR,
    misconceptionValues,
    classifyValue,
    fmtNum,
    towerItems,
    towerText,
    itemLabel,
    towerFireable,
    towerLegal,
    towerTruth,
    towerFire,
    towerNextStep,
    towerSolve,
    stepLabel,
    judgeTower,
    genTower,
    genCargo,
    judgeCargo,
    formValue,
    formText,
    genCouple,
    sourceValue,
    judgeCouple,
    termText,
    genMerge,
    judgeMerge,
  };
})(typeof window !== "undefined" ? window : globalThis);

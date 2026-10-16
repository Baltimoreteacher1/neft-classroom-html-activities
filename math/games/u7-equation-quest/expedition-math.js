/* Bridgekeepers — the pure mathematics behind the Equation Quest expedition.
 * No Phaser here: problem generators, the balance model, judges and misconception
 * classifiers, so every rule can be checked in Node with thousands of seeds.
 * The builders in expedition-missions.js and expedition-gates.js draw on these.
 */
(function (root) {
  "use strict";
  const L = (en, es) => ({ en, es });
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  const MINUS = "−";
  const signed = (n) => (n < 0 ? MINUS + Math.abs(n) : String(n));

  /* ── Balance model: left pan (p/q)·x + B, right pan C, hidden solution s ── */
  /** Text for one pan state, e.g. "3x + 4", "x ÷ 2", "x − 5". */
  function leftText(st) {
    const crate = st.p === 1 ? "x" : st.p + "x";
    let s = st.q === 1 ? crate : crate + " ÷ " + st.q;
    if (st.B > 0) s += " + " + st.B;
    if (st.B < 0) s += " " + MINUS + " " + Math.abs(st.B);
    return s;
  }
  const eqText = (st) => leftText(st) + " = " + st.C;

  /** Counterweight problems. variant addsub | muldiv; tier 1..2. */
  function genScale(rng, variant, tier) {
    if (variant === "muldiv") {
      if (tier >= 2 && rng.next() < 0.5) {
        const k = rng.int(2, 5);
        const c = rng.int(2, 9);
        return { p: 1, q: k, B: 0, C: c, s: k * c, form: "div" };
      }
      const a = rng.int(tier >= 2 ? 3 : 2, tier >= 2 ? 6 : 5);
      const s = rng.int(2, 9);
      return { p: a, q: 1, B: 0, C: a * s, s, form: "times" };
    }
    if (tier >= 2 && rng.next() < 0.5) {
      const b = rng.int(3, 12);
      const s = rng.int(b + 2, b + 14);
      return { p: 1, q: 1, B: -b, C: s - b, s, form: "minus" };
    }
    const b = rng.int(2, tier >= 2 ? 12 : 9);
    const s = rng.int(tier >= 2 ? 5 : 3, tier >= 2 ? 20 : 15);
    return { p: 1, q: 1, B: b, C: s + b, s, form: "plus" };
  }
  const isolated = (st) => st.p === 1 && st.q === 1 && st.B === 0;
  /** >0 left pan heavier, <0 right pan heavier, 0 balanced (exact integer test). */
  const lean = (st) => st.p * st.s + st.B * st.q - st.C * st.q;
  const OPS = ["−", "+", "÷", "×"];
  const AMOUNT_MAX = 20;

  /**
   * Apply one move. op ∈ OPS, n 1..20, target both|left|right.
   * → {ok:true, st, sameOp, wrongOp, oneSide} or {ok:false, reason} (a refused move:
   * the scale physically cannot do it; never counted as a miss).
   */
  function applyOp(st, op, n, target) {
    const L_ = target !== "right";
    const R_ = target !== "left";
    const next = { ...st };
    const sameOp =
      L_ &&
      ((op === "+" && st.B > 0) ||
        (op === "−" && st.B < 0) ||
        (op === "×" && st.q === 1 && st.p > 1) ||
        (op === "÷" && st.q > 1));
    const wrongOp =
      L_ &&
      !sameOp &&
      (((op === "+" || op === "−") && st.B === 0 && (st.p > 1 || st.q > 1)) ||
        ((op === "×" || op === "÷") && n > 1 && st.B !== 0 && st.p === 1 && st.q === 1));
    if (op === "+" || op === "−") {
      const d = op === "+" ? n : -n;
      if (L_) next.B += d;
      if (R_) next.C += d;
    } else if (op === "×") {
      if (L_) {
        const g = gcd(st.p * n, st.q);
        next.p = (st.p * n) / g;
        next.q = st.q / g;
        next.B = st.B * n;
      }
      if (R_) next.C = st.C * n;
    } else {
      if ((L_ && st.B % n !== 0) || (R_ && st.C % n !== 0)) return { ok: false, reason: "split" };
      if (L_) {
        const g = gcd(st.p, st.q * n);
        next.p = st.p / g;
        next.q = (st.q * n) / g;
        next.B = st.B / n;
      }
      if (R_) next.C = st.C / n;
    }
    if (next.C < 0) return { ok: false, reason: "negRight" };
    if (next.C > 99 || next.B > 60 || next.B < -20 || next.p > 12 || next.q > 12)
      return { ok: false, reason: "tooMany" };
    return { ok: true, st: next, sameOp, wrongOp, oneSide: target !== "both" };
  }
  /** The inverse moves that isolate x, in order. */
  function solutionPath(st) {
    const moves = [];
    if (st.B > 0) moves.push({ op: "−", n: st.B });
    if (st.B < 0) moves.push({ op: "+", n: -st.B });
    if (st.q > 1) moves.push({ op: "×", n: st.q });
    if (st.p > 1) moves.push({ op: "÷", n: st.p });
    return moves;
  }
  /** history = [{sameOp, wrongOp, oneSide}] of moves the student applied. */
  function judgeScale(st, history) {
    if (isolated(st) && st.C === st.s) return { ok: true };
    if (!history.length) return { ok: false, incomplete: true, tag: "empty" };
    const tilted = lean(st) !== 0;
    if (tilted && history.some((h) => h.oneSide)) return { ok: false, tag: "oneSide" };
    if (history.some((h) => h.sameOp)) return { ok: false, tag: "sameOp" };
    if (history.some((h) => h.wrongOp)) return { ok: false, tag: "wrongOp" };
    if (tilted) return { ok: false, tag: "oneSide" };
    return { ok: false, tag: "notIsolated" };
  }

  /* ── Relations ─────────────────────────────────────────────────────────── */
  const RELS = ["=", "<", ">", "≤", "≥"];
  function holds(l, rel, r) {
    if (!Number.isFinite(l) || !Number.isFinite(r)) return false;
    const e = Math.abs(l - r) < 1e-9;
    if (rel === "=") return e;
    if (rel === "<") return l < r && !e;
    if (rel === ">") return l > r && !e;
    if (rel === "≤") return l < r || e;
    return l > r || e;
  }
  const strictToggle = { "<": "≤", "≤": "<", ">": "≥", "≥": ">", "=": "=" };
  const reverse = { "<": ">", ">": "<", "≤": "≥", "≥": "≤", "=": "=" };
  const pointsRight = (rel) => rel === ">" || rel === "≥";
  const closedRel = (rel) => rel === "≤" || rel === "≥";

  /* ── Keystones: which values make the sentence true ────────────────────── */
  function lhsOf(form, a, b) {
    return form === "plus"
      ? { text: "x + " + b, f: (x) => x + b, sub: (v) => v + " + " + b }
      : form === "minus"
        ? { text: "x " + MINUS + " " + b, f: (x) => x - b, sub: (v) => v + " " + MINUS + " " + b }
        : { text: a + "x", f: (x) => a * x, sub: (v) => a + " × " + v };
  }
  function genStones(rng, variant, tier) {
    const form = rng.pick(
      variant === "ineq" ? ["plus", "times", "minus"] : ["plus", "minus", "times"],
    );
    const a = rng.int(2, tier >= 2 ? 6 : 5);
    const b = rng.int(2, tier >= 2 ? 12 : 9);
    const lo = variant === "ineq" ? 4 : 2;
    const s = form === "minus" ? rng.int(b + Math.max(lo, 2), b + 12) : rng.int(lo, 12);
    const lhs = lhsOf(form, a, b);
    const c = lhs.f(s);
    const rel = variant === "ineq" ? rng.pick(["<", ">", "≤", "≥"]) : "=";
    let values;
    let sameOpValue = null;
    if (variant === "ineq") {
      values = [s, s - 1, s - 3, s + 1, s + 2, s + 4];
    } else {
      sameOpValue = form === "plus" ? c + b : form === "minus" ? c - b : c * a;
      const pool = [s + 1, s - 1, s + 2, c, s + 3];
      values = [s];
      if (sameOpValue > 0 && sameOpValue !== s) values.push(sameOpValue);
      for (const v of pool) if (values.length < 5 && v > 0 && !values.includes(v)) values.push(v);
    }
    values = rng.shuffle(values);
    const truth = values.map((v) => holds(lhs.f(v), rel, c));
    return {
      variant,
      form,
      a,
      b,
      c,
      s,
      rel,
      lhs: lhs.text,
      values,
      truth,
      sameOpValue,
      sub: lhs.sub,
      f: lhs.f,
    };
  }
  const sentenceText = (pz) => pz.lhs + " " + pz.rel + " " + pz.c;
  /** chosen = array of stone indexes in the arch. */
  function judgeStones(pz, chosen) {
    if (!chosen.length) return { ok: false, incomplete: true, tag: "empty" };
    const set = new Set(chosen);
    const exact = pz.values.every((_, i) => set.has(i) === pz.truth[i]);
    if (exact) return { ok: true };
    const wrong = chosen.filter((i) => !pz.truth[i]);
    if (pz.variant !== "ineq") {
      const so = chosen.find((i) => pz.values[i] === pz.sameOpValue);
      if (so !== undefined) return { ok: false, tag: "sameOp", stone: so };
      return { ok: false, tag: "notTrue", stone: wrong[0] };
    }
    const t = pz.s;
    const right = pointsRight(pz.rel);
    const wrongSide = (v) => (right ? v < t : v > t);
    const bi = pz.values.indexOf(t);
    if (
      chosen.some((i) => wrongSide(pz.values[i])) &&
      chosen.every((i) => wrongSide(pz.values[i]) || i === bi)
    )
      return { ok: false, tag: "flipped", stone: wrong[0] };
    const diff = pz.values.map((_, i) => i).filter((i) => set.has(i) !== pz.truth[i]);
    if (diff.length === 1 && diff[0] === bi) return { ok: false, tag: "endpoint", stone: bi };
    if (!wrong.length) return { ok: false, tag: "missedSome" };
    return { ok: false, tag: "notTrue", stone: wrong[0] };
  }

  /* ── Weight gate: graph an inequality on a number line ─────────────────── */
  const GATE_STORIES = {
    "≤": (t) =>
      L(
        `A sign on the span says: carts may weigh AT MOST ${t} tons. A cart weighs x tons. Shade every safe weight.`,
        `Un letrero dice: los carros pueden pesar COMO MÁXIMO ${t} toneladas. Un carro pesa x toneladas. Sombrea todos los pesos seguros.`,
      ),
    "<": (t) =>
      L(
        `A raft floats only if it weighs LESS THAN ${t} kg. The raft weighs x kg. Shade every weight that floats.`,
        `Una balsa flota solo si pesa MENOS DE ${t} kg. La balsa pesa x kg. Sombrea todos los pesos que flotan.`,
      ),
    "≥": (t) =>
      L(
        `The counterweight needs AT LEAST ${t} stones to lift the gate. x is the number of stones. Shade every number that lifts it.`,
        `El contrapeso necesita AL MENOS ${t} piedras para subir la reja. x es el número de piedras. Sombrea todos los números que la suben.`,
      ),
    ">": (t) =>
      L(
        `The lift moves only with MORE THAN ${t} kg on it. x is the weight on the lift. Shade every weight that moves it.`,
        `El elevador se mueve solo con MÁS DE ${t} kg encima. x es el peso en el elevador. Sombrea todos los pesos que lo mueven.`,
      ),
  };
  function genGate(rng, variant, tier) {
    const rel = rng.pick(["<", ">", "≤", "≥"]);
    let pz;
    if (variant === "represent") {
      const t = rng.int(6, 40);
      pz = {
        variant,
        rel,
        t,
        sentence: "x " + rel + " " + t,
        story: GATE_STORIES[rel](t),
        sameOpT: null,
      };
    } else {
      const forms = tier >= 3 ? ["plus", "minus", "times", "div"] : ["plus", "minus", "times"];
      const form = rng.pick(forms);
      let t;
      let lhs;
      let c;
      let sameOpT;
      if (form === "plus") {
        const b = rng.int(2, 12);
        t = rng.int(3, 20);
        c = t + b;
        lhs = "x + " + b;
        sameOpT = c + b;
      } else if (form === "minus") {
        const b = rng.int(2, 9);
        c = rng.int(2, 14);
        t = c + b;
        lhs = "x " + MINUS + " " + b;
        sameOpT = c - b;
      } else if (form === "times") {
        const a = rng.int(2, tier >= 3 ? 8 : 6);
        t = rng.int(2, 12);
        c = a * t;
        lhs = a + "x";
        sameOpT = c * a;
      } else {
        const k = rng.int(2, 4);
        c = rng.int(2, 8);
        t = k * c;
        lhs = "x ÷ " + k;
        sameOpT = null;
      }
      pz = { variant, rel, t, form, sentence: lhs + " " + rel + " " + c, sameOpT };
    }
    const lo = Math.max(0, pz.t - rng.int(5, 14));
    pz.lo = lo;
    pz.hi = lo + 20;
    pz.start = pz.t === lo + 10 ? lo + 6 : lo + 10;
    return pz;
  }
  /** g = {v, closed, right, touched} */
  function judgeGate(pz, g) {
    if (!g.touched) return { ok: false, incomplete: true, tag: "empty" };
    const okDir = g.right === pointsRight(pz.rel);
    const okEnd = g.closed === closedRel(pz.rel);
    if (g.v === pz.t && okDir && okEnd) return { ok: true };
    if (g.v === pz.t && !okDir) return { ok: false, tag: "flipped" };
    if (g.v === pz.t) return { ok: false, tag: "endpoint" };
    if (pz.sameOpT != null && g.v === pz.sameOpT) return { ok: false, tag: "sameOp" };
    return { ok: false, tag: "boundary" };
  }
  /** Is value v inside the student's shaded ray? */
  const inGraph = (g, v) => (v === g.v ? g.closed : g.right ? v > g.v : v < g.v);

  /* ── Plaque: write the sentence for a crossing story ───────────────────── */
  const EQ_KINDS = ["add", "less", "gave", "times", "share"];
  const INEQ_KINDS = ["atMost", "under", "atLeast", "over", "basket"];
  function genStory(rng, variant, tier) {
    const kinds =
      variant === "ineq"
        ? tier >= 2
          ? INEQ_KINDS
          : INEQ_KINDS.slice(0, 4)
        : variant === "problem"
          ? EQ_KINDS
          : ["add", "less", "gave"];
    const kind = rng.pick(kinds);
    let a = 0;
    let b = 0;
    let c = 0;
    let s = null;
    let target;
    let story;
    let sameOpAns = null;
    const X = "x";
    if (kind === "add") {
      b = rng.int(3, 15);
      s = rng.int(8, 30);
      c = s + b;
      target = { a: X, op: "+", b, rel: "=", r: c };
      sameOpAns = c + b;
      story = L(
        `A cart holds x kg of stone. The keeper adds ${b} kg of lanterns. Now the cart weighs ${c} kg.`,
        `Un carro lleva x kg de piedra. El guardián agrega ${b} kg de faroles. Ahora el carro pesa ${c} kg.`,
      );
    } else if (kind === "less" || kind === "gave") {
      b = rng.int(2, 9);
      do c = rng.int(4, 20);
      while (c === b || c === 2 * b);
      s = c + b;
      target = { a: X, op: "−", b, rel: "=", r: c };
      sameOpAns = c - b > 0 && c - b !== s ? c - b : null;
      story =
        kind === "less"
          ? L(
              `The moss sack weighs ${b} kg less than the stone block. The stone block weighs x kg. The moss sack weighs ${c} kg.`,
              `El saco de musgo pesa ${b} kg menos que el bloque de piedra. El bloque pesa x kg. El saco de musgo pesa ${c} kg.`,
            )
          : L(
              `The keeper had x lanterns. She hung ${b} lanterns on the bridge. Now she has ${c} lanterns left.`,
              `La guardiana tenía x faroles. Colgó ${b} faroles en el puente. Ahora le quedan ${c} faroles.`,
            );
    } else if (kind === "times") {
      a = rng.int(3, 8);
      s = rng.int(2, 9);
      c = a * s;
      b = a;
      target = { a, op: "×", b: X, rel: "=", r: c };
      sameOpAns = c * a;
      story = L(
        `Each plank weighs x kg. ${a} planks weigh ${c} kg in all.`,
        `Cada tablón pesa x kg. ${a} tablones pesan ${c} kg en total.`,
      );
    } else if (kind === "share") {
      a = rng.int(2, 6);
      c = rng.int(3, 9);
      s = a * c;
      b = a;
      target = { a: X, op: "÷", b: a, rel: "=", r: c };
      sameOpAns = c % a === 0 ? c / a : null;
      story = L(
        `The keepers share x meters of rope equally among ${a} towers. Each tower gets ${c} meters.`,
        `Los guardianes reparten x metros de cuerda en partes iguales entre ${a} torres. Cada torre recibe ${c} metros.`,
      );
    } else if (kind === "basket") {
      b = rng.int(2, 9);
      c = rng.int(b + 8, b + 30);
      target = { a: b, op: "+", b: X, rel: "≤", r: c };
      story = L(
        `A basket weighs ${b} kg empty. You add x kg of moss. The total can be AT MOST ${c} kg. Write the rule.`,
        `Una canasta vacía pesa ${b} kg. Agregas x kg de musgo. El total puede ser COMO MÁXIMO ${c} kg. Escribe la regla.`,
      );
    } else {
      c = rng.int(8, 60);
      const rel = { atMost: "≤", under: "<", atLeast: "≥", over: ">" }[kind];
      target = { a: X, op: "", b: null, rel, r: c };
      story = {
        atMost: L(
          `The Floating Span holds AT MOST ${c} tons. A cart weighs x tons. Write the rule for a safe cart.`,
          `El Puente Flotante resiste COMO MÁXIMO ${c} toneladas. Un carro pesa x toneladas. Escribe la regla para un carro seguro.`,
        ),
        under: L(
          `A raft floats only if it weighs LESS THAN ${c} kg. The raft weighs x kg. Write the rule for a raft that floats.`,
          `Una balsa flota solo si pesa MENOS DE ${c} kg. La balsa pesa x kg. Escribe la regla para una balsa que flota.`,
        ),
        atLeast: L(
          `The counterweight needs AT LEAST ${c} stones to lift the gate. x is the number of stones. Write the rule that lifts the gate.`,
          `El contrapeso necesita AL MENOS ${c} piedras para subir la reja. x es el número de piedras. Escribe la regla que sube la reja.`,
        ),
        over: L(
          `The lift moves only with MORE THAN ${c} kg on it. x is the weight on the lift. Write the rule that moves the lift.`,
          `El elevador se mueve solo con MÁS DE ${c} kg encima. x es el peso en el elevador. Escribe la regla que mueve el elevador.`,
        ),
      }[kind];
    }
    const numbers = [...new Set([a, b, c].filter((n) => typeof n === "number" && n > 0))];
    return { variant, kind, target, story, s, sameOpAns, numbers, solve: variant === "problem" };
  }
  /** Sentence = {a, op, b, rel, r}; a/b/r are "x" or numbers; op "" means "left is just a". */
  function evalSide(tok, x) {
    return tok === "x" ? x : tok;
  }
  function evalLeft(sn, x) {
    const A = evalSide(sn.a, x);
    if (!sn.op) return A;
    const B = evalSide(sn.b, x);
    if (sn.op === "+") return A + B;
    if (sn.op === "−") return A - B;
    if (sn.op === "×") return A * B;
    return B === 0 ? Number.NaN : A / B;
  }
  const truthAt = (sn, x) => holds(evalLeft(sn, x), sn.rel, evalSide(sn.r, x));
  const GRID = Array.from({ length: 481 }, (_, i) => i / 4);
  /** Where the two sides meet (the solution or boundary), so a root between grid points is still compared. */
  function rootOf(sn) {
    if (sn.op === "÷" && sn.b === "x" && typeof sn.a === "number" && typeof sn.r === "number")
      return sn.r === 0 ? null : sn.a / sn.r;
    const d = (x) => evalLeft(sn, x) - evalSide(sn.r, x);
    const d1 = d(1);
    const slope = d(2) - d1;
    return Number.isFinite(slope) && slope !== 0 ? 1 - d1 / slope : null;
  }
  function equivalent(s1, s2, extra = []) {
    const pts = GRID.concat(extra);
    for (const sn of [s1, s2]) {
      const r = rootOf(sn);
      if (r != null && Number.isFinite(r)) pts.push(r, r - 0.001, r + 0.001);
    }
    for (const x of pts) if (truthAt(s1, x) !== truthAt(s2, x)) return false;
    return true;
  }
  const filled = (sn) =>
    sn.a != null &&
    sn.op != null &&
    sn.rel != null &&
    sn.r != null &&
    (sn.op === "" || sn.b != null);
  function sentenceString(sn) {
    const tok = (v) => (v == null ? "?" : String(v));
    return (
      (sn.op ? tok(sn.a) + " " + sn.op + " " + tok(sn.b) : tok(sn.a)) +
      " " +
      tok(sn.rel) +
      " " +
      tok(sn.r)
    );
  }
  function judgeStory(pz, sn, answer) {
    if (!filled(sn)) return { ok: false, incomplete: true, tag: "empty" };
    const tg = pz.target;
    const extra = pz.s != null ? [pz.s] : [];
    const sentenceOk = equivalent(sn, tg, extra);
    if (sentenceOk) {
      if (!pz.solve) return { ok: true };
      if (answer == null || answer === "") return { ok: false, incomplete: true, tag: "noAnswer" };
      if (Number(answer) === pz.s) return { ok: true };
      if (pz.sameOpAns != null && Number(answer) === pz.sameOpAns)
        return { ok: false, tag: "sameOp" };
      return { ok: false, tag: "arith" };
    }
    const isEq = (rel) => rel === "=";
    if (isEq(sn.rel) !== isEq(tg.rel)) return { ok: false, tag: "relation" };
    if (!isEq(tg.rel)) {
      if (equivalent(sn, { ...tg, rel: strictToggle[tg.rel] }, extra))
        return { ok: false, tag: "endpoint" };
      if (
        equivalent(sn, { ...tg, rel: reverse[tg.rel] }, extra) ||
        equivalent(sn, { ...tg, rel: strictToggle[reverse[tg.rel]] }, extra)
      )
        return { ok: false, tag: "flipped" };
    }
    if ((tg.op === "−" || tg.op === "÷") && equivalent(sn, { ...tg, a: tg.b, b: tg.a }, extra))
      return { ok: false, tag: "order" };
    for (const op of ["+", "−", "×", "÷"]) {
      if (op === tg.op || !tg.op) continue;
      if (
        equivalent(sn, { ...tg, op }, extra) ||
        equivalent(sn, { ...tg, op, a: tg.b, b: tg.a }, extra)
      )
        return { ok: false, tag: pz.kind === "less" && op === "+" ? "lessThan" : "opWord" };
    }
    return { ok: false, tag: "numbers" };
  }

  const api = {
    L,
    gcd,
    MINUS,
    signed,
    leftText,
    eqText,
    genScale,
    isolated,
    lean,
    OPS,
    AMOUNT_MAX,
    applyOp,
    solutionPath,
    judgeScale,
    RELS,
    holds,
    pointsRight,
    closedRel,
    genStones,
    sentenceText,
    judgeStones,
    genGate,
    judgeGate,
    inGraph,
    genStory,
    evalLeft,
    truthAt,
    equivalent,
    filled,
    sentenceString,
    judgeStory,
  };
  root.EQ_MISSIONS = Object.assign(root.EQ_MISSIONS || {}, api);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);

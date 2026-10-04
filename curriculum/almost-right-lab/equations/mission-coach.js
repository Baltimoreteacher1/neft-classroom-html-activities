/* =============================================================================
 * Almost-Right Lab — shared answer coach for the five equation missions.
 * -----------------------------------------------------------------------------
 * Every mission page solves one-step equations of four shapes:
 *   x + a = b    x − a = b    ax = b    x ÷ a = b
 * This file reads an equation string, judges a typed value, and writes the
 * feedback — so all five missions coach the same way:
 *
 *   wrong try 1  WHY: names the creature's exact slip when the typed value is
 *                the one that slip produces, otherwise substitutes the
 *                student's own value back in to show it does not balance.
 *                Plus the method. Never the answer.
 *   wrong try 2+ a concrete next line to write ("x = 17 − 5"). The student
 *                still does the arithmetic.
 *
 * It also makes fresh equations of the same shape for "practice again with
 * new numbers". Plain script (no module) so the inline mission code can call
 * it synchronously; exposes window.ARLCoach.
 * ========================================================================== */
(() => {
  const MINUS = "−";

  /** Parse "x + 5 = 17" / "x − 4 = 9" / "3x = 21" / "x ÷ 4 = 6". */
  function parse(text) {
    const s = String(text).replace(/\s+/g, " ").trim();
    let m = /^x ([+−-]) (\d+) = (-?\d+)$/.exec(s);
    if (m) return { kind: m[1] === "+" ? "add" : "sub", a: Number(m[2]), b: Number(m[3]) };
    m = /^(\d+)x = (-?\d+)$/.exec(s);
    if (m) return { kind: "mul", a: Number(m[1]), b: Number(m[2]) };
    m = /^x ÷ (\d+) = (-?\d+)$/.exec(s);
    if (m) return { kind: "div", a: Number(m[1]), b: Number(m[2]) };
    return null;
  }

  function solve(eq) {
    if (eq.kind === "add") return eq.b - eq.a;
    if (eq.kind === "sub") return eq.b + eq.a;
    if (eq.kind === "mul") return eq.b / eq.a;
    return eq.b * eq.a;
  }

  function text(eq) {
    if (eq.kind === "add") return `x + ${eq.a} = ${eq.b}`;
    if (eq.kind === "sub") return `x ${MINUS} ${eq.a} = ${eq.b}`;
    if (eq.kind === "mul") return `${eq.a}x = ${eq.b}`;
    return `x ÷ ${eq.a} = ${eq.b}`;
  }

  /** The left side with a value in place of x, e.g. "20 + 5". */
  function leftWith(eq, v) {
    if (eq.kind === "add") return `${v} + ${eq.a}`;
    if (eq.kind === "sub") return `${v} ${MINUS} ${eq.a}`;
    if (eq.kind === "mul") return `${eq.a} × ${v}`;
    return `${v} ÷ ${eq.a}`;
  }

  function leftValue(eq, v) {
    if (eq.kind === "add") return v + eq.a;
    if (eq.kind === "sub") return v - eq.a;
    if (eq.kind === "mul") return eq.a * v;
    return v / eq.a;
  }

  const fmt = (n) => {
    const r = Math.round(n * 1000) / 1000;
    return r < 0 ? `${MINUS}${Math.abs(r)}` : String(r);
  };

  const OPS = {
    add: { done: "adds", undo: "subtract", inverseLine: (e) => `x = ${e.b} ${MINUS} ${e.a}` },
    sub: { done: "subtracts", undo: "add", inverseLine: (e) => `x = ${e.b} + ${e.a}` },
    mul: { done: "multiplies x by", undo: "divide by", inverseLine: (e) => `x = ${e.b} ÷ ${e.a}` },
    div: { done: "divides x by", undo: "multiply by", inverseLine: (e) => `x = ${e.b} × ${e.a}` },
  };

  /** Values a student gets from the classic slips, with the slip named. */
  function slips(eq) {
    const out = [];
    if (eq.kind === "add") {
      out.push([eq.b + eq.a, `added ${eq.a} again`]);
    } else if (eq.kind === "sub") {
      out.push([eq.b - eq.a, `subtracted ${eq.a} again`]);
    } else if (eq.kind === "mul") {
      out.push([eq.b * eq.a, `multiplied by ${eq.a} again`]);
      out.push([eq.b - eq.a, `subtracted ${eq.a} — but ${eq.a}x means ${eq.a} TIMES x`]);
      out.push([eq.b + eq.a, `added ${eq.a} — but ${eq.a}x means ${eq.a} TIMES x`]);
    } else {
      out.push([eq.b / eq.a, `divided by ${eq.a} again`]);
      out.push([eq.b + eq.a, `added ${eq.a} — but x ÷ ${eq.a} means x DIVIDED by ${eq.a}`]);
    }
    return out;
  }

  /**
   * Judge one typed value.
   * @returns {{ ok: boolean, message: string, slip: boolean }}
   */
  function judge(eqText, value, tries) {
    const eq = parse(eqText);
    if (!eq || !Number.isFinite(value)) {
      return { ok: false, message: "Type a number for x.", slip: false };
    }
    const answer = solve(eq);
    if (Math.abs(value - answer) < 0.001) {
      return {
        ok: true,
        message: `Correct! Check: ${leftWith(eq, fmt(answer))} = ${fmt(eq.b)}. Both sides match.`,
        slip: false,
      };
    }
    const op = OPS[eq.kind];
    if (tries >= 2) {
      return {
        ok: false,
        message: `Write the next line in your notebook: ${op.inverseLine(eq)}. Now work out that number and type it.`,
        slip: false,
      };
    }
    const slip = slips(eq).find(([v]) => Math.abs(v - value) < 0.001);
    if (slip) {
      return {
        ok: false,
        message: `That answer comes from a classic slip: you ${slip[1]}. The equation ${op.done} ${eq.a}, so ${op.undo} ${eq.a} on both sides.`,
        slip: true,
      };
    }
    const lv = leftValue(eq, value);
    return {
      ok: false,
      message: `Not yet. Check it: if x = ${fmt(value)}, then ${leftWith(eq, fmt(value))} = ${fmt(lv)}, not ${fmt(eq.b)}. The equation ${op.done} ${eq.a} — ${op.undo} ${eq.a} on both sides.`,
      slip: false,
    };
  }

  const rand = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));

  /** A fresh equation of the same shape, with a whole-number answer. */
  function freshLike(eqText, avoid) {
    const eq = parse(eqText);
    if (!eq) return null;
    for (let i = 0; i < 40; i += 1) {
      const x = rand(3, 30);
      let next;
      if (eq.kind === "add") {
        const a = rand(3, 15);
        next = { kind: "add", a, b: x + a };
      } else if (eq.kind === "sub") {
        const a = rand(3, 15);
        next = { kind: "sub", a, b: x - a };
      } else if (eq.kind === "mul") {
        const a = rand(2, 9);
        next = { kind: "mul", a, b: a * rand(3, 12) };
      } else {
        next = { kind: "div", a: rand(2, 9), b: rand(3, 12) };
      }
      if (next.b < 1) continue;
      const t = text(next);
      if (avoid?.includes(t)) continue;
      const ans = solve(next);
      return { text: t, answer: ans, check: `${leftWith(next, fmt(ans))} = ${fmt(next.b)} ✓` };
    }
    return null;
  }

  /** Shuffle an element's children in place (Fisher–Yates). */
  function shuffleChildren(parent) {
    const kids = Array.from(parent.children);
    for (let i = kids.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [kids[i], kids[j]] = [kids[j], kids[i]];
    }
    for (const k of kids) parent.append(k);
  }

  /** @type {any} */ (window).ARLCoach = { parse, solve, judge, freshLike, shuffleChildren };
})();

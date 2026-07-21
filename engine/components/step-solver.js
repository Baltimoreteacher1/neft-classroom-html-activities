// step-solver.js — "Work It Out" step lab. A student solves a problem the way
// they would on paper: one line at a time. After every line the lab checks that
// the new line is *mathematically equivalent* to the previous one — same value
// for expression work (17.4 - 5.75 + 2.1 → 11.65 + 2.1 → 13.75), same solution
// for equation work (3x = 12 → x = 4) — and says so without ever revealing the
// answer. Wrong steps get a gentle, actionable nudge instead of a red X wall.
//
// The math engine is dependency-free: a tokenizer + shunting-yard parser
// (handles decimals, fractions as division, MIXED NUMBERS like "2 1/2",
// unicode × ÷ ·, superscripts ², implicit multiplication like 3x and 2(x+1))
// plus numeric equivalence testing — expressions are compared at sampled
// variable values; equations are compared by their root sets found on a grid
// and refined by bisection.
//
// Pure DOM, no dependencies. Public API:
//   renderStepSolver(container, cfg) -> { destroy }
//     cfg.mode    : "expression" (default) | "equation"
//     cfg.start   : first line of the problem, e.g. "3x + 6 = 18" or "3/4 ÷ 1/8"
//     cfg.answer  : optional final form, revealed only on request after real work
//     cfg.presets : optional [{ start, label?, answer? }] quick-pick problems
//     cfg.intro   : optional one-line coaching sentence under the title

const C = {
  navy: "#12355b",
  accent: "#1d4ed8",
  teal: "#0d7a76",
  tealBg: "#e2f9f5",
  amber: "#8a5800",
  amberBg: "#fbf4e6",
  ink: "#1a2b3c",
  muted: "#54677c",
  line: "#d7e2ed",
  chipBg: "#f4f8ff",
};

function esc(s) {
  return String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
}

function prefersReducedMotion() {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// --- Tokenizer -------------------------------------------------------------
// Normalizes student-friendly notation, then emits { num | var | op | paren }.
// "2 1/2" (number, space, fraction) becomes a single mixed-number value token.
const SUPS = { "⁰": 0, "¹": 1, "²": 2, "³": 3, "⁴": 4, "⁵": 5, "⁶": 6, "⁷": 7, "⁸": 8, "⁹": 9 };

function tokenize(src) {
  let s = String(src);
  for (const [ch, d] of Object.entries(SUPS)) s = s.split(ch).join(`^${d}`);
  s = s.replace(/[×·]/g, "*").replace(/−/g, "-");
  const out = [];
  let i = 0;
  const isDigit = (c) => c >= "0" && c <= "9";
  while (i < s.length) {
    const c = s[i];
    if (c === " " || c === "\t") {
      i++;
      continue;
    }
    if (isDigit(c) || (c === "." && isDigit(s[i + 1]))) {
      let j = i;
      while (j < s.length && (isDigit(s[j]) || s[j] === ".")) j++;
      const whole = s.slice(i, j);
      if ((whole.match(/\./g) || []).length > 1) throw new Error("number");
      // Mixed number: "2 1/2" → integer, spaces, fraction. Only when the first
      // part is an integer and a "a/b" follows the gap.
      const m = /^ +(\d+) *\/ *(\d+)/.exec(s.slice(j));
      if (m && !whole.includes(".")) {
        const den = Number(m[2]);
        if (den === 0) throw new Error("divzero");
        out.push({ t: "num", v: Number(whole) + Number(m[1]) / den });
        i = j + m[0].length;
        continue;
      }
      out.push({ t: "num", v: Number(whole) });
      i = j;
      continue;
    }
    if (/[a-zA-Z]/.test(c)) {
      out.push({ t: "var", v: c.toLowerCase() });
      i++;
      continue;
    }
    if ("+-*/^÷".includes(c)) {
      out.push({ t: "op", v: c });
      i++;
      continue;
    }
    if (c === "(" || c === ")") {
      out.push({ t: c });
      i++;
      continue;
    }
    throw new Error("symbol");
  }
  // Two number tokens in a row means a space-separated "3 4" — almost always a
  // mixed-number typo; refuse with a specific hint rather than guessing.
  for (let k = 1; k < out.length; k++) {
    if (out[k].t === "num" && out[k - 1].t === "num") throw new Error("mixed");
  }
  return out;
}

// --- Parser (shunting-yard → RPN) ------------------------------------------
// The fraction slash "/" binds tighter than the ÷ operation so a line like
// "3/4 ÷ 1/8" reads the way a student writes it: (3/4) ÷ (1/8), not 3/4/1/8.
const PREC = { "u-": 3, "^": 4, "*": 2, "÷": 2, "/": 2.5, "+": 1, "-": 1 };
const RIGHT = { "^": true, "u-": true };

function toRPN(tokens) {
  const outQ = [];
  const ops = [];
  let prev = null; // previous significant token, for unary minus + implicit ×
  const IMPLICIT_LEFT = (t) => t && (t.t === "num" || t.t === "var" || t.t === ")");
  for (const raw of tokens) {
    let tok = raw;
    if (IMPLICIT_LEFT(prev) && (tok.t === "var" || tok.t === "(" || tok.t === "num")) {
      // 3x, 2(x+1), (x+1)(x+2), x(4) — inject the multiplication.
      pushOp({ t: "op", v: "*" });
    }
    if (tok.t === "op" && tok.v === "-" && !IMPLICIT_LEFT(prev)) tok = { t: "op", v: "u-" };
    if (tok.t === "op" && tok.v === "+" && !IMPLICIT_LEFT(prev)) {
      prev = null;
      continue; // unary plus is a no-op
    }
    if (tok.t === "num" || tok.t === "var") outQ.push(tok);
    else if (tok.t === "op") pushOp(tok);
    else if (tok.t === "(") ops.push(tok);
    else if (tok.t === ")") {
      while (ops.length && ops[ops.length - 1].t !== "(") outQ.push(ops.pop());
      if (!ops.length) throw new Error("paren");
      ops.pop();
    }
    prev = tok.t === "op" ? { t: "op" } : tok;
  }
  while (ops.length) {
    const o = ops.pop();
    if (o.t === "(") throw new Error("paren");
    outQ.push(o);
  }
  if (!outQ.length) throw new Error("empty");
  return outQ;

  function pushOp(tok) {
    while (ops.length) {
      const top = ops[ops.length - 1];
      if (top.t !== "op") break;
      const pT = PREC[top.v];
      const pN = PREC[tok.v];
      if (pT > pN || (pT === pN && !RIGHT[tok.v])) outQ.push(ops.pop());
      else break;
    }
    ops.push(tok);
  }
}

function evalRPN(rpn, x) {
  const st = [];
  for (const tok of rpn) {
    if (tok.t === "num") st.push(tok.v);
    else if (tok.t === "var") st.push(x);
    else {
      if (tok.v === "u-") {
        if (!st.length) return NaN;
        st.push(-st.pop());
        continue;
      }
      const b = st.pop();
      const a = st.pop();
      if (a === undefined || b === undefined) return NaN;
      if (tok.v === "+") st.push(a + b);
      else if (tok.v === "-") st.push(a - b);
      else if (tok.v === "*") st.push(a * b);
      else if (tok.v === "/" || tok.v === "÷") st.push(b === 0 ? NaN : a / b);
      else if (tok.v === "^") st.push(a ** b);
    }
  }
  if (st.length !== 1) return NaN;
  return st[0];
}

// Parse one full line. Returns { sides: [rpn] (1 or 2), vars:Set, tokens }.
function parseLine(src) {
  const parts = String(src).split("=");
  if (parts.length > 2) throw new Error("equals");
  const sides = [];
  const vars = new Set();
  let tokenCount = 0;
  for (const part of parts) {
    const toks = tokenize(part);
    tokenCount += toks.length;
    for (const t of toks) if (t.t === "var") vars.add(t.v);
    sides.push(toRPN(toks));
  }
  if (vars.size > 1) throw new Error("vars");
  return { sides, vars, tokenCount };
}

// --- Equivalence -----------------------------------------------------------
const SAMPLES = [-3.7, -1.4, 0.6, 1.9, 3.3, 5.8];
const close = (a, b, tol = 1e-7) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));

// Expression (single side): equal at every sample where both are defined.
function exprEquivalent(rpnA, rpnB) {
  let compared = 0;
  for (const x of SAMPLES) {
    const a = evalRPN(rpnA, x);
    const b = evalRPN(rpnB, x);
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
    if (!close(a, b, 1e-6)) return false;
    compared++;
  }
  return compared > 0;
}

// Equation: root set of f(x) = L(x) − R(x) on a grid, refined by bisection.
function rootsOf(parsed) {
  const [L, R] = parsed.sides;
  const f = (x) => {
    const a = evalRPN(L, x);
    const b = evalRPN(R, x);
    return Number.isFinite(a) && Number.isFinite(b) ? a - b : NaN;
  };
  const roots = [];
  const addRoot = (r) => {
    if (!roots.some((q) => Math.abs(q - r) < 1e-3)) roots.push(r);
  };
  let allZero = true;
  let prevX = null;
  let prevY = null;
  for (let x = -80; x <= 80.0001; x += 0.2) {
    const y = f(x);
    if (!Number.isFinite(y)) {
      prevX = null;
      continue;
    }
    if (Math.abs(y) > 1e-6) allZero = false;
    if (Math.abs(y) < 1e-9) addRoot(x);
    else if (prevY !== null && prevY * y < 0) {
      let lo = prevX;
      let hi = x;
      let flo = prevY;
      for (let k = 0; k < 60; k++) {
        const mid = (lo + hi) / 2;
        const fm = f(mid);
        if (!Number.isFinite(fm)) break;
        if (flo * fm <= 0) hi = mid;
        else {
          lo = mid;
          flo = fm;
        }
      }
      addRoot((lo + hi) / 2);
    }
    prevX = x;
    prevY = y;
  }
  return { roots: roots.sort((a, b) => a - b), identity: allZero };
}

function eqEquivalent(pA, pB) {
  const a = rootsOf(pA);
  const b = rootsOf(pB);
  if (a.identity || b.identity) return a.identity === b.identity;
  if (a.roots.length !== b.roots.length) return false;
  return a.roots.every((r, i) => Math.abs(r - b.roots[i]) < 1e-3);
}

// Is this line a finished answer? "x = 4" (either order) for equations; a lone
// number for expressions; or matches the authored answer's compactness.
function looksSolved(parsed, mode, answerTokens) {
  if (mode === "equation") {
    if (parsed.sides.length !== 2) return false;
    const bare = (rpn) => rpn.length === 1 || (rpn.length === 2 && rpn[1].v === "u-");
    const isVar = (rpn) => rpn[0].t === "var" && rpn.length === 1;
    const isNum = (rpn) => rpn.every((t) => t.t !== "var") && bare(rpn);
    return (
      (isVar(parsed.sides[0]) && isNum(parsed.sides[1])) ||
      (isVar(parsed.sides[1]) && isNum(parsed.sides[0]))
    );
  }
  if (parsed.sides.length !== 1) return false;
  if (parsed.vars.size === 0) {
    const rpn = parsed.sides[0];
    return (
      rpn.length === 1 ||
      (rpn.length === 2 && rpn[1].v === "u-") ||
      (rpn.length === 3 && rpn[2].v === "/")
    ); // simplified fraction counts
  }
  return answerTokens > 0 && parsed.tokenCount <= answerTokens;
}

const PARSE_MSGS = {
  symbol:
    "There's a symbol in there I can't read. Stick to numbers, + − × ÷, parentheses, and one letter.",
  number: "One of your numbers has two decimal points — check it.",
  mixed: "Two numbers side by side confuse me. For a mixed number, write it like 2 1/2.",
  paren: "Your parentheses don't match up — every ( needs a ).",
  equals: "Use at most one = sign per line.",
  vars: "Use just one letter for the unknown in this problem.",
  empty: "Type a full line first, then check it.",
  divzero: "A fraction can't have 0 on the bottom.",
  sides: "An equation line needs something on both sides of the = sign.",
};

export function renderStepSolver(container, cfg = {}) {
  const mode = cfg.mode === "equation" ? "equation" : "expression";
  let problem = {
    start: cfg.start || (mode === "equation" ? "x + 7 = 15" : "18.4 - 5.75 + 2.1"),
    answer: cfg.answer || "",
  };
  const presets = Array.isArray(cfg.presets) ? cfg.presets.filter((p) => p && p.start) : [];
  let lines = []; // { text, parsed }
  let attempts = 0;

  injectStyles();
  const root = document.createElement("div");
  root.className = "stepslv";
  const intro =
    cfg.intro ||
    (mode === "equation"
      ? "Solve it one line at a time. After each step I'll check that your equation still has the same solution — like keeping a scale balanced."
      : "Work it out one line at a time. After each step I'll check that your line is still worth the same amount.");
  root.innerHTML =
    `<div class="stepslv-head"><span class="stepslv-title">📝 Work It Out — Step Lab</span></div>` +
    `<p class="stepslv-hint">${esc(intro)}</p>` +
    `<div class="stepslv-problem"><span class="stepslv-problabel">Problem</span><span class="stepslv-probtext" data-el="prob"></span></div>` +
    (presets.length
      ? `<div class="stepslv-presets" role="group" aria-label="Pick a problem">` +
        presets
          .map(
            (p, i) =>
              `<button type="button" class="stepslv-chip" data-preset="${i}">${esc(p.label || p.start)}</button>`,
          )
          .join("") +
        `</div>`
      : "") +
    `<ol class="stepslv-lines" data-el="lines" aria-label="Your steps so far"></ol>` +
    `<div class="stepslv-inrow">` +
    `<input type="text" class="stepslv-input" data-el="inp" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Type your next step" placeholder="Type your next line…" />` +
    `<button type="button" class="stepslv-go" data-el="check">Check step</button></div>` +
    `<div class="stepslv-keys" role="group" aria-label="Math symbols">` +
    ["×", "÷", "(", ")", "=", "²"]
      .map((k) => `<button type="button" class="stepslv-key" data-key="${k}">${k}</button>`)
      .join("") +
    `<button type="button" class="stepslv-key stepslv-undo" data-el="undo">↩ Undo step</button>` +
    `<button type="button" class="stepslv-key" data-el="reset">Start over</button>` +
    (problem.answer || presets.some((p) => p.answer)
      ? `<button type="button" class="stepslv-key" data-el="reveal" hidden>Show the final form</button>`
      : "") +
    `</div>` +
    `<div class="stepslv-feed" data-el="feed" role="status" aria-live="polite"></div>`;
  container.appendChild(root);

  const el = (name) => root.querySelector(`[data-el="${name}"]`);
  const inp = el("inp");
  const feed = el("feed");

  function setProblem(p) {
    problem = { start: p.start, answer: p.answer || "" };
    lines = [];
    attempts = 0;
    try {
      lines.push({ text: problem.start, parsed: parseLine(problem.start) });
    } catch {
      /* authored start should always parse; leave list empty if not */
    }
    el("prob").textContent = problem.start;
    inp.value = "";
    feed.innerHTML = "";
    const rev = el("reveal");
    if (rev) rev.hidden = true;
    renderLines();
    if (lines.length) animateReveal(0);
  }

  function renderLines() {
    el("lines").innerHTML = lines
      .map(
        (l, i) =>
          `<li class="stepslv-line${i === 0 ? " stepslv-line-first" : ""}">` +
          `<span class="stepslv-linetext">${esc(l.text)}</span>` +
          (i > 0 ? `<span class="stepslv-ok" aria-label="equivalent step">✓</span>` : "") +
          `</li>`,
      )
      .join("");
  }

  // "Self-writing" reveal for one just-added line: a soft highlight sweeps the
  // row while the text types itself in. Step text is always plain (esc'd on
  // render), so slicing is entity-safe. The full text stays in the DOM for
  // screen readers via a visually-hidden twin; only the aria-hidden visual
  // layer types. Purely cosmetic — never blocks input, grading, or state.
  let typeRaf = 0;
  function animateReveal(index) {
    const li = el("lines").children[index];
    if (!li) return;
    li.classList.add("stepslv-line-reveal");
    if (prefersReducedMotion()) return;
    const span = li.querySelector(".stepslv-linetext");
    const full = span.textContent;
    if (!full) return;
    cancelAnimationFrame(typeRaf);
    span.innerHTML =
      `<span class="stepslv-srtext">${esc(full)}</span>` +
      `<span class="stepslv-typetext" aria-hidden="true"></span>`;
    const vis = span.lastElementChild;
    // ~24ms/char, scaled down so long lines finish within ~900ms total.
    const perChar = Math.min(24, 900 / full.length);
    const t0 = performance.now();
    const tick = (now) => {
      if (!vis.isConnected) return; // list re-rendered mid-type; stop quietly
      const n = Math.min(full.length, Math.ceil((now - t0) / perChar));
      vis.textContent = full.slice(0, n);
      if (n < full.length) typeRaf = requestAnimationFrame(tick);
      else span.textContent = full; // collapse back to one plain text node
    };
    typeRaf = requestAnimationFrame(tick);
  }

  function say(kind, html) {
    feed.innerHTML = `<div class="stepslv-msg stepslv-msg-${kind}">${html}</div>`;
  }

  function checkStep() {
    const text = inp.value.trim();
    if (!text) {
      say("warn", PARSE_MSGS.empty);
      return;
    }
    let parsed;
    try {
      parsed = parseLine(text);
    } catch (e) {
      say("warn", esc(PARSE_MSGS[e.message] || PARSE_MSGS.symbol));
      return;
    }
    attempts++;
    const prev = lines[lines.length - 1];
    let equivalent = false;
    if (mode === "equation") {
      if (parsed.sides.length !== 2) {
        say("warn", esc(PARSE_MSGS.sides));
        return;
      }
      equivalent = prev ? eqEquivalent(prev.parsed, parsed) : true;
    } else {
      if (parsed.sides.length !== 1) {
        // Allow "= 13.75" style lines by treating the RHS as the expression.
        parsed.sides = [parsed.sides[1]];
      }
      equivalent = prev
        ? exprEquivalent(prev.parsed.sides[prev.parsed.sides.length - 1], parsed.sides[0])
        : true;
    }
    if (!equivalent) {
      say(
        "warn",
        mode === "equation"
          ? "Not quite — this line doesn't have the same solution as your last line. Did you do the <strong>same thing to both sides</strong>? Fix this line and check again."
          : "Not quite — this line isn't worth the same amount as your last line. Check that one operation, then try the line again.",
      );
      return;
    }
    lines.push({ text, parsed });
    inp.value = "";
    renderLines();
    animateReveal(lines.length - 1);
    let answerTokens = 0;
    if (problem.answer) {
      try {
        answerTokens = parseLine(problem.answer).tokenCount;
      } catch {}
    }
    if (looksSolved(parsed, mode, answerTokens)) {
      root.classList.add("stepslv-won");
      say(
        "win",
        mode === "equation"
          ? `🎉 <strong>Solved!</strong> Every line kept the equation balanced, and <strong>${esc(text)}</strong> is the solution. Substitute it back into line 1 to prove it.`
          : `🎉 <strong>Fully worked out!</strong> Every step stayed equivalent — <strong>${esc(text)}</strong> is your simplified answer.`,
      );
      setTimeout(() => root.classList.remove("stepslv-won"), 1400);
    } else {
      const n = lines.length - 1;
      say(
        "ok",
        `✓ <strong>Step ${n} accepted.</strong> ${mode === "equation" ? "Still balanced — same solution." : "Still equivalent — same value."} Keep going.`,
      );
      const rev = el("reveal");
      if (rev && attempts >= 3 && problem.answer) rev.hidden = false;
    }
    inp.focus();
  }

  el("check").addEventListener("click", checkStep);
  inp.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      checkStep();
    }
  });
  el("undo").addEventListener("click", () => {
    if (lines.length > 1) {
      lines.pop();
      renderLines();
      say("ok", "Last step removed — pick up from the line above.");
    }
  });
  el("reset").addEventListener("click", () => setProblem(problem));
  root.querySelectorAll("[data-key]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const at = inp.selectionStart ?? inp.value.length;
      inp.value =
        inp.value.slice(0, at) + btn.dataset.key + inp.value.slice(inp.selectionEnd ?? at);
      inp.focus();
      inp.selectionStart = inp.selectionEnd = at + btn.dataset.key.length;
    }),
  );
  root
    .querySelectorAll("[data-preset]")
    .forEach((btn) =>
      btn.addEventListener("click", () => setProblem(presets[Number(btn.dataset.preset)])),
    );
  const rev = el("reveal");
  if (rev)
    rev.addEventListener("click", () => {
      if (problem.answer)
        say(
          "ok",
          `The finished form looks like <strong>${esc(problem.answer)}</strong>. Work your lines until you get there — each step must stay equivalent.`,
        );
    });

  setProblem(problem);

  return {
    destroy() {
      cancelAnimationFrame(typeRaf);
      root.remove();
    },
  };
}

let stylesInjected = false;
function injectStyles() {
  if (stylesInjected || document.getElementById("stepslv-styles")) {
    stylesInjected = true;
    return;
  }
  stylesInjected = true;
  const s = document.createElement("style");
  s.id = "stepslv-styles";
  s.textContent = `
  .stepslv{max-width:680px;margin:0 auto;background:#fff;border:1px solid ${C.line};border-radius:16px;padding:16px 16px 18px;box-shadow:0 2px 12px rgba(12,27,42,.08);font-family:"Hanken Grotesk",system-ui,sans-serif;color:${C.ink};}
  .stepslv-title{font-family:"Outfit",system-ui,sans-serif;font-weight:800;color:${C.navy};font-size:1.05rem;}
  .stepslv-hint{margin:4px 0 12px;color:${C.muted};font-size:.9rem;line-height:1.45;}
  .stepslv-problem{display:flex;align-items:center;gap:10px;padding:10px 14px;background:#f8fbff;border:1px solid ${C.line};border-radius:12px;}
  .stepslv-problabel{font-size:.7rem;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:${C.muted};}
  .stepslv-probtext{font-family:"Outfit",system-ui,sans-serif;font-weight:800;font-size:1.15rem;color:${C.navy};}
  .stepslv-presets{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;}
  .stepslv-chip{padding:5px 12px;font-size:.9rem;font-weight:700;color:${C.navy};background:${C.chipBg};border:1.5px solid ${C.line};border-radius:999px;cursor:pointer;}
  .stepslv-chip:hover{background:#e2ecff;border-color:${C.accent};}
  .stepslv-lines{list-style:none;margin:12px 0 0;padding:0;display:flex;flex-direction:column;gap:6px;counter-reset:step -1;}
  .stepslv-line{counter-increment:step;display:flex;align-items:center;gap:10px;padding:8px 12px;background:#fbfcfe;border:1px solid ${C.line};border-radius:10px;font-size:1.05rem;font-weight:700;}
  .stepslv-line::before{content:counter(step);min-width:1.6em;height:1.6em;display:grid;place-items:center;font-size:.72rem;font-weight:800;color:${C.muted};background:${C.chipBg};border-radius:999px;}
  .stepslv-line-first::before{content:"start";min-width:auto;padding:0 8px;}
  .stepslv-linetext{flex:1;word-break:break-word;}
  .stepslv-ok{color:${C.teal};font-weight:800;}
  .stepslv-inrow{display:flex;gap:8px;margin-top:12px;}
  .stepslv-input{flex:1;min-width:0;padding:10px 12px;font-size:1.05rem;font-weight:700;color:${C.ink};border:2px solid ${C.line};border-radius:10px;background:#fbfcfe;}
  .stepslv-input:focus-visible{outline:3px solid ${C.accent};outline-offset:1px;border-color:${C.accent};}
  .stepslv-go{padding:9px 16px;font-size:.95rem;font-weight:800;color:#fff;background:linear-gradient(135deg,#4f46e5,#0e8a7d);border:0;border-radius:10px;cursor:pointer;white-space:nowrap;}
  .stepslv-go:hover{filter:brightness(1.08);}
  .stepslv-go:focus-visible,.stepslv-key:focus-visible,.stepslv-chip:focus-visible{outline:3px solid ${C.accent};outline-offset:2px;}
  .stepslv-keys{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;}
  .stepslv-key{padding:6px 12px;font-size:.95rem;font-weight:700;color:${C.navy};background:${C.chipBg};border:1.5px solid ${C.line};border-radius:8px;cursor:pointer;}
  .stepslv-key:hover{background:#e2ecff;}
  .stepslv-feed{margin-top:10px;min-height:1.2em;}
  .stepslv-msg{padding:10px 14px;border-radius:12px;font-size:.95rem;line-height:1.5;animation:stepslv-msgin .28s ease;}
  .stepslv-msg-ok{background:${C.tealBg};color:#095350;border:1px solid #9adbd2;}
  .stepslv-msg-warn{background:${C.amberBg};color:${C.amber};border:1px solid #ecd9ae;}
  .stepslv-msg-win{background:linear-gradient(135deg,#e2f9f5,#eef2ff);color:${C.navy};border:1px solid #9adbd2;font-weight:600;}
  .stepslv-won{animation:stepslv-pop .5s ease;}
  .stepslv-line-reveal{position:relative;overflow:hidden;animation:stepslv-linein .3s ease;}
  .stepslv-line-reveal::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(105deg,transparent 20%,rgba(29,78,216,.14) 45%,rgba(13,122,118,.12) 55%,transparent 80%);transform:translateX(-101%);animation:stepslv-sweep .9s ease .05s forwards;}
  .stepslv-srtext{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;}
  .stepslv-typetext::after{content:"";display:inline-block;width:2px;height:1em;margin-left:1px;vertical-align:-.15em;background:${C.accent};}
  @keyframes stepslv-pop{0%{transform:scale(1)}35%{transform:scale(1.015)}100%{transform:scale(1)}}
  @keyframes stepslv-linein{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
  @keyframes stepslv-sweep{to{transform:translateX(101%)}}
  @keyframes stepslv-msgin{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
  @media (prefers-reduced-motion:reduce){
    .stepslv-won,.stepslv-msg,.stepslv-line-reveal{animation:none;}
    .stepslv-line-reveal::after{animation:none;content:none;}
  }
  @media (max-width:480px){.stepslv-inrow{flex-direction:column}.stepslv-go{width:100%}}
  `;
  document.head.appendChild(s);
}

export default renderStepSolver;

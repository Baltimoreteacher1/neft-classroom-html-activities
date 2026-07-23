// fraction-divide.js — Interactive "divide fractions" lab (6.NOS.1). Teaches
// keep–change–flip in staged, checked steps:
//   1. Rewrite any whole/mixed numbers as improper fractions (only shown when
//      an operand actually has a whole part).
//   2. Keep–Change–Flip: keep the first fraction, change ÷ to ×, and write the
//      reciprocal of the divisor.
//   3. Multiply and simplify to lowest terms (a mixed number when it's > 1).
//
// Students type each answer as text ("5/2", "3 1/3", "4"); every check compares
// by EXACT integer fraction math, so equivalent forms are accepted and float
// error never appears. No answer is revealed until "Show me" is pressed.
//
// Pure DOM, no dependencies. Public API:
//   renderFractionDivide(host, cfg) -> { destroy }
//     cfg = {
//       kind:'fraction-divide',
//       dividend:String, divisor:String,     // e.g. "2 1/2", "3/4", "4"
//       title?:string,
//       presets?:[{ dividend, divisor, label? }]
//     }

const C = {
  navy: "#12355b",
  accent: "#1d4ed8",
  teal: "#0d7a76",
  tealFill: "#e2f9f5",
  tealInk: "#095350",
  ink: "#1a2b3c",
  muted: "#54677c",
  line: "#d7e2ed",
  wrong: "#d9534f",
  cardTint: "#f7faff",
};

function esc(s) {
  return String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
}

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}
function reduce(n, d) {
  if (d < 0) {
    n = -n;
    d = -d;
  }
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
}
function fracEq(a, b) {
  return a && b && a.n * b.d === b.n * a.d;
}

// Parse "4", "1/2", "2 1/2" -> {n,d}; null on anything else. No decimals.
function parseFrac(str) {
  const s = String(str).trim();
  let m;
  if ((m = /^(\d+)\s+(\d+)\s*\/\s*(\d+)$/.exec(s))) {
    const whole = +m[1];
    const n = +m[2];
    const d = +m[3];
    if (d === 0) return null;
    return { n: whole * d + n, d };
  }
  if ((m = /^(\d+)\s*\/\s*(\d+)$/.exec(s))) {
    if (+m[2] === 0) return null;
    return { n: +m[1], d: +m[2] };
  }
  if ((m = /^(\d+)$/.exec(s))) return { n: +m[1], d: 1 };
  return null;
}

// Does the string carry a whole part (whole number or mixed number)?
function hasWholePart(str) {
  const s = String(str).trim();
  return /^\d+$/.test(s) || /^\d+\s+\d+\s*\/\s*\d+$/.test(s);
}

// Exact fraction -> simplest display string: "3", "3/4", or "2 1/2".
function fracToString(fr) {
  const { n, d } = reduce(fr.n, fr.d);
  if (d === 1) return String(n);
  if (n > d) {
    const whole = Math.floor(n / d);
    const rem = n - whole * d;
    return rem ? `${whole} ${rem}/${d}` : String(whole);
  }
  return `${n}/${d}`;
}
const isReduced = (fr) => {
  const r = reduce(fr.n, fr.d);
  return r.n === fr.n && r.d === fr.d;
};

let stylesInjected = false;
function ensureStyles() {
  if (stylesInjected || document.getElementById("fdiv-styles")) {
    stylesInjected = true;
    return;
  }
  stylesInjected = true;
  const s = document.createElement("style");
  s.id = "fdiv-styles";
  s.textContent = `
  .fdiv-presetwrap{margin:var(--sp-3,12px) 0;display:flex;flex-direction:column;align-items:center;}
  .fdiv-presets{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-bottom:8px;}
  .fdiv-chip{padding:5px 13px;font:inherit;font-size:.85rem;font-weight:700;color:${C.navy};background:#f4f8ff;
    border:1.5px solid ${C.line};border-radius:999px;cursor:pointer;}
  .fdiv-chip:hover{background:#e2ecff;border-color:${C.accent};}
  .fdiv-chip[aria-pressed="true"]{background:${C.accent};color:#fff;border-color:${C.accent};}
  .fdiv-wrap{width:100%;max-width:420px;margin:0 auto;font-family:"Hanken Grotesk",system-ui,sans-serif;color:${C.ink};
    display:flex;flex-direction:column;align-items:center;}
  .fdiv-title{font-weight:800;color:${C.navy};margin-bottom:4px;font-size:1rem;text-align:center;}
  .fdiv-hint{font-size:.82rem;color:${C.muted};margin-bottom:10px;text-align:center;max-width:380px;line-height:1.45;}
  .fdiv-problem{font-size:1.5rem;font-weight:800;color:${C.navy};margin-bottom:12px;}
  .fdiv-steps{width:100%;display:flex;flex-direction:column;gap:10px;}
  .fdiv-step{box-sizing:border-box;padding:12px 14px;border:1px solid ${C.line};border-left:4px solid ${C.accent};
    border-radius:12px;background:${C.cardTint};}
  .fdiv-step[hidden]{display:none;}
  .fdiv-step-num{font-weight:800;color:${C.navy};font-size:.8rem;text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px;}
  .fdiv-prompt{font-size:.92rem;color:${C.ink};line-height:1.5;font-weight:600;}
  .fdiv-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:9px;}
  .fdiv-inp{width:88px;border:2px dashed ${C.accent};border-radius:8px;background:#fff;color:${C.ink};font-weight:800;
    font-size:1rem;text-align:center;padding:6px 4px;box-sizing:border-box;}
  .fdiv-inp:focus{outline:none;border-style:solid;box-shadow:0 0 0 3px rgba(29,78,216,.18);}
  .fdiv-inp.correct{border-style:solid;border-color:${C.teal};background:${C.tealFill};color:${C.tealInk};}
  .fdiv-inp.wrong{border-color:${C.wrong};background:#fdeceb;color:${C.wrong};animation:fdiv-shake .3s;}
  @keyframes fdiv-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
  @media (prefers-reduced-motion:reduce){.fdiv-inp.wrong{animation:none;}}
  .fdiv-lab{font-weight:700;color:${C.muted};font-size:.9rem;}
  .fdiv-op{font-weight:800;color:${C.navy};font-size:1.1rem;}
  .fdiv-btn{font:inherit;font-weight:700;font-size:.85rem;border-radius:999px;padding:7px 16px;cursor:pointer;border:2px solid transparent;}
  .fdiv-btn-check{background:${C.accent};color:#fff;}
  .fdiv-btn-check:hover{filter:brightness(1.05);}
  .fdiv-btn:focus-visible{outline:3px solid ${C.accent};outline-offset:2px;}
  .fdiv-btn-ghost{background:#fff;color:${C.navy};border-color:${C.line};}
  .fdiv-status{min-height:1.1em;margin-top:7px;font-size:.85rem;font-weight:700;}
  .fdiv-status.ok{color:${C.teal};}
  .fdiv-status.no{color:${C.wrong};}
  .fdiv-controls{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:12px;}
  .fdiv-result{margin-top:10px;font-size:1.1rem;font-weight:900;color:${C.teal};text-align:center;}
  .fdiv-result[hidden]{display:none;}
  `;
  document.head.appendChild(s);
}

function mountFractionDivide(host, cfg = {}) {
  ensureStyles();
  const dividendStr = String(cfg.dividend);
  const divisorStr = String(cfg.divisor);
  const A = parseFrac(dividendStr);
  const B = parseFrac(divisorStr);

  const wrap = document.createElement("div");
  wrap.className = "fdiv-wrap";
  if (!A || !B || B.n === 0) {
    wrap.innerHTML = `<p class="fdiv-hint">Could not read this problem.</p>`;
    host.appendChild(wrap);
    return { destroy: () => wrap.remove() };
  }

  // Which operands need rewriting to improper fractions.
  const aNeeds = hasWholePart(dividendStr);
  const bNeeds = hasWholePart(divisorStr);
  const recip = { n: B.d, d: B.n }; // reciprocal of the divisor
  const product = { n: A.n * B.d, d: A.d * B.n };
  const answer = reduce(product.n, product.d);

  const title = cfg.title || `Divide: ${dividendStr} ÷ ${divisorStr}`;
  const rewriteInputs =
    (aNeeds
      ? `<span class="fdiv-lab">${esc(dividendStr)} =</span><input class="fdiv-inp" data-k="impA" type="text" inputmode="numeric" aria-label="${esc(dividendStr)} as an improper fraction" placeholder="a/b">`
      : "") +
    (bNeeds
      ? `<span class="fdiv-lab">${esc(divisorStr)} =</span><input class="fdiv-inp" data-k="impB" type="text" inputmode="numeric" aria-label="${esc(divisorStr)} as an improper fraction" placeholder="a/b">`
      : "");

  wrap.innerHTML =
    `<div class="fdiv-title">${esc(title)}</div>` +
    `<div class="fdiv-hint">Keep–Change–Flip: keep the first fraction, change ÷ to ×, and flip the divisor. Type each answer as a fraction or mixed number.</div>` +
    `<div class="fdiv-problem" aria-hidden="true">${esc(dividendStr)} ÷ ${esc(divisorStr)}</div>` +
    `<div class="fdiv-steps">` +
    // Step 1 (conditional) — improper fractions
    (aNeeds || bNeeds
      ? `<div class="fdiv-step" data-step="1">` +
        `<div class="fdiv-step-num">Step 1 · Improper fractions</div>` +
        `<div class="fdiv-prompt">Rewrite the whole or mixed number as an improper fraction:</div>` +
        `<div class="fdiv-row">${rewriteInputs}<button type="button" class="fdiv-btn fdiv-btn-check" data-check="1">Check</button></div>` +
        `<div class="fdiv-status" data-status="1" role="status" aria-live="polite"></div>` +
        `</div>`
      : "") +
    // Step 2 — keep change flip (reciprocal)
    `<div class="fdiv-step" data-step="2"${aNeeds || bNeeds ? " hidden" : ""}>` +
    `<div class="fdiv-step-num">Step 2 · Keep · Change · Flip</div>` +
    `<div class="fdiv-prompt">Change ÷ to ×, then <strong>flip the divisor</strong>. Write the divisor's reciprocal:</div>` +
    `<div class="fdiv-row"><span class="fdiv-op">×</span><input class="fdiv-inp" data-k="recip" type="text" inputmode="numeric" aria-label="reciprocal of the divisor" placeholder="a/b"><button type="button" class="fdiv-btn fdiv-btn-check" data-check="2">Check</button></div>` +
    `<div class="fdiv-status" data-status="2" role="status" aria-live="polite"></div>` +
    `</div>` +
    // Step 3 — multiply & simplify
    `<div class="fdiv-step" data-step="3" hidden>` +
    `<div class="fdiv-step-num">Step 3 · Multiply &amp; simplify</div>` +
    `<div class="fdiv-prompt">Multiply across, then simplify to lowest terms (use a mixed number if it's more than 1):</div>` +
    `<div class="fdiv-row"><span class="fdiv-op">=</span><input class="fdiv-inp" data-k="answer" type="text" inputmode="numeric" aria-label="final answer" placeholder="answer"><button type="button" class="fdiv-btn fdiv-btn-check" data-check="3">Check</button></div>` +
    `<div class="fdiv-status" data-status="3" role="status" aria-live="polite"></div>` +
    `</div>` +
    `</div>` +
    `<div class="fdiv-controls"><button type="button" class="fdiv-btn fdiv-btn-ghost" data-reveal>Show me</button></div>` +
    `<div class="fdiv-result" hidden></div>`;
  host.appendChild(wrap);

  const stepEl = (n) => wrap.querySelector(`.fdiv-step[data-step="${n}"]`);
  const inp = (k) => wrap.querySelector(`.fdiv-inp[data-k="${k}"]`);
  const statusEl = (n) => wrap.querySelector(`[data-status="${n}"]`);
  const result = wrap.querySelector(".fdiv-result");

  wrap
    .querySelectorAll(".fdiv-inp")
    .forEach((el) => el.addEventListener("input", () => el.classList.remove("correct", "wrong")));

  const setStatus = (n, msg, ok) => {
    const el = statusEl(n);
    el.textContent = msg;
    el.className = "fdiv-status " + (ok ? "ok" : "no");
  };
  const mark = (el, ok) => {
    el.classList.remove("correct", "wrong");
    el.classList.add(ok ? "correct" : "wrong");
  };
  const reveal = (n) => {
    const el = stepEl(n);
    if (el && el.hasAttribute("hidden")) {
      el.hidden = false;
      setTimeout(() => el.querySelector(".fdiv-inp")?.focus(), 0);
    }
  };
  const celebrate = () => {
    result.hidden = false;
    result.textContent = `🎉 ${dividendStr} ÷ ${divisorStr} = ${fracToString(answer)}`;
  };

  // A correct improper fraction must be written in plain "a/b" form (so a
  // retyped mixed/whole number is not accepted) AND equal the operand's value.
  const simpleFrac = (s) => /^\d+\s*\/\s*\d+$/.test(String(s).trim());
  function check1() {
    let allOk = true;
    if (aNeeds) {
      const raw = inp("impA").value;
      const v = parseFrac(raw);
      const ok = !!v && fracEq(v, A) && simpleFrac(raw);
      mark(inp("impA"), ok);
      if (!ok) allOk = false;
    }
    if (bNeeds) {
      const raw = inp("impB").value;
      const v = parseFrac(raw);
      const ok = !!v && fracEq(v, B) && simpleFrac(raw);
      mark(inp("impB"), ok);
      if (!ok) allOk = false;
    }
    if (allOk) {
      setStatus(1, "Yes — now keep, change, flip.", true);
      reveal(2);
    } else {
      setStatus(
        1,
        "Not yet — multiply the whole number by the denominator, then add the numerator.",
        false,
      );
    }
  }

  function check2() {
    const v = parseFrac(inp("recip").value);
    const _ok = v && fracEq(v, recip) && v.n === recip.n && v.d === recip.d;
    // accept the exact swapped form (or a value-equal reciprocal)
    const okLoose = v && fracEq(v, recip);
    mark(inp("recip"), okLoose);
    if (okLoose) {
      setStatus(2, `Right — flip ${esc(divisorStr)} to ${recip.n}/${recip.d}. Now multiply.`, true);
      reveal(3);
    } else {
      setStatus(2, "Not yet — flipping a fraction swaps its top and bottom.", false);
    }
  }

  function check3() {
    const v = parseFrac(inp("answer").value);
    if (!v)
      return (
        mark(inp("answer"), false),
        setStatus(3, "Type a fraction, whole, or mixed number.", false)
      );
    const ok = fracEq(v, answer);
    mark(inp("answer"), ok);
    if (ok) {
      if (!isReduced(v) && v.d !== 1) {
        setStatus(3, `Correct value — simplify all the way to ${fracToString(answer)}.`, true);
      } else {
        setStatus(3, "That's it!", true);
      }
      celebrate();
    } else {
      setStatus(
        3,
        "Not yet — multiply the numerators, multiply the denominators, then simplify.",
        false,
      );
    }
  }

  function showMe() {
    if (aNeeds) {
      inp("impA").value = `${A.n}/${A.d}`;
      mark(inp("impA"), true);
    }
    if (bNeeds) {
      inp("impB").value = `${B.n}/${B.d}`;
      mark(inp("impB"), true);
    }
    if (aNeeds || bNeeds) setStatus(1, "Improper fractions ready.", true);
    reveal(2);
    inp("recip").value = `${recip.n}/${recip.d}`;
    mark(inp("recip"), true);
    setStatus(2, "Keep · Change · Flip.", true);
    reveal(3);
    inp("answer").value = fracToString(answer);
    mark(inp("answer"), true);
    setStatus(3, "Multiplied and simplified.", true);
    celebrate();
  }

  wrap.querySelector('[data-check="1"]')?.addEventListener("click", check1);
  wrap.querySelector('[data-check="2"]').addEventListener("click", check2);
  wrap.querySelector('[data-check="3"]').addEventListener("click", check3);
  wrap.querySelector("[data-reveal]").addEventListener("click", showMe);

  setTimeout(() => wrap.querySelector(".fdiv-inp")?.focus(), 0);
  return { destroy: () => wrap.remove() };
}

// Public entry: with cfg.presets renders a quick-pick chip bar; else mounts one.
export function renderFractionDivide(host, cfg = {}) {
  ensureStyles();
  const presets = Array.isArray(cfg.presets)
    ? cfg.presets.filter((p) => p && p.dividend != null && p.divisor != null)
    : [];
  if (!presets.length) return mountFractionDivide(host, cfg);
  const wrap = document.createElement("div");
  wrap.className = "fdiv-presetwrap";
  const bar = document.createElement("div");
  bar.className = "fdiv-presets";
  bar.setAttribute("role", "group");
  bar.setAttribute("aria-label", "Pick a problem");
  const stage = document.createElement("div");
  let current = null;
  const mount = (p) => {
    if (current) current.destroy();
    stage.innerHTML = "";
    current = mountFractionDivide(stage, { ...cfg, dividend: p.dividend, divisor: p.divisor });
  };
  presets.forEach((p, i) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "fdiv-chip";
    chip.setAttribute("aria-pressed", i === 0 ? "true" : "false");
    chip.textContent = p.label || `${p.dividend} ÷ ${p.divisor}`;
    chip.addEventListener("click", () => {
      [...bar.children].forEach((c, j) =>
        c.setAttribute("aria-pressed", j === i ? "true" : "false"),
      );
      mount(presets[i]);
    });
    bar.appendChild(chip);
  });
  wrap.append(bar, stage);
  host.appendChild(wrap);
  mount(presets[0]);
  return {
    destroy() {
      if (current) current.destroy();
      wrap.remove();
    },
  };
}

export default renderFractionDivide;

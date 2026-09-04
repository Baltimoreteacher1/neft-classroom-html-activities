// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
//
// Only pure one-variable expressions with +/- terms are handled (no parentheses
// or multiplication) — author those forms.
//
// Pure DOM, no dependencies. Public API:
//   renderCombineLikeTerms(host, cfg) -> { destroy }
//     cfg = { kind:'combine-like-terms', expr:String, title?, presets?:[{expr,label?}] }

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
  xTint: "#e7f0ff",
  cTint: "#fff2e6",
};

function esc(s) {
  return String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
}

// Parse a one-variable linear expression into { x, c } integer sums, or null.
// Accepts terms like 5x, -x, +3x, 2, -4, and unicode minus. Rejects anything
// with parentheses, other letters, exponents, decimals, etc.
function parseLinear(src) {
  let s = String(src).replace(/−/g, "-").replace(/\s+/g, "");
  if (s === "") return null;
  if (/[^0-9x+\-]/i.test(s)) return null; // only digits, x, + and -
  // Split into signed terms: ensure a leading sign.
  if (!/^[+-]/.test(s)) s = "+" + s;
  const terms = s.match(/[+-][^+-]*/g);
  if (!terms) return null;
  let x = 0;
  let c = 0;
  for (const t of terms) {
    const sign = t[0] === "-" ? -1 : 1;
    const body = t.slice(1);
    if (body === "") return null;
    let m;
    if (/^x$/i.test(body)) x += sign * 1;
    else if ((m = /^(\d+)x$/i.exec(body))) x += sign * Number(m[1]);
    else if ((m = /^(\d+)$/.exec(body))) c += sign * Number(m[1]);
    else return null;
  }
  return { x, c };
}

// Format {x,c} as a canonical simplified string: "8x - 2", "5x", "-2", "x + 3".
function fmtLinear({ x, c }) {
  const xPart = x === 0 ? "" : x === 1 ? "x" : x === -1 ? "-x" : `${x}x`;
  if (x === 0) return String(c);
  if (c === 0) return xPart;
  return `${xPart} ${c > 0 ? "+" : "-"} ${Math.abs(c)}`;
}
const linEq = (a, b) => a && b && a.x === b.x && a.c === b.c;

let stylesInjected = false;
function ensureStyles() {
  if (stylesInjected || document.getElementById("clt-styles")) {
    stylesInjected = true;
    return;
  }
  stylesInjected = true;
  const s = document.createElement("style");
  s.id = "clt-styles";
  s.textContent = `
  .clt-presetwrap{margin:var(--sp-3,12px) 0;display:flex;flex-direction:column;align-items:center;}
  .clt-presets{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-bottom:8px;}
  .clt-chip{padding:5px 13px;font:inherit;font-size:.85rem;font-weight:600;color:${C.navy};background:#f4f8ff;
    border:1.5px solid ${C.line};border-radius:999px;cursor:pointer;}
  .clt-chip:hover{background:#e2ecff;border-color:${C.accent};}
  .clt-chip[aria-pressed="true"]{background:${C.accent};color:#fff;border-color:${C.accent};}
  .clt-wrap{width:100%;max-width:430px;margin:0 auto;font-family:"Hanken Grotesk",system-ui,sans-serif;color:${C.ink};
    display:flex;flex-direction:column;align-items:center;}
  .clt-title{font-weight:700;color:${C.navy};margin-bottom:4px;font-size:1rem;text-align:center;}
  .clt-hint{font-size:.82rem;color:${C.muted};margin-bottom:10px;text-align:center;max-width:400px;line-height:1.45;}
  .clt-expr{font-size:1.4rem;font-weight:700;color:${C.navy};margin-bottom:12px;letter-spacing:.3px;}
  .clt-expr .xt{background:${C.xTint};border-radius:6px;padding:1px 5px;}
  .clt-expr .ct{background:${C.cTint};border-radius:6px;padding:1px 5px;}
  .clt-steps{width:100%;display:flex;flex-direction:column;gap:10px;}
  .clt-step{box-sizing:border-box;padding:12px 14px;border:1px solid ${C.line};border-left:4px solid ${C.accent};
    border-radius:12px;background:${C.cardTint};}
  .clt-step[hidden]{display:none;}
  .clt-step-num{font-weight:700;color:${C.navy};font-size:.8rem;text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px;}
  .clt-prompt{font-size:.92rem;color:${C.ink};line-height:1.5;font-weight:500;}
  .clt-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:9px;}
  .clt-inp{width:96px;border:2px dashed ${C.accent};border-radius:8px;background:#fff;color:${C.ink};font-weight:700;
    font-size:1rem;text-align:center;padding:6px 4px;box-sizing:border-box;}
  .clt-inp:focus{outline:none;border-style:solid;box-shadow:0 0 0 3px rgba(29,78,216,.18);}
  .clt-inp.correct{border-style:solid;border-color:${C.teal};background:${C.tealFill};color:${C.tealInk};}
  .clt-inp.wrong{border-color:${C.wrong};background:#fdeceb;color:${C.wrong};animation:clt-shake .3s;}
  @keyframes clt-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
  @media (prefers-reduced-motion:reduce){.clt-inp.wrong{animation:none;}}
  .clt-suffix{font-weight:700;color:${C.navy};font-size:1.05rem;}
  .clt-btn{font:inherit;font-weight:600;font-size:.85rem;border-radius:999px;padding:7px 16px;cursor:pointer;border:2px solid transparent;}
  .clt-btn-check{background:${C.accent};color:#fff;}
  .clt-btn-check:hover{filter:brightness(1.05);}
  .clt-btn:focus-visible{outline:3px solid ${C.accent};outline-offset:2px;}
  .clt-btn-ghost{background:#fff;color:${C.navy};border-color:${C.line};}
  .clt-status{min-height:1.1em;margin-top:7px;font-size:.85rem;font-weight:600;}
  .clt-status.ok{color:${C.teal};}
  .clt-status.no{color:${C.wrong};}
  .clt-controls{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:12px;}
  .clt-result{margin-top:10px;font-size:1.1rem;font-weight:800;color:${C.teal};text-align:center;}
  .clt-result[hidden]{display:none;}
  `;
  document.head.appendChild(s);
}

function mountCombine(host, cfg = {}) {
  ensureStyles();
  const exprStr = String(cfg.expr || "");
  const parsed = parseLinear(exprStr);

  const wrap = document.createElement("div");
  wrap.className = "clt-wrap";
  if (!parsed) {
    wrap.innerHTML = `<p class="clt-hint">Could not read this expression.</p>`;
    host.appendChild(wrap);
    return { destroy: () => wrap.remove() };
  }
  const answer = parsed; // {x, c}
  const title = cfg.title || `Simplify: ${exprStr}`;

  // Colour the x-terms and constants in the shown expression.
  const colored = exprStr
    .replace(/−/g, "-")
    .replace(/([+-]?\s*\d*x)/gi, (m) => `<span class="xt">${esc(m.trim())}</span>`)
    .replace(
      /(^|[+-])\s*(\d+)(?!x)/g,
      (_full, sign, num) => `${sign}<span class="ct">${esc(num)}</span>`,
    );

  wrap.innerHTML =
    `<div class="clt-title">${esc(title)}</div>` +
    `<div class="clt-hint">Add the like terms: combine the <strong>x-terms</strong>, then combine the <strong>number terms</strong>.</div>` +
    `<div class="clt-expr" aria-label="${esc(exprStr)}">${colored}</div>` +
    `<div class="clt-steps">` +
    `<div class="clt-step" data-step="1">` +
    `<div class="clt-step-num">Step 1 · Combine the x-terms</div>` +
    `<div class="clt-prompt">Add the coefficients of the x-terms:</div>` +
    `<div class="clt-row"><input class="clt-inp" data-k="x" type="text" inputmode="numeric" aria-label="combined x coefficient" placeholder="?"><span class="clt-suffix">x</span><button type="button" class="clt-btn clt-btn-check" data-check="1">Check</button></div>` +
    `<div class="clt-status" data-status="1" role="status" aria-live="polite"></div>` +
    `</div>` +
    `<div class="clt-step" data-step="2" hidden>` +
    `<div class="clt-step-num">Step 2 · Combine the numbers</div>` +
    `<div class="clt-prompt">Add the constant number terms (keep their signs):</div>` +
    `<div class="clt-row"><input class="clt-inp" data-k="c" type="text" inputmode="numeric" aria-label="combined constant" placeholder="?"><button type="button" class="clt-btn clt-btn-check" data-check="2">Check</button></div>` +
    `<div class="clt-status" data-status="2" role="status" aria-live="polite"></div>` +
    `</div>` +
    `<div class="clt-step" data-step="3" hidden>` +
    `<div class="clt-step-num">Step 3 · Write the simplified expression</div>` +
    `<div class="clt-prompt">Put it together in simplest form:</div>` +
    `<div class="clt-row"><input class="clt-inp" data-k="expr" type="text" inputmode="text" style="width:150px" aria-label="simplified expression" placeholder="e.g. 8x - 2"><button type="button" class="clt-btn clt-btn-check" data-check="3">Check</button></div>` +
    `<div class="clt-status" data-status="3" role="status" aria-live="polite"></div>` +
    `</div>` +
    `</div>` +
    `<div class="clt-controls"><button type="button" class="clt-btn clt-btn-ghost" data-reveal>Show me</button></div>` +
    `<div class="clt-result" hidden></div>`;
  host.appendChild(wrap);

  const stepEl = (n) => wrap.querySelector(`.clt-step[data-step="${n}"]`);
  const inp = (k) => wrap.querySelector(`.clt-inp[data-k="${k}"]`);
  const statusEl = (n) => wrap.querySelector(`[data-status="${n}"]`);
  const result = wrap.querySelector(".clt-result");

  wrap
    .querySelectorAll(".clt-inp")
    .forEach((el) => el.addEventListener("input", () => el.classList.remove("correct", "wrong")));
  const setStatus = (n, msg, ok) => {
    const el = statusEl(n);
    el.textContent = msg;
    el.className = "clt-status " + (ok ? "ok" : "no");
  };
  const mark = (el, ok) => {
    el.classList.remove("correct", "wrong");
    el.classList.add(ok ? "correct" : "wrong");
  };
  const reveal = (n) => {
    const el = stepEl(n);
    if (el && el.hasAttribute("hidden")) {
      el.hidden = false;
      setTimeout(() => el.querySelector(".clt-inp")?.focus(), 0);
    }
  };
  const celebrate = () => {
    result.hidden = false;
    result.textContent = `🎉 ${exprStr} = ${fmtLinear(answer)}`;
  };
  const parseIntStrict = (s) => {
    const t = String(s).replace(/−/g, "-").trim();
    return /^[+-]?\d+$/.test(t) ? Number(t) : null;
  };

  function check1() {
    const v = parseIntStrict(inp("x").value);
    const ok = v === answer.x;
    mark(inp("x"), ok);
    if (ok) {
      setStatus(
        1,
        answer.x === 0
          ? "Right — the x-terms cancel out."
          : `Right — the x-terms make ${answer.x}x.`,
        true,
      );
      reveal(2);
    } else {
      setStatus(1, "Not yet — add the numbers in front of each x (watch the signs).", false);
    }
  }
  function check2() {
    const v = parseIntStrict(inp("c").value);
    const ok = v === answer.c;
    mark(inp("c"), ok);
    if (ok) {
      setStatus(2, `Right — the numbers combine to ${answer.c}.`, true);
      reveal(3);
    } else {
      setStatus(2, "Not yet — add the constant terms, keeping each sign.", false);
    }
  }
  function check3() {
    const v = parseLinear(inp("expr").value);
    if (!v) return mark(inp("expr"), false), setStatus(3, "Write it like 8x - 2.", false);
    const ok = linEq(v, answer);
    mark(inp("expr"), ok);
    if (ok) {
      setStatus(3, "That's it — fully simplified!", true);
      celebrate();
    } else {
      setStatus(3, "Not yet — combine both parts into one expression.", false);
    }
  }
  function showMe() {
    inp("x").value = String(answer.x);
    mark(inp("x"), true);
    setStatus(1, "x-terms combined.", true);
    reveal(2);
    inp("c").value = String(answer.c);
    mark(inp("c"), true);
    setStatus(2, "Numbers combined.", true);
    reveal(3);
    inp("expr").value = fmtLinear(answer);
    mark(inp("expr"), true);
    setStatus(3, "Simplified.", true);
    celebrate();
  }

  wrap.querySelector('[data-check="1"]').addEventListener("click", check1);
  wrap.querySelector('[data-check="2"]').addEventListener("click", check2);
  wrap.querySelector('[data-check="3"]').addEventListener("click", check3);
  wrap.querySelector("[data-reveal]").addEventListener("click", showMe);
  // Focus ONLY when a person just asked for this widget (a preset chip click).
  // Focusing on mount scroll-jumps the browser to the widget on page load; on
  // the family homework page that opened the page ~3,600px down on a blank
  // stretch of a panel, with no hero and no tabs visible.
  if (cfg.autofocus) setTimeout(() => inp("x").focus(), 0);
  return { destroy: () => wrap.remove() };
}

export function renderCombineLikeTerms(host, cfg = {}) {
  ensureStyles();
  const presets = Array.isArray(cfg.presets) ? cfg.presets.filter((p) => p && p.expr) : [];
  if (!presets.length) return mountCombine(host, cfg);
  const wrap = document.createElement("div");
  wrap.className = "clt-presetwrap";
  const bar = document.createElement("div");
  bar.className = "clt-presets";
  bar.setAttribute("role", "group");
  bar.setAttribute("aria-label", "Pick a problem");
  const stage = document.createElement("div");
  let current = null;
  const mount = (p, viaChip = false) => {
    if (current) current.destroy();
    stage.innerHTML = "";
    current = mountCombine(stage, { ...cfg, expr: p.expr, autofocus: viaChip });
  };
  presets.forEach((p, i) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "clt-chip";
    chip.setAttribute("aria-pressed", i === 0 ? "true" : "false");
    chip.textContent = p.label || p.expr;
    chip.addEventListener("click", () => {
      [...bar.children].forEach((c, j) =>
        c.setAttribute("aria-pressed", j === i ? "true" : "false"),
      );
      mount(presets[i], true);
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

export default renderCombineLikeTerms;

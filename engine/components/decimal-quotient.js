// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
//
// All arithmetic is done on integer/fraction representations so no float error
// ever creeps in (0.1 + 0.2 problems). Author even-dividing pairs for the cleanest
// experience; non-terminating quotients are rounded and flagged.
//
// Pure DOM, no dependencies. Public API:
//   renderDecimalQuotient(host, cfg) -> { destroy }
//     cfg = { kind:'decimal-quotient', dividend:Number, divisor:Number, title?:string }

const C = {
  navy: "#12355b",
  accent: "#1d4ed8",
  teal: "#0d7a76",
  ink: "#1a2b3c",
  muted: "#54677c",
  line: "#d7e2ed",
  ok: "#0d7a76",
  wrong: "#d9534f",
};

function esc(s) {
  return String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
}

// One-time scoped styles, guarded by a unique id so repeated mounts share one tag.
function ensureStyles() {
  if (document.getElementById("dq-styles")) return;
  const s = document.createElement("style");
  s.id = "dq-styles";
  s.textContent = `
  .dq-presetwrap{margin:var(--sp-3,12px) 0;}
  .dq-presets{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-bottom:6px;}
  .dq-chip{padding:5px 13px;font:inherit;font-size:.85rem;font-weight:600;color:${C.navy};background:#f4f8ff;
    border:1.5px solid ${C.line};border-radius:999px;cursor:pointer;}
  .dq-chip:hover{background:#e2ecff;border-color:${C.accent};}
  .dq-chip[aria-pressed="true"]{background:${C.accent};color:#fff;border-color:${C.accent};}
  .dq-wrap{max-width:560px;margin:var(--sp-3,12px) auto;background:#fff;border:1px solid ${C.line};border-radius:16px;padding:16px 16px 18px;box-shadow:0 2px 12px rgba(12,27,42,.08);font-family:"Hanken Grotesk",system-ui,sans-serif;color:${C.ink};}
  .dq-title{font-family:"Outfit",system-ui,sans-serif;font-weight:700;color:${C.navy};font-size:1.05rem;text-align:center;}
  .dq-hint{margin:4px 0 12px;color:${C.muted};font-size:.9rem;line-height:1.4;text-align:center;}
  .dq-problem{font-family:"Outfit",system-ui,sans-serif;font-weight:800;font-size:1.5rem;color:${C.navy};text-align:center;margin:6px 0 14px;letter-spacing:.01em;}
  .dq-step{border:1px solid ${C.line};border-left:4px solid ${C.accent};border-radius:12px;background:#f7faff;padding:12px 14px;margin-top:12px;}
  .dq-step[hidden]{display:none;}
  .dq-step-num{font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:${C.accent};}
  .dq-prompt{font-size:.95rem;font-weight:500;color:${C.ink};margin:3px 0 10px;line-height:1.45;}
  .dq-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px;}
  .dq-op{font-weight:700;color:${C.navy};font-size:1.25rem;}
  .dq-inp{width:88px;padding:8px 10px;font-size:1.1rem;font-weight:700;color:${C.ink};border:2px solid ${C.line};border-radius:10px;background:#fbfcfe;text-align:center;-moz-appearance:textfield;}
  .dq-inp::-webkit-outer-spin-button,.dq-inp::-webkit-inner-spin-button{-webkit-appearance:none;margin:0;}
  .dq-inp:focus-visible{outline:3px solid ${C.accent};outline-offset:1px;border-color:${C.accent};}
  .dq-inp.correct{border-color:${C.ok};background:#e2f9f5;color:${C.ok};}
  .dq-inp.wrong{border-color:${C.wrong};background:#fdeceb;color:${C.wrong};animation:dq-shake .32s;}
  @keyframes dq-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
  @media (prefers-reduced-motion:reduce){.dq-inp.wrong{animation:none;}}
  .dq-mini{font-size:.78rem;color:${C.muted};margin:8px 0 0;line-height:1.4;}
  .dq-controls{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:10px;}
  .dq-btn{font:inherit;font-weight:600;font-size:.85rem;border-radius:999px;padding:7px 16px;cursor:pointer;border:2px solid transparent;}
  .dq-btn-check{background:${C.accent};color:#fff;}
  .dq-btn-check:hover{filter:brightness(1.06);}
  .dq-btn-ghost{background:#fff;color:${C.navy};border-color:${C.line};}
  .dq-btn-ghost:hover{background:#f4f8ff;border-color:${C.accent};}
  .dq-btn:focus-visible{outline:3px solid ${C.accent};outline-offset:2px;}
  .dq-status{min-height:1.2em;margin-top:8px;font-size:.85rem;font-weight:600;}
  .dq-status.ok{color:${C.ok};}
  .dq-status.no{color:${C.wrong};}
  .dq-global{display:flex;justify-content:center;margin-top:14px;}
  .dq-result{margin-top:14px;padding:12px 14px;border:1px solid ${C.line};border-radius:12px;background:#e2f9f5;text-align:center;font-family:"Outfit",system-ui,sans-serif;font-weight:800;font-size:1.35rem;color:${C.teal};}
  .dq-result[hidden]{display:none;}
  `;
  document.head.appendChild(s);
}

// Decimal places in a number's plain string form (0.2 -> 1, 0.25 -> 2, 6 -> 0).
function decimalPlaces(n) {
  const s = String(n);
  const i = s.indexOf(".");
  return i < 0 ? 0 : s.length - i - 1;
}

// Move a decimal string's point k places to the right — the exact "shift" move the
// lesson teaches. Keeps everything as string digits so it is float-error free.
function shiftPointRight(str, k) {
  let sign = "";
  str = String(str).trim();
  if (str[0] === "-") {
    sign = "-";
    str = str.slice(1);
  }
  const dot = str.indexOf(".");
  const intPart = dot < 0 ? str : str.slice(0, dot);
  const fracPart = dot < 0 ? "" : str.slice(dot + 1);
  const digits = intPart + fracPart;
  let pos = intPart.length + k; // new decimal position from the left
  let out;
  if (pos >= digits.length) {
    out = digits + "0".repeat(pos - digits.length);
  } else if (pos <= 0) {
    out = "0." + "0".repeat(-pos) + digits;
  } else {
    out = digits.slice(0, pos) + "." + digits.slice(pos);
  }
  return sign + cleanDecimal(out);
}

// Normalize a decimal string: drop leading zeros, drop trailing zeros/point.
function cleanDecimal(str) {
  let [i = "0", f = ""] = String(str).split(".");
  i = i.replace(/^0+(?=\d)/, "") || "0";
  f = f.replace(/0+$/, "");
  return f ? `${i}.${f}` : i;
}

// Parse a decimal string to an exact fraction {n, d}; null if not a number.
function toFrac(str) {
  str = String(str).trim();
  if (str === "" || !/^\d*\.?\d*$/.test(str) || !/\d/.test(str)) return null;
  const [i = "", f = ""] = str.split(".");
  const n = parseInt((i || "0") + f, 10);
  return { n, d: 10 ** f.length };
}

// Equal decimals regardless of trailing-zero form: 84 == 84.0, 4.2 == 4.20.
function fracEq(a, b) {
  if (!a || !b) return false;
  return a.n * b.d === b.n * a.d;
}

// Exact rational -> decimal string. Terminates within maxPlaces => exact:true;
// otherwise rounds to maxPlaces and reports exact:false.
function ratioToDecimal(num, den, maxPlaces = 4) {
  let intPart = Math.floor(num / den);
  let rem = num - intPart * den;
  if (rem === 0) return { str: String(intPart), exact: true };
  let digits = "";
  for (let k = 0; k < maxPlaces && rem !== 0; k++) {
    rem *= 10;
    digits += Math.floor(rem / den);
    rem = rem % den;
  }
  if (rem === 0) return { str: cleanDecimal(`${intPart}.${digits}`), exact: true };
  // Round the last kept digit.
  let rounded = Math.round((num / den) * 10 ** maxPlaces) / 10 ** maxPlaces;
  return { str: cleanDecimal(String(rounded)), exact: false };
}

function mountQuotient(host, cfg = {}) {
  ensureStyles();

  const dividend = cfg.dividend;
  const divisor = cfg.divisor;
  const dStr = cleanDecimal(String(dividend));
  const vStr = cleanDecimal(String(divisor));
  const problem = `${dStr} ÷ ${vStr}`;

  // Core numbers, all derived with integer/string math (no float drift).
  const shift = decimalPlaces(divisor); // places to move to whole the divisor
  const newDivisorStr = shiftPointRight(vStr, shift); // always whole
  const newDividendStr = shiftPointRight(dStr, shift); // may still be decimal
  const newDivisor = toFrac(newDivisorStr);
  const newDividend = toFrac(newDividendStr);

  // Exact quotient fraction: (dividend / divisor) = (Df * Vd) / (Vf * Dd).
  const Df = toFrac(dStr);
  const Vf = toFrac(vStr);
  const qNum = Df.n * Vf.d;
  const qDen = Vf.n * Df.d;
  const quotient = ratioToDecimal(qNum, qDen, 4);
  const qFrac = { n: qNum, d: qDen };
  const qDisplayFrac = toFrac(quotient.str);

  const root = document.createElement("div");
  root.className = "dq-wrap";
  root.innerHTML =
    `${cfg.title ? `<div class="dq-title">${esc(cfg.title)}</div>` : `<div class="dq-title">Dividing Decimals</div>`}` +
    `<p class="dq-hint">Make the divisor a whole number by moving its decimal. Move the dividend's decimal the <strong>same number of places</strong>, then divide.</p>` +
    `<div class="dq-problem" aria-label="Problem: ${esc(dStr)} divided by ${esc(vStr)}">${esc(problem)}</div>` +
    // Step 1 — how many places.
    `<div class="dq-step" data-step="1">` +
    `<div class="dq-step-num">Step 1 — Shift to a whole divisor</div>` +
    `<div class="dq-prompt">How many places must you move the decimal to make the divisor <strong>${esc(vStr)}</strong> a whole number?</div>` +
    `<div class="dq-row"><input class="dq-inp" data-k="shift" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="2" aria-label="Number of places to move the decimal"/><span class="dq-op" aria-hidden="true">places</span>` +
    `<button type="button" class="dq-btn dq-btn-check" data-check="1">Check</button></div>` +
    `<div class="dq-status" role="status" aria-live="polite" data-status="1"></div>` +
    `</div>` +
    // Step 2 — rewrite both.
    `<div class="dq-step" data-step="2" hidden>` +
    `<div class="dq-step-num">Step 2 — Rewrite the problem</div>` +
    `<div class="dq-prompt">Move <strong>both</strong> decimals that many places the same direction, then rewrite:</div>` +
    `<div class="dq-row"><input class="dq-inp" data-k="newDividend" type="text" inputmode="decimal" maxlength="12" aria-label="New dividend after moving the decimal"/>` +
    `<span class="dq-op" aria-hidden="true">÷</span>` +
    `<input class="dq-inp" data-k="newDivisor" type="text" inputmode="decimal" maxlength="12" aria-label="New divisor after moving the decimal"/>` +
    `<button type="button" class="dq-btn dq-btn-check" data-check="2">Check</button></div>` +
    `<p class="dq-mini">Both decimals move the same way, so the quotient does not change — you have made an equivalent, easier problem.</p>` +
    `<div class="dq-status" role="status" aria-live="polite" data-status="2"></div>` +
    `</div>` +
    // Step 3 — divide.
    `<div class="dq-step" data-step="3" hidden>` +
    `<div class="dq-step-num">Step 3 — Divide</div>` +
    `<div class="dq-prompt">Now divide the whole-number problem. The quotient is:</div>` +
    `<div class="dq-row"><span class="dq-op" aria-hidden="true">${esc(newDividendStr)} ÷ ${esc(newDivisorStr)} =</span>` +
    `<input class="dq-inp" data-k="quotient" type="text" inputmode="decimal" maxlength="12" aria-label="The quotient"/>` +
    `<button type="button" class="dq-btn dq-btn-check" data-check="3">Check</button></div>` +
    `<div class="dq-status" role="status" aria-live="polite" data-status="3"></div>` +
    `</div>` +
    `<div class="dq-result" hidden aria-live="polite"></div>` +
    `<div class="dq-global"><button type="button" class="dq-btn dq-btn-ghost" data-show>Show me</button></div>`;

  host.appendChild(root);

  const stepEl = (n) => root.querySelector(`.dq-step[data-step="${n}"]`);
  const inp = (k) => root.querySelector(`.dq-inp[data-k="${k}"]`);
  const statusEl = (n) => root.querySelector(`[data-status="${n}"]`);
  const result = root.querySelector(".dq-result");

  function setStatus(n, msg, ok) {
    const el = statusEl(n);
    el.textContent = msg;
    el.className = "dq-status " + (ok ? "ok" : "no");
  }

  // Keep inputs to digits (and one decimal point where allowed); clear marks.
  root.querySelectorAll(".dq-inp").forEach((el) => {
    const decimal = el.getAttribute("inputmode") === "decimal";
    el.addEventListener("input", () => {
      let v = el.value;
      v = decimal ? v.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1") : v.replace(/[^0-9]/g, "");
      el.value = v;
      el.classList.remove("correct", "wrong");
    });
  });

  function mark(el, ok) {
    el.classList.remove("correct", "wrong");
    el.classList.add(ok ? "correct" : "wrong");
  }

  function checkStep1() {
    const raw = inp("shift").value.trim();
    if (raw === "") {
      setStatus(1, "Type how many places, then check.", false);
      return;
    }
    const ok = parseInt(raw, 10) === shift;
    mark(inp("shift"), ok);
    if (ok) {
      setStatus(
        1,
        shift === 0
          ? "Right — the divisor is already whole, so 0 moves. ✓"
          : `Yes — move ${shift} place${shift === 1 ? "" : "s"} so ${vStr} becomes ${newDivisorStr}. ✓`,
        true,
      );
      revealStep(2);
    } else {
      setStatus(1, "Not yet — count the digits after the decimal point in the divisor.", false);
    }
  }

  function checkStep2() {
    const a = inp("newDividend");
    const b = inp("newDivisor");
    const fa = toFrac(a.value);
    const fb = toFrac(b.value);
    if (!fa || !fb) {
      setStatus(2, "Fill in both numbers, then check.", false);
      return;
    }
    const okA = fracEq(fa, newDividend);
    const okB = fracEq(fb, newDivisor);
    mark(a, okA);
    mark(b, okB);
    if (okA && okB) {
      setStatus(2, `Equivalent problem: ${newDividendStr} ÷ ${newDivisorStr}. ✓`, true);
      revealStep(3);
    } else if (!okB) {
      setStatus(
        2,
        "The divisor is not whole yet — move its decimal all the way to the end.",
        false,
      );
    } else {
      setStatus(2, "Move the dividend the same number of places as the divisor.", false);
    }
  }

  function checkStep3() {
    const el = inp("quotient");
    const f = toFrac(el.value);
    if (!f) {
      setStatus(3, "Type the quotient, then check.", false);
      return;
    }
    const ok = fracEq(f, qFrac) || fracEq(f, qDisplayFrac);
    mark(el, ok);
    if (ok) {
      finish();
    } else {
      setStatus(
        3,
        `Not yet — work out ${newDividendStr} ÷ ${newDivisorStr} as a whole-number division.`,
        false,
      );
    }
  }

  function finish() {
    setStatus(3, "That's it — the quotient is correct. 🎉", true);
    result.hidden = false;
    result.textContent = `${problem} = ${quotient.str}${quotient.exact ? "" : "… (rounded)"} 🎉`;
  }

  function revealStep(n) {
    const el = stepEl(n);
    if (!el.hidden) return;
    el.hidden = false;
    const first = el.querySelector(".dq-inp");
    if (first) setTimeout(() => first.focus(), 0);
  }

  // "Show me": fill every blank with the correct value, reveal all stages, finish.
  function showMe() {
    inp("shift").value = String(shift);
    mark(inp("shift"), true);
    setStatus(
      1,
      shift === 0
        ? "Divisor already whole — 0 moves."
        : `Move ${shift} place${shift === 1 ? "" : "s"}.`,
      true,
    );
    revealStep(2);
    inp("newDividend").value = newDividendStr;
    inp("newDivisor").value = newDivisorStr;
    mark(inp("newDividend"), true);
    mark(inp("newDivisor"), true);
    setStatus(2, `Equivalent problem: ${newDividendStr} ÷ ${newDivisorStr}.`, true);
    revealStep(3);
    inp("quotient").value = quotient.str;
    mark(inp("quotient"), true);
    finish();
  }

  // Wire checks, Enter-to-check per step, and the global Show me.
  root.querySelectorAll("[data-check]").forEach((btn) => {
    const n = btn.getAttribute("data-check");
    const fn = n === "1" ? checkStep1 : n === "2" ? checkStep2 : checkStep3;
    btn.addEventListener("click", fn);
    stepEl(n)
      .querySelectorAll(".dq-inp")
      .forEach((el) =>
        el.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            fn();
          }
        }),
      );
  });
  root.querySelector("[data-show]").addEventListener("click", showMe);

  // Focus ONLY when a person just asked for this widget (a preset chip click).
  // Focusing on mount scroll-jumps the browser to the widget on page load; on
  // the family homework page that opened the page ~3,600px down on a blank
  // stretch of a panel, with no hero and no tabs visible.
  if (cfg.autofocus) setTimeout(() => inp("shift").focus(), 0);

  return { destroy: () => root.remove() };
}

// Public entry: with cfg.presets ([{dividend,divisor,label?}]) renders a
// quick-pick chip bar over the staged lab; otherwise mounts the single problem.
export function renderDecimalQuotient(host, cfg = {}) {
  const presets = Array.isArray(cfg.presets)
    ? cfg.presets.filter((p) => p && p.dividend != null && p.divisor != null)
    : [];
  if (!presets.length) return mountQuotient(host, cfg);
  ensureStyles();
  const wrap = document.createElement("div");
  wrap.className = "dq-presetwrap";
  const bar = document.createElement("div");
  bar.className = "dq-presets";
  bar.setAttribute("role", "group");
  bar.setAttribute("aria-label", "Pick a problem");
  const stage = document.createElement("div");
  let current = null;
  const mount = (p, viaChip = false) => {
    if (current) current.destroy();
    stage.innerHTML = "";
    current = mountQuotient(stage, {
      ...cfg,
      dividend: p.dividend,
      divisor: p.divisor,
      autofocus: viaChip,
    });
  };
  presets.forEach((p, i) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "dq-chip";
    chip.setAttribute("aria-pressed", i === 0 ? "true" : "false");
    chip.textContent = p.label || `${p.dividend} ÷ ${p.divisor}`;
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

export default renderDecimalQuotient;

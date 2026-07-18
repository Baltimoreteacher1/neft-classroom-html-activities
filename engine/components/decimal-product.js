// decimal-product.js — Guided "multiply decimals" exercise. Teaches the standard
// algorithm for 6.NOS.3: multiply as whole numbers, then place the decimal point
// by counting decimal places. Three fill-in stages unlock in sequence — each one
// reveals the next only after it is answered correctly — mirroring the
// progressive-reveal (exponent-stage) pattern in factor-tree-fill.js.
//
// All arithmetic is done with INTEGER math so float error (0.1*0.2 problems)
// never reaches the student or the answer key.
//
// Pure DOM, no dependencies.
//
// Public API:
//   renderDecimalProduct(container, cfg) -> { destroy }
//     cfg.kind  : 'decimal-product'
//     cfg.a     : first factor (e.g. 4.5)
//     cfg.b     : second factor (e.g. 1.2)
//     cfg.title : optional heading

const C = {
  navy: "#12355b",
  ink: "#1a2b3c",
  muted: "#54677c",
  accent: "#1d4ed8",
  line: "#d7e2ed",
  okStroke: "#0d7a76",
  okFill: "#e2f9f5",
  okInk: "#095350",
  wrong: "#d9534f",
  cardTint: "#f7faff",
};

function esc(s) {
  return String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
}

// One-time scoped styles, guarded by id so repeated mounts share one <style>.
function ensureStyles() {
  if (document.getElementById("decimal-product-styles")) return;
  const s = document.createElement("style");
  s.id = "decimal-product-styles";
  s.textContent = `
  .dp-wrap{margin:var(--sp-3,12px) 0;display:flex;flex-direction:column;align-items:center;}
  .dp-title{font-weight:700;color:${C.navy};margin-bottom:6px;font-size:.95rem;text-align:center;}
  .dp-hint{font-size:.8rem;color:${C.muted};margin-bottom:10px;text-align:center;max-width:380px;}
  .dp-expr{font-size:1.5rem;font-weight:800;color:${C.navy};letter-spacing:.5px;margin-bottom:12px;}
  .dp-steps{width:100%;max-width:380px;display:flex;flex-direction:column;gap:10px;}
  .dp-step{box-sizing:border-box;padding:12px 14px;border:1px solid ${C.line};border-left:4px solid ${C.accent};
    border-radius:12px;background:${C.cardTint};}
  .dp-step[hidden]{display:none;}
  .dp-step-num{font-weight:800;color:${C.navy};font-size:.82rem;text-transform:uppercase;letter-spacing:.6px;margin-bottom:4px;}
  .dp-prompt{font-size:.95rem;color:${C.ink};line-height:1.5;font-weight:600;}
  .dp-count{font-weight:800;color:${C.accent};}
  .dp-input{width:78px;border:2px dashed ${C.accent};border-radius:8px;background:#fff;color:${C.ink};
    font-weight:800;font-size:1rem;text-align:center;padding:5px 4px;margin:0 3px;box-sizing:border-box;
    -moz-appearance:textfield;}
  .dp-input.narrow{width:48px;}
  .dp-input::-webkit-outer-spin-button,.dp-input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0;}
  .dp-input:focus{outline:none;border-style:solid;box-shadow:0 0 0 3px rgba(29,78,216,.18);}
  .dp-input.correct{border-style:solid;border-color:${C.okStroke};background:${C.okFill};color:${C.okInk};}
  .dp-input.wrong{border-color:${C.wrong};background:#fdeceb;color:${C.wrong};animation:dp-shake .32s;}
  @keyframes dp-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
  @media (prefers-reduced-motion:reduce){.dp-input.wrong{animation:none;}}
  .dp-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:10px;}
  .dp-btn{font:inherit;font-weight:700;font-size:.85rem;border-radius:999px;padding:7px 16px;cursor:pointer;border:2px solid transparent;}
  .dp-btn-check{background:${C.accent};color:#fff;}
  .dp-btn-check:hover{filter:brightness(1.05);}
  .dp-btn-reveal{background:#fff;color:${C.navy};border-color:${C.line};}
  .dp-status{min-height:1.2em;margin-top:8px;font-size:.85rem;font-weight:700;}
  .dp-status.ok{color:${C.okStroke};}
  .dp-status.no{color:${C.wrong};}
  .dp-controls{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:12px;}
  .dp-result{margin-top:12px;font-size:1.05rem;color:${C.navy};text-align:center;font-weight:800;}
  .dp-result[hidden]{display:none;}
  `;
  document.head.appendChild(s);
}

// Decimal places in a number: 4.5 -> 1, 1.25 -> 2, 7 -> 0.
function placesOf(n) {
  const s = String(Math.abs(n));
  const i = s.indexOf(".");
  return i < 0 ? 0 : s.length - i - 1;
}

// The number with its decimal point removed, as an integer: 4.5 -> 45, 1.2 -> 12.
function digitsOf(n) {
  return Math.round(Math.abs(n) * Math.pow(10, placesOf(n)));
}

// Build a decimal string from an integer mantissa + place count, trimming
// trailing zeros: (540, 2) -> "5.4". Pure integer/string work — no float error.
function formatDecimal(mantissa, places) {
  if (places === 0) return String(mantissa);
  const s = String(mantissa).padStart(places + 1, "0");
  const cut = s.length - places;
  const intPart = s.slice(0, cut);
  let frac = s.slice(cut).replace(/0+$/, "");
  return frac ? `${intPart}.${frac}` : intPart;
}

export function renderDecimalProduct(host, cfg) {
  ensureStyles();

  const a = Number(cfg.a);
  const b = Number(cfg.b);
  const aStr = String(a);
  const bStr = String(b);
  const aPlaces = placesOf(a);
  const bPlaces = placesOf(b);
  const aDigits = digitsOf(a);
  const bDigits = digitsOf(b);
  const wholeProduct = aDigits * bDigits; // integer, e.g. 540
  const totalPlaces = aPlaces + bPlaces; // e.g. 2
  const finalStr = formatDecimal(wholeProduct, totalPlaces); // e.g. "5.4"

  const placeWord = (p) => (p === 1 ? "place" : "places");

  const wrap = document.createElement("div");
  wrap.className = "dp-wrap";
  wrap.innerHTML = `
    ${cfg.title ? `<div class="dp-title">${esc(cfg.title)}</div>` : ""}
    <div class="dp-hint">Multiply as if there were no decimal points, then place the decimal by counting decimal places.</div>
    <div class="dp-expr" aria-label="${esc(aStr)} times ${esc(bStr)}">${esc(aStr)} × ${esc(bStr)}</div>
    <div class="dp-steps">
      <div class="dp-step" data-step="1">
        <div class="dp-step-num">Step 1 · Multiply the digits</div>
        <div class="dp-prompt">Ignore the decimals and multiply the whole numbers:<br>
          ${aDigits} × ${bDigits} =
          <input class="dp-input" data-input="1" type="text" inputmode="numeric" pattern="[0-9]*"
            aria-label="product of ${aDigits} times ${bDigits}">
        </div>
        <div class="dp-row"><button type="button" class="dp-btn dp-btn-check" data-check="1">Check</button></div>
        <div class="dp-status" data-status="1" role="status" aria-live="polite"></div>
      </div>
      <div class="dp-step" data-step="2" hidden>
        <div class="dp-step-num">Step 2 · Count decimal places</div>
        <div class="dp-prompt">Count the decimal places in each factor:<br>
          ${esc(aStr)} has <span class="dp-count">${aPlaces}</span> ${placeWord(aPlaces)}
          + ${esc(bStr)} has <span class="dp-count">${bPlaces}</span> ${placeWord(bPlaces)} =
          <input class="dp-input narrow" data-input="2" type="text" inputmode="numeric" pattern="[0-9]*"
            aria-label="total number of decimal places">
          decimal places
        </div>
        <div class="dp-row"><button type="button" class="dp-btn dp-btn-check" data-check="2">Check</button></div>
        <div class="dp-status" data-status="2" role="status" aria-live="polite"></div>
      </div>
      <div class="dp-step" data-step="3" hidden>
        <div class="dp-step-num">Step 3 · Place the decimal point</div>
        <div class="dp-prompt">Take ${wholeProduct} and place the decimal point so the answer has
          <span class="dp-count">${totalPlaces}</span> decimal ${placeWord(totalPlaces)}.<br>
          ${esc(aStr)} × ${esc(bStr)} =
          <input class="dp-input" data-input="3" type="text" inputmode="decimal" pattern="[0-9.]*"
            aria-label="final decimal product">
        </div>
        <div class="dp-row"><button type="button" class="dp-btn dp-btn-check" data-check="3">Check</button></div>
        <div class="dp-status" data-status="3" role="status" aria-live="polite"></div>
      </div>
    </div>
    <div class="dp-controls">
      <button type="button" class="dp-btn dp-btn-reveal" data-reveal>Show me</button>
    </div>
    <div class="dp-result" hidden></div>
  `;

  const stepEl = (n) => wrap.querySelector(`.dp-step[data-step="${n}"]`);
  const inputEl = (n) => wrap.querySelector(`[data-input="${n}"]`);
  const statusEl = (n) => wrap.querySelector(`[data-status="${n}"]`);
  const result = wrap.querySelector(".dp-result");

  // Sanitize as the student types: whole-number steps take digits only; the
  // final step also allows a single decimal point. Clears validation styling.
  function sanitize(inp, allowDot) {
    inp.addEventListener("input", () => {
      let v = inp.value.replace(allowDot ? /[^0-9.]/g : /[^0-9]/g, "");
      if (allowDot) {
        const i = v.indexOf(".");
        if (i !== -1) v = v.slice(0, i + 1) + v.slice(i + 1).replace(/\./g, "");
      }
      inp.value = v;
      inp.classList.remove("wrong", "correct");
    });
  }
  sanitize(inputEl(1), false);
  sanitize(inputEl(2), false);
  sanitize(inputEl(3), true);

  function revealStep(n) {
    const el = stepEl(n);
    if (!el || !el.hasAttribute("hidden")) return;
    el.hidden = false;
    setTimeout(() => inputEl(n).focus(), 0);
  }

  function celebrate() {
    result.hidden = false;
    result.textContent = `🎉 ${aStr} × ${bStr} = ${finalStr}`;
  }

  function markWrong(inp, st, msg) {
    inp.classList.remove("correct");
    inp.classList.add("wrong");
    st.textContent = msg;
    st.className = "dp-status no";
  }
  function markOk(inp, st, msg) {
    inp.classList.remove("wrong");
    inp.classList.add("correct");
    st.textContent = msg;
    st.className = "dp-status ok";
  }

  // Step 1: whole-number product.
  function check1() {
    const inp = inputEl(1);
    const st = statusEl(1);
    const t = inp.value.trim();
    if (t === "") return markWrong(inp, st, "Type the product, then check.");
    if (parseInt(t, 10) === wholeProduct) {
      markOk(inp, st, "Yes! Now count the decimal places.");
      revealStep(2);
    } else {
      markWrong(inp, st, `Not yet — multiply ${aDigits} × ${bDigits} again.`);
    }
  }

  // Step 2: total decimal places.
  function check2() {
    const inp = inputEl(2);
    const st = statusEl(2);
    const t = inp.value.trim();
    if (t === "") return markWrong(inp, st, "Type the total, then check.");
    if (parseInt(t, 10) === totalPlaces) {
      markOk(inp, st, `Right — ${totalPlaces} decimal ${placeWord(totalPlaces)} in all.`);
      revealStep(3);
    } else {
      markWrong(inp, st, `Not yet — add ${aPlaces} + ${bPlaces}.`);
    }
  }

  // Step 3: final decimal answer. Compare by integer scaling so trailing-zero
  // forms match (5.40 === 5.4) and no float rounding sneaks in.
  function check3() {
    const inp = inputEl(3);
    const st = statusEl(3);
    const t = inp.value.trim();
    if (t === "" || t === ".") return markWrong(inp, st, "Type the answer, then check.");
    const val = parseFloat(t);
    if (Number.isNaN(val)) return markWrong(inp, st, "Type a number like " + finalStr + ".");
    const scaled = Math.round(val * Math.pow(10, totalPlaces));
    if (scaled === wholeProduct) {
      markOk(inp, st, "Perfect placement!");
      celebrate();
    } else {
      markWrong(
        inp,
        st,
        `Not yet — count ${totalPlaces} place${totalPlaces === 1 ? "" : "s"} in from the right.`,
      );
    }
  }

  // "Show me": fill and reveal every step with the correct answers.
  function reveal() {
    inputEl(1).value = String(wholeProduct);
    markOk(inputEl(1), statusEl(1), "Multiply the digits.");
    revealStep(2);
    inputEl(2).value = String(totalPlaces);
    markOk(inputEl(2), statusEl(2), `${aPlaces} + ${bPlaces} = ${totalPlaces}.`);
    revealStep(3);
    inputEl(3).value = finalStr;
    markOk(
      inputEl(3),
      statusEl(3),
      `Decimal moved in ${totalPlaces} place${totalPlaces === 1 ? "" : "s"}.`,
    );
    celebrate();
  }

  const b1 = wrap.querySelector('[data-check="1"]');
  const b2 = wrap.querySelector('[data-check="2"]');
  const b3 = wrap.querySelector('[data-check="3"]');
  const bR = wrap.querySelector("[data-reveal]");
  b1.addEventListener("click", check1);
  b2.addEventListener("click", check2);
  b3.addEventListener("click", check3);
  bR.addEventListener("click", reveal);

  host.appendChild(wrap);
  setTimeout(() => inputEl(1).focus(), 0);

  return {
    destroy() {
      b1.removeEventListener("click", check1);
      b2.removeEventListener("click", check2);
      b3.removeEventListener("click", check3);
      bR.removeEventListener("click", reveal);
      wrap.remove();
    },
  };
}

export default renderDecimalProduct;

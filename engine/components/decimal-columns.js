// decimal-columns.js — Fill-in-the-blank vertical decimal addition / subtraction.
// The student sees two decimals stacked and aligned by the decimal point (each
// place value in its own column) and fills in the answer row digit by digit.
//
// The checked answer is computed with INTEGER math: both numbers are scaled to
// whole numbers by the greater number of decimal places, added / subtracted, and
// scaled back. Raw float addition (0.1 + 0.2 = 0.30000000000000004) is never used
// for the key, so every column digit is exact.
//
// Skill: 6.NOS.3 — add and subtract multi-digit decimals.
//
// Pure DOM, no dependencies. Public API:
//   renderDecimalColumns(host, cfg) -> { destroy }
//     cfg = { kind:'decimal-columns', op:'+'|'-' (default '+'), a:Number, b:Number, title?:string }

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
};

function esc(s) {
  return String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
}

const INT_PLACES = [
  "ones",
  "tens",
  "hundreds",
  "thousands",
  "ten-thousands",
  "hundred-thousands",
  "millions",
];
const FRAC_PLACES = [
  "tenths",
  "hundredths",
  "thousandths",
  "ten-thousandths",
  "hundred-thousandths",
];

// One-time scoped styles, guarded by id so repeated mounts share a single <style>.
function ensureStyles() {
  if (document.getElementById("dccols-styles")) return;
  const s = document.createElement("style");
  s.id = "dccols-styles";
  s.textContent = `
  .dccols-wrap{margin:var(--sp-3,12px) 0;display:flex;flex-direction:column;align-items:center;
    font-family:"Hanken Grotesk",system-ui,sans-serif;color:${C.ink};}
  .dccols-title{font-weight:800;color:${C.navy};margin-bottom:4px;font-size:1rem;text-align:center;}
  .dccols-hint{font-size:.82rem;color:${C.muted};margin-bottom:10px;text-align:center;max-width:340px;line-height:1.4;}
  .dccols-stage{background:#fff;border:1px solid ${C.line};border-radius:14px;padding:14px 16px;
    box-shadow:0 2px 12px rgba(12,27,42,.08);overflow-x:auto;}
  .dccols-grid{display:inline-block;font-family:"SFMono-Regular",ui-monospace,Menlo,Consolas,monospace;}
  .dccols-row{display:flex;justify-content:flex-end;}
  .dccols-cell{width:2.2em;height:2.2em;display:flex;align-items:center;justify-content:center;
    font-size:1.5rem;font-weight:800;color:${C.navy};}
  .dccols-cell.op{color:${C.muted};}
  .dccols-cell.point{width:.9em;color:${C.navy};}
  .dccols-rule{border-top:3px solid ${C.navy};margin:4px 0 6px;width:100%;}
  .dccols-inp{width:1.9em;height:1.9em;text-align:center;font:inherit;font-size:1.5rem;font-weight:800;
    color:${C.ink};border:2px solid ${C.line};border-radius:8px;background:#fbfcfe;padding:0;box-sizing:border-box;
    -moz-appearance:textfield;}
  .dccols-inp::-webkit-outer-spin-button,.dccols-inp::-webkit-inner-spin-button{-webkit-appearance:none;margin:0;}
  .dccols-inp:focus-visible{outline:none;border-color:${C.accent};box-shadow:0 0 0 3px rgba(29,78,216,.18);}
  .dccols-inp.correct{border-color:${C.teal};background:${C.tealFill};color:${C.tealInk};}
  .dccols-inp.wrong{border-color:${C.wrong};background:#fdeceb;color:${C.wrong};animation:dccols-shake .32s;}
  @keyframes dccols-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
  @media (prefers-reduced-motion:reduce){.dccols-inp.wrong{animation:none;}}
  .dccols-controls{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:12px;}
  .dccols-btn{font:inherit;font-weight:700;font-size:.88rem;border-radius:999px;padding:8px 18px;cursor:pointer;
    border:2px solid transparent;}
  .dccols-btn-check{background:${C.accent};color:#fff;}
  .dccols-btn-check:hover{filter:brightness(1.06);}
  .dccols-btn-check:focus-visible,.dccols-btn-reveal:focus-visible{outline:3px solid ${C.accent};outline-offset:2px;}
  .dccols-btn-reveal{background:#fff;color:${C.navy};border-color:${C.line};}
  .dccols-status{min-height:1.2em;margin-top:10px;font-size:.9rem;font-weight:700;text-align:center;}
  .dccols-status.ok{color:${C.teal};}
  .dccols-status.no{color:${C.wrong};}
  .dccols-result{margin-top:8px;font-size:1.05rem;font-weight:900;color:${C.teal};text-align:center;}
  `;
  document.head.appendChild(s);
}

// Number of decimal places a plain number literal carries (no float scaling).
function decimals(x) {
  const s = String(x);
  const dot = s.indexOf(".");
  return dot < 0 ? 0 : s.length - dot - 1;
}

// Whole-number magnitude scaled to `p` decimal places, left-padded so it always
// has `p` fractional digits, returned split into { int, frac } strings.
function splitScaled(mag, intDigits, p) {
  const total = intDigits + p;
  const s = String(mag).padStart(total, "0");
  return { int: s.slice(0, intDigits), frac: p ? s.slice(intDigits) : "" };
}

function placeLabel(type, colIndex, intDigits) {
  if (type === "int") {
    const power = intDigits - 1 - colIndex; // rightmost int column = ones
    return INT_PLACES[power] || `10^${power}`;
  }
  return FRAC_PLACES[colIndex] || `decimal place ${colIndex + 1}`;
}

export function renderDecimalColumns(host, cfg = {}) {
  ensureStyles();

  const op = cfg.op === "-" ? "-" : "+";
  const opSym = op === "-" ? "−" : "+";
  const a = Number(cfg.a);
  const b = Number(cfg.b);

  // Exact answer via integer math scaled by the greater decimal-place count.
  const p = Math.max(decimals(a), decimals(b));
  const scale = 10 ** p;
  const ai = Math.round(a * scale);
  const bi = Math.round(b * scale);
  const ansInt = op === "+" ? ai + bi : ai - bi;
  const neg = ansInt < 0;
  const absAns = Math.abs(ansInt);

  // Integer-digit width shared by all three rows (whole part of the widest).
  const intDigits = Math.max(
    String(Math.floor(Math.abs(a))).length,
    String(Math.floor(Math.abs(b))).length,
    String(Math.floor(absAns / scale)).length,
    1,
  );

  const rowA = splitScaled(Math.abs(ai), intDigits, p);
  const rowB = splitScaled(Math.abs(bi), intDigits, p);
  const rowAns = splitScaled(absAns, intDigits, p);

  // Column model, left → right: integer columns, decimal point, fractional columns.
  const columns = [];
  for (let k = 0; k < intDigits; k++) columns.push({ type: "int", idx: k });
  if (p > 0) columns.push({ type: "point" });
  for (let j = 0; j < p; j++) columns.push({ type: "frac", idx: j });

  const digitAt = (row, col) => (col.type === "int" ? row.int[col.idx] : row.frac[col.idx]);

  // Formatted decimal string from a scaled magnitude (keeps `p` fractional digits).
  const fmt = (mag) => {
    const { int, frac } = splitScaled(mag, intDigits, p);
    const whole = String(Number(int)); // trim leading zeros for the summary
    return p ? `${whole}.${frac}` : whole;
  };

  const wrap = document.createElement("div");
  wrap.className = "dccols-wrap";
  const title = cfg.title || `Line up the decimal points and ${op === "-" ? "subtract" : "add"}.`;

  // Static rows (a on top, operator + b below). Each cell is a fixed-width box so
  // every place value stacks in a straight column.
  const staticRow = (row, opCell) => {
    let cells = `<span class="dccols-cell op">${opCell || ""}</span>`;
    for (const col of columns) {
      if (col.type === "point") cells += `<span class="dccols-cell point">.</span>`;
      else cells += `<span class="dccols-cell">${digitAt(row, col)}</span>`;
    }
    return `<div class="dccols-row">${cells}</div>`;
  };

  // Answer row: an <input> per digit column, a fixed "." at the point column.
  let ansCells = `<span class="dccols-cell op">${neg ? "−" : ""}</span>`;
  for (const col of columns) {
    if (col.type === "point") {
      ansCells += `<span class="dccols-cell point">.</span>`;
      continue;
    }
    const place = placeLabel(col.type, col.idx, intDigits);
    ansCells +=
      `<span class="dccols-cell"><input class="dccols-inp" type="text" inputmode="numeric" ` +
      `pattern="[0-9]*" maxlength="1" data-t="${col.type}" data-i="${col.idx}" ` +
      `aria-label="${esc(place)} place of the answer"></span>`;
  }

  wrap.innerHTML = `
    <div class="dccols-title">${esc(title)}</div>
    <div class="dccols-hint">Each place value has its own column. Fill in the answer boxes, keeping the decimal points lined up.</div>
    <div class="dccols-stage">
      <div class="dccols-grid" role="group" aria-label="Vertical decimal ${op === "-" ? "subtraction" : "addition"} of ${esc(String(a))} and ${esc(String(b))}">
        ${staticRow(rowA, "")}
        ${staticRow(rowB, opSym)}
        <div class="dccols-rule"></div>
        <div class="dccols-row">${ansCells}</div>
      </div>
    </div>
    <div class="dccols-controls">
      <button type="button" class="dccols-btn dccols-btn-check">Check</button>
      <button type="button" class="dccols-btn dccols-btn-reveal">Show me</button>
    </div>
    <div class="dccols-status" role="status" aria-live="polite"></div>
    <div class="dccols-result" hidden></div>
  `;

  const status = wrap.querySelector(".dccols-status");
  const result = wrap.querySelector(".dccols-result");

  // Answer input cells paired with the correct digit for each column.
  const cells = [...wrap.querySelectorAll(".dccols-inp")].map((inp) => {
    const type = inp.dataset.t;
    const idx = Number(inp.dataset.i);
    const correct = digitAt(rowAns, { type, idx });
    inp.addEventListener("input", () => {
      inp.value = inp.value.replace(/[^0-9]/g, "").slice(-1);
      inp.classList.remove("correct", "wrong");
    });
    return { inp, correct };
  });

  const equation = `${a} ${opSym} ${b} = ${neg ? "−" : ""}${fmt(absAns)}`;
  function showAnswer() {
    result.hidden = false;
    result.textContent = equation;
  }

  function check() {
    let anyEmpty = false;
    let allCorrect = true;
    for (const { inp, correct } of cells) {
      inp.classList.remove("correct", "wrong");
      const v = inp.value.trim();
      if (v === "") {
        anyEmpty = true;
        allCorrect = false;
        continue;
      }
      if (v === correct) inp.classList.add("correct");
      else {
        inp.classList.add("wrong");
        allCorrect = false;
      }
    }
    if (anyEmpty) {
      status.textContent = "Fill in every box.";
      status.className = "dccols-status no";
      return;
    }
    if (allCorrect) {
      status.textContent = "That's it — decimals lined up perfectly! 🎉";
      status.className = "dccols-status ok";
      showAnswer();
    } else {
      status.textContent = "Not yet — check the red boxes, and remember to carry or regroup.";
      status.className = "dccols-status no";
    }
  }

  function reveal() {
    for (const { inp, correct } of cells) {
      inp.value = correct;
      inp.classList.remove("wrong");
      inp.classList.add("correct");
    }
    status.textContent = "Here's the lined-up answer.";
    status.className = "dccols-status ok";
    showAnswer();
  }

  const checkBtn = wrap.querySelector(".dccols-btn-check");
  const revealBtn = wrap.querySelector(".dccols-btn-reveal");
  checkBtn.addEventListener("click", check);
  revealBtn.addEventListener("click", reveal);

  host.appendChild(wrap);
  if (cells[0]) setTimeout(() => cells[0].inp.focus(), 0);

  return {
    destroy() {
      checkBtn.removeEventListener("click", check);
      revealBtn.removeEventListener("click", reveal);
      wrap.remove();
    },
  };
}

export default renderDecimalColumns;

// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
// decimal-columns.js — Interactive vertical decimal addition / subtraction with
// hands-on regrouping. The student sees two numbers stacked and aligned by the
// decimal point (each place value in its own column, short numbers zero-padded so
// the places line up) and works the problem the way they would on paper:
//
//   • Addition  → a "Carry" row above the top number. When a column's digits sum
//     to 10 or more, the student writes the carried 1 (or 2) above the next
//     column to the left, then fills the answer digit.
//   • Subtraction → a "Regroup" row above the top number. When the top digit is
//     too small, the student borrows: they write the regrouped top value for each
//     column that changes (the reduced neighbor, e.g. 4→3, and the +10 column,
//     e.g. 2→12), then fills the answer digit.
//
// Carry / regroup cells are optional scaffolding — checked only when filled, so a
// confident student can go straight to the answer while a student who needs the
// structure gets real feedback on every borrow and carry.
//
// The key is computed with INTEGER math: both numbers are scaled to whole numbers
// by the greater number of decimal places, combined, and scaled back. Raw float
// addition (0.1 + 0.2 = 0.30000000000000004) is never used, so every digit is
// exact.
//
// Skill: 6.NOS.3 — add and subtract multi-digit decimals.
//
// Pure DOM, no dependencies. Public API:
//   renderDecimalColumns(host, cfg) -> { destroy }
//     cfg = {
//       kind:'decimal-columns',
//       op:'+'|'-' (default '+'), a:Number, b:Number,   // the first problem
//       title?:string, intro?:string,
//       typeIn?:boolean,                                 // student types the operands too
//       presets?:[{ op, a, b, label? }]                  // quick-pick problems
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
  carryBg: "#fff6e5",
  carryInk: "#8a5800",
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
  .dccols-hint{font-size:.82rem;color:${C.muted};margin-bottom:10px;text-align:center;max-width:360px;line-height:1.4;}
  .dccols-presets{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-bottom:12px;}
  .dccols-chip{padding:5px 13px;font:inherit;font-size:.85rem;font-weight:700;color:${C.navy};background:#f4f8ff;
    border:1.5px solid ${C.line};border-radius:999px;cursor:pointer;}
  .dccols-chip:hover{background:#e2ecff;border-color:${C.accent};}
  .dccols-chip[aria-pressed="true"]{background:${C.accent};color:#fff;border-color:${C.accent};}
  .dccols-stage{background:#fff;border:1px solid ${C.line};border-radius:14px;padding:14px 16px 16px;
    box-shadow:0 2px 12px rgba(12,27,42,.08);overflow-x:auto;}
  .dccols-grid{display:inline-block;font-family:"SFMono-Regular",ui-monospace,Menlo,Consolas,monospace;}
  .dccols-row{display:flex;justify-content:flex-end;align-items:flex-end;}
  .dccols-cell{width:2.2em;height:2.2em;display:flex;align-items:center;justify-content:center;
    font-size:1.5rem;font-weight:800;color:${C.navy};}
  .dccols-cell.op{color:${C.muted};}
  .dccols-cell.point{width:.9em;color:${C.navy};}
  .dccols-cell.pad{color:#9fb2c6;}          /* zero-padded place with no original digit */
  .dccols-rule{border-top:3px solid ${C.navy};margin:4px 0 6px;width:100%;}
  /* regroup / carry row sits above, in a smaller amber cell */
  .dccols-row-rg .dccols-cell{height:1.5em;}
  .dccols-rg{width:1.6em;height:1.5em;text-align:center;font:inherit;font-size:.95rem;font-weight:800;
    color:${C.carryInk};border:1.5px dashed #e6c98a;border-radius:6px;background:${C.carryBg};padding:0;box-sizing:border-box;
    -moz-appearance:textfield;}
  .dccols-rg::-webkit-outer-spin-button,.dccols-rg::-webkit-inner-spin-button{-webkit-appearance:none;margin:0;}
  .dccols-rg::placeholder{color:#d8b877;}
  .dccols-rg:focus-visible{outline:none;border-color:${C.carryInk};box-shadow:0 0 0 3px rgba(138,88,0,.14);}
  .dccols-rg.correct{border-style:solid;border-color:${C.teal};background:${C.tealFill};color:${C.tealInk};}
  .dccols-rg.wrong{border-style:solid;border-color:${C.wrong};background:#fdeceb;color:${C.wrong};}
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
  .dccols-btn:focus-visible{outline:3px solid ${C.accent};outline-offset:2px;}
  .dccols-btn-ghost{background:#fff;color:${C.navy};border-color:${C.line};}
  .dccols-status{min-height:1.2em;margin-top:10px;font-size:.9rem;font-weight:700;text-align:center;max-width:380px;line-height:1.4;}
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
// has `intDigits` integer digits and `p` fractional digits.
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

  const typeIn = cfg.typeIn === true;
  const presets = Array.isArray(cfg.presets)
    ? cfg.presets.filter((p) => p && p.a != null && p.b != null)
    : [];
  // Problem list: explicit presets, else the single problem from cfg.
  const problems = presets.length
    ? presets.map((p) => ({
        op: p.op === "-" ? "-" : "+",
        a: Number(p.a),
        b: Number(p.b),
        label: p.label,
      }))
    : [{ op: cfg.op === "-" ? "-" : "+", a: Number(cfg.a), b: Number(cfg.b) }];

  const wrap = document.createElement("div");
  wrap.className = "dccols-wrap";
  host.appendChild(wrap);

  let current = null; // { destroy } of the mounted problem
  let _activeIdx = 0;

  function mount(problem) {
    if (current) current.destroy();
    current = renderProblem(wrap, problem, { typeIn });
  }

  // Preset chip bar (only when there is more than one problem).
  if (problems.length > 1) {
    const bar = document.createElement("div");
    bar.className = "dccols-presets";
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", "Pick a problem");
    problems.forEach((p, i) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "dccols-chip";
      chip.setAttribute("aria-pressed", i === 0 ? "true" : "false");
      chip.textContent = p.label || `${p.a} ${p.op === "-" ? "−" : "+"} ${p.b}`;
      chip.addEventListener("click", () => {
        _activeIdx = i;
        [...bar.children].forEach((c, j) =>
          c.setAttribute("aria-pressed", j === i ? "true" : "false"),
        );
        mount(problems[i]);
      });
      bar.appendChild(chip);
    });
    wrap.appendChild(bar);
  }

  mount(problems[0]);

  return {
    destroy() {
      if (current) current.destroy();
      wrap.remove();
    },
  };
}

// Render a single problem into `wrap` (appended after any preset bar). Returns
// { destroy } that removes just this problem's nodes.
function renderProblem(wrap, problem, { typeIn }) {
  const { op } = problem;
  const opSym = op === "-" ? "−" : "+";
  const a = Number(problem.a);
  const b = Number(problem.b);

  // Exact answer via integer math scaled by the greater decimal-place count.
  const p = Math.max(decimals(a), decimals(b));
  const scale = 10 ** p;
  const ai = Math.round(Math.abs(a) * scale);
  const bi = Math.round(Math.abs(b) * scale);
  const ansIntSigned = op === "+" ? ai + bi : ai - bi;
  const neg = ansIntSigned < 0;
  const absAns = Math.abs(ansIntSigned);

  // Integer-digit width shared by all rows (whole part of the widest).
  const intDigits = Math.max(
    String(Math.floor(Math.abs(a))).length,
    String(Math.floor(Math.abs(b))).length,
    String(Math.floor(absAns / scale)).length,
    1,
  );

  const rowA = splitScaled(ai, intDigits, p);
  const rowB = splitScaled(bi, intDigits, p);
  const rowAns = splitScaled(absAns, intDigits, p);

  // Column model, left → right: integer columns, decimal point, fractional columns.
  const columns = [];
  for (let k = 0; k < intDigits; k++) columns.push({ type: "int", idx: k });
  if (p > 0) columns.push({ type: "point" });
  for (let j = 0; j < p; j++) columns.push({ type: "frac", idx: j });

  const digitCols = columns.filter((c) => c.type !== "point");
  const digitAt = (row, col) => (col.type === "int" ? row.int[col.idx] : row.frac[col.idx]);
  const colKey = (col) => `${col.type}:${col.idx}`;
  // Is this a leading zero-pad place (a place the original number didn't reach)?
  const isPad = (_row, col, magInt) => {
    const raw = String(Math.round(magInt)); // scaled magnitude, no leading zeros
    const width = intDigits + p;
    const firstReal = width - raw.length; // index in the padded string of the first real digit
    const flatIdx = col.type === "int" ? col.idx : intDigits + col.idx;
    return flatIdx < firstReal;
  };

  // --- Expected carry / regroup per digit column (right → left) ---------------
  const regroup = {}; // colKey -> expected string (carry for +, new-top for −), or null
  if (op === "+") {
    let carry = 0;
    for (let i = digitCols.length - 1; i >= 0; i--) {
      const col = digitCols[i];
      const s = Number(digitAt(rowA, col)) + Number(digitAt(rowB, col)) + carry;
      regroup[colKey(col)] = carry > 0 ? String(carry) : null; // carry INTO this column
      carry = Math.floor(s / 10);
    }
  } else {
    // Subtraction borrow chain (valid only when the top number ≥ bottom number,
    // which the authored problems guarantee). new-top value shown where it changes.
    let borrow = 0;
    const valid = ai >= bi;
    for (let i = digitCols.length - 1; i >= 0; i--) {
      const col = digitCols[i];
      const dA = Number(digitAt(rowA, col));
      const dB = Number(digitAt(rowB, col));
      if (!valid) {
        regroup[colKey(col)] = null;
        continue;
      }
      let top = dA - borrow;
      let newBorrow = 0;
      if (top < dB) {
        top += 10;
        newBorrow = 1;
      }
      // Visible change when this column was reduced (borrow in) or grew (+10).
      regroup[colKey(col)] = borrow > 0 || newBorrow > 0 ? String(top) : null;
      borrow = newBorrow;
    }
  }
  const anyRegroup = Object.values(regroup).some((v) => v != null);

  // Formatted decimal string from a scaled magnitude (keeps `p` fractional digits).
  const fmt = (mag) => {
    const { int, frac } = splitScaled(mag, intDigits, p);
    const whole = String(Number(int));
    return p ? `${whole}.${frac}` : whole;
  };

  const block = document.createElement("div");
  const rgLabel = op === "-" ? "Regroup" : "Carry";
  const title =
    problem.title || `Line up the decimal points and ${op === "-" ? "subtract" : "add"}.`;
  const hint =
    op === "-"
      ? `Each place value has its own column. When the top digit is too small, borrow: write the regrouped top value in the amber “${rgLabel}” box, then fill the answer.`
      : `Each place value has its own column. When a column makes 10 or more, write the carry in the amber “${rgLabel}” box above the next column, then fill the answer.`;

  // Amber regroup/carry row (interactive, optional).
  const rgRow = () => {
    let cells = `<span class="dccols-cell op"></span>`;
    for (const col of columns) {
      if (col.type === "point") {
        cells += `<span class="dccols-cell point"></span>`;
        continue;
      }
      const place = placeLabel(col.type, col.idx, intDigits);
      cells +=
        `<span class="dccols-cell"><input class="dccols-rg" type="text" inputmode="numeric" ` +
        `pattern="[0-9]*" maxlength="2" data-t="${col.type}" data-i="${col.idx}" ` +
        `aria-label="${esc(rgLabel)} for the ${esc(place)} column" placeholder="·"></span>`;
    }
    return `<div class="dccols-row dccols-row-rg">${cells}</div>`;
  };

  // A static or typed operand row.
  const operandRow = (row, magInt, opCell, isTop) => {
    let cells = `<span class="dccols-cell op">${opCell || ""}</span>`;
    for (const col of columns) {
      if (col.type === "point") {
        cells += `<span class="dccols-cell point">.</span>`;
        continue;
      }
      const digit = digitAt(row, col);
      const pad = isPad(row, col, magInt);
      if (typeIn) {
        const place = placeLabel(col.type, col.idx, intDigits);
        cells +=
          `<span class="dccols-cell"><input class="dccols-inp" type="text" inputmode="numeric" ` +
          `pattern="[0-9]*" maxlength="1" data-role="operand" data-side="${isTop ? "a" : "b"}" ` +
          `data-t="${col.type}" data-i="${col.idx}" data-correct="${digit}" ` +
          `aria-label="${isTop ? "Top" : "Bottom"} number, ${esc(place)} place"></span>`;
      } else {
        cells += `<span class="dccols-cell${pad ? " pad" : ""}">${digit}</span>`;
      }
    }
    return `<div class="dccols-row">${cells}</div>`;
  };

  // Answer row: an <input> per digit column.
  const ansRow = () => {
    let cells = `<span class="dccols-cell op">${neg ? "−" : ""}</span>`;
    for (const col of columns) {
      if (col.type === "point") {
        cells += `<span class="dccols-cell point">.</span>`;
        continue;
      }
      const place = placeLabel(col.type, col.idx, intDigits);
      cells +=
        `<span class="dccols-cell"><input class="dccols-inp" type="text" inputmode="numeric" ` +
        `pattern="[0-9]*" maxlength="1" data-role="answer" data-t="${col.type}" data-i="${col.idx}" ` +
        `aria-label="${esc(place)} place of the answer"></span>`;
    }
    return `<div class="dccols-row">${cells}</div>`;
  };

  block.innerHTML = `
    <div class="dccols-title">${esc(title)}</div>
    <div class="dccols-hint">${esc(hint)}</div>
    <div class="dccols-stage">
      <div class="dccols-grid" role="group" aria-label="Vertical decimal ${op === "-" ? "subtraction" : "addition"} of ${esc(String(a))} and ${esc(String(b))}">
        ${anyRegroup || typeIn ? rgRow() : ""}
        ${operandRow(rowA, ai, "", true)}
        ${operandRow(rowB, bi, opSym, false)}
        <div class="dccols-rule"></div>
        ${ansRow()}
      </div>
    </div>
    <div class="dccols-controls">
      <button type="button" class="dccols-btn dccols-btn-check">Check</button>
      <button type="button" class="dccols-btn dccols-btn-ghost dccols-btn-reveal">Show me</button>
      <button type="button" class="dccols-btn dccols-btn-ghost dccols-btn-clear">Clear</button>
    </div>
    <div class="dccols-status" role="status" aria-live="polite"></div>
    <div class="dccols-result" hidden></div>
  `;
  wrap.appendChild(block);

  const status = block.querySelector(".dccols-status");
  const result = block.querySelector(".dccols-result");
  const sanitize = (inp, max) => {
    inp.value = inp.value.replace(/[^0-9]/g, "").slice(0, max);
  };

  // Answer cells with their correct digit.
  const ansCells = [...block.querySelectorAll('.dccols-inp[data-role="answer"]')].map((inp) => {
    const correct = digitAt(rowAns, { type: inp.dataset.t, idx: Number(inp.dataset.i) });
    inp.addEventListener("input", () => {
      sanitize(inp, 1);
      inp.classList.remove("correct", "wrong");
    });
    return { inp, correct };
  });

  // Operand cells (type-in mode only).
  const operandCells = [...block.querySelectorAll('.dccols-inp[data-role="operand"]')].map(
    (inp) => {
      inp.addEventListener("input", () => {
        sanitize(inp, 1);
        inp.classList.remove("correct", "wrong");
      });
      return { inp, correct: inp.dataset.correct };
    },
  );

  // Regroup/carry cells with their expected value (null = should stay blank).
  const rgCells = [...block.querySelectorAll(".dccols-rg")].map((inp) => {
    const expected = regroup[`${inp.dataset.t}:${Number(inp.dataset.i)}`] ?? null;
    inp.addEventListener("input", () => {
      sanitize(inp, 2);
      inp.classList.remove("correct", "wrong");
    });
    return { inp, expected };
  });

  const equation = `${a} ${opSym} ${b} = ${neg ? "−" : ""}${fmt(absAns)}`;
  function showEquation() {
    result.hidden = false;
    result.textContent = equation;
  }

  function check() {
    let anyEmpty = false;
    let allCorrect = true;
    let rgIssue = false;

    for (const { inp, correct } of operandCells) {
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

    for (const { inp, correct } of ansCells) {
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

    // Regroup/carry cells are optional: only a FILLED cell can be wrong.
    for (const { inp, expected } of rgCells) {
      inp.classList.remove("correct", "wrong");
      const v = inp.value.trim();
      if (v === "") continue;
      if (expected != null && v === expected) inp.classList.add("correct");
      else {
        inp.classList.add("wrong");
        rgIssue = true;
      }
    }

    if (anyEmpty) {
      status.textContent = "Fill in every answer box.";
      status.className = "dccols-status no";
      return;
    }
    if (allCorrect && !rgIssue) {
      status.textContent = "That's it — decimals lined up perfectly! 🎉";
      status.className = "dccols-status ok";
      showEquation();
      return;
    }
    if (allCorrect && rgIssue) {
      status.textContent =
        op === "-"
          ? "Your answer is right — but check the amber regroup boxes. Each borrow makes the top digit smaller by 1 and adds 10 to the column on the right."
          : "Your answer is right — but check the amber carry boxes. A carry is written above the column to the left.";
      status.className = "dccols-status no";
      return;
    }
    status.textContent =
      op === "-"
        ? "Not yet — check the red boxes. Where the top digit is too small, borrow before you subtract."
        : "Not yet — check the red boxes, and remember to carry when a column makes 10 or more.";
    status.className = "dccols-status no";
  }

  function reveal() {
    for (const { inp, correct } of operandCells) {
      inp.value = correct;
      inp.classList.remove("wrong");
      inp.classList.add("correct");
    }
    for (const { inp, correct } of ansCells) {
      inp.value = correct;
      inp.classList.remove("wrong");
      inp.classList.add("correct");
    }
    for (const { inp, expected } of rgCells) {
      inp.value = expected != null ? expected : "";
      inp.classList.remove("wrong");
      if (expected != null) inp.classList.add("correct");
    }
    status.textContent = "Here's the lined-up work, regroups and all.";
    status.className = "dccols-status ok";
    showEquation();
  }

  function clear() {
    for (const { inp } of [...operandCells, ...ansCells, ...rgCells]) {
      inp.value = "";
      inp.classList.remove("correct", "wrong");
    }
    status.textContent = "";
    status.className = "dccols-status";
    result.hidden = true;
    const first = (operandCells[0] || ansCells[0])?.inp;
    if (first) first.focus();
  }

  const checkBtn = block.querySelector(".dccols-btn-check");
  const revealBtn = block.querySelector(".dccols-btn-reveal");
  const clearBtn = block.querySelector(".dccols-btn-clear");
  checkBtn.addEventListener("click", check);
  revealBtn.addEventListener("click", reveal);
  clearBtn.addEventListener("click", clear);

  const firstCell = (typeIn ? operandCells[0] : ansCells[0])?.inp;
  if (firstCell) setTimeout(() => firstCell.focus(), 0);

  return {
    destroy() {
      block.remove();
    },
  };
}

export default renderDecimalColumns;

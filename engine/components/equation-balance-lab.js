// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
//
// This is the interactive upgrade of the static balance-scale figure: the
// operation buttons perform real algebra instead of a decorative wobble.
//
// Pure SVG + DOM, no dependencies. Public API:
//   renderEquationBalanceLab(container, cfg) -> { destroy }
//     cfg.equation : "x + 2 = 6" (parsed) — the source of truth
//     cfg.variable : override the detected variable letter
//     cfg.intro    : optional coaching sentence under the title
//     cfg.presets  : optional [{ equation, label? }] quick-pick equations

const C = {
  navy: "#12355b",
  teal: "#0d7a76",
  tealBg: "#dff2ee",
  amber: "#d4952a",
  amberBg: "#fef7e0",
  ink: "#1a2b3c",
  muted: "#54677c",
  line: "#d7e2ed",
  chipBg: "#f4f8ff",
  accent: "#1d4ed8",
  bad: "#b45309",
};

function esc(s) {
  return String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
}

const fmt = (v) => {
  const r = Math.round(v * 1000) / 1000;
  return Number.isInteger(r) ? String(r) : String(r);
};

// Parse one linear side into { a, b } meaning a·x + b. Handles terms like
// x, 4x, -x, x/4, 3, -2 separated by + / −. Throws on anything non-linear.
function parseSide(src, variable) {
  let s = String(src)
    .replace(/\s+/g, "")
    .replace(/−/g, "-")
    .replace(/[×·]/g, "*")
    .replace(/÷/g, "/");
  if (!s) throw new Error("empty");
  // Split into signed terms: insert a separator before each top-level +/-.
  const terms = [];
  let cur = "";
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if ((c === "+" || c === "-") && i > 0 && !"+-*/".includes(s[i - 1])) {
      terms.push(cur);
      cur = c === "+" ? "" : "-";
    } else {
      cur += c;
    }
  }
  if (cur) terms.push(cur);
  let a = 0;
  let b = 0;
  for (let term of terms) {
    if (term === "" || term === "+") continue;
    if (term.includes(variable)) {
      const [left, right] = term.split(variable);
      let coef = left === "" || left === "+" ? 1 : left === "-" ? -1 : Number(left);
      if (!Number.isFinite(coef)) throw new Error("coef");
      if (right) {
        // x/4 style divisor after the variable.
        const div = Number(right.replace("/", ""));
        if (!Number.isFinite(div) || div === 0) throw new Error("div");
        coef /= div;
      }
      a += coef;
    } else {
      const n = Number(term);
      if (!Number.isFinite(n)) throw new Error("const");
      b += n;
    }
  }
  return { a, b };
}

function detectVariable(eq) {
  const m = String(eq).match(/[a-zA-Z]/);
  return m ? m[0].toLowerCase() : "x";
}

function parseEquation(eq, variable) {
  const parts = String(eq).split("=");
  if (parts.length !== 2) throw new Error("equals");
  return { left: parseSide(parts[0], variable), right: parseSide(parts[1], variable) };
}

// Render a side {a,b} as an expression string: "x + 2", "4x", "6", "x".
function sideText(side, v) {
  const parts = [];
  if (side.a !== 0) {
    if (side.a === 1) parts.push(v);
    else if (side.a === -1) parts.push(`-${v}`);
    else parts.push(`${fmt(side.a)}${v}`);
  }
  if (side.b !== 0 || side.a === 0) {
    const sign = side.b < 0 ? "-" : parts.length ? "+" : "";
    const mag = fmt(Math.abs(side.b));
    parts.push(parts.length ? `${sign} ${mag}` : `${sign}${mag}`);
  }
  return parts.join(" ") || "0";
}

const OPS = [
  { op: "add", sym: "+", label: "＋ Add to both sides" },
  { op: "subtract", sym: "−", label: "－ Subtract from both sides" },
  { op: "multiply", sym: "×", label: "× Multiply both sides" },
  { op: "divide", sym: "÷", label: "÷ Divide both sides" },
];

function applyOp(side, op, k) {
  if (op === "add") return { a: side.a, b: side.b + k };
  if (op === "subtract") return { a: side.a, b: side.b - k };
  if (op === "multiply") return { a: side.a * k, b: side.b * k };
  if (op === "divide") return { a: side.a / k, b: side.b / k };
  return side;
}

const isSolved = (left, right, _v) =>
  (left.a === 1 && left.b === 0 && right.a === 0) ||
  (right.a === 1 && right.b === 0 && left.a === 0);

export function renderEquationBalanceLab(container, cfg = {}) {
  const presets = Array.isArray(cfg.presets) ? cfg.presets.filter((p) => p && p.equation) : [];
  let equationSrc = cfg.equation || "x + 2 = 6";
  let v = cfg.variable || detectVariable(equationSrc);
  let history = []; // [{left,right, note}]
  let solvedFlag = false;

  injectStyles();
  const root = document.createElement("div");
  root.className = "eqlab";
  root.innerHTML =
    `<div class="eqlab-head"><span class="eqlab-title">⚖️ Equation Balance Lab</span></div>` +
    `<p class="eqlab-hint">${esc(cfg.intro || "Whatever you do to one side, do to the other — that keeps the scale balanced. Choose an operation and a number to peel away everything next to the variable until it stands alone.")}</p>` +
    (presets.length
      ? `<div class="eqlab-presets" role="group" aria-label="Pick an equation">` +
        presets
          .map(
            (p, i) =>
              `<button type="button" class="eqlab-chip" data-preset="${i}">${esc(p.label || p.equation)}</button>`,
          )
          .join("") +
        `</div>`
      : "") +
    `<div class="eqlab-eq" data-el="eq" aria-live="polite"></div>` +
    // Stage: the scale stays the dominant element, with the number box and the
    // four "both sides" buttons in a panel BESIDE it. The panel drops back
    // underneath on narrow screens (see the 720px media query below).
    `<div class="eqlab-stage">` +
    `<div class="eqlab-scale" data-el="scale"></div>` +
    `<div class="eqlab-controls">` +
    `<label class="eqlab-field"><span>Number</span><input type="number" inputmode="decimal" value="" data-el="val" placeholder="?" aria-label="Value to apply to both sides"/></label>` +
    `<div class="eqlab-ops" role="group" aria-label="Operations">` +
    OPS.map(
      (o) => `<button type="button" class="eqlab-op" data-op="${o.op}">${esc(o.label)}</button>`,
    ).join("") +
    `</div></div></div>` +
    `<div class="eqlab-actions">` +
    `<button type="button" class="eqlab-btn" data-el="undo">↩ Undo</button>` +
    `<button type="button" class="eqlab-btn" data-el="reset">Start over</button></div>` +
    `<div class="eqlab-trail" data-el="trail"></div>` +
    `<div class="eqlab-feed" data-el="feed" role="status" aria-live="polite"></div>`;
  container.appendChild(root);
  const el = (n) => root.querySelector(`[data-el="${n}"]`);

  function state() {
    return history[history.length - 1];
  }

  function setEquation(src) {
    equationSrc = src;
    v = cfg.variable || detectVariable(src);
    solvedFlag = false;
    try {
      const { left, right } = parseEquation(src, v);
      history = [{ left, right, note: "start" }];
      el("feed").innerHTML = "";
    } catch (_e) {
      history = [{ left: { a: 1, b: 0 }, right: { a: 0, b: 0 }, note: "start" }];
      el("feed").innerHTML =
        `<div class="eqlab-msg eqlab-msg-warn">Could not read that equation.</div>`;
    }
    render();
  }

  // Draw one pan's tokens: x-boxes (teal) then unit blocks (amber). Returns SVG
  // string. Falls back to a big expression label when the side isn't a clean
  // pile of non-negative whole pieces (e.g. after it has fractions/negatives).
  function panTokens(side, cx, top) {
    const cleanX = Number.isInteger(side.a) && side.a >= 0 && side.a <= 8;
    const cleanU = Number.isInteger(side.b) && side.b >= 0 && side.b <= 40;
    if (!cleanX || !cleanU || (side.a === 0 && side.b === 0)) {
      return `<text x="${cx}" y="${top + 34}" text-anchor="middle" font-size="22" font-weight="800" fill="${C.navy}">${esc(sideText(side, v))}</text>`;
    }
    let out = "";
    let px = cx - 58;
    let py = top;
    const place = (w, h, fill, stroke, label) => {
      if (px + w > cx + 62) {
        px = cx - 58;
        py += h + 5;
      }
      out +=
        `<rect x="${px}" y="${py}" width="${w}" height="${h}" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>` +
        (label
          ? `<text x="${px + w / 2}" y="${py + h / 2 + 5}" text-anchor="middle" font-size="14" font-weight="800" fill="${stroke}">${label}</text>`
          : "");
      px += w + 5;
    };
    for (let i = 0; i < side.a; i++) place(30, 26, C.tealBg, C.teal, v);
    for (let i = 0; i < side.b; i++) place(15, 15, C.amberBg, C.amber, "");
    return out;
  }

  function renderScale(tilt = 0) {
    const s = state();
    const W = 560;
    const H = 250;
    const MID = W / 2;
    const BEAM_Y = 92;
    const rot = tilt ? `rotate(${tilt} ${MID} ${BEAM_Y})` : "";
    const panTop = 120;
    el("scale").innerHTML =
      `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Balance scale for ${esc(sideText(s.left, v))} equals ${esc(sideText(s.right, v))}">` +
      // base + fulcrum
      `<rect x="${MID - 60}" y="${H - 26}" width="120" height="12" rx="6" fill="${C.navy}"/>` +
      `<polygon points="${MID},${BEAM_Y + 8} ${MID - 26},${H - 26} ${MID + 26},${H - 26}" fill="${C.navy}"/>` +
      `<g transform="${rot}">` +
      `<line x1="${MID - 210}" y1="${BEAM_Y}" x2="${MID + 210}" y2="${BEAM_Y}" stroke="${C.teal}" stroke-width="6" stroke-linecap="round"/>` +
      `<circle cx="${MID}" cy="${BEAM_Y}" r="9" fill="#f2c15b" stroke="${C.navy}" stroke-width="2.5"/>` +
      // hangers
      `<line x1="${MID - 150}" y1="${BEAM_Y}" x2="${MID - 150}" y2="${panTop - 8}" stroke="${C.muted}" stroke-width="2"/>` +
      `<line x1="${MID + 150}" y1="${BEAM_Y}" x2="${MID + 150}" y2="${panTop - 8}" stroke="${C.muted}" stroke-width="2"/>` +
      // pans
      `<rect x="${MID - 218}" y="${panTop - 6}" width="136" height="72" rx="12" fill="#f8fbff" stroke="${C.teal}" stroke-width="2"/>` +
      `<rect x="${MID + 82}" y="${panTop - 6}" width="136" height="72" rx="12" fill="#fffaf0" stroke="${C.amber}" stroke-width="2"/>` +
      panTokens(s.left, MID - 150, panTop) +
      panTokens(s.right, MID + 150, panTop) +
      `</g></svg>`;
  }

  function wobble() {
    // Quick tilt-and-settle to show the scale re-balancing after an equal move.
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduce) {
      renderScale(0);
      return;
    }
    const dir = Math.random() < 0.5 ? -1 : 1;
    let start = null;
    const dur = 520;
    const step = (t) => {
      if (start == null) start = t;
      const p = Math.min(1, (t - start) / dur);
      const tilt = dir * 4 * Math.sin(p * Math.PI) * (1 - p);
      renderScale(tilt);
      if (p < 1 && root.isConnected) requestAnimationFrame(step);
      else renderScale(0);
    };
    requestAnimationFrame(step);
  }

  function render() {
    const s = state();
    el("eq").innerHTML =
      `<span class="eqlab-side">${esc(sideText(s.left, v))}</span><span class="eqlab-equals">=</span><span class="eqlab-side">${esc(sideText(s.right, v))}</span>`;
    renderScale(0);
    el("trail").innerHTML = history
      .slice(1)
      .map((h) => `<span class="eqlab-trailstep">${esc(h.note)}</span>`)
      .join('<span class="eqlab-arrow">→</span>');
    const undo = el("undo");
    undo.disabled = history.length <= 1;
    root.classList.toggle("eqlab-solved", solvedFlag);
  }

  function doOp(op) {
    if (solvedFlag) return;
    const raw = el("val").value.trim();
    const k = Number(raw);
    if (raw === "" || !Number.isFinite(k)) {
      feed("warn", "Type a number in the box first, then choose an operation.");
      el("val").focus();
      return;
    }
    if ((op === "divide" || op === "multiply") && k === 0) {
      feed("warn", "You can't multiply or divide both sides by 0.");
      return;
    }
    const s = state();
    const left = applyOp(s.left, op, k);
    const right = applyOp(s.right, op, k);
    const sym = OPS.find((o) => o.op === op).sym;
    const note = op === "add" || op === "subtract" ? `${sym} ${fmt(k)}` : `${sym} ${fmt(k)}`;
    history.push({ left, right, note });
    el("val").value = "";
    render();
    wobble();
    if (isSolved(left, right, v)) {
      solvedFlag = true;
      root.classList.add("eqlab-solved");
      const sol = left.a === 1 ? right.b : left.b;
      feed(
        "win",
        `🎉 <strong>Solved!</strong> The variable is alone: <strong>${v} = ${fmt(sol)}</strong>. Every move kept both sides equal, so the scale stayed balanced. Substitute ${fmt(sol)} back into the original equation to prove it.`,
      );
    } else {
      feed(
        "ok",
        `Applied <strong>${esc(note)}</strong> to both sides — still balanced. What's left to remove from the ${v} side?`,
      );
    }
  }

  function feed(kind, html) {
    el("feed").innerHTML = `<div class="eqlab-msg eqlab-msg-${kind}">${html}</div>`;
  }

  root
    .querySelectorAll("[data-op]")
    .forEach((b) => b.addEventListener("click", () => doOp(b.dataset.op)));
  el("val").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      doOp("subtract");
    }
  });
  el("undo").addEventListener("click", () => {
    if (history.length > 1) {
      history.pop();
      solvedFlag = false;
      render();
      feed("ok", "Stepped back one move.");
    }
  });
  el("reset").addEventListener("click", () => setEquation(equationSrc));
  root
    .querySelectorAll("[data-preset]")
    .forEach((b) =>
      b.addEventListener("click", () => setEquation(presets[Number(b.dataset.preset)].equation)),
    );

  setEquation(equationSrc);

  return {
    destroy() {
      root.remove();
    },
  };
}

let stylesInjected = false;
function injectStyles() {
  if (stylesInjected || document.getElementById("eqlab-styles")) {
    stylesInjected = true;
    return;
  }
  stylesInjected = true;
  const s = document.createElement("style");
  s.id = "eqlab-styles";
  s.textContent = `
  .eqlab{max-width:780px;margin:0 auto;background:#fff;border:1px solid ${C.line};border-radius:16px;padding:16px 16px 18px;box-shadow:0 2px 12px rgba(12,27,42,.08);font-family:"Hanken Grotesk",system-ui,sans-serif;color:${C.ink};}
  .eqlab-title{font-family:"Outfit",system-ui,sans-serif;font-weight:800;color:${C.navy};font-size:1.05rem;}
  .eqlab-hint{margin:4px 0 12px;color:${C.muted};font-size:.9rem;line-height:1.45;}
  .eqlab-presets{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 10px;}
  .eqlab-chip{padding:5px 12px;font-size:.9rem;font-weight:700;color:${C.navy};background:${C.chipBg};border:1.5px solid ${C.line};border-radius:999px;cursor:pointer;font-family:inherit;}
  .eqlab-chip:hover{background:#e2ecff;border-color:${C.accent};}
  .eqlab-eq{display:flex;align-items:center;justify-content:center;gap:14px;padding:8px;font-family:"Outfit",system-ui,sans-serif;}
  .eqlab-side{font-size:1.5rem;font-weight:800;color:${C.navy};}
  .eqlab-equals{font-size:1.4rem;font-weight:800;color:${C.muted};}
  .eqlab-scale svg{width:100%;height:auto;display:block;}
  /* Two columns: scale (dominant, keeps its own aspect) + control panel. */
  .eqlab-stage{display:grid;grid-template-columns:minmax(0,1fr) 200px;align-items:start;gap:14px;margin-top:8px;}
  .eqlab-controls{display:flex;flex-direction:column;align-items:stretch;gap:10px;}
  .eqlab-field{display:flex;flex-direction:column;gap:3px;font-size:.7rem;font-weight:800;color:${C.muted};text-transform:uppercase;letter-spacing:.03em;}
  .eqlab-field input{width:100%;padding:9px 10px;font-size:1.1rem;font-weight:700;color:${C.ink};border:2px solid ${C.line};border-radius:10px;background:#fbfcfe;text-transform:none;font-family:inherit;}
  .eqlab-field input:focus-visible{outline:3px solid ${C.accent};outline-offset:1px;border-color:${C.accent};}
  .eqlab-ops{display:flex;flex-direction:column;gap:6px;}
  .eqlab-op{padding:9px 12px;text-align:left;font-size:.85rem;font-weight:800;color:${C.navy};background:${C.chipBg};border:1.5px solid ${C.line};border-radius:10px;cursor:pointer;font-family:inherit;}
  .eqlab-op:hover{background:#e2ecff;border-color:${C.accent};}
  .eqlab-op:focus-visible,.eqlab-btn:focus-visible,.eqlab-chip:focus-visible{outline:3px solid ${C.accent};outline-offset:2px;}
  .eqlab-actions{display:flex;gap:8px;margin-top:10px;}
  .eqlab-btn{padding:7px 14px;font-size:.85rem;font-weight:800;color:${C.navy};background:#fff;border:1.5px solid ${C.line};border-radius:9px;cursor:pointer;font-family:inherit;}
  .eqlab-btn:hover:not(:disabled){background:${C.chipBg};}
  .eqlab-btn:disabled{opacity:.4;cursor:default;}
  .eqlab-trail{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:10px;min-height:1em;}
  .eqlab-trailstep{padding:2px 9px;font-size:.82rem;font-weight:800;color:${C.teal};background:${C.tealBg};border-radius:999px;}
  .eqlab-arrow{color:${C.muted};font-weight:700;}
  .eqlab-feed{margin-top:10px;}
  .eqlab-msg{padding:10px 14px;border-radius:12px;font-size:.95rem;line-height:1.5;}
  .eqlab-msg-ok{background:${C.tealBg};color:#095350;border:1px solid #9adbd2;}
  .eqlab-msg-warn{background:#fbf4e6;color:#8a5800;border:1px solid #ecd9ae;}
  .eqlab-msg-win{background:linear-gradient(135deg,#e2f9f5,#eef2ff);color:${C.navy};border:1px solid #9adbd2;}
  .eqlab-solved .eqlab-eq{animation:eqlab-pop .5s ease;}
  @keyframes eqlab-pop{0%{transform:scale(1)}40%{transform:scale(1.04)}100%{transform:scale(1)}}
  @media (prefers-reduced-motion:reduce){.eqlab-solved .eqlab-eq{animation:none}}
  /* Tablet/phone: panel drops back UNDER the visual so neither gets squeezed. */
  @media (max-width:720px){
    .eqlab-stage{grid-template-columns:1fr;gap:10px;}
    .eqlab-controls{flex-direction:row;flex-wrap:wrap;align-items:flex-end;}
    .eqlab-field{flex:0 0 auto;}
    .eqlab-field input{width:88px;}
    .eqlab-ops{flex-direction:row;flex-wrap:wrap;flex:1;}
    .eqlab-op{text-align:center;}
  }
  @media (max-width:480px){.eqlab-side{font-size:1.25rem;}}
  `;
  document.head.appendChild(s);
}

export default renderEquationBalanceLab;

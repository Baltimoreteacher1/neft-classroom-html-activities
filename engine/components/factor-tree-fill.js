// factor-tree-fill.js — Fill-in-the-blank factor tree. Takes the SAME config a
// static `factor-tree` diagram uses ({ value, left, right, title }) — which
// already carries the full, correct tree — and renders it with the branch nodes
// blanked out as inputs the student fills in and checks. The completed config is
// the answer key, so no separate authoring is needed: every existing static
// factor tree upgrades to a scaffolded, checkable exercise with no config edits.
//
// Pure SVG + DOM, no dependencies. Matches the static factorTreeSVG() palette so
// the live exercise and the printed diagrams read as one family.
//
// Public API:
//   renderFactorTreeFill(container, cfg) -> { destroy }
//     cfg.value / cfg.left / cfg.right : the tree (root value + branches)
//     cfg.title  : optional heading
//     cfg.blanks : "non-root" (default) | "leaves" | "all"
//         non-root — every node except the given root is a blank to fill
//         leaves   — only the prime leaves are blanks (the primes to find)
//         all      — every node including the root is a blank

const C = {
  navy: "#12355b",
  primeFill: "#e2f9f5",
  primeStroke: "#0d7a76",
  primeInk: "#095350",
  compFill: "#fbf4e6",
  compStroke: "#d4952a",
  compInk: "#8a5800",
  line: "#d7e2ed",
  ink: "#1a2b3c",
  muted: "#54677c",
  accent: "#1d4ed8",
  wrong: "#d9534f",
};

const SUP = { 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
function sup(n) {
  return String(n)
    .split("")
    .map((d) => SUP[d] || d)
    .join("");
}

function esc(s) {
  return String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
}

// One-time scoped styles (shake + input polish). Guarded by id so repeated
// mounts on the same page share a single <style>.
function ensureStyles() {
  if (document.getElementById("ft-fill-styles")) return;
  const s = document.createElement("style");
  s.id = "ft-fill-styles";
  s.textContent = `
  .ftf-wrap{margin:var(--sp-3,12px) 0;display:flex;flex-direction:column;align-items:center;}
  .ftf-title{font-weight:700;color:var(--navy,#12355b);margin-bottom:6px;font-size:.95rem;text-align:center;}
  .ftf-hint{font-size:.8rem;color:${C.muted};margin-bottom:8px;text-align:center;}
  .ftf-stage{position:relative;width:100%;max-width:360px;background:#fff;border:1px solid ${C.line};border-radius:12px;padding:10px;}
  .ftf-stage svg{width:100%;height:auto;display:block;}
  .ftf-input{position:absolute;transform:translate(-50%,-50%);width:15%;min-width:34px;aspect-ratio:1/1;
    border:2px dashed ${C.compStroke};border-radius:50%;background:#fffdf7;color:${C.ink};
    font-weight:800;font-size:clamp(12px,3.6vw,15px);text-align:center;padding:0;box-sizing:border-box;
    -moz-appearance:textfield;}
  .ftf-input::-webkit-outer-spin-button,.ftf-input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0;}
  .ftf-input:focus{outline:none;border-color:${C.accent};box-shadow:0 0 0 3px rgba(29,78,216,.18);}
  .ftf-input.correct{border-style:solid;border-color:${C.primeStroke};background:${C.primeFill};color:${C.primeInk};}
  .ftf-input.correct.comp{border-color:${C.compStroke};background:${C.compFill};color:${C.compInk};}
  .ftf-input.wrong{border-color:${C.wrong};background:#fdeceb;color:${C.wrong};animation:ftf-shake .32s;}
  @keyframes ftf-shake{0%,100%{transform:translate(-50%,-50%)}25%{transform:translate(calc(-50% - 4px),-50%)}75%{transform:translate(calc(-50% + 4px),-50%)}}
  @media (prefers-reduced-motion:reduce){.ftf-input.wrong{animation:none;}}
  .ftf-controls{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:10px;}
  .ftf-btn{font:inherit;font-weight:700;font-size:.85rem;border-radius:999px;padding:7px 16px;cursor:pointer;border:2px solid transparent;}
  .ftf-btn-check{background:${C.accent};color:#fff;}
  .ftf-btn-check:hover{filter:brightness(1.05);}
  .ftf-btn-reveal{background:#fff;color:${C.navy};border-color:${C.line};}
  .ftf-status{min-height:1.2em;margin-top:8px;font-size:.85rem;font-weight:700;text-align:center;}
  .ftf-status.ok{color:${C.primeStroke};}
  .ftf-status.no{color:${C.wrong};}
  .ftf-result{margin-top:8px;font-size:.95rem;color:${C.navy};text-align:center;font-weight:700;}
  `;
  document.head.appendChild(s);
}

function isPrime(n) {
  if (!Number.isInteger(n) || n < 2) return false;
  if (n % 2 === 0) return n === 2;
  for (let i = 3; i * i <= n; i += 2) if (n % i === 0) return false;
  return true;
}

// Ordered prime factors with multiplicity from the tree's leaves (left→right).
function leafPrimes(node, out) {
  if (!node) return out;
  if (!node.left && !node.right) {
    out.push(Number(node.value));
    return out;
  }
  leafPrimes(node.left, out);
  leafPrimes(node.right, out);
  return out;
}

// Compact exponent form: [2,2,3,7] -> "2² × 3 × 7".
function exponentForm(primes) {
  const counts = new Map();
  for (const p of primes) counts.set(p, (counts.get(p) || 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([p, k]) => (k > 1 ? `${p}${sup(k)}` : `${p}`))
    .join(" × ");
}

export function renderFactorTreeFill(host, cfg) {
  ensureStyles();
  const blanks = cfg.blanks || "non-root";

  // Layout by leaf slots: every leaf gets an equal horizontal slot and each
  // parent sits above the midpoint of its children, so the tree never crowds
  // however it leans (factor trees peel to the right and would otherwise
  // collapse). Node records keep child links so checking is math-based, not a
  // match against config's one specific tree — any valid factorization passes.
  const LEVEL_H = 64;
  const SLOT_W = 62;
  const PAD = 26;
  let leafCount = 0;
  let maxDepth = 0;
  function build(node, depth, isRoot) {
    if (!node) return null;
    const leaf = !node.left && !node.right;
    maxDepth = Math.max(maxDepth, depth);
    const rec = {
      value: Number(node.value),
      leaf,
      blank: blanks === "all" ? true : blanks === "leaves" ? leaf : !isRoot,
      left: null,
      right: null,
      x: 0,
      y: PAD + depth * LEVEL_H,
      inp: null,
    };
    if (leaf) {
      rec.x = PAD + (leafCount + 0.5) * SLOT_W;
      leafCount += 1;
    } else {
      rec.left = build(node.left, depth + 1, false);
      rec.right = build(node.right, depth + 1, false);
      const kids = [rec.left, rec.right].filter(Boolean);
      rec.x = kids.reduce((s, k) => s + k.x, 0) / kids.length;
    }
    return rec;
  }
  const root = build(cfg, 0, true);
  const W = PAD * 2 + Math.max(1, leafCount) * SLOT_W;
  const H = PAD + maxDepth * LEVEL_H + PAD;

  const nodes = [];
  const lines = [];
  (function walk(n) {
    if (!n) return;
    nodes.push(n);
    for (const c of [n.left, n.right]) {
      if (!c) continue;
      lines.push({ x1: n.x, y1: n.y + 16, x2: c.x, y2: c.y - 16 });
      walk(c);
    }
  })(root);

  const linesSvg = lines
    .map(
      (l) =>
        `<line x1="${l.x1}" y1="${l.y1}" x2="${l.x2}" y2="${l.y2}" stroke="${C.line}" stroke-width="2.5" />`,
    )
    .join("");

  // Shown (non-blank) nodes render as filled SVG circles; blanks render as a
  // faint placeholder circle with an HTML <input> overlaid at the same point.
  const shownSvg = nodes
    .filter((n) => !n.blank)
    .map((n) => {
      const fill = n.leaf ? C.primeFill : C.compFill;
      const stroke = n.leaf ? C.primeStroke : C.compStroke;
      const ink = n.leaf ? C.primeInk : C.compInk;
      return `<g><circle cx="${n.x}" cy="${n.y}" r="16" fill="${fill}" stroke="${stroke}" stroke-width="2"/><text x="${n.x}" y="${n.y}" dy="5" font-family="Segoe UI, sans-serif" font-weight="700" font-size="12px" fill="${ink}" text-anchor="middle">${n.value}</text></g>`;
    })
    .join("");
  const placeholderSvg = nodes
    .filter((n) => n.blank)
    .map(
      (n) =>
        `<circle cx="${n.x}" cy="${n.y}" r="16" fill="#fffdf7" stroke="${C.line}" stroke-width="2" stroke-dasharray="3 3"/>`,
    )
    .join("");

  const wrap = document.createElement("div");
  wrap.className = "ftf-wrap";
  const primes = leafPrimes(cfg, []);
  const rootVal = Number(cfg.value);
  wrap.innerHTML = `
    ${cfg.title ? `<div class="ftf-title">${esc(cfg.title)}</div>` : ""}
    <div class="ftf-hint">Fill in each blank so every branch multiplies to the number above it. Stop when every leaf is prime.</div>
    <div class="ftf-stage">
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Factor tree for ${rootVal} with blanks to fill in.">
        ${linesSvg}${placeholderSvg}${shownSvg}
      </svg>
    </div>
    <div class="ftf-controls">
      <button type="button" class="ftf-btn ftf-btn-check">Check tree</button>
      <button type="button" class="ftf-btn ftf-btn-reveal">Show me</button>
    </div>
    <div class="ftf-status" role="status" aria-live="polite"></div>
    <div class="ftf-result" hidden></div>
  `;

  const stage = wrap.querySelector(".ftf-stage");
  const status = wrap.querySelector(".ftf-status");
  const result = wrap.querySelector(".ftf-result");

  // Overlay an input on each blank node, positioned by percentage of the stage
  // box so it tracks the responsive SVG exactly.
  const blankNodes = nodes.filter((n) => n.blank);
  for (const n of blankNodes) {
    const inp = document.createElement("input");
    inp.className = "ftf-input" + (n.leaf ? "" : " comp");
    inp.type = "text";
    inp.inputMode = "numeric";
    inp.setAttribute("pattern", "[0-9]*");
    inp.maxLength = 3;
    inp.setAttribute(
      "aria-label",
      n.leaf
        ? `prime leaf of the ${rootVal} factor tree`
        : `factor branch of the ${rootVal} factor tree`,
    );
    inp.style.left = `${((n.x / W) * 100).toFixed(2)}%`;
    inp.style.top = `${((n.y / H) * 100).toFixed(2)}%`;
    inp.addEventListener("input", () => {
      inp.value = inp.value.replace(/[^0-9]/g, "");
      inp.classList.remove("wrong", "correct");
    });
    stage.appendChild(inp);
    n.inp = inp;
  }

  // Effective value of any node: shown → its fixed value; blank → the typed
  // number (NaN when empty / not yet a number).
  const valOf = (n) => {
    if (!n) return Number.NaN;
    if (!n.blank) return n.value;
    const t = n.inp.value.trim();
    return t === "" ? Number.NaN : parseInt(t, 10);
  };

  // Math-based checking: a tree is correct when every leaf is prime and every
  // parent equals the product of its two children — using the student's OWN
  // numbers. So any valid factorization is accepted (84 → 2×42 or 4×21 …, and
  // the primes may be filled in any order), not just config's specific tree.
  function check() {
    const wrong = new Set();
    let anyEmpty = false;
    for (const n of blankNodes) n.inp.classList.remove("correct", "wrong");

    for (const n of nodes) {
      if (n.leaf) {
        if (!n.blank) continue;
        const v = valOf(n);
        if (Number.isNaN(v)) {
          anyEmpty = true;
          continue;
        }
        if (!isPrime(v)) wrong.add(n); // a leaf must be a prime you can't split
      } else {
        const nv = valOf(n),
          lv = valOf(n.left),
          rv = valOf(n.right);
        if ([nv, lv, rv].some(Number.isNaN)) {
          anyEmpty = true;
          continue;
        }
        if (nv !== lv * rv) {
          // The split is wrong: flag the editable culprits (a shown parent
          // like the root has no input of its own).
          if (n.blank) wrong.add(n);
          if (n.left?.blank) wrong.add(n.left);
          if (n.right?.blank) wrong.add(n.right);
        }
      }
    }

    for (const n of blankNodes) {
      const v = valOf(n);
      if (Number.isNaN(v)) continue;
      n.inp.classList.add(wrong.has(n) ? "wrong" : "correct");
    }

    if (!anyEmpty && wrong.size === 0) {
      status.textContent = "Prime factorization complete! 🎉";
      status.className = "ftf-status ok";
      showResult(studentPrimes());
    } else if (anyEmpty) {
      status.textContent = "Fill in every blank, then check.";
      status.className = "ftf-status no";
    } else {
      status.textContent = "Not yet — a red circle doesn't split correctly, or a leaf isn't prime.";
      status.className = "ftf-status no";
    }
  }

  // Primes the student actually built (leaves, left→right), ascending.
  function studentPrimes() {
    return nodes
      .filter((n) => n.leaf)
      .map(valOf)
      .filter((v) => Number.isInteger(v))
      .sort((a, b) => a - b);
  }

  function showResult(primeList) {
    const ps = primeList && primeList.length ? primeList : primes;
    result.hidden = false;
    result.innerHTML = `${rootVal} = ${ps.join(" × ")} = ${exponentForm(ps)}`;
  }

  function reveal() {
    for (const n of blankNodes) {
      n.inp.value = String(n.value);
      n.inp.classList.remove("wrong");
      n.inp.classList.add("correct");
    }
    status.textContent = "Here's one completed factor tree.";
    status.className = "ftf-status ok";
    showResult(primes.slice().sort((a, b) => a - b));
  }

  const checkBtn = wrap.querySelector(".ftf-btn-check");
  const revealBtn = wrap.querySelector(".ftf-btn-reveal");
  checkBtn.addEventListener("click", check);
  revealBtn.addEventListener("click", reveal);

  host.appendChild(wrap);
  if (blankNodes[0]) setTimeout(() => blankNodes[0].inp.focus(), 0);

  return {
    destroy() {
      checkBtn.removeEventListener("click", check);
      revealBtn.removeEventListener("click", reveal);
      wrap.remove();
    },
  };
}

export default renderFactorTreeFill;

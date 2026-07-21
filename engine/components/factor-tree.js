// factor-tree.js — Interactive prime-factorization lab. A student types a number
// and the widget builds its factor tree live: composites branch (amber) until
// every leaf is a prime (teal), then it shows the prime factorization in both
// expanded (2 × 2 × 3 × 5) and exponent (2² × 3 × 5) form. Two extra modes let a
// student compare two numbers to read off the GCF or LCM from the shared primes.
//
// Pure SVG + DOM, no dependencies. Matches the static factorTreeSVG() palette so
// the live tool and the printed diagrams look like one family.
//
// Public API:
//   renderFactorTree(container, cfg) -> { destroy }
//     cfg.mode    : "single" (default) | "gcf" | "lcm"
//     cfg.start   : number pre-filled in the first input (default 60 / 24)
//     cfg.startB  : second number for gcf/lcm (default 36)
//     cfg.presets : quick-pick numbers (default sensible per mode)
//     cfg.max     : largest allowed input (default 300, hard-capped 999)

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

function smallestPrimeFactor(n) {
  if (n % 2 === 0) return 2;
  for (let i = 3; i * i <= n; i += 2) if (n % i === 0) return i;
  return n; // n is prime
}

// Ordered list of prime factors with multiplicity, e.g. 60 -> [2,2,3,5].
function primeFactors(n) {
  const out = [];
  let m = n;
  while (m > 1) {
    const p = smallestPrimeFactor(m);
    out.push(p);
    m /= p;
  }
  return out;
}

// Map of prime -> exponent, e.g. 60 -> {2:2, 3:1, 5:1}.
function factorCounts(n) {
  const map = new Map();
  for (const p of primeFactors(n)) map.set(p, (map.get(p) || 0) + 1);
  return map;
}

// Build the binary factor tree by repeatedly peeling off the smallest prime:
// n -> { p (prime leaf), n/p (recurse) }. Leaves are all primes.
function buildTree(n) {
  const p = smallestPrimeFactor(n);
  if (p === n) return { value: n, prime: true };
  return { value: n, prime: false, left: { value: p, prime: true }, right: buildTree(n / p) };
}

// Assign integer grid coordinates: leaves get consecutive x, parents sit above
// the midpoint of their children. Returns {nodes, cols, rows}.
function layout(root) {
  let leaf = 0;
  let maxDepth = 0;
  const nodes = [];
  (function walk(node, depth) {
    node.depth = depth;
    maxDepth = Math.max(maxDepth, depth);
    if (!node.left && !node.right) {
      node.gx = leaf++;
    } else {
      if (node.left) walk(node.left, depth + 1);
      if (node.right) walk(node.right, depth + 1);
      const xs = [node.left, node.right].filter(Boolean).map((c) => c.gx);
      node.gx = (Math.min(...xs) + Math.max(...xs)) / 2;
    }
    nodes.push(node);
  })(root, 0);
  return { nodes, cols: Math.max(1, leaf), rows: maxDepth + 1 };
}

// Render one factor tree to an <svg> element sized to its shape.
function treeSVG(n) {
  const tree = buildTree(n);
  const { nodes, cols, rows } = layout(tree);
  const GAPX = 56;
  const GAPY = 62;
  const R = 17;
  const PAD = 16;
  const W = Math.max(GAPX, (cols - 1) * GAPX) + PAD * 2 + R * 2;
  const H = (rows - 1) * GAPY + PAD * 2 + R * 2;
  const px = (gx) => PAD + R + gx * GAPX;
  const py = (depth) => PAD + R + depth * GAPY;

  // Build-in cascade: the root pops first (delay 0), each depth of children
  // springs in from its parent slightly later (plus a small left-to-right
  // ripple), and each connector fades in just after its child lands. Delays
  // are inline; the keyframes live in injectStyles() and are disabled under
  // prefers-reduced-motion (the tree then simply appears complete).
  const nodeDelay = (n) => Math.round(n.depth * 90 + n.gx * 24);
  let lines = "";
  let circles = "";
  for (const node of nodes) {
    const x = px(node.gx);
    const y = py(node.depth);
    for (const child of [node.left, node.right]) {
      if (!child) continue;
      const cx = px(child.gx);
      const cy = py(child.depth);
      lines += `<line x1="${x}" y1="${y + R}" x2="${cx}" y2="${cy - R}" stroke="${C.line}" stroke-width="2.5" class="ftlab-line-in" style="animation-delay:${nodeDelay(child) + 150}ms" />`;
    }
    const fill = node.prime ? C.primeFill : C.compFill;
    const stroke = node.prime ? C.primeStroke : C.compStroke;
    const ink = node.prime ? C.primeInk : C.compInk;
    const fontSize = node.value >= 100 ? 12 : 13;
    circles +=
      `<g class="ftlab-node-in" style="animation-delay:${nodeDelay(node)}ms"><circle cx="${x}" cy="${y}" r="${R}" fill="${fill}" stroke="${stroke}" stroke-width="2.5" />` +
      `<text x="${x}" y="${y}" dy="4.5" font-family="Outfit, Segoe UI, sans-serif" font-weight="800" font-size="${fontSize}px" fill="${ink}" text-anchor="middle">${node.value}</text></g>`;
  }

  return (
    `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" ` +
    `aria-label="Factor tree for ${n}" style="max-width:100%; height:auto; display:block; margin:0 auto;">` +
    lines +
    circles +
    `</svg>`
  );
}

// "2 × 2 × 3 × 5" and "2² × 3 × 5" for a number (or "prime" note for primes).
function equations(n) {
  const factors = primeFactors(n);
  const expanded = factors.join(" × ");
  const counts = factorCounts(n);
  const exponent = [...counts.entries()]
    .map(([p, e]) => (e > 1 ? `${p}${sup(e)}` : `${p}`))
    .join(" × ");
  return { expanded, exponent, isPrime: factors.length === 1, factors, counts };
}

export function renderFactorTree(container, cfg = {}) {
  const mode = ["single", "gcf", "lcm"].includes(cfg.mode) ? cfg.mode : "single";
  const MAX = Math.min(999, Math.max(12, cfg.max || 300));
  const two = mode !== "single";

  const defaults = { single: 60, gcf: 24, lcm: 4 };
  let a = clamp(cfg.start || defaults[mode]);
  let b = clamp(cfg.startB || (mode === "gcf" ? 36 : 6));

  function clamp(v) {
    v = Math.floor(Number(v) || 0);
    return Math.max(2, Math.min(MAX, v));
  }

  const presets =
    Array.isArray(cfg.presets) && cfg.presets.length
      ? cfg.presets.map(clamp)
      : mode === "single"
        ? [12, 24, 36, 48, 72, 100]
        : [];

  injectStyles();

  const root = document.createElement("div");
  root.className = "ftlab";
  const title =
    mode === "gcf"
      ? "Factor Tree Lab · Greatest Common Factor"
      : mode === "lcm"
        ? "Factor Tree Lab · Least Common Multiple"
        : "Factor Tree Lab";
  const hint =
    mode === "single"
      ? "Type a number, then build its tree. Keep splitting until every end number is a prime."
      : mode === "gcf"
        ? "Build both trees, then read the shared primes to find the GCF."
        : "Build both trees, then combine the primes (highest power of each) to find the LCM.";

  root.innerHTML =
    `<div class="ftlab-head"><span class="ftlab-title">${esc(title)}</span></div>` +
    `<p class="ftlab-hint">${esc(hint)}</p>` +
    `<div class="ftlab-controls">${inputHTML("A", a)}${two ? inputHTML("B", b) : ""}` +
    `<button type="button" class="ftlab-go">Build ${two ? "trees" : "tree"} →</button>` +
    `<button type="button" class="ftlab-rand" title="Try a random number">🎲 Random</button></div>` +
    (presets.length
      ? `<div class="ftlab-presets" role="group" aria-label="Quick-pick numbers">` +
        presets
          .map((p) => `<button type="button" class="ftlab-chip" data-n="${p}">${p}</button>`)
          .join("") +
        `</div>`
      : "") +
    `<div class="ftlab-stage"></div>` +
    `<div class="ftlab-result" aria-live="polite"></div>`;

  container.appendChild(root);

  const inA = root.querySelector('[data-inp="A"]');
  const inB = two ? root.querySelector('[data-inp="B"]') : null;
  const stage = root.querySelector(".ftlab-stage");
  const result = root.querySelector(".ftlab-result");

  function inputHTML(id, val) {
    const label = two ? (id === "A" ? "First number" : "Second number") : "Your number";
    return (
      `<label class="ftlab-field"><span>${label}</span>` +
      `<input type="number" inputmode="numeric" min="2" max="${MAX}" value="${val}" data-inp="${id}" aria-label="${label} (2 to ${MAX})" /></label>`
    );
  }

  function readInputs() {
    a = clamp(inA.value);
    inA.value = a;
    if (inB) {
      b = clamp(inB.value);
      inB.value = b;
    }
  }

  function build() {
    readInputs();
    if (mode === "single") buildSingle();
    else buildPair();
  }

  function buildSingle() {
    const eq = equations(a);
    stage.innerHTML = `<div class="ftlab-tree">${treeSVG(a)}</div>`;
    result.innerHTML = eq.isPrime
      ? `<div class="ftlab-eqn"><strong>${a}</strong> is already a <span class="ftlab-tag is-prime">prime number</span> — it can't be broken down any further.</div>`
      : `<div class="ftlab-eqn"><span class="ftlab-eqn-line"><strong>${a}</strong> = ${eq.expanded}</span>` +
        `<span class="ftlab-eqn-line ftlab-eqn-exp">= ${eq.exponent}</span></div>` +
        `<div class="ftlab-legend"><span class="ftlab-key is-comp">amber = still composite</span>` +
        `<span class="ftlab-key is-prime">teal = prime (a leaf)</span></div>`;
  }

  function buildPair() {
    const eqA = equations(a);
    const eqB = equations(b);
    stage.innerHTML =
      `<div class="ftlab-pair">` +
      `<div class="ftlab-col"><div class="ftlab-col-label">${a}</div><div class="ftlab-tree">${treeSVG(a)}</div>` +
      `<div class="ftlab-col-eqn">${a} = ${eqA.exponent}</div></div>` +
      `<div class="ftlab-col"><div class="ftlab-col-label">${b}</div><div class="ftlab-tree">${treeSVG(b)}</div>` +
      `<div class="ftlab-col-eqn">${b} = ${eqB.exponent}</div></div>` +
      `</div>`;
    result.innerHTML = mode === "gcf" ? gcfPanel(a, b, eqA, eqB) : lcmPanel(a, b, eqA, eqB);
  }

  // Wire events
  root.querySelector(".ftlab-go").addEventListener("click", build);
  root.querySelector(".ftlab-rand").addEventListener("click", () => {
    inA.value = 2 + Math.floor(rand() * (Math.min(MAX, 100) - 1));
    if (inB) inB.value = 2 + Math.floor(rand() * (Math.min(MAX, 100) - 1));
    build();
  });
  root.querySelectorAll(".ftlab-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      inA.value = chip.dataset.n;
      build();
    });
  });
  [inA, inB].forEach((inp) => {
    if (!inp) return;
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        build();
      }
    });
  });

  // First paint
  build();

  return {
    destroy() {
      root.remove();
    },
  };
}

// A tiny deterministic-ish RNG seed source that avoids Math.random dependency
// concerns in this codebase's tooling — but here we just want variety at runtime.
function rand() {
  // eslint-disable-next-line no-restricted-globals
  return Math.random();
}

function gcfPanel(a, b, eqA, eqB) {
  const shared = [];
  const gcfParts = [];
  const seen = new Set([...eqA.counts.keys(), ...eqB.counts.keys()]);
  let gcf = 1;
  for (const p of [...seen].sort((x, y) => x - y)) {
    const e = Math.min(eqA.counts.get(p) || 0, eqB.counts.get(p) || 0);
    if (e > 0) {
      shared.push(e > 1 ? `${p}${sup(e)}` : `${p}`);
      for (let i = 0; i < e; i++) gcfParts.push(p);
      gcf *= Math.pow(p, e);
    }
  }
  const body = shared.length
    ? `The primes in <strong>both</strong> trees are ${shared.join(" × ")}. Multiply them: ${gcfParts.join(" × ")} = <strong>${gcf}</strong>.`
    : `The trees share no prime factors, so the only common factor is <strong>1</strong>.`;
  return `<div class="ftlab-eqn"><span class="ftlab-answer">GCF(${a}, ${b}) = ${gcf}</span></div><p class="ftlab-explain">${body}</p>`;
}

function lcmPanel(a, b, eqA, eqB) {
  const parts = [];
  const factors = [];
  const seen = new Set([...eqA.counts.keys(), ...eqB.counts.keys()]);
  let lcm = 1;
  for (const p of [...seen].sort((x, y) => x - y)) {
    const e = Math.max(eqA.counts.get(p) || 0, eqB.counts.get(p) || 0);
    parts.push(e > 1 ? `${p}${sup(e)}` : `${p}`);
    for (let i = 0; i < e; i++) factors.push(p);
    lcm *= Math.pow(p, e);
  }
  const body = `Take the <strong>highest power</strong> of every prime that appears in either tree: ${parts.join(" × ")} = ${factors.join(" × ")} = <strong>${lcm}</strong>.`;
  return `<div class="ftlab-eqn"><span class="ftlab-answer">LCM(${a}, ${b}) = ${lcm}</span></div><p class="ftlab-explain">${body}</p>`;
}

let stylesInjected = false;
function injectStyles() {
  if (stylesInjected || document.getElementById("ftlab-styles")) {
    stylesInjected = true;
    return;
  }
  stylesInjected = true;
  const s = document.createElement("style");
  s.id = "ftlab-styles";
  s.textContent = `
  .ftlab{max-width:640px;margin:0 auto;background:#fff;border:1px solid ${C.line};border-radius:16px;padding:16px 16px 18px;box-shadow:0 2px 12px rgba(12,27,42,.08);font-family:"Hanken Grotesk",system-ui,sans-serif;color:${C.ink};}
  .ftlab-head{display:flex;align-items:center;gap:8px;}
  .ftlab-title{font-family:"Outfit",system-ui,sans-serif;font-weight:800;color:${C.navy};font-size:1.05rem;}
  .ftlab-hint{margin:4px 0 12px;color:${C.muted};font-size:.9rem;line-height:1.4;}
  .ftlab-controls{display:flex;flex-wrap:wrap;align-items:flex-end;gap:10px;}
  .ftlab-field{display:flex;flex-direction:column;gap:3px;font-size:.72rem;font-weight:700;color:${C.muted};text-transform:uppercase;letter-spacing:.03em;}
  .ftlab-field input{width:96px;padding:8px 10px;font-size:1.1rem;font-weight:700;color:${C.ink};border:2px solid ${C.line};border-radius:10px;background:#fbfcfe;text-transform:none;letter-spacing:normal;}
  .ftlab-field input:focus-visible{outline:3px solid ${C.accent};outline-offset:1px;border-color:${C.accent};}
  .ftlab-go{padding:9px 16px;font-size:.95rem;font-weight:800;color:#fff;background:linear-gradient(135deg,#4f46e5,#0e8a7d);border:0;border-radius:10px;cursor:pointer;}
  .ftlab-go:hover{filter:brightness(1.08);}
  .ftlab-rand{padding:9px 12px;font-size:.85rem;font-weight:700;color:${C.navy};background:#eef4ff;border:1px solid ${C.line};border-radius:10px;cursor:pointer;}
  .ftlab-go:focus-visible,.ftlab-rand:focus-visible,.ftlab-chip:focus-visible{outline:3px solid ${C.accent};outline-offset:2px;}
  .ftlab-presets{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0 0;}
  .ftlab-chip{padding:5px 12px;font-size:.9rem;font-weight:700;color:${C.navy};background:#f4f8ff;border:1.5px solid ${C.line};border-radius:999px;cursor:pointer;}
  .ftlab-chip:hover{background:#e2ecff;border-color:${C.accent};}
  .ftlab-stage{margin:14px 0 4px;padding:12px;background:#f8fbff;border:1px solid ${C.line};border-radius:14px;overflow-x:auto;}
  .ftlab-tree{display:flex;justify-content:center;}
  .ftlab-pair{display:flex;flex-wrap:wrap;gap:14px;justify-content:center;}
  .ftlab-col{flex:1 1 220px;min-width:200px;display:flex;flex-direction:column;align-items:center;gap:6px;}
  .ftlab-col-label{font-family:"Outfit",system-ui,sans-serif;font-weight:800;color:${C.navy};font-size:1.05rem;}
  .ftlab-col-eqn{font-weight:700;color:${C.compInk};font-size:.95rem;}
  .ftlab-result{margin-top:12px;text-align:center;}
  .ftlab-eqn{display:flex;flex-direction:column;gap:2px;align-items:center;}
  .ftlab-eqn-line{font-family:"Outfit",system-ui,sans-serif;font-weight:800;font-size:1.15rem;color:${C.navy};}
  .ftlab-eqn-exp{color:${C.primeStroke};font-size:1.05rem;}
  .ftlab-answer{font-family:"Outfit",system-ui,sans-serif;font-weight:900;font-size:1.3rem;color:${C.primeStroke};}
  .ftlab-explain{margin:6px auto 0;max-width:520px;color:${C.ink};font-size:.92rem;line-height:1.5;}
  .ftlab-legend{display:flex;flex-wrap:wrap;gap:10px 16px;justify-content:center;margin-top:8px;font-size:.8rem;color:${C.muted};}
  .ftlab-key{display:inline-flex;align-items:center;gap:5px;}
  .ftlab-key::before{content:"";width:12px;height:12px;border-radius:50%;border:2px solid;}
  .ftlab-key.is-comp::before{background:${C.compFill};border-color:${C.compStroke};}
  .ftlab-key.is-prime::before{background:${C.primeFill};border-color:${C.primeStroke};}
  .ftlab-tag{font-weight:800;padding:1px 8px;border-radius:999px;}
  .ftlab-tag.is-prime{background:${C.primeFill};color:${C.primeInk};}
  /* Build-in motion: root pops in, children spring in from their parent with a
     spring ease, connectors fade in after their child lands. "backwards" fill
     hides elements during their inline delay, then releases all styles. */
  .ftlab-tree svg .ftlab-node-in{transform-box:fill-box;transform-origin:center;animation:ftlab-node-in .5s cubic-bezier(.34,1.56,.64,1) backwards;}
  @keyframes ftlab-node-in{from{transform:translateY(-12px) scale(.3);opacity:0;}to{transform:translateY(0) scale(1);opacity:1;}}
  .ftlab-tree svg .ftlab-line-in{animation:ftlab-line-in .3s ease backwards;}
  @keyframes ftlab-line-in{from{opacity:0;}to{opacity:1;}}
  @media (prefers-reduced-motion:reduce){.ftlab-tree svg .ftlab-node-in,.ftlab-tree svg .ftlab-line-in{animation:none;}}
  @media (max-width:480px){.ftlab-field input{width:80px;}}
  `;
  document.head.appendChild(s);
}

export default renderFactorTree;

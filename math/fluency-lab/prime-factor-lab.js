// Dynamic Prime Sieve & Factor Tree Laboratory (Grades 4–7 Number Sense)
// Interactive branching factor trees, prime factorization leaves, and Venn diagram GCF/LCM calculation.

const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export function getPrimeFactorization(num) {
  let n = num;
  const factors = [];
  let d = 2;
  while (d * d <= n) {
    while (n % d === 0) {
      factors.push(d);
      n /= d;
    }
    d++;
  }
  if (n > 1) factors.push(n);
  return factors;
}

export function computeGcfLcm(a, b) {
  const fA = getPrimeFactorization(a);
  const fB = getPrimeFactorization(b);

  const shared = [];
  const onlyA = [...fA];
  const onlyB = [];

  fB.forEach((factor) => {
    const idx = onlyA.indexOf(factor);
    if (idx !== -1) {
      shared.push(factor);
      onlyA.splice(idx, 1);
    } else {
      onlyB.push(factor);
    }
  });

  const gcf = shared.reduce((acc, val) => acc * val, 1);
  const lcm = (a * b) / gcf;

  return { shared, onlyA, onlyB, gcf, lcm };
}

export function renderPrimeFactorLab(state = {}) {
  const {
    targetNum = 36,
    numA = 24,
    numB = 36,
    tab = "tree", // "tree", "venn", "sieve"
  } = state;

  const primes = getPrimeFactorization(targetNum);
  const { shared, onlyA, onlyB, gcf, lcm } = computeGcfLcm(numA, numB);

  // Tree representation for targetNum (e.g. 36 -> 6 x 6 -> (2x3) x (2x3))
  let treeSvg = "";
  if (targetNum === 36) {
    treeSvg = `
      <!-- Level 0 (Root) -->
      <circle cx="190" cy="30" r="18" fill="#1e293b"/>
      <text x="190" y="35" text-anchor="middle" font-size="13" font-weight="900" fill="#ffffff">36</text>

      <!-- Branches to Level 1 -->
      <line x1="178" y1="45" x2="110" y2="85" stroke="#94a3b8" stroke-width="2"/>
      <line x1="202" y1="45" x2="270" y2="85" stroke="#94a3b8" stroke-width="2"/>

      <!-- Level 1 (Branches: 6 and 6) -->
      <circle cx="110" cy="95" r="16" fill="#475569"/>
      <text x="110" y="100" text-anchor="middle" font-size="12" font-weight="800" fill="#ffffff">6</text>

      <circle cx="270" cy="95" r="16" fill="#475569"/>
      <text x="270" y="100" text-anchor="middle" font-size="12" font-weight="800" fill="#ffffff">6</text>

      <!-- Branches to Level 2 (Prime Leaves) -->
      <line x1="100" y1="110" x2="70" y2="150" stroke="#94a3b8" stroke-width="2"/>
      <line x1="120" y1="110" x2="150" y2="150" stroke="#94a3b8" stroke-width="2"/>
      <line x1="260" y1="110" x2="230" y2="150" stroke="#94a3b8" stroke-width="2"/>
      <line x1="280" y1="110" x2="310" y2="150" stroke="#94a3b8" stroke-width="2"/>

      <!-- Prime Leaves (Circled in Emerald Green) -->
      <circle cx="70" cy="165" r="15" fill="#10b981" stroke="#047857" stroke-width="2"/>
      <text x="70" y="170" text-anchor="middle" font-size="12" font-weight="900" fill="#ffffff">2</text>

      <circle cx="150" cy="165" r="15" fill="#10b981" stroke="#047857" stroke-width="2"/>
      <text x="150" y="170" text-anchor="middle" font-size="12" font-weight="900" fill="#ffffff">3</text>

      <circle cx="230" cy="165" r="15" fill="#10b981" stroke="#047857" stroke-width="2"/>
      <text x="230" y="170" text-anchor="middle" font-size="12" font-weight="900" fill="#ffffff">2</text>

      <circle cx="310" cy="165" r="15" fill="#10b981" stroke="#047857" stroke-width="2"/>
      <text x="310" y="170" text-anchor="middle" font-size="12" font-weight="900" fill="#ffffff">3</text>
    `;
  } else {
    // Dynamic horizontal prime chain
    treeSvg = `
      <circle cx="190" cy="45" r="20" fill="#1e293b"/>
      <text x="190" y="51" text-anchor="middle" font-size="14" font-weight="900" fill="#ffffff">${targetNum}</text>
      <text x="190" y="100" text-anchor="middle" font-size="12" font-weight="700" fill="#64748b">Prime Factors:</text>
      ${primes.map((p, i) => {
        const px = 190 + (i - (primes.length - 1) / 2) * 44;
        return `
          <circle cx="${px}" cy="140" r="16" fill="#10b981" stroke="#047857" stroke-width="2"/>
          <text x="${px}" y="145" text-anchor="middle" font-size="12" font-weight="900" fill="#ffffff">${p}</text>
          ${i < primes.length - 1 ? `<text x="${px + 22}" y="145" text-anchor="middle" font-size="13" font-weight="900" fill="#475569">×</text>` : ""}
        `;
      }).join("")}
    `;
  }

  // Venn diagram SVG
  const vennSvg = `
    <!-- Circle A -->
    <circle cx="150" cy="100" r="75" fill="rgba(59, 130, 246, 0.15)" stroke="#3b82f6" stroke-width="2"/>
    <text x="100" y="45" font-size="12" font-weight="800" fill="#1e40af">Factors of ${numA}</text>
    <text x="110" y="105" text-anchor="middle" font-size="12" font-weight="800" fill="#1e40af">${onlyA.join(", ") || "—"}</text>

    <!-- Circle B -->
    <circle cx="230" cy="100" r="75" fill="rgba(16, 185, 129, 0.15)" stroke="#10b981" stroke-width="2"/>
    <text x="280" y="45" text-anchor="end" font-size="12" font-weight="800" fill="#065f46">Factors of ${numB}</text>
    <text x="270" y="105" text-anchor="middle" font-size="12" font-weight="800" fill="#065f46">${onlyB.join(", ") || "—"}</text>

    <!-- Overlap / GCF Area -->
    <text x="190" y="85" text-anchor="middle" font-size="10" font-weight="800" fill="#b45309">Shared Primes</text>
    <text x="190" y="110" text-anchor="middle" font-size="14" font-weight="900" fill="#92400e">${shared.join(" × ") || "1"}</text>
  `;

  return `
    <div class="prime-lab-wrap" data-prime-root="true" data-target="${targetNum}" data-a="${numA}" data-b="${numB}" data-tab="${tab}">
      <div class="coord-header">
        <span class="coord-title">🌳 Prime Factor &amp; GCF / LCM Laboratory</span>
        <div class="coord-badges">
          ${tab === "tree" ? `
            <span class="coord-badge" style="background:#ecfdf5; color:#065f46; font-weight:800">
              ${targetNum} = ${primes.join(" × ")}
            </span>
          ` : `
            <span class="coord-badge" style="background:#fef3c7; color:#92400e; font-weight:800">GCF(${numA}, ${numB}) = ${gcf}</span>
            <span class="coord-badge" style="background:#eff6ff; color:#1e40af; font-weight:800">LCM(${numA}, ${numB}) = ${lcm}</span>
          `}
        </div>
      </div>

      <div class="expl-nav-bar" role="tablist">
        <button type="button" class="expl-step-pill ${tab === "tree" ? "is-active" : ""}" data-prime-tab="tree">🌳 Branching Factor Tree</button>
        <button type="button" class="expl-step-pill ${tab === "venn" ? "is-active" : ""}" data-prime-tab="venn">⭕ Venn Diagram (GCF &amp; LCM)</button>
      </div>

      <div class="coord-stage-box" style="height:210px">
        <svg viewBox="0 0 380 200" role="img" aria-label="Prime factor diagram">
          ${tab === "tree" ? treeSvg : vennSvg}
        </svg>
      </div>

      <div class="coord-controls-row">
        ${tab === "tree" ? `
          <button type="button" class="coord-btn" data-tree-target="24">Tree: 24</button>
          <button type="button" class="coord-btn" data-tree-target="36">Tree: 36</button>
          <button type="button" class="coord-btn" data-tree-target="48">Tree: 48</button>
          <button type="button" class="coord-btn" data-tree-target="72">Tree: 72</button>
        ` : `
          <button type="button" class="coord-btn" data-venn-pair="12:18">Pair 12 &amp; 18</button>
          <button type="button" class="coord-btn" data-venn-pair="24:36">Pair 24 &amp; 36</button>
          <button type="button" class="coord-btn" data-venn-pair="15:25">Pair 15 &amp; 25</button>
        `}
      </div>
    </div>
  `;
}

export function mountPrimeFactorLab(container, onChange) {
  if (!container) return;
  const root = container.matches("[data-prime-root]") ? container : container.querySelector("[data-prime-root]");
  if (!root) return;

  let targetNum = Number(root.dataset.target) || 36;
  let numA = Number(root.dataset.a) || 24;
  let numB = Number(root.dataset.b) || 36;
  let tab = root.dataset.tab || "tree";

  const update = () => {
    root.outerHTML = renderPrimeFactorLab({ targetNum, numA, numB, tab });
    const updated = container.querySelector("[data-prime-root]") || container;
    mountPrimeFactorLab(updated, onChange);
    if (onChange) onChange({ targetNum, numA, numB, tab });
  };

  root.querySelectorAll("[data-prime-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      tab = btn.dataset.primeTab;
      update();
    });
  });

  root.querySelectorAll("[data-tree-target]").forEach((btn) => {
    btn.addEventListener("click", () => {
      targetNum = Number(btn.dataset.treeTarget);
      update();
    });
  });

  root.querySelectorAll("[data-venn-pair]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [a, b] = btn.dataset.vennPair.split(":").map(Number);
      numA = a;
      numB = b;
      update();
    });
  });
}

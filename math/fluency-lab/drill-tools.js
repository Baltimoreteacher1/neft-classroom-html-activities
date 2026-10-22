// The Math Tool Drawer's eleven tools as pure renderers: (state, ctx) -> html. No DOM, no globals, so they can
// be tested with plain node. `ctx.locked` is true while the learner is still working the problem the drawer was
// loaded with; a locked tool shows what the learner builds and the givens, never a total, product, net value,
// unit rate or solved value that the learner has not worked out. Free play ("Try your own numbers") is unlocked.
import { t } from "./i18n.js";
import { columnSpec, verticalHtml } from "./vertical-columns.js";

const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const fmt = (n) => Number(n.toFixed(2)).toLocaleString("en-US", { maximumFractionDigits: 2 });
const asked = (value) =>
  `<span class="tool-hidden" title="${esc(t("You work this out"))}">?</span>${value === undefined ? "" : ""}`;

export const defaults = () => ({
  nl: { min: 0, max: 20, step: 1, pos: 5 },
  vertical: { op: "+", terms: ["478", "256"] },
  tenFrame: 0,
  mult: { row: 6, col: 7 },
  balance: { lx: 1, lc: 3, rv: 9, rvText: "" },
  ints: { pos: 5, neg: 3, note: "" },
  dnl: { step: 2, a: 35, b: 1, labelA: "Miles", labelB: "Hours" },
  pizza: { slices: 8, eaten: [0, 1, 2] },
  split: { target: 14, left: 10, right: 4, times: 0 },
  tape: {
    a: 3,
    b: 2,
    unit: 5,
    mode: "unit",
    total: 40,
    diff: 4,
    labelA: "Apples",
    labelB: "Oranges",
  },
  div: { dividend: 432, divisor: 12 },
  denominators: [],
});

// Plain number line for placing a number: click a tick or type a number. No jumps, no hop sizes.
function numberline(s) {
  const { min, max, step, pos } = s.nl;
  const x = (v) => 25 + ((v - min) / (max - min)) * 360;
  const ticks = Array.from({ length: 21 }, (_, i) => {
    const v = min + i * step;
    return `<g class="nl-tick" data-val="${v}" style="cursor:pointer">
      <line x1="${x(v)}" y1="35" x2="${x(v)}" y2="24" stroke="#64748b" stroke-width="1.5"/>
      <text x="${x(v)}" y="52" text-anchor="middle" font-size="9" font-weight="600" fill="#475569">${fmt(v)}</text>
    </g>`;
  }).join("");
  const at = Math.max(min, Math.min(max, pos));
  const marker = `<line x1="${x(at)}" y1="35" x2="${x(at)}" y2="10" stroke="#17345f" stroke-width="3"/><circle cx="${x(at)}" cy="10" r="5" fill="#17345f"/>`;
  return `<div class="tool-content">
    <div class="tool-controls">
      <span>${esc(t("Marker at"))}: <strong>${fmt(pos)}</strong></span>
      <label>${esc(t("Place the marker at"))} <input type="number" id="nl-in" value="${pos}" style="width:90px" aria-label="${esc(t("Number to place on the line"))}"/></label>
      <button type="button" class="mini-tool-btn" data-nl-place>${esc(t("Place"))}</button>
    </div>
    <p class="tool-note">${esc(t("Click a tick or type a number to place the marker."))}</p>
    <svg width="100%" height="68" viewBox="0 0 420 68" style="background:#ffffff; border-radius:8px; border:1px solid #cbd5e1" role="img" aria-label="${esc(t("Number line from {min} to {max}", { min: fmt(min), max: fmt(max) }))}">
      <line x1="15" y1="35" x2="400" y2="35" stroke="#1e293b" stroke-width="2"/>
      <polygon points="405,35 397,31 397,39" fill="#1e293b"/>
      ${ticks}${marker}
    </svg>
  </div>`;
}

// Stacked columns for adding and subtracting: the problem's numbers by place value, empty boxes to fill.
function vertical(s) {
  const { op, terms } = s.vertical;
  const spec = columnSpec(op, terms);
  return `<div class="tool-content">
    <div class="tool-controls">
      <span>${esc(t("Column Method"))}</span>
      <input type="text" id="vc-in-a" value="${esc(terms[0])}" style="width:90px" aria-label="${esc(t("Top number"))}" inputmode="decimal"/>
      <button type="button" class="mini-tool-btn ${op === "+" ? "active" : ""}" data-vc-op="+">+</button>
      <button type="button" class="mini-tool-btn ${op === "-" ? "active" : ""}" data-vc-op="-">−</button>
      <input type="text" id="vc-in-b" value="${esc(terms[1])}" style="width:90px" aria-label="${esc(t("Bottom number"))}" inputmode="decimal"/>
      <button type="button" class="mini-tool-btn" data-vc-set>${esc(t("Set"))}</button>
    </div>
    ${spec ? verticalHtml(spec) : `<p class="tool-note">${esc(t("Use whole numbers or decimals. For subtraction the top number is the larger one."))}</p>`}
  </div>`;
}

function tenframe(s, ctx) {
  const count = s.tenFrame;
  const slots = Array.from({ length: 20 }, (_, i) => {
    const filled = i < count;
    return `<div class="tf-slot ${filled ? (i < 10 ? "red" : "blue") : "empty"}" data-slot="${i}" role="button" aria-label="Slot ${i + 1} ${filled ? "filled" : "empty"}" tabindex="0">${filled ? '<span class="counter-dot"></span>' : ""}</div>`;
  });
  const tally = ctx.locked
    ? esc(t("Counters: count them yourself"))
    : `Counters: <strong>${count} of 20</strong>`;
  return `<div class="tool-content">
    <div class="tool-controls"><span>${tally}</span>
      <button type="button" class="mini-tool-btn" data-tf-add="1">+1</button>
      <button type="button" class="mini-tool-btn" data-tf-sub="1">−1</button>
      <button type="button" class="mini-tool-btn" data-tf-clear>Clear</button></div>
    <div class="ten-frame-double-grid">
      <div class="ten-frame-box" aria-label="First Ten-Frame">${slots.slice(0, 10).join("")}</div>
      <div class="ten-frame-box" aria-label="Second Ten-Frame">${slots.slice(10, 20).join("")}</div>
    </div>
  </div>`;
}

function multigrid(s, ctx) {
  const { row: r, col: c } = s.mult;
  const rows = Array.from({ length: 10 }, (_, ri) => {
    const rowNum = ri + 1;
    const cells = Array.from({ length: 10 }, (_, ci) => {
      const colNum = ci + 1;
      const active = rowNum <= r && colNum <= c;
      const target = rowNum === r && colNum === c;
      const label = ctx.locked ? "" : rowNum * colNum;
      const title = ctx.locked
        ? `${rowNum} × ${colNum}`
        : `${rowNum} × ${colNum} = ${rowNum * colNum}`;
      return `<button type="button" class="mg-cell ${active ? "active" : ""} ${target && !ctx.locked ? "target" : ""}" data-row="${rowNum}" data-col="${colNum}" title="${title}">${label}</button>`;
    }).join("");
    return `<div class="mg-row"><span class="mg-head">${rowNum}</span>${cells}</div>`;
  }).join("");
  const head = `<div class="mg-row head-row"><span>×</span>${Array.from({ length: 10 }, (_, i) => `<span>${i + 1}</span>`).join("")}</div>`;
  const label = ctx.locked ? `${r} × ${c}` : `${r} × ${c} = ${r * c}`;
  return `<div class="tool-content">
    <div class="tool-controls"><span>${esc(t("Current Array"))}: <strong>${label}</strong></span></div>
    <div class="mult-grid-table">${head}${rows}</div>
  </div>`;
}

const WALL = [1, 2, 3, 4, 5, 6, 8, 10, 12];
function fractions(s) {
  const marked = new Set(s.denominators);
  const denoms = [...new Set([...WALL, ...s.denominators])].sort((a, b) => a - b);
  const rows = denoms
    .map((d) => {
      const parts = Array.from(
        { length: d },
        () => `<div class="fw-part" style="width:${100 / d}%">1/${d}</div>`,
      ).join("");
      return `<div class="fw-row${marked.has(d) ? " fw-yours" : ""}" aria-label="Denominator ${d}"><span class="fw-label">1/${d}${marked.has(d) ? " ★" : ""}</span><div class="fw-strip">${parts}</div></div>`;
    })
    .join("");
  const note = marked.size ? ` · ${esc(t("★ marks the strips your problem uses"))}` : "";
  return `<div class="tool-content"><div class="tool-controls"><span>${esc(t("Fraction Strips Wall · Compare equivalent lengths"))}${note}</span></div><div class="fraction-wall-container">${rows}</div></div>`;
}

// A locked balance never works out a number: the pan shows the sum the learner still has to do.
function balance(s, ctx) {
  const { lx, lc, rv, rvText } = s.balance;
  const compact = lx > 5 || Math.abs(lc) > 12 || Math.abs(rv) > 16 || rvText;
  const solved = lx === 1 && lc === 0;
  const right = rvText || String(rv);
  const leftText = `${lx > 1 ? lx : ""}x${lc ? (lc > 0 ? ` + ${lc}` : ` − ${Math.abs(lc)}`) : ""}`;
  const xBoxes = compact
    ? `<g transform="translate(40,0)"><rect x="0" y="0" width="${lx > 1 ? 34 : 18}" height="18" rx="3" fill="#2563eb"/><text x="${lx > 1 ? 17 : 9}" y="13" text-anchor="middle" font-size="11" font-weight="900" fill="#fff">${lx > 1 ? lx : ""}x</text></g>`
    : Array.from(
        { length: lx },
        (_, i) =>
          `<g transform="translate(${40 + i * 22},0)"><rect width="18" height="18" rx="3" fill="#2563eb" stroke="#1d4ed8" stroke-width="1.5"/><text x="9" y="13" text-anchor="middle" font-size="11" font-weight="900" fill="#fff">x</text></g>`,
      ).join("");
  const constBadge = (n, color, x, y) =>
    `<g transform="translate(${x},${y})"><rect width="${String(n).length * 8 + 14}" height="16" rx="3" fill="${color}"/><text x="${(String(n).length * 8 + 14) / 2}" y="12" text-anchor="middle" font-size="10" font-weight="800" fill="#1f2937">${esc(n)}</text></g>`;
  const leftConst = !lc
    ? ""
    : compact || Math.abs(lc) > 12
      ? constBadge(lc > 0 ? `+ ${lc}` : `− ${Math.abs(lc)}`, "#fde68a", 80 + (lx > 1 ? 20 : 0), 1)
      : Array.from(
          { length: Math.abs(lc) },
          (_, i) =>
            `<g transform="translate(${40 + lx * 22 + i * 16},2)"><rect width="14" height="14" rx="2" fill="${lc > 0 ? "#eab308" : "#f87171"}" stroke="#ca8a04" stroke-width="1.5"/><text x="7" y="11" text-anchor="middle" font-size="9" font-weight="800" fill="#713f12">${lc > 0 ? 1 : "−"}</text></g>`,
        ).join("");
  const rightPile =
    compact || rv < 0
      ? constBadge(right, "#bbf7d0", 255, 0)
      : Array.from(
          { length: rv },
          (_, i) =>
            `<g transform="translate(${250 + (i % 8) * 16},${Math.floor(i / 8) * 16})"><rect width="14" height="14" rx="2" fill="#22c55e" stroke="#16a34a" stroke-width="1.5"/><text x="7" y="11" text-anchor="middle" font-size="9" font-weight="800" fill="#14253d">1</text></g>`,
        ).join("");
  const status = solved
    ? `🎉 x = ${esc(right)}${rvText ? ` — ${esc(t("now work out the number"))}` : ""}`
    : `${esc(t("Equation"))}: <strong>${esc(leftText)} = ${esc(right)}</strong>`;
  const both = lc
    ? `<button type="button" class="mini-tool-btn" data-bal-sub-both>${lc > 0 ? esc(t("Subtract {n} from both sides", { n: lc })) : esc(t("Add {n} to both sides", { n: Math.abs(lc) }))}</button>`
    : "";
  const canDivide = lx > 1 && lc === 0 && (ctx.locked || Number(rv) % lx === 0);
  return `<div class="tool-content balance-container">
    <div class="tool-controls" style="flex-wrap:wrap; gap:0.5rem">
      <span class="balance-status-badge ${solved ? "balanced" : "unbalanced"}">${status}</span>
      <button type="button" class="mini-tool-btn" data-bal-add-x="1">+1 x</button>
      <button type="button" class="mini-tool-btn" data-bal-sub-x="1" ${lx <= 1 ? "disabled" : ""}>−1 x</button>
      <button type="button" class="mini-tool-btn" data-bal-add-lc="1">+1 Left</button>
      <button type="button" class="mini-tool-btn" data-bal-sub-lc="1">−1 Left</button>
      ${both}
      ${canDivide ? `<button type="button" class="mini-tool-btn" data-bal-div-both="1" style="background:#dcfce7; color:#15803d; border-color:#86efac; font-weight:700">${esc(t("Divide both sides by {n}", { n: lx }))}</button>` : ""}
      <button type="button" class="mini-tool-btn" data-bal-reset>Reset</button>
    </div>
    <svg width="100%" height="110" viewBox="0 0 420 110" style="background:#f8fafc; border-radius:8px; border:1px solid #cbd5e1" role="img" aria-label="${esc(t("Pan balance showing {eq}", { eq: `${leftText} = ${right}` }))}">
      <polygon points="210,50 198,85 222,85" fill="#475569"/><rect x="180" y="85" width="60" height="6" rx="2" fill="#334155"/>
      <line x1="30" y1="50" x2="390" y2="50" stroke="#0f172a" stroke-width="4" stroke-linecap="round"/><circle cx="210" cy="50" r="5" fill="#0f172a"/>
      <rect x="35" y="78" width="130" height="6" rx="3" fill="#0284c7"/><rect x="255" y="78" width="130" height="6" rx="3" fill="#0284c7"/>
      <g transform="translate(0,58)">${xBoxes}${leftConst}</g><g transform="translate(0,50)">${rightPile}</g>
      <text x="100" y="102" text-anchor="middle" font-size="11" font-weight="700" fill="#1e293b">Left: ${esc(leftText)}</text>
      <text x="320" y="102" text-anchor="middle" font-size="11" font-weight="700" fill="#1e293b">Right: ${esc(right)}</text>
    </svg>
  </div>`;
}

function integers(s, ctx) {
  const { pos, neg, note } = s.ints;
  const net = pos - neg;
  const pairs = Math.min(pos, neg);
  const pairsHtml = Array.from(
    { length: pairs },
    () =>
      `<div class="chip-zero-pair" title="Zero Pair: (+1) + (-1) = 0"><div class="chip-circle pos">+</div><div class="chip-circle neg">−</div><span style="font-size:0.75rem; font-weight:800; color:#15803d; margin-left:2px">= 0</span></div>`,
  ).join("");
  const chips = (n, cls, sign) =>
    Array.from({ length: n }, () => `<div class="chip-circle ${cls}">${sign}</div>`).join("");
  const netHtml = ctx.locked
    ? asked()
    : `<strong style="font-size:1.1rem; color:${net > 0 ? "#2563eb" : net < 0 ? "#dc2626" : "#15803d"}">${net > 0 ? "+" + net : net}</strong>`;
  return `<div class="tool-content chips-mat-container">
    <div class="tool-controls" style="flex-wrap:wrap; gap:0.5rem">
      <span>${esc(t("Net Value"))}: ${netHtml}</span>
      <span style="color:#64748b; font-size:0.85rem">(${pos} positive, ${neg} negative · ${pairs} zero pair${pairs === 1 ? "" : "s"})</span>
      <button type="button" class="mini-tool-btn" data-int-add-pos="+1">+1 (+)</button>
      <button type="button" class="mini-tool-btn" data-int-sub-pos="1" ${pos <= 0 ? "disabled" : ""}>−1 (+)</button>
      <button type="button" class="mini-tool-btn" data-int-add-neg="+1">+1 (−)</button>
      <button type="button" class="mini-tool-btn" data-int-sub-neg="1" ${neg <= 0 ? "disabled" : ""}>−1 (−)</button>
      <button type="button" class="mini-tool-btn" data-int-add-pair>+ Zero Pair</button>
      <button type="button" class="mini-tool-btn" data-int-cancel-pairs ${pairs <= 0 ? "disabled" : ""}>Cancel Zero Pairs</button>
      <button type="button" class="mini-tool-btn" data-int-clear>Clear</button>
    </div>
    ${note ? `<p class="tool-note">${esc(note)}</p>` : ""}
    <div class="chips-board" aria-label="Integer chip workspace">
      ${pos === 0 && neg === 0 ? `<span style="color:#94a3b8; font-size:0.9rem; margin:auto">Click buttons above to add positive (+) or negative (−) chips</span>` : ""}
      ${pairsHtml}${chips(pos - pairs, "pos", "+")}${chips(neg - pairs, "neg", "−")}
    </div>
  </div>`;
}

// Double number line. A locked line shows the givens and the multiplier for every other tick ("3 × 9"), never the product.
function doublenumberline(s, ctx) {
  const { step, a, b, labelA, labelB } = s.dnl;
  const val = (base, i) => {
    if (!ctx.locked || i <= 1) return fmt(i * base);
    return `${i} × ${fmt(base)}`;
  };
  const ticks = [];
  const links = [];
  for (let i = 0; i <= 5; i += 1) {
    const x = 35 + i * 70;
    const on = i === step;
    const color = on ? "#2563eb" : "#475569";
    ticks.push(
      `<g class="dnl-tick" data-dnl-step="${i}" style="cursor:pointer"><line x1="${x}" y1="28" x2="${x}" y2="38" stroke="${color}" stroke-width="${on ? 3 : 1.5}"/><text x="${x}" y="22" text-anchor="middle" font-size="${on ? 11 : 9}" font-weight="${on ? 900 : 600}" fill="${color}">${esc(val(a, i))}</text></g>`,
    );
    ticks.push(
      `<g class="dnl-tick" data-dnl-step="${i}" style="cursor:pointer"><line x1="${x}" y1="72" x2="${x}" y2="82" stroke="${color}" stroke-width="${on ? 3 : 1.5}"/><text x="${x}" y="96" text-anchor="middle" font-size="${on ? 11 : 9}" font-weight="${on ? 900 : 600}" fill="${color}">${esc(val(b, i))}</text></g>`,
    );
    if (i > 0)
      links.push(
        `<line x1="${x}" y1="38" x2="${x}" y2="72" stroke="${on ? "#2563eb" : "#cbd5e1"}" stroke-width="${on ? 2.5 : 1}" ${on ? "" : 'stroke-dasharray="3,3"'}/>`,
      );
  }
  const unit = ctx.locked
    ? esc(t("Which number do you multiply the first pair by to reach the one you need?"))
    : `📐 Unit Rate: <strong>${fmt(a)} ${esc(labelA)}</strong> per <strong>${fmt(b)} ${esc(labelB)}</strong> (k = ${fmt(a / b)})`;
  const now = ctx.locked
    ? `${fmt(a)} ${esc(labelA)} : ${fmt(b)} ${esc(labelB)} (×1)`
    : `${fmt(step * a)} ${esc(labelA)} in ${fmt(step * b)} ${esc(labelB)}`;
  return `<div class="tool-content dnl-tool-container">
    <div class="tool-controls" style="flex-wrap:wrap; gap:0.5rem; align-items:center">
      <span>Rate: <strong>${now}</strong></span>
      <span style="color:#64748b">| Multipliers:</span>
      ${[1, 2, 3, 4, 5].map((m) => `<button type="button" class="mini-tool-btn ${step === m ? "active" : ""}" data-dnl-set-step="${m}">×${m}</button>`).join("")}
      <span style="color:#64748b">| Presets:</span>
      <button type="button" class="mini-tool-btn" data-dnl-preset="speed">🚗 35 mph</button>
      <button type="button" class="mini-tool-btn" data-dnl-preset="cost">💵 $4.50 / Item</button>
      <button type="button" class="mini-tool-btn" data-dnl-preset="percent">📊 25% of 100</button>
      <button type="button" class="mini-tool-btn" data-dnl-preset="recipe">🥣 3:2 Recipe</button>
    </div>
    <svg width="100%" height="110" viewBox="0 0 420 110" style="background:#ffffff; border-radius:8px; border:1px solid #cbd5e1; margin-top:6px" role="img" aria-label="Double Number Line for ${esc(labelA)} and ${esc(labelB)}">
      <line x1="20" y1="33" x2="395" y2="33" stroke="#1e293b" stroke-width="2"/><polygon points="400,33 392,29 392,37" fill="#1e293b"/>
      <text x="25" y="12" font-size="10" font-weight="800" fill="#2563eb">${esc(labelA)}</text>
      <line x1="20" y1="77" x2="395" y2="77" stroke="#1e293b" stroke-width="2"/><polygon points="400,77 392,73 392,81" fill="#1e293b"/>
      <text x="25" y="108" font-size="10" font-weight="800" fill="#059669">${esc(labelB)}</text>
      ${links.join("")}${ticks.join("")}
    </svg>
    <div class="dnl-rate-card" style="margin-top:8px; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:8px; padding:8px 12px; font-size:0.85rem; color:#334155">${unit}</div>
  </div>`;
}

function pizza(s, ctx) {
  const n = s.pizza.slices;
  const eaten = s.pizza.eaten;
  const r = 52;
  const [cx, cy] = [210, 60];
  const slices = Array.from({ length: n }, (_, i) => {
    const a1 = (i * 2 * Math.PI) / n - Math.PI / 2;
    const a2 = ((i + 1) * 2 * Math.PI) / n - Math.PI / 2;
    const on = eaten.includes(i);
    const mid = (a1 + a2) / 2;
    return `<g class="pizza-slice-path" data-slice="${i}" role="button" aria-label="Slice ${i + 1} of ${n} ${on ? "shaded" : "not shaded"}">
      <path d="M ${cx},${cy} L ${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)} A ${r},${r} 0 0,1 ${cx + r * Math.cos(a2)},${cy + r * Math.sin(a2)} Z" fill="${on ? "#fed7aa" : "#f1f5f9"}" stroke="${on ? "#ea580c" : "#94a3b8"}" stroke-width="${on ? 2 : 1.5}" ${on ? "" : 'stroke-dasharray="3,3"'}/>
      ${on ? `<circle cx="${cx + r * 0.6 * Math.cos(mid)}" cy="${cy + r * 0.6 * Math.sin(mid)}" r="3.5" fill="#dc2626"/>` : ""}</g>`;
  }).join("");
  const tally = ctx.locked
    ? esc(t("Shaded slices: count them yourself"))
    : `Pizza Slices: <strong style="font-size:1.1rem; color:#ea580c">${eaten.length}/${n} Eaten</strong> (${n - eaten.length}/${n} Remaining)`;
  return `<div class="tool-content pizza-tool-container">
    <div class="tool-controls" style="flex-wrap:wrap; gap:0.5rem">
      <span>${tally}</span>
      <span style="color:#64748b">| Slices:</span>
      ${[2, 3, 4, 5, 6, 7, 8, 9, 10, 12].map((c) => `<button type="button" class="mini-tool-btn ${c === n ? "active" : ""}" data-pizza-set="${c}">${c}</button>`).join("")}
      <button type="button" class="mini-tool-btn" data-pizza-eat-one>+1 Shade</button>
      <button type="button" class="mini-tool-btn" data-pizza-reset>Reset</button>
    </div>
    <svg width="100%" height="120" viewBox="0 0 420 120" style="background:#ffffff; border-radius:8px; border:1px solid #cbd5e1" role="img" aria-label="Pizza Fraction Slicer, ${n} slices">
      <circle cx="${cx}" cy="${cy}" r="${r + 5}" fill="#fde68a" stroke="#d97706" stroke-width="3"/>${slices}
    </svg>
  </div>`;
}

function splitter(s) {
  const { target: t0, left: l, right: r, times } = s.split;
  const max = Math.max(2, t0 - 1);
  const times$ = times
    ? `<p class="tool-note">${esc(t("Now multiply each part by {n}, then put the two products together.", { n: times }))}</p>`
    : "";
  return `<div class="tool-content splitter-tool-container">
    <div class="tool-controls" style="flex-wrap:wrap; gap:0.5rem">
      <span>Decompose: <strong>${t0} = ${l} + ${r}</strong></span>
      ${[14, 25, 48, 85].map((n) => `<button type="button" class="mini-tool-btn" data-split-preset="${n}">${n}</button>`).join("")}
      <button type="button" class="mini-tool-btn" data-split-mode="tens">Tens &amp; Ones</button>
      <button type="button" class="mini-tool-btn" data-split-mode="halves">Half &amp; Half</button>
    </div>
    ${times$}
    <div style="display:flex; flex-direction:column; align-items:center; gap:0.75rem; padding:0.5rem">
      <div class="splitter-bubble target" title="Target Number">${t0}</div>
      <div style="font-size:1.1rem; color:#64748b; font-weight:800">↓ ✂️ Decompose ↓</div>
      <div style="display:flex; align-items:center; gap:1.2rem">
        <div class="splitter-bubble left">${l}</div><span style="font-size:1.4rem; font-weight:900; color:#334155">+</span>
        <div class="splitter-bubble right">${r}</div><span style="font-size:1.4rem; font-weight:900; color:#334155">=</span>
        <span style="font-size:1.3rem; font-weight:900; color:#0284c7">${t0}</span>
      </div>
      <div style="display:flex; align-items:center; gap:0.5rem; width:100%; max-width:320px">
        <span style="font-size:0.8rem; font-weight:700">1</span>
        <input type="range" class="splitter-slider" min="1" max="${max}" value="${Math.min(l, max)}" style="flex:1" data-split-slider aria-label="${esc(t("Where to split the number"))}"/>
        <span style="font-size:0.8rem; font-weight:700">${max}</span>
      </div>
    </div>
  </div>`;
}

function tape(s, ctx) {
  const { a, b, mode, labelA, labelB } = s.tape;
  let u = s.tape.unit;
  if (mode === "total") u = Math.max(1, Math.round(s.tape.total / (a + b)));
  else if (mode === "diff") u = Math.max(1, Math.round(s.tape.diff / (Math.abs(a - b) || 1)));
  const calc = (x, y) => (ctx.locked ? `${x} × ${y}` : String(x * y));
  const cells = (n, bg, border, color) =>
    Array.from(
      { length: n },
      () =>
        `<div class="tape-cell" style="flex:1; height:36px; display:inline-flex; align-items:center; justify-content:center; background:${bg}; border:1px solid ${border}; border-radius:4px; font-weight:800; color:${color}; font-size:0.95rem">${u}</div>`,
    ).join("");
  const total = ctx.locked ? `(${a} + ${b}) × ${u}` : String((a + b) * u);
  const note = ctx.locked
    ? esc(t("Each block is worth {u}. Work out what each bar is worth.", { u }))
    : mode === "total"
      ? `Total is ${s.tape.total} split into ${a + b} equal units. Each block is ${s.tape.total} ÷ ${a + b} = ${u}.`
      : `Each block represents ${u}. ${labelA} has ${a} blocks (${a * u}) and ${labelB} has ${b} blocks (${b * u}).`;
  const control =
    mode === "unit"
      ? `<span style="color:#64748b">| Box Value:</span>${[1, 2, 5, 10, 12].map((v) => `<button type="button" class="mini-tool-btn ${v === u ? "active" : ""}" data-tape-unit="${v}">${v}</button>`).join("")}`
      : mode === "total"
        ? `<span style="color:#64748b">| Total:</span><input type="number" id="tape-in-total" value="${s.tape.total}" min="${a + b}" step="${a + b}" style="width:60px"/><button type="button" class="mini-tool-btn" id="tape-set-total">Apply Total</button>`
        : `<span style="color:#64748b">| Difference:</span><input type="number" id="tape-in-diff" value="${s.tape.diff}" min="1" style="width:54px"/><button type="button" class="mini-tool-btn" id="tape-set-diff">Apply Diff</button>`;
  return `<div class="tool-content tape-tool-container">
    <div class="tool-controls" style="flex-wrap:wrap; gap:0.5rem; align-items:center">
      <span>Ratio <strong>${a} : ${b}</strong> · Total: <strong>${total}</strong> (1 Box = ${u})</span>
      <span style="color:#64748b">| Presets:</span>
      ${["3:2", "4:1", "5:3", "2:5"].map((p) => `<button type="button" class="mini-tool-btn" data-tape-preset="${p}">${p}</button>`).join("")}
      <span style="color:#64748b">| Mode:</span>
      ${[
        ["unit", "Unit Known"],
        ["total", "Total Known"],
        ["diff", "Difference Known"],
      ]
        .map(
          ([m, label]) =>
            `<button type="button" class="mini-tool-btn ${mode === m ? "active" : ""}" data-tape-mode="${m}">${label}</button>`,
        )
        .join("")}
      ${control}
    </div>
    <div style="display:flex; flex-direction:column; gap:0.75rem; padding:0.75rem; background:#ffffff; border:1px solid #cbd5e1; border-radius:8px; margin-top:8px">
      <div style="display:flex; align-items:center; gap:0.75rem"><strong style="width:75px; font-size:0.9rem; color:#1d4ed8">${esc(labelA)} (${a}):</strong><div style="flex:1; display:flex; gap:4px">${cells(a, "#dbeafe", "#3b82f6", "#1e40af")}</div><strong style="width:75px; text-align:right; font-size:1rem; color:#1d4ed8">${calc(a, u)}</strong></div>
      <div style="display:flex; align-items:center; gap:0.75rem"><strong style="width:75px; font-size:0.9rem; color:#047857">${esc(labelB)} (${b}):</strong><div style="flex:1; display:flex; gap:4px">${cells(b, "#d1fae5", "#10b981", "#065f46")}</div><strong style="width:75px; text-align:right; font-size:1rem; color:#047857">${calc(b, u)}</strong></div>
      <div style="font-size:0.85rem; color:#334155; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:6px; padding:8px 12px">💡 <em>${note}</em></div>
    </div>
  </div>`;
}

export function renderTool(name, s, ctx) {
  const tools = {
    numberline,
    vertical,
    tenframe,
    multigrid,
    fractions,
    balance,
    integers,
    doublenumberline,
    pizza,
    splitter,
    tape,
  };
  if (name === "longdivision") return longdivision(s, ctx);
  return tools[name]?.(s, ctx) ?? "";
}

function longdivision(s, ctx) {
  const { dividend, divisor } = s.div;
  const presets = [
    [
      "1-Digit",
      [
        [84, 3],
        [156, 4],
        [625, 5],
        [782, 6],
      ],
    ],
    [
      "2-Digit",
      [
        [432, 12],
        [750, 25],
        [3840, 16],
      ],
    ],
  ];
  const buttons = presets
    .map(
      ([label, list]) =>
        `<span style="color:#64748b">| ${label}:</span>${list.map(([n, d]) => `<button type="button" class="mini-tool-btn" data-ld-preset="${n}:${d}">${n.toLocaleString("en-US")} ÷ ${d}</button>`).join("")}`,
    )
    .join("");
  return `<div class="tool-content longdivision-tool-container">
    <div class="tool-controls" style="flex-wrap:wrap; gap:0.5rem; align-items:center">
      <span>Problem: <strong>${dividend} ÷ ${divisor}</strong></span>${buttons}
      <span style="color:#64748b">| Custom:</span>
      <input type="number" id="ld-in-divisor" value="${divisor}" min="1" max="999" style="width:54px" title="Divisor"/><span style="font-weight:700">)</span>
      <input type="number" id="ld-in-dividend" value="${dividend}" min="1" max="99999" style="width:72px" title="Dividend"/>
      <button type="button" class="mini-tool-btn" id="ld-btn-load" style="font-weight:700">Set</button>
    </div>
    ${ctx.longDivisionHtml(dividend, divisor, ctx.locked)}
  </div>`;
}

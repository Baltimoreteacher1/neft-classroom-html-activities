// Static, student-facing pictures for the Fact Trail. Each one is drawn from the problem's own
// model data (built in problem-bank.js), so the picture always shows the numbers in the problem.
const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

function tenFrames(model) {
  const frames = Math.max(1, Math.ceil(Math.max(model.target, model.filled, 1) / 10));
  const cells = Array.from({ length: frames * 10 }, (_, i) => {
    let kind = "empty";
    if (i < model.filled) kind = "dot";
    else if (i < model.target)
      kind =
        model.kind === "join" ? "dot-add" : model.kind === "takeAway" ? "dot-gone" : "empty-goal";
    return `<span class="tp-cell ${kind}"></span>`;
  });
  const groups = Array.from(
    { length: frames },
    (_, f) => `<div class="tp-frame">${cells.slice(f * 10, f * 10 + 10).join("")}</div>`,
  ).join("");
  const key =
    model.kind === "join"
      ? `<span><i class="tp-key dot"></i>${model.filled}</span><span><i class="tp-key dot-add"></i>${model.target - model.filled} more</span>`
      : model.kind === "takeAway"
        ? `<span><i class="tp-key dot"></i>${model.filled} left</span><span><i class="tp-key dot-gone"></i>${model.target - model.filled} taken away</span>`
        : `<span><i class="tp-key dot"></i>${model.filled}</span><span><i class="tp-key empty-goal"></i>empty spaces</span>`;
  return `<div class="tp-frames">${groups}</div><p class="tp-key-row">${key}</p>`;
}

function dotArray(model) {
  if (model.a > 12 || model.b > 12) return areaModel(model);
  const rows = Array.from({ length: model.a }, (_, r) => {
    const tone = r < model.split ? "row-a" : "row-b";
    return `<div class="tp-row ${tone}">${Array.from({ length: model.b }, () => `<span class="tp-dot">${model.unit ? model.unit : ""}</span>`).join("")}</div>`;
  }).join("");
  const label = model.unit
    ? `${model.a} rows of ${model.b} tens`
    : `${model.a} row${model.a === 1 ? "" : "s"} of ${model.b}`;
  return `<div class="tp-array${model.unit ? " tens" : ""}" role="img" aria-label="${esc(label)}">${rows}</div><p class="tp-caption">${esc(label)}</p>`;
}

function areaModel(model) {
  const left = model.split;
  const right = model.a - model.split;
  const leftWidth = Math.max(25, Math.min(80, Math.round((left / model.a) * 100)));
  return `<div class="tp-area" role="img" aria-label="${esc(`${model.a} split into ${left} and ${right}, each times ${model.b}`)}">
      <span class="tp-area-side">${model.b}</span>
      <div class="tp-area-box"><div style="flex:${leftWidth}"><small>${left}</small><b>${left} × ${model.b}</b></div>${right ? `<div style="flex:${100 - leftWidth}"><small>${right}</small><b>${right} × ${model.b}</b></div>` : ""}</div>
    </div><p class="tp-caption">Multiply each part. Then add the parts.</p>`;
}

function numberLine(model) {
  const points = [model.start];
  for (const jump of model.jumps) points.push(points.at(-1) + jump);
  const min = Math.min(...points);
  const max = Math.max(...points);
  const x = (v) => 30 + ((v - min) / Math.max(1, max - min)) * 440;
  const arcs = model.jumps
    .map((jump, i) => {
      const from = x(points[i]);
      const to = x(points[i + 1]);
      const mid = (from + to) / 2;
      return `<path class="tp-jump" d="M${from},92 Q${mid},${28 + i * 10} ${to},92"/><text x="${mid}" y="${24 + i * 10}">${jump > 0 ? "+" : "−"}${Math.abs(jump).toLocaleString("en-US")}</text>`;
    })
    .join("");
  const ticks = [...new Set(points)]
    .map(
      (v, i) =>
        `<path class="tp-tick" d="M${x(v)},86 v14"/><text class="${i === 0 ? "tp-start" : ""}" x="${x(v)}" y="122">${i === points.length - 1 ? "?" : v.toLocaleString("en-US")}</text>`,
    )
    .join("");
  return `<svg class="tp-line" viewBox="0 0 500 132" role="img" aria-label="${esc(model.caption || "Number line")}"><path class="tp-axis" d="M14,93 H486"/>${ticks}${arcs}</svg>`;
}

// Returns "" when the problem has no picture; callers then show only the one-sentence tip.
export function trailPicture(model, { reveal = false } = {}) {
  if (!model) return "";
  let body = "";
  if (model.type === "counters") body = tenFrames(model);
  else if (model.type === "array") body = dotArray(model);
  else if (model.type === "numberline") body = numberLine(model);
  if (!body) return "";
  if (reveal && model.type === "numberline")
    body = body.replace(
      ">?</text>",
      `>${(model.start + model.jumps.reduce((sum, jump) => sum + jump, 0)).toLocaleString("en-US")}</text>`,
    );
  return `<figure class="tp">${body}</figure>`;
}

// ---------- interactive models used while answering ----------
// The model shows the structure; the student does the math. Every number the model needs
// from the student is a checked box (✓ when right) — the model never fills in an answer.

const tidy = (value) => Math.round(value * 1e6) / 1e6;
const decimalsOf = (value) => (String(value).split(".")[1] || "").length;
const fmtN = (value) =>
  Number(value).toLocaleString("en-US", { maximumFractionDigits: 6 });
const box = (expect, label, extra = "") =>
  `<input class="tp-in" data-expect="${expect}" aria-label="${esc(label)}" inputmode="decimal" autocomplete="off" spellcheck="false" ${extra}>`;

function countFrames(model) {
  // join: tap every counter to count them all. takeAway: tap to cross some out.
  // missing: tap the empty spaces to fill the frame. The student does the counting.
  const kind = model.kind;
  const shown = kind === "takeAway" ? model.target : model.filled;
  const frames = Math.max(1, Math.ceil(Math.max(model.target, shown, 1) / 10));
  const cells = Array.from({ length: frames * 10 }, (_, i) => {
    let cls = "empty";
    if (kind === "join")
      cls = i < model.filled ? "dot" : i < model.target ? "dot-add" : "empty";
    else if (kind === "takeAway") cls = i < shown ? "dot" : "empty";
    else cls = i < model.filled ? "dot" : i < model.target ? "slot" : "empty";
    return cls === "empty"
      ? `<span class="tp-cell empty"></span>`
      : `<button type="button" class="tp-cell ${cls}" data-cell="${i}" aria-label="Counter ${i + 1}"></button>`;
  });
  const groups = Array.from(
    { length: frames },
    (_, f) =>
      `<div class="tp-frame">${cells.slice(f * 10, f * 10 + 10).join("")}</div>`,
  ).join("");
  const prompt =
    kind === "join"
      ? "Tap each counter to count them all."
      : kind === "takeAway"
        ? `Tap ${model.target - model.filled} counters to take them away. Count what is left.`
        : "Tap the empty spaces to fill the frame. Count how many you added.";
  return `<div class="tp-live" data-live="frames" data-kind="${kind}"><p class="tp-prompt">${prompt}</p><div class="tp-frames">${groups}</div></div>`;
}

function tapArray(model) {
  if (model.a > 12 || model.b > 12) return tapArea(model);
  const rows = Array.from({ length: model.a }, (_, r) => {
    const tone = r < model.split ? "row-a" : "row-b";
    return `<button type="button" class="tp-row ${tone}" data-row="${r}" aria-label="Row ${r + 1}">${Array.from({ length: model.b }, () => `<span class="tp-dot">${model.unit ? model.unit : ""}</span>`).join("")}</button>`;
  }).join("");
  const each = model.unit ? `${model.b} tens` : model.b;
  return `<div class="tp-live" data-live="array"><p class="tp-prompt">${model.a} rows of ${esc(each)}. Tap each row as you count it.</p><div class="tp-array${model.unit ? " tens" : ""}">${rows}</div><p class="tp-readout">Rows counted: <b data-rows>0</b> of ${model.a}</p></div>`;
}

// Area model: the big factor is split by place value (882 = 800 + 80 + 2) so each part is a
// friendly product; the student multiplies each part and adds the parts.
function tapArea(model) {
  const digits = String(model.a);
  const parts = [...digits]
    .map((digit, i) => Number(digit) * 10 ** (digits.length - 1 - i))
    .filter(Boolean);
  const part = (size) =>
    `<div class="tp-part" style="flex:${Math.max(1, Math.log10(size) + 1)}"><b>${fmtN(size)} × ${model.b}</b>${box(size * model.b, `${size} times ${model.b}`)}</div>`;
  return `<div class="tp-live" data-live="area"><p class="tp-prompt">${fmtN(model.a)} = ${parts.map(fmtN).join(" + ")}. Multiply each part. Then add the parts.</p>
    <div class="tp-area"><span class="tp-area-side">${model.b}</span><div class="tp-area-box">${parts.map(part).join("")}</div></div>
    ${parts.length > 1 ? `<p class="tp-sum">Add the parts: ${box(model.a * model.b, "the total of all the parts")}</p>` : ""}</div>`;
}

// Open number line: jump buttons sized to the problem; after each jump the student types
// where they landed, and the next jump unlocks only when that landing is right.
function lineSvg(start, hops, end, confirmed) {
  const points = [start];
  for (const hop of hops) points.push(tidy(points.at(-1) + hop));
  const min = Math.min(...points, end);
  const max = Math.max(...points, end);
  const x = (v) => 34 + ((v - min) / Math.max(1e-9, max - min)) * 432;
  const arcs = hops
    .map((hop, i) => {
      const from = x(points[i]);
      const to = x(points[i + 1]);
      const lift = Math.max(18, Math.min(60, Math.abs(to - from) / 2));
      return `<path class="tp-jump" d="M${from},92 Q${(from + to) / 2},${92 - lift * 1.6} ${to},92"/><text class="tp-hop-label" x="${(from + to) / 2}" y="${86 - lift * 0.85}">${hop > 0 ? "+" : "−"}${fmtN(Math.abs(hop))}</text>`;
    })
    .join("");
  const here = points.at(-1);
  const hereLabel = hops.length
    ? confirmed === hops.length
      ? fmtN(here)
      : "?"
    : "";
  const ticks = points
    .map((v) => `<path class="tp-tick" d="M${x(v)},86 v14"/>`)
    .join("");
  return `<svg class="tp-line" viewBox="0 0 500 140" role="img" aria-label="Number line starting at ${fmtN(start)}">
    <path class="tp-axis" d="M10,93 H490"/>${ticks}${arcs}
    ${min < 0 && max > 0 && ![start, end, here].includes(0) ? `<path class="tp-tick zero" d="M${x(0)},84 v18"/><text class="tp-zero" x="${x(0)}" y="122">0</text>` : ""}
    <text class="tp-start" x="${x(start)}" y="122">${fmtN(start)}</text>
    ${here === end ? "" : `<path class="tp-tick goal" d="M${x(end)},84 v18"/>`}
    <circle class="tp-marker" cx="${x(here)}" cy="93" r="9"/>${hereLabel ? `<text class="tp-here" x="${x(here)}" y="132">${hereLabel}</text>` : ""}
  </svg>`;
}

// Jump sizes from the biggest place in the move down to its smallest (…, 10, 1, 0.1, 0.01).
function jumpSizes(total, decimals) {
  const size = Math.abs(total);
  const sizes = [];
  for (
    let p = 10 ** Math.max(0, String(Math.floor(size)).length - 1);
    p > 10 ** -decimals / 2;
    p /= 10
  )
    sizes.push(tidy(p));
  return sizes.slice(0, 5);
}

// With `group` (division) the jumps are equal groups: +100 groups, +10 groups, +1 group.
function tapLine(model) {
  if (![model.start, ...model.jumps].every(Number.isFinite)) return "";
  const total = tidy(model.jumps.reduce((sum, jump) => sum + jump, 0));
  if (!total) return "";
  const sign = total < 0 ? -1 : 1;
  const group = model.group || 0;
  const decimals = Math.max(
    decimalsOf(model.start),
    ...model.jumps.map(decimalsOf),
  );
  const sizes = group
    ? [100, 10, 1]
        .filter((n) => n <= Math.abs(total) / group)
        .map((n) => n * group)
    : jumpSizes(total, decimals);
  const buttons = sizes
    .map((size) => {
      const label = group
        ? `+${fmtN(size / group)} group${size === group ? "" : "s"} of ${fmtN(group)}`
        : `${sign > 0 ? "+" : "−"}${fmtN(size)}`;
      return `<button type="button" class="tp-hop-btn" data-hop-size="${sign * size}">${label}</button>`;
    })
    .join("");
  const end = tidy(model.start + total);
  const prompt = group
    ? `Jump from 0 in equal groups of ${fmtN(group)} until you reach ${fmtN(Math.abs(total))}. Keep track of how many groups.`
    : `Start at ${fmtN(model.start)}. Jump ${sign > 0 ? "forward" : "back"} ${fmtN(Math.abs(total))} in friendly jumps.`;
  return `<div class="tp-live" data-live="line" data-start="${model.start}" data-end="${end}" data-hops="[]" data-confirmed="0">
    <p class="tp-prompt">${prompt}</p>
    <div data-line>${lineSvg(model.start, [], end, 0)}</div>
    <p class="tp-landing" data-landing hidden></p>
    <div class="tp-hop-row">${buttons}<button type="button" class="tp-hop-btn undo" data-hop-undo disabled>Undo</button></div>
  </div>`;
}

// ---------- more models: place value, rounding, coins, pairs, percent, ratios, factors and
// multiples, powers, square roots, perimeter, and volume. Each is built from the problem's numbers.
const PLACE_NAMES = [
  "ones",
  "tens",
  "hundreds",
  "thousands",
  "ten-thousands",
  "hundred-thousands",
  "millions",
];
const DECIMAL_NAMES = ["tenths", "hundredths", "thousandths"];

function placeChart(model) {
  const split = model.rows.map((text) => {
    const [int, dec = ""] = String(text).replaceAll(",", "").split(".");
    return { int, dec };
  });
  const intCols = Math.max(...split.map((row) => row.int.length));
  const decCols = Math.max(...split.map((row) => row.dec.length));
  const heads = [
    ...Array.from(
      { length: intCols },
      (_, i) => PLACE_NAMES[intCols - 1 - i] || "",
    ),
    ...(decCols ? ["."] : []),
    ...DECIMAL_NAMES.slice(0, decCols),
  ];
  const cell = (digit, name) =>
    digit === undefined || digit === " "
      ? "<td></td>"
      : `<td><button type="button" class="tp-digit" data-digit="${digit}" data-digit-name="${name}">${digit}</button></td>`;
  const body = split
    .map(({ int, dec }) => {
      const cells = [...int.padStart(intCols, " ")].map((digit, i) =>
        cell(digit, PLACE_NAMES[intCols - 1 - i]),
      );
      if (decCols) cells.push('<td class="tp-point">.</td>');
      for (let i = 0; i < decCols; i += 1)
        cells.push(cell(dec[i], DECIMAL_NAMES[i]));
      return `<tr>${cells.join("")}</tr>`;
    })
    .join("");
  return `<div class="tp-live" data-live="place"><p class="tp-prompt">Each digit sits in a place. Tap a digit to name its place.</p>
    <table class="tp-place"><thead><tr>${heads.map((head) => `<th scope="col">${head}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table>
    <p class="tp-readout" data-place-readout>Each place is worth 10 times the place to its right.</p></div>`;
}

function roundLine(model) {
  const { value, low, high } = model;
  const x = (v) => 40 + ((v - low) / Math.max(1, high - low)) * 420;
  const mid = (low + high) / 2;
  return `<div class="tp-live" data-live="round"><p class="tp-prompt">Is ${fmtN(value)} before or after the halfway mark?</p>
    <svg class="tp-line" viewBox="0 0 500 150" role="img" aria-label="${fmtN(value)} between ${fmtN(low)} and ${fmtN(high)}">
      <path class="tp-axis" d="M20,93 H480"/>
      <path class="tp-tick" d="M${x(low)},84 v18"/><text x="${x(low)}" y="124">${fmtN(low)}</text>
      <path class="tp-tick" d="M${x(high)},84 v18"/><text x="${x(high)}" y="124">${fmtN(high)}</text>
      <path class="tp-tick goal" d="M${x(mid)},78 v28"/><text class="tp-goal" x="${x(mid)}" y="142">halfway</text>
      <circle class="tp-marker" cx="${x(value)}" cy="93" r="9"/><text class="tp-here" x="${x(value)}" y="70">${fmtN(value)}</text>
    </svg></div>`;
}

function coinCounter(model) {
  const values = [25, 10, 5, 1];
  const names = ["quarter", "dime", "nickel", "penny"];
  const coins = model.counts
    .flatMap((count, i) =>
      Array.from(
        { length: count },
        () =>
          `<button type="button" class="tp-coin c${values[i]}" data-coin="${values[i]}" aria-label="${names[i]}">${values[i]}¢</button>`,
      ),
    )
    .join("");
  return `<div class="tp-live" data-live="coins"><p class="tp-prompt">Count up, starting with the biggest coins. Tap each coin as you count it.</p>
    <div class="tp-coins">${coins || "<span>No coins</span>"}</div><p class="tp-readout">Coins counted: <b data-coins>0</b></p></div>`;
}

function pairUp(model) {
  const note = model.note ? `<p class="tp-prompt">${esc(model.note)}</p>` : "";
  if (!model.total) return `<div class="tp-live" data-live="pairs">${note}<p class="tp-prompt">There are no ones to pair.</p></div>`;
  return `<div class="tp-live" data-live="pairs">${note}<p class="tp-prompt">${model.note ? "Pair up the ones." : "Can every dot get a partner?"}</p>
    <div class="tp-pairs">${dots(model.total)}</div>
    <div class="tp-hop-row"><button type="button" class="tp-hop-btn" data-make-pairs>Make pairs</button></div></div>`;
}

function gcdSmall(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) [x, y] = [y, x % y];
  return x || 1;
}

// Percent bar: the student first works out what one part is worth, then shades parts.
function percentBar(model) {
  const parts = Math.min(10, 100 / gcdSmall(model.percent, 100));
  const each = model.whole / parts;
  const cells = Array.from(
    { length: parts },
    (_, i) =>
      `<button type="button" class="tp-part-cell" data-cell-index="${i}" disabled><small>${fmtN(100 / parts)}%</small><b data-each>?</b></button>`,
  ).join("");
  return `<div class="tp-live" data-live="percent" data-parts="${parts}" data-each="${each}">
    <p class="tp-prompt">The whole bar is ${fmtN(model.whole)}. It has ${parts} equal parts. One part is worth ${box(each, "the value of one part", 'data-then="percent"')}</p>
    <div class="tp-percent">${cells}</div><p class="tp-readout">Shaded: <b data-shaded>0%</b></p>
    ${model.change !== undefined ? `<p class="tp-chain">The ${model.percent}% change is ${box(model.change, "the amount of change")} Then ${model.decrease ? "subtract it from" : "add it to"} ${fmtN(model.whole)}.</p>` : ""}</div>`;
}

// Ratio table: pick ×n or ÷n, then type the new column; the next step waits until both are right.
function ratioTable(model) {
  const divisors = [...new Set([2, 3, 5, 10, model.a])]
    .filter((n) => n > 1)
    .sort((x, y) => x - y);
  const buttons = [
    ...[2, 3, 4, 5, 6, 7, 8, 9, 10].map(
      (n) =>
        `<button type="button" class="tp-hop-btn" data-scale="${n}">× ${n}</button>`,
    ),
    ...divisors.map(
      (n) =>
        `<button type="button" class="tp-hop-btn" data-scale="${1 / n}" data-scale-label="÷ ${n}">÷ ${n}</button>`,
    ),
  ].join("");
  return `<div class="tp-live" data-live="ratio" data-cols='${JSON.stringify([[model.a, model.b]])}' data-labels='${JSON.stringify(model.labels)}'>
    <p class="tp-prompt">Pick ×  or ÷. Do the same thing to both rows and type the new column.</p>
    <div data-ratio-table>${ratioTableHtml([[model.a, model.b]], model.labels)}</div>
    <div class="tp-hop-row tp-scale-row">${buttons}<button type="button" class="tp-hop-btn undo" data-ratio-undo>Undo</button></div>
    <p class="tp-readout" data-ratio-note></p></div>`;
}

function ratioTableHtml(cols, labels, pending = null) {
  const row = (r) =>
    `<tr><th scope="row">${labels[r]}</th>${cols.map((col) => `<td>${fmtN(col[r])}</td>`).join("")}${pending ? `<td class="latest">${box(pending.values[r], `${labels[r]} ${pending.label}`, 'data-then="ratio"')}</td>` : ""}</tr>`;
  return `<table class="tp-ratio">${pending ? `<caption>${esc(pending.label)}</caption>` : ""}${row(0)}${row(1)}</table>`;
}

// GCF: the student types factors (each one brings its partner). LCM: the student types the next multiple.
function factorLists(model) {
  const row = (n) =>
    model.find === "gcf"
      ? `<div class="tp-list-row"><span class="tp-list-name">Factors of ${n}</span><span class="tp-chips" data-chips="${n}"></span><input class="tp-in wide" data-factor-of="${n}" aria-label="A factor of ${n}" inputmode="numeric" autocomplete="off"><button type="button" class="tp-hop-btn" data-add-factor="${n}">Add</button></div>`
      : `<div class="tp-list-row"><span class="tp-list-name">Multiples of ${n}</span><span class="tp-chips" data-chips="${n}"></span>${box(n, `the first multiple of ${n}`, `data-then="multiple" data-multiple-of="${n}"`)}</div>`;
  return `<div class="tp-live" data-live="lists" data-find="${model.find}"><p class="tp-prompt">${model.find === "gcf" ? "Type factors of each number. Factors both numbers share light up." : "Type the multiples of each number in order. Multiples both share light up."}</p>${row(model.a)}${row(model.b)}<p class="tp-readout" data-list-note></p></div>`;
}

// Powers: the student types each running product.
function powerChain(model) {
  return `<div class="tp-live" data-live="power" data-base="${model.base}" data-exponent="${model.exponent}">
    <p class="tp-prompt">${model.base}<sup>${model.exponent}</sup> uses ${model.base} as a factor ${model.exponent} times. Multiply one step at a time.</p>
    <div class="tp-chain-rows" data-chain>${powerRow(model.base, 2)}</div></div>`;
}

function powerRow(base, used) {
  return `<p class="tp-chain">${Array(used).fill(base).join(" × ")} = ${box(base ** used, `${base} to the power ${used}`, `data-then="power" data-used="${used}"`)}</p>`;
}

function squareGrow(model) {
  return `<div class="tp-live" data-live="square" data-side="1">
    <p class="tp-prompt">Grow the square until it has ${fmtN(model.square)} dots. What is the side length?</p>
    <div data-square>${squareHtml(1)}</div>
    <div class="tp-hop-row"><button type="button" class="tp-hop-btn" data-square-step="-1">Smaller</button><button type="button" class="tp-hop-btn" data-square-step="1">Bigger</button></div>
    <p class="tp-readout" data-square-readout>Side: 1</p></div>`;
}

function squareHtml(side) {
  return `<span class="sv sv-array square" style="--cols:${side}">${dots(side * side)}</span>`;
}

function tapPerimeter(model) {
  const side = (len, cls, label) =>
    `<button type="button" class="tp-side ${cls}" data-side="${len}" aria-label="${label} side, ${len}">${len}</button>`;
  return `<div class="tp-live" data-live="perimeter"><p class="tp-prompt">Walk all the way around. Tap each side as you add it.</p>
    <div class="tp-rect-sides">${side(model.a, "top", "Top")}${side(model.b, "left", "Left")}<span class="tp-rect-inside"></span>${side(model.b, "right", "Right")}${side(model.a, "bottom", "Bottom")}</div>
    <p class="tp-readout">Sides added: <b data-sides>0</b> of 4</p></div>`;
}

function stackLayers(model) {
  return `<div class="tp-live" data-live="layers" data-height="${model.height}" data-count="0">
    <p class="tp-prompt">The bottom layer is ${model.a} × ${model.b} cubes. Stack ${model.height} layers like it.</p>
    <div class="tp-layers" data-layers></div>
    <div class="tp-hop-row"><button type="button" class="tp-hop-btn" data-layer="1">Add a layer</button><button type="button" class="tp-hop-btn undo" data-layer="-1">Take one off</button></div>
    <p class="tp-readout">Layers: <b data-layer-count>0</b></p></div>`;
}


// ---------- Grades 5–8: short chains of boxes the student fills in, with a picture when one helps.
// A grid zoomed to the points (always showing the axes), with one square per unit so rise
// and run can be counted.
function gridSvg(points, { rise = null } = {}) {
  const xs = [0, ...points.map((p) => p[0])];
  const ys = [0, ...points.map((p) => p[1])];
  const span = Math.max(6, Math.max(...xs) - Math.min(...xs) + 2, Math.max(...ys) - Math.min(...ys) + 2);
  const lo = [Math.min(...xs) - 1, Math.min(...ys) - 1];
  const unit = 260 / span;
  const x = (v) => 20 + (v - lo[0]) * unit;
  const y = (v) => 280 - (v - lo[1]) * unit;
  let body = "";
  for (let i = 0; i <= span; i += 1) {
    const gx = lo[0] + i;
    const gy = lo[1] + i;
    body += `<path class="tp-grid${gx === 0 ? " axis" : ""}" d="M${x(gx)},${y(lo[1])} V${y(lo[1] + span)}"/><path class="tp-grid${gy === 0 ? " axis" : ""}" d="M${x(lo[0])},${y(gy)} H${x(lo[0] + span)}"/>`;
  }
  if (rise) {
    const [[x1, y1], [x2, y2]] = rise;
    body += `<path class="tp-run" d="M${x(x1)},${y(y1)} H${x(x2)}"/><path class="tp-rise" d="M${x(x2)},${y(y1)} V${y(y2)}"/>`;
  }
  body += points.map(([px, py, label]) => `<circle class="tp-pt" cx="${x(px)}" cy="${y(py)}" r="6"/><text class="tp-pt-label" x="${x(px) + 8}" y="${y(py) - 9}">${esc(label)}</text>`).join("");
  return `<svg class="tp-gridsvg" viewBox="0 0 300 300" role="img" aria-label="Coordinate grid">${body}</svg>`;
}

function picture(kind, model) {
  if (kind === "grid") return gridSvg(model.points, { rise: model.rise });
  if (kind === "triangle")
    return `<svg class="tp-shape" viewBox="0 0 220 150" role="img" aria-label="Right triangle with legs ${model.a} and ${model.b}"><path class="tp-tri" d="M30,130 H190 V20 Z"/><path class="tp-tick" d="M178,130 v-12 h12"/><text x="110" y="146">${model.b}</text><text x="204" y="80">${model.a}</text><text x="92" y="66">?</text></svg>`;
  if (kind === "circle")
    return `<svg class="tp-shape" viewBox="0 0 220 150" role="img" aria-label="Circle with radius ${model.r}"><circle class="tp-circ" cx="110" cy="75" r="62"/><path class="tp-radius" d="M110,75 H172"/><circle cx="110" cy="75" r="3"/><text x="141" y="68">r = ${model.r}</text></svg>`;
  if (kind === "spinner") {
    const n = model.total;
    const slice = (i) => {
      const a0 = (i / n) * 2 * Math.PI - Math.PI / 2;
      const a1 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2;
      return `<path class="${i < model.favorable ? "win" : ""}" d="M75,75 L${75 + 65 * Math.cos(a0)},${75 + 65 * Math.sin(a0)} A65,65 0 0,1 ${75 + 65 * Math.cos(a1)},${75 + 65 * Math.sin(a1)} Z"/>`;
    };
    return `<svg class="tp-spinner" viewBox="0 0 150 150" role="img" aria-label="Spinner with ${n} equal sections">${Array.from({ length: n }, (_, i) => slice(i)).join("")}</svg>`;
  }
  if (kind === "scatter") {
    const xs = model.xs;
    const ys = model.ys;
    const [lo, hi] = [Math.min(...ys), Math.max(...ys)];
    const px = (i) => 30 + (i / Math.max(1, xs.length - 1)) * 220;
    const py = (v) => 130 - ((v - lo) / Math.max(1, hi - lo)) * 100;
    return `<svg class="tp-shape" viewBox="0 0 280 150" role="img" aria-label="Scatter plot of the data"><path class="tp-grid axis" d="M20,140 H270 M20,140 V10"/>${xs.map((_, i) => `<circle class="tp-pt" cx="${px(i)}" cy="${py(ys[i])}" r="5"/>`).join("")}<text x="262" y="134">x</text><text x="26" y="18">y</text></svg>`;
  }
  if (kind === "clock") {
    const minuteAngle = (model.minute / 60) * 2 * Math.PI;
    const hourAngle = (((model.hour % 12) + model.minute / 60) / 12) * 2 * Math.PI;
    const hand = (angle, len) => `M75,75 L${75 + len * Math.sin(angle)},${75 - len * Math.cos(angle)}`;
    const numbers = Array.from({ length: 12 }, (_, i) => {
      const a = ((i + 1) / 12) * 2 * Math.PI;
      return `<text x="${75 + 52 * Math.sin(a)}" y="${80 - 52 * Math.cos(a)}">${i + 1}</text>`;
    }).join("");
    return `<svg class="tp-spinner tp-clock" viewBox="0 0 150 150" role="img" aria-label="Clock showing the start time"><circle cx="75" cy="75" r="68"/>${numbers}<path class="hour" d="${hand(hourAngle, 32)}"/><path class="minute" d="${hand(minuteAngle, 50)}"/></svg>`;
  }
  if (kind === "inequality") {
    const lo = Math.min(model.boundary, model.test) - 3;
    const hi = Math.max(model.boundary, model.test) + 3;
    const x = (v) => 30 + ((v - lo) / (hi - lo)) * 440;
    const closed = model.symbol === "≥" || model.symbol === "≤";
    return `<svg class="tp-line" viewBox="0 0 500 120" role="img" aria-label="Number line with ${model.boundary} and ${model.test}"><path class="tp-axis" d="M10,60 H490"/><circle class="tp-bound${closed ? " closed" : ""}" cx="${x(model.boundary)}" cy="60" r="8"/><text x="${x(model.boundary)}" y="92">${model.boundary}</text><circle class="tp-marker" cx="${x(model.test)}" cy="60" r="7"/><text class="tp-here" x="${x(model.test)}" y="38">${model.test}</text></svg>`;
  }
  return "";
}

function chainModel(model) {
  const rows = (model.rows || [])
    .map((row) =>
      row.sign !== undefined
        ? `<p class="tp-chain">${esc(row.text)} <button type="button" class="tp-hop-btn" data-sign-pick="+" data-sign-right="${row.sign}">Positive</button><button type="button" class="tp-hop-btn" data-sign-pick="-" data-sign-right="${row.sign}">Negative</button></p>`
        : `<p class="tp-chain">${esc(row.text)} ${box(row.expect, row.text)}</p>`,
    )
    .join("");
  return `<div class="tp-live" data-live="chain"><p class="tp-prompt">${esc(model.prompt)}</p>${model.picture ? picture(model.picture, model) : ""}${rows}</div>`;
}

export function interactivePicture(model) {
  if (!model) return "";
  if (model.type === "counters" && model.kind) return countFrames(model);
  if (model.type === "array") return tapArray(model);
  if (model.type === "numberline") return tapLine(model);
  if (model.type === "placeChart") return placeChart(model);
  if (model.type === "roundLine") return roundLine(model);
  if (model.type === "coins") return coinCounter(model);
  if (model.type === "pairs") return pairUp(model);
  if (model.type === "percentBar") return percentBar(model);
  if (model.type === "ratioTable") return ratioTable(model);
  if (model.type === "lists") return factorLists(model);
  if (model.type === "power") return powerChain(model);
  if (model.type === "square") return squareGrow(model);
  if (model.type === "shape" && model.shape === "rectangle" && model.allSides)
    return tapPerimeter(model);
  if (model.type === "layers") return stackLayers(model);
  if (model.type === "chain") return chainModel(model);
  return "";
}

function redrawLine(live) {
  const hops = JSON.parse(live.dataset.hops || "[]");
  const confirmed = Number(live.dataset.confirmed);
  const start = Number(live.dataset.start);
  const end = Number(live.dataset.end);
  live.querySelector("[data-line]").innerHTML = lineSvg(
    start,
    hops,
    end,
    confirmed,
  );
  const waiting = hops.length > confirmed;
  const landing = live.querySelector("[data-landing]");
  landing.hidden = !waiting;
  if (waiting) {
    const at = tidy(start + hops.reduce((sum, hop) => sum + hop, 0));
    landing.innerHTML = `Where did you land? ${box(at, "where the jump landed", 'data-then="landing"')}`;
    landing.querySelector("input").focus();
  }
  live.querySelectorAll("[data-hop-size]").forEach((button) => {
    button.disabled = waiting;
  });
  live.querySelector("[data-hop-undo]").disabled = hops.length === 0;
}

// Checked boxes: mark right (✓) or not yet, then let the model take its next step.
export function handleModelInput(target) {
  const input = target.closest?.(".tp-in[data-expect]");
  if (!input || input.readOnly) return false;
  const raw = input.value.replaceAll(",", "").replace("−", "-").trim();
  const expect = Number(input.dataset.expect);
  const right =
    raw !== "" &&
    Number.isFinite(Number(raw)) &&
    Math.abs(Number(raw) - expect) < 1e-9;
  const digits = (text) => String(text).replace(/[-.]/g, "").length;
  input.classList.toggle("ok", right);
  input.classList.toggle(
    "no",
    !right && digits(raw) >= digits(fmtN(expect).replaceAll(",", "")),
  );
  if (!right) return true;
  input.readOnly = true;
  const live = input.closest(".tp-live");
  const then = input.dataset.then;
  if (then === "landing") {
    live.dataset.confirmed = Number(live.dataset.confirmed) + 1;
    redrawLine(live);
    live.querySelector("[data-hop-size]")?.focus();
  } else if (then === "percent") {
    live.querySelectorAll("[data-each]").forEach((label) => {
      label.textContent = fmtN(expect);
    });
    live.querySelectorAll("[data-cell-index]").forEach((cell) => {
      cell.disabled = false;
    });
  } else if (then === "ratio") {
    const pending = [...live.querySelectorAll('[data-then="ratio"]')];
    if (pending.every((box) => box.readOnly)) {
      const cols = JSON.parse(live.dataset.cols);
      cols.push(pending.map((box) => Number(box.dataset.expect)));
      live.dataset.cols = JSON.stringify(cols);
      live.querySelector("[data-ratio-table]").innerHTML = ratioTableHtml(
        cols,
        JSON.parse(live.dataset.labels),
      );
      live.querySelectorAll("[data-scale]").forEach((button) => {
        button.disabled = false;
      });
    } else pending.find((box) => !box.readOnly)?.focus();
  } else if (then === "multiple") {
    const n = Number(input.dataset.multipleOf);
    const chips = live.querySelector(`[data-chips="${n}"]`);
    chips.insertAdjacentHTML(
      "beforeend",
      `<b data-chip="${expect}">${fmtN(expect)}</b>`,
    );
    if (chips.children.length < 12) {
      input.insertAdjacentHTML(
        "afterend",
        box(
          expect + n,
          `the next multiple of ${n}`,
          `data-then="multiple" data-multiple-of="${n}"`,
        ),
      );
      input.nextElementSibling.focus();
    }
    input.remove();
    markShared(live);
  } else if (then === "power") {
    const used = Number(input.dataset.used);
    const base = Number(live.dataset.base);
    if (used < Number(live.dataset.exponent)) {
      live
        .querySelector("[data-chain]")
        .insertAdjacentHTML("beforeend", powerRow(base, used + 1));
      live.querySelector("[data-chain] .tp-chain:last-child input").focus();
    }
  }
  return true;
}

function markShared(live) {
  const lists = [...live.querySelectorAll("[data-chips]")].map(
    (list) =>
      new Set([...list.querySelectorAll("b")].map((b) => b.dataset.chip)),
  );
  live.querySelectorAll("[data-chip]").forEach((chip) =>
    chip.classList.toggle(
      "shared",
      lists.every((set) => set.has(chip.dataset.chip)),
    ),
  );
}

// One delegated handler for every model's buttons. Returns true when it handled the tap.
export function handleModelTap(target) {
  const live = target.closest(".tp-live");
  if (!live) return false;
  const cell = target.closest("[data-cell]");
  if (cell) {
    const kind = live.dataset.kind;
    if (kind === "join") {
      if (!cell.dataset.n) {
        cell.dataset.n = live.querySelectorAll("[data-n]").length + 1;
        cell.textContent = cell.dataset.n;
      }
    } else if (kind === "takeAway") cell.classList.toggle("gone");
    else if (
      cell.classList.contains("slot") ||
      cell.classList.contains("filled")
    )
      cell.classList.toggle("filled");
    return true;
  }
  const row = target.closest("[data-row]");
  if (row) {
    const rows = [...live.querySelectorAll("[data-row]")];
    const counted = rows.filter((r) => r.classList.contains("counted")).length;
    if (row.classList.contains("counted") && rows.indexOf(row) === counted - 1)
      row.classList.remove("counted");
    else if (!row.classList.contains("counted"))
      rows[counted].classList.add("counted");
    live.querySelector("[data-rows]").textContent = rows.filter((r) =>
      r.classList.contains("counted"),
    ).length;
    return true;
  }
  const hop = target.closest("[data-hop-size], [data-hop-undo]");
  if (hop && live.dataset.live === "line") {
    const hops = JSON.parse(live.dataset.hops || "[]");
    if (hop.hasAttribute("data-hop-undo")) {
      hops.pop();
      live.dataset.confirmed = Math.min(
        Number(live.dataset.confirmed),
        hops.length,
      );
    } else if (hops.length < 30) hops.push(Number(hop.dataset.hopSize));
    live.dataset.hops = JSON.stringify(hops);
    redrawLine(live);
    return true;
  }
  const digit = target.closest("[data-digit]");
  if (digit) {
    live
      .querySelectorAll(".tp-digit.on")
      .forEach((d) => d.classList.remove("on"));
    digit.classList.add("on");
    live.querySelector("[data-place-readout]").textContent =
      `This ${digit.dataset.digit} is in the ${digit.dataset.digitName} place.`;
    return true;
  }
  const coin = target.closest("[data-coin]");
  if (coin) {
    coin.classList.toggle("counted");
    live.querySelector("[data-coins]").textContent =
      live.querySelectorAll(".tp-coin.counted").length;
    return true;
  }
  if (target.closest("[data-make-pairs]")) {
    live.querySelector(".tp-pairs").classList.add("paired");
    target.closest("button").disabled = true;
    return true;
  }
  const percentCell = target.closest("[data-cell-index]");
  if (percentCell) {
    percentCell.classList.toggle("on");
    const shaded = live.querySelectorAll(".tp-part-cell.on").length;
    live.querySelector("[data-shaded]").textContent =
      `${fmtN((shaded * 100) / Number(live.dataset.parts))}%`;
    return true;
  }
  const scale = target.closest("[data-scale], [data-ratio-undo]");
  if (scale) {
    const cols = JSON.parse(live.dataset.cols);
    const labels = JSON.parse(live.dataset.labels);
    const note = live.querySelector("[data-ratio-note]");
    note.textContent = "";
    if (scale.hasAttribute("data-ratio-undo")) {
      if (cols.length > 1 && !live.querySelector('[data-then="ratio"]'))
        cols.pop();
      live.dataset.cols = JSON.stringify(cols);
      live.querySelector("[data-ratio-table]").innerHTML = ratioTableHtml(
        cols,
        labels,
      );
      live.querySelectorAll("[data-scale]").forEach((button) => {
        button.disabled = false;
      });
      return true;
    }
    const factor = Number(scale.dataset.scale);
    const values = cols.at(-1).map((value) => tidy(value * factor));
    if (
      values.some(
        (value) => Math.abs(value * 100 - Math.round(value * 100)) > 1e-6,
      )
    ) {
      note.textContent =
        "That would make a tiny fraction. Try a different number.";
      return true;
    }
    if (cols.length >= 6) {
      note.textContent = "The table is full. Use Undo to try another step.";
      return true;
    }
    const label = scale.dataset.scaleLabel || scale.textContent.trim();
    live.querySelector("[data-ratio-table]").innerHTML = ratioTableHtml(
      cols,
      labels,
      { values, label },
    );
    live.querySelectorAll("[data-scale]").forEach((button) => {
      button.disabled = true;
    });
    live.querySelector('[data-then="ratio"]').focus();
    return true;
  }
  const addFactor = target.closest("[data-add-factor]");
  if (addFactor) {
    const n = Number(addFactor.dataset.addFactor);
    const input = live.querySelector(`[data-factor-of="${n}"]`);
    const f = Number(input.value.trim());
    const note = live.querySelector("[data-list-note]");
    const chips = live.querySelector(`[data-chips="${n}"]`);
    if (!Number.isInteger(f) || f < 1 || n % f !== 0) {
      note.textContent = `${input.value.trim() || "That"} is not a factor of ${n}. A factor divides ${n} with nothing left over.`;
      return true;
    }
    note.textContent = `${f} × ${n / f} = ${n}`;
    for (const value of [f, n / f])
      if (!chips.querySelector(`[data-chip="${value}"]`))
        chips.insertAdjacentHTML(
          "beforeend",
          `<b data-chip="${value}">${value}</b>`,
        );
    [...chips.children]
      .sort((a, b) => Number(a.dataset.chip) - Number(b.dataset.chip))
      .forEach((chip) => chips.append(chip));
    input.value = "";
    input.focus();
    markShared(live);
    return true;
  }
  const grow = target.closest("[data-square-step]");
  if (grow) {
    const side = Math.max(
      1,
      Math.min(20, Number(live.dataset.side) + Number(grow.dataset.squareStep)),
    );
    live.dataset.side = side;
    live.querySelector("[data-square]").innerHTML = squareHtml(side);
    live.querySelector("[data-square-readout]").textContent = `Side: ${side}`;
    return true;
  }
  const sideBtn = target.closest("[data-side]");
  if (sideBtn) {
    sideBtn.classList.toggle("walked");
    live.querySelector("[data-sides]").textContent =
      live.querySelectorAll(".tp-side.walked").length;
    return true;
  }
  const layer = target.closest("[data-layer]");
  if (layer) {
    const count = Math.max(
      0,
      Math.min(
        Number(live.dataset.height) + 2,
        Number(live.dataset.count) + Number(layer.dataset.layer),
      ),
    );
    live.dataset.count = count;
    live.querySelector("[data-layers]").innerHTML = Array.from(
      { length: count },
      () => "<span></span>",
    ).join("");
    live.querySelector("[data-layer-count]").textContent = count;
    return true;
  }
  const sign = target.closest("[data-sign-pick]");
  if (sign) {
    const right = sign.dataset.signPick === sign.dataset.signRight;
    sign.parentElement.querySelectorAll("[data-sign-pick]").forEach((b) => b.classList.remove("ok", "no"));
    sign.classList.add(right ? "ok" : "no");
    return true;
  }
  return false;
}
// Exponents print as superscripts; everything else stays plain text.
export const mathText = (text) => esc(text).replace(/\^(-?\d+)/g, "<sup>$1</sup>");

// Super-simple guided steps: one short number sentence at a time, revealed by tapping "Next step".
export function stepsBlock(steps, shown, { id, cap = steps.length } = {}) {
  const visible = steps.slice(0, Math.min(shown, cap));
  // A step only gets a picture when it shows something the step above did not.
  let previous = "";
  const pictures = visible.map((line) => {
    const html = stepVisual(line);
    const same = html.replace(/>[^<]*</g, "><") === previous.replace(/>[^<]*</g, "><") && html.includes("sv-array");
    previous = html;
    return same ? "" : html;
  });
  const more = shown < cap;
  return `<ol class="tr-steps" id="${id}">${visible.map((line, i) => `<li${i === visible.length - 1 ? ' class="latest"' : ""}><span class="tr-step-num">${i + 1}</span><span class="tr-step-text">${mathText(line)}</span>${pictures[i]}</li>`).join("")}</ol>
    ${more ? `<button type="button" class="tr-step-next" data-step="${id}">Next step</button>` : ""}`;
}

// ---------- a small picture for every guided step ----------
// Each step is a short number sentence; its picture is drawn from that sentence's own numbers.
const num = (text) => Number(String(text).replace("−", "-"));
const dots = (count, cls = "") =>
  Array.from({ length: count }, () => `<i class="sv-dot ${cls}"></i>`).join("");
const small = (value) => Number.isInteger(value) && value >= 1 && value <= 10;

function miniArray(rows, cols, cls = "") {
  return `<span class="sv sv-array" style="--cols:${cols}" aria-hidden="true">${Array.from({ length: rows }, () => dots(cols, cls)).join("")}</span>`;
}

function miniBar(parts, take) {
  const total = parts.reduce((sum, value) => sum + Math.abs(value), 0) || 1;
  return `<span class="sv sv-bar${take ? " take" : ""}" aria-hidden="true">${parts.map((value, i) => `<b style="flex:${Math.max(0.15, Math.abs(value) / total)}" class="p${i}">${Math.abs(value).toLocaleString("en-US")}</b>`).join("")}</span>`;
}

function miniHops(values) {
  const shown = values.slice(0, 12);
  return `<span class="sv sv-hops" aria-hidden="true">${shown.map((value, i) => `<b class="${i === shown.length - 1 ? "last" : ""}">${value.toLocaleString("en-US")}</b>`).join("")}</span>`;
}

export function stepVisual(line) {
  // Drop thousands commas (not list commas) and lead-ins such as "So" or "Size:".
  const text = String(line)
    .replace(/(\d),(\d{3})/g, "$1$2")
    .replace(/^(?:So|Check:)\s+/, "")
    .replace(/\.$/, "");
  const start = text.match(/^Start at (-?\d+)$/);
  if (start) return miniHops([Number(start[1])]);
  const move = text.match(/^Start at (-?\d+)\. Move (\d+) (left|right)$/);
  if (move)
    return miniHops([
      Number(move[1]),
      Number(move[1]) + (move[3] === "right" ? 1 : -1) * Number(move[2]),
    ]);
  const missing = text.match(/^(\d+) \+ \? = (\d+)$/);
  if (missing && Number(missing[2]) <= 20)
    return `<span class="sv sv-count" aria-hidden="true">${dots(Number(missing[1]))}${dots(Number(missing[2]) - Number(missing[1]), "ghost")}</span>`;
  // "Count on 3: 8, 9, 10", "Count back 2: 6, 5", "10, 20, 30, 40", "Count the empty spaces: 3"
  const list = text.match(
    /(?:^|:\s*)((?:-?\d+(?:\.\d+)?,\s*)*-?\d+(?:\.\d+)?)$/,
  );
  if (list) return miniHops(list[1].split(/,\s*/).map(Number));
  const eq = text.match(
    /^(-?\d+(?:\.\d+)?) ([+−×÷]) \(?(-?\d+(?:\.\d+)?|\?)\)? = (-?\d+(?:\.\d+)?|\?)$/,
  );
  if (!eq) return "";
  const a = num(eq[1]);
  const op = eq[2];
  const b = eq[3] === "?" ? null : num(eq[3]);
  const c = eq[4] === "?" ? null : num(eq[4]);
  if (op === "×" && b !== null && small(a) && small(b)) return miniArray(a, b);
  if (op === "×" && b === null && c !== null && small(a) && small(c / a))
    return miniArray(a, c / a, "ghost");
  if (op === "÷" && c !== null && small(b) && small(c)) return miniArray(b, c);
  // Bigger products: an area rectangle labelled with the two factors and the product.
  if (
    op === "×" &&
    b !== null &&
    Number.isInteger(a) &&
    Number.isInteger(b) &&
    a > 0 &&
    b > 0
  )
    return `<span class="sv sv-rect" aria-hidden="true"><em class="top">${a.toLocaleString("en-US")}</em><em class="side">${b.toLocaleString("en-US")}</em><b>${c === null ? "?" : c.toLocaleString("en-US")}</b></span>`;
  if (
    (op === "+" || op === "−") &&
    b !== null &&
    Number.isInteger(a) &&
    Number.isInteger(b) &&
    a >= 0 &&
    b >= 0
  ) {
    const whole = op === "+" ? a + b : a;
    if (whole <= 20)
      return `<span class="sv sv-count" aria-hidden="true">${op === "+" ? `${dots(a)}${dots(b, "add")}` : `${dots(a - b)}${dots(b, "gone")}`}</span>`;
    return miniBar(op === "+" ? [a, b] : [a - b, b], op === "−");
  }
  return "";
}

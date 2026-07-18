import { renderAlgebraExpand } from "../components/algebra-tiles-expand.js";
import { renderDataLive } from "../components/data-live.js";
import { renderEquationBalanceLab } from "../components/equation-balance-lab.js";
import { renderPercentGridLab } from "../components/percent-grid-lab.js";
import { isRight } from "./small-group-answers.js";

// Exact data-figure kinds routed to the interactive "Data Live" widget. Exact
// match (not substring) so bar-MODEL, scale-bars, double-rate-bars, etc. keep
// their own renderings.
const DATA_KINDS = new Set(["dot-plot", "data-dots", "histogram", "box-plot", "bar-chart"]);
import { el, esc, esLane, speak } from "./small-group-ui.js";

// Pull just the equation out of a solve-it stem like
// "Solve the new equation x + 2 = 6." → "x + 2 = 6". Walks outward from the
// "=" token, keeping only math-like tokens (numbers, single-letter variables,
// coefficient-variables like 2x, operators), so surrounding words drop away.
// Returns null when the stem has no equation (e.g. "write an equation" prompts).
function extractEquation(stem) {
  const toks = String(stem || "")
    .replace(/[.?!,:;]+$/g, "")
    .split(/\s+/);
  const eqIdx = toks.findIndex((t) => t.includes("="));
  if (eqIdx < 0) return null;
  const clean = (t) => t.replace(/[.,?!:;]+$/g, "");
  const mathy = (t) =>
    /^[-+]?[\d.]+$/.test(t) ||
    /^-?\d*[a-zA-Z](\/\d+)?$/.test(t) ||
    /^[-+*/×÷·]$/.test(t) ||
    t.includes("=");
  let lo = eqIdx;
  let hi = eqIdx;
  while (lo - 1 >= 0 && mathy(clean(toks[lo - 1]))) lo--;
  while (hi + 1 < toks.length && mathy(clean(toks[hi + 1]))) hi++;
  const eq = toks
    .slice(lo, hi + 1)
    .map(clean)
    .join(" ");
  return /=/.test(eq) && /[a-zA-Z]/.test(eq) ? eq : null;
}

// Live interactive balance for solve-an-equation items: the same-operation-to-
// both-sides scale, in place of the old static algebra figure.
function typedBalance(item) {
  const eq = item.visual?.equation || extractEquation(item.stem);
  if (!eq) return null;
  const wrap = el("div", "sg-balance-lab");
  renderEquationBalanceLab(wrap, { equation: eq });
  return wrap;
}

function valuesFrom(visual, stem, steps = []) {
  const values = [];
  const visit = (value) => {
    if (Array.isArray(value)) value.forEach(visit);
    else if (typeof value === "number" || (typeof value === "string" && /^-?\d/.test(value)))
      values.push(String(value));
  };
  visit(visual?.values);
  visit(visual?.value);
  visit(visual?.point);
  visit(visual?.points);
  visit(visual?.boundary);
  visit(visual?.whole);
  visit(visual?.percent);
  if (visual?.left?.d != null) values.push(`${visual.left.n}/${visual.left.d}`);
  if (visual?.right?.d != null) values.push(`${visual.right.n}/${visual.right.d}`);
  visit(steps.map((step) => step.answer));
  if (!values.length) values.push(...(String(stem).match(/-?\d+(?:\.\d+)?(?:\/\d+)?/g) || []));
  return [...new Set(values)].slice(0, 10);
}

function svgShell(label, body) {
  return `<svg viewBox="0 0 640 300" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg">
    <rect width="640" height="300" rx="28" fill="#fffdf8"/>
    ${body}
  </svg>`;
}

function numberLine(values) {
  const nums = values.map(Number).filter(Number.isFinite);
  const min = Math.min(0, ...nums) - 1;
  const max = Math.max(10, ...nums) + 1;
  const points = nums
    .map((value, index) => {
      const x = 70 + ((value - min) / Math.max(1, max - min)) * 500;
      return `<circle cx="${x}" cy="150" r="15" fill="var(--sg)"/><text x="${x}" y="115" text-anchor="middle">${esc(value)}</text><text class="sg-layer-3" x="${x}" y="205" text-anchor="middle">point ${index + 1}</text>`;
    })
    .join("");
  return `<line x1="55" y1="150" x2="585" y2="150" stroke="var(--sg-deep)" stroke-width="6"/><path d="M55 150l20-12v24zM585 150l-20-12v24z" fill="var(--sg-deep)"/>${points}`;
}

// Numbered coordinate plane: gridlines land on whole units at the SAME scale
// the points plot at (so a cell = 1 unit), with tick numbers on both axes and
// a labeled origin. Shared by the display grid and the tap-to-plot model.
const ORIGIN_X = 320;
const ORIGIN_Y = 150;
const gridScale = (maxAbs) => ({
  stepX: Math.min(28, 280 / Math.max(1, maxAbs)),
  stepY: Math.min(24, 130 / Math.max(1, maxAbs)),
});
function coordinatePlane(stepX, stepY) {
  const nx = Math.floor(280 / stepX);
  const ny = Math.floor(130 / stepY);
  const tick = 'style="font-size:13px;fill:#6b7688;font-weight:600"';
  let out = "";
  for (let n = -nx; n <= nx; n++) {
    if (n === 0) continue;
    const x = ORIGIN_X + n * stepX;
    out += `<line x1="${x}" y1="20" x2="${x}" y2="280" stroke="#dbe1ea" stroke-width="1.5"/><text x="${x}" y="168" text-anchor="middle" ${tick}>${n}</text>`;
  }
  for (let m = -ny; m <= ny; m++) {
    if (m === 0) continue;
    const y = ORIGIN_Y - m * stepY;
    out += `<line x1="40" y1="${y}" x2="600" y2="${y}" stroke="#dbe1ea" stroke-width="1.5"/><text x="311" y="${y + 4}" text-anchor="end" ${tick}>${m}</text>`;
  }
  // Bold axes, labeled origin, and x/y axis letters.
  out += `<line x1="40" y1="${ORIGIN_Y}" x2="600" y2="${ORIGIN_Y}" stroke="var(--sg-deep)" stroke-width="4"/><line x1="${ORIGIN_X}" y1="20" x2="${ORIGIN_X}" y2="280" stroke="var(--sg-deep)" stroke-width="4"/><text x="311" y="168" text-anchor="end" ${tick}>0</text><text x="602" y="${ORIGIN_Y - 8}" ${tick}>x</text><text x="${ORIGIN_X + 9}" y="32" ${tick}>y</text>`;
  return out;
}
function coordinateGrid(visual) {
  const points = visual.points || (visual.point ? [visual.point] : [[2, 3]]);
  const maxAbs = Math.max(1, ...points.flat().map((value) => Math.abs(Number(value) || 0)));
  const { stepX, stepY } = gridScale(maxAbs);
  const dots = points
    .map(
      ([x, y]) =>
        `<circle cx="${ORIGIN_X + Number(x) * stepX}" cy="${ORIGIN_Y - Number(y) * stepY}" r="12" fill="var(--sg-pop)" stroke="var(--sg-deep)" stroke-width="4"/><text x="${ORIGIN_X + Number(x) * stepX + 12}" y="${ORIGIN_Y - Number(y) * stepY - 12}" style="font-size:17px">(${esc(x)}, ${esc(y)})</text>`,
    )
    .join("");
  return `${coordinatePlane(stepX, stepY)}${dots}`;
}

function fractionBars(visual, values) {
  // Prefer the authored fractions ({n, d}) so each bar shows the real
  // denominator and shading instead of a generic half-shaded strip.
  const bar = (fractionValue, y, label) => {
    const d = Math.max(1, Math.min(16, Number(fractionValue?.d) || 0));
    const n = Math.max(0, Number(fractionValue?.n) || 0);
    if (!d) return "";
    const whole = Math.min(3, Math.ceil(n / d) || 1);
    const cells = Array.from({ length: d * whole }, (_, i) => {
      const width = 500 / (d * whole);
      return `<rect x="${55 + i * width}" y="${y}" width="${width - 3}" height="62" rx="6" fill="${i < n ? "var(--sg-soft)" : "#fff"}" stroke="var(--sg)" stroke-width="3"/>`;
    }).join("");
    return `<text x="55" y="${y - 10}" style="font-size:17px">${esc(label)}</text>${cells}`;
  };
  if (visual?.left?.d) {
    return `${bar(visual.left, 70, `${visual.left.n}/${visual.left.d}`)}${bar(visual.right, 190, `${visual.right?.n}/${visual.right?.d}`)}<text class="sg-layer-3" x="320" y="285" text-anchor="middle">How many of the second fit in the first?</text>`;
  }
  const count = Math.max(4, Math.min(10, Number(values[1]) || 6));
  return `<text x="50" y="55">Split the whole into equal parts</text><g transform="translate(55 90)">${Array.from({ length: count }, (_, i) => `<rect x="${i * (520 / count)}" width="${500 / count}" height="90" rx="7" fill="${i < Math.ceil(count / 2) ? "var(--sg-soft)" : "#fff"}" stroke="var(--sg)" stroke-width="3"/>`).join("")}</g><path class="sg-layer-3" d="M80 235h470" stroke="var(--sg-pop)" stroke-width="8" stroke-dasharray="18 12"/><text class="sg-layer-3" x="320" y="275" text-anchor="middle">count equal groups</text>`;
}

// The tree is the student's workspace: branch values stay "?" until the
// student produces them in the guided steps (sg-ans-N reveals on step N).
function factorTree(values, steps = []) {
  const value = values[0] || "?";
  const left = steps[0]?.answer ?? "?";
  const right = steps[1]?.answer ?? "?";
  const node = (x, stepNumber, answer) =>
    `<circle cx="${x}" cy="175" r="38" fill="var(--sg-soft)" stroke="var(--sg)" stroke-width="4"/><text class="sg-q-${stepNumber}" x="${x}" y="187" text-anchor="middle">?</text><text class="sg-ans sg-ans-${stepNumber}" x="${x}" y="187" text-anchor="middle">${esc(answer)}</text>`;
  return `<circle cx="320" cy="60" r="38" fill="var(--sg)"/><text x="320" y="72" text-anchor="middle" fill="white">${esc(value)}</text><path d="M295 92L185 150M345 92L455 150" stroke="var(--sg-deep)" stroke-width="6"/>${node(175, 1, left)}${node(465, 2, right)}<path class="sg-layer-3" d="M440 207L380 255M490 207L550 255" stroke="var(--sg-deep)" stroke-width="5"/><text class="sg-layer-3" x="465" y="285" text-anchor="middle">keep splitting composite branches</text>`;
}

function bars(values, kind) {
  const nums = values.map(Number).filter(Number.isFinite);
  const max = Math.max(1, ...nums);
  const colors = ["var(--sg)", "var(--sg-pop)", "#36a38b", "#8e63ce"];
  const columns = nums
    .slice(0, 4)
    .map((value, index) => {
      const height = 45 + (value / max) * 145;
      return `<rect x="${85 + index * 135}" y="${235 - height}" width="90" height="${height}" rx="12" fill="${colors[index]}"/><text x="${130 + index * 135}" y="265" text-anchor="middle">${esc(value)}</text>`;
    })
    .join("");
  return `<text x="45" y="45">${esc(kind.replace(/-/g, " "))}</text><line x1="55" y1="235" x2="590" y2="235" stroke="var(--sg-deep)" stroke-width="5"/>${columns}`;
}

function shapeModel(values, kind) {
  const labels = values.slice(0, 3);
  return `<path d="M125 225L205 75H475L535 225Z" fill="var(--sg-soft)" stroke="var(--sg)" stroke-width="7"/><path class="sg-layer-2" d="M205 75V225M475 75V225M125 225H535" stroke="var(--sg-deep)" stroke-width="4" stroke-dasharray="12 8"/><text x="330" y="260" text-anchor="middle">${esc(labels[0] || "base")}</text><text x="180" y="150" text-anchor="end">${esc(labels[1] || "height")}</text><text class="sg-layer-3" x="330" y="45" text-anchor="middle">${esc(kind.replace(/-/g, " "))}</text>`;
}

function algebraModel(values, kind) {
  const chips = values
    .slice(0, 6)
    .map(
      (value, index) =>
        `<rect x="${60 + index * 92}" y="95" width="72" height="72" rx="14" fill="${index % 2 ? "var(--sg-pop)" : "var(--sg-soft)"}" stroke="var(--sg)" stroke-width="4"/><text x="${96 + index * 92}" y="140" text-anchor="middle">${esc(value)}</text>`,
    )
    .join("");
  return `<text x="320" y="55" text-anchor="middle">${esc(kind.replace(/-/g, " "))}</text>${chips}<line class="sg-layer-3" x1="80" y1="225" x2="560" y2="225" stroke="var(--sg-deep)" stroke-width="8"/><text class="sg-layer-3" x="320" y="270" text-anchor="middle">keep both sides balanced</text>`;
}

const listFactors = (value) => {
  const result = [];
  for (let candidate = 1; candidate <= value; candidate++)
    if (value % candidate === 0) result.push(candidate);
  return result;
};

// Two labeled factor lists with the common factors highlighted — the actual
// GCF representation (a factor tree of one number is the wrong model here).
// Empty factor boxes are the workspace; each row's numbers appear only after
// the student lists them correctly (step 1 → row A, step 2 → row B), and the
// shared factors turn gold only after the GCF step.
function factorLists(values) {
  const [a, b] = values.map(Number);
  if (!a || !b || a > 200 || b > 200) return bars(values, "factors");
  const factorsA = listFactors(a);
  const factorsB = listFactors(b);
  const common = new Set(factorsA.filter((factor) => factorsB.includes(factor)));
  const row = (list, y, stepNumber) =>
    list
      .slice(0, 12)
      .map((factor, index) => {
        const shared = common.has(factor);
        return `<g transform="translate(${150 + index * 40} ${y})"><rect ${shared ? 'class="sg-hl-3"' : ""} x="-17" y="-22" width="34" height="34" rx="9" fill="#fff" stroke="var(--sg)" stroke-width="3"/><text class="sg-ans sg-ans-${stepNumber}" x="0" y="4" text-anchor="middle" style="font-size:18px">${factor}</text></g>`;
      })
      .join("");
  return `<text x="45" y="92" style="font-size:20px">${esc(a)} →</text>${row(factorsA, 90, 1)}
    <text x="45" y="182" style="font-size:20px">${esc(b)} →</text>${row(factorsB, 180, 2)}
    <text class="sg-layer-2" x="320" y="255" text-anchor="middle">Fill each row as you list the factors — matches turn gold</text>`;
}

// Two lanes of multiples with the first shared multiple highlighted (LCM).
function multipleLanes(values) {
  const [a, b] = values.map(Number);
  if (!a || !b) return bars(values, "multiples");
  const lane = (base, y) => {
    return Array.from({ length: 8 }, (_, index) => {
      const multiple = base * (index + 1);
      const shared = multiple % a === 0 && multiple % b === 0;
      return `<g transform="translate(${105 + index * 62} ${y})"><rect ${shared ? 'class="sg-hl-1"' : ""} x="-24" y="-22" width="48" height="34" rx="9" fill="#fff" stroke="var(--sg)" stroke-width="3"/><text class="sg-ans sg-ans-1" x="0" y="4" text-anchor="middle" style="font-size:17px">${multiple}</text></g>`;
    }).join("");
  };
  return `<text x="40" y="92" style="font-size:19px">×${esc(a)}</text>${lane(a, 90)}
    <text x="40" y="182" style="font-size:19px">×${esc(b)}</text>${lane(b, 180)}
    <text class="sg-layer-2" x="320" y="255" text-anchor="middle">Count by ${esc(a)}s and ${esc(b)}s — your first match turns gold</text>`;
}

// Real two-column table for rate / ratio / conversion problems.
function tableModel(values, kind) {
  const [first, second, scale] = values.map(Number);
  let headers = ["Quantity", "Value"];
  let rows = [
    [first, second],
    ["?", "?"],
  ];
  if (kind.includes("unit-rate")) {
    headers = ["Items", "Cost"];
    rows = [
      [first, `$${second}`],
      [1, "?"],
    ];
  } else if (kind.includes("conversion")) {
    headers = ["Larger unit", "Smaller units"];
    rows = [
      [1, second],
      [first, "?"],
    ];
  } else if (kind.includes("ratio")) {
    headers = ["First", "Second"];
    rows = [
      [first, second],
      [scale ? `${first} × ${scale}` : "?", "?"],
    ];
  }
  const cell = (value, x, y, isHead) =>
    `<rect x="${x}" y="${y}" width="180" height="56" rx="10" fill="${isHead ? "var(--sg)" : "#fff"}" stroke="var(--sg)" stroke-width="3"/><text x="${x + 90}" y="${y + 36}" text-anchor="middle" ${isHead ? 'fill="#fff"' : ""} style="font-size:19px">${esc(value)}</text>`;
  const body = [
    cell(headers[0], 130, 38, true),
    cell(headers[1], 330, 38, true),
    ...rows.flatMap((columns, rowIndex) => [
      cell(columns[0], 130, 102 + rowIndex * 64, false),
      cell(columns[1], 330, 102 + rowIndex * 64, false),
    ]),
  ].join("");
  return `${body}<text class="sg-layer-2" x="320" y="262" text-anchor="middle">Work row by row — what happens to both columns?</text>`;
}

// 10×10 percent grid (or bar when a whole amount is involved).
function percentModel(visual, values, kind) {
  const percent = Math.max(0, Math.min(100, Number(visual.percent) || Number(values[0]) || 0));
  if (kind.includes("bar") || visual.whole != null) {
    const whole = Number(visual.whole) || 100;
    const width = 480 * (percent / 100);
    return `<text x="80" y="80" style="font-size:20px">Whole amount: ${esc(whole)}</text>
      <rect x="80" y="110" width="480" height="64" rx="12" fill="#fff" stroke="var(--sg)" stroke-width="4"/>
      <rect x="80" y="110" width="${width}" height="64" rx="12" fill="var(--sg-soft)" stroke="var(--sg)" stroke-width="4"/>
      <text x="${80 + Math.max(34, width / 2)}" y="150" text-anchor="middle" style="font-size:19px">${esc(percent)}%</text>
      <text class="sg-layer-2" x="320" y="225" text-anchor="middle">${esc(percent)}% of ${esc(whole)} = the shaded part</text>`;
  }
  const shaded = Math.round(percent);
  const cells = Array.from({ length: 100 }, (_, index) => {
    const x = 195 + (index % 10) * 25;
    const y = 30 + Math.floor(index / 10) * 24;
    return `<rect x="${x}" y="${y}" width="21" height="20" rx="4" fill="${index < shaded ? "var(--sg)" : "#fff"}" stroke="var(--sg)" stroke-width="1.5"/>`;
  }).join("");
  return `${cells}<text x="320" y="290" text-anchor="middle">${esc(percent)} of 100 squares = ${esc(percent)}%</text>`;
}

// Long-division bracket with the quotient position visible.
function divisionBox(values) {
  const [dividend, divisor] = values;
  return `<text x="255" y="105" text-anchor="end" style="font-size:34px">${esc(divisor)}</text>
    <path d="M270 70 q14 45 0 90 M270 70 H545" fill="none" stroke="var(--sg-deep)" stroke-width="6"/>
    <text x="405" y="135" text-anchor="middle" style="font-size:34px">${esc(dividend)}</text>
    <text class="sg-layer-2" x="405" y="55" text-anchor="middle" style="font-size:30px">?</text>
    <text class="sg-layer-3" x="405" y="215" text-anchor="middle">quotient on top · remainder is what is left</text>`;
}

// Two rows of counters for a part-to-part ratio.
function ratioDots(values) {
  const [left, right] = values.map(Number);
  if (!left || !right || left > 15 || right > 15) return bars(values, "ratio");
  const row = (count, y, color) =>
    Array.from(
      { length: count },
      (_, index) =>
        `<circle cx="${170 + index * 36}" cy="${y}" r="15" fill="${color}" stroke="var(--sg-deep)" stroke-width="3"/>`,
    ).join("");
  return `<text x="45" y="105" style="font-size:19px">First</text>${row(left, 100, "var(--sg)")}
    <text x="45" y="195" style="font-size:19px">Second</text>${row(right, 190, "var(--sg-pop)")}
    <text class="sg-layer-2" x="320" y="262" text-anchor="middle">${esc(left)} for every ${esc(right)}</text>`;
}

// Number line with a boundary point and shaded ray for inequalities.
function inequalityLine(visual, values) {
  const boundary = Number(visual.boundary ?? values[0]) || 0;
  const symbol = String(visual.symbol || ">");
  const open = symbol === ">" || symbol === "<";
  const rightward = symbol === ">" || symbol === "≥" || symbol === ">=";
  const x = 320;
  const labels = Array.from({ length: 7 }, (_, index) => {
    const value = boundary - 3 + index;
    return `<text x="${x + (value - boundary) * 70}" y="200" text-anchor="middle">${value}</text><line x1="${x + (value - boundary) * 70}" y1="140" x2="${x + (value - boundary) * 70}" y2="160" stroke="var(--sg-deep)" stroke-width="3"/>`;
  }).join("");
  // The answer graph draws itself from the student's steps: boundary point
  // after step 1, shaded ray after step 2, the full statement after step 3.
  return `<line x1="55" y1="150" x2="585" y2="150" stroke="var(--sg-deep)" stroke-width="6"/>
    <path d="M55 150l20-12v24zM585 150l-20-12v24z" fill="var(--sg-deep)"/>${labels}
    <line class="sg-ans sg-ans-2" x1="${x}" y1="150" x2="${rightward ? 565 : 75}" y2="150" stroke="var(--sg)" stroke-width="12" stroke-linecap="round" opacity="0.55"/>
    <circle class="sg-ans sg-ans-1" cx="${x}" cy="150" r="16" fill="${open ? "#fffdf8" : "var(--sg)"}" stroke="var(--sg)" stroke-width="6"/>
    <text class="sg-ans sg-ans-3" x="${x}" y="105" text-anchor="middle">x ${esc(symbol)} ${esc(boundary)}</text>`;
}

function visualMarkup(item) {
  const visual = item.visual || {};
  const kind = String(visual.kind || "");
  // No authored visual → no figure. A generic chart built from scraped stem
  // numbers misleads more than it helps.
  if (!kind) return null;
  const values = valuesFrom(visual, item.stem);
  let body;
  if (kind.includes("factor-table")) body = factorLists(values);
  else if (kind.includes("multiple-lanes")) body = multipleLanes(values);
  else if (kind.includes("table")) body = tableModel(values, kind);
  else if (kind.includes("percent")) body = percentModel(visual, values, kind);
  else if (kind.includes("division-box")) body = divisionBox(values);
  else if (kind.includes("ratio-dots")) body = ratioDots(values);
  else if (kind.includes("inequality")) body = inequalityLine(visual, values);
  else if (kind.includes("factor")) body = factorTree(values, item.steps);
  else if (kind.includes("coordinate")) body = coordinateGrid(visual);
  else if (kind.includes("number-line")) body = numberLine(values);
  else if (kind.includes("fraction")) body = fractionBars(visual, values);
  else if (/area|volume|surface|prism|polygon|trapezoid|triangle|net|pyramid/.test(kind))
    body = shapeModel(values, kind);
  else if (/equation|expression|algebra|balance|operation|substitution|power|tiles/.test(kind))
    body = algebraModel(values, kind);
  else body = bars(values, kind);
  return svgShell(`${kind.replace(/-/g, " ")} for this problem`, body);
}

function interactiveTool(item, open = false) {
  const details = el("details", "sg-math-tool");
  details.open = open;
  details.appendChild(el("summary", null, "🧰 Open the interactive math tool"));
  const body = el("div", "sg-tool-body");
  const hasValues = valuesFrom(item.visual, item.stem, item.steps).length > 0;
  body.appendChild(
    el(
      "p",
      "sg-tool-directions",
      hasValues
        ? "Move the slider to reveal more of the model, then tap useful values to build your plan."
        : "Move the slider to reveal more of the model.",
    ),
  );
  const sliderRow = el("label", "sg-model-slider");
  sliderRow.appendChild(el("span", null, "Show model detail"));
  const slider = el("input");
  slider.type = "range";
  slider.min = "1";
  slider.max = "3";
  slider.value = "1";
  const DETAIL_LEVELS = ["Basic model", "With structure hints", "With strategy labels"];
  const update = () => {
    const card = details.closest(".prob");
    card?.classList.toggle("sg-show-layer-2", Number(slider.value) >= 2);
    card?.classList.toggle("sg-show-layer-3", Number(slider.value) >= 3);
    slider.setAttribute("aria-valuetext", DETAIL_LEVELS[Number(slider.value) - 1]);
  };
  slider.setAttribute("aria-valuetext", DETAIL_LEVELS[0]);
  slider.oninput = update;
  sliderRow.appendChild(slider);
  body.appendChild(sliderRow);
  const values = valuesFrom(item.visual, item.stem, item.steps);
  if (values.length) {
    const tray = el("div", "sg-value-tray");
    const work = el("div", "sg-value-work");
    work.appendChild(el("span", "sg-model-label", "My model:"));
    const expression = el("div", "sg-model-expression");
    const addToken = (value) => {
      const token = el("button", "sg-work-chip", esc(value));
      token.type = "button";
      token.setAttribute("aria-label", `Remove ${value} from my model`);
      token.title = "Tap to remove";
      token.onclick = () => token.remove();
      expression.appendChild(token);
    };
    values.forEach((value) => {
      const chip = el("button", "sg-value-chip", esc(value));
      chip.type = "button";
      chip.setAttribute("aria-label", `Add ${value} to my model`);
      chip.onclick = () => addToken(value);
      tray.appendChild(chip);
    });
    const operators = el("div", "sg-operator-tray");
    ["+", "−", "×", "÷", "=", "(", ")"].forEach((operator) => {
      const chip = el("button", "sg-value-chip sg-operator-chip", operator);
      chip.type = "button";
      chip.setAttribute("aria-label", `Add ${operator} to my model`);
      chip.onclick = () => addToken(operator);
      operators.appendChild(chip);
    });
    const clear = el("button", "btn ghost sg-clear-model", "Clear my model");
    clear.type = "button";
    clear.onclick = () => expression.replaceChildren();
    work.append(expression, clear);
    body.append(tray, operators, work);
  }
  details.appendChild(body);
  return details;
}

function guidedSteps(item, mode, events = {}) {
  const steps = item.steps || [];
  if (!steps.length) return null;
  let body = null;
  // Programmatic completion used by the typed models: filling the model
  // correctly completes the matching step through its own check path.
  const completeStep = (index, value) => {
    const row = body?.querySelectorAll(".sg-fill-step")[index];
    if (!row || row.classList.contains("complete")) return;
    const input = row.querySelector("input");
    const check = row.querySelector("button");
    if (!input || input.disabled) return;
    input.value = String(value);
    check.click();
  };
  const completeMatching = (value) => {
    const rows = body?.querySelectorAll(".sg-fill-step") || [];
    for (let index = 0; index < steps.length; index++) {
      if (rows[index]?.classList.contains("complete")) continue;
      if (isRight(String(value), steps[index].answer)) {
        completeStep(index, steps[index].answer);
        return;
      }
    }
  };
  const wrap = el(mode === "guided" ? "div" : "details", "sg-guided-steps");
  if (mode !== "guided") wrap.appendChild(el("summary", null, "Need the guided steps?"));
  body = el("div", "sg-step-sequence");
  body.appendChild(
    el("p", "sg-step-intro", "Complete one small step. A correct step unlocks the next one."),
  );
  steps.forEach((step, index) => {
    const row = el("div", `sg-fill-step${index ? " locked" : ""}`);
    row.hidden = index > 0;
    row.appendChild(el("span", "sg-fill-number", String(index + 1)));
    const prompt = el("label", "sg-fill-prompt");
    const [before, ...after] = String(step.prompt).split("___");
    prompt.appendChild(document.createTextNode(before));
    const input = el("input", "sg-step-input");
    input.type = "text";
    input.setAttribute("aria-label", `Step ${index + 1} answer`);
    prompt.appendChild(input);
    prompt.appendChild(document.createTextNode(after.join("___")));
    if (step.promptEs && esLane()) {
      const spanish = el("span", "sg-es", esc(String(step.promptEs).replace("___", "____")));
      spanish.lang = "es";
      prompt.appendChild(spanish);
    }
    const check = el("button", "btn sg-step-check", "Check step");
    check.type = "button";
    const status = el("span", "sg-step-status");
    status.setAttribute("aria-live", "polite");
    check.onclick = () => {
      const correct = isRight(input.value, step.answer);
      events.onAttempt?.({ correct });
      if (!correct) {
        status.textContent = "Not yet—use the visual or open the tool, then try again.";
        row.classList.add("needs-revision");
        return;
      }
      input.disabled = true;
      check.disabled = true;
      row.classList.remove("needs-revision");
      row.classList.add("complete");
      // The student's correct step reveals the matching piece of the model.
      row.closest(".prob")?.classList.add(`sg-done-${index + 1}`);
      status.textContent = "Correct. Next step unlocked.";
      const next = body.querySelectorAll(".sg-fill-step")[index + 1];
      if (next) {
        next.hidden = false;
        next.classList.remove("locked");
      }
    };
    input.onkeydown = (event) => {
      if (event.key === "Enter") check.click();
    };
    row.append(prompt, check, status);
    body.appendChild(row);
  });
  wrap.appendChild(body);
  return { node: wrap, completeStep, completeMatching };
}

// ── Typed models: the model itself is the student's workspace ────────────
// Students type values directly into the model; correct entries lock in and
// auto-complete the matching guided step below. Wrong entries never reveal.

function modelCell(expected, events, { placeholder = "?", label = "Model value", onCorrect } = {}) {
  const input = el("input", "sg-model-cell");
  input.type = "text";
  input.inputMode = "decimal";
  input.placeholder = placeholder;
  input.setAttribute("aria-label", label);
  const check = () => {
    if (input.disabled || !input.value.trim()) return;
    const correct = isRight(input.value, expected);
    events.onAttempt?.({ correct });
    input.classList.toggle("bad", !correct);
    if (!correct) return;
    input.classList.add("ok");
    input.disabled = true;
    onCorrect?.(input);
  };
  input.onkeydown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      check();
    }
  };
  input.addEventListener("blur", check);
  input.oninput = () => input.classList.remove("bad");
  return input;
}

function modelShell(title, hint) {
  const node = el("div", "sg-problem-model");
  node.appendChild(el("div", "sg-model-title", esc(title)));
  if (hint) node.appendChild(el("p", "sg-model-hint", esc(hint)));
  return node;
}

function modelStatus() {
  const status = el("p", "sg-model-status");
  status.setAttribute("aria-live", "polite");
  return status;
}

// Smallest-prime factor chain for the whole tree: peel the smallest prime off
// the value, recurse on the cofactor, and keep going until the cofactor is
// itself prime. Returns one split per level, so 66 → [{value:66,prime:2,
// cofactor:33}, {value:33,prime:3,cofactor:11 (prime leaf)}].
function smallestPrimeFactor(n) {
  if (n % 2 === 0) return 2;
  for (let p = 3; p * p <= n; p += 2) if (n % p === 0) return p;
  return n; // n is prime
}

function factorChain(n) {
  const splits = [];
  let current = n;
  while (current >= 2 && smallestPrimeFactor(current) !== current) {
    const prime = smallestPrimeFactor(current);
    const cofactor = current / prime;
    splits.push({
      value: current,
      prime,
      cofactor,
      cofactorPrime: smallestPrimeFactor(cofactor) === cofactor,
    });
    current = cofactor;
  }
  return splits;
}

function typedFactorTree(item, steps, events) {
  const value = Number(item.visual?.value ?? valuesFrom(item.visual, item.stem)[0]);
  if (!Number.isInteger(value) || value < 4 || value > 1000) return null;
  const splits = factorChain(value);
  if (!splits.length) return null; // a prime value has no tree to build
  const shell = modelShell(
    "Build the whole factor tree",
    "Split each composite number all the way down. Fill in both factors at every branch until every leaf is a prime you cannot split.",
  );
  const status = modelStatus();
  const tree = el("div", "sg-tree");
  // Ascending list of primes (smallest peeled first) drives the final product.
  const primes = [...splits.map((split) => split.prime), splits[splits.length - 1].cofactor];
  const productAnswer =
    item.answer || item.steps?.[item.steps.length - 1]?.answer || primes.join(" × ");
  const levels = [];
  let branchesBuilt = 0;

  splits.forEach((split, index) => {
    const level = el("div", `sg-tree-level${index ? " locked" : ""}`);
    if (index) level.hidden = true;
    // The value being split is known: the root is given; a deeper value was
    // just typed as the previous branch's cofactor, so we can name it here.
    level.appendChild(el("div", "sg-tree-node", esc(split.value)));
    level.appendChild(el("div", "sg-tree-branches", "╱&nbsp;&nbsp;&nbsp;&nbsp;╲"));
    const row = el("div", "sg-model-boxes sg-tree-row");
    let leftDone = false;
    let rightDone = false;
    const advance = () => {
      if (!(leftDone && rightDone)) return;
      const next = levels[index + 1];
      if (next) {
        next.hidden = false;
        next.classList.remove("locked");
        status.textContent = `Branch built ✓ — now split ${split.cofactor} the same way.`;
      } else {
        branchesBuilt = splits.length;
        status.textContent = "Every leaf is prime ✓ — write the prime factorization below.";
      }
    };
    row.append(
      modelCell(split.prime, events, {
        placeholder: "prime",
        label: `Smallest prime factor of ${split.value}`,
        onCorrect: () => {
          leftDone = true;
          steps?.completeMatching(split.prime);
          advance();
        },
      }),
      modelCell(split.cofactor, events, {
        placeholder: split.cofactorPrime ? "prime" : "?",
        label: `The other factor of ${split.value}`,
        onCorrect: () => {
          rightDone = true;
          steps?.completeMatching(split.cofactor);
          advance();
        },
      }),
    );
    level.appendChild(row);
    levels.push(level);
    tree.appendChild(level);
  });

  // Collect the whole factorization as a product of primes.
  const finalWrap = el("div", "sg-tree-final");
  finalWrap.appendChild(el("span", "sg-model-rowlab", "Prime factorization (product of primes):"));
  finalWrap.appendChild(
    modelCell(productAnswer, events, {
      placeholder: primes.join("×"),
      label: "Prime factorization written as a product of primes",
      onCorrect: () => {
        steps?.completeMatching(productAnswer);
        status.textContent = "Factor tree complete ✓ — every branch ends in a prime.";
      },
    }),
  );
  tree.appendChild(finalWrap);
  shell.append(tree, status);
  return shell;
}

function typedFactorLists(item, steps, events) {
  const [a, b] = (item.visual?.values || []).map(Number);
  if (!a || !b || a > 200 || b > 200) return null;
  const lists = [listFactors(a), listFactors(b)];
  const shell = modelShell(
    "Build both factor lists",
    "Type the factors in any order — factors in both lists turn gold.",
  );
  const status = modelStatus();
  const found = [new Set(), new Set()];
  const cells = [new Map(), new Map()];
  let rowsDone = 0;
  const row = (value, rowIndex) => {
    const factors = lists[rowIndex];
    const wrapRow = el("div", "sg-model-row");
    wrapRow.appendChild(el("span", "sg-model-rowlab", `Factors of ${value}:`));
    const boxes = el("div", "sg-model-boxes");
    factors.forEach(() => {
      const input = el("input", "sg-model-cell");
      input.type = "text";
      input.inputMode = "numeric";
      input.placeholder = "?";
      input.setAttribute("aria-label", `A factor of ${value}`);
      const check = () => {
        if (input.disabled || !input.value.trim()) return;
        const typed = Number(input.value.trim());
        const valid =
          Number.isInteger(typed) && factors.includes(typed) && !found[rowIndex].has(typed);
        events.onAttempt?.({ correct: valid });
        if (!valid) {
          input.classList.add("bad");
          return;
        }
        input.classList.remove("bad");
        input.classList.add("ok");
        input.disabled = true;
        found[rowIndex].add(typed);
        cells[rowIndex].set(typed, input);
        const other = 1 - rowIndex;
        if (found[other].has(typed)) {
          input.classList.add("gold");
          cells[other].get(typed)?.classList.add("gold");
        }
        if (found[rowIndex].size === factors.length) {
          steps?.completeStep(rowIndex, factors.join(", "));
          status.textContent =
            ++rowsDone === 2
              ? "Both lists complete ✓ — the gold matches are shared. Which is greatest?"
              : "List complete ✓ — now the other number.";
        }
      };
      input.onkeydown = (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          check();
        }
      };
      input.addEventListener("blur", check);
      input.oninput = () => input.classList.remove("bad");
      boxes.appendChild(input);
    });
    wrapRow.appendChild(boxes);
    return wrapRow;
  };
  shell.append(row(a, 0), row(b, 1), status);
  return shell;
}

function typedLanes(item, steps, events) {
  const [a, b] = (item.visual?.values || []).map(Number);
  if (!a || !b) return null;
  let x = a;
  let y = b;
  while (y) [x, y] = [y, x % y];
  const target = (a * b) / x;
  if (target / a > 8 || target / b > 8) return null;
  const shell = modelShell(
    "Count up both lanes",
    `Type the multiples of ${a} and ${b} in order. Your first match turns gold.`,
  );
  const status = modelStatus();
  let matched = false;
  const lane = (base) => {
    const wrapRow = el("div", "sg-model-row");
    wrapRow.appendChild(el("span", "sg-model-rowlab", `×${base}:`));
    const boxes = el("div", "sg-model-boxes");
    for (let index = 1; index <= target / base; index++) {
      const expected = base * index;
      boxes.appendChild(
        modelCell(expected, events, {
          label: `Multiple ${index} of ${base}`,
          onCorrect: (cell) => {
            if (expected !== target) return;
            cell.classList.add("gold");
            if (!matched) {
              matched = true;
              steps?.completeMatching(target);
              status.textContent = `${target} lives in both lanes — that is the least common multiple.`;
            }
          },
        }),
      );
    }
    wrapRow.appendChild(boxes);
    return wrapRow;
  };
  shell.append(lane(a), lane(b), status);
  return shell;
}

// Traditional long division the student works the WHOLE way through: for each
// digit of the dividend they enter how many times the divisor goes in, the
// product to subtract, and what is left, then bring down the next digit — instead
// of only typing a final quotient + remainder. Each blank is a checkable cell.
function typedDivision(item, steps, events) {
  const [dividend, divisor] = (item.visual?.values || []).map(Number);
  if (!dividend || !divisor) return null;

  const digits = String(dividend).split("");
  const stepData = [];
  let carry = 0;
  for (let i = 0; i < digits.length; i++) {
    const work = carry * 10 + Number(digits[i]);
    const q = Math.floor(work / divisor);
    const prod = q * divisor;
    const diff = work - prod;
    stepData.push({ work, q, prod, diff, bringNext: digits[i + 1] ?? null });
    carry = diff;
  }
  const quotient = Math.floor(dividend / divisor);
  const remainder = dividend % divisor;

  const shell = modelShell(
    "Work the long division",
    "For each step: how many times does the divisor go in, multiply, subtract, then bring down the next digit.",
  );
  const status = modelStatus();
  shell.appendChild(el("div", "sg-div-bracket", `${esc(divisor)} ⟌ ${esc(dividend)}`));

  const ledger = el("div", "sg-div-ledger");
  ledger.style.cssText = "display:flex; flex-direction:column; gap:10px; margin:8px 0;";
  const totalCells = stepData.length * 3;
  let solved = 0;
  const bump = (val) => {
    solved += 1;
    steps?.completeMatching(val);
    if (solved >= totalCells) status.textContent = "Long division complete ✓";
  };
  const opText = (t) => {
    const s = el("span", "sg-div-op", t);
    s.style.cssText = "font-weight:700; color:var(--navy,#12355b);";
    return s;
  };

  stepData.forEach((s, i) => {
    const block = el("div", "sg-div-step");
    block.style.cssText =
      "border:1px solid var(--line,#cbd5e1); border-radius:8px; padding:8px 10px; background:#fff;";
    const lab = el("div", "sg-div-steplab", `Step ${i + 1}`);
    lab.style.cssText = "font-weight:800; color:var(--navy,#12355b); margin-bottom:4px;";
    block.appendChild(lab);

    const line1 = el("div", "sg-div-line");
    line1.style.cssText = "display:flex; flex-wrap:wrap; align-items:center; gap:6px;";
    line1.append(opText(`${divisor} goes into ${s.work}`));
    line1.appendChild(
      modelCell(s.q, events, {
        label: `Step ${i + 1}: how many times ${divisor} goes into ${s.work}`,
        onCorrect: () => bump(s.q),
      }),
    );
    line1.append(opText("time(s)"));
    block.appendChild(line1);

    const line2 = el("div", "sg-div-line");
    line2.style.cssText =
      "display:flex; flex-wrap:wrap; align-items:center; gap:6px; margin-top:6px;";
    line2.append(opText(`Multiply: ${divisor} × (that) =`));
    line2.appendChild(
      modelCell(s.prod, events, {
        label: `Step ${i + 1}: product ${divisor} times the quotient digit`,
        onCorrect: () => bump(s.prod),
      }),
    );
    line2.append(opText(`Subtract: ${s.work} − (that) =`));
    line2.appendChild(
      modelCell(s.diff, events, {
        label: `Step ${i + 1}: what is left after subtracting`,
        onCorrect: () => bump(s.diff),
      }),
    );
    if (s.bringNext != null) line2.append(opText(`↓ bring down ${s.bringNext}`));
    block.appendChild(line2);
    ledger.appendChild(block);
  });

  const answer = el("div", "sg-model-row");
  answer.style.cssText =
    "display:flex; flex-wrap:wrap; gap:10px; align-items:center; margin-top:4px;";
  const q = el("strong", null, String(quotient));
  const r = el("strong", null, String(remainder));
  answer.append(
    el("span", "sg-model-rowlab", "Quotient:"),
    q,
    el("span", "sg-model-rowlab", "Remainder:"),
    r,
  );

  shell.append(ledger, answer, status);
  return shell;
}

// Interactive number line: tap where the integer sits, and its distance from 0
// (its absolute value) is measured with a bracket — turning a static picture +
// open box into a model students act on. Auto-completes the matching guided step.
function typedNumberLine(item, steps, events) {
  const value = Number(item.visual?.value);
  if (!Number.isFinite(value)) return null;
  const lo = Math.min(0, value) - 1;
  const hi = Math.max(0, value) + 1;
  const span = hi - lo;
  const W = 520;
  const H = 118;
  const padX = 32;
  const axisY = 58;
  const xOf = (k) => padX + ((k - lo) / span) * (W - 2 * padX);

  let ticks = "";
  for (let k = lo; k <= hi; k++) {
    const x = xOf(k).toFixed(1);
    const zero = k === 0;
    ticks +=
      `<line x1="${x}" y1="${axisY - 8}" x2="${x}" y2="${axisY + 8}" stroke="#12355b" stroke-width="${zero ? 3 : 1.5}"/>` +
      `<text x="${x}" y="${axisY + 26}" text-anchor="middle" font-size="12" fill="#54677c" font-weight="${zero ? 800 : 500}">${k}</text>` +
      `<circle class="nl-hit" data-n="${k}" cx="${x}" cy="${axisY}" r="13" fill="transparent" style="cursor:pointer"/>`;
  }
  const shell = modelShell(
    "Plot it on the number line",
    "Tap where the number lands, then read how far it is from 0.",
  );
  const status = modelStatus();
  const wrap = el("div", "sg-nl");
  wrap.style.cssText = "width:100%; max-width:520px; margin:6px auto;";
  wrap.innerHTML =
    `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Number line from ${lo} to ${hi}">` +
    `<line x1="${xOf(lo).toFixed(1)}" y1="${axisY}" x2="${xOf(hi).toFixed(1)}" y2="${axisY}" stroke="#12355b" stroke-width="3"/>` +
    `<polygon points="${(xOf(hi) + 8).toFixed(1)},${axisY} ${xOf(hi).toFixed(1)},${axisY - 5} ${xOf(hi).toFixed(1)},${axisY + 5}" fill="#12355b"/>` +
    `<polygon points="${(xOf(lo) - 8).toFixed(1)},${axisY} ${xOf(lo).toFixed(1)},${axisY - 5} ${xOf(lo).toFixed(1)},${axisY + 5}" fill="#12355b"/>` +
    ticks +
    `<g class="nl-mark"></g></svg>`;

  const dist = Math.abs(value);
  let done = false;
  const mark = wrap.querySelector(".nl-mark");
  wrap.querySelectorAll(".nl-hit").forEach((hit) => {
    hit.addEventListener("click", () => {
      if (done) return;
      const k = Number(hit.dataset.n);
      if (k !== value) {
        hit.setAttribute("fill", "#fdeceb");
        setTimeout(() => hit.setAttribute("fill", "transparent"), 260);
        events.onAttempt?.({ correct: false });
        return;
      }
      done = true;
      events.onAttempt?.({ correct: true });
      const x0 = xOf(0);
      const xv = xOf(value);
      const bracketY = axisY - 20;
      const midX = (x0 + xv) / 2;
      mark.innerHTML =
        `<circle cx="${xv.toFixed(1)}" cy="${axisY}" r="9" fill="#1d4ed8" stroke="#fff" stroke-width="2"/>` +
        `<path d="M${x0.toFixed(1)} ${axisY - 6} V${bracketY} H${xv.toFixed(1)} V${axisY - 6}" fill="none" stroke="#0d7a76" stroke-width="2"/>` +
        `<text x="${midX.toFixed(1)}" y="${bracketY - 4}" text-anchor="middle" font-size="13" font-weight="800" fill="#0d7a76">${dist} from 0</text>`;
      status.textContent = `Distance from 0 is ${dist}. |${value}| = ${dist} ✓`;
      status.className = "sg-model-status";
      steps?.completeMatching(dist);
    });
  });

  shell.append(wrap, status);
  return shell;
}

// Interactive double-rate bars: two bar-model rows drawn to the real gold:blue
// proportions so students SEE which ratio packs more gold per blue, then click
// the bar with FEWER gold per blue to answer. The guided steps still carry the
// numeric division; this makes the comparison a model, not an open box.
function typedRateBars(item, steps, events) {
  const vals = (item.visual?.values || []).map(Number);
  if (vals.length < 4 || vals.some((v) => !Number.isFinite(v) || v <= 0)) return null;
  const [a, b, c, d] = vals;
  // Ratio blue:gold = a:b and c:d → gold per blue = b/a and d/c (matches the
  // authored steps "gold per blue: b ÷ a").
  const r1 = b / a;
  const r2 = d / c;
  const answer = String(item.answer || "")
    .trim()
    .toLowerCase();
  const target = answer.includes("second") ? "second" : "first"; // which has FEWER

  const shell = modelShell(
    "Compare gold per blue",
    "Each row shows one ratio's gold tiles for every blue tile. Tap the row with FEWER gold per blue.",
  );
  const status = modelStatus();
  const maxRate = Math.max(r1, r2, 1);
  const rows = el("div", "sg-rate-rows");
  rows.style.cssText = "display:flex; flex-direction:column; gap:10px; margin:8px 0;";
  let done = false;
  const makeRow = (label, rate, which) => {
    const row = el("button", "sg-rate-row");
    row.type = "button";
    row.style.cssText =
      "display:flex; align-items:center; gap:10px; width:100%; text-align:left; background:#fff; border:2px solid var(--line,#cbd5e1); border-radius:10px; padding:8px 10px; cursor:pointer;";
    const tag = el("span", null, label);
    tag.style.cssText = "font-weight:800; color:var(--navy,#12355b); min-width:58px;";
    const track = el("div");
    track.style.cssText =
      "flex:1; height:20px; background:#eef4fb; border-radius:6px; overflow:hidden;";
    const fill = el("div");
    fill.style.cssText = `height:100%; width:${((rate / maxRate) * 100).toFixed(1)}%; background:#d4952a; border-radius:6px;`;
    track.appendChild(fill);
    const num = el("span", null, `${(Math.round(rate * 100) / 100).toString()} /blue`);
    num.style.cssText =
      "font-weight:700; color:var(--muted,#54677c); min-width:70px; text-align:right;";
    row.append(tag, track, num);
    row.addEventListener("click", () => {
      if (done) return;
      const correct = which === target;
      events.onAttempt?.({ correct });
      if (!correct) {
        row.style.borderColor = "#d9534f";
        row.style.background = "#fdeceb";
        setTimeout(() => {
          row.style.borderColor = "var(--line,#cbd5e1)";
          row.style.background = "#fff";
        }, 320);
        return;
      }
      done = true;
      row.style.borderColor = "#0d7a76";
      row.style.background = "#e2f9f5";
      status.textContent = `Yes — the ${target} ratio has fewer gold per blue ✓`;
      steps?.completeMatching(item.answer);
    });
    return row;
  };
  rows.append(makeRow("First", r1, "first"), makeRow("Second", r2, "second"));
  shell.append(rows, status);
  return shell;
}

function typedTable(item, steps, events, kind) {
  const values = valuesFrom(item.visual, item.stem);
  const [first, second] = values.map(Number);
  let headers = null;
  let rows = null;
  if (kind.includes("unit-rate")) {
    headers = ["Items", "Cost"];
    rows = [
      [first, `$${second}`],
      [1, { expected: item.answer, label: "Cost for 1 item" }],
    ];
  } else if (kind.includes("conversion")) {
    headers = ["Larger unit", "Smaller units"];
    rows = [
      [1, second],
      [first, { expected: item.answer, label: "Converted amount" }],
    ];
  } else if (kind.includes("ratio")) {
    const scaledFirst = item.steps?.[0]?.answer;
    const scaledSecond = item.steps?.[1]?.answer;
    if (scaledFirst == null || scaledSecond == null) return null;
    headers = ["First", "Second"];
    rows = [
      [first, second],
      [
        { expected: scaledFirst, label: "Scaled first value" },
        { expected: scaledSecond, label: "Scaled second value" },
      ],
    ];
  } else return null;
  const shell = modelShell("Complete the table", "Type the missing values to finish the model.");
  const table = el("div", "sg-model-table");
  const addCell = (content, isHead) => {
    const cellNode = el("div", `sg-model-tcell${isHead ? " head" : ""}`);
    if (content && typeof content === "object") {
      cellNode.appendChild(
        modelCell(content.expected, events, {
          label: content.label,
          onCorrect: () => steps?.completeMatching(content.expected),
        }),
      );
    } else cellNode.textContent = String(content);
    table.appendChild(cellNode);
  };
  headers.forEach((header) => addCell(header, true));
  for (const rowCells of rows) for (const cellContent of rowCells) addCell(cellContent, false);
  shell.appendChild(table);
  return shell;
}

function typedPercentBar(item, steps, events) {
  const visual = item.visual || {};
  const whole = Number(visual.whole);
  const percent = Number(visual.percent);
  const amount = item.steps?.[1]?.answer;
  if (!whole || !percent || amount == null) return null;
  const shell = modelShell("Read the percent bar", `${percent}% of ${whole}`);
  shell.insertAdjacentHTML(
    "beforeend",
    svgShell(
      `${percent} percent of ${whole} bar model`,
      percentModel(visual, [percent], "percent-bar"),
    ),
  );
  const row = el("div", "sg-model-row");
  row.append(
    el("span", "sg-model-rowlab", "The shaded part is worth:"),
    modelCell(amount, events, {
      label: "Value of the shaded part",
      onCorrect: () => steps?.completeMatching(amount),
    }),
  );
  shell.appendChild(row);
  return shell;
}

function typedInequality(item, steps, events) {
  const visual = item.visual || {};
  const boundary = visual.boundary;
  const symbol = visual.symbol;
  if (boundary == null || !symbol) return null;
  const shell = modelShell(
    "Build the graph",
    "Type the boundary value, then choose the symbol — the graph draws itself.",
  );
  shell.insertAdjacentHTML(
    "beforeend",
    svgShell("inequality number line", inequalityLine(visual, [])),
  );
  const boundaryRow = el("div", "sg-model-row");
  boundaryRow.append(
    el("span", "sg-model-rowlab", "Boundary:"),
    modelCell(boundary, events, {
      label: "Boundary value",
      onCorrect: (cell) => {
        cell.closest(".prob")?.classList.add("sg-done-1");
        steps?.completeMatching(boundary);
      },
    }),
  );
  const symbolRow = el("div", "sg-model-row");
  symbolRow.appendChild(el("span", "sg-model-rowlab", "Symbol:"));
  for (const candidate of ["<", "≤", ">", "≥"]) {
    const button = el("button", "sg-model-sym", esc(candidate));
    button.type = "button";
    button.onclick = () => {
      if (button.disabled) return;
      const correct = candidate === symbol;
      events.onAttempt?.({ correct });
      button.classList.add(correct ? "ok" : "bad");
      if (!correct) {
        button.disabled = true;
        return;
      }
      for (const other of symbolRow.querySelectorAll("button")) other.disabled = true;
      button.closest(".prob")?.classList.add("sg-done-2", "sg-done-3");
      steps?.completeMatching(symbol);
    };
    symbolRow.appendChild(button);
  }
  shell.append(boundaryRow, symbolRow);
  return shell;
}

function typedFraction(item, steps, events) {
  const left = item.visual?.left;
  const right = item.visual?.right;
  if (!left?.d || !right?.d) return null;
  const shell = modelShell(
    "Keep · flip · multiply",
    "Type the reciprocal of the second fraction — flip it upside down.",
  );
  shell.insertAdjacentHTML(
    "beforeend",
    svgShell("fraction bars for this problem", fractionBars(item.visual, [])),
  );
  const status = modelStatus();
  const row = el("div", "sg-model-row");
  row.appendChild(el("span", "sg-model-rowlab", `Reciprocal of ${right.n}/${right.d} =`));
  let built = 0;
  const finish = () => {
    if (++built < 2) return;
    steps?.completeMatching(`${right.d}/${right.n}`);
    status.textContent = "Flipped ✓ — now multiply straight across.";
  };
  const stack = el("span", "sg-frac-stack");
  stack.append(
    modelCell(right.d, events, { label: "Reciprocal numerator", onCorrect: finish }),
    el("span", "sg-frac-bar"),
    modelCell(right.n, events, { label: "Reciprocal denominator", onCorrect: finish }),
  );
  row.appendChild(stack);
  shell.append(row, status);
  return shell;
}

function typedPlot(item, steps, events) {
  const visual = item.visual || {};
  let expected = visual.point || visual.points?.[0] || null;
  if (!expected && String(visual.kind).includes("coordinate-ratio")) {
    const x = Number(item.steps?.[0]?.answer);
    const y = Number(item.steps?.[1]?.answer);
    if (Number.isFinite(x) && Number.isFinite(y)) expected = [x, y];
  }
  if (!expected) return null;
  const targetX = Number(expected[0]);
  const targetY = Number(expected[1]);
  if (!Number.isFinite(targetX) || !Number.isFinite(targetY)) return null;
  const maxAbs = Math.max(1, Math.abs(targetX), Math.abs(targetY));
  const { stepX, stepY } = gridScale(maxAbs);
  const shell = modelShell(
    "Plot the point",
    "Read the numbered axes, then tap where the point belongs.",
  );
  const status = modelStatus();
  shell.insertAdjacentHTML(
    "beforeend",
    svgShell("numbered coordinate grid — tap to plot", coordinatePlane(stepX, stepY)),
  );
  const svg = shell.querySelector("svg");
  svg.classList.add("sg-plot-grid");
  let solved = false;
  svg.addEventListener("click", (clickEvent) => {
    if (solved) return;
    const box = svg.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const viewX = ((clickEvent.clientX - box.left) / box.width) * 640;
    const viewY = ((clickEvent.clientY - box.top) / box.height) * 300;
    const gridX = Math.round((viewX - 320) / stepX);
    const gridY = Math.round((150 - viewY) / stepY);
    const correct = gridX === targetX && gridY === targetY;
    events.onAttempt?.({ correct });
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    marker.setAttribute("cx", String(320 + gridX * stepX));
    marker.setAttribute("cy", String(150 - gridY * stepY));
    marker.setAttribute("r", "13");
    marker.setAttribute("fill", correct ? "var(--sg-pop)" : "rgba(189,60,49,.55)");
    marker.setAttribute("stroke", correct ? "var(--sg-deep)" : "#bd3c31");
    marker.setAttribute("stroke-width", "4");
    svg.appendChild(marker);
    if (!correct) {
      status.textContent = `You tapped (${gridX}, ${gridY}). Compare it with the point you need.`;
      window.setTimeout(() => marker.remove(), 900);
      return;
    }
    solved = true;
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", String(332 + gridX * stepX));
    label.setAttribute("y", String(136 - gridY * stepY));
    label.textContent = `(${targetX}, ${targetY})`;
    svg.appendChild(label);
    status.textContent = `Plotted (${targetX}, ${targetY}) ✓`;
    steps?.completeMatching(targetX);
    steps?.completeMatching(targetY);
  });
  shell.appendChild(status);
  return shell;
}

const SHAPE_LABELS = {
  "parallelogram-area": ["base", "height"],
  "triangle-area": ["base", "height"],
  "trapezoid-area": ["first base", "second base", "height"],
  "polygon-triangles": ["triangle base", "triangle height"],
  "volume-prism": ["length", "width", "height"],
  "surface-prism": ["length", "width", "height"],
  "prism-net": ["length", "width", "height"],
  "pyramid-net": ["base edge", "slant height"],
};

function typedShape(item, events, kind) {
  const labels = SHAPE_LABELS[kind];
  const values = (item.visual?.values || []).map(Number);
  if (!labels || labels.length > values.length) return null;
  const shell = modelShell(
    "Label the figure",
    "Find each measurement in the problem and type it where it belongs.",
  );
  shell.insertAdjacentHTML(
    "beforeend",
    svgShell(`${kind.replace(/-/g, " ")} figure`, shapeModel(values, kind)),
  );
  const status = modelStatus();
  let labeled = 0;
  labels.forEach((label, index) => {
    const row = el("div", "sg-model-row");
    row.append(
      el("span", "sg-model-rowlab", `${label} =`),
      modelCell(values[index], events, {
        label: `Value of the ${label}`,
        onCorrect: () => {
          if (++labeled === labels.length)
            status.textContent = "Every measurement labeled ✓ — now compute in the steps below.";
        },
      }),
    );
    shell.appendChild(row);
  });
  shell.appendChild(status);
  return shell;
}

function typedTiles(item, steps, events) {
  const [coefficient, constant] = (item.visual?.values || []).map(Number);
  if (!Number.isFinite(coefficient) || !Number.isFinite(constant)) return null;
  const shell = modelShell(
    "Build it with tiles",
    "Add x-tiles and 1-tiles until your build matches the expression.",
  );
  const status = modelStatus();
  const tray = el("div", "sg-model-boxes sg-tile-tray");
  tray.setAttribute("aria-label", "Your tiles");
  const counts = { x: 0, one: 0 };
  const addTile = (type) => {
    counts[type]++;
    const tile = el(
      "button",
      `sg-tile ${type === "x" ? "is-x" : "is-one"}`,
      type === "x" ? "x" : "1",
    );
    tile.type = "button";
    tile.setAttribute("aria-label", `Remove one ${type === "x" ? "x" : "unit"} tile`);
    tile.onclick = () => {
      counts[type]--;
      tile.remove();
    };
    tray.appendChild(tile);
  };
  const controls = el("div", "sg-model-row");
  const addX = el("button", "btn ghost", "+ x tile");
  const addOne = el("button", "btn ghost", "+ 1 tile");
  const checkBuild = el("button", "btn", "Check my build");
  for (const button of [addX, addOne, checkBuild]) button.type = "button";
  addX.onclick = () => addTile("x");
  addOne.onclick = () => addTile("one");
  checkBuild.onclick = () => {
    const correct = counts.x === coefficient && counts.one === constant;
    events.onAttempt?.({ correct });
    if (!correct) {
      status.textContent = `You built ${counts.x} x-tile${counts.x === 1 ? "" : "s"} and ${counts.one} unit tile${counts.one === 1 ? "" : "s"}. Re-read the expression and adjust.`;
      return;
    }
    checkBuild.disabled = addX.disabled = addOne.disabled = true;
    status.textContent = "Build matches ✓";
    steps?.completeMatching(`${coefficient}x`);
    steps?.completeMatching(constant);
  };
  controls.append(addX, addOne, checkBuild);
  shell.append(controls, tray, status);
  return shell;
}

function typedPower(item, steps, events) {
  const [base, exponent] = (item.visual?.values || []).map(Number);
  if (!base || !exponent || exponent > 6) return null;
  const shell = modelShell(
    "Unroll the power",
    `Write ${base}^${exponent} as repeated multiplication — one factor per box.`,
  );
  const status = modelStatus();
  const row = el("div", "sg-model-boxes");
  let filled = 0;
  for (let index = 0; index < exponent; index++) {
    if (index) row.appendChild(el("span", "sg-model-rowlab", "×"));
    row.appendChild(
      modelCell(base, events, {
        label: `Factor ${index + 1}`,
        onCorrect: () => {
          if (++filled === exponent) {
            steps?.completeMatching(Array(exponent).fill(base).join(" × "));
            status.textContent = "Unrolled ✓ — now multiply the factors.";
          }
        },
      }),
    );
  }
  shell.append(row, status);
  return shell;
}

function typedModel(item, steps, events) {
  const kind = String(item.visual?.kind || "");
  if (!kind) return null;
  try {
    // Data figures (dot plot / histogram / box plot / bar chart / data-dots)
    // become the "Data Live" explore widget: tap to read, reveal the measures
    // of center & spread. The What-if sandbox is OFF here so a practice figure's
    // data can never be altered out from under the question.
    if (DATA_KINDS.has(kind)) {
      const box = el("div", "sg-data-live");
      const handle = renderDataLive(box, item.visual, { sandbox: false });
      if (handle) return box;
    }
    // Distributive expansion a(x + c) → interactive area-model tile builder.
    // Gated to genuine "Expand …" items so it never mismodels another concept;
    // falls through to the static figure otherwise.
    if (kind === "algebra-tiles" && /expand/i.test(item.stem || "")) {
      const box = el("div", "sg-atx");
      const handle = renderAlgebraExpand(box, item.visual);
      if (handle) return box;
    }
    // Percent grid → non-destructive hundred-grid equivalence explorer (loads
    // with the authored amount shaded; reveal percent / decimal / fraction).
    if (kind === "percent-grid") {
      const box = el("div", "sg-pgl");
      const handle = renderPercentGridLab(box, item.visual);
      if (handle) return box;
    }
    if (kind.includes("balance") || kind.includes("equation")) {
      const bal = typedBalance(item);
      if (bal) return bal;
    }
    if (kind.includes("factor-table")) return typedFactorLists(item, steps, events);
    if (kind.includes("multiple-lanes")) return typedLanes(item, steps, events);
    if (kind.includes("factor-tree")) return typedFactorTree(item, steps, events);
    if (kind.includes("division-box")) return typedDivision(item, steps, events);
    if (kind.includes("number-line")) return typedNumberLine(item, steps, events);
    if (kind.includes("double-rate-bars")) return typedRateBars(item, steps, events);
    if (kind.includes("unit-rate") || kind.includes("conversion") || kind.includes("ratio-table"))
      return typedTable(item, steps, events, kind);
    if (kind.includes("percent-bar")) return typedPercentBar(item, steps, events);
    if (kind.includes("inequality")) return typedInequality(item, steps, events);
    if (kind.includes("fraction")) return typedFraction(item, steps, events);
    if (kind.includes("coordinate")) return typedPlot(item, steps, events);
    if (kind.includes("expression-tiles")) return typedTiles(item, steps, events);
    if (kind.includes("power-array")) return typedPower(item, steps, events);
    if (SHAPE_LABELS[kind]) return typedShape(item, events, kind);
  } catch (error) {
    console.warn("typed model failed; falling back to figure", error);
    return null;
  }
  return null;
}

export function appendVisualPractice(card, item, { mode = "guided", events = {} } = {}) {
  const kind = String(item.visual?.kind || "");
  const read = el("button", "btn ghost sg-read-problem", "🔊 Read this problem");
  read.type = "button";
  read.onclick = () => speak(item.stem || item.title || "", read);
  const stepsApi = guidedSteps(item, mode, events);
  const stepsNodes = stepsApi ? [stepsApi.node] : [];
  const question = card.querySelector(".q");
  // Place-value problems: the answer control's stacked column IS the giant
  // workspace — students work the problem in it, so no display-only figure.
  if (kind.includes("place-value")) {
    card.classList.add("sg-big-work");
    const top = el("div", "sg-problem-support-head");
    top.append(el("div", "sg-visual-title", "Work it here"), read);
    question?.after(top, ...stepsNodes);
    return card;
  }
  // Typed model first: students put the numbers into the model themselves,
  // and correct entries auto-complete the matching guided step.
  const typed = typedModel(item, stepsApi, events);
  if (typed) {
    const top = el("div", "sg-problem-support-head");
    top.append(el("div", "sg-visual-title", "Work in the model"), read);
    question?.after(top, typed, ...stepsNodes);
    return card;
  }
  const markup = visualMarkup(item);
  if (!markup) {
    // No authored visual: keep the read-aloud and any guided steps, but skip
    // the figure and value tool — a chart of scraped numbers misleads.
    const top = el("div", "sg-problem-support-head");
    top.append(el("span"), read);
    question?.after(top, ...stepsNodes);
    return card;
  }
  const visual = el("div", "sg-problem-visual", markup);
  const title = el("div", "sg-visual-title", "See the math");
  const top = el("div", "sg-problem-support-head");
  top.append(title, read);
  const tool = interactiveTool(item, mode === "guided");
  question?.after(top, visual, tool, ...stepsNodes);
  return card;
}

export default appendVisualPractice;

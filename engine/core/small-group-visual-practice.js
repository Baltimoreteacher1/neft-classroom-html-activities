import { isRight } from "./small-group-answers.js";
import { el, esc, speak } from "./small-group-ui.js";

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

function coordinateGrid(visual) {
  const points = visual.points || (visual.point ? [visual.point] : [[2, 3]]);
  // Auto-scale so far-out points stay inside the viewBox instead of clipping.
  const maxAbs = Math.max(1, ...points.flat().map((value) => Math.abs(Number(value) || 0)));
  const stepX = Math.min(28, 260 / maxAbs);
  const stepY = Math.min(24, 120 / maxAbs);
  const dots = points
    .map(
      ([x, y]) =>
        `<circle cx="${320 + Number(x) * stepX}" cy="${150 - Number(y) * stepY}" r="13" fill="var(--sg-pop)" stroke="var(--sg-deep)" stroke-width="4"/><text x="${332 + Number(x) * stepX}" y="${136 - Number(y) * stepY}">(${esc(x)}, ${esc(y)})</text>`,
    )
    .join("");
  return `<g stroke="#cad5e5" stroke-width="2">${Array.from({ length: 11 }, (_, i) => `<line x1="${40 + i * 56}" y1="20" x2="${40 + i * 56}" y2="280"/><line x1="40" y1="${20 + i * 26}" x2="600" y2="${20 + i * 26}"/>`).join("")}</g><line x1="40" y1="150" x2="600" y2="150" stroke="var(--sg-deep)" stroke-width="5"/><line x1="320" y1="20" x2="320" y2="280" stroke="var(--sg-deep)" stroke-width="5"/>${dots}`;
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

function factorTree(values) {
  const value = values[0] || "?";
  return `<circle cx="320" cy="60" r="38" fill="var(--sg)"/><text x="320" y="72" text-anchor="middle" fill="white">${esc(value)}</text><path d="M295 92L185 150M345 92L455 150" stroke="var(--sg-deep)" stroke-width="6"/><circle class="sg-layer-2" cx="175" cy="175" r="38" fill="var(--sg-soft)" stroke="var(--sg)" stroke-width="4"/><circle class="sg-layer-2" cx="465" cy="175" r="38" fill="var(--sg-soft)" stroke="var(--sg)" stroke-width="4"/><text class="sg-layer-2" x="175" y="187" text-anchor="middle">?</text><text class="sg-layer-2" x="465" y="187" text-anchor="middle">?</text><path class="sg-layer-3" d="M440 207L380 255M490 207L550 255" stroke="var(--sg-deep)" stroke-width="5"/><text class="sg-layer-3" x="465" y="285" text-anchor="middle">keep splitting composite branches</text>`;
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
function factorLists(values) {
  const [a, b] = values.map(Number);
  if (!a || !b || a > 200 || b > 200) return bars(values, "factors");
  const factorsA = listFactors(a);
  const factorsB = listFactors(b);
  const common = new Set(factorsA.filter((factor) => factorsB.includes(factor)));
  const row = (list, y) =>
    list
      .slice(0, 12)
      .map((factor, index) => {
        const shared = common.has(factor);
        return `<g transform="translate(${150 + index * 40} ${y})"><rect x="-17" y="-22" width="34" height="34" rx="9" fill="${shared ? "var(--sg-pop)" : "#fff"}" stroke="${shared ? "var(--sg-deep)" : "var(--sg)"}" stroke-width="3"/><text x="0" y="4" text-anchor="middle" style="font-size:18px">${factor}</text></g>`;
      })
      .join("");
  return `<text x="45" y="92" style="font-size:20px">${esc(a)} →</text>${row(factorsA, 90)}
    <text x="45" y="182" style="font-size:20px">${esc(b)} →</text>${row(factorsB, 180)}
    <text class="sg-layer-2" x="320" y="255" text-anchor="middle">Gold squares appear in both lists</text>`;
}

// Two lanes of multiples with the first shared multiple highlighted (LCM).
function multipleLanes(values) {
  const [a, b] = values.map(Number);
  if (!a || !b) return bars(values, "multiples");
  const lane = (base, y) => {
    return Array.from({ length: 8 }, (_, index) => {
      const multiple = base * (index + 1);
      const shared = multiple % a === 0 && multiple % b === 0;
      return `<g transform="translate(${105 + index * 62} ${y})"><rect x="-24" y="-22" width="48" height="34" rx="9" fill="${shared ? "var(--sg-pop)" : "#fff"}" stroke="${shared ? "var(--sg-deep)" : "var(--sg)"}" stroke-width="3"/><text x="0" y="4" text-anchor="middle" style="font-size:17px">${multiple}</text></g>`;
    }).join("");
  };
  return `<text x="40" y="92" style="font-size:19px">×${esc(a)}</text>${lane(a, 90)}
    <text x="40" y="182" style="font-size:19px">×${esc(b)}</text>${lane(b, 180)}
    <text class="sg-layer-2" x="320" y="255" text-anchor="middle">The first gold match is the least common multiple</text>`;
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

// Stacked place-value alignment for decimal operations.
function placeValueModel(visual, values) {
  const [a, b] = values;
  const operation = visual.operation || "+";
  return `<g style="font-size:34px" text-anchor="end">
      <text x="430" y="95">${esc(a)}</text>
      <text x="430" y="150">${esc(b)}</text>
      <text x="255" y="150" fill="var(--sg)">${esc(operation)}</text>
    </g>
    <line x1="235" y1="172" x2="450" y2="172" stroke="var(--sg-deep)" stroke-width="5"/>
    <text x="430" y="225" text-anchor="end" style="font-size:34px" class="sg-layer-2">?</text>
    <text class="sg-layer-3" x="340" y="272" text-anchor="middle">Line up the decimal points before you work</text>`;
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
  return `<line x1="55" y1="150" x2="585" y2="150" stroke="var(--sg-deep)" stroke-width="6"/>
    <path d="M55 150l20-12v24zM585 150l-20-12v24z" fill="var(--sg-deep)"/>${labels}
    <line class="sg-layer-2" x1="${x}" y1="150" x2="${rightward ? 565 : 75}" y2="150" stroke="var(--sg)" stroke-width="12" stroke-linecap="round" opacity="0.55"/>
    <circle cx="${x}" cy="150" r="16" fill="${open ? "#fffdf8" : "var(--sg)"}" stroke="var(--sg)" stroke-width="6"/>
    <text x="${x}" y="105" text-anchor="middle">x ${esc(symbol)} ${esc(boundary)}</text>`;
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
  else if (kind.includes("place-value")) body = placeValueModel(visual, values);
  else if (kind.includes("ratio-dots")) body = ratioDots(values);
  else if (kind.includes("inequality")) body = inequalityLine(visual, values);
  else if (kind.includes("factor")) body = factorTree(values);
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
  const wrap = el(mode === "guided" ? "div" : "details", "sg-guided-steps");
  if (mode !== "guided") wrap.appendChild(el("summary", null, "Need the guided steps?"));
  const body = el("div", "sg-step-sequence");
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
  return wrap;
}

export function appendVisualPractice(card, item, { mode = "guided", events = {} } = {}) {
  const markup = visualMarkup(item);
  const read = el("button", "btn ghost sg-read-problem", "🔊 Read this problem");
  read.type = "button";
  read.onclick = () => speak(item.stem || item.title || "", read);
  const steps = guidedSteps(item, mode, events);
  const question = card.querySelector(".q");
  if (!markup) {
    // No authored visual: keep the read-aloud and any guided steps, but skip
    // the figure and value tool — a chart of scraped numbers misleads.
    const top = el("div", "sg-problem-support-head");
    top.append(el("span"), read);
    question?.after(top, ...(steps ? [steps] : []));
    return card;
  }
  const visual = el("div", "sg-problem-visual", markup);
  const title = el("div", "sg-visual-title", "See the math");
  const top = el("div", "sg-problem-support-head");
  top.append(title, read);
  const tool = interactiveTool(item, mode === "guided");
  question?.after(top, visual, tool, ...(steps ? [steps] : []));
  return card;
}

export default appendVisualPractice;

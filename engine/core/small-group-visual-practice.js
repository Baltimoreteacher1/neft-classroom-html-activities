import { el, esc, speak } from "./small-group-ui.js";

const norm = (value) =>
  String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[×·]/g, "x")
    .replace(/[−–—]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/[.,;:]+$/, "");

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
  const dots = points
    .map(
      ([x, y]) =>
        `<circle cx="${320 + Number(x) * 28}" cy="${150 - Number(y) * 24}" r="13" fill="var(--sg-pop)" stroke="var(--sg-deep)" stroke-width="4"/><text x="${332 + Number(x) * 28}" y="${136 - Number(y) * 24}">(${esc(x)}, ${esc(y)})</text>`,
    )
    .join("");
  return `<g stroke="#cad5e5" stroke-width="2">${Array.from({ length: 11 }, (_, i) => `<line x1="${40 + i * 56}" y1="20" x2="${40 + i * 56}" y2="280"/><line x1="40" y1="${20 + i * 26}" x2="600" y2="${20 + i * 26}"/>`).join("")}</g><line x1="40" y1="150" x2="600" y2="150" stroke="var(--sg-deep)" stroke-width="5"/><line x1="320" y1="20" x2="320" y2="280" stroke="var(--sg-deep)" stroke-width="5"/>${dots}`;
}

function fractionBars(values) {
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

function visualMarkup(item) {
  const visual = item.visual || {};
  const values = valuesFrom(visual, item.stem);
  const kind = String(visual.kind || "math-model");
  let body;
  if (kind.includes("factor")) body = factorTree(values);
  else if (kind.includes("coordinate")) body = coordinateGrid(visual);
  else if (kind.includes("number-line") || kind.includes("inequality")) body = numberLine(values);
  else if (kind.includes("fraction")) body = fractionBars(values);
  else if (/area|volume|surface|prism|polygon|trapezoid|triangle|net/.test(kind))
    body = shapeModel(values, kind);
  else if (/equation|expression|algebra|balance|operation|substitution|power/.test(kind))
    body = algebraModel(values, kind);
  else body = bars(values, kind);
  return svgShell(`${kind.replace(/-/g, " ")} for this problem`, body);
}

function interactiveTool(item, open = false) {
  const details = el("details", "sg-math-tool");
  details.open = open;
  details.appendChild(el("summary", null, "🧰 Open the interactive math tool"));
  const body = el("div", "sg-tool-body");
  body.appendChild(
    el("p", "sg-tool-directions", "Move the slider, then tap useful values to build your plan."),
  );
  const sliderRow = el("label", "sg-model-slider");
  sliderRow.appendChild(el("span", null, "Show model detail"));
  const slider = el("input");
  slider.type = "range";
  slider.min = "1";
  slider.max = "3";
  slider.value = "1";
  const update = () => {
    const card = details.closest(".prob");
    card?.classList.toggle("sg-show-layer-2", Number(slider.value) >= 2);
    card?.classList.toggle("sg-show-layer-3", Number(slider.value) >= 3);
  };
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
      const correct = norm(input.value) === norm(step.answer);
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
  const visual = el("div", "sg-problem-visual", visualMarkup(item));
  const title = el("div", "sg-visual-title", "See the math");
  const read = el("button", "btn ghost sg-read-problem", "🔊 Read this problem");
  read.type = "button";
  read.onclick = () => speak(item.stem, read);
  const top = el("div", "sg-problem-support-head");
  top.append(title, read);
  const tool = interactiveTool(item, mode === "guided");
  const steps = guidedSteps(item, mode, events);
  const question = card.querySelector(".q");
  question?.after(top, visual, tool, ...(steps ? [steps] : []));
  return card;
}

export default appendVisualPractice;

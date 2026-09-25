import { createLesson, transferPrompt } from "./lesson-content.js";
import { validateAnswer } from "./problem-bank.js";

const esc = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const svg = (body, label, viewBox = "0 0 540 240") => `<svg class="math-model-svg" viewBox="${viewBox}" role="img" aria-label="${esc(label)}">${body}</svg>`;
const text = (x, y, value, extra = "") => `<text x="${x}" y="${y}" text-anchor="middle" ${extra}>${esc(value)}</text>`;

export function renderModel(model, { counters, counterPositions, partitions = 1, step = 0 } = {}) {
  const caption = `<p class="model-caption">${esc(model.caption)}</p>`;
  if (model.type === "counters") {
    const filled = counters ?? model.filled;
    const isFilled = (i) => counterPositions ? counterPositions.has(i) : i < filled;
    return `${caption}<p>Tap a space to add or remove a counter. Keep the original ${model.filled} dark counters.</p><div class="counter-board">${Array.from({ length: model.total }, (_, i) => `<button type="button" class="counter-cell ${isFilled(i) ? "filled" : ""} ${i < model.filled ? "fixed" : ""}" data-counter="${i}" aria-label="Space ${i + 1}${i < model.filled ? ', original counter' : ''}" aria-pressed="${isFilled(i)}" ${i < model.filled ? "disabled" : ""}><span aria-hidden="true">${isFilled(i) ? "●" : "○"}</span></button>`).join("")}</div><p class="model-count" aria-live="polite">${filled} counters · ${Math.max(0, filled - model.filled)} added</p>`;
  }
  if (model.type === "pairs") return `${caption}<div class="pair-board">${Array.from({ length: Math.ceil(model.total / 2) }, (_, i) => `<span class="counter-pair" aria-label="${i * 2 + 1 < model.total ? '2 counters' : '1 counter'}">● ${i * 2 + 1 < model.total ? "●" : "○"}</span>`).join("")}</div>`;
  if (model.type === "fractions") {
    return `${caption}${model.fractions.map(([n, d], index) => `<div class="fraction-model-row"><strong>${n}/${d}</strong><div class="fraction-model" style="--pieces:${d * partitions}" role="img" aria-label="${n} of ${d} equal parts shaded, subdivided into ${d * partitions} pieces">${Array.from({ length: d * partitions }, (_, i) => `<span class="${i < n * partitions ? "shaded" : ""}"></span>`).join("")}</div><span>${n * partitions}/${d * partitions}</span></div>`).join("")}<div class="model-controls" aria-label="Subdivide the same whole">${[1, 2, 3].map((factor) => `<button type="button" data-partition="${factor}" aria-pressed="${partitions === factor}">Split each part into ${factor}</button>`).join("")}</div><p>The shaded amount stays the same as the pieces get smaller.</p>`;
  }
  if (model.type === "fractionGrid") return `${caption}<div class="fraction-area" style="--cols:${model.cols}" role="img" aria-label="${model.selectedCols * model.selectedRows} overlapping cells out of ${model.cols * model.rows}">${Array.from({ length: model.rows * model.cols }, (_, i) => `<span class="${i % model.cols < model.selectedCols ? 'column-shade' : ''} ${Math.floor(i / model.cols) < model.selectedRows ? 'row-shade' : ''}"></span>`).join("")}</div><p>Blue columns × striped rows. Dark cells are in both.</p>`;
  if (model.type === "numberline") {
    const points = [model.start]; for (const jump of model.jumps) points.push(points.at(-1) + jump);
    const min = Math.min(...points); const max = Math.max(...points); const x = (value) => 40 + (value - min) / Math.max(1, max - min) * 460;
    const marks = [...new Set(points)].map((value) => `<path d="M${x(value)},145 v15"/>${text(x(value), 185, value)}`).join("");
    const paths = model.jumps.map((jump, i) => {
      const from = x(points[i]); const to = x(points[i + 1]);
      return `<path class="jump-path ${i <= step ? 'active' : ''}" d="M${from},140 Q${(from + to) / 2},${25 + i * 15} ${to},140"/>${text((from + to) / 2, 58 + i * 15, `${jump >= 0 ? '+' : ''}${jump}`)}`;
    }).join("");
    return caption + svg(`<path d="M25,150 H515"/>${marks}${paths}`, `${model.caption}. Positions ${points.join(', ')}.`);
  }
  if (model.type === "place") return `${caption}<div class="place-model">${model.numbers.map((n) => `<div class="place-row" aria-label="${esc(n)}">${[...n].map((digit) => `<span class="${digit === '.' ? 'decimal-point' : ''}">${digit}</span>`).join("")}</div>`).join("")}</div>`;
  if (model.type === "array") {
    if (model.a <= 12 && model.b <= 12) return `${caption}<div class="array-model" style="--cols:${model.b}" role="img" aria-label="${model.a} rows with ${model.b} squares in each row">${Array.from({ length: model.a * model.b }, (_, i) => `<span class="${Math.floor(i / model.b) < model.split ? 'part-one' : 'part-two'}"></span>`).join("")}</div><p>${model.a} rows × ${model.b} per row</p>`;
    return caption + svg(`<rect class="model-fill" x="45" y="55" width="330" height="130"/><rect class="model-fill-alt" x="375" y="55" width="115" height="130"/>${text(210, 35, model.split)}${text(433, 35, model.a - model.split)}${text(20, 130, model.b)}${text(210, 125, `${model.split} × ${model.b}`)}${text(433, 125, `${model.a - model.split} × ${model.b}`)}`, `${model.a} × ${model.b}, split into ${model.split} × ${model.b} and ${model.a - model.split} × ${model.b}. Diagram not to scale.`);
  }
  if (model.type === "partition" || model.type === "bars") return `${caption}<div class="partition-model">${model.labels.map((label, i) => `<div style="flex:${model.values[i] || 1}"><span>${esc(label)}</span></div>`).join("")}</div><p>Keep both parts. Each is divided by the same divisor.</p>`;
  if (model.type === "table") return `${caption}<table class="ratio-model"><thead><tr>${model.headers.map((label) => `<th scope="col">${esc(label)}</th>`).join("")}</tr></thead><tbody>${model.rows.map((row) => `<tr>${row.map((value) => `<td>${esc(value)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  if (model.type === "equations") return `${caption}<ol class="balance-model">${model.lines.map((line, i) => `<li class="${i === step ? 'active' : ''}">${esc(line)}</li>`).join("")}</ol><div class="balance-base" aria-hidden="true">━━━━━━━━━ ▲ ━━━━━━━━━</div>`;
  if (model.type === "machine") return `${caption}<div class="function-machine"><span>Input<br><strong>${model.input}</strong></span><b aria-hidden="true">→</b><span>Multiply<br><strong>× ${model.multiplier}</strong></span><b aria-hidden="true">→</b><span>${model.factorCount === 3 ? "Again" : model.constant ? "Then add" : "Output"}<br><strong>${model.factorCount === 3 ? `× ${model.multiplier}` : model.constant ? `+ ${model.constant}` : "?"}</strong></span></div>`;
  if (model.type === "coins") return `${caption}<div class="coin-model">${model.counts.map((count, i) => `<div>${Array.from({ length: count }, () => `<span class="coin">${[25, 10, 5, 1][i]}¢</span>`).join("")}</div>`).join("")}</div>`;
  if (model.type === "clock") {
    const angle = (model.hour + model.minute / 60) * Math.PI / 6;
    return caption + svg(`<circle cx="270" cy="120" r="98" class="clock-face"/>${Array.from({ length: 12 }, (_, i) => { const a = (i + 1) * Math.PI / 6; return text(270 + Math.sin(a) * 78, 126 - Math.cos(a) * 78, i + 1); }).join("")}<path class="clock-hand" d="M270,120 L${270 + Math.sin(angle) * 47},${120 - Math.cos(angle) * 47}"/><path class="clock-hand" d="M270,120 V190"/>`, `Clock showing ${model.hour}:30`);
  }
  if (model.type === "coordinate") {
    const xy = ([x, y]) => [210 + x * 17, 205 - y * 17];
    let body = `<path d="M25,205 H395 M210,20 V390"/>${text(397, 195, 'x')}${text(225, 20, 'y')}`;
    for (let x = -10; x <= 10; x += 2) body += text(210 + x * 17, 225, x, 'class="axis-label"');
    for (let y = -10; y <= 10; y += 2) if (y !== 0) body += text(190, 210 - y * 17, y, 'class="axis-label"');
    body += model.points.map((p) => { const [x, y] = xy(p); return `<circle cx="${x}" cy="${y}" r="6" class="plot-point"/>${text(x, y - 12, `(${p.join(', ')})`, 'class="point-label"')}`; }).join("");
    if (model.slope) { const [a, b] = model.points.map(xy); body += `<path class="jump-path active" d="M${a[0]},${a[1]} H${b[0]} V${b[1]}"/>`; }
    if (model.reflected && step >= 1) { const [x, y] = xy(model.reflected); body += `<circle cx="${x}" cy="${y}" r="7" class="reflected-point"/>${text(x, y + 22, '(?, −2)')}`; }
    return caption + svg(body, `${model.caption}. Points: ${model.points.map((p) => `(${p.join(', ')})`).join('; ')}. Both axes use the same scale.`, "0 0 420 420");
  }
  if (model.type === "shape") {
    let body;
    if (model.shape === "circle") body = `<circle cx="270" cy="120" r="85" class="model-fill"/><path d="M270,120 H355"/>${text(310, 107, `r = ${model.a}`)}`;
    else if (model.shape === "rightTriangle") body = `<path class="model-fill" d="M120,40 V200 H430 Z"/><path d="M120,175 H145 V200"/>${text(90, 130, model.a)}${text(280, 230, model.b)}${text(290, 100, 'c = ?')}`;
    else body = `<rect class="model-fill" x="140" y="65" width="260" height="135"/>${text(270, 225, model.a)}${text(115, 145, model.b)}${model.shape === 'volume' ? `<path class="model-fill-alt" d="M140,65 L190,25 H450 L400,65 Z M400,65 L450,25 V160 L400,200 Z"/>${text(465, 110, `${model.height} layers`)}` : ''}`;
    return caption + svg(body, `${model.caption}. Diagram not to scale.`);
  }
  return caption;
}

export function mountVisualLesson(container, skill, { onComplete, onPractice, variant = 0 } = {}) {
  let currentVariant = variant;
  let content = createLesson(skill, currentVariant);
  let index = 0;
  let solved = false;
  let attempts = 0;
  let partitions = 1;
  let counters = content.model.filled;
  let counterPositions = new Set(Array.from({ length: counters || 0 }, (_, i) => i));
  let supported = false;

  function render() {
    const done = index >= content.steps.length;
    const item = content.steps[index];
    const freshExample = JSON.stringify(createLesson(skill, currentVariant + 1)) !== JSON.stringify(content);
    container.innerHTML = `<div class="visual-lesson-heading"><div><p class="section-label">See it. Build it. Explain it.</p><h3>${esc(content.title)}</h3><p>${esc(content.idea)}</p></div><button type="button" class="outline-action" data-new-visual>${freshExample ? 'Try another example' : 'Restart this model'}</button></div>
      <div class="visual-lesson-layout"><div class="visual-model">${renderModel(content.model, { counters, counterPositions, partitions, step: index })}</div><div class="visual-step-panel">
      <ol class="visual-step-dots" aria-label="Lesson steps">${content.steps.map((_, i) => `<li class="${i < index ? 'complete' : i === index ? 'current' : ''}" ${i === index ? 'aria-current="step"' : ''}>${i < index ? '✓' : i + 1}<span>${i < index ? ' complete' : i === index ? ' current' : ' next'}</span></li>`).join("")}</ol>
      ${done ? `<h4>You built the idea.</h4><p>${esc(transferPrompt(skill))}</p><p class="lesson-evidence">Visual lesson completed${supported ? ' with a worked step' : ''}. Independent practice will check what you remember.</p><button type="button" class="primary-action" data-visual-practice>Try adaptive practice</button>` : `<form data-visual-form novalidate><label for="visual-answer"><strong>Step ${index + 1} of ${content.steps.length}</strong><span>${esc(item.prompt)}</span></label>${item.choices ? `<div class="choice-answers">${item.choices.map((choice) => `<button type="button" class="choice-answer" data-visual-answer="${esc(choice)}">${esc(choice)}</button>`).join("")}</div>` : `<input id="visual-answer" class="answer-input" type="text" inputmode="${item.kind === 'text' ? 'text' : 'decimal'}" autocomplete="off" placeholder="${item.kind === 'fraction' ? 'Example: 3/4' : 'Your answer'}"/><button class="primary-action" type="submit">Check this step</button>`}</form><div class="visual-help-actions"><button type="button" class="text-action" data-visual-hint>Help with this step</button><button type="button" class="text-action" data-visual-worked hidden>Show a worked step</button></div><div class="visual-feedback" role="status" hidden></div><button type="button" class="primary-action" data-visual-next hidden>Next step</button>`}</div></div>`;
  }

  function feedback(copy, correct = false) {
    const node = container.querySelector(".visual-feedback");
    node.hidden = false; node.textContent = copy; node.dataset.correct = String(correct);
  }

  function check(value) {
    if (solved || !content.steps[index]) return;
    if (!String(value).trim()) { feedback("Enter an answer so we can check this step."); return; }
    attempts++;
    const item = content.steps[index];
    if (validateAnswer(value, item)) {
      solved = true;
      feedback(item.explanation, true);
      container.querySelectorAll("[data-visual-form] input, [data-visual-form] button").forEach((el) => { el.disabled = true; });
      container.querySelector("[data-visual-next]").hidden = false;
      container.querySelector("[data-visual-next]").textContent = index === content.steps.length - 1 ? "Finish visual lesson" : "Next step";
      container.querySelector("[data-visual-next]").focus();
    } else {
      feedback(`Try this: ${item.hint}`);
      container.querySelector("[data-visual-worked]").hidden = attempts < 2;
    }
  }

  container.onsubmit = (event) => { if (event.target.matches("[data-visual-form]")) { event.preventDefault(); check(container.querySelector("#visual-answer").value); } };
  container.onclick = (event) => {
    const button = event.target.closest("button"); if (!button) return;
    if (button.hasAttribute("data-visual-answer")) check(button.dataset.visualAnswer);
    if (button.hasAttribute("data-visual-hint")) feedback(content.steps[index].hint);
    if (button.hasAttribute("data-visual-worked")) {
      supported = true; solved = true; feedback(content.steps[index].explanation);
      container.querySelector("[data-visual-next]").hidden = false;
      container.querySelectorAll("[data-visual-form] input, [data-visual-form] button").forEach((el) => { el.disabled = true; });
    }
    if (button.hasAttribute("data-visual-next") && solved) {
      index++; solved = false; attempts = 0;
      if (index === content.steps.length) onComplete?.({ supported });
      render(); container.querySelector("#visual-answer, [data-visual-answer], [data-visual-practice]")?.focus();
    }
    if (button.hasAttribute("data-new-visual")) {
      currentVariant++; content = createLesson(skill, currentVariant); index = 0; solved = false; attempts = 0; partitions = 1; counters = content.model.filled; counterPositions = new Set(Array.from({ length: counters || 0 }, (_, i) => i)); supported = false; render();
    }
    if (button.hasAttribute("data-visual-practice")) onPractice?.();
    if (button.hasAttribute("data-partition")) { partitions = Number(button.dataset.partition); container.querySelector(".visual-model").innerHTML = renderModel(content.model, { partitions, counters, step: index }); container.querySelector(`[data-partition="${partitions}"]`)?.focus(); }
    if (button.hasAttribute("data-counter")) { const cell = Number(button.dataset.counter); if (cell < content.model.filled) return; if (counterPositions.has(cell)) counterPositions.delete(cell); else counterPositions.add(cell); counters = counterPositions.size; container.querySelector(".visual-model").innerHTML = renderModel(content.model, { partitions, counters, counterPositions, step: index }); container.querySelector(`[data-counter="${cell}"]`)?.focus(); }
  };
  render();
  return () => { container.onclick = null; container.onsubmit = null; };
}

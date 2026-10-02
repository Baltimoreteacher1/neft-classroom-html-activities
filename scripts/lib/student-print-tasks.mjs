/** Answer-free task rendering shared by student handouts and full lesson packets.
 * Uses the same table contract as the interactive lesson. No teacher key fields
 * (answers, explanations, correctWork, correctIndex) are rendered. */
import { normalizeFillTable } from "@eduwonderlab/engine/components/fill-table.js";

export const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Deterministic shuffle (seeded by string) so re-running the generator produces
// stable output — avoids noisy git diffs while still scrambling match columns.
function seededShuffle(arr, seedStr) {
  let seed = 0;
  for (const ch of String(seedStr)) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const workLines = (n = 3) => `<div class="work">${'<div class="wl"></div>'.repeat(n)}</div>`;
export const answerBlank = (label = "Answer") =>
  `<p class="ans"><strong>${esc(label)}:</strong> <span class="blank"></span></p>`;

// ---- Section renderers ----------------------------------------------------

function questionText(item) {
  if (item.studentPrint) return item.studentPrint.prompt;
  // Bar-model labels can describe the completed model, including its answer.
  // The authored instructions pose the actual question for the student.
  if (item.type === "bar-model")
    return (
      item.stem ||
      item.prompt ||
      item.instructions ||
      item.label ||
      item.questionText ||
      "Draw a bar model and solve."
    );
  if (item.type === "balance-scale")
    return (
      item.stem ||
      item.prompt ||
      item.instructions ||
      item.label ||
      "Solve and show your reasoning."
    );
  return (
    item.stem ||
    item.prompt ||
    item.label ||
    item.questionText ||
    (typeof item.question === "string" ? item.question : "") ||
    item.instructions ||
    item.title ||
    item.text ||
    ""
  );
}

export function renderChoices(choices) {
  return `<ol class="choices">${choices
    .map((c, i) => `<li><span class="ltr">${LETTERS[i]}</span> ${esc(c)}</li>`)
    .join("")}</ol>`;
}

// Print twin of the engine's buildRowFigure: the row's regular polygon fanned
// into its congruent triangles, so the paper copy shows the same picture the
// screen does. Returns "" for anything it does not draw.
function polygonFigureSvg(spec) {
  if (!spec || typeof spec !== "object" || spec.shape !== "regular-polygon") return "";
  const sides = Number(spec.sides);
  if (!Number.isInteger(sides) || sides < 3 || sides > 12) return "";
  const size = 44;
  const c = size / 2;
  const r = c - 3;
  const pt = (i) => {
    const a = (2 * Math.PI * i) / sides - Math.PI / 2;
    return [
      Math.round((c + Math.cos(a) * r) * 100) / 100,
      Math.round((c + Math.sin(a) * r) * 100) / 100,
    ];
  };
  let wedges = "";
  for (let i = 0; i < sides; i++) {
    const [x1, y1] = pt(i);
    const [x2, y2] = pt(i + 1);
    wedges += `<polygon points="${c},${c} ${x1},${y1} ${x2},${y2}" fill="none" stroke="#333" stroke-width="1"/>`;
  }
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="Regular polygon with ${sides} sides split into ${sides} triangles" style="display:block; margin-bottom:3px;">${wedges}</svg>`;
}

// Use the interactive table contract to retain givens and blank every work cell.
function renderFillTable(item) {
  const table = normalizeFillTable(item);
  const editable = new Set(table.editableCells.map((cell) => `${cell.row}:${cell.col}`));
  const head = `<tr>${table.headers.map((c) => `<th scope="col">${esc(c)}</th>`).join("")}</tr>`;
  const body = table.rows
    .map((row, r) => {
      const fig = polygonFigureSvg(table.rowFigures[r]);
      return `<tr>${row
        .map((value, c) =>
          editable.has(`${r}:${c}`)
            ? `<td class="fill" aria-label="Your response: ${esc(table.headers[c])}, row ${r + 1}"><span class="paper-blank"></span></td>`
            : `<td>${c === 0 ? fig : ""}${esc(value)}</td>`,
        )
        .join("")}</tr>`;
    })
    .join("");
  return `<p class="hint-line">Complete each empty cell. Show your reasoning below.</p><table class="grid"><thead>${head}</thead><tbody>${body}</tbody></table>${workLines(2)}`;
}

function renderSort(item) {
  if (item.studentPrint?.matchingPairs)
    return renderMatch({ pairs: item.studentPrint.matchingPairs }) + workLines(2);
  const cats = (item.categories || []).map((c) =>
    typeof c === "string" ? c : c.label || c.name || c.id || "",
  );
  const nested = (item.categories || []).flatMap((category) => category.items || []);
  const source = item.cards?.length ? item.cards : item.items?.length ? item.items : nested;
  if (!source.length) throw new Error("Printable sort has no cards in any supported source field");
  const usesNested = !item.cards?.length && !item.items?.length;
  const ordering = Array.isArray(item.correctOrder) || (usesNested && cats.length === 1);
  const texts = source.map((it) => {
    const text = typeof it === "string" ? it : (it.text ?? it.label ?? "");
    // Authored ordering arrays store their correct sequence. Step numbers are
    // answer metadata for this schema, so students receive the step text only.
    return ordering ? text.replace(/^Step\s+\d+\s*:\s*/i, "") : text;
  });
  let items = seededShuffle(texts, JSON.stringify(source));
  if (ordering && items.length > 1 && items.every((text, i) => text === texts[i]))
    items = items.slice(1).concat(items[0]);
  const bank = `<div class="wordbank"><strong>Word bank:</strong> ${items
    .map((t) => `<span class="chip">${esc(t)}</span>`)
    .join(" ")}</div>`;
  if (ordering)
    return `<p class="hint-line">Write the items in the requested order, one per line.</p>${bank}<div class="ordering-work"><p><strong>${esc(cats[0] || "Requested order")}</strong></p><ol>${items.map(() => `<li><span class="order-line"></span></li>`).join("")}</ol></div>`;
  const boxes = `<div class="sortboxes">${cats
    .map((c) => `<div class="sortbox"><div class="sorthd">${esc(c)}</div></div>`)
    .join("")}</div>`;
  return `<p class="hint-line">Write each item in its correct group.</p>` + bank + boxes;
}

function renderMatch(item) {
  const pairs = item.pairs || [];
  const left = pairs.map((p) => p.situation ?? p.term ?? p.left ?? "");
  const rightRaw = pairs.map((p) => p.equation ?? p.match ?? p.right ?? p.definition ?? "");
  let right = seededShuffle(rightRaw, JSON.stringify(rightRaw));
  if (right.length > 1 && right.every((value, i) => value === rightRaw[i]))
    right = right.slice(1).concat(right[0]);
  const rows = left
    .map(
      (l, i) =>
        `<tr><td class="mnum">${i + 1}.</td><td>${esc(l)}</td>` +
        `<td class="mans"></td>` +
        `<td class="mltr">${LETTERS[i]}.</td><td>${esc(right[i])}</td></tr>`,
    )
    .join("");
  return (
    `<p class="hint-line">Write the letter of the matching item in the blank.</p>` +
    `<table class="matchtbl">${rows}</table>`
  );
}

function renderErrorAnalysis(item) {
  const steps = (item.workedExample || [])
    .map(
      (s) =>
        `<div class="wa-step"><span class="wa-lbl">${esc(s.label || "")}</span><span class="wa-work">${esc(s.work || "")}</span></div>`,
    )
    .join("");
  return (
    `<div class="worked">${steps}</div>` +
    `<p class="ea-q"><strong>Which step has the mistake, and what should it be?</strong></p>` +
    workLines(3)
  );
}

function renderNumberLine(item) {
  // Inequality tasks need one unmarked line per inequality. The boundary,
  // circleType and direction fields are the key, never the printed task.
  if (Array.isArray(item.problems) && item.problems.length) {
    return item.problems
      .map(
        (problem, i) =>
          `<div class="graph-task"><p><strong>${i + 1}. ${esc(problem.inequality || problem.label || "Graph the inequality")}</strong></p>${renderNumberLine({ ...item, problems: null })}</div>`,
      )
      .join("");
  }
  const min = Number(item.min ?? item.range?.min ?? 0);
  const max = Number(item.max ?? item.range?.max ?? 10);
  const step = Number(item.step ?? item.range?.step ?? 1);
  if (
    ![min, max, step].every(Number.isFinite) ||
    max <= min ||
    step <= 0 ||
    (max - min) / step > 500
  ) {
    throw new Error(`Invalid printable number line: ${min}, ${max}, ${step}`);
  }
  const w = 680;
  const pad = 24;
  const span = max - min;
  const x = (v) => pad + ((v - min) / span) * (w - 2 * pad);
  let ticks = "";
  const count = Math.floor(span / step + 1e-9);
  const stride = Math.max(1, Math.ceil(count / 20));
  for (let i = 0; i <= count; i++) {
    const v = min + i * step;
    const tx = x(v);
    ticks += `<line x1="${tx}" y1="34" x2="${tx}" y2="46" stroke="#333" stroke-width="1"/>`;
    if (i % stride === 0 || i === count)
      ticks += `<text x="${tx}" y="64" font-size="14" text-anchor="middle" fill="#333">${+v.toFixed(6)}</text>`;
  }
  const targets = item.targets || item.items || [];
  // Labels carry the authored task (including solve-first prompts). Values
  // supply givens only when there is no label; never print solved positions.
  const list = targets.length
    ? `<p class="hint-line">Mark and label: ${targets.map((t) => esc(t.label ?? t.value)).join("; ")}</p>`
    : "";
  return `${list}<svg class="numline" viewBox="0 0 ${w} 80" role="img" aria-label="Blank number line from ${min} to ${max}; each tick represents ${step}"><line x1="${pad}" y1="40" x2="${w - pad}" y2="40" stroke="#333" stroke-width="2"/>${ticks}</svg>`;
}

function renderCoordGrid(item) {
  const targets = item.targets || item.points || [];
  const span = (key) =>
    Math.max(
      5,
      Math.ceil(
        Math.max(0, ...targets.map((t) => Math.abs(Number(t[key]))).filter(Number.isFinite)) + 1,
      ),
    );
  const xMin = Number(item.xMin ?? -span("x"));
  const xMax = Number(item.xMax ?? span("x"));
  const yMin = Number(item.yMin ?? -span("y"));
  const yMax = Number(item.yMax ?? span("y"));
  const xStep = Number(item.xStep ?? 1);
  const yStep = Number(item.yStep ?? 1);
  if (
    ![xMin, xMax, yMin, yMax, xStep, yStep].every(Number.isFinite) ||
    xMax <= xMin ||
    yMax <= yMin ||
    xStep <= 0 ||
    yStep <= 0 ||
    (xMax - xMin) / xStep > 100 ||
    (yMax - yMin) / yStep > 100
  ) {
    throw new Error("Invalid printable coordinate grid bounds or steps");
  }
  const size = 420;
  const pad = 48;
  const inner = size - 2 * pad;
  const sx = (v) => pad + ((v - xMin) / (xMax - xMin || 1)) * inner;
  const sy = (v) => size - pad - ((v - yMin) / (yMax - yMin || 1)) * inner;
  let lines = "";
  for (let v = xMin; v <= xMax + 1e-9; v += xStep) {
    lines += `<line x1="${sx(v)}" y1="${pad}" x2="${sx(v)}" y2="${size - pad}" stroke="#ddd"/>`;
    lines += `<text x="${sx(v)}" y="${size - pad + 18}" font-size="11" text-anchor="middle" fill="#333">${+v.toFixed(6)}</text>`;
  }
  for (let v = yMin; v <= yMax + 1e-9; v += yStep) {
    lines += `<line x1="${pad}" y1="${sy(v)}" x2="${size - pad}" y2="${sy(v)}" stroke="#ddd"/>`;
    lines += `<text x="${pad - 8}" y="${sy(v) + 3}" font-size="11" text-anchor="end" fill="#333">${+v.toFixed(6)}</text>`;
  }
  const axisX = sx(Math.max(xMin, Math.min(0, xMax)));
  const axisY = sy(Math.max(yMin, Math.min(0, yMax)));
  const axes = `<line data-axis="y" x1="${axisX}" y1="${pad}" x2="${axisX}" y2="${size - pad}" stroke="#333" stroke-width="2"/><line data-axis="x" x1="${pad}" y1="${axisY}" x2="${size - pad}" y2="${axisY}" stroke="#333" stroke-width="2"/>`;
  const labels = `<text x="${size / 2}" y="${size - 6}" font-size="12" text-anchor="middle" fill="#333">${esc(item.xLabel || "x")}</text><text x="13" y="${size / 2}" font-size="12" text-anchor="middle" fill="#333" transform="rotate(-90 13 ${size / 2})">${esc(item.yLabel || "y")}</text>`;
  const pointTasks = item.studentPrint?.pointTasks ?? targets;
  const list = pointTasks.length
    ? `<ul class="point-tasks">${pointTasks
        .map((t) => {
          if (t.task)
            return `<li>${t.label ? `<strong>${esc(t.label)}:</strong> ` : ""}${esc(t.task)}</li>`;
          // Parentheses can contain quadrant labels, not just coordinate pairs.
          const embedded = /\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/.exec(
            t.label || "",
          );
          const labelHasCoordinates =
            embedded && Number(embedded[1]) === Number(t.x) && Number(embedded[2]) === Number(t.y);
          return `<li>${esc(labelHasCoordinates ? t.label : `${t.label ? t.label + ": " : ""}(${t.x}, ${t.y})`)}</li>`;
        })
        .join("")}</ul>`
    : "";
  return `${list}<svg class="coordgrid" viewBox="0 0 ${size} ${size}" role="img" aria-label="Blank coordinate grid; ${esc(item.xLabel || "x")} from ${xMin} to ${xMax}, ${esc(item.yLabel || "y")} from ${yMin} to ${yMax}">${lines}${axes}${labels}</svg>`;
}

function renderBalance(item) {
  if (!Array.isArray(item.items) || !item.items.length) {
    // Scalar left/right fields can be worked solutions. Their student-facing
    // expressions belong in the authored prompt; equations are explicit givens.
    return `${item.equation && !item.studentPrint ? `<p class="balance-equation"><strong>${esc(item.equation)}</strong></p>` : ""}${workLines(4)}`;
  }
  const rows = (item.items || [])
    .map(
      (it) =>
        `<tr><td>${esc(it.left ?? "")}</td><td class="bvs">?=?</td><td>${esc(it.right ?? "")}</td><td class="mans"></td></tr>`,
    )
    .join("");
  return (
    `<p class="hint-line">Balanced or not balanced? Show your check in the blank.</p>` +
    `<table class="balancetbl">${rows}</table>`
  );
}

function renderBarModel(item) {
  // `bars` describes the given equal-size pieces; `parts` often contains the
  // solved quantities. Only the former is safe as a student-facing model.
  if (
    item.studentPrint?.model !== "workspace" &&
    Array.isArray(item.bars) &&
    item.bars.length &&
    !item.bars.some((bar) => bar.editable)
  ) {
    const parts = item.bars;
    const width = 640;
    const values = parts.map((part) => Number(part.value ?? 1));
    if (!values.every((value) => Number.isFinite(value) && value > 0))
      throw new Error("Printable bar model requires positive finite segment values");
    const total = values.reduce((sum, value) => sum + value, 0);
    let left = 16;
    const cells = parts
      .map((p, i) => {
        const cell = ((width - 32) * values[i]) / total;
        const x = left;
        left += cell;
        return `<rect x="${x}" y="28" width="${cell}" height="48" fill="#fff" stroke="#333"/><text x="${x + cell / 2}" y="57" text-anchor="middle" font-size="15">${esc(p.label || "")}</text>${p.annotation ? `<text x="${x}" y="17" font-size="13">${esc(p.annotation)}</text>` : ""}`;
      })
      .join("");
    const equal = values.every((value) => value === values[0]);
    return `<svg class="bar-figure" viewBox="0 0 ${width} 88" role="img" aria-label="Bar model with ${parts.length} ${equal ? "equal" : "proportional"} pieces labeled as given">${cells}</svg>`;
  }
  return `<div class="model-space"><span>Draw and label your bar model.</span></div>`;
}

function renderToolWorkspace(item) {
  const diagram = item.diagram;
  if (diagram?.kind !== "long-division-builder") return workLines(6);
  const { dividend, divisor } = diagram;
  if (!Number.isFinite(dividend) || !Number.isFinite(divisor) || divisor === 0)
    throw new Error("Printable long division requires a finite dividend and nonzero divisor");
  return `<svg class="division-space" viewBox="0 0 480 240" role="img" aria-label="Blank long division workspace for ${dividend} divided by ${divisor}"><text x="32" y="66" font-size="25">${esc(divisor)}</text><path d="M 80 78 L 80 42 L 300 42" stroke="#333" stroke-width="2" fill="none"/><text x="98" y="68" font-size="25" letter-spacing="9">${esc(dividend)}</text><line x1="98" y1="30" x2="285" y2="30" stroke="#89959b" stroke-dasharray="4 4"/>${[106, 142, 178, 214].map((y) => `<line x1="98" y1="${y}" x2="300" y2="${y}" stroke="#a9b0b3" stroke-dasharray="4 4"/>`).join("")}</svg>${workLines(2)}`;
}

// Render one practice/explore item into a static, answer-free block.
export function renderItem(item, idx) {
  if (!item || typeof item !== "object") return "";
  validateStudentPrint(item.studentPrint);
  const type = item.type || "open-response";
  const q = questionText(item);
  let body = "";
  switch (type) {
    case "multiple-choice":
      body = renderChoices(item.choices || []) + answerBlank() + workLines(2);
      break;
    case "matching":
    case "matching-game":
      body = renderMatch(item);
      break;
    case "drag-sort":
      body = renderSort(item);
      break;
    case "fill-table":
      body = renderFillTable(item);
      break;
    case "error-analysis":
      body = renderErrorAnalysis(item);
      break;
    case "number-line":
      body = renderNumberLine(item) + workLines(2);
      break;
    case "coordinate-grid":
      body = renderCoordGrid(item) + workLines(1);
      break;
    case "balance-scale":
      body = renderBalance(item);
      break;
    case "bar-model":
      body =
        renderBarModel(item) +
        (!item.studentPrint && item.questionText && item.questionText !== q
          ? `<p>${esc(item.questionText)}</p>`
          : "") +
        workLines(3);
      break;
    case "tool-only":
      body = renderToolWorkspace(item);
      break;
    case "open-response":
      body =
        (item.sentenceFrame ? `<p class="frame">${esc(item.sentenceFrame)}</p>` : "") +
        workLines(5);
      break;
    default:
      body = workLines(4);
  }
  const num = idx != null ? `<span class="qnum">${idx + 1}.</span> ` : "";
  const directions = item.studentPrint ? item.studentPrint.instructions : item.instructions;
  const instructions =
    directions && directions !== q ? `<p class="task-directions">${esc(directions)}</p>` : "";
  // data-practice-item is the anchor the runtime support layer uses to mark the
  // tail of the set optional when a teacher applies the shorter-practice-set
  // modification. A semantic marker, not a CSS selector, so re-styling the
  // packet cannot quietly break the one support that changes the task.
  return `<div class="item" data-practice-item data-task-type="${esc(type)}">${num ? `<p class="qtext">${num}${esc(q)}</p>` : q ? `<p class="qtext">${esc(q)}</p>` : ""}${instructions}${body}</div>`;
}

// Mixed legacy fields sometimes contain worked answers. This explicit authored
// contract selects what the student may see instead of guessing from prose.
function validateStudentPrint(spec) {
  if (spec == null) return;
  if (!spec || typeof spec !== "object" || typeof spec.prompt !== "string" || !spec.prompt.trim())
    throw new Error("studentPrint requires a complete nonempty student prompt");
  if (spec.instructions != null && typeof spec.instructions !== "string")
    throw new Error("studentPrint.instructions must be text");
  if (spec.model != null && spec.model !== "workspace")
    throw new Error("studentPrint.model must be workspace when present");
  if (spec.matchingPairs != null) {
    if (
      !Array.isArray(spec.matchingPairs) ||
      !spec.matchingPairs.length ||
      !spec.matchingPairs.every(
        (pair) =>
          pair &&
          typeof pair.left === "string" &&
          pair.left.trim() &&
          typeof pair.right === "string" &&
          pair.right.trim(),
      )
    )
      throw new Error("studentPrint.matchingPairs requires nonempty left/right text pairs");
  }
  if (spec.pointTasks != null) {
    if (!Array.isArray(spec.pointTasks) || !spec.pointTasks.length)
      throw new Error("studentPrint.pointTasks must contain given points or tasks");
    for (const point of spec.pointTasks) {
      if (!point || typeof point.label !== "string")
        throw new Error("studentPrint point task requires a label");
      const hasTask = typeof point.task === "string" && point.task.trim();
      const hasCoords = Number.isFinite(point.x) && Number.isFinite(point.y);
      if ((!hasTask && !hasCoords) || (hasTask && (point.x != null || point.y != null)))
        throw new Error(
          "studentPrint point must be either given coordinates or a task, never both",
        );
    }
  }
}

export const STUDENT_TASK_CSS = `
  .item { margin: 0 0 20px; break-inside: avoid; }
  .qtext { font-weight: 650; margin: 0 0 8px; }
  .qnum { color: #155f67; font-weight: 750; }
  .task-directions, .hint-line { margin: 6px 0 10px; color: #374b54; }
  .choices { list-style: none; margin: 8px 0; padding: 0; }
  .choices li { margin: 6px 0; }
  .ltr { display: inline-block; border: 1px solid #536168; border-radius: 50%; width: 1.6em; height: 1.6em; text-align: center; margin-right: 6px; }
  .work { margin-top: 10px; }
  .wl { border-bottom: 1px solid #a9b0b3; height: 1.8em; }
  .blank, .paper-blank { display: inline-block; min-width: 4em; min-height: 1.8em; border-bottom: 1px solid #657078; }
  .ans .blank { min-width: 10em; }
  .item table { table-layout: fixed; overflow-wrap: anywhere; }
  .item th, .item td { padding: 9px; min-width: 0; }
  .fill { height: 3em; }
  .matchtbl .mnum, .matchtbl .mltr { width: 2.5em; }
  .matchtbl .mans { width: 3em; border-bottom: 1px solid #333; }
  .wordbank { margin: 12px 0; }
  .chip { display: inline-block; border: 1px solid #89959b; padding: 7px 10px; margin: 4px 4px 4px 0; border-radius: 4px; }
  .sortboxes { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr)); gap: 12px; }
  .sortbox { min-height: 150px; border: 1px solid #657078; border-radius: 4px; }
  .order-line { display: block; height: 2.2em; border-bottom: 1px solid #657078; }
  .point-tasks { margin: 8px 0; padding-left: 1.4em; }
  .sorthd { padding: 8px; border-bottom: 1px solid #657078; font-weight: 700; background: #f3f5f4; }
  .worked { padding: 10px; border: 1px solid #89959b; }
  .wa-step { display: flex; gap: 10px; padding: 6px 0; border-bottom: 1px dashed #a9b0b3; }
  .wa-lbl { flex: 0 0 28%; font-weight: 600; }
  .wa-work { flex: 1; min-width: 0; overflow-wrap: anywhere; }
  .numline, .bar-figure { display: block; width: 100%; height: auto; margin: 12px 0; }
  .division-space { display: block; width: min(100%, 480px); height: auto; margin: 12px 0; }
  .coordgrid { display: block; width: min(100%, 420px); height: auto; margin: 12px auto; }
  .graph-task { break-inside: avoid; }
  .model-space { min-height: 160px; border: 1px solid #89959b; padding: 10px; }
  .model-space span { color: #475663; font-size: .9em; }
  @media (max-width: 560px) {
    .item th, .item td { padding: 5px; }
    .item table { font-size: .85em; }
    .item .paper-blank { min-width: 0; width: 100%; }
    .wa-step { flex-direction: column; gap: 2px; }
  }
  @media screen and (max-width: 600px) {
    /* Retain the injected tools as normal document actions on small screens,
       where their floating stack otherwise covers the reading column. */
    body > #nsr-root { position: relative; right: auto; bottom: auto; flex-direction: row; flex-wrap: wrap; justify-content: flex-end; margin: 24px auto 0; max-width: 900px; z-index: 10; }
    body > #nsr-root #nsr-launcher, body > #nsr-root #nsr-workbench { min-height: 44px; font-size: .85rem; }
    body > #nsr-root #nsr-panel { bottom: 56px; }
    body .mwb-launcher-nav { margin-top: 16px; text-align: right; }
    body #mwb-launcher, body #netfold-launcher { position: static !important; margin: 4px; }
  }
  @media print {
    .item { color: #111; }
    .item table { font-size: 10pt; }
    .graph-task, .item tr, .sortbox { break-inside: avoid; }
    .item thead { display: table-header-group; }
    .numline, .coordgrid, .bar-figure { break-inside: avoid; }
  }
`;

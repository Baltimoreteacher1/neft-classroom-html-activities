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
// Students act on the model (tap rows, counters, jumps, parts); the model reports what they built.

function countFrames(model) {
  // join: a dots then b dots, tap to count all. takeAway: a dots, tap to cross out. missing: tap empties to fill.
  const kind = model.kind;
  const start = kind === "takeAway" ? model.target : model.filled;
  const total = kind === "join" ? model.target : kind === "takeAway" ? model.target : model.filled;
  const frames = Math.max(1, Math.ceil(Math.max(model.target, total, 1) / 10));
  const cells = Array.from({ length: frames * 10 }, (_, i) => {
    let cls = "empty";
    if (kind === "join") cls = i < model.filled ? "dot" : i < model.target ? "dot-add" : "empty";
    else if (kind === "takeAway") cls = i < start ? "dot" : "empty";
    else cls = i < model.filled ? "dot" : i < model.target ? "slot" : "empty";
    const tappable = cls !== "empty";
    return tappable ? `<button type="button" class="tp-cell ${cls}" data-cell="${i}" aria-label="Counter ${i + 1}"></button>` : `<span class="tp-cell empty"></span>`;
  });
  const groups = Array.from({ length: frames }, (_, f) => `<div class="tp-frame">${cells.slice(f * 10, f * 10 + 10).join("")}</div>`).join("");
  const prompt = kind === "join" ? "Tap each counter to count them all." : kind === "takeAway" ? `Tap ${model.target - model.filled} counters to take them away.` : "Tap the empty spaces to fill the ten-frame.";
  const label = kind === "join" ? "Counted" : kind === "takeAway" ? "Left" : "Added";
  const startValue = kind === "takeAway" ? model.target : 0;
  return `<div class="tp-live" data-live="frames" data-kind="${kind}"><p class="tp-prompt">${prompt}</p><div class="tp-frames">${groups}</div><p class="tp-readout">${label}: <b data-readout>${startValue}</b></p></div>`;
}

function tapArray(model) {
  if (model.a > 12 || model.b > 12) return tapArea(model);
  const rows = Array.from({ length: model.a }, (_, r) => {
    const tone = r < model.split ? "row-a" : "row-b";
    return `<button type="button" class="tp-row ${tone}" data-row="${r}" aria-label="Row ${r + 1}">${Array.from({ length: model.b }, () => `<span class="tp-dot">${model.unit ? model.unit : ""}</span>`).join("")}<b class="tp-run" aria-hidden="true"></b></button>`;
  }).join("");
  const each = model.unit ? `${model.b} tens` : model.b;
  return `<div class="tp-live" data-live="array" data-size="${model.b * (model.unit || 1)}"><p class="tp-prompt">Tap each row to count by ${model.unit ? `${model.b * model.unit}s` : `${model.b}s`}.</p><div class="tp-array${model.unit ? " tens" : ""}">${rows}</div><p class="tp-readout">${model.a} rows of ${esc(each)}. Total so far: <b data-readout>0</b></p></div>`;
}

function tapArea(model) {
  const left = model.split;
  const right = model.a - model.split;
  const leftWidth = Math.max(25, Math.min(80, Math.round((left / model.a) * 100)));
  const part = (size, flex) => `<button type="button" class="tp-part" data-part="${size * model.b}" style="flex:${flex}"><b>${size.toLocaleString("en-US")} × ${model.b}</b><i data-product></i></button>`;
  return `<div class="tp-live" data-live="area"><p class="tp-prompt">Tap each part to multiply it.</p><div class="tp-area"><span class="tp-area-side">${model.b}</span><div class="tp-area-box">${part(left, leftWidth)}${right ? part(right, 100 - leftWidth) : ""}</div></div><p class="tp-readout">Parts added: <b data-readout>0</b></p></div>`;
}

function tapLine(model) {
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
      return `<g class="tp-hop" data-hop="${i}"><path class="tp-jump" d="M${from},92 Q${mid},${28 + i * 10} ${to},92"/><text x="${mid}" y="${24 + i * 10}">${jump > 0 ? "+" : "−"}${Math.abs(jump).toLocaleString("en-US")}</text><path class="tp-tick" d="M${to},86 v14"/><text class="tp-land" x="${to}" y="122" data-land="${points[i + 1].toLocaleString("en-US")}">?</text></g>`;
    })
    .join("");
  const buttons = model.jumps.map((jump, i) => `<button type="button" class="tp-hop-btn" data-jump="${i}"${i ? " disabled" : ""}>Jump ${jump > 0 ? "+" : "−"}${Math.abs(jump).toLocaleString("en-US")}</button>`).join("");
  return `<div class="tp-live" data-live="line"><svg class="tp-line" viewBox="0 0 500 132" role="img" aria-label="${esc(model.caption || "Number line")}"><path class="tp-axis" d="M14,93 H486"/><path class="tp-tick" d="M${x(model.start)},86 v14"/><text class="tp-start" x="${x(model.start)}" y="122">${model.start.toLocaleString("en-US")}</text>${arcs}</svg><div class="tp-hop-row">${buttons}</div></div>`;
}

export function interactivePicture(model) {
  if (!model) return "";
  if (model.type === "counters" && model.kind) return countFrames(model);
  if (model.type === "array") return tapArray(model);
  if (model.type === "numberline") return tapLine(model);
  return "";
}

// One delegated handler for every interactive model. Returns true when it handled the tap.
export function handleModelTap(target) {
  const live = target.closest(".tp-live");
  if (!live) return false;
  const readout = live.querySelector("[data-readout]");
  const cell = target.closest("[data-cell]");
  if (cell) {
    const kind = live.dataset.kind;
    if (kind === "join") {
      if (cell.dataset.n) return true;
      const n = live.querySelectorAll("[data-n]").length + 1;
      cell.dataset.n = n;
      cell.textContent = n;
      readout.textContent = n;
    } else if (kind === "takeAway") {
      cell.classList.toggle("gone");
      readout.textContent = live.querySelectorAll(".tp-cell.dot:not(.gone)").length;
    } else if (cell.classList.contains("slot") || cell.classList.contains("filled")) {
      cell.classList.toggle("filled");
      readout.textContent = live.querySelectorAll(".tp-cell.filled").length;
    }
    return true;
  }
  const row = target.closest("[data-row]");
  if (row) {
    const rows = [...live.querySelectorAll("[data-row]")];
    const size = Number(live.dataset.size);
    const counted = rows.filter((r) => r.classList.contains("counted")).length;
    // Rows count in order: tapping counts the next row; tapping the last counted row undoes it.
    if (row.classList.contains("counted") && rows.indexOf(row) === counted - 1) {
      row.classList.remove("counted");
      row.querySelector(".tp-run").textContent = "";
    } else if (!row.classList.contains("counted")) {
      const next = rows[counted];
      next.classList.add("counted");
      next.querySelector(".tp-run").textContent = ((counted + 1) * size).toLocaleString("en-US");
    }
    readout.textContent = (rows.filter((r) => r.classList.contains("counted")).length * size).toLocaleString("en-US");
    return true;
  }
  const part = target.closest("[data-part]");
  if (part) {
    part.classList.add("done");
    part.querySelector("[data-product]").textContent = `= ${Number(part.dataset.part).toLocaleString("en-US")}`;
    const sum = [...live.querySelectorAll(".tp-part.done")].reduce((total, p) => total + Number(p.dataset.part), 0);
    readout.textContent = sum.toLocaleString("en-US");
    return true;
  }
  const hop = target.closest("[data-jump]");
  if (hop) {
    const i = Number(hop.dataset.jump);
    const group = live.querySelector(`[data-hop="${i}"]`);
    group.classList.add("shown");
    const land = group.querySelector("[data-land]");
    land.textContent = land.dataset.land;
    hop.disabled = true;
    live.querySelector(`[data-jump="${i + 1}"]`)?.removeAttribute("disabled");
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
    .replace(/^(?:So|Size:|Check:)\s+/, "")
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

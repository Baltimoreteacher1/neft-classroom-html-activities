// Build-the-idea figures: geometry, solids, bars, tables, long division,
// factor trees, area models and balances. Spec rules live in
// tools/lib/small-group-build-figure-rules.mjs; see small-group-build-figures.js
// for why these are drawn from authored specs only.

import { esc, fmt, mathHtml, svg, text, textWidth } from "./small-group-build-figure-kit.js";

const show = (v) => (typeof v === "number" ? fmt(v) : String(v ?? ""));

/** Estimated box of a label (SVG text cannot be measured while building strings). */
function labelBox(l) {
  const w = String(l.s).replace(/[{}]/g, "").length * 8.6 + 6;
  const x0 = l.anchor === "middle" ? l.x - w / 2 : l.anchor === "end" ? l.x - w : l.x;
  return { x0, x1: x0 + w, y0: l.y - 15, y1: l.y + 4 };
}

/**
 * Nudge labels that would print on top of one another. Side labels go first
 * and stay put; a later label that collides steps down, then up, then sideways.
 */
function placeLabels(labels) {
  const order = [...labels].sort(
    (a, b) => (a.cls.includes("sgf-num") ? 0 : 1) - (b.cls.includes("sgf-num") ? 0 : 1),
  );
  const placed = [];
  const hits = (b) => placed.some((p) => b.x0 < p.x1 && b.x1 > p.x0 && b.y0 < p.y1 && b.y1 > p.y0);
  for (const l of order) {
    const tries = [
      [0, 0],
      [0, 20],
      [0, -20],
      [0, 38],
      [24, 0],
      [-24, 0],
      [0, -38],
    ];
    let best = l;
    for (const [dx, dy] of tries) {
      const cand = { ...l, x: l.x + dx, y: l.y + dy };
      if (!hits(labelBox(cand))) {
        best = cand;
        break;
      }
    }
    placed.push(labelBox(best));
    l.x = best.x;
    l.y = best.y;
  }
  return labels;
}

function shape(f) {
  const all = [
    ...f.polygons.flatMap((p) => p.points),
    ...(f.sides || []).flatMap((s) => [s.from, s.to]),
    ...(f.heights || []).flatMap((s) => [s.from, s.to]),
  ];
  const xs = all.map((p) => p[0]);
  const ys = all.map((p) => p[1]);
  const [minX, maxX, minY, maxY] = [
    Math.min(...xs),
    Math.max(...xs),
    Math.min(...ys),
    Math.max(...ys),
  ];
  const pad = 56;
  const s = Math.min(380 / Math.max(maxX - minX, 1e-9), 240 / Math.max(maxY - minY, 1e-9));
  const W = (maxX - minX) * s + 2 * pad;
  const H = (maxY - minY) * s + 2 * pad;
  const P = ([x, y]) => [pad + (x - minX) * s, pad + (maxY - y) * s];
  const solid = f.polygons.filter((p) => !p.cut).flatMap((p) => p.points);
  const cx = solid.reduce((a, p) => a + p[0], 0) / solid.length;
  const cy = solid.reduce((a, p) => a + p[1], 0) / solid.length;
  const labels = [];
  let body = `<defs><pattern id="sgf-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" class="sgf-hatch"/></pattern></defs>`;
  for (const poly of f.polygons) {
    const pts = poly.points
      .map((p) =>
        P(p)
          .map((n) => n.toFixed(1))
          .join(","),
      )
      .join(" ");
    body += `<polygon class="${poly.cut ? "sgf-cut" : "sgf-face"}" points="${pts}"/>`;
    if (poly.label) {
      const mx = poly.points.reduce((a, p) => a + p[0], 0) / poly.points.length;
      const my = poly.points.reduce((a, p) => a + p[1], 0) / poly.points.length;
      let [lx, ly] = P([mx, my]);
      // Keep the label off a dashed height that crosses the middle of the shape.
      const half = String(poly.label).length * 4.5 + 8;
      for (const h of f.heights || []) {
        const [hx1, hy1] = P(h.from);
        const [hx2, hy2] = P(h.to);
        const t = Math.abs(hy2 - hy1) < 1e-6 ? 0.5 : (ly - hy1) / (hy2 - hy1);
        const hx = hx1 + (hx2 - hx1) * Math.min(1, Math.max(0, t));
        if (Math.abs(hx - lx) < half + 34) lx = hx + (lx >= hx ? 1 : -1) * (half + 40);
      }
      labels.push({
        x: lx,
        y: ly + 5,
        s: poly.label,
        cls: "sgf-t sgf-callout sgf-halo",
        anchor: "middle",
      });
    }
  }
  for (const h of f.heights || []) {
    const [x1, y1] = P(h.from);
    const [x2, y2] = P(h.to);
    body += `<line class="sgf-height" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
    const dir = Math.sign(x1 - x2 || 1);
    body += `<path class="sgf-right" d="M${x2 + 10 * dir},${y2} v${y1 > y2 ? 10 : -10} h${-10 * dir}"/>`;
    labels.push({
      x: (x1 + x2) / 2 + 8,
      y: (y1 + y2) / 2 + 5,
      s: h.text,
      cls: "sgf-t sgf-callout sgf-halo",
      anchor: "start",
    });
  }
  for (const side of f.sides || []) {
    const [x1, y1] = P(side.from);
    const [x2, y2] = P(side.to);
    const [mx, my] = [(x1 + x2) / 2, (y1 + y2) / 2];
    let [nx, ny] = [-(y2 - y1), x2 - x1];
    const len = Math.hypot(nx, ny) || 1;
    [nx, ny] = [nx / len, ny / len];
    const [ccx, ccy] = P([cx, cy]);
    if ((mx - ccx) * nx + (my - ccy) * ny < 0) [nx, ny] = [-nx, -ny];
    const anchor = Math.abs(nx) > 0.7 ? (nx > 0 ? "start" : "end") : "middle";
    labels.push({
      x: mx + nx * 14,
      y: my + ny * 14 + (ny > 0.7 ? 10 : 5),
      s: side.text,
      cls: "sgf-t sgf-num sgf-halo",
      anchor,
    });
  }
  for (const l of placeLabels(labels)) body += text(l.x, l.y, l.s, l.cls, l.anchor);
  return svg(W, H, body, `Figure with sides ${(f.sides || []).map((x) => x.text).join(", ")}`);
}

function prism(f) {
  const ang = (35 * Math.PI) / 180;
  const depth = 0.6;
  const spanX = f.l + f.w * depth * Math.cos(ang);
  const spanY = f.h + f.w * depth * Math.sin(ang);
  const s = Math.min(320 / spanX, 220 / spanY);
  const dx = f.w * s * depth * Math.cos(ang);
  const dy = f.w * s * depth * Math.sin(ang);
  const u = f.unit ? ` ${f.unit}` : "";
  const lab = {
    l: `${fmt(f.l)}${u}`,
    w: `${fmt(f.w)}${u}`,
    h: `${fmt(f.h)}${u}`,
    ...(f.labels || {}),
  };
  const x0 = Math.max(70, String(lab.h).replace(/[{}]/g, "").length * 9 + 24);
  const y0 = 30 + dy;
  const L = f.l * s;
  const Hh = f.h * s;
  const front = `${x0},${y0} ${x0 + L},${y0} ${x0 + L},${y0 + Hh} ${x0},${y0 + Hh}`;
  const top = `${x0},${y0} ${x0 + dx},${y0 - dy} ${x0 + L + dx},${y0 - dy} ${x0 + L},${y0}`;
  const side = `${x0 + L},${y0} ${x0 + L + dx},${y0 - dy} ${x0 + L + dx},${y0 + Hh - dy} ${x0 + L},${y0 + Hh}`;
  let body = `<polygon class="sgf-face" points="${front}"/><polygon class="sgf-face sgf-top" points="${top}"/><polygon class="sgf-face sgf-side" points="${side}"/>`;
  if (f.cubes) {
    const unit = s;
    for (let i = 1; i < f.l; i++) {
      body += `<line class="sgf-cube" x1="${x0 + i * unit}" y1="${y0}" x2="${x0 + i * unit}" y2="${y0 + Hh}"/>`;
      body += `<line class="sgf-cube" x1="${x0 + i * unit}" y1="${y0}" x2="${x0 + i * unit + dx}" y2="${y0 - dy}"/>`;
    }
    for (let j = 1; j < f.h; j++) {
      body += `<line class="sgf-cube" x1="${x0}" y1="${y0 + j * unit}" x2="${x0 + L}" y2="${y0 + j * unit}"/>`;
      body += `<line class="sgf-cube" x1="${x0 + L}" y1="${y0 + j * unit}" x2="${x0 + L + dx}" y2="${y0 + j * unit - dy}"/>`;
    }
    for (let k = 1; k < f.w; k++) {
      const ox = (dx * k) / f.w;
      const oy = (dy * k) / f.w;
      body += `<line class="sgf-cube" x1="${x0 + ox}" y1="${y0 - oy}" x2="${x0 + L + ox}" y2="${y0 - oy}"/>`;
      body += `<line class="sgf-cube" x1="${x0 + L + ox}" y1="${y0 - oy}" x2="${x0 + L + ox}" y2="${y0 + Hh - oy}"/>`;
    }
  }
  body += text(x0 + L / 2, y0 + Hh + 26, lab.l, "sgf-t sgf-num");
  body += text(x0 - 10, y0 + Hh / 2 + 5, lab.h, "sgf-t sgf-num", "end");
  body += text(x0 + L + dx / 2 + 12, y0 + Hh - dy / 2 + 16, lab.w, "sgf-t sgf-num", "start");
  return svg(
    x0 + L + dx + 90,
    y0 + Hh + 44,
    body,
    `Rectangular prism ${fmt(f.l)} by ${fmt(f.w)} by ${fmt(f.h)}${u}`,
  );
}

function tape(f) {
  const maxParts = Math.max(...f.rows.map((r) => r.parts));
  // A part is never narrower than its own label.
  const partLabel = Math.max(0, ...f.rows.map((r) => (r.partText ? textWidth(r.partText) + 6 : 0)));
  const unit = Math.max(Math.min(64, 420 / maxParts), partLabel);
  const labelW = Math.max(70, ...f.rows.map((r) => textWidth(r.label) + 14));
  const rowH = 44;
  const gap = f.rows.some((r) => r.total) ? 34 : 16;
  let body = "";
  f.rows.forEach((r, i) => {
    const y = 12 + i * (rowH + gap) + (r.total ? 24 : 0);
    body += text(labelW - 12, y + rowH / 2 + 5, r.label, "sgf-t sgf-row-label", "end");
    for (let k = 0; k < r.parts; k++) {
      const on = k < (r.shaded ?? 0);
      body += `<rect class="${on ? "sgf-part sgf-on" : "sgf-part"}" x="${labelW + k * unit}" y="${y}" width="${unit}" height="${rowH}"/>`;
      if (r.partText)
        body += text(labelW + k * unit + unit / 2, y + rowH / 2 + 5, r.partText, "sgf-t sgf-num");
    }
    if (r.total) {
      const x2 = labelW + r.parts * unit;
      body += `<path class="sgf-brace" d="M${labelW},${y - 6} v-8 H${x2} v8"/>`;
      body += text((labelW + x2) / 2, y - 20, r.total, "sgf-t sgf-callout");
    }
  });
  const H = 12 + f.rows.length * (rowH + gap) + (f.rows.some((r) => r.total) ? 24 : 0);
  return svg(
    labelW + maxParts * unit + 20,
    H,
    body,
    `Tape diagram: ${f.rows.map((r) => r.label).join(", ")}`,
  );
}

function htmlTable(f) {
  const head = f.headers.map((h) => `<th scope="col">${mathHtml(h)}</th>`).join("");
  const rows = f.rows
    .map(
      (r, i) =>
        `<tr${i === f.highlight ? ' class="sgf-hl"' : ""}>${r.map((c) => `<td>${mathHtml(show(c))}</td>`).join("")}</tr>`,
    )
    .join("");
  return `<table class="sgf-table"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`;
}

/**
 * An equivalent-ratio table, set the way Reveal draws one: each quantity is a
 * labelled ROW, each equivalent ratio a COLUMN, and the scale factor between
 * two columns is the same arrow above the top row and below the bottom row —
 * "do the same to both". `rows` keeps the authored shape (one array per
 * ratio, in header order); `scales[i]` labels the move from ratio i to i + 1
 * ("× 3", "÷ 2"); a "?" cell is the value the student finds.
 */
function ratioTable(spec) {
  // `blank` prints the frame a student fills in: row labels, empty cells, and
  // a line on each arrow for the × or ÷ they choose.
  const f = spec.blank
    ? {
        ...spec,
        // One spare column, so there is room for a bridge step on paper.
        rows: [...spec.rows, spec.rows[0]].slice(0, 5).map((col) => col.map(() => "")),
        scales: spec.rows.slice(0, 4).map(() => "____"),
        highlight: undefined,
      }
    : spec;
  const quantities = f.headers.length;
  const cols = f.rows.length;
  const labelW = Math.max(...f.headers.map((h) => textWidth(h, 15))) + 20;
  const cellW = Math.max(64, ...f.rows.flat().map((v) => textWidth(show(v), 17) + 28));
  const cellH = 46;
  const scales = Array.isArray(f.scales) ? f.scales : [];
  const arrowH = scales.some(Boolean) ? 44 : 8;
  const x0 = 6 + labelW;
  const y0 = arrowH;
  let body = "";
  f.headers.forEach((h, r) => {
    const y = y0 + r * cellH;
    body += `<rect class="sgf-rt-label" x="6" y="${y}" width="${labelW}" height="${cellH}"/>`;
    body += text(6 + labelW / 2, y + cellH / 2 + 5, h, "sgf-t sgf-rt-head", "middle", 15);
    f.rows.forEach((row, c) => {
      const x = x0 + c * cellW;
      const v = show(row[r]);
      const unknown = v.trim() === "?";
      const hl = c === f.highlight;
      body += `<rect class="sgf-rt-cell${hl ? " sgf-on" : ""}" x="${x}" y="${y}" width="${cellW}" height="${cellH}"/>`;
      body += text(
        x + cellW / 2,
        y + cellH / 2 + 6,
        v,
        unknown ? "sgf-t sgf-q sgf-rt-v" : "sgf-t sgf-rt-v",
        "middle",
        17,
      );
    });
  });
  const yBottom = y0 + quantities * cellH;
  scales.forEach((label, i) => {
    if (!label || i >= cols - 1) return;
    const xa = x0 + i * cellW + cellW / 2;
    const xb = xa + cellW;
    const mid = (xa + xb) / 2;
    // Top arrow arcs over the table; bottom arrow mirrors it under the table.
    body += `<path class="sgf-jump" d="M${xa + 6},${y0 - 4} Q${mid},${y0 - 30} ${xb - 6},${y0 - 4}"/>`;
    body += `<path class="sgf-jump-head" d="M${xb - 6},${y0 - 3} l-9,-5 l2,9 z"/>`;
    body += text(mid, y0 - 24, label, "sgf-callout", "middle", 15);
    body += `<path class="sgf-jump" d="M${xa + 6},${yBottom + 4} Q${mid},${yBottom + 30} ${xb - 6},${yBottom + 4}"/>`;
    body += `<path class="sgf-jump-head" d="M${xb - 6},${yBottom + 3} l-9,5 l2,-9 z"/>`;
    body += text(mid, yBottom + 38, label, "sgf-callout", "middle", 15);
  });
  const w = x0 + cols * cellW + 8;
  const h = yBottom + arrowH + 2;
  const said = f.rows.map((row) => row.map(show).join(" to ")).join("; ");
  return svg(w, h, body, `Ratio table, ${f.headers.join(" and ")}: ${said}`);
}

function fractionBars(f) {
  const W = 420;
  const rowH = 40;
  let body = "";
  f.bars.forEach((b, i) => {
    const y = 8 + i * (rowH + 14);
    const w = W / b.parts;
    for (let k = 0; k < b.parts; k++)
      body += `<rect class="${k < b.shaded ? "sgf-part sgf-on" : "sgf-part"}" x="${10 + k * w}" y="${y}" width="${w}" height="${rowH}"/>`;
    if (b.text) body += text(W + 24, y + rowH / 2 + 5, b.text, "sgf-t sgf-num", "start");
  });
  return svg(
    W + 34 + Math.max(0, ...f.bars.map((b) => textWidth(b.text))),
    8 + f.bars.length * (rowH + 14),
    body,
    `Fraction bars: ${f.bars.map((b) => `${b.shaded} of ${b.parts}`).join(", ")}`,
  );
}

function hundredGrid(f) {
  const c = 22;
  let body = "";
  for (let i = 0; i < 100; i++) {
    const on = i < f.shaded;
    body += `<rect class="${on ? "sgf-part sgf-on" : "sgf-part"}" x="${4 + (i % 10) * c}" y="${4 + Math.floor(i / 10) * c}" width="${c}" height="${c}"/>`;
  }
  if (f.text) body += text(4 + 5 * c, 10 * c + 30, f.text, "sgf-t sgf-callout");
  return svg(
    10 * c + 8,
    10 * c + (f.text ? 40 : 8),
    body,
    `Hundred grid with ${fmt(f.shaded)} of 100 shaded`,
  );
}

/** Standard algorithm, worked to the end (decimal dividends extend with zeros, at most 3). */
export function longDivisionSteps(dividendStr, divisor) {
  const d = Number(divisor);
  const point = dividendStr.indexOf(".");
  const digits = dividendStr.replace(".", "").split("").map(Number);
  const intDigits = point === -1 ? digits.length : point;
  const quotient = [];
  const steps = [];
  let r = 0;
  let started = false;
  let extra = 0;
  for (let i = 0; i < digits.length || (point !== -1 && r !== 0 && extra < 3); i++) {
    if (i >= digits.length) {
      digits.push(0);
      extra++;
    }
    const partial = r * 10 + digits[i];
    const q = Math.floor(partial / d);
    if (q > 0 || started || i >= intDigits - 1) started = true;
    quotient.push(started ? q : null);
    // 3 ÷ 8: the ones place gets a 0 in the quotient, but nothing is
    // subtracted there — the work starts at 30, as it is taught.
    const leadingZero = q === 0 && partial < d && steps.length === 0;
    if (started && !leadingZero)
      steps.push({ col: i, partial, product: q * d, diff: partial - q * d });
    r = partial - q * d;
  }
  return { digits, intDigits, quotient, steps, remainder: r, decimal: point !== -1 || extra > 0 };
}

function longDivision(f) {
  const { digits, intDigits, quotient, steps, remainder, decimal } = longDivisionSteps(
    String(f.dividend),
    f.divisor,
  );
  const cw = 22;
  const rh = 30;
  const divW = String(f.divisor).length * 12 + 26;
  const left = divW + 16;
  const col = (i) => left + (i + (decimal && i >= intDigits ? 0.5 : 0)) * cw + cw / 2;
  const top = 34;
  let body = "";
  quotient.forEach((q, i) => {
    if (q !== null) body += text(col(i), top, String(q), "sgf-t sgf-ld sgf-q");
  });
  if (decimal) body += text(left + intDigits * cw + cw / 4, top, ".", "sgf-t sgf-ld sgf-q");
  if (remainder && !decimal)
    body += text(
      col(quotient.length - 1) + cw,
      top,
      `R ${remainder}`,
      "sgf-t sgf-ld sgf-q",
      "start",
    );
  const y0 = top + rh;
  body += text(divW, y0, String(f.divisor), "sgf-t sgf-ld", "end");
  const right = left + (digits.length + (decimal ? 0.5 : 0)) * cw + 6;
  body += `<path class="sgf-bracket" d="M${divW + 8},${y0 + 8} Q${divW + 18},${y0 - 6} ${divW + 10},${y0 - 22} L${right},${y0 - 22}"/>`;
  digits.forEach((dg, i) => {
    body += text(col(i), y0, String(dg), "sgf-t sgf-ld");
  });
  if (decimal) body += text(left + intDigits * cw + cw / 4, y0, ".", "sgf-t sgf-ld");
  let y = y0;
  steps.forEach((st, k) => {
    const pStr = String(st.product);
    y += rh;
    pStr.split("").forEach((ch, j) => {
      body += text(col(st.col - (pStr.length - 1 - j)), y, ch, "sgf-t sgf-ld");
    });
    body += text(col(st.col - pStr.length) + 6, y, "−", "sgf-t sgf-ld");
    const x1 = col(st.col - pStr.length + 1) - cw / 2 - 2;
    body += `<line class="sgf-rule" x1="${x1}" y1="${y + 8}" x2="${col(st.col) + cw / 2}" y2="${y + 8}"/>`;
    y += rh;
    const next = steps[k + 1];
    const dStr = String(st.diff);
    dStr.split("").forEach((ch, j) => {
      body += text(col(st.col - (dStr.length - 1 - j)), y, ch, "sgf-t sgf-ld");
    });
    if (next) body += text(col(next.col), y, String(digits[next.col]), "sgf-t sgf-ld sgf-q");
  });
  const q = quotient.map((x) => (x === null ? "" : x)).join("");
  return svg(
    right + 70,
    y + 16,
    body,
    `Long division: ${f.dividend} divided by ${f.divisor}, quotient ${q}`,
  );
}

function factorTree(f) {
  const kids = new Map();
  for (const [p, a, b] of f.splits || []) kids.set(p, [a, b]);
  const used = new Set();
  const build = (v) => {
    const k = kids.get(v);
    if (!k || used.has(v)) return { v, kids: [] };
    used.add(v);
    return { v, kids: k.map(build) };
  };
  const tree = build(f.root);
  const leaves = (n) => (n.kids.length ? n.kids.reduce((a, c) => a + leaves(c), 0) : 1);
  const depth = (n) => 1 + Math.max(0, ...n.kids.map(depth));
  const gapX = 64;
  const gapY = 66;
  const W = leaves(tree) * gapX + 20;
  const H = depth(tree) * gapY + 10;
  let body = "";
  const place = (n, x0, lvl) => {
    const w = leaves(n) * gapX;
    const x = x0 + w / 2;
    const y = 34 + lvl * gapY;
    let off = x0;
    for (const c of n.kids) {
      const cw = leaves(c) * gapX;
      body += `<line class="sgf-branch" x1="${x}" y1="${y + 16}" x2="${off + cw / 2}" y2="${y + gapY - 18}"/>`;
      place(c, off, lvl + 1);
      off += cw;
    }
    const leaf = !n.kids.length;
    body += `<circle class="${leaf ? "sgf-node sgf-on" : "sgf-node"}" cx="${x}" cy="${y}" r="19"/>`;
    body += text(x, y + 6, fmt(n.v), `sgf-t sgf-num${leaf ? " sgf-leaf" : ""}`);
  };
  place(tree, 10, 0);
  return svg(W, H, body, `Factor tree for ${f.root}`);
}

function areaModel(f) {
  const cw = 104;
  const ch = 58;
  const lx = 78;
  const ty = 34;
  let body = "";
  f.cols.forEach((c, j) => {
    body += text(lx + j * cw + cw / 2, ty - 12, show(c), "sgf-t sgf-num");
  });
  f.rows.forEach((r, i) => {
    body += text(lx - 12, ty + i * ch + ch / 2 + 5, show(r), "sgf-t sgf-num", "end");
    f.cols.forEach((_, j) => {
      body += `<rect class="sgf-cell" x="${lx + j * cw}" y="${ty + i * ch}" width="${cw}" height="${ch}"/>`;
      body += text(
        lx + j * cw + cw / 2,
        ty + i * ch + ch / 2 + 6,
        show(f.cells[i][j]),
        "sgf-t sgf-callout",
      );
    });
  });
  return svg(lx + f.cols.length * cw + 10, ty + f.rows.length * ch + 10, body, "Area model");
}

function balance(f) {
  const W = 440;
  let body = `<path class="sgf-fulcrum" d="M${W / 2},92 l-26,44 h52 z"/>`;
  body += `<line class="sgf-beam" x1="60" y1="92" x2="${W - 60}" y2="92"/>`;
  for (const [x, label] of [
    [110, f.left],
    [W - 110, f.right],
  ]) {
    body += `<line class="sgf-hang" x1="${x}" y1="92" x2="${x}" y2="70"/>`;
    body += `<rect class="sgf-pan" x="${x - 86}" y="22" width="172" height="48" rx="8"/>`;
    body += text(x, 53, label, "sgf-t sgf-callout");
  }
  body += text(W / 2, 64, "=", "sgf-t sgf-eq");
  return svg(W, 144, body, `Balance: ${f.left} equals ${f.right}`);
}

export const SHAPE_FIGURES = {
  shape,
  prism,
  tape,
  ratioTable,
  table: htmlTable,
  fractionBars,
  hundredGrid,
  longDivision,
  factorTree,
  areaModel,
  balance,
};

export const SHAPE_FIGURE_CSS = `
.sgf-face{fill:color-mix(in srgb,var(--sg,#1f6fb2) 14%,#fff);stroke:var(--sg-text,#1d2a36);stroke-width:2.5;stroke-linejoin:round}
.sgf-face.sgf-top{fill:color-mix(in srgb,var(--sg,#1f6fb2) 24%,#fff)}
.sgf-face.sgf-side{fill:color-mix(in srgb,var(--sg,#1f6fb2) 34%,#fff)}
.sgf-cut{fill:url(#sgf-hatch);stroke:var(--sg-bad,#bd5032);stroke-width:2;stroke-dasharray:6 4}
.sgf-hatch{stroke:var(--sg-bad,#bd5032);stroke-width:1.5}
.sgf-height{stroke:var(--sg,#1f6fb2);stroke-width:2;stroke-dasharray:6 4}
.sgf-right{fill:none;stroke:var(--sg,#1f6fb2);stroke-width:1.5}
.sgf-cube{stroke:var(--sg-text,#1d2a36);stroke-width:1;opacity:.45}
.sgf-part,.sgf-cell{fill:#fff;stroke:var(--sg-text,#1d2a36);stroke-width:1.5}
.sgf-part.sgf-on{fill:color-mix(in srgb,var(--sg,#1f6fb2) 30%,#fff)}
.sgf-cell{fill:color-mix(in srgb,var(--sg,#1f6fb2) 8%,#fff)}
.sgf-brace,.sgf-bracket,.sgf-rule{fill:none;stroke:var(--sg-text,#1d2a36);stroke-width:2}
.sgf-ld{font-size:20px;font-weight:600}
.sgf-q{fill:var(--sg,#1f6fb2);font-weight:800}
.sgf-branch{stroke:var(--sg-text,#1d2a36);stroke-width:2}
.sgf-node{fill:#fff;stroke:var(--sg-text,#1d2a36);stroke-width:2}
.sgf-node.sgf-on{fill:color-mix(in srgb,var(--sg,#1f6fb2) 22%,#fff);stroke:var(--sg,#1f6fb2)}
.sgf-leaf{font-weight:800}
.sgf-fulcrum{fill:var(--sg-text,#1d2a36)}
.sgf-beam{stroke:var(--sg-text,#1d2a36);stroke-width:5;stroke-linecap:round}
.sgf-hang{stroke:var(--sg-text,#1d2a36);stroke-width:2}
.sgf-pan{fill:color-mix(in srgb,var(--sg,#1f6fb2) 12%,#fff);stroke:var(--sg-text,#1d2a36);stroke-width:2}
.sgf-eq{font-size:30px;font-weight:800}
.sgf-rt-label{fill:color-mix(in srgb,var(--sg,#1f6fb2) 14%,#fff);stroke:var(--sg-text,#1d2a36);stroke-width:1.5}
.sgf-rt-cell{fill:#fff;stroke:var(--sg-text,#1d2a36);stroke-width:1.5}
.sgf-rt-cell.sgf-on{fill:color-mix(in srgb,var(--sg,#1f6fb2) 22%,#fff)}
.sgf-rt-head{font-weight:700}
.sgf-rt-v{font-weight:600}
.sgf-table{border-collapse:collapse;font-variant-numeric:tabular-nums lining-nums;font-size:17px;min-width:240px}
.sgf-table th,.sgf-table td{border:1.5px solid var(--sg-text,#1d2a36);padding:8px 18px;text-align:center}
.sgf-table th{background:color-mix(in srgb,var(--sg,#1f6fb2) 14%,#fff);font-weight:700}
.sgf-table .sgf-hl td{background:color-mix(in srgb,var(--sg,#1f6fb2) 22%,#fff);font-weight:700}
`;

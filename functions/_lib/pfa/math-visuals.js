// Shared data-driven SVG renderer for PFA math visuals (server and browser).
//
// renderVisual(spec, opts) -> SVG string. Every scale and value is computed from `spec`; nothing is a
// picture of a number. Accepts the visual specs in the generators (functions/_lib/pfa/generators.js)
// and the worked-example specs already authored in lessons/<id>/config.json (`launch.conceptIntro.
// iDo.viz`, keyed by `t`). Bilingual labels ({en, es}) render as paired <tspan class="lang-en|lang-es">
// and the page's language class shows one.
//
// Every positioned mark carries data-v (its value) and the SVG carries data-scale "x0,x1,v0,v1" so
// tools/pfa/validate-pfa.mjs can recompute each position independently (gate 13).
//
// Animation hooks only: elements with class "mv-step" and data-step="n" are revealed by the page in
// order; CSS animates transform/opacity only, and reduced motion shows them all at once.

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const fmt = (n) =>
  typeof n === "number" ? String(Math.round(n * 1000) / 1000).replace(/-/g, "−") : esc(n);

// Bilingual text node. Plain strings are language-neutral (numbers, symbols) or English-only
// authored labels (counted by the translation gate).
function tx(label, x, y, attrs = "") {
  if (label && typeof label === "object") {
    return `<text x="${x}" y="${y}" ${attrs}><tspan class="lang-en">${esc(label.en)}</tspan><tspan class="lang-es">${esc(label.es ?? label.en)}</tspan></text>`;
  }
  return `<text x="${x}" y="${y}" ${attrs}>${fmt(label)}</text>`;
}
const plain = (label) => (label && typeof label === "object" ? label.en : String(label ?? ""));

let uid = 0;
function frame(w, h, title, body, extra = "") {
  uid += 1;
  const id = `mv${uid}`;
  return `<svg class="mv" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="${id}t" ${extra} xmlns="http://www.w3.org/2000/svg"><title id="${id}t">${esc(title)}</title>${body}</svg>`;
}

function linear(v0, v1, x0, x1) {
  return (v) => x0 + ((v - v0) / (v1 - v0)) * (x1 - x0);
}

function axisTicks(sx, y, min, max, step, labelEvery = 1) {
  let out = `<line class="mv-axis" x1="${sx(min)}" y1="${y}" x2="${sx(max)}" y2="${y}"/>`;
  let k = 0;
  for (let v = min; v <= max + 1e-9; v += step, k++) {
    const x = sx(v);
    out += `<line class="mv-tick" x1="${x}" y1="${y - 6}" x2="${x}" y2="${y + 6}"/>`;
    if (k % labelEvery === 0)
      out += tx(
        Math.round(v * 1000) / 1000,
        x,
        y + 24,
        'class="mv-num mv-scale" text-anchor="middle"',
      );
  }
  return out;
}

const R = {};

R.tape = (s) => {
  const rows = s.rows || [{ label: s.label || "", parts: s.parts, total: s.total }];
  const W = 640;
  const left = 110;
  const width = W - left - 20;
  const rowH = 56;
  let body = "";
  const maxTotal = Math.max(...rows.map((r) => r.parts.reduce((a, p) => a + Number(p.v || 0), 0)));
  rows.forEach((row, ri) => {
    const y = 20 + ri * (rowH + 18);
    const sum = row.parts.reduce((a, p) => a + Number(p.v || 0), 0);
    const sx = linear(0, maxTotal, left, left + width);
    let x = left;
    body += tx(row.label, 10, y + rowH / 2 + 6, 'class="mv-label"');
    row.parts.forEach((p, pi) => {
      const w = sx(Number(p.v)) - left;
      body += `<g class="mv-step" data-step="${ri * 10 + pi + 1}" data-v="${Number(p.v)}"><rect class="mv-part${p.shade ? " is-shaded" : ""}" x="${x}" y="${y}" width="${Math.max(w, 2)}" height="${rowH}" rx="6"/>${p.l !== "" && p.l != null ? tx(p.l, x + w / 2, y + rowH / 2 + 6, 'class="mv-in" text-anchor="middle"') : ""}</g>`;
      x += w;
    });
    if (row.total != null && row.total !== "")
      body += tx(
        row.total,
        x + 10 > W - 30 ? W - 14 : x + 10,
        y - 4,
        'class="mv-num" text-anchor="end"',
      );
    body += `<desc>${esc(`${plain(row.label)}: ${row.parts.map((p) => p.v).join(" + ")} = ${sum}`)}</desc>`;
  });
  const H = 20 + rows.length * (rowH + 18);
  return frame(
    W,
    H,
    s.alt ||
      `Tape diagram: ${rows.map((r) => r.parts.map((p) => plain(p.l) || p.v).join(" + ")).join("; ")}`,
    body,
    `data-scale="${left},${left + width},0,${maxTotal}"`,
  );
};

R.numberLine = (s) => {
  const min = s.min;
  const max = s.max;
  const step = s.step || 1;
  const W = 640;
  const sx = linear(min, max, 30, W - 30);
  const count = (max - min) / step;
  let body = axisTicks(sx, 60, min, max, step, count > 16 ? Math.ceil(count / 12) : 1);
  if (s.center != null)
    body += `<line class="mv-center" x1="${sx(s.center)}" y1="30" x2="${sx(s.center)}" y2="90"/>`;
  if (s.ray && !s.hideRay) {
    const end = s.ray.dir > 0 ? sx(max) : sx(min);
    body += `<g class="mv-step" data-step="2"><line class="mv-ray" x1="${sx(s.ray.from)}" y1="60" x2="${end}" y2="60"/><circle class="mv-pt${s.ray.closed ? "" : " is-open"}" cx="${sx(s.ray.from)}" cy="60" r="9" data-v="${s.ray.from}"/></g>`;
  }
  (s.marks || []).forEach((m, i) => {
    body += `<g class="mv-step" data-step="${i + 1}"><circle class="mv-pt${m.open ? " is-open" : ""}" cx="${sx(m.v)}" cy="60" r="8" data-v="${m.v}"/>${tx(m.l ?? m.v, sx(m.v), 34, 'class="mv-label" text-anchor="middle"')}</g>`;
  });
  return frame(
    W,
    100,
    s.alt ||
      `Number line from ${min} to ${max}${(s.marks || []).length ? `, marked at ${s.marks.map((m) => m.v).join(", ")}` : ""}`,
    body,
    `data-scale="30,${W - 30},${min},${max}"`,
  );
};
R.nline = R.numberLine;

R.dnl = (s) => {
  const top = s.top.values || s.top.vals;
  const bot = s.bottom.values || s.bottom.vals;
  const n = Math.max(top.length, bot.length);
  const W = 640;
  const x = (i) => 130 + (i * (W - 170)) / Math.max(1, n - 1);
  let body = `<line class="mv-axis" x1="130" y1="44" x2="${W - 40}" y2="44"/><line class="mv-axis" x1="130" y1="104" x2="${W - 40}" y2="104"/>`;
  body +=
    tx(s.top.label, 10, 40, 'class="mv-label"') + tx(s.bottom.label, 10, 110, 'class="mv-label"');
  for (let i = 0; i < n; i++) {
    body += `<g class="mv-step" data-step="${i + 1}"><line class="mv-tick" x1="${x(i)}" y1="36" x2="${x(i)}" y2="52"/><line class="mv-tick" x1="${x(i)}" y1="96" x2="${x(i)}" y2="112"/>${tx(top[i] ?? "", x(i), 28, 'class="mv-num" text-anchor="middle"')}${tx(bot[i] ?? "", x(i), 134, 'class="mv-num" text-anchor="middle"')}</g>`;
  }
  return frame(
    W,
    146,
    s.alt ||
      `Double number line: ${plain(s.top.label)} ${top.join(", ")}; ${plain(s.bottom.label)} ${bot.join(", ")}`,
    body,
  );
};

R.table = (s) => {
  const headers = s.headers || (s.hd || []).map((h) => h);
  const rows = s.rows || [];
  const cols = headers.length || rows[0]?.length || 2;
  const W = 640;
  const cw = (W - 20) / cols;
  const rh = 40;
  let body = "";
  headers.forEach((h, c) => {
    body += `<rect class="mv-th" x="${10 + c * cw}" y="10" width="${cw}" height="${rh}"/>${tx(h, 10 + c * cw + cw / 2, 36, 'class="mv-thtext" text-anchor="middle"')}`;
  });
  rows.forEach((r, ri) => {
    const y = 10 + (ri + 1) * rh;
    r.forEach((cell, c) => {
      const missing = cell === "?" || cell === "";
      body += `<g class="mv-step" data-step="${ri + 1}"><rect class="mv-td${missing ? " is-missing" : ""}" x="${10 + c * cw}" y="${y}" width="${cw}" height="${rh}"/>${tx(cell, 10 + c * cw + cw / 2, y + 26, `class="mv-num${missing ? " is-missing" : ""}" text-anchor="middle"`)}</g>`;
    });
  });
  return frame(
    W,
    20 + (rows.length + 1) * rh,
    s.alt || `Table: ${headers.map(plain).join(", ")}; ${rows.map((r) => r.join(" ")).join("; ")}`,
    body,
  );
};

R.coord = (s) => {
  const { xmin, xmax, ymin, ymax } = s;
  const W = 420;
  const H = 420;
  const sx = linear(xmin, xmax, 40, W - 20);
  const sy = linear(ymin, ymax, H - 40, 20);
  const stepX = xmax - xmin > 20 ? Math.ceil((xmax - xmin) / 10) : 1;
  const stepY = ymax - ymin > 20 ? Math.ceil((ymax - ymin) / 10) : 1;
  let body = "";
  for (let v = Math.ceil(xmin / stepX) * stepX; v <= xmax; v += stepX)
    body += `<line class="mv-grid" x1="${sx(v)}" y1="${sy(ymin)}" x2="${sx(v)}" y2="${sy(ymax)}"/>`;
  for (let v = Math.ceil(ymin / stepY) * stepY; v <= ymax; v += stepY)
    body += `<line class="mv-grid" x1="${sx(xmin)}" y1="${sy(v)}" x2="${sx(xmax)}" y2="${sy(v)}"/>`;
  const ax = xmin <= 0 && xmax >= 0 ? 0 : xmin;
  const ay = ymin <= 0 && ymax >= 0 ? 0 : ymin;
  body += `<line class="mv-axis" x1="${sx(xmin)}" y1="${sy(ay)}" x2="${sx(xmax)}" y2="${sy(ay)}"/><line class="mv-axis" x1="${sx(ax)}" y1="${sy(ymin)}" x2="${sx(ax)}" y2="${sy(ymax)}"/>`;
  for (let v = Math.ceil(xmin / stepX) * stepX; v <= xmax; v += stepX * 2)
    if (v !== 0)
      body += tx(v, sx(v), sy(ay) + 18, 'class="mv-small mv-scale" text-anchor="middle"');
  for (let v = Math.ceil(ymin / stepY) * stepY; v <= ymax; v += stepY * 2)
    if (v !== 0)
      body += tx(v, sx(ax) - 8, sy(v) + 5, 'class="mv-small mv-scale" text-anchor="end"');
  if (s.xLabel) body += tx(s.xLabel, W - 20, sy(ay) - 8, 'class="mv-label" text-anchor="end"');
  if (s.yLabel) body += tx(s.yLabel, sx(ax) + 8, 16, 'class="mv-label"');
  const pts = s.points || [];
  const segs = s.segments || (s.segment && pts.length > 1 ? [[0, 1]] : []);
  for (const [a, b] of segs)
    body += `<line class="mv-seg mv-step" data-step="${pts.length + 1}" x1="${sx(pts[a].x)}" y1="${sy(pts[a].y)}" x2="${sx(pts[b].x)}" y2="${sy(pts[b].y)}"/>`;
  pts.forEach((p, i) => {
    body += `<g class="mv-step" data-step="${i + 1}"><circle class="mv-pt" cx="${sx(p.x)}" cy="${sy(p.y)}" r="7" data-v="${p.x},${p.y}"/>${p.l ? tx(p.l, sx(p.x) + 10, sy(p.y) - 10, 'class="mv-label"') : ""}</g>`;
  });
  return frame(
    W,
    H,
    s.alt ||
      `Coordinate plane${pts.length ? ` with ${pts.map((p) => `(${p.x}, ${p.y})`).join(", ")}` : ""}`,
    body,
    `data-scale="40,${W - 20},${xmin},${xmax}" data-yscale="${H - 40},20,${ymin},${ymax}"`,
  );
};

R.dots = (s) => {
  const vals = s.values || s.data;
  const min = s.min;
  const max = s.max;
  const W = 640;
  const sx = linear(min, max, 30, W - 30);
  const span = max - min;
  const step = span > 24 ? Math.ceil(span / 12) : 1;
  const counts = {};
  const maxStack = Math.max(...vals.map((v) => (counts[v] = (counts[v] || 0) + 1)));
  const base = 30 + maxStack * 22;
  let body = axisTicks(sx, base, min, max, step);
  const seen = {};
  vals.forEach((v, i) => {
    seen[v] = (seen[v] || 0) + 1;
    body += `<circle class="mv-dot mv-step" data-step="${i + 1}" data-v="${v}" cx="${sx(v)}" cy="${base - 14 - (seen[v] - 1) * 22}" r="9"/>`;
  });
  if (s.mark != null)
    body += `<line class="mv-center" x1="${sx(s.mark)}" y1="10" x2="${sx(s.mark)}" y2="${base}"/>`;
  const label = s.xLabel || s.label;
  if (label) body += tx(label, W / 2, base + 48, 'class="mv-label" text-anchor="middle"');
  return frame(
    W,
    base + 60,
    s.alt || `Dot plot of ${vals.join(", ")}`,
    body,
    `data-scale="30,${W - 30},${min},${max}"`,
  );
};

R.hist = (s) => {
  const bins = s.bins.map((b) => ({ lo: b.lo ?? b.from, hi: b.hi ?? b.to, count: b.count ?? b.n }));
  const W = 640;
  const H = 300;
  const maxC = Math.max(1, ...bins.map((b) => b.count));
  const sy = linear(0, maxC, H - 60, 30);
  const bw = (W - 100) / bins.length;
  let body = `<line class="mv-axis" x1="60" y1="${H - 60}" x2="${W - 30}" y2="${H - 60}"/><line class="mv-axis" x1="60" y1="${H - 60}" x2="60" y2="20"/>`;
  for (let c = 0; c <= maxC; c++)
    body += `${tx(c, 50, sy(c) + 5, 'class="mv-small mv-scale" text-anchor="end"')}<line class="mv-grid" x1="60" y1="${sy(c)}" x2="${W - 30}" y2="${sy(c)}"/>`;
  bins.forEach((b, i) => {
    const x = 60 + i * bw;
    body += `<g class="mv-step" data-step="${i + 1}"><rect class="mv-bar" x="${x + 2}" y="${sy(b.count)}" width="${bw - 4}" height="${sy(0) - sy(b.count)}" data-v="${b.count}"/>${tx(`${b.lo}–${b.hi}`, x + bw / 2, H - 36, 'class="mv-small mv-scale" text-anchor="middle"')}</g>`;
  });
  const label = s.xLabel || s.xlabel;
  if (label) body += tx(label, W / 2, H - 10, 'class="mv-label" text-anchor="middle"');
  return frame(
    W,
    H,
    s.alt || `Histogram: ${bins.map((b) => `${b.lo}–${b.hi}: ${b.count}`).join(", ")}`,
    body,
    `data-yscale="${H - 60},30,0,${maxC}"`,
  );
};

R.box = (s) => {
  const lo = s.lo ?? s.scale?.min ?? s.min;
  const hi = s.hi ?? s.scale?.max ?? s.max;
  const step = s.scale?.step || (hi - lo > 20 ? 4 : 2);
  const W = 640;
  const sx = linear(lo, hi, 30, W - 30);
  let body = axisTicks(sx, 130, lo, hi, step);
  body += `<g class="mv-step" data-step="1"><line class="mv-whisk" x1="${sx(s.min)}" y1="70" x2="${sx(s.q1)}" y2="70"/><line class="mv-whisk" x1="${sx(s.q3)}" y1="70" x2="${sx(s.max)}" y2="70"/><line class="mv-whisk" x1="${sx(s.min)}" y1="56" x2="${sx(s.min)}" y2="84" data-v="${s.min}"/><line class="mv-whisk" x1="${sx(s.max)}" y1="56" x2="${sx(s.max)}" y2="84" data-v="${s.max}"/></g>`;
  body += `<g class="mv-step" data-step="2"><rect class="mv-boxr" x="${sx(s.q1)}" y="44" width="${sx(s.q3) - sx(s.q1)}" height="52" data-v="${s.q1},${s.q3}"/><line class="mv-med" x1="${sx(s.med)}" y1="44" x2="${sx(s.med)}" y2="96" data-v="${s.med}"/></g>`;
  if (s.xLabel) body += tx(s.xLabel, W / 2, 176, 'class="mv-label" text-anchor="middle"');
  return frame(
    W,
    186,
    s.alt ||
      `Box plot: minimum ${s.min}, Q1 ${s.q1}, median ${s.med}, Q3 ${s.q3}, maximum ${s.max}`,
    body,
    `data-scale="30,${W - 30},${lo},${hi}"`,
  );
};

function shapePath(shape, b, h, top, roof) {
  const W = 520;
  const H = 300;
  const scale = Math.min((W - 120) / b, (H - 90 - (roof ? (roof * (W - 120)) / b : 0)) / h, 40);
  const x0 = 60;
  const y0 = H - 50;
  const bw = b * scale;
  const hh = h * scale;
  let d;
  let dims = "";
  if (shape === "triangle") {
    d = `M${x0},${y0} L${x0 + bw},${y0} L${x0 + bw * 0.35},${y0 - hh} Z`;
    dims = `<line class="mv-height" x1="${x0 + bw * 0.35}" y1="${y0}" x2="${x0 + bw * 0.35}" y2="${y0 - hh}"/>`;
  } else if (shape === "trapezoid") {
    const tw = top * scale;
    const off = (bw - tw) / 2;
    d = `M${x0},${y0} L${x0 + bw},${y0} L${x0 + off + tw},${y0 - hh} L${x0 + off},${y0 - hh} Z`;
    dims = `<line class="mv-height" x1="${x0 + off}" y1="${y0}" x2="${x0 + off}" y2="${y0 - hh}"/>${tx(`${top}`, x0 + off + tw / 2, y0 - hh - 10, 'class="mv-num" text-anchor="middle"')}`;
  } else if (shape === "house") {
    const rh = roof * scale;
    d = `M${x0},${y0} L${x0 + bw},${y0} L${x0 + bw},${y0 - hh} L${x0 + bw / 2},${y0 - hh - rh} L${x0},${y0 - hh} Z`;
    dims = `<line class="mv-height" x1="${x0}" y1="${y0 - hh}" x2="${x0 + bw}" y2="${y0 - hh}"/><line class="mv-height" x1="${x0 + bw / 2}" y1="${y0 - hh}" x2="${x0 + bw / 2}" y2="${y0 - hh - rh}"/>${tx(`${roof}`, x0 + bw / 2 + 8, y0 - hh - rh / 2, 'class="mv-num"')}`;
  } else if (shape === "rect") {
    d = `M${x0},${y0} L${x0 + bw},${y0} L${x0 + bw},${y0 - hh} L${x0},${y0 - hh} Z`;
  } else {
    const sl = bw * 0.25;
    d = `M${x0},${y0} L${x0 + bw},${y0} L${x0 + bw + sl},${y0 - hh} L${x0 + sl},${y0 - hh} Z`;
    dims = `<line class="mv-height" x1="${x0 + sl}" y1="${y0}" x2="${x0 + sl}" y2="${y0 - hh}"/>`;
  }
  return {
    W,
    H,
    scale,
    body: `<path class="mv-shape mv-step" data-step="1" d="${d}"/><g class="mv-step" data-step="2">${dims}${tx(`${b}`, x0 + bw / 2, y0 + 26, 'class="mv-num" text-anchor="middle"')}${tx(`${h}`, x0 - 12, y0 - hh / 2, 'class="mv-num" text-anchor="end"')}</g>`,
  };
}

R.area = (s) => {
  const { W, H, scale, body } = shapePath(s.shape, s.base, s.height, s.top, s.roof);
  return frame(
    W,
    H,
    s.alt ||
      `${s.shape} with base ${s.base} and height ${s.height}${s.top ? `, top ${s.top}` : ""}${s.roof ? `, triangle height ${s.roof}` : ""}`,
    body,
    `data-unit="${scale}"`,
  );
};

R.shape = (s) => {
  const d = s.dims || {};
  const kind =
    s.s === "tri" ? "triangle" : s.s === "trap" ? "trapezoid" : s.s === "rect" ? "rect" : null;
  if (kind) return R.area({ shape: kind, base: d.b, height: d.h, top: d.b2 || d.top, alt: s.alt });
  if (d.n || s.n)
    return R.polygon({
      n: d.n || s.n,
      s: d.s || d.side || 1,
      a: d.a || d.apothem || 1,
      alt: s.alt,
    });
  return R.area({ shape: "rect", base: d.b || d.l || 1, height: d.h || d.w || 1, alt: s.alt });
};

R.polygon = (s) => {
  const W = 360;
  const H = 320;
  const cx = W / 2;
  const cy = H / 2 + 6;
  const r = 120;
  const pts = Array.from({ length: s.n }, (_, i) => {
    const t = -Math.PI / 2 + (i * 2 * Math.PI) / s.n;
    return [cx + r * Math.cos(t), cy + r * Math.sin(t)];
  });
  const mid = [(pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2];
  let body = `<polygon class="mv-shape mv-step" data-step="1" points="${pts.map((p) => p.join(",")).join(" ")}"/>`;
  body += `<g class="mv-step" data-step="2">${pts.map((p) => `<line class="mv-grid" x1="${cx}" y1="${cy}" x2="${p[0]}" y2="${p[1]}"/>`).join("")}<line class="mv-height" x1="${cx}" y1="${cy}" x2="${mid[0]}" y2="${mid[1]}"/>${tx(`a = ${s.a}`, cx + 6, cy - 40, 'class="mv-num"')}${tx(`s = ${s.s}`, mid[0] + 18, mid[1] - 8, 'class="mv-num"')}</g>`;
  return frame(W, H, s.alt || `Regular polygon with ${s.n} sides of ${s.s}, apothem ${s.a}`, body);
};

R.prism = (s) => {
  const W = 520;
  const H = 320;
  const k = Math.min(260 / (s.l + s.w * 0.5), 200 / (s.h + s.w * 0.5), 40);
  const L = s.l * k;
  const Ht = s.h * k;
  const D = s.w * k * 0.5;
  const x0 = 80;
  const y0 = H - 50;
  const f = `M${x0},${y0} h${L} v${-Ht} h${-L} Z`;
  const t = `M${x0},${y0 - Ht} l${D},${-D} h${L} l${-D},${D} Z`;
  const r = `M${x0 + L},${y0} l${D},${-D} v${-Ht} l${-D},${D} Z`;
  const body = `<path class="mv-face mv-step" data-step="1" d="${f}"/><path class="mv-face2 mv-step" data-step="2" d="${t}"/><path class="mv-face3 mv-step" data-step="3" d="${r}"/>${tx(`${s.l}${s.unit ? ` ${s.unit}` : ""}`, x0 + L / 2, y0 + 26, 'class="mv-num" text-anchor="middle"')}${tx(`${s.h}`, x0 - 12, y0 - Ht / 2, 'class="mv-num" text-anchor="end"')}${tx(`${s.w}`, x0 + L + D / 2 + 14, y0 - D / 2 + 4, 'class="mv-num"')}`;
  return frame(W, H, s.alt || `Rectangular prism ${s.l} by ${s.w} by ${s.h}`, body);
};

R.net = (s) => {
  if (s.shape === "pyramid") {
    const W = 400;
    const H = 400;
    const k = Math.min(140 / (s.s + 2 * s.sl), 40);
    const a = s.s * k;
    const t = s.sl * k;
    const x = W / 2 - a / 2;
    const y = H / 2 - a / 2;
    const body = `<rect class="mv-face mv-step" data-step="1" x="${x}" y="${y}" width="${a}" height="${a}"/><g class="mv-step" data-step="2"><path class="mv-face2" d="M${x},${y} L${x + a / 2},${y - t} L${x + a},${y} Z"/><path class="mv-face2" d="M${x},${y + a} L${x + a / 2},${y + a + t} L${x + a},${y + a} Z"/><path class="mv-face2" d="M${x},${y} L${x - t},${y + a / 2} L${x},${y + a} Z"/><path class="mv-face2" d="M${x + a},${y} L${x + a + t},${y + a / 2} L${x + a},${y + a} Z"/></g>${tx(`${s.s}`, x + a / 2, y + a / 2 + 6, 'class="mv-num" text-anchor="middle"')}${tx(`${s.sl}`, x + a / 2 + 6, y - t / 2, 'class="mv-num"')}`;
    return frame(
      W,
      H,
      `Net of a square pyramid: base ${s.s} by ${s.s}, four triangles with height ${s.sl}`,
      body,
    );
  }
  const k = Math.min(560 / (2 * s.l + 2 * s.w), 300 / (s.w * 2 + s.h), 30);
  const l = s.l * k;
  const w = s.w * k;
  const h = s.h * k;
  const W = 2 * l + 2 * w + 40;
  const H = 2 * w + h + 40;
  const x0 = 20;
  const y0 = 20 + w;
  const faces = [
    [x0, y0, w, h],
    [x0 + w, y0, l, h],
    [x0 + w + l, y0, w, h],
    [x0 + 2 * w + l, y0, l, h],
    [x0 + w, y0 - w, l, w],
    [x0 + w, y0 + h, l, w],
  ];
  const body =
    faces
      .map(
        (f, i) =>
          `<rect class="${i % 2 ? "mv-face" : "mv-face2"} mv-step" data-step="${i + 1}" x="${f[0]}" y="${f[1]}" width="${f[2]}" height="${f[3]}"/>`,
      )
      .join("") +
    tx(`${s.l}`, x0 + w + l / 2, y0 + h / 2 + 6, 'class="mv-num" text-anchor="middle"') +
    tx(`${s.w}`, x0 + w / 2, y0 + h / 2 + 6, 'class="mv-num" text-anchor="middle"') +
    tx(`${s.h}`, x0 + w + l + w / 2, y0 + h / 2 + 6, 'class="mv-num" text-anchor="middle"');
  return frame(W, H, `Net of a rectangular prism ${s.l} by ${s.w} by ${s.h}: six rectangles`, body);
};

R.grid100 = (s) => {
  const c = 26;
  let body = "";
  for (let i = 0; i < 100; i++) {
    const r = Math.floor(i / 10);
    const col = i % 10;
    body += `<rect class="mv-cell${i < s.shaded ? " is-shaded mv-step" : ""}" ${i < s.shaded ? `data-step="${r + 1}"` : ""} x="${10 + col * c}" y="${10 + r * c}" width="${c - 2}" height="${c - 2}"/>`;
  }
  return frame(
    10 * c + 20,
    10 * c + 20,
    `Hundred grid with ${s.shaded} of 100 squares shaded`,
    body,
    `data-v="${s.shaded}"`,
  );
};

R.bars = (s) => {
  const whole = s.whole ?? 1;
  const d = s.d;
  const W = 640;
  const rowH = 44;
  let body = "";
  const wholes = Math.min(whole, 6);
  for (let k = 0; k < wholes; k++) {
    const y = 10 + k * (rowH + 10);
    for (let i = 0; i < d; i++) {
      const pw = (W - 20) / d;
      body += `<rect class="mv-part mv-step${(k * d + i) % (s.n || 1) === 0 ? " is-shaded" : ""}" data-step="${k * d + i + 1}" x="${10 + i * pw}" y="${y}" width="${pw - 2}" height="${rowH}" rx="4"/>`;
    }
    body += tx(`1`, W - 6, y + rowH / 2 + 6, 'class="mv-small" text-anchor="end"');
  }
  return frame(
    W,
    20 + wholes * (rowH + 10),
    `${whole} whole${whole === 1 ? "" : "s"} split into pieces of 1/${d}${s.n > 1 ? `, grouped by ${s.n}` : ""}`,
    body,
  );
};
R.bar1 = (s) => {
  const W = 640;
  const pw = (W - 20) / s.d;
  let body = "";
  for (let i = 0; i < s.d; i++)
    body += `<rect class="mv-part mv-step${i < s.n ? " is-shaded" : ""}" data-step="${i + 1}" x="${10 + i * pw}" y="10" width="${pw - 2}" height="50" rx="4"/>`;
  if (s.label) body += tx(`${s.n}/${s.d}`, W / 2, 86, 'class="mv-num" text-anchor="middle"');
  return frame(W, 96, s.alt || `Fraction bar: ${s.n} of ${s.d} parts shaded`, body);
};

R.areaModel = (s) => {
  const W = 520;
  const H = 180;
  const w1 = 260;
  const w2 = 160;
  const body = `${tx(s.factor, 30, 104, 'class="mv-num" text-anchor="middle"')}<rect class="mv-face mv-step" data-step="1" x="60" y="50" width="${w1}" height="100"/><rect class="mv-face2 mv-step" data-step="2" x="${60 + w1}" y="50" width="${w2}" height="100"/>${tx(s.terms[0], 60 + w1 / 2, 40, 'class="mv-num" text-anchor="middle"')}${tx(s.terms[1], 60 + w1 + w2 / 2, 40, 'class="mv-num" text-anchor="middle"')}<g class="mv-step" data-step="3">${tx(s.products[0], 60 + w1 / 2, 108, 'class="mv-in" text-anchor="middle"')}${tx(s.products[1], 60 + w1 + w2 / 2, 108, 'class="mv-in" text-anchor="middle"')}</g>`;
  return frame(
    W,
    H,
    `Area model: ${s.factor} times (${s.terms.join(" + ")}) = ${s.products.join(" + ")}`,
    body,
  );
};

R.balance = (s) => {
  const W = 520;
  const H = 220;
  const body = `<path class="mv-axis" d="M260,190 L240,215 h40 Z"/><line class="mv-axis" x1="260" y1="60" x2="260" y2="190"/><line class="mv-beam mv-step" data-step="1" x1="80" y1="60" x2="440" y2="60"/><g class="mv-step" data-step="2"><rect class="mv-pan" x="40" y="90" width="160" height="60" rx="10"/>${tx(s.left, 120, 128, 'class="mv-in" text-anchor="middle"')}<rect class="mv-pan" x="320" y="90" width="160" height="60" rx="10"/>${tx(s.right, 400, 128, 'class="mv-in" text-anchor="middle"')}</g><line class="mv-grid" x1="120" y1="60" x2="120" y2="90"/><line class="mv-grid" x1="400" y1="60" x2="400" y2="90"/>`;
  return frame(W, H, `Balance: ${s.left} = ${s.right}`, body);
};

export const VISUAL_TYPES = Object.keys(R);

export function renderVisual(spec) {
  if (!spec) return "";
  const type = spec.type || spec.t;
  const fn = R[type];
  if (!fn) return "";
  try {
    return fn(spec);
  } catch {
    return "";
  }
}

/**
 * ewl-math-svg.js — Programmatic, print-safe SVG for Grade 6 math.
 *
 * Every function is pure: numbers in, an SVG string out. No DOM, no network, no
 * external image URLs. Each SVG carries explicit width/height + viewBox, a white
 * background (so it survives `@media print` and dark UI), and a <title> for
 * assistive tech. Minus signs are U+2212, never an ASCII hyphen, so a printed
 * "−3" is not mistaken for a dash.
 *
 * Text is escaped; numeric inputs are validated and throw RangeError so a bad
 * call fails at generation time rather than drawing NaN into a worksheet.
 */
(function (root) {
  "use strict";

  const INK = "#1f2937";
  const ACCENT = "#1d4ed8";
  const SOFT = "#dbeafe";
  const FONT = "font-family:Georgia,'Times New Roman',serif";

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

  /** Math typography: Unicode minus for negatives. */
  const num = (n) => String(n).replace(/-/g, "−");

  function finite(name, v) {
    if (typeof v !== "number" || !Number.isFinite(v)) {
      throw new RangeError(`${name} must be a finite number, got ${v}.`);
    }
    return v;
  }

  function wrap(w, h, title, body) {
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" ` +
      `role="img" aria-label="${esc(title)}" style="background:white; max-width:100%; height:auto;">` +
      `<title>${esc(title)}</title><rect width="${w}" height="${h}" fill="white"/>${body}</svg>`
    );
  }

  const text = (x, y, s, opts = {}) =>
    `<text x="${x}" y="${y}" text-anchor="${opts.anchor || "middle"}" font-size="${opts.size || 14}" ` +
    `fill="${opts.fill || INK}" style="${FONT}${opts.italic ? ";font-style:italic" : ""}">${esc(s)}</text>`;

  const line = (x1, y1, x2, y2, extra = "") =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${INK}" ${
      extra.includes("stroke-width") ? "" : 'stroke-width="2" '
    }${extra}/>`;

  /**
   * Number line with arrows, ticks and optional points.
   * points: [{ value, closed }]  closed → ● (≤ / ≥), open → ○ (< / >).
   * ray: { from, dir: 1 | -1 } shades a ray from a point, for inequality graphs.
   */
  function makeNumberLineSVG({ min, max, step = 1, points = [], ray = null, width = 480 } = {}) {
    finite("min", min);
    finite("max", max);
    finite("step", step);
    if (max <= min || step <= 0) throw new RangeError("number line needs max > min and step > 0.");
    const pad = 28;
    const h = 80;
    const y = 40;
    const x = (v) => pad + ((v - min) / (max - min)) * (width - 2 * pad);
    let body = line(pad - 14, y, width - pad + 14, y);
    body += `<polygon points="${pad - 18},${y} ${pad - 8},${y - 5} ${pad - 8},${y + 5}" fill="${INK}"/>`;
    body += `<polygon points="${width - pad + 18},${y} ${width - pad + 8},${y - 5} ${width - pad + 8},${y + 5}" fill="${INK}"/>`;
    for (let v = min; v <= max + 1e-9; v += step) {
      const r = Math.round(v * 1e6) / 1e6;
      body += line(x(r), y - 6, x(r), y + 6, 'stroke-width="1.5"');
      body += text(x(r), y + 24, num(r), { size: 12 });
    }
    if (ray) {
      finite("ray.from", ray.from);
      const end = ray.dir >= 0 ? width - pad + 14 : pad - 14;
      body += `<line x1="${x(ray.from)}" y1="${y}" x2="${end}" y2="${y}" stroke="${ACCENT}" stroke-width="5"/>`;
    }
    for (const p of points) {
      finite("point.value", p.value);
      body += `<circle cx="${x(p.value)}" cy="${y}" r="6" stroke="${ACCENT}" stroke-width="2.5" fill="${p.closed ? ACCENT : "white"}"/>`;
    }
    return wrap(width, h, `Number line from ${num(min)} to ${num(max)}`, body);
  }

  /**
   * Tape diagram: equal parts, one total brace, optional shaded parts.
   * parts: number of equal segments; shaded: how many are filled.
   */
  function makeTapeDiagramSVG({
    parts,
    shaded = 0,
    partLabel = "",
    totalLabel = "",
    width = 480,
  } = {}) {
    finite("parts", parts);
    if (!Number.isInteger(parts) || parts < 1 || parts > 20)
      throw new RangeError("parts must be an integer 1..20.");
    if (!Number.isInteger(shaded) || shaded < 0 || shaded > parts)
      throw new RangeError("shaded must be 0..parts.");
    const pad = 20;
    const w = (width - 2 * pad) / parts;
    const top = 44;
    let body = "";
    for (let i = 0; i < parts; i++) {
      body += `<rect x="${pad + i * w}" y="${top}" width="${w}" height="40" fill="${i < shaded ? SOFT : "white"}" stroke="${INK}" stroke-width="2"/>`;
      if (partLabel)
        body += text(pad + i * w + w / 2, top + 25, partLabel, { size: 13, italic: true });
    }
    const x1 = pad;
    const x2 = width - pad;
    body += `<path d="M${x1} 36 Q${x1} 28 ${x1 + 8} 28 H${(x1 + x2) / 2 - 8} Q${(x1 + x2) / 2} 28 ${(x1 + x2) / 2} 20 Q${(x1 + x2) / 2} 28 ${(x1 + x2) / 2 + 8} 28 H${x2 - 8} Q${x2} 28 ${x2} 36" fill="none" stroke="${INK}" stroke-width="2"/>`;
    if (totalLabel) body += text(width / 2, 14, totalLabel, { size: 14, italic: true });
    return wrap(width, 100, `Tape diagram with ${parts} equal parts, ${shaded} shaded`, body);
  }

  /** Place-value table with the decimal point drawn as its own column. */
  function makePlaceValueTableSVG({
    digitsLeft = ["1", "2"],
    digitsRight = ["5"],
    heads = null,
  } = {}) {
    const L = ["Hundreds", "Tens", "Ones"].slice(-digitsLeft.length);
    const R = ["Tenths", "Hundredths", "Thousandths"].slice(0, digitsRight.length);
    const names = heads || [...L, ".", ...R];
    const cells = [...digitsLeft, ".", ...digitsRight];
    if (names.length !== cells.length) throw new RangeError("heads must match digit columns.");
    const cw = 86;
    const dotw = 22;
    const widths = cells.map((c) => (c === "." ? dotw : cw));
    const total = widths.reduce((a, b) => a + b, 0) + 2;
    let x = 1;
    let body = "";
    cells.forEach((c, i) => {
      const w = widths[i];
      if (c !== ".") {
        body += `<rect x="${x}" y="1" width="${w}" height="32" fill="${SOFT}" stroke="${INK}" stroke-width="1.5"/>`;
        body += `<rect x="${x}" y="33" width="${w}" height="44" fill="white" stroke="${INK}" stroke-width="1.5"/>`;
        body += text(x + w / 2, 22, names[i], { size: 12 });
      }
      body += text(x + w / 2, 64, c, { size: 26 });
      x += w;
    });
    return wrap(total, 80, "Place value table aligned on the decimal point", body);
  }

  /** Four-quadrant coordinate plane; points: [{x, y, label}]. */
  function makeCoordinatePlaneSVG({ range = 6, points = [], polygon = false, size = 320 } = {}) {
    finite("range", range);
    if (!Number.isInteger(range) || range < 1 || range > 12)
      throw new RangeError("range must be an integer 1..12.");
    const pad = 26;
    const u = (size - 2 * pad) / (2 * range);
    const cx = size / 2;
    const px = (v) => cx + v * u;
    const py = (v) => cx - v * u;
    let body = "";
    for (let i = -range; i <= range; i++) {
      body += `<line x1="${px(i)}" y1="${pad}" x2="${px(i)}" y2="${size - pad}" stroke="#d1d5db" stroke-width="1"/>`;
      body += `<line x1="${pad}" y1="${py(i)}" x2="${size - pad}" y2="${py(i)}" stroke="#d1d5db" stroke-width="1"/>`;
      if (i !== 0) {
        body += text(px(i), cx + 14, num(i), { size: 10 });
        body += text(cx - 8, py(i) + 4, num(i), { size: 10, anchor: "end" });
      }
    }
    body += line(pad, cx, size - pad, cx) + line(cx, pad, cx, size - pad);
    body += text(size - pad + 4, cx - 6, "x", { size: 13, italic: true, anchor: "start" });
    body += text(cx + 10, pad - 6, "y", { size: 13, italic: true, anchor: "start" });
    for (const p of points) {
      finite("point.x", p.x);
      finite("point.y", p.y);
    }
    if (polygon && points.length > 2) {
      body += `<polygon points="${points.map((p) => `${px(p.x)},${py(p.y)}`).join(" ")}" fill="${SOFT}" fill-opacity="0.6" stroke="${ACCENT}" stroke-width="2.5"/>`;
    }
    for (const p of points) {
      body += `<circle cx="${px(p.x)}" cy="${py(p.y)}" r="4.5" fill="${ACCENT}"/>`;
      if (p.label) body += text(px(p.x) + 8, py(p.y) - 8, p.label, { size: 12, anchor: "start" });
    }
    return wrap(
      size,
      size,
      `Coordinate plane, ${points.length} point${points.length === 1 ? "" : "s"} plotted`,
      body,
    );
  }

  /**
   * Two-pan balance. left/right: arrays of tile strings ("x", "1"). The beam
   * tilts toward the heavier side only when `weights` differ; equal = level.
   */
  function makeBalanceScaleSVG({
    left = [],
    right = [],
    leftWeight = null,
    rightWeight = null,
    width = 420,
  } = {}) {
    const lw = leftWeight ?? left.length;
    const rw = rightWeight ?? right.length;
    finite("leftWeight", lw);
    finite("rightWeight", rw);
    const tilt = Math.max(-12, Math.min(12, (rw - lw) * 4)); // degrees; positive = left side rises
    const cx = width / 2;
    const beamY = 60;
    const half = 140;
    const rad = (tilt * Math.PI) / 180;
    const lx = cx - half * Math.cos(rad);
    const ly = beamY + half * Math.sin(rad) * -1;
    const rx = cx + half * Math.cos(rad);
    const ry = beamY + half * Math.sin(rad);
    let body = `<polygon points="${cx},${beamY} ${cx - 24},170 ${cx + 24},170" fill="${SOFT}" stroke="${INK}" stroke-width="2"/>`;
    body += `<rect x="${cx - 60}" y="170" width="120" height="8" fill="${INK}"/>`;
    body += line(lx, ly, rx, ry, 'stroke-width="5" stroke-linecap="round"');
    const pan = (x, y, tiles) => {
      let s = `<path d="M${x - 62} ${y + 40} h124 a62 20 0 0 1 -124 0z" fill="white" stroke="${INK}" stroke-width="2"/>`;
      s +=
        line(x, y, x - 55, y + 40, 'stroke-width="1.5"') +
        line(x, y, x + 55, y + 40, 'stroke-width="1.5"');
      tiles.forEach((t, i) => {
        const tx = x - 50 + (i % 5) * 21;
        const ty = y + 22 - Math.floor(i / 5) * 21;
        s += `<rect x="${tx}" y="${ty}" width="19" height="19" rx="3" fill="${SOFT}" stroke="${ACCENT}" stroke-width="1.5"/>`;
        s += text(tx + 9.5, ty + 14, t, { size: 13, italic: /^[a-z]$/i.test(t) });
      });
      return s;
    };
    body += pan(lx, ly, left) + pan(rx, ry, right);
    return wrap(
      width,
      200,
      tilt === 0 ? "Balanced two-pan scale" : "Unbalanced two-pan scale",
      body,
    );
  }

  /**
   * Geometry: shape "triangle" | "parallelogram" | "rectangle" with dimension
   * labels and a dashed height line, or "net" for a rectangular-prism net.
   */
  function makeGeometryShapeSVG({ shape, base = 6, height = 4, labels = true, width = 300 } = {}) {
    finite("base", base);
    finite("height", height);
    if (base <= 0 || height <= 0) throw new RangeError("base and height must be positive.");
    const scale = Math.min(180 / base, 120 / height);
    const bw = base * scale;
    const bh = height * scale;
    const x0 = (width - bw) / 2;
    const y0 = 20;
    const dashed = 'stroke-dasharray="5 4" stroke-width="1.5"';
    let body = "";
    if (shape === "triangle") {
      body += `<polygon points="${x0},${y0 + bh} ${x0 + bw},${y0 + bh} ${x0 + bw * 0.35},${y0}" fill="${SOFT}" stroke="${INK}" stroke-width="2"/>`;
      body += line(x0 + bw * 0.35, y0, x0 + bw * 0.35, y0 + bh, dashed);
    } else if (shape === "parallelogram") {
      const slant = bw * 0.2;
      body += `<polygon points="${x0},${y0 + bh} ${x0 + bw - slant},${y0 + bh} ${x0 + bw},${y0} ${x0 + slant},${y0}" fill="${SOFT}" stroke="${INK}" stroke-width="2"/>`;
      body += line(x0 + slant, y0, x0 + slant, y0 + bh, dashed);
    } else if (shape === "rectangle") {
      body += `<rect x="${x0}" y="${y0}" width="${bw}" height="${bh}" fill="${SOFT}" stroke="${INK}" stroke-width="2"/>`;
    } else if (shape === "net") {
      // Cross-shaped net: a base cell with four flaps and one extra cell.
      const c = Math.min(bw, bh) / 1.6;
      const nx = (width - 3 * c) / 2;
      for (const [cx, cy] of [
        [1, 0],
        [0, 1],
        [1, 1],
        [2, 1],
        [1, 2],
        [1, 3],
      ]) {
        body += `<rect x="${nx + cx * c}" y="${y0 + cy * c}" width="${c}" height="${c}" fill="${SOFT}" stroke="${INK}" stroke-width="2"/>`;
      }
      return wrap(width, Math.round(y0 * 2 + 4 * c), "Net of a rectangular prism", body);
    } else {
      throw new RangeError(`Unknown shape "${shape}".`);
    }
    if (labels) {
      body += text(x0 + bw / 2, y0 + bh + 18, `${num(base)} units`, { size: 13 });
      body += text(x0 - 8, y0 + bh / 2 + 4, `${num(height)}`, { size: 13, anchor: "end" });
    }
    return wrap(
      width,
      Math.round(y0 + bh + 30),
      `${shape} with base ${num(base)} and height ${num(height)}`,
      body,
    );
  }

  const api = Object.freeze({
    makeNumberLineSVG,
    makeTapeDiagramSVG,
    makePlaceValueTableSVG,
    makeCoordinatePlaneSVG,
    makeBalanceScaleSVG,
    makeGeometryShapeSVG,
  });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.EWLMathSVG = api;
})(typeof window !== "undefined" ? window : globalThis);

// Geometry-flavoured models for math-models.mjs: area, grid, coord, balance.
// Same grammar (math-kit.mjs), same contract: data -> { h, body, defs?, desc } or a thrown Error.

import { PAD, W, assertKeys, clean, head, int, lab, minus, n1, need, pos, text, textW } from "./math-kit.mjs";

const tr = (lang, en, es) => (lang === "es" ? es : en);

// ---------------------------------------------------------------- area
const SHAPES = ["rectangle", "parallelogram", "triangle", "trapezoid"];
const DOLLAR_UNITS = ["$", "dollar", "dollars", "dólar", "dólares"];

/** "14 ft", "$20" (dollar units become a prefix), or a bare number. */
const withUnit = (v, unit, lang) => {
  const u = lab(unit, lang);
  const num = minus(clean(v));
  if (!u) return num;
  return DOLLAR_UNITS.includes(u.toLowerCase()) ? `$${num}` : `${num} ${u}`;
};

export function renderArea(d, { lang }) {
  assertKeys(d, ["shape", "dims", "unit", "cutAndSlide"], 'model "area" data');
  need(d, "area", "shape", "dims");
  if (!SHAPES.includes(d.shape)) throw new Error(`model "area": data.shape must be one of ${SHAPES.join(", ")}; got ${JSON.stringify(d.shape)}`);
  const dm = d.dims;
  assertKeys(dm, ["base", "height", "base1", "base2", "offset", "slant", "split", "apex"], 'model "area" data.dims');
  const dimsFor = { rectangle: ["base", "height", "split"], parallelogram: ["base", "height", "offset", "slant"], triangle: ["base", "height", "apex"], trapezoid: ["base1", "base2", "height"] }[d.shape];
  for (const key of Object.keys(dm)) {
    if (!dimsFor.includes(key)) throw new Error(`model "area": data.dims.${key} does not apply to a ${d.shape} (use ${dimsFor.join(", ")})`);
  }
  const b = pos(dm, "area", d.shape === "trapezoid" ? "base1" : "base");
  const b2 = d.shape === "trapezoid" ? pos(dm, "area", "base2") : b;
  const h = pos(dm, "area", "height");
  let offset = 0;
  if (d.shape === "parallelogram") {
    if (dm.offset !== undefined && dm.slant !== undefined) throw new Error('model "area": give data.dims.offset or data.dims.slant, not both');
    if (dm.slant !== undefined) {
      const sl = pos(dm, "area", "slant");
      if (sl <= h) throw new Error(`model "area": data.dims.slant (${sl}) must be longer than the height (${h})`);
      offset = Math.sqrt(sl * sl - h * h);
    } else offset = dm.offset === undefined ? h * 0.5 : dm.offset;
    if (typeof offset !== "number" || offset < 0) throw new Error('model "area": data.dims.offset must be a number >= 0');
  }
  let split = null;
  if (dm.split !== undefined) {
    if (!Array.isArray(dm.split) || dm.split.length !== 2 || dm.split.some((v) => typeof v !== "number" || v <= 0)) throw new Error('model "area": data.dims.split must be two positive numbers');
    if (Math.abs(dm.split[0] + dm.split[1] - b) > 1e-9) throw new Error(`model "area": data.dims.split ${JSON.stringify(dm.split)} must add up to the base (${b})`);
    split = dm.split;
  }
  const unit = d.unit;
  const cut = Boolean(d.cutAndSlide);
  const wide = Math.max(b, b2) + offset;
  const leftRoom = d.shape === "rectangle" ? 66 : 0;
  const rightRoom = d.shape === "parallelogram" && dm.slant !== undefined ? 64 : 0;
  const avail = W - 2 * PAD - leftRoom - rightRoom;
  const s = Math.min(avail / wide, 130 / h);
  const pw = (v) => v * s;
  const H = h * s;
  const x = PAD + leftRoom + (avail - wide * s) / 2;
  const top = cut ? 44 : split || d.shape === "trapezoid" ? 36 : 24;
  const out = [];
  const bottom = top + H;
  const lbl = (cx, y, v) => text(cx, y, withUnit(v, unit, lang), { cls: "m-t m-n" });
  const right = (px, py, size = 11) => `<path class="m-ln" d="M${n1(px)} ${n1(py - size)}h${size}v${size}" transform="translate(${-size} 0)"/>`;
  if (d.shape === "rectangle") {
    out.push(`<rect class="${split ? "m-g" : "m-p"}" x="${n1(x)}" y="${top}" width="${n1(pw(b))}" height="${n1(H)}"/>`);
    if (split) {
      out.push(`<rect class="m-p" x="${n1(x)}" y="${top}" width="${n1(pw(split[0]))}" height="${n1(H)}"/>`);
      out.push(`<path class="m-ln" d="M${n1(x + pw(split[0]))} ${top - 6}V${n1(bottom)}"/>`);
      out.push(`<rect class="m-ln" x="${n1(x)}" y="${top}" width="${n1(pw(b))}" height="${n1(H)}"/>`);
      out.push(lbl(x + pw(split[0]) / 2, top - 12, split[0]) + lbl(x + pw(split[0]) + pw(split[1]) / 2, top - 12, split[1]));
      out.push(text(x + pw(split[0]) / 2, top + H / 2 + 5, `${minus(clean(h))} \u00D7 ${minus(clean(split[0]))}`, { cls: "m-t m-n" }));
      out.push(text(x + pw(split[0]) + pw(split[1]) / 2, top + H / 2 + 5, `${minus(clean(h))} \u00D7 ${minus(clean(split[1]))}`, { cls: "m-t m-n" }));
    } else {
      let grid = "";
      if (Number.isInteger(b) && Number.isInteger(h) && b <= 14 && h <= 14) {
        for (let i = 1; i < b; i++) grid += `M${n1(x + pw(i))} ${top}v${n1(H)}`;
        for (let j = 1; j < h; j++) grid += `M${n1(x)} ${n1(top + j * s)}h${n1(pw(b))}`;
      }
      if (grid) out.push(`<path class="m-gr" style="stroke-opacity:.5" d="${grid}"/>`);
      out.push(`<rect class="m-ln" x="${n1(x)}" y="${top}" width="${n1(pw(b))}" height="${n1(H)}"/>`);
    }
    out.push(lbl(x + pw(b) / 2, bottom + 24, b));
    out.push(text(x - 8, top + H / 2 + 5, withUnit(h, unit, lang), { anchor: "end", cls: "m-t m-n" }));
  } else if (d.shape === "parallelogram") {
    const o = pw(offset);
    out.push(`<path class="m-p" d="M${n1(x + o)} ${top}H${n1(x + o + pw(b))}L${n1(x + pw(b))} ${n1(bottom)}H${n1(x)}Z"/>`);
    if (cut) {
      out.push(`<path class="m-u" d="M${n1(x)} ${n1(bottom)}L${n1(x + o)} ${top}V${n1(bottom)}Z"/>`);
      out.push(`<rect class="m-dash" x="${n1(x + o)}" y="${top}" width="${n1(pw(b))}" height="${n1(H)}"/>`);
      const ax = x + o * 0.35;
      const bx = x + pw(b) + o * 0.6;
      out.push(`<path class="m-ln" d="M${n1(ax)} ${top + 8}Q${n1((ax + bx) / 2)} ${top - 30} ${n1(bx - 4)} ${top + 4}"/>${head(bx, top + 8, "d")}`);
    }
    out.push(`<path class="m-dash" d="M${n1(x + o)} ${top}V${n1(bottom)}"/>${right(x + o, bottom)}`);
    out.push(lbl(x + pw(b) / 2, bottom + 24, b));
    out.push(text(x + o + 8, top + H / 2 + 5, withUnit(h, unit, lang), { anchor: "start", cls: "m-t m-n" }));
    if (dm.slant !== undefined) out.push(text(x + pw(b) + o / 2 + 10, top + H / 2 + 5, withUnit(dm.slant, unit, lang), { anchor: "start", cls: "m-t m-n" }));
  } else if (d.shape === "triangle") {
    const apex = dm.apex ?? b / 2;
    if (cut) out.push(`<rect class="m-dash" x="${n1(x)}" y="${top}" width="${n1(pw(b))}" height="${n1(H)}"/>`);
    out.push(`<path class="m-p" d="M${n1(x + pw(apex))} ${top}L${n1(x + pw(b))} ${n1(bottom)}H${n1(x)}Z"/>`);
    out.push(`<path class="m-dash" d="M${n1(x + pw(apex))} ${top}V${n1(bottom)}"/>${right(x + pw(apex), bottom)}`);
    out.push(lbl(x + pw(b) / 2, bottom + 24, b));
    out.push(text(x + pw(apex) + 8, top + H / 2 + 5, withUnit(h, unit, lang), { anchor: "start", cls: "m-t m-n" }));
  } else {
    const inset = pw((b2 - b) / 2);
    const topW = pw(b);
    out.push(`<path class="m-p" d="M${n1(x + inset)} ${top}h${n1(topW)}L${n1(x + pw(b2))} ${n1(bottom)}H${n1(x)}Z"/>`);
    out.push(`<path class="m-dash" d="M${n1(x + inset)} ${top}V${n1(bottom)}"/>${right(x + inset, bottom)}`);
    out.push(lbl(x + inset + topW / 2, top - 8, b));
    out.push(lbl(x + pw(b2) / 2, bottom + 24, b2));
    out.push(text(x + inset + 8, top + H / 2 + 5, withUnit(h, unit, lang), { anchor: "start", cls: "m-t m-n" }));
  }
  const dimsText =
    d.shape === "trapezoid"
      ? tr(lang, `bases ${withUnit(b, unit, lang)} and ${withUnit(b2, unit, lang)}, height ${withUnit(h, unit, lang)}`, `bases ${withUnit(b, unit, lang)} y ${withUnit(b2, unit, lang)}, altura ${withUnit(h, unit, lang)}`)
      : tr(lang, `base ${withUnit(b, unit, lang)}, height ${withUnit(h, unit, lang)}`, `base ${withUnit(b, unit, lang)}, altura ${withUnit(h, unit, lang)}`);
  const names = { rectangle: ["rectangle", "rect\u00E1ngulo"], parallelogram: ["parallelogram", "paralelogramo"], triangle: ["triangle", "tri\u00E1ngulo"], trapezoid: ["trapezoid", "trapecio"] }[d.shape];
  const extra = [];
  if (dm.slant !== undefined) extra.push(tr(lang, `The slanted side is ${withUnit(dm.slant, unit, lang)}.`, `El lado inclinado mide ${withUnit(dm.slant, unit, lang)}.`));
  if (split) {
    extra.push(
      tr(
        lang,
        `A line splits the base into ${withUnit(split[0], unit, lang)} and ${withUnit(split[1], unit, lang)}, so the rectangle is two smaller rectangles: ${minus(clean(h))} \u00D7 ${minus(clean(split[0]))} and ${minus(clean(h))} \u00D7 ${minus(clean(split[1]))}.`,
        `Una l\u00EDnea divide la base en ${withUnit(split[0], unit, lang)} y ${withUnit(split[1], unit, lang)}, as\u00ED que el rect\u00E1ngulo son dos rect\u00E1ngulos m\u00E1s peque\u00F1os: ${minus(clean(h))} \u00D7 ${minus(clean(split[0]))} y ${minus(clean(h))} \u00D7 ${minus(clean(split[1]))}.`,
      ),
    );
  }
  if (cut && d.shape === "parallelogram") extra.push(tr(lang, "The triangle on the left is cut off and slid to the right end, which makes a rectangle with the same base and height.", "El tri\u00E1ngulo de la izquierda se corta y se desliza al extremo derecho, y forma un rect\u00E1ngulo con la misma base y altura."));
  if (cut && d.shape === "triangle") extra.push(tr(lang, "A dashed rectangle with the same base and height shows the triangle is half of it.", "Un rect\u00E1ngulo punteado con la misma base y altura muestra que el tri\u00E1ngulo es la mitad."));
  return {
    h: bottom + 40,
    body: out.join(""),
    desc: tr(lang, `Area model: a ${names[0]} with ${dimsText}. ${extra.join(" ")}`.trim(), `Modelo de \u00E1rea: un ${names[1]} con ${dimsText}. ${extra.join(" ")}`.trim()),
  };
}

// ---------------------------------------------------------------- grid (bead / ten-frame / 10x10)
export function renderGrid(d, { lang }) {
  assertKeys(d, ["rows", "cols", "filled", "groupSize", "label"], 'model "grid" data');
  need(d, "grid", "rows", "cols", "filled");
  const rows = int(d, "grid", "rows", 1, 12);
  const cols = int(d, "grid", "cols", 1, 12);
  const filled = int(d, "grid", "filled", 0, rows * cols);
  const group = d.groupSize ?? 5;
  if (group !== 5 && group !== 10) throw new Error(`model "grid": data.groupSize must be 5 or 10; got ${JSON.stringify(d.groupSize)}`);
  const gap = 8;
  const gx = Math.floor((cols - 1) / group);
  const gy = Math.floor((rows - 1) / group);
  const axisW = 40;
  const pitch = Math.min(30, (W - 2 * PAD - axisW - gx * gap) / cols);
  const r = Math.max(5, pitch / 2 - 3);
  const x0 = PAD + axisW;
  const cx = (c) => x0 + c * pitch + pitch / 2 + Math.floor(c / group) * gap;
  const cy = (rw) => 10 + rw * pitch + pitch / 2 + Math.floor(rw / group) * gap;
  const lay = { on: "", off: "" };
  for (let i = 0; i < rows * cols; i++) {
    const rw = Math.floor(i / cols);
    const c = i % cols;
    lay[i < filled ? "on" : "off"] += `M${n1(cx(c))} ${n1(cy(rw))}h0`;
  }
  const out = [];
  const w = n1(2 * r);
  const wi = n1(2 * r - 3.6);
  if (lay.off) out.push(`<path class="m-r2" stroke-width="${w}" d="${lay.off}"/><path class="m-f2" stroke-width="${wi}" d="${lay.off}"/>`);
  if (lay.on) out.push(`<path class="m-r1" stroke-width="${w}" d="${lay.on}"/><path class="m-f1" stroke-width="${wi}" d="${lay.on}"/>`);
  for (let rw = 0; rw < rows; rw++) {
    const total = (rw + 1) * cols;
    if (total % group === 0 || rw === rows - 1) out.push(text(x0 - 8, cy(rw) + 5, String(total), { anchor: "end" }));
  }
  const bottom = cy(rows - 1) + pitch / 2 + 10;
  const label = lab(d.label, lang) || `${filled} / ${rows * cols}`;
  out.push(text(W / 2, bottom + 14, label, { cls: "m-t m-n" }));
  const desc = tr(
    lang,
    `Grid of ${rows} rows and ${cols} columns, ${rows * cols} dots in groups of ${group}. The first ${filled} dots are filled (solid) and the rest are empty rings: ${label}.`,
    `Cuadrícula de ${rows} filas y ${cols} columnas, ${rows * cols} puntos en grupos de ${group}. Los primeros ${filled} puntos están llenos (sólidos) y el resto son anillos vacíos: ${label}.`,
  );
  return { h: bottom + 28, body: out.join(""), desc };
}

// ---------------------------------------------------------------- coord
export function renderCoord(d, { lang }) {
  assertKeys(d, ["xmax", "ymax", "points", "quadrants"], 'model "coord" data');
  need(d, "coord", "xmax", "ymax");
  const xmax = int(d, "coord", "xmax", 1, 20);
  const ymax = int(d, "coord", "ymax", 1, 20);
  const quad = d.quadrants === true;
  const nx = quad ? 2 * xmax : xmax;
  const ny = quad ? 2 * ymax : ymax;
  const px = Math.max(10, Math.min(30, 270 / nx));
  const py = Math.max(10, Math.min(30, 270 / ny));
  const left = 52;
  const top = 18;
  const x0 = left + (quad ? xmax * px : 0);
  const y0 = top + ny * py - (quad ? ymax * py : 0);
  const X = (v) => x0 + v * px;
  const Y = (v) => y0 - v * py;
  const out = [];
  const lx = quad ? -xmax : 0;
  const ly = quad ? -ymax : 0;
  let g = "";
  for (let i = 0; i <= nx; i++) g += `M${n1(left + i * px)} ${top}v${n1(ny * py)}`;
  for (let j = 0; j <= ny; j++) g += `M${left} ${n1(top + j * py)}h${n1(nx * px)}`;
  out.push(`<path class="m-gr" d="${g}"/>`);
  out.push(`<path class="m-ln" d="M${left} ${n1(y0)}H${n1(left + nx * px + 8)}M${n1(x0)} ${top + ny * py}V${top - 8}"/>${head(left + nx * px + 12, y0, "r")}${head(x0, top - 12, "u")}`);
  const stepX = Math.ceil(nx / 10);
  const stepY = Math.ceil(ny / 10);
  for (let i = 0; i <= nx; i += stepX) {
    const v = lx + i;
    if (v !== 0 || !quad) out.push(text(left + i * px, top + ny * py + 22, minus(String(v))));
  }
  for (let j = 0; j <= ny; j += stepY) {
    const v = ly + j;
    if (v !== 0 || !quad) out.push(text(left - 8, top + (ny - j) * py + 5, minus(String(v)), { anchor: "end" }));
  }
  const pts = d.points ?? [];
  const pd = [];
  pts.forEach((p, k) => {
    assertKeys(p, ["x", "y", "label"], `model "coord" data.points[${k}]`);
    if (typeof p.x !== "number" || typeof p.y !== "number" || Math.abs(p.x) > xmax || Math.abs(p.y) > ymax || (!quad && (p.x < 0 || p.y < 0))) {
      throw new Error(`model "coord": points[${k}] (${p.x}, ${p.y}) is outside the plane`);
    }
    const name = lab(p.label, lang);
    out.push(`<circle class="m-dot" cx="${n1(X(p.x))}" cy="${n1(Y(p.y))}" r="5.5"/>`);
    const w = textW(name, 16);
    const flip = X(p.x) + 10 + w > W - PAD;
    out.push(text(flip ? X(p.x) - 9 : X(p.x) + 9, Y(p.y) - 9, name, { anchor: flip ? "end" : "start", cls: "m-t m-n" }));
    pd.push(`${name ? `${name} ` : ""}(${minus(String(p.x))}, ${minus(String(p.y))})`);
  });
  const desc = tr(
    lang,
    `Coordinate plane${quad ? ", all four quadrants" : ", first quadrant"}, x from ${quad ? -xmax : 0} to ${xmax}, y from ${quad ? -ymax : 0} to ${ymax}.${pd.length ? ` Points: ${pd.join("; ")}.` : ""}`,
    `Plano de coordenadas${quad ? ", los cuatro cuadrantes" : ", primer cuadrante"}, x de ${quad ? -xmax : 0} a ${xmax}, y de ${quad ? -ymax : 0} a ${ymax}.${pd.length ? ` Puntos: ${pd.join("; ")}.` : ""}`,
  );
  return { h: top + ny * py + 40, body: out.join(""), desc };
}

// ---------------------------------------------------------------- balance
export function renderBalance(d, { lang }) {
  assertKeys(d, ["left", "right", "unknown"], 'model "balance" data');
  need(d, "balance", "left", "right");
  for (const side of ["left", "right"]) {
    if (!Array.isArray(d[side]) || d[side].length < 1 || d[side].length > 6) throw new Error(`model "balance": data.${side} needs 1 to 6 items`);
  }
  const unk = d.unknown;
  const isUnknown = (item, side, i) => {
    if (unk === undefined || unk === null) return false;
    if (typeof unk === "object") return unk.side === side && unk.index === i;
    return String(lab(item, lang)) === String(unk);
  };
  const beamY = 52;
  const panY = 176;
  const cell = 44;
  const pan = (side, cx) => {
    const items = d[side];
    const out = [];
    out.push(`<path class="m-ln" d="M${cx} ${beamY}L${cx - 56} ${panY}M${cx} ${beamY}L${cx + 56} ${panY}"/>`);
    items.forEach((item, i) => {
      const rw = Math.floor(i / 3);
      const inRow = Math.min(3, items.length - rw * 3);
      const ix = cx - (inRow * cell) / 2 + (i % 3) * cell + 3;
      const iy = panY - (rw + 1) * (cell - 2) - 1;
      const u = isUnknown(item, side, i);
      const s = lab(item, lang);
      const numeric = /^[\d.,\u2212-]+$/.test(s);
      const bw = cell - 6;
      const shape = numeric
        ? `<rect class="${u ? "m-u" : "m-g"}" x="${n1(ix)}" y="${n1(iy)}" width="${bw}" height="${cell - 8}" rx="4"/>`
        : `<rect class="${u ? "m-u" : "m-p"}" x="${n1(ix)}" y="${n1(iy + 4)}" width="${bw}" height="${cell - 12}" rx="12"/><path class="m-ln" d="M${n1(ix + bw / 2 - 5)} ${n1(iy + 4)}l5-5 5 5"/>`;
      out.push(shape + text(ix + bw / 2, iy + 26, u ? "?" : s, { cls: u ? "m-q" : "m-t m-n" }));
    });
    out.push(`<path class="m-g" d="M${cx - 62} ${panY}h124l-10 14h-104z"/>`);
    return out.join("");
  };
  const lx = PAD + 62;
  const rx = W - PAD - 62;
  const body = `<path class="m-ln" d="M${lx} ${beamY}H${rx}"/><path class="m-g" d="M180 ${beamY}L156 216h48z"/><path class="m-ln" d="M144 216h72"/>${pan("left", lx)}${pan("right", rx)}<circle class="m-dot" cx="180" cy="${beamY}" r="6"/>`;
  const side = (arr, s) => arr.map((x, i) => (isUnknown(x, s, i) ? tr(lang, "the unknown", "la incógnita") : lab(x, lang))).join(", ");
  const desc = tr(
    lang,
    `Balance with the beam level. Left side: ${side(d.left, "left")}. Right side: ${side(d.right, "right")}. Both sides are equal.`,
    `Balanza con el brazo nivelado. Lado izquierdo: ${side(d.left, "left")}. Lado derecho: ${side(d.right, "right")}. Los dos lados son iguales.`,
  );
  return { h: 232, body, desc };
}

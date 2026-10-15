// Direct manipulation for the live models: tap, drag or shade the picture itself.
// Pure geometry: grab() picks which quantity a pointer is holding, move() turns the pointer position into new
// values. Both mirror the drawing in model.mjs (same viewBox units), and every result is snapped to the model's
// own control limits, so the typed fields, the readout and the picture can never disagree.
const snap = (f, v) => {
  const n = Math.round((v - f.min) / f.step) * f.step + f.min;
  return Math.min(f.max, Math.max(f.min, Number(n.toFixed(6))));
};
const set = (values, fields, i, v) => {
  const next = [...values];
  next[i] = snap(fields[i], v);
  return next;
};
/** A position f (0 to 1) along a control's whole range; optionally a second control from g. */
const slide = (values, fields, i, f, _fields2, j, g) => {
  const at = (k, t) => fields[k].min + Math.min(1, Math.max(0, t)) * (fields[k].max - fields[k].min);
  let next = set(values, fields, i, at(i, f));
  if (j !== undefined) next = set(next, fields, j, at(j, g));
  return next;
};
const nearest = (list, x) => list.reduce((best, v, i) => (Math.abs(v - x) < Math.abs(list[best] - x) ? i : best), 0);

const ratioX = (x) => Math.floor((x - 40) / 43) + 1;
const arrayGeometry = ([a, b]) => {
  const size = Math.min(34, 450 / b, 235 / a);
  return { size, left: (600 - b * size) / 2 };
};
const dataAxis = (values) => Math.max(10, Math.ceil(Math.max(...values) / 10) * 10);
const growthGeometry = ([a, b, c]) => {
  const maxX = Math.max(6, c);
  return { maxX, maxY: Math.max(1, a * maxX + b) };
};
const BIN = 5;
const histogramGeometry = (values) => {
  const count = Math.max(4, Math.floor(Math.max(...values) / BIN) + 1);
  const bins = Array(count).fill(0);
  values.forEach((n) => { bins[Math.min(count - 1, Math.floor(n / BIN))]++; });
  return { count, width: 500 / count, unit: Math.min(25, 200 / Math.max(1, ...bins)) };
};
const binOf = (n, count) => Math.min(count - 1, Math.floor(n / BIN));
/** Move observations between bins until bin `target` holds `want` of them; the total never changes. */
function fillBin(values, fields, target, want, count) {
  let next = [...values];
  for (let guard = 0; guard < 60; guard++) {
    const inBin = next.map((n, i) => (binOf(n, count) === target ? i : -1)).filter((i) => i >= 0);
    if (inBin.length === want) break;
    if (inBin.length < want) {
      // take one from the fullest other bin (a bin keeps at least one only if it is the fullest)
      const donor = Array.from({ length: count }, (_, b) => b)
        .filter((b) => b !== target)
        .map((b) => ({ b, ids: next.map((n, i) => (binOf(n, count) === b ? i : -1)).filter((i) => i >= 0) }))
        .sort((x, y) => y.ids.length - x.ids.length)[0];
      if (!donor || !donor.ids.length) break;
      next = set(next, fields, donor.ids[0], target * BIN + 2);
    } else {
      const to = target + 1 < count ? target + 1 : target - 1;
      next = set(next, fields, inBin[0], to * BIN + 2);
    }
  }
  return next;
}
const netGeometry = ([a, b, c]) => {
  const scale = Math.min(500 / (2 * a + 2 * b), 225 / (c + 2 * b));
  return { scale, left: (600 - (2 * a + 2 * b) * scale) / 2, top: 24 + b * scale, a, b, c };
};
const areaScale = ([a, b]) => 360 / Math.max(a, b, 12);

/** The one-line instruction shown under a touchable picture. */
export function directHint(model) {
  if (['decimal', 'division', 'rate', 'conversion'].includes(model.kind))
    return 'Slide across each box in the picture to change its number.';
  if (['factors', 'power'].includes(model.kind)) return 'Slide across each row of the picture to change its number.';
  if (model.kind === 'balance') return 'Slide across the picture to try different values of x.';
  if (model.kind === 'data' && model.mode === 'histogram') return 'Drag a bar up or down to move observations into or out of it.';
  if (model.kind === 'data') return 'Drag a dot left or right to change that observation.';
  if (model.kind === 'solid') return 'Drag across the net to change the length, width and height.';
  if (model.kind === 'expression') return 'Drag across the rectangle to move the split.';
  if (model.kind === 'area' && model.mode === 'polygon') return 'Drag right for more sides and up for longer sides.';
  return 'Touch the picture: tap or drag it to change the model.';
}

/** Which models can be handled directly. */
export function isDirect(model) {
  if (model.kind === 'data') return true;
  if (model.kind === 'area') return true;
  return ['percent', 'array', 'ratio', 'fraction', 'line', 'inequality', 'coordinates', 'growth', 'balance', 'expression', 'decimal', 'division', 'rate', 'conversion', 'factors', 'power', 'solid'].includes(model.kind);
}

/** The pointer went down at p (viewBox units). Returns a handle for move(), or null if nothing is held. */
export function grab(model, values, p, shape = 'prism') {
  switch (model.kind) {
    case 'percent': return { kind: 'grid' };
    case 'array': return { geo: arrayGeometry(values) };
    case 'ratio': return { row: p.y < 160 ? 0 : 1 };
    case 'fraction': return {};
    case 'balance': return {};
    case 'decimal': case 'division': case 'rate': case 'conversion': return { i: p.x < 300 ? 0 : 1 };
    case 'factors': return { i: p.y < 84 ? 0 : 1 };
    case 'power': return { i: p.y < 116 ? 1 : p.y < 190 ? 0 : 2 };
    case 'expression': return {};
    case 'line': return { i: nearest([45 + (values[0] + 10) / 20 * 510, 45 + (values[1] + 10) / 20 * 510], p.x) };
    case 'inequality': return { i: p.y > 190 ? 1 : 0 };
    case 'coordinates': {
      const pts = [[300 + values[0] * 19, 146 - values[1] * 19], [300 + values[2] * 19, 146 - values[3] * 19]];
      const d = pts.map(([x, y]) => Math.hypot(x - p.x, y - p.y));
      return { i: d[0] <= d[1] ? 0 : 1 };
    }
    case 'solid': {
      if (shape === 'pyramid') return null;
      const g = netGeometry(values);
      const row = p.y < g.top ? 'top' : p.y > g.top + g.c * g.scale ? 'bottom' : 'middle';
      const widths = [g.a, g.b, g.a, g.b];
      let x = g.left, face = 0;
      for (; face < 3 && p.x > x + widths[face] * g.scale; face++) x += widths[face] * g.scale;
      return { ...g, row, face, faceLeft: x };
    }
    case 'data': {
      if (model.mode === 'histogram') return { hist: histogramGeometry(values) };
      const axis = dataAxis(values);
      return { i: nearest(values.map((n) => 55 + n / axis * 490), p.x), axis };
    }
    case 'growth': {
      const g = growthGeometry(values);
      const sx = (x) => 65 + 470 * x / g.maxX;
      const which = p.x < sx(0) + 28 ? 'start' : p.x > sx(g.maxX) - 28 ? 'end' : 'input';
      return { ...g, which };
    }
    case 'area': {
      if (model.mode === 'polygon') return {};
      const bs = areaScale(values);
      if (model.mode === 'trapezoid') return { bs, which: p.y < 235 - values[2] * 8 ? 'top' : 'bottom' };
      return { bs, which: p.x > 100 + values[0] * bs * 0.75 ? 'base' : 'apex' };
    }
    default: return null;
  }
}

/** Pointer is now at p. Returns the new values array, or null if the pointer is off the picture's active area. */
export function move(model, values, p, h, fields) {
  switch (model.kind) {
    case 'percent': {
      const col = Math.floor((p.x - 35) / 23), row = Math.floor((p.y - 20) / 23);
      if (col < 0 || col > 9 || row < 0 || row > 9) return null;
      return set(values, fields, 0, row * 10 + col + 1);
    }
    case 'array': {
      const col = Math.floor((p.x - h.geo.left) / h.geo.size), row = Math.floor((p.y - 22) / h.geo.size);
      return set(set(values, fields, 0, row + 1), fields, 1, col + 1);
    }
    case 'ratio': return set(values, fields, h.row, ratioX(p.x));
    case 'fraction': {
      const c = values[2];
      return set(values, fields, 1, Math.ceil((p.x - 50) / (500 / c)));
    }
    case 'balance': return set(values, fields, 2, (p.x - 60) / 480 * 30);
    case 'decimal': case 'division': case 'rate': case 'conversion': return slide(values, fields, h.i, (p.x - (h.i ? 345 : 45)) / 210);
    case 'factors': return slide(values, fields, h.i, (p.x - 40) / 520);
    case 'power': return slide(values, fields, h.i, (p.x - 70) / 460);
    case 'expression': {
      // the split follows the pointer: x is the share of the rectangle left of it
      const f = Math.min(0.92, Math.max(0.04, (p.x - 70) / 460));
      return set(values, fields, 2, values[1] * f / (1 - f));
    }
    case 'line': return set(values, fields, h.i, (p.x - 45) / 510 * 20 - 10);
    case 'inequality': return set(values, fields, h.i, (p.x - 45) / 510 * 30);
    case 'coordinates': {
      const x = (p.x - 300) / 19, y = (146 - p.y) / 19;
      return set(set(values, fields, h.i * 2, x), fields, h.i * 2 + 1, y);
    }
    case 'solid': {
      if (h.row === 'middle') {
        const w = (p.x - h.faceLeft) / h.scale;
        const withHeight = set(values, fields, 2, (p.y - h.top) / h.scale);
        return set(withHeight, fields, h.face % 2 ? 1 : 0, w);
      }
      const sideways = set(values, fields, 0, (p.x - h.left) / h.scale);
      return set(sideways, fields, 1, h.row === 'top' ? (h.top - p.y) / h.scale : (p.y - (h.top + h.c * h.scale)) / h.scale);
    }
    case 'data': {
      if (h.hist) {
        const { count, width, unit } = h.hist;
        const bin = Math.floor((p.x - 50) / width);
        if (bin < 0 || bin >= count) return null;
        return fillBin(values, fields, bin, Math.max(0, Math.round((240 - p.y) / unit)), count);
      }
      return set(values, fields, h.i, (p.x - 55) / 490 * h.axis);
    }
    case 'growth': {
      const b = values[1];
      const yAt = (py) => (245 - py) / 210 * h.maxY;
      if (h.which === 'start') return set(values, fields, 1, yAt(p.y));
      if (h.which === 'end') return set(values, fields, 0, (yAt(p.y) - b) / h.maxX);
      return set(values, fields, 2, (p.x - 65) / 470 * h.maxX);
    }
    case 'area': {
      if (model.mode === 'polygon') {
        // right = more sides, up = longer sides
        return slide(values, fields, 0, (p.x - 150) / 300, null, 1, (270 - p.y) / 240);
      }
      if (model.mode === 'trapezoid') {
        const half = Math.abs(p.x - 300) * 2 / h.bs;
        if (h.which === 'bottom') return set(values, fields, 0, half);
        return set(set(values, fields, 1, half), fields, 2, (235 - p.y) / 16);
      }
      if (h.which === 'base') return set(values, fields, 0, (p.x - 100) / h.bs);
      return set(values, fields, 1, (235 - p.y) / 16);
    }
    default: return null;
  }
}

const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

/** Wire pointer events on the picture. `host` is the stable container the SVG is re-rendered inside. */
export function attachDirect(host, model, { fields, getValues, apply, getShape = () => 'prism' }) {
  if (!isDirect(model)) return;
  host.classList.add('direct');
  host.setAttribute('data-direct', model.kind);
  let handle = null;
  const point = (e) => {
    const svg = host.querySelector('svg');
    const m = svg?.getScreenCTM?.();
    if (!svg || !m) return null;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const r = pt.matrixTransform(m.inverse());
    return { x: r.x, y: r.y };
  };
  const run = (e) => {
    const p = point(e);
    if (!p || !handle) return;
    const next = move(model, getValues(), p, handle, fields);
    if (next && !same(next, getValues())) apply(next);
  };
  host.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    const p = point(e);
    if (!p) return;
    handle = grab(model, getValues(), p, getShape());
    if (!handle) return;
    e.preventDefault();
    host.setPointerCapture?.(e.pointerId);
    host.classList.add('dragging');
    run(e);
  });
  host.addEventListener('pointermove', (e) => { if (handle) run(e); });
  const end = () => { handle = null; host.classList.remove('dragging'); };
  host.addEventListener('pointerup', end);
  host.addEventListener('pointercancel', end);
}

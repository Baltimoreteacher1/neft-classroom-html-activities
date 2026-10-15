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
const areaScale = ([a, b]) => 360 / Math.max(a, b, 12);

/** Which models can be handled directly. */
export function isDirect(model) {
  if (model.kind === 'data') return model.mode !== 'histogram';
  if (model.kind === 'area') return model.mode !== 'polygon';
  return ['percent', 'array', 'ratio', 'fraction', 'line', 'inequality', 'coordinates', 'growth', 'balance', 'expression'].includes(model.kind);
}

/** The pointer went down at p (viewBox units). Returns a handle for move(), or null if nothing is held. */
export function grab(model, values, p) {
  switch (model.kind) {
    case 'percent': return { kind: 'grid' };
    case 'array': return { geo: arrayGeometry(values) };
    case 'ratio': return { row: p.y < 160 ? 0 : 1 };
    case 'fraction': return {};
    case 'balance': return {};
    case 'expression': return {};
    case 'line': return { i: nearest([45 + (values[0] + 10) / 20 * 510, 45 + (values[1] + 10) / 20 * 510], p.x) };
    case 'inequality': return { i: p.y > 190 ? 1 : 0 };
    case 'coordinates': {
      const pts = [[300 + values[0] * 19, 146 - values[1] * 19], [300 + values[2] * 19, 146 - values[3] * 19]];
      const d = pts.map(([x, y]) => Math.hypot(x - p.x, y - p.y));
      return { i: d[0] <= d[1] ? 0 : 1 };
    }
    case 'data': {
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
    case 'data': return set(values, fields, h.i, (p.x - 55) / 490 * h.axis);
    case 'growth': {
      const b = values[1];
      const yAt = (py) => (245 - py) / 210 * h.maxY;
      if (h.which === 'start') return set(values, fields, 1, yAt(p.y));
      if (h.which === 'end') return set(values, fields, 0, (yAt(p.y) - b) / h.maxX);
      return set(values, fields, 2, (p.x - 65) / 470 * h.maxX);
    }
    case 'area': {
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
export function attachDirect(host, model, { fields, getValues, apply }) {
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
    handle = grab(model, getValues(), p);
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

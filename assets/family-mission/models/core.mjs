// Family Mission model kit: exact rationals, a undo-able store, DOM/SVG helpers, a keyboard +
// pointer + touch slider helper and a polite live-region announcer. No dependencies, no DOM at
// import time (every helper reads `globalThis.document` when it is called), so the pure state
// code can be tested in plain Node.

// ── Exact rationals ──────────────────────────────────────────────────────────
// A rational is { n, d } with d > 0 and gcd(n, d) = 1, both safe integers. Arithmetic runs on
// BigInt and throws RangeError rather than ever returning an inexact result.

const gcdB = (a, b) => {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y) [x, y] = [y, x % y];
  return x || 1n;
};

export function frac(n, d = 1) {
  let N = BigInt(n);
  let D = BigInt(d);
  if (D === 0n) throw new RangeError("zero denominator");
  if (D < 0n) {
    N = -N;
    D = -D;
  }
  const g = gcdB(N, D);
  N /= g;
  D /= g;
  const out = { n: Number(N), d: Number(D) };
  if (!Number.isSafeInteger(out.n) || !Number.isSafeInteger(out.d)) {
    throw new RangeError("rational overflow");
  }
  return out;
}

const B = (x) => [BigInt(x.n), BigInt(x.d)];
export function add(a, b) {
  const [an, ad] = B(a);
  const [bn, bd] = B(b);
  return frac(an * bd + bn * ad, ad * bd);
}
export function sub(a, b) {
  const [an, ad] = B(a);
  const [bn, bd] = B(b);
  return frac(an * bd - bn * ad, ad * bd);
}
export function mul(a, b) {
  const [an, ad] = B(a);
  const [bn, bd] = B(b);
  return frac(an * bn, ad * bd);
}
export function div(a, b) {
  const [an, ad] = B(a);
  const [bn, bd] = B(b);
  return frac(an * bd, ad * bn);
}
export const sign = (a) => Math.sign(a.n);
export const isInt = (a) => a.d === 1;
export function cmp(a, b) {
  const [an, ad] = B(a);
  const [bn, bd] = B(b);
  const l = an * bd;
  const r = bn * ad;
  return l < r ? -1 : l > r ? 1 : 0;
}
export const eq = (a, b) => cmp(a, b) === 0;
export function floorRat(a) {
  const [n, d] = B(a);
  let q = n / d;
  if (n % d !== 0n && n < 0n) q -= 1n;
  return Number(q);
}
export const ceilRat = (a) => -floorRat(frac(-a.n, a.d));
export const toNumber = (a) => a.n / a.d;
export function isRat(x) {
  if (!x || typeof x !== "object" || typeof x.n !== "number" || typeof x.d !== "number") {
    return false;
  }
  try {
    const f = frac(x.n, x.d);
    return f.n === x.n && f.d === x.d;
  } catch {
    return false;
  }
}

/** Parses "150", "1.5", "3/2", "1 1/2", "60%", "1,200" -> rational, or null. Never throws. */
export function parseRational(text) {
  try {
    let s = String(text).trim().replace(/%$/, "").trim();
    if (/^[+-]?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, "");
    let m = s.match(/^([+-]?)(\d+)(?:\.(\d{1,9}))?$/);
    if (m && s.replace(/\D/g, "").length <= 15) {
      const digits = m[3] || "";
      const v = frac(BigInt(m[2] + digits) * (m[1] === "-" ? -1n : 1n), 10n ** BigInt(digits.length));
      return v;
    }
    m = s.match(/^([+-]?\d+)\s*\/\s*(\d+)$/);
    if (m && BigInt(m[2]) !== 0n) return frac(BigInt(m[1]), BigInt(m[2]));
    m = s.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
    if (m && BigInt(m[3]) !== 0n) return frac(BigInt(m[1]) * BigInt(m[3]) + BigInt(m[2]), BigInt(m[3]));
  } catch {
    // fall through
  }
  return null;
}

/** Number | numeric string | rational -> rational, or null. */
export function toFrac(x) {
  if (isRat(x)) return x;
  if (typeof x === "number") return Number.isFinite(x) ? parseRational(String(x)) : null;
  if (typeof x === "string") return parseRational(x);
  return null;
}

export function terminates(a) {
  let d = a.d;
  while (d % 2 === 0) d /= 2;
  while (d % 5 === 0) d /= 5;
  return d === 1;
}

const withCommas = (digits) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** Exact decimal text, or null when the decimal expansion does not terminate. */
export function toDecimalString(a, { commas = false } = {}) {
  if (!terminates(a)) return null;
  let k = 0;
  let d = a.d;
  while (d > 1) {
    d = d % 10 === 0 ? d / 10 : d % 2 === 0 ? d / 2 : d / 5;
    k += 1;
  }
  // k is an upper bound on the digits needed; trim trailing zeros afterwards.
  const scaled = (BigInt(Math.abs(a.n)) * 10n ** BigInt(k)) / BigInt(a.d);
  let digits = scaled.toString().padStart(k + 1, "0");
  let whole = digits.slice(0, digits.length - k);
  let part = digits.slice(digits.length - k).replace(/0+$/, "");
  if (commas) whole = withCommas(whole);
  digits = part ? `${whole}.${part}` : whole;
  return (a.n < 0 ? "-" : "") + digits;
}

export const fracToString = (a) => (a.d === 1 ? String(a.n) : `${a.n}/${a.d}`);

/** Decimal when it terminates, otherwise "n/d". Thousands get commas. */
export function fmtNumber(a) {
  return toDecimalString(a, { commas: true }) ?? fracToString(a);
}

/** Value as a share of the whole (3/2) -> "150%" (or "1000/3%" when it does not terminate). */
export const toPercentString = (a) => `${fmtNumber(mul(a, frac(100)))}%`;

// ── Language ─────────────────────────────────────────────────────────────────

export const t = (lang, o) => (lang === "es" && o.es != null ? o.es : o.en);
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// ── Store ────────────────────────────────────────────────────────────────────

const clone = (x) => JSON.parse(JSON.stringify(x));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export function createStore(initial, { family = "model", reduce, validateState, track } = {}) {
  const ok = (st) => {
    try {
      return !validateState || validateState(st) === true;
    } catch {
      return false;
    }
  };
  let first = clone(initial);
  if (!ok(first)) throw new TypeError(`invalid initial state for "${family}"`);
  let state = clone(first);
  let undoStack = [];
  let redoStack = [];
  const subs = new Set();
  const notify = () => {
    for (const fn of [...subs]) fn(clone(state));
  };
  function commit(next, record) {
    if (record) {
      undoStack.push(state);
      if (undoStack.length > 100) undoStack.shift();
      redoStack = [];
    }
    state = next;
    notify();
  }
  return {
    getState: () => clone(state),
    setState(patch) {
      let next;
      try {
        next = reduce ? reduce(clone(state), patch) : { ...state, ...patch };
      } catch {
        return false;
      }
      if (!next || !ok(next)) return false;
      if (same(next, state)) return true;
      commit(next, track ? track(patch) : true);
      return true;
    },
    undo() {
      if (!undoStack.length) return false;
      redoStack.push(state);
      state = undoStack.pop();
      notify();
      return true;
    },
    redo() {
      if (!redoStack.length) return false;
      undoStack.push(state);
      state = redoStack.pop();
      notify();
      return true;
    },
    canUndo: () => undoStack.length > 0,
    reset() {
      const next = clone(first);
      if (same(next, state)) return true;
      commit(next, true);
      return true;
    },
    /** Replaces the starting state (used by model.initialize) and forgets history. */
    initialize(next) {
      if (!ok(next)) throw new TypeError(`invalid initial state for "${family}"`);
      first = clone(next);
      state = clone(next);
      undoStack = [];
      redoStack = [];
      notify();
    },
    serialize: () => JSON.stringify({ v: 1, family, state }),
    restore(json) {
      try {
        const o = typeof json === "string" ? JSON.parse(json) : json;
        if (!o || o.v !== 1 || o.family !== family || !o.state || typeof o.state !== "object") {
          return false;
        }
        const next = clone(o.state);
        if (!ok(next)) return false;
        state = next;
        undoStack = [];
        redoStack = [];
        notify();
        return true;
      } catch {
        return false;
      }
    },
    subscribe(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },
  };
}

// ── DOM / SVG builders ───────────────────────────────────────────────────────

export const SVG_NS = "http://www.w3.org/2000/svg";
const BAD = /\bundefined\b|\bNaN\b|\[object /;

function checked(str) {
  if (BAD.test(str)) throw new TypeError(`bad text "${str}"`);
  return str;
}

function build(node, attrs, kids) {
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (/^on/i.test(k)) throw new TypeError(`inline handler "${k}" is not allowed (CSP)`);
    if (typeof v === "number" && !Number.isFinite(v)) throw new RangeError(`"${k}" is not finite`);
    node.setAttribute(k, v === true ? "" : checked(String(v)));
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid === null || kid === undefined || kid === false) continue;
    node.append(typeof kid === "object" ? kid : checked(String(kid)));
  }
  return node;
}

/** HTML element. */
export const h = (tag, attrs, ...kids) => build(globalThis.document.createElement(tag), attrs, kids);
/** SVG element. */
export const s = (tag, attrs, ...kids) =>
  build(globalThis.document.createElementNS(SVG_NS, tag), attrs, kids);
/** Appends children to an existing node, skipping null/false (native append() would print "null"). */
export const put = (node, ...kids) => build(node, null, kids);
/** SVG text. */
export const stext = (x, y, str, cls = "fm-svg-text", anchor = "start") =>
  s("text", { x, y, class: cls, "text-anchor": anchor }, str);
/** Adds <title> and <desc> as the first children of an SVG (read by tools that ignore ARIA). */
export function a11y(svg, title, desc) {
  svg.prepend(s("title", null, title), s("desc", null, desc));
  return svg;
}
export const clear = (node) => {
  while (node.firstChild) node.firstChild.remove();
};

/** Collects listeners so destroy() can remove every one of them. */
export function createBag() {
  const list = [];
  return {
    on(node, type, fn, opts) {
      node.addEventListener(type, fn, opts);
      list.push(() => node.removeEventListener(type, fn, opts));
    },
    clear() {
      for (const off of list.splice(0)) off();
    },
  };
}

export function button(bag, label, { onClick, pressed, cls = "", ariaLabel, disabled } = {}) {
  const b = h(
    "button",
    {
      type: "button",
      class: `fm-btn ${cls}`.trim(),
      "aria-pressed": pressed === undefined ? null : String(pressed),
      "aria-label": ariaLabel,
      disabled: disabled ? "" : null,
    },
    label,
  );
  if (onClick) bag.on(b, "click", onClick);
  return b;
}

/** A labelled readout. Editable -> <input> committed on `change`; read-only -> <output>. */
export function field(bag, { id, label, readonly, onCommit, hint }) {
  const input = readonly
    ? h("output", { id, class: "fm-value" })
    : h("input", { id, class: "fm-input", type: "text", inputmode: "decimal", autocomplete: "off" });
  const el = h(
    "div",
    { class: "fm-field" },
    h("label", { class: "fm-label", for: id }, label),
    input,
    hint ? h("span", { class: "fm-hint" }, hint) : null,
  );
  if (!readonly) bag.on(input, "change", () => onCommit?.(input.value, input));
  return {
    el,
    input,
    set(v, force) {
      const text = String(v);
      if (readonly) input.textContent = text;
      else if (force || globalThis.document.activeElement !== input) input.value = text;
    },
    invalid(flag) {
      if (flag) input.setAttribute("aria-invalid", "true");
      else input.removeAttribute("aria-invalid");
    },
  };
}

// ── Motion ───────────────────────────────────────────────────────────────────

/** False when the OS or the page asks for reduced motion. Models animate only when true. */
export function motionOK() {
  try {
    if (globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return false;
    return globalThis.document?.documentElement?.dataset?.motion !== "reduce";
  } catch {
    return true;
  }
}

// ── Live region ──────────────────────────────────────────────────────────────

const live = new WeakMap();
/** Polite, debounced announcement (screen readers read only the last message in the window). */
export function announce(root, text, delay = 350) {
  let rec = live.get(root);
  if (!rec) {
    const node = h("div", { class: "fm-live fm-sr", role: "status", "aria-live": "polite" });
    root.append(node);
    rec = { node, timer: null };
    live.set(root, rec);
  }
  clearTimeout(rec.timer);
  rec.timer = setTimeout(() => {
    rec.node.textContent = text;
    rec.timer = null;
  }, delay);
}
export function disposeAnnouncer(root) {
  const rec = live.get(root);
  if (!rec) return;
  clearTimeout(rec.timer);
  rec.node.remove();
  live.delete(root);
}

// ── Slider / drag helper ─────────────────────────────────────────────────────

const val = (x) => (typeof x === "function" ? x() : x);

/**
 * Makes `node` a slider over plain numbers.
 *  get()/set(v, source)  current value / change it (source is "key" or "pointer")
 *  min, max, step, bigStep  numbers or functions returning numbers
 *  label, valueText(v), ariaNow(v)  accessible name and text
 *  toValue({x, y, start, node})  pointer position -> value; start = {x, y, value}
 *  aria: false keeps the pointer behaviour but adds no role and no tab stop (a second, mouse-only
 *        handle for the same value, so a screen reader never meets the slider twice)
 * Arrow keys step, Shift+Arrow and PageUp/PageDown take bigStep, Home/End jump to the ends. Touch
 * scrolling is only blocked on the handle itself (touch-action: none there, nowhere else).
 */
export function makeDraggable(node, o) {
  const bag = createBag();
  const aria = o.aria !== false;
  node.classList.add("fm-draggable");
  node.style.touchAction = "none";
  if (aria) {
    node.setAttribute("role", "slider");
    node.setAttribute("tabindex", "0");
    node.setAttribute("aria-orientation", "horizontal");
  } else {
    node.setAttribute("aria-hidden", "true");
  }
  const move = (v, source) => o.set(clamp(v, val(o.min), val(o.max)), source);

  function refresh() {
    if (!aria) return;
    const v = get();
    const now = o.ariaNow ? o.ariaNow(v) : v;
    node.setAttribute("aria-valuemin", String(o.ariaNow ? o.ariaNow(val(o.min)) : val(o.min)));
    node.setAttribute("aria-valuemax", String(o.ariaNow ? o.ariaNow(val(o.max)) : val(o.max)));
    node.setAttribute("aria-valuenow", String(now));
    node.setAttribute("aria-valuetext", o.valueText ? o.valueText(v) : String(now));
    if (o.label) node.setAttribute("aria-label", o.label);
  }
  const get = () => o.get();

  if (aria) {
    bag.on(node, "keydown", (e) => {
      const step = val(o.step ?? 1);
      const big = val(o.bigStep ?? step * 10);
      const v = get();
      let next;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") next = v + (e.shiftKey ? big : step);
      else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = v - (e.shiftKey ? big : step);
      else if (e.key === "PageUp") next = v + big;
      else if (e.key === "PageDown") next = v - big;
      else if (e.key === "Home") next = val(o.min);
      else if (e.key === "End") next = val(o.max);
      else return;
      e.preventDefault();
      move(next, "key");
    });
  }

  let start = null;
  const end = () => {
    start = null;
    node.classList.remove("fm-dragging");
  };
  if (o.toValue) {
    bag.on(node, "pointerdown", (e) => {
      if (e.button) return;
      start = { x: e.clientX, y: e.clientY, value: get() };
      try {
        node.setPointerCapture?.(e.pointerId);
      } catch {
        // synthetic events carry no live pointer
      }
      node.classList.add("fm-dragging");
      if (aria) node.focus?.({ preventScroll: true });
      e.preventDefault();
    });
    bag.on(node, "pointermove", (e) => {
      if (!start) return;
      const v = o.toValue({ x: e.clientX, y: e.clientY, start, node });
      if (Number.isFinite(v)) move(v, "pointer");
    });
    for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) bag.on(node, type, end);
  }
  refresh();
  return { refresh, destroy: () => bag.clear() };
}

/** Pointer x (client px) -> SVG viewBox units, for the svg that owns `node`. */
export function toSvgX(node, clientX, viewW) {
  const svg = node.ownerSVGElement || node;
  const r = svg.getBoundingClientRect?.();
  const scale = r && r.width > 0 ? r.width / viewW : 1;
  return { x: (clientX - (r ? r.left : 0)) / scale, scale };
}

// ── Family scaffolding (shared by every family so the contract cannot drift) ──

/**
 * Builds a family's `create(config)`. The family supplies pure functions; this wires them to a
 * store and exposes the model contract: initialize, getState, setState, validate, reset, undo,
 * serialize, restore, getAccessibleDescription, getMathematicalExplanation, describeConfig.
 */
export function defineFamily(def) {
  return function create(config) {
    let cfg = def.normalize(config);
    const store = createStore(cfg.state, {
      family: def.id,
      reduce: def.reduce,
      validateState: def.validateState,
      track: def.track,
    });
    const model = {
      family: def.id,
      get task() {
        return cfg.task;
      },
      initialize(next) {
        cfg = def.normalize(next);
        store.initialize(cfg.state);
        return model.getState();
      },
      getState: () => def.derive(store.getState()),
      setState: (patch) => store.setState(patch),
      validate: (task) => def.validateTask(store.getState(), task === undefined ? cfg.task : task),
      reset: () => store.reset(),
      undo: () => store.undo(),
      redo: () => store.redo(),
      canUndo: () => store.canUndo(),
      serialize: () => store.serialize(),
      restore: (json) => store.restore(json),
      subscribe: (fn) => store.subscribe((st) => fn(def.derive(st))),
      getAccessibleDescription: (lang = "en") => def.accessibleDescription(store.getState(), lang),
      getMathematicalExplanation: (lang = "en") => def.explanation(store.getState(), lang),
      describeConfig: () => ({ family: def.id, ...def.describeConfig(cfg.state), task: cfg.task }),
    };
    return model;
  };
}

/**
 * The draw / redraw / language-switch / teardown loop every family shares. `build(view)` creates
 * the DOM once per language and sets view.handles; `sync(view, force)` repaints from the model;
 * `say(state, lang)` is the polite announcement after a change. view = {lang, bag, handles}.
 */
export function createView(root, model, { lang, onChange, cls, build, sync, say }) {
  const view = { lang, bag: createBag(), handles: [] };
  let unsub = () => {};
  let started = false;
  function render() {
    clear(root);
    root.classList.add("fm-model", cls);
    root.classList.toggle("fm-anim", motionOK());
    root.setAttribute("lang", view.lang);
    view.handles = [];
    build(view);
    sync(view, true);
    unsub();
    unsub = model.subscribe((st) => {
      sync(view, false);
      if (started) {
        announce(root, say(st, view.lang));
        onChange?.(st);
      }
    });
    started = true;
  }
  function teardown() {
    unsub();
    unsub = () => {};
    for (const hd of view.handles) hd.destroy();
    view.handles = [];
    view.bag.clear();
    disposeAnnouncer(root);
  }
  render();
  return {
    setLang(next) {
      if (next === view.lang) return;
      teardown();
      view.lang = next;
      started = false;
      render();
    },
    destroy() {
      teardown();
      clear(root);
      root.classList.remove("fm-model", cls, "fm-anim");
    },
  };
}

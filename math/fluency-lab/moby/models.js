// Interactive, accessible models for strategy instruction. ONE API for every kind:
//
//   const model = mountModel(kind, host, spec, { onChange, reducedMotion, grade });
//   model.getState()  -> a plain copy of the state (JSON safe)
//   model.setState(s) -> merge a (partial) state and animate to it; does not call onChange
//   model.play(i)     -> go to spec.steps[i] = { state, hl, say }: state + highlight + a spoken line
//   model.announce(t) -> write to the polite live region
//   model.destroy()
//   (also) model.setHighlight(tokens), model.setLocked(bool), model.flash("ok"|"no"), model.root, model.kind
//
// Kinds: "tenframe" | "numberline" | "groups" (this file), "array" | "baseten" | "partwhole" (models-grid.js).
// `spec` holds what does not change (limits, labels, which controls exist, `state` = the first state, `steps`);
// the state is what the learner changes. onChange(state, { by: "pointer"|"keyboard"|"button", action }) fires
// only for the learner's own actions. Pointer AND keyboard reach every action; buttons are >= 44px.
import { mountArray, mountBaseten, mountPartwhole } from "./models-grid.js";
import { tr } from "./strategies-kit.js";

const SVG = "http://www.w3.org/2000/svg";
let uid = 0;

function apply(el, props) {
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === "text") el.textContent = v;
    else el.setAttribute(k, v === true ? "" : String(v));
  }
  return el;
}
export const h = (tag, props, ...kids) => {
  const el = apply(document.createElement(tag), props);
  el.append(...kids.flat().filter((k) => k != null));
  return el;
};
export const s = (tag, props, ...kids) => {
  const el = apply(document.createElementNS(SVG, tag), props);
  el.append(...kids.flat().filter((k) => k != null));
  return el;
};
export const bandOf = (grade) => {
  const g = Number(grade);
  if (grade == null || !Number.isFinite(g)) return "middle";
  return g <= 2 ? "early" : g <= 4 ? "middle" : g <= 6 ? "upper" : "teen";
};
export const clone = (o) => JSON.parse(JSON.stringify(o));
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Pointer position in drawing units, for a drawing of known size (viewBox 0 0 w h, xMidYMid meet).
export function svgPoint(svg, e, view) {
  const r = svg.getBoundingClientRect();
  if (!r.width || !r.height || !view) return null;
  const k = Math.min(r.width / view.w, r.height / view.h);
  return {
    x: (e.clientX - r.left - (r.width - view.w * k) / 2) / k,
    y: (e.clientY - r.top - (r.height - view.h * k) / 2) / k,
  };
}

// The frame every model sits in: stage (drawing), readout, controls, a polite live region and key help.
export function shell(kind, host, spec, opts, { label, help }) {
  const reduced =
    opts.reducedMotion ??
    (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches);
  const id = `mby-${++uid}`;
  const stage = h("div", {
    class: "mby-stage",
    tabindex: spec.locked ? null : "0",
    role: spec.locked ? "img" : "application",
    "aria-label": label,
    "aria-describedby": `${id}-help`,
  });
  const readout = h("p", { class: "mby-readout", "aria-hidden": "true" });
  const controls = h("div", {
    class: "mby-controls",
    role: "group",
    "aria-label": tr("Model controls"),
  });
  const live = h("p", {
    class: "mby-sr",
    role: "status",
    "aria-live": "polite",
    "aria-atomic": "true",
  });
  const root = h(
    "div",
    {
      class: `mby-m mby-${kind}`,
      "data-kind": kind,
      "data-band": bandOf(opts.grade),
      "data-reduced": reduced ? "1" : "0",
      "data-locked": spec.locked ? "1" : "0",
    },
    stage,
    readout,
    controls,
    live,
    h("p", { class: "mby-sr", id: `${id}-help`, text: help }),
  );
  host.append(root);
  const cleanups = [];
  const timers = new Set();
  const on = (el, type, fn, o) => {
    el.addEventListener(type, fn, o);
    cleanups.push(() => el.removeEventListener(type, fn, o));
  };
  const later = (fn, ms) => {
    const t = setTimeout(() => (timers.delete(t), fn()), ms);
    timers.add(t);
  };
  const sh = {
    root,
    stage,
    readout,
    controls,
    live,
    reduced,
    on,
    later,
    locked: !!spec.locked,
    band: bandOf(opts.grade),
    announce(text) {
      live.textContent = "";
      live.textContent = text;
    },
    button(text, handler, { cls = "", aria } = {}) {
      const b = h("button", {
        type: "button",
        class: `mby-btn ${cls}`.trim(),
        "aria-label": aria,
        text,
      });
      on(b, "click", handler);
      controls.append(b);
      return b;
    },
    // Narrow hosts stack the drawing so its targets stay >= 44px; `relayout()` runs when that changes.
    watchWidth(relayout) {
      const narrow = () => (host.clientWidth || 9999) < 520;
      let stacked = narrow();
      if (typeof ResizeObserver === "function") {
        const ro = new ResizeObserver(
          () => narrow() !== stacked && ((stacked = narrow()), relayout()),
        );
        ro.observe(host);
        cleanups.push(() => ro.disconnect());
      }
      return () => stacked;
    },
    destroy() {
      for (const f of cleanups) f();
      for (const t of timers) clearTimeout(t);
      root.remove();
    },
    // Wrap the pieces a model supplies into the shared return value.
    api(spec, { get, set, hl, lock }) {
      return {
        kind,
        root,
        getState: () => clone(get()),
        setState: (next) => set(clone(next)),
        setHighlight: (tokens) => hl(tokens || []),
        setLocked(v) {
          sh.locked = !!v;
          root.dataset.locked = v ? "1" : "0";
          stage.setAttribute("role", v ? "img" : "application");
          if (v) stage.removeAttribute("tabindex");
          else stage.setAttribute("tabindex", "0");
          lock?.(!!v);
        },
        flash(type) {
          root.dataset.flash = type;
          later(() => delete root.dataset.flash, 1100);
        },
        play(i) {
          const step = spec.steps?.[i];
          if (!step) return false;
          set(clone(step.state));
          hl(step.hl || []);
          if (step.say) sh.announce(step.say);
          return true;
        },
        announce: sh.announce,
        destroy: sh.destroy,
      };
    },
  };
  return sh;
}

// ======================================================================================================
// Ten-frame: counters of two kinds (kind 1 / kind 2) in one or two frames of ten.
//   spec: { frames: 1|2, adjust: "free"|"move"|"none", kindByFrame, names:[a,b], state:{cells}, steps }
//   state: { cells: number[10 * frames] }  0 empty, 1 / 2 counter kind
//   hl tokens: "cell:12", "frame:1"
// ======================================================================================================
const CELL = { early: 56, middle: 48, upper: 44, teen: 40 };

export function mountTenframe(host, spec = {}, opts = {}) {
  const frames = spec.frames === 2 ? 2 : 1;
  const mode = ["move", "none"].includes(spec.adjust) ? spec.adjust : "free";
  const sh = shell("tenframe", host, { ...spec, locked: spec.locked || mode === "none" }, opts, {
    label: tr("Ten-frame"),
    help: tr(
      "Arrow keys move around the frames. Space picks up a counter, then puts it down on an empty space. In free mode Space on an empty space adds a counter and Delete takes one away.",
    ),
  });
  const names = spec.names || [tr("teal counter"), tr("amber counter")];
  const norm = (c) =>
    Array.from({ length: 10 * frames }, (_, i) => (c?.[i] === 1 || c?.[i] === 2 ? c[i] : 0));
  let state = { cells: norm(spec.state?.cells) };
  let hl = new Set();
  let cur = 0;
  let held = null;
  let tokens = [];
  let nextId = 0;
  const cs = CELL[sh.band];
  const stacked = sh.watchWidth(() => draw());
  const svg = s("svg", {
    class: "mby-svg",
    role: "presentation",
    focusable: "false",
    preserveAspectRatio: "xMidYMid meet",
  });
  const layer = s("g", { class: "mby-static" });
  const tokLayer = s("g", { class: "mby-tokens" });
  svg.append(layer, tokLayer);
  sh.stage.append(svg);
  let view = { w: 0, h: 0 };

  const geometry = () => {
    const fw = 5 * cs,
      fh = 2 * cs,
      pad = 14,
      gap = cs * 0.8,
      label = 26;
    const stack = frames === 2 && stacked();
    const origin = (f) =>
      stack ? { x: pad, y: pad + f * (fh + gap + label) } : { x: pad + f * (fw + gap), y: pad };
    view = stack
      ? { w: fw + pad * 2, h: pad * 2 + frames * (fh + label) + gap * (frames - 1) }
      : { w: pad * 2 + frames * fw + (frames - 1) * gap, h: pad * 2 + fh + label };
    return { fw, fh, origin };
  };
  const cellXY = (i, g) => {
    const f = Math.floor(i / 10),
      k = i % 10,
      o = g.origin(f);
    return { x: o.x + (k % 5) * cs + cs / 2, y: o.y + Math.floor(k / 5) * cs + cs / 2 };
  };
  const countOf = (f) => state.cells.slice(f * 10, f * 10 + 10).filter(Boolean).length;
  const describe = () =>
    frames === 1
      ? tr("Ten-frame with {n} counters.", { n: countOf(0) })
      : tr("Two ten-frames. Frame 1 has {a} counters. Frame 2 has {b} counters.", {
          a: countOf(0),
          b: countOf(1),
        });
  const where = (i) => {
    const f = Math.floor(i / 10),
      k = i % 10;
    return tr("Frame {f}, row {r}, space {c}", {
      f: f + 1,
      r: Math.floor(k / 5) + 1,
      c: (k % 5) + 1,
    });
  };

  function draw() {
    const g = geometry();
    svg.setAttribute("viewBox", `0 0 ${view.w} ${view.h}`);
    layer.replaceChildren();
    for (let f = 0; f < frames; f += 1) {
      const o = g.origin(f);
      layer.append(
        s("rect", {
          class: "mby-frame",
          "data-hl": `frame:${f}`,
          x: o.x - 3,
          y: o.y - 3,
          width: g.fw + 6,
          height: g.fh + 6,
          rx: 8,
        }),
      );
      layer.append(
        s("text", {
          class: "mby-count",
          x: o.x + g.fw / 2,
          y: o.y + g.fh + 22,
          "text-anchor": "middle",
          text: String(countOf(f)),
        }),
      );
    }
    for (let i = 0; i < 10 * frames; i += 1) {
      const p = cellXY(i, g);
      layer.append(
        s("rect", {
          class: "mby-cell",
          "data-cell": i,
          "data-hl": `cell:${i}`,
          x: p.x - cs / 2,
          y: p.y - cs / 2,
          width: cs,
          height: cs,
        }),
      );
    }
    const c = cellXY(cur, g);
    layer.append(
      s("rect", {
        class: "mby-cursor",
        x: c.x - cs / 2 + 2,
        y: c.y - cs / 2 + 2,
        width: cs - 4,
        height: cs - 4,
        rx: 6,
        "data-show": sh.locked ? "0" : "1",
      }),
    );
    reconcile(g);
    paintHl();
    sh.readout.textContent =
      frames === 1 ? "" : `${tr("Frame 1")}: ${countOf(0)}   ${tr("Frame 2")}: ${countOf(1)}`;
    sh.stage.setAttribute("aria-label", describe());
  }
  function makeToken(kind) {
    const r = cs * 0.36;
    const el = s(
      "g",
      { class: "mby-tok", "data-kind": kind },
      s("circle", { r }),
      kind === 2 ? s("circle", { class: "mby-ring", r: r * 0.45 }) : null,
    );
    tokLayer.append(el);
    return el;
  }
  function reconcile(g) {
    const want = state.cells;
    const keep = new Map();
    const free = [];
    for (const tk of tokens)
      want[tk.cell] === tk.kind && !keep.has(tk.cell) ? keep.set(tk.cell, tk) : free.push(tk);
    const next = [];
    for (let i = 0; i < want.length; i += 1) {
      if (!want[i]) continue;
      let tk = keep.get(i);
      if (!tk) {
        let best = -1;
        free.forEach(
          (f, j) =>
            f.kind === want[i] &&
            (best < 0 || Math.abs(f.cell - i) < Math.abs(free[best].cell - i)) &&
            (best = j),
        );
        if (best >= 0) tk = free.splice(best, 1)[0];
        else {
          tk = { id: ++nextId, kind: want[i], el: makeToken(want[i]), fresh: true };
        }
        tk.cell = i;
      }
      const p = cellXY(i, g);
      tk.el.style.transform = `translate(${p.x}px, ${p.y}px)`;
      tk.el.dataset.cell = i;
      tk.el.classList.toggle("is-held", held === i);
      if (tk.fresh) {
        tk.fresh = false;
        tk.el.classList.add("is-new");
        sh.later(() => tk.el.classList.remove("is-new"), 400);
      }
      next.push(tk);
    }
    for (const f of free) {
      f.el.classList.add("is-gone");
      sh.later(() => f.el.remove(), sh.reduced ? 0 : 260);
    }
    tokens = next;
  }
  function paintHl() {
    for (const el of svg.querySelectorAll("[data-hl]"))
      el.classList.toggle("is-hl", hl.has(el.dataset.hl));
  }
  const emit = (by, action, message) => {
    draw();
    sh.announce(message || describe());
    opts.onChange?.(clone(state), { by, action });
  };
  const firstEmpty = (f) => state.cells.findIndex((v, i) => i >= f * 10 && i < f * 10 + 10 && !v);
  const lastFilled = (f) => {
    for (let i = f * 10 + 9; i >= f * 10; i -= 1) if (state.cells[i]) return i;
    return -1;
  };
  const kindFor = (cell) =>
    spec.kindByFrame ? Math.floor(cell / 10) + 1 : spec.kind === 2 ? 2 : 1;

  function addTo(f, by) {
    const i = firstEmpty(f);
    if (sh.locked || mode !== "free") return;
    if (i < 0) return sh.announce(tr("That frame is full."));
    state.cells[i] = kindFor(i);
    emit(
      by,
      "add",
      tr("Added a counter to frame {f}. It now has {n}.", { f: f + 1, n: countOf(f) }),
    );
  }
  function takeFrom(f, by) {
    const i = lastFilled(f);
    if (sh.locked || mode !== "free") return;
    if (i < 0) return sh.announce(tr("That frame is empty."));
    state.cells[i] = 0;
    emit(
      by,
      "remove",
      tr("Took a counter from frame {f}. It now has {n}.", { f: f + 1, n: countOf(f) }),
    );
  }
  function moveCounter(from, to, by) {
    if (sh.locked || state.cells[from] === 0 || state.cells[to] !== 0 || from === to) return false;
    state.cells[to] = state.cells[from];
    state.cells[from] = 0;
    held = null;
    emit(
      by,
      "move",
      tr("Moved a counter to frame {f}. Frame 1 has {a}, frame 2 has {b}.", {
        f: Math.floor(to / 10) + 1,
        a: countOf(0),
        b: frames > 1 ? countOf(1) : 0,
      }),
    );
    return true;
  }
  function shift(toFrame, by) {
    const from = toFrame === 0 ? 1 : 0;
    const src = lastFilled(from);
    const dst = firstEmpty(toFrame);
    if (src < 0) return sh.announce(tr("Frame {f} has no counters to move.", { f: from + 1 }));
    if (dst < 0) return sh.announce(tr("Frame {f} is full.", { f: toFrame + 1 }));
    moveCounter(src, dst, by);
  }
  // Space / Enter on the focused space.
  function activate(by) {
    if (sh.locked) return;
    const filled = state.cells[cur] !== 0;
    if (held !== null) {
      if (held === cur) {
        held = null;
        draw();
        return sh.announce(tr("Put the counter back."));
      }
      if (!filled) return void moveCounter(held, cur, by);
      return sh.announce(tr("That space is full. Choose an empty space."));
    }
    if (filled) {
      held = cur;
      draw();
      return sh.announce(tr("Picked up a counter. Move to an empty space and press Space."));
    }
    if (mode === "free") {
      state.cells[cur] = kindFor(cur);
      emit(by, "add", tr("Added a counter. {where}", { where: where(cur) }));
    } else sh.announce(tr("That space is empty. Pick up a counter first."));
  }
  const nav = (key) => {
    const f = Math.floor(cur / 10),
      k = cur % 10,
      r = Math.floor(k / 5),
      c = k % 5;
    let nf = f,
      nr = r,
      nc = c;
    if (key === "ArrowRight") c < 4 ? (nc += 1) : f < frames - 1 && ((nf += 1), (nc = 0));
    if (key === "ArrowLeft") c > 0 ? (nc -= 1) : f > 0 && ((nf -= 1), (nc = 4));
    if (key === "ArrowDown") r < 1 ? (nr += 1) : f < frames - 1 && ((nf += 1), (nr = 0));
    if (key === "ArrowUp") r > 0 ? (nr -= 1) : f > 0 && ((nf -= 1), (nr = 1));
    cur = nf * 10 + nr * 5 + nc;
  };
  sh.on(sh.stage, "keydown", (e) => {
    if (sh.locked) return;
    if (e.key.startsWith("Arrow")) {
      e.preventDefault();
      nav(e.key);
      draw();
      sh.announce(
        `${where(cur)}: ${state.cells[cur] ? names[state.cells[cur] - 1] : tr("empty")}${held === cur ? `, ${tr("picked up")}` : ""}`,
      );
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      activate("keyboard");
    } else if (
      (e.key === "Delete" || e.key === "Backspace") &&
      mode === "free" &&
      state.cells[cur]
    ) {
      e.preventDefault();
      state.cells[cur] = 0;
      emit("keyboard", "remove");
    } else if (e.key === "Escape" && held !== null) {
      held = null;
      draw();
    }
  });
  // Pointer: drag a counter to an empty space; in free mode tap an empty space to add, a counter to take it away.
  let drag = null;
  const cellAt = (e) => {
    const p = svgPoint(svg, e, view);
    if (!p) return -1;
    const g = geometry();
    for (let i = 0; i < 10 * frames; i += 1) {
      const c = cellXY(i, g);
      if (Math.abs(p.x - c.x) <= cs / 2 && Math.abs(p.y - c.y) <= cs / 2) return i;
    }
    return -1;
  };
  sh.on(svg, "pointerdown", (e) => {
    if (sh.locked) return;
    const i = cellAt(e);
    if (i < 0) return;
    cur = i;
    sh.stage.focus?.({ preventScroll: true });
    drag = { from: i, moved: false, x: e.clientX, y: e.clientY };
    svg.setPointerCapture?.(e.pointerId);
    draw();
  });
  sh.on(svg, "pointermove", (e) => {
    if (!drag) return;
    if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 8) drag.moved = true;
  });
  sh.on(svg, "pointerup", (e) => {
    if (!drag) return;
    const { from, moved } = drag;
    drag = null;
    const to = cellAt(e);
    if (moved && to >= 0 && to !== from && state.cells[from])
      return void moveCounter(from, to, "pointer");
    if (to !== from || sh.locked) return;
    if (mode !== "free") return;
    state.cells[from] = state.cells[from] ? 0 : kindFor(from);
    emit("pointer", state.cells[from] ? "add" : "remove");
  });
  sh.on(svg, "pointercancel", () => (drag = null));

  const buildControls = () => {
    sh.controls.replaceChildren();
    if (sh.locked || mode === "none") return;
    if (mode === "free") {
      for (let f = 0; f < frames; f += 1) {
        sh.button(frames === 1 ? tr("Add a counter") : tr("Add to frame {f}", { f: f + 1 }), () =>
          addTo(f, "button"),
        );
        sh.button(
          frames === 1 ? tr("Take one away") : tr("Take one from frame {f}", { f: f + 1 }),
          () => takeFrom(f, "button"),
          { cls: "mby-ghost" },
        );
      }
    } else if (frames === 2) {
      sh.button(tr("Move one to frame 1"), () => shift(0, "button"));
      sh.button(tr("Move one to frame 2"), () => shift(1, "button"));
    }
  };
  buildControls();
  draw();
  return sh.api(spec, {
    get: () => state,
    set: (next) => {
      if (next.cells) state = { cells: norm(next.cells) };
      held = null;
      draw();
    },
    hl: (tokens) => ((hl = new Set(tokens)), paintHl()),
    lock: () => (buildControls(), draw()),
  });
}

// ======================================================================================================
// Number line: a bead hops along the line. Every hop is drawn and labelled with its size.
//   spec: { min, max, hopSizes:[1], signed, axisLabels:"all"|"start"|"none", state:{start,hops}, steps }
//   state: { start, hops:number[] }   position = start + sum(hops)
//   hl tokens: "tick:10", "hop:0"
// ======================================================================================================
export function mountNumberline(host, spec = {}, opts = {}) {
  const sizes = (spec.hopSizes?.length ? spec.hopSizes : [1]).map(Number);
  const sh = shell("numberline", host, spec, opts, {
    label: tr("Number line"),
    help: tr(
      "Right arrow makes a hop. Left arrow or Backspace undoes the last hop. Home starts over.",
    ),
  });
  const lo = spec.min ?? 0;
  const hi = spec.max ?? 20;
  let state = { start: spec.state?.start ?? lo, hops: [...(spec.state?.hops || [])] };
  let hl = new Set();
  let fresh = false;
  const W = 640,
    H = 210,
    padL = 34,
    base = 138;
  const x = (v) => padL + ((v - lo) / (hi - lo)) * (W - padL * 2);
  const pos = () => state.start + state.hops.reduce((a, b) => a + b, 0);
  const svg = s("svg", {
    class: "mby-svg",
    role: "presentation",
    focusable: "false",
    viewBox: `0 0 ${W} ${H}`,
    preserveAspectRatio: "xMidYMid meet",
  });
  const layer = s("g");
  const bead = s(
    "g",
    { class: "mby-bead" },
    s("circle", { r: 13 }),
    s("circle", { class: "mby-bead-dot", r: 4 }),
  );
  svg.append(layer, bead);
  sh.stage.append(svg);
  const labelled = (v) => {
    const mode = spec.axisLabels || "all";
    if (mode === "none") return false;
    if (mode === "start") return v === state.start;
    return hi - lo <= 20 || v % 5 === 0 || v === state.start;
  };
  const describe = () =>
    state.hops.length
      ? tr("Number line. Started at {a}. {n} hops. Now at {p}.", {
          a: state.start,
          n: state.hops.length,
          p: pos(),
        })
      : tr("Number line. Standing at {a}. No hops yet.", { a: state.start });
  function draw() {
    layer.replaceChildren();
    layer.append(
      s("line", { class: "mby-axis", x1: padL - 10, x2: W - padL + 10, y1: base, y2: base }),
    );
    const marks = new Map();
    let at = state.start;
    state.hops.forEach((hop) => marks.set((at += hop), true));
    for (let v = lo; v <= hi; v += 1) {
      const landing = marks.has(v);
      layer.append(
        s("line", {
          class: "mby-tick",
          "data-hl": `tick:${v}`,
          x1: x(v),
          x2: x(v),
          y1: base - (landing ? 12 : 8),
          y2: base + (landing ? 12 : 8),
        }),
      );
      if (labelled(v) || (landing && spec.landings !== false))
        layer.append(
          s("text", {
            class: `mby-num${landing ? " is-landing" : ""}`,
            x: x(v),
            y: base + 38,
            "text-anchor": "middle",
            text: String(v),
          }),
        );
    }
    let from = state.start;
    state.hops.forEach((hop, i) => {
      const to = from + hop;
      const a = x(from),
        b = x(to),
        top = base - Math.min(86, Math.abs(b - a) * 0.5 + 18);
      const newest = fresh && i === state.hops.length - 1;
      layer.append(
        s("path", {
          class: `mby-arc${newest ? " is-new" : ""}`,
          "data-hl": `hop:${i}`,
          d: `M${a},${base - 6} Q${(a + b) / 2},${top - 18} ${b},${base - 6}`,
        }),
      );
      layer.append(
        s("text", {
          class: "mby-hoplabel",
          "data-hl": `hop:${i}`,
          x: (a + b) / 2,
          y: top - 4,
          "text-anchor": "middle",
          text: `${hop > 0 ? "+" : "−"}${Math.abs(hop)}`,
        }),
      );
      from = to;
    });
    bead.style.transform = `translate(${x(pos())}px, ${base - 24}px)`;
    paintHl();
    sh.stage.setAttribute("aria-label", describe());
    for (const b of sh.controls.querySelectorAll("button"))
      b.disabled = sh.locked
        ? true
        : b.dataset.act === "undo"
          ? !state.hops.length
          : b.dataset.act === "reset"
            ? !state.hops.length
            : pos() + Number(b.dataset.size) > hi || pos() + Number(b.dataset.size) < lo;
    fresh = false;
  }
  function paintHl() {
    for (const el of svg.querySelectorAll("[data-hl]"))
      el.classList.toggle("is-hl", hl.has(el.dataset.hl));
  }
  const emit = (by, action, message) => {
    draw();
    sh.announce(message);
    opts.onChange?.(clone(state), { by, action });
  };
  function hop(size, by) {
    if (sh.locked) return;
    const target = pos() + size;
    if (target > hi || target < lo) {
      sh.flash("no");
      return sh.announce(tr("The line ends here. You cannot hop past it."));
    }
    state.hops.push(size);
    fresh = true;
    emit(
      by,
      "hop",
      tr("Hop {n} of size {s}. Now at {p}.", { n: state.hops.length, s: Math.abs(size), p: pos() }),
    );
  }
  function undo(by) {
    if (sh.locked || !state.hops.length) return;
    state.hops.pop();
    emit(by, "undo", tr("Undid the last hop. Now at {p}.", { p: pos() }));
  }
  function reset(by) {
    if (sh.locked || !state.hops.length) return;
    state.hops = [];
    emit(by, "reset", tr("Back at the start, {a}.", { a: state.start }));
  }
  sh.on(sh.stage, "keydown", (e) => {
    if (sh.locked) return;
    const k = e.key;
    if (k === "ArrowRight" || k === "ArrowUp") (e.preventDefault(), hop(sizes[0], "keyboard"));
    else if (k === "ArrowLeft" || k === "ArrowDown" || k === "Backspace" || k === "Delete")
      (e.preventDefault(),
        spec.signed && k.startsWith("Arrow") ? hop(-sizes[0], "keyboard") : undo("keyboard"));
    else if (k === "Home") (e.preventDefault(), reset("keyboard"));
  });
  sh.on(svg, "click", (e) => {
    if (sh.locked) return;
    const p = svgPoint(svg, e, { w: W, h: H });
    if (!p) return;
    const v = clamp(Math.round(lo + ((p.x - padL) / (W - padL * 2)) * (hi - lo)), lo, hi);
    const d = v - pos();
    if (d && (sizes.includes(d) || (spec.signed && sizes.includes(-d)))) hop(d, "pointer");
    else {
      sh.flash("no");
      sh.announce(tr("Hops here are {sizes}.", { sizes: sizes.join(", ") }));
    }
  });
  const buildControls = () => {
    sh.controls.replaceChildren();
    if (sh.locked) return;
    for (const size of sizes) {
      const b = sh.button(tr("Hop +{s}", { s: size }), () => hop(size, "button"), {
        aria: tr("Hop forward {s}", { s: size }),
      });
      Object.assign(b.dataset, { act: "hop", size });
      if (spec.signed)
        Object.assign(
          sh.button(tr("Hop −{s}", { s: size }), () => hop(-size, "button"), {
            aria: tr("Hop back {s}", { s: size }),
          }).dataset,
          { act: "hop", size: -size },
        );
    }
    sh.button(tr("Undo hop"), () => undo("button"), { cls: "mby-ghost" }).dataset.act = "undo";
    sh.button(tr("Start over"), () => reset("button"), { cls: "mby-ghost" }).dataset.act = "reset";
  };
  buildControls();
  draw();
  return sh.api(spec, {
    get: () => state,
    set: (next) => {
      state = { start: next.start ?? state.start, hops: [...(next.hops ?? state.hops)] };
      draw();
    },
    hl: (tokens) => ((hl = new Set(tokens)), paintHl()),
    lock: () => (buildControls(), draw()),
  });
}

// ======================================================================================================
// Equal groups: plates with counters on them (0 groups, groups of 0, groups of 1 all draw honestly).
//   spec: { maxPlates, maxPer, state:{plates}, steps }
//   state: { plates: number[] }   counters on each plate
//   hl tokens: "plate:2"
// ======================================================================================================
export function mountGroups(host, spec = {}, opts = {}) {
  const sh = shell("groups", host, spec, opts, {
    label: tr("Equal groups"),
    help: tr(
      "Left and right arrows choose a group. Up arrow adds a counter to it and down arrow takes one away. Plus adds a group and minus takes one away.",
    ),
  });
  const maxPlates = spec.maxPlates ?? 12;
  const maxPer = spec.maxPer ?? 12;
  let state = { plates: [...(spec.state?.plates || [])] };
  let hl = new Set();
  let cur = 0;
  const svg = s("svg", {
    class: "mby-svg",
    role: "presentation",
    focusable: "false",
    preserveAspectRatio: "xMidYMid meet",
  });
  const layer = s("g");
  svg.append(layer);
  sh.stage.append(svg);
  let view = { w: 0, h: 0 };
  const D = 96,
    perRow = 6;
  const describe = () =>
    state.plates.length
      ? tr("{n} groups: {list}.", { n: state.plates.length, list: state.plates.join(", ") })
      : tr("No groups on the table.");
  function draw() {
    const rows = Math.max(1, Math.ceil(state.plates.length / perRow));
    const cols = Math.max(2, Math.min(perRow, state.plates.length));
    view = { w: cols * D + 20, h: rows * (D + 30) + 20 };
    svg.setAttribute("viewBox", `0 0 ${view.w} ${view.h}`);
    layer.replaceChildren();
    if (!state.plates.length)
      layer.append(
        s("text", {
          class: "mby-empty",
          x: view.w / 2,
          y: view.h / 2,
          "text-anchor": "middle",
          text: tr("No groups"),
        }),
      );
    state.plates.forEach((n, i) => {
      const cx = 10 + (i % perRow) * D + D / 2,
        cy = 10 + Math.floor(i / perRow) * (D + 30) + D / 2;
      layer.append(
        s("circle", {
          class: `mby-plate${n === 0 ? " is-empty" : ""}${!sh.locked && i === cur ? " is-cur" : ""}`,
          "data-plate": i,
          "data-hl": `plate:${i}`,
          cx,
          cy,
          r: D / 2 - 6,
        }),
      );
      for (let j = 0; j < Math.min(n, 30); j += 1) {
        const px = cx + ((j % 4) - 1.5) * 15,
          py = cy + (Math.floor(j / 4) - 1) * 15;
        layer.append(s("circle", { class: "mby-dot", cx: px, cy: py + 4, r: 6 }));
      }
      layer.append(
        s("text", {
          class: "mby-count",
          x: cx,
          y: cy + D / 2 + 14,
          "text-anchor": "middle",
          text: String(n),
        }),
      );
    });
    paintHl();
    sh.readout.textContent = "";
    sh.stage.setAttribute("aria-label", describe());
    for (const b of sh.controls.querySelectorAll("button")) {
      const a = b.dataset.act;
      b.disabled =
        sh.locked ||
        (a === "addPlate" && state.plates.length >= maxPlates) ||
        (a === "removePlate" && !state.plates.length) ||
        (a === "addEach" && (!state.plates.length || Math.max(...state.plates) >= maxPer)) ||
        (a === "removeEach" && (!state.plates.length || Math.min(...state.plates) <= 0));
    }
  }
  function paintHl() {
    for (const el of svg.querySelectorAll("[data-hl]"))
      el.classList.toggle("is-hl", hl.has(el.dataset.hl));
  }
  const emit = (by, action, message) => {
    draw();
    sh.announce(message || describe());
    opts.onChange?.(clone(state), { by, action });
  };
  const act = {
    addPlate: (by) =>
      state.plates.length < maxPlates &&
      (state.plates.push(0),
      (cur = state.plates.length - 1),
      emit(by, "addPlate", tr("Added a group. There are {n}.", { n: state.plates.length }))),
    removePlate: (by) =>
      state.plates.length &&
      (state.plates.pop(),
      (cur = Math.max(0, Math.min(cur, state.plates.length - 1))),
      emit(by, "removePlate", tr("Took a group away. There are {n}.", { n: state.plates.length }))),
    addEach: (by) =>
      state.plates.length &&
      Math.max(...state.plates) < maxPer &&
      ((state.plates = state.plates.map((n) => n + 1)), emit(by, "addEach")),
    removeEach: (by) =>
      state.plates.length &&
      Math.min(...state.plates) > 0 &&
      ((state.plates = state.plates.map((n) => n - 1)), emit(by, "removeEach")),
    addOne: (by, i = cur) =>
      state.plates[i] != null &&
      state.plates[i] < maxPer &&
      ((state.plates[i] += 1),
      (cur = i),
      emit(by, "addOne", tr("Group {g} has {n}.", { g: i + 1, n: state.plates[i] }))),
    removeOne: (by, i = cur) =>
      state.plates[i] > 0 &&
      ((state.plates[i] -= 1),
      (cur = i),
      emit(by, "removeOne", tr("Group {g} has {n}.", { g: i + 1, n: state.plates[i] }))),
  };
  sh.on(sh.stage, "keydown", (e) => {
    if (sh.locked) return;
    const k = e.key;
    if (k === "ArrowRight" || k === "ArrowLeft") {
      e.preventDefault();
      cur = clamp(cur + (k === "ArrowRight" ? 1 : -1), 0, Math.max(0, state.plates.length - 1));
      draw();
      sh.announce(tr("Group {g} has {n}.", { g: cur + 1, n: state.plates[cur] ?? 0 }));
    } else if (k === "ArrowUp")
      (e.preventDefault(), e.shiftKey ? act.addEach("keyboard") : act.addOne("keyboard"));
    else if (k === "ArrowDown")
      (e.preventDefault(), e.shiftKey ? act.removeEach("keyboard") : act.removeOne("keyboard"));
    else if (k === "+" || k === "=") (e.preventDefault(), act.addPlate("keyboard"));
    else if (k === "-" || k === "_") (e.preventDefault(), act.removePlate("keyboard"));
  });
  sh.on(svg, "click", (e) => {
    if (sh.locked) return;
    const t = e.target.closest?.("[data-plate]");
    if (t) act.addOne("pointer", Number(t.dataset.plate));
  });
  const buildControls = () => {
    sh.controls.replaceChildren();
    if (sh.locked) return;
    for (const [id, label] of [
      ["addPlate", tr("Add a group")],
      ["removePlate", tr("Take a group away")],
      ["addEach", tr("Add 1 to every group")],
      ["removeEach", tr("Take 1 from every group")],
    ]) {
      sh.button(label, () => act[id]("button"), {
        cls: id.startsWith("remove") ? "mby-ghost" : "",
      }).dataset.act = id;
    }
  };
  buildControls();
  draw();
  return sh.api(spec, {
    get: () => state,
    set: (next) => {
      state = { plates: [...(next.plates ?? state.plates)] };
      cur = clamp(cur, 0, Math.max(0, state.plates.length - 1));
      draw();
    },
    hl: (tokens) => ((hl = new Set(tokens)), paintHl()),
    lock: () => (buildControls(), draw()),
  });
}

export const MODEL_KINDS = Object.freeze([
  "tenframe",
  "numberline",
  "groups",
  "array",
  "baseten",
  "partwhole",
]);
export function mountModel(kind, host, spec = {}, opts = {}) {
  const factory = {
    tenframe: mountTenframe,
    numberline: mountNumberline,
    groups: mountGroups,
    array: mountArray,
    baseten: mountBaseten,
    partwhole: mountPartwhole,
  }[kind];
  if (!factory) throw new TypeError(`Unknown model kind: ${kind}`);
  return factory(host, spec || {}, opts || {});
}

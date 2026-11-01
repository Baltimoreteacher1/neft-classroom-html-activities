// Array, base-ten blocks and part-whole bar models. Same API as models.js (see its header); mounted through
// mountModel(kind, ...). Imports the shared shell from models.js (an ES cycle that is safe: only functions are
// used after both modules have loaded).
import { clamp, clone, h, s, shell, svgPoint } from "./models.js";
import { tr } from "./strategies-kit.js";

const paint = (svg, hl) => {
  for (const el of svg.querySelectorAll("[data-hl]"))
    el.classList.toggle("is-hl", hl.has(el.dataset.hl));
};
const stepper = (sh, label, get, change, id) => {
  const wrap = h("div", {
    class: "mby-stepper",
    role: "group",
    "aria-label": label,
    "data-stepper": id,
  });
  const value = h("span", { class: "mby-stepval", "aria-live": "off" });
  const minus = h("button", {
    type: "button",
    class: "mby-btn mby-step",
    "aria-label": tr("{label}: one fewer", { label }),
    text: "−",
  });
  const plus = h("button", {
    type: "button",
    class: "mby-btn mby-step",
    "aria-label": tr("{label}: one more", { label }),
    text: "+",
  });
  sh.on(minus, "click", () => change(-1));
  sh.on(plus, "click", () => change(1));
  wrap.append(h("span", { class: "mby-steplabel", text: label }), minus, value, plus);
  sh.controls.append(wrap);
  return () => {
    value.textContent = String(get());
    minus.disabled = plus.disabled = sh.locked;
  };
};

// ======================================================================================================
// Array: rows x columns of counters. Skip-count labels, a cut (add / remove), cut-and-slide, and turn.
//   spec: { maxRows, maxCols, adjust:"none"|"size"|"cols"|"size+split", splitMode:"add"|"remove",
//           allowFold, allowTurn, total, extent:{rows,cols}, state, steps }
//   state: { rows, cols, split, cut, folded, turned, counted, reveal }
//   hl tokens: "row:2", "col:9", "part:left", "part:right"
// ======================================================================================================
const AC = { early: 38, middle: 32, upper: 28, teen: 26 };

export function mountArray(host, spec = {}, opts = {}) {
  const adjust = spec.adjust || "none";
  const sh = shell("array", host, { ...spec, locked: spec.locked || adjust === "none" }, opts, {
    label: tr("Array"),
    help: tr(
      "Down and up arrows add or take away a row. Right and left arrows add or take away a column. Shift with right or left arrow moves the cut. F cuts in half and slides. T turns the array.",
    ),
  });
  const maxR = spec.maxRows ?? 10,
    maxC = spec.maxCols ?? 10;
  const norm = (st = {}) => ({
    rows: st.rows ?? 1,
    cols: st.cols ?? 1,
    split: st.split ?? 0,
    cut: !!st.cut,
    folded: !!st.folded,
    turned: !!st.turned,
    counted: st.counted ?? 0,
    reveal: !!st.reveal,
  });
  let state = norm(spec.state);
  let hl = new Set();
  const cs = AC[sh.band];
  const svg = s("svg", {
    class: "mby-svg",
    role: "presentation",
    focusable: "false",
    preserveAspectRatio: "xMidYMid meet",
  });
  const ghost = s("g", { class: "mby-ghosts" });
  const dotLayer = s("g", { class: "mby-dots" });
  const labels = s("g", { class: "mby-runs" });
  svg.append(ghost, dotLayer, labels);
  sh.stage.append(svg);
  let dots = new Map();
  let view = { w: 0, h: 0 };
  const GAP = 0.45;
  // Where a counter sits, in cells, for the current state.
  const place = (r, c, st) => {
    let gx = c,
      gy = r;
    const half = st.rows / 2;
    if (st.folded && st.rows % 2 === 0) r >= half ? ((gx = c + st.cols), (gy = r - half)) : null;
    let sx = st.split > 0 && c >= st.split ? GAP : 0;
    let sy = (st.cut || st.folded) && st.rows % 2 === 0 && r >= half && !st.folded ? GAP : 0;
    if (st.folded && r >= half) sx += GAP;
    if (st.turned) return { x: gy + sy, y: gx + sx };
    return { x: gx + sx, y: gy + sy };
  };
  const boundsOf = (st) => {
    let w = 0,
      ht = 0;
    for (const [r, c] of [
      [0, 0],
      [st.rows - 1, st.cols - 1],
      [st.rows - 1, 0],
      [0, st.cols - 1],
    ]) {
      if (r < 0 || c < 0) continue;
      const p = place(r, c, st);
      w = Math.max(w, p.x + 1);
      ht = Math.max(ht, p.y + 1);
    }
    return { w, h: ht };
  };
  const ext = { w: 1, h: 1 };
  const grow = (st) => {
    const b = boundsOf(st);
    ext.w = Math.max(ext.w, b.w);
    ext.h = Math.max(ext.h, b.h);
  };
  grow(state);
  for (const step of spec.steps || []) grow(norm(step.state));
  if (spec.extent) grow(norm({ rows: spec.extent.rows, cols: spec.extent.cols }));
  if (adjust !== "none" && spec.ghost !== false)
    ((ext.w = Math.max(ext.w, maxC)), (ext.h = Math.max(ext.h, maxR)));
  if (spec.allowFold) ext.w = Math.max(ext.w, 2 * (spec.state?.cols ?? 1) + 1);
  const total = () => spec.total ?? null;
  const filled = (r, c, st) => (total() == null ? true : r * st.cols + c < total());
  const part = (r, c, st) => {
    if (st.split > 0) return c < st.split ? 1 : 2;
    if ((st.cut || st.folded) && st.rows % 2 === 0) return r < st.rows / 2 ? 1 : 2;
    return 1;
  };
  const describe = () => {
    const { rows, cols } = state;
    const a = state.turned ? cols : rows,
      b = state.turned ? rows : cols;
    if (!rows || !cols) return tr("Empty array.");
    let text = tr("Array with {r} rows of {c}.", { r: a, c: b });
    if (state.split > 0) text += ` ${tr("Cut after column {n}.", { n: state.split })}`;
    if (state.folded) text += ` ${tr("Cut in half and slid next to each other.")}`;
    if (total() != null)
      text += ` ${tr("{n} of {t} counters placed.", { n: Math.min(rows * cols, total()), t: total() })}`;
    if (state.reveal) text += ` ${tr("That is {n} in all.", { n: rows * cols })}`;
    return text;
  };

  function draw() {
    grow(state);
    const pad = 12,
      runW = state.counted > 0 ? 54 : 0;
    view = { w: ext.w * cs + pad * 2 + runW + GAP * cs * 2, h: ext.h * cs + pad * 2 + GAP * cs };
    svg.setAttribute("viewBox", `0 0 ${view.w} ${view.h}`);
    const at = (p) => ({ x: pad + (p.x + 0.5) * cs, y: pad + (p.y + 0.5) * cs });
    ghost.replaceChildren();
    if (adjust !== "none" && spec.ghost !== false && !state.turned && !state.folded) {
      for (let r = 0; r < maxR; r += 1)
        for (let c = 0; c < maxC; c += 1)
          ghost.append(
            s("rect", {
              class: "mby-ghost",
              x: pad + c * cs + 2,
              y: pad + r * cs + 2,
              width: cs - 4,
              height: cs - 4,
              rx: 5,
            }),
          );
    }
    const want = new Set();
    for (let r = 0; r < state.rows; r += 1) {
      for (let c = 0; c < state.cols; c += 1) {
        const key = `${r},${c}`;
        want.add(key);
        let d = dots.get(key);
        if (!d) {
          d = s(
            "g",
            { class: "mby-dot is-new", "data-r": r, "data-c": c },
            s("circle", { r: cs * 0.36 }),
          );
          dots.set(key, d);
          dotLayer.append(d);
          sh.later(() => d.classList.remove("is-new"), 400);
        }
        const p = at(place(r, c, state));
        d.style.transform = `translate(${p.x}px, ${p.y}px)`;
        d.dataset.part = String(part(r, c, state));
        d.classList.toggle("is-over", !filled(r, c, state));
        d.classList.toggle(
          "is-removed",
          spec.splitMode === "remove" &&
            part(r, c, state) === 2 &&
            (state.split > 0 || state.folded),
        );
        d.classList.toggle("is-counted", r < state.counted);
      }
    }
    for (const [key, d] of dots) {
      if (want.has(key)) continue;
      d.classList.add("is-gone");
      sh.later(() => d.remove(), sh.reduced ? 0 : 260);
      dots.delete(key);
    }
    if (sh.reduced) for (const el of dotLayer.querySelectorAll(".is-gone")) el.remove();
    // skip-count labels: the running total at the end of each counted row
    labels.replaceChildren();
    if (state.counted > 0 && !state.turned && !state.folded) {
      for (let r = 0; r < Math.min(state.counted, state.rows); r += 1) {
        const p = at(place(r, state.cols - 1, state));
        labels.append(
          s("text", {
            class: "mby-run",
            "data-hl": `row:${r}`,
            x: p.x + cs * 0.75,
            y: p.y + 6,
            text: String((r + 1) * state.cols),
          }),
        );
      }
    }
    paintDots();
    const a = state.turned ? state.cols : state.rows,
      b = state.turned ? state.rows : state.cols;
    sh.readout.textContent =
      !state.rows || !state.cols
        ? tr("Empty tray")
        : total() != null
          ? tr("{n} of {t} counters placed", {
              n: Math.min(state.rows * state.cols, total()),
              t: total(),
            })
          : `${tr("{r} rows of {c}", { r: a, c: b })}${state.reveal ? ` = ${state.rows * state.cols}` : ""}`;
    sh.stage.setAttribute("aria-label", describe());
    refreshControls();
  }
  function paintDots() {
    for (const d of dots.values()) {
      const r = Number(d.dataset.r),
        c = Number(d.dataset.c),
        p = Number(d.dataset.part);
      const on =
        hl.has(`row:${r}`) ||
        hl.has(`col:${c}`) ||
        (hl.has("part:left") && p === 1) ||
        (hl.has("part:right") && p === 2) ||
        hl.has("all");
      d.classList.toggle("is-hl", on);
    }
    paint(svg, hl);
  }
  let refresh = [];
  const refreshControls = () => refresh.forEach((f) => f());
  const emit = (by, action) => {
    draw();
    sh.announce(describe());
    opts.onChange?.(clone(state), { by, action });
  };
  const setRows = (n, by) => {
    const v = clamp(n, spec.minRows ?? 1, maxR);
    if (v !== state.rows) ((state.rows = v), emit(by, "rows"));
  };
  const setCols = (n, by) => {
    const v = clamp(n, spec.minCols ?? 1, maxC);
    if (v !== state.cols) {
      state.cols = v;
      if (state.split >= v) state.split = 0;
      emit(by, "cols");
    }
  };
  const setSplit = (n, by) => {
    const v = clamp(n, 0, Math.max(0, state.cols - 1));
    if (v !== state.split) ((state.split = v), emit(by, "split"));
  };
  const fold = (on, by) => {
    if (state.rows % 2 !== 0 || state.rows < 2)
      return sh.announce(
        tr("This array has an odd number of rows, so it cannot be cut into two equal halves."),
      );
    state.cut = on;
    state.folded = on;
    emit(by, "fold");
  };
  const turn = (by) => ((state.turned = !state.turned), emit(by, "turn"));
  const canRows = adjust === "size" || adjust === "size+split";
  const canCols = canRows || adjust === "cols";
  const canSplit = adjust === "size+split";
  sh.on(sh.stage, "keydown", (e) => {
    if (sh.locked) return;
    const k = e.key;
    if (k === "ArrowDown" && canRows) (e.preventDefault(), setRows(state.rows + 1, "keyboard"));
    else if (k === "ArrowUp" && canRows) (e.preventDefault(), setRows(state.rows - 1, "keyboard"));
    else if (k === "ArrowRight")
      (e.preventDefault(),
        e.shiftKey && canSplit
          ? setSplit(state.split + 1, "keyboard")
          : canCols && setCols(state.cols + 1, "keyboard"));
    else if (k === "ArrowLeft")
      (e.preventDefault(),
        e.shiftKey && canSplit
          ? setSplit(state.split - 1, "keyboard")
          : canCols && setCols(state.cols - 1, "keyboard"));
    else if ((k === "f" || k === "F") && spec.allowFold)
      (e.preventDefault(), fold(!state.folded, "keyboard"));
    else if ((k === "t" || k === "T") && spec.allowTurn) (e.preventDefault(), turn("keyboard"));
  });
  // Pointer: press or drag to size the array to the space under the finger.
  let down = false;
  const sizeTo = (e) => {
    const p = svgPoint(svg, e, view);
    if (!p || sh.locked || !canCols) return;
    const c = Math.floor((p.x - 12) / cs) + 1,
      r = Math.floor((p.y - 12) / cs) + 1;
    if (c < 1 || r < 1 || c > maxC || r > maxR) return;
    if (canRows) setRows(r, "pointer");
    setCols(c, "pointer");
  };
  sh.on(
    svg,
    "pointerdown",
    (e) => (
      (down = true),
      svg.setPointerCapture?.(e.pointerId),
      sh.stage.focus?.({ preventScroll: true }),
      sizeTo(e)
    ),
  );
  sh.on(svg, "pointermove", (e) => down && sizeTo(e));
  sh.on(svg, "pointerup", () => (down = false));
  sh.on(svg, "pointercancel", () => (down = false));

  const buildControls = () => {
    sh.controls.replaceChildren();
    refresh = [];
    if (sh.locked) return;
    if (canRows)
      refresh.push(
        stepper(
          sh,
          tr("Rows"),
          () => state.rows,
          (d) => setRows(state.rows + d, "button"),
          "rows",
        ),
      );
    if (canCols)
      refresh.push(
        stepper(
          sh,
          tr("Columns"),
          () => state.cols,
          (d) => setCols(state.cols + d, "button"),
          "cols",
        ),
      );
    if (canSplit)
      refresh.push(
        stepper(
          sh,
          tr("Cut after column"),
          () => state.split,
          (d) => setSplit(state.split + d, "button"),
          "split",
        ),
      );
    if (spec.allowFold) {
      const b = sh.button("", () => fold(!state.folded, "button"));
      refresh.push(
        () => (b.textContent = state.folded ? tr("Put it back") : tr("Cut in half and slide")),
      );
    }
    if (spec.allowTurn) {
      const b = sh.button(tr("Turn the array"), () => turn("button"));
      refresh.push(() => b.setAttribute("aria-pressed", state.turned ? "true" : "false"));
    }
  };
  buildControls();
  draw();
  return sh.api(spec, {
    get: () => state,
    set: (next) => {
      state = norm({ ...state, ...next });
      draw();
    },
    hl: (tokens) => ((hl = new Set(tokens)), paintDots()),
    lock: () => (buildControls(), draw()),
  });
}

// ======================================================================================================
// Base-ten blocks: tens rods and ones cubes on one or two mats; "cross out" blocks to take them away.
//   spec: { mats:1|2, adjust, strike, maxTens, maxOnes, state:{mats}, steps }
//   state: { mats: [{ tens, ones, outT, outO }] }
//   hl tokens: "tens:0", "ones:1"
// ======================================================================================================
const BS = { early: 1.2, middle: 1, upper: 0.92, teen: 0.86 };

export function mountBaseten(host, spec = {}, opts = {}) {
  const sh = shell("baseten", host, spec, opts, {
    label: tr("Base-ten blocks"),
    help: tr(
      "Up and down arrows add or take away a tens rod. Right and left arrows add or take away a ones cube. Page Down chooses the next mat. With Shift, the arrows cross out a block.",
    ),
  });
  const count = spec.mats === 2 ? 2 : 1;
  const maxT = spec.maxTens ?? 9,
    maxO = spec.maxOnes ?? 9;
  const normMat = (m = {}) => ({
    tens: clamp(m.tens ?? 0, 0, maxT),
    ones: clamp(m.ones ?? 0, 0, maxO),
    outT: m.outT ?? 0,
    outO: m.outO ?? 0,
  });
  const norm = (st) => ({ mats: Array.from({ length: count }, (_, i) => normMat(st?.mats?.[i])) });
  let state = norm(spec.state);
  let hl = new Set();
  let cur = 0;
  const sc = BS[sh.band];
  const stacked = sh.watchWidth(() => draw());
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
  const MW = 240 * sc,
    MH = 150 * sc,
    GAPX = 24;
  const origin = (i) =>
    count === 2 && stacked()
      ? { x: 10, y: 10 + i * (MH + 44) }
      : { x: 10 + i * (MW + GAPX), y: 10 };
  const left = (m) => ({ t: m.tens - m.outT, o: m.ones - m.outO });
  const describe = () =>
    state.mats
      .map(
        (m, i) =>
          `${tr("Mat {n}: {t} tens and {o} ones", { n: i + 1, t: m.tens, o: m.ones })}${m.outT || m.outO ? `, ${tr("crossed out {t} tens and {o} ones", { t: m.outT, o: m.outO })}` : ""}.`,
      )
      .join(" ");

  function draw() {
    const stack = count === 2 && stacked();
    view = {
      w: stack ? MW + 20 : count * MW + (count - 1) * GAPX + 20,
      h: stack ? count * (MH + 44) + 10 : MH + 44 + 10,
    };
    svg.setAttribute("viewBox", `0 0 ${view.w} ${view.h}`);
    layer.replaceChildren();
    state.mats.forEach((m, i) => {
      const o = origin(i);
      layer.append(
        s("rect", {
          class: `mby-mat${!sh.locked && i === cur && count > 1 ? " is-cur" : ""}`,
          x: o.x,
          y: o.y,
          width: MW,
          height: MH,
          rx: 14,
        }),
      );
      const rw = 13 * sc,
        rh = 104 * sc,
        rgap = 9 * sc;
      for (let t = 0; t < m.tens; t += 1) {
        const struck = t >= m.tens - m.outT;
        const x = o.x + 14 + t * (rw + rgap),
          y = o.y + 16;
        layer.append(
          s(
            "g",
            {
              class: `mby-rod${struck ? " is-struck" : ""}`,
              "data-hl": `tens:${i}`,
              "data-mat": i,
              "data-kind": "t",
            },
            s("rect", { x, y, width: rw, height: rh, rx: 3 }),
            ...Array.from({ length: 9 }, (_, k) =>
              s("line", {
                class: "mby-seg",
                x1: x,
                x2: x + rw,
                y1: y + ((k + 1) * rh) / 10,
                y2: y + ((k + 1) * rh) / 10,
              }),
            ),
            struck
              ? s("line", { class: "mby-cross", x1: x - 3, y1: y + rh, x2: x + rw + 3, y2: y })
              : null,
          ),
        );
      }
      const cw = 13 * sc;
      for (let n = 0; n < m.ones; n += 1) {
        const struck = n >= m.ones - m.outO;
        const x = o.x + MW - 14 - 3 * (cw + 6 * sc) + (n % 3) * (cw + 6 * sc),
          y = o.y + 16 + Math.floor(n / 3) * (cw + 6 * sc);
        layer.append(
          s(
            "g",
            {
              class: `mby-cube${struck ? " is-struck" : ""}`,
              "data-hl": `ones:${i}`,
              "data-mat": i,
              "data-kind": "o",
            },
            s("rect", { x, y, width: cw, height: cw, rx: 2 }),
            struck
              ? s("line", { class: "mby-cross", x1: x - 2, y1: y + cw, x2: x + cw + 2, y2: y })
              : null,
          ),
        );
      }
      const l = left(m);
      layer.append(
        s("text", {
          class: "mby-count",
          x: o.x + MW / 2,
          y: o.y + MH + 24,
          "text-anchor": "middle",
          text:
            m.outT || m.outO
              ? tr("{t} tens, {o} ones, crossed out: {x} tens, {y} ones", {
                  t: m.tens,
                  o: m.ones,
                  x: m.outT,
                  y: m.outO,
                })
              : tr("{t} tens · {o} ones", { t: l.t, o: l.o }),
        }),
      );
    });
    paint(svg, hl);
    sh.readout.textContent = "";
    sh.stage.setAttribute("aria-label", describe());
    refresh.forEach((f) => f());
  }
  let refresh = [];
  const emit = (by, action) => {
    draw();
    sh.announce(describe());
    opts.onChange?.(clone(state), { by, action });
  };
  const addTens = (i, d, by) => {
    const m = state.mats[i];
    const v = clamp(m.tens + d, 0, maxT);
    if (v === m.tens) return;
    m.tens = v;
    m.outT = Math.min(m.outT, v);
    emit(by, "tens");
  };
  const addOnes = (i, d, by) => {
    const m = state.mats[i];
    const v = clamp(m.ones + d, 0, maxO);
    if (v === m.ones) return;
    m.ones = v;
    m.outO = Math.min(m.outO, v);
    emit(by, "ones");
  };
  const strikeTens = (i, d, by) => {
    const m = state.mats[i];
    const v = clamp(m.outT + d, 0, m.tens);
    if (v !== m.outT) ((m.outT = v), emit(by, "strikeTens"));
  };
  const strikeOnes = (i, d, by) => {
    const m = state.mats[i];
    const v = clamp(m.outO + d, 0, m.ones);
    if (v !== m.outO) ((m.outO = v), emit(by, "strikeOnes"));
  };
  sh.on(sh.stage, "keydown", (e) => {
    if (sh.locked) return;
    const k = e.key;
    const sx = e.shiftKey && spec.strike;
    if (k === "ArrowUp")
      (e.preventDefault(), sx ? strikeTens(cur, -1, "keyboard") : addTens(cur, 1, "keyboard"));
    else if (k === "ArrowDown")
      (e.preventDefault(), sx ? strikeTens(cur, 1, "keyboard") : addTens(cur, -1, "keyboard"));
    else if (k === "ArrowRight")
      (e.preventDefault(), sx ? strikeOnes(cur, 1, "keyboard") : addOnes(cur, 1, "keyboard"));
    else if (k === "ArrowLeft")
      (e.preventDefault(), sx ? strikeOnes(cur, -1, "keyboard") : addOnes(cur, -1, "keyboard"));
    else if ((k === "PageDown" || k === "PageUp") && count > 1) {
      e.preventDefault();
      cur = (cur + (k === "PageDown" ? 1 : count - 1)) % count;
      draw();
      sh.announce(tr("Mat {n}", { n: cur + 1 }));
    }
  });
  // Pointer: tap a block to take it away (or cross it out); tap a crossed-out block to bring it back.
  sh.on(svg, "click", (e) => {
    if (sh.locked) return;
    const el = e.target.closest?.("[data-kind]");
    if (!el) return;
    const i = Number(el.dataset.mat);
    cur = i;
    const tens = el.dataset.kind === "t";
    if (spec.strike)
      el.classList.contains("is-struck")
        ? (tens ? strikeTens : strikeOnes)(i, -1, "pointer")
        : (tens ? strikeTens : strikeOnes)(i, 1, "pointer");
    else (tens ? addTens : addOnes)(i, -1, "pointer");
  });
  const buildControls = () => {
    sh.controls.replaceChildren();
    refresh = [];
    if (sh.locked) return;
    state.mats.forEach((m, i) => {
      const who = count > 1 ? ` (${tr("mat {n}", { n: i + 1 })})` : "";
      if (spec.adjust !== false) {
        refresh.push(
          stepper(
            sh,
            tr("Tens") + who,
            () => state.mats[i].tens,
            (d) => addTens(i, d, "button"),
            `tens${i}`,
          ),
        );
        refresh.push(
          stepper(
            sh,
            tr("Ones") + who,
            () => state.mats[i].ones,
            (d) => addOnes(i, d, "button"),
            `ones${i}`,
          ),
        );
      }
      if (spec.strike) {
        sh.button(tr("Cross out a ten") + who, () => strikeTens(i, 1, "button"), {
          cls: "mby-ghost",
        });
        sh.button(tr("Cross out a one") + who, () => strikeOnes(i, 1, "button"), {
          cls: "mby-ghost",
        });
      }
    });
  };
  buildControls();
  draw();
  return sh.api(spec, {
    get: () => state,
    set: (next) => {
      state = norm({ mats: next.mats ?? state.mats });
      draw();
    },
    hl: (tokens) => ((hl = new Set(tokens)), paint(svg, hl)),
    lock: () => (buildControls(), draw()),
  });
}

// ======================================================================================================
// Part-whole bar. "split": the whole is fixed and a divider slides (the other part is the rest).
// "add": two parts are built and the whole follows. Hidden numbers show "?" until state.reveal.
//   spec: { mode, whole, max, hideWhole, hideRight, state, steps }
//   state: { left, right, reveal }
//   hl tokens: "left", "right", "whole"
// ======================================================================================================
export function mountPartwhole(host, spec = {}, opts = {}) {
  const split = spec.mode !== "add";
  const sh = shell("partwhole", host, spec, opts, {
    label: tr("Part-whole bar"),
    help: split
      ? tr("Left and right arrows slide the divider one step. Page Up and Page Down slide it five.")
      : tr(
          "Left and right arrows change the first part. Up and down arrows change the second part.",
        ),
  });
  const whole = spec.whole ?? 0;
  const units = split ? whole : (spec.max ?? 20);
  const norm = (st = {}) => {
    const left = clamp(st.left ?? 0, 0, units);
    return {
      left,
      right: split ? whole - left : clamp(st.right ?? 0, 0, units - left),
      reveal: !!st.reveal,
    };
  };
  let state = norm(spec.state);
  let hl = new Set();
  const W = 640,
    H = 190,
    x0 = 40,
    bw = W - 80,
    by = 84,
    bh = 56;
  const svg = s("svg", {
    class: "mby-svg",
    role: "presentation",
    focusable: "false",
    viewBox: `0 0 ${W} ${H}`,
    preserveAspectRatio: "xMidYMid meet",
  });
  const layer = s("g");
  svg.append(layer);
  sh.stage.append(svg);
  if (split && !sh.locked) Object.assign(sh.stage.dataset, { slider: "1" });
  const u = () => bw / Math.max(1, units);
  const shown = (hidden, v) => (state.reveal || !hidden ? String(v) : "?");
  const wholeVal = () => (split ? whole : state.left + state.right);
  const describe = () =>
    tr("Part-whole bar. First part {l}. Second part {r}. Whole {w}.", {
      l: state.left,
      r: shown(spec.hideRight && split, state.right),
      w: shown(split ? spec.hideWhole : spec.hideWhole !== false, wholeVal()),
    });
  function draw() {
    layer.replaceChildren();
    const lw = state.left * u(),
      rw = state.right * u();
    layer.append(s("rect", { class: "mby-bar-bg", x: x0, y: by, width: bw, height: bh, rx: 8 }));
    layer.append(
      s("rect", {
        class: "mby-seg-l",
        "data-hl": "left",
        x: x0,
        y: by,
        width: lw,
        height: bh,
        rx: state.left ? 8 : 0,
      }),
    );
    if (rw > 0)
      layer.append(
        s("rect", {
          class: "mby-seg-r",
          "data-hl": "right",
          x: x0 + lw,
          y: by,
          width: rw,
          height: bh,
          rx: 8,
        }),
      );
    if (units <= 24)
      for (let i = 1; i < units; i += 1)
        layer.append(
          s("line", { class: "mby-unit", x1: x0 + i * u(), x2: x0 + i * u(), y1: by, y2: by + bh }),
        );
    const hideRight = split ? spec.hideRight : false;
    if (lw > 0)
      layer.append(
        s("text", {
          class: "mby-pw-num",
          x: x0 + lw / 2,
          y: by + bh / 2 + 9,
          "text-anchor": "middle",
          text: String(state.left),
        }),
      );
    if (rw > 0 || hideRight)
      layer.append(
        s("text", {
          class: "mby-pw-num",
          x: x0 + lw + Math.max(rw, 40) / 2,
          y: by + bh / 2 + 9,
          "text-anchor": "middle",
          text: shown(hideRight, state.right),
        }),
      );
    const end = x0 + (state.left + state.right) * u();
    const wholeText = shown(split ? spec.hideWhole : spec.hideWhole !== false, wholeVal());
    if (end - x0 > 4) {
      layer.append(
        s("path", {
          class: "mby-bracket",
          "data-hl": "whole",
          d: `M${x0},${by - 10} v-12 H${end} v12`,
        }),
      );
      layer.append(
        s("text", {
          class: "mby-pw-whole",
          "data-hl": "whole",
          x: (x0 + end) / 2,
          y: by - 32,
          "text-anchor": "middle",
          text: wholeText,
        }),
      );
    }
    if (split) {
      const hx = x0 + lw;
      layer.append(
        s("line", { class: "mby-divider", x1: hx, x2: hx, y1: by - 12, y2: by + bh + 12 }),
      );
      layer.append(s("circle", { class: "mby-handle", cx: hx, cy: by + bh + 18, r: 14 }));
    }
    paint(svg, hl);
    sh.readout.textContent = "";
    sh.stage.setAttribute("aria-label", describe());
    if (split) {
      Object.assign(sh.stage.dataset, {});
      sh.stage.setAttribute("aria-valuemin", "0");
      sh.stage.setAttribute("aria-valuemax", String(whole));
      sh.stage.setAttribute("aria-valuenow", String(state.left));
    }
    refresh.forEach((f) => f());
  }
  let refresh = [];
  const emit = (by2, action) => {
    draw();
    sh.announce(describe());
    opts.onChange?.(clone(state), { by: by2, action });
  };
  const setLeft = (v, by2) => {
    const n = clamp(v, 0, split ? whole : units - state.right);
    if (n === state.left) return;
    state.left = n;
    if (split) state.right = whole - n;
    emit(by2, "left");
  };
  const setRight = (v, by2) => {
    if (split) return;
    const n = clamp(v, 0, units - state.left);
    if (n !== state.right) ((state.right = n), emit(by2, "right"));
  };
  sh.on(sh.stage, "keydown", (e) => {
    if (sh.locked) return;
    const k = e.key;
    if (k === "ArrowRight") (e.preventDefault(), setLeft(state.left + 1, "keyboard"));
    else if (k === "ArrowLeft") (e.preventDefault(), setLeft(state.left - 1, "keyboard"));
    else if (split && k === "PageUp") (e.preventDefault(), setLeft(state.left + 5, "keyboard"));
    else if (split && k === "PageDown") (e.preventDefault(), setLeft(state.left - 5, "keyboard"));
    else if (split && k === "Home") (e.preventDefault(), setLeft(0, "keyboard"));
    else if (split && k === "End") (e.preventDefault(), setLeft(whole, "keyboard"));
    else if (!split && k === "ArrowUp") (e.preventDefault(), setRight(state.right + 1, "keyboard"));
    else if (!split && k === "ArrowDown")
      (e.preventDefault(), setRight(state.right - 1, "keyboard"));
  });
  let down = false;
  const slideTo = (e) => {
    if (sh.locked || !split) return;
    const p = svgPoint(svg, e, { w: W, h: H });
    if (p) setLeft(Math.round((p.x - x0) / u()), "pointer");
  };
  sh.on(
    svg,
    "pointerdown",
    (e) => (
      (down = true),
      svg.setPointerCapture?.(e.pointerId),
      sh.stage.focus?.({ preventScroll: true }),
      slideTo(e)
    ),
  );
  sh.on(svg, "pointermove", (e) => down && slideTo(e));
  sh.on(svg, "pointerup", () => (down = false));
  sh.on(svg, "pointercancel", () => (down = false));
  const buildControls = () => {
    sh.controls.replaceChildren();
    refresh = [];
    if (sh.locked) return;
    if (split)
      refresh.push(
        stepper(
          sh,
          tr("First part"),
          () => state.left,
          (d) => setLeft(state.left + d, "button"),
          "left",
        ),
      );
    else {
      refresh.push(
        stepper(
          sh,
          tr("First part"),
          () => state.left,
          (d) => setLeft(state.left + d, "button"),
          "left",
        ),
      );
      refresh.push(
        stepper(
          sh,
          tr("Second part"),
          () => state.right,
          (d) => setRight(state.right + d, "button"),
          "right",
        ),
      );
    }
  };
  buildControls();
  draw();
  return sh.api(spec, {
    get: () => state,
    set: (next) => {
      state = norm({ ...state, ...next });
      draw();
    },
    hl: (tokens) => ((hl = new Set(tokens)), paint(svg, hl)),
    lock: () => (buildControls(), draw()),
  });
}

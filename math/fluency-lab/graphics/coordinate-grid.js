// Coordinate grid: four quadrants, adjustable range, points on whole or rational grid positions, polygons,
// distances along the axes, and translations / reflections / rotations / dilations with the rule shown.
// Check mode compares config.target = { points } or { image } with exact math and never prints it.
import {
  arrowDelta,
  button,
  clone,
  createShell,
  enableDrag,
  h,
  num,
  s,
  segmented,
  stepper,
  syncList,
  t,
} from "./b-core.js";
import {
  ONE,
  ZERO,
  add,
  clamp,
  fmt,
  parse,
  rat,
  show,
  snapFloat,
  snapTo,
  sub,
  toNumber,
} from "./b-rational.js";
import * as M from "./coordinate-grid-math.js";
import { numText, pair, where } from "./coordinate-grid-text.js";
import { drawFigure, drawGrid } from "./coordinate-grid-view.js";

const PAD = { l: 36, r: 16, t: 16, b: 30 };
export function mount(container, config = {}) {
  const shell = createShell(container, config, "coordinate-grid", {
    defaultLabel: t("Coordinate grid"),
    help: t(
      "Click the grid to plot a point and drag points to move them. With the keyboard, focus the grid cursor, move it with the arrow keys, and press Enter to plot.",
    ),
  });
  const { svg, announce } = shell;
  const locked = Boolean(config.lockPoints);
  let state = M.sanitize({}, config);
  let width = 560;
  let unit = 40;
  let offset = 0;
  let height = 480;
  const cache = new Map();
  const staticLayer = s("g", { class: "gb-static" });
  const handleLayer = s("g", { class: "gb-handles" });
  svg.append(staticLayer, handleLayer);

  const geometry = () => {
    const { xmin, xmax, ymin, ymax } = state.range;
    unit = Math.min(48, (width - PAD.l - PAD.r) / (xmax - xmin), 540 / (ymax - ymin));
    height = Math.round((ymax - ymin) * unit + PAD.t + PAD.b);
    offset = Math.max(0, (width - PAD.l - PAD.r - (xmax - xmin) * unit) / 2);
  };
  const px = (x) => PAD.l + offset + (toNumber(x) - state.range.xmin) * unit;
  const py = (y) => PAD.t + (state.range.ymax - toNumber(y)) * unit;
  const name = (index) => M.letter(index);
  const indexOf = (id) => state.points.findIndex((p) => p.id === id);

  function createPoint(_, id) {
    const node = s(
      "g",
      { class: "gb-pt", tabindex: "0", role: "button", "data-drag": id, "data-id": id },
      s("circle", { class: "gb-ring", r: 17 }),
      s("circle", { class: "gb-dot", r: 7 }),
      s("text", { class: "gb-ptlabel", x: 10, y: -9 }),
      s("circle", { class: "gb-hit", r: 22 }),
    );
    node.addEventListener("keydown", (event) => onPointKey(event, id));
    node.addEventListener("focus", () => {
      if (state.selected !== id) {
        state = { ...state, selected: id };
        render();
      }
    });
    return node;
  }
  function updatePoint(node, p, id) {
    const index = indexOf(id);
    node.setAttribute("transform", `translate(${px(p.x)} ${py(p.y)})`);
    node.querySelector(".gb-ptlabel").textContent = name(index);
    node.classList.toggle("is-selected", id === state.selected);
    node.setAttribute(
      "aria-label",
      t("Point {name} at {pair}, {where}", {
        name: name(index),
        pair: pair(p),
        where: where(M.quadrant(p)),
      }),
    );
  }

  const cursorNode = s(
    "g",
    { class: "gb-cursor", tabindex: "0", role: "button", "aria-roledescription": t("grid cursor") },
    s("line", { class: "gb-cursor-line", "data-h": "" }),
    s("line", { class: "gb-cursor-line", "data-v": "" }),
    s("circle", { class: "gb-cursor-ring", r: 12 }),
  );
  function updateCursor() {
    const { xmin, xmax, ymin, ymax } = state.range;
    const c = state.cursor;
    const [hl, vl] = cursorNode.querySelectorAll("line");
    hl.setAttribute("x1", px(rat(xmin)));
    hl.setAttribute("x2", px(rat(xmax)));
    hl.setAttribute("y1", py(c.y));
    hl.setAttribute("y2", py(c.y));
    vl.setAttribute("y1", py(rat(ymin)));
    vl.setAttribute("y2", py(rat(ymax)));
    vl.setAttribute("x1", px(c.x));
    vl.setAttribute("x2", px(c.x));
    const ring = cursorNode.querySelector("circle");
    ring.setAttribute("cx", px(c.x));
    ring.setAttribute("cy", py(c.y));
    cursorNode.setAttribute(
      "aria-label",
      t("Grid cursor at {pair}. Arrow keys move it, Enter plots a point.", { pair: pair(c) }),
    );
  }
  handleLayer.after(cursorNode);

  const pointAt = (c) => state.points.find((p) => M.samePoint(p, c));
  cursorNode.addEventListener("keydown", (event) => {
    const d = arrowDelta(event);
    if (d) {
      event.preventDefault();
      const next = M.snapPoint(
        { x: add(state.cursor.x, mulStep(d.dx)), y: add(state.cursor.y, mulStep(d.dy)) },
        state.step,
        state.range,
      );
      state = { ...state, cursor: next };
      updateCursor();
      announce(
        t("Cursor at {pair}, {where}", { pair: pair(next), where: where(M.quadrant(next)) }),
      );
      shell.emit(state, M.isCorrect(state, config.target));
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (locked) return;
      const hit = pointAt(state.cursor);
      if (hit) {
        state = { ...state, selected: hit.id };
        render();
        announce(t("Selected {pair}", { pair: pair(hit) }));
      } else change(M.withPoint(state, state.cursor));
    } else if ((event.key === "Delete" || event.key === "Backspace") && !locked) {
      const hit = pointAt(state.cursor);
      if (hit) {
        event.preventDefault();
        change(M.withoutPoint(state, hit.id));
      }
    }
  });
  const mulStep = (k) => rat(k * state.step.n, state.step.d);

  function onPointKey(event, id) {
    const p = state.points.find((q) => q.id === id);
    const d = arrowDelta(event);
    if (d && !locked) {
      event.preventDefault();
      change(M.movedPoint(state, id, { x: add(p.x, mulStep(d.dx)), y: add(p.y, mulStep(d.dy)) }));
    } else if ((event.key === "Delete" || event.key === "Backspace") && !locked) {
      event.preventDefault();
      change(M.withoutPoint(state, id));
      cache.get(state.selected)?.focus({ preventScroll: true });
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      announce(describePoint(p));
    }
  }
  const describePoint = (p) =>
    t("Point {name} at {pair}, {where}", {
      name: name(indexOf(p.id)),
      pair: pair(p),
      where: where(M.quadrant(p)),
    });

  function distanceLine() {
    const sel = indexOf(state.selected);
    if (sel < 0 || state.points.length < 2) return null;
    const p = state.points[sel];
    const nextIndex = (sel + 1) % state.points.length;
    const q = state.points[nextIndex];
    const f = M.legs(p, q);
    const a = name(sel);
    const b = name(nextIndex);
    if (f.kind === "horizontal")
      return t("{a} to {b} is horizontal: |{x2} − {x1}| = {d}", {
        a,
        b,
        x1: numText(p.x),
        x2: numText(q.x),
        d: show(f.dx),
      });
    if (f.kind === "vertical")
      return t("{a} to {b} is vertical: |{y2} − {y1}| = {d}", {
        a,
        b,
        y1: numText(p.y),
        y2: numText(q.y),
        d: show(f.dy),
      });
    if (f.kind === "same") return t("{a} and {b} are the same point.", { a, b });
    return t("{a} to {b}: {dx} across and {dy} up or down, so distance² = {dx}² + {dy}² = {sq}", {
      a,
      b,
      dx: show(f.dx),
      dy: show(f.dy),
      sq: show(f.squared),
    });
  }

  function renderReadout() {
    const lines = [];
    if (state.points.length)
      lines.push(
        h("p", {
          class: "gb-line",
          text: t("Ordered pairs: {list}", {
            list: state.points.map((p, i) => `${name(i)} ${pair(p)}`).join("  "),
          }),
        }),
      );
    else
      lines.push(
        h("p", {
          class: "gb-line",
          text: t("No points yet. Click the grid or press Enter on the grid cursor."),
        }),
      );
    const sel = state.points.find((p) => p.id === state.selected);
    if (sel)
      lines.push(
        h("p", {
          class: "gb-line",
          text: t("Selected: {name} {pair}, {where}", {
            name: name(indexOf(sel.id)),
            pair: pair(sel),
            where: where(M.quadrant(sel)),
          }),
        }),
      );
    const dist = distanceLine();
    if (dist) lines.push(h("p", { class: "gb-line", text: dist }));
    if (state.transform.type !== "none") {
      lines.push(
        h(
          "p",
          { class: "gb-line" },
          h("strong", { text: t("Rule: ") }),
          M.ruleText(state.transform),
        ),
      );
      const image = M.imagePoints(state);
      if (image.length)
        lines.push(
          h("p", {
            class: "gb-line",
            text: state.points
              .map((p, i) => `${name(i)} ${pair(p)} → ${name(i)}′ ${pair(image[i])}`)
              .join("   "),
          }),
        );
    }
    shell.readout.replaceChildren(...lines);
  }

  function describe() {
    const { xmin, xmax, ymin, ymax } = state.range;
    const head = t("Coordinate grid with x from {x1} to {x2} and y from {y1} to {y2}.", {
      x1: num(xmin),
      x2: num(xmax),
      y1: num(ymin),
      y2: num(ymax),
    });
    const pts = state.points.length
      ? t("Points: {list}.", {
          list: state.points
            .map((p, i) => `${name(i)} ${pair(p)}, ${where(M.quadrant(p))}`)
            .join("; "),
        })
      : t("No points yet.");
    const closed =
      state.closed && state.points.length > 2
        ? ` ${t("The points are joined as a closed shape.")}`
        : "";
    const tr =
      state.transform.type === "none"
        ? ""
        : ` ${t("Transformation rule {rule}. Images: {list}.", {
            rule: M.ruleText(state.transform),
            list: M.imagePoints(state)
              .map((p, i) => `${name(i)}′ ${pair(p)}`)
              .join("; "),
          })}`;
    return `${head} ${pts}${closed}${tr}`;
  }

  // Toolbar and controls
  const closeBtn = button(t("Join as shape"), () => change({ ...state, closed: !state.closed }), {
    "aria-pressed": "false",
  });
  const removeBtn = button(t("Remove point"), () => {
    change(M.withoutPoint(state, state.selected));
    cache.get(state.selected)?.focus({ preventScroll: true });
  });
  const clearBtn = button(t("Clear points"), () =>
    change({ ...state, points: [], selected: null }),
  );
  shell.toolbar.append(closeBtn, removeBtn, clearBtn);

  const grow = (dir) => {
    const { xmin, xmax, ymin, ymax } = state.range;
    const r =
      dir > 0
        ? {
            xmin: xmin < 0 ? xmin - 1 : xmin,
            xmax: xmax + 1,
            ymin: ymin < 0 ? ymin - 1 : ymin,
            ymax: ymax + 1,
          }
        : {
            xmin: xmin < 0 ? xmin + 1 : xmin,
            xmax: xmax - 1,
            ymin: ymin < 0 ? ymin + 1 : ymin,
            ymax: ymax - 1,
          };
    const range = M.sanitizeRange(r);
    change(M.sanitize({ ...state, range }, config));
  };
  const rangeStep = stepper(t("Axes"), { onDec: () => grow(-1), onInc: () => grow(1) });
  const stepSeg = segmented(
    t("Grid positions"),
    [
      ["1", t("Whole")],
      ["1/2", t("Halves")],
      ["1/4", t("Quarters")],
    ],
    fmt(state.step),
    (id) => change({ ...state, step: parse(id) }),
  );
  const typeSeg = segmented(
    t("Transformation"),
    [
      ["none", t("None")],
      ["translate", t("Translate")],
      ["reflect", t("Reflect")],
      ["rotate", t("Rotate")],
      ["dilate", t("Dilate")],
    ],
    "none",
    (type) => {
      const base = {
        none: { type },
        translate: { type, dx: ZERO, dy: ZERO },
        reflect: { type, axis: "y" },
        rotate: { type, angle: 90, cx: ZERO, cy: ZERO },
        dilate: { type, k: rat(2), cx: ZERO, cy: ZERO },
      }[type];
      change({ ...state, transform: base });
    },
  );
  const params = h("div", { class: "gb-controls" });
  shell.controls.append(rangeStep.el, stepSeg, typeSeg, params);

  const setTr = (patch) => change({ ...state, transform: { ...state.transform, ...patch } });
  const centerSteppers = () => {
    const mk = (label, key) => {
      const st = stepper(label, {
        onDec: () => setTr({ [key]: sub(state.transform[key], ONE) }),
        onInc: () => setTr({ [key]: add(state.transform[key], ONE) }),
      });
      st.el.dataset.key = key;
      return st;
    };
    return [mk(t("Center x"), "cx"), mk(t("Center y"), "cy")];
  };
  let paramSig = "";
  let paramRefs = {};
  function buildParams() {
    const tr = state.transform;
    paramSig = tr.type;
    paramRefs = {};
    const kids = [];
    const unitStep = toNumber(state.step) < 1 ? state.step : ONE;
    if (tr.type === "translate") {
      const dx = stepper(t("Right or left"), {
        onDec: () => setTr({ dx: sub(state.transform.dx, unitStep) }),
        onInc: () => setTr({ dx: add(state.transform.dx, unitStep) }),
      });
      const dy = stepper(t("Up or down"), {
        onDec: () => setTr({ dy: sub(state.transform.dy, unitStep) }),
        onInc: () => setTr({ dy: add(state.transform.dy, unitStep) }),
      });
      paramRefs = { dx, dy };
      kids.push(dx.el, dy.el);
    } else if (tr.type === "reflect") {
      paramRefs.axis = segmented(
        t("Line of reflection"),
        [
          ["x", t("x-axis")],
          ["y", t("y-axis")],
          ["y=x", t("line y = x")],
          ["y=-x", t("line y = −x")],
        ],
        tr.axis,
        (axis) => setTr({ axis }),
      );
      kids.push(paramRefs.axis);
    } else if (tr.type === "rotate" || tr.type === "dilate") {
      if (tr.type === "rotate")
        paramRefs.angle = segmented(
          t("Turn counterclockwise"),
          [
            ["90", "90°"],
            ["180", "180°"],
            ["270", "270°"],
          ],
          String(tr.angle),
          (a) => setTr({ angle: Number(a) }),
        );
      else
        paramRefs.k = segmented(
          t("Scale factor"),
          [
            ["1/2", "×1/2"],
            ["2", "×2"],
            ["3", "×3"],
            ["4", "×4"],
          ],
          fmt(tr.k),
          (k) => setTr({ k: parse(k) }),
        );
      const [cx, cy] = centerSteppers();
      paramRefs.cx = cx;
      paramRefs.cy = cy;
      kids.push(paramRefs.angle || paramRefs.k, cx.el, cy.el);
    }
    params.replaceChildren(...kids);
  }
  function refreshParams() {
    const tr = state.transform;
    if (paramSig !== tr.type) buildParams();
    paramRefs.dx?.set(numText(tr.dx));
    paramRefs.dy?.set(numText(tr.dy));
    paramRefs.cx?.set(numText(tr.cx));
    paramRefs.cy?.set(numText(tr.cy));
    paramRefs.axis?.refresh(tr.axis);
    paramRefs.angle?.refresh(String(tr.angle));
    paramRefs.k?.refresh(fmt(tr.k));
  }

  function render() {
    geometry();
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("height", String(height));
    const parts = [];
    drawGrid(parts, { state, px, py, unit });
    drawFigure(parts, { state, px, py, name, indexOf });
    staticLayer.replaceChildren(...parts.filter(Boolean));
    syncList(handleLayer, cache, state.points, {
      key: (p) => p.id,
      create: createPoint,
      update: updatePoint,
    });
    updateCursor();
    renderReadout();
    typeSeg.refresh(state.transform.type);
    stepSeg.refresh(fmt(state.step));
    refreshParams();
    rangeStep.set(t("{lo} to {hi}", { lo: num(state.range.xmin), hi: num(state.range.xmax) }));
    closeBtn.setAttribute("aria-pressed", String(state.closed));
    closeBtn.disabled = state.points.length < 3;
    removeBtn.disabled = !state.selected;
    clearBtn.disabled = state.points.length === 0;
  }

  function change(next, { speak = true } = {}) {
    if (JSON.stringify(next) === JSON.stringify(state)) return;
    state = next;
    render();
    shell.emit(state, M.isCorrect(state, config.target));
    if (speak) announce(describe());
  }

  const worldAt = (pt) => ({
    x: snapFloat(state.range.xmin + (pt.x - PAD.l - offset) / unit, state.step),
    y: snapFloat(state.range.ymax - (pt.y - PAD.t) / unit, state.step),
  });
  enableDrag(svg, {
    onStart: () => {},
    onMove: (id, pt) => {
      if (!locked) change(M.movedPoint(state, id, worldAt(pt)), { speak: false });
    },
    onEnd: () => announce(describe()),
    onBackground: (pt) => {
      const inside =
        pt.x >= PAD.l - 8 &&
        pt.x <= width - PAD.r + 8 &&
        pt.y >= PAD.t - 8 &&
        pt.y <= height - PAD.b + 8;
      if (locked || !inside) return;
      const p = M.snapPoint(worldAt(pt), state.step, state.range);
      state = { ...state, cursor: p };
      change(M.withPoint(state, p));
    },
  });

  shell.onResize((w) => {
    width = w;
    render();
  });

  return {
    kind: "coordinate-grid",
    getState: () => clone(state),
    setState(next) {
      state = M.sanitize(next, config);
      render();
    },
    describe,
    check: () => M.isCorrect(state, config.target),
    destroy: shell.destroy,
  };
}

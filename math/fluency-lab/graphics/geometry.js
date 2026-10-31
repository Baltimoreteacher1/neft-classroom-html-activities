// Geometry: shapes and measurement on a grid. Tools: shape (drag integer vertices, live exact area and perimeter),
// angle (protractor with a draggable ray), ruler (cm, inches and fractions of an inch), classify (name a drawn shape).
// Check mode compares config.target with exact math (area, perimeter, shape, degrees, ruler marker, classification).
import {
  button,
  clone,
  createShell,
  enableDrag,
  h,
  arrowDelta,
  s,
  segmented,
  syncList,
  t,
} from "./b-core.js";
import { add, mul, rat } from "./b-rational.js";
import * as G from "./geometry-math.js";
import {
  angleDegrees,
  angleLayout,
  angleLines,
  drawAngle,
  drawRuler,
  rulerLayout,
  rulerLines,
  rulerText,
  rulerValue,
} from "./geometry-measure-view.js";
import {
  classifyLines,
  drawClassify,
  drawShape,
  formulas,
  layout,
  letter,
} from "./geometry-shape-view.js";

const shapeName = (shape) =>
  ({
    rectangle: t("Rectangle"),
    triangle: t("Triangle"),
    parallelogram: t("Parallelogram"),
    trapezoid: t("Trapezoid"),
    composite: t("L-shape"),
  })[shape];
const toolName = (tool) =>
  ({ shape: t("Shapes"), angle: t("Angle"), ruler: t("Ruler"), classify: t("Classify") })[tool];

export function mount(container, config = {}) {
  const shell = createShell(container, config, "geometry", {
    defaultLabel: t("Geometry"),
    help: t("Drag a handle to change the figure, or focus a handle and use the arrow keys."),
  });
  const { svg, announce } = shell;
  const tools = (config.tools ?? G.TOOLS).filter((tool) => G.TOOLS.includes(tool));
  const measure = shell.mode === "check" || Boolean(config.measure);
  const hideReading = config.hideReading ?? shell.mode === "check";
  const reveal = config.showClass ?? shell.mode !== "check";
  let state = G.sanitize({}, config);
  if (!tools.includes(state.tool)) state = { ...state, tool: tools[0] };
  let width = 560;
  let lay = null;
  const cache = new Map();
  const staticLayer = s("g", { class: "gb-static" });
  const handleLayer = s("g", { class: "gb-handles" });
  svg.append(staticLayer, handleLayer);

  const view = () => {
    if (state.tool === "angle") {
      lay = angleLayout(width);
      return {
        ...drawAngle(state, lay, hideReading),
        lines: angleLines(state, hideReading),
        height: lay.height,
      };
    }
    if (state.tool === "ruler") {
      lay = rulerLayout(width, state.unit);
      return {
        ...drawRuler(state, lay, measure, hideReading),
        lines: rulerLines(state, measure, hideReading),
        height: lay.height,
      };
    }
    lay = layout(width, state.grid);
    if (state.tool === "classify")
      return {
        ...drawClassify(state, lay),
        lines: classifyLines(state.cverts, reveal),
        height: lay.height,
      };
    const f = formulas(state.shape, state.verts);
    const lines = [
      h(
        "p",
        { class: "gb-line" },
        h("strong", { text: t("Area: ") }),
        t("{work} square units", { work: f.area }),
      ),
      h(
        "p",
        { class: "gb-line" },
        h("strong", { text: t("Perimeter: ") }),
        t("{work} units", { work: f.perimeter }),
      ),
    ];
    return { ...drawShape(state, lay), lines, height: lay.height };
  };

  function createHandle(d) {
    const node = s(
      "g",
      { class: "gb-pt", tabindex: "0", "data-drag": d.id, "data-id": d.id },
      s("circle", { class: "gb-ring", r: 17 }),
      s("circle", { class: "gb-dot", r: 8 }),
      s("text", { class: "gb-ptlabel", x: 11, y: -10 }),
      s("circle", { class: "gb-hit", r: 22 }),
    );
    node.addEventListener("keydown", (event) => onKey(event, d.id));
    return node;
  }
  function updateHandle(node, d) {
    node.setAttribute("transform", `translate(${d.x} ${d.y})`);
    node.setAttribute("role", d.role || "button");
    node.setAttribute("aria-label", d.aria);
    for (const key of ["valuemin", "valuemax", "valuenow", "valuetext"]) {
      if (d[key] !== undefined) node.setAttribute(`aria-${key}`, String(d[key]));
      else node.removeAttribute(`aria-${key}`);
    }
    const label = node.querySelector(".gb-ptlabel");
    label.textContent = d.label || "";
    label.setAttribute("x", String(d.lx ?? 11));
    label.setAttribute("y", String(d.ly ?? -10));
    label.setAttribute("text-anchor", d.lx === undefined ? "start" : "middle");
  }

  function describe() {
    if (state.tool === "angle")
      return hideReading ? t("Protractor with a movable ray.") : angleLines(state, false).join(" ");
    if (state.tool === "ruler")
      return hideReading && measure
        ? t("Ruler with a movable marker.")
        : rulerLines(state, measure, false).join(" ");
    if (state.tool === "classify") {
      const v = state.cverts;
      return `${t("Polygon with vertices {list}.", { list: v.map((p, i) => `${letter(i)} (${p.x}, ${p.y})`).join(", ") })} ${classifyLines(v, reveal).join(" ")}`;
    }
    const f = formulas(state.shape, state.verts);
    const list = state.verts.map((p, i) => `${letter(i)} (${p.x}, ${p.y})`).join(", ");
    return t(
      "{shape} with vertices {list}. Area {area} square units. Perimeter {perimeter} units.",
      { shape: shapeName(state.shape), list, area: f.area, perimeter: f.perimeter },
    );
  }

  const extra = h("div", { class: "gb-controls" });
  const toolSeg = segmented(
    t("Tool"),
    tools.map((tool) => [tool, toolName(tool)]),
    state.tool,
    (tool) => change({ ...state, tool }),
  );
  if (tools.length > 1) shell.toolbar.append(toolSeg);
  shell.controls.append(extra);
  let extraSig = "";
  let extraRef = null;
  function renderExtra() {
    const sig = state.tool;
    if (sig !== extraSig) {
      extraSig = sig;
      extraRef = null;
      if (sig === "shape")
        extraRef = segmented(
          t("Shape"),
          G.SHAPES.map((k) => [k, shapeName(k)]),
          state.shape,
          (shape) => change({ ...state, shape, verts: G.defaultVerts(shape) }),
        );
      else if (sig === "classify")
        extraRef = segmented(
          t("Polygon"),
          [
            ["triangle", t("Triangle")],
            ["quadrilateral", t("Quadrilateral")],
          ],
          state.cverts.length === 3 ? "triangle" : "quadrilateral",
          (kind) =>
            change({
              ...state,
              cverts: G.defaultVerts("rectangle")
                .slice(0, 0)
                .concat(G.DEFAULT_CLASSIFY[kind].map(([x, y]) => ({ x, y }))),
            }),
        );
      else if (sig === "ruler" && shell.mode !== "check")
        extraRef = segmented(
          t("Unit"),
          [
            ["cm", t("Centimeters")],
            ["in", t("Inches")],
          ],
          state.unit,
          (unit) =>
            change(G.sanitize({ ...state, unit, length: unit === "cm" ? rat(7) : rat(3) }, config)),
        );
      extra.replaceChildren(...(extraRef ? [extraRef] : []));
    }
    if (sig === "shape") extraRef?.refresh(state.shape);
    if (sig === "classify")
      extraRef?.refresh(state.cverts.length === 3 ? "triangle" : "quadrilateral");
    if (sig === "ruler") extraRef?.refresh(state.unit);
    toolSeg.refresh(state.tool);
  }

  function render() {
    const v = view();
    svg.setAttribute("viewBox", `0 0 ${width} ${v.height}`);
    svg.setAttribute("height", String(v.height));
    staticLayer.replaceChildren(...v.parts);
    syncList(handleLayer, cache, v.handles, {
      key: (d) => `${state.tool}:${state.shape}:${d.id}`,
      create: createHandle,
      update: updateHandle,
    });
    shell.readout.replaceChildren(
      ...v.lines.map((line) =>
        typeof line === "string" ? h("p", { class: "gb-line", text: line }) : line,
      ),
    );
    renderExtra();
  }

  function change(next, { speak = true } = {}) {
    if (JSON.stringify(next) === JSON.stringify(state)) return;
    state = next;
    render();
    shell.emit(state, G.isCorrect(state, config.target));
    if (speak) announce(describe());
  }

  function dragTo(id, pt) {
    if (state.tool === "angle") return { ...state, degrees: angleDegrees(pt, lay) };
    if (state.tool === "ruler") {
      const value = rulerValue(pt, lay, state.unit);
      return measure ? { ...state, marker: value } : { ...state, length: value, marker: value };
    }
    const at = lay.fromPoint(pt);
    const i = Number(id.slice(1));
    if (state.tool === "classify")
      return { ...state, cverts: G.moveClassifyVertex(state.cverts, i, at, state.grid) };
    return { ...state, verts: G.moveVertex(state.shape, state.verts, i, at, state.grid) };
  }

  function onKey(event, id) {
    const d = arrowDelta(event);
    let next = null;
    if (state.tool === "angle") {
      const big = event.shiftKey || event.key.startsWith("Page") ? 10 : 1;
      const dir = {
        ArrowLeft: 1,
        ArrowUp: 1,
        PageUp: 1,
        ArrowRight: -1,
        ArrowDown: -1,
        PageDown: -1,
      }[event.key];
      if (dir) next = { ...state, degrees: Math.max(0, Math.min(180, state.degrees + dir * big)) };
      else if (event.key === "Home") next = { ...state, degrees: 0 };
      else if (event.key === "End") next = { ...state, degrees: 180 };
    } else if (state.tool === "ruler") {
      const { step, max } = G.RULER[state.unit];
      const big =
        event.shiftKey || event.key.startsWith("Page") ? (state.unit === "cm" ? 10 : 16) : 1;
      const dir = {
        ArrowRight: 1,
        ArrowUp: 1,
        PageUp: 1,
        ArrowLeft: -1,
        ArrowDown: -1,
        PageDown: -1,
      }[event.key];
      const cur = measure ? state.marker : state.length;
      let value = null;
      if (dir) value = G.snapLength(state.unit, add(cur, mul(step, rat(dir * big))));
      else if (event.key === "Home") value = rat(0);
      else if (event.key === "End") value = max;
      if (value !== null)
        next = measure ? { ...state, marker: value } : { ...state, length: value, marker: value };
    } else if (d) {
      const i = Number(id.slice(1));
      const p = (state.tool === "classify" ? state.cverts : state.verts)[i];
      const target = { x: p.x + d.dx, y: p.y + d.dy };
      next =
        state.tool === "classify"
          ? { ...state, cverts: G.moveClassifyVertex(state.cverts, i, target, state.grid) }
          : { ...state, verts: G.moveVertex(state.shape, state.verts, i, target, state.grid) };
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      announce(describe());
      return;
    }
    if (next) {
      event.preventDefault();
      change(next);
    }
  }

  enableDrag(svg, {
    onMove: (id, pt) => change(dragTo(id, pt), { speak: false }),
    onEnd: () => announce(describe()),
  });
  shell.onResize((w) => {
    width = w;
    render();
  });

  return {
    kind: "geometry",
    getState: () => clone(state),
    setState(next) {
      state = G.sanitize(next, config);
      if (!tools.includes(state.tool)) state = { ...state, tool: tools[0] };
      render();
    },
    describe,
    check: () => G.isCorrect(state, config.target),
    destroy: shell.destroy,
  };
}

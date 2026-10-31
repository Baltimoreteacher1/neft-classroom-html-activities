// Double number line: two aligned lines with a linked scale. Marks keep the proportion exact (bottom = top * b / a).
// Modes: explore (free), build (place marks), check (compare to config.target = { top } or { bottom }, never printed).
import { button, clone, createShell, enableDrag, h, s, syncList, t } from "./b-core.js";
import { ONE, ZERO, cmp, div, eq, show, snapFloat, toNumber } from "./b-rational.js";
import * as M from "./double-number-line-math.js";

const PAD = { left: 28, right: 28 };
const Y = { top: 70, bottom: 178 };
const HEIGHT = 250;

const unitText = (value, unit) => {
  const text = show(value);
  if (!unit) return text;
  return unit.length <= 1 ? `${text}${unit}` : `${text} ${unit}`;
};

export function mount(container, config = {}) {
  const shell = createShell(container, config, "double-number-line", {
    defaultLabel: t("Double number line"),
    help: t(
      "Drag a mark along the lines, or focus a mark and use the arrow keys. Both lines move together.",
    ),
  });
  const { svg, announce } = shell;
  const hide = config.hide === "top" || config.hide === "bottom" ? config.hide : null;
  const showRate = config.showRate ?? shell.mode !== "check";
  const units = { top: config.topUnit || "", bottom: config.bottomUnit || "" };
  const names = {
    top: config.topLabel || t("Top quantity"),
    bottom: config.bottomLabel || t("Bottom quantity"),
  };
  let state = M.sanitize({}, config);
  let width = 560;
  const cache = new Map();

  const staticLayer = s("g", { class: "gb-static" });
  const handleLayer = s("g", { class: "gb-handles" });
  svg.append(staticLayer, handleLayer);

  const span = () => width - PAD.left - PAD.right;
  const xOf = (top) => PAD.left + toNumber(div(top, state.max)) * span();
  const shown = (line, value) => (hide === line ? "?" : unitText(value, units[line]));
  const lineValue = (line, top) => (line === "top" ? top : M.bottomOf(top, state.ratio));

  function drawStatic() {
    const parts = [];
    const ticks = M.tickValues(state);
    const px = span() / Math.max(1, ticks.length - 1);
    const every = [1, 2, 5, 10, 20, 40].find((n) => n * px >= 44) || 40;
    for (const line of ["top", "bottom"]) {
      const y = Y[line];
      parts.push(
        s("text", {
          class: "gb-linename",
          x: PAD.left,
          y: line === "top" ? 22 : HEIGHT - 12,
          text: names[line],
        }),
      );
      parts.push(
        s("line", { class: "gb-axis", x1: PAD.left - 8, x2: width - PAD.right + 8, y1: y, y2: y }),
      );
      ticks.forEach((top, k) => {
        const x = xOf(top);
        const major = k % every === 0;
        parts.push(
          s("line", {
            class: "gb-tick",
            x1: x,
            x2: x,
            y1: y - (major ? 9 : 5),
            y2: y + (major ? 9 : 5),
          }),
        );
        if (major && hide !== line)
          parts.push(
            s("text", {
              class: "gb-ticklabel",
              x,
              y: line === "top" ? y - 16 : y + 28,
              "text-anchor": "middle",
              text: show(lineValue(line, top)),
            }),
          );
      });
    }
    for (const top of M.normalizeFixed(config, state)) parts.push(fixedMark(top));
    staticLayer.replaceChildren(...parts);
  }

  const bubble = (x, y, text, cls) => {
    const w = Math.max(30, text.length * 8.5 + 14);
    return [
      s("rect", {
        class: `gb-bubble ${cls}`,
        x: x - w / 2,
        y: y - 13,
        width: w,
        height: 26,
        rx: 8,
      }),
      s("text", { class: "gb-bubbletext", x, y: y + 5, "text-anchor": "middle", text }),
    ];
  };
  function fixedMark(top) {
    const x = xOf(top);
    return s(
      "g",
      { class: "gb-fixed" },
      s("line", { class: "gb-link gb-link--fixed", x1: x, x2: x, y1: Y.top, y2: Y.bottom }),
      s("rect", {
        class: "gb-diamond",
        x: x - 7,
        y: Y.top - 7,
        width: 14,
        height: 14,
        transform: `rotate(45 ${x} ${Y.top})`,
      }),
      s("rect", {
        class: "gb-diamond",
        x: x - 7,
        y: Y.bottom - 7,
        width: 14,
        height: 14,
        transform: `rotate(45 ${x} ${Y.bottom})`,
      }),
      ...bubble(x, Y.top + 34, unitText(top, units.top), "gb-bubble--fixed"),
      ...bubble(
        x,
        Y.bottom - 34,
        unitText(M.bottomOf(top, state.ratio), units.bottom),
        "gb-bubble--fixed",
      ),
    );
  }

  function markText(top) {
    return t("{top} on the top line and {bottom} on the bottom line", {
      top: shown("top", top),
      bottom: shown("bottom", M.bottomOf(top, state.ratio)),
    });
  }

  function createMark(_, id) {
    const node = s(
      "g",
      { class: "gb-mark", tabindex: "0", role: "slider", "data-drag": id, "data-id": id },
      s("line", { class: "gb-link", x1: 0, x2: 0, y1: Y.top, y2: Y.bottom }),
      s("circle", { class: "gb-ring", cx: 0, cy: Y.top, r: 20 }),
      s("circle", { class: "gb-ring", cx: 0, cy: Y.bottom, r: 20 }),
      s("circle", { class: "gb-dot", cx: 0, cy: Y.top, r: 8 }),
      s("circle", { class: "gb-dot", cx: 0, cy: Y.bottom, r: 8 }),
      s("g", { class: "gb-tb" }),
      s("g", { class: "gb-bb" }),
      s("circle", { class: "gb-hit", cx: 0, cy: Y.top, r: 22 }),
      s("circle", { class: "gb-hit", cx: 0, cy: Y.bottom, r: 22 }),
    );
    node.addEventListener("keydown", (event) => onKey(event, Number(id.slice(1))));
    node.addEventListener("focus", () => {
      if (state.selected !== Number(id.slice(1))) {
        state = { ...state, selected: Number(id.slice(1)) };
        renderReadout();
        markSelected();
      }
    });
    return node;
  }
  function updateMark(node, top, id) {
    const index = Number(id.slice(1));
    const x = xOf(top);
    const lift = (index % 2) * 28;
    node.setAttribute("transform", `translate(${x} 0)`);
    node.setAttribute("aria-label", t("Mark {n}", { n: index + 1 }));
    node.setAttribute("aria-valuemin", "0");
    node.setAttribute("aria-valuemax", String(toNumber(state.max)));
    node.setAttribute("aria-valuenow", String(toNumber(top)));
    node.setAttribute("aria-valuetext", markText(top));
    node
      .querySelector(".gb-tb")
      .replaceChildren(...bubble(0, Y.top + 34 + lift, shown("top", top), "gb-bubble--mark"));
    node
      .querySelector(".gb-bb")
      .replaceChildren(
        ...bubble(
          0,
          Y.bottom - 34 - lift,
          shown("bottom", M.bottomOf(top, state.ratio)),
          "gb-bubble--mark",
        ),
      );
  }
  const markSelected = () => {
    for (const [id, node] of cache)
      node.classList.toggle("is-selected", Number(id.slice(1)) === state.selected);
  };

  function renderReadout() {
    const { ratio } = state;
    const rate = M.unitRate(ratio);
    const lines = [
      h("p", {
        class: "gb-line",
        text: t("Ratio {a} : {b}", {
          a: unitText(ratio.a, units.top),
          b: unitText(ratio.b, units.bottom),
        }),
      }),
    ];
    if (state.selected >= 0) {
      const top = state.marks[state.selected];
      lines.push(
        h("p", {
          class: "gb-line",
          text: t("Selected mark: {top} and {bottom}", {
            top: shown("top", top),
            bottom: shown("bottom", M.bottomOf(top, ratio)),
          }),
        }),
      );
      if (!hide)
        lines.push(
          h("p", {
            class: "gb-line",
            text: t("Scale factor from the ratio: ×{k}", { k: show(M.scaleFactor(state, top)) }),
          }),
        );
    }
    if (showRate) {
      lines.push(
        h("p", {
          class: "gb-line",
          text: t("Unit rate: {b} ÷ {a} = {rate} on the bottom line for 1 on the top line", {
            a: show(ratio.a),
            b: show(ratio.b),
            rate: show(rate),
          }),
        }),
      );
      lines.push(
        h("p", {
          class: "gb-line",
          text: t("Other unit rate: {a} ÷ {b} = {rate} on the top line for 1 on the bottom line", {
            a: show(ratio.a),
            b: show(ratio.b),
            rate: show(div(ratio.a, ratio.b)),
          }),
        }),
      );
    }
    shell.readout.replaceChildren(...lines);
  }

  function describe() {
    const sorted = state.marks.slice().sort(cmp);
    const head = t(
      "Double number line. The top line shows {top} from 0 to {max}; the bottom line shows {bottom} from 0 to {bmax}.",
      {
        top: names.top,
        bottom: names.bottom,
        max: shown("top", state.max),
        bmax: shown("bottom", M.bottomOf(state.max, state.ratio)),
      },
    );
    if (!sorted.length) return `${head} ${t("No marks yet.")}`;
    const list = sorted.map(markText).join("; ");
    return `${head} ${t("Marks: {list}.", { list })}`;
  }

  function render() {
    svg.setAttribute("viewBox", `0 0 ${width} ${HEIGHT}`);
    svg.setAttribute("height", String(HEIGHT));
    drawStatic();
    syncList(handleLayer, cache, state.marks, {
      key: (_, i) => `m${i}`,
      create: createMark,
      update: updateMark,
    });
    markSelected();
    renderReadout();
    remove.disabled = state.selected < 0;
    addMark.disabled = state.marks.length >= M.MAX_MARKS;
    unitMark.disabled =
      state.marks.length >= M.MAX_MARKS || div(ONE, state.step).d !== 1 || cmp(ONE, state.max) > 0;
    clear.disabled = state.marks.length === 0;
  }

  function change(next, { speak = true } = {}) {
    if (JSON.stringify(next) === JSON.stringify(state)) return;
    state = next;
    render();
    shell.emit(state, M.isCorrect(state, config.target));
    if (speak) announce(describe());
  }

  function nextFreeTick() {
    const taken = state.marks;
    for (const tick of M.tickValues(state).slice(1))
      if (!taken.some((m) => eq(m, tick))) return tick;
    return state.step;
  }
  const addMark = button(t("Add mark"), () => {
    change(M.withMark(state, nextFreeTick()));
    focusMark(state.selected);
  });
  const unitMark = button(t("Mark 1 on the top line"), () => {
    change(M.withMark(state, ONE));
    focusMark(state.selected);
  });
  const remove = button(t("Remove mark"), () => {
    change(M.withoutMark(state, state.selected));
    focusMark(state.selected);
  });
  const clear = button(t("Clear marks"), () => change({ ...state, marks: [], selected: -1 }));
  shell.toolbar.append(addMark, unitMark, remove, clear);

  const focusMark = (index) => cache.get(`m${index}`)?.focus({ preventScroll: true });

  function onKey(event, index) {
    const code = event.key;
    let next = null;
    if (code === "ArrowRight" || code === "ArrowUp")
      next = M.nudged(state, index, event.shiftKey ? 5 : 1);
    else if (code === "ArrowLeft" || code === "ArrowDown")
      next = M.nudged(state, index, event.shiftKey ? -5 : -1);
    else if (code === "PageUp") next = M.nudged(state, index, 5);
    else if (code === "PageDown") next = M.nudged(state, index, -5);
    else if (code === "Home") next = M.movedMark(state, index, ZERO);
    else if (code === "End") next = M.movedMark(state, index, state.max);
    else if (code === "Delete" || code === "Backspace") {
      event.preventDefault();
      change(M.withoutMark(state, index));
      focusMark(state.selected);
      return;
    } else if (code === "Enter" || code === " ") {
      event.preventDefault();
      announce(markText(state.marks[index]));
      return;
    }
    if (!next) return;
    event.preventDefault();
    change(next);
  }

  const valueAt = (point) => {
    const fraction = Math.min(1, Math.max(0, (point.x - PAD.left) / span()));
    return snapFloat(fraction * toNumber(state.max), state.step);
  };
  enableDrag(svg, {
    onStart: (id, point) =>
      change(M.movedMark(state, Number(id.slice(1)), valueAt(point)), { speak: false }),
    onMove: (id, point) =>
      change(M.movedMark(state, Number(id.slice(1)), valueAt(point)), { speak: false }),
    onEnd: () => announce(describe()),
    onBackground: (point) => {
      if (point.y < 30 || point.y > HEIGHT - 20) return;
      change(M.withMark(state, valueAt(point)));
    },
  });

  shell.onResize((w) => {
    width = w;
    render();
  });

  return {
    kind: "double-number-line",
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

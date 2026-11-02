// Decimal / percent / fraction: 10 x 10 grid(s), tenths and hundredths strips, a percent bar and a number line, all
// showing the same exact quantity. Shade or drag to set it; works above 100% and below 1%.
// Check mode compares config.target = { value | decimal | fraction | percent } and never prints it.
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
import * as M from "./decimal-percent-math.js";

const PAD = 16;
const CELL_GAP = 1;
const WHOLE_CLASS = ["gb-dp--w1", "gb-dp--w2", "gb-dp--w3"];

export function mount(container, config = {}) {
  const shell = createShell(container, config, "decimal-percent", {
    defaultLabel: t("Fractions, decimals and percents"),
    help: t(
      "Click or drag on the grid, the bar or the number line. With the keyboard, focus the grid or the number line and use the arrow keys.",
    ),
  });
  const { svg, announce } = shell;
  const showEquivalents = config.showEquivalents ?? shell.mode !== "check";
  let state = M.sanitize({}, config);
  let width = 560;
  const geo = { grids: [], bar: null, line: null };
  const cache = new Map();
  const staticLayer = s("g", { class: "gb-static" });
  const handleLayer = s("g", { class: "gb-handles" });
  svg.append(staticLayer, handleLayer);

  const total = () => state.max * state.res;
  const k = () => M.unitsOf(state);

  function layout() {
    const inner = width - 2 * PAD;
    const n = state.max;
    let perRow = n;
    while (perRow > 1 && (inner - 12 * (perRow - 1)) / perRow < 140) perRow -= 1;
    const side = Math.min(260, (inner - 12 * (perRow - 1)) / perRow);
    const rowsN = Math.ceil(n / perRow);
    const gridW = perRow * side + (perRow - 1) * 12;
    const x0 = (width - gridW) / 2;
    let y = PAD;
    geo.grids = [];
    for (let g = 0; g < n; g += 1) {
      const row = Math.floor(g / perRow);
      geo.grids.push({ x: x0 + (g % perRow) * (side + 12), y: y + row * (side + 30), side });
    }
    y += rowsN * (side + 30) + 6;
    geo.strips = [];
    for (let w = 0; w < n; w += 1) {
      geo.strips.push({ y, w });
      y += 20 + 26 + 24 + 22;
    }
    geo.bar = { x: PAD + 8, y: y + 26, w: inner - 16, h: 32 };
    y = geo.bar.y + geo.bar.h + 78;
    geo.line = { x: PAD + 8, y, w: inner - 16 };
    geo.height = Math.round(y + 56);
  }

  const frac = () => k() / total();
  const xAtBar = (units) => geo.bar.x + (units / total()) * geo.bar.w;
  const xAtLine = (units) => geo.line.x + (units / total()) * geo.line.w;

  function drawGrids(parts) {
    const fill = M.gridFill(state);
    geo.grids.forEach((g, i) => {
      const cell = g.side / 10;
      const cls = WHOLE_CLASS[i];
      for (let r = 0; r < 10; r += 1)
        for (let c = 0; c < 10; c += 1) {
          const idx = r * 10 + c;
          const x = g.x + c * cell + CELL_GAP / 2;
          const y = g.y + r * cell + CELL_GAP / 2;
          const w = cell - CELL_GAP;
          parts.push(s("rect", { class: "gb-dpcell", x, y, width: w, height: w }));
          if (idx < fill[i].full)
            parts.push(s("rect", { class: `gb-dpfill ${cls}`, x, y, width: w, height: w }));
          else if (idx === fill[i].full && fill[i].partial > 0)
            parts.push(
              s("rect", { class: `gb-dpfill ${cls}`, x, y, width: w * fill[i].partial, height: w }),
            );
        }
      parts.push(s("rect", { class: "gb-dpframe", x: g.x, y: g.y, width: g.side, height: g.side }));
      if (state.max > 1)
        parts.push(
          s("text", {
            class: "gb-edgelabel",
            x: g.x + g.side / 2,
            y: g.y + g.side + 18,
            "text-anchor": "middle",
            text: t("Whole {n}", { n: i + 1 }),
          }),
        );
    });
  }

  function strip(parts, x, y, w, parts10, filledUnits, perSeg, cls) {
    const segW = w / parts10;
    const thin = parts10 > 20;
    for (let i = 0; i < parts10; i += 1) {
      parts.push(
        s("rect", {
          class: thin ? "gb-dpcell gb-dpcell--thin" : "gb-dpcell",
          x: x + i * segW,
          y,
          width: segW,
          height: 26,
        }),
      );
      const local = Math.max(0, Math.min(1, (filledUnits - i * perSeg) / perSeg));
      if (local > 0)
        parts.push(
          s("rect", {
            class: `gb-dpfill ${cls}`,
            x: x + i * segW,
            y,
            width: segW * local,
            height: 26,
          }),
        );
    }
    parts.push(s("rect", { class: "gb-dpframe", x, y, width: w, height: 26 }));
  }

  function drawStrips(parts) {
    const w = width - 2 * PAD - 16;
    for (const st of geo.strips) {
      const local = Math.max(0, Math.min(state.res, k() - st.w * state.res));
      const label =
        state.max > 1
          ? t("Tenths and hundredths, whole {n}", { n: st.w + 1 })
          : t("Tenths and hundredths");
      parts.push(s("text", { class: "gb-linename", x: PAD + 8, y: st.y + 14, text: label }));
      strip(parts, PAD + 8, st.y + 20, w, 10, local, state.res / 10, WHOLE_CLASS[st.w]);
      strip(parts, PAD + 8, st.y + 20 + 26 + 6, w, 100, local, state.res / 100, WHOLE_CLASS[st.w]);
    }
  }

  function drawBar(parts) {
    const b = geo.bar;
    parts.push(
      s("text", { class: "gb-linename", x: PAD + 8, y: b.y - 10, text: t("Percent bar") }),
    );
    parts.push(s("rect", { class: "gb-dpcell", x: b.x, y: b.y, width: b.w, height: b.h }));
    const fillW = frac() * b.w;
    parts.push(
      s("rect", { class: "gb-dpfill gb-dp--w1", x: b.x, y: b.y, width: fillW, height: b.h }),
    );
    parts.push(s("rect", { class: "gb-dpframe", x: b.x, y: b.y, width: b.w, height: b.h }));
    const every = state.max === 1 ? 25 : 50;
    for (let p = 0; p <= state.max * 100; p += 10) {
      const x = b.x + (p / (state.max * 100)) * b.w;
      const major = p % every === 0;
      parts.push(
        s("line", {
          class: "gb-tick",
          x1: x,
          x2: x,
          y1: b.y + b.h,
          y2: b.y + b.h + (major ? 10 : 5),
        }),
      );
      if (major)
        parts.push(
          s("text", {
            class: "gb-ticklabel",
            x,
            y: b.y + b.h + 25,
            "text-anchor": p === 0 ? "start" : "middle",
            text: `${p}%`,
          }),
        );
    }
    const end = b.x + fillW;
    if (showEquivalents)
      parts.push(
        s("text", {
          class: "gb-ptcoord",
          x: Math.min(Math.max(end, b.x + 24), b.x + b.w - 24),
          y: b.y + 21,
          "text-anchor": "middle",
          text: `${M.percentText(state)}%`,
        }),
      );
  }

  function drawLine(parts) {
    const l = geo.line;
    parts.push(
      s("text", { class: "gb-linename", x: PAD + 8, y: l.y - 30, text: t("Number line") }),
    );
    parts.push(s("line", { class: "gb-axis", x1: l.x, x2: l.x + l.w, y1: l.y, y2: l.y }));
    const every = state.max === 1 ? 5 : 10;
    for (let i = 0; i <= state.max * 10; i += 1) {
      const x = l.x + (i / (state.max * 10)) * l.w;
      const major = i % every === 0;
      parts.push(
        s("line", {
          class: "gb-tick",
          x1: x,
          x2: x,
          y1: l.y - (major ? 9 : 5),
          y2: l.y + (major ? 9 : 5),
        }),
      );
      if (major)
        parts.push(
          s("text", {
            class: "gb-ticklabel",
            x,
            y: l.y + 28,
            "text-anchor": i === 0 ? "start" : "middle",
            text: String(i / 10),
          }),
        );
    }
  }

  const unitsFromX = (x, left, w) =>
    Math.max(0, Math.min(total(), Math.round(((x - left) / w) * total())));
  function unitsFromGrid(id, pt, firstPress) {
    const g = geo.grids[Number(id.slice(1))];
    const cell = g.side / 10;
    const col = Math.max(0, Math.min(9, Math.floor((pt.x - g.x) / cell)));
    const row = Math.max(0, Math.min(9, Math.floor((pt.y - g.y) / cell)));
    const per = state.res / 100;
    const target = (Number(id.slice(1)) * 100 + row * 10 + col + 1) * per;
    return firstPress && target === k() ? target - per : target;
  }

  function handleList() {
    const list = geo.grids.map((g, i) => ({
      id: `g${i}`,
      type: "rect",
      x: g.x,
      y: g.y,
      w: g.side,
      h: g.side,
      primary: i === 0,
    }));
    list.push({
      id: "bar",
      type: "rect",
      x: geo.bar.x - 8,
      y: geo.bar.y - 6,
      w: geo.bar.w + 16,
      h: geo.bar.h + 12,
    });
    list.push({ id: "line", type: "dot", x: xAtLine(k()), y: geo.line.y, primary: true });
    return list;
  }
  const valueText = () =>
    showEquivalents
      ? describe()
      : t("{k} of {total} small squares shaded", {
          k: Math.round((k() * 100) / state.res),
          total: state.max * 100,
        });

  function createHandle(d) {
    const node = s(
      "g",
      { class: "gb-dphandle", "data-drag": d.id, "data-id": d.id },
      d.type === "dot"
        ? s("circle", { class: "gb-ring", r: 17 })
        : s("rect", { class: "gb-ring gb-ring--box" }),
      d.type === "dot" ? s("circle", { class: "gb-dot", r: 9 }) : null,
      s(d.type === "dot" ? "circle" : "rect", { class: "gb-hit" }),
    );
    if (d.primary) {
      node.setAttribute("tabindex", "0");
      node.setAttribute("role", "slider");
      node.addEventListener("keydown", onKey);
    }
    return node;
  }
  function updateHandle(node, d) {
    if (d.type === "dot") {
      node.setAttribute("transform", `translate(${d.x} ${d.y})`);
      node.querySelector(".gb-hit").setAttribute("r", "22");
    } else {
      node.setAttribute("transform", `translate(${d.x} ${d.y})`);
      for (const r of node.querySelectorAll("rect")) {
        r.setAttribute("width", d.w);
        r.setAttribute("height", d.h);
      }
    }
    if (d.primary) {
      node.setAttribute(
        "aria-label",
        d.id === "line" ? t("Number line value") : t("Shaded squares"),
      );
      node.setAttribute("aria-valuemin", "0");
      node.setAttribute("aria-valuemax", String(total()));
      node.setAttribute("aria-valuenow", String(k()));
      node.setAttribute("aria-valuetext", valueText());
    }
  }

  function onKey(event) {
    const per = state.res / 100;
    const d = arrowDelta(event);
    let next = null;
    const fine = event.altKey || event.ctrlKey;
    if (d)
      next = M.stepUnits(
        state,
        (d.dx + d.dy) * (fine ? 1 : per),
      );
    else if (event.key === "Home") next = M.setUnits(state, 0);
    else if (event.key === "End") next = M.setUnits(state, total());
    else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      announce(describe());
      return;
    }
    if (event.key === "PageUp") next = M.stepUnits(state, 10 * per);
    if (event.key === "PageDown") next = M.stepUnits(state, -10 * per);
    if (next) {
      event.preventDefault();
      change(next);
    }
  }

  function equivalents() {
    const p = M.fractionParts(state);
    const digit = M.digits(state);
    const reduced = p.reduced !== `${p.units}/${p.res}` ? ` = ${p.reduced}` : "";
    const mixedText = state.value.n > state.value.d && state.value.d !== 1 ? ` = ${p.mixed}` : "";
    return {
      fraction: `${p.units}/${p.res}${reduced}${mixedText}`,
      decimal: M.decimalOf(state),
      percent: M.percentText(state),
      place: [
        digit.wholes === 1 ? t("1 whole") : t("{n} wholes", { n: digit.wholes }),
        digit.tenths === 1 ? t("1 tenth") : t("{n} tenths", { n: digit.tenths }),
        digit.hundredths === 1 ? t("1 hundredth") : t("{n} hundredths", { n: digit.hundredths }),
        state.res === 1000 ? (digit.thousandths === 1 ? t("1 thousandth") : t("{n} thousandths", { n: digit.thousandths })) : null,
      ]
        .filter(Boolean)
        .join(", "),
    };
  }

  function describe() {
    const e = equivalents();
    return t("{fraction} of one whole is {decimal} as a decimal and {percent} percent.", {
      fraction: e.fraction,
      decimal: e.decimal,
      percent: e.percent,
    });
  }

  function renderReadout() {
    if (!showEquivalents) {
      shell.readout.replaceChildren(
        h("p", { class: "gb-line", text: t("Shade the picture to show the amount.") }),
      );
      return;
    }
    const e = equivalents();
    shell.readout.replaceChildren(
      h("p", { class: "gb-line" }, h("strong", { text: t("Fraction: ") }), e.fraction),
      h("p", { class: "gb-line" }, h("strong", { text: t("Decimal: ") }), e.decimal),
      h("p", { class: "gb-line" }, h("strong", { text: t("Percent: ") }), `${e.percent}%`),
      h("p", { class: "gb-line" }, h("strong", { text: t("Place value: ") }), e.place),
    );
  }

  // Controls
  const stepButtons = [];
  const addStep = (label, aria, amount, fineOnly) => {
    const b = button(label, () => change(M.stepUnits(state, amount * (state.res / 100))), {
      "aria-label": aria,
    });
    b.dataset.fine = fineOnly ? "1" : "";
    stepButtons.push([b, amount, fineOnly]);
    shell.toolbar.append(b);
  };
  addStep(num("-10%"), t("Decrease by 10 percent"), -10);
  addStep(num("-1%"), t("Decrease by 1 percent"), -1);
  addStep("+1%", t("Increase by 1 percent"), 1);
  addStep("+10%", t("Increase by 10 percent"), 10);
  const fineDown = button(num("-0.1%"), () => change(M.stepUnits(state, -1)), {
    "aria-label": t("Decrease by one tenth of a percent"),
  });
  const fineUp = button("+0.1%", () => change(M.stepUnits(state, 1)), {
    "aria-label": t("Increase by one tenth of a percent"),
  });
  const clear = button(t("Clear"), () => change(M.setUnits(state, 0)));
  shell.toolbar.append(fineDown, fineUp, clear);
  const resSeg = segmented(
    t("Smallest part"),
    [
      ["100", t("Hundredths")],
      ["1000", t("Tenths of a percent")],
    ],
    "100",
    (id) => change(M.sanitize({ ...state, res: Number(id) }, config)),
  );
  const wholes = stepper(t("Wholes"), {
    onDec: () => change(M.sanitize({ ...state, max: state.max - 1 }, config)),
    onInc: () => change(M.sanitize({ ...state, max: state.max + 1 }, config)),
  });
  shell.controls.append(resSeg, wholes.el);

  function render() {
    layout();
    svg.setAttribute("viewBox", `0 0 ${width} ${geo.height}`);
    svg.setAttribute("height", String(geo.height));
    const parts = [];
    drawGrids(parts);
    drawStrips(parts);
    drawBar(parts);
    drawLine(parts);
    staticLayer.replaceChildren(...parts);
    syncList(handleLayer, cache, handleList(), {
      key: (d) => d.id,
      create: createHandle,
      update: updateHandle,
    });
    renderReadout();
    resSeg.refresh(String(state.res));
    wholes.set(String(state.max));
    fineDown.hidden = state.res !== 1000;
    fineUp.hidden = state.res !== 1000;
  }

  function change(next, { speak = true } = {}) {
    if (JSON.stringify(next) === JSON.stringify(state)) return;
    state = next;
    render();
    shell.emit(state, M.isCorrect(state, config.target));
    if (speak) announce(showEquivalents ? describe() : valueText());
  }

  let firstPress = false;
  enableDrag(svg, {
    onStart: (id, pt) => {
      firstPress = true;
      dragTo(id, pt);
      firstPress = false;
    },
    onMove: (id, pt) => dragTo(id, pt),
    onEnd: () => announce(showEquivalents ? describe() : valueText()),
  });
  function dragTo(id, pt) {
    let units;
    if (id.startsWith("g")) units = unitsFromGrid(id, pt, firstPress);
    else if (id === "bar") units = unitsFromX(pt.x, geo.bar.x, geo.bar.w);
    else units = unitsFromX(pt.x, geo.line.x, geo.line.w);
    change(M.setUnits(state, units), { speak: false });
  }

  shell.onResize((w) => {
    width = w;
    render();
  });
  return {
    kind: "decimal-percent",
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

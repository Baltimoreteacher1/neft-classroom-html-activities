// The grid screens: tap or drag cells, resize with steppers, collect rectangles, stack layers, scale a rectangle.
// Every pointer action has a keyboard twin (arrow keys + Space, steppers, buttons). @fm2 FM-011 FM-038 FM-039 FM-021
import { arraySvg, prismSvg } from "../../art/grids.js";
import { cellKey, measure, rectCells } from "./measure.js";
import { clamp, counted, esc, intOf, keepFocus, selectInput, stepperHtml, u } from "./ui-kit.js";

const MAX_LAYERS = 8;
const TOOL_LETTERS = "ABCDEFG";

export function mountBoard(root, ctx) {
  const { round } = ctx;
  const { task, grid, kind } = round;
  let lang = ctx.lang;
  const paint = kind === "paint";
  const resizable = !paint;
  const tappable = grid.rows <= 12 && grid.cols <= 12;
  const counters = round.mark === "counters";
  const shape = paint && task.shape ? new Set(task.shape.map(([r, c]) => cellKey(r, c))) : null;
  const toolCount = paint && task.rule === "decompose" ? task.parts : 1;
  const state = {
    rows: 0,
    cols: 0,
    cells: new Map(),
    tool: 1,
    cursor: { r: 0, c: 0 },
    layers: 1,
    list: [],
    value: "",
    parity: null,
    pick: null,
    note: "",
  };
  let stroke = null;
  let lastPointer = -1e9;

  const figure = () =>
    paint
      ? [...state.cells].map(([k, v]) => [...k.split(",").map(Number), v])
      : rectCells(state.rows, state.cols);
  const dims = () =>
    paint
      ? measure(figure())
      : {
          rows: state.rows,
          cols: state.cols,
          area: state.rows * state.cols,
          perimeter: state.rows && state.cols ? 2 * (state.rows + state.cols) : 0,
        };
  const pairText = (rows, cols) => `${rows} × ${cols}`;
  const ordered = task.mode !== "factors";
  const pairKey = (rows, cols) => (ordered || rows <= cols ? `${rows}x${cols}` : `${cols}x${rows}`);

  function readout() {
    const m = dims();
    if (paint) {
      const n = state.cells.size;
      if (task.rule === "target") return u("roCovered", lang, { n, total: task.shape.length });
      if (task.rule === "decompose") return u("roColored", lang, { n, total: task.shape.length });
      if (task.rule === "pairs") {
        const columns = new Map();
        const along = task.axis === "cols" ? 0 : 1;
        for (const k of state.cells.keys())
          columns.set(k.split(",")[along], (columns.get(k.split(",")[along]) || 0) + 1);
        const pairs = [...columns.values()].filter((v) => v === 2).length;
        return u("roPairs", lang, { n, pairs, left: n - 2 * pairs });
      }
      return u("roPlaced", lang, { n });
    }
    if (!m.rows || !m.cols) return u("nothing", lang);
    if (kind === "prism")
      return u("roPrism", lang, {
        layers: counted(state.layers, "layer", lang),
        rows: counted(m.rows, "row", lang),
        cols: counted(m.cols, "col", lang),
        volume: counted(state.layers * m.area, "cube", lang),
      });
    if (kind === "scale")
      return u("roBuilt", lang, { rows: counted(m.rows, "row", lang), cols: counted(m.cols, "col", lang), area: m.area });
    if (counters) {
      const eq =
        round.show?.eq === "add" && m.rows <= 8
          ? `${Array(m.rows).fill(m.cols).join(" + ")} = ${m.area}`
          : `= ${m.area}`;
      return `${u("roCounters", lang, { rows: counted(m.rows, "row", lang), cols: m.cols })}: ${eq}`;
    }
    const base = u("roSquares", lang, {
      rows: counted(m.rows, "row", lang),
      cols: counted(m.cols, "col", lang),
      area: counted(m.area, "square", lang),
    });
    return round.show?.perim ? `${base} · ${u("roPerim", lang, { perim: m.perimeter })}` : base;
  }

  function cellState(r, c) {
    const k = cellKey(r, c);
    if (shape && !shape.has(k)) return "off";
    const v = paint ? state.cells.get(k) : r < state.rows && c < state.cols ? 1 : 0;
    return v ? `on${v}` : "empty";
  }

  function gridHtml() {
    const name = u(resizable ? "gridSize" : "gridPaint", lang, {
      rows: grid.rows,
      cols: grid.cols,
    });
    const active = `aa-c-${state.cursor.r}-${state.cursor.c}`;
    let out = `<div class="aa-grid aa-${counters ? "counters" : "squares"}" role="grid" tabindex="0" data-focus="grid" aria-label="${esc(name)}" aria-rowcount="${grid.rows}" aria-colcount="${grid.cols}" aria-activedescendant="${active}" style="--rows:${grid.rows};--cols:${grid.cols}">`;
    for (let r = 0; r < grid.rows; r += 1) {
      out += '<div role="row">';
      for (let c = 0; c < grid.cols; c += 1) {
        const st = cellState(r, c);
        const tool = st.startsWith("on") ? Number(st.slice(2)) : 0;
        const words =
          st === "off"
            ? u("stOff", lang)
            : tool
              ? toolCount > 1
                ? u("stTool", lang, { tool: TOOL_LETTERS[tool - 1] })
                : u("stFull", lang)
              : u("stEmpty", lang);
        const cls = [
          "aa-cell",
          tool ? `aa-on aa-t${tool}` : st === "off" ? "aa-off" : shape ? "aa-slot" : "",
          state.cursor.r === r && state.cursor.c === c ? "aa-cursor" : "",
        ].join(" ");
        const letter = tool && toolCount > 1 ? TOOL_LETTERS[tool - 1] : "";
        out += `<div role="gridcell" id="aa-c-${r}-${c}" class="${cls}" data-r="${r}" data-c="${c}" aria-selected="${tool ? "true" : "false"}"${st === "off" ? ' aria-disabled="true"' : ""} aria-label="${esc(u("cell", lang, { r: r + 1, c: c + 1, state: words }))}">${letter}</div>`;
      }
      out += "</div>";
    }
    return `${out}</div>`;
  }

  function controlsHtml() {
    if (paint) {
      if (toolCount < 2) return "";
      const buttons = Array.from(
        { length: toolCount },
        (_, i) =>
          `<button type="button" class="fm2-btn aa-tool aa-t${i + 1}" data-act="tool" data-v="${i + 1}" data-focus="tool:${i + 1}" aria-pressed="${state.tool === i + 1}">${esc(u("tool", lang, { tool: TOOL_LETTERS[i] }))}</button>`,
      ).join("");
      return `<div class="aa-controls" role="group" aria-label="${esc(u("toolLabel", lang))}">${buttons}</div>`;
    }
    let out = stepperHtml({
      id: "rows",
      label: u("rows", lang),
      value: state.rows,
      down: u("fewerRows", lang),
      up: u("moreRows", lang),
    });
    out += stepperHtml({
      id: "cols",
      label: u("cols", lang),
      value: state.cols,
      down: u("fewerCols", lang),
      up: u("moreCols", lang),
    });
    if (kind === "prism")
      out += stepperHtml({
        id: "layers",
        label: u("layers", lang),
        value: state.layers,
        down: u("fewerLayers", lang),
        up: u("moreLayers", lang),
      });
    return `<div class="aa-controls">${out}</div>`;
  }

  function fieldHtml() {
    const m = dims();
    if (tappable) return `<div class="aa-field">${gridHtml()}</div>`;
    return `<div class="aa-field aa-bigfield">${arraySvg(m.rows, m.cols, { counters, caption: `${m.rows} × ${m.cols}` })}<p class="aa-small">${esc(u("bigBoard", lang))}</p></div>`;
  }

  function originalHtml() {
    const label = u("original", lang, { rows: task.rows, cols: task.cols });
    return `<div class="aa-original">${arraySvg(task.rows, task.cols, { caption: label })}<p class="aa-small">${esc(label)}</p></div>`;
  }

  function extrasHtml() {
    let out = "";
    if (kind === "prism") {
      const m = dims();
      out += `<div class="aa-prism">${m.area ? prismSvg(m.rows, m.cols, state.layers, u("prismLabel", lang, { layers: state.layers, rows: m.rows, cols: m.cols })) : ""}</div>`;
    }
    if (round.ask) {
      if (round.ask.kind === "parity") {
        const pressed = (v) => `aria-pressed="${state.parity === v}"`;
        out += `<div class="aa-ask" role="group" aria-label="${esc(u("parity", lang))}"><span>${esc(u("parity", lang))}</span><button type="button" class="fm2-btn aa-opt" data-act="parity" data-v="even" data-focus="parity:even" ${pressed("even")}>${esc(u("even", lang))}</button><button type="button" class="fm2-btn aa-opt" data-act="parity" data-v="odd" data-focus="parity:odd" ${pressed("odd")}>${esc(u("odd", lang))}</button></div>`;
      } else {
        const label = u(
          { total: "askTotal", cols: "askCols", area: "askArea", volume: "askVolume" }[
            round.ask.kind
          ],
          lang,
        );
        out += `<label class="aa-ask"><span>${esc(label)}</span><input class="aa-input" data-ask data-focus="ask" type="text" inputmode="numeric" autocomplete="off" value="${esc(state.value)}"></label>`;
      }
    }
    if (kind === "scale") {
      const options = round.options
        .map(
          (v) =>
            `<button type="button" class="fm2-btn aa-opt" data-act="pick" data-v="${esc(v)}" data-focus="pick:${esc(v)}" aria-pressed="${state.pick === v}">${esc(u("pickOption", lang, { v }))}</button>`,
        )
        .join("");
      out += `<div class="aa-ask" role="group" aria-label="${esc(u("pickLabel", lang))}"><span>${esc(u("pickLabel", lang))}</span>${options}</div>`;
    }
    if (kind === "collect") {
      const chips = state.list
        .map(
          ([a, b], i) =>
            `<li class="aa-chip"><span class="aa-chip-art" aria-hidden="true">${arraySvg(a, b, { maxWidth: 90, caption: pairText(a, b), labels: false })}</span><span class="aa-chip-text">${pairText(a, b)}</span><button type="button" class="fm2-btn aa-chip-x" data-act="remove" data-i="${i}" data-focus="remove:${i}" aria-label="${esc(u("remove", lang, { pair: pairText(a, b) }))}">×</button></li>`,
        )
        .join("");
      out += `<div class="aa-listbox"><button type="button" class="fm2-btn" data-act="add" data-focus="add">${esc(u("addList", lang))}</button><h3 class="aa-list-title">${esc(u("myList", lang))}</h3>${chips ? `<ul class="aa-list">${chips}</ul>` : `<p class="aa-small">${esc(u("listEmpty", lang))}</p>`}</div>`;
    }
    return out;
  }

  function html() {
    const note = state.note ? esc(state.note) : "";
    return `<div class="aa-board${ctx.locked() ? " aa-locked" : ""}" data-kind="${kind}">
      <p class="aa-readout" data-readout>${esc(readout())}</p>
      ${kind === "scale" ? originalHtml() : ""}
      ${fieldHtml()}
      ${controlsHtml()}
      <div class="aa-extras">${extrasHtml()}</div>
      <p class="aa-note" role="status">${note}</p>
      <div class="aa-actions"><button type="button" class="fm2-btn" data-act="clear" data-focus="clear">${esc(u("clear", lang))}</button><button type="button" class="fm2-btn fm2-btn-primary" data-act="check" data-focus="check">${esc(u(kind === "collect" ? "checkList" : "check", lang))}</button></div>
    </div>`;
  }

  const render = () =>
    keepFocus(root, () => {
      root.innerHTML = html();
    });

  function response() {
    if (kind === "collect") return { list: state.list.map((p) => [...p]) };
    const out = { cells: figure() };
    if (state.value !== "") out.value = state.value;
    if (kind === "prism") out.layers = state.layers;
    if (kind === "scale") out.pick = state.pick;
    if (state.parity) out.parity = state.parity;
    return out;
  }

  function changed(message) {
    render();
    if (message) ctx.announce(message);
  }

  function setDims(rows, cols) {
    state.rows = clamp(rows, 0, grid.rows);
    state.cols = clamp(cols, 0, grid.cols);
    const m = dims();
    changed(
      m.area
        ? u("announceDims", lang, { rows: counted(m.rows, "row", lang), cols: counted(m.cols, "col", lang), area: m.area })
        : u("nothing", lang),
    );
  }

  function applyCell(r, c, set) {
    if (paint) {
      const k = cellKey(r, c);
      if (shape && !shape.has(k)) return;
      if (set) state.cells.set(k, set);
      else state.cells.delete(k);
      state.cursor = { r, c };
      changed(u("announceTile", lang, { n: state.cells.size }));
    } else {
      state.cursor = { r, c };
      setDims(r + 1, c + 1);
    }
  }

  function toggleAt(r, c) {
    const current = state.cells.get(cellKey(r, c));
    return paint ? (current === state.tool ? 0 : state.tool) : 1;
  }

  function step(id, delta) {
    const now = id === "rows" ? state.rows : id === "cols" ? state.cols : state.layers;
    commit(id, now + delta);
  }

  function commit(id, value) {
    if (id === "layers") {
      state.layers = clamp(value, 1, MAX_LAYERS);
      const m = dims();
      changed(u("announceLayers", lang, { layers: counted(state.layers, "layer", lang), volume: counted(state.layers * m.area, "cube", lang) }));
    } else if (id === "rows") setDims(value, state.cols);
    else setDims(state.rows, value);
  }

  function addToList() {
    if (!state.rows || !state.cols) {
      state.note = u("buildFirst", lang);
      return changed(state.note);
    }
    const pair = pairText(state.rows, state.cols);
    if (state.list.some(([a, b]) => pairKey(a, b) === pairKey(state.rows, state.cols))) {
      state.note = u(task.mode === "factors" ? "duplicate" : "duplicateTurn", lang, { pair });
      return changed(state.note);
    }
    state.list.push([state.rows, state.cols]);
    state.note = u("added", lang, { pair, n: state.list.length });
    changed(state.note);
  }

  function onClick(event) {
    const cell = event.target.closest(".aa-cell");
    if (cell) {
      if (event.timeStamp - lastPointer < 600 || ctx.locked() || cell.classList.contains("aa-off"))
        return;
      const r = Number(cell.dataset.r);
      const c = Number(cell.dataset.c);
      return applyCell(r, c, toggleAt(r, c));
    }
    const button = event.target.closest("[data-act]");
    if (!button || ctx.locked()) return;
    const { act, id, v, i } = button.dataset;
    if (act === "inc" || act === "dec") return step(id, act === "inc" ? 1 : -1);
    if (act === "tool") {
      state.tool = Number(v);
      return changed();
    }
    if (act === "parity") {
      state.parity = v;
      return changed();
    }
    if (act === "pick") {
      state.pick = v;
      return changed();
    }
    if (act === "add") return addToList();
    if (act === "remove") {
      const [a, b] = state.list.splice(Number(i), 1)[0];
      state.note = u("removed", lang, { pair: pairText(a, b) });
      return changed(state.note);
    }
    if (act === "clear") {
      Object.assign(state, {
        rows: 0,
        cols: 0,
        layers: 1,
        value: "",
        parity: null,
        pick: null,
        note: "",
        list: [],
      });
      state.cells.clear();
      return changed(u("cleared", lang));
    }
    if (act === "check") {
      state.note = "";
      ctx.submit(response());
    }
  }

  function onPointerDown(event) {
    const cell = event.target.closest(".aa-cell");
    if (
      !cell ||
      ctx.locked() ||
      cell.classList.contains("aa-off") ||
      (event.pointerType === "mouse" && event.button !== 0)
    )
      return;
    lastPointer = event.timeStamp;
    const r = Number(cell.dataset.r);
    const c = Number(cell.dataset.c);
    stroke = { set: toggleAt(r, c) };
    applyCell(r, c, stroke.set);
    root.querySelector(".aa-grid")?.focus({ preventScroll: true });
  }

  function onPointerMove(event) {
    if (!stroke) return;
    const cell = document.elementFromPoint(event.clientX, event.clientY)?.closest?.(".aa-cell");
    if (!cell || cell.classList.contains("aa-off")) return;
    const r = Number(cell.dataset.r);
    const c = Number(cell.dataset.c);
    if (
      paint
        ? state.cells.get(cellKey(r, c)) === stroke.set ||
          (!stroke.set && !state.cells.has(cellKey(r, c)))
        : state.rows === r + 1 && state.cols === c + 1
    )
      return;
    applyCell(r, c, stroke.set);
  }

  const onPointerEnd = () => {
    stroke = null;
  };

  function onKey(event) {
    if (!event.target.classList?.contains("aa-grid") || ctx.locked()) return;
    const moves = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    const { r, c } = state.cursor;
    if (moves[event.key]) {
      event.preventDefault();
      const next = {
        r: clamp(r + moves[event.key][0], 0, grid.rows - 1),
        c: clamp(c + moves[event.key][1], 0, grid.cols - 1),
      };
      state.cursor = next;
      if (event.shiftKey && paint && !(shape && !shape.has(cellKey(next.r, next.c)))) {
        state.cells.set(cellKey(next.r, next.c), state.tool);
        return changed(u("announceTile", lang, { n: state.cells.size }));
      }
      return changed();
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (shape && !shape.has(cellKey(r, c))) return;
      return applyCell(r, c, toggleAt(r, c));
    }
    if ((event.key === "Delete" || event.key === "Backspace") && paint) {
      event.preventDefault();
      return applyCell(r, c, 0);
    }
    if (/^[1-7]$/.test(event.key) && Number(event.key) <= toolCount && paint) {
      state.tool = Number(event.key);
      changed();
    }
  }

  function onChange(event) {
    const input = event.target.closest(".aa-step-input");
    if (!input || ctx.locked()) return;
    const value = intOf(input.value);
    commit(
      input.dataset.id,
      value === null
        ? input.dataset.id === "rows"
          ? state.rows
          : input.dataset.id === "cols"
            ? state.cols
            : state.layers
        : value,
    );
  }

  const onInput = (event) => {
    if (event.target.matches("[data-ask]")) state.value = event.target.value;
  };

  const listeners = [
    ["click", onClick],
    ["pointerdown", onPointerDown],
    ["pointermove", onPointerMove],
    ["pointerup", onPointerEnd],
    ["pointercancel", onPointerEnd],
    ["keydown", onKey],
    ["change", onChange],
    ["input", onInput],
    ["focusin", selectInput],
  ];
  for (const [name, fn] of listeners) root.addEventListener(name, fn);
  render();
  ctx.onLock?.(render);

  return {
    destroy() {
      for (const [name, fn] of listeners) root.removeEventListener(name, fn);
    },
    setLang(next) {
      lang = next;
      if (state.note && /./.test(state.note)) state.note = "";
      render();
    },
  };
}

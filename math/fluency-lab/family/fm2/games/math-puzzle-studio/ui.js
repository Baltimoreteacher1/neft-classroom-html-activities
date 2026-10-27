// The puzzle board: pick up a tile (tap, or drag), put it in an empty spot, tap a placed tile to take it back.
// Everything is a real button, so the keyboard path is the same as the touch path: Enter or Space picks up and
// places, the arrow keys move between spots, and Backspace clears a spot. All work lives in `state`, so a language
// switch redraws the labels without losing a single tile. @fm2 FM-017 FM-021 FM-040 FM-015 FM-078
import { escapeHtml, tx } from "../../lang.js";
import { UI } from "./copy.js";
import { readScales } from "./logic.js";
import { openCells, show, tileById } from "./rules.js";
import { boardHtml } from "./ui-boards.js";
import { slotName, tileAria, tileLabel } from "./ui-names.js";
import { readingText } from "./ui-scale-view.js";
import { mountEquationScale } from "./ui-eqscale.js";

const esc = escapeHtml;

// Move focus to the nearest slot in a direction, judged by where the slots really are on the screen.
function neighbour(from, dir, all) {
  const a = from.getBoundingClientRect();
  const cx = a.left + a.width / 2;
  const cy = a.top + a.height / 2;
  let best = null;
  let bestScore = Infinity;
  for (const el of all) {
    if (el === from) continue;
    const b = el.getBoundingClientRect();
    const dx = b.left + b.width / 2 - cx;
    const dy = b.top + b.height / 2 - cy;
    const along = dir === "right" ? dx : dir === "left" ? -dx : dir === "down" ? dy : -dy;
    const across = dir === "right" || dir === "left" ? Math.abs(dy) : Math.abs(dx);
    if (along <= 2) continue;
    const score = along + across * 2;
    if (score < bestScore) {
      best = el;
      bestScore = score;
    }
  }
  return best;
}
const ARROWS = { ArrowRight: "right", ArrowLeft: "left", ArrowDown: "down", ArrowUp: "up" };

function mountPlace(root, ctx) {
  const round = ctx.round;
  let lang = ctx.lang;
  let alive = true;
  const state = {
    put: round.cells.map(() => null),
    sel: null,
    history: [],
    xs: round.xs ?? 1,
    msg: "",
    done: false,
  };
  const t = (copy, vars) => tx(copy, lang, vars);
  const locked = () => state.done || Boolean(ctx.locked?.());
  const tile = (id) => tileById(round, id);
  const placedIds = () => new Set(state.put.filter(Boolean));

  const view = {
    round,
    state,
    get lang() {
      return lang;
    },
    t,
    esc,
    locked,
    slot(i) {
      const id = state.put[i];
      const tl = id ? tile(id) : null;
      const label = tl ? tileAria(tl, lang) : t(UI.empty);
      return `<button type="button" class="pz-slot${tl ? " is-filled" : ""}${state.sel && !tl ? " is-ready" : ""}${round.cells[i].type ? ` pz-slot-${round.cells[i].type}` : ""}" data-pz-slot="${i}" data-pz-key="slot-${i}" aria-label="${esc(slotName(round, i, lang))}: ${esc(label)}" ${locked() ? "disabled" : ""}>${tl ? esc(tileLabel(tl)) : '<span aria-hidden="true">?</span>'}</button>`;
    },
    cell(i, cls = "") {
      const c = round.cells[i];
      if (c.v === null) return view.slot(i);
      return `<span class="pz-cell pz-given ${cls}" data-pz-given="${i}">${esc(show(c.v))}</span>`;
    },
  };

  function tray() {
    const used = round.reuse ? new Set() : placedIds();
    const tiles = round.pool
      .map((tl) => {
        const dis = locked() || used.has(tl.id);
        const sel = state.sel === tl.id;
        return `<button type="button" class="pz-tile pz-tile-${tl.kind || "num"}${sel ? " is-selected" : ""}" data-pz-tile="${tl.id}" data-pz-key="tile-${tl.id}" aria-pressed="${sel}" aria-label="${esc(tileAria(tl, lang))}" draggable="${dis ? "false" : "true"}" ${dis ? "disabled" : ""}>${esc(tileLabel(tl))}</button>`;
      })
      .join("");
    return `<div class="pz-tray" role="group" aria-label="${esc(t(UI.tiles))}">${tiles}</div>`;
  }

  function render(focus) {
    const key = focus ?? document.activeElement?.dataset?.pzKey;
    const off = locked() ? "disabled" : "";
    root.innerHTML = `<div class="pz" data-pz data-layout="${round.layout}">
      <p class="pz-tip">${esc(t(UI.tip))}</p>
      <div class="pz-board" role="group" aria-label="${esc(t(UI.board))}">${boardHtml(view)}</div>
      ${tray()}
      <div class="pz-actions">
        <button type="button" class="fm2-btn" data-pz-undo data-pz-key="undo" ${off || !state.history.length ? "disabled" : ""}>${esc(t(UI.undo))}</button>
        <button type="button" class="fm2-btn fm2-btn-quiet" data-pz-clear data-pz-key="clear" ${off}>${esc(t(UI.clear))}</button>
        <button type="button" class="fm2-btn fm2-btn-primary pz-check" data-pz-check data-pz-key="check" ${off}>${esc(t(UI.check))}</button>
      </div>
      <p class="pz-msg" role="status" data-pz-msg>${esc(state.msg)}</p>
    </div>`;
    if (key) root.querySelector(`[data-pz-key="${key}"]`)?.focus({ preventScroll: true });
  }

  // What the board says after a change: for a scale, the exact reading of every pan.
  function reading() {
    if (!round.scales) return "";
    return readScales(round, state.put, state.xs)
      .map((r) => readingText(r, lang, round.unit))
      .join(" ");
  }
  const say = (text) => ctx.announce?.([text, reading()].filter(Boolean).join(" "));
  const label = (id) => tileAria(tile(id), lang);

  function remember() {
    state.history.push([...state.put]);
  }

  function place(i, id) {
    const want = round.cells[i].type;
    if (want && tile(id).kind !== want) {
      state.msg = t(want === "op" ? UI.wrongOpSpot : UI.wrongNumberSpot);
      render(`slot-${i}`);
      return;
    }
    remember();
    state.put[i] = id;
    state.sel = null;
    state.msg = "";
    render(`slot-${i}`);
    say(t(UI.placed, { tile: label(id), spot: slotName(round, i, lang) }));
  }

  function take(i) {
    const id = state.put[i];
    remember();
    state.put[i] = null;
    state.msg = "";
    render(`slot-${i}`);
    say(t(UI.removed, { tile: label(id), spot: slotName(round, i, lang) }));
  }

  function pickTile(id) {
    state.sel = state.sel === id ? null : id;
    state.msg = "";
    render(`tile-${id}`);
    if (state.sel) ctx.announce?.(t(UI.selected, { tile: label(id) }));
  }

  function submit() {
    if (openCells(round).some((i) => !state.put[i])) {
      state.msg = t(UI.fillAll);
      render("check");
      return;
    }
    const result = ctx.submit({ put: [...state.put] });
    if (result.correct) {
      state.done = true;
      state.sel = null;
    }
    state.msg = "";
    render(result.correct ? undefined : "check");
  }

  function undo() {
    const before = state.history.pop();
    if (!before) return;
    state.put = before;
    state.sel = null;
    state.msg = "";
    render("undo");
    say(t(UI.undone));
  }

  function clear() {
    if (!state.put.some(Boolean)) return;
    remember();
    state.put = round.cells.map(() => null);
    state.sel = null;
    state.msg = "";
    render("clear");
    say(t(UI.cleared));
  }

  function stepX(delta) {
    const [lo, hi] = round.xRange;
    state.xs = Math.min(hi, Math.max(lo, state.xs + delta));
    render(delta < 0 ? "xdown" : "xup");
    ctx.announce?.(`${t(UI.sampleX)} ${state.xs}. ${reading()}`);
  }

  function onClick(event) {
    if (!alive || locked()) return;
    const hit = (selector) => event.target.closest(selector);
    const tileBtn = hit("[data-pz-tile]");
    const slotBtn = hit("[data-pz-slot]");
    if (tileBtn) pickTile(tileBtn.dataset.pzTile);
    else if (slotBtn) {
      const i = Number(slotBtn.dataset.pzSlot);
      if (state.sel) place(i, state.sel);
      else if (state.put[i]) take(i);
    } else if (hit("[data-pz-undo]")) undo();
    else if (hit("[data-pz-clear]")) clear();
    else if (hit("[data-pz-check]")) submit();
    else if (hit("[data-pz-xdown]")) stepX(-1);
    else if (hit("[data-pz-xup]")) stepX(1);
  }

  function onKeydown(event) {
    if (!alive || locked()) return;
    const slotBtn = event.target.closest?.("[data-pz-slot]");
    const tileBtn = event.target.closest?.("[data-pz-tile]");
    if (event.key === "Escape" && state.sel) {
      state.sel = null;
      render();
    } else if (slotBtn && (event.key === "Backspace" || event.key === "Delete")) {
      event.preventDefault();
      const i = Number(slotBtn.dataset.pzSlot);
      if (state.put[i]) take(i);
    } else if (ARROWS[event.key] && (slotBtn || tileBtn)) {
      const all = [
        ...root.querySelectorAll(
          slotBtn ? "[data-pz-slot]:not(:disabled)" : "[data-pz-tile]:not(:disabled)",
        ),
      ];
      const next = neighbour(event.target, ARROWS[event.key], all);
      if (next) {
        event.preventDefault();
        next.focus();
      }
    }
  }

  function onDragStart(event) {
    const btn = event.target.closest?.("[data-pz-tile]");
    if (!alive || locked() || !btn) return;
    event.dataTransfer?.setData("text/plain", btn.dataset.pzTile);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
  }
  const onDragOver = (event) => {
    if (alive && !locked() && event.target.closest?.("[data-pz-slot]")) event.preventDefault();
  };
  function onDrop(event) {
    const slotBtn = event.target.closest?.("[data-pz-slot]");
    const id = event.dataTransfer?.getData("text/plain");
    if (!alive || locked() || !slotBtn || !id || !tile(id)) return;
    event.preventDefault();
    place(Number(slotBtn.dataset.pzSlot), id);
  }

  const listeners = [
    ["click", onClick],
    ["keydown", onKeydown],
    ["dragstart", onDragStart],
    ["dragover", onDragOver],
    ["drop", onDrop],
  ];
  for (const [name, fn] of listeners) root.addEventListener(name, fn);
  // The round ends by a correct answer or by Show me; either way the board stops accepting tiles.
  ctx.onLock?.(() => {
    if (!alive) return;
    state.done = true;
    state.sel = null;
    render();
  });
  render();
  return {
    destroy() {
      alive = false;
      for (const [name, fn] of listeners) root.removeEventListener(name, fn);
      root.innerHTML = "";
    },
    setLang(next) {
      lang = next;
      render();
    },
  };
}

export const mount = (root, ctx) =>
  ctx.round.kind === "scale" ? mountEquationScale(root, ctx) : mountPlace(root, ctx);

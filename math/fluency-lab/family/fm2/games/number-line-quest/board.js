// The interactive number-line board: the drawn figure (art/lines.js) with real slider handles laid over it. Handles are
// focusable role="slider" elements 48px square; they move by dragging (pointer capture, so touch and mouse behave alike),
// by tapping the line, and by keys (arrows one step, Shift or Page keys ten steps, Home and End, Enter to submit).
// Positions are whole-number step indexes, so every marker value is an exact rational. @fm2 FM-012 FM-038 FM-039 FM-040
import { PAD, numberLineSvg } from "../../art/lines.js";
import { add, frac, mul, toNumber } from "../../rational.js";
import { gridCount } from "./geometry.js";

const LANE = 30;
const HIT = 48;
const HEAD = 14;

export function createBoard(host, initial) {
  let cfg = { markers: [], marks: [], arcs: [], labels: [], tap: true, ...initial };
  const abort = new AbortController();
  const root = document.createElement("div");
  root.className = "nlq-board";
  const figure = document.createElement("div");
  figure.className = "nlq-figure";
  root.append(figure);
  host.append(root);
  let width = 0;
  let active = 0;
  let drag = null;
  const handles = [];

  const count = () => gridCount(cfg.min, cfg.max, cfg.step);
  const maxK = () => count() - (cfg.sliceMode ? 1 : 0);
  const valueAt = (k) => add(cfg.min, mul(cfg.step, frac(k)));
  const lanes = () => Math.max(1, cfg.markers.length);
  const baseline = () => (cfg.markers.length ? 80 + (lanes() - 1) * LANE : 112);
  const xOf = (k) => PAD + ((width - 2 * PAD) * k) / count();
  const headY = (i) => baseline() - 40 - i * LANE;
  const locked = () => Boolean(cfg.locked?.());

  function place(i) {
    const marker = cfg.markers[i];
    const el = handles[i];
    if (!marker || !el) return;
    const value = valueAt(marker.k);
    el.style.left = `${xOf(marker.k) - HIT / 2}px`;
    el.style.top = `${headY(i) - HIT / 2}px`;
    el.firstElementChild.nextElementSibling.style.height = `${baseline() - headY(i) - HEAD}px`;
    el.setAttribute("aria-label", marker.name);
    el.setAttribute("aria-valuemin", String(toNumber(cfg.min)));
    el.setAttribute("aria-valuemax", String(toNumber(valueAt(maxK()))));
    el.setAttribute("aria-valuenow", String(toNumber(value)));
    el.setAttribute("aria-valuetext", cfg.valueText(i, value));
    el.classList.toggle("is-active", i === active);
    el.firstElementChild.textContent = marker.letter ?? "";
  }

  function drawFigure() {
    figure.innerHTML = numberLineSvg({
      width,
      min: cfg.min,
      max: cfg.max,
      ticks: cfg.ticks,
      labels: cfg.labels,
      text: cfg.labelText,
      marks: cfg.marks,
      arcs: cfg.arcs,
      bracket: cfg.bracket,
      baseline: baseline(),
      aria: cfg.aria,
    });
    root.style.height = `${baseline() + 46}px`;
  }

  function layout() {
    width = Math.max(260, Math.min(760, Math.floor(host.clientWidth || 640)));
    root.style.width = `${width}px`;
    drawFigure();
    cfg.markers.forEach((_, i) => place(i));
  }

  function setK(i, k, source = "api") {
    const next = Math.min(maxK(), Math.max(0, k));
    if (next === cfg.markers[i].k && source !== "api") return;
    cfg.markers[i].k = next;
    place(i);
    cfg.onMove?.(i, next, source);
  }

  function activate(i) {
    active = i;
    cfg.markers.forEach((_, j) => place(j));
    cfg.onActivate?.(i);
  }

  const kFromEvent = (event) => {
    const rect = root.getBoundingClientRect();
    return Math.round(((event.clientX - rect.left - PAD) / (width - 2 * PAD)) * count());
  };

  function buildHandles() {
    handles.splice(0).forEach((el) => el.remove());
    cfg.markers.forEach((_, i) => {
      const el = document.createElement("div");
      el.className = "nlq-handle";
      el.dataset.i = String(i);
      el.setAttribute("role", "slider");
      el.setAttribute("tabindex", "0");
      el.setAttribute("aria-orientation", "horizontal");
      el.innerHTML = `<span class="nlq-head" aria-hidden="true"></span><i class="nlq-stem" aria-hidden="true"></i>`;
      el.addEventListener("focus", () => i !== active && activate(i), { signal: abort.signal });
      el.addEventListener(
        "keydown",
        (event) => {
          if (locked() || event.altKey || event.ctrlKey || event.metaKey) return;
          const big = event.shiftKey ? 10 : 1;
          const moves = {
            ArrowRight: big,
            ArrowUp: big,
            ArrowLeft: -big,
            ArrowDown: -big,
            PageUp: 10,
            PageDown: -10,
          };
          const k = cfg.markers[i].k;
          if (event.key === "Enter") {
            event.preventDefault();
            cfg.onSubmit?.();
          } else if (event.key === "Home" || event.key === "End") {
            event.preventDefault();
            setK(i, event.key === "Home" ? 0 : maxK(), "key");
          } else if (event.key in moves) {
            event.preventDefault();
            setK(i, k + moves[event.key], "key");
          }
        },
        { signal: abort.signal },
      );
      root.append(el);
      handles.push(el);
    });
  }

  const release = (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const { i } = drag;
    drag = null;
    cfg.onMove?.(i, cfg.markers[i].k, "release");
  };
  root.addEventListener(
    "pointerdown",
    (event) => {
      if (locked() || event.button > 0 || !cfg.markers.length) return;
      const handle = event.target.closest(".nlq-handle");
      if (!handle && !cfg.tap) return;
      const i = handle ? Number(handle.dataset.i) : active;
      if (i !== active) activate(i);
      drag = { i, id: event.pointerId };
      (handle || handles[i]).setPointerCapture?.(event.pointerId);
      setK(i, kFromEvent(event), "pointer");
      event.preventDefault();
    },
    { signal: abort.signal },
  );
  root.addEventListener(
    "pointermove",
    (event) => drag && event.pointerId === drag.id && setK(drag.i, kFromEvent(event), "pointer"),
    { signal: abort.signal },
  );
  root.addEventListener("pointerup", release, { signal: abort.signal });
  root.addEventListener("pointercancel", release, { signal: abort.signal });

  buildHandles();
  layout();
  let observed = 0;
  if (typeof ResizeObserver === "function") {
    const observer = new ResizeObserver(() => {
      const next = Math.floor(host.clientWidth);
      if (next && Math.abs(next - observed) > 1) {
        observed = next;
        layout();
      }
    });
    observer.observe(host);
    abort.signal.addEventListener("abort", () => observer.disconnect());
  }

  return {
    el: root,
    get active() {
      return active;
    },
    getK: (i) => cfg.markers[i].k,
    valueAt,
    maxK,
    setK,
    activate,
    focus: (i) => handles[i]?.focus(),
    // Replace any part of the configuration (labels after a language switch, a new zoom window, hop arcs).
    set(patch) {
      const rebuild = "markers" in patch && patch.markers.length !== cfg.markers.length;
      cfg = { ...cfg, ...patch };
      if (rebuild) {
        buildHandles();
        active = Math.min(active, Math.max(0, cfg.markers.length - 1));
      }
      layout();
    },
    destroy() {
      abort.abort();
      root.remove();
    },
  };
}

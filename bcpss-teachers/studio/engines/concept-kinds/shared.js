// DOM helpers shared by the concept-builder kinds: SVG building, pointer dragging, live announcements.
import { h } from "../../core/dom.js";

const NS = "http://www.w3.org/2000/svg";

/** svg("circle", {cx:1}, child...) -> SVGElement. Falsy attrs are skipped; on* functions become listeners. */
export function svg(tag, attrs = {}, ...kids) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === false || v == null) continue;
    if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === "class") el.setAttribute("class", v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false) continue;
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

/** Client pixel -> SVG user units. */
export function toSvgPoint(root, ev) {
  const pt = root.createSVGPoint();
  pt.x = ev.clientX;
  pt.y = ev.clientY;
  const m = root.getScreenCTM();
  return m ? pt.matrixTransform(m.inverse()) : { x: 0, y: 0 };
}

/**
 * Pointer dragging with capture, for mouse, pen and touch.
 * onMove(ev) receives each pointermove; onEnd(ev, moved) when released. Returns a cleanup function.
 */
export function draggable(el, { onStart, onMove, onEnd }) {
  let active = null;
  const down = (ev) => {
    if (ev.button != null && ev.button !== 0) return;
    active = { id: ev.pointerId, moved: false };
    try {
      el.setPointerCapture(ev.pointerId);
    } catch {
      /* capture is best effort */
    }
    onStart?.(ev);
    ev.preventDefault();
  };
  const move = (ev) => {
    if (!active || ev.pointerId !== active.id) return;
    active.moved = true;
    onMove?.(ev);
  };
  const up = (ev) => {
    if (!active || ev.pointerId !== active.id) return;
    const moved = active.moved;
    active = null;
    onEnd?.(ev, moved);
  };
  el.addEventListener("pointerdown", down);
  el.addEventListener("pointermove", move);
  el.addEventListener("pointerup", up);
  el.addEventListener("pointercancel", up);
  el.style.touchAction = "none";
  return () => {
    el.removeEventListener("pointerdown", down);
    el.removeEventListener("pointermove", move);
    el.removeEventListener("pointerup", up);
    el.removeEventListener("pointercancel", up);
  };
}

export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

/** A real button, 44px target via CSS class st-cb-btn. */
export const btn = (label, onclick, { cls = "", attrs = {} } = {}) =>
  h("button", { type: "button", class: `st-cb-btn ${cls}`.trim(), onclick, ...attrs }, label);

/** Stepper: label, minus, readout, plus. Returns {el, set(v)}. */
export function stepper({ label, min, max, value, onChange, unit = "", disabled = false }) {
  let v = value;
  const out = h("output", { class: "st-cb-step-val", "aria-live": "polite" }, String(v));
  const minus = btn("-", () => go(v - 1), { cls: "st-cb-small", attrs: { "aria-label": `Decrease ${label}` } });
  const plus = btn("+", () => go(v + 1), { cls: "st-cb-small", attrs: { "aria-label": `Increase ${label}` } });
  const sync = () => {
    out.textContent = unit ? `${v} ${unit}` : String(v);
    minus.disabled = disabled || v <= min;
    plus.disabled = disabled || v >= max;
  };
  const go = (n) => {
    n = clamp(n, min, max);
    if (n === v) return;
    v = n;
    sync();
    onChange(v);
  };
  sync();
  const el = h("div", { class: "st-cb-stepper", role: "group", "aria-label": label }, h("span", { class: "st-cb-step-label" }, label), minus, out, plus);
  return {
    el,
    set(n) {
      v = n;
      sync();
    },
  };
}

/** Keys that move a slider-like control by -1/+1 steps and +-big. Returns delta in steps, "home", "end" or null. */
export function sliderKey(ev, big = 4) {
  switch (ev.key) {
    case "ArrowLeft":
    case "ArrowDown":
      return -1;
    case "ArrowRight":
    case "ArrowUp":
      return 1;
    case "PageDown":
      return -big;
    case "PageUp":
      return big;
    case "Home":
      return "home";
    case "End":
      return "end";
    default:
      return null;
  }
}

/** Deep-ish clone for plain JSON state. */
export const clone = (v) => JSON.parse(JSON.stringify(v));

/** End a sentence once: item and label texts often end in a period already. */
export const sentence = (text) => {
  const t = String(text ?? "").trim();
  return /[.!?]$/.test(t) ? t : `${t}.`;
};

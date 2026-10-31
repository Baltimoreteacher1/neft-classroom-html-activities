/* Shared pieces for the hands-on math models: a polite status line, a +/- stepper and a number formatter.
 * Every model follows the same contract: mount(host, K, opts) returns { get, set, destroy } and calls opts.onChange(state). */
import { h } from "./core.js";

/** A polite live status line. say(text) announces one short sentence. */
export function statusLine() {
  const el = h("p", { class: "m-status", role: "status", "aria-live": "polite" });
  return { el, say: (text) => (el.textContent = text) };
}

/** A labelled - value + control with 48px buttons. */
export function stepper(K, label, { min, max, value, format = String, onChange, step = 1 }) {
  let v = value;
  const out = h("output", { class: "m-step-val", "aria-live": "off" }, format(v));
  const minus = h(
    "button",
    { type: "button", class: "m-step-btn", "aria-label": `${K.plain(label)} −` },
    "−",
  );
  const plus = h(
    "button",
    { type: "button", class: "m-step-btn", "aria-label": `${K.plain(label)} +` },
    "+",
  );
  const paint = () => {
    out.textContent = format(v);
    minus.disabled = v <= min;
    plus.disabled = v >= max;
  };
  const set = (next, silent) => {
    v = Math.max(min, Math.min(max, next));
    paint();
    if (!silent) onChange?.(v);
  };
  minus.addEventListener("click", () => set(v - step));
  plus.addEventListener("click", () => set(v + step));
  const el = h(
    "div",
    { class: "m-stepper", role: "group", "aria-label": K.plain(label) },
    K.bi("span", label, "m-step-label"),
    h("div", { class: "m-step-row" }, minus, out, plus),
  );
  paint();
  return { el, get: () => v, set };
}

/** Trim floating-point noise: 0.30000000000000004 -> "0.3". */
export const fmt = (n) => String(Number(Number(n).toFixed(2)));

/** A button with a bilingual label. */
export function modelButton(K, pair, onClick, className = "m-btn") {
  const b = h("button", { type: "button", class: className });
  b.append(K.bi("span", pair));
  b.addEventListener("click", onClick);
  return b;
}

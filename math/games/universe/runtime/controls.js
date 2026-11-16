// Native console controls shared by every universe game's instrument panels.

import { el } from "./chrome.js";

/**
 * A − value + stepper with a live output. `g` supplies t() and the tick sound.
 * `inc` is the step size (halves for quartiles); values are kept exact to 1/1000.
 */
export function stepper(g, label, get, set, min, max, inc = 1) {
  const out = el("output", null, String(get()));
  const step = (d) => () => {
    const v = Math.max(min, Math.min(max, Math.round((get() + d * inc) * 1000) / 1000));
    if (v === get()) return;
    set(v);
    out.textContent = String(v);
    g.audio.sfx("tick");
  };
  return el(
    "div.stepper",
    null,
    el("span", null, label),
    el("button", { type: "button", "aria-label": g.t("less"), on: { click: step(-1) } }, "−"),
    out,
    el("button", { type: "button", "aria-label": g.t("more"), on: { click: step(1) } }, "+"),
  );
}

/** A row of toggle chips; `isOn(option, index)` marks the pressed one. */
export function chips(options, isOn, pick) {
  const row = el("div.chips");
  const paint = () => {
    row.textContent = "";
    options.forEach((o, i) =>
      row.append(
        el(
          "button",
          {
            type: "button",
            "aria-pressed": String(isOn(o, i)),
            on: {
              click: () => {
                pick(o, i);
                paint();
              },
            },
          },
          o.label,
        ),
      ),
    );
  };
  paint();
  return row;
}

/** A plain action button. */
export function action(label, onClick, cls = "") {
  return el(`button${cls}`, { type: "button", on: { click: onClick } }, label);
}

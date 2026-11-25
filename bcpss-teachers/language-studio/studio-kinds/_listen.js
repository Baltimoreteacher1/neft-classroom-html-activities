// Listening Lab controls shared by dictogloss and listen_and_show: replay counter, speed choice, transcript toggle.
// Not a kind itself. On-device speech only; nothing here keeps time or shows a clock.
import { h } from "../studio-core.js";

/** The words are shown from the start for WIDA levels 1-2 and hidden (one tap to show) for levels 3-6. */
export const transcriptDefault = (level) => level === "l1_2";

/** "Not played yet" / "Played 1 time" / "Played 3 times". Call set(n) after every listen. */
export function playCounter(n = 0) {
  const el = h("p", { class: "ll-plays", "data-key": "plays", "aria-live": "polite" });
  const set = (count) => {
    el.dataset.count = String(count);
    el.textContent = count ? `Played ${count} ${count === 1 ? "time" : "times"}` : "Not played yet";
  };
  set(n);
  return { el, set };
}

/**
 * Show / hide the words. `available` false (no speech on this device) forces the words on and removes the toggle,
 * so a student is never left with nothing to read. Returns { el, caption, visible() }; put `caption` where the
 * words should appear (it is already inside `el`).
 */
export function transcriptToggle({ text, level, available = true, caption = null }) {
  const cap = caption || h("p", { class: "sl-caption", id: "slCaption", text });
  const on = { v: !available || transcriptDefault(level) };
  const btn = h("button", {
    type: "button",
    class: "st-btn st-btn--ghost sl-btn ll-transcript",
    "data-key": "transcript",
    "aria-pressed": String(on.v),
  });
  const paint = () => {
    cap.hidden = !on.v;
    btn.setAttribute("aria-pressed", String(on.v));
    btn.textContent = on.v ? "Hide transcript" : "Show transcript";
  };
  btn.addEventListener("click", () => {
    on.v = !on.v;
    paint();
  });
  paint();
  const note = available
    ? null
    : h("p", {
        class: "sl-note",
        text: "Audio is not available on this device. Read the words instead.",
      });
  return { el: h("div", { class: "ll-text" }, available ? btn : null, note, cap), caption: cap, visible: () => on.v };
}

/** Slow / Natural speed choice. Auto (nothing pressed) means slow the first time, then natural. */
export function speedControl(slowRate, naturalRate) {
  let mode = "auto";
  const mk = (id, label) =>
    h("button", {
      type: "button",
      class: "st-btn st-btn--ghost st-btn--sm ll-speed__btn",
      "data-key": `speed-${id}`,
      "aria-pressed": "false",
      text: label,
    });
  const slow = mk("slow", "Slow");
  const natural = mk("natural", "Natural");
  const paint = () => {
    slow.setAttribute("aria-pressed", String(mode === "slow"));
    natural.setAttribute("aria-pressed", String(mode === "natural"));
  };
  const pick = (m) => () => {
    mode = mode === m ? "auto" : m;
    paint();
  };
  slow.addEventListener("click", pick("slow"));
  natural.addEventListener("click", pick("natural"));
  const el = h(
    "div",
    { class: "ll-speed", role: "group", "aria-label": "Speaking speed" },
    h("span", { class: "ll-speed__label", text: "Speed" }),
    slow,
    natural,
  );
  return {
    el,
    mode: () => mode,
    rate: (timesHeard) =>
      mode === "slow" ? slowRate : mode === "natural" ? naturalRate : timesHeard === 0 ? slowRate : naturalRate,
  };
}

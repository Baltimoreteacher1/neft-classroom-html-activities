// Controls under the field. Each control is a slider plus a number box plus minus/plus buttons, so the same change
// can be made by dragging, typing, tapping or keyboard. Built once per mission; updated in place so focus is kept.
import { h } from "../graphics/graphics-a-ui.js";
import { frac, LIMITS, scaleField } from "./stadium-math.js";

const SPEC = {
  length: { label: "Length (m)", step: 5 },
  width: { label: "Width (m)", step: 5 },
  sections: { label: "Sections", step: 1 },
  seatsPerSection: { label: "Seats in each section", step: 1 },
  sold: { label: "Tickets sold", step: 1 },
};

export const CONTROL_LABELS = [...Object.values(SPEC).map((spec) => spec.label), "Make both sides ×2", "Make both sides ×3", "Make both sides ÷2", "Undo"];

export function buildControls(host, mission, t, dispatch) {
  host.replaceChildren();
  const refs = {};
  for (const key of mission.controls) {
    if (key === "scale") continue;
    const spec = { ...SPEC[key], label: mission.labels?.[key] ?? SPEC[key].label };
    const id = `rl-c-${key}`;
    const number = h("input", { id, class: "rl-num", type: "number", inputmode: "numeric", step: spec.step, "aria-label": t(spec.label) });
    const range = h("input", { class: "rl-range", type: "range", step: spec.step, "aria-label": t(spec.label), tabindex: "-1" });
    const act = (value) => dispatch({ type: "set", key, value });
    number.addEventListener("change", () => number.value !== "" && act(Number(number.value)));
    range.addEventListener("input", () => act(Number(range.value)));
    const minus = h("button", { type: "button", class: "rl-step", "aria-label": t("Decrease {name}", { name: t(spec.label) }), text: "−" });
    const plus = h("button", { type: "button", class: "rl-step", "aria-label": t("Increase {name}", { name: t(spec.label) }), text: "+" });
    minus.addEventListener("click", () => act(Number(number.value) - spec.step));
    plus.addEventListener("click", () => act(Number(number.value) + spec.step));
    refs[key] = { number, range, spec };
    host.append(h("div", { class: "rl-control" }, h("label", { for: id, text: t(spec.label) }), h("div", { class: "rl-control-row" }, minus, number, plus), range));
  }
  if (mission.controls.includes("scale")) {
    const scale = (k, text) => h("button", { type: "button", class: "fl-btn fl-btn--ghost rl-scale", text: t(text), on: { click: () => dispatch({ type: "set", key: "scale", value: `${k.n}/${k.d}`, scale: (s) => scaleField(s, k) }) } });
    host.append(h("div", { class: "rl-control rl-scales" }, h("span", { class: "rl-control-label", text: t("Scale the whole field") }), h("div", { class: "rl-control-row" }, scale(frac(2, 1), "Make both sides ×2"), scale(frac(3, 1), "Make both sides ×3"), scale(frac(1, 2), "Make both sides ÷2"))));
  }
  host.append(h("button", { type: "button", class: "fl-btn fl-btn--ghost rl-undo", "data-undo": "", text: t("Undo"), on: { click: () => dispatch({ type: "undo" }) } }));
  return refs;
}

export function updateControls(refs, state) {
  for (const [key, { number, range, spec }] of Object.entries(refs)) {
    const [min, max] = key === "sold" ? [0, state.sections * state.seatsPerSection] : LIMITS[key];
    for (const el of [number, range]) {
      el.min = min;
      el.max = max;
    }
    if (document.activeElement !== number) number.value = state[key];
    range.value = state[key];
    range.setAttribute("aria-valuetext", `${state[key]}`);
    void spec;
  }
}

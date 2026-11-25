// Band selector: a native radio group (fieldset + legend), so arrow keys, roving focus and "one selected"
// come from the browser and are exposed correctly to assistive tech. Each choice is a >=44px label. The
// bands are DATA: callers pass them (the Studio specimen uses the support tiers from studio/data/taxonomy.js),
// so there is no second list of bands in this library. Teacher-side only: students never see band labels.
import { h, uid } from "./h.js";

/**
 * createBandSelector({ name, label, bands: [{ value, label, hint }], value, hint, onChange })
 * The element has value() -> selected band value or "".
 */
export function createBandSelector({ name, label, bands, value = "", hint, onChange } = {}) {
  if (!name) throw new Error("createBandSelector: name is required");
  if (!label) throw new Error("createBandSelector: label is required");
  if (!Array.isArray(bands) || bands.length < 2)
    throw new Error("createBandSelector: at least two bands");
  const base = uid("ui-band");
  const hintId = hint ? `${base}-hint` : undefined;
  const options = bands.map((b, i) =>
    h(
      "label",
      { class: "ui-band", for: `${base}-${i}` },
      h("input", {
        class: "ui-band__input",
        type: "radio",
        id: `${base}-${i}`,
        name,
        value: b.value,
        checked: b.value === value,
      }),
      h(
        "span",
        { class: "ui-band__text" },
        h("span", { class: "ui-band__label" }, b.label),
        b.hint ? h("span", { class: "ui-band__hint" }, b.hint) : null,
      ),
    ),
  );
  const root = h(
    "fieldset",
    { class: "ui-bands", "aria-describedby": hintId },
    h("legend", { class: "ui-bands__legend" }, label),
    hint ? h("p", { class: "ui-bands__note", id: hintId }, hint) : null,
    h("div", { class: "ui-bands__row" }, options),
  );
  root.addEventListener("change", (e) => {
    if (e.target?.type === "radio") onChange?.(e.target.value);
  });
  root.value = () => root.querySelector("input:checked")?.value ?? "";
  return root;
}

// Small UI kit shared by conversation-studio, vocab-quest and argument-builder: buttons, a radio choice group,
// a hint ladder, a step list and the visual loader. DOM only; pure logic lives in each engine's own logic module.
import { h } from "../core/dom.js";

export { loadVisuals, visualEl } from "./escape/visual-el.js";

/** Standard button. `cls` is a space-separated list: "primary", "quiet". */
export function btn(label, cls, onclick, attrs = {}) {
  const c = String(cls || "")
    .split(" ")
    .filter(Boolean)
    .map((k) =>
      k === "primary" ? "st-btn-primary st-primary" : k === "quiet" ? "st-btn-quiet" : k,
    );
  return h(
    "button",
    { type: "button", class: ["st-btn", ...c].join(" "), onclick, ...attrs },
    label,
  );
}

let uid = 0;
export const nextId = (p = "e4") => `${p}-${++uid}`;

/**
 * Radio choice group (native radios: arrow keys and touch work for free).
 * opts: {legend, options:[string|{text, sub}], onChange(i), name?, disabled?}
 * -> {el, value(), set(i), mark(i, text), clearMarks(), lock(on)}
 */
export function choiceGroup({
  legend,
  options,
  onChange,
  name = nextId("grp"),
  legendHidden = false,
  onSpeak = null,
}) {
  const fs = h("fieldset", { class: "st-e4-choices" });
  fs.append(h("legend", { class: legendHidden ? "st-sr-only" : "st-e4-legend" }, legend));
  const inputs = [];
  const labels = [];
  options.forEach((o, i) => {
    const text = typeof o === "string" ? o : o.text;
    const sub = typeof o === "string" ? null : o.sub;
    const input = h("input", { type: "radio", name, value: String(i) });
    input.addEventListener("change", () => {
      labels.forEach((l) => l.removeAttribute("data-picked"));
      labels[i].dataset.picked = "true";
      onChange?.(i);
    });
    const tag = h("span", { class: "st-e4-optmark" });
    const label = h(
      "label",
      { class: "st-e4-opt" },
      input,
      h(
        "span",
        { class: "st-e4-opttext" },
        text,
        sub ? h("span", { class: "st-e4-optsub" }, sub) : null,
      ),
      tag,
    );
    inputs.push(input);
    labels.push(label);
    if (onSpeak) {
      const say = h(
        "button",
        { type: "button", class: "st-btn st-e4-say", "aria-label": `Hear: ${text}`, onclick: () => onSpeak(text) },
        "Hear",
      );
      fs.append(h("div", { class: "st-e4-optrow" }, label, say));
    } else fs.append(label);
  });
  return {
    el: fs,
    inputs,
    value: () => {
      const i = inputs.findIndex((x) => x.checked);
      return i < 0 ? null : i;
    },
    set(i) {
      if (inputs[i]) {
        inputs[i].checked = true;
        labels.forEach((l) => l.removeAttribute("data-picked"));
        labels[i].dataset.picked = "true";
      }
    },
    mark(i, text) {
      const tag = labels[i]?.querySelector(".st-e4-optmark");
      if (tag) tag.textContent = text;
      if (labels[i]) labels[i].dataset.mark = text ? "yes" : "";
    },
    clearMarks() {
      labels.forEach((l) => {
        l.querySelector(".st-e4-optmark").textContent = "";
        l.dataset.mark = "";
      });
    },
    reset() {
      for (const x of inputs) x.checked = false;
      labels.forEach((l) => l.removeAttribute("data-picked"));
    },
    lock(on) {
      for (const x of inputs) x.disabled = !!on;
    },
    focus: () => (inputs.find((x) => x.checked) || inputs[0])?.focus(),
  };
}

/** Numbered step list with aria-current on the active step. -> {el, set(index)} */
export function stepList(labels, label = "Steps") {
  const lis = labels.map((t) =>
    h("li", { class: "st-e4-step" }, h("span", { class: "st-e4-stepname" }, t)),
  );
  const ol = h("ol", { class: "st-e4-steps", "aria-label": label }, lis);
  return {
    el: ol,
    set(i) {
      lis.forEach((li, k) => {
        li.dataset.state = k < i ? "done" : k === i ? "now" : "todo";
        if (k === i) li.setAttribute("aria-current", "step");
        else li.removeAttribute("aria-current");
        const name = li.querySelector(".st-e4-stepname");
        name.dataset.state = li.dataset.state;
      });
    },
  };
}

/** Focus a heading after a view change without announcing the whole page. */
export function focusHeading(el) {
  const t = el?.querySelector?.("[data-focus]") || el;
  t?.setAttribute?.("tabindex", "-1");
  t?.focus?.({ preventScroll: false });
}

/** Word count used by writing checks. */
export const words = (s) =>
  String(s || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

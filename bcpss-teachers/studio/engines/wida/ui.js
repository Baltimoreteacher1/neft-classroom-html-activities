// Shared widgets for wida-studio: visuals (lazy), supports block (mode aware), notices, printing.
import { h } from "../../core/dom.js";
import { supportPanel, supportFor } from "../engine-core.js";
import { DISCLAIMER } from "./check.js";

let seq = 0;
export const uid = (p) => `${p}-${++seq}`;

let visualsMod;
const loadVisuals = () => (visualsMod ||= import("../../core/visuals.js").catch(() => null));

/** Figure for a visual spec. Falls back to a labelled text box when the visual kit is unavailable. */
export function figure(spec, caption) {
  const wrap = h("figure", { class: "st-wida-figure" });
  const holder = h("div", { class: "st-wida-visual" });
  wrap.append(holder);
  const fallback = () => holder.replaceChildren(h("p", { class: "st-wida-alt", role: "img", "aria-label": spec.alt }, spec.alt));
  loadVisuals().then((m) => {
    try {
      if (!m?.renderVisual) return fallback();
      holder.innerHTML = m.renderVisual(spec);
    } catch {
      fallback();
    }
  });
  if (spec.longDesc) wrap.append(h("details", { class: "st-wida-longdesc" }, h("summary", {}, "Describe this picture in words"), h("p", {}, spec.longDesc)));
  if (caption) wrap.append(h("figcaption", {}, caption));
  return wrap;
}

export const disclaimer = () => h("p", { class: "st-wida-disclaimer" }, DISCLAIMER);

/** Visible per-task heading. */
export function taskHead(task, index, total) {
  return h(
    "div",
    { class: "st-wida-taskhead" },
    h("p", { class: "st-wida-kicker" }, `Task ${index + 1} of ${total}`),
    h("h3", { class: "st-wida-tasktitle", tabindex: "-1", id: "st-wida-task-heading" }, task.title),
    h("p", { class: "st-prompt" }, task.prompt),
  );
}

/** Mode-aware supports. Instructional: shown. Independent: hidden until requested (counted once per task). */
export function supportsBlock(task, env) {
  const wrap = h("div", { class: "st-wida-supports" });
  const body = h("div", { class: "st-wida-supports-body" });
  const btn = h("button", { type: "button", class: "st-btn", "aria-expanded": "false" }, "Show supports");
  const note = h("p", { class: "st-wida-hidden-note" }, "Supports are hidden in independent practice. You can ask for them. Your teacher will see that you asked.");
  let shown = env.supportsRequested();
  btn.addEventListener("click", () => {
    if (!shown) env.requestSupports();
    shown = !shown;
    refresh();
  });
  const refresh = () => {
    const independent = env.mode() === "independent";
    const open = !independent || shown;
    btn.hidden = !independent;
    btn.textContent = open ? "Hide supports" : "Show supports";
    btn.setAttribute("aria-expanded", String(open));
    note.hidden = !independent || open;
    body.replaceChildren();
    if (!open) return;
    let s = supportFor(task, env.tier());
    if (!s.frames?.length && !s.wordBank?.length && !s.directions && !s.oral) s = env.collection.supports?.[env.tier()] || s;
    const panel = supportPanel({ id: task.id, supports: { [env.tier()]: s } }, env.tier());
    panel.el.setAttribute("aria-label", "Supports for this task");
    body.append(panel.el);
    if (s.visual) body.append(figure(s.visual));
  };
  wrap.append(btn, note, body);
  env.addRefresh(refresh);
  refresh();
  return wrap;
}

/** Print only the given nodes via a temporary sheet. */
export function printNodes(title, nodes) {
  const sheet = h("div", { class: "st-wida-printsheet" }, h("h1", {}, title), nodes);
  document.body.append(sheet);
  document.body.classList.add("st-wida-printing");
  const done = () => {
    document.body.classList.remove("st-wida-printing");
    sheet.remove();
    window.removeEventListener("afterprint", done);
  };
  window.addEventListener("afterprint", done);
  try {
    window.print();
  } finally {
    setTimeout(done, 1500);
  }
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export const labelled = (label, control, id) => h("div", { class: "st-wida-field" }, h("label", { for: id }, label), control);

/** Radio group (fieldset) for single-choice options. onPick(id). */
export function radioGroup({ legend, name, options, value, onPick, multi = false }) {
  const fs = h("fieldset", { class: "st-wida-options" }, h("legend", {}, legend));
  const inputs = [];
  for (const o of options) {
    const id = uid("opt");
    const input = h("input", { type: multi ? "checkbox" : "radio", name, id, value: o.id });
    input.checked = multi ? (value || []).includes(o.id) : value === o.id;
    input.addEventListener("change", () => {
      if (multi) onPick(inputs.filter((i) => i.checked).map((i) => i.value));
      else onPick(o.id);
    });
    inputs.push(input);
    fs.append(h("div", { class: "st-wida-option" }, input, h("label", { for: id }, o.text)));
  }
  return fs;
}

/** Mark rows in a container (data-state="ok"|"no") with a visible, non-colour word. */
export function markRow(row, ok) {
  row.dataset.state = ok ? "ok" : "no";
  row.querySelector(".st-wida-mark")?.remove();
  row.append(h("span", { class: "st-wida-mark" }, ok ? "Correct" : "Not yet"));
}
export function clearMarks(root) {
  for (const r of root.querySelectorAll("[data-state]")) delete r.dataset.state;
  for (const m of root.querySelectorAll(".st-wida-mark")) m.remove();
}

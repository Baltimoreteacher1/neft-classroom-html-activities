// Small markup helpers shared by the project detail sections. Markup only; no data access.
import { h } from "../../core/dom.js";

let counter = 0;

/** A titled section with a focusable heading, so "jump to" links can move keyboard focus. */
export function section(id, title, ...kids) {
  const hid = `st-pj-h-${id}-${++counter}`;
  return h(
    "section",
    { class: "st-pj-sec", id: `st-pj-${id}`, "aria-labelledby": hid },
    h("h2", { id: hid, tabindex: "-1" }, title),
    ...kids,
  );
}

export const label = (text) => h("p", { class: "st-pj-label" }, text);

export const para = (text) => (text ? h("p", { class: "st-pj-text" }, text) : null);

export function ul(items, cls = "st-pj-list") {
  const list = (items || []).filter(Boolean);
  return list.length
    ? h(
        "ul",
        { class: cls },
        list.map((t) => h("li", {}, t)),
      )
    : null;
}

export function ol(items, cls = "st-pj-list") {
  const list = (items || []).filter(Boolean);
  return list.length
    ? h(
        "ol",
        { class: cls },
        list.map((t) => h("li", {}, t)),
      )
    : null;
}

export const chip = (text, { tone, title } = {}) =>
  h("span", { class: `st-chip${tone ? ` st-pj-chip-${tone}` : " st-chip-plain"}`, title }, text);

export const chips = (items, cls = "st-pj-wordbank") =>
  items?.length
    ? h(
        "ul",
        { class: cls },
        items.map((t) => h("li", { class: "st-chip" }, t)),
      )
    : null;

/** A visual spec rendered as a figure. Falls back to its alt text if the visual kit cannot draw it. */
export function visualFigure(item) {
  const spec = item.visual;
  const box = h("div", { class: "st-pj-fig-box" });
  const fig = h(
    "figure",
    { class: "st-pj-fig" },
    box,
    h("figcaption", {}, h("strong", {}, item.title), item.caption ? ` ${item.caption}` : ""),
  );
  import("../../core/visuals.js")
    .then((m) => {
      box.innerHTML = m.renderVisual(spec);
    })
    .catch(() => box.replaceChildren(h("p", { class: "st-pj-alt" }, spec?.alt || "Picture")));
  if (spec?.longDesc) fig.append(h("p", { class: "st-pj-longdesc" }, spec.longDesc));
  if (item.teacherNote)
    fig.append(
      h("p", { class: "st-pj-note" }, h("strong", {}, "Teacher note: "), item.teacherNote),
    );
  return fig;
}

/** A button that opens a student activity when the manifest knows it. */
export function activityButton(tool, { shell, tier, known }) {
  if (!tool?.id || !known.has(tool.id)) return null;
  const b = h(
    "button",
    { class: "st-btn", type: "button" },
    tool.label || "Open activity",
    h("span", { class: "st-sr-only" }, " (opens in a new tab)"),
  );
  b.addEventListener("click", () => shell.openActivity(tool.id, { tier }));
  return b;
}

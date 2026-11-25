// Tabs (WAI-ARIA tabs pattern, automatic activation): one tab stop in the list (roving tabindex), Arrow keys
// move and activate, Home and End jump. Arrow direction follows reading direction, so in an RTL container
// ArrowRight goes to the previous tab. Each panel is focusable so keyboard users can reach its content.
import { directionOf, h, uid } from "./h.js";

/**
 * createTabs({ tabs: [{ id, label, panel }], selected, label, onChange })
 * The element has select(id) and a "ui-tabs-change" CustomEvent ({ detail: { id } }).
 */
export function createTabs({ tabs, selected, label, onChange } = {}) {
  if (!Array.isArray(tabs) || tabs.length === 0) throw new Error("createTabs: tabs is required");
  if (!label) throw new Error("createTabs: label is required");
  const base = uid("ui-tabs");
  const ids = tabs.map((t) => t.id);
  if (new Set(ids).size !== ids.length) throw new Error("createTabs: tab ids must be unique");
  let current = ids.includes(selected) ? selected : ids[0];

  const buttons = tabs.map((t) =>
    h(
      "button",
      {
        class: "ui-tab",
        type: "button",
        role: "tab",
        id: `${base}-tab-${t.id}`,
        "aria-controls": `${base}-panel-${t.id}`,
      },
      t.label,
    ),
  );
  const panels = tabs.map((t) =>
    h(
      "div",
      {
        class: "ui-tabpanel",
        role: "tabpanel",
        id: `${base}-panel-${t.id}`,
        "aria-labelledby": `${base}-tab-${t.id}`,
        tabindex: "0",
      },
      t.panel,
    ),
  );
  const list = h("div", { class: "ui-tablist", role: "tablist", "aria-label": label }, buttons);
  const root = h("div", { class: "ui-tabs" }, list, panels);

  function select(id, { focus = false, silent = false } = {}) {
    const index = ids.indexOf(id);
    if (index < 0) return;
    const changed = id !== current;
    current = id;
    buttons.forEach((b, i) => {
      const on = i === index;
      b.setAttribute("aria-selected", String(on));
      b.tabIndex = on ? 0 : -1;
      panels[i].hidden = !on;
    });
    if (focus) buttons[index].focus();
    if (changed && !silent) {
      root.dispatchEvent(new globalThis.CustomEvent("ui-tabs-change", { detail: { id } }));
      onChange?.(id);
    }
  }

  list.addEventListener("keydown", (e) => {
    const at = buttons.indexOf(globalThis.document.activeElement);
    if (at < 0) return;
    const rtl = directionOf(root) === "rtl";
    const step = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 }[e.key];
    let next = null;
    if (step) next = (at + step + ids.length) % ids.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = ids.length - 1;
    if (next === null) return;
    e.preventDefault();
    select(ids[next], { focus: true });
  });
  buttons.forEach((b, i) => b.addEventListener("click", () => select(ids[i])));

  root.select = (id) => select(id, { focus: false });
  select(current, { silent: true });
  return root;
}

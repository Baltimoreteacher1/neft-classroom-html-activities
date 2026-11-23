// Visible, non-color-only result marks on answer parts: an icon and a word, plus a class for styling.

import { glyph } from "./icons.js";
import { h } from "./util.js";

const MARK_KINDS = {
  right: { cls: "sp-mark-right", icon: "check", key: "markRight" },
  wrong: { cls: "sp-mark-wrong", icon: "cross", key: "markWrong" },
  look: { cls: "sp-mark-look", icon: "bulb", key: "markLook" },
};

/** Mark an element as right / wrong / look-again, with a visible word. */
export function mark(node, kind, ctx, append = node) {
  const k = MARK_KINDS[kind];
  node.dataset.mark = kind;
  node.classList.add(`is-${kind}`);
  append.append(h("span", { class: `sp-mark ${k.cls}` }, glyph(k.icon, 14), h("span", { class: "sp-mark-text" }, ctx.t(k.key))));
}

/** Remove every mark inside root. */
export function clearMarks(root) {
  for (const m of root.querySelectorAll(".sp-mark")) m.remove();
  for (const n of root.querySelectorAll("[data-mark]")) {
    n.classList.remove("is-right", "is-wrong", "is-look");
    delete n.dataset.mark;
  }
  for (const n of root.querySelectorAll("[aria-invalid]")) n.removeAttribute("aria-invalid");
}

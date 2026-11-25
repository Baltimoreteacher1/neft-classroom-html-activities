// Dialog (modal): role=dialog + aria-modal, labelled by its title, focus moves in on open and is trapped
// (Tab and Shift+Tab wrap), Escape or the Close button or a backdrop click closes it, focus returns to the
// opener, and the rest of the page is made inert while it is open. Not <dialog>: the trap and the focus
// return must behave the same in every engine and under test.
import { createButton } from "./button.js";
import { h, uid } from "./h.js";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * createDialog({ title, body, actions, closeLabel, onClose })
 * actions: array of nodes (buttons) shown in the footer. Returns the root element with open(opener?) and close().
 */
export function createDialog({ title, body, actions = [], closeLabel = "Close", onClose } = {}) {
  if (!title) throw new Error("createDialog: title is required");
  const titleId = uid("ui-dialog-title");
  let opener = null;
  let open = false;
  let inerted = [];

  const closeBtn = createButton({
    label: closeLabel,
    variant: "quiet",
    onClick: () => api.close(),
  });
  const panel = h(
    "div",
    {
      class: "ui-dialog",
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": titleId,
      tabindex: "-1",
    },
    h(
      "div",
      { class: "ui-dialog__head" },
      h("h2", { class: "ui-dialog__title", id: titleId }, title),
      closeBtn,
    ),
    h("div", { class: "ui-dialog__body" }, body),
    actions.length ? h("div", { class: "ui-dialog__foot" }, actions) : null,
  );
  const root = h("div", { class: "ui-dialog-backdrop" }, panel);
  const focusables = () => [...panel.querySelectorAll(FOCUSABLE)].filter((el) => !el.hidden);

  root.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      api.close();
      return;
    }
    if (e.key !== "Tab") return;
    const items = focusables();
    if (items.length === 0) {
      e.preventDefault();
      panel.focus();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = globalThis.document.activeElement;
    if (e.shiftKey && (active === first || active === panel)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  });
  root.addEventListener("click", (e) => {
    if (e.target === root) api.close();
  });

  const api = {
    open(from) {
      if (open) return;
      const doc = globalThis.document;
      opener = from || doc.activeElement;
      // The scrim lives on <body>, so it copies the opener's theme, direction and language.
      for (const attr of ["data-ui-theme", "dir", "lang"]) {
        const scope = opener?.closest?.(`[${attr}]`);
        if (scope) root.setAttribute(attr, scope.getAttribute(attr));
      }
      doc.body.append(root);
      inerted = [...doc.body.children].filter((el) => el !== root && !el.hasAttribute("inert"));
      for (const el of inerted) el.setAttribute("inert", "");
      doc.documentElement.classList.add("ui-scroll-lock");
      open = true;
      root.dataset.open = "true";
      (focusables().find((el) => el !== closeBtn) || panel).focus();
    },
    close() {
      if (!open) return;
      open = false;
      for (const el of inerted) el.removeAttribute("inert");
      inerted = [];
      globalThis.document.documentElement.classList.remove("ui-scroll-lock");
      delete root.dataset.open;
      root.remove();
      if (opener?.isConnected) opener.focus();
      opener = null;
      root.dispatchEvent(new globalThis.CustomEvent("ui-dialog-close"));
      onClose?.();
    },
    get isOpen() {
      return open;
    },
  };
  Object.defineProperties(root, {
    open: { value: api.open },
    close: { value: api.close },
    isOpen: { get: () => open },
  });
  return root;
}

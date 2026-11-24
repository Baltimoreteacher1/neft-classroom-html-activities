// Easy-read option: a header toggle that sets <html data-readable="on"> (type rules live in studio.css).
// The choice is a device preference, stored under its own key; unit progress keys are never touched.
import { announce, storeGet, storeSet } from "./studio-core.js";

export const READABLE_KEY = "bcpss-studio:prefs:readable";

export function initReadable(button) {
  if (!button) return;
  const root = document.documentElement;
  const apply = (on) => {
    if (on) root.dataset.readable = "on";
    else delete root.dataset.readable;
    button.setAttribute("aria-pressed", String(on));
  };
  apply(storeGet(READABLE_KEY) === true);
  button.addEventListener("click", () => {
    const on = root.dataset.readable !== "on";
    apply(on);
    storeSet(READABLE_KEY, on);
    announce(on ? "Easy-read text is on." : "Easy-read text is off.");
  });
}

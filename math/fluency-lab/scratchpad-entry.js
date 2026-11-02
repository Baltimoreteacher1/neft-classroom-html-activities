import { getLang, t } from "./i18n.js";
import { mountScratchpad } from "./scratchpad.js";

let scratchpad = null;

function mount() {
  const container = document.querySelector("#scratchpad-canvas");
  if (!container || scratchpad) return;
  scratchpad = mountScratchpad(container, { t, background: "lined" });
  scratchpad.setLanguage?.(getLang());
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, { once: true });
else mount();

document.addEventListener("click", (event) => {
  if (!event.target.closest("#lang-toggle")) return;
  requestAnimationFrame(() => scratchpad?.setLanguage?.(getLang()));
});

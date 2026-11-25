// Baseline help on every lab route that has no authored supports: select or double-tap a word to hear it.
// It is the floor of the layer (no glosses, no content), it is off until the layer is released (or a teacher /
// ?scaffold=preview is present), it ignores form fields and the layer's own controls, and it stores nothing.
import { layerOn, loadRelease } from "./runtime.js";

let wired = false;
let on = false;

export async function enable({ audience = "student" } = {}) {
  const preview = new URLSearchParams(location.search).get("scaffold") === "preview";
  on = layerOn({ release: await loadRelease(), audience, preview });
  if (wired || !on) return on;
  wired = true;
  document.addEventListener("dblclick", (e) => {
    if (!on || e.target.closest("input, textarea, select, button, [contenteditable], [data-ss-pop-host], .ss-root")) return;
    const w = (getSelection()?.toString() || "").trim();
    if (!/^[A-Za-z'-]{2,24}$/.test(w) || !("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(w);
    u.lang = "en-US";
    u.rate = 0.9;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  });
  return on;
}

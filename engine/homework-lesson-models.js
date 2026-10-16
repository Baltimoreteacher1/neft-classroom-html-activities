import { labMode } from "./components/lab-strings-es.js";
import { mountInteractiveVisuals } from "./core/interactive-visual.js";

document.querySelectorAll("[data-lesson-model-host]").forEach((host) => {
  mountInteractiveVisuals(host);
  host.closest("[data-visual-lab]")?.setAttribute("data-visual-ready", "1");
});

// Labs draw their words when they mount, so a language switch after load would
// leave them in the old language. Re-mount each lab when the page language
// changes (a lab resets; the student's page-level answers do not).
let shownMode = labMode();
new MutationObserver(() => {
  const mode = labMode();
  if (mode === shownMode) return;
  shownMode = mode;
  document.querySelectorAll("[data-lesson-model-host]").forEach((host) => {
    host.querySelectorAll(".interactive-visual").forEach((node) => node.remove());
    delete host.dataset.ivMounted;
    mountInteractiveVisuals(host);
  });
}).observe(document.body, { attributes: true, attributeFilter: ["class"] });

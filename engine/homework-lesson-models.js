import { mountInteractiveVisuals } from "./core/interactive-visual.js";

document.querySelectorAll("[data-lesson-model-host]").forEach((host) => {
  mountInteractiveVisuals(host);
  host.closest("[data-visual-lab]")?.setAttribute("data-visual-ready", "1");
});

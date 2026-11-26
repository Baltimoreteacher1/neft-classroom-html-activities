import { labMode } from "./components/lab-strings-es.js";
import { mountInteractiveVisuals } from "./core/interactive-visual.js";
import { sceneLang } from "./core/living-scene.js";

// The shared homework theme bundles are generated per family style. Keep this
// small readability correction in one place so all lesson homework pages use it.
if (!document.querySelector("[data-homework-readability]")) {
  const style = document.createElement("style");
  style.dataset.homeworkReadability = "";
  style.textContent = ".powerup-badge-star { color: #863900 !important; }";
  document.head.append(style);
}

// Living scenes keep their authored host markup so a language switch can put it
// back and mount again: the scene reads the page language when it mounts, and
// its saved progress reopens it on the same step.
const livingHosts = [...document.querySelectorAll("[data-living-host]")].map((host) => ({
  host,
  html: host.innerHTML,
}));
for (const { host } of livingHosts) mountInteractiveVisuals(host);
if (livingHosts.length) {
  // Homework switches language with <body> classes, the Practice Studio with
  // <html lang>: watch both, and re-mount only when the scene language changes.
  let livingLang = sceneLang();
  const remountLiving = () => {
    const next = sceneLang();
    if (next === livingLang) return;
    livingLang = next;
    for (const { host, html } of livingHosts) {
      host.querySelector(".interactive-visual")?.__ivHandle?.destroy?.();
      host.innerHTML = html;
      mountInteractiveVisuals(host);
    }
  };
  const watch = new MutationObserver(remountLiving);
  watch.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  watch.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });

  // Practice Studio "See why" bridge: opens the lesson's living-scene card and
  // jumps straight to the scene that demonstrates the student's misconception.
  const openLivingAt = (sceneId) => {
    const first = livingHosts[0]?.host;
    if (!first) return false;
    const details = first.closest("details");
    if (details) details.open = true;
    const iv = first.querySelector(".interactive-visual");
    if (iv) {
      if (iv.__ivHandle?.openAt) iv.__ivHandle.openAt(sceneId);
      else iv.dataset.openAt = String(sceneId);
    }
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    (details || first).scrollIntoView?.({ behavior: reduced ? "auto" : "smooth", block: "start" });
    return true;
  };
  window.EwlLiving = { openAt: openLivingAt };
  document.addEventListener("click", (e) => {
    const btn = e.target?.closest?.("[data-living-open]");
    if (!btn) return;
    const sceneId = btn.dataset.livingOpen;
    if (sceneId) openLivingAt(sceneId);
  });
}

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

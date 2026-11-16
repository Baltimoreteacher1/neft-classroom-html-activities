// "See it move" inside the Lesson Path page (/math/lesson-path/<id>/, step 3 Practice and Explore): the lesson's own animated figure with
// its numbers editable and the Think it through flow. The level tabs choose the flow: Challenge gets error analysis and build-to-target,
// Support and Core get See one, Try one, Explain, Apply. Nothing is graded or sent; progress stays on this device.
import { figureFor } from "./figures/index.mjs";
import { mountFigure } from "./figures/mount.mjs";

const box = document.getElementById("lp-motion");
const stage = box?.querySelector("[data-motion-stage]");
if (box && stage) {
  const key = box.getAttribute("data-k") || "";
  const fig = figureFor(key);
  let values = (box.getAttribute("data-v") || "").split(",").map(Number);
  const lang = () => (document.documentElement.lang === "es" || document.body.classList.contains("show-es") ? "es" : "en");
  const level = () => document.querySelector('.lp-levels [role="tab"][aria-selected="true"]')?.getAttribute("data-level") || "core";
  /** @type {ReturnType<typeof mountFigure> | null} */
  let view = null;
  let shown = "";
  const render = () => {
    if (!fig) return void (box.hidden = true);
    const mode = level() === "challenge" ? "challenge" : "standard";
    const sig = `${mode}|${lang()}`;
    if (view && sig === shown) return;
    if (view) values = view.values();
    view?.destroy();
    shown = sig;
    view = mountFigure(stage, fig, key, { values, lang: lang(), controls: true, think: mode });
  };
  render();
  for (const tab of document.querySelectorAll('.lp-levels [role="tab"]')) tab.addEventListener("click", () => setTimeout(render, 0));
  new MutationObserver(() => {
    if (view && lang() !== shown.split("|")[1]) view.update({ lang: lang() });
    shown = `${shown.split("|")[0]}|${lang()}`;
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  new MutationObserver(() => {
    if (view && lang() !== shown.split("|")[1]) view.update({ lang: lang() });
    shown = `${shown.split("|")[0]}|${lang()}`;
  }).observe(document.body, { attributes: true, attributeFilter: ["class"] });
}

// Teachers hub, Review tab: the two most frequent language patterns on this device and the class view (paste
// students' Save/Resume codes). Both read the Language Lab record (`tlp_lab_v2`); see access-practice-lab/LAB-V2.md.
import { classPanelHTML, classPatterns } from "/access-practice-lab/src/lab/class-patterns.js";
import { topPatternsCardHTML } from "/access-practice-lab/src/lab/progress-ui.js";
import { LAB_KEY, loadLab } from "/access-practice-lab/src/lab/store.js";
import { storage, toHtml } from "/access-practice-lab/src/util.js";
import { hubBand } from "/access-teacher/command-center.js";

export function mountLabPatterns(host) {
  if (!host) return;
  let band = hubBand();
  // What the teacher pasted survives re-renders (a student tab can write the lab record at any time); it is never saved.
  let text = "";
  let result = null;
  const render = () => {
    host.innerHTML = toHtml(topPatternsCardHTML(loadLab(), { band })) + toHtml(classPanelHTML(text, result, { band }));
  };
  host.addEventListener("input", (e) => {
    if (e.target.id === "cpCodes") text = e.target.value;
  });
  host.addEventListener("click", (e) => {
    if (e.target.closest("[data-cp-run]")) {
      text = host.querySelector("#cpCodes")?.value ?? text;
      result = classPatterns(text, { band });
      render();
      host.querySelector("#lpClassTitle")?.scrollIntoView?.({ block: "nearest" });
    } else if (e.target.closest("[data-cp-clear]")) {
      text = "";
      result = null;
      render();
      host.querySelector("#cpCodes")?.focus();
    }
  });
  document.addEventListener("th:band", (e) => {
    band = e.detail?.band || band;
    if (result) result = classPatterns(text, { band });
    render();
  });
  storage.subscribe?.((key) => key === LAB_KEY && render());
  window.addEventListener("storage", (e) => e.key === LAB_KEY && render());
  render();
}

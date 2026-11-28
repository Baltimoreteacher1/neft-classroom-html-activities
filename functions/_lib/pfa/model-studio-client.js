import { MODELS, modelGraphic, STUDIO_COPY, studioFacts, studioNum } from "./model-studio.js";
import { bi } from "./problem-view.js";

const studio = document.querySelector("[data-studio]");
if (studio) {
  const model = MODELS[studio.dataset.studio];
  const sliders = [...studio.querySelectorAll('input[type="range"]')];
  const values = [...studio.querySelectorAll("[data-studio-value]")];
  const steppers = [...studio.querySelectorAll("[data-delta]")];
  const picture = studio.querySelector("[data-studio-art]");
  const facts = studio.querySelector("[data-studio-facts]");
  const result = studio.querySelector("[data-studio-result]");
  const prompt = studio.querySelector("[data-studio-prompt]");
  const update = studio.querySelector("[data-studio-update]");
  const table = studio.querySelector(".studio-table tbody");
  let taskIndex = 0;

  const readValues = () => sliders.map((slider) => slider.valueAsNumber);
  function repaintStudio() {
    const current = readValues();
    const scene = model.draw(...current);
    picture.innerHTML = modelGraphic(scene.art);
    facts.innerHTML = studioFacts(scene);
    values.forEach((value, i) => {
      value.textContent = studioNum(current[i]);
    });
    for (const button of steppers) {
      const i = Number(button.dataset.index);
      const end = Number(sliders[i][button.dataset.delta === "1" ? "max" : "min"]);
      // Keep the button focusable after reaching either end of the range.
      button.setAttribute("aria-disabled", String(current[i] === end));
    }
    if (table) {
      table.innerHTML = scene.table
        .map(
          ([x, y]) =>
            `<tr${x === current[0] ? ' class="studio-current"' : ""}><th scope="row">${x}</th><td>${y}</td></tr>`,
        )
        .join("");
    }
    result.textContent = "";
  }

  function announceStudio() {
    const language = document.documentElement.lang === "es" ? "es" : "en";
    const text = (node) =>
      node.querySelector(`[lang="${language}"]`)?.textContent ?? node.textContent;
    update.textContent = [...facts.children]
      .map(({ children: [label, value] }) => `${text(label)}: ${text(value)}.`)
      .join(" ");
  }

  studio.addEventListener("change", (event) => {
    if (sliders.includes(event.target)) announceStudio();
  });
  studio.addEventListener("input", (event) => {
    if (sliders.includes(event.target)) repaintStudio();
  });
  studio.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button || button.getAttribute("aria-disabled") === "true") return;
    if (button.dataset.delta) {
      const slider = sliders[Number(button.dataset.index)];
      slider.stepUp(Number(button.dataset.delta));
      repaintStudio();
      announceStudio();
    }
    if (button.dataset.studioAction === "check") {
      const task = model.tasks[taskIndex];
      const current = readValues();
      const wrongSide = task.right != null && task.right !== current[1];
      const correct = !wrongSide && model.measure(...current) === task.target;
      result.dataset.correct = String(correct);
      result.innerHTML = bi(
        wrongSide ? STUDIO_COPY.right : correct ? STUDIO_COPY.correct : STUDIO_COPY.retry,
      );
    }
    if (button.dataset.studioAction === "next") {
      taskIndex = (taskIndex + 1) % model.tasks.length;
      prompt.innerHTML = bi(model.tasks[taskIndex].prompt);
      result.dataset.correct = "neutral";
      result.innerHTML = bi(model.tasks[taskIndex].prompt);
    }
    if (button.dataset.studioAction === "reset") {
      sliders.forEach((slider, i) => {
        slider.value = model.controls[i].start;
      });
      taskIndex = 0;
      prompt.innerHTML = bi(model.tasks[0].prompt);
      repaintStudio();
      announceStudio();
    }
  });

  function openStudioHash() {
    if (location.hash === "#math-model") studio.open = true;
  }
  addEventListener("hashchange", openStudioHash);
  openStudioHash();
  repaintStudio();
  studio.querySelector(".studio-console").hidden = false;
}

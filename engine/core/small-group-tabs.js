import { el } from "./small-group-ui.js";

export function mountSmallGroupTabs(app, steps) {
  const tabs = el("nav", "sg-tabs");
  tabs.setAttribute("role", "tablist");
  tabs.setAttribute("aria-label", "Lesson steps");
  const buttons = new Map();
  const activeSteps = steps.filter((step) => step.panel);

  function markDone(id) {
    buttons.get(id)?.classList.add("done");
  }

  function activate(id, moveFocus = false) {
    for (const step of activeSteps) {
      const active = step.id === id;
      step.panel.hidden = !active;
      const button = buttons.get(step.id);
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
    }
    if (moveFocus) {
      activeSteps
        .find((step) => step.id === id)
        ?.panel.querySelector("h2")
        ?.focus?.();
      window.scrollTo({ top: tabs.offsetTop, behavior: "smooth" });
    }
  }

  activeSteps.forEach((step, index) => {
    step.panel.classList.add("sg-tabpanel");
    step.panel.setAttribute("role", "tabpanel");
    step.panel.setAttribute("aria-labelledby", `sg-tab-${step.id}`);
    const button = el(
      "button",
      "sg-step",
      `<span class="dot">${index + 1}</span><span class="lbl">${step.label}</span>`,
    );
    button.id = `sg-tab-${step.id}`;
    button.type = "button";
    button.setAttribute("role", "tab");
    button.setAttribute("aria-controls", step.id);
    button.addEventListener("click", () => activate(step.id));
    button.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      const delta = event.key === "ArrowRight" ? 1 : -1;
      const next = (index + delta + activeSteps.length) % activeSteps.length;
      buttons.get(activeSteps[next].id).focus();
      activate(activeSteps[next].id);
    });
    buttons.set(step.id, button);
    tabs.appendChild(button);

    if (index < activeSteps.length - 1) {
      const nextWrap = el("div", "sg-next");
      const nextButton = el("button", "btn", `Next: ${activeSteps[index + 1].label} →`);
      nextButton.type = "button";
      nextButton.addEventListener("click", () => {
        markDone(step.id);
        activate(activeSteps[index + 1].id, true);
      });
      nextWrap.appendChild(nextButton);
      step.panel.appendChild(nextWrap);
    }
  });

  app.querySelector(".sg-hero")?.after(tabs);
  activate(activeSteps[0].id);
  return { activate, markDone };
}

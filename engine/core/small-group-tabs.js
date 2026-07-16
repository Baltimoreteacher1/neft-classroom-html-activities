export function mountSmallGroupTabs(app, steps) {
  const tabs = document.createElement("nav");
  tabs.className = "sg-tabs";
  tabs.setAttribute("role", "tablist");
  tabs.setAttribute("aria-label", "Lesson steps");

  const buttons = new Map();
  const activeSteps = steps.filter((step) => step.panel);

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
    step.panel.setAttribute("role", "tabpanel");
    step.panel.setAttribute("aria-labelledby", `sg-tab-${step.id}`);

    const button = document.createElement("button");
    button.id = `sg-tab-${step.id}`;
    button.className = "sg-step";
    button.type = "button";
    button.setAttribute("role", "tab");
    button.setAttribute("aria-controls", step.id);
    button.innerHTML = `<span class="dot">${index + 1}</span><span class="lbl">${step.label}</span>`;
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
      const nextWrap = document.createElement("div");
      nextWrap.className = "sg-next";
      const nextButton = document.createElement("button");
      nextButton.className = "btn";
      nextButton.type = "button";
      nextButton.textContent = `Next: ${activeSteps[index + 1].label} →`;
      nextButton.addEventListener("click", () => {
        markDone(step.id);
        activate(activeSteps[index + 1].id, true);
      });
      nextWrap.appendChild(nextButton);
      step.panel.appendChild(nextWrap);
    }
  });

  function markDone(id) {
    buttons.get(id)?.classList.add("done");
  }

  const hero = app.querySelector(".sg-hero");
  hero?.after(tabs);
  activate(activeSteps[0].id);
  return { activate, markDone };
}

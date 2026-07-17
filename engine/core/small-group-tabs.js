import { el } from "./small-group-ui.js";

export function mountSmallGroupTabs(app, steps, { store = null } = {}) {
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
    store?.set("lastTab", id);
    if (moveFocus) {
      const heading = activeSteps.find((step) => step.id === id)?.panel.querySelector("h2");
      if (heading) {
        heading.tabIndex = -1;
        heading.focus();
      }
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
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const next =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? activeSteps.length - 1
            : (index + (event.key === "ArrowRight" ? 1 : -1) + activeSteps.length) %
              activeSteps.length;
      buttons.get(activeSteps[next].id).focus();
      activate(activeSteps[next].id);
    });
    buttons.set(step.id, button);
    tabs.appendChild(button);

    if (index < activeSteps.length - 1) {
      const nextWrap = el("div", "sg-next");
      const nextButton = el("button", "btn sg-next-btn", `Next: ${activeSteps[index + 1].label} →`);
      nextButton.type = "button";
      // Navigation only — the done checkmark is earned by finishing the
      // phase's work, not by clicking past it.
      nextButton.addEventListener("click", () => activate(activeSteps[index + 1].id, true));
      nextWrap.appendChild(nextButton);
      step.panel.appendChild(nextWrap);
    }
  });

  // Always-visible momentum meter inside the sticky rail. Fed by the
  // renderer's tally so students see progress without hunting for it.
  const meter = el("div", "sg-meter");
  const track = el("div", "sg-meter-track");
  const fill = el("div", "sg-meter-fill");
  track.appendChild(fill);
  const label = el("span", "sg-meter-lab", "Let’s get started");
  meter.append(track, label);
  tabs.appendChild(meter);

  function setProgress(solved, total) {
    if (!total) return;
    const percent = Math.round((solved / total) * 100);
    fill.style.width = `${percent}%`;
    label.textContent = `${solved} of ${total} checks complete`;
  }

  app.querySelector(".sg-hero")?.after(tabs);
  const savedTab = store?.get("lastTab");
  const initial = activeSteps.find((step) => step.id === savedTab) || activeSteps[0];
  activate(initial.id);
  return { activate, markDone, setProgress };
}

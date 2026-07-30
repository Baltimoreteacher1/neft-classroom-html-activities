import { celebrate, el, esLane, voiceFor } from "./small-group-ui.js";

export function mountSmallGroupTabs(
  app,
  steps,
  { store = null, voice = null, onReach = null } = {},
) {
  const tabs = el("nav", "sg-tabs");
  tabs.setAttribute("role", "tablist");
  tabs.setAttribute("aria-label", "Lesson steps");
  const buttons = new Map();
  const activeSteps = steps.filter((step) => step.panel);

  function markDone(id) {
    const button = buttons.get(id);
    if (!button) return;
    button.classList.add("done");
    // Earned checkmark replaces the step number — progress you can see.
    const dot = button.querySelector(".dot");
    if (dot) dot.textContent = "✓";
  }

  function activate(id, moveFocus = false) {
    // Single funnel for every tab arrival — clicks, Next buttons, keyboard
    // navigation, and the restored lastTab. The reach log needs arrivals, not
    // completions, so this is the only correct place to record them.
    onReach?.(id);
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
  const studioVoice = voice || voiceFor("catchup");
  const label = el("span", "sg-meter-lab", studioVoice.meterStart || "Let’s get started");
  // Quiet momentum chip — appears at 2+ correct in a row, vanishes silently
  // on a miss (momentum is celebrated, never mourned).
  const streak = el("span", "sg-streak");
  streak.hidden = true;
  meter.append(track, streak, label);
  tabs.appendChild(meter);

  // Milestone-aware meter copy, with a one-shot celebration when the last
  // check lands during this session (a restored 100% stays quiet).
  let lastPercent = null;
  function setProgress(solved, total) {
    if (!total) return;
    const percent = Math.round((solved / total) * 100);
    const remaining = Math.max(0, total - solved);
    const toHalfway = Math.ceil(total / 2) - solved;
    fill.style.width = `${percent}%`;
    if (percent >= 100) {
      label.textContent = `All ${total} steps done 🏆`;
    } else if (remaining === 1 || percent >= 90) {
      label.textContent = esLane()
        ? remaining === 1
          ? "1 más para terminar"
          : `${remaining} más para terminar`
        : remaining === 1
          ? "1 more to finish"
          : `${remaining} more to finish`;
    } else if (toHalfway > 0 && percent >= 35 && percent < 50) {
      label.textContent = esLane()
        ? `${toHalfway} más para la mitad`
        : `${toHalfway} more to halfway`;
    } else if (percent >= 50) {
      label.textContent = `${solved} of ${total} — over halfway 💪`;
    } else {
      label.textContent = `${solved} of ${total} steps done`;
    }
    if (lastPercent !== null && lastPercent < 100 && percent >= 100) celebrate("🏆");
    lastPercent = percent;
  }

  function setStreak(count) {
    if (count >= 2) {
      const wasHidden = streak.hidden;
      streak.hidden = false;
      streak.textContent = esLane() ? `🔥 ${count} seguidas` : `🔥 ${count} in a row`;
      if (wasHidden) {
        streak.classList.remove("sg-streak-hot");
        // Retrigger one-shot pulse on the hidden→shown transition.
        void streak.offsetWidth;
        streak.classList.add("sg-streak-hot");
      }
    } else {
      streak.hidden = true;
      streak.classList.remove("sg-streak-hot");
    }
  }

  app.querySelector(".sg-hero")?.after(tabs);
  const savedTab = store?.get("lastTab");
  const initial = activeSteps.find((step) => step.id === savedTab) || activeSteps[0];
  activate(initial.id);
  return { activate, markDone, setProgress, setStreak };
}

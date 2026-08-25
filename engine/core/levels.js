// Level 1 / Level 2 / Level 3 & Adaptive framing.
//
// Level 1 (approaching) = support / scaffolded path (step-by-step hints, friendly numbers).
// Level 2 (core/onLevel) = grade-level standard practice.
// Level 3 (extending)   = stretch challenges, error analysis & multi-step problems.
// "Auto" lets the adaptive engine adjust per-item based on performance.
//
// Non-stigmatizing language: never surface "remedial" or deficit framing in the UI — just "Level 1" / "Level 2" / "Level 3" / "Adaptive".

export const LEVELS = {
  auto: {
    id: "auto",
    label: "⚡ Adaptive",
    title: "Adaptive",
    tier: null,
    blurb: "Matches problems to how you're doing.",
  },
  level1: {
    id: "level1",
    label: "🟢 Level 1",
    title: "Level 1",
    tier: "level1",
    blurb: "Step-by-step with hints & guided support.",
  },
  core: {
    id: "core",
    label: "🔵 Level 2",
    title: "Level 2",
    tier: "core",
    blurb: "Grade-level standard practice.",
  },
  level2: {
    id: "core",
    label: "🔵 Level 2",
    title: "Level 2",
    tier: "core",
    blurb: "Grade-level standard practice.",
  },
  level3: {
    id: "level3",
    label: "🟣 Level 3",
    title: "Level 3",
    tier: "level2",
    blurb: "Stretch problems, error analysis & challenge.",
  },
};

const STATE_KEY = "preferredLevel";

// Read the student's chosen level from state ("auto" | "level1" | "core" | "level3").
export function getLevel(state) {
  const s = typeof state?.get === "function" ? state.get() : state || {};
  const v = s[STATE_KEY];
  if (v === "1") return "level1";
  if (v === "2") return "core";
  if (v === "3") return "level3";
  return LEVELS[v] ? v : "auto";
}

// Persist the chosen level on state.
export function setLevel(state, levelId) {
  const canonical =
    levelId === "1"
      ? "level1"
      : levelId === "2" || levelId === "level2"
        ? "core"
        : levelId === "3"
          ? "level3"
          : LEVELS[levelId]
            ? levelId
            : "auto";
  if (typeof state?.set === "function") state.set({ [STATE_KEY]: canonical });
}

// Translate the chosen level into an adaptive override.
// "auto" -> null (let adaptive.js decide); explicit levels pin the tier.
export function levelOverride(state) {
  const lvl = getLevel(state);
  return LEVELS[lvl]?.tier ?? null;
}

// Mount a small, friendly level selector. Calls onChange(levelId) when picked.
// Returns the root element.
export function mountLevelSelector(container, state, onChange) {
  const current = getLevel(state);

  const wrap = document.createElement("div");
  wrap.className = "level-selector";
  wrap.setAttribute("role", "radiogroup");
  wrap.setAttribute("aria-label", "Choose your path");

  const intro = document.createElement("div");
  intro.className = "level-selector-intro";
  intro.textContent = "Pick your practice level:";
  wrap.append(intro);

  const row = document.createElement("div");
  row.className = "level-selector-row";

  const options = [
    {
      id: "level1",
      aliases: ["1", "level1"],
      title: "🟢 Level 1",
      blurb: "Step-by-step with hints & guided support.",
    },
    {
      id: "core",
      aliases: ["2", "level2", "core"],
      title: "🔵 Level 2",
      blurb: "Grade-level standard practice.",
    },
    {
      id: "level3",
      aliases: ["3", "level3", "extending"],
      title: "🟣 Level 3",
      blurb: "Stretch problems & error analysis.",
    },
    {
      id: "auto",
      aliases: ["auto", "adaptive"],
      title: "⚡ Adaptive",
      blurb: "Matches problems to how you're doing.",
    },
  ];

  options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "level-option";
    btn.dataset.level = opt.id;
    opt.aliases.forEach((a) => (btn.dataset[`alias_${a}`] = "true"));
    btn.setAttribute("role", "radio");
    const isSelected = current === opt.id || (current === "level2" && opt.id === "core");
    btn.setAttribute("aria-checked", isSelected ? "true" : "false");
    if (isSelected) btn.classList.add("selected");
    btn.innerHTML = `
      <span class="level-option-title">${opt.title}</span>
      <span class="level-option-blurb">${opt.blurb}</span>
    `;
    btn.addEventListener("click", () => {
      row.querySelectorAll(".level-option").forEach((b) => {
        b.classList.toggle("selected", b === btn);
        b.setAttribute("aria-checked", b === btn ? "true" : "false");
      });
      setLevel(state, opt.id);
      if (onChange) onChange(opt.id);
    });
    row.append(btn);
  });

  wrap.append(row);
  if (container) container.append(wrap);
  return wrap;
}

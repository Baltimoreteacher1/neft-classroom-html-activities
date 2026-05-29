// Level 1 / Level 2 framing.
//
// Level 1 = support / scaffolded path (vocab-first, more hints, simpler items).
// Level 2 = enrichment / extension path.
// "Auto" lets the adaptive engine choose per-item.
//
// Non-stigmatizing language: never surface "support", "remedial", or any
// deficit framing in the UI — just "Level 1" / "Level 2".

export const LEVELS = {
  auto: { id: "auto", label: "Adaptive", tier: null },
  level1: { id: "level1", label: "Level 1", tier: "level1" },
  level2: { id: "level2", label: "Level 2", tier: "level2" },
};

const STATE_KEY = "preferredLevel";

// Read the student's chosen level from state ("auto" | "level1" | "level2").
export function getLevel(state) {
  const s = typeof state?.get === "function" ? state.get() : state || {};
  const v = s[STATE_KEY];
  return LEVELS[v] ? v : "auto";
}

// Persist the chosen level on state.
export function setLevel(state, levelId) {
  if (!LEVELS[levelId]) return;
  if (typeof state?.set === "function") state.set({ [STATE_KEY]: levelId });
}

// Translate the chosen level into an adaptive override.
// "auto" -> null (let adaptive.js decide); explicit levels pin the tier.
export function levelOverride(state) {
  const lvl = getLevel(state);
  return LEVELS[lvl]?.tier || null;
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
  intro.textContent = "Pick how you'd like to work:";
  wrap.append(intro);

  const row = document.createElement("div");
  row.className = "level-selector-row";

  const options = [
    {
      id: "level1",
      title: "Level 1",
      blurb: "Step-by-step with hints and worked examples.",
    },
    {
      id: "auto",
      title: "Adaptive",
      blurb: "We'll match problems to how you're doing.",
    },
    {
      id: "level2",
      title: "Level 2",
      blurb: "Stretch problems and challenges.",
    },
  ];

  options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "level-option";
    btn.dataset.level = opt.id;
    btn.setAttribute("role", "radio");
    btn.setAttribute("aria-checked", current === opt.id ? "true" : "false");
    if (current === opt.id) btn.classList.add("selected");
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

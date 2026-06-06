import { deriveHintLadder } from "./content-enrichment.js";

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

/**
 * Mount a 3-rung progressive hint ladder before first answer attempt.
 * Returns { getHintsUsed, destroy }.
 */
export function mountHintLadder(host, { problem, state, onHintUsed } = {}) {
  const hints = deriveHintLadder(problem);
  if (!hints.length) return { getHintsUsed: () => 0, destroy: () => {} };

  let revealed = 0;
  const ladder = document.createElement("div");
  ladder.className = "hint-ladder";
  ladder.setAttribute("aria-label", "Progressive hints");

  const header = document.createElement("div");
  header.className = "hint-ladder-header";
  header.innerHTML = `
    <span class="hint-ladder-title">Need a nudge?</span>
    <span class="hint-ladder-count" aria-live="polite">0 / 3 hints</span>`;
  ladder.append(header);

  const steps = document.createElement("div");
  steps.className = "hint-ladder-steps";
  ladder.append(steps);

  hints.forEach((hint, idx) => {
    const step = document.createElement("div");
    step.className = "hint-ladder-step";
    step.dataset.level = String(idx + 1);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "hint-ladder-btn";
    btn.textContent = hint.label;
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-controls", `hint-body-${idx}`);

    const body = document.createElement("div");
    body.id = `hint-body-${idx}`;
    body.className = "hint-ladder-body";
    body.hidden = true;
    body.innerHTML = `<p>${esc(hint.text)}</p>`;

    btn.addEventListener("click", () => {
      if (idx > revealed) return;
      const open = body.hidden;
      body.hidden = !open;
      btn.setAttribute("aria-expanded", String(open));
      step.classList.toggle("is-open", open);
      if (open && idx === revealed) {
        revealed = Math.min(revealed + 1, hints.length);
        state?.recordHintUsed?.();
        onHintUsed?.(revealed);
        updateUI();
      }
    });

    step.append(btn, body);
    steps.append(step);
  });

  function updateUI() {
    const countEl = header.querySelector(".hint-ladder-count");
    if (countEl) countEl.textContent = `${revealed} / ${hints.length} hints`;

    steps.querySelectorAll(".hint-ladder-step").forEach((step, i) => {
      const btn = step.querySelector(".hint-ladder-btn");
      if (i <= revealed) {
        step.classList.add("is-available");
        btn.disabled = false;
      } else {
        step.classList.remove("is-available");
        btn.disabled = true;
      }
      if (i < revealed) step.classList.add("is-used");
    });

    const nextBtn = steps.querySelector(
      `.hint-ladder-step[data-level="${revealed + 1}"] .hint-ladder-btn`,
    );
    if (nextBtn && revealed < hints.length) {
      nextBtn.textContent = hints[revealed].label;
    }
  }

  // First hint available immediately
  revealed = 0;
  updateUI();
  const firstBtn = steps.querySelector(".hint-ladder-btn");
  if (firstBtn) {
    steps.querySelector(".hint-ladder-step").classList.add("is-available");
    firstBtn.disabled = false;
  }

  host.prepend(ladder);

  return {
    getHintsUsed: () => state?.get?.()?.hintsUsed ?? revealed,
    destroy: () => ladder.remove(),
  };
}

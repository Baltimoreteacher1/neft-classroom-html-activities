const LETTERS = ["A", "B", "C", "D", "E", "F"];

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

const MC_STYLE_ID = "mc-enhancements-styles";

// Inject this component's scoped polish styles exactly once per document.
// Purely additive: it layers entrance, easing, selection, and celebration
// motion on top of the existing design-system classes without altering any
// animation NAME or DURATION (the .shake-once / .success-glow `animationend`
// contract the JS relies on stays intact). Every new motion is fully disabled
// under prefers-reduced-motion: reduce.
function injectMultipleChoiceStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(MC_STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = MC_STYLE_ID;
  style.textContent = `
    @media (prefers-reduced-motion: no-preference) {
      /* Staggered entrance for each answer option */
      .mc-problem .mc-options .mc-option-label.mc-anim-in {
        opacity: 0;
        animation: mcOptionIn 0.42s cubic-bezier(0.22, 1, 0.36, 1) both;
        animation-delay: calc(var(--mc-i, 0) * 70ms);
      }

      @keyframes mcOptionIn {
        from {
          opacity: 0;
          transform: translateY(10px) scale(0.98);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      /* Smooth, springy scale + color transition when an option is picked */
      .mc-problem .mc-option-label {
        transition:
          background-color 0.22s ease,
          border-color 0.22s ease,
          color 0.22s ease,
          transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1),
          box-shadow 0.22s ease;
      }

      .mc-problem .mc-option-label.is-selected:not(.is-correct):not(.is-incorrect) {
        transform: translateX(3px) scale(1.015);
        box-shadow: 0 4px 14px rgba(15, 118, 110, 0.18);
      }

      .mc-problem .mc-option-label .mc-letter-badge {
        transition:
          background-color 0.22s ease,
          color 0.22s ease,
          transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .mc-problem .mc-option-label.is-selected .mc-letter-badge {
        transform: scale(1.08);
      }

      /* Refine the existing shake + success-glow easing (same name/duration,
         so the wrapper's animationend cleanup still fires on schedule). */
      .mc-problem.shake-once {
        animation-timing-function: cubic-bezier(0.36, 0.07, 0.19, 0.97);
      }

      .mc-problem.success-glow {
        animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
      }

      /* Celebration particle burst layer for a correct answer */
      .mc-celebrate-layer {
        position: absolute;
        inset: 0;
        pointer-events: none;
        overflow: visible;
        z-index: 2;
      }

      .mc-celebrate-piece {
        position: absolute;
        top: var(--mc-y, 30%);
        left: var(--mc-x, 50%);
        width: 9px;
        height: 9px;
        border-radius: 2px;
        background: var(--mc-color, var(--teal, #0f766e));
        opacity: 0;
        will-change: transform, opacity;
        animation: mcConfettiBurst 0.85s cubic-bezier(0.18, 0.7, 0.32, 1) forwards;
        animation-delay: var(--mc-delay, 0ms);
      }

      @keyframes mcConfettiBurst {
        0% {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.4) rotate(0deg);
        }
        12% {
          opacity: 1;
        }
        100% {
          opacity: 0;
          transform:
            translate(
              calc(-50% + var(--mc-dx, 0px)),
              calc(-50% + var(--mc-dy, 0px))
            )
            scale(1)
            rotate(var(--mc-rot, 180deg));
        }
      }
    }

    /* The wrapper needs positioning context for the absolute burst layer.
       Safe in all motion modes; layout-only, no animation. */
    .mc-problem {
      position: relative;
    }
  `;
  document.head.append(style);
}

// Confetti color palette drawn from the shared design tokens.
const MC_CONFETTI_COLORS = [
  "var(--teal, #0f766e)",
  "var(--success, #0f7c4a)",
  "var(--gold, #b7791f)",
  "var(--coral, #c2410c)",
  "var(--navy, #12355b)",
];

// Spawn a lightweight, self-removing particle burst over the wrapper for a
// correct answer. No assets, no globals; respects reduced-motion by skipping
// entirely. The layer cleans itself up after the longest piece finishes.
function fireChoiceConfetti(wrapper) {
  if (typeof document === "undefined" || !wrapper) return;
  const reduce =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  const layer = document.createElement("div");
  layer.className = "mc-celebrate-layer";
  layer.setAttribute("aria-hidden", "true");

  const pieces = 18;
  for (let i = 0; i < pieces; i++) {
    const piece = document.createElement("span");
    piece.className = "mc-celebrate-piece";
    const angle = (Math.PI * 2 * i) / pieces + Math.random() * 0.4;
    const dist = 70 + Math.random() * 90;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist - 30; // bias upward
    piece.style.setProperty("--mc-x", `${35 + Math.random() * 30}%`);
    piece.style.setProperty("--mc-y", `${20 + Math.random() * 20}%`);
    piece.style.setProperty("--mc-dx", `${dx.toFixed(1)}px`);
    piece.style.setProperty("--mc-dy", `${dy.toFixed(1)}px`);
    piece.style.setProperty(
      "--mc-rot",
      `${(Math.random() * 540 - 270).toFixed(0)}deg`,
    );
    piece.style.setProperty(
      "--mc-delay",
      `${Math.floor(Math.random() * 90)}ms`,
    );
    piece.style.setProperty(
      "--mc-color",
      MC_CONFETTI_COLORS[i % MC_CONFETTI_COLORS.length],
    );
    layer.append(piece);
  }

  wrapper.append(layer);
  window.setTimeout(() => layer.remove(), 1100);
}

export function renderMultipleChoice(
  container,
  { stem, choices, correctIndex, explanation, onAnswer, hideStem },
) {
  injectMultipleChoiceStyles();

  const id = `mc-${Math.random().toString(36).slice(2, 8)}`;
  const wrapper = document.createElement("div");
  wrapper.className = "mc-problem";

  if (stem && !hideStem) {
    const stemEl = document.createElement("p");
    stemEl.className = "problem-stem";
    stemEl.textContent = stem;
    wrapper.append(stemEl);
  }

  const optionsWrap = document.createElement("div");
  optionsWrap.className = "mc-options";
  optionsWrap.setAttribute("role", "radiogroup");
  optionsWrap.setAttribute("aria-label", "Answer choices");

  let selected = null;
  let answered = false;

  choices.forEach((choice, i) => {
    const label = document.createElement("label");
    label.className = "mc-option-label mc-anim-in";
    label.style.setProperty("--mc-i", String(i));
    label.id = `label_${id}_${i}`;
    label.setAttribute("for", `${id}_${i}`);

    const input = document.createElement("input");
    input.type = "radio";
    input.name = id;
    input.id = `${id}_${i}`;
    input.value = String(i);
    input.setAttribute("aria-label", `Option ${LETTERS[i]}: ${choice}`);

    const radio = document.createElement("span");
    radio.className = "custom-radio";
    radio.setAttribute("aria-hidden", "true");

    const letter = document.createElement("span");
    letter.className = "mc-letter-badge";
    letter.textContent = LETTERS[i];

    const text = document.createElement("span");
    text.className = "choice-text";
    text.textContent = choice;

    label.append(input, radio, letter, text);

    input.addEventListener("change", () => {
      if (answered) return;
      selected = i;
      optionsWrap.querySelectorAll(".mc-option-label").forEach((l) => {
        l.classList.remove("is-selected");
      });
      label.classList.add("is-selected");
    });

    label.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        input.checked = true;
        input.dispatchEvent(new Event("change"));
      }
    });

    optionsWrap.append(label);
  });

  wrapper.append(optionsWrap);

  const feedbackSlot = document.createElement("div");
  feedbackSlot.className = "problem-check-result";
  wrapper.append(feedbackSlot);

  const checkRow = document.createElement("div");
  checkRow.className = "problem-check-row";

  const checkBtn = document.createElement("button");
  checkBtn.type = "button";
  checkBtn.className = "btn btn-primary btn-check-one";
  checkBtn.textContent = "Check Answer";

  const tryAgainBtn = document.createElement("button");
  tryAgainBtn.type = "button";
  tryAgainBtn.className = "btn btn-secondary btn-try-again";
  tryAgainBtn.textContent = "Try Again";
  tryAgainBtn.style.display = "none";

  checkBtn.addEventListener("click", () => {
    if (selected === null || answered) return;
    answered = true;

    const isCorrect = selected === correctIndex;
    const labels = optionsWrap.querySelectorAll(".mc-option-label");

    labels.forEach((l) =>
      l.classList.remove("is-correct", "is-incorrect", "is-selected"),
    );
    labels[correctIndex].classList.add("is-correct");

    if (!isCorrect) {
      labels[selected].classList.add("is-incorrect");
      wrapper.classList.add("shake-once");
      wrapper.addEventListener(
        "animationend",
        () => wrapper.classList.remove("shake-once"),
        { once: true },
      );
    } else {
      wrapper.classList.add("success-glow");
      if (window.fireConfetti) window.fireConfetti();
      fireChoiceConfetti(wrapper);
    }

    const fbMsg = isCorrect
      ? explanation || "Correct! Great work."
      : `Not quite. The answer is ${LETTERS[correctIndex]}. ${explanation || ""}`;

    feedbackSlot.className = `problem-check-result visible ${isCorrect ? "is-correct" : "is-incorrect"}`;
    feedbackSlot.setAttribute("role", "alert");
    feedbackSlot.innerHTML = `<span class="feedback-icon">${isCorrect ? "✓" : "💡"}</span><span>${esc(fbMsg)}</span>`;

    checkBtn.style.display = "none";
    if (!isCorrect) {
      tryAgainBtn.style.display = "inline-flex";
    }

    if (onAnswer) onAnswer(isCorrect);
  });

  tryAgainBtn.addEventListener("click", () => {
    answered = false;
    selected = null;
    wrapper.classList.remove("success-glow", "shake-once");
    wrapper
      .querySelectorAll(".mc-celebrate-layer")
      .forEach((layer) => layer.remove());
    optionsWrap.querySelectorAll(".mc-option-label").forEach((l) => {
      l.classList.remove("is-correct", "is-incorrect", "is-selected");
      const inp = l.querySelector('input[type="radio"]');
      if (inp) inp.checked = false;
    });
    feedbackSlot.className = "problem-check-result";
    feedbackSlot.innerHTML = "";
    checkBtn.style.display = "inline-flex";
    tryAgainBtn.style.display = "none";
    checkBtn.focus();
  });

  checkRow.append(checkBtn, tryAgainBtn);
  wrapper.append(checkRow);
  container.append(wrapper);

  return {
    getSelected: () => selected,
    isCorrect: () => answered && selected === correctIndex,
  };
}

export function renderErrorAnalysis(
  container,
  { title, workedExample, errorStep, correctWork, hints, onAnswer },
) {
  injectErrorAnalysisStyles();

  const wrapper = document.createElement("div");
  wrapper.className = "card ea-root";

  const header = document.createElement("div");
  header.className = "section-header";
  header.innerHTML = `
    <div class="section-icon section-icon-coral">🔎</div>
    <div>
      <div class="section-title" style="font-size:1.2rem;">${escHtml(title || "Find the Error")}</div>
      <div class="section-desc">A student solved this problem. Something went wrong — can you find it?</div>
    </div>
  `;
  wrapper.append(header);

  const workCard = document.createElement("div");
  workCard.className = "card-compact";
  workCard.style.cssText =
    "background:var(--cream); border:2px solid var(--line); border-radius:var(--radius-md);";

  const steps = workedExample
    .map((step, i) => {
      const isError = i === errorStep;
      return `
      <div class="ea-step" data-step="${i}" role="button" tabindex="0"
        aria-pressed="false" aria-label="Step ${i + 1}: ${escHtml(step.label)}" style="
        display:grid; grid-template-columns:32px 1fr; gap:var(--sp-3); align-items:start;
        padding:10px 12px; border-radius:var(--radius-sm); margin:var(--sp-1) 0;
        cursor:pointer; transition:all var(--duration-fast) ease;
        border:2px solid transparent;
      ">
        <span class="ea-step-badge" style="
          width:32px; height:32px; border-radius:8px; display:grid; place-items:center;
          background:var(--navy); color:white; font-weight:900; font-size:0.82rem;
        ">S${i + 1}</span>
        <div>
          <div style="font-weight:600; font-size:0.95rem;">${escHtml(step.label)}</div>
          <div style="font-family:var(--font-mono); font-size:1.05rem; margin-top:2px; color:var(--navy);">
            ${escHtml(step.work)}
          </div>
        </div>
      </div>
    `;
    })
    .join("");

  workCard.innerHTML = steps;
  wrapper.append(workCard);

  const instruction = document.createElement("p");
  instruction.style.cssText =
    "font-weight:700; margin:var(--sp-4) 0 var(--sp-2); color:var(--navy);";
  instruction.textContent = "Click the step that contains the error:";
  wrapper.append(instruction);

  const explainLabel = document.createElement("p");
  explainLabel.style.cssText =
    "font-weight:600; margin:var(--sp-4) 0 var(--sp-2);";
  explainLabel.textContent = "Explain what went wrong and how to fix it:";
  explainLabel.style.display = "none";
  wrapper.append(explainLabel);

  const textarea = document.createElement("textarea");
  textarea.className = "text-input ea-textarea";
  textarea.rows = 3;
  textarea.placeholder = "The error is in this step because...";
  textarea.style.display = "none";
  wrapper.append(textarea);

  // Auto-expand the textarea to fit its content as the student types.
  const autoGrow = () => {
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  };
  textarea.addEventListener("input", autoGrow);

  const feedbackSlot = document.createElement("div");
  feedbackSlot.className = "mt-4";
  wrapper.append(feedbackSlot);

  const checkBtn = document.createElement("button");
  checkBtn.className = "btn btn-primary mt-4 ea-check-btn";
  checkBtn.textContent = "Check My Analysis";
  checkBtn.style.display = "none";
  wrapper.append(checkBtn);

  let selectedStep = null;
  let answered = false;
  let hintIndex = 0;

  const selectStep = (stepEl) => {
    if (answered) return;
    selectedStep = parseInt(stepEl.dataset.step, 10);

    workCard.querySelectorAll(".ea-step").forEach((s) => {
      s.style.borderColor = "transparent";
      s.style.background = "transparent";
      s.dataset.selected = "false";
      s.setAttribute("aria-pressed", "false");
    });

    stepEl.style.borderColor = "var(--coral)";
    stepEl.style.background = "var(--coral-light)";
    stepEl.dataset.selected = "true";
    stepEl.setAttribute("aria-pressed", "true");

    explainLabel.style.display = "";
    textarea.style.display = "";
    checkBtn.style.display = "";
  };

  workCard.querySelectorAll(".ea-step").forEach((stepEl) => {
    stepEl.addEventListener("click", () => selectStep(stepEl));
    stepEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        selectStep(stepEl);
      }
    });
  });

  checkBtn.addEventListener("click", () => {
    if (answered || selectedStep === null) return;
    const explanation = textarea.value.trim();

    if (selectedStep !== errorStep) {
      const hint =
        hints && hints[hintIndex]
          ? hints[hintIndex]
          : "Look carefully at each step. Check the math operation — does the result match what the step claims?";
      hintIndex = Math.min(hintIndex + 1, (hints?.length || 1) - 1);
      showFb(feedbackSlot, "hint", `That step is actually correct. ${hint}`);
      return;
    }

    if (explanation.length < 15) {
      showFb(
        feedbackSlot,
        "hint",
        "Good — you found the right step! Now explain what the error is and how to fix it.",
      );
      return;
    }

    answered = true;
    textarea.readOnly = true;
    checkBtn.style.display = "none";

    workCard.querySelectorAll(".ea-step").forEach((s, i) => {
      s.dataset.selected = "false";
      s.setAttribute("aria-pressed", "false");
      s.removeAttribute("tabindex");
      if (i === errorStep) {
        s.style.borderColor = "var(--success)";
        s.style.background = "var(--success-bg)";
        s.dataset.correct = "true";
        if (!s.querySelector(".ea-check-mark")) {
          const mark = document.createElement("span");
          mark.className = "ea-check-mark";
          mark.setAttribute("aria-hidden", "true");
          mark.textContent = "✓";
          const badge = s.querySelector(".ea-step-badge");
          if (badge) badge.append(mark);
        }
      }
    });

    const msg = correctWork
      ? `Excellent analysis! The correct work for this step: <strong>${escHtml(correctWork)}</strong>`
      : "Excellent error analysis! You identified the mistake and explained the fix.";
    showFb(feedbackSlot, "success", msg);

    if (onAnswer) onAnswer(true);
  });

  container.append(wrapper);
}

function showFb(slot, type, msg) {
  const fb = document.createElement("div");
  fb.className = `feedback feedback-${type} visible`;
  fb.setAttribute("role", "alert");
  fb.innerHTML = `
    <span class="feedback-icon">${type === "success" ? "✓" : "💡"}</span>
    <span>${msg}</span>
  `;
  slot.innerHTML = "";
  slot.append(fb);
}

function escHtml(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

const EA_STYLE_ID = "ea-enhancements-styles";

// Inject the component's scoped polish styles exactly once per document.
// All motion is additive and disabled under prefers-reduced-motion: reduce.
function injectErrorAnalysisStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(EA_STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = EA_STYLE_ID;
  style.textContent = `
    /* Selectable step polish */
    .ea-root .ea-step { position: relative; outline: none; }

    .ea-root .ea-step:hover:not([data-correct="true"]) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    /* Accessible focus ring for keyboard users */
    .ea-root .ea-step:focus-visible {
      box-shadow:
        0 0 0 2px var(--cream),
        0 0 0 4px var(--teal);
    }

    /* Selected error-step: glow + subtle scale + growing depth/lift */
    .ea-root .ea-step[data-selected="true"] {
      transform: translateY(-2px) scale(1.02);
      box-shadow:
        0 8px 22px rgba(0, 0, 0, 0.12),
        0 0 0 1px var(--coral),
        0 0 14px var(--coral-light);
    }

    /* Success: correct step glows green */
    .ea-root .ea-step[data-correct="true"] {
      transform: translateY(-1px) scale(1.015);
      box-shadow:
        0 6px 18px rgba(0, 0, 0, 0.10),
        0 0 16px var(--success-bg);
      animation: eaCorrectGlow 1.6s ease-in-out 1;
    }

    /* Checkmark scale-in on the step badge */
    .ea-root .ea-check-mark {
      position: absolute;
      top: -6px;
      right: -6px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: var(--success);
      color: #fff;
      font-size: 0.7rem;
      font-weight: 900;
      line-height: 1;
      transform-origin: center;
      animation: eaCheckPop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) 1;
    }

    /* Textarea auto-expand: smooth height transitions + comfortable sizing */
    .ea-root .ea-textarea {
      transition: height var(--duration-fast) ease, box-shadow var(--duration-fast) ease;
      min-height: 4.5rem;
      overflow: hidden;
      resize: vertical;
    }

    @keyframes eaCheckPop {
      0%   { transform: scale(0); opacity: 0; }
      70%  { transform: scale(1.25); opacity: 1; }
      100% { transform: scale(1); opacity: 1; }
    }

    @keyframes eaCorrectGlow {
      0%   { box-shadow: 0 6px 18px rgba(0,0,0,0.10), 0 0 0 var(--success-bg); }
      40%  { box-shadow: 0 6px 18px rgba(0,0,0,0.10), 0 0 22px var(--success); }
      100% { box-shadow: 0 6px 18px rgba(0,0,0,0.10), 0 0 16px var(--success-bg); }
    }

    /* Mobile: stack the textarea and button vertically, enlarge the textarea */
    @media (max-width: 600px) {
      .ea-root .ea-textarea {
        width: 100%;
        min-height: 6.5rem;
        font-size: 1.05rem;
      }
      .ea-root .ea-check-btn {
        display: block;
        width: 100%;
      }
    }

    /* Accessibility: disable/neutralize all motion when requested */
    @media (prefers-reduced-motion: reduce) {
      .ea-root .ea-step,
      .ea-root .ea-step:hover:not([data-correct="true"]),
      .ea-root .ea-step[data-selected="true"],
      .ea-root .ea-step[data-correct="true"] {
        transform: none;
        animation: none;
      }
      .ea-root .ea-check-mark {
        animation: none;
      }
      .ea-root .ea-textarea {
        transition: none;
      }
    }
  `;

  (document.head || document.documentElement).append(style);
}

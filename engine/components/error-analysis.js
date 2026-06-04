export function renderErrorAnalysis(
  container,
  { title, workedExample, errorStep, correctWork, hints, onAnswer },
) {
  const wrapper = document.createElement("div");
  wrapper.className = "card";

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
      <div class="ea-step" data-step="${i}" style="
        display:grid; grid-template-columns:32px 1fr; gap:var(--sp-3); align-items:start;
        padding:10px 12px; border-radius:var(--radius-sm); margin:var(--sp-1) 0;
        cursor:pointer; transition:all var(--duration-fast) ease;
        border:2px solid transparent;
      ">
        <span style="
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
  textarea.className = "text-input";
  textarea.rows = 3;
  textarea.placeholder = "The error is in this step because...";
  textarea.style.display = "none";
  wrapper.append(textarea);

  const feedbackSlot = document.createElement("div");
  feedbackSlot.className = "mt-4";
  wrapper.append(feedbackSlot);

  const checkBtn = document.createElement("button");
  checkBtn.className = "btn btn-primary mt-4";
  checkBtn.textContent = "Check My Analysis";
  checkBtn.style.display = "none";
  wrapper.append(checkBtn);

  let selectedStep = null;
  let answered = false;
  let hintIndex = 0;

  workCard.querySelectorAll(".ea-step").forEach((stepEl) => {
    stepEl.addEventListener("click", () => {
      if (answered) return;
      selectedStep = parseInt(stepEl.dataset.step, 10);

      workCard.querySelectorAll(".ea-step").forEach((s) => {
        s.style.borderColor = "transparent";
        s.style.background = "transparent";
      });

      stepEl.style.borderColor = "var(--coral)";
      stepEl.style.background = "var(--coral-light)";

      explainLabel.style.display = "";
      textarea.style.display = "";
      checkBtn.style.display = "";
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
      if (i === errorStep) {
        s.style.borderColor = "var(--success)";
        s.style.background = "var(--success-bg)";
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

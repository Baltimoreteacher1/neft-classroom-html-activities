export function renderOpenResponse(
  container,
  { prompt, sentenceFrame, keywords, minLength, onSubmit },
) {
  const wrapper = document.createElement("div");
  wrapper.className = "card card-teal";

  const promptEl = document.createElement("p");
  promptEl.style.cssText =
    "font-size:1rem; font-weight:600; margin:0 0 var(--sp-3); line-height:1.5;";
  promptEl.textContent = prompt;
  wrapper.append(promptEl);

  if (sentenceFrame) {
    const frame = document.createElement("div");
    frame.className = "sentence-frame";
    frame.innerHTML = sentenceFrame.replace(
      /___/g,
      '<span class="blank">&nbsp;</span>',
    );
    wrapper.append(frame);
  }

  const textarea = document.createElement("textarea");
  textarea.className = "text-input";
  textarea.rows = 3;
  textarea.placeholder = "Type your response here...";
  textarea.setAttribute("aria-label", prompt);
  wrapper.append(textarea);

  const charCount = document.createElement("div");
  charCount.style.cssText =
    "font-size:0.78rem; color:var(--muted); margin-top:var(--sp-1); text-align:right;";
  charCount.textContent = `0 / ${minLength || 20} characters minimum`;
  wrapper.append(charCount);

  textarea.addEventListener("input", () => {
    const len = textarea.value.trim().length;
    const min = minLength || 20;
    charCount.textContent = `${len} / ${min} characters minimum`;
    charCount.style.color = len >= min ? "var(--success)" : "var(--muted)";
  });

  const feedbackSlot = document.createElement("div");
  feedbackSlot.className = "mt-4";
  wrapper.append(feedbackSlot);

  const submitBtn = document.createElement("button");
  submitBtn.className = "btn btn-primary mt-4";
  submitBtn.textContent = "Submit Response";

  let submitted = false;

  submitBtn.addEventListener("click", () => {
    if (submitted) return;
    const text = textarea.value.trim();
    const min = minLength || 20;

    if (text.length < min) {
      showFeedback(
        feedbackSlot,
        "hint",
        `Write at least ${min} characters. You have ${text.length}.`,
      );
      return;
    }

    if (keywords && keywords.length > 0) {
      const lower = text.toLowerCase();
      const found = keywords.filter((kw) => lower.includes(kw.toLowerCase()));
      const missing = keywords.length - found.length;

      if (found.length === 0) {
        showFeedback(
          feedbackSlot,
          "hint",
          `Try using math vocabulary in your response. Think about: ${keywords.slice(0, 3).join(", ")}.`,
        );
        return;
      }

      if (missing > Math.ceil(keywords.length / 2)) {
        showFeedback(
          feedbackSlot,
          "hint",
          `Good start! Can you also include: ${keywords
            .filter((kw) => !lower.includes(kw.toLowerCase()))
            .slice(0, 2)
            .join(", ")}?`,
        );
        return;
      }
    }

    submitted = true;
    textarea.readOnly = true;
    submitBtn.style.display = "none";
    showFeedback(
      feedbackSlot,
      "success",
      "Great response! Your thinking is recorded.",
    );
    if (onSubmit) onSubmit(text, true);
  });

  wrapper.append(submitBtn);
  container.append(wrapper);

  return {
    getValue: () => textarea.value.trim(),
    isSubmitted: () => submitted,
  };
}

function showFeedback(slot, type, message) {
  const fb = document.createElement("div");
  fb.className = `feedback feedback-${type} visible`;
  fb.setAttribute("role", "alert");
  fb.innerHTML = `
    <span class="feedback-icon">${type === "success" ? "✓" : "💡"}</span>
    <span>${message}</span>
  `;
  slot.innerHTML = "";
  slot.append(fb);
}

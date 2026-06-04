export function renderMultipleChoice(
  container,
  { stem, choices, correctIndex, explanation, onAnswer },
) {
  const id = `mc-${Math.random().toString(36).slice(2, 8)}`;
  const wrapper = document.createElement("div");
  wrapper.className = "card";

  const stemEl = document.createElement("p");
  stemEl.className = "mc-stem";
  stemEl.style.cssText =
    "font-size:1.05rem; font-weight:600; margin:0 0 var(--sp-4); line-height:1.5;";
  stemEl.textContent = stem;
  wrapper.append(stemEl);

  const optionsWrap = document.createElement("div");
  optionsWrap.style.cssText =
    "display:flex; flex-direction:column; gap:var(--sp-2);";

  const letters = ["A", "B", "C", "D"];
  let selected = null;
  let answered = false;

  choices.forEach((choice, i) => {
    const btn = document.createElement("button");
    btn.className = "mc-option";
    btn.setAttribute("role", "radio");
    btn.setAttribute("aria-checked", "false");
    btn.setAttribute("aria-label", `Option ${letters[i]}: ${choice}`);
    btn.style.cssText = `
      display:grid; grid-template-columns:36px 1fr; gap:var(--sp-3); align-items:center;
      text-align:left; padding:12px 16px; border:2px solid var(--line); border-radius:var(--radius-md);
      background:white; font-size:0.95rem; transition:all var(--duration-fast) ease;
      min-height:48px;
    `;

    const letter = document.createElement("span");
    letter.style.cssText = `
      width:36px; height:36px; border-radius:10px; display:grid; place-items:center;
      font-weight:900; font-size:0.85rem; background:var(--cream); color:var(--navy);
      transition:all var(--duration-fast) ease;
    `;
    letter.textContent = letters[i];

    const text = document.createElement("span");
    text.textContent = choice;

    btn.append(letter, text);

    btn.addEventListener("click", () => {
      if (answered) return;
      selected = i;
      optionsWrap.querySelectorAll(".mc-option").forEach((opt, oi) => {
        const isSelected = oi === i;
        opt.style.borderColor = isSelected ? "var(--teal)" : "var(--line)";
        opt.style.background = isSelected ? "var(--teal-light)" : "white";
        opt.setAttribute("aria-checked", isSelected ? "true" : "false");
        opt.querySelector("span:first-child").style.background = isSelected
          ? "var(--teal)"
          : "var(--cream)";
        opt.querySelector("span:first-child").style.color = isSelected
          ? "white"
          : "var(--navy)";
      });
    });

    optionsWrap.append(btn);
  });

  wrapper.append(optionsWrap);

  const feedbackSlot = document.createElement("div");
  feedbackSlot.className = "mt-4";
  wrapper.append(feedbackSlot);

  const checkBtn = document.createElement("button");
  checkBtn.className = "btn btn-primary mt-4";
  checkBtn.textContent = "Check Answer";
  checkBtn.addEventListener("click", () => {
    if (selected === null || answered) return;
    answered = true;

    const isCorrect = selected === correctIndex;
    const options = optionsWrap.querySelectorAll(".mc-option");

    options[correctIndex].style.borderColor = "var(--success)";
    options[correctIndex].style.background = "var(--success-bg)";
    options[correctIndex].querySelector("span:first-child").style.background =
      "var(--success)";
    options[correctIndex].querySelector("span:first-child").style.color =
      "white";

    if (!isCorrect) {
      options[selected].style.borderColor = "var(--error)";
      options[selected].style.background = "var(--error-bg)";
      options[selected].querySelector("span:first-child").style.background =
        "var(--error)";
      options[selected].querySelector("span:first-child").style.color = "white";
      options[selected].classList.add("incorrect");
    }

    const fbType = isCorrect ? "success" : "hint";
    const fbMsg = isCorrect
      ? explanation || "Correct! Great work."
      : `Not quite. The answer is ${letters[correctIndex]}. ${explanation || ""}`;

    const fb = document.createElement("div");
    fb.className = `feedback feedback-${fbType} visible`;
    fb.setAttribute("role", "alert");
    fb.innerHTML = `
      <span class="feedback-icon">${isCorrect ? "✓" : "💡"}</span>
      <span>${fbMsg}</span>
    `;
    feedbackSlot.innerHTML = "";
    feedbackSlot.append(fb);

    checkBtn.style.display = "none";

    if (onAnswer) onAnswer(isCorrect);
  });

  wrapper.append(checkBtn);
  container.append(wrapper);

  return {
    getSelected: () => selected,
    isCorrect: () => answered && selected === correctIndex,
  };
}

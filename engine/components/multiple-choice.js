const LETTERS = ["A", "B", "C", "D", "E", "F"];

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

export function renderMultipleChoice(
  container,
  { stem, choices, correctIndex, explanation, onAnswer, hideStem },
) {
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
    label.className = "mc-option-label";
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

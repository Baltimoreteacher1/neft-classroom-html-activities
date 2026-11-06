// Stage 2: Spot the Glitch (Interactive Bug Hunt & Misconception Repair)
// Presents authentic student work with a conceptual slip. Learners inspect steps, diagnose the misconception, and repair the solution.

const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export const GLITCH_CATALOG = [
  {
    id: "frac-add-denominators",
    title: "Adding Fractions with Unlike Denominators",
    problem: "1/3 + 1/4 = ?",
    student: "Alex",
    steps: [
      { num: 1, copy: "Look at the problem: 1/3 + 1/4", isGlitch: false },
      { num: 2, copy: "Add numerators together (1 + 1 = 2) and denominators together (3 + 4 = 7)", isGlitch: true, bugDetail: "Denominators cannot be added! Slices are different sizes." },
      { num: 3, copy: "Conclude that the answer is 2/7", isGlitch: false },
    ],
    misconceptions: [
      { id: "m1", label: "Added denominators straight across without finding common slices", correct: true },
      { id: "m2", label: "Multiplied instead of added the numerators", correct: false },
      { id: "m3", label: "Forgot to simplify 2/7", correct: false },
    ],
    repairPrompt: "What should the common denominator be?",
    repairAnswer: "12",
    repairExplanation: "The pieces must be the same size before adding! The Least Common Denominator of 3 and 4 is 12 (4/12 + 3/12 = 7/12).",
  },
  {
    id: "sub-regroup-reversal",
    title: "Multi-Digit Subtraction with Regrouping",
    problem: "52 − 28 = ?",
    student: "Sam",
    steps: [
      { num: 1, copy: "Line up the columns: 5 tens and 2 ones minus 2 tens and 8 ones", isGlitch: false },
      { num: 2, copy: "In the ones column, take 2 away from 8: 8 − 2 = 6 ones", isGlitch: true, bugDetail: "Cannot subtract top from bottom! You must regroup 1 ten into 10 ones." },
      { num: 3, copy: "In the tens column: 5 − 2 = 3 tens. Answer = 36", isGlitch: false },
    ],
    misconceptions: [
      { id: "m1", label: "Subtracted the smaller top digit from the larger bottom digit", correct: true },
      { id: "m2", label: "Added the ones column instead of subtracting", correct: false },
      { id: "m3", label: "Regrouped two tens instead of one ten", correct: false },
    ],
    repairPrompt: "After regrouping 1 ten into 10 ones, what is the ones column subtraction? (12 − 8)",
    repairAnswer: "4",
    repairExplanation: "Trade 1 ten for 10 ones! 52 becomes 4 tens and 12 ones. 12 − 8 = 4 ones, and 4 tens − 2 tens = 2 tens. Correct answer is 24!",
  },
  {
    id: "order-of-operations-add-first",
    title: "Order of Operations (PEMDAS)",
    problem: "4 + 5 × 3 = ?",
    student: "Jordan",
    steps: [
      { num: 1, copy: "Read left to right: 4 + 5 = 9", isGlitch: true, bugDetail: "Multiplication has higher priority than addition!" },
      { num: 2, copy: "Multiply the sum by 3: 9 × 3 = 27", isGlitch: false },
      { num: 3, copy: "Final answer = 27", isGlitch: false },
    ],
    misconceptions: [
      { id: "m1", label: "Added before multiplying (ignoring order of operations)", correct: true },
      { id: "m2", label: "Calculated 9 × 3 incorrectly", correct: false },
      { id: "m3", label: "Forgot to square the 5", correct: false },
    ],
    repairPrompt: "Multiply first: What is 5 × 3?",
    repairAnswer: "15",
    repairExplanation: "Multiplication comes before addition! 5 × 3 = 15. Then add 4: 4 + 15 = 19.",
  },
  {
    id: "integer-double-negative",
    title: "Subtracting Negative Integers",
    problem: "−6 − (−4) = ?",
    student: "Taylor",
    steps: [
      { num: 1, copy: "Start at −6 on the number line", isGlitch: false },
      { num: 2, copy: "Subtracting a negative means move 4 units left: −6 − 4 = −10", isGlitch: true, bugDetail: "Subtracting a negative is the same as adding its opposite (+4)!" },
      { num: 3, copy: "Final answer = −10", isGlitch: false },
    ],
    misconceptions: [
      { id: "m1", label: "Treated subtracting a negative as moving left instead of adding positive 4", correct: true },
      { id: "m2", label: "Forgot that negative numbers can never be added", correct: false },
      { id: "m3", label: "Counted 5 units instead of 4 units", correct: false },
    ],
    repairPrompt: "−6 + 4 = ?",
    repairAnswer: "-2",
    repairExplanation: "Subtracting a negative is adding the opposite! −6 − (−4) = −6 + 4 = −2.",
  },
];

export function renderGlitchHuntCard(glitch) {
  if (!glitch) glitch = GLITCH_CATALOG[0];

  const stepsHtml = glitch.steps.map((st) => `
    <div class="glitch-step-item" data-step-index="${st.num}" data-is-glitch="${st.isGlitch}" role="button" tabindex="0" aria-label="Step ${st.num}: ${esc(st.copy)}">
      <span class="glitch-step-badge">Step ${st.num}</span>
      <span class="glitch-step-text">${esc(st.copy)}</span>
      <span class="glitch-flag-btn" title="Flag this step as the glitch">🚩 Flag Step</span>
    </div>
  `).join("");

  const choicesHtml = glitch.misconceptions.map((m) => `
    <button type="button" class="glitch-chip" data-misc-id="${m.id}" data-correct="${m.correct}">
      ${esc(m.label)}
    </button>
  `).join("");

  return `
    <div class="glitch-card" data-glitch-id="${glitch.id}">
      <div class="glitch-header">
        <span class="glitch-tag">🕵️ Spot the Glitch (Bug Hunt)</span>
        <h4 class="glitch-title">${esc(glitch.title)}</h4>
        <p class="glitch-sub">
          <strong>${esc(glitch.student)}</strong> solved <code>${esc(glitch.problem)}</code>, but made one conceptual error.
          Can you spot where the reasoning broke down?
        </p>
      </div>

      <div class="glitch-steps-container">
        ${stepsHtml}
      </div>

      <div class="glitch-diagnosis-box" hidden>
        <span class="glitch-box-title">🔍 Great eye! What kind of mistake was made in this step?</span>
        <div class="glitch-chips-group">
          ${choicesHtml}
        </div>
      </div>

      <div class="glitch-repair-box" hidden>
        <span class="glitch-box-title">🛠️ Patch the Solution:</span>
        <p class="glitch-repair-prompt">${esc(glitch.repairPrompt)}</p>
        <div class="glitch-repair-input-row">
          <input type="text" class="glitch-repair-input" placeholder="Type answer..." aria-label="Repair answer" />
          <button type="button" class="glitch-repair-submit">Verify Patch</button>
        </div>
      </div>

      <div class="glitch-feedback-banner" hidden role="status"></div>
    </div>
  `;
}

export function mountGlitchHunt(container, glitch, onComplete) {
  if (!container) return;
  const card = container.matches(".glitch-card") ? container : container.querySelector(".glitch-card");
  if (!card) return;

  const stepItems = card.querySelectorAll(".glitch-step-item");
  const diagnosisBox = card.querySelector(".glitch-diagnosis-box");
  const repairBox = card.querySelector(".glitch-repair-box");
  const feedbackBanner = card.querySelector(".glitch-feedback-banner");

  let flaggedStep = null;

  stepItems.forEach((item) => {
    const handlePick = () => {
      stepItems.forEach((si) => si.classList.remove("is-flagged"));
      item.classList.add("is-flagged");
      const isGlitch = item.dataset.isGlitch === "true";
      flaggedStep = item;

      if (isGlitch) {
        item.classList.add("glitch-correct");
        diagnosisBox.hidden = false;
        feedbackBanner.hidden = false;
        feedbackBanner.className = "glitch-feedback-banner success";
        feedbackBanner.innerHTML = "🎯 <strong>Bingo!</strong> You spotted the exact step where the logic broke down.";
      } else {
        diagnosisBox.hidden = true;
        repairBox.hidden = true;
        feedbackBanner.hidden = false;
        feedbackBanner.className = "glitch-feedback-banner warning";
        feedbackBanner.innerHTML = "👀 Look closer. This step is mathematically valid. Check the other steps!";
      }
    };

    item.addEventListener("click", handlePick);
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handlePick();
      }
    });
  });

  const miscChips = card.querySelectorAll(".glitch-chip");
  miscChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      miscChips.forEach((c) => c.classList.remove("is-selected"));
      chip.classList.add("is-selected");
      const isCorrect = chip.dataset.correct === "true";

      if (isCorrect) {
        chip.classList.add("chip-correct");
        repairBox.hidden = false;
        feedbackBanner.className = "glitch-feedback-banner success";
        feedbackBanner.innerHTML = "💡 <strong>Accurate Diagnosis!</strong> Exactly right. Now patch the calculation.";
      } else {
        feedbackBanner.className = "glitch-feedback-banner warning";
        feedbackBanner.innerHTML = "🤔 Not quite. Re-read what the step actually did.";
      }
    });
  });

  const repairBtn = card.querySelector(".glitch-repair-submit");
  const repairInput = card.querySelector(".glitch-repair-input");
  if (repairBtn && repairInput) {
    repairBtn.addEventListener("click", () => {
      const val = repairInput.value.trim();
      if (val === glitch.repairAnswer) {
        feedbackBanner.className = "glitch-feedback-banner resolved";
        feedbackBanner.innerHTML = `🌟 <strong>Bug Repaired!</strong> ${esc(glitch.repairExplanation)}`;
        repairBtn.disabled = true;
        repairInput.disabled = true;
        if (onComplete) onComplete(glitch);
      } else {
        feedbackBanner.className = "glitch-feedback-banner warning";
        feedbackBanner.innerHTML = `Try again: make sure your calculation resolves the misconception!`;
      }
    });
  }
}

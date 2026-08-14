import { stackContent } from "../core/i18n.js";
import { diagnoseChoice, misconceptionLabel, studentExplanation } from "../core/misconceptions.js";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

// Authored per-choice feedback that carries no information about the chosen
// distractor. These exact strings are templated across hundreds of items, so
// when one of them is what an author left, an inferred diagnosis is strictly
// more useful and takes precedence. Substantive authored feedback still wins.
const BOILERPLATE_FEEDBACK = new Set([
  "Check your operation. Re-read what the problem asks.",
  "Double-check: verify the math step-by-step against the question.",
  "Re-read the problem carefully and try again.",
  "Take another look and try again.",
  "Not quite — try again.",
]);

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

      /* Named-misconception chip above the coaching sentence. Deliberately
         quiet: amber, not red, because it describes thinking rather than
         marking a failure. */
      .mc-diagnosis {
        display: block;
        margin-bottom: var(--sp-2, 0.5rem);
        font-weight: 700;
        font-size: 0.9rem;
        line-height: 1.35;
        color: var(--amber-ink, #7c4a03);
      }
      .mc-feedback-line {
        display: flex;
        gap: var(--sp-2, 0.5rem);
        align-items: flex-start;
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
    piece.style.setProperty("--mc-rot", `${(Math.random() * 540 - 270).toFixed(0)}deg`);
    piece.style.setProperty("--mc-delay", `${Math.floor(Math.random() * 90)}ms`);
    piece.style.setProperty("--mc-color", MC_CONFETTI_COLORS[i % MC_CONFETTI_COLORS.length]);
    layer.append(piece);
  }

  wrapper.append(layer);
  window.setTimeout(() => layer.remove(), 1100);
}

export function renderMultipleChoice(container, opts) {
  let {
    stem,
    stemEs,
    choices,
    choicesEs,
    correctIndex,
    explanation,
    explanationEs,
    onAnswer,
    hideStem,
    choiceFeedback,
    choiceFeedbackEs,
    hint,
    scaffold,
  } = opts || {};
  injectMultipleChoiceStyles();

  // Fail safe on malformed authoring rather than throwing at check time
  // (labels[correctIndex] would be undefined) and blanking the activity.
  if (!Array.isArray(choices) || choices.length < 2) {
    const warn = document.createElement("p");
    warn.className = "problem-stem";
    warn.textContent = stem || "This question is unavailable.";
    container.append(warn);
    return;
  }
  if (typeof correctIndex !== "number" || correctIndex < 0 || correctIndex >= choices.length) {
    correctIndex = 0;
  }

  const id = `mc-${Math.random().toString(36).slice(2, 8)}`;
  const wrapper = document.createElement("div");
  wrapper.className = "mc-problem";

  if (stem && !hideStem) {
    const stemEl = document.createElement("p");
    stemEl.className = "problem-stem";
    // Let students mark up the problem text (highlight / underline / bold).
    stemEl.setAttribute("data-annotate", "word-problem");
    stemEl.innerHTML = stackContent(stem, stemEs);
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
    // The radio's aria-label above deliberately stays English-only: it already
    // reads "Option A: <choice>", and stacking a second language into an
    // accessible name makes screen-reader output worse, not more inclusive.
    // The VISIBLE lane is what gains Spanish.
    text.innerHTML = stackContent(choice, Array.isArray(choicesEs) ? choicesEs[i] : undefined);

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

  let wrongAttempts = 0;

  checkBtn.addEventListener("click", () => {
    if (selected === null || answered) return;
    answered = true;

    const isCorrect = selected === correctIndex;
    const labels = optionsWrap.querySelectorAll(".mc-option-label");
    const diagnosis = isCorrect ? null : diagnoseChoice(opts, selected);

    labels.forEach((l) => l.classList.remove("is-correct", "is-incorrect", "is-selected"));

    let fbMsg;
    // Spanish lane for the same message. Left undefined wherever the item has
    // no translated source, so `stackContent` falls back to English alone
    // rather than printing a blank second line.
    let fbMsgEs;
    // Only reveal the correct choice once the student has had a retry — naming
    // the answer on the first miss makes "Try Again" pointless.
    let revealAnswer = isCorrect;

    if (isCorrect) {
      labels[correctIndex].classList.add("is-correct");
      wrapper.classList.add("success-glow");
      if (window.fireConfetti) window.fireConfetti();
      fireChoiceConfetti(wrapper);
      fbMsg = explanation || "Correct! Great work.";
      fbMsgEs = explanationEs || (explanation ? undefined : "¡Correcto! Buen trabajo.");
      checkBtn.style.display = "none";
    } else {
      wrongAttempts += 1;
      labels[selected].classList.add("is-incorrect");
      wrapper.classList.add("shake-once");
      wrapper.addEventListener("animationend", () => wrapper.classList.remove("shake-once"), {
        once: true,
      });
      revealAnswer = wrongAttempts >= 2;
      checkBtn.style.display = "none";
      if (revealAnswer) {
        // Out of retries — show the answer so the student isn't stuck.
        labels[correctIndex].classList.add("is-correct");
        fbMsg = `The answer is ${LETTERS[correctIndex]}. ${explanation || ""}`.trim();
        fbMsgEs = `La respuesta es ${LETTERS[correctIndex]}. ${explanationEs || ""}`.trim();
      } else {
        // Coach the retry instead of a bare "wrong": prefer authored
        // per-choice feedback (why THIS distractor tempts), then the problem's
        // own hint/scaffold — never text that names the correct letter.
        //
        // The diagnosis outranks BOILERPLATE authored feedback but not real
        // authored feedback. That ordering is measured, not assumed: 5,262 of
        // the distractor slots carry a string, but the three sentences in
        // BOILERPLATE_FEEDBACK alone account for ~450 of them and say nothing
        // about the chosen distractor, so "Check your operation." was actively
        // worse than naming what the student appears to have done.
        const authored = (Array.isArray(choiceFeedback) && choiceFeedback[selected]) || "";
        const useful = authored && !BOILERPLATE_FEEDBACK.has(authored.trim());
        const coach = useful ? authored : diagnosis?.student || authored || hint || scaffold || "";
        fbMsg = coach ? `Not quite. ${coach}` : "Not quite — take another look and try again.";
        // The misconception table is the one coaching source that ships with a
        // Spanish lane (`studentEs`), and only when the diagnosis is what we
        // actually showed — authored per-choice feedback outranks it above, and
        // pairing English feedback with an unrelated Spanish diagnosis would
        // tell the student two different things about their own mistake.
        // `studentExplanation` falls back to English when a misconception was
        // never translated, so compare before wrapping — otherwise the Spanish
        // lane reads "No exactamente." followed by the English sentence, which
        // is worse than showing no Spanish at all.
        // Authored per-choice feedback outranks the misconception table above, so
        // where a lesson authored Spanish for THAT choice it has to be used —
        // otherwise a Spanish-lane student reads the English sentence, which is
        // precisely the gap the misconception fallback was written to avoid.
        const authoredEs =
          (useful && Array.isArray(choiceFeedbackEs) && choiceFeedbackEs[selected]) || "";
        const coachEs = authoredEs
          ? authoredEs
          : !useful && diagnosis?.student
            ? studentExplanation(diagnosis.id, "es")
            : "";
        fbMsgEs = coach
          ? coachEs && coachEs !== coach
            ? `No exactamente. ${coachEs}`
            : undefined
          : "No exactamente — míralo otra vez e inténtalo de nuevo.";
        tryAgainBtn.style.display = "inline-flex";
      }
    }

    feedbackSlot.className = `problem-check-result visible ${isCorrect ? "is-correct" : "is-incorrect"}`;
    feedbackSlot.setAttribute("role", "alert");
    // The named diagnosis rides ABOVE the coaching sentence as a short chip. It
    // is a noun phrase ("Added the denominators") where the sentence is a next
    // step, so the two do not repeat each other, and a student who reads only
    // the chip still learns what their thinking was.
    const chip = diagnosis
      ? `<span class="mc-diagnosis"><span aria-hidden="true">💭</span> ${stackContent(
          `Looks like: ${diagnosis.label}`,
          misconceptionLabel(diagnosis.id, "es") === diagnosis.label
            ? undefined
            : `Parece que: ${misconceptionLabel(diagnosis.id, "es")}`,
        )}</span>`
      : "";
    feedbackSlot.innerHTML = `${chip}<span class="mc-feedback-line"><span class="feedback-icon">${isCorrect ? "✓" : "💡"}</span><span>${stackContent(fbMsg, fbMsgEs)}</span></span>`;

    // Second arg is additive: existing single-arg callers are unaffected, and
    // misconception-aware callers can see WHICH distractor was chosen.
    if (onAnswer) onAnswer(isCorrect, selected);
  });

  tryAgainBtn.addEventListener("click", () => {
    answered = false;
    selected = null;
    wrapper.classList.remove("success-glow", "shake-once");
    wrapper.querySelectorAll(".mc-celebrate-layer").forEach((layer) => layer.remove());
    optionsWrap.querySelectorAll(".mc-option-label").forEach((l) => {
      l.classList.remove("is-correct", "is-incorrect", "is-selected");
      const inp = /** @type {HTMLInputElement|null} */ (l.querySelector('input[type="radio"]'));
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

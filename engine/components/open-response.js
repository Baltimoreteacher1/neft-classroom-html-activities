const ORP_STYLE_ID = "orp-polish-styles";

/**
 * Inject the additive polish stylesheet once per document. All animation and
 * transition rules are scoped under `.orp-polish` and gated behind
 * `prefers-reduced-motion: reduce`, so they are purely cosmetic and never alter
 * layout, behavior, or accessibility for motion-sensitive users.
 */
function ensureOpenResponseStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(ORP_STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = ORP_STYLE_ID;
  style.textContent = `
    /* Animated progress bar below the textarea. */
    .orp-progress {
      height: 4px;
      border-radius: var(--radius-sm, 8px);
      background: var(--line, #d7e2ed);
      overflow: hidden;
      margin-top: var(--sp-1, 4px);
    }
    .orp-progress-fill {
      display: block;
      height: 100%;
      width: 0%;
      border-radius: inherit;
      background: var(--teal, #0f766e);
    }
    .orp-progress-fill.is-complete {
      background: var(--success, #0f7c4a);
    }

    /* Keyword hint chips that slide in. */
    .orp-keyword-hints {
      display: flex;
      flex-wrap: wrap;
      gap: var(--sp-2, 8px);
      margin-top: var(--sp-2, 8px);
    }
    .orp-keyword-chip {
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--navy, #12355b);
      background: var(--teal-light, #dff2ee);
      border: 1px solid var(--line, #d7e2ed);
      border-radius: var(--radius-sm, 8px);
      padding: 2px var(--sp-2, 8px);
    }
    .orp-keyword-chip.is-found {
      color: #fff;
      background: var(--success, #0f7c4a);
      border-color: var(--success, #0f7c4a);
    }

    @media (prefers-reduced-motion: no-preference) {
      .orp-counter {
        transition: color 0.35s ease;
      }
      .orp-progress-fill {
        transition: width 0.4s ease, background-color 0.4s ease;
      }
      .orp-keyword-chip {
        animation: orp-slide-in 0.4s ease both;
      }
      .orp-keyword-chip.is-found {
        transition: color 0.3s ease, background-color 0.3s ease,
          border-color 0.3s ease;
      }
      .orp-placeholder-fade::placeholder {
        opacity: 0.55;
        transition: opacity 0.35s ease;
      }
      .orp-placeholder-fade:focus::placeholder {
        opacity: 1;
      }
      .orp-confetti {
        position: absolute;
        top: 0;
        left: 0;
        width: 8px;
        height: 8px;
        border-radius: 2px;
        pointer-events: none;
        opacity: 0;
        will-change: transform, opacity;
        animation: orp-burst 0.9s ease-out forwards;
      }
    }

    @keyframes orp-slide-in {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes orp-burst {
      0%   { opacity: 1; transform: translate(0, 0) scale(1) rotate(0deg); }
      100% {
        opacity: 0;
        transform: translate(var(--orp-dx, 0), var(--orp-dy, -40px))
          scale(0.4) rotate(var(--orp-rot, 180deg));
      }
    }
  `;

  (document.head || document.documentElement).append(style);
}

/**
 * Fire a small, self-contained confetti burst from the center of an element.
 * No-ops when the user prefers reduced motion. Particles clean themselves up.
 */
function fireConfetti(anchorEl) {
  if (typeof window === "undefined" || !anchorEl) return;
  const reduce =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  const burst = document.createElement("div");
  burst.setAttribute("aria-hidden", "true");
  burst.style.cssText =
    "position:absolute; left:50%; top:0; width:0; height:0; pointer-events:none; z-index:1;";

  const colors = [
    "var(--teal, #0f766e)",
    "var(--success, #0f7c4a)",
    "var(--navy, #12355b)",
    "var(--teal-light, #dff2ee)",
  ];

  for (let i = 0; i < 18; i++) {
    const piece = document.createElement("span");
    piece.className = "orp-confetti";
    const angle = Math.random() * Math.PI * 2;
    const dist = 30 + Math.random() * 45;
    piece.style.setProperty("--orp-dx", `${Math.cos(angle) * dist}px`);
    piece.style.setProperty("--orp-dy", `${Math.sin(angle) * dist - 20}px`);
    piece.style.setProperty(
      "--orp-rot",
      `${Math.round(Math.random() * 360 - 180)}deg`,
    );
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = `${Math.random() * 0.12}s`;
    burst.append(piece);
  }

  anchorEl.append(burst);
  window.setTimeout(() => burst.remove(), 1200);
}

export function renderOpenResponse(
  container,
  { prompt, sentenceFrame, keywords, minLength, onSubmit },
) {
  ensureOpenResponseStyles();

  const wrapper = document.createElement("div");
  wrapper.className = "card card-teal";
  wrapper.style.position = wrapper.style.position || "relative";

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
  textarea.className = "text-input orp-placeholder-fade";
  textarea.rows = 3;
  textarea.placeholder = "Type your response here...";
  textarea.setAttribute("aria-label", prompt);
  wrapper.append(textarea);

  // Animated progress bar tracking length toward the minimum.
  const progress = document.createElement("div");
  progress.className = "orp-progress";
  progress.setAttribute("aria-hidden", "true");
  const progressFill = document.createElement("span");
  progressFill.className = "orp-progress-fill";
  progress.append(progressFill);
  wrapper.append(progress);

  const charCount = document.createElement("div");
  charCount.className = "orp-counter";
  charCount.style.cssText =
    "font-size:0.78rem; color:var(--muted); margin-top:var(--sp-1); text-align:right;";
  charCount.textContent = `0 / ${minLength || 20} characters minimum`;
  wrapper.append(charCount);

  // Keyword hint chips (slide in; highlight as they are used).
  let keywordChips = null;
  if (keywords && keywords.length > 0) {
    keywordChips = new Map();
    const hints = document.createElement("div");
    hints.className = "orp-keyword-hints";
    keywords.forEach((kw, i) => {
      const chip = document.createElement("span");
      chip.className = "orp-keyword-chip";
      chip.textContent = kw;
      chip.style.animationDelay = `${i * 0.06}s`;
      keywordChips.set(kw.toLowerCase(), chip);
      hints.append(chip);
    });
    wrapper.append(hints);
  }

  textarea.addEventListener("input", () => {
    const len = textarea.value.trim().length;
    const min = minLength || 20;
    charCount.textContent = `${len} / ${min} characters minimum`;
    charCount.style.color = len >= min ? "var(--success)" : "var(--muted)";

    const pct = Math.min(100, min > 0 ? (len / min) * 100 : 100);
    progressFill.style.width = `${pct}%`;
    progressFill.classList.toggle("is-complete", len >= min);

    if (keywordChips) {
      const lower = textarea.value.toLowerCase();
      keywordChips.forEach((chip, kw) => {
        chip.classList.toggle("is-found", lower.includes(kw));
      });
    }
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
    fireConfetti(wrapper);
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

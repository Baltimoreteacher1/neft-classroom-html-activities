import { createRemediation } from "../core/remediation.js";
import { renderMultipleChoice } from "./multiple-choice.js";

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

function reducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// Inject-once scoped polish styles. All animation/transition rules below are
// disabled inside a `prefers-reduced-motion: reduce` block, so motion-sensitive
// students get a static, fully-functional experience. Uses only existing design
// tokens (--teal, --navy, --success, --line, --radius-md, --ease-spring, etc.).
const REMEDIATION_STYLE_ID = "remediation-panel-polish";
function injectStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(REMEDIATION_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = REMEDIATION_STYLE_ID;
  style.textContent = `
.remediation .remediation-step{
  position:relative;
}
/* Pulse highlight on step-card mount */
.remediation .remediation-step.rp-pulse{
  animation:rpPulse 0.9s var(--ease-spring) 1;
}
@keyframes rpPulse{
  0%{ box-shadow:0 0 0 0 rgba(20,184,166,0.45); }
  60%{ box-shadow:0 0 0 8px rgba(20,184,166,0); }
  100%{ box-shadow:0 0 0 0 rgba(20,184,166,0); }
}
/* Micro-animation for staggered reveals (guided steps, list rows) */
.remediation .rp-reveal{
  animation:rpReveal 0.32s var(--ease-spring) both;
}
@keyframes rpReveal{
  from{ opacity:0; transform:translateY(8px); }
  to{ opacity:1; transform:translateY(0); }
}
/* Stronger button tap feedback: scale + shadow */
.remediation .btn{
  transition:transform var(--duration-fast,150ms) var(--ease-spring),
             box-shadow var(--duration-fast,150ms) var(--ease-spring);
}
.remediation .btn:hover{
  box-shadow:0 4px 12px rgba(15,23,42,0.14);
}
.remediation .btn:active,
.remediation .btn.rp-tap{
  transform:scale(0.95);
  box-shadow:0 1px 4px rgba(15,23,42,0.12);
}
/* Success particle burst on remediation completion */
.remediation .rp-burst{
  position:absolute;
  top:0; left:0;
  width:100%; height:100%;
  pointer-events:none;
  overflow:visible;
  z-index:5;
}
.remediation .rp-particle{
  position:absolute;
  top:50%; left:50%;
  width:9px; height:9px;
  border-radius:2px;
  opacity:0;
  will-change:transform,opacity;
  animation:rpBurst 0.85s var(--ease-spring) forwards;
}
@keyframes rpBurst{
  0%{ opacity:1; transform:translate(-50%,-50%) scale(0.4) rotate(0deg); }
  70%{ opacity:1; }
  100%{
    opacity:0;
    transform:translate(calc(-50% + var(--rp-dx,0px)),
                        calc(-50% + var(--rp-dy,0px)))
              scale(1) rotate(var(--rp-rot,180deg));
  }
}
@media (prefers-reduced-motion: reduce){
  .remediation .remediation-step.rp-pulse{ animation:none; }
  .remediation .rp-reveal{ animation:none; }
  .remediation .btn{ transition:none; }
  .remediation .btn:active,
  .remediation .btn.rp-tap{ transform:none; box-shadow:none; }
  .remediation .rp-burst{ display:none; }
  .remediation .rp-particle{ animation:none; display:none; }
}
`;
  (document.head || document.documentElement).append(style);
}

// Pulse highlight when a step card mounts (no-op under reduced motion).
function pulseMount(card) {
  if (!card || reducedMotion()) return;
  card.classList.add("rp-pulse");
  card.addEventListener("animationend", () => card.classList.remove("rp-pulse"), { once: true });
}

// Stagger a small reveal animation on an element (skipped under reduced motion).
function revealAnim(el, index = 0) {
  if (!el || reducedMotion()) return;
  el.classList.add("rp-reveal");
  el.style.animationDelay = `${Math.min(index, 6) * 60}ms`;
  el.addEventListener(
    "animationend",
    () => {
      el.classList.remove("rp-reveal");
      el.style.animationDelay = "";
    },
    { once: true },
  );
}

// Brief scale+shadow tap feedback for keyboard/programmatic activation.
function tapFeedback(btn) {
  if (!btn || reducedMotion()) return;
  btn.classList.add("rp-tap");
  setTimeout(() => btn.classList.remove("rp-tap"), 130);
}

// Celebratory particle burst on successful recovery (skipped under reduced motion).
function successBurst(root) {
  if (!root || reducedMotion() || typeof document === "undefined") return;
  const burst = document.createElement("div");
  burst.className = "rp-burst";
  burst.setAttribute("aria-hidden", "true");
  const colors = ["var(--teal)", "var(--success)", "var(--navy)", "var(--coral)"];
  const count = 14;
  for (let i = 0; i < count; i++) {
    const p = document.createElement("span");
    p.className = "rp-particle";
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const dist = 60 + Math.random() * 50;
    p.style.background = colors[i % colors.length];
    p.style.setProperty("--rp-dx", `${Math.cos(angle) * dist}px`);
    p.style.setProperty("--rp-dy", `${Math.sin(angle) * dist}px`);
    p.style.setProperty("--rp-rot", `${(Math.random() * 360) | 0}deg`);
    p.style.animationDelay = `${Math.random() * 80}ms`;
    burst.append(p);
  }
  root.append(burst);
  setTimeout(() => burst.remove(), 1100);
}

function makeLive(container) {
  const live = document.createElement("div");
  live.className = "remediation-live";
  live.setAttribute("aria-live", "polite");
  live.setAttribute("aria-atomic", "true");
  live.style.cssText =
    "position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; border:0;";
  container.append(live);
  return (msg) => {
    live.textContent = "";
    setTimeout(() => {
      live.textContent = msg;
    }, 30);
  };
}

function stepCard(title, icon) {
  const card = document.createElement("div");
  card.className = "card card-coral remediation-step";
  card.setAttribute("role", "group");
  card.setAttribute("tabindex", "-1");
  if (!reducedMotion()) card.style.animation = "feedbackIn 0.3s var(--ease-spring)";
  const h = document.createElement("h4");
  h.style.cssText =
    "color:var(--coral); margin:0 0 var(--sp-3); display:flex; align-items:center; gap:var(--sp-2);";
  h.innerHTML = `<span aria-hidden="true">${icon}</span><span>${esc(title)}</span>`;
  card.append(h);
  return { card, body: card };
}

function continueButton(label, onClick) {
  const btn = document.createElement("button");
  btn.className = "btn btn-primary mt-4";
  btn.textContent = label;
  btn.addEventListener("click", (e) => {
    tapFeedback(btn);
    onClick?.(e);
  });
  return btn;
}

/**
 * Mounts the scaffolded remediation flow for a single missed practice question.
 * Calls onComplete({ recovered }) when the student exits the loop.
 */
export function renderRemediation(
  container,
  { question, state, level, misconception, lang, onComplete },
) {
  injectStyles();
  const controller = createRemediation({ question, state, level, misconception, lang });
  const root = document.createElement("div");
  root.className = "remediation";
  root.style.position = "relative";
  container.append(root);
  const announce = makeLive(root);

  // Kick off: the wrong answer is the first signal.
  drive({ correct: false });

  function clearSteps() {
    root.querySelectorAll(".remediation-step").forEach((n) => n.remove());
  }

  function focusStep(card) {
    pulseMount(card);
    card.focus?.();
  }

  function drive(result) {
    const { kind, payload } = controller.nextStep(result);
    switch (kind) {
      case "diagnosis":
        return showDiagnosis(payload);
      case "hint":
        return showHint(payload);
      case "worked-example":
        return showWorked(payload);
      case "guided":
        return showGuided(payload);
      case "retry-easier":
        return showEasier(payload);
      case "done":
      default:
        return finish(payload);
    }
  }

  function finish(payload) {
    clearSteps();
    const recovered = payload?.recovered !== false && payload?.reason !== "exhausted";
    if (recovered) successBurst(root);
    announce(
      recovered
        ? "Nice work — you got it. Moving on."
        : "Good effort. Let's keep going — you can revisit this later.",
    );
    onComplete?.({ recovered, reason: payload?.reason });
  }

  // The diagnosed opening rung. It replaces "Hint — try again" when the engine
  // named the specific error, and it deliberately looks different from a hint:
  // a hint is a nudge toward the problem, this is a statement about the
  // student's own reasoning, so it leads with the named error and then the
  // authored student-voice explanation. Neither states the answer — the retry
  // below is still a real retry.
  function showDiagnosis(payload) {
    clearSteps();
    const { card, body } = stepCard("Let's look at your thinking", "🔍");

    if (payload.label) {
      const tag = document.createElement("p");
      tag.className = "remediation-diagnosis-label";
      tag.style.cssText =
        "margin:0 0 var(--sp-2); font-weight:700; color:var(--navy); font-size:var(--fs-sm);";
      tag.textContent = payload.label;
      body.append(tag);
    }

    const p = document.createElement("p");
    p.style.cssText = "margin:0 0 var(--sp-3); line-height:1.55;";
    p.textContent = payload.text;
    body.append(p);

    const retry = continueButton("I see it — try again", () => {
      mountRetry(card, question, (ok) => drive({ correct: ok }));
    });
    body.append(retry);
    root.append(card);
    announce(`${payload.label ? payload.label + ". " : ""}${payload.text}`);
    focusStep(card);
  }

  function showHint(payload) {
    clearSteps();
    const { card, body } = stepCard("Hint — try again", "💡");
    const p = document.createElement("p");
    p.style.cssText = "margin:0 0 var(--sp-3); line-height:1.55;";
    p.textContent = payload.text;
    body.append(p);

    const retry = continueButton("Try the problem again", () => {
      // Re-render the original question for a retry.
      mountRetry(card, question, (ok) => drive({ correct: ok }));
    });
    body.append(retry);
    root.append(card);
    announce(`Hint. ${payload.text}`);
    focusStep(card);
  }

  function showWorked(payload) {
    clearSteps();
    const { card, body } = stepCard("Worked example", "📝");
    const intro = document.createElement("p");
    intro.style.cssText = "margin:0 0 var(--sp-3); color:var(--muted);";
    intro.textContent = "Here is how a similar problem is solved, step by step.";
    body.append(intro);

    const list = document.createElement("ol");
    list.style.cssText =
      "margin:0 0 var(--sp-3); padding-left:var(--sp-5); display:flex; flex-direction:column; gap:var(--sp-2);";
    (payload.steps || []).forEach((s, i) => {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${esc(s.label)}</strong><div style="font-family:var(--font-mono); margin-top:2px;">${esc(s.work)}</div>`;
      list.append(li);
      revealAnim(li, i);
    });
    body.append(list);

    if (payload.conclusion) {
      const c = document.createElement("p");
      c.style.cssText =
        "margin:0 0 var(--sp-3); padding:var(--sp-3); background:var(--success-bg); border-radius:var(--radius-sm);";
      c.textContent = payload.conclusion;
      body.append(c);
    }

    body.append(continueButton("I see — let's try it guided", () => drive({ correct: false })));
    root.append(card);
    announce("Worked example shown. Review the steps, then continue.");
    focusStep(card);
  }

  function showGuided(payload) {
    clearSteps();
    const { card, body } = stepCard(payload.title || "Guided steps", "🪜");
    const intro = document.createElement("p");
    intro.style.cssText = "margin:0 0 var(--sp-3); color:var(--muted);";
    intro.textContent =
      "Now your turn on the same problem. Answer each step in your own words first — then check it against the model.";
    body.append(intro);

    const prompts = payload.prompts || [];
    let revealed = 0;
    const stepsWrap = document.createElement("div");
    stepsWrap.style.cssText = "display:flex; flex-direction:column; gap:var(--sp-2);";
    body.append(stepsWrap);

    const nextBtn = continueButton("Continue", () => {});

    function renderGuidedStep() {
      if (revealed >= prompts.length) {
        nextBtn.textContent = "I've got it — continue";
        nextBtn.onclick = null;
        nextBtn.addEventListener("click", () => drive({ correct: false }), {
          once: true,
        });
        body.append(nextBtn);
        announce("All guided steps done. Continue when ready.");
        return;
      }
      const sp = prompts[revealed];
      const row = document.createElement("div");
      row.className = "card-compact";
      row.style.cssText =
        "background:var(--cream); border-radius:var(--radius-sm); padding:var(--sp-3);";
      const q = document.createElement("p");
      q.style.cssText = "margin:0 0 var(--sp-2); font-weight:600;";
      q.textContent = sp.prompt;
      row.append(q);

      // The student writes the step BEFORE the model appears. This used to be a
      // bare "Reveal this step" button, which made the guided rung the only part
      // of the ladder that asked nothing of the student — they clicked four
      // times and read four sentences, and that reading was counted as having
      // worked through it.
      //
      // The model answers here are prose derived from the item's explanation, so
      // they cannot be honestly auto-graded. Rather than fake a check, this uses
      // the site's attempt-gated self-check pattern: the model appears only
      // after a real attempt, next to what the student actually wrote, and the
      // student judges the match themselves. That judgement is not scored — the
      // point is that the sentence exists in their words before they see it.
      const input = document.createElement("textarea");
      input.className = "remediation-guided-input";
      input.rows = 2;
      input.setAttribute("aria-label", sp.prompt);
      input.placeholder = "Write what happens in this step…";
      input.style.cssText =
        "width:100%; box-sizing:border-box; padding:var(--sp-2); border:1px solid var(--line); border-radius:var(--radius-sm); font:inherit; line-height:1.5; resize:vertical;";
      row.append(input);

      const checkBtn = document.createElement("button");
      checkBtn.className = "btn btn-secondary";
      checkBtn.style.marginTop = "var(--sp-2)";
      checkBtn.type = "button";
      checkBtn.textContent = "Check my thinking";
      checkBtn.disabled = true;
      input.addEventListener("input", () => {
        checkBtn.disabled = input.value.trim().length === 0;
      });

      checkBtn.addEventListener("click", () => {
        tapFeedback(checkBtn);
        const written = input.value.trim();
        if (!written) return;
        input.readOnly = true;
        checkBtn.remove();

        const ans = document.createElement("div");
        ans.setAttribute("role", "status");
        ans.style.cssText =
          "margin-top:var(--sp-2); padding:var(--sp-2); background:var(--success-bg); border-radius:var(--radius-sm);";
        ans.innerHTML = `<strong>${esc(sp.label)}:</strong> <span style="font-family:var(--font-mono);">${esc(sp.answer)}</span>`;
        row.append(ans);
        revealAnim(ans);
        announce(`Model answer. ${sp.label}: ${sp.answer}`);

        // Self-rating, deliberately unscored. It is here so the student has to
        // decide whether their sentence matched — a comparison they will skip
        // if the next control just says "Continue".
        const rate = document.createElement("div");
        rate.style.cssText = "display:flex; gap:var(--sp-2); margin-top:var(--sp-3);";
        [
          ["That matches mine", "matched"],
          ["Mine was different", "differed"],
        ].forEach(([label, verdict]) => {
          const b = document.createElement("button");
          b.type = "button";
          b.className = "btn btn-secondary";
          b.textContent = label;
          b.addEventListener("click", () => {
            tapFeedback(b);
            rate.remove();
            announce(
              verdict === "matched"
                ? "Marked as matching. Next step."
                : "Marked as different. Next step — read the model again as you go.",
            );
            revealed++;
            renderGuidedStep();
          });
          rate.append(b);
        });
        row.append(rate);
        revealAnim(rate);
      });
      row.append(checkBtn);
      stepsWrap.append(row);
      revealAnim(row, revealed);
      input.focus?.();
    }

    renderGuidedStep();
    root.append(card);
    announce("Guided steps. Write each step in your own words, then check it.");
    focusStep(card);
  }

  function showEasier(payload) {
    clearSteps();
    const { card, body } = stepCard("Confidence builder", "🌱");
    const intro = document.createElement("p");
    intro.style.cssText = "margin:0 0 var(--sp-3); color:var(--muted);";
    intro.textContent =
      "Here is a simpler one to rebuild your confidence. Get this and you're back on track.";
    body.append(intro);

    const q = payload.question || {};
    if (q.type === "multiple-choice") {
      const slot = document.createElement("div");
      body.append(slot);
      renderMultipleChoice(slot, {
        stem: q.stem,
        choices: q.choices,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        onAnswer: (ok) => {
          announce(ok ? "Correct. Back on track." : "Not yet — review the steps above.");
          setTimeout(() => drive({ correct: ok }), 1200);
        },
      });
    } else {
      const p = document.createElement("p");
      p.style.cssText = "margin:0 0 var(--sp-3); line-height:1.55;";
      p.textContent = q.prompt || "When you're ready, continue.";
      body.append(p);
      body.append(continueButton("I understand — continue", () => drive({ correct: true })));
    }
    root.append(card);
    announce("Confidence builder question.");
    focusStep(card);
  }

  return { controller, el: root };
}

// Re-render the original question inside a retry slot, isolating its DOM.
function mountRetry(card, question, onAnswer) {
  let slot = card.querySelector(".remediation-retry-slot");
  if (slot) slot.remove();
  slot = document.createElement("div");
  slot.className = "remediation-retry-slot mt-4";
  card.append(slot);
  card.querySelectorAll(".btn-primary").forEach((b) => {
    b.disabled = true;
    b.style.display = "none";
  });

  if (
    question.type === "multiple-choice" &&
    Array.isArray(question.choices) &&
    typeof question.correctIndex === "number"
  ) {
    renderMultipleChoice(slot, {
      stem: question.stem,
      choices: question.choices,
      correctIndex: question.correctIndex,
      explanation: question.explanation,
      onAnswer: (ok) => setTimeout(() => onAnswer(ok), 1000),
    });
  } else {
    // Non-MC types: offer a self-check retry (got it / still stuck).
    const wrap = document.createElement("div");
    wrap.style.cssText = "display:flex; gap:var(--sp-2); flex-wrap:wrap;";
    const got = document.createElement("button");
    got.className = "btn btn-primary";
    got.textContent = "I solved it this time";
    got.addEventListener("click", () => onAnswer(true));
    const stuck = document.createElement("button");
    stuck.className = "btn btn-secondary";
    stuck.textContent = "Still stuck — show me more";
    stuck.addEventListener("click", () => onAnswer(false));
    wrap.append(got, stuck);
    slot.append(wrap);
  }
}

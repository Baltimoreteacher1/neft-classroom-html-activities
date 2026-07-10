// ── The Writing Revolution (TWR) — interactive lesson step ───────────────────
// Renders typed-input writing boxes for the TWR Core set, driven entirely by
// the lesson's config (via deriveTWR). Mirrors the patterns used by
// open-response.js: a card, sentence frames, a textarea, and a submit button
// that gives low-friction formative feedback (it never blocks the lesson).
//
// Responses are persisted through the optional `saveResponse`/`getResponse`
// callbacks so a student's writing survives navigation, exactly like the
// reflect / connect phases.

import { deriveTWR } from "../core/twr.js";

const TWR_STYLE_ID = "twr-polish-styles";

/**
 * Inject the additive polish stylesheet once per document. Every animation and
 * transition rule is scoped under a `.twr-*` class and gated behind
 * `prefers-reduced-motion: no-preference`, so the polish is purely cosmetic and
 * never alters layout, behavior, data, or accessibility for motion-sensitive
 * users. Mirrors the pattern in open-response.js.
 */
function ensureTwrStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(TWR_STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = TWR_STYLE_ID;
  style.textContent = `
    /* Highlight frame drawn around the card on a successful save. */
    .twr-card.is-celebrating {
      box-shadow: 0 0 0 3px var(--success, #0f7c4a);
    }

    /* Per-textarea character-count badge. */
    .twr-counter {
      display: block;
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--muted, #5b6b7b);
      text-align: right;
      margin: -2px 0 var(--sp-3, 12px);
    }

    /* Focus-visible affordance for the writing boxes. */
    .twr-textarea:focus-visible {
      outline: 2px solid var(--teal, #0f766e);
      outline-offset: 2px;
      box-shadow: 0 2px 10px rgba(15, 118, 110, 0.18);
    }

    .twr-check-row {
      display: flex;
      align-items: flex-start;
      gap: var(--sp-2, 8px);
      min-height: 44px;
      padding: var(--sp-2, 8px);
      border-radius: var(--radius-sm, 8px);
      cursor: pointer;
    }

    .twr-check-row:focus-within {
      outline: 2px solid var(--teal, #0f766e);
      outline-offset: 2px;
    }

    .twr-check-row input {
      width: 20px;
      height: 20px;
      flex: 0 0 auto;
      margin-top: 2px;
    }

    .twr-levels {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
      gap: var(--sp-3, 12px);
    }

    .twr-level {
      min-width: 0;
      padding: var(--sp-3, 12px);
      border: 1px solid var(--line, #cbd5e1);
      border-radius: var(--radius-sm, 8px);
    }

    @media (prefers-reduced-motion: no-preference) {
      .twr-card {
        animation: twr-fade-in 0.45s ease both;
      }
      .twr-card.is-celebrating {
        animation: twr-highlight 0.9s ease;
      }
      .twr-textarea {
        transition: box-shadow 0.25s ease, border-color 0.25s ease;
      }
      .twr-counter {
        transition: color 0.3s ease;
      }
      .twr-feedback {
        animation: twr-feedback-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
      }
      .twr-confetti {
        position: absolute;
        top: 0;
        left: 0;
        width: 8px;
        height: 8px;
        border-radius: 2px;
        pointer-events: none;
        opacity: 0;
        will-change: transform, opacity;
        animation: twr-burst 0.9s ease-out forwards;
      }
    }

    @keyframes twr-fade-in {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes twr-feedback-in {
      from { opacity: 0; transform: translateY(8px) scale(0.96); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes twr-highlight {
      0%   { box-shadow: 0 0 0 0 rgba(15, 124, 74, 0); }
      35%  { box-shadow: 0 0 0 4px rgba(15, 124, 74, 0.55); }
      100% { box-shadow: 0 0 0 3px var(--success, #0f7c4a); }
    }
    @keyframes twr-burst {
      0%   { opacity: 1; transform: translate(0, 0) scale(1) rotate(0deg); }
      100% {
        opacity: 0;
        transform: translate(var(--twr-dx, 0), var(--twr-dy, -40px))
          scale(0.4) rotate(var(--twr-rot, 180deg));
      }
    }
  `;

  (document.head || document.documentElement).append(style);
}

/**
 * Fire a small, self-contained confetti burst from the top-center of an element.
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
    piece.className = "twr-confetti";
    const angle = Math.random() * Math.PI * 2;
    const dist = 30 + Math.random() * 45;
    piece.style.setProperty("--twr-dx", `${Math.cos(angle) * dist}px`);
    piece.style.setProperty("--twr-dy", `${Math.sin(angle) * dist - 20}px`);
    piece.style.setProperty("--twr-rot", `${Math.round(Math.random() * 360 - 180)}deg`);
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = `${Math.random() * 0.12}s`;
    burst.append(piece);
  }

  anchorEl.append(burst);
  window.setTimeout(() => burst.remove(), 1200);
}

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

// One labelled writing row: a frame line (bilingual) + a textarea that auto-saves.
function writeRow(parent, { key, frameEn, frameEs, rows = 2, getResponse, saveResponse }) {
  if (frameEn) {
    const frame = document.createElement("p");
    frame.className = "sentence-frame";
    frame.style.cssText = "margin:0 0 var(--sp-1); font-weight:600;";
    frame.innerHTML = esc(frameEn).replace(/___/g, '<span class="blank">&nbsp;</span>');
    if (frameEs) {
      const es = document.createElement("span");
      es.style.cssText = "display:block; color:var(--muted); font-style:italic; font-weight:600;";
      es.textContent = frameEs;
      frame.append(es);
    }
    parent.append(frame);
  }

  const ta = document.createElement("textarea");
  ta.className = "text-input twr-textarea";
  ta.rows = rows;
  ta.placeholder = "Write your sentence...";
  ta.setAttribute("aria-label", frameEn || key);
  // Margin now lives on the counter badge below (kept consistent via --sp-3).
  ta.style.cssText = "margin-bottom:var(--sp-1);";
  if (getResponse) ta.value = getResponse(key) || "";
  parent.append(ta);

  // Additive character-count badge under each box (cosmetic; aria-hidden).
  const counter = document.createElement("span");
  counter.className = "twr-counter";
  counter.setAttribute("aria-hidden", "true");
  const updateCounter = () => {
    const n = ta.value.trim().length;
    counter.textContent = n === 1 ? "1 character" : `${n} characters`;
    counter.style.color = n > 0 ? "var(--teal)" : "var(--muted)";
  };
  updateCounter();
  ta.addEventListener("input", () => {
    if (saveResponse) saveResponse(key, ta.value);
    updateCounter();
  });
  parent.append(counter);
  return ta;
}

function subhead(text, tag) {
  const h = document.createElement("h4");
  h.style.cssText = "margin:var(--sp-4) 0 var(--sp-2); color:var(--navy);";
  h.innerHTML = `${esc(text)}${
    tag ? ` <span class="badge badge-amber" style="vertical-align:middle;">${esc(tag)}</span>` : ""
  }`;
  return h;
}

export function renderTwrWriting(container, config, { getResponse, saveResponse, onSubmit } = {}) {
  ensureTwrStyles();

  const twr = deriveTWR(config);
  const inputs = [];

  const card = document.createElement("section");
  card.className = "card card-amber twr-card";
  // Anchor for the success highlight frame + confetti burst.
  card.style.position = card.style.position || "relative";
  card.setAttribute("aria-labelledby", "twr-title");

  const head = document.createElement("div");
  head.style.cssText =
    "display:flex; align-items:center; gap:var(--sp-2); margin-bottom:var(--sp-2);";
  head.innerHTML = `
    <span style="font-size:1.6rem;" aria-hidden="true">✍️</span>
    <h3 id="twr-title" style="margin:0; color:var(--navy);">Write About the Math</h3>
    <span class="badge badge-teal" style="margin-left:auto;">The Writing Revolution</span>`;
  card.append(head);

  const lead = document.createElement("p");
  lead.style.cssText = "margin:0 0 var(--sp-3); color:var(--muted);";
  lead.textContent =
    twr.languageObjective || "Build strong math sentences. Write each one, then read it out loud.";
  card.append(lead);

  // 1. Understand the question
  card.append(subhead("1. Understand the Question", twr.focus.action));
  const question = document.createElement("div");
  question.style.cssText =
    "background:var(--teal-light); border-left:4px solid var(--teal); border-radius:var(--radius-sm); padding:var(--sp-3); margin-bottom:var(--sp-2);";
  question.innerHTML = `<p style="margin:0 0 var(--sp-1); font-weight:800;">${esc(twr.focus.questionEn)}</p>${
    twr.focus.questionEs
      ? `<p lang="es" style="margin:0; color:var(--muted); font-style:italic;">${esc(twr.focus.questionEs)}</p>`
      : ""
  }`;
  card.append(question);
  const job = document.createElement("p");
  job.innerHTML = `<strong>Your job:</strong> ${esc(twr.focus.jobEn)}<span lang="es" style="display:block; color:var(--muted); font-style:italic;">${esc(twr.focus.jobEs)}</span>`;
  card.append(job);

  // 2. Plan vocabulary and rehearse orally
  card.append(subhead("2. Plan Your Math Words", "choose at least 2"));
  const vocabulary = document.createElement("fieldset");
  vocabulary.style.cssText = "border:0; padding:0; margin:0 0 var(--sp-3);";
  const vocabularyLegend = document.createElement("legend");
  vocabularyLegend.className = "sr-only";
  vocabularyLegend.textContent = "Choose the math words you plan to use";
  vocabulary.append(vocabularyLegend);
  for (const word of twr.vocabulary) {
    const row = document.createElement("label");
    row.className = "twr-check-row";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = word.term;
    const text = document.createElement("span");
    text.innerHTML = `<strong>${esc(word.term)}</strong> — ${esc(word.definition)}${
      word.termEs || word.definitionEs
        ? `<span lang="es" style="display:block; color:var(--muted); font-style:italic;"><strong>${esc(word.termEs)}</strong>${word.definitionEs ? ` — ${esc(word.definitionEs)}` : ""}</span>`
        : ""
    }`;
    row.append(checkbox, text);
    vocabulary.append(row);
  }
  card.append(vocabulary);

  const rehearsal = document.createElement("div");
  rehearsal.style.cssText =
    "border:1px dashed var(--teal); border-radius:var(--radius-sm); padding:var(--sp-3); margin-bottom:var(--sp-3);";
  rehearsal.innerHTML = `<strong>Say it first:</strong> ${esc(twr.rehearsal.directionEn)}<span lang="es" style="display:block; color:var(--muted); font-style:italic;">${esc(twr.rehearsal.directionEs)}</span><p style="margin:var(--sp-2) 0 0; font-weight:700;">${esc(twr.rehearsal.frameEn)}${
    twr.rehearsal.frameEs
      ? `<span lang="es" style="display:block; color:var(--muted); font-style:italic;">${esc(twr.rehearsal.frameEs)}</span>`
      : ""
  }</p>`;
  card.append(rehearsal);

  // 3. Build one explanation using the support level the student needs.
  card.append(subhead("3. Build Your Explanation", "choose your support"));
  const model = document.createElement("aside");
  model.style.cssText =
    "background:var(--surface-2, #f8fafc); border-radius:var(--radius-sm); padding:var(--sp-3); margin-bottom:var(--sp-3);";
  model.innerHTML = `<strong>Model the parts:</strong><p style="margin:var(--sp-1) 0; color:var(--muted);">${esc(twr.model.note)}</p><ul style="margin:0; padding-left:1.2rem;"><li><strong>Claim:</strong> ${esc(twr.model.claim)}</li><li><strong>Evidence:</strong> ${esc(twr.model.evidence)}</li><li><strong>Reasoning:</strong> ${esc(twr.model.reasoning)}</li></ul>`;
  card.append(model);

  const levels = document.createElement("div");
  levels.className = "twr-levels";
  for (const level of twr.levels) {
    const panel = document.createElement("section");
    panel.className = "twr-level";
    panel.dataset.supportLevel = level.id;
    const title = document.createElement("h5");
    title.style.cssText = "margin:0 0 var(--sp-1); color:var(--navy);";
    title.textContent = `${level.label} — ${level.support}`;
    const direction = document.createElement("p");
    direction.style.cssText = "margin:0 0 var(--sp-2);";
    direction.innerHTML = `${esc(level.directionEn)}<span lang="es" style="display:block; color:var(--muted); font-style:italic;">${esc(level.directionEs)}</span>`;
    const frames = document.createElement("ul");
    frames.style.cssText = "margin:0 0 var(--sp-2); padding-left:1.1rem;";
    for (const frame of level.frames) {
      const item = document.createElement("li");
      item.innerHTML = `<strong>${esc(frame.en)}</strong>${
        frame.es
          ? `<span lang="es" style="display:block; color:var(--muted); font-style:italic;">${esc(frame.es)}</span>`
          : ""
      }`;
      frames.append(item);
    }
    panel.append(title, direction, frames);
    inputs.push(
      writeRow(panel, {
        key: `twr_${level.id}`,
        frameEn: "",
        rows: level.id === "explain" ? 5 : 3,
        getResponse,
        saveResponse,
      }),
    );
    levels.append(panel);
  }
  card.append(levels);

  // 4. Check the explanation against the same criteria the teacher uses.
  card.append(subhead("4. Check Your Explanation", "5 quick checks"));
  const checklist = document.createElement("fieldset");
  checklist.style.cssText = "border:0; padding:0; margin:0;";
  const checklistLegend = document.createElement("legend");
  checklistLegend.className = "sr-only";
  checklistLegend.textContent = "Check your explanation";
  checklist.append(checklistLegend);
  for (const criterion of twr.checklist) {
    const row = document.createElement("label");
    row.className = "twr-check-row";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    const text = document.createElement("span");
    text.innerHTML = `${esc(criterion.en)}<span lang="es" style="display:block; color:var(--muted); font-style:italic;">${esc(criterion.es)}</span>`;
    row.append(checkbox, text);
    checklist.append(row);
  }
  card.append(checklist);

  // Submit / feedback (formative, never blocks the lesson)
  const feedbackSlot = document.createElement("div");
  feedbackSlot.className = "mt-4";
  card.append(feedbackSlot);

  const submitBtn = document.createElement("button");
  submitBtn.className = "btn btn-primary mt-4";
  submitBtn.textContent = "Save My Writing";
  submitBtn.addEventListener("click", () => {
    const written = inputs.filter((ta) => ta.value.trim().length > 0).length;
    const fb = document.createElement("div");
    if (written === 0) {
      fb.className = "feedback feedback-hint visible twr-feedback";
      fb.setAttribute("role", "alert");
      fb.innerHTML =
        '<span class="feedback-icon">💡</span><span>Write at least one sentence to get started — use a frame above.</span>';
    } else {
      fb.className = "feedback feedback-success visible twr-feedback";
      fb.setAttribute("role", "status");
      fb.innerHTML = `<span class="feedback-icon">✓</span><span>Your writing is saved. You used ${written} of ${inputs.length} support paths. Finish the checklist before you submit.</span>`;
      // Success polish: highlight frame + confetti (both reduced-motion safe).
      card.classList.add("is-celebrating");
      fireConfetti(card);
      if (onSubmit) onSubmit(written, inputs.length);
    }
    feedbackSlot.innerHTML = "";
    feedbackSlot.append(fb);
  });
  card.append(submitBtn);

  container.append(card);

  return {
    getValues: () => inputs.map((ta) => ta.value.trim()),
    countWritten: () => inputs.filter((ta) => ta.value.trim().length > 0).length,
  };
}

export default renderTwrWriting;

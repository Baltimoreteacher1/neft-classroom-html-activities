// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
// ── Discussion Moments — clickable discourse pop-ups ─────────────────────────
// A quiet, opt-in "💬 Discuss & question a partner" trigger that opens ONE
// accessible modal with a rigorous discourse question, a reciprocal
// partner-questioning protocol, and tiered supports (Level 1 support / Level 2
// stretch) tucked behind disclosures so the default view stays calm.
//
// Contract: purely formative. Never affects scoring, XP, stars, badges, or phase
// completion. Confirmation persists via the shared `state` API (Save/Resume).
//
// Placed only where the lesson has NO existing discussion moment (Practice and a
// pre-Exit-Ticket capstone) so it complements — never duplicates — the inline
// Turn & Talk in launch/explore/connect.

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

// Reciprocal "question each other" moves. Partner B picks one to press Partner A.
const PROBE_QUESTIONS = [
  { en: "How do you know?", es: "¿Cómo lo sabes?" },
  { en: "Why does that work?", es: "¿Por qué funciona eso?" },
  { en: "Can you show me another way?", es: "¿Puedes mostrarme otra forma?" },
  { en: "What if the numbers changed?", es: "¿Y si cambiaran los números?" },
  { en: "Where could someone go wrong?", es: "¿Dónde podría equivocarse alguien?" },
];

// Bilingual sentence starters (mirrors the engine Turn & Talk defaults).
const DEFAULT_STEMS = [
  { en: "I think ___ because ___.", es: "Pienso que ___ porque ___." },
  { en: "My strategy was ___.", es: "Mi estrategia fue ___." },
  { en: "I agree / disagree because ___.", es: "Estoy de acuerdo / en desacuerdo porque ___." },
];

// Stretch stems for Level 2.
const STRETCH_STEMS = [
  "A different strategy would be ___, and it works because ___.",
  "This is always true because ___.",
  "I can convince you by ___.",
];

// Stable, non-random reasoning prompts (chosen by deterministic hash per lesson).
const REASONING_PROMPTS = [
  "Why does this method work — what makes it true every time?",
  "How could you convince a partner that your answer is right?",
  "What is one mistake someone could make here, and how would you catch it?",
  "What stays the same, and what changes, if the numbers were different?",
];

// Variant-specific defaults. `practice` compares strategies mid-lesson; `capstone`
// presses for a convincing argument before the exit ticket.
const VARIANT_DEFAULTS = {
  practice: {
    label: "Discuss & question a partner",
    title: "Compare strategies",
    question:
      "Compare your method with a partner's — did you solve it the same way or a different way?",
  },
  capstone: {
    label: "Talk it out before you finish",
    title: "Convince a partner",
    question: "Before the exit ticket: pick one answer and convince a partner it is right.",
  },
};

function hashKey(key) {
  let h = 0;
  const s = String(key || "lesson");
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// Resolve the discourse question. Preference: authored config.turnAndTalk[phase]
// → a keyword prompt using the lesson's own vocabulary → variant default →
// a stable per-lesson reasoning prompt. No authoring required.
function resolveQuestion(phase, config, variant) {
  const authored = Array.isArray(config?.turnAndTalk)
    ? config.turnAndTalk.find((t) => t && t.phase === phase && t.question)
    : null;
  if (authored?.question) return String(authored.question).trim();

  const kws = (Array.isArray(config?.keywords) ? config.keywords : [])
    .map((k) => String(k || "").trim())
    .filter((k) => /[a-zA-Z]/.test(k))
    .slice(0, 3);
  if (variant === "practice" && kws.length >= 2) {
    return `Explain to your partner HOW you solved it, using the words: ${kws.join(", ")}.`;
  }
  if (VARIANT_DEFAULTS[variant]?.question) return VARIANT_DEFAULTS[variant].question;
  return REASONING_PROMPTS[hashKey(config?.lessonId || config?.title) % REASONING_PROMPTS.length];
}

// Pull authored supports when present; otherwise fall back to engine defaults.
function resolveSupports(phase, config) {
  const authored = Array.isArray(config?.turnAndTalk)
    ? config.turnAndTalk.find((t) => t && t.phase === phase)
    : null;
  const stems =
    Array.isArray(authored?.stems) && authored.stems.length
      ? authored.stems.map((s) =>
          typeof s === "string" ? { en: s, es: "" } : { en: s.en || "", es: s.es || "" },
        )
      : DEFAULT_STEMS;
  const wordBank = Array.isArray(authored?.wordBank) ? authored.wordBank.filter(Boolean) : [];
  const kernel = typeof authored?.kernel === "string" ? authored.kernel.trim() : "";
  const extend = typeof authored?.extend === "string" ? authored.extend.trim() : "";
  const extendStems =
    Array.isArray(authored?.extendStems) && authored.extendStems.length
      ? authored.extendStems.filter(Boolean)
      : STRETCH_STEMS;
  return { stems, wordBank, kernel, extend, extendStems };
}

// Inject the scoped stylesheet exactly once. Every selector is prefixed
// `.discourse-` (or scoped under the overlay) to avoid leaking into other pages.
function ensureStyles() {
  if (document.getElementById("discourse-styles")) return;
  const style = document.createElement("style");
  style.id = "discourse-styles";
  style.textContent = `
.discourse-trigger{display:inline-flex;align-items:center;gap:.5rem;margin:var(--sp-3,1rem) 0;
  padding:.6rem 1rem;border:2px solid var(--coral,#ef476f);border-radius:999px;background:var(--card,#fff);
  color:var(--coral,#ef476f);font-weight:800;font-size:1rem;cursor:pointer;line-height:1.2;
  transition:transform .08s ease,box-shadow .12s ease;}
.discourse-trigger:hover{transform:translateY(-1px);box-shadow:0 4px 14px rgba(0,0,0,.12);}
.discourse-trigger:focus-visible{outline:3px solid var(--coral,#ef476f);outline-offset:2px;}
.discourse-trigger[data-done="1"]{border-color:var(--teal,#06d6a0);color:var(--teal,#06d6a0);}
.discourse-overlay{position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;
  padding:clamp(.75rem,3vw,2rem);background:rgba(15,23,42,.55);backdrop-filter:blur(2px);}
.discourse-overlay[hidden]{display:none;}
.discourse-dialog{background:var(--card,#fff);color:var(--text,#0f172a);border-radius:18px;
  max-width:640px;width:100%;max-height:90vh;overflow:auto;padding:clamp(1.1rem,3vw,1.8rem);
  box-shadow:0 24px 60px rgba(0,0,0,.35);border:3px solid var(--coral,#ef476f);}
.discourse-dialog h2{margin:0;color:var(--coral,#ef476f);font-size:clamp(1.25rem,3.5vw,1.6rem);}
.discourse-close{position:absolute;top:.6rem;right:.7rem;background:transparent;border:none;
  font-size:1.5rem;line-height:1;cursor:pointer;color:var(--muted,#64748b);padding:.25rem .5rem;border-radius:8px;}
.discourse-close:focus-visible{outline:3px solid var(--coral,#ef476f);}
.discourse-q{font-size:clamp(1.1rem,3vw,1.35rem);font-weight:800;line-height:1.35;margin:.75rem 0 1rem;}
.discourse-protocol{background:var(--surface-2,#f1f5f9);border-radius:14px;padding:1rem 1.1rem;margin:0 0 1rem;}
.discourse-protocol ol{margin:.5rem 0 0;padding-left:1.3rem;}
.discourse-protocol li{margin:.35rem 0;font-weight:600;line-height:1.4;}
.discourse-probes{display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.5rem;}
.discourse-probe{background:var(--card,#fff);border:2px solid var(--teal,#06d6a0);border-radius:999px;
  padding:.3rem .7rem;font-weight:700;font-size:.95rem;}
.discourse-probe em{display:block;color:var(--muted,#64748b);font-style:italic;font-weight:600;font-size:.85rem;}
.discourse-support{border:2px solid var(--border,#e2e8f0);border-radius:14px;margin:0 0 .75rem;overflow:hidden;}
.discourse-support>summary{cursor:pointer;padding:.7rem 1rem;font-weight:800;list-style:none;
  display:flex;align-items:center;gap:.5rem;}
.discourse-support>summary::-webkit-details-marker{display:none;}
.discourse-support[open]>summary{border-bottom:1px solid var(--border,#e2e8f0);}
.discourse-support .discourse-support-body{padding:.8rem 1rem;}
.discourse-support ul{margin:.4rem 0 0;padding:0;list-style:none;}
.discourse-support li{margin:.4rem 0;line-height:1.4;}
.discourse-support li .es{display:block;color:var(--muted,#64748b);font-style:italic;font-weight:600;}
.discourse-chips{display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.5rem;}
.discourse-chips .chip{background:var(--teal,#06d6a0);color:#fff;border-radius:999px;padding:.25rem .7rem;font-weight:700;font-size:.9rem;}
.discourse-actions{display:flex;justify-content:flex-end;gap:.6rem;margin-top:1rem;}
.discourse-done-btn{background:var(--teal,#06d6a0);color:#fff;border:none;border-radius:999px;
  padding:.7rem 1.3rem;font-weight:800;font-size:1rem;cursor:pointer;}
.discourse-done-btn:focus-visible{outline:3px solid var(--teal,#06d6a0);outline-offset:2px;}
.discourse-done-note{color:var(--teal,#06d6a0);font-weight:800;align-self:center;}
@media (prefers-reduced-motion:reduce){.discourse-trigger{transition:none;}}
`;
  document.head.appendChild(style);
}

let discourseSeq = 0;

// Build the modal body HTML for a resolved moment.
function dialogBodyHtml(uid, title, question, supports) {
  const probes = PROBE_QUESTIONS.map(
    (p) => `<span class="discourse-probe">${esc(p.en)}<em>${esc(p.es)}</em></span>`,
  ).join("");
  const stems = supports.stems
    .map((s) => `<li>${esc(s.en)}${s.es ? `<span class="es">${esc(s.es)}</span>` : ""}</li>`)
    .join("");
  const kernelHtml = supports.kernel
    ? `<p style="margin:0 0 .6rem;font-weight:600;"><strong style="color:var(--coral,#ef476f);">Start here:</strong> ${esc(supports.kernel)}</p>`
    : "";
  const wordBankHtml = supports.wordBank.length
    ? `<div class="discourse-chips">${supports.wordBank.map((w) => `<span class="chip">${esc(w)}</span>`).join("")}</div>`
    : "";
  const stretchStems = supports.extendStems.map((s) => `<li>${esc(s)}</li>`).join("");
  return `
    <button type="button" class="discourse-close" aria-label="Close discussion">×</button>
    <h2 id="${uid}-title">💬 ${esc(title)}</h2>
    <p class="discourse-q">${esc(question)}</p>
    <div class="discourse-protocol">
      <strong>Question each other / Pregúntense</strong>
      <ol>
        <li>Partner A explains their thinking out loud.</li>
        <li>Partner B asks a question to dig deeper:</li>
      </ol>
      <div class="discourse-probes">${probes}</div>
      <ol start="3"><li>Switch roles and go again.</li></ol>
    </div>
    <details class="discourse-support">
      <summary><span class="badge badge-teal">Level 1 support</span> Sentence starters &amp; words</summary>
      <div class="discourse-support-body">
        ${kernelHtml}
        <p style="margin:0;font-weight:700;">Use a sentence starter / <em>Usa un inicio de oración</em>:</p>
        <ul>${stems}</ul>
        ${wordBankHtml}
      </div>
    </details>
    <details class="discourse-support">
      <summary><span class="badge badge-amber">Level 2 stretch</span> Push your thinking</summary>
      <div class="discourse-support-body">
        ${supports.extend ? `<p style="margin:0 0 .5rem;font-weight:700;">${esc(supports.extend)}</p>` : ""}
        <ul>${stretchStems}</ul>
      </div>
    </details>
    <div class="discourse-actions">
      <span class="discourse-done-note" hidden>Nice discussion! ✓</span>
      <button type="button" class="discourse-done-btn">We discussed ✓</button>
    </div>`;
}

// Public API: mount a discussion moment (trigger + on-demand modal) into `host`.
// opts: { phase, phaseId, config, state, variant }
export function mountDiscussionMoment(host, opts = {}) {
  if (!host) return;
  const { phase = "practice", phaseId = 0, config = {}, state, variant = "practice" } = opts;
  ensureStyles();

  const uid = `discourse-${discourseSeq++}`;
  const respKey = `discuss_${variant}`;
  const meta = VARIANT_DEFAULTS[variant] || VARIANT_DEFAULTS.practice;
  const question = resolveQuestion(phase, config, variant);
  const supports = resolveSupports(phase, config);
  const isDone = () => state && state.getResponse(phaseId, respKey) === "done";

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "discourse-trigger";
  trigger.setAttribute("aria-haspopup", "dialog");
  const paintTrigger = () => {
    const done = isDone();
    trigger.dataset.done = done ? "1" : "0";
    trigger.innerHTML = `<span aria-hidden="true">${done ? "✅" : "💬"}</span> ${esc(done ? "Discussed — talk again?" : meta.label)}`;
  };
  paintTrigger();
  host.appendChild(trigger);

  let overlay = null;
  let lastFocus = null;

  const close = () => {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKeydown, true);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    paintTrigger();
  };

  function onKeydown(e) {
    if (!overlay) return;
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === "Tab") {
      const focusable = overlay.querySelectorAll(
        'button, [href], input, select, textarea, summary, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  const open = () => {
    lastFocus = document.activeElement;
    overlay = document.createElement("div");
    overlay.className = "discourse-overlay";
    const dialog = document.createElement("div");
    dialog.className = "discourse-dialog";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", `${uid}-title`);
    dialog.style.position = "relative";
    dialog.innerHTML = dialogBodyHtml(uid, meta.title, question, supports);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";

    overlay.addEventListener("mousedown", (e) => {
      if (e.target === overlay) close();
    });
    dialog.querySelector(".discourse-close").addEventListener("click", close);
    const doneBtn = dialog.querySelector(".discourse-done-btn");
    const doneNote = dialog.querySelector(".discourse-done-note");
    if (isDone()) {
      doneNote.hidden = false;
      doneBtn.textContent = "Discussed again ✓";
    }
    doneBtn.addEventListener("click", () => {
      if (state) state.saveResponse(phaseId, respKey, "done");
      doneNote.hidden = false;
      doneBtn.textContent = "Discussed ✓";
      setTimeout(close, 650);
    });

    document.addEventListener("keydown", onKeydown, true);
    dialog.querySelector(".discourse-close").focus();
  };

  trigger.addEventListener("click", open);
  return { open, close, trigger };
}

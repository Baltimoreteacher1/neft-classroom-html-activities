// Shared "I'm stuck" student support bar.
//
// A single, consistent help affordance students can open whenever they're
// stuck — surfaced across lessons by the engine, not authored per page. It
// consolidates the supports teachers asked for: a hint, the first step, an
// example, vocabulary help, a sentence starter, and a plain-language
// ("simpler words") restatement. Each option draws from whatever the lesson
// config already provides, with a useful generic fallback so the support is
// always there even for lessons that didn't author extra fields.
//
// ESOL-friendly: vocabulary help shows the Spanish definition when present,
// and the sentence starters are templated frames (not open prose) so multilingual
// learners have a scaffold to fill in — without lowering the math demand.

import { toPlainLanguage } from "./plain-language.js";
import { mountSocraticDialogue } from "./socratic.js";

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

function buildHint(item) {
  const authored = (Array.isArray(item?.hints) && item.hints[0]) || item?.hint || item?.scaffold;
  return (
    authored ||
    "Reread the question and underline exactly what it is asking you to find. What information are you given?"
  );
}

function buildFirstStep(item) {
  return (
    item?.scaffold ||
    (Array.isArray(item?.hints) && item.hints[0]) ||
    "Start by writing down what you already KNOW — list the numbers and facts from the problem. Then decide what you need to find."
  );
}

function buildExample(item) {
  return (
    item?.workedExample ||
    item?.explanation ||
    "Look back at the <strong>Learn It</strong> section above — it walks through a worked example of this kind of problem step by step."
  );
}

function buildVocab(config) {
  const vocab = Array.isArray(config?.vocabulary) ? config.vocabulary : [];
  if (!vocab.length) return "";
  return (
    `<ul class="stuck-vocab">` +
    vocab
      .slice(0, 6)
      .map((v) => {
        const term = esc(v.term || "");
        const def = esc(v.definition || v.def || "");
        const es = v.definitionEs || v.termEs;
        return `<li><strong>${term}</strong> — ${def}${es ? `<br><span class="stuck-es" lang="es">${esc(es)}</span>` : ""}</li>`;
      })
      .join("") +
    `</ul>`
  );
}

function buildSentenceStarter(item, config) {
  const authored = item?.sentenceFrame || config?.connect?.prompt;
  if (authored) return `<p class="stuck-frame">${esc(authored)}</p>`;
  return `<ul class="stuck-frames">
      <li>I know that <span class="stuck-blank"></span>.</li>
      <li>I need to find <span class="stuck-blank"></span>.</li>
      <li>First, I <span class="stuck-blank"></span>. Then I <span class="stuck-blank"></span>.</li>
      <li>My answer is <span class="stuck-blank"></span> because <span class="stuck-blank"></span>.</li>
    </ul>`;
}

// "Explain it in simpler words" used to have nothing to say: it read an authored
// `simpler` field that no lesson in the fleet has ever set (0 of 3,691 items),
// so every student who tapped it got the same generic advice about taking small
// steps. It now runs the problem's own stem through the shared plain-language
// rewriter — the same one behind the lesson-wide "Plain words" toggle — so there
// is one implementation and the chip actually restates THIS problem.
function buildSimpler(item, config) {
  if (item?.simpler) return item.simpler;
  const stem = item?.stem || item?.prompt || config?.revealWordProblem?.text || "";
  const terms = (config?.vocabulary || []).map((v) => v?.term).filter(Boolean);
  const { text, changed } = toPlainLanguage(stem, terms);
  if (changed) {
    return `<strong>In simpler words:</strong> ${esc(text)}<br><span class="stuck-es">The numbers are exactly the same — only the wording changed.</span>`;
  }
  return "Take it one small step at a time. Ask yourself — what is the <strong>first</strong> thing I can figure out with the numbers I have? Do that step, then look again.";
}

/**
 * Mount the "I'm stuck" support bar inside `host`.
 * @param {HTMLElement} host
 * @param {object} opts { config, state, item }  item is optional (per-problem).
 */
/**
 * "Fix the mix-up" — a two-step, config-driven micro-check built from the
 * lesson's authored commonMistake (no AI, no network). Step 1: spot why the
 * classic wrong move fails; step 2: redo the problem avoiding it.
 */
function buildFixIt(item, config, state) {
  const mistake =
    item?.commonMistake || config?.commonMistake || config?.reflect?.commonMistake || null;
  if (!mistake) return "";
  const text = typeof mistake === "string" ? mistake : mistake.text || mistake.description || "";
  if (!text) return "";
  // If this student has a recorded repeat trip-up, name the pattern gently.
  let seen = 0;
  try {
    const m = state?.get?.("misconceptions") || {};
    seen = Object.values(m).reduce((t, n) => t + n, 0);
  } catch {
    seen = 0;
  }
  return `
    <div class="stuck-fixit">
      <p><strong>Step 1 — Spot it:</strong> A very common mix-up on this kind of problem is:</p>
      <blockquote class="stuck-fixit-mistake">${esc(text)}</blockquote>
      <p>Ask yourself: <em>why</em> does that move give the wrong answer?</p>
      <p><strong>Step 2 — Fix it:</strong> Try your problem again, and say (or write) the step
      where you will NOT make that mix-up.${
        seen >= 2
          ? " You've bumped into this one a couple of times — naming it out loud is how you beat it."
          : ""
      }</p>
    </div>`;
}

export function mountStuckSupport(host, opts = {}) {
  if (!host) return null;
  const { config = {}, item = null, state = null } = opts;

  // The bar's only caller mounts it beside the "Show Your Work" solve and passes
  // no per-item object, because the problem being worked there is the lesson's
  // own `revealWordProblem`. Anything that needs the PROBLEM TEXT (rather than an
  // item's authored hints) has to fall back to it, or it silently never appears —
  // which is exactly what happened to the Socratic option on first wiring.
  const problemText = item?.stem || item?.prompt || config?.revealWordProblem?.text || "";
  const socraticItem = problemText ? { ...(item || {}), stem: problemText } : null;

  const options = [
    {
      key: "hint",
      icon: "💡",
      label: "Hint",
      html: `<p>${esc(buildHint(item))}</p>`,
    },
    {
      key: "first",
      icon: "👣",
      label: "Show me the first step",
      html: `<p>${esc(buildFirstStep(item))}</p>`,
    },
    {
      key: "example",
      icon: "📖",
      label: "See an example",
      html: `<p>${buildExample(item)}</p>`,
    },
    {
      key: "vocab",
      icon: "📚",
      label: "Vocabulary help",
      html: buildVocab(config),
    },
    {
      key: "frame",
      icon: "✍️",
      label: "Sentence starter",
      html: buildSentenceStarter(item, config),
    },
    {
      key: "fixit",
      icon: "🧰",
      label: "Fix the mix-up",
      html: buildFixIt(item, config, state),
    },
    {
      key: "simpler",
      icon: "🔤",
      label: "Explain it in simpler words",
      html: `<p>${buildSimpler(item, config)}</p>`,
    },
    // Every other option on this bar TELLS the student something. This one is
    // the opposite move and belongs last, after the ones that unstick a student
    // who needs to move: it is for the student who is thinking and should keep
    // thinking. `mount` instead of `html` because it is a live dialogue, not a
    // panel of text.
    {
      key: "socratic",
      icon: "❓",
      label: "Ask me questions instead",
      mount: (panel) => mountSocraticDialogue(panel, { item: socraticItem, config, state }),
    },
  ].filter((o) => (o.mount ? Boolean(socraticItem) : o.html && o.html.trim()));

  const wrap = document.createElement("section");
  wrap.className = "stuck-support";
  wrap.innerHTML = `
    <button type="button" class="stuck-toggle" aria-expanded="false">
      🤔 I'm stuck — get help
    </button>
    <div class="stuck-body" hidden>
      <div class="stuck-chips" role="group" aria-label="Help options">
        ${options
          .map(
            (o) =>
              `<button type="button" class="stuck-chip" data-help="${o.key}">${o.icon} ${esc(o.label)}</button>`,
          )
          .join("")}
      </div>
      <div class="stuck-panel" role="region" aria-live="polite" hidden></div>
    </div>`;

  const toggle = wrap.querySelector(".stuck-toggle");
  const body = wrap.querySelector(".stuck-body");
  const panel = wrap.querySelector(".stuck-panel");
  toggle.addEventListener("click", () => {
    const open = body.hidden;
    body.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
  });

  wrap.querySelectorAll(".stuck-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const opt = options.find((o) => o.key === chip.dataset.help);
      const active = chip.classList.contains("is-active");
      wrap.querySelectorAll(".stuck-chip").forEach((c) => c.classList.remove("is-active"));
      if (active) {
        panel.hidden = true;
        return;
      }
      chip.classList.add("is-active");
      panel.innerHTML = "";
      if (opt?.mount) {
        opt.mount(panel);
      } else {
        panel.innerHTML = opt ? opt.html : "";
      }
      panel.hidden = false;
    });
  });

  // Worked-example fade-in: after two wrong answers in a row on this card's
  // problem set, quietly open the bar to the "See an example" panel once —
  // the I-do model resurfaces exactly when the student needs it. Watches the
  // existing state stream; no new tracking, and never re-fires.
  if (state && typeof state.subscribe === "function") {
    let lastAttempts = null;
    let lastCorrect = null;
    let wrongStreak = 0;
    let fired = false;
    const unsub = state.subscribe(() => {
      try {
        const attempts = state.get("totalAttempts") || 0;
        const correct = state.get("totalCorrect") || 0;
        if (lastAttempts === null) {
          lastAttempts = attempts;
          lastCorrect = correct;
          return;
        }
        if (attempts > lastAttempts) {
          wrongStreak = correct > lastCorrect ? 0 : wrongStreak + 1;
          lastAttempts = attempts;
          lastCorrect = correct;
          if (wrongStreak >= 2 && !fired) {
            fired = true;
            if (typeof unsub === "function") unsub();
            if (body.hidden) toggle.click();
            const exampleChip = wrap.querySelector('.stuck-chip[data-help="example"]');
            if (exampleChip && !exampleChip.classList.contains("is-active")) exampleChip.click();
          }
        }
      } catch {
        /* never break practice */
      }
    });
  }

  host.append(wrap);
  return wrap;
}

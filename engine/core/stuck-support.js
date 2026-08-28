// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
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

/* ── Reading the problem that is actually on screen ────────────────────────
 *
 * Every chip on this bar used to fall back to advice that could have been
 * printed on a poster: "Reread the question and underline what it is asking",
 * "Look back at the Learn It section". Four of the eight said nothing about the
 * problem in front of the student (Joel, 2026-08-28: "if it is going to offer
 * help, it should actually offer help with the problem specifically (not just
 * general). If you can build this out, do it"). The readers below pull the
 * problem's own numbers, units and question out of its text so Hint and
 * First step can name them, and "See an example" prints the LESSON's authored
 * worked example instead of pointing at it.
 *
 * Nothing here invents mathematics — it quotes and restates what the lesson
 * already wrote. Each reader returns "" when it cannot read the text with
 * confidence, and the old generic wording still stands for that case. */

/* Words that commonly follow a number without being its unit. */
const NOT_A_UNIT = new Set([
  "and",
  "or",
  "of",
  "the",
  "is",
  "are",
  "was",
  "were",
  "to",
  "in",
  "on",
  "at",
  "he",
  "she",
  "it",
  "they",
  "a",
  "an",
  "by",
  "into",
  "each",
  "every",
  "that",
  "this",
  "then",
  "so",
  "if",
  "for",
  "from",
  "with",
  "as",
  "but",
  "more",
  "less",
  "than",
  "whole",
  "wholes",
  "equal",
  "equally",
  "small",
  "smaller",
  "total",
  "complete",
  "mini",
  "premium",
  "long",
  "wide",
  "tall",
  "deep",
  "left",
  "remaining",
  "other",
  "same",
  "new",
  "different",
  "how",
  "what",
  "when",
  "his",
  "her",
  "their",
  "its",
  "one",
  "two",
  "three",
  "four",
  "five",
]);

/** Number (whole, decimal, fraction, mixed) plus the unit word that follows. */
function readQuantities(text) {
  const src = String(text || "");
  const re = /(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)((?:[-\s]+[A-Za-z]+){0,2})/g;
  const seen = new Set();
  const out = [];
  let m = re.exec(src);
  while (m) {
    const value = m[1].replace(/\s+/g, " ").trim();
    const words = String(m[2] || "")
      .split(/[-\s]+/)
      .filter(Boolean);
    // Keep every trailing word that could be part of the unit ("snack bags"),
    // not just the first — "4 snack" reads as a typo where "4 snack bags" reads
    // as the quantity the story actually names.
    const unit = words
      .filter((w) => !NOT_A_UNIT.has(w.toLowerCase()))
      .join(" ")
      .toLowerCase();
    const key = `${value}|${unit}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push({ value, unit });
    }
    if (out.length >= 6) break;
    m = re.exec(src);
  }
  return out;
}

/** How a quantity reads back to a student: "8 feet", or just "8". */
function quantityText(q) {
  return q.unit ? `${q.value} ${q.unit}` : q.value;
}

/** The sentence that states the job. */
function readAsk(text) {
  const parts = String(text || "")
    .split(/(?<=[.?!])\s+/)
    .map((x) => x.trim())
    .filter(Boolean);
  // The Reveal decks label the task sentence "Question: …"; the label is the
  // deck's formatting, not part of what the problem asks, and quoting it back
  // reads as a stray word.
  const strip = (x) => x.replace(/^\s*Question:\s*/i, "").trim();
  const question = parts.find((x) => x.endsWith("?"));
  if (question) return strip(question);
  const command = parts.find((x) =>
    /^(?:Question:\s*)?(find|calculate|determine|work out|show|how many|how much|what)\b/i.test(x),
  );
  return command ? strip(command) : "";
}

/** The lesson's own authored worked example, printed rather than pointed at. */
function lessonWorkedExample(config) {
  const intro = config?.launch?.conceptIntro || config?.conceptIntro;
  const lines = intro?.iDo?.lines;
  if (!Array.isArray(lines) || !lines.length) return "";
  return (
    `<p><strong>Here is the worked example from today's lesson, one move at a time:</strong></p>` +
    `<ol class="stuck-worked">${lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ol>` +
    (intro.keyIdea
      ? `<p class="stuck-keyidea"><strong>The rule:</strong> ${esc(intro.keyIdea)}</p>`
      : "")
  );
}

/** What this problem hands you and what it wants — in its own words. */
function describeProblem(problemText) {
  const quantities = readQuantities(problemText);
  const ask = readAsk(problemText);
  if (!quantities.length && !ask) return "";
  const given = quantities.length
    ? `<p><strong>This problem gives you:</strong> ${quantities
        .map((q) => `<span class="stuck-qty">${esc(quantityText(q))}</span>`)
        .join(" · ")}</p>`
    : "";
  const wants = ask ? `<p><strong>It asks:</strong> “${esc(ask)}”</p>` : "";
  return given + wants;
}

function buildHint(item, problemText) {
  const authored = (Array.isArray(item?.hints) && item.hints[0]) || item?.hint || item?.scaffold;
  if (authored) return `<p>${esc(authored)}</p>`;
  const described = describeProblem(problemText);
  if (described) {
    return (
      described +
      `<p>Before you compute, decide what each number <em>means</em> in the story: which one is the
       total you start with, and which one is the size of one group? That choice is the whole problem.</p>`
    );
  }
  return `<p>Reread the question and underline exactly what it is asking you to find. What information are you given?</p>`;
}

function buildFirstStep(item, config, problemText) {
  const authored = item?.scaffold || (Array.isArray(item?.hints) && item.hints[0]);
  if (authored) return `<p>${esc(authored)}</p>`;
  const quantities = readQuantities(problemText);
  const ask = readAsk(problemText);
  if (quantities.length || ask) {
    const know = quantities.length
      ? `<li><strong>What I KNOW:</strong> ${quantities.map((q) => esc(quantityText(q))).join(", ")}</li>`
      : "";
    const need = ask ? `<li><strong>What I NEED:</strong> ${esc(ask)}</li>` : "";
    const intro = config?.launch?.conceptIntro || config?.conceptIntro;
    const firstMove = Array.isArray(intro?.iDo?.lines) ? intro.iDo.lines[0] : "";
    return (
      `<p><strong>Copy these two lines onto your paper first:</strong></p>` +
      `<ul class="stuck-frames">${know}${need}</ul>` +
      (firstMove
        ? `<p><strong>Then make the same first move the lesson made:</strong> ${esc(firstMove)}</p>`
        : "")
    );
  }
  return `<p>Start by writing down what you already KNOW — list the numbers and facts from the problem. Then decide what you need to find.</p>`;
}

function buildExample(item, config) {
  if (item?.workedExample) return `<p>${esc(item.workedExample)}</p>`;
  if (item?.explanation) return `<p>${esc(item.explanation)}</p>`;
  const worked = lessonWorkedExample(config);
  if (worked) return worked;
  return `<p>Look back at the <strong>Learn It</strong> section above — it walks through a worked example of this kind of problem step by step.</p>`;
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
function buildSimpler(item, config, problemText) {
  if (item?.simpler) return item.simpler;
  const stem = item?.stem || item?.prompt || problemText || config?.revealWordProblem?.text || "";
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
  const { config = {}, item = null, state = null, problem = "" } = opts;

  // Anything that needs the PROBLEM TEXT (rather than an item's authored hints)
  // has to resolve it here, or the Socratic chip silently never appears — which
  // is exactly what happened on its first wiring, because the bar's callers pass
  // no per-item object.
  //
  // `problem` is how a caller names the problem the student is actually looking
  // at. Part 1's Show Your Work passes its Launch scenario: since the Apply word
  // problem moved to Part 2, falling through to `config.revealWordProblem` there
  // would have the tutor ask Socratic questions about a problem that is not on
  // the screen. The revealWordProblem fallback stays for Part 2, whose solve IS
  // that problem.
  const problemText =
    item?.stem || item?.prompt || problem || config?.revealWordProblem?.text || "";
  const socraticItem = problemText ? { ...(item || {}), stem: problemText } : null;

  const options = [
    {
      key: "hint",
      icon: "💡",
      label: "Hint",
      html: buildHint(item, problemText),
    },
    {
      key: "first",
      icon: "👣",
      label: "Show me the first step",
      html: buildFirstStep(item, config, problemText),
    },
    {
      key: "example",
      icon: "📖",
      label: "See an example",
      html: buildExample(item, config),
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
      html: `<p>${buildSimpler(item, config, problemText)}</p>`,
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

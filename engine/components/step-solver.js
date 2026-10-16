// The math engine (tokenizer, parser, equivalence testing) lives in
// engine/core/step-diagnosis-engine.js so the diagnosis of a wrong line reads
// every line exactly as this component does.
//
// A line that is not equivalent to the one above is also run through
// engine/core/step-diagnosis.js: when exactly one named mistake would produce
// it, the student sees the same "Looks like: …" chip the multiple-choice items
// show (EN + ES) plus one Socratic question — never the correct line — and the
// misconception reaches the heatmap, class pulse and lesson state.
//
// Pure DOM. Public API:
//   renderStepSolver(container, cfg, ctx?) -> { destroy }
//     cfg.mode    : "expression" (default) | "equation"
//     cfg.start   : first line of the problem, e.g. "3x + 6 = 18" or "3/4 ÷ 1/8"
//     cfg.answer  : optional final form, revealed only on request after real work
//     cfg.presets : optional [{ start, label?, answer? }] quick-pick problems
//     cfg.intro   : optional one-line coaching sentence under the title
//     ctx.state   : optional lesson state; its recordMisconception(tag) is called

import { stackContent } from "../core/i18n.js";
import { misconceptionLabel } from "../core/misconceptions.js";
import { diagnoseStep } from "../core/step-diagnosis.js";
import {
  isEquivalent,
  looksSolved,
  normalizeSides,
  parseLine,
} from "../core/step-diagnosis-engine.js";
import { stepNudge } from "../core/step-diagnosis-nudges.js";

const C = {
  navy: "#12355b",
  accent: "#1d4ed8",
  teal: "#0d7a76",
  tealBg: "#e2f9f5",
  amber: "#8a5800",
  amberBg: "#fbf4e6",
  ink: "#1a2b3c",
  muted: "#54677c",
  line: "#d7e2ed",
  chipBg: "#f4f8ff",
};

function esc(s) {
  return String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
}

function prefersReducedMotion() {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

const PARSE_MSGS = {
  symbol:
    "There's a symbol in there I can't read. Stick to numbers, + − × ÷, parentheses, and one letter.",
  number: "One of your numbers has two decimal points — check it.",
  mixed: "Two numbers side by side confuse me. For a mixed number, write it like 2 1/2.",
  paren: "Your parentheses don't match up — every ( needs a ).",
  equals: "Use at most one = sign per line.",
  vars: "Use just one letter for the unknown in this problem.",
  empty: "Type a full line first, then check it.",
  divzero: "A fraction can't have 0 on the bottom.",
  sides: "An equation line needs something on both sides of the = sign.",
};

// Where a named step mistake goes. Same sinks as a typed practice miss
// (lesson-renderer.js reportTypedMisconception) so a diagnosed step is worth what
// a diagnosed answer is worth: the device-local signal store, the lesson's
// per-tag counts, and the teacher telemetry the heatmap and class pulse read.
// Tag only — never the typed line, never a name. It deliberately carries no
// `standard` into NTSignal: that would log an attempt for every wrong line while
// the right ones log nothing, and skew the device's weak-standard rates.
function reportStepMisconception(tag, ctx) {
  try {
    const meta = window.__ntLessonMeta || {};
    window.NTSignal?.record?.({ misconceptionTag: tag, lesson: meta.lesson });
    ctx?.state?.recordMisconception?.(tag);
    window.NTtelemetry?.track?.("misconception", { tag, standard: meta.standard || "" });
  } catch {
    /* signals must never break a lesson */
  }
}

// The chip + one question for a diagnosed step; "" when the tag has no copy.
function diagnosisHtml(tag) {
  const label = misconceptionLabel(tag, "en");
  const labelEs = misconceptionLabel(tag, "es");
  const nudge = stepNudge(tag);
  if (!label || !nudge) return "";
  return (
    `<span class="stepslv-diagnosis"><span aria-hidden="true">💭</span> ${stackContent(
      `Looks like: ${label}`,
      labelEs === label ? undefined : `Parece que: ${labelEs}`,
    )}</span>` + `<span class="stepslv-nudge">${stackContent(nudge.en, nudge.es)}</span>`
  );
}

export function renderStepSolver(container, cfg = {}, ctx = {}) {
  const mode = cfg.mode === "equation" ? "equation" : "expression";
  let problem = {
    start: cfg.start || (mode === "equation" ? "x + 7 = 15" : "18.4 - 5.75 + 2.1"),
    answer: cfg.answer || "",
  };
  const presets = Array.isArray(cfg.presets) ? cfg.presets.filter((p) => p && p.start) : [];
  let lines = []; // { text, parsed }
  let attempts = 0;
  const reported = new Set(); // "<line above>\n<typed line>" already counted

  injectStyles();
  const root = document.createElement("div");
  root.className = "stepslv";
  const intro =
    cfg.intro ||
    (mode === "equation"
      ? "Solve it one line at a time. After each step I'll check that your equation still has the same solution — like keeping a scale balanced."
      : "Work it out one line at a time. After each step I'll check that your line is still worth the same amount.");
  root.innerHTML =
    `<div class="stepslv-head"><span class="stepslv-title">📝 Work It Out — Step Lab</span></div>` +
    `<p class="stepslv-hint">${esc(intro)}</p>` +
    `<div class="stepslv-problem"><span class="stepslv-problabel">Problem</span><span class="stepslv-probtext" data-el="prob"></span></div>` +
    (presets.length
      ? `<div class="stepslv-presets" role="group" aria-label="Pick a problem">` +
        presets
          .map(
            (p, i) =>
              `<button type="button" class="stepslv-chip" data-preset="${i}">${esc(p.label || p.start)}</button>`,
          )
          .join("") +
        `</div>`
      : "") +
    `<ol class="stepslv-lines" data-el="lines" aria-label="Your steps so far"></ol>` +
    `<div class="stepslv-inrow">` +
    `<input type="text" class="stepslv-input" data-el="inp" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Type your next step" placeholder="Type your next line…" />` +
    `<button type="button" class="stepslv-go" data-el="check">Check step</button></div>` +
    `<div class="stepslv-keys" role="group" aria-label="Math symbols">` +
    ["×", "÷", "(", ")", "=", "²"]
      .map((k) => `<button type="button" class="stepslv-key" data-key="${k}">${k}</button>`)
      .join("") +
    `<button type="button" class="stepslv-key stepslv-undo" data-el="undo">↩ Undo step</button>` +
    `<button type="button" class="stepslv-key" data-el="reset">Start over</button>` +
    (problem.answer || presets.some((p) => p.answer)
      ? `<button type="button" class="stepslv-key" data-el="reveal" hidden>Show the final form</button>`
      : "") +
    `</div>` +
    `<div class="stepslv-feed" data-el="feed" role="status" aria-live="polite"></div>`;
  container.appendChild(root);

  const el = (name) => /** @type {HTMLElement} */ (root.querySelector(`[data-el="${name}"]`));
  const inp = /** @type {HTMLInputElement} */ (el("inp"));
  const feed = el("feed");

  function setProblem(p) {
    problem = { start: p.start, answer: p.answer || "" };
    lines = [];
    attempts = 0;
    reported.clear();
    try {
      lines.push({ text: problem.start, parsed: parseLine(problem.start) });
    } catch {
      /* authored start should always parse; leave list empty if not */
    }
    el("prob").textContent = problem.start;
    inp.value = "";
    feed.innerHTML = "";
    const rev = el("reveal");
    if (rev) rev.hidden = true;
    renderLines();
    if (lines.length) animateReveal(0);
  }

  function renderLines() {
    el("lines").innerHTML = lines
      .map(
        (l, i) =>
          `<li class="stepslv-line${i === 0 ? " stepslv-line-first" : ""}">` +
          `<span class="stepslv-linetext">${esc(l.text)}</span>` +
          (i > 0 ? `<span class="stepslv-ok" aria-label="equivalent step">✓</span>` : "") +
          `</li>`,
      )
      .join("");
  }

  // "Self-writing" reveal for one just-added line: a soft highlight sweeps the
  // row while the text types itself in. Step text is always plain (esc'd on
  // render), so slicing is entity-safe. The full text stays in the DOM for
  // screen readers via a visually-hidden twin; only the aria-hidden visual
  // layer types. Purely cosmetic — never blocks input, grading, or state.
  let typeRaf = 0;
  function animateReveal(index) {
    const li = el("lines").children[index];
    if (!li) return;
    li.classList.add("stepslv-line-reveal");
    if (prefersReducedMotion()) return;
    const span = li.querySelector(".stepslv-linetext");
    const full = span.textContent;
    if (!full) return;
    cancelAnimationFrame(typeRaf);
    span.innerHTML =
      `<span class="stepslv-srtext">${esc(full)}</span>` +
      `<span class="stepslv-typetext" aria-hidden="true"></span>`;
    const vis = span.lastElementChild;
    // ~24ms/char, scaled down so long lines finish within ~900ms total.
    const perChar = Math.min(24, 900 / full.length);
    const t0 = performance.now();
    const tick = (now) => {
      if (!vis.isConnected) return; // list re-rendered mid-type; stop quietly
      const n = Math.min(full.length, Math.ceil((now - t0) / perChar));
      vis.textContent = full.slice(0, n);
      if (n < full.length) typeRaf = requestAnimationFrame(tick);
      else span.textContent = full; // collapse back to one plain text node
    };
    typeRaf = requestAnimationFrame(tick);
  }

  function say(kind, html) {
    feed.innerHTML = `<div class="stepslv-msg stepslv-msg-${kind}">${html}</div>`;
  }

  function checkStep() {
    const text = inp.value.trim();
    if (!text) {
      say("warn", PARSE_MSGS.empty);
      return;
    }
    let parsed;
    try {
      parsed = parseLine(text);
    } catch (e) {
      say("warn", esc(PARSE_MSGS[e.message] || PARSE_MSGS.symbol));
      return;
    }
    attempts++;
    const prev = lines[lines.length - 1];
    if (!normalizeSides(parsed, mode)) {
      say("warn", esc(PARSE_MSGS.sides));
      return;
    }
    const equivalent = prev ? isEquivalent(prev.parsed, parsed, mode) : true;
    if (!equivalent) {
      // Name the mistake only when exactly one known error reproduces this line.
      // Counted once per distinct wrong line so pressing Check twice on the same
      // text does not double the teacher's tally.
      const diagnosis = prev ? diagnoseStep(prev.text, text, mode) : null;
      const key = `${prev?.text}\n${text}`;
      if (diagnosis && !reported.has(key)) {
        reported.add(key);
        reportStepMisconception(diagnosis.tag, ctx);
      }
      say(
        "warn",
        (mode === "equation"
          ? "Not quite — this line doesn't have the same solution as your last line. Did you do the <strong>same thing to both sides</strong>? Fix this line and check again."
          : "Not quite — this line isn't worth the same amount as your last line. Check that one operation, then try the line again.") +
          (diagnosis ? diagnosisHtml(diagnosis.tag) : ""),
      );
      return;
    }
    lines.push({ text, parsed });
    inp.value = "";
    renderLines();
    animateReveal(lines.length - 1);
    let answerTokens = 0;
    if (problem.answer) {
      try {
        answerTokens = parseLine(problem.answer).tokenCount;
      } catch {}
    }
    if (looksSolved(parsed, mode, answerTokens)) {
      root.classList.add("stepslv-won");
      say(
        "win",
        mode === "equation"
          ? `🎉 <strong>Solved!</strong> Every line kept the equation balanced, and <strong>${esc(text)}</strong> is the solution. Substitute it back into line 1 to prove it.`
          : `🎉 <strong>Fully worked out!</strong> Every step stayed equivalent — <strong>${esc(text)}</strong> is your simplified answer.`,
      );
      setTimeout(() => root.classList.remove("stepslv-won"), 1400);
      // Circle the final answer with a hand-drawn chalk mark (warm-deck only;
      // no-op otherwise). The answer is the last <strong> in the win message.
      if (window.NTChalk) {
        const answerEl = feed.querySelector(".stepslv-msg-win strong:last-of-type");
        if (answerEl) window.NTChalk.circle(answerEl);
      }
    } else {
      const n = lines.length - 1;
      say(
        "ok",
        `✓ <strong>Step ${n} accepted.</strong> ${mode === "equation" ? "Still balanced — same solution." : "Still equivalent — same value."} Keep going.`,
      );
      const rev = el("reveal");
      if (rev && attempts >= 3 && problem.answer) rev.hidden = false;
    }
    inp.focus();
  }

  el("check").addEventListener("click", checkStep);
  inp.addEventListener("keydown", (e) => {
    if (/** @type {KeyboardEvent} */ (e).key === "Enter") {
      e.preventDefault();
      checkStep();
    }
  });
  el("undo").addEventListener("click", () => {
    if (lines.length > 1) {
      lines.pop();
      renderLines();
      say("ok", "Last step removed — pick up from the line above.");
    }
  });
  el("reset").addEventListener("click", () => setProblem(problem));
  root.querySelectorAll("[data-key]").forEach((/** @type {HTMLElement} */ btn) =>
    btn.addEventListener("click", () => {
      const at = inp.selectionStart ?? inp.value.length;
      inp.value =
        inp.value.slice(0, at) + btn.dataset.key + inp.value.slice(inp.selectionEnd ?? at);
      inp.focus();
      inp.selectionStart = inp.selectionEnd = at + btn.dataset.key.length;
    }),
  );
  root
    .querySelectorAll("[data-preset]")
    .forEach((/** @type {HTMLElement} */ btn) =>
      btn.addEventListener("click", () => setProblem(presets[Number(btn.dataset.preset)])),
    );
  const rev = el("reveal");
  if (rev)
    rev.addEventListener("click", () => {
      if (problem.answer)
        say(
          "ok",
          `The finished form looks like <strong>${esc(problem.answer)}</strong>. Work your lines until you get there — each step must stay equivalent.`,
        );
    });

  setProblem(problem);

  return {
    destroy() {
      cancelAnimationFrame(typeRaf);
      root.remove();
    },
  };
}

let stylesInjected = false;
function injectStyles() {
  if (stylesInjected || document.getElementById("stepslv-styles")) {
    stylesInjected = true;
    return;
  }
  stylesInjected = true;
  const s = document.createElement("style");
  s.id = "stepslv-styles";
  s.textContent = `
  .stepslv{max-width:680px;margin:0 auto;background:#fff;border:1px solid ${C.line};border-radius:16px;padding:16px 16px 18px;box-shadow:0 2px 12px rgba(12,27,42,.08);font-family:"Hanken Grotesk",system-ui,sans-serif;color:${C.ink};}
  .stepslv-title{font-family:"Outfit",system-ui,sans-serif;font-weight:700;color:${C.navy};font-size:1.05rem;}
  .stepslv-hint{margin:4px 0 12px;color:${C.muted};font-size:.9rem;line-height:1.45;}
  .stepslv-problem{display:flex;align-items:center;gap:10px;padding:10px 14px;background:#f8fbff;border:1px solid ${C.line};border-radius:12px;}
  .stepslv-problabel{font-size:.7rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:${C.muted};}
  .stepslv-probtext{font-family:"Outfit",system-ui,sans-serif;font-weight:700;font-size:1.15rem;color:${C.navy};}
  .stepslv-presets{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;}
  .stepslv-chip{padding:5px 12px;font-size:.9rem;font-weight:600;color:${C.navy};background:${C.chipBg};border:1.5px solid ${C.line};border-radius:999px;cursor:pointer;}
  .stepslv-chip:hover{background:#e2ecff;border-color:${C.accent};}
  .stepslv-lines{list-style:none;margin:12px 0 0;padding:0;display:flex;flex-direction:column;gap:6px;counter-reset:step -1;}
  .stepslv-line{counter-increment:step;display:flex;align-items:center;gap:10px;padding:8px 12px;background:#fbfcfe;border:1px solid ${C.line};border-radius:10px;font-size:1.05rem;font-weight:600;}
  .stepslv-line::before{content:counter(step);min-width:1.6em;height:1.6em;display:grid;place-items:center;font-size:.72rem;font-weight:700;color:${C.muted};background:${C.chipBg};border-radius:999px;}
  .stepslv-line-first::before{content:"start";min-width:auto;padding:0 8px;}
  .stepslv-linetext{flex:1;word-break:break-word;}
  .stepslv-ok{color:${C.teal};font-weight:700;}
  .stepslv-inrow{display:flex;gap:8px;margin-top:12px;}
  .stepslv-input{flex:1;min-width:0;padding:10px 12px;font-size:1.05rem;font-weight:600;color:${C.ink};border:2px solid ${C.line};border-radius:10px;background:#fbfcfe;}
  .stepslv-input:focus-visible{outline:3px solid ${C.accent};outline-offset:1px;border-color:${C.accent};}
  .stepslv-go{padding:9px 16px;font-size:.95rem;font-weight:700;color:#fff;background:linear-gradient(135deg,#4f46e5,#0e8a7d);border:0;border-radius:10px;cursor:pointer;white-space:nowrap;}
  .stepslv-go:hover{filter:brightness(1.08);}
  .stepslv-go:focus-visible,.stepslv-key:focus-visible,.stepslv-chip:focus-visible{outline:3px solid ${C.accent};outline-offset:2px;}
  .stepslv-keys{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;}
  .stepslv-key{padding:6px 12px;font-size:.95rem;font-weight:600;color:${C.navy};background:${C.chipBg};border:1.5px solid ${C.line};border-radius:8px;cursor:pointer;}
  .stepslv-key:hover{background:#e2ecff;}
  .stepslv-feed{margin-top:10px;min-height:1.2em;}
  .stepslv-msg{padding:10px 14px;border-radius:12px;font-size:.95rem;line-height:1.5;animation:stepslv-msgin .28s ease;}
  .stepslv-diagnosis{display:flex;gap:6px;align-items:flex-start;margin-top:8px;font-weight:700;line-height:1.35;}
  .stepslv-nudge{display:block;margin-top:4px;font-weight:600;line-height:1.45;}
  .stepslv-msg-ok{background:${C.tealBg};color:#095350;border:1px solid #9adbd2;}
  .stepslv-msg-warn{background:${C.amberBg};color:${C.amber};border:1px solid #ecd9ae;}
  .stepslv-msg-win{background:linear-gradient(135deg,#e2f9f5,#eef2ff);color:${C.navy};border:1px solid #9adbd2;font-weight:500;}
  .stepslv-won{animation:stepslv-pop .5s ease;}
  .stepslv-line-reveal{position:relative;overflow:hidden;animation:stepslv-linein .3s ease;}
  .stepslv-line-reveal::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(105deg,transparent 20%,rgba(29,78,216,.14) 45%,rgba(13,122,118,.12) 55%,transparent 80%);transform:translateX(-101%);animation:stepslv-sweep .9s ease .05s forwards;}
  .stepslv-srtext{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;}
  .stepslv-typetext::after{content:"";display:inline-block;width:2px;height:1em;margin-left:1px;vertical-align:-.15em;background:${C.accent};}
  @keyframes stepslv-pop{0%{transform:scale(1)}35%{transform:scale(1.015)}100%{transform:scale(1)}}
  @keyframes stepslv-linein{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
  @keyframes stepslv-sweep{to{transform:translateX(101%)}}
  @keyframes stepslv-msgin{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
  @media (prefers-reduced-motion:reduce){
    .stepslv-won,.stepslv-msg,.stepslv-line-reveal{animation:none;}
    .stepslv-line-reveal::after{animation:none;content:none;}
  }
  @media (max-width:480px){.stepslv-inrow{flex-direction:column}.stepslv-go{width:100%}}
  `;
  document.head.appendChild(s);
}

export default renderStepSolver;

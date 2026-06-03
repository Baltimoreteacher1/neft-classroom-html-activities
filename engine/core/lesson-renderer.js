import { createApp } from "./app.js";
import { createAdaptiveSequence } from "./adaptive.js";
import { levelOverride, mountLevelSelector } from "./levels.js";
import {
  renderVocabBuilder,
  renderMultipleChoice,
  renderDragSort,
  renderOpenResponse,
  renderErrorAnalysis,
  renderFillTable,
  renderNumberLine,
  renderCoordinateGrid,
  renderMatchingGame,
  renderBarModel,
  renderBalanceScale,
  renderVocabDragMatch,
  renderVocabCloze,
  renderVocabSort,
  renderVocabIntro,
  renderAlgebraTiles,
  renderFractionBars,
  renderNetFolder,
  renderCoordinatePlane,
  renderRemediation,
  renderTwrWriting,
} from "../components/index.js";
import {
  renderActivityChooser,
  renderOptionalPracticeOptIn,
} from "../components/activity-chooser.js";
import { buildGradeCard } from "./grade.js";

export function bootLesson(config) {
  createApp({
    ...config,
    phases: [
      (el, state, ctx) => renderLaunchPhase(el, state, ctx, config),
      (el, state, ctx) => renderVocabPhase(el, state, ctx, config),
      (el, state, ctx) => renderExplorePhase(el, state, ctx, config),
      (el, state, ctx) => renderPracticePhase(el, state, ctx, config),
      (el, state, ctx) => renderConnectPhase(el, state, ctx, config),
      (el, state, ctx) => renderReflectPhase(el, state, ctx, config),
    ],
  });
}

// ── Helpers ──
function esc(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

// Derive a SHORT, non-answer-giving scaffold hint for a Level 1 practice item.
// Prefers an authored item.scaffold/item.hint; otherwise builds a type-aware
// nudge ("what to look at / what to ask yourself") from the item's shape. It
// NEVER reveals the choice/index/answer/explanation. Degrades to a generic
// process cue if the item has no usable fields.
function deriveScaffold(prob) {
  if (!prob) return "";
  if (prob.scaffold) return String(prob.scaffold).trim();
  if (prob.hint) return String(prob.hint).trim();

  switch (prob.type) {
    case "multiple-choice":
      return "Read each choice carefully. Cross out the ones you can rule out first, then check the rest against the question.";
    case "drag-sort":
      return "Read each category label first. For every card, ask which label it matches best before you drag it.";
    case "matching-game":
    case "matching":
      return "Start with the pair you are most sure about. Match those first, then use what is left to figure out the rest.";
    case "number-line":
      return "Find 0 and the end points first. Count the equal spaces between the marks before you place your point.";
    case "fill-table":
      return "Fill in the cells you already know first. Look for the pattern or rule between the rows or columns to find the rest.";
    case "coordinate-grid":
    case "coordinate-plane":
      return "Start at the origin (0, 0). Move across for the x value, then up or down for the y value.";
    case "open-response":
      return "Underline what the question is asking. Show your steps and use one number or word from the problem as evidence.";
    case "error-analysis":
      return "Read each step and check it against the rule. Find the first step where the work stops being true.";
    default:
      return "Re-read the question and underline what it is asking. Plan your first step before you answer.";
  }
}

function phaseHeader(el, icon, iconClass, title, desc) {
  const h = document.createElement("div");
  h.className = "section-header";
  h.innerHTML = `
    <div class="section-icon ${iconClass}">${icon}</div>
    <div>
      <div class="section-title">${esc(title)}</div>
      <div class="section-desc">${esc(desc)}</div>
    </div>`;
  el.append(h);
}

// ── Inline data visuals (opt-in via config) ─────────────────────────────────
// Draw a real, accessible SVG histogram from authored interval/frequency data.
// Opt-in only: a lesson supplies `{ bars:[{label,value}], xLabel, yLabel,
// highlightIndex, title, caption }`. Lessons without this field are unaffected.
// Bars touch (no gaps) to match the definition of a histogram, the tallest (or
// highlighted) bar is tinted, and each bar shows its frequency on top.
function histogramSVG(cfg) {
  const bars = Array.isArray(cfg?.bars) ? cfg.bars : [];
  if (!bars.length) return "";
  const W = 520,
    H = 280,
    padL = 44,
    padR = 16,
    padT = 28,
    padB = 56;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const maxV = Math.max(...bars.map((b) => Number(b.value) || 0), 1);
  const bw = plotW / bars.length;
  const baseY = padT + plotH;
  let hi = Number.isInteger(cfg.highlightIndex) ? cfg.highlightIndex : -1;
  if (hi < 0) {
    // Default highlight = tallest bar so "the tallest bar" discourse lands.
    let m = -1;
    bars.forEach((b, i) => {
      if ((Number(b.value) || 0) > m) {
        m = Number(b.value) || 0;
        hi = i;
      }
    });
  }
  // Horizontal gridlines + y-axis ticks (one per unit up to a sane cap).
  const step = maxV <= 10 ? 1 : Math.ceil(maxV / 8);
  let grid = "";
  for (let v = 0; v <= maxV; v += step) {
    const y = baseY - (v / maxV) * plotH;
    grid += `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${(W - padR).toFixed(1)}" y2="${y.toFixed(1)}" stroke="rgba(0,0,0,0.08)" stroke-width="1"/>`;
    grid += `<text x="${padL - 6}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="var(--muted)">${v}</text>`;
  }
  const rects = bars
    .map((b, i) => {
      const v = Number(b.value) || 0;
      const h = (v / maxV) * plotH;
      const x = padL + i * bw;
      const y = baseY - h;
      const fill = i === hi ? "var(--coral, #d9795d)" : "var(--teal, #2a9d8f)";
      return (
        `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(bw - 1).toFixed(1)}" height="${h.toFixed(1)}" fill="${fill}" stroke="#fff" stroke-width="1"/>` +
        `<text x="${(x + bw / 2).toFixed(1)}" y="${(y - 6).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="700" fill="var(--navy, #264653)">${v}</text>` +
        `<text x="${(x + bw / 2).toFixed(1)}" y="${(baseY + 18).toFixed(1)}" text-anchor="middle" font-size="11" fill="var(--ink, #333)">${esc(b.label ?? "")}</text>`
      );
    })
    .join("");
  const xLabel = cfg.xLabel
    ? `<text x="${(padL + plotW / 2).toFixed(1)}" y="${H - 6}" text-anchor="middle" font-size="12" font-weight="600" fill="var(--muted)">${esc(cfg.xLabel)}</text>`
    : "";
  const yLabel = cfg.yLabel
    ? `<text x="14" y="${(padT + plotH / 2).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="600" fill="var(--muted)" transform="rotate(-90 14 ${(padT + plotH / 2).toFixed(1)})">${esc(cfg.yLabel)}</text>`
    : "";
  const axis = `<line x1="${padL}" y1="${baseY}" x2="${(W - padR).toFixed(1)}" y2="${baseY}" stroke="var(--ink,#333)" stroke-width="1.5"/>`;
  const title = cfg.title
    ? `<div style="font-weight:700; color:var(--navy,#264653); margin-bottom:var(--sp-2); text-align:center;">${esc(cfg.title)}</div>`
    : "";
  const caption = cfg.caption
    ? `<div style="font-size:0.82rem; color:var(--muted); margin-top:var(--sp-2); text-align:center; font-style:italic;">${esc(cfg.caption)}</div>`
    : "";
  return `<div class="histogram-figure" style="margin:var(--sp-3) 0;">${title}<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(cfg.title || "Histogram")}" style="width:100%; height:auto; max-width:560px; display:block; margin:0 auto;">${grid}${axis}${rects}${xLabel}${yLabel}</svg>${caption}</div>`;
}

// Render a styled "data display" for the Launch scenario so the I-notice /
// I-wonder routine has something concrete to observe. Opt-in via
// `launch.visual = { kind:"data-chips", title, values:[...], unit }`.
function renderLaunchVisual(host, visual) {
  if (!visual) return;
  if (visual.kind === "data-chips" && Array.isArray(visual.values)) {
    const card = document.createElement("div");
    card.style.cssText =
      "margin-top:var(--sp-4); padding:var(--sp-4); background:var(--cream,#fdf6ec); border:1px solid rgba(0,0,0,0.06); border-radius:var(--radius-md,12px);";
    const chips = visual.values
      .map(
        (v) =>
          `<span style="display:inline-flex; align-items:center; justify-content:center; min-width:34px; padding:4px 8px; background:#fff; border:1px solid rgba(42,157,143,0.4); border-radius:8px; font-weight:700; color:var(--navy,#264653); font-size:0.9rem;">${esc(v)}</span>`,
      )
      .join("");
    card.innerHTML =
      (visual.title
        ? `<div style="font-weight:700; color:var(--navy,#264653); margin-bottom:var(--sp-3); display:flex; align-items:center; gap:8px;"><span>📊</span><span>${esc(visual.title)}</span></div>`
        : "") +
      `<div style="display:flex; flex-wrap:wrap; gap:8px;">${chips}</div>` +
      (visual.unit
        ? `<div style="font-size:0.8rem; color:var(--muted); margin-top:var(--sp-2);">${esc(visual.unit)}</div>`
        : "");
    host.append(card);
  } else if (visual.kind === "histogram") {
    const wrap = document.createElement("div");
    wrap.innerHTML = histogramSVG(visual);
    host.append(wrap);
  }
}

// ── Turn & Talk (non-graded student discussion moments) ──────────────────────
// A reusable, visually distinct "🗣️ Turn & Talk" block. It is driven by an
// optional config field `config.turnAndTalk` (array of
// `{ phase, question, stems:[...] }`) but ALWAYS falls back to engine defaults
// so every lesson surfaces at least one discussion moment per supported phase.
// Turn & Talk never affects phase completion, scoring, stars, or XP — it is a
// purely formative prompt the student confirms with a "We talked! ✓" button.

// Bilingual sentence stems used when a lesson supplies none of its own.
const DEFAULT_TURN_TALK_STEMS = [
  { en: "I think ___ because ___.", es: "Pienso que ___ porque ___." },
  { en: "First I ___, then I ___.", es: "Primero ___, luego ___." },
  {
    en: "I agree / disagree because ___.",
    es: "Estoy de acuerdo / en desacuerdo porque ___.",
  },
];

// Build a generic, topic-aware prompt for a phase when the lesson has no
// authored turn-and-talk entry. Keeps language simple for English learners.
function defaultTurnTalkPrompt(phase, config) {
  const topic = config.title || "today's math";
  if (phase === "explore") {
    return {
      phase,
      question: `Turn and talk: explain your thinking about ${topic} to your partner.`,
      stems: DEFAULT_TURN_TALK_STEMS,
    };
  }
  return {
    phase,
    question: `Turn and talk: how does ${topic} connect to the real world or to what you already know?`,
    stems: DEFAULT_TURN_TALK_STEMS,
  };
}

// Resolve the turn-and-talk prompt for a given phase: prefer the authored
// config entry, otherwise return the engine default so the block always shows.
function resolveTurnTalk(phase, config) {
  const authored = Array.isArray(config.turnAndTalk)
    ? config.turnAndTalk.find((t) => t && t.phase === phase)
    : null;
  if (authored && authored.question) {
    // Normalize stems: accept ["..."] strings or {en, es} objects.
    const stems =
      Array.isArray(authored.stems) && authored.stems.length
        ? authored.stems.map((s) =>
            typeof s === "string"
              ? { en: s, es: "" }
              : { en: s.en || "", es: s.es || "" },
          )
        : DEFAULT_TURN_TALK_STEMS;
    // Surface the richer authored fields so the live lesson mirrors the notes:
    // a Level 1 "Start here" kernel + word bank, and a Level 2 extend prompt
    // with stretch stems. `listenFor` is intentionally omitted (teacher-only).
    const wordBank = Array.isArray(authored.wordBank)
      ? authored.wordBank.filter(Boolean)
      : [];
    const kernel =
      typeof authored.kernel === "string" ? authored.kernel.trim() : "";
    const extend =
      typeof authored.extend === "string" ? authored.extend.trim() : "";
    const extendStems = Array.isArray(authored.extendStems)
      ? authored.extendStems.filter(Boolean)
      : [];
    return {
      phase,
      question: authored.question,
      stems,
      kernel,
      wordBank,
      extend,
      extendStems,
    };
  }
  return defaultTurnTalkPrompt(phase, config);
}

let turnTalkSeq = 0;

// Render the Turn & Talk card into `host`. Calls `onDone` (if given) when the
// student confirms they talked. Fully keyboard- and screen-reader-accessible.
function renderTurnAndTalk(host, prompt, state, phaseId, onDone) {
  const uid = `tt-${phaseId}-${turnTalkSeq++}`;
  const respKey = `turntalk_${prompt.phase}`;
  const alreadyDone = state.getResponse(phaseId, respKey) === "done";

  const card = document.createElement("section");
  card.className = "card card-coral turn-talk";
  card.setAttribute("aria-labelledby", `${uid}-title`);
  card.style.cssText =
    "border:2px dashed var(--coral); background:rgba(217,121,93,0.06); margin-top:var(--sp-6);";

  const stemsHtml = prompt.stems
    .map(
      (s) => `
      <li class="sentence-frame" style="margin-bottom:var(--sp-2); list-style:none;">
        <span style="font-weight:700;">${esc(s.en)}</span>
        ${s.es ? `<span style="display:block; color:var(--muted); font-style:italic; font-weight:600;">${esc(s.es)}</span>` : ""}
      </li>`,
    )
    .join("");

  // Level 1 (support): a "Start here" kernel + a word-bank chip strip. Both are
  // optional — older configs without these fields simply render nothing here.
  const kernelHtml = prompt.kernel
    ? `<p style="margin:0 0 var(--sp-3); font-weight:600;"><span style="display:inline-block; font-weight:800; color:var(--coral); margin-right:var(--sp-2);">Start here:</span>${esc(prompt.kernel)}</p>`
    : "";
  const wordBankHtml =
    Array.isArray(prompt.wordBank) && prompt.wordBank.length
      ? `<div style="margin:0 0 var(--sp-3);">
      <span style="font-weight:700; margin-right:var(--sp-2);">Word bank:</span>
      <span style="display:inline-flex; flex-wrap:wrap; gap:var(--sp-2); vertical-align:middle;">${prompt.wordBank
        .map((w) => `<span class="badge badge-teal">${esc(w)}</span>`)
        .join("")}</span>
    </div>`
      : "";
  const supportHtml =
    kernelHtml || wordBankHtml || stemsHtml
      ? `<div style="border-left:4px solid var(--teal); padding-left:var(--sp-3); margin:0 0 var(--sp-4);">
      <span class="badge badge-teal" style="margin-bottom:var(--sp-2);">Level 1 support</span>
      ${kernelHtml}
      <p style="font-weight:700; margin:var(--sp-2) 0 var(--sp-2);">Use a sentence starter / <span style="font-style:italic;">Usa un inicio de oración</span>:</p>
      <ul style="margin:0 0 var(--sp-3); padding:0;">${stemsHtml}</ul>
      ${wordBankHtml}
    </div>`
      : "";

  // Level 2 (enrichment): a deeper "extend" push question + stretch stems.
  const extendStemsHtml =
    Array.isArray(prompt.extendStems) && prompt.extendStems.length
      ? `<ul style="margin:var(--sp-2) 0 0; padding-left:var(--sp-4);">${prompt.extendStems
          .map((s) => `<li style="margin-bottom:var(--sp-1);">${esc(s)}</li>`)
          .join("")}</ul>`
      : "";
  const extendHtml =
    prompt.extend || extendStemsHtml
      ? `<div style="border-left:4px solid var(--amber); padding-left:var(--sp-3); margin:0 0 var(--sp-3);">
      <span class="badge badge-amber" style="margin-bottom:var(--sp-2);">Level 2</span>
      ${prompt.extend ? `<p style="font-weight:700; margin:0;">${esc(prompt.extend)}</p>` : ""}
      ${extendStemsHtml}
    </div>`
      : "";

  card.innerHTML = `
    <div style="display:flex; align-items:center; gap:var(--sp-2); margin-bottom:var(--sp-2);">
      <span style="font-size:1.6rem;" aria-hidden="true">🗣️</span>
      <h4 id="${uid}-title" style="color:var(--coral); margin:0;">Turn &amp; Talk</h4>
    </div>
    <p style="font-weight:700; font-size:1.05rem; margin:0 0 var(--sp-3);">${esc(prompt.question)}</p>
    <div style="display:flex; flex-wrap:wrap; gap:var(--sp-2); margin-bottom:var(--sp-3);">
      <span class="badge badge-teal">🅰️ Partner A shares first</span>
      <span class="badge badge-amber">🅱️ Partner B goes next</span>
    </div>
    ${supportHtml}
    ${extendHtml}
  `;

  // Optional ~60s talk timer (low-friction, fully optional).
  const timerRow = document.createElement("div");
  timerRow.style.cssText =
    "display:flex; align-items:center; gap:var(--sp-3); flex-wrap:wrap; margin-bottom:var(--sp-3);";
  const timerBtn = document.createElement("button");
  timerBtn.type = "button";
  timerBtn.className = "btn btn-secondary";
  timerBtn.textContent = "⏱️ Start 60s timer";
  const timerLabel = document.createElement("span");
  timerLabel.setAttribute("role", "timer");
  timerLabel.setAttribute("aria-live", "polite");
  timerLabel.style.cssText = "font-weight:800; color:var(--coral);";
  let timerId = null;
  timerBtn.addEventListener("click", () => {
    if (timerId) return;
    let remaining = 60;
    timerLabel.textContent = `0:${String(remaining).padStart(2, "0")}`;
    timerBtn.disabled = true;
    timerBtn.style.opacity = "0.6";
    timerId = setInterval(() => {
      remaining--;
      timerLabel.textContent = `0:${String(Math.max(remaining, 0)).padStart(2, "0")}`;
      if (remaining <= 0) {
        clearInterval(timerId);
        timerId = null;
        timerLabel.textContent = "⏰ Time! Wrap up your ideas.";
        timerBtn.disabled = false;
        timerBtn.style.opacity = "1";
        timerBtn.textContent = "⏱️ Restart 60s timer";
      }
    }, 1000);
  });
  timerRow.append(timerBtn, timerLabel);
  card.append(timerRow);

  const confirmBtn = document.createElement("button");
  confirmBtn.type = "button";
  confirmBtn.className = "btn btn-primary";
  const markDone = () => {
    confirmBtn.textContent = "We talked! ✓";
    confirmBtn.classList.add("btn-success");
    confirmBtn.setAttribute("aria-pressed", "true");
    confirmBtn.disabled = true;
    state.saveResponse(phaseId, respKey, "done");
  };
  if (alreadyDone) {
    markDone();
  } else {
    confirmBtn.textContent = "We talked! ✓";
    confirmBtn.setAttribute("aria-pressed", "false");
    confirmBtn.addEventListener("click", () => {
      markDone();
      onDone?.();
    });
  }
  card.append(confirmBtn);

  host.append(card);
  return card;
}

async function completePhase(el, ctx, state, phaseIdx, name, correct, total) {
  const xp = ctx.engagement.awardXP(phaseIdx, { correct, total });
  const stars = state.get().phases[phaseIdx]?.stars ?? 0;
  await ctx.engagement.showPhaseComplete(el, name, xp, stars);
  ctx.navigateTo(phaseIdx + 1);
}

function renderComponent(container, problemDef, onAnswer) {
  switch (problemDef.type) {
    case "multiple-choice":
      renderMultipleChoice(container, { ...problemDef, onAnswer });
      break;
    case "drag-sort":
      if (problemDef.instructions) {
        const p = document.createElement("p");
        p.style.cssText = "font-weight:600; margin-bottom:var(--sp-3);";
        p.textContent = problemDef.instructions;
        container.append(p);
      }
      renderDragSort(container, {
        ...problemDef,
        onComplete: (c, t) => onAnswer?.(true),
      });
      break;
    case "error-analysis":
      renderErrorAnalysis(container, {
        ...problemDef,
        onAnswer: (ok) => onAnswer?.(ok),
      });
      break;
    case "fill-table":
      renderFillTable(container, {
        ...problemDef,
        onComplete: (c, t) => onAnswer?.(true),
      });
      break;
    case "number-line":
      renderNumberLine(container, {
        ...problemDef,
        onComplete: (c, t) => onAnswer?.(true),
      });
      break;
    case "coordinate-grid":
      renderCoordinateGrid(container, {
        ...problemDef,
        onComplete: (c, t) => onAnswer?.(true),
      });
      break;
    case "matching-game":
      renderMatchingGame(container, {
        ...problemDef,
        onComplete: (c, t) => onAnswer?.(true),
      });
      break;
    case "bar-model":
      renderBarModel(container, {
        ...problemDef,
        onComplete: (c, t) => onAnswer?.(true),
      });
      break;
    case "balance-scale":
      renderBalanceScale(container, {
        ...problemDef,
        onComplete: (c, t) => onAnswer?.(true),
      });
      break;
    case "algebra-tiles":
      renderAlgebraTiles(container, {
        ...problemDef,
        onComplete: (c) => onAnswer?.(c > 0),
      });
      break;
    case "fraction-bars":
      renderFractionBars(container, {
        ...problemDef,
        onComplete: (c) => onAnswer?.(c > 0),
      });
      break;
    case "net-folder":
      renderNetFolder(container, {
        ...problemDef,
        onComplete: (c) => onAnswer?.(c > 0),
      });
      break;
    case "coordinate-plane":
      renderCoordinatePlane(container, {
        ...problemDef,
        onComplete: (c, t) => onAnswer?.(true),
      });
      break;
    case "open-response":
      renderOpenResponse(container, {
        ...problemDef,
        onSubmit: (text, ok) => onAnswer?.(ok),
      });
      break;
    default:
      renderUnknownComponentFallback(container, problemDef);
      // Keep phase completion/scoring intact: an unhandled type must still let
      // the phase advance rather than stall waiting on a callback.
      onAnswer?.(true);
  }
}

// Readable, non-blank fallback for component types the renderer does not know.
// Shows instructions and any items/rows as text instead of rendering nothing.
function renderUnknownComponentFallback(container, def = {}) {
  const card = document.createElement("div");
  card.className = "card";

  const text = def.instructions || def.label || def.prompt || def.stem;
  if (text) {
    const p = document.createElement("p");
    p.style.cssText = "font-weight:600; margin-bottom:var(--sp-3);";
    p.textContent = text;
    card.append(p);
  }

  const source = Array.isArray(def.items)
    ? def.items
    : Array.isArray(def.rows)
      ? def.rows
      : [];
  const cols = Array.isArray(def.columns)
    ? def.columns
    : Array.isArray(def.headers)
      ? def.headers
      : [];

  if (source.length) {
    const list = document.createElement("ul");
    list.style.cssText = "margin:0; padding-left:1.2rem; line-height:1.6;";
    source.forEach((row) => {
      const li = document.createElement("li");
      if (row && typeof row === "object" && !Array.isArray(row)) {
        const keys = Object.keys(row);
        li.textContent = keys
          .map((k, i) => `${cols[i] || k}: ${row[k]}`)
          .join("  ·  ");
      } else if (Array.isArray(row)) {
        li.textContent = row
          .map((v, i) => `${cols[i] ? cols[i] + ": " : ""}${v}`)
          .join("  ·  ");
      } else {
        li.textContent = String(row);
      }
      list.append(li);
    });
    card.append(list);
  } else if (!text) {
    card.innerHTML = `<p class="feedback feedback-hint visible"><span>Content type "${esc(
      def.type,
    )}" is not yet interactive here.</span></p>`;
  }

  container.append(card);
}

// ── Phase 1: Launch ──
// Resolve the "I can ..." Content Objective with graceful fallbacks.
function resolveContentObjective(config) {
  if (config.contentObjective) return esc(config.contentObjective);
  // Fallbacks to any pre-existing objective field, prefixed with "I can ".
  const legacy =
    config.objective || (config.launch && config.launch.objective) || "";
  if (legacy) {
    const trimmed = String(legacy).trim();
    return /^i can\b/i.test(trimmed) ? esc(trimmed) : `I can ${esc(trimmed)}`;
  }
  // Last-resort friendly placeholder using the lesson topic.
  return `I can solve problems about ${esc(config.title || "this topic")}.`;
}

// Resolve the "I can ..." Language Objective with a friendly placeholder.
function resolveLanguageObjective(config) {
  if (config.languageObjective) return esc(config.languageObjective);
  return `I can talk and write about ${esc(
    config.title || "this topic",
  )} using math words.`;
}

// Top-of-launch block: Name/Period fields, objectives, and Homework download.
// Pre-lesson materials (Get Ready / Notes) now live as their own sidebar tabs
// under "Before the lesson" — see app.js preLessonNavHtml / openExtra.
function renderLaunchHeader(el, state, config) {
  const s = state.get();
  const homeworkHref = `/lessons/${encodeURIComponent(config.lessonId)}/homework.docx`;

  const block = document.createElement("div");
  block.className = "card launch-intro";
  block.innerHTML = `
    ${
      config.readiness
        ? `<div class="launch-prelesson-hint" style="display:flex; align-items:center; gap:var(--sp-3); background:var(--cream, #fdf3e0); border:1px solid var(--gold, #d4952a); border-radius:var(--radius-md, 12px); padding:var(--sp-3, 14px) var(--sp-4, 18px); margin-bottom:var(--sp-4, 18px);">
            <span style="font-size:1.6rem;">📚</span>
            <span>New to this skill? Open <strong>Get Ready</strong> and <strong>Notes</strong> under <em>Before the lesson</em> in the sidebar first — they're quick and not graded.</span>
          </div>`
        : ""
    }
    <div class="launch-identity" style="display:flex; flex-wrap:wrap; gap:var(--sp-3); align-items:flex-end; margin-bottom:var(--sp-4);">
      <div class="launch-field" style="flex:1 1 220px;">
        <label for="launch-name" style="display:block; font-weight:600; margin-bottom:var(--sp-1);">Name</label>
        <input id="launch-name" class="text-input" type="text"
          placeholder="First name Last initial" autocomplete="off"
          value="${esc(s.studentName || "")}" />
      </div>
      <div class="launch-field launch-field-period" style="flex:0 1 120px;">
        <label for="launch-period" style="display:block; font-weight:600; margin-bottom:var(--sp-1);">Period</label>
        <input id="launch-period" class="text-input" type="text"
          placeholder="e.g. 3" autocomplete="off"
          value="${esc(s.studentPeriod || "")}" />
      </div>
      <a class="btn btn-secondary launch-homework-link" href="${homeworkHref}"
        download>📄 Homework (Word doc)</a>
    </div>
    <div class="launch-objectives grid-2">
      <div class="card card-teal launch-objective">
        <h4 style="color:var(--teal); margin-bottom:var(--sp-2);">Content Objective</h4>
        <p style="margin:0; font-weight:600;">${resolveContentObjective(config)}</p>
      </div>
      <div class="card card-coral launch-objective">
        <h4 style="color:var(--coral); margin-bottom:var(--sp-2);">Language Objective</h4>
        <p style="margin:0; font-weight:600;">${resolveLanguageObjective(config)}</p>
      </div>
    </div>
  `;
  el.append(block);

  const nameInput = block.querySelector("#launch-name");
  const periodInput = block.querySelector("#launch-period");
  nameInput.addEventListener("change", () => {
    const name = nameInput.value.trim();
    if (name) state.set({ studentName: name });
  });
  periodInput.addEventListener("change", () => {
    state.set({ studentPeriod: periodInput.value.trim() });
  });
}

function renderLaunchPhase(el, state, ctx, config) {
  const cfg = config.launch;

  renderLaunchHeader(el, state, config);

  phaseHeader(
    el,
    "🚀",
    "section-icon-amber",
    "Launch",
    "Read the scenario. What do you notice? What do you wonder?",
  );

  const scenario = document.createElement("div");
  scenario.className = "card";
  scenario.innerHTML = `
    <div class="badge badge-amber mb-4">${esc(cfg.badge || config.title)}</div>
    <p style="font-size:1.1rem; line-height:1.65; margin:0;">${esc(cfg.narrative)}</p>
    ${cfg.contextImage ? `<div style="margin-top:var(--sp-4); padding:var(--sp-4); background:var(--cream); border-radius:var(--radius-md); text-align:center; color:var(--muted); font-style:italic;">🎨 ${esc(cfg.contextImage)}</div>` : ""}
  `;
  el.append(scenario);

  // Opt-in concrete data visual so "I notice / I wonder" has something to see.
  renderLaunchVisual(el, cfg.visual);

  const grid = document.createElement("div");
  grid.className = "grid-2";

  const noticeCard = document.createElement("div");
  noticeCard.className = "card card-teal";
  noticeCard.innerHTML = `<h4 style="color:var(--teal); margin-bottom:var(--sp-3);">👀 I Notice...</h4>
    ${(cfg.noticePrompts || []).map((p) => `<div class="sentence-frame" style="margin-bottom:var(--sp-2);"><span style="font-weight:600;">${esc(p)}</span></div>`).join("")}`;
  const noticeTA = document.createElement("textarea");
  noticeTA.className = "text-input";
  noticeTA.rows = 3;
  noticeTA.placeholder = "I notice that...";
  noticeTA.value = state.getResponse(0, "notice") || "";
  noticeTA.addEventListener("input", () =>
    state.saveResponse(0, "notice", noticeTA.value),
  );
  noticeCard.append(noticeTA);

  const wonderCard = document.createElement("div");
  wonderCard.className = "card card-coral";
  wonderCard.innerHTML = `<h4 style="color:var(--coral); margin-bottom:var(--sp-3);">🤔 I Wonder...</h4>
    ${(cfg.wonderPrompts || []).map((p) => `<div class="sentence-frame" style="margin-bottom:var(--sp-2); border-color:rgba(217,121,93,0.25); background:rgba(217,121,93,0.06);"><span style="font-weight:600;">${esc(p)}</span></div>`).join("")}`;
  const wonderTA = document.createElement("textarea");
  wonderTA.className = "text-input";
  wonderTA.rows = 3;
  wonderTA.placeholder = "I wonder if...";
  wonderTA.value = state.getResponse(0, "wonder") || "";
  wonderTA.addEventListener("input", () =>
    state.saveResponse(0, "wonder", wonderTA.value),
  );
  wonderCard.append(wonderTA);

  grid.append(noticeCard, wonderCard);
  el.append(grid);

  const btn = document.createElement("button");
  btn.className = "btn btn-primary btn-lg mt-6";
  btn.textContent = "Continue to Vocabulary →";
  btn.addEventListener("click", async () => {
    if (noticeTA.value.trim().length < 5 || wonderTA.value.trim().length < 5) {
      let fb = el.querySelector(".launch-fb");
      if (!fb) {
        fb = ctx.engagement.createFeedback(
          "hint",
          "Write at least a short response in both boxes.",
        );
        fb.classList.add("launch-fb");
        el.append(fb);
      }
      return;
    }
    el.querySelector(".launch-fb")?.remove();
    await completePhase(el, ctx, state, 0, "Launch", 1, 1);
  });
  el.append(btn);
}

// ── Phase 2: Vocabulary (multi-activity sequence) ──
function renderVocabPhase(el, state, ctx, config) {
  const activities = resolveVocabActivities(config);
  let actIdx = 0;
  let totalCorrect = 0;
  let totalPossible = 0;

  function renderNextActivity() {
    if (actIdx >= activities.length) {
      const stars =
        totalPossible === 0
          ? 3
          : totalCorrect / totalPossible >= 0.8
            ? 3
            : totalCorrect / totalPossible >= 0.5
              ? 2
              : 1;
      setTimeout(
        async () =>
          await completePhase(el, ctx, state, 1, "Vocab Builder", stars, 3),
        400,
      );
      return;
    }

    const activity = activities[actIdx];
    el.innerHTML = "";

    const stepLabel = document.createElement("div");
    stepLabel.style.cssText =
      "font-size:0.78rem; font-weight:800; text-transform:uppercase; letter-spacing:0.06em; color:var(--muted); margin-bottom:var(--sp-3);";
    stepLabel.textContent =
      activity === "intro"
        ? "Vocabulary — Study the Words"
        : `Vocabulary — Activity ${actIdx} of ${activities.length - 1}`;
    el.append(stepLabel);

    const onDone = (correct, total) => {
      totalCorrect += correct;
      totalPossible += total;
      actIdx++;
      renderNextActivity();
    };

    switch (activity) {
      case "intro":
        renderVocabIntro(el, {
          terms: config.vocabulary,
          onComplete: onDone,
        });
        break;
      case "builder":
        renderVocabBuilder(el, {
          terms: config.vocabulary,
          onComplete: onDone,
        });
        break;
      case "matching":
        phaseHeader(
          el,
          "📖",
          "section-icon-amber",
          "Memory Match",
          "Flip cards to find matching pairs!",
        );
        renderMatchingGame(el, {
          pairs: config.vocabulary.map((v) => ({
            term: v.term,
            match: v.definition,
          })),
          columns: Math.min(4, config.vocabulary.length),
          onComplete(matched, attempts) {
            const pct = matched / attempts;
            onDone(pct >= 0.7 ? 3 : pct >= 0.4 ? 2 : 1, 3);
          },
        });
        break;
      case "drag-match":
        renderVocabDragMatch(el, {
          terms: config.vocabulary,
          onComplete: onDone,
        });
        break;
      case "cloze":
        renderVocabCloze(el, { terms: config.vocabulary, onComplete: onDone });
        break;
      case "sort":
        renderVocabSort(el, { terms: config.vocabulary, onComplete: onDone });
        break;
      default:
        renderVocabBuilder(el, {
          terms: config.vocabulary,
          onComplete: onDone,
        });
    }
  }

  renderNextActivity();
}

function resolveVocabActivities(config) {
  if (config.vocabActivities && config.vocabActivities.length) {
    const acts = config.vocabActivities;
    return acts[0] === "intro" ? acts : ["intro", ...acts];
  }
  if (config.vocabMode === "matching") return ["intro", "drag-match", "cloze"];
  return ["intro", "builder", "drag-match"];
}

// ── Phase 3: Explore ──
function renderExplorePhase(el, state, ctx, config) {
  const cfg = config.explore;
  phaseHeader(
    el,
    "🔍",
    "section-icon-teal",
    "Explore",
    cfg.instructions || "Investigate the concept with an interactive tool.",
  );

  // Opt-in data diagram (e.g. a histogram) shown up front so students can SEE
  // and read the visual while they work the interaction below it.
  if (cfg.histogram) {
    const figCard = document.createElement("div");
    figCard.className = "card";
    figCard.innerHTML = histogramSVG(cfg.histogram);
    el.append(figCard);
  }

  // Surface a Turn & Talk discussion moment after the Explore interaction.
  // It is non-graded: confirming it advances the phase. A "Skip / Continue"
  // affordance is built into the button flow so it never blocks progress.
  const showTurnTalkThenComplete = () => {
    renderTurnAndTalk(el, resolveTurnTalk("explore", config), state, 2, () => {
      completePhase(el, ctx, state, 2, "Explore", 1, 1);
    });
    const cont = document.createElement("button");
    cont.type = "button";
    cont.className = "btn btn-primary btn-lg mt-4";
    cont.textContent = "Continue to Practice →";
    cont.addEventListener("click", () =>
      completePhase(el, ctx, state, 2, "Explore", 1, 1),
    );
    el.append(cont);
  };

  renderComponent(el, cfg, () => {
    if (cfg.discourse) {
      const disc = document.createElement("div");
      disc.className = "card card-teal mt-6";
      disc.innerHTML = `<h4 style="color:var(--teal); margin-bottom:var(--sp-3);">💬 Discuss</h4>`;
      renderOpenResponse(disc, {
        prompt: cfg.discourse.prompt,
        sentenceFrame: cfg.discourse.sentenceFrame,
        keywords: cfg.discourse.keywords,
        minLength: 20,
        onSubmit() {
          showTurnTalkThenComplete();
        },
      });
      el.append(disc);
    } else {
      showTurnTalkThenComplete();
    }
  });
}

// ── Phase 4: Practice (adaptive) ──
const TIER_LABELS = {
  level1: { name: "Level 1", badge: "badge-teal" },
  core: { name: "On Level", badge: "badge-amber" },
  level2: { name: "Level 2", badge: "badge-navy" },
};

function renderPracticePhase(el, state, ctx, config) {
  phaseHeader(
    el,
    "✏️",
    "section-icon-navy",
    "Practice",
    "Problems adapt to how you're doing — keep going!",
  );

  // Non-stigmatizing Level 1 / Level 2 / Adaptive selector.
  const selectorSlot = document.createElement("div");
  el.append(selectorSlot);
  mountLevelSelector(selectorSlot, state);

  const tierBadge = document.createElement("div");
  tierBadge.className = "badge badge-amber mb-4";
  el.append(tierBadge);

  const area = document.createElement("div");
  el.append(area);

  const seq = createAdaptiveSequence(config, state);
  let totalCorrect = 0,
    totalAttempts = 0,
    shown = 0;

  function finishPractice() {
    area.innerHTML = "";
    completePhase(el, ctx, state, 3, "Practice", totalCorrect, totalAttempts);
  }

  // Run the ungraded optional items through the shared component loop, then
  // finish. Correctness is intentionally ignored — these never affect scoring.
  function runOptionalPractice(host, items, done) {
    let i = 0;
    function step() {
      if (i >= items.length) {
        done();
        return;
      }
      host.innerHTML = "";
      const label = document.createElement("div");
      label.style.cssText =
        "font-size:0.82rem; font-weight:700; color:var(--muted); margin-bottom:var(--sp-3);";
      label.textContent = `Extra Practice ${i + 1} of ${items.length} · optional`;
      host.append(label);
      const slot = document.createElement("div");
      host.append(slot);
      renderComponent(slot, items[i], () => {
        i++;
        setTimeout(step, 800);
      });
    }
    step();
  }

  function next() {
    const prob = seq.nextProblem(levelOverride(state));
    if (!prob) {
      area.innerHTML = "";
      // Optional, ungraded Extra Practice opt-in. Does not touch scoring,
      // stars, or adaptive logic. Lessons without practice.optional finish
      // exactly as before.
      const optional = config.practice?.optional;
      if (optional?.length) {
        tierBadge.textContent = "";
        tierBadge.className = "";
        renderOptionalPracticeOptIn(area, {
          onSkip: finishPractice,
          onTry: () => runOptionalPractice(area, optional, finishPractice),
        });
        return;
      }
      finishPractice();
      return;
    }
    shown++;
    const tl = TIER_LABELS[prob.tier] || TIER_LABELS.core;
    tierBadge.className = `badge ${tl.badge} mb-4`;
    tierBadge.textContent = tl.name;

    area.innerHTML = "";
    const counter = document.createElement("div");
    counter.style.cssText =
      "font-size:0.82rem; font-weight:700; color:var(--muted); margin-bottom:var(--sp-3);";
    counter.textContent = `Problem ${shown} of ${seq.total}`;
    area.append(counter);

    // Level 1 items get an always-visible scaffold hint. Uses an authored
    // scaffold/hint when present, otherwise derives a short, type-aware,
    // non-answer-giving nudge so every support item is scaffolded.
    if (prob.tier === "level1") {
      const scaffoldText = deriveScaffold(prob);
      if (scaffoldText) {
        const hint = document.createElement("div");
        hint.className = "feedback feedback-hint visible";
        hint.innerHTML = `<span class="feedback-icon">💡</span><span>${esc(scaffoldText)}</span>`;
        area.append(hint);
      }
    }

    renderComponent(area, prob, (isCorrect) => {
      totalAttempts++;
      if (isCorrect) {
        totalCorrect++;
        const result = ctx.engagement.recordCorrect(null);
        if (result.streakMessage) {
          const toast = document.createElement("div");
          toast.className = "feedback feedback-success visible";
          toast.style.animation = "feedbackIn 0.3s var(--ease-spring)";
          toast.innerHTML = `<span class="feedback-icon">✓</span><span>${result.message} ${result.streakMessage}</span>`;
          area.append(toast);
        }
        setTimeout(() => next(), 1500);
      } else {
        ctx.engagement.recordIncorrect(null);
        // Run the scaffolded remediation sequence (hint -> worked example ->
        // guided steps -> easier retry) before advancing. The flow also biases
        // the adaptive tier toward Level 1 on repeated misses via state hooks.
        const remSlot = document.createElement("div");
        remSlot.className = "mt-4";
        area.append(remSlot);
        renderRemediation(remSlot, {
          question: prob,
          state,
          level: prob.tier,
          onComplete() {
            setTimeout(() => next(), 600);
          },
        });
      }
    });
  }
  next();
}

// ── Phase 5: Connect ──
function renderConnectPhase(el, state, ctx, config) {
  const cfg = config.connect;
  phaseHeader(
    el,
    "🌎",
    "section-icon-teal",
    "Real-World Connection",
    "Where does this math live in the wild?",
  );

  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `<div class="badge badge-amber mb-4">Math in the Wild</div><p style="font-size:1.05rem; line-height:1.6; margin:0;">${esc(cfg.scenario)}</p>`;
  if (cfg.histogram) card.innerHTML += histogramSVG(cfg.histogram);
  el.append(card);

  // Turn & Talk primes the written response below. Non-graded; does not gate
  // the Connect submit, so phase completion/scoring are unaffected.
  renderTurnAndTalk(el, resolveTurnTalk("connect", config), state, 4);

  // The Writing Revolution (TWR) writing step. Auto-derived from config; shows
  // on every lesson. Formative only — persisted but never gates phase scoring.
  renderTwrWriting(el, config, {
    getResponse: (key) => state.getResponse(4, key),
    saveResponse: (key, val) => state.saveResponse(4, key, val),
  });

  // Editable response box (core-owned), mirroring Launch/Reflect persistence.
  const minLength = 25;
  const promptText =
    cfg.promptQuestion || "How does this connect to what we learned?";

  const respCard = document.createElement("div");
  respCard.className = "card card-teal";

  const fieldId = "connect-response";

  const label = document.createElement("label");
  label.setAttribute("for", fieldId);
  label.style.cssText =
    "display:block; font-size:1rem; font-weight:600; margin:0 0 var(--sp-3); line-height:1.5;";
  label.textContent = promptText;
  respCard.append(label);

  if (cfg.prompt) {
    const frame = document.createElement("div");
    frame.className = "sentence-frame";
    frame.innerHTML = String(cfg.prompt).replace(
      /___/g,
      '<span class="blank">&nbsp;</span>',
    );
    respCard.append(frame);
  }

  const textarea = document.createElement("textarea");
  textarea.id = fieldId;
  textarea.className = "text-input";
  textarea.rows = 4;
  textarea.placeholder = "Type your response here...";
  textarea.setAttribute("aria-label", promptText);
  textarea.value = state.getResponse(4, "connect") || "";
  respCard.append(textarea);

  const charCount = document.createElement("div");
  charCount.style.cssText =
    "font-size:0.78rem; color:var(--muted); margin-top:var(--sp-1); text-align:right;";
  const updateCount = () => {
    const len = textarea.value.trim().length;
    charCount.textContent = `${len} / ${minLength} characters minimum`;
    charCount.style.color =
      len >= minLength ? "var(--success)" : "var(--muted)";
  };
  updateCount();
  respCard.append(charCount);

  // Persist on every keystroke and restore on reload.
  textarea.addEventListener("input", () => {
    state.saveResponse(4, "connect", textarea.value);
    updateCount();
  });

  const feedbackSlot = document.createElement("div");
  feedbackSlot.className = "mt-4";
  respCard.append(feedbackSlot);

  const submitBtn = document.createElement("button");
  submitBtn.className = "btn btn-primary mt-4";
  submitBtn.textContent = "Submit Response";

  let submitted = false;

  const showFeedback = (type, message) => {
    feedbackSlot.innerHTML = "";
    const fb = document.createElement("div");
    fb.className = `feedback feedback-${type} visible`;
    fb.setAttribute("role", "alert");
    fb.innerHTML = `<span class="feedback-icon">${
      type === "success" ? "✓" : "💡"
    }</span><span>${esc(message)}</span>`;
    feedbackSlot.append(fb);
  };

  submitBtn.addEventListener("click", () => {
    if (submitted) return;
    const text = textarea.value.trim();

    if (text.length < minLength) {
      showFeedback(
        "hint",
        `Write at least ${minLength} characters. You have ${text.length}.`,
      );
      return;
    }

    let valid = true;
    if (cfg.keywords && cfg.keywords.length > 0) {
      const lower = text.toLowerCase();
      const found = cfg.keywords.filter((kw) =>
        lower.includes(String(kw).toLowerCase()),
      );
      if (found.length === 0) {
        showFeedback(
          "hint",
          `Try using math vocabulary in your response. Think about: ${cfg.keywords
            .slice(0, 3)
            .join(", ")}.`,
        );
        return;
      }
      const missing = cfg.keywords.length - found.length;
      valid = missing <= Math.ceil(cfg.keywords.length / 2);
    }

    submitted = true;
    state.saveResponse(4, "connect", textarea.value);
    textarea.readOnly = true;
    submitBtn.style.display = "none";
    showFeedback("success", "Great response! Your thinking is recorded.");
    completePhase(el, ctx, state, 4, "Connect", valid ? 1 : 0, 1);
  });

  respCard.append(submitBtn);
  el.append(respCard);
}

// ── Phase 6: Reflect ──
function renderReflectPhase(el, state, ctx, config) {
  const cfg = config.reflect;
  phaseHeader(
    el,
    "💡",
    "section-icon-coral",
    "Reflect",
    "Look back at what you learned and show what you know.",
  );

  // 3-2-1
  const rCard = document.createElement("div");
  rCard.className = "card";
  rCard.innerHTML = '<div class="badge badge-teal mb-4">3-2-1 Reflection</div>';
  [
    { n: 3, color: "teal", label: "things I learned", icon: "📝" },
    { n: 2, color: "amber", label: "connections I made", icon: "🔗" },
    { n: 1, color: "coral", label: "question I still have", icon: "❓" },
  ].forEach((r) => {
    const row = document.createElement("div");
    row.style.cssText =
      "display:grid; grid-template-columns:auto 1fr; gap:var(--sp-3); align-items:start; margin-bottom:var(--sp-3);";
    row.innerHTML = `<span class="badge badge-${r.color}">${r.icon} ${r.n}</span>`;
    const ta = document.createElement("textarea");
    ta.className = "text-input";
    ta.rows = r.n > 1 ? 2 : 1;
    ta.placeholder = `${r.n} ${r.label}...`;
    ta.value = state.getResponse(5, `reflect_${r.n}`) || "";
    ta.addEventListener("input", () =>
      state.saveResponse(5, `reflect_${r.n}`, ta.value),
    );
    row.append(ta);
    rCard.append(row);
  });
  el.append(rCard);

  // Self-assess
  const selfCard = document.createElement("div");
  selfCard.className = "card card-teal";
  selfCard.innerHTML = `
    <h4 style="color:var(--teal); margin-bottom:var(--sp-3);">How do you feel about ${esc(config.title)}?</h4>
    <div style="display:flex; gap:var(--sp-3); justify-content:center;">
      ${["😊 Got it!|3", "🤔 Almost|2", "😅 Need help|1"]
        .map((s) => {
          const [txt, lv] = s.split("|");
          return `<button class="btn btn-secondary self-assess" data-level="${lv}" style="flex:1; max-width:160px;">${txt}</button>`;
        })
        .join("")}
    </div>`;
  selfCard.querySelectorAll(".self-assess").forEach((btn) => {
    btn.addEventListener("click", () => {
      selfCard.querySelectorAll(".self-assess").forEach((b) => {
        b.style.borderColor = "var(--line)";
        b.style.background = "white";
      });
      btn.style.borderColor = "var(--teal)";
      btn.style.background = "var(--teal-light)";
      state.saveResponse(5, "self-assess", btn.dataset.level);
    });
  });
  el.append(selfCard);

  // Exit ticket
  phaseHeader(
    el,
    "🎯",
    "section-icon-navy",
    "Exit Ticket",
    "Show what you know!",
  );
  renderMultipleChoice(el, {
    ...cfg.exitTicket,
    onAnswer(isCorrect) {
      setTimeout(async () => {
        const xp = ctx.engagement.awardXP(5, {
          correct: isCorrect ? 1 : 0,
          total: 1,
        });
        const stars = state.get().phases[5]?.stars ?? 0;
        await ctx.engagement.showPhaseComplete(el, "Reflect", xp, stars);
        showFinalSummary(el, state, config);
      }, 1000);
    },
  });
}

// End-of-lesson objective self-review ("Did I get it?"). Reuses the same
// objective resolvers as the launch header so the text matches exactly.
function renderObjectiveReview(state, config) {
  const card = document.createElement("section");
  card.className = "card card-teal objective-review";
  card.setAttribute("aria-labelledby", "obj-review-title");
  card.style.cssText = "text-align:left; margin-top:var(--sp-6);";

  const items = [
    {
      key: "review_content",
      label: "Content Objective",
      // resolveContentObjective returns HTML-escaped text; show as text node.
      html: resolveContentObjective(config),
    },
    {
      key: "review_language",
      label: "Language Objective",
      html: resolveLanguageObjective(config),
    },
  ];

  card.innerHTML = `
    <h4 id="obj-review-title" style="color:var(--teal); margin-bottom:var(--sp-2);">✅ Did I get it?</h4>
    <p style="color:var(--muted); margin:0 0 var(--sp-4); font-size:0.92rem;">Check off each goal you can do. Be honest — it helps you know what to practice!</p>
  `;

  items.forEach((item) => {
    const checked = state.getResponse(5, item.key) === "yes";
    const row = document.createElement("label");
    row.style.cssText =
      "display:flex; align-items:flex-start; gap:var(--sp-3); padding:var(--sp-3); background:white; border-radius:var(--radius-sm); margin-bottom:var(--sp-3); cursor:pointer; border:1px solid var(--line);";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = checked;
    cb.style.cssText =
      "width:1.4rem; height:1.4rem; margin-top:2px; flex:0 0 auto; cursor:pointer;";
    cb.setAttribute("aria-label", `I can do this — ${item.label}`);

    const text = document.createElement("div");
    text.innerHTML = `
      <div style="font-size:0.78rem; font-weight:800; text-transform:uppercase; letter-spacing:0.04em; color:var(--teal); margin-bottom:2px;">${item.label}</div>
      <div style="font-weight:600;">${item.html}</div>
    `;

    cb.addEventListener("change", () => {
      state.saveResponse(5, item.key, cb.checked ? "yes" : "no");
      row.style.borderColor = cb.checked ? "var(--teal)" : "var(--line)";
      row.style.background = cb.checked ? "var(--teal-light)" : "white";
    });
    if (checked) {
      row.style.borderColor = "var(--teal)";
      row.style.background = "var(--teal-light)";
    }

    row.append(cb, text);
    card.append(row);
  });

  return card;
}

function showFinalSummary(el, state, config) {
  el.innerHTML = "";
  const s = state.get();
  const totalStars = s.phases.reduce((sum, p) => sum + p.stars, 0);
  const pct = totalStars / 18;
  const grade =
    pct >= 0.9
      ? "🏆 Outstanding!"
      : pct >= 0.7
        ? "⭐ Great Job!"
        : pct >= 0.5
          ? "👍 Good Effort!"
          : "💪 Keep Practicing!";
  const streakLine =
    s.bestStreak >= 3
      ? `<div style="margin-top:var(--sp-3); font-size:0.95rem; color:var(--coral); font-weight:700;">🔥 Best streak: ${s.bestStreak} in a row</div>`
      : "";
  const accuracy =
    s.totalAttempts > 0
      ? Math.round((s.totalCorrect / s.totalAttempts) * 100)
      : 100;
  const paceBadge =
    s.totalAttempts > 0 && s.totalCorrect / s.totalAttempts >= 0.85
      ? "🎯 Sharpshooter"
      : s.totalAttempts >= 8
        ? "🧠 Deep Thinker"
        : "";

  const summary = document.createElement("div");
  summary.className = "card text-center";
  summary.style.animation = "phaseIn 0.5s var(--ease-out)";
  summary.innerHTML = `
    <div class="badge badge-amber" style="font-size:0.9rem; padding:8px 20px; margin-bottom:var(--sp-5);">🎉 Activity Complete!</div>
    <h2 style="margin-bottom:var(--sp-2);">${esc(config.title)}</h2>
    <p style="color:var(--muted); margin-bottom:var(--sp-2);">${grade}</p>
    <p style="color:var(--muted); margin-bottom:var(--sp-5); font-size:0.92rem;">Great work, ${esc(s.studentName || "mathematician")}!</p>
    <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:var(--sp-4); max-width:560px; margin:0 auto var(--sp-6);">
      <div><div class="xp-counter" style="font-size:2rem; font-weight:900; color:var(--amber);">0</div><div style="font-size:0.78rem; font-weight:700; color:var(--muted);">Total XP</div></div>
      <div><div style="font-size:2rem; font-weight:900; color:var(--amber);">${totalStars}/18</div><div style="font-size:0.78rem; font-weight:700; color:var(--muted);">Stars</div></div>
      <div><div style="font-size:2rem; font-weight:900; color:var(--teal);">${accuracy}%</div><div style="font-size:0.78rem; font-weight:700; color:var(--muted);">Accuracy</div></div>
      <div><div style="font-size:2rem; font-weight:900; color:var(--success);">6/6</div><div style="font-size:0.78rem; font-weight:700; color:var(--muted);">Phases</div></div>
    </div>
    ${streakLine}
    ${paceBadge ? `<div style="margin-top:var(--sp-2); font-size:0.88rem; color:var(--teal); font-weight:700;">${paceBadge}</div>` : ""}
    <div style="display:flex; flex-direction:column; gap:var(--sp-2); max-width:400px; margin:var(--sp-5) auto 0;">
      ${s.phases.map((p) => `<div style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:var(--cream); border-radius:var(--radius-sm);"><span style="font-weight:700; font-size:0.9rem;">${esc(p.name)}</span><span style="color:var(--amber);">${"★".repeat(p.stars)}${"☆".repeat(3 - p.stars)}</span></div>`).join("")}
    </div>
    <p style="margin-top:var(--sp-6); color:var(--muted); font-size:0.85rem;">Neft Teacher · ${esc(config.standard)} · ${new Date().toLocaleDateString()}</p>`;
  el.append(summary);

  // "Did I get it?" objective self-review. Re-shows the same Content + Language
  // objectives from the launch header, each with a checkbox the student ticks
  // to self-assess. Checks persist to state (localStorage). No new config —
  // reuses the existing objective fields and the launch-header fallbacks.
  el.append(renderObjectiveReview(state, config));

  // Auto-grade + save/export (additive; does not affect scoring above).
  // Grades the student, persists to the localStorage gradebook, and offers
  // CSV/JSON/Print exports for the teacher. Local-first only — no network.
  try {
    el.append(buildGradeCard(state, config));
  } catch (_) {
    /* grading/export must never break the completion screen */
  }

  // Optional "Choose an Activity" menu — surfaced at completion on every
  // lesson. Auto-populated from existing lesson data (vocab terms +
  // optional practice); everything here is ungraded and does not affect
  // the summary above. Renders nothing if the lesson has no eligible
  // activities.
  const chooserSlot = document.createElement("div");
  chooserSlot.style.cssText = "margin-top:var(--sp-6);";
  renderActivityChooser(chooserSlot, { config, renderComponent });
  if (chooserSlot.childNodes.length) el.append(chooserSlot);

  const counterEl = summary.querySelector(".xp-counter");
  if (counterEl && s.xp > 0) {
    let current = 0;
    const step = Math.max(1, Math.ceil(s.xp / 30));
    const interval = setInterval(() => {
      current = Math.min(current + step, s.xp);
      counterEl.textContent = current;
      if (current >= s.xp) clearInterval(interval);
    }, 30);
  }
}

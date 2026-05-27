import { createApp } from "./app.js";
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
} from "../components/index.js";

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
    case "open-response":
      renderOpenResponse(container, {
        ...problemDef,
        onSubmit: (text, ok) => onAnswer?.(ok),
      });
      break;
    default:
      container.innerHTML += `<p class="feedback feedback-hint visible"><span>Unknown component: ${problemDef.type}</span></p>`;
  }
}

// ── Phase 1: Launch ──
function renderLaunchPhase(el, state, ctx, config) {
  const cfg = config.launch;
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
    stepLabel.textContent = `Vocabulary — Activity ${actIdx + 1} of ${activities.length}`;
    el.append(stepLabel);

    const onDone = (correct, total) => {
      totalCorrect += correct;
      totalPossible += total;
      actIdx++;
      renderNextActivity();
    };

    switch (activity) {
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
    return config.vocabActivities;
  }
  if (config.vocabMode === "matching") return ["matching", "cloze"];
  return ["builder", "drag-match"];
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
          completePhase(el, ctx, state, 2, "Explore", 1, 1);
        },
      });
      el.append(disc);
    } else {
      completePhase(el, ctx, state, 2, "Explore", 1, 1);
    }
  });
}

// ── Phase 4: Practice ──
function renderPracticePhase(el, state, ctx, config) {
  phaseHeader(
    el,
    "✏️",
    "section-icon-navy",
    "Practice",
    "Work through problems at your level.",
  );

  const tierNames = ["Approaching", "On Level", "Extending"];
  const tierBadgeClasses = ["badge-teal", "badge-amber", "badge-navy"];
  const allProblems = [];
  ["approaching", "onLevel", "extending"].forEach((tier, ti) => {
    (config.practice[tier] || []).forEach((p) =>
      allProblems.push({ ...p, tierIdx: ti }),
    );
  });

  const tierBadge = document.createElement("div");
  tierBadge.className = `badge ${tierBadgeClasses[0]} mb-4`;
  tierBadge.textContent = `Tier 1: ${tierNames[0]}`;
  el.append(tierBadge);

  const area = document.createElement("div");
  el.append(area);

  let idx = 0,
    totalCorrect = 0,
    totalAttempts = 0;

  function next() {
    if (idx >= allProblems.length) {
      area.innerHTML = "";
      completePhase(el, ctx, state, 3, "Practice", totalCorrect, totalAttempts);
      return;
    }
    const prob = allProblems[idx];
    tierBadge.className = `badge ${tierBadgeClasses[prob.tierIdx]} mb-4`;
    tierBadge.textContent = `Tier ${prob.tierIdx + 1}: ${tierNames[prob.tierIdx]}`;

    area.innerHTML = "";
    const counter = document.createElement("div");
    counter.style.cssText =
      "font-size:0.82rem; font-weight:700; color:var(--muted); margin-bottom:var(--sp-3);";
    counter.textContent = `Problem ${idx + 1} of ${allProblems.length}`;
    area.append(counter);

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
      } else {
        ctx.engagement.recordIncorrect(null);
      }
      setTimeout(() => {
        idx++;
        next();
      }, 1500);
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
  el.append(card);

  renderOpenResponse(el, {
    prompt: cfg.promptQuestion || "How does this connect to what we learned?",
    sentenceFrame: cfg.prompt,
    keywords: cfg.keywords,
    minLength: 25,
    onSubmit(text, valid) {
      completePhase(el, ctx, state, 4, "Connect", valid ? 1 : 0, 1);
    },
  });
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

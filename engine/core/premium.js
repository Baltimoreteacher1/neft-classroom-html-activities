import { renderThemeIllustration } from "./theme-illustrations.js";
import {
  PHASE_TIME_ESTIMATES,
  countPracticeProblems,
  deriveLaunchBeats,
} from "./content-enrichment.js";
import { renderMathText } from "./math-typography.js";
import { t, stackHtml, phaseName, badgeName } from "./i18n.js";

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

const PHASE_ACCENTS = [
  { mood: "warm", class: "phase-accent-launch" },
  { mood: "explore", class: "phase-accent-vocab" },
  { mood: "focus", class: "phase-accent-explore" },
  { mood: "practice", class: "phase-accent-practice" },
  { mood: "connect", class: "phase-accent-connect" },
  { mood: "celebrate", class: "phase-accent-reflect" },
];

const PHASE_CONFIGS = [
  { name: "Launch", icon: "🚀" },
  { name: "Vocab Builder", icon: "📖" },
  { name: "Explore", icon: "🔍" },
  { name: "Practice", icon: "✏️" },
  { name: "Connect", icon: "🌎" },
  { name: "Reflect", icon: "💡" },
];

const BADGE_DEFS = [
  { id: "streak_sage", emoji: "🔥", name: "Streak Sage", test: (s) => s.bestStreak >= 5 },
  { id: "vocab_scholar", emoji: "📚", name: "Vocab Scholar", test: (s) => (s.phases[1]?.stars ?? 0) >= 3 },
  { id: "no_hint_hero", emoji: "🦸", name: "No-Hint Hero", test: (s) => s.hintsUsed === 0 && s.totalAttempts >= 3 },
  { id: "coin_collector", emoji: "🪙", name: "Coin Collector", test: (s) => s.coins >= 5 },
  { id: "sharpshooter", emoji: "🎯", name: "Sharpshooter", test: (s) => s.totalAttempts > 0 && s.totalCorrect / s.totalAttempts >= 0.9 },
  { id: "deep_thinker", emoji: "🧠", name: "Deep Thinker", test: (s) => s.totalAttempts >= 8 },
];

export function badgeDisplayName(id) {
  return badgeName(id);
}

/** Apply phase-specific accent to main content area. */
export function applyPhaseAccent(mainEl, phaseIndex) {
  if (!mainEl) return;
  PHASE_ACCENTS.forEach((a) => mainEl.classList.remove(a.class));
  const accent = PHASE_ACCENTS[phaseIndex];
  if (accent) mainEl.classList.add(accent.class);
}

/** Check and award badges; returns newly earned badge ids. */
export function checkBadges(state) {
  const s = state.get();
  const earned = new Set(s.badges || []);
  const newly = [];
  for (const def of BADGE_DEFS) {
    if (!earned.has(def.id) && def.test(s)) {
      earned.add(def.id);
      newly.push(def);
    }
  }
  if (newly.length) {
    state.set({ badges: [...earned] });
  }
  return newly;
}

export function getBadgeDefs() {
  return BADGE_DEFS;
}

/** Enhanced identity/cover screen markup injected into identity-hero. */
export function buildLessonCoverExtras(config, savedProgress) {
  const vocabCount = config.vocabulary?.length || 0;
  const problemCount = countPracticeProblems(config);
  const pct = savedProgress
    ? Math.round((savedProgress.phasesCompleted / 6) * 100)
    : 0;

  const phaseChips = PHASE_TIME_ESTIMATES.map(
    (p, i) =>
      `<span class="cover-phase-chip" title="~${p.minutes} min"><span aria-hidden="true">${p.icon}</span> ${stackHtml(phaseName(i, "en"), phaseName(i, "es"))}</span>`,
  ).join("");

  return `
    <div class="lesson-cover-art" aria-hidden="true"></div>
    <div class="cover-learning-goal card-compact">
      <span class="cover-goal-label">${stackHtml(t("todaysGoal", "en"), t("todaysGoal", "es"))}</span>
      <p class="cover-goal-text">${renderMathText(config.contentObjective || `Master ${config.title}`)}</p>
    </div>
    <div class="cover-stats-row">
      <span class="cover-stat"><strong>${vocabCount}</strong> ${stackHtml(t("vocabWords", "en"), t("vocabWords", "es"))}</span>
      <span class="cover-stat"><strong>${problemCount}</strong> ${stackHtml(t("practiceItems", "en"), t("practiceItems", "es"))}</span>
      <span class="cover-stat"><strong>6</strong> ${stackHtml(t("phases", "en"), t("phases", "es"))}</span>
    </div>
    ${
      pct > 0
        ? `<div class="cover-progress-ring" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
            <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="20" class="ring-bg"/><circle cx="24" cy="24" r="20" class="ring-fill" style="stroke-dasharray:${pct * 1.26} 126"/></svg>
            <span class="ring-label">${pct}%</span>
          </div>`
        : ""
    }
    <div class="cover-phase-preview">${phaseChips}</div>
    <button type="button" class="cover-standards-btn" data-action="standards-explainer" aria-expanded="false">
      📋 ${esc(config.standard)} — tap to learn more
    </button>`;
}

/** Mount animated theme art into cover slot. */
export function mountCoverArt(slot, config) {
  if (!slot || !config.theme) return;
  renderThemeIllustration(slot, config.theme, config.launch?.contextImage || null);
  slot.querySelector(".theme-hero-svg")?.classList.add("cover-svg-animate");
}

/** Tap-to-reveal launch story beats. */
export function renderLaunchStoryBeats(host, config) {
  const beats = deriveLaunchBeats(config);
  if (beats.length <= 1) return null;

  const wrap = document.createElement("div");
  wrap.className = "launch-story-beats";
  wrap.setAttribute("aria-label", "Story beats — tap to reveal");

  beats.forEach((beat, i) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "story-beat-card";
    card.setAttribute("aria-expanded", "false");
    card.innerHTML = `
      <span class="story-beat-num">${i + 1}</span>
      <span class="story-beat-label">${esc(beat.label)}</span>
      <span class="story-beat-teaser">${stackHtml(t("tapToReveal", "en"), t("tapToReveal", "es"))}</span>`;

    const reveal = document.createElement("div");
    reveal.className = "story-beat-reveal";
    reveal.hidden = true;
    reveal.innerHTML = `<p>${renderMathText(beat.text)}</p>`;

    card.addEventListener("click", () => {
      const open = reveal.hidden;
      reveal.hidden = !open;
      card.setAttribute("aria-expanded", String(open));
      card.classList.toggle("is-revealed", open);
      if (open) {
        card.querySelector(".story-beat-teaser").textContent = "";
        if (window.AudioSynth) window.AudioSynth.click();
      }
    });

    const row = document.createElement("div");
    row.className = "story-beat-row";
    row.append(card, reveal);
    wrap.append(row);
  });

  host.prepend(wrap);
  return wrap;
}

/** Build enhanced phase transition context for engagement.showPhaseComplete. */
export function buildPhaseTransitionMeta(state, phaseIdx, phaseName, xp, stars) {
  const s = state.get();
  const next = PHASE_CONFIGS[phaseIdx + 1];
  const phase = s.phases[phaseIdx];
  const accuracy =
    phase?.attempts > 0
      ? Math.round((phase.correct / phase.attempts) * 100)
      : null;

  const newBadges = checkBadges(state);

  return {
    nextPhase: next
      ? { name: next.name, icon: next.icon, index: phaseIdx + 1 }
      : null,
    stats: {
      coins: s.coins,
      streak: s.streak,
      bestStreak: s.bestStreak,
      accuracy,
      hintsUsed: s.hintsUsed,
    },
    newBadges,
    phaseBadge: stars >= 3 ? `⭐ ${t("perfectPhase")}` : stars >= 2 ? `✨ ${t("strongWork")}` : "",
  };
}

/** Printable student summary for Reflect phase. */
export function buildPrintableSummary(state, config) {
  const s = state.get();
  const learned = state.getResponse(5, "one_thing_learned") || state.getResponse(5, "reflect_3") || "";
  const confidence = state.getResponse(5, "confidence") || state.getResponse(5, "self-assess") || "";

  const wrap = document.createElement("section");
  wrap.className = "printable-summary card";
  wrap.innerHTML = `
    <h4>📄 ${stackHtml(t("myLessonSummary", "en"), t("myLessonSummary", "es"))}</h4>
    <p><strong>${t("lesson")}:</strong> ${esc(config.title)} · ${esc(config.standard)}</p>
    <p><strong>${t("student")}:</strong> ${esc(s.studentName)} ${s.studentPeriod ? `· ${t("period")} ${esc(s.studentPeriod)}` : ""}</p>
    <p><strong>${t("oneThingLearned")}:</strong> ${esc(learned) || "(not filled in yet)"}</p>
    <p><strong>${t("confidence")}:</strong> ${confidence ? `${confidence}/5` : "—"}</p>
    <p><strong>XP:</strong> ${s.xp} · <strong>${t("stars")}:</strong> ${s.phases.reduce((sum, p) => sum + p.stars, 0)}/18 · <strong>${t("coins")}:</strong> ${s.coins}</p>
    <button type="button" class="btn btn-secondary btn-sm printable-summary-btn">🖨️ ${stackHtml(t("printSummary", "en"), t("printSummary", "es"))}</button>`;

  wrap.querySelector(".printable-summary-btn")?.addEventListener("click", () => {
    wrap.classList.add("print-target");
    window.print();
    wrap.classList.remove("print-target");
  });

  return wrap;
}

export { PHASE_CONFIGS };

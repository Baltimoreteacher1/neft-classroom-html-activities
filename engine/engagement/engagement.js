const CONFETTI_COLORS = [
  "#F2C15B",
  "#1FA6A2",
  "#D9795D",
  "#12355B",
  "#0FA958",
  "#2F80D1",
];

const ENCOURAGE_CORRECT = [
  "Nice work!",
  "You got it!",
  "Excellent!",
  "Well done!",
  "That's right!",
  "Great thinking!",
  "Spot on!",
  "Perfect!",
];

const ENCOURAGE_STREAK = [
  "",
  "",
  "On fire! 3 in a row!",
  "Unstoppable! 4 straight!",
  "Amazing streak — 5!",
  "Legendary! 6 in a row!",
];

import { t, stackHtml, phaseName as getPhaseName, badgeName } from "../core/i18n.js";

const ENCOURAGE_TRY_AGAIN = [
  "Not quite — try again!",
  "Almost! Give it another shot.",
  "Keep going — you've got this!",
  "Close! Think it through.",
];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function createEngagement(state) {
  let streakEl = null;

  function ensureStreakDisplay() {
    if (streakEl) return streakEl;
    const existing = document.querySelector(".streak-display");
    if (existing) {
      streakEl = existing;
      return streakEl;
    }
    streakEl = document.createElement("div");
    streakEl.className = "streak-display";
    streakEl.innerHTML = `<span class="streak-fire">🔥</span><span class="streak-count">0</span>`;
    const main = document.querySelector(".main") || document.body;
    main.prepend(streakEl);
    return streakEl;
  }

  function updateStreakDisplay(streak) {
    const el = ensureStreakDisplay();
    const countEl = el.querySelector(".streak-count");
    if (countEl) countEl.textContent = streak;
    if (streak >= 2) {
      el.classList.add("visible");
      el.classList.add("streak-bump");
      el.addEventListener(
        "animationend",
        () => el.classList.remove("streak-bump"),
        { once: true },
      );
    } else {
      el.classList.remove("visible");
    }
  }

  return {
    awardXP(phaseIndex, { correct, total }) {
      const baseXP = 10;
      const bonusPerCorrect = 8;
      const s = state.get();
      const streakBonus = s.streak >= 5 ? 3 : s.streak >= 3 ? 2 : 1;
      const xp = (baseXP + correct * bonusPerCorrect) * streakBonus;
      state.completePhase(phaseIndex, { correct, total, xp });
      return xp;
    },

    recordCorrect(element) {
      state.recordAnswer(true);
      const s = state.get();
      updateStreakDisplay(s.streak);

      if (element) {
        element.classList.add("pop-correct");
        element.addEventListener(
          "animationend",
          () => element.classList.remove("pop-correct"),
          { once: true },
        );
      }

      const streakMsg =
        s.streak >= 2 && s.streak <= 6
          ? ENCOURAGE_STREAK[s.streak - 1] || ""
          : s.streak > 6
            ? `🔥 ${s.streak} in a row!`
            : "";

      return {
        message: randomFrom(ENCOURAGE_CORRECT),
        streakMessage: streakMsg,
        streak: s.streak,
        streakMultiplier: s.streak >= 5 ? 3 : s.streak >= 3 ? 2 : 1,
      };
    },

    recordIncorrect(element) {
      state.recordAnswer(false);
      updateStreakDisplay(0);

      if (element) {
        element.classList.add("incorrect");
        setTimeout(() => element.classList.remove("incorrect"), 500);
      }

      return {
        message: randomFrom(ENCOURAGE_TRY_AGAIN),
        streak: 0,
      };
    },

    showCorrect(element) {
      element.classList.add("pop-correct");
      element.addEventListener(
        "animationend",
        () => element.classList.remove("pop-correct"),
        { once: true },
      );
    },

    showIncorrect(element) {
      element.classList.add("incorrect");
      setTimeout(() => element.classList.remove("incorrect"), 500);
    },

    showConfetti(container) {
      if (!container)
        container = document.querySelector(".celebration-overlay");
      if (!container) return;

      const count = 40;
      const pieces = [];

      for (let i = 0; i < count; i++) {
        const piece = document.createElement("div");
        piece.className = "confetti-piece";
        const color =
          CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
        const size = 6 + Math.random() * 8;
        const isCircle = Math.random() > 0.5;

        Object.assign(piece.style, {
          left: `${10 + Math.random() * 80}%`,
          top: "-20px",
          width: `${size}px`,
          height: `${isCircle ? size : size * 0.6}px`,
          background: color,
          borderRadius: isCircle ? "50%" : "2px",
          animation: `confettiFall ${1.5 + Math.random() * 1.5}s linear forwards`,
          animationDelay: `${Math.random() * 0.3}s`,
        });

        container.append(piece);
        pieces.push(piece);
      }

      setTimeout(() => pieces.forEach((p) => p.remove()), 3500);
    },

    showBurstConfetti(container) {
      if (!container)
        container = document.querySelector(".celebration-overlay");
      if (!container) return;
      for (let i = 0; i < 3; i++) {
        setTimeout(() => this.showConfetti(container), i * 200);
      }
    },

    showPhaseComplete(container, phaseName, xpEarned, stars, transitionMeta = {}) {
      const banner = document.createElement("div");
      banner.className = "phase-complete-banner visible phase-transition-card";

      const s = state.get();
      const stats = transitionMeta.stats || {};
      const next = transitionMeta.nextPhase;
      const newBadges = transitionMeta.newBadges || [];

      const streakBadge =
        (stats.bestStreak ?? s.bestStreak) >= 3
          ? `<div class="streak-badge">🔥 ${t("bestStreak")}: ${stats.bestStreak ?? s.bestStreak} ${t("inARow")}</div>`
          : "";

      const starHtml = Array.from(
        { length: 3 },
        (_, i) =>
          `<span class="star-icon ${i < stars ? "earned" : ""}" style="animation-delay:${0.2 + i * 0.15}s">★</span>`,
      ).join("");

      const statChips = [
        stats.coins != null ? `🪙 ${stats.coins} coins` : null,
        stats.streak >= 2 ? `🔥 ${stats.streak} streak` : null,
        stats.accuracy != null ? `${stats.accuracy}% ${t("accuracy")}` : null,
      ]
        .filter(Boolean)
        .map((t) => `<span class="phase-stat-chip">${t}</span>`)
        .join("");

      const nextPreview = next
        ? `<div class="phase-next-preview">
            <span class="phase-next-label">${t("upNext")}</span>
            <span class="phase-next-icon" aria-hidden="true">${next.icon}</span>
            <strong>${getPhaseName(next.index)}</strong>
          </div>`
        : "";

      const badgeUnlock = newBadges.length
        ? `<div class="badge-unlock-row">${newBadges
            .map(
              (b) =>
                `<span class="badge-unlock" title="${badgeName(b.id)}">${b.emoji} ${badgeName(b.id)}</span>`,
            )
            .join("")}</div>`
        : "";

      const phaseBadge = transitionMeta.phaseBadge
        ? `<div class="phase-complete-badge">${transitionMeta.phaseBadge}</div>`
        : "";

      banner.innerHTML = `
        <div class="badge badge-success" style="margin-bottom:var(--sp-4)">${stackHtml(t("phaseComplete", "en"), t("phaseComplete", "es"))}</div>
        ${phaseBadge}
        <h3>${phaseName} — ${t("phaseDone")}</h3>
        <div class="star-display">${starHtml}</div>
        <div class="phase-complete-xp">+${xpEarned} XP</div>
        ${statChips ? `<div class="phase-stat-chips">${statChips}</div>` : ""}
        ${streakBadge}
        ${badgeUnlock}
        ${nextPreview}
        <button class="btn btn-primary btn-lg mt-6" data-action="next-phase">
          ${next ? `${t("continueTo")} ${getPhaseName(next.index)} →` : t("continue")}
        </button>
      `;

      container.innerHTML = "";
      container.append(banner);

      if (window.AudioSynth && next) {
        setTimeout(() => window.AudioSynth.success(), 200);
      }

      if (stars === 3) {
        this.showBurstConfetti();
      } else {
        this.showConfetti();
      }

      return new Promise((resolve) => {
        banner
          .querySelector('[data-action="next-phase"]')
          .addEventListener("click", resolve, { once: true });
      });
    },

    createFeedback(type, message) {
      const icons = { success: "✓", hint: "?", error: "✗" };
      const el = document.createElement("div");
      el.className = `feedback feedback-${type} visible`;
      el.setAttribute("role", "alert");
      el.innerHTML = `
        <span class="feedback-icon">${icons[type] || "!"}</span>
        <span>${message}</span>
      `;
      return el;
    },
  };
}

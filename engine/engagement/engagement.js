const CONFETTI_COLORS = [
  "#F2C15B",
  "#1FA6A2",
  "#D9795D",
  "#12355B",
  "#0FA958",
  "#2F80D1",
];

export function createEngagement(state) {
  return {
    awardXP(phaseIndex, { correct, total }) {
      const baseXP = 10;
      const bonusPerCorrect = 8;
      const xp = baseXP + correct * bonusPerCorrect;
      state.completePhase(phaseIndex, { correct, total, xp });
      return xp;
    },

    showCorrect(element) {
      element.classList.add("pop-correct");
      element.addEventListener(
        "animationend",
        () => {
          element.classList.remove("pop-correct");
        },
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

    showPhaseComplete(container, phaseName, xpEarned, stars) {
      const banner = document.createElement("div");
      banner.className = "phase-complete-banner visible";

      const starHtml = Array.from(
        { length: 3 },
        (_, i) =>
          `<span class="star-icon ${i < stars ? "earned" : ""}" style="animation-delay:${0.2 + i * 0.15}s">★</span>`,
      ).join("");

      banner.innerHTML = `
        <div class="badge badge-success" style="margin-bottom:var(--sp-4)">Phase Complete</div>
        <h3>${phaseName} — Done!</h3>
        <div class="star-display">${starHtml}</div>
        <div class="phase-complete-xp">+${xpEarned} XP</div>
        <button class="btn btn-primary btn-lg mt-6" data-action="next-phase">
          Continue →
        </button>
      `;

      container.innerHTML = "";
      container.append(banner);
      this.showConfetti();

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

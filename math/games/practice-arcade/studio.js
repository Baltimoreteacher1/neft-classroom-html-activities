(() => {
  "use strict";
  if (!window.GameStudio || !window.PracticeStudio) return;
  const adapter = window.PracticeStudio;
  document.addEventListener(
    "keydown",
    (event) => {
      if (event.target.closest("#practice-text-controls button, #practice-text-controls select"))
        event.stopPropagation();
    },
    true,
  );
  window.GameStudio.register({
    title: "Practice Arcade",
    instructions: [
      "Choose a practice level, then start or resume your saved adventure.",
      "Use number keys for choices. For sorting, choose a tile then its group. Use arrow keys to move number-line and coordinate markers, then Enter to check.",
      "Solve 5 to finish a band, then the next band opens. A miss resets your streak. Stars come from accuracy: 3 correct, a streak of 3 or 8 correct, then 80% on a finished round of 4 or more.",
      "Missed questions return in a retry round. Hints appear after a miss. The answer stays hidden until you solve it. Progress saves at each new challenge in this browser.",
    ],
    pause: () => adapter.pause(),
    resume: () => adapter.resume(),
    setMuted: (value) => adapter.setMuted(value),
    setMotion: (value) => adapter.setMotion(value),
  });
})();

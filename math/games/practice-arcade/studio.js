(() => {
  'use strict';
  if (!window.GameStudio || !window.PracticeStudio) return;
  const adapter = window.PracticeStudio;
  document.addEventListener('keydown', event => { if (event.target.closest('#practice-text-controls button, #practice-text-controls select')) event.stopPropagation(); }, true);
  window.GameStudio.register({
    title: 'Practice Arcade',
    instructions: ['Choose a practice level, then start or resume your saved adventure.', 'Use number keys for choices. For sorting, choose a tile then its group. Use arrow keys to move number-line and coordinate markers, then Enter to check.', 'Hints and retries are always available. Stars show first-try solves; every completed challenge counts.', 'Progress saves at each new challenge in this browser. World Map shows your completed lessons.'],
    pause: () => adapter.pause(), resume: () => adapter.resume(),
    setMuted: value => adapter.setMuted(value), setMotion: value => adapter.setMotion(value),
  });
})();

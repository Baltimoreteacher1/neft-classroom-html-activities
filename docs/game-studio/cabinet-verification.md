# Curriculum cabinet verification

Run with the local Vite server already serving the repository:

```sh
GAME_STUDIO_BASE_URL=http://127.0.0.1:4179 node tests/phaser-studio-browser.cjs
GAME_STUDIO_BASE_URL=http://127.0.0.1:4179 node tests/dom-cabinet-browser.cjs
```

The Phaser runner checks all ten cabinets. Fixtures use each cabinet's existing math mutation methods, then call its native grader. It checks a correct solve, feedback retained until Continue, the next question unlocking, the vocabulary gate, and a genuine challenge-mode restart with score reset. This samples one correct round per cabinet; it does not exhaust random problem generation.

The DOM runner uses real buttons to complete all five Factor Frenzy vaults and all eleven Placement Quest questions. It checks branch Undo, vault calibration, one graded answer per diagnostic question, the diagnostic score and six review links after a mixed result.

During implementation, all twelve pages also passed browser boot and control interactions at 390 × 844 with no page errors and no horizontal document overflow. Phaser Help paused/resumed each engine. Sampled mobile renders showed readable HTML prompts, controls and utility launchers; the original canvas retains its game coordinates. Save/resume and LMS bridge scripts remain loaded. Backend grade submissions and saved-session recovery were not exercised by these local browser checks.

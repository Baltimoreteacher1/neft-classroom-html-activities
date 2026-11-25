# Scaffold Studio changelog

## Phase 0 - discovery
- `discovery.md`: inventory, integration strategy, decisions, risks.

## Phases 1-3 (foundation, so far)
- Design system: `scaffold-studio.css` (`ss-` prefix; the lab's `sc-`/`sg-` names were already taken), three themes, 44px targets, reduced motion. `/styleguide` renders every token and component.
- Architecture: schema v1, four-step fading over the lab's five rungs, level-aware defaults, review gate, counts-only profile and export.
- Content: two pilot units with 13 supports each (Spanish glosses legacy-unreviewed, machine-drafted).
- Gates: `validate:scaffold-contrast` (81 pairs), `validate:scaffold-content`, `tools/scaffold-studio.test.mjs` (16 tests), `verify:scaffold-browser` (axe in 3 themes x 2 faces).

## Not yet built
See `human-required.md` and the open list in the delivery message.

## Phases 3-7 (second pass)
- Runtime (`src/scaffold/runtime.js`) and the `/supports` view: tap-a-word popover (focus returns, Escape closes), one support dial remembered per device, "I need more help", ask-the-passage with evidence highlight and refusal, writing feedback (working / next step / why, with its limit stated, no score), rehearsal with an in-memory recorder (Private mode keeps nothing), "supports I am growing out of", teacher CSV/JSON export.
- Baseline help on every other route (`baseline.js`): double-tap a word to hear it. Off until released.
- Optional AI layer: adapter with deterministic fallback, off by default and unreachable on production hosts; evaluation harness `tools/eval-scaffold-ai.mjs` (answerable >= 90%, refusal 100%, writing clean 100%).
- Audio: `tools/normalize-scaffold-audio.mjs` (two-pass loudnorm to -16 LUFS; proven on a test tone).
- Docs: teacher getting-started, how supports fade, 2-minute video script (script only; no video was recorded).
- Gates: `verify:scaffold-browser` now drives `/supports` end to end.

## Still not done
- Per-step supports inside existing quest missions (only the baseline reaches them).
- The two Next.js exports.
- Everything in `needs-human-review.md`.

Measured core layer (all `src/scaffold` modules plus `scaffold-studio.css`, gzip -9): about 20 KB, under the 60 KB budget. Lighthouse and a Chromebook profile were not run.

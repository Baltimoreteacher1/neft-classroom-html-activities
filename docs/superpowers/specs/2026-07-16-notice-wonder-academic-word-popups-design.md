# Notice/Wonder Academic-Word Popups

## Goal

Every chip in the **Academic words** row of every base curriculum lesson's Notice/Wonder experience opens a useful glossary dialog. Each dialog provides a simple definition and a relevant image without exposing answers or collecting student information.

## Current state

All 64 base lessons include Notice/Wonder and academic-word support. The shared renderer currently opens the existing glossary dialog only when a support word matches the current lesson's authored vocabulary. That covers 78 of 446 chip occurrences; 368 occurrences remain insert-only.

## Scope

- Cover every academic-word chip in the 64 base lessons.
- Keep the separate plus control that inserts a word into the student's response.
- Do not underline ordinary words inside the scenario paragraph; this preserves reading fluency and keeps the interaction predictable.
- Reuse the current glossary dialog, vocabulary image resolver, and save/resume behavior.
- Preserve the corrected Lesson 2.3 fraction scenario and assessment alignment already in the worktree.

## Architecture

Add one shared academic-word glossary module under `engine/core/`. It will normalize labels and resolve entries in this order:

1. The lesson's authored vocabulary entry.
2. A shared Notice/Wonder glossary entry for common observation, comparison, measurement, shape, data, and context words.

The Notice/Wonder renderer will call this resolver for every academic-word chip. A chip renders as a two-action pill:

- the underlined word opens the dialog;
- the plus button inserts the word into the most recently focused Notice/Wonder response.

The existing image resolver supplies a dedicated SVG when one exists and an appropriate category illustration otherwise. No network image dependency is introduced.

## Content requirements

- Definitions use short Grade 6-friendly sentences and avoid defining a term with the same term.
- Entries include a concrete visual/example caption when it adds meaning.
- Spanish labels and definitions are included for shared fallback entries to support multilingual learners.
- Definitions explain vocabulary only; they do not reveal lesson solutions.

## Accessibility and interaction

- Word triggers remain native buttons with `aria-haspopup="dialog"` and descriptive labels.
- Dialogs retain keyboard focus, Escape-to-close, backdrop close, and focus return.
- Images have descriptive alternative text derived from the term and definition.
- Touch targets are at least 44px where the interface permits separate word and add controls.
- Existing high-contrast colors, reduced-motion behavior, and responsive dialog layout remain intact.

## Validation

Automated tests will enumerate all 64 base lesson configs and require every Notice/Wonder academic word to resolve to:

- a non-empty simple definition;
- a valid local image path;
- a popup-capable rendered trigger.

Renderer contract tests will verify the dialog wiring, the separate insertion action, and accessible labels. Browser QA will test one lesson with an authored vocabulary match and one lesson using the shared fallback at desktop and mobile sizes. The full test suite, static validators, and production build must pass before deployment.

## Deployment

Commit the fraction correction independently, commit the glossary implementation, then use the repository's guarded ship workflow to apply the commits to the latest `origin/main`. Confirm the production build stamp and test live popup behavior without disturbing password-protected teacher surfaces.

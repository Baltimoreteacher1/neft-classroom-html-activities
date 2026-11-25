# Language Demand Analyzer

Route `/demand` (teacher section of Explore; no top-nav item). A teacher pastes a task, passage or directions and sees
where the **language** may get in the way of the **thinking** it asks for, with supports that keep the thinking whole.

## Files

| File                     | Owns                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| `src/demand/analyze.js`  | `analyzeDemand(text, { band, subject })`, `chunkDirections(text)`. Pure, deterministic.     |
| `src/demand/patterns.js` | Idioms (49), multiple-meaning words (43), practice links, command verbs, purposes, frames, checks, visuals. |
| `src/demand/sample.js`   | Three original example tasks (K-2, 3-5, 6-8).                                               |
| `src/views/demand.js`    | The page: input, shaded text, findings, steps, words, frames, copy and print.               |
| `demand.css`             | Tokens only.                                                                                |
| `tools/demand.test.mjs`  | Engine rules. `tools/demand-e2e.mjs`: the page in a real browser.                           |

## What it flags (each flag quotes the teacher's own words)

Stacked directions (three or more actions in one sentence), long sentences (limit by band: 10, 16, 24 words), idioms and
phrasal verbs, words with an everyday and a school meaning, passive voice, noun-heavy sentences, an unclear "this/it"
that opens a sentence, negation and exceptions.

It also returns: the directions split into numbered steps (the teacher's own words, only split), up to ten words to
pre-teach with the Word Lab gloss, Spanish equivalent and cognate or false-friend warning, sentence frames for the
purposes it finds in the task (each with a word-bank step and an "independent" step, so supports fade), a formative check
per purpose, and visual-support ideas.

## Rules (tests in `tools/demand.test.mjs`)

- Every quote is a verbatim span at the stated offsets. A word inside an idiom is reported once.
- The task is never rewritten. `chunkDirections` only splits, in order.
- No student level, score or proficiency claim; the page says it is not a reading level and not a district alignment.
- Rule-based and local. No network, no storage, no AI. The text is not saved.
- Thresholds and word lists are authored judgments, not a validated readability model. Rules miss some barriers and
  flag some things that are fine: that is why each flag shows its words and a reason.

## Known limits

Analysis output is English; the page chrome is English and Spanish. The idiom and multiple-meaning lists are finite.
Pronoun and passive detection are heuristics (passive is always "worth a check", never "high").

## Analyze, then build (`src/demand/handoff.js`)

"Make a student handout" carries the result into Activity Studio (`/activity-studio/new?kind=worksheet&from=demand`):
the teacher's own task becomes the reading block, its directions in numbered steps go on top, the pre-teach words that
have a Word Lab meaning become the vocabulary block (a word with no meaning is left out, never invented), and the
sentence starters follow the vocabulary. The task is never reworded. The handoff lives in session storage for one read.
Tests: `tools/demand-handoff.test.mjs` (the real analyze -> createActivity -> validate chain), `tools/teacher-links-e2e.mjs`.

# Language Page integration decisions

Joel, 2026-11-19: “Fix where it ignores the legal stuff-- I have full permission. And make sure it is more exact and precise with the features, etc...”

These decisions authorize implementation; provisioning, secrets, real messages and real student records retain their STOP points. The final request authorizes deployment when verified.

## lp-reference-products-full-replication

Replicate reference-product features and flows; use LP feature names publicly and record reused public assets.

## lp-speaking-rehearsal-timers-optional

Speaking rehearsal timers are teacher-enabled, default off; games and quick practice remain untimed.

## lp-live-speaking-rooms

Build recorded speaking rooms with explicit consent, 30-day retention, delete controls and disabled unprovisioned providers.

## lp-family-letters-signatures

Build letters, receipts and typed signatures; default to local outbox, with no real sending or provisioning.

## lp-el-program-forms

Build teacher-local neutral EL program forms; teachers decide identification, placement and reclassification.

## lp-lms-completion-and-teacher-points-sync

Pass completion and explicitly teacher-entered practice rubric points to an LMS; LP never calculates or suggests points.

## lp-teacher-prompt-generator-ai

Generate teacher-only draft prompts with guarded model calls, template fallback and explicit Accept; never score student speech.

## Implementation status after rebase

The Reading Path slice includes the reviewed silent-e split-grapheme segmentation,
one shared Word Machine reel/lexicon module, and clamping for card, round, stage,
and reel inputs. These are implementation fixes; they do not change the seven
product decisions above.

The full Revision 2 scope remains incomplete. T1–T4 and T6, X1–X11, and E1–E9
are unbuilt. T5 is partial: only the Reading Path game-round controls are wired;
fleet-wide class sharing and Add to class are not implemented. T7 is partial:
the role preference reorders the first three Teacher Hub cards, while the six
card row still exceeds the requested CTA budget. See `integration-audit.md` for
the per-feature inventory and release verification record.

The latest `origin/main` still fails `tools/math-acronyms.test.mjs` on `STAY`,
`EL`, and `DOBLE`. The test and source content remain unchanged. Since
`npm run test:reads` requires every test to pass before writing its manifest,
there is no valid `data/test-reads.json` to stage or commit yet.

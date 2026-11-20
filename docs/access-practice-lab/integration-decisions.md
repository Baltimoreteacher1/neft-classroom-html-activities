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

## Implementation status, 2026-11-19

The integration branch now includes substantial local implementation across Reading
Path, resource packs, lesson-pack export, family Today, finder metadata, speaking
task drafts and previews, mock live rooms, partner talk, and a teacher-local EL
program workspace. The current feature-by-feature record is in
`integration-audit.md`; it deliberately distinguishes partial work from complete
acceptance criteria.

Nothing in these decisions authorizes production provisioning or real data use.
The mock live provider creates metadata only. Email remains an outbox. LMS OAuth,
student-record imports, production signatures/receipt storage, and live room
recordings remain disabled. Content is machine-checked but lacks human translation,
phonics, and program review.

The current-main reading manifest remains blocked by unrelated tests unless the
underlying main-branch debt is fixed: the acronym check flags `STAY`, `EL`, and
`DOBLE`, and the content-preservation/math-studio checks also show source drift.
Do not weaken these tests or hand-edit `data/test-reads.json`. A failed required
gate blocks the guarded ship.

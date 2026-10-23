# ACCESS Practice Lab Intelligence — implementation plan

Updated 2026-10-23. This plan is grounded in the current `origin/main` checkout and the existing ACCESS Lab contracts.

## Current architecture

- Static HTML and ES modules built with Vite and published as Cloudflare Pages (`dist`). Deep links are served by the Pages Function at `functions/access-practice-lab/[[path]].js`.
- Student practice is local-first. Progress and the language evidence ledger use versioned `localStorage` keys; audio is in memory unless a student explicitly keeps it in IndexedDB. Existing Passport transfer codes are opt-in, alias-only bundles.
- The Speaking and Writing Studios already use original prompts and a deterministic, on-device Language Coach. It analyzes a student-entered transcript or draft, records evidence features, supports revision, and does not judge accent or report an official score.
- The Teacher Hub at `/access-teacher/` imports a student-selected code/file into the teacher's browser. Its roster and response samples remain on that device. Existing teacher protection is supplied by deployment routing/password controls; the project does not have a general app identity/tenant service.
- Teacher evidence includes summaries, samples, response comparison, export, and rules-based small-group suggestions. Learning evidence is traceable to ledger entries. Existing accessibility, route, content, privacy, and static-site validators are the established quality gates.
- There is no general ORM/database in the student lab, no authenticated student API, and no configured transcription or external language-model adapter for this product. The general Cloudflare D1 bindings used by other features are not an authorization model for student records.

## Preserve

Keep all current activity URLs, original prompt/content files, student progress keys and import behavior, independent/support semantics, offline shell behavior, speaking recorder/playback, local feedback, teacher password/routing controls, share-code privacy, retention messaging, and Cloudflare Pages build/deploy process. Do not use or transmit official assessment materials. Existing score-claim safeguards remain in force.

## Proposed first release

Extend the current evidence ledger with an extensible skill catalog and explainable evidence aggregation. Render a student-friendly skill map from evidence already on the device. Expand the Teacher Hub with class skill diagnostics, saved editable group plans, and approved-template next-day lesson drafts. Persist teacher controls only in the teacher's local browser. Keep generated material review-required and distinguish practice feedback from assessment results.

Speaking remains deterministic and on-device in this release. Add a provider contract only when a real, authorized service, consent, access controls, retention policy, and reviewed data flow are configured; mock adapters may be used in tests only. No audio, transcript, response, or identifying data is sent to a provider. Low or absent transcription confidence is not converted into a performance judgment.

## Feature switches in this release

The source-controlled local flags in `access-practice-lab/src/lang/feature-flags.js` default the skill graph, teacher diagnostics, instructional groups, lesson drafts, and provenance review on. Speaking Coach V2, dynamic scaffolding, external AI, and transcription remain off. No environment variables or secret values are added. These flags are release guards for the static app, not remotely changeable per-school flags.

## Database and API changes

No server schema or API migration is planned. This avoids an unauthenticated student evidence endpoint and preserves current offline and share-code behavior. New skill evidence is derived from the existing ledger and stored as versioned local state where necessary. Teacher groups, overrides, and lesson history remain in the teacher browser and are not synced. A future server-backed design requires a school/tenant identity and authorization review before schema work.

## UI changes

- Student Growth Map: add four-domain skill summaries, evidence sufficiency, independent and supported signals, and a suggested next step. Avoid percentage mastery and psychometric precision.
- Teacher Hub: add domain/skill diagnostics, traceable evidence counts and dates, editable group membership, a template-based 10–15 minute lesson editor, and explicit teacher approval/history.
- Keep keyboard operation, semantic headings, visible focus, no-color-only status, responsive layouts, print behavior, and the existing visual system.

## AI-provider abstraction

No production AI provider is configured for ACCESS Lab. The supported provider in this release is the deterministic local feedback path already in use. Production AI and cloud transcription stay disabled. Any future adapter must strictly validate output, time out, limit retries, redact logs, record model/prompt versions and confidence, avoid external training, and fail to a clearly labeled template/local workflow. Never send official assessment materials.

## Security, privacy, and governance

Keep student responses/audio on the student's device unless the student deliberately exports/shares an existing alias-only transfer file. Teacher imports remain local to the teacher's browser. Do not add analytics containing responses or identity, remote storage, new cookies, or a student-facing content-generation path. Teacher edits and approvals are locally attributable only to the current teacher workspace; they are not an authenticated audit identity. Document that limitation. Never claim compliance certification.

## Testing strategy

Add unit coverage for catalog integrity, evidence normalization, recency weighting, independence/support separation, confidence/evidence minimums, group generation/edit persistence, lesson fallback, provenance state transitions, output validation, and redaction. Run the existing ACCESS Lab validators, unit suites, changed-scope QA, and production build. Use the established browser suite for recording, student feedback, Teacher Hub, keyboard/mobile, and axe checks when available.

## Rollback strategy

The release is additive and uses new versioned local-storage keys. Reverting code restores prior pages; old student records remain untouched. New teacher-local group/lesson data can be removed using an explicit clear control. No database migration or production data deletion is required.

## Assumptions

- A safe first release must preserve the existing local-only student privacy boundary.
- Existing original EduWonderLab content and publicly permissible language-learning constructs are the only content sources.
- AI and speech services are not configured or authorized for student data. They stay off while local deterministic features remain available.
- Existing Teacher Hub access protection remains the access boundary; this work does not broaden it.

## Risks

- Student-controlled share codes are portable files, not verified identities or a class sync service.
- A browser-local teacher roster cannot provide cross-device persistence, centralized audit, or tenant isolation.
- Rule-based signals are instructional practice evidence, not validated psychometrics; sparse or mismatched evidence must stay “not enough evidence.”
- Current static routing and build generation have many contracts; build-generated changes must be reviewed and not committed accidentally.
- A real cloud transcription/LLM workflow cannot be enabled safely until provider, consent, identity, retention, security, and organizational review are complete.

## Deferred features

External transcription/LLM, server-backed longitudinal records, cross-device teacher collaboration, verified identity/tenant isolation, automatic student-facing content generation, dynamic assessment, family reporting, and district administration. Prioritized analysis is in `future-roadmap.md`.

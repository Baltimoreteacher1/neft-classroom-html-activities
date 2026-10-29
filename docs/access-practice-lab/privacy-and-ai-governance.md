# ACCESS Practice Lab — privacy and AI governance

Updated 2026-10-23. This documents technical behavior, not a legal-compliance guarantee.

## Data flow

1. Student activities run in the browser. Progress, student-selected alias, text drafts, and language-evidence summaries are stored in browser `localStorage` under the existing versioned ACCESS Lab keys.
2. Speaking audio remains in memory during a session unless the student explicitly chooses “Keep for my teacher”; then audio is stored in browser IndexedDB with the existing 30-day expiry and Passport deletion control. The product does not upload recordings.
3. Speaking transcript text is entered or corrected by the student. The existing Language Coach analyzes that text locally. It does not infer pronunciation quality or use accent as a criterion.
4. The student may explicitly create a transfer code/file. The existing share contract uses an alias and selected work; the teacher imports it into the Teacher Hub. No automatic transmission occurs.
5. The Teacher Hub stores imported roster records, observations, and exports in the teacher's browser. They are not synchronized to a server by this feature.

## Providers and model data

No transcription or external language-model provider is configured for this feature. No student text, audio, transcript, or official assessment content is sent to an AI provider. The local rule-based Language Coach is not a trained external model. No external model is trained on student responses. Production AI/transcription flags must remain off unless an approved adapter, data-flow review, access controls, consent process, retention terms, and organizational approval are in place.

## Storage and retention

- Existing localStorage records persist until the user clears site data or uses the Lab's Passport controls. Storage is browser/device-specific.
- Audio kept for a teacher expires after 30 days and can be deleted from Passport. Audio not explicitly kept remains in memory and is lost when the session ends.
- A share file/code is under the student's control and can persist in the LMS, email, downloads, or other location where the student/teacher puts it. It is not automatically revoked.
- Teacher roster, notes, overrides, and locally saved lesson drafts remain in that browser until removed or browser storage is cleared.
- This release adds no server-side student database, server audio storage, or new automatic data export.

## Human review and controls

Feedback is instructional practice feedback and has no official ACCESS/WIDA score meaning. Teachers can inspect the response and existing student/teacher review records, compare revisions, and make instructional decisions. Group and lesson recommendations are editable and lesson approval is a teacher action. Browser-local edits are not a centralized, identity-verified audit trail.

## Limitations and failure behavior

There is no cloud transcription confidence value because no cloud transcription occurs. Missing or student-entered transcripts must not be represented as verified transcription. No transcription failure is converted into a student-performance score. Existing local rule feedback remains available offline. If future provider calls fail, the app must keep the response unscored and offer local/template support or teacher review.

## Technical safeguards

- Keep student data local unless the learner explicitly exports/shares it.
- Do not log responses, transcripts, recordings, or identifying details to analytics.
- Treat imported transfer codes as untrusted input; validate shape and size before use.
- Keep teacher-only content behind existing teacher routes and controls.
- Keep new AI-generated content in draft/review state; never publish it to students automatically.
- Preserve teacher review, overrides, confidence/provenance, and prompt/model version records if a future provider feature is implemented.

## Items requiring organizational or legal review

Before introducing cloud processing or centralized storage, review student privacy/consent, provider terms and training use, retention/deletion guarantees, school/district authorization, tenant identity and access, breach response, and any applicable records obligations with the responsible organization. This document does not decide those questions.

## Camera postcards — disabled

The camera postcard experience is not available in this release. `cameraPostcardsEnabled` is hard-coded to `false`; no camera permission is requested, no photo is captured or stored, and no postcard media is added to ACCESS1 / ACCESST1 transfers. Keep the flag off until the school device policy, family consent expectations, local retention/deletion behavior, accessible no-camera path, and teacher-sharing behavior have been reviewed. Any future implementation must re-encode media through a canvas to strip metadata, keep photo bytes in local IndexedDB only with a 30-day expiry and a Passport delete control, provide a no-camera path, and add photos to a transfer only after an explicit “Keep for my teacher” choice.

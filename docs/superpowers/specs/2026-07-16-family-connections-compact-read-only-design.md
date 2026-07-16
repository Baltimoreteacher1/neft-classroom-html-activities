# Family Connections Compact Read-Only Redesign

**Date:** 2026-07-16
**Status:** Approved by direct build instruction
**Public route:** `/curriculum/family-connections/`
**Teacher route:** `/curriculum/family-connections/teacher/`

## Outcome

Family Connections becomes a short, phone-first weekly dashboard for families and a faster publishing workspace for the teacher. The public page is strictly read-only: it contains accessibility and navigation controls, but no edit mode, editable content, teacher link, draft access, or publishing action. The protected teacher route remains the only place where drafts can be saved or published.

## Family experience

The family page is organized by urgency rather than by feature count:

1. A compact welcome strip establishes the page purpose and the partnership message without consuming the first viewport.
2. “This week” is the dominant card. It contains the class selector only when multiple public classes exist, the week note, read-aloud action, and five concise day cards.
3. Classroom updates appear immediately after the week only when the teacher has published them.
4. The 74-lesson catalog is consistently named “Optional family practice,” never simply “homework.” A short statement directly beside the heading says it is separate from regular assigned homework, never graded, and offered only as an opportunity for families to review or practice current learning together when it works for them. The catalog is placed inside a closed-by-default “Browse optional family practice” disclosure. Opening it reveals search and unit filters. Practice cards show lesson, title, time, and primary actions first; detailed directions, materials, sentence frames, and the equitable school option are available in a per-card disclosure.
5. Family help is condensed into three plain-language actions: ask, listen, encourage. The AI guide and teacher-published resources remain available without repeating the same message across several large cards.
6. ClassDojo and Canvas destinations close the page with a clear “Ask a question” action.

English/Spanish switching, larger text, high contrast, read-aloud, keyboard navigation, reduced motion, visible focus, and high-contrast states remain first-class. The optional-practice distinction is translated into reviewed plain Spanish rather than left in English. Family copy uses short sentences, concrete verbs, and WIDA/ESOL-friendly phrasing. No answer keys or student data are exposed.

## Teacher experience

Teacher Mode keeps the existing data model and API while changing the information architecture:

- The sticky header carries draft/live status and Save, Preview, and Publish actions.
- The main desktop workspace uses a two-column layout: editing on the left and a compact sticky family preview on the right.
- The weekly plan is the only always-open editor. Class, week label, start date, family note, and five weekday cards remain directly available.
- Less-frequent controls are grouped under three native disclosures: “Customize optional family practice,” “Add updates and resources,” and “Sharing destinations.” Teacher copy repeats that family practice is separate from regular assigned homework so published wording remains consistent. This removes the six-section sidebar and the long required scroll without hiding functionality.
- Preview and publication history live beside the editor. Preview never implies that changes are live. Publishing still requires a preview, an up-to-date saved draft, and explicit confirmation.
- On phone and Chromebook widths the preview moves below the weekly editor, disclosures remain keyboard-native, and publication actions stay readable without horizontal scrolling.

## Read-only and permission contract

The public page must not contain or load:

- `editor.js`, an edit toggle, `contenteditable`, teacher-mode links, draft/history endpoints, Save, Preview, Publish, or form controls that mutate publication data;
- any family contact, student record, grade, private message, access token, or secret.

The public page may retain preference controls, class selection, homework search/filter, disclosures, read-aloud, and outbound family-resource links because these do not mutate shared content.

Cloudflare Access and middleware continue to protect the teacher HTML route plus draft, history, and publish API routes. The public `GET /api/family-connections/published` endpoint remains read-only and cacheable. The UI change does not weaken server enforcement.

## Code boundaries

- `curriculum/family-connections/index.html`: compact public information hierarchy and read-only contract.
- `curriculum/family-connections/family.css`: family layout, disclosures, compact cards, responsive and print states.
- `curriculum/family-connections/family-app.js`: disclosure-aware library rendering and single-class control visibility.
- `curriculum/family-connections/shared/render.js`: concise homework card rendering with progressive details.
- `curriculum/family-connections/teacher/index.html`: two-column publisher shell and optional native disclosures.
- `curriculum/family-connections/teacher/teacher.css`: compact teacher workspace, sticky preview, responsive states.
- Existing family, teacher, model, and API tests: lock the read-only boundary and required teacher controls.

No dependency, lockfile, schema, secret, environment variable, deployment binding, or production data change is required.

## Verification

- Run the family static contract, shared model tests, teacher static contract, and API tests.
- Run formatter/linter checks on changed files, repository build, and relevant static validators.
- Browser-test family and teacher views at desktop, Chromebook, and phone sizes.
- Verify no public editing affordance, contenteditable node, teacher link, horizontal overflow, console error, or broken family action remains.
- Verify unauthenticated teacher/draft/history requests still fail while the published endpoint remains public.

## Non-goals

- No automatic messaging, contact storage, family submissions, grading, translation service, or direct Canvas/ClassDojo API synchronization.
- No changes to lesson content, curriculum data, authentication provider, or deployment configuration.
- No production deployment without a separate explicit authorization.

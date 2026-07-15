# Family Connections Publishing Platform — Design Specification

**Date:** 2026-07-15  
**Status:** Approved for implementation  
**Public route:** `/curriculum/family-connections/`  
**Teacher route:** `/curriculum/family-connections/teacher/`

## Product outcome

Family Connections becomes two focused experiences backed by one curriculum source of truth:

1. **Family Mode** is a public, phone-first weekly resource page. Families can see the current week, open assigned family homework, use language and accessibility supports, reach safe AI learning help, and continue a conversation in ClassDojo or Canvas.
2. **Teacher Mode** is a protected publishing workspace. Mr. Neft can organize lesson numbers by class section and weekday, edit family-facing homework information, maintain announcements and resource links, preview the exact public experience, and publish a version deliberately.

The system stores curriculum publishing configuration, not family or student records. Family participation is never graded, tracked, or scored.

## Chosen architecture

The existing static workspace is refactored into two routes with shared, dependency-free modules. The curriculum manifest remains the canonical catalog for all existing and future lessons. A small Cloudflare Pages Function persists draft and published configuration in the repository's existing D1 binding.

```text
curriculum manifest ──► shared lesson adapter ──► Family Mode
                                   ▲                 ▲
                                   │                 │ published snapshot only
Teacher Mode ──► draft API ──► D1 versioned state ──┘
```

No new framework, package, external SDK, environment binding, or deployment setting is introduced. If D1 is unavailable, Family Mode still renders every manifest homework with safe defaults; Teacher Mode reports that publishing is unavailable and retains the current draft in the page until it can be saved.

## Route contract

### `/curriculum/family-connections/`

Public Family Mode. It never presents teacher editing controls and never requires sign-in. The first viewport prioritizes the selected class section's weekly overview and the family's next useful action.

### `/curriculum/family-connections/teacher/`

Protected Teacher Mode. The existing site middleware recognizes the `teacher` path and requires the established site sign-in. The interface must not claim protection is active if the site sign-in is unavailable.

### `/curriculum/family-connections/family/`

Backward-compatible redirect to the canonical public route so saved links continue to work.

## Content model

The persisted state is a strictly validated JSON document with `draft`, `published`, and bounded publication history. Each snapshot contains:

- a schema version and revision;
- public class sections with stable IDs, display labels, visibility, and one default section;
- a weekly plan with week label, start date, short family note, and Monday-Friday slots;
- each slot's lesson ID, optional label, and status: lesson, review, no class, or assessment;
- homework overrides keyed by manifest lesson ID;
- family announcements and supplemental resources;
- approved ClassDojo and Canvas destinations.

Homework overrides may set a family-facing title, directions, estimated time, materials, language support, supplemental links, and visibility. They never replace or duplicate the canonical lesson URL, standard, objective, or generated homework path. This merge-by-ID design automatically includes new manifest lessons without a migration.

Only public classroom labels are permitted. The model has no student name, family name, email, phone, recipient, message history, response, grade, or attendance field.

## Draft, preview, and publish flow

Teacher Mode has an unmistakable publication status and one publishing state machine:

1. **Edit draft:** changes are saved to the private draft endpoint after validation.
2. **Preview:** the teacher sees the exact public layout using the draft snapshot, clearly marked “Preview — not live.”
3. **Publish:** an explicit confirmation promotes the complete draft to `published`, increments its revision, records the timestamp, and adds the prior published version to bounded history.

Public requests can read only the published snapshot. Draft and history endpoints require teacher access. Publishing is an atomic snapshot operation so families never see a partially updated week.

## Family Mode experience

### This week

The default section's overview is first. A family can switch among public sections without a student identifier. Each weekday shows the posted lesson number, title, concise family note, and links to the lesson and family homework when available. Review, assessment, and no-class days are explicit.

### Family homework library

Every manifest lesson with an existing homework resource appears unless a published override hides it. Families can search by lesson number or topic and filter by unit. Cards use teacher-edited family copy when published and safe manifest-derived defaults otherwise. Homework opens with a descriptive label; no answer keys are linked.

### Learning and communication supports

Family Mode includes English and Spanish labels for essential actions, browser read-aloud when available, text-size controls, high contrast, visible focus, reduced-motion support, and plain-language directions. AI support is framed as coaching that asks questions and explains ideas, never as an answer generator. The page links to approved EduWonderLab AI guidance rather than collecting prompts or student work.

ClassDojo is the primary conversation handoff. Canvas is shown when configured as a course or observer destination. Neither integration claims a message was sent or a response was received.

## Teacher Mode experience

Teacher Mode is a compact publishing console with four work areas:

- **Weekly overview:** select a section and week, assign lesson numbers to weekdays, and add one short family note.
- **Homework editor:** search all manifest lessons, edit the permitted family-facing fields, control visibility, and add validated supplemental HTTPS links.
- **Announcements and resources:** maintain short public updates and approved support links.
- **Publishing and integrations:** preview, publish, inspect recent versions, configure ClassDojo and Canvas URLs, and generate Canvas-ready copy.

Forms use explicit labels, character counts, inline validation, predictable save states, and unsaved-change protection. Keyboard use is complete; controls are at least 44px high; body text is at least 16px.

## ClassDojo and Canvas interoperability

### ClassDojo

Teacher Mode stores only an approved ClassDojo destination URL. Family Mode's action opens that destination. Message composition remains in ClassDojo, so EduWonderLab stores no family messages or identifiers.

### Canvas now

Teacher Mode stores an approved Canvas course or observer URL and provides:

- “Copy Canvas announcement” as plain text and accessible HTML;
- “Copy weekly module links” using stable EduWonderLab lesson and homework URLs;
- a versioned JSON export of the published weekly plan and homework overrides;
- “Open Canvas” beside copied content for deliberate teacher posting.

The copy is suitable for a Canvas announcement visible to students and observers and for module external-URL items. Section IDs, dates, lesson IDs, stable URLs, and revision metadata remain platform-neutral.

### Canvas later

A future server-side connector may map section IDs to Canvas course sections, publish announcements, and create or update module external-URL items. It must use server-side access and the same validated snapshot contract. This release has no Canvas credential field in the browser.

## API and security contract

The Pages Function exposes:

- `GET /api/family-connections/published` — public, published snapshot only;
- `GET /api/family-connections/draft` — teacher access required;
- `PUT /api/family-connections/draft` — teacher access required, validated full draft;
- `POST /api/family-connections/publish` — teacher access required, atomic promotion;
- `GET /api/family-connections/history` — teacher access required, bounded recent snapshots.

Protected requests reuse the established same-origin teacher-access mechanism and an optional automation header already supported by repository APIs. Protected endpoints fail closed when access control is not configured. Cross-origin access is restricted to the production origin and local development origins.

Validation rejects unknown top-level fields, overlong strings, invalid lesson IDs, unsupported statuses, duplicate section IDs, missing default sections, unsafe external URLs, and oversized request bodies. Published responses exclude draft and history data and use a short cache with revalidation. Teacher responses use `no-store`.

The D1 table is created idempotently on first access. It stores a singleton state row and bounded publication history. Updates use optimistic revision checks to prevent silent overwrite from two teacher tabs.

## Accessibility, language, and equity

- Semantic landmarks, skip links, logical headings, associated labels, live regions, and visible focus are required.
- Layout remains complete and readable from 320px through desktop widths and at 200% browser zoom without horizontal content loss.
- Essential family actions have reviewed Spanish labels and concise plain-language English. Teacher-authored language support is displayed as authored; the interface never claims it was automatically translated.
- WIDA and ESOL support uses short sentences, concrete verbs, optional sentence frames, and audio where supported.
- Every home activity includes an equivalent school option. Lack of family time, internet, language access, or an adult partner cannot reduce a student's grade or access.
- No answer keys, teacher notes, or protected student data appear in public markup, API payloads, exports, or links.

## Failure behavior

- Manifest failure: show a retry message and published weekly notes; never fabricate lesson links.
- Published API failure: use manifest-derived homework defaults and identify the weekly schedule as temporarily unavailable.
- Draft save conflict: preserve the local form, explain that a newer revision exists, and offer reload; never overwrite silently.
- Clipboard failure: keep the generated Canvas content selected and provide a manual-copy instruction.
- Speech API absence: hide read-aloud controls without reducing content access.
- Invalid integration URL: do not render the public action and show a teacher validation error.

## File boundaries

- `curriculum/family-connections/index.html` — Family Mode shell.
- `curriculum/family-connections/family.css` — Family Mode responsive visual system.
- `curriculum/family-connections/family-app.js` — Family Mode orchestration.
- `curriculum/family-connections/teacher/index.html` — protected Teacher Mode shell.
- `curriculum/family-connections/teacher/teacher.css` — Teacher Mode console and preview styling.
- `curriculum/family-connections/teacher/teacher-app.js` — Teacher Mode orchestration.
- `curriculum/family-connections/shared/model.js` — manifest normalization, snapshot defaults, merge rules, and Canvas export helpers.
- `curriculum/family-connections/shared/api-client.js` — same-origin API client and conflict errors.
- `functions/api/family-connections/domain.js` — server validation and normalization helpers.
- `functions/api/family-connections/[[path]].js` — D1 persistence and HTTP routing.
- Targeted Node and Playwright tests — model, API, privacy, access, responsive, and publish-flow contracts.

Legacy static modules are removed only after their behavior is migrated or intentionally retired. Hub links point families to Family Mode and teacher-only areas to Teacher Mode.

## Verification and release gates

- Unit tests: manifest merge, automatic future lesson inclusion, snapshot validation, URL policy, protected access, optimistic revision checks, publish promotion, and Canvas exports.
- Static tests: both routes, protected path convention, redirect, hub links, semantic landmarks, no answer-key links, and no credential fields.
- Browser tests: public fallback, section switching, homework search, Teacher Mode edit/preview/publish with a controlled API, clipboard fallback, keyboard flow, 320px, 390px, 1024px, and 1440px layouts, and 200% zoom-equivalent viewport.
- Repository checks: targeted tests, lint/check, aggregate tests, static validation, build, final QA gate, and focused diff review.
- Live checks: public route returns 200 without sign-in; teacher route rejects unauthenticated access; public API returns only the published contract; build stamp matches the deployed commit.

## Non-goals for this release

- No automatic Canvas writes.
- No ClassDojo API, scraping, or sync.
- No family accounts, inbox, private messaging, read receipts, or response tracking.
- No student roster, grades, attendance, behavior data, family contact database, or engagement scoring.
- No machine translation of teacher-authored text.

# Family Connections Section Manager and Scheduling Secretary

**Date:** 2026-07-16  
**Public route:** `/curriculum/family-connections/`  
**Protected teacher route:** `/curriculum/family-connections/teacher/`

## Goal

Make class-section management obvious and complete, then upgrade the existing one-time meeting-slot tool into a built-in scheduling secretary. The teacher sets reusable availability. Families choose an open time and receive an immediate booking confirmation. Private contact and meeting data remain available only in protected Teacher Mode.

## Existing Foundation

Family Connections already provides:

- a protected draft, preview, and publish workflow for family-page content;
- section renaming through the public-label field and section creation through an add button;
- D1-backed meeting slots and requests with optimistic concurrency protection;
- overlap prevention, public-safe availability, a protected teacher dashboard, private invitation links, and Canvas availability synchronization.

This change preserves those paths while making section management explicit and extending scheduling from manually posted individual times to reusable availability rules and auto-confirmed bookings.

## Section Manager

Teacher Mode will show a dedicated section manager at the top of the weekly-plan editor.

Each section row contains:

- an editable public name;
- an “Editing” indicator for the active section;
- a “Default” control;
- a delete action.

The manager also provides an “Add section” field and button. New sections receive a stable generated ID derived from the name plus a collision-safe suffix; future renaming changes only the label, not the ID. This preserves saved links and Canvas feeds.

Deletion rules:

- deletion requires an explicit confirmation naming the section;
- the last remaining section cannot be deleted;
- deleting the default section makes the first remaining visible section the default;
- deleting the active section selects the replacement before rerendering;
- deletion remains a draft change until Save and Publish, consistent with every other family-page edit;
- the confirmation explains that publishing removes the section from the family selector and its section-specific Canvas feed.

Server normalization remains the final authority: one to twelve sections, unique IDs, at least one visible section, and exactly one effective default.

## Scheduling Secretary

### Availability rules

Teacher Mode will replace the single-slot-first workflow with an “Availability rules” workspace while retaining one-off time creation as an advanced option.

An availability rule includes:

- selected weekdays;
- local start and end time;
- active start and end date;
- meeting duration: 15, 20, 30, 45, or 60 minutes;
- buffer between meetings: 0, 5, 10, or 15 minutes;
- format: video, phone, or in person;
- a family-safe location label;
- enabled/paused status.

All teacher-entered rule times are interpreted in `America/New_York`. Slot generation is date-based and timezone-aware so daylight-saving changes do not shift the displayed local hour.

Rules generate a rolling 42-day window of concrete slots. Generation is idempotent: the same rule and start time produce the same stable slot key, so refreshing or editing does not create duplicates. Existing booked or cancelled records are never silently replaced. A rule edit affects only future unbooked slots generated after the edit.

The teacher can create, edit, pause, resume, or delete a rule. Deleting a rule removes only its future open slots; confirmed bookings remain intact. The dashboard also supports blocking or removing an individual open time.

### Family booking

The public family page displays only open future slots. A family chooses a time and submits:

- parent, guardian, or caregiver name;
- student first name only;
- reply email;
- an optional short note;
- the existing privacy/consent acknowledgement.

Submitting a still-open slot atomically changes it to booked and creates a confirmed booking. The response includes a short public-safe confirmation reference plus the selected date, time, duration, format, and location label. It never returns another family’s data.

The confirmation screen clearly states that the meeting is booked, offers “Add to calendar,” and allows the family to return to the family page. The generated `.ics` download contains meeting time, duration, format, location label, and the Family Connections URL, but no student name or private note.

If two families submit the same slot concurrently, only the first transaction succeeds. The second receives a clear “That time was just booked” message and refreshed availability.

### Teacher meeting desk

The protected dashboard separates:

- Upcoming confirmed meetings;
- Open availability;
- Past, completed, declined, and cancelled records.

Teacher actions include cancel meeting, mark complete, block/remove open time, refresh slots, and copy or download the calendar event. Cancelling a confirmed meeting does not automatically reopen the time; the teacher can deliberately restore or regenerate availability.

The existing private invitation-link workflow remains available for teacher-initiated scheduling. Invitations continue to require family acceptance because they were not chosen directly by the family.

## Persistence and API

The existing `family_meeting_scheduler_state` D1 record remains the canonical scheduler store and expands from `{ slots, requests }` to:

```json
{
  "availabilityRules": [],
  "slots": [],
  "requests": []
}
```

Older records normalize with an empty `availabilityRules` array. The current revision compare-and-swap update remains in place for concurrency safety.

Protected endpoints:

- `GET /api/family-connections/schedule-dashboard`
- `POST /api/family-connections/schedule-rule`
- `PUT /api/family-connections/schedule-rule`
- `DELETE /api/family-connections/schedule-rule`
- `POST /api/family-connections/schedule-refresh`
- existing slot, decision, invitation, Canvas, draft, and publish endpoints

Public endpoints:

- `GET /api/family-connections/schedule-availability`
- `POST /api/family-connections/schedule-request`
- `POST /api/family-connections/schedule-response`

All state-changing endpoints enforce body-size limits, normalized enumerations, bounded text fields, future-date limits, teacher authentication where required, and no-store responses. Public output uses an explicit allowlist.

## Notifications and External Services

This release does not add an email provider or store new credentials. Families receive immediate on-screen confirmation and an `.ics` calendar download. The teacher sees bookings live in the protected meeting desk and can use the existing Canvas availability sync.

Outbound confirmation or reminder email can be added later through a separately configured transactional-email service without changing the booking model.

## Accessibility and Family Communication

- All controls have persistent labels, visible focus states, keyboard operation, and live status messages.
- Destructive actions are never represented by color alone.
- The family booking flow remains available in English and Spanish, with plain-language directions and first-name-only privacy guidance.
- Dates include weekday, month, day, time, and Eastern Time; duration and format are written out.
- Mobile layouts use one-column forms, large touch targets, high contrast, and no horizontal scrolling.
- Reduced-motion preferences are respected.

## Error Handling

The UI must recover clearly from:

- a stale draft revision;
- deleting the last section;
- duplicate section IDs;
- invalid or empty section names;
- invalid availability ranges or unsupported durations/buffers;
- rules that generate no usable times;
- past times;
- overlapping generated or one-off slots;
- a slot booked by another family during submission;
- unavailable D1 storage or an expired teacher session.

No failure may erase the teacher’s unsaved section edits or a family’s typed contact form without a successful booking.

## Testing and Acceptance Criteria

Automated tests will cover:

- add, rename, default, and delete section behavior;
- last-section and default-reassignment safeguards;
- server normalization after section deletion;
- Eastern-time recurring slot expansion across daylight-saving boundaries;
- idempotent generation and rule edits;
- overlap and concurrent-booking rejection;
- auto-confirmed family booking and public-response allowlisting;
- protected rule/dashboard endpoints;
- legacy scheduler-state compatibility;
- bilingual confirmation copy and privacy text;
- static HTML contracts and accessible control labels.

Browser QA will verify:

- section add, rename, switch, default, delete, save, preview, and publish paths;
- recurring availability creation and generated-slot display;
- family booking, immediate confirmation, `.ics` download, and disappearance of the booked slot;
- protected teacher data and unauthenticated API rejection;
- keyboard operation, mobile layout, focus order, live regions, contrast, and no horizontal overflow.

Production acceptance requires all repository tests and validations, the production build, guarded synchronization onto current `origin/main`, guarded deployment, and independent live verification of both teacher and family routes.

## Out of Scope

- collecting grades, student IDs, or full student names;
- public access to contact details or meeting notes;
- automatic outbound email/SMS reminders;
- two-way Google, Outlook, or Apple Calendar account authorization;
- changing the existing Teacher Mode authentication system;
- deleting the final class section.

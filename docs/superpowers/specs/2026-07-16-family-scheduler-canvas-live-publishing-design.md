# Family Scheduler, Canvas Connection, and Live Publishing Design

## Goal

Turn Family Connections into a calm two-sided meeting and communication system. Families can see current learning, open ClassDojo, and request a teacher-published meeting time. The protected teacher workspace controls availability, requests, invitations, publication, and direct Canvas actions.

## Experience Direction

The family page remains a concise, editorial family guide rather than becoming an administrative dashboard. Meeting availability appears in one clearly labeled section with large time cards, plain-language status, and a short request form. The teacher page gets a compact scheduling console designed for repeated weekly use.

## Public Family Experience

- Restore the configured ClassDojo destination even when it is the ClassDojo home URL.
- Add a `Meet with Mr. Neft` quick-navigation destination and page section.
- Show only future open appointment slots, grouped by local date and labeled in Eastern Time.
- Each slot shows start time, duration, and meeting format. Private meeting URLs and family details never appear publicly.
- A family can request one slot using guardian name, student first name only, email, and an optional short note.
- The form explains that a request is not confirmed until the teacher approves it.
- The API returns a short reference code, not stored family details.
- A teacher-generated invitation link lets a family accept or decline one proposed time without signing in. Tokens are random, hashed at rest, single-purpose, and expire.
- All controls have explicit labels, keyboard focus states, readable contrast, and concise English/Spanish interface copy.

## Teacher Scheduling Console

- Create availability using date, start time, duration, meeting format, and a family-safe location label.
- List open, held, confirmed, declined, cancelled, and completed meetings in useful status groups.
- Confirm or decline family requests. Declining reopens an eligible future slot; confirming books it.
- Cancel or complete a meeting without deleting its audit record.
- Propose a time to a family and generate a secure response link that can be copied into ClassDojo or email.
- Contact information and student first names are visible only behind the existing teacher password gate.
- No family last names, student IDs, grades, or academic records are collected.

## Data and API Design

Use the existing Cloudflare D1 binding and Family Connections API. Schema creation remains idempotent at request time, matching the current family-publishing store.

Tables:

- `family_meeting_slots`: public-safe availability and lifecycle status.
- `family_meeting_requests`: protected contact details, request status, source, and hashed invitation token metadata.
- `family_canvas_meeting_sync`: Canvas event IDs keyed to local slot IDs; no Canvas credentials.

Public endpoints expose only open slot fields and accept validated requests or invitation responses. Teacher endpoints use the existing fail-closed Basic Auth middleware. Slot claims are transactional so two families cannot reserve the same time.

## Direct Canvas Connection

- The teacher enters a Canvas course URL and personal access token in the protected page.
- The token is held only in the in-memory page session and sent only to the protected same-origin API for an action. It is never saved in D1, snapshots, downloads, logs, local storage, or source control.
- Canvas hosts are restricted to `*.instructure.com` plus an optional deployment allowlist for custom school domains.
- `Test connection` returns only sanitized course identity.
- `Publish weekly update` creates a Canvas announcement from the current published Family Connections snapshot.
- `Sync appointment availability` creates or updates course calendar events for open meeting slots and links families back to the scheduler.
- Existing copy/feed/download options remain available as fallbacks.

## Live Publishing Repair

- Change the public published-snapshot response from a 60-second shared cache to `no-store`.
- Fetch the snapshot with `cache: "no-store"`.
- While the family page is open and visible, poll periodically for a higher revision.
- Re-render only publication-driven sections when a newer revision arrives, preserve search/filter/form state, and announce `Family page updated` through the existing status region.
- Pause polling while the tab is hidden and refresh immediately when it becomes visible again.

## Error Handling and Safety

- Validate all text lengths, enums, dates, email format, HTTPS URLs, state transitions, and request sizes server-side.
- Use parameterized D1 queries and generic public error messages.
- Reject past slots, overlapping active slots, duplicate requests, reused/expired tokens, unsafe Canvas hosts, and unsupported Canvas actions.
- Never return protected request records from public endpoints.
- Preserve records through status changes instead of destructive deletion.
- If Canvas is unavailable, scheduling and family publishing continue to work normally.

## Verification

- Domain tests for validation and state transitions.
- API tests for authorization, public data minimization, atomic slot claims, invitation tokens, and Canvas token non-persistence.
- Canvas client tests with an injected fake fetch.
- Static contracts for family and teacher UI.
- Browser tests at desktop and 390px widths, including keyboard/form behavior and live refresh.
- Full repository tests, production build, static deployment validation, guarded deploy, and live route checks.

## Scope Decision

This release provides secure request/response links and direct Canvas actions. Automatic email/SMS delivery is intentionally excluded because no transactional messaging provider is configured; the teacher can copy invitation links into ClassDojo or email immediately.

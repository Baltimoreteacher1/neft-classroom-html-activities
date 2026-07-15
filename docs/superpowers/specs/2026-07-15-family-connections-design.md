# Family Connections — Design Specification

**Date:** 2026-07-15
**Branch:** `feature/family-connections-hub`
**Goal:** Add a privacy-first Family Connections workspace to the EduWonderLab curriculum that helps Mr. Neft communicate with families, connect them to existing supports, and turn family participation into useful classroom momentum.

## Product position

Family Connections is a teacher-facing bridge between the existing curriculum and families. It is not a contact database, automated surveillance system, translation service, or replacement for Outlook/ClassDojo. It helps the teacher compose a strong message once, choose a relevant curriculum resource, and move the finished message into the family's preferred channel.

The canonical route is `/curriculum/family-connections/`. It is linked from:

- the featured resources strip on `/curriculum/`;
- the compact Teacher Tools section on `/curriculum/`;
- the Start Here cards and searchable directory on `/teacher-tools/`.

## Experience architecture

The hub has five connected work areas on one responsive page:

1. **Today / Quick Start** — Choose a common communication goal and jump directly into a preconfigured message: positive connection, learning check-in, missing work, homework support, family invitation, or weekly update.
2. **Message Studio** — Enter only the minimum temporary context, generate an editable subject and message, attach a selected curriculum support link, copy it, open a prefilled Outlook message, or copy and open ClassDojo.
3. **Family Resource Navigator** — Search and filter existing EduWonderLab family resources, including per-lesson family homework, family support pages, Family Mode, the AI Learning Hub parent guide, guided notes, student-help pages, Math Workbench, and the Student Digital Mailbox.
4. **Engagement Lab** — Ready-to-use routines that make families contributors rather than homework police: Home-to-Class Relay, Family Interview, Explain-It-Back, Real-Life Math Hunt, Confidence Check, and Celebration Snapshot.
5. **Connection Planner** — A local-only follow-up board for planning the next contact and maintaining a positive-to-concern communication balance. It never sends automatically and stores no email addresses.

## Message Studio behavior

The teacher selects a purpose, tone, family language mode, student first name or initials, class/period, lesson, due date, optional context, and a resource. The page generates an editable subject and body from educator-written templates.

Templates follow these invariants:

- Lead with partnership and a specific student strength whenever appropriate.
- Describe observable work or learning evidence, not character or intent.
- Give one clear next action and one realistic way the family can help.
- Avoid jargon, blame, threats, diagnosis, hidden answer keys, or claims about automated translation.
- Keep messages scannable on a phone and suitable for WIDA/ESOL families.
- Never send without the teacher's deliberate action.

Language modes are English, Spanish + English, and plain-language English. Spanish copy is limited to reviewed fixed template text; teacher-entered details remain visibly marked for review rather than being falsely presented as translated.

Delivery actions:

- **Open in Outlook:** create an `outlook.office.com/mail/deeplink/compose` URL containing the current subject and body. The recipient is chosen inside Outlook so family addresses do not enter EduWonderLab or browser history.
- **Copy + open ClassDojo:** copy the message, then open `teach.classdojo.com` in a new tab. If clipboard access fails, keep the message selected and show a manual-copy instruction.
- **Copy for another channel:** copy a clean text version suitable for Canvas, Remind, TalkingPoints, or SMS.
- **Print/save:** use the browser print flow for a conference note or paper communication record.

## Curriculum integration

The Resource Navigator reads `/data/curriculum-manifest.json`, the existing generated lesson source of truth. It does not duplicate the 74-lesson catalog. Each lesson result exposes the resources that actually exist:

- Family Homework: `/lessons/{id}/homework.html`
- Family Support Page: `/lessons/{id}/family/`
- Interactive Lesson: `/lessons/{id}/`
- Guided Notes: `/lessons/{id}/notes.html`
- Student Help: `/lessons/{id}/student-help/`

Global cards link to `/curriculum/?view=family`, `/curriculum/ai-hub/#parents`, `/curriculum/math-workbench/`, and `/curriculum/student-digital-mailbox/`. Missing optional lesson resources are not rendered.

Selecting a lesson in Message Studio automatically offers its available family homework and support links. Selecting a resource adds a short, human-readable call to action and the direct URL to the message preview.

## Family engagement routines

Engagement Lab routines are short, equitable, and usable by an adult, older sibling, mentor, or after-school staff member. Every routine includes an in-school alternative so a student is never penalized when a family member is unavailable.

- **Home-to-Class Relay:** the family contributes an estimate, example, story, or question that becomes an ingredient in the next class activity.
- **Family Interview:** the student asks one real-life question connected to the lesson and brings back the response.
- **Explain-It-Back:** the student explains one strategy; the listener chooses “clear,” “almost,” or “one question.” Correctness is checked at school, not by the adult.
- **Real-Life Math Hunt:** find and describe one safe household or community example without uploading identifying photos.
- **Confidence Check:** family and student choose a confidence level and one support they want next.
- **Celebration Snapshot:** the student names progress and the family adds one encouraging sentence.

Each routine can generate a family-facing invitation and a classroom-facing follow-up prompt.

## Privacy, safety, and accessibility

- No family email addresses, phone numbers, student last names, Outlook tokens, or message history are sent to or stored by EduWonderLab.
- Student context and planner state use `localStorage` only after an explicit “Save on this device” action; the default session is ephemeral. A visible Clear button removes saved state.
- Outlook and ClassDojo open as external destinations with clear labels.
- Concern messages require a review checkbox before the external delivery actions enable.
- The UI uses semantic landmarks, labels, keyboard navigation, visible focus states, ARIA live status, high contrast, 16px+ body text, reduced-motion support, and a print layout.
- Family-facing generated copy uses short paragraphs, concrete verbs, one action at a time, and no answer keys.

## File boundaries

- `curriculum/family-connections/index.html` — semantic page shell and work-area markup.
- `curriculum/family-connections/styles.css` — responsive, accessible, print-friendly design.
- `curriculum/family-connections/templates.js` — canonical message templates, engagement routines, and global resource definitions.
- `curriculum/family-connections/app.js` — state, rendering, curriculum-manifest adapter, Outlook/ClassDojo handoff, copy/print, and local-only planner behavior.
- `curriculum/index.html` — one featured card and one Teacher Tools link.
- `teacher-tools/index.html` — one Start Here card and one searchable directory card.
- `data/routes.json` — route registry entry.
- `tools/validate-curriculum-hub.mjs` and targeted tests — route/card/resource invariants.

No dependency, lockfile, backend, secret, environment variable, deployment setting, or production data changes are required.

## Error handling and graceful degradation

- If the curriculum manifest fails to load, global resources, the composer, and engagement routines remain available; the lesson picker shows a clear retry state.
- If clipboard access fails, the editable message remains visible and receives focus for manual copying.
- If an Outlook URL would exceed a conservative browser limit, the hub copies the message and opens a blank Outlook compose window with a clear status notice.
- If local storage is unavailable, the planner works for the current session and explains that it was not saved.
- External links never imply that a message was sent; success language says “opened,” “copied,” or “prepared.”

## Verification

- Unit-style browser tests for template generation, resource-link insertion, URL encoding, review gating, clipboard fallback, local-only planner persistence, and manifest failure.
- Static checks for the new route, all entry cards, valid local links/assets, semantic landmarks, viewport/title/lang, and no answer-key text.
- Responsive browser QA at desktop, Chromebook/tablet, and phone widths; keyboard-only flow and reduced-motion check.
- Run `npm run validate`, `npm run build`, and the repo Codex verification script when feasible.

## Non-goals

- No automatic sending, delivery tracking, read receipts, bulk contact import, family response collection, or student grading based on family participation.
- No Microsoft Graph, OAuth, Power Automate, Cloudflare email worker, or ClassDojo API integration.
- No automated translation of teacher-entered content.
- No production deployment in this task.

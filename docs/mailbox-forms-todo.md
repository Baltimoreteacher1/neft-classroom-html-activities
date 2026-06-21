# Student Digital Mailbox — Google Forms (status + manual rebuild kit)

> **Bottom line (2026-06-21 audit):** All mailbox boxes are **already LIVE**. There
> is **no pending Forms work**. The Google Drive / Apps Script API cannot create
> Google Forms in this environment, but the Forms were already created (once,
> manually, by running the Apps Script in this doc) and their responder URLs are
> already wired into
> [`curriculum/student-digital-mailbox/mailbox-links.js`](../curriculum/student-digital-mailbox/mailbox-links.js).
>
> This document exists as the **single source of truth + disaster-recovery kit**:
> if a Form is ever deleted, lost, or needs to be recreated for a new class, run
> the paste-and-run script ([`teacher-tools/post-forms/setup-mailbox-forms.gs`](../teacher-tools/post-forms/setup-mailbox-forms.gs))
> or rebuild by hand from the exact question lists below, then paste the new
> responder URL into the placeholder line shown for that form.

## Why "6 pending forms" was stale

Earlier notes said "6 Forms still pending." That was the state on the day the
feature first shipped (2026-06-14). It is no longer true:

- There are only **4 private Forms** in this feature, not 6 (the other 4 boxes
  are collaborative Sheets/Doc/Slides, which are not Forms).
- All 4 Forms were created and wired live in commit `17f31eba`
  ("all 8 boxes live").

Verified current state of all 8 boxes (`mailboxLinkReady()` = real `https://` URL):

| Box                | `mailbox-links.js` key | Type            | Status |
| ------------------ | ---------------------- | --------------- | ------ |
| Class Check-In     | `classCheckIn`         | Google **Form** | LIVE   |
| I'm Confused       | `confused`             | Google **Form** | LIVE   |
| Private Note       | `privateNote`          | Google **Form** | LIVE   |
| Anonymous Question | `anonymousQuestion`    | Google **Form** | LIVE   |
| Suggestion Box     | `suggestion`           | Google Sheet    | LIVE   |
| Shout-Out          | `shoutOut`             | Google Sheet    | LIVE   |
| Class Idea Doc     | `classIdeaDoc`         | Google Doc      | LIVE   |
| Idea Wall          | `ideaWall`             | Google Slides   | LIVE   |

> A button never breaks on a missing link: if a key's value is not a real
> `http(s)://` URL, `mailboxLinkReady()` renders a safe disabled
> "Link coming soon" state.

---

## Apps Script approach: VIABLE (and already used)

A paste-and-run Apps Script using the `FormApp` service **is** the correct and
only programmatic path — the Drive/Forms REST API cannot create Forms here, but
`FormApp` inside Apps Script can. The working script that originally built these
4 Forms now lives in-repo at:

- **[`teacher-tools/post-forms/setup-mailbox-forms.gs`](../teacher-tools/post-forms/setup-mailbox-forms.gs)** — extracted/trimmed to JUST the form-builder.

### How to run it

1. Sign in to Google as **neftjd@gmail.com** (the owner of the "Student Digital
   Mailbox" Drive folder, ID `1NGNJCslmlYZdZV33IrD4zRlpqo0Zk0yP`). Use the
   **personal Gmail** account, not the BCPS Workspace account — a Workspace
   account can force responders to sign in, breaking anonymity.
2. Go to <https://script.google.com> → **New project**.
3. Delete the default `Code.gs` contents and paste the full contents of
   `teacher-tools/post-forms/setup-mailbox-forms.gs`.
4. Run **`setupMailboxForms`**. Approve the OAuth scopes when prompted
   (Forms, Drive, Spreadsheets).
5. Open **View → Logs** (or Executions). The script logs one line per form:
   `classCheckIn → https://docs.google.com/forms/d/<NEW_ID>/viewform`.
6. Paste each logged responder URL into the matching key in `mailbox-links.js`
   (see placeholder lines below), then bump the `?v=YYYY-MM-DD` cache-bust date
   on the `<script src="...mailbox-links.js?v=...">` tag in **both**
   `curriculum/student-digital-mailbox/index.html` and `.../teacher/index.html`.
7. In Google Drive, set each new Form's sharing to **Anyone with the link** so
   students can open it without signing in. (No API can set this for you; do it
   by hand. `FormApp.setRequireLogin()` is Workspace-only and throws on personal
   Gmail — the script does not call it.)

The script is **safe to re-run**: a form already present in the folder (matched
by title) is skipped, so re-running will not create duplicates.

> Do not invent Drive IDs. The only known, real ID is the folder ID above. New
> Forms get fresh IDs at creation time — read them from the script's log.

---

## The 4 Forms — exact contents

Every form is **anonymous** (email collection OFF, no sign-in, not limited to one
response) and carries this safety footer in its description:

> _This form is for class ideas, questions, and feedback. You do not have to give
> your name. If someone is in danger or needs help right now, tell an adult
> immediately._

Each form is linked to a response spreadsheet, moved into the Mailbox folder, and
wired to an on-submit email alert to `JDneft@bcps.k12.md.us` (Private Notes marked
"urgent" get a 🚨 flag in the subject).

### 1. Class Check-In — `classCheckIn`

**Purpose:** Let a student privately tell Mr. Neft how class is going for them and
whether they want a follow-up.

| #   | Type            | Question                                    | Options  |
| --- | --------------- | ------------------------------------------- | -------- |
| 1   | Paragraph       | How is math class going for you right now?  | —        |
| 2   | Paragraph       | What is helping you learn?                  | —        |
| 3   | Paragraph       | What is making class hard?                  | —        |
| 4   | Paragraph       | What should Mr. Neft know?                  | —        |
| 5   | Multiple choice | Do you want Mr. Neft to follow up with you? | Yes / No |

Paste responder URL here in `mailbox-links.js`:

```js
  classCheckIn:
    "PASTE_CLASS_CHECKIN_VIEWFORM_URL_HERE",
```

### 2. I'm Confused — `confused`

**Purpose:** Let a student flag exactly what feels confusing and what kind of help
they want.

| #   | Type                  | Question                                                   | Options                                           |
| --- | --------------------- | ---------------------------------------------------------- | ------------------------------------------------- |
| 1   | Paragraph             | What lesson, topic, direction, or assignment is confusing? | —                                                 |
| 2   | Paragraph             | What part did you understand?                              | —                                                 |
| 3   | Paragraph             | Where did you get stuck?                                   | —                                                 |
| 4   | Paragraph             | What would help you next?                                  | —                                                 |
| 5   | Checkboxes (pick any) | What kind of help would you like?                          | An example / Small group / A video / Partner help |

Paste responder URL here in `mailbox-links.js`:

```js
  confused:
    "PASTE_CONFUSED_VIEWFORM_URL_HERE",
```

### 3. Private Note to Mr. Neft — `privateNote`

**Purpose:** A private channel for anything bothering a student; flags urgency so
Mr. Neft can triage. (Sensitive channel — the insights dashboard exposes counts
and urgent flags only, never free text.)

| #   | Type                            | Question                                                                         | Options                                                      |
| --- | ------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 1   | Paragraph                       | What do you want Mr. Neft to know?                                               | —                                                            |
| 2   | Multiple choice (allow "Other") | Is this about class, work, a classmate, group work, homework, or something else? | Class / Work / A classmate / Group work / Homework / _Other_ |
| 3   | Multiple choice                 | Do you need Mr. Neft to follow up?                                               | Yes / No                                                     |
| 4   | Multiple choice                 | Is this urgent?                                                                  | Yes / No                                                     |

Paste responder URL here in `mailbox-links.js`:

```js
  privateNote:
    "PASTE_PRIVATE_NOTE_VIEWFORM_URL_HERE",
```

### 4. Anonymous Question — `anonymousQuestion`

**Purpose:** A safe way to ask a question they were nervous to ask out loud, and
note whether it would help to answer it for the whole class.

| #   | Type                            | Question                                                                             | Options                                                          |
| --- | ------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| 1   | Paragraph                       | What question do you want to ask?                                                    | —                                                                |
| 2   | Multiple choice (allow "Other") | Is this about math, directions, grades, homework, class routines, or something else? | Math / Directions / Grades / Homework / Class routines / _Other_ |
| 3   | Multiple choice                 | Would it help if Mr. Neft answered this for the whole class?                         | Yes / No                                                         |

Paste responder URL here in `mailbox-links.js`:

```js
  anonymousQuestion:
    "PASTE_ANONYMOUS_QUESTION_VIEWFORM_URL_HERE",
```

---

## The 4 collaborative boxes (not Forms — for reference)

These are shared Google files where contributions are visible to the class (that
is intended). They are already live and need no Form work:

| Box            | Key            | File type | What it is                                         |
| -------------- | -------------- | --------- | -------------------------------------------------- |
| Suggestion Box | `suggestion`   | Sheet     | Running list of class suggestions                  |
| Shout-Out      | `shoutOut`     | Sheet     | Students celebrate each other                      |
| Class Idea Doc | `classIdeaDoc` | Doc       | Shared brainstorming doc (anyone-with-link Editor) |
| Idea Wall      | `ideaWall`     | Slides    | Padlet-style sticky-note wall                      |

If any of these is ever lost, recreate the file by hand in the Mailbox folder,
set it to **Anyone with the link → Editor**, and paste its `/edit` URL into the
matching key in `mailbox-links.js`.

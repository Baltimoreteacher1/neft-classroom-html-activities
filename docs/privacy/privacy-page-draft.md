# Draft: pending legal review

Draft text for the public privacy page. It states what the software does, as of the code in this
repository. It makes no compliance claim and must not be published until reviewed. Statements marked
(check) depend on settings outside this repository.

## What students see and type

- Students join a class with a class code and a nickname (an alias). The alias field refuses entries that
  look like an email address, a web address or a long number. It does not prevent a student from typing a
  real name.

## What is stored on the device

- Progress, drafts, language and display choices are stored in the browser on the student's device
  (`docs/privacy/data-inventory.md` lists every key). Clearing the browser's site data for the site
  removes them.
- The Save/Resume panel and the EduPulse bridge keep a name the student types on the device. Where a
  teacher has set up a class sync, that name can be sent with progress (see the inventory rows for
  `student_progress` and `class_roster`).

## What is stored on our servers for a class

- A class record (code, title, a hash of the teacher's passcode), the aliases of students who joined, a
  hash of each student's key, and the work students sync: progress documents, shared writing, voice
  recordings, live-room answers, assignment status, Book Studio work.
- Teacher passcodes and student keys are stored as salted SHA-256 hashes, not in readable form.
- Class Investigation stores anonymous numbers only; it has no name or free-text field
  (`docs/privacy/class-investigation.md`).

## How long it is kept

- A class that is not used for 120 days is deleted with everything attached to it.
- Live rooms last 6 hours. Shared recordings and voice notes last 30 days.
- A retention job that deletes a class 30 days after June 30 of its school year is written and tested but
  is not yet scheduled (`docs/runbooks/retention.md`). Until it is scheduled this sentence is not true of
  the running site, so it must not be published as is.
- Some tables have no automatic expiry (for example saved activity progress and teacher insight
  snapshots). The inventory lists each.

## Deleting data

- A teacher with the class passcode can delete a whole class, or one student alias, at any time. Deleting
  removes the rows listed in `functions/_lib/privacy/tables.js`.
- Each such deletion adds a receipt that records the class code (or an opaque student id), how many rows
  left each table and when. A receipt contains no name, alias or student work.
- Deleting a student removes the books they own. Items they added to a classmate's shared book stay in
  that book.
- Backups made before a deletion still contain the deleted data until those backups are removed
  (`docs/privacy/restore-policy.md`). (check) Backup retention.

## Logs and analytics

- When a server request fails, the request address (path and query string) and the error are written to
  the server log. (check) Log retention is set in the Cloudflare account.
- Page-view, error and performance counts are stored without a user identifier.

## Notes for the reviewer (not for publication)

- `supports_roster.iep_items` (created lazily by `/api/supports`, teacher-gated) stores per-student IEP item
  labels. That conflicts with the rule of not collecting disability or program labels. It is recorded in
  `shared/privacy/inventory-forbidden-baseline.json` as a reviewed finding, not renamed or removed.
- The class platform deletes by class code. `class_roster`, `class_data_*`, `insight_signal` and the
  results worker keep their own code spaces or have no class link and are not removed by it.
- Save/Resume asks for "first and last name" (`docs/privacy/data-map.md`, F2).

# Our Class Investigation: what is collected

Page: `/curriculum/class-investigation/` · Family card: Home Mission · API: `/api/class-data`

Plain version for families: **the class adds numbers to a shared graph. Nobody's name, and nothing that could tell
who someone is, is ever asked for or stored.**

## Three ways to use it

| Mode | What leaves the device |
| --- | --- |
| **On my own** (no class code) | Nothing. The data lives in this browser only. No request is made. |
| **With my class** (class code) | One anonymous measurement per contribution (below). |
| **Home Mission** (family card) | The same, marked `home`. Needs the class code; optional and never graded. |

## Exactly what is collected

Per contribution, and nothing else (the server rejects any other key with a 400):

- `templateId`: which question the class is on (for example `pencil-handspan`).
- `values`: numbers inside fixed ranges, or one choice from a fixed list. There is **no free-text field**.
  The three shipped questions ask: how a student gets to school (5 choices); steps from the door to the seat and
  from the seat to the board; pencil length and hand span in cm.
- `source`: `class` or `home`.
- `entryId`: a random number made on the device so a resend is not counted twice.
- `contributor`: a salted hash of a random id that lives in one browser. The id itself is never stored.
  The hash is salted per class, so the same browser in two classes cannot be linked, and it only means
  "the same browser", never a person. It is used for a per-device limit and never shown to anyone.
- a server timestamp, used for retention and a per-day column in the teacher export.

**Never asked for or stored:** names, nicknames, initials, student ids, emails, class period, school, IP address,
location, free text, photos, weight, health, body-image data, family income. (Arm span and height are an
*optional* extension a teacher must switch on. It defaults off, and every student may skip both boxes. Keep it off
in a small class, where one extreme value could point at a person.)

The public read (`GET /entries`) returns only `{ id, values, source }`. It returns no contributor hash and no
timestamp.

## What stays on the device

Class code, the random browser id, queued contributions waiting to send, the last copy of the class data (so the
graphs draw offline), and a language choice. Answers typed into the unit tools are practice: they are **never
stored or sent**. Links to the page carry at most a class code, never a response.

## Who can do what

| Action | Who |
| --- | --- |
| Add a contribution, read the class graph | Anyone with the class code (6 characters; the code is the capability) |
| Create a class, choose the active question, stop or restart collecting, export CSV, delete | Teacher only, `x-teacher-key` header |

Contributions are append-only: a row is never edited. Per-device and per-class caps, a size limit and per-IP
throttles bound abuse. If the teacher key or the database is not configured the endpoints answer 503 and the page
falls back to on-my-own mode.

## Retention

A class and all its data are deleted automatically **300 days after its last contribution or teacher action**.
Any teacher action or new contribution restarts the clock, so a class that adds data through the year keeps its
data through Unit 2 in the spring.

## Deletion

- **One question's data:** teacher panel, Delete data…, type the class code. (`POST /purge` with `templateId`.)
- **Whole class:** teacher panel, Delete the whole class. (`POST /purge`, no `templateId`.) Class, questions and
  every contribution are removed.
- **Export before deleting:** Download CSV (`n, day, source, one column per field`; no identifiers).
- **A family asks to remove a single entry:** entries are anonymous, so one cannot be located afterward. The
  teacher deletes that question's data and restarts it.
- Clearing site data in a browser removes everything kept on that device.

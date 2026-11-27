# The live tour (`/tour/`)

A presentable tour of The Language Page that the room can join from their phones.

| Piece | File |
| --- | --- |
| Projector (16 stops on a drawn route, demos, speaker notes) | `tour/index.html` |
| Audience phone page, and the presenter's phone remote | `tour/join/index.html` |
| Stops: map position, builds, notes, phone summary, live link | `tour/stops.js` |
| Questions and the only answers each accepts; reactions | `shared/tour-live/prompts.js` |
| Upgrade Lab item and checker (copies of the lab's own) | `tour/upgrade-check.js` |
| Room API (open, state, join, answer, react, results) | `functions/api/tour-room/[[path]].js` |
| Tests | `functions/api/tour-room/tour-room.test.mjs`, `tools/tour-live.test.mjs` (both in `npm test`), `tools/tour-live-e2e.mjs` (browser; run by hand) |

## Running it

1. Open `thelanguagepage.com/tour/` on the projector. Press **F** for full screen.
2. Press **G** (or **Go live**). The join screen shows a 5-character code and a QR code for `thelanguagepage.com/tour/join`.
3. Optional: **Use my phone as a remote**. Press and hold the blurred code, scan it yourself, and your phone gets
   next and back, your speaker notes, a timer and live answer counts. Anyone holding that code can move the tour;
   **End the room** cancels it.
4. Present as usual. On a stop with a question, phones show it and the projector shows a small live panel; press
   **R** (or click the panel) to reveal the room's answers. **J** shows the join code again.

Keys: → / Space next, ← back, M map, N notes, B black screen, L spotlight, ? help.

## What is stored, and for how long

Only ids from the closed lists in `shared/tour-live/prompts.js`: no names, no free text. A revision typed into the
phone's Upgrade Lab is checked on the phone; only which of the three checks passed is sent. A phone is a random
id it made for itself, used to let it change its answer and to count who is present. The presenter's token is
stored as a hash. A room and everything in it is deleted 6 hours after it opens. Without the D1 binding the room
API answers 503 and the tour runs as a plain presentation.

Screenshots in `tour/shots/` were taken from the live site on 2026-11-26.

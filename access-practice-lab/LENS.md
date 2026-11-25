# My Words, the Language Lens (`/lens`)

One small record per word, kept across the lab: what the learner saw, heard, chose, said and wrote, and which activity it
came from. `/lens` shows it back to the learner. It is a record of what happened, never a score.

**Files**: `src/lang/word-encounters.js` (pure record, merge and summary), `src/views/lens.js` (the page), `lens.css`.
Key: `accessPracticeLab:v1:word-encounters` (so the Passport code carries it; `src/store.js` merges it on import).
Tests: `node --test tools/word-encounters.test.mjs tools/word-encounters-import.test.mjs`; browser: `node tools/lens-e2e.mjs`.

**What is stored**: per word (or short phrase of up to three words, like "unit rate"), a counter for each kind (`saw`, `heard`, `chose`, `said`, `wrote`), a counter per source
activity, the first and last day, and up to 8 dated tested events (`chose`, `said`, `wrote`) with whether help was open and
whether it was right. No sentence, recording, score or level exists in the record; the shape has nowhere to put one.

**Rules** (each pinned by a test):

- Seeing or hearing a word is never using it. Only `said` and `wrote` are productive.
- Only tested events schedule a review, by the ledger's own rule (`reviewSchedule`: 1, 3, 7, 14 days, a miss or a
  supported try resets), so a word and an error pattern come due the same way. Word Lab's garden keeps its own events for
  its own cards; the Lens is the cross-activity view.
- An encounter made with a support open (frames, hints, a coach) is supported, not independent.
- The page shows counts and word lists. It has no level, rank, streak, percent or "mastered", and says it is a record.
- Merging a backup takes the larger counter per word and source, so importing the same backup twice changes nothing. A
  malformed record is refused before anything is written; an unreadable local record is kept, not overwritten.
- A failed write never blocks the learner (`noteWords` swallows storage errors).
- Capped at 1000 words (the most recently met are kept).

**Who writes** (`src` ids are a closed list in `SOURCES`; anything else is filed as `other`):

| Source       | Where                                       | Kind                                                             |
| ------------ | ------------------------------------------- | ---------------------------------------------------------------- |
| `wordlab`    | build a word, garden review (`lensNote`)    | `chose`; `wrote` for the "use it" and "transfer" sentence tasks  |
| `teach-back` | a finished explanation (`views/teach-back`) | `wrote`, for key terms and academic-list words the learner typed |
| `writing`    | Language Coach request (`views/activity`)   | `wrote`, for academic-list words in the draft                    |

Not wired yet: Vocabulary Academy (four result paths in `vocab-academy/`, to be hooked at the activity layer, not the
pure model), Reading Room word saves, the arcade games, family practice and the BCPSS lesson activities. The Language
Demand Analyzer is a teacher tool, so it never writes: a teacher's words are not a learner's encounters.

**Add a source**: add its id to `SOURCES` and a name to `SOURCE_NAMES` in `views/lens.js`, then call
`noteWords(words, { src, mode, supported })` where the learner finishes something. Pass words the activity named or words
from a lab list (`trackedWordsIn(text)`), never raw text. Start Fresh in the Passport clears the record with the rest.

**Review status**: all Spanish text was written without native review.

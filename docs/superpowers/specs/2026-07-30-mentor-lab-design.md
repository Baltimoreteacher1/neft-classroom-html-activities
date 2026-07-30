# Unit 0 — Choose Your Math Mentor

**Date:** 2026-07-30
**Status:** approved (Joel, full autonomy)
**Route:** `/mentor-lab/`

## The idea in one line

Every student picks a mathematician to work _with_ for the year. The mathematician
is a **mentor, not a costume**: the student keeps their own name, and what they
receive is a **thinking move** they can actually use on grade 6 math.

## Why mentor and not avatar

"You ARE Ramanujan" is impersonation. It invites caricature, it is strange for a
real person who died, and 6th graders cannot sustain it past week two. "You work
in Katherine Johnson's lab" survives, because the mentor is doing a job — handing
the student a way to think — rather than being worn.

## Non-goals (hard)

- No accents, no first-person roleplay, no "I invented…" dialogue.
- A mentor is **never earned** and never performance-gated. Gating it would turn
  the roster into a status hierarchy.
- The whole layer is **skippable**. A student with no mentor loses nothing.
- **No invented math connections.** None of these people researched 6th grade
  ratios. The honest link is habits of mind, not topics.
- The student-facing UI **never sorts, filters, groups, or labels by race,
  ethnicity, or gender.** Coverage is guaranteed in the data and asserted by a
  validator; it is never announced to a child.

## Roster

44 mathematicians in `assets/mentor-roster.js` (`window.NTMentorRoster`).

Coverage is a build-time invariant, not a UI feature. Each record carries an
internal `rep` tag used **only** by `assets/mentor-roster.test.mjs`, which
fails the build if any bucket drops below 6:

| bucket                                 | min    |
| -------------------------------------- | ------ |
| `black-men`, `black-women`             | 6 each |
| `hispanic-men`, `hispanic-women`       | 6 each |
| `white-men`, `white-women`             | 6 each |
| `additional` (Asian, MENA, Indigenous) | 6      |

`rep` is never rendered — the test also asserts that no student-facing surface
(`mentor-lab/*`, `assets/lesson-mentor.js`, `assets/mentor-avatar.js`) reads it.

Every mentor has a pronunciation guide (`say`). This is deliberate: a student
will not choose a person whose name they are afraid to say out loud.

**Portraits are drawn, parametric SVG illustrations** — not photographs and not
monograms. A first pass used initial-monogram medallions; they were replaced
because a letter in a circle is not a person and does nothing for engagement.

`assets/mentor-avatar.js` composes a flat portrait from descriptive features on
each roster entry (`face`): skin, hair style + colour, facial hair, glasses,
clothing/era, head covering. Layer order is what makes it read as a face —
background → long hair → skull hair → neck → clothing → ears → face → beard →
fringe/covering → brows → eyes → nose → mouth (drawn *on* the beard) →
moustache → glasses → earrings.

Photographs are deliberately avoided: they are variously copyrighted,
unavailable, or — for the older figures — invented by later artists, and a
portrait misattributed to a real person is worse than none. These are honest
illustrations, and the page says so in its footer.

`face` values are descriptive, never categories, and the test asserts every one
resolves to a drawable value *and* that all 44 actually render.

## The eight labs

Each mentor belongs to one lab. The lab **is** the thinking move. Eight is small
enough to browse in one screen and maps cleanly onto MP1–MP8.

| lab                 | move                                  |
| ------------------- | ------------------------------------- |
| The Noticing Lab    | Notice before you calculate.          |
| The Balance Lab     | Do the same thing to both sides.      |
| The Drawing Lab     | Make it bigger and slower.            |
| The Pattern Lab     | Find what repeats.                    |
| The Small-Start Lab | Try a smaller number first.           |
| The Reality Lab     | Ask whether the answer makes sense.   |
| The Record Lab      | Write down every try, then look back. |
| The Second-Way Lab  | Solve it again, a different way.      |

Students **collect** labs across the year (see L3), so the roster becomes a
curriculum of thinking rather than a one-time cosmetic pick. This is the single
mechanism that defeats the novelty tax.

## Access is the design (Level 1 / ESOL)

Not a bolt-on pass. Built into every screen:

- Every mentor leads with `simple` — one plain-English sentence, capped at 16
  words by the test. The longer paragraphs sit behind a "Tell me more".
- **EN/ES toggle** swaps the UI chrome, the lab strings, and the short mentor
  strings (`es.thought`, `es.simple`). Long struggle stories stay English with
  read-aloud rather than machine-translated — stated, not faked.
- **Read-aloud**: tap any text to hear it, in the selected language, via Web
  Speech. Mirrors the Level 0 read-aloud pattern already used site-wide.
- Every mentor has a **pronunciation guide** (`say`). A student will not choose
  a name they are afraid to say out loud.
- Each lab card carries **two vocabulary words** with definitions and Spanish.
  The lab card is the first thing a student reads, so vocab-first applies.
- Colour-coded throughout by lab, large tap targets, visible focus everywhere.

## Unit 0 flow — five screens

Deliberately short. Target: under six minutes, one class period with discussion.

1. **Welcome.** What a mentor is, in three short facts, over a strip of
   portraits. Asks for **no name and no account** — deliberately: `nt_student` is
   set by the lessons that need it, and adding another identity prompt here would
   widen the privacy surface for a page that does not need one.
2. **Which move sounds like you?** Eight big colour-coded cards, each with its
   emblem, a first-person quote, the move, and its vocabulary. This screen is the
   real pedagogy — a student who quits here has still met all eight moves.
   "Show me everyone" (A–Z) and "🎲 Surprise me" are always available, so a
   student who freezes on a grid still has a way through.
3. **Meet your matches.** The mentors in that lab. Name, pronunciation, one line
   of what they thought about.
4. **Learn one.** Full card: the move, what they figured out, their **struggle**
   story, and a 10-second _Try their move_ task (attached to the lab, not the
   person — 8 tasks, not 44).
5. **Confirm.** Lab, colour, portrait, saved. Then: go to your first lesson.

## The layer — `assets/lesson-mentor.js`

Registered in the `LAYERS` manifest of `assets/lesson-platform.js`, so it reaches
every lesson through the single existing platform tag. **Zero per-lesson edits.**
This is non-negotiable given the injector blast radius in this repo.

Storage: its own key `nt_mentor` — _not_ `nt_student`, which has many writers.

```
{ id, chosenAt, moves: [labId…], seenStories: [id…], version }
```

Layers of behavior, each independently degradable:

- **L1 Presence.** Portrait pill, top-left (free — the Passport layer is
  currently commented out of the manifest and is not being re-enabled here).
  With no mentor set, a quiet "Choose your mentor" chip linking to `/mentor-lab/`.
  Never a blocking modal.
- **L2 Voice.** Read-only tap on `window.NTtelemetry.track` — the same idempotent
  wrap Passport used. No new tracking, no network.
- **L3 The Move.** Moves are collected by **practising** — opening a lab's
  Try-It in Unit 0 and working the 10-second task. Deliberately *not* on
  `mastery_reached`: the mentor's own lab is granted at selection, so awarding it
  again would grant nothing while showing a "Move collected" toast — a reward
  animation for a no-op. On mastery the layer instead *names* the move the
  student already holds, at the moment it paid off. Both halves of this contract
  are asserted by the test.
- **L4 Story.** After two incorrect `item_attempt`s in a session, one gentle,
  dismissible offer to read the mentor's struggle story. Once per session, never
  repeated for a story already seen. Struggle framing only — the Lin-Siegler
  result is that achievement-only stories do nothing or backfire.

Hard rules, mirroring the sibling layers: never throws into the host lesson,
every DOM lookup null-checked, single window sentinel (`window.NTMentor`),
honors `prefers-reduced-motion` and `window.NT_MUTED`, no external deps.

## Curriculum placement

Unit 0 is added to the curriculum hub as the first unit card and to the student
launcher. It is content-only — it does not alter unit numbering, and it is not
registered in `data/curriculum-manifest.json` (it has no standard, no lesson
config, no engine dependency). `tools/validate-curriculum-hub.mjs` thresholds are
floors, so an added unit passes.

## Verification

- `npm run validate:js-syntax`, `validate:static`, `validate:hub`,
  `validate:injection`, `validate:save-resume`
- `npm test` (already wired into `validate`) auto-discovers
  `assets/mentor-roster.test.mjs`: schema, coverage floors, unique ids, lab
  resolution, ESOL fields, Spanish presence, `simple` length cap, portrait
  features all drawable, **all 44 portraits actually rendered**, no `rep` in any
  student-facing surface, and the move-collection contract. Shipped as a test
  rather than a 30th bespoke `validate:*` script.
- `npm run build`
- Playwright: full Unit 0 flow end to end; mentor pill present on a real lesson;
  lesson with no mentor set still boots clean (no console errors)

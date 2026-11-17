# Language Time Machine

System D of Part 2 (`docs/part2-integration-map.md`). It puts an earlier and a later piece of a learner's own
language side by side, with the context of each. It extends Passport and Portfolio (both show a door to it) and is
not another portfolio: it keeps no copy of any work.

Route: `/time-machine`, `?tab=writing|speaking|challenge|reflections|evidence`, `&pair=<pair id>`, `&from=<item id>`.

## Where the work comes from

`src/timemachine/collect.js` reads, and never writes:

| Source                                 | Key                                                | Becomes                                                             |
| -------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------- |
| Writing Studio versions                | `accessPracticeLab:v1:studio` `.writing`           | first response, then revisions                                      |
| Speaking Studio takes                  | same key, `.speaking` (audio in `audio-store.js`)  | speaking items with their transcript                                |
| Language World drafts                  | `accessPracticeLab:v1:exhibition`                  | first, revision, new task                                           |
| Warm-up sentences, Adventure artifacts | `prefs.warmup`, `accessPracticeLab:v1:adventures`  | single items (no language goal, so they pair only on the same task) |
| Feedback loops                         | `accessPracticeLab:v1:intel` (`src/intel/loop.js`) | response, revision, transfer, teacher note                          |

A pair exists only when both pieces are in the same domain and either answer the same task or share a Key Language
Use in a different context ("same goal, new context"). The earlier piece is strictly earlier. Each pair keeps the
support context of both pieces: "on my own", "with sentence frames", "a revision after feedback (supported)".

## What the feature stores

One key, `accessPracticeLab:v1:time-machine` (`src/timemachine/reflect.js`), so the Passport export carries it:
reflections per pair, the "these words are right" flag per item, words typed for a recording that had none, the
link from a new-context task to the piece it came from, and when a pair was shared. A new-context response is a new
loop in `src/intel/loop.js` (`src: "time-machine"`, stage `transfer`). Recorded reflections and challenge recordings
are kept through `audio-store.js` (30 days, at most 12 kept recordings on a device: a new one replaces the oldest).

## Rules (each has a test in `tools/time-machine.test.mjs`)

- Earlier work is read-only. The source stores are byte-identical after collecting, comparing and rendering.
- Pairs are never cross-domain and never an item with itself.
- Every change statement carries a quote that is in the earlier or the later text (`compare.js` `guardStatements`
  drops anything else, whether it came from `compareWork` in `src/intel/engine.js` or from the local comparer).
- Length is never growth. Statements about longer, shorter or word counts are dropped and the page says so.
- Speaking is compared by its words. No statement, suggestion or page text mentions accent, speed, pace or pauses.
  Speech-recognition words are labelled until the learner confirms them.
- Nothing is sent anywhere until the learner presses "Share this comparison with my teacher"
  (`shareWithClass`, the class review queue). The shared text has no name.
- No score, level, percentage or timer. Under two comparable pieces the page says there is not enough to compare.

## New-context example

Original: "Explain why plants need sunlight." New task: "Explain how reduced sunlight could affect an ecosystem."
The prompt comes from `transferFor` (`src/intel/bank.js`). Help is closed by default; opening it saves the work as
done with help.

## Teacher evidence

`/time-machine?tab=evidence` is printable and reads only local stores, so it also works on a teacher's device after
importing a student's Passport export. Sections: comparable evidence and response changes, support history,
revision activity, independent transfer, suggested next instruction (each suggestion names the evidence that
triggered it; rules in `src/timemachine/evidence.js`).

## Files and checks

`src/timemachine/{collect,compare,reflect,challenge,evidence,load,ui,ui-speaking,ui-more}.js`,
`src/views/time-machine.js`, `time-machine.css`; doors in `src/views/passport.js` and `src/views/portfolio.js`.

```sh
node --test tools/time-machine.test.mjs
node tools/time-machine-e2e.mjs        # real browser, synthetic data and audio
```

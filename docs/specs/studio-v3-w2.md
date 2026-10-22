# Studio v3 · W2 — learner model, seals, repair loop, confidence tap, rewards

Builds on `practice-studio-v2.md` §8 (the event bus, versioned saves, passport) and the Skill Quest ladder
(`assets/studio/quest-model.js`). Everything stays on the student's device. Nothing is timed. A wrong answer never reveals the
answer. English and Spanish only. No leaderboards, no points that can be lost.

## 1. Learner model — `assets/studio/learner.js` (`window.StudioLearner`)

One small record per **skill**, kept in `localStorage` under `neft_studio_learner_v1` (cross-lesson, per device, never sent anywhere):

```
{ v: 1, skills: { "<key>": { label, labelEs, lesson, seen, clean, helped, ema, level, streak, best, last, seal, repaired, traps: { "<tag>": n } } } }
```

- **Skill key.** `gen:<id>` for a generated item (the generator's own id), `act:<kind>` for a hands-on activity, `lab:<id>` for a lab.
  Authored items with no skill (plain multiple choice) are not skills; their misconception tags still count under `traps` of the
  lesson's `lesson:<id>` record so My thinking and the seals agree on what was missed.
- **Clean answer** = right on the first try with no hint (the same definition the Quest uses).
- **Evidence, not a grade.** `ema` is the exponential average of clean answers (weight 0.3 on the newest, starts at 0), `level` is the
  highest generator level answered clean, `streak` the current run of clean answers. These are shown to the student only as seals.
- **Sticky.** A seal, once earned, is never taken back; a bad day only stops it rising.

## 2. Seals

| Seal | Name (EN / ES)              | Earned when                                                                        |
| ---- | --------------------------- | ---------------------------------------------------------------------------------- |
| 1    | Bronze · Tried / Probado    | 3 answers seen on the skill                                                        |
| 2    | Silver · Steady / Constante | 5 seen, `ema` ≥ 0.70, and a clean answer at level 2 or higher                      |
| 3    | Gold · Mastered / Dominado  | 8 seen, `ema` ≥ 0.85, a clean answer at level 3 or higher, and a clean streak of 3 |

Shown as a ring, a half-ring or a full ring with the word beside it (never colour alone). "My seals" lists the current lesson's skills
(from the page's own items) with each seal and one plain sentence about what is next ("two more answers with no hint"). Rising a seal
fires `studio:seal`; the Comfort panel's celebration toast and the exit card pick it up. Seals appear on the finder page's passport
entry as a count per lesson.

## 3. Repair loop (inline)

When a generated item is solved only after a miss or a hint, the feedback offers **Try a fresh one** — the same skill on new numbers,
same level, mounted under the item with `redeem: true` so it never changes section progress or stars. Clean = **Repaired**: the
skill's `repaired` count rises, `studio:repair` fires (toast), the miss's trap gets a "fixed since" mark in My thinking, and the item
is removed from the Redemption Round queue. A wrong answer on the fresh one gives the normal named help and offers another fresh
one; nothing is ever required. (The Redemption Round stays: it is the bulk version at the end.)

## 4. Confidence tap

Boss items keep their blocking "How sure are you before you answer?" row. Every other multiple-choice and numeric item gets the same
three chips as an **optional, non-blocking** row above the answer (never inert, skipping costs nothing). The choice is stored in
`state.calib`, so the calibration summary in My thinking and the share code already read it; the learner model records, per
confidence level, how often it was right.

## 5. Rewards v2

Stars stay as they are (earned by level and clean answers). Added: a seal toast, a repair toast, and an exit-card line listing the
seals earned this visit. No timers, no streak anxiety (a streak ends quietly), no loss states.

## 6. Gates

`tools/studio-learner.test.mjs` drives the model through scripted events (seal thresholds, stickiness, key derivation, a corrupt
store, no timers). `validate:studio-enhancements-browser` drives, on a generated lesson: a wrong answer → help → solve → Try a fresh
one → clean → Repaired, a seal rising after enough clean answers, the optional confidence chips on a non-Boss item, and My seals.

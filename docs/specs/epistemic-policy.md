# Epistemic policy: no surface asserts what it has not verified

This repo already got one thing exactly right, in one module, by accident of
careful review. `engine/core/small-group-build-visuals.js` verifies the arithmetic
of a worked step _before_ drawing a picture of it, and returns `null` when it
cannot — because a diagram of "3 × 5 = 60", sliced out of the longer true line
"2 × 2 × 3 × 5 = 60", teaches a child something false with total confidence.

That is not a rendering rule. It is a general policy, and it is the most
transferable idea in this codebase:

> **No surface asserts what it cannot verify. When the system cannot distinguish
> between explanations, it says less, not more. Silence is a supported state.**

The rest of this document applies that policy to every surface it touches, records
which ones violated it, and states how each was fixed. New surfaces are expected
to be audited against it.

## Why this is worth a document

A classroom system's errors are not symmetric. A studio that stays quiet costs a
teacher a few seconds of uncertainty. A studio that confidently mislabels a
student's thinking costs a real instructional decision — the teacher acts on the
label, pulls the wrong group, reteaches the wrong thing, and has no way to know.

So the asymmetry runs one way: **prefer under-claiming.** Every rule below is a
consequence of that single fact.

## The five rules

### 1. Verify before you render

Already implemented in `small-group-build-visuals.js`. Every model kind (convert,
split, array, rate, line, point, power) checks its own arithmetic triple before
drawing, and a no-match returns no figure rather than a guess.

**Extended to inference** in `engine/core/small-group-misconceptions.js`: a named
misconception is reported only when the student's answer matches exactly one
predicted mechanism. This drove two real design decisions:

- The two decimal mechanisms — "multiplied the digits, ignored the points" and
  "computed right, misplaced the point" — produce the **same number** on the same
  problem (451 × 12 = 5412 is also 5.412 shifted three places). They are therefore
  **one** taxonomy entry, `decimal-place-value`, labelled only as far as the
  evidence goes: "right digits, wrong magnitude".
- On any negative subtraction, "reversed the order" and "dropped the sign" also
  collide. The reversal is the more specific claim, so a bare sign claim is the
  explanation of last resort and is only offered when nothing else predicts that
  value.

### 2. Print the denominator, in the same type size as the claim

A device with no class identity sends no telemetry at all, by privacy design. Any
aggregate over that data is therefore a **sample, never a census** — and a
dashboard that renders a bare `0` invites a teacher to read "nobody understood
this" when the truth is "nobody reported".

- Every evidence event now declares `reported: 1`
  (`engine/core/small-group-evidence.js`).
- `/api/progress/next-move` returns `devicesReporting` and a `confidence` band
  (`good` / `thin` / `very-thin`).
- The Next Move card prints coverage **above** the recommendation and styles it as
  body text, not small print (`.ctw-next-move-coverage`). At `very-thin` it says
  "treat this as an anecdote, not a pattern" in the same size as the advice.

### 3. No evidence is an answer. Do not dress a default as a finding

`/api/progress/next-move` with no data returns `evidence: false` and the sentence
"Nothing here is a recommendation." It does **not** return a plausible lane.

The same rule applies to the reasoning reader: unparseable model output returns
502 and the studio shows nothing, rather than passing a raw model string to a
child.

### 4. Label the simulation as a simulation

The studio shipped a "Team consensus protocol" that unlocked at "0 of 3 voices
ready" — on a single device, with one student tapping all three. That is a ritual
of collaboration, and presenting it as collaboration is a false assertion about
what happened in the room.

Fixed two ways: real tables now exist (`functions/api/sg-room`), and the solo
fallback says what it is — "you are arguing all three positions yourself". Same
for the canned skeptic in `go-deeper.js`, which now names a real dissenting seat
when there is one.

### 5. Say what you measure

The momentum meter counted phase completions **and** practice checks, then
labelled the total "N checks complete". It now says "steps done", which is what it
counts.

## Audit log

| Surface                   | Violation                                             | Status                                         |
| ------------------------- | ----------------------------------------------------- | ---------------------------------------------- |
| Build-step visuals        | —                                                     | Compliant by design; the origin of this policy |
| Misconception detector    | —                                                     | Compliant by construction (single-match rule)  |
| Small-group telemetry     | Aggregates had no denominator                         | Fixed — `reported: 1`                          |
| Next Move card            | n/a (new)                                             | Coverage + confidence required before advice   |
| Consensus lab             | Simulated 3 voices presented as a group               | Fixed — real rooms + honest solo label         |
| go-deeper skeptic         | Canned objection presented as a challenge             | Fixed — names a real seat when one exists      |
| Momentum meter            | Called phase completions "checks"                     | Fixed — "steps done"                           |
| Reasoning reader          | n/a (new)                                             | 502 over a guessed reply; answer-leak guard    |
| Streak chip               | Reports consecutive correct answers, labelled as such | Compliant — verified, not changed              |
| Mastery dashboard rollups | Consumes `reported`; display not yet updated          | **Open** — see below                           |

## Known open item

`/api/progress/small-group-summary` and the `/teacher-tools/mastery/` display
predate this policy. The producer now emits `reported: 1`, so the coverage data
exists, but those two surfaces do not yet show it. Until they do, a `0` on the
mastery dashboard still carries the old ambiguity. This is recorded rather than
quietly fixed because changing that display is a separate, teacher-facing change
with its own validation surface.

## For new work

Before shipping a surface that states something about a student, a class, or a
piece of mathematics, answer three questions in the code comments:

1. What would make this claim **false**, and does the code check for that?
2. If two explanations fit the data equally well, what does this surface show?
   ("The first one" is the wrong answer.)
3. Where is the denominator, and will a tired teacher at 7:40am see it?

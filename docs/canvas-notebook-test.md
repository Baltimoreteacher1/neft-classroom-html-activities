# Canvas Student View test — notebook checkpoints on lesson 1-1

The thing being tested is narrow and specific: a notebook capture is **proof a
student wrote in a paper notebook**. It is ungraded and useless to an LMS, while
`cmi.suspend_data` is a **4096-character** budget that small-group, catch-up and
project pathways already exceed structurally. When the payload goes over, the SCO
**refuses the write** rather than truncating it — and the write it refuses is the
one holding the student's real answers. So a capture in `suspend_data` does not
just waste space; it can cost a student their work.

## Run the automated probe first

```bash
npm run build                  # the probe drives the built lesson, not the dev server
npm run probe:canvas-notebook  # ~40s
```

It builds a real package with `npm run scorm`, extracts the **actual SCO** from
the zip, serves it against a SCORM 1.2 host that enforces the real 4096-character
ceiling, and drives lesson 1-1 in Chromium with genuine user input.

What it asserts, in order:

1. the notebook block renders at the Launch phase;
2. the gate holds on an empty capture and releases on a filled one;
3. **the SCO actually wrote `cmi.suspend_data`** — a positive control, because
   every assertion below is "the payload does not contain X" and an empty payload
   satisfies all of them;
4. the payload contains none of: the capture text, a `#nt-nb-*` field id,
   `__ntNotebook`;
5. no write was refused (nothing was pushed over the ceiling);
6. the capture is held by local save/resume;
7. after a close-and-reopen the capture and its checkbox come back.

Measured on this branch: **1,912 characters written, 0 notebook artifacts.**

Negative control (proof the probe has teeth): removing `withoutNotebook()` and
`withoutNotebookFields()` from `dist/assets/canvas-bridge.js` makes it fail with
all three leak assertions plus the resume one.

Exit codes: `0` pass · `1` fail · `3` SKIP (no browser — nothing was verified).

## What the probe does NOT cover

Canvas's own SCORM importer, its gradebook plumbing, and the Cloudflare Access
path. Those need the manual run below. Do it once per Canvas-affecting change,
not once per commit.

## Manual Canvas Student View run

Package: `scorm-packages/1-1_Math_is_Mine_SCORM.zip`
(rebuild with `npm run scorm -- 1-1 "Lesson 1-1: Math is Mine"`).

A package **wraps the live site** — it does not contain the lesson. So this test
only exercises notebook checkpoints once the branch is deployed. Running it
against a package built before the deploy tests the old lesson and will show no
checkpoint at all; that is the package working correctly, not a failure.

1. Canvas → the course's SCORM area → upload the `.zip` **without unzipping it**.
2. Use the assignment Canvas creates. Set points and availability. Publish.
3. **Student View** → open the assignment.
4. Confirm the loading state appears briefly, then the lesson renders. No
   Cloudflare login prompt. If you get one, that is the Access path, not SCORM —
   see `docs/cloudflare-access.md`.
5. Advance to the **Launch** phase. The "Notebook time — Section 1: Math Words"
   block should be at the bottom of the phase.
6. Try to continue **without** filling it in. It must not advance, and it must
   say: _"Write it in your notebook first, then check the box to keep going."_
7. Tick the box, type a short capture, continue. It should advance to Explore.
8. Open the SCO's debug panel (append `#debug` to the frame URL, or use the
   wrapper's debug reveal) and read the reported `suspend_data`.

### What `suspend_data` should contain

A JSON object with `fields`, `navigation`, `dragDrop`, `custom` and
`progressPercent` — the student's actual lesson answers. Expect roughly
**1,500–2,500 characters** on lesson 1-1.

### What it must NEVER contain

- the text you typed into the capture box
- any `#nt-nb-` field id (e.g. `#nt-nb-1-text`, `#nt-nb-1-done`)
- the string `__ntNotebook`

If any of those appear, stop and treat it as a defect: the guard in
`assets/canvas-bridge.js` (`withoutNotebook` for the `custom` slice,
`withoutNotebookFields` for the generic field capture — both doors) is not
running. `npm run validate:notebook` pins that both exist and that the key and
prefix match the engine's.

### What a correct resume looks like

1. Close the assignment (or the whole Student View session).
2. Reopen it.
3. The lesson returns with the student's **answers** restored from the LMS, and
   the notebook capture and its ticked checkbox restored from **local**
   save/resume — not from the LMS. Both should be visible.
4. The Launch gate should already be satisfied: continuing works immediately,
   with no blocked message.

A capture that comes back is correct. A capture that comes back **and** appears
in `suspend_data` is the defect this whole test exists to catch.

### Known, pre-existing, not caused by this work

`cmi.core.lesson_location` writes as an empty string on engine lessons: the
bridge derives it from `NeftSaveResume.getTeacherSummary().phase`, which engine
lessons do not populate. Resume still works (it rides on `suspend_data`), but the
LMS-side bookmark is blank. Out of scope here; worth its own fix.

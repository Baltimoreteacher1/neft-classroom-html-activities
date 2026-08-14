# Canvas acceptance test — EduWonderLab SCORM packages

**Status this checklist exists to change:**

- SCORM runtime/package hardening: **production-ready**
- Canvas interoperability: **awaiting real-course acceptance testing**

Nothing in the repo can move the second line. Package validation and the mock-LMS
suite prove the packages are well-formed and that the SCO makes the right API
calls in the right order — they cannot prove Canvas _accepts_ them, frames them
the way we expect, or writes the grade where you can see it.

Run this in a real Canvas test course (not a production section). Budget ~90
minutes for the full sheet, or ~20 for the smoke row (test 1 only).

---

## Before you start

1. A Canvas **test/sandbox course** you can add assignments to.
2. A **Student View** user (Canvas: course → _Student View_), or a real test
   student enrolled. Some SCORM behaviour differs for Student View — if anything
   looks wrong there, re-check with a real test enrolment before filing it.
3. A device on the **school network**, because packages load the live site. If
   eduwonderlab.com is blocked for students, everything below fails for reasons
   that have nothing to do with SCORM — check that first.
4. Download the 8 packages in the table below from the Curriculum Hub, or
   directly:
   `https://eduwonderlab.com/api/scorm?activity=<id>&title=<title>`

### Packages to test

| #   | What it exercises                        | Suggested `?activity=`                  | Downloaded file                              |
| --- | ---------------------------------------- | --------------------------------------- | -------------------------------------------- |
| 1   | Core interactive lesson (the smoke test) | `1-1`                                   | `Unit-1_Lesson-1-1_Interactive_SCORM.zip`    |
| 2   | Substantial mathematical visual          | `4-1`                                   | `Unit-4_Lesson-4-1_Interactive_SCORM.zip`    |
| 3   | Statistics (graphs, plots)               | `9-1`                                   | `Unit-9_Lesson-9-1_Interactive_SCORM.zip`    |
| 4   | Support small-group lesson               | `1-1-group1`                            | `Neft_1-1-group1_Interactive_SCORM.zip`      |
| 5   | Challenge small-group lesson             | `1-1-group2`                            | `Neft_1-1-group2_Interactive_SCORM.zip`      |
| 6   | Spanish support                          | `1-1&supports=language-support&lang=es` | `Neft_1-1-supports-language-support-es_…zip` |
| 7   | TTS / read-aloud                         | `2-1`                                   | `Unit-2_Lesson-2-1_Interactive_SCORM.zip`    |
| 8   | Heavy save/resume state                  | `3-4`                                   | `Unit-3_Lesson-3-4_Interactive_SCORM.zip`    |

> Confirm the exact lesson ids against the Curriculum Hub before downloading —
> pick whichever lesson in that unit actually has the feature named in column 2.
> The point is coverage of the _feature_, not of a specific lesson number.

**Diagnostics.** Any package can be launched with SCORM diagnostics visible by
adding `?scormdebug=1` to the Canvas launch URL (or opening `index.html` from
the unzipped package with that query). It shows: API found, initialized, status,
score, suspend-data size, location, last commit, writes/failures, last error.
Use it whenever something below fails — screenshot that panel with the report.

---

## Test 1 — Import

For each package:

- [ ] Canvas accepts the upload with **no error**
- [ ] Canvas creates a SCORM activity / assignment
- [ ] The title is **human-readable** (not `neft-1-1` or a raw filename)
- [ ] **No "missing resource" / "invalid package" warning**
- [ ] The assignment can be set to a points value (if you intend it graded)

Record: Canvas version/instance, how you imported (SCORM tool vs course import).

## Test 2 — Launch

- [ ] A student can open the assignment
- [ ] The lesson **renders** inside the Canvas frame (not blank, not an error card)
- [ ] The student is **auto-identified** — no name-entry screen (the SCO passes
      the Canvas name/id). If a name prompt appears, note it: that means the
      identity handoff failed.
- [ ] **No horizontal overflow** of the page inside the frame
- [ ] No blocked assets — open DevTools → Network, filter by status, confirm no
      failed requests to eduwonderlab.com
- [ ] **No uncaught console errors** (warnings from Canvas itself are fine — note
      which are Canvas's and which are ours)

## Test 3 — Interaction

- [ ] Warmup renders and accepts answers
- [ ] A **correct** answer is graded correct
- [ ] An **incorrect** answer shows the incorrect feedback
- [ ] Hints / retries / Quick Reteach work
- [ ] Math visuals render and are interactive (packages 2, 3)
- [ ] **Keyboard only**: can reach and operate every control with Tab/Enter/Space
- [ ] TTS plays and its controls work (package 7)
- [ ] Spanish directions/vocabulary/hints are present and correct (package 6)

## Test 4 — Persistence (do this exactly)

Use package 8, and repeat for package 1.

1. [ ] Launch as the student
2. [ ] Answer **several** questions across more than one phase
3. [ ] **Leave** the SCORM activity (Canvas → back to the course, not just a tab switch)
4. [ ] Wait a minute, then **return** to the assignment

Verify restoration of:

- [ ] Typed / selected **answers**
- [ ] **Graded state** of already-answered items
- [ ] **Progress** indicator
- [ ] **Current location** (lands where they left off, not back at the start)
- [ ] **Completion state**

Then the cross-device case, which is what `suspend_data` exists for:

5. [ ] Log in as the same student on a **different browser or device**
6. [ ] Open the assignment — prior work should restore there too

> If step 6 fails but step 4 works, that is the LMS-side resume (suspend_data),
> not the browser-side one. Capture `?scormdebug=1` — specifically the
> `suspend` line. If it reads `0/4096`, the lesson never sent state; if it
> reads near 4000, the payload hit the ceiling and was refused.

## Test 5 — Gradebook

For packages that report a score (any lesson with graded items):

- [ ] Canvas receives a score after completion
- [ ] The score **matches** what the lesson showed the student
- [ ] Min/max behave (score out of 100; Canvas may rescale to the assignment's
      points — note the mapping you observe)
- [ ] **Partial** completion reports the partial score
- [ ] **Full** completion reports the full score
- [ ] **Relaunch does not duplicate or corrupt** the grade

Specifically test the regression this hardening pass fixed:

7. [ ] Complete the lesson, confirm the grade in the Canvas gradebook
8. [ ] **Reopen** the completed assignment as the student and close it again
9. [ ] Confirm the gradebook still shows the **same** grade — not blank, not
       reset to incomplete, not a lower score

For activities that report **completion rather than a score** (open-response,
drawing, speaking, self-check):

- [ ] Canvas marks it complete
- [ ] Canvas does **not** invent a numeric score
- [ ] This is intended behaviour — do not file it as a defect

## Test 6 — Completion agreement

- [ ] Before starting: Canvas shows not attempted / unattempted
- [ ] Mid-lesson: Canvas shows **incomplete**
- [ ] After finishing below mastery (70): Canvas shows **complete**
- [ ] After finishing at/above mastery: Canvas shows **complete/passed**
- [ ] Canvas and the lesson **agree** — the lesson does not say "done" while
      Canvas says incomplete, or vice versa
- [ ] A lesson that was merely **opened and closed** is _not_ marked complete

## Test 7 — Relaunch after completion

- [ ] Completed work is still there
- [ ] It is **not silently reset**
- [ ] The student can review their answers
- [ ] Whatever Canvas does here (review vs new attempt) is recorded, so the
      intended design can be matched to real behaviour

---

## Test 8 — LMS-frame responsive & accessibility

Run at **two widths**, inside the Canvas frame (not a standalone browser tab):

- **Chromebook**: 1366×768
- **Narrow Canvas content column**: ~1024px wide, and again with the Canvas
  course navigation expanded (which is what actually squeezes the frame)

At each width, for at least packages 1, 2 and 3:

- [ ] No horizontal overflow / no sideways scrollbar on the page body
- [ ] All controls reachable and clickable — nothing clipped at the frame edge
- [ ] Math visuals readable without zooming
- [ ] **Focus ring visible** on every focusable control
- [ ] Keyboard order is logical (roughly follows reading order)
- [ ] **No focus trap** — Tab can always move on; Esc closes dialogs
- [ ] Feedback messages fully visible, not clipped or hidden behind sticky chrome
- [ ] Tap/click targets usable at the narrow width
- [ ] Dialogs and zoom work **inside** the frame (do not open behind it, do not
      try to take over the whole window)

> **Scoping rule.** If a problem also happens on the plain website at the same
> width, it is a lesson-level issue, not a SCORM defect — note it separately.
> Only file it here if the **packaging or the frame** causes it: clipping at the
> frame boundary, a dialog that assumes it owns the top-level window, focus
> escaping into Canvas's own chrome, fullscreen/zoom that the frame blocks.

---

## Reporting results

For each failure, capture:

1. Package number and lesson id
2. Which test and which checkbox
3. What you expected vs what happened
4. Screenshot, including the `?scormdebug=1` panel where relevant
5. Browser console output if there is an error
6. Whether it also happens on the plain website (this decides SCORM vs lesson)

Hand the results back and only genuine Canvas-specific defects will be fixed —
no changes will be made by guessing at Canvas behaviour.

---

## Known non-defects

Do not file these:

- **A password prompt when opening a teacher page.** Teacher notes, answer keys
  and `/teacher-tools/` are behind the class password by design. As of the
  teacher-boundary change, `/api/scorm` **refuses** to package them at all
  (HTTP 403), so this should no longer be reachable from a package.
- **Students need internet access.** Packages play the live lesson; that is what
  lets a lesson edit reach every uploaded assignment without re-uploading.
- **Open-response / drawing work has no numeric score.** Intended — see Test 5.
- **The package is only two files.** `imsmanifest.xml` and `index.html` is the
  whole archive by design.

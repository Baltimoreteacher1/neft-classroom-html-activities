# Known defects

Found, understood, deliberately not fixed yet. Each entry names the cause, what
it costs, and what would close it — so the next person spends their time fixing
it rather than rediscovering it.

---

## `cmi.core.lesson_location` writes empty on engine lessons

**Status:** open. Found 2026-08-18 by `npm run probe:canvas-notebook`, which
reports `lesson_location: ""` on lesson 1-1 in a real SCORM launch.
**Not caused by the notebook checkpoint work** — it predates it and is
independent of it. Deliberately not fixed on that branch.

**Cause.** `assets/canvas-bridge.js:currentLocation()` derives the bookmark from
`NeftSaveResume.getTeacherSummary().phase`:

```js
var sum = sr && sr.getTeacherSummary ? sr.getTeacherSummary() : null;
return sum && sum.phase ? String(sum.phase) : "";
```

Engine lessons never populate `phase` in that summary — their phase state lives
in `engine/core/state.js`, not in the save/resume record — so the expression is
always `""`. The bridge then relays an empty location, and the SCO writes an
empty string to `cmi.core.lesson_location`. Nothing errors; the field is simply
always blank. Standalone activities and homework pages, which do populate the
summary, are unaffected.

**Cost.** Small but real. Everything a teacher sees in Canvas that would say
_where_ a student stopped is blank, and `docs/scorm-runtime.md` documents the
field as carrying "the save/resume phase name", which is a promise the engine
path does not keep.

**What else reads it.** One consumer only: `restoreFromLms()` in
`functions/_lib/scorm-sco.js:477`, which reads `cmi.core.lesson_location`
alongside `cmi.suspend_data` and posts both to the lesson as a `restore`
message. Two consequences worth knowing:

- **Resume still works.** The lesson restores from `suspend_data`; the location
  is advisory. `if (!s && !loc) return;` means a blank location alone does not
  suppress a restore as long as state is present.
- **Nothing else depends on it.** No gradebook, report, or gate reads the field.
  `tools/scorm/mock-lms.mjs` and the Canvas probe only enforce its 255-character
  `CMIString255` limit.

So this is a reporting gap, not a data-loss bug — which is exactly why it is
logged rather than hot-fixed.

**What would close it.** Either populate `phase` in the engine's save/resume
summary, or give `currentLocation()` an engine-aware fallback (the current phase
name from `state.get()`), keeping the value a human-readable phase name rather
than an index — `docs/scorm-runtime.md` is explicit that a bookmark must survive
content edits, and an index does not. Whichever is chosen, the Canvas probe
already reads the field and can assert it in the same run.

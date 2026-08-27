# Known defects

Found, understood, deliberately not fixed yet. Each entry names the cause, what
it costs, and what would close it — so the next person spends their time fixing
it rather than rediscovering it.

---

## `cmi.core.lesson_location` writes empty on engine lessons

**Status:** FIXED. `engine/core/state.js:setPhase()` now publishes the phase name
to `window.NeftLessonLocation`, and `currentLocation()` in `assets/canvas-bridge.js`
reads that before falling back to the save/resume summary — so both kinds of
lesson report a bookmark. setPhase is the single choke point every navigation
route passes through, so no path can skip it. Kept as a human-readable name, not
an index, per `docs/scorm-runtime.md`. The record below is left intact because it
names the cause.

**Was:** open. Found 2026-08-18 by `npm run probe:canvas-notebook`, which
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

---

## `generate-small-group-lessons.mjs` reverts hand-improved content

**Status:** open. Found 2026-08-27 while adding challenge tasks. The generator
cannot be run — a full run rewrites 505 files and silently undoes work that is
already committed and live.

**Reproduce.** On a clean tree, regenerate a lesson nobody has touched:

```
node tools/generate-small-group-lessons.mjs --only 3-1
git diff --stat lessons/3-1-group1 lessons/3-1-group2
#  4 files changed, 19 insertions(+), 75 deletions(-)
```

Nineteen lines in, seventy-five out, on a lesson the command was not asked to
change. It is not idempotent, and the direction of the drift is the problem:
the generator's output is BEHIND the committed configs.

**What it takes back.** Three kinds of loss in that one probe:

- **Rewritten key ideas revert to raw textbook dumps.** `3-1-group2` currently
  reads "A ratio compares two quantities, and the order you write them in
  matters… and you can say why it is true, and where it would stop being true."
  The generator replaces it with "Understanding Ratios. Formula: a : b | a to b
  | a/b. 1. A ratio compares two quantities; order of quantities matters. 2.
  Part-to-Part compares two distinct subgroups (e.g. boys to girls)…" — the
  scanned publisher text the challenge framing was written to replace.
- **Spanish challenge framing is dropped.** `instructionsEs` loses its
  "Ve más a fondo:" opener and reverts to the core lesson's wording.
- **Whole items disappear.** The `error-analysis` item "Fix our table's
  thinking" is deleted outright — not edited, removed.

**Cost.** Any future run of this generator, by anyone, quietly reverses an
unknown amount of authored work across 168 small-group lessons. The damage
would look like a large clean regeneration diff, which is exactly what a
generator diff is supposed to look like, so it would not read as suspicious.

**Why it is not fixed here.** Closing it means reconciling the generator's
builders against everything the configs have gained since it last ran — which
is a content reconciliation across 168 lessons, not a code fix, and it needs
someone to decide, per field, which side is canonical.

**Working around it, as of 2026-08-27.** The challenge depth wave wrote its
items in BOTH places: `tools/lib/small-group-challenge-tasks.mjs` (so a future,
fixed generator produces them) and directly into the affected `config.json`
files (so they ship now). `--facilitation-only` is safe and unaffected — it
rebuilds only `functions/teacher-small-group/_facilitation-data.js` and is what
`validate:facilitation-fresh` expects.

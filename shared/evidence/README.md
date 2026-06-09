# Thinking Trails — Evidence Layer

A reusable, **local-first** student-thinking capture system for Neft Teacher
HTML activities. Drop it into any activity to capture attempts, hint use,
written explanations, and misconception patterns, then generate a polished
**Student / Teacher / Family** evidence report.

- **Live demo (classroom):** `/activities/thinking-trails-evidence-demo/`
- **Minimal dev demo:** `/shared/evidence/evidence-demo.html`
- **Linked from the math page:** `/math/` → "Reusable Lesson Tools" → _Thinking
  Trails Evidence Demo_

## What it does

- Captures every attempt: answer, correctness, attempts, hint use, explanation,
  and an optional misconception tag.
- Scores explanation quality with a simple, transparent word/vocabulary
  heuristic (no AI scoring).
- Builds an instructional report with real insight (reteach moves, suggested
  small groups, "solved but couldn't explain" flags).
- Exports a correctly-escaped CSV and a self-contained HTML report.

## Privacy (hard rules)

- All data stays in the browser: **IndexedDB**, with a **localStorage**
  fallback.
- No login. No external AI. No analytics. No tracking. No network submission.
- Data leaves the device **only** when the user exports CSV/HTML or prints.
- Uses "student name **or code**" language — full names are never required.

## Files

| File                      | Global                  | Purpose                          |
| ------------------------- | ----------------------- | -------------------------------- |
| `evidence-layer.js`       | `window.Evidence`       | Core engine + public API         |
| `report-renderer.js`      | `window.EvidenceReport` | Student/Teacher/Family report UI |
| `export-utils.js`         | `window.EvidenceCSV`    | RFC-4180 CSV build + download    |
| `misconception-tags.json` | —                       | Single source of truth for tags  |
| `evidence-demo.html`      | —                       | Minimal integration example      |

Load order in HTML (helpers first, engine last):

```html
<script src="/shared/evidence/export-utils.js"></script>
<script src="/shared/evidence/report-renderer.js"></script>
<script src="/shared/evidence/evidence-layer.js"></script>
```

## Copy/paste integration

```html
<div id="report-host"></div>
<script src="/shared/evidence/export-utils.js"></script>
<script src="/shared/evidence/report-renderer.js"></script>
<script src="/shared/evidence/evidence-layer.js"></script>
<script>
  // 1. Start a session when the student begins.
  Evidence.startSession({
    studentNameOrCode: "Student 12", // or a class code
    lessonId: "stats-mmmr",
    activityId: "my-activity",
    activityTitle: "My Activity Title",
    standard: "6.SP.B.5",
    skillFocus: "mean, median, mode, range",
    languageSupport: "ESOL sentence starters",
  });

  // 2. Log each attempt as the student works.
  Evidence.logAttempt({
    problemId: "p1",
    skill: "mean",
    prompt: "Find the mean of 4, 6, 10, 8",
    studentAnswer: "7",
    correctAnswer: "7",
    result: "correct", // "correct" | "incorrect"
    hintUsed: false,
    attempts: 1,
    explanation: "I added the numbers to get 28, then divided by 4.",
    misconceptionTag: "", // optional, from misconception-tags.json
  });

  // 3. End the session and render the report.
  Evidence.endSession();
  Evidence.renderReport(document.getElementById("report-host"));
</script>
```

## API

| Method                             | Description                                          |
| ---------------------------------- | ---------------------------------------------------- |
| `Evidence.startSession(opts)`      | Begin a session; returns a `sessionId`.              |
| `Evidence.logAttempt(entry)`       | Record one attempt; returns the stored record.       |
| `Evidence.endSession()`            | Mark the session complete; returns the summary.      |
| `Evidence.getSessionSummary()`     | Computed summary (score, per-skill, misconceptions). |
| `Evidence.clearSession()`          | Delete the current session from all storage.         |
| `Evidence.exportCSV()`             | Return the CSV string.                               |
| `Evidence.downloadCSV(filename?)`  | Trigger a CSV download.                              |
| `Evidence.renderReport(container)` | Render the report; returns a Promise.                |
| `Evidence.scoreExplanation(text)`  | `{ level, label, words, hasVocab }`.                 |

Explanation levels: `missing` (0 words), `too_short` (1–5), `basic` (6–12),
`developing`/`strong` (13+; strong when math vocabulary is present).

## CSV columns

`sessionId, studentNameOrCode, lessonId, activityId, standard, problemId, skill,
result, attempts, hintUsed, misconceptionTag, explanation, timestamp`

Fields are RFC-4180 escaped (commas, quotes, apostrophes, line breaks, blanks)
and a UTF-8 BOM is prepended so Excel/Sheets render accents and ñ correctly.

## Future integration ideas

- Wire `getSessionSummary()` into the existing Student Growth Tracker dashboard.
- Add an opt-in teacher export to Cloudflare D1 (mirroring the Save/Resume
  opt-in model) — still local by default.
- Expand `misconception-tags.json` per unit as new activities adopt the layer.
- Aggregate multiple saved sessions for a per-student growth view.

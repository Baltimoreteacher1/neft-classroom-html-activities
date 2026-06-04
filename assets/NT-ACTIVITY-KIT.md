# Neft Teacher — Activity Kit

A reusable, offline-first drop-in that gives **every** Neft Teacher activity:

- a persistent **student-name** bar (name + optional section/period),
- **auto-grading** with a clear results panel,
- **Save as PDF** and **Save as DOC** exports (student name on every export),
- **local result storage** that can be collected and uploaded to a grading folder.

No build step. No framework. Two static files (`nt-activity-kit.css`, `nt-activity-kit.js`).

---

## 4-line integration

Add these to any activity page:

```html
<link rel="stylesheet" href="nt-activity-kit.css" />
<!-- 1 -->
<div id="ntkit"></div>
<!-- 2 -->
<script src="nt-activity-kit.js"></script>
<!-- 3 -->
<script>
  NTKit.mount("#ntkit"); /* then call NTKit.grade(...) on submit */
</script>
<!-- 4 -->
```

`NTKit.mount()` renders the student-identity bar, the **Save as PDF** / **Save as DOC**
buttons, and an (initially empty) results panel inside the target element.

---

## Grading

Call `NTKit.grade(...)` when the student submits:

```js
NTKit.grade({
  activityId: "unit-8-stats", // used in export filenames + stored results
  activityTitle: "Unit 8 · Statistics — Quick Check",
  standard: "6.SP.B.5", // optional
  items: [
    {
      prompt: "Mean of 4, 8, 6",
      studentAnswer: a1.value,
      correctAnswer: "6",
      points: 1,
      skill: "Mean",
    },
    {
      prompt: "Median of 3, 9, 5, 1, 7",
      studentAnswer: a2.value,
      correctAnswer: "5",
      points: 1,
      skill: "Median",
    },
    {
      prompt: "Range of 2, 10, 5",
      studentAnswer: a3.value,
      correctAnswer: "8",
      points: 1,
      skill: "Range",
    },
  ],
});
```

**Returns** (and renders) `{ scorePercent, earned, possible, perItem[], skills{} }`.

- Answer matching is case-insensitive and whitespace-normalized (`"  5 "` === `"5"`).
- `points` defaults to `1`; `skill` defaults to `"General"`.
- The results panel shows the score %, each item ✓/✗ with the correct answer when wrong,
  and a per-skill breakdown.

### Item fields

| field           | required | notes                                |
| --------------- | -------- | ------------------------------------ |
| `prompt`        | no       | shown in panel + exports             |
| `studentAnswer` | yes      | what the student entered             |
| `correctAnswer` | yes      | expected answer (string/number)      |
| `points`        | no       | defaults to `1`                      |
| `skill`         | no       | groups items for the skill breakdown |

---

## Student identity

- Captured in the mounted bar; persisted to `localStorage` key **`nt_student`**
  as `{ alias, section }`.
- Editable at any time; re-used across every activity on the device.
- Read/write programmatically: `NTKit.getStudent()` / `NTKit.setStudent({ alias, section })`.

---

## Exports

Both buttons include the student name, section, activity title, standard,
score, per-item results, and skill breakdown.

- **Save as PDF** — uses a print stylesheet + `window.print()` (choose "Save as PDF" in
  the print dialog). If the page has loaded `html2pdf` from a CDN, it is used automatically
  for a direct download; otherwise it falls back to print, and if pop-ups are blocked it
  prints the report inline.
- **Save as DOC** — downloads a Word-compatible `.doc` (an `application/msword` HTML Blob).

### Filenames

```
PDF:  <SafeName>_<activityId>_results.pdf   e.g. JaneDoe_unit-8-stats_results.pdf
DOC:  <SafeName>_<activityId>.doc           e.g. JaneDoe_unit-8-stats.doc
```

`SafeName` is the student name with non-alphanumeric characters stripped
(falls back to `Student`). Browsers that honor the download/print title use these names.

---

## Stored results → grading folder

Every `grade()` call appends a record to `localStorage` key **`nt_results_v1`**:

```json
{
  "schema": "nt_result_v1",
  "studentAlias": "Jane Doe",
  "section": "P3",
  "activityId": "unit-8-stats",
  "activityTitle": "Unit 8 · Statistics — Quick Check",
  "standard": "6.SP.B.5",
  "scorePercent": 66.7,
  "skills": {
    "Mean": { "earned": 1, "possible": 1 },
    "Median": { "earned": 0, "possible": 1 },
    "Range": { "earned": 1, "possible": 1 }
  },
  "completedAt": "2026-05-31T14:00:00.000Z",
  "deviceOnly": true
}
```

Collect for upload to a grading folder:

```js
const blob = new Blob([JSON.stringify(NTKit.getResults(), null, 2)], {
  type: "application/json",
});
// download blob, or POST it to your grading endpoint / drop it in the shared grading folder.
```

Helpers: `NTKit.getResults()` (array) and `NTKit.clearResults()`.

`deviceOnly: true` flags that results live on the device until intentionally exported/uploaded.

---

## API summary

| Method                              | Purpose                                       |
| ----------------------------------- | --------------------------------------------- |
| `NTKit.mount(target)`               | Render identity bar + buttons + results panel |
| `NTKit.grade(opts)`                 | Grade items, render panel, persist result     |
| `NTKit.getStudent()`                | `{ alias, section }`                          |
| `NTKit.setStudent({alias,section})` | Update + persist student identity             |
| `NTKit.getResults()`                | All stored result records (array)             |
| `NTKit.clearResults()`              | Clear `nt_results_v1`                         |
| `NTKit.savePDF()` / `saveDOC()`     | Trigger exports programmatically              |

See `nt-activity-kit-demo.html` for a working 3-question example.

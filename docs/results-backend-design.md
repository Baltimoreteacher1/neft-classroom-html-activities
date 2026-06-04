# Results Backend — Design & Rollout

Closes the loop: **student finishes activity → result syncs → teacher dashboard →
LP debrief → next lesson adjusts**, without breaking offline use or storing PII.

## Premise corrections (from repo evaluation)

| Brief                                    | Reality                                                 | Resolution                                                                                                              |
| ---------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| repo `~/GitHub/neft-teacher-app-library` | doesn't exist                                           | live repo `~/neft-classroom-html-activities`                                                                            |
| extend `ewl_` wrapper                    | no `ewl_` exists; real layer is `nt-results.js` / `nt_` | extend `nt_` (EduWonderLab→Neft Teacher rename); don't rewrite                                                          |
| games carry misconception tags in config | none found                                              | **activity-layer dependency** — schema supports tags day 1; `/debrief` reports "none tagged" until activities emit them |

## 1. Schema

`migrations/0001_init.sql`: `teachers`, `classes`, `results`. Everything keyed by
`teacher_id`; a new teacher/class is a row INSERT, never a migration. The
`results` table has **no name column** — `student_ref` only (PII-safe by design).
Index `(teacher_id, class_code, standard, attempt_timestamp)` covers every read.

## 2. Migrations

D1 native `migrations/` folder. Later fields = new file
(`0002_add_x.sql` → `ALTER TABLE results ADD COLUMN x …;`), applied with
`wrangler d1 migrations apply`. Existing rows keep data; new columns default-null.
No drops, no data loss.

## 3. Worker API (`src/worker.js`)

- `POST /results` — one or many; validates; rejects PII fields; `INSERT … ON
CONFLICT(id) DO NOTHING` (idempotent UUID dedupe). Write-key scoped.
- `GET /results` — raw rows; filter `teacher_id+class_code+standard+from+to`. Read-key.
- `GET /debrief` — LP block (text, or `?format=json`); filters as above; aggregates
  `misconception_tags` → top misconception per filter. Read-key.
- `GET /export` — CSV. Read-key.
- `DELETE /purge` — by `teacher_id` (+ optional `class_code`), needs `confirm=yes`. Read-key.

**Auth (honest):** per-class **write key is not secret** (client HTML) — scoping
only. Teacher **read key** is the real credential. No student auth / anti-cheat.
This is formative diagnostic data, not a gradebook.

### `/debrief` output (verified on real SQLite)

```
Class average: 57%
Top misconception: divide-vs-multiply (n=2)
Struggling students: 2 (refs 07, 12)
Notes: 3 attempts on 6.NS.1 from 2026-06-01 to 2026-06-02. 2/3 flagged "divide-vs-multiply".
```

## 4. Offline-sync (`assets/nt-sync.js`)

Wraps `NTResults.finish` (does not rewrite it). On completion: build a PII-free
result, assign `crypto.randomUUID()`, push to `localStorage["nt_sync_queue"]`
(`nt_` prefix preserved), return immediately — **never blocks**. Flush on
`online`, on load, every 30s, and on tap. Server dedupes on UUID. A fixed pill
shows **✓ Synced / ⏳ Pending(n) / ⚠ Failed** — silent failure is impossible.
The student's typed NAME is never read or sent; `student_ref` (roster #/handle)
is collected separately and cached in `nt_student_ref`.

## 5. Dashboard consumer

**First reader: Class Dashboard** (already understands the results shape).
Minimal change = a server-read view that calls `GET /results` + `GET /debrief`;
shipped as `class-dashboard/server-debrief.html` so the existing offline
localStorage dashboard is untouched. Data Studio is the richer second reader later.

---

# Rollout (Phase 3)

### A. Copy-paste snippet (any activity)

```html
<!-- after /teacher-tools/nt-results.js -->
<script>
  window.NT_SYNC = {
    endpoint: "https://neft-results.<acct>.workers.dev",
    teacher_id: "neft",
    class_code: "P3-MATH",
    write_key: "WRITEKEY",
    activity_slug: "UNIQUE-SLUG",
    standard: "6.NS.1",
  };
</script>
<script src="/assets/nt-sync.js"></script>
```

Activities that already call `NTResults.finish` need nothing else. To power "top
misconception," pass tags: `NTResults.finish({ …, misconception_tags:["slant-as-height"] })`.

### B. Wiring order

1. **Reviews / pre-tests** (clean score+standard) — start here.
2. **Games / graphic novels** (add distractor→misconception tags — the real value).
3. **Lessons** (multi-section; map sections→standards).

### C. Production deploy (Joel)

`wrangler d1 create neft-results-prod` → `migrations apply --remote` → seed
teacher/class keys → `wrangler deploy` → set activity `endpoint` → tighten CORS
from `*` to the Pages origin → verify before linking broadly.

### D. Pre-launch checklist

POST one result · POST same UUID twice (expect 1 row) · offline-queue→reconnect
(expect synced, 1 row) · dashboard read · CSV export · `DELETE /purge` on
**preview** data first · `/debrief` sanity vs known seed.

### E. LP trigger paste-ready string

```
DEBRIEF (auto): paste the GET /debrief output below into the lesson-plan generator source.
Class average: {{avg}}%
Top misconception: {{top}}
Struggling students: {{count}} (refs {{refs}})
Notes: {{notes}}
→ Adjust the next lesson's Do-Now and reteach to target the top misconception above.
```

(`GET /debrief` already emits the first four lines verbatim; the generator parses them.)

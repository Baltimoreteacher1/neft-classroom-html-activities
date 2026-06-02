# Neft Results Backend (Worker + D1)

Formative-results backend for the classroom hub. Collects activity results,
serves the teacher dashboard, and emits an LP-compatible per-standard debrief.

**Security model (honest):** formative diagnostic data, **not** secured grades.
The per-class **write key ships in client HTML and is not secret** — it only
scopes/deters writes. The teacher **read key** is the only real credential. No
student auth, no anti-cheat. **No PII:** results carry `teacher_id + class_code +
student_ref` only; the Worker rejects any payload with a name field.

> Note on the storage prefix: the brief calls it `ewl_`; the live repo renamed
> that family to `nt_` (EduWonderLab → Neft Teacher). `nt-sync.js` extends the
> real `nt_` layer and does not rewrite `nt-results.js`.

## Files

- `migrations/0001_init.sql` — schema (teachers, classes, results + index)
- `src/worker.js` — Worker: `POST/GET /results`, `GET /debrief`, `GET /export`, `DELETE /purge`
- `wrangler.toml` — DEV config (paste your dev `database_id`)
- `../assets/nt-sync.js` — offline-first client queue + status pill
- `../pre-test/unit2-review.html` — POC activity (wired)
- `../teacher-tools/class-dashboard/server-debrief.html` — POC dashboard reader

## Local test steps (no cloud, local D1)

```bash
cd results-worker
npx wrangler d1 create neft-results-dev        # paste database_id into wrangler.toml
npx wrangler d1 migrations apply neft-results-dev --local
# seed a teacher + class (read/write keys):
npx wrangler d1 execute neft-results-dev --local --command \
  "INSERT INTO teachers VALUES('neft','Joel','READKEY','2026-06-02');
   INSERT INTO classes  VALUES('neft','P3-MATH','Period 3','WRITEKEY','2026-06-02');"
npx wrangler dev                               # serves http://localhost:8787
```

Serve the site (separate terminal) so the activity + dashboard can reach the Worker:

```bash
python3 -m http.server 8000      # from repo root
```

### Activity click path

1. Open `http://localhost:8000/pre-test/unit2-review.html`.
2. When prompted, enter a **class number/handle** (e.g. `03`) — never a name.
3. Finish the review. A **✓ Synced** pill appears (bottom-right).

### Dashboard / debrief click path

1. Open `http://localhost:8000/teacher-tools/class-dashboard/server-debrief.html`.
2. Endpoint `http://localhost:8787`, teacher `neft`, class `P3-MATH`, read key `READKEY`.
3. Click **Load** → the **LP Debrief** block and the **raw results** table render.

### Debrief endpoint test (curl)

```bash
curl "http://localhost:8787/debrief?teacher_id=neft&class_code=P3-MATH&standard=6.NS.1" \
  -H "x-read-key: READKEY"
# -> Class average / Top misconception / Struggling students / Notes
```

### Offline test path (the important one)

1. With the activity open, **DevTools → Network → Offline** (or airplane mode).
2. Complete the review → pill shows **⏳ Pending (1)** (result queued, activity not blocked).
3. Re-enable network → pill flips to **✓ Synced** within ~30s (or tap it to retry now).
4. Reload the activity and finish again with the **same** queued item still present, or
   re-run the flush twice: the server **dedupes on UUID** →
   ```bash
   curl "http://localhost:8787/results?teacher_id=neft&class_code=P3-MATH" -H "x-read-key: READKEY" | grep -c '"id"'
   ```
   shows **one** record per attempt, never a duplicate.

## Production (Joel runs this himself — not automated)

```bash
npx wrangler d1 create neft-results-prod
npx wrangler d1 migrations apply neft-results-prod --remote
# set a strong read key per teacher + write key per class via the seed INSERTs
npx wrangler deploy
```

Then set each activity's `window.NT_SYNC.endpoint` to the deployed Worker URL and
tighten CORS in `worker.js` from `*` to the Pages origin.

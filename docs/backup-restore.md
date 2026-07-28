# D1 backup & restore runbook

`neft-student-progress` is the only data in this project that cannot be rebuilt
from a `npm run build`. Everything else — every lesson, game, and page — is
regenerated from source on every deploy. This database is not.

What it holds:

| Table                                                    | Why it matters                                                                        |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `student_progress`                                       | Per-student lesson progress                                                           |
| `lesson_telemetry`                                       | Which lessons are opened and for how long (drives `report:usage`)                     |
| `game_scores`, `game_progress`                           | Arcade + unit game results                                                            |
| `monster_saves`                                          | Monster Math Academy saves                                                            |
| `class_board`, `board_codes`, `board_checkin`            | The Class Board join codes and check-ins                                              |
| `family_connections_state`, `family_connections_history` | Family Connections                                                                    |
| `supports_roster`, `supports_guard`                      | Learning-supports roster                                                              |
| `site_settings`                                          | Global settings, including the warm-up timer                                          |
| `class_roster`                                           | First-name + last-initial roster (**not provisioned in production as of 2026-07-28**) |

## Taking a backup

```bash
npm run backup:d1                 # → ~/neft-backups/d1/
npm run backup:d1 -- --keep 90    # change retention (default 30 days)
npm run backup:d1 -- --out /some/dir
```

The script does three things, and fails the run if any of them fails:

1. `wrangler d1 export --remote` the whole database.
2. **Replays the dump into a scratch SQLite database** and counts rows per
   table. A dump that does not restore is not accepted.
3. Gzips it, writes `latest.json` (row counts + timestamp), and prunes old
   captures.

Backups land in `~/neft-backups/d1/` — deliberately **outside the repo**. They
contain student data, and this repo is edited by automation that auto-commits
and pushes to `main`.

Nightly in CI: `.github/workflows/backup-d1.yml` runs at 07:10 UTC and uploads
the capture as a workflow artifact with 90-day retention. Artifacts, not
commits, for the same reason.

## Restoring

Restoring **overwrites live data**. There is deliberately no script for it.

```bash
# 1. Take a fresh backup first — you may need to undo the restore.
npm run backup:d1

# 2. Unpack the capture you want.
gunzip -c ~/neft-backups/d1/neft-student-progress-YYYY-MM-DD.sql.gz > /tmp/restore.sql

# 3. Inspect it locally before touching production.
sqlite3 /tmp/check.db < /tmp/restore.sql
sqlite3 /tmp/check.db "SELECT COUNT(*) FROM student_progress;"

# 4. Apply to production.
npx wrangler d1 execute neft-student-progress --remote --file /tmp/restore.sql

# 5. Verify.
npx wrangler d1 execute neft-student-progress --remote \
  --command "SELECT COUNT(*) FROM lesson_telemetry;"
```

Note that the export contains `CREATE TABLE` statements without `DROP`, so
restoring into a database that still has the tables will error on the create
and/or duplicate rows. For a true point-in-time restore, drop the affected
tables first — and only after you have taken the fresh backup in step 1.

## Before any destructive migration

```bash
npm run backup:d1 && npm run report:usage
```

The second command gives you row-level context (what was live, and how much of
it) so you can tell afterwards whether anything went missing.

# Restore-from-backup policy: deleted data must not come back silently

Status: policy for operators. It describes what the code and tools in this repository support today.
It is not a legal statement and does not claim compliance with any law.

## The problem

`npm run backup:d1` (see `docs/backup-restore.md`) exports the whole D1 database nightly and keeps
captures for 30 days by default. A backup taken on Monday still holds the class a teacher deleted on
Tuesday. Restoring it brings that class back. The deletion receipts live in the same database
(`privacy_deletion_receipt`, migration 0020), so a restore to a point before a deletion also removes the
receipt that proves the deletion.

## What this repository provides

- Every class or student deletion appends a receipt: scope (class code, or class code plus an opaque
  student id), row counts per table, time, and a digest chained to the previous receipt. Receipts hold no
  alias, name or answer, so they are safe to keep with backups.
- `tools/privacy-verify-receipt.mjs` recomputes the digests and checks the chain.
- `tools/privacy-reapply-receipts.mjs --dry-run` reads exported receipts and a restored SQLite copy and
  prints which rows a re-delete would remove. It is read-only. Applying is deliberately not implemented:
  re-deleting is a reviewed manual step (below).

## Procedure after any restore

1. **Before restoring, export the receipts from the live database.** The export is read-only and holds
   no student content:

   ```bash
   npx wrangler d1 execute neft-student-progress --remote --json \
     --command "SELECT * FROM privacy_deletion_receipt ORDER BY seq"
   ```

   Convert the rows to the receipt shape (`id`, `scope`, `counts`, `deletedAt`, `priorReceiptDigest`,
   `digest`) in an ordered JSON array. If the live database is already lost, use the most recent receipt
   export you kept; receipts newer than that export are the gap the policy cannot close (see Limits).
2. **Restore into a scratch database first, never straight over the live one.** `backup:d1` already replays
   a dump into SQLite; reuse that file.
3. **Verify the chain:** `node tools/privacy-verify-receipt.mjs receipts.json`. Exit 1 means a receipt was
   edited or removed; stop and investigate before using it to drive deletes.
4. **Dry run:** `node tools/privacy-reapply-receipts.mjs --dry-run --receipts receipts.json --db restored.sqlite`.
   Every `WOULD DELETE` line is data a teacher asked to have deleted that the backup brought back.
5. **Re-apply the deletions before the restored database serves any traffic.** For each listed scope, run
   the same delete the teacher ran (`deleteClass` or `deleteStudent` from `functions/_lib/privacy/delete.js`)
   against the restored database, which also appends a fresh receipt there. A person reviews the dry-run
   output first.
6. **Re-run the dry run.** Every line must read `clean`. Only then promote the restored database.
7. Keep the receipt export with the restore record.

## Limits (stated plainly)

- Backup files made before a deletion still contain the deleted data until the backup is pruned (30 days by
  default for local captures; the weekly Drive backup keeps four). Deletion in the live database does not
  reach backup copies.
- A receipt only exists for deletions made through the new endpoints or the retention job. Deletions made
  through `/api/class/delete`, `/api/class/remove-student`, `DELETE /api/roster/save`,
  `/api/class-data/purge` or the results worker's `/purge` write no receipt, so this procedure cannot
  re-apply them.
- Receipts older than the last export are lost with the database they were stored in. Exporting them
  regularly (for example with each backup) narrows the gap.
- Tables outside the class platform (`class_roster`, `class_data_*`, `insight_signal` and others) are not
  covered by receipts; `functions/_lib/privacy/tables.js` lists each with the reason.

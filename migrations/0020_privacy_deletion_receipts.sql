-- 0020_privacy_deletion_receipts.sql — append-only receipts for class and student deletions.
--
-- Written by functions/_lib/privacy/delete.js after a delete-class or delete-student batch commits.
-- A receipt says WHAT was deleted (a class code, or a class code plus an opaque student id), HOW MANY
-- rows left each table, and WHEN. It never holds a name, alias, answer, recording or any other student
-- content: counts_json is { table: integer }. Each receipt's digest covers the previous receipt's
-- digest, so removing or editing a row breaks the chain (tools/privacy-verify-receipt.mjs).
--
-- Append-only: the triggers refuse UPDATE and DELETE. prior_digest is UNIQUE, so two writers that
-- read the same chain head cannot both append: the second insert fails and retries on the new head.
-- docs/privacy/restore-policy.md explains how receipts are re-applied after a backup restore.

CREATE TABLE IF NOT EXISTS privacy_deletion_receipt (
  seq          INTEGER PRIMARY KEY AUTOINCREMENT,
  id           TEXT NOT NULL UNIQUE,
  scope_type   TEXT NOT NULL CHECK (scope_type IN ('class', 'student')),
  class_code   TEXT NOT NULL,
  student_id   TEXT,
  counts_json  TEXT NOT NULL,
  deleted_at   INTEGER NOT NULL,
  actor        TEXT NOT NULL CHECK (actor IN ('teacher', 'site', 'retention')),
  prior_digest TEXT NOT NULL UNIQUE,
  digest       TEXT NOT NULL UNIQUE
);

CREATE INDEX IF NOT EXISTS privacy_deletion_receipt_class
  ON privacy_deletion_receipt (class_code, deleted_at);

CREATE TRIGGER IF NOT EXISTS privacy_deletion_receipt_no_update
BEFORE UPDATE ON privacy_deletion_receipt
BEGIN
  SELECT RAISE(ABORT, 'privacy_deletion_receipt is append-only');
END;

CREATE TRIGGER IF NOT EXISTS privacy_deletion_receipt_no_delete
BEFORE DELETE ON privacy_deletion_receipt
BEGIN
  SELECT RAISE(ABORT, 'privacy_deletion_receipt is append-only');
END;

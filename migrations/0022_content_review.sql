-- 0022_content_review.sql — human review workflow and release trains for BCPSS Language Studio content.
--
-- Content blocks (schema v2) are never stored here. A block is the content a unit or lesson file produces
-- today; this schema records WHO reviewed WHICH hash of it, and which set of hashes shipped as a release.
-- NO student data: no alias, no answer, no recording, no class code. The only people named are the adult
-- reviewers (name, role) who typed their own name into the reviewer queue.
--
--   review_event     append-only log of every human decision, hash-chained (tools/review-logic.test.mjs
--                    proves a tampered row breaks the chain). snapshot_json is the content as it stood
--                    when the decision was made, so a later edit can be shown side by side.
--   review_state     projection of the latest decision per (block, dimension, lang). Rebuildable by
--                    replaying review_event; the API overlays it on the migrated block defaults.
--   content_release  immutable release: manifest_json maps block id -> content hash.
--   release_pointer  the single row naming the current release; rollback moves it in one statement.
--
-- Additive and idempotent: every statement is IF NOT EXISTS. Nothing here alters an existing table.

CREATE TABLE IF NOT EXISTS review_event (
  seq           INTEGER PRIMARY KEY AUTOINCREMENT,
  id            TEXT NOT NULL UNIQUE,
  block_id      TEXT NOT NULL,
  kind          TEXT NOT NULL CHECK (kind IN ('decide', 'bulk')),
  dimension     TEXT NOT NULL CHECK (dimension IN
                  ('pedagogy', 'language_qa', 'accessibility', 'bias_sensitivity', 'math_science_accuracy', 'translation')),
  lang          TEXT NOT NULL DEFAULT '',
  from_state    TEXT NOT NULL CHECK (from_state IN ('draft', 'in_review', 'reviewed', 'needs_changes', 'retired')),
  to_state      TEXT NOT NULL CHECK (to_state   IN ('draft', 'in_review', 'reviewed', 'needs_changes', 'retired')),
  reviewer_name TEXT NOT NULL CHECK (length(reviewer_name) BETWEEN 1 AND 80),
  reviewer_role TEXT NOT NULL CHECK (reviewer_role IN ('author', 'pedagogy', 'language', 'accessibility', 'admin')),
  reviewer_date TEXT NOT NULL,
  -- The database refuses a non-human actor outright: no code path can store a model's approval.
  actor         TEXT NOT NULL CHECK (actor = 'human'),
  content_hash  TEXT NOT NULL CHECK (length(content_hash) = 64),
  snapshot_json TEXT NOT NULL,
  comment       TEXT NOT NULL DEFAULT '' CHECK (length(comment) <= 500),
  bulk_id       TEXT,
  created_at    INTEGER NOT NULL,
  -- Hash chain. prior_digest is UNIQUE, so two writers that read the same chain head cannot both
  -- append: the second insert fails and the caller retries on the new head.
  prior_digest  TEXT NOT NULL UNIQUE,
  digest        TEXT NOT NULL UNIQUE
);

CREATE INDEX IF NOT EXISTS review_event_block ON review_event (block_id, seq);

CREATE TRIGGER IF NOT EXISTS review_event_no_update
BEFORE UPDATE ON review_event
BEGIN
  SELECT RAISE(ABORT, 'review_event is append-only');
END;

CREATE TRIGGER IF NOT EXISTS review_event_no_delete
BEFORE DELETE ON review_event
BEGIN
  SELECT RAISE(ABORT, 'review_event is append-only');
END;

CREATE TABLE IF NOT EXISTS review_state (
  block_id      TEXT NOT NULL,
  dimension     TEXT NOT NULL CHECK (dimension IN
                  ('pedagogy', 'language_qa', 'accessibility', 'bias_sensitivity', 'math_science_accuracy', 'translation')),
  lang          TEXT NOT NULL DEFAULT '',
  state         TEXT NOT NULL CHECK (state IN ('draft', 'in_review', 'reviewed', 'needs_changes', 'retired')),
  reviewed_hash TEXT,
  reviewer_name TEXT NOT NULL,
  reviewer_role TEXT NOT NULL,
  reviewer_date TEXT NOT NULL,
  event_seq     INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL,
  PRIMARY KEY (block_id, dimension, lang)
);

CREATE TABLE IF NOT EXISTS content_release (
  seq                INTEGER PRIMARY KEY AUTOINCREMENT,
  id                 TEXT NOT NULL UNIQUE CHECK (id GLOB 'content-[0-9][0-9][0-9][0-9].[0-9]*.[0-9]*'),
  manifest_json      TEXT NOT NULL,
  manifest_digest    TEXT NOT NULL CHECK (length(manifest_digest) = 64),
  changelog_json     TEXT NOT NULL,
  verifiers_ran_json TEXT NOT NULL,
  created_by         TEXT NOT NULL CHECK (length(created_by) BETWEEN 1 AND 80),
  created_at         INTEGER NOT NULL,
  status             TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'rolled_back')),
  previous_id        TEXT
);

-- A release is a snapshot: only its status may change (published -> rolled_back). It is never deleted.
CREATE TRIGGER IF NOT EXISTS content_release_immutable
BEFORE UPDATE ON content_release
WHEN NEW.id != OLD.id
  OR NEW.manifest_json != OLD.manifest_json
  OR NEW.manifest_digest != OLD.manifest_digest
  OR NEW.changelog_json != OLD.changelog_json
  OR NEW.verifiers_ran_json != OLD.verifiers_ran_json
  OR NEW.created_by != OLD.created_by
  OR NEW.created_at != OLD.created_at
  OR NEW.previous_id IS NOT OLD.previous_id
BEGIN
  SELECT RAISE(ABORT, 'content_release is immutable except status');
END;

CREATE TRIGGER IF NOT EXISTS content_release_no_delete
BEFORE DELETE ON content_release
BEGIN
  SELECT RAISE(ABORT, 'content_release is never deleted');
END;

CREATE TABLE IF NOT EXISTS release_pointer (
  id         INTEGER PRIMARY KEY CHECK (id = 1),
  release_id TEXT NOT NULL REFERENCES content_release (id),
  moved_by   TEXT NOT NULL,
  reason     TEXT NOT NULL CHECK (reason IN ('create', 'rollback')),
  updated_at INTEGER NOT NULL
);

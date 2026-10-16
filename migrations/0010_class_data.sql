-- 0010_class_data.sql — "Our Class Investigation" (functions/api/class-data).
--
-- One real question, asked all year; each unit adds a tool; Unit 2 analyses the
-- whole dataset. This is the anonymous, append-only store behind it.
--
-- The Pages Function creates these lazily with CREATE TABLE IF NOT EXISTS (the
-- pattern in functions/api/sg-room), so applying this migration is optional and
-- idempotent. It is committed as the schema of record, and
-- functions/api/class-data/class-data.test.mjs fails if the two ever differ.
--
-- PRIVACY: there is no column that can hold a name. `values_json` carries only
-- numbers in declared ranges and ids from a fixed choice list (the Function
-- refuses every other key). `contributor` is a salted hash of a random id that
-- lives in one browser; the id itself is never stored. See
-- docs/privacy/class-investigation.md.

CREATE TABLE IF NOT EXISTS class_data_class (
  code           TEXT PRIMARY KEY,
  salt           TEXT NOT NULL,
  active_template TEXT NOT NULL,
  created_at     INTEGER NOT NULL,
  last_active_at INTEGER NOT NULL,
  expires_at     INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS class_data_class_expires ON class_data_class (expires_at);

CREATE TABLE IF NOT EXISTS class_data_investigation (
  code        TEXT NOT NULL,
  template_id TEXT NOT NULL,
  options_json TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'open',
  opened_at   INTEGER NOT NULL,
  closed_at   INTEGER,
  PRIMARY KEY (code, template_id)
);

CREATE TABLE IF NOT EXISTS class_data_entry (
  code        TEXT NOT NULL,
  template_id TEXT NOT NULL,
  entry_id    TEXT NOT NULL,
  contributor TEXT NOT NULL,
  values_json TEXT NOT NULL,
  source      TEXT NOT NULL,
  created_at  INTEGER NOT NULL,
  -- The client's random entry id is the idempotency key: a retry after a lost
  -- response is INSERT OR IGNOREd, never counted twice. Rows are never updated.
  PRIMARY KEY (code, template_id, entry_id)
);

CREATE INDEX IF NOT EXISTS class_data_entry_contributor
  ON class_data_entry (code, template_id, contributor);

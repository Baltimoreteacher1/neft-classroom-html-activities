-- Cloudflare D1 (SQLite) migration for BCPSS Curriculum-to-Language Ecosystem
-- Stores shared teacher plans and lightweight unit telemetry at the edge.

CREATE TABLE IF NOT EXISTS bcpss_shared_plans (
  id TEXT PRIMARY KEY,
  unit_id TEXT NOT NULL,
  wida_tier TEXT NOT NULL,
  teacher_note TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_bcpss_shared_plans_unit_id
  ON bcpss_shared_plans (unit_id);

CREATE INDEX IF NOT EXISTS idx_bcpss_shared_plans_created_at
  ON bcpss_shared_plans (created_at DESC);

CREATE TABLE IF NOT EXISTS bcpss_unit_telemetry (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  unit_id TEXT NOT NULL,
  wida_tier TEXT,
  event_type TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_bcpss_unit_telemetry_created_unit
  ON bcpss_unit_telemetry (created_at DESC, unit_id);

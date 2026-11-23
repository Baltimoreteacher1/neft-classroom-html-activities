-- 002_bcpss_shared_plans.sql
-- Teacher-shared instructional plans keyed to BCPSS units and WIDA tiers (Neon Postgres).
-- Idempotent: safe to re-run without dropping or mutating existing data.

CREATE TABLE IF NOT EXISTS bcpss_shared_plans (
  id TEXT PRIMARY KEY,
  unit_id TEXT NOT NULL REFERENCES bcpss_units(id) ON DELETE CASCADE,
  wida_tier TEXT NOT NULL,
  teacher_note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bcpss_shared_plans_unit_id
  ON bcpss_shared_plans (unit_id);

-- 001_bcpss_curriculum_hub.sql
-- Core schema for the BCPSS K-8 Multilingual Curriculum Hub (Neon Postgres).
-- Idempotent: safe to re-run without dropping or mutating existing data.

CREATE TABLE IF NOT EXISTS bcpss_units (
  id TEXT PRIMARY KEY,
  grade TEXT NOT NULL,
  subject TEXT NOT NULL,
  curriculum_name TEXT NOT NULL,
  unit_number INTEGER NOT NULL,
  unit_title TEXT NOT NULL,
  unit_summary TEXT NOT NULL,
  core_standards TEXT[] NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bcpss_units_grade_subject_num
  ON bcpss_units (grade, subject, unit_number);

CREATE TABLE IF NOT EXISTS language_blueprints (
  id TEXT PRIMARY KEY,
  wida_klu TEXT NOT NULL,
  move_name TEXT NOT NULL,
  syntax_pattern TEXT NOT NULL,
  scaffolds_json JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS unit_connections (
  id TEXT PRIMARY KEY,
  unit_id TEXT NOT NULL REFERENCES bcpss_units(id) ON DELETE CASCADE,
  blueprint_id TEXT NOT NULL REFERENCES language_blueprints(id) ON DELETE CASCADE,
  unit_example_frame TEXT NOT NULL,
  cross_subject_bridge_note TEXT NOT NULL,
  l1_watchouts JSONB NOT NULL,
  tier2_tier3_vocab JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_unit_connections_unit_id
  ON unit_connections (unit_id);

CREATE INDEX IF NOT EXISTS idx_unit_connections_blueprint_id
  ON unit_connections (blueprint_id);

CREATE TABLE IF NOT EXISTS unit_activities (
  id TEXT PRIMARY KEY,
  unit_id TEXT NOT NULL REFERENCES bcpss_units(id) ON DELETE CASCADE,
  activity_order INTEGER NOT NULL,
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  prep_time_minutes INTEGER NOT NULL,
  teacher_instructions TEXT NOT NULL,
  student_prompt TEXT NOT NULL,
  target_lab_route TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_unit_activities_unit_order
  ON unit_activities (unit_id, activity_order);

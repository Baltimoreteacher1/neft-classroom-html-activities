-- BCPSS Curriculum-to-Language Ecosystem (Neon Serverless Postgres + pgvector)
-- Idempotent DDL for K-8 BCPSS units, WIDA language blueprints, unit connections,
-- classroom activities, shared teacher plans, multilingual family cards, and telemetry.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS bcpss_units (
  id TEXT PRIMARY KEY,
  grade TEXT NOT NULL,
  subject TEXT NOT NULL,
  curriculum_name TEXT NOT NULL,
  unit_number INTEGER NOT NULL,
  unit_title TEXT NOT NULL,
  unit_summary TEXT NOT NULL,
  core_standards TEXT[] NOT NULL,
  external_content_lab_url TEXT,
  external_content_lab_label TEXT,
  embedding vector(1536)
);

CREATE INDEX IF NOT EXISTS idx_bcpss_units_grade_subject_num
  ON bcpss_units (grade, subject, unit_number);

CREATE INDEX IF NOT EXISTS idx_bcpss_units_embedding_hnsw
  ON bcpss_units USING hnsw (embedding vector_cosine_ops);

CREATE TABLE IF NOT EXISTS language_blueprints (
  id TEXT PRIMARY KEY,
  wida_klu TEXT NOT NULL,
  move_name TEXT NOT NULL,
  syntax_pattern TEXT NOT NULL,
  scaffolds_json JSONB NOT NULL,
  embedding vector(1536)
);

CREATE INDEX IF NOT EXISTS idx_language_blueprints_klu
  ON language_blueprints (wida_klu);

CREATE INDEX IF NOT EXISTS idx_language_blueprints_embedding_hnsw
  ON language_blueprints USING hnsw (embedding vector_cosine_ops);

CREATE TABLE IF NOT EXISTS unit_connections (
  id TEXT PRIMARY KEY,
  unit_id TEXT NOT NULL REFERENCES bcpss_units(id) ON DELETE CASCADE,
  blueprint_id TEXT NOT NULL REFERENCES language_blueprints(id) ON DELETE CASCADE,
  unit_example_frame TEXT NOT NULL,
  cross_subject_bridge_note TEXT NOT NULL,
  l1_watchouts JSONB NOT NULL,
  tier2_tier3_vocab JSONB NOT NULL,
  language_exit_ticket_json JSONB NOT NULL
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

CREATE TABLE IF NOT EXISTS bcpss_shared_plans (
  id TEXT PRIMARY KEY,
  unit_id TEXT NOT NULL REFERENCES bcpss_units(id) ON DELETE CASCADE,
  wida_tier TEXT NOT NULL,
  teacher_note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bcpss_shared_plans_unit_id
  ON bcpss_shared_plans (unit_id);

CREATE TABLE IF NOT EXISTS bcpss_family_cards (
  unit_id TEXT PRIMARY KEY REFERENCES bcpss_units(id) ON DELETE CASCADE,
  translations_json JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS bcpss_unit_telemetry (
  id BIGSERIAL PRIMARY KEY,
  unit_id TEXT NOT NULL REFERENCES bcpss_units(id) ON DELETE CASCADE,
  wida_tier TEXT,
  event_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bcpss_unit_telemetry_created_unit
  ON bcpss_unit_telemetry (created_at DESC, unit_id);

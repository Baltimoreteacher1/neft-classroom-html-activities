-- 003_bcpss_pgvector.sql
-- Semantic search vector columns and HNSW cosine indexes (Neon Postgres + pgvector).
-- Idempotent: safe to re-run without dropping or mutating existing data.

CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE language_blueprints
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

ALTER TABLE bcpss_units
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

CREATE INDEX IF NOT EXISTS idx_language_blueprints_embedding
  ON language_blueprints
  USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_bcpss_units_embedding
  ON bcpss_units
  USING hnsw (embedding vector_cosine_ops);

-- 0008_plan_notes.sql — the lesson-plan annotation layer (functions/api/plan-notes).
--
-- Joel already has the BCPS/Reveal plan documents. What he has never had is a
-- place to put what he knows about teaching them: where the timing is wrong,
-- where students predictably trip, what Level 1 does instead, which of his own
-- activities slot in where. That knowledge currently dies each June.
--
-- The Pages Function creates these lazily with CREATE TABLE IF NOT EXISTS (the
-- established pattern in functions/api/progress), so applying this migration is
-- optional and idempotent. It is committed as the schema of record.
--
-- PRIVACY: no student data of any kind lives here. plan_doc rows describe the
-- teacher's own uploaded documents; plan_note rows are the teacher's own words.
-- Document bytes live in Workers KV (binding PLAN_DOCS), never in D1, and every
-- read of either store goes through the TEACHER_KEY gate.

CREATE TABLE IF NOT EXISTS plan_doc (
  sha256       TEXT PRIMARY KEY,
  filename     TEXT NOT NULL,
  mime         TEXT NOT NULL,
  page_count   INTEGER,
  -- Nullable on purpose: a document is uploaded first and linked to a lesson
  -- second, and a wrong auto-link would quietly route notes to the wrong lesson
  -- and poison the nervous-system rollup. Linking is always confirmed by hand.
  lesson_id    TEXT,
  source_label TEXT,
  bytes        INTEGER,
  uploaded_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS plan_doc_lesson ON plan_doc (lesson_id);

CREATE TABLE IF NOT EXISTS plan_note (
  id                 TEXT PRIMARY KEY,
  -- 'lesson:4-4' or 'doc:<sha256>'. A doc linked to a lesson shares that
  -- lesson's rail, so both front doors land on one annotatable object.
  anchor_key         TEXT NOT NULL,
  anchor_ref         TEXT NOT NULL DEFAULT '{}',
  -- timing | watch-for | swap | resource | note
  kind               TEXT NOT NULL,
  body               TEXT NOT NULL DEFAULT '',
  -- swap only: what you do instead. A swap genuinely needs two bodies and this
  -- is the note kind Joel writes most often.
  body_alt           TEXT NOT NULL DEFAULT '',
  -- JSON arrays, each entry validated against functions/_lib/plan-vocab.js at
  -- write time. Unknown value = 400, never a silent insert.
  misconception_tags TEXT NOT NULL DEFAULT '[]',
  standards          TEXT NOT NULL DEFAULT '[]',
  activity_refs      TEXT NOT NULL DEFAULT '[]',
  level              INTEGER,
  timing_min         INTEGER,
  -- 'hand' or 'ai'. An AI-suggested note is never silently indistinguishable
  -- from one Joel wrote; the rail labels it and he can accept or delete it.
  origin             TEXT NOT NULL DEFAULT 'hand',
  created_at         INTEGER NOT NULL,
  updated_at         INTEGER NOT NULL,
  -- Soft delete: a misclick must never lose a note.
  deleted_at         INTEGER
);

CREATE INDEX IF NOT EXISTS plan_note_anchor ON plan_note (anchor_key, deleted_at);
CREATE INDEX IF NOT EXISTS plan_note_updated ON plan_note (updated_at);

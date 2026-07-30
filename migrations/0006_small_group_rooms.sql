-- 0006_small_group_rooms.sql — shared small-group rooms (functions/api/sg-room).
--
-- Four students at one table, one code, private commits, simultaneous reveal.
-- The studio was named for a group but implemented for one device; these two
-- tables are what make the disagreement real instead of simulated.
--
-- The Pages Function creates these lazily with CREATE TABLE IF NOT EXISTS (the
-- established pattern in functions/api/progress), so applying this migration is
-- optional and idempotent. It is committed as the schema of record.
--
-- PRIVACY: seats are numbers. No names, no student ids, no section. Rooms hold
-- short math answers for four hours and expire; the Function prunes expired rows
-- opportunistically on room creation.

CREATE TABLE IF NOT EXISTS sg_room (
  code       TEXT PRIMARY KEY,
  lesson_id  TEXT NOT NULL,
  seats      INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS sg_room_expires ON sg_room (expires_at);

CREATE TABLE IF NOT EXISTS sg_room_commit (
  code     TEXT NOT NULL,
  item_key TEXT NOT NULL,
  seat     INTEGER NOT NULL,
  answer   TEXT NOT NULL,
  at       INTEGER NOT NULL,
  -- One commit per seat per item, and it is final: a student who could revise
  -- after the reveal would learn nothing from the disagreement.
  PRIMARY KEY (code, item_key, seat)
);

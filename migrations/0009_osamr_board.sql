-- OSAMR Case Clinic shared gallery board.
--
-- One row per group per board. functions/api/osamr-board.js also runs an
-- idempotent CREATE TABLE IF NOT EXISTS on every call (same convention as
-- showcase_items), so this migration is the declared schema of record rather
-- than the only way the table can come into existence.
--
-- board_id lets a later session start clean by bumping BOARD_ID in the
-- endpoint, without dropping the previous session's rulings.

CREATE TABLE IF NOT EXISTS osamr_board (
  board_id    TEXT NOT NULL,
  group_id    INTEGER NOT NULL,
  fields_json TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  PRIMARY KEY (board_id, group_id)
);

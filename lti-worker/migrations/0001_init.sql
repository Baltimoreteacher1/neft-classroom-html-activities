-- neft-lti — nonce/replay protection + best-effort launch audit.
-- KV is used first for nonces (native TTL); D1 is the fallback + audit store.

CREATE TABLE IF NOT EXISTS nonces (
  nonce TEXT PRIMARY KEY,
  data  TEXT NOT NULL,
  exp   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_nonces_exp ON nonces (exp);

CREATE TABLE IF NOT EXISTS launch_audit (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  event TEXT NOT NULL,
  meta  TEXT,
  ts    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_ts ON launch_audit (ts);

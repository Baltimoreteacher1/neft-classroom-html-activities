-- Privacy-preserving real-user Core Web Vitals.
--
-- One aggregate row per page/day/device/metric/rating. No visitor IDs, element
-- selectors, query strings, interaction targets, or raw event timelines are
-- stored. `rating` is computed by the server from Google's current good/poor
-- thresholds; the client cannot choose it.

CREATE TABLE IF NOT EXISTS web_vital (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL,
  area TEXT,
  day TEXT NOT NULL,
  device TEXT,
  metric TEXT NOT NULL CHECK (metric IN ('CLS', 'INP', 'LCP')),
  rating TEXT NOT NULL CHECK (rating IN ('good', 'needs-improvement', 'poor')),
  samples INTEGER DEFAULT 0,
  value_sum REAL DEFAULT 0,
  value_max REAL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_web_vital_key
  ON web_vital (path, day, device, metric, rating);

CREATE INDEX IF NOT EXISTS idx_web_vital_day
  ON web_vital (day, metric, device);

// Demo configurations for gallery-b.html and graphics-b.browser.test.mjs: every kind in explore, build and check mode.
import { COORDINATE_GRID } from "./coordinate-grid.js";
import { DECIMAL_PERCENT } from "./decimal-percent.js";
import { GEOMETRY } from "./geometry.js";
import { STATS_DISPLAY } from "./stats-display.js";
import { DOUBLE_NUMBER_LINE } from "./double-number-line.js";

export const KIND_TITLES = {
  "double-number-line": "Double number line",
  "coordinate-grid": "Coordinate grid",
  geometry: "Geometry",
  "decimal-percent": "Decimals and percents",
  "stats-display": "Data displays",
};

export const DEMOS = {
  "double-number-line": DOUBLE_NUMBER_LINE,
  "coordinate-grid": COORDINATE_GRID,
  geometry: GEOMETRY,
  "decimal-percent": DECIMAL_PERCENT,
  "stats-display": STATS_DISPLAY,
};

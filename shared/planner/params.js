// Plan parameters: strict parse, canonical encode. The query string IS the plan (stateless share link).
import {
  BAND_COUNT_MAX,
  BAND_KEYS,
  BLOCK_MINUTES,
  DAYS_MAX,
  DAYS_MIN,
  SEED_MAX,
} from "./constants.js";

export const UNIT_ID_RE = /^[a-zA-Z0-9_-]{2,80}$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const BAND_PARAM = Object.freeze({ "1_2": "b12", "3_4": "b34", "5_6": "b56" });
export const PLAN_PARAM_NAMES = Object.freeze([
  "unit",
  ...Object.values(BAND_PARAM),
  "block",
  "days",
  "seed",
  "start",
  "cal",
]);
export const DEFAULT_PARAMS = Object.freeze({
  bands: { "1_2": 0, "3_4": 24, "5_6": 0 },
  block: 60,
  days: 5,
  seed: 0,
  start: null,
  cal: false,
});

const isRealDate = (iso) => {
  if (!ISO_DATE_RE.test(iso)) return false;
  const d = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === iso;
};

function intIn(raw, lo, hi, label, errors, fallback) {
  if (raw === undefined || raw === null || raw === "") return fallback;
  if (!/^\d{1,7}$/.test(String(raw))) {
    errors.push(`${label} must be a whole number.`);
    return fallback;
  }
  const n = Number(raw);
  if (n < lo || n > hi) errors.push(`${label} must be between ${lo} and ${hi}.`);
  return n;
}

const blank = (v) => v === undefined || v === null || v === "";

/** get(name) -> string|undefined. Returns { ok, params, errors }. Never throws. */
export function parseParams(get) {
  const errors = [];
  const unit = String(get("unit") ?? "").trim();
  if (!UNIT_ID_RE.test(unit)) errors.push("unit is required and must be a valid unit identifier.");

  // A band left out counts as 0 once any band is given; with none given the default mix applies.
  const anyBand = BAND_KEYS.some((k) => !blank(get(BAND_PARAM[k])));
  const bands = {};
  for (const k of BAND_KEYS) {
    const fallback = anyBand ? 0 : DEFAULT_PARAMS.bands[k];
    bands[k] = intIn(get(BAND_PARAM[k]), 0, BAND_COUNT_MAX, BAND_PARAM[k], errors, fallback);
  }
  if (BAND_KEYS.reduce((n, k) => n + bands[k], 0) < 1) {
    errors.push("Enter at least one group in the band mix.");
  }

  const block = intIn(get("block"), 0, 9999, "block", errors, DEFAULT_PARAMS.block);
  if (!blank(get("block")) && !BLOCK_MINUTES.includes(block)) {
    errors.push(`block must be one of ${BLOCK_MINUTES.join(", ")} minutes.`);
  }
  const days = intIn(get("days"), DAYS_MIN, DAYS_MAX, "days", errors, DEFAULT_PARAMS.days);
  const seed = intIn(get("seed"), 0, SEED_MAX, "seed", errors, DEFAULT_PARAMS.seed);

  const start = String(get("start") ?? "").trim();
  if (start && !isRealDate(start)) errors.push("start must be a real date as YYYY-MM-DD.");
  const calRaw = String(get("cal") ?? "").trim();
  if (calRaw && calRaw !== "0" && calRaw !== "1") errors.push("cal must be 0 or 1.");
  const cal = calRaw === "1";
  if (cal && !start) errors.push("cal=1 needs a start date.");

  return {
    ok: errors.length === 0,
    errors,
    params: { unit, bands, block, days, seed, start: start || null, cal },
  };
}

export function parseSearch(search) {
  const q = new URLSearchParams(search);
  return parseParams((k) => q.get(k) ?? undefined);
}

/** Canonical query string: fixed key order, every plan-changing value written out. */
export function encodeParams(p) {
  const q = new URLSearchParams();
  q.set("unit", p.unit);
  for (const k of BAND_KEYS) q.set(BAND_PARAM[k], String(p.bands[k]));
  q.set("block", String(p.block));
  q.set("days", String(p.days));
  q.set("seed", String(p.seed));
  if (p.start) q.set("start", p.start);
  if (p.cal) q.set("cal", "1");
  return q.toString();
}

export const shareHash = (p) => `#/week?${encodeParams(p)}`;

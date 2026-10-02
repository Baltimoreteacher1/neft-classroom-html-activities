// Saved progress comes from localStorage, which a learner (or another page on
// a shared device) can edit. Every station restores its slice through these
// guards so a malformed save can never break rendering.

export const int = (v, min, max, fallback) =>
  Number.isInteger(v) && v >= min && v <= max ? v : fallback;

export const str = (v, max = 20) => (typeof v === "string" ? v.slice(0, max) : "");

export const strList = (v, length, max = 20) =>
  Array.from({ length }, (_, i) => str(Array.isArray(v) ? v[i] : "", max));

export const intSet = (v, min, max) =>
  Array.isArray(v) ? [...new Set(v.filter((n) => Number.isInteger(n) && n >= min && n <= max))] : [];

export const oneOf = (v, allowed, fallback = "") => (allowed.includes(v) ? v : fallback);

export const bool = (v) => v === true;

export const obj = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});

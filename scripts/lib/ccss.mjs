/**
 * Single source of truth for Grade-6 CCSS math standards.
 *
 * Reads data/ccss-standards.json (the canonical standard + domain registry) and
 * exposes lookup helpers so generators never hardcode standard text, short
 * labels, or domain names. Add/edit standards in the JSON only.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const DATA = JSON.parse(
  readFileSync(join(__dir, "..", "..", "data", "ccss-standards.json"), "utf8"),
);

/** Folder-slug → domain code, matching the curriculum's domain folder names.
 * Folder slugs keep their historical CCSS names (they are load-bearing URLs);
 * they map onto the revised 2025 MCCRS domain codes. */
const SLUG_TO_DOMAIN = {
  "ratios-proportional-relationships": "AT",
  "the-number-system": "NOS",
  "expressions-equations": "AT",
  geometry: "GR",
  statistics: "DS",
};

/** Map a domain code OR folder-slug to its canonical domain code. */
function toDomainCode(codeOrSlug) {
  if (!codeOrSlug) return null;
  if (DATA.domains[codeOrSlug]) return codeOrSlug;
  return SLUG_TO_DOMAIN[codeOrSlug] || null;
}

/** Full domain name, e.g. "Ratios & Proportional Relationships". Accepts code or slug. */
export function domainName(codeOrSlug) {
  const code = toDomainCode(codeOrSlug);
  return code ? DATA.domains[code] : null;
}

/** All domains as { code: name }. */
export function domains() {
  return { ...DATA.domains };
}

/** Canonical entry for a standard code (e.g. "6.AT.3a"), or null. */
export function getStandard(code) {
  return DATA.standards[code] || null;
}

/** Short teacher-facing label for a standard, e.g. "GCF & LCM". */
export function standardLabel(code) {
  return DATA.standards[code]?.shortLabel || null;
}

/** Full CCSS text for a standard. */
export function standardText(code) {
  return DATA.standards[code]?.fullText || null;
}

/** Every standard code in the registry. */
export function allStandardCodes() {
  return Object.keys(DATA.standards);
}

/** True if the code exists in the canonical registry. */
export function isKnownStandard(code) {
  return Object.prototype.hasOwnProperty.call(DATA.standards, code);
}

export default {
  domainName,
  domains,
  getStandard,
  standardLabel,
  standardText,
  allStandardCodes,
  isKnownStandard,
};

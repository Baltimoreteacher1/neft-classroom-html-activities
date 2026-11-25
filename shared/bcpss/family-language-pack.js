// D2 Language-Pluggable Family Framework (pure ESM).
// Per D11: EN and ES are populated; adding any additional home language is a pure
// data task — drop in a JSON locale pack and register it with zero code changes.
// Every translation pack carries explicit draft provenance unless reviewed by a named reviewer.

export const REQUIRED_FAMILY_KEYS = Object.freeze([
  "heading",
  "weeklyPlanTitle",
  "tryAtHome",
  "askYourChild",
  "readAloudNote",
  "privacyNote",
  "draftNotice",
]);

const LOCALE_RE = /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/;
const VALID_PROVENANCE_STATUS = new Set(["draft", "reviewed"]);

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * Validate a family locale pack against the D2 / D11 contract.
 * @param {object} pack
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateLanguagePack(pack) {
  const errors = [];
  if (!isPlainObject(pack)) {
    return { ok: false, errors: ["Language pack must be a plain object."] };
  }

  if (!isNonEmptyString(pack.locale) || !LOCALE_RE.test(pack.locale.trim())) {
    errors.push('pack.locale must be a valid BCP-47-style locale tag (e.g. "en", "es", "ar").');
  }
  if (!isNonEmptyString(pack.label)) {
    errors.push("pack.label must be a non-empty string.");
  }
  if (typeof pack.rtl !== "boolean") {
    errors.push("pack.rtl must be a boolean.");
  }

  if (!isPlainObject(pack.provenance)) {
    errors.push("pack.provenance must be an object with status, source, and reviewedBy.");
  } else {
    const { status, source, reviewedBy } = pack.provenance;
    if (!VALID_PROVENANCE_STATUS.has(status)) {
      errors.push('pack.provenance.status must be "draft" or "reviewed".');
    }
    if (!isNonEmptyString(source)) {
      errors.push("pack.provenance.source must be a non-empty string.");
    }
    if (status === "reviewed" && !isNonEmptyString(reviewedBy)) {
      errors.push(
        'pack.provenance.reviewedBy must be a non-empty reviewer identifier when status is "reviewed".',
      );
    }
    if (status === "draft" && reviewedBy !== null && reviewedBy !== undefined) {
      if (!isNonEmptyString(reviewedBy)) {
        errors.push("pack.provenance.reviewedBy must be null or a non-empty string.");
      }
    }
  }

  if (!isPlainObject(pack.strings)) {
    errors.push("pack.strings must be an object.");
  } else {
    for (const key of REQUIRED_FAMILY_KEYS) {
      if (!isNonEmptyString(pack.strings[key])) {
        errors.push(`pack.strings.${key} is required and must be a non-empty string.`);
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

/**
 * Resolve family UI strings for a target locale pack, falling back cleanly to the
 * English baseline pack for any missing or empty keys while preserving `rtl` and
 * draft provenance.
 * @param {object} pack
 * @param {object} fallbackEnPack
 * @returns {{
 *   locale: string,
 *   label: string,
 *   rtl: boolean,
 *   dir: "rtl" | "ltr",
 *   provenance: { status: string, source: string, reviewedBy: string | null },
 *   strings: Record<string, string>,
 *   fallbackKeys: string[]
 * }}
 */
export function resolveFamilyStrings(pack, fallbackEnPack) {
  if (!isPlainObject(fallbackEnPack) || !isPlainObject(fallbackEnPack.strings)) {
    throw new TypeError("resolveFamilyStrings requires a valid fallbackEnPack with strings.");
  }

  const target = isPlainObject(pack) ? pack : {};
  const targetStrings = isPlainObject(target.strings) ? target.strings : {};
  const fallbackStrings = fallbackEnPack.strings;

  const allKeys = new Set([
    ...REQUIRED_FAMILY_KEYS,
    ...Object.keys(fallbackStrings),
    ...Object.keys(targetStrings),
  ]);

  const resolved = {};
  const fallbackKeys = [];

  for (const key of allKeys) {
    if (isNonEmptyString(targetStrings[key])) {
      resolved[key] = targetStrings[key].trim();
    } else if (isNonEmptyString(fallbackStrings[key])) {
      resolved[key] = fallbackStrings[key].trim();
      fallbackKeys.push(key);
    }
  }

  const rtl = Boolean(target.rtl);
  const rawProv = isPlainObject(target.provenance) ? target.provenance : {};
  const reviewed = rawProv.status === "reviewed" && isNonEmptyString(rawProv.reviewedBy);
  const provenance = {
    status: reviewed ? "reviewed" : "draft",
    source: isNonEmptyString(rawProv.source)
      ? rawProv.source.trim()
      : fallbackEnPack.provenance?.source || "fallback_en",
    reviewedBy: reviewed ? rawProv.reviewedBy.trim() : null,
  };

  return {
    locale: isNonEmptyString(target.locale) ? target.locale.trim().toLowerCase() : "en",
    label: isNonEmptyString(target.label) ? target.label.trim() : fallbackEnPack.label || "English",
    rtl,
    dir: rtl ? "rtl" : "ltr",
    provenance,
    strings: resolved,
    fallbackKeys,
  };
}

/**
 * Register a validated locale pack into a locale registry (Map or plain object).
 * Adding a new home language is a pure data operation requiring zero code changes.
 * @param {Map<string, object> | Record<string, object>} registry
 * @param {object} pack
 * @returns {Map<string, object> | Record<string, object>}
 */
export function registerLocalePack(registry, pack) {
  const check = validateLanguagePack(pack);
  if (!check.ok) {
    throw new Error(`Invalid language pack: ${check.errors.join(" ")}`);
  }
  const key = pack.locale.trim().toLowerCase();
  if (registry instanceof Map) {
    registry.set(key, pack);
    return registry;
  }
  const base = isPlainObject(registry) ? registry : {};
  return { ...base, [key]: pack };
}

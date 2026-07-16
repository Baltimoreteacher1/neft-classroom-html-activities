// Single source of truth for on-page copy edits made in Edit mode.
// Both family-app.js (which reads overrides when applying language) and
// editor.js (which writes them) go through this module so the page's wording,
// its i18n layer, and the editor never drift apart.
//
// Shape: { en: { [i18nKey]: text }, es: { [i18nKey]: text } }
// Edits are stored per device in localStorage. "Export for publishing" hands
// them back so they can be committed to source and made live for every family.

export const COPY_STORAGE_KEY = "eduwonder.familyConnections.copyEdits.v1";

const emptyEdits = () => ({ en: {}, es: {} });

function sanitizeLane(lane) {
  const out = {};
  if (lane && typeof lane === "object") {
    for (const [key, value] of Object.entries(lane)) {
      if (typeof value === "string" && value.trim()) out[key] = value;
    }
  }
  return out;
}

export function readCopyEdits() {
  try {
    const parsed = JSON.parse(localStorage.getItem(COPY_STORAGE_KEY));
    if (!parsed || typeof parsed !== "object") return emptyEdits();
    return { en: sanitizeLane(parsed.en), es: sanitizeLane(parsed.es) };
  } catch {
    return emptyEdits();
  }
}

export function writeCopyEdits(edits) {
  try {
    localStorage.setItem(
      COPY_STORAGE_KEY,
      JSON.stringify({ en: sanitizeLane(edits.en), es: sanitizeLane(edits.es) }),
    );
    return true;
  } catch {
    return false;
  }
}

export function copyOverrideFor(edits, lang, key) {
  const lane = lang === "es" ? edits?.es : edits?.en;
  const value = lane?.[key];
  return typeof value === "string" && value.trim() ? value : null;
}

export function countCopyEdits(edits) {
  return Object.keys(edits.en).length + Object.keys(edits.es).length;
}

// Single source of truth for matching a BCPSS vocabulary term inside running text.
// Used by the reading validator (server/test) and the interactive reader (browser).

const escapeRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Matches a vocab term plus simple inflections (plural, -ed, -ing, -d, -ly). */
export function termRegex(term, flags = "gi") {
  const parts = String(term).trim().split(/\s+/).map(escapeRe);
  const last = parts.pop();
  const head = parts.length ? `${parts.join("\\s+")}\\s+` : "";
  return new RegExp(`\\b${head}${last}(?:s|es|ed|d|ing|ly)?\\b`, flags);
}

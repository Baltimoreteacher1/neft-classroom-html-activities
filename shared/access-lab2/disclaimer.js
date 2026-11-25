// The mandatory honesty statement. Every results, test, profile, summary, plan and family output carries it.
export const DISCLAIMER =
  "Inspired by WIDA ACCESS, not official, not a score, not a placement tool.";
export const DISCLAIMER_ES =
  "Inspirado en WIDA ACCESS, no es oficial, no es una puntuación, no es una herramienta de colocación. (Traducción en borrador)";

const PHRASES = ["inspired by wida access", "not official", "not a score", "not a placement tool"];

/** True when `text` (or the `en` field of a bilingual disclaimer) contains the full statement. */
export function disclaimerOk(text) {
  const en = typeof text === "string" ? text : text && typeof text === "object" ? text.en : null;
  if (typeof en !== "string") return false;
  const lower = en.toLowerCase();
  return PHRASES.every((p) => lower.includes(p));
}

/** True when the object itself carries the statement. */
export const hasDisclaimer = (obj) =>
  Boolean(obj) && typeof obj === "object" && disclaimerOk(obj.disclaimer);

/** Returns a copy of `obj` with the statement attached. Every generator builds its output through this. */
export const withDisclaimer = (obj) => ({ ...obj, disclaimer: DISCLAIMER });

export function assertDisclaimer(obj) {
  if (!hasDisclaimer(obj))
    throw new Error(`output "${obj?.kind ?? "?"}" is missing the mandatory disclaimer`);
  return obj;
}

/**
 * Paths of every nested object that has a `kind` (a generated output) but no disclaimer.
 * Tests run this over every generated output; an empty list means nothing can be shown without the statement.
 */
export function findMissingDisclaimers(value, path = "$", out = []) {
  if (Array.isArray(value))
    value.forEach((v, i) => findMissingDisclaimers(v, `${path}[${i}]`, out));
  else if (value && typeof value === "object") {
    if (typeof value.kind === "string" && !hasDisclaimer(value)) out.push(path);
    for (const [k, v] of Object.entries(value)) findMissingDisclaimers(v, `${path}.${k}`, out);
  }
  return out;
}

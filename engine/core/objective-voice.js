// Third-person voice for the end-of-lesson objectives.
//
// A student sets goals in the first person on Launch ("I can compare ratios
// using a table.") and meets them by Phase 8. Restating the very same sentence
// at the end reads as a repeat; restating it with the student's own name reads
// as evidence — "Samuel can now compare ratios using a table." These two helpers
// are the whole of that rewrite, kept in their own module so they are directly
// unit-testable (lesson-renderer.js pulls in the entire component graph and
// cannot be imported outside a bundler).

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

function escapeName(s) {
  return String(s).replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

/**
 * The student's FIRST name, from the Name field on Launch ("Samuel N." →
 * "Samuel"). Returns "" when no name has been entered — every caller reads that
 * as "keep the ordinary first-person wording", so nothing depends on the field
 * being filled in.
 *
 * @param {{ get?: () => { studentName?: string } }} state lesson state store
 * @returns {string}
 */
export function studentFirstName(state) {
  const raw = state && typeof state.get === "function" ? String(state.get().studentName || "") : "";
  const first = raw.trim().split(/\s+/)[0] || "";
  // Keep letters/digits/apostrophes/hyphens (O'Brien, Ana-María); drop the rest,
  // so a pasted emoji or stray markup can never reach the rendered sentence.
  return first.replace(/[^\p{L}\p{N}'’-]/gu, "").slice(0, 40);
}

/**
 * Rewrite an "I can …" objective as a third-person growth statement:
 * "I can find the GCF." → "Samuel can now find the GCF."
 *
 * `escapedText` is already HTML-escaped and may contain
 * `<button class="obj-term">` vocabulary buttons, so only the leading pronoun is
 * touched and the name is escaped before it is spliced in. Wording that does not
 * start with a recognised first-person opener is returned exactly as authored —
 * a mangled objective is worse than a first-person one, and the surrounding card
 * names the student either way.
 *
 * @param {string} escapedText HTML-escaped objective sentence
 * @param {string} name student's first name; "" leaves the text untouched
 * @returns {string}
 */
export function toThirdPersonObjective(escapedText, name) {
  const who = String(name || "").trim();
  if (!who) return escapedText;
  const s = String(escapedText);
  const lead = `${escapeName(who)} can now`;
  const openers = [
    /^\s*I can\b/i,
    /^\s*I will be able to\b/i,
    /^\s*I am able to\b/i,
    /^\s*Students? (?:will|can)\b/i,
  ];
  for (const re of openers) {
    if (re.test(s)) return depersonalize(s.replace(re, lead));
  }
  return s;
}

// Objectives often carry a second first-person pronoun after the opener —
// "I can explain how I broke a number down using my factor tree." Rewriting only
// the opener leaves "Samuel can now explain how I broke…", which reads worse
// than the original. Interior pronouns become they/their/them: the student's
// pronouns are not something the lesson knows, and repeating the name in every
// clause reads like a police report.
function depersonalize(html) {
  return mapTextOutsideTags(html, (text) =>
    text
      .replace(/\bI'm\b/g, "they're")
      .replace(/\bI am\b/g, "they are")
      .replace(/\bI have\b/g, "they have")
      .replace(/\bI\b/g, "they")
      .replace(/\bMy\b/g, "Their")
      .replace(/\bmy\b/g, "their")
      .replace(/\bmyself\b/gi, "themselves")
      .replace(/\bmine\b/g, "theirs")
      .replace(/\bme\b/g, "them"),
  );
}

// Apply `fn` only to the text between tags. The objective HTML carries
// `<button class="obj-term" …>` vocabulary buttons by the time some callers see
// it; a bare pronoun regex would otherwise be free to rewrite an attribute.
function mapTextOutsideTags(html, fn) {
  return String(html)
    .split(/(<[^>]*>)/)
    .map((part) => (part.startsWith("<") ? part : fn(part)))
    .join("");
}

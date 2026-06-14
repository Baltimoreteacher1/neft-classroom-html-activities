/*
 * Student Digital Mailbox — central link configuration.
 * SINGLE SOURCE OF TRUTH for every mailbox button on both the student and
 * teacher pages. Edit the URLs here and nowhere else.
 *
 * HOW TO UPDATE:
 *   Replace each GOOGLE_*_URL placeholder below with the real Google Form / Doc
 *   share link (the "anyone with the link" URL). Until a value is a real
 *   http(s):// URL, its button shows a disabled "Link coming soon" state — the
 *   page never breaks on a missing link.
 *
 * SAFETY: These are public student-facing share links only. Do NOT paste any
 * teacher-only edit URLs, response-spreadsheet links, secrets, or private data
 * here — this file ships to the browser.
 */
window.studentDigitalMailboxLinks = {
  classCheckIn: "GOOGLE_FORM_CLASS_CHECKIN_URL",
  confused: "GOOGLE_FORM_CONFUSED_URL",
  suggestion: "GOOGLE_FORM_SUGGESTION_URL",
  shoutOut: "GOOGLE_FORM_SHOUTOUT_URL",
  privateNote: "GOOGLE_FORM_PRIVATE_NOTE_URL",
  classIdeaDoc:
    "https://docs.google.com/document/d/1ZETBBYNcSs3qFS9LAWidK4_4CWiZcNBex6_fSeSp3Tc/edit",
  anonymousQuestion: "GOOGLE_FORM_ANONYMOUS_QUESTION_URL",
};

/**
 * A link is "ready" only when it is a real http(s) URL — not a placeholder
 * token like GOOGLE_FORM_CLASS_CHECKIN_URL. Used to decide whether a button is
 * live or shows the safe "Link coming soon" fallback.
 * @param {string} url
 * @returns {boolean}
 */
window.mailboxLinkReady = function mailboxLinkReady(url) {
  return typeof url === "string" && /^https?:\/\//i.test(url.trim());
};

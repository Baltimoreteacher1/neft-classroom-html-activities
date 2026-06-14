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
  // --- Private boxes: anonymous Google Forms (each student sees only their own
  //     submission). Created by the Apps Script in ~/student-mailbox-forms. ---
  classCheckIn:
    "https://docs.google.com/forms/d/189oOsb3L0uULWt7o8AVJ4WlT96EJpNAj2cT4AsgQNIE/viewform",
  confused:
    "https://docs.google.com/forms/d/1ECLjQDljLnPd4M38NnPxwH9uexGb4xQdejG23YRVbj4/viewform",
  privateNote:
    "https://docs.google.com/forms/d/1gnsGUlK52eqARMRDgBh_pfbqSjvEpIE2xKyYMKbQyRI/viewform",
  anonymousQuestion:
    "https://docs.google.com/forms/d/1zaaE1tqqGrvs-0ghyxQ3aTNXyVKMJ87UcY2ujXvl4Jo/viewform",

  // --- Public / collaborative boxes: live now. These are shared Google files
  //     where contributions are visible to the class (that is intended here). ---
  suggestion:
    "https://docs.google.com/spreadsheets/d/1tjXjvywDxFMNJJPfHtnppwgImmg1QCuvpgd3peypoNA/edit",
  shoutOut:
    "https://docs.google.com/spreadsheets/d/1nteYAiuSp1cXr8lAoXTOW-OxpqLeng_zkd2fglmi6Mk/edit",
  classIdeaDoc:
    "https://docs.google.com/document/d/1ZETBBYNcSs3qFS9LAWidK4_4CWiZcNBex6_fSeSp3Tc/edit",
  ideaWall:
    "https://docs.google.com/presentation/d/1nwAWKfe3OVxopjZF_0BUPrnIQnWd6tco6Bw8UEyZrKY/edit",
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

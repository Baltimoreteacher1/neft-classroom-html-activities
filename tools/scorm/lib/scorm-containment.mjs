/**
 * SCORM live-origin detectors.
 *
 * EduWonderLab SCORM packages are a two-file wrapper that iframes the LIVE
 * activity on eduwonderlab.com. That is intentional (docs/scorm.md): editing a
 * lesson updates every already-uploaded Canvas assignment. These helpers make
 * that contract a testable fact, so a ZIP cannot be mistaken for a bundled
 * lesson and a second, unexpected production URL cannot land in the SCO.
 */

export const ALLOWED_LESSON_HOSTS = Object.freeze(["eduwonderlab.com", "www.eduwonderlab.com"]);

/** Representative packages covering each generator family (all share sco()). */
export const REPRESENTATIVE_TARGETS = Object.freeze([
  { target: "1-1", title: "Lesson 1-1", kind: "lesson" },
  { target: "5-1", title: "Lesson 5-1", kind: "lesson-interactive" },
  {
    target: "/lessons/1-1/homework.html",
    title: "Homework 1-1",
    id: "homework-1-1",
    kind: "homework",
  },
  { target: "/ratio-color-mixer/", title: "Ratio Color Mixer", kind: "activity" },
]);

const ABSOLUTE_URL = /https?:\/\/[^\s"'<>]+/gi;

export function extractAbsoluteUrls(html) {
  return [...String(html || "").matchAll(ABSOLUTE_URL)].map((m) => m[0]);
}

export function iframeDataSrc(html) {
  const m = String(html || "").match(/\bid="lesson"[^>]*\bdata-src="([^"]+)"/);
  return m ? m[1] : null;
}

/**
 * Classify every absolute URL in the SCO. Runtime lesson loads must be on the
 * allowlisted EduWonderLab host. XML namespace URIs do not appear in the SCO.
 */
export function classifyScoUrls(html) {
  const src = iframeDataSrc(html);
  const urls = extractAbsoluteUrls(html);
  const problems = [];
  const lessonLoads = [];

  if (!src) problems.push("SCO has no iframe#lesson data-src — the live activity cannot launch");

  for (const url of urls) {
    let host = "";
    try {
      host = new URL(url).hostname;
    } catch {
      problems.push(`SCO contains an unparseable URL: ${url}`);
      continue;
    }
    if (!ALLOWED_LESSON_HOSTS.includes(host)) {
      problems.push(`unexpected absolute URL in SCO: ${url}`);
      continue;
    }
    lessonLoads.push(url);
  }

  if (src) {
    try {
      const u = new URL(src);
      if (!ALLOWED_LESSON_HOSTS.includes(u.hostname)) {
        problems.push(`iframe data-src is not an EduWonderLab host: ${src}`);
      }
      if (!u.pathname || u.pathname === "/") {
        problems.push(`iframe data-src has no activity path: ${src}`);
      }
    } catch {
      problems.push(`iframe data-src is not a URL: ${src}`);
    }
  }

  return { src, urls, lessonLoads, problems };
}

/** A live-wrapper archive is exactly the manifest plus the SCO. */
export function extraZipEntries(names) {
  const expected = new Set(["imsmanifest.xml", "index.html"]);
  return [...names].filter((n) => !expected.has(n));
}

export function missingZipEntries(names) {
  const have = new Set(names);
  return ["imsmanifest.xml", "index.html"].filter((n) => !have.has(n));
}

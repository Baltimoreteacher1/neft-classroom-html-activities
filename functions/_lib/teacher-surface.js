/**
 * teacher-surface.js — the ONE answer to "is this path teacher-only?".
 *
 * This predicate existed three times: inline in functions/_middleware.js (the
 * HTTP Basic Auth gate, which is the definition of record), and as a comment-
 * labelled "mirror" in scripts/lib/download-taxonomy.mjs. A third copy was about
 * to be written for the SCORM endpoint. Copies of a security predicate do not
 * stay in step, and the failure is silent in the dangerous direction: the copy
 * that forgets a rule does not throw, it just says "student".
 *
 * All three callers now import from here.
 *
 * This is a casual gate over material that is merely inappropriate for students
 * (facilitation notes, answer keys, dashboards), not a secret-protection
 * boundary. It is deliberately substring-based and deliberately broad.
 */

/**
 * Normalize a path before matching. The middleware only lowercased, which is
 * enough when the server has already resolved the URL it is serving — but the
 * SCORM endpoint matches a path a CALLER supplied, so every trick that makes
 * two spellings of one path look different has to be collapsed first:
 *
 *   /Lessons/1-1/Teacher-Notes/     case
 *   /lessons/1-1/%74eacher-notes/   percent-encoding (and %2574, double-encoded)
 *   /lessons//1-1///teacher-notes/  duplicate slashes
 *   /lessons/1-1/x/../teacher-notes case-by-case traversal
 *   /a/./b/                         no-op segments
 */
export function normalizePath(input) {
  let p = String(input == null ? "" : input);

  // Decode repeatedly: %2574 decodes to %74, which decodes to "t". Bounded, and
  // a malformed escape leaves the string as-is rather than throwing.
  for (let i = 0; i < 4; i++) {
    let next;
    try {
      next = decodeURIComponent(p);
    } catch {
      break;
    }
    if (next === p) break;
    p = next;
  }

  // Backslashes are path separators on Windows and in some naive resolvers.
  p = p.replace(/\\/g, "/");
  // A query or fragment is not part of the path, and "?x=/teacher" must not
  // make a student path look teacher-only (nor the reverse).
  p = p.split("#")[0].split("?")[0];
  p = p.replace(/\/{2,}/g, "/");

  // Resolve . and .. so /a/../teacher-notes/ is judged as /teacher-notes/.
  const out = [];
  for (const seg of p.split("/")) {
    if (seg === "" || seg === ".") continue;
    if (seg === "..") out.pop();
    else out.push(seg);
  }
  const trailingSlash = p.endsWith("/") && out.length > 0;
  return `/${out.join("/")}${trailingSlash ? "/" : ""}`.toLowerCase();
}

/**
 * True when the path is behind the teacher password gate.
 *
 * Kept byte-for-byte in step with the gate in functions/_middleware.js: that
 * file decides what actually 401s, and this file must never claim a path is
 * student-safe that the gate would refuse. tools/scorm/teacher-surface.test.mjs
 * pins the two together.
 */
/**
 * True for the Curriculum Hub index itself — `/curriculum`, `/curriculum/`,
 * `/curriculum/index.html` — and for nothing else under `/curriculum/`.
 *
 * DELIBERATELY NOT PART OF `isTeacherSurface()`. The hub is teacher-only, but
 * its unauthenticated behaviour is a *redirect to the student lesson picker*,
 * not a 401 (see functions/_middleware.js). `isTeacherSurface()` has two other
 * callers — the SCORM endpoint and the download taxonomy — that read it as
 * "this path 401s", and folding the hub in would make the SCORM builder refuse
 * a URL that never prompts anyone for a password. One predicate per meaning.
 *
 * The match is EXACT, never a prefix: `/curriculum/` is the teacher console,
 * while `/curriculum/units/`, `/curriculum/arcade/`, `/curriculum/projects/`
 * and every other child are student surfaces that must stay open.
 */
export function isCurriculumHub(path) {
  const p = normalizePath(path);
  return p === "/curriculum" || p === "/curriculum/" || p === "/curriculum/index.html";
}

export function isTeacherSurface(path) {
  const p = normalizePath(path);
  if (!p.startsWith("/")) return false;
  // Shared code and curriculum data are student-loaded even when their names
  // mention a teacher feature (curriculum-teacher-workflow.js is fetched by the
  // public hub); the teacher features they enable are gated separately.
  if (p.startsWith("/assets/") || p.startsWith("/data/")) return false;
  // Endpoints carry their own policy.
  if (p.startsWith("/api/")) return false;
  return (
    p.includes("teacher") ||
    p.includes("dashboard") ||
    p.includes("answer-key") ||
    // Plan Notes is a teacher surface whose path contains none of the substrings
    // above. Matched as a path PREFIX, never a substring — a loose "plan" match
    // would refuse lesson-plan pages students legitimately open.
    p.startsWith("/curriculum/plan-notes") ||
    // The Pacing Planner, for the same reason and matched the same way: it is a
    // teacher surface whose path names none of the substrings above. A prefix,
    // never a substring — "planning" as a substring would gate any lesson page
    // that ever mentions it in a path.
    p.startsWith("/curriculum/planning") ||
    p.startsWith("/admin")
  );
}

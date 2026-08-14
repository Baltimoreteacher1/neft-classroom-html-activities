// functions/api/scorm-bundle.js — bulk SCORM download: one zip, many packages.
//
//   GET /api/scorm-bundle?activities=3-1,3-2,3-3&name=Unit%203
//
// Returns ONE .zip containing one ready-to-upload SCORM 1.2 package per lesson,
// each still its own nested .zip. Canvas imports SCORM one package per
// assignment, so the packages cannot be merged into a single SCO — but a teacher
// setting up a whole unit should download once, not once per lesson.
//
// Before this existed the Hub fired N separate downloads, staggered, which
// browsers meet with a "this site wants to download multiple files" prompt and
// which lands N files loose in Downloads with no unit grouping. One archive
// unzips to one clearly-named folder.
//
// Open by design, like /api/scorm: /api/* is exempt from the site password, and
// _lib/scorm.js only ever packages activities on eduwonderlab.com.

import { badRequest, handler } from "../_lib/http.js";
import { buildScormFiles, packageFileName, zipStore } from "../_lib/scorm.js";
import { targetExists } from "./scorm.js";

// A unit is at most ~15 lessons; the cap is a runaway guard, not a policy. Each
// package is ~7 KB, so even the ceiling is a small download.
const MAX_ACTIVITIES = 40;

function safeName(s) {
  return (
    String(s || "")
      .replace(/[^\w\s.-]+/g, "")
      .replace(/\s+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "scorm-packages"
  );
}

export const onRequest = handler({
  methods: ["GET"],
  // Building a package is cheap but not free, and this route fans out over a
  // whole unit. Rate-limited per IP so a hammered link cannot amplify.
  rateLimit: { max: 20, windowMs: 60_000 },
  handle: async ({ request }) => {
    const url = new URL(request.url);
    const raw = url.searchParams.get("activities") || "";
    const bundleName = safeName(url.searchParams.get("name") || "scorm-packages");
    const codes = url.searchParams.get("mode") === "codes";

    const ids = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!ids.length) {
      return badRequest(
        "missing ?activities= — a comma-separated list of lesson ids, e.g. 3-1,3-2",
      );
    }
    if (ids.length > MAX_ACTIVITIES) {
      return badRequest(`too many activities (${ids.length}); max ${MAX_ACTIVITIES}`);
    }

    // Build every package first. A single bad id fails the whole bundle rather
    // than silently shipping an archive with a lesson missing — a teacher who
    // uploads 9 of 10 packages will not notice the gap until a student does.
    const entries = {};
    const failed = [];
    for (const id of ids) {
      try {
        const pkg = buildScormFiles({ target: id, title: id, codes });
        // Same existence check the single-package route runs, and for the same
        // reason: a mistyped id otherwise yields a "valid" package that iframes
        // a 404. Fail OPEN — only a definitive 404 blocks, so an auth gate or a
        // transient hiccup never costs a teacher their download.
        if (!(await targetExists(pkg.lessonUrl))) {
          failed.push(`${id}: no activity exists at ${pkg.lessonUrl} (404)`);
          continue;
        }
        const inner = zipStore(pkg.files);
        const path = `${bundleName}/${packageFileName(pkg.id, pkg.codes)}`;
        // Two different activities can slug to the same id (the slug is
        // truncated), and assigning over an existing key loses a package
        // silently — the teacher gets an archive that looks complete and is
        // short one lesson. Fail the bundle instead.
        if (path in entries) {
          failed.push(`${id}: package name collides with an earlier activity (${path})`);
          continue;
        }
        entries[path] = inner;
      } catch (e) {
        failed.push(`${id}: ${e?.message || e}`);
      }
    }

    if (failed.length) {
      return badRequest(`could not build: ${failed.join("; ")}`);
    }

    // A short manifest travels with the archive so the folder explains itself
    // once it is sitting in a Downloads directory a week later.
    entries[`${bundleName}/README.txt`] = [
      `${bundleName} — Canvas SCORM packages`,
      "",
      `${ids.length} package${ids.length === 1 ? "" : "s"}: ${ids.join(", ")}`,
      "",
      "Upload ONE .zip per Canvas assignment. Each package opens the live",
      "lesson inside Canvas and reports the score back to the gradebook, so",
      "editing a lesson on the site updates every Canvas assignment using it —",
      "you never need to re-download.",
      "",
      "Students need an internet connection.",
      "",
    ].join("\n");

    const zip = zipStore(entries);
    return new Response(zip, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${bundleName}.zip"`,
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
    });
  },
});

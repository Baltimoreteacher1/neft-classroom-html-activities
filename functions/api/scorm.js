// functions/api/scorm.js — on-demand SCORM package download.
//
//   GET /api/scorm?activity=<id|/path/|url>&title=<text>&mode=codes|canvas
//
// Returns a ready-to-upload SCORM 1.2 .zip generated in memory. The package
// iframes the LIVE activity, so editing a lesson never requires re-downloading.
//   mode=canvas (default) → ?lms=scorm, score auto-posts to the Canvas gradebook
//   mode=codes            → ?embed=1, save-code prompt shows → Google Sheets
//
// Open by design (/api/* is exempt from the site password) and safe: it only
// packages activities on eduwonderlab.com (enforced in _lib/scorm.js).

import { buildScormFiles, zipStore } from "../_lib/scorm.js";

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const target =
    url.searchParams.get("activity") || url.searchParams.get("url") || "";
  const title = url.searchParams.get("title") || "";
  const codes =
    url.searchParams.get("mode") === "codes" ||
    url.searchParams.get("codes") === "1";

  if (!target) {
    return new Response(
      "Missing ?activity= (a lesson id like 1-3, a site path like /ratio-color-mixer/, or a full eduwonderlab.com URL).",
      { status: 400, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }

  let pkg;
  try {
    pkg = buildScormFiles({ target, title, codes });
  } catch (e) {
    return new Response("Could not build package: " + (e.message || e), {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const zip = zipStore(pkg.files);
  const fname = `neft-${pkg.id}${pkg.codes ? "-codes" : ""}.zip`;
  return new Response(zip, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${fname}"`,
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

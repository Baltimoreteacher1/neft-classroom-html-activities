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

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// A failed chip click navigates the teacher's tab here (a successful one is an
// attachment download and never leaves the page), so errors must be a friendly
// page with a way back — not bare text stranding them off the Curriculum Hub.
function errorPage(message) {
  return new Response(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>Canvas package error — EduWonderLab</title>
    <style>
      body { margin: 0; min-height: 100vh; display: grid; place-items: center;
             font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
             background: #f4f7f7; color: #1f2933; }
      main { max-width: 32rem; padding: 2rem 2.25rem; background: #fff;
             border-radius: 12px; box-shadow: 0 2px 12px rgba(15, 55, 53, 0.12); }
      h1 { margin: 0 0 0.5rem; font-size: 1.25rem; }
      p { margin: 0.5rem 0; line-height: 1.5; }
      code { background: #eef2f2; border-radius: 4px; padding: 0.1rem 0.35rem; }
      a { color: #0d7a76; font-weight: 600; }
    </style>
  </head>
  <body>
    <main>
      <h1>⚠️ Couldn't build that Canvas package</h1>
      <p>${esc(message)}</p>
      <p>Expected: <code>?activity=</code> a lesson id like <code>1-3</code>, a site
         path like <code>/ratio-color-mixer/</code>, or a full eduwonderlab.com URL.</p>
      <p><a href="/curriculum/">← Back to the Curriculum Hub</a><br />
         <a href="/teacher-tools/scorm-builder/">Open the SCORM Builder</a></p>
    </main>
  </body>
</html>
`,
    {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    },
  );
}

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const target = url.searchParams.get("activity") || url.searchParams.get("url") || "";
  const title = url.searchParams.get("title") || "";
  const codes = url.searchParams.get("mode") === "codes" || url.searchParams.get("codes") === "1";

  if (!target) {
    return errorPage("The link is missing its ?activity= parameter.");
  }

  let pkg;
  try {
    pkg = buildScormFiles({ target, title, codes });
  } catch (e) {
    return errorPage("Could not build package: " + (e.message || e));
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

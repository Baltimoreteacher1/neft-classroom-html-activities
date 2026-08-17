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

import {
  buildScormFiles,
  packageFileName,
  PackagePreflightError,
  SCORM_RUNTIME_VERSION,
  TeacherSurfaceError,
  zipStore,
} from "../_lib/scorm.js";

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
function errorPage(message, status = 400) {
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
      status,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    },
  );
}

// Verify the resolved activity actually exists before packaging, so a mistyped
// id doesn't yield a "valid" SCORM zip that iframes a 404 page. Fail OPEN: only
// a definitive 404 blocks — auth gates (401/403), method quirks (405), and
// transient 5xx / network errors / timeouts all let the download through, so a
// hiccup never blocks a legitimate package.
export async function targetExists(lessonUrl) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4000);
  try {
    let res = await fetch(lessonUrl, { method: "HEAD", redirect: "follow", signal: ctrl.signal });
    if (res.status === 405) {
      // Some hosts reject HEAD — retry with a 1-byte ranged GET to avoid a false miss.
      res = await fetch(lessonUrl, {
        method: "GET",
        redirect: "follow",
        signal: ctrl.signal,
        headers: { Range: "bytes=0-0" },
      });
    }
    return res.status !== 404;
  } catch (_e) {
    return true;
  } finally {
    clearTimeout(timer);
  }
}

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const target = url.searchParams.get("activity") || url.searchParams.get("url") || "";
  const title = url.searchParams.get("title") || "";
  const codes = url.searchParams.get("mode") === "codes" || url.searchParams.get("codes") === "1";
  // Optional: bake selected learning supports (+ language) into the package so a
  // teacher can post a personalized version for specific students. Values are
  // whitelisted in _lib/scorm.js, so unknown keys are silently dropped.
  const supports = url.searchParams.get("supports") || "";
  const lang = url.searchParams.get("lang") || "";

  if (!target) {
    return errorPage("The link is missing its ?activity= parameter.");
  }

  let pkg;
  try {
    pkg = buildScormFiles({
      target,
      title,
      codes,
      supports,
      lang,
      generatedAt: new Date().toISOString(),
      generator: "eduwonderlab/api-scorm",
    });
  } catch (e) {
    // A teacher-only target is a refusal (403), not a malformed request. The
    // message says what happened and nothing about how the gate decides.
    if (e instanceof TeacherSurfaceError || e?.name === "TeacherSurfaceError") {
      return errorPage(e.message, 403);
    }
    // Pre-flight refused. The whole point is that a teacher never uploads a
    // package that cannot work, so this is a visible refusal with the reason —
    // never a zip that fails later, inside a published Canvas assignment.
    if (e instanceof PackagePreflightError || e?.name === "PackagePreflightError") {
      return errorPage(e.message, e.status || 400);
    }
    return errorPage("Could not build package: " + (e.message || e));
  }

  if (!(await targetExists(pkg.lessonUrl))) {
    return errorPage(
      "No activity exists at " +
        pkg.lessonUrl +
        " — the link returned 404. " +
        "Double-check the lesson id or path and try again.",
      404,
    );
  }

  const zip = zipStore(pkg.files);
  const fname = packageFileName(pkg.id, pkg.codes);
  return new Response(zip, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${fname}"`,
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      // Download summary, readable by the teacher UI without opening the ZIP,
      // so the confirmation chip can say what was actually built.
      "X-EWL-Scorm-Runtime": String(SCORM_RUNTIME_VERSION),
      "X-EWL-Scorm-Activity": pkg.id,
      "X-EWL-Scorm-Title": pkg.title.replace(/[^\x20-\x7e]/g, ""),
      "X-EWL-Scorm-Target": pkg.lessonUrl,
      "Access-Control-Expose-Headers":
        "X-EWL-Scorm-Runtime, X-EWL-Scorm-Activity, X-EWL-Scorm-Title, X-EWL-Scorm-Target",
    },
  });
}

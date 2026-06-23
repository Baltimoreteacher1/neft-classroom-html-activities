/**
 * scorm.js — generate a SCORM 1.2 package (manifest + SCO) for a Neft activity,
 * entirely in memory, with a zero-dependency stored-ZIP writer.
 *
 * Used by the on-demand endpoint functions/api/scorm.js so teachers can download
 * a ready-to-upload package from the site. Mirrors tools/scorm/ (the CLI batch
 * builder); the wrapper iframes the LIVE activity, so editing a lesson never
 * requires re-downloading the package.
 *
 *   Canvas auto-grade mode (default): launches with ?lms=scorm&embed=1 — the
 *     activity relays its score to the Canvas gradebook and hides the code popup.
 *   Save-codes mode (codes:true):     launches with ?embed=1 — the save-code
 *     prompt shows, so roster + grades flow into the Google Sheets gradebook.
 *
 * Web-runtime only: TextEncoder / Uint8Array / DataView (Workers + Node 18+).
 */

const SITE_DEFAULT = "https://eduwonderlab.com";
// Only generate wrappers for our own site, so the endpoint can't be abused to
// package arbitrary third-party origins as SCORM.
const ALLOWED_HOSTS = ["eduwonderlab.com", "www.eduwonderlab.com"];

function xmlEsc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Safe slug for SCORM identifiers + the download filename. */
function slug(s) {
  return (
    String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "activity"
  );
}

/**
 * Resolve a target into the live activity URL + a stable id.
 *   - "1-3"      → SITE/lessons/1-3/      (bare lesson id)
 *   - "/x/"      → SITE/x/                 (site-relative path)
 *   - full URL   → used as-is (must be on an allowed host)
 */
export function resolveTarget(target, site = SITE_DEFAULT) {
  site = site.replace(/\/$/, "");
  target = String(target || "").trim();
  if (!target) throw new Error("missing activity");
  const isUrl = /^https?:\/\//i.test(target);
  const isLessonId = !isUrl && !target.includes("/");
  const lessonUrl = isUrl
    ? target
    : isLessonId
      ? `${site}/lessons/${target}/`
      : `${site}/${target.replace(/^\/+/, "")}`;
  const u = new URL(lessonUrl);
  if (!ALLOWED_HOSTS.includes(u.hostname)) {
    throw new Error("activity must be on eduwonderlab.com");
  }
  const id = isLessonId
    ? slug(target)
    : slug(u.pathname.split("/").filter(Boolean).pop() || "activity");
  return { lessonUrl, id, origin: u.origin };
}

function manifest(id, title) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="NEFT-${id}" version="1.0"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="ORG-${id}">
    <organization identifier="ORG-${id}">
      <title>${title}</title>
      <item identifier="ITEM-${id}" identifierref="RES-${id}" isvisible="true">
        <title>${title}</title>
        <adlcp:masteryscore>70</adlcp:masteryscore>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="RES-${id}" type="webcontent" adlcp:scormtype="sco" href="index.html">
      <file href="index.html"/>
    </resource>
  </resources>
</manifest>
`;
}

function sco(lessonUrl, launchQuery, origin, title) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      html, body { margin: 0; height: 100%; background: #fff; }
      #lesson { border: 0; width: 100%; height: 100vh; display: block; }
    </style>
  </head>
  <body>
    <!-- SCORM 1.2 SCO wrapper for a Neft activity. Plays the LIVE activity, so
         edits never require re-uploading. ?lms=scorm relays the score to Canvas
         and hides the code popup; ?embed=1 alone keeps the save-code prompt. -->
    <iframe id="lesson" src="${lessonUrl}${launchQuery}" allow="fullscreen; clipboard-write" title="${title}"></iframe>
    <script>
      (function () {
        "use strict";
        var LESSON_ORIGIN = "${origin}";
        var MASTERY = 70;
        function findAPI(win) {
          var tries = 0;
          while (win && win.API == null && win.parent && win.parent !== win && tries++ < 12) win = win.parent;
          return win ? win.API : null;
        }
        var API = findAPI(window) || (window.opener ? findAPI(window.opener) : null);
        var started = false, finished = false;
        function start() {
          if (API && !started) {
            try { API.LMSInitialize(""); started = true; API.LMSSetValue("cmi.core.lesson_status", "incomplete"); API.LMSCommit(""); } catch (e) {}
          }
        }
        function report(pct) {
          if (!API) return; start();
          var status = pct >= MASTERY ? "passed" : "completed";
          try {
            API.LMSSetValue("cmi.core.score.min", "0");
            API.LMSSetValue("cmi.core.score.max", "100");
            API.LMSSetValue("cmi.core.score.raw", String(Math.max(0, Math.min(100, Math.round(pct)))));
            API.LMSSetValue("cmi.core.lesson_status", status);
            API.LMSCommit("");
          } catch (e) {}
        }
        function finish() { if (API && started && !finished) { try { API.LMSFinish(""); finished = true; } catch (e) {} } }
        start();
        window.addEventListener("message", function (e) {
          if (LESSON_ORIGIN && e.origin !== LESSON_ORIGIN) return;
          var d = e.data || {};
          if (d.source === "neft-lesson" && d.type === "score" && typeof d.percent === "number") report(d.percent);
        });
        window.addEventListener("pagehide", finish);
        window.addEventListener("unload", finish);
      })();
    </script>
  </body>
</html>
`;
}

/** Build the two package files. Returns { id, lessonUrl, files }. */
export function buildScormFiles({ target, title, codes }, site = SITE_DEFAULT) {
  const { lessonUrl, id, origin } = resolveTarget(target, site);
  const t = xmlEsc(
    title && String(title).trim() ? title.trim() : `Activity ${id}`,
  );
  const launchQuery = codes ? "?embed=1" : "?lms=scorm&embed=1";
  return {
    id,
    lessonUrl,
    codes: !!codes,
    files: {
      "imsmanifest.xml": manifest(id, t),
      "index.html": sco(lessonUrl, launchQuery, origin, t),
    },
  };
}

// ---- Zero-dependency stored ZIP writer -----------------------------------
function crc32(bytes) {
  let crc = ~0;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i];
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return ~crc >>> 0;
}

/** files: { name: string } → Uint8Array of a valid (uncompressed) .zip. */
export function zipStore(files) {
  const enc = new TextEncoder();
  const DOS_DATE = 0x21; // 1980-01-01, fixed for reproducible output
  const locals = [];
  const centrals = [];
  let offset = 0;
  let count = 0;

  for (const name of Object.keys(files)) {
    const nameBytes = enc.encode(name);
    const data = enc.encode(files[name]);
    const crc = crc32(data);

    const lh = new Uint8Array(30 + nameBytes.length);
    const ld = new DataView(lh.buffer);
    ld.setUint32(0, 0x04034b50, true);
    ld.setUint16(4, 20, true);
    ld.setUint16(6, 0, true);
    ld.setUint16(8, 0, true); // store
    ld.setUint16(10, 0, true);
    ld.setUint16(12, DOS_DATE, true);
    ld.setUint32(14, crc, true);
    ld.setUint32(18, data.length, true);
    ld.setUint32(22, data.length, true);
    ld.setUint16(26, nameBytes.length, true);
    ld.setUint16(28, 0, true);
    lh.set(nameBytes, 30);
    locals.push(lh, data);

    const ch = new Uint8Array(46 + nameBytes.length);
    const cd = new DataView(ch.buffer);
    cd.setUint32(0, 0x02014b50, true);
    cd.setUint16(4, 20, true);
    cd.setUint16(6, 20, true);
    cd.setUint16(8, 0, true);
    cd.setUint16(10, 0, true);
    cd.setUint16(12, 0, true);
    cd.setUint16(14, DOS_DATE, true);
    cd.setUint32(16, crc, true);
    cd.setUint32(20, data.length, true);
    cd.setUint32(24, data.length, true);
    cd.setUint16(28, nameBytes.length, true);
    cd.setUint16(30, 0, true);
    cd.setUint16(32, 0, true);
    cd.setUint16(34, 0, true);
    cd.setUint16(36, 0, true);
    cd.setUint32(38, 0, true);
    cd.setUint32(42, offset, true);
    ch.set(nameBytes, 46);
    centrals.push(ch);

    offset += lh.length + data.length;
    count++;
  }

  const cdSize = centrals.reduce((a, b) => a + b.length, 0);
  const eocd = new Uint8Array(22);
  const ed = new DataView(eocd.buffer);
  ed.setUint32(0, 0x06054b50, true);
  ed.setUint16(4, 0, true);
  ed.setUint16(6, 0, true);
  ed.setUint16(8, count, true);
  ed.setUint16(10, count, true);
  ed.setUint32(12, cdSize, true);
  ed.setUint32(16, offset, true);
  ed.setUint16(20, 0, true);

  const all = [...locals, ...centrals, eocd];
  const total = all.reduce((a, b) => a + b.length, 0);
  const out = new Uint8Array(total);
  let p = 0;
  for (const part of all) {
    out.set(part, p);
    p += part.length;
  }
  return out;
}

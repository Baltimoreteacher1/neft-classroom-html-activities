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

import { canonicalTitle, routeKnown, shortNameForId } from "./scorm-catalog.js";
import {
  ERROR_CODES,
  LESSON_LOCATION_LIMIT,
  MASTERY_SCORE,
  SCORM_PROTOCOL_VERSION,
  SCORM_RUNTIME_VERSION,
  SUSPEND_DATA_LIMIT,
  sco,
} from "./scorm-sco.js";
import { isTeacherSurface } from "./teacher-surface.js";

// Re-exported so every existing importer (validators, tests, the CLI builders)
// keeps one place to read these from, and so the runtime/protocol versions are
// reachable from the same module that builds the package.
export {
  ERROR_CODES,
  LESSON_LOCATION_LIMIT,
  MASTERY_SCORE,
  SCORM_PROTOCOL_VERSION,
  SCORM_RUNTIME_VERSION,
  SUSPEND_DATA_LIMIT,
  sco,
};

/**
 * Thrown when pre-flight refuses to hand a teacher a package that would not
 * work. Distinct from TeacherSurfaceError so the endpoints can answer with the
 * right status and the right sentence.
 */
export class PackagePreflightError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "PackagePreflightError";
    this.status = status;
  }
}

/**
 * Thrown when a caller asks for a package of a teacher-only surface. A distinct
 * type so the endpoints can answer 403 rather than 400 without string-matching
 * an error message. The message is deliberately plain: it tells a teacher what
 * happened and nothing about how the gate decides.
 */
export class TeacherSurfaceError extends Error {
  constructor() {
    super("That page is teacher-only, so it can't be packaged as a student activity.");
    this.name = "TeacherSurfaceError";
    this.status = 403;
  }
}

const SITE_DEFAULT = "https://eduwonderlab.com";
// Only generate wrappers for our own site, so the endpoint can't be abused to
// package arbitrary third-party origins as SCORM.
const ALLOWED_HOSTS = ["eduwonderlab.com", "www.eduwonderlab.com"];

// Learning-supports profile keys that may be baked into a personalized package.
// Whitelisted so the launch query can only ever carry known, safe support keys.
const SUPPORT_KEYS = [
  "read-understand",
  "focus-organize",
  "build-math",
  "express-thinking",
  "language-support",
  "challenge-extend",
  // À-la-carte math tools (mirror TOOL_KEYS in learning-supports.js): a
  // personalized package may bake in individual tools without the full bundle.
  "model",
  "multchart",
  "numberline",
  "placevalue",
  "calculator",
];
const SUPPORT_LANGS = ["en", "es", "vi", "ar"];

/** Keep only recognized support keys from a comma list; returns "" if none. */
function sanitizeSupports(raw) {
  if (!raw) return "";
  return String(raw)
    .split(",")
    .map((s) => s.trim())
    .filter((s) => SUPPORT_KEYS.includes(s))
    .join(",");
}

function sanitizeLang(raw) {
  const c = String(raw || "")
    .trim()
    .toLowerCase();
  return SUPPORT_LANGS.includes(c) && c !== "en" ? c : "";
}

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
 *   - "1-3"      → SITE/lessons/6-12/      (bare lesson id)
 *   - "/x/"      → SITE/x/                 (site-relative path)
 *   - full URL   → used as-is (must be on an allowed host)
 */
export function resolveTarget(target, site = SITE_DEFAULT) {
  site = site.replace(/\/$/, "");
  target = String(target || "").trim();
  if (!target) throw new Error("missing activity");
  const isUrl = /^https?:\/\//i.test(target);
  const isLessonId = !isUrl && !target.includes("/");
  let lessonUrl = isUrl
    ? target
    : isLessonId
      ? `${site}/lessons/${target}/`
      : `${site}/${target.replace(/^\/+/, "")}`;
  const u = new URL(lessonUrl);
  if (!ALLOWED_HOSTS.includes(u.hostname)) {
    throw new Error("activity must be on eduwonderlab.com");
  }
  // A student SCORM package may only ever be built from a student surface.
  // Packaging a teacher route was never a content leak — the launch URL still
  // 401s — but a teacher who uploads that package gives a class an assignment
  // that opens a password prompt, and the endpoint should not manufacture one.
  // The check runs on the PARSED, normalized path, so encoded, doubled-slash
  // and traversal spellings are judged the same as the plain one.
  if (isTeacherSurface(u.pathname)) {
    throw new TeacherSurfaceError();
  }

  // Use the PARSED href, never the caller's raw string. The raw form is echoed
  // into an HTML attribute in the SCO, so a target carrying a quote (or any
  // markup) would break out of it — `new URL()` percent-encodes those away.
  lessonUrl = u.href;
  // Build the id from the WHOLE path, not just its last segment. Every lesson's
  // homework lives at /lessons/<id>/homework.html, so a last-segment id made all
  // ~120 of them "homework-html": one SCORM identifier and one zip filename
  // shared by every homework package on the site. A teacher downloading Unit 3
  // and Unit 5 homework got two identically-named files, and an LMS that keys
  // content by manifest identifier treats them as the same activity.
  let id = slug(target);
  if (!isLessonId) {
    const segs = u.pathname.split("/").filter(Boolean);
    if (segs[segs.length - 1] === "index.html") segs.pop();
    if (segs[0] === "lessons") segs.shift(); // implied by context, and noise in a filename
    const last = segs.pop() || "activity";
    segs.push(last.replace(/\.html?$/i, ""));
    id = slug(segs.join("-"));
  }
  // Fold the recognizable query params into the id so assignables that share
  // a path (practice-arcade/?unit=1 vs ?lesson=1-3) get distinct zip
  // filenames + SCORM manifest identifiers instead of colliding.
  const qLesson = u.searchParams.get("lesson");
  const qUnit = u.searchParams.get("unit");
  if (qLesson) id = slug(id + "-lesson-" + qLesson);
  else if (qUnit) id = slug(id + "-unit-" + qUnit);
  // Auto-router package (?route=auto sends each student to their assigned
  // variant): distinct id so it never collides with the plain package's
  // zip filename or SCORM manifest identifier.
  if (u.searchParams.get("route") === "auto") id = slug(id + "-auto");
  return { lessonUrl, id, origin: u.origin };
}

function manifest(id, title, meta = {}) {
  // Non-sensitive diagnostic metadata, carried where a teacher (or a future
  // agent) can read it out of an uploaded package without running anything:
  // which runtime built it, which live route it targets, and when. Never a
  // secret, a teacher key, or anything about a student.
  const desc = [
    `EduWonderLab SCORM Runtime v${SCORM_RUNTIME_VERSION} (protocol v${SCORM_PROTOCOL_VERSION}).`,
    `Live target: ${meta.lessonUrl || ""}.`,
    meta.generatedAt ? `Generated ${meta.generatedAt}.` : "",
    "Plays the live lesson; lesson edits reach this package without re-uploading.",
  ]
    .filter(Boolean)
    .join(" ");
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
  <!-- ${xmlEsc(desc)} -->
  <!-- ewl:runtime=${SCORM_RUNTIME_VERSION} ewl:protocol=${SCORM_PROTOCOL_VERSION} ewl:activity=${xmlEsc(meta.id || id)} ewl:generator=${xmlEsc(meta.generator || "")} -->
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

/**
 * Teacher-readable, filesystem-safe download name.
 *
 * `neft-3-4.zip` tells a teacher nothing once twelve of them are sitting in a
 * Downloads folder, and Canvas shows the uploaded file name in its SCORM list.
 * The stable SCORM identifier is unchanged — only the file name is friendly, so
 * renaming a download can never re-key an existing Canvas assignment.
 */
export function packageFileName(id, codes) {
  // The mode already lives in the id (…-codes) so the SCORM identifier is
  // distinct; strip it here so the name still reads …_SaveCodes rather than
  // falling through with a dangling suffix.
  const base = (codes ? String(id).replace(/-codes$/, "") : String(id))
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  // Runtime v2 naming: EduWonderLab_<id>_<Short_Title>_SCORM.zip.
  //   EduWonderLab_1-1_Math_Is_Mine_SCORM.zip
  //   EduWonderLab_1-1-homework_Homework_SCORM.zip
  //   EduWonderLab_ratio-color-mixer_Ratio_Color_Mixer_SCORM.zip
  // Deterministic (same inputs → same name, no hash, no timestamp), ASCII-only,
  // and free of every character Windows rejects (\ / : * ? " < > |) and of
  // spaces, which break naive shell and LMS-upload tooling.
  const short = shortNameForId(id);
  const parts = ["EduWonderLab", base, short, codes ? "SaveCodes" : "", "SCORM"].filter(Boolean);
  return `${parts.join("_").slice(0, 140)}.zip`;
}

/**
 * Structural pre-flight, run BEFORE a teacher is handed a zip.
 *
 * A broken package is worse than a refused one: the teacher only finds out
 * after uploading it to Canvas, configuring an assignment and publishing it to
 * a class. Everything decidable without the network is decided here; the
 * endpoint adds a live 404 probe on top.
 *
 * Throws PackagePreflightError with a sentence a teacher can act on.
 */
export function preflight(files, { lessonUrl, id }) {
  const problems = [];
  if (!files["imsmanifest.xml"]) problems.push("the package has no imsmanifest.xml");
  if (!files["index.html"]) problems.push("the package has no SCO entry file");
  const mf = files["imsmanifest.xml"] || "";
  // Every <file href> the manifest declares must be a real entry in the zip,
  // and the launch href must be one of them — the two ways a structurally
  // "valid" package still fails the moment Canvas opens it.
  const href = /adlcp:scormtype="sco"[^>]*href="([^"]+)"/.exec(mf)?.[1];
  if (!href) problems.push("the manifest declares no SCO launch file");
  else if (!files[href])
    problems.push(`the manifest launches ${href}, which is not in the package`);
  for (const m of mf.matchAll(/<file href="([^"]+)"\s*\/>/g)) {
    if (!files[m[1]]) problems.push(`the manifest lists ${m[1]}, which is not in the package`);
  }
  if (!/<schemaversion>1\.2<\/schemaversion>/.test(mf)) {
    problems.push("the manifest does not declare SCORM 1.2");
  }
  if (!new RegExp(`identifier="NEFT-${id}"`).test(mf)) {
    problems.push("the manifest identifier does not match the package id");
  }

  const html = files["index.html"] || "";
  // The runtime is the whole point of the package; a wrapper missing it is a
  // blank iframe in Canvas.
  if (!html.includes(`ewl:runtime`) || !html.includes(`RUNTIME = ${SCORM_RUNTIME_VERSION}`)) {
    problems.push("the SCORM Runtime v2 wrapper code is missing from the package");
  }
  if (!html.includes(lessonUrl)) problems.push("the SCO does not point at the resolved lesson URL");

  // Every absolute URL in the wrapper must be an allowed production host. This
  // is what stops a localhost, a preview deployment, or a stray third-party
  // origin from being shipped to a class inside a package nobody opens.
  for (const m of html.matchAll(/https?:\/\/([A-Za-z0-9._-]+)/g)) {
    if (!ALLOWED_HOSTS.includes(m[1])) {
      problems.push(`the package points at a non-production host: ${m[1]}`);
      break;
    }
  }
  if (/\blocalhost\b|127\.0\.0\.1|\.pages\.dev|\.workers\.dev|:\d{4,5}\//.test(html)) {
    problems.push("the package points at a development or preview URL");
  }
  // Nothing in a student package may carry a secret or a teacher key.
  if (/TEACHER_KEY|SITE_PASSWORD|x-teacher-key/i.test(html + mf)) {
    problems.push("the package contains an authentication value and was not built");
  }

  if (problems.length) {
    throw new PackagePreflightError(
      `This package failed its pre-flight check and was not downloaded: ${problems.join("; ")}.`,
      500,
    );
  }
  return true;
}

/**
 * Build the package files. Returns { id, title, lessonUrl, codes, files, meta }.
 *
 * `generatedAt` is deliberately DAY-granular. It is enough to diagnose a
 * package found in a Canvas course months later, and it keeps two builds on the
 * same day byte-identical — which is what `validate:scorm:fleet` asserts, and
 * what makes a re-download comparable to the file already uploaded.
 */
export function buildScormFiles(
  { target, title, codes, supports, lang, id: idOverride, generatedAt, generator },
  site = SITE_DEFAULT,
) {
  const { lessonUrl, id: derivedId, origin } = resolveTarget(target, site);
  // Pre-flight the ROUTE against the canonical curriculum before building
  // anything: a lesson id the manifest has never heard of is a typo, and the
  // only thing worse than refusing it is handing back a zip that iframes a 404.
  if (routeKnown(lessonUrl) === "missing") {
    throw new PackagePreflightError(
      `There is no lesson at ${lessonUrl} in the curriculum. Check the lesson id and try again.`,
      404,
    );
  }
  /*
   * An explicit id wins over the path-derived one. The Canvas packages page
   * (tools/scorm/build-canvas-scorm-page.mjs) names its own packages —
   * "homework-1-1" rather than the path-derived "1-1-homework" — and passes that
   * name to the CLI builder, then copies the file it expects by name.
   *
   * The CLI rewrite dropped this third argument, so every homework and activity
   * package was written under a name the caller did not expect and the copy
   * failed with ENOENT for all 84 homework packages. Restored, and routed
   * through slug() so a caller cannot inject a path or an XML-unsafe identifier.
   */
  const id = idOverride ? slug(idOverride) : derivedId;
  // Title precedence: an explicit caller title, then the CANONICAL curriculum
  // title, then a last-resort slug. The canonical title is read from the
  // compiled curriculum vocabulary rather than kept here, so a renamed lesson
  // renames its Canvas activity on the next download instead of carrying the
  // old name forever.
  const canonical = canonicalTitle(lessonUrl);
  const plainTitle =
    title && String(title).trim()
      ? String(title).trim()
      : canonical.title || `EduWonderLab — ${id}`;
  const t = xmlEsc(plainTitle);
  // Joined with "&" when the target already carries a query (?unit=3 etc.) —
  // mirrors tools/scorm/build-scorm.mjs so both builders stay in lockstep.
  let launchQuery =
    (lessonUrl.includes("?") ? "&" : "?") + (codes ? "embed=1" : "lms=scorm&embed=1");

  // Personalized package: bake the selected learning supports (and optional
  // language) into the launch query so they activate for the student on load.
  const safeSupports = sanitizeSupports(supports);
  const safeLang = sanitizeLang(lang);
  // Save-codes mode is a DIFFERENT package (different launch query, different
  // grade path), so it needs a different SCORM identity. It used to differ only
  // in the zip filename: a teacher who posted both the interactive and the
  // save-codes variant of one lesson uploaded two packages that declared the
  // same manifest identifier, which an LMS keying content by identifier treats
  // as the same activity.
  let personalId = codes ? slug(`${id}-codes`) : id;
  if (safeSupports) {
    launchQuery += `&supports=${safeSupports}`;
    if (safeLang) launchQuery += `&lang=${safeLang}`;
    // Distinct id/filename so a personalized package doesn't collide with the
    // standard one (e.g. neft-1-1-supports-... .zip).
    personalId = slug(`${personalId}-supports-${safeSupports}${safeLang ? "-" + safeLang : ""}`);
  }

  const meta = {
    id: personalId,
    lessonUrl,
    generatedAt: generatedAt ? String(generatedAt).slice(0, 10) : "",
    generator: generator || `eduwonderlab-scorm-runtime/${SCORM_RUNTIME_VERSION}`,
  };

  const files = {
    "imsmanifest.xml": manifest(personalId, t, meta),
    "index.html": sco(lessonUrl, launchQuery, origin, t, meta),
  };
  preflight(files, { lessonUrl, id: personalId });

  return {
    id: personalId,
    title: plainTitle,
    lessonUrl,
    codes: !!codes,
    runtime: SCORM_RUNTIME_VERSION,
    protocol: SCORM_PROTOCOL_VERSION,
    meta,
    files,
  };
}

// The stored-ZIP writer lives in assets/lib/zip-store.js so the browser-side
// bulk downloader emits byte-identical archives from the same code.
export { zipStore } from "../../assets/lib/zip-store.js";

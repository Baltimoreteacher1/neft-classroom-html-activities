// One-click resource package for the activity being edited: standalone page, printable copy, editable Word file
// and (for worksheets and checks) a teacher-only answer key, zipped with a launcher that opens from a folder.
// Loaded only when a teacher presses the button, so none of it reaches student pages.

import { loadBundle } from "./preview.js";

const PRINTABLE = new Set(["worksheet", "check"]);
const JSZIP_SRC = "/card-builder/vendor/jszip.min.js";

/** The site's vendored JSZip, loaded the first time a package is built (never on student pages). */
function loadJSZip() {
  if (globalThis.JSZip) return Promise.resolve(globalThis.JSZip);
  return new Promise((resolve, reject) => {
    const el = document.createElement("script");
    el.src = JSZIP_SRC;
    el.onload = () => (globalThis.JSZip ? resolve(globalThis.JSZip) : reject(new Error("jszip")));
    el.onerror = () => reject(new Error("jszip"));
    document.head.append(el);
  });
}

async function wordFile(fetchImpl, activity, part, lang) {
  const res = await fetchImpl("/api/studio/docx", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ activity, part, lang }),
  }).catch(() => null);
  return res?.ok ? new Uint8Array(await res.arrayBuffer()) : null;
}

/**
 * Build the package. Returns { blob, review[{en,es}], offline, name } or throws a PackageError.
 * `generatedAt` is passed in so the package never reads the clock itself.
 */
export async function downloadablePackage(
  activity,
  { lang = "en", generatedAt, fetchImpl = (...a) => fetch(...a) },
) {
  const [{ buildPackage }, bundle, JSZip] = await Promise.all([
    import("../x/package.js"),
    loadBundle(),
    loadJSZip(),
  ]);
  const printable = PRINTABLE.has(activity.kind);
  const wantKey = printable && activity.options?.answerKey;
  const docx = {};
  const studentWord = printable ? await wordFile(fetchImpl, activity, "student", lang) : null;
  const keyWord = wantKey ? await wordFile(fetchImpl, activity, "key", lang) : null;
  if (studentWord) docx.student = studentWord;
  if (keyWord) docx.key = keyWord;
  const parts = [
    {
      id: "student",
      role:
        activity.kind === "worksheet"
          ? "worksheet"
          : activity.kind === "check"
            ? "check"
            : "interactive",
      activity,
      formats: ["html", ...(printable ? ["print"] : []), ...(studentWord ? ["docx"] : [])],
    },
  ];
  if (wantKey)
    parts.push({
      id: "key",
      role: "key",
      activity,
      formats: ["print", ...(keyWord ? ["docx"] : [])],
    });
  const built = await buildPackage(
    { title: activity.title, lang, parts },
    { generatedAt, js: bundle.js, css: bundle.css, docx, JSZip },
  );
  const review = [...built.review];
  if (printable && !studentWord)
    review.push({
      en: "The Word file could not be made, so the package has no .docx. Try again online.",
      es: "No se pudo crear el archivo de Word, así que el paquete no lo incluye. Intente de nuevo con conexión.",
    });
  return {
    blob: new Blob([built.zip], { type: "application/zip" }),
    review,
    offline: built.offline,
  };
}

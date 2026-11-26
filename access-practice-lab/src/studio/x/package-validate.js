// validatePackage: re-open a built package and check it from the outside. It trusts nothing the builder said: the
// manifest must match the files, every launcher link must resolve, no HTML may reference anything outside the
// package, student files must carry no teacher markers, and docx files must be real Word documents.

import { getJSZip } from "./package-zip.js";
import { scanHtml } from "./package-scan.js";

export const MANIFEST_SCHEMA = "lp-package/1";
export const LIMITS = Object.freeze({
  zipBytes: 64 * 1024 * 1024,
  entries: 600,
  unpackedBytes: 256 * 1024 * 1024,
});
const FATAL = new Set([
  "not-a-zip",
  "too-big",
  "unsafe-path",
  "no-manifest",
  "bad-manifest",
  "no-launcher",
]);
// Structural markers the print renderer puts only in a teacher copy, plus the notes the player export must strip.
const TEACHER_MARKERS = [
  /class="sheet key"/,
  /<body class="part-key"/,
  /TEACHER COPY/,
  /COPIA DEL MAESTRO/,
  /"notes"\s*:/,
  /"type"\s*:\s*"note"/,
];
const SAFE_PATH = /^(?!\/)(?!.*(?:^|\/)\.\.?(?:\/|$))[^\\:\0]+$/;

const dec = new TextDecoder("utf-8");

/**
 * @param {Uint8Array|ArrayBuffer} zipBytes
 * @param {{JSZip?: object}} [opts] an injected JSZip (default: globalThis.JSZip, else the "jszip" package)
 * @returns {Promise<{ok:boolean, offline:boolean, errors:Array<{code:string,message:string,path?:string}>,
 *   offenders:Array<{file:string,url:string,kind:string}>, missing:Array<{file:string,ref:string,reason:string}>,
 *   manifest:object|null, files:string[]}>}
 */
export async function validatePackage(zipBytes, opts = {}) {
  const errors = [];
  const report = (extra = {}) => {
    const offenders = extra.offenders ?? [];
    const missing = extra.missing ?? [];
    const fatal = errors.some((e) => FATAL.has(e.code));
    return {
      ok: errors.length === 0,
      offline: !fatal && offenders.length === 0 && missing.length === 0,
      errors,
      offenders,
      missing,
      manifest: extra.manifest ?? null,
      files: extra.files ?? [],
    };
  };
  const err = (code, message, path) =>
    errors.push(path ? { code, message, path } : { code, message });

  if (!(zipBytes instanceof Uint8Array || zipBytes instanceof ArrayBuffer)) {
    err("not-a-zip", "The package must be bytes.");
    return report();
  }
  if (zipBytes.byteLength > LIMITS.zipBytes) {
    err("too-big", "The package is larger than 64 MB.");
    return report();
  }
  const JSZip = await getJSZip(opts.JSZip);
  let zip;
  try {
    zip = await JSZip.loadAsync(zipBytes);
  } catch {
    err("not-a-zip", "The file is not a readable ZIP.");
    return report();
  }
  const entries = Object.values(zip.files).filter((f) => !f.dir);
  if (entries.length > LIMITS.entries) {
    err("too-big", `The package has more than ${LIMITS.entries} files.`);
    return report();
  }
  const declared = entries.reduce((s, f) => s + (f._data?.uncompressedSize ?? 0), 0);
  if (declared > LIMITS.unpackedBytes) {
    err("too-big", "The package unpacks to more than 256 MB.");
    return report();
  }
  const names = entries.map((f) => f.name);
  // JSZip sanitizes "../x" to "x" on load but keeps the name the archive really carried
  for (const f of entries)
    if (f.unsafeOriginalName && f.unsafeOriginalName !== f.name)
      err("unsafe-path", "A file path climbs out of the package.", f.unsafeOriginalName);
  for (const n of names)
    if (!SAFE_PATH.test(n))
      err("unsafe-path", "A file path is absolute or climbs out of the package.", n);
  if (errors.length) return report({ files: names });
  const have = new Set(names);

  const bytes = new Map();
  for (const f of entries) bytes.set(f.name, await f.async("uint8array"));

  let manifest = null;
  if (!have.has("package.json")) err("no-manifest", "package.json is missing.");
  else
    try {
      manifest = JSON.parse(dec.decode(bytes.get("package.json")));
      if (
        manifest?.schema !== MANIFEST_SCHEMA ||
        !Array.isArray(manifest.parts) ||
        !Array.isArray(manifest.files)
      )
        throw new Error("shape");
    } catch {
      manifest = null;
      err("bad-manifest", `package.json is not a ${MANIFEST_SCHEMA} manifest.`);
    }
  if (!have.has("index.html")) err("no-launcher", "index.html (the launcher) is missing.");
  if (!manifest) return report({ files: names });

  // 1. the manifest and the files agree, in both directions, with byte sizes
  const listed = new Map(manifest.files.map((f) => [f.path, f]));
  for (const [path, f] of listed) {
    if (!have.has(path))
      err("manifest-missing-file", "The manifest lists a file that is not in the package.", path);
    else if (f.bytes !== bytes.get(path).length)
      err(
        "size-mismatch",
        `The manifest says ${f.bytes} bytes; the file has ${bytes.get(path).length}.`,
        path,
      );
  }
  for (const n of names)
    if (n !== "package.json" && !listed.has(n))
      err("unlisted-file", "A file in the package is not in the manifest.", n);
  for (const part of manifest.parts)
    for (const f of part.files ?? []) {
      if (!have.has(f.path))
        err(
          "part-file-missing",
          `Part "${part.id}" lists a file that is not in the package.`,
          f.path,
        );
      const folder = part.audience === "teacher" ? "teacher/" : "student/";
      if (!f.path.startsWith(folder))
        err(
          "wrong-folder",
          `Part "${part.id}" is for ${part.audience}s and belongs under ${folder}`,
          f.path,
        );
    }
  for (const n of names)
    if (
      n.startsWith("teacher/") &&
      !manifest.files.some((f) => f.path === n && f.audience === "teacher")
    )
      err(
        "teacher-file-unmarked",
        "A file in teacher/ is not marked as teacher-only in the manifest.",
        n,
      );

  // 2. every HTML file: references stay inside, resolve, and student files carry no teacher markers
  const offenders = [];
  const missing = [];
  const linked = new Set();
  for (const n of names.filter((x) => /\.html?$/i.test(x))) {
    const html = dec.decode(bytes.get(n));
    const scan = scanHtml(n, html, (p) => have.has(p));
    offenders.push(...scan.offenders);
    missing.push(...scan.missing);
    if (n === "index.html") for (const l of scan.links) linked.add(l.target);
    if (n.startsWith("student/"))
      for (const m of TEACHER_MARKERS)
        if (m.test(html))
          err(
            "teacher-content-in-student-file",
            `A student file carries teacher-only content (${m.source}).`,
            n,
          );
  }
  if (have.has("index.html"))
    for (const part of manifest.parts)
      for (const f of part.files ?? [])
        if (have.has(f.path) && !linked.has(f.path))
          err("unlinked-file", "The launcher does not link to this file.", f.path);

  // 3. Word files are real Word documents
  for (const n of names.filter((x) => x.endsWith(".docx"))) {
    try {
      const doc = await JSZip.loadAsync(bytes.get(n));
      if (!doc.file("word/document.xml")) throw new Error("no document.xml");
    } catch {
      err("bad-docx", "This is not a valid Word document.", n);
    }
  }
  return report({ offenders, missing, manifest, files: names });
}

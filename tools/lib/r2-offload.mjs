// Shared rules for moving lesson downloads from dist/ to the R2 bucket bound as DOWNLOADS.
// Used by tools/offload-dist-downloads.mjs (build), tools/upload-downloads-to-r2.mjs (upload) and the tests.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

export const BUCKET = "eduwonderlab-downloads";
export const MANIFEST = "data/r2-offload-manifest.json";
// Exactly what functions/lessons/[[path]].js serves from R2; the two must agree.
export const OFFLOAD_RE = /^lessons\/[^/]+\/downloads\/.+\.(docx|pdf|pptx|xlsx|zip)$/i;

export const TYPES = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pdf: "application/pdf",
  zip: "application/zip",
};

export const isOffloadable = (rel) => OFFLOAD_RE.test(rel) && !rel.includes("..");
export const contentType = (rel) =>
  TYPES[rel.split(".").pop().toLowerCase()] || "application/octet-stream";
export const sha256 = (file) => createHash("sha256").update(readFileSync(file)).digest("hex");

/**
 * Which dist files may be dropped: only those the manifest says are in R2 with the SAME bytes.
 * A file edited since its upload stays in dist (static assets win over R2), so a stale manifest
 * can never serve an old copy.
 * @param {{rel:string, hash:string}[]} files
 * @param {Record<string,{sha256:string}>} uploaded
 */
export function planOffload(files, uploaded) {
  const drop = [];
  const stale = [];
  for (const f of files) {
    if (!isOffloadable(f.rel)) continue;
    const entry = uploaded[f.rel];
    if (!entry) continue;
    (entry.sha256 === f.hash ? drop : stale).push(f.rel);
  }
  return { drop, stale };
}

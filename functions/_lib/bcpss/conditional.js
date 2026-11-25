// Additive read-API helpers: `?fields=` selection and ETag / If-None-Match caching.
// Existing responses are unchanged when neither is used (apart from the new ETag header).

import { canonicalJson } from "../../../shared/content-schema/v2.mjs";

export const MAX_FIELDS = 40;

const FIELD = /^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)*$/;

/** Parse `?fields=a,b.c`. Returns { fields } or { error }. Unknown paths are an error (fail fast). */
export function parseFields(param, body) {
  if (param === null || param === undefined || param === "") return { fields: null };
  const fields = [
    ...new Set(
      String(param)
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean),
    ),
  ];
  if (fields.length === 0 || fields.length > MAX_FIELDS)
    return { error: `fields must list 1 to ${MAX_FIELDS} names.` };
  for (const f of fields) {
    if (!FIELD.test(f)) return { error: `Invalid field "${f}".` };
    if (get(body, f.split(".")) === undefined) return { error: `Unknown field "${f}".` };
  }
  return { fields };
}

function get(obj, path) {
  let cur = obj;
  for (const key of path) {
    if (cur === null || typeof cur !== "object" || !(key in cur)) return undefined;
    cur = cur[key];
  }
  return cur;
}

/** Copy only the requested dotted paths; objects along a path keep just that branch. */
export function selectFields(body, fields) {
  const out = {};
  for (const f of fields) {
    const path = f.split(".");
    let src = body;
    let dst = out;
    for (let i = 0; i < path.length - 1; i++) {
      src = src[path[i]];
      dst = dst[path[i]] ??= {};
    }
    const last = path[path.length - 1];
    dst[last] = src[last];
  }
  return out;
}

export async function etagOf(body) {
  const bytes = new TextEncoder().encode(canonicalJson(body));
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  const hex = [...new Uint8Array(digest)]
    .slice(0, 12)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `W/"${hex}"`;
}

/** True when If-None-Match lists this ETag (weak comparison) or `*`. */
export function matchesEtag(header, etag) {
  if (!header) return false;
  const bare = (t) => t.trim().replace(/^W\//, "");
  return header.split(",").some((t) => t.trim() === "*" || bare(t) === bare(etag));
}

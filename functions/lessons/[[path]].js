// R2 fallback for lesson downloads.
//
// Cloudflare Pages refuses a deployment over 20,000 files, and ~6,500 of ours are lesson downloads
// (`/lessons/<id>/downloads/*.docx|pdf|pptx|xlsx|zip`). Those live in the R2 bucket bound as DOWNLOADS
// instead, and the URL students and Canvas links already use keeps answering with the same bytes.
//
// STATIC ASSET FIRST: this only acts when the static file is missing (404). A download that is still
// in dist/ is served exactly as before, so deploying this Function with nothing uploaded changes nothing.
// Teacher-only downloads stay gated: functions/_middleware.js runs before this handler on every request.

const DOWNLOAD_PATH = /^\/lessons\/[^/]+\/downloads\/.+\.(docx|pdf|pptx|xlsx|zip)$/i;

const TYPES = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pdf: "application/pdf",
  zip: "application/zip",
};

/** The R2 key for a request path, or null when it is not a download path we serve. */
export function downloadKey(pathname) {
  let path;
  try {
    path = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (!DOWNLOAD_PATH.test(path) || path.includes("..") || path.includes("\\")) return null;
  return path.slice(1);
}

export async function onRequest({ request, env, next }) {
  const response = await next();
  if (response.status !== 404) return response;
  if (request.method !== "GET" && request.method !== "HEAD") return response;
  if (!env.DOWNLOADS) return response;

  const key = downloadKey(new URL(request.url).pathname);
  if (!key) return response;

  const object = await env.DOWNLOADS.get(key, {
    range: request.headers,
    onlyIf: request.headers,
  });
  if (!object) return response;

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  if (!headers.get("content-type")) {
    headers.set(
      "content-type",
      TYPES[key.split(".").pop().toLowerCase()] || "application/octet-stream",
    );
  }
  headers.set("etag", object.httpEtag);
  headers.set("accept-ranges", "bytes");
  headers.set("cache-control", "public, max-age=0, must-revalidate");
  headers.set("x-content-type-options", "nosniff");

  // onlyIf failed: R2 returns the object without a body.
  if (!("body" in object)) return new Response(null, { status: 304, headers });

  let status = 200;
  if (object.range && request.headers.has("range")) {
    const { offset = 0, length = object.size - offset } = object.range;
    headers.set("content-range", `bytes ${offset}-${offset + length - 1}/${object.size}`);
    headers.set("content-length", String(length));
    status = 206;
  } else {
    headers.set("content-length", String(object.size));
  }
  return new Response(request.method === "HEAD" ? null : object.body, { status, headers });
}

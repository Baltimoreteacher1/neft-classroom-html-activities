// Practice / Family / Assignments hubs: /practice-hub/, /practice-hub/family/unit-<n>[/letter],
// /practice-hub/qr/<id>/<kind>.svg. Rendered from functions/_lib/pfa (no files in dist/).
import { pfaResponse } from "../_lib/pfa/render.js";

export async function onRequest({ request, next }) {
  if (request.method !== "GET" && request.method !== "HEAD") return next();
  const res = pfaResponse(new URL(request.url).pathname);
  if (!res) return next();
  return request.method === "HEAD"
    ? new Response(null, { status: res.status, headers: res.headers })
    : res;
}

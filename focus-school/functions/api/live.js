/* Real-time sync endpoint for the Focus School planner (same-origin WebSocket).
 *
 * Forwards a WebSocket upgrade to the SyncRoom Durable Object (defined in the
 * companion `sync-worker` Worker) keyed by the sync code, so all of a user's
 * devices coordinate through one strongly-consistent actor and see each other's
 * changes in well under a second.
 *
 * Provisioning (one-time): deploy the sync-worker, then bind its Durable Object
 * namespace to this Pages project as `SYNC_ROOM` in the Cloudflare dashboard
 * (Settings > Bindings > Durable Object). Until that binding exists this returns
 * 503 and every device automatically falls back to the existing KV polling in
 * /api/state — so shipping this file changes nothing until sync is provisioned.
 */

export async function onRequest(context) {
  const { request, env } = context;

  // Only a genuine WebSocket upgrade belongs here.
  if (request.headers.get("Upgrade") !== "websocket") {
    return new Response("expected a WebSocket upgrade", { status: 426 });
  }

  // Binding not configured yet → tell the client to stay on KV sync.
  if (!env.SYNC_ROOM) {
    return new Response("realtime sync not configured", { status: 503 });
  }

  const url = new URL(request.url);
  const code = (url.searchParams.get("code") || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 64);
  if (!code) return new Response("invalid code", { status: 400 });

  // One DO instance per code → every device on that code lands on the same actor.
  const id = env.SYNC_ROOM.idFromName(code);
  const stub = env.SYNC_ROOM.get(id);
  return stub.fetch(request);
}

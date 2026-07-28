/* Same-origin WebSocket entry point for Shai School real-time sync. */
export async function onRequest(context) {
  const { request, env } = context;
  if (request.headers.get("Upgrade") !== "websocket")
    return new Response("expected a WebSocket upgrade", { status: 426 });
  if (!env.SYNC_ROOM) return new Response("realtime sync not configured", { status: 503 });

  const code = (new URL(request.url).searchParams.get("code") || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 64);
  if (!code) return new Response("invalid code", { status: 400 });

  const room = env.SYNC_ROOM.get(env.SYNC_ROOM.idFromName(code));
  return room.fetch(request);
}

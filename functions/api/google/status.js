import { accessTokenForSession, isConfigured, json } from '../../_lib/google.js';

export async function onRequestGet({ request, env }) {
  if (!isConfigured(env)) {
    return json({ ok: true, configured: false, connected: false });
  }

  const session = await accessTokenForSession(request, env);
  if (!session) return json({ ok: true, configured: true, connected: false });

  return json({
    ok: true,
    configured: true,
    connected: Boolean(session.data.connected),
    profile: session.data.google_profile || null,
    connected_at: session.data.connected_at || null
  });
}

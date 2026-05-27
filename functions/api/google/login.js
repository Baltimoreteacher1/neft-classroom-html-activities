import { buildAuthUrl, isConfigured, json, newSessionId, saveSession, sessionCookie } from '../../_lib/google.js';

export async function onRequestGet({ request, env }) {
  if (!isConfigured(env)) {
    return json({ ok: false, error: 'Google sync is not configured yet. Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, APP_BASE_URL, and NOAM_SCHOOL_KV in Cloudflare.' }, { status: 503 });
  }

  const sessionId = newSessionId();
  const state = newSessionId();
  await saveSession(env, sessionId, { oauth_state: state, created_at: Date.now() });

  return Response.redirect(buildAuthUrl(env, state), 302, {
    headers: { 'set-cookie': sessionCookie(sessionId) }
  });
}

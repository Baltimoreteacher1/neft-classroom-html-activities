import { exchangeCode, isConfigured, json, loadSession, saveSession, sessionCookie, userInfo } from '../../_lib/google.js';

export async function onRequestGet({ request, env }) {
  if (!isConfigured(env)) return json({ ok: false, error: 'Google sync is not configured.' }, { status: 503 });

  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  const appBaseUrl = (env.APP_BASE_URL || '').replace(/\/$/, '');

  if (error) return Response.redirect(`${appBaseUrl}/noam-school-v10/?google=error&reason=${encodeURIComponent(error)}`, 302);
  if (!code || !state) return json({ ok: false, error: 'Missing Google OAuth code or state.' }, { status: 400 });

  const session = await loadSession(request, env);
  if (!session || session.data.oauth_state !== state) return json({ ok: false, error: 'Google OAuth state check failed.' }, { status: 400 });

  const token = await exchangeCode(env, code);
  const profile = await userInfo(token.access_token);

  const data = {
    connected: true,
    google_profile: profile,
    access_token: token.access_token,
    refresh_token: token.refresh_token || session.data.refresh_token || '',
    expires_at: Date.now() + (token.expires_in || 3600) * 1000,
    connected_at: Date.now()
  };

  await saveSession(env, session.id, data);
  return Response.redirect(`${appBaseUrl}/noam-school-v10/?google=connected`, 302, {
    headers: { 'set-cookie': sessionCookie(session.id) }
  });
}

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

export const GOOGLE_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.students.readonly'
];

export function json(data, init = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...(init.headers || {})
    }
  });
}

export function getConfig(env) {
  return {
    clientId: env.GOOGLE_CLIENT_ID || '',
    clientSecret: env.GOOGLE_CLIENT_SECRET || '',
    appBaseUrl: (env.APP_BASE_URL || '').replace(/\/$/, '')
  };
}

export function isConfigured(env) {
  const cfg = getConfig(env);
  return Boolean(cfg.clientId && cfg.clientSecret && cfg.appBaseUrl && env.NOAM_SCHOOL_KV);
}

export function redirectUri(env) {
  return `${getConfig(env).appBaseUrl}/api/google/callback`;
}

export function sessionIdFromCookie(request) {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(/(?:^|;\s*)noam_school_session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

export function newSessionId() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
}

export function sessionCookie(id, maxAge = 60 * 60 * 24 * 30) {
  return `noam_school_session=${encodeURIComponent(id)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearSessionCookie() {
  return 'noam_school_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
}

export function buildAuthUrl(env, state) {
  const cfg = getConfig(env);
  const url = new URL(GOOGLE_AUTH_URL);
  url.searchParams.set('client_id', cfg.clientId);
  url.searchParams.set('redirect_uri', redirectUri(env));
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', GOOGLE_SCOPES.join(' '));
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('include_granted_scopes', 'true');
  url.searchParams.set('state', state);
  return url.toString();
}

export async function exchangeCode(env, code) {
  const cfg = getConfig(env);
  const body = new URLSearchParams({
    code,
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    redirect_uri: redirectUri(env),
    grant_type: 'authorization_code'
  });
  const response = await fetch(GOOGLE_TOKEN_URL, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || data.error || 'Google token exchange failed');
  return data;
}

export async function refreshToken(env, refresh_token) {
  const cfg = getConfig(env);
  const body = new URLSearchParams({
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    refresh_token,
    grant_type: 'refresh_token'
  });
  const response = await fetch(GOOGLE_TOKEN_URL, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || data.error || 'Google token refresh failed');
  return data;
}

export async function googleJson(url, accessToken) {
  const response = await fetch(url, { headers: { authorization: `Bearer ${accessToken}` } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || data.error || 'Google API request failed');
  return data;
}

export async function userInfo(accessToken) {
  return googleJson(GOOGLE_USERINFO_URL, accessToken);
}

export async function loadSession(request, env) {
  const id = sessionIdFromCookie(request);
  if (!id || !env.NOAM_SCHOOL_KV) return null;
  const raw = await env.NOAM_SCHOOL_KV.get(`session:${id}`);
  return raw ? { id, data: JSON.parse(raw) } : null;
}

export async function saveSession(env, id, data) {
  await env.NOAM_SCHOOL_KV.put(`session:${id}`, JSON.stringify(data), { expirationTtl: 60 * 60 * 24 * 30 });
}

export async function deleteSession(request, env) {
  const id = sessionIdFromCookie(request);
  if (id && env.NOAM_SCHOOL_KV) await env.NOAM_SCHOOL_KV.delete(`session:${id}`);
}

export async function accessTokenForSession(request, env) {
  const session = await loadSession(request, env);
  if (!session) return null;
  const data = session.data;
  if (data.expires_at && Date.now() > data.expires_at - 60_000 && data.refresh_token) {
    const refreshed = await refreshToken(env, data.refresh_token);
    data.access_token = refreshed.access_token;
    data.expires_at = Date.now() + (refreshed.expires_in || 3600) * 1000;
    await saveSession(env, session.id, data);
  }
  return { id: session.id, data };
}

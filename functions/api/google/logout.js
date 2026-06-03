import { clearSessionCookie, deleteSession, json } from '../../_lib/google.js';

export async function onRequestPost({ request, env }) {
  await deleteSession(request, env);
  return json({ ok: true }, { headers: { 'set-cookie': clearSessionCookie() } });
}

export async function onRequestGet({ request, env }) {
  await deleteSession(request, env);
  const appBaseUrl = (env.APP_BASE_URL || '').replace(/\/$/, '') || new URL(request.url).origin;
  return Response.redirect(`${appBaseUrl}/noam-school-v10/?google=disconnected`, 302, {
    headers: { 'set-cookie': clearSessionCookie() }
  });
}

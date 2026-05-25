import { accessTokenForSession, googleJson, isConfigured, json } from '../../_lib/google.js';

function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export async function onRequestGet({ request, env }) {
  if (!isConfigured(env)) return json({ ok: false, configured: false, connected: false, events: [] }, { status: 503 });

  const session = await accessTokenForSession(request, env);
  if (!session?.data?.access_token) return json({ ok: false, configured: true, connected: false, events: [] }, { status: 401 });

  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
  url.searchParams.set('timeMin', new Date().toISOString());
  url.searchParams.set('timeMax', daysFromNow(14));
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('maxResults', '20');

  const data = await googleJson(url.toString(), session.data.access_token);
  const events = (data.items || []).map(event => ({
    id: event.id,
    title: event.summary || 'Untitled event',
    start: event.start?.dateTime || event.start?.date || '',
    end: event.end?.dateTime || event.end?.date || '',
    location: event.location || '',
    link: event.htmlLink || ''
  }));

  return json({ ok: true, configured: true, connected: true, events });
}

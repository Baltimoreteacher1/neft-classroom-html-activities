// Noam School Daily Dugout background sync scaffold
// Deploy this as a separate Cloudflare Worker with a Cron Trigger when you want true background updates.
// Required bindings/secrets:
// - NOAM_SCHOOL_KV: KV namespace used by the Pages Functions
// - GOOGLE_CLIENT_ID
// - GOOGLE_CLIENT_SECRET
//
// Suggested Cron Triggers:
// - 0 12 * * 1-5  -> weekday morning UTC check
// - 0 21 * * 1-5  -> weekday afternoon UTC check
// Adjust UTC times to match the school-day routine.

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

function json(data, init = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: { 'content-type': 'application/json; charset=utf-8', ...(init.headers || {}) }
  });
}

async function refreshToken(env, refresh_token) {
  const body = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    refresh_token,
    grant_type: 'refresh_token'
  });
  const response = await fetch(GOOGLE_TOKEN_URL, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || data.error || 'Google token refresh failed');
  return data;
}

async function googleJson(url, accessToken) {
  const response = await fetch(url, { headers: { authorization: `Bearer ${accessToken}` } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || data.error || 'Google API request failed');
  return data;
}

function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function normalizeDue(courseWork) {
  if (!courseWork.dueDate) return '';
  const d = courseWork.dueDate;
  const t = courseWork.dueTime || {};
  return new Date(Date.UTC(d.year, (d.month || 1) - 1, d.day || 1, t.hours || 12, t.minutes || 0)).toISOString();
}

async function fetchCalendar(accessToken) {
  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
  url.searchParams.set('timeMin', new Date().toISOString());
  url.searchParams.set('timeMax', daysFromNow(14));
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('maxResults', '25');
  const data = await googleJson(url.toString(), accessToken);
  return (data.items || []).map(event => ({
    id: event.id,
    title: event.summary || 'Untitled event',
    start: event.start?.dateTime || event.start?.date || '',
    end: event.end?.dateTime || event.end?.date || '',
    location: event.location || '',
    link: event.htmlLink || ''
  }));
}

async function fetchClassroom(accessToken) {
  const courseUrl = new URL('https://classroom.googleapis.com/v1/courses');
  courseUrl.searchParams.set('courseStates', 'ACTIVE');
  courseUrl.searchParams.set('pageSize', '20');
  const courseData = await googleJson(courseUrl.toString(), accessToken);
  const courses = (courseData.courses || []).map(course => ({
    id: course.id,
    name: course.name || 'Class',
    section: course.section || '',
    room: course.room || '',
    link: course.alternateLink || ''
  }));

  const assignments = [];
  for (const course of courses.slice(0, 12)) {
    try {
      const workUrl = new URL(`https://classroom.googleapis.com/v1/courses/${encodeURIComponent(course.id)}/courseWork`);
      workUrl.searchParams.set('courseWorkStates', 'PUBLISHED');
      workUrl.searchParams.set('pageSize', '20');
      const workData = await googleJson(workUrl.toString(), accessToken);
      for (const work of workData.courseWork || []) {
        assignments.push({
          id: work.id,
          courseId: course.id,
          courseName: course.name,
          title: work.title || 'Assignment',
          description: work.description || '',
          due: normalizeDue(work),
          link: work.alternateLink || '',
          type: work.workType || 'ASSIGNMENT'
        });
      }
    } catch (error) {
      assignments.push({ courseId: course.id, courseName: course.name, title: 'Could not load coursework', description: error.message, due: '', link: '', type: 'ERROR' });
    }
  }
  assignments.sort((a, b) => String(a.due || '9999').localeCompare(String(b.due || '9999')));
  return { courses, assignments };
}

async function syncOneSession(env, sessionKey) {
  const raw = await env.NOAM_SCHOOL_KV.get(sessionKey);
  if (!raw) return { sessionKey, skipped: true };
  const data = JSON.parse(raw);
  if (!data.refresh_token) return { sessionKey, skipped: true, reason: 'No refresh token' };

  const refreshed = await refreshToken(env, data.refresh_token);
  data.access_token = refreshed.access_token;
  data.expires_at = Date.now() + (refreshed.expires_in || 3600) * 1000;

  const snapshot = { synced_at: new Date().toISOString(), events: [], courses: [], assignments: [], errors: [] };
  try { snapshot.events = await fetchCalendar(data.access_token); } catch (error) { snapshot.errors.push({ source: 'calendar', message: error.message }); }
  try {
    const classroom = await fetchClassroom(data.access_token);
    snapshot.courses = classroom.courses;
    snapshot.assignments = classroom.assignments;
  } catch (error) { snapshot.errors.push({ source: 'classroom', message: error.message }); }

  data.snapshot = snapshot;
  await env.NOAM_SCHOOL_KV.put(sessionKey, JSON.stringify(data), { expirationTtl: 60 * 60 * 24 * 30 });
  await env.NOAM_SCHOOL_KV.put(`cron:${sessionKey}`, JSON.stringify(snapshot), { expirationTtl: 60 * 60 * 24 * 30 });
  return { sessionKey, ok: true, synced_at: snapshot.synced_at, errors: snapshot.errors };
}

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil((async () => {
      // KV list is used here because this is a single-family tool, not a large multi-user product.
      const list = await env.NOAM_SCHOOL_KV.list({ prefix: 'session:' });
      const results = [];
      for (const key of list.keys) {
        try { results.push(await syncOneSession(env, key.name)); }
        catch (error) { results.push({ sessionKey: key.name, ok: false, error: error.message }); }
      }
      await env.NOAM_SCHOOL_KV.put('cron:last-run', JSON.stringify({ ran_at: new Date().toISOString(), results }), { expirationTtl: 60 * 60 * 24 * 30 });
    })());
  },

  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/health') {
      const raw = await env.NOAM_SCHOOL_KV.get('cron:last-run');
      return json({ ok: true, lastRun: raw ? JSON.parse(raw) : null });
    }
    return json({ ok: true, message: 'Noam School cron worker is installed. Use /health to inspect last run.' });
  }
};

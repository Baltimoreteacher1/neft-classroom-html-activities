import { accessTokenForSession, googleJson, isConfigured, json, saveSession } from '../../_lib/google.js';

function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function normalizeDue(courseWork) {
  if (!courseWork.dueDate) return '';
  const d = courseWork.dueDate;
  const t = courseWork.dueTime || {};
  const date = new Date(Date.UTC(d.year, (d.month || 1) - 1, d.day || 1, t.hours || 12, t.minutes || 0));
  return date.toISOString();
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
      assignments.push({
        courseId: course.id,
        courseName: course.name,
        title: 'Could not load coursework',
        description: error.message,
        due: '',
        link: '',
        type: 'ERROR'
      });
    }
  }

  assignments.sort((a, b) => String(a.due || '9999').localeCompare(String(b.due || '9999')));
  return { courses, assignments };
}

export async function onRequestGet({ request, env }) {
  if (!isConfigured(env)) {
    return json({ ok: false, configured: false, connected: false, error: 'Google sync is not configured yet.' }, { status: 503 });
  }

  const session = await accessTokenForSession(request, env);
  if (!session?.data?.access_token) {
    return json({ ok: false, configured: true, connected: false, error: 'Google is not connected.' }, { status: 401 });
  }

  const snapshot = {
    synced_at: new Date().toISOString(),
    events: [],
    courses: [],
    assignments: [],
    errors: []
  };

  try {
    snapshot.events = await fetchCalendar(session.data.access_token);
  } catch (error) {
    snapshot.errors.push({ source: 'calendar', message: error.message });
  }

  try {
    const classroom = await fetchClassroom(session.data.access_token);
    snapshot.courses = classroom.courses;
    snapshot.assignments = classroom.assignments;
  } catch (error) {
    snapshot.errors.push({ source: 'classroom', message: error.message });
  }

  const data = { ...session.data, snapshot };
  await saveSession(env, session.id, data);
  await env.NOAM_SCHOOL_KV.put(`snapshot:${session.id}`, JSON.stringify(snapshot), { expirationTtl: 60 * 60 * 24 * 30 });

  return json({ ok: true, configured: true, connected: true, ...snapshot });
}

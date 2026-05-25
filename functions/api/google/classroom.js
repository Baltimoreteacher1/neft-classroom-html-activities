import { accessTokenForSession, googleJson, isConfigured, json } from '../../_lib/google.js';

function normalizeDue(courseWork) {
  if (!courseWork.dueDate) return '';
  const d = courseWork.dueDate;
  const t = courseWork.dueTime || {};
  const date = new Date(Date.UTC(d.year, (d.month || 1) - 1, d.day || 1, t.hours || 12, t.minutes || 0));
  return date.toISOString();
}

export async function onRequestGet({ request, env }) {
  if (!isConfigured(env)) return json({ ok: false, configured: false, connected: false, courses: [], assignments: [] }, { status: 503 });

  const session = await accessTokenForSession(request, env);
  if (!session?.data?.access_token) return json({ ok: false, configured: true, connected: false, courses: [], assignments: [] }, { status: 401 });

  const courseUrl = new URL('https://classroom.googleapis.com/v1/courses');
  courseUrl.searchParams.set('courseStates', 'ACTIVE');
  courseUrl.searchParams.set('pageSize', '20');
  const courseData = await googleJson(courseUrl.toString(), session.data.access_token);
  const courses = (courseData.courses || []).map(course => ({ id: course.id, name: course.name || 'Class', section: course.section || '', room: course.room || '', link: course.alternateLink || '' }));

  const assignments = [];
  for (const course of courses.slice(0, 12)) {
    try {
      const workUrl = new URL(`https://classroom.googleapis.com/v1/courses/${encodeURIComponent(course.id)}/courseWork`);
      workUrl.searchParams.set('courseWorkStates', 'PUBLISHED');
      workUrl.searchParams.set('pageSize', '20');
      const workData = await googleJson(workUrl.toString(), session.data.access_token);
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
  return json({ ok: true, configured: true, connected: true, courses, assignments });
}

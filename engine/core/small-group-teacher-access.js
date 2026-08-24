import { isScormLaunch } from "./scorm-bridge.js";
import { el } from "./small-group-ui.js";

/**
 * The mode bar is mounted as a SIBLING of #app, immediately before it, not as
 * its first child. #app is a centred 1160px column, so a bar inside it stops at
 * the column edge and reads as a floating dark slab on any wide screen; a plain
 * block in the body spans the viewport exactly, with no 100vw scrollbar
 * overshoot. Everything else stays inside #app.
 */
function mountBar(app, bar) {
  app.parentNode?.insertBefore(bar, app);
}

function modeBar(mode, lessonId) {
  const bar = el("div", `sg-mode sg-mode--${mode}`);
  bar.setAttribute("aria-label", `${mode === "teacher" ? "Teacher" : "Student"} mode controls`);
  bar.appendChild(
    el("span", "sg-mode-state", mode === "teacher" ? "Teacher Mode" : "Student Mode"),
  );
  const link = el(
    "a",
    "sg-mode-action",
    mode === "teacher" ? "Switch to Student" : "Teacher access",
  );
  link.href = mode === "teacher" ? `/lessons/${lessonId}/` : `/teacher-small-group/${lessonId}/`;
  bar.appendChild(link);
  return bar;
}

export async function mountSmallGroupTeacherAccess({ app, lessonId, renderTeacher }) {
  // A SCORM launch is a student sitting in an LMS assignment. There is no
  // teacher at that keyboard, and the mode bar's link points OUT of the lesson
  // at /teacher-small-group/<id>/ — inside the SCO's tracked iframe. A student
  // who taps it navigates the frame the LMS is grading away from the lesson.
  // Core lessons already show no teacher affordance in a package; small-group
  // showed one, and only became a real exposure when the 168 group1/group2
  // variants were added to the SCORM catalog. The teacher route stays reachable
  // outside the LMS, where it belongs, and is auth-gated either way.
  // isScormLaunch() is the ONE reader of that question — see scorm-bridge.js on
  // why a second opinion is how a lesson ends up half-connected.
  if (isScormLaunch()) return false;

  const requested = new URLSearchParams(window.location.search).get("teacher") === "1";
  if (!requested) {
    mountBar(app, modeBar("student", lessonId));
    return false;
  }

  let response;
  try {
    response = await fetch(`/teacher-small-group/${encodeURIComponent(lessonId)}/data`, {
      credentials: "same-origin",
      headers: { accept: "application/json" },
    });
  } catch {
    response = null;
  }
  let payload = null;
  if (response?.ok) {
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
  }
  if (!response?.ok || !payload?.facilitation) {
    mountBar(app, modeBar("student", lessonId));
    const notice = el(
      "p",
      "sg-mode-notice",
      "Teacher access was not confirmed. This lesson is staying in Student Mode.",
    );
    notice.setAttribute("role", "status");
    app.prepend(notice);
    return false;
  }

  mountBar(app, modeBar("teacher", lessonId));
  document.body.classList.add("sg-is-teacher");
  renderTeacher(payload.facilitation);
  return true;
}

import { el } from "./small-group-ui.js";

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
  const requested = new URLSearchParams(window.location.search).get("teacher") === "1";
  if (!requested) {
    app.prepend(modeBar("student", lessonId));
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
    app.prepend(modeBar("student", lessonId));
    const notice = el(
      "p",
      "sg-mode-notice",
      "Teacher access was not confirmed. This lesson is staying in Student Mode.",
    );
    notice.setAttribute("role", "status");
    app.querySelector(".sg-mode")?.after(notice);
    return false;
  }

  app.prepend(modeBar("teacher", lessonId));
  document.body.classList.add("sg-is-teacher");
  renderTeacher(payload.facilitation);
  return true;
}

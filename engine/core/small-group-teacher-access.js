function modeBar(mode, lessonId) {
  const bar = document.createElement("div");
  bar.className = `sg-mode sg-mode--${mode}`;
  bar.setAttribute("aria-label", `${mode === "teacher" ? "Teacher" : "Student"} mode controls`);

  const state = document.createElement("span");
  state.className = "sg-mode-state";
  state.textContent = mode === "teacher" ? "Teacher Mode" : "Student Mode";
  bar.appendChild(state);

  const link = document.createElement("a");
  link.className = "sg-mode-action";
  if (mode === "teacher") {
    link.href = `/lessons/${lessonId}/`;
    link.textContent = "Switch to Student";
  } else {
    link.href = `/teacher-small-group/${lessonId}/`;
    link.textContent = "Teacher access";
  }
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

  if (!response?.ok) {
    app.prepend(modeBar("student", lessonId));
    const notice = document.createElement("p");
    notice.className = "sg-mode-notice";
    notice.setAttribute("role", "status");
    notice.textContent =
      "Teacher access was not confirmed. This lesson is staying in Student Mode.";
    app.querySelector(".sg-mode")?.after(notice);
    return false;
  }

  const payload = await response.json();
  app.prepend(modeBar("teacher", lessonId));
  document.body.classList.add("sg-is-teacher");
  renderTeacher(payload.smallGroup);
  return true;
}

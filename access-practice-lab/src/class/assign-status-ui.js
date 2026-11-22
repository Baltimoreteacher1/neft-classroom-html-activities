// Assignment status in the class pages: what a learner sees and can do on each assignment, and the teacher's board
// (every assignment by every learner, with review, revision and reassign). The buttons are derived from the same
// rules the server enforces (shared/class-platform/assignment-lifecycle.js), so a page never offers an action the
// server would refuse. This is practice tracking, never a grade.
import {
  DEFAULT_ATTEMPTS,
  STATES,
  STUDENT_ACTIONS,
  TEACHER_ACTIONS,
  nextState,
} from "../../../shared/class-platform/assignment-lifecycle.js";
import { el, errorText } from "./dom.js";

export const STATE_TEXT = Object.freeze({
  assigned: ["Not started", "Sin empezar"],
  in_progress: ["In progress", "En progreso"],
  submitted: ["Turned in", "Entregado"],
  needs_revision: ["Please revise", "Por revisar"],
  reviewed: ["Reviewed", "Revisado"],
});
const TEACHER_LABEL = Object.freeze({
  review: ["Mark reviewed", "Marcar revisado"],
  request_revision: ["Ask to revise", "Pedir revisión"],
  reassign: ["Reassign", "Reasignar"],
});

/** Learner buttons for one assignment status: only moves the server will accept, labelled for where they are. */
export function learnerActions(status, S) {
  const attempts =
    (status.attempt || 1) + (status.attemptsLeft ?? DEFAULT_ATTEMPTS - (status.attempt || 1));
  const labelFor = (action) =>
    action === "submit"
      ? S("Turn in", "Entregar")
      : status.state === "needs_revision"
        ? S("Revise", "Revisar")
        : status.state === "assigned"
          ? S("Start", "Empezar")
          : S("Try again", "Intentar de nuevo");
  return STUDENT_ACTIONS.filter(
    (action) =>
      nextState({
        state: status.state,
        attempt: status.attempt || 1,
        action,
        actor: "student",
        attempts,
      }).ok,
  ).map((action) => ({ action, label: labelFor(action) }));
}

/** Teacher buttons for a learner's state. */
export const teacherActions = (state, S) =>
  TEACHER_ACTIONS.filter(
    (action) => nextState({ state, attempt: 1, action, actor: "teacher" }).ok,
  ).map((action) => ({
    action,
    label: S(...TEACHER_LABEL[action]),
  }));

/** One assignment's status line for the learner, with its buttons. `onAct(action)` performs the move. */
export function learnerStatusRow({ S, status, onAct }) {
  const state = STATES.includes(status?.state) ? status.state : "assigned";
  const buttons = learnerActions({ ...status, state }, S).map(({ action, label }) =>
    el(
      "button",
      {
        type: "button",
        class: "btn small ghost",
        "data-astatus": action,
        onclick: () => onAct(action),
      },
      label,
    ),
  );
  return el(
    "div",
    { class: "cls-status" },
    el("span", { class: "cls-state", "data-state": state }, S(...STATE_TEXT[state])),
    status?.attempt > 1
      ? el("span", { class: "fine" }, ` · ${S("try", "intento")} ${status.attempt}`)
      : null,
    status?.late
      ? el("span", { class: "fine" }, ` · ${S("turned in late", "entregado tarde")}`)
      : null,
    status?.comment
      ? el(
          "p",
          { class: "cls-teacher-note" },
          el("strong", {}, `${S("From your teacher", "De tu docente")}: `),
          status.comment,
        )
      : null,
    buttons.length ? el("span", { class: "row-actions" }, buttons) : null,
  );
}

const dateText = (S, a) =>
  [
    a.due ? `${S("due", "para el")} ${a.due}` : "",
    a.availableFrom ? `${S("starts", "comienza")} ${a.availableFrom}` : "",
    a.attempts ? `${a.attempts} ${S("tries", "intentos")}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

function summaryLine(S, summary) {
  const parts = STATES.map((s) => `${S(...STATE_TEXT[s])} ${summary.counts[s]}`);
  if (summary.late) parts.push(`${S("Late", "Tarde")} ${summary.late}`);
  return parts.join(" · ");
}

/**
 * The teacher's status board. Draws every assignment with a learner table; polls while the page is visible.
 * @returns {{ refresh: () => Promise<void>, unmount: () => void }}
 */
export function mountAssignBoard(box, { S, api, live }) {
  let timer = null;
  const open = new Set(); // "assignmentId|studentId" rows whose history is expanded
  const histories = new Map();

  async function act(assignmentId, studentId, action, commentInput) {
    const res = await api.astatusAct({
      assignmentId,
      studentId,
      action,
      comment: commentInput?.value || "",
    });
    live.textContent = res.ok ? S("Saved.", "Guardado.") : errorText(S, res.error);
    await refresh();
  }
  async function toggleHistory(assignmentId, studentId) {
    const key = `${assignmentId}|${studentId}`;
    if (open.has(key)) open.delete(key);
    else {
      open.add(key);
      const res = await api.astatusHistory(assignmentId, studentId);
      histories.set(key, res.ok ? res.events : []);
    }
    await refresh();
  }

  function draw(board) {
    if (!board.assignments.length) {
      box.replaceChildren(
        el(
          "p",
          {},
          S(
            "Assign something to see each learner's progress here.",
            "Asigna algo para ver aquí el progreso de cada estudiante.",
          ),
        ),
      );
      return;
    }
    box.replaceChildren(
      ...board.assignments.map((a) => {
        const rows = a.students.map((s) => {
          const key = `${a.id}|${s.studentId}`;
          const note = el("input", {
            type: "text",
            maxlength: "280",
            class: "cls-note-in",
            "aria-label": `${S("Comment for", "Comentario para")} ${s.alias}`,
            value: "",
          });
          const acts = teacherActions(s.state, S);
          return [
            el(
              "tr",
              {},
              el("th", { scope: "row" }, s.alias),
              el(
                "td",
                {},
                el(
                  "span",
                  { class: "cls-state", "data-state": s.state },
                  S(...STATE_TEXT[s.state]),
                ),
              ),
              el("td", {}, String(s.attempt)),
              el("td", {}, s.late ? S("late", "tarde") : ""),
              el(
                "td",
                {},
                acts.length && s.state !== "reviewed" ? note : null,
                el(
                  "span",
                  { class: "row-actions" },
                  acts.map(({ action, label }) =>
                    el(
                      "button",
                      {
                        type: "button",
                        class: "btn small ghost",
                        "data-astatus-teacher": action,
                        onclick: () => act(a.id, s.studentId, action, note),
                      },
                      label,
                    ),
                  ),
                  el(
                    "button",
                    {
                      type: "button",
                      class: "btn small ghost",
                      "aria-expanded": String(open.has(key)),
                      onclick: () => toggleHistory(a.id, s.studentId),
                    },
                    S("History", "Historial"),
                  ),
                ),
              ),
            ),
            open.has(key)
              ? el(
                  "tr",
                  {},
                  el(
                    "td",
                    { colspan: "5" },
                    el(
                      "ul",
                      { class: "fine" },
                      (histories.get(key) || []).map((e) =>
                        el(
                          "li",
                          {},
                          `${new Date(e.at).toLocaleString()} · ${e.actor} · ${e.action} → ${e.to} (${S("try", "intento")} ${e.attempt})`,
                        ),
                      ),
                    ),
                  ),
                )
              : null,
          ];
        });
        return el(
          "section",
          { class: "cls-assign-board" },
          el(
            "h5",
            {},
            a.title || a.id,
            a.draft
              ? el(
                  "span",
                  { class: "cls-draft" },
                  ` · ${S("Draft: learners cannot see it", "Borrador: los estudiantes no lo ven")}`,
                )
              : null,
          ),
          el(
            "p",
            { class: "fine" },
            [dateText(S, a), summaryLine(S, a.summary)].filter(Boolean).join(" · "),
          ),
          el(
            "table",
            { class: "cls-table" },
            el(
              "thead",
              {},
              el(
                "tr",
                {},
                ...[
                  S("Learner", "Estudiante"),
                  S("Status", "Estado"),
                  S("Try", "Intento"),
                  S("Late", "Tarde"),
                  S("Actions", "Acciones"),
                ].map((h) => el("th", { scope: "col" }, h)),
              ),
            ),
            el("tbody", {}, rows.flat().filter(Boolean)),
          ),
        );
      }),
    );
  }

  async function refresh() {
    const res = await api.astatusBoard();
    if (res.ok) draw(res);
    else box.replaceChildren(el("p", {}, errorText(S, res.error)));
  }
  refresh();
  timer = setInterval(() => !document.hidden && refresh(), 15_000);
  return { refresh, unmount: () => clearInterval(timer) };
}

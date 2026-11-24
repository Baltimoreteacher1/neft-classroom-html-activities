// "Assigned by your teacher" bar for the BCPSS student pages (Language Studio and Writing Lab). A learner who joined a
// class on this device and opens a page their class assigned sees what it is, when it is due and where they stand, and
// can turn it in without leaving. Opening the page starts it. Nothing renders for a visitor with no class, or for a page
// the class did not assign, so every other way of using these pages is unchanged.
import { DEFAULT_ATTEMPTS, nextState } from "../shared/class-platform/assignment-lifecycle.js";
import { classInfo, readStoredLink, studentApi } from "../shared/class-platform/client.js";
import { assignmentFor } from "../shared/class-platform/bcpss-assignments.js";

const STATE_TEXT = {
  assigned: "Not started",
  in_progress: "In progress",
  submitted: "Turned in",
  needs_revision: "Your teacher asked for a revision",
  reviewed: "Reviewed by your teacher",
};

const api = studentApi("language");

const can = (status, assignment, action) =>
  nextState({
    state: status.state,
    attempt: status.attempt || 1,
    action,
    actor: "student",
    attempts: assignment.attempts || DEFAULT_ATTEMPTS,
  }).ok;

function el(tag, props = {}, ...kids) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "text") node.textContent = v;
    else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  node.append(...kids.filter(Boolean));
  return node;
}

/** Draw the bar for one assignment and keep it in step with the class. */
function mount({ link, className, assignment, status }) {
  const bar = el("aside", { class: "asg-bar no-print", "aria-label": "Assigned work" });
  let current = status;
  const draw = (message = "") => {
    const due = assignment.due ? ` · due ${assignment.due}` : "";
    const turnIn = can(current, assignment, "submit")
      ? el("button", {
          type: "button",
          class: "asg-bar__btn",
          text: current.state === "needs_revision" ? "Turn in again" : "Turn in",
          onclick: () => act("submit"),
        })
      : null;
    const again =
      !turnIn && can(current, assignment, "start")
        ? el("button", {
            type: "button",
            class: "asg-bar__btn",
            text: current.state === "submitted" ? "Try again" : "Start",
            onclick: () => act("start"),
          })
        : null;
    bar.replaceChildren(
      ...[
        el(
          "p",
          { class: "asg-bar__text" },
          el("b", { text: "Assigned: " }),
          `${assignment.title}${due} · `,
          el("span", { text: STATE_TEXT[current.state] || STATE_TEXT.assigned }),
        ),
        current.comment
          ? el("p", { class: "asg-bar__note", text: `Teacher note: ${current.comment}` })
          : null,
        turnIn || again,
        el("a", {
          class: "asg-bar__link",
          href: "/access-practice-lab/class",
          text: className ? `My class (${className})` : "My class",
        }),
        el("span", { class: "asg-bar__msg", role: "status", text: message }),
      ].filter(Boolean),
    );
  };
  async function act(action) {
    const res = await api.astatusAct(link, { assignmentId: assignment.id, action });
    if (res.ok) {
      current = res.status;
      draw(action === "submit" ? "Turned in. Nice work." : "");
    } else {
      draw("Could not save that. Check your connection and try again.");
    }
  }
  draw();
  return bar;
}

/** Find the learner's assignment for this page and show the bar above `anchor`. Resolves quietly when there is nothing to show. */
export async function mountAssignedBar(anchor) {
  const link = readStoredLink();
  if (!link || !anchor) return;
  const info = await classInfo(link.code);
  if (!info.ok) return;
  const assignment = assignmentFor(info.assignments, location.pathname, location.search);
  if (!assignment) return;
  const mine = await api.astatusMine(link);
  let status = (mine?.statuses || []).find((s) => s.assignmentId === assignment.id) || {
    state: "assigned",
    attempt: 1,
  };
  if (status.state === "assigned" && can(status, assignment, "start")) {
    const started = await api.astatusAct(link, { assignmentId: assignment.id, action: "start" });
    if (started.ok) status = started.status;
  }
  anchor.before(mount({ link, className: info.title, assignment, status }));
}

mountAssignedBar(document.querySelector("main"));

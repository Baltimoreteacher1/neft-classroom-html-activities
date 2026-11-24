// BCPSS assign dialog: one dialog for every "Assign" button on the unit shelf. The teacher picks a class opened on this
// device, a level and optional dates, and the work lands in that class's Assigned practice (the same list, due dates and
// Start / Turn in states the Language Page class already has). With no class yet, or for a teacher who shares by link,
// the dialog also hands out the student link and a Google Classroom share link.
import {
  LEVELS,
  LEVEL_NAMES,
  googleClassroomUrl,
  studentUrl,
  toClassAssignment,
} from "../shared/class-platform/bcpss-assignments.js";
import {
  MAX_ASSIGNMENTS,
  saveAllToClass,
  teacherClasses,
} from "../shared/class-platform/teacher-classes.js";

const CLASS_VIEW = "/access-practice-lab/class";
const TEACHER_VIEW = "/access-practice-lab/class/teacher";

const REASONS = {
  passcode:
    "This device has an old passcode for that class. Open the class once from the class teacher view, then try again.",
  full: `That class already holds ${MAX_ASSIGNMENTS} assignments. Remove finished ones in the class teacher view, then try again.`,
  offline: "Could not reach the class. Check the connection and try again.",
};

function h(tag, props, ...kids) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props || {})) {
    if (value === false || value == null) continue;
    if (key.startsWith("on")) node.addEventListener(key.slice(2), value);
    else if (key === "text") node.textContent = value;
    else node.setAttribute(key, value === true ? "" : value);
  }
  node.append(...kids.flat().filter((k) => k != null && k !== false));
  return node;
}

const field = (label, control) =>
  h("label", { class: "asg-field" }, h("span", { text: label }), control);

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function classPicker(classes) {
  return h(
    "select",
    { id: "asgClass", name: "class" },
    ...classes.map((c) =>
      h("option", { value: c.code, text: c.title ? `${c.title} (${c.code})` : c.code }),
    ),
  );
}

function levelPicker() {
  return h(
    "select",
    { id: "asgLevel", name: "level" },
    h("option", { value: "", text: "Each student's own level" }),
    ...LEVELS.map((l) => h("option", { value: l, text: `${LEVEL_NAMES[l]} only` })),
  );
}

/**
 * Open the assign dialog.
 * @param {{ makers: Array<(level: string) => object>, heading?: string }} options
 *   `makers` build one item each (see shared/class-platform/bcpss-assignments.js) for the chosen level.
 */
export function openAssignDialog({ makers, heading = "Assign to students" }) {
  const classes = teacherClasses();
  const build = (level) => makers.map((make) => make(level));
  const preview = build("");
  const status = h("p", { class: "asg-status", role: "status", "aria-live": "polite" });
  const say = (text, bad = false) => {
    status.textContent = text;
    status.dataset.tone = bad ? "bad" : "ok";
  };
  const dialog = h("dialog", { class: "asg", "aria-labelledby": "asgH" });
  const close = () => {
    dialog.close();
    dialog.remove();
  };
  const levelSel = levelPicker();
  const classSel = classes.length ? classPicker(classes) : null;
  const availableFrom = h("input", { type: "date", id: "asgFrom" });
  const due = h("input", { type: "date", id: "asgDue" });
  const assignBtn = h("button", {
    type: "button",
    class: "asg-go",
    text: `Assign ${preview.length === 1 ? "this" : `these ${preview.length}`} to class`,
  });

  assignBtn.addEventListener("click", async () => {
    const cls = classes.find((c) => c.code === classSel.value);
    if (!cls) return;
    if (due.value && availableFrom.value && due.value < availableFrom.value) {
      say("The due date is before the start date.", true);
      return;
    }
    assignBtn.disabled = true;
    say("Assigning…");
    const dates = { due: due.value || null, availableFrom: availableFrom.value || null };
    const res = await saveAllToClass(
      cls,
      build(levelSel.value).map((item) => toClassAssignment(item, dates)),
    );
    assignBtn.disabled = false;
    if (!res.ok) return say(REASONS[res.reason] || `Could not assign: ${res.reason}.`, true);
    const bits = [`Assigned ${res.added} to ${cls.title || cls.code}.`];
    if (res.already) bits.push(`${res.already} already assigned.`);
    if (res.skipped)
      bits.push(`${res.skipped} did not fit under the ${MAX_ASSIGNMENTS}-assignment limit.`);
    say(bits.join(" "), res.skipped > 0);
  });

  const classSection = classes.length
    ? h(
        "section",
        { class: "asg-sec", "aria-labelledby": "asgClassH" },
        h("h3", { id: "asgClassH", text: "Assign to a class" }),
        h(
          "div",
          { class: "asg-grid" },
          field("Class", classSel),
          field("Level", levelSel),
          field("Show from", availableFrom),
          field("Due", due),
        ),
        assignBtn,
        h(
          "p",
          { class: "asg-note" },
          "Students open it from ",
          h("a", { href: CLASS_VIEW, text: "My class" }),
          " under Assigned practice, and can Start and Turn in there.",
        ),
      )
    : h(
        "section",
        { class: "asg-sec", "aria-labelledby": "asgClassH" },
        h("h3", { id: "asgClassH", text: "Assign to a class" }),
        h(
          "p",
          { class: "asg-note" },
          "No class is open on this device yet. ",
          h("a", { href: TEACHER_VIEW, text: "Create or open a class" }),
          ", then come back here to assign. You can share a link in the meantime.",
        ),
      );

  const linkLines = () =>
    build(levelSel.value)
      .map((item) => `${item.title}\n${studentUrl(item, location.origin)}`)
      .join("\n\n");
  const copyBtn = h("button", {
    type: "button",
    class: "asg-alt",
    text: preview.length === 1 ? "Copy student link" : "Copy all links",
    onclick: async () => {
      const one =
        preview.length === 1 ? studentUrl(build(levelSel.value)[0], location.origin) : linkLines();
      say(
        (await copyText(one)) ? "Copied." : "Copy was blocked. Select the link below and copy it.",
        false,
      );
    },
  });
  const shareSection = h(
    "section",
    { class: "asg-sec", "aria-labelledby": "asgShareH" },
    h("h3", { id: "asgShareH", text: "Or share a link" }),
    h("textarea", {
      class: "asg-links",
      readonly: true,
      rows: Math.min(6, preview.length * 3),
      "aria-label": "Student links",
    }),
    h(
      "div",
      { class: "asg-row" },
      copyBtn,
      preview.length === 1 &&
        h("a", {
          class: "asg-alt",
          target: "_blank",
          rel: "noopener",
          id: "asgGc",
          text: "Share to Google Classroom",
        }),
      preview.length === 1 &&
        h("a", {
          class: "asg-alt",
          target: "_blank",
          rel: "noopener",
          id: "asgOpen",
          text: "Open as a student",
        }),
    ),
  );
  const refreshLinks = () => {
    const items = build(levelSel.value);
    shareSection.querySelector("textarea").value = linkLines();
    if (items.length !== 1) return;
    shareSection.querySelector("#asgGc").href = googleClassroomUrl(items[0], location.origin);
    shareSection.querySelector("#asgOpen").href = items[0].path;
  };
  levelSel.addEventListener("change", refreshLinks);
  refreshLinks();

  dialog.append(
    h("h2", { id: "asgH", text: heading }),
    h(
      "ul",
      { class: "asg-items" },
      ...preview.slice(0, 4).map((i) => h("li", { text: i.title })),
      preview.length > 4 && h("li", { text: `+ ${preview.length - 4} more` }),
    ),
    classSection,
    shareSection,
    status,
    h("button", { type: "button", class: "asg-close", text: "Close", onclick: close }),
  );
  dialog.addEventListener("cancel", () => dialog.remove());
  document.body.append(dialog);
  dialog.showModal();
  return dialog;
}

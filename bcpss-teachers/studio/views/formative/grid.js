// The alias tap grid: one row per alias, three level buttons per row, so scoring a student is ONE tap. Keys 1, 2
// and 3 score the focused row and move to the next alias. Rows show aliases only, never names or initials.
import { h } from "../../core/dom.js";
import { LEVELS, LEVEL_LABEL } from "../../../../shared/formative/constants.js";

const KEY_LEVEL = { 1: "emerging", 2: "developing", 3: "proficient" };

function row(student, levelOf, onTap) {
  const buttons = LEVELS.map((level) =>
    h("button", {
      class: "st-fm-tap",
      type: "button",
      "data-level": level,
      "aria-label": `${student.alias}: ${LEVEL_LABEL[level]}`,
      onclick: () => onTap(student.studentId, level),
    }, LEVEL_LABEL[level]),
  );
  const el = h("li", { class: "st-fm-row", "data-student": student.studentId },
    h("span", { class: "st-fm-alias" }, student.alias),
    h("span", { class: "st-fm-taps", role: "group", "aria-label": `Score for ${student.alias}` }, buttons),
  );
  const paint = () => {
    const now = levelOf(student.studentId);
    for (const b of buttons) b.setAttribute("aria-pressed", String(b.dataset.level === now));
  };
  paint();
  return { el, paint, buttons };
}

/**
 * @param {{ studentId: string, alias: string }[]} roster
 * @param {(studentId: string) => string | undefined} levelOf
 * @param {(studentId: string, level: string) => void} onTap
 * @returns {{ el: HTMLElement, refresh: () => void }}
 */
export function scoreGrid(roster, levelOf, onTap) {
  const rows = roster.map((s) => row(s, levelOf, onTap));
  const list = h("ul", { class: "st-fm-grid", "aria-label": "Class aliases" }, rows.map((r) => r.el));
  list.addEventListener("keydown", (e) => {
    const level = KEY_LEVEL[e.key];
    const at = rows.findIndex((r) => r.el.contains(e.target));
    if (!level || at < 0 || e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault();
    onTap(roster[at].studentId, level);
    (rows[at + 1] || rows[at]).buttons[0].focus();
  });
  return { el: list, refresh: () => rows.forEach((r) => r.paint()) };
}

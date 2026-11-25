// Print sheet: a student handout shell. Tight spacing, no page-break rules, grayscale-legible, paper-and-pencil
// only. Margins and the print reset live in ui.css (@media print). Name and Date are plain write-in lines:
// students write an alias or first name, nothing is pre-filled.
import { cx, h, uid } from "./h.js";

/**
 * createPrintSheet({ title, subtitle, nameLine, sections, footer })
 * sections: [{ heading, body, lines }]  body: string | Node | array; lines: number of ruled answer lines
 */
export function createPrintSheet({ title, subtitle, nameLine = true, sections = [], footer } = {}) {
  if (!title) throw new Error("createPrintSheet: title is required");
  const id = uid("ui-sheet");
  return h(
    "article",
    { class: "ui-sheet", "aria-labelledby": id },
    h(
      "header",
      { class: "ui-sheet__head" },
      h("h2", { class: "ui-sheet__title", id }, title),
      subtitle ? h("p", { class: "ui-sheet__subtitle" }, subtitle) : null,
    ),
    nameLine
      ? h(
          "p",
          { class: "ui-sheet__who" },
          h("span", { class: "ui-sheet__field" }, "Name"),
          h("span", { class: "ui-sheet__field" }, "Date"),
        )
      : null,
    sections.map((s) =>
      h(
        "section",
        { class: "ui-sheet__section" },
        h("h3", { class: "ui-sheet__heading" }, s.heading),
        s.body ? h("div", { class: "ui-sheet__body" }, s.body) : null,
        s.lines
          ? h(
              "div",
              { class: cx("ui-sheet__lines"), "aria-hidden": "true" },
              Array.from({ length: s.lines }, () => h("div", { class: "ui-sheet__line" })),
            )
          : null,
      ),
    ),
    footer ? h("footer", { class: "ui-sheet__foot" }, footer) : null,
  );
}

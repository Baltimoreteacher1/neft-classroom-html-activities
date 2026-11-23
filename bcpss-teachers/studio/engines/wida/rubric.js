// Teacher feedback sheet for Speaking and Writing: an observation record (Seen / Emerging / Not yet seen), not a score.
import { h } from "../../core/dom.js";
import { printNodes, uid } from "./ui.js";

const OBS = [
  ["seen", "Seen"],
  ["emerging", "Emerging"],
  ["not-yet", "Not yet seen"],
];

export function feedbackSheet(collection, state, onChange) {
  const rub = collection.teacherGuide?.feedbackRubric;
  if (!rub) return null;
  state.marks = state.marks || {};
  state.notes = state.notes || {};
  const table = h("table", { class: "st-wida-rubric" }, h("caption", {}, rub.title || "Teacher feedback sheet"));
  table.append(h("thead", {}, h("tr", {}, h("th", { scope: "col" }, "What to look for"), ...OBS.map(([, l]) => h("th", { scope: "col" }, l)), h("th", { scope: "col" }, "Next step"))));
  const body = h("tbody");
  for (const c of rub.criteria) {
    const name = uid("rb");
    const tr = h("tr", {}, h("th", { scope: "row" }, h("strong", {}, c.label), h("br"), h("span", { class: "st-wida-quiet" }, c.lookFor)));
    for (const [v, l] of OBS) {
      const id = uid("rbo");
      const input = h("input", { type: "radio", name, id, value: v, "aria-label": `${c.label}: ${l}` });
      input.checked = state.marks[c.id] === v;
      input.addEventListener("change", () => {
        state.marks[c.id] = v;
        onChange?.();
      });
      tr.append(h("td", {}, input));
    }
    tr.append(h("td", {}, c.nextStep || ""));
    body.append(tr);
  }
  table.append(body);
  const noteId = uid("rbn");
  const note = h("textarea", { id: noteId, class: "st-textarea", rows: "3", placeholder: "One specific thing the student did well and one thing to try next." });
  note.value = state.notes.comment || "";
  note.addEventListener("input", () => {
    state.notes.comment = note.value;
    onChange?.();
  });
  const print = h("button", { type: "button", class: "st-btn" }, "Print feedback sheet");
  print.addEventListener("click", () => {
    const clone = table.cloneNode(true);
    clone.querySelectorAll("input").forEach((i) => (i.checked ? i.setAttribute("checked", "") : i.removeAttribute("checked")));
    printNodes(`${rub.title || "Teacher feedback sheet"}: ${collection.title}`, [clone, h("p", {}, h("strong", {}, "Comment: "), note.value || "")]);
  });
  return h(
    "section",
    { class: "st-wida-feedback-sheet", "aria-label": "Teacher feedback sheet" },
    h("h3", {}, rub.title || "Teacher feedback sheet"),
    h("p", { class: "st-wida-quiet" }, "For the teacher. This records what you saw. It is not a score and does not give a WIDA level."),
    h("div", { class: "st-wida-tablewrap" }, table),
    h("label", { for: noteId }, "Comment"),
    note,
    h("div", { class: "st-row" }, print),
  );
}

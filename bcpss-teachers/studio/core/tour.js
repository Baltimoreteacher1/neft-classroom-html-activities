// Skippable three-step tour. A focus-trapped dialog: Tab cycles inside it, Esc closes, focus returns to the opener.
import { h } from "./dom.js";

const STEPS = [
  { title: "Find my lesson", body: "Pick a grade and a subject, or search by title, standard code or vocabulary word. Nothing is chosen for you." },
  { title: "Prepare my class", body: "Choose a lesson and, if you like, a class profile. The studio assembles vocabulary, a language objective, an activity, discussion prompts, a printable and an exit ticket." },
  { title: "Launch an activity", body: "Copy a student link or open the activity on the projector. Student work stays on the student's device. Evidence comes back as a pasted code with no names." },
];

export function startTour({ opener, onDone = () => {}, doc = document }) {
  let i = 0;
  const title = h("h2", { id: "st-tour-title" });
  const body = h("p", { id: "st-tour-body" });
  const count = h("p", { class: "st-tour-count" });
  const next = h("button", { class: "st-btn st-btn-primary", type: "button" });
  const skip = h("button", { class: "st-btn st-btn-quiet", type: "button" }, "Skip tour");
  const box = h(
    "div",
    { class: "st-dialog", role: "dialog", "aria-modal": "true", "aria-labelledby": "st-tour-title", "aria-describedby": "st-tour-body" },
    count,
    title,
    body,
    h("div", { class: "st-row" }, next, skip),
  );
  const veil = h("div", { class: "st-veil" }, box);

  const paint = () => {
    const s = STEPS[i];
    count.textContent = `Step ${i + 1} of ${STEPS.length}`;
    title.textContent = s.title;
    body.textContent = s.body;
    next.textContent = i === STEPS.length - 1 ? "Done" : "Next";
  };
  const close = () => {
    doc.removeEventListener("keydown", onKey, true);
    veil.remove();
    onDone();
    (opener?.isConnected ? opener : doc.getElementById("st-main"))?.focus();
  };
  function onKey(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Tab") {
      const f = [...box.querySelectorAll("button")];
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && doc.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && doc.activeElement === last) {
        e.preventDefault();
        first.focus();
      } else if (!box.contains(doc.activeElement)) {
        e.preventDefault();
        first.focus();
      }
    }
  }
  next.addEventListener("click", () => {
    if (i === STEPS.length - 1) return close();
    i += 1;
    paint();
    next.focus();
  });
  skip.addEventListener("click", close);
  veil.addEventListener("click", (e) => e.target === veil && close());
  doc.addEventListener("keydown", onKey, true);
  paint();
  doc.body.append(veil);
  next.focus();
  return close;
}

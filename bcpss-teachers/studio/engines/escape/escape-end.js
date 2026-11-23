// The final door, the debrief and the reflection for the escape challenge.
import { h } from "../../core/dom.js";
import { reflectionBlock } from "../engine-core.js";
import { debrief } from "./escape-logic.js";

const btn = (label, cls, onclick, attrs = {}) =>
  h("button", { type: "button", class: `st-btn ${cls}`, onclick, ...attrs }, label);

export function renderDoor({ ctx, activity, session, onOpen }) {
  const { door, rooms } = activity;
  const title = (id) => rooms.find((r) => r.id === id).title;
  const input = h("input", {
    class: "st-esc-input st-esc-code",
    type: "text",
    autocomplete: "off",
    autocapitalize: "characters",
    spellcheck: "false",
    "aria-label": "Door code",
    id: "st-esc-door-code",
  });
  const msg = h("p", { class: "st-esc-msg", role: "status" });
  const heading = h("h2", { class: "st-esc-room-title", tabindex: "-1" }, door.title);
  const attempt = () => {
    const r = session.checkDoor(input.value);
    if (r.ok) {
      onOpen();
      return;
    }
    if (!input.value.trim())
      msg.textContent = "Type the pieces you found, in the order the keeper's note gives.";
    else if (r.orderOnly)
      msg.textContent =
        "All the pieces are there, but they are not in the order the note gives. Read the note again.";
    else
      msg.textContent = `The lock does not turn. Check the notebook for: ${r.missing.map(title).join(", ")}.`;
  };
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      attempt();
    }
  });
  const order = door.order.map(title).join(", then ");
  const el = h(
    "section",
    { class: "st-esc-room", "aria-labelledby": "st-esc-door-title" },
    heading,
    h("p", { class: "st-esc-narrative" }, door.prompt),
    h(
      "p",
      { class: "st-esc-note-card" },
      h("strong", {}, "The keeper's note: "),
      `Read the pieces in this order: ${order}.`,
    ),
    h(
      "label",
      { class: "st-esc-note", for: "st-esc-door-code" },
      "Your code (spaces, dots and dashes do not matter)",
    ),
    input,
    msg,
    h("div", { class: "st-esc-actions" }, btn("Try the door", "st-btn-primary", attempt)),
  );
  heading.id = "st-esc-door-title";
  return { el, focus: () => heading.focus() };
}

export function renderDebrief({ ctx, activity, records, flags, session, onFinish }) {
  const rows = debrief(
    activity.rooms,
    Object.fromEntries(
      activity.rooms.map((r) => [
        r.id,
        { ...records[r.id], model: flags[r.id]?.model, transfer: flags[r.id]?.transfer },
      ]),
    ),
  );
  const secure = rows.filter((r) => r.secure).length;
  const list = h(
    "ul",
    { class: "st-esc-debrief" },
    rows.map((r) =>
      h(
        "li",
        { class: "st-esc-debrief-row", "data-secure": String(r.secure) },
        h("span", { class: "st-esc-badge" }, r.secure ? "Secure" : "Needed support"),
        h("strong", {}, r.concept),
        h("span", { class: "st-esc-room-name" }, ` (${r.title})`),
        h(
          "span",
          { class: "st-esc-used" },
          r.secure
            ? " Solved on the first try with no hints."
            : ` You used ${r.used.join(", ") || "extra tries"}. Practice this idea again.`,
        ),
      ),
    ),
  );
  const ref = reflectionBlock(ctx, activity.reflection);
  const heading = h("h2", { class: "st-esc-room-title", tabindex: "-1" }, "Debrief");
  const el = h(
    "section",
    { class: "st-esc-room", "aria-labelledby": "st-esc-debrief-title" },
    heading,
    h(
      "p",
      { class: "st-esc-narrative" },
      `The door is open. ${secure} of ${rows.length} ideas were secure on the first try. The others are the ones to practice next. Your code was ${session.displayCode()}.`,
    ),
    list,
    h(
      "p",
      { class: "st-esc-note" },
      "This summary is saved on this device without your name. Your teacher can read it from your evidence code.",
    ),
    ref.el,
    h(
      "div",
      { class: "st-esc-actions" },
      btn("Finish and save", "st-btn-primary", () => onFinish(ref.value())),
    ),
  );
  heading.id = "st-esc-debrief-title";
  return { el, focus: () => heading.focus() };
}

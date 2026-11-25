// The reviewer sign-in panel: teacher key, reviewer name and role, and the human attestation.
import { h } from "../../core/dom.js";
import { getKey, getReviewer, setKey, setReviewer } from "./api.js";

const ROLES = [
  ["pedagogy", "Pedagogy"],
  ["language", "Language"],
  ["accessibility", "Accessibility"],
  ["author", "Author"],
  ["admin", "Admin"],
];

const field = (id, label, control) => h("div", { class: "st-field" }, h("label", { for: id }, label), control);

/** True when a key is held and a reviewer name is set. */
export const signedIn = () => Boolean(getKey() && getReviewer().name);

/** The reviewer, as the API wants it. The attestation box must be ticked by the person pressing the button. */
export const reviewerPayload = () => ({ ...getReviewer(), actor: "human" });

/** Sign-in form; `onDone()` runs after a successful save. */
export function gatePanel(onDone) {
  const who = getReviewer();
  const key = h("input", { id: "st-rv-key", type: "password", autocomplete: "off", value: getKey(), required: true });
  const name = h("input", { id: "st-rv-name", type: "text", autocomplete: "name", maxlength: "80", value: who.name, required: true });
  const role = h("select", { id: "st-rv-role" }, ROLES.map(([v, t]) => h("option", { value: v, selected: v === who.role }, t)));
  const human = h("input", { id: "st-rv-human", type: "checkbox", required: true, class: "st-rv-check" });
  const form = h(
    "form",
    { class: "st-rv-panel st-rv-form" },
    h("h2", {}, "Reviewer sign-in"),
    h("p", {}, "Reviews are recorded under your own name. Only a person can approve content; the site refuses any other kind of reviewer."),
    field("st-rv-key", "Site teacher key", key),
    field("st-rv-name", "Your name", name),
    field("st-rv-role", "Your role", role),
    h("p", { class: "st-rv-toggle" }, human, h("label", { for: "st-rv-human" }, "I am the person reviewing this content, and I read it myself.")),
    h("button", { class: "st-btn st-btn-primary", type: "submit" }, "Open the reviewer queue"),
  );
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    setKey(key.value.trim());
    setReviewer({ name: name.value.trim(), role: role.value });
    onDone();
  });
  return form;
}

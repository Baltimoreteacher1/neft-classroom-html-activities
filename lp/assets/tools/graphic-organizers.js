// Graphic Organizer Library: filter by Key Language Use, fill on screen (saved on this device), print one at a time.
import { $, $$, printOnly, store } from "../lib.js";

const cards = $$(".organizer-card");
for (const b of $$("[data-org-filter]")) {
  b.addEventListener("click", () => {
    for (const x of $$("[data-org-filter]")) x.setAttribute("aria-pressed", String(x === b));
    const k = b.dataset.orgFilter;
    for (const c of cards) c.hidden = k !== "All" && c.dataset.klu !== k;
  });
}
for (const field of $$("[data-org-field]")) {
  const key = `org:${field.id}`;
  field.value = store.get(key, "") || "";
  field.addEventListener("input", () => store.set(key, field.value));
}
for (const b of $$("[data-print-org]")) b.addEventListener("click", () => printOnly($(`#org-${b.dataset.printOrg}`)));

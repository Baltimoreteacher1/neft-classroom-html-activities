// Teacher Hub "Go straight to" follows the teacher's role (src/audience.js TEACHER_ROLES): a Classroom teacher sees
// the curriculum language bridges first, an ESOL teacher the WIDA data, practice tests and class tools first. The
// role comes from a home door (?role=esol), or from the "I am a…" menu in the command center (the `th:role` event).
// Order and heading change; no card is ever hidden, so every role still reaches every resource.
import {
  TEACHER_ROLES,
  readTeacherRole,
  rememberTeacherRole,
  roleFromSearch,
} from "../access-practice-lab/src/audience.js";
import { safeJson, storage } from "../access-practice-lab/src/util.js";

const lang = () =>
  safeJson(storage.get("accessPracticeLab:v1:prefs"), {})?.lang === "es" ? "es" : "en";

/** Reorder the cards under `list` (each `li[data-lib-id]`) into `order`; unknown cards keep their place at the end. */
export function orderLibrary(list, order) {
  const items = [...list.querySelectorAll(":scope > li[data-lib-id]")];
  const rank = (li) => {
    const i = order.indexOf(li.dataset.libId);
    return i === -1 ? order.length : i;
  };
  const sorted = [...items].sort((a, b) => rank(a) - rank(b));
  for (const li of sorted) list.append(li);
  return sorted.map((li) => li.dataset.libId);
}

export function applyRole(doc, roleId = readTeacherRole()) {
  const role = TEACHER_ROLES.find((r) => r.id === roleId) || TEACHER_ROLES[0];
  const section = doc.getElementById("thLibrary");
  const list = section?.querySelector(".th-lib-grid");
  if (!list) return [];
  const es = lang() === "es";
  const title = doc.getElementById("thLibraryTitle");
  const lead = doc.getElementById("thLibraryLead");
  if (title && role.heading) title.textContent = role.heading[es ? 1 : 0];
  if (lead && role.lead) lead.textContent = role.lead[es ? 1 : 0];
  section.dataset.role = role.id;
  return orderLibrary(list, role.library || []);
}

export function mountHubRole(doc = document) {
  const asked = roleFromSearch(doc.defaultView?.location?.search || "");
  if (asked) rememberTeacherRole(asked);
  applyRole(doc, asked || readTeacherRole());
  doc.addEventListener("th:role", (e) => applyRole(doc, e.detail?.role));
}

// Audience memory: which hub this device last used (teacher, student or family), so every lab page can offer one
// consistent "Back to <Hub>" link in the breadcrumb row. Per-device convenience only: no identity, no account,
// never sent anywhere. The key is part of the shared navigation contract (~/lp-nav/BRIEF.md).
import { BASE, storage } from "./util.js";

export const AUDIENCE_KEY = "accessPracticeLab:v1:audience";
export const AUDIENCE_IDS = Object.freeze(["teacher", "student", "family"]);

/** The three hubs. Paths are the bare hub routes; the grade (when there is one) is added by the link builder. */
export const HUBS = Object.freeze({
  teacher: { path: "/access-teacher/", label: ["Back to Teacher Hub", "Volver al Centro docente"] },
  student: {
    path: `${BASE}/students`,
    label: ["Back to Student Hub", "Volver al Centro de estudiantes"],
  },
  family: {
    path: `${BASE}/family-start`,
    label: ["Back to Family Hub", "Volver al Centro familiar"],
  },
});

/** Lab views that ARE a hub: entering one remembers its audience. The Teacher Hub (access-teacher/) writes its own. */
const HUB_VIEWS = Object.freeze({ students: "student", "family-start": "family" });

export const audienceForView = (view) => HUB_VIEWS[view] || "";

export function readAudience(read = (key) => storage.get(key)) {
  const value = read(AUDIENCE_KEY);
  const audience = audienceRecord(value).audience;
  return AUDIENCE_IDS.includes(audience) ? audience : "";
}

export function rememberAudience(audience, write = (key, value) => storage.set(key, value)) {
  if (!AUDIENCE_IDS.includes(audience)) return false;
  const raw = typeof storage !== "undefined" ? storage.get(AUDIENCE_KEY) : "";
  const record = audienceRecord(raw);
  return write(
    AUDIENCE_KEY,
    record.role ? JSON.stringify({ audience, role: record.role }) : audience,
  );
}

// Header links (data-audience-link) and home doors (data-audience-door) remember their audience on click, so a hub
// outside the lab app (the Teacher Hub) is remembered even before it loads.
const LINK_AUDIENCE = Object.freeze({
  teachers: "teacher",
  students: "student",
  families: "family",
});
let watching = false;
function watchAudienceLinks(doc = globalThis.document) {
  if (watching || !doc?.addEventListener) return;
  watching = true;
  doc.addEventListener(
    "click",
    (e) => {
      const a = e.target?.closest?.("[data-audience-link], [data-audience-door]");
      if (!a) return;
      // A teacher door names its role (Classroom or ESOL): remember both, so the Teacher Hub opens in that view.
      if (a.dataset.doorRole) rememberTeacherRole(a.dataset.doorRole);
      else rememberAudience(LINK_AUDIENCE[a.dataset.audienceLink] || a.dataset.audienceDoor);
    },
    true,
  );
}

/** Remember the audience when the route is a hub, and watch audience links. Safe to call on every render. */
export function syncAudience(route = {}) {
  watchAudienceLinks();
  const audience = audienceForView(route.view);
  if (audience && readAudience() !== audience) rememberAudience(audience);
}

const samePath = (a, b) => a.replace(/\/+$/, "") === b.replace(/\/+$/, "");

/**
 * The "Back to <Hub>" target for this device, or null when no hub was chosen yet or the page IS that hub.
 * `pathname` defaults to the current location (empty outside a browser, which never matches a hub).
 */
export function hubLink({
  audience = readAudience(),
  pathname = globalThis.location?.pathname || "",
} = {}) {
  const hub = HUBS[audience];
  if (!hub) return null;
  if (samePath(pathname, hub.path)) return null;
  return { audience, href: hub.path, label: hub.label };
}

// A role changes order and emphasis only: nothing is hidden from any role. `order` is the first three Teacher Hub task
// cards; `library` is the order of the hub's "Go straight to" resources (access-teacher/hub-role.js), with its heading.
// Legacy string audience values remain readable.
export const TEACHER_ROLES = Object.freeze([
  {
    id: "classroom",
    title: ["Classroom teacher", "Docente de aula"],
    order: ["find", "plan", "create"],
    heading: ["For your classroom", "Para su aula"],
    lead: [
      "Language supports for the content you teach, then ready activities.",
      "Apoyos de lenguaje para el contenido que enseña y actividades listas.",
    ],
    library: ["bcpss", "card", "activities", "printables", "content", "class", "forms", "tests", "weekly", "data"],
  },
  {
    id: "esol",
    title: ["EL/ESOL teacher", "Docente de EL/ESOL"],
    order: ["plan", "find", "create"],
    heading: ["Your ESOL toolkit", "Sus herramientas de ESOL"],
    lead: [
      "WIDA data, ACCESS practice and your class come first.",
      "Primero los datos WIDA, la práctica ACCESS y su clase.",
    ],
    library: ["data", "tests", "class", "weekly", "card", "activities", "printables", "forms", "content", "bcpss"],
  },
  {
    id: "support",
    title: ["Support staff", "Personal de apoyo"],
    order: ["find", "create", "plan"],
    heading: ["For small groups and support", "Para grupos pequeños y apoyo"],
    lead: ["Ready activities and printables come first.", "Primero las actividades y los impresos listos."],
    library: ["activities", "card", "printables", "class", "forms", "tests", "weekly", "content", "bcpss", "data"],
  },
  {
    id: "coach",
    title: ["Instructional coach", "Asesor de enseñanza"],
    order: ["create", "plan", "find"],
    heading: ["For coaching and planning", "Para asesorar y planificar"],
    lead: [
      "Class data, curriculum bridges and content coverage come first.",
      "Primero los datos de clase, los puentes con el currículo y la cobertura.",
    ],
    library: ["data", "bcpss", "content", "card", "activities", "printables", "tests", "weekly", "class", "forms"],
  },
]);

/** The role a link asks for (`?role=esol` from a home door), or "" when it names none or an unknown one. */
export function roleFromSearch(search = globalThis.location?.search || "") {
  const role = new URLSearchParams(search).get("role") || "";
  return TEACHER_ROLES.some((r) => r.id === role) ? role : "";
}
export function audienceRecord(raw) {
  if (AUDIENCE_IDS.includes(raw)) return { audience: raw, role: "" };
  try {
    const obj = typeof raw === "string" ? JSON.parse(raw) : raw;
    return {
      audience: AUDIENCE_IDS.includes(obj?.audience) ? obj.audience : "",
      role: TEACHER_ROLES.some((r) => r.id === obj?.role) ? obj.role : "",
    };
  } catch {
    return { audience: "", role: "" };
  }
}
export const readTeacherRole = (read = (key) => storage.get(key)) =>
  audienceRecord(read(AUDIENCE_KEY)).role || "classroom";
export function rememberTeacherRole(role, write = (key, value) => storage.set(key, value)) {
  if (!TEACHER_ROLES.some((r) => r.id === role)) return false;
  return write(AUDIENCE_KEY, JSON.stringify({ audience: "teacher", role }));
}
export function roleOrder(cards, role = readTeacherRole()) {
  const first = cards.slice(0, 3);
  const order = TEACHER_ROLES.find((r) => r.id === role)?.order || TEACHER_ROLES[0].order;
  return [...first.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id)), ...cards.slice(3)];
}

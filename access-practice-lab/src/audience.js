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
      if (a) rememberAudience(LINK_AUDIENCE[a.dataset.audienceLink] || a.dataset.audienceDoor);
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

// A role changes card order only. Legacy string audience values remain readable.
export const TEACHER_ROLES = Object.freeze([
  {
    id: "classroom",
    title: ["Classroom teacher", "Docente de aula"],
    order: ["find", "plan", "create"],
  },
  {
    id: "esol",
    title: ["EL/ESOL teacher", "Docente de EL/ESOL"],
    order: ["plan", "find", "create"],
  },
  {
    id: "support",
    title: ["Support staff", "Personal de apoyo"],
    order: ["find", "create", "plan"],
  },
  {
    id: "coach",
    title: ["Instructional coach", "Asesor de enseñanza"],
    order: ["create", "plan", "find"],
  },
]);
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

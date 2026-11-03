// ACCESS ecosystem route registry: the one list of ACCESS surfaces, their section identity and their parents.
// The ecosystem bar, breadcrumbs, footer links and the foundation test all read this file, so a route is
// described once. Paths are load-bearing (bookmarks, Canvas links, saved sessions): never rename one here
// without a redirect and a decision from Joel.
export const ACC_ROUTES = Object.freeze([
  { id: "lab", path: "/access-practice-lab/", audience: "student", parent: null, en: "Practice Lab", es: "Laboratorio de práctica" },
  { id: "assess", path: "/access-practice-lab/assess", audience: "student", parent: "lab", en: "Assessment simulator", es: "Simulador de evaluación" },
  { id: "family", path: "/access-practice-lab/family", audience: "family", parent: "lab", en: "Family Corner", es: "Rincón de la familia" },
  { id: "tour", path: "/access-family-tour/", audience: "family", parent: "family", en: "Family Expedition", es: "Expedición familiar" },
  { id: "adventure", path: "/access-family-expedition/", audience: "family", parent: "family", en: "Family Adventure", es: "Aventura familiar" },
  { id: "teacher", path: "/access-teacher/", audience: "teacher", parent: "lab", en: "Teacher Hub", es: "Centro docente" },
  { id: "expedition", path: "/access-expedition/", audience: "teacher", parent: "teacher", en: "Side Quest", es: "Misión secundaria" },
]);

export const routeById = (id) => ACC_ROUTES.find((r) => r.id === id) || null;

/** Ancestors from the root down to (and including) the route. */
export function trail(id) {
  const out = [];
  for (let r = routeById(id); r; r = r.parent ? routeById(r.parent) : null) out.unshift(r);
  return out;
}

/** The surfaces shown in the ecosystem bar (the primary entry points). */
export const NAV_IDS = Object.freeze(["lab", "assess", "family", "teacher"]);

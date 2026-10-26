/* =============================================================================
 * shared/hub-routes.js — the words and links the weekly hub uses to send a
 * family into a lesson's homework page.
 * -----------------------------------------------------------------------------
 * ONE vocabulary with the lesson page (scripts/homework-guided-notes.mjs,
 * scripts/lib/homework-session-flow.mjs):
 *
 *   - two optional routes, `?route=quick|full`, each with a time RANGE
 *     (never a countdown). Quick Practice is the default and the recommended
 *     route (data/product-decisions.json, family-homework-route-choices, Joel,
 *     2026-10-26); Keep Going carries every item;
 *   - the product is "Family Math Studio" / "Estudio familiar de matemáticas";
 *     its routes are "Quick Practice" and "Keep Going", so the page name and a
 *     route name are never the same word;
 *   - `?route=core` (the retired third route) opens Keep Going, as on the page;
 *   - a lesson taught over two nights is "Session 1: Concept Launch", then
 *     "Session 2: Compare & Apply". `-part2` stays the URL word and is never
 *     shown to a family.
 *
 * Pure functions — no DOM, no fetch.
 * ========================================================================== */

export const PRODUCT_NAME = Object.freeze({
  en: "Family Math Studio",
  es: "Estudio familiar de matemáticas",
});

/** Default route first: the order a family is offered them in. Words and times match the lesson page. */
export const ROUTES = Object.freeze({
  quick: Object.freeze({
    minutes: "5–10",
    label: { en: "Quick Practice", es: "Práctica rápida" },
  }),
  full: Object.freeze({
    minutes: "20–30",
    label: { en: "Keep Going", es: "Seguir practicando" },
  }),
});
export const DEFAULT_ROUTE = "quick";
export const SECONDARY_ROUTES = Object.freeze(["full"]);

export const SESSION_LABELS = Object.freeze({
  1: Object.freeze({ en: "Session 1: Concept Launch", es: "Sesión 1: Lanzamiento del concepto" }),
  2: Object.freeze({ en: "Session 2: Compare & Apply", es: "Sesión 2: Comparar y aplicar" }),
});

/* Lessons that have a Session 2 family page (`/lessons/<id>-part2/`). The
 * canonical list is `partTwo` in data/curriculum-launch-manifest.json; the
 * browser cannot afford that 445 KB file, so family-connections.test.mjs proves
 * this copy equals it AND that every page exists on disk. */
export const SESSION_TWO_LESSONS = Object.freeze(
  "1-3 1-4 1-5 2-1 2-2 2-3 2-4 2-5 2-6 2-7 2-8 2-9 2-10 2-11 2-12 3-1 3-2 3-3 3-4 3-5 3-6 3-7 3-8 3-9 3-10 4-1 4-2 4-3 4-4 4-5 5-1 5-2 5-3 5-4 5-5 5-6 5-7 5-8 5-9 5-10 6-1 6-2 6-3 6-4 6-5 6-6 6-7 6-8 6-9 6-10 6-11 6-12 6-13 6-14 6-15 7-1 7-2 7-3 7-4 7-5 7-6 7-7 7-8 7-9 8-1 8-2 8-3 8-4 8-5 8-6 8-7 9-1 9-2 9-3 9-4 10-1 10-3".split(
    " ",
  ),
);
const SESSION_TWO = new Set(SESSION_TWO_LESSONS);

/** The Session 2 page of a core lesson. */
export const sessionTwoPath = (id) => `/lessons/${id}-part2/homework.html`;

/**
 * Which session each posted night is, from the order the lessons were posted.
 * A core lesson with a Session 2 page is Session 1 the first time it appears in
 * the week and Session 2 the next time; anything else is not a session at all.
 * `assignments` is in calendar order; returns 1, 2 or null for each.
 */
export function sessionsForWeek(assignments) {
  const seen = new Map();
  return assignments.map((item) => {
    const id = String(item?.id ?? "");
    if (!SESSION_TWO.has(id)) return null;
    const count = seen.get(id) ?? 0;
    seen.set(id, count + 1);
    return count === 0 ? 1 : 2;
  });
}

/**
 * A homework link. `route` is omitted for pages that have no routes (an
 * end-of-unit review); `lang` only when the family chose a language, so a page
 * a family never touched still falls back to its own saved choice.
 */
export function homeworkHref(path, { route = "", lang = "", sectionId = "" } = {}) {
  const params = new URLSearchParams();
  if (route) {
    if (!Object.hasOwn(ROUTES, route)) throw new RangeError(`unknown homework route "${route}"`);
    params.set("route", route);
  }
  if (lang === "en" || lang === "es") params.set("lang", lang);
  if (sectionId) params.set("section", sectionId);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

/** "20–30 min" — one place for the unit word. */
export const minutesLabel = (route) => `${ROUTES[route].minutes} min`;

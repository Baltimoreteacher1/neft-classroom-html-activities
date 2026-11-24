// Hand-authored lesson companions (source: "authored"). A unit listed here overrides the generated drafts.
// Each file: db/seeds/bcpss/v2/lessons-authored/<unitId>.mjs -> export default { version: 1, unit_id, source: "authored", lessons: [...] }.
export const AUTHORED_LOADERS = {
  "g3-ela-u1": () => import("./lessons-authored/g3-ela-u1.mjs"),
  "g6-math-u2": () => import("./lessons-authored/g6-math-u2.mjs"),
  "g8-sci-u1": () => import("./lessons-authored/g8-sci-u1.mjs"),
};

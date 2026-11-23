// Vocabulary Academy · offline strategy (documented in access-practice-lab/VOCAB-ACADEMY.md).
//
//   At install        the app code and styles (hashed, via tools/sync-access-shell.mjs) and the SMALL content files:
//                     content/vocab-academy/index.json, morphology.json and every g<G>/grade.json. Unit files are
//                     deliberately NOT in the install or background lists (see UNIT_FILE there): 237 unit files would
//                     be several MB nobody asked for.
//   On use            a unit file the learner opens is saved by the worker's network-first rule, so a unit seen once
//                     opens offline.
//   On request        "Save this unit for offline" / "Save this grade for offline" send the unit URLs to the worker's
//                     existing `cache-urls` pack (src/offline-pack.js savePack). Packs live in their own cache that a
//                     deploy never clears and can be removed again.
import { CONTENT_BASE, unitFile } from "../contract.js";
import { canSavePacks, formatBytes, packStatus, removePack, savePack } from "../../offline-pack.js";

const slug = (g) => String(g).toLowerCase().replace(/[^a-z0-9]/g, "");
const pad = (n) => String(n).padStart(2, "0");

export const unitPackName = (grade, n) => `va-g${slug(grade)}-u${pad(n)}`;
export const gradePackName = (grade) => `va-g${slug(grade)}-all`;

/** Files one unit needs offline beyond the always-installed index. */
export const unitPackUrls = (grade, n) => [unitFile(grade, n), `${CONTENT_BASE}/index.json`];

/** Every published unit of a grade (n values from the index) plus the grade file. */
export const gradePackUrls = (grade, unitNumbers = []) => [
  `${CONTENT_BASE}/g${grade}/grade.json`,
  ...unitNumbers.map((n) => unitFile(grade, n)),
  `${CONTENT_BASE}/index.json`,
];

export { canSavePacks, formatBytes, packStatus, removePack, savePack };

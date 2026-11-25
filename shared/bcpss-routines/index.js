// Routine blocks: the ONE registry of authored teaching blocks that the Studio tab shows and the export pipeline prints.
// A block says where its data lives (paths), who it is for, which print part carries it, and how to turn the data into
// neutral nodes (nodes.js). Nothing here renders markup. Renderers: bcpss-teachers/routines/ (screen) and
// functions/_lib/bcpss/studio-doc-routines.js (print and Word). G-13 reads `registeredPaths()`; G-61..G-63 prove that
// every registered datum reaches the rendered page.
import { CHECK_BLOCKS } from "./check.js";
import { LISTEN_BLOCKS } from "./listen.js";
import { TALK_BLOCKS } from "./talk.js";

export const FAMILIES = [
  {
    id: "talk",
    title: "Talk and partner work",
    note: "Students speak and listen; nothing to prepare.",
  },
  {
    id: "listen",
    title: "Listen, build, fix",
    note: "Dictogloss, sentence ladder and Language Doctor.",
  },
  { id: "check", title: "Check and reteach", note: "Retrieval, rubric, redirects and routines." },
];

export const ROUTINE_BLOCKS = [...TALK_BLOCKS, ...LISTEN_BLOCKS, ...CHECK_BLOCKS];
export const BANDS = ["1_2", "3_4", "5_6"];

const empty = (v) =>
  v == null ||
  v === "" ||
  (Array.isArray(v) && !v.length) ||
  (typeof v === "object" && !Array.isArray(v) && Object.values(v).every(empty));

/** Blocks that have data for this unit, in registry order. */
export const blocksFor = (detail) => ROUTINE_BLOCKS.filter((b) => !empty(b.source(detail)));

/** Every print part the export endpoint must accept, with the block and view it prints. */
export function routineParts() {
  const out = new Map();
  for (const b of ROUTINE_BLOCKS) {
    out.set(b.part, { block: b, view: b.audience === "student" ? "student" : "teacher" });
    if (b.keyPart) out.set(b.keyPart, { block: b, view: "teacher" });
  }
  return out;
}
export const isRoutinePart = (part) => routineParts().has(part);
export const ROUTINE_PART_IDS = [...routineParts().keys()];

/** Nodes for one block at one band; `view` is "student" (sheet, no answers) or "teacher" (full). */
export function buildBlock(block, detail, band = "3_4", view = "teacher") {
  const src = block.source(detail);
  if (empty(src)) throw new Error(`routine "${block.id}" has no data for this unit`);
  return block.build(src, BANDS.includes(band) ? band : "3_4", view, detail);
}

/** path -> block id, for G-13 and the coverage matrix. Array paths use the `[]` form the matrix uses. */
export function registeredPaths() {
  const m = new Map();
  for (const b of ROUTINE_BLOCKS) for (const p of b.paths) m.set(p, b.id);
  return m;
}

const isBandMap = (o) =>
  o &&
  typeof o === "object" &&
  !Array.isArray(o) &&
  BANDS.every((k) => k in o) &&
  Object.keys(o).length === 3;

/**
 * Every non-empty string a block's data holds for `band`, minus bookkeeping keys: the independent "expected" side of the
 * render-equals-data gates. Band maps ({1_2,3_4,5_6}) contribute only the selected band.
 */
export function leafStrings(value, band, skip = []) {
  const out = [];
  const walk = (v, key) => {
    if (typeof v === "string") {
      if (v.trim()) out.push({ text: v, key });
    } else if (Array.isArray(v)) for (const x of v) walk(x, key);
    else if (v && typeof v === "object") {
      if (isBandMap(v)) return walk(v[band], key);
      for (const [k, x] of Object.entries(v)) if (!skip.includes(k)) walk(x, k);
    }
  };
  walk(value, "");
  return out;
}

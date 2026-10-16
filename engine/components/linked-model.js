// linked-model.js — ONE relationship, several pictures.
//
// A ratio table, a double number line, a tape diagram, a percent bar and a
// hundred grid are five drawings of the same relationship, and a student who
// meets them in separate lessons reads them as five procedures. This module is
// the single piece of state they can share: a ratio a : b, the scale k the
// student is looking at (a·k : b·k), and how to read a : b (two parts of a
// mixture, or a part out of a whole). A component handed a `model` option
// publishes what the STUDENT changes in it and redraws when another view
// changes the model; a component handed none behaves exactly as it always did.
//
// What lives here, deliberately:
//   • the student's own entries only. The model starts empty, never receives
//     numbers from a lesson config, and holds no answer, no total and no
//     running sum — derived readouts (pairAt, percentOf) are pure functions of
//     what the student typed, tapped or shaded.
//   • no imports. The state, its validation and its derived readings can be
//     proved in plain node, without a DOM.
//
// Echo control: every write carries a `source` token, and a subscriber ignores
// notifications carrying its own token. Writes that change nothing never
// notify, so two views cannot bounce an update back and forth.

export const MAX_SCALE = 8;
export const MAX_TERM = 100;
export const RELATIONS = ["part-part", "part-whole"];

const KEYS = ["a", "b", "k", "relation"];

const round2 = (v) => Math.round(v * 100) / 100;

function validTerm(v) {
  return typeof v === "number" && Number.isFinite(v) && v > 0 && v <= MAX_TERM;
}

/**
 * Validate a candidate state. Returns the normalised state, or null when it is
 * not a state the pictures can draw: a and b are both unset or both positive,
 * the scale is a whole number from 1 to MAX_SCALE, and the relation is known.
 */
function normalize(s) {
  const a = s.a == null ? null : round2(Number(s.a));
  const b = s.b == null ? null : round2(Number(s.b));
  if ((a === null) !== (b === null)) return null;
  if (a !== null && !(validTerm(a) && validTerm(b))) return null;
  if (!Number.isInteger(s.k) || s.k < 1 || s.k > MAX_SCALE) return null;
  if (!RELATIONS.includes(s.relation)) return null;
  return { a, b, k: s.k, relation: s.relation };
}

/**
 * @param {{a?: number|null, b?: number|null, k?: number, relation?: string}} [initial]
 */
export function createLinkedModel(initial = {}) {
  let state = normalize({ a: null, b: null, k: 1, relation: "part-part", ...initial });
  if (!state) throw new RangeError("createLinkedModel: invalid initial state");
  const subscribers = new Set();

  const get = () => ({ ...state });

  /**
   * Merge a patch. Returns true when the state changed; an invalid result is
   * refused whole (the model keeps its last good state) and returns false.
   */
  function set(patch, source = null) {
    const next = normalize({ ...state, ...patch });
    if (!next) return false;
    const changed = KEYS.filter((key) => next[key] !== state[key]);
    if (!changed.length) return false;
    state = next;
    const snapshot = get();
    for (const fn of [...subscribers]) {
      try {
        fn(snapshot, { source, changed });
      } catch (error) {
        console.warn("linked-model: subscriber failed", error);
      }
    }
    return true;
  }

  return {
    get,
    set,
    /** Forget the ratio (the scale and the reading stay). */
    clear: (source = null) => set({ a: null, b: null }, source),
    /** @returns {() => void} unsubscribe */
    subscribe(fn) {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },
  };
}

/** The pair at scale k: the two numbers a·k and b·k, or null before a ratio exists. */
export function pairAt(state, k = state.k) {
  if (state.a == null || state.b == null) return null;
  return { x: round2(state.a * k), y: round2(state.b * k) };
}

/** Columns ×1 … ×steps of the student's ratio — what a table and a line both draw. */
export function columns(state, steps) {
  if (state.a == null) return [];
  return Array.from({ length: steps }, (_, i) => ({ k: i + 1, ...pairAt(state, i + 1) }));
}

/**
 * The percent of the whole that the first quantity is.
 *   part-whole : a is the part and b the whole      → 100·a / b
 *   part-part  : a and b are two parts of a whole   → 100·a / (a + b)
 * Scaling both terms never changes it, which is the point of drawing it.
 */
export function percentOf(state) {
  if (state.a == null || state.b == null) return null;
  const whole = state.relation === "part-whole" ? state.b : state.a + state.b;
  return round2((100 * state.a) / whole);
}

/** Squares of a hundred grid that show that percent (a grid has whole squares only). */
export function shadedSquares(state) {
  const p = percentOf(state);
  return p === null ? null : Math.max(0, Math.min(100, Math.round(p)));
}

/**
 * The ratio a hundred grid with n squares shaded stands for under the current
 * reading, or null when no ratio exists (nothing shaded, or — read as two parts —
 * every square shaded, which leaves the second part empty).
 */
export function ratioForSquares(n, relation) {
  if (!Number.isInteger(n) || n < 1 || n > 100) return null;
  if (relation === "part-whole") return { a: n, b: 100 };
  return n < 100 ? { a: n, b: 100 - n } : null;
}

const gcd = (x, y) => (y ? gcd(y, x % y) : x);

/** a : b in lowest terms, for whole numbers only (never rounds a decimal ratio). */
export function simplestForm(a, b) {
  if (!Number.isInteger(a) || !Number.isInteger(b)) return null;
  const g = gcd(a, b);
  return { a: a / g, b: b / g };
}

/** Number as a student would write it: no trailing zeros, no float noise. */
export function fmt(n) {
  return String(round2(n));
}

// Units whose lessons are about ratios, rates and percents. The tool is offered
// from the lesson's own tool drawer as a supplement, so it never stands in for a
// tool a lesson authored itself.
const LINKED_LAB_LESSON = /^([34])-\d+(?:-|$)/;

/**
 * The linked ratio lab as a supplementary tool block for a Unit 3 or Unit 4
 * lesson config, or null for any other lesson. Reads only the lesson id: it
 * adds a tool, and touches no lesson content.
 */
export function linkedLabToolFor(config) {
  const id = String(config?.lessonId || "");
  const match = LINKED_LAB_LESSON.exec(id);
  if (!match) return null;
  return {
    kind: "linked-lab",
    mode: match[1] === "4" ? "percent" : "ratio",
  };
}

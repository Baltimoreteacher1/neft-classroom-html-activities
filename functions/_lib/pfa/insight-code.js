// Class Insight codes: a student's practice result as a 15-character code with NO name in it.
//
// The student copies the code into Canvas, a form or a chat and the teacher pastes a whole class of
// them into /practice-hub/insights, which decodes them in the browser. Nothing is sent anywhere and
// nothing about the student is in the code: it carries the lesson, the first-try score, the
// confidence rating, which problems to revisit, up to three misconception tags and the spiral
// review result, protected by a CRC-8 so a mistyped code is refused instead of misread.
//
// Layout (version 1, 71 bits, padded to 75 = 15 Crockford base32 characters, shown as XXXXX-XXXXX-XXXXX):
//   ver 3 | unit 4 | lesson 5 | score 5 | total 5 | conf 3 | revisit 16 | mcount 2 | m1 6 | m2 6 | m3 6 | review 2 | crc 8
//
// TAG_LIST is APPEND-ONLY. A code stores a tag as its index here, so reordering or removing an entry
// would make every code already handed in name a different misconception. validate:pfa fails when a
// taxonomy tag is missing from this list or the list has a duplicate; add new tags at the END.

export const TAG_LIST = [
  "algebra-distributive-partial",
  "compare-negative-magnitude",
  "compare-whole-number-bias",
  "coord-xy-swapped",
  "decimal-place-value",
  "division-quotient-missing-zero",
  "equation-answered-with-given-number",
  "equation-not-inverse-operation",
  "exponent-as-multiplication",
  "factorization-stopped-early",
  "factors-multiples-confused",
  "fraction-added-denominators",
  "fraction-no-reciprocal",
  "fraction-straight-across-division",
  "geom-surface-area-as-volume",
  "geom-triangle-area-no-half",
  "geom-volume-added-dimensions",
  "inequality-boundary-inclusion",
  "inequality-direction-flipped",
  "inequality-graph-direction",
  "measure-area-perimeter-swap",
  "op-added-instead-of-multiplied",
  "op-divided-instead-of-multiplied",
  "op-multiplied-instead-of-added",
  "op-multiplied-instead-of-divided",
  "op-reversed-division",
  "op-reversed-subtraction",
  "order-of-operations-left-to-right",
  "pattern-unit-position-miscounted",
  "percent-scale-off-by-100",
  "percent-used-as-whole-number",
  "property-order-vs-grouping",
  "rate-not-per-one",
  "ratio-as-difference",
  "ratio-compared-without-common-basis",
  "ratio-inverted",
  "ratio-scaled-additively",
  "sign-dropped",
  "stat-center-vs-spread",
  "stat-frequency-vs-value",
  "stat-histogram-bin-misread",
  "stat-mean-skewed-by-outlier",
  "stat-mean-vs-median",
  "stat-question-no-variability",
  "stat-range-for-iqr",
  "stat-summed-instead-of-averaged",
];

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford: no I, L, O, U
const CODE_VERSION = 1;
const FIELDS = [
  ["ver", 3],
  ["unit", 4],
  ["lesson", 5],
  ["score", 5],
  ["total", 5],
  ["conf", 3],
  ["revisit", 16],
  ["mcount", 2],
  ["m1", 6],
  ["m2", 6],
  ["m3", 6],
  ["review", 2],
];
const DATA_BITS = FIELDS.reduce((n, [, w]) => n + w, 0); // 63
const CODE_CHARS = 15;

function pushBits(bits, value, width) {
  for (let k = width - 1; k >= 0; k--) bits.push(Math.floor(value / 2 ** k) % 2);
}
function readBits(bits, at, width) {
  let v = 0;
  for (let k = 0; k < width; k++) v = v * 2 + bits[at + k];
  return v;
}
// CRC-8 (polynomial x^8 + x^2 + x + 1) over the data bits, one bit at a time.
function crc8(bits) {
  let c = 0;
  for (const b of bits) {
    const top = ((c >> 7) & 1) ^ b;
    c = (c << 1) & 0xff;
    if (top) c ^= 0x07;
  }
  return c;
}

/**
 * @param {{lessonId:string, score:number, total:number, conf?:number|null, revisit?:number[],
 *   tags?:string[], review?:number}} r  revisit = 1-based problem numbers; tags = misconception ids
 * @returns {string} XXXXX-XXXXX-XXXXX
 */
export function encodeInsight(r) {
  const m = /^(\d{1,2})-(\d{1,2})$/.exec(String(r.lessonId));
  if (!m) throw new Error(`insight code: bad lesson id ${r.lessonId}`);
  const clamp = (v, max) => Math.max(0, Math.min(max, Math.round(Number(v) || 0)));
  const tagIdx = (r.tags || [])
    .map((t) => TAG_LIST.indexOf(t))
    .filter((i) => i >= 0)
    .slice(0, 3);
  let revisit = 0;
  for (const p of r.revisit || []) if (p >= 1 && p <= 16) revisit += 2 ** (p - 1);
  const vals = {
    ver: CODE_VERSION,
    unit: clamp(m[1], 15),
    lesson: clamp(m[2], 31),
    score: clamp(r.score, 31),
    total: clamp(r.total, 31),
    conf: clamp(r.conf, 4),
    revisit,
    mcount: tagIdx.length,
    m1: tagIdx[0] ?? 0,
    m2: tagIdx[1] ?? 0,
    m3: tagIdx[2] ?? 0,
    review: clamp(r.review, 3),
  };
  const bits = [];
  for (const [k, w] of FIELDS) pushBits(bits, vals[k], w);
  pushBits(bits, crc8(bits), 8);
  while (bits.length < CODE_CHARS * 5) bits.push(0);
  let s = "";
  for (let i = 0; i < CODE_CHARS; i++) s += ALPHABET[readBits(bits, i * 5, 5)];
  return `${s.slice(0, 5)}-${s.slice(5, 10)}-${s.slice(10)}`;
}

/** Every code-shaped run in a pasted block of text (names, commas and other text around it are fine). */
export const CODE_RE = /\b[0-9A-Za-z]{5}-[0-9A-Za-z]{5}-[0-9A-Za-z]{5}\b/g;

/**
 * @param {string} code
 * @returns {{ok:true, lessonId:string, score:number, total:number, conf:number|null, revisit:number[],
 *   tags:string[], review:number} | {ok:false, error:string}}
 */
export function decodeInsight(code) {
  const raw = String(code)
    .toUpperCase()
    .replace(/[\s-]/g, "")
    .replace(/[IL]/g, "1")
    .replace(/O/g, "0");
  if (raw.length !== CODE_CHARS) return { ok: false, error: "length" };
  const bits = [];
  for (const ch of raw) {
    const v = ALPHABET.indexOf(ch);
    if (v < 0) return { ok: false, error: "character" };
    pushBits(bits, v, 5);
  }
  const data = bits.slice(0, DATA_BITS);
  if (readBits(bits, DATA_BITS, 8) !== crc8(data)) return { ok: false, error: "checksum" };
  if (bits.slice(DATA_BITS + 8).some(Boolean)) return { ok: false, error: "padding" };
  const v = {};
  let at = 0;
  for (const [k, w] of FIELDS) {
    v[k] = readBits(bits, at, w);
    at += w;
  }
  if (v.ver !== CODE_VERSION) return { ok: false, error: "version" };
  if (!v.unit || !v.lesson || v.score > v.total || v.total === 0 || v.mcount > 3)
    return { ok: false, error: "values" };
  const tags = [v.m1, v.m2, v.m3].slice(0, v.mcount).map((i) => TAG_LIST[i]);
  if (tags.some((t) => !t)) return { ok: false, error: "tag" };
  const revisit = [];
  for (let p = 1; p <= 16; p++) if (Math.floor(v.revisit / 2 ** (p - 1)) % 2) revisit.push(p);
  return {
    ok: true,
    lessonId: `${v.unit}-${v.lesson}`,
    score: v.score,
    total: v.total,
    conf: v.conf || null,
    revisit,
    tags,
    review: v.review,
  };
}

// Activity Studio content model: ONE structured activity that every renderer (interactive player, worksheet,
// Word file, game, quick check) reads. Pure data, no DOM, no imports beyond ids, so the server, the editor, the
// generators and the standalone player bundle can all share it.
//
// An activity is plain JSON:
//   { schema, id, rev, title, description, kind, template, context, supports, look, options, blocks, notes }
// Text fields are plain strings. No HTML is ever accepted: renderers escape everything and apply only the math
// markup in math.js ({3/4}, x^2) plus **bold**. Images are data: URLs (raster only) or same-site paths.

export const SCHEMA_ID = "lp-activity/1";

export const KINDS = Object.freeze(["interactive", "worksheet", "game", "check"]);

/** Templates per kind: a curated few, never a long menu. `id` is stable and stored; labels are for the editor. */
export const TEMPLATES = Object.freeze({
  interactive: [
    { id: "match-sort", en: "Match & Sort", es: "Emparejar y clasificar" },
    { id: "build-explain", en: "Build & Explain", es: "Construir y explicar" },
    { id: "explore-practice", en: "Explore & Practice", es: "Explorar y practicar" },
    { id: "interactive-reading", en: "Interactive Reading", es: "Lectura interactiva" },
  ],
  worksheet: [
    { id: "guided", en: "Guided Practice", es: "Práctica guiada" },
    { id: "independent", en: "Independent Practice", es: "Práctica independiente" },
    { id: "organizer", en: "Visual Organizer", es: "Organizador visual" },
    { id: "reading-writing", en: "Reading & Writing", es: "Lectura y escritura" },
  ],
  game: [
    { id: "quest", en: "Challenge Quest", es: "Misión de desafíos" },
    { id: "match", en: "Match Mission", es: "Misión de parejas" },
    { id: "puzzle", en: "Puzzle Adventure", es: "Aventura de acertijos" },
    { id: "strategy", en: "Strategy Challenge", es: "Desafío de estrategia" },
  ],
  check: [
    { id: "exit-ticket", en: "Exit Ticket", es: "Boleto de salida" },
    { id: "skill-check", en: "Skill Check", es: "Revisión de destreza" },
    { id: "explain-revise", en: "Explain & Revise", es: "Explicar y revisar" },
    { id: "listen-read", en: "Listening or Reading Check", es: "Revisión de escucha o lectura" },
  ],
});

export const STYLES = Object.freeze(["classic", "playful", "calm", "adventure"]);

/** Question formats. Each one is implemented in check.js, the player, the worksheet and the Word export. */
export const FORMATS = Object.freeze([
  "choice", // options[{id,text}], answer: id
  "multi", // options[], answers: [id]
  "match", // pairs[{id,left,right}]
  "sort", // categories[{id,label}], items[{id,text,category}]
  "order", // items[{id,text}] listed in the CORRECT order
  "blank", // text with [[answer|alt]] markers
  "number", // answer, accept[], tolerance, unit, expr (optional, the checked source of the answer)
  "short", // sample, rubric[], kind: "write" | "explain"
  "identify", // text with [[target]] markers; student clicks the targets
  "hotspot", // image {src,alt}, regions[{id,label,x,y,w,h}] in percent, answer: regionId
  "numberline", // min, max, step, answer, tolerance
  "build", // words[] in correct order; accept[] alternate full sentences
  "error", // steps[{id,text}], errorStep: id, fixOptions[{id,text}], fixAnswer: id
  "fillTable", // headers[], rows[][] of strings or {answer}
  "plot", // min, max, points[{x,y}]
]);

export const BLOCK_TYPES = Object.freeze([
  "text",
  "passage",
  "vocab",
  "image",
  "math",
  "table",
  "question",
  "organizer",
  "note",
  "audio",
]);

export const LIMITS = Object.freeze({
  blocks: 80,
  text: 4000,
  title: 120,
  option: 400,
  options: 8,
  items: 24,
  imageBytes: 220 * 1024,
  totalBytes: 480 * 1024,
});

const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;
const BAD_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const ID = /^[a-z][a-z0-9_-]{0,31}$/i;

export const clip = (value, max = LIMITS.text) =>
  String(value ?? "")
    .replace(CONTROL, "")
    .slice(0, max);
export const isId = (id) => typeof id === "string" && ID.test(id);

let counter = 0;
/** A short unique id for a block, option or item. */
export function uid(prefix = "x") {
  counter = (counter + 1) % 1_679_616;
  const rand = Math.floor(Math.random() * 46_656).toString(36);
  return `${prefix}${Date.now().toString(36).slice(-4)}${rand}${counter.toString(36)}`;
}

const SAFE_IMAGE = /^data:image\/(?:png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/;
const SAFE_PATH = /^\/(?!\/)[A-Za-z0-9_\-./%]+$/;

/** An image source that is safe to render: raster data URL or a same-site absolute path, else "". */
export function safeImageSrc(src) {
  const s = String(src ?? "").trim();
  if (s.includes("..")) return "";
  if (SAFE_IMAGE.test(s) && s.length <= LIMITS.imageBytes * 1.4) return s;
  if (SAFE_PATH.test(s) && /\.(?:png|jpe?g|webp|gif|svg)$/i.test(s)) return s;
  return "";
}

const str = (v, max) => clip(v, max).trim();
const list = (v, max = LIMITS.items) => (Array.isArray(v) ? v.slice(0, max) : []);
const num = (v, fallback = 0) => (Number.isFinite(Number(v)) ? Number(v) : fallback);

function cleanOptions(v) {
  return list(v, LIMITS.options).map((o, i) => ({
    id: isId(o?.id) ? o.id : `o${i + 1}`,
    text: str(o?.text, LIMITS.option),
  }));
}
function cleanItems(v, extra = () => ({})) {
  return list(v).map((o, i) => ({
    id: isId(o?.id) ? o.id : `i${i + 1}`,
    text: str(o?.text, LIMITS.option),
    ...extra(o),
  }));
}
const cleanImage = (img) =>
  img && typeof img === "object"
    ? { src: safeImageSrc(img.src), alt: str(img.alt, 300), decorative: img.decorative === true }
    : null;

/** Per-format normalizers: take untrusted input, return only the fields the format defines. */
const QUESTION = {
  choice: (q) => ({ options: cleanOptions(q.options), answer: str(q.answer, 32) }),
  multi: (q) => ({
    options: cleanOptions(q.options),
    answers: list(q.answers, LIMITS.options).map((a) => str(a, 32)),
  }),
  match: (q) => ({
    pairs: list(q.pairs).map((p, i) => ({
      id: isId(p?.id) ? p.id : `p${i + 1}`,
      left: str(p?.left, LIMITS.option),
      right: str(p?.right, LIMITS.option),
    })),
  }),
  sort: (q) => ({
    categories: list(q.categories, 6).map((c, i) => ({
      id: isId(c?.id) ? c.id : `c${i + 1}`,
      label: str(c?.label, 80),
    })),
    items: cleanItems(q.items, (o) => ({ category: str(o?.category, 32) })),
  }),
  order: (q) => ({ items: cleanItems(q.items) }),
  blank: (q) => ({ text: str(q.text), bank: q.bank === true }),
  number: (q) => ({
    answer: str(q.answer, 40),
    accept: list(q.accept, 8).map((a) => str(a, 40)),
    tolerance: Math.max(0, num(q.tolerance)),
    unit: str(q.unit, 20),
    expr: str(q.expr, 200),
  }),
  short: (q) => ({
    sample: str(q.sample),
    rubric: list(q.rubric, 6).map((r) => str(r, 300)),
    kind: q.kind === "explain" ? "explain" : "write",
    minWords: Math.max(0, Math.min(200, num(q.minWords))),
  }),
  identify: (q) => ({ text: str(q.text) }),
  hotspot: (q) => ({
    image: cleanImage(q.image),
    regions: list(q.regions, 10).map((r, i) => ({
      id: isId(r?.id) ? r.id : `r${i + 1}`,
      label: str(r?.label, 80),
      x: num(r?.x),
      y: num(r?.y),
      w: num(r?.w),
      h: num(r?.h),
    })),
    answer: str(q.answer, 32),
  }),
  numberline: (q) => ({
    min: num(q.min),
    max: num(q.max, 10),
    step: num(q.step, 1) || 1,
    answer: str(q.answer, 40),
    tolerance: Math.max(0, num(q.tolerance)),
  }),
  build: (q) => ({
    words: list(q.words, 16).map((w) => str(w, 40)),
    accept: list(q.accept, 6).map((a) => str(a, 300)),
  }),
  error: (q) => ({
    steps: cleanItems(q.steps, () => ({})),
    errorStep: str(q.errorStep, 32),
    fixOptions: cleanOptions(q.fixOptions),
    fixAnswer: str(q.fixAnswer, 32),
  }),
  fillTable: (q) => ({
    headers: list(q.headers, 6).map((h) => str(h, 60)),
    rows: list(q.rows, 12).map((r) =>
      list(r, 6).map((c) =>
        c && typeof c === "object" ? { answer: str(c.answer, 40) } : str(c, 80),
      ),
    ),
  }),
  plot: (q) => ({
    min: num(q.min, -5),
    max: num(q.max, 5),
    points: list(q.points, 8).map((p) => ({ x: num(p?.x), y: num(p?.y) })),
  }),
};

function cleanQuestion(b) {
  const format = FORMATS.includes(b.format) ? b.format : "choice";
  return {
    format,
    prompt: str(b.prompt),
    image: cleanImage(b.image),
    hint: str(b.hint, 400),
    explanation: str(b.explanation, 800),
    frame: str(b.frame, 300),
    misconception: str(b.misconception, 400),
    skill: str(b.skill, 80),
    ...QUESTION[format](b),
  };
}

const BLOCKS = {
  text: (b) => ({
    text: str(b.text),
    role: ["directions", "body", "heading"].includes(b.role) ? b.role : "body",
  }),
  passage: (b) => ({ title: str(b.title, LIMITS.title), text: str(b.text, 12000) }),
  vocab: (b) => ({
    items: list(b.items).map((v, i) => ({
      id: isId(v?.id) ? v.id : `v${i + 1}`,
      term: str(v?.term, 80),
      def: str(v?.def, 300),
      es: str(v?.es, 80),
      example: str(v?.example, 300),
      image: cleanImage(v?.image),
    })),
  }),
  image: (b) => ({ ...cleanImage(b), caption: str(b.caption, 300) }),
  math: (b) => ({ text: str(b.text, 400), caption: str(b.caption, 200) }),
  table: (b) => ({
    headers: list(b.headers, 6).map((h) => str(h, 60)),
    rows: list(b.rows, 20).map((r) => list(r, 6).map((c) => str(c, 80))),
    caption: str(b.caption, 200),
  }),
  question: cleanQuestion,
  organizer: (b) => ({
    kind: ["kwl", "compare", "cause-effect", "claim-evidence", "web", "sequence"].includes(b.kind)
      ? b.kind
      : "web",
    prompts: list(b.prompts, 8).map((p) => str(p, 160)),
  }),
  note: (b) => ({ text: str(b.text, 1200) }),
  audio: (b) => ({ say: str(b.say, 600), label: str(b.label, 80) }),
};

/** Two blocks may never share an id (responses and edits address blocks by id): later duplicates get a fresh one. */
function uniqueIds(blocks) {
  const seen = new Set();
  return blocks.map((b) => {
    if (seen.has(b.id)) b.id = uid("b");
    seen.add(b.id);
    return b;
  });
}

/** Normalize one block from untrusted input, or null when its type is unknown. */
export function cleanBlock(b) {
  if (!b || typeof b !== "object" || BAD_KEYS.has(b.type) || !BLOCK_TYPES.includes(b.type))
    return null;
  return { id: isId(b.id) ? b.id : uid("b"), type: b.type, ...BLOCKS[b.type](b) };
}

const WIDA = [0, 1, 2, 3, 4, 5, 6];

/** Differentiated versions of one activity, in the order a teacher meets them. "" = the grade-level original. */
export const TIERS = Object.freeze(["emerging", "developing", "expanding", "extension"]);

/**
 * Where an activity came from. `family` + `ref` name a platform resource (see adapters/registry.js); the platform
 * original is never edited, so this is only a pointer plus a fingerprint of what was copied (`sourceHash`).
 * `variantOf` is the id of the teacher activity a differentiated version was made from; `tier` says which one;
 * `added` lists block ids the customizer added (so a teacher can see and review them). null = made from scratch.
 */
export function cleanLineage(l) {
  if (!l || typeof l !== "object" || !str(l.family, 40)) return null;
  return {
    family: str(l.family, 40),
    ref: str(l.ref, 120),
    title: str(l.title, LIMITS.title),
    url: SAFE_PATH.test(String(l.url || "")) ? String(l.url) : "",
    sourceHash: str(l.sourceHash, 24),
    variantOf: isId(l.variantOf) ? l.variantOf : "",
    tier: TIERS.includes(l.tier) ? l.tier : "",
    added: list(l.added, LIMITS.blocks).filter(isId),
  };
}

/**
 * A complete, safe activity from untrusted input. Unknown fields are dropped; missing ones get defaults.
 * Never throws; run validateActivity (validate.js) for what the teacher must still fix.
 */
export function normalizeActivity(input) {
  const a = input && typeof input === "object" ? input : {};
  const kind = KINDS.includes(a.kind) ? a.kind : "interactive";
  const known = TEMPLATES[kind].map((t) => t.id);
  const ctx = a.context && typeof a.context === "object" ? a.context : {};
  const sup = a.supports && typeof a.supports === "object" ? a.supports : {};
  const look = a.look && typeof a.look === "object" ? a.look : {};
  const opt = a.options && typeof a.options === "object" ? a.options : {};
  const notes = a.notes && typeof a.notes === "object" ? a.notes : {};
  return {
    schema: SCHEMA_ID,
    id: isId(a.id) ? a.id : uid("a"),
    rev: Math.max(0, Math.floor(num(a.rev))),
    title: str(a.title, LIMITS.title) || "Untitled activity",
    description: str(a.description, 400),
    kind,
    template: known.includes(a.template) ? a.template : known[0],
    context: {
      grade: str(ctx.grade, 8),
      subject: str(ctx.subject, 40),
      curriculum: str(ctx.curriculum, 120),
      unitId: str(ctx.unitId, 80),
      unitTitle: str(ctx.unitTitle, 160),
      unitNumber: Math.max(0, Math.floor(num(ctx.unitNumber))),
      day: str(ctx.day, 160),
      objective: str(ctx.objective, 400),
      // origin tells verified curriculum metadata apart from a teacher's own choice. Never invent "curriculum".
      standards: list(ctx.standards, 12)
        .map((s) => ({
          code: str(s?.code ?? s, 40),
          origin: s?.origin === "curriculum" ? "curriculum" : "teacher",
        }))
        .filter((s) => s.code),
      source: {
        origin: ["curriculum", "teacher", "idea"].includes(ctx.source?.origin)
          ? ctx.source.origin
          : "teacher",
        note: str(ctx.source?.note, 200),
      },
    },
    supports: {
      wida: WIDA.includes(Number(sup.wida)) ? Number(sup.wida) : 0,
      visuals: sup.visuals === true,
      spanish: sup.spanish === true,
      readAloud: sup.readAloud === true,
      frames: sup.frames === true,
      hints: sup.hints !== false,
      chunk: sup.chunk === true,
    },
    look: {
      style: STYLES.includes(look.style) ? look.style : "classic",
      accent: /^#[0-9a-f]{6}$/i.test(look.accent || "") ? look.accent : "",
    },
    options: {
      revise: opt.revise !== false,
      shuffle: opt.shuffle !== false,
      timer: false, // timers are never offered; kept as a stored false so a game cannot quietly add one
      workspace: opt.workspace === "roomy" ? "roomy" : "normal",
      answerKey: opt.answerKey !== false,
    },
    lineage: cleanLineage(a.lineage),
    blocks: uniqueIds(list(a.blocks, LIMITS.blocks).map(cleanBlock).filter(Boolean)),
    notes: {
      teacher: str(notes.teacher, 2000),
      misconceptions: list(notes.misconceptions, 8).map((m) => str(m, 300)),
    },
    createdAt: Math.max(0, num(a.createdAt)),
    updatedAt: Math.max(0, num(a.updatedAt)),
  };
}

export const questionsOf = (activity) => activity.blocks.filter((b) => b.type === "question");

/** Bytes of the JSON form: used for the size caps on save and publish. */
export const sizeOf = (activity) => JSON.stringify(activity).length;

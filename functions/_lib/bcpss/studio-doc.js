// Language Studio print: neutral DOCUMENT MODEL + shared helpers. Single source of truth for layout decisions.
// Renderers (studio-print-html.js now, a Word renderer later) consume this model and make no layout decisions of their own.
//
// A document is:
//   { title, subtitle, unitTitle, early, dense, level, sections: [Section] }
// A section is one logical page (or run of pages):
//   { layout: "portrait"|"landscape", pageBreakBefore?: boolean, bleed?: boolean, blocks: [Block] }
//   bleed: true = full-bleed cover page (no margins, no footer).
//
// Blocks (every block is a plain object with a `type`). `tone` is any palette key (see palette()).
//   band         { number, domain, title, minutes, grouping }          colored activity header: number badge + domain icon + title + meta
//   hero         { tone, kicker, title, subtitle, chips:[str], nameDate:boolean }   cover block (shaded table in Word)
//   heading      { level: 1|2|3, text, tone?, icon? }
//   paragraph    { runs:[Run], size?: "lg"|"sm", align?: "center", mission?: boolean }
//   callout      { tone, label?, icon?, blocks:[Block] }              rounded tinted card
//   lines        { n, label?, fill?:[str] }                           write-on lines; `fill` pre-writes text (answer key)
//   table        { headers?:[Cell], rows:[[Cell]], widths?:[number%], tone?, zebra?, compact? }
//                Cell = string | { runs, tone?, align?, bold?, blocks? }
//   cardGrid     { cols, rows, cut:boolean, cards:[{ blocks:[Block], tone, empty? }] }   cut-out cards (dashed borders); cards fill row-major
//   chips        { items:[str|{text,tone}], label?, cut?:boolean, tone? }   word bank / cut-out chips
//   checklist    { items:[Run[]|str], style:"box"|"bubble", letters?:boolean, mark?:number, notes?:[str] }   mark = filled item index (answer key)
//   columns      { cols:[[Block]], widths?:[number%], rule?:boolean }
//   matchColumns { leftLabel, rightLabel, left:[str], right:[str], answers?:[number] }  dots to draw lines; answers = right index per left row (key)
//   boxRow       { n, label?, values?:[str], size?: "sm"|"md" }       empty answer boxes (values pre-fill)
//   spacer       { h }  (points)
//   footerNote   { text }                                             small muted note at end of a section
//   rule         { tone?, dashed?, icon? }                            horizontal divider (cut line when icon = "scissors")
//
// Runs: string | { t, b?, i?, hl?: tone, gap?: label, blank?: number, fill?: str, icon?: name, small?: true }
//   gap   = a write-in blank from a [bracketed] sentence frame (renders as underline with tiny label)
//   blank = numbered cloze blank; `fill` shows the answer (answer key)

export const DOMAINS = ["Listening", "Speaking", "Reading", "Writing", "Vocabulary", "Game"];

// Print-safe tokens. Hues stay OUTSIDE 255-335 (no violet). `ink` passes AA (>= 4.5:1) on white and on its own `bg`.
export const TOKENS = {
  ink: "#1f2937",
  muted: "#586274",
  rule: "#d5dbe5",
  paper: "#ffffff",
  wash: "#f6f8fb",
  domains: {
    Listening: { ink: "#0b6767", mid: "#17a0a0", bg: "#e2f4f3", icon: "ear" },
    Speaking: { ink: "#b23a28", mid: "#f06a53", bg: "#fdebe6", icon: "speech" },
    Reading: { ink: "#2a449e", mid: "#4d6bd6", bg: "#e7ecfb", icon: "book" },
    Writing: { ink: "#8a5600", mid: "#eea516", bg: "#fff2d3", icon: "pencil" },
    Vocabulary: { ink: "#23703a", mid: "#44a95d", bg: "#e3f4e7", icon: "abc" },
    Game: { ink: "#ad2b53", mid: "#de4a78", bg: "#fde7ee", icon: "game" },
  },
  // Mentor-sentence chunk tones share the domain palette so colors mean one thing everywhere.
  chunkTones: {
    concept: "Reading",
    connector: "Game",
    evidence: "Vocabulary",
    precision: "Writing",
  },
  highlights: { yellow: "#ffe88a", sky: "#bfe7f6", pink: "#facadb", mint: "#c7ecd1" },
  neutral: { ink: "#1f2937", mid: "#8793a6", bg: "#f1f4f8", icon: "star" },
};

export function palette(tone) {
  if (TOKENS.domains[tone]) return TOKENS.domains[tone];
  if (TOKENS.chunkTones[tone]) return TOKENS.domains[TOKENS.chunkTones[tone]];
  if (TOKENS.highlights[tone])
    return {
      ink: TOKENS.ink,
      mid: TOKENS.highlights[tone],
      bg: TOKENS.highlights[tone],
      icon: "star",
    };
  return TOKENS.neutral;
}

export const HIGHLIGHT_ORDER = ["yellow", "sky", "pink", "mint"];

const SUBJECT_TONE = {
  Math: "Reading",
  ELA: "Game",
  Science: "Vocabulary",
  "Social Studies": "Writing",
};
export const subjectTone = (subject) => SUBJECT_TONE[subject] || "Reading";

export const LEVEL_LABEL = { l1_2: "Levels 1–2", l3_4: "Levels 3–4", l5_6: "Levels 5–6" };
// "1_2" | "l1_2" | "level_1_2" -> "l1_2" (defaults to l3_4)
export function levelFromWida(w) {
  const m = String(w || "").match(/([1356])[_-]([2468])/);
  return m ? `l${m[1]}_${m[2]}` : "l3_4";
}

export const KIND_LABEL = {
  match: "Match-up",
  word_sort: "Word sort",
  clue_game: "Clue game",
  cloze: "Fill the gaps",
  unscramble: "Sentence builder",
  sequence: "Put in order",
  quiz: "Quiz",
  error_analysis: "Fix the mistake",
  dictogloss: "Listen & rebuild",
  info_gap: "Partner puzzle",
  talk_cards: "Talk cards",
  read_annotate: "Read & mark",
  sentence_combine: "Link it up",
  write_scaffold: "Write it",
};

// ---- run + block constructors -------------------------------------------------------------------
export const t = (text) => ({ t: String(text ?? "") });
export const b = (text) => ({ t: String(text ?? ""), b: true });
export const i = (text) => ({ t: String(text ?? ""), i: true });
export const hl = (text, tone) => ({ t: String(text ?? ""), hl: tone });

// Turns "The [shape] has [number] faces." into runs with write-in gaps.
export function frameRuns(text) {
  const out = [];
  String(text ?? "")
    .split(/(\[[^\]]+\])/)
    .forEach((part) => {
      if (!part) return;
      if (/^\[[^\]]+\]$/.test(part)) out.push({ gap: part.slice(1, -1) });
      else out.push({ t: part });
    });
  return out;
}

export const B = {
  band: (a) => ({ type: "band", ...a }),
  hero: (a) => ({ type: "hero", ...a }),
  heading: (text, level = 2, extra = {}) => ({ type: "heading", level, text, ...extra }),
  para: (runs, extra = {}) => ({
    type: "paragraph",
    runs: Array.isArray(runs) ? runs : [runs],
    ...extra,
  }),
  callout: (tone, blocks, extra = {}) => ({ type: "callout", tone, blocks, ...extra }),
  lines: (n, extra = {}) => ({ type: "lines", n, ...extra }),
  table: (rows, extra = {}) => ({ type: "table", rows, ...extra }),
  cardGrid: (cards, extra = {}) => ({ type: "cardGrid", cards, cut: true, ...extra }),
  chips: (items, extra = {}) => ({ type: "chips", items, ...extra }),
  checklist: (items, extra = {}) => ({ type: "checklist", items, style: "box", ...extra }),
  columns: (cols, extra = {}) => ({ type: "columns", cols, ...extra }),
  matchColumns: (a) => ({ type: "matchColumns", ...a }),
  boxRow: (n, extra = {}) => ({ type: "boxRow", n, ...extra }),
  spacer: (h = 10) => ({ type: "spacer", h }),
  footerNote: (text) => ({ type: "footerNote", text }),
  rule: (extra = {}) => ({ type: "rule", ...extra }),
};

export const section = (blocks, extra = {}) => ({
  layout: "portrait",
  pageBreakBefore: true,
  blocks,
  ...extra,
});

// ---- deterministic shuffling (stable output; never equal to the input order) ---------------------
function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(text) {
  let h = 2166136261;
  for (const ch of String(text)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

export function shuffled(arr, seed = 1) {
  const a = arr.map((v, idx) => ({ v, idx }));
  const rnd = mulberry(hashSeed(String(seed)));
  for (let n = a.length - 1; n > 0; n--) {
    const j = Math.floor(rnd() * (n + 1));
    [a[n], a[j]] = [a[j], a[n]];
  }
  if (a.length > 1 && a.every((x, n) => x.idx === n)) a.push(a.shift());
  return a;
}

// ---- unit facts ----------------------------------------------------------------------------------
export const isEarlyGrade = (unit) => ["K", "1", "2"].includes(String(unit?.grade));
export const gradeLabel = (unit) =>
  String(unit?.grade) === "K" ? "Kindergarten" : `Grade ${unit?.grade}`;

export function newDoc(detail, opts, sections, extra = {}) {
  const unit = detail.unit;
  return {
    title: `${unit.unit_title}${extra.titleSuffix || ""}`,
    subtitle: `${gradeLabel(unit)} ${unit.subject} · ${unit.curriculum_name}`,
    unitTitle: unit.unit_title,
    early: isEarlyGrade(unit),
    dense: Boolean(extra.dense),
    bodyClass: extra.bodyClass || "",
    level: opts.level,
    answerKey: Boolean(opts.answerKey),
    sections,
  };
}

// Splits cards into pages of cols*rows. `mirror` reverses each row (the back side of a duplex sheet).
export function paginateCards(cards, { cols, rows, mirror = false }) {
  const per = cols * rows;
  const pages = [];
  for (let s = 0; s < cards.length; s += per) {
    const slice = cards.slice(s, s + per);
    while (slice.length < per) slice.push({ blocks: [], tone: "neutral", empty: true });
    if (mirror) {
      for (let r = 0; r < rows; r++) {
        const row = slice.slice(r * cols, (r + 1) * cols).reverse();
        slice.splice(r * cols, cols, ...row);
      }
    }
    pages.push(slice);
  }
  return pages;
}

export const termList = (studio) => (studio.vocab || []).map((v) => v.term);
export const cap = (s) =>
  String(s ?? "")
    .charAt(0)
    .toUpperCase() + String(s ?? "").slice(1);

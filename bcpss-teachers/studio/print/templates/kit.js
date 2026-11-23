// Shared template kit: input normalisation, language-support banks, and small block recipes.
// Templates are pure: (ctx) -> { pages, key?, notes }. Nothing here touches the DOM.
import { GRADE_LABEL, SUBJECT_PROFILE, TIERS, bandOf } from "../../data/taxonomy.js";
import { pageGeometry, styleFor } from "../style.js";
import { B, page } from "../ir.js";

export class NeedsContent extends Error {
  constructor(message) {
    super(message);
    this.name = "NeedsContent";
  }
}

/** Frames per Key Language Use and support level. Original wording; blanks are underscores. */
export const FRAMES = {
  Narrate: {
    ee: ["First, ______.", "Then, ______.", "I see ______."],
    dev: ["First, ______. Then, ______.", "Finally, ______.", "At the end, ______."],
    exp: ["At the beginning, ______. After that, ______ because ______.", "The most important moment was ______."],
    br: ["Before ______, ______; as a result, ______.", "The turning point came when ______, which led to ______."],
  },
  Inform: {
    ee: ["This is a ______.", "It has ______.", "It can ______."],
    dev: ["A ______ is a ______ that ______.", "One important detail is ______."],
    exp: ["______ is a kind of ______ that can ______ and has ______.", "Another important fact is ______ because ______."],
    br: ["One important characteristic of ______ is ______, which means ______.", "Unlike ______, ______ is ______."],
  },
  Explain: {
    ee: ["It happens because ______.", "This shows ______.", "First ______, then ______."],
    dev: ["______ happens because ______.", "I know this because ______."],
    exp: ["When ______, ______ happens because ______.", "This is important because ______."],
    br: ["As a result of ______, ______; this demonstrates that ______.", "The relationship between ______ and ______ is ______ because ______."],
  },
  Argue: {
    ee: ["I think ______.", "I agree.", "I disagree."],
    dev: ["I think ______ because ______.", "I agree with ______ because ______."],
    exp: ["I believe ______ because ______. For example, ______.", "One reason is ______. Another reason is ______."],
    br: ["Although ______, the evidence suggests ______ because ______.", "A strong counterargument is ______; however, ______."],
  },
};

/** Subject-specific discourse frames (what mathematicians, scientists and historians actually say). */
export const SUBJECT_FRAMES = {
  math: {
    ee: ["I count ______.", "The answer is ______.", "I used ______."],
    dev: ["I ______ because ______. So the answer is ______.", "The numbers ______ and ______ are ______."],
    exp: ["First I ______. Then I ______ because ______. This works because ______.", "My answer makes sense because ______."],
    br: ["I know my strategy works because ______; I can check it by ______.", "The relationship between ______ and ______ is ______, so ______."],
  },
  science: {
    ee: ["I see ______.", "I think ______ will happen.", "The ______ moved."],
    dev: ["I observed ______. I think it happened because ______.", "My claim is ______."],
    exp: ["My claim is ______. The evidence is ______. This shows that ______.", "When ______ changed, ______ also changed."],
    br: ["The data indicate that ______; therefore ______ because ______.", "An alternative explanation could be ______, but ______."],
  },
  "social-studies": {
    ee: ["This is a ______.", "People ______.", "It happened ______."],
    dev: ["The source says ______. This shows ______.", "I think the author wants us to ______."],
    exp: ["According to the source, ______. This suggests ______ because ______.", "The author's point of view is ______ because ______."],
    br: ["The source reveals ______, although ______; its purpose appears to be ______.", "Comparing the two sources, ______ differs from ______ in that ______."],
  },
  ela: {
    ee: ["The text says ______.", "I read ______.", "The character is ______."],
    dev: ["The text says ______. This tells me ______.", "The character feels ______ because ______."],
    exp: ["In the text, ______ shows that ______ because ______.", "The author uses ______ to show ______."],
    br: ["The author develops ______ through ______, which suggests ______.", "The evidence ______ supports the idea that ______ because ______."],
  },
};
export const framesFor = (ctx, tier, klu) => {
  const set = SUBJECT_FRAMES[ctx.subject]?.[tier] || [];
  return [...(FRAMES[klu || "Explain"][tier] || []), ...set];
};

export const TIER_SUPPORT = {
  ee: { label: "Entering / Emerging", frames: 3, bank: true, note: "Picture support, a word bank, full sentence frames and an oral-rehearsal step before writing." },
  dev: { label: "Developing", frames: 2, bank: true, note: "A word bank and sentence frames with fewer blanks; pictures where they carry meaning." },
  exp: { label: "Expanding", frames: 2, bank: false, note: "Sentence starters only; students choose their own precise words." },
  br: { label: "Bridging / Reaching", frames: 1, bank: false, note: "No frames. A precision checklist asks students to use academic language accurately." },
};
export const tierLabel = (t) => TIERS.find((x) => x.id === t)?.short || t;

const ES_LABELS = { name: "Nombre", date: "Fecha", word: "Palabra", definition: "Definición", example: "Ejemplo", draw: "Dibuja", answer: "Respuesta", words: "Palabras" };
export const label = (ctx, key, en) => (ctx.bilingual && ES_LABELS[key] ? `${en} / ${ES_LABELS[key]}` : en);

const str = (v) => (v == null ? "" : String(v));
const clip = (s, n) => (s.length > n ? `${s.slice(0, n - 1).trim()}...` : s);

export function normalizeEntry(e) {
  const es = e.es && e.es.verified === true && e.es.word ? { word: str(e.es.word), def: str(e.es.def) } : null;
  return {
    id: str(e.id || e.word),
    word: str(e.word),
    pos: str(e.pos),
    pron: str(e.pron),
    def: str(e.def),
    visual: e.visual || null,
    context: str(e.context),
    nonExample: str(e.nonExample),
    sentence: str(e.academicSentence),
    everyday: str(e.everyday),
    es,
    esUnverified: !!(e.es && e.es.verified !== true),
    related: e.related || [],
    morph: e.morphology?.parts || [],
    misconception: str(e.misconception),
    practice: e.practice || {},
  };
}

function answerText(it, choices) {
  let a = it.answer;
  if (typeof a === "number" && Array.isArray(choices) && it.type === "choice" && choices[a] != null) a = choices[a];
  return str(a);
}
export function normalizeItems(lesson) {
  if (!lesson) return [];
  const keyItems = lesson.answerKey?.items || {};
  const out = [];
  const take = (src, list) =>
    (list || []).forEach((it, i) => {
      if (!it?.prompt) return;
      const choices = Array.isArray(it.choices) ? it.choices.map(str) : [];
      out.push({
        id: str(it.id || `${src}-${i + 1}`),
        src,
        prompt: str(it.prompt),
        answer: answerText(it, choices),
        explain: str(keyItems[it.id] || it.explain || it.hint),
        hint: str(it.hint),
        type: it.type || (choices.length ? "choice" : "short"),
        choices,
        supports: it.supports || {},
        visual: it.visual || it.supports?.ee?.visual || null,
      });
    });
  take("guided", lesson.guided);
  take("independent", lesson.independent?.items);
  take("formative", lesson.formative?.items);
  take("exit", lesson.exitTicket?.items);
  return out;
}

export function makeCtx(input = {}) {
  const grade = String(input.grade || input.lesson?.grade || input.vocab?.grade || "6").toUpperCase();
  const band = bandOf(grade) || "6-8";
  const subject = input.subject || input.lesson?.subject || input.vocab?.subject || "interdisciplinary";
  const lesson = input.lesson || null;
  const vocab = input.vocab || null;
  const wanted = input.entryIds?.length ? input.entryIds : lesson?.vocab?.ids;
  let raw = vocab?.entries || lesson?.vocab?.entries || [];
  if (wanted?.length && vocab?.entries) raw = raw.filter((e) => wanted.includes(e.id));
  const entries = raw.filter((e) => e?.word).map(normalizeEntry);
  const items = normalizeItems(lesson);
  const tiers = (input.tiers?.length ? input.tiers : ["dev"]).filter((t) => TIER_SUPPORT[t]);
  const title = str(input.title || lesson?.title || vocab?.title || input.topic || "");
  const standards = [...new Set([...(lesson?.standards || []), ...(vocab?.standards || [])])];
  const ctx = {
    grade,
    gradeLabel: GRADE_LABEL[grade] || `Grade ${grade}`,
    band,
    style: styleFor(band),
    subject,
    profile: SUBJECT_PROFILE[subject] || SUBJECT_PROFILE.interdisciplinary,
    lesson,
    vocab,
    entries,
    items,
    title,
    topic: str(input.topic || title),
    objective: str(lesson?.contentObjective),
    langObjective: str(lesson?.languageObjective),
    standards,
    tiers: tiers.length ? tiers : ["dev"],
    multiTier: tiers.length > 1,
    vis: ["full", "key", "none"].includes(input.visual) ? input.visual : "full",
    bilingual: input.lang === "bilingual",
    opts: input.options || {},
    k2: band === "k-2",
    klu: lesson?.wida?.klus?.[0] || { math: "Explain", science: "Explain", "social-studies": "Argue", ela: "Inform" }[subject] || "Explain",
  };
  ctx.geom = pageGeometry(input.format);
  // Usable body area in mm: page minus margins, running header/footer and a safety band.
  ctx.bodyW = ctx.geom.wMm - 2 * ctx.geom.marginMm;
  ctx.bodyH = ctx.geom.hMm - 17 - 16 - 6;
  ctx.pic = (spec, role = "main") => (ctx.vis === "full" || (ctx.vis === "key" && role === "main") ? spec || null : null);
  ctx.frames = (tier, n = TIER_SUPPORT[tier].frames) => (tier === "br" ? [] : framesFor(ctx, tier, ctx.klu).slice(0, n));
  ctx.eachTier = (build) =>
    ctx.tiers.flatMap((t) => build(t).map((pg) => ({ ...pg, tag: ctx.multiTier ? tierLabel(t) : "" })));
  ctx.need = (what, msg) => {
    if (what === "entries" && !entries.length) throw new NeedsContent(msg || "This resource needs vocabulary. Pick a lesson or a vocabulary set that has words.");
    if (what === "items" && !items.length) throw new NeedsContent(msg || "This resource needs practice items. Pick a lesson that has guided or independent items.");
  };
  return ctx;
}

/** Rough line count for text of `pt` size in a box `wMm` wide (average glyph = 0.52 em). Used to pick what fits a card. */
export const estLines = (text, wMm, pt) => Math.max(1, Math.ceil((String(text).length * pt * 0.52 * 0.3528) / Math.max(10, wMm)));
export const lineMmOf = (pt) => pt * 0.3528 * 1.38;

/** Grid for n cut-apart cards on the page: portrait is 2 wide, landscape wider. Returns { cols, rows, cw, ch }. */
export function cardGrid(ctx, n, tip = 8) {
  const land = ctx.geom.orientation === "landscape";
  const cols = land ? Math.min(4, Math.max(2, Math.ceil(n / 2))) : 2;
  const rows = Math.ceil(n / cols);
  return { cols, rows, cw: ctx.bodyW / cols, ch: Math.floor((ctx.bodyH - tip) / rows) - 1 };
}

export const esCoverage = (entries) => ({ total: entries.length, verified: entries.filter((e) => e.es).length });
export const chunk = (list, n) => Array.from({ length: Math.ceil(list.length / n) }, (_, i) => list.slice(i * n, (i + 1) * n));
export const blanks = (n = 1) => Array.from({ length: n }, () => "______").join(" ");

/** Name bar + title + one direction line: the top of almost every student page. */
export function top(ctx, title, direction, sub = "") {
  return [
    B.namebar(ctx.k2 ? [label(ctx, "name", "Name")] : [label(ctx, "name", "Name"), label(ctx, "date", "Date")]),
    B.title(title, sub),
    direction ? B.p(direction, "direction") : null,
  ].filter(Boolean);
}

/** The frames + word bank a support level earns, as blocks. Rigor never changes; access does. */
export function supportBlocks(ctx, tier, { bankWords = [], klu } = {}) {
  const spec = TIER_SUPPORT[tier];
  const out = [];
  if (spec.bank && bankWords.length) out.push(B.bank(bankWords.slice(0, 10), label(ctx, "words", "Word bank")));
  const fr = klu ? framesFor(ctx, tier, klu).slice(0, spec.frames) : ctx.frames(tier);
  if (fr.length) out.push(B.frames(fr, "Sentence frames"));
  else out.push(B.check(["I used the exact vocabulary words.", "I gave a reason or evidence.", "I checked that my answer makes sense."]));
  return out;
}

/** Estimated height in mm of the blocks supportBlocks returns (word bank + frames or checklist). Errs high. */
export function supportMm(ctx, blocks) {
  const pt = ctx.style.bodyPt;
  const lh = lineMmOf(pt);
  let mm = 0;
  for (const b of blocks) {
    if (b.type === "bank") {
      const perWord = b.words.reduce((a, w) => a + w.length * pt * 0.52 * 0.3528 + 9, 0) + 24;
      mm += Math.ceil(perWord / ctx.bodyW) * (lh + 5) + 6;
    } else if (b.type === "frames") mm += 9 + b.items.reduce((a, t) => a + estLines(t, ctx.bodyW, pt) * lh + ctx.style.lineMm + 2, 0);
    else mm += 10 + (b.items?.length || 3) * (lh + 2);
  }
  return mm;
}

export const wordsOf = (ctx) => ctx.entries.map((e) => e.word);

export const keyTable = (rows, head = ["#", "Answer", "Why"], cols = [0.6, 2.2, 4]) =>
  B.table({ cols, head, rows, accentHead: true });

/** `layout` overrides the default key table: { head, cols }. */
export function keyPages(ctx, title, rows, extra = [], layout = {}) {
  const per = 12;
  const parts = chunk(rows, per);
  return parts.map((r, i) =>
    page([B.title(`Answer key: ${title}`, parts.length > 1 ? `Part ${i + 1} of ${parts.length}` : ""), keyTable(r, layout.head, layout.cols), ...(i === 0 ? extra : [])]),
  );
}

export { B, page, clip };

/** Writing-line rows that fill what is left of the page: (page body - fixed top/bottom) / rows, at least `min`. */
export function fillLines(ctx, reservedMm, rows, min = 2, max = 14) {
  const lines = Math.floor((ctx.bodyH - reservedMm) / rows / ctx.style.lineMm);
  return Math.max(min, Math.min(max, lines));
}
/** Top block height in mm (name bar + title + direction), by band. */
export const topMm = (ctx) => (ctx.k2 ? 66 : 56);

/** Two-column [label | space] rows used by most organizers. */
export const labelRows = (labels, h) => labels.map((l) => [{ t: l, kind: "label" }, { t: "", h }]);

/** Per-row cell padding plus borders of a `.st-x-table` row, in mm, and the gap between blocks. */
export const ROW_PAD_MM = 4.8;
export const BLOCK_GAP_MM = 4;

/**
 * Lay out an organizer page: `before` blocks, one table whose row height scales to the space left, `after` blocks,
 * then the support blocks (word bank + frames or checklist). If the supports cannot fit under the table at its
 * minimum row height, the table keeps the whole first page and the supports move to a page of their own.
 *   fixedMm  height of everything on the page except the table rows and the supports (top block, before, after, table head)
 *   makeTable(lines) -> the table block for rows of `lines` writing lines
 */
export function organizerPages(ctx, { before = [], after = [], fixedMm, rows, makeTable, support = [], min = 2, max = 14, spillTitle = "Supports" }) {
  const lineMm = ctx.style.lineMm;
  const fit = (reserveMm) => Math.floor((ctx.bodyH - fixedMm - reserveMm - rows * ROW_PAD_MM - 5) / rows / lineMm);
  const supportH = support.length ? supportMm(ctx, support) + BLOCK_GAP_MM : 0;
  const inline = fit(supportH);
  if (inline >= min || !support.length) {
    const lines = Math.max(min, Math.min(max, inline));
    return [page([...before, makeTable(lines), ...after, ...support])];
  }
  const lines = Math.max(min, Math.min(max, fit(0)));
  return [
    page([...before, makeTable(lines), ...after]),
    page([...top(ctx, spillTitle, "Use these supports as you write.", "Supports"), ...support]),
  ];
}

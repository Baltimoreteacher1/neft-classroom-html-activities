// Template registry and document builder. buildDocument(templateId, input) -> doc (see ir.js).
import { LANGUAGE_NOTE, SUBJECT_PROFILE, TIERS } from "../data/taxonomy.js";
import { B, finalize, page, section } from "./ir.js";
import { CARD_TEMPLATES } from "./templates/cards.js";
import { FOLDABLE_TEMPLATES } from "./templates/foldables.js";
import { NeedsContent, esCoverage, estLines, lineMmOf, makeCtx, TIER_SUPPORT } from "./templates/kit.js";
import { ORGANIZER_TEMPLATES } from "./templates/organizers.js";
import { SHEET_A_TEMPLATES } from "./templates/sheets-a.js";
import { SHEET_B_TEMPLATES } from "./templates/sheets-b.js";

export { NeedsContent, esCoverage };

const LANDSCAPE = new Set(["kwl", "foldable-accordion"]);
export const TEMPLATES = [...CARD_TEMPLATES, ...ORGANIZER_TEMPLATES, ...FOLDABLE_TEMPLATES, ...SHEET_A_TEMPLATES, ...SHEET_B_TEMPLATES].map((t) => ({
  ...t,
  orientation: LANDSCAPE.has(t.id) ? "landscape" : "portrait",
  subjects: t.subjects || null,
}));
export const FAMILIES = [...new Set(TEMPLATES.map((t) => t.family))];
export const templateById = (id) => TEMPLATES.find((t) => t.id === id) || null;

/** Templates for a grade band, recommended-for-subject first. Nothing is hidden; unsuited ones are flagged. */
export function templatesFor({ band, subject } = {}) {
  return TEMPLATES.filter((t) => !band || t.bands.includes(band))
    .map((t) => ({ ...t, recommended: !t.subjects || !subject || t.subjects.includes(subject) }))
    .sort((a, b) => Number(b.recommended) - Number(a.recommended));
}

export const optionDefault = (opt, band) => (opt.default && typeof opt.default === "object" ? opt.default[band] : opt.default);
export const defaultOptions = (tpl, band) => Object.fromEntries((tpl.options || []).map((o) => [o.id, optionDefault(o, band)]));

const subjectLabel = (id) => SUBJECT_PROFILE[id]?.label || id;
const tierNames = (ids) => ids.map((t) => TIERS.find((x) => x.id === t)?.label).join(", ");
const VIS_LABEL = { full: "Pictures with every item", key: "Pictures on key items only", none: "No pictures" };

function coverPage(ctx, tpl, docTitle) {
  const rows = [
    ["Grade", ctx.gradeLabel],
    ["Subject", subjectLabel(ctx.subject)],
    ["Resource", tpl.label],
    ["Language support", tierNames(ctx.tiers)],
    ["Visual support", VIS_LABEL[ctx.vis]],
    ["Languages", ctx.bilingual ? "English and Spanish (verified translations only)" : "English"],
    ...(ctx.standards.length ? [["Standards", ctx.standards.join(", ")]] : []),
  ].map(([a, b]) => [{ t: a, kind: "label" }, { t: b }]);
  return page([
    B.spacer(18),
    B.title(docTitle, tpl.label),
    B.table({ cols: [1, 3], rows, accentHead: false }),
    ctx.objective ? B.p("Content objective", "label") : null,
    ctx.objective ? B.p(ctx.objective, "lead") : null,
    ctx.langObjective ? B.p("Language objective", "label") : null,
    ctx.langObjective ? B.p(ctx.langObjective, "lead") : null,
  ]);
}

const blockMm = (b, ctx) => {
  const lh = lineMmOf(12);
  if (b.type === "p") return estLines(b.text, ctx.bodyW, 12) * lh + 3;
  if (b.type === "list") return b.items.reduce((a, t) => a + estLines(t, ctx.bodyW - 8, 12) * lh + 1.5, 3);
  if (b.type === "table") return b.rows.reduce((a, r) => a + Math.max(...r.map((c) => estLines(c.t || "", ctx.bodyW / r.length - 6, 12))) * lh + 5, 10);
  return 12;
};

function notesPages(ctx, tpl) {
  const blocks = [B.title("Teacher implementation notes", tpl.label), B.h("Purpose", 2), B.p(tpl.notes?.purpose || tpl.blurb)];
  if (tpl.notes?.prep?.length) blocks.push(B.h("Prepare", 2), B.list(tpl.notes.prep));
  if (tpl.notes?.use?.length) blocks.push(B.h("Use", 2), B.list(tpl.notes.use));
  blocks.push(
    B.h("Supports in this copy", 2),
    B.table({ cols: [1.4, 4], head: ["Support level", "What it adds"], rows: ctx.tiers.map((t) => [{ t: TIER_SUPPORT[t].label, kind: "label" }, { t: TIER_SUPPORT[t].note }]) }),
    B.p("Support levels change access to the language (frames, word banks, pictures, oral rehearsal). They never change the mathematics, science or reading task, and the answers are the same at every level.", "quiet"),
  );
  const tn = ctx.lesson?.teacherNotes;
  if (tn?.misconceptions?.length) blocks.push(B.h("Watch for these misconceptions", 2), B.list(tn.misconceptions.map((m) => (typeof m === "string" ? m : m.text || m.misconception || "")).filter(Boolean)));
  if (typeof tn?.differentiation === "string") blocks.push(B.h("Differentiation", 2), B.p(tn.differentiation));
  if (ctx.bilingual) {
    const c = esCoverage(ctx.entries);
    blocks.push(B.h("Spanish in this copy", 2), B.p(`Spanish appears only where a translation is marked verified: ${c.verified} of ${c.total} words. Other words print in English only. Teacher review of the Spanish is still recommended.`));
  }
  blocks.push(B.h("Review status", 2), B.p(`Teacher review recommended before classroom use. ${LANGUAGE_NOTE}`));
  const pages = [];
  let cur = [];
  let used = 0;
  for (const b of blocks) {
    const h = blockMm(b, ctx);
    if (used + h > ctx.bodyH - 30 && cur.length) {
      pages.push(page(cur));
      cur = [B.title("Teacher implementation notes", "continued")];
      used = 24;
    }
    cur.push(b);
    used += h;
  }
  if (cur.length) pages.push(page(cur));
  return pages;
}

function sourceLine(ctx) {
  const src = ctx.lesson?.source || ctx.vocab?.source || "Original - The Language Page";
  const std = ctx.standards.length ? ` Standards: ${ctx.standards.slice(0, 3).join(", ")}${ctx.standards.length > 3 ? "..." : ""}.` : "";
  return `Teacher review recommended. Source: ${src}.${std}`;
}

/** Build a resource document. Throws NeedsContent with a plain message when the chosen data cannot fill the template. */
export function buildDocument(templateId, input = {}) {
  const tpl = templateById(templateId);
  if (!tpl) throw new Error(`Unknown template: ${templateId}`);
  const ctx = makeCtx({ ...input, options: { ...defaultOptions(tpl, makeCtx({ grade: input.grade || input.lesson?.grade }).band), ...(input.options || {}) } });
  if (!tpl.bands.includes(ctx.band)) throw new NeedsContent(`${tpl.label} is not offered for grades ${ctx.band.replace("-", " to ")}.`);
  if (tpl.needs) ctx.need(tpl.needs);
  const built = tpl.build(ctx);
  const docTitle = ctx.title || tpl.label;
  const sections = [];
  if (input.cover) sections.push(section("cover", [coverPage(ctx, tpl, docTitle)]));
  sections.push(section("student", built.pages));
  if (built.key?.length) sections.push(section("key", built.key));
  sections.push(section("notes", notesPages(ctx, tpl)));
  const doc = {
    v: 1,
    template: tpl.id,
    title: docTitle,
    format: { size: ctx.geom.size, orientation: ctx.geom.orientation },
    meta: {
      band: ctx.band,
      grade: ctx.grade,
      subject: ctx.subject,
      tiers: ctx.tiers,
      vis: ctx.vis,
      lang: ctx.bilingual ? "bilingual" : "en",
      standards: ctx.standards,
      lessonId: ctx.lesson?.id || null,
      vocabId: ctx.vocab?.id || null,
      shortTitle: docTitle.length > 60 ? `${docTitle.slice(0, 57)}...` : docTitle,
      sourceLine: sourceLine(ctx),
      review: "authored",
    },
    sections,
    seq: 0,
  };
  return finalize(doc);
}

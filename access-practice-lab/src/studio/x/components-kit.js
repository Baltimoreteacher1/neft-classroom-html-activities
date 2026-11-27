// Shared helpers for the component registry (components*.js). Pure: no DOM, no network, no clock.
// A component is built only from what the studio's model already does (the 15 question formats, the block types, the
// player's game templates). Sample content comes from core/fixtures.js (answers that check out); nothing is invented.

import { ALL_FORMAT_BLOCKS } from "../core/fixtures.js";
import { normalizeActivity, questionsOf, uid } from "../core/schema.js";

/** A teacher-visible string in both languages (the Spanish has not had native review). */
export const T = (en, es) => ({ en, es });
export const pick = (t, lang) => (lang === "es" ? t.es : t.en);
export const KINDS_ALL = ["interactive", "worksheet", "game", "check"];
export const KINDS_PAGE = ["interactive", "worksheet", "check"];

const STARTER = T(
  "Starter example added from the component browser. Replace it with your own content before sharing. Students never see this note.",
  "Ejemplo inicial agregado desde el explorador de componentes. Sustitúyalo con su propio contenido antes de compartir. Los estudiantes nunca ven esta nota.",
);
export const starterNote = (lang) => ({ type: "note", text: pick(STARTER, lang) });

const clone = (v) => structuredClone(v);

/** A fixture question of one format, with a fresh id. Optional field overrides are applied after the clone. */
export function sampleQuestion(format, over = {}) {
  const q = ALL_FORMAT_BLOCKS.find((b) => b.type === "question" && b.format === format);
  if (!q) throw new Error(`no sample question for ${format}`);
  return { ...clone(q), ...over, id: uid("q") };
}
export const sampleBlock = (id) => {
  const b = ALL_FORMAT_BLOCKS.find((x) => x.id === id);
  if (!b) throw new Error(`no sample block ${id}`);
  return { ...clone(b), id: uid(b.type[0]) };
};

/** Blocks with fresh ids (so adding the same component twice never collides). */
export const fresh = (blocks) => blocks.map((b) => ({ ...clone(b), id: uid(b.type[0] || "b") }));

export const blocksOf = (a, type) => (a?.blocks || []).filter((b) => b.type === type);
export const hasQuestions = (a) => questionsOf(a || { blocks: [] }).length > 0;
export const vocabItems = (a) =>
  blocksOf(a, "vocab")
    .flatMap((b) => b.items)
    .filter((v) => v.term.trim() && v.def.trim());

/** A complete, normalized activity used to preview a component and to check it in tests. */
export function miniActivity(title, blocks, extra = {}) {
  return normalizeActivity({
    id: "cbpreview",
    title,
    kind: "interactive",
    template: "explore-practice",
    context: { grade: "", subject: "", source: { origin: "idea", note: "Component preview." } },
    supports: { hints: true },
    blocks,
    ...extra,
  });
}

/** Default properties every component has; `spec` supplies the rest. */
export function define(spec) {
  const c = {
    available: true,
    tags: [],
    defaults: {},
    configurable: [],
    compatibility: { kinds: KINDS_ALL, templates: "any" },
    needs: null,
    ...spec,
  };
  if (c.available) {
    const blocks =
      c.previewBlocks ??
      c.build({ blocks: [] }, { ...c.defaults, lang: "en" }).filter((b) => b.type !== "note");
    c.preview = miniActivity(c.label.en, blocks, c.previewExtra);
  } else c.preview = null;
  return Object.freeze(c);
}

/** A component the engine cannot honestly do: listed with a plain reason, never faked. */
export const unavailable = (id, label, purpose, reason, category = "other") =>
  define({
    id,
    label,
    purpose,
    category,
    available: false,
    reason,
    build: () => [],
    accessibility: T("Not available.", "No disponible."),
    printable: { alternative: "none", note: T("Not available.", "No disponible.") },
  });

/** Starts a short written response the unit can use as its companion question (frame is student-visible). */
export function writtenQuestion(prompt, frame, kind = "explain") {
  return {
    type: "question",
    format: "short",
    kind,
    prompt,
    frame,
    minWords: 0,
    sample: "",
    rubric: [],
  };
}

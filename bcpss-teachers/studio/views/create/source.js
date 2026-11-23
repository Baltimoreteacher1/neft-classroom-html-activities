// Where a resource gets its content: a lesson pack, a vocabulary collection, or only a title.
// Loads through the shared catalog, resolves a lesson's vocabulary set, and turns every failure into a plain message.
import { searchItems } from "../../core/search.js";
import { NeedsContent, buildDocument, templateById } from "../../print/templates.js";
import { buildInput } from "./state.js";

/** Manifest entries of one kind that fit the chosen grade and subject, best matches first. */
export function sourceChoices(items, kind, { grade, subject, q = "" }, limit = 12) {
  const pool = items.filter((i) => i.kind === kind);
  return searchItems(pool, q, { grade: grade || "", subject: subject || "" }).slice(0, limit);
}

/**
 * Load what the chosen source needs. Resolves to { lesson, vocab, entries, error }.
 * `entries` are the vocabulary words a template can print (a lesson's own words, or the whole set).
 */
export async function loadSource(catalog, st) {
  const out = { lesson: null, vocab: null, entries: [], error: "", warning: "" };
  try {
    if (st.source === "lesson" && st.lessonId) {
      out.lesson = await catalog.lesson(st.lessonId);
      const col = out.lesson.vocab?.collection;
      if (col) {
        out.vocab = await catalog.vocab(col).catch(() => null);
        if (!out.vocab) out.warning = "This lesson's vocabulary set could not be loaded.";
      }
      const ids = out.lesson.vocab?.ids;
      const all = out.vocab?.entries || out.lesson.vocab?.entries || [];
      out.entries = ids?.length && out.vocab ? all.filter((e) => ids.includes(e.id)) : all;
    } else if (st.source === "vocab" && st.vocabId) {
      out.vocab = await catalog.vocab(st.vocabId);
      out.entries = out.vocab.entries || [];
    }
  } catch (err) {
    out.error =
      st.source === "vocab"
        ? "That vocabulary set could not be loaded."
        : "That lesson could not be loaded.";
    out.cause = err;
  }
  return out;
}

/**
 * Build the document for the current state, or explain why not.
 * Returns { doc } or { notice: { kind:"info"|"warn", text, action? } }.
 */
export function makeDocument(st, data) {
  const tpl = templateById(st.templateId);
  if (!tpl) return { notice: { kind: "info", text: "Choose a resource type to see it here." } };
  if (!st.grade && !data.lesson && !data.vocab)
    return {
      notice: {
        kind: "info",
        text: "Choose a grade so the resource can be sized for your students.",
      },
    };
  if (data.error) return { notice: { kind: "warn", text: data.error, action: "retry" } };
  const input = buildInput(st, data, tpl);
  if (!input.title && !data.lesson && !data.vocab) input.title = tpl.label;
  try {
    return { doc: buildDocument(tpl.id, input) };
  } catch (err) {
    if (err instanceof NeedsContent)
      return { notice: { kind: "info", text: err.message, action: "pick-content" } };
    return {
      notice: {
        kind: "warn",
        text: "This resource could not be built with these choices. Try different settings.",
        detail: String(err?.message || err),
      },
    };
  }
}

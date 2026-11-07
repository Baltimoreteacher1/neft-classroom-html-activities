import { highlightVocab } from "../vocab.js";

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

// Studio strings are plain bilingual text; escape them before the shared linker adds safe vocab buttons.
export const vocabMarkup = (value) => highlightVocab(escapeHtml(value));

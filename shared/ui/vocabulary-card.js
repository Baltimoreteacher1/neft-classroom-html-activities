// Vocabulary card: a term, its part of speech, a plain definition, an example sentence and optional
// translations. Each translation carries its own lang and dir, so right-to-left scripts render correctly
// inside a left-to-right page and the reverse. Original wording only: callers supply the text.
import { createBadge } from "./badge.js";
import { createButton } from "./button.js";
import { h, uid } from "./h.js";

/**
 * createVocabularyCard({ term, partOfSpeech, definition, example, translations, onSpeak })
 * translations: [{ lang: "es", language: "Spanish", text, dir? }]
 * onSpeak(term): adds a "Hear it" button; the caller owns audio (no external calls here).
 */
export function createVocabularyCard({
  term,
  partOfSpeech,
  definition,
  example,
  translations = [],
  onSpeak,
} = {}) {
  if (!term) throw new Error("createVocabularyCard: term is required");
  if (!definition) throw new Error("createVocabularyCard: definition is required");
  const id = uid("ui-vocab");
  return h(
    "article",
    { class: "ui-card ui-vocab", "aria-labelledby": id },
    h(
      "header",
      { class: "ui-card__head ui-vocab__head" },
      h("h3", { class: "ui-vocab__term", id }, term),
      partOfSpeech ? createBadge({ label: partOfSpeech, tone: "neutral" }) : null,
    ),
    h("p", { class: "ui-vocab__def" }, definition),
    example ? h("p", { class: "ui-vocab__example" }, example) : null,
    translations.length
      ? h(
          "ul",
          { class: "ui-vocab__translations", "aria-label": `${term} in other languages` },
          translations.map((t) =>
            h(
              "li",
              { class: "ui-vocab__translation" },
              h("span", { class: "ui-vocab__language" }, t.language || t.lang),
              h("span", { class: "ui-vocab__text", lang: t.lang, dir: t.dir || "auto" }, t.text),
            ),
          ),
        )
      : null,
    onSpeak
      ? h(
          "div",
          { class: "ui-card__foot ui-no-print" },
          createButton({ label: "Hear it", variant: "secondary", onClick: () => onSpeak(term) }),
        )
      : null,
  );
}

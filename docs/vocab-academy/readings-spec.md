# Vocabulary Academy: Companion Readings (spec)

Every lesson (unit file `g<G>/u<NN>.json`) has one authored passage (Exercise E). A **companion reading** is a second,
original text for the same lesson, in a contrasting genre, that uses the lesson's words in new sentences. The interactive
reader (`src/vocab-academy/reading/`, route `/vocabulary-academy/read`) plays both. One companion reading per lesson,
157 in all (K-8). Auto-checked only: facts, tone and Spanish need a person; list anything doubtful in `editorial.needsReview`.

## File

`access-practice-lab/content/vocab-academy/g<G>/readings/u<NN>.json` (same `<NN>` as the lesson file). Gate:
`node tools/validate-vocab-academy-readings.mjs [--grade G] [--warnings] [--complete]`. The exemplar is
`g4/readings/u01.json`; copy its shape exactly.

```json
{
  "schema": "vocab-academy.reading.v1",
  "unit": "g4-u01", "grade": "4", "n": 1,
  "reading": {
    "id": "g4-u01-r1",
    "genre": "informational",            // contract.js GENRES; contrast the lesson passage's genre
    "title": "What Makes a Strong Team?",
    "purpose": "One line, under 140 characters: why read this.",
    "paras": ["…", "…"],                // same word range as the lesson passage for the grade band
    "words": ["va.ambitious.adj", "…"], // ids of lesson words that occur (inflected forms allowed)
    "listenOnly": false,                // true for K-2, false for 3-8
    "qs": [ { "id": "g4-u01-r1-q1", "skill": "word-meaning", "para": 1, "q": "…", "choices": ["…"], "a": 0, "why": "…" } ],
    "clues": [ { "word": "va.industrious.adj", "para": 1, "type": "definition", "text": "which means they work hard and steadily" } ],
    "retellFrame": "A strong team needs ___ because ___."
  },
  "editorial": { "needsReview": [] }
}
```

## Rules the gate enforces

- **Words.** At least 80% of the lesson's words appear (aim for all of them, naturally, never as a list). Every id in `words`
  is a lesson word that really occurs. Where a word has a taught second sense (`senses`), use that sense once if it fits.
- **Original.** No copied sentences from the lesson passage (5-word phrase overlap under 15%) and nothing from any
  publisher or website. Facts in informational, science, history and biography readings must be true; when unsure, pick a
  safer fact or flag it in `editorial.needsReview`.
- **Length** by band (words): K-2 40-80, 3-5 150-260, 6-8 220-400. K-2 readings are 3-8 short sentences and `listenOnly: true`.
- **Genre contrast.** Prefer: narrative lesson -> informational, description, how-to-style informational, or dialogue;
  informational or science lesson -> narrative, dialogue or a letter-style narrative. Poems only for K-5. `history` and
  `biography` need real, well-known, checkable facts.
- **Questions.** Grades 3-8: 4 questions, 4 choices, one right answer, with at least one `word-meaning` and at least one
  `evidence`, `inference` or `main-idea`. K-2: 2-3 questions, 2-3 choices. Every question has a `para` (0-based paragraph
  where the answer lives) and a `why`. An `evidence` question's right choice is exactly one whole sentence of the text and
  carries `ev: { para, text }` with that sentence (the reader asks the learner to tap the sentence that proves it). Wrong
  choices must be plausible misreadings, as detailed as the right one; vary the right answer's position.
- **Clues** (grades 3-8 need 2 to 4, K-2 optional): the learner finds the context clue for a word. `text` is copied exactly
  from the paragraph at `para`, must not contain the word itself, and the word must appear in that paragraph. `type` is
  `definition`, `example`, `contrast`, `synonym` or `restatement`. Write the clue into the text so it truly explains the word.
- **Retell frame** (grades 3-8): a sentence frame with `___` the learner completes in their own words.
- **Voice.** Clear, warm, age-appropriate, diverse names and settings, no brand names, no frightening or sensitive topics,
  no stereotypes. Sentences follow the shape rules of the lesson passages (`sentenceShape` in the validator).

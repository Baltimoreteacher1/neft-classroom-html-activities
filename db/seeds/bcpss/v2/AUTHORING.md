# BCPSS Language Studio v2 — Authoring Brief

You are writing publisher-grade, student-facing **language activities** for Baltimore City teachers of multilingual learners.
Each unit gets ONE file: `db/seeds/bcpss/v2/units/<unitId>.mjs` → `export default { ...studio }`.
The version-1 content was generated from templates (the unit title pasted into every sentence, "analyze the syntax", jargon).
Version 2 must read like a real publisher wrote it by hand: specific, accurate, vivid, fun, and clear.

## Read first (2 minutes)

1. `db/seeds/bcpss/v2/units/g6-math-u1.mjs` — the **gold-standard exemplar**. Match its depth, voice and specificity.
2. `db/seeds/bcpss/v2/schema.mjs` — the exact schema + validator. It is the contract.
3. `node tools/bcpss-studio-context.mjs <unitId>` — the unit's title, summary, standards, language move and old vocab/reading.

## What a great unit looks like

- **Content-specific.** Every sentence, passage, clue and example uses real facts from the unit topic — real animals, real Maryland/Baltimore history, real fractions, real
  text-evidence tasks. Never paste the unit title into sentences. Never write generic "the unit" language.
- **Accurate.** Math arithmetic, science facts, history dates and names must be correct. Double-check every number. If unsure about a fact, use a safer, well-known one.
- **Language-first.** Each activity trains a _language skill_ inside the content: define, compare, explain a cause, justify with because, sequence with signal words,
  describe with precise adjectives, ask questions, retell, argue with evidence. Use the unit's WIDA move (Argue / Explain / Inform / Narrate).
- **Student-facing and exciting.** Titles are catchy (3–5 words) — "Box Detectives", "Habitat Hunt". The `mission` is ONE sentence speaking to the student
  ("Flip the clues one at a time. Guess the word with as few clues as you can!"). Teacher text is **one short `tip`** only. No teacher scripts, no steps.
- **Games are real games.** Scaffolds never give the answer away. NO timers, no countdowns, no "beat the clock". Wrong answers must teach (use `why`).
- **Plain language.** No jargon: never "warrant", "substantiate", "syntax", "tier 2", "look-fors", "academic term". Say "reason", "proof", "word", "sentence".
- **Never call the learners "ESOL".** Say "multilingual learners" or nothing.
- **Grade-appropriate reading level.** Passages and missions: K = 1–6 word sentences; 1–2 = short simple sentences; 3–4 = clear compound sentences;
  5–6 = academic but friendly; 7–8 = rich academic prose. The validator enforces an average sentence length per grade.
- **K–2 (pre/early readers):** every vocab term needs an `icon` (single emoji). Activities lean on pictures, oral language, and 3–6 word sentences.
  Use `word_sort`, `match`, `clue_game`, `sequence`, `talk_cards`, `dictogloss`, `unscramble` with tiny sentences. Keep passages to 3–5 short sentences.
- **Spanish.** `es` = the real Spanish term used in school (null only if there is no good term). Note cognates and false friends in `es_note`.
  Use correct school Spanish; do not invent words.
- **Variety.** Use at least 8 different `kind`s and all six `domain`s across 12 activities (10–14 allowed). Do not repeat the same shape twice in a row.
  Distinct titles. Vary the content stories (different characters, objects and places).
- **Vocabulary (8–10 terms).** Choose the words students truly need to _talk and write about this unit_: mix Tier 2 (cross-subject academic) and Tier 3 (unit-specific).
  `def` is kid-friendly (never uses the word itself). `example` really uses the word. `nonexample` clears a misunderstanding. `cue` describes a picture a teacher can draw/show.
  Start from the old vocab list but fix or replace anything weak.
- **Local connection.** When natural, anchor content in Baltimore/Maryland (the Inner Harbor, Chesapeake Bay, Fort McHenry, rowhouses, blue crabs, buses on North Avenue,
  school life). Keep it respectful and accurate; never stereotype.
- **Curriculum fidelity.** The unit is from the named curriculum (Wit & Wisdom, Fundations, Reveal Math, SABES 5E, IQWST, Studies Weekly, BCPSS Social Studies).
  Content must match what that unit really teaches (standards are in the context output). Do not reproduce copyrighted passages; write ORIGINAL texts on the topic.

## Payload recipes (see schema.mjs for exact limits)

| kind               | what students do                                  | tips                                                                                                          |
| ------------------ | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `match`            | tap a word, tap its meaning                       | 6–10 pairs; use def/picture clue/cognate/question-answer                                                      |
| `word_sort`        | drag words into 2–3 categories                    | every category used; categories are meaningful ("Parts of a plant" / "What plants need")                      |
| `clue_game`        | reveal clues one by one, guess the word           | exactly 3 clues, easy→hard, never contain the word                                                            |
| `cloze`            | fill gaps from a word bank in a mini-story        | blanks `{1}`…`{n}`; bank has 1–3 extra words                                                                  |
| `unscramble`       | order phrase chunks into a sentence               | 3–9 chunks, first capitalized, last has punctuation; chunks are meaningful phrases                            |
| `sequence`         | put steps in order with signal words              | 4–7 steps; signals like First/Next/Then/Finally                                                               |
| `quiz`             | choose the best word/sentence                     | position of the right answer varies; `why` teaches                                                            |
| `error_analysis`   | choose the best correction                        | errors are _language_ errors in the content: wrong unit, missing reason, wrong word, wrong tense, no evidence |
| `sentence_combine` | join two sentences with a connector               | `model` contains the connector                                                                                |
| `dictogloss`       | listen, jot key words, rebuild                    | 3–6 sentences; `key_words` appear in text; `checks` = ideas to include                                        |
| `info_gap`         | two partners hold different facts, ask & tell     | A's `needs` must be B's `has` keys and vice versa; facts must be consistent                                   |
| `talk_cards`       | partner conversation prompts                      | 5–8 cards, each with a starter and follow-up; plus 3–4 talk moves                                             |
| `write_scaffold`   | structured paragraph with frames, bank, checklist | include a strong `model`                                                                                      |
| `read_annotate`    | read a passage, mark language, answer questions   | `marks[].targets` are exact substrings of `text`                                                              |

## Process (one unit at a time)

1. Run the context command for the unit.
2. Plan the 8–10 words, the mentor sentence and the 12 activity ideas (different kinds/domains/stories).
3. Write `db/seeds/bcpss/v2/units/<unitId>.mjs`.
4. Run `node tools/validate-bcpss-studio.mjs <unitId>` — fix every problem until it prints `0 problems`.
5. Re-read your content once as a teacher AND as a student: Is it accurate? exciting? clear? specific to this unit? Fix weak spots.
6. Move to the next unit. Do not skip the validator.

## Hard rules

- Write ONLY your assigned files under `db/seeds/bcpss/v2/units/`. Do not edit schema, tools, other units, or anything else. No git commands. No network.
- Do not copy the exemplar's content into other units. Every unit is unique.
- `mentor.chunks[].text` joined with spaces must equal `mentor.text` exactly.
- `frames` always contain `[bracketed blanks]`.
- Final reply: list unit ids written and validator result only (≤ 6 lines).

---

# Family guide authoring (second pass, after a unit's studio file exists)

One file per unit: `db/seeds/bcpss/v2/family/<unitId>.mjs` → `export default { summary, vocab, talk, try_at_home, say_it, help, home_language, celebrate }`
(schema + validator: `validateFamily` in `schema.mjs`; run `node tools/validate-bcpss-studio.mjs <unitId>`). Read the unit's studio file first and stay consistent with its
vocabulary, frames and content — the family guide is the home version of the same unit.

Audience: caregivers (many are Spanish-speaking, some do not read English well, and many did not learn this content the way it is taught now).
Tone: warm, respectful, specific, never condescending. Plain language (grade 5 or below). Short sentences. No jargon, no grades, no scores, no "WIDA", no "ESOL".
Strengths-based: the home language is an asset. Never ask the caregiver to teach the content — they ask questions, listen, and let the child teach them.

- `summary`: 2–3 sentences, what your child is learning and why it matters in real life (use a concrete Baltimore-flavored example when natural).
- `goals` (optional but recommended): `{ en:[2-3], es:[same count] }` — "I can" goals in kid language, the family version of the studio `can_do`.
- `vocab`: for EVERY studio vocab term, in the same order: `{ term, def_es, example_es }` — a kid-friendly Spanish definition and a Spanish example sentence.
  Use correct school Spanish (Latin American, not regional slang). Do not invent words; where the English term is a cognate, say so in the definition style naturally.
- `talk`: 4–5 open questions families can ask in ANY language ("¿Cómo lo sabes?"), bilingual `{ en, es }`.
- `try_at_home`: 3–4 hands-on activities using everyday objects (no printing, no devices needed): `{ title:{en,es}, minutes, materials:{en,es}, steps:{en:[3-5], es:[same count]} }`.
  Make them fun and truly connected to the unit content (cooking, grocery store, bus ride, walking the block, sorting laundry, a card game…).
- `say_it`: 3–4 sentence starters the child can practice aloud, with a blank (`[word]` or `___`), bilingual.
- `help`: 3–4 short tips for helping without knowing the content or English: `{ en:[…], es:[…] }` same length.
- `home_language`: one specific suggestion for using the home language for THIS unit (find cognates, tell the story in Spanish first, name objects in both languages) `{ en, es }`.
- `celebrate`: one sentence: what progress looks like at home.
- Spanish: adults addressed in the "ustedes"/neutral form (never "usted"), child lines in "tú". Natural, not literal. Spanish must not be a copy of the English.
- Never put the English and Spanish in one field; always `{ en, es }`.

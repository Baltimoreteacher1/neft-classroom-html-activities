# Teach It Back (`/teach-back`)

A learner shows understanding of a school idea by explaining it to someone else, typed or recorded, grades 3-5 and 6-8.
Early bands (K-3) get the app shell's friendly "made for grades 3-8" gate. Rule-based and local: no network, no AI.

**Flow** (one idea at a time): pick -> learn (idea, key words with Spanish, a drawing when it helps) -> plan (tick the
points you will say; not graded) -> teach (type or record; "Show frames" marks the try SUPPORTED) -> feedback (one
strength, at most one next step, each quoting the learner) -> revise ("what changed", never "longer is better") ->
on my own (a DIFFERENT idea, same subject and band, no frames) -> done (independent and supported tries listed apart).

**Files**: `src/views/teach-back.js` (view, handlers, recorder), `src/teachback/concepts*.js` (data),
`check.js` (pure engine), `session.js` (pure state and rules), `store.js` (one key `accessPracticeLab:v1:teach-back`,
one ledger entry per finished explanation), `ui.js` and `ui-teach.js` (markup), `visuals.js` (inline SVG), `teach-back.css`.
Tests: `node --test tools/teach-back.test.mjs`; browser: `node tools/teach-back-e2e.mjs`.

**Rules** (each pinned by a test): quotes are verbatim slices of the learner's text, else dropped; under 12 words it says
so and makes no sentence-variety claim; never judges accent, dialect, speed, spelling or grammar, never says an idea is
true or false; no score, level, percent, rank, streak or timer; the model answer is shown only after a first try; supported
and independent tries live in separate lists; recordings stay in the device audio store (30 days) and never in the key;
no network calls; tokens only in CSS, no gradients or emoji.

**Add a concept**: append an object to a `concepts-*.js` list: `id`, `band`, `subject`, `title`, `idea` (2-3 sentences, en+es),
`terms` (3-4: `w`, `es`, `gloss`), `points` (exactly 3: `en`, `es`, `accept`, `frame`), `audience`, `modelAnswer.en`, optional
`visual` key from `visuals.js`. `accept` entries: a word, `two words` (adjacent), `a+b` (same sentence), `stem*`; add Spanish
words too. Keep 12 per band and at least two ideas per subject. The test checks the model answer finds all three points,
off-topic text finds none, and the idea card does not repeat the model.

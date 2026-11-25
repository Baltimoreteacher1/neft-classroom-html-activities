# Misconception Detective (`/claim-check`)

A fictional classmate explains an idea and one line is wrong. The learner finds it, sorts evidence from assumption,
picks the correct statement, explains the mistake in a sentence and compares with the accurate idea. Grades 3-5 and
6-8 (`ctx.band`); other bands see a friendly "for grades 3-8" message. Not the Error Detective (`/detective`): that
finds grammar patterns, this one checks IDEAS.

**Flow**: pick a case (chooser by subject, resume card) -> Read (numbered lines, word help EN+ES) -> Find (tap a line;
a wrong tap gets the note about THAT line) -> Sort (evidence / assumption or opinion / not about this idea, radios) ->
Fix (choose the correct statement, write one sentence) -> Reveal (why, flaw kind, correct statement, transfer prompt).
Hint ladder (reread, narrow it down, name the kind of mistake): learner-opened; any opened hint marks the case supported.

**Files**: `src/views/claim-check.js` (render and handlers), `src/claimcheck/parts.js` (markup), `engine.js` (pure
logic), `cases.js` (expands the compact form), `cases-35.js` and `cases-68.js` (the 30 cases), `store.js` (one key,
`accessPracticeLab:v1:claim-check`), `claim-check.css` (tokens only). Tests: `tools/claim-check.test.mjs`,
`tools/claim-check-e2e.mjs`. Finished cases go to the ledger as `src: "claim-check"` (independent when no hint opened).

**Rules** (each is a test): local only, no network or AI, learner text never leaves the device; hints and nudges never
state the flawed line, its number or the correct statement; exactly one flawed line; cards cover all three kinds; the
right answer moves between positions 1-3; Spanish everywhere (tú); every quote shown back is a verbatim slice of what
the learner typed; no score, level, percent, rank, streak, timer, points or stars; tokens only in CSS; 44px targets.

**How to add a case**: append an object to `cases-35.js` or `cases-68.js` (format in the file header): id, subject,
flaw kind (`fact assumption overgeneral cause calc missing`), title, speaker (a fictional first name), 3-6 `lines`
`[en, es, fineEn, fineEs]` (the flawed line has no fine note), `flawed` index, 3-4 `cards` `[e|a|o, en, es, noteEn,
noteEs]` with at least one of each kind, 3 `fix` pairs with `right`, `why`, `accept` idea words, `focus`, `terms`,
`transfer`, and `calc` `[expr, value]` for any arithmetic. Keep `right` balanced and add the independent check for
new arithmetic to the test. Run `node --test tools/claim-check.test.mjs`.

## Assigning and sharing

`/claim-check/<case id>?grades=<band>` opens that case. A teacher assigns one from the class assignment builder
("Explain it"; assignment id `cc-<case id>`); it counts as done once the case is finished. On the reveal step a learner in
a class sees "Share with my teacher", which sends the case title and the reasoning sentence only when pressed.

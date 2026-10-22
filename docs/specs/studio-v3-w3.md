# Studio v3 · W3 — Trap Book, tier-two thinking, worked examples, "Which move?"

Builds on W2 (`studio-v3-w2.md`): the learner model, the bus and the optional-row pattern. Everything stays on the device. Nothing is
timed. A wrong answer never reveals the answer. English and Spanish only.

## W3a — Trap Book and tier two (built)

**Tier two** (`assets/studio/reflect.js`). After a wrong multiple-choice answer whose item offers two or more different named traps,
a skippable row asks "Which sounds most like your thinking?" with the names of up to three of that item's traps (a fixed order that
never depends on the pick, so it never points at "the" answer) and "I guessed". A tap is saved as a *confirmed* trap; nothing is
graded and no answer is revealed. An item that offers only one trap shows nothing. Names come from the page data (authored items) or
`assets/studio-gen/traps.js` (generated items).

**Trap Book** (`assets/studio/trapbook.js`, data in `learner.js`). One record per misconception across every lesson on the device:
`n` (spotted by a wrong answer that names it), `dodged` (a clean answer on an item that offered it, only once it has been spotted),
`since` (the current run of dodges), `confirmed` (tier two), `lessons`, a snapshot of the name and quick fix so the book reads on any
page, and `tamed`. A trap is **Tamed** after three dodges in a row (`TAME_AFTER`); tamed is sticky, the run restarts after a miss, and
`studio:trap` fires once for the toast. The book lists spotted traps (untamed first, then by count) with counts, the quick fix, the
lessons where it came up, and in words how many more clean answers tame it.

## W3b — worked examples with fading (built, `assets/studio/worked.js`)

Derived from the generators, no new authoring: a generated item already carries a computed answer `a`, a hint ladder `h` (steps that
never state the answer) and a full explanation `x` (EN + ES). A **worked example** is a fresh seed of the item's own skill shown as
question + the ladder as numbered steps + `x`, marked "Example, not your problem". **Fading:** example → the same skill with the first
step already shown and the rest as hints → the normal item. Offered first to a skill with no seal; always available as a tool.
Never a formula before the lesson that teaches it (the example uses only the skill's own steps). The example's question always differs from the
student's own (a different seed, redrawn until the text differs), it never changes section progress, and practice after it is not a repair
(only `rp_`/`rd_` redeem items count as repaired in the learner model). Every generator has a two- or three-step ladder and a full
explanation in both languages, so every generated item can show one.

## W3c — "Which move?" (built)

A multiple-choice item (`k: "mc"` plus `work` / `workEs`, 1-5 lines) that shows the work so far and asks for the best next move; the choices
are moves, each wrong move carries a trap tag and a named help line that never names the best move. Because it is an ordinary mc item, tier two, the
Trap Book, the learner model and every content check apply unchanged. Authored per lesson under `moves.practice` / `moves.challenge` in
`data/practice-studio/<id>.json` (all 67 lessons, 134 items), joined to Practice section 3 and Challenge section 4 with the ids `mv-p` / `mv-c`.
`tools/studio-moves.test.mjs` holds the whole fleet: shape, tags, no leak of the best move, real Spanish, and the best move spread 18-32% across A-D.

## Gates

`tools/studio-moves.test.mjs` (all 134 moves items). `tools/studio-learner.test.mjs` (traps: spotted, dodged, tamed once and sticky, confirmed, per lesson).
`validate:studio-enhancements-browser`: on every generated page with a generated item, the offer, the example (a different problem, its steps, the
answer), and the fresh try with step 1 open leave progress untouched; and on every generated page, a wrong pick on an item that offers two traps shows tier two, a tap is
saved as confirmed, and the Trap Book lists the trap; a page whose items offer one trap shows no tier two; three clean dodges tame a trap
(toast, `✓ Tamed` in the book).

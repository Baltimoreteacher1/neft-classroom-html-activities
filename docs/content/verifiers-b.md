# Content verifiers B: cognate, standards, spanish, frames

Prompt 3 Wave 2, worker VB. Pure functions over a unit or a term that report findings. They never edit content.

```
node tools/content/verifiers-b.mjs                    # all four vs tools/content/baselines/*.json
node tools/content/verifiers-b.mjs --only cognate --queue   # also print the cognate human-review queue
node tools/content/verifiers-b.mjs --write-baseline   # ratchet down; refused if any gated count would rise
node tools/content/verifiers-b.mjs --init             # first-time baseline write
node tools/content/standards-coverage.mjs [--out f.md]
node tools/content/spanish-review-export.mjs --unit g6-math-u2 | --terms | --all --out <dir>
npm run validate:content-verifiers-b      npm run test:verifiers-b
```

Exit 0: nothing new against the baseline. Exit 1: new findings. Exit 3: broken gate (a negative control stopped firing, a
sweep fell below its floor, the baseline is missing, a unit failed to load). CI treats 3 as failure.

## Contract

Each `tools/content/verifiers/<name>.mjs` exports `name`, `kinds` (`"unit"` and/or `"term"`), `verify(subject, ctx)` and
`fixtures = { bad: { subject, mustFlag: [codes] }, good: { subject } }`. `standards.mjs` also exports `fixtureRefs`.
Subject: `{ kind: "unit", id, unit, studio, lessons }` (seed record from `data/bcpss-curriculum-seed.mjs`, `loadStudio`,
`loadLessons`) or `{ kind: "term", id, term }` (term bank). Finding: `{ code, severity, path, message, evidence }`.
`ctx` carries reference data: `falseFriends`, `standardsRefs`. `b-common.mjs` holds the shared helpers; the runner is
`tools/content/verifiers-b.mjs`. If worker VA's `verify.mjs` expects another export shape, adapt in one place: the four
`export` lines at the bottom of each verifier.

Order per run: negative control, then sweep, then ratchet. The known-bad fixture must raise every code it lists and the
known-good fixture must raise no error or warn; otherwise exit 3 before any content is judged.

Ratchet: error and warn findings are keyed `code|subjectId` and counted; a key above its committed count is new. info is
reported and never gated. The baseline also stores the examined-subject count and a floor of 90% of it (a sweep that loads
fewer subjects is a broken gate, exit 3).

## Verifiers and finding codes

| Verifier | Code | Severity | Meaning |
| --- | --- | --- | --- |
| cognate | `cognate_marked_false_friend` | error | a term on the curated false-friend list is marked as a cognate (unit note, lesson status, term bank) |
| cognate | `false_friend_as_translation` | error | the Spanish gloss is the deceptive word itself (large = largo) |
| cognate | `cognate_mark_mismatch` | warn | author mark contradicts the classifier at high confidence |
| cognate | `false_friend_not_flagged`, `false_friend_unlisted`, `cognate_low_confidence` | info | teach-the-trap, curation queue, human review queue |
| standards | `standard_invalid_code`, `lesson_standard_invalid_code` | error | wrong family, grade or band, or a domain or number that does not exist |
| standards | `standard_not_in_reference` | error | Grade 6 Math code in none of the repo lists |
| standards | `standard_duplicate`, `standard_untouched`, `activity_no_listed_standard` | warn | duplicate; core standard no lesson lists; lesson sharing no standard with its unit |
| standards | `lesson_standard_not_in_unit`, `standard_no_reference_list` | info | partial extra; shape-only subject |
| spanish | `spanish_english_leakage`, `spanish_placeholder` | error | English function word in Spanish; empty or placeholder |
| spanish | `spanish_length_ratio`, `spanish_copies_english`, `spanish_decimal_inconsistent`, `spanish_register_mixed` | warn | see the file header |
| spanish | `spanish_draft_translation` | info | glosses awaiting fluent review (every gloss today) |
| frames | `frame_malformed`, `frame_band_missing` | error | bracket errors, empty blank; a band with no frames |
| frames | `frame_blank_style`, `frame_no_blank`, `frame_duplicate_band`, `frame_no_vocab_slot`, `frame_band_progression` | warn | see the file header |
| frames | `frame_vocab_unreachable` | info | vocabulary named by no frame |

### Cognate classifier

`classifyPair(en, es)` returns `identical | lookalike | pattern | partial | translation_only` plus a confidence from 0 to 1.
Normalized edit distance after spelling-shift normalization (ph/th/ck/k, soft c, z, y, doubled letters, final vowel), plus the
suffix table `COGNATE_RULES` from `functions/_lib/bcpss/esol-content.js` (the single suffix source: -tion/-cion,
-ity/-idad, -ic/-ico, -ous/-oso, -ble, -al, -ant/-ante ...). Confidence under 0.6 is listed for human review.

### False-friend list

`tools/content/data/false-friends.json`, keyed by English word, every entry `reviewState: "draft"`. The brief said the repo
had ONE existing entry; `FALSE_FRIENDS` in `functions/_lib/bcpss/esol-content.js` actually holds 18. All 18 are carried over
(`source: "existing"`; the test fails if one is missing) and 13 well-known pairs were added (`source: "added"`). A fluent
reviewer must confirm each added pair and change `reviewState`; no tool or model may. The runtime table in esol-content.js
is still a separate copy: pointing it at this file is a follow-up for whoever owns `functions/`.

## Real-content results (committed baselines)

Measured over 162 units and 974 term records (1,136 subjects for cognate and spanish).

- cognate: 2 errors, both lesson newcomer items in g3-ela-u1 (`large = largo`, `eventually = eventualmente`: the deceptive
  word used as the gloss). 46 warns: unit marks that contradict the classifier. Hand-read classes:
  - real mark errors: "not a cognate" on theme/tema, sum/suma, data/datos, vote/voto, cargo/carga, evidence/evidencia,
    present/presente, boycott/boicot; "cognate" on event/suceso, challenge/desafio, shadow/sombra, trade/comercio,
    settler/colono, resolution/desenlace (not look-alikes).
  - false-positive classes: proper names and loanwords (Union, Jim Crow, Dust Bowl, collage, rover); a note that cites a
    different English word than the term (break apart / descomponer, note about decompose); multiword terms where only a modifier is shared.
  - 727 low-confidence items are queued, not gated (`--queue`).
- standards: Grade 6 Math resolves against the repo lists (all codes real). Every other grade and subject has no code list
  (156 units reported `no reference list`); shape only. 5 lessons in g3-ela-u1 list no standard of their unit, and RL.3.2 is
  listed by the unit and by none of its lessons. 26 info items: lessons citing a prerequisite standard outside the unit.
- spanish: 1,136 subjects, all draft translations. 10 length-ratio warns (legit phrase glosses: pun, serf, tile, most) and 1
  copy (digestion = digestión, a true cognate not marked as one). Earlier drafts of the detector flagged "el todo" as a
  placeholder (the Spanish word "todo") and split "0,5" on its comma; both fixed and pinned in the tests.
- frames: all frames are well formed (0 errors). 390 frames have no vocabulary tie (generic connector frames such as "This is
  because [reason]" are the bulk; hand-read), 29 units where a higher band is more supported than the one below, 3 duplicate
  frames across bands.

## Not covered

Spanish inside the English `es_note` prose, family-page Spanish (`data/family-*`, owned by `validate:family-spanish`),
and Spanish for ELA/Science/Social Studies standards text. No standards list was invented for subjects without one.
Lesson activities carry no per-activity standard tag: they inherit their lesson's `standards`.

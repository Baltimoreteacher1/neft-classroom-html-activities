# Content verifiers C: no-manipulatives, duplicates, sensitivity, alt-text

Four read-only verifiers over the 162 BCPSS units (studio content plus lessons), and the publisher that sends the
per-block counts of every verifier to the review queue. They report findings and ratchet them against committed
baselines. They never edit content. Same contract as `docs/content/verifiers-a.md` (registered in
`tools/content/registry.mjs`, run by `tools/content/verify.mjs`, exit 0 / 1 / 3, negative controls, 90% coverage floors).

```
node tools/content/verify.mjs --verifier=<no-manipulatives|duplicates|sensitivity|alt-text> [--unit=<id>] [--json]
node tools/content/publish-verifier-counts.mjs [--check]
npm run test:verifiers-c
npm run validate:content-verifiers-c
npm run validate:content-verifier-counts      # freshness gate for the generated counts module
npm run content:verifier-counts               # regenerate the counts module
```

`--json` prints every finding with its exact path, for example
`node tools/content/verify.mjs --verifier=no-manipulatives --json`.

## 1. no-manipulatives

House rule: paper and pencil only. Flags authored student or teacher text that tells anyone to handle physical objects.

- `MANIP_DIRECTIVE` (error): a clause with a handling verb (use, put, place, line up, stack, build, model, move, arrange,
  sort, fill, cover, "show ... with", "act it out with", roll/spin a die or spinner, ...) and a manipulative noun, with no
  drawing word before the noun, and phrased as an instruction ("Put 4 red cubes on your desk.", "Have children build with rods").
- `MANIP_MATERIAL` (error): an entry of a `materials` list names a manipulative ("Counters", "Base-ten blocks (optional)").
- `MANIP_ACTION_MENTION` (warn): the same pattern in a clause that describes rather than instructs ("I put 7 counters on the ten
  frame.", "a box ... for putting counters").
- `MANIP_MENTION` (info) and `MANIP_DRAWN` (info): not gated. `MANIP_DRAWN` is the allowed paper-and-pencil case: a drawing word
  (draw, sketch, shade, circle, picture, diagram, "on paper", write) appears BEFORE the noun in the same clause.

Strong nouns (cubes, counters, unifix, linking/number/algebra/letter/shape tiles and blocks, base-ten blocks, manipulatives)
always count. Weak nouns (tiles, rods, beans, coins, dice, blocks, chips, beads, ...) count only inside a handling clause and
only in math and science. Quoted text is judged where it is authored, so a mission that quotes a card prompt is not counted
again. Art descriptions (`cue`), word families and terms are skipped.

Measured over all 162 units: 400 error or warn strings in 20 units (180 materials, 151 directives, 99 mentions), 463 info
mentions. The units, with their counts, are in `tools/content/baselines/no-manipulatives.json`: gk-ela-u2, gk-ela-u3 (letter
tiles), gk-math-u1..u5, g1-math-u1..u6, g2-math-u1..u3, g4-math-u1, g6-math-u2 (ratio table cubes, 33 directives),
g7-math-u6 (coin, spinner and number-cube probability), g8-sci-u1 (toy cars loaded with blocks). The earlier seed-file grep
counted about 416 hit lines in 45 files; the difference is that the verifier reads the loaded unit (studio and lessons, one
string per path), skips quoted and look-alike text, and counts a string once per path.

Hand-read false-positive classes (handled by rule): "bean plants", "ice cube", "cubic units", "cube root", "audio button",
"counter and rebut", "counterexample", "building blocks of", "blocks sunlight", "Fundations keyword cards" (paper),
vocabulary art cues, "take away" and "make a ten" (ordinary mathematics words, so `take`, `make`, `get`, `compare` are not
handling verbs). Known imprecision: a definition fragment that starts with a verb ("move some counters to fill a ten frame")
reads as an instruction and is reported as a directive; the probability units that name a coin, spinner or number cube as
the random device are reported as mentions. Whether a paper or on-screen randomizer is acceptable is a policy call, not a
verifier decision.

## 2. duplicates

Content strings are prose strings of 8+ words, minus scaffolds shared on purpose (support, tip, level descriptors, command,
frames, tell frames, move stems, connectors, materials, teacher card, cue, family, label, wida, standards). A string is
**term-bound** when it mentions one of its own unit's vocabulary terms or a content word of the unit title, or has a
curly-quoted span (a stock wrapper with a slot). Term-bound twins are templates with the term filled in; they are counted
as info only. A string that mentions nothing of its own unit is **generic**; generic strings are compared across units by
exact normalized text and by word 2-shingle Jaccard >= 0.8 (MinHash banding finds the candidates).

- `DUP_GENERIC_BOILERPLATE` (warn): the generic string has twins in 3 or more other units (275 strings).
- `DUP_NEAR_IDENTICAL` (warn): twins in 1 or 2 other units (492).
- `LEAK_TEMPLATE_RESIDUE` (error): `[slot]`, `{name}`, `undefined`, `NaN`, `[object Object]` in prose (cloze markers like
  `{1}` pass). 0 in real content.
- `LEAK_TITLE_TEMPLATE` (error): the unit title poured into "cards for ...", "steps from ...", "talk ..." - the
  `cards_for` / `steps_from` / `talk_no_about` bug class of `scripts/audit-bcpss-content.mjs`. 0 in real content, matching
  that script's own zero counts.

False-positive classes: a short task instruction repeated by design ("Say the mentor sentence, then say a new sentence with
the same parts.", in 159 units); two grades defining an everyday word the same way; generic sentences about a card or a clue.
They are reported on purpose so the ratchet stops them spreading; a reviewer decides which deserve a rewrite. Counts are per
unit, so rewriting a string in one unit can move its twins from boilerplate to near-identical in another; regenerate the
baseline with `--update-baseline` after such a rewrite.

## 3. sensitivity (assist only)

Lists text a human reviewer should read. Every flag is a warn that carries the matching phrase. Wordlists are short on purpose.

- `SENS_VIOLENCE_K5`: weapon or violence wording in Kindergarten to grade 5 units (guns, knife, sword, bomb, kill, murder,
  stab, "shoot at a person", "was shot"). War words are not on the list: grade 3-5 history units teach them. One finding per
  distinct text per unit (10 in 2 units, both history readings).
- `SENS_STEREOTYPE`: sweeping claims about a group ("all girls are ...") and loaded terms ("illegal aliens", "oriental",
  "savage"). "All men are created equal" is exempt.
- `SENS_GENDER_ROLE`: a household or work role tied to one gender by a kin or group noun ("Dad fixes", "Mom bakes"). Pronouns
  ("he drives") are characters, not claims, and do not count.
- `SENS_CULTURAL_NARROW`: a holiday, a pork product or a church reference used as a default context in math or science
  problems. ELA and social studies may teach these on purpose and are not flagged.
- `SENS_NAME_SKEW`: names in a unit's math and science text come from a closed list (about 90 given names). Flagged at 12+
  mentions with at most 2 distinct names, or at 20+ mentions with one name above 70% or one gender above 85%. Gender
  comes from the list (f, m, neutral). **Cultural or national origin is never inferred from a name**: that guess is
  unreliable and is itself a bias risk. The finding carries the name tally so a reviewer judges. 13 units today.

False-positive classes: quoted historical text; "shoot" as plant shoots or a basketball (not matched); a single protagonist
in a single-character word problem (reported as skew on purpose, the reviewer decides).

## 4. alt-text and image provenance

Image references are: `media.images[]` entries, objects whose `src`/`url`/`image`/`img`/`file`/`path`/`href` names an image file,
`<img>` tags, vocabulary picture cues, and emoji `icon` fields. The units and lessons carry no inline images today
(`media.images` is `[]` in all 1,584 lessons), so the sweep measures 6,313 picture cues, 0 image references and 18,851
icons, and finds nothing: a clean sweep is a statement about those shapes. The negative-control fixtures exercise the image
checks so they fire the day an image is added.

`ALT_MISSING`, `ALT_EXTERNAL_IMAGE` (any `http(s)://` or `//` image; nothing is fetched from outside the repo) and
`ALT_ICON_ONLY` are errors. `ALT_WEAK`, `ALT_DECORATIVE_HAS_ALT`, `ALT_CUE_THIN` (under 4 words) and `ALT_CUE_DUPLICATE`
(two terms sharing one cue) are warns. `ALT_CUES_CHECKED` is the coverage floor.

## 5. Verifier counts for the review queue

`tools/content/publish-verifier-counts.mjs` runs every REGISTRY verifier (alt-text, arithmetic, duplicates,
no-manipulatives, readability, sensitivity, vocab-tier) and the four B verifiers (cognate, frames, spanish, standards) over
all units, after running each verifier's own negative control (exit 3 if any stopped firing, or if its block-mapping control
fails). An error or warn finding counts against the review block it lives in: a `lessons[i]` path belongs to that
lesson's block, anything else to `<unitId>:studio`. Info findings are not counted.

The result is `functions/_lib/review-generated/verifier-counts.js`, a plain JS module (`export default { verifier: { blockId:
count } }`, zero counts omitted, no repo paths, about 21 KB, 553 blocks with findings), re-exported by
`shared/content-schema/review-verifier-counts.js` as `VERIFIER_COUNTS`. The queue's `verifier` filter and the per-block
`verifierFailures` therefore show real numbers: `GET /api/review/queue?verifier=no-manipulatives`.

`--check` regenerates in memory and compares with the committed file (exit 1 when stale or missing). It is part of
`validate` as `validate:content-verifier-counts`. Any change to unit or lesson content, or to any verifier, can make the
file stale: run `npm run content:verifier-counts` and commit the result.

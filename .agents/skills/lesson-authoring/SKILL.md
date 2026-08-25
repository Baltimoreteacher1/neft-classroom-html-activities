---
name: lesson-authoring
description: Read before writing or editing a lesson — any change to lessons/*/config.json, a new lesson or variant, or edits to warmups, practice items, vocabulary, Learn It or Connect content. Covers the config contract, the pedagogy rules no validator enforces, and which checks to run when you are done.
---

# Authoring a lesson

`lessons/<id>/config.json` is the lesson. The engine renders it — you almost
never touch `engine/` to change what a lesson teaches. Variants live in sibling
folders (`1-1-group1`, `1-1-group2`, `1-1-catchup`) and carry `"variant"`.

A student walks **8 phases** (Warmup, Objectives, Launch, Explore, Practice,
Connect, Reflect, Objectives) plus two tabs, Vocabulary and Learn It. Content
you add lands in one of those; know which before you write it.

## Rules no validator will catch for you

**Never label a student "ESOL."** Zero lesson configs contain that word, and it
stays that way. Level 1 is *support*, Level 2 is *enrichment* — describe what
the work gives a student, never what you assume they lack.

**An activity must not print its own answer.** The recurring failure is a
drag-sort or matching item whose options, in order, spell the solution — or a
worked example that states the result the question is about to ask for. Read
your item as a student who wants to skip thinking: can they?

**Vocabulary comes before the activity that uses it.** A term first met inside a
practice item is a term the student is guessing at.

**Rewrite words, never swap someone's art.** When content must change to fit,
change the text around the figure. Existing images are Joel's; a "better fit"
image is a regression.

## The config contract

- `vocabulary[]` — `term`, `termEs`, `definition`, `definitionEs`, `example`,
  `visual`, `cloze`, `examples`. 167 of the 288 configs with vocabulary mark the
  lesson's headline term `"role": "concept"`; when you add one, follow the
  lesson's existing convention rather than assuming.
- `misconceptionTags[]` on warmup and practice items — 56 of 60 sampled configs
  carry them. A tag is a claim that a specific wrong answer means a specific
  misconception, so tag the DISTRACTOR, not the item. Adding a NEW tag name
  touches roughly ten files across five gated surfaces; grep an existing tag
  first and follow it everywhere it appears.
- Spanish fields (`*Es`) are not optional decoration — `validate:es-parity`
  gates them.

## When you are done

Start with the cheap read-only sweep, then the content gates:

```
npm run health                    # 18 read-only checks, ~6s
npm run validate:math             # arithmetic in what you authored
npm run validate:course           # every quiz answer key
npm run validate:connect          # Connect questions are answerable
npm run validate:concept-intro    # the concept is introduced before it is used
npm run validate:es-parity        # Spanish parity
npm run validate:printables-fresh # printables still match the lesson
```

Then `npm run qa:loop` before shipping — that is the 89-check gate the pre-push
hook runs anyway.

## Two traps that cost real time

**Generated files sit next to authored ones.** `worksheet.html`, `index.html`
and the printables under `lessons/` are build output; editing them is undone by
the next build. See the `generated-files` skill before you edit anything that
is not `config.json`.

**Regenerating can delete content.** The catch-up generator merges "top 2 terms
per lesson" and dropped 56 terms across 20 catch-ups on a re-run. Graft changes
onto committed output rather than regenerating a whole tier.

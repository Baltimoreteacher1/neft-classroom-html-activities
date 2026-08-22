---
name: curriculum-alignment
description: Read when work touches standards, unit or lesson numbering, pacing, prerequisites, scope and sequence, or the hub catalogues — including "align this to the standard", renumbering, or moving a lesson between units. The numbering here has real history and the obvious edit is usually wrong.
---

# Alignment, numbering and the standards graph

## Check before you edit

```
npm run validate:ccss              # 37 distinct standards resolve
npm run validate:scope             # scope & sequence, 84 lessons
npm run validate:unit-placement    # 93 unit-level placements
npm run validate:nervous-system    # 42 standards, 48 prerequisite edges
npm run validate:curriculum-links  # 252 hub lesson links
npm run validate:lesson-catalogues # 3 hub catalogues agree
npm run validate:course            # answer keys
```

All seven are read-only and together take about three seconds — they are in
`npm run health`. Run them BEFORE you change anything, so you know which
failures you inherited.

## Numbering is historical, not logical

**Resource hrefs predate the current table of contents.** Links under
`lessons/<unit>/` may point at legacy numbering on purpose. Re-filing them to
match today's unit numbers breaks live links that work. Confirm against the
catalogue before "fixing" a number that looks wrong.

**id-keyed tables are the hazard in any renumber.** When lesson ids move,
anything keyed by id — sidecars, notes, homework metadata — silently keeps
pointing at the OLD id. A renumber that looks complete in the configs can leave
a sidecar stranded, which surfaces later as a 404 rather than an error.

**A missing sidecar is a 404, not a warning.** Assembled and pre-unit content is
invisible to every layer that iterates a fixed-length lesson list, so it can be
absent for weeks without a gate noticing.

## Standards mapping

`standards-crosswalk` maps district codes to CCSS. Two rules learned the hard
way:

- **A title is not evidence.** Matching lessons to standards by title text has
  produced wrong mappings — `includes("area")` matched "base area" and lumped
  6.GR.2 in with 6.GR.4 across three mappings. Read the lesson's actual work.
- **A standard belongs to the lesson that teaches it**, not the one that
  mentions it. Catch-up and small-group variants inherit their base lesson's
  standard; when they diverge, the variant is usually the thing that is wrong.

## Prerequisites

`validate:nervous-system` holds the prerequisite DAG (42 standards, 48 edges).
Adding a lesson without placing it in that graph means nothing downstream knows
it exists — the graph is what pacing and readiness read.

Adjacency is defined by teaching order, not by number: the lesson before 6-3 is
whatever was actually taught previously, and first teaching wins.

## After a change

Re-run the seven checks above, then `npm run qa:loop`. If a catalogue or hub
link check fails, fix the source of truth (`data/`), not the generated
catalogue — see the `generated-files` skill.

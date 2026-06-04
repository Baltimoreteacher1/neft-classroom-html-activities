# Readiness Pre-Lessons — Design Spec

**Date:** 2026-06-01
**Status:** Approved (pilot-first)
**Author:** Neft Teacher pipeline

## Problem

Many Grade 6 students are several grade levels behind. Each Reveal lesson
(`lessons/N-M/`) assumes prerequisite skills (multiplication fluency, factor
pairs, fraction sense, etc.) that these students lack. The repo already has
**broad** remediation (`math/remediation/unit-r1…r5`, `bridge-to-grade-6/`,
`spiral-review/`) but nothing that targets the **specific** prerequisites the
_next_ lesson needs. The gap is a per-lesson on-ramp.

## Goal

For each of the ~81 lessons, attach a **Readiness Pre-Lesson**: a short,
self-checking on-ramp that diagnoses readiness, re-teaches the 2-3 prerequisite
skills that lesson assumes, and hands the student into the real lesson — plus a
printable practice document for home/print.

## Scope

- **In:** Per-lesson readiness HTML page + printable DOCX practice packet;
  lesson-renderer banner that surfaces the readiness on-ramp; a generator to
  fan out to all 81 lessons after the pilot is approved.
- **Out:** Rewriting existing remediation units; changing lesson content;
  folder reorganization (per repo rule: content edits in place only).

## Approach (approved)

1. **Pilot-first.** Lock the template on lesson **1-2 (6.NS.4, GCF)**, get
   approval, then fan out to all 81 via a generator.
2. **Both formats.** Interactive HTML page (in-class, auto-check) **and** a
   printable DOCX practice packet (print/home, parent-friendly) — matching the
   existing `homework.docx` convention.
3. **Auto-routing diagnostic.** A quick 3-question check routes the student to
   the appropriate support tier (L0 / L1 / L2), with manual override.

## Architecture

### Location (convention-based, co-located with the lesson)

```
lessons/N-M/
  config.json          # add: "readiness": true
  readiness/
    index.html         # the pre-lesson (self-contained static HTML)
    practice.docx       # printable practice packet
```

This mirrors how `notes.html` and `homework.docx` already live beside each
lesson, and how `lesson-renderer.js` derives their URLs by convention.

### Components

1. **Readiness page (`readiness/index.html`)** — self-contained static HTML,
   reusing the existing `math/remediation` template (design tokens, progress
   bar, `checkMC`/`checkNum` interaction JS, print button). Sections:
   - **Hero + "why this matters for this lesson."**
   - **Diagnostic (3 quick items)** → scores → routes to a tier panel:
     - **L0** (most support / IEP): concrete, scaffolded, smallest steps.
     - **L1** (support): guided practice with hints.
     - **L2** (enrichment / on-track): brief warm-up, fast hand-off.
   - **Learn It → Try It (guided) → Practice (independent) → Exit Ticket** for
     the prerequisite skills.
   - **Hand-off CTA** → `/lessons/N-M/` ("You're ready — start the lesson →").
   - No "ESOL" labels; use Level 0/1/2 (per house style).

2. **Practice DOCX (`readiness/practice.docx`)** — printable packet covering the
   same prerequisite skills; tiered sections; answer key on the last page.

3. **Lesson-renderer banner (additive)** — in `renderLaunchHeader`, when
   `config.readiness` is truthy, render a prominent banner above the objectives:
   "📚 Need the basics for this lesson first? Start with the 10-minute Readiness
   check →" linking to `/lessons/${lessonId}/readiness/`. Gated so lessons
   without a readiness page are unaffected.

4. **Generator (post-pilot)** — script that, per lesson: reads `config.json`
   (`standard`, `title`, `vocabulary`), maps the standard to its prerequisite
   feeder skills, fills the readiness template, emits `index.html` +
   `practice.docx`, and sets `config.readiness = true`. Logs any lesson whose
   prerequisites can't be auto-mapped (no silent gaps).

### Prerequisite mapping

Each lesson's `standard` maps to lower-grade feeder skills. Pilot example:
**6.NS.4 (GCF)** → multiplication fluency (3.OA/4.OA), finding all factor pairs
(4.OA.4), divisibility, identifying common factors. The generator uses a
standard→prerequisites table (seeded for Grade 6 Reveal standards).

## Data flow

`config.json` (standard, vocab) → generator → `readiness/index.html` +
`practice.docx` + `config.readiness=true` → renderer shows banner → student
opens readiness → diagnostic routes to tier → practices → hand-off link → lesson.

## Error handling / safety

- Banner is gated on `config.readiness`; missing pages never linked.
- No folder moves/renames; additive files + one additive renderer block only.
- Generator logs unmapped standards instead of emitting placeholder content.
- Work on a feature branch; cherry-pick before push (repo auto-moves refs).

## Testing

- **Pilot:** open `lessons/1-2/readiness/` in a browser — diagnostic routes
  correctly; every `checkMC`/`checkNum` grades correctly; progress bar reaches
  100%; print layout is clean; hand-off link resolves to `/lessons/1-2/`.
- **Renderer:** lesson 1-2 shows the banner; a lesson without `readiness`
  shows no banner (no regression, no 404s).
- **DOCX:** opens in Word; answer key matches the page.

## Success criteria

A student who is behind can, in ~10 minutes before lesson 1-2, find out what
they're missing, practice it at their level, and enter the lesson ready — with
a printable version for home. Template proven and ready to fan out to all 81.

# Editable Google Slides (PPTX) Decks — Design

**Date:** 2026-06-08 · **Decision:** Option **C** (user) — generate `.pptx` AND push to Drive as native Slides

## Goal

Give each lesson an **actual editable Google Slides** deck that meets/exceeds the
5.2 Session reference (TPT-seller quality), in addition to the existing interactive
HTML deck. Committed to the repo, linked on the curriculum, deployed to Pages.

## Approach (chosen: A)

Generate **`.pptx` files** from each `lessons/<id>/config.json` using **PptxGenJS**
(new dependency). `.pptx` opens natively + fully editable in Google Slides
(File → Open / drag to Drive). Committed to repo → deployed to Pages → linked on
curriculum as "Editable Slides (.pptx)". Rejected: native Drive-API decks (live in
Drive, can't be deployed, clutters Drive, re-runs Drive legacy-link pattern we removed).

## Constraint (accepted)

`.pptx`/Slides are **static** — no live HTML widgets (drag-sort, timers, auto-check).
The HTML deck (`slides.html`) remains the interactive version; the PPTX is the
polished, editable, printable companion (sort = cut-out cards, MC = labeled choices,
reveals = sequential build/animation where useful).

## Deck structure (per lesson, from config.json, modeled on 5.2 + exceeding it)

Notebook cover (unit/lesson/standard, I-can + language objective, name/date) →
Be Curious / visual prompt + Notice/Wonder → Bilingual vocabulary (term/ES/def/
example + example-vs-non-example) → Concept + visual model → Guided practice
(I/We/You do) → Two-column method → Sort/partner activity (cut-out cards) →
Error analysis (real worked steps + "The mistake was **_ because _**") → Independent
practice → Choice board → Think-Write-Respond (Because/But/So) → Exit ticket
(tier 1/2 + reflection) → Goal tracker (1–4). Extra slides where the topic needs them.

## Design system (match HTML deck for consistency)

Navy `#17324D` headers, sand `#F7F4EC` bg, teal `#1FA6A2`, amber `#F2C15B`, coral;
Outfit (headings) + Hanken Grotesk (body); 16:9; safe margins; large readable type;
high contrast; bilingual ES italics; per-unit accent palette.

## Build plan

1. Add `pptxgenjs` dep; `scripts/generate-pptx.mjs` (config → deck) + `scripts/lib/pptx-deck.mjs` (reusable slide builders).
2. **Exemplar first:** generate `lessons/1-1/slides.pptx`, QA against 5.2, get sign-off.
3. Scale to all 74; `npm run generate-pptx`.
4. Curriculum: add "Editable Slides (.pptx)" pill next to "Google Slides" (HTML deck).
5. Validate, build, commit, deploy.

## Out of scope (for now)

Native Drive upload (option C) — can add later via Drive MCP if wanted.

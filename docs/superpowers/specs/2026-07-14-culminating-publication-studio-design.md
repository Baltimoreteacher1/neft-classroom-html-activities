# Culminating Project Publication Studio Design

## Purpose

Raise all 22 Grade 6 culminating-project versions to publication-level quality without changing their existing math, navigation, level choices, coaching, save/resume behavior, teacher tools, or answer keys.

## Student Experience

Each existing research block gains an additive Evidence Ledger. Students capture the claim or decision supported by the source, the useful evidence they found, an access date, and a short credibility check. Existing `data-research-find` fields remain the source of truth for the evidence text; the new layer adds only the missing publication metadata.

The final project step gains a Publication Quality Check covering completed work, mathematical reasoning, cited research evidence, reflection, self-assessment, and the project's own checklist. The check is transparent and advisory: it never claims that an answer is mathematically correct and never blocks submission.

The existing portfolio preview is complemented by a polished Publication Studio. It adds an optional title/byline and executive summary, a source list generated from the page's research links, structured evidence, calculations and written work, reflection, and rubric self-assessment. Students can preview, print, copy, or download the resulting publication packet.

## Architecture

The implementation is one shared, defensive client-side layer loaded by every `math/{unit-1..unit-10,statistics}/projects/version-{a,b}/index.html` page. `projects-publication.js` discovers existing semantic hooks and enhances them idempotently. `projects-publication.css` owns its responsive, accessible, print-safe presentation.

An idempotent injector is the canonical way to attach the layer to all 22 pages. A deterministic validator enforces page coverage, injection integrity, research-link alignment, and required accessibility hooks. Playwright smoke tests exercise the UI on all 22 routes.

## Data and Privacy

All Publication Studio data is stored only in the student's browser under a pathname-scoped local-storage key. No account, student name, remote API, analytics payload, or backend is required. The byline is optional and clearly described as device-local. Existing save/resume and JSON backup remain untouched.

## Accessibility and Resilience

The layer is keyboard operable, bilingual in English and Spanish, screen-reader announced, responsive on Chromebooks and phones, honors reduced-motion preferences, and produces high-contrast print output. Every enhancement is wrapped defensively so storage failure, an unavailable clipboard API, a blocked popup, or a missing optional project element cannot break the underlying activity.

## Acceptance Criteria

- All 22 project versions load one canonical Publication Studio CSS and JS layer.
- Every research block displays evidence status and publication metadata controls tied to its existing source and finding field.
- The quality check reports work, reasoning, citations, reflection, rubric assessment, and project-checklist status without grading correctness.
- The publication packet includes title/byline, summary, evidence, sources, work, reflections, and self-assessment when available.
- Copy, text download, JSON backup, and print/open-preview paths fail gracefully.
- Existing project smoke tests, build, validators, save/resume, language toggle, levels, and shared layers remain green.
- Production deployment is created by merging the pull request to `main`; manual Cloudflare Pages deployment remains prohibited.

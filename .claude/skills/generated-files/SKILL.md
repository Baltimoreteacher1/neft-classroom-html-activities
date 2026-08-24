---
name: generated-files
description: Read before editing anything under lessons/, before running or re-running a generator, and whenever this repo's working tree is unexpectedly dirty. Most files under lessons/ are build output written INTO the source tree — hand-editing them is silently undone, and a dirty tree here is not automatically salvage or junk.
---

# Generated files live in the source tree

`npm run build` rewrites real, tracked files in place — `lessons/*/worksheet.html`,
`lessons/*/index.html`, `data/curriculum-download-manifest.json`,
`teacher-tools/canvas-command-center/status.json`, and more. Three consequences:

1. **A clean checkout can fail its own gates.** `tools/download-manifest.test.mjs`
   and `validate:determinism` fail on pristine `origin/main` until a build runs.
   That is staleness in the committed output, not a bug you introduced.
2. **After any build the tree is dirty by design.** Do not read that as work in
   progress, and never `git add -A` on the assumption that it is yours.
3. **Editing an output is editing sand.** The next build overwrites it.

## Fix the generator, not the output

When a change needs to reach many pages, find the generator that writes them:

```
rg -l "<the thing you want to change>" scripts/ tools/ engine/
```

`scripts/generate-lesson-shells.mjs`, `scripts/generate-worksheets.mjs`,
`scripts/generate-almost-right-lab.mjs` and `tools/lib/compact-shell.mjs` each
emit page `<head>` content. Change the generator, rebuild, and confirm the count
of affected pages did not move afterwards — that is the proof the generator
holds the line rather than your edit.

## Before trusting a dirty tree, read the diff

A dirty tree here is one of three things, and they look identical in
`git status`:

- **build output** — regenerate and compare; if `git diff` is empty after a
  rebuild, it was only stat-dirt (`git update-index --refresh` clears it)
- **real unsaved work** — commit it on a branch before doing anything else
- **corrupted generator output** — this has happened: 143 files where a
  generator had overwritten 210 authored question stems with template text
  ("Analyze this student's mathematical claim… A student claims '39.25 × 2 is
  always true.'"), net −5,279 lines. It never reached main.

`git diff origin/main` and actually read it. Sample real content, not file counts.

## The safe cleanup

```
npm run discard:generated      # dry-run by default; reverts only generator-owned
                               # paths from an allowlist, never hand edits
```

Prefer it to `git checkout -- .`, which cannot tell your work from output.

## Re-running a generator can DELETE content

The catch-up generator merges "top 2 terms per lesson"; the committed stations
carried more, so a re-run dropped **56 terms across 20 catch-ups** — 5-3-catchup
lost Parallelogram, Parallel, Base 1 (b1), Height, Perpendicular. Raising the cap
does not fix it. Before a full regeneration, diff a sample of what the run would
overwrite, and prefer grafting a change onto committed output over regenerating
from scratch.

## Do not rewrite verification code

Codemods that sweep the repo must exclude `**/*.test.mjs`, `**/*.spec.ts` and
`tests/**`. Two tests carry a CDN font link on purpose — one proves the SCORM
packager flags it, one proves the self-hosted-fonts contract. A sweep that
"fixed" their fixtures turned both into tests that could no longer fail.

# Master Copy Rules

**Goal:** the version of this site that is live right now is the **master copy**.
When we build on it or add new things, we **keep the master the same and only add** —
we never let a regeneration or a stale clone overwrite it.

## Source of truth

- The `main` branch of **this** repo (`neft-classroom-html-activities`) is the master copy.
- Always start from the latest `origin/main`. Never work from, or push, the other clones
  (`~/Documents/EduWonderLab/...`, `~/Documents/neft-classroom-html-activities`, backups).
  Ignore any handed-over `cd …EduWonderLab… && git push` commands.

## The hand-maintained file you must protect

`curriculum/index.html` is **hand-maintained**, not generated. It contains:

- the **activity dropdown** (`select-control`),
- the **Teacher Tools** panel,
- per-lesson **Google Slides** links,
- Forms links pointing at **`/teacher-tools/post-forms/?lesson=ID`** (NOT the retired
  `eduwonderlab.vercel.app/google-forms` launcher).

`scripts/generate-curriculum.mjs` can REGENERATE this file, but its template produces a
plain ~999-line page **without** the dropdown/Teacher Tools. That regen has repeatedly
wiped the master copy.

### Hard rules

1. **Never run `npm run generate-curriculum -- --force`.** Without `--force` the generator
   already refuses to overwrite this file (guard in `generate-curriculum.mjs`).
2. **To ADD a lesson/activity to the hub, hand-edit `curriculum/index.html`** — copy an
   existing `<details class="lesson">…</details>` block (with its `.res-row` of `.res`
   links) and adjust. This keeps the master intact and only adds.
3. `dist/` is **gitignored** and built by Vite — never hand-edit or commit it.

## Deploy

- Classroom / curriculum (this repo) → Cloudflare **Pages**:
  `npm run validate && npm run build && wrangler pages deploy dist`.
- Home page (`~/eduwonderlab-home`, a Worker) → `wrangler deploy`.
- Cloudflare's **Git auto-deploy should be disconnected** for the Pages project so only
  manual `wrangler` deploys publish — otherwise pushes (incl. stale clones) race the
  manual deploy and revert the live site.

## Standard update loop

1. `git checkout main && git pull origin main`
2. `git checkout -b <task>`
3. Edit source (for the hub: ADD to `curriculum/index.html`; for lessons: `lessons/N-x/`).
4. `npm run validate && npm run build` (+ `npm run audit` for curriculum).
5. `wrangler pages deploy dist`.
6. Merge to `main` (fast-forward) — the **master-copy-guard** CI check
   (`.github/workflows/master-copy-guard.yml`) fails the build if the dropdown,
   Teacher Tools, Slides, or Forms links were lost.

## CI guard

`master-copy-guard` runs on every push/PR to `main` and fails if `curriculum/index.html`:
re-acquires the Vercel Forms URL, loses the dropdown/Teacher Tools, loses Slides links,
or shrinks toward the stripped ~999-line version. Green build = master copy preserved.

# This repo is inside iCloud Drive, and that is the wrong place for it

## What is actually happening

`~/Documents` is synced by iCloud Drive ("Desktop & Documents Folders"), so this
working tree is synced too. A second full clone — **3.7 GB, with its own `.git`**
— sits at:

```
~/Library/Mobile Documents/com~apple~CloudDocs/Documents/EduWonderLab/reveal-math-activities
```

On 2026-08-27 it held **20,611 files modified in the previous week** and **338
duplicate-named files** of its own.

When iCloud cannot reconcile a file it does not report an error. It writes a
**second copy beside the original** with a numeric suffix — `index 3.html`,
`zz-gate-mutation 2.css`, `.probe 2.mjs` — and moves on.

## Why this is not cosmetic

Those copies broke **four gates in three different ways** in a single session,
and every gate was right while the repo was fine:

| Gate | What it said |
|---|---|
| `gate-mutation` | "the harness left files behind: `zz-gate-mutation 2.html`" |
| `validate:static` | "`lessons/zz-gate-mutation 3.html`: missing `<!DOCTYPE html>`" |
| `validate:injection` | sentinel counts off, from a duplicated injected page |
| `validate:css-integrity` | a duplicated stylesheet parsed as a second copy |

Read cold, that is four unrelated defects in the code under test. The expensive
part is not the cleanup — it is diagnosing it, twice, on a tree that was never
broken.

A git working tree is close to the worst thing to put in iCloud. A build rewrites
thousands of tracked files at once; `.git` is many small files mutated together
and is **not** transactional under a file-sync daemon. Conflict copies are the
visible failure. A half-synced `.git` would be the invisible one.

## The two mitigations that are in the repo

Neither is a cure. They make the symptom loud instead of confusing.

```
npm run validate:sync-conflicts   # part of `validate`; names the cause in one line
npm run clean:sync-conflicts      # MOVES copies to .sync-conflicts/, never deletes
```

The cleanup moves rather than deletes on purpose: the copies genuinely differ
from their originals often enough that discarding them unseen would be a guess
about unsaved work.

## The actual fix: move the repo out of `~/Documents`

There is no per-folder exclusion for Desktop & Documents sync. Turning sync off
wholesale is not the answer either — it is a real backup of real teaching work.
Move **this repo** out; leave everything else where it is.

```bash
mkdir -p ~/Developer
mv ~/Documents/EduWonderLab/reveal-math-activities ~/Developer/reveal-math-activities
ln -s ~/Developer/reveal-math-activities ~/Documents/EduWonderLab/reveal-math-activities
```

The symlink keeps every existing path, launcher and bookmark working. **iCloud
does not follow symlinks**, so the tree stops being synced while
`~/Documents/EduWonderLab/reveal-math-activities` still resolves.

Afterwards:

1. `cd ~/Developer/reveal-math-activities && npm run qa:loop` — confirm green from the new location.
2. Delete the 3.7 GB iCloud clone once you are satisfied — it is a stale second
   copy, not a backup: `git` on the real remote is the backup.

This was **not** done automatically. It moves where a teacher's work lives on
their own machine and rewrites a path that launchers, `EDU_WONDER_LAB_ROOT` and
muscle memory all point at. That is a decision to take deliberately, with the
machine in front of you — not a side effect of a code change.

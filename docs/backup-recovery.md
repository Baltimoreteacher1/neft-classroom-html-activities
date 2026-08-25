# Curriculum backup & recovery (Google Drive)

The daily offsite backup of this repo's working tree to Joel's **personal** Google
Drive. Set up 2026-08-14.

For the student-progress database — the one thing here that a `npm run build`
cannot rebuild — see [`backup-restore.md`](./backup-restore.md) instead. The two
are separate systems with separate schedules.

---

## What is backed up, and where

|                    |                                                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Source**         | `~/neft-classroom-html-activities` — the whole working tree, i.e. the repo that builds and deploys eduwonderlab.com including `/curriculum` |
| **Destination**    | `gdrive:Eduwonderlab Curriculum Backup/worktree`                                                                                            |
| **Google account** | `neftjd@gmail.com` (personal). Verified on every run — see _Safety_ below                                                                   |
| **Method**         | `rclone copy`                                                                                                                               |
| **Schedule**       | daily at **21:30**, LaunchAgent `com.neft.curriculum-drive-backup`                                                                          |
| **Script**         | `~/scripts/curriculum-drive-backup.sh`                                                                                                      |
| **Health check**   | `~/scripts/curriculum-drive-backup-health.sh`                                                                                               |
| **Plist**          | `~/Library/LaunchAgents/com.neft.curriculum-drive-backup.plist`                                                                             |

Note that the scripts live **outside** this repo, in `~/scripts`. This file
documents them; it does not contain them.

### Excluded from the backup

Everything regenerable, so the backup stays a copy of _work_ rather than of build
output:

```
/.git/**            /reports/**        **/.DS_Store
/node_modules/**    /test-results/**   **/*.log
**/node_modules/**  /.wrangler/**      /.claude/session-reads.txt
/dist/**
```

Two of those deserve a note:

- **`.git` is excluded**, so this backup holds _no commit history_ — just the
  files as they stand. History for this repo lives on GitHub
  (`Baltimoreteacher1/neft-classroom-html-activities`). Read the known gap under
  [Restoring git history](#step-3--recover-git-history) before assuming there is
  a second copy anywhere.
- **`.claude/session-reads.txt`** is agent scratch that is rewritten
  continuously. Left in, the post-transfer check could never converge.

### The whole Drive folder

```
Eduwonderlab Curriculum Backup/
├── worktree/          the backup itself — mirrors the source tree
├── _versions/         previous versions of replaced files (see below)
└── LAST-BACKUP.txt    one-page manifest: time, account, commit, branch, file count
```

---

## ⚠️ The backup can be AHEAD of main and of production

This backs up the **working tree**, not a branch and not what is deployed. So the
copy in Drive routinely contains:

- **uncommitted edits**, including work in progress and half-finished changes;
- **work on whatever feature branch was checked out at 21:30**, which is usually
  not `main`;
- **untracked files** that were never intended to be committed.

That is deliberate — a backup that only captured committed work would lose the
most fragile thing in the repo. But it means:

> **Never treat the Drive copy as a source of truth for what is live.**
> Restoring it wholesale over a clean checkout can resurrect unfinished work and
> push it toward production. Check `LAST-BACKUP.txt` for the commit and branch the
> snapshot was taken from, and diff before you deploy anything restored from here.

For "what is actually deployed", use git and Cloudflare Pages, not this backup.

---

## Safety model

**Nothing in this system can delete a file from Google Drive.** The scripts use
only `rclone copy`, `copyto`, `check`, `about`, and `size` — never `sync`,
`bisync`, `move`, `delete`, or `purge`, and no `--delete*` flag anywhere.

Concretely:

- Files in Drive with no local counterpart are **left alone**. Verification runs
  `rclone check --one-way`, so extra remote files are not even reported as drift.
- A file that _is_ replaced has its previous version **moved into
  `_versions/<timestamp>/`** via `--backup-dir`, so even an overwrite is
  recoverable.
- Before transferring anything, the job calls the Drive API and **aborts unless
  the remote authenticates as `neftjd@gmail.com`**. A re-auth pointing at the
  wrong account fails the run instead of writing to it.
- No BCPS Google Drive is configured on this Mac. `gdrive:` is the only rclone
  remote, and school storage is OneDrive. Nothing school-owned is touched.

One unrelated job _can_ delete from Drive: `com.neftteacher.drivebisync` is a
two-way `rclone bisync` with `--max-delete 25`. It targets a **different** folder
(`gdrive:Neft Teacher — Curriculum Master`) and has nothing to do with this
backup. Do not point it at `Eduwonderlab Curriculum Backup`.

### What counts as success

A run is only reported `OK` if `rclone check --one-way` comes back with **zero
missing and zero differences**, compared by MD5 checksum rather than by name or
size. A non-zero rclone error count is treated as a partial upload and fails the
run. A clean exit code alone is never accepted as success.

A full pass takes roughly 45 minutes, and this repo has automation committing to
it throughout the day, so a handful of files can legitimately change mid-flight.
The job makes up to **3 copy → check passes** to converge on the delta; if it
still cannot get a clean check, it fails rather than rounding up.

---

## How `_versions/` works

Each run passes `--backup-dir .../_versions/<YYYY-MM-DD_HHMMSS>`. When the copy
replaces a file in `worktree/` with a newer local version, the **old** copy is
moved into that run's timestamped folder instead of being discarded:

```
_versions/2026-08-14_125340/curriculum/projects/index.html   ← the version that was in Drive before that run
worktree/curriculum/projects/index.html                      ← the version as of that run
```

Paths inside `_versions/<stamp>/` mirror `worktree/`, so a file's history is the
same relative path across successive timestamp folders. Only files that actually
changed appear — a run that transfers nothing creates no version folder.

This is how you recover from a **bad local edit that was then backed up**: the
good version is still in Drive, one folder up the timestamp list.

> `_versions/` is never pruned, by design — this system deletes nothing. It grows
> slowly (~1.5 MB on a typical day, since only changed files land there). See
> _Future maintenance_ at the end.

---

## Daily status check

```bash
~/scripts/curriculum-drive-backup-health.sh
```

Prints either

```
BACKUP HEALTHY — last successful verified backup: 2026-08-14T17:26:56Z (0h ago), commit 59e3022fb, 10537 files in Drive
```

(exit code 0) or

```
BACKUP FAILED — <specific reason>
```

(exit code 1). It is read-only: it never transfers, moves, or deletes anything.

It checks, in order: that a status file exists and the last run said `OK`; that
the success is **less than 36 hours old** (one missed night is tolerated, two is
not); that the LaunchAgent is still loaded; that Drive is reachable and still
authenticates as `neftjd@gmail.com`; that the destination is accessible and
non-empty; and finally it re-checksums the **25 most recently modified
`curriculum/` files** against Drive, so "healthy" means current curriculum work
actually arrived, not merely that a command exited zero.

### Logs and state

| Path                                                               | What                                                                                                       |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `~/Library/Logs/neft-backup/curriculum-drive-backup.log`           | main log; rotates at 5 MB, keeps 7 (`.log.1` … `.log.7`)                                                   |
| `~/Library/Logs/neft-backup/curriculum-drive-backup.{out,err}.log` | launchd stdout/stderr; should stay empty                                                                   |
| `~/.local/state/curriculum-drive-backup/status.json`               | machine-readable last run: result, reason, start/end, commit, branch, files, bytes, errors, passes, verify |
| `~/.local/state/curriculum-drive-backup/run.lock`                  | held while running; self-clears if its PID is gone                                                         |

Run it by hand at any time:

```bash
~/scripts/curriculum-drive-backup.sh                # real run
DRY_RUN=1 ~/scripts/curriculum-drive-backup.sh      # show what would transfer, change nothing
```

Or through the scheduler, in launchd's own environment:

```bash
launchctl kickstart -p gui/$(id -u)/com.neft.curriculum-drive-backup
launchctl print gui/$(id -u)/com.neft.curriculum-drive-backup | grep 'last exit code'
```

Prefer `kickstart` when testing changes to the script. launchd runs `/bin/bash`
(bash 3.2), which is stricter than the homebrew bash 5 on an interactive `$PATH` —
a script that runs fine in a terminal can still die under the scheduler.

---

## Restore procedures

All restore commands are **reads from Drive**. None of them writes to Drive.

`rclone` lives at `/opt/homebrew/bin/rclone`; add it to `$PATH` first if needed:

```bash
export PATH=/opt/homebrew/bin:$PATH
```

Throughout, `DRIVE` is the backup root:

```bash
DRIVE="gdrive:Eduwonderlab Curriculum Backup"
```

### 0. First: see what the snapshot is

```bash
rclone cat "$DRIVE/LAST-BACKUP.txt"
```

Shows when the backup completed, which account it went to, and the **commit and
branch** the working tree was on. Read this before restoring anything — see the
warning above.

### 1. Restore a single file

**Step 1 — find it.** Paths are relative to the repo root:

```bash
rclone lsf "$DRIVE/worktree" -R --files-only | grep -i 'projects/index.html'
```

**Step 2 — recover to a scratch location first, never straight over your working
copy:**

```bash
rclone copyto "$DRIVE/worktree/curriculum/projects/index.html" \
              /tmp/restored-index.html
```

**Step 3 — diff before you overwrite anything:**

```bash
diff /tmp/restored-index.html \
     ~/neft-classroom-html-activities/curriculum/projects/index.html
```

**Step 4 — put it in place**, from inside the repo so git records the change:

```bash
cd ~/neft-classroom-html-activities
cp /tmp/restored-index.html curriculum/projects/index.html
git diff -- curriculum/projects/index.html
```

**Step 5 — build and check** before committing:

```bash
npm run build
```

### 2. Restore an earlier version of a file (from `_versions/`)

Use this when a bad edit was made locally _and then backed up_, so `worktree/`
holds the bad version too.

**Step 1 — list the run timestamps, newest last:**

```bash
rclone lsf "$DRIVE/_versions" --dirs-only
```

**Step 2 — find which runs touched your file.** Each hit is one prior version:

```bash
rclone lsf "$DRIVE/_versions" -R --files-only \
  | grep 'curriculum/projects/index.html'
```

**Step 3 — pull the one you want.** The version stored under stamp `T` is the
content that was in Drive _before_ the run at `T` — so to undo a change made on
the 14th, take the file from the 14th's folder:

```bash
rclone copyto "$DRIVE/_versions/2026-08-14_125340/curriculum/projects/index.html" \
              /tmp/prior-index.html
```

**Step 4** — then diff, place, and build exactly as in steps 3–5 above.

### 3. Restore the entire working tree

**Step 1 — restore into a NEW directory.** Never restore over the existing repo;
if it is intact you will silently clobber newer work, and if it is not you want
both copies side by side to compare:

```bash
mkdir -p ~/restore-curriculum
rclone copy "$DRIVE/worktree" ~/restore-curriculum --progress
```

**Step 2 — confirm you got everything.** This must report zero differences:

```bash
rclone check ~/restore-curriculum "$DRIVE/worktree" --one-way
```

<h4 id="step-3--recover-git-history">Step 3 — recover git history</h4>

This backup deliberately does not carry `.git`. Clone the history from GitHub and
graft the restored files onto it:

```bash
cd ~/restore-curriculum
git clone --bare https://github.com/Baltimoreteacher1/neft-classroom-html-activities.git .git
git config --unset core.bare
git config core.logallrefupdates true
```

> **⚠️ Known gap — GitHub is currently the ONLY copy of this repo's history.**
>
> The weekly `com.neft.weekly-backup` job is supposed to mirror every repo to
> `gdrive:Eduwonderlab and Github Backup/backup-<date>/` as git bundles, and its
> `RESTORE.md` reads as though it does. For **this** repo it does not:
>
> - `MANIFEST.tsv` records `neft-classroom-html-activities` as `FAIL_OR_EMPTY` —
>   the mirror-clone step fails on it (it is by far the largest repo here; `.git`
>   alone is ~1.5 GB).
> - `MANIFEST-local.tsv` names an expected
>   `neft-classroom-html-activities.local-full.bundle`, but that file is absent
>   from `local-repos/` in every snapshot checked (2026-07-19, 08-02, 08-09).
> - Separately, the **2026-08-09 run produced zero GitHub bundles at all**
>   (`github-repos/` empty, `MANIFEST.tsv` header-only), versus 38 on 07-19 and
>   42 on 08-02.
>
> So if GitHub were lost today, you would recover **the files** from this Drive
> backup and **no commit history**. Verified 2026-08-14. Fixing the weekly job is
> out of scope for this document; it is recorded here so nobody discovers it
> mid-recovery. To confirm the current state before relying on it:
>
> ```bash
> B="gdrive:Eduwonderlab and Github Backup"
> rclone lsf "$B" --dirs-only | tail -1                     # newest snapshot
> rclone cat "$B/<newest>/MANIFEST.tsv" | grep classroom    # want status OK
> rclone lsf "$B/<newest>/local-repos/" | grep classroom    # want a .bundle
> ```

**Step 4 — see what the restored files actually are.** The working tree will not
match the branch tip, because it includes whatever was uncommitted at 21:30:

```bash
cd ~/restore-curriculum
git status
git diff
```

Read that diff. It is the uncommitted work the backup preserved — the point of
the whole system, and also the thing that must not reach production unreviewed.

**Step 5 — rebuild and verify locally before any deploy:**

```bash
npm ci
npm run build
npm run qa:fast
```

**Step 6 — deploy only deliberately.** Do not push a restored tree to `main` as a
recovery reflex. Commit onto a branch, review, and follow the normal deploy path
in [`deploy.md`](./deploy.md).

---

## Future maintenance

- **`_versions/` pruning.** Not implemented, deliberately — nothing in this system
  deletes from Drive. Growth is slow (only changed files land there), but it is
  unbounded, so at some point it will want a retention pass. Treat that as a
  conscious decision to start deleting, not a cleanup chore.
- **Machine-off days.** launchd fires a missed calendar job at the next wake, so a
  closed lid delays the backup rather than skipping it. A Mac that is _off_ for
  days backs up nothing, and the health check will say so after 36 hours.

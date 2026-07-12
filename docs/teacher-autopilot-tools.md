# Teacher Autopilot Tools — how to use

Three tools that automate recurring school-year work. Two have web pages
(linked from the Curriculum Hub → 🧰 Teacher Tools, and from /teacher-tools/);
two have terminal CLIs for automation.

## 1. Weekly Prep Autopilot (terminal) — `npm run prep`

Rebuild every artifact for a slice of lessons with one command.

```bash
# Preview the plan (runs nothing)
npm run prep -- --unit 2 --lessons 1-5 --dry-run

# Rebuild lessons 2-1…2-5 (shells, notes, slides, worksheets, homework, docx)
npm run prep -- --unit 2 --lessons 1-5

# Include flagship variants + Canvas pack + a full build
npm run prep -- --unit 3 --lessons 1-4 --flagship --canvas --build

# Just two steps for one lesson
npm run prep -- --unit 2 --lessons 3 --only slides,homework
```

It scopes the normally all-or-nothing generators (slides/homework/notes) to just
those lessons, rebuilds the global indexes once, and prints the deploy command.
It never `--force`-regenerates the hand-maintained curriculum hub. Deploy the
result the usual way: `ALLOW_DEPLOY=1 npm run ship -- <sha>` (or add `--deploy`).

## 2. Do-Now / Warm-up → Class Board

**Web:** `/teacher-tools/do-now-generator/` → build a Do Now (Spiral Review
preset pulls across units), then **📤 Post to Class Board** pushes it to the
board's “Right Now” panel for a chosen section. Only that panel changes; every
other panel is preserved.

**Terminal (automation):** `npm run do-now`

```bash
# Preview a spiral warm-up for period 601, units 1–3
npm run do-now -- --section 601 --units upto:3

# Post it live (needs the teacher key)
TEACHER_KEY=… npm run do-now -- --section 601 --units upto:3 --publish
```

Good for a scheduled morning job. It refuses to blank an uninitialized board.

## 3. Parent Updates (bilingual family notes)

**Web:** `/teacher-tools/parent-updates/` — sign in with the teacher key, and it
turns live gradebook data into per-student **English/Spanish** progress notes
(strengths + what to practice), ready to print. Everything is built in the
browser; **student data never leaves the page**.

**Terminal (batch/offline):** `npm run parent-updates`

```bash
TEACHER_KEY=… npm run parent-updates -- --section 601
```

Writes one note per student **outside the repo** (an OS temp folder) so student
data is never committed or deployed; it refuses a repo-internal output path.

# EduWonderLab → Canvas Deploy

Turn one **Unit Plan** file into a fully dated unit in Canvas — pages, assignments,
announcements, and a module — without a Canvas API token.

## Why this exists
Many districts (including BCPS) disable Canvas personal API tokens, which rules out a
script that posts to Canvas directly. This plugin uses the only token-free write path:
your real Canvas, driven through the browser inside your own logged-in session. You set
the dates once per unit; Canvas's built-in availability/due/lock dates release everything
on schedule day by day.

## How to use it
1. **Fill the Unit Plan.** Copy `Unit-Plan-Template.xlsx`, set the course URL and module
   info on the **Setup** sheet, and add one row per Canvas item on the **Plan** sheet
   (Module, Page, Assignment, Announcement) with titles, bodies, links, points, and dates.
   The template ships pre-filled with a one-day example you can edit or delete.
2. **Log into Canvas** in Chrome (with the Claude-in-Chrome extension connected).
3. **Drop the file and ask to deploy** — e.g. "Deploy this Unit Plan to Canvas." Claude reads
   the file, shows you a summary to confirm, then creates everything with the right dates and
   reports back.

## What gets created
- A **Module** with a "Lock Until" unlock date.
- A **Page** per lesson (objectives + your eduwonderlab.com link + room for files/game).
- A gradable **Assignment** per lesson with Available-from / Due / Until dates.
- A scheduled **Announcement** that auto-posts on the lesson morning.

## Cadence
This is a per-unit batch, not a daily robot. A fully unattended daily auto-poster isn't
possible token-free (it would require logging into your district account without you). You
spend a few minutes per unit; Canvas handles the daily release.

## Files
- `skills/canvas-deploy/SKILL.md` — the deploy workflow.
- `skills/canvas-deploy/references/unit-plan-format.md` — the file format.
- `skills/canvas-deploy/references/canvas-ui-steps.md` — exact Canvas UI steps + quirks.
- `skills/canvas-deploy/references/Unit-Plan-Template.xlsx` — blank template to copy.

## Safety
Claude never enters your password, picks your SSO account, or completes MFA — you sign in
yourself. It always shows a summary and waits for your OK before creating anything, and never
checks "Notify users" unless you ask.

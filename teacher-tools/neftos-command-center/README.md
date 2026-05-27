# NeftOS Command Center

A local-first professional and personal operating dashboard built for the Neft Teacher workflow.

## Decision summary

**Selected top idea:** NeftOS Command Center — a local-first dashboard that turns scattered professional and personal work into prioritized next actions, reusable prompts, quality checks, and launch links.

This was chosen over narrower alternatives because the highest-leverage problem is not one more generator. The recurring bottleneck is the scattered system: lesson-plan work, student notebooks, PD packets, classroom HTML apps, GitHub/Cloudflare deployment, Data Studio, Canvas, and Noam/family learning all compete for attention. A command center improves every workflow instead of solving only one.

## Debate rounds

### Round 1 — Another lesson-plan/notebook generator

**Argument for:** Directly supports one of the most common workflows and could speed up Ready and Student Notebook triggers.

**Argument against:** The user already has a strong production workflow and QA harness for this. Another generator risks duplication unless it becomes a control layer.

**Verdict:** Useful, but too narrow.

### Round 2 — Classroom app factory

**Argument for:** The user frequently builds HTML apps, learning games, Data Studio tools, Hebrew practice apps, and Cloudflare-hosted resources.

**Argument against:** A factory is powerful, but it still only serves one slice of life/work. It does not solve daily prioritization, personal planning, or cross-project follow-through.

**Verdict:** High value, but still narrower than needed.

### Round 3 — Private AI agent dashboard

**Argument for:** Could eventually watch email, calendar, Drive, GitHub, Cloudflare, and project folders.

**Argument against:** A true private-agent layer would require external authentication, API scopes, privacy decisions, and backend infrastructure. That is not the safest first deployed version.

**Verdict:** Future direction, not first build.

### Round 4 — Local-first professional/personal command center

**Argument for:** Works immediately as a static app, requires no private API access, deploys cleanly to GitHub/Cloudflare, supports professional and personal routines, and can become the front door for future automation.

**Argument against:** It will not automatically read email/calendar/Drive yet.

**Verdict:** Best first build. It creates immediate value and a durable foundation.

## What the app does

- Daily command brief with ranked next actions
- Local task board with priorities, statuses, workstreams, impact, effort, and due dates
- Mission-to-task conversion
- Quick capture area for messy notes and action items
- Reusable prompt generators for:
  - Ready lesson plans
  - Student Notebook BOTH
  - Gold-standard HTML app upgrades
  - Apps Script preflight audits
  - GitHub to Cloudflare deployment checks
  - Noam/family learning sprints
- EduWonderLab QA Harness checklist and score
- Fast-link launchpad for frequently used hubs and tools
- Local JSON backup and restore
- High-contrast and compact modes
- Offline-capable service worker

## Privacy model

This version is intentionally local-first. Data is stored in the browser through localStorage. It does not send tasks, notes, family details, student details, or project notes to any external service.

## Deployment model

This is a no-build static app. It can be served directly by Cloudflare Pages, GitHub Pages, or any static file host.

Primary route:

```text
/teacher-tools/neftos-command-center/
```

Files:

```text
teacher-tools/neftos-command-center/index.html
teacher-tools/neftos-command-center/styles.css
teacher-tools/neftos-command-center/app.js
teacher-tools/neftos-command-center/workflow-copy.js
teacher-tools/neftos-command-center/manifest.json
teacher-tools/neftos-command-center/service-worker.js
teacher-tools/neftos-command-center/README.md
```

## QA notes

Completed checks:

- Static no-build architecture selected for Cloudflare safety
- JavaScript syntax checked with `node --check`
- App route added under Teacher Tools
- Homepage quick-launch card added
- Teacher Tools card added
- Offline cache includes app shell and helper scripts
- Contextual workflow-copy behavior patched with a capture-phase helper
- No external dependencies added
- No private API access required

## Future upgrades

The best next iteration is a controlled connector layer:

1. Add optional import from calendar/email/Drive summaries.
2. Add project-specific saved templates.
3. Add GitHub deployment status widgets.
4. Add Cloudflare deployment checklist/status panel if Cloudflare API access is connected later.
5. Add a one-click weekly review export.

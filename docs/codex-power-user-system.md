# Codex Power User System

This repo now has a transparent Codex operating layer for fast, safe EduWonderLab / Neft Teacher classroom product work.

## How It Works

- `AGENTS.md` gives every Codex session the repo purpose, commands, safety rules, accessibility expectations, and definition of done.
- `.codex/config.toml` sets conservative workspace-write defaults, subagent limits, and lifecycle hooks.
- `.codex/agents/` defines focused subagents for mapping, review, testing, UI accessibility, education content, and deploy safety.
- `.codex/hooks/` adds lightweight policy and QA checks around prompts, shell/tool use, and final responses.
- `scripts/codex/` provides repeatable preflight and verification scripts.
- `.codex/workflows/` gives reusable task playbooks for common classroom activity work.

## What Runs Automatically

When the project `.codex/` layer is trusted, Codex can load:
- Session context reminder.
- User prompt guard reminders.
- Pre-tool command policy checks.
- Post-tool failure signal summaries.
- Stop/final QA continuation prompts.

Hooks are local, dependency-light Python scripts. They do not create background services.

## What Still Requires Approval

- Deployment.
- Dependency installation or lockfile changes.
- Authentication or MCP server installation.
- Global Codex config changes.
- Secret/env changes.
- Destructive Git or filesystem operations.

## How To Use Custom Agents

Ask Codex to use one or more agents by name:
- `repo_mapper`: map routes/files before a change.
- `quality_reviewer`: final correctness/security/accessibility review.
- `test_runner`: run safe validation and summarize failures.
- `ui_accessibility_reviewer`: student-facing UI review.
- `education_content_reviewer`: math/ESOL/WIDA/TWR content review.
- `deploy_guard`: Vite/Cloudflare deploy safety review.

Keep agent use targeted. Avoid spawning reviewers for tiny text-only changes unless risk justifies it.

## Preflight And Verification

Run:

```bash
scripts/codex/codex-preflight.sh
scripts/codex/codex-verify.sh
```

`codex-verify.sh` runs static local checks, `npm run validate`, and `npm run build` when those scripts are available. It never deploys.

## Adding New Repo Rules

When Codex repeats a mistake:
1. Add a short rule to `AGENTS.md`.
2. If mechanically detectable, add a small check to a hook or `codex-verify.sh`.
3. Keep rules specific and testable.
4. Avoid broad prohibitions that create noise.

## Keeping Hooks Useful

- Prefer reminders over blocking when risk is low.
- Block only destructive, secret-exposing, dependency-changing, or deploy actions.
- Keep output short.
- Remove or narrow any hook that fires too often.

## Temporarily Disabling Hooks

- Rename `.codex/config.toml` or comment the relevant `[[hooks.*]]` block.
- Or run Codex from a folder that does not load this project `.codex/` layer.
- Re-enable by restoring the config and restarting the Codex session.

## Weekly Maintenance Routine

- Run `scripts/codex/codex-preflight.sh`.
- Run `scripts/codex/codex-verify.sh`.
- Review whether hooks were noisy or missed real issues.
- Check new activity folders are linked from hub/category pages.
- Update workflow docs when classroom patterns change.

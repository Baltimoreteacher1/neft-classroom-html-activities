# Codex MCP Recommendations

Current visible MCP setup from `codex mcp list` should be inspected before installing anything. Do not install or authenticate MCP servers without explicit approval.

## Recommended

### Browser / Playwright Automation

- What it adds: local UI smoke tests, screenshots, console checks, and click-through validation for student activities.
- Why it matters: this repo has many student-facing routes and responsive classroom workflows.
- Install command: use the Codex Browser plugin or Playwright MCP after choosing the preferred setup.
- Permission risk: can inspect local pages and browser state; avoid authenticated private pages unless needed.
- Should install: yes if not already available through Codex desktop Browser tooling.

### Context7 Or Official Docs MCP

- What it adds: current Vite, Cloudflare, Apps Script, and framework documentation lookup.
- Why it matters: build/deploy APIs and Cloudflare behavior change over time.
- Install command: provider-specific; confirm before installation.
- Permission risk: low to moderate network documentation access.
- Should install: useful, optional.

### GitHub MCP

- What it adds: issues, PRs, CI checks, and branch review context.
- Why it matters: this repo is backed by `Baltimoreteacher1/neft-classroom-html-activities`.
- Install command: use Codex plugin/app authentication flow when needed.
- Permission risk: repository read/write depending on scopes.
- Should install: yes for PR-heavy work, only after reviewing scopes.

### Cloudflare MCP

- What it adds: Pages/Workers deployment and resource inspection.
- Why it matters: this repo deploys to Cloudflare Pages and includes Functions, KV, D1, and a Worker package.
- Install command: provider-specific; do not install without approval.
- Permission risk: high if deploy/manage scopes are granted.
- Should install: only if Joel wants Cloudflare inspection inside Codex.

## Not Recommended By Default

### Google Drive/Gmail/Calendar

- What it adds: Workspace document/email/calendar access.
- Why it matters: useful for Apps Script or lesson publishing tasks, but not needed for most static activity edits.
- Permission risk: high personal/workspace data exposure.
- Should install: only for explicit Google Workspace tasks.

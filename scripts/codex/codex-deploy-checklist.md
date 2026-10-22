# Cloudflare/Vite Deploy Safety Checklist

- Deployment was explicitly requested in the current task.
- Targeted checks for the changed surface passed; meaningful UI changes were inspected in a browser.
- `npm run ship` will run the change-scoped pre-push QA gate, including `build` when required. Do not repeat the full serial `validate` and `build` solely for deployment.
- `wrangler.toml` still points Cloudflare Pages to `dist`.
- Existing live routes, `_redirects`, and `_headers` are preserved.
- Static assets resolve with production-safe paths.
- Pages Functions and Worker assumptions are documented.
- Environment variables and secrets are not committed or printed.
- No dependency or lockfile changes were made unless required and approved.
- The guarded `ship` command and its live-stamp check provide the deploy and verification path; the rollback commit is known.

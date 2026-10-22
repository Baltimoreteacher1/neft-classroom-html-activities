# Cloudflare Deploy Safety

Trigger words/use cases: deploy, Cloudflare Pages, Wrangler, publish, production, route, `_redirects`, `_headers`, Pages Functions.

Required inspection steps:
- Confirm deployment was explicitly requested.
- Read `package.json`, `wrangler.toml`, `vite.config.js`, `_redirects`, `_headers`, and relevant `functions/` files.
- Identify build output directory, route assumptions, KV/D1 bindings, and Worker/Page split.

Implementation rules:
- Do not deploy unless explicitly requested in the current task.
- Do not print or edit secrets.
- Preserve existing routes and headers.
- Run targeted checks for the changed surface before committing. The guarded ship command runs change-scoped QA (including a build when required) before the push; Cloudflare builds after the push.

Verification commands:
- Run the narrowest relevant check while editing. For UI changes, also inspect the affected pages in a browser.
- Use `ALLOW_DEPLOY=1 npm run ship -- <sha>` only after an explicit production deploy request. Its pre-push hook runs `npm run qa:fast -- --push`; do not run `npm run validate`, `npm run build`, or `npm run qa:fast` again solely as deploy preflight.
- Use `QA_FULL=1` only when the change needs the full gate. Keep the deploy guard and live-stamp verification.

Final response format:
- Changed
- Verified
- Deployment Safety
- Notes / Risks

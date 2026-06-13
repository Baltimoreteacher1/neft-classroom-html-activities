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
- Validate/build before deploy handoff.

Verification commands:
- `npm run validate`
- `npm run build`
- Deploy command only after explicit request.

Final response format:
- Changed
- Verified
- Deployment Safety
- Notes / Risks

#!/usr/bin/env node
console.log(`
Neft Teacher Cloudflare Pages settings
=====================================

Recommended dashboard settings:
- Production branch: main
- Framework preset: None / Static HTML
- Build command: (leave blank)
- Build output directory: /
- Root directory: /

Optional local check:
- npm run validate

Important:
- Keep _redirects and _headers at the repository root.
- Do not add wrangler.toml as an active config unless you intentionally want Wrangler to become the project configuration source.
- This repo is intentionally no-build so existing static routes remain stable.
`);

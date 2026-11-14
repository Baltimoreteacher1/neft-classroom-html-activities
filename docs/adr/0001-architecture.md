# ADR 0001 — Architecture for the Language Page rebuild

Status: accepted, 2026-11-13. Scope: `access-practice-lab/` (served at thelanguagepage.com).

## Context (evidence from P0 inspection)

- A static `index.html` shell plus a vanilla-JS ES-module SPA (`src/main.js`). 65 views are literal dynamic imports, so each route already loads on demand; the home route is the only static dependency.
- `tools/sync-access-shell.mjs` versions every import and generates the service worker precache. `sw.js` already handles offline continuity.
- Content is JSON under `content/` (896 activities across K, 1, 2–3, 3–5, 6–8 and 17 practice tests), read by one Node reader (`tools/lib/access-lab-content.mjs`) used by the validator, printables and inventory.
- 81 CSS files (1.16 MB raw, 258 KB gzip) are linked globally: every route loads ~79 stylesheets.
- The live site already scores 100 on Lighthouse accessibility, best practices and SEO, and has 0 axe violations on the ten routes measured. Mobile performance is 65 (LCP 5.6 s, CLS 0.165).
- Hosting is Cloudflare Pages (`_headers`, `_redirects`), deployed only through `npm run ship`.

## Decision

Do not rewrite from scratch. Keep the vanilla-JS ES-module architecture and the Cloudflare Pages static hosting, and use a strangler approach:

1. New shell, home and trust surfaces are built as new modules next to the old ones and switched in at route level behind flags (`ux` flag read from `?ux=` and stored in `localStorage` under the lab's existing prefs key). Old route behaviour stays reachable until the new route passes its panel gate, then the old module and its CSS are deleted in the same change (no dead code).
2. Content stays in place and is never edited by presentation work. New metadata lives in sidecar JSON keyed by activity id (`content/metadata/`), validated by JSON Schema in CI. `tools/lib/access-lab-integrity.json` holds hashes of every activity and test; `tools/access-lab-integrity.mjs` fails CI on any drift unless the key is allow-listed with a reason.
3. CSS consolidates incrementally into `src/design/tokens.css`, `base.css`, `components/*.css` and per-route chunks, by build step, with a budget test. The 79-file global waterfall is removed route group by route group, not in one cut.
4. New code is TypeScript-checked JSDoc JS (the repo is JS; `tsconfig.json` exists and `npm run typecheck` is a ratchet). No `any` in new code.
5. Security headers, redirects and caching live in `_headers` / `_redirects`, generated from `data/routes.json` where that generator already owns the file.

## Why not a framework rewrite

- The measured problems are information architecture, first-viewport content, CSS weight and the global stylesheet waterfall. None needs a framework.
- A rewrite would put 896 reviewed activities, offline behaviour, save/resume and 65 working views at risk with no measured benefit.
- The existing per-route dynamic imports already give the code splitting a framework would add.

## Consequences

- Phases land as small commits that leave the site working. Flags let a phase merge before it is the default.
- Some old and new modules coexist temporarily. Each phase's panel report lists what remains to delete.
- Path mapping for this build's documents: the brief's `/docs/*`, `/reports/*` and `/content/*` map to `docs/language-page/*` (shared `docs/` already holds other products), `reports/language-page/*`, and `access-practice-lab/content/*`.

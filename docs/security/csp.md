# Content-Security-Policy for /bcpss-teachers/

Source: `functions/_lib/security/csp.js`, applied by `functions/bcpss-teachers/_middleware.js`. Tests: `functions/_lib/security/csp.test.mjs`.

## Where it lives and why

Not in `_headers` (a per-response nonce cannot be written in a static file, and `_headers` rules combine instead of overriding) and not in the root `functions/_middleware.js` (pinned by `validate:auth-contract`). A directory middleware scoped to `/bcpss-teachers` wraps `next()` and adds the header to HTML responses with status 200.

## Policy

`default-src 'self'`; `script-src 'self' 'nonce-<per response>'`; `style-src 'self' 'unsafe-inline'`; `connect-src 'self'` (no third-party calls from these pages); `img-src 'self' data: blob:`; `font-src 'self'`; `object-src 'none'`; `base-uri 'self'`; `form-action 'self'`; `report-uri /api/csp-report`. `frame-ancestors` stays in the global `_headers` rule (LMS framing).

`style-src` keeps `'unsafe-inline'` because the pages use inline style attributes. That is the one known gap.

## Mode switch

`env.BCPSS_CSP_MODE`: `report-only` (default), `enforce`, `off`. Unknown values fall back to report-only. When the flag registry lands, its `csp_enforce` flag should drive `cspModeFor()`; that is a one-line change there.

Report-only sends `Content-Security-Policy-Report-Only`. Violations post to `/api/csp-report`, which logs the violated directive and the blocked origin only.

## Inline-script inventory

`csp.test.mjs` parses every `bcpss-teachers/**/*.html` and prints inline `<script>` blocks and inline `on*=` handlers per page (a report, not a failure). It fails only on a foreign script origin or if the parser misses its own fixture. At the time of writing the source pages contain 0 inline scripts and 0 inline handlers. Build-time injectors could still add some to `dist/`; the report-only violations will show that.

## Path to enforcement

1. Deploy in report-only (this change). Watch `csp_violation` log lines for a full teaching week across Studio, Language Studio, Writing Lab, Pathways, Insights and the plan share page.
2. Fix every directive that reports from real use (usually an injected inline script or a third-party origin). Keep `connect-src 'self'` strict.
3. Set `BCPSS_CSP_MODE=enforce` on a preview deployment first, then production, with Joel's approval.
4. Enforce mode sets `Cache-Control: no-store` on these HTML responses and drops validators, because a nonce is valid only for the response that carries it. If pages end up with zero inline scripts, drop the nonce and serve a static `script-src 'self'` so caching can return.
5. Later: remove `'unsafe-inline'` from `style-src` once inline style attributes are moved to classes.

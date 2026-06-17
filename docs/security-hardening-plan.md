# Security Hardening Plan — Curriculum Hub

A Content-Security-Policy was **not** enabled in the top1 upgrade because
`/curriculum/index.html` relies heavily on inline `<style>` and inline `<script>`
(the `unitsData` builder + render logic, ~3500 lines) plus a remote CDN script
(`minisearch` from jsdelivr). Shipping a strict CSP now would break the page.

This is a staged, non-breaking plan.

## Target CSP (end state)

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' https://cdn.jsdelivr.net;
  style-src 'self';
  img-src 'self' data:;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://neft-school-hub-api.neftjd.workers.dev;
  frame-ancestors 'self';
  base-uri 'self';
  object-src 'none';
```

## What must move before enabling CSP

1. **Inline `<script>` in `curriculum/index.html`** (the `unitsData` builder, render
   functions, launch modal, deep-link logic). Extract to
   `assets/curriculum-hub-core.js` and load with `defer`.
2. **Inline `<style>`** in the same file → an external stylesheet (or keep with a
   per-build nonce; external is simpler).
3. **`minisearch` CDN** → either self-host the UMD bundle under `/assets/vendor/`
   or keep `https://cdn.jsdelivr.net` in `script-src`.
4. Audit other inline handlers (`onclick=` etc.) — replace with `addEventListener`.

The top1 layer added in this upgrade is already CSP-clean: external JS/CSS only,
no inline handlers, no `eval`, no remote calls beyond same-origin `fetch` of
`/data/*.json`.

## Staged rollout

1. **Report-only first.** Add `Content-Security-Policy-Report-Only` in `_headers`
   scoped to `/curriculum/*`, collect violations for a week.
2. Extract inline script/style (steps 1–2 above); re-test in report-only.
3. Flip to enforcing `Content-Security-Policy` for `/curriculum/*` only.
4. Expand to the rest of the site route-by-route.

## Permissions-Policy note

The global `_headers` `Permissions-Policy` currently restricts `microphone` /
`camera`. **Do not** globally open these. If a speaking/recording activity needs
the mic, add a **route-scoped** allowance for that path only — never a global one.

## Out of scope / unchanged

- `_headers`, `_redirects`, `wrangler`, routes — untouched in this upgrade.
- No new third-party dependencies were added.

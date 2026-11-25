# Local environment for tests

`npm run dev:local` (runbook: `docs/runbooks/preview.md`) gives tests and humans a production-shaped server
with a real local D1 and seeded demo data, without any network call to Cloudflare.

## When to use it

| Need | Use |
| --- | --- |
| A pure function or one module | `node --test <file>`; no server |
| An API route against D1 | the route's own `*.test.mjs` with a fake `env.DB` (the repo's pattern) |
| The whole stack: Functions, middleware, D1 migrations, static files | `npm run dev:local` |
| Auth and the teacher cookie in two browser engines | `npm run e2e:auth` (starts its own server, needs a build) |
| Does a preview deployment answer? | `node tools/synthetic-check.mjs <preview-url>` |

## What is seeded

- Every `migrations/*.sql`, applied in order, once (bookkeeping table `_dev_local_migrations`).
- One class with 28 aliases `Star 1`..`Star 28`, taken from `shared/fixtures/classes.js` (`fx-6-balanced`).
  `tools/dev-local.mjs` refuses to seed any alias that is not `Star N`, and more than 28. Nothing else is stored: no
  names, no home language, no program or band label.
- Throwaway secrets per run (`TEACHER_KEY`, `SITE_PASSWORD`); they are printed, never written to the repo.

## Driving it from a test or script

```sh
npm run dev:local -- --port 8790 &        # prints the URL and the teacher password
node tools/synthetic-check.mjs http://127.0.0.1:8790
```

State lives in the OS temp folder, outside the repo and outside `~`. `--clean` removes it. Persisted D1 data
survives restarts so a re-run is fast; run `--clean` for a fresh database.

## Limits

- The default static root is light (Studio, shared code, tokens). Pages outside it return 404 unless you pass
  `--build`. The Studio shell's own fonts (`/assets/fonts/*`, produced by the build) are also absent, so the shell
  shows 404s for them and falls back to system fonts; the design specimen uses its own self-hosted faces.
- Workers AI, Browser Run, R2, KV and the email service are not bound. Routes that need them behave as they do when
  that binding is absent.
- It runs `wrangler@3.114.9` (the repo's pinned version for Functions builds). D1 is applied with
  `d1 execute --command`; wrangler 3.114.9's `--file` path fails on current Node with a FileHandle error.

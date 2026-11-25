# Runbook: class retention job

Status: the job exists and is tested; it is NOT scheduled. Nothing in this repository wires it to a cron
or deploy trigger.

## Policy

A class is deleted 30 days after the end of the school year in which it was created. The school year ends
June 30 (UTC). A teacher can shorten the 30 days for one class (0 to 30) with
`POST /api/privacy/retention { code, graceDays }`; a class can never be kept longer than the default.

This runs next to the existing sweep in `functions/_lib/class-platform/store.js` (`pruneExpired`), which
removes a class unused for 120 days. Whichever deadline comes first applies.

## The pieces

- `functions/_lib/privacy/retention.js`
  - `expiredClasses(rows, now, retentionDays = 30)`: pure; returns the codes past their deadline.
  - `runRetention(env, now)`: reads `class_platform_class`, deletes each expired class with
    `deleteClass(..., actor: "retention")`, one receipt per class, and returns
    `{ checked, deleted, failed }`. One failing class does not stop the others.
- Tests: `tools/privacy-delete.test.mjs` (policy dates, teacher shortening, the job).

## Wiring it (needs Joel's explicit approval to deploy)

Cloudflare Pages Functions have no `scheduled()` handler, so the job needs a small Worker bound to the same
D1 database (`neft-student-progress`, binding `DB`). Sketch, not applied:

```js
// worker/retention-cron.js  (new Worker; not in the repo yet)
import { runRetention } from "../functions/_lib/privacy/retention.js";

export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(
      runRetention(env).then((r) => console.log("retention", JSON.stringify(r))),
    );
  },
};
```

```toml
# wrangler.toml for that Worker
[triggers]
crons = ["17 7 * * *"]   # daily, 07:17 UTC
[[d1_databases]]
binding = "DB"
database_name = "neft-student-progress"
database_id = "<same id as the Pages project>"
```

Before enabling, list what it would delete without deleting:

```js
// read-only: which classes are due today
const { results } = await env.DB.prepare(
  "SELECT code, created_at, settings_json FROM class_platform_class",
).all();
console.log(expiredClasses(results, Date.now()));
```

Prerequisites: migrations 0020 (receipts) and 0021 must be applied first; `deleteClass` refuses to delete
when the receipts table is missing.

## Operating it

- Output goes to the Worker log; failures appear in `failed` with the error text.
- Export `privacy_deletion_receipt` with each D1 backup (see `docs/privacy/restore-policy.md`).
- To pause: remove the cron trigger. Nothing else depends on it.

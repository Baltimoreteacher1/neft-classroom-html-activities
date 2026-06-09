# Template — QA Report (reference)

Rendered by `lib/qa.mjs → runQa(packageDir)`. Each check has a severity:
`block` (must fix) or `warn` (should fix). Output shape:

```
# QA Report — <title>
- Status: pass | pass-with-warnings | blocked
- Blocking failures: <n>
- Warnings: <n>
- Recommendation: <ready-to-publish | staged-only | blocked>

## Checks
- ✅ / ⚠️ / ⛔ [severity] <check id> — <detail>
```

Check groups: card metadata, resource completeness, math accuracy (answer-key
coverage + inline stat-claim recompute), AI-slop/TODO/fake-link scan, and
scaffolding depth. `qa-report.md` is excluded from its own content scan so QA is
idempotent. QA also writes `qaStatus` and `status` back into `card.json`.

# Production observability

## What runs

`.github/workflows/production-observability.yml` runs daily and on demand. It is read-only and checks:

- live page identity, protected-route behavior, and deploy freshness;
- JavaScript field-error rate;
- real-user LCP, INP, and CLS ratings;
- curriculum synthetic performance budgets;
- accessibility across the production route set.

`.github/workflows/nightly-browser-qa.yml` separately runs every Playwright journey against a fresh production build with one worker.

## Local commands

```bash
npm run smoke:live
node scripts/route-monitor.mjs
npm run monitor:field
npm run perf:curriculum -- --base https://eduwonderlab.com
npm run audit:a11y -- --base https://eduwonderlab.com
```

## Field-signal policy

`assets/nt-usage.js` loads the self-hosted official `web-vitals` package after the page's primary work. It sends only:

- normalized path without query or fragment;
- metric name (`LCP`, `INP`, or `CLS`);
- numeric value and coarse device bucket.

There are no names, IDs, cookies, fingerprints, element selectors, interaction targets, or raw event timelines. Teacher Mode, development hosts, Do Not Track, and Global Privacy Control are excluded.

The server computes ratings from the current Core Web Vitals thresholds:

| Metric | Good | Poor |
| --- | ---: | ---: |
| LCP | ≤2,500 ms | >4,000 ms |
| INP | ≤200 ms | >500 ms |
| CLS | ≤0.1 | >0.25 |

Google recommends evaluating these at the 75th percentile. The aggregate monitor therefore alerts when at least 20 samples exist for a metric/device group and fewer than 75% are rated good. See [Web Vitals](https://web.dev/articles/vitals) and the official [web-vitals library](https://github.com/GoogleChrome/web-vitals).

The JavaScript-error monitor alerts only when both conditions hold across the current and previous UTC day:

- at least 10 error hits; and
- errors are at least 2% of recorded views.

This prevents one-off browser-extension noise from paging the maintainer while still catching broad regressions.

## Response playbook

1. Confirm the failure by manually dispatching **Production Observability**.
2. For a route or deploy-stamp failure, stop new deployments and run `npm run ship:verify` plus `npm run smoke:live`.
3. For JavaScript errors, use the teacher-gated `/api/signal/errors` report to identify the path/message aggregate; never expose that report publicly.
4. For a Core Web Vitals alert, segment by metric and device through the teacher-gated `/api/signal/vitals` report, then reproduce on the affected route.
5. Fix the smallest canonical source, run the pull-request and nightly gates, and deploy through `npm run ship` only with explicit authorization.

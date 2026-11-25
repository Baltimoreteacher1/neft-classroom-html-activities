# Egress probe (G-31 foundation)

Proves a flow sends no student content off the page. `tools/egress-probe/`:

| File | Role |
| --- | --- |
| `probe.mjs` | `probe(page, { allowedOrigins, canaries, allowCanaryTo, block })` Playwright harness |
| `analyze.mjs` | pure request analysis and `makeCanary(label)`; unit-tested without a browser |
| `selftest.mjs` | serves local pages: a clean one must pass, leaking variants must be flagged |

## Use

```js
import { chromium } from "@playwright/test";
import { makeCanary } from "../tools/egress-probe/analyze.mjs";
import { probe } from "../tools/egress-probe/probe.mjs";

const canary = makeCanary("recording");               // zzcanary-recording-<hex>
const page = await (await chromium.launch()).newPage();
const handle = await probe(page, { allowedOrigins: [new URL(baseUrl).origin], canaries: [canary], block: true });
await page.goto(`${baseUrl}/the/flow`);
// type / record / save canary.value as the student's content, then finish the flow
handle.assertClean();                                  // throws EgressViolation listing every finding
```

A request is a finding when its origin is not in `allowedOrigins` (`cross-origin`) or its URL, body or
headers contain a canary (`canary`). Canaries are matched case-insensitively raw, percent-encoded,
form-encoded and as base64/base64url at every alignment; encryption or compression is not detected.
`data:`, `blob:` and `about:` are ignored. WebSocket URLs and sent frames are checked. `block: true`
aborts violating requests so a faulty flow cannot reach the network. Run only against a local server or a
source-tree preview, never production.

A same-origin request that carries a canary is also a finding. A flow that legitimately saves to its own
API lists that path in `allowCanaryTo: [{ origin, pathPrefix }]`; the entry is visible in review and never
exempts another origin.

## Registering a flow (later waves)

Add one test per flow beside the feature, using the pattern above with a distinct canary label and the
feature flags it needs set on. Planned flows: `recording`, `writing`, `flashcards`, `portfolio`,
`practice-test`, `book-builder`. For each: run it with `student_content_egress` off and expect a clean
probe (nothing leaves), then, where the feature is allowed to send, assert the only canary-bearing
requests are the documented `allowCanaryTo` paths. Wiring the flows is out of scope for the wave that
added this harness.

## Gate

`npm run validate:egress-probe` runs `selftest.mjs`; `npm run test:flags` runs the pure analysis tests.
Exit codes: 0 pass, 1 harness wrong, 3 no browser or error (CI treats 3 as failure). Set
`PW_CHROMIUM_PATH` to use a specific Chromium.

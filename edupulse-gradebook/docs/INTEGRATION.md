# Integrating a game with EduPulse Gradebook

This guide shows how to wire a no-login HTML/JS game to the ingestion API using
the `EWLScoreBridge` client module.

## 1. Include the bridge

Serve `ewl-score-bridge.js` (it ships with the dashboard on Pages, e.g.
`https://edupulse-gradebook.pages.dev/ewl-score-bridge.js`) or copy it into your
game. It exposes a global `EWLScoreBridge` (and also works as a CommonJS/ESM
module).

```html
<script src="https://edupulse-gradebook.pages.dev/ewl-score-bridge.js"></script>
```

## 2. Three-line wire-up

```js
const bridge = new EWLScoreBridge({
  apiBase:  'https://edupulse-gradebook-api.<you>.workers.dev',
  ingestKey: 'ek_…' // write-only key — safe to ship in the game
});
bridge.identify({ studentId: 'S014', studentName: 'Ana R.', classPeriod: 'P3' });
bridge.record({ activityId: 'frac-soccer', activityTitle: 'Fractions Soccer', standard: '6.NS.1',
                score: 9, maxScore: 10, stars: 3, problemsCorrect: 9, problemsAttempted: 10,
                misconceptions: ['invert-divide'], durationSec: 142 });
```

`record()` enqueues the event in `localStorage` and flushes immediately (real
CORS POST). On success the Worker returns `{ ok: true, written, skipped }` and
the bridge drops the confirmed events from its queue. If the device is offline,
events stay queued and auto-flush on the next `online` event.

## 3. Event fields

`record()` accepts these fields (camelCase). Anything omitted is sent as `null`;
`percent` is auto-computed from `score`/`maxScore` if not supplied. `misconceptions`
may be an array (joined with `|`) or a pipe-delimited string.

| field              | type            | notes                          |
|--------------------|-----------------|--------------------------------|
| eventId            | string          | auto UUID if omitted (dedupe key) |
| timestamp          | ISO string      | auto `now` if omitted          |
| studentId / studentName / classPeriod | string | from `identify()` if omitted |
| activityId / activityTitle / standard  | string |                              |
| score / maxScore / percent             | number |                              |
| stars / problemsCorrect / problemsAttempted / durationSec | integer | |
| misconceptions     | string \| array | pipe-delimited tags            |
| deviceId           | string          | auto UUID via `identify()`     |

## 4. Bridge API

- `identify(info)` — merge + persist student/device identity (`ewl_identity`).
- `record(data)` — build + enqueue + flush one event.
- `flush()` — POST queued events; resolves with the server JSON. Only confirmed
  events are dequeued (true delivery guarantee).
- `exportCSV()` — returns a CSV string of the local pending queue (BOM + escaping).
- `pendingCount()` — number of events still queued.

## 5. Direct curl (no bridge)

```bash
curl -X POST "$API/api/scores" \
  -H "x-ingest-key: $INGEST_KEY" -H "content-type: application/json" \
  -d '{"events":[{"eventId":"demo-1","timestamp":"2026-06-01T10:00:00Z",
       "studentId":"S01","studentName":"Ana","classPeriod":"P3",
       "activityId":"frac-1","activityTitle":"Fractions Soccer","standard":"6.NS.1",
       "score":9,"maxScore":10,"percent":90,"stars":3,
       "problemsCorrect":9,"problemsAttempted":10,
       "misconceptions":"invert-divide|common-denominator","durationSec":120,"deviceId":"d1"}]}'
```

Reading data requires the **admin** key:

```bash
curl -H "x-admin-key: $ADMIN_KEY" "$API/api/summary"
curl -H "x-admin-key: $ADMIN_KEY" "$API/api/scores?standard=6.NS.1&limit=50"
curl -H "x-admin-key: $ADMIN_KEY" "$API/api/export.csv" -o scores.csv
```

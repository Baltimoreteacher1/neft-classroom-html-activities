# Math Workbench — Live Board sync Worker

Standalone Cloudflare Worker that defines the **`BoardRoom`** Durable Object
powering the Math Workbench "Live Board" feature: a teacher broadcasts their
board to a class code and every student on that code follows along live and
view-only.

A Durable Object cannot be defined inside the Cloudflare Pages project that
serves `eduwonderlab.com`, so it lives here as its own Worker. The frontend
(`curriculum/math-workbench/index.html`) connects to it directly over WebSocket:

```
wss://workbench-live.neftjd.workers.dev/live?code=<class-code>&role=teacher|student
```

## Design

- **One-way, teacher → students.** Only the teacher's board snapshot is ever
  transmitted. Students are pure followers; no student name, work, or identity
  is sent to the room. This keeps it classroom-safe and PII-free.
- **One DO instance per code** (`idFromName(code)`).
- **Ephemeral.** The latest board snapshot lives in the Durable Object (so a
  late-joining student hydrates instantly). No KV, no database, no long-term
  storage — the room empties after the lesson.
- **Hibernatable WebSockets** tagged by role for native fan-out.

## Deploy

```sh
cd workbench-live && ALLOW_DEPLOY=1 npx wrangler deploy
```

CI: `.github/workflows/deploy-workbench-live.yml` redeploys on any push to
`main` that touches `workbench-live/**`, provided the repo secret
`CLOUDFLARE_API_TOKEN` (Workers Scripts:Edit + Durable Objects) is set. Until
then the job skips green and the manual command above stays the fallback.

## Protocol

| Frame                      | Direction                   | Meaning                          |
| -------------------------- | --------------------------- | -------------------------------- |
| `{type:"board", snap}`     | teacher → server → students | latest board (live + on connect) |
| `{type:"count", students}` | server → teacher            | presence                         |
| `{type:"end"}`             | server → students           | last teacher left                |

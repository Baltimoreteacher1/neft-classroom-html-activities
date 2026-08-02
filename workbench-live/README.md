# Math Workbench — Live Board sync Worker

Standalone Cloudflare Worker that defines the **`BoardRoom`** Durable Object
powering the Math Workbench "Live Board" feature: teacher broadcast, opt-in
student work sharing, teacher annotation, page push, and Class Play.

A Durable Object cannot be defined inside the Cloudflare Pages project that
serves `eduwonderlab.com`, so it lives here as its own Worker. The frontend
(`curriculum/math-workbench/index.html`) connects to it directly over WebSocket:

```
wss://workbench-live.neftjd.workers.dev/live?code=<class-code>&role=<role>
```

## Design

- **Capability-protected teacher controls.** A 256-bit capability generated on
  the teacher device is required for `teacher` and `monitor` sockets. A class
  code alone cannot watch student work, annotate, push pages, or broadcast.
- **Student-controlled sharing.** Followers transmit no board data. A student
  who explicitly chooses **Share my work** sends their chosen first name,
  activity counts, thumbnail, and current board to that room's monitor.
- **Origin restricted.** Live sockets accept the production site, its owned
  Pages deployment host, and localhost development only.
- **One DO instance per code** (`idFromName(code)`).
- **Session-scoped storage.** The Durable Object temporarily stores the latest
  broadcast, active play question, and each opted-in sharer's board/thumbnail
  for reconnects. Student artifacts are deleted when sharing stops; broadcast
  state and the hashed host capability are deleted when their host leaves. No
  gradebook or answer history is created.
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

The v2–v4 monitor, Class Play, annotation, and page-push frames are documented
in `src/board-room.js`, which is the protocol source of truth.

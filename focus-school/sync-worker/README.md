# Focus School — real-time sync Worker

This Worker adds **instant, enterprise-grade cross-device sync** to the Focus
School planner (noam.eduwonderlab.com). It defines a **Durable Object**
(`SyncRoom`) that coordinates all of a user's devices through one
strongly-consistent actor and fans out every change over WebSockets in well
under a second.

It is **additive and safe**: the app already works with the existing Cloudflare
KV sync. Until this Worker is deployed *and* bound to the Pages project, the
`/api/live` endpoint returns `503` and every device automatically stays on the
(near-live) KV polling. Nothing breaks before provisioning; real-time simply
switches on once the two one-time steps below are done.

Durable Objects with SQLite storage are **free-tier eligible**, so this does not
require a paid plan for one user.

---

## Architecture

```
 phone  ─┐                         ┌─► KV (durable copy, cold-start snapshot)
 laptop ─┼─ wss://…/api/live ──► SyncRoom Durable Object
 chromebook ─┘   (Pages Function)      └─► broadcast to the other live devices
```

- **`src/sync-room.js`** — the `SyncRoom` Durable Object (one instance per sync
  code) + a standalone `fetch` entry. On each incoming state it does a
  last-write-wins persist into the **same** `NOAM_SCHOOL_KV` namespace the
  `/api/state` endpoint uses, then broadcasts to the other connected devices.
  A newly-connected device is handed the current KV snapshot immediately.
- **`../functions/api/live.js`** — a Pages Function that forwards the WebSocket
  upgrade to the `SYNC_ROOM` binding. Returns `503` when the binding is absent.
- **client (`../app.js`, the `live` object)** — opens `wss://<host>/api/live`,
  merges inbound states through the exact same conflict-safe merge as a KV pull,
  reconnects with capped backoff, and falls back to KV polling if the socket is
  unavailable.

---

## One-time provisioning (≈5 minutes)

### 1. Deploy the sync Worker

```bash
cd focus-school/sync-worker
npx wrangler deploy
```

This creates the Worker `focus-school-sync` and its `SyncRoom` Durable Object
namespace (via the `[[migrations]]` in `wrangler.toml`). The Worker is already
bound to the production KV namespace `NOAM_SCHOOL_KV`
(`59075911253f400f807345430425946c`) — the same store the site uses today.

### 2. Bind the Durable Object to the Pages project

In the Cloudflare dashboard:

1. **Workers & Pages** → open the **focus-school** Pages project (the one
   serving noam.eduwonderlab.com).
2. **Settings** → **Bindings** → **Add** → **Durable Object**.
3. **Variable name:** `SYNC_ROOM`
4. **Durable Object namespace:** select **`SyncRoom`** (from the
   `focus-school-sync` Worker you just deployed).
5. Save, then **redeploy** the Pages project (or push any commit) so the binding
   takes effect.

> The binding is added in the dashboard on purpose — it is **not** written into
> `focus-school/wrangler.toml`. That keeps the authoritative Pages config
> unchanged, so a Pages redeploy can never fail because the Worker wasn't ready.

That's it. Reload the planner on two devices linked to the same sync code and
checking a routine step on one shows up on the other essentially instantly. The
sync-status chip reads **Synced ✓**; if the socket ever drops, the app keeps
working on KV polling and reconnects automatically.

---

## Verifying real-time is live

- Open the app on two devices/tabs with the same sync code.
- Tick a routine step (or add a task) on device A.
- It should appear on device B in well under a second, with no manual refresh.
- Temporarily stop the Worker (or before step 2) → the app still syncs within a
  few seconds via KV, proving the fallback.

## Rolling back

Remove the `SYNC_ROOM` binding from the Pages project (dashboard) and/or
`npx wrangler delete` the Worker. The app immediately reverts to KV sync with no
code change. No data is lost — KV remains the durable source of truth.

/* Math Workbench — saved notebook storage.
 *
 * The notebook used to live in ONE localStorage value (~5 MB cap, rewritten in
 * full on every autosave). This keeps it in IndexedDB as one record per page,
 * writes only the pages that changed, and keeps:
 *   - rolling autosave versions (the last few full copies, for "undo a bad day"),
 *   - named saves ("My pages"),
 *   - the legacy `neft.mathWorkbench.v1` localStorage copy as a safety net and as
 *     the source for a one-time migration. It is never deleted or overwritten by
 *     the migration, so a student's existing notebook cannot be lost.
 *
 * Everything is injected (backend, localStorage, clock) so it runs under node.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.WBStore = api;
})(typeof window !== "undefined" ? window : globalThis, () => {
  "use strict";

  const LEGACY_KEY = "neft.mathWorkbench.v1";
  const MAX_VERSIONS = 5;
  const VERSION_EVERY_MS = 120000;
  const LS_FALLBACK_MAX = 1500000; // chars; larger notebooks rely on IndexedDB alone

  /* ---------------- backends ---------------- */
  function memoryBackend() {
    const stores = { meta: new Map(), pages: new Map(), versions: new Map(), saves: new Map() };
    const writes = [];
    return {
      writes,
      get: async (s, k) => stores[s].get(k),
      put: async (s, k, v) => {
        writes.push(`${s}:${k}`);
        stores[s].set(k, v);
      },
      del: async (s, k) => {
        stores[s].delete(k);
      },
      keys: async (s) => [...stores[s].keys()],
      all: async (s) => [...stores[s].values()],
    };
  }

  function idbBackend(idb) {
    let dbp = null;
    const open = () => {
      if (!dbp)
        dbp = new Promise((resolve, reject) => {
          const req = idb.open("neft-mathworkbench", 1);
          req.onupgradeneeded = () => {
            for (const name of ["meta", "pages", "versions", "saves"])
              req.result.createObjectStore(name);
          };
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error || new Error("indexeddb-open"));
          req.onblocked = () => reject(new Error("indexeddb-blocked"));
        });
      return dbp;
    };
    const run = (store, mode, fn) =>
      open().then(
        (db) =>
          new Promise((resolve, reject) => {
            const tx = db.transaction(store, mode);
            const st = tx.objectStore(store);
            let out;
            const r = fn(st);
            if (r) r.onsuccess = () => (out = r.result);
            tx.oncomplete = () => resolve(out);
            tx.onerror = () => reject(tx.error || new Error("indexeddb-tx"));
            tx.onabort = () => reject(tx.error || new Error("indexeddb-abort"));
          }),
      );
    return {
      get: (s, k) => run(s, "readonly", (st) => st.get(k)),
      put: (s, k, v) => run(s, "readwrite", (st) => st.put(v, k)),
      del: (s, k) => run(s, "readwrite", (st) => st.delete(k)),
      keys: (s) => run(s, "readonly", (st) => st.getAllKeys()),
      all: (s) => run(s, "readonly", (st) => st.getAll()),
    };
  }

  /* ---------------- store ---------------- */
  function create(opts) {
    const backend = opts.backend || null;
    const ls = opts.ls || null;
    const now = opts.now || (() => Date.now());
    const lsKey = opts.lsKey || LEGACY_KEY;
    const lastJson = new Map(); // pid -> json string last written
    let lastVersionAt = 0;
    let lastVersionJson = "";
    let pidCounter = 0;
    let chain = Promise.resolve();

    const newPid = () =>
      `p${now().toString(36)}${(pidCounter++).toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
    function lsRead() {
      try {
        const raw = ls && ls.getItem(lsKey);
        return raw || null;
      } catch (_) {
        return null;
      }
    }
    function lsWrite(json) {
      try {
        ls.setItem(lsKey, json);
        return true;
      } catch (_) {
        return false;
      }
    }
    const stampOf = (raw) => {
      try {
        return Number(JSON.parse(raw).savedAt) || 0;
      } catch (_) {
        return 0;
      }
    };

    /** Write the notebook. Resolves {ok, via:'idb'|'ls'|'none'}. Never throws. */
    function save(notebook) {
      const run = async () => {
        const stamp = now();
        const boards = notebook.boards;
        const seen = new Set();
        for (const b of boards) {
          if (!b.pid || seen.has(b.pid)) b.pid = newPid(); // copies of a page must not share a record
          seen.add(b.pid);
        }
        if (backend) {
          try {
            const order = [];
            for (const b of boards) {
              const json = JSON.stringify(b);
              order.push(b.pid);
              if (lastJson.get(b.pid) !== json) {
                await backend.put("pages", b.pid, { pid: b.pid, json, savedAt: stamp });
                lastJson.set(b.pid, json);
              }
            }
            for (const key of await backend.keys("pages")) {
              if (!order.includes(key)) {
                await backend.del("pages", key);
                lastJson.delete(key);
              }
            }
            await backend.put("meta", "current", {
              v: 2,
              active: notebook.active | 0,
              order,
              savedAt: stamp,
            });
            await maybeVersion(boards, notebook.active | 0, stamp);
            // keep the legacy copy fresh only when it is small enough to be cheap
            if (ls) {
              const total = order.reduce((n, pid) => n + (lastJson.get(pid) || "").length, 0);
              if (total <= LS_FALLBACK_MAX)
                lsWrite(
                  assemble(
                    notebook.active | 0,
                    order.map((pid) => lastJson.get(pid)),
                    stamp,
                  ),
                );
            }
            return { ok: true, via: "idb" };
          } catch (_) {
            // fall through to localStorage
          }
        }
        if (ls) {
          const json = JSON.stringify({
            v: 2,
            active: notebook.active | 0,
            boards,
            savedAt: stamp,
          });
          if (lsWrite(json)) return { ok: true, via: "ls" };
        }
        return { ok: false, via: "none" };
      };
      chain = chain.then(run, run);
      return chain;
    }

    const assemble = (active, jsons, stamp) =>
      `{"v":2,"active":${active | 0},"savedAt":${stamp || 0},"boards":[${jsons.join(",")}]}`;

    async function maybeVersion(boards, active, stamp) {
      if (stamp - lastVersionAt < VERSION_EVERY_MS) return;
      const json = assemble(
        active,
        boards.map((b) => JSON.stringify(b)),
        stamp,
      );
      if (json === lastVersionJson.replace(/"savedAt":\d+/, `"savedAt":${stamp}`)) return;
      lastVersionAt = stamp;
      lastVersionJson = json;
      const vid = `v${String(stamp).padStart(15, "0")}`;
      await backend.put("versions", vid, {
        id: vid,
        at: stamp,
        pages: boards.length,
        data: json,
      });
      const keys = (await backend.keys("versions")).sort();
      while (keys.length > MAX_VERSIONS) await backend.del("versions", keys.shift());
    }

    /** Newest saved notebook JSON (IndexedDB or the legacy copy), or null. */
    async function loadLatest() {
      const legacy = lsRead();
      let fromIdb = null;
      if (backend) {
        try {
          const meta = await backend.get("meta", "current");
          if (meta && Array.isArray(meta.order) && meta.order.length) {
            const jsons = [];
            for (const pid of meta.order) {
              const rec = await backend.get("pages", pid);
              if (!rec) throw new Error("missing-page");
              jsons.push(rec.json);
              lastJson.set(pid, rec.json);
            }
            fromIdb = { raw: assemble(meta.active, jsons, meta.savedAt), at: meta.savedAt || 0 };
          }
        } catch (_) {
          fromIdb = null;
        }
      }
      if (fromIdb && (!legacy || fromIdb.at >= stampOf(legacy))) return fromIdb.raw;
      if (legacy) {
        // One-time migration: copy the legacy notebook into IndexedDB, never delete it.
        if (backend && !fromIdb) {
          try {
            const nb = JSON.parse(legacy);
            const boards = Array.isArray(nb.boards) && nb.boards.length ? nb.boards : [nb];
            await save({ active: nb.active | 0, boards });
          } catch (_) {
            /* migration is best effort; the legacy copy still restores */
          }
        }
        return legacy;
      }
      return fromIdb ? fromIdb.raw : null;
    }

    /** Hold writes until `p` settles (the startup read), so a clean board never races it. */
    function holdUntil(p) {
      chain = chain.then(
        () => p,
        () => p,
      ).then(
        () => undefined,
        () => undefined,
      );
    }

    /** Keep a copy of the session that was open last time, as an autosave version. */
    async function archiveSession(raw) {
      if (!backend || !raw) return false;
      try {
        const nb = JSON.parse(raw);
        const worked = (nb.boards || []).some((b) => (b.strokes && b.strokes.length) || (b.objects && b.objects.length));
        if (!worked) return false;
        const at = now();
        const vid = `v${String(at).padStart(15, "0")}`;
        await backend.put("versions", vid, { id: vid, at, pages: nb.boards.length, data: raw, label: "last session" });
        const keys = (await backend.keys("versions")).sort();
        while (keys.length > MAX_VERSIONS) await backend.del("versions", keys.shift());
        return true;
      } catch (_) {
        return false;
      }
    }

    /** Synchronous last-chance copy for pagehide (IndexedDB may not finish). */
    function saveSync(notebook) {
      if (!ls) return false;
      let size = 0;
      for (const b of notebook.boards) size += (lastJson.get(b.pid) || "").length || 1;
      if (backend && size > LS_FALLBACK_MAX) return false;
      return lsWrite(
        JSON.stringify({
          v: 2,
          active: notebook.active | 0,
          boards: notebook.boards,
          savedAt: now(),
        }),
      );
    }

    /* ---- named saves + versions ---- */
    const listOf = async (store) => {
      if (!backend) return [];
      try {
        return (await backend.all(store))
          .map(({ data, ...meta }) => meta)
          .sort((a, b) => b.at - a.at);
      } catch (_) {
        return [];
      }
    };
    async function createSave(name, json, thumb) {
      if (!backend) throw new Error("no-storage");
      const at = now();
      const id = `s${at.toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;
      const pages = (() => {
        try {
          return JSON.parse(json).boards.length;
        } catch (_) {
          return 1;
        }
      })();
      await backend.put("saves", id, {
        id,
        name: String(name || "My pages").slice(0, 60),
        at,
        pages,
        data: json,
        thumb: thumb || "",
      });
      return id;
    }
    return {
      save,
      saveSync,
      holdUntil,
      archiveSession,
      loadLatest,
      listSaves: () => listOf("saves"),
      createSave,
      getSave: async (id) => (backend ? (await backend.get("saves", id)) || null : null),
      deleteSave: async (id) => backend && backend.del("saves", id),
      renameSave: async (id, name) => {
        const rec = backend && (await backend.get("saves", id));
        if (rec)
          await backend.put("saves", id, { ...rec, name: String(name || rec.name).slice(0, 60) });
      },
      listVersions: () => listOf("versions"),
      getVersion: async (id) => (backend ? (await backend.get("versions", id)) || null : null),
      available: () => !!backend,
    };
  }

  return { create, memoryBackend, idbBackend, LEGACY_KEY, MAX_VERSIONS };
});

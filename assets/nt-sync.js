/**
 * nt-sync.js — offline-first result syncing for Neft activities.
 *
 * EXTENDS the existing nt-results.js layer (the `nt_`-prefixed storage family;
 * `nt_` is the current name for what older EduWonderLab docs called `ewl_`).
 * It does NOT rewrite NTResults — it wraps NTResults.finish so any activity
 * already calling finish() also queues a privacy-safe result for the backend.
 *
 * Guarantees:
 *   - NEVER blocks the activity: enqueue is a synchronous localStorage write;
 *     the network flush is fire-and-forget.
 *   - Works fully offline: results queue in localStorage["nt_sync_queue"] and
 *     flush automatically on reconnect.
 *   - NO PII: the student's typed NAME (NTResults `student`) is never sent.
 *     Submissions carry student_ref only (roster number / handle).
 *   - Idempotent: every queued result gets a UUID; the server dedupes on it, so
 *     repeated flushes never double-count.
 *   - Visible status: a pill shows Synced / Pending(n) / Failed — never silent.
 *
 * Activity sets config before loading this script:
 *   window.NT_SYNC = {
 *     endpoint: "https://neft-results-dev.<acct>.workers.dev",
 *     teacher_id: "neft", class_code: "P3-MATH", write_key: "WRITEKEY",
 *     activity_slug: "unit2-review", standard: "6.NOS.1"
 *   };
 * Then on completion the wrapped NTResults.finish(...) auto-queues, or call
 *   NTSync.record({ score, total, misconception_tags: [...] })
 */
(function (global) {
  "use strict";

  var QUEUE_KEY = "nt_sync_queue"; // nt_ prefix preserved
  var REF_KEY = "nt_student_ref";
  var ANON_KEY = "nt_anon_id"; // stable per-device id, shared with NeftIdentity
  var cfg = global.NT_SYNC || {};
  var flushing = false;

  function uuid() {
    if (global.crypto && global.crypto.randomUUID) return global.crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0,
        v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function readQueue() {
    try {
      return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
    } catch (_e) {
      return [];
    }
  }
  function writeQueue(q) {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
    } catch (_e) {}
  }

  /* student_ref: the alias/handle the student already typed elsewhere. Seamless
   * by design — no mid-activity prompt. Prefers the shared site-wide identity,
   * then any stored handle, then a stable per-device id (teacher maps it later
   * via the gradebook, exactly like save codes). */
  function studentRef() {
    if (cfg.student_ref) return String(cfg.student_ref);
    if (global.NeftIdentity) {
      var name = global.NeftIdentity.get().name;
      if (name) return name;
    }
    var r = "";
    try {
      r = localStorage.getItem(REF_KEY) || "";
    } catch (_e) {}
    if (r) return r;
    if (global.NeftIdentity) return global.NeftIdentity.studentId();
    // No shared identity on this page: use a stable per-device anon id so each
    // device stays distinct (not the shared "anon"). Stored under its own key,
    // NOT REF_KEY, so it never gets read back as a real student name.
    var anon = "";
    try {
      anon = localStorage.getItem(ANON_KEY) || "";
    } catch (_e) {}
    if (!anon) {
      anon = "anon-" + uuid().slice(0, 8);
      try {
        localStorage.setItem(ANON_KEY, anon);
      } catch (_e) {}
    }
    return anon;
  }

  /* Normalize a standard to the canonical key used by data/ccss-standards.json
     and lessons/<id>/config.json — "6.AT.1", "6.AT.3a", "6.GR.1".

     WHY: the stored `standard` is a JOIN KEY. functions/api/progress groups
     game_scores and lesson_telemetry into the same per-standard cell for the
     teacher standards matrix. But most activities author this field as a DISPLAY
     label — "6.GR.A.4 · Nets & Surface Area", "6.NOS.C.5–7 · Integers…", and one
     retired CCSS range, "6.RP.A.1-3" — so the rows never matched each other or
     the standards registry. Normalizing here fixes every producer at once and
     leaves the authored label untouched for anything that renders it.

     Page badges carry a cluster letter ("6.AT.A.1") and the registry does not,
     so the cluster letter is dropped. A label naming several standards yields
     the first one — a single column cannot hold a range, and the first is the
     anchor standard in every current case. Legacy CCSS codes keep their domain
     (translating RP/NS/EE -> AT/NOS needs the crosswalk table, which is not
     available client-side); only the shape is normalized. */
  function normalizeStandard(raw) {
    var s = String(raw == null ? "" : raw).trim();
    if (!s) return null;
    var m = s.match(/\b(\d)\.([A-Z]{1,3})(?:\.([A-Z]))?\.(\d+[a-z]?)\b/i);
    if (!m) return null; // prose with no code -> null, never store the label
    return m[1] + "." + m[2].toUpperCase() + "." + m[4].toLowerCase();
  }

  /* Enqueue a privacy-safe result. Synchronous; returns immediately. */
  function record(result) {
    var item = {
      id: uuid(),
      teacher_id: cfg.teacher_id,
      class_code: cfg.class_code,
      student_ref: studentRef(),
      activity_slug: cfg.activity_slug || (result && result.activity_slug) || "unknown",
      standard: normalizeStandard(cfg.standard || (result && result.standard)),
      score: result.score,
      total: result.total,
      misconception_tags: Array.isArray(result.misconception_tags) ? result.misconception_tags : [],
      attempt_timestamp: new Date().toISOString(),
    };
    if (!item.teacher_id || !item.class_code) {
      // Misconfigured activity: keep working, just show that sync is off.
      setStatus("failed", "Sync not configured");
      return;
    }
    var q = readQueue();
    q.push(item);
    writeQueue(q);
    setStatus("pending", null);
    flush(); // fire-and-forget
  }

  /* Flush the queue to the Worker. Safe to call anytime; dedup is server-side. */
  function flush() {
    if (flushing || !cfg.endpoint) return;
    var q = readQueue();
    if (!q.length) {
      setStatus("synced", null);
      return;
    }
    if (!global.navigator.onLine) {
      setStatus("pending", null);
      return;
    }
    flushing = true;
    var batch = q.slice(0, 50);
    global
      .fetch(cfg.endpoint.replace(/\/$/, "") + "/results", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-write-key": cfg.write_key || "",
        },
        body: JSON.stringify(batch),
        keepalive: true,
      })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        // Accepted (or server-deduped): drop this batch from the queue.
        var sent = {};
        batch.forEach(function (b) {
          sent[b.id] = true;
        });
        writeQueue(
          readQueue().filter(function (b) {
            return !sent[b.id];
          }),
        );
        flushing = false;
        var left = readQueue().length;
        setStatus(left ? "pending" : "synced", null);
        if (left) flush();
      })
      .catch(function (err) {
        flushing = false;
        setStatus("failed", String((err && err.message) || err));
      });
  }

  /* -------- visible status pill (synced / pending / failed) -------- */
  function pill() {
    var el = document.getElementById("nt-sync-pill");
    if (el) return el;
    el = document.createElement("div");
    el.id = "nt-sync-pill";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    el.style.cssText =
      "position:fixed;right:12px;bottom:12px;z-index:99999;font:600 12px/1.2 system-ui,sans-serif;" +
      "padding:8px 12px;border-radius:999px;min-height:32px;display:inline-flex;align-items:center;" +
      "gap:6px;box-shadow:0 6px 18px -6px rgba(0,0,0,.5);cursor:pointer;";
    el.addEventListener("click", flush); // tap to retry now
    (document.body || document.documentElement).appendChild(el);
    return el;
  }
  function setStatus(state, detail) {
    var p = pill();
    var n = readQueue().length;
    var map = {
      synced: ["#10351f", "#7bdcb5", "✓ Synced"],
      pending: ["#3a2410", "#ffd9b3", "⏳ Pending" + (n ? " (" + n + ")" : "")],
      failed: ["#3a1414", "#ffb3b3", "⚠ Sync failed — tap to retry"],
    };
    var m = map[state] || map.pending;
    p.style.background = m[0];
    p.style.color = m[1];
    p.style.border = "1px solid " + m[1];
    p.textContent = m[2];
    if (detail) p.title = detail;
  }

  /* -------- wrap NTResults.finish so existing activities auto-sync -------- */
  function wrapNTResults() {
    var NT = global.NTResults;
    if (!NT || NT.__syncWrapped) return;
    var orig = NT.finish;
    NT.finish = function (opts) {
      try {
        orig && orig.apply(NT, arguments);
      } catch (_e) {}
      try {
        // Derive score/total from opts (never reads opts.student — that's PII).
        var correct = opts.correct,
          total = opts.total;
        if ((correct == null || total == null) && Array.isArray(opts.sections)) {
          correct = opts.sections.reduce(function (a, s) {
            return a + (s.correct || 0);
          }, 0);
          total = opts.sections.reduce(function (a, s) {
            return a + (s.total || 0);
          }, 0);
        }
        record({
          score: correct,
          total: total,
          standard: opts.standard,
          activity_slug: cfg.activity_slug,
          misconception_tags: opts.misconception_tags || [],
        });
      } catch (_e) {}
    };
    NT.__syncWrapped = true;
  }

  // Flush triggers: reconnect, load, periodic.
  global.addEventListener("online", flush);
  global.addEventListener("load", function () {
    wrapNTResults();
    setStatus(readQueue().length ? "pending" : "synced", null);
    flush();
  });
  setInterval(flush, 30000);
  wrapNTResults();

  global.NTSync = {
    record: record,
    flush: flush,
    queue: readQueue,
    studentRef: studentRef,
  };
})(window);

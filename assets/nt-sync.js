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
 *     activity_slug: "unit2-review", standard: "6.NS.1"
 *   };
 * Then on completion the wrapped NTResults.finish(...) auto-queues, or call
 *   NTSync.record({ score, total, misconception_tags: [...] })
 */
(function (global) {
  "use strict";

  var QUEUE_KEY = "nt_sync_queue"; // nt_ prefix preserved
  var REF_KEY = "nt_student_ref";
  var cfg = global.NT_SYNC || {};
  var flushing = false;

  function uuid() {
    if (global.crypto && global.crypto.randomUUID)
      return global.crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        var r = (Math.random() * 16) | 0,
          v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      },
    );
  }

  function readQueue() {
    try {
      return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
    } catch (e) {
      return [];
    }
  }
  function writeQueue(q) {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
    } catch (e) {}
  }

  /* student_ref: a roster number or self-chosen handle — NEVER the real name. */
  function studentRef() {
    if (cfg.student_ref) return String(cfg.student_ref);
    var r = "";
    try {
      r = localStorage.getItem(REF_KEY) || "";
    } catch (e) {}
    if (!r) {
      r = (
        global.prompt(
          "Enter your class number or handle (NOT your name):",
          "",
        ) || ""
      ).trim();
      if (r) {
        try {
          localStorage.setItem(REF_KEY, r);
        } catch (e) {}
      }
    }
    return r || "anon";
  }

  /* Enqueue a privacy-safe result. Synchronous; returns immediately. */
  function record(result) {
    var item = {
      id: uuid(),
      teacher_id: cfg.teacher_id,
      class_code: cfg.class_code,
      student_ref: studentRef(),
      activity_slug:
        cfg.activity_slug || (result && result.activity_slug) || "unknown",
      standard: cfg.standard || (result && result.standard) || null,
      score: result.score,
      total: result.total,
      misconception_tags: Array.isArray(result.misconception_tags)
        ? result.misconception_tags
        : [],
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
      } catch (e) {}
      try {
        // Derive score/total from opts (never reads opts.student — that's PII).
        var correct = opts.correct,
          total = opts.total;
        if (
          (correct == null || total == null) &&
          Array.isArray(opts.sections)
        ) {
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
      } catch (e) {}
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

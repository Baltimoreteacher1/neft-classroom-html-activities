/**
 * EWLScoreBridge v2.0 — client score bridge for edupulse-gradebook.
 *
 * What changed vs v1.0:
 *   - flush() now does a REAL CORS fetch (was mode:'no-cors') with the
 *     `x-ingest-key` header, parses the JSON response, and only marks events
 *     as sent when the Worker confirms { ok: true }. This is a true delivery
 *     guarantee — the whole reason we moved to Worker + D1.
 *
 * Kept from v1.0:
 *   - localStorage queue (ewl_ prefix) with an in-memory fallback wrapper
 *   - offline retry: auto-flush on the window 'online' event
 *   - exportCSV(), identify(), record()
 *
 * Usage (3-line game wire-up):
 *   const bridge = new EWLScoreBridge({ apiBase: 'https://<worker>', ingestKey: '<INGEST_KEY>' });
 *   bridge.identify({ studentId, studentName, classPeriod, deviceId });
 *   bridge.record({ activityId, activityTitle, standard, score, maxScore, stars, problemsCorrect, problemsAttempted, misconceptions, durationSec });
 *
 * The INGEST_KEY is write-only by design: even though it ships in the client,
 * it cannot read or export data (see README security model).
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.EWLScoreBridge = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var QUEUE_KEY = "ewl_score_queue";
  var IDENTITY_KEY = "ewl_identity";

  /* --- storage wrapper: localStorage with in-memory fallback --- */
  function makeStorage() {
    var mem = {};
    var ok = false;
    try {
      var k = "ewl_test_" + Math.random();
      window.localStorage.setItem(k, "1");
      window.localStorage.removeItem(k);
      ok = true;
    } catch (e) {
      ok = false;
    }
    if (ok) {
      return {
        get: function (key) {
          try { return window.localStorage.getItem(key); } catch (e) { return mem[key] || null; }
        },
        set: function (key, val) {
          try { window.localStorage.setItem(key, val); } catch (e) { mem[key] = val; }
        },
        remove: function (key) {
          try { window.localStorage.removeItem(key); } catch (e) { delete mem[key]; }
        },
      };
    }
    return {
      get: function (key) { return Object.prototype.hasOwnProperty.call(mem, key) ? mem[key] : null; },
      set: function (key, val) { mem[key] = String(val); },
      remove: function (key) { delete mem[key]; },
    };
  }

  function uuid() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function EWLScoreBridge(opts) {
    opts = opts || {};
    this.apiBase = (opts.apiBase || "").replace(/\/+$/, "");
    this.ingestKey = opts.ingestKey || "";
    this.endpoint = this.apiBase + "/api/scores";
    this.autoFlush = opts.autoFlush !== false; // default true
    this.storage = makeStorage();
    this.identity = this._loadIdentity();
    this._flushing = false;

    var self = this;
    if (typeof window !== "undefined" && window.addEventListener) {
      window.addEventListener("online", function () { self.flush(); });
    }
    if (this.autoFlush) {
      // best-effort flush of anything left over from a previous session
      this.flush();
    }
  }

  EWLScoreBridge.prototype._loadIdentity = function () {
    var raw = this.storage.get(IDENTITY_KEY);
    if (!raw) return {};
    try { return JSON.parse(raw); } catch (e) { return {}; }
  };

  EWLScoreBridge.prototype._readQueue = function () {
    var raw = this.storage.get(QUEUE_KEY);
    if (!raw) return [];
    try { var arr = JSON.parse(raw); return Array.isArray(arr) ? arr : []; }
    catch (e) { return []; }
  };

  EWLScoreBridge.prototype._writeQueue = function (arr) {
    this.storage.set(QUEUE_KEY, JSON.stringify(arr));
  };

  /* identify(): set / merge persistent student + device identity. */
  EWLScoreBridge.prototype.identify = function (info) {
    info = info || {};
    if (!info.deviceId && !this.identity.deviceId) info.deviceId = uuid();
    this.identity = Object.assign({}, this.identity, info);
    this.storage.set(IDENTITY_KEY, JSON.stringify(this.identity));
    return this.identity;
  };

  /* record(): build an event, enqueue it, and (by default) flush. */
  EWLScoreBridge.prototype.record = function (data) {
    data = data || {};
    var score = data.score != null ? Number(data.score) : null;
    var maxScore = data.maxScore != null ? Number(data.maxScore) : null;
    var percent = data.percent != null ? Number(data.percent)
      : (score != null && maxScore ? Math.round((score / maxScore) * 1000) / 10 : null);

    var event = {
      eventId: data.eventId || uuid(),
      timestamp: data.timestamp || new Date().toISOString(),
      deviceId: data.deviceId || this.identity.deviceId || null,
      studentId: data.studentId || this.identity.studentId || null,
      studentName: data.studentName || this.identity.studentName || null,
      classPeriod: data.classPeriod || this.identity.classPeriod || null,
      activityId: data.activityId || null,
      activityTitle: data.activityTitle || null,
      standard: data.standard || null,
      score: score,
      maxScore: maxScore,
      percent: percent,
      stars: data.stars != null ? Number(data.stars) : null,
      problemsCorrect: data.problemsCorrect != null ? Number(data.problemsCorrect) : null,
      problemsAttempted: data.problemsAttempted != null ? Number(data.problemsAttempted) : null,
      misconceptions: Array.isArray(data.misconceptions)
        ? data.misconceptions.join("|")
        : (data.misconceptions || null),
      durationSec: data.durationSec != null ? Number(data.durationSec) : null,
    };

    var queue = this._readQueue();
    queue.push(event);
    this._writeQueue(queue);

    if (this.autoFlush) this.flush();
    return event;
  };

  /* flush(): real CORS POST; only dequeue events the Worker confirms. */
  EWLScoreBridge.prototype.flush = function () {
    var self = this;
    if (this._flushing) return Promise.resolve({ ok: false, reason: "busy" });
    var queue = this._readQueue();
    if (queue.length === 0) return Promise.resolve({ ok: true, written: 0, skipped: 0 });
    if (typeof fetch === "undefined") return Promise.resolve({ ok: false, reason: "no-fetch" });

    this._flushing = true;
    var batch = queue.slice(0, 500);

    return fetch(this.endpoint, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        "x-ingest-key": this.ingestKey,
      },
      body: JSON.stringify({ events: batch }),
    })
      .then(function (res) { return res.json().then(function (body) { return { res: res, body: body }; }); })
      .then(function (r) {
        if (r.res.ok && r.body && r.body.ok === true) {
          // Confirmed delivery: drop the events we just sent.
          var remaining = self._readQueue().slice(batch.length);
          self._writeQueue(remaining);
          self._flushing = false;
          // If more remain (queue > 500 or new events arrived), keep going.
          if (remaining.length > 0) self.flush();
          return r.body;
        }
        // Not confirmed: keep the queue intact for retry.
        self._flushing = false;
        return { ok: false, reason: "rejected", status: r.res.status, body: r.body };
      })
      .catch(function (err) {
        // Network error (offline): keep queue, will retry on 'online'.
        self._flushing = false;
        return { ok: false, reason: "network", error: String(err) };
      });
  };

  /* exportCSV(): local CSV of the pending queue (client-side convenience). */
  EWLScoreBridge.prototype.exportCSV = function () {
    var cols = [
      "eventId", "timestamp", "deviceId", "studentId", "studentName", "classPeriod",
      "activityId", "activityTitle", "standard", "score", "maxScore", "percent",
      "stars", "problemsCorrect", "problemsAttempted", "misconceptions", "durationSec",
    ];
    function esc(v) {
      if (v == null) return "";
      var s = String(v);
      return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }
    var queue = this._readQueue();
    var lines = [cols.join(",")];
    queue.forEach(function (e) {
      lines.push(cols.map(function (c) { return esc(e[c]); }).join(","));
    });
    return "﻿" + lines.join("\r\n") + "\r\n";
  };

  EWLScoreBridge.prototype.pendingCount = function () {
    return this._readQueue().length;
  };

  EWLScoreBridge.version = "2.0";
  return EWLScoreBridge;
});

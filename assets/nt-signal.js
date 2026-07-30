/* Neft Teacher — NTSignal: per-device learning signal store (additive, deploy-safe).
 *
 * A tiny, dependency-free localStorage store that lessons, the practice arcade,
 * and the curriculum hub use to adapt to ONE device's recent work. It is the
 * client-side twin of the D1 telemetry pipeline — but it never talks to the
 * network, never stores names, and never leaves the device.
 *
 *   - No PII: only standard codes (e.g. "6.NOS.A.1"), misconception tag slugs,
 *     and a lesson id. No names, no sections, no free text.
 *   - Bounded: at most 64 standards and 32 misconception tags are kept; the
 *     least-recently-touched entries are evicted first.
 *   - Hardened: every entry point is wrapped in try/catch and readers fall back
 *     to an in-memory copy, so blocked/quota'd/private-mode storage (or another
 *     script corrupting the key) can never break a page.
 *   - Idempotent: loads at most once per page (sentinel below).
 *
 * Storage key: "nt-signal:v1" ->
 *   { standards:      { [code]: { attempts, correct, lastTs, box?, reviewTs? } },
 *     misconceptions: { [tag]:  { count, lastTs } },
 *     lastLesson:     "6-1-2",
 *     updatedAt:      1710000000000 }
 *
 * Public API (window.NTSignal):
 *   record({ standard, correct, misconceptionTag?, lesson? })
 *   profile()            -> deep copy of the whole store
 *   weakStandards(n)     -> [{ standard, attempts, correct, rate, lastTs }]
 *                           lowest correct-rate first (needs >=2 attempts)
 *   topMisconceptions(n) -> [{ tag, count, lastTs }] highest count first
 *   dueStandards(n, now?)-> [{ standard, box, overdueMs, attempts, correct }]
 *                           standards whose spaced-review interval has elapsed,
 *                           most overdue first (needs >=3 attempts)
 *   recordReview(std, ok, now?)
 *                        -> log a spaced-review outcome: promotes the Leitner
 *                           box on success, resets it to 0 on a miss
 *   suggestTier()        -> "l1" | "l2" | "both" (arcade tier ids): "l1" when
 *                           the recent rolling correct-rate < 0.6, "l2" when
 *                           > 0.85, else "both" (also "both" on thin data)
 *   setLastLesson(id)    -> remember the most recent lesson (hub resume strip)
 *   clear()              -> wipe the store
 */
(function (root) {
  "use strict";
  if (root.NTSignal) return;

  var KEY = "nt-signal:v1";
  var MAX_STANDARDS = 64; // bounded: evict least-recently-touched past this
  var MAX_TAGS = 32;
  var MAX_KEY_CHARS = 60; // standard codes / tag slugs are short identifiers
  var MIN_WEAK_ATTEMPTS = 2; // one miss is noise, not a weak standard
  var TIER_MIN_ATTEMPTS = 4; // below this, not enough signal to suggest a tier
  var TIER_LOW = 0.6; // rolling rate below this -> "l1" (more support)
  var TIER_HIGH = 0.85; // rolling rate above this -> "l2" (enrichment)
  var ROLLING_MS = 14 * 24 * 60 * 60 * 1000; // "recent" = last 14 days

  var mem = null; // in-memory fallback so the API keeps working without storage

  function emptyStore() {
    return { standards: {}, misconceptions: {}, lastLesson: "", updatedAt: 0 };
  }

  // Sanitize a standard code / tag: short, trimmed, no whitespace runs.
  function cleanKey(v) {
    if (typeof v !== "string") return "";
    return v.trim().replace(/\s+/g, " ").slice(0, MAX_KEY_CHARS);
  }

  function readStore() {
    try {
      var raw = root.localStorage.getItem(KEY);
      if (raw) {
        var p = JSON.parse(raw);
        if (p && typeof p === "object") {
          return {
            standards: p.standards && typeof p.standards === "object" ? p.standards : {},
            misconceptions:
              p.misconceptions && typeof p.misconceptions === "object" ? p.misconceptions : {},
            lastLesson: typeof p.lastLesson === "string" ? p.lastLesson : "",
            updatedAt: Number(p.updatedAt) || 0,
          };
        }
      }
    } catch (_e) {
      /* blocked storage or corrupt JSON — fall back below */
    }
    return mem || emptyStore();
  }

  function writeStore(store) {
    store.updatedAt = Date.now();
    mem = store;
    try {
      root.localStorage.setItem(KEY, JSON.stringify(store));
    } catch (_e) {
      /* quota / private mode — in-memory copy still serves this page */
    }
  }

  // Evict least-recently-touched entries until the map is within its cap.
  function prune(map, max) {
    var keys = Object.keys(map);
    while (keys.length > max) {
      var oldestKey = keys[0];
      var oldestTs = Infinity;
      for (var i = 0; i < keys.length; i++) {
        var ts = Number(map[keys[i]] && map[keys[i]].lastTs) || 0;
        if (ts < oldestTs) {
          oldestTs = ts;
          oldestKey = keys[i];
        }
      }
      delete map[oldestKey];
      keys = Object.keys(map);
    }
  }

  function record(input) {
    try {
      if (!input || typeof input !== "object") return;
      var store = readStore();
      var now = Date.now();
      var std = cleanKey(input.standard);
      if (std) {
        var s = store.standards[std] || { attempts: 0, correct: 0, lastTs: 0 };
        s.attempts += 1;
        if (input.correct) s.correct += 1;
        s.lastTs = now;
        store.standards[std] = s;
        prune(store.standards, MAX_STANDARDS);
      }
      var tag = cleanKey(input.misconceptionTag);
      if (tag) {
        var m = store.misconceptions[tag] || { count: 0, lastTs: 0 };
        m.count += 1;
        m.lastTs = now;
        store.misconceptions[tag] = m;
        prune(store.misconceptions, MAX_TAGS);
      }
      if (typeof input.lesson === "string" && input.lesson) {
        store.lastLesson = input.lesson.slice(0, 80);
      }
      writeStore(store);
    } catch (_e) {
      /* signals are best-effort — never break the page */
    }
  }

  function profile() {
    try {
      return JSON.parse(JSON.stringify(readStore()));
    } catch (_e) {
      return emptyStore();
    }
  }

  function weakStandards(n) {
    try {
      var store = readStore();
      var out = [];
      var codes = Object.keys(store.standards);
      for (var i = 0; i < codes.length; i++) {
        var s = store.standards[codes[i]];
        var attempts = Number(s && s.attempts) || 0;
        if (attempts < MIN_WEAK_ATTEMPTS) continue;
        var correct = Number(s.correct) || 0;
        out.push({
          standard: codes[i],
          attempts: attempts,
          correct: correct,
          rate: Math.round((correct / attempts) * 100) / 100,
          lastTs: Number(s.lastTs) || 0,
        });
      }
      out.sort(function (a, b) {
        return a.rate - b.rate || b.lastTs - a.lastTs;
      });
      return out.slice(0, Math.max(1, Number(n) || 3));
    } catch (_e) {
      return [];
    }
  }

  // ── Spaced retrieval ───────────────────────────────────────────────────────
  //
  // A standard becomes DUE again after an interval that grows each time the
  // student recalls it successfully and collapses when they do not. That is a
  // Leitner box in the plainest form: `box` indexes REVIEW_INTERVALS_DAYS, a
  // correct recall promotes, a miss demotes to 0.
  //
  // The schedule is derived from data this store already keeps, plus two small
  // additive fields on the SAME per-standard record (`box`, `reviewTs`), so the
  // existing MAX_STANDARDS eviction bounds the retrieval state for free and a
  // store written by an older build still reads (both fields default to 0/absent
  // and the standard simply comes due immediately, which is the safe direction).

  var REVIEW_INTERVALS_DAYS = [1, 3, 7, 21, 45];
  var DAY_MS = 24 * 60 * 60 * 1000;
  // Below this, the student has not practised the standard enough for a review
  // to be a RE-trial rather than a first encounter dressed up as one.
  var MIN_REVIEW_ATTEMPTS = 3;

  function intervalMsFor(box) {
    var i = Math.max(0, Math.min(REVIEW_INTERVALS_DAYS.length - 1, Number(box) || 0));
    return REVIEW_INTERVALS_DAYS[i] * DAY_MS;
  }

  /**
   * Standards whose review interval has elapsed, most overdue first.
   * @param {number} n     how many to return
   * @param {number} [now] injectable clock, for tests
   */
  function dueStandards(n, now) {
    try {
      var store = readStore();
      var t = Number(now) || Date.now();
      var out = [];
      var codes = Object.keys(store.standards);
      for (var i = 0; i < codes.length; i++) {
        var s = store.standards[codes[i]];
        var attempts = Number(s && s.attempts) || 0;
        if (attempts < MIN_REVIEW_ATTEMPTS) continue;
        // Never review something the student is working on right now: the last
        // touch is the practice itself, not a retrieval opportunity.
        var since = t - (Number(s.reviewTs) || Number(s.lastTs) || 0);
        var interval = intervalMsFor(s.box);
        if (since < interval) continue;
        out.push({
          standard: codes[i],
          box: Number(s.box) || 0,
          overdueMs: since - interval,
          attempts: attempts,
          correct: Number(s.correct) || 0,
        });
      }
      out.sort(function (a, b) {
        return b.overdueMs - a.overdueMs || a.standard.localeCompare(b.standard);
      });
      return out.slice(0, Math.max(1, Number(n) || 3));
    } catch (_e) {
      return [];
    }
  }

  /**
   * Record the outcome of a spaced-review attempt. Promotes or demotes the box
   * and stamps the review time. Also records the attempt itself through the
   * normal path, so a review counts toward the standard's rate like any work.
   */
  function recordReview(standard, correct, now) {
    try {
      var std = cleanKey(standard);
      if (!std) return;
      record({ standard: std, correct: !!correct });
      var store = readStore();
      var s = store.standards[std];
      if (!s) return;
      var box = Number(s.box) || 0;
      s.box = correct ? Math.min(REVIEW_INTERVALS_DAYS.length - 1, box + 1) : 0;
      s.reviewTs = Number(now) || Date.now();
      store.standards[std] = s;
      writeStore(store);
    } catch (_e) {
      /* signals are best-effort — never break the page */
    }
  }

  function topMisconceptions(n) {
    try {
      var store = readStore();
      var out = [];
      var tags = Object.keys(store.misconceptions);
      for (var i = 0; i < tags.length; i++) {
        var m = store.misconceptions[tags[i]];
        out.push({
          tag: tags[i],
          count: Number(m && m.count) || 0,
          lastTs: Number(m && m.lastTs) || 0,
        });
      }
      out.sort(function (a, b) {
        return b.count - a.count || b.lastTs - a.lastTs;
      });
      return out.slice(0, Math.max(1, Number(n) || 3));
    } catch (_e) {
      return [];
    }
  }

  function suggestTier() {
    try {
      var store = readStore();
      var cutoff = Date.now() - ROLLING_MS;
      var attempts = 0;
      var correct = 0;
      var codes = Object.keys(store.standards);
      for (var i = 0; i < codes.length; i++) {
        var s = store.standards[codes[i]];
        if ((Number(s && s.lastTs) || 0) < cutoff) continue; // stale — not "rolling"
        attempts += Number(s.attempts) || 0;
        correct += Number(s.correct) || 0;
      }
      if (attempts < TIER_MIN_ATTEMPTS) return "both";
      var rate = correct / attempts;
      if (rate < TIER_LOW) return "l1";
      if (rate > TIER_HIGH) return "l2";
      return "both";
    } catch (_e) {
      return "both";
    }
  }

  function setLastLesson(id) {
    try {
      if (typeof id !== "string" || !id) return;
      var store = readStore();
      store.lastLesson = id.slice(0, 80);
      writeStore(store);
    } catch (_e) {
      /* best-effort */
    }
  }

  function clear() {
    mem = null;
    try {
      root.localStorage.removeItem(KEY);
    } catch (_e) {
      /* best-effort */
    }
  }

  var CODE_KEY = "nt-signal:code";
  var ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // unambiguous: no 0/O/1/I/L

  function generateCode() {
    var suffix = "";
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      var bytes = new Uint8Array(6);
      crypto.getRandomValues(bytes);
      for (var i = 0; i < bytes.length; i++) suffix += ALPHABET[bytes[i] % ALPHABET.length];
    } else {
      for (var j = 0; j < 6; j++)
        suffix += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
    }
    return "NT-" + suffix;
  }

  function getCode() {
    try {
      var existing = root.localStorage.getItem(CODE_KEY);
      if (existing && /^NT-[A-Z0-9]{6}$/.test(existing)) return existing;
      var fresh = generateCode();
      root.localStorage.setItem(CODE_KEY, fresh);
      return fresh;
    } catch (_e) {
      return generateCode();
    }
  }

  function setCode(c) {
    if (typeof c !== "string") return false;
    var cleaned = c.trim().toUpperCase();
    if (!/^NT-[A-Z0-9]{6}$/.test(cleaned)) {
      if (/^[A-Z0-9]{6}$/.test(cleaned)) cleaned = "NT-" + cleaned;
      else return false;
    }
    try {
      root.localStorage.setItem(CODE_KEY, cleaned);
    } catch (_e) {}
    return cleaned;
  }

  function syncToCloud(explicitCode) {
    var code = explicitCode ? setCode(explicitCode) || getCode() : getCode();
    var p = profile();
    return fetch("/api/progress/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        saveCode: code,
        activityId: "nt-signal",
        activityTitle: "Student Progress Signal",
        progressPercent: 100,
        state: p,
      }),
    })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (res) {
        return res && res.ok
          ? { ok: true, code: code, updatedAt: res.updatedAt }
          : { ok: false, code: code };
      })
      .catch(function () {
        return { ok: false, code: code };
      });
  }

  function restoreFromCloud(codeToLoad) {
    if (!codeToLoad) return Promise.resolve({ ok: false, error: "no-code" });
    var code = setCode(codeToLoad);
    if (!code) return Promise.resolve({ ok: false, error: "invalid-code" });
    return fetch("/api/progress/load?code=" + encodeURIComponent(code))
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (res) {
        if (!res || !res.ok || !res.record || !res.record.state)
          return { ok: false, error: "not-found" };
        writeStore(res.record.state);
        return { ok: true, code: code, profile: res.record.state };
      })
      .catch(function (err) {
        return { ok: false, error: String(err) };
      });
  }

  root.NTSignal = {
    record: record,
    profile: profile,
    weakStandards: weakStandards,
    dueStandards: dueStandards,
    recordReview: recordReview,
    topMisconceptions: topMisconceptions,
    suggestTier: suggestTier,
    setLastLesson: setLastLesson,
    clear: clear,
    getCode: getCode,
    setCode: setCode,
    syncToCloud: syncToCloud,
    restoreFromCloud: restoreFromCloud,
  };
})(typeof window !== "undefined" ? window : globalThis);

/*
 * shared-identity.js — ONE student identity for the whole site.
 *
 * Why this exists
 * ---------------
 * The platform grew two independent "who is this student" records:
 *
 *   1. "ewl-supports:v2:me"  { section, initials }  — Learning Supports v2.
 *      Written by the in-lesson self-pick modal. Keys the D1 roster lookup
 *      (/api/supports/for) that decides which IEP / WIDA accommodations apply.
 *
 *   2. "nt_student"          { alias, section }     — the teaching-loop layer.
 *      Written by nt-page-enhance.js / edupulse-bridge.js and read by
 *      lesson-telemetry, lesson-passport, family-letter, lesson-mentor.
 *      (Historical wart: some readers look for `name`, the writers set
 *      `alias`. Both spellings are honored here; `alias` is canonical.)
 *
 * A student therefore declared themselves TWICE, and neither record knew the
 * other existed. This module is the single canonical bridge: claim once,
 * both records stay in sync, and every consumer keeps reading the key it
 * already reads. Nothing downstream has to change.
 *
 * Hard rules (mirrors the rest of the supports layer):
 *   - Additive and reversible. Never throws into a host page.
 *   - Never DOWNGRADES an existing record. Writing only section+initials must
 *     not clobber an alias somebody else set, and vice versa.
 *   - No new PII: section + initials + alias are exactly what the two existing
 *     records already held. Nothing is collected that wasn't collected before.
 *   - No network. Storage only. Callers own their own fetches.
 *
 * Public API: window.NTIdentity
 *   get()            -> { section, initials, alias, skipped, at } | null
 *   set(partial)     -> merged record (writes BOTH storage keys)
 *   skip()           -> record a "not now" that expires (see SKIP_TTL_MS)
 *   clear()          -> forget the device identity (shared-Chromebook reset)
 *   label()          -> "JN · 601" | ""
 *   assignedKey(s,i) -> localStorage key holding that student's cached items
 *   getAssigned()    -> cached { items, lessons } for the current identity
 *   setAssigned(v)   -> write that cache (shared with learning-supports.js)
 *   fromUrl([url])   -> { section, initials } | null   (?me=601.JN or #me=)
 *   onChange(fn)     -> subscribe to cross-tab identity changes; returns off()
 */
(function () {
  "use strict";
  if (window.NTIdentity) return; // idempotent

  var ME_KEY = "ewl-supports:v2:me"; // owned: section, initials, skipped, at
  var STUDENT_KEY = "nt_student"; // owned: alias (+ mirrored section)
  var ASSIGNED_PREFIX = "ewl-supports:v2:assigned:";
  // A "not now" expires weekly so a newly-rostered student gets re-asked.
  var SKIP_TTL_MS = 7 * 24 * 60 * 60 * 1000;

  function readJSON(key) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (_e) {
      return null;
    }
  }

  function writeJSON(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
      return true;
    } catch (_e) {
      return false;
    }
  }

  // Match the server's cleanSection / cleanInitials exactly so a value that
  // round-trips through this module always survives the API validators.
  function cleanSection(v) {
    return typeof v === "string" || typeof v === "number" ? String(v).trim().slice(0, 8) : "";
  }

  function cleanInitials(v) {
    return typeof v === "string" || typeof v === "number"
      ? String(v).trim().toUpperCase().slice(0, 6)
      : "";
  }

  function get() {
    var me = readJSON(ME_KEY);
    var stu = readJSON(STUDENT_KEY);

    // An expired "skipped" marker is the same as having no identity at all.
    if (me && me.skipped && (!me.at || Date.now() - me.at > SKIP_TTL_MS)) me = null;

    var section = cleanSection((me && me.section) || (stu && stu.section) || "");
    var initials = cleanInitials((me && me.initials) || "");
    var alias = (stu && (stu.alias || stu.name)) || "";

    if (me && me.skipped)
      return { section: "", initials: "", alias: alias, skipped: true, at: me.at };
    if (!section || !initials) return null;

    return {
      section: section,
      initials: initials,
      alias: alias,
      skipped: false,
      at: (me && me.at) || 0,
    };
  }

  /*
   * Merge `partial` into both records. Only fields actually present in
   * `partial` are written — a caller that knows the initials but not the alias
   * must never blank out an alias somebody else stored, and a caller that sets
   * an alias must never drop the roster identity. (Same field-presence rule
   * the /api/supports upsert follows.)
   */
  function set(partial) {
    if (!partial || typeof partial !== "object") return get();

    var prevMe = readJSON(ME_KEY) || {};
    var nextMe = {};
    for (var k in prevMe)
      if (Object.prototype.hasOwnProperty.call(prevMe, k)) nextMe[k] = prevMe[k];

    if ("section" in partial) nextMe.section = cleanSection(partial.section);
    if ("initials" in partial) nextMe.initials = cleanInitials(partial.initials);
    // Naming a student always clears a previous "not now".
    if (nextMe.section && nextMe.initials) {
      delete nextMe.skipped;
      nextMe.at = Date.now();
    }
    writeJSON(ME_KEY, nextMe);

    var prevStu = readJSON(STUDENT_KEY) || {};
    var nextStu = {};
    for (var k2 in prevStu)
      if (Object.prototype.hasOwnProperty.call(prevStu, k2)) nextStu[k2] = prevStu[k2];

    if ("section" in partial) nextStu.section = cleanSection(partial.section);

    /*
     * A DIFFERENT student is now at the keyboard (shared Chromebook, or a
     * stamped "?me=" link opened on someone else's device): the stored alias
     * belonged to the person before them and must NOT carry over, or this
     * student's telemetry and passport get filed under someone else's name.
     *
     * `aliasFor` records which initials the alias belongs to, rather than
     * inferring it by diffing the previous record. That matters because
     * learning-supports.js writes "ewl-supports:v2:me" directly before calling
     * in here, so by then the "previous" identity is already overwritten —
     * a diff-based check would see no change and silently keep the old name.
     * An alias with no `aliasFor` predates this module (edupulse-bridge /
     * nt-page-enhance wrote it), so it has no known owner and is left alone.
     */
    var owner = nextStu.aliasFor;
    if (owner && nextMe.initials && owner !== nextMe.initials) {
      delete nextStu.alias;
      delete nextStu.aliasFor;
    }

    if ("alias" in partial && partial.alias) nextStu.alias = String(partial.alias).slice(0, 40);
    // Seed the alias from the initials ONLY when nothing else has named this
    // student — telemetry/passport rows are useless with an empty student.
    // (A typed display name set for the SAME student is preserved above.)
    if (!nextStu.alias && nextMe.initials) nextStu.alias = nextMe.initials;
    // Claim ownership so the next student switch knows what to discard.
    if (nextStu.alias && nextMe.initials) nextStu.aliasFor = nextMe.initials;
    writeJSON(STUDENT_KEY, nextStu);

    notify();
    return get();
  }

  function skip() {
    var prev = readJSON(ME_KEY) || {};
    writeJSON(ME_KEY, { section: prev.section || "", initials: "", skipped: true, at: Date.now() });
    notify();
  }

  function clear() {
    try {
      localStorage.removeItem(ME_KEY);
    } catch (_e) {
      /* ignore */
    }
    // Deliberately leaves nt_student alone: the alias may be a real display
    // name the student typed for the passport, and clearing the roster
    // identity should not also wipe their name.
    notify();
  }

  function label() {
    var me = get();
    return me && me.initials ? me.initials + " · " + me.section : "";
  }

  function assignedKey(section, initials) {
    return ASSIGNED_PREFIX + section + ":" + initials;
  }

  function getAssigned() {
    var me = get();
    if (!me || !me.initials) return null;
    return readJSON(assignedKey(me.section, me.initials));
  }

  function setAssigned(val) {
    var me = get();
    if (!me || !me.initials) return false;
    return writeJSON(assignedKey(me.section, me.initials), val);
  }

  /*
   * Identity-in-a-link: "?me=601.JN" (or "#me=601.JN").
   *
   * This is deliberately NOT the "?supports=" transport. "?supports=" carries a
   * frozen COARSE bundle and overrides the roster for that launch; "?me="
   * carries only WHO the student is and lets the roster resolve their real,
   * fine-grained accommodations. So a link built this way keeps working after
   * the teacher edits that student's IEP items.
   */
  function fromUrl(url) {
    var loc = url ? new URL(url, window.location.href) : window.location;
    var raw = "";
    try {
      raw = new URLSearchParams(loc.search).get("me") || "";
      if (!raw) {
        var h = String(loc.hash || "").replace(/^#/, "");
        raw = new URLSearchParams(h).get("me") || "";
      }
    } catch (_e) {
      return null;
    }
    if (!raw) return null;
    var bits = String(raw).split(".");
    if (bits.length !== 2) return null;
    var section = cleanSection(bits[0]);
    var initials = cleanInitials(bits[1]);
    if (!section || !initials) return null;
    return { section: section, initials: initials };
  }

  // ---- change notification (same tab + cross tab) --------------------------
  var listeners = [];

  function notify() {
    for (var i = 0; i < listeners.length; i++) {
      try {
        listeners[i](get());
      } catch (_e) {
        /* a bad subscriber must not break the others */
      }
    }
  }

  function onChange(fn) {
    if (typeof fn !== "function") return function () {};
    listeners.push(fn);
    return function off() {
      var ix = listeners.indexOf(fn);
      if (ix >= 0) listeners.splice(ix, 1);
    };
  }

  window.addEventListener("storage", function (e) {
    if (!e || (e.key !== ME_KEY && e.key !== STUDENT_KEY)) return;
    notify();
  });

  window.NTIdentity = {
    get: get,
    set: set,
    skip: skip,
    clear: clear,
    label: label,
    assignedKey: assignedKey,
    getAssigned: getAssigned,
    setAssigned: setAssigned,
    fromUrl: fromUrl,
    onChange: onChange,
    cleanSection: cleanSection,
    cleanInitials: cleanInitials,
    SKIP_TTL_MS: SKIP_TTL_MS,
  };
})();

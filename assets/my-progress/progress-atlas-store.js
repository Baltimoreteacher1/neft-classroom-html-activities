/* ==========================================================================
 * progress-atlas-store.js — nt-atlas:v1, the Learning Atlas's only store.
 *
 * What it holds: for each standard a student chose to prove, when the first
 * proof passed (`p`), when the re-check passed (`o`, Owned), the last check
 * (`l`), up to six check results and the questions already seen; plus one
 * snapshot a day of where every skill stood, so "grown this week" has
 * something honest to compare against. Local only. Versioned (`v: 1`; any
 * other shape reads as empty), size-capped (STORE_MAX_CHARS, oldest history
 * dropped first) and every read and write is inside try/catch.
 * ========================================================================== */
(function (root) {
  "use strict";

  var DAY = 86400000;
  var STORE_KEY = "nt-atlas:v1";
  var STORE_MAX_CHARS = 24000;
  var MAX_NODES = 64;
  var MAX_CHECKS = 6;
  var MAX_SEEN = 16;
  var MAX_SNAPS = 8;
  var CHECK_SIZE = 3;

  function isObj(v) {
    return !!v && typeof v === "object" && !Array.isArray(v);
  }
  function num(v) {
    var n = Number(v);
    return isFinite(n) && n > 0 ? Math.floor(n) : 0;
  }
  function validCode(c) {
    return typeof c === "string" && /^[A-Za-z0-9.]{1,24}$/.test(c);
  }

  function emptyStore() {
    return { v: 1, nodes: {}, snaps: [] };
  }

  function cleanNode(raw) {
    var n = isObj(raw) ? raw : {};
    var checks = (Array.isArray(n.c) ? n.c : [])
      .filter(function (c) {
        return isObj(c) && (c.k === "c" || c.k === "r") && num(c.at);
      })
      .map(function (c) {
        return { at: num(c.at), k: c.k, s: Math.min(CHECK_SIZE, num(c.s)), n: CHECK_SIZE };
      })
      .sort(function (a, b) {
        return a.at - b.at;
      })
      .slice(-MAX_CHECKS);
    var seen = (Array.isArray(n.seen) ? n.seen : [])
      .filter(function (s) {
        return typeof s === "string" && /^[a-z0-9]{1,10}$/.test(s);
      })
      .slice(-MAX_SEEN);
    var out = { p: num(n.p), o: num(n.o), l: num(n.l), c: checks, seen: seen };
    if (out.o && !out.p) out.p = out.o;
    return out;
  }

  function cleanSnap(raw) {
    if (!isObj(raw) || !num(raw.at)) return null;
    var r = {};
    if (isObj(raw.r))
      Object.keys(raw.r).forEach(function (c) {
        var k = Math.floor(Number(raw.r[c]));
        if (validCode(c) && k >= 1 && k <= 4) r[c] = k;
      });
    return { at: num(raw.at), r: r };
  }

  /** Anything -> a valid v1 store. Unknown versions and junk read as empty. */
  function sanitize(raw) {
    if (!isObj(raw) || raw.v !== 1) return emptyStore();
    var out = emptyStore();
    if (isObj(raw.nodes))
      Object.keys(raw.nodes)
        .filter(validCode)
        .slice(0, MAX_NODES)
        .forEach(function (c) {
          out.nodes[c] = cleanNode(raw.nodes[c]);
        });
    out.snaps = (Array.isArray(raw.snaps) ? raw.snaps : [])
      .map(cleanSnap)
      .filter(Boolean)
      .sort(function (a, b) {
        return a.at - b.at;
      })
      .slice(-MAX_SNAPS);
    return out;
  }

  function readStore(storage) {
    try {
      var raw = storage.getItem(STORE_KEY);
      return raw ? sanitize(JSON.parse(raw)) : emptyStore();
    } catch (_e) {
      return emptyStore();
    }
  }

  /** Oldest history goes first when the store would pass the size cap. */
  function capSize(store) {
    var s = sanitize(JSON.parse(JSON.stringify(store)));
    while (JSON.stringify(s).length > STORE_MAX_CHARS) {
      if (s.snaps.length > 1) {
        s.snaps.shift();
        continue;
      }
      var trimmed = false;
      Object.keys(s.nodes).forEach(function (c) {
        if (s.nodes[c].c.length > 1) {
          s.nodes[c].c.shift();
          trimmed = true;
        }
      });
      if (!trimmed) break;
    }
    return s;
  }

  function writeStore(storage, store) {
    try {
      storage.setItem(STORE_KEY, JSON.stringify(capSize(store)));
      return true;
    } catch (_e) {
      return false;
    }
  }

  function earliest(a, b) {
    return a && b ? Math.min(a, b) : a || b;
  }

  /** Union of two stores, keeping every proof either side holds. */
  function mergeStores(a, b) {
    var out = emptyStore();
    var A = sanitize(a);
    var B = sanitize(b);
    var codes = Object.keys(A.nodes).concat(Object.keys(B.nodes));
    codes.forEach(function (c) {
      if (out.nodes[c]) return;
      var x = A.nodes[c] || cleanNode({});
      var y = B.nodes[c] || cleanNode({});
      var seenChecks = {};
      var checks = x.c.concat(y.c).filter(function (k) {
        var id = k.at + k.k;
        if (seenChecks[id]) return false;
        seenChecks[id] = 1;
        return true;
      });
      out.nodes[c] = cleanNode({
        p: earliest(x.p, y.p),
        o: earliest(x.o, y.o),
        l: Math.max(x.l, y.l),
        c: checks,
        seen: x.seen.concat(
          y.seen.filter(function (s) {
            return x.seen.indexOf(s) < 0;
          }),
        ),
      });
    });
    var days = {};
    A.snaps.concat(B.snaps).forEach(function (s) {
      days[Math.floor(s.at / DAY)] = s;
    });
    out.snaps = Object.keys(days)
      .map(function (d) {
        return days[d];
      })
      .sort(function (p, q) {
        return p.at - q.at;
      });
    return sanitize(out);
  }

  function ranksOf(statuses) {
    var r = {};
    statuses.forEach(function (s) {
      if (s.rank > 0) r[s.node.code] = s.rank;
    });
    return r;
  }

  /** Record today's ranks (one snapshot per day). Returns a new store. */
  function touchSnap(store, statuses, now) {
    var s = sanitize(JSON.parse(JSON.stringify(store)));
    var today = Math.floor(now / DAY);
    var snap = { at: now, r: ranksOf(statuses) };
    var last = s.snaps[s.snaps.length - 1];
    if (last && Math.floor(last.at / DAY) === today) s.snaps[s.snaps.length - 1] = snap;
    else s.snaps.push(snap);
    s.snaps = s.snaps.slice(-MAX_SNAPS);
    return s;
  }

  root.NTAtlasStore = {
    DAY: DAY,
    STORE_KEY: STORE_KEY,
    STORE_MAX_CHARS: STORE_MAX_CHARS,
    CHECK_SIZE: CHECK_SIZE,
    validCode: validCode,
    emptyStore: emptyStore,
    cleanNode: cleanNode,
    sanitize: sanitize,
    readStore: readStore,
    writeStore: writeStore,
    mergeStores: mergeStores,
    touchSnap: touchSnap,
  };
})(typeof window !== "undefined" ? window : globalThis);

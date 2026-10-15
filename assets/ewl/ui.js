/* EWL shared UI helpers: tiny DOM builder, language, live-region announcements, seeded RNG, stable activity ids.
 * No framework. Every Curriculum 2.0 surface builds DOM with EWL.h so nothing is ever assembled with innerHTML from
 * data (the investigation JSON, student text and URL values are all treated as untrusted text).
 *
 *   EWL.h("button", {class: "ewl-btn", onclick: fn, "aria-pressed": "false"}, "Text", childNode)
 *   EWL.svg("rect", {x: 0, y: 0, width: 10, height: 4, fill: "currentColor"})
 *   EWL.t("Hello", "Hola")        -> string for the current language
 *   EWL.announce("Correct")       -> polite live-region message (one shared region per page)
 *   EWL.rng(seed)                 -> mulberry32: r() in [0,1), r.int(a,b), r.pick(arr), r.shuffle(arr)
 *   EWL.id("lab", "discount")     -> "ewl.lab.discount" (stable activity id; validated)
 */
(function (root) {
  "use strict";
  var EWL = (root.EWL = root.EWL || {});
  var SVG_NS = "http://www.w3.org/2000/svg";

  function append(node, kids) {
    for (var i = 0; i < kids.length; i++) {
      var k = kids[i];
      if (k == null || k === false) continue;
      if (Array.isArray(k)) append(node, k);
      else node.appendChild(k && k.nodeType ? k : document.createTextNode(String(k)));
    }
  }
  function setAttrs(node, attrs) {
    if (!attrs) return;
    Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k.slice(0, 2) === "on" && typeof v === "function") node.addEventListener(k.slice(2), v);
      else if (k === "class") node.setAttribute("class", v);
      else if (k === "text") node.textContent = v;
      else node.setAttribute(k, v === true ? "" : String(v));
    });
  }
  /** Modules push {name, run} here; ?diag=1 on any EWL page runs them all. */
  EWL.selfTests = EWL.selfTests || [];
  EWL.h = function (tag, attrs) {
    var n = document.createElement(tag);
    setAttrs(n, attrs);
    append(n, Array.prototype.slice.call(arguments, 2));
    return n;
  };
  EWL.svg = function (tag, attrs) {
    var n = document.createElementNS(SVG_NS, tag);
    setAttrs(n, attrs);
    append(n, Array.prototype.slice.call(arguments, 2));
    return n;
  };
  EWL.clear = function (node) {
    while (node.firstChild) node.removeChild(node.firstChild);
    return node;
  };

  EWL.lang = function () {
    try {
      var q = new URLSearchParams(root.location.search).get("lang");
      if (q === "es" || q === "en") return q;
      var s = root.localStorage.getItem("ewl_lang");
      if (s === "es" || s === "en") return s;
    } catch (e) {
      /* fall through */
    }
    var l = (root.document && root.document.documentElement.lang) || "en";
    return /^es/i.test(l) ? "es" : "en";
  };
  EWL.t = function (en, es) {
    return EWL.lang() === "es" && es ? es : en;
  };

  var live;
  EWL.announce = function (msg) {
    if (typeof document === "undefined") return;
    if (!live) {
      live = EWL.h("div", {
        class: "ewl-sr",
        role: "status",
        "aria-live": "polite",
        "aria-atomic": "true",
      });
      document.body.appendChild(live);
    }
    live.textContent = "";
    // a separate task so the same message twice is announced twice
    setTimeout(function () {
      live.textContent = msg;
    }, 30);
  };

  /** mulberry32 — the same generator the Practice Studios use, so class codes and seeds mean one thing site-wide. */
  EWL.rng = function (seed) {
    var a = seed >>> 0;
    function r() {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    r.int = function (lo, hi) {
      return lo + Math.floor(r() * (hi - lo + 1));
    };
    r.pick = function (arr) {
      return arr[Math.floor(r() * arr.length)];
    };
    r.shuffle = function (arr) {
      var o = arr.slice();
      for (var i = o.length - 1; i > 0; i--) {
        var j = Math.floor(r() * (i + 1));
        var t = o[i];
        o[i] = o[j];
        o[j] = t;
      }
      return o;
    };
    return r;
  };
  /** Stable 32-bit hash of a string (class codes, seeds). */
  EWL.hash = function (s) {
    var h = 0x811c9dc5;
    s = String(s);
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h >>> 0;
  };

  var KINDS = [
    "canvas",
    "lab",
    "forge",
    "invariant",
    "discourse",
    "fluency",
    "sketch",
    "lens",
    "reference",
  ];
  EWL.id = function (kind, slug) {
    if (KINDS.indexOf(kind) < 0) throw new RangeError("EWL.id: unknown kind " + kind);
    if (!/^[a-z0-9][a-z0-9-]{0,48}$/.test(String(slug)))
      throw new RangeError("EWL.id: bad slug " + slug);
    return "ewl." + kind + "." + slug;
  };
  EWL.ID_RE =
    /^ewl\.(canvas|lab|forge|invariant|discourse|fluency|sketch|lens|reference)\.[a-z0-9][a-z0-9-]{0,48}$/;

  /** Query-string flags every surface honors: ?lang=es  ?diag=1  ?teacher=1  ?mode=debug */
  EWL.flags = function () {
    var q;
    try {
      q = new URLSearchParams(root.location.search);
    } catch (e) {
      q = new URLSearchParams("");
    }
    return {
      diag: q.get("diag") === "1",
      teacher: q.get("teacher") === "1",
      debug: q.get("mode") === "debug",
      lang: EWL.lang(),
    };
  };

  /** Fetch JSON from this site with a clear failure (callers show a calm message, never a blank page). */
  EWL.json = function (url) {
    return fetch(url, { credentials: "same-origin" }).then(function (r) {
      if (!r.ok) throw new Error(url + " answered " + r.status);
      return r.json();
    });
  };
})(typeof window !== "undefined" ? window : globalThis);

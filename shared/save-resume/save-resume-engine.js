/* =============================================================================
 * Neft Teacher — Durable Multi-Day Save / Resume Engine
 * -----------------------------------------------------------------------------
 * One shared, reusable module that lets a student start any HTML activity, work
 * on it across multiple days, get a friendly resume code, and come back later to
 * continue exactly where they left off — including the FULL activity state, not
 * just final answers.
 *
 * Design goals:
 *   - Zero-config: drop the <script> + <link> into a page and it self-initialises.
 *   - Non-destructive: never throws into the host page; every hook is wrapped in
 *     try/catch and fails soft with a console diagnostic.
 *   - localStorage ALWAYS works immediately (offline-first source of truth).
 *   - Pluggable backends (localStorage | cloudflare | googleAppsScript) that act
 *     as an optional cross-device sync mirror — if the backend is missing, local
 *     work stays safe.
 *   - Unobtrusive UI: a small floating launcher + dismissible intro card, NOT a
 *     blocking full-screen modal, so it can't cover content, trap focus, or break
 *     interactive activities and 3D games.
 *
 * Public API (window.NeftSaveResume):
 *   .init(config)                  — initialise (auto-called on DOMContentLoaded)
 *   .save(reason)                  — force a save now
 *   .getState()                    — current captured state object
 *   .getTeacherSummary()           — clean summary object for teachers/export
 *   .registerStateProvider(fn)     — contribute custom state (returns plain obj)
 *   .registerStateRestorer(fn)     — restore custom state (receives that obj)
 *   .open() / .close()             — open/close the panel
 *   .reset()                       — clear THIS browser's session for the activity
 *   .version                       — engine version string
 *
 * Author: Neft Teacher build pipeline.  No external dependencies.
 * ========================================================================== */
(function () {
  "use strict";

  // Guard against double-injection (idempotent across accidental double <script>).
  if (window.NeftSaveResume && window.NeftSaveResume.__loaded) return;

  var ENGINE_VERSION = "1.0.0";
  var LS_PREFIX = "nsr:"; // localStorage namespace — avoids clashing with the
  // 200+ lessons that already use their own localStorage keys.

  // Unambiguous code alphabet: no 0/O/1/I/L to keep codes student-friendly.
  var CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  var CODE_SUFFIX_LEN = 4;
  var AUTOSAVE_INTERVAL_MS = 20000; // every 20s while active
  var DEBOUNCE_MS = 800; // coalesce rapid input events

  /* ---------------------------------------------------------------------------
   * Small utilities
   * ------------------------------------------------------------------------ */
  function log() {
    try {
      var args = ["[NeftSaveResume]"].concat([].slice.call(arguments));
      console.log.apply(console, args);
    } catch (e) {}
  }
  function warn() {
    try {
      var args = ["[NeftSaveResume]"].concat([].slice.call(arguments));
      console.warn.apply(console, args);
    } catch (e) {}
  }
  function now() {
    return new Date().toISOString();
  }
  function safe(fn, label, fallback) {
    try {
      return fn();
    } catch (e) {
      warn("soft-fail @ " + (label || "?") + ":", e && e.message);
      return fallback;
    }
  }
  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    if (attrs)
      Object.keys(attrs).forEach(function (k) {
        if (k === "class") node.className = attrs[k];
        else if (k === "html") node.innerHTML = attrs[k];
        else node.setAttribute(k, attrs[k]);
      });
    if (text != null) node.appendChild(document.createTextNode(text));
    return node;
  }
  function slugify(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
  }
  function debounce(fn, ms) {
    var t;
    return function () {
      var ctx = this,
        a = arguments;
      clearTimeout(t);
      t = setTimeout(function () {
        fn.apply(ctx, a);
      }, ms);
    };
  }

  /* ---------------------------------------------------------------------------
   * Resume code generation
   * ------------------------------------------------------------------------ */
  function randInt(max) {
    // Prefer crypto for unbiased randomness; fall back to Math.random.
    try {
      if (window.crypto && window.crypto.getRandomValues) {
        var a = new Uint32Array(1);
        window.crypto.getRandomValues(a);
        return a[0] % max;
      }
    } catch (e) {}
    return Math.floor(Math.random() * max);
  }
  function makeSuffix() {
    var s = "";
    for (var i = 0; i < CODE_SUFFIX_LEN; i++)
      s += CODE_ALPHABET[randInt(CODE_ALPHABET.length)];
    return s;
  }
  function derivePrefix(cfg) {
    var raw =
      cfg.activityPrefix || cfg.activityTitle || cfg.activityId || "WORK";
    // Use leading alphabetic chunk of the title/prefix, upper-cased, max 6 chars.
    var letters = String(raw)
      .toUpperCase()
      .replace(/[^A-Z]/g, "");
    if (letters.length >= 3) return letters.slice(0, 6);
    // Fall back to initials of first words.
    var words = String(raw)
      .toUpperCase()
      .split(/[^A-Z0-9]+/)
      .filter(Boolean);
    var ini = words
      .map(function (w) {
        return w[0];
      })
      .join("")
      .replace(/[^A-Z]/g, "");
    return (ini || "WORK").slice(0, 6) || "WORK";
  }
  function makeCode(cfg) {
    return derivePrefix(cfg) + "-" + makeSuffix();
  }
  function normalizeCode(raw) {
    return String(raw || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "");
  }

  /* ---------------------------------------------------------------------------
   * Backend adapters — all expose: create(record), save(record),
   * load(code) -> record|null, health() -> bool.  Each returns a Promise.
   * ------------------------------------------------------------------------ */
  function LocalStorageAdapter() {
    this.name = "localStorage";
  }
  LocalStorageAdapter.prototype._key = function (code) {
    return LS_PREFIX + "rec:" + code;
  };
  LocalStorageAdapter.prototype.health = function () {
    return Promise.resolve(
      safe(
        function () {
          var k = LS_PREFIX + "__t";
          localStorage.setItem(k, "1");
          localStorage.removeItem(k);
          return true;
        },
        "ls-health",
        false,
      ),
    );
  };
  LocalStorageAdapter.prototype.create = function (rec) {
    return this.save(rec);
  };
  LocalStorageAdapter.prototype.save = function (rec) {
    var self = this;
    return new Promise(function (resolve, reject) {
      try {
        localStorage.setItem(self._key(rec.saveCode), JSON.stringify(rec));
        resolve({ ok: true, local: true });
      } catch (e) {
        reject(e);
      }
    });
  };
  LocalStorageAdapter.prototype.load = function (code) {
    var self = this;
    return new Promise(function (resolve) {
      var raw = safe(
        function () {
          return localStorage.getItem(self._key(code));
        },
        "ls-load",
        null,
      );
      resolve(
        raw
          ? safe(
              function () {
                return JSON.parse(raw);
              },
              "ls-parse",
              null,
            )
          : null,
      );
    });
  };

  // Cloudflare Pages Functions / Workers adapter.
  // Talks to POST /api/progress/create, /save and GET /api/progress/load?code=.
  function CloudflareAdapter(endpoint) {
    this.name = "cloudflare";
    this.endpoint = (endpoint || "/api/progress").replace(/\/+$/, "");
  }
  CloudflareAdapter.prototype._post = function (path, body) {
    return fetch(this.endpoint + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    });
  };
  CloudflareAdapter.prototype.health = function () {
    return fetch(this.endpoint + "/health")
      .then(function (r) {
        return r.ok;
      })
      .catch(function () {
        return false;
      });
  };
  CloudflareAdapter.prototype.create = function (rec) {
    return this._post("/create", rec);
  };
  CloudflareAdapter.prototype.save = function (rec) {
    return this._post("/save", rec);
  };
  CloudflareAdapter.prototype.load = function (code) {
    return fetch(this.endpoint + "/load?code=" + encodeURIComponent(code))
      .then(function (r) {
        if (r.status === 404) return null;
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (j) {
        // Endpoint returns { ok, record } — normalise to the record object.
        if (!j) return null;
        return j.record || (j.saveCode ? j : null);
      });
  };

  // Google Apps Script web-app adapter.
  // Uses text/plain to dodge CORS preflight (Apps Script handles it on doPost).
  function GoogleAppsScriptAdapter(endpoint) {
    this.name = "googleAppsScript";
    this.endpoint = endpoint || "";
  }
  GoogleAppsScriptAdapter.prototype._post = function (action, rec) {
    if (!this.endpoint) return Promise.reject(new Error("no endpoint"));
    return fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: action, record: rec }),
    }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    });
  };
  GoogleAppsScriptAdapter.prototype.health = function () {
    if (!this.endpoint) return Promise.resolve(false);
    return fetch(this.endpoint + "?action=health")
      .then(function (r) {
        return r.ok;
      })
      .catch(function () {
        return false;
      });
  };
  GoogleAppsScriptAdapter.prototype.create = function (rec) {
    return this._post("create", rec);
  };
  GoogleAppsScriptAdapter.prototype.save = function (rec) {
    return this._post("save", rec);
  };
  GoogleAppsScriptAdapter.prototype.load = function (code) {
    if (!this.endpoint) return Promise.resolve(null);
    return fetch(
      this.endpoint + "?action=load&code=" + encodeURIComponent(code),
    )
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (j) {
        if (!j || j.ok === false) return null;
        return j.record || (j.saveCode ? j : null);
      });
  };

  function makeAdapter(cfg) {
    switch (cfg.backend) {
      case "cloudflare":
        return new CloudflareAdapter(cfg.endpoint);
      case "googleAppsScript":
        return new GoogleAppsScriptAdapter(cfg.endpoint);
      case "localStorage":
      default:
        return new LocalStorageAdapter();
    }
  }

  /* ---------------------------------------------------------------------------
   * Stable element keys — so a field maps to the same slot on restore.
   * Preference order: id > name > structural path.
   * ------------------------------------------------------------------------ */
  function elementKey(node) {
    if (node.id) return "#" + node.id;
    if (node.name) {
      // name + index (radios share a name) keeps each control distinct.
      var same = document.getElementsByName(node.name);
      if (same.length > 1) {
        for (var i = 0; i < same.length; i++)
          if (same[i] === node) return "@" + node.name + "[" + i + "]";
      }
      return "@" + node.name;
    }
    return "~" + structuralPath(node);
  }
  function structuralPath(node) {
    var parts = [];
    var cur = node;
    while (cur && cur.nodeType === 1 && cur !== document.body) {
      var tag = cur.tagName.toLowerCase();
      var idx = 1;
      var sib = cur;
      while ((sib = sib.previousElementSibling))
        if (sib.tagName === cur.tagName) idx++;
      parts.unshift(tag + ":" + idx);
      cur = cur.parentElement;
    }
    return parts.join(">");
  }
  function findByKey(key) {
    return safe(
      function () {
        if (key[0] === "#") return document.getElementById(key.slice(1));
        if (key[0] === "@") {
          var m = key.slice(1).match(/^(.*)\[(\d+)\]$/);
          if (m) {
            var list = document.getElementsByName(m[1]);
            return list[+m[2]] || null;
          }
          var byName = document.getElementsByName(key.slice(1));
          return byName[0] || null;
        }
        if (key[0] === "~") return resolveStructural(key.slice(1));
        return null;
      },
      "findByKey",
      null,
    );
  }
  function resolveStructural(path) {
    var parts = path.split(">");
    var cur = document.body;
    for (var i = 0; i < parts.length && cur; i++) {
      var seg = parts[i].split(":");
      var tag = seg[0].toUpperCase();
      var want = +seg[1];
      var n = 0,
        found = null,
        child = cur.firstElementChild;
      while (child) {
        if (child.tagName === tag) {
          n++;
          if (n === want) {
            found = child;
            break;
          }
        }
        child = child.nextElementSibling;
      }
      cur = found;
    }
    return cur;
  }

  /* ---------------------------------------------------------------------------
   * State capture
   * ------------------------------------------------------------------------ */
  var FIELD_SELECTOR =
    'input, textarea, select, [contenteditable=""], [contenteditable="true"]';

  function captureFields() {
    var out = {};
    var nodes = safe(
      function () {
        return document.querySelectorAll(FIELD_SELECTOR);
      },
      "capture-query",
      [],
    );
    [].forEach.call(nodes, function (node) {
      safe(function () {
        // Skip our own UI and password fields (never store secrets).
        if (node.closest && node.closest("#nsr-root")) return;
        if (node.type === "password") return;
        if (node.getAttribute && node.getAttribute("data-nsr-ignore") != null)
          return;
        var key = elementKey(node);
        var tag = node.tagName.toLowerCase();
        if (tag === "input") {
          var type = (node.type || "text").toLowerCase();
          if (type === "checkbox")
            out[key] = { t: "checkbox", v: !!node.checked };
          else if (type === "radio")
            out[key] = { t: "radio", v: !!node.checked };
          else if (type === "file")
            return; // cannot persist file inputs
          else out[key] = { t: "input", v: node.value };
        } else if (tag === "textarea") {
          out[key] = { t: "textarea", v: node.value };
        } else if (tag === "select") {
          if (node.multiple) {
            out[key] = {
              t: "select-multi",
              v: [].map.call(node.selectedOptions, function (o) {
                return o.value;
              }),
            };
          } else {
            out[key] = { t: "select", v: node.value };
          }
        } else {
          // contenteditable
          out[key] = { t: "html", v: node.innerHTML };
        }
      }, "capture-field");
    });
    return out;
  }

  // Best-effort capture of tab / page / visible-section UI state.
  function captureNavigation() {
    var nav = { hash: location.hash || "", scrollY: window.scrollY || 0 };
    nav.activeTabs = safe(
      function () {
        var sel = '[role="tab"], .tab, [data-tab], .nav-link, [data-nsr-tab]';
        var keys = [];
        [].forEach.call(document.querySelectorAll(sel), function (t) {
          var on =
            t.getAttribute("aria-selected") === "true" ||
            t.classList.contains("active") ||
            t.classList.contains("is-active") ||
            t.classList.contains("selected");
          if (on) keys.push(elementKey(t));
        });
        return keys;
      },
      "capture-tabs",
      [],
    );
    // Sections explicitly toggled hidden/shown (data-nsr-section markers).
    nav.hiddenSections = safe(
      function () {
        var keys = [];
        [].forEach.call(
          document.querySelectorAll("[data-nsr-section]"),
          function (s) {
            keys.push({
              k: elementKey(s),
              hidden: !!s.hidden || s.hasAttribute("hidden"),
            });
          },
        );
        return keys;
      },
      "capture-sections",
      [],
    );
    return nav;
  }

  // Drag/drop placements when detectable: maps draggable element -> container.
  function captureDragDrop() {
    return safe(
      function () {
        var draggables = document.querySelectorAll(
          '[draggable="true"], .draggable, [data-nsr-draggable]',
        );
        if (!draggables.length) return null;
        var map = [];
        [].forEach.call(draggables, function (d) {
          var container =
            d.closest("[data-nsr-dropzone]") ||
            (d.parentElement ? d.parentElement : null);
          if (container)
            map.push({ item: elementKey(d), zone: elementKey(container) });
        });
        return map.length ? map : null;
      },
      "capture-dnd",
      null,
    );
  }

  // Graph / table / histogram & explicit value markers when detectable.
  function captureData() {
    var data = {};
    // Author-marked values: <el data-nsr-value="..."> or data-value containers.
    data.marked = safe(
      function () {
        var out = {};
        [].forEach.call(
          document.querySelectorAll("[data-nsr-value]"),
          function (n) {
            out[elementKey(n)] = n.getAttribute("data-nsr-value");
          },
        );
        return out;
      },
      "capture-marked",
      {},
    );
    // Progress / score markers when present.
    data.scores = safe(
      function () {
        var out = {};
        [].forEach.call(
          document.querySelectorAll(
            "[data-score], [data-progress], [data-nsr-score], [data-nsr-progress]",
          ),
          function (n) {
            out[elementKey(n)] = {
              score:
                n.getAttribute("data-score") ||
                n.getAttribute("data-nsr-score"),
              progress:
                n.getAttribute("data-progress") ||
                n.getAttribute("data-nsr-progress"),
              text: (n.textContent || "").trim().slice(0, 120),
            };
          },
        );
        return out;
      },
      "capture-scores",
      {},
    );
    // Hints used markers when present.
    data.hints = safe(
      function () {
        var used = [];
        [].forEach.call(
          document.querySelectorAll("[data-nsr-hint], .hint.used, .hint-used"),
          function (n) {
            if (
              n.getAttribute("data-nsr-hint") === "used" ||
              n.classList.contains("used") ||
              n.classList.contains("hint-used")
            )
              used.push(elementKey(n));
          },
        );
        return used;
      },
      "capture-hints",
      [],
    );
    return data;
  }

  /* ---------------------------------------------------------------------------
   * State restore
   * ------------------------------------------------------------------------ */
  function restoreFields(fields) {
    if (!fields) return;
    Object.keys(fields).forEach(function (key) {
      safe(function () {
        var node = findByKey(key);
        if (!node) {
          log("could not restore field (gone from page):", key);
          return;
        }
        var rec = fields[key];
        switch (rec.t) {
          case "checkbox":
          case "radio":
            node.checked = !!rec.v;
            break;
          case "select-multi":
            [].forEach.call(node.options, function (o) {
              o.selected = rec.v.indexOf(o.value) !== -1;
            });
            break;
          case "html":
            node.innerHTML = rec.v;
            break;
          default:
            node.value = rec.v;
        }
        // Fire input + change so dependent listeners (scoring, validation) update.
        dispatch(node, "input");
        dispatch(node, "change");
      }, "restore-field:" + key);
    });
  }
  function dispatch(node, type) {
    safe(function () {
      var ev;
      try {
        ev = new Event(type, { bubbles: true });
      } catch (e) {
        ev = document.createEvent("Event");
        ev.initEvent(type, true, true);
      }
      node.dispatchEvent(ev);
    }, "dispatch:" + type);
  }
  function restoreNavigation(nav) {
    if (!nav) return;
    safe(function () {
      (nav.activeTabs || []).forEach(function (key) {
        var t = findByKey(key);
        if (!t) return;
        // Re-activate via the page's own handler (covers JS-driven tabs).
        t.click();
        // Safe fallback for declarative (aria-only) tabs: mark it selected and
        // de-select siblings in the same tablist. Harmless for JS tabs, which
        // re-sync on the next interaction.
        if (t.getAttribute("aria-selected") != null) {
          var list = t.closest('[role="tablist"]');
          if (list)
            [].forEach.call(
              list.querySelectorAll('[role="tab"], .tab'),
              function (sib) {
                if (sib.getAttribute("aria-selected") != null)
                  sib.setAttribute(
                    "aria-selected",
                    sib === t ? "true" : "false",
                  );
              },
            );
          t.setAttribute("aria-selected", "true");
        }
      });
      (nav.hiddenSections || []).forEach(function (s) {
        var node = findByKey(s.k);
        if (node) node.hidden = s.hidden;
      });
      if (nav.hash && location.hash !== nav.hash) {
        try {
          location.hash = nav.hash;
        } catch (e) {}
      }
      if (typeof nav.scrollY === "number") window.scrollTo(0, nav.scrollY);
    }, "restore-nav");
  }
  function restoreDragDrop(map) {
    if (!map) return;
    map.forEach(function (m) {
      safe(function () {
        var item = findByKey(m.item),
          zone = findByKey(m.zone);
        if (item && zone && item.parentElement !== zone) zone.appendChild(item);
      }, "restore-dnd");
    });
  }

  /* ---------------------------------------------------------------------------
   * The engine
   * ------------------------------------------------------------------------ */
  var Engine = {
    __loaded: true,
    version: ENGINE_VERSION,
    LocalStorageAdapter: LocalStorageAdapter,
    CloudflareAdapter: CloudflareAdapter,
    GoogleAppsScriptAdapter: GoogleAppsScriptAdapter,

    cfg: null,
    adapter: null,
    record: null, // active student record (null until started)
    _providers: [],
    _restorers: [],
    _dirty: false,
    _timer: null,
    _started: false,

    registerStateProvider: function (fn) {
      if (typeof fn === "function") this._providers.push(fn);
    },
    registerStateRestorer: function (fn) {
      if (typeof fn === "function") this._restorers.push(fn);
    },

    init: function (userCfg) {
      if (this._started) return this;
      this._started = true;
      this.cfg = this._resolveConfig(userCfg || {});
      this.adapter = makeAdapter(this.cfg);
      log("init", {
        activityId: this.cfg.activityId,
        backend: this.cfg.backend,
        version: ENGINE_VERSION,
      });
      var self = this;
      // Build UI once the DOM is ready.
      onReady(function () {
        safe(function () {
          buildUI(self);
        }, "buildUI");
        safe(function () {
          self._wireAutosave();
        }, "wireAutosave");
        safe(function () {
          self._bootstrapSession();
        }, "bootstrap");
      });
      return this;
    },

    _resolveConfig: function (c) {
      var path = location.pathname || "/";
      var autoId =
        slugify(
          path.replace(/index\.html?$/i, "").replace(/\/+$/, "") || "home",
        ) || "home";
      var autoTitle =
        (document.title && document.title.trim()) ||
        (document.querySelector("h1") &&
          document.querySelector("h1").textContent.trim()) ||
        autoId;
      return {
        activityId: c.activityId || autoId,
        activityTitle: c.activityTitle || autoTitle,
        activityPrefix: c.activityPrefix || null,
        activityVersion: c.activityVersion || "1",
        backend: c.backend || "localStorage",
        endpoint: c.endpoint || null,
        autoStart: c.autoStart !== false,
        blocking: !!c.blocking, // default non-blocking
      };
    },

    // Decide what to show on load: returning student (this browser) vs new.
    _bootstrapSession: function () {
      var lastCode = safe(
        function () {
          return localStorage.getItem(
            LS_PREFIX + "activity:" + this.cfg.activityId + ":lastCode",
          );
        }.bind(this),
        "lastCode",
        null,
      );
      if (lastCode) {
        // Welcome-back path: auto-resume this browser's most recent session.
        var self = this;
        this._loadAndRestore(lastCode, true).then(function (ok) {
          if (ok) showToast(self, "Welcome back — your work was restored.");
          else openPanel(self); // session vanished; let them choose
        });
      } else if (this.cfg.autoStart) {
        openPanel(this); // first visit: show Start New / Continue with Code
      }
    },

    _rememberLast: function (code) {
      safe(
        function () {
          localStorage.setItem(LS_PREFIX + "last", code);
          localStorage.setItem(
            LS_PREFIX + "activity:" + this.cfg.activityId + ":lastCode",
            code,
          );
        }.bind(this),
        "rememberLast",
      );
    },

    startNew: function (name, section) {
      var code = makeCode(this.cfg);
      this.record = {
        schema: 1,
        saveCode: code,
        activityId: this.cfg.activityId,
        activityTitle: this.cfg.activityTitle,
        activityVersion: this.cfg.activityVersion,
        studentName: (name || "").trim().slice(0, 60),
        section: (section || "").trim().slice(0, 40),
        url: location.pathname,
        createdAt: now(),
        updatedAt: now(),
        state: {},
        progressPercent: 0,
        meta: this._meta(),
      };
      this._rememberLast(code);
      var self = this;
      this._persist("create").then(function () {
        log("new session", code);
      });
      setStatus(self, "saved");
      return code;
    },

    resumeWithCode: function (rawCode) {
      var code = normalizeCode(rawCode);
      if (!code) return Promise.resolve({ ok: false, reason: "empty" });
      return this._loadAndRestore(code, false).then(function (ok) {
        return ok
          ? { ok: true, code: code }
          : { ok: false, reason: "not-found" };
      });
    },

    _loadAndRestore: function (code, silent) {
      var self = this;
      setStatus(self, "loading");
      // localStorage is the offline source of truth: try local first, then
      // backend (covers a different device / cleared browser).
      var local = new LocalStorageAdapter();
      return local
        .load(code)
        .then(function (rec) {
          if (rec) return rec;
          if (self.adapter.name !== "localStorage")
            return self.adapter.load(code).catch(function () {
              return null;
            });
          return null;
        })
        .then(function (rec) {
          if (!rec) {
            setStatus(self, "idle");
            return false;
          }
          self.record = rec;
          self._rememberLast(code);
          // Mirror a remote-only record back to local for offline safety.
          safe(function () {
            local.save(rec);
          }, "mirror-local");
          // Restore after the page's own scripts have settled.
          setTimeout(function () {
            self._restoreState(rec.state || {});
            if (!silent)
              showToast(self, "Restored your work for code " + code + ".");
            setStatus(self, "saved");
          }, 60);
          return true;
        })
        .catch(function (e) {
          warn("load failed", e && e.message);
          setStatus(self, "error");
          return false;
        });
    },

    _restoreState: function (state) {
      restoreNavigation(state.navigation);
      restoreFields(state.fields);
      restoreDragDrop(state.dragDrop);
      // Author-provided custom restorers (graphs, games, canvases...).
      var custom = state.custom || {};
      this._restorers.forEach(function (fn, i) {
        safe(function () {
          fn(custom["p" + i], custom);
        }, "restorer#" + i);
      });
      updatePanelFields(this);
    },

    _captureState: function () {
      var state = {
        fields: captureFields(),
        navigation: captureNavigation(),
        dragDrop: captureDragDrop(),
        data: captureData(),
        custom: {},
      };
      var self = this;
      this._providers.forEach(function (fn, i) {
        state.custom["p" + i] = safe(
          function () {
            return fn();
          },
          "provider#" + i,
          null,
        );
      });
      state.progressPercent = computeProgress(state);
      return state;
    },

    _meta: function () {
      return safe(
        function () {
          return {
            ua: (navigator.userAgent || "").slice(0, 160),
            lang: navigator.language || "",
            screen: (screen.width || 0) + "x" + (screen.height || 0),
            tz: safe(
              function () {
                return Intl.DateTimeFormat().resolvedOptions().timeZone;
              },
              "tz",
              "",
            ),
          };
        },
        "meta",
        {},
      );
    },

    getState: function () {
      return this.record ? this.record.state : null;
    },

    save: function (reason) {
      if (!this.record)
        return Promise.resolve({ ok: false, reason: "no-session" });
      this.record.state = this._captureState();
      this.record.progressPercent = this.record.state.progressPercent;
      this.record.updatedAt = now();
      this.record.url = location.pathname;
      return this._persist(reason || "save");
    },

    // Persist locally ALWAYS; mirror to backend best-effort. Status reflects which.
    _persist: function (reason) {
      var self = this;
      var rec = this.record;
      setStatus(self, "saving");
      var local = new LocalStorageAdapter();
      return local
        .save(rec)
        .then(function () {
          if (self.adapter.name === "localStorage") {
            setStatus(self, "saved-local");
            return { ok: true, local: true };
          }
          // Mirror to remote backend.
          return self.adapter[reason === "create" ? "create" : "save"](
            rec,
          ).then(
            function () {
              setStatus(self, "saved");
              return { ok: true, remote: true };
            },
            function (e) {
              warn("backend save failed; local copy is safe:", e && e.message);
              setStatus(self, "offline");
              return { ok: true, local: true, remoteError: true };
            },
          );
        })
        .catch(function (e) {
          warn("LOCAL save failed:", e && e.message);
          setStatus(self, "error");
          return { ok: false, error: String(e) };
        });
    },

    _wireAutosave: function () {
      var self = this;
      var doSave = debounce(function () {
        if (self.record) self.save("auto");
      }, DEBOUNCE_MS);
      // Any input/change anywhere in the page (capture phase) marks dirty + saves.
      document.addEventListener(
        "input",
        function (e) {
          if (e.target && e.target.closest && e.target.closest("#nsr-root"))
            return;
          self._dirty = true;
          doSave();
        },
        true,
      );
      document.addEventListener(
        "change",
        function (e) {
          if (e.target && e.target.closest && e.target.closest("#nsr-root"))
            return;
          self._dirty = true;
          doSave();
        },
        true,
      );
      // Tab / hash navigation.
      window.addEventListener("hashchange", function () {
        if (self.record) self.save("nav");
      });
      // Periodic safety net.
      this._timer = setInterval(function () {
        if (self.record && self._dirty) {
          self._dirty = false;
          self.save("interval");
        }
      }, AUTOSAVE_INTERVAL_MS);
      // Before leaving / when hidden — synchronous-ish local save.
      window.addEventListener("beforeunload", function () {
        if (self.record) {
          self.record.state = self._captureState();
          self.record.updatedAt = now();
          safe(function () {
            localStorage.setItem(
              LS_PREFIX + "rec:" + self.record.saveCode,
              JSON.stringify(self.record),
            );
          }, "unload-save");
        }
      });
      document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "hidden" && self.record)
          self.save("hide");
      });
    },

    open: function () {
      openPanel(this);
    },
    close: function () {
      closePanel(this);
    },

    reset: function () {
      // Clears THIS browser's pointer to the activity session (not the record).
      safe(
        function () {
          localStorage.removeItem(
            LS_PREFIX + "activity:" + this.cfg.activityId + ":lastCode",
          );
        }.bind(this),
        "reset",
      );
      this.record = null;
      setStatus(this, "idle");
    },

    getTeacherSummary: function () {
      if (!this.record) return null;
      var r = this.record;
      var st = r.state || {};
      // Pull a few human-readable key responses (longest text answers first).
      var responses = safe(
        function () {
          var out = [];
          var f = st.fields || {};
          Object.keys(f).forEach(function (k) {
            var v = f[k];
            if (
              v &&
              (v.t === "textarea" || v.t === "input" || v.t === "html") &&
              v.v &&
              String(v.v).trim()
            )
              out.push({
                field: k,
                answer: String(v.v)
                  .replace(/<[^>]+>/g, " ")
                  .trim()
                  .slice(0, 300),
              });
          });
          return out
            .sort(function (a, b) {
              return b.answer.length - a.answer.length;
            })
            .slice(0, 25);
        },
        "summary-responses",
        [],
      );
      return {
        saveCode: r.saveCode,
        studentName: r.studentName || "(unnamed)",
        section: r.section || "",
        activityId: r.activityId,
        activityTitle: r.activityTitle,
        activityVersion: r.activityVersion,
        percentComplete: r.progressPercent || 0,
        currentPage: r.url,
        currentHash: (st.navigation && st.navigation.hash) || "",
        createdAt: r.createdAt,
        lastSaved: r.updatedAt,
        keyResponses: responses,
      };
    },
  };

  // Rough progress %: filled fields / total fields, blended with author markers.
  function computeProgress(state) {
    return safe(
      function () {
        var f = state.fields || {};
        var keys = Object.keys(f);
        if (!keys.length) return 0;
        var filled = 0;
        keys.forEach(function (k) {
          var v = f[k];
          if (v.t === "checkbox" || v.t === "radio") {
            if (v.v) filled++;
          } else if (v.t === "select-multi") {
            if (v.v && v.v.length) filled++;
          } else if (String(v.v || "").trim()) filled++;
        });
        return Math.round((filled / keys.length) * 100);
      },
      "progress",
      0,
    );
  }

  function onReady(fn) {
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  /* ---------------------------------------------------------------------------
   * UI — floating launcher + dismissible panel. Non-blocking by default.
   * ------------------------------------------------------------------------ */
  var ui = { root: null, panel: null, status: null, fields: {} };

  function buildUI(self) {
    if (document.getElementById("nsr-root")) return;
    var root = el("div", { id: "nsr-root" });

    // Floating launcher button.
    var launcher = el("button", {
      id: "nsr-launcher",
      type: "button",
      "aria-haspopup": "dialog",
      "aria-expanded": "false",
      title: "Save / Resume your work",
    });
    launcher.innerHTML =
      '<span class="nsr-launcher-ico" aria-hidden="true">💾</span>' +
      '<span class="nsr-launcher-label">Save / Resume</span>' +
      '<span class="nsr-dot" id="nsr-dot" aria-hidden="true"></span>';
    launcher.addEventListener("click", function () {
      if (root.classList.contains("nsr-open")) closePanel(self);
      else openPanel(self);
    });

    // Panel.
    var panel = el("div", {
      id: "nsr-panel",
      role: "dialog",
      "aria-label": "Save and Resume your work",
      "aria-hidden": "true",
    });
    panel.innerHTML = panelHTML();
    root.appendChild(launcher);
    root.appendChild(panel);
    document.body.appendChild(root);

    ui.root = root;
    ui.panel = panel;
    ui.status = panel.querySelector("#nsr-status");
    ui.dot = launcher.querySelector("#nsr-dot");

    wirePanel(self, panel);
    setStatus(self, self.record ? "saved" : "idle");
    updatePanelFields(self);
  }

  function panelHTML() {
    return [
      '<div class="nsr-head">',
      '  <strong class="nsr-title">Save &amp; Resume</strong>',
      '  <button type="button" class="nsr-x" id="nsr-close" aria-label="Close">×</button>',
      "</div>",
      '<p class="nsr-status" id="nsr-status" role="status" aria-live="polite">Ready</p>',

      // Intro choices (shown when no active session).
      '<div id="nsr-intro" class="nsr-section">',
      '  <p class="nsr-lead">Starting work you can finish another day? Save it and get a code to come back.</p>',
      '  <label class="nsr-field"><span>Your initials or name</span>',
      '    <input type="text" id="nsr-name" autocomplete="off" maxlength="60" placeholder="e.g. J.N."></label>',
      '  <label class="nsr-field"><span>Class / section</span>',
      '    <input type="text" id="nsr-section" autocomplete="off" maxlength="40" placeholder="e.g. Period 3"></label>',
      '  <button type="button" class="nsr-btn nsr-btn-primary" id="nsr-start">Start new work</button>',
      '  <div class="nsr-or">— or —</div>',
      '  <label class="nsr-field"><span>Continue with a code</span>',
      '    <input type="text" id="nsr-code-in" autocomplete="off" maxlength="20" placeholder="e.g. MATH-7KQ2" style="text-transform:uppercase"></label>',
      '  <button type="button" class="nsr-btn" id="nsr-continue">Continue</button>',
      '  <p class="nsr-err" id="nsr-err" role="alert"></p>',
      "</div>",

      // Active session view.
      '<div id="nsr-active" class="nsr-section" hidden>',
      '  <p class="nsr-lead">Your resume code — write it down to continue later:</p>',
      '  <div class="nsr-code" id="nsr-code" tabindex="0" aria-label="Your resume code"></div>',
      '  <button type="button" class="nsr-btn" id="nsr-copy">Copy code</button>',
      '  <dl class="nsr-meta">',
      '    <div><dt>Name</dt><dd id="nsr-m-name">—</dd></div>',
      '    <div><dt>Section</dt><dd id="nsr-m-section">—</dd></div>',
      '    <div><dt>Progress</dt><dd id="nsr-m-progress">0%</dd></div>',
      '    <div><dt>Last saved</dt><dd id="nsr-m-saved">—</dd></div>',
      "  </dl>",
      '  <button type="button" class="nsr-btn nsr-btn-primary" id="nsr-savebtn">Save now</button>',
      '  <button type="button" class="nsr-btn nsr-btn-ghost" id="nsr-switch">Use a different code</button>',
      "</div>",
      '<p class="nsr-foot">Your work is saved on this device automatically.</p>',
    ].join("");
  }

  function wirePanel(self, panel) {
    function $(id) {
      return panel.querySelector(id);
    }
    $("#nsr-close").addEventListener("click", function () {
      closePanel(self);
    });
    $("#nsr-start").addEventListener("click", function () {
      var name = $("#nsr-name").value;
      var section = $("#nsr-section").value;
      self.startNew(name, section);
      updatePanelFields(self);
      showActive(self);
    });
    $("#nsr-continue").addEventListener("click", function () {
      var code = $("#nsr-code-in").value;
      $("#nsr-err").textContent = "";
      self.resumeWithCode(code).then(function (res) {
        if (res.ok) {
          updatePanelFields(self);
          showActive(self);
        } else if (res.reason === "empty") {
          $("#nsr-err").textContent = "Please type your code first.";
        } else {
          $("#nsr-err").textContent =
            "We couldn't find work for that code. Check the letters and numbers and try again.";
        }
      });
    });
    $("#nsr-code-in").addEventListener("keydown", function (e) {
      if (e.key === "Enter") $("#nsr-continue").click();
    });
    $("#nsr-copy").addEventListener("click", function () {
      var code = self.record && self.record.saveCode;
      if (!code) return;
      safe(function () {
        navigator.clipboard.writeText(code);
        showToast(self, "Code copied.");
      }, "copy");
    });
    $("#nsr-savebtn").addEventListener("click", function () {
      self.save("manual").then(function () {
        updatePanelFields(self);
      });
    });
    $("#nsr-switch").addEventListener("click", function () {
      self.reset();
      showIntro(self);
    });
    // Escape closes the panel (does not trap focus — non-modal).
    panel.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closePanel(self);
    });
  }

  function showIntro(self) {
    if (!ui.panel) return;
    ui.panel.querySelector("#nsr-intro").hidden = false;
    ui.panel.querySelector("#nsr-active").hidden = true;
  }
  function showActive(self) {
    if (!ui.panel) return;
    ui.panel.querySelector("#nsr-intro").hidden = true;
    ui.panel.querySelector("#nsr-active").hidden = false;
  }
  function updatePanelFields(self) {
    if (!ui.panel || !self.record) return;
    var r = self.record;
    var q = function (id) {
      return ui.panel.querySelector(id);
    };
    if (q("#nsr-code")) q("#nsr-code").textContent = r.saveCode;
    if (q("#nsr-m-name")) q("#nsr-m-name").textContent = r.studentName || "—";
    if (q("#nsr-m-section")) q("#nsr-m-section").textContent = r.section || "—";
    if (q("#nsr-m-progress"))
      q("#nsr-m-progress").textContent = (r.progressPercent || 0) + "%";
    if (q("#nsr-m-saved"))
      q("#nsr-m-saved").textContent = safe(
        function () {
          return new Date(r.updatedAt).toLocaleString();
        },
        "date",
        r.updatedAt,
      );
    if (self.record) showActive(self);
  }

  function openPanel(self) {
    if (!ui.root) return;
    ui.root.classList.add("nsr-open");
    ui.panel.setAttribute("aria-hidden", "false");
    var launcher = document.getElementById("nsr-launcher");
    if (launcher) launcher.setAttribute("aria-expanded", "true");
    if (self.record) showActive(self);
    else showIntro(self);
    // Focus the first useful control for keyboard users.
    safe(function () {
      var f = self.record
        ? ui.panel.querySelector("#nsr-savebtn")
        : ui.panel.querySelector("#nsr-name");
      if (f) f.focus();
    }, "focus");
  }
  function closePanel(self) {
    if (!ui.root) return;
    ui.root.classList.remove("nsr-open");
    ui.panel.setAttribute("aria-hidden", "true");
    var launcher = document.getElementById("nsr-launcher");
    if (launcher) launcher.setAttribute("aria-expanded", "false");
  }

  var STATUS_TEXT = {
    idle: "Ready",
    loading: "Loading your work…",
    saving: "Saving…",
    saved: "Saved",
    "saved-local": "Saved on this device",
    offline: "Saved locally (offline — will sync later)",
    error: "Couldn't save — try again",
  };
  function setStatus(self, key) {
    var text = STATUS_TEXT[key] || key;
    if (ui.status) ui.status.textContent = text;
    if (ui.dot) ui.dot.className = "nsr-dot nsr-dot-" + key;
  }
  var toastTimer;
  function showToast(self, msg) {
    var t = document.getElementById("nsr-toast");
    if (!t) {
      t = el("div", { id: "nsr-toast", role: "status", "aria-live": "polite" });
      (ui.root || document.body).appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("nsr-toast-show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      t.classList.remove("nsr-toast-show");
    }, 3200);
  }

  /* ---------------------------------------------------------------------------
   * Expose + auto-init.  A page can pre-set window.NeftSaveResumeConfig to
   * customise, or call NeftSaveResume.init({...}) explicitly. If neither, we
   * auto-init with detected defaults.
   * ------------------------------------------------------------------------ */
  window.NeftSaveResume = Engine;
  onReady(function () {
    if (!Engine._started) {
      var pre = window.NeftSaveResumeConfig || {};
      if (pre.autoStart !== false) Engine.init(pre);
    }
  });
})();

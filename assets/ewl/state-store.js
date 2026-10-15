/* EWLStateStore — the one place Curriculum 2.0 surfaces keep a student's state on this device.
 *
 * Holds: current unit/lesson, mission-stage progress, Check-Yourself flags, vocabulary tokens, the fluency HUD,
 * Evidence Notebook entries, Living Math Canvas progress and display prefs. Nothing here leaves the device
 * unless the student copies a passport code or a teacher's existing sync (NeftSaveResume) carries it.
 *
 *   var S = window.EWLStateStore;                 // singleton on the real storage
 *   S.get(); S.update(fn); S.subscribe(fn)
 *   S.setLesson("5-8")                           // also sets unit
 *   S.markStage("5-8", "curious")                // curious | notes | lab | check
 *   S.setCheck("5-8", "unsure"|"ok")             // Check-Yourself flag; router reads this
 *   S.addVocab("slant height", "5-8")            // vocab token
 *   S.addEvidence("reality.discount", entry)     // Evidence Notebook (capped, newest last)
 *   S.hydrateFromUrl("?unit=5&lesson=5-8&preset=slant&lens=tape&mode=debug") -> {applied, ignored}
 *   S.exportPassport() / S.importPassport(code)  // Base64 of JSON + checksum; import validates before touching state
 *   S.validateConfig(obj) -> [problems]          // shape check used by import, URL hydration and selfTest
 *   S.selfTest() -> {ok, results[]}              // run by ?diag=1
 *
 * Plain-browser IIFE. EWL.Store.create({storage, now}) builds an isolated store for tests.
 */
(function (root) {
  "use strict";
  var EWL = (root.EWL = root.EWL || {});

  var KEY = "ewl_state_v1";
  var STAGES = ["curious", "notes", "lab", "check"];
  var MAX_EVIDENCE = 40; // per activity
  var MAX_VOCAB = 400;
  var LESSON_RE = /^[1-9]\d?-\d{1,2}$/;

  function fresh() {
    return {
      v: 1,
      unit: null,
      lesson: null,
      mission: {}, // lessonId -> { stages: {curious:ts,...}, at }
      checks: {}, // lessonId -> { status: "ok"|"unsure"|"repair", at, repair?: string }
      vocab: {}, // term(lowercase) -> { lesson, at, n }
      fluency: {
        streak: 0,
        best: 0,
        answered: 0,
        correct: 0,
        mix: { new: 60, review: 25, stretch: 15 },
      },
      evidence: {}, // activityId -> [entry]
      canvas: {}, // sceneId -> { stage, at, done }
      prefs: { lens: null, preset: null, debug: false },
      updated: 0,
    };
  }

  function memoryStorage() {
    var m = {};
    return {
      getItem: function (k) {
        return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null;
      },
      setItem: function (k, v) {
        m[k] = String(v);
      },
      removeItem: function (k) {
        delete m[k];
      },
    };
  }

  function realStorage() {
    try {
      var s = root.localStorage;
      var probe = "__ewl_probe__";
      s.setItem(probe, "1");
      s.removeItem(probe);
      return s;
    } catch (e) {
      return memoryStorage();
    }
  }

  function isObj(x) {
    return x && typeof x === "object" && !Array.isArray(x);
  }

  /** Returns a list of problems; empty means the object is a safe EWL state. */
  function validateConfig(c) {
    var p = [];
    if (!isObj(c)) return ["state is not an object"];
    if (c.v !== 1) p.push("unsupported version " + c.v);
    if (c.lesson != null && !LESSON_RE.test(String(c.lesson))) p.push("bad lesson id " + c.lesson);
    if (c.unit != null && !(Number.isInteger(c.unit) && c.unit >= 1 && c.unit <= 10))
      p.push("bad unit " + c.unit);
    ["mission", "checks", "vocab", "evidence", "canvas", "prefs", "fluency"].forEach(function (k) {
      if (c[k] != null && !isObj(c[k])) p.push(k + " is not an object");
    });
    if (isObj(c.mission))
      Object.keys(c.mission).forEach(function (id) {
        if (!LESSON_RE.test(id)) p.push("mission key " + id);
        else if (!isObj(c.mission[id]) || !isObj(c.mission[id].stages))
          p.push("mission " + id + " has no stages");
        else
          Object.keys(c.mission[id].stages).forEach(function (s) {
            if (STAGES.indexOf(s) < 0) p.push("mission " + id + " unknown stage " + s);
          });
      });
    if (isObj(c.checks))
      Object.keys(c.checks).forEach(function (id) {
        var st = c.checks[id] && c.checks[id].status;
        if (!LESSON_RE.test(id) || ["ok", "unsure", "repair"].indexOf(st) < 0)
          p.push("check " + id);
      });
    if (isObj(c.evidence))
      Object.keys(c.evidence).forEach(function (id) {
        if (!Array.isArray(c.evidence[id])) p.push("evidence " + id + " is not a list");
      });
    if (isObj(c.fluency) && c.fluency.mix) {
      var m = c.fluency.mix;
      if (!isObj(m) || Math.round((m.new || 0) + (m.review || 0) + (m.stretch || 0)) !== 100)
        p.push("fluency mix must total 100");
    }
    return p;
  }

  function create(opts) {
    opts = opts || {};
    var storage = opts.storage || realStorage();
    var now =
      opts.now ||
      function () {
        return Date.now();
      };
    var state = load();
    var subs = [];

    function load() {
      try {
        var raw = storage.getItem(KEY);
        if (!raw) return fresh();
        var o = JSON.parse(raw);
        return validateConfig(o).length ? fresh() : merge(fresh(), o);
      } catch (e) {
        return fresh();
      }
    }
    function merge(base, o) {
      Object.keys(o).forEach(function (k) {
        base[k] = isObj(o[k]) && isObj(base[k]) ? Object.assign(base[k], o[k]) : o[k];
      });
      return base;
    }
    function save() {
      state.updated = now();
      try {
        storage.setItem(KEY, JSON.stringify(state));
      } catch (e) {
        /* storage full or blocked: state stays in memory for this page */
      }
      subs.slice().forEach(function (fn) {
        try {
          fn(state);
        } catch (e) {
          /* a bad subscriber must not break the others */
        }
      });
    }

    var api = {
      KEY: KEY,
      STAGES: STAGES,
      get: function () {
        return state;
      },
      update: function (fn) {
        fn(state);
        save();
        return state;
      },
      subscribe: function (fn) {
        subs.push(fn);
        return function () {
          subs = subs.filter(function (f) {
            return f !== fn;
          });
        };
      },
      reset: function () {
        state = fresh();
        save();
      },

      setLesson: function (id) {
        if (!LESSON_RE.test(String(id)))
          throw new RangeError("EWLStateStore.setLesson: bad lesson id " + id);
        return api.update(function (s) {
          s.lesson = id;
          s.unit = Number(String(id).split("-")[0]);
        });
      },
      markStage: function (id, stage) {
        if (!LESSON_RE.test(String(id)) || STAGES.indexOf(stage) < 0)
          throw new RangeError("EWLStateStore.markStage: " + id + "/" + stage);
        return api.update(function (s) {
          var m = s.mission[id] || (s.mission[id] = { stages: {}, at: 0 });
          if (!m.stages[stage]) m.stages[stage] = now();
          m.at = now();
        });
      },
      stagesDone: function (id) {
        var m = state.mission[id];
        return STAGES.filter(function (st) {
          return m && m.stages[st];
        });
      },
      setCheck: function (id, status, repair) {
        if (!LESSON_RE.test(String(id)) || ["ok", "unsure", "repair"].indexOf(status) < 0)
          throw new RangeError("EWLStateStore.setCheck: " + id + "/" + status);
        return api.update(function (s) {
          s.checks[id] = { status: status, at: now() };
          if (repair) s.checks[id].repair = String(repair).slice(0, 60);
        });
      },
      addVocab: function (term, lesson) {
        var k = String(term || "")
          .trim()
          .toLowerCase()
          .slice(0, 60);
        if (!k) return state;
        return api.update(function (s) {
          var t = s.vocab[k] || (s.vocab[k] = { lesson: lesson || s.lesson, at: now(), n: 0 });
          t.n += 1;
          t.at = now();
          var keys = Object.keys(s.vocab);
          if (keys.length > MAX_VOCAB)
            keys
              .sort(function (a, b) {
                return s.vocab[a].at - s.vocab[b].at;
              })
              .slice(0, keys.length - MAX_VOCAB)
              .forEach(function (x) {
                delete s.vocab[x];
              });
        });
      },
      addEvidence: function (activityId, entry) {
        if (!activityId || !isObj(entry))
          throw new TypeError("EWLStateStore.addEvidence(activityId, entry)");
        return api.update(function (s) {
          var list = s.evidence[activityId] || (s.evidence[activityId] = []);
          list.push(Object.assign({ at: now() }, entry));
          if (list.length > MAX_EVIDENCE) list.splice(0, list.length - MAX_EVIDENCE);
        });
      },
      recordFluency: function (correct) {
        return api.update(function (s) {
          var f = s.fluency;
          f.answered += 1;
          if (correct) {
            f.correct += 1;
            f.streak += 1;
            if (f.streak > f.best) f.best = f.streak;
          } else f.streak = 0;
        });
      },
      setCanvas: function (sceneId, patch) {
        return api.update(function (s) {
          s.canvas[sceneId] = Object.assign({}, s.canvas[sceneId], patch, { at: now() });
        });
      },

      /** Apply ?unit=&lesson=&preset=&lens=&mode= . Unknown or malformed values are ignored, never thrown on. */
      hydrateFromUrl: function (search) {
        var q;
        try {
          q = new URLSearchParams(search || "");
        } catch (e) {
          return { applied: {}, ignored: ["search"] };
        }
        var applied = {};
        var ignored = [];
        var lesson = q.get("lesson");
        var unit = q.get("unit");
        if (lesson) {
          if (LESSON_RE.test(lesson)) {
            api.setLesson(lesson);
            applied.lesson = lesson;
            applied.unit = Number(lesson.split("-")[0]);
          } else ignored.push("lesson");
        } else if (unit) {
          var u = Number(unit);
          if (Number.isInteger(u) && u >= 1 && u <= 10) {
            api.update(function (s) {
              s.unit = u;
              if (s.lesson && Number(s.lesson.split("-")[0]) !== u) s.lesson = null;
            });
            applied.unit = u;
          } else ignored.push("unit");
        }
        ["preset", "lens"].forEach(function (k) {
          var v = q.get(k);
          if (v == null) return;
          if (/^[a-z0-9][a-z0-9_-]{0,40}$/i.test(v)) {
            api.update(function (s) {
              s.prefs[k] = v;
            });
            applied[k] = v;
          } else ignored.push(k);
        });
        if (q.get("mode") === "debug") {
          api.update(function (s) {
            s.prefs.debug = true;
          });
          applied.mode = "debug";
        }
        return { applied: applied, ignored: ignored };
      },

      validateConfig: validateConfig,

      /** Replace state from a saved snapshot (Save/Resume). Invalid snapshots are refused, not partly applied. */
      restore: function (obj) {
        if (validateConfig(obj).length) return false;
        state = merge(fresh(), obj);
        save();
        return true;
      },

      /** Passport: base64(utf8 JSON) + "." + checksum. Evidence free-text is included; names never are. */
      exportPassport: function () {
        var body = JSON.stringify(state);
        return b64(body) + "." + checksum(body);
      },
      importPassport: function (code) {
        var parts = String(code || "")
          .trim()
          .split(".");
        if (parts.length !== 2)
          return { ok: false, error: "That code is not complete. Copy the whole thing." };
        var body;
        try {
          body = unb64(parts[0]);
        } catch (e) {
          return { ok: false, error: "That code has characters it should not have." };
        }
        if (checksum(body) !== parts[1])
          return {
            ok: false,
            error: "That code does not match itself. One character may be missing.",
          };
        var o;
        try {
          o = JSON.parse(body);
        } catch (e) {
          return { ok: false, error: "That code could not be read." };
        }
        var problems = validateConfig(o);
        if (problems.length)
          return { ok: false, error: "That code is not a Math Passport: " + problems[0] };
        state = merge(fresh(), o);
        save();
        return { ok: true };
      },

      selfTest: function () {
        var results = [];
        function t(name, fn) {
          try {
            var r = fn();
            results.push({
              name: name,
              ok: r === true || r === undefined,
              detail: r === true || r === undefined ? "" : String(r),
            });
          } catch (e) {
            results.push({ name: name, ok: false, detail: e.message });
          }
        }
        var s = create({
          storage: memoryStorage(),
          now: function () {
            return 1;
          },
        });
        t("fresh state validates", function () {
          return validateConfig(s.get()).length === 0;
        });
        t("setLesson sets unit", function () {
          s.setLesson("5-8");
          return s.get().unit === 5;
        });
        t("setLesson rejects junk", function () {
          try {
            s.setLesson("../x");
            return "accepted";
          } catch (e) {
            return true;
          }
        });
        t("markStage is idempotent and ordered by name", function () {
          s.markStage("5-8", "curious");
          s.markStage("5-8", "curious");
          return s.stagesDone("5-8").join() === "curious";
        });
        t("passport round-trips including non-ASCII", function () {
          s.addEvidence("x", { claim: "ñ 60% = ⅗" });
          var code = s.exportPassport();
          var s2 = create({ storage: memoryStorage() });
          var r = s2.importPassport(code);
          return r.ok && s2.get().evidence.x[0].claim === "ñ 60% = ⅗"
            ? true
            : "round trip lost data";
        });
        t("passport rejects a flipped character", function () {
          var code = s.exportPassport();
          var bad = code.slice(0, 10) + (code[10] === "A" ? "B" : "A") + code.slice(11);
          return s.importPassport(bad).ok ? "accepted corrupt code" : true;
        });
        t("passport rejects a valid-looking foreign object", function () {
          var body = JSON.stringify({
            v: 1,
            lesson: "5-8",
            mission: { "5-8": { stages: { hacked: 1 } } },
          });
          return s.importPassport(b64(body) + "." + checksum(body)).ok
            ? "accepted bad stage"
            : true;
        });
        t("URL hydration applies good values and ignores bad", function () {
          var r = s.hydrateFromUrl("?lesson=6-3&preset=slant&lens=<script>&mode=debug");
          return (
            r.applied.lesson === "6-3" &&
            r.applied.preset === "slant" &&
            r.ignored.indexOf("lens") >= 0 &&
            s.get().prefs.debug === true
          );
        });
        t("evidence is capped per activity", function () {
          for (var i = 0; i < MAX_EVIDENCE + 5; i++) s.addEvidence("cap", { i: i });
          return (
            s.get().evidence.cap.length === MAX_EVIDENCE &&
            s.get().evidence.cap[MAX_EVIDENCE - 1].i === MAX_EVIDENCE + 4
          );
        });
        return {
          ok: results.every(function (r) {
            return r.ok;
          }),
          results: results,
        };
      },
    };
    return api;
  }

  function b64(str) {
    if (typeof btoa === "function") {
      var bytes = new TextEncoder().encode(str);
      var bin = "";
      for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    }
    return Buffer.from(str, "utf8").toString("base64url");
  }
  function unb64(s) {
    if (typeof atob === "function") {
      var bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
      var bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    }
    return Buffer.from(s, "base64url").toString("utf8");
  }
  /** Not security: a typo detector for hand-copied codes (FNV-1a, 32-bit, base36). */
  function checksum(str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(36);
  }

  EWL.Store = {
    create: create,
    validateConfig: validateConfig,
    KEY: KEY,
    STAGES: STAGES,
    fresh: fresh,
  };
  EWL.state = create();
  root.EWLStateStore = EWL.state;

  // Ride the existing Save/Resume rails when they are on the page: the same device snapshot, no second system.
  function hookSaveResume() {
    var SR = root.NeftSaveResume;
    if (!SR || typeof SR.registerStateProvider !== "function") return false;
    SR.registerStateProvider(function () {
      return { ewlState: EWL.state.get() };
    });
    SR.registerStateRestorer(function (saved) {
      if (saved && saved.ewlState) EWL.state.restore(saved.ewlState);
    });
    return true;
  }
  if (typeof document !== "undefined" && !hookSaveResume()) {
    var tries = 0;
    var iv = setInterval(function () {
      if (hookSaveResume() || ++tries > 20) clearInterval(iv);
    }, 500);
  }
})(typeof window !== "undefined" ? window : globalThis);

/* ==========================================================================
 * progress-stores.js — READ-ONLY readers for every local progress store a
 * student's device keeps, normalised into one snapshot for the unified
 * "My Progress" view (assets/my-progress/progress-view.js).
 *
 * Each tool owns its own store and format. This file only ever calls
 * storage.getItem / storage.key / storage.length — never setItem or
 * removeItem — so reading progress can never change what a tool remembers.
 *
 *   nt-signal:v1                  per-standard attempts/correct (lessons, Practice Arcade)
 *   pa-summary-<lesson|unit-N>    Practice Arcade best run per lesson / unit review
 *   pa-itemlog                    Practice Arcade per-item ring buffer (recent activity)
 *   nt_results_v1                 saved activity results (activity kit, page enhance)
 *   choiceboard-u1..10            choice-board squares
 *   nsr:rec:<code>                Save/Resume records (games dashboard source)
 *   ewl-fluency-profiles-v1 (+ ewl-fluency-progress-v1[:profile-N],
 *     ewl-fluency-tutor-v2[:profile-N])   Fluency Lab learner profiles
 *   arl_progress                  Almost-Right Lab missions
 * ========================================================================== */
(function (root) {
  "use strict";

  // Below this many tries a skill is not reported at all: one question is not
  // evidence (same rule the curriculum progress page has always used).
  var MIN_ATTEMPTS = 3;
  var BANDS = [
    { id: "solid", min: 0.8 },
    { id: "growing", min: 0.5 },
    { id: "revisit", min: 0 },
  ];
  var FLUENCY_NAMES = ["Orbit", "River", "Comet", "Forest", "Ocean", "Sunrise"];
  var ARL_MISSIONS = [
    {
      id: "mission-1",
      title: "The Adding Trap · x + a = b",
      es: "La trampa de la suma · x + a = b",
    },
    {
      id: "mission-2",
      title: "The Subtraction Mix-Up · x − a = b",
      es: "La confusión de la resta · x − a = b",
    },
    {
      id: "mission-3",
      title: "The Multiplication Monster · ax = b",
      es: "El monstruo de la multiplicación · ax = b",
    },
    {
      id: "mission-4",
      title: "The Division Confusion · x ÷ a = b",
      es: "La confusión de la división · x ÷ a = b",
    },
    {
      id: "mission-5",
      title: "The Mixed-Up Brain Test · mixed one-step equations",
      es: "La prueba mezclada · ecuaciones de un paso",
    },
  ];

  function get(storage, key) {
    try {
      return storage.getItem(key);
    } catch (_e) {
      return null;
    }
  }
  function json(storage, key, fallback) {
    var raw = get(storage, key);
    if (raw == null) return fallback;
    try {
      var v = JSON.parse(raw);
      return v == null ? fallback : v;
    } catch (_e) {
      return fallback;
    }
  }
  function keys(storage) {
    var out = [];
    try {
      for (var i = 0; i < storage.length; i++) out.push(storage.key(i));
    } catch (_e) {}
    return out;
  }
  function num(v) {
    var n = Number(v);
    return isFinite(n) ? n : 0;
  }
  /** Any timestamp shape (ms number, ISO string) to ms, or 0. */
  function ms(v) {
    if (typeof v === "number") return isFinite(v) ? v : 0;
    if (!v) return 0;
    var t = Date.parse(v);
    return isFinite(t) ? t : 0;
  }
  function isObj(v) {
    return !!v && typeof v === "object" && !Array.isArray(v);
  }

  function readSignal(storage) {
    var p = json(storage, "nt-signal:v1", {});
    var standards = isObj(p.standards) ? p.standards : {};
    var out = {};
    Object.keys(standards).forEach(function (code) {
      var s = standards[code];
      if (!isObj(s)) return;
      out[code] = { attempts: num(s.attempts), correct: num(s.correct), lastTs: ms(s.lastTs) };
    });
    return { standards: out, lastLesson: typeof p.lastLesson === "string" ? p.lastLesson : "" };
  }

  function readArcade(storage) {
    var runs = [];
    keys(storage).forEach(function (k) {
      var m = /^pa-summary-(.+)$/.exec(k || "");
      if (!m) return;
      var v = json(storage, k, null);
      if (!isObj(v)) return;
      var unit = /^unit-(\d+)$/.exec(m[1]);
      runs.push({
        id: m[1],
        unit: unit ? Number(unit[1]) : null,
        lesson: unit ? "" : m[1],
        score: num(v.score),
        stars: num(v.stars),
        firstTry: num(v.firstTry),
        total: num(v.total),
        playedAt: ms(v.playedAt),
      });
    });
    var log = json(storage, "pa-itemlog", []);
    var items = Array.isArray(log)
      ? log.filter(isObj).map(function (r) {
          return {
            lesson: String(r.lesson || ""),
            standard: String(r.standard || ""),
            firstTry: !!r.firstTry,
            ts: ms(r.ts),
          };
        })
      : [];
    return { runs: runs, items: items };
  }

  function readResults(storage) {
    var arr = json(storage, "nt_results_v1", []);
    return (Array.isArray(arr) ? arr : []).filter(isObj).map(function (r) {
      return {
        activityId: String(r.activityId || ""),
        title: String(r.activityTitle || r.activityId || "Activity"),
        standard: String(r.standard || ""),
        percent: Math.round(num(r.scorePercent)),
        at: ms(r.completedAt),
        completedAt: r.completedAt || "",
      };
    });
  }

  var BOARD_LINES = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  function readBoards(storage) {
    var boards = [];
    for (var u = 1; u <= 10; u++) {
      var arr = json(storage, "choiceboard-u" + u, []);
      var a = Array.isArray(arr) ? arr : [];
      boards.push({
        unit: u,
        done: a.filter(Boolean).length,
        bingo: BOARD_LINES.some(function (l) {
          return l.every(function (i) {
            return a[i];
          });
        }),
      });
    }
    return boards;
  }

  function readSaves(storage) {
    var out = [];
    keys(storage).forEach(function (k) {
      if ((k || "").indexOf("nsr:rec:") !== 0) return;
      var r = json(storage, k, null);
      if (!isObj(r)) return;
      var state = isObj(r.state) ? r.state : {};
      var pct = r.progressPercent != null ? r.progressPercent : state.progressPercent;
      out.push({
        activityId: String(r.activityId || ""),
        title: String(r.activityTitle || r.activityId || "Saved work"),
        url: typeof r.url === "string" && r.url.charAt(0) === "/" ? r.url : "",
        percent:
          pct == null || pct === "" ? null : Math.max(0, Math.min(100, Math.round(num(pct)))),
        at: ms(r.updatedAt || r.createdAt),
      });
    });
    return out;
  }

  /** Fluency Lab: one entry per learner profile on this device. Tolerates both
   *  the older `sprintBest` and the newer `streakBest` best-run field. */
  function readFluency(storage) {
    var meta = json(storage, "ewl-fluency-profiles-v1", {});
    var ids = (Array.isArray(meta.ids) ? meta.ids : [0]).filter(function (id) {
      return id === Math.floor(id) && id >= 0 && id < FLUENCY_NAMES.length;
    });
    if (!ids.length) ids = [0];
    var profiles = [];
    ids.forEach(function (id) {
      var suffix = id === 0 ? "" : ":profile-" + id;
      var progress = json(storage, "ewl-fluency-progress-v1" + suffix, {});
      var tutor = json(storage, "ewl-fluency-tutor-v2" + suffix, {});
      var skills = [];
      if (isObj(progress)) {
        Object.keys(progress).forEach(function (key) {
          var r = progress[key];
          var m = /^(\d+):(.+)$/.exec(key);
          if (!m || !isObj(r)) return;
          skills.push({
            key: key,
            grade: Number(m[1]),
            skillId: m[2],
            attempts: num(r.attempts),
            correct: num(r.correct),
            best: Math.max(num(r.streakBest), num(r.sprintBest), num(r.bestStreak)),
            at: ms(r.lastPracticed),
          });
        });
      }
      var sessions =
        isObj(tutor) && Array.isArray(tutor.sessions) ? tutor.sessions.filter(isObj) : [];
      if (!skills.length && !sessions.length) return;
      profiles.push({
        id: id,
        name: FLUENCY_NAMES[id],
        skills: skills,
        sessions: sessions.map(function (s) {
          return {
            at: ms(s.at),
            answered: num(s.answered),
            correct: num(s.correct),
            mode: String(s.mode || ""),
          };
        }),
      });
    });
    return profiles;
  }

  function readAlmostRight(storage) {
    var p = json(storage, "arl_progress", null);
    if (!isObj(p)) return null;
    var done = Array.isArray(p.completedMissions) ? p.completedMissions.map(String) : [];
    var stars = isObj(p.missionStars) ? p.missionStars : {};
    return {
      missions: ARL_MISSIONS.map(function (m) {
        return {
          id: m.id,
          title: m.title,
          es: m.es,
          done: done.indexOf(m.id) >= 0,
          stars: num(stars[m.id]),
        };
      }),
      mastered: Array.isArray(p.masteredSkills) ? p.masteredSkills.map(String) : [],
      at: ms(p.lastPlayedAt),
    };
  }

  function collect(storage) {
    return {
      signal: readSignal(storage),
      arcade: readArcade(storage),
      results: readResults(storage),
      boards: readBoards(storage),
      saves: readSaves(storage),
      fluency: readFluency(storage),
      almostRight: readAlmostRight(storage),
    };
  }

  function bandOf(rate) {
    for (var i = 0; i < BANDS.length; i++) if (rate >= BANDS[i].min) return BANDS[i].id;
    return "revisit";
  }

  /** Standards with enough evidence, grouped into the three bands. */
  function skillRows(snapshot) {
    var rows = [];
    var standards = snapshot.signal.standards;
    Object.keys(standards).forEach(function (code) {
      var s = standards[code];
      var attempts = s.attempts;
      if (attempts < MIN_ATTEMPTS) return;
      rows.push({
        code: code,
        attempts: attempts,
        correct: s.correct,
        rate: s.correct / attempts,
        lastTs: s.lastTs,
        band: bandOf(s.correct / attempts),
      });
    });
    rows.sort(function (a, b) {
      return b.lastTs - a.lastTs;
    });
    return rows;
  }

  function lessonHref(run) {
    return run.unit
      ? "/math/games/practice-arcade/?unit=" + run.unit
      : "/math/games/practice-arcade/?lesson=" + encodeURIComponent(run.lesson);
  }

  /** One next step, from the strongest evidence available. Never a verdict. */
  function nextSuggestion(snapshot) {
    var rows = skillRows(snapshot);
    var revisit = rows.filter(function (r) {
      return r.band === "revisit";
    })[0];
    if (revisit)
      return {
        kind: "standard",
        code: revisit.code,
        href: "/curriculum/units/?q=" + encodeURIComponent(revisit.code),
        reason: "revisit",
      };
    var fl = [];
    snapshot.fluency.forEach(function (p) {
      p.skills.forEach(function (s) {
        if (s.attempts >= MIN_ATTEMPTS && s.correct / s.attempts < 0.7) fl.push({ p: p, s: s });
      });
    });
    fl.sort(function (a, b) {
      return a.s.correct / a.s.attempts - b.s.correct / b.s.attempts;
    });
    if (fl[0])
      return {
        kind: "fluency",
        skillId: fl[0].s.skillId,
        grade: fl[0].s.grade,
        profile: fl[0].p.name,
        href: "/math/fluency-lab/",
        reason: "fluency",
      };
    var arl = snapshot.almostRight;
    if (
      arl &&
      arl.missions.some(function (m) {
        return m.done;
      })
    ) {
      var nextM = arl.missions.filter(function (m) {
        return !m.done;
      })[0];
      if (nextM)
        return {
          kind: "mission",
          title: nextM.title,
          es: nextM.es,
          href: "/curriculum/almost-right-lab/equations/" + nextM.id + "/",
          reason: "mission",
        };
    }
    var runs = snapshot.arcade.runs
      .filter(function (r) {
        return r.stars < 3;
      })
      .sort(function (a, b) {
        return b.playedAt - a.playedAt;
      });
    if (runs[0])
      return { kind: "arcade", run: runs[0], href: lessonHref(runs[0]), reason: "arcade" };
    var growing = rows.filter(function (r) {
      return r.band === "growing";
    })[0];
    if (growing)
      return {
        kind: "standard",
        code: growing.code,
        href: "/curriculum/units/?q=" + encodeURIComponent(growing.code),
        reason: "growing",
      };
    return { kind: "start", href: "/curriculum/units/", reason: "start" };
  }

  /** Newest-first timeline across every store (bounded). */
  function recentActivity(snapshot, limit) {
    var ev = [];
    snapshot.arcade.runs.forEach(function (r) {
      if (r.playedAt)
        ev.push({
          at: r.playedAt,
          source: "arcade",
          title: r.unit
            ? "Practice Arcade · Unit " + r.unit
            : "Practice Arcade · Lesson " + r.lesson,
          detail: r.stars + "★",
          href: lessonHref(r),
        });
    });
    snapshot.results.forEach(function (r) {
      if (r.at)
        ev.push({
          at: r.at,
          source: "activity",
          title: r.title,
          detail: r.percent + "%",
          href: "",
        });
    });
    snapshot.saves.forEach(function (r) {
      if (r.at)
        ev.push({
          at: r.at,
          source: "save",
          title: r.title,
          detail: r.percent == null ? "" : r.percent + "%",
          href: r.url,
        });
    });
    snapshot.fluency.forEach(function (p) {
      p.sessions.forEach(function (s) {
        if (s.at)
          ev.push({
            at: s.at,
            source: "fluency",
            title: "Fluency Lab · " + p.name,
            detail: s.correct + "/" + s.answered,
            href: "/math/fluency-lab/",
          });
      });
    });
    var arl = snapshot.almostRight;
    if (arl && arl.at) {
      var n = arl.missions.filter(function (m) {
        return m.done;
      }).length;
      ev.push({
        at: arl.at,
        source: "almost-right",
        title: "Almost-Right Lab",
        detail: n + "/5",
        href: "/curriculum/almost-right-lab/",
      });
    }
    ev.sort(function (a, b) {
      return b.at - a.at;
    });
    return ev.slice(0, limit || 12);
  }

  function isEmpty(s) {
    return (
      !Object.keys(s.signal.standards).length &&
      !s.arcade.runs.length &&
      !s.results.length &&
      !s.saves.length &&
      !s.fluency.length &&
      !s.almostRight &&
      !s.boards.some(function (b) {
        return b.done > 0;
      })
    );
  }

  var api = {
    MIN_ATTEMPTS: MIN_ATTEMPTS,
    BANDS: BANDS,
    collect: collect,
    skillRows: skillRows,
    nextSuggestion: nextSuggestion,
    recentActivity: recentActivity,
    isEmpty: isEmpty,
    lessonHref: lessonHref,
  };
  root.NTProgressStores = api;
})(typeof window !== "undefined" ? window : globalThis);

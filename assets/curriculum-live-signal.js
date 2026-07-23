/**
 * curriculum-live-signal.js — the OPTIONAL live-data layer for the curriculum
 * hub's Today panel. Closes the data→decision loop at the moment of teaching:
 * recent attempt/miss counts per lesson for the selected section (from the
 * TEACHER_KEY-gated /api/misconception-heatmap telemetry rollup), with a
 * one-click catch-up station suggestion when a lesson band is missing badly.
 *
 * Kept OUT of curriculum-teacher-workflow.js on purpose: the core workflow is
 * local & private by contract (tools/validate-curriculum-teacher-workflow.mjs
 * forbids any /api fetch there). This module is additive — when the script is
 * absent or any layer fails (no key, 503, offline) the Today panel renders
 * exactly as before. Counts only; no student names are shown or stored here.
 *
 * API: window.CurriculumLiveSignal.render(stage, ctx) where ctx supplies the
 * workflow's own helpers: { el, button, link, section, catchUps, rerender }.
 */
(function () {
  "use strict";

  var LIVE_KEY_LS = "neft.teacher.key"; // shared with Insight Brief
  var cache = { at: 0, data: null };

  function liveKey() {
    try {
      return (localStorage.getItem(LIVE_KEY_LS) || "").trim();
    } catch (error) {
      return "";
    }
  }

  function loadLiveRows(key) {
    if (cache.data && Date.now() - cache.at < 5 * 60 * 1000) {
      return Promise.resolve(cache.data);
    }
    return fetch("/api/misconception-heatmap?days=7", {
      headers: { "x-teacher-key": key },
    }).then(function (response) {
      if (response.status === 401) throw new Error("key-rejected");
      if (!response.ok) throw new Error("unavailable");
      return response.json().then(function (data) {
        cache = { at: Date.now(), data: data };
        return data;
      });
    });
  }

  function lessonIdFromSlug(slug) {
    var m = /^lessons-(\d+-\d+[a-z0-9-]*)$/i.exec(String(slug || ""));
    return m ? m[1] : "";
  }

  // The catch-up station covering a core lesson: the unit's catch-up whose
  // band-closing lesson number is the smallest one >= this lesson's number
  // (catch-up ids follow the {unit}-{lastLessonOfBand}-catchup convention).
  function catchUpForLesson(catchUps, coreId) {
    var m = /^(\d+)-(\d+)/.exec(String(coreId || ""));
    if (!m) return null;
    var unit = Number(m[1]);
    var num = Number(m[2]);
    var best = null;
    (catchUps || []).forEach(function (catchUp) {
      var cm = /^(\d+)-(\d+)-catchup$/.exec(catchUp.id);
      if (!cm || Number(cm[1]) !== unit) return;
      var last = Number(cm[2]);
      if (last >= num && (!best || last < best.last)) best = { last: last, entry: catchUp };
    });
    return best ? best.entry : null;
  }

  function render(stage, ctx) {
    var el = ctx.el;
    var button = ctx.button;
    var link = ctx.link;
    var section = ctx.section || "";

    var card = el("section", "ctw-readiness ctw-live");
    card.appendChild(el("h3", null, "Live class signal · " + section));
    var body = el("div", "ctw-live-body");
    card.appendChild(body);
    stage.appendChild(card);

    var key = liveKey();
    if (!key) {
      var hint = el(
        "p",
        "ctw-muted",
        "See real attempt + miss data from your students here (last 7 days). ",
      );
      var connect = button("Connect live data", function () {
        var entered = (prompt("Teacher key (same key as Insight Brief):") || "").trim();
        if (!entered) return;
        try {
          localStorage.setItem(LIVE_KEY_LS, entered);
        } catch (error) {}
        if (ctx.rerender) ctx.rerender();
      });
      hint.appendChild(connect);
      body.appendChild(hint);
      return;
    }

    body.appendChild(el("p", "ctw-muted", "Loading the last 7 days…"));
    loadLiveRows(key)
      .then(function (data) {
        body.textContent = "";
        var rows = (data.rows || data.lessons || [])
          .filter(function (row) {
            return !row.section || row.section === section;
          })
          .filter(function (row) {
            var id = lessonIdFromSlug(row.lessonSlug);
            return id && id.indexOf("-group") === -1 && id.indexOf("catchup") === -1;
          })
          .sort(function (a, b) {
            return String(b.lastAt || "").localeCompare(String(a.lastAt || ""));
          })
          .slice(0, 5);
        if (!rows.length) {
          body.appendChild(
            el(
              "p",
              "ctw-muted",
              "No student activity recorded for " +
                section +
                " in the last 7 days — data appears here as students work.",
            ),
          );
          return;
        }
        var table = el("table", "ctw-live-table");
        var head = el("tr");
        ["Lesson", "Attempts", "Missed", "Flags", "Suggested move"].forEach(function (label) {
          head.appendChild(el("th", null, label));
        });
        table.appendChild(head);
        rows.forEach(function (row) {
          var id = lessonIdFromSlug(row.lessonSlug);
          var attempts = Number(row.attempts) || 0;
          var misses = Number(row.misses) || 0;
          var missRate = attempts > 0 ? misses / attempts : 0;
          var tr = el("tr");
          tr.appendChild(el("td", null, id + " · " + (row.lessonTitle || "").slice(0, 44)));
          tr.appendChild(el("td", null, String(attempts)));
          tr.appendChild(
            el(
              "td",
              missRate >= 0.4 ? "ctw-live-bad" : missRate >= 0.25 ? "ctw-live-warn" : null,
              attempts ? Math.round(missRate * 100) + "%" : "—",
            ),
          );
          tr.appendChild(
            el(
              "td",
              null,
              (row.misconceptions ? row.misconceptions + " misconception" : "") +
                (row.struggles
                  ? (row.misconceptions ? " · " : "") + row.struggles + " struggle"
                  : "") || "—",
            ),
          );
          var move = el("td");
          var catchUp =
            attempts >= 6 && missRate >= 0.4 ? catchUpForLesson(ctx.catchUps, id) : null;
          if (catchUp && catchUp.resources && catchUp.resources.lesson) {
            move.appendChild(link("→ " + catchUp.id + " station", catchUp.resources.lesson));
          } else {
            move.appendChild(
              el("span", "ctw-muted", missRate >= 0.25 ? "Review in launch" : "On track"),
            );
          }
          tr.appendChild(move);
          table.appendChild(tr);
        });
        body.appendChild(table);
        var footer = el("p", "ctw-muted");
        footer.appendChild(el("span", null, "Counts only — no student names leave the server. "));
        footer.appendChild(link("Full diagnosis → Insight Brief", "/teacher-tools/insight-brief/"));
        body.appendChild(footer);
      })
      .catch(function (error) {
        body.textContent = "";
        if (error && error.message === "key-rejected") {
          try {
            localStorage.removeItem(LIVE_KEY_LS);
          } catch (e) {}
          body.appendChild(
            el(
              "p",
              "ctw-muted",
              "That teacher key was rejected — reopen this view to re-enter it.",
            ),
          );
        } else {
          body.appendChild(
            el(
              "p",
              "ctw-muted",
              "Live data isn't available right now (server not configured or offline). Everything else still works.",
            ),
          );
        }
      });
  }

  window.CurriculumLiveSignal = { render: render };
})();

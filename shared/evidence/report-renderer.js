/*
 * Thinking Trails — Report Renderer (window.EvidenceReport)
 * Renders a classroom-ready Student / Teacher / Family evidence report into a
 * container element. Pure DOM + inline-scoped CSS (prefix .tt-report). Print-safe
 * (light backgrounds). All data is local; nothing is transmitted.
 */
(function (global) {
  "use strict";

  var doc = global.document;
  var STYLE_ID = "tt-report-styles";

  function esc(s) {
    if (s === null || s === undefined) return "";
    return ("" + s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function fmtDate(iso) {
    if (!iso) return "";
    try {
      var d = new Date(iso);
      return d.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch (e) {
      return iso;
    }
  }

  function injectStyles() {
    if (doc.getElementById(STYLE_ID)) return;
    var css =
      ".tt-report{--tt-teal:#0f766e;--tt-teal-dark:#115e59;--tt-gold:#b7791f;--tt-coral:#c2410c;--tt-ink:#17202a;--tt-muted:#5b6773;--tt-line:#d8dfdc;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;color:var(--tt-ink);line-height:1.55;font-size:18px;max-width:980px;margin:0 auto}" +
      ".tt-report h2{font-size:1.5rem;margin:0 0 .25rem}" +
      ".tt-report h3{font-size:1.2rem;margin:1.25rem 0 .5rem}" +
      ".tt-card{background:#fff;border:1px solid var(--tt-line);border-radius:16px;padding:1.25rem 1.4rem;margin:1rem 0;box-shadow:0 8px 24px rgba(23,32,42,.06)}" +
      ".tt-band{display:inline-block;font-size:.8rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:.2rem .6rem;border-radius:999px;color:#fff}" +
      ".tt-band.student{background:var(--tt-teal)}.tt-band.teacher{background:var(--tt-gold)}.tt-band.family{background:var(--tt-coral)}" +
      ".tt-meta{color:var(--tt-muted);font-size:.95rem;margin:.25rem 0 0}" +
      ".tt-score{display:flex;flex-wrap:wrap;gap:1rem;margin:.75rem 0}" +
      ".tt-stat{flex:1 1 120px;background:#f6f7f2;border-radius:12px;padding:.75rem 1rem;text-align:center}" +
      ".tt-stat b{display:block;font-size:1.8rem;color:var(--tt-teal-dark)}" +
      ".tt-stat span{font-size:.85rem;color:var(--tt-muted)}" +
      ".tt-list{margin:.4rem 0;padding-left:1.2rem}.tt-list li{margin:.35rem 0}" +
      ".tt-good{color:var(--tt-teal-dark);font-weight:600}.tt-watch{color:var(--tt-coral);font-weight:600}" +
      ".tt-table{width:100%;border-collapse:collapse;margin:.5rem 0;font-size:1rem}" +
      ".tt-table th,.tt-table td{border:1px solid var(--tt-line);padding:.5rem .65rem;text-align:left}" +
      ".tt-table th{background:#eef4f3}" +
      ".tt-pill{display:inline-block;background:#eef4f3;border-radius:8px;padding:.1rem .5rem;font-size:.85rem;margin:.1rem .2rem .1rem 0}" +
      ".tt-goal{background:#eef4f3;border-left:5px solid var(--tt-teal);padding:.75rem 1rem;border-radius:8px;font-style:italic}" +
      ".tt-actions{display:flex;flex-wrap:wrap;gap:.6rem;margin:1.25rem 0}" +
      ".tt-btn{font-size:1rem;font-weight:600;padding:.7rem 1.2rem;border-radius:10px;border:2px solid var(--tt-teal);background:var(--tt-teal);color:#fff;cursor:pointer}" +
      ".tt-btn.secondary{background:#fff;color:var(--tt-teal-dark)}" +
      ".tt-btn.danger{border-color:var(--tt-coral);color:var(--tt-coral);background:#fff}" +
      ".tt-btn:focus-visible{outline:3px solid var(--tt-gold);outline-offset:2px}" +
      ".tt-privacy{font-size:.85rem;color:var(--tt-muted);margin-top:1rem}" +
      ".tt-es{color:var(--tt-muted)}" +
      "@media print{.tt-report{font-size:14px}.tt-card{box-shadow:none;break-inside:avoid}.tt-actions{display:none}body{background:#fff}}";
    var el = doc.createElement("style");
    el.id = STYLE_ID;
    el.textContent = css;
    doc.head.appendChild(el);
  }

  /* ----------------------- instructional insight rules ------------------- */

  function studentInsights(s) {
    var good = [];
    var watch = [];
    (s.skills || []).forEach(function (sk) {
      var name = labelSkill(sk.skill);
      if (sk.accuracy >= 80) good.push(name + " (" + sk.accuracy + "%)");
      else if (sk.accuracy < 60) watch.push(name + " (" + sk.accuracy + "%)");
    });
    return { good: good, watch: watch };
  }

  function labelSkill(skill) {
    var map = {
      mean: "Mean",
      median: "Median",
      mode: "Mode",
      range: "Range",
      mixed: "Choosing the right measure",
    };
    return (
      map[skill] ||
      (skill ? skill.charAt(0).toUpperCase() + skill.slice(1) : "General")
    );
  }

  // Teacher reteach moves derived from session data (spec section 9).
  function teacherMoves(s) {
    var moves = [];
    var bySkill = {};
    (s.skills || []).forEach(function (sk) {
      bySkill[sk.skill] = sk;
    });
    if (bySkill.median && bySkill.median.accuracy < 70) {
      moves.push(
        "Reteach median: order the numbers before finding the middle.",
      );
    }
    if (bySkill.range && bySkill.range.accuracy < 70) {
      moves.push(
        "Reteach range with the frame: biggest number minus smallest number.",
      );
    }
    if (bySkill.mode && bySkill.mode.accuracy < 70) {
      moves.push(
        "Reteach mode: tally each value; the most frequent wins (not the biggest).",
      );
    }
    if (bySkill.mean && bySkill.mean.accuracy < 70) {
      moves.push(
        "Reteach mean: add all values, then divide by how many there are.",
      );
    }
    if (s.hintRate >= 50) {
      moves.push(
        "High hint use — practice one more supported set before independent work.",
      );
    }
    if (s.solvedNotExplained > 0) {
      moves.push(
        s.solvedNotExplained +
          " item(s) solved correctly but with weak written reasoning — push for a 'because' that names the math step.",
      );
    }
    if (s.scorePct >= 85 && s.hintRate <= 20) {
      moves.push(
        "Strong + independent — ready for challenge/application problems.",
      );
    }
    if (!moves.length) {
      moves.push(
        "Solid session — continue with mixed practice and short written explanations.",
      );
    }
    return moves;
  }

  function smallGroups(s) {
    var groups = [];
    (s.topMisconceptions || []).forEach(function (m) {
      if (m.tag) {
        groups.push({
          focus: m.tag.studentFriendlyName,
          move: m.tag.suggestedTeacherMove,
          count: m.count,
        });
      }
    });
    return groups;
  }

  /* ----------------------- family content -------------------------------- */

  function familyEN(s) {
    var name = esc(s.studentNameOrCode);
    return (
      name +
      " answered " +
      s.correct +
      " of " +
      s.totalProblems +
      " problems (" +
      s.scorePct +
      "%) on mean, median, mode, and range. " +
      (s.hintRate >= 50
        ? "They used hints often, so a little more practice together will help."
        : "They worked with strong independence.") +
      " At home, ask them to explain one answer out loud using a full sentence."
    );
  }

  function familyES(s) {
    var name = esc(s.studentNameOrCode);
    return (
      name +
      " respondió " +
      s.correct +
      " de " +
      s.totalProblems +
      " problemas (" +
      s.scorePct +
      "%) sobre media, mediana, moda y rango. " +
      (s.hintRate >= 50
        ? "Usó pistas con frecuencia, así que practicar un poco más en casa ayudará."
        : "Trabajó con buena independencia.") +
      " En casa, pídale que explique una respuesta en voz alta con una oración completa."
    );
  }

  var HOME_PROBLEMS = [
    "Find the mean (average) of these test scores: 8, 6, 10, 8.",
    "Put these in order and find the median: 5, 2, 9, 4, 7.",
    "Find the range of these temperatures: 71, 65, 80, 68.",
  ];

  /* ----------------------- main render ----------------------------------- */

  function render(container, s, opts) {
    opts = opts || {};
    injectStyles();
    var ins = studentInsights(s);
    var moves = teacherMoves(s);
    var groups = smallGroups(s);

    var goal =
      ins.watch.length > 0
        ? "My next goal is to get stronger with " +
          esc(ins.watch[0].split(" (")[0]) +
          " and explain my steps."
        : "My next goal is to keep explaining my thinking in full sentences and try a challenge set.";

    var html = "";
    html += '<div class="tt-report">';

    /* Student section */
    html += '<section class="tt-card" aria-label="Student summary">';
    html += '<span class="tt-band student">For the Student</span>';
    html += "<h2>" + esc(s.activityTitle || "Thinking Trails Report") + "</h2>";
    html +=
      '<p class="tt-meta">' +
      esc(s.studentNameOrCode) +
      (s.standard ? " &middot; " + esc(s.standard) : "") +
      " &middot; " +
      esc(fmtDate(s.endedAt || s.startedAt)) +
      "</p>";
    html += '<div class="tt-score">';
    html +=
      '<div class="tt-stat"><b>' +
      s.scorePct +
      "%</b><span>Score (" +
      s.correct +
      "/" +
      s.totalProblems +
      ")</span></div>";
    html +=
      '<div class="tt-stat"><b>' +
      s.hintCount +
      "</b><span>Hints used</span></div>";
    html +=
      '<div class="tt-stat"><b>' +
      s.skills.length +
      "</b><span>Skills practiced</span></div>";
    html += "</div>";
    html += "<h3>My strengths</h3>";
    html += ins.good.length
      ? '<ul class="tt-list">' +
        ins.good
          .map(function (g) {
            return '<li class="tt-good">' + esc(g) + "</li>";
          })
          .join("") +
        "</ul>"
      : '<p class="tt-meta">Keep practicing — strengths will show as you finish more sets.</p>';
    html += "<h3>Skills to review</h3>";
    html += ins.watch.length
      ? '<ul class="tt-list">' +
        ins.watch
          .map(function (w) {
            return '<li class="tt-watch">' + esc(w) + "</li>";
          })
          .join("") +
        "</ul>"
      : '<p class="tt-meta">No weak spots flagged this session — nice work!</p>';
    html += '<h3>My next goal</h3><p class="tt-goal">' + goal + "</p>";
    html += "</section>";

    /* Teacher section */
    html += '<section class="tt-card" aria-label="Teacher insights">';
    html += '<span class="tt-band teacher">For the Teacher</span>';
    html += "<h3>Skill breakdown</h3>";
    html +=
      '<table class="tt-table"><thead><tr><th>Skill</th><th>Correct</th><th>Accuracy</th><th>Hints</th></tr></thead><tbody>';
    (s.skills || []).forEach(function (sk) {
      html +=
        "<tr><td>" +
        esc(labelSkill(sk.skill)) +
        "</td><td>" +
        sk.correct +
        "/" +
        sk.total +
        "</td><td>" +
        sk.accuracy +
        "%</td><td>" +
        sk.hints +
        "</td></tr>";
    });
    html += "</tbody></table>";

    html += "<h3>Top misconceptions</h3>";
    if (groups.length) {
      html += '<ul class="tt-list">';
      groups.forEach(function (g) {
        html +=
          "<li><strong>" +
          esc(g.focus) +
          "</strong> &times;" +
          g.count +
          " — " +
          esc(g.move) +
          "</li>";
      });
      html += "</ul>";
    } else {
      html +=
        '<p class="tt-meta">No recurring misconceptions detected this session.</p>';
    }

    html += "<h3>Suggested small groups</h3>";
    if (groups.length) {
      html += "<p>";
      html += groups
        .map(function (g) {
          return (
            '<span class="tt-pill">' +
            esc(g.focus) +
            " (" +
            g.count +
            ")</span>"
          );
        })
        .join("");
      html += "</p>";
    } else {
      html +=
        '<p class="tt-meta">Whole-class mixed practice is appropriate.</p>';
    }

    html += "<h3>Suggested reteach moves</h3>";
    html +=
      '<ul class="tt-list">' +
      moves
        .map(function (m) {
          return "<li>" + esc(m) + "</li>";
        })
        .join("") +
      "</ul>";

    if (s.solvedNotExplained > 0) {
      html +=
        '<p class="tt-watch">Solved correctly but could not explain: ' +
        s.solvedNotExplained +
        " item(s). Prioritize written-reasoning support for these students.</p>";
    }
    html += "</section>";

    /* Family section */
    html += '<section class="tt-card" aria-label="Family summary">';
    html += '<span class="tt-band family">For the Family</span>';
    html += "<h3>How it went</h3>";
    html += "<p>" + familyEN(s) + "</p>";
    html += '<p class="tt-es"><em>En español:</em> ' + familyES(s) + "</p>";
    html += "<h3>3 problems to try at home</h3>";
    html +=
      '<ol class="tt-list">' +
      HOME_PROBLEMS.map(function (p) {
        return "<li>" + esc(p) + "</li>";
      }).join("") +
      "</ol>";
    html +=
      "<h3>Ask your child</h3><p>&ldquo;Which one was trickiest, and how did you figure it out?&rdquo; " +
      '<span class="tt-es">(&ldquo;¿Cuál fue el más difícil y cómo lo resolviste?&rdquo;)</span></p>';
    html += "</section>";

    /* Actions + privacy */
    html += '<div class="tt-actions">';
    html +=
      '<button type="button" class="tt-btn" data-tt="print">Print / Save PDF</button>';
    html +=
      '<button type="button" class="tt-btn secondary" data-tt="csv">Export CSV</button>';
    html +=
      '<button type="button" class="tt-btn secondary" data-tt="save">Save Report (HTML)</button>';
    html +=
      '<button type="button" class="tt-btn danger" data-tt="clear">Clear Data</button>';
    html += "</div>";
    html +=
      '<p class="tt-privacy">Privacy: this report was built entirely in your browser. No student data is sent to any website, server, or company. It is gone when you clear data unless you export or print it yourself.</p>';

    html += "</div>";

    container.innerHTML = html;

    /* Wire actions */
    var printBtn = container.querySelector('[data-tt="print"]');
    if (printBtn)
      printBtn.addEventListener("click", function () {
        global.print();
      });

    var csvBtn = container.querySelector('[data-tt="csv"]');
    if (csvBtn)
      csvBtn.addEventListener("click", function () {
        if (opts.onExportCSV) opts.onExportCSV();
      });

    var saveBtn = container.querySelector('[data-tt="save"]');
    if (saveBtn)
      saveBtn.addEventListener("click", function () {
        saveReportHTML(s, html);
      });

    var clearBtn = container.querySelector('[data-tt="clear"]');
    if (clearBtn)
      clearBtn.addEventListener("click", function () {
        if (
          !global.confirm(
            "Clear this report and all saved thinking data for this session?",
          )
        )
          return;
        if (opts.onClear) opts.onClear();
        container.innerHTML =
          '<div class="tt-report"><div class="tt-card"><p>Data cleared. Nothing is stored.</p></div></div>';
      });

    return true;
  }

  function saveReportHTML(s, innerHTML) {
    try {
      var styleEl = doc.getElementById(STYLE_ID);
      var styles = styleEl ? styleEl.textContent : "";
      var page =
        "<!doctype html><html lang='en'><head><meta charset='utf-8'><title>Thinking Trails Report — " +
        esc(s.studentNameOrCode) +
        "</title><style>body{background:#f6f7f2;margin:0;padding:24px}" +
        styles +
        "</style></head><body>" +
        innerHTML +
        "</body></html>";
      var blob = new global.Blob([page], { type: "text/html;charset=utf-8" });
      var url = global.URL.createObjectURL(blob);
      var a = doc.createElement("a");
      a.href = url;
      a.download =
        global.Evidence && global.Evidence.defaultFileName
          ? global.Evidence.defaultFileName("html")
          : "thinking-trails-report.html";
      doc.body.appendChild(a);
      a.click();
      doc.body.removeChild(a);
      global.setTimeout(function () {
        global.URL.revokeObjectURL(url);
      }, 1000);
    } catch (e) {
      /* ignore */
    }
  }

  global.EvidenceReport = { render: render };
})(typeof window !== "undefined" ? window : this);

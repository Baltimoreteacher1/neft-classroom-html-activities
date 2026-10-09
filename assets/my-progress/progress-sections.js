/* ==========================================================================
 * progress-sections.js — HTML builders for the unified "My Progress" view
 * (assets/my-progress/progress-view.js). Pure string builders over the
 * read-only snapshot from NTProgressStores; every label carries its Spanish
 * sibling via t(). Exposes window.NTProgressSections.
 * ========================================================================== */
(function () {
  "use strict";
  var S = window.NTProgressStores;
  if (!S) return;
  var MIN_ATTEMPTS = S.MIN_ATTEMPTS;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  /** English with its Spanish sibling. Both are plain text (escaped). */
  function t(en, es) {
    return esc(en) + ' <span class="up-es" lang="es">' + esc(es) + "</span>";
  }
  function when(ts) {
    if (!ts) return "";
    var d = Math.floor((Date.now() - ts) / 86400000);
    if (d <= 0) return "today · hoy";
    if (d === 1) return "yesterday · ayer";
    if (d < 14) return d + " days ago · hace " + d + " días";
    return new Date(ts).toLocaleDateString();
  }
  function stars(n) {
    var k = Math.max(0, Math.min(3, Math.round(n)));
    return (
      '<span aria-label="' +
      k +
      ' of 3 stars">' +
      "★★★".slice(0, k) +
      '<span class="up-dim">' +
      "★★★".slice(k) +
      "</span></span>"
    );
  }
  function humanize(id) {
    return String(id || "")
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, function (c) {
        return c.toUpperCase();
      });
  }

  var BAND_TEXT = {
    solid: {
      title: t("You can do these", "Puedes hacer estas"),
      note: t(
        "Your recent work on these has been steady. They will still come back for review — that is how they stay solid.",
        "Tu trabajo reciente en estas ha sido constante. Volverán en repasos; así se mantienen firmes.",
      ),
    },
    growing: {
      title: t("Getting there", "Vas avanzando"),
      note: t(
        "You are landing more of these than not. A few more goes and they move up.",
        "Aciertas más de las que fallas. Con unos intentos más, suben.",
      ),
    },
    revisit: {
      title: t("Worth another look", "Vale la pena repasar"),
      note: t(
        "These are the ones to spend time on. Nothing here is a verdict — it is just where the practice will pay off most.",
        "Aquí conviene practicar. Nada de esto es un juicio: es donde la práctica rinde más.",
      ),
    },
  };

  function section(id, titleHtml, bodyHtml) {
    return (
      '<section class="up-section" aria-labelledby="up-' +
      id +
      '"><h2 id="up-' +
      id +
      '">' +
      titleHtml +
      "</h2>" +
      bodyHtml +
      "</section>"
    );
  }
  function table(headHtml, rowsHtml) {
    return (
      '<div class="up-table-wrap"><table class="up-table"><thead><tr>' +
      headHtml +
      "</tr></thead><tbody>" +
      rowsHtml +
      "</tbody></table></div>"
    );
  }
  function card(n, labelHtml) {
    return (
      '<div class="up-card"><div class="up-num">' +
      esc(n) +
      '</div><div class="up-lbl">' +
      labelHtml +
      "</div></div>"
    );
  }

  function summaryHtml(snap, rows) {
    var fluencySkills = 0;
    snap.fluency.forEach(function (p) {
      fluencySkills += p.skills.length;
    });
    var missions = snap.almostRight
      ? snap.almostRight.missions.filter(function (m) {
          return m.done;
        }).length
      : 0;
    return (
      '<div class="up-cards">' +
      card(rows.length, t("Skills with evidence", "Habilidades con evidencia")) +
      card(snap.arcade.runs.length, t("Lessons & reviews played", "Lecciones y repasos jugados")) +
      card(snap.results.length, t("Activities saved", "Actividades guardadas")) +
      card(fluencySkills, t("Fluency skills practiced", "Habilidades de fluidez")) +
      card(missions + "/5", t("Almost-Right missions", "Misiones Almost-Right")) +
      "</div>"
    );
  }

  function nextHtml(snap, registry, fluencyTitle) {
    var n = S.nextSuggestion(snap);
    var head, why;
    if (n.kind === "standard") {
      var e = registry[n.code];
      head =
        esc((e && e.shortLabel) || n.code) + ' <span class="up-code">' + esc(n.code) + "</span>";
      why =
        n.reason === "revisit"
          ? t(
              "Your recent tries on this skill are where practice will pay off most.",
              "Tus intentos recientes muestran que practicar esta habilidad rinde mucho.",
            )
          : t(
              "You are close on this skill. A few more tries will lock it in.",
              "Ya casi dominas esta habilidad. Unos intentos más la afianzan.",
            );
    } else if (n.kind === "fluency") {
      head =
        esc(fluencyTitle(n.grade, n.skillId)) +
        ' <span class="up-code">Fluency Lab · ' +
        esc(n.profile) +
        "</span>";
      why = t(
        "A short practice set in the Fluency Lab will build speed and accuracy here.",
        "Una práctica corta en el Fluency Lab te dará rapidez y precisión.",
      );
    } else if (n.kind === "mission") {
      head = t(n.title, n.es);
      why = t(
        "Your next Almost-Right Lab mission is ready.",
        "Tu próxima misión del Almost-Right Lab está lista.",
      );
    } else if (n.kind === "arcade") {
      head = esc(
        n.run.unit
          ? "Practice Arcade · Unit " + n.run.unit + " review"
          : "Practice Arcade · Lesson " + n.run.lesson,
      );
      why = t(
        "Play it again to earn all three stars with first-try solves.",
        "Juega otra vez para ganar las tres estrellas resolviendo al primer intento.",
      );
    } else {
      head = t("Start with today's lesson", "Empieza con la lección de hoy");
      why = t(
        "Practice a lesson or a game, and your next step will appear here.",
        "Practica una lección o un juego y aquí aparecerá tu próximo paso.",
      );
    }
    return (
      '<div class="up-next"><p class="up-kicker">' +
      t("Next suggested skill", "Próxima habilidad sugerida") +
      '</p><p class="up-next-head">' +
      head +
      '</p><p class="up-next-why">' +
      why +
      '</p><a class="up-btn" href="' +
      esc(n.href) +
      '">' +
      t("Practice this", "Practicar esto") +
      "</a></div>"
    );
  }

  function skillsHtml(rows, registry) {
    if (!rows.length)
      return section(
        "skills",
        t("Skills by standard", "Habilidades por estándar"),
        '<p class="up-note">' +
          t(
            "It takes " +
              MIN_ATTEMPTS +
              " tries on a skill before this page says anything about it — one question is not evidence.",
            "Se necesitan " +
              MIN_ATTEMPTS +
              " intentos en una habilidad antes de mostrarla: una sola pregunta no es evidencia.",
          ) +
          "</p>",
      );
    var html = "";
    S.BANDS.forEach(function (band) {
      var inBand = rows.filter(function (r) {
        return r.band === band.id;
      });
      if (!inBand.length) return;
      html +=
        "<h3>" +
        BAND_TEXT[band.id].title +
        ' <span class="up-count">(' +
        inBand.length +
        ')</span></h3><p class="up-note">' +
        BAND_TEXT[band.id].note +
        '</p><ul class="up-skills">' +
        inBand
          .map(function (r) {
            var e = registry[r.code] || null;
            var unit = e && e.unit ? "Unit " + e.unit + " · " : "";
            return (
              '<li class="up-skill ' +
              band.id +
              '"><p class="up-skill-can" title="' +
              esc(e && e.fullText ? e.fullText : "") +
              '">' +
              esc((e && e.shortLabel) || r.code) +
              '</p><p class="up-meta">' +
              esc(
                unit +
                  r.code +
                  " · " +
                  r.correct +
                  " of " +
                  r.attempts +
                  " recent tries · " +
                  when(r.lastTs),
              ) +
              '</p><a class="up-link" href="/curriculum/units/?q=' +
              encodeURIComponent(r.code) +
              '">' +
              t("Practise this", "Practicar esto") +
              "</a></li>"
            );
          })
          .join("") +
        "</ul>";
    });
    return section("skills", t("Skills by standard", "Habilidades por estándar"), html);
  }

  function lessonsHtml(snap) {
    var parts = "";
    var runs = snap.arcade.runs.slice().sort(function (a, b) {
      return a.unit === b.unit
        ? String(a.lesson).localeCompare(String(b.lesson), undefined, { numeric: true })
        : (a.unit || 0) - (b.unit || 0);
    });
    if (runs.length)
      parts +=
        "<h3>" +
        t("Practice Arcade", "Practice Arcade") +
        "</h3>" +
        table(
          "<th>" +
            t("Lesson", "Lección") +
            "</th><th>" +
            t("Stars", "Estrellas") +
            "</th><th>" +
            t("First try", "Primer intento") +
            "</th><th>" +
            t("Played", "Jugado") +
            "</th><th></th>",
          runs
            .map(function (r) {
              return (
                "<tr><td>" +
                esc(r.unit ? "Unit " + r.unit + " review" : "Lesson " + r.lesson) +
                "</td><td>" +
                stars(r.stars) +
                "</td><td>" +
                esc(r.firstTry + "/" + r.total) +
                "</td><td>" +
                esc(when(r.playedAt)) +
                '</td><td><a class="up-link" href="' +
                esc(S.lessonHref(r)) +
                '">' +
                t("Play", "Jugar") +
                "</a></td></tr>"
              );
            })
            .join(""),
        );
    var saves = snap.saves.slice().sort(function (a, b) {
      return b.at - a.at;
    });
    if (saves.length)
      parts +=
        "<h3>" +
        t("Saved games and activities", "Juegos y actividades guardados") +
        "</h3>" +
        table(
          "<th>" +
            t("Activity", "Actividad") +
            "</th><th>" +
            t("Progress", "Progreso") +
            "</th><th>" +
            t("Saved", "Guardado") +
            "</th><th></th>",
          saves
            .map(function (r) {
              return (
                "<tr><td>" +
                esc(r.title) +
                "</td><td>" +
                (r.percent == null
                  ? "—"
                  : '<span class="up-bar"><span style="width:' +
                    r.percent +
                    '%"></span></span> ' +
                    r.percent +
                    "%") +
                "</td><td>" +
                esc(when(r.at)) +
                "</td><td>" +
                (r.url
                  ? '<a class="up-link" href="' +
                    esc(r.url) +
                    '">' +
                    t("Continue", "Continuar") +
                    "</a>"
                  : "") +
                "</td></tr>"
              );
            })
            .join(""),
        );
    var arl = snap.almostRight;
    if (arl)
      parts +=
        "<h3>" +
        t("Almost-Right Lab missions", "Misiones del Almost-Right Lab") +
        '</h3><ul class="up-missions">' +
        arl.missions
          .map(function (m) {
            return (
              '<li class="' +
              (m.done ? "done" : "") +
              '"><span>' +
              (m.done ? "✓ " : "○ ") +
              t(m.title, m.es) +
              "</span> " +
              (m.done ? stars(m.stars) : "") +
              "</li>"
            );
          })
          .join("") +
        "</ul>";
    var boards = snap.boards.filter(function (b) {
      return b.done > 0;
    });
    if (boards.length)
      parts +=
        "<h3>" +
        t("Choice boards", "Tableros de opciones") +
        '</h3><div class="up-boards">' +
        snap.boards
          .map(function (b) {
            return (
              '<div class="up-board' +
              (b.bingo ? " bingo" : "") +
              '">U' +
              b.unit +
              "<br>" +
              b.done +
              "/9" +
              (b.bingo ? " 🎉" : "") +
              "</div>"
            );
          })
          .join("") +
        "</div>";
    return parts ? section("lessons", t("Lessons and games", "Lecciones y juegos"), parts) : "";
  }

  function fluencyHtml(snap, fluencyTitle) {
    if (!snap.fluency.length) return "";
    var html = snap.fluency
      .map(function (p) {
        var skills = p.skills.slice().sort(function (a, b) {
          return b.at - a.at;
        });
        return (
          "<h3>" +
          t("Learner: " + p.name, "Estudiante: " + p.name) +
          "</h3>" +
          (skills.length
            ? table(
                "<th>" +
                  t("Skill", "Habilidad") +
                  "</th><th>" +
                  t("Accuracy", "Precisión") +
                  "</th><th>" +
                  t("Best run", "Mejor racha") +
                  "</th><th>" +
                  t("Last practiced", "Última práctica") +
                  "</th>",
                skills
                  .map(function (s) {
                    var acc = s.attempts
                      ? Math.round((s.correct / s.attempts) * 100) +
                        "% (" +
                        s.correct +
                        "/" +
                        s.attempts +
                        ")"
                      : "—";
                    return (
                      "<tr><td>" +
                      esc(fluencyTitle(s.grade, s.skillId)) +
                      ' <span class="up-code">Gr ' +
                      s.grade +
                      "</span></td><td>" +
                      esc(acc) +
                      "</td><td>" +
                      esc(s.best || "—") +
                      "</td><td>" +
                      esc(when(s.at)) +
                      "</td></tr>"
                    );
                  })
                  .join(""),
              )
            : '<p class="up-note">' +
              t(
                "Practice sessions saved; no skill records yet.",
                "Sesiones guardadas; aún no hay registros de habilidades.",
              ) +
              "</p>")
        );
      })
      .join("");
    return section(
      "fluency",
      t("Fluency Lab", "Fluency Lab") +
        ' <a class="up-link" href="/math/fluency-lab/">' +
        t("Open", "Abrir") +
        "</a>",
      html,
    );
  }

  function strandOf(std) {
    var m = String(std || "").match(/6\.[A-Z]{1,3}/);
    return m ? m[0] : "Other";
  }
  function resultsHtml(snap) {
    var res = snap.results;
    if (!res.length) return "";
    var n = res.length;
    var avg = Math.round(
      res.reduce(function (a, r) {
        return a + r.percent;
      }, 0) / n,
    );
    var byS = {};
    res.forEach(function (r) {
      (byS[strandOf(r.standard)] = byS[strandOf(r.standard)] || []).push(r.percent);
    });
    var bars = Object.keys(byS)
      .sort()
      .map(function (s) {
        var a = Math.round(
          byS[s].reduce(function (x, y) {
            return x + y;
          }, 0) / byS[s].length,
        );
        return (
          '<div class="up-barrow"><span class="up-nm">' +
          esc(s) +
          '</span><span class="up-bar wide"><span style="width:' +
          a +
          '%"></span></span><span class="up-pct">' +
          a +
          "%</span></div>"
        );
      })
      .join("");
    var bingos = snap.boards.filter(function (b) {
      return b.bingo;
    }).length;
    var badges = [
      [n >= 1, "🌱 Getting Started", "Primeros pasos"],
      [n >= 5, "⭐ 5 Activities", "5 actividades"],
      [n >= 10, "🏅 10 Activities", "10 actividades"],
      [n >= 20, "🏆 20 Activities", "20 actividades"],
      [avg >= 80 && n >= 3, "🎯 80%+ Average", "Promedio de 80%+"],
      [Object.keys(byS).length >= 5, "🌈 All 5 Strands", "Las 5 áreas"],
      [bingos >= 1, "🎉 First Bingo", "Primer bingo"],
      [bingos >= 5, "🔥 5 Bingos", "5 bingos"],
    ]
      .map(function (b) {
        return (
          '<span class="up-badge' +
          (b[0] ? "" : " lock") +
          '">' +
          (b[0] ? "" : "🔒 ") +
          t(b[1], b[2]) +
          "</span>"
        );
      })
      .join("");
    var hist = res
      .slice()
      .sort(function (a, b) {
        return b.at - a.at;
      })
      .map(function (r) {
        return (
          "<tr><td>" +
          esc(r.title) +
          "</td><td>" +
          esc(r.standard || "—") +
          "</td><td>" +
          r.percent +
          "%</td><td>" +
          esc(r.at ? new Date(r.at).toLocaleDateString() : "") +
          "</td></tr>"
        );
      })
      .join("");
    return section(
      "results",
      t("Saved activity results", "Resultados de actividades"),
      '<p class="up-note">' +
        t(n + " activities · average " + avg + "%", n + " actividades · promedio " + avg + "%") +
        '</p><div class="up-badges">' +
        badges +
        "</div>" +
        bars +
        table(
          "<th>" +
            t("Activity", "Actividad") +
            "</th><th>" +
            t("Standard", "Estándar") +
            "</th><th>" +
            t("Score", "Puntaje") +
            "</th><th>" +
            t("Date", "Fecha") +
            "</th>",
          hist,
        ),
    );
  }

  function recentHtml(snap) {
    var ev = S.recentActivity(snap, 12);
    if (!ev.length) return "";
    return section(
      "recent",
      t("Recent activity", "Actividad reciente"),
      '<ol class="up-recent">' +
        ev
          .map(function (e) {
            var title = e.href
              ? '<a class="up-link" href="' + esc(e.href) + '">' + esc(e.title) + "</a>"
              : esc(e.title);
            return (
              "<li><span>" +
              title +
              (e.detail ? ' <span class="up-code">' + esc(e.detail) + "</span>" : "") +
              '</span><span class="up-meta">' +
              esc(when(e.at)) +
              "</span></li>"
            );
          })
          .join("") +
        "</ol>",
    );
  }

  function emptyHtml() {
    return (
      '<div class="up-empty"><p><strong>' +
      t("Nothing to show yet.", "Todavía no hay nada que mostrar.") +
      "</strong></p><p>" +
      t(
        "Work through a lesson, a game, the Fluency Lab or the Almost-Right Lab and your progress will appear here. It takes a few tries on a skill before this page will say anything about it — one question is not evidence.",
        "Trabaja en una lección, un juego, el Fluency Lab o el Almost-Right Lab y tu progreso aparecerá aquí. Se necesitan varios intentos en una habilidad antes de mostrarla: una sola pregunta no es evidencia.",
      ) +
      '</p><p><a class="up-btn" href="/curriculum/units/">' +
      t("Go to the lessons", "Ir a las lecciones") +
      "</a></p></div>"
    );
  }

  window.NTProgressSections = {
    esc: esc,
    t: t,
    humanize: humanize,
    summaryHtml: summaryHtml,
    nextHtml: nextHtml,
    skillsHtml: skillsHtml,
    lessonsHtml: lessonsHtml,
    fluencyHtml: fluencyHtml,
    resultsHtml: resultsHtml,
    recentHtml: recentHtml,
    emptyHtml: emptyHtml,
  };
})();

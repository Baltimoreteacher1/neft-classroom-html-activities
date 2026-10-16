/* ==========================================================================
 * progress-atlas-check.js — the "I know this — prove it" panel of the
 * Learning Atlas (assets/my-progress/progress-atlas.js).
 *
 * Three questions from data/retrieval-bank.json, answered on one form. A
 * question whose right answer is a single number is typed and judged by the
 * site's answer matcher (progress-atlas-match.js, generated from
 * engine/core/answer-match.js); every other question is multiple choice.
 *
 * It is never a grade: the result is a sentence about the skill, not a score,
 * and a miss is "look again" with the explanation the lesson already carries.
 * The explanation appears only AFTER the whole check is finished.
 * ========================================================================== */
(function (root) {
  "use strict";
  var V = root.NTProgressSections;
  var M = root.NTAtlasModel;
  if (!V || !M) return;
  var t = V.t;
  var esc = V.esc;

  function questionHtml(item, i) {
    var name = "atq" + i;
    var head =
      '<legend class="at-q-stem"><span class="at-q-n">' +
      (i + 1) +
      '</span><span lang="en">' +
      esc(item.stem) +
      "</span></legend>";
    if (item.typed)
      return (
        '<fieldset class="at-q">' +
        head +
        '<label class="at-q-type"><span class="at-sr">' +
        t("Your answer", "Tu respuesta") +
        '</span><input type="text" name="' +
        name +
        '" autocomplete="off" autocapitalize="off" spellcheck="false" class="at-input" placeholder="' +
        esc("Type your answer · Escribe tu respuesta") +
        '" data-fk="q' +
        i +
        '"></label></fieldset>'
      );
    return (
      '<fieldset class="at-q">' +
      head +
      item.choices
        .map(function (c, k) {
          return (
            '<label class="at-choice"><input type="radio" name="' +
            name +
            '" value="' +
            k +
            '"><span lang="en">' +
            esc(c) +
            "</span></label>"
          );
        })
        .join("") +
      "</fieldset>"
    );
  }

  function formHtml(o) {
    var recheck = o.kind === "r";
    return (
      '<h3 id="at-check-title" tabindex="-1">' +
      (recheck
        ? t("Re-check: " + o.node.en, "Repaso de prueba: " + o.node.es)
        : t("Prove it: " + o.node.en, "Demuéstralo: " + o.node.es)) +
      '</h3><p class="at-note">' +
      (recheck
        ? t(
            "A week ago you showed this skill. Show it once more and it becomes Owned.",
            "Hace una semana mostraste esta habilidad. Muéstrala otra vez y será tuya.",
          )
        : t(
            "Three questions. There is no grade and no timer. Answer all three, then check.",
            "Tres preguntas. No hay calificación ni reloj. Contesta las tres y luego revisa.",
          )) +
      '</p><p class="at-note at-note-es" lang="es">Las preguntas están en inglés, como en tus lecciones.</p>' +
      '<form class="at-form" novalidate>' +
      o.items.map(questionHtml).join("") +
      '<p class="at-form-msg" role="alert" data-at="msg"></p>' +
      '<div class="at-actions"><button type="submit" class="at-btn" data-fk="submit">' +
      t("Check my answers", "Revisar mis respuestas") +
      '</button><button type="button" class="at-btn ghost" data-at="cancel" data-fk="cancel">' +
      t("Not now", "Ahora no") +
      "</button></div></form>"
    );
  }

  function resultHtml(o, results, outcome) {
    var recheck = o.kind === "r";
    var msg;
    if (outcome === "owned")
      msg = t(
        "Owned! You showed it today and again a week later. This skill is yours.",
        "¡Es tuyo! Lo mostraste hoy y otra vez una semana después. Esta habilidad es tuya.",
      );
    else if (outcome === "passed")
      msg = t(
        "You showed it! Come back in " +
          M.RECHECK_DAYS +
          " days for a quick re-check, and this skill becomes Owned.",
        "¡Lo mostraste! Vuelve en " +
          M.RECHECK_DAYS +
          " días para un repaso rápido y esta habilidad será tuya.",
      );
    else if (recheck)
      msg = t(
        "Close. Your first proof still counts. Look these over and try the re-check again whenever you are ready.",
        "Casi. Tu primera prueba sigue valiendo. Repásalas y vuelve a intentar el repaso cuando quieras.",
      );
    else
      msg = t(
        "Not yet, and that is okay. Checking is how a skill gets stronger. Look these over and try again whenever you are ready.",
        "Todavía no, y está bien. Revisar es como una habilidad se fortalece. Repásalas e inténtalo de nuevo cuando quieras.",
      );
    var rows = o.items
      .map(function (item, i) {
        var ok = results[i];
        return (
          '<li class="at-r ' +
          (ok ? "ok" : "again") +
          '"><p class="at-r-head"><strong>' +
          (ok ? t("Got it", "Lo lograste") : t("Look again", "Mira otra vez")) +
          '</strong> <span lang="en">' +
          esc(item.stem) +
          "</span></p>" +
          (ok || !item.explanation
            ? ""
            : '<p class="at-r-why" lang="en">' + esc(item.explanation) + "</p>") +
          "</li>"
        );
      })
      .join("");
    return (
      '<h3 id="at-check-title" tabindex="-1">' +
      t(o.node.en, o.node.es) +
      '</h3><div role="status" aria-live="polite"><p class="at-result">' +
      msg +
      '</p></div><ol class="at-results">' +
      rows +
      '</ol><div class="at-actions">' +
      (outcome === "notyet"
        ? '<button type="button" class="at-btn" data-at="again" data-fk="again">' +
          t("Try again", "Intentar de nuevo") +
          "</button>"
        : "") +
      '<button type="button" class="at-btn ghost" data-at="close" data-fk="close">' +
      t("Back to the Atlas", "Volver al Atlas") +
      "</button></div>"
    );
  }

  /**
   * Show a check in `host`. o = { node, kind: "c"|"r", items,
   * finish(score, ids) -> outcome, onClose(retry) }.
   */
  function open(host, o) {
    host.hidden = false;
    host.innerHTML = formHtml(o);
    var title = host.querySelector("#at-check-title");
    if (title) title.focus();
    var form = host.querySelector("form");
    var msg = host.querySelector("[data-at=msg]");

    host.onkeydown = function (e) {
      if (e.key === "Escape") o.onClose(false);
    };
    host.querySelector("[data-at=cancel]").addEventListener("click", function () {
      o.onClose(false);
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var answers = o.items.map(function (item, i) {
        var field = form.elements["atq" + i];
        if (item.typed) return field && field.value.trim() ? { text: field.value } : null;
        var picked = form.querySelector('input[name="atq' + i + '"]:checked');
        return picked ? { index: Number(picked.value) } : null;
      });
      if (
        answers.some(function (a) {
          return !a;
        })
      ) {
        msg.innerHTML = t(
          "Answer all three questions, then check.",
          "Contesta las tres preguntas y luego revisa.",
        );
        return;
      }
      var results = o.items.map(function (item, i) {
        return M.judge(item, answers[i]);
      });
      var score = results.filter(Boolean).length;
      var outcome = o.finish(
        score,
        o.items.map(function (it) {
          return it.id;
        }),
      );
      host.innerHTML = resultHtml(o, results, outcome);
      var again = host.querySelector("[data-at=again]");
      if (again)
        again.addEventListener("click", function () {
          o.onClose(true);
        });
      host.querySelector("[data-at=close]").addEventListener("click", function () {
        o.onClose(false);
      });
      var heading = host.querySelector("#at-check-title");
      if (heading) heading.focus();
    });
  }

  root.NTAtlasCheck = { open: open };
})(typeof window !== "undefined" ? window : globalThis);

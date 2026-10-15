/* ==========================================================================
 * progress-reasoning.js — READ-ONLY reader and section for Curriculum 2.0 work:
 * Today's Mission steps, Living Math Canvas scenes, Math Reality Lab investigations,
 * Counterexample Forge, Invariant Hunter, Sketch and the Fluency Spiral. All of it comes from
 * one key, ewl_state_v1 (assets/ewl/state-store.js). This file only calls getItem.
 * It reports what a student DID — entries written, steps finished — never a grade.
 * ========================================================================== */
(function (root) {
  "use strict";
  var KEY = "ewl_state_v1";
  var LABELS = {
    canvas: "Living Math Canvas",
    lab: "Math Reality Lab",
    forge: "Counterexample Forge",
    invariant: "Invariant Hunter",
    sketch: "Sketch",
    discourse: "Because / But / So",
    fluency: "Fluency Spiral",
  };
  var LABELS_ES = {
    canvas: "Lienzo Matemático Vivo",
    lab: "Laboratorio de Realidad Matemática",
    forge: "Fragua de contraejemplos",
    invariant: "Cazador de invariantes",
    sketch: "Boceto",
    discourse: "Porque / Pero / Entonces",
    fluency: "Espiral de fluidez",
  };

  function isObj(v) {
    return !!v && typeof v === "object" && !Array.isArray(v);
  }
  function words(slug) {
    var s = String(slug).replace(/-/g, " ");
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function read(storage) {
    var out = {
      empty: true,
      stages: 0,
      lessons: 0,
      checks: 0,
      vocab: 0,
      activities: [],
      fluency: null,
    };
    var s;
    try {
      s = JSON.parse(storage.getItem(KEY) || "null");
    } catch (_e) {
      return out;
    }
    if (!isObj(s) || s.v !== 1) return out;
    if (isObj(s.mission))
      Object.keys(s.mission).forEach(function (id) {
        var st =
          isObj(s.mission[id]) && isObj(s.mission[id].stages)
            ? Object.keys(s.mission[id].stages).length
            : 0;
        if (st) {
          out.lessons++;
          out.stages += st;
        }
      });
    if (isObj(s.checks)) out.checks = Object.keys(s.checks).length;
    if (isObj(s.vocab)) out.vocab = Object.keys(s.vocab).length;
    if (isObj(s.evidence))
      Object.keys(s.evidence).forEach(function (id) {
        var m = /^ewl\.([a-z]+)\.([a-z0-9-]+)$/.exec(id);
        var list = s.evidence[id];
        if (!m || !Array.isArray(list) || !list.length) return;
        var last = 0;
        var ok = 0;
        list.forEach(function (e) {
          if (isObj(e)) {
            if (typeof e.at === "number" && e.at > last) last = e.at;
            if (e.ok === true) ok++;
          }
        });
        out.activities.push({ kind: m[1], slug: m[2], entries: list.length, ok: ok, last: last });
      });
    out.activities.sort(function (a, b) {
      return b.last - a.last;
    });
    if (isObj(s.fluency) && s.fluency.answered > 0)
      out.fluency = {
        answered: s.fluency.answered | 0,
        correct: s.fluency.correct | 0,
        best: s.fluency.best | 0,
      };
    out.empty = !out.stages && !out.activities.length && !out.fluency && !out.checks;
    return out;
  }

  function html(r) {
    var S = root.NTProgressSections;
    if (!S || !r || r.empty) return "";
    var t = S.t;
    var esc = S.esc;
    var parts = "";
    if (r.stages)
      parts +=
        "<p>" +
        t("Mission steps finished: ", "Pasos de la misión terminados: ") +
        "<strong>" +
        r.stages +
        "</strong> " +
        t("across ", "en ") +
        r.lessons +
        t(" lessons.", " lecciones.") +
        "</p>";
    if (r.activities.length)
      parts +=
        '<div class="up-table-wrap"><table class="up-table"><thead><tr><th scope="col">' +
        t("Activity", "Actividad") +
        '</th><th scope="col">' +
        t("Notebook entries", "Entradas del cuaderno") +
        '</th><th scope="col">' +
        t("Marked right", "Marcadas correctas") +
        "</th></tr></thead><tbody>" +
        r.activities
          .slice(0, 24)
          .map(function (a) {
            return (
              "<tr><td>" +
              t(LABELS[a.kind] || a.kind, LABELS_ES[a.kind] || a.kind) +
              " · " +
              esc(words(a.slug)) +
              "</td><td>" +
              a.entries +
              "</td><td>" +
              a.ok +
              "</td></tr>"
            );
          })
          .join("") +
        "</tbody></table></div>";
    if (r.fluency)
      parts +=
        "<p>" +
        t("Fluency Spiral: ", "Espiral de fluidez: ") +
        r.fluency.correct +
        "/" +
        r.fluency.answered +
        t(" right, best streak ", " correctas, mejor racha ") +
        r.fluency.best +
        ".</p>";
    return S.section
      ? S.section("reasoning", t("Reasoning and evidence", "Razonamiento y evidencia"), parts)
      : '<section class="up-section"><h2>' +
          t("Reasoning and evidence", "Razonamiento y evidencia") +
          "</h2>" +
          parts +
          "</section>";
  }

  root.NTProgressReasoning = { KEY: KEY, read: read, html: html };
})(typeof window !== "undefined" ? window : globalThis);

/* ==========================================================================
 * progress-view.js — the ONE "My Progress" view, rendered on both
 * /curriculum/my-progress/ and /math/my-progress/.
 *
 * Reads every local progress store through NTProgressStores (read-only) and
 * shows: a next step, skills by standard, lessons & games, Fluency Lab
 * learners, Almost-Right Lab missions, saved activity results and a recent
 * timeline. Print and backup/restore are built in. No login; nothing leaves
 * the device. The only writes are the long-standing Restore merge into
 * activity results + choice boards (the file the student chose to restore).
 *
 * Usage: <div id="content" data-progress-view></div> plus
 *   <script src="/assets/my-progress/progress-stores.js" defer></script>
 *   <script src="/assets/my-progress/progress-sections.js" defer></script>
 *   <script src="/assets/my-progress/progress-view.js" defer></script>
 * ========================================================================== */
(function () {
  "use strict";
  var S = window.NTProgressStores;
  var V = window.NTProgressSections;
  if (!S || !V) return;
  var t = V.t;
  var BACKUP_APP = "neft-my-math-progress";

  /* ---------------- backup / restore ---------------- */
  var SNAPSHOT_KEY =
    /^(nt-signal:v1|pa-summary-|pa-itemlog$|nt_results_v1$|choiceboard-u\d+$|nsr:rec:|ewl-fluency-(profiles|progress|tutor)|arl_progress$)/;
  function readJson(key, fb) {
    try {
      var v = JSON.parse(localStorage.getItem(key));
      return v == null ? fb : v;
    } catch (_e) {
      return fb;
    }
  }
  function gatherBackup() {
    var boards = {};
    for (var u = 1; u <= 10; u++) {
      var arr = readJson("choiceboard-u" + u, null);
      if (Array.isArray(arr)) boards["u" + u] = arr;
    }
    var stores = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (SNAPSHOT_KEY.test(k)) stores[k] = localStorage.getItem(k);
      }
    } catch (_e) {}
    // version 2 adds a read-only `stores` record of every tool's progress;
    // `results` + `choiceboards` keep the version-1 shape so old pages restore it.
    return {
      app: BACKUP_APP,
      version: 2,
      exportedAt: new Date().toISOString(),
      results: readJson("nt_results_v1", []),
      choiceboards: boards,
      stores: stores,
    };
  }
  function mergeResults(local, incoming) {
    var seen = {},
      out = [];
    function add(r) {
      if (!r || typeof r !== "object") return;
      var k = (r.activityId || r.activityTitle || "") + "|" + (r.completedAt || "");
      if (seen[k]) return;
      seen[k] = 1;
      out.push(r);
    }
    (Array.isArray(local) ? local : []).forEach(add);
    (Array.isArray(incoming) ? incoming : []).forEach(add);
    return out;
  }
  function mergeBoard(local, incoming) {
    var out = [];
    for (var i = 0; i < 9; i++)
      out.push(!!((Array.isArray(local) && local[i]) || (Array.isArray(incoming) && incoming[i])));
    return out;
  }
  function applyBackup(data, status) {
    if (!data || data.app !== BACKUP_APP) {
      status.innerHTML = t(
        "That file isn't a My Progress backup. Choose the file you saved with Back up.",
        "Ese archivo no es una copia de Mi progreso. Elige el archivo que guardaste con Copia de seguridad.",
      );
      return false;
    }
    try {
      localStorage.setItem(
        "nt_results_v1",
        JSON.stringify(mergeResults(readJson("nt_results_v1", []), data.results)),
      );
      var boards = data.choiceboards || {};
      for (var u = 1; u <= 10; u++) {
        var inc = boards["u" + u];
        if (Array.isArray(inc))
          localStorage.setItem(
            "choiceboard-u" + u,
            JSON.stringify(mergeBoard(readJson("choiceboard-u" + u, []), inc)),
          );
      }
    } catch (_e) {}
    status.innerHTML = t(
      "Restored and merged: activity results and choice boards. Games and labs keep their own saves on each device.",
      "Restaurado y combinado: resultados de actividades y tableros. Los juegos y laboratorios guardan su progreso en cada dispositivo.",
    );
    return true;
  }
  function download() {
    var blob = new Blob([JSON.stringify(gatherBackup(), null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "my-math-progress.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function toolbarHtml() {
    return (
      '<div class="up-toolbar" role="group" aria-label="Progress tools">' +
      '<button type="button" class="up-btn" data-up="print">🖨️ ' +
      t("Print my progress", "Imprimir mi progreso") +
      '</button><button type="button" class="up-btn ghost" data-up="backup">💾 ' +
      t("Back up to a file", "Copia de seguridad") +
      '</button><button type="button" class="up-btn ghost" data-up="restore">📂 ' +
      t("Restore from a file", "Restaurar desde archivo") +
      '</button><input type="file" accept="application/json,.json" hidden data-up="file" aria-label="Backup file"></div>' +
      '<p class="up-status" role="status" aria-live="polite" data-up="status"></p>'
    );
  }

  function mount(el) {
    var registry = {};
    var titles = null;
    function fluencyTitle(grade, id) {
      var s = titles && titles(grade, id);
      return (s && s.title) || V.humanize(id);
    }
    function render() {
      var snap = S.collect(window.localStorage);
      var body = el.querySelector("[data-up=body]");
      if (S.isEmpty(snap)) {
        body.innerHTML = V.emptyHtml();
        return;
      }
      var rows = S.skillRows(snap);
      body.innerHTML =
        V.summaryHtml(snap, rows) +
        V.nextHtml(snap, registry, fluencyTitle) +
        V.skillsHtml(rows, registry) +
        V.lessonsHtml(snap) +
        V.fluencyHtml(snap, fluencyTitle) +
        V.resultsHtml(snap) +
        V.recentHtml(snap);
    }
    el.classList.add("up-root");
    el.innerHTML =
      toolbarHtml() +
      '<div data-up="body"></div><p class="up-private">' +
      t(
        "This page lives only on this device and is never sent anywhere.",
        "Esta página vive solo en este dispositivo y nunca se envía a ningún lugar.",
      ) +
      "</p>";
    var status = el.querySelector("[data-up=status]");
    var file = el.querySelector("[data-up=file]");
    el.querySelector("[data-up=print]").addEventListener("click", function () {
      window.print();
    });
    el.querySelector("[data-up=backup]").addEventListener("click", download);
    el.querySelector("[data-up=restore]").addEventListener("click", function () {
      file.click();
    });
    file.addEventListener("change", function () {
      var f = file.files && file.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () {
        var data = null;
        try {
          data = JSON.parse(reader.result);
        } catch (_e) {
          status.innerHTML = t(
            "That file couldn't be read. Choose a valid backup file.",
            "No se pudo leer ese archivo. Elige un archivo de copia válido.",
          );
        }
        if (data && applyBackup(data, status)) render();
        file.value = "";
      };
      reader.readAsText(f);
    });
    render();
    // Optional enrichments; the view is complete without either.
    if (typeof window.fetch === "function")
      window
        .fetch("/data/ccss-standards.json", { credentials: "omit" })
        .then(function (r) {
          return r.ok ? r.json() : null;
        })
        .then(function (d) {
          if (d && d.standards) {
            registry = d.standards;
            render();
          }
        })
        .catch(function () {});
    try {
      import("/math/fluency-lab/problem-bank.js")
        .then(function (m) {
          if (m && typeof m.getSkill === "function") {
            titles = m.getSkill;
            render();
          }
        })
        .catch(function () {});
    } catch (_e) {
      /* skill ids stay humanized */
    }
    window.addEventListener("storage", render);
  }

  function boot() {
    var el = document.querySelector("[data-progress-view]");
    if (el) mount(el);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

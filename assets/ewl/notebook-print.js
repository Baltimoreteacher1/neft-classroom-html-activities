/* EWL.NotebookPrint — printable pieces of the Reality Lab.
 *
 *   NotebookPrint.blank(inv, tpl) -> node      a blank worksheet for one investigation (no answers, no student data)
 *   NotebookPrint.summary(groups) -> node      teacher view: one row per activity from THIS device's notebook
 *   NotebookPrint.summaryText(groups) -> text  the same, for "Copy summary"
 *   NotebookPrint.printWith(className)         print with a body class that the print CSS uses, then remove it
 *
 * The summary reads only this device. It is not a class roster and holds no names.
 */
(function (root) {
  "use strict";
  var EWL = (root.EWL = root.EWL || {});

  function stats(g) {
    var checked = g.entries.filter(function (e) {
      return e.ok === true || e.ok === false;
    });
    var counts = {};
    g.entries.forEach(function (e) {
      if (e.rule) counts[e.rule] = (counts[e.rule] || 0) + 1;
    });
    var top = Object.keys(counts).sort(function (a, b) {
      return counts[b] - counts[a];
    })[0];
    return {
      entries: g.entries.length,
      last: g.entries.reduce(function (m, e) {
        return Math.max(m, e.at || 0);
      }, 0),
      correct: checked.filter(function (e) {
        return e.ok;
      }).length,
      checked: checked.length,
      idea: top ? EWL.Notebook.ruleName(top) : "",
    };
  }
  function summaryText(gs) {
    var lines = [
      EWL.t("Evidence summary (this device only)", "Resumen de evidencia (solo este dispositivo)"),
      "",
    ];
    gs.forEach(function (g) {
      var s = stats(g);
      lines.push(
        EWL.Notebook.title(g.id) +
          " [" +
          g.id +
          "]: " +
          s.entries +
          " " +
          EWL.t("entries", "entradas") +
          ", " +
          EWL.t("last", "última") +
          " " +
          EWL.Notebook.when(s.last) +
          (s.checked
            ? ", " +
              EWL.t("checked correct", "comprobadas correctas") +
              " " +
              s.correct +
              "/" +
              s.checked
            : "") +
          (s.idea ? ", " + EWL.t("idea to revisit", "idea para repasar") + ": " + s.idea : ""),
      );
    });
    return lines.join("\n");
  }
  function summary(gs) {
    var h = EWL.h;
    if (!gs.length)
      return h(
        "p",
        { class: "lab-muted" },
        EWL.t("No evidence on this device yet.", "Todavía no hay evidencia en este dispositivo."),
      );
    return h(
      "section",
      { class: "nb-summary", "aria-label": EWL.t("Teacher summary", "Resumen para la maestra") },
      h(
        "h3",
        {},
        EWL.t(
          "Teacher summary — this device only",
          "Resumen para la maestra — solo este dispositivo",
        ),
      ),
      EWL.LabUI.table(
        [
          { label: EWL.t("Activity", "Actividad") },
          { label: EWL.t("Entries", "Entradas") },
          { label: EWL.t("Last", "Última") },
          { label: EWL.t("Checked correct", "Comprobadas correctas") },
          { label: EWL.t("Idea to revisit", "Idea para repasar") },
        ],
        gs.map(function (g) {
          var s = stats(g);
          return {
            cells: [
              EWL.Notebook.title(g.id),
              String(s.entries),
              EWL.Notebook.when(s.last),
              s.checked ? s.correct + " / " + s.checked : "—",
              s.idea || "—",
            ],
          };
        }),
        { label: EWL.t("Teacher summary", "Resumen para la maestra") },
      ),
    );
  }

  function lines(n) {
    var out = [];
    for (var i = 0; i < n; i++) out.push(EWL.h("div", { class: "ws-line" }));
    return out;
  }
  function section(num, title, text) {
    return EWL.h(
      "section",
      { class: "ws-sec" },
      EWL.h("h3", {}, num + ". " + title),
      text ? EWL.h("p", {}, text) : null,
    );
  }

  function blank(inv, tpl) {
    var h = EWL.h;
    var t = EWL.t;
    var cols = inv.table.map(function (id) {
      return EWL.LabSim.column(inv, id).label;
    });
    var rows = [];
    for (var i = 0; i < 6; i++)
      rows.push(
        h(
          "tr",
          {},
          cols.map(function () {
            return h("td", {});
          }),
        ),
      );
    var gen = EWL.LabTasks.generate(inv.transfer, EWL.hash("blank:" + inv.id));
    var root_ = h(
      "article",
      { class: "ws" },
      h("h2", {}, t(inv.title, inv.titleEs)),
      h(
        "p",
        { class: "ws-meta" },
        t(
          "Name: ____________________   Date: ______________",
          "Nombre: ____________________   Fecha: ______________",
        ),
      ),
      section(1, t("Claim", "Afirmación"), t(inv.claim.text, inv.claim.textEs)),
      h(
        "p",
        {},
        t(
          "I  ☐ agree   ☐ disagree   ☐ am not sure",
          "Yo  ☐ estoy de acuerdo   ☐ no estoy de acuerdo   ☐ no estoy seguro",
        ),
      ),
      section(
        2,
        t(
          "Prediction (write it before you try anything)",
          "Predicción (escríbela antes de probar nada)",
        ),
        t(inv.prediction.prompt, inv.prediction.promptEs),
      ),
      h(
        "ul",
        { class: "ws-opts" },
        inv.prediction.options.map(function (o) {
          return h("li", {}, "☐ " + t(o.label, o.labelEs));
        }),
      ),
      section(3, t("Experiment", "Experimento"), t(inv.print.text, inv.print.textEs)),
      h(
        "div",
        { class: "lab-table-wrap" },
        h(
          "table",
          { class: "lab-table ws-table" },
          h(
            "thead",
            {},
            h(
              "tr",
              {},
              cols.map(function (c) {
                return h("th", { scope: "col" }, c);
              }),
            ),
          ),
          h("tbody", {}, rows),
        ),
      ),
      section(
        4,
        t("Evidence", "Evidencia"),
        t(
          "Circle the rows that show something about the claim. What do they show?",
          "Encierra en un círculo las filas que muestran algo sobre la afirmación. ¿Qué muestran?",
        ),
      ),
      lines(2),
      section(5, t("Argument", "Argumento")),
      h(
        "p",
        {},
        t(
          "I claim that ______________________________________________",
          "Afirmo que ______________________________________________",
        ),
      ),
      h(
        "p",
        {},
        t(
          "Because ____________________________________________________",
          "Porque ____________________________________________________",
        ),
      ),
      h(
        "p",
        {},
        t(
          "But when ____________________________________________________",
          "Pero cuando ____________________________________________________",
        ),
      ),
      h(
        "p",
        {},
        t(
          "So _________________________________________________________",
          "Entonces _________________________________________________________",
        ),
      ),
      section(
        6,
        t("Challenge", "Desafío"),
        inv.challenge.mode === "hold"
          ? t(inv.challenge.ask, inv.challenge.askEs)
          : t(inv.challenge.prompt, inv.challenge.promptEs),
      ),
      lines(2),
      section(7, t("Revision", "Revisión"), t(inv.revision.frame, inv.revision.frameEs)),
      lines(2),
      section(8, t("Transfer", "Transferencia"), gen ? t(gen.prompt, gen.promptEs) : ""),
      lines(3),
      h(
        "p",
        { class: "ws-foot" },
        t(
          "Grade 6 Math · EduWonderLab · " +
            inv.lessons
              .map(function (l) {
                return "Lesson " + l;
              })
              .join(", "),
          "Matemáticas de 6.º grado · EduWonderLab · " +
            inv.lessons
              .map(function (l) {
                return "Lección " + l;
              })
              .join(", "),
        ),
      ),
    );
    return root_;
  }

  function printWith(cls) {
    document.body.classList.add(cls);
    var done = function () {
      document.body.classList.remove(cls);
      root.removeEventListener("afterprint", done);
    };
    root.addEventListener("afterprint", done);
    root.print();
  }

  EWL.NotebookPrint = {
    blank: blank,
    summary: summary,
    summaryText: summaryText,
    printWith: printWith,
  };
})(typeof window !== "undefined" ? window : globalThis);

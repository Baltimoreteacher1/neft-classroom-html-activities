/* EWL.LabSteps argument + revision: steps 5 (Executable Discourse) and 7 (the original claim and the revision are both kept). */
(function (root) {
  "use strict";
  var EWL = (root.EWL = root.EWL || {});
  var U = function () {
    return EWL.LabUI;
  };
  var t = function (en, es) {
    return EWL.t(en, es);
  };

  function h() {
    return EWL.h.apply(null, arguments);
  }

  var Steps = {};

  /* 5. Argument: Executable Discourse */
  Steps.argument = function (host, c) {
    var inv = c.inv;
    var nums = [];
    c.S.cited.forEach(function (n) {
      var row = c.S.rows.filter(function (r) {
        return r.n === n;
      })[0];
      if (!row) return;
      try {
        var vals = EWL.LabSim.run(inv, row.case).values;
        inv.results.concat(inv.table).forEach(function (id) {
          if (vals[id] && typeof vals[id].frac === "function") nums.push(vals[id].frac());
        });
      } catch (e) {
        /* a row that no longer runs adds no numbers */
      }
    });
    host.appendChild(
      h(
        "p",
        {},
        t(
          "Build an argument that answers the claim. The computer will run it on real cases and tell you what it finds.",
          "Construye un argumento que responda a la afirmación. La computadora lo ejecutará con casos reales y te dirá qué encuentra.",
        ),
      ),
    );
    var composer = h("div", {});
    var saveHost = h("div", { role: "status" });
    host.appendChild(composer);
    host.appendChild(saveHost);
    var latest = null;
    var saveBtn = U().btn(
      t("Save my argument", "Guardar mi argumento"),
      function () {
        c.record({
          step: "argument",
          claim: t(inv.claim.text, inv.claim.textEs),
          argument: latest.text,
          ok: latest.complete,
          note: t(
            "Rubric " +
              latest.rubric.done +
              " of " +
              latest.rubric.total +
              "; tests " +
              latest.verify.checks.filter(function (k) {
                return k.ok;
              }).length +
              " of " +
              latest.verify.checks.length +
              ".",
            "Rúbrica " +
              latest.rubric.done +
              " de " +
              latest.rubric.total +
              "; pruebas " +
              latest.verify.checks.filter(function (k) {
                return k.ok;
              }).length +
              " de " +
              latest.verify.checks.length +
              ".",
          ),
        });
        c.S.arg = { ast: latest.ast, text: latest.text, complete: latest.complete };
        c.save();
        c.setReady(true);
        EWL.clear(saveHost);
        saveHost.appendChild(
          U().msg(
            latest.complete ? "ok" : "warn",
            latest.complete
              ? t(
                  "Saved. Your argument passed every test.",
                  "Guardado. Tu argumento pasó todas las pruebas.",
                )
              : t(
                  "Saved as unfinished. You can go back and keep working on it.",
                  "Guardado como inconcluso. Puedes volver y seguir trabajando en él.",
                ),
          ),
        );
      },
      { primary: true, disabled: true },
    );
    EWL.DiscourseUI.mount(composer, c.tpl, {
      tier: c.S.arg && c.S.arg.ast ? c.S.arg.ast.tier : 1,
      initial: c.S.arg && c.S.arg.ast,
      numbers: nums,
      vocab: inv.vocab.concat(inv.vocabEs),
      onChange: function (info) {
        latest = info.ast ? info : null;
        saveBtn.disabled = !latest;
        if (latest && !latest.complete)
          saveBtn.textContent = t(
            "Save my argument (unfinished)",
            "Guardar mi argumento (inconcluso)",
          );
        else saveBtn.textContent = t("Save my argument", "Guardar mi argumento");
      },
    });
    host.appendChild(saveBtn);
    c.setReady(!!(c.S.arg && c.S.arg.ast));
  };

  /* 7. Revision: the original claim and the revised claim are both kept */
  Steps.revision = function (host, c) {
    var inv = c.inv;
    host.appendChild(h("p", {}, t("Your first claim:", "Tu primera afirmación:")));
    host.appendChild(U().quote(inv));
    host.appendChild(
      h(
        "p",
        { class: "lab-muted" },
        t("Starter: ", "Para empezar: ") + t(inv.revision.frame, inv.revision.frameEs),
      ),
    );
    var note = h("div", { role: "status" });
    var save = U().btn(
      t("Save my revised claim", "Guardar mi afirmación revisada"),
      function () {
        c.S.revision = {
          original: t(inv.claim.text, inv.claim.textEs),
          text: c.S.revisionText.trim(),
        };
        c.record({ step: "revision", claim: c.S.revision.original, revised: c.S.revision.text });
        c.save();
        c.setReady(true);
        EWL.clear(note);
        note.appendChild(
          U().msg(
            "ok",
            t(
              "Saved. Both your first claim and your revision are in your notebook.",
              "Guardado. Tu primera afirmación y tu revisión están en tu cuaderno.",
            ),
          ),
        );
      },
      { primary: true, disabled: true },
    );
    function check() {
      var v = c.S.revisionText || "";
      var ok =
        U().words(v) >= 6 &&
        v.indexOf("___") < 0 &&
        v.trim() !== t(inv.claim.text, inv.claim.textEs).trim();
      save.disabled = !ok;
      c.setReady(false);
      EWL.clear(note);
      if (v && !ok)
        note.appendChild(
          U().msg(
            "",
            v.indexOf("___") >= 0
              ? t(
                  "Fill in the blanks with your own words.",
                  "Completa los espacios con tus propias palabras.",
                )
              : t(
                  "Write a full sentence that is different from the first claim.",
                  "Escribe una oración completa distinta de la primera afirmación.",
                ),
          ),
        );
    }
    c.S.revisionText = c.S.revisionText || (c.S.revision && c.S.revision.text) || "";
    host.appendChild(
      U().textArea(
        "lab-revision",
        t("My revised claim", "Mi afirmación revisada"),
        c.S.revisionText,
        function (v) {
          c.S.revisionText = v;
          c.save();
          check();
        },
        3,
      ),
    );
    host.appendChild(save);
    host.appendChild(note);
    check();
    c.setReady(!!c.S.revision);
  };

  EWL.LabSteps = Object.assign(EWL.LabSteps || {}, Steps);
})(typeof window !== "undefined" ? window : globalThis);

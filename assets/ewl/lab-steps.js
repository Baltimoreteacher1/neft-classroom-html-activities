/* EWL.LabSteps — the first seven steps of the Investigate cycle (Transfer lives in lab-transfer.js).
 *
 * Every step is function(host, c) where c is the controller context built in lab-investigate.js:
 *   c.inv, c.tpl, c.S (this investigation's state: plain JSON), c.save(), c.setReady(bool), c.record(entry)
 * A step draws into host and calls c.setReady(true) when the student may move on. Nothing is graded here: the engine only
 * runs the student's own claim and numbers (EWL.LabSim, EWL.Discourse) and reports what it finds.
 */
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
  function rowsData(c, ns) {
    return c.S.rows
      .filter(function (r) {
        return !ns || ns.indexOf(r.n) >= 0;
      })
      .map(function (r) {
        return r.cells;
      });
  }
  function sameSetup(inv, row) {
    var setup = inv.prediction.setup;
    return Object.keys(setup).every(function (k) {
      var a = EWL.Rat.parse(String(row.case[k]));
      var b = EWL.Rat.parse(String(setup[k]));
      return a && b ? a.eq(b) : String(row.case[k]) === String(setup[k]);
    });
  }
  var Steps = {};

  /* 1. Claim */
  Steps.claim = function (host, c) {
    host.appendChild(h("p", {}, t("Someone says:", "Alguien dice:")));
    host.appendChild(U().quote(c.inv));
    var g = U().chips(
      "stance",
      t("What do you think?", "¿Qué piensas?"),
      [
        { id: "agree", label: t("I agree", "Estoy de acuerdo") },
        { id: "disagree", label: t("I disagree", "No estoy de acuerdo") },
        { id: "unsure", label: t("I am not sure", "No estoy seguro") },
      ],
      c.S.stance || null,
      function (v) {
        c.S.stance = v;
        c.save();
        c.setReady(true);
      },
    );
    host.appendChild(g.el);
    host.appendChild(
      h(
        "p",
        { class: "lab-muted" },
        t(
          "Any answer is fine. Next you will commit to a prediction, then test it.",
          "Cualquier respuesta está bien. Luego te comprometerás con una predicción y la probarás.",
        ),
      ),
    );
    c.setReady(!!c.S.stance);
  };

  /* 2. Prediction, committed before the experiment unlocks */
  Steps.prediction = function (host, c) {
    var inv = c.inv;
    var pr = inv.prediction;
    host.appendChild(h("p", { class: "lab-prompt" }, t(pr.prompt, pr.promptEs)));
    var locked = !!c.S.prediction;
    var picked = locked ? c.S.prediction.optionId : null;
    var area = h("div", {});
    host.appendChild(area);
    function draw() {
      EWL.clear(area);
      var g = U().chips(
        "pred",
        t("My prediction", "Mi predicción"),
        pr.options.map(function (o) {
          return { id: o.id, label: t(o.label, o.labelEs) };
        }),
        picked,
        function (v) {
          picked = v;
          lockBtn.disabled = false;
        },
      );
      if (locked) g.el.setAttribute("disabled", "disabled");
      g.el.querySelectorAll("input").forEach(function (i) {
        i.disabled = locked;
      });
      area.appendChild(g.el);
      var lockBtn = U().btn(
        t("Lock in my prediction", "Fijar mi predicción"),
        function () {
          var opt = pr.options.filter(function (o) {
            return o.id === picked;
          })[0];
          c.S.prediction = { optionId: picked, text: t(opt.label, opt.labelEs) };
          c.save();
          c.record({
            step: "prediction",
            claim: t(inv.claim.text, inv.claim.textEs),
            prediction: t(pr.prompt, pr.promptEs) + " → " + c.S.prediction.text,
          });
          locked = true;
          c.setReady(true);
          draw();
          EWL.announce(
            t(
              "Prediction locked. The experiment is open.",
              "Predicción fijada. El experimento está abierto.",
            ),
          );
        },
        { primary: true, disabled: !picked || locked },
      );
      if (!locked) area.appendChild(lockBtn);
      else
        area.appendChild(
          U().msg(
            "ok",
            t(
              "Your prediction is locked: " +
                c.S.prediction.text +
                ". Go on to the experiment and test it.",
              "Tu predicción está fijada: " +
                c.S.prediction.text +
                ". Pasa al experimento y pruébala.",
            ),
          ),
        );
    }
    draw();
    c.setReady(locked);
  };

  /* 3. Experiment */
  Steps.experiment = function (host, c) {
    var inv = c.inv;
    var NEED = 3;
    var info = h("div", { class: "lab-note", role: "status" });
    var prog = h("p", { class: "lab-muted" });
    host.appendChild(h("p", {}, t(inv.print.text, inv.print.textEs)));
    host.appendChild(prog);
    host.appendChild(info);
    var exp = h("div", {});
    host.appendChild(exp);
    function status() {
      var n = c.S.rows.length;
      prog.textContent = t(
        "Runs so far: " + n + " of " + NEED + " needed.",
        "Ejecuciones hasta ahora: " + n + " de " + NEED + " necesarias.",
      );
      c.setReady(n >= NEED);
    }
    EWL.LabExperiment.mount(exp, inv, {
      rows: c.S.rows,
      onRun: function (row, rows) {
        c.S.rows = rows;
        c.save();
        if (row && sameSetup(inv, row)) {
          var right = EWL.LabSim.prediction(inv).correct;
          var guess = c.S.prediction && c.S.prediction.optionId;
          var rightOpt = inv.prediction.options.filter(function (o) {
            return o.id === right;
          })[0];
          EWL.clear(info);
          info.appendChild(
            U().msg(
              guess === right ? "ok" : "warn",
              guess === right
                ? t(
                    "Your prediction matched the experiment: " +
                      t(rightOpt.label, rightOpt.labelEs) +
                      ".",
                    "Tu predicción coincidió con el experimento: " + rightOpt.labelEs + ".",
                  )
                : t(
                    "The experiment shows: " +
                      rightOpt.label +
                      ". That was different from your prediction, and that is how we learn something. Keep testing.",
                    "El experimento muestra: " +
                      rightOpt.labelEs +
                      ". Fue diferente de tu predicción, y así se aprende. Sigue probando.",
                  ),
            ),
          );
        }
        status();
      },
    });
    status();
  };

  /* 4. Evidence: cite rows of your own data */
  Steps.evidence = function (host, c) {
    var inv = c.inv;
    var saved = !!c.S.evidenceSaved;
    host.appendChild(
      h(
        "p",
        {},
        t(
          "Choose at least 2 rows from your table that say something about the claim.",
          "Elige al menos 2 filas de tu tabla que digan algo sobre la afirmación.",
        ),
      ),
    );
    var tbl = h("div", {});
    var noteHost = h("div", {});
    var status = h("div", { role: "status" });
    host.appendChild(tbl);
    host.appendChild(noteHost);
    host.appendChild(status);
    function ready() {
      var ok = c.S.cited.length >= 2 && U().words(c.S.citeNote) >= 4;
      saveBtn.disabled = !ok || saved;
      return ok;
    }
    var saveBtn = U().btn(
      t("Save to my notebook", "Guardar en mi cuaderno"),
      function () {
        c.record({
          step: "evidence",
          claim: t(inv.claim.text, inv.claim.textEs),
          prediction: c.S.prediction ? c.S.prediction.text : undefined,
          data: rowsData(c, c.S.cited),
          note: c.S.citeNote.trim(),
        });
        c.S.evidenceSaved = true;
        saved = true;
        c.save();
        c.setReady(true);
        EWL.clear(status);
        status.appendChild(
          U().msg(
            "ok",
            t(
              "Saved. Your cited rows are in your Evidence Notebook.",
              "Guardado. Tus filas citadas están en tu Cuaderno de evidencia.",
            ),
          ),
        );
        saveBtn.disabled = true;
      },
      { primary: true, disabled: true },
    );
    function drawTable() {
      EWL.clear(tbl);
      tbl.appendChild(
        EWL.LabExperiment.rowTable(inv, c.S.rows, {
          selected: c.S.cited,
          select: function (n, on) {
            c.S.cited = c.S.cited.filter(function (x) {
              return x !== n;
            });
            if (on) c.S.cited.push(n);
            c.S.evidenceSaved = false;
            saved = false;
            c.setReady(false);
            c.save();
            ready();
          },
        }),
      );
    }
    drawTable();
    noteHost.appendChild(
      U().textArea(
        "lab-cite-note",
        t(
          "What do the rows you picked show? Use numbers from them.",
          "¿Qué muestran las filas que elegiste? Usa números de ellas.",
        ),
        c.S.citeNote,
        function (v) {
          c.S.citeNote = v;
          c.S.evidenceSaved = false;
          saved = false;
          c.setReady(false);
          c.save();
          ready();
        },
      ),
    );
    host.appendChild(saveBtn);
    ready();
    c.setReady(saved);
  };

  EWL.LabSteps = Object.assign(EWL.LabSteps || {}, Steps);
})(typeof window !== "undefined" ? window : globalThis);

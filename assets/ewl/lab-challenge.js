/* EWL.LabSteps.challenge: step 6. The tempting claim is run over a sweep; a counterexample the student finds (or a case they are asked about) is checked by actually running it. */
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

  /* 6. Challenge: the claim is run over a sweep */
  Steps.challenge = function (host, c) {
    var inv = c.inv;
    var ch = inv.challenge;
    var out = h("div", { role: "status", "aria-live": "polite" });
    var sweepHost = h("div", {});
    c.S.challenge = c.S.challenge || { found: [], answer: null, tested: false, hints: 0 };
    var cs = c.S.challenge;
    function sweepSummary() {
      EWL.clear(sweepHost);
      var sw = EWL.LabSim.sweep(inv);
      sweepHost.appendChild(
        h("h4", {}, t("What the full sweep found", "Lo que encontró el barrido completo")),
      );
      sweepHost.appendChild(
        U().msg(
          sw.fails.length ? "warn" : "ok",
          t(
            "We ran the claim on " +
              sw.evaluated +
              " cases. It holds on " +
              sw.holds +
              " and breaks on " +
              sw.fails.length +
              ".",
            "Ejecutamos la afirmación en " +
              sw.evaluated +
              " casos. Se cumple en " +
              sw.holds +
              " y se rompe en " +
              sw.fails.length +
              ".",
          ),
        ),
      );
      sweepHost.appendChild(
        U().table(
          [{ label: t("A case that breaks the claim", "Un caso que rompe la afirmación") }],
          sw.fails.slice(0, 6).map(function (f) {
            return { flag: "bad", cells: [EWL.LabSim.describe(inv, f.case, f.values)] };
          }),
          { label: t("Cases that break the claim", "Casos que rompen la afirmación") },
        ),
      );
    }
    function show(row, holds) {
      EWL.clear(out);
      out.appendChild(U().msg(holds ? "ok" : "warn", row));
    }
    if (ch.mode === "find") {
      host.appendChild(h("p", { class: "lab-prompt" }, t(ch.prompt, ch.promptEs)));
      var free = ch.free;
      var start = Object.assign(EWL.LabSim.defaults(inv), inv.prediction.setup, ch.fixed || {});
      var ctl = EWL.LabExperiment.controls(inv, start, free);
      host.appendChild(ctl.el);
      host.appendChild(
        U().btn(
          t("Check these numbers", "Comprobar estos números"),
          function () {
            var cv = ctl.get();
            if (!cv)
              return show(
                t(
                  "One of the numbers is not valid yet.",
                  "Uno de los números todavía no es válido.",
                ),
                false,
              );
            var r;
            try {
              r = EWL.LabSim.run(inv, cv);
            } catch (_e) {
              return show(
                t(
                  "Those numbers cannot be used together.",
                  "Esos números no se pueden usar juntos.",
                ),
                false,
              );
            }
            var d = EWL.LabSim.describe(inv, cv, r.values);
            if (!r.holds) {
              var key = EWL.LabExperiment.key(inv, cv);
              if (
                !cs.found.some(function (f) {
                  return f.key === key;
                })
              ) {
                cs.found.push({ key: key, text: d });
                c.record({
                  step: "challenge",
                  claim: t(inv.claim.text, inv.claim.textEs),
                  note: t("Counterexample found: ", "Contraejemplo encontrado: ") + d,
                });
              }
              show(
                t(
                  "You found a counterexample: " + d + ". The claim fails here.",
                  "Encontraste un contraejemplo: " + d + ". La afirmación falla aquí.",
                ),
                true,
              );
              c.save();
              c.setReady(true);
              sweepSummary();
            } else {
              cs.tries = (cs.tries || 0) + 1;
              c.save();
              show(
                t(
                  "The claim holds for those numbers (" +
                    d +
                    "). That does not prove it is always true. Try different numbers.",
                  "La afirmación se cumple con esos números (" +
                    d +
                    "). Eso no prueba que siempre sea cierta. Prueba otros números.",
                ),
                false,
              );
            }
          },
          { primary: true },
        ),
      );
      host.appendChild(
        U().btn(t("Give me a hint", "Dame una pista"), function () {
          cs.hints = Math.min((cs.hints || 0) + 1, 3);
          c.save();
          var sw = EWL.LabSim.sweep(inv);
          var line;
          if (cs.hints === 1) line = t(ch.hint, ch.hintEs);
          else if (cs.hints === 2) {
            var bad = c.S.rows.filter(function (r) {
              return !r.holds;
            })[0];
            line = bad
              ? t(
                  "Look at row " + bad.n + " in your data table. Does it agree with the claim?",
                  "Mira la fila " +
                    bad.n +
                    " de tu tabla de datos. ¿Está de acuerdo con la afirmación?",
                )
              : t(
                  "Look at your data table. Does any row disagree with the claim?",
                  "Mira tu tabla de datos. ¿Alguna fila no está de acuerdo con la afirmación?",
                );
          } else {
            var f = sw.fails[0];
            line = t(
              "Here is one case that breaks it: " +
                EWL.LabSim.describe(inv, f.case, f.values) +
                ". Put it in the boxes and check.",
              "Aquí hay un caso que la rompe: " +
                EWL.LabSim.describe(inv, f.case, f.values) +
                ". Ponlo en los cuadros y comprueba.",
            );
            ctl.set(f.case);
          }
          show(line, false);
        }),
      );
      c.setReady(cs.found.length > 0);
      if (cs.found.length) sweepSummary();
    } else {
      host.appendChild(h("p", { class: "lab-prompt" }, t(ch.ask, ch.askEs)));
      var g = U().chips(
        "hold",
        t("My answer", "Mi respuesta"),
        [
          { id: "yes", label: t("Yes, it still holds", "Sí, todavía se cumple") },
          { id: "no", label: t("No, it breaks", "No, se rompe") },
        ],
        cs.answer,
        function (v) {
          cs.answer = v;
          btn.disabled = false;
        },
      );
      host.appendChild(g.el);
      var btn = U().btn(
        t("Test it", "Probarlo"),
        function () {
          var r = EWL.LabSim.run(inv, Object.assign(EWL.LabSim.defaults(inv), ch.case));
          var d = EWL.LabSim.describe(
            inv,
            Object.assign(EWL.LabSim.defaults(inv), ch.case),
            r.values,
          );
          var match = (cs.answer === "yes") === r.holds;
          cs.tested = true;
          c.record({
            step: "challenge",
            claim: t(inv.claim.text, inv.claim.textEs),
            note: t(
              "I said " +
                cs.answer +
                ". Test: " +
                d +
                " → claim " +
                (r.holds ? "holds" : "breaks") +
                ".",
              "Dije " +
                cs.answer +
                ". Prueba: " +
                d +
                " → la afirmación " +
                (r.holds ? "se cumple" : "se rompe") +
                ".",
            ),
          });
          c.save();
          show(
            (match
              ? t("Your answer matches the test. ", "Tu respuesta coincide con la prueba. ")
              : t(
                  "The test shows something different from your answer, and that is useful to know. ",
                  "La prueba muestra algo distinto de tu respuesta, y eso es útil saberlo. ",
                )) +
              t(r.holds ? ch.holdsText : ch.failsText, r.holds ? ch.holdsTextEs : ch.failsTextEs) +
              " (" +
              d +
              ")",
            match,
          );
          c.setReady(true);
          sweepSummary();
        },
        { primary: true, disabled: !cs.answer },
      );
      host.appendChild(btn);
      c.setReady(cs.tested);
      if (cs.tested) sweepSummary();
    }
    host.appendChild(out);
    host.appendChild(sweepHost);
  };

  EWL.LabSteps = Object.assign(EWL.LabSteps || {}, Steps);
})(typeof window !== "undefined" ? window : globalThis);

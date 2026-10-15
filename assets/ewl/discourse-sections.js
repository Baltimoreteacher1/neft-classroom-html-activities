/* EWL.DiscourseSections — the Because and But sections of the Executable Discourse composer (case adders, reasons, counterexamples).
 *
 *   DiscourseSections.create(env) -> {renderBecause(), renderBut()}
 *     env: {tpl, st, becauseHost, butHost, summary(), claim() -> claim node|null, sec(text), textArea(id,label,value,onInput), oneCase(claim, e)}
 * Split from discourse-ui.js to keep each file small. `st` is the composer state owned by DiscourseUI.
 */
(function (root) {
  "use strict";
  var EWL = (root.EWL = root.EWL || {});

  function create(env) {
    var h = EWL.h;
    var U = EWL.LabUI;
    var D = EWL.Discourse;
    var T = EWL.DiscourseText;
    var tpl = env.tpl;
    var st = env.st;
    var becauseHost = env.becauseHost;
    var butHost = env.butHost;
    var summary = env.summary;
    var sec = env.sec;
    var textArea = env.textArea;
    var oneCase = env.oneCase;
    /* ----- case adders ----- */
    function caseAdder(kind, onAdd) {
      var box = h("div", { class: "disc-case" });
      var inputs = {};
      Object.keys(tpl.vars).forEach(function (k) {
        var id = "disc-case-" + kind + "-" + k;
        var inp = h("input", {
          id: id,
          class: "lab-num",
          type: "text",
          inputmode: "decimal",
          value: tpl.vars[k].values[0],
          style: "width:5em",
        });
        inputs[k] = inp;
        box.appendChild(
          h(
            "span",
            { class: "lab-inline-field" },
            h(
              "label",
              { class: "lab-label", for: id },
              EWL.t(
                tpl.vars[k].short || tpl.vars[k].label,
                tpl.vars[k].shortEs || tpl.vars[k].labelEs,
              ),
            ),
            inp,
          ),
        );
      });
      var note = h("span", { class: "lab-muted", role: "status" });
      box.appendChild(
        U.btn(EWL.t("Add this case", "Agregar este caso"), function () {
          var cv = {};
          Object.keys(inputs).forEach(function (k) {
            cv[k] = inputs[k].value.trim();
          });
          try {
            D.env(tpl, cv);
          } catch (_e) {
            note.textContent = EWL.t(
              "Those numbers cannot be used together here.",
              "Esos números no se pueden usar juntos aquí.",
            );
            return;
          }
          note.textContent = "";
          onAdd(cv);
        }),
      );
      box.appendChild(note);
      return box;
    }
    function removeBtn(list, i, after) {
      return h(
        "button",
        {
          type: "button",
          class: "ewl-btn lab-small",
          "aria-label": EWL.t("Remove", "Quitar"),
          onclick: function () {
            list.splice(i, 1);
            after();
            summary();
          },
        },
        "×",
      );
    }

    /* ----- Because ----- */
    function renderBecause() {
      EWL.clear(becauseHost);
      if (st.tier === 3) {
        becauseHost.appendChild(
          textArea(
            "disc-because",
            EWL.t(
              "Because… (write your reason; use a number you found)",
              "Porque… (escribe tu razón; usa un número que encontraste)",
            ),
            st.freeBecause,
            function (v) {
              st.freeBecause = v;
              summary();
            },
          ),
        );
      } else {
        var picked = h(
          "fieldset",
          { class: "lab-chips" },
          h(
            "legend",
            { class: "lab-legend" },
            EWL.t(
              "Pick the reasons that fit your claim.",
              "Elige las razones que van con tu afirmación.",
            ),
          ),
        );
        var row = h("div", { class: "ewl-row" });
        tpl.reasons.forEach(function (r, i) {
          var id = "disc-r-" + i;
          var on = st.because.some(function (n) {
            return n.type === "reason" && n.id === "r" + i;
          });
          var cb = h("input", { type: "checkbox", id: id, class: "lab-chip-input" });
          cb.checked = on;
          cb.addEventListener("change", function () {
            st.because = st.because.filter(function (n) {
              return !(n.type === "reason" && n.id === "r" + i);
            });
            if (cb.checked)
              st.because.push({ type: "reason", id: "r" + i, text: EWL.t(r.text, r.textEs) });
            summary();
          });
          row.appendChild(
            h(
              "span",
              { class: "lab-chip-wrap" },
              cb,
              h("label", { class: "ewl-chip lab-chip", for: id }, EWL.t(r.text, r.textEs)),
            ),
          );
        });
        picked.appendChild(row);
        becauseHost.appendChild(picked);
      }
      becauseHost.appendChild(
        h(
          "p",
          { class: "lab-label" },
          EWL.t(
            "Add a case where your claim holds. It is your evidence.",
            "Agrega un caso donde tu afirmación se cumple. Es tu evidencia.",
          ),
        ),
      );
      var ev = st.because.filter(function (n) {
        return n.type === "evidence";
      });
      if (ev.length)
        becauseHost.appendChild(
          h(
            "ul",
            { class: "disc-list" },
            ev.map(function (n) {
              return h(
                "li",
                {},
                T.caseText(n.case, tpl) + " → " + T.evalText(n.case, tpl) + " ",
                removeBtn(st.because, st.because.indexOf(n), renderBecause),
              );
            }),
          ),
        );
      if (st.tier === 1) {
        var good =
          st.ran && env.claim() ? supportCases(env.claim(), env.soClaim()).slice(0, 6) : [];
        if (good.length)
          becauseHost.appendChild(
            U.chips(
              "ev",
              EWL.t(
                "Tap a case that supports your claim.",
                "Toca un caso que apoye tu afirmación.",
              ),
              good.map(function (cv, i) {
                return { id: String(i), label: T.caseText(cv, tpl) };
              }),
              null,
              function (id) {
                st.because.push({ type: "evidence", case: good[Number(id)] });
                renderBecause();
                summary();
              },
            ).el,
          );
        else
          becauseHost.appendChild(
            sec(
              EWL.t(
                "Press Run & Verify first. Then you can tap a case.",
                "Presiona Ejecutar y verificar primero. Luego podrás tocar un caso.",
              ),
            ),
          );
      } else
        becauseHost.appendChild(
          caseAdder("ev", function (cv) {
            st.because.push({ type: "evidence", case: cv });
            renderBecause();
            summary();
          }),
        );
    }
    function supportCases(claim, soClaim) {
      return D.cases(tpl).filter(function (cv) {
        try {
          var e = D.env(tpl, cv);
          return [claim, soClaim].some(function (c) {
            var o = c ? oneCase(c, e) : { applies: false };
            return o.applies && o.holds;
          });
        } catch (_err) {
          return false;
        }
      });
    }

    /* ----- But ----- */
    function renderBut() {
      EWL.clear(butHost);
      st.but.forEach(function (n, i) {
        var box = h(
          "div",
          { class: "disc-counter ewl-card" },
          h(
            "p",
            {},
            h("strong", {}, EWL.t("Counterexample: ", "Contraejemplo: ")),
            T.caseText(n.case, tpl) + " → " + T.evalText(n.case, tpl) + " ",
          ),
          removeBtn(st.but, i, renderBut),
        );
        if (st.tier === 3)
          box.appendChild(
            textArea(
              "disc-but-" + i,
              EWL.t("What happens here, and why?", "¿Qué pasa aquí y por qué?"),
              n.text || "",
              function (v) {
                n.text = v;
                summary();
              },
            ),
          );
        else
          box.appendChild(
            U.chips(
              "lim" + i,
              EWL.t("What happens here?", "¿Qué pasa aquí?"),
              tpl.limits.map(function (l, j) {
                return { id: String(j), label: EWL.t(l.text, l.textEs) };
              }),
              String(
                tpl.limits
                  .map(function (l) {
                    return EWL.t(l.text, l.textEs);
                  })
                  .indexOf(n.text),
              ),
              function (j) {
                n.text = EWL.t(tpl.limits[Number(j)].text, tpl.limits[Number(j)].textEs);
                summary();
              },
            ).el,
          );
        butHost.appendChild(box);
      });
      var fails = st.ran ? st.ran.fails.slice(0, 6) : [];
      if (fails.length)
        butHost.appendChild(
          U.chips(
            "cx",
            EWL.t("Tap a case that breaks your claim.", "Toca un caso que rompa tu afirmación."),
            fails.map(function (f, i) {
              return { id: String(i), label: T.caseText(f.case, tpl) };
            }),
            null,
            function (id) {
              st.but.push({ type: "counter", case: fails[Number(id)].case, text: "" });
              renderBut();
              summary();
            },
          ).el,
        );
      else if (!st.ran)
        butHost.appendChild(
          sec(
            EWL.t(
              "Press Run & Verify first. A case that breaks your claim will show up here.",
              "Presiona Ejecutar y verificar primero. Aquí aparecerá un caso que rompa tu afirmación.",
            ),
          ),
        );
      else if (!fails.length)
        butHost.appendChild(
          sec(
            EWL.t(
              "No case broke your claim. You may leave this empty, or say when it might not work.",
              "Ningún caso rompió tu afirmación. Puedes dejarlo vacío o decir cuándo podría no funcionar.",
            ),
          ),
        );
      if (st.tier !== 1)
        butHost.appendChild(
          caseAdder("cx", function (cv) {
            st.but.push({ type: "counter", case: cv, text: "" });
            renderBut();
            summary();
          }),
        );
    }

    return { renderBecause: renderBecause, renderBut: renderBut };
  }

  EWL.DiscourseSections = { create: create };
})(typeof window !== "undefined" ? window : globalThis);

/* Invariant Hunter — view pieces (explore table, candidate list, quantity builder, results, why). Built per render by invariant.js. */
(function (root) {
  "use strict";
  var EWL = root.EWL;
  if (!EWL || !EWL.Invariant) return;
  var I = EWL.Invariant;

  EWL.InvariantView = function (ui) {
    var h = ui.h;
    var t = ui.t;
    var lang = ui.lang;
    var hunt = ui.hunt;
    var st = ui.st;
    var vars = hunt.vars.map(function (v) {
      return v.id;
    });

    function tt(o, k) {
      return t(o[k], o[k + "Es"]);
    }
    function moveText(m, params) {
      var vals = Object.keys(params || {}).map(function (k) {
        return params[k].mixed();
      });
      return tt(m, "label") + (vals.length ? " " + vals.join(", ") : "");
    }
    /** The expression the watch column and the test use: a candidate, or the student's own quantity. */
    function watchNode() {
      var s = st();
      if (s.watch === "custom") {
        var p = EWL.Expr.parse(s.custom, vars);
        return p.ok ? p.node : null;
      }
      var c = hunt.candidates.filter(function (x) {
        return x.id === s.watch;
      })[0];
      return c ? EWL.Expr.parse(c.expr, vars).node : null;
    }
    function qText(state, node) {
      var v = node ? EWL.Expr.attempt(node, state) : null;
      return v ? I.fmt(v) : "—";
    }

    function stateCard() {
      var s = st();
      var cur = s.history[s.history.length - 1].state;
      var node = watchNode();
      var moves = hunt.moves.map(function (m) {
        var chips = (m.params || []).map(function (p) {
          var chosen = s.params[m.id + "." + p.id] || p.pool[0];
          return h(
            "span",
            { class: "iv-chips", role: "group", "aria-label": tt(p, "label") },
            p.pool.map(function (v) {
              return h(
                "button",
                {
                  type: "button",
                  class: "ewl-chip iv-chip",
                  "aria-pressed": chosen === v ? "true" : "false",
                  onclick: function () {
                    s.params[m.id + "." + p.id] = v;
                    ui.focusSel = "[data-chip='" + m.id + "." + p.id + "." + v + "']";
                    ui.render();
                  },
                  "data-chip": m.id + "." + p.id + "." + v,
                },
                EWL.Rat.parse(v).mixed(),
              );
            }),
          );
        });
        return h(
          "div",
          { class: "iv-move" },
          h("span", { class: "iv-movelabel" }, tt(m, "label")),
          chips,
          h(
            "button",
            {
              type: "button",
              class: "ewl-btn",
              onclick: function () {
                ui.doMove(m);
              },
            },
            t("Do this move", "Hacer este movimiento"),
          ),
        );
      });
      var rows = s.history.map(function (r, i) {
        return h(
          "tr",
          null,
          h("td", { "data-label": t("Step", "Paso") }, String(i)),
          h("td", { "data-label": t("What happened", "Qué pasó") }, r.label),
          h("td", { "data-label": t("State", "Estado") }, I.text(hunt, r.state, lang)),
          node
            ? h(
                "td",
                { "data-label": t("Watched quantity", "Cantidad observada") },
                qText(r.state, node),
              )
            : null,
        );
      });
      return h(
        "section",
        { class: "ewl-card iv-card" },
        h(
          "h4",
          { tabindex: "-1", "data-focus": "" },
          t("1. Make moves and watch", "1. Haz movimientos y observa"),
        ),
        h("p", { class: "iv-lead" }, tt(hunt, "story")),
        h(
          "p",
          { class: "iv-state", "aria-label": t("Current state", "Estado actual") },
          I.text(hunt, cur, lang),
        ),
        h("div", { class: "iv-moves" }, moves),
        h(
          "div",
          { class: "ewl-row" },
          h(
            "button",
            {
              type: "button",
              class: "ewl-btn",
              disabled: s.history.length < 2 ? "disabled" : null,
              onclick: ui.undo,
            },
            t("Undo", "Deshacer"),
          ),
          h(
            "button",
            { type: "button", class: "ewl-btn", onclick: ui.newStart },
            t("Start from a new state", "Empezar con otro estado"),
          ),
        ),
        h(
          "table",
          { class: "fx-table iv-table" },
          h("caption", null, t("Every state so far", "Todos los estados hasta ahora")),
          h(
            "thead",
            null,
            h(
              "tr",
              null,
              h("th", { scope: "col" }, t("Step", "Paso")),
              h("th", { scope: "col" }, t("What happened", "Qué pasó")),
              h("th", { scope: "col" }, t("State", "Estado")),
              node ? h("th", { scope: "col" }, t("Watched quantity", "Cantidad observada")) : null,
            ),
          ),
          h("tbody", null, rows),
        ),
      );
    }

    function candidateList() {
      var s = st();
      var fs = h(
        "fieldset",
        { class: "fx-opts" },
        h(
          "legend",
          null,
          t(
            "Pick a quantity that you think never changes",
            "Elige una cantidad que creas que nunca cambia",
          ),
        ),
      );
      hunt.candidates.forEach(function (c) {
        var r = s.results[c.id];
        fs.appendChild(
          h(
            "label",
            { class: "fx-opt" },
            h("input", {
              type: "radio",
              name: "iv-pick",
              checked: s.watch === c.id ? "checked" : null,
              onchange: function () {
                s.watch = c.id;
                ui.render();
              },
            }),
            h("span", null, tt(c, "label")),
            r
              ? h(
                  "span",
                  { class: "iv-badge", "data-held": r.holds ? "yes" : "no" },
                  r.holds ? "✓ " + t("held", "se mantuvo") : "✗ " + t("broke", "cambió"),
                )
              : null,
          ),
        );
      });
      return fs;
    }
    function builder() {
      var s = st();
      var inp = h("input", {
        id: "iv-custom",
        type: "text",
        autocomplete: "off",
        spellcheck: "false",
        maxlength: "40",
        value: s.custom,
        placeholder: t(
          "for example: " + (vars[1] || "b") + " - " + vars[0],
          "por ejemplo: " + (vars[1] || "b") + " - " + vars[0],
        ),
        oninput: function (e) {
          s.custom = e.target.value;
        },
        onfocus: function () {
          s.watch = "custom";
        },
        onchange: function () {
          s.watch = "custom";
          ui.render();
        },
      });
      function ins(text) {
        return h(
          "button",
          {
            type: "button",
            class: "ewl-chip iv-chip",
            "aria-label": text,
            onclick: function () {
              s.custom = (inp.value + " " + text).trim() + " ";
              s.watch = "custom";
              ui.focusSel = "#iv-custom";
              ui.render();
            },
          },
          text,
        );
      }
      var toks = vars.concat(["+", "−", "×", "÷", "(", ")"]);
      return h(
        "div",
        { class: "iv-builder" },
        h(
          "label",
          { for: "iv-custom" },
          t("Or build your own quantity", "O arma tu propia cantidad"),
        ),
        inp,
        h(
          "span",
          {
            class: "iv-chips",
            role: "group",
            "aria-label": t("Pieces to add", "Piezas para agregar"),
          },
          toks.map(ins),
        ),
        h(
          "span",
          { class: "iv-hint" },
          t(
            "Use the numbers in this hunt, + − × ÷ and brackets. |x| is written abs(x).",
            "Usa los números de esta búsqueda, + − × ÷ y paréntesis. |x| se escribe abs(x).",
          ),
        ),
        h(
          "span",
          { class: "iv-hint" },
          hunt.vars
            .map(function (v) {
              return v.id + " = " + tt(v, "label");
            })
            .join(";  "),
        ),
      );
    }

    function describeBreak(b) {
      var s = b.start;
      var parts = [
        t("It broke. Starting from ", "Falló. Empezando en ") + I.text(hunt, s, lang) + ".",
      ];
      b.steps.forEach(function (st1) {
        var m = hunt.moves.filter(function (x) {
          return x.id === st1.move;
        })[0];
        parts.push(
          moveText(m, st1.params) +
            " " +
            t("gives", "da") +
            " " +
            I.text(hunt, st1.after, lang) +
            ".",
        );
      });
      parts.push(
        t("The quantity went from ", "La cantidad pasó de ") +
          I.fmt(b.from) +
          t(" to ", " a ") +
          (b.to ? I.fmt(b.to) : "—") +
          ".",
      );
      return parts.join(" ");
    }
    function candidatesCard() {
      var s = st();
      var res = h("div", { class: "fx-out" });
      if (s.last) res.appendChild(s.last);
      var found = Object.keys(s.results).filter(function (k) {
        return s.results[k].holds;
      }).length;
      return h(
        "section",
        { class: "ewl-card iv-card" },
        h(
          "h4",
          { tabindex: "-1" },
          t("2. Hunt for what never changes", "2. Busca lo que nunca cambia"),
        ),
        h(
          "p",
          { class: "iv-lead" },
          t(
            "Choose a quantity. Select it to watch it in the table above, then test it on hundreds of random move sequences.",
            "Elige una cantidad. Selecciónala para observarla en la tabla de arriba y luego pruébala con cientos de secuencias de movimientos al azar.",
          ),
        ),
        candidateList(),
        builder(),
        h(
          "div",
          { class: "ewl-row" },
          h(
            "button",
            { type: "button", class: "ewl-btn", "data-primary": "", onclick: ui.runTest },
            t(
              "Test it on " + I.DEFAULT_RUNS + " random move sequences",
              "Probar con " + I.DEFAULT_RUNS + " secuencias de movimientos al azar",
            ),
          ),
          found
            ? h(
                "span",
                { class: "iv-count" },
                t("Quantities that held: ", "Cantidades que se mantuvieron: ") + found,
              )
            : null,
        ),
        res,
      );
    }

    function whyCard(held) {
      var s = st();
      var spec = ui.argSpec(held);
      var ta = h(
        "textarea",
        {
          id: "iv-why",
          rows: "4",
          maxlength: "400",
          oninput: function (e) {
            s.why = e.target.value;
          },
        },
        s.why,
      );
      var out = h("div", { class: "fx-out" });
      if (s.scored) {
        out.appendChild(
          h(
            "div",
            null,
            h(
              "ul",
              { class: "fx-rubric" },
              s.scored.checks.map(function (c) {
                return h(
                  "li",
                  { "data-ok": c.ok ? "yes" : "no" },
                  (c.ok ? "✓ " : "○ ") + t(c.label, c.labelEs),
                );
              }),
            ),
            s.scored.next
              ? h(
                  "p",
                  { class: "ewl-msg", "data-kind": "warn" },
                  t(s.scored.next.ask, s.scored.next.askEs),
                )
              : h(
                  "p",
                  { class: "ewl-msg", "data-kind": "ok" },
                  t(
                    "A clear reason with evidence. Save it when you are ready.",
                    "Una razón clara con evidencia. Guárdala cuando estés listo.",
                  ),
                ),
          ),
        );
      }
      return h(
        "section",
        { class: "ewl-card iv-card" },
        h(
          "h4",
          { tabindex: "-1", "data-why": "" },
          t("3. Say why it never changes", "3. Di por qué nunca cambia"),
        ),
        h(
          "label",
          { for: "iv-why" },
          t("Why does ", "¿Por qué ") +
            tt(held, "label") +
            t(
              " stay the same for every move? Use a number from the table.",
              " se mantiene igual con cada movimiento? Usa un número de la tabla.",
            ),
        ),
        ta,
        h(
          "span",
          { class: "iv-hint" },
          t(
            'Try: "It stays the same because ___, but if we ___ it changes."',
            'Prueba: "Se mantiene igual porque ___, pero si ___ cambia."',
          ),
        ),
        h(
          "div",
          { class: "ewl-row" },
          h(
            "button",
            {
              type: "button",
              class: "ewl-btn",
              onclick: function () {
                s.why = ta.value;
                ui.checkWhy(held, spec, false);
              },
            },
            t("Check my reason", "Revisar mi razón"),
          ),
          h(
            "button",
            {
              type: "button",
              class: "ewl-btn",
              "data-primary": "",
              onclick: function () {
                s.why = ta.value;
                ui.checkWhy(held, spec, true);
              },
            },
            t("Save my reason", "Guardar mi razón"),
          ),
        ),
        out,
        s.done
          ? h(
              "p",
              { class: "ewl-msg", "data-kind": "ok" },
              t("Saved to your Evidence Notebook.", "Guardado en tu Cuaderno de evidencias."),
            )
          : null,
      );
    }
    return {
      stateCard: stateCard,
      candidatesCard: candidatesCard,
      whyCard: whyCard,
      describeBreak: describeBreak,
      moveText: moveText,
      watchNode: watchNode,
    };
  };
})(typeof window !== "undefined" ? window : globalThis);

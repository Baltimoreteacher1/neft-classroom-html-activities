/* Sketch compiler — view pieces: story picker, tool palette, label prompt and the compile results. */
(function (root) {
  "use strict";
  var EWL = root.EWL;
  if (!EWL || !EWL.SketchModel) return;
  var M = EWL.SketchModel;

  var TOOL_TEXT = {
    block: ["▭", "Block (one equal part)", "Bloque (una parte igual)"],
    shade: ["▨", "Shade a block", "Sombrear un bloque"],
    labelBlock: ["A", "Label a block or bracket", "Etiquetar un bloque o corchete"],
    nameRow: ["≡", "Name a row", "Nombrar una fila"],
    bracket: ["⎵", "Bracket (the whole)", "Corchete (el total)"],
    erase: ["✕", "Erase", "Borrar"],
    tick: ["|", "Tick", "Marca"],
    labelTick: ["A", "Label a tick", "Etiquetar una marca"],
  };

  EWL.SketchView = function (ui) {
    var h = ui.h;
    var t = ui.t;

    function picker() {
      return h(
        "div",
        {
          class: "ewl-row fx-picker",
          role: "group",
          "aria-label": t("Choose a story", "Elige una historia"),
        },
        EWL.SketchStories.map(function (s) {
          var done = ui.solved(s);
          return h(
            "button",
            {
              type: "button",
              class: "ewl-btn",
              "aria-pressed": s === ui.story ? "true" : "false",
              onclick: function () {
                ui.choose(s);
              },
            },
            t(s.title, s.titleEs),
            done ? h("span", { class: "fx-tick" }, "✓") : null,
          );
        }),
      );
    }
    function palette(kind, tool) {
      return h(
        "div",
        { class: "sk-tools", role: "group", "aria-label": t("Tools", "Herramientas") },
        M.TOOLS[kind].map(function (id) {
          var x = TOOL_TEXT[id];
          return h(
            "button",
            {
              type: "button",
              class: "ewl-btn sk-tool",
              "aria-pressed": tool === id ? "true" : "false",
              onclick: function () {
                ui.setTool(id);
              },
            },
            h("span", { class: "sk-sym", "aria-hidden": "true" }, x[0]),
            h("span", null, t(x[1], x[2])),
          );
        }),
      );
    }
    function prompt(p) {
      if (!p) return null;
      var inp = h("input", {
        id: "sk-label",
        type: "text",
        maxlength: String(M.MAX_LABEL),
        autocomplete: "off",
        value: p.value || "",
      });
      var form = h(
        "form",
        {
          class: "sk-prompt",
          onsubmit: function (e) {
            e.preventDefault();
            ui.commitLabel(inp.value);
          },
          onkeydown: function (e) {
            if (e.key === "Escape") ui.cancelLabel();
          },
        },
        h("label", { for: "sk-label" }, p.question),
        inp,
        h(
          "button",
          { type: "submit", class: "ewl-btn", "data-primary": "" },
          t("Save label", "Guardar etiqueta"),
        ),
        h(
          "button",
          { type: "button", class: "ewl-btn", onclick: ui.cancelLabel },
          t("Cancel", "Cancelar"),
        ),
      );
      return form;
    }

    function steps(list) {
      return h(
        "ol",
        { class: "sk-steps" },
        list.map(function (s) {
          return h("li", null, t(s.en, s.es));
        }),
      );
    }
    function table(tb) {
      if (!tb) return null;
      return h(
        "table",
        { class: "fx-table sk-table" },
        h("caption", null, t("As a table", "Como tabla")),
        h(
          "thead",
          null,
          h(
            "tr",
            null,
            tb.head.map(function (c) {
              return h("th", { scope: "col" }, c);
            }),
          ),
        ),
        h(
          "tbody",
          null,
          tb.rows.map(function (r) {
            return h(
              "tr",
              null,
              r.map(function (c, i) {
                return h("td", { "data-label": tb.head[i] }, c);
              }),
            );
          }),
        ),
      );
    }
    function results(res) {
      if (!res) return h("div", { class: "fx-out" });
      var kids = [];
      if (res.check.ok)
        kids.push(
          h(
            "p",
            { class: "ewl-msg", "data-kind": "ok" },
            t(
              "Your diagram matches the story. Here is the math it shows.",
              "Tu diagrama coincide con la historia. Esta es la matemática que muestra.",
            ),
          ),
        );
      else
        kids.push(
          h(
            "div",
            { class: "ewl-msg", "data-kind": "warn" },
            h("strong", null, t("Not quite yet. Look at this: ", "Todavía no. Mira esto: ")),
            h(
              "ul",
              { class: "sk-issues" },
              res.check.issues.slice(0, 3).map(function (i) {
                return h("li", null, t(i.en, i.es));
              }),
            ),
          ),
        );
      var c = res.compiled;
      kids.push(
        h("h5", null, t("What your diagram says", "Lo que dice tu diagrama")),
        steps(c.says),
        table(c.table),
      );
      if (c.equation)
        kids.push(
          h(
            "p",
            { class: "sk-eq" },
            h("span", { class: "fx-cap" }, t("As an equation", "Como ecuación")),
            t(c.equation.en, c.equation.es),
          ),
        );
      if (c.solve) kids.push(h("h5", null, t("Solving it", "Resolverlo")), steps(c.solve));
      return h("div", { class: "fx-out sk-results", tabindex: "-1" }, kids);
    }
    return { picker: picker, palette: palette, prompt: prompt, results: results };
  };
})(typeof window !== "undefined" ? window : globalThis);

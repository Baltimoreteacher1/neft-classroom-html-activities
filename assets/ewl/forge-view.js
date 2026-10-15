/* Counterexample Forge — shared view pieces (avatar, bot picker, stepper, input form, test table, hints, rubric). Built per render by forge.js. */
(function (root) {
  "use strict";
  var EWL = root.EWL;
  if (!EWL || !EWL.Forge) return;
  var F = EWL.Forge;
  var SHAPES = ["circle", "square", "triangle", "hexagon", "diamond"];

  EWL.ForgeView = function (ui) {
    var h = ui.h;
    var svg = ui.svg;
    var t = ui.t;
    var lang = ui.lang;
    var bot = ui.bot;
    var data = ui.data;
    var wrap = ui.wrap;
    var msg = ui.msg;
    var say = ui.say;
    var st = ui.st;
    var lineOf = ui.lineOf;
    var savedDone = ui.savedDone;

    function avatar(b, size) {
      var s = SHAPES[data.bots.indexOf(b) % SHAPES.length];
      var c = 24;
      var body;
      if (s === "circle") body = svg("circle", { cx: c, cy: c, r: 20 });
      else if (s === "square") body = svg("rect", { x: 5, y: 5, width: 38, height: 38, rx: 6 });
      else if (s === "triangle") body = svg("path", { d: "M24 4 L45 42 L3 42 Z" });
      else if (s === "hexagon")
        body = svg("path", { d: "M24 3 L42 13 L42 35 L24 45 L6 35 L6 13 Z" });
      else body = svg("path", { d: "M24 2 L46 24 L24 46 L2 24 Z" });
      return svg(
        "svg",
        {
          class: "fx-avatar",
          viewBox: "0 0 48 48",
          width: size,
          height: size,
          "aria-hidden": "true",
          focusable: "false",
        },
        body,
        svg("circle", { class: "fx-eye", cx: 18, cy: 24, r: 2.4 }),
        svg("circle", { class: "fx-eye", cx: 30, cy: 24, r: 2.4 }),
        svg("path", { class: "fx-mouth", d: "M17 32 Q24 37 31 32", fill: "none" }),
      );
    }
    function picker() {
      return h(
        "div",
        {
          class: "ewl-row fx-picker",
          role: "group",
          "aria-label": t("Choose a bot", "Elige un bot"),
        },
        data.bots.map(function (b) {
          var done = (ui.states[b.id] && ui.states[b.id].done) || savedDone(b);
          return h(
            "button",
            {
              type: "button",
              class: "ewl-btn fx-botbtn",
              "aria-pressed": b === bot ? "true" : "false",
              onclick: function () {
                ui.choose(b, true);
              },
            },
            avatar(b, 28),
            h("span", null, b.name),
            done
              ? h(
                  "span",
                  { class: "fx-tick", title: t("Fixed", "Arreglado") },
                  "✓ " + t("fixed", "arreglado"),
                )
              : null,
          );
        }),
      );
    }
    function stepper() {
      var names = [
        t("Inspect", "Inspeccionar"),
        t("Find a counterexample", "Hallar un contraejemplo"),
        t("Patch the rule", "Reparar la regla"),
        t("Say it", "Dilo"),
      ];
      var at = { inspect: 0, counter: 1, patch: 2, words: 3, done: 4 }[st().stage];
      return h(
        "ol",
        { class: "fx-steps", "aria-label": t("Steps", "Pasos") },
        names.map(function (n, i) {
          var state = i < at ? "done" : i === at ? "now" : "next";
          return h(
            "li",
            { "data-state": state, "aria-current": state === "now" ? "step" : null },
            h(
              "span",
              { class: "fx-num", "aria-hidden": "true" },
              state === "done" ? "✓" : String(i + 1),
            ),
            h("span", null, n),
          );
        }),
      );
    }
    function header() {
      return h(
        "div",
        { class: "fx-bot" },
        avatar(bot, 64),
        h(
          "div",
          { class: "fx-botwords" },
          h("h3", null, bot.name),
          h("p", { class: "fx-persona" }, t(bot.persona, bot.personaEs)),
          h(
            "p",
            { class: "fx-bubble" },
            lineOf(
              st().stage === "done"
                ? "bye"
                : st().found
                  ? st().patched
                    ? "patched"
                    : "found"
                  : "hello",
            ),
          ),
        ),
      );
    }
    function ruleCard() {
      return h(
        "blockquote",
        { class: "fx-rule" },
        h("span", { class: "fx-cap" }, t(bot.name + "'s rule", "La regla de " + bot.name)),
        h("strong", null, t(bot.ruleWords, bot.ruleWordsEs)),
      );
    }
    function inputForm(label, onSubmit, primary) {
      var s = st();
      var fields = bot.inputs.map(function (spec) {
        var id = "fx-in-" + bot.id + "-" + spec.id;
        var inp = h("input", {
          id: id,
          type: "text",
          inputmode: "text",
          autocomplete: "off",
          spellcheck: "false",
          value: s.raw[spec.id] == null ? "" : s.raw[spec.id],
          maxlength: "14",
          "aria-describedby": id + "-hint",
          oninput: function (e) {
            s.raw[spec.id] = e.target.value;
          },
        });
        var chips = spec.pool.slice(0, 4).map(function (v) {
          return h(
            "button",
            {
              type: "button",
              class: "ewl-chip fx-chip",
              onclick: function () {
                inp.value = v;
                s.raw[spec.id] = v;
                inp.focus();
              },
            },
            v,
          );
        });
        return h(
          "div",
          { class: "fx-field" },
          h("label", { for: id }, t(spec.label, spec.labelEs)),
          inp,
          h(
            "span",
            { id: id + "-hint", class: "fx-hint" },
            t("Example: ", "Ejemplo: ") + spec.example,
          ),
          h(
            "span",
            {
              class: "fx-chips",
              role: "group",
              "aria-label": t("Quick picks", "Opciones rápidas"),
            },
            chips,
          ),
        );
      });
      return h(
        "form",
        {
          class: "fx-form",
          novalidate: "novalidate",
          onsubmit: function (e) {
            e.preventDefault();
            onSubmit();
          },
        },
        fields,
        h(
          "button",
          { type: "submit", class: "ewl-btn", "data-primary": primary ? "" : null },
          label,
        ),
      );
    }
    function readInputs(errBox) {
      var p = F.parseInputs(bot, st().raw);
      if (!p.ok) {
        var e = msg("warn", t(p.error, p.errorEs));
        errBox.replaceChildren(e);
        say(t(p.error, p.errorEs));
        var el = wrap.querySelector("#fx-in-" + bot.id + "-" + p.field);
        if (el) el.focus();
        return null;
      }
      errBox.replaceChildren();
      return p;
    }
    function describeRun(p) {
      return bot.inputs
        .map(function (spec) {
          return spec.id + " = " + p.disp[spec.id];
        })
        .join(", ");
    }

    /* ---------- stages ---------- */
    function triesTable() {
      var s = st();
      if (!s.tries.length) return null;
      return h(
        "table",
        { class: "fx-table" },
        h("caption", null, t("Your tests so far", "Tus pruebas hasta ahora")),
        h(
          "thead",
          null,
          h(
            "tr",
            null,
            [
              t("Inputs", "Entradas"),
              t(bot.name + " said", bot.name + " dijo"),
              t("Checked answer", "Respuesta verificada"),
              t("Result", "Resultado"),
            ].map(function (c) {
              return h("th", { scope: "col" }, c);
            }),
          ),
        ),
        h(
          "tbody",
          null,
          s.tries.map(function (r) {
            return h(
              "tr",
              { "data-breaks": r.breaks ? "yes" : "no" },
              h("td", { "data-label": t("Inputs", "Entradas") }, r.text),
              h(
                "td",
                { "data-label": t(bot.name + " said", bot.name + " dijo") },
                F.show(bot, r.said, r.disp, lang),
              ),
              h(
                "td",
                { "data-label": t("Checked answer", "Respuesta verificada") },
                F.show(bot, r.truth, r.disp, lang),
              ),
              h(
                "td",
                { "data-label": t("Result", "Resultado") },
                r.breaks
                  ? "✓ " + t("found: the rule breaks", "hallado: la regla falla")
                  : "○ " + t("same: the rule held here", "igual: la regla aguantó aquí"),
              ),
            );
          }),
        ),
      );
    }
    function hintBlock() {
      var s = st();
      var kids = [];
      for (var i = 0; i <= s.hint; i++) {
        var hh = F.hint(bot, i, lang);
        var label = {
          question: t("A question to think about", "Una pregunta para pensar"),
          picture: t("A picture to try", "Una imagen para probar"),
          range: t("A range to try", "Un rango para probar"),
        }[hh.kind];
        kids.push(
          h(
            "p",
            { class: "ewl-msg", "data-kind": "warn", "data-hint": hh.kind },
            h("strong", null, label + ": "),
            hh.text,
          ),
        );
      }
      return h("div", { class: "fx-hints" }, kids);
    }
    function rubric(sc) {
      return h(
        "ul",
        { class: "fx-rubric" },
        sc.checks.map(function (c) {
          return h(
            "li",
            { "data-ok": c.ok ? "yes" : "no" },
            (c.ok ? "✓ " : "○ ") + t(c.label, c.labelEs),
          );
        }),
      );
    }

    return {
      avatar: avatar,
      picker: picker,
      stepper: stepper,
      header: header,
      ruleCard: ruleCard,
      inputForm: inputForm,
      readInputs: readInputs,
      describeRun: describeRun,
      triesTable: triesTable,
      hintBlock: hintBlock,
      rubric: rubric,
    };
  };
})(typeof window !== "undefined" ? window : globalThis);

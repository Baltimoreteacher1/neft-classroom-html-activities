/* Counterexample Forge — the INSPECT, COUNTEREXAMPLE and PATCH stages. */
(function (root) {
  "use strict";
  var EWL = root.EWL;
  if (!EWL || !EWL.Forge) return;
  var F = EWL.Forge;

  EWL.ForgeStages = function (ui, V) {
    var h = ui.h;
    var t = ui.t;
    var lang = ui.lang;
    var ctx = ui.ctx;
    var bot = ui.bot;
    var msg = ui.msg;
    var say = ui.say;
    var st = ui.st;
    var lineOf = ui.lineOf;
    var activity = ui.activity;
    var ruleCard = V.ruleCard;
    var inputForm = V.inputForm;
    var readInputs = V.readInputs;
    var describeRun = V.describeRun;
    var triesTable = V.triesTable;
    var hintBlock = V.hintBlock;

    function stageInspect() {
      var s = st();
      var out = h("div", { class: "fx-out" });
      if (s.ran)
        out.appendChild(
          msg(
            "info",
            t(bot.name + " says: ", bot.name + " dice: ") +
              F.show(bot, s.ran.said, s.ran.disp, lang),
          ),
        );
      var box = h("div", { class: "fx-err" });
      var form = inputForm(t("Run " + bot.name, "Ejecutar a " + bot.name), function () {
        var p = readInputs(box);
        if (!p) return;
        var said = F.botSays(bot, p.env);
        s.ran = { said: said, disp: p.disp };
        say(bot.name + (lang === "es" ? " dice: " : " says: ") + F.show(bot, said, p.disp, lang));
        ui.focusSel = ".fx-out";
        ui.render();
      });
      return h(
        "section",
        { class: "ewl-card fx-stage" },
        h(
          "h4",
          { tabindex: "-1", "data-focus": "" },
          t("1. Inspect " + bot.name, "1. Inspecciona a " + bot.name),
        ),
        ruleCard(),
        h("p", null, t(bot.task, bot.taskEs)),
        h(
          "p",
          { class: "fx-lead" },
          t(
            "Run the bot on a few inputs and watch how it follows its rule. Nothing is checked yet.",
            "Ejecuta el bot con algunas entradas y observa cómo sigue su regla. Todavía no se revisa nada.",
          ),
        ),
        form,
        box,
        out,
        h(
          "button",
          {
            type: "button",
            class: "ewl-btn",
            "data-primary": s.ran ? "" : null,
            onclick: function () {
              s.stage = "counter";
              ui.focusSel = "[data-focus]";
              ui.render();
            },
          },
          t("I see how it works. Test the rule", "Entiendo cómo funciona. Probar la regla"),
        ),
      );
    }

    function stageCounter() {
      var s = st();
      var box = h("div", { class: "fx-err" });
      var result = h("div", { class: "fx-out" });
      if (s.last) result.appendChild(s.last);
      var misses = s.tries.filter(function (r) {
        return !r.breaks;
      }).length;
      var form = inputForm(
        t("Check against the real answer", "Comparar con la respuesta real"),
        function () {
          var p = readInputs(box);
          if (!p) return;
          var c = F.check(bot, p.env);
          var row = {
            text: describeRun(p),
            said: c.said,
            truth: c.truth,
            breaks: c.breaks,
            disp: p.disp,
            env: p.env,
          };
          s.tries.push(row);
          if (c.breaks) {
            s.found = s.found || row;
            s.last = msg(
              "ok",
              t(
                "Found one. " +
                  bot.name +
                  " said " +
                  F.show(bot, c.said, p.disp, lang) +
                  ", but the checked answer is " +
                  F.show(bot, c.truth, p.disp, lang) +
                  ". The rule breaks on " +
                  row.text +
                  ".",
                "Encontrado. " +
                  bot.name +
                  " dijo " +
                  F.show(bot, c.said, p.disp, lang) +
                  ", pero la respuesta verificada es " +
                  F.show(bot, c.truth, p.disp, lang) +
                  ". La regla falla con " +
                  row.text +
                  ".",
              ),
            );
            ctx.evidence(activity(bot), {
              claim: t(bot.ruleWords, bot.ruleWordsEs),
              prediction: F.show(bot, c.said, p.disp, lang),
              data: { inputs: row.text, checked: F.show(bot, c.truth, p.disp, lang) },
              ok: true,
              rule: bot.ruleWords,
              note: "forge:counterexample",
            });
          } else {
            s.last = msg(
              "warn",
              t(
                bot.name +
                  " was right on " +
                  row.text +
                  ", and the checked answer is the same. One test that passes does not prove a rule. Try other inputs.",
                bot.name +
                  " acertó con " +
                  row.text +
                  " y la respuesta verificada es la misma. Una prueba que sale bien no demuestra una regla. Prueba otras entradas.",
              ),
            );
          }
          say(s.last.textContent);
          ui.focusSel = ".fx-out";
          ui.render();
        },
        !s.found,
      );
      var hintBtn =
        s.hint < 2
          ? h(
              "button",
              {
                type: "button",
                class: "ewl-btn",
                onclick: function () {
                  s.hint++;
                  say(F.hint(bot, s.hint, lang).text);
                  ui.focusSel = ".fx-hints p:last-child";
                  ui.render();
                },
              },
              s.hint < 0
                ? t("I would like a hint", "Quiero una pista")
                : t("Another hint", "Otra pista"),
            )
          : null;
      var showMe =
        misses >= 2 && s.hint >= 2 && !s.found
          ? h(
              "button",
              {
                type: "button",
                class: "ewl-btn",
                onclick: function () {
                  Object.assign(s.raw, bot.showMe);
                  s.hint = 2;
                  s.last = msg(
                    "warn",
                    t(
                      "I filled in one input that breaks the rule. Press the check button to run it yourself.",
                      "Llené una entrada que hace fallar la regla. Presiona el botón de comparar para ejecutarla tú.",
                    ),
                  );
                  ui.focusSel = ".fx-out";
                  ui.render();
                },
              },
              t("Show me one input that breaks it", "Muéstrame una entrada que la haga fallar"),
            )
          : null;
      return h(
        "section",
        { class: "ewl-card fx-stage" },
        h(
          "h4",
          { tabindex: "-1", "data-focus": "" },
          t("2. Find a counterexample", "2. Halla un contraejemplo"),
        ),
        ruleCard(),
        h(
          "p",
          { class: "fx-lead" },
          t(
            "Choose inputs where you think the rule gives the wrong answer. The Forge runs the rule and the real math, then compares them.",
            "Elige entradas con las que creas que la regla da la respuesta equivocada. La Fragua ejecuta la regla y las matemáticas reales y las compara.",
          ),
        ),
        form,
        box,
        result,
        hintBlock(),
        h("div", { class: "ewl-row" }, s.found ? null : hintBtn, showMe),
        triesTable(),
        s.found
          ? h(
              "button",
              {
                type: "button",
                class: "ewl-btn",
                "data-primary": "",
                onclick: function () {
                  s.stage = "patch";
                  ui.focusSel = "[data-focus]";
                  ui.render();
                },
              },
              t("Fix the rule", "Arreglar la regla"),
            )
          : null,
      );
    }

    function stagePatch() {
      var s = st();
      var order = EWL.rng(EWL.hash("order:" + bot.id)).shuffle(bot.repairs);
      var counters = s.tries
        .filter(function (r) {
          return r.breaks;
        })
        .map(function (r) {
          return r.env;
        });
      var res = h("div", { class: "fx-out" });
      if (s.patchResult) res.appendChild(s.patchResult);
      var fs = h(
        "fieldset",
        { class: "fx-opts" },
        h(
          "legend",
          null,
          t(
            "Which new rule should " + bot.name + " use?",
            "¿Qué regla nueva debe usar " + bot.name + "?",
          ),
        ),
      );
      order.forEach(function (r) {
        fs.appendChild(
          h(
            "label",
            { class: "fx-opt" },
            h("input", {
              type: "radio",
              name: "fx-repair",
              value: r.id,
              checked: s.pick === r.id ? "checked" : null,
              onchange: function () {
                s.pick = r.id;
              },
            }),
            h("span", null, t(r.text, r.textEs)),
          ),
        );
      });
      var test = h(
        "button",
        {
          type: "button",
          class: "ewl-btn",
          "data-primary": "",
          onclick: function () {
            var r = bot.repairs.filter(function (x) {
              return x.id === s.pick;
            })[0];
            if (!r) {
              s.patchResult = msg(
                "warn",
                t("Pick one of the new rules first.", "Primero elige una de las reglas nuevas."),
              );
              say(s.patchResult.textContent);
              ui.focusSel = ".fx-out";
              return ui.render();
            }
            var j = F.judgePatch(bot, r, counters);
            var summary = j.sweep.passed + " " + t("of", "de") + " " + j.sweep.total;
            ctx.evidence(activity(bot), {
              rule: t(r.text, r.textEs),
              data: { sweep: summary },
              ok: j.accepted,
              note: "forge:patch",
            });
            if (j.accepted) {
              s.patched = r;
              s.stage = "words";
              s.patchResult = null;
              say(
                t(
                  "Passed " + summary + " tests, including your counterexample.",
                  "Pasó " + summary + " pruebas, incluida tu contraejemplo.",
                ),
              );
              ui.focusSel = "[data-focus]";
            } else {
              s.patchFails++;
              s.patchResult = msg(
                "warn",
                t(
                  "This rule still breaks: it passed " +
                    summary +
                    " tests. Run it on your own counterexample and on other kinds of numbers. " +
                    lineOf("tryAgain"),
                  "Esta regla todavía falla: pasó " +
                    summary +
                    " pruebas. Ejecútala con tu contraejemplo y con otros tipos de números. " +
                    lineOf("tryAgain"),
                ),
              );
              say(s.patchResult.textContent);
              ui.focusSel = ".fx-out";
            }
            ui.render();
          },
        },
        t("Test this rule on 240 inputs", "Probar esta regla con 240 entradas"),
      );
      var failView = null;
      if (s.patchResult && s.patchFails >= 2 && !s.patched) {
        var again = bot.repairs.filter(function (x) {
          return x.id === s.pick;
        })[0];
        var sw = again ? F.sweep(bot, again.rule, counters) : null;
        var ff = sw && sw.firstFail;
        failView = ff
          ? h(
              "p",
              { class: "ewl-msg", "data-kind": "warn" },
              t("One input where it still breaks: ", "Una entrada donde todavía falla: ") +
                bot.inputs
                  .map(function (sp) {
                    return sp.id + " = " + ff.env[sp.id].frac();
                  })
                  .join(", ") +
                ". " +
                t(
                  "The rule says " +
                    F.show(bot, ff.said, {}, lang) +
                    ". The checked answer is " +
                    F.show(bot, ff.truth, {}, lang) +
                    ".",
                  "La regla dice " +
                    F.show(bot, ff.said, {}, lang) +
                    ". La respuesta verificada es " +
                    F.show(bot, ff.truth, {}, lang) +
                    ".",
                ),
            )
          : null;
      }
      return h(
        "section",
        { class: "ewl-card fx-stage" },
        h("h4", { tabindex: "-1", "data-focus": "" }, t("3. Patch the rule", "3. Repara la regla")),
        h(
          "p",
          { class: "fx-lead" },
          t(
            "Your counterexample is now a test the new rule has to pass. So does a sweep of 240 other inputs, checked with exact fractions.",
            "Tu contraejemplo ahora es una prueba que la regla nueva debe pasar. También una serie de 240 entradas más, verificadas con fracciones exactas.",
          ),
        ),
        ruleCard(),
        fs,
        test,
        res,
        failView,
        h(
          "p",
          { class: "fx-hint" },
          t("A hint: " + F.hint(bot, 0, lang).text, "Una pista: " + F.hint(bot, 0, lang).text),
        ),
      );
    }

    return { inspect: stageInspect, counter: stageCounter, patch: stagePatch };
  };
})(typeof window !== "undefined" ? window : globalThis);

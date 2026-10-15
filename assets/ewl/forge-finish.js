/* Counterexample Forge — the SAY IT and DONE stages. */
(function (root) {
  "use strict";
  var EWL = root.EWL;
  if (!EWL || !EWL.Forge) return;

  EWL.ForgeFinish = function (ui, V) {
    var h = ui.h;
    var t = ui.t;
    var ctx = ui.ctx;
    var bot = ui.bot;
    var data = ui.data;
    var msg = ui.msg;
    var say = ui.say;
    var st = ui.st;
    var lineOf = ui.lineOf;
    var activity = ui.activity;
    var savedDone = ui.savedDone;
    var rubric = V.rubric;

    function stageWords() {
      var s = st();
      var f = s.found;
      var nums = Object.keys(f.disp)
        .map(function (k) {
          return f.disp[k];
        })
        .concat([f.truth.frac(), f.truth.percent(), f.truth.decimal(6).text]);
      var spec = { numbers: nums, vocab: bot.argument.vocab, minWords: 8 };
      var ta = h(
        "textarea",
        {
          id: "fx-words",
          rows: "4",
          maxlength: "400",
          "aria-describedby": "fx-words-hint",
          oninput: function (e) {
            s.words = e.target.value;
          },
        },
        s.words,
      );
      var out = h("div", { class: "fx-out" });
      if (s.scored)
        out.appendChild(
          h(
            "div",
            null,
            rubric(s.scored),
            s.scored.next
              ? h(
                  "p",
                  { class: "ewl-msg", "data-kind": "warn" },
                  t(s.scored.next.ask, s.scored.next.askEs),
                )
              : msg(
                  "ok",
                  t(
                    "That is a clear rule with evidence. Save it when you are ready.",
                    "Es una regla clara con evidencia. Guárdala cuando estés listo.",
                  ),
                ),
          ),
        );
      return h(
        "section",
        { class: "ewl-card fx-stage" },
        h(
          "h4",
          { tabindex: "-1", "data-focus": "" },
          t("4. Say the new rule in your words", "4. Di la regla nueva con tus palabras"),
        ),
        msg(
          "ok",
          t(bot.name + "'s new rule: ", "La regla nueva de " + bot.name + ": ") +
            t(s.patched.text, s.patched.textEs),
        ),
        h(
          "label",
          { for: "fx-words" },
          t(
            "Write one sentence that tells a friend the true rule and why " +
              bot.name +
              "'s old rule failed on " +
              f.text +
              ".",
            "Escribe una oración que le diga a un amigo la regla verdadera y por qué la regla vieja de " +
              bot.name +
              " falló con " +
              f.text +
              ".",
          ),
        ),
        ta,
        h(
          "span",
          { id: "fx-words-hint", class: "fx-hint" },
          t(
            'Try: "The old rule fails because ___, so the real rule is ___."',
            'Prueba: "La regla vieja falla porque ___, así que la regla real es ___."',
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
                s.words = ta.value;
                s.scored = ctx.Reason.scoreArgument(s.words, spec);
                say(
                  s.scored.complete
                    ? t("Complete.", "Completo.")
                    : t(s.scored.next.ask, s.scored.next.askEs),
                );
                ui.focusSel = ".fx-out";
                ui.render();
              },
            },
            t("Check my sentence", "Revisar mi oración"),
          ),
          h(
            "button",
            {
              type: "button",
              class: "ewl-btn",
              "data-primary": "",
              onclick: function () {
                s.words = ta.value;
                if (!s.words.trim()) {
                  s.scored = ctx.Reason.scoreArgument("", spec);
                  say(t("Write your sentence first.", "Primero escribe tu oración."));
                  ui.focusSel = "#fx-words";
                  return ui.render();
                }
                s.scored = ctx.Reason.scoreArgument(s.words, spec);
                ctx.evidence(activity(bot), {
                  claim: t(bot.ruleWords, bot.ruleWordsEs),
                  rule: s.words.trim(),
                  argument: s.words.trim(),
                  ok: s.scored.complete,
                  data: { counterexample: f.text, repair: s.patched.id },
                  note: "forge:fixed",
                });
                s.done = true;
                s.stage = "done";
                say(lineOf("bye"));
                ui.focusSel = "[data-focus]";
                ui.render();
              },
            },
            t("Save my rule", "Guardar mi regla"),
          ),
        ),
        out,
      );
    }
    function stageDone() {
      var s = st();
      var next = data.bots.filter(function (b) {
        return b !== bot && !(ui.states[b.id] && ui.states[b.id].done) && !savedDone(b);
      })[0];
      return h(
        "section",
        { class: "ewl-card fx-stage" },
        h(
          "h4",
          { tabindex: "-1", "data-focus": "" },
          t(bot.name + " is fixed", bot.name + " está arreglado"),
        ),
        msg("ok", t("Saved to your Evidence Notebook.", "Guardado en tu Cuaderno de evidencias.")),
        h(
          "dl",
          { class: "fx-sum" },
          h("dt", null, t("The old rule", "La regla vieja")),
          h("dd", null, t(bot.ruleWords, bot.ruleWordsEs)),
          h("dt", null, t("Your counterexample", "Tu contraejemplo")),
          h("dd", null, s.found ? s.found.text : ""),
          h("dt", null, t("The repair", "La reparación")),
          h("dd", null, s.patched ? t(s.patched.text, s.patched.textEs) : ""),
          h("dt", null, t("In your words", "Con tus palabras")),
          h("dd", null, s.words),
        ),
        h(
          "div",
          { class: "ewl-row" },
          next
            ? h(
                "button",
                {
                  type: "button",
                  class: "ewl-btn",
                  "data-primary": "",
                  onclick: function () {
                    ui.choose(next, true);
                  },
                },
                t("Meet " + next.name, "Conoce a " + next.name),
              )
            : null,
          h(
            "button",
            {
              type: "button",
              class: "ewl-btn",
              onclick: function () {
                ui.states[bot.id] = ui.fresh(bot);
                ui.focusSel = "[data-focus]";
                ui.render();
              },
            },
            t("Try " + bot.name + " again", "Probar a " + bot.name + " otra vez"),
          ),
        ),
      );
    }

    return { words: stageWords, done: stageDone };
  };
})(typeof window !== "undefined" ? window : globalThis);

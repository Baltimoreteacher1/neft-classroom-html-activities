/* EWL.LabSteps.transfer — step 8: a fresh seeded problem on the same idea, judged by EWL.Reason.diagnose.
 *
 * Help is a ladder of questions, never an answer: question -> picture (your own data) -> counterexample. The checked
 * result appears only when the student presses "Show checked result", and only after at least two attempts. There is
 * no timer, and a wrong answer never produces a worked solution.
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
  function parseAnswer(text, spec) {
    var raw = String(text || "").trim();
    var r = EWL.Rat.parse(raw);
    if (!r) return null;
    return spec.answerFmt === "pct" && raw.indexOf("%") < 0 ? r.div(100) : r;
  }

  function transfer(host, c) {
    var inv = c.inv;
    var spec = inv.transfer;
    var T = (c.S.transfer = c.S.transfer || {
      n: 0,
      attempts: 0,
      rung: 0,
      revealed: false,
      ok: false,
      solved: 0,
    });
    var seedParam = c.ctx.params && c.ctx.params.get("seed");
    var seed =
      seedParam && /^\d{1,9}$/.test(seedParam)
        ? Number(seedParam) + T.n
        : EWL.hash(inv.id + ":" + T.n);
    var g = EWL.LabTasks.generate(spec, seed);
    if (!g) {
      host.appendChild(
        U().msg(
          "warn",
          t(
            "This problem could not be made. Please reload the page.",
            "No se pudo crear este problema. Recarga la página.",
          ),
        ),
      );
      return;
    }
    var feedback = h("div", { role: "status", "aria-live": "polite" });
    var helpHost = h("div", {});
    var area = h("div", {});
    host.appendChild(
      h(
        "p",
        { class: "lab-muted" },
        t(
          "Here is a new problem on the same idea. Take your time.",
          "Aquí hay un problema nuevo sobre la misma idea. Tómate tu tiempo.",
        ),
      ),
    );
    host.appendChild(h("p", { class: "lab-prompt" }, t(g.prompt, g.promptEs)));
    host.appendChild(area);
    host.appendChild(feedback);
    host.appendChild(helpHost);

    var input;
    var choice;
    if (g.answerKind === "choice") {
      choice = U().chips(
        "answer",
        t("My answer", "Mi respuesta"),
        g.choices.map(function (x) {
          return { id: x.value, label: t(x.label, x.labelEs) };
        }),
        null,
        function () {
          checkBtn.disabled = T.ok;
        },
      );
      area.appendChild(choice.el);
    } else {
      var id = "lab-transfer-answer";
      input = h("input", {
        id: id,
        class: "lab-num",
        type: "text",
        inputmode: "decimal",
        autocomplete: "off",
        style: "width:9em",
        onkeydown: function (e) {
          if (e.key === "Enter") check();
        },
      });
      area.appendChild(
        h(
          "div",
          { class: "lab-field" },
          h(
            "label",
            { class: "lab-label", for: id },
            spec.answerFmt === "pct"
              ? t("My answer (a percent)", "Mi respuesta (un porcentaje)")
              : t("My answer (a number)", "Mi respuesta (un número)"),
          ),
          input,
        ),
      );
    }
    var checkBtn = U().btn(t("Check my answer", "Comprobar mi respuesta"), check, {
      primary: true,
      disabled: g.answerKind === "choice",
    });
    var hintBtn = U().btn(t("Give me a hint", "Dame una pista"), hint);
    var revealBtn = U().btn(t("Show checked result", "Mostrar resultado comprobado"), reveal, {
      disabled: T.attempts < 2 || T.ok,
    });
    var nextBtn = U().btn(t("Try another problem", "Probar otro problema"), function () {
      T.n += 1;
      T.attempts = 0;
      T.rung = 0;
      T.revealed = false;
      T.ok = false;
      c.save();
      c.redraw();
    });
    area.appendChild(h("div", { class: "ewl-row" }, checkBtn, hintBtn, revealBtn));
    var after = h("div", { class: "ewl-row" });
    host.appendChild(after);

    function say(kind, text) {
      EWL.clear(feedback);
      feedback.appendChild(U().msg(kind, text));
    }
    function attemptValue() {
      if (g.answerKind === "choice") {
        var v = choice.value();
        return v ? EWL.Rat.parse(v) : null;
      }
      return parseAnswer(input.value, spec);
    }
    function lang() {
      return EWL.lang();
    }
    function check() {
      var v = attemptValue();
      if (!v)
        return say(
          "warn",
          g.answerKind === "choice"
            ? t("Pick an answer first.", "Elige una respuesta primero.")
            : t(
                "Write your answer as a number" +
                  (spec.answerFmt === "pct" ? " or a percent, like 25%." : "."),
                "Escribe tu respuesta como un número" +
                  (spec.answerFmt === "pct" ? " o un porcentaje, como 25%." : "."),
              ),
        );
      var d = EWL.Reason.diagnose(g.task, { value: v });
      T.attempts += 1;
      var shown =
        g.answerKind === "choice"
          ? choice.el.querySelector("input:checked").nextSibling.textContent
          : input.value.trim();
      c.record({
        step: "transfer",
        ok: d.correct,
        rule: d.rule ? d.rule.id : undefined,
        note: t(g.prompt, g.promptEs) + " — " + t("my answer", "mi respuesta") + ": " + shown,
      });
      if (d.correct) {
        T.ok = true;
        T.solved = (T.solved || 0) + 1;
        c.save();
        say("ok", EWL.Reason.ladder(g.task, { value: v }, 0, lang()).text);
        revealBtn.disabled = true;
        checkBtn.disabled = true;
        finish();
        return;
      }
      c.save();
      revealBtn.disabled = T.attempts < 2;
      var lad = EWL.Reason.ladder(g.task, { value: v }, Math.min(T.rung, 2), lang());
      say("warn", t("Not yet. ", "Todavía no. ") + lad.text);
      EWL.announce(
        t(
          "Not yet. Try again or ask for a hint.",
          "Todavía no. Inténtalo otra vez o pide una pista.",
        ),
      );
    }
    function hint() {
      T.rung = Math.min(T.rung + 1, 2);
      c.save();
      var lad = EWL.Reason.ladder(g.task, { value: attemptValue() }, T.rung - 1, lang());
      EWL.clear(helpHost);
      helpHost.appendChild(
        U().msg("", [
          h("strong", {}, t("Hint " + T.rung + " of 3: ", "Pista " + T.rung + " de 3: ")),
          lad.text,
        ]),
      );
      if (T.rung - 1 === 1 && c.S.rows.length)
        helpHost.appendChild(
          h(
            "details",
            { class: "lab-picture", open: "open" },
            h("summary", {}, t("Look at your own data", "Mira tus propios datos")),
            EWL.LabExperiment.rowTable(inv, c.S.rows, {}),
          ),
        );
    }
    function reveal() {
      if (T.attempts < 2) return;
      var shownAnswer =
        g.answerKind === "choice"
          ? g.choices
              .filter(function (x) {
                var r = EWL.Rat.parse(x.value);
                return r && r.eq(g.task.answer);
              })
              .map(function (x) {
                return t(x.label, x.labelEs);
              })[0]
          : EWL.LabExpr.fmt(g.task.answer, spec.answerFmt === "pct" ? "pct" : "mixed");
      T.revealed = true;
      c.save();
      c.record({
        step: "transfer",
        ok: false,
        note: t("I asked for the checked result.", "Pedí el resultado comprobado."),
      });
      say(
        "",
        t("Here is the checked result: ", "Aquí está el resultado verificado: ") + shownAnswer,
      );
      revealBtn.disabled = true;
      finish();
    }
    function finish() {
      EWL.clear(after);
      after.appendChild(nextBtn);
      c.setReady(true);
    }
    if (T.ok || T.revealed) {
      checkBtn.disabled = true;
      revealBtn.disabled = true;
      finish();
    }
    c.setReady(T.ok || T.revealed || (T.solved || 0) > 0);
  }

  EWL.LabSteps = EWL.LabSteps || {};
  EWL.LabSteps.transfer = transfer;
})(typeof window !== "undefined" ? window : globalThis);

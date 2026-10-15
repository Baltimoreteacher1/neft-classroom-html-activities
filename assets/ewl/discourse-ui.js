/* EWL.DiscourseUI — the Because / But / So composer for Executable Discourse.
 *
 *   DiscourseUI.mount(host, tpl, opts) -> {state(), destroy()}
 *     tpl   a discourse template (data/ewl/investigations.json -> discourseTemplates)
 *     opts  {tier:1|2|3, initial: ast, numbers:[…], vocab:[…], onChange(info)}
 *   info = {ast|null, text, rubric, verify|null, complete}      ast is validated by EWL.Discourse.validate
 *
 * "Run & Verify My Claim" runs the claim over the template's cases with exact arithmetic. A case where it fails is a
 * counterexample the But clause has to name and answer; the So clause (the revised claim) is run the same way.
 */
(function (root) {
  "use strict";
  var EWL = (root.EWL = root.EWL || {});

  function mount(host, tpl, opts) {
    var h = EWL.h;
    var U = EWL.LabUI;
    var D = EWL.Discourse;
    var T = EWL.DiscourseText;
    opts = opts || {};
    var st = { tier: opts.tier || 1, because: [], but: [], soText: "", freeBecause: "", ran: null };
    var claimEd;
    var soEd;
    var secs;
    if (opts.initial && D.validate(opts.initial, tpl).length === 0) {
      st.tier = opts.initial.tier;
      st.because = opts.initial.because.slice();
      st.but = opts.initial.but.slice();
      st.soText = opts.initial.so.text || "";
    }
    var tierHost = h("div", {});
    var claimHost = h("div", { class: "disc-sec" });
    var runHost = h("div", { class: "disc-sec", "aria-live": "polite" });
    var becauseHost = h("div", { class: "disc-sec" });
    var butHost = h("div", { class: "disc-sec" });
    var soHost = h("div", { class: "disc-sec" });
    var summaryHost = h("div", { class: "disc-sec" });
    var root_ = h(
      "div",
      { class: "disc" },
      tierHost,
      h("h4", {}, EWL.t("Claim", "Afirmación")),
      claimHost,
      runHost,
      h("h4", {}, EWL.t("Because", "Porque")),
      becauseHost,
      h("h4", {}, EWL.t("But", "Pero")),
      butHost,
      h("h4", {}, EWL.t("So", "Entonces")),
      soHost,
      summaryHost,
    );
    host.appendChild(root_);

    function sec(text) {
      return h("p", { class: "lab-muted" }, text);
    }
    function build() {
      var c = claimEd ? claimEd.get() : {};
      var s = soEd ? soEd.get() : {};
      if (!c.claim || !s.claim) return null;
      var so = { type: "so", claim: s.claim };
      if (st.soText.trim()) so.text = st.soText.trim().slice(0, 400);
      var because = st.because.slice();
      if (st.tier === 3 && st.freeBecause.trim())
        because = [
          { type: "reason", text: st.freeBecause.trim().slice(0, 400), id: "free" },
        ].concat(
          because.filter(function (n) {
            return n.type === "evidence";
          }),
        );
      return {
        v: 1,
        template: tpl.id,
        tier: st.tier,
        claim: c.claim,
        because: because,
        but: st.but.slice(),
        so: so,
      };
    }
    function numbers() {
      var out = (opts.numbers || []).slice();
      st.because.concat(st.but).forEach(function (n) {
        if (!n.case) return;
        try {
          var e = D.env(tpl, n.case);
          Object.keys(e).forEach(function (k) {
            out.push(e[k].frac());
          });
        } catch (_err) {
          /* undefined case: no numbers to add */
        }
      });
      return out;
    }
    function summary() {
      EWL.clear(summaryHost);
      var ast = build();
      var info = { ast: null, text: "", rubric: null, verify: null, complete: false };
      if (!ast) {
        summaryHost.appendChild(
          U.msg(
            "",
            EWL.t(
              "Finish your claim and your So claim to see your whole argument.",
              "Termina tu afirmación y tu afirmación de Entonces para ver tu argumento completo.",
            ),
          ),
        );
        if (opts.onChange) opts.onChange(info);
        return info;
      }
      var probs = D.validate(ast, tpl);
      if (probs.length) {
        summaryHost.appendChild(U.msg("warn", probs[0]));
        if (opts.onChange) opts.onChange(info);
        return info;
      }
      var text = T.toText(ast, tpl);
      var rubric = EWL.Reason.scoreArgument(text, {
        numbers: numbers(),
        vocab: opts.vocab || tpl.vocab,
        needLimit: true,
        minWords: 12,
      });
      var v = D.verify(ast, tpl);
      info = { ast: ast, text: text, rubric: rubric, verify: v, complete: v.complete };
      summaryHost.appendChild(h("h4", {}, EWL.t("My argument", "Mi argumento")));
      summaryHost.appendChild(h("blockquote", { class: "disc-text" }, text));
      summaryHost.appendChild(
        h("h4", {}, EWL.t("Did the tests agree?", "¿Las pruebas estuvieron de acuerdo?")),
      );
      summaryHost.appendChild(
        h(
          "ul",
          { class: "disc-checks" },
          v.checks.map(function (c) {
            return h("li", { "data-ok": c.ok ? "1" : "0" }, (c.ok ? "✓ " : "○ ") + c.text);
          }),
        ),
      );
      summaryHost.appendChild(
        h("h4", {}, EWL.t("Is my writing complete?", "¿Está completa mi escritura?")),
      );
      summaryHost.appendChild(
        h(
          "ul",
          { class: "disc-checks" },
          rubric.checks.map(function (c) {
            return h(
              "li",
              { "data-ok": c.ok ? "1" : "0" },
              (c.ok ? "✓ " : "○ ") +
                EWL.t(c.label, c.labelEs) +
                (c.ok ? "" : " — " + EWL.t(c.ask, c.askEs)),
            );
          }),
        ),
      );
      if (opts.onChange) opts.onChange(info);
      return info;
    }

    /* ----- claim / so editors ----- */
    function editors() {
      EWL.clear(claimHost);
      EWL.clear(soHost);
      claimEd = null;
      soEd = null;
      claimEd = EWL.DiscourseBuild.claimEditor(tpl, st.tier, opts.initial && opts.initial.claim, {
        onChange: function () {
          if (!claimEd) return;
          st.ran = null;
          renderRun();
          summary();
        },
      });
      claimHost.appendChild(sec(EWL.t(tpl.intro, tpl.introEs)));
      claimHost.appendChild(claimEd.el);
      soEd = EWL.DiscourseBuild.claimEditor(
        tpl,
        st.tier,
        opts.initial && opts.initial.so && opts.initial.so.claim,
        {
          onChange: function () {
            if (secs && st.tier === 1) secs.renderBecause();
            summary();
          },
        },
      );
      soHost.appendChild(
        sec(
          EWL.t(
            'Now write your claim again so it is true in every case you tested. You can use "when" to say where it works.',
            'Ahora escribe tu afirmación de nuevo para que sea cierta en todos los casos que probaste. Puedes usar "cuando" para decir dónde funciona.',
          ),
        ),
      );
      soHost.appendChild(soEd.el);
      if (st.tier === 3)
        soHost.appendChild(
          textArea(
            "disc-so-text",
            EWL.t(
              "Say why in your own words (optional)",
              "Explica por qué con tus palabras (opcional)",
            ),
            st.soText,
            function (v) {
              st.soText = v;
              summary();
            },
          ),
        );
    }
    function textArea(id, label, value, onInput) {
      var ta = h("textarea", {
        id: id,
        class: "lab-textarea",
        rows: 3,
        maxlength: 400,
        oninput: function () {
          onInput(ta.value);
        },
      });
      ta.value = value;
      return h(
        "div",
        { class: "lab-field" },
        h("label", { class: "lab-label", for: id }, label),
        ta,
      );
    }

    /* ----- Run & Verify ----- */
    function renderRun() {
      EWL.clear(runHost);
      var c = claimEd ? claimEd.get() : {};
      var run = U.btn(
        EWL.t("Run & Verify My Claim", "Ejecutar y verificar mi afirmación"),
        function () {
          st.ran = D.runClaim(c.claim, tpl);
          renderRun();
          secs.renderBecause();
          secs.renderBut();
          EWL.announce(
            st.ran.fails.length
              ? EWL.t(
                  "Your claim fails on " + st.ran.fails.length + " cases.",
                  "Tu afirmación falla en " + st.ran.fails.length + " casos.",
                )
              : EWL.t(
                  "Your claim holds on every case.",
                  "Tu afirmación se cumple en todos los casos.",
                ),
          );
        },
        { primary: true, disabled: !c.claim },
      );
      runHost.appendChild(run);
      if (!st.ran) return;
      var r = st.ran;
      var msgKind = r.fails.length ? "warn" : "ok";
      runHost.appendChild(
        U.msg(
          msgKind,
          r.fails.length
            ? EWL.t(
                "Tested on " +
                  r.applicable +
                  " cases. Your claim fails on " +
                  r.fails.length +
                  ". Those cases are counterexamples: put one in your But.",
                "Se probó en " +
                  r.applicable +
                  " casos. Tu afirmación falla en " +
                  r.fails.length +
                  ". Esos casos son contraejemplos: pon uno en tu Pero.",
              )
            : EWL.t(
                "Tested on " + r.applicable + " cases. It holds on every one.",
                "Se probó en " + r.applicable + " casos. Se cumple en todos.",
              ),
        ),
      );
      var rows = [];
      D.cases(tpl).forEach(function (cv) {
        try {
          var e = D.env(tpl, cv);
          var one = oneCase(c.claim, e);
          rows.push({ cv: cv, one: one });
        } catch (_err) {
          /* undefined case */
        }
      });
      var shown = rows
        .filter(function (x) {
          return x.one.applies;
        })
        .sort(function (a, b) {
          return Number(a.one.holds) - Number(b.one.holds);
        })
        .slice(0, 12);
      runHost.appendChild(
        U.table(
          [
            { label: EWL.t("Case", "Caso") },
            { label: EWL.t("Values", "Valores") },
            { label: EWL.t("Result", "Resultado") },
          ],
          shown.map(function (x) {
            return {
              flag: x.one.holds ? "ok" : "bad",
              cells: [
                T.caseText(x.cv, tpl),
                T.evalText(x.cv, tpl),
                (x.one.holds ? "✓ " : "✗ ") +
                  (x.one.holds ? EWL.t("holds", "se cumple") : EWL.t("fails", "falla")),
              ],
            };
          }),
          { label: EWL.t("Cases tested", "Casos probados") },
        ),
      );
    }
    function oneCase(claim, e) {
      if (claim.when != null && EWL.LabExpr.eval(claim.when, e) !== true) return { applies: false };
      return {
        applies: true,
        holds: EWL.LabExpr.eval([claim.op, claim.left, claim.right], e) === true,
      };
    }

    secs = EWL.DiscourseSections.create({
      tpl: tpl,
      st: st,
      becauseHost: becauseHost,
      butHost: butHost,
      summary: summary,
      claim: function () {
        return claimEd ? claimEd.get().claim || null : null;
      },
      soClaim: function () {
        return soEd ? soEd.get().claim || null : null;
      },
      sec: sec,
      textArea: textArea,
      oneCase: oneCase,
    });
    function renderTier() {
      EWL.clear(tierHost);
      tierHost.appendChild(
        U.chips(
          "tier",
          EWL.t("How do you want to build it?", "¿Cómo quieres construirlo?"),
          [
            { id: "1", label: EWL.t("Tier 1: pick the words", "Nivel 1: elegir las palabras") },
            {
              id: "2",
              label: EWL.t("Tier 2: fill in the numbers", "Nivel 2: completar los números"),
            },
            { id: "3", label: EWL.t("Tier 3: write it myself", "Nivel 3: escribirlo yo") },
          ],
          String(st.tier),
          function (v) {
            st.tier = Number(v);
            st.ran = null;
            opts.initial = null;
            all();
          },
        ).el,
      );
    }
    function all() {
      renderTier();
      editors();
      renderRun();
      secs.renderBecause();
      secs.renderBut();
      summary();
    }
    all();
    return {
      state: function () {
        return summary();
      },
      destroy: function () {
        EWL.clear(host);
      },
    };
  }

  EWL.DiscourseUI = { mount: mount };
})(typeof window !== "undefined" ? window : globalThis);

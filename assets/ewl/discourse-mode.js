/* Executable Discourse as a Reality Lab mode ("Argue it"): pick a topic, build a Because / But / So argument, run it.
 * The same composer sits inside Investigate step 5. Here it stands alone, so a teacher can use it with any of the 11
 * templates (fraction division, pyramid slant height, solving equations, mean vs. median, and the investigation topics).
 * Saved arguments go to the Evidence Notebook under ewl.discourse.<template id>.
 */
(function (root) {
  "use strict";
  var EWL = (root.EWL = root.EWL || {});

  function mount(host, ctx) {
    var h = EWL.h;
    var U = EWL.LabUI;
    var data = EWL.LabData;
    if (!data) {
      host.appendChild(
        U.msg(
          "warn",
          EWL.t(
            "The topics could not be loaded. Reload the page, or try again later.",
            "No se pudieron cargar los temas. Recarga la página o inténtalo más tarde.",
          ),
        ),
      );
      return { destroy: function () {} };
    }
    var tpls = data.discourseTemplates;
    var holder = h("div", {});
    var picked = null;
    var latest = null;
    var status = h("div", { role: "status" });
    var save = U.btn(
      EWL.t("Save to my notebook", "Guardar en mi cuaderno"),
      function () {
        ctx.evidence(EWL.id("discourse", picked.id), {
          step: "argument",
          argument: latest.text,
          ok: latest.complete,
          note: EWL.t("Tier " + latest.ast.tier, "Nivel " + latest.ast.tier),
        });
        EWL.clear(status);
        status.appendChild(
          U.msg(
            "ok",
            EWL.t("Saved in your Evidence Notebook.", "Guardado en tu Cuaderno de evidencia."),
          ),
        );
      },
      { primary: true, disabled: true },
    );
    function choose(id) {
      picked = tpls.filter(function (x) {
        return x.id === id;
      })[0];
      EWL.clear(holder);
      EWL.clear(status);
      latest = null;
      save.disabled = true;
      EWL.DiscourseUI.mount(holder, picked, {
        vocab: (picked.vocab || []).concat(picked.vocab || []),
        onChange: function (info) {
          latest = info.ast ? info : null;
          save.disabled = !latest;
        },
      });
    }
    host.appendChild(h("h2", { class: "lab-h2" }, EWL.t("Argue it", "Argumenta")));
    host.appendChild(
      h(
        "p",
        { class: "lab-muted" },
        EWL.t(
          "Pick a topic. Write a claim, then the computer runs it on real cases with exact fractions and tells you where it holds and where it breaks.",
          "Elige un tema. Escribe una afirmación y la computadora la ejecuta con casos reales y fracciones exactas, y te dice dónde se cumple y dónde se rompe.",
        ),
      ),
    );
    host.appendChild(
      U.chips(
        "topic",
        EWL.t("Topic", "Tema"),
        tpls.map(function (x) {
          return { id: x.id, label: EWL.t(x.title, x.titleEs) };
        }),
        null,
        choose,
      ).el,
    );
    host.appendChild(holder);
    host.appendChild(save);
    host.appendChild(status);
    var want = ctx.params.get("topic");
    if (
      want &&
      tpls.some(function (x) {
        return x.id === want;
      })
    ) {
      var inp = host.querySelector('input[value="' + want + '"]');
      if (inp) inp.checked = true;
      choose(want);
    }
    return {
      destroy: function () {
        EWL.clear(host);
      },
    };
  }

  var MODE = {
    id: "discourse",
    title: "Argue it",
    titleEs: "Argumenta",
    blurb: "Build a Because, But, So argument and let the computer test your claim.",
    blurbEs:
      "Construye un argumento Porque, Pero, Entonces y deja que la computadora pruebe tu afirmación.",
    order: 15,
    mount: mount,
  };
  function register() {
    if (EWL.Lab && !EWL.Lab.mode(MODE.id)) EWL.Lab.registerMode(MODE);
  }
  register();
  EWL.DiscourseMode = { register: register };
})(typeof window !== "undefined" ? window : globalThis);

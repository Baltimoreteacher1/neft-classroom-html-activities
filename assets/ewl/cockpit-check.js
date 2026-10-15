/* EWL.Cockpit.mountCheck — the "Check Yourself" screen of Today's Mission.
 *
 * Three questions built from the Practice Studio generators (StudioGen.make with an independent check), seeded by a
 * class code so a whole class can share the same questions. A wrong pick gets a question, not an answer; the checked
 * result appears only when the student asks for it after two tries. No timer. A wrong pick's misconception tag routes to
 * repair chips (links to help that already exists). A lesson with no generator gets an honest self-rating instead.
 * The pure parts (plan, grading, state machine, router) live in cockpit-core.js.
 */
(function (root) {
  "use strict";
  var EWL = (root.EWL = root.EWL || {});
  var C = (EWL.Cockpit = EWL.Cockpit || {});
  var h = EWL.h;
  var t = EWL.t;
  var loaded = {};
  var VIZ = ["/assets/studio-viz.js", "/assets/studio-viz-geo.js", "/assets/studio-viz-model.js"];

  function loadScript(src) {
    if (!loaded[src])
      loaded[src] = new Promise(function (ok, bad) {
        var s = document.createElement("script");
        s.src = src;
        s.onload = ok;
        s.onerror = function () {
          delete loaded[src];
          bad(new Error("could not load " + src));
        };
        document.head.appendChild(s);
      });
    return loaded[src];
  }
  function getJson(url) {
    return Promise.resolve().then(function () {
      return root.NTJsonCache ? root.NTJsonCache.json(url) : EWL.json(url);
    });
  }
  function isoDay() {
    var d = new Date();
    return [d.getFullYear(), d.getMonth() + 1, d.getDate()]
      .map(function (n) {
        return String(n).padStart(2, "0");
      })
      .join("-");
  }
  function classCode(lesson) {
    return String(1000 + (EWL.hash(lesson + "|" + isoDay()) % 9000));
  }
  function es() {
    return EWL.lang() === "es";
  }
  function pick(item, key) {
    return (es() && item[key + "Es"]) || item[key];
  }
  function chipNode(chip, onRef) {
    var label = es() ? chip.labelEs : chip.label;
    if (chip.kind === "reference")
      return h("button", { type: "button", class: "ewl-chip ewlc-chip", onclick: onRef }, label);
    return h("a", { class: "ewl-chip ewlc-chip", href: chip.href }, label);
  }
  function figure(item) {
    var V = root.StudioViz;
    if (!item.viz || !V) return null;
    try {
      var doc = new DOMParser().parseFromString(V.render(item.viz), "image/svg+xml");
      if (doc.querySelector("parsererror") || !doc.documentElement) return null;
      var svg = document.importNode(doc.documentElement, true);
      svg.classList.add("ewl-fig");
      return h("div", { class: "ewlc-viz" }, svg);
    } catch (_e) {
      return null;
    }
  }

  /** ctx: {entry, integ, store, hasReference, hasStudio, hasHelp, onChange} */
  function mountCheck(host, ctx) {
    var id = ctx.entry.id;
    var state = {
      dead: false,
      G: null,
      run: null,
      code: classCode(id),
      genIds: [],
      cfg: null,
      hasStudio: false,
    };

    function chipsFor(tag) {
      return C.repairChips({
        id: id,
        tag: tag,
        integ: ctx.integ,
        hasReference: ctx.hasReference,
        hasStudio: state.hasStudio,
        hasHelp: ctx.hasHelp,
        labPath: (ctx.entry.resources || {}).learningLab || null,
      });
    }
    function openRef() {
      if (EWL.Reference) EWL.Reference.open({ lesson: id, returnFocus: document.activeElement });
    }
    function chipRow(tag) {
      var chips = chipsFor(tag);
      if (!chips.length) return null;
      return h(
        "div",
        { class: "ewlc-repair" },
        h("p", { class: "ewlc-note" }, t("Ways to get help:", "Formas de obtener ayuda:")),
        h(
          "div",
          { class: "ewl-row" },
          chips.map(function (c) {
            return chipNode(c, openRef);
          }),
        ),
      );
    }
    function show(node) {
      EWL.clear(host);
      host.appendChild(node);
    }
    function previous() {
      var c = ctx.store.get().checks[id];
      if (!c) return null;
      var words = {
        ok: t("ready", "listo"),
        unsure: t("almost there", "casi"),
        repair: t("needs another look", "necesita otra mirada"),
      };
      return h(
        "p",
        { class: "ewlc-note" },
        t("Last time on this device: ", "La última vez en este dispositivo: ") + words[c.status],
      );
    }

    /* ----- honest fallback: no generator for this lesson ----- */
    function selfRate(reason) {
      var out = h("div", { class: "ewlc-result", "aria-live": "polite" });
      function rate(status) {
        ctx.store.setCheck(id, status);
        EWL.clear(out);
        if (status === "ok")
          out.appendChild(
            h(
              "p",
              { class: "ewl-msg", "data-kind": "ok" },
              t(
                "Good. Next, try the exit ticket and see if it matches how you feel.",
                "Bien. Ahora prueba el boleto de salida y mira si coincide con lo que sientes.",
              ),
            ),
          );
        else {
          out.appendChild(
            h(
              "p",
              { class: "ewl-msg", "data-kind": "warn" },
              t(
                "That is useful to know. Pick a way to look at it again.",
                "Es útil saberlo. Elige una forma de verlo otra vez.",
              ),
            ),
          );
          var row = chipRow("");
          if (row) out.appendChild(row);
        }
        EWL.announce(t("Saved.", "Guardado."));
        if (ctx.onChange) ctx.onChange();
      }
      show(
        h(
          "div",
          { class: "ewlc-selfrate" },
          h(
            "p",
            null,
            reason ||
              t(
                "This lesson does not have a question set yet. Rate yourself honestly.",
                "Esta lección todavía no tiene preguntas. Evalúate con honestidad.",
              ),
          ),
          h(
            "p",
            { class: "ewlc-strong" },
            t("How do you feel about today's skill?", "¿Cómo te sientes con la destreza de hoy?"),
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
                  rate("ok");
                },
              },
              t("I could teach it", "Podría enseñarlo"),
            ),
            h(
              "button",
              {
                type: "button",
                class: "ewl-btn",
                onclick: function () {
                  rate("unsure");
                },
              },
              t("I need another look", "Necesito otra mirada"),
            ),
          ),
          out,
          previous(),
        ),
      );
    }

    /* ----- the three questions ----- */
    function start(code) {
      state.code = code;
      var plan = C.checkPlan({
        lesson: id,
        genIds: state.genIds,
        code: code,
        levels: state.cfg.levels,
      });
      var items = C.buildItems(state.G, plan);
      if (!items.length)
        return selfRate(
          t(
            "The questions did not load. Rate yourself honestly.",
            "No cargaron las preguntas. Evalúate con honestidad.",
          ),
        );
      state.run = C.newRun(items);
      showItem(0);
    }
    function codeRow() {
      var input = h("input", {
        id: "ewlc-code",
        class: "ewlc-code",
        type: "text",
        inputmode: "numeric",
        maxlength: "6",
        value: state.code,
        autocomplete: "off",
      });
      return h(
        "form",
        {
          class: "ewlc-coderow",
          onsubmit: function (e) {
            e.preventDefault();
            var v = input.value.trim();
            if (/^[0-9a-z]{1,6}$/i.test(v)) start(v);
          },
        },
        h("label", { for: "ewlc-code" }, t("Class code", "Código de la clase")),
        input,
        h("button", { type: "submit", class: "ewl-btn" }, t("Use code", "Usar código")),
        h(
          "span",
          { class: "ewlc-note" },
          t("Same code, same questions.", "Mismo código, mismas preguntas."),
        ),
      );
    }
    function showItem(i) {
      var run = state.run;
      var item = run.items[i];
      var st = run.state[i];
      var n = run.items.length;
      var fb = h("div", { class: "ewlc-fb", role: "status", "aria-live": "polite" });
      var actions = h("div", { class: "ewl-row" });
      var form;
      var stem = pick(item, "q");

      function lockDone() {
        form.querySelectorAll("input,button[type=submit]").forEach(function (el) {
          el.disabled = true;
        });
        actions.appendChild(
          h(
            "button",
            {
              type: "button",
              class: "ewl-btn",
              "data-primary": "",
              id: "ewlc-next",
              onclick: function () {
                if (i + 1 < n) showItem(i + 1);
                else finish();
              },
            },
            i + 1 < n
              ? t("Next question", "Siguiente pregunta")
              : t("See my results", "Ver mis resultados"),
          ),
        );
        var nb = actions.lastChild;
        if (nb) nb.focus();
      }
      function answerText() {
        return item.k === "num"
          ? item.a + (item.unit ? " " + item.unit : "")
          : pick({ c: item.c, cEs: item.cEs }, "c")[item.a];
      }
      function message(kind, text) {
        EWL.clear(fb);
        fb.appendChild(h("p", { class: "ewl-msg", "data-kind": kind }, text));
        EWL.announce(text);
      }
      function hint() {
        if (st.wrong === 1)
          return t(
            "Read the question again. What is it asking you to find?",
            "Lee la pregunta otra vez. ¿Qué te piden encontrar?",
          );
        var hs = (es() && item.hEs) || item.h || [];
        return hs.length
          ? hs[Math.min(st.wrong - 2, hs.length - 1)]
          : t(
              "Try a smaller, simpler version of the same problem.",
              "Prueba una versión más pequeña y sencilla del mismo problema.",
            );
      }
      function offerReveal() {
        if (!C.canReveal(run, i) || actions.querySelector("[data-reveal]")) return;
        actions.appendChild(
          h(
            "button",
            {
              type: "button",
              class: "ewl-btn",
              "data-reveal": "",
              onclick: function () {
                C.reveal(run, i);
                EWL.clear(fb);
                fb.appendChild(
                  h(
                    "div",
                    { class: "ewl-msg", "data-kind": "warn" },
                    h("p", null, t("Checked result: ", "Resultado verificado: ") + answerText()),
                    item.x ? h("p", null, pick(item, "x")) : null,
                  ),
                );
                actions.querySelector("[data-reveal]").remove();
                lockDone();
              },
            },
            t("Show checked result", "Mostrar el resultado verificado"),
          ),
        );
      }
      function submit(e) {
        e.preventDefault();
        var resp;
        if (item.k === "num") resp = form.querySelector("input[type=text]").value;
        else {
          var sel = form.querySelector("input[type=radio]:checked");
          resp = sel ? sel.value : "";
        }
        var g = C.grade(state.G, item, resp);
        if (g.blank)
          return message(
            "warn",
            t("Choose or type an answer first.", "Primero elige o escribe una respuesta."),
          );
        C.answer(run, i, g);
        if (g.ok) {
          EWL.clear(fb);
          fb.appendChild(
            h(
              "div",
              { class: "ewl-msg", "data-kind": "ok" },
              h("p", null, t("Yes, that matches.", "Sí, coincide.")),
              item.x ? h("p", null, pick(item, "x")) : null,
            ),
          );
          EWL.announce(t("Correct.", "Correcto."));
          return lockDone();
        }
        message("warn", t("Not yet. ", "Todavía no. ") + hint());
        if (item.k !== "num") {
          var chosen = form.querySelector("input[type=radio]:checked");
          chosen.disabled = true;
          chosen.checked = false;
          chosen.parentNode.appendChild(
            h("span", { class: "ewlc-tried" }, t(" (tried)", " (probado)")),
          );
        } else {
          var box = form.querySelector("input[type=text]");
          box.select();
          box.focus();
        }
        offerReveal();
      }

      if (item.k === "num") {
        form = h(
          "form",
          { class: "ewlc-form", onsubmit: submit },
          h("label", { for: "ewlc-ans", class: "ewlc-stem" }, stem),
          h(
            "div",
            { class: "ewl-row" },
            h("input", {
              id: "ewlc-ans",
              class: "ewlc-code",
              type: "text",
              inputmode: "decimal",
              autocomplete: "off",
            }),
            item.unit ? h("span", null, item.unit) : null,
          ),
          h(
            "button",
            { type: "submit", class: "ewl-btn", "data-primary": "" },
            t("Check my answer", "Revisar mi respuesta"),
          ),
        );
      } else {
        var choices = (es() && item.cEs) || item.c;
        form = h(
          "form",
          { class: "ewlc-form", onsubmit: submit },
          h(
            "fieldset",
            { class: "ewlc-choices" },
            h("legend", { class: "ewlc-stem" }, stem),
            choices.map(function (c, k) {
              return h(
                "label",
                { class: "ewlc-choice" },
                h("input", { type: "radio", name: "ewlc-c", value: String(k) }),
                h("span", null, c),
              );
            }),
          ),
          h(
            "button",
            { type: "submit", class: "ewl-btn", "data-primary": "" },
            t("Check my answer", "Revisar mi respuesta"),
          ),
        );
      }
      show(
        h(
          "div",
          { class: "ewlc-q" },
          h(
            "p",
            { class: "ewlc-qn" },
            t("Question " + (i + 1) + " of " + n, "Pregunta " + (i + 1) + " de " + n),
          ),
          figure(item),
          form,
          fb,
          actions,
          codeRow(),
        ),
      );
      var first = host.querySelector("input");
      if (first) first.focus();
    }
    function finish() {
      var sum = C.summarize(state.run);
      ctx.store.setCheck(id, sum.status, sum.repairTag || undefined);
      var kind = sum.status === "ok" ? "ok" : "warn";
      var text = {
        ok: t(
          "All three on the first try. You are ready for the exit ticket.",
          "Las tres al primer intento. Estás listo para el boleto de salida.",
        ),
        unsure: t(
          "You got there after a second look. A little more practice will help.",
          "Llegaste después de mirar otra vez. Un poco más de práctica ayudará.",
        ),
        repair: t(
          "Some of these need another look. Pick a way to get help.",
          "Algunas necesitan otra mirada. Elige una forma de obtener ayuda.",
        ),
      }[sum.status];
      var rep = sum.status !== "ok" ? chipRow(sum.repairTag || "") : null;
      show(
        h(
          "div",
          { class: "ewlc-result" },
          h("p", { class: "ewl-msg", "data-kind": kind, id: "ewlc-result" }, text),
          sum.repairTag && !es()
            ? h("p", { class: "ewlc-note" }, "Pattern to watch: " + C.tagLabel(sum.repairTag) + ".")
            : null,
          rep,
          h(
            "div",
            { class: "ewl-row" },
            h(
              "button",
              {
                type: "button",
                class: "ewl-btn",
                onclick: function () {
                  start(String(1000 + Math.floor(Math.random() * 9000)));
                },
              },
              t("Try new questions", "Probar preguntas nuevas"),
            ),
          ),
          codeRow(),
        ),
      );
      EWL.announce(text);
      if (ctx.onChange) ctx.onChange();
    }

    /* ----- load what this lesson needs, lazily ----- */
    show(
      h(
        "p",
        { class: "ewlc-note", role: "status" },
        t("Getting your questions ready...", "Preparando tus preguntas..."),
      ),
    );
    getJson("/data/ewl/check-yourself.json")
      .then(function (cfg) {
        state.cfg = cfg;
        state.hasStudio = cfg.studio.indexOf(id) >= 0;
        return state.hasStudio ? getJson("/data/practice-studio/" + id + ".json") : null;
      })
      .then(function (studio) {
        if (state.dead) return null;
        state.genIds = C.studioGenIds(studio).filter(function (g) {
          return state.cfg.genFiles[g];
        });
        if (!state.genIds.length) return selfRate();
        var files = state.genIds
          .map(function (g) {
            return state.cfg.genFiles[g];
          })
          .filter(function (f, k, a) {
            return a.indexOf(f) === k;
          });
        return loadScript("/assets/studio-gen/core.js")
          .then(function () {
            return Promise.all(
              files
                .map(function (f) {
                  return loadScript("/assets/studio-gen/" + f + ".js");
                })
                .concat(VIZ.map(loadScript)),
            );
          })
          .then(function () {
            if (state.dead) return;
            state.G = root.StudioGen;
            start(new URLSearchParams(root.location.search).get("code") || state.code);
          });
      })
      .catch(function () {
        if (!state.dead)
          selfRate(
            t(
              "The questions could not load. Rate yourself honestly.",
              "No se pudieron cargar las preguntas. Evalúate con honestidad.",
            ),
          );
      });
    return {
      destroy: function () {
        state.dead = true;
      },
    };
  }
  C.mountCheck = mountCheck;
  C.classCode = classCode;
})(typeof window !== "undefined" ? window : globalThis);

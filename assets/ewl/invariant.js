/* Invariant Hunter — Math Reality Lab mode "invariant" (page code; logic in invariant-engine.js, pieces in invariant-view.js).
 *
 * The student applies the allowed moves to a state, watches a quantity in a table, proposes what never changes (from a
 * list or a small safe expression builder), and the engine tests it over hundreds of random move sequences with exact
 * arithmetic: "held in N of N", or the first break. Then the student says WHY in a sentence. No timers, no points.
 */
(function (root) {
  "use strict";
  var EWL = root.EWL;
  if (!EWL || !EWL.Lab || !EWL.Invariant) return;
  var I = EWL.Invariant;
  var DATA_URL = "/data/ewl/invariants.json";

  function mount(host, ctx) {
    var h = ctx.h;
    var t = ctx.t;
    var lang = ctx.lang;
    var wrap = h("div", { class: "ewl-mode iv" });
    host.appendChild(wrap);
    var data = null;
    var hunt = null;
    var states = {};
    var counter = 1;

    function msg(kind, text) {
      return h("p", { class: "ewl-msg", "data-kind": kind }, text);
    }
    function activity() {
      return ctx.activity("invariant", hunt.id);
    }
    function savedDone(hu) {
      try {
        return (ctx.store.get().evidence[ctx.activity("invariant", hu.id)] || []).some(
          function (e) {
            return e && e.note === "invariant:why";
          },
        );
      } catch (_e) {
        return false;
      }
    }
    function firstState(hu) {
      var s = {};
      hu.vars.forEach(function (v) {
        s[v.id] = EWL.Rat.parse(hu.start[v.id][0]);
      });
      return s;
    }
    function fresh(hu) {
      return {
        history: [{ state: firstState(hu), label: t("Start", "Inicio") }],
        params: {},
        watch: hu.candidates[0].id,
        custom: "",
        results: {},
        last: null,
        latest: null,
        why: "",
        scored: null,
        done: savedDone(hu),
      };
    }
    function st() {
      return states[hunt.id] || (states[hunt.id] = fresh(hunt));
    }
    function say(text) {
      ctx.announce(text);
    }
    var ui = {
      h: h,
      t: t,
      lang: lang,
      hunt: null,
      st: st,
      focusSel: null,
      render: render,
    };
    var V;
    ui.doMove = function (m) {
      var s = st();
      var params = {};
      (m.params || []).forEach(function (p) {
        params[p.id] = EWL.Rat.parse(s.params[m.id + "." + p.id] || p.pool[0]);
      });
      var cur = s.history[s.history.length - 1].state;
      var nxt = I.apply(hunt, cur, m.id, params);
      if (!nxt) {
        say(t("That move cannot be done here.", "Ese movimiento no se puede hacer aquí."));
        return;
      }
      var label = V.moveText(m, params);
      s.history.push({ state: nxt, label: label });
      say(label + ". " + I.text(hunt, nxt, lang));
      render();
    };
    ui.undo = function () {
      var s = st();
      if (s.history.length > 1) s.history.pop();
      say(t("Undone.", "Deshecho."));
      render();
    };
    ui.newStart = function () {
      var s = st();
      var start = I.startState(hunt, EWL.rng(EWL.hash(hunt.id + ":" + counter++)));
      s.history = [{ state: start, label: t("New start", "Nuevo inicio") }];
      say(I.text(hunt, start, lang));
      render();
    };
    ui.argSpec = function (held) {
      var s = st();
      var nums = [];
      s.history.forEach(function (r) {
        hunt.vars.forEach(function (v) {
          nums.push(r.state[v.id].frac());
        });
      });
      var start = s.history[0].state;
      var q = held.node ? EWL.Expr.attempt(held.node, start) : null;
      if (q) nums.push(q.frac());
      return { numbers: nums, vocab: hunt.why.vocab, needLimit: !!hunt.why.limit, minWords: 8 };
    };
    ui.runTest = function () {
      var s = st();
      var node = V.watchNode();
      if (!node) {
        var p = EWL.Expr.parse(
          s.custom,
          hunt.vars.map(function (v) {
            return v.id;
          }),
        );
        s.last = msg(
          "warn",
          p.ok ? t("Pick a quantity first.", "Primero elige una cantidad.") : t(p.error, p.errorEs),
        );
        say(s.last.textContent);
        ui.focusSel = ".fx-out";
        return render();
      }
      var r = I.test(hunt, node);
      var cand = hunt.candidates.filter(function (c) {
        return c.id === s.watch;
      })[0];
      var label =
        s.watch === "custom" ? { label: s.custom.trim(), labelEs: s.custom.trim() } : cand;
      var key = s.watch === "custom" ? "custom:" + s.custom.trim() : s.watch;
      s.results[key] = r;
      var nums = t(r.held + " of " + r.runs, r.held + " de " + r.runs);
      if (r.holds) {
        s.latest = { label: label.label, labelEs: label.labelEs, node: node };
        s.last = msg(
          "ok",
          t(
            "Held in " + nums + " random move sequences. It never changed. Now say why below.",
            "Se mantuvo en " +
              nums +
              " secuencias de movimientos al azar. Nunca cambió. Ahora di por qué abajo.",
          ),
        );
      } else {
        s.last = msg(
          "bad",
          V.describeBreak(r.firstBreak) +
            " " +
            t(
              "It held in " + nums + " sequences, so it is not a quantity that never changes.",
              "Se mantuvo en " + nums + " secuencias, así que no es una cantidad que nunca cambia.",
            ),
        );
      }
      ctx.evidence(activity(), {
        claim: t(label.label, label.labelEs) + t(" never changes", " nunca cambia"),
        data: { held: nums },
        ok: r.holds,
        note: "invariant:test",
      });
      say(s.last.textContent);
      ui.focusSel = ".fx-out";
      render();
    };
    ui.checkWhy = function (held, spec, save) {
      var s = st();
      s.scored = ctx.Reason.scoreArgument(s.why, spec);
      if (save && s.why.trim()) {
        ctx.evidence(activity(), {
          claim: t(held.label, held.labelEs) + t(" never changes", " nunca cambia"),
          argument: s.why.trim(),
          ok: s.scored.complete,
          note: "invariant:why",
        });
        s.done = true;
        say(t("Saved.", "Guardado."));
      } else
        say(
          s.scored.next ? t(s.scored.next.ask, s.scored.next.askEs) : t("Complete.", "Completo."),
        );
      ui.focusSel = save ? "[data-why]" : "#iv-why";
      render();
    };

    function picker() {
      return h(
        "div",
        {
          class: "ewl-row fx-picker",
          role: "group",
          "aria-label": t("Choose a hunt", "Elige una búsqueda"),
        },
        data.hunts.map(function (hu) {
          var done = (states[hu.id] && states[hu.id].done) || savedDone(hu);
          return h(
            "button",
            {
              type: "button",
              class: "ewl-btn",
              "aria-pressed": hu === hunt ? "true" : "false",
              onclick: function () {
                hunt = hu;
                ui.focusSel = "[data-focus]";
                render();
              },
            },
            t(hu.title, hu.titleEs),
            done ? h("span", { class: "fx-tick" }, "✓") : null,
          );
        }),
      );
    }
    function render() {
      ui.hunt = hunt;
      V = EWL.InvariantView(ui);
      var s = st();
      wrap.replaceChildren(
        h(
          "p",
          { class: "fx-intro" },
          t(
            "Something always stays the same while everything else moves. Find it, test it, and explain why.",
            "Algo siempre se mantiene igual mientras todo lo demás se mueve. Encuéntralo, pruébalo y explica por qué.",
          ),
        ),
        picker(),
        V.stateCard(),
        V.candidatesCard(),
        s.latest ? V.whyCard(s.latest) : document.createComment(""),
      );
      var sel = ui.focusSel;
      ui.focusSel = null;
      var el = sel ? wrap.querySelector(sel) : null;
      if (el) {
        if (!el.hasAttribute("tabindex") && !/^(INPUT|TEXTAREA|BUTTON)$/.test(el.tagName))
          el.setAttribute("tabindex", "-1");
        el.focus();
      }
    }

    EWL.json(DATA_URL)
      .then(function (d) {
        var problems = I.validate(d);
        if (problems.length) throw new Error(problems[0]);
        data = d;
        I.data = d;
        var want = ctx.params.get("hunt");
        var lesson = ctx.params.get("lesson");
        hunt =
          d.hunts.filter(function (x) {
            return x.id === want;
          })[0] ||
          d.hunts.filter(function (x) {
            return lesson && x.lessons.indexOf(lesson) >= 0;
          })[0] ||
          d.hunts[0];
        render();
      })
      .catch(function () {
        wrap.replaceChildren(
          msg(
            "warn",
            t(
              "The Hunter could not load its hunts just now. Check your connection and reload the page.",
              "El Cazador no pudo cargar sus búsquedas ahora. Revisa tu conexión y recarga la página.",
            ),
          ),
        );
      });
    return {
      destroy: function () {
        wrap.remove();
      },
    };
  }

  EWL.Lab.registerMode({
    id: "invariant",
    title: "Invariant Hunter",
    titleEs: "Cazador de invariantes",
    blurb: "Make moves, hunt for what never changes, and say why.",
    blurbEs: "Haz movimientos, busca lo que nunca cambia y di por qué.",
    order: 30,
    mount: mount,
  });
})(typeof window !== "undefined" ? window : globalThis);

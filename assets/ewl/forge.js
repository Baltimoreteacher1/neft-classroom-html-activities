/* Counterexample Forge — Math Reality Lab mode "forge" (page code; the logic is forge-engine.js).
 *
 * Five calm bots each trust one plausible-but-wrong rule. The student runs a bot (INSPECT), chooses inputs until the
 * rule really fails against the true answer (COUNTEREXAMPLE), edits the rule from structured repair options that are
 * judged on a seeded sweep of 200+ exact inputs plus their own counterexample (PATCH), then writes the corrected rule
 * in their own words (SAY IT). No timers, no points, no solution handed over: help comes as a question, then a
 * picture, then a suggested range, and a breaking input only when the student asks after two tries.
 *
 * Related surfaces: Teach the Machine asks a student to explain to a learner, in prose. The Forge makes the rule
 * executable, so a counterexample is an input the engine proves breaks it, and a repair is a rule the engine tests.
 */
(function (root) {
  "use strict";
  var EWL = root.EWL;
  if (!EWL || !EWL.Lab || !EWL.Forge) return;
  var F = EWL.Forge;
  var DATA_URL = "/data/ewl/forge-bots.json";

  function mount(host, ctx) {
    var h = ctx.h;
    var t = ctx.t;
    var lang = ctx.lang;
    var wrap = h("div", { class: "ewl-mode fx" });
    host.appendChild(wrap);
    var data = null;
    var bot = null;
    var states = {};

    function msg(kind, text, extra) {
      return h("p", { class: "ewl-msg", "data-kind": kind }, text, extra);
    }
    function say(text) {
      ctx.announce(text);
    }
    function activity(b) {
      return ctx.activity("forge", b.id);
    }
    function savedDone(b) {
      try {
        var list = ctx.store.get().evidence[activity(b)] || [];
        return list.some(function (e) {
          return e && e.note === "forge:fixed";
        });
      } catch (_e) {
        return false;
      }
    }
    function fresh(b) {
      return {
        stage: "inspect",
        raw: Object.assign({}, b.starter),
        ran: null,
        tries: [],
        hint: -1,
        found: null,
        pick: null,
        patchFails: 0,
        patchResult: null,
        patched: null,
        words: "",
        scored: null,
        done: savedDone(b),
        last: null,
      };
    }
    function st() {
      return states[bot.id] || (states[bot.id] = fresh(bot));
    }
    function lineOf(key) {
      return t(bot.lines[key], bot.lines[key + "Es"]);
    }

    var ui = {
      ctx: ctx,
      h: h,
      svg: ctx.svg,
      t: t,
      lang: lang,
      wrap: wrap,
      msg: msg,
      say: say,
      st: st,
      lineOf: lineOf,
      activity: activity,
      savedDone: savedDone,
      states: states,
      focusSel: null,
      render: render,
      choose: choose,
      fresh: fresh,
      bot: null,
      data: null,
    };
    function render() {
      ui.bot = bot;
      ui.data = data;
      var V = EWL.ForgeView(ui);
      var S = EWL.ForgeStages(ui, V);
      var E = EWL.ForgeFinish(ui, V);
      var stage = {
        inspect: S.inspect,
        counter: S.counter,
        patch: S.patch,
        words: E.words,
        done: E.done,
      }[st().stage];
      wrap.replaceChildren(
        h(
          "p",
          { class: "fx-intro" },
          t(
            "Every bot trusts a rule that sounds right. Your job: find an input that breaks it, then repair the rule.",
            "Cada bot confía en una regla que suena bien. Tu trabajo: hallar una entrada que la rompa y luego reparar la regla.",
          ),
        ),
        V.picker(),
        h("div", { class: "fx-main" }, V.header(), V.stepper()),
        stage(),
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
    function choose(b, focus) {
      bot = b;
      ui.focusSel = focus ? "[data-focus]" : null;
      render();
    }

    EWL.json(DATA_URL)
      .then(function (d) {
        var problems = F.validate(d);
        if (problems.length) throw new Error(problems[0]);
        data = d;
        F.data = d;
        var want = ctx.params.get("bot");
        var lesson = ctx.params.get("lesson");
        bot =
          d.bots.filter(function (b) {
            return b.id === want;
          })[0] ||
          d.bots.filter(function (b) {
            return lesson && b.lessons.indexOf(lesson) >= 0;
          })[0] ||
          d.bots[0];
        render();
      })
      .catch(function () {
        wrap.replaceChildren(
          msg(
            "warn",
            t(
              "The Forge could not load its bots just now. Check your connection and reload the page.",
              "La Fragua no pudo cargar sus bots ahora. Revisa tu conexión y recarga la página.",
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
    id: "forge",
    title: "Counterexample Forge",
    titleEs: "Fragua de contraejemplos",
    blurb: "Find the input that breaks a bot's rule, then repair it.",
    blurbEs: "Halla la entrada que rompe la regla de un bot y luego repárala.",
    order: 20,
    mount: mount,
  });
})(typeof window !== "undefined" ? window : globalThis);

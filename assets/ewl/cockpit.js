/* Today's Mission cockpit — the student's four-step path through one lesson, on the Curriculum hub.
 *
 *   Be Curious -> Notes Studio -> Learning Lab -> Check Yourself & Exit Ticket
 *
 * It extends what the hub already has: the lesson comes from the district pacing plan (the same rule as the hub's
 * "This week in class" card), every stage links to an existing lesson page, and the full playlist stays one click away at
 * /curriculum/student-launch/. Steps are marked done only when the student says so. Nothing renders in teacher mode.
 *
 *   EWL.Cockpit.mount(host, {store, manifest, integ, plan, today, search}) -> {destroy, state()}
 *   boots itself on #ewl-cockpit when the page loads.
 */
(function (root) {
  "use strict";
  var EWL = (root.EWL = root.EWL || {});
  var C = (EWL.Cockpit = EWL.Cockpit || {});
  var h = EWL.h;
  var t = EWL.t;

  var COPY = {
    curious: [
      ["1. Be curious", "1. Ten curiosidad"],
      [
        "Notice and wonder before you solve anything.",
        "Observa y pregúntate antes de resolver nada.",
      ],
    ],
    notes: [
      ["2. Notes", "2. Notas"],
      [
        "Write the key words and one example in your own notes.",
        "Escribe las palabras clave y un ejemplo en tus notas.",
      ],
    ],
    lab: [
      ["3. Learning lab", "3. Laboratorio"],
      [
        "Try it with your hands. Change a number and watch what happens.",
        "Pruébalo con las manos. Cambia un número y mira qué pasa.",
      ],
    ],
    check: [
      ["4. Check yourself", "4. Compruébate"],
      [
        "Three quick questions, then the exit ticket.",
        "Tres preguntas rápidas y luego el boleto de salida.",
      ],
    ],
  };

  function isTeacher() {
    return (
      EWL.flags().teacher || (document.body && document.body.classList.contains("teacher-mode"))
    );
  }
  function isoDay(d) {
    return [d.getFullYear(), d.getMonth() + 1, d.getDate()]
      .map(function (n) {
        return String(n).padStart(2, "0");
      })
      .join("-");
  }
  function lessonLabel(l) {
    return l.id + "  " + l.title;
  }
  function a(href, cls, text) {
    return h("a", { class: cls, href: href }, text);
  }

  function mount(host, o) {
    var store = o.store;
    var lessons = C.taughtLessons(o.manifest);
    var units = C.unitsOf(lessons);
    var byId = {};
    lessons.forEach(function (l) {
      byId[l.id] = l;
    });
    var today = o.today || isoDay(new Date());
    var search = o.search != null ? o.search : root.location.search;
    var refReady =
      o.refReady ||
      function () {
        return false;
      };
    var stage = "curious";
    var checkApi = null;

    // URL deep links first (?unit= ?lesson= ?preset= ?lens= ?mode=debug), then the saved lesson, then the pacing plan.
    store.hydrateFromUrl(search);
    var saved = store.get().lesson;
    var pacing = C.pacingLesson(o.plan, today);
    var fromUrl = new URLSearchParams(search).get("lesson");
    var unitOnly = !fromUrl ? Number(new URLSearchParams(search).get("unit")) : 0;
    var current = C.defaultLesson({
      lessons: lessons,
      stored: byId[saved] ? saved : null,
      plan: o.plan,
      today: today,
    });
    if (unitOnly && (!byId[saved] || byId[saved].unit !== unitOnly)) {
      var first = units.filter(function (u) {
        return u.unit === unitOnly;
      })[0];
      if (first) current = first.lessons[0].id;
    }
    store.setLesson(current);

    function entry() {
      return byId[store.get().lesson] || lessons[0];
    }
    function pick(id) {
      store.setLesson(id);
      stage = "curious";
      render();
      var sel = host.querySelector("#ewlc-lesson");
      if (sel) sel.focus();
    }

    function selects() {
      var e = entry();
      var unitSel = h(
        "select",
        {
          id: "ewlc-unit",
          class: "ewlc-select",
          onchange: function (ev) {
            var u = units.filter(function (x) {
              return String(x.unit) === ev.target.value;
            })[0];
            if (u) pick(u.lessons[0].id);
          },
        },
        units.map(function (u) {
          return h(
            "option",
            { value: String(u.unit), selected: u.unit === e.unit },
            t("Unit " + u.unit, "Unidad " + u.unit),
          );
        }),
      );
      var unit = units.filter(function (u) {
        return u.unit === e.unit;
      })[0];
      var lessonSel = h(
        "select",
        {
          id: "ewlc-lesson",
          class: "ewlc-select ewlc-select--wide",
          onchange: function (ev) {
            pick(ev.target.value);
          },
        },
        unit.lessons.map(function (l) {
          return h("option", { value: l.id, selected: l.id === e.id }, lessonLabel(l));
        }),
      );
      var week =
        pacing && byId[pacing] && pacing !== e.id
          ? h(
              "button",
              {
                type: "button",
                class: "ewl-chip",
                onclick: function () {
                  pick(pacing);
                },
              },
              t(
                "Go to this week's lesson (" + pacing + ")",
                "Ir a la lección de esta semana (" + pacing + ")",
              ),
            )
          : null;
      return h(
        "div",
        { class: "ewlc-pick" },
        h("div", null, h("label", { for: "ewlc-unit" }, t("Unit", "Unidad")), unitSel),
        h("div", null, h("label", { for: "ewlc-lesson" }, t("Lesson", "Lección")), lessonSel),
        week,
      );
    }

    function hud() {
      var slot = h("div", { class: "ewlc-hud" });
      if (EWL.Fluency && typeof EWL.Fluency.hud === "function") {
        try {
          EWL.Fluency.hud(slot);
          return slot;
        } catch (_err) {
          EWL.clear(slot);
        }
      }
      var f = store.get().fluency;
      slot.appendChild(
        f.answered
          ? h(
              "p",
              { class: "ewlc-note" },
              t(
                "Fluency: streak " + f.streak + ", best " + f.best + ".",
                "Fluidez: racha " + f.streak + ", mejor " + f.best + ".",
              ),
            )
          : a(
              "/curriculum/fluency/",
              "ewlc-note",
              t("Warm up your fluency", "Calienta tu fluidez"),
            ),
      );
      return slot;
    }

    function stepper(states) {
      return h(
        "ol",
        { class: "ewlc-steps", "aria-label": t("Mission steps", "Pasos de la misión") },
        states.map(function (s) {
          var c = COPY[s.stage][0];
          return h(
            "li",
            null,
            h(
              "button",
              {
                type: "button",
                class: "ewlc-step",
                "data-stage": s.stage,
                "aria-current": s.current ? "step" : null,
                onclick: function () {
                  stage = s.stage;
                  render();
                  var b = host.querySelector('[data-stage="' + stage + '"]');
                  if (b) b.focus();
                },
              },
              h("span", null, t(c[0], c[1])),
              h(
                "span",
                { class: "ewlc-state" },
                s.done
                  ? t("Done", "Hecho")
                  : s.current
                    ? t("Now", "Ahora")
                    : t("Not yet", "Aún no"),
              ),
            ),
          );
        }),
      );
    }

    function panel(e, states) {
      var links = C.stageLinks(e, o.integ);
      var done = states.filter(function (s) {
        return s.stage === stage;
      })[0].done;
      var copy = COPY[stage][1];
      var body = [h("p", null, t(copy[0], copy[1]))];
      var row = h("div", { class: "ewl-row" });
      links[stage].forEach(function (l, k) {
        row.appendChild(
          h(
            "a",
            { class: "ewl-btn", href: l.href, "data-primary": k === 0 ? "" : null },
            EWL.lang() === "es" ? l.labelEs : l.label,
          ),
        );
      });
      if (stage === "check") {
        var host2 = h("div", { class: "ewlc-check", id: "ewlc-check" });
        body.push(host2);
        body.push(row);
        checkApi = C.mountCheck(host2, {
          entry: e,
          integ: o.integ,
          store: store,
          hasReference: refReady(e.id),
          hasHelp: true,
          onChange: function () {},
        });
      } else body.push(row);
      var idx = C.STAGES.indexOf(stage);
      var nav = h(
        "div",
        { class: "ewl-row ewlc-nav" },
        idx > 0
          ? h(
              "button",
              {
                type: "button",
                class: "ewl-btn",
                onclick: function () {
                  go(idx - 1);
                },
              },
              t("Back", "Atrás"),
            )
          : null,
        done
          ? h(
              "span",
              { class: "ewlc-done" },
              t("Done: you finished this step.", "Hecho: terminaste este paso."),
            )
          : h(
              "button",
              {
                type: "button",
                class: "ewl-btn",
                onclick: function () {
                  store.markStage(e.id, stage);
                  EWL.announce(t("Step marked done.", "Paso marcado como hecho."));
                  if (idx < 3) go(idx + 1);
                  else render();
                },
              },
              t("Mark done", "Marcar como hecho"),
            ),
        idx < 3
          ? h(
              "button",
              {
                type: "button",
                class: "ewl-btn",
                onclick: function () {
                  go(idx + 1);
                },
              },
              t("Next step", "Siguiente paso"),
            )
          : null,
      );
      body.push(nav);
      return h(
        "div",
        { class: "ewlc-panel", id: "ewlc-panel", tabindex: "-1", "aria-live": "polite" },
        body,
      );
    }
    function go(i) {
      stage = C.STAGES[i];
      render();
      var p = host.querySelector("#ewlc-panel");
      if (p) p.focus();
    }

    function render() {
      if (checkApi) checkApi.destroy();
      checkApi = null;
      EWL.clear(host);
      if (isTeacher()) {
        host.hidden = true;
        return;
      }
      host.hidden = false;
      var e = entry();
      var states = C.stageStates(store, e.id, stage);
      var finished = states.filter(function (s) {
        return s.done;
      }).length;
      host.appendChild(
        h(
          "div",
          { class: "ewlc" },
          h(
            "div",
            { class: "ewlc-head" },
            h("h2", { id: "ewlc-title" }, t("Today's Mission", "Misión del día")),
            h(
              "p",
              { class: "ewlc-count" },
              t(finished + " of 4 steps done", finished + " de 4 pasos hechos"),
            ),
            h(
              "button",
              {
                type: "button",
                class: "ewl-chip ewlc-refbtn",
                onclick: function () {
                  if (EWL.Reference)
                    EWL.Reference.open({ lesson: e.id, returnFocus: document.activeElement });
                },
              },
              t("Pocket Reference", "Guía de bolsillo"),
            ),
          ),
          selects(),
          h(
            "p",
            { class: "ewlc-obj" },
            h("strong", null, "Lesson " + e.id + ": " + e.title + ". "),
            e.objective,
          ),
          hud(),
          stepper(states),
          panel(e, states),
          h(
            "p",
            { class: "ewlc-foot" },
            e.unit >= 2 && e.unit <= 9 && e.unit !== 4
              ? a(
                  "/math/lesson-path/" + encodeURIComponent(e.id) + "/",
                  "",
                  t(
                    "Open this lesson as one page with four steps",
                    "Abrir esta lección en una página con cuatro pasos",
                  ),
                )
              : null,
            e.unit >= 2 && e.unit <= 9 && e.unit !== 4 ? " · " : null,
            a(
              "/curriculum/student-launch/?lesson=" + encodeURIComponent(e.id),
              "",
              t(
                "See every page for this lesson in one playlist",
                "Ver todas las páginas de esta lección en una lista",
              ),
            ),
          ),
        ),
      );
    }

    function onMode() {
      render();
    }
    document.addEventListener("nt:mode-change", onMode);
    render();
    return {
      destroy: function () {
        document.removeEventListener("nt:mode-change", onMode);
        if (checkApi) checkApi.destroy();
        EWL.clear(host);
      },
      state: function () {
        return { lesson: store.get().lesson, stage: stage };
      },
    };
  }
  C.mount = mount;

  function json(url) {
    return Promise.resolve().then(function () {
      return root.NTJsonCache ? root.NTJsonCache.json(url) : EWL.json(url);
    });
  }
  function boot() {
    var host = document.getElementById("ewl-cockpit");
    if (!host || isTeacher()) return;
    Promise.all([
      json("/data/curriculum-launch-manifest.json"),
      json("/data/ewl/integration-map.json").catch(function () {
        return null;
      }),
    ])
      .then(function (r) {
        EWL.integration = r[1];
        var refReady = function () {
          return !!EWL.Reference;
        };
        C.instance = mount(host, {
          store: EWL.state,
          manifest: r[0],
          integ: r[1],
          plan: root.__NT_PACING_DAYS,
          refReady: refReady,
        });
      })
      .catch(function () {
        host.hidden = true;
      });
  }
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
  }

  EWL.selfTests.push({
    name: "cockpit: Unit 10 is never offered",
    run: function () {
      var fake = {
        lessons: [
          { id: "10-1", unit: 10, lesson: 1, resources: {} },
          { id: "3-1", unit: 3, lesson: 1, resources: {} },
        ],
      };
      return C.taughtLessons(fake).length === 1 || "Unit 10 leaked";
    },
  });
  EWL.selfTests.push({
    name: "cockpit: class code makes the same questions",
    run: function () {
      var p1 = JSON.stringify(
        C.checkPlan({ lesson: "3-1", genIds: ["a", "b", "c"], code: "4821" }),
      );
      return (
        p1 ===
          JSON.stringify(C.checkPlan({ lesson: "3-1", genIds: ["a", "b", "c"], code: "4821" })) ||
        "plan changed"
      );
    },
  });
})(typeof window !== "undefined" ? window : globalThis);

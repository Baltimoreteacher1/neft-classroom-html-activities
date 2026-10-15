/* Investigate — the first Reality Lab mode. Eight steps: Claim, Prediction, Experiment, Evidence, Argument, Challenge,
 * Revision, Transfer. This file is the controller: the picker, the step navigation, the draft that survives a reload, and
 * the Evidence Notebook saves. The steps themselves live in lab-steps*.js, lab-challenge.js and lab-transfer.js.
 *
 * Rules the controller enforces: the prediction is committed before the experiment unlocks (the step cannot be reached
 * until it is locked), a step opens only after the one before it is done, nothing is timed, and the draft holds only the
 * student's own work for this device (no name, no id).
 */
(function (root) {
  "use strict";
  var EWL = (root.EWL = root.EWL || {});
  var DRAFT_KEY = "ewl_lab_drafts_v1";
  var STEPS = [
    [
      "claim",
      "Claim",
      "Afirmación",
      "Read the claim and say what you think.",
      "Lee la afirmación y di qué piensas.",
    ],
    [
      "prediction",
      "Prediction",
      "Predicción",
      "Commit to a prediction before you test anything.",
      "Comprométete con una predicción antes de probar.",
    ],
    [
      "experiment",
      "Experiment",
      "Experimento",
      "Run the experiment and fill your data table.",
      "Ejecuta el experimento y llena tu tabla de datos.",
    ],
    [
      "evidence",
      "Evidence",
      "Evidencia",
      "Pick rows of your own data as evidence.",
      "Elige filas de tus propios datos como evidencia.",
    ],
    [
      "argument",
      "Argument",
      "Argumento",
      "Build a Because, But, So argument. The computer will run it.",
      "Construye un argumento Porque, Pero, Entonces. La computadora lo ejecutará.",
    ],
    [
      "challenge",
      "Challenge",
      "Desafío",
      "Try to break the claim with real numbers.",
      "Intenta romper la afirmación con números reales.",
    ],
    [
      "revision",
      "Revision",
      "Revisión",
      "Rewrite the claim so it is true.",
      "Reescribe la afirmación para que sea cierta.",
    ],
    [
      "transfer",
      "Transfer",
      "Transferencia",
      "Use the idea on a new problem.",
      "Usa la idea en un problema nuevo.",
    ],
  ];

  function readDrafts() {
    try {
      return JSON.parse(root.localStorage.getItem(DRAFT_KEY) || "{}") || {};
    } catch (e) {
      return {};
    }
  }
  function writeDrafts(d) {
    try {
      root.localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
    } catch (e) {
      /* private mode or full storage: the work stays on this page only */
    }
  }
  function fresh(id) {
    return {
      id: id,
      step: 0,
      furthest: 0,
      stance: null,
      prediction: null,
      rows: [],
      cited: [],
      citeNote: "",
      evidenceSaved: false,
      arg: null,
      challenge: null,
      revisionText: "",
      revision: null,
      transfer: null,
      finished: false,
    };
  }

  function mount(host, ctx) {
    var h = EWL.h;
    var U = EWL.LabUI;
    var data = EWL.LabData;
    if (!data) {
      host.appendChild(
        U.msg(
          "warn",
          EWL.t(
            "The investigations could not be loaded. Reload the page, or try again later.",
            "No se pudieron cargar las investigaciones. Recarga la página o inténtalo más tarde.",
          ),
        ),
      );
      return { destroy: function () {} };
    }
    var invs = data.investigations;
    var tpls = {};
    data.discourseTemplates.forEach(function (x) {
      tpls[x.id] = x;
    });
    var drafts = readDrafts();
    var view = h("div", { class: "lab-investigate" });
    host.appendChild(view);
    var cur = null;

    function save() {
      if (cur) {
        drafts[cur.inv.id] = cur.S;
        writeDrafts(drafts);
      }
    }

    /* ----- picker ----- */
    function picker() {
      EWL.clear(view);
      cur = null;
      var lesson = ctx.params.get("lesson");
      view.appendChild(
        h("h2", { class: "lab-h2" }, EWL.t("Choose an investigation", "Elige una investigación")),
      );
      view.appendChild(
        h(
          "p",
          { class: "lab-muted" },
          EWL.t(
            "Each one starts with a claim that sounds right. You predict, test, argue, try to break it, and then use the idea on a new problem.",
            "Cada una empieza con una afirmación que suena bien. Tú predices, pruebas, argumentas, intentas romperla y luego usas la idea en un problema nuevo.",
          ),
        ),
      );
      var grid = h("div", { class: "lab-grid" });
      invs
        .slice()
        .sort(function (a, b) {
          return a.unit - b.unit || a.title.localeCompare(b.title);
        })
        .forEach(function (inv) {
          var d = drafts[inv.id];
          var match = lesson && inv.lessons.indexOf(lesson) >= 0;
          var status = d
            ? d.finished
              ? EWL.t("Finished", "Terminada")
              : EWL.t("Step " + (d.step + 1) + " of 8", "Paso " + (d.step + 1) + " de 8")
            : "";
          grid.appendChild(
            h(
              "button",
              {
                type: "button",
                class: "lab-card ewl-card",
                "data-match": match ? "1" : null,
                onclick: function () {
                  open(inv.id);
                },
              },
              h(
                "span",
                { class: "lab-card-unit" },
                EWL.t(
                  "Unit " + inv.unit + " · Lesson " + inv.lessons.join(", "),
                  "Unidad " + inv.unit + " · Lección " + inv.lessons.join(", "),
                ),
              ),
              h("strong", { class: "lab-card-title" }, EWL.t(inv.title, inv.titleEs)),
              h("span", { class: "lab-card-blurb" }, EWL.t(inv.blurb, inv.blurbEs)),
              status ? h("span", { class: "lab-card-status" }, status) : null,
              match
                ? h(
                    "span",
                    { class: "lab-card-status" },
                    EWL.t("For your lesson", "Para tu lección"),
                  )
                : null,
            ),
          );
        });
      view.appendChild(grid);
    }

    /* ----- one investigation ----- */
    function open(id) {
      var inv = invs.filter(function (x) {
        return x.id === id;
      })[0];
      if (!inv) return picker();
      var S = drafts[id] || fresh(id);
      if (S.id !== id) S = fresh(id);
      cur = { inv: inv, S: S };
      draw();
    }
    function draw() {
      var inv = cur.inv;
      var S = cur.S;
      EWL.clear(view);
      var ready = false;
      var stepHost = h("div", { class: "lab-step-body" });
      var back = U.btn(
        EWL.t("Back", "Atrás"),
        function () {
          go(S.step - 1);
        },
        { disabled: S.step === 0 },
      );
      var next = U.btn(
        S.step === 7 ? EWL.t("Finish", "Terminar") : EWL.t("Next step", "Siguiente paso"),
        advance,
        { primary: true, disabled: true },
      );
      var nav = h("ol", { class: "lab-stepnav", "aria-label": EWL.t("Steps", "Pasos") });
      STEPS.forEach(function (s, i) {
        var state = i < S.furthest ? "done" : i === S.furthest ? "open" : "locked";
        nav.appendChild(
          h(
            "li",
            { "data-state": state },
            h(
              "button",
              {
                type: "button",
                class: "lab-stepbtn",
                "aria-current": i === S.step ? "step" : null,
                disabled: i > S.furthest ? "disabled" : null,
                onclick: function () {
                  go(i);
                },
              },
              h("span", { class: "lab-stepnum" }, String(i + 1)),
              h("span", { class: "lab-stepname" }, EWL.t(s[1], s[2])),
            ),
          ),
        );
      });
      var meta = STEPS[S.step];
      var heading = h(
        "h3",
        { class: "lab-step-h", tabindex: "-1", id: "lab-step-h" },
        EWL.t(
          "Step " + (S.step + 1) + " of 8: " + meta[1],
          "Paso " + (S.step + 1) + " de 8: " + meta[2],
        ),
      );
      view.appendChild(
        h(
          "div",
          { class: "lab-cycle" },
          h(
            "div",
            { class: "lab-cycle-head" },
            h("h2", { class: "lab-h2" }, EWL.t(inv.title, inv.titleEs)),
            h(
              "button",
              {
                type: "button",
                class: "ewl-btn lab-small",
                onclick: function () {
                  save();
                  picker();
                },
              },
              EWL.t("All investigations", "Todas las investigaciones"),
            ),
          ),
          nav,
          h(
            "section",
            { class: "lab-step ewl-card", "aria-labelledby": "lab-step-h" },
            heading,
            h("p", { class: "lab-muted" }, EWL.t(meta[3], meta[4])),
            stepHost,
          ),
          h("div", { class: "lab-nav ewl-row" }, back, next),
        ),
      );
      var c = {
        inv: inv,
        tpl: tpls[inv.discourse],
        S: S,
        ctx: ctx,
        save: save,
        redraw: draw,
        setReady: function (b) {
          ready = !!b;
          next.disabled = !ready;
        },
        record: function (entry) {
          try {
            ctx.evidence(EWL.id("lab", inv.id), entry);
          } catch (e) {
            /* storage unavailable: the work is still on screen */
          }
        },
      };
      var fn = EWL.LabSteps[meta[0]];
      if (!fn)
        stepHost.appendChild(
          U.msg("warn", EWL.t("This step is not available.", "Este paso no está disponible.")),
        );
      else fn(stepHost, c);
    }
    function go(i) {
      if (i < 0 || i > cur.S.furthest) return;
      cur.S.step = i;
      save();
      draw();
      focusHeading();
    }
    function advance() {
      var S = cur.S;
      if (S.step === 7) {
        S.finished = true;
        (cur.inv.lessons || []).forEach(function (id) {
          try {
            EWL.state.markStage(id, "lab");
          } catch (e) {
            /* lesson id not in the mission list: nothing to mark */
          }
        });
        save();
        return finished();
      }
      S.step += 1;
      S.furthest = Math.max(S.furthest, S.step);
      save();
      draw();
      focusHeading();
    }
    function focusHeading() {
      var el = view.querySelector("#lab-step-h");
      if (el) {
        el.focus();
        EWL.announce(el.textContent);
      }
    }
    function finished() {
      var inv = cur.inv;
      var S = cur.S;
      EWL.clear(view);
      var rows = S.rows.length;
      view.appendChild(
        h(
          "section",
          { class: "lab-done ewl-card", "aria-labelledby": "lab-done-h" },
          h(
            "h2",
            { id: "lab-done-h", tabindex: "-1", class: "lab-h2" },
            EWL.t("You finished: " + inv.title, "Terminaste: " + inv.titleEs),
          ),
          h("h3", {}, EWL.t("What is true", "Lo que es cierto")),
          h("p", {}, EWL.t(inv.truth.text, inv.truth.textEs)),
          h("h3", {}, EWL.t("Your thinking", "Tu razonamiento")),
          h(
            "ul",
            {},
            h(
              "li",
              {},
              EWL.t("First claim: ", "Primera afirmación: ") +
                EWL.t(inv.claim.text, inv.claim.textEs),
            ),
            S.prediction
              ? h("li", {}, EWL.t("Prediction: ", "Predicción: ") + S.prediction.text)
              : null,
            h(
              "li",
              {},
              EWL.t("Runs in your data table: ", "Ejecuciones en tu tabla de datos: ") + rows,
            ),
            S.revision
              ? h("li", {}, EWL.t("Revised claim: ", "Afirmación revisada: ") + S.revision.text)
              : null,
          ),
          h(
            "p",
            { class: "lab-muted" },
            EWL.t(
              "All of this is saved in your Evidence Notebook on this device.",
              "Todo esto está guardado en tu Cuaderno de evidencia en este dispositivo.",
            ),
          ),
          h(
            "div",
            { class: "ewl-row" },
            U.btn(EWL.t("Back to the steps", "Volver a los pasos"), function () {
              go(0);
              open(inv.id);
            }),
            U.btn(EWL.t("Choose another investigation", "Elegir otra investigación"), picker, {
              primary: true,
            }),
          ),
        ),
      );
      var hd = view.querySelector("#lab-done-h");
      if (hd) hd.focus();
      EWL.announce(EWL.t("Investigation finished.", "Investigación terminada."));
    }

    var want = ctx.params.get("inv");
    if (
      want &&
      invs.some(function (x) {
        return x.id === want;
      })
    )
      open(want);
    else picker();
    return {
      destroy: function () {
        save();
        EWL.clear(host);
      },
    };
  }

  var MODE = {
    id: "investigate",
    title: "Investigate",
    titleEs: "Investigar",
    blurb: "Predict, test, argue and try to break a claim that sounds right.",
    blurbEs: "Predice, prueba, argumenta e intenta romper una afirmación que suena bien.",
    order: 10,
    mount: mount,
  };
  /** Idempotent: safe whichever order the scripts load in (the shell calls it again after lab-registry.js is certain to exist). */
  function register() {
    if (EWL.Lab && !EWL.Lab.mode(MODE.id)) EWL.Lab.registerMode(MODE);
  }
  register();
  EWL.LabInvestigate = { STEPS: STEPS, register: register };
})(typeof window !== "undefined" ? window : globalThis);

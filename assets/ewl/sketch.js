/* Sketch compiler — Math Reality Lab mode "sketch". The student builds a tape diagram, number line or double number
 * line on a snap-to-grid canvas (pointer or keyboard), then "compiles" it: the engine checks it against the story's
 * spec with specific, kind feedback and writes the ratio table, equation or expression the diagram represents.
 * Logic: sketch-model.js, sketch-check.js, sketch-compile.js. Stories: sketch-stories.js. No timers, no points.
 */
(function (root) {
  "use strict";
  var EWL = root.EWL;
  if (!EWL || !EWL.Lab || !EWL.SketchView || !EWL.SketchGrid) return;
  var M = EWL.SketchModel;

  function mount(host, ctx) {
    var h = ctx.h;
    var t = ctx.t;
    var wrap = h("div", { class: "ewl-mode sk" });
    host.appendChild(wrap);
    var story = null;
    var states = {};
    var grid = null;
    var statusEl = h("p", {
      class: "ewl-sr",
      role: "status",
      "aria-live": "polite",
      "aria-atomic": "true",
    });
    var promptState = null;
    var focusSel = null;

    function activity(s) {
      return ctx.activity("sketch", s.id);
    }
    function solvedBefore(s) {
      try {
        return (ctx.store.get().evidence[activity(s)] || []).some(function (e) {
          return e && e.note === "sketch:matched";
        });
      } catch (_e) {
        return false;
      }
    }
    function st() {
      return (
        states[story.id] ||
        (states[story.id] = {
          d: M.create(story.kind),
          tool: M.TOOLS[story.kind][0],
          cur: { r: 0, c: 0 },
          undo: [],
          result: null,
          solved: solvedBefore(story),
        })
      );
    }
    function say(text) {
      statusEl.textContent = text;
    }
    function snapshot() {
      var s = st();
      s.undo.push(M.clone(s.d));
      if (s.undo.length > 60) s.undo.shift();
    }
    function changed(text) {
      st().result = null;
      if (text) ctx.announce(text);
      render();
    }

    var ui = {
      h: h,
      t: t,
      get story() {
        return story;
      },
      solved: function (s) {
        return (states[s.id] && states[s.id].solved) || solvedBefore(s);
      },
      choose: function (s) {
        story = s;
        promptState = null;
        focusSel = "[data-focus]";
        render();
      },
      setTool: function (id) {
        st().tool = id;
        focusSel = ".sk-svg";
        render();
      },
      commitLabel: function (value) {
        var p = promptState;
        var s = st();
        snapshot();
        M.setLabel(s.d, p.tool, p.r, p.c, value);
        promptState = null;
        focusSel = ".sk-svg";
        changed(t("Label saved.", "Etiqueta guardada."));
      },
      cancelLabel: function () {
        promptState = null;
        focusSel = ".sk-svg";
        render();
      },
    };

    function ask(tool, r, c) {
      var s = st();
      var cell = M.cellAt(s.d, r, c);
      if (tool !== "nameRow" && !cell) {
        say(
          t(
            "There is nothing to label here. Place a block or tick first.",
            "No hay nada que etiquetar aquí. Primero coloca un bloque o una marca.",
          ),
        );
        return;
      }
      var q =
        tool === "nameRow"
          ? t(
              "Name for row " + (r + 1) + " (for example: raisins, miles)",
              "Nombre para la fila " + (r + 1) + " (por ejemplo: pasas, millas)",
            )
          : cell && cell.t === "bracket"
            ? t(
                "What does the bracket stand for? Type the whole amount.",
                "¿Qué representa el corchete? Escribe la cantidad total.",
              )
            : t(
                "Label for this " +
                  (cell.t === "tick" ? "tick" : "block") +
                  " (a number, a letter, or ?)",
                "Etiqueta para esta " +
                  (cell.t === "tick" ? "marca" : "bloque") +
                  " (un número, una letra o ?)",
              );
      promptState = {
        tool: tool,
        r: r,
        c: c,
        question: q,
        value: tool === "nameRow" ? s.d.names[r] || "" : (cell && cell.label) || "",
      };
      focusSel = "#sk-label";
      render();
    }
    function apply(r, c) {
      var s = st();
      s.cur = { r: r, c: c };
      var tool = s.tool;
      if (tool === "labelBlock" || tool === "labelTick" || tool === "nameRow")
        return ask(tool, r, c);
      if (tool === "bracket" && story.kind === "tape" && r !== M.GRID.tape.bracketRow) {
        say(
          t(
            "Put the bracket on the bottom row, under the tape.",
            "Pon el corchete en la fila de abajo, debajo de la cinta.",
          ),
        );
        return grid.redraw(false);
      }
      snapshot();
      var did = M.place(s.d, tool, r, c);
      if (!did) {
        s.undo.pop();
        say(
          tool === "shade"
            ? t(
                "Place a block first, then shade it.",
                "Primero coloca un bloque y luego sombréalo.",
              )
            : t(
                "That tool does not work in this cell.",
                "Esa herramienta no funciona en esta celda.",
              ),
        );
        return grid.redraw(false);
      }
      if (tool === "bracket" && M.cellAt(s.d, r, c)) {
        s.result = null;
        return ask("labelBlock", r, c);
      }
      s.result = null;
      say(grid.describe(r, c));
      render(true);
    }
    function eraseAt(r, c) {
      var s = st();
      s.cur = { r: r, c: c };
      snapshot();
      if (!M.place(s.d, "erase", r, c)) {
        s.undo.pop();
        say(t("Nothing to erase here.", "No hay nada que borrar aquí."));
        return;
      }
      s.result = null;
      say(grid.describe(r, c));
      render(true);
    }

    function compile() {
      var s = st();
      var check = EWL.SketchCheck.check(story, s.d);
      var compiled = EWL.SketchCompile.compile(story, s.d, check.ok);
      s.result = { check: check, compiled: compiled };
      if (check.ok) s.solved = true;
      ctx.evidence(activity(story), {
        claim: t(story.title, story.titleEs),
        data: { issues: check.issues.length, kind: story.kind },
        ok: check.ok,
        note: check.ok ? "sketch:matched" : "sketch:compile",
      });
      ctx.announce(
        check.ok
          ? t("Your diagram matches the story.", "Tu diagrama coincide con la historia.")
          : t(check.issues[0].en, check.issues[0].es),
      );
      focusSel = ".sk-results";
      render();
    }

    function render() {
      if (grid && document.activeElement === grid.svg && !focusSel) focusSel = ".sk-svg";
      var s = st();
      var V = EWL.SketchView(ui);
      grid = EWL.SketchGrid.create({
        story: story,
        t: t,
        getD: function () {
          return s.d;
        },
        getCursor: function () {
          return s.cur;
        },
        setCursor: function (r, c) {
          s.cur = { r: r, c: c };
        },
        apply: apply,
        erase: eraseAt,
        status: say,
        nameRow: function (r) {
          ask("nameRow", r, 0);
        },
      });
      var card = h(
        "section",
        { class: "ewl-card sk-card" },
        h("h4", { tabindex: "-1", "data-focus": "" }, t(story.title, story.titleEs)),
        h("p", { class: "sk-story" }, t(story.text, story.textEs)),
        h("p", { class: "sk-lead" }, t(story.task, story.taskEs)),
        V.palette(story.kind, s.tool),
        grid.el,
        h(
          "p",
          { class: "sk-hint" },
          t(
            "Keyboard: arrow keys move the highlighted cell, Enter places the chosen tool, Delete erases. With a mouse or finger, press a cell. Press a row name area to name a row.",
            "Teclado: las flechas mueven la celda resaltada, Enter coloca la herramienta elegida, Suprimir borra. Con el ratón o el dedo, toca una celda. Toca el área de nombres para nombrar una fila.",
          ),
        ),
        V.prompt(promptState),
        h(
          "div",
          { class: "ewl-row" },
          h(
            "button",
            { type: "button", class: "ewl-btn", "data-primary": "", onclick: compile },
            t("Compile my diagram", "Compilar mi diagrama"),
          ),
          h(
            "button",
            {
              type: "button",
              class: "ewl-btn",
              disabled: s.undo.length ? null : "disabled",
              onclick: function () {
                s.d = s.undo.pop();
                s.result = null;
                ctx.announce(t("Undone.", "Deshecho."));
                render();
              },
            },
            t("Undo", "Deshacer"),
          ),
          h(
            "button",
            {
              type: "button",
              class: "ewl-btn",
              onclick: function () {
                snapshot();
                s.d = M.create(story.kind);
                s.result = null;
                render();
              },
            },
            t("Clear", "Limpiar"),
          ),
        ),
        V.results(s.result),
      );
      wrap.replaceChildren(
        h(
          "p",
          { class: "fx-intro" },
          t(
            "Build the picture of a story problem on the grid. The compiler checks it and shows the math your picture means.",
            "Construye el dibujo de un problema en la cuadrícula. El compilador lo revisa y muestra la matemática que significa tu dibujo.",
          ),
        ),
        V.picker(),
        card,
        statusEl,
      );
      grid.redraw(false);
      var sel = focusSel;
      focusSel = null;
      var el = sel ? wrap.querySelector(sel) : null;
      if (el) {
        if (!el.hasAttribute("tabindex") && !/^(INPUT|TEXTAREA|BUTTON|svg)$/i.test(el.tagName))
          el.setAttribute("tabindex", "-1");
        el.focus();
      }
    }

    var want = ctx.params.get("story");
    var lesson = ctx.params.get("lesson");
    story =
      EWL.SketchStories.filter(function (x) {
        return x.id === want;
      })[0] ||
      EWL.SketchStories.filter(function (x) {
        return lesson && x.lessons.indexOf(lesson) >= 0;
      })[0] ||
      EWL.SketchStories[0];
    render();
    return {
      destroy: function () {
        wrap.remove();
      },
    };
  }

  EWL.Lab.registerMode({
    id: "sketch",
    title: "Sketch compiler",
    titleEs: "Compilador de dibujos",
    blurb: "Draw a tape diagram or number line, then see the math it means.",
    blurbEs: "Dibuja un diagrama de cinta o una recta numérica y mira la matemática que significa.",
    order: 40,
    mount: mount,
  });
})(typeof window !== "undefined" ? window : globalThis);

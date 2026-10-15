/* Pocket Reference drawer — every math word a student meets, one search away, on every EWL page.
 *
 *   EWL.Reference.open({lesson?, term?, returnFocus?})   EWL.Reference.close()   EWL.Reference.hasLesson(id)
 *   Shortcut: Ctrl/Cmd+K. The Curriculum hub already gives Ctrl/Cmd+K to its command palette
 *   (assets/curriculum-product-upgrades.js), so on the hub the drawer answers to Alt+K instead.
 *
 * Data: /data/ewl/pocket-reference.json, built from lessons/<id>/config.json vocabulary (see tools/ewl-cockpit.test.mjs).
 * Search and validation are in reference-core.js; the drawings are in reference-icons.js.
 */
(function (root) {
  "use strict";
  var EWL = (root.EWL = root.EWL || {});
  var R = (EWL.Reference = EWL.Reference || {});
  var h = EWL.h;
  var t = EWL.t;
  var SHOW = 60;
  var data = null;
  var loading = null;
  var ui = null;
  var view = { q: "", lesson: null, entry: null, opener: null };

  function json(url) {
    return Promise.resolve().then(function () {
      return root.NTJsonCache ? root.NTJsonCache.json(url) : EWL.json(url);
    });
  }
  function load() {
    if (data) return Promise.resolve(data);
    loading =
      loading ||
      json("/data/ewl/pocket-reference.json").then(function (d) {
        data = d.entries;
        return data;
      });
    return loading;
  }
  var onHub = function () {
    return !!document.getElementById("ewl-cockpit");
  };
  function shortcutLabel() {
    var mac = /Mac|iPhone|iPad/.test(root.navigator.platform || "");
    if (onHub()) return mac ? "Option+K" : "Alt+K";
    return mac ? "Cmd+K" : "Ctrl+K";
  }

  /* ----- pieces ----- */
  function field(label, node) {
    return h("div", { class: "ewlr-field" }, h("h4", null, label), node);
  }
  function lessonChip(l) {
    return h(
      "button",
      {
        type: "button",
        class: "ewl-chip ewlr-chip",
        onclick: function () {
          view.lesson = l;
          view.entry = null;
          render(true);
        },
      },
      t("Lesson " + l, "Lección " + l),
    );
  }
  function sandboxButtons(e) {
    var row = h("div", { class: "ewl-row ewlr-actions" });
    row.appendChild(
      h(
        "a",
        { class: "ewl-btn", "data-primary": "", href: R.sandboxUrl(e) },
        t("Launch in Sandbox", "Abrir en el Taller"),
      ),
    );
    var m = EWL.integration && EWL.integration.lessons;
    var hit = m
      ? e.lessons.filter(function (l) {
          return m[l] && Array.isArray(m[l].canvas) && m[l].canvas.length;
        })[0]
      : null;
    if (hit)
      row.appendChild(
        h(
          "a",
          {
            class: "ewl-btn",
            href:
              "/curriculum/math-canvas/?scene=" +
              encodeURIComponent(m[hit].canvas[0]) +
              "&lesson=" +
              encodeURIComponent(hit),
          },
          t("Open in Living Math Canvas", "Abrir en el Lienzo matemático vivo"),
        ),
      );
    return row;
  }
  function detail(e) {
    var es = EWL.lang() === "es";
    if (EWL.state) EWL.state.addVocab(e.term, e.lessons[0]);
    var main = es
      ? [e.termEs, e.definitionEs, e.term, e.definition]
      : [e.term, e.definition, e.termEs, e.definitionEs];
    var kids = [
      h(
        "button",
        {
          type: "button",
          class: "ewl-btn ewlr-back",
          onclick: function () {
            view.entry = null;
            render(true);
          },
        },
        t("Back to the list", "Volver a la lista"),
      ),
      h(
        "div",
        { class: "ewlr-head" },
        R.icon(e.icon),
        h(
          "div",
          null,
          h("h3", { id: "ewlr-term" }, main[0]),
          h("p", { class: "ewlr-sub", lang: es ? "en" : "es" }, main[2]),
        ),
      ),
      field(t("What it means", "Qué significa"), h("p", null, main[1])),
      h("p", { class: "ewlr-other", lang: es ? "en" : "es" }, main[3]),
      field(t("Example", "Ejemplo"), h("p", null, e.example)),
    ];
    if (e.nonExample)
      kids.push(field(t("Not an example", "No es un ejemplo"), h("p", null, e.nonExample)));
    if (e.visual) kids.push(field(t("What it looks like", "Cómo se ve"), h("p", null, e.visual)));
    kids.push(
      field(t("Say it", "Dilo"), h("p", { class: "ewlr-frame" }, es ? e.frame.es : e.frame.en)),
      field(
        t("Taught in", "Se enseña en"),
        h("div", { class: "ewl-row" }, e.lessons.map(lessonChip)),
      ),
      sandboxButtons(e),
    );
    return kids;
  }
  function listView() {
    var found = R.search(data, view);
    var shown = found.slice(0, SHOW);
    var es = EWL.lang() === "es";
    var input = h("input", {
      id: "ewlr-q",
      class: "ewlr-q",
      type: "search",
      autocomplete: "off",
      value: view.q,
      placeholder: t("Try ratio, mean, or razón", "Prueba razón, media o ratio"),
      oninput: function (ev) {
        view.q = ev.target.value;
        var pos = ev.target.selectionStart;
        render(false);
        var again = ui.body.querySelector("#ewlr-q");
        again.focus();
        again.setSelectionRange(pos, pos);
      },
    });
    var status = h(
      "p",
      { class: "ewlr-status", role: "status", "aria-live": "polite" },
      found.length === 0
        ? t(
            "No words match. Try a shorter search.",
            "Ninguna palabra coincide. Prueba una búsqueda más corta.",
          )
        : t(
            found.length +
              " words" +
              (found.length > SHOW ? ". Showing the first " + SHOW + "." : ""),
            found.length +
              " palabras" +
              (found.length > SHOW ? ". Se muestran las primeras " + SHOW + "." : ""),
          ),
    );
    var filter = view.lesson
      ? h(
          "button",
          {
            type: "button",
            class: "ewl-chip ewlr-chip",
            "aria-pressed": "true",
            onclick: function () {
              view.lesson = null;
              render(true);
            },
          },
          t(
            "Only lesson " + view.lesson + ". Show all words",
            "Solo la lección " + view.lesson + ". Mostrar todas",
          ),
        )
      : null;
    return [
      h("label", { for: "ewlr-q", class: "ewlr-label" }, t("Search words", "Buscar palabras")),
      input,
      filter,
      status,
      h(
        "ul",
        { class: "ewlr-list" },
        shown.map(function (e) {
          return h(
            "li",
            null,
            h(
              "button",
              {
                type: "button",
                class: "ewlr-item",
                onclick: function () {
                  view.entry = e;
                  render(true);
                },
              },
              R.icon(e.icon),
              h(
                "span",
                null,
                h("strong", null, es ? e.termEs : e.term),
                h("span", { class: "ewlr-sub", lang: es ? "en" : "es" }, es ? e.term : e.termEs),
                h("span", { class: "ewlr-def" }, es ? e.definitionEs : e.definition),
              ),
            ),
          );
        }),
      ),
    ];
  }
  function render(focusFirst) {
    if (!ui || !data) return;
    EWL.clear(ui.body);
    var nodes = view.entry ? detail(view.entry) : listView();
    nodes.forEach(function (n) {
      if (n) ui.body.appendChild(n);
    });
    ui.body.scrollTop = 0;
    if (focusFirst) {
      var f = ui.body.querySelector(view.entry ? ".ewlr-back" : "#ewlr-q");
      if (f) f.focus();
    }
  }

  /* ----- the dialog ----- */
  function build() {
    var close = h(
      "button",
      { type: "button", class: "ewl-btn ewlr-close", onclick: R.close },
      t("Close", "Cerrar"),
    );
    var body = h("div", { class: "ewlr-body" });
    var panel = h(
      "div",
      {
        class: "ewlr-panel",
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": "ewlr-title",
      },
      h(
        "div",
        { class: "ewlr-bar" },
        h("h2", { id: "ewlr-title" }, t("Pocket Reference", "Guía de bolsillo")),
        close,
      ),
      body,
    );
    var root_ = h(
      "div",
      { class: "ewlr ewl-page", hidden: true },
      h("div", { class: "ewlr-backdrop", onclick: R.close }),
      panel,
    );
    document.body.appendChild(root_);
    ui = { root: root_, panel: panel, body: body };
    panel.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") {
        ev.stopPropagation();
        R.close();
      } else if (ev.key === "Tab") trap(ev);
    });
  }
  function trap(ev) {
    var f = Array.prototype.filter.call(
      ui.panel.querySelectorAll("a[href],button:not([disabled]),input:not([disabled])"),
      function (n) {
        return !n.closest("[hidden]");
      },
    );
    if (!f.length) return;
    var first = f[0];
    var last = f[f.length - 1];
    if (ev.shiftKey && document.activeElement === first) {
      ev.preventDefault();
      last.focus();
    } else if (!ev.shiftKey && document.activeElement === last) {
      ev.preventDefault();
      first.focus();
    }
  }
  R.isOpen = function () {
    return !!ui && !ui.root.hidden;
  };
  R.open = function (o) {
    o = o || {};
    if (!ui) build();
    view.opener = o.returnFocus || document.activeElement;
    view.lesson = o.lesson || null;
    view.q = o.q || "";
    view.entry = null;
    ui.root.hidden = false;
    document.documentElement.classList.add("ewlr-lock");
    ui.panel.setAttribute("tabindex", "-1");
    ui.panel.focus();
    EWL.clear(ui.body).appendChild(
      h("p", { role: "status" }, t("Loading words...", "Cargando palabras...")),
    );
    return load()
      .then(function () {
        if (o.term) {
          var w = R.norm(o.term);
          view.entry =
            data.filter(function (e) {
              return R.norm(e.term) === w || R.norm(e.termEs) === w;
            })[0] || null;
        }
        render(true);
      })
      .catch(function () {
        EWL.clear(ui.body).appendChild(
          h(
            "p",
            { class: "ewl-msg", "data-kind": "warn" },
            t(
              "The word list did not load. Check your connection and open it again.",
              "La lista de palabras no cargó. Revisa tu conexión y ábrela otra vez.",
            ),
          ),
        );
      });
  };
  R.close = function () {
    if (!R.isOpen()) return;
    ui.root.hidden = true;
    document.documentElement.classList.remove("ewlr-lock");
    var back = view.opener;
    view.opener = null;
    if (back && back.focus && document.contains(back)) back.focus();
    else if (R.fab) R.fab.focus();
  };
  /** True once the word list is loaded and a lesson has words (callers wanting a sync answer). */
  R.hasLesson = function (id) {
    return (
      !data ||
      data.some(function (e) {
        return e.lessons.indexOf(id) >= 0;
      })
    );
  };

  function onKey(ev) {
    if (ev.key === "Escape" && R.isOpen()) {
      ev.preventDefault();
      R.close();
      return;
    }
    var k = (ev.key || "").toLowerCase();
    var hub = onHub();
    var hit = hub
      ? ev.altKey && ev.code === "KeyK" && !ev.ctrlKey && !ev.metaKey
      : (ev.metaKey || ev.ctrlKey) && !ev.altKey && !ev.shiftKey && k === "k";
    if (!hit) return;
    if (!R.isOpen() && document.querySelector("dialog[open]")) return; // never fight another modal
    ev.preventDefault();
    if (R.isOpen()) R.close();
    else R.open({ returnFocus: document.activeElement });
  }
  function boot() {
    if (R.booted || !document.body) return;
    R.booted = true;
    var fab = h(
      "button",
      {
        type: "button",
        class: "ewlr-fab ewl-noprint",
        "aria-haspopup": "dialog",
        title: t(
          "Pocket Reference (" + shortcutLabel() + ")",
          "Guía de bolsillo (" + shortcutLabel() + ")",
        ),
        onclick: function () {
          R.open({ returnFocus: fab });
        },
      },
      t("Pocket Reference", "Guía de bolsillo"),
    );
    R.fab = fab;
    document.body.appendChild(fab);
    document.addEventListener("keydown", onKey);
    var q = new URLSearchParams(root.location.search);
    if (q.get("ref") === "open") R.open({ returnFocus: fab, q: q.get("q") || "" });
  }
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
  }

  EWL.selfTests.push({
    name: "reference: search finds a term in English and Spanish",
    run: function () {
      var d = [
        {
          term: "Ratio",
          termEs: "Razón",
          definition: "compare",
          definitionEs: "comparar",
          lessons: ["3-1"],
        },
      ];
      return (
        (R.search(d, { q: "razon" }).length === 1 && R.search(d, { q: "ratio" }).length === 1) ||
        "search failed"
      );
    },
  });
  EWL.selfTests.push({
    name: "reference: every icon draws",
    run: function () {
      return (
        R.iconKeys().every(function (k) {
          return R.icon(k).querySelector("title");
        }) || "an icon failed to draw"
      );
    },
  });
})(typeof window !== "undefined" ? window : globalThis);

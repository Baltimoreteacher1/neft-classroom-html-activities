/* Math Reality Lab shell (/curriculum/reality-lab/).
 *
 * Builds the header, the mode tabs (every mode registered with EWL.Lab.registerMode becomes a tab, first by `order`),
 * the Evidence Notebook, the teacher panel (?teacher=1) and the printable blank worksheet (?print=blank&inv=<id>).
 * Deep links: ?inv= ?mode= ?lesson= ?topic= ?lang=es ?seed=. Unknown values are ignored, never errors. ?diag=1 is
 * rendered by diag.js, which this page loads last.
 *
 * A mode that throws while mounting shows a calm message in its own panel; the other modes and the notebook keep working.
 */
(function (root) {
  "use strict";
  var EWL = (root.EWL = root.EWL || {});
  var DATA_URL = "/data/ewl/investigations.json";

  function qs() {
    try {
      return new URLSearchParams(root.location.search);
    } catch (_e) {
      return new URLSearchParams("");
    }
  }
  function langHref(lang) {
    var q = qs();
    q.set("lang", lang);
    return "?" + q.toString();
  }
  function setUrl(key, val) {
    try {
      var q = qs();
      q.set(key, val);
      root.history.replaceState(null, "", "?" + q.toString());
    } catch (_e) {
      /* file:// or sandboxed: the address bar simply does not update */
    }
  }

  function loadData() {
    return EWL.json(DATA_URL).then(function (doc) {
      EWL.LabData = doc;
      var titles = {};
      doc.investigations.forEach(function (i) {
        titles[EWL.id("lab", i.id)] = { en: i.title, es: i.titleEs };
      });
      doc.discourseTemplates.forEach(function (t) {
        titles[EWL.id("discourse", t.id)] = {
          en: "Argue it: " + t.title,
          es: "Argumenta: " + t.titleEs,
        };
      });
      EWL.Notebook.registerTitles(titles);
      return doc;
    });
  }

  function header() {
    var h = EWL.h;
    var other = EWL.lang() === "es" ? "en" : "es";
    return h(
      "header",
      { class: "lab-header" },
      h(
        "div",
        { class: "lab-wrap lab-header-row" },
        h(
          "div",
          {},
          h(
            "h1",
            { class: "lab-title" },
            EWL.t("Math Reality Lab", "Laboratorio de realidad matemática"),
          ),
          h(
            "p",
            { class: "lab-sub" },
            EWL.t(
              "Test ideas that sound right. Keep the proof in your notebook.",
              "Prueba ideas que suenan bien. Guarda la prueba en tu cuaderno.",
            ),
          ),
        ),
        h(
          "a",
          {
            class: "ewl-btn lab-lang",
            href: langHref(other),
            hreflang: other,
            lang: other,
            onclick: function () {
              try {
                root.localStorage.setItem("ewl_lang", other);
              } catch (_e) {
                /* ignore */
              }
            },
          },
          other === "es" ? "Español" : "English",
        ),
      ),
    );
  }

  /* WAI-ARIA tabs: arrow keys, Home and End move focus and activate. */
  function tabs(panelHost, ctx, start) {
    var h = EWL.h;
    var modes = EWL.Lab.modes();
    var list = h("div", {
      class: "lab-tabs",
      role: "tablist",
      "aria-label": EWL.t("Ways to work", "Maneras de trabajar"),
    });
    var panel = h("div", { class: "lab-panel", role: "tabpanel", tabindex: "-1" });
    panelHost.appendChild(list);
    panelHost.appendChild(panel);
    var live = null;
    var btns = [];
    function select(id, focus) {
      var m = EWL.Lab.mode(id) || modes[0];
      if (!m) return;
      if (live && live.destroy) {
        try {
          live.destroy();
        } catch (_e) {
          /* a mode that fails to clean up must not block the next one */
        }
      }
      EWL.clear(panel);
      btns.forEach(function (b) {
        var on = b.getAttribute("data-mode") === m.id;
        b.setAttribute("aria-selected", on ? "true" : "false");
        b.setAttribute("tabindex", on ? "0" : "-1");
        if (on && focus) b.focus();
      });
      panel.setAttribute("aria-labelledby", "lab-tab-" + m.id);
      panel.setAttribute("id", "lab-panel");
      panel.setAttribute("data-mode", m.id);
      panel.appendChild(
        h("p", { class: "lab-mode-blurb" }, EWL.t(m.blurb || "", m.blurbEs || m.blurb || "")),
      );
      var body = h("div", { class: "lab-mode-body" });
      panel.appendChild(body);
      setUrl("mode", m.id);
      try {
        live = m.mount(body, ctx);
      } catch (e) {
        live = null;
        body.appendChild(
          EWL.LabUI.msg(
            "bad",
            EWL.t(
              "This part of the lab could not start. Try another tab, or reload the page.",
              "Esta parte del laboratorio no pudo iniciar. Prueba otra pestaña o recarga la página.",
            ),
          ),
        );
        if (root.console) root.console.error("EWL.Lab mode " + m.id, e);
      }
    }
    modes.forEach(function (m) {
      var b = h(
        "button",
        {
          type: "button",
          role: "tab",
          class: "lab-tab",
          id: "lab-tab-" + m.id,
          "data-mode": m.id,
          "aria-controls": "lab-panel",
          "aria-selected": "false",
          tabindex: "-1",
        },
        EWL.t(m.title, m.titleEs || m.title),
      );
      b.addEventListener("click", function () {
        select(m.id, false);
      });
      b.addEventListener("keydown", function (e) {
        var i = btns.indexOf(b);
        var j =
          e.key === "ArrowRight"
            ? i + 1
            : e.key === "ArrowLeft"
              ? i - 1
              : e.key === "Home"
                ? 0
                : e.key === "End"
                  ? btns.length - 1
                  : -1;
        if (j < 0) return;
        e.preventDefault();
        select(btns[(j + btns.length) % btns.length].getAttribute("data-mode"), true);
      });
      btns.push(b);
      list.appendChild(b);
    });
    select(start, false);
  }

  function notebookSection(teacher) {
    var h = EWL.h;
    var sec = h("section", { class: "lab-notebook lab-wrap", "aria-labelledby": "lab-nb-h" });
    var body = h("div", { class: "lab-nb-body", id: "lab-nb-body" });
    var count = h("span", { class: "lab-badge" });
    var open = teacher;
    var toggle = h("button", {
      type: "button",
      class: "ewl-btn lab-nb-toggle ewl-noprint",
      "aria-expanded": open ? "true" : "false",
      "aria-controls": "lab-nb-body",
    });
    function paint() {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.textContent = open ? EWL.t("Hide", "Ocultar") : EWL.t("Open", "Abrir");
      body.hidden = !open;
    }
    toggle.addEventListener("click", function () {
      open = !open;
      paint();
    });
    function tally() {
      var n = EWL.Notebook.groups(EWL.state.get()).reduce(function (s, g) {
        return s + g.entries.length;
      }, 0);
      count.textContent = String(n);
    }
    sec.appendChild(
      h(
        "div",
        { class: "lab-nb-head" },
        h(
          "h2",
          { id: "lab-nb-h", class: "lab-h2" },
          teacher
            ? EWL.t(
                "Teacher view: evidence on this device",
                "Vista de la maestra: evidencia en este dispositivo",
              )
            : EWL.t("My Evidence Notebook", "Mi Cuaderno de evidencia"),
          " ",
          count,
        ),
        toggle,
      ),
    );
    sec.appendChild(body);
    EWL.Notebook.mount(body, {
      store: EWL.state,
      teacher: teacher,
      onPrint: function () {
        open = true;
        paint();
        EWL.NotebookPrint.printWith("lab-print-notebook");
      },
    });
    EWL.state.subscribe(tally);
    tally();
    paint();
    return sec;
  }

  function blankPage(rootEl, data, id) {
    var h = EWL.h;
    var inv =
      data &&
      data.investigations.filter(function (x) {
        return x.id === id;
      })[0];
    var tpl =
      inv &&
      data.discourseTemplates.filter(function (x) {
        return x.id === inv.discourse;
      })[0];
    document.body.classList.add("lab-blank");
    if (!inv) {
      rootEl.appendChild(
        h(
          "main",
          { class: "lab-wrap" },
          EWL.LabUI.msg(
            "warn",
            EWL.t(
              "That worksheet was not found. Open the Reality Lab and pick an investigation.",
              "No se encontró esa hoja. Abre el Laboratorio y elige una investigación.",
            ),
          ),
        ),
      );
      return;
    }
    rootEl.appendChild(
      h(
        "main",
        { class: "lab-wrap", id: "lab-main" },
        h(
          "div",
          { class: "lab-blank-bar ewl-noprint" },
          EWL.LabUI.btn(
            EWL.t("Print this worksheet", "Imprimir esta hoja"),
            function () {
              root.print();
            },
            { primary: true },
          ),
          h(
            "a",
            { class: "ewl-btn", href: "?" },
            EWL.t("Back to the lab", "Volver al laboratorio"),
          ),
        ),
        EWL.NotebookPrint.blank(inv, tpl),
      ),
    );
  }

  function boot() {
    var h = EWL.h;
    var mountEl = document.getElementById("lab-root");
    if (!mountEl) return;
    var params = qs();
    document.documentElement.lang = EWL.lang();
    try {
      EWL.state.hydrateFromUrl(root.location.search);
    } catch (_e) {
      /* a bad link never stops the page */
    }
    var flags = EWL.flags();
    EWL.clear(mountEl);
    if (EWL.LabInvestigate) EWL.LabInvestigate.register();
    if (EWL.DiscourseMode) EWL.DiscourseMode.register();
    var loaded = loadData().catch(function (e) {
      if (root.console) root.console.error("EWL.Lab data", e);
      return null;
    });
    mountEl.appendChild(
      h(
        "a",
        { class: "lab-skip ewl-noprint", href: "#lab-main" },
        EWL.t("Skip to the lab", "Saltar al laboratorio"),
      ),
    );
    loaded.then(function (data) {
      if (params.get("print") === "blank") return blankPage(mountEl, data, params.get("inv"));
      mountEl.appendChild(header());
      var main = h("div", { class: "lab-wrap lab-main", id: "lab-main", tabindex: "-1" });
      mountEl.appendChild(main);
      if (!data)
        main.appendChild(
          EWL.LabUI.msg(
            "warn",
            EWL.t(
              "The investigations could not be loaded, so Investigate is not available. The other tabs and your notebook still work.",
              "No se pudieron cargar las investigaciones, así que Investigar no está disponible. Las otras pestañas y tu cuaderno siguen funcionando.",
            ),
          ),
        );
      var ctx = EWL.Lab.context(params);
      var first = EWL.Lab.modes()[0];
      var want = params.get("mode");
      var start =
        want && EWL.Lab.mode(want)
          ? want
          : params.get("inv") && EWL.Lab.mode("investigate")
            ? "investigate"
            : first && first.id;
      if (first) tabs(main, ctx, start);
      else
        main.appendChild(
          EWL.LabUI.msg(
            "warn",
            EWL.t("No lab modes are loaded.", "No hay modos del laboratorio cargados."),
          ),
        );
      mountEl.appendChild(notebookSection(flags.teacher));
      mountEl.setAttribute("data-ewl-lab", "ready");
    });
  }

  EWL.LabShell = { boot: boot };
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
  }
})(typeof window !== "undefined" ? window : globalThis);

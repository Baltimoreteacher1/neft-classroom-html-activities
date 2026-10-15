/* EWL.Notebook — the Evidence Notebook: everything this device saved with EWLStateStore.addEvidence, from every activity.
 *
 *   Notebook.groups(state)              -> [{id, kind, slug, entries:[{idx, ...entry}]}]   newest activity first
 *   Notebook.title(id)                  -> display title (registered titles, else a readable form of the slug)
 *   Notebook.registerTitles({id:{en,es}})
 *   Notebook.toText(groups)             -> plain text for "Copy as text"
 *   Notebook.mount(host, {store, teacher, onPrint}) -> {refresh(), destroy()}   filter, delete one entry, print, copy
 *
 * An entry is {at, step?, claim?, prediction?, data?, argument?, revised?, ok?, rule?, note?}. Any subset renders. Student text
 * is only ever added as text nodes. Nothing here leaves the device: "Copy as text" and "Print" are the student's own actions.
 */
(function (root) {
  "use strict";
  var EWL = (root.EWL = root.EWL || {});
  EWL.selfTests = EWL.selfTests || [];

  var KIND_LABEL = {
    lab: ["Investigation", "Investigación"],
    forge: ["Counterexample Forge", "Fragua de contraejemplos"],
    invariant: ["Invariant Hunter", "Cazador de invariantes"],
    discourse: ["Executable Discourse", "Discurso ejecutable"],
    sketch: ["Sketch", "Boceto"],
    canvas: ["Math Canvas", "Lienzo matemático"],
    fluency: ["Fluency", "Fluidez"],
    lens: ["Lens", "Lente"],
    reference: ["Pocket Reference", "Referencia de bolsillo"],
  };
  var STEP_LABEL = {
    claim: ["Claim", "Afirmación"],
    prediction: ["Prediction", "Predicción"],
    evidence: ["Evidence", "Evidencia"],
    argument: ["Argument", "Argumento"],
    challenge: ["Challenge", "Desafío"],
    revision: ["Revision", "Revisión"],
    transfer: ["Transfer", "Transferencia"],
  };
  var titles = {};

  function tr(p) {
    return EWL.t(p[0], p[1]);
  }
  function registerTitles(map) {
    Object.keys(map).forEach(function (k) {
      titles[k] = map[k];
    });
  }
  function parts(id) {
    var m = /^ewl\.([a-z]+)\.(.+)$/.exec(id);
    return m ? { kind: m[1], slug: m[2] } : { kind: "other", slug: id };
  }
  function title(id) {
    if (titles[id]) return EWL.t(titles[id].en, titles[id].es);
    var p = parts(id);
    var words = p.slug.replace(/-/g, " ");
    return words.charAt(0).toUpperCase() + words.slice(1);
  }
  function kindLabel(kind) {
    return KIND_LABEL[kind] ? tr(KIND_LABEL[kind]) : kind;
  }

  function groups(state) {
    var ev = (state && state.evidence) || {};
    return Object.keys(ev)
      .filter(function (id) {
        return Array.isArray(ev[id]) && ev[id].length;
      })
      .map(function (id) {
        var p = parts(id);
        return {
          id: id,
          kind: p.kind,
          slug: p.slug,
          entries: ev[id].map(function (e, idx) {
            return Object.assign({ idx: idx }, e);
          }),
        };
      })
      .sort(function (a, b) {
        return last(b) - last(a);
      });
  }
  function last(g) {
    return g.entries.reduce(function (m, e) {
      return Math.max(m, e.at || 0);
    }, 0);
  }
  function when(at) {
    if (!at) return "";
    try {
      return new Date(at).toLocaleString(EWL.lang() === "es" ? "es" : "en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch (e) {
      return new Date(at).toISOString().slice(0, 16).replace("T", " ");
    }
  }
  function ruleName(id) {
    var r = EWL.Reason && EWL.Reason.ruleFor(id);
    return r ? EWL.t(r.name, r.nameEs) : id;
  }
  function dataText(d) {
    if (typeof d === "string") return d;
    if (!Array.isArray(d)) return "";
    return d
      .map(function (row) {
        if (Array.isArray(row))
          return row
            .map(function (c) {
              return c.label + " " + c.value;
            })
            .join(", ");
        return String(row);
      })
      .join("\n");
  }
  /** [[label, text]] for every field the entry has, in reading order. */
  function fields(e) {
    var out = [];
    if (e.claim) out.push([EWL.t("Claim", "Afirmación"), String(e.claim)]);
    if (e.prediction) out.push([EWL.t("Prediction", "Predicción"), String(e.prediction)]);
    if (e.data && dataText(e.data)) out.push([EWL.t("Data", "Datos"), dataText(e.data)]);
    if (e.argument) out.push([EWL.t("Argument", "Argumento"), String(e.argument)]);
    if (e.revised) out.push([EWL.t("Revised claim", "Afirmación revisada"), String(e.revised)]);
    if (e.ok === true || e.ok === false)
      out.push([
        EWL.t("Checked", "Comprobado"),
        e.ok ? EWL.t("Correct", "Correcto") : EWL.t("Not yet", "Todavía no"),
      ]);
    if (e.rule) out.push([EWL.t("Idea to revisit", "Idea para repasar"), ruleName(e.rule)]);
    if (e.note) out.push([EWL.t("Note", "Nota"), String(e.note)]);
    return out;
  }
  function toText(gs) {
    var lines = [
      EWL.t(
        "EduWonderLab Evidence Notebook (this device)",
        "Cuaderno de evidencia de EduWonderLab (este dispositivo)",
      ),
      "",
    ];
    gs.forEach(function (g) {
      lines.push("## " + title(g.id) + " [" + g.id + "]");
      g.entries.forEach(function (e) {
        lines.push(
          "- " + when(e.at) + (e.step && STEP_LABEL[e.step] ? " · " + tr(STEP_LABEL[e.step]) : ""),
        );
        fields(e).forEach(function (f) {
          lines.push("  " + f[0] + ": " + f[1].replace(/\n/g, "; "));
        });
      });
      lines.push("");
    });
    return lines.join("\n");
  }

  function entryNode(e, onDelete) {
    var h = EWL.h;
    var dl = h("dl", { class: "nb-fields" });
    fields(e).forEach(function (f) {
      dl.appendChild(h("dt", {}, f[0]));
      var dd = h("dd", {});
      f[1].split("\n").forEach(function (line, i) {
        if (i) dd.appendChild(h("br"));
        dd.appendChild(document.createTextNode(line));
      });
      dl.appendChild(dd);
    });
    return h(
      "li",
      { class: "nb-entry" },
      h(
        "div",
        { class: "nb-entry-head" },
        h("span", { class: "nb-when" }, when(e.at)),
        e.step && STEP_LABEL[e.step]
          ? h("span", { class: "nb-step" }, tr(STEP_LABEL[e.step]))
          : null,
        onDelete
          ? h(
              "button",
              {
                type: "button",
                class: "ewl-btn lab-small nb-del ewl-noprint",
                "aria-label": EWL.t("Delete this entry", "Borrar esta entrada"),
                onclick: onDelete,
              },
              EWL.t("Delete", "Borrar"),
            )
          : null,
      ),
      dl,
    );
  }

  function mount(host, opts) {
    var h = EWL.h;
    opts = opts || {};
    var store = opts.store || EWL.state;
    var filter = { kind: "", text: "" };
    var list = h("div", { class: "nb-list" });
    var status = h("p", { class: "lab-muted", role: "status" });
    var kindSel = h("select", {
      id: "nb-kind",
      class: "lab-select",
      onchange: function () {
        filter.kind = kindSel.value;
        refresh();
      },
    });
    var search = h("input", {
      id: "nb-search",
      class: "lab-num",
      type: "search",
      style: "width:14em",
      oninput: function () {
        filter.text = search.value.toLowerCase();
        refresh();
      },
    });

    function copy(text) {
      var done = function () {
        status.textContent = EWL.t(
          "Copied. You can paste it into a document.",
          "Copiado. Puedes pegarlo en un documento.",
        );
      };
      var fail = function () {
        status.textContent = EWL.t(
          "Your browser did not allow copying. Select the text and copy it yourself.",
          "Tu navegador no permitió copiar. Selecciona el texto y cópialo tú.",
        );
        var ta = h("textarea", {
          class: "lab-textarea",
          rows: 8,
          readonly: "readonly",
          "aria-label": EWL.t("Notebook text", "Texto del cuaderno"),
        });
        ta.value = text;
        list.insertBefore(ta, list.firstChild);
        ta.select();
      };
      if (root.navigator && root.navigator.clipboard)
        root.navigator.clipboard.writeText(text).then(done, fail);
      else fail();
    }
    function visible() {
      return groups(store.get())
        .filter(function (g) {
          return !filter.kind || g.kind === filter.kind;
        })
        .map(function (g) {
          if (!filter.text) return g;
          var hit = g.entries.filter(function (e) {
            return (
              (
                title(g.id) +
                " " +
                fields(e)
                  .map(function (f) {
                    return f[1];
                  })
                  .join(" ")
              )
                .toLowerCase()
                .indexOf(filter.text) >= 0
            );
          });
          return Object.assign({}, g, { entries: hit });
        })
        .filter(function (g) {
          return g.entries.length;
        });
    }
    function refresh() {
      var all = groups(store.get());
      var kinds = [];
      all.forEach(function (g) {
        if (kinds.indexOf(g.kind) < 0) kinds.push(g.kind);
      });
      EWL.clear(kindSel);
      kindSel.appendChild(
        h("option", { value: "" }, EWL.t("All activities", "Todas las actividades")),
      );
      kinds.forEach(function (k) {
        var o = h("option", { value: k }, kindLabel(k));
        if (k === filter.kind) o.selected = true;
        kindSel.appendChild(o);
      });
      EWL.clear(list);
      var gs = visible();
      if (!gs.length)
        list.appendChild(
          h(
            "p",
            { class: "lab-muted" },
            all.length
              ? EWL.t("Nothing matches that filter.", "Nada coincide con ese filtro.")
              : EWL.t(
                  "Your notebook is empty. Evidence you save in any lab shows up here.",
                  "Tu cuaderno está vacío. La evidencia que guardes en cualquier laboratorio aparece aquí.",
                ),
          ),
        );
      if (opts.teacher && EWL.NotebookPrint) list.appendChild(EWL.NotebookPrint.summary(all));
      gs.forEach(function (g) {
        list.appendChild(
          h(
            "section",
            { class: "nb-activity", "aria-label": title(g.id) },
            h("h3", {}, title(g.id)),
            h(
              "p",
              { class: "lab-muted" },
              kindLabel(g.kind) +
                " · " +
                g.entries.length +
                " " +
                EWL.t(
                  g.entries.length === 1 ? "entry" : "entries",
                  g.entries.length === 1 ? "entrada" : "entradas",
                ),
            ),
            h(
              "ol",
              { class: "nb-entries" },
              g.entries
                .slice()
                .reverse()
                .map(function (e) {
                  return entryNode(e, function () {
                    store.update(function (s) {
                      s.evidence[g.id].splice(e.idx, 1);
                      if (!s.evidence[g.id].length) delete s.evidence[g.id];
                    });
                    EWL.announce(EWL.t("Entry deleted", "Entrada borrada"));
                  });
                }),
            ),
          ),
        );
      });
    }
    var bar = h(
      "div",
      { class: "nb-bar ewl-noprint" },
      h("label", { for: "nb-kind", class: "lab-label" }, EWL.t("Show", "Mostrar")),
      kindSel,
      h("label", { for: "nb-search", class: "lab-label" }, EWL.t("Find", "Buscar")),
      search,
      EWL.LabUI.btn(EWL.t("Print", "Imprimir"), function () {
        if (opts.onPrint) opts.onPrint();
        else root.print();
      }),
      EWL.LabUI.btn(EWL.t("Copy as text", "Copiar como texto"), function () {
        copy(toText(visible()));
      }),
      opts.teacher
        ? EWL.LabUI.btn(EWL.t("Copy summary", "Copiar resumen"), function () {
            copy(EWL.NotebookPrint.summaryText(groups(store.get())));
          })
        : null,
    );
    host.appendChild(h("div", { class: "nb" }, bar, status, list));
    var off = store.subscribe(refresh);
    refresh();
    return {
      refresh: refresh,
      destroy: function () {
        off();
        EWL.clear(host);
      },
    };
  }

  EWL.Notebook = {
    groups: groups,
    title: title,
    kindLabel: kindLabel,
    registerTitles: registerTitles,
    toText: toText,
    fields: fields,
    mount: mount,
    ruleName: ruleName,
    when: when,
    STEP_LABEL: STEP_LABEL,
  };

  EWL.selfTests.push({
    name: "notebook: groups every activity, renders any subset, text export names the activity",
    run: function () {
      var st = {
        evidence: {
          "ewl.lab.discount-stack": [
            { at: 2, claim: "x", step: "evidence" },
            { at: 3, note: "n" },
          ],
          "ewl.forge.bot-1": [{ at: 1, ok: true }],
          "ewl.lab.empty": [],
        },
      };
      var gs = groups(st);
      if (gs.length !== 2 || gs[0].id !== "ewl.lab.discount-stack")
        return "grouping or order wrong";
      return /Discount stack/.test(toText(gs)) && /ewl\.forge\.bot-1/.test(toText(gs))
        ? true
        : "text export wrong";
    },
  });
})(typeof window !== "undefined" ? window : globalThis);

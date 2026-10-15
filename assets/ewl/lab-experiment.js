/* EWL.LabExperiment — the parametric experiment a student runs: controls, a Run button, a picture, a data table.
 *
 *   LabExperiment.mount(host, inv, opts) -> {rows(), setCase(c), destroy()}
 *     opts.rows     rows already in the table (restored draft)           opts.onRun(row, rows)  after each run
 *     opts.maxRows  default 14                                           opts.fixed             params locked to these values
 *   LabExperiment.controls(inv, caseVals, free, onChange) -> {el, get()}   only the listed params (used by the Challenge)
 *   LabExperiment.rowTable(inv, rows, opts) -> table node (opts.selected: Set of row n, opts.select(n, on))
 *
 * A row is plain data: {n, case:{param: display text | option id}, cells:[{label,value}], holds:boolean}.
 */
(function (root) {
  "use strict";
  var EWL = (root.EWL = root.EWL || {});
  var U = function () {
    return EWL.LabUI;
  };
  var sim = function () {
    return EWL.LabSim;
  };

  function key(inv, c) {
    return inv.params
      .map(function (p) {
        return String(c[p.id]);
      })
      .join("|");
  }

  /** Controls for the given params; returns the current case or null when a field is not a valid number. */
  function controls(inv, start, free, onChange) {
    var h = EWL.h;
    var fields = {};
    var el = h("div", { class: "lab-controls" });
    free.forEach(function (id) {
      var p = sim().param(inv, id);
      if (p.kind === "choice") {
        var opts = p.options.map(function (o) {
          return { id: o.id, label: EWL.t(o.label, o.labelEs) };
        });
        if (opts.length > 4) {
          var sel = h(
            "select",
            {
              id: "lab-sel-" + id,
              class: "lab-select",
              onchange: function () {
                if (onChange) onChange();
              },
            },
            opts.map(function (o) {
              return h(
                "option",
                { value: o.id, selected: o.id === start[id] ? "selected" : null },
                o.label,
              );
            }),
          );
          sel.value = start[id];
          fields[id] = {
            value: function () {
              return sel.value;
            },
            set: function (v) {
              sel.value = v;
            },
          };
          el.appendChild(
            h(
              "div",
              { class: "lab-field" },
              h("label", { class: "lab-label", for: "lab-sel-" + id }, EWL.t(p.label, p.labelEs)),
              sel,
            ),
          );
        } else {
          var grp = U().chips(id, EWL.t(p.label, p.labelEs), opts, start[id], function () {
            if (onChange) onChange();
          });
          fields[id] = {
            value: grp.value,
            set: function (v) {
              var inp = grp.el.querySelector('input[value="' + v + '"]');
              if (inp) {
                inp.checked = true;
                inp.dispatchEvent(new Event("change"));
              }
            },
          };
          el.appendChild(grp.el);
        }
      } else {
        var st = U().stepper(
          {
            id: id,
            label: EWL.t(p.label, p.labelEs),
            min: p.min,
            max: p.max,
            step: p.step,
            value: start[id],
            unit: p.unit,
          },
          function () {
            if (onChange) onChange();
          },
        );
        fields[id] = st;
        el.appendChild(st.el);
      }
    });
    return {
      el: el,
      fields: fields,
      get: function () {
        var c = Object.assign({}, start);
        for (var i = 0; i < free.length; i++) {
          var val = fields[free[i]].value();
          if (val === null) return null;
          c[free[i]] = val;
        }
        return c;
      },
      set: function (c) {
        free.forEach(function (id) {
          if (c[id] !== undefined) fields[id].set(String(c[id]));
        });
      },
    };
  }

  function rowTable(inv, rows, opts) {
    opts = opts || {};
    var cols = inv.table.map(function (id) {
      return { id: id, label: sim().column(inv, id).label };
    });
    cols.push({ id: "holds", label: EWL.t("Claim holds?", "¿Se cumple la afirmación?") });
    var data = rows.map(function (r) {
      return {
        flag: r.holds ? "ok" : "bad",
        selected: opts.selected && opts.selected.indexOf(r.n) >= 0,
        cells: r.cells
          .map(function (c) {
            return c.value;
          })
          .concat([(r.holds ? "✓ " : "✗ ") + (r.holds ? EWL.t("yes", "sí") : EWL.t("no", "no"))]),
      };
    });
    return U().table(cols, data, {
      label: EWL.t("Your experiment results", "Resultados de tu experimento"),
      select: opts.select
        ? function (i, on) {
            opts.select(rows[i].n, on);
          }
        : null,
    });
  }

  function mount(host, inv, opts) {
    var h = EWL.h;
    opts = opts || {};
    var maxRows = opts.maxRows || 14;
    var rows = (opts.rows || []).slice();
    var start = Object.assign(sim().defaults(inv), inv.prediction.setup, opts.fixed || {});
    var free = inv.params
      .map(function (p) {
        return p.id;
      })
      .filter(function (id) {
        return !opts.fixed || opts.fixed[id] === undefined;
      });
    var ctl = controls(inv, start, free);
    var figure = h(
      "div",
      { class: "lab-figure", "aria-live": "polite" },
      h(
        "p",
        { class: "lab-muted" },
        EWL.t(
          "Set the numbers, then press Run. The picture shows your latest run.",
          "Elige los números y presiona Ejecutar. La imagen muestra tu última ejecución.",
        ),
      ),
    );
    var tableHost = h("div", { class: "lab-table-host" });
    var note = h("div", { class: "lab-note", role: "status" });
    var runBtn = U().btn(EWL.t("Run experiment", "Ejecutar experimento"), run, { primary: true });
    var clearBtn = U().btn(EWL.t("Clear table", "Borrar tabla"), function () {
      rows = [];
      draw();
      EWL.announce(EWL.t("Table cleared", "Tabla borrada"));
      if (opts.onRun) opts.onRun(null, rows);
    });

    function draw(latest) {
      EWL.clear(tableHost);
      if (rows.length) tableHost.appendChild(rowTable(inv, rows));
      else
        tableHost.appendChild(
          h(
            "p",
            { class: "lab-muted" },
            EWL.t(
              "Your data table is empty. Each run adds a row.",
              "Tu tabla de datos está vacía. Cada ejecución agrega una fila.",
            ),
          ),
        );
      if (latest) {
        EWL.clear(figure);
        var alt =
          EWL.t(inv.title, inv.titleEs) + ". " + sim().describe(inv, latest.case, latest.values);
        figure.appendChild(EWL.LabFigure.draw(inv, latest.values, alt));
        figure.appendChild(h("p", { class: "lab-caption" }, alt));
      }
    }
    function run() {
      var c = ctl.get();
      if (!c) {
        EWL.clear(note);
        note.appendChild(
          U().msg(
            "warn",
            EWL.t(
              "One of the numbers is not valid yet. Check the boxes marked in red.",
              "Uno de los números todavía no es válido. Revisa los cuadros marcados en rojo.",
            ),
          ),
        );
        return;
      }
      var res;
      try {
        res = sim().run(inv, c);
      } catch (e) {
        EWL.clear(note);
        note.appendChild(
          U().msg(
            "warn",
            EWL.t(
              "Those numbers cannot be used together. Try different ones.",
              "Esos números no se pueden usar juntos. Prueba otros.",
            ),
          ),
        );
        return;
      }
      EWL.clear(note);
      var dup = rows.filter(function (r) {
        return key(inv, r.case) === key(inv, c);
      })[0];
      if (dup) {
        note.appendChild(
          U().msg(
            "",
            EWL.t(
              "That setup is already in your table (row " + dup.n + "). Try different numbers.",
              "Esa configuración ya está en tu tabla (fila " + dup.n + "). Prueba otros números.",
            ),
          ),
        );
        draw({ case: c, values: res.values });
        return;
      }
      if (rows.length >= maxRows) {
        note.appendChild(
          U().msg(
            "warn",
            EWL.t(
              "The table is full. Clear it to start again.",
              "La tabla está llena. Bórrala para empezar de nuevo.",
            ),
          ),
        );
        return;
      }
      var row = {
        n: (rows.length ? rows[rows.length - 1].n : 0) + 1,
        case: c,
        cells: sim().rowData(inv, c, res.values),
        holds: res.holds,
      };
      rows.push(row);
      draw({ case: c, values: res.values });
      EWL.announce(
        EWL.t(
          "Run " + row.n + " added to the table.",
          "Ejecución " + row.n + " agregada a la tabla.",
        ),
      );
      if (opts.onRun) opts.onRun(row, rows);
    }
    draw();
    host.appendChild(
      h(
        "div",
        { class: "lab-experiment" },
        h(
          "div",
          { class: "lab-exp-controls ewl-card" },
          ctl.el,
          h("div", { class: "ewl-row" }, runBtn, clearBtn),
          note,
        ),
        h("div", { class: "lab-exp-figure ewl-card" }, figure),
        h("div", { class: "lab-exp-table" }, tableHost),
      ),
    );
    return {
      rows: function () {
        return rows.slice();
      },
      setCase: function (c) {
        ctl.set(c);
      },
      destroy: function () {
        EWL.clear(host);
      },
    };
  }

  EWL.LabExperiment = { mount: mount, controls: controls, rowTable: rowTable, key: key };
})(typeof window !== "undefined" ? window : globalThis);

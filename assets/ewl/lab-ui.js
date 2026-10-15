/* EWL.LabUI — small accessible building blocks shared by the Reality Lab files (all DOM built with EWL.h, never innerHTML).
 *
 *   LabUI.msg(kind, text|nodes)                       a calm message box: kind "ok" | "warn" | "bad" | "" (also announces nothing)
 *   LabUI.chips(name, legend, options, value, onPick) radio group styled as chips -> {el, value()}   options: [{id, label}]
 *   LabUI.stepper(spec, onChange)                     number field with - / + buttons and a slider -> {el, value(), set(v), input}
 *                                                     spec: {id, label, min, max, step, value, unit}   values stay display text ("20")
 *   LabUI.table(columns, rows, opts)                  a real <table>: columns [{id,label}], rows [{cells:[text], selected?, flag?}]
 *   LabUI.btn(label, onclick, opts)                   .ewl-btn button; opts {primary, disabled, id}
 */
(function (root) {
  "use strict";
  var EWL = (root.EWL = root.EWL || {});
  var uid = 0;

  function h() {
    return EWL.h.apply(null, arguments);
  }
  function msg(kind, content) {
    return h(
      "div",
      { class: "ewl-msg", "data-kind": kind || null, role: kind === "bad" ? "alert" : null },
      content,
    );
  }
  function btn(label, onclick, opts) {
    opts = opts || {};
    return h(
      "button",
      {
        type: "button",
        class: "ewl-btn",
        "data-primary": opts.primary ? "1" : null,
        disabled: opts.disabled ? "disabled" : null,
        id: opts.id || null,
        onclick: onclick,
      },
      label,
    );
  }

  function chips(name, legend, options, value, onPick) {
    var current = value;
    var group = "lab-chips-" + ++uid;
    var fs = h("fieldset", { class: "lab-chips" }, h("legend", { class: "lab-legend" }, legend));
    var row = h("div", { class: "ewl-row" });
    options.forEach(function (o) {
      var id = group + "-" + o.id;
      var input = h("input", {
        type: "radio",
        name: group,
        id: id,
        value: o.id,
        class: "lab-chip-input",
      });
      if (o.id === current) input.checked = true;
      input.addEventListener("change", function () {
        current = o.id;
        if (onPick) onPick(o.id);
      });
      row.appendChild(
        h(
          "span",
          { class: "lab-chip-wrap" },
          input,
          h("label", { class: "ewl-chip lab-chip", for: id }, o.label),
        ),
      );
    });
    fs.appendChild(row);
    return {
      el: fs,
      value: function () {
        return current;
      },
    };
  }

  function stepper(spec, onChange) {
    var Rat = EWL.Rat;
    var id = "lab-num-" + ++uid;
    var prefix = spec.unit === "$" ? "$" : "";
    var suffix = spec.unit === "%" ? "%" : "";
    var input = h("input", {
      id: id,
      class: "lab-num",
      type: "text",
      inputmode: "decimal",
      autocomplete: "off",
      value: String(spec.value),
      "aria-describedby": id + "-hint",
    });
    var range = h("input", {
      type: "range",
      class: "lab-range",
      min: spec.min,
      max: spec.max,
      step: spec.step,
      value: spec.value,
      "aria-label": spec.label,
      tabindex: "-1",
    });
    var hint = h("span", { class: "lab-hint", id: id + "-hint" }, spec.min + " – " + spec.max);
    function valid(text) {
      var r = Rat.parse(String(text).replace(/[%$]/g, ""));
      return r && r.cmp(Rat.parse(spec.min)) >= 0 && r.cmp(Rat.parse(spec.max)) <= 0 ? r : null;
    }
    function set(text) {
      var r = valid(text);
      input.value = String(text);
      input.setAttribute("aria-invalid", r ? "false" : "true");
      hint.textContent = r
        ? spec.min + " – " + spec.max
        : EWL.t(
            "Pick a number from " + spec.min + " to " + spec.max,
            "Elige un número de " + spec.min + " a " + spec.max,
          );
      if (r) range.value = r.decimal().text;
      if (onChange) onChange(r ? input.value : null);
    }
    function nudge(dir) {
      var r = valid(input.value) || Rat.parse(spec.value);
      var next = r.add(Rat.parse(spec.step).mul(dir));
      if (next.cmp(Rat.parse(spec.min)) < 0) next = Rat.parse(spec.min);
      if (next.cmp(Rat.parse(spec.max)) > 0) next = Rat.parse(spec.max);
      set(next.decimal().text);
      EWL.announce(spec.label + " " + prefix + next.decimal().text + suffix);
    }
    input.addEventListener("input", function () {
      set(input.value);
    });
    range.addEventListener("input", function () {
      set(range.value);
    });
    var el = h(
      "div",
      { class: "lab-field" },
      h("label", { class: "lab-label", for: id }, spec.label),
      h(
        "div",
        { class: "lab-stepper" },
        h(
          "button",
          {
            type: "button",
            class: "ewl-btn lab-step-btn",
            "aria-label": EWL.t("Less: " + spec.label, "Menos: " + spec.label),
            onclick: function () {
              nudge(-1);
            },
          },
          "−",
        ),
        h("span", { class: "lab-affix" }, prefix),
        input,
        h("span", { class: "lab-affix" }, suffix),
        h(
          "button",
          {
            type: "button",
            class: "ewl-btn lab-step-btn",
            "aria-label": EWL.t("More: " + spec.label, "Más: " + spec.label),
            onclick: function () {
              nudge(1);
            },
          },
          "+",
        ),
      ),
      range,
      hint,
    );
    return {
      el: el,
      input: input,
      value: function () {
        return valid(input.value) ? input.value.trim() : null;
      },
      set: set,
    };
  }

  function table(columns, rows, opts) {
    opts = opts || {};
    var head = h(
      "tr",
      {},
      opts.select ? h("th", { scope: "col" }, EWL.t("Use", "Usar")) : null,
      columns.map(function (c) {
        return h("th", { scope: "col" }, c.label);
      }),
    );
    var body = rows.map(function (r, i) {
      var cb = null;
      if (opts.select) {
        cb = h(
          "td",
          {},
          h("input", {
            type: "checkbox",
            class: "lab-check",
            "aria-label": EWL.t(
              "Use row " + (i + 1) + " as evidence",
              "Usar la fila " + (i + 1) + " como evidencia",
            ),
            checked: r.selected ? "checked" : null,
            onchange: function (e) {
              opts.select(i, e.target.checked);
            },
          }),
        );
        if (r.selected) cb.firstChild.checked = true;
      }
      return h(
        "tr",
        { "data-flag": r.flag || null, class: r.selected ? "is-selected" : null },
        cb,
        r.cells.map(function (c) {
          return h("td", {}, c);
        }),
      );
    });
    return h(
      "div",
      {
        class: "lab-table-wrap",
        tabindex: "0",
        role: "region",
        "aria-label": opts.label || EWL.t("Data table", "Tabla de datos"),
      },
      h("table", { class: "lab-table" }, h("thead", {}, head), h("tbody", {}, body)),
    );
  }

  function words(s) {
    return String(s || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
  }
  function textArea(id, label, value, oninput, rows) {
    var ta = h("textarea", {
      id: id,
      class: "lab-textarea",
      rows: rows || 3,
      maxlength: 600,
      oninput: function () {
        oninput(ta.value);
      },
    });
    ta.value = value || "";
    return h("div", { class: "lab-field" }, h("label", { class: "lab-label", for: id }, label), ta);
  }
  function quote(inv) {
    return h(
      "blockquote",
      { class: "lab-claim" },
      h("p", {}, EWL.t(inv.claim.text, inv.claim.textEs)),
    );
  }

  EWL.LabUI = {
    words: words,
    textArea: textArea,
    quote: quote,
    msg: msg,
    btn: btn,
    chips: chips,
    stepper: stepper,
    table: table,
  };
})(typeof window !== "undefined" ? window : globalThis);

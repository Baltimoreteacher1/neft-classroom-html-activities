/* EWL.DiscourseBuild — the claim editor of the Executable Discourse composer, in three tiers.
 *
 *   DiscourseBuild.claimEditor(tpl, tier, initial, opts) -> {el, get(), set(claim)}
 *     get() -> {claim} when the claim is complete and readable, or {error} / {empty:true} when it is not
 *   Tier 1  chips:  [quantity] [relation] [quantity]            and an optional "when" chip row
 *   Tier 2  typed:  [quantity] [relation] [factor] × [quantity] + [number]    and a typed "when" number
 *   Tier 3  write:  a formula such as  q < a when b > 1          (parsed by EWL.DiscourseText.parseClaim, no eval)
 */
(function (root) {
  "use strict";
  var EWL = (root.EWL = root.EWL || {});
  var OPS = ["eq", "lt", "gt", "le", "ge", "ne"];
  var OP_SHORT = { eq: "=", ne: "≠", lt: "<", gt: ">", le: "≤", ge: "≥" };

  function names(tpl) {
    return EWL.Discourse.names(tpl);
  }
  function nameChips(tpl) {
    return names(tpl).map(function (n) {
      return { id: n.id, label: EWL.t(n.short, n.shortEs) };
    });
  }
  function opChips() {
    return OPS.map(function (o) {
      var w = EWL.DiscourseText.OP_WORDS[o];
      return { id: o, label: OP_SHORT[o] + "  " + EWL.t(w[0], w[1]) };
    });
  }
  function numberInput(label, value, onInput, width) {
    var id = "disc-n-" + Math.random().toString(36).slice(2, 8);
    var input = EWL.h("input", {
      id: id,
      class: "lab-num",
      type: "text",
      inputmode: "decimal",
      value: value,
      style: "width:" + (width || 5) + "em",
      oninput: function () {
        onInput(input.value);
      },
    });
    return EWL.h(
      "span",
      { class: "lab-inline-field" },
      EWL.h("label", { for: id, class: "lab-label" }, label),
      input,
    );
  }

  function claimEditor(tpl, tier, initial, opts) {
    var h = EWL.h;
    var U = EWL.LabUI;
    opts = opts || {};
    var allowWhen = opts.when !== false;
    var ids = names(tpl).map(function (n) {
      return n.id;
    });
    var st = {
      op: null,
      left: null,
      right: null,
      k: "1",
      c: "0",
      wid: "",
      wop: "gt",
      wval: "",
      text: "",
    };
    if (initial && initial.type === "claim") {
      if (typeof initial.left === "string") st.left = initial.left;
      if (typeof initial.right === "string") st.right = initial.right;
      st.op = initial.op;
    }
    var el = h("div", { class: "disc-claim" });
    var out = h("p", { class: "disc-preview", "aria-live": "polite" });
    var errBox = h("div", { class: "lab-note", role: "status" });

    function build() {
      if (tier === 3) {
        if (!st.text.trim()) return { empty: true };
        var p = EWL.DiscourseText.parseClaim(st.text, tpl);
        return p.error ? { error: p.error } : { claim: p.claim };
      }
      if (!st.left || !st.right || !st.op) return { empty: true };
      var right = st.right;
      if (tier === 2) {
        var kk = EWL.Rat.parse(st.k);
        var cc = EWL.Rat.parse(st.c);
        if (!kk || !cc)
          return {
            error: EWL.t("Type numbers in the two boxes.", "Escribe números en los dos cuadros."),
          };
        if (!kk.eq(1) || !cc.isZero()) {
          right = ["mul", String(st.k), st.right];
          if (!cc.isZero()) right = ["add", right, String(st.c)];
        }
      }
      var claim = { type: "claim", op: st.op, left: st.left, right: right };
      if (allowWhen && st.wid) {
        var wv = EWL.Rat.parse(st.wval);
        if (!wv)
          return {
            error: EWL.t('Type a number after "when".', 'Escribe un número después de "cuando".'),
          };
        claim.when = [st.wop, st.wid, String(st.wval)];
      }
      return { claim: claim };
    }
    function update() {
      var r = build();
      EWL.clear(errBox);
      EWL.clear(out);
      if (r.claim) {
        out.appendChild(h("strong", {}, EWL.t("My claim: ", "Mi afirmación: ")));
        out.appendChild(document.createTextNode(EWL.DiscourseText.claimText(r.claim, tpl) + "."));
      } else if (r.error) errBox.appendChild(U.msg("warn", r.error));
      if (opts.onChange) opts.onChange(r);
      return r;
    }

    if (tier === 3) {
      var fid = "disc-f-" + Math.random().toString(36).slice(2, 8);
      var input = h("input", {
        id: fid,
        class: "lab-formula",
        type: "text",
        autocomplete: "off",
        spellcheck: "false",
        placeholder: ids[ids.length - 1] + " < " + ids[0],
        value: initial && initial._text ? initial._text : "",
        oninput: function () {
          st.text = input.value;
          update();
        },
      });
      st.text = input.value;
      el.appendChild(
        h(
          "label",
          { class: "lab-label", for: fid },
          EWL.t(
            'Type your claim with the quantity names. You can add "when" and a condition.',
            'Escribe tu afirmación con los nombres de las cantidades. Puedes agregar "cuando" y una condición.',
          ),
        ),
      );
      el.appendChild(input);
      var insert = h(
        "div",
        { class: "ewl-row" },
        h("span", { class: "lab-muted" }, EWL.t("Names to use:", "Nombres para usar:")),
      );
      names(tpl).forEach(function (n) {
        insert.appendChild(
          h(
            "button",
            {
              type: "button",
              class: "ewl-chip lab-chip-btn",
              onclick: function () {
                input.value = (input.value + " " + n.id).trim() + " ";
                input.focus();
                st.text = input.value;
                update();
              },
            },
            n.id + " = " + EWL.t(n.short, n.shortEs),
          ),
        );
      });
      el.appendChild(insert);
    } else {
      var nc = nameChips(tpl);
      el.appendChild(
        U.chips("left", EWL.t("1. I claim that…", "1. Afirmo que…"), nc, st.left, function (v) {
          st.left = v;
          update();
        }).el,
      );
      el.appendChild(
        U.chips("op", EWL.t("2. …is…", "2. …es…"), opChips(), st.op, function (v) {
          st.op = v;
          update();
        }).el,
      );
      if (tier === 2) {
        el.appendChild(
          h(
            "div",
            { class: "disc-slots" },
            numberInput(EWL.t("times", "veces"), st.k, function (v) {
              st.k = v;
              update();
            }),
            h("span", { class: "lab-muted" }, "×"),
          ),
        );
      }
      el.appendChild(
        U.chips(
          "right",
          tier === 2 ? EWL.t("3. …this quantity…", "3. …esta cantidad…") : EWL.t("3. …", "3. …"),
          nc,
          st.right,
          function (v) {
            st.right = v;
            update();
          },
        ).el,
      );
      if (tier === 2)
        el.appendChild(
          h(
            "div",
            { class: "disc-slots" },
            h("span", { class: "lab-muted" }, "+"),
            numberInput(EWL.t("plus", "más"), st.c, function (v) {
              st.c = v;
              update();
            }),
          ),
        );
      if (allowWhen) {
        var vc = Object.keys(tpl.vars).map(function (k) {
          return {
            id: k,
            label: EWL.t(
              tpl.vars[k].short || tpl.vars[k].label,
              tpl.vars[k].shortEs || tpl.vars[k].labelEs,
            ),
          };
        });
        vc.unshift({ id: "", label: EWL.t("(always)", "(siempre)") });
        el.appendChild(
          U.chips(
            "when",
            EWL.t(
              "4. This is true when… (you can leave it as always)",
              "4. Esto es cierto cuando… (puedes dejarlo en siempre)",
            ),
            vc,
            st.wid,
            function (v) {
              st.wid = v;
              if (v && !st.wval) st.wval = tpl.vars[v].values[0];
              render();
            },
          ).el,
        );
        var whenRow = h("div", { class: "disc-when" });
        el.appendChild(whenRow);
      }
    }
    function render() {
      update();
      if (!allowWhen || tier === 3 || !el.querySelector(".disc-when")) return;
      var w = el.querySelector(".disc-when");
      EWL.clear(w);
      if (!st.wid) return;
      w.appendChild(
        U.chips(
          "wop",
          EWL.t("…is…", "…es…"),
          opChips().filter(function (o) {
            return o.id !== "ne";
          }),
          st.wop,
          function (v) {
            st.wop = v;
            update();
          },
        ).el,
      );
      if (tier === 1)
        w.appendChild(
          U.chips(
            "wval",
            EWL.t("…this value", "…este valor"),
            tpl.vars[st.wid].values.map(function (x) {
              return { id: x, label: x };
            }),
            st.wval,
            function (v) {
              st.wval = v;
              update();
            },
          ).el,
        );
      else
        w.appendChild(
          numberInput(EWL.t("value", "valor"), st.wval, function (v) {
            st.wval = v;
            update();
          }),
        );
    }
    el.appendChild(out);
    el.appendChild(errBox);
    update();
    return {
      el: el,
      get: function () {
        return build();
      },
    };
  }

  EWL.DiscourseBuild = { claimEditor: claimEditor, OP_SHORT: OP_SHORT };
})(typeof window !== "undefined" ? window : globalThis);

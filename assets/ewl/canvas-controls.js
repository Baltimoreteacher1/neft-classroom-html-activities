/* EWL.Canvas.controls — the Manipulate-stage controls (text, stepper, chips, actions) for one scene.
 *
 *   C.controls(scene, ctx) -> Element
 *     ctx = { params(), preset(), apply(ctl, raw) -> bool, setParams(next), focusKey? }
 * Each control writes through ctx.apply (which validates against what the Lens can draw), so a typed value the
 * pictures cannot show is refused with a plain sentence instead of a broken figure.
 */
(function (root) {
  "use strict";
  const EWL = (root.EWL = root.EWL || {});
  const C = (EWL.Canvas = EWL.Canvas || {});

  const hintFor = (ctl) =>
    ctl.validate === "ratio"
      ? EWL.t("Try a ratio like 3:5.", "Prueba una razón como 3:5.")
      : EWL.t("Try a number like 3/4, 0.75 or 75%.", "Prueba un número como 3/4, 0.75 o 75 %.");

  const label = (ctl) => EWL.t(ctl.label, ctl.labelEs);
  const optLabel = (ctl, o) => (o.label ? EWL.t(o.label, o.labelEs) : `${o.v}${ctl.unit || ""}`);

  function textControl(ctl, ctx) {
    const h = EWL.h;
    const id = `cv-${ctl.id}`;
    const note = h("p", { class: "cv-note", role: "status", "aria-live": "polite" });
    const input = h("input", {
      type: "text",
      id,
      class: "cv-input",
      autocomplete: "off",
      autocapitalize: "off",
      spellcheck: "false",
      placeholder: ctl.placeholder || "",
      "data-fk": ctl.id,
    });
    const go = () => {
      const raw = input.value.trim();
      if (!raw && ctl.param !== "test") return;
      note.textContent = ctx.apply(ctl, raw) ? "" : hintFor(ctl);
    };
    const form = h(
      "form",
      {
        class: "cv-ctl cv-text",
        onsubmit: (e) => {
          e.preventDefault();
          go();
        },
      },
      h("label", { for: id }, label(ctl)),
      h(
        "div",
        { class: "ewl-row" },
        input,
        h("button", { type: "submit", class: "ewl-btn" }, EWL.t("Show it", "Mostrarlo")),
      ),
      note,
    );
    return form;
  }

  function stepperControl(ctl, ctx) {
    const h = EWL.h;
    const val = Number(ctx.params()[ctl.param]);
    const bump = (d) => ctx.apply(ctl, Math.max(ctl.min, Math.min(ctl.max, val + d * ctl.step)));
    const btn = (d, sym, word) =>
      h(
        "button",
        {
          type: "button",
          class: "ewl-btn cv-step",
          "data-fk": `${ctl.id}${d}`,
          "aria-label": `${word} ${label(ctl)}`,
          disabled: (d < 0 && val <= ctl.min) || (d > 0 && val >= ctl.max) ? "" : null,
          onclick: () => bump(d),
        },
        sym,
      );
    return h(
      "div",
      { class: "cv-ctl cv-stepper", role: "group", "aria-label": label(ctl) },
      h("span", { class: "cv-ctl-label" }, label(ctl)),
      btn(-1, "−", EWL.t("Decrease", "Disminuir")),
      h("output", { class: "cv-value" }, `${val}${ctl.unit || ""}`),
      btn(1, "+", EWL.t("Increase", "Aumentar")),
    );
  }

  function chipsControl(ctl, ctx) {
    const h = EWL.h;
    const cur = String(ctx.params()[ctl.param]);
    const chips = ctl.options.map((o) =>
      h(
        "button",
        {
          type: "button",
          class: "ewl-chip",
          "data-fk": `${ctl.id}-${o.v}`,
          "aria-pressed": cur === String(o.v) ? "true" : "false",
          onclick: () => ctx.apply(ctl, o.v),
        },
        optLabel(ctl, o),
      ),
    );
    return h(
      "div",
      { class: "cv-ctl cv-chips", role: "group", "aria-label": label(ctl) },
      h("span", { class: "cv-ctl-label" }, label(ctl)),
      chips,
    );
  }

  function actionsControl(ctl, ctx, scene) {
    const h = EWL.h;
    const kind = C.kinds[scene.kind];
    const acts = kind.actions(ctx.params(), EWL.lang());
    const row = acts.map((a) =>
      h(
        "button",
        {
          type: "button",
          class: "ewl-btn",
          "data-fk": `act-${a.id}`,
          onclick: () => ctx.setParams(a.params),
        },
        a.label,
      ),
    );
    row.push(
      h(
        "button",
        {
          type: "button",
          class: "ewl-btn",
          "data-fk": "act-reset",
          onclick: () => ctx.setParams(kind.init(ctx.preset().params)),
        },
        EWL.t("Start over", "Empezar de nuevo"),
      ),
    );
    return h(
      "div",
      { class: "cv-ctl cv-actions-row", role: "group", "aria-label": label(ctl) },
      h("span", { class: "cv-ctl-label" }, label(ctl)),
      row,
    );
  }

  C.controls = (scene, ctx) => {
    const make = {
      text: textControl,
      stepper: stepperControl,
      chips: chipsControl,
      actions: actionsControl,
    };
    return EWL.h(
      "div",
      { class: "cv-controls" },
      scene.manipulate.controls.map((c) => make[c.type](c, ctx, scene)),
    );
  };
})(typeof window !== "undefined" ? window : globalThis);

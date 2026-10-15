/* EWL.Canvas.W — small accessible widgets shared by every canvas stage.
 *
 *   W.msg(kind, text)             a status message (ok | warn | bad), never colour alone (see ewl.css ::before marks)
 *   W.radios(name, legend, opts)  one-of-many choice; {el, value(), lock(), onPick(fn)}
 *   W.ask(cfg)                    the attempt loop used by Predict, Generalize and Transfer:
 *                                 check -> a question first, then a picture, then a counterexample;
 *                                 "Show checked result" appears only after 2 attempts and is never worked out for them.
 */
(function (root) {
  "use strict";
  const EWL = (root.EWL = root.EWL || {});
  const C = (EWL.Canvas = EWL.Canvas || {});
  const W = (C.W = C.W || {});

  W.msg = (kind, text) => EWL.h("div", { class: "ewl-msg cv-msg", "data-kind": kind }, text);

  W.radios = (name, legend, opts) => {
    let picked = null;
    let fn = null;
    const inputs = [];
    const rows = opts.map((o, i) => {
      const input = EWL.h("input", { type: "radio", name, value: o.value, id: `${name}-${i}` });
      input.addEventListener("change", () => {
        picked = o.value;
        if (fn) fn(picked);
      });
      inputs.push(input);
      return EWL.h(
        "label",
        { class: "cv-radio", for: `${name}-${i}` },
        input,
        EWL.h("span", null, o.label),
      );
    });
    const el = EWL.h("fieldset", { class: "cv-fieldset" }, EWL.h("legend", null, legend), rows);
    return {
      el,
      value: () => picked,
      lock: () => inputs.forEach((i) => i.setAttribute("disabled", "")),
      onPick: (f) => {
        fn = f;
      },
    };
  };

  /**
   * cfg: { input: "rat" | "radios", placeholder?, options? ([{value,label}]), legend?, label?,
   *        evaluate(raw) -> {state: "ok"|"wrong"|"unreadable", rule?},
   *        help(step, raw, result) -> text for step 0 (question), 1 (picture), 2 (counterexample),
   *        reveal() -> text, okText, unreadableText, continueLabel,
   *        onStep(step), onAttempt({raw, result, attempts}), onSolved(), onRevealed(), onContinue() }
   */
  W.ask = (cfg) => {
    const h = EWL.h;
    const t = EWL.t;
    let attempts = 0;
    let finished = false;
    const fb = h("div", { class: "cv-fb", role: "status", "aria-live": "polite" });
    const check = h(
      "button",
      { type: "button", class: "ewl-btn", "data-primary": "" },
      t("Check", "Comprobar"),
    );
    const reveal = h(
      "button",
      { type: "button", class: "ewl-btn", hidden: true },
      t("Show checked result", "Mostrar resultado verificado"),
    );
    const next = h(
      "button",
      { type: "button", class: "ewl-btn", "data-primary": "", hidden: true },
      cfg.continueLabel,
    );
    let input;
    let radios = null;
    if (cfg.input === "radios") {
      radios = W.radios(`ask-${Math.random().toString(36).slice(2, 8)}`, cfg.legend, cfg.options);
      input = radios.el;
    } else {
      const id = `ask-${Math.random().toString(36).slice(2, 8)}`;
      const field = h("input", {
        type: "text",
        id,
        class: "cv-input",
        autocomplete: "off",
        autocapitalize: "off",
        spellcheck: "false",
        placeholder: cfg.placeholder || "",
        "aria-describedby": `${id}-hint`,
      });
      input = h(
        "div",
        { class: "cv-answer" },
        h("label", { for: id }, cfg.label),
        field,
        h(
          "span",
          { id: `${id}-hint`, class: "cv-hint" },
          t(
            "A fraction, a decimal or a percent is fine.",
            "Una fracción, un decimal o un porcentaje está bien.",
          ),
        ),
      );
      input.field = field;
      field.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          run();
        }
      });
    }
    const raw = () => (radios ? radios.value() : input.field.value.trim());
    const say = (kind, text) => {
      EWL.clear(fb);
      fb.appendChild(W.msg(kind, text));
    };
    const lock = () => {
      finished = true;
      check.setAttribute("disabled", "");
      reveal.hidden = true;
      next.hidden = false;
      if (radios) radios.lock();
      else input.field.setAttribute("disabled", "");
    };
    function run() {
      if (finished) return;
      const value = raw();
      if (!value) {
        say("warn", radios ? t("Pick one first.", "Elige una primero.") : cfg.unreadableText);
        return;
      }
      const result = cfg.evaluate(value);
      if (result.state === "unreadable") {
        say("warn", cfg.unreadableText);
        return;
      }
      attempts += 1;
      if (cfg.onAttempt) cfg.onAttempt({ raw: value, result, attempts });
      if (result.state === "ok") {
        say("ok", cfg.okText);
        lock();
        if (cfg.onSolved) cfg.onSolved();
        return;
      }
      const step = Math.min(attempts - 1, 2);
      say("warn", cfg.help(step, value, result));
      if (cfg.onStep) cfg.onStep(step);
      if (attempts >= 2) reveal.hidden = false;
    }
    check.addEventListener("click", run);
    reveal.addEventListener("click", () => {
      say("warn", `${t("Checked result:", "Resultado verificado:")} ${cfg.reveal()}`);
      lock();
      if (cfg.onRevealed) cfg.onRevealed();
    });
    next.addEventListener("click", () => cfg.onContinue());
    const el = h(
      "div",
      { class: "cv-ask" },
      input,
      h("div", { class: "ewl-row cv-actions" }, check, reveal),
      fb,
      h("div", { class: "ewl-row cv-actions" }, next),
    );
    return { el, attempts: () => attempts, finished: () => finished };
  };
})(typeof window !== "undefined" ? window : globalThis);
